# CloudFlare-ImgBed 项目长期上下文

本文件记录 `D:\Dev\Projects\Practice\CloudFlare-ImgBed` 的长期项目事实和维护约定。它不会自动更新；当架构、部署、数据库、核心业务规则、关键命令或长期有效的已知坑点变化时，应同步更新本文件。

## 项目定位

- 本仓库是 CloudFlare ImgBed 文件托管服务，目标是提供开源文件托管、图床和管理面板能力。
- 项目支持上传、读取、管理、删除、目录、图片审查、随机图、公共图库、分享链接、WebDAV 和 RESTful API。
- 支持多种部署形态：Cloudflare Pages Functions、Cloudflare Workers、Docker/Node.js。
- 支持多种存储渠道：Telegram、Discord、Cloudflare R2、S3、Hugging Face、WebDAV 和外链记录。
- 仓库内包含 `frontend-dist` 静态前端产物，不包含完整前端源码；README 指向外部前端项目 `MarSeventh/Sanyue-ImgHub`。

## 技术栈与运行方式

- 包管理器：npm，仓库包含 `package-lock.json`。
- 运行环境：Dockerfile 和 GitHub Actions 使用 Node.js 22。
- 模块系统：`package.json` 设置 `"type": "module"`，代码以 ES Modules 为主。
- Cloudflare 本地开发：`npm start` 使用 `wrangler pages dev ./frontend-dist --kv "img_url" --r2 "img_r2" --port 8080 --persist-to ./data`。
- Docker/Node.js 模式：`npm run start:docker` 使用 `deploy/server/index.js`，通过 Hono 模拟 Pages Functions 路由，用 SQLite 模拟 D1，用本地文件系统模拟 R2。
- Worker 部署：`npm run deploy:worker` 先运行 `deploy/worker/generate-routes.js`，再使用 `wrangler deploy --config deploy/worker/wrangler.toml`。
- 测试框架：Mocha，默认命令为 `npm test`。

## 重要目录

- `functions`：Cloudflare Pages Functions 业务逻辑和 API 路由源目录。
- `functions/api`：用户配置、鉴权、管理端、公开列表、分享链接、Bing 壁纸等 API。
- `functions/upload`：上传入口、分块上传、合并和上传工具。
- `functions/file`：文件读取、访问控制、缓存头、阻止图和白名单图回退逻辑。
- `functions/dav`：WebDAV 入口。
- `functions/random`：随机文件访问入口。
- `functions/utils`：数据库适配、系统配置、鉴权、索引、缓存清理、元数据、分享链接和各存储渠道客户端。
- `frontend-dist`：静态 SPA 产物，包含 `index.html`、CSS、JS、图片、字体和 gzip 文件。
- `deploy/server`：Docker/Node.js 运行时适配层，包含 Hono 服务、SQLite D1 模拟和本地 R2 模拟。
- `deploy/worker`：Workers 部署适配层、路由生成脚本和 wrangler 配置生成脚本。
- `database`：D1/SQLite 初始化 SQL 和迁移脚本。
- `test`：Mocha 测试，目前覆盖元数据辅助、分享链接和导航热修复静态检查。
- `readme`：README 引用的图片资源。
- `data`：本地运行数据目录，被 `.gitignore` 忽略。
- `.wrangler`：Wrangler 本地状态目录，被 `.gitignore` 忽略。

## 核心运行流程

### 请求路由

- Pages Functions 模式直接使用 `functions/` 目录结构作为路由。
- Docker/Node.js 模式由 `deploy/server/index.js` 扫描并动态导入 `functions/`，支持精确路由、`index.js`、`[[path]].js` 和 `_middleware.js`。
- Workers 模式由 `deploy/worker/generate-routes.js` 扫描 `functions/` 并生成 `deploy/worker/index.js` 静态路由表。
- `_middleware.js` 按目录层级组成中间件链，`functions/api/_middleware.js` 会检查数据库配置，`functions/api/manage/_middleware.js` 会执行管理端鉴权和 no-store 缓存控制。

### 上传流程

- 上传入口为 `functions/upload/index.js`。
- 上传前读取安全配置、上传渠道配置和页面配置，并执行用户上传权限检查。
- 上传路径通过 `sanitizeUploadFolder` 做路径穿越和特殊字符处理。
- 支持普通上传、分块上传初始化、分块上传、分块合并和清理请求。
- 存储渠道包括 Cloudflare R2、S3、Telegram、Discord、Hugging Face、WebDAV 和 External。
- 上传成功后写入数据库元数据，调用索引更新，并清理相关 CDN、随机文件列表和公开文件列表缓存。

### 文件读取与访问控制

- 文件读取入口主要在 `functions/file/[[path]].js` 和 `functions/file/fileTools.js`。
- 文件响应会设置 `Content-Disposition`、CORS、Range 和 Cache-Control 相关头。
- `returnWithCheck` 根据白名单模式、管理预览、分享 token、`ListType` 和 `Label` 判断访问结果。
- `ListType = Block`、`ListType = Trash` 或 `Label = adult` 等场景不能被普通公开访问绕过。
- 分享链接访问使用私有缓存策略，避免公开缓存泄漏。

### 管理与公开能力

