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
      trash: "回收站",
      importTelegram: "导入 Telegram",
      newFolder: "新建文件夹",
      share: "分享",
      shareManage: "分享管理",
      shareTitle: "创建分享链接",
      shareTarget: "分享目标",
      shareFile: "文件",
      shareDirectory: "目录",
      shareExpires: "有效期",
      shareOneHour: "1 小时",
      shareOneDay: "1 天",
      shareSevenDays: "7 天",
      shareThirtyDays: "30 天",
      sharePermanent: "永久",
      creatingShare: "正在创建分享链接...",
      shareCreated: "分享链接已创建",
      shareCopied: "分享链接已复制",
      loadingShares: "正在加载分享链接...",
      shareNoLinks: "暂无分享链接",
      shareStatus: "状态",
      shareStatusActive: "有效",
      shareStatusExpired: "已过期",
      shareStatusRevoked: "已撤销",
      shareCreatedAt: "创建时间",
      shareLastViewed: "最后访问",
      shareViews: "访问",
      shareTokenPrefix: "Token 前缀",
      revokeShare: "撤销",
      revokeShareTitle: "撤销分享链接？",
      revokeShareTip: "撤销后该分享链接将不可访问",
      shareRevoked: "分享链接已撤销",
      shareUpdated: "分享链接已更新",
      editShareExpiry: "修改有效期",
      shareUrlUnavailable: "完整链接仅在本浏览器创建后可用",
      copy: "复制",
      selectOneShareTarget: "请选择一个文件或文件夹，或取消选择以分享当前目录",
      newFolderTitle: "新建文件夹",
      newFolderName: "文件夹名称",
      newFolderPlaceholder: "请输入文件夹名称",
      creatingFolder: "正在新建文件夹...",
      folderCreated: "文件夹已创建",
      close: "关闭",
      restore: "恢复",
      permanentDelete: "永久删除",
      open: "打开",
      loading: "加载中",
      refresh: "刷新",
      noFiles: "暂无文件",
      imported: "已导入",
      skipped: "已跳过",
      failed: "失败",
      importingTelegram: "正在导入 Telegram...",
      importDone: "Telegram 导入完成",
      restoreSelected: "恢复选中",
      restoreDone: "已恢复",
      selectFilesFirst: "请先选择文件",
      dashboardUnavailable: "文件管理界面尚未就绪",
      selectAll: "全选",
      selectedCount: "已选",
      deleteSelected: "删除选中",
      confirm: "确定",
      cancel: "取消",
      confirmPermanentDelete: "确认永久删除？",
      permanentDeleteTip: "永久删除后无法恢复"
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
      trash: "Trash",
      importTelegram: "Import Telegram",
      newFolder: "New Folder",
      share: "Share",
      shareManage: "Share Manager",
      shareTitle: "Create Share Link",
      shareTarget: "Share target",
      shareFile: "File",
      shareDirectory: "Directory",
      shareExpires: "Expires",
      shareOneHour: "1 hour",
      shareOneDay: "1 day",
      shareSevenDays: "7 days",
      shareThirtyDays: "30 days",
      sharePermanent: "Never",
      creatingShare: "Creating share link...",
      shareCreated: "Share link created",
      shareCopied: "Share link copied",
      loadingShares: "Loading share links...",
      shareNoLinks: "No share links",
      shareStatus: "Status",
      shareStatusActive: "Active",
      shareStatusExpired: "Expired",
      shareStatusRevoked: "Revoked",
      shareCreatedAt: "Created",
      shareLastViewed: "Last viewed",
      shareViews: "Views",
      shareTokenPrefix: "Token prefix",
      revokeShare: "Revoke",
      revokeShareTitle: "Revoke share link?",
      revokeShareTip: "This share link will stop working after it is revoked",
      shareRevoked: "Share link revoked",
      shareUpdated: "Share link updated",
      editShareExpiry: "Edit expiry",
      shareUrlUnavailable: "Full link is only available in this browser after creation",
      copy: "Copy",
      selectOneShareTarget: "Select one file or folder, or clear selection to share the current directory",
      newFolderTitle: "New Folder",
      newFolderName: "Folder name",
      newFolderPlaceholder: "Enter folder name",
      creatingFolder: "Creating folder...",
      folderCreated: "Folder created",
      close: "Close",
      restore: "Restore",
      permanentDelete: "Delete Forever",
      open: "Open",
      loading: "Loading",
      refresh: "Refresh",
      noFiles: "No files",
      imported: "Imported",
      skipped: "Skipped",
      failed: "Failed",
      importingTelegram: "Importing Telegram...",
      importDone: "Telegram import complete",
      restoreSelected: "Restore Selected",
      restoreDone: "Restored",
      selectFilesFirst: "Select files first",
      dashboardUnavailable: "File manager is not ready",
      selectAll: "Select All",
      selectedCount: "Selected",
      deleteSelected: "Delete Selected",
      confirm: "Confirm",
      cancel: "Cancel",
      confirmPermanentDelete: "Delete permanently?",
      permanentDeleteTip: "This cannot be undone"
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
    trash: '<svg class="cfib-nav-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M7 6l1 15h8l1-15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    telegram: '<svg class="cfib-nav-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 4 3.7 10.8c-1 .4-.9 1.9.2 2.1l4.5.9 1.7 5.1c.3.9 1.5 1.1 2.1.3l2.5-3.2 4.2 3.1c.8.6 2 .1 2.2-.9L23 5.5c.2-1-.9-1.8-2-1.5Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="m8.5 13.8 7.1-5.1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    restore: '<svg class="cfib-nav-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7v6h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.3 13A7 7 0 1 0 7 5.8L4 8.8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    history: '<svg class="cfib-nav-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 4v4h4M12 7v5l3 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    announcement: '<svg class="cfib-nav-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11v3a2 2 0 0 0 2 2h2l4 3v-3h2l6 3V5l-6 3H6a2 2 0 0 0-2 2v1Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M14 8v8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    globe: '<svg class="cfib-nav-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    docs: '<svg class="cfib-nav-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H20v17H7.5A2.5 2.5 0 0 0 5 21.5v-17Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M8 6h8M8 10h7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    folderPlus: '<svg class="cfib-nav-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6.5A2.5 2.5 0 0 1 5.5 4H9l2 2h7.5A2.5 2.5 0 0 1 21 8.5v8A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5v-10Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 10.5v5M9.5 13h5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
  };

  var dashboardModeStorageKey = "cfib-dashboard-mode";
  var dashboardRefreshStorageKey = "cfib-dashboard-refresh-pending";
  var shareUrlStorageKey = "cfib-share-url-cache";
  var pendingDashboardMode = "";
  var currentDashboardMode = "";
  var dashboardModeEnforcePending = false;
  var dashboardProxyCache = { proxy: null, path: "", expiresAt: 0 };
  var imagePreviewClickToClosePatched = false;
  var imagePreviewPointer = null;
  var trashModalFiles = [];
  var trashModalSelection = {};

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
        if (route.key === "dashboard") {
          openNormalFileView();
          return;
        }
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

  function makeAdminActions() {
    var wrap = document.createElement("div");
    wrap.className = "cfib-admin-actions";
    var actions = [
      { key: "trash", icon: icons.trash }
    ];

    actions.forEach(function (action) {
      var button = document.createElement("button");
      button.className = "cfib-admin-action-btn";
      button.type = "button";
      button.dataset.adminAction = action.key;
      button.innerHTML = action.icon + '<span class="cfib-nav-label" data-label="' + (action.label || action.key) + '"></span>';
      button.title = text(action.label || action.key);
      button.setAttribute("aria-label", text(action.label || action.key));
      button.addEventListener("click", function (event) {
        event.stopPropagation();
        closeActionMenus();
        runAdminAction(action.key);
      });
      wrap.appendChild(button);
    });

    return wrap;
  }

  function updateNav(nav) {
    var current = activeKey();
    var trashViewActive = current === "dashboard" && isTrashViewActive();
    nav.querySelectorAll(".cfib-nav-item").forEach(function (item) {
      var key = item.dataset.routeKey;
      var itemActive = key === current && !(key === "dashboard" && trashViewActive);
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

  function runAdminAction(action) {
    if (action === "trash") {
      openTrashModal();
    }
  }

  function makeFileModeActions() {
    var wrap = document.createElement("div");
    wrap.className = "cfib-file-mode-actions";
    var actions = [
      { key: "newFolder", icon: icons.folderPlus, label: "newFolder" },
      { key: "share", icon: icons.link, label: "share" },
      { key: "shareManage", icon: icons.list, label: "shareManage" },
      { key: "importTelegram", icon: icons.telegram, label: "importTelegram" }
    ];

    actions.forEach(function (action) {
      var button = document.createElement("button");
      button.className = "cfib-file-mode-btn";
      button.type = "button";
      button.dataset.fileModeAction = action.key;
      button.title = text(action.label);
      button.setAttribute("aria-label", text(action.label));
      button.innerHTML = action.icon + '<span class="cfib-file-mode-label" data-label="' + action.label + '"></span>';
      button.addEventListener("click", function (event) {
        event.stopPropagation();
        runFileModeAction(action.key);
      });
      wrap.appendChild(button);
    });

    return wrap;
  }

  function runFileModeAction(action) {
    try {
      if (action === "newFolder") {
        createFolderInCurrentPath();
        return;
      }
      if (action === "importTelegram") {
        importTelegramUpdates();
        return;
      }
      if (action === "share") {
        createShareForCurrentTarget();
        return;
      }
      if (action === "shareManage") {
        openShareManager();
      }
    } catch (error) {
      showToast(error && error.message ? error.message : String(error), "error");
    }
  }

  function ensureDashboardFileActions() {
    var existing = document.querySelector(".cfib-file-mode-actions");
    if (normalizedPath() !== "/dashboard") {
      if (existing) existing.remove();
      return;
    }

    var host = document.querySelector(".breadcrumb-container");
    if (!host) return;

    if (!existing || !host.contains(existing)) {
      if (existing) existing.remove();
      existing = makeFileModeActions();
      var statsBadge = host.querySelector(".stats-badge");
      if (statsBadge) {
        host.insertBefore(existing, statsBadge);
      } else {
        host.appendChild(existing);
      }
    }

    updateFileModeActions(existing);
  }

  function updateFileModeActions(wrap) {
    var proxy = findDashboardProxy();
    var trashMode = isTrashMode(proxy);
    if (proxy) patchDashboardTrashDelete(proxy);

    wrap.querySelectorAll('[data-file-mode-action="restoreTrash"]').forEach(function (button) {
      button.remove();
    });

    wrap.querySelectorAll("[data-file-mode-action]").forEach(function (button) {
      var action = button.dataset.fileModeAction;
      button.title = text(action);
      button.setAttribute("aria-label", text(action));
    });

    wrap.querySelectorAll("[data-label]").forEach(function (node) {
      node.textContent = text(node.dataset.label);
    });
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

  function getSessionValue(key) {
    try {
      return window.sessionStorage.getItem(key) || "";
    } catch (error) {
      return "";
    }
  }

  function setSessionValue(key, value) {
    try {
      window.sessionStorage.setItem(key, value);
    } catch (error) {
      // Ignore unavailable session storage; in-memory state still covers the active page.
    }
  }

  function removeSessionValue(key) {
    try {
      window.sessionStorage.removeItem(key);
    } catch (error) {
      // Ignore unavailable session storage.
    }
  }

  function navigateToDashboard() {
    if (normalizedPath() !== "/dashboard") {
      window.history.pushState({}, "", "/dashboard");
      window.dispatchEvent(new Event("popstate"));
    }
  }

  function requestDashboardMode(mode) {
    pendingDashboardMode = mode;
    currentDashboardMode = mode;
    setSessionValue(dashboardModeStorageKey, mode);
    navigateToDashboard();
    applyPendingDashboardMode();
    scheduleRefresh();
  }

  function applyDashboardMode(proxy, mode) {
    currentDashboardMode = mode;
    patchDashboardTrashDelete(proxy);
    patchDashboardModeRefresh(proxy);
    resetDashboardSearch(proxy);

    proxy.filters = mode === "trash" ? trashDashboardFilters() : emptyDashboardFilters();
    proxy.currentPath = "";
    return proxy.refreshFileList();
  }

  function applyPendingDashboardMode() {
    if (normalizedPath() !== "/dashboard") return;

    var proxy = findDashboardProxy();
    if (!proxy) return;

    patchDashboardTrashDelete(proxy);
    patchDashboardModeRefresh(proxy);
    var mode = pendingDashboardMode || getSessionValue(dashboardModeStorageKey);
    if (!mode) return;

    pendingDashboardMode = "";
    removeSessionValue(dashboardModeStorageKey);
    applyDashboardMode(proxy, mode);
  }

  function refreshDashboardIfReady() {
    if (normalizedPath() !== "/dashboard") return false;

    var proxy = findDashboardProxy();
    if (!proxy) return false;

    patchDashboardTrashDelete(proxy);
    patchDashboardModeRefresh(proxy);
    forceDashboardModeFilters(proxy);
    proxy.refreshFileList();
    return true;
  }

  function markDashboardRefreshPending() {
    setSessionValue(dashboardRefreshStorageKey, "1");
  }

  function flushPendingDashboardRefresh() {
    if (normalizedPath() !== "/dashboard") return;
    if (getSessionValue(dashboardRefreshStorageKey) !== "1") return;

    if (refreshDashboardIfReady()) {
      removeSessionValue(dashboardRefreshStorageKey);
    }
  }

  function emptyDashboardFilters() {
    return {
      accessStatus: [],
      listType: [],
      label: [],
      fileType: [],
      channel: [],
      channelName: []
    };
  }

  function trashDashboardFilters(baseFilters) {
    var filters = Object.assign(emptyDashboardFilters(), baseFilters || {});
    filters.listType = ["Trash"];
    return filters;
  }

  function forceDashboardModeFilters(proxy) {
    if (!proxy || currentDashboardMode !== "trash") return;
    proxy.filters = trashDashboardFilters(proxy.filters);
    proxy.currentPath = "";
  }

  function hasNonTrashRows(proxy) {
    var rows = proxy && Array.isArray(proxy.tableData) ? proxy.tableData : [];
    return rows.some(function (file) {
      return file && !file.isFolder && file.metadata && file.metadata.ListType !== "Trash";
    });
  }

  function patchDashboardModeRefresh(proxy) {
    if (!proxy) return;
    if (proxy.__cfibModeRefreshPatched) {
      forceDashboardModeFilters(proxy);
      return;
    }

    proxy.__cfibModeRefreshPatched = true;
    proxy.__cfibOriginalRefreshFileList = proxy.refreshFileList;
    proxy.refreshFileList = function () {
      if (currentDashboardMode === "trash") forceDashboardModeFilters(proxy);
      var result = proxy.__cfibOriginalRefreshFileList.apply(proxy, arguments);
      if (result && typeof result.then === "function") {
        return result.then(function (value) {
          if (currentDashboardMode === "trash") forceDashboardModeFilters(proxy);
          return value;
        });
      }
      if (currentDashboardMode === "trash") forceDashboardModeFilters(proxy);
      return result;
    };

    forceDashboardModeFilters(proxy);
  }

  function enforceDashboardModeRefresh() {
    if (normalizedPath() !== "/dashboard" || currentDashboardMode !== "trash") return;

    var proxy = findDashboardProxy();
    if (!proxy) return;

    patchDashboardTrashDelete(proxy);
    patchDashboardModeRefresh(proxy);
    forceDashboardModeFilters(proxy);

    if (dashboardModeEnforcePending || !hasNonTrashRows(proxy)) return;

    dashboardModeEnforcePending = true;
    Promise.resolve(proxy.refreshFileList()).finally(function () {
      dashboardModeEnforcePending = false;
    });
  }

  function resetDashboardSearch(proxy) {
    proxy.tempSearch = "";
    proxy.search = "";
    proxy.searchKeywords = "";
    proxy.searchIncludeTags = "";
    proxy.searchExcludeTags = "";
    proxy.isSearchMode = false;
    proxy.currentPage = 1;
    if (Array.isArray(proxy.selectedFiles)) proxy.selectedFiles = [];
  }

  function openNormalFileView() {
    requestDashboardMode("normal");
  }

  function openTrashView() {
    requestDashboardMode("trash");
  }

  function isTrashMode(proxy) {
    return Boolean(proxy && proxy.filters && Array.isArray(proxy.filters.listType) && proxy.filters.listType.indexOf("Trash") !== -1);
  }

  function isTrashViewActive() {
    return currentDashboardMode === "trash" || pendingDashboardMode === "trash" || getSessionValue(dashboardModeStorageKey) === "trash" || isTrashMode(findDashboardProxy());
  }

  function patchDashboardTrashDelete(proxy) {
    if (proxy.__cfibTrashDeletePatched) return;
    proxy.__cfibTrashDeletePatched = true;
    proxy.__cfibOriginalHandleDelete = proxy.handleDelete;
    proxy.__cfibOriginalHandleBatchDelete = proxy.handleBatchDelete;

    proxy.handleDelete = function (index, fileId) {
      if (!isTrashMode(proxy)) {
        return proxy.__cfibOriginalHandleDelete.apply(proxy, arguments);
      }
      confirmPermanentDelete(fileId).then(function (confirmed) {
        if (!confirmed) return;
        apiJson("/api/manage/delete/" + encodeManagePath(fileId) + "?permanent=true", { method: "DELETE" })
          .then(function () {
            return proxy.refreshFileList();
          })
          .catch(function (error) {
            showToast(error.message || String(error), "error");
          });
      });
    };

    proxy.handleBatchDelete = function () {
      if (!isTrashMode(proxy)) {
        return proxy.__cfibOriginalHandleBatchDelete.apply(proxy, arguments);
      }

      var selected = Array.isArray(proxy.selectedFiles) ? proxy.selectedFiles.filter(function (file) {
        return file && !file.isFolder;
      }) : [];
      if (!selected.length) {
        showToast(text("selectFilesFirst"), "error");
        return;
      }
      confirmPermanentDelete(selected.length).then(function (confirmed) {
        if (!confirmed) return;
        Promise.all(selected.map(function (file) {
          return apiJson("/api/manage/delete/" + encodeManagePath(file.name) + "?permanent=true", { method: "DELETE" });
        })).then(function () {
          proxy.selectedFiles = [];
          return proxy.refreshFileList();
        }).catch(function (error) {
          showToast(error.message || String(error), "error");
        });
      });
    };
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

  function confirmPermanentDelete(detail) {
    return new Promise(function (resolve) {
      var confirmModal = document.createElement("div");
      confirmModal.className = "cfib-confirm-modal is-open";
      confirmModal.innerHTML =
        '<div class="cfib-confirm-backdrop" data-confirm-action="cancel"></div>' +
        '<section class="cfib-confirm-panel" role="alertdialog" aria-modal="true">' +
        '<h3 class="cfib-confirm-title">' + escapeHtml(text("confirmPermanentDelete")) + '</h3>' +
        '<p class="cfib-confirm-message">' + escapeHtml(text("permanentDelete")) + ': ' + escapeHtml(detail) + '</p>' +
        '<p class="cfib-confirm-note">' + escapeHtml(text("permanentDeleteTip")) + '</p>' +
        '<div class="cfib-confirm-actions">' +
        '<button class="cfib-secondary-btn" type="button" data-confirm-action="cancel">' + escapeHtml(text("cancel")) + '</button>' +
        '<button class="cfib-danger-btn" type="button" data-confirm-action="confirm">' + escapeHtml(text("confirm")) + '</button>' +
        '</div>' +
        '</section>';

      function finish(confirmed) {
        confirmModal.remove();
        resolve(confirmed);
      }

      confirmModal.addEventListener("click", function (event) {
        var action = event.target && event.target.dataset.confirmAction;
        if (action === "confirm") finish(true);
        if (action === "cancel") finish(false);
      });

      document.body.appendChild(confirmModal);
      var confirmButton = confirmModal.querySelector('[data-confirm-action="confirm"]');
      if (confirmButton) confirmButton.focus();
    });
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
        trashModalFiles = (data.files || []).filter(function (file) {
          return file && !file.isFolder;
        });
        trashModalSelection = {};
        renderTrashFiles(trashModalFiles);
      })
      .catch(function (error) {
        renderError(text("trash"), error);
      });
  }

  function renderTrashFiles(files) {
    var selectedCount = selectedTrashFiles().length;
    var allSelected = files.length > 0 && selectedCount === files.length;
    var html = '<div class="cfib-modal-toolbar cfib-trash-toolbar">' +
      '<label class="cfib-trash-select-all">' +
      '<input type="checkbox" data-trash-action="selectAll"' + (allSelected ? " checked" : "") + (files.length ? "" : " disabled") + '>' +
      '<span>' + escapeHtml(text("selectAll")) + '</span>' +
      '</label>' +
      '<span class="cfib-trash-selection">' + escapeHtml(text("selectedCount")) + ': ' + selectedCount + '</span>' +
      '<div class="cfib-trash-bulk-actions">' +
      '<button class="cfib-secondary-btn" type="button" data-trash-action="bulkRestore"' + (selectedCount ? "" : " disabled") + '>' + escapeHtml(text("restoreSelected")) + '</button>' +
      '<button class="cfib-danger-btn" type="button" data-trash-action="bulkPermanent"' + (selectedCount ? "" : " disabled") + '>' + escapeHtml(text("deleteSelected")) + '</button>' +
      '<button class="cfib-secondary-btn" type="button" data-trash-action="refresh">' + escapeHtml(text("refresh")) + '</button>' +
      '</div>' +
      '</div>';
    html += renderTrashFileList(files, function (file) {
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
        if (action === "selectAll") {
          setAllTrashSelection(button.checked);
          return;
        }
        if (action === "select") {
          setTrashSelection(button.dataset.file, button.checked);
          return;
        }
        if (action === "bulkRestore") {
          restoreTrashFiles(selectedTrashFiles());
          return;
        }
        if (action === "bulkPermanent") {
          permanentDeleteFiles(selectedTrashFiles());
          return;
        }

        var fileId = button.dataset.file;
        if (action === "restore") {
          restoreTrashFiles([fileId]);
        } else if (action === "permanent") {
          permanentDeleteFiles([fileId]);
        }
      });
    });
  }

  function selectedTrashFiles() {
    return trashModalFiles.map(function (file) {
      return file.name;
    }).filter(function (fileId) {
      return trashModalSelection[fileId];
    });
  }

  function setTrashSelection(fileId, selected) {
    if (selected) {
      trashModalSelection[fileId] = true;
    } else {
      delete trashModalSelection[fileId];
    }
    renderTrashFiles(trashModalFiles);
  }

  function setAllTrashSelection(selected) {
    trashModalSelection = {};
    if (selected) {
      trashModalFiles.forEach(function (file) {
        trashModalSelection[file.name] = true;
      });
    }
    renderTrashFiles(trashModalFiles);
  }

  function restoreTrashFiles(fileIds) {
    if (!fileIds.length) {
      showToast(text("selectFilesFirst"), "error");
      return;
    }
    Promise.all(fileIds.map(function (fileId) {
      return apiJson("/api/manage/trash/restore/" + encodeManagePath(fileId), { method: "POST" });
    }))
      .then(loadTrashFiles)
      .catch(function (error) {
        renderError(text("trash"), error);
      });
  }

  function permanentDeleteFiles(fileIds) {
    if (!fileIds.length) {
      showToast(text("selectFilesFirst"), "error");
      return;
    }
    var detail = fileIds.length === 1 ? fileIds[0] : fileIds.length;
    confirmPermanentDelete(detail).then(function (confirmed) {
      if (!confirmed) return;
      Promise.all(fileIds.map(function (fileId) {
        return apiJson("/api/manage/delete/" + encodeManagePath(fileId) + "?permanent=true", { method: "DELETE" });
      })).then(loadTrashFiles).catch(function (error) {
        renderError(text("trash"), error);
      });
    });
  }

  function createFolderInCurrentPath() {
    var proxy = findDashboardProxy();
    var parent = proxy && typeof proxy.currentPath === "string" ? proxy.currentPath : "";
    promptFolderName().then(function (folderName) {
      if (!folderName) return;
      showToast(text("creatingFolder"), "loading");
      apiJson("/api/manage/folder", {
        method: "POST",
        body: JSON.stringify({ parent: parent, name: folderName })
      })
        .then(function () {
          showToast(text("folderCreated"), "success");
          if (proxy && typeof proxy.refreshFileList === "function") {
            proxy.refreshFileList();
          } else if (!refreshDashboardIfReady()) {
            markDashboardRefreshPending();
          }
        })
        .catch(function (error) {
          showToast(error.message || String(error), "error");
        });
    });
  }

  function createShareForCurrentTarget() {
    var proxy;
    var targetOptions;
    try {
      proxy = findDashboardProxy();
      targetOptions = collectShareTargetOptions(proxy);
      if (!targetOptions.length) {
        showToast(text("selectOneShareTarget"), "error");
        return;
      }
    } catch (error) {
      showToast(error && error.message ? error.message : String(error), "error");
      return;
    }

    return promptShareExpiry(targetOptions).then(function (result) {
      if (!result) return;

      var body = {
        targetType: result.target.targetType,
        targetPath: result.target.targetPath
      };
      if (result.expiresInSeconds === null) {
        body.expiresAt = null;
      } else {
        body.expiresInSeconds = result.expiresInSeconds;
      }

      showToast(text("creatingShare"), "loading");
      apiJson("/api/manage/share", {
        method: "POST",
        body: JSON.stringify(body)
      })
        .then(function (data) {
          rememberShareUrl(data.share, data.url);
          renderCreatedShare(data.url, data.share);
        })
        .catch(function (error) {
          showToast(error.message || String(error), "error");
        });
    }).catch(function (error) {
      showToast(error && error.message ? error.message : String(error), "error");
    });
  }

  function collectShareTargetOptions(proxy) {
    proxy = proxy || {};
    var options = [];
    var seen = {};

    function addTarget(file, preferred) {
      if (!file) return;
      var target = file.targetType ? file : normalizeShareTargetOption(file);
      if (!target) return;
      var key = target.targetType + ":" + target.targetPath;
      if (seen[key]) return;
      seen[key] = true;
      if (preferred) {
        options.unshift(target);
      } else {
        options.push(target);
      }
    }

    var selected = Array.isArray(proxy.selectedFiles) ? proxy.selectedFiles.filter(Boolean) : [];
    var rows = Array.isArray(proxy.paginatedTableData)
      ? proxy.paginatedTableData
      : Array.isArray(proxy.tableData)
        ? proxy.tableData
        : [];
    var domOptions = collectDomShareTargetOptions(rows);
    var hasPreferredDomTarget = domOptions.some(function (target) { return target.__preferred; });

    selected.forEach(function (file) {
      addTarget(file, true);
    });

    domOptions.filter(function (target) {
      return target.__preferred;
    }).forEach(function (target) {
      addTarget(target, true);
    });

    addTarget({
      isFolder: true,
      name: typeof proxy.currentPath === "string" ? proxy.currentPath : findDashboardPathFromDom()
    }, selected.length === 0 && !hasPreferredDomTarget);

    domOptions.filter(function (target) {
      return !target.__preferred;
    }).forEach(function (target) {
      addTarget(target, false);
    });

    rows.forEach(function (file) {
      addTarget(file, false);
    });

    return options;
  }

  function normalizeShareTargetOption(file) {
    if (!file || typeof file !== "object") return null;
    var selectedPath = file.name || file.id || file.fileId || file.path || file.key || "";
    if (selectedPath && file.__shareBasePath && String(selectedPath).indexOf("/") === -1) {
      selectedPath = joinSharePath(file.__shareBasePath, selectedPath);
    }
    if (!selectedPath && !file.isFolder) return null;
    return {
      targetType: file.isFolder ? "directory" : "file",
      targetPath: selectedPath,
      label: formatShareTarget({
        targetType: file.isFolder ? "directory" : "file",
        targetPath: selectedPath
      })
    };
  }

  function shareItemFromDomNode(node, rows) {
    var itemNode = node && node.closest ? node.closest(".img-card, .file-card, .list-item") : null;
    itemNode = itemNode || node;
    var row = matchingShareRowFromDom(itemNode, rows);
    if (row) return row;

    var fileName = bestShareTextCandidate(itemNode);
    if (!fileName) return null;
    return {
      name: fileName,
      isFolder: false,
      __shareBasePath: findDashboardPathFromDom()
    };
  }

  function matchingShareRowFromDom(node, rows) {
    if (!node || !Array.isArray(rows) || !rows.length) return null;
    var textValue = normalizeDomText(node.textContent || "");
    if (!textValue) return null;

    for (var index = 0; index < rows.length; index += 1) {
      var row = rows[index];
      if (!row) continue;
      var path = String(row.name || row.id || row.fileId || row.path || row.key || "");
      if (!path) continue;
      var name = basename(path);
      if (textValue.indexOf(normalizeDomText(path)) !== -1 || textValue.indexOf(normalizeDomText(name)) !== -1) {
        return row;
      }
    }
    return null;
  }

  function bestShareTextCandidate(node) {
    if (!node) return "";
    var candidates = [];

    function addCandidate(value) {
      value = normalizeDomText(value);
      if (value && looksLikeFileName(value)) candidates.push(value);
    }

    ["title", "aria-label", "data-name", "data-file", "data-path"].forEach(function (name) {
      if (node.getAttribute) addCandidate(node.getAttribute(name));
    });

    if (node.querySelectorAll) {
      node.querySelectorAll("[title], [aria-label], [data-name], [data-file], [data-path], img[alt]").forEach(function (element) {
        ["title", "aria-label", "data-name", "data-file", "data-path", "alt"].forEach(function (name) {
          addCandidate(element.getAttribute(name));
        });
      });
      node.querySelectorAll("*").forEach(function (element) {
        Array.prototype.forEach.call(element.childNodes || [], function (child) {
          if (child.nodeType === 3) addCandidate(child.nodeValue);
        });
      });
    }

    Array.prototype.forEach.call(node.childNodes || [], function (child) {
      if (child.nodeType === 3) addCandidate(child.nodeValue);
    });

    if (!candidates.length) {
      (node.textContent || "").split(/\s+/).forEach(addCandidate);
    }

    candidates.sort(function (a, b) {
      return b.length - a.length;
    });
    return candidates[0] || "";
  }

  function looksLikeFileName(value) {
    return /\.[a-z0-9]{2,8}$/i.test(String(value || "").trim());
  }

  function normalizeDomText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function basename(path) {
    var value = String(path || "").replace(/\\/g, "/").replace(/\/+$/, "");
    var index = value.lastIndexOf("/");
    return index === -1 ? value : value.slice(index + 1);
  }

  function joinSharePath(basePath, fileName) {
    var base = String(basePath || "").replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+$/, "");
    var name = String(fileName || "").replace(/\\/g, "/").replace(/^\/+/, "");
    return base ? base + "/" + name : name;
  }

  function collectDomShareTargetOptions(rows) {
    var options = [];
    var root = document.querySelector(".main-container") || document.querySelector(".container") || document;
    var selectedNodes = root.querySelectorAll(
      ".img-card .el-checkbox__input.is-checked, .file-card .el-checkbox__input.is-checked, .content .el-checkbox__input.is-checked, .img-card .el-checkbox.is-checked, .file-card .el-checkbox.is-checked, .content .el-checkbox.is-checked, .list-item .dashboard-checkbox.checked, .list-item .dashboard-checkbox[aria-checked='true']"
    );
    selectedNodes.forEach(function (node) {
      var item = shareItemFromVueNode(node) || shareItemFromDomNode(node, rows);
      var target = normalizeShareTargetOption(item);
      if (!target) return;
      target.__preferred = true;
      options.push(target);
    });

    var itemNodes = root.querySelectorAll(".img-card, .file-card, .content > *, .list-item");
    itemNodes.forEach(function (node) {
      var item = shareItemFromVueNode(node) || shareItemFromDomNode(node, rows);
      var target = normalizeShareTargetOption(item);
      if (!target) return;
      target.__preferred = false;
      options.push(target);
    });

    return options;
  }

  function shareItemFromVueNode(node) {
    var cursor = node;
    while (cursor) {
      var item = shareItemFromVueInstance(cursor.__vueParentComponent);
      if (item) return item;
      cursor = cursor.parentElement;
    }
    return null;
  }

  function shareItemFromVueInstance(instance) {
    while (instance) {
      var proxy = instance.proxy || {};
      var props = instance.props || {};
      if (proxy.item) return proxy.item;
      if (props.item) return props.item;
      if (typeof proxy.name === "string") return { name: proxy.name, isFolder: true };
      if (typeof props.name === "string") return { name: props.name, isFolder: true };
      instance = instance.parent;
    }
    return null;
  }

  function findDashboardPathFromDom() {
    var parts = [];
    document.querySelectorAll(".breadcrumb-container .el-breadcrumb__inner").forEach(function (node) {
      var value = (node.textContent || "").trim();
      if (!value || value === "/" || value === "根目录" || value === "Root") return;
      parts.push(value);
    });
    return parts.length ? parts.join("/") + "/" : "";
  }

  function resolveShareTarget(proxy) {
    proxy = proxy || {};
    var selected = Array.isArray(proxy.selectedFiles) ? proxy.selectedFiles.filter(Boolean) : [];
    if (selected.length > 1) {
      showToast(text("selectOneShareTarget"), "error");
      return null;
    }

    if (selected.length === 1) {
      var file = selected[0];
      var selectedPath = file.name || file.id || file.fileId || "";
      if (!selectedPath) {
        showToast(text("selectOneShareTarget"), "error");
        return null;
      }
      return {
        targetType: file.isFolder ? "directory" : "file",
        targetPath: selectedPath
      };
    }

    return {
      targetType: "directory",
      targetPath: typeof proxy.currentPath === "string" ? proxy.currentPath : ""
    };
  }

  function promptShareExpiry(targetOptions) {
    return new Promise(function (resolve) {
      var options = Array.isArray(targetOptions) && targetOptions.length ? targetOptions : [{
        targetType: "directory",
        targetPath: "",
        label: formatShareTarget({ targetType: "directory", targetPath: "" })
      }];
      var targetOptionsHtml = options.map(function (target, index) {
        return '<option value="' + index + '">' + escapeHtml(target.label || formatShareTarget(target)) + '</option>';
      }).join("");
      var confirmModal = document.createElement("div");
      confirmModal.className = "cfib-confirm-modal is-open";
      confirmModal.innerHTML =
        '<div class="cfib-confirm-backdrop" data-share-action="cancel"></div>' +
        '<section class="cfib-confirm-panel cfib-share-panel" role="dialog" aria-modal="true">' +
        '<h3 class="cfib-confirm-title">' + escapeHtml(text("shareTitle")) + '</h3>' +
        '<label class="cfib-folder-field">' +
        '<span>' + escapeHtml(text("shareTarget")) + '</span>' +
        '<select class="cfib-folder-input cfib-share-select" data-share-target="true">' +
        targetOptionsHtml +
        '</select>' +
        '</label>' +
        '<label class="cfib-folder-field">' +
        '<span>' + escapeHtml(text("shareExpires")) + '</span>' +
        '<select class="cfib-folder-input cfib-share-select" data-share-expiry="true">' +
        '<option value="3600">' + escapeHtml(text("shareOneHour")) + '</option>' +
        '<option value="86400">' + escapeHtml(text("shareOneDay")) + '</option>' +
        '<option value="604800" selected>' + escapeHtml(text("shareSevenDays")) + '</option>' +
        '<option value="2592000">' + escapeHtml(text("shareThirtyDays")) + '</option>' +
        '<option value="">' + escapeHtml(text("sharePermanent")) + '</option>' +
        '</select>' +
        '</label>' +
        '<div class="cfib-confirm-actions">' +
        '<button type="button" class="cfib-secondary-btn" data-share-action="cancel">' + escapeHtml(text("cancel")) + '</button>' +
        '<button type="button" class="cfib-primary-btn" data-share-action="confirm">' + escapeHtml(text("confirm")) + '</button>' +
        '</div>' +
        '</section>';

      function finish(value) {
        if (confirmModal.parentNode) confirmModal.parentNode.removeChild(confirmModal);
        resolve(value);
      }

      confirmModal.addEventListener("click", function (event) {
        var button = event.target && event.target.closest("[data-share-action]");
        if (!button) return;
        if (button.dataset.shareAction === "cancel") {
          finish(false);
          return;
        }
        var targetInput = confirmModal.querySelector("[data-share-target]");
        var targetIndex = targetInput ? Number(targetInput.value) : 0;
        var target = options[Number.isFinite(targetIndex) ? targetIndex : 0] || options[0];
        var input = confirmModal.querySelector("[data-share-expiry]");
        var value = input ? input.value : "604800";
        finish({
          target: {
            targetType: target.targetType,
            targetPath: target.targetPath
          },
          expiresInSeconds: value === "" ? null : Number(value)
        });
      });

      confirmModal.addEventListener("keydown", function (event) {
        if (event.key === "Escape") finish(false);
        if (event.key === "Enter") {
          var confirmButton = confirmModal.querySelector('[data-share-action="confirm"]');
          if (confirmButton) confirmButton.click();
        }
      });

      document.body.appendChild(confirmModal);
      var select = confirmModal.querySelector("[data-share-target]");
      if (select) select.focus();
    });
  }

  function promptShareExpiryOnly(share) {
    return new Promise(function (resolve) {
      var selectedSeconds = suggestedShareExpirySeconds(share);
      var confirmModal = document.createElement("div");
      confirmModal.className = "cfib-confirm-modal is-open";
      confirmModal.innerHTML =
        '<div class="cfib-confirm-backdrop" data-share-expiry-action="cancel"></div>' +
        '<section class="cfib-confirm-panel cfib-share-panel" role="dialog" aria-modal="true">' +
        '<h3 class="cfib-confirm-title">' + escapeHtml(text("editShareExpiry")) + '</h3>' +
        '<p class="cfib-confirm-message">' + escapeHtml(formatShareTarget(share || {})) + '</p>' +
        '<label class="cfib-folder-field">' +
        '<span>' + escapeHtml(text("shareExpires")) + '</span>' +
        '<select class="cfib-folder-input cfib-share-select" data-share-expiry="true">' +
        '<option value="3600"' + (selectedSeconds === 3600 ? " selected" : "") + '>' + escapeHtml(text("shareOneHour")) + '</option>' +
        '<option value="86400"' + (selectedSeconds === 86400 ? " selected" : "") + '>' + escapeHtml(text("shareOneDay")) + '</option>' +
        '<option value="604800"' + (selectedSeconds === 604800 ? " selected" : "") + '>' + escapeHtml(text("shareSevenDays")) + '</option>' +
        '<option value="2592000"' + (selectedSeconds === 2592000 ? " selected" : "") + '>' + escapeHtml(text("shareThirtyDays")) + '</option>' +
        '<option value=""' + (selectedSeconds === null ? " selected" : "") + '>' + escapeHtml(text("sharePermanent")) + '</option>' +
        '</select>' +
        '</label>' +
        '<div class="cfib-confirm-actions">' +
        '<button type="button" class="cfib-secondary-btn" data-share-expiry-action="cancel">' + escapeHtml(text("cancel")) + '</button>' +
        '<button type="button" class="cfib-primary-btn" data-share-expiry-action="confirm">' + escapeHtml(text("confirm")) + '</button>' +
        '</div>' +
        '</section>';

      function finish(value) {
        if (confirmModal.parentNode) confirmModal.parentNode.removeChild(confirmModal);
        resolve(value);
      }

      confirmModal.addEventListener("click", function (event) {
        var button = event.target && event.target.closest("[data-share-expiry-action]");
        if (!button) return;
        if (button.dataset.shareExpiryAction === "cancel") {
          finish(false);
          return;
        }
        var input = confirmModal.querySelector("[data-share-expiry]");
        var value = input ? input.value : "604800";
        finish({
          expiresInSeconds: value === "" ? null : Number(value)
        });
      });

      confirmModal.addEventListener("keydown", function (event) {
        if (event.key === "Escape") finish(false);
        if (event.key === "Enter") {
          var confirmButton = confirmModal.querySelector('[data-share-expiry-action="confirm"]');
          if (confirmButton) confirmButton.click();
        }
      });

      document.body.appendChild(confirmModal);
      var select = confirmModal.querySelector("[data-share-expiry]");
      if (select) select.focus();
    });
  }

  function suggestedShareExpirySeconds(share) {
    if (!share || !share.expiresAt) return null;
    var seconds = Math.max(1, Math.round((Number(share.expiresAt) - Date.now()) / 1000));
    var options = [3600, 86400, 604800, 2592000];
    for (var index = 0; index < options.length; index += 1) {
      if (seconds <= options[index]) return options[index];
    }
    return 2592000;
  }

  function renderCreatedShare(url, share) {
    showModal(text("shareCreated"),
      '<div class="cfib-share-result">' +
      '<label class="cfib-folder-field">' +
      '<span>' + escapeHtml(text("shareCreated")) + '</span>' +
      '<input class="cfib-folder-input" type="text" readonly value="' + escapeHtml(url || "") + '" data-share-url="true">' +
      '</label>' +
      '<div class="cfib-share-meta">' + escapeHtml(formatShareExpiry(share)) + '</div>' +
      '<div class="cfib-confirm-actions">' +
      '<button type="button" class="cfib-secondary-btn" data-share-copy="true">' + escapeHtml(text("copy")) + '</button>' +
      '<a class="cfib-primary-link" href="' + escapeHtml(url || "#") + '" target="_blank" rel="noreferrer">' + escapeHtml(text("open")) + '</a>' +
      '</div>' +
      '</div>'
    );

    var modal = ensureModal();
    var copyButton = modal.querySelector("[data-share-copy]");
    if (copyButton) {
      copyButton.addEventListener("click", function () {
        copyText(url || "");
      });
    }
    var input = modal.querySelector("[data-share-url]");
    if (input) input.select();
  }

  function readShareUrlCache() {
    try {
      return JSON.parse(localStorage.getItem(shareUrlStorageKey) || "{}") || {};
    } catch (error) {
      return {};
    }
  }

  function writeShareUrlCache(cache) {
    try {
      localStorage.setItem(shareUrlStorageKey, JSON.stringify(cache || {}));
    } catch (error) {
      // Ignore storage quota or privacy mode failures; the freshly created modal still shows the link.
    }
  }

  function rememberShareUrl(share, url) {
    if (!share || !share.id || !url) return;
    var cache = readShareUrlCache();
    cache[share.id] = {
      url: url,
      targetType: share.targetType,
      targetPath: share.targetPath,
      savedAt: Date.now()
    };
    var keys = Object.keys(cache).sort(function (a, b) {
      return (cache[b].savedAt || 0) - (cache[a].savedAt || 0);
    });
    keys.slice(200).forEach(function (key) {
      delete cache[key];
    });
    writeShareUrlCache(cache);
  }

  function shareUrlFor(share) {
    if (!share || !share.id) return "";
    if (share.url) return share.url;
    var cached = readShareUrlCache()[share.id];
    return cached && cached.url ? cached.url : "";
  }

  function openShareManager() {
    showModal(text("shareManage"), '<div class="cfib-modal-state">' + escapeHtml(text("loadingShares")) + '</div>');
    apiJson("/api/manage/share?limit=100")
      .then(function (data) {
        renderShareManager(Array.isArray(data.shares) ? data.shares : []);
      })
      .catch(function (error) {
        showModal(text("shareManage"), '<div class="cfib-modal-error">' + escapeHtml(error.message || String(error)) + '</div>');
      });
  }

  function renderShareManager(shares) {
    var shareList = Array.isArray(shares) ? shares : [];
    var shareById = {};
    var content = '<div class="cfib-modal-toolbar">' +
      '<button type="button" class="cfib-secondary-btn" data-share-action="refresh">' + escapeHtml(text("refresh")) + '</button>' +
      '</div>';

    if (!shareList.length) {
      content += '<div class="cfib-modal-state">' + escapeHtml(text("shareNoLinks")) + '</div>';
    } else {
      content += '<div class="cfib-share-list">';
      shareList.forEach(function (share) {
        if (!share || !share.id) return;
        shareById[share.id] = share;
        var status = shareStatusInfo(share);
        var disabled = status.key === "active" ? "" : " disabled";
        var shareUrl = shareUrlFor(share);
        var linkDisabled = shareUrl ? "" : " disabled title=\"" + escapeHtml(text("shareUrlUnavailable")) + "\"";
        content += '<div class="cfib-share-row is-' + escapeHtml(status.key) + '">' +
          '<div class="cfib-share-row-main">' +
          '<strong>' + escapeHtml(formatShareTarget(share)) + '</strong>' +
          '<span>' + escapeHtml(text("shareTokenPrefix")) + ': ' + escapeHtml(share.tokenPrefix || "-") + '</span>' +
          (!shareUrl ? '<span class="cfib-share-url-note">' + escapeHtml(text("shareUrlUnavailable")) + '</span>' : '') +
          '</div>' +
          '<div class="cfib-share-row-meta">' +
          '<span>' + escapeHtml(text("shareStatus")) + ': ' + escapeHtml(status.label) + '</span>' +
          '<span>' + escapeHtml(formatShareExpiry(share)) + '</span>' +
          '<span>' + escapeHtml(text("shareCreatedAt")) + ': ' + escapeHtml(formatShareDate(share.createdAt)) + '</span>' +
          '<span>' + escapeHtml(text("shareViews")) + ': ' + escapeHtml(share.viewCount || 0) + '</span>' +
          '<span>' + escapeHtml(text("shareLastViewed")) + ': ' + escapeHtml(formatShareDate(share.lastViewedAt)) + '</span>' +
          '</div>' +
          '<div class="cfib-share-row-actions">' +
          '<button type="button" class="cfib-secondary-btn" data-share-action="copy" data-share-id="' + escapeHtml(share.id) + '"' + linkDisabled + '>' + escapeHtml(text("copy")) + '</button>' +
          '<button type="button" class="cfib-secondary-btn" data-share-action="open" data-share-id="' + escapeHtml(share.id) + '"' + linkDisabled + '>' + escapeHtml(text("open")) + '</button>' +
          '<button type="button" class="cfib-secondary-btn" data-share-action="editExpiry" data-share-id="' + escapeHtml(share.id) + '"' + (status.key === "revoked" ? " disabled" : "") + '>' + escapeHtml(text("editShareExpiry")) + '</button>' +
          '<button type="button" class="cfib-danger-btn" data-share-action="revoke" data-share-id="' + escapeHtml(share.id) + '"' + disabled + '>' + escapeHtml(text("revokeShare")) + '</button>' +
          '</div>' +
          '</div>';
      });
      content += '</div>';
    }

    showModal(text("shareManage"), content);
    var modal = ensureModal();
    modal.querySelectorAll("[data-share-action]").forEach(function (button) {
      button.addEventListener("click", function () {
        var action = button.dataset.shareAction;
        if (action === "refresh") {
          openShareManager();
          return;
        }
        var share = shareById[button.dataset.shareId];
        if ((action === "copy" || action === "open") && !button.disabled) {
          var url = shareUrlFor(share);
          if (!url) {
            showToast(text("shareUrlUnavailable"), "error");
            return;
          }
          if (action === "copy") {
            copyText(url);
          } else {
            window.open(url, "_blank", "noreferrer");
          }
          return;
        }
        if (action === "editExpiry" && !button.disabled) {
          promptShareExpiryOnly(share).then(function (result) {
            if (!result) return;
            button.disabled = true;
            updateShareExpiryFromManager(button.dataset.shareId, result)
              .then(function (data) {
                showToast(text("shareUpdated"), "success");
                if (data && data.share) {
                  shareById[data.share.id] = data.share;
                }
                openShareManager();
              })
              .catch(function (error) {
                button.disabled = false;
                showToast(error.message || String(error), "error");
              });
          });
          return;
        }
        if (action !== "revoke" || button.disabled) return;
        confirmRevokeShare(share).then(function (confirmed) {
          if (!confirmed) return;
          button.disabled = true;
          revokeShareFromManager(button.dataset.shareId)
            .then(function () {
              showToast(text("shareRevoked"), "success");
              openShareManager();
            })
            .catch(function (error) {
              button.disabled = false;
              showToast(error.message || String(error), "error");
            });
        });
      });
    });
  }

  function updateShareExpiryFromManager(id, result) {
    var body = {};
    if (result.expiresInSeconds === null) {
      body.expiresAt = null;
    } else {
      body.expiresInSeconds = result.expiresInSeconds;
    }
    return apiJson("/api/manage/share/" + encodeURIComponent(id || ""), {
      method: "PATCH",
      body: JSON.stringify(body)
    });
  }

  function revokeShareFromManager(id) {
    return apiJson("/api/manage/share/" + encodeURIComponent(id || ""), {
      method: "DELETE"
    });
  }

  function confirmRevokeShare(share) {
    return new Promise(function (resolve) {
      var confirmModal = document.createElement("div");
      confirmModal.className = "cfib-confirm-modal is-open";
      confirmModal.innerHTML =
        '<div class="cfib-confirm-backdrop" data-revoke-action="cancel"></div>' +
        '<section class="cfib-confirm-panel" role="dialog" aria-modal="true">' +
        '<h3 class="cfib-confirm-title">' + escapeHtml(text("revokeShareTitle")) + '</h3>' +
        '<p class="cfib-confirm-message">' + escapeHtml(formatShareTarget(share || {})) + '</p>' +
        '<p class="cfib-confirm-note">' + escapeHtml(text("revokeShareTip")) + '</p>' +
        '<div class="cfib-confirm-actions">' +
        '<button type="button" class="cfib-secondary-btn" data-revoke-action="cancel">' + escapeHtml(text("cancel")) + '</button>' +
        '<button type="button" class="cfib-danger-btn" data-revoke-action="confirm">' + escapeHtml(text("revokeShare")) + '</button>' +
        '</div>' +
        '</section>';

      function finish(value) {
        if (confirmModal.parentNode) confirmModal.parentNode.removeChild(confirmModal);
        resolve(value);
      }

      confirmModal.addEventListener("click", function (event) {
        var button = event.target && event.target.closest("[data-revoke-action]");
        if (!button) return;
        finish(button.dataset.revokeAction === "confirm");
      });

      confirmModal.addEventListener("keydown", function (event) {
        if (event.key === "Escape") finish(false);
      });

      document.body.appendChild(confirmModal);
      var confirmButton = confirmModal.querySelector('[data-revoke-action="confirm"]');
      if (confirmButton) confirmButton.focus();
    });
  }

  function copyText(value) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(value).then(function () {
        showToast(text("shareCopied"), "success");
      }).catch(function () {
        fallbackCopyText(value);
      });
      return;
    }
    fallbackCopyText(value);
  }

  function fallbackCopyText(value) {
    var textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "readonly");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
      showToast(text("shareCopied"), "success");
    } catch (error) {
      showToast(value, "info");
    } finally {
      textarea.remove();
    }
  }

  function formatShareTarget(target) {
    var prefix = target.targetType === "directory" ? text("shareDirectory") : text("shareFile");
    return prefix + " " + (target.targetPath || "/");
  }

  function formatShareExpiry(share) {
    if (!share || !share.expiresAt) {
      return text("shareExpires") + ': ' + text("sharePermanent");
    }
    return text("shareExpires") + ': ' + new Date(share.expiresAt).toLocaleString();
  }

  function shareStatusInfo(share) {
    if (share && share.revokedAt) {
      return { key: "revoked", label: text("shareStatusRevoked") };
    }
    if (share && share.expiresAt && Date.now() > Number(share.expiresAt)) {
      return { key: "expired", label: text("shareStatusExpired") };
    }
    return { key: "active", label: text("shareStatusActive") };
  }

  function formatShareDate(value) {
    if (!value) return "-";
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString();
  }

  function promptFolderName() {
    return new Promise(function (resolve) {
      var confirmModal = document.createElement("div");
      confirmModal.className = "cfib-confirm-modal is-open";
      confirmModal.innerHTML =
        '<div class="cfib-confirm-backdrop" data-folder-action="cancel"></div>' +
        '<section class="cfib-confirm-panel cfib-folder-panel" role="dialog" aria-modal="true">' +
        '<h3 class="cfib-confirm-title">' + escapeHtml(text("newFolderTitle")) + '</h3>' +
        '<label class="cfib-folder-field">' +
        '<span>' + escapeHtml(text("newFolderName")) + '</span>' +
        '<input class="cfib-folder-input" type="text" maxlength="120" data-folder-input="true" placeholder="' + escapeHtml(text("newFolderPlaceholder")) + '">' +
        '</label>' +
        '<div class="cfib-confirm-actions">' +
        '<button type="button" class="cfib-secondary-btn" data-folder-action="cancel">' + escapeHtml(text("cancel")) + '</button>' +
        '<button type="button" class="cfib-primary-btn" data-folder-action="confirm">' + escapeHtml(text("confirm")) + '</button>' +
        '</div>' +
        '</section>';

      function finish(value) {
        if (confirmModal.parentNode) confirmModal.parentNode.removeChild(confirmModal);
        resolve(value);
      }

      function currentValue() {
        var input = confirmModal.querySelector("[data-folder-input]");
        return input ? input.value.trim() : "";
      }

      confirmModal.addEventListener("click", function (event) {
        var button = event.target && event.target.closest("[data-folder-action]");
        if (!button) return;
        var action = button.dataset.folderAction;
        if (action === "cancel") finish("");
        if (action === "confirm") finish(currentValue());
      });

      confirmModal.addEventListener("keydown", function (event) {
        if (event.key === "Escape") finish("");
        if (event.key === "Enter") finish(currentValue());
      });

      document.body.appendChild(confirmModal);
      var input = confirmModal.querySelector("[data-folder-input]");
      if (input) input.focus();
    });
  }

  function importTelegramUpdates() {
    showToast(text("importingTelegram"), "loading");
    apiJson("/api/manage/telegram/import", { method: "POST", body: JSON.stringify({}) })
      .then(function (data) {
        var imported = data.imported ? data.imported.length : 0;
        var skipped = data.skipped ? data.skipped.length : 0;
        var failed = data.failed ? data.failed.length : 0;
        showToast(
          text("importDone") + " - " + text("imported") + ": " + imported + ", " + text("skipped") + ": " + skipped + ", " + text("failed") + ": " + failed,
          failed > 0 ? "error" : "success"
        );
        if (!refreshDashboardIfReady()) {
          markDashboardRefreshPending();
        }
      })
      .catch(function (error) {
        showToast(error.message || String(error), "error");
      });
  }

  function ensureToastContainer() {
    var container = document.querySelector(".cfib-toast-container");
    if (container) return container;
    container = document.createElement("div");
    container.className = "cfib-toast-container";
    document.body.appendChild(container);
    return container;
  }

  function showToast(message, type) {
    var container = ensureToastContainer();
    var toast = document.createElement("div");
    toast.className = "cfib-toast " + (type || "info");
    toast.textContent = message;
    container.appendChild(toast);
    window.setTimeout(function () {
      toast.classList.add("is-leaving");
      window.setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 220);
    }, type === "loading" ? 1800 : 3600);
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

  function renderTrashFileList(files, actionRenderer) {
    if (!files.length) {
      return '<div class="cfib-modal-state">' + escapeHtml(text("noFiles")) + '</div>';
    }

    return '<div class="cfib-file-list cfib-trash-file-list">' + files.map(function (file) {
      var metadata = file.metadata || {};
      var fileId = file.name;
      var checked = trashModalSelection[fileId] ? " checked" : "";
      var tags = Array.isArray(metadata.Tags) && metadata.Tags.length
        ? '<div class="cfib-file-tags">' + metadata.Tags.map(function (tag) {
          return '<span>' + escapeHtml(tag) + '</span>';
        }).join("") + '</div>'
        : '';
      return '<article class="cfib-file-row cfib-trash-file-row">' +
        '<label class="cfib-trash-check">' +
        '<input type="checkbox" data-trash-action="select" data-file="' + escapeHtml(fileId) + '"' + checked + '>' +
        '<span></span>' +
        '</label>' +
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

  function updateAdminActions(nav) {
    var proxy = findDashboardProxy();
    var trashMode = normalizedPath() === "/dashboard" && (currentDashboardMode === "trash" || isTrashMode(proxy) || pendingDashboardMode === "trash" || getSessionValue(dashboardModeStorageKey) === "trash");

    if (proxy) {
      patchDashboardTrashDelete(proxy);
      patchDashboardModeRefresh(proxy);
    }

    nav.querySelectorAll("[data-admin-action]").forEach(function (button) {
      var action = button.dataset.adminAction;
      button.title = text(action);
      button.setAttribute("aria-label", text(action));
      button.classList.toggle("is-active", action === "trash" && trashMode);
    });
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
    var uploadActions = existing.querySelector(".cfib-upload-actions");
    if (uploadActions) uploadActions.remove();
    if (!existing.querySelector(".cfib-admin-actions")) {
      existing.appendChild(makeAdminActions());
    }
    updateNav(existing);
    updateAdminActions(existing);
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
    if (!nav.querySelector(".cfib-admin-actions")) {
      nav.appendChild(makeAdminActions());
    }
    updateNav(nav);
    updateAdminActions(nav);
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
    applyPendingDashboardMode();
    flushPendingDashboardRefresh();
    enforceDashboardModeRefresh();
    ensureDashboardFileActions();
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
    if (node.matches(".cfib-toast-container, .cfib-toast, .el-popper, .el-tooltip__popper, .el-message, .el-image-viewer__wrapper, .el-overlay")) {
      return true;
    }
    if (node.closest(".cfib-toast-container, .el-popper, .el-tooltip__popper, .el-message, .el-image-viewer__wrapper, .el-overlay")) {
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
