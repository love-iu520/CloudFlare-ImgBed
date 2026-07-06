import { getDatabase } from '../../../utils/databaseAdapter.js';
import {
    canShareAccessMetadata,
    createShareLink,
    listShareLinks,
    normalizeShareTarget,
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
    const target = normalizeShareTarget(body.targetType, body.targetPath);

    await assertShareTargetAllowed(env, target);

    const result = await createShareLink(env, {
        targetType: target.targetType,
        targetPath: target.targetPath,
        expiresAt: body.expiresAt,
        expiresInSeconds: body.expiresInSeconds,
    });
    const url = new URL(request.url);

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
    const result = await listShareLinks(env, { includeRevoked, limit, cursor });

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

async function assertShareTargetAllowed(env, target) {
    if (target.targetType === 'directory') {
        return;
    }

    const db = getDatabase(env);
    const record = await db.getWithMetadata(target.targetPath);
    if (!record || !record.metadata) {
        throw httpError(404, 'Target file not found');
    }

    if (!canShareAccessMetadata(record.metadata)) {
        throw httpError(400, 'Target file cannot be shared');
    }
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
