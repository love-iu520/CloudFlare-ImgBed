# CloudFlare-ImgBed 项目记忆

本文件是 `CloudFlare-ImgBed` 后续任务的快速入口记忆。它补充 `docs/CONTEXT.md`，重点记录近期决策、维护偏好和容易影响后续任务的事项。开始处理本项目任务时，先读 `docs/CONTEXT.md`，再读本文件。

## 当前任务入口

- 项目是文件托管服务，不是纯静态前端项目。
- 常见任务主要分为：Functions API 维护、存储渠道维护、鉴权与分享访问控制、部署适配、数据库迁移、静态前端热修复。
- 当前仓库没有完整前端源码；对界面做小修时通常只能改 `frontend-dist` 中的热修复文件，或者回到外部前端项目处理。
- 如果任务涉及长期规则、部署方式、数据库结构、核心访问控制、重要目录或验证方式，结束前检查是否需要更新 `docs/CONTEXT.md` 和本文件。

## 近期重要记忆

- 2026-07-06：新增项目级 `AGENTS.md`、`docs/CONTEXT.md` 和 `docs/PROJECT_MEMORY.md`，用于让后续任务保留项目上下文。
- 2026-07-06：最新提交脉络集中在分享功能和管理导航，包括分享目标选择、分享管理、分享按钮 fallback、过期分享链接、新建文件夹、回收站批量操作和删除确认弹窗。
- 当前 `package.json` 版本为 `2.7.4`；仓库中已存在 `database/migrations/v2.7.5_add_share_links.sql`，不要仅凭 package 版本判断迁移是否不存在。
- `frontend-dist` 从 README 的 v2.7.1 公告开始是 Cloudflare Pages 构建输出目录。

## 维护注意事项

- 每轮修改前先看 `git status --short --branch`，本项目可能存在运行时或热修复相关未提交改动。
- `deploy/worker/index.js` 是生成文件；新增或移动 `functions/` 路由后运行 `node deploy\worker\generate-routes.js`。
- `deploy/worker/generate-routes.js` 会跳过 `functions/utils`，并只把导出 `onRequest` 的 JS 文件纳入路由。
- `deploy/server/index.js` 在 Docker/Node.js 模式下动态导入 Functions 文件，并在 Windows 上使用 `pathToFileURL`；改动动态 import 时注意 Windows 路径。
- `data` 是本地数据库和 R2 模拟数据目录，`.wrangler` 是 Wrangler 状态目录，二者都不应作为项目事实提交。
- `npm start` 和 `npm run start:docker` 都默认占用 `8080` 端口；启动服务后要在最终回复说明地址和服务状态。
- Docker/Node.js 模式依赖可选依赖 `hono`、`@hono/node-server`、`better-sqlite3`；如果只安装了 Worker 部署所需依赖，Docker 模式可能无法启动。

## 业务规则记忆

- 上传入口会统一读取安全配置、上传渠道配置和页面配置，并在写入元数据后更新索引和清理缓存。
- 上传路径必须经过 `sanitizeUploadFolder`，不要重新引入 `..`、反斜杠或未规范化路径。
- 支持的上传渠道包括 Telegram、Cloudflare R2、S3、Discord、Hugging Face、WebDAV 和 External。
- Telegram 渠道会写入 `SourceGroup`，相关逻辑在 `functions/utils/sourceGroup.js`，测试在 `test/metadata-helpers.test.js`。
- 分享链接要同时检查 token 状态、目标范围和文件元数据状态；Block、Trash、adult 文件不能因为分享 token 而被公开绕过。
- 分享管理新记录会保存完整 token，并在管理员列表接口返回 `/share/<token>` URL，便于跨浏览器复制历史链接；旧记录如果没有保存 token，仍只能依赖本浏览器缓存或重新创建。
- 管理端 API 需要 admin 范围鉴权，且响应默认应为 no-store。
- 文件响应缓存策略需要区分公开访问、管理预览和分享访问；分享访问不应使用公开长缓存。

## 数据库记忆

- `database/init.sql` 是新库初始化脚本；新增表、列、索引或触发器时要同步考虑迁移脚本。
- `share_links` 既存在于初始化脚本中，也有 `v2.7.5_add_share_links.sql` 和 `v2.7.6_add_share_token.sql` 迁移，用于旧库升级。
- D1 适配层会在写入分享链接前检查旧 `share_links` 表是否缺少 `token` 列，缺失时自动执行补列，避免创建分享时报 `no column named token`。
- `files.tags` 既在初始化脚本中存在，也有 `v2.2.1_add_tags_column.sql` 迁移。
- `functions/utils/databaseAdapter.js` 同时支持 KV 和 D1。修改适配层时要跑相关测试，并确认 KV、D1、SQLite 三种路径是否行为一致。
- 如果同时配置 KV 和 D1，必须阅读当前适配逻辑确认实际选择顺序，不要仅根据配置检查函数的返回说明做推断。

## 前端热修复记忆

- `frontend-dist/js/nav-hotfix.js` 和 `frontend-dist/css/nav-hotfix.css` 有对应 gzip 文件。
- 修改导航热修复时，同步更新 `.gz` 文件，并运行 `npx mocha test\nav-hotfix-static.test.js`。
- 现有导航热修复测试通过源码字符串静态断言管理导航、回收站、分享管理、新建文件夹、Telegram 导入和上传页布局，不会启动浏览器。
- 不要对 `frontend-dist` 做全目录格式化或重新构建，除非用户明确要求并接受大范围产物变更。

## 验证记忆

- 文档-only 修改：`git diff --check` 足够。
- 常规测试：`npm test`。
- 分享链接：`npx mocha test\share-links.test.js`。
- 元数据辅助：`npx mocha test\metadata-helpers.test.js`。
- 导航热修复：`npx mocha test\nav-hotfix-static.test.js`。
- 本地 Pages Functions 集成：`npm run ci-test`，会启动 `npm start` 并等待 `http://localhost:8080`。
- Docker/Node.js 集成：`npm run ci-test:docker`，会启动 `npm run start:docker` 并等待 `http://localhost:8080`。

## 维护本文件的规则

- 只记录未来任务会反复用到的信息。
- 不记录一次性命令输出、临时调试步骤、未验证猜测或敏感信息。
- 稳定项目事实优先写入 `docs/CONTEXT.md`；近期维护提醒、常见坑点和任务入口偏好写入本文件。
- 如果本文件与 `docs/CONTEXT.md` 冲突，以 `docs/CONTEXT.md` 的项目事实为准，并修正本文件。
