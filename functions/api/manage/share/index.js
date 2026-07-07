import { getDatabase } from '../../../utils/databaseAdapter.js';
import {
    canShareAccessMetadata,
    createShareLink,
    listShareLinks,
    normalizeDirectoryPath,
    normalizeFilePath,
    normalizeShareTargets,
    revokeShareLink,
    updateShareExpiry,
} from '../../../utils/share/shareLinks.js';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
};

export async function onRequest(context) {
    const { request, env } = context;

    if (request.method === 'OPTIONS') {
        return jsonResponse(null, { status: 204 });
    }

    try {
        if (request.method === 'POST') {
            return await createShare(context);
        }

        if (request.method === 'GET') {
            return await listShares(request, env);
        }

        if (request.method === 'DELETE') {
            const url = new URL(request.url);
            const id = url.searchParams.get('id');
            return await revokeShare(env, id);
        }

        if (request.method === 'PATCH') {
            const url = new URL(request.url);
            const id = url.searchParams.get('id');
            return await updateShare(request, env, id);
        }

        return jsonResponse({ success: false, message: 'Method not allowed' }, { status: 405 });
    } catch (error) {
        const status = error.status || 500;
        return jsonResponse({
            success: false,
            message: error.message || 'Internal server error',
        }, { status });
    }
}

async function createShare(context) {
    const { request, env } = context;
    const body = await parseJsonBody(request);
    const requestedTargets = normalizeShareTargets(body);
    const url = new URL(request.url);

    const targets = normalizeShareTargets(await resolveShareTargets(env, requestedTargets));

    const result = await createShareLink(env, {
        targetType: targets[0].targetType,
        targetPath: targets[0].targetPath,
        targets,
        expiresAt: body.expiresAt,
        expiresInSeconds: body.expiresInSeconds,
        shareOrigin: url.origin,
    });

    return jsonResponse({
        success: true,
        url: `${url.origin}/share/${encodeURIComponent(result.token)}`,
        share: result.share,
    }, { status: 201 });
}

async function listShares(request, env) {
    const url = new URL(request.url);
    const includeRevoked = url.searchParams.get('includeRevoked') === 'true';
    const limit = parseInt(url.searchParams.get('limit'), 10) || 100;
    const cursor = url.searchParams.get('cursor') || undefined;
    const result = await listShareLinks(env, {
        includeRevoked,
        limit,
        cursor,
        shareOrigin: url.origin,
    });

    return jsonResponse({
        success: true,
        shares: result.shares,
        cursor: result.cursor,
        listComplete: result.listComplete,
    });
}

export async function updateShare(request, env, id) {
    if (!id) {
        return jsonResponse({ success: false, message: 'Share id is required' }, { status: 400 });
    }

    const body = await parseJsonBody(request);
    if (!body || typeof body !== 'object') {
        throw httpError(400, 'Invalid JSON body');
    }
    const options = {};
    if (Object.prototype.hasOwnProperty.call(body, 'expiresAt')) {
        options.expiresAt = body.expiresAt;
    }
    if (Object.prototype.hasOwnProperty.call(body, 'expiresInSeconds')) {
        options.expiresInSeconds = body.expiresInSeconds;
    }
    if (!Object.prototype.hasOwnProperty.call(options, 'expiresAt') &&
        !Object.prototype.hasOwnProperty.call(options, 'expiresInSeconds')) {
        throw httpError(400, 'expiresAt or expiresInSeconds is required');
    }
    const share = await updateShareExpiry(env, id, options);
    if (!share) {
        return jsonResponse({ success: false, message: 'Share link not found' }, { status: 404 });
    }

    return jsonResponse({
        success: true,
        share,
    });
}

export async function revokeShare(env, id) {
    if (!id) {
        return jsonResponse({ success: false, message: 'Share id is required' }, { status: 400 });
    }

    const share = await revokeShareLink(env, id);
    if (!share) {
        return jsonResponse({ success: false, message: 'Share link not found' }, { status: 404 });
    }

    return jsonResponse({
        success: true,
        share,
    });
}

async function resolveShareTargets(env, targets) {
    const resolved = [];
    for (const target of targets) {
        resolved.push(await assertShareTargetAllowed(env, target));
    }
    return resolved;
}

async function assertShareTargetAllowed(env, target) {
    if (target.targetType === 'directory') {
        return target;
    }

    const db = getDatabase(env);
    const resolved = await resolveShareFileTarget(db, target.targetPath);
    if (!resolved || !resolved.record || !resolved.record.metadata) {
        throw httpError(404, 'Target file not found');
    }

    if (!canShareAccessMetadata(resolved.record.metadata)) {
        throw httpError(400, 'Target file cannot be shared');
    }

    return {
        ...target,
        targetPath: resolved.fileId,
    };
}

async function resolveShareFileTarget(db, targetPath) {
    const normalizedPath = normalizeFilePath(targetPath);
    const exactRecord = await db.getWithMetadata(normalizedPath);
    if (exactRecord && exactRecord.metadata) {
        return {
            fileId: normalizedPath,
            record: exactRecord,
        };
    }

    return await findFileByDisplayedPath(db, normalizedPath);
}

async function findFileByDisplayedPath(db, targetPath) {
    const normalizedPath = normalizeFilePath(targetPath);
    const targetFileName = basename(normalizedPath);
    const targetDirectory = normalizeDirectoryPath(dirname(normalizedPath));
    if (!targetFileName) return null;

    const byDirectory = await findFileByDisplayedPathWithPrefix(db, targetDirectory, targetDirectory, targetFileName);
    if (byDirectory) return byDirectory;

    if (targetDirectory) {
        return await findFileByDisplayedPathWithPrefix(db, '', targetDirectory, targetFileName);
    }

    return null;
}

async function findFileByDisplayedPathWithPrefix(db, prefix, targetDirectory, targetFileName) {
    let cursor = undefined;

    while (true) {
        const result = await db.list({
            prefix,
            limit: 1000,
            cursor,
        });

        for (const item of result.keys || []) {
            if (item.name.startsWith('manage@') || item.name.startsWith('chunk_')) continue;
            if (!item.metadata) continue;

            const itemDirectory = normalizeDirectoryPath(item.metadata.Directory || dirname(item.name));
            const itemFileName = item.metadata.FileName || basename(item.name);
            if (itemDirectory === targetDirectory && itemFileName === targetFileName) {
                return {
                    fileId: item.name,
                    record: {
                        value: item.value,
                        metadata: item.metadata,
                    },
                };
            }
        }

        cursor = result.cursor;
        if (!cursor || result.list_complete) break;
    }

    return null;
}

function dirname(path) {
    const value = normalizeFilePath(path);
    const index = value.lastIndexOf('/');
    return index === -1 ? '' : value.slice(0, index + 1);
}

function basename(path) {
    const value = normalizeFilePath(path);
    const index = value.lastIndexOf('/');
    return index === -1 ? value : value.slice(index + 1);
}

async function parseJsonBody(request) {
    try {
        return await request.json();
    } catch {
        throw httpError(400, 'Invalid JSON body');
    }
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

function httpError(status, message) {
    const error = new Error(message);
    error.status = status;
    return error;
}
