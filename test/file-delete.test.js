import assert from 'node:assert/strict';

import { onRequest as deleteRequest } from '../functions/api/manage/delete/[[path]].js';

class FakeKV {
  constructor(records = {}, options = {}) {
    this.store = new Map();
    this.failDeleteKeys = new Set(options.failDeleteKeys || []);
    this.failIndexOperationPuts = options.failIndexOperationPuts === true;
    this.failReads = options.failReads === true;

    for (const [key, record] of Object.entries(records)) {
      this.store.set(key, {
        value: record.value ?? '',
        metadata: structuredClone(record.metadata || {}),
      });
    }
  }

  async get(key) {
    if (this.failReads) throw new Error('database read failed');
    return this.store.get(key)?.value ?? null;
  }

  async getWithMetadata(key) {
    if (this.failReads) throw new Error('database read failed');
    const record = this.store.get(key);
    if (!record) return { value: null, metadata: null };
    return {
      value: record.value,
      metadata: structuredClone(record.metadata || {}),
    };
  }

  async put(key, value, options = {}) {
    if (this.failIndexOperationPuts && key.startsWith('manage@index@operation_')) {
      throw new Error('index operation write failed');
    }

    const existing = this.store.get(key);
    this.store.set(key, {
      value,
      metadata: structuredClone(options.metadata ?? existing?.metadata ?? {}),
    });
  }

  async delete(key) {
    if (this.failDeleteKeys.has(key)) {
      throw new Error('database delete failed');
    }
    return this.store.delete(key);
  }

  async list(options = {}) {
    const prefix = options.prefix || '';
    return {
      keys: [...this.store.entries()]
        .filter(([key]) => key.startsWith(prefix))
        .map(([name, record]) => ({
          name,
          metadata: structuredClone(record.metadata || {}),
        })),
      cursor: undefined,
      list_complete: true,
    };
  }

  getRecord(key) {
    const record = this.store.get(key);
    return record
      ? { value: record.value, metadata: structuredClone(record.metadata || {}) }
      : null;
  }

  getIndexOperations() {
    return [...this.store.entries()]
      .filter(([key]) => key.startsWith('manage@index@operation_'))
      .map(([, record]) => JSON.parse(record.value));
  }
}

class FakeCache {
  constructor() {
    this.deletedKeys = [];
  }

  async delete(key) {
    this.deletedKeys.push(String(key));
    return true;
  }

  async put() {}
}

function telegramMetadata() {
  return {
    Channel: 'TelegramNew',
    ListType: 'Trash',
    TgMessageId: 42,
    TimeStamp: 1710000000000,
  };
}

async function requestFileDelete(fileId, kv, options = {}) {
  const query = new URLSearchParams();
  if (options.permanent !== false) query.set('permanent', 'true');
  if (options.force) query.set('force', 'true');
  if (options.folder) query.set('folder', 'true');

  const encodedPath = encodeURIComponent(fileId.split('/').join(','));
  const queryString = query.toString();
  const waitUntilPromises = [];
  const response = await deleteRequest({
    request: new Request(`https://img.example/api/manage/delete/${encodedPath}${queryString ? `?${queryString}` : ''}`, {
      method: 'DELETE',
    }),
    env: {
      img_url: kv,
      TG_BOT_TOKEN: 'test-token',
      TG_CHAT_ID: '-100123',
      ...options.env,
    },
    params: { path: encodedPath },
    waitUntil(promise) {
      waitUntilPromises.push(Promise.resolve(promise));
    },
  });

  await Promise.all(waitUntilPromises);
  return {
    response,
    body: await response.json(),
  };
}

