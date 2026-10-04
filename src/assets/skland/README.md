# 森空岛概览图片

这些公开游戏资源随 **EasonWeb** 构建发布，不从 CommonServerAPI 获取图片或图片链接，不在页面加载时请求官方资源目录。版权归鹰角网络及相应权利人所有，不作为本站原创素材。

来源核对日期：2026-10-03。参考用户提供的官方 App 录屏及官方网页：

- [明日方舟游戏数据](https://game.skland.com/arknights/game-data)：`8624.b27ec983.js` 引用的日常、基建、收藏及模式图标。
- [终末地游戏数据](https://game.skland.com/endfield/game-data)：`GameData-CKtD4-ed.js`（帝江号、勋章等级、模式）、`realtime-detail-Y11qUxi1.js`（日常资源）、`RegionExploreTable-D36RE3Dz.js`（探索类别、地区缩略图）、`gamedata-CqFQyFZA.js`（地区背景）。

`sources.json` 记录每张图片的原始 URL 或内联图片所在的固定版本模块、选择器与 SHA-256。模块仅作为文本解析，**不会执行下载的 JavaScript**。方舟日常/基建图在官方页面作为低透明度水印；为在小尺寸底板上可读，只将 PNG 透明度调至最大 230，保持 RGB、轮廓与抗锯齿。该变换及原文件哈希也记入清单。

```sh
npm run overview-assets:check # 离线检查已提交图片
npm run overview-assets:sync  # 显式重新下载固定版本并核验，再恢复相同文件
```

同步需要 Node 与 curl；构建、运行页面无需同步或额外图像处理依赖。新增图片先核实语义与稳定 ID，更新清单和前端映射后检查资源并构建。不得把用户录屏、账号数据或凭证写入此目录。

生息演算保留官方 `ak-logoBase` 原图及原色。该图的浅黄色、白色细节在浅色底板上对比度不足，单独使用深梅紫底板并扩大图像在底板中的占比；其他图片沿用各自的主题适配，不用通用图标替代官方模式标识。

`src/common/overviewAssets.ts` 按游戏、指标、设施 `nameKey` 或地区 ID 选择图片。`indie_dg007` 按官方规则复用 `map02_lv004`；未匹配地区不猜图。活动暂无已核实的独立封面目录，使用对应模式标识，不拿其他活动封面替代；后续有可信固定资源时再按活动 ID 扩展。`OverviewArtwork.vue` 使用固定尺寸、空 alt（旁边已有名称）、懒加载及失败隐藏；保留文字数据。底板使用主题语义色；已核实的单色 UI 图标按原始墨色在浅色下 multiply、深色下 screen 混合，必要时仅单色图反色，消除图片内半透明白底。彩色设施、勋章等级、地图保持原色，不做批量反色。地区背景在深色下用 soft-light 融合，避免亮白横幅。
