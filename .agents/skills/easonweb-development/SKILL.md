---
name: easonweb-development
description: 用于 EasonWeb 仓库的 Vue 页面开发、界面设计与空状态、主题适配、国际化、路由与导航调整、CommonServerAPI 接口对接、用户认证和账号绑定、森空岛签到、终末地计算器维护及 Cloudflare Pages 部署排查。仅在本项目相关开发、排错、代码审查和发布工作中使用。
---

# EasonWeb 项目开发

本项目是中文个人站点与游戏工具前端，使用 Vue 3、TypeScript、Vite、Vue Router、Element Plus 和 Axios。后端 CommonServerAPI 是独立项目。本 skill 的路径均相对于仓库根目录，具体行为以当前源码为准。

## 开始工作

先读 `package.json`、`src/router/index.ts`、相关业务文件与 `git status --short`。`README.md` 包含运行方式与后端对接信息；与源码不一致时核对实际实现。保留已有未提交工作，围绕本次请求修改。

## 代码入口

| 修改内容 | 入口及关联文件 |
| --- | --- |
| 应用布局、全局组件注册 | `src/App.vue`、`src/main.ts` |
| 路由、顶部菜单 | `src/router/index.ts`、`src/components/Navigator.vue` |
| 首页 | `src/pages/home/IndexPage.vue` |
| 登录、注册、重置密码 | `src/pages/auth/AuthPage.vue`，同一组件按路由切换模式 |
| 用户资料、退出、账号绑定 | `src/pages/user/userPage.vue`、`src/components/account/AccountBindings.vue` |
| 森空岛角色概览与签到 | `src/pages/game/hypergryph/SklandPage.vue`、`src/components/game/GameOverviewPanel.vue`、`src/common/api/gameOverview.ts` |
| 终末地计算器 | `src/pages/game/hypergryph/endfield/EndfieldPage.vue`、同目录 `BaseMaterialCalculator.vue` |
| 武器与地区数据、类型 | `src/constant/game/hypergryph/endfield/weapons.ts` |
| API 封装与响应类型 | `src/common/api/basic.ts`、`user.ts`、`accounts.ts` |
| HTTP 客户端、URL、环境配置 | `src/common/gatewayManager/`、`src/common/config/domain.ts`、`vite.config.ts` |
| 国际化与语言切换 | `src/i18n/`、`src/components/Navigator.vue`、[国际化约定](references/i18n.md) |
| 统一空状态与设计规范 | `src/components/EmptyState.vue`、[界面与空状态规范](references/ui-design.md) |
| 验证码倒计时 | `src/composables/useCooldown.ts` |
| 全局样式与颜色变量 | `src/assets/main.css`、`src/assets/base.css`、`src/assets/light.css` |
| 接口回归测试 | `tests/api.test.js` |

Vue 模板页、欢迎组件与未使用的 Pinia counter store 已移除。业务页面从 `src/pages/` 与实际路由入口追踪。

## 页面与交互约定

- 使用 `<script setup lang="ts">`、Composition API 和 `@/` 源码别名；复用 Element Plus 组件。Element Plus 组件及图标在使用它们的组件中具名导入，不在 `src/main.ts` 全量注册。动态 `:is` 直接传导入的组件，不用依赖全局注册的字符串名称。公共 Element Plus 样式仍在入口统一导入，以保持主题覆盖顺序。
- 路由组件采用动态导入。新增页面按需同步路由与导航；菜单的 `index` 使用路由路径，当前选中项来自 `route.path`。
- 界面支持中英文；新增文案同时维护两种词条，表单标签及无障碍标签也要翻译。沿用局部 scoped 样式。保留加载、空数据、未登录、失败重试等不同状态；异步按钮防止重复提交。
- 用户资料加载参考 `userPage.vue` 的 AbortController 及过期响应检查。倒计时复用 `useCooldown`，保留组件卸载时的定时器清理。
- `.oxfmtrc.json` 约定单引号、不使用分号。历史文件格式不完全统一，避免为局部任务格式化整个仓库。

