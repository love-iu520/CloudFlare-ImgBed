import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workerIndex = readFileSync(new URL('../deploy/worker/index.js', import.meta.url), 'utf8');

describe('worker route generation', () => {
  it('keeps key catch-all routes available in the generated Worker adapter', () => {
    assert.match(workerIndex, /path: '\/file\/'.*catchAll: true/);
    assert.match(workerIndex, /path: '\/share\/'.*catchAll: true/);
    assert.match(workerIndex, /path: '\/api\/share\/'.*catchAll: true/);
    assert.match(workerIndex, /path: '\/dav\/'.*catchAll: true/);
  });

  it('keeps the upload route behind upload middleware', () => {
    assert.ok(workerIndex.includes(
      "{ path: '/upload', module: upload_index, middlewares: [mw_upload] },",
    ));
  });

  it('keeps admin routes behind both API and manage middleware', () => {
    assert.match(workerIndex, /path: '\/api\/manage\/share'.*middlewares: \[mw_api, mw_api_manage\]/);
    assert.match(workerIndex, /path: '\/api\/manage\/share\/'.*middlewares: \[mw_api, mw_api_manage\].*catchAll: true/);
    assert.match(workerIndex, /path: '\/api\/manage\/content\/'.*middlewares: \[mw_api, mw_api_manage\].*catchAll: true/);
  });

  it('keeps public API routes behind only the API middleware', () => {
    assert.match(workerIndex, /path: '\/api\/share\/'.*middlewares: \[mw_api\].*catchAll: true/);
    assert.match(workerIndex, /path: '\/api\/public\/list'.*middlewares: \[mw_api\]/);
  });

  it('bypasses historical Worker cache entries for editable text files', () => {
    assert.match(workerIndex, /function shouldBypassMutableTextCache\(request\)/);
    assert.match(workerIndex, /!baseName\.includes\('\.'\)/);
    assert.ok(workerIndex.includes('/\\.(?:txt|md|markdown|json)$/i'));
    assert.match(workerIndex, /shouldBypassMutableTextCache\(request\)/);
  });
});
