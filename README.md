# EasonWeb

基于 Vue 3 + TypeScript 的个人站点与游戏工具，支持中英文、浅色／深色及跟随系统主题。包含用户中心、鹰角账号管理、森空岛角色概览与签到，以及终末地基质和养成计算器。

技术栈：Vite、Vue Router、Vue I18n、Element Plus、Axios。账号和森空岛业务由独立的 CommonServerAPI 后端提供。

## 功能与入口

| 功能 | 路径 | 说明 |
| --- | --- | --- |
| 首页 | `/` | 站点介绍与工具导航 |
| 基质计算器 | `/game/hypergryph/endfield` | 选择武器，按主属性、副属性和技能掉落池推荐地图与定向组合 |
| 养成计算器 | `/game/hypergryph/endfield?tool=growth` | 规划干员及武器培养，汇总材料、扣除手动库存和折算低阶经验材料 |
| 森空岛 | `/game/hypergryph/skland` | 查看明日方舟／终末地角色资料与签到结果，需要登录并绑定鹰角账号 |
| 用户中心 | `/user` | 个人资料、鹰角账号绑定、更新登录与解绑 |
| 账号入口 | `/login`、`/register`、`/reset-password` | 登录、注册、密码重置及登录后返回原工具 |

两个计算器无需登录，共用本地数据与素材入口。基质覆盖数与武器高亮来自同一份实际可行的定向方案；养成支持等级、突破、装备适配、技能专精、天赋前置联动及配套武器。养成计划可恢复本浏览器最近 90 天内的 5 次计算，库存需手动填写，尚未接入游戏练度和仓库同步。干员头像仍使用官方 CDN，加载失败时保留文字。

森空岛签到支持全部角色、当前角色和失败重试，按角色展示状态与奖励。只有一个角色或一项失败时合并重复操作；超时显示结果待确认。签到结果仅保存在页面内存中，不是持久签到历史。

## 快速开始

使用 [.nvmrc](.nvmrc) 指定的 **Node.js 24** 和 npm。在仓库根目录执行：

```sh
# 使用 nvm 时先运行 nvm use
npm ci
npm run dev -- --strictPort
```

默认访问 `http://127.0.0.1:5173`，以 Vite 输出地址为准。`--strictPort` 在端口被占用时直接报错，避免自动换端口后仍查看旧页面。

开发模式默认通过 Vite 代理连接线上 CommonServerAPI，无需另外启动后端。本地页面需要重新登录；本地与正式站点的 Cookie 不共享，`localhost` 与 `127.0.0.1` 也使用不同 Cookie。通过此代理提交短信、绑定、解绑或签到会作用于线上账号。

### 后端与环境变量

| 配置 | 默认值／用途 |
| --- | --- |
| `DEV_API_BACKEND=production` | 开发服务器将同源 `/api` 代理到 `https://api.246801357.xyz` |
| `DEV_API_BACKEND=local` | 开发服务器将 `/api` 代理到 `http://localhost:8787`，需启动独立 CommonServerAPI |
| `VITE_API_BASE_URL` | 浏览器 API 地址；开发配置为 `/api`，生产默认 `https://api.246801357.xyz`，构建时生效 |

同时开发后端时，在被 Git 忽略的 `.env.development.local` 中设置：

```dotenv
DEV_API_BACKEND=local
```

保留 `VITE_API_BASE_URL=/api`，重启 Vite 并重新登录；设置为 `production` 即切回线上。不要覆盖本机文件中的其他配置。生产 API 地址可通过 `.env.production.local` 或构建环境设置。

线上代理仅在 Vite 开发服务器生效：校验本地同源请求，改写上游 Origin／Referer 与本地 Cookie 属性。生产构建和 `npm run preview` 不启用这组代理改写。配置和排查顺序见 [本地运行说明](.agents/skills/easonweb-development/references/local-debugging.md)。

## 常用命令与验证

