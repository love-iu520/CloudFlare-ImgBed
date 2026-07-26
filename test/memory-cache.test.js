import assert from 'node:assert/strict';

import {
  MemoryCache,
  parseCacheControlMaxAge,
} from '../deploy/server/memoryCache.js';

describe('Docker memory cache', () => {
  it('stores response copies and returns a fresh readable response for every match', async () => {
    const cache = new MemoryCache();
    const response = new Response('cached body', {
      headers: {
        'Cache-Control': 'public, max-age=60',
        'X-Cache-Test': 'yes',
      },
    });

    await cache.put('https://example.com/list?dir=photos', response);

    assert.equal(await response.text(), 'cached body');
    const first = await cache.match(new Request('https://example.com/list?dir=photos'));
    assert.equal(first.headers.get('X-Cache-Test'), 'yes');
    assert.equal(await first.text(), 'cached body');

    const second = await cache.match(new URL('https://example.com/list?dir=photos'));
    assert.notEqual(second, first);
    assert.equal(await second.text(), 'cached body');
  });

  it('parses max-age strictly and expires entries at the configured time', async () => {
    let now = 1_000;
    const cache = new MemoryCache({ now: () => now });

    assert.equal(parseCacheControlMaxAge('public, MAX-AGE="2"'), 2);
    assert.equal(parseCacheControlMaxAge('max-age=30, max-age=5'), 5);
    assert.equal(parseCacheControlMaxAge('max-age=2seconds'), null);
    assert.equal(parseCacheControlMaxAge('max-age="2'), null);

    await cache.put('https://example.com/expiring', new Response('value', {
      headers: { 'Cache-Control': 'public, MAX-AGE="2"' },
    }));

    now = 2_999;
    assert.equal(await (await cache.match('https://example.com/expiring')).text(), 'value');
    now = 3_000;
    assert.equal(await cache.match('https://example.com/expiring'), undefined);
  });

  it('supports expirationTtl used by existing list caches', async () => {
    let now = 5_000;
    const cache = new MemoryCache({ now: () => now });

    await cache.put(
      'https://example.com/random-list',
      new Response('["photo.jpg"]'),
      { expirationTtl: 2 },
    );

    now = 6_999;
    assert.ok(await cache.match('https://example.com/random-list'));
    now = 7_000;
    assert.equal(await cache.match('https://example.com/random-list'), undefined);
  });

  it('uses max-age=0 and delete to invalidate entries', async () => {
    const cache = new MemoryCache();
    const key = 'https://example.com/invalidate';

    await cache.put(key, new Response('old', {
      headers: { 'Cache-Control': 'max-age=60' },
    }));
    await cache.put(key, new Response(null, {
      headers: { 'Cache-Control': 'max-age=0' },
    }));
    assert.equal(await cache.match(key), undefined);

    await cache.put(key, new Response('new', {
      headers: { 'Cache-Control': 'max-age=60' },
    }));
    assert.equal(await cache.delete(key), true);
    assert.equal(await cache.delete(key), false);
  });

  it('evicts the least recently used entry when the entry limit is reached', async () => {
    const cache = new MemoryCache({ maxEntries: 2 });
    const response = value => new Response(value, {
      headers: { 'Cache-Control': 'max-age=60' },
    });

    await cache.put('https://example.com/a', response('a'));
    await cache.put('https://example.com/b', response('b'));
    await cache.match('https://example.com/a');
    await cache.put('https://example.com/c', response('c'));

    assert.equal(await cache.match('https://example.com/b'), undefined);
    assert.ok(await cache.match('https://example.com/a'));
    assert.ok(await cache.match('https://example.com/c'));
  });

  it('keeps the cache within its byte limit and skips oversized entries', async () => {
    const cache = new MemoryCache({ maxBytes: 700, maxEntries: 10 });
    const response = () => new Response(new Uint8Array(512), {
      headers: { 'Cache-Control': 'max-age=60' },
    });

    await cache.put('https://example.com/first', response());
    await cache.put('https://example.com/second', response());

    assert.equal(await cache.match('https://example.com/first'), undefined);
    assert.ok(await cache.match('https://example.com/second'));
    assert.ok(cache.totalBytes <= 700);

    await cache.put('https://example.com/too-large', new Response(new Uint8Array(701), {
      headers: { 'Cache-Control': 'max-age=60' },
    }));
    assert.equal(await cache.match('https://example.com/too-large'), undefined);
  });
});
