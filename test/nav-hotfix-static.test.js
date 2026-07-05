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
assert.match(ensureAdminNav, /cfib-tabs-hotfix/, 'admin nav should still use the DashboardTabs host');
assert.match(ensureAdminNav, /cfib-tabs-unified/, 'DashboardTabs should expose a unified top navigation layout');

const refresh = extractFunctionBody(navHotfix, 'refresh');
assert.match(refresh, /ensureDashboardFileActions\(\)/, 'dashboard-local file action toolbar should be injected');
assert.match(refresh, /enforceDashboardModeRefresh\(\)/, 'dashboard mode should be enforced after refresh races settle');

const applyDashboardMode = extractFunctionBody(navHotfix, 'applyDashboardMode');
assert.match(applyDashboardMode, /trashDashboardFilters\(\)/, 'trash mode should use the trash-only dashboard filters');
assert.match(applyDashboardMode, /currentDashboardMode = mode/, 'dashboard mode should persist beyond the initial navigation request');

const trashDashboardFilters = extractFunctionBody(navHotfix, 'trashDashboardFilters');
assert.match(trashDashboardFilters, /filters\.listType = \["Trash"\]/, 'trash dashboard filters should include deleted files only');

const patchDashboardModeRefresh = extractFunctionBody(navHotfix, 'patchDashboardModeRefresh');
assert.match(patchDashboardModeRefresh, /__cfibModeRefreshPatched/, 'dashboard refresh should only be wrapped once');
assert.match(patchDashboardModeRefresh, /forceDashboardModeFilters/, 'wrapped refresh should force the active dashboard mode filters');
assert.match(patchDashboardModeRefresh, /currentDashboardMode === "trash"/, 'wrapped refresh should protect trash mode from normal refresh races');

const importTelegramUpdates = extractFunctionBody(navHotfix, 'importTelegramUpdates');
assert.doesNotMatch(importTelegramUpdates, /withDashboardProxy/, 'Telegram import should not wait for the dashboard proxy');
assert.match(importTelegramUpdates, /apiJson\("\/api\/manage\/telegram\/import"/, 'Telegram import should call the import API directly');

const ensureUploadNav = extractFunctionBody(navHotfix, 'ensureUploadNav');
assert.match(ensureUploadNav, /cfib-upload-home-hotfix/, 'upload page should receive the unified upload layout marker');
assert.match(ensureUploadNav, /ensureUploadTools\(host\)/, 'upload page should mount left-side theme and language tools');

const ensureUploadTools = extractFunctionBody(navHotfix, 'ensureUploadTools');
assert.match(ensureUploadTools, /cfib-upload-tools/, 'upload tools wrapper should be created');
assert.match(ensureUploadTools, /toggle-dark-button\.desktop-only/, 'upload tools should reuse the existing theme toggle');
assert.match(ensureUploadTools, /makeUploadLanguageButton/, 'upload tools should provide a language control');

const ensureTabsUnifiedLayout = extractFunctionBody(navHotfix, 'ensureTabsUnifiedLayout');
assert.match(ensureTabsUnifiedLayout, /cfib-header-hotfix/, 'dashboard header should receive a stable layout marker');

const makeUploadActions = extractFunctionBody(navHotfix, 'makeUploadActions');
assert.match(makeUploadActions, /data-action="uploadMethod"/, 'upload more menu should preserve upload method switching');
assert.match(makeUploadActions, /data-action="history"/, 'upload more menu should preserve upload history');
assert.match(makeUploadActions, /data-action="announcement"/, 'upload more menu should preserve announcements');
assert.match(makeUploadActions, /data-action="language"/, 'upload more menu should preserve language switching');
assert.match(makeUploadActions, /data-action="docs"/, 'upload more menu should preserve docs access');

const runUploadAction = extractFunctionBody(navHotfix, 'runUploadAction');
assert.match(runUploadAction, /runUploadProxyCommand\("toggleUploadMethod"\)/, 'upload method switching should delegate to the upload Vue component');
assert.match(runUploadAction, /runUploadProxyCommand\("showHistory"\)/, 'upload history should delegate to the upload Vue component');
assert.match(runUploadAction, /runUploadProxyCommand\("toggleLanguage"\)/, 'upload language switching should delegate to the upload Vue component');

const css = readFileSync(new URL('../frontend-dist/css/nav-hotfix.css', import.meta.url), 'utf8');
const adminNavRuleMatch = css.match(/\.cfib-tabs-hotfix \.cfib-admin-nav\s*\{[^}]*\}/);
assert.ok(adminNavRuleMatch, 'admin nav CSS rule should exist');
assert.doesNotMatch(adminNavRuleMatch[0], /position:\s*fixed/, 'admin nav should be embedded in the top bar instead of fixed');
const unifiedTabsRuleMatch = css.match(/\.cfib-tabs-hotfix\.cfib-tabs-unified\s*\{[^}]*\}/);
assert.ok(unifiedTabsRuleMatch, 'DashboardTabs should have a unified layout rule');
assert.match(unifiedTabsRuleMatch[0], /grid-template-columns:\s*minmax\(0,\s*1fr\)\s+auto\s+minmax\(0,\s*1fr\)/, 'theme and language controls should sit on the left while nav stays centered');
assert.match(unifiedTabsRuleMatch[0], /width:\s*calc\(95% - 16px\)/, 'DashboardTabs should span the dashboard header so the nav can center in the viewport');
const unifiedNavRuleMatch = css.match(/\.cfib-tabs-hotfix\.cfib-tabs-unified \.cfib-admin-nav\s*\{[^}]*\}/);
assert.ok(unifiedNavRuleMatch, 'unified DashboardTabs should center the admin nav');
assert.match(unifiedNavRuleMatch[0], /grid-column:\s*2/, 'admin nav should occupy the center grid column');
assert.match(css, /\.cfib-header-hotfix/, 'dashboard header should switch to a grid overlay for true centered nav');
const uploadToolsRuleMatch = css.match(/\.cfib-upload-home-hotfix \.cfib-upload-tools\s*\{[^}]*\}/);
assert.ok(uploadToolsRuleMatch, 'upload page should have a left-side tools rule');
assert.match(uploadToolsRuleMatch[0], /left:\s*24px/, 'upload page tools should sit at the left edge on desktop');
const uploadToolsDesktopRuleMatch = css.match(/\.cfib-upload-home-hotfix \.cfib-upload-tools \.desktop-only\s*\{[^}]*\}/);
assert.ok(uploadToolsDesktopRuleMatch, 'upload tools should override the legacy mobile desktop-only rule');
assert.match(uploadToolsDesktopRuleMatch[0], /display:\s*inline-flex !important/, 'upload tools should keep the moved theme toggle visible');
const uploadLegacyMenuRuleMatch = css.match(/\.cfib-upload-home-hotfix \.more-dropdown\.desktop-only,[\s\S]*?\.cfib-upload-home-hotfix \.mobile-more-dropdown\.mobile-only\s*\{[^}]*\}/);
assert.ok(uploadLegacyMenuRuleMatch, 'legacy upload more menus should be hidden when hotfix layout is active');
assert.match(uploadLegacyMenuRuleMatch[0], /display:\s*none !important/, 'legacy upload more menus should not compete with the unified More menu');
