import { readIndex } from '../../utils/indexManager.js';
import { getSourceGroup } from '../../utils/sourceGroup.js';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
};

export async function onRequest(context) {
    if (context.request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const result = await readIndex(context, { count: -1, includeSubdirFiles: true });
        if (!result.success) {
            throw new Error('Failed to read index');
        }

        const groupsByKey = new Map();
        for (const file of result.files) {
            const group = getSourceGroup(file.metadata);
            if (!group) continue;

            const current = groupsByKey.get(group.key) || {
                type: group.type,
                key: group.key,
                name: group.name,
                displayName: `${group.type}/${group.name}`,
                count: 0,
            };
            current.count += 1;
            groupsByKey.set(group.key, current);
        }

        const groups = Array.from(groupsByKey.values())
            .sort((a, b) => a.displayName.localeCompare(b.displayName));

        return jsonResponse({ success: true, groups });
    } catch (error) {
        return jsonResponse({ success: false, error: error.message }, 500);
    }
}

function jsonResponse(body, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
}
