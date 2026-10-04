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
