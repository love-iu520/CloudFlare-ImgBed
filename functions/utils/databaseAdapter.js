/**
 * 数据库适配器
 * 提供统一的接口，可以在KV和D1之间切换
 */

import { D1Database } from './d1Database.js';

/**
 * 创建数据库适配器
 * @param {Object} env - 环境变量
 * @returns {Object} 数据库适配器实例
 */
export function createDatabaseAdapter(env) {
    // 检查是否配置了数据库
    if (env.img_url && typeof env.img_url.get === 'function') {
        // 使用KV存储
        return new KVAdapter(env.img_url);
    } else if (env.img_d1 && typeof env.img_d1.prepare === 'function') {
        // 使用D1数据库
        return new D1Database(env.img_d1);
    } else {
        console.error('No database configured. Please configure either KV (env.img_url) or D1 (env.img_d1).');
        return null;
    }
}

/**
 * KV适配器类
 * 保持与原有KV接口的兼容性
 */
class KVAdapter {
    constructor(kv) {
        this.kv = kv;
    }

    // 直接代理到KV的方法
    async put(key, value, options) {
        options = options || {};
        return await this.kv.put(key, value, options);
    }

    async get(key, options) {
        options = options || {};
        return await this.kv.get(key, options);
    }

    async getWithMetadata(key, options) {
        options = options || {};
        return await this.kv.getWithMetadata(key, options);
    }

    async delete(key, options) {
        options = options || {};
        return await this.kv.delete(key, options);
    }

    async list(options) {
        options = options || {};
        return await this.kv.list(options);
    }

    // 为了兼容性，添加一些别名方法
    async putFile(fileId, value, options) {
        return await this.put(fileId, value, options);
    }

    async getFile(fileId, options) {
        const result = await this.getWithMetadata(fileId, options);
        return result;
    }

    async getFileWithMetadata(fileId, options) {
        return await this.getWithMetadata(fileId, options);
    }

    async deleteFile(fileId, options) {
        return await this.delete(fileId, options);
    }

    async listFiles(options) {
        return await this.list(options);
    }

    async putSetting(key, value, options) {
        return await this.put(key, value, options);
    }

    async getSetting(key, options) {
        return await this.get(key, options);
    }

    async deleteSetting(key, options) {
        return await this.delete(key, options);
    }

    async listSettings(options) {
        return await this.list(options);
    }

    async putIndexOperation(operationId, operation, options) {
        const key = 'manage@index@operation_' + operationId;
        return await this.put(key, JSON.stringify(operation), options);
    }

    async getIndexOperation(operationId, options) {
        const key = 'manage@index@operation_' + operationId;
        const result = await this.get(key, options);
        return result ? JSON.parse(result) : null;
    }

    async deleteIndexOperation(operationId, options) {
        const key = 'manage@index@operation_' + operationId;
        return await this.delete(key, options);
    }

    async listIndexOperations(options) {
        const listOptions = Object.assign({}, options, {
            prefix: 'manage@index@operation_'
        });
        const result = await this.list(listOptions);
        
        // 转换格式以匹配D1Database的返回格式
        const operations = [];
        for (const item of result.keys) {
            const operationData = await this.get(item.name);
            if (operationData) {
                const operation = JSON.parse(operationData);
                operations.push({
                    id: item.name.replace('manage@index@operation_', ''),
                    type: operation.type,
                    timestamp: operation.timestamp,
                    data: operation.data,
                    processed: false // KV中没有这个字段，默认为false
                });
            }
        }
        
        return operations;
    }

    async putShareLink(share) {
        return await this.put(`manage@share@${share.id}`, JSON.stringify(share));
    }

    async getShareLinkById(id) {
        const value = await this.get(`manage@share@${id}`);
        return value ? JSON.parse(value) : null;
    }

    async getShareLinkByTokenHash(tokenHash) {
        let cursor = undefined;
        while (true) {
            const result = await this.list({
                prefix: 'manage@share@',
                limit: 1000,
                cursor,
            });

            for (const item of result.keys || []) {
                const value = await this.get(item.name);
                if (!value) continue;
                const share = JSON.parse(value);
                if (share.tokenHash === tokenHash) {
                    return share;
                }
            }

            cursor = result.cursor;
            if (!cursor || result.list_complete) {
                return null;
            }
        }
    }

    async listShareLinks(options) {
        options = options || {};
        const includeRevoked = options.includeRevoked === true;
        const limit = Math.min(Math.max(parseInt(options.limit, 10) || 100, 1), 1000);
        const shares = [];
        let cursor = options.cursor || undefined;

        while (shares.length < limit) {
            const result = await this.list({
                prefix: 'manage@share@',
                limit: 1000,
                cursor,
            });

            for (const item of result.keys || []) {
                const value = await this.get(item.name);
                if (!value) continue;
                const share = JSON.parse(value);
                if (!includeRevoked && share.revokedAt) continue;
                shares.push(share);
                if (shares.length >= limit) break;
            }

            cursor = result.cursor;
            if (!cursor || result.list_complete || shares.length >= limit) {
                break;
            }
        }

        shares.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        return {
            shares,
            cursor: cursor || null,
            listComplete: !cursor,
        };
    }

    async revokeShareLink(id, revokedAt) {
        const share = await this.getShareLinkById(id);
        if (!share) return null;
        const updated = {
            ...share,
            revokedAt,
            updatedAt: revokedAt,
        };
        await this.putShareLink(updated);
        return updated;
    }

    async incrementShareView(id, viewedAt) {
        const share = await this.getShareLinkById(id);
        if (!share) return null;
        const updated = {
            ...share,
            viewCount: (share.viewCount || 0) + 1,
            lastViewedAt: viewedAt,
            updatedAt: viewedAt,
        };
        await this.putShareLink(updated);
        return updated;
    }
}

/**
 * 获取数据库实例的便捷函数
 * 这个函数可以在整个应用中使用，确保一致的数据库访问
 * @param {Object} env - 环境变量
 * @returns {Object} 数据库实例
 */
export function getDatabase(env) {
    var adapter = createDatabaseAdapter(env);
    if (!adapter) {
        throw new Error('Database not configured. Please configure D1 database (env.img_d1) or KV storage (env.img_url).');
    }
    return adapter;
}

/**
 * 检查数据库配置
 * @param {Object} env - 环境变量
 * @returns {Object} 配置信息
 */
export function checkDatabaseConfig(env) {
    var hasD1 = env.img_d1 && typeof env.img_d1.prepare === 'function';
    var hasKV = env.img_url && typeof env.img_url.get === 'function';

    return {
        hasD1: hasD1,
        hasKV: hasKV,
        usingD1: hasD1,
        usingKV: !hasD1 && hasKV,
        configured: hasD1 || hasKV
    };
}
