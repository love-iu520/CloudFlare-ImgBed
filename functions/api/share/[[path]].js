import { getDatabase } from '../../utils/databaseAdapter.js';
import { readIndex, isFolderPlaceholder } from '../../utils/indexManager.js';
import {
    canShareAccessMetadata,
    encodeFileIdForUrl,
    getShareAvailability,
    getShareByToken,
    getShareItemsOrLegacy,
    incrementShareView,
    isPathWithinShare,
    isPathWithinShareItem,
    normalizeDirectoryPath,
    normalizeFilePath,
} from '../../utils/share/shareLinks.js';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
};

export async function onRequest(context) {
    const { request, env, params } = context;

    if (request.method === 'OPTIONS') {
        return jsonResponse(null, { status: 204 });
    }

    if (request.method !== 'GET') {
        return jsonResponse({ success: false, message: 'Method not allowed' }, { status: 405 });
    }

    const token = getTokenFromParams(params);
    if (!token) {
        return jsonResponse({ success: false, message: 'Share token is required' }, { status: 400 });
    }

    const share = await getShareByToken(env, token);
    const availability = getShareAvailability(share);
    if (!availability.valid) {
        return jsonResponse({
            success: false,
            reason: availability.reason,
            message: shareFailureMessage(availability.reason),
        }, { status: shareFailureStatus(availability.reason) });
    }

    const items = getShareItemsOrLegacy(share);
    if (items.length > 1) {
        return await collectionShareResponse(context, share, items, token);
    }

    const singleItem = items[0] || {
        itemType: share.targetType,
        itemPath: share.targetPath,
    };
    const singleShare = {
        ...share,
        targetType: singleItem.itemType,
        targetPath: singleItem.itemPath,
        items: [singleItem],
    };

    if (singleShare.targetType === 'file') {
        return await fileShareResponse(env, singleShare, token);
    }

    return await directoryShareResponse(context, singleShare, token);
}

async function fileShareResponse(env, share, token) {
    const db = getDatabase(env);
    const record = await db.getWithMetadata(share.targetPath);
    if (!record || !record.metadata) {
        return jsonResponse({ success: false, message: 'Shared file not found' }, { status: 404 });
    }

    if (!canShareAccessMetadata(record.metadata)) {
        return jsonResponse({ success: false, message: 'Shared file is not accessible' }, { status: 403 });
    }

    await incrementShareView(env, share.id);

    return jsonResponse({
        success: true,
        share: serializePublicShare(share),
        file: serializePublicFile(share.targetPath, record.metadata, token),
    });
}

async function collectionShareResponse(context, share, items, token) {
    const { request, env } = context;
    const url = new URL(request.url);
    const itemId = url.searchParams.get('item') || '';
    const directoryItem = itemId
        ? items.find(item => item.id === itemId && item.itemType === 'directory')
        : null;

    if (itemId && !directoryItem) {
        return jsonResponse({ success: false, message: 'Share item not found' }, { status: 404 });
    }

    if (directoryItem) {
        return await collectionDirectoryShareResponse(context, share, directoryItem, token);
    }

    const db = getDatabase(env);
    const files = [];
    const directories = [];

    for (const item of items) {
        if (item.itemType === 'directory') {
            directories.push(serializePublicDirectoryItem(item));
            continue;
        }

        const record = await db.getWithMetadata(item.itemPath);
        if (!record || !record.metadata || !canShareAccessMetadata(record.metadata)) continue;
        files.push(serializePublicFile(item.itemPath, record.metadata, token));
    }

    await incrementShareView(env, share.id);

    return jsonResponse({
        success: true,
        share: serializePublicShare(share, items),
        shareType: 'collection',
        items: items.map(serializePublicShareItem),
        files,
        directories,
        totalCount: files.length + directories.length,
        returnedCount: files.length,
    });
}

