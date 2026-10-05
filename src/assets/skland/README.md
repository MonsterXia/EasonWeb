# 森空岛概览图片

本目录的公共通用图与地区图随 **EasonWeb** 构建发布。条目封面优先读取概览返回的可选 `artworkUrl`，由浏览器直连官方 CDN，不在页面加载时请求资源目录或通过后端代理图片。版权归鹰角网络及相应权利人所有，不作为本站原创素材。

来源核对日期：2026-10-03。参考用户提供的官方 App 录屏及官方网页：

- [明日方舟游戏数据](https://game.skland.com/arknights/game-data)：`8624.b27ec983.js` 引用的日常、基建、收藏及模式图标。
- [终末地游戏数据](https://game.skland.com/endfield/game-data)：`GameData-CKtD4-ed.js`（帝江号、勋章等级、模式）、`realtime-detail-Y11qUxi1.js`（日常资源）、`RegionExploreTable-D36RE3Dz.js`（探索类别、地区缩略图）、`gamedata-CqFQyFZA.js`（地区背景）。

2026-10-04 修正模式图标：SideStory 与别传使用 [PRTS 收录的游戏内别传图标](https://prts.wiki/w/文件:图标_别传.png)（`ak-sideStory`）；集成战略使用[明日方舟官网](https://ak.hypergryph.com/)“集成战略”入口的 `icon-integrated_strategies.05cfb26b.png`（`ak-integratedStrategies`）。两者均保留原始透明 PNG 与白色图形，沿用单色图的明暗主题适配，同时用于分组标题和横幅缺图兜底。`ak-logoRecord` 与 `ak-logoExplore` 属于生息演算的陌域探访和探索里程碑，不能用于这两个模式。来源 URL、核对日期和 SHA-256 见清单；同步脚本允许从官方 `web.hycdn.cn` 及 PRTS 的 `media.prts.wiki` 获取这两张静态资源，页面运行时加载本地构建文件。

`sources.json` 记录每张图片的原始 URL 或内联图片所在的固定版本模块、选择器与 SHA-256。模块仅作为文本解析，**不会执行下载的 JavaScript**。方舟日常/基建图在官方页面作为低透明度水印；为在小尺寸底板上可读，只将 PNG 透明度调至最大 230，保持 RGB、轮廓与抗锯齿。该变换及原文件哈希也记入清单。

```sh
npm run overview-assets:check # 离线检查已提交图片
npm run overview-assets:sync  # 显式重新下载固定版本并核验，再恢复相同文件
```

同步需要 Node 与 curl；构建、运行页面无需同步或额外图像处理依赖。新增图片先核实语义与稳定 ID，更新清单和前端映射后检查资源并构建。不得把用户录屏、账号数据或凭证写入此目录。

生息演算保留官方 `ak-logoBase` 原图及原色，并扩大图像主体在底板中的占比。所有图标底板统一使用 `--color-background-mute`，随浅色／深色主题切换；不因彩色素材或生息演算图标单独加深、叠灰或设置固定底色，不用通用图标替代官方模式标识。

`src/common/overviewAssets.ts` 按游戏、指标、设施 `nameKey` 或地区 ID 选择图片。`indie_dg007` 按官方规则复用 `map02_lv004`；未匹配地区不猜图。活动等条目的独立封面来自官方概览对应 infoMap 的 picUrl；缺失时使用本地模式标识，不拿其他活动封面替代。`OverviewArtwork.vue` 使用固定尺寸、空 alt（旁边已有名称）、懒加载及依次回退；图片全部失败时隐藏图片，保留文字数据。底板使用主题语义色；已核实的单色 UI 图标按原始墨色在浅色下 multiply、深色下 screen 混合，必要时仅单色图反色，消除图片内半透明白底。彩色设施、勋章等级、地图保持原色，不做批量反色。地区背景在深色下用 soft-light 融合，避免亮白横幅。

条目图片优先级（2026-10-04）：官方概览的 `artworkUrl` → 本地稳定 ID 资源 → 分组通用图 → 文字。活动、集成战略、保全、剿灭封面来自官方 infoMap.picUrl；终末地使用赛季 kvImage/headerImage 和当前秘境 pic。见项目 skill 的资源获取说明；这些动态封面由浏览器直接加载，不加入本目录、不持久化账号数据。

2026-10-04：生息演算里程碑沿用官方账号组件中的 logoBase（驻地）、logoExplore（累计探索）、logoResist（成功抵御敌袭）、logoRecord（陌域探访）。其中 logoBase 和 logoResist 含语义颜色，保持原图并在浅色主题适度降低亮度，不能反色为其他色相。所有素材均来自清单内官方固定地址，不使用用户截图裁图。

生息演算见证使用官方 `main-task-1/2/3` 三幕徽章及 `main-task-over` 完成叠层，来源为同一森空岛 SandTales 模块；按 `mainQuest >= chapter` 显示完成标记，未知值不推断。生存日半环为无进度语义的装饰 SVG，天数与单位使用可翻译文本，避免把中文图片文字写死到英文界面。

生存日数字背景使用官方 `day-common.cde950.png` 与 `day-challenge.b2209b.png`（完整原图和 SHA 见清单），仅通过 CSS 裁剪中央徽记，不显示原图内置中文；保留常规黄绿徽记与险途红色光晕，禁止用章节完成勾号替代。

光晕修正：显示时复用 day-common 的官方同形徽记，险途仅对徽记转红，光晕用独立的柔和径向渐变。day-challenge 原图保留用于来源核对，不再放大其自带光晕；避免透明度叠加和硬圆形裁剪制造色斑。

2026-10-04：`ef-regionExplore.png` 使用官方 `GameData-CKtD4-ed.js` 中的 `wn` 原始 PNG；地区探索标题组件 `Oa` 的背景图直接引用此变量。来源与哈希见 sources.json。

2026-10-05：战争回响评级、0–3 星及额外挑战星标使用官方 GameData-CKtD4-ed.js 的原图；金银铜荣勋来自 silver-CMo64lkE.js。保留图片原色、透明度和比例，变量、URL 与校验值均在 sources.json。

2026-10-05 地区建设新增官方地区标识（w/T）、地区调度券（E/D）、据点储量标识（N/P），来源 region-dev-detail-Cq-A_xh2.js；分组标题为 GameData-CKtD4-ed.js 的 mn（官方白色选中标识，按 light-ink 适配主题）；未获得蚀刻章为 umbral-monument-jhlt_L1E.js 的 Xn。均由既有 sources.json / sync-overview-assets.mjs 同步，保留模块和 PNG SHA-256。丰碑主题封面及已获得章图仍使用接口提供的官方 URL，不保存账号图像目录。

2026-10-05：编队头像属性／潜能图标核对官方 dist-B--VuxvI.js 的 bn、ri 组件。属性使用 elements/*-active.png 及官方语义底色，潜能 0–5 使用模块内 qr/Jr/Yr/Xr/Zr/Qr 原始 PNG。清单记录来源与哈希，头像覆盖层保持原色；全部取对应历史记录值。DungeonRecordCard-u3WKcZOq.js 的 V 色条传入 rarity，引用 dist-B--VuxvI.js 的 pn 映射与 vendor_sk_pandora-4j21Uk6y.js 的 dark_rank_* 色值；不是突破阶段。记录头像不显示右上突破图标，突破保留文字详情。

苦难纹理使用官方 DungeonRecordCard-u3WKcZOq.js 引用的 bg-right-C2XtR6xt.png；模式图标使用 umbral-monument-jhlt_L1E.js 的 Dr。保留原始 PNG，以降低透明度的方式融入浅色／深色卡片，不自行重画苦难图标。

空编队槽位使用官方 DungeonRecordCard-u3WKcZOq.js 的 w（ef-record-empty.png），保留圆圈斜杠原始轮廓，以 CSS mask 适配主题文字色。

主题卡进度使用 umbral-monument-jhlt_L1E.js 的 Yn 标识、$n 苦难段、er 普通段、tr 未通关段原始图片，按官方 wr/hr 的逐关状态排列。Yn 原图轮廓用主题色遮罩，其余段保留原色。未知状态额外显示问号。

2026-10-05 战争回响难度记录背景：stage-detail-DGptjXe5.js 为所有难度传入 war-echo-level-detail-card-bg-tpOcJ3Oe.png（ef-war-record-bg），共用 DungeonRecordCard 的 bg-left-KX4hJsGd.png（ef-record-left-bg）；仅 cruel 通过 rightBackgroundFullSize 叠加 cruel_mode_bg-Dcu9f__0.png（ef-war-cruel-bg）。背景均为官方原始 PNG，来源及 SHA-256 见清单；普通／困难共用底纹，残酷为整卡居中 cover，不能复用丰碑右下 bg-right 或 CSS 径向渐变。浅色模式只对灰阶基础纹理反色融合，彩色红纹保留原色。

荣勋未获得徽章使用 honor-detail-DyHS7yPO.js 的 j 原始 PNG（ef-war-unearned），按官方规则在名称右侧显示；不能用铜级徽章替代。已获得条目保留对应等级徽章及日期。
2026-10-05：明日方舟日常／基建标题改用官方 `8624.b27ec983.js` 中 `vn`／`mi` 引用的 `title.f05a97.png`／`title.479ff6.png`。原始透明标题条以 `ak-title-daily`／`ak-title-base` 保存；`OverviewArtwork` 的 `official-title-icon` 仅显示原图 264×60 中 `(30, 6, 48, 48)` 的图标区域，保留独立国际化文字，并沿用 `light-ink` 主题适配。

“我的干员”标题使用同一官方模块的 `Pn` SVG（`CharSkinList__TitleLogo` 引用）。原始三条 path 保存在 `ArknightsOperatorsIcon.vue`，仅将固定填色换成 `currentColor` 适配主题；组件注释记录来源模块及 SHA-256，不用收藏统计的 `ak-char` 代替。方舟标题固定为官方“实时数据”“基建数据”“我的干员”；英文前两项采用官方模块的 TIMING DATA / BASE DATA，干员标题译为 My Operators。

2026-10-05 光荣之路：标题复用 GameData-CKtD4-ed.js 的 Sn（ef-achievements），三档统计复用 ef-medalLevel1–3。展示墙空六边形使用同模块 Fa（ef-glory-empty），认证标识为 certifyBg--9TZ5ld1.png（ef-glory-certify），来源和哈希见 sources.json。账号奖章图仍由接口返回已校验的官方 CDN URL，不写入公共素材清单。

光荣之路概览底纹使用官方 GameData-CKtD4-ed.js 的 Ia：medalCardBg-BkS_UR-_.png（ef-glory-summary-bg），等高线和颗粒均来自原图。以独立背景层等比 cover 居中，浅色 multiply 0.85、深色 invert + screen 0.65，保留主题底色，不影响奖章／文字，也不拦截交互。

2026-10-05 终末地标题对齐：官方 `GameData-CKtD4-ed.js` 的实时数据标题 `ks` 包装 `bn` 上升柱状 SVG，干员标题 `ao` 包装 `yn` 菱形人物 SVG。原始 path、viewBox 与模块 SHA-256 记录于 `EndfieldTitleIcon.vue`，只将固定深色填充替换为 `currentColor`；两个图标均使用官方 20px 容器，不复用方舟图标。中文按官方标题使用“实时数据”“干员”，英文译为 Real-time Data / Operators。
