import { resolveTelegramCredentials } from './metadata/channelCredentials.js';
import { TelegramAPI } from './storage/telegramAPI.js';
import {
  getEditableTextType,
  isEditableTextChannel,
  isEditableTextMimeType,
} from './textContentPolicy.js';

export const TEXT_CONTENT_MAX_BYTES = 1024 * 1024;

const UTF8_BOM = new Uint8Array([0xef, 0xbb, 0xbf]);

export class TextContentError extends Error {
  constructor(status, code, message, options = {}) {
    super(message, options);
    this.name = 'TextContentError';
    this.status = status;
    this.code = code;
  }
}

export function validateEditableTextRecord(fileId, metadata = {}) {
  const textType = getEditableTextType(fileId, metadata);
  if (!textType) {
    throw new TextContentError(415, 'UNSUPPORTED_TEXT_TYPE', 'This file type cannot be edited online.');
  }
  if (metadata.IsChunked === true) {
    throw new TextContentError(422, 'UNSUPPORTED_STORAGE', 'Chunked files cannot be edited online.');
  }
  if (!isEditableTextChannel(metadata.Channel)) {
    throw new TextContentError(422, 'UNSUPPORTED_STORAGE', 'This storage channel cannot safely replace file content.');
  }
  if (!isEditableTextMimeType(metadata.FileType)) {
    throw new TextContentError(415, 'UNSUPPORTED_TEXT_TYPE', 'This file type cannot be edited online.');
  }
  return textType;
}

export function analyzeTextBytes(inputBytes, maxBytes = TEXT_CONTENT_MAX_BYTES) {
  const bytes = toUint8Array(inputBytes);
  if (bytes.byteLength > maxBytes) {
    throw new TextContentError(413, 'CONTENT_TOO_LARGE', 'Text content exceeds the online editing limit.');
  }

  const hasBom = startsWithUtf8Bom(bytes);
  const contentBytes = hasBom ? bytes.subarray(UTF8_BOM.byteLength) : bytes;
  if (looksBinary(contentBytes)) {
    throw new TextContentError(415, 'BINARY_CONTENT', 'File content does not appear to be plain text.');
  }

  let text;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(contentBytes);
  } catch (error) {
    throw new TextContentError(415, 'INVALID_UTF8', 'Only valid UTF-8 text can be edited online.', { cause: error });
  }

  return {
    bytes,
    text,
    hasBom,
    eol: detectLineEnding(text),
  };
}

export function encodeTextContent(text, options = {}) {
  const eol = ['lf', 'crlf', 'mixed', 'none'].includes(options.eol) ? options.eol : 'lf';
  const normalizedText = normalizeLineEndings(String(text ?? ''), eol);
  const contentBytes = new TextEncoder().encode(normalizedText);
  const bytes = options.hasBom ? concatBytes(UTF8_BOM, contentBytes) : contentBytes;

  if (bytes.byteLength > (options.maxBytes || TEXT_CONTENT_MAX_BYTES)) {
    throw new TextContentError(413, 'CONTENT_TOO_LARGE', 'Text content exceeds the online editing limit.');
  }
  return bytes;
}

export function validateJsonText(text, textType) {
  if (textType !== 'json') return;
  try {
    JSON.parse(text);
  } catch (error) {
    throw new TextContentError(422, 'INVALID_JSON', 'JSON content is not valid.', { cause: error });
  }
}

export async function computeContentRevision(bytes) {
  const digest = await crypto.subtle.digest('SHA-256', toUint8Array(bytes));
  return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
}

export function buildContentEtag(revision) {
  return `"${revision}"`;
}

