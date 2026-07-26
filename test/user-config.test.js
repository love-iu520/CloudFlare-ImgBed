import assert from 'node:assert/strict';

import { onRequest, parseUserConfigValue } from '../functions/api/userConfig.js';

describe('user config API', () => {
  it('accepts a directly pasted background URL', () => {
    assert.deepEqual(parseUserConfigValue({
      id: 'uploadBkImg',
      value: 'https://example.com/background.jpg',
    }), ['https://example.com/background.jpg']);
  });

  it('keeps bing and JSON wallpaper arrays compatible', () => {
    assert.equal(parseUserConfigValue({ id: 'uploadBkImg', value: 'BING' }), 'bing');
    assert.deepEqual(parseUserConfigValue({
      id: 'uploadBkImg',
      value: '["https://example.com/one.jpg","https://example.com/two.jpg"]',
    }), [
      'https://example.com/one.jpg',
      'https://example.com/two.jpg',
    ]);
  });

  it('returns fresh JSON configuration with cache revalidation headers', async () => {
    const storedSettings = JSON.stringify({
      config: [
        { id: 'uploadBkImg', value: 'https://example.com/background.jpg' },
        { id: 'siteTitle', value: 'Example' },
      ],
    });
    const env = {
      img_url: {
        async get(key) {
          return key === 'manage@sysConfig@page' ? storedSettings : null;
        },
      },
    };

    const response = await onRequest({ env });
    const body = await response.json();

    assert.deepEqual(body.uploadBkImg, ['https://example.com/background.jpg']);
    assert.equal(body.siteTitle, 'Example');
    assert.match(response.headers.get('content-type'), /^application\/json/);
    assert.match(response.headers.get('cache-control'), /must-revalidate/);
  });
});
