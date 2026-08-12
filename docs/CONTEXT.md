# 项目稳定上下文

## 1. 架构概览

- **主要运行形态**：同一套 Functions 业务实现运行于 Cloudflare Pages Functions、Cloudflare Workers 和 Docker / Node.js 三种形态。
- **核心结构**：`functions/` 提供业务路由与共享逻辑；`deploy/worker/` 将其生成成 Worker 路由表；`deploy/server/` 用 Hono、SQLite、本地文件系统和进程内 Cache 适配 Node.js；`frontend-dist/` 向三种运行形态提供静态 SPA 产物。
- **数据与存储**：元数据和系统状态可落在 Cloudflare KV、D1 或 Node.js 下的 SQLite 兼容层；文件内容由 R2、本地 R2 模拟或配置的第三方存储渠道承载。
- **前端来源**：完整前端源码属于独立仓库 `MarSeventh/Sanyue-ImgHub`，本仓库只保存经构建并同步的 `frontend-dist/`。

本文中的 **Owner** 表示负责生命周期或写入语义的逻辑模块，不表示个人或团队所有权；仓库当前没有单独的 CODEOWNERS 事实源。

## 2. 模块索引

| ID | 模块 | 主要位置 | 核心职责 |
|---|---|---|---|
| `MOD-FUNCTIONS` | Functions 业务核心 | `functions/` | 处理 API、上传、读取、鉴权、分享、WebDAV、随机访问和系统配置语义 |
| `MOD-DATA` | 数据与存储 | `database/`、`functions/utils/` 中的数据 / 存储适配、`deploy/server/` 中的本地模拟 | 维护 schema、元数据访问、索引及文件存储适配 |
| `MOD-NODE-RUNTIME` | Docker / Node.js 运行时 | `deploy/server/`、`Dockerfile`、`docker-compose.yml` | 将 Functions、D1、R2、Cache 和静态资源适配到 Node.js |
| `MOD-WORKER-RUNTIME` | Workers 运行时 | `deploy/worker/` | 从 Functions 生成 Worker 路由并提供 Wrangler 部署配置 |
| `MOD-FRONTEND-DELIVERY` | 前端源码与部署产物交付 | 独立前端仓库、`frontend-dist/`、`docs/FRONTEND_DIST_SYNC.md` | 维护前端源码到本仓部署产物的边界和同步关系 |
| `MOD-AUTOMATION` | 交付与仓库自动化 | `.github/workflows/` | 负责 Worker 部署、Docker 镜像、上游同步和 Release 同步 |

## 3. 模块详情

### MOD-FUNCTIONS — Functions 业务核心

- **职责**：维护跨运行时共享的 HTTP 路由、业务规则和请求级编排。
- **主要位置**：`functions/api/`、`functions/upload/`、`functions/file/`、`functions/share/`、`functions/random/`、`functions/dav/`、`functions/utils/`。
- **主要入口**：
  - 上传：`functions/upload/index.js`
  - 文件读取：`functions/file/[[path]].js`、`functions/file/fileTools.js`
  - 管理 API：`functions/api/manage/`
  - 分享管理 / 公开访问：`functions/api/manage/share/`、`functions/api/share/[[path]].js`、`functions/share/[[path]].js`
  - 随机访问与 WebDAV：`functions/random/index.js`、`functions/dav/[[path]].js`
  - 共享鉴权、配置、日志与缓存失效：`functions/utils/auth/`、`functions/utils/sysConfig.js`、`functions/utils/logger.js`、`functions/utils/purgeCache.js`
- **核心协作**：请求路由 → 鉴权 / 配置 → `MOD-DATA` → 响应与缓存策略。
- **主要依赖**：`MOD-DATA` 及 Cloudflare Pages Functions 风格的请求上下文。
- **主要消费者**：Pages 直接消费；`MOD-NODE-RUNTIME` 动态加载；`MOD-WORKER-RUNTIME` 生成静态路由表。
- **稳定边界**：共享产品语义属于本模块；运行时模块只负责平台适配，不维护平行业务分叉。
- **典型任务入口**：上传见 `FLOW-UPLOAD`，访问控制见 `FLOW-FILE-ACCESS`，分享见 `FLOW-SHARE`，删除见 `FLOW-FILE-DELETION`。

### MOD-DATA — 数据与存储

