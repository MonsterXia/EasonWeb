# API 契约与边界

前端不直接调用森空岛官方私有接口。页面 → `src/common/api/` → `client.ts` → `gatewayManager` → 共享 Axios；CommonServerAPI 的实现与部署在独立仓库。

## 请求层与超时

- `src/common/config/domain.ts` 优先使用 trim 后的 `VITE_API_BASE_URL`，否则开发 `/api`、生产 `https://api.246801357.xyz`。配置在构建时生效。本地切换参见 [本地运行](local-debugging.md)。
- `gatewayManager.buildStandardURL()` 处理首尾斜线，网关只返回 Axios 的 `response.data`；`client.ts/getData`、`postData` 再解业务 envelope 的 data。健康检查 `basic.ts` 直接使用网关，无业务 envelope。
- 共享 Axios `withCredentials: true`、默认 10 秒。`accounts.ts` 的 POST helper 使用 `ACCOUNT_REQUEST_TIMEOUT=60000`，角色列表与 `gameOverviewAPI` 同为 60 秒；`checkInAPI` 单独 120 秒。退出、用户名占用查询和 DELETE 解绑仍沿用默认值，不笼统称所有账号操作 60 秒。
- 普通用户会话使用 HttpOnly `auth_token`，Post 管理员有独立 `post_auth_token`；保留 Cookie 认证。不要新增 localStorage JWT 或在 URL / 日志传凭证。

## 当前页面调用的接口

以下路径相对 API 根，准确参数以函数签名和 `tests/api.test.js` 为准。

| API 模块 / 函数 | 方法与路径 | 关键参数 / 语义 |
| --- | --- | --- |
| user / getCurrentUserAPI | GET `user/current` | 支持 signal；401/404 → null 并清森空岛缓存 |
| user / logoutAPI | POST `user/logout` | 成功后清缓存 |
| accounts / loginAPI | POST `user/login` | username、password |
| accounts / registerAPI | POST `user/register` | username、email、password、registrationCode |
| accounts / usernameExistsAPI | GET `user/username/{encodedUsername}/exist` | 布尔值；true 表示占用 |
| accounts / registrationCodeAPI | POST `user/email/verify` | email、type: register |
| accounts / resetCodeAPI | POST `user/password/reset/code` | username、email |
| accounts / resetPasswordAPI | POST `user/password/reset` | username、email、code、password |
| accounts / hypergryphSmsAPI | POST `game/hypergryph/account/sms` | phone |
| accounts / bindHypergryphAPI | POST `game/hypergryph/account` | phone、method 与 password 或 code |
| accounts / unbindHypergryphAPI | DELETE `game/hypergryph/account` | 成功才使缓存失效 |
| accounts / gameAccountsAPI | GET `game/hypergryph/account/games` | 支持 signal；校验角色数组 |
| accounts / checkInAPI | POST `game/hypergryph/account/check-in` | 可传 GameAccount[]，只发送 roles 中的 appCode/uid/gameId；缺省为全部签到 |
| gameOverview / gameOverviewAPI | GET `game/hypergryph/account/overview` | appCode、uid、gameId 查询参数；支持 signal |

Post 管理员的 login/binding 封装仍在 `accounts.ts`，当前 UI 不调用。不要仅因存在接口恢复功能。认证/绑定成功后的缓存失效与请求生命周期见 [路由与认证](routing-auth.md)。

## 校验与错误

`ApiResponse<T>` 描述 `{ message, data, httpStatus }`，但 `responseData()` 当前只要求对象具有自身 data 字段，不校验 message/httpStatus，也不根据 envelope 的 httpStatus 再判断成功。false、0、null、空数组均保留。

具体响应使用 `validation.ts` 的 `parseCurrentUser`、`parseAvailability`、`parseGameAccounts`、`parseGameOverview`、`parseCheckIn`。它们验证而不转换字段：必要字段缺失或形状错误抛 `ApiResponseError`；不把非法值自动变成 null。可选与可空分别用 optional/nullable 表达，额外未知字段不导致拒绝。`parseGameOverview` 还检查返回角色的 appCode/gameId/uid 与请求一致。

新增概览字段需同时维护 `gameOverview.ts` 类型、`validation.ts` 校验、合成响应和消费者，保留旧响应缺省兼容。签到优先 structured results，同时仍要求旧数组形状，详见 [签到反馈](../../skland-frontend/references/check-in.md)。

`errors.ts/apiFailureKind()` 区分：401 session、403 authorization、429 rateLimit、502 upstream、无 HTTP 响应 network、`ApiResponseError` invalidResponse，其余 unavailable。`accounts.ts/apiError()` 负责本地化提示，另有 409 冲突与 400 输入提示。错误文本不参与业务判断；只在 current-user 查询将 401/404 转 null，不对所有 API 吞错。

调整接口前确认后端契约，不为页面猜 URL 或自行转换状态码。合成回归覆盖方法、路径、参数、envelope、零值/null、畸形 2xx、HTTP 错误与取消信号；使用 [验证入口](testing.md) 指向的测试，不用真实短信、邮件、绑定或签到充当回归替身。
