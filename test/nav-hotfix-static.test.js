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
assert.match(fileModeActions, /key: "newFolder"/, 'dashboard tool actions should include new folder');
assert.match(fileModeActions, /key: "share"/, 'dashboard tool actions should include share');
assert.match(fileModeActions, /key: "importTelegram"/, 'dashboard tool actions should include Telegram import');
assert.doesNotMatch(fileModeActions, /key: "restoreTrash"/, 'dashboard tool actions should not include the unused trash restore shortcut');
assert.doesNotMatch(fileModeActions, /sourceGroups/, 'dashboard tool actions should not include Telegram source groups');

const updateFileModeActions = extractFunctionBody(navHotfix, 'updateFileModeActions');
assert.match(updateFileModeActions, /data-file-mode-action="restoreTrash"/, 'legacy trash restore shortcut should be removed if it already exists');

const ensureAdminNav = extractFunctionBody(navHotfix, 'ensureAdminNav');
assert.match(ensureAdminNav, /makeAdminActions\(\)/, 'admin nav should mount file management actions in the top bar');
assert.match(ensureAdminNav, /cfib-tabs-hotfix/, 'admin nav should still use the DashboardTabs host');
assert.match(ensureAdminNav, /cfib-tabs-unified/, 'DashboardTabs should expose a unified top navigation layout');

const runAdminAction = extractFunctionBody(navHotfix, 'runAdminAction');
assert.match(runAdminAction, /openTrashModal\(\)/, 'trash nav action should open the dedicated trash modal');
assert.doesNotMatch(runAdminAction, /openTrashView\(\)/, 'trash nav action should not reuse dashboard filter mode');

const refresh = extractFunctionBody(navHotfix, 'refresh');
assert.match(refresh, /ensureDashboardFileActions\(\)/, 'dashboard-local file action toolbar should be injected');
assert.match(refresh, /enforceDashboardModeRefresh\(\)/, 'dashboard mode should be enforced after refresh races settle');

const loadTrashFiles = extractFunctionBody(navHotfix, 'loadTrashFiles');
assert.match(loadTrashFiles, /listType=Trash/, 'trash modal should request only trashed files');
assert.match(loadTrashFiles, /recursive=true/, 'trash modal should list deleted files across folders');

const renderTrashFiles = extractFunctionBody(navHotfix, 'renderTrashFiles');
assert.match(renderTrashFiles, /data-trash-action="selectAll"/, 'trash modal should include a select-all checkbox');
assert.match(renderTrashFiles, /data-trash-action="bulkRestore"/, 'trash modal should include bulk restore');
assert.match(renderTrashFiles, /data-trash-action="bulkPermanent"/, 'trash modal should include bulk permanent delete');
assert.match(renderTrashFiles, /selectedTrashFiles\(\)/, 'bulk trash actions should operate on checked rows');

const renderTrashFileList = extractFunctionBody(navHotfix, 'renderTrashFileList');
assert.match(renderTrashFileList, /type="checkbox"/, 'trash rows should include checkboxes');
assert.match(renderTrashFileList, /data-trash-action="select"/, 'trash row checkboxes should update selection');

const confirmPermanentDelete = extractFunctionBody(navHotfix, 'confirmPermanentDelete');
assert.match(confirmPermanentDelete, /cfib-confirm-modal/, 'permanent delete should use an in-app confirmation modal');
assert.doesNotMatch(confirmPermanentDelete, /window\.confirm/, 'in-app confirmation should not use the browser confirm dialog');

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
const createFolderInCurrentPath = extractFunctionBody(navHotfix, 'createFolderInCurrentPath');
assert.match(createFolderInCurrentPath, /apiJson\("\/api\/manage\/folder"/, 'new folder should call the create folder API');
assert.match(createFolderInCurrentPath, /proxy\.currentPath/, 'new folder should use the current dashboard path as parent');
const createShareForCurrentTarget = extractFunctionBody(navHotfix, 'createShareForCurrentTarget');
assert.match(createShareForCurrentTarget, /apiJson\("\/api\/manage\/share"/, 'share action should call the create share API');
assert.match(createShareForCurrentTarget, /expiresInSeconds/, 'share action should submit expiring share links');
const resolveShareTarget = extractFunctionBody(navHotfix, 'resolveShareTarget');
assert.match(resolveShareTarget, /proxy\.selectedFiles/, 'share target should prefer a selected file or folder');
assert.match(resolveShareTarget, /proxy\.currentPath/, 'share target should fall back to the current directory');
assert.doesNotMatch(navHotfix, /window\.confirm/, 'trash permanent delete should not use browser confirm dialogs');

const ensureUploadNav = extractFunctionBody(navHotfix, 'ensureUploadNav');
assert.match(ensureUploadNav, /cfib-upload-home-hotfix/, 'upload page should receive the unified upload layout marker');
assert.match(ensureUploadNav, /makeNav\("cfib-upload-nav", false\)/, 'upload nav should not render the More dropdown');
assert.match(ensureUploadNav, /makeAdminActions\(\)/, 'upload nav should show the recycle bin action like other pages');
assert.doesNotMatch(ensureUploadNav, /ensureUploadTools\(host\)/, 'upload page should not move its native theme or language controls');

const ensureTabsUnifiedLayout = extractFunctionBody(navHotfix, 'ensureTabsUnifiedLayout');
assert.match(ensureTabsUnifiedLayout, /cfib-header-hotfix/, 'dashboard header should receive a stable layout marker');

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
const headerToolsRuleMatch = css.match(/\.cfib-header-hotfix \.cfib-tabs-tools\s*\{[^}]*\}/);
assert.ok(headerToolsRuleMatch, 'dashboard header tools should have a fixed left placement');
assert.match(headerToolsRuleMatch[0], /left:\s*18px/, 'dashboard theme and language controls should sit at the far left');
const headerActionsRuleMatch = css.match(/\.cfib-header-hotfix > \.actions,\s*\.cfib-header-hotfix > \.header-action,\s*\.cfib-header-hotfix > \.header-actions\s*\{[^}]*\}/);
assert.ok(headerActionsRuleMatch, 'dashboard header action containers should share a no-wrap right placement');
assert.match(headerActionsRuleMatch[0], /grid-column:\s*3/, 'dashboard logout controls should stay on the right edge');
assert.match(headerActionsRuleMatch[0], /grid-row:\s*1/, 'dashboard logout controls should stay on the first header row');
assert.match(headerActionsRuleMatch[0], /white-space:\s*nowrap/, 'dashboard logout controls should not wrap below the theme controls');
assert.match(css, /\.cfib-trash-file-row/, 'trash modal should have selectable row layout styles');
assert.match(css, /\.cfib-trash-toolbar/, 'trash modal should have a batch toolbar layout');
assert.match(css, /\.cfib-confirm-modal/, 'permanent delete should have an in-app confirmation modal style');
assert.match(css, /\.cfib-folder-input/, 'new folder modal should have input styles');
assert.match(css, /\.cfib-share-result/, 'share result modal should have styles');
assert.match(css, /\.cfib-primary-link/, 'share result should style the open link as a primary action');
assert.doesNotMatch(css, /quick-toolbar\[data-v-060c1790\]\s*\{[^}]*opacity:\s*0/, 'upload page quick toolbar should not be hidden by the nav hotfix');
assert.doesNotMatch(css, /\.cfib-upload-home-hotfix \.more-dropdown\.desktop-only/, 'upload page native More dropdown should not be hidden by the nav hotfix');
