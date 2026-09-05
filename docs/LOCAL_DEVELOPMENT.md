# 本地开发模式操作手册

本手册适用于同时开发 `CloudFlare-ImgBed` 后端和相邻的 `Sanyue-ImgHub` 前端源码。

## 1. 开发模式需要启动什么

文件管理、上传和系统设置等页面依赖后端 API，因此推荐同时启动两个服务：

| 服务 | 所在仓库 | 默认地址 | 用途 |
|---|---|---|---|
| 后端 | `CloudFlare-ImgBed` | `http://127.0.0.1:8080` | 提供 Functions API 和本地数据 |
| 前端 | 相邻目录 `..\Sanyue-ImgHub` | `http://localhost:3000` | 提供 Vue 热更新开发页面 |

日常修改前端界面时，浏览器应访问 `http://localhost:3000`。`8080` 是后端服务地址，同时提供当前 `frontend-dist` 快照，但不会自动显示尚未构建的前端源码修改。

## 2. 首次准备

确认两个仓库都已存在，并安装各自依赖。依赖已经安装时可跳过本节。

在 `CloudFlare-ImgBed` 根目录运行：

```powershell
npm ci
```

在 `Sanyue-ImgHub` 根目录运行：

```powershell
npm install
```

如果 PowerShell 因执行策略无法运行 `npm`，可将命令中的 `npm` 改为 `npm.cmd`。

## 3. 启动开发模式

打开两个 PowerShell 终端，并保持它们持续运行。

### 终端一：启动后端

在 `CloudFlare-ImgBed` 根目录运行：

```powershell
npm start
```

看到服务监听 `8080` 后保持该终端运行。本地 KV、D1 和 R2 等运行状态会写入本仓库的 `data/`，不要提交这些文件。

### 终端二：启动前端

在相邻的 `Sanyue-ImgHub` 根目录运行：

```powershell
npm run serve
```

前端配置会把 `/api` 请求代理到 `.env.development` 中的地址，当前为：

```text
http://127.0.0.1:8080
```

看到编译完成后，在浏览器打开：

```text
http://localhost:3000
```

管理登录页和文件管理页分别是：

```text
http://localhost:3000/adminLogin
http://localhost:3000/dashboard
```

未登录访问文件管理页时，前端会跳转到管理登录页。

## 4. 日常开发流程

1. 保持前端和后端两个终端运行。
2. 修改 `Sanyue-ImgHub/src/` 中的前端源码。
3. 保存文件后等待 Vue 自动重新编译。
4. 在 `http://localhost:3000` 刷新或查看热更新结果。
5. 继续调整时不运行 `npm run build`。
6. 页面效果确认后，如任务包含构建或同步部署产物，再按第 7 节执行。

仅修改后端 `functions/` 时，通常需要重新启动后端进程；前端进程可以继续保持运行。

## 5. 停止开发服务

在两个终端中分别按：

```text
Ctrl+C
```

确认终端重新出现命令提示符后，服务即已停止。

## 6. 常见问题

### 页面能打开，但接口请求失败

- 确认后端终端仍在运行且监听 `8080`。
- 确认 `Sanyue-ImgHub/.env.development` 中的 `VUE_APP_BACKEND_URL` 为 `http://127.0.0.1:8080`。
- 修改 `.env.development` 后需要重启前端开发服务。

### 修改源码后页面没有变化

- 确认访问的是 `http://localhost:3000`，不是 `http://127.0.0.1:8080`。
- 查看前端终端是否显示编译错误。
- 确认修改的是 `Sanyue-ImgHub/src/`，而不是本仓库的 `frontend-dist/`。

### 端口被占用

可在 PowerShell 中检查端口：

```powershell
Get-NetTCPConnection -LocalPort 3000,8080 -State Listen
```

关闭占用端口的旧开发进程后重新启动。实际访问地址以终端输出为准。

### 是否需要使用 Docker 后端

普通 Functions 和前端界面开发优先使用 `npm start`。只有需要验证 Docker / Node.js 适配行为时，才在后端仓库改用：

```powershell
npm run start:docker
```

## 7. 确认效果后的生产构建

构建与同步的适用条件见 [项目修改边界](../AGENTS.md#4-项目特有修改边界)。任务已包含对应交付要求时，在 `Sanyue-ImgHub` 根目录运行；同一源码状态已有构建结果时直接复用：

```powershell
npm run build
```

生产构建会压缩代码并生成哈希资源及对应 `.gz`，耗时明显长于热更新。构建和同步步骤见 [前端产物同步说明](FRONTEND_DIST_SYNC.md)。
