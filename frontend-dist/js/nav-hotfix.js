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
      logout: "退出登录"
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
      logout: "Logout"
    }
  };

  var icons = {
    images: '<svg class="cfib-nav-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v13a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 18.5v-13Z" fill="none" stroke="currentColor" stroke-width="2"/><path d="m6 17 3.5-4 2.5 2.5 3.5-4.5L20 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9" cy="8" r="1.4" fill="currentColor"/></svg>',
    user: '<svg class="cfib-nav-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="8" r="3.2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4 20a6 6 0 0 1 12 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M18.5 10v5M16 12.5h5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    cogs: '<svg class="cfib-nav-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    upload: '<svg class="cfib-nav-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="m7.5 8.5 4.5-4.5 4.5 4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 15v3.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    more: '<svg class="cfib-nav-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.7" fill="currentColor"/><circle cx="12" cy="12" r="1.7" fill="currentColor"/><circle cx="19" cy="12" r="1.7" fill="currentColor"/></svg>',
    link: '<svg class="cfib-nav-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.1 0l1.4-1.4a5 5 0 0 0-7.1-7.1L10.5 5.4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M14 11a5 5 0 0 0-7.1 0l-1.4 1.4a5 5 0 0 0 7.1 7.1l.9-.9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    logout: '<svg class="cfib-nav-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M16 17l5-5-5-5M21 12H9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
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
