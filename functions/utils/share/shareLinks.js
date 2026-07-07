import { getDatabase } from '../databaseAdapter.js';

const SHARE_TOKEN_BYTES = 32;
const SHARE_ID_PREFIX = 'share_';
const MAX_EXPIRES_IN_SECONDS = 10 * 365 * 24 * 60 * 60;

export function normalizeShareTarget(targetType, targetPath) {
    const normalizedType = String(targetType || '').trim().toLowerCase();
    if (normalizedType !== 'file' && normalizedType !== 'directory') {
        throw new Error('targetType must be file or directory');
    }

    let normalizedPath = String(targetPath || '').trim();
    if (/%[0-9a-fA-F]{2}/.test(normalizedPath)) {
        try {
            normalizedPath = decodeURIComponent(normalizedPath);
        } catch {
            // Keep the original value if it is not valid URI encoding.
        }
    }

    normalizedPath = normalizedPath
        .replace(/\.\./g, '_')
        .replace(/\\/g, '/')
        .replace(/\/{2,}/g, '/')
        .replace(/^\/+/, '')
        .replace(/\/+$/, '');

    if (normalizedType === 'file') {
        if (!normalizedPath) {
            throw new Error('targetPath is required for file shares');
        }
        return {
            targetType: normalizedType,
            targetPath: normalizedPath,
        };
    }

    return {
        targetType: normalizedType,
        targetPath: normalizedPath ? `${normalizedPath}/` : '',
    };
}

export function normalizeShareTargets(targetsOrOptions = {}) {
    const rawTargets = Array.isArray(targetsOrOptions)
        ? targetsOrOptions
        : Array.isArray(targetsOrOptions.targets)
            ? targetsOrOptions.targets
            : [{
                targetType: targetsOrOptions.targetType,
                targetPath: targetsOrOptions.targetPath,
            }];
    const targets = [];
    const seen = new Set();

    for (const rawTarget of rawTargets) {
        const target = normalizeShareTarget(rawTarget?.targetType, rawTarget?.targetPath);
        const key = `${target.targetType}:${target.targetPath}`;
        if (seen.has(key)) continue;
        seen.add(key);
        targets.push(target);
    }

    if (!targets.length) {
        throw new Error('At least one share target is required');
    }

    return targets;
}

export function isPathWithinShare(share, fileId) {
    const normalizedFile = normalizeFilePath(fileId);
    if (!share || !normalizedFile) return false;

    return getShareItemsOrLegacy(share).some(item => isPathWithinShareItem(item, normalizedFile));
}

export function getShareItemsOrLegacy(share) {
    if (!share) return [];
    if (Array.isArray(share.items) && share.items.length > 0) {
        return share.items;
    }

    if (!share.targetType) return [];
    return [{
        id: `${share.id || 'legacy'}:target`,
        shareId: share.id,
        itemType: share.targetType,
        itemPath: share.targetPath,
        sortOrder: 0,
        createdAt: share.createdAt || 0,
    }];
}

export function isPathWithinShareItem(item, fileId) {
    const normalizedFile = normalizeFilePath(fileId);
    if (!item || !normalizedFile) return false;

    if (item.itemType === 'file') {
        return normalizedFile === normalizeFilePath(item.itemPath);
    }

    if (item.itemType === 'directory') {
        const directory = normalizeDirectoryPath(item.itemPath);
        return directory === '' || normalizedFile.startsWith(directory);
    }

    return false;
}

export function canShareAccessMetadata(metadata = {}) {
    if (!metadata || typeof metadata !== 'object') {
        return true;
    }

    if (metadata.ListType === 'Block' || metadata.ListType === 'Trash') {
        return false;
    }

    return metadata.Label !== 'adult';
}

