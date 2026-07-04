import {
    readIndex, mergeOperationsToIndex, deleteAllOperations, rebuildIndex,
    getIndexInfo, getIndexStorageStats
} from '../../utils/indexManager.js';
import { getDatabase } from '../../utils/databaseAdapter.js';
import { createMetadataViewContext, serializeFileRecordForManagement } from '../../utils/metadata/metadataView.js';
import { getSourceGroup, getSourceGroupKey } from '../../utils/sourceGroup.js';

const TELEGRAM_VIRTUAL_ROOT = 'telegram/';
const TELEGRAM_SOURCE_PREFIX = 'telegram:';
const LEGACY_TELEGRAM_IMPORT_ROOT = 'telegram-import';
const NO_SOURCE_GROUP_MATCH = '__cfib_no_source_group_match__';

// CORS 跨域响应头
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
};

export async function onRequest(context) {
    const { request, waitUntil } = context;
    const url = new URL(request.url);

    // 解析查询参数
    let start = parseInt(url.searchParams.get('start'), 10) || 0;
    let count = parseInt(url.searchParams.get('count'), 10) || 50;
    let sum = url.searchParams.get('sum') === 'true';
    let recursive = url.searchParams.get('recursive') === 'true';
    let dir = url.searchParams.get('dir') || '';
    let search = url.searchParams.get('search') || '';
    let channel = url.searchParams.get('channel') || '';
    let listType = url.searchParams.get('listType') || '';
    let accessStatus = url.searchParams.get('accessStatus') || '';
    let action = url.searchParams.get('action') || '';
    let includeTags = url.searchParams.get('includeTags') || '';
    let excludeTags = url.searchParams.get('excludeTags') || '';
    let label = url.searchParams.get('label') || '';
    let fileType = url.searchParams.get('fileType') || '';
    let channelName = url.searchParams.get('channelName') || '';
    let sourceGroup = url.searchParams.get('sourceGroup') || '';

    // 处理搜索关键字
    if (search) {
        search = decodeURIComponent(search).trim();
    }

    // 处理标签参数
    const includeTagsArray = includeTags ? includeTags.split(',').map(t => t.trim()).filter(t => t) : [];
    const excludeTagsArray = excludeTags ? excludeTags.split(',').map(t => t.trim()).filter(t => t) : [];

    // 处理筛选参数（支持逗号分隔的多选）
    const listTypeArray = listType ? listType.split(',').map(t => t.trim()).filter(t => t) : [];
    const accessStatusArray = accessStatus ? accessStatus.split(',').map(t => t.trim()).filter(t => t) : [];
    const labelArray = label ? label.split(',').map(t => t.trim()).filter(t => t) : [];
    const fileTypeArray = fileType ? fileType.split(',').map(t => t.trim()).filter(t => t) : [];
    const channelArray = channel ? channel.split(',').map(t => t.trim()).filter(t => t) : [];
    const channelNameArray = channelName ? channelName.split(',').map(t => t.trim()).filter(t => t) : [];
    const sourceGroupArray = sourceGroup ? sourceGroup.split(',').map(t => t.trim()).filter(t => t) : [];

    // 处理目录参数
    if (dir) {
        // 路径安全处理：防止路径穿越
        dir = dir.replace(/\.\./g, '_').replace(/\\/g, '/').replace(/\/{2,}/g, '/');
    }
    if (dir.startsWith('/')) {
        dir = dir.substring(1);
    }
    if (dir && !dir.endsWith('/')) {
        dir += '/';
    }

    const virtualTelegramChannel = getVirtualTelegramChannelName(dir);
    const effectiveDir = virtualTelegramChannel ? '' : dir;
    const effectiveSourceGroupArray = virtualTelegramChannel
        ? applyVirtualTelegramSourceGroup(sourceGroupArray, virtualTelegramChannel)
        : sourceGroupArray;
    const effectiveRecursive = virtualTelegramChannel ? true : recursive;

    try {
        // 特殊操作：重建索引
        if (action === 'rebuild') {
            waitUntil(rebuildIndex(context, (processed) => {
                console.log(`Rebuilt ${processed} files...`);
            }));

            return new Response('Index rebuilt asynchronously', {
                headers: { "Content-Type": "text/plain", ...corsHeaders }
            });
        }

        // 特殊操作：合并挂起的原子操作到索引
        if (action === 'merge-operations') {
            waitUntil(mergeOperationsToIndex(context));

            return new Response('Operations merged into index asynchronously', {
                headers: { "Content-Type": "text/plain", ...corsHeaders }
            });
        }

        // 特殊操作：清除所有原子操作
        if (action === 'delete-operations') {
            waitUntil(deleteAllOperations(context));

            return new Response('All operations deleted asynchronously', {
                headers: { "Content-Type": "text/plain", ...corsHeaders }
            });
        }

        // 特殊操作：获取索引存储信息
        if (action === 'index-storage-stats') {
            const stats = await getIndexStorageStats(context);
            return new Response(JSON.stringify(stats), {
                headers: { "Content-Type": "application/json", ...corsHeaders }
            });
        }

        // 特殊操作：获取索引信息
        if (action === 'info') {
            const info = await getIndexInfo(context, {
                timezoneOffset: url.searchParams.get('timezoneOffset'),
                maxPoints: url.searchParams.get('trendMaxPoints'),
                seriesLimit: url.searchParams.get('trendSeriesLimit'),
                startDate: url.searchParams.get('trendStartDate'),
                endDate: url.searchParams.get('trendEndDate')
            });
            return new Response(JSON.stringify(info), {
                headers: { "Content-Type": "application/json", ...corsHeaders }
            });
        }

        // 普通查询：只返回总数
        if (count === -1 && sum) {
            const result = await readIndex(context, {
                search,
                directory: effectiveDir,
                channel: channelArray,
                listType: listTypeArray,
                accessStatus: accessStatusArray,
                label: labelArray,
                fileType: fileTypeArray,
                channelName: channelNameArray,
                sourceGroup: effectiveSourceGroupArray,
                includeTags: includeTagsArray,
                excludeTags: excludeTagsArray,
                countOnly: true
            });

            return new Response(JSON.stringify({
                sum: result.totalCount,
                indexLastUpdated: result.indexLastUpdated
            }), {
                headers: { "Content-Type": "application/json", ...corsHeaders }
            });
        }

        // 普通查询：返回数据
        const result = await readIndex(context, {
            search,
            directory: effectiveDir,
            start,
            count,
            channel: channelArray,
            listType: listTypeArray,
            accessStatus: accessStatusArray,
            label: labelArray,
            fileType: fileTypeArray,
            channelName: channelNameArray,
            sourceGroup: effectiveSourceGroupArray,
            includeTags: includeTagsArray,
            excludeTags: excludeTagsArray,
            includeSubdirFiles: effectiveRecursive,
        });

        // 索引读取失败，直接从 KV 中获取所有文件记录
        if (!result.success) {
            const dbRecords = await getAllFileRecords(context.env, effectiveDir, {
                listType: listTypeArray,
                sourceGroup: effectiveSourceGroupArray,
                includeTags: includeTagsArray,
                excludeTags: excludeTagsArray,
                includeSubdirFiles: effectiveRecursive,
            });
            const mergedRecords = await withTelegramVirtualDirectories(context, dbRecords, dir, {
                search,
                channel: channelArray,
                listType: listTypeArray,
                accessStatus: accessStatusArray,
                label: labelArray,
                fileType: fileTypeArray,
                channelName: channelNameArray,
                sourceGroup: sourceGroupArray,
                includeTags: includeTagsArray,
                excludeTags: excludeTagsArray,
            }, virtualTelegramChannel);

            return new Response(JSON.stringify({
                files: mergedRecords.files,
                directories: mergedRecords.directories,
                totalCount: mergedRecords.totalCount,
                directFileCount: mergedRecords.directFileCount,
                directFolderCount: mergedRecords.directFolderCount,
                returnedCount: mergedRecords.returnedCount,
                indexLastUpdated: Date.now(),
                isIndexedResponse: false // 标记这是来自 KV 的响应
            }), {
                headers: { "Content-Type": "application/json", ...corsHeaders }
            });
        }

        const db = getDatabase(context.env);
        const metadataViewContext = await createMetadataViewContext(db, context.env);

        // 转换文件格式
        const compatibleFiles = await Promise.all(
            result.files.map(file => serializeFileRecordForManagement(db, context.env, file, metadataViewContext))
        );
        const mergedResult = await withTelegramVirtualDirectories(context, {
            ...result,
            files: compatibleFiles,
        }, dir, {
            search,
            channel: channelArray,
            listType: listTypeArray,
            accessStatus: accessStatusArray,
            label: labelArray,
            fileType: fileTypeArray,
            channelName: channelNameArray,
            sourceGroup: sourceGroupArray,
            includeTags: includeTagsArray,
            excludeTags: excludeTagsArray,
        }, virtualTelegramChannel);

        return new Response(JSON.stringify({
            files: mergedResult.files,
            directories: mergedResult.directories,
            totalCount: mergedResult.totalCount,
            directFileCount: mergedResult.directFileCount,
            directFolderCount: mergedResult.directFolderCount,
            returnedCount: mergedResult.returnedCount,
            indexLastUpdated: result.indexLastUpdated,
            isIndexedResponse: true // 标记这是来自索引的响应
        }), {
            headers: { "Content-Type": "application/json", ...corsHeaders }
        });

    } catch (error) {
        console.error('Error in list-indexed API:', error);
        return new Response(JSON.stringify({
            error: 'Internal server error',
            message: error.message
        }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders }
        });
    }
}

