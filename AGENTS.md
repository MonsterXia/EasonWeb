# EasonWeb 代理协作说明

适用于本仓库。以当前源码、配置和用户本次需求为准；README、skill 中的版本和部署记录是历史证据，不代表当前线上状态。

## 开始工作

- 先检查 `git status --short`、`package.json` 和相关业务入口。保留已有未提交改动，不重置、覆盖或顺手清理无关文件。
- 使用中文沟通。说明实际修改、验证结果及尚未解决的问题；不要将计划执行的检查说成已经通过。
- 按任务读取下列项目 skill，只加载相关参考。用户已经明确授权的本地修改继续完成，不把普通实现选择拆成反复确认。
- 局部修改局部格式化，不运行全目录格式化制造无关差异。临时下载、分析数据和执行计划放仓库外；不提交真实账号资料或测试截图。

## Skill 入口

| 任务 | 使用说明 |
| --- | --- |
| Vue 页面、路由、认证、API、主题、国际化、本地运行和发布排查 | [easonweb-development](.agents/skills/easonweb-development/SKILL.md) |
| 终末地基质与养成计算器的版本同步、事实数据、素材、消耗与推荐排查 | [endfield-essence-data](.agents/skills/endfield-essence-data/SKILL.md) |
| 森空岛账号概览、角色资料、缓存、签到、头像及业务详情展示 | [skland-frontend](.agents/skills/skland-frontend/SKILL.md) |

“更新终末地两个计算器到最新版本”由 `endfield-essence-data` 在一次任务中处理数据、素材、来源、导入适配和验证。不要只更新基质武器表而遗漏养成消耗；也不要把公开目录更新扩展为私人账号练度或仓库同步。

## 项目结构

项目使用 Vue 3、TypeScript、Vite、Vue Router、Vue I18n、Element Plus 和 Axios；CommonServerAPI 是独立后端。

| 路径 | 职责 |
| --- | --- |
| `src/pages/`、`src/components/` | 页面与共享组件 |
| `src/router/` | 路由、认证返回地址与动态资源失败恢复 |
| `src/common/api/`、`src/common/gatewayManager/` | API 契约、校验、请求与错误分类 |
| `src/i18n/` | 中英文文案及语言偏好 |
| `src/assets/`、`public/theme.js`、`src/composables/useTheme.ts` | 语义样式、主题启动与切换 |
| `src/constant/game/hypergryph/endfield/catalog.json` | 两个计算器唯一的事实数据目录 |
| `src/common/endfieldResources.ts` | 计算器共享数据和素材入口 |
| `src/common/endfieldEssence.ts`、`src/common/endfieldGrowth.ts` | 基质推荐与养成计算 |
| `src/assets/skland/sources.json` | 本地游戏图片的来源与哈希清单 |
| `scripts/`、`tests/` | 导入／资源维护、Node 与 Playwright 回归 |

## 开发约定

- Vue 使用 `<script setup lang="ts">` 和 Composition API，源码别名为 `@/`。Element Plus 组件与图标在使用处具名导入，不全量注册。
- 遵循 `.oxfmtrc.json`：单引号、无分号。沿用既有依赖和共享组件，新增依赖应有具体需要。
- 新文案同时考虑 `zh-CN` 和 `en`；翻译只影响显示，不改变游戏事实 ID 或基质匹配词条。
- API 请求经过现有业务模块和共享 client，保留超时、取消信号、字段校验和错误语义。取消前端等待不代表服务端操作回滚。
- 保留有效的 `0`、`null` 和缺失值之间的区别；切换用户／角色或卸载后不能让旧响应覆盖新状态。
- 会话由 Cookie 管理。密码、第三方 token、真实游戏资料不写入浏览器持久存储、源码、日志或测试夹具。离线计算器的手动计划与库存沿用现有本地存储契约。
- 用户中心目前只展示鹰角账号管理；后端仍有 Post 管理员 API 不代表应恢复其前端入口。

## 界面与素材