export async function createShareLink(env, options = {}) {
    const db = getDatabase(env);
    const now = normalizeNow(options.now);
    const targets = normalizeShareTargets(options);
    const target = targets[0];
    const token = options.token || generateShareToken();
    const share = {
        id: options.id || generateShareId(now),
        token,
        tokenHash: await hashShareToken(token),
        tokenPrefix: token.slice(0, 8),
        targetType: target.targetType,
        targetPath: target.targetPath,
        expiresAt: normalizeExpiresAt(options, now),
        revokedAt: null,
        createdAt: now,
        updatedAt: now,
        viewCount: 0,
        lastViewedAt: null,
    };
    const items = targets.map((target, index) => ({
        id: `${share.id}_item_${index}_${generateShortRandom(6)}`,
        shareId: share.id,
        itemType: target.targetType,
        itemPath: target.targetPath,
        sortOrder: index,
        createdAt: now,
    }));
    share.items = items;

    await db.putShareLink(share);
    if (typeof db.putShareLinkItems === 'function') {
        await db.putShareLinkItems(share.id, items);
    }

    return {
        token,
        share: serializeShareForManagement(share, {
            origin: options.shareOrigin,
        }),
    };
}

export async function getShareByToken(env, token) {
    if (!token) return null;
    const db = getDatabase(env);
    return await db.getShareLinkByTokenHash(await hashShareToken(token));
}

export async function getShareById(env, id) {
    if (!id) return null;
    const db = getDatabase(env);
    return await db.getShareLinkById(id);
}

export async function listShareLinks(env, options = {}) {
    const db = getDatabase(env);
    const result = await db.listShareLinks(options);
    const shares = Array.isArray(result?.shares) ? result.shares : [];
    return {
        shares: shares.map(share => serializeShareForManagement(share, {
            origin: options.shareOrigin,
        })),
        cursor: result?.cursor || null,
        listComplete: result?.listComplete !== false,
    };
}

export async function revokeShareLink(env, id, now = Date.now()) {
    const db = getDatabase(env);
    const existing = await db.getShareLinkById(id);
    if (!existing) {
        return null;
    }

    const revokedAt = existing.revokedAt || normalizeNow(now);
    await db.revokeShareLink(id, revokedAt);
    return {
        ...serializeShareForManagement(existing),
        revokedAt,
        updatedAt: revokedAt,
    };
}

export async function updateShareExpiry(env, id, options = {}, now = Date.now()) {
    if (!Object.prototype.hasOwnProperty.call(options, 'expiresAt') &&
        !Object.prototype.hasOwnProperty.call(options, 'expiresInSeconds')) {
        throw new Error('expiresAt or expiresInSeconds is required');
    }

    const db = getDatabase(env);
    const existing = await db.getShareLinkById(id);
    if (!existing) {
        return null;
    }

    const updatedAt = normalizeNow(now);
    const updated = {
        ...existing,
        expiresAt: normalizeExpiresAt(options, updatedAt),
        updatedAt,
    };
    await db.putShareLink(updated);
    return serializeShareForManagement(updated, {
        origin: options.shareOrigin,
    });
}

export async function incrementShareView(env, id, now = Date.now()) {
    if (!id) return;
    const db = getDatabase(env);
    await db.incrementShareView(id, normalizeNow(now));
}

export function getShareAvailability(share, now = Date.now()) {
    if (!share) {
        return { valid: false, reason: 'not-found' };
    }

    if (share.revokedAt) {
        return { valid: false, reason: 'revoked' };
    }

    if (share.expiresAt && normalizeNow(now) > share.expiresAt) {
        return { valid: false, reason: 'expired' };
    }

    return { valid: true, reason: 'active' };
}

export async function validateShareTokenForFile(env, token, fileId, metadata = {}, options = {}) {
    if (!token) {
        return { valid: false, reason: 'missing-token' };
    }

    const share = await getShareByToken(env, token);
    const availability = getShareAvailability(share, options.now || Date.now());
    if (!availability.valid) {
        return availability;
    }

    if (!isPathWithinShare(share, fileId)) {
        return { valid: false, reason: 'outside-scope', share };
    }

    if (!canShareAccessMetadata(metadata)) {
        return { valid: false, reason: 'inaccessible', share };
    }

    return { valid: true, reason: 'active', share };
}

