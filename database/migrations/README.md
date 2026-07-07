# Database migration notes

This directory contains upgrade SQL for existing D1 or SQLite databases. New
databases should start from `database/init.sql`; migrations are for older
databases that were created before a table or column existed.

## Version numbers

- Migration filenames record the product version where the schema change was
  introduced.
- The migration version does not have to match the current `package.json`
  version. For example, this repository can contain `v2.7.7_*` migrations while
  `package.json` still reports an earlier package version.
- Do not decide whether a migration exists only from the package version. Check
  this directory and `database/init.sql`.

## Current migrations

- `v2.2.1_add_tags_column.sql`: adds `files.tags`.
- `v2.7.5_add_share_links.sql`: creates the original `share_links` table for
  single-target shares.
- `v2.7.6_add_share_token.sql`: adds the stored share token column used by the
  management UI to show historical share URLs.
- `v2.7.7_add_share_link_items.sql`: creates `share_link_items` for multi-target
  shares.

## Runtime compatibility

- `database/init.sql` should include the full schema required by a fresh
  install.
- `functions/utils/d1Database.js` keeps defensive compatibility for older D1
  databases by adding the `share_links.token` column and ensuring
  `share_link_items` exists when share records are written or read.
- KV mode does not use these SQL migrations. Share item lists are embedded in
  the `manage@share@<id>` JSON record.

## Adding a migration

When adding a schema change:

1. Update `database/init.sql` for new databases.
2. Add a new idempotent migration file for existing databases.
3. Confirm D1 and SQLite compatibility.
4. Add or update tests around the database adapter behavior.
5. Update this README and `docs/CONTEXT.md` when the schema change is
   long-lived project knowledge.
