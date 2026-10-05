# 森空岛数据流、缓存与状态

2026-10-05 对照当前工作区源码整理。用于 API 错误、请求竞态、旧响应兼容、资源计时、刷新和性能问题；路径均相对仓库根目录。后端公式与来源见 [显示规则](../../easonweb-development/references/skland-data.md)，签到协议见 [签到反馈](check-in.md)。

## 从症状定位

| 症状／任务 | 当前实现入口 | 现有回归 |
| --- | --- | --- |
| 身份、账号排序、角色切换、整页／局部刷新 | `src/pages/game/hypergryph/SklandPage.vue`、`src/common/gameAccountOrder.ts`、`src/common/gameServers.ts` | `tests/e2e/skland.spec.ts`、`tests/api.test.js` |
| 缓存过期、绑定变更、请求复用和取消 | `src/common/sklandCache.ts`、`src/common/api/accounts.ts`、`src/common/api/user.ts` | `tests/skland-cache.test.js` |
| 畸形响应、角色串线、HTTP 错误分类 | `src/common/api/client.ts`、`validation.ts`、`errors.ts` | `tests/api-boundary.test.js` |
| 理智／无人机计时、九项日常、六项基建 | `src/common/resourceRecovery.ts`、`dailyStatus.ts`、`overviewMetrics.ts` | `tests/resource-recovery.test.js`、`tests/daily-status.test.js`、`tests/overview-metrics.test.js` |
| 旧响应分组合并、顺序、重复记录 | `src/common/overviewSections.ts`、`src/components/game/OverviewLiveDetails.vue` | `tests/overview-sections.test.js` |
| 数据刷新重排、每秒渲染开销、日期格式 | `GameOverviewPanel.vue`、`OverviewLiveDetails.vue`、`src/composables/useOverviewFormat.ts` | `tests/e2e/overview-performance.spec.ts` |

## API 边界

`gameAccountsAPI` 和 `gameOverviewAPI` 的超时是 `ACCOUNT_REQUEST_TIMEOUT=60000`，可传 AbortSignal；签到单独为 120 秒。`client.ts` 先用 `responseData` 取响应对象自己的 `data` 槽，不依赖 message/httpStatus 的内容判断业务结果。`validation.ts` 校验必要字段，允许未知附加字段；不做类型转换，也不把畸形字段自动改为 null。非法类型、非有限数、角色 appCode/gameId/uid 不匹配会抛 `ApiResponseError`。使用 timestamp 校验器的日期还检查可表示范围；部分嵌套日期当前只用 nullable(number)，以具体 schema 为准，不宣称所有日期都完成范围校验。不能将畸形成功响应当空数据。

可选、可空必须分清：`sections` 可以省略但不能为 null；`operators` 必需且可为 null 或数组；`warEchoes`／`monolith`／`regionalDevelopment`／`gloryRoad` 可以省略但顶层不能为 null。图片字段在边界只按字符串形状检查，官方地址允许范围由图片入口的 `officialArtworkUrl` 处理；非法图片不应导致有效数据被隐藏。

## 加载和错误显示

- 页面账号加载、角色概览加载、签到各有独立状态。`SklandPage` 将原始错误放在 shallowRef，`apiError` 由 computed 随语言切换重新生成；不要提前缓存翻译字符串。
- 概览 `ApiFailureKind` 在 `errors.ts` 分为 session(401)、authorization(403)、rateLimit(429)、upstream(502)、network(无 HTTP 响应)、invalidResponse(边界解析失败)、unavailable(其他)。401 显示带返回路径的登录入口；403／502 引导 `/user` 管理绑定；所有错误仍保留角色标题和刷新按钮。
- 同角色刷新时保留旧 `overview` 对象，加载中显示骨架；`GameOverviewPanel` 的数据区用 `v-show="!loading && !failed"` 隐藏，失败后显示错误状态，不继续显示旧数据。DOM 留存有助于保留分组选择，但不等于用户可见。角色切换会先清空旧角色概览。
- 上述整份概览请求失败，与终末地嵌套 `detailAvailable=false` 不同：后者仍是合法概览，在模块内显示不可用提示并保留已知摘要。签到异常则保留已有签到报告，单独显示错误。
- `load(true)` 刷新角色列表会清空角色/概览缓存和签到报告，成功后恢复仍存在的已选角色；概览刷新仅 force 指定角色。强刷失败不会复活被清理的缓存。卸载取消账号与概览未完成请求；签到没有 AbortSignal，靠 alive 阻止卸载后写页面状态。

## 数据与状态

