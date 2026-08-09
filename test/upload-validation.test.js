import assert from 'node:assert/strict';

import { isUploadedFile } from '../functions/upload/uploadValidation.js';

describe('upload file validation', () => {
  it('accepts a cross-runtime file-like object', () => {
    const file = {
      name: 'photo.jpg',
      type: 'image/jpeg',
      size: 3,
      slice() {},
      async arrayBuffer() {
        return new ArrayBuffer(3);
      },
    };

    assert.equal(isUploadedFile(file), true);
  });

  it('accepts a file parsed from native multipart form data', async () => {
    const formData = new FormData();
    formData.set('file', new File([new Uint8Array([1, 2, 3])], 'photo.jpg', {
      type: 'image/jpeg',
    }));
    const request = new Request('https://img.example/upload', {
      method: 'POST',
      body: formData,
    });

    const parsedFormData = await request.formData();
    assert.equal(isUploadedFile(parsedFormData.get('file')), true);
  });

  it('rejects missing, string, and incomplete file fields', () => {
    assert.equal(isUploadedFile(null), false);
    assert.equal(isUploadedFile('not-a-file'), false);
    assert.equal(isUploadedFile({ name: 'photo.jpg', type: 'image/jpeg', size: 3 }), false);
    assert.equal(isUploadedFile({
      name: 'photo.jpg',
      type: 'image/jpeg',
      size: -1,
      slice() {},
      async arrayBuffer() {},
    }), false);
  });
});
