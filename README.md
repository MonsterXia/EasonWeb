# EasonWeb

Vue 3 + TypeScript 的个人站点与游戏工具，包含用户中心、鹰角账号管理、森空岛角色资料与签到、终末地基质计算器，支持中英文与明暗主题。

## 开发与验证

使用 Node.js 24，执行 `npm ci` 安装锁定依赖。

- `npm run dev`：本地开发。
- `npm test`：接口契约、国际化、主题、头像资源及组件渲染回归。
- `npm run build`：类型检查与生产构建。
- `npm run preview`：预览构建产物。

页面在 `src/pages/`，共享组件在 `src/components/`；Element Plus 组件及图标局部具名导入，公共样式仍由入口加载。业务 API 用 `src/common/api/client.ts` 解开响应，传递取消信号和请求选项。项目约定见 [.agents/skills/easonweb-development/SKILL.md](.agents/skills/easonweb-development/SKILL.md)。

## CommonServerAPI 对接

建议使用 Node.js 24（`nvm use`）。`npm ci` 安装依赖，`npm test` 运行接口回归测试，
`npm run build` 执行类型检查和生产构建。

- 本地：先在 CommonServerAPI 启动开发服务（`npm run dev`，端口 8787），然后在本项目
  执行 `npm run dev`，访问 `http://localhost:5173`。`/api` 请求经 Vite 代理到后端。
  使用 localhost，避免 HTTP 自定义域名触发后端 Origin 校验。
- 生产：默认请求 `https://api.246801357.xyz`。可通过 `.env.production.local` 的
  `VITE_API_BASE_URL` 覆盖；该值在构建时生效。生产站点须符合后端允许的 HTTPS Origin，
  并与 API 同站点，才能使用 SameSite Cookie。
- 所有请求携带 Cookie，默认超时 10 秒，账号提交、角色列表和角色资料查询为 60 秒。普通用户会话为 HttpOnly `auth_token`，与 Post
  管理员的 `post_auth_token` 独立；不从 localStorage 读取 JWT。
- 根路径健康检查直接返回 `{ message }`；业务接口返回 `{ message, data, httpStatus }`。
  用户页读取 `GET /user/current` 的 `data`，401/404 显示未登录，其他失败允许重试。
  退出调用 `POST /user/logout`，成功后清除页面资料；失败保留当前状态。

账号流程已补齐：
- `/login`：用户名、密码登录，成功后进入用户中心。
- `/register`：用户名占用检查、邮件验证码、密码校验；注册成功恢复 Cookie 会话。
- `/reset-password`：用户名与邮箱匹配、验证码验证、新密码设置，成功后重新登录。
- `/user`：个人资料与鹰角账号状态，通过管理弹窗进行绑定、更新登录与解绑。Post 管理员功能暂不在客户端展示。
- `/game/hypergryph/skland`：森空岛小工具，查看角色日常、基建与养成资料，也可手动签到并查看结果。

密码及第三方 token 不写入浏览器持久存储。鹰角 token 保存在 CommonServerAPI 中；
客户端只接收公开资料。Post 操作先验证管理员账号，再使用两种 Cookie 执行绑定或解绑。
终末地本地计算器保持独立，无需用户登录。

基质计算器的武器、淤积点快照及官方／开源数据来源见[数据维护说明](src/constant/game/hypergryph/endfield/README.md)。
后续更新可使用项目 skill [`endfield-essence-data`](.agents/skills/endfield-essence-data/SKILL.md)。

### 后端升级要求

部署本版本前，CommonServerAPI 必须先执行 `migrations/0006_password_reset.sql`，
再部署对应后端和前端。该迁移新增用户会话版本及密码重置挑战表。
本地后端运行 `npx wrangler d1 migrations apply common-server-db --local`；
生产迁移在发布时使用 `--remote`，本次开发未执行生产迁移或部署。

密码重置验证码有效期 5 分钟，每个挑战最多 5 次错误尝试；未过期时重复请求不会重复发信。
重置成功后旧会话失效。邮件依赖后端 Resend 配置，鹰角短信和森空岛操作依赖对应上游服务。

验证：`npm test` 覆盖接口契约；`npm run build` 包含 Vue/TypeScript 检查。
浏览器测试已覆盖登录注册、密码重置、绑定/解绑、签到 207 部分失败及手机布局。
外部邮件、短信与游戏平台使用测试响应；真实账号上的投递和签到需在发布验证时确认。

## 页面缓存与路由恢复

