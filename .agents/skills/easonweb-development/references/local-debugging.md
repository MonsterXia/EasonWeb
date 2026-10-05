# 本地运行与后端对接

本文只记录项目启动、后端选择和代理联调；业务展示规则与调参方法放在对应业务 skill。路径相对于仓库根目录。配置依据为 `vite.config.ts`、`.env.development`、`src/common/config/domain.ts`；调整流程时先核对源码，不把历史验证结果当作当前服务状态。

## 启动与后端切换

使用 `.nvmrc` 指定的 Node.js 24 和 npm。首次运行先执行 `npm ci` 安装依赖；依赖已安装时直接运行：

```sh
npm run dev -- --strictPort
```

默认访问 `http://127.0.0.1:5173`（命令本身不自动打开浏览器）。浏览器请求同源 `/api`，由本地 Vite 转发，默认不需要启动 CommonServerAPI。

| `DEV_API_BACKEND` | 代理目标 | 使用场景 |
| --- | --- | --- |
| `production`（默认） | `https://api.246801357.xyz` | 用线上账号数据检查本地页面 |
| `local` | `http://localhost:8787` | 同时开发 CommonServerAPI，需先启动该后端 |

共享默认值在 `.env.development`。个人切换在被 Git 忽略的 `.env.development.local` 中设置：

```env
DEV_API_BACKEND=local
```

改为 `production` 即切回线上；配置变化后重启开发服务。保留其他已有本机配置，不整文件覆盖。两种模式都保持 `VITE_API_BASE_URL=/api`，不要将浏览器 API 地址改成线上绝对 URL 来绕过代理。启动进程的同名环境变量优先于 env 文件，切换未生效时一并检查。

默认线上模式监听 `127.0.0.1`，本地后端模式监听 `localhost`；以 Vite 输出地址为准。已有预览服务可复用；需重启时确认其进程属于当前项目，不为抢占端口结束不相关服务。`--strictPort` 防止自动换端口后仍查看旧页面。

## 登录与代理边界

- 本地页面需要重新登录，Cookie 不与正式站点共享。`localhost` 与 `127.0.0.1` 也不是同一个 Cookie 主机，调试期间固定使用同一地址。
- 切换后端后重新登录，避免沿用另一环境的 Cookie 或页面内存缓存；账号资料刷新沿用页面现有操作。
- 线上代理先校验入站请求来自 loopback 同源页面，再将上游 Origin/Referer 改为正式前端地址。响应移除 Cookie Domain，并为 HTTP 本地预览移除 Secure；保留 HttpOnly、SameSite、有效期和退出清除行为。不要打印或复制真实会话 Cookie。
- 该转换仅在 Vite dev 的线上代理模式生效；生产构建和 `vite preview` 不启用这组改写，不修改线上后端 CORS 或正式 Cookie 策略。`npm run preview` 不是本地联调代理的替代命令。
- 线上代理连接真实生产环境，提交操作会作用于线上数据。

## 排查顺序与验证

1. 确认当前页面地址和 Vite 输出端口一致，Network 中请求落在本机 `/api/...`。若直连线上域名，检查 `VITE_API_BASE_URL` 和启动环境覆盖。
2. 未登录时 `/api/user/current` 返回可读 JSON 和 HTTP 401 是正常结果，说明请求已到后端；不能当作 CORS 错误，也不代表已验证登录态。
3. 403 若响应包含 `Local API proxy only accepts same-origin loopback requests`，检查访问主机与 Origin 是否一致；不要关闭来源校验。若响应来自上游，检查服务端权限及代理配置。
4. Vite 出现连接拒绝时先检查后端模式：本地模式确认 8787 服务运行；线上模式检查网络及线上 API 可达性。登录后仍未认证则检查浏览器是否接受本地主机的 HttpOnly Cookie，不输出 Cookie 值。

按改动运行已有验证：

```sh
node --test tests/dev-proxy.test.js
npm run build
```

代理测试使用合成上游验证环境切换、来源保护、Cookie 转换及退出清除，不代表真实账号登录已验证。仅修改 skill 时检查结构、相对链接与配置一致性，无需重跑应用测试。

本地调试不自动触发提交、推送或部署；发布沿用 [Cloudflare Pages 流程](deployment.md) 及当前用户授权。测试 preview 与生产产物的区别见 [验证入口](testing.md)。
