import { revokeShare, updateShare } from './index.js';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
};

export async function onRequest(context) {
    const { request, env, params } = context;

    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== 'DELETE' && request.method !== 'PATCH') {
        return new Response(JSON.stringify({
            success: false,
            message: 'Method not allowed',
        }), {
            status: 405,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
    }

    const id = decodeURIComponent(String(params.path || '')).split('/')[0];
    if (request.method === 'PATCH') {
        return await updateShare(request, env, id);
    }

    return await revokeShare(env, id);
}
