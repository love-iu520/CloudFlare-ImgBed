# Frontend dist sync checklist

The full frontend source is maintained in the independent repository
`MarSeventh/Sanyue-ImgHub`.

This repository stores only the built static assets in `frontend-dist`.

## Normal workflow

Use this checklist when the task meets the build, sync, or hotfix conditions in
the [project modification boundaries](../AGENTS.md#4-项目特有修改边界).
For source-only development, follow the [local development guide](LOCAL_DEVELOPMENT.md).

1. Modify frontend source in `MarSeventh/Sanyue-ImgHub`.
2. Run `npm run build` in that frontend repository, or reuse the existing build
   output for the same source state.
3. Review the generated `dist` changes before copying them here.
4. Sync the built `dist` output into this repository's `frontend-dist`.
5. Make sure related `.gz` files are synced with any changed JS or CSS files.
6. When verification is required under the [project verification rules](../AGENTS.md#5-项目验证入口),
   run the relevant static or integration checks in this repository.

## Navigation hotfix files

Navigation hotfix source lives in the frontend repository:

- `public/js/nav-hotfix.js`
- `public/css/nav-hotfix.css`

When navigation hotfix verification is required after syncing, run from this
repository's root:

```powershell
$ErrorActionPreference = 'Stop'
npx.cmd mocha test\nav-hotfix-static.test.js
```

## Avoid accidental dist churn

- Do not reformat or rebuild all of `frontend-dist` unless the task requires it.
- If hashed asset filenames change widely, confirm the source change really
  requires a full dist refresh.
- For small emergency fixes directly in `frontend-dist`, keep matching `.gz`
  files in sync and plan to backport the change to the frontend source repo.
