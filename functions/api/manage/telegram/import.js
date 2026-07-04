import { getDatabase } from '../../../utils/databaseAdapter.js';
import { batchAddFilesToIndex } from '../../../utils/indexManager.js';
import { TelegramAPI } from '../../../utils/storage/telegramAPI.js';
import { getUploadConfig } from '../sysConfig/upload.js';
import { buildImportedFileRecord, resolveTelegramFileExt } from './importRecord.js';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
};

export async function onRequest(context) {
    const { request, env, waitUntil } = context;

    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
        return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
    }

    try {
        const url = new URL(request.url);
        const body = await readJsonBody(request);
        const channelNameFilter = body.channelName || url.searchParams.get('channelName') || '';
        const limit = clampUpdateLimit(body.limit || url.searchParams.get('limit'));

        const db = getDatabase(env);
        const uploadConfig = await getUploadConfig(db, env);
        const telegramChannels = (uploadConfig.telegram?.channels || [])
            .filter(channel => channel.enabled !== false)
            .filter(channel => channel.botToken && channel.chatId)
            .filter(channel => !channelNameFilter || channel.name === channelNameFilter);

        if (telegramChannels.length === 0) {
            return jsonResponse({
                success: false,
                error: 'No enabled Telegram channel configured',
            }, 400);
        }

        const existingMessageKeys = await collectExistingTelegramMessageKeys(db);
        const botGroups = await groupChannelsByBot(telegramChannels);
        const imported = [];
        const skipped = [];
        const failed = [];
        const indexFiles = [];
        let updatesSeen = 0;

        for (const group of botGroups) {
            const offsetKey = `manage@telegramImport@offset@${group.botHash}`;
            const offsetValue = await db.get(offsetKey);
            const offset = offsetValue ? Number(offsetValue) : undefined;
            const telegramAPI = new TelegramAPI(group.botToken, group.proxyUrl);
            const updates = await telegramAPI.getUpdates({
                offset,
                limit,
                allowedUpdates: ['channel_post'],
            });

            updatesSeen += updates.length;
            let maxUpdateId = offset ? offset - 1 : 0;

            for (const update of updates) {
                if (typeof update.update_id === 'number') {
                    maxUpdateId = Math.max(maxUpdateId, update.update_id);
                }

                const message = update.channel_post;
                if (!message) {
                    continue;
                }

                const channel = group.channels.find(item => isMessageForChannel(message, item));
                if (!channel) {
                    skipped.push({
                        reason: 'channel_not_configured',
                        messageId: message.message_id,
                    });
                    continue;
                }

                const media = extractTelegramMedia(message);
                if (!media) {
                    skipped.push({
                        channelName: channel.name,
                        messageId: message.message_id,
                        reason: 'unsupported_message',
                    });
                    continue;
                }

                const duplicateKey = buildExistingMessageKey(channel.name, message.message_id);
                const markerKey = buildImportMarkerKey(group.botHash, channel.chatId, message.message_id);
                const markerValue = await db.get(markerKey);
                if (existingMessageKeys.has(duplicateKey) || markerValue) {
                    skipped.push({
                        channelName: channel.name,
                        messageId: message.message_id,
                        reason: 'duplicate',
                    });
                    continue;
                }

                try {
                    const fileRecord = await buildImportedFileRecord(db, channel, message, media);
                    await db.put(fileRecord.fileId, '', { metadata: fileRecord.metadata });
                    await db.put(markerKey, fileRecord.fileId);
                    existingMessageKeys.add(duplicateKey);
                    indexFiles.push({ fileId: fileRecord.fileId, metadata: fileRecord.metadata });
                    imported.push({
                        fileId: fileRecord.fileId,
                        channelName: channel.name,
                        messageId: message.message_id,
                    });
                } catch (error) {
                    failed.push({
                        channelName: channel.name,
                        messageId: message.message_id,
                        error: error.message,
                    });
                }
            }

            if (maxUpdateId > 0) {
                await db.put(offsetKey, String(maxUpdateId + 1));
            }
        }

        if (indexFiles.length > 0) {
            waitUntil(batchAddFilesToIndex(context, indexFiles));
        }

        return jsonResponse({
            success: true,
            updatesSeen,
            imported,
            skipped,
            failed,
            note: 'Telegram getUpdates only returns recent bot updates and does not read arbitrary historical message IDs.',
        });
    } catch (error) {
        return jsonResponse({ success: false, error: error.message }, 500);
    }
}

