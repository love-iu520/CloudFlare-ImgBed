(() => {
  'use strict';

  const PREVIEW_SELECTOR = '.text-file-preview';
  const BUTTON_SELECTOR = '.preview-copy-action';
  const FEEDBACK_DELAY_MS = 1500;
  const messages = {
    zh: {
      copy: '复制内容',
      copying: '复制中...',
      copied: '已复制',
      failed: '复制失败',
    },
    en: {
      copy: 'Copy content',
      copying: 'Copying...',
      copied: 'Copied',
      failed: 'Copy failed',
    },
  };

  function getMessages(actions) {
    return /打开原文件|编辑内容|下载/.test(actions.textContent || '') ? messages.zh : messages.en;
  }

  function copyWithTextarea(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      if (!document.execCommand('copy')) throw new Error('Copy failed');
    } finally {
      textarea.remove();
    }
  }

  async function writeText(text) {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return;
      } catch {
        // Fall through for browsers that deny Clipboard API access.
      }
    }
    copyWithTextarea(text);
  }

  async function loadRawContent(actions) {
    const originalLink = actions.querySelector('a[target="_blank"]') || actions.querySelector('a[href]');
    if (!originalLink) throw new Error('Original file link is unavailable');
    const response = await fetch(originalLink.href, { credentials: 'same-origin' });
    if (!response.ok) throw new Error(`Unable to load content: ${response.status}`);
    return response.text();
  }

  function copyScopeAttributes(source, target) {
    for (const attribute of source?.attributes || []) {
      if (attribute.name.startsWith('data-v-')) target.setAttribute(attribute.name, attribute.value);
    }
  }

  async function handleCopy(event) {
    const button = event.currentTarget;
    const preview = button.closest(PREVIEW_SELECTOR);
    const actions = preview?.querySelector('.preview-actions');
    if (!preview || !actions || button.disabled) return;

    const labels = getMessages(actions);
    button.dataset.copying = 'true';
    button.disabled = true;
    button.textContent = labels.copying;

    try {
      await writeText(await loadRawContent(actions));
      button.textContent = labels.copied;
    } catch {
      button.textContent = labels.failed;
    }

    window.setTimeout(() => {
      if (!button.isConnected) return;
      delete button.dataset.copying;
      button.textContent = getMessages(actions).copy;
      syncPreview(preview);
    }, FEEDBACK_DELAY_MS);
  }

  function syncPreview(preview) {
    const actions = preview.querySelector('.preview-actions');
    if (!actions) return;

    const existing = actions.querySelector(BUTTON_SELECTOR);
    if (existing && !existing.hasAttribute('data-copy-content-hotfix')) return;

    let button = existing;
    if (!button) {
      button = document.createElement('button');
      button.type = 'button';
      button.className = 'preview-action preview-copy-action';
      button.setAttribute('data-copy-content-hotfix', '');
      button.textContent = getMessages(actions).copy;
      copyScopeAttributes(actions.querySelector('.preview-action, a'), button);
      button.addEventListener('click', handleCopy);
      actions.prepend(button);
    }

    const editing = Boolean(preview.querySelector('.content-editor'));
    const ready = Boolean(preview.querySelector('.preview-body'));
    const copying = button.dataset.copying === 'true';
    const copyLabel = getMessages(actions).copy;
    if (!copying && button.textContent !== copyLabel) button.textContent = copyLabel;
    button.hidden = editing;
    button.disabled = editing || !ready || copying;
  }

  function syncPreviews() {
    document.querySelectorAll(PREVIEW_SELECTOR).forEach(syncPreview);
  }

  function start() {
    syncPreviews();
    new MutationObserver(syncPreviews).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
