const EDITABLE_EXTENSIONS = new Set(['txt', 'md', 'markdown', 'json']);
const EDITABLE_CHANNELS = new Set(['TelegramNew']);
const EDITABLE_MIME_TYPES = new Set([
  '',
  'application/json',
  'application/octet-stream',
  'text/markdown',
  'text/plain',
]);

export function getEditableTextType(fileId, metadata = {}) {
  const fileIdExtension = getExtension(fileId);
  const extension = fileIdExtension || getExtension(metadata.FileName);
  if (!EDITABLE_EXTENSIONS.has(extension)) return null;
  return extension === 'md' || extension === 'markdown' ? 'markdown' : extension;
}

export function isEditableTextChannel(channel) {
  return EDITABLE_CHANNELS.has(channel);
}

export function isEditableTextMimeType(fileType) {
  const mimeType = String(fileType || '').split(';', 1)[0].trim().toLowerCase();
  return EDITABLE_MIME_TYPES.has(mimeType) || mimeType.endsWith('+json');
}

export function isEditableTextRecord(fileId, metadata = {}) {
  return metadata?.IsChunked !== true
    && Boolean(getEditableTextType(fileId, metadata))
    && isEditableTextChannel(metadata?.Channel)
    && isEditableTextMimeType(metadata?.FileType);
}

function getExtension(name) {
  const baseName = String(name || '').split(/[?#]/, 1)[0].split('/').pop()?.toLowerCase() || '';
  const dotIndex = baseName.lastIndexOf('.');
  return dotIndex >= 0 && dotIndex < baseName.length - 1 ? baseName.slice(dotIndex + 1) : '';
}
