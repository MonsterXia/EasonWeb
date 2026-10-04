# 干员头像来源

2026-10-04 起不再保存头像 ID 映射、终末地头像 PNG 或同步目录。运行逻辑见 `src/common/operatorAvatars.ts`；不引入官方网页的整份压缩 SDK。

- **明日方舟**：优先使用后端透传的当前装备 `skinId`，生成 `https://web.hycdn.cn/arknights/game/assets/char_skin/avatar/{encodeURIComponent(skinId)}.png`；干员档案与助战均来自 `chars[].skinId`（助战按 charId 关联）。缺失或图片加载失败时按官方 charId 生成 `https://web.hycdn.cn/arknights/game/assets/char/avatar/{charId}.png`。转职阿米娅按官方规则使用 `char_skin/avatar/{encodeURIComponent(charId + "#2")}.png`。新干员无需更新本地清单；格式错误或图片加载失败显示姓名首字。
- **终末地**：随概览返回的 `operators[].avatarUrl`，后端从已有 `data.detail.chars[].charData.avatarSqUrl` 选择，缺失或非法时尝试 avatarRtUrl。前端直接使用合法官方 CDN URL，不通过 ID、MD5 或管理员形象查本地 map，不保存图片文件。缺图或加载失败显示姓名首字。

来源：[方舟官方 SDK](https://bbs.hycdn.cn/skland-fe-static/skland-game/9560.b49ee94b.js)（资源工具 get、Ba、getAkCharInfo）；[终末地官方 codec](https://assets.skland.com/_static_assets/game-tools/dist-BZImVwlH.js)（GameDataInfoCodec、As.decode、Ft.decode）。普通头像与阿米娅转职头像官方 URL 已核实可返回图片。[官方账号组件](https://bbs.hycdn.cn/skland-fe-static/skland-game/8624.b27ec983.js) 的 CharAssist 与干员头像均优先皮肤图；2026-10-04 重新核对 SDK getAkCharInfo 从 charMap 读取 skinId，包括 assist 模式。

CommonServerAPI 仅保留已在账号资料中的公共头像 URL，不新增头像接口、逐干员请求或图片代理。缺省字段兼容旧后端；URL 经过前后端官方 HTTPS CDN 校验。`OperatorAvatar.vue` 固定尺寸、懒加载、no-referrer，依次尝试皮肤头像、默认头像、姓名首字，URL 改变后重置加载失败状态；容器背景透明。游戏图片版权归鹰角网络及相应权利人所有。
