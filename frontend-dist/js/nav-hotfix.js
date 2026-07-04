(function () {
  "use strict";

  var routes = [
    { key: "dashboard", path: "/dashboard", icon: "images" },
    { key: "customerConfig", path: "/customerConfig", icon: "user" },
    { key: "systemConfig", path: "/systemConfig", icon: "cogs" },
    { key: "upload", path: "/", icon: "upload" }
  ];

  var labels = {
    "zh-CN": {
      dashboard: "文件管理",
      customerConfig: "用户管理",
      systemConfig: "系统设置",
      upload: "文件上传",
      more: "更多",
      uploadSettings: "上传设置",
      linkFormat: "链接格式",
      manage: "系统管理",
      logout: "退出登录",
      trash: "回收站",
      importTelegram: "导入 Telegram",
      sourceGroups: "来源分组",
      close: "关闭",
      restore: "恢复",
      permanentDelete: "永久删除",
      open: "打开",
      loading: "加载中",
      refresh: "刷新",
      noFiles: "暂无文件",
      imported: "已导入",
      skipped: "已跳过",
      failed: "失败"
    },
    en: {
      dashboard: "Files",
      customerConfig: "Users",
      systemConfig: "Settings",
      upload: "Upload",
      more: "More",
      uploadSettings: "Upload Settings",
      linkFormat: "Link Format",
      manage: "Manage",
      logout: "Logout",
      trash: "Trash",
      importTelegram: "Import Telegram",
      sourceGroups: "Source Groups",
      close: "Close",
      restore: "Restore",
      permanentDelete: "Delete Forever",
      open: "Open",
      loading: "Loading",
      refresh: "Refresh",
      noFiles: "No files",
      imported: "Imported",
      skipped: "Skipped",
      failed: "Failed"
    }
  };

  var icons = {
    images: '<svg class="cfib-nav-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v13a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 18.5v-13Z" fill="none" stroke="currentColor" stroke-width="2"/><path d="m6 17 3.5-4 2.5 2.5 3.5-4.5L20 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9" cy="8" r="1.4" fill="currentColor"/></svg>',
    user: '<svg class="cfib-nav-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="8" r="3.2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4 20a6 6 0 0 1 12 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M18.5 10v5M16 12.5h5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    cogs: '<svg class="cfib-nav-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    upload: '<svg class="cfib-nav-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="m7.5 8.5 4.5-4.5 4.5 4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 15v3.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    more: '<svg class="cfib-nav-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.7" fill="currentColor"/><circle cx="12" cy="12" r="1.7" fill="currentColor"/><circle cx="19" cy="12" r="1.7" fill="currentColor"/></svg>',
    link: '<svg class="cfib-nav-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.1 0l1.4-1.4a5 5 0 0 0-7.1-7.1L10.5 5.4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M14 11a5 5 0 0 0-7.1 0l-1.4 1.4a5 5 0 0 0 7.1 7.1l.9-.9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    logout: '<svg class="cfib-nav-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M16 17l5-5-5-5M21 12H9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    trash: '<svg class="cfib-nav-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M7 6l1 15h8l1-15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    telegram: '<svg class="cfib-nav-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 4 3.7 10.8c-1 .4-.9 1.9.2 2.1l4.5.9 1.7 5.1c.3.9 1.5 1.1 2.1.3l2.5-3.2 4.2 3.1c.8.6 2 .1 2.2-.9L23 5.5c.2-1-.9-1.8-2-1.5Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="m8.5 13.8 7.1-5.1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    layers: '<svg class="cfib-nav-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 9 5-9 5-9-5 9-5Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };

  function locale() {
    return localStorage.getItem("app-locale") === "en" ? "en" : "zh-CN";
  }

  function text(key) {
    return labels[locale()][key] || labels["zh-CN"][key] || key;
  }

  function normalizedPath() {
    var path = window.location.pathname.replace(/\/+$/, "");
    return path || "/";
  }

  function activeKey() {
    var path = normalizedPath();
    var match = routes.find(function (route) {
      return route.path === path;
    });
    return match ? match.key : "";
  }

  function makeNav(className, includeActions) {
    var nav = document.createElement("nav");
    nav.className = "cfib-main-nav " + className;
    nav.setAttribute("aria-label", "Main navigation");

    routes.forEach(function (route) {
      var item = document.createElement("a");
      item.className = "cfib-nav-item";
      item.dataset.routeKey = route.key;
      item.href = route.path;
      item.innerHTML = icons[route.icon] + '<span class="cfib-nav-label"></span>';
      item.addEventListener("click", function (event) {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        if (normalizedPath() !== route.path) {
          window.history.pushState({}, "", route.path);
          window.dispatchEvent(new Event("popstate"));
        }
      });
      nav.appendChild(item);
    });

    if (includeActions) {
      nav.appendChild(makeUploadActions());
    }

    return nav;
  }

  function makeUploadActions() {
    var wrap = document.createElement("div");
    wrap.className = "cfib-upload-actions";
    wrap.innerHTML =
      '<button class="cfib-actions-trigger" type="button" aria-expanded="false">' +
      icons.more + '<span class="cfib-nav-label" data-label="more"></span></button>' +
      '<div class="cfib-upload-actions-panel" role="menu">' +
      '<button class="cfib-action-item" type="button" data-action="settings" role="menuitem">' + icons.upload + '<span data-label="uploadSettings"></span></button>' +
      '<button class="cfib-action-item" type="button" data-action="link" role="menuitem">' + icons.link + '<span data-label="linkFormat"></span></button>' +
      '<button class="cfib-action-item" type="button" data-action="manage" role="menuitem">' + icons.cogs + '<span data-label="manage"></span></button>' +
      '<button class="cfib-action-item" type="button" data-action="logout" role="menuitem">' + icons.logout + '<span data-label="logout"></span></button>' +
      '</div>';

    var trigger = wrap.querySelector(".cfib-actions-trigger");
    trigger.addEventListener("click", function (event) {
      event.stopPropagation();
      var isOpen = !wrap.classList.contains("is-open");
      closeActionMenus();
      wrap.classList.toggle("is-open", isOpen);
      trigger.setAttribute("aria-expanded", String(isOpen));
    });

    wrap.querySelectorAll("[data-action]").forEach(function (button) {
      button.addEventListener("click", function (event) {
        event.stopPropagation();
        closeActionMenus();
        runUploadAction(button.dataset.action);
      });
    });

    return wrap;
  }

  function makeAdminActions() {
    var wrap = document.createElement("div");
    wrap.className = "cfib-upload-actions cfib-admin-actions";
    wrap.innerHTML =
      '<button class="cfib-actions-trigger" type="button" aria-expanded="false">' +
      icons.more + '<span class="cfib-nav-label" data-label="more"></span></button>' +
      '<div class="cfib-upload-actions-panel" role="menu">' +
      '<button class="cfib-action-item" type="button" data-admin-action="trash" role="menuitem">' + icons.trash + '<span data-label="trash"></span></button>' +
      '<button class="cfib-action-item" type="button" data-admin-action="importTelegram" role="menuitem">' + icons.telegram + '<span data-label="importTelegram"></span></button>' +
      '<button class="cfib-action-item" type="button" data-admin-action="sourceGroups" role="menuitem">' + icons.layers + '<span data-label="sourceGroups"></span></button>' +
      '</div>';

    var trigger = wrap.querySelector(".cfib-actions-trigger");
    trigger.addEventListener("click", function (event) {
      event.stopPropagation();
      var isOpen = !wrap.classList.contains("is-open");
      closeActionMenus();
      wrap.classList.toggle("is-open", isOpen);
      trigger.setAttribute("aria-expanded", String(isOpen));
    });

    wrap.querySelectorAll("[data-admin-action]").forEach(function (button) {
      button.addEventListener("click", function (event) {
        event.stopPropagation();
        closeActionMenus();
        runAdminAction(button.dataset.adminAction);
      });
    });

    return wrap;
  }

  function updateNav(nav) {
    var current = activeKey();
    nav.querySelectorAll(".cfib-nav-item").forEach(function (item) {
      var key = item.dataset.routeKey;
      item.classList.toggle("is-active", key === current);
      item.setAttribute("aria-current", key === current ? "page" : "false");
      var label = item.querySelector(".cfib-nav-label");
      if (label) label.textContent = text(key);
    });
    nav.querySelectorAll("[data-label]").forEach(function (node) {
      node.textContent = text(node.dataset.label);
    });
  }

  function closeActionMenus() {
    document.querySelectorAll(".cfib-upload-actions.is-open").forEach(function (wrap) {
      wrap.classList.remove("is-open");
      var trigger = wrap.querySelector(".cfib-actions-trigger");
      if (trigger) trigger.setAttribute("aria-expanded", "false");
    });
  }

  function clickQuickToolbarButton(index) {
    var buttons = document.querySelectorAll(".quick-toolbar .quick-toolbar-button");
    if (!buttons[index]) return false;
    buttons[index].click();
    return true;
  }

  function runUploadAction(action) {
    if (action === "settings") {
      clickQuickToolbarButton(3);
      return;
    }
    if (action === "link") {
      clickQuickToolbarButton(2);
      return;
    }
    if (action === "manage") {
      window.history.pushState({}, "", "/dashboard");
      window.dispatchEvent(new Event("popstate"));
      return;
    }
    if (action === "logout") {
      fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authType: "user" })
      }).finally(function () {
        window.history.pushState({}, "", "/login");
        window.dispatchEvent(new Event("popstate"));
      });
    }
  }

  function runAdminAction(action) {
    if (action === "trash") {
      openTrashModal();
      return;
    }
    if (action === "importTelegram") {
      importTelegramUpdates();
      return;
    }
    if (action === "sourceGroups") {
      openSourceGroupsModal();
    }
  }

  function ensureModal() {
    var modal = document.querySelector(".cfib-modal");
    if (modal) return modal;

    modal = document.createElement("div");
    modal.className = "cfib-modal";
    modal.innerHTML =
      '<div class="cfib-modal-backdrop" data-modal-close="true"></div>' +
      '<section class="cfib-modal-panel" role="dialog" aria-modal="true">' +
      '<header class="cfib-modal-header">' +
      '<h2 class="cfib-modal-title"></h2>' +
      '<button class="cfib-modal-close" type="button" data-modal-close="true" aria-label="' + escapeHtml(text("close")) + '">×</button>' +
      '</header>' +
      '<div class="cfib-modal-body"></div>' +
      '</section>';

    modal.addEventListener("click", function (event) {
      if (event.target && event.target.dataset.modalClose === "true") {
        closeModal();
      }
    });
    document.body.appendChild(modal);
    return modal;
  }

  function showModal(title, content) {
    var modal = ensureModal();
    modal.querySelector(".cfib-modal-title").textContent = title;
    modal.querySelector(".cfib-modal-body").innerHTML = content;
    modal.classList.add("is-open");
  }

  function closeModal() {
    var modal = document.querySelector(".cfib-modal");
    if (modal) modal.classList.remove("is-open");
  }

  function showLoading(title) {
    showModal(title, '<div class="cfib-modal-state">' + escapeHtml(text("loading")) + '</div>');
  }

  function apiJson(url, options) {
    return fetch(url, Object.assign({
      credentials: "include",
      headers: { "Content-Type": "application/json" }
    }, options || {})).then(function (response) {
      return response.json().catch(function () {
        return {};
      }).then(function (data) {
        if (!response.ok || data.success === false) {
          throw new Error(data.error || data.message || response.statusText);
        }
        return data;
      });
    });
  }

  function openTrashModal() {
    showLoading(text("trash"));
    loadTrashFiles();
  }

  function loadTrashFiles() {
    apiJson("/api/manage/list?listType=Trash&count=-1&recursive=true")
      .then(function (data) {
        renderTrashFiles(data.files || []);
      })
      .catch(function (error) {
        renderError(text("trash"), error);
      });
  }

  function renderTrashFiles(files) {
    var html = '<div class="cfib-modal-toolbar"><button class="cfib-secondary-btn" type="button" data-trash-action="refresh">' + escapeHtml(text("refresh")) + '</button></div>';
    html += renderFileList(files, function (file) {
      var filePath = encodeFilePath(file.name);
      return '<button class="cfib-secondary-btn" type="button" data-trash-action="restore" data-file="' + escapeHtml(file.name) + '">' + escapeHtml(text("restore")) + '</button>' +
        '<button class="cfib-danger-btn" type="button" data-trash-action="permanent" data-file="' + escapeHtml(file.name) + '">' + escapeHtml(text("permanentDelete")) + '</button>' +
        '<a class="cfib-secondary-btn" href="/file/' + filePath + '?from=admin" target="_blank" rel="noreferrer">' + escapeHtml(text("open")) + '</a>';
    });
    showModal(text("trash"), html);

    var modal = ensureModal();
    modal.querySelectorAll("[data-trash-action]").forEach(function (button) {
      button.addEventListener("click", function () {
        var action = button.dataset.trashAction;
        if (action === "refresh") {
          loadTrashFiles();
          return;
        }

        var fileId = button.dataset.file;
        if (action === "restore") {
          restoreTrashFile(fileId);
        } else if (action === "permanent") {
          permanentDeleteFile(fileId);
        }
      });
    });
  }

  function restoreTrashFile(fileId) {
    apiJson("/api/manage/trash/restore/" + encodeManagePath(fileId), { method: "POST" })
      .then(loadTrashFiles)
      .catch(function (error) {
        renderError(text("trash"), error);
      });
  }

  function permanentDeleteFile(fileId) {
    if (!window.confirm(text("permanentDelete") + ": " + fileId)) return;
    apiJson("/api/manage/delete/" + encodeManagePath(fileId) + "?permanent=true", { method: "DELETE" })
      .then(loadTrashFiles)
      .catch(function (error) {
        renderError(text("trash"), error);
      });
  }

  function importTelegramUpdates() {
    showLoading(text("importTelegram"));
    apiJson("/api/manage/telegram/import", { method: "POST", body: JSON.stringify({}) })
      .then(function (data) {
        var html = '<div class="cfib-import-summary">' +
          summaryPill(text("imported"), data.imported ? data.imported.length : 0) +
          summaryPill(text("skipped"), data.skipped ? data.skipped.length : 0) +
          summaryPill(text("failed"), data.failed ? data.failed.length : 0) +
          '</div>';
        html += '<div class="cfib-modal-note">' + escapeHtml(data.note || '') + '</div>';
        html += renderResultList(data.imported || [], "fileId");
        if (data.failed && data.failed.length) {
          html += renderResultList(data.failed, "error");
        }
        showModal(text("importTelegram"), html);
      })
      .catch(function (error) {
        renderError(text("importTelegram"), error);
      });
  }

  function openSourceGroupsModal() {
    showLoading(text("sourceGroups"));
    apiJson("/api/manage/source-groups")
      .then(function (data) {
        renderSourceGroups(data.groups || []);
      })
      .catch(function (error) {
        renderError(text("sourceGroups"), error);
      });
  }

  function renderSourceGroups(groups) {
    if (!groups.length) {
      showModal(text("sourceGroups"), '<div class="cfib-modal-state">' + escapeHtml(text("noFiles")) + '</div>');
      return;
    }

    var html = '<div class="cfib-source-groups">';
    groups.forEach(function (group) {
      html += '<button class="cfib-source-group" type="button" data-source-group="' + escapeHtml(group.key) + '">' +
        '<span>' + escapeHtml(group.displayName || (group.type + "/" + group.name)) + '</span>' +
        '<strong>' + Number(group.count || 0) + '</strong>' +
        '</button>';
    });
    html += '</div><div class="cfib-source-files"></div>';
    showModal(text("sourceGroups"), html);

    var modal = ensureModal();
    modal.querySelectorAll("[data-source-group]").forEach(function (button) {
      button.addEventListener("click", function () {
        loadSourceGroupFiles(button.dataset.sourceGroup);
      });
    });
  }

  function loadSourceGroupFiles(sourceGroupKey) {
    var target = ensureModal().querySelector(".cfib-source-files");
    if (target) target.innerHTML = '<div class="cfib-modal-state">' + escapeHtml(text("loading")) + '</div>';
    apiJson("/api/manage/list?count=-1&recursive=true&sourceGroup=" + encodeURIComponent(sourceGroupKey))
      .then(function (data) {
        if (target) {
          target.innerHTML = renderFileList(data.files || [], function (file) {
            return '<a class="cfib-secondary-btn" href="/file/' + encodeFilePath(file.name) + '?from=admin" target="_blank" rel="noreferrer">' + escapeHtml(text("open")) + '</a>';
          });
        }
      })
      .catch(function (error) {
        if (target) target.innerHTML = '<div class="cfib-modal-error">' + escapeHtml(error.message) + '</div>';
      });
  }

  function renderFileList(files, actionRenderer) {
    if (!files.length) {
      return '<div class="cfib-modal-state">' + escapeHtml(text("noFiles")) + '</div>';
    }

    return '<div class="cfib-file-list">' + files.map(function (file) {
      var metadata = file.metadata || {};
      var tags = Array.isArray(metadata.Tags) && metadata.Tags.length
        ? '<div class="cfib-file-tags">' + metadata.Tags.map(function (tag) {
          return '<span>' + escapeHtml(tag) + '</span>';
        }).join("") + '</div>'
        : '';
      return '<article class="cfib-file-row">' +
        '<div class="cfib-file-main">' +
        '<strong>' + escapeHtml(metadata.FileName || file.name) + '</strong>' +
        '<span>' + escapeHtml(file.name) + '</span>' +
        tags +
        '</div>' +
        '<div class="cfib-file-actions">' + actionRenderer(file) + '</div>' +
        '</article>';
    }).join("") + '</div>';
  }

  function renderResultList(items, key) {
    if (!items.length) return "";
    return '<div class="cfib-result-list">' + items.map(function (item) {
      return '<div><strong>' + escapeHtml(item.channelName || "") + '</strong><span>' + escapeHtml(item[key] || item.messageId || "") + '</span></div>';
    }).join("") + '</div>';
  }

  function renderError(title, error) {
    showModal(title, '<div class="cfib-modal-error">' + escapeHtml(error.message || String(error)) + '</div>');
  }

  function summaryPill(label, value) {
    return '<span><strong>' + Number(value || 0) + '</strong>' + escapeHtml(label) + '</span>';
  }

  function encodeManagePath(fileId) {
    return encodeURIComponent(String(fileId || "").split("/").join(","));
  }

  function encodeFilePath(fileId) {
    return String(fileId || "").split("/").map(encodeURIComponent).join("/");
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function ensureUploadNav() {
    var existing = document.querySelector(".cfib-upload-nav");
    if (normalizedPath() !== "/") {
      if (existing) existing.remove();
      return;
    }

    var host = document.querySelector(".upload-home");
    if (!host) return;

    if (!existing) {
      existing = makeNav("cfib-upload-nav", true);
      host.appendChild(existing);
    }
    updateNav(existing);
  }

  function ensureAdminNav() {
    var tabs = document.querySelector(".tabs");
    var pageSwitcher = tabs && tabs.querySelector(".page-switcher");
    if (!tabs || !pageSwitcher) return;

    tabs.classList.add("cfib-tabs-hotfix");
    var nav = tabs.querySelector(".cfib-admin-nav");
    if (!nav) {
      nav = makeNav("cfib-admin-nav", false);
      nav.appendChild(makeAdminActions());
      tabs.insertBefore(nav, pageSwitcher);
    }
    updateNav(nav);
  }

  function refresh() {
    ensureUploadNav();
    ensureAdminNav();
    document.querySelectorAll(".cfib-main-nav").forEach(updateNav);
  }

  var pending = 0;
  function scheduleRefresh() {
    if (pending) return;
    pending = window.requestAnimationFrame(function () {
      pending = 0;
      refresh();
    });
  }

  ["pushState", "replaceState"].forEach(function (method) {
    var original = history[method];
    history[method] = function () {
      var result = original.apply(this, arguments);
      scheduleRefresh();
      return result;
    };
  });

  document.addEventListener("click", closeActionMenus);
  window.addEventListener("popstate", scheduleRefresh);
  window.addEventListener("storage", scheduleRefresh);
  new MutationObserver(scheduleRefresh).observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", refresh);
  } else {
    refresh();
  }
})();