## 界面设计规范

涉及视觉、空状态、主题或响应式修改时，先读 [界面与空状态规范](references/ui-design.md)。沿用樱花粉配色的轻量轨道主题（暖白浅色、深梅紫深色），复用语义颜色、现有图标与共享组件；明确标题、说明和操作层级。

- 未登录、未绑定、无数据及加载失败统一使用 `EmptyState.vue`，通过 `kind` 和 `actions` 插槽区分场景；不要恢复默认 `el-result` / `el-empty` 的灰色大图标样式。
- 保留加载、正常数据、局部错误与整页失败的区别。适配桌面横排、手机竖排及明暗主题，验证实际按钮跳转与重试恢复。
- Post 管理员功能尚未确定上线：前端保持隐藏关联信息、登录绑定表单及解绑入口。后端接口或响应类型仍存在不代表应展示该功能；仅在用户明确要求上线时恢复。

## 国际化

修改界面文案、反馈提示或语言行为时，先读 [国际化约定](references/i18n.md)。使用 Vue I18n 的 `t()` / 全局 `tr()`，维护中英文词条、命名插值和响应式反馈；语言切换保留表单与业务状态。游戏数据的规范标识及第三方内容不随显示语言改写。

## 接口与认证约定

调用链为页面/组件 → `src/common/api/*` → `gatewayManager` → 共享 Axios 客户端。新增业务请求放入适当的 API 模块，使用 `buildStandardURL`，不要在页面硬编码域名或另建遗漏 Cookie 配置的客户端。

- `domain.ts` 优先使用构建时的 `VITE_API_BASE_URL`；默认开发地址为 `/api`，生产地址为 `https://api.246801357.xyz`。
- Vite 将 `/api` 代理到 `http://localhost:8787` 并移除前缀。本地使用 `http://localhost:5173`，注意后端 Origin 校验与生产 SameSite Cookie 条件。
- Axios 设置 `withCredentials: true`，默认超时 10 秒；`accounts.ts` 的公共 POST 封装与游戏账号查询单独使用 60 秒。调整时按接口判断，不要将默认超时误当作所有请求的实际值。
- 网关返回 Axios 的 `response.data`，即响应体；不会自动解开业务层的 `data`。`src/common/api/client.ts` 的 `getData` / `postData` 统一解开 `ApiResponse<T> = { message, data, httpStatus }`，保留 false/null、取消信号及原始 HTTP 错误。账号长请求使用 `ACCOUNT_REQUEST_TIMEOUT`；健康检查无业务 envelope，直接使用网关。
- 普通会话使用 HttpOnly `auth_token`，Post 管理员使用独立的 `post_auth_token`。保持 Cookie 认证，不将密码、JWT 或第三方 token 写入浏览器持久存储、URL 查询参数或日志。
- 仅 `getCurrentUserAPI` 将 HTTP 401/404 映射为 `null`；其他故障继续抛出供页面展示重试。不要将此规则扩展到所有 API。退出成功后清除用户资料，退出失败保留当前资料。
- `accounts.ts` 仍保留 Post API 封装，但当前页面不调用。鹰角账号绑定或解绑成功后由 `changed` 事件触发父页面刷新资料。
- 注册与重置密码复用 `passwordError`：至少 6 字符、最多 72 个 UTF-8 字节，并含大小写字母及实现支持的特殊字符；不要把字节上限改成字符上限。字段和验证规则以 `accounts.ts` 为准。
- 森空岛签到由用户手动触发，分别展示 `checkInResults` 和 `errorResults`；HTTP 207 部分成功也要呈现失败明细。

新增接口时先确认后端契约，不根据页面需求猜测 URL、方法或字段。后端不可用时使用测试响应，说明尚未验证的真实服务行为。

## 森空岛角色概览

