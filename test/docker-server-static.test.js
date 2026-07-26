import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const serverSource = readFileSync(
  new URL('../deploy/server/index.js', import.meta.url),
  'utf8',
);

describe('Docker static asset delivery', () => {
  it('serves existing precompressed assets', () => {
    assert.match(serverSource, /precompressed:\s*true/);
  });

  it('uses immutable caching only for content-hashed assets', () => {
    assert.match(serverSource, /HASHED_STATIC_ASSET_PATTERN/);
    assert.match(serverSource, /public, max-age=31536000, immutable/);
    assert.match(serverSource, /onFound:\s*setStaticCacheControl/);
  });

  it('revalidates index and unhashed hotfix assets', () => {
    assert.match(serverSource, /index\\\.html\|nav-hotfix/);
    assert.match(serverSource, /random-api-help\\\.js/);
    assert.match(serverSource, /REVALIDATED_STATIC_CACHE_CONTROL = 'no-cache'/);
    assert.match(
      serverSource,
      /c\.header\('Cache-Control', REVALIDATED_STATIC_CACHE_CONTROL\)/,
    );
  });
});
