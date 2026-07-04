import {
    addFileToIndex,
    batchAddFilesToIndex,
    batchRemoveFilesFromIndex,
    removeFileFromIndex,
} from '../../../../utils/indexManager.js';
import { getDatabase } from '../../../../utils/databaseAdapter.js';
import { purgeCFCache, purgeRandomFileListCache, purgePublicFileListCache } from '../../../../utils/purgeCache.js';
import { cleanPersistedMetadata } from '../../../../utils/metadata/metadataSecurity.js';
import { restoreMetadataFromTrash } from '../../../../utils/trash.js';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
};

export async function onRequest(context) {
    const { request, env, params, waitUntil } = context;

    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const folder = url.searchParams.get('folder');

    if (folder === 'true') {
        try {
            params.path = decodeURIComponent(params.path);
            const folderQueue = [{ path: params.path.split(',').join('/') }];
            const restoredFiles = [];
            const indexFiles = [];
            const missingFiles = [];
            const failedFiles = [];

            while (folderQueue.length > 0) {
                const currentFolder = folderQueue.shift();
                const listUrl = new URL(`${url.origin}/api/manage/list?count=-1&listType=Trash&dir=${currentFolder.path}`);
                const listRequest = new Request(listUrl, { headers: request.headers });
                const listResponse = await fetch(listRequest);
                const listData = await listResponse.json();

                for (const file of listData.files || []) {
                    const fileId = file.name;
                    const cdnUrl = `https://${url.hostname}/file/${fileId}`;
                    const result = await restoreFile(env, fileId, cdnUrl, url);

                    if (result.success) {
                        restoredFiles.push(fileId);
                        if (result.metadata) {
                            indexFiles.push({ fileId, metadata: result.metadata });
                        } else if (result.missing) {
                            missingFiles.push(fileId);
                        }
                    } else {
                        failedFiles.push(fileId);
                    }
                }

                for (const dir of listData.directories || []) {
                    folderQueue.push({ path: dir });
                }
            }

            if (indexFiles.length > 0) {
                waitUntil(batchAddFilesToIndex(context, indexFiles));
            }
            if (missingFiles.length > 0) {
                waitUntil(batchRemoveFilesFromIndex(context, missingFiles));
            }

            return jsonResponse({
                success: true,
                restored: restoredFiles,
                failed: failedFiles,
            });
        } catch (e) {
            return jsonResponse({ success: false, error: e.message }, 400);
        }
    }

    try {
        params.path = decodeURIComponent(params.path);
        const fileId = params.path.split(',').join('/');
        const cdnUrl = `https://${url.hostname}/file/${fileId}`;
        const result = await restoreFile(env, fileId, cdnUrl, url);

        if (!result.success) {
            throw new Error('Restore file failed');
        }

        if (result.metadata) {
            waitUntil(addFileToIndex(context, fileId, result.metadata));
        } else if (result.missing) {
            waitUntil(removeFileFromIndex(context, fileId));
        }

        return jsonResponse({
            success: true,
            fileId,
            restored: true,
        });
    } catch (e) {
        return jsonResponse({ success: false, error: e.message }, 400);
    }
}

async function restoreFile(env, fileId, cdnUrl, url) {
    try {
        const db = getDatabase(env);
        const img = await db.getWithMetadata(fileId);

        if (!img) {
            console.warn(`File ${fileId} not found in database, skipping restore`);
            return { success: true, missing: true };
        }

        const metadata = cleanPersistedMetadata(restoreMetadataFromTrash(img.metadata || {}));
        await db.put(fileId, img.value || '', { metadata });

        await purgeFileCaches(env, fileId, cdnUrl, url);

        return { success: true, metadata };
    } catch (e) {
        console.error('Restore file failed:', e);
        return { success: false };
    }
}

async function purgeFileCaches(env, fileId, cdnUrl, url) {
    await purgeCFCache(env, cdnUrl);

    const normalizedFolder = fileId.split('/').slice(0, -1).join('/');
    await purgeRandomFileListCache(url.origin, normalizedFolder);
    await purgePublicFileListCache(url.origin, normalizedFolder);
}

function jsonResponse(body, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
}