function getVirtualTelegramChannelName(dir) {
    if (!dir || !dir.startsWith(TELEGRAM_VIRTUAL_ROOT) || dir === TELEGRAM_VIRTUAL_ROOT) {
        return '';
    }

    const channelName = dir.slice(TELEGRAM_VIRTUAL_ROOT.length).replace(/\/+$/g, '');
    if (!channelName || channelName.includes('/')) {
        return '';
    }

    return channelName;
}

function applyVirtualTelegramSourceGroup(sourceGroupArray, channelName) {
    const sourceGroupKey = `${TELEGRAM_SOURCE_PREFIX}${channelName}`;
    if (sourceGroupArray.length > 0 && !sourceGroupArray.includes(sourceGroupKey)) {
        return [NO_SOURCE_GROUP_MATCH];
    }
    return [sourceGroupKey];
}

async function withTelegramVirtualDirectories(context, result, dir, filters, virtualTelegramChannel) {
    if (virtualTelegramChannel) {
        return {
            ...result,
            directories: [],
            directFileCount: result.totalCount || result.files.length,
            directFolderCount: 0,
        };
    }

    if (dir !== '' && dir !== TELEGRAM_VIRTUAL_ROOT) {
        return result;
    }

    const sourceDirectories = await getTelegramSourceDirectories(context, filters);
    if (!sourceDirectories.length) {
        return result;
    }

    const directories = new Set(result.directories || []);
    if (dir === '') {
        directories.delete(LEGACY_TELEGRAM_IMPORT_ROOT);
        directories.add('telegram');
    } else {
        sourceDirectories.forEach(directory => directories.add(directory));
    }

    const mergedDirectories = Array.from(directories).sort((a, b) => a.localeCompare(b, 'zh-CN'));
    return {
        ...result,
        directories: mergedDirectories,
        directFolderCount: mergedDirectories.length,
    };
}