- **职责**：维护关系型 schema、KV / D1 统一访问、索引与元数据写入，以及文件存储渠道适配。
- **主要位置**：`database/init.sql`、`database/migrations/`、`functions/utils/databaseAdapter.js`、`functions/utils/d1Database.js`、`functions/utils/indexManager.js`、`functions/utils/storage/`、`deploy/server/sqliteD1.js`、`deploy/server/r2Storage.js`。
- **主要入口**：
  - 新库 schema：`database/init.sql`
  - 旧库演进：`database/migrations/`
  - KV / D1 选择与统一接口：`functions/utils/databaseAdapter.js`
  - D1 实现与旧库兼容：`functions/utils/d1Database.js`
  - Node.js D1 / R2 模拟：`deploy/server/sqliteD1.js`、`deploy/server/r2Storage.js`
- **核心协作**：`MOD-FUNCTIONS` 定义数据语义，本模块把语义映射到 KV、D1 / SQLite 和选定存储渠道。
- **主要依赖**：Cloudflare KV / D1 / R2 binding、SQLite、本地文件系统及外部存储服务。
- **主要消费者**：`MOD-FUNCTIONS`、`MOD-NODE-RUNTIME`。
- **稳定边界**：新安装的完整 SQL 结构以 `database/init.sql` 为准；旧数据库升级以 `database/migrations/` 为准；KV 分享数据使用 JSON 记录，不执行 SQL 迁移。
- **典型任务入口**：结构变更见 `FLOW-SCHEMA-EVOLUTION`；迁移编号与兼容说明见 `database/migrations/README.md`。

### MOD-NODE-RUNTIME — Docker / Node.js 运行时

- **职责**：在 Node.js 中承载静态资源和 Functions 路由，并模拟 Cloudflare 平台能力。
- **主要位置**：`deploy/server/`、`Dockerfile`、`docker-compose.yml`。
- **主要入口**：`deploy/server/register.mjs` 注册 loader，`deploy/server/index.js` 启动 Hono 服务；`deploy/server/sqliteD1.js`、`r2Storage.js`、`memoryCache.js` 提供 D1、R2 和 Cache 适配。
- **核心协作**：Node loader 动态导入 `MOD-FUNCTIONS` → Hono 路由 / 中间件 → `MOD-DATA` 本地适配 → `frontend-dist/` 静态资源。
- **主要依赖**：`MOD-FUNCTIONS`、`MOD-DATA`、`MOD-FRONTEND-DELIVERY`，以及 Hono、`@hono/node-server`、`better-sqlite3`。
- **主要消费者**：直接 Node.js 运行和 Docker 镜像。
- **稳定边界**：直接运行默认监听容器 / 进程端口 `8080`；`docker-compose.yml` 当前映射宿主机 `7658` 到容器 `8080`。进程内 Cache 有界，静态资源可优先使用预压缩 gzip；哈希资源可长期缓存，入口页和未哈希热修复资源要求重新验证。
- **典型任务入口**：路由加载与静态服务从 `deploy/server/index.js` 开始；跨运行时关系见 `FLOW-RUNTIME-ROUTING`。

### MOD-WORKER-RUNTIME — Workers 运行时

- **职责**：把 Functions 路由树编译为单 Worker 入口，并维护 Worker 部署配置生成。
- **主要位置**：`deploy/worker/`。
- **主要入口**：`deploy/worker/generate-routes.js`、`deploy/worker/generate-toml.js`、`deploy/worker/wrangler.toml`。
- **核心协作**：扫描 `MOD-FUNCTIONS` → 组合目录中间件、精确路由与 catch-all → 生成 `deploy/worker/index.js` → Wrangler 部署。
- **主要依赖**：`MOD-FUNCTIONS`、`MOD-FRONTEND-DELIVERY` 和 Cloudflare Workers bindings。
- **主要消费者**：`MOD-AUTOMATION` 的 Worker 部署工作流和本地部署入口。
- **稳定边界**：`deploy/worker/index.js` 是生成物；生成器跳过 `functions/utils/`，只纳入导出 `onRequest` 的 JavaScript 路由文件。
- **典型任务入口**：路由生成从 `deploy/worker/generate-routes.js` 开始；三运行时对齐见 `FLOW-RUNTIME-ROUTING`。

