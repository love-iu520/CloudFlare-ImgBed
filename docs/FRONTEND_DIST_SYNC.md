# Frontend dist sync checklist

The full frontend source is maintained in the adjacent repository:

`D:\Dev\Projects\Practice\Sanyue-ImgHub`

This repository stores only the built static assets in `frontend-dist`.

## Normal workflow

1. Modify frontend source in `D:\Dev\Projects\Practice\Sanyue-ImgHub`.
2. Run `npm run build` in that frontend repository.
3. Review the generated `dist` changes before copying them here.
4. Sync the built `dist` output into this repository's `frontend-dist`.
5. Make sure related `.gz` files are synced with any changed JS or CSS files.
6. Run the relevant static or integration checks in this repository.

## Navigation hotfix files

Navigation hotfix source lives in the frontend repository:

- `D:\Dev\Projects\Practice\Sanyue-ImgHub\public\js\nav-hotfix.js`
- `D:\Dev\Projects\Practice\Sanyue-ImgHub\public\css\nav-hotfix.css`

After syncing those files into this repository, run:

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