- 沿用本站樱花主题及语义变量，检查明暗主题、中英文、320px 窄屏和长文本。主题状态通过 `public/theme.js`／`useTheme.ts` 管理，不另建页面级主题开关。
- 复用 `PageHeading.vue`、`EmptyState.vue`、`OverviewSelect.vue`、共享头像和适用的 `DialogConfirmButton.vue`。信息应紧凑且完整，避免重复卡片和同义操作。
- 弹窗关闭按钮保持现有统一尺寸。即时生效的编辑器不另加仅用于关闭的“完成”；有草稿的确认按钮仍须提交草稿，X／Escape 丢弃草稿。
- 下拉框、滚动区、按钮沿用现有主题组件和样式；检查短窗口中确认操作可达。键盘焦点使用已有边框／文字提示，不新增全局已移除的额外外圈。
- 游戏稀有度和属性保留语义颜色。图片与图标优先复用现有正式素材，不凭名称猜图；缺图保留文字回退，不阻止选择或计算。
- 新增本地游戏素材同步维护来源清单及哈希；通过既有资源入口引用，不为两个计算器各复制一套。

## 终末地数据约束

- `catalog.json` 统一保存干员、武器、材料、地区池、筛选枚举和经验折算。`index.ts` 派生类型与索引，`weapons.ts` 仅保留匹配与兼容导出；不要恢复旧的分散快照。
- 用稳定武器 ID 关联两计算器。名称、稀有度、武器类型只维护一份；基质字段放在实体的 `essence` 中，`essenceOrder` 保留列表顺序。
- 推荐覆盖必须同时满足地区主属性、副属性、技能池及最终定向组合，覆盖数与高亮共用同一结果。`attribute2: null` 表示已确认无副属性限制，不表示未知。
- 版本更新按 [完整同步流程](.agents/skills/endfield-essence-data/references/version-sync.md) 查新来源、适配固定版本导入器、更新已有条目和素材、维护来源与哈希；不可只改版本文字或数量断言。
- 数据来源和计算边界分别见 [共享资源说明](src/constant/game/hypergryph/endfield/README.md) 与 [养成说明](src/constant/game/hypergryph/endfield/GROWTH.md)。未核实字段和缺图须明确说明。

## 本地运行与验证

使用 `.nvmrc` 指定的 Node.js 24 和 npm；需要安装依赖时使用 `npm ci`，保持 `package-lock.json` 一致。

| 命令 | 用途 |
| --- | --- |
| `npm run dev -- --strictPort` | 本地开发，默认端口 5173 |
| `npm test` | `tests/*.test.js` 的 Node 回归 |
| `npm run type-check` | Vue／TypeScript 类型检查，包含 E2E TypeScript |
| `npm run build` | 类型检查与生产构建，输出 `dist/` |
| `npm run test:e2e` | Playwright 桌面及手机浏览器回归 |
| `npm run overview-assets:check` | 离线验证素材文件与来源哈希 |
| `npx oxfmt <修改的文件>` | 定向格式化；`npm run format` 会覆盖整个 `src/` |

开发服务器默认把同源 `/api` 代理到线上后端，真实短信、绑定、解绑和签到会产生线上效果；普通调试使用合成响应，不为验证页面随意触发这些操作。需要本地后端时，在不提交的 `.env.development.local` 设置 `DEV_API_BACKEND=local`，启动独立 CommonServerAPI 的 8787 端口并重启 Vite。细节见 [本地运行](.agents/skills/easonweb-development/references/local-debugging.md)。

- 逻辑、API 或数据改动运行相关 Node 回归和构建；按对应 skill 完成需要的完整检查。UI 改动还要检查实际布局和交互；纯文档／skill 修改检查结构、链接与命令即可。
- 浏览器测试复用 `tests/e2e/fixtures.ts` 的合成 API 和外网拦截。首次缺少浏览器时运行 `npx playwright install chromium`。
- E2E 独占 `http://localhost:4173`，自行构建到 `dist-e2e/` 并启动 preview；不要让开发进程占用该端口，不把该产物作为生产包。
- 素材变动运行资源检查；版本同步运行两个计算器的浏览器测试。具体测试入口见 [验证说明](.agents/skills/easonweb-development/references/testing.md)。
- 完成前检查 `git diff --check` 和本次差异。报告实际运行的检查；构建通过不等于真实上游、账号操作或生产部署已验证。

## 交付与发布

普通开发和文档维护不自动提交、推送、部署或执行后端迁移。用户要求发布时按 [发布流程](.agents/skills/easonweb-development/references/deployment.md) 完成本地验证，核对当前 Cloudflare Pages 配置、后端要求、目标提交和最终部署结果；推送可能触发 Git 集成部署，不将其当作无副作用的保存操作。
