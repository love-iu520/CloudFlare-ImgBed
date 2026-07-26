(function () {
  'use strict';

  const HELP_ATTRIBUTE = 'data-cfib-random-api-help';

  function isEnglish() {
    const documentLanguage = String(document.documentElement.lang || '').toLowerCase();
    if (documentLanguage.startsWith('en')) return true;
    return Array.from(document.querySelectorAll('.first-title')).some((element) =>
      String(element.textContent || '').includes('Random Image API')
    );
  }

  function randomApiExamples() {
    const base = `${window.location.origin}/random`;
    return [
      { label: 'JSON', url: base },
      { label: 'IMG', url: `${base}?type=img` },
      { label: 'AUTO', url: `${base}?type=img&orientation=auto` },
      { label: 'URL', url: `${base}?type=url&form=text` },
    ];
  }

  async function copyText(value, button) {
    const originalText = button.textContent;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = value;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
      }
      button.textContent = isEnglish() ? 'Copied' : '已复制';
    } catch (error) {
      button.textContent = isEnglish() ? 'Copy failed' : '复制失败';
    }
    window.setTimeout(() => {
      button.textContent = originalText;
    }, 1200);
  }

  function createHelpPanel() {
    const panel = document.createElement('div');
    panel.className = 'cfib-random-api-help';
    panel.setAttribute(HELP_ATTRIBUTE, 'true');

    const hint = document.createElement('p');
    hint.className = 'cfib-random-api-hint';
    hint.textContent = isEnglish()
      ? 'Leave the directory empty to include all folders. The base /random URL also works when multiple allowed folders are configured.'
      : '目录留空即可包含全部文件夹；配置多个允许目录后，基础地址 /random 也会自动在这些目录中随机。';
    panel.appendChild(hint);

    randomApiExamples().forEach((example) => {
      const row = document.createElement('div');
      row.className = 'cfib-random-api-row';

      const label = document.createElement('span');
      label.className = 'cfib-random-api-label';
      label.textContent = example.label;

      const input = document.createElement('input');
      input.className = 'cfib-random-api-url';
      input.value = example.url;
      input.readOnly = true;
      input.setAttribute('aria-label', `${example.label} API URL`);

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'cfib-random-api-copy';
      button.textContent = isEnglish() ? 'Copy' : '复制';
      button.addEventListener('click', () => copyText(example.url, button));

      row.append(label, input, button);
      panel.appendChild(row);
    });

    return panel;
  }

  function ensureRandomApiHelp() {
    if (document.querySelector(`[${HELP_ATTRIBUTE}]`)) return;

    const heading = Array.from(document.querySelectorAll('.first-title')).find((element) => {
      const text = String(element.textContent || '').trim();
      return text.includes('随机图像API') || text.includes('Random Image API');
    });
    if (!heading) return;

    const form = heading.nextElementSibling;
    if (!form || !form.classList.contains('el-form')) return;
    if (form.hasAttribute('data-cfib-random-api-native')) return;
    form.appendChild(createHelpPanel());
  }

  function injectStyles() {
    if (document.getElementById('cfib-random-api-help-style')) return;
    const style = document.createElement('style');
    style.id = 'cfib-random-api-help-style';
    style.textContent = `
      .cfib-random-api-help { width: 100%; box-sizing: border-box; padding-top: 4px; }
      .cfib-random-api-hint { margin: 0 0 10px; color: var(--el-text-color-secondary, #606266); font-size: 12px; line-height: 1.6; }
      .cfib-random-api-row { display: grid; grid-template-columns: 52px minmax(0, 1fr) auto; gap: 8px; align-items: center; margin-top: 8px; }
      .cfib-random-api-label { color: var(--el-text-color-regular, #606266); font-size: 12px; font-weight: 600; }
      .cfib-random-api-url { min-width: 0; height: 32px; box-sizing: border-box; padding: 0 10px; border: 1px solid var(--el-border-color, #dcdfe6); border-radius: 6px; color: var(--el-text-color-primary, #303133); background: var(--el-fill-color-blank, #fff); }
      .cfib-random-api-copy { min-width: 54px; height: 32px; padding: 0 10px; border: 1px solid var(--el-border-color, #dcdfe6); border-radius: 6px; color: var(--el-color-primary, #409eff); background: var(--el-fill-color-blank, #fff); cursor: pointer; }
      @media (max-width: 640px) { .cfib-random-api-row { grid-template-columns: 44px minmax(0, 1fr); } .cfib-random-api-copy { grid-column: 2; justify-self: end; } }
    `;
    document.head.appendChild(style);
  }

  function start() {
    injectStyles();
    ensureRandomApiHelp();
    let refreshScheduled = false;
    const scheduleRefresh = () => {
      if (refreshScheduled) return;
      refreshScheduled = true;
      window.requestAnimationFrame(() => {
        refreshScheduled = false;
        ensureRandomApiHelp();
      });
    };
    const observer = new MutationObserver(scheduleRefresh);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