async function collectionDirectoryShareResponse(context, share, item, token) {
    const { request, env } = context;
    const url = new URL(request.url);
    const relativeDir = normalizeDirectoryPath(url.searchParams.get('dir') || '');
    const requestedDir = normalizeDirectoryPath(`${item.itemPath}${relativeDir}`);

    if (!isDirectoryWithinShareItem(item, requestedDir)) {
        return jsonResponse({ success: false, message: 'Directory is outside this share item' }, { status: 403 });
    }

    const start = parseInt(url.searchParams.get('start'), 10) || 0;
    const count = Math.min(Math.max(parseInt(url.searchParams.get('count'), 10) || 100, 1), 500);
    let result = await readIndex(context, {
        directory: requestedDir,
        start,
        count,
        includeSubdirFiles: false,
        accessStatus: 'normal',
    });

    if (!result.success) {
        result = await listDirectoryFromDatabase(env, requestedDir, start, count);
    }

    const files = (result.files || [])
        .filter(file => canShareAccessMetadata(file.metadata))
        .filter(file => isPathWithinShareItem(item, file.id || file.name))
        .filter(file => !isFolderPlaceholder(file.id || file.name, file.metadata))
        .map(file => serializePublicFile(file.id || file.name, file.metadata || {}, token));

    await incrementShareView(env, share.id);

    return jsonResponse({
        success: true,
        share: serializePublicShare(share, getShareItemsOrLegacy(share)),
        shareType: 'collection',
        item: serializePublicShareItem(item),
        directory: {
            path: requestedDir,
            relativePath: relativeDir,
            itemId: item.id,
        },
        files,
        directories: normalizeDirectoryListForItem(item, result.directories || []),
        totalCount: result.totalCount || files.length,
        returnedCount: files.length,
    });
}

async function directoryShareResponse(context, share, token) {
    const { request, env } = context;
    const url = new URL(request.url);
    const relativeDir = normalizeDirectoryPath(url.searchParams.get('dir') || '');
    const requestedDir = normalizeDirectoryPath(`${share.targetPath}${relativeDir}`);

    if (!isDirectoryWithinShare(share, requestedDir)) {
        return jsonResponse({ success: false, message: 'Directory is outside this share' }, { status: 403 });
    }

    const start = parseInt(url.searchParams.get('start'), 10) || 0;
    const count = Math.min(Math.max(parseInt(url.searchParams.get('count'), 10) || 100, 1), 500);
    let result = await readIndex(context, {
        directory: requestedDir,
        start,
        count,
        includeSubdirFiles: false,
        accessStatus: 'normal',
    });

    if (!result.success) {
        result = await listDirectoryFromDatabase(env, requestedDir, start, count);
    }

    const files = (result.files || [])
        .filter(file => canShareAccessMetadata(file.metadata))
        .filter(file => isPathWithinShare(share, file.id || file.name))
        .filter(file => !isFolderPlaceholder(file.id || file.name, file.metadata))
        .map(file => serializePublicFile(file.id || file.name, file.metadata || {}, token));

    await incrementShareView(env, share.id);

    return jsonResponse({
        success: true,
        share: serializePublicShare(share),
        directory: {
            path: requestedDir,
            relativePath: relativeDir,
        },
        files,
        directories: normalizeDirectoryList(share, result.directories || []),
        totalCount: result.totalCount || files.length,
        returnedCount: files.length,
    });
}

async function listDirectoryFromDatabase(env, directory, start, count) {
    const db = getDatabase(env);
    const files = [];
    const directories = new Set();
    let cursor = undefined;
    let seen = 0;

    while (files.length < count) {
        const result = await db.list({
            prefix: directory,
            limit: 1000,
            cursor,
        });

        for (const item of result.keys || []) {
            if (item.name.startsWith('manage@') || item.name.startsWith('chunk_')) continue;
            if (!item.metadata || !item.metadata.TimeStamp) continue;

            const remainder = item.name.slice(directory.length);
            const slashIndex = remainder.indexOf('/');
            if (slashIndex !== -1) {
                directories.add(`${directory}${remainder.slice(0, slashIndex)}`);
                continue;
            }

            if (seen++ < start) continue;
            files.push({ id: item.name, metadata: item.metadata });
            if (files.length >= count) break;
        }

        cursor = result.cursor;
        if (!cursor || result.list_complete) break;
    }

    return {
        success: true,
        files,
        directories: Array.from(directories),
        totalCount: start + seen,
    };
}