export function ifMatchIncludes(ifMatch, etag) {
  if (!ifMatch || !etag) return false;
  const normalizeEtag = value => String(value).trim().replace(/^W\/(?=")/, '');
  const expectedEtag = normalizeEtag(etag);
  return String(ifMatch)
    .split(',')
    .some(value => normalizeEtag(value) === expectedEtag);
}

export async function readRequestBytes(request, maxBytes = TEXT_CONTENT_MAX_BYTES) {
  const declaredLength = Number(request.headers.get('Content-Length'));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new TextContentError(413, 'CONTENT_TOO_LARGE', 'Text content exceeds the online editing limit.');
  }
  return collectBytes(request.body, maxBytes);
}

export async function createTextStorageAdapter({ env, db, fileId, metadata }, dependencies = {}) {
  const channel = metadata.Channel;
  if (channel !== 'TelegramNew') {
    throw new TextContentError(422, 'UNSUPPORTED_STORAGE', 'This storage channel cannot replace file content online.');
  }

  const credentials = await resolveTelegramCredentials(db, env, metadata);
  requireStorageFields(channel, credentials, ['botToken', 'chatId', 'fileId']);
  const telegramFactory = dependencies.telegramFactory
    || ((botToken, proxyUrl) => new TelegramAPI(botToken, proxyUrl));
  const client = telegramFactory(credentials.botToken, credentials.proxyUrl || '');
  const contentType = metadata.FileType || defaultContentType(getEditableTextType(fileId, metadata));
  const fileName = metadata.FileName || fileId.split('/').pop() || 'document.txt';
  let activeFileId = credentials.fileId;

  return {
    channel,
    async read() {
      const response = await client.getFileContent(activeFileId);
      if (!response?.ok) throw remoteReadFailed(channel, response?.status || 502);
      return collectBytes(response.body || response, TEXT_CONTENT_MAX_BYTES);
    },
    async write(bytes) {
      const body = new Blob([toUint8Array(bytes)], { type: contentType });
      const response = await client.sendFile(
        body,
        credentials.chatId,
        'sendDocument',
        'document',
        '',
        fileName,
      );
      const fileInfo = client.getFileInfo(response);
      if (!fileInfo?.file_id || fileInfo?.message_id === undefined || fileInfo?.message_id === null) {
        const messageId = response?.result?.message_id;
        if (messageId !== undefined && messageId !== null) {
          await client.deleteMessage(credentials.chatId, messageId).catch(() => {});
        }
        throw remoteWriteFailed(channel);
      }

      activeFileId = fileInfo.file_id;
      const fileSizeBytes = Number.isFinite(Number(fileInfo.file_size))
        ? Number(fileInfo.file_size)
        : body.size;
      let rolledBack = false;
      let finalized = false;

      return {
        metadataPatch: {
          TgFileId: fileInfo.file_id,
          TgMessageId: fileInfo.message_id,
          TgMediaType: 'document',
          FileSize: (fileSizeBytes / 1024 / 1024).toFixed(2),
          FileSizeBytes: fileSizeBytes,
        },
        metadataRemove: ['TgFileUniqueId'],
        async rollback() {
          if (rolledBack) return;
          rolledBack = true;
          await client.deleteMessage(credentials.chatId, fileInfo.message_id);
        },
        async finalize() {
          if (finalized || !metadata.TgMessageId || metadata.TgMessageId === fileInfo.message_id) return;
          finalized = true;
          await client.deleteMessage(credentials.chatId, metadata.TgMessageId);
        },
      };
    },
  };
}

export async function collectBytes(source, maxBytes = TEXT_CONTENT_MAX_BYTES) {
  if (source === null || source === undefined) return new Uint8Array();
  if (source instanceof Uint8Array) return enforceByteLimit(source, maxBytes);
  if (source instanceof ArrayBuffer) return enforceByteLimit(new Uint8Array(source), maxBytes);
  if (ArrayBuffer.isView(source)) {
    return enforceByteLimit(new Uint8Array(source.buffer, source.byteOffset, source.byteLength), maxBytes);
  }
  if (typeof source.transformToByteArray === 'function') {
    return enforceByteLimit(toUint8Array(await source.transformToByteArray()), maxBytes);
  }
  if (typeof source.arrayBuffer === 'function' && !source.getReader) {
    return enforceByteLimit(new Uint8Array(await source.arrayBuffer()), maxBytes);
  }

  if (typeof source.getReader === 'function') {
    const reader = source.getReader();
    const chunks = [];
    let total = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (!value) continue;
        const chunk = toUint8Array(value);
        total += chunk.byteLength;
        if (total > maxBytes) {
          await reader.cancel().catch(() => {});
          throw contentTooLarge();
        }
        chunks.push(chunk);
      }
    } finally {
      reader.releaseLock?.();
    }
    return joinChunks(chunks, total);
  }

  if (source && typeof source[Symbol.asyncIterator] === 'function') {
    const chunks = [];
    let total = 0;
    for await (const value of source) {
      const chunk = toUint8Array(value);
      total += chunk.byteLength;
      if (total > maxBytes) throw contentTooLarge();
      chunks.push(chunk);
    }
    return joinChunks(chunks, total);
  }

  throw new TextContentError(502, 'REMOTE_READ_FAILED', 'Stored file content could not be read.');
}