### MOD-FRONTEND-DELIVERY — 前端源码与部署产物交付

- **职责**：维护独立前端源码与本仓部署产物之间的 Source of Truth、构建和同步关系。
- **主要位置**：独立仓库 `MarSeventh/Sanyue-ImgHub`；本仓 `frontend-dist/`；流程说明 `docs/FRONTEND_DIST_SYNC.md`。
- **主要入口**：前端源码仓的 `src/`、`public/`、`public/index.html`；本仓的 `frontend-dist/index.html`、`frontend-dist/js/`、`frontend-dist/css/`。
- **核心协作**：前端源码 → 前端构建 `dist/` → 产物审查 → 本仓 `frontend-dist/` → Pages / Worker / Node.js 静态资源消费者。
- **主要依赖**：独立前端仓的 Vue 构建链。
- **主要消费者**：三种运行形态及 `MOD-AUTOMATION`。
- **稳定边界**：长期源码 Source of Truth 在独立前端仓；本仓不包含完整前端源码。导航热修复和随机 API 帮助脚本的源码位于前端仓 `public/`，本仓仅保存构建结果及对应 gzip 文件。
- **典型任务入口**：同步关系见 `FLOW-FRONTEND-SYNC`，详细 checklist 见 `docs/FRONTEND_DIST_SYNC.md`。

### MOD-AUTOMATION — 交付与仓库自动化

- **职责**：维护代码同步后的部署、镜像发布和跨仓 Release 同步。
- **主要位置**：`.github/workflows/`。
- **主要入口**：
  - `deploy-worker.yml`：仅 fork 仓库且配置 Cloudflare Secrets 时部署 Worker。
  - `docker-publish.yml`：仅原仓库 `MarSeventh/CloudFlare-ImgBed` 构建并推送多架构 Docker 镜像。
  - `sync-upstream.yml`：fork 仓库定时 / 手动同步上游，成功后触发 Worker 部署。
  - `sync-release.yml`：原仓库 Release 创建、发布或编辑时同步到 `MarSeventh/Sanyue-ImgHub`。
- **核心协作**：GitHub 事件 → 对应工作流 → `MOD-WORKER-RUNTIME`、`MOD-NODE-RUNTIME` 或外部前端仓。
- **主要依赖**：GitHub Actions、仓库 Secrets、Cloudflare 与 Docker Hub。
- **主要消费者**：fork 部署用户、原仓库镜像和 Release 维护流程。
- **稳定边界**：自动化文件定义触发条件和外部消费者；凭据只由 GitHub Secrets 注入。

## 4. 关键跨模块流程

### FLOW-RUNTIME-ROUTING — 三运行时请求路由

- **目的**：让同一套 Functions 路由和中间件在 Pages、Workers 与 Node.js 中保持共享业务语义。
- **触发 / 入口**：HTTP 请求或 Worker 路由生成。
- **参与模块**：`MOD-FUNCTIONS` → `MOD-WORKER-RUNTIME` / `MOD-NODE-RUNTIME`。
- **稳定主链路**：
  - Pages：平台直接按 `functions/` 目录映射路由。
  - Workers：`generate-routes.js` 扫描 Functions 并生成单入口路由表。
  - Node.js：loader 动态导入 Functions，由 Hono 组合路由和中间件。
- **关键交接**：目录级 `_middleware.js` 按层级组成链；`functions/api/_middleware.js` 负责数据库配置前置检查，`functions/api/manage/_middleware.js` 负责管理鉴权与管理响应缓存控制。
- **外部边界**：Cloudflare Pages / Workers 请求模型、Node.js / Hono。
- **典型影响范围**：Functions 路由形态、生成器、Node loader、中间件顺序与跨运行时测试。

### FLOW-UPLOAD — 上传与持久化

- **目的**：把上传请求安全地写入选定存储渠道，并同步元数据、索引和缓存。
- **触发 / 入口**：`functions/upload/index.js` 的普通上传、分块初始化、分块写入、合并或清理请求。
- **参与模块**：`MOD-FUNCTIONS` → `MOD-DATA`。
- **稳定主链路**：读取安全 / 渠道 / 页面配置 → 校验上传权限 → 规范化目标路径 → 写入选定存储 → 写入元数据与索引 → 失效相关 CDN、随机列表和公开列表缓存。
- **关键交接**：目标路径先经过 `sanitizeUploadFolder`；存储结果转换为统一文件元数据后进入数据库和索引。
- **外部边界**：Cloudflare R2、S3、Telegram、Discord、Hugging Face、WebDAV 与外链记录。
- **典型影响范围**：上传入口、存储适配、元数据、索引和缓存失效。

