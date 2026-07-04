import { buildTelegramSourceGroup } from '../../../utils/sourceGroup.js';

export async function buildImportedFileRecord(db, channel, message, media) {
    const channelName = channel.name || 'Telegram';
    const fileName = ensureFileExtension(media.fileName, media.fileType);
    const safeFileName = sanitizeImportFileName(fileName);
    const fileId = await buildUniqueImportFileId(db, message.message_id, safeFileName);
    const metadata = {
        FileName: fileName,
        FileType: media.fileType || 'application/octet-stream',
        FileSize: ((media.fileSizeBytes || 0) / 1024 / 1024).toFixed(2),
        FileSizeBytes: media.fileSizeBytes || 0,
        UploadIP: 'TelegramImport',
        UploadAddress: 'Telegram Channel',
        ListType: 'None',
        TimeStamp: message.date ? message.date * 1000 : Date.now(),
        Label: 'None',
        Directory: '',
        Tags: [],
        Channel: 'TelegramNew',
        ChannelName: channelName,
        TgFileId: media.fileId,
        TgFileUniqueId: media.fileUniqueId,
        TgMessageId: message.message_id,
        TgImported: true,
        TgImportedAt: Date.now(),
        TgMediaType: media.field,
        SourceGroup: buildTelegramSourceGroup(channelName),
    };

    if (media.width) metadata.Width = media.width;
    if (media.height) metadata.Height = media.height;
    if (media.duration) metadata.Duration = media.duration;

    return { fileId, metadata };
}

export function resolveTelegramFileExt(fileName, fileType) {
    const name = String(fileName || '').trim();
    const dotIndex = name.lastIndexOf('.');
    if (dotIndex > -1 && dotIndex < name.length - 1) {
        return name.slice(dotIndex + 1).toLowerCase();
    }

    const type = String(fileType || '').toLowerCase();
    const knownTypes = {
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/webp': 'webp',
        'image/bmp': 'bmp',
        'video/mp4': 'mp4',
        'video/webm': 'webm',
        'audio/mpeg': 'mp3',
        'audio/ogg': 'ogg',
        'application/pdf': 'pdf',
    };

    if (knownTypes[type]) {
        return knownTypes[type];
    }

    const slashIndex = type.indexOf('/');
    const subtype = slashIndex > -1 ? type.slice(slashIndex + 1) : '';
    return sanitizeImportFileName(subtype || 'bin').replace(/_+/g, '_') || 'bin';
}

async function buildUniqueImportFileId(db, messageId, fileName) {
    const baseId = `${messageId}_${fileName}`;
    if (await db.get(baseId) === null) {
        return baseId;
    }

    const dotIndex = fileName.lastIndexOf('.');
    const stem = dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName;
    const ext = dotIndex > 0 ? fileName.slice(dotIndex) : '';
    let counter = 1;

    while (counter <= 1000) {
        const candidateId = `${messageId}_${stem}(${counter})${ext}`;
        if (await db.get(candidateId) === null) {
            return candidateId;
        }
        counter += 1;
    }

    throw new Error('Failed to generate unique Telegram import file ID');
}

function ensureFileExtension(fileName, fileType) {
    const ext = resolveTelegramFileExt(fileName, fileType);
    const normalized = String(fileName || '').trim() || `telegram-file.${ext}`;
    return normalized.includes('.') ? normalized : `${normalized}.${ext}`;
}

function sanitizeImportFileName(fileName) {
    return String(fileName || 'telegram-file')
        .split('/')
        .pop()
        .replace(/[\\\/:\*\?"'<>\| \(\)\[\]\{\}#%\^`~;@&=\+\$,]/g, '_');
}
