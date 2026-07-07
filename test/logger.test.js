import assert from 'node:assert/strict';

import { createLogger, redactForLog } from '../functions/utils/logger.js';

describe('logger', () => {
  it('redacts sensitive keys and URL signatures from structured values', () => {
    const redacted = redactForLog({
      token: 'secret-token',
      nested: {
        Authorization: 'Bearer abc.def.ghi',
        uploadUrl: 'https://storage.example/upload?X-Amz-Signature=abc123&Expires=999',
        fileName: 'photo.jpg',
      },
    });

    assert.equal(redacted.token, '[redacted]');
    assert.equal(redacted.nested.Authorization, '[redacted]');
    assert.equal(redacted.nested.uploadUrl, '[redacted]');
    assert.equal(redacted.nested.fileName, 'photo.jpg');
  });

  it('does not emit info logs when default level is warn', () => {
    const original = console.log;
    const calls = [];
    console.log = (...args) => calls.push(args);

    try {
      createLogger('test', { level: 'warn' }).info('quiet');
    } finally {
      console.log = original;
    }

    assert.equal(calls.length, 0);
  });
});
