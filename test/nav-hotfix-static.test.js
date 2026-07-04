import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const navHotfix = readFileSync(new URL('../frontend-dist/js/nav-hotfix.js', import.meta.url), 'utf8');

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

const adminActions = extractFunctionBody(navHotfix, 'makeAdminActions');
assert.match(adminActions, /key: "trash"/, 'top nav should include the recycle bin action');
assert.doesNotMatch(adminActions, /key: "importTelegram"/, 'top nav should not include the Telegram import action');
assert.doesNotMatch(adminActions, /key: "restoreTrash"/, 'top nav should not include the trash restore action');
assert.doesNotMatch(adminActions, /sourceGroups/, 'top nav should not include Telegram source groups');

const fileModeActions = extractFunctionBody(navHotfix, 'makeFileModeActions');
assert.match(fileModeActions, /cfib-file-mode-actions/, 'file management tool actions should be rendered in the dashboard area');
assert.match(fileModeActions, /key: "importTelegram"/, 'dashboard tool actions should include Telegram import');
assert.match(fileModeActions, /key: "restoreTrash"/, 'dashboard tool actions should include trash restore');
assert.doesNotMatch(fileModeActions, /sourceGroups/, 'dashboard tool actions should not include Telegram source groups');

const ensureAdminNav = extractFunctionBody(navHotfix, 'ensureAdminNav');
assert.match(ensureAdminNav, /makeAdminActions\(\)/, 'admin nav should mount file management actions in the top bar');

const refresh = extractFunctionBody(navHotfix, 'refresh');
assert.match(refresh, /ensureDashboardFileActions\(\)/, 'dashboard-local file action toolbar should be injected');

const applyDashboardMode = extractFunctionBody(navHotfix, 'applyDashboardMode');
assert.match(applyDashboardMode, /filters\.listType = \["Trash"\]/, 'trash mode should filter the dashboard to deleted files only');

const importTelegramUpdates = extractFunctionBody(navHotfix, 'importTelegramUpdates');
assert.doesNotMatch(importTelegramUpdates, /withDashboardProxy/, 'Telegram import should not wait for the dashboard proxy');
assert.match(importTelegramUpdates, /apiJson\("\/api\/manage\/telegram\/import"/, 'Telegram import should call the import API directly');

const css = readFileSync(new URL('../frontend-dist/css/nav-hotfix.css', import.meta.url), 'utf8');
const adminNavRuleMatch = css.match(/\.cfib-tabs-hotfix \.cfib-admin-nav\s*\{[^}]*\}/);
assert.ok(adminNavRuleMatch, 'admin nav CSS rule should exist');
assert.doesNotMatch(adminNavRuleMatch[0], /position:\s*fixed/, 'admin nav should be embedded in the top bar instead of fixed');
