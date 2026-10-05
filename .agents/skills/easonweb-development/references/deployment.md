# Cloudflare Pages 发布与排查

仅在发布或部署排查时读取。本文平台配置来自 README 和已有 skill 的 2026-10-04 历史核对记录，本次代码文档同步未重新查询远端；发布前重新确认当前项目配置、目标提交和部署结果。

## 发布链路与历史配置


- 本仓库 `MonsterXia/EasonWeb` 使用 **Cloudflare Pages Git 集成**，Pages 项目名为 `easonweb`。代码推送到符合控制台分支规则的 GitHub 分支后，由 Cloudflare 构建、部署并回传 `Cloudflare Pages` 检查；沿用这条发布链路。GitHub 出现部署检查不代表使用了 GitHub Actions，不因补充测试而默认新增 Actions 或 Wrangler 直传部署流程。
- 已核实的历史依据：2026-10-04 查询时，GitHub Actions 工作流和运行记录均为 0；`main` 提交 `e608f1b` 的[部署检查](https://github.com/MonsterXia/EasonWeb/runs/111130466093)由 `cloudflare-workers-and-pages` 应用报告成功。后续排查读取目标提交的 `/repos/MonsterXia/EasonWeb/commits/{sha}/check-runs`，按应用、提交 SHA、结果及详情链接确认对应发布；不要仅查询 commit statuses，Pages 结果可能只在 check runs 中。
- 2026-10-04 通过 Cloudflare 项目 API 核实：生产分支 `main`，自动生产部署开启，预览范围为全部分支；根目录为仓库根目录，构建命令 `npm run build`，输出目录 `dist`，生产与预览均无项目级环境变量。正式域名 `https://eason.246801357.xyz`，Pages 域名 `https://easonweb.pages.dev`。发布前读取项目配置确认未变；以 Cloudflare 控制台 **Workers & Pages → easonweb → 构建设置**或项目 API 的当前值为准。
- `.nvmrc` 指定 Node.js 24，实际构建版本以 Cloudflare 日志为准。当前线上 `npm run build` 包含类型检查与打包，不自动执行测试；可建议改为 `npm test && npm run build`，但不要描述为已启用。浏览器回归按 [验证入口](testing.md) 单独执行，不假设 Cloudflare 已安装 Chromium。`VITE_API_BASE_URL` 在构建时生效，生产和预览环境需分别核对；不要将 E2E 专用 `/api` 配置用于生产包。
- 生产 API 的 Origin 规则允许 HTTPS `*.246801357.xyz`，不包含 `*.pages.dev`。已在浏览器核实：Pages 预览请求 `/user/current` 被 CORS 拦截，而正式域名的匿名请求返回可读取的 401 并展示登录入口。预览用于静态页面、路由、计算器验证；真实账号接口在正式域名或已配置的允许域名验证，不把预览 CORS 拒绝误判为这次前端回归，也不为预览擅自放宽生产后端规则。
- 用户授权发布时，完成相应本地验证并核对 README 中的后端升级要求，再提交／推送目标改动到工作分支，跟踪该提交的 Cloudflare 检查与预览部署并验证；预览通过后将已验证提交合入并推送 `main`，再次核对生产部署 SHA、结果与正式域名。远端已前进时先整合和验证，不强制覆盖。推送会按分支规则触发部署；普通代码修改、文档维护不自动执行发布，也不自动执行独立 CommonServerAPI 的数据库迁移。
- 维护流程及当前证据见仓库根目录 `README.md` 的“Cloudflare Pages 构建与部署”；平台行为参见 [Git 集成](https://developers.cloudflare.com/pages/configuration/git-integration/)与[构建配置](https://developers.cloudflare.com/pages/configuration/build-configuration/)。实际排障以最新记录和控制台配置为准。

## 页面资源与主题脚本

- `src/router/chunkRecovery.ts` 只识别动态模块 / CSS 加载错误；在线且存储可用时，先写 `eason-chunk-reload-at` 再导航到目标 `fullPath`。60 秒限额是当前标签页共用的，不按路由分别计数。普通异常、离线或存储失败交给国际化提示，不循环刷新。
- `public/_headers` 对 `/`、`/index.html`、`/theme.js`、游戏路径和已知账号入口设置 `Cache-Control: no-cache`，未给所有文件设置 no-store。新增直接访问入口时核对缓存规则，保留带哈希静态资源缓存。
- `vite.config.ts` 的 `version-theme-bootstrap` 在 build 时将 `public/theme.js` 的 SHA-256 前 12 位加到脚本 URL 查询参数；主题启动脚本更新需要重新构建。
- 部署后同时检查直接访问和 SPA 导航、路由元信息、明暗主题首屏；账号 API 的验证还受部署域名与 Cookie / CORS 限制。

构建和测试的区别见 [验证入口](testing.md)，本地代理见 [本地运行](local-debugging.md)。普通文档维护不自动提交、推送、修改 Cloudflare 配置或执行后端迁移。