### FLOW-FILE-ACCESS — 文件读取与访问控制

- **目的**：按请求身份、分享授权和文件元数据状态返回文件或受限响应。
- **触发 / 入口**：`functions/file/[[path]].js`、公开列表、随机访问、管理预览或分享访问。
- **参与模块**：`MOD-FUNCTIONS` → `MOD-DATA`。
- **稳定主链路**：解析路径与请求上下文 → 读取元数据 / 存储位置 → 校验管理、公开或分享访问范围 → 应用 `ListType`、`Label` 与白名单策略 → 返回文件、阻止图或拒绝响应。
- **关键交接**：`functions/file/fileTools.js` 负责文件响应与访问检查；公开、管理和分享场景使用不同缓存策略。
- **外部边界**：存储渠道、HTTP Range / CORS / Content-Disposition / Cache-Control。
- **典型影响范围**：鉴权、分享 token、Block / Trash / adult 状态、缓存头和文件回退。

### FLOW-SHARE — 分享创建、管理与访问

- **目的**：以一个 token 表达单个或多个文件 / 目录目标，并在公开访问时解析可访问内容。
- **触发 / 入口**：`functions/api/manage/share/` 的创建、列表、撤销和删除；`functions/api/share/[[path]].js` 与 `functions/share/[[path]].js` 的公开访问。
- **参与模块**：`MOD-FUNCTIONS` → `MOD-DATA`。
- **稳定主链路**：管理端创建分享及 item → D1 / SQLite 写入 `share_links`、`share_link_items`，或 KV 写入分享 JSON → 公开请求校验 token 状态和目标范围 → 文件目标直接解析，目录目标按前缀在请求时解析当前内容。
- **关键交接**：数据适配层统一 D1 / SQLite、KV 和旧记录形态，公开入口先完成 token 校验再解析目标；历史兼容语义见 `MEM-003`。
- **外部边界**：管理端鉴权、公开分享页面和文件访问控制。
- **典型影响范围**：分享 schema、token 生命周期、动态目录、分享管理 UI 与 `FLOW-FILE-ACCESS`。

### FLOW-FILE-DELETION — 文件删除与强制本地清理

- **目的**：协调远端存储删除、本地元数据 / 索引 / 缓存清理及失败后的确认语义。
- **触发 / 入口**：`functions/api/manage/delete/[[path]].js` 的管理端删除请求。
- **参与模块**：`MOD-FUNCTIONS` → `MOD-DATA`，并由 `MOD-FRONTEND-DELIVERY` 提供确认交互。
- **稳定主链路**：读取文件元数据 → 调用对应存储删除 → 清理本站数据库、缓存与索引；可确认的外部删除失败会在本地清理前返回结构化结果，确认后再进入受限的异常清理路径。
- **关键交接**：异常清理只跨过被确认的外部删除步骤，错误分类和受保护语义见 `MEM-005`。
- **外部边界**：Telegram API、数据库、R2、缓存与管理前端。
- **典型影响范围**：管理删除 API、文件元数据、索引、缓存和前端确认。

### FLOW-FRONTEND-SYNC — 前端源码到部署产物

- **目的**：把独立前端仓的源码变更可靠同步为本仓可部署静态产物。
- **触发 / 入口**：前端界面、交互、`public/` 热修复脚本或样式发生变化。
- **参与模块**：`MOD-FRONTEND-DELIVERY` → `MOD-NODE-RUNTIME` / `MOD-WORKER-RUNTIME` / Pages。
- **稳定主链路**：修改独立前端源码 → 构建 `dist/` → 审查哈希文件和变更范围 → 同步 `frontend-dist/` → 保持相关 gzip 产物一致 → 由各运行时提供静态资源。
- **关键交接**：本仓 `frontend-dist/` 是构建结果，不反向成为长期源码 Source of Truth。
- **外部边界**：独立前端仓及其 Vue 构建工具链。
- **典型影响范围**：前端源码、构建产物、`index.html`、哈希资源、未哈希热修复资源和静态测试。

