# 森空岛签到反馈

适用于明日方舟与终末地的全部角色签到、选中角色签到、奖励展示及失败重试。2026-10-05 对照当前工作区整理；路径相对仓库根目录。签到由用户手动触发，不作为只读概览验证或页面加载的副作用。

## 入口与请求

- `src/pages/game/hypergryph/SklandPage.vue`：全部／选中角色按钮、busy 防重复、结果合并与请求错误；`src/components/game/CheckInResultsPanel.vue`：状态摘要、角色身份、奖励、重试与诊断信息。
- `src/common/api/accounts.ts`：`checkInAPI`、`CheckInResults`、`CheckInRoleResult`；`validation.ts`：`parseCheckIn` 校验；`src/i18n/checkIn.ts`：两语言签到词条，由 games.ts 合入 `game.skland.attendance`。
- `POST /game/hypergryph/account/check-in` 使用 Cookie 认证，独立超时 **120 秒**。不传 roles 表示全部角色；指定角色时仅提交 `{ roles: [{ appCode, uid, gameId }] }`，不发送昵称、奖励或第三方凭证。
- 角色唯一键复用 `sklandCache.ts` 的 `roleKey`，同时包含 appCode/gameId/uid。区服通过 `gameServerName` 显示，不将 UID 单独当作身份。

## 响应与显示

| 契约 | 规则 |
| --- | --- |
| `results?` | 存在时使用结构化结果，包括空数组；不存在才回退旧 `checkInResults`／`errorResults`。两份旧数组在当前解析器仍必需 |
| `status` | 仅 `success`、`already_checked_in`、`failed`；分别统计成功、已签到、失败，不把已签到算成新奖励 |
| `rewards` | 展示 name/count/type；count=0 有效，null 为未知。只有 daily/first 显示对应类型标签，未知类型不猜测 |
| `rewardsComplete` | 奖励未完整返回仍可签到成功；空奖励和部分奖励分别提示，不能改判失败或补造道具 |
| `errorCode`／`retryable` | 用稳定错误码本地化，是否允许重试以 retryable 为准，不解析上游报错文字作判断 |
| `requestId?`／`completedAt?`／`durationMs?` | requestId 存在时显示可展开诊断；完成时间是 Unix 秒，耗时是毫秒，描述为最近一次请求 |
| `summary?` | 页面从当前显示的结果行重新统计，避免局部重试响应的 summary 覆盖全部角色汇总 |

总数为零显示信息态，全部失败显示错误态，部分失败显示警告态，其余成功态。HTTP 207 仍读取完整业务响应并显示失败角色，不把 2xx 一概展示为全部成功。角色名、UID、区服和奖励原文保留；本地状态、错误、按钮和日期响应语言切换。

`auth_expired` 提供 `/user` 更新登录入口；`clock_skew` 是上游时钟偏差提示，不引导用户重新登录。其余允许码包括 timeout、network_error、rate_limited、upstream_error、invalid_response、unsupported_game；新增码同时更新类型、解析器和中英文词条。

`parseCheckIn` 对所有结果行先完整校验；任何一行状态、奖励或身份形状非法会使本次请求整体抛 `ApiResponseError`，不是略过该行。reward.count 只接受非负有限数或 null；陌生 reward.type 字符串可保留但不显示推测标签，陌生 errorCode 不在当前枚举内则拒绝。`completedAt` 和 durationMs 可省略，不接受 null。

## 重试与状态

- “重试失败角色”只收集 `status=failed && retryable` 的角色；单行重试仅发送该角色。busy 期间禁止重复提交。
- 指定角色请求且前后都有结构化 results 时，按 roleKey 替换返回行并保留其他角色的成功奖励；其他情况采用本次完整响应。全部签到会替换旧报告。合并只按响应行覆盖 Map 中同三元组条目；requestId、completedAt、durationMs 来自最近请求，summary 由显示行重算。角色选择变化不会主动清除报告。
- 请求抛错时保留已有结果，并单独显示签到错误；不将概览加载、概览错误与签到 busy/error 混为一组状态。刷新角色列表会清空签到报告；结果不写持久存储。签到成功不会主动清理概览缓存，也不会自动再取角色资料；需要刷新资料时使用独立刷新按钮。
- 旧响应只展示原有成功文本和失败详情，不从文本猜已签到状态、奖励结构或可重试角色。

## 验证入口

修改行为时执行项目要求的 `npm test`、`npm run build`，并按范围运行 `npm run test:e2e -- tests/e2e/check-in.spec.ts`。主要覆盖：

- `tests/check-in.test.js`：结构化字段校验、非法状态／负奖励、旧响应兼容。
- `tests/api.test.js`：原有 API 路径和 HTTP 207 处理；`tests/e2e/check-in.spec.ts`：只重试失败角色并保留成功奖励、全部失败、失效登录、时钟偏差、奖励缺失和零值。
- 浏览器检查中英文、明暗主题与 320px 长身份／诊断文本，使用合成响应验证 POST，不为文档核对实际触发账号签到。
