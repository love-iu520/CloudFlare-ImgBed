import { addFileToIndex } from '../../../utils/indexManager.js';
import { getDatabase } from '../../../utils/databaseAdapter.js';
import { cleanPersistedMetadata } from '../../../utils/metadata/metadataSecurity.js';
import { withFileMutationLock } from '../../../utils/fileMutationLock.js';
import {
  purgeCFCache,
  purgePublicFileListCache,
  purgeRandomFileListCache,
} from '../../../utils/purgeCache.js';
import {
  TEXT_CONTENT_MAX_BYTES,
  TextContentError,
  analyzeTextBytes,
  buildContentEtag,
  computeContentRevision,
  createTextStorageAdapter,
  encodeTextContent,
  ifMatchIncludes,
  readRequestBytes,
  validateEditableTextRecord,
  validateJsonText,
} from '../../../utils/textContent.js';

const RESPONSE_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Expose-Headers': 'ETag, X-Content-BOM, X-Content-EOL, X-Content-Size',
  'Cache-Control': 'private, no-store, max-age=0',
};

export async function onRequest(context) {
  const { request } = context;
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: RESPONSE_HEADERS });
  if (!['GET', 'PUT'].includes(request.method)) {
    return jsonResponse(405, 'METHOD_NOT_ALLOWED', 'Use GET or PUT.');
  }

  try {
    const fileId = decodeFileId(context.params?.path);
    return await withFileMutationLock(fileId, async () => {
      const db = getDatabase(context.env);
      const record = await db.getWithMetadata(fileId);
      if (!record?.metadata) {
        throw new TextContentError(404, 'FILE_NOT_FOUND', 'File not found.');
      }

      const textType = validateEditableTextRecord(fileId, record.metadata);
      const storage = await createTextStorageAdapter({
        env: context.env,
        db,
        fileId,
        metadata: record.metadata,
      }, context.data?.textContentDependencies || {});
      const currentBytes = await storage.read();
      const currentContent = analyzeTextBytes(currentBytes);
      const currentRevision = await computeContentRevision(currentBytes);
      const currentEtag = buildContentEtag(currentRevision);

      if (request.method === 'GET') {
        return textResponse(currentContent, currentEtag, record.metadata.FileType);
      }

      const ifMatch = request.headers.get('If-Match');
      if (!ifMatch) {
        throw new TextContentError(428, 'REVISION_REQUIRED', 'If-Match is required when saving file content.');
      }
      if (!ifMatchIncludes(ifMatch, currentEtag)) {
        throw new TextContentError(412, 'REVISION_CONFLICT', 'The file changed after it was opened.');
      }

      const submittedBytes = await readRequestBytes(request);
      const submittedContent = analyzeTextBytes(submittedBytes);
      const requestedEol = parseEolHeader(request.headers.get('X-Content-EOL'), currentContent.eol);
      const requestedBom = parseBomHeader(request.headers.get('X-Content-BOM'), currentContent.hasBom);
      validateJsonText(submittedContent.text, textType);
      const nextBytes = encodeTextContent(submittedContent.text, {
        eol: requestedEol,
        hasBom: requestedBom,
      });
      const nextRevision = await computeContentRevision(nextBytes);
      const nextEtag = buildContentEtag(nextRevision);

      if (nextRevision === currentRevision) {
        return jsonResponse(200, null, null, {
          success: true,
          unchanged: true,
          revision: currentRevision,
          metadata: safeResponseMetadata(record.metadata),
        }, { ETag: currentEtag });
      }

      const now = Date.now();
      const nextContent = analyzeTextBytes(nextBytes);
      const nextMetadata = cleanPersistedMetadata({
        ...record.metadata,
        FileSize: (nextBytes.byteLength / 1024 / 1024).toFixed(2),
        FileSizeBytes: nextBytes.byteLength,
        ContentRevision: nextRevision,
        ContentUpdatedAt: now,
        ContentEncoding: 'utf-8',
        ContentBOM: nextContent.hasBom,
        ContentEOL: nextContent.eol,
      });

      const saveResult = await persistContentChange({
        context,
        db,
        storage,
        fileId,
        record,
        nextBytes,
        nextMetadata,
      });
      await purgeContentCaches(context, fileId, saveResult.metadata);

      return jsonResponse(200, null, null, {
        success: true,
        unchanged: false,
        revision: nextRevision,
        metadata: safeResponseMetadata(saveResult.metadata),
        ...(saveResult.warning ? { warning: saveResult.warning } : {}),
      }, { ETag: nextEtag });
    });
  } catch (error) {
    if (error instanceof TextContentError) {
      return jsonResponse(error.status, error.code, error.message);
    }
    console.error('Managed text content request failed:', error?.message || error);
    return jsonResponse(500, 'CONTENT_REQUEST_FAILED', 'File content could not be updated.');
  }
}