export function serializeShareForManagement(share, options = {}) {
    if (!share) return null;
    const serialized = {
        id: share.id,
        tokenPrefix: share.tokenPrefix,
        targetType: share.targetType,
        targetPath: share.targetPath,
        expiresAt: share.expiresAt ?? null,
        revokedAt: share.revokedAt ?? null,
        createdAt: share.createdAt,
        updatedAt: share.updatedAt,
        viewCount: share.viewCount || 0,
        lastViewedAt: share.lastViewedAt ?? null,
        items: getShareItemsOrLegacy(share).map(serializeShareItem),
    };

    if (share.token && options.origin) {
        serialized.url = buildShareUrl(options.origin, share.token);
    }

    return serialized;
}

function serializeShareItem(item) {
    return {
        id: item.id,
        shareId: item.shareId,
        itemType: item.itemType,
        itemPath: item.itemPath,
        sortOrder: item.sortOrder || 0,
        createdAt: item.createdAt,
    };
}

export function normalizeFilePath(fileId) {
    return String(fileId || '')
        .replace(/\\/g, '/')
        .replace(/\/{2,}/g, '/')
        .replace(/^\/+/, '')
        .replace(/\/+$/, '');
}

export function normalizeDirectoryPath(path) {
    const normalized = normalizeFilePath(path);
    return normalized ? `${normalized}/` : '';
}

export function encodeFileIdForUrl(fileId) {
    return encodeURIComponent(normalizeFilePath(fileId));
}

function normalizeExpiresAt(options, now) {
    if (Object.prototype.hasOwnProperty.call(options, 'expiresAt')) {
        if (options.expiresAt === null || options.expiresAt === '') {
            return null;
        }
        if (options.expiresAt === undefined) {
            // Undefined means the API did not set expiresAt; allow expiresInSeconds below.
        } else {
            const expiresAt = Number(options.expiresAt);
            if (!Number.isFinite(expiresAt)) {
                throw new Error('expiresAt must be a timestamp in milliseconds');
            }
            return Math.trunc(expiresAt);
        }
    }

    if (Object.prototype.hasOwnProperty.call(options, 'expiresInSeconds')) {
        if (options.expiresInSeconds === null || options.expiresInSeconds === '' || options.expiresInSeconds === undefined) {
            return null;
        }
        const seconds = Number(options.expiresInSeconds);
        if (!Number.isFinite(seconds) || seconds <= 0 || seconds > MAX_EXPIRES_IN_SECONDS) {
            throw new Error('expiresInSeconds must be between 1 and 315360000');
        }
        return now + Math.trunc(seconds * 1000);
    }

    return null;
}

function normalizeNow(now) {
    const value = Number(now);
    return Number.isFinite(value) ? Math.trunc(value) : Date.now();
}

function generateShareId(now) {
    return `${SHARE_ID_PREFIX}${now}_${generateShortRandom(8)}`;
}

function generateShareToken() {
    const bytes = new Uint8Array(SHARE_TOKEN_BYTES);
    globalThis.crypto.getRandomValues(bytes);
    return bytesToBase64Url(bytes);
}

function buildShareUrl(origin, token) {
    const normalizedOrigin = String(origin || '').replace(/\/+$/, '');
    if (!normalizedOrigin || !token) return '';
    return `${normalizedOrigin}/share/${encodeURIComponent(token)}`;
}

function generateShortRandom(length) {
    const bytes = new Uint8Array(length);
    globalThis.crypto.getRandomValues(bytes);
    return bytesToBase64Url(bytes).slice(0, length);
}

async function hashShareToken(token) {
    const data = new TextEncoder().encode(String(token));
    const hash = await globalThis.crypto.subtle.digest('SHA-256', data);
    return bytesToHex(new Uint8Array(hash));
}

function bytesToHex(bytes) {
    return Array.from(bytes)
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
}

function bytesToBase64Url(bytes) {
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/g, '');
}
