import { fetchOthersConfig } from "../utils/sysConfig.js";
import { readIndex } from "../utils/indexManager.js";
import { detectDevice, resolveOrientation, addClientHintsHeaders } from "./adaptive.js";

// CORS 跨域响应头
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
};

export async function onRequest(context) {
    // Contents of context object
    const {
      request, // same as existing Worker API
      env, // same as existing Worker API
      params, // if filename includes [id] or [[path]]
      waitUntil, // same as ctx.waitUntil in existing Worker API
      next, // used for middleware or to fetch assets
      data, // arbitrary space for passing data between middlewares
    } = context;
    const requestUrl = new URL(request.url);

    // 处理 OPTIONS 预检请求
    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    // 读取其他设置
    const othersConfig = await fetchOthersConfig(env);
    const randomImageAPI = othersConfig?.randomImageAPI;
    const allowRandom = randomImageAPI?.enabled === true;
    const allowedDirList = normalizeAllowedDirectories(randomImageAPI?.allowedDir);

    // 检查是否启用了随机图功能
    if (allowRandom != true) {
        return new Response(JSON.stringify({ error: "Random is disabled" }), { status: 403, headers: corsHeaders });
    }

    // 从params中读取返回的文件类型
    let fileType = requestUrl.searchParams.get('content');
    if (fileType == null) {
        fileType = ['image'];
    } else {
        fileType = fileType.split(',');
    }

    // 读取图片方向参数：landscape(横图), portrait(竖图), square(方图), auto(自适应)
    const orientationParam = requestUrl.searchParams.get('orientation') || '';

    // 根据参数值决定行为
    const VALID_ORIENTATIONS = ['landscape', 'portrait', 'square'];
    let orientation = '';
    let isAutoMode = false;

    if (VALID_ORIENTATIONS.includes(orientationParam)) {
        // 手动指定有效方向，直接使用
        orientation = orientationParam;
    } else if (orientationParam === 'auto') {
        // 自适应模式：检测设备并自动决策
        isAutoMode = true;
        const deviceInfo = detectDevice(request);
        orientation = resolveOrientation(deviceInfo);
    }
    // 其他情况（未指定或无效值）：orientation 保持空字符串，不过滤

    // 读取指定文件夹
    const hasDirParam = requestUrl.searchParams.has('dir');
    const dir = normalizeDirectory(requestUrl.searchParams.get('dir'));

    // 白名单留空时允许全部目录；显式指定 dir 时仍校验目录边界。
    if (hasDirParam && allowedDirList.length > 0 && !isDirectoryAllowed(dir, allowedDirList)) {
        return new Response(JSON.stringify({ error: "Directory not allowed" }), { status: 403, headers: corsHeaders });
    }

    // 未传 dir 时只读取一次根候选列表，再按白名单过滤。这样允许多个目录时，
    // 冷请求不会为了每个目录重复加载完整索引。
    let allRecords = await getRandomFileList(context, requestUrl, hasDirParam ? dir : '');
    if (!hasDirParam && allowedDirList.length > 0) {
        allRecords = allRecords.filter(record => isFileInAllowedDirectory(record.name, allowedDirList));
    }

    // 筛选出符合fileType要求的记录
    allRecords = allRecords.filter(item => { return fileType.some(type => item.FileType?.includes(type)) });

    // 保存过滤前的记录，用于自适应模式降级
    const allRecordsBeforeOrientationFilter = allRecords;

    // 根据图片方向筛选
    if (orientation && allRecords.length > 0) {
        const SQUARE_THRESHOLD = 0.1; // 宽高比差异小于10%视为方图
        allRecords = allRecords.filter(item => {
            // 如果没有尺寸信息，跳过该记录
            if (!item.Width || !item.Height) return false;

            const ratio = item.Width / item.Height;
            switch (orientation) {
                case 'landscape': // 横图：宽 > 高
                    return ratio > (1 + SQUARE_THRESHOLD);
                case 'portrait': // 竖图：高 > 宽
                    return ratio < (1 - SQUARE_THRESHOLD);
                case 'square': // 方图：宽 ≈ 高
                    return ratio >= (1 - SQUARE_THRESHOLD) && ratio <= (1 + SQUARE_THRESHOLD);
                default:
                    return true;
            }
        });
    }

    // 自适应模式降级：过滤后无匹配图片时，降级到全部图片
    if (isAutoMode && orientation && allRecords.length === 0) {
        allRecords = allRecordsBeforeOrientationFilter;
    }

    // 构建响应头：添加 CORS 跨域响应头，自适应模式下添加 Client Hints 协商头
    const responseHeaders = new Headers(corsHeaders);
    responseHeaders.set('Cache-Control', 'no-store, max-age=0');
    if (isAutoMode) {
        addClientHintsHeaders(responseHeaders);
    }

    if (allRecords.length == 0) {
        return new Response(JSON.stringify({}), { status: 200, headers: responseHeaders });
    } else {
        const randomIndex = Math.floor(Math.random() * allRecords.length);
        const randomKey = allRecords[randomIndex];
        const randomPath = '/file/' + randomKey.name;
        let randomUrl = randomPath;

        const randomType = requestUrl.searchParams.get('type');
        const resType = requestUrl.searchParams.get('form');
        
        // if param 'type' is set to 'url', return the full URL
        if (randomType == 'url') {
            randomUrl = requestUrl.origin + randomPath;
        }

        // if param 'type' is set to 'img', return the image
        if (randomType == 'img') {
            randomUrl = requestUrl.origin + randomPath;
            const upstreamResponse = await fetch(randomUrl);
            const imgHeaders = new Headers(upstreamResponse.headers);
            for (const [header, value] of Object.entries(corsHeaders)) {
                imgHeaders.set(header, value);
            }
            if (!imgHeaders.has('Content-Type')) {
                imgHeaders.set('Content-Type', 'image/jpeg');
            }
            imgHeaders.set('Cache-Control', 'no-store, max-age=0');

            return new Response(upstreamResponse.body, {
                headers: imgHeaders,
                status: upstreamResponse.status,
                statusText: upstreamResponse.statusText,
            });
        }
        
        if (resType == 'text') {
            return new Response(randomUrl, { status: 200, headers: responseHeaders });
        } else {
            return new Response(JSON.stringify({ url: randomUrl }), { status: 200, headers: responseHeaders });
        }
    }
}

