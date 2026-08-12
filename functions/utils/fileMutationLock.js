const pendingMutations = new Map();

// 同一运行实例内串行处理同一文件的正文请求，避免重复替换 Telegram 消息。
export async function withFileMutationLock(fileId, mutation) {
  const key = String(fileId || '');
  const previous = pendingMutations.get(key) || Promise.resolve();
  const current = previous.catch(() => {}).then(mutation);
  pendingMutations.set(key, current);

  try {
    return await current;
  } finally {
    if (pendingMutations.get(key) === current) {
      pendingMutations.delete(key);
    }
  }
}
