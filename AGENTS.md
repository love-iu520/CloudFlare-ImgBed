# 项目协作规则

## 1. 项目定位

- **项目名称**：`CloudFlare-ImgBed`
- **用途**：提供文件托管、图床、管理面板、分享、WebDAV 与公开访问能力。
- **主要技术栈**：Node.js ES Modules、Cloudflare Pages Functions、Wrangler、Mocha、Hono、Cloudflare KV / D1 / R2、SQLite。
- **版本来源**：应用版本以 `package.json` 为准；数据库演进以 `database/init.sql` 与 `database/migrations/` 为准，二者不是同一版本账本。
- **包管理 / 构建系统**：npm，锁文件为 `package-lock.json`。
- **主要运行环境**：Cloudflare Pages Functions、Cloudflare Workers、Docker / Node.js；容器与相关自动化使用 Node.js 22。

当前实现事实以代码、配置、脚本和有效运行结果为准。详细模块关系、状态归属和关键流程见 `docs/CONTEXT.md`。

## 2. 常见任务路由

本项目启用 L2 Project Map。根规则只保留任务类型到稳定模块 / 流程的轻量路由，具体入口由 Context 维护。

| 任务类型 | 优先路由 | 专项说明 |
|---|---|---|
| Functions API、鉴权、系统配置 | `MOD-FUNCTIONS` | — |
| 上传与存储渠道 | `FLOW-UPLOAD`、`MOD-DATA` | — |
| 文件读取、公开访问、缓存与分享安全 | `FLOW-FILE-ACCESS`、`FLOW-SHARE` | — |
| 文件删除与 Telegram 强制清理 | `FLOW-FILE-DELETION` | — |
| 数据库结构、迁移与适配层 | `FLOW-SCHEMA-EVOLUTION`、`MOD-DATA` | `database/migrations/README.md` |
| Pages / Worker / Docker 跨运行时行为 | `FLOW-RUNTIME-ROUTING` | — |
| Worker 路由生成或部署 | `MOD-WORKER-RUNTIME`、`FLOW-RUNTIME-ROUTING` | — |
| Docker / Node.js 适配层 | `MOD-NODE-RUNTIME` | — |
| 前端界面、热修复与部署产物 | `MOD-FRONTEND-DELIVERY`、`FLOW-FRONTEND-SYNC` | `docs/FRONTEND_DIST_SYNC.md` |
| CI、镜像与仓库同步自动化 | `MOD-AUTOMATION` | — |

主要测试入口为 `test/`；部署产物为 `frontend-dist/`；业务路由源为 `functions/`。

## 3. 标准命令

除特别说明外，均在项目根目录执行。

| 目的 | 命令 | 说明 |
|---|---|---|
| 恢复锁定依赖 | `npm ci` | 使用现有 `package-lock.json` |
| 常规依赖安装 | `npm install` | 使用 npm 的常规安装入口 |
| Pages Functions 本地运行 | `npm start` | 监听 `0.0.0.0:8080`，本地状态写入 `data/` |
| Docker / Node.js 本地运行 | `npm run start:docker` | 经 `deploy/server/register.mjs` 加载，默认监听 `8080` |
| 单元测试 | `npm test` | Mocha 全量入口 |
| Worker 路由检查 | `npm run test:routes` | 会先重生成 `deploy/worker/index.js`，随后运行路由静态测试 |
| Pages Functions 集成测试 | `npm run ci-test` | 启动服务并等待 `http://localhost:8080` |
| Docker / Node.js 集成测试 | `npm run ci-test:docker` | 启动服务并等待 `http://localhost:8080` |
| 生成 Worker 路由 | `node deploy/worker/generate-routes.js` | 生成后检查 `deploy/worker/index.js` 差异 |
| Worker 部署 | `npm run deploy:worker` | 先生成路由，再使用 `deploy/worker/wrangler.toml` |
| 空白字符检查 | `git diff --check` | 文档和治理文件的静态检查入口 |

独立前端源码仓库 `MarSeventh/Sanyue-ImgHub` 的标准入口为 `npm run serve` 和 `npm run build`；本仓不保存其本机绝对路径。

## 4. 项目特有修改边界

