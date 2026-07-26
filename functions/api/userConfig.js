/**
 * 用户端页面配置 API
 * 负责读取页面配置并转换为前端可直接使用的用户配置对象
 */
import { fetchPageConfig } from "../utils/sysConfig.js";

const BACKGROUND_CONFIG_IDS = new Set([
    'loginBkImg',
    'uploadBkImg',
    'adminLoginBkImg',
    'adminBkImg',
]);

export function parseUserConfigValue(config) {
    const rawValue = config?.value;
    let parsedValue = rawValue;

    if (typeof rawValue === 'string') {
        const trimmedValue = rawValue.trim();
        try {
            parsedValue = JSON.parse(trimmedValue);
        } catch (error) {
            parsedValue = trimmedValue;
        }
    }

    // 背景管理器历史上只接受 bing 或 URL 数组。这里兼容管理员直接粘贴单个 URL，
    // 避免配置保存成功但主页静默不显示背景。
    if (BACKGROUND_CONFIG_IDS.has(config?.id) && typeof parsedValue === 'string') {
        const normalizedValue = parsedValue.trim();
        if (normalizedValue.toLowerCase() === 'bing') {
            return 'bing';
        }
        if (normalizedValue) {
            return [normalizedValue];
        }
    }

    return parsedValue;
}

export async function onRequest(context) {
    const { env } = context;
    const PageConfig = await fetchPageConfig(env);
    const userConfigList = PageConfig.config || [];
    const userConfig = {};
    
    for (const config of userConfigList) {
        if (config.value !== undefined && config.value !== null && config.value !== '') {
            userConfig[config.id] = parseUserConfigValue(config);
        } else if (config.type === 'boolean' && config.default !== undefined) {
            // 布尔类型使用默认值
            userConfig[config.id] = config.default;
        }
    }

    return new Response(JSON.stringify(userConfig), {
        status: 200,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            // 页面配置修改后必须重新验证，避免浏览器或中间 CDN 返回旧背景配置。
            'Cache-Control': 'no-cache, max-age=0, must-revalidate',
        },
    });
}
