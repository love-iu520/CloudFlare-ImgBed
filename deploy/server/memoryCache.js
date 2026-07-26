const DEFAULT_MAX_BYTES = 32 * 1024 * 1024;
const DEFAULT_MAX_ENTRIES = 100;
const textEncoder = new TextEncoder();

function normalizeLimit(value, name) {
    if (!Number.isFinite(value) || value < 0) {
        throw new TypeError(`${name} must be a non-negative finite number`);
    }
    return Math.floor(value);
}

function normalizeCacheKey(request) {
    if (request instanceof Request) {
        return request.url;
    }
    if (request instanceof URL) {
        return request.href;
    }
    if (typeof request === 'string') {
        return new Request(request).url;
    }
    throw new TypeError('Cache key must be a URL, Request, or absolute URL string');
}

function getCacheControlDirectives(cacheControl) {
    if (typeof cacheControl !== 'string' || cacheControl.trim() === '') {
        return [];
    }

    return cacheControl.split(',').map(rawDirective => {
        const part = rawDirective.trim();
        const equalsIndex = part.indexOf('=');
        return {
            name: (equalsIndex === -1 ? part : part.slice(0, equalsIndex)).trim().toLowerCase(),
            value: equalsIndex === -1 ? null : part.slice(equalsIndex + 1).trim(),
        };
    });
}

function parseTtlSeconds(value) {
    if (typeof value === 'number') {
        return Number.isSafeInteger(value) && value >= 0 ? value : null;
    }
    if (typeof value !== 'string') {
        return null;
    }

    let normalized = value.trim();
    if (normalized.startsWith('"') || normalized.endsWith('"')) {
        if (!(normalized.startsWith('"') && normalized.endsWith('"') && normalized.length >= 2)) {
            return null;
        }
        normalized = normalized.slice(1, -1);
    }
    if (!/^\d+$/.test(normalized)) {
        return null;
    }

    const seconds = Number(normalized);
    return Number.isSafeInteger(seconds) ? seconds : null;
}

export function parseCacheControlMaxAge(cacheControl) {
    const maxAgeDirectives = getCacheControlDirectives(cacheControl)
        .filter(directive => directive.name === 'max-age');

    if (maxAgeDirectives.length === 0) {
        return null;
    }

    const values = maxAgeDirectives.map(directive => parseTtlSeconds(directive.value));
    if (values.some(value => value === null)) {
        return null;
    }

    // Repeated directives are ambiguous, so use the shortest lifetime.
    return Math.min(...values);
}

function calculateExpiresAt(now, ttlSeconds) {
    if (ttlSeconds === null) {
        return Number.POSITIVE_INFINITY;
    }

    const remainingMilliseconds = Math.max(0, Number.MAX_SAFE_INTEGER - now);
    if (ttlSeconds >= Math.floor(remainingMilliseconds / 1000)) {
        return Number.MAX_SAFE_INTEGER;
    }
    return now + ttlSeconds * 1000;
}

function estimateEntryBytes(key, body, statusText, headers) {
    let bytes = body?.byteLength || 0;
    bytes += textEncoder.encode(key).byteLength;
    bytes += textEncoder.encode(statusText).byteLength;
    for (const [name, value] of headers) {
        bytes += textEncoder.encode(name).byteLength;
        bytes += textEncoder.encode(value).byteLength;
    }
    return bytes;
}

export class MemoryCache {
    constructor({
        maxBytes = DEFAULT_MAX_BYTES,
        maxEntries = DEFAULT_MAX_ENTRIES,
        now = () => Date.now(),
    } = {}) {
        if (typeof now !== 'function') {
            throw new TypeError('now must be a function');
        }

        this.maxBytes = normalizeLimit(maxBytes, 'maxBytes');
        this.maxEntries = normalizeLimit(maxEntries, 'maxEntries');
        this.now = now;
        this.entries = new Map();
        this.storedBytes = 0;
    }

    get size() {
        this.removeExpiredEntries(this.currentTime());
        return this.entries.size;
    }

    get totalBytes() {
        this.removeExpiredEntries(this.currentTime());
        return this.storedBytes;
    }

    async match(request) {
        const key = normalizeCacheKey(request);
        const entry = this.entries.get(key);
        if (!entry) {
            return undefined;
        }

        if (entry.expiresAt <= this.currentTime()) {
            this.removeEntry(key);
            return undefined;
        }

        // Map insertion order tracks least-recently-used entries.
        this.entries.delete(key);
        this.entries.set(key, entry);

        return new Response(entry.body === null ? null : entry.body.slice(0), {
            status: entry.status,
            statusText: entry.statusText,
            headers: entry.headers,
        });
    }

    async put(request, response, options = {}) {
        const key = normalizeCacheKey(request);
        if (!(response instanceof Response)) {
            throw new TypeError('Cache value must be a Response');
        }

        const cacheControl = response.headers.get('Cache-Control') || '';
        const directives = getCacheControlDirectives(cacheControl);
        const hasMaxAge = directives.some(directive => directive.name === 'max-age');
        const maxAge = parseCacheControlMaxAge(cacheControl);

        // Invalid max-age values are not safe to cache, and max-age=0 is used by
        // the existing purge helpers to invalidate an entry.
        if ((hasMaxAge && maxAge === null) || maxAge === 0
            || directives.some(directive => directive.name === 'no-store')) {
            this.removeEntry(key);
            return;
        }

        let ttlSeconds = maxAge;
        if (!hasMaxAge && options && Object.hasOwn(options, 'expirationTtl')) {
            ttlSeconds = parseTtlSeconds(options.expirationTtl);
            if (ttlSeconds === null || ttlSeconds === 0) {
                this.removeEntry(key);
                return;
            }
        }

        const clonedResponse = response.clone();
        const body = clonedResponse.body === null ? null : await clonedResponse.arrayBuffer();
        const headers = [...clonedResponse.headers.entries()];
        const entry = {
            body,
            headers,
            status: clonedResponse.status,
            statusText: clonedResponse.statusText,
            expiresAt: calculateExpiresAt(this.currentTime(), ttlSeconds),
            bytes: estimateEntryBytes(key, body, clonedResponse.statusText, headers),
        };

        this.removeEntry(key);
        if (this.maxEntries === 0 || entry.bytes > this.maxBytes) {
            return;
        }

        this.removeExpiredEntries(this.currentTime());
        this.entries.set(key, entry);
        this.storedBytes += entry.bytes;
        this.evictLeastRecentlyUsed();
    }

    async delete(request) {
        const key = normalizeCacheKey(request);
        const entry = this.entries.get(key);
        if (!entry) {
            return false;
        }
        if (entry.expiresAt <= this.currentTime()) {
            this.removeEntry(key);
            return false;
        }
        return this.removeEntry(key);
    }

    currentTime() {
        const value = this.now();
        if (!Number.isFinite(value)) {
            throw new TypeError('now must return a finite number');
        }
        return value;
    }

    removeEntry(key) {
        const entry = this.entries.get(key);
        if (!entry) {
            return false;
        }
        this.entries.delete(key);
        this.storedBytes -= entry.bytes;
        return true;
    }

    removeExpiredEntries(now) {
        for (const [key, entry] of this.entries) {
            if (entry.expiresAt <= now) {
                this.removeEntry(key);
            }
        }
    }

    evictLeastRecentlyUsed() {
        while (this.entries.size > this.maxEntries || this.storedBytes > this.maxBytes) {
            const oldestKey = this.entries.keys().next().value;
            if (oldestKey === undefined) {
                break;
            }
            this.removeEntry(oldestKey);
        }
    }
}
