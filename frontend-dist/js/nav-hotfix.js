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
      uploadMethod: "切换上传方式",
      linkFormat: "链接格式",
      manage: "系统管理",
      logout: "退出登录",
      uploadHistory: "上传记录",
      announcement: "查看公告",
      language: "语言",
      docs: "查看文档",
      copy: "复制",
      close: "关闭",
      open: "打开",
      loading: "加载中",
      refresh: "刷新",
      noFiles: "暂无文件",
      dashboardUnavailable: "文件管理界面尚未就绪",
      selectAll: "全选",
      selectedCount: "已选",
      deleteSelected: "删除选中",
      confirm: "确定",
      cancel: "取消"
    },
    en: {
      dashboard: "Files",
      customerConfig: "Users",
      systemConfig: "Settings",
      upload: "Upload",
      more: "More",
      uploadSettings: "Upload Settings",
      uploadMethod: "Switch Upload Method",
      linkFormat: "Link Format",
      manage: "Manage",
      logout: "Logout",
      uploadHistory: "Upload History",
      announcement: "Announcements",
      language: "Language",
      docs: "Docs",
      copy: "Copy",
      close: "Close",
      open: "Open",
      loading: "Loading",
      refresh: "Refresh",
      noFiles: "No files",
      dashboardUnavailable: "File manager is not ready",
      selectAll: "Select All",
      selectedCount: "Selected",
      deleteSelected: "Delete Selected",
      confirm: "Confirm",
      cancel: "Cancel"
    }
  };

  var icons = {
    images: '<svg class="cfib-nav-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v13a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 18.5v-13Z" fill="none" stroke="currentColor" stroke-width="2"/><path d="m6 17 3.5-4 2.5 2.5 3.5-4.5L20 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9" cy="8" r="1.4" fill="currentColor"/></svg>',
    user: '<svg class="cfib-nav-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="8" r="3.2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4 20a6 6 0 0 1 12 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M18.5 10v5M16 12.5h5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    cogs: '<svg class="cfib-nav-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    upload: '<svg class="cfib-nav-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="m7.5 8.5 4.5-4.5 4.5 4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 15v3.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    more: '<svg class="cfib-nav-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.7" fill="currentColor"/><circle cx="12" cy="12" r="1.7" fill="currentColor"/><circle cx="19" cy="12" r="1.7" fill="currentColor"/></svg>',
    link: '<svg class="cfib-nav-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.1 0l1.4-1.4a5 5 0 0 0-7.1-7.1L10.5 5.4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M14 11a5 5 0 0 0-7.1 0l-1.4 1.4a5 5 0 0 0 7.1 7.1l.9-.9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    list: '<svg class="cfib-nav-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6h12M8 12h12M8 18h12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="4" cy="6" r="1.4" fill="currentColor"/><circle cx="4" cy="12" r="1.4" fill="currentColor"/><circle cx="4" cy="18" r="1.4" fill="currentColor"/></svg>',
    logout: '<svg class="cfib-nav-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M16 17l5-5-5-5M21 12H9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    history: '<svg class="cfib-nav-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 4v4h4M12 7v5l3 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    announcement: '<svg class="cfib-nav-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11v3a2 2 0 0 0 2 2h2l4 3v-3h2l6 3V5l-6 3H6a2 2 0 0 0-2 2v1Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M14 8v8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    globe: '<svg class="cfib-nav-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    docs: '<svg class="cfib-nav-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H20v17H7.5A2.5 2.5 0 0 0 5 21.5v-17Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M8 6h8M8 10h7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  };

  var dashboardProxyCache = { proxy: null, path: "", expiresAt: 0 };
  var imagePreviewClickToClosePatched = false;
  var imagePreviewPointer = null;

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
      '<button class="cfib-action-item" type="button" data-action="uploadMethod" role="menuitem">' + icons.upload + '<span data-label="uploadMethod"></span></button>' +
      '<button class="cfib-action-item" type="button" data-action="link" role="menuitem">' + icons.link + '<span data-label="linkFormat"></span></button>' +
      '<button class="cfib-action-item" type="button" data-action="manage" role="menuitem">' + icons.cogs + '<span data-label="manage"></span></button>' +
      '<button class="cfib-action-item" type="button" data-action="logout" role="menuitem">' + icons.logout + '<span data-label="logout"></span></button>' +
      '<button class="cfib-action-item" type="button" data-action="history" role="menuitem">' + icons.history + '<span data-label="uploadHistory"></span></button>' +
      '<button class="cfib-action-item" type="button" data-action="announcement" role="menuitem">' + icons.announcement + '<span data-label="announcement"></span></button>' +
      '<button class="cfib-action-item" type="button" data-action="language" role="menuitem">' + icons.globe + '<span data-label="language"></span></button>' +
      '<button class="cfib-action-item" type="button" data-action="docs" role="menuitem">' + icons.docs + '<span data-label="docs"></span></button>' +
      '</div>';

    var trigger = wrap.querySelector(".cfib-actions-trigger");
    trigger.addEventListener("click", function (event) {
      event.stopPropagation();
      var isOpen = !wrap.classList.contains("is-open");
      closeActionMenus();
      wrap.classList.toggle("is-open", isOpen);
      trigger.setAttribute("aria-expanded", String(isOpen));
      if (isOpen) positionActionPanel(wrap);
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

  function updateNav(nav) {
    var current = activeKey();
    nav.querySelectorAll(".cfib-nav-item").forEach(function (item) {
      var key = item.dataset.routeKey;
      var itemActive = key === current;
      item.classList.toggle("is-active", itemActive);
      item.setAttribute("aria-current", itemActive ? "page" : "false");
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
      var panel = wrap.querySelector(".cfib-upload-actions-panel");
      if (panel) {
        panel.style.left = "";
        panel.style.top = "";
      }
    });
  }

  function positionActionPanel(wrap) {
    var trigger = wrap.querySelector(".cfib-actions-trigger");
    var panel = wrap.querySelector(".cfib-upload-actions-panel");
    if (!trigger || !panel) return;

    var triggerRect = trigger.getBoundingClientRect();
    var panelRect = panel.getBoundingClientRect();
    var margin = 8;
    var panelWidth = panelRect.width || 180;
    var left = Math.min(
      window.innerWidth - panelWidth - margin,
      Math.max(margin, triggerRect.right - panelWidth)
    );
    var top = Math.min(
      window.innerHeight - margin,
      triggerRect.bottom + margin
    );

    panel.style.left = left + "px";
    panel.style.top = top + "px";
  }

  function positionOpenActionMenus() {
    document.querySelectorAll(".cfib-upload-actions.is-open").forEach(positionActionPanel);
  }

  function clickQuickToolbarButton(index) {
    var buttons = document.querySelectorAll(".quick-toolbar .quick-toolbar-button");
    if (!buttons[index]) return false;
    buttons[index].click();
    return true;
  }

  function findUploadProxy() {
    var nodes = document.querySelectorAll(".upload-home, .container, #app *");
    for (var index = 0; index < nodes.length; index += 1) {
      var instance = nodes[index].__vueParentComponent;
      while (instance) {
        if (instance.proxy && (typeof instance.proxy.handleDesktopMenuCommand === "function" || typeof instance.proxy.handleQuickToolbarCommand === "function")) {
          return instance.proxy;
        }
        instance = instance.parent;
      }
    }
    return null;
  }

  function runUploadProxyCommand(command) {
    var proxy = findUploadProxy();
    if (!proxy) return false;

    if ((command === "linkFormat" || command === "manage" || command === "logout") && typeof proxy.handleQuickToolbarCommand === "function") {
      proxy.handleQuickToolbarCommand(command);
      return true;
    }

    if (command === "toggleUploadMethod" && typeof proxy.handleChangeUploadMethod === "function") {
      proxy.handleChangeUploadMethod();
      return true;
    }

    if ((command === "showHistory" || command === "showAnnouncement" || command === "toggleLanguage" || command === "viewDocs") && typeof proxy.handleDesktopMenuCommand === "function") {
      proxy.handleDesktopMenuCommand(command);
      return true;
    }

    if ((command === "showHistory" || command === "showAnnouncement" || command === "toggleLanguage" || command === "viewDocs") && typeof proxy.handleMobileMenuCommand === "function") {
      proxy.handleMobileMenuCommand(command);
      return true;
    }

    return false;
  }

  function runUploadAction(action) {
    if (action === "settings") {
      clickQuickToolbarButton(3);
      return;
    }
    if (action === "uploadMethod") {
      if (!runUploadProxyCommand("toggleUploadMethod")) {
        var button = document.querySelector(".upload-method-button");
        if (button) button.click();
      }
      return;
    }
    if (action === "link") {
      if (!runUploadProxyCommand("linkFormat")) clickQuickToolbarButton(2);
      return;
    }
    if (action === "manage") {
      window.history.pushState({}, "", "/dashboard");
      window.dispatchEvent(new Event("popstate"));
      return;
    }
    if (action === "history") {
      if (!runUploadProxyCommand("showHistory")) clickQuickToolbarButton(0);
      return;
    }
    if (action === "announcement") {
      if (!runUploadProxyCommand("showAnnouncement")) clickQuickToolbarButton(1);
      return;
    }
    if (action === "language") {
      runUploadProxyCommand("toggleLanguage");
      return;
    }
    if (action === "docs") {
      if (!runUploadProxyCommand("viewDocs")) window.open("https://cfbed.sanyue.de/qa/", "_blank");
      return;
    }
    if (action === "logout") {
      if (runUploadProxyCommand("logout")) return;

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

  function findDashboardProxy() {
    var path = normalizedPath();
    var now = Date.now();
    if (
      dashboardProxyCache.proxy &&
      dashboardProxyCache.path === path &&
      dashboardProxyCache.expiresAt > now &&
      isDashboardProxyCandidate(dashboardProxyCache.proxy)
    ) {
      return dashboardProxyCache.proxy;
    }

    var nodes = document.querySelectorAll(".container, .main-container, .breadcrumb-container, .content, .list-view, #app > *");
    for (var index = 0; index < nodes.length; index += 1) {
      var instance = nodes[index].__vueParentComponent;
      while (instance) {
        if (isDashboardProxyCandidate(instance.proxy)) {
          dashboardProxyCache = { proxy: instance.proxy, path: path, expiresAt: now + 750 };
          return instance.proxy;
        }
        instance = instance.parent;
      }
    }
    dashboardProxyCache = { proxy: null, path: path, expiresAt: now + 250 };
    return null;
  }

  function clearDashboardProxyCache() {
    dashboardProxyCache = { proxy: null, path: "", expiresAt: 0 };
  }

  function isDashboardProxyCandidate(proxy) {
    return Boolean(proxy && (
      (typeof proxy.refreshFileList === "function" && typeof proxy.fetchFileList === "function") ||
      (typeof proxy.currentPath === "string" && (
        Array.isArray(proxy.tableData) ||
        Array.isArray(proxy.paginatedTableData) ||
        Array.isArray(proxy.selectedFiles)
      ))
    ));
  }

  function ensureUploadNav() {
    var host = document.querySelector(".upload-home");
    var existing = document.querySelector(".cfib-upload-nav");
    if (normalizedPath() !== "/") {
      if (existing) existing.remove();
      if (host) host.classList.remove("cfib-upload-home-hotfix");
      return;
    }

    if (!host) return;

    host.classList.add("cfib-upload-home-hotfix");

    if (!existing) {
      existing = makeNav("cfib-upload-nav", false);
      host.appendChild(existing);
    }
    updateNav(existing);
  }

  function makeUploadLanguageButton() {
    var button = document.createElement("button");
    button.className = "cfib-upload-tool-btn";
    button.type = "button";
    button.dataset.uploadTool = "language";
    button.innerHTML = icons.globe + '<span class="cfib-upload-tool-label" data-label="language"></span>';
    button.addEventListener("click", function (event) {
      event.stopPropagation();
      runUploadAction("language");
    });
    return button;
  }

  function ensureUploadTools(host) {
    var tools = host.querySelector(".cfib-upload-tools");
    if (!tools) {
      tools = document.createElement("div");
      tools.className = "cfib-upload-tools";
      host.insertBefore(tools, host.firstChild);
    }

    var themeToggle = host.querySelector(".toggle-dark-button.desktop-only, #themeToggle");
    if (themeToggle && themeToggle.parentNode !== tools) {
      tools.appendChild(themeToggle);
    }

    var languageButton = tools.querySelector('[data-upload-tool="language"]');
    if (!languageButton) {
      languageButton = makeUploadLanguageButton();
      tools.appendChild(languageButton);
    }

    languageButton.title = text("language");
    languageButton.setAttribute("aria-label", text("language"));
    tools.querySelectorAll("[data-label]").forEach(function (node) {
      node.textContent = text(node.dataset.label);
    });
  }

  function resetUploadTools(host) {
    var tools = document.querySelector(".cfib-upload-tools");
    if (!tools) return;

    var themeToggle = tools.querySelector(".toggle-dark-button.desktop-only, #themeToggle");
    if (themeToggle && host) {
      host.insertBefore(themeToggle, host.firstChild);
    }
    tools.remove();
  }

  function ensureTabsUnifiedLayout(tabs, nav) {
    tabs.classList.add("cfib-tabs-hotfix", "cfib-tabs-unified");
    var header = tabs.closest(".header-content");
    if (header) header.classList.add("cfib-header-hotfix");

    var tools = tabs.querySelector(".cfib-tabs-tools");
    if (!tools) {
      tools = document.createElement("div");
      tools.className = "cfib-tabs-tools";
      tabs.insertBefore(tools, tabs.firstChild);
    }

    var themeToggle = tabs.querySelector("#themeToggle");
    var languageSwitcher = tabs.querySelector(".tabs-language-switcher");
    [themeToggle, languageSwitcher].forEach(function (node) {
      if (node && node.parentNode !== tools) {
        tools.appendChild(node);
      }
    });

    if (nav && nav.parentNode !== tabs) {
      tabs.appendChild(nav);
    }
  }

  function ensureAdminNav() {
    var tabs = document.querySelector(".tabs");
    var pageSwitcher = tabs && tabs.querySelector(".page-switcher");
    if (!tabs || !pageSwitcher) return;

    tabs.classList.add("cfib-tabs-hotfix", "cfib-tabs-unified");
    var nav = tabs.querySelector(".cfib-admin-nav");
    if (!nav) {
      nav = makeNav("cfib-admin-nav", false);
      tabs.insertBefore(nav, pageSwitcher);
    }
    ensureTabsUnifiedLayout(tabs, nav);
    updateNav(nav);
  }

  function patchImagePreviewClickToClose() {
    if (imagePreviewClickToClosePatched) return;
    imagePreviewClickToClosePatched = true;

    document.addEventListener("pointerdown", function (event) {
      var image = event.target && event.target.closest && event.target.closest(".el-image-viewer__img");
      if (!image || event.button !== 0) {
        imagePreviewPointer = null;
        return;
      }
      imagePreviewPointer = {
        x: event.clientX,
        y: event.clientY,
        target: image
      };
    }, true);

    document.addEventListener("pointerup", function (event) {
      if (!imagePreviewPointer) return;
      var image = event.target && event.target.closest && event.target.closest(".el-image-viewer__img");
      var movement = Math.abs(event.clientX - imagePreviewPointer.x) + Math.abs(event.clientY - imagePreviewPointer.y);
      var originalTarget = imagePreviewPointer.target;
      imagePreviewPointer = null;
      if (!image || image !== originalTarget || movement > 6) return;
      var wrapper = image.closest(".el-image-viewer__wrapper") || document;
      var closeButton = wrapper.querySelector(".el-image-viewer__close") || document.querySelector(".el-image-viewer__close");
      if (closeButton) {
        closeButton.click();
        return;
      }
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    }, true);
  }

  function refresh() {
    patchImagePreviewClickToClose();
    ensureUploadNav();
    ensureAdminNav();
    document.querySelectorAll(".cfib-main-nav").forEach(updateNav);
  }

  var pending = 0;
  var pendingRefreshTimer = 0;
  var lastRefreshAt = 0;
  var refreshThrottleMs = 80;

  function runScheduledRefresh() {
    pending = 0;
    lastRefreshAt = Date.now();
    refresh();
  }

  function scheduleRefresh() {
    if (pending || pendingRefreshTimer) return;
    var delay = Math.max(0, refreshThrottleMs - (Date.now() - lastRefreshAt));
    if (delay > 0) {
      pendingRefreshTimer = window.setTimeout(function () {
        pendingRefreshTimer = 0;
        pending = window.requestAnimationFrame(runScheduledRefresh);
      }, delay);
      return;
    }
    pending = window.requestAnimationFrame(runScheduledRefresh);
  }

  function shouldScheduleRefreshForMutations(mutations) {
    if (!Array.isArray(mutations)) mutations = Array.prototype.slice.call(mutations || []);
    return mutations.some(function (mutation) {
      if (!mutation || mutation.type !== "childList") return false;
      return mutationNodesNeedRefresh(mutation.addedNodes) || mutationNodesNeedRefresh(mutation.removedNodes);
    });
  }

  function mutationNodesNeedRefresh(nodes) {
    return Array.prototype.some.call(nodes || [], function (node) {
      if (!node || node.nodeType !== 1) return false;
      return !isTransientRefreshNode(node);
    });
  }

  function isTransientRefreshNode(node) {
    if (!node || !node.matches) return false;
    if (node.matches(".el-popper, .el-tooltip__popper, .el-message, .el-image-viewer__wrapper, .el-overlay")) {
      return true;
    }
    if (node.closest(".el-popper, .el-tooltip__popper, .el-message, .el-image-viewer__wrapper, .el-overlay")) {
      return true;
    }
    var card = node.closest(".img-card, .file-card");
    return Boolean(card && !node.matches(".img-card, .file-card"));
  }

  ["pushState", "replaceState"].forEach(function (method) {
    var original = history[method];
    history[method] = function () {
      var result = original.apply(this, arguments);
      clearDashboardProxyCache();
      scheduleRefresh();
      return result;
    };
  });

  document.addEventListener("click", closeActionMenus);
  window.addEventListener("resize", positionOpenActionMenus);
  window.addEventListener("scroll", positionOpenActionMenus, true);
  window.addEventListener("popstate", function () {
    clearDashboardProxyCache();
    scheduleRefresh();
  });
  window.addEventListener("storage", function () {
    clearDashboardProxyCache();
    scheduleRefresh();
  });
  var observerRoot = document.getElementById("app") || document.body || document.documentElement;
  new MutationObserver(function (mutations) {
    if (shouldScheduleRefreshForMutations(mutations)) scheduleRefresh();
  }).observe(observerRoot, { childList: true, subtree: true });
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", refresh);
  } else {
    refresh();
  }
})();