function defaultContentType(textType) {
  if (textType === 'json') return 'application/json; charset=utf-8';
  if (textType === 'markdown') return 'text/markdown; charset=utf-8';
  return 'text/plain; charset=utf-8';
}

function requireStorageFields(channel, credentials, fields) {
  if (credentials?.source === 'missing' || fields.some(field => !credentials?.[field])) {
    throw storageConfigurationError(channel);
  }
}

function storageConfigurationError(channel) {
  return new TextContentError(502, 'STORAGE_CONFIGURATION_MISSING', `${channel} storage configuration is unavailable.`);
}

function remoteReadFailed(channel, status) {
  return new TextContentError(502, 'REMOTE_READ_FAILED', `${channel} file content could not be read (${status}).`);
}

function remoteWriteFailed(channel) {
  return new TextContentError(502, 'REMOTE_WRITE_FAILED', `${channel} file content could not be written.`);
}

function contentTooLarge() {
  return new TextContentError(413, 'CONTENT_TOO_LARGE', 'Text content exceeds the online editing limit.');
}

function enforceByteLimit(bytes, maxBytes) {
  if (bytes.byteLength > maxBytes) throw contentTooLarge();
  return new Uint8Array(bytes);
}

function startsWithUtf8Bom(bytes) {
  return bytes.byteLength >= UTF8_BOM.byteLength
    && UTF8_BOM.every((value, index) => bytes[index] === value);
}

function looksBinary(bytes) {
  if (!bytes.byteLength) return false;
  let suspicious = 0;
  for (const byte of bytes) {
    if (byte === 0) return true;
    if (byte < 9 || (byte > 13 && byte < 32)) suspicious += 1;
  }
  return suspicious / bytes.byteLength > 0.02;
}

function detectLineEnding(text) {
  const crlfCount = (text.match(/\r\n/g) || []).length;
  const withoutCrlf = text.replace(/\r\n/g, '');
  const lfCount = (withoutCrlf.match(/\n/g) || []).length;
  const crCount = (withoutCrlf.match(/\r/g) || []).length;
  if (crlfCount && !lfCount && !crCount) return 'crlf';
  if (!crlfCount && (lfCount || crCount)) return 'lf';
  if (crlfCount || lfCount || crCount) return 'mixed';
  return 'none';
}

function normalizeLineEndings(text, eol) {
  const lfText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  return eol === 'crlf' ? lfText.replace(/\n/g, '\r\n') : lfText;
}

function concatBytes(first, second) {
  const bytes = new Uint8Array(first.byteLength + second.byteLength);
  bytes.set(first, 0);
  bytes.set(second, first.byteLength);
  return bytes;
}

function joinChunks(chunks, total) {
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

function toUint8Array(value) {
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (ArrayBuffer.isView(value)) return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  if (typeof value === 'string') return new TextEncoder().encode(value);
  return new Uint8Array(value || []);
}