| 命令 | 用途 |
| --- | --- |
| `npm run dev -- --strictPort` | 启动本地开发服务器 |
| `npm test` | 执行 `tests/*.test.js`：接口、缓存、主题、国际化、计算与资源回归 |
| `npm run type-check` | Vue／TypeScript 检查，包含浏览器测试代码 |
| `npm run build` | 并行类型检查与生产构建，输出 `dist/` |
| `npm run build-only` | 仅构建，不做类型检查 |
| `npm run preview` | 预览已有构建产物 |
| `npm run test:e2e` | Playwright 桌面与手机回归 |
| `npm run overview-assets:check` | 离线校验本地游戏图片、来源清单与哈希 |
| `npm run overview-assets:sync` | 按已有固定来源清单重取图片；不自动发现新版本素材 |
| `npx oxfmt <文件路径>` | 定向格式化；`npm run format` 会格式化整个 `src/` |

首次运行浏览器测试需要安装 Chromium：

```sh
npx playwright install chromium
npm run test:e2e
```

只检查终末地两个计算器：

```sh
npm run test:e2e -- tests/e2e/endfield-growth.spec.ts tests/e2e/endfield-essence-selection.spec.ts --workers=4
```

Playwright 独占 `http://localhost:4173`，自动构建到 `dist-e2e/` 并启动 preview；请勿占用该端口。桌面与 Pixel 7 项目均使用 Chromium。测试使用合成 API 响应并拦截外部网络，不发送真实验证码、不操作真实绑定或签到；头像回退通过不代表官方图片网络已验证。

失败截图和 trace 保存在被忽略的 `test-results/`，可用 `npx playwright show-trace <trace.zip>` 查看。`dist-e2e/` 仅用于回归，不能作为生产发布产物。构建成功、合成回归通过和真实上游联调是不同验证结果。

按改动选择测试及环境说明见 [验证入口](.agents/skills/easonweb-development/references/testing.md)。纯文档或 skill 修改只需核对内容、路径、命令和差异，无需重跑应用测试。

## 项目结构

```text
src/
  pages/                         页面与游戏工具
  components/                    共享 UI、账号及游戏组件
  router/                        路由、返回地址与动态资源恢复
  i18n/                          中英文文案
  common/
    api/                         API 契约、响应校验与错误分类
    gatewayManager/              共享 Axios 请求层
    endfieldResources.ts         双计算器数据与素材入口
    endfieldEssence.ts            基质匹配与推荐
    endfieldGrowth.ts             养成消耗与经验折算
    endfieldGrowthHistory.ts      本地计划恢复
  constant/game/hypergryph/endfield/
    catalog.json                 统一游戏事实数据
    index.ts                     类型、ID 索引与数据投影
    sources.json                 版本、来源、数量与哈希
  assets/skland/                 本地游戏素材及来源清单
public/                         主题启动脚本、静态资源与缓存配置
scripts/                        数据导入和素材维护脚本
tests/                          Node 回归、合成数据与 E2E
.agents/skills/                 项目维护流程
```

## 双计算器数据与版本同步

两个计算器只维护一份 [catalog.json](src/constant/game/hypergryph/endfield/catalog.json)。武器以稳定 ID 关联，名称、稀有度和类型共用；同条记录保存基质词条及养成消耗。地区池、材料、筛选枚举、经验折算也在统一目录中。页面通过 [endfieldResources.ts](src/common/endfieldResources.ts) 获取数据和图片，素材不重复复制。

数据快照的实装范围、固定来源和版本以 [sources.json](src/constant/game/hypergryph/endfield/sources.json) 为准，不能将仓库快照直接视为当前游戏最新数据。各领域可能使用不同来源版本，核对记录分别保存。

在支持项目 skill 的代理中，可用一次请求同步两个计算器：

> 请使用 $endfield-essence-data，将基质计算器和养成计算器的全部数据及素材同步到最新已实装版本，并完成验证。

也可以指定版本号。该流程包含来源核对、目录与图片更新、导入适配、中英文显示、哈希记录和两个工具的回归；上游缺失项会单独列出。

- [共享数据与来源说明](src/constant/game/hypergryph/endfield/README.md)
- [养成规则、素材来源与导入方式](src/constant/game/hypergryph/endfield/GROWTH.md)
- [完整版本同步流程](.agents/skills/endfield-essence-data/references/version-sync.md)
- [游戏素材清单](src/assets/skland/sources.json)与[资源说明](src/assets/skland/README.md)

