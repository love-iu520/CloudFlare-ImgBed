const LEVELS = {
    debug: 10,
    info: 20,
    warn: 30,
    error: 40,
    silent: 50,
};

const DEFAULT_LEVEL = 'warn';
const SENSITIVE_KEY_PATTERN = /(token|secret|password|authorization|cookie|credential|signature|signed|href|url|sha256|oid)/i;
const SENSITIVE_VALUE_PATTERNS = [
    /Bearer\s+[A-Za-z0-9._~+/=-]+/gi,
    /Bot\s+[A-Za-z0-9._~+/=-]+/gi,
    /bot[0-9]+:[A-Za-z0-9_-]+/gi,
    /([?&](?:X-Amz-|Signature|Expires|Policy|Key-Pair-Id)[^=]*=)[^&\s]+/gi,
];

export function createLogger(namespace = 'app', options = {}) {
    const level = normalizeLevel(options.level || getRuntimeLogLevel());

    return {
        debug: (...args) => logAtLevel('debug', level, namespace, args),
        info: (...args) => logAtLevel('info', level, namespace, args),
        warn: (...args) => logAtLevel('warn', level, namespace, args),
        error: (...args) => logAtLevel('error', level, namespace, args),
    };
}

export function redactForLog(value) {
    if (value === null || value === undefined) return value;
    if (typeof value === 'string') return redactString(value);
    if (typeof value === 'number' || typeof value === 'boolean') return value;
    if (value instanceof Error) {
        return {
            name: value.name,
            message: redactString(value.message),
        };
    }
    if (Array.isArray(value)) {
        return value.map(item => redactForLog(item));
    }
    if (typeof value === 'object') {
        const redacted = {};
        for (const [key, item] of Object.entries(value)) {
            redacted[key] = SENSITIVE_KEY_PATTERN.test(key)
                ? '[redacted]'
                : redactForLog(item);
        }
        return redacted;
    }
    return String(value);
}

function logAtLevel(messageLevel, configuredLevel, namespace, args) {
    if (LEVELS[messageLevel] < LEVELS[configuredLevel]) return;

    const sanitizedArgs = args.map(arg => redactForLog(arg));
    const prefix = `[${namespace}]`;

    if (messageLevel === 'error') {
        console.error(prefix, ...sanitizedArgs);
    } else if (messageLevel === 'warn') {
        console.warn(prefix, ...sanitizedArgs);
    } else {
        console.log(prefix, ...sanitizedArgs);
    }
}

function getRuntimeLogLevel() {
    return globalThis?.CLOUDFLARE_IMGBED_LOG_LEVEL
        || globalThis?.process?.env?.CLOUDFLARE_IMGBED_LOG_LEVEL
        || globalThis?.process?.env?.LOG_LEVEL
        || DEFAULT_LEVEL;
}

function normalizeLevel(level) {
    const normalized = String(level || DEFAULT_LEVEL).toLowerCase();
    return Object.prototype.hasOwnProperty.call(LEVELS, normalized)
        ? normalized
        : DEFAULT_LEVEL;
}

function redactString(value) {
    return SENSITIVE_VALUE_PATTERNS.reduce((text, pattern) => text.replace(pattern, (...args) => {
        const groups = args.slice(1, -2);
        const prefix = groups.find(group => typeof group === 'string' && group.length > 0) || '';
        return prefix ? `${prefix}[redacted]` : '[redacted]';
    }), value);
}