涉及森空岛游戏数据、角色排序、缓存、头像或概览图片时，使用 [森空岛前端数据与资源 skill](../skland-frontend/SKILL.md)。该 skill 集中维护前端入口、官方资料核对、静态资源来源与同步、主题适配和验证流程；两游戏字段公式在其引用的显示规则中维护。

## 终末地计算器

涉及基质计算器数据过期、新武器、淤积点、属性或掉落池更新时，使用 [终末地基质数据维护 skill](../endfield-essence-data/SKILL.md)。

计算器使用本地武器和地区常量，不依赖登录。修改数据时检查 `WeaponData`、`WeaponBaseMaterialRegion` 及计算器匹配逻辑：`attribute2` 可为 `null`，武器名称用于选择与去重。

武器与地区使用统一的基质词条，`weaponMatchesRegion` 直接比较规范值：攻击提升、法术伤害提升、源石技艺提升、终结技充能效率提升。调整命名时同时检查数据与匹配处，不要只修改显示文本导致匹配失效。来源提交、哈希与更新流程见 `src/constant/game/hypergryph/endfield/README.md` 和同目录 `sources.json`；数据回归见 `tests/endfield-materials.test.js`。新增或更新游戏数据应有用户提供或核实过的来源。

## 开发与验证

在仓库根目录运行；Node 版本优先遵循 `.nvmrc`（当前为 24），包管理使用 npm 和 `package-lock.json`。

| 命令 | 用途 |
| --- | --- |
| `nvm use` | 已安装 nvm 时切换项目 Node 版本 |
| `npm ci` | 需要安装依赖时按锁文件安装 |
| `npm run dev` | 启动前端；真实联调需另行启动 CommonServerAPI |
| `npm test` | Node 内置测试运行器执行接口契约回归 |
| `npm run type-check` | Vue / TypeScript 类型检查 |
| `npm run build` | 并行执行类型检查与生产构建 |
| `npm run build-only` | 仅 Vite 构建，不能代替类型检查 |
| `npm run preview` | 预览构建产物 |
| `npm run test:e2e` | Playwright 桌面与手机 Chromium 回归；首次运行前安装 Chromium 及所需系统依赖 |

`npm run format` 会格式化整个 `src/`；局部编辑需要格式化时可用 `npx oxfmt <修改的文件>`。当前未配置 lint 或 Vitest，不假设存在。Playwright 配置在 `playwright.config.ts`，测试使用合成 API 响应，构建到 `dist-e2e/` 并独占本地 4173 端口；该目录不能用于发布。

按改动选择验证：

- 修改 API 或认证逻辑：运行 `npm test` 与 `npm run build`。现有接口测试用 Vite `ssrLoadModule` 加载 TS，并替换共享 Axios adapter；扩展契约测试时沿用此方式，覆盖方法、路径、请求体、响应与错误语义。
- 修改页面、路由或计算逻辑：运行 `npm run build`，验证对应页面流程。账号页检查失败重试和重复提交；签到检查部分失败；计算器检查添加、去重、删除和属性筛选；布局检查窄屏。
- 仅修改说明或 skill：检查结构、引用路径与源码事实，无需为此重跑全部应用测试。

测试响应不证明邮件、短信或第三方游戏服务真实可用；README 中历史验证记录也不等于本次验证。交付时说明实际修改、已执行的检查及尚未验证的部分。涉及部署时再核对 README 的后端迁移要求，不在普通前端修改中自动执行数据库迁移或发布。

- 组件按需引入的回归见 `tests/components.test.js`：在无全局组件注册时渲染真实页面，检查未解析组件和图标。SSR 测试提供主题桥接替身，不能替代浏览器交互、布局或真实账号联调。

## Cloudflare Pages 部署