`scripts/import-endfield-growth.py` 是固定版本的养成导入器，`overview-assets:sync` 按固定清单重取图片；直接运行旧脚本不会自动完成新版本的全量同步。

## 账号、缓存与请求边界

CommonServerAPI 在独立仓库运行，前端通过 `src/common/api/` 和共享请求层访问。会话使用 Cookie，密码和第三方 token 不写入浏览器持久存储；用户中心目前只展示鹰角账号管理，Post 管理员接口封装仍保留但无 UI 入口。

森空岛角色列表与概览按用户和绑定身份隔离，在标签页内存中缓存 5 分钟，并复用进行中的请求。退出、登录或绑定变化成功后清理缓存；刷新浏览器会清空缓存。页面切换或取消等待会忽略过期响应，但不代表已到达后端的操作回滚。

接口边界保留有效的零值与 null，并区分未登录、账号权限、上游故障、限流、网络失败与异常响应。具体契约见 [API 说明](.agents/skills/easonweb-development/references/api-contracts.md)，签到语义见 [签到反馈](.agents/skills/skland-frontend/references/check-in.md)。

## Cloudflare Pages 构建与部署

项目已有 Cloudflare Pages Git 集成发布流程。代码推送可能触发预览或生产部署，具体分支规则和环境变量需在发布时核对。仓库不附带 GitHub Actions 工作流；不能根据 Cloudflare 部署成功推断单元测试或 E2E 已执行。

构建使用 Node.js 24、`npm run build`，产物目录为 `dist/`；这个命令包含类型检查与打包，不包含 `npm test` 或浏览器回归。生产 API 地址在构建时决定，不能将 E2E 的 `/api` 构建配置用于生产包。

已有部署资料记录 Pages 项目为 `easonweb`，正式域名为 `https://eason.246801357.xyz`、Pages 域名为 `https://easonweb.pages.dev`。这些是历史配置；当前平台设置、目标提交和部署结果应重新核对。历史联调中 Pages 域名没有生产 API 的 CORS 权限，静态预览可用不代表账号接口可用。

发布前完成相关本地验证，核对后端兼容性，发布后检查对应提交 SHA 的 Cloudflare 检查、日志和实际页面。操作步骤与历史证据见 [发布与排查](.agents/skills/easonweb-development/references/deployment.md)。普通开发和文档维护不自动发布。

### 后端升级要求

密码重置功能依赖 CommonServerAPI 中的 `migrations/0006_password_reset.sql` 和对应后端实现。若部署环境尚未包含该升级，需在后端仓库确认并完成迁移及部署，再发布依赖它的前端；已升级环境无需因前端更新重复执行迁移。邮件、鹰角短信和森空岛接口还依赖各自上游配置与服务。

### 页面缓存

`public/_headers` 对已知 HTML 入口及主题启动脚本配置 `Cache-Control: no-cache`；Vite 构建为 `theme.js` 添加内容哈希参数。遇到动态模块／CSS 加载错误时，在线且存储可用的标签页在 60 秒内最多自动恢复一次，限额由该标签页所有路由共用；其他错误显示重试提示。

## 协作与维护

代理协作总入口为 [AGENTS.md](AGENTS.md)。项目 skill 按职责划分：

| Skill | 范围 |
| --- | --- |
| [easonweb-development](.agents/skills/easonweb-development/SKILL.md) | 页面、路由、认证、API、主题、国际化、本地运行及发布 |
| [endfield-essence-data](.agents/skills/endfield-essence-data/SKILL.md) | 基质与养成计算器的数据、素材和统一版本同步 |
| [skland-frontend](.agents/skills/skland-frontend/SKILL.md) | 森空岛账号概览、角色资料、缓存、签到和业务展示 |

Vue 使用 Composition API，Element Plus 组件及图标局部具名导入。格式遵循 `.oxfmtrc.json` 的单引号和无分号；页面改动兼顾中英文、明暗主题与窄屏。详细规范由 AGENTS 和相关 skill 维护，避免在多个文档重复保存同一套细则。

## 许可与素材

项目代码采用 [MIT License](LICENSE)。游戏名称、数据、角色与武器图片等内容的权利归鹰角网络及相关权利人；项目代码许可不改变这些内容的权属。数据与图片的具体来源分别记录在目录说明和素材清单中。
