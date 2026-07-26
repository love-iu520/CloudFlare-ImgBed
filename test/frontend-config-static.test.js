import assert from 'node:assert/strict';
import {
  existsSync,
  readFileSync,
  readdirSync,
} from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';

const frontendDist = fileURLToPath(new URL('../frontend-dist/', import.meta.url));
const javascriptDirectory = join(frontendDist, 'js');
const cssDirectory = join(frontendDist, 'css');
const indexHtml = readFileSync(join(frontendDist, 'index.html'), 'utf8');
const javascriptFiles = readdirSync(javascriptDirectory)
  .filter(name => name.endsWith('.js'))
  .sort();
const javascriptSource = javascriptFiles
  .map(name => readFileSync(join(javascriptDirectory, name), 'utf8'))
  .join('\n');

function referencedStaticAssets(html) {
  return [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css)(?:\?[^"]*)?)"/g)]
    .map(match => match[1].split('?', 1)[0].replace(/^\/+/, ''));
}

function gzipAssets() {
  const directoryAssets = [javascriptDirectory, cssDirectory].flatMap(directory =>
    readdirSync(directory)
      .filter(name => name.endsWith('.gz'))
      .map(name => join(directory, name))
  );
  return [join(frontendDist, 'index.html.gz'), ...directoryAssets];
}

describe('frontend configuration deployment fixes', () => {
  it('does not block Bing configuration on preloading every wallpaper', () => {
    assert.doesNotMatch(javascriptSource, /await Promise\.all\([^)]*new Promise/);
    assert.match(javascriptSource, /setBingWallPapers/);
  });

  it('checks page configuration saves and refreshes public user config', () => {
    assert.match(javascriptSource, /Failed to save settings/);
    assert.match(javascriptSource, /fetchUserConfig/);
  });

  it('references only static assets that exist in the synchronized deployment', () => {
    const referencedAssets = referencedStaticAssets(indexHtml);
    assert.ok(referencedAssets.length > 0, 'index.html should reference built JS or CSS assets');
    referencedAssets.forEach(relativePath => {
      assert.ok(
        existsSync(join(frontendDist, relativePath)),
        `${relativePath} referenced by index.html should exist`
      );
    });
  });

  it('keeps deployment assets and their gzip variants synchronized', () => {
    const compressedAssets = gzipAssets();
    assert.ok(compressedAssets.length > 0, 'the build should include gzip assets');
    compressedAssets.forEach(gzipPath => {
      const sourcePath = gzipPath.slice(0, -3);
      assert.ok(existsSync(sourcePath), `${sourcePath} should exist for its gzip variant`);
      assert.deepEqual(gunzipSync(readFileSync(gzipPath)), readFileSync(sourcePath));
    });
  });

  it('does not deploy JavaScript source maps in production', () => {
    assert.equal(
      readdirSync(javascriptDirectory).some(name => name.endsWith('.map')),
      false
    );
  });
});
