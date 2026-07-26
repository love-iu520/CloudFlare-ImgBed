import assert from 'node:assert/strict';

import { onRequest as randomRequest } from '../functions/random/index.js';
import { purgePublicFileListCache, purgeRandomFileListCache } from '../functions/utils/purgeCache.js';

class FakeKV {
  constructor(entries = []) {
    this.store = new Map(entries);
  }

  async get(key) {
    return this.store.get(key) ?? null;
  }

  async put(key, value) {
    this.store.set(key, value);
  }

  async delete(key) {
    return this.store.delete(key);
  }

  async list(options = {}) {
    const prefix = options.prefix || '';
    const keys = [...this.store.keys()]
      .filter(key => key.startsWith(prefix))
      .sort()
      .map(name => ({ name }));

    return {
      keys,
      cursor: undefined,
      list_complete: true,
    };
  }
}

class FakeCache {
  constructor() {
    this.store = new Map();
    this.matchCalls = [];
    this.putCalls = [];
    this.deleteCalls = [];
    this.deleteResult = true;
  }

  seed(key, records) {
    this.store.set(key, new Response(JSON.stringify(records), {
      headers: { 'Content-Type': 'application/json' },
    }));
  }

  async match(key) {
    const normalizedKey = String(key);
    this.matchCalls.push(normalizedKey);
    return this.store.get(normalizedKey)?.clone() ?? undefined;
  }

  async put(...args) {
    const [key, response] = args;
    const normalizedKey = String(key);
    this.putCalls.push({
      key: normalizedKey,
      response: response.clone(),
      argumentCount: args.length,
    });
    this.store.set(normalizedKey, response.clone());
  }

  async delete(key) {
    const normalizedKey = String(key);
    this.deleteCalls.push(normalizedKey);
    if (this.deleteResult) {
      this.store.delete(normalizedKey);
    }
    return this.deleteResult;
  }
}

function createEnv({ allowedDir = '', files = [], settingsValue } = {}) {
  const settings = settingsValue ?? JSON.stringify({
    randomImageAPI: {
      enabled: true,
      allowedDir,
    },
  });
  const indexFiles = files.map(file => {
    const lastSlash = file.id.lastIndexOf('/');
    return {
      id: file.id,
      metadata: {
        FileType: file.fileType || 'image/jpeg',
        Directory: lastSlash === -1 ? '' : file.id.slice(0, lastSlash + 1),
        ListType: 'None',
      },
    };
  });

  return {
    img_url: new FakeKV([
      ['manage@sysConfig@others', settings],
      ['manage@index@meta', JSON.stringify({
        lastUpdated: 1710000000000,
        totalCount: indexFiles.length,
        lastOperationId: null,
        chunkCount: 1,
        chunkSize: 5000,
      })],
      ['manage@index_0', JSON.stringify(indexFiles)],
    ]),
  };
}

function createContext(url, env, waitUntilPromises = []) {
  return {
    request: new Request(url),
    env,
    waitUntil(promise) {
      waitUntilPromises.push(Promise.resolve(promise));
    },
  };
}

