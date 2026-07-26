import { fetchOthersConfig } from "./sysConfig.js";

export async function purgeCFCache(env, cdnUrl) {
    try {
        // 读取其他设置
        const othersConfig = await fetchOthersConfig(env);
        const cfZoneId = othersConfig?.cloudflareApiToken?.CF_ZONE_ID;
        const cfEmail = othersConfig?.cloudflareApiToken?.CF_EMAIL;
        const cfApiKey = othersConfig?.cloudflareApiToken?.CF_API_KEY;

        // 如果没有配置Cloudflare API，跳过缓存清除
        if (!cfZoneId || !cfEmail || !cfApiKey) {
            return;
        }

        // 清除CDN缓存
        const options = {
            method: 'POST',
            headers: {'Content-Type': 'application/json', 'X-Auth-Email': `${cfEmail}`, 'X-Auth-Key': `${cfApiKey}`},
            body: `{"files":["${ cdnUrl }"]}`
        };
        await fetch(`https://api.cloudflare.com/client/v4/zones/${ cfZoneId }/purge_cache`, options);
    } catch (error) {
        console.error('Failed to purge CF cache:', error.message || error);
    }
}

export async function purgeRandomFileListCache(origin, ...dirs) {
    try {
        const cache = caches.default;
        const ancestorDirs = new Set();

        for (const dir of dirs) {
            for (const ancestorDir of getDirectoryAncestors(dir)) {
                ancestorDirs.add(ancestorDir);
            }
        }

        // 即使未传目录，也应覆盖根目录缓存。
        if (ancestorDirs.size === 0) {
            ancestorDirs.add('');
        }

        for (const dir of ancestorDirs) {
            const cacheKey = `${origin}/api/randomFileList?dir=${dir}`;
            await deleteCacheEntry(cache, cacheKey);
        }
    } catch (error) {
        console.error('Failed to clear randomFileList cache:', error);
    }
}

function getDirectoryAncestors(dir) {
    const normalizedDir = typeof dir === 'string'
        ? dir.trim().replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/{2,}/g, '/').replace(/\/+$/, '')
        : '';
    const ancestors = [''];

    if (!normalizedDir) {
        return ancestors;
    }

    const segments = normalizedDir.split('/').filter(Boolean);
    for (let index = 1; index <= segments.length; index++) {
        ancestors.push(segments.slice(0, index).join('/'));
    }

    return ancestors;
}

export async function purgePublicFileListCache(origin, ...dirs) {
    try {
        const cache = caches.default;
        const cacheKeys = new Set();

        for (const dir of dirs) {
            const ancestors = getDirectoryAncestors(dir);
            const exactDir = ancestors[ancestors.length - 1];
            cacheKeys.add(`${origin}/api/publicFileList?dir=${exactDir}&recursive=false`);
            for (const ancestor of ancestors) {
                cacheKeys.add(`${origin}/api/publicFileList?dir=${ancestor}&recursive=true`);
            }
        }

        if (cacheKeys.size === 0) {
            cacheKeys.add(`${origin}/api/publicFileList?dir=&recursive=false`);
            cacheKeys.add(`${origin}/api/publicFileList?dir=&recursive=true`);
        }

        for (const cacheKey of cacheKeys) {
            await deleteCacheEntry(cache, cacheKey);
        }
    } catch (error) {
        console.error('Failed to clear publicFileList cache:', error);
    }
}

async function deleteCacheEntry(cache, cacheKey) {
    let deleted = false;

    if (typeof cache.delete === 'function') {
        try {
            deleted = await cache.delete(cacheKey);
        } catch (error) {
            deleted = false;
        }
    }

    // 兼容不支持 delete 或 delete 无效的运行时。
    if (!deleted) {
        await cache.put(cacheKey, new Response(null, {
            headers: { 'Cache-Control': 'max-age=0' },
        }));
    }
}
