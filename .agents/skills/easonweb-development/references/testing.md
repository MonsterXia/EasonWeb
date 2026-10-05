# 验证入口与测试边界

依据 `package.json`、`playwright.config.ts` 与当前 `tests/`。在仓库根目录使用 Node.js 24（`.nvmrc`）；按实际改动选验证。仅文档 / skill 更新校验内容和链接即可，不为此重跑全部应用测试。

## 命令

| 命令 | 实际用途 |
| --- | --- |
| `npm ci` | 需要时按 package-lock 安装依赖 |
| `npm run dev -- --strictPort` | 开发服务器；默认代理线上 API，见 [本地运行](local-debugging.md) |
| `npm test` | Node 内置运行器执行 `tests/*.test.js`，不递归执行 Playwright |
| `node --test tests/navigation.test.js tests/chunk-recovery.test.js` | 定向执行相关 Node 测试的示例 |
| `npm run type-check` | `vue-tsc --build`，包含 app 与 node 项目；node 项目覆盖 E2E TS |
| `npm run build` | 并行类型检查与 Vite 生产打包，默认输出 dist |
| `npm run build-only` | 只打包，不含类型检查 |
| `npm run preview` | 预览已有产物，不提供 dev 的线上代理改写 |
| `npx playwright install chromium` | 首次缺少浏览器时安装；按宿主环境补系统依赖 |
| `npm run test:e2e` | 桌面 / Pixel 7 手机项目，均用 Chromium |
| `npm run test:e2e -- tests/e2e/auth.spec.ts --project=desktop` | 定向浏览器回归示例 |
| `npm run overview-assets:check` | 离线核对本地概览图片、元数据与哈希 |

`npm run format` 会格式化整个 src，局部需要时用 `npx oxfmt <修改的文件>`。没有 lint 或 Vitest npm script；tsconfig 中兼容配置文件通配符不代表安装了这些测试框架。

## 按改动定位测试

| 改动 | Node 回归 | 浏览器回归（tests/e2e/） |
| --- | --- | --- |
| API、认证、绑定、错误边界 | `api.test.js`、`api-boundary.test.js`、`skland-cache.test.js` | `auth.spec.ts`、`skland.spec.ts` |
| 路由、登录返回、动态资源 | `navigation.test.js`、`chunk-recovery.test.js` | `navigation.spec.ts`、`auth.spec.ts` |
| dev 代理与 Cookie | `dev-proxy.test.js` | 如需真实联调，单独说明账号和环境 |
| 主题、语言、组件按需导入 | `theme.test.js`、`i18n.test.js`、`components.test.js` | `layout.spec.ts`、`overview-style.spec.ts` |
| 基质数据与匹配 | `endfield-materials.test.js` | 计算器添加、去重、删除和语言切换按实际页面验证 |
| 森空岛缓存、时钟、日常、分组 | `skland-cache.test.js`、`resource-recovery.test.js`、`daily-status.test.js`、`overview-metrics.test.js`、`overview-sections.test.js` | `skland.spec.ts`、`overview-metrics.spec.ts`、`overview-performance.spec.ts` |
| 签到反馈 | `check-in.test.js`、`api-boundary.test.js` | `check-in.spec.ts`、`skland.spec.ts` |
| 图片、干员档案与业务详情 | `operatorAvatars.test.js`、`overview-assets.test.js`、`endfield-text.test.js` | 具体文件见 [森空岛 skill](../../skland-frontend/SKILL.md)；目录已有图片、记录、帝江号、地区建设、丰碑、战争回响、光荣之路和动画场景 |

API 或认证变更运行相关回归及 build；数据变更检查匹配和业务边界；UI 变更还需浏览器检查布局、交互、明暗主题与中英文。320px 窄屏和长英文可揭示默认手机尺寸覆盖不到的溢出。

## 合成响应与执行环境

- 多数 Node 测试通过 Vite `createServer({ configFile: false, ... })` / `ssrLoadModule` 加载 TS；API 测试替换共享 Axios adapter。沿用真实模块，不在测试里重写一份算法。
- `components.test.js` 在没有全局组件注册时 SSR 渲染页面并检查未解析组件 / 图标，提供主题桥替身。SSR 通过不能证明浏览器动画、布局或真实账号联调成功。
- Playwright `webServer` 自动执行 build-only 到 `dist-e2e/`，构建时强制 `VITE_API_BASE_URL=/api`，再以 strictPort 启动 `http://localhost:4173` 的 preview，`reuseExistingServer: false`。勿占用该端口或把 dist-e2e 当作生产产物；E2E 自带构建不代替 type-check。
- `tests/e2e/fixtures.ts` 的 test fixture 拦截 API、阻止外部网络并收集 pageerror；新增普通场景沿用该入口。`tests/fixtures/` 保存终末地详情合成数据，不能加入真实账户导出或凭证。
- 失败 trace / 截图写入忽略的 `test-results/`，可用 `npx playwright show-trace <trace.zip>` 检查。CI 环境配置只控制 retries/workers/forbidOnly，不能据此宣称仓库已有 CI 工作流。
- 构建成功、合成接口通过和 Cloudflare 部署成功是不同证据。邮件、短信、第三方上游与生产域名权限须分别验证；历史 README 记录不是本次执行结果。