### FLOW-SCHEMA-EVOLUTION — 数据库结构演进

- **目的**：同时服务新安装和既有 D1 / SQLite 数据库。
- **触发 / 入口**：新增或修改表、列、索引或触发器。
- **参与模块**：`MOD-DATA` → `MOD-FUNCTIONS` / `MOD-NODE-RUNTIME`。
- **稳定主链路**：更新新库完整 schema → 增加旧库幂等迁移 → 必要时保留运行时防御性兼容 → 由 D1 与 SQLite 适配消费。
- **关键交接**：`database/init.sql` 描述当前新库结构；`database/migrations/` 描述旧库演进；`functions/utils/d1Database.js` 可为历史分享表补列或确保 item 表存在。
- **外部边界**：Cloudflare D1 与 SQLite；KV 模式不执行 SQL 迁移。
- **典型影响范围**：初始化 SQL、迁移文件、数据适配器、相关业务测试和迁移说明。

## 5. 核心数据、状态与 Source of Truth

| 数据 / 状态 | Owner | Source of Truth | 持久化位置 | 主要消费者 | 说明 |
|---|---|---|---|---|---|
| 文件元数据与索引 | `MOD-DATA` | 当前启用的数据库后端，经 `databaseAdapter` / `indexManager` 访问 | Cloudflare KV、D1 或 Node.js SQLite | `MOD-FUNCTIONS` | 文件内容与元数据分离 |
| 系统配置 | `MOD-FUNCTIONS` | 数据库中的配置记录，经 `functions/utils/sysConfig.js` 解释 | KV、D1 或 SQLite | 上传、访问、随机、前端公开配置 | 环境变量只作为兼容 / 运行输入，不替代已持久化配置语义 |
| 文件内容 | `MOD-DATA` | 当前记录指定的存储渠道 | R2、本地 R2 模拟或外部存储服务 | 上传、读取、删除 | 存储渠道与元数据通过文件记录关联 |
| 分享授权与目标集合 | `MOD-FUNCTIONS` | 分享记录及其 item | D1 / SQLite 的 `share_links`、`share_link_items`；KV 分享 JSON | 管理分享与公开分享 | 旧单目标字段仍是兼容读取来源 |
| Worker 路由表 | `MOD-WORKER-RUNTIME` | `functions/` 路由树与 `generate-routes.js` | `deploy/worker/index.js`（生成物） | Worker 部署 | 生成文件不是独立事实源 |
| 前端源码与部署产物 | `MOD-FRONTEND-DELIVERY` | 独立前端仓源码；本仓只保存经审查的部署快照 | 前端仓 `src/` / `public/`，本仓 `frontend-dist/` | Pages、Workers、Node.js | 源码和产物职责不可互换 |

## 6. 全局稳定架构边界

- 三种运行形态共享 `MOD-FUNCTIONS`；`MOD-NODE-RUNTIME` 与 `MOD-WORKER-RUNTIME` 不维护另一套业务规则。
- Worker 路由表与 `frontend-dist/` 都是派生产物，各自的 Source of Truth 分别是 Functions + 生成器、独立前端源码仓。
- `MOD-FUNCTIONS` 拥有系统配置和业务语义，`MOD-DATA` 拥有持久化 / 存储写入语义；二者通过适配器边界协作。
- SQL 新库结构、旧库迁移和运行时防御兼容是三个不同层次。
- `data/`、`.wrangler/`、Node.js 进程内 Cache 与本地 R2 / SQLite 是运行状态，不是版本化架构配置。

## 7. 维护与拆分

- 只在稳定职责、关系、Owner、Source of Truth、主要位置或关键流程变化时更新本文；任务历史、命令规则、临时错误和决策原因不进入 Context。
- 普通文件 / 目录移动不创建历史记录，也不因职责未变更换 `MOD-*` / `FLOW-*` ID；保存路径变化时直接更新为当前路径。
- 创建、替换或删除 `MOD-*` / `FLOW-*` 时，同步检查根 `AGENTS.md` 路由和 `docs/PROJECT_MEMORY.md` 的作用域 / 索引，避免孤儿引用。
- 默认保持一个根 Context；只有定向读取效率确实下降且模块拥有大量独立稳定知识时，才按 `PROJECT_AGENTS_WORKFLOW V2` 拆分。
