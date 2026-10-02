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
