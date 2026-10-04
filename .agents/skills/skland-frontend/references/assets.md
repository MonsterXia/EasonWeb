# 森空岛图片来源与维护

核对于 2026-10-04。公共目录与通用图由 EasonWeb 发布；随官方概览返回的条目封面由 CommonServerAPI 保留为可选 `artworkUrl`，浏览器直连官方 CDN。不新增每角色/每干员取图接口、后端图片代理或额外上游取图请求。

## 官方概览图

入口：[明日方舟](https://game.skland.com/arknights/game-data)、[终末地](https://game.skland.com/endfield/game-data)。已核实版本：

| 用途 | 公开官方模块 |
| --- | --- |
| 方舟日常、基建、收藏、模式 | `https://bbs.hycdn.cn/skland-fe-static/skland-game/8624.b27ec983.js` |
| 终末地设施、勋章、模式 | `https://assets.skland.com/_static_assets/game-tools/GameData-CKtD4-ed.js` |
| 终末地日常 | `https://assets.skland.com/_static_assets/game-tools/realtime-detail-Y11qUxi1.js` |
| 终末地探索类别、地区缩略图 | `https://assets.skland.com/_static_assets/game-tools/RegionExploreTable-D36RE3Dz.js` |
| 终末地地区背景 | `https://assets.skland.com/_static_assets/game-tools/gamedata-CqFQyFZA.js` |

模块只作为文本解析引用和内联 PNG，绝不执行下载的 JavaScript。`src/assets/skland/sources.json` 是资源级来源清单，保存原 URL 或固定模块 URL、选择器、模块/原图/输出 SHA-256 与变换。图像放 `src/assets/skland/`，由 `src/common/overviewAssets.ts` 按游戏、指标 key、设施 nameKey 和地区 ID 映射；未知项保留文字，不猜图。条目优先使用接口 `artworkUrl`，其次为本地稳定 ID 对应图，再回退到分组通用图；全部失败仍保留文字与进度。分组标题继续使用模式标识。

`npm run overview-assets:check` 离线校验已提交资源；`npm run overview-assets:sync` 显式重取清单中固定版本并验证。更新上游版本时先核对新模块语义和实际图片，再更新清单，不关闭哈希校验或以失败下载覆盖现有资源。同步脚本为 `scripts/sync-overview-assets.mjs`，使用 Node 和 curl。

方舟水印资源只按清单中的 `palette-alpha-230` 规范化透明度，保持 RGB、轮廓和抗锯齿，不重画官方图标。详见 [已提交资源说明](../../../../src/assets/skland/README.md)。

## 干员头像

2026-10-04 改为官方来源优先，已移除 catalog.json、endfieldVariants、本地头像 PNG 和 avatars:sync 脚本。

- 方舟：官方 SDK `https://bbs.hycdn.cn/skland-fe-static/skland-game/9560.b49ee94b.js` 的资源工具以 `https://web.hycdn.cn/arknights/game/assets/` 为前缀，普通头像使用 `char/avatar/{charId}.png`；转职阿米娅匹配 `char_数字_amiya数字`，使用 `char_skin/avatar/{encodeURIComponent(charId + "#2")}.png`。只实现已核实的路径规则，不引入整份网页 bundle。
- 终末地：官方 `dist-BZImVwlH.js` 的 GameDataInfoCodec → As.decode → Ft.decode 保留 `data.detail.chars[].charData.avatarSqUrl` / `avatarRtUrl`。CommonServerAPI 从已有响应选取合法官方 URL 输出 `operators[].avatarUrl`，不额外取图。优先方形头像，缺失/非法才用矩形头像。前端不通过 ID 或 profile.endministratorGender 再选图。
- `OperatorAvatar.vue` 使用姓名首字兜底，固定尺寸、懒加载、no-referrer；缺失或加载失败保留文字，换 URL 重置加载/失败状态。终末地不回退本地游戏头像。

详见 [头像说明](../../../../src/assets/game-avatars/README.md)。不要保存真实账号响应或凭证。

## 主题适配

`OverviewArtwork.vue` 根据元数据 `tone: light-ink | dark-ink | color` 处理：已核实单色图浅色 multiply、深色 screen，必要时反色；彩色设施、勋章、地图保持原色，不批量反色。底板用主题语义色，地区背景深色用 soft-light。指标卡片统一背景、边框与数字色，不单独高亮理智卡片。

图像使用固定尺寸、object-fit、懒加载；旁边已有名称则 alt 为空，图片失败仍展示完整数据。Vue scoped 样式要检查编译后选择器：不可让 filter/invert 意外作用到整个 html（回归见 `tests/overview-assets.test.js`）。

## 条目封面（2026-10-04）

官方 SDK `https://bbs.hycdn.cn/skland-fe-static/skland-game/9560.b49ee94b.js` 的 `getAkActInfo` 明确将 activityInfoMap、rogueInfoMap、towerInfoMap、campaignInfoMap 的 `picUrl` 用作对应记录的 bgUrl；后端按记录 ID 选取，不按名称猜图。生息演算未核实条目封面，仍用官方模式图。

终末地 `https://assets.skland.com/_static_assets/game-tools/dist-BZImVwlH.js` 的 codec 定义赛季 `kvImage` / `headerImage`、当前 indieHardGroup 的 `pic`。赛季用 kvImage，周记录用所属赛季 headerImage，秘境记录使用所属当前模式 pic；独立关卡缺少已核实封面时继续兜底，不把敌人图猜作关卡图。

`artworkUrl` 可缺省，兼容旧后端。前后端仅接受 HTTPS 的 bbs.hycdn.cn、web.hycdn.cn、assets.skland.com，不允许 URL 用户密码或非默认端口。前端图片使用 no-referrer，保持原色和完整比例，不应用地图背景的混合滤镜。图片加载失败依次切换回退资源，地址变化重置失败状态。动态条目封面不入公共静态目录、不保存账号响应、不在构建中联网同步。静态资源清单仍由既有脚本维护。


## 横幅与模式标识

活动、集成战略、保全、剿灭、引航者试炼的 picUrl 是横幅。利用素材向右透明的特点做单层卡片：左侧只预留 60–76px 标识区域，名称/期数与成绩在同一横排覆盖背景；常规行高约 64–72px，取消上下信息栏及半幅空图片区。引航者试炼第一行是名称及右侧期数小标签，第二行是左对齐的最高进度；最新期数优先。有横幅时原图铺满整卡，使用随明暗主题切换的语义衬底、渐变遮罩和文字颜色，不能用接近不透明的主题底色盖住整幅纹理；去掉图片高度上限，换行增高后也覆盖整卡。引航者试炼单独使用紧凑网格（列宽起点 280px，卡片最大 340px），背景等比例放大为卡宽两倍并从左侧裁切，只展示有纹理的左半部；其他横幅不固定裁去半幅，按卡片比例等比铺满并裁切溢出部分。背景与官方 logo 独立渲染：logo 叠在左侧、透明底板。引航者试炼浅色主题使用浅主题底、清晰可见的原色纹理（明暗主题共用 `--skland-banner-opacity`，默认 1；渐变遮罩仅保护文字对比，不再单独覆盖各模式图片不透明度）和深色文字，单色 logo 沿用共享反色规则；深色保留暗底和白色 logo。期数标签使用淡主题底与主题色字，避免深色实心底；无图或加载失败则恢复主题底色和主题图标颜色，避免重复 logo。长标题自然换行并增高，手机同样保留左右布局；缺图/加载失败以模式图兜底并保持结构。不固定高度截断文字，也不依靠原图透明度保证文字对比。

SDK 的 `So` / `xo` 分别使用 `game_mode/climb_tower/icon/{encodeURIComponent(id)}.png` 和 `game_mode/campaign/zone_icon/{encodeURIComponent(id)}.png`，前缀 `https://web.hycdn.cn/arknights/game/assets/`。这两个模式缺横幅时先尝试官方 ID 图标，再到本地通用图；引航者试炼使用 SDK `Eo` 中公开固定图 `https://bbs.hycdn.cn/public/skland-game/image/arknights/bossRush/6fb47c15e54385aee62ce4442acf90b0.png`。单色图仍使用共享主题底板。活动 picUrl 缺失时没有已验证的通用 ID 补图规则：act35side 的 game_mode/activity/thumb 路径核查为 404，不应据此新增猜测地址或硬编码个别活动映射。

保全派驻须将背景与设施 logo 独立叠加：背景仅用接口 `artworkUrl`，logo 始终按已核实的 `climb_tower/icon/{id}.png` 规则解析，失败才用通用模式图。不能把 logo 仅作为背景的兜底；背景失败后保留 logo，logo 失败后也保留背景。保全与引航者试炼复用明暗主题遮罩：浅色用浅底深字、深色单色 logo，深色用暗底白字、白色 logo；背景原色不反转，不透明度只由共享参数控制，主题遮罩保护文字对比。包括缺图兜底在内，logo 均由共享主题规则适配；不能强制浅色页面使用黑底白标。前景标识不得重复渲染在背景中。回归见 `tests/e2e/overview-tower.spec.ts`。

SideStory 与别传、集成战略共用 `banner-end-record` 布局，保留整张横幅作卡片背景；名称、通关进度／完成状态或收藏品／投资放在横幅右侧无内容区域（约 58% 处开始），不能遮挡左侧内嵌标题，也不拆成独立图片区。横幅使用等比例 cover、左对齐裁切，随卡片增高铺满上下边缘，任何窗口宽度下都不能用 contain 产生上下留白；右侧渐变保护文字，不能固定高度截断长标题。回归需结合图片原始尺寸、object-fit 和容器尺寸检查实际绘制范围，不能只比较 img 元素高度；明暗主题均用语义底色和文字，遮罩只渐变覆盖右侧。无横幅、加载中或加载失败时仍保持 58% 的右侧文字列，左侧显示兜底图标；文字定位不能依赖 `.cover` 是否存在，移动端也不能覆盖为紧凑缩进。零值和缺失的两项数据仍分别展示；活动完成状态用主题主色，不能继承暗色横幅的浅粉色文字。

剿灭作战的 `campaign/zone_icon/{id}.png` 为独立前景标志，有背景时也必须加载，图标失败只回退模式图，不移除背景。主题规则复用保全。按每条记录的接口 `artworkUrl`（上游 infoMap.picUrl）分别显示官方背景；外观相似不代表 URL 相同，禁止按视觉相似性合并或缓存为单张本地默认图。浏览器可按正常 URL 缓存策略缓存图片，不额外写入账号数据或持久化映射。回归使用不同 URL 返回相同图片字节，确认各条目保留自己的背景地址。

## 横幅调参与验证

图片不透明度到 1 后不能继续提高；若仍显淡，应检查叠加的主题遮罩。五类横幅共用 `.record-row:has(.banner-frame .cover)::after` 的遮罩强度，通过 `src/assets/base.css` 中的 `--skland-banner-scrim-opacity`（默认值以源码为准） 控制（范围 0–1，越小原图越清晰，0 为无遮罩），不要分模式或分主题重复调整。图片不透明度仍统一由下述参数控制，文字和 logo 不随背景一起淡化。

五类横幅（SideStory 与别传、集成战略、保全派驻、剿灭作战、引航者试炼）共用 `src/assets/base.css` 中的 `--skland-banner-opacity`，默认 `1`，范围 `0–1`，越大图片越明显。图片与遮罩分别由这两个共享参数控制，持久调整修改 base.css，Vite 热更新后查看效果。

也可以在浏览器控制台临时调整：

```js
document.documentElement.style.setProperty('--skland-banner-opacity', '1')
document.documentElement.style.setProperty('--skland-banner-scrim-opacity', '0.5')
```

刷新恢复源码值，或分别用 `document.documentElement.style.removeProperty(变量名)` 清除临时覆盖。两个变量分别只影响背景图与主题遮罩，文字、独立 logo、状态与缺图兜底保持清晰；不要按卡片类别或主题再覆盖图片不透明度。

用页面主题切换同时检查浅色与深色，检查手机/桌面宽度、长标题换行和图片加载失败。背景必须等比铺满上下边缘；图片实际绘制范围与 img 元素尺寸不同，不能只凭元素高度判断无留白。

对应验证命令：

```sh
npm run test:e2e -- tests/e2e/overview-records.spec.ts tests/e2e/overview-tower.spec.ts
```

`tests/e2e/banner-helpers.ts` 检查五类卡片共用参数，背景不透明度变化时文字、logo 与兜底图不受影响。E2E 使用合成数据并独占 4173，自动生成 `dist-e2e/`；不能用其产物部署或声称验证了真实账号登录。账号数据与截图不写入 skill、测试夹具或公共资源；真实接口不可用时使用合成响应，并注明验证范围。