function normalizeDirectory(dir) {
    if (typeof dir !== 'string') return '';
    return dir.trim().replace(/^\/+/, '').replace(/\/{2,}/g, '/').replace(/\/+$/, '');
}

function normalizeAllowedDirectories(allowedDir) {
    if (typeof allowedDir !== 'string') return [];
    return [...new Set(allowedDir.split(',').map(normalizeDirectory).filter(Boolean))];
}

function isDirectoryAllowed(dir, allowedDirs) {
    return allowedDirs.some(allowedDir => dir === allowedDir || dir.startsWith(allowedDir + '/'));
}

function isFileInAllowedDirectory(fileName, allowedDirs) {
    const normalizedName = normalizeDirectory(fileName);
    return allowedDirs.some(allowedDir => normalizedName.startsWith(allowedDir + '/'));
}

async function getRandomFileList(context, url, dir) {
    // 检查缓存中是否有记录，有则直接返回
    const cache = caches.default;
    const cacheKey = `${url.origin}/api/randomFileList?dir=${dir}`;
    const cacheRes = await cache.match(cacheKey);
    if (cacheRes) {
        try {
            const cachedRecords = await cacheRes.json();
            if (Array.isArray(cachedRecords)) {
                return cachedRecords;
            }
        } catch (error) {
            // 忽略损坏或旧版空缓存，重新读取索引。
        }
    }

    const indexResult = await readIndex(context, { directory: dir, count: -1, includeSubdirFiles: true, accessStatus: 'normal' });

    // 仅保留记录的name和metadata中的必要字段
    const allRecords = (indexResult?.files || []).map(item => {
        return {
            name: item.id,
            FileType: item.metadata?.FileType,
            Width: item.metadata?.Width,
            Height: item.metadata?.Height
        }
    });

    // 缓存结果 24 小时，Cloudflare Cache API 通过响应头控制 TTL。
    const cacheWrite = cache.put(cacheKey, new Response(JSON.stringify(allRecords), {
        headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=86400",
        }
    }));
    if (typeof context.waitUntil === 'function') {
        context.waitUntil(cacheWrite);
    } else {
        await cacheWrite;
    }
    
    return allRecords;
}
