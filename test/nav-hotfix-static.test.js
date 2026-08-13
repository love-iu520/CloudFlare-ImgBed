import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const navHotfix = readFileSync(
  new URL('../frontend-dist/js/nav-hotfix.js', import.meta.url),
  'utf8',
);
const css = readFileSync(
  new URL('../frontend-dist/css/nav-hotfix.css', import.meta.url),
  'utf8',
);

function extractFunctionBody(source, name) {
  const signature = `function ${name}(`;
  const start = source.indexOf(signature);
  assert.notEqual(start, -1, `${name} should exist`);

  const bodyStart = source.indexOf('{', start);
  assert.notEqual(bodyStart, -1, `${name} should have a body`);

  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    const char = source[index];
    if (char === '{') depth += 1;
    if (char === '}') depth -= 1;
    if (depth === 0) {
      return source.slice(bodyStart + 1, index);
    }
  }

  throw new Error(`${name} body was not closed`);
}

describe('navigation hotfix deployment', () => {
  it('keeps the shared upload and administration navigation', () => {
    const ensureUploadNav = extractFunctionBody(navHotfix, 'ensureUploadNav');
    const ensureAdminNav = extractFunctionBody(navHotfix, 'ensureAdminNav');
    const ensureTabsUnifiedLayout = extractFunctionBody(navHotfix, 'ensureTabsUnifiedLayout');

    assert.match(ensureUploadNav, /cfib-upload-home-hotfix/);
    assert.match(ensureUploadNav, /makeNav\("cfib-upload-nav", false\)/);
    assert.match(ensureAdminNav, /makeNav\("cfib-admin-nav", false\)/);
    assert.match(ensureAdminNav, /ensureTabsUnifiedLayout/);
    assert.match(ensureTabsUnifiedLayout, /cfib-header-hotfix/);
  });

  it('keeps click-to-close behavior for the native image preview', () => {
    const previewPatch = extractFunctionBody(navHotfix, 'patchImagePreviewClickToClose');
    const refresh = extractFunctionBody(navHotfix, 'refresh');

    assert.match(previewPatch, /el-image-viewer__img/);
    assert.match(previewPatch, /el-image-viewer__close/);
    assert.match(previewPatch, /pointerdown/);
    assert.match(previewPatch, /KeyboardEvent\("keydown"/);
    assert.match(refresh, /patchImagePreviewClickToClose\(\)/);
  });

  it('throttles navigation refreshes and ignores transient UI mutations', () => {
    const scheduleRefresh = extractFunctionBody(navHotfix, 'scheduleRefresh');
    const mutationFilter = extractFunctionBody(navHotfix, 'shouldScheduleRefreshForMutations');
    const transientNodeCheck = extractFunctionBody(navHotfix, 'isTransientRefreshNode');

    assert.match(scheduleRefresh, /refreshThrottleMs/);
    assert.match(scheduleRefresh, /setTimeout/);
    assert.match(mutationFilter, /mutationNodesNeedRefresh/);
    assert.match(transientNodeCheck, /img-card, \.file-card/);
    assert.match(navHotfix, /document\.getElementById\("app"\) \|\| document\.body/);
  });

  it('does not duplicate management features that moved into Vue components', () => {
    [
      'makeAdminActions',
      'makeFileModeActions',
      'openTrashModal',
      'createFolderInCurrentPath',
      'createShareForCurrentTarget',
      'openShareManager',
      'importTelegramUpdates',
    ].forEach(name => {
      assert.doesNotMatch(navHotfix, new RegExp(`function ${name}\\(`));
    });

    assert.doesNotMatch(css, /\.cfib-trash-/);
    assert.doesNotMatch(css, /\.cfib-share-/);
    assert.doesNotMatch(css, /\.cfib-folder-input/);
  });

  it('keeps the unified navigation layout without hiding native upload controls', () => {
    const unifiedTabsRule = css.match(/\.cfib-tabs-hotfix\.cfib-tabs-unified\s*\{[^}]*\}/);
    const unifiedNavRule = css.match(/\.cfib-tabs-hotfix\.cfib-tabs-unified \.cfib-admin-nav\s*\{[^}]*\}/);
    const headerSearchRule = css.match(/\.cfib-header-hotfix > \.header-search\s*\{[^}]*\}/);
    const headerActionsRule = css.match(
      /\.cfib-header-hotfix > \.actions,\s*\.cfib-header-hotfix > \.header-action,\s*\.cfib-header-hotfix > \.header-actions\s*\{[^}]*\}/,
    );

    assert.ok(unifiedTabsRule, 'unified tabs CSS rule should exist');
    assert.match(
      unifiedTabsRule[0],
      /grid-template-columns:\s*minmax\(0,\s*1fr\)\s+auto\s+minmax\(0,\s*1fr\)/,
    );
    assert.ok(unifiedNavRule, 'unified administration navigation rule should exist');
    assert.match(unifiedNavRule[0], /grid-column:\s*2/);
    assert.match(css, /\.cfib-header-hotfix/);
    assert.ok(headerSearchRule, 'header search should retain its grid placement rule');
    assert.match(headerSearchRule[0], /grid-column:\s*2/);
    assert.match(headerSearchRule[0], /grid-row:\s*1/);
    assert.ok(headerActionsRule, 'header actions should retain their layout rule');
    assert.match(headerActionsRule[0], /grid-column:\s*3/);
    assert.match(headerActionsRule[0], /white-space:\s*nowrap/);
    assert.doesNotMatch(css, /quick-toolbar[^}]*opacity:\s*0/);
    assert.doesNotMatch(css, /\.cfib-upload-home-hotfix \.more-dropdown\.desktop-only/);
  });
});
