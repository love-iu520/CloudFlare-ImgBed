import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  canShareAccessMetadata,
  createShareLink,
  isPathWithinShare,
  listShareLinks,
  normalizeShareTarget,
  revokeShareLink,
  updateShareExpiry,
  validateShareTokenForFile,
} from '../functions/utils/share/shareLinks.js';
import { onRequest as manageShareRequest } from '../functions/api/manage/share/index.js';
import { onRequest as manageSharePathRequest } from '../functions/api/manage/share/[[path]].js';
import { onRequest as publicShareRequest } from '../functions/api/share/[[path]].js';
import { returnWithCheck } from '../functions/file/fileTools.js';
import { SqliteD1 } from '../deploy/server/sqliteD1.js';

class FakeKV {
  constructor() {
    this.store = new Map();
  }

  async put(key, value, options = {}) {
    this.store.set(key, {
      value,
      metadata: options.metadata || {},
    });
  }

  async get(key) {
    return this.store.get(key)?.value ?? null;
  }

  async getWithMetadata(key) {
    const item = this.store.get(key);
    if (!item) return null;
    return {
      value: item.value,
      metadata: item.metadata,
    };
  }

  async delete(key) {
    this.store.delete(key);
  }

  async list(options = {}) {
    const prefix = options.prefix || '';
    const limit = options.limit || 1000;
    const cursor = options.cursor || '';
    const names = Array.from(this.store.keys())
      .filter(key => key.startsWith(prefix))
      .filter(key => !cursor || key > cursor)
      .sort()
      .slice(0, limit + 1);
    const hasMore = names.length > limit;
    if (hasMore) names.pop();

    return {
      keys: names.map(name => ({
        name,
        metadata: this.store.get(name)?.metadata || {},
      })),
      cursor: hasMore ? names[names.length - 1] : undefined,
      list_complete: !hasMore,
    };
  }
}

function createEnv() {
  return {
    img_url: new FakeKV(),
  };
}

async function seedFile(env, fileId, metadata = {}) {
  await env.img_url.put(fileId, 'stored-file-reference', {
    metadata: {
      FileName: fileId.split('/').pop(),
      FileType: 'image/jpeg',
      TimeStamp: 1710000000000,
      ListType: 'None',
      ...metadata,
    },
  });
}

