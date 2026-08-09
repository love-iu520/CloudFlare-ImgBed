import assert from 'node:assert/strict';

import { onRequest as deleteRequest } from '../functions/api/manage/delete/[[path]].js';
import { FOLDER_PLACEHOLDER_FILE } from '../functions/utils/indexManager.js';

class FakeKV {
  constructor(records = {}, { failPuts = [], failIndexOperationPuts = false } = {}) {
    this.store = new Map();
    this.failPuts = new Set(failPuts);
    this.failIndexOperationPuts = failIndexOperationPuts;

    for (const [key, record] of Object.entries(records)) {
      this.store.set(key, {
        value: record.value ?? '',
        metadata: structuredClone(record.metadata || {}),
      });
    }
  }

  async get(key) {
    return this.store.get(key)?.value ?? null;
  }

  async getWithMetadata(key) {
    const record = this.store.get(key);
    if (!record) {
      // Cloudflare KV returns a result object whose value and metadata are null.
      return { value: null, metadata: null };
    }

    return {
      value: record.value,
      metadata: structuredClone(record.metadata || {}),
    };
  }

  async put(key, value, options = {}) {
    if (this.failPuts.has(key) || (
      this.failIndexOperationPuts && key.startsWith('manage@index@operation_')
    )) {
      throw new Error(`put failed for ${key}`);
    }

    const existing = this.store.get(key);
    this.store.set(key, {
      value,
      metadata: structuredClone(options.metadata ?? existing?.metadata ?? {}),
    });
  }

  async delete(key) {
    return this.store.delete(key);
  }