- 管理端 API 位于 `functions/api/manage`，覆盖文件列表、删除、移动、重命名、白名单/黑名单、回收站恢复、标签、批量索引、系统配置、来源组、Telegram 导入和分享管理。
- 分享管理 API 支持创建、列表、撤销和更新有效期；新分享记录保存完整 token 以便管理员复制历史链接，同时保留 token hash 用于访问校验。
- 公开能力包括 `/api/public/list`、`/random`、`/share/*`、`/api/share/*` 和 `/dav/*`。
- 系统配置由 `functions/api/manage/sysConfig` 与 `functions/utils/sysConfig.js` 协作读取，配置主要持久化在数据库中。

## 数据库与存储

- 数据库适配层位于 `functions/utils/databaseAdapter.js`，提供 KV 和 D1 的统一接口。
- `database/init.sql` 创建 `files`、`settings`、`index_operations`、`index_metadata`、`other_data` 和 `share_links` 表。
- `database/migrations` 保存增量迁移，目前包含 `tags` 字段和 `share_links` 表迁移。
- D1 逻辑封装在 `functions/utils/d1Database.js`；Docker/Node.js 模式使用 `deploy/server/sqliteD1.js` 模拟 D1。
- D1 旧库如果已有 `share_links` 表但缺少 `token` 列，`functions/utils/d1Database.js` 会在写入分享链接前自动补列；迁移文件仍用于部署时显式升级。
- 本地 Docker/Node.js 模式使用 `data/database.sqlite` 和 `data/r2`，这些属于运行数据，不应提交。
- 存储渠道客户端位于 `functions/utils/storage`。

## 部署与自动化

- Cloudflare Pages 用户需把构建输出目录配置为 `frontend-dist`。
- Worker 配置模板在 `deploy/worker/wrangler.toml`，GitHub Actions 可通过 Secrets 运行 `deploy/worker/generate-toml.js` 动态生成配置。
- `.github/workflows/deploy-worker.yml` 只在 fork 仓库且配置 Cloudflare Secrets 时部署 Worker。
- `.github/workflows/docker-publish.yml` 仅在原仓库 `MarSeventh/CloudFlare-ImgBed` 构建并推送 Docker 镜像。
- `.github/workflows/sync-upstream.yml` 用于 fork 仓库定时同步上游，并在同步后触发 Worker 部署。

## 近期提交脉络

- 2026-07-06：当前分支 `main` 最新提交为 `完善分享目标选择与分享管理`。
- 2026-07-06：近期提交包含分享按钮 fallback、带过期时间的分享链接、新建文件夹、回收站批量操作和删除确认弹窗。
- 2026-07-06：仓库已有导航热修复静态测试，校验 `frontend-dist/js/nav-hotfix.js` 和 `frontend-dist/css/nav-hotfix.css` 中的管理导航、回收站、分享和上传页布局约束。

## 已知项目约定与坑点

- `deploy/worker/index.js` 文件头明确标注自动生成；修改 Workers 路由时优先修改 `functions/` 或 `deploy/worker/generate-routes.js`。
- `frontend-dist` 是静态产物目录，修改其中 JS/CSS 时要避免无关产物抖动，并保持 `.gz` 文件同步。
- 当前仓库没有 `src` 目录；不要把外部前端源码约定误写成本仓库事实。
- `.gitignore` 忽略 `data`、`.wrangler`、SQLite 文件、`node_modules` 和若干本地 IDE/Agent 目录。
- 数据库配置可使用 KV `img_url` 或 D1 `img_d1`；修改适配层时要同时确认 Pages、Workers 和 Docker/SQLite 三种运行模式。
- `deploy/worker/generate-toml.js` 会从环境变量读取 Cloudflare binding 信息，并对输出日志中的敏感字段做脱敏；不要在文档或日志中打印真实凭据。
- 管理端 API 默认应返回 `private, no-store, max-age=0`，不要让管理数据被公开缓存。
- 分享链接应校验过期、撤销、目标路径范围和文件元数据状态，不能绕过 Block、Trash 或 adult 限制；管理接口可返回完整分享 URL，公开接口不应泄露管理数据。
- Telegram、Discord、Hugging Face、S3、WebDAV 等渠道配置包含敏感凭据，读取和调试时只输出脱敏摘要。

## 推荐验证方式

- 文档-only 修改：`git diff --check`。
- 常规工具或 API 修改：`npm test`。
- 分享链接修改：`npx mocha test\share-links.test.js`。
- 元数据、来源组、回收站、文件夹占位符修改：`npx mocha test\metadata-helpers.test.js`。
- 导航热修复修改：`npx mocha test\nav-hotfix-static.test.js`。
- 新增、删除或移动 Functions 路由：`node deploy\worker\generate-routes.js`，然后检查 `deploy/worker/index.js` diff。
- 跨运行时改动：按影响范围运行 `npm run ci-test` 或 `npm run ci-test:docker`。

## 何时更新本文档

- 新增、删除或迁移重要目录、运行模式或部署流程。
- 改动数据库 schema、迁移策略、存储渠道、鉴权规则、分享链接规则或缓存策略。
- 改动 Worker 路由生成、Docker/Node.js 适配、Pages Functions 中间件或关键命令。
- 发现会影响后续维护的稳定坑点或约定。
