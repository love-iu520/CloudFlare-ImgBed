import assert from 'node:assert/strict';

import {
  buildTelegramSourceGroup,
  getSourceGroup,
  getSourceGroupKey,
  getSourceGroupName,
  withTelegramSourceGroup,
} from '../functions/utils/sourceGroup.js';
import {
  markMetadataTrashed,
  restoreMetadataFromTrash,
} from '../functions/utils/trash.js';
import {
  buildImportedFileRecord,
} from '../functions/api/manage/telegram/importRecord.js';
import {
  FOLDER_PLACEHOLDER_FILE,
  isFolderPlaceholder,
} from '../functions/utils/indexManager.js';

describe('metadata helpers', () => {
  it('builds stable Telegram source group metadata', () => {
    const sourceGroup = buildTelegramSourceGroup('素材频道');

    assert.deepEqual(sourceGroup, {
      type: 'telegram',
      key: 'telegram:素材频道',
      name: '素材频道',
    });
  });

  it('recognizes source group from explicit metadata and old Telegram records', () => {
    assert.equal(
      getSourceGroupKey({ SourceGroup: { key: 'telegram:素材频道', name: '素材频道' } }),
      'telegram:素材频道'
    );

    assert.deepEqual(
      getSourceGroup({ SourceGroup: { key: 'telegram:素材频道' } }),
      { type: 'telegram', key: 'telegram:素材频道', name: '素材频道' }
    );

    assert.equal(
      getSourceGroupKey({ Channel: 'TelegramNew', ChannelName: '历史频道' }),
      'telegram:历史频道'
    );

    assert.equal(getSourceGroupName({ Channel: 'TelegramNew', ChannelName: '历史频道' }), '历史频道');
  });

  it('attaches Telegram source group without dropping existing metadata', () => {
    const metadata = withTelegramSourceGroup({ Tags: ['头像'] }, '素材频道');

    assert.deepEqual(metadata.Tags, ['头像']);
    assert.deepEqual(metadata.SourceGroup, {
      type: 'telegram',
      key: 'telegram:素材频道',
      name: '素材频道',
    });
  });

  it('marks metadata as trash and preserves the original list type', () => {
    const trashed = markMetadataTrashed({ ListType: 'White', Tags: ['头像'] }, 1710000000000);

    assert.equal(trashed.ListType, 'Trash');
    assert.deepEqual(trashed.Tags, ['头像']);
    assert.deepEqual(trashed.Trash, {
      deletedAt: 1710000000000,
      originalListType: 'White',
    });
  });

  it('restores metadata from trash to the original list type', () => {
    const restored = restoreMetadataFromTrash({
      ListType: 'Trash',
      Trash: {
        deletedAt: 1710000000000,
        originalListType: 'Block',
      },
    });

    assert.equal(restored.ListType, 'Block');
    assert.equal(restored.Trash, undefined);
  });

  it('keeps imported Telegram records in the normal file view while preserving source group metadata', async () => {
    const db = {
      async get() {
        return null;
      },
    };

    const record = await buildImportedFileRecord(
      db,
      { name: '电报机器人' },
      { message_id: 58, date: 1710000000 },
      {
        field: 'photo',
        fileId: 'telegram-file-id',
        fileUniqueId: 'telegram-file-unique-id',
        fileName: 'telegram-58.jpg',
        fileSizeBytes: 1024,
        fileType: 'image/jpeg',
      }
    );

    assert.equal(record.fileId, '58_telegram-58.jpg');
    assert.equal(record.metadata.Directory, '');
    assert.deepEqual(record.metadata.SourceGroup, {
      type: 'telegram',
      key: 'telegram:电报机器人',
      name: '电报机器人',
    });
  });

  it('recognizes folder placeholder records', () => {
    assert.equal(isFolderPlaceholder(`photos/${FOLDER_PLACEHOLDER_FILE}`, {}), true);
    assert.equal(isFolderPlaceholder('photos/real.jpg', { FolderPlaceholder: true }), true);
    assert.equal(isFolderPlaceholder('photos/real.jpg', {}), false);
  });
});