森空岛角色列表与游戏概览在当前标签页内存中缓存 5 分钟，按登录用户与鹰角绑定隔离。
切换角色复用已有结果和正在进行的请求；离开页面后保留已完成缓存，重新进入仍会校验登录身份。
“刷新游戏账号”重新获取列表和资料，“刷新角色资料”只更新当前角色。
退出、登录或绑定关系变更成功时清除缓存；刷新浏览器后缓存也会消失，不写入浏览器持久存储。
首次读取每个角色仍需等待森空岛上游响应。

路由动态资源加载失败时，针对目标页面最多自动恢复一次（60 秒内）；其他错误显示重试提示。
`public/_headers` 禁止 HTML 无校验复用，避免部署后旧入口持续引用被替换的资源。
依据 [Vite 动态导入错误说明](https://vite.dev/guide/build.html#load-error-handling)。

## 自动回归与导航

- 使用 `.nvmrc` 指定的 Node.js 24。`npm test` 执行接口、缓存、数据和组件回归；`npm run build` 同时检查应用与浏览器测试的 TypeScript 类型。
- 首次运行浏览器测试先执行 `npx playwright install chromium`，然后运行 `npm run test:e2e`。测试独占 `http://localhost:4173`，自动将测试版本构建到 `dist-e2e/` 并启动、关闭 Vite Preview；桌面和手机项目使用 Chromium。测试构建将 API 地址设为 `/api` 供拦截，不改变正常生产构建的 API 配置。
- 浏览器测试覆盖认证请求期间离开页面、验证码迟到响应、登录后返回工具、404、语言与主题、角色切换、异常响应和 HTTP 207 部分签到失败。所有 API 使用合成响应，外部请求被拦截，不会发送真实验证码、绑定账号或签到。
- 失败时截图与 trace 保存在忽略提交的 `test-results/`；通过 `npx playwright show-trace <trace.zip>` 查看交互记录。
- 这些测试命令可在本地执行；仓库没有配置 GitHub Actions 自动检查。Cloudflare 是否执行测试取决于项目控制台中的构建命令，不能仅凭部署成功认定回归测试已通过。

认证页在路由切换或卸载后取消等待并忽略旧结果；取消浏览器请求不代表服务端已经执行的登录、注册或邮件发送会回滚。返回地址仅允许已知站内工具与用户页，认证模式切换保留返回入口。未知地址展示 404，游戏父路径跳转到终末地工具；页面标题与描述随当前路由和语言同步。

API 边界校验用户资料、角色列表、角色概览和签到结果的必要字段，保留有效的零值和 null。概览区分本站登录失效、账号权限、上游不可用、网络故障、限流和异常响应；页面提供对应的登录、账号管理或刷新入口。HTTP 状态仍由后端决定，前端不把第三方故障解释成未登录。

## Cloudflare Pages 构建与部署

现有发布流程由 Cloudflare Pages 的 Git 集成承接：GitHub 保存代码，推送触发 Cloudflare 构建与部署，结果通过 GitHub 的 `Cloudflare Pages` 检查回传。生产和预览分支的触发范围由 Cloudflare 控制台设置决定，参见[官方 Git 集成说明](https://developers.cloudflare.com/pages/configuration/git-integration/)。

2026-10-04 核对远端仓库时，GitHub Actions 工作流与运行记录均为 0；`main` 提交 `e608f1b` 的 [Cloudflare Pages 检查](https://github.com/MonsterXia/EasonWeb/runs/111130466093)由 `cloudflare-workers-and-pages` 应用回报部署成功，对应 Pages 项目 `easonweb`。这是该提交的部署记录，不代表本地未提交改动已发布。

2026-10-04 进一步通过 Cloudflare API 核实：生产分支为 `main`，已启用自动生产部署；预览分支规则为全部分支。构建根目录为仓库根目录，实际构建命令为 `npm run build`，输出目录为 `dist`；生产与预览均未配置项目级环境变量。正式域名为 `https://eason.246801357.xyz`，Pages 域名为 `https://easonweb.pages.dev`。发布时先运行本地验证，再推送到目标分支，核对该提交 SHA 对应的 Cloudflare 检查和部署日志，最后验证部署地址；预览通过后再将已验证提交合入并推送 `main`。

Node.js 版本由仓库 `.nvmrc` 指定为 24，实际构建所用版本以 Cloudflare 日志为准。当前线上构建命令执行类型检查与打包，没有自动运行单元测试或浏览器回归。可将构建命令改为 `npm test && npm run build`，让单元测试失败也阻止发布；这仍是建议，本次未修改平台配置。浏览器回归另行运行 `npm run test:e2e`，需要预先安装 Chromium 及其系统依赖；`dist-e2e/` 只用于测试，不是发布目录。具体配置方式见[Cloudflare 构建配置](https://developers.cloudflare.com/pages/configuration/build-configuration/)。