async function getTelegramSourceDirectories(context, filters) {
    const result = await readIndex(context, {
        ...filters,
        directory: '',
        start: 0,
        count: -1,
        includeSubdirFiles: true,
    });

    if (result.success) {
        return buildTelegramSourceDirectories(result.files);
    }

    return buildTelegramSourceDirectories(await getTelegramSourceRecordsFromDatabase(context.env, filters));
}

function buildTelegramSourceDirectories(files) {
    const directories = new Map();
    files.forEach(file => {
        const group = getSourceGroup(file.metadata);
        if (!group || group.type !== 'telegram' || !group.key.startsWith(TELEGRAM_SOURCE_PREFIX)) {
            return;
        }

        const name = group.name || group.key.slice(TELEGRAM_SOURCE_PREFIX.length);
        directories.set(group.key, `${TELEGRAM_VIRTUAL_ROOT}${name}`);
    });

    return Array.from(directories.values()).sort((a, b) => a.localeCompare(b, 'zh-CN'));
}

async function getTelegramSourceRecordsFromDatabase(env, filters = {}) {
    const records = [];
    let cursor = null;
    const db = getDatabase(env);

    while (true) {
        const response = await db.list({
            prefix: '',
            limit: 1000,
            cursor,
        });

        if (!response || !response.keys || !Array.isArray(response.keys)) {
            break;
        }

        cursor = response.cursor;
        for (const item of response.keys) {
            if (item.name.startsWith('manage@') || item.name.startsWith('chunk_')) {
                continue;
            }
            if (!item.metadata || !item.metadata.TimeStamp) {
                continue;
            }
            if (passesFallbackFilters(item.metadata, filters)) {
                records.push(item);
            }
        }

        if (!cursor) break;
        await new Promise(resolve => setTimeout(resolve, 10));
    }

    return records;
}