async function persistContentChange({ context, db, storage, fileId, record, nextBytes, nextMetadata }) {
  let mutation = null;
  let databaseWritten = false;
  let persistedMetadata = nextMetadata;

  try {
    mutation = await storage.write(nextBytes);
    persistedMetadata = applyStorageMutationMetadata(nextMetadata, mutation);
    await db.put(fileId, record.value ?? '', { metadata: persistedMetadata });
    databaseWritten = true;

    const verifiedRecord = await db.getWithMetadata(fileId);
    if (verifiedRecord?.metadata?.ContentRevision !== persistedMetadata.ContentRevision) {
      throw new TextContentError(409, 'CONTENT_METADATA_CONFLICT', 'File metadata changed while the content was being saved.');
    }
    const verifiedBytes = await storage.read();
    const verifiedRevision = await computeContentRevision(verifiedBytes);
    if (verifiedRevision !== persistedMetadata.ContentRevision) {
      throw new TextContentError(409, 'CONTENT_STORAGE_CONFLICT', 'Stored content changed while the file was being saved.');
    }

    const indexResult = await addFileToIndex(context, fileId, persistedMetadata);
    if (!indexResult?.success) throw new Error(indexResult?.error || 'File index update failed');

    let warning = null;
    if (typeof mutation?.finalize === 'function') {
      try {
        await mutation.finalize();
      } catch (cleanupError) {
        warning = 'OLD_TELEGRAM_MESSAGE_NOT_DELETED';
        console.warn('Old Telegram message cleanup failed:', cleanupError?.message || cleanupError);
      }
    }
    return { metadata: persistedMetadata, warning };
  } catch (error) {
    const rollbackErrors = [];
    let databaseRestored = !databaseWritten;
    if (databaseWritten) {
      try {
        await db.put(fileId, record.value ?? '', { metadata: record.metadata });
        databaseRestored = true;
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError);
      }
    }
    if (databaseRestored && typeof mutation?.rollback === 'function') {
      try {
        await mutation.rollback();
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError);
      }
    }

    if (rollbackErrors.length > 0) {
      console.error('Managed text content rollback failed:', rollbackErrors.map(item => item?.message || String(item)).join('; '));
      throw new TextContentError(500, 'CONTENT_ROLLBACK_FAILED', 'Saving failed and the previous content could not be fully restored.');
    }
    throw new TextContentError(500, 'CONTENT_SAVE_FAILED', 'File content could not be saved.', { cause: error });
  }
}

function applyStorageMutationMetadata(metadata, mutation) {
  const merged = { ...metadata, ...(mutation?.metadataPatch || {}) };
  for (const field of mutation?.metadataRemove || []) delete merged[field];
  return cleanPersistedMetadata(merged);
}

async function purgeContentCaches(context, fileId, metadata) {
  const url = new URL(context.request.url);
  const directory = metadata.Directory || fileId.split('/').slice(0, -1).join('/');
  const cdnUrl = `${url.origin}/file/${fileId}`;
  await Promise.all([
    purgeCFCache(context.env, cdnUrl),
    purgeFileCache(cdnUrl),
    purgeRandomFileListCache(url.origin, directory),
    purgePublicFileListCache(url.origin, directory),
  ]);
}

async function purgeFileCache(cdnUrl) {
  try {
    const cache = globalThis.caches?.default;
    if (!cache) return;
    let deleted = false;
    if (typeof cache.delete === 'function') {
      deleted = await cache.delete(new Request(cdnUrl, { method: 'GET' })).catch(() => false);
    }
    if (!deleted && typeof cache.put === 'function') {
      await cache.put(new Request(cdnUrl, { method: 'GET' }), new Response(null, {
        headers: { 'Cache-Control': 'max-age=0' },
      }));
    }
  } catch (error) {
    console.warn('Failed to clear file cache:', error?.message || error);
  }
}

function textResponse(content, etag, fileType = '') {
  const headers = new Headers(RESPONSE_HEADERS);
  headers.set('Content-Type', normalizeTextContentType(fileType));
  headers.set('ETag', etag);
  headers.set('X-Content-BOM', content.hasBom ? '1' : '0');
  headers.set('X-Content-EOL', content.eol);
  headers.set('X-Content-Size', String(content.bytes.byteLength));
  return new Response(content.text, { status: 200, headers });
}

function jsonResponse(status, code, message, extra = {}, extraHeaders = {}) {
  const headers = new Headers({
    ...RESPONSE_HEADERS,
    'Content-Type': 'application/json; charset=utf-8',
    ...extraHeaders,
  });
  return new Response(JSON.stringify({
    success: status >= 200 && status < 300,
    ...(code ? { code } : {}),
    ...(message ? { message } : {}),
    ...extra,
  }), { status, headers });
}

function decodeFileId(path) {
  try {
    const fileId = decodeURIComponent(path || '').split(',').join('/');
    if (!fileId) throw new Error('empty');
    return fileId;
  } catch (error) {
    throw new TextContentError(400, 'INVALID_FILE_ID', 'File ID is invalid.', { cause: error });
  }
}

function parseEolHeader(value, fallback) {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'lf' || normalized === 'crlf') return normalized;
  return fallback === 'crlf' ? 'crlf' : 'lf';
}

function parseBomHeader(value, fallback) {
  if (value === null || value === undefined || value === '') return fallback;
  return ['1', 'true', 'yes'].includes(String(value).trim().toLowerCase());
}

function normalizeTextContentType(fileType) {
  const normalized = String(fileType || '').split(';', 1)[0].trim().toLowerCase();
  if (normalized === 'application/json') return 'application/json; charset=utf-8';
  if (normalized === 'text/markdown') return 'text/markdown; charset=utf-8';
  return 'text/plain; charset=utf-8';
}

function safeResponseMetadata(metadata) {
  return {
    FileName: metadata.FileName,
    FileType: metadata.FileType,
    FileSize: metadata.FileSize,
    FileSizeBytes: metadata.FileSizeBytes,
    TgFileId: metadata.TgFileId,
    TgMessageId: metadata.TgMessageId,
    TgMediaType: metadata.TgMediaType,
    TgFileUniqueId: metadata.TgFileUniqueId ?? null,
    ContentRevision: metadata.ContentRevision,
    ContentUpdatedAt: metadata.ContentUpdatedAt,
    ContentEncoding: metadata.ContentEncoding,
    ContentBOM: metadata.ContentBOM,
    ContentEOL: metadata.ContentEOL,
  };
}

export { TEXT_CONTENT_MAX_BYTES };