async function readJsonBody(request) {
    try {
        const contentType = request.headers.get('Content-Type') || '';
        if (!contentType.includes('application/json')) return {};
        return await request.json();
    } catch {
        return {};
    }
}

function clampUpdateLimit(value) {
    const parsed = Number(value) || 100;
    return Math.min(100, Math.max(1, parsed));
}

async function groupChannelsByBot(channels) {
    const groups = new Map();

    for (const channel of channels) {
        const botHash = await hashSensitiveValue(channel.botToken);
        const proxyUrl = channel.proxyUrl || '';
        const groupKey = `${botHash}:${proxyUrl}`;
        const group = groups.get(groupKey) || {
            botHash,
            botToken: channel.botToken,
            proxyUrl,
            channels: [],
        };

        group.channels.push(channel);
        groups.set(groupKey, group);
    }

    return Array.from(groups.values());
}

async function collectExistingTelegramMessageKeys(db) {
    const keys = new Set();
    let cursor = null;

    while (true) {
        const response = await db.list({ limit: 1000, cursor });
        cursor = response.cursor;

        for (const item of response.keys || []) {
            if (item.name.startsWith('manage@') || item.name.startsWith('chunk_')) {
                continue;
            }

            const metadata = item.metadata || {};
            if (metadata.Channel === 'TelegramNew' && metadata.ChannelName && metadata.TgMessageId) {
                keys.add(buildExistingMessageKey(metadata.ChannelName, metadata.TgMessageId));
            }
        }

        if (!cursor) break;
        await new Promise(resolve => setTimeout(resolve, 0));
    }

    return keys;
}

function buildExistingMessageKey(channelName, messageId) {
    return `${String(channelName || '').trim()}:${String(messageId)}`;
}

function buildImportMarkerKey(botHash, chatId, messageId) {
    return `manage@telegramImport@message@${botHash}@${normalizeMarkerPart(chatId)}@${messageId}`;
}

function normalizeMarkerPart(value) {
    return String(value || '').replace(/[^\w.-]/g, '_');
}

function isMessageForChannel(message, channel) {
    const chat = message.chat || {};
    const configuredChatId = String(channel.chatId || '').trim();
    if (!configuredChatId) return false;

    const actualChatId = String(chat.id || '');
    if (chatIdVariants(configuredChatId).has(actualChatId)) {
        return true;
    }

    const username = String(chat.username || '').trim();
    return Boolean(username && (configuredChatId === username || configuredChatId === `@${username}`));
}

function chatIdVariants(value) {
    const raw = String(value || '').trim();
    const variants = new Set([raw]);
    if (raw.startsWith('-100')) {
        variants.add(raw.slice(4));
    } else if (/^\d+$/.test(raw)) {
        variants.add(`-100${raw}`);
    }
    return variants;
}

function extractTelegramMedia(message) {
    if (Array.isArray(message.photo) && message.photo.length > 0) {
        const photo = message.photo.reduce((best, current) => {
            const bestSize = best.file_size || 0;
            const currentSize = current.file_size || 0;
            return currentSize >= bestSize ? current : best;
        });

        return {
            field: 'photo',
            fileId: photo.file_id,
            fileUniqueId: photo.file_unique_id,
            fileName: `telegram-${message.message_id}.jpg`,
            fileSizeBytes: photo.file_size || 0,
            fileType: 'image/jpeg',
            width: photo.width,
            height: photo.height,
        };
    }

    const candidates = [
        ['document', message.document, 'application/octet-stream'],
        ['video', message.video, 'video/mp4'],
        ['animation', message.animation, 'video/mp4'],
        ['audio', message.audio, 'audio/mpeg'],
        ['voice', message.voice, 'audio/ogg'],
        ['video_note', message.video_note, 'video/mp4'],
    ];

    for (const [field, value, fallbackType] of candidates) {
        if (!value?.file_id) continue;
        const fileType = value.mime_type || fallbackType;
        const fileName = value.file_name || `telegram-${message.message_id}.${resolveTelegramFileExt('', fileType)}`;

        return {
            field,
            fileId: value.file_id,
            fileUniqueId: value.file_unique_id,
            fileName,
            fileSizeBytes: value.file_size || 0,
            fileType,
            width: value.width,
            height: value.height,
            duration: value.duration,
        };
    }

    return null;
}

async function hashSensitiveValue(value) {
    const data = new TextEncoder().encode(String(value || ''));
    const digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest))
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('')
        .slice(0, 16);
}

function jsonResponse(body, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
}