- 本仓库 `MonsterXia/EasonWeb` 使用 **Cloudflare Pages Git 集成**，Pages 项目名为 `easonweb`。代码推送到符合控制台分支规则的 GitHub 分支后，由 Cloudflare 构建、部署并回传 `Cloudflare Pages` 检查；沿用这条发布链路。GitHub 出现部署检查不代表使用了 GitHub Actions，不因补充测试而默认新增 Actions 或 Wrangler 直传部署流程。
- 已核实的历史依据：2026-10-04 查询时，GitHub Actions 工作流和运行记录均为 0；`main` 提交 `e608f1b` 的[部署检查](https://github.com/MonsterXia/EasonWeb/runs/111130466093)由 `cloudflare-workers-and-pages` 应用报告成功。后续排查读取目标提交的 `/repos/MonsterXia/EasonWeb/commits/{sha}/check-runs`，按应用、提交 SHA、结果及详情链接确认对应发布；不要仅查询 commit statuses，Pages 结果可能只在 check runs 中。
- 2026-10-04 通过 Cloudflare 项目 API 核实：生产分支 `main`，自动生产部署开启，预览范围为全部分支；根目录为仓库根目录，构建命令 `npm run build`，输出目录 `dist`，生产与预览均无项目级环境变量。正式域名 `https://eason.246801357.xyz`，Pages 域名 `https://easonweb.pages.dev`。发布前读取项目配置确认未变；以 Cloudflare 控制台 **Workers & Pages → easonweb → 构建设置**或项目 API 的当前值为准。
- `.nvmrc` 指定 Node.js 24，实际构建版本以 Cloudflare 日志为准。当前线上 `npm run build` 包含类型检查与打包，不自动执行测试；可建议改为 `npm test && npm run build`，但不要描述为已启用。浏览器回归按上节单独执行，不假设 Cloudflare 已安装 Chromium。`VITE_API_BASE_URL` 在构建时生效，生产和预览环境需分别核对；不要将 E2E 专用 `/api` 配置用于生产包。
- 生产 API 的 Origin 规则允许 HTTPS `*.246801357.xyz`，不包含 `*.pages.dev`。已在浏览器核实：Pages 预览请求 `/user/current` 被 CORS 拦截，而正式域名的匿名请求返回可读取的 401 并展示登录入口。预览用于静态页面、路由、计算器验证；真实账号接口在正式域名或已配置的允许域名验证，不把预览 CORS 拒绝误判为这次前端回归，也不为预览擅自放宽生产后端规则。
- 用户授权发布时，完成相应本地验证并核对 README 中的后端升级要求，再提交／推送目标改动到工作分支，跟踪该提交的 Cloudflare 检查与预览部署并验证；预览通过后将已验证提交合入并推送 `main`，再次核对生产部署 SHA、结果与正式域名。远端已前进时先整合和验证，不强制覆盖。推送会按分支规则触发部署；普通代码修改、文档维护不自动执行发布，也不自动执行独立 CommonServerAPI 的数据库迁移。
- 维护流程及当前证据见仓库根目录 `README.md` 的“Cloudflare Pages 构建与部署”；平台行为参见 [Git 集成](https://developers.cloudflare.com/pages/configuration/git-integration/)与[构建配置](https://developers.cloudflare.com/pages/configuration/build-configuration/)。实际排障以最新记录和控制台配置为准。

## 部署后的页面加载

- 动态路由资源可能在发布后失效。`src/router/chunkRecovery.ts` 仅对明确的动态模块/CSS 加载错误恢复到目标地址，sessionStorage 时间戳限制一分钟内最多自动恢复一次；离线、普通业务异常或存储不可用时展示国际化错误提示，不循环刷新。
- `public/_headers` 对 HTML 与页面入口设置 `Cache-Control: no-cache`，保留带哈希静态资源的缓存。发布后验证直接打开和 SPA 点击两种方式，不能仅凭首页可打开认定所有路由可用。

## 中间过程与提交

Superpowers plan 等执行计划保存在仓库外（例如 `/tmp/eason-legacy-refactor/`），不创建在项目目录、不提交。持久维护的开发约定、测试和项目文档可随代码提交。