async function getAllFileRecords(env, dir, filters = {}) {
    const allRecords = [];
    let cursor = null;

    try {
        const db = getDatabase(env);
        const metadataViewContext = await createMetadataViewContext(db, env);

        while (true) {
            const response = await db.list({
                prefix: dir,
                limit: 1000,
                cursor: cursor
            });

            // 检查响应格式
            if (!response || !response.keys || !Array.isArray(response.keys)) {
                console.error('Invalid response from database list:', response);
                break;
            }

            cursor = response.cursor;

            for (const item of response.keys) {
                // 跳过管理相关的键
                if (item.name.startsWith('manage@') || item.name.startsWith('chunk_')) {
                    continue;
                }

                // 跳过没有元数据的文件
                if (!item.metadata || !item.metadata.TimeStamp) {
                    continue;
                }

                if (!passesFallbackFilters(item.metadata, filters)) {
                    continue;
                }

                allRecords.push(await serializeFileRecordForManagement(db, env, item, metadataViewContext));
            }

            if (!cursor) break;

            // 添加协作点
            await new Promise(resolve => setTimeout(resolve, 10));
        }

        if (filters.includeSubdirFiles) {
            return {
                files: allRecords,
                directories: [],
                totalCount: allRecords.length,
                directFileCount: allRecords.length,
                directFolderCount: 0,
                returnedCount: allRecords.length
            };
        }

        // 提取目录信息
        const directories = new Set();
        const filteredRecords = [];
        allRecords.forEach(item => {
            const subDir = item.name.substring(dir.length);
            const firstSlashIndex = subDir.indexOf('/');
            if (firstSlashIndex !== -1) {
                directories.add(dir + subDir.substring(0, firstSlashIndex));
            } else {
                filteredRecords.push(item);
            }
        });

        return {
            files: filteredRecords,
            directories: Array.from(directories),
            totalCount: allRecords.length,
            directFileCount: filteredRecords.length,
            directFolderCount: directories.size,
            returnedCount: filteredRecords.length
        };

    } catch (error) {
        console.error('Error in getAllFileRecords:', error);
        return {
            files: [],
            directories: [],
            totalCount: 0,
            directFileCount: 0,
            directFolderCount: 0,
            returnedCount: 0,
            error: error.message
        };
    }
}

function passesFallbackFilters(metadata = {}, filters = {}) {
    const listTypeArr = filters.listType || [];
    if (listTypeArr.length > 0) {
        const fileListType = metadata.ListType;
        const listTypeMatched = listTypeArr.some(lt => {
            if (lt === 'None') {
                return !fileListType || fileListType === '' || fileListType === 'None';
            }
            return fileListType === lt;
        });
        if (!listTypeMatched) return false;
    } else if (metadata.ListType === 'Trash') {
        return false;
    }

    const sourceGroupArr = filters.sourceGroup || [];
    if (sourceGroupArr.length > 0 && !sourceGroupArr.includes(getSourceGroupKey(metadata))) {
        return false;
    }

    const fileTags = (metadata.Tags || []).map(tag => String(tag).toLowerCase());
    const includeTags = filters.includeTags || [];
    if (includeTags.some(tag => !fileTags.includes(String(tag).toLowerCase()))) {
        return false;
    }

    const excludeTags = filters.excludeTags || [];
    if (excludeTags.some(tag => fileTags.includes(String(tag).toLowerCase()))) {
        return false;
    }

    return true;
}
