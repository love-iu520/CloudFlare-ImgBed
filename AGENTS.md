# 项目协作指令

除非用户在当前任务中明确提出不同要求，否则遵守以下规则。本文件补充全局 `C:\Users\李知恩\.codex\AGENTS.md`，只记录 `CloudFlare-ImgBed` 项目专属规则。

## 项目概况

- 本项目是 CloudFlare ImgBed 文件托管服务，支持 Cloudflare Pages Functions、Cloudflare Workers 和 Docker/Node.js 部署。
- 主要能力包括文件上传、读取、管理、删除、随机图、公共图库、分享链接、WebDAV、鉴权、系统配置和多存储渠道。
- 主要技术栈：Node.js ES Modules、Cloudflare Pages Functions、Wrangler、Mocha、Cloudflare KV/D1/R2、Hono、SQLite。
- 仓库内包含静态前端产物 `frontend-dist`，但不包含完整前端源码；本机前端源码仓库位于相邻目录 `D:\Dev\Projects\Practice\Sanyue-ImgHub`。
- 项目长期上下文记录在 `docs/CONTEXT.md`，任务入口记忆记录在 `docs/PROJECT_MEMORY.md`。

## 常用命令

所有命令默认在项目根目录执行。

- 安装依赖：`npm install`
- CI 依赖安装：`npm ci`
- 本地 Pages Functions 开发：`npm start`
- Docker/Node.js 本地服务：`npm run start:docker`
- 单元测试：`npm test`
- Pages Functions 集成测试：`npm run ci-test`
- Docker/Node.js 集成测试：`npm run ci-test:docker`
- 生成 Worker 路由适配层：`node deploy\worker\generate-routes.js`
- Worker 部署：`npm run deploy:worker`
- 空白字符检查：`git diff --check`

相邻前端源码仓库 `D:\Dev\Projects\Practice\Sanyue-ImgHub` 常用命令：

- 前端依赖安装：`npm install`
- 前端本地开发：`npm run serve`，默认端口为 `3000`
- 前端构建：`npm run build`，输出目录为 `dist`

`npm start` 默认启动 `wrangler pages dev ./frontend-dist`，端口为 `8080`，并把本地运行数据持久化到 `data`。`npm run start:docker` 使用 `deploy/server/index.js` 启动 Hono 服务，也默认监听 `8080`。

本地前后端联调时，后端在本仓库运行 `npm start` 监听 `8080`，前端在 `Sanyue-ImgHub` 运行 `npm run serve` 监听 `3000`；前端 `.env.development` 指向 `http://127.0.0.1:8080`。

## 修改规则

- 开始处理项目任务前，先检查当前分支和工作区状态，再读取 `docs/CONTEXT.md` 和 `docs/PROJECT_MEMORY.md`。
- 只处理当前任务相关文件，不覆盖、删除或回滚已有无关改动。
- 优先遵循现有 ES Modules、Cloudflare Pages Functions 路由和邻近文件风格，不做无关重构或全项目格式化。
- `functions/` 是业务逻辑源目录；新增、删除或移动路由文件后，如果影响 Workers 部署，应重新运行 `node deploy\worker\generate-routes.js` 并检查生成结果。
- `deploy/worker/index.js` 是生成文件，原则上不要手写修改；需要调整 Worker 路由行为时优先修改生成脚本或 `functions/` 源文件。
- `frontend-dist` 是静态前端产物目录。长期前端功能应优先修改 `D:\Dev\Projects\Practice\Sanyue-ImgHub` 中的源码，再构建并同步 `dist` 到本仓库 `frontend-dist`。
- 导航热修复源码已迁移到 `Sanyue-ImgHub/public/js/nav-hotfix.js` 和 `Sanyue-ImgHub/public/css/nav-hotfix.css`；仅在必须直接修补部署产物时才修改本仓库 `frontend-dist/js/nav-hotfix.js`、`frontend-dist/css/nav-hotfix.css`，并保持对应 `.gz` 文件同步。
- 修改前端源码后，在 `Sanyue-ImgHub` 运行 `npm run build`；确认构建输出后再同步到本仓库 `frontend-dist`，避免只改源码但部署产物未更新。
- `data`、`.wrangler`、SQLite 文件和本地运行产物不应提交；不要输出 token、cookie、密钥、Cloudflare 账号信息或存储渠道凭据。
- 修改数据库结构时，同步考虑 `database/init.sql` 和 `database/migrations`，并验证 D1/SQLite 兼容性。
- 修改鉴权、分享链接、文件访问、白名单、黑名单、回收站或公开访问逻辑时，优先补充或运行相关测试。

## 项目长期上下文

- `docs/CONTEXT.md` 记录长期项目事实、架构、技术栈、核心流程、重要目录和稳定约定。
- `docs/PROJECT_MEMORY.md` 记录后续任务的入口记忆、近期决策、常见坑点和待注意事项。
- 如果本轮修改了架构、部署方式、数据库结构、核心业务规则、重要目录、关键命令、验证方式或长期有效的坑点，任务结束前同步更新对应文档。
- 只记录长期有效的信息，不记录一次性调试输出、临时猜测或敏感信息。

## 验证要求

- 仅修改文档时，至少运行 `git diff --check`。
- 修改通用工具、元数据、分享链接或路由行为时，优先运行 `npm test` 或目标测试文件。
- 分享链接相关修改：`npx mocha test\share-links.test.js`
- 元数据、来源组、回收站、文件夹占位符相关修改：`npx mocha test\metadata-helpers.test.js`
- 导航热修复相关修改：`npx mocha test\nav-hotfix-static.test.js`
- 涉及本地运行、部署适配或跨运行时行为时，按影响范围运行 `npm run ci-test` 或 `npm run ci-test:docker`。
- 无法运行验证时，最终回复必须说明原因、缺失条件和剩余风险。

## 提交说明建议

当用户要求修改代码、配置、文档或部署脚本时，如果本轮有跟踪文件变更，最终回复应推荐一个清晰的中文 `git commit -m "..."` 命令。未经用户明确要求，不执行 `git add`、`git commit` 或 `git push`。

提交说明应基于实际文件和行为变化，不机械复制示例。多轮修改最终合并提交时，commit message 应概括全部改动。

示例：

- `git commit -m "新增项目协作与长期上下文文档"`
- `git commit -m "完善分享链接访问验证"`
- `git commit -m "更新 Worker 部署适配配置"`