- 通过 `GET /game/hypergryph/account/overview` 读取已绑定角色，查询参数为 `appCode`、`uid`、`gameId`；Cookie 身份由后端校验，客户端不传第三方凭证。角色唯一键同时包含这三个字段。
- 账号列表通过 `src/common/gameAccountOrder.ts` 稳定排序：明日方舟优先、终末地其次，未知游戏排后；同游戏保持上游角色顺序。首次打开默认选第一个角色，刷新时保留仍存在的已选角色，不修改缓存原数组。
- 森空岛定位为游戏小工具集合，首页入口使用“小工具”，角色资料、日常进度与签到是并列能力，不将入口写成“前往签到”。
- `src/common/sklandCache.ts` 在内存中缓存角色列表和概览 5 分钟，以网站用户 ID、鹰角手机号和绑定更新时间隔离；概览键包含 appCode/gameId/uid。进入页面仍重新校验当前网站身份；不将角色数据或凭证写入持久存储。
- 切换角色命中缓存时立即展示；复用同角色正在进行的请求，版本号阻止旧结果覆盖新选择。切换不取消其他角色的加载，完成后可供返回时复用；卸载取消未完成请求、保留已完成缓存。刷新账号清空缓存，刷新角色资料只强制更新选中角色。登录/注册/密码重置、退出及绑定变更成功后清空缓存；失败不清空。
- 资料加载与签到保持独立状态；结构化结果、按角色重试及旧响应兼容见 [签到反馈](check-in.md)。选中项、标题及刷新按钮原位保留，骨架仅替换数据内容。缓存与身份失效的回归在 `tests/skland-cache.test.js`、`tests/api.test.js`。
- `GameOverview` 是后端整理后的展示契约。`updatedAt` 表示上游游戏记录时间，`fetchedAt` 表示本次读取时间，均为秒；`calculatedAt` 是上游计算时钟。不得把读取时间冒充同步时间。明日方舟理智、无人机仅按后端已核实的 `recovery` 基线在内存中随时间更新（`resourceRecovery.ts`），保持五分钟缓存、禁止每秒轮询；终末地仅显示上游 `curStamina`，不可套用方舟的六分钟规则。
- 两个游戏的字段与公式来源见 [森空岛显示规则](../../easonweb-development/references/skland-data.md)。设施、探索、活动使用可折叠分组；零上限探索显示横线。办公室可刷新状态与精确刷新次数分开，干员档案数（含形态）与去重收藏数分开。新增字段须同步后端 OpenAPI、中英文和边界回归。
- 数字 `0` 是有效值，`null` 显示缺失状态；日常与基建紧凑指标卡不显示进度条；其他已有进度条仅在当前值存在、上限大于 0 时展示。允许理智超上限，文字保留真实值，已有进度条最多填满。
- 方舟基建概况沿用官方六项名称与顺序：无人机、休息进度、订单进度、制造进度、干员疲劳、线索收集。`overviewMetrics.ts` 复用会客室详情 `arknightsClues.items[id=board]` 的 current/total 补齐线索卡（不是 own 库存），缺失保留 null，不增加请求、不修改缓存。使用已有 `ak-icon-meeting` 官方图标；规则仅用于方舟，未知指标保留在后。
- 方舟日常状态固定展示官方九项和顺序，由 `dailyStatus.ts` 复用现有计数与详情生成训练室、公招刷新等状态卡；说明与倒计时规则见显示规则文档。保全采用用户确认的每月16日北京时间04:00实际刷新时间。
- 收藏与养成、日常、基建和干员档案的布局见 UI 风格文档。终末地 `profile.level` 显示权限等阶，`worldLevel` 显示探索等级；字段语义与布局分别按对应参考维护。干员与任务名称保留游戏原文，其余词条与日期格式同步中英文。
- 上游字段与来源见 CommonServerAPI 的项目 skill；不要从签到响应推导资源或伪造资料。浏览器验证至少包含角色切换的响应竞态、缺失值、局部失败恢复及刷新时工具栏可见。


## 计时与渲染边界

`gameOverviewAPI` 成功校验后调用 `rememberOverview`。接收时间使用以 `toRaw(data)` 为键的 WeakMap；`overviewTime` 从 calculatedAt（缺省 fetchedAt）加接收后经过秒数，命中缓存不重新记时。`metricCurrent` 只消费已有 recovery 基线，对 null、非正上限、已满／超上限或缺基线保持原值；不在前端重新模拟上游房间生产。

一秒定时器与 visibilitychange 的 tick 位于 `OverviewLiveDetails`，卸载清理。它只更新内存展示，绝不每秒请求后端；账号概览用 shallowRef，静态身份、干员和日期格式化不随资源 tick 重算。`useOverviewFormat` 按 locale 复用 Intl 格式器，日期以浏览器时区显示；日常重置时间计算单独使用北京时间规则。回归 `tests/e2e/overview-performance.spec.ts` 检查资源增长而静态档案未重复格式化。

`overviewSections` 只生成展示副本：办公室／训练室保留 sourceSection；集成战略按主题 ID 合并收藏品和投资；试炼按已识别期数降序；终末地探索按地区复合 ID 合并六类。`endfieldSections` 补入旧 cnsLevel，再由专用组件承接新嵌套对象。修改合并顺序时保留空组、部分缺失与未知项，不能原地排序缓存数组。
