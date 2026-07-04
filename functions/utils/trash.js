export const TRASH_LIST_TYPE = 'Trash';
const DEFAULT_LIST_TYPE = 'None';

export function isTrashMetadata(metadata = {}) {
    return metadata?.ListType === TRASH_LIST_TYPE;
}

export function markMetadataTrashed(metadata = {}, deletedAt = Date.now()) {
    const currentTrash = isPlainObject(metadata.Trash) ? metadata.Trash : {};
    const originalListType = currentTrash.originalListType || normalizeOriginalListType(metadata.ListType);

    return {
        ...metadata,
        ListType: TRASH_LIST_TYPE,
        Trash: {
            ...currentTrash,
            deletedAt,
            originalListType,
        },
    };
}

export function restoreMetadataFromTrash(metadata = {}) {
    const restored = { ...metadata };
    const originalListType = normalizeRestoredListType(restored.Trash?.originalListType);

    restored.ListType = originalListType;
    delete restored.Trash;

    return restored;
}

function normalizeOriginalListType(listType) {
    if (!listType || listType === TRASH_LIST_TYPE) return DEFAULT_LIST_TYPE;
    return listType;
}

function normalizeRestoredListType(listType) {
    if (!listType || listType === TRASH_LIST_TYPE) return DEFAULT_LIST_TYPE;
    return listType;
}

function isPlainObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}
