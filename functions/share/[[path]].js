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
    a.button { display: inline-flex; align-items: center; min-height: 34px; padding: 0 12px; border-radius: 6px; background: #155eef; color: #fff; text-decoration: none; font-size: 14px; }
    .state { padding: 22px 16px; color: #637083; }
    .error { color: #b42318; }
    @media (prefers-color-scheme: dark) {
      body { background: #111827; color: #e5e7eb; }
      .panel { background: #182231; border-color: #334155; }
      .row { border-top-color: #2b3647; }
      .muted, .meta, .state { color: #9aa7b7; }
      a.button { background: #3b82f6; }
    }
    @media (max-width: 640px) {
      header { display: block; }
      .row { grid-template-columns: 1fr; }
      a.button { justify-content: center; }
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
  <script>
    const token = "${escapedToken}";
    const encodedToken = "${encodedToken}";
    const content = document.getElementById("content");
    const expires = document.getElementById("expires");

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

    function renderFile(file) {
      const meta = file.metadata || {};
      const size = formatSize(meta.FileSizeBytes, meta.FileSize ? meta.FileSize + " MB" : "");
      return '<div class="row">' +
        '<div><div class="name">' + escapeText(meta.FileName || file.name) + '</div>' +
        '<div class="meta">' + escapeText([meta.FileType, size].filter(Boolean).join(" · ")) + '</div></div>' +
        '<a class="button" href="' + file.url + '" target="_blank" rel="noopener">打开</a>' +
      '</div>';
    }

    fetch("/api/share/" + encodedToken)
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

        const directories = (data.directories || []).map(directory =>
          '<div class="row"><div><div class="name">' + escapeText(directory.name || directory.path) +
          '</div><div class="meta">文件夹</div></div></div>'
        );
        const files = (data.files || []).map(renderFile);
        content.innerHTML = directories.concat(files).join("") || '<div class="state">这个分享目录暂无文件。</div>';
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