describe('random API', () => {
  const originalCaches = globalThis.caches;
  const originalFetch = globalThis.fetch;
  const originalRandom = Math.random;

  afterEach(() => {
    if (originalCaches === undefined) {
      delete globalThis.caches;
    } else {
      globalThis.caches = originalCaches;
    }
    globalThis.fetch = originalFetch;
    Math.random = originalRandom;
  });

  it('uses every allowed directory with one root index read when dir is omitted', async () => {
    const cache = new FakeCache();
    const env = createEnv({
      allowedDir: ' gallery, /wallpapers/, gallery/nested ',
      files: [
        { id: 'gallery/a.jpg' },
        { id: 'gallery/nested/b.jpg' },
        { id: 'wallpapers/c.jpg' },
        { id: 'private/hidden.jpg' },
      ],
    });
    const waitUntilPromises = [];
    const randomValues = [0, 0.999];
    globalThis.caches = { default: cache };
    Math.random = () => randomValues.shift();

    const firstResponse = await randomRequest(createContext(
      'https://img.example/random',
      env,
      waitUntilPromises
    ));
    const secondResponse = await randomRequest(createContext(
      'https://img.example/random',
      env,
      waitUntilPromises
    ));

    assert.deepEqual(await firstResponse.json(), { url: '/file/gallery/a.jpg' });
    assert.deepEqual(await secondResponse.json(), { url: '/file/wallpapers/c.jpg' });
    assert.deepEqual(cache.matchCalls.slice(0, 1), [
      'https://img.example/api/randomFileList?dir=',
    ]);
    assert.equal(cache.putCalls.length, 1);
    assert.ok(cache.putCalls.every(call => call.argumentCount === 2));
    assert.ok(cache.putCalls.every(
      call => call.response.headers.get('Cache-Control') === 'public, max-age=86400'
    ));
    assert.equal(waitUntilPromises.length, 1);
    await Promise.all(waitUntilPromises);
  });

  it('rejects an explicit directory outside a non-empty allowlist', async () => {
    const cache = new FakeCache();
    const env = createEnv({ allowedDir: 'gallery' });
    globalThis.caches = { default: cache };

    const response = await randomRequest(createContext(
      'https://img.example/random?dir=private',
      env
    ));

    assert.equal(response.status, 403);
    assert.deepEqual(await response.json(), { error: 'Directory not allowed' });
    assert.equal(cache.matchCalls.length, 0);
  });

  it('allows all directories when the allowlist is blank', async () => {
    const cache = new FakeCache();
    const env = createEnv({
      allowedDir: '  , ',
      files: [{ id: 'private/visible.jpg' }],
    });
    globalThis.caches = { default: cache };
    Math.random = () => 0;

    const response = await randomRequest(createContext('https://img.example/random', env));

    assert.deepEqual(await response.json(), { url: '/file/private/visible.jpg' });
    assert.deepEqual(cache.matchCalls, ['https://img.example/api/randomFileList?dir=']);
    assert.equal(response.headers.get('Cache-Control'), 'no-store, max-age=0');
  });

  it('fails closed instead of throwing when random image configuration cannot be loaded', async () => {
    const originalConsoleError = console.error;
    console.error = () => {};

    try {
      const response = await randomRequest(createContext('https://img.example/random', {
        img_url: {
          async get() {
            throw new Error('broken settings');
          },
        },
      }));

      assert.equal(response.status, 403);
      assert.deepEqual(await response.json(), { error: 'Random is disabled' });
    } finally {
      console.error = originalConsoleError;
    }
  });

  it('streams type=img responses while preserving upstream status and headers', async () => {
    const cache = new FakeCache();
    const env = createEnv({ allowedDir: '' });
    cache.seed('https://img.example/api/randomFileList?dir=', [{
      name: 'gallery/a.png',
      FileType: 'image/png',
    }]);
    globalThis.caches = { default: cache };
    Math.random = () => 0;

    const upstreamBody = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('streamed-image'));
        controller.close();
      },
    });
    const upstreamResponse = new Response(upstreamBody, {
      status: 206,
      statusText: 'Partial Content',
      headers: {
        'Content-Type': 'image/png',
        'Content-Range': 'bytes 0-13/100',
        'ETag': 'random-image-etag',
        'Cache-Control': 'public, max-age=3600',
      },
    });
    upstreamResponse.blob = async () => {
      throw new Error('image body must not be buffered as a Blob');
    };
    globalThis.fetch = async url => {
      assert.equal(url, 'https://img.example/file/gallery/a.png');
      return upstreamResponse;
    };

    const response = await randomRequest(createContext(
      'https://img.example/random?type=img',
      env
    ));

    assert.equal(response.status, 206);
    assert.equal(response.statusText, 'Partial Content');
    assert.equal(response.body, upstreamBody);
    assert.equal(response.headers.get('Content-Type'), 'image/png');
    assert.equal(response.headers.get('Content-Range'), 'bytes 0-13/100');
    assert.equal(response.headers.get('ETag'), 'random-image-etag');
    assert.equal(response.headers.get('Cache-Control'), 'no-store, max-age=0');
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), '*');
    assert.equal(await response.text(), 'streamed-image');
  });
});

describe('random candidate cache purge', () => {
  const originalCaches = globalThis.caches;

  afterEach(() => {
    if (originalCaches === undefined) {
      delete globalThis.caches;
    } else {
      globalThis.caches = originalCaches;
    }
  });

  it('deletes the root and every unique directory ancestor', async () => {
    const cache = new FakeCache();
    globalThis.caches = { default: cache };

    await purgeRandomFileListCache(
      'https://img.example',
      'gallery/2026/summer',
      '/gallery/2026/',
      'gallery\\2026\\summer'
    );

    assert.deepEqual(cache.deleteCalls, [
      'https://img.example/api/randomFileList?dir=',
      'https://img.example/api/randomFileList?dir=gallery',
      'https://img.example/api/randomFileList?dir=gallery/2026',
      'https://img.example/api/randomFileList?dir=gallery/2026/summer',
    ]);
    assert.equal(cache.putCalls.length, 0);
  });

  it('falls back to an immediately expired response when cache.delete is ineffective', async () => {
    const cache = new FakeCache();
    cache.deleteResult = false;
    globalThis.caches = { default: cache };

    await purgeRandomFileListCache('https://img.example', 'gallery');

    assert.deepEqual(cache.deleteCalls, [
      'https://img.example/api/randomFileList?dir=',
      'https://img.example/api/randomFileList?dir=gallery',
    ]);
    assert.equal(cache.putCalls.length, 2);
    assert.ok(cache.putCalls.every(call => call.argumentCount === 2));
    assert.ok(cache.putCalls.every(
      call => call.response.headers.get('Cache-Control') === 'max-age=0'
    ));
  });
});

describe('public list cache purge', () => {
  const originalCaches = globalThis.caches;

  afterEach(() => {
    if (originalCaches === undefined) {
      delete globalThis.caches;
    } else {
      globalThis.caches = originalCaches;
    }
  });

  it('invalidates the exact non-recursive list and every recursive ancestor', async () => {
    const cache = new FakeCache();
    globalThis.caches = { default: cache };

    await purgePublicFileListCache('https://img.example', 'gallery/2026/summer');

    assert.deepEqual(cache.deleteCalls, [
      'https://img.example/api/publicFileList?dir=gallery/2026/summer&recursive=false',
      'https://img.example/api/publicFileList?dir=&recursive=true',
      'https://img.example/api/publicFileList?dir=gallery&recursive=true',
      'https://img.example/api/publicFileList?dir=gallery/2026&recursive=true',
      'https://img.example/api/publicFileList?dir=gallery/2026/summer&recursive=true',
    ]);
  });
});
