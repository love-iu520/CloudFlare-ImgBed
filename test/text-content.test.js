import assert from 'node:assert/strict';

import { onRequest as contentRequest } from '../functions/api/manage/content/[[path]].js';
import {
  TEXT_CONTENT_MAX_BYTES,
  TextContentError,
  analyzeTextBytes,
  buildContentEtag,
  computeContentRevision,
  encodeTextContent,
} from '../functions/utils/textContent.js';

class FakeKV {
  constructor(records = {}, options = {}) {
    this.records = new Map();
    this.failFilePut = options.failFilePut === true;
    this.failIndexPut = options.failIndexPut === true;
    for (const [key, record] of Object.entries(records)) {
      this.records.set(key, {
        value: record.value ?? '',
        metadata: structuredClone(record.metadata || {}),
      });
    }
  }

  async get(key) {
    return this.records.get(key)?.value ?? null;
  }

  async getWithMetadata(key) {
    const record = this.records.get(key);
    if (!record) return { value: null, metadata: null };
    return {
      value: record.value,
      metadata: structuredClone(record.metadata),
    };
  }

  async put(key, value, options = {}) {
    if (this.failFilePut && !key.startsWith('manage@')) throw new Error('file database write failed');
    if (this.failIndexPut && key.startsWith('manage@index@operation_')) throw new Error('index write failed');
    const existing = this.records.get(key);
    this.records.set(key, {
      value,
      metadata: structuredClone(options.metadata ?? existing?.metadata ?? {}),
    });
  }

  getRecord(key) {
    const record = this.records.get(key);
    return record ? structuredClone(record) : null;
  }
}

class FakeTelegram {
  constructor(files = {}, options = {}) {
    this.files = new Map();
    this.messages = new Map();
    this.nextMessageId = 100;
    this.sendCalls = [];
    this.deleteCalls = [];
    this.failDeleteIds = new Set(options.failDeleteIds || []);
    for (const [fileId, file] of Object.entries(files)) {
      this.files.set(fileId, bytes(file.content));
      this.messages.set(file.messageId, fileId);
    }
  }

  async getFileContent(fileId) {
    const value = this.files.get(fileId);
    return value ? new Response(value) : new Response('missing', { status: 404 });
  }

  async sendFile(file, chatId, functionName, functionType, caption, fileName) {
    const value = new Uint8Array(await file.arrayBuffer());
    const messageId = this.nextMessageId++;
    const fileId = `file-${messageId}`;
    this.files.set(fileId, value);
    this.messages.set(messageId, fileId);
    this.sendCalls.push({ chatId, functionName, functionType, caption, fileName, value });
    return {
      ok: true,
      result: {
        message_id: messageId,
        document: {
          file_id: fileId,
          file_name: fileName,
          file_size: value.byteLength,
        },
      },
    };
  }

  getFileInfo(response) {
    return {
      file_id: response.result.document.file_id,
      file_name: response.result.document.file_name,
      file_size: response.result.document.file_size,
      message_id: response.result.message_id,
    };
  }

  async deleteMessage(chatId, messageId) {
    this.deleteCalls.push({ chatId, messageId });
    if (this.failDeleteIds.has(messageId)) throw new Error('Telegram refused to delete the message');
    const fileId = this.messages.get(messageId);
    if (fileId) this.files.delete(fileId);
    this.messages.delete(messageId);
    return true;
  }

  text(fileId) {
    return new TextDecoder('utf-8', { ignoreBOM: true }).decode(this.files.get(fileId));
  }
}

class FakeCache {
  constructor() {
    this.deleted = [];
  }

  async delete(key) {
    this.deleted.push(typeof key === 'string' ? key : key.url);
    return true;
  }

  async put() {}
}

function textMetadata(overrides = {}) {
  return {
    FileName: 'notes.txt',
    FileType: 'text/plain',
    FileSize: '0.00',
    FileSizeBytes: 5,
    TimeStamp: 1710000000000,
    Directory: 'docs/',
    Tags: ['work'],
    ListType: 'None',
    Label: 'None',
    Channel: 'TelegramNew',
    ChannelName: 'Telegram_env',
    TgFileId: 'old-file',
    TgMessageId: 1,
    ...overrides,
  };
}

