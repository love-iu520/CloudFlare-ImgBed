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

  it('keeps admin routes behind both API and manage middleware', () => {
    assert.match(workerIndex, /path: '\/api\/manage\/share'.*middlewares: \[mw_api, mw_api_manage\]/);
    assert.match(workerIndex, /path: '\/api\/manage\/share\/'.*middlewares: \[mw_api, mw_api_manage\].*catchAll: true/);
  });

  it('keeps public API routes behind only the API middleware', () => {
    assert.match(workerIndex, /path: '\/api\/share\/'.*middlewares: \[mw_api\].*catchAll: true/);
    assert.match(workerIndex, /path: '\/api\/public\/list'.*middlewares: \[mw_api\]/);
  });
});
