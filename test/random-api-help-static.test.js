import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const script = readFileSync(new URL('../frontend-dist/js/random-api-help.js', import.meta.url), 'utf8');
const index = readFileSync(new URL('../frontend-dist/index.html', import.meta.url), 'utf8');

describe('random API settings helper', () => {
  it('shows canonical random API examples and the all-directory hint', () => {
    assert.match(script, /window\.location\.origin/);
    assert.match(script, /\?type=img/);
    assert.match(script, /orientation=auto/);
    assert.match(script, /type=url&form=text/);
    assert.match(script, /目录留空即可包含全部文件夹/);
  });

  it('supports copy feedback and is loaded by the deployed page', () => {
    assert.match(script, /navigator\.clipboard/);
    assert.match(script, /document\.execCommand\('copy'\)/);
    assert.match(index, /\/js\/random-api-help\.js\?v=20260713-random-api-help/);
  });
});