  async list(options = {}) {
    const prefix = options.prefix || '';
    const keys = [...this.store.entries()]
      .filter(([key]) => key.startsWith(prefix))
      .map(([name, record]) => ({
        name,
        metadata: structuredClone(record.metadata || {}),
      }));

    return {
      keys,
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
  async delete() {
    return true;
  }

  async put() {}
}

function folderPlaceholderMetadata(directory) {
  return {
    FileName: FOLDER_PLACEHOLDER_FILE,
    FileType: 'application/x-cfib-folder',
    Directory: `${directory}/`,
    ListType: 'None',
    TimeStamp: 1710000000000,
    Channel: 'FolderPlaceholder',
    FolderPlaceholder: true,
  };
}

function fileMetadata(directory, listType = 'None') {
  return {
    FileType: 'image/jpeg',
    Directory: `${directory}/`,
    ListType: listType,
    TimeStamp: 1710000000000,
    Channel: 'External',
  };
}

function installFolderListings(listings) {
  globalThis.fetch = async input => {
    const requestUrl = new URL(input instanceof Request ? input.url : String(input));
    assert.equal(requestUrl.pathname, '/api/manage/list');

    const directory = requestUrl.searchParams.get('dir') || '';
    const listing = listings[directory] || { files: [], directories: [] };
    const status = Number.isInteger(listing.status) ? listing.status : 200;
    const body = Number.isInteger(listing.status) ? (listing.body || {}) : listing;
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  };
}

async function deleteFolder(folderPath, kv) {
  const waitUntilPromises = [];
  const response = await deleteRequest({
    request: new Request(`https://img.example/api/manage/delete/${folderPath}?folder=true`, {
      method: 'DELETE',
    }),
    env: { img_url: kv },
    params: { path: folderPath },
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

function getOperation(operations, type) {
  const matches = operations.filter(operation => operation.type === type);
  assert.equal(matches.length, 1, `expected one ${type} index operation`);
  return matches[0];
}

describe('folder deletion', () => {
  const originalCaches = globalThis.caches;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.caches = { default: new FakeCache() };
  });

  afterEach(() => {
    if (originalCaches === undefined) {
      delete globalThis.caches;
    } else {
      globalThis.caches = originalCaches;
    }
    globalThis.fetch = originalFetch;
  });

  it('removes an empty folder placeholder from both the database and the index', async () => {
    const placeholderId = `empty/${FOLDER_PLACEHOLDER_FILE}`;
    const kv = new FakeKV({
      [placeholderId]: {
        metadata: folderPlaceholderMetadata('empty'),
      },
    });
    installFolderListings({
      empty: { files: [], directories: [] },
    });

    const { body } = await deleteFolder('empty', kv);

    assert.equal(body.success, true);
    assert.equal(body.partial, false);
    assert.deepEqual(body.trashed, []);
    assert.deepEqual(body.failed, []);
    assert.equal(kv.getRecord(placeholderId), null);

    const removeOperation = getOperation(kv.getIndexOperations(), 'batch_remove');
    assert.deepEqual(removeOperation.data.fileIds, [placeholderId]);
  });

  it('cleans a ghost folder whose database placeholder is already missing', async () => {
    const placeholderId = `ghost/${FOLDER_PLACEHOLDER_FILE}`;
    const kv = new FakeKV();
    installFolderListings({
      ghost: { files: [], directories: [] },
    });

    const { body } = await deleteFolder('ghost', kv);

    assert.equal(body.success, true);
    assert.equal(body.partial, false);
    assert.deepEqual(body.trashed, []);
    assert.deepEqual(body.failed, []);

    const removeOperation = getOperation(kv.getIndexOperations(), 'batch_remove');
    assert.deepEqual(removeOperation.data.fileIds, [placeholderId]);
  });

  it('soft-deletes files recursively and removes every folder placeholder from the index', async () => {
    const rootPlaceholder = `album/${FOLDER_PLACEHOLDER_FILE}`;
    const nestedPlaceholder = `album/nested/${FOLDER_PLACEHOLDER_FILE}`;
    const rootFile = 'album/root.jpg';
    const nestedFile = 'album/nested/child.jpg';
    const kv = new FakeKV({
      [rootPlaceholder]: { metadata: folderPlaceholderMetadata('album') },
      [nestedPlaceholder]: { metadata: folderPlaceholderMetadata('album/nested') },
      [rootFile]: { value: 'root', metadata: fileMetadata('album', 'White') },
      [nestedFile]: { value: 'child', metadata: fileMetadata('album/nested', 'Block') },
    });
    installFolderListings({
      album: {
        files: [{ name: rootFile }],
        directories: ['album/nested'],
      },
      'album/nested': {
        files: [{ name: nestedFile }],
        directories: [],
      },
    });

    const { body } = await deleteFolder('album', kv);

    assert.equal(body.success, true);
    assert.equal(body.partial, false);
    assert.deepEqual(body.trashed, [rootFile, nestedFile]);
    assert.deepEqual(body.failed, []);
    assert.equal(kv.getRecord(rootPlaceholder), null);
    assert.equal(kv.getRecord(nestedPlaceholder), null);
    assert.equal(kv.getRecord(rootFile).metadata.ListType, 'Trash');
    assert.equal(kv.getRecord(rootFile).metadata.Trash.originalListType, 'White');
    assert.equal(kv.getRecord(nestedFile).metadata.ListType, 'Trash');
    assert.equal(kv.getRecord(nestedFile).metadata.Trash.originalListType, 'Block');

    const operations = kv.getIndexOperations();
    const addOperation = getOperation(operations, 'batch_add');
    assert.deepEqual(
      addOperation.data.files.map(file => file.fileId).sort(),
      [nestedFile, rootFile].sort()
    );
    const removeOperation = getOperation(operations, 'batch_remove');
    assert.deepEqual(
      removeOperation.data.fileIds.sort(),
      [nestedPlaceholder, rootPlaceholder].sort()
    );
  });

  it('reports partial failure while preserving successful trash and index updates', async () => {
    const placeholderId = `partial/${FOLDER_PLACEHOLDER_FILE}`;
    const goodFile = 'partial/good.jpg';
    const failedFile = 'partial/failed.jpg';
    const kv = new FakeKV({
      [placeholderId]: { metadata: folderPlaceholderMetadata('partial') },
      [goodFile]: { value: 'good', metadata: fileMetadata('partial') },
      [failedFile]: { value: 'failed', metadata: fileMetadata('partial') },
    }, {
      failPuts: [failedFile],
    });
    installFolderListings({
      partial: {
        files: [{ name: goodFile }, { name: failedFile }],
        directories: [],
      },
    });

    const originalConsoleError = console.error;
    console.error = () => {};
    let result;
    try {
      result = await deleteFolder('partial', kv);
    } finally {
      console.error = originalConsoleError;
    }

    assert.equal(result.response.status, 200);
    assert.equal(result.body.success, false);
    assert.equal(result.body.partial, true);
    assert.deepEqual(result.body.failed, [failedFile]);
    assert.deepEqual(result.body.trashed, [goodFile]);
    assert.equal(kv.getRecord(goodFile).metadata.ListType, 'Trash');
    assert.equal(kv.getRecord(failedFile).metadata.ListType, 'None');

    const operations = kv.getIndexOperations();
    const addOperation = getOperation(operations, 'batch_add');
    assert.deepEqual(addOperation.data.files.map(file => file.fileId), [goodFile]);
    const removeOperation = getOperation(operations, 'batch_remove');
    assert.deepEqual(removeOperation.data.fileIds, [placeholderId]);
  });

  it('flushes completed parent updates when a child folder listing fails', async () => {
    const rootPlaceholder = `tree/${FOLDER_PLACEHOLDER_FILE}`;
    const childPlaceholder = `tree/child/${FOLDER_PLACEHOLDER_FILE}`;
    const rootFile = 'tree/root.jpg';
    const kv = new FakeKV({
      [rootPlaceholder]: { metadata: folderPlaceholderMetadata('tree') },
      [childPlaceholder]: { metadata: folderPlaceholderMetadata('tree/child') },
      [rootFile]: { value: 'root', metadata: fileMetadata('tree') },
    });
    installFolderListings({
      tree: {
        files: [{ name: rootFile }],
        directories: ['tree/child'],
      },
      'tree/child': {
        status: 503,
        body: { error: 'temporarily unavailable' },
      },
    });

    const { response, body } = await deleteFolder('tree', kv);

    assert.equal(response.status, 200);
    assert.equal(body.success, false);
    assert.equal(body.partial, true);
    assert.deepEqual(body.trashed, [rootFile]);
    assert.match(body.error, /tree\/child: HTTP 503/);
    assert.equal(kv.getRecord(rootPlaceholder), null);
    assert.notEqual(kv.getRecord(childPlaceholder), null);
    assert.equal(kv.getRecord(rootFile).metadata.ListType, 'Trash');

    const operations = kv.getIndexOperations();
    const addOperation = getOperation(operations, 'batch_add');
    assert.deepEqual(addOperation.data.files.map(file => file.fileId), [rootFile]);
    const removeOperation = getOperation(operations, 'batch_remove');
    assert.deepEqual(removeOperation.data.fileIds, [rootPlaceholder]);
  });

  it('does not mutate a folder when its listing has an invalid structure', async () => {
    const placeholderId = `invalid/${FOLDER_PLACEHOLDER_FILE}`;
    const kv = new FakeKV({
      [placeholderId]: { metadata: folderPlaceholderMetadata('invalid') },
    });
    installFolderListings({
      invalid: { files: {}, directories: [] },
    });

    const { response, body } = await deleteFolder('invalid', kv);

    assert.equal(response.status, 400);
    assert.equal(body.success, false);
    assert.equal(body.partial, false);
    assert.deepEqual(body.trashed, []);
    assert.match(body.error, /Invalid folder listing for invalid/);
    assert.notEqual(kv.getRecord(placeholderId), null);
    assert.deepEqual(kv.getIndexOperations(), []);
  });

  it('does not report success when the index operation cannot be persisted', async () => {
    const placeholderId = `index-failure/${FOLDER_PLACEHOLDER_FILE}`;
    const kv = new FakeKV({
      [placeholderId]: { metadata: folderPlaceholderMetadata('index-failure') },
    }, {
      failIndexOperationPuts: true,
    });
    installFolderListings({
      'index-failure': { files: [], directories: [] },
    });

    const originalConsoleError = console.error;
    console.error = () => {};
    let result;
    try {
      result = await deleteFolder('index-failure', kv);
    } finally {
      console.error = originalConsoleError;
    }

    assert.equal(result.response.status, 200);
    assert.equal(result.body.success, false);
    assert.equal(result.body.partial, true);
    assert.match(result.body.error, /Failed to persist index updates \(batch_remove:/);
    assert.equal(kv.getRecord(placeholderId), null);
    assert.deepEqual(kv.getIndexOperations(), []);
  });
});
