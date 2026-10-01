# EasonWeb

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

## CommonServerAPI 对接

建议使用 Node.js 24（`nvm use`）。`npm ci` 安装依赖，`npm test` 运行接口回归测试，
`npm run build` 执行类型检查和生产构建。

- 本地：先在 CommonServerAPI 启动开发服务（`npm run dev`，端口 8787），然后在本项目
  执行 `npm run dev`，访问 `http://localhost:5173`。`/api` 请求经 Vite 代理到后端。
  使用 localhost，避免 HTTP 自定义域名触发后端 Origin 校验。
- 生产：默认请求 `https://api.246801357.xyz`。可通过 `.env.production.local` 的
  `VITE_API_BASE_URL` 覆盖；该值在构建时生效。生产站点须符合后端允许的 HTTPS Origin，
  并与 API 同站点，才能使用 SameSite Cookie。
- 所有请求携带 Cookie，超时 10 秒。普通用户会话为 HttpOnly `auth_token`，与 Post
  管理员的 `post_auth_token` 独立；不从 localStorage 读取 JWT。
- 根路径健康检查直接返回 `{ message }`；业务接口返回 `{ message, data, httpStatus }`。
  用户页读取 `GET /user/current` 的 `data`，401/404 显示未登录，其他失败允许重试。
  退出调用 `POST /user/logout`，成功后清除页面资料；失败保留当前状态。

账号流程已补齐：
- `/login`：用户名、密码登录，成功后进入用户中心。
- `/register`：用户名占用检查、邮件验证码、密码校验；注册成功恢复 Cookie 会话。
- `/reset-password`：用户名与邮箱匹配、验证码验证、新密码设置，成功后重新登录。
- `/user`：个人资料，鹰角短信/密码登录和绑定/解绑，Post 管理员验证与绑定/解绑。
- `/game/hypergryph/skland`：读取已绑定鹰角账号的游戏角色，手动执行签到，展示成功和失败明细。

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
