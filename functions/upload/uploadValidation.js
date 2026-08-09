/**
 * 判断 multipart 的 file 字段是否为可读取的文件对象。
 * 使用能力检测而不是 instanceof File，以兼容 Workers、Pages 和 Node.js 运行时。
 */
export function isUploadedFile(value) {
    return value !== null
        && typeof value === 'object'
        && typeof value.name === 'string'
        && typeof value.type === 'string'
        && typeof value.size === 'number'
        && Number.isFinite(value.size)
        && value.size >= 0
        && typeof value.slice === 'function'
        && typeof value.arrayBuffer === 'function';
}
