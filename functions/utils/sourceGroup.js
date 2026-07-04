const TELEGRAM_SOURCE_TYPE = 'telegram';
const DEFAULT_TELEGRAM_SOURCE_NAME = 'Telegram';

export function buildTelegramSourceGroup(channelName = DEFAULT_TELEGRAM_SOURCE_NAME) {
    const name = normalizeSourceGroupName(channelName);

    return {
        type: TELEGRAM_SOURCE_TYPE,
        key: `${TELEGRAM_SOURCE_TYPE}:${name}`,
        name,
    };
}

export function withTelegramSourceGroup(metadata = {}, channelName = DEFAULT_TELEGRAM_SOURCE_NAME) {
    return {
        ...metadata,
        SourceGroup: buildTelegramSourceGroup(channelName),
    };
}

export function getSourceGroup(metadata = {}) {
    if (!metadata || typeof metadata !== 'object') return null;

    const sourceGroup = metadata.SourceGroup;
    if (sourceGroup && typeof sourceGroup === 'object') {
        const rawKey = String(sourceGroup.key || '').trim();
        let type = String(sourceGroup.type || '').trim();
        let name = String(sourceGroup.name || '').trim();
        let key = rawKey;

        if (!type && rawKey.includes(':')) {
            type = rawKey.split(':', 1)[0];
        }

        if (!name && type && rawKey.startsWith(`${type}:`)) {
            name = rawKey.slice(type.length + 1);
        }

        if (!key && type && name) {
            key = `${type}:${name}`;
        }

        if (type && key) {
            return {
                type,
                key,
                name: name || key,
            };
        }
    }

    if (isTelegramMetadata(metadata)) {
        return buildTelegramSourceGroup(metadata.ChannelName);
    }

    return null;
}

export function getSourceGroupKey(metadata = {}) {
    return getSourceGroup(metadata)?.key || '';
}

export function getSourceGroupName(metadata = {}) {
    return getSourceGroup(metadata)?.name || '';
}

function isTelegramMetadata(metadata = {}) {
    return (metadata.Channel === 'TelegramNew' || metadata.Channel === 'Telegram') && metadata.ChannelName;
}

function normalizeSourceGroupName(value) {
    const normalized = String(value || '').trim();
    return normalized || DEFAULT_TELEGRAM_SOURCE_NAME;
}
