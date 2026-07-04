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
assert.match(adminActions, /key: "importTelegram"/, 'top nav should include the Telegram import action');
assert.doesNotMatch(adminActions, /sourceGroups/, 'top nav should not include Telegram source groups');

const ensureAdminNav = extractFunctionBody(navHotfix, 'ensureAdminNav');
assert.match(ensureAdminNav, /makeAdminActions\(\)/, 'admin nav should mount file management actions in the top bar');

assert.doesNotMatch(navHotfix, /ensureDashboardFileActions\(\);/, 'dashboard breadcrumb action toolbar should not be injected');
assert.doesNotMatch(navHotfix, /cfib-file-mode-actions/, 'breadcrumb file-mode toolbar should not remain in the runtime script');

const importTelegramUpdates = extractFunctionBody(navHotfix, 'importTelegramUpdates');
assert.doesNotMatch(importTelegramUpdates, /withDashboardProxy/, 'Telegram import should not wait for the dashboard proxy');
assert.match(importTelegramUpdates, /apiJson\("\/api\/manage\/telegram\/import"/, 'Telegram import should call the import API directly');