function createContext(fileId, kv, telegram, requestOptions = {}) {
  const encodedPath = encodeURIComponent(fileId.split('/').join(','));
  const request = new Request(`https://img.example/api/manage/content/${encodedPath}`, {
    method: requestOptions.method || 'GET',
    headers: requestOptions.headers,
    body: requestOptions.body,
  });
  return {
    request,
    env: {
      img_url: kv,
      TG_BOT_TOKEN: 'test-token',
      TG_CHAT_ID: 'test-chat',
    },
    params: { path: encodedPath },
    data: {
      textContentDependencies: {
        telegramFactory: () => telegram,
      },
    },
    waitUntil() {},
  };
}

async function getContent(fileId, kv, telegram) {
  return contentRequest(createContext(fileId, kv, telegram));
}

async function putContent(fileId, kv, telegram, etag, body, headers = {}) {
  return contentRequest(createContext(fileId, kv, telegram, {
    method: 'PUT',
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'If-Match': etag, ...headers },
    body,
  }));
}

function telegramWith(fileId = 'old-file', content = 'hello', messageId = 1, options = {}) {
  return new FakeTelegram({
    [fileId]: { content, messageId },
  }, options);
}

describe('managed Telegram text content editing', () => {
  const originalCaches = globalThis.caches;
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
    if (originalCaches === undefined) delete globalThis.caches;
    else globalThis.caches = originalCaches;
    console.error = originalConsole.error;
    console.log = originalConsole.log;
    console.warn = originalConsole.warn;
  });

  it('loads strict UTF-8 text with an ETag and no-store headers', async () => {
    const fileId = 'docs/notes.txt';
    const original = encodeTextContent('first\r\nsecond\r\n', { eol: 'crlf', hasBom: true });
    const kv = new FakeKV({
      [fileId]: { value: 'preserved', metadata: textMetadata({ FileSizeBytes: original.byteLength }) },
    });
    const telegram = telegramWith('old-file', original);

    const response = await getContent(fileId, kv, telegram);

    assert.equal(response.status, 200);
    assert.equal(await response.text(), 'first\r\nsecond\r\n');
    assert.match(response.headers.get('ETag'), /^"[a-f0-9]{64}"$/);
    assert.equal(response.headers.get('Cache-Control'), 'private, no-store, max-age=0');
    assert.equal(response.headers.get('X-Content-BOM'), '1');
    assert.equal(response.headers.get('X-Content-EOL'), 'crlf');
  });

  it('replaces the Telegram document and keeps unrelated metadata', async () => {
    const fileId = 'docs/notes.txt';
    const original = encodeTextContent('old\r\n', { eol: 'crlf', hasBom: true });
    const kv = new FakeKV({
      [fileId]: {
        value: 'preserved',
        metadata: textMetadata({ FileSizeBytes: original.byteLength, TgFileUniqueId: 'obsolete' }),
      },
    });
    const telegram = telegramWith('old-file', original);
    const current = await getContent(fileId, kv, telegram);

    const response = await putContent(fileId, kv, telegram, current.headers.get('ETag'), 'new\nline\n', {
      'X-Content-BOM': '1',
      'X-Content-EOL': 'crlf',
    });
    const body = await response.json();
    const saved = kv.getRecord(fileId);

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.warning, undefined);
    assert.equal(body.metadata.TgFileId, 'file-100');
    assert.equal(body.metadata.TgMessageId, 100);
    assert.equal(saved.value, 'preserved');
    assert.deepEqual(saved.metadata.Tags, ['work']);
    assert.equal(saved.metadata.TimeStamp, 1710000000000);
    assert.equal(saved.metadata.TgMessageId, 100);
    assert.equal(saved.metadata.TgFileId, 'file-100');
    assert.equal(saved.metadata.TgMediaType, 'document');
    assert.equal(saved.metadata.TgFileUniqueId, undefined);
    assert.equal(saved.metadata.ContentBOM, true);
    assert.equal(saved.metadata.ContentEOL, 'crlf');
    assert.match(saved.metadata.ContentRevision, /^[a-f0-9]{64}$/);
    assert.equal(telegram.text('file-100'), '\uFEFFnew\r\nline\r\n');
    assert.deepEqual(telegram.sendCalls.map(call => [call.functionName, call.functionType, call.fileName]), [
      ['sendDocument', 'document', 'notes.txt'],
    ]);
    assert.deepEqual(telegram.deleteCalls, [{ chatId: 'test-chat', messageId: 1 }]);
    assert.ok(globalThis.caches.default.deleted.includes('https://img.example/file/docs/notes.txt'));
  });

  it('returns success with a warning when the old Telegram message cannot be deleted', async () => {
    const fileId = 'notes.txt';
    const kv = new FakeKV({ [fileId]: { metadata: textMetadata() } });
    const telegram = telegramWith('old-file', 'old', 1, { failDeleteIds: [1] });
    const revision = await computeContentRevision(bytes('old'));

    const response = await putContent(fileId, kv, telegram, buildContentEtag(revision), 'new');
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.warning, 'OLD_TELEGRAM_MESSAGE_NOT_DELETED');
    assert.equal(kv.getRecord(fileId).metadata.TgFileId, 'file-100');
    assert.equal(telegram.text('file-100'), 'new');
  });

  it('requires a current If-Match value before uploading a replacement', async () => {
    const fileId = 'notes.txt';
    const kv = new FakeKV({ [fileId]: { metadata: textMetadata() } });
    const telegram = telegramWith();

    const missing = await contentRequest(createContext(fileId, kv, telegram, {
      method: 'PUT',
      body: 'changed',
    }));
    assert.equal(missing.status, 428);
    assert.equal((await missing.json()).code, 'REVISION_REQUIRED');

    const stale = await putContent(fileId, kv, telegram, '"stale"', 'changed');
    assert.equal(stale.status, 412);
    assert.equal((await stale.json()).code, 'REVISION_CONFLICT');
    assert.equal(telegram.sendCalls.length, 0);
  });

  it('does not upload a replacement when the submitted bytes are unchanged', async () => {
    const fileId = 'notes.txt';
    const kv = new FakeKV({ [fileId]: { metadata: textMetadata() } });
    const telegram = telegramWith();
    const revision = await computeContentRevision(bytes('hello'));

    const response = await putContent(fileId, kv, telegram, buildContentEtag(revision), 'hello');
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.unchanged, true);
    assert.equal(telegram.sendCalls.length, 0);
  });

  it('deletes the new Telegram message when database persistence fails', async () => {
    const fileId = 'notes.txt';
    const kv = new FakeKV({ [fileId]: { metadata: textMetadata() } }, { failFilePut: true });
    const telegram = telegramWith();
    const revision = await computeContentRevision(bytes('hello'));

    const response = await putContent(fileId, kv, telegram, buildContentEtag(revision), 'new');

    assert.equal(response.status, 500);
    assert.equal((await response.json()).code, 'CONTENT_SAVE_FAILED');
    assert.deepEqual(telegram.deleteCalls, [{ chatId: 'test-chat', messageId: 100 }]);
    assert.equal(kv.getRecord(fileId).metadata.TgFileId, 'old-file');
    assert.equal(telegram.text('old-file'), 'hello');
  });

  it('restores the old record and deletes the new message when indexing fails', async () => {
    const fileId = 'notes.txt';
    const kv = new FakeKV({
      [fileId]: { value: 'preserved', metadata: textMetadata() },
    }, { failIndexPut: true });
    const telegram = telegramWith();
    const revision = await computeContentRevision(bytes('hello'));

    const response = await putContent(fileId, kv, telegram, buildContentEtag(revision), 'new');

    assert.equal(response.status, 500);
    assert.equal((await response.json()).code, 'CONTENT_SAVE_FAILED');
    assert.equal(kv.getRecord(fileId).value, 'preserved');
    assert.equal(kv.getRecord(fileId).metadata.TgFileId, 'old-file');
    assert.deepEqual(telegram.deleteCalls, [{ chatId: 'test-chat', messageId: 100 }]);
  });

  it('normalizes mixed line endings to LF and allows empty files', async () => {
    const mixedId = 'mixed.txt';
    const mixedKv = new FakeKV({
      [mixedId]: { metadata: textMetadata({ FileName: mixedId }) },
    });
    const mixedTelegram = telegramWith('old-file', 'one\r\ntwo\nthree\r');
    const mixedRevision = await computeContentRevision(bytes('one\r\ntwo\nthree\r'));

    const mixed = await putContent(
      mixedId,
      mixedKv,
      mixedTelegram,
      buildContentEtag(mixedRevision),
      'one\r\ntwo\nthree\r',
      { 'X-Content-EOL': 'mixed' },
    );
    assert.equal(mixed.status, 200);
    assert.equal(mixedTelegram.text('file-100'), 'one\ntwo\nthree\n');
    assert.equal(mixedKv.getRecord(mixedId).metadata.ContentEOL, 'lf');

    const emptyId = 'empty.txt';
    const emptyKv = new FakeKV({
      [emptyId]: { metadata: textMetadata({ FileName: emptyId }) },
    });
    const emptyTelegram = telegramWith('old-file', 'old');
    const emptyRevision = await computeContentRevision(bytes('old'));
    const empty = await putContent(emptyId, emptyKv, emptyTelegram, buildContentEtag(emptyRevision), '');

    assert.equal(empty.status, 200);
    assert.equal(emptyTelegram.text('file-100'), '');
    assert.equal(emptyKv.getRecord(emptyId).metadata.FileSizeBytes, 0);
    assert.equal(emptyKv.getRecord(emptyId).metadata.ContentEOL, 'none');
  });

  it('rejects unsafe formats, content and storage records before uploading', async () => {
    const jsonId = 'settings.json';
    const jsonKv = new FakeKV({
      [jsonId]: {
        metadata: textMetadata({ FileName: 'settings.json', FileType: 'application/json' }),
      },
    });
    const jsonTelegram = telegramWith('old-file', '{"ok":true}');
    const revision = await computeContentRevision(bytes('{"ok":true}'));
    const invalidJson = await putContent(
      jsonId,
      jsonKv,
      jsonTelegram,
      buildContentEtag(revision),
      '{oops',
    );
    assert.equal(invalidJson.status, 422);
    assert.equal((await invalidJson.json()).code, 'INVALID_JSON');
    assert.equal(jsonTelegram.sendCalls.length, 0);

    const binaryId = 'binary.txt';
    const binaryKv = new FakeKV({
      [binaryId]: { metadata: textMetadata({ FileName: binaryId }) },
    });
    const binary = await getContent(
      binaryId,
      binaryKv,
      telegramWith('old-file', new Uint8Array([65, 0, 66])),
    );
    assert.equal(binary.status, 415);
    assert.equal((await binary.json()).code, 'BINARY_CONTENT');

    const invalidUtf8Id = 'invalid.txt';
    const invalidUtf8Kv = new FakeKV({
      [invalidUtf8Id]: { metadata: textMetadata({ FileName: invalidUtf8Id }) },
    });
    const invalidUtf8 = await getContent(
      invalidUtf8Id,
      invalidUtf8Kv,
      telegramWith('old-file', new Uint8Array([0xc3, 0x28])),
    );
    assert.equal(invalidUtf8.status, 415);
    assert.equal((await invalidUtf8.json()).code, 'INVALID_UTF8');

    const chunkedId = 'chunked.txt';
    const chunkedKv = new FakeKV({
      [chunkedId]: { metadata: textMetadata({ IsChunked: true }) },
    });
    const chunked = await getContent(chunkedId, chunkedKv, telegramWith());
    assert.equal(chunked.status, 422);
    assert.equal((await chunked.json()).code, 'UNSUPPORTED_STORAGE');

    const legacyId = 'legacy.txt';
    const legacyKv = new FakeKV({
      [legacyId]: { metadata: textMetadata({ Channel: 'Telegram' }) },
    });
    const legacy = await getContent(legacyId, legacyKv, telegramWith());
    assert.equal(legacy.status, 422);
    assert.equal((await legacy.json()).code, 'UNSUPPORTED_STORAGE');

    const htmlId = 'page.txt';
    const htmlKv = new FakeKV({
      [htmlId]: { metadata: textMetadata({ FileType: 'text/html' }) },
    });
    const html = await getContent(htmlId, htmlKv, telegramWith('old-file', '<script></script>'));
    assert.equal(html.status, 415);
    assert.equal((await html.json()).code, 'UNSUPPORTED_TEXT_TYPE');

    const renamedSecretId = '.env';
    const renamedSecretKv = new FakeKV({
      [renamedSecretId]: { metadata: textMetadata({ FileName: 'renamed.txt' }) },
    });
    const renamedSecret = await getContent(
      renamedSecretId,
      renamedSecretKv,
      telegramWith('old-file', 'SECRET=x'),
    );
    assert.equal(renamedSecret.status, 415);
    assert.equal((await renamedSecret.json()).code, 'UNSUPPORTED_TEXT_TYPE');

    const boundary = new Uint8Array(TEXT_CONTENT_MAX_BYTES).fill(65);
    assert.equal(analyzeTextBytes(boundary).bytes.byteLength, TEXT_CONTENT_MAX_BYTES);
    assert.throws(
      () => analyzeTextBytes(new Uint8Array(TEXT_CONTENT_MAX_BYTES + 1).fill(65)),
      error => error instanceof TextContentError && error.code === 'CONTENT_TOO_LARGE',
    );
  });
});

function bytes(value) {
  if (value instanceof Uint8Array) return new Uint8Array(value);
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  return new TextEncoder().encode(String(value ?? ''));
}