function isDirectoryWithinShare(share, directory) {
    if (share.targetType !== 'directory') return false;
    const base = normalizeDirectoryPath(share.targetPath);
    const requested = normalizeDirectoryPath(directory);
    return base === '' || requested === base || requested.startsWith(base);
}

function isDirectoryWithinShareItem(item, directory) {
    if (!item || item.itemType !== 'directory') return false;
    const base = normalizeDirectoryPath(item.itemPath);
    const requested = normalizeDirectoryPath(directory);
    return base === '' || requested === base || requested.startsWith(base);
}

function normalizeDirectoryList(share, directories) {
    const base = normalizeDirectoryPath(share.targetPath);
    return directories
        .map(directory => normalizeDirectoryPath(directory))
        .filter(directory => isDirectoryWithinShare(share, directory))
        .map(directory => ({
            name: directory.replace(/\/$/g, '').split('/').pop() || '',
            path: directory,
            relativePath: base && directory.startsWith(base) ? directory.slice(base.length) : directory,
        }));
}

function normalizeDirectoryListForItem(item, directories) {
    const base = normalizeDirectoryPath(item.itemPath);
    return directories
        .map(directory => normalizeDirectoryPath(directory))
        .filter(directory => isDirectoryWithinShareItem(item, directory))
        .map(directory => ({
            name: directory.replace(/\/$/g, '').split('/').pop() || '',
            path: directory,
            relativePath: base && directory.startsWith(base) ? directory.slice(base.length) : directory,
            itemId: item.id,
        }));
}

function serializePublicDirectoryItem(item) {
    const path = normalizeDirectoryPath(item.itemPath);
    return {
        name: path.replace(/\/$/g, '').split('/').pop() || '/',
        path,
        relativePath: '',
        itemId: item.id,
    };
}

function serializePublicShare(share, items = getShareItemsOrLegacy(share)) {
    return {
        id: share.id,
        targetType: share.targetType,
        targetPath: share.targetPath,
        shareType: items.length > 1 ? 'collection' : share.targetType,
        expiresAt: share.expiresAt ?? null,
        createdAt: share.createdAt,
        items: items.map(serializePublicShareItem),
    };
}

function serializePublicShareItem(item) {
    return {
        id: item.id,
        itemType: item.itemType,
        itemPath: item.itemPath,
        sortOrder: item.sortOrder || 0,
    };
}

function serializePublicFile(fileId, metadata, token) {
    const normalizedFileId = normalizeFilePath(fileId);
    return {
        name: normalizedFileId,
        url: `/file/${encodeFileIdForUrl(normalizedFileId)}?shareToken=${encodeURIComponent(token)}`,
        metadata: {
            FileName: metadata?.FileName || normalizedFileId.split('/').pop(),
            FileType: metadata?.FileType,
            FileSize: metadata?.FileSize,
            FileSizeBytes: metadata?.FileSizeBytes,
            TimeStamp: metadata?.TimeStamp,
            Width: metadata?.Width,
            Height: metadata?.Height,
        },
    };
}

function getTokenFromParams(params = {}) {
    const raw = String(params.path || '');
    const token = raw.split('/')[0];
    try {
        return decodeURIComponent(token);
    } catch {
        return token;
    }
}

function shareFailureStatus(reason) {
    if (reason === 'expired' || reason === 'revoked') return 410;
    if (reason === 'not-found') return 404;
    return 403;
}

function shareFailureMessage(reason) {
    if (reason === 'expired') return 'Share link has expired';
    if (reason === 'revoked') return 'Share link has been revoked';
    if (reason === 'not-found') return 'Share link not found';
    return 'Share link is not available';
}

function jsonResponse(body, options = {}) {
    if (body === null) {
        return new Response(null, {
            status: options.status || 204,
            headers: corsHeaders,
        });
    }

    return new Response(JSON.stringify(body), {
        status: options.status || 200,
        headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
            ...options.headers,
        },
    });
}
