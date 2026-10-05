---
name: easonweb-development
description: 用于 EasonWeb 的 Vue 页面、导航与认证、CommonServerAPI 接口、主题和国际化开发，以及本地调试、回归测试和 Cloudflare Pages 发布排查。森空岛业务展示与基质数据更新另有专用 skill。
---

# EasonWeb 项目开发

中文个人站点与游戏工具前端，使用 Vue 3、TypeScript、Vite、Vue Router、Vue I18n、Element Plus 和 Axios；CommonServerAPI 为独立后端。以下路径均相对仓库根目录。按当前工作区源码维护，既有未提交代码也属于核对依据；README 的历史服务验证不代表当前线上状态。

## 按任务读取

先看 `git status --short`、`package.json` 和实际业务入口，保留已有工作。主文档负责共享约定，细节只读取相关参考：

| 任务 | 源码入口 / 参考 |
| --- | --- |
| 页面、导航、登录后返回、404 | `src/router/routes.ts`、`src/router/index.ts`、`src/components/Navigator.vue`；[路由与认证](references/routing-auth.md) |
| 登录、注册、重置密码、用户与绑定 | `src/pages/auth/AuthPage.vue`、`src/pages/user/userPage.vue`、`src/components/account/AccountBindings.vue`；[路由与认证](references/routing-auth.md) |
| API 方法、校验、错误分类、超时 | `src/common/api/`、`src/common/gatewayManager/`；[接口契约](references/api-contracts.md) |
| 本地启动、生产/本地后端切换、Cookie 代理 | `vite.config.ts`、`src/common/config/domain.ts`；[本地运行](references/local-debugging.md) |
| 布局、主题、空状态、响应式 | `src/App.vue`、`src/assets/`、`public/theme.js`、`src/composables/useTheme.ts`；[界面规范](references/ui-design.md) |
| 文案、语言偏好、日期与数字 | `src/i18n/`；[国际化](references/i18n.md) |
| 森空岛数据、概览组件、图片、签到 | [skland-frontend](../skland-frontend/SKILL.md)；[显示规则与历史来源](references/skland-data.md) |
| 终末地本地基质计算器、武器与淤积点 | [endfield-essence-data](../endfield-essence-data/SKILL.md)；`src/pages/game/hypergryph/endfield/` |
| 选择回归命令、构造合成资料 | [验证入口](references/testing.md) |
| Cloudflare 构建、部署与旧资源恢复 | [发布与排查](references/deployment.md) |

## 开发约定

- Vue 使用 `<script setup lang="ts">`、Composition API 与 `@/` 源码别名。Element Plus 组件和图标在使用处具名导入；动态 `:is` 传组件对象。`src/main.ts` 只安装 i18n 和 router，不全量注册 UI 组件；全局样式顺序是 Element Plus、其暗色变量、站点 `main.css`。
- 页面在 `src/pages/`，懒加载路由定义在 `routes.ts`；导航是 `Navigator.vue` 的 `links` 配合 `router-link`，选中态和 `aria-current` 取 `route.path`。新增页面同时考虑路由元信息和登录返回白名单。
- 页面标题复用 `PageHeading.vue`；登录、未绑定、空数据和失败状态复用 `EmptyState.vue`。保留加载、正常内容、局部操作失败和整页错误的区别。视觉沿用樱花粉轻量轨道主题、语义颜色、手机布局及中英文词条。
- 认证请求参考 `AuthPage.vue` 的参数快照、AbortController 与过期结果判定；不要把取消浏览器等待描述为回滚服务端操作。倒计时复用 `useCooldown`。
- API 调用经业务模块、共享 client、gateway 和 Axios。保持 Cookie 认证、运行时字段校验和原始错误语义；密码、第三方 token 与会话不写入浏览器持久存储、URL 或日志。
- 用户中心只展示鹰角账号管理。Post 管理员 API / 响应类型仍保留，但 UI 当前隐藏；后端有字段不代表应恢复入口。
- 森空岛按角色内存缓存、资源时钟、未知值和旧响应兼容由专用 skill 维护。基质计算器离线使用本地常量，无需登录；显示翻译不改变匹配用的中文规范值。
- `.oxfmtrc.json` 使用单引号、无分号；历史格式并不完全统一。局部任务不要运行全目录格式化制造无关差异。

## 运行与交付

使用 `.nvmrc` 指定的 Node.js 24、npm 和 `package-lock.json`。需要安装依赖时运行 `npm ci`；`npm run dev` 默认以同源 `/api` 代理线上后端，仅选择 `DEV_API_BACKEND=local` 才需要本地 8787 后端。

`npm test` 运行 `tests/*.test.js` 全部 Node 回归；`npm run build` 并行做类型检查与生产构建。浏览器回归独立执行 `npm run test:e2e`，使用 `dist-e2e/` 与专用 4173 端口。按 [验证入口](references/testing.md) 选择与改动有关的检查，不把构建成功当成交互或真实上游验证。

仅改 skill / 说明时校验结构、相对链接、源码事实和命令即可。交付说明实际变化、实际运行的验证及未验证范围。Superpowers 等临时执行计划保存在仓库外；普通开发或文档维护不自动发布。发布请求按 [发布与排查](references/deployment.md) 核对当前授权、目标提交与后端升级要求。