- `functions/` 是 Pages、Workers 和 Docker / Node.js 共用的业务与路由 Source of Truth。共享行为优先在该层修改；只有运行时特有行为才进入对应适配模块。
- `deploy/worker/index.js` 是 `deploy/worker/generate-routes.js` 的生成物，不手写修改。新增、删除或移动 Functions 路由，或改变路由导出方式后，重新生成并检查产物差异。
- `frontend-dist/` 是部署产物，不是长期前端源码 Source of Truth。长期界面或交互修改应在独立前端源码仓完成、构建并审查 `dist` 后再同步；直接产物热修复仅限任务确实要求的场景，并同步对应 `.gz` 文件。详细流程以 `docs/FRONTEND_DIST_SYNC.md` 为准。
- 数据库结构变化必须同时考虑新库 `database/init.sql` 与旧库 `database/migrations/`，并保持 D1 与 SQLite 兼容；KV 路径不使用 SQL 迁移。迁移编号规则以 `database/migrations/README.md` 为准。
- 上传及第三方存储路径使用 `functions/utils/logger.js` 输出脱敏摘要；渠道配置、token、Cookie、Authorization、签名 URL 和完整第三方响应体不得进入日志或治理文档。
- `data/`、`.wrangler/`、SQLite 文件和本地 R2 内容是运行时状态，不作为源码或治理事实提交。

## 5. 项目验证入口

验证范围按全局 Verification Budget 决定；下表只提供本项目的定向入口。

| 修改类型 | 优先验证入口 | 备注 |
|---|---|---|
| 纯文档 / 治理文件 | `git diff --check` | 静态一致性检查 |
| 通用 Functions 或工具逻辑 | `npm test` 或直接命中目标的 Mocha 文件 | 目标明确时优先定向 |
| Worker 路由拓扑 | `npm run test:routes` | 命令会改写生成文件，必须检查差异 |
| 分享链接与分享访问 | `npx mocha test/share-links.test.js` | 覆盖分享模型与访问约束 |
| 文件删除与强制清理 | `npx mocha test/file-delete.test.js` | 包含 Telegram 删除失败路径 |
| 元数据、来源组、回收站、占位文件夹 | `npx mocha test/metadata-helpers.test.js` | — |
| 随机 API 与帮助地址 | `npx mocha test/random-api.test.js test/random-api-help-static.test.js` | — |
| 上传路径校验 | `npx mocha test/upload-validation.test.js` | — |
| 导航热修复 | `npx mocha test/nav-hotfix-static.test.js` | 不启动浏览器 |
| Docker / Node.js 适配 | `npx mocha test/docker-server-static.test.js` | 跨运行时影响再考虑 `npm run ci-test:docker` |
| Pages / Docker 跨运行时行为 | `npm run ci-test` 或 `npm run ci-test:docker` | 只在实际影响需要时升级 |
| 前端源码 | 在前端源码仓运行 `npm run build` | 同步产物后再按改动选择本仓静态或集成测试 |

## 6. 项目知识路由

### 6.1 Project Map（L2）

- **入口**：`docs/CONTEXT.md`
- **作用**：保存当前稳定模块职责、具体任务入口、核心关系、Owner、Source of Truth 和关键流程。
- **读取门禁**：Context Gate 命中时按 `MOD-*` / `FLOW-*` 定向读取；普通局部任务不默认全文读取。
- **维护**：稳定结构事实变化时更新；不保存命令规则、任务流水或 Memory 决策原因。

### 6.2 Project Memory（L3）

- **入口**：`docs/PROJECT_MEMORY.md`
- **作用**：只保存 `DECISION`、`PREFERENCE`、`ISSUE`、`RESUME` 四类跨任务历史语义。
- **读取门禁**：Memory Gate 命中时先查索引，再按 `GLOBAL`、`MOD-*` 或 `FLOW-*` 定位；不机械阅读全文。
- **写入门禁**：任务结束时按 Memory Gate 判断；未形成长期决定、稳定偏好、可复发问题或不可从工作区恢复的未完成任务时，不更新。

### 6.3 专项操作文档

- 前端产物同步：`docs/FRONTEND_DIST_SYNC.md`
- 数据库迁移：`database/migrations/README.md`

专项文档保存可复用操作细节，不替代 AGENTS 门禁、Context 结构事实或 Memory 历史语义。

## 7. 治理维护

- 本项目当前使用 L1 基础规则、L2 Project Map 和 L3 Project Memory。
- 治理层创建、升级、拆分、降级和清理遵循 `PROJECT_AGENTS_WORKFLOW V2`；没有实际内容的可选章节不保留。
- `MOD-*` / `FLOW-*` 职责变化时，同步检查本文件路由和 `PROJECT_MEMORY` 作用域；普通文件移动不改稳定 ID，但应更新 Context 当前路径。
- 修改本文件后，不假设当前 Codex 会话自动重新加载新规则。