function jsonRequest(url, body, method = 'POST') {
  return new Request(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('share links', () => {
  it('normalizes file and directory share targets without allowing traversal', () => {
    assert.deepEqual(normalizeShareTarget('file', '/photos/../safe/a.jpg'), {
      targetType: 'file',
      targetPath: 'photos/_/safe/a.jpg',
    });

    assert.deepEqual(normalizeShareTarget('directory', '\\photos//summer/'), {
      targetType: 'directory',
      targetPath: 'photos/summer/',
    });
  });

  it('allows directory shares only inside the shared directory boundary', () => {
    const share = { targetType: 'directory', targetPath: 'photos/' };

    assert.equal(isPathWithinShare(share, 'photos/a.jpg'), true);
    assert.equal(isPathWithinShare(share, 'photos/nested/a.jpg'), true);
    assert.equal(isPathWithinShare(share, 'photos2/a.jpg'), false);
  });

  it('rejects blocked, adult, and trashed metadata for share access', () => {
    assert.equal(canShareAccessMetadata({ ListType: 'None' }), true);
    assert.equal(canShareAccessMetadata({ ListType: 'Block' }), false);
    assert.equal(canShareAccessMetadata({ ListType: 'Trash' }), false);
    assert.equal(canShareAccessMetadata({ Label: 'adult' }), false);
  });

  it('validates active tokens and rejects expired or revoked tokens for file access', async () => {
    const env = createEnv();
    await seedFile(env, 'photos/a.jpg');

    const active = await createShareLink(env, {
      targetType: 'file',
      targetPath: 'photos/a.jpg',
      expiresAt: Date.now() + 60_000,
    });
    const activeResult = await validateShareTokenForFile(env, active.token, 'photos/a.jpg', {
      ListType: 'None',
    });
    assert.equal(activeResult.valid, true);

    const expired = await createShareLink(env, {
      targetType: 'file',
      targetPath: 'photos/a.jpg',
      expiresAt: Date.now() - 1,
    });
    const expiredResult = await validateShareTokenForFile(env, expired.token, 'photos/a.jpg', {
      ListType: 'None',
    });
    assert.equal(expiredResult.valid, false);
    assert.equal(expiredResult.reason, 'expired');

    const revoked = await createShareLink(env, {
      targetType: 'file',
      targetPath: 'photos/a.jpg',
    });
    await revokeShareLink(env, revoked.share.id);
    const revokedResult = await validateShareTokenForFile(env, revoked.token, 'photos/a.jpg', {
      ListType: 'None',
    });
    assert.equal(revokedResult.valid, false);
    assert.equal(revokedResult.reason, 'revoked');
  });

  it('creates, reads, and revokes a file share through API handlers', async () => {
    const env = createEnv();
    await seedFile(env, 'photos/a.jpg');
    const beforeCreate = Date.now();

    const createResponse = await manageShareRequest({
      env,
      request: jsonRequest('https://img.example/api/manage/share', {
        targetType: 'file',
        targetPath: 'photos/a.jpg',
        expiresInSeconds: 604800,
      }),
    });
    assert.equal(createResponse.status, 201);

    const created = await createResponse.json();
    assert.equal(created.success, true);
    assert.match(created.url, /^https:\/\/img\.example\/share\//);
    assert.equal(created.share.targetType, 'file');
    assert.equal(created.share.targetPath, 'photos/a.jpg');
    assert.equal(created.share.url, created.url);
    assert.ok(created.share.expiresAt >= beforeCreate + 604799000);
    assert.ok(created.share.expiresAt <= Date.now() + 604801000);

    const listResponse = await manageShareRequest({
      env,
      request: new Request('https://img.example/api/manage/share?limit=100'),
    });
    assert.equal(listResponse.status, 200);
    const listed = await listResponse.json();
    assert.equal(listed.success, true);
    assert.equal(listed.shares[0].id, created.share.id);
    assert.equal(listed.shares[0].url, created.url);

    const beforeUpdate = Date.now();
    const updateResponse = await manageSharePathRequest({
      env,
      request: jsonRequest(`https://img.example/api/manage/share/${created.share.id}`, {
        expiresInSeconds: 3600,
      }, 'PATCH'),
      params: { path: created.share.id },
    });
    assert.equal(updateResponse.status, 200);

    const updated = await updateResponse.json();
    assert.equal(updated.success, true);
    assert.equal(updated.share.id, created.share.id);
    assert.ok(updated.share.expiresAt >= beforeUpdate + 3599000);
    assert.ok(updated.share.expiresAt <= Date.now() + 3601000);

    const permanentResponse = await manageSharePathRequest({
      env,
      request: jsonRequest(`https://img.example/api/manage/share/${created.share.id}`, {
        expiresAt: null,
      }, 'PATCH'),
      params: { path: created.share.id },
    });
    assert.equal(permanentResponse.status, 200);
    const permanent = await permanentResponse.json();
    assert.equal(permanent.share.expiresAt, null);

    const token = created.url.split('/share/')[1];
    const publicResponse = await publicShareRequest({
      env,
      request: new Request(`https://img.example/api/share/${token}`),
      params: { path: token },
    });
    assert.equal(publicResponse.status, 200);

    const publicBody = await publicResponse.json();
    assert.equal(publicBody.success, true);
    assert.equal(publicBody.share.targetType, 'file');
    assert.equal(publicBody.file.name, 'photos/a.jpg');
    assert.equal(publicBody.file.url, `/file/photos%2Fa.jpg?shareToken=${encodeURIComponent(token)}`);

    const revokeResponse = await manageShareRequest({
      env,
      request: new Request(`https://img.example/api/manage/share?id=${created.share.id}`, {
        method: 'DELETE',
      }),
    });
    assert.equal(revokeResponse.status, 200);

    const revokedPublicResponse = await publicShareRequest({
      env,
      request: new Request(`https://img.example/api/share/${token}`),
      params: { path: token },
    });
    assert.equal(revokedPublicResponse.status, 410);
  });

  it('allows shared files through file access checks without bypassing blocked metadata', async () => {
    const env = createEnv();
    await seedFile(env, 'photos/a.jpg');
    const created = await createShareLink(env, {
      targetType: 'file',
      targetPath: 'photos/a.jpg',
      expiresAt: Date.now() + 60_000,
    });
    const context = {
      env,
      url: new URL(`https://img.example/file/photos/a.jpg?shareToken=${created.token}`),
      securityConfig: { access: { whiteListMode: true } },
      fileAccess: {
        isAdminPreview: false,
        adminAuthResult: { authorized: false },
        shareToken: created.token,
      },
    };

    const allowed = await returnWithCheck(context, {
      metadata: { ListType: 'None' },
    }, 'photos/a.jpg');
    assert.equal(allowed.status, 200);

    const outsideScope = await returnWithCheck(context, {
      metadata: { ListType: 'None' },
    }, 'photos/b.jpg');
    assert.equal(outsideScope.status, 403);

    const blocked = await returnWithCheck(context, {
      metadata: { ListType: 'Block' },
    }, 'photos/a.jpg');
    assert.equal(blocked.status, 403);
  });

  it('stores share links in the D1 share_links table', async function () {
    this.timeout(5000);

    const d1 = new SqliteD1(':memory:');
    d1.exec(readFileSync(new URL('../database/init.sql', import.meta.url), 'utf8'));
    const env = { img_d1: d1 };

    const created = await createShareLink(env, {
      targetType: 'directory',
      targetPath: 'photos',
      expiresInSeconds: 3600,
    });
    const valid = await validateShareTokenForFile(env, created.token, 'photos/a.jpg', {
      ListType: 'None',
    });
    assert.equal(valid.valid, true);

    const listed = await listShareLinks(env, {
      shareOrigin: 'https://img.example',
    });
    assert.equal(listed.shares[0].id, created.share.id);
    assert.equal(listed.shares[0].url, `https://img.example/share/${encodeURIComponent(created.token)}`);

    await revokeShareLink(env, created.share.id);
    const revoked = await validateShareTokenForFile(env, created.token, 'photos/a.jpg', {
      ListType: 'None',
    });
    assert.equal(revoked.valid, false);
    assert.equal(revoked.reason, 'revoked');

    const updated = await updateShareExpiry(env, created.share.id, {
      expiresAt: null,
    });
    assert.equal(updated.expiresAt, null);
  });

  it('adds the share token column when writing to an older D1 share_links table', async function () {
    this.timeout(5000);

    const d1 = new SqliteD1(':memory:');
    d1.exec(readFileSync(new URL('../database/migrations/v2.7.5_add_share_links.sql', import.meta.url), 'utf8'));
    const env = { img_d1: d1 };

    const created = await createShareLink(env, {
      targetType: 'directory',
      targetPath: 'photos',
      expiresInSeconds: 3600,
    });
    const columns = await d1.prepare('PRAGMA table_info(share_links)').all();
    const columnNames = columns.results.map(column => column.name);
    assert.ok(columnNames.includes('token'));

    const listed = await listShareLinks(env, {
      shareOrigin: 'https://img.example',
    });
    assert.equal(listed.shares[0].id, created.share.id);
    assert.equal(listed.shares[0].url, `https://img.example/share/${encodeURIComponent(created.token)}`);
  });
});
