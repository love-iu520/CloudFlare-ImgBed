import { addFileToIndex, FOLDER_PLACEHOLDER_FILE } from '../../utils/indexManager.js';
import { getDatabase } from '../../utils/databaseAdapter.js';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
};

export async function onRequest(context) {
    const { request, env, waitUntil } = context;

    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== 'POST') {
        return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
    }

    try {
        const body = await readJsonBody(request);
        const parent = sanitizeFolderPath(body.parent || '');
        const name = normalizeFolderName(body.name || '');

        if (!name) {
            return jsonResponse({ success: false, error: 'Folder name is required' }, 400);
        }

        const folderPath = parent ? `${parent}/${name}` : name;
        const directory = `${folderPath}/`;
        const placeholderId = `${directory}${FOLDER_PLACEHOLDER_FILE}`;
        const db = getDatabase(env);
        const existing = await db.getWithMetadata(placeholderId);

        if (existing && existing.metadata) {
            return jsonResponse({
                success: true,
                existed: true,
                directory,
                placeholderId,
            });
        }

        const metadata = {
            FileName: FOLDER_PLACEHOLDER_FILE,
            FileType: 'application/x-cfib-folder',
            FileSize: '0.00',
            FileSizeBytes: 0,
            UploadIP: 'FolderCreate',
            UploadAddress: 'Admin',
            ListType: 'None',
            TimeStamp: Date.now(),
            Label: 'None',
            Directory: directory,
            Tags: [],
            Channel: 'FolderPlaceholder',
            FolderPlaceholder: true,
        };

        await db.put(placeholderId, '', { metadata });
        waitUntil(addFileToIndex(context, placeholderId, metadata));

        return jsonResponse({
            success: true,
            existed: false,
            directory,
            placeholderId,
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

function normalizeFolderName(value) {
    return String(value || '')
        .trim()
        .replace(/\.\./g, '_')
        .replace(/[\\\/:\*\?"'<>\|#%\^`~;@&=\+\$,]/g, '_')
        .replace(/\s+/g, ' ')
        .replace(/^\.+|\.+$/g, '')
        .slice(0, 120);
}

function sanitizeFolderPath(value) {
    return String(value || '')
        .trim()
        .replace(/\.\./g, '_')
        .replace(/\\/g, '/')
        .replace(/\/{2,}/g, '/')
        .replace(/^\/+|\/+$/g, '')
        .split('/')
        .map(part => normalizeFolderName(part))
        .filter(Boolean)
        .join('/');
}

function jsonResponse(body, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
}
