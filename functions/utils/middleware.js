import sentryPlugin from "@cloudflare/pages-plugin-sentry";
import '@sentry/tracing';
import { fetchOthersConfig } from "./sysConfig.js";
import { checkDatabaseConfig as checkDbConfig } from './databaseAdapter.js';
import { createLogger } from './logger.js';

const logger = createLogger('middleware');
const DEFAULT_SAMPLE_RATE = 0.001;
const SAMPLE_RATE_CACHE_TTL_MS = 10 * 60 * 1000;
const SAMPLE_RATE_TIMEOUT_MS = 1000;
const sampleRateCache = {
  value: DEFAULT_SAMPLE_RATE,
  expiresAt: 0,
  pending: null,
};

export async function errorHandling(context) {
  // 读取KV中的设置
  const othersConfig = await fetchOthersConfig(context.env);
  const telemetryEnabled = othersConfig.telemetry?.enabled === true;
  context.data.othersConfig = othersConfig;
  context.data.telemetry = telemetryEnabled;

  const env = context.env;
  if (telemetryEnabled) {
    const configuredSampleRate = Number(env.sampleRate);
    const sampleRate = Number.isFinite(configuredSampleRate)
      ? configuredSampleRate
      : getCachedSampleRate(context);
    return sentryPlugin({
      dsn: "https://44b7b443108ec6d298044b125ff89d28@o4507644548022272.ingest.us.sentry.io/4507644555100160",
      tracesSampleRate: sampleRate,
    })(context);;
  }

  return context.next();
}

export async function telemetryData(context) {
  // errorHandling 已读取并记录遥测开关，避免同一上传请求重复访问数据库。
  if (context.data.telemetry === true) {
    try {
      const parsedHeaders = {};
      context.request.headers.forEach((value, key) => {
        parsedHeaders[key] = value
        //check if the value is empty
        if (value.length > 0) {
          context.data.sentry.setTag(key, value);
        }
      });
      const CF = JSON.parse(JSON.stringify(context.request.cf));
      const parsedCF = {};
      for (const key in CF) {
        if (typeof CF[key] == "object") {
          parsedCF[key] = JSON.stringify(CF[key]);
        } else {
          parsedCF[key] = CF[key];
          if (CF[key].length > 0) {
            context.data.sentry.setTag(key, CF[key]);
          }
        }
      }
      const data = {
        headers: parsedHeaders,
        cf: parsedCF,
        url: context.request.url,
        method: context.request.method,
        redirect: context.request.redirect,
      }
      //get the url path
      const urlPath = new URL(context.request.url).pathname;
      const hostname = new URL(context.request.url).hostname;
      context.data.sentry.setTag("path", urlPath);
      context.data.sentry.setTag("url", data.url);
      context.data.sentry.setTag("method", context.request.method);
      context.data.sentry.setTag("redirect", context.request.redirect);
      context.data.sentry.setContext("request", data);
      const transaction = context.data.sentry.startTransaction({ name: `${context.request.method} ${hostname}` });
      //add the transaction to the context
      context.data.transaction = transaction;
      return await context.next();
    } catch (e) {
      logger.warn('Failed to attach telemetry data', e);
    } finally {
      context.data.transaction?.finish();
    }
  }

  return context.next();
}

export async function traceData(context, span, op, name) {
  const data = context.data
  if (data.telemetry) {
    if (span) {
      logger.debug('span finish');
      span.finish();
    } else {
      logger.debug('span start');
      span = await context.data.transaction.startChild(
        { op: op, name: name },
      );
    }
  }
}

function getCachedSampleRate(context) {
  const now = Date.now();
  if (sampleRateCache.expiresAt > now) {
    return sampleRateCache.value;
  }

  if (!sampleRateCache.pending) {
    sampleRateCache.pending = refreshSampleRate()
      .catch((error) => {
        sampleRateCache.expiresAt = Date.now() + 60 * 1000;
        logger.warn('Failed to refresh remote sample rate', error);
      })
      .finally(() => {
        sampleRateCache.pending = null;
      });
  }

  if (typeof context.waitUntil === 'function') {
    context.waitUntil(sampleRateCache.pending);
  }

  // 冷启动时立即使用安全默认值，不让外部遥测接口阻塞上传响应。
  return sampleRateCache.value;
}

async function refreshSampleRate() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SAMPLE_RATE_TIMEOUT_MS);

  try {
    const response = await fetch('https://frozen-sentinel.pages.dev/signal/sampleRate.json', {
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Sample rate request failed with status ${response.status}`);
    }

    const json = await response.json();
    const rate = Number(json.rate);
    if (!Number.isFinite(rate) || rate < 0 || rate > 1) {
      throw new Error('Invalid remote sample rate');
    }

    sampleRateCache.value = rate;
    sampleRateCache.expiresAt = Date.now() + SAMPLE_RATE_CACHE_TTL_MS;
  } finally {
    clearTimeout(timeout);
  }
}

// 检查数据库是否配置
export async function checkDatabaseConfig(context) {
  var env = context.env;

  var dbConfig = checkDbConfig(env);

  if (!dbConfig.configured) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "数据库未配置 / Database not configured",
        message: "请配置 KV 存储 (env.img_url) 或 D1 数据库 (env.img_d1)。 / Please configure KV storage (env.img_url) or D1 database (env.img_d1)."
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }

  // 继续执行
  return await context.next();
}