describe('single file permanent deletion', () => {
  const originalCaches = globalThis.caches;
  const originalFetch = globalThis.fetch;
  const originalConsole = {
    error: console.error,
    log: console.log,
    warn: console.warn,
  };

  beforeEach(() => {
    globalThis.caches = { default: new FakeCache() };
    console.error = () => {};
    console.log = () => {};
    console.warn = () => {};
  });

  afterEach(() => {
    if (originalCaches === undefined) {
      delete globalThis.caches;
    } else {
      globalThis.caches = originalCaches;
    }
    globalThis.fetch = originalFetch;
    console.error = originalConsole.error;
    console.log = originalConsole.log;
    console.warn = originalConsole.warn;
  });

  it('returns a forceable Telegram error without deleting local state', async () => {
    const fileId = 'album/old.jpg';
    const kv = new FakeKV({
      [fileId]: { value: 'telegram-file-id', metadata: telegramMetadata() },
    });
    globalThis.fetch = async () => new Response(JSON.stringify({
      ok: false,
      description: "Bad Request: message can't be deleted",
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });

    const { response, body } = await requestFileDelete(fileId, kv);

    assert.equal(response.status, 409);
    assert.equal(body.success, false);
    assert.equal(body.code, 'TELEGRAM_DELETE_FAILED');
    assert.equal(body.provider, 'telegram');
    assert.equal(body.forceable, true);
    assert.notEqual(kv.getRecord(fileId), null);
    assert.deepEqual(kv.getIndexOperations(), []);
    assert.deepEqual(globalThis.caches.default.deletedKeys, []);
  });

  it('removes local state after a confirmed force retry', async () => {
    const fileId = 'album/old.jpg';
    const kv = new FakeKV({
      [fileId]: { value: 'telegram-file-id', metadata: telegramMetadata() },
    });
    globalThis.fetch = async () => new Response(JSON.stringify({
      ok: false,
      description: "Bad Request: message can't be deleted",
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });

    const { response, body } = await requestFileDelete(fileId, kv, { force: true });

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.forced, true);
    assert.equal(body.remoteDeleted, false);
    assert.equal(body.localDeleted, true);
    assert.equal(body.indexRemoved, true);
    assert.equal(body.warningCode, 'TELEGRAM_REMOTE_DELETE_SKIPPED');
    assert.equal(kv.getRecord(fileId), null);
    assert.equal(kv.getIndexOperations().length, 1);
    assert.equal(kv.getIndexOperations()[0].type, 'remove');
    assert.equal(kv.getIndexOperations()[0].data.fileId, fileId);
    assert.ok(globalThis.caches.default.deletedKeys.length > 0);
  });

  it('does not let force hide a local database deletion failure', async () => {
    const fileId = 'album/old.jpg';
    const kv = new FakeKV({
      [fileId]: { value: 'telegram-file-id', metadata: telegramMetadata() },
    }, {
      failDeleteKeys: [fileId],
    });
    globalThis.fetch = async () => new Response(JSON.stringify({
      ok: false,
      description: "Bad Request: message can't be deleted",
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });

    const { response, body } = await requestFileDelete(fileId, kv, { force: true });

    assert.equal(response.status, 400);
    assert.equal(body.success, false);
    assert.equal(body.code, 'DELETE_FILE_FAILED');
    assert.equal(body.forceable, false);
    assert.notEqual(kv.getRecord(fileId), null);
    assert.deepEqual(kv.getIndexOperations(), []);
  });

  it('reports a partial failure when forced index cleanup cannot be persisted', async () => {
    const fileId = 'album/old.jpg';
    const kv = new FakeKV({
      [fileId]: { value: 'telegram-file-id', metadata: telegramMetadata() },
    }, {
      failIndexOperationPuts: true,
    });
    globalThis.fetch = async () => new Response(JSON.stringify({
      ok: false,
      description: "Bad Request: message can't be deleted",
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });

    const { response, body } = await requestFileDelete(fileId, kv, { force: true });

    assert.equal(response.status, 500);
    assert.equal(body.success, false);
    assert.equal(body.partial, true);
    assert.equal(body.code, 'INDEX_REMOVE_FAILED');
    assert.equal(body.localDeleted, true);
    assert.equal(body.indexRemoved, false);
    assert.equal(kv.getRecord(fileId), null);
    assert.deepEqual(kv.getIndexOperations(), []);
  });

  it('does not let force hide an R2 deletion failure', async () => {
    const fileId = 'album/r2.jpg';
    const kv = new FakeKV({
      [fileId]: {
        value: '',
        metadata: { Channel: 'CloudflareR2', ListType: 'Trash' },
      },
    });
    const env = {
      img_r2: {
        async delete() {
          throw new Error('R2 unavailable');
        },
      },
    };

    const { response, body } = await requestFileDelete(fileId, kv, { force: true, env });

    assert.equal(response.status, 400);
    assert.equal(body.success, false);
    assert.equal(body.code, 'DELETE_FILE_FAILED');
    assert.notEqual(kv.getRecord(fileId), null);
    assert.deepEqual(kv.getIndexOperations(), []);
  });

  it('treats a missing database record as an idempotent delete and cleans the index', async () => {
    const fileId = 'album/missing.jpg';
    const kv = new FakeKV();

    const { response, body } = await requestFileDelete(fileId, kv);

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(kv.getIndexOperations().length, 1);
    assert.equal(kv.getIndexOperations()[0].data.fileId, fileId);
  });

  it('rejects force for soft deletes and folder deletes', async () => {
    const kv = new FakeKV();

    const softDelete = await requestFileDelete('album/a.jpg', kv, {
      force: true,
      permanent: false,
    });
    const folderDelete = await requestFileDelete('album', kv, {
      force: true,
      folder: true,
    });

    assert.equal(softDelete.response.status, 400);
    assert.equal(softDelete.body.code, 'INVALID_FORCE_SCOPE');
    assert.equal(folderDelete.response.status, 400);
    assert.equal(folderDelete.body.code, 'INVALID_FORCE_SCOPE');
  });
});
