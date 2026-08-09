import assert from 'node:assert/strict';

import { telemetryData } from '../functions/utils/middleware.js';

function createContext({ telemetry = true, sentry = null, next }) {
  const request = new Request('https://img.example/upload', { method: 'POST' });
  Object.defineProperty(request, 'cf', {
    configurable: true,
    value: { colo: 'TEST' },
  });

  return {
    request,
    data: {
      telemetry,
      sentry: sentry || createSentryStub(),
    },
    next,
  };
}

function createSentryStub(overrides = {}) {
  return {
    setTag() {},
    setContext() {},
    startTransaction() {
      return { finish() {} };
    },
    ...overrides,
  };
}

describe('telemetry middleware', () => {
  it('calls the downstream handler once and preserves its response', async () => {
    let nextCalls = 0;
    let finishCalls = 0;
    const context = createContext({
      sentry: createSentryStub({
        startTransaction() {
          return { finish: () => finishCalls++ };
        },
      }),
      next: async () => {
        nextCalls++;
        return new Response('invalid upload', { status: 400 });
      },
    });

    const response = await telemetryData(context);

    assert.equal(nextCalls, 1);
    assert.equal(response.status, 400);
    assert.equal(await response.text(), 'invalid upload');
    assert.equal(finishCalls, 1);
  });

  it('propagates downstream exceptions without calling next twice', async () => {
    const expectedError = new Error('upload failed');
    let nextCalls = 0;
    let finishCalls = 0;
    const context = createContext({
      sentry: createSentryStub({
        startTransaction() {
          return { finish: () => finishCalls++ };
        },
      }),
      next: async () => {
        nextCalls++;
        throw expectedError;
      },
    });

    await assert.rejects(() => telemetryData(context), error => error === expectedError);
    assert.equal(nextCalls, 1);
    assert.equal(finishCalls, 1);
  });

  it('does not let transaction cleanup replace the downstream result', async () => {
    const originalWarn = console.warn;
    let nextCalls = 0;
    console.warn = () => {};

    try {
      const context = createContext({
        sentry: createSentryStub({
          startTransaction() {
            return {
              finish() {
                throw new Error('telemetry cleanup failed');
              },
            };
          },
        }),
        next: async () => {
          nextCalls++;
          return new Response('ok');
        },
      });

      const response = await telemetryData(context);
      assert.equal(await response.text(), 'ok');
      assert.equal(nextCalls, 1);
    } finally {
      console.warn = originalWarn;
    }
  });

  it('continues once when telemetry initialization fails', async () => {
    const originalWarn = console.warn;
    let nextCalls = 0;
    console.warn = () => {};

    try {
      const context = createContext({
        sentry: createSentryStub({
          setTag() {
            throw new Error('telemetry unavailable');
          },
        }),
        next: async () => {
          nextCalls++;
          return new Response(null, { status: 204 });
        },
      });

      const response = await telemetryData(context);
      assert.equal(response.status, 204);
      assert.equal(nextCalls, 1);
    } finally {
      console.warn = originalWarn;
    }
  });

  it('calls the downstream handler once when telemetry is disabled', async () => {
    let nextCalls = 0;
    const context = createContext({
      telemetry: false,
      next: async () => {
        nextCalls++;
        return new Response('ok');
      },
    });

    const response = await telemetryData(context);
    assert.equal(await response.text(), 'ok');
    assert.equal(nextCalls, 1);
  });
});
