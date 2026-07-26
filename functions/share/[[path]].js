const pageHeaders = {
    'Content-Type': 'text/html;charset=UTF-8',
    'Cache-Control': 'private, no-store, max-age=0',
};

export async function onRequest(context) {
    const { request, params } = context;

    if (request.method !== 'GET') {
        return new Response('Method not allowed', { status: 405 });
    }

    const token = getTokenFromParams(params);
    if (!token) {
        return new Response(renderErrorPage('分享链接无效'), {
            status: 400,
            headers: pageHeaders,
        });
    }

    return new Response(renderSharePage(token), {
        headers: pageHeaders,
    });
}

function renderSharePage(token) {
    const escapedToken = escapeHtml(token);
    const encodedToken = encodeURIComponent(token);

    return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>文件分享</title>
  <style>
    :root { color-scheme: light dark; font-family: Inter, "Segoe UI", Arial, sans-serif; }
    body { margin: 0; background: #f6f7f9; color: #1f2933; }
    main { max-width: 920px; margin: 0 auto; padding: 32px 18px 56px; }
    header { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; margin-bottom: 20px; }
    h1 { font-size: 24px; margin: 0; font-weight: 650; }
    .muted { color: #637083; font-size: 14px; }
    .panel { background: #fff; border: 1px solid #d9dee7; border-radius: 8px; overflow: hidden; }
    .row { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 16px; align-items: center; padding: 14px 16px; border-top: 1px solid #edf0f4; }
    .row:first-child { border-top: 0; }
    .name { overflow-wrap: anywhere; font-weight: 520; }
    .meta { margin-top: 4px; color: #637083; font-size: 13px; }
    .row-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; }
    .button { display: inline-flex; align-items: center; justify-content: center; min-height: 34px; padding: 0 12px; border: 0; border-radius: 6px; background: #155eef; color: #fff; text-decoration: none; font: inherit; font-size: 14px; cursor: pointer; }
    .button.secondary { background: #eef2f7; color: #1f2933; }
    .state { padding: 22px 16px; color: #637083; }
    .error { color: #b42318; }
    .preview-overlay { position: fixed; inset: 0; z-index: 1000; display: grid; place-items: center; padding: 24px; background: rgba(15, 23, 42, 0.82); }
    .preview-overlay[hidden] { display: none; }
    .preview-dialog { position: relative; width: min(1080px, 100%); max-height: calc(100vh - 48px); padding: 42px 18px 16px; border-radius: 10px; background: #fff; box-shadow: 0 24px 72px rgba(0, 0, 0, 0.35); text-align: center; }
    .preview-close { position: absolute; top: 8px; right: 10px; width: 34px; height: 34px; border: 0; border-radius: 50%; background: transparent; color: #475467; font-size: 26px; line-height: 1; cursor: pointer; }
    .preview-image { display: block; width: 100%; max-height: calc(100vh - 130px); object-fit: contain; }
    .preview-caption { margin-top: 10px; color: #637083; font-size: 14px; overflow-wrap: anywhere; }
    @media (prefers-color-scheme: dark) {
      body { background: #111827; color: #e5e7eb; }
      .panel { background: #182231; border-color: #334155; }
      .row { border-top-color: #2b3647; }
      .muted, .meta, .state { color: #9aa7b7; }
      .button { background: #3b82f6; }
      .button.secondary { background: #263244; color: #e5e7eb; }
      .preview-dialog { background: #182231; }
      .preview-close { color: #e5e7eb; }
      .preview-caption { color: #9aa7b7; }
    }
    @media (max-width: 640px) {
      header { display: block; }
      .row { grid-template-columns: 1fr; }
      .row-actions { justify-content: stretch; }
      .button { flex: 1 1 110px; }
    }
  </style>
</head>
<body>
  <main>
    <header>
      <h1>文件分享</h1>
      <div class="muted" id="expires"></div>
    </header>
    <section class="panel" id="content">
      <div class="state">正在加载分享内容...</div>
    </section>
  </main>
  <div class="preview-overlay" id="previewOverlay" hidden>
    <div class="preview-dialog" role="dialog" aria-modal="true" aria-labelledby="previewCaption">
      <button class="preview-close" id="previewClose" type="button" aria-label="关闭预览">&times;</button>
      <img class="preview-image" id="previewImage" alt="">
      <div class="preview-caption" id="previewCaption"></div>
    </div>
  </div>
  <script>
    const token = "${escapedToken}";
    const encodedToken = "${encodedToken}";
    const content = document.getElementById("content");
    const expires = document.getElementById("expires");
    const previewOverlay = document.getElementById("previewOverlay");
    const previewClose = document.getElementById("previewClose");
    const previewImage = document.getElementById("previewImage");
    const previewCaption = document.getElementById("previewCaption");
    const initialDir = normalizeRelativeDir(new URLSearchParams(window.location.search).get("dir") || "");
    const initialItem = new URLSearchParams(window.location.search).get("item") || "";

    function escapeText(value) {
      return String(value == null ? "" : value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[char]));
    }

    function formatSize(bytes, fallback) {
      const value = Number(bytes);
      if (!Number.isFinite(value) || value <= 0) return fallback || "";
      const units = ["B", "KB", "MB", "GB"];
      let size = value;
      let unit = 0;
      while (size >= 1024 && unit < units.length - 1) {
        size /= 1024;
        unit += 1;
      }
      return size.toFixed(unit === 0 ? 0 : 1) + " " + units[unit];
    }

    function normalizeRelativeDir(path) {
      let normalized = String(path || "").split("\\\\").join("/");
      while (normalized.charAt(0) === "/") normalized = normalized.slice(1);
      while (normalized.indexOf("//") !== -1) normalized = normalized.replace("//", "/");
      while (normalized.endsWith("/")) normalized = normalized.slice(0, -1);
      return normalized ? normalized + "/" : "";
    }

    function parentRelativePath(relativeDir) {
      const value = normalizeRelativeDir(relativeDir).replace(/\\/+$/, "");
      const index = value.lastIndexOf("/");
      return index === -1 ? "" : value.slice(0, index + 1);
    }

    function sharePageHref(relativeDir, itemId) {
      const value = normalizeRelativeDir(relativeDir);
      const params = new URLSearchParams();
      if (itemId) params.set("item", itemId);
      if (value) params.set("dir", value);
      const query = params.toString();
      return window.location.pathname + (query ? "?" + query : "");
    }

    function shareApiHref(relativeDir, itemId) {
      const value = normalizeRelativeDir(relativeDir);
      const params = new URLSearchParams();
      if (itemId) params.set("item", itemId);
      if (value) params.set("dir", value);
      const query = params.toString();
      return "/api/share/" + encodedToken + (query ? "?" + query : "");
    }

    function basename(path) {
      const value = String(path || "").replace(/\\/+$/, "");
      const index = value.lastIndexOf("/");
      return index === -1 ? value : value.slice(index + 1);
    }

    function isPreviewableImage(meta) {
      return String((meta && meta.FileType) || "").toLowerCase().startsWith("image/");
    }

    function renderFile(file) {
      const meta = file.metadata || {};
      const size = formatSize(meta.FileSizeBytes, meta.FileSize ? meta.FileSize + " MB" : "");
      const fileName = meta.FileName || basename(file.name) || "download";
      const fileUrl = file.url || "#";
      const previewButton = isPreviewableImage(meta)
        ? '<button class="button preview-button" type="button" data-preview-url="' + escapeText(fileUrl) + '" data-preview-name="' + escapeText(fileName) + '">预览</button>'
        : "";
      return '<div class="row">' +
        '<div><div class="name">' + escapeText(fileName) + '</div>' +
        '<div class="meta">' + escapeText([meta.FileType, size].filter(Boolean).join(" · ")) + '</div></div>' +
        '<div class="row-actions">' +
        previewButton +
        '<a class="button" href="' + escapeText(fileUrl) + '" target="_blank" rel="noopener">打开</a>' +
        '<a class="button secondary" href="' + escapeText(fileUrl) + '" download="' + escapeText(fileName) + '">下载</a>' +
        '</div>' +
      '</div>';
    }

    function renderDirectory(directory) {
      const relativePath = normalizeRelativeDir(directory.relativePath || directory.path || "");
      const itemId = directory.itemId || "";
      return '<div class="row">' +
        '<div><div class="name">' + escapeText(directory.name || directory.path) + '</div>' +
        '<div class="meta">文件夹</div></div>' +
        '<div class="row-actions">' +
        '<a class="button" href="' + escapeText(sharePageHref(relativePath, itemId)) + '">打开</a>' +
        '</div>' +
      '</div>';
    }

    function renderParentDirectory(relativeDir, itemId) {
      if (!relativeDir && !itemId) return "";
      const target = relativeDir ? sharePageHref(parentRelativePath(relativeDir), itemId) : sharePageHref("", "");
      return '<div class="row">' +
        '<div><div class="name">..</div><div class="meta">上级文件夹</div></div>' +
        '<div class="row-actions">' +
        '<a class="button secondary" href="' + escapeText(target) + '">返回</a>' +
        '</div>' +
      '</div>';
    }

    function openPreview(url, fileName) {
      if (!url || url === "#") return;
      previewCaption.textContent = fileName || "";
      previewImage.alt = fileName || "图片预览";
      previewImage.src = url;
      previewOverlay.hidden = false;
      document.body.style.overflow = "hidden";
      previewClose.focus();
    }

    function closePreview() {
      previewOverlay.hidden = true;
      previewImage.removeAttribute("src");
      previewImage.alt = "";
      previewCaption.textContent = "";
      document.body.style.overflow = "";
    }

    content.addEventListener("click", event => {
      const button = event.target.closest(".preview-button");
      if (!button) return;
      openPreview(button.dataset.previewUrl, button.dataset.previewName);
    });

    previewClose.addEventListener("click", closePreview);
    previewOverlay.addEventListener("click", event => {
      if (event.target === previewOverlay) closePreview();
    });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && !previewOverlay.hidden) closePreview();
    });

    fetch(shareApiHref(initialDir, initialItem))
      .then(async response => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok || !body.success) {
          throw new Error(body.message || "分享链接不可用");
        }
        return body;
      })
      .then(data => {
        if (data.share && data.share.expiresAt) {
          expires.textContent = "有效期至 " + new Date(data.share.expiresAt).toLocaleString();
        } else {
          expires.textContent = "永久有效";
        }

        if (data.file) {
          content.innerHTML = renderFile(data.file);
          return;
        }

        const currentDir = data.directory ? normalizeRelativeDir(data.directory.relativePath) : initialDir;
        const currentItem = data.directory ? data.directory.itemId || "" : initialItem;
        const directories = (data.directories || []).map(renderDirectory);
        const files = (data.files || []).map(renderFile);
        const rows = [renderParentDirectory(currentDir, currentItem)].concat(directories, files).join("");
        content.innerHTML = rows || '<div class="state">这个分享目录暂无文件。</div>';
      })
      .catch(error => {
        content.innerHTML = '<div class="state error">' + escapeText(error.message) + '</div>';
      });
  </script>
</body>
</html>`;
}

function renderErrorPage(message) {
    return `<!doctype html><meta charset="utf-8"><title>文件分享</title><body>${escapeHtml(message)}</body>`;
}

function getTokenFromParams(params = {}) {
    const raw = String(params.path || '');
    const token = raw.split('/')[0];
    try {
        return decodeURIComponent(token);
    } catch {
        return token;
    }
}

function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
    }[char]));
}
