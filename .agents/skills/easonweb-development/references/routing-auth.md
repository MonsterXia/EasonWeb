# 路由、认证与账号管理

路径相对仓库根目录。API 方法与错误语义见 [接口契约](api-contracts.md)，样式见 [界面规范](ui-design.md)。

## 新增页面与导航

- `src/router/routes.ts` 是路由表，页面用动态 import。`index.ts` 创建 history、处理滚动位置和加载错误；不把新路由只写进导航。
- 当前入口为 `/`、`/login`、`/register`、`/reset-password`、`/user`、`/game/hypergryph/endfield`、`/game/hypergryph/skland`。`/game` 与 `/game/hypergryph` 重定向到终末地，未知路径展示 `NotFoundPage.vue`。
- `Navigator.vue` 的 `links` 渲染 `router-link`，按 `route.path` 设置 active 与 `aria-current`，用户中心有独立链接。没有 Element Plus menu 的 `index` 配置。
- 页面 `meta.titleKey` / `descriptionKey` 指向双语词条，`main.ts` 把当前 route meta 传给 `startLocaleSync()` 同步标题与 description。缺省使用站点元信息。
- 需要登录后返回的页面，同时维护 `src/router/returnPath.ts` 的 `destinations` 白名单。当前仅允许首页、用户中心及两项游戏工具；`safeReturnPath()` 保留允许路径的 query/hash，其余回退 `/user`。通过 `authLocation()` 构造认证跳转，避免开放重定向、编码路径绕过和返回认证页的循环。
- 当前没有全局登录守卫；用户页和森空岛页自己读取会话并展示状态。计算器无需登录。不要为新增公开工具扩大认证限制。

## AuthPage 请求生命周期

三个认证路由共用 `src/pages/auth/AuthPage.vue`。`mode` 来自路由，输入表单保持响应式，提交时固定 username/email/password/code/mode/destination 快照，避免 await 期间编辑输入改变后续请求。

`beginOperation()` 返回 signal 与 `current()`；它检查请求身份、signal 和 disposed。切换模式、卸载和 `onBeforeRouteLeave` 都会失效旧操作，离开意图开始时即取消，不等目的页面的懒加载完成。分阶段请求每次 await 后判断有效性，再更新状态、发起下一步或跳转。浏览器取消不保证服务端登录、发信或注册回滚。

- `busy` 与 `sending` 互斥。注册先检查用户名占用，成功后才提交注册；登录 / 注册成功跳向安全返回地址。重置成功进入登录页并保留返回地址。
- 模式切换清空密码、确认密码、验证码、提示及倒计时；保持用户名与邮箱。`finally` 只能修改仍有效请求的状态。
- 注册用户名 3–30 字符；注册 / 重置用 `passwordErrorKey()`，至少 6 个 JS 字符、至多 72 个 UTF-8 字节，包含大小写英文字母及代码列明的特殊字符，不额外要求数字。登录不强制套用新密码策略。
- 邮件验证码为 6 位，发送成功启动 300 秒冷却；`useCooldown.ts` 负责定时与卸载清理。后端验证码有效期和尝试次数不是由前端倒计时决定。
- 持续显示的错误和通知保存为返回本地化字符串的函数并由 computed 求值，语言切换后仍能更新。

## 用户资料与绑定

`userPage.vue` 每次 `loadUser()` 中止旧读取、清空当前资料并显示骨架；`getCurrentUserAPI()` 的 401/404 表示未登录，其他失败显示重试。退出成功清资料，失败保留资料；退出错误 toast 在语言切换时关闭。

`AccountBindings.vue` 只展示鹰角状态、脱敏手机号和管理弹窗。已绑定不等于第三方登录有效。支持短信 / 密码更新登录，解绑使用 `ElPopconfirm`；Post 管理员关联目前不显示。

- 绑定表单以 `busy` 阻止重复操作并锁定弹窗关闭；它当前没有 AuthPage 的 AbortController 生命周期，不把两者当作同一实现。
- 手机号校验 `^1\d{10}$`，短信码 6 位，发送成功冷却 60 秒。短信请求不触发父页面刷新；绑定 / 解绑成功关闭弹窗并 emit `changed`，父页面重读资料。
- 打开 / 关闭弹窗清密码、验证码和提示，关闭不重置短信冷却；操作 finally 同样清凭证。失败时保留弹窗和错误。
- 登录、注册、密码重置、绑定及解绑成功后由 `invalidateSklandAfter()` 清森空岛缓存；退出成功及 current-user 401/404 也清缓存。失败不提前清缓存。

## 相关验证

`tests/navigation.test.js` / `tests/chunk-recovery.test.js` 覆盖安全返回及加载恢复；`tests/api.test.js` 覆盖请求取消传递和身份变化后的缓存失效。浏览器用 `tests/e2e/auth.spec.ts`、`navigation.spec.ts`、`skland.spec.ts`，验证迟到结果、离页、认证模式切换、返回工具和绑定流程。命令与隔离环境见 [验证入口](testing.md)。
