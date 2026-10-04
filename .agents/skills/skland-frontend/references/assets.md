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

来源与固定 revision 以 `src/assets/game-avatars/sources.json` 为准；同步入口为 `npm run avatars:sync`，不会在 build/runtime 自动执行。

- 方舟：ID 清单来自 [ArknightsGameResource](https://github.com/yuanyan3060/ArknightsGameResource)，仓库 `catalog.json` 缓存官方 CDN 默认头像链接（仍由浏览器加载官方 CDN 图片，不是所有图片字节本地化）。`#1` URL 编码为 `%231`；近卫/医疗阿米娅例外保留在 additionalCharacterIds，默认图用 defaultSkins 的 `#2`，不可按 isNotObtainable 直接过滤。
- 终末地：[EndfieldAssets](https://github.com/555me/EndfieldAssets) 的 charicon，PNG 入库 `endfield/`。接口 ID 可能是原始 `chr_...` 的 MD5，同步脚本预生成两种键，不在运行时请求转换。源文件按 Git blob 哈希和 PNG 文件头校验。
- 管理员共用 ID 通过 `profile.endministratorGender`（游戏内形象）和 endfieldVariants 选图，未知时不猜男/女。不得将该字段当作用户性别。
- `operatorAvatars.ts` 按游戏+ID 查表；`OperatorAvatar.vue` 固定占位、懒加载、失败文字兜底，URL 改变后重置失败态。不按名字猜另一干员图片。

详见 [头像资源说明](../../../../src/assets/game-avatars/README.md)。保留版权归属；清单中仅放公共资源，不放用户持有记录或私有头像凭证。

## 主题适配

`OverviewArtwork.vue` 根据元数据 `tone: light-ink | dark-ink | color` 处理：已核实单色图浅色 multiply、深色 screen，必要时反色；彩色设施、勋章、地图保持原色，不批量反色。底板用主题语义色，地区背景深色用 soft-light。指标卡片统一背景、边框与数字色，不单独高亮理智卡片。

图像使用固定尺寸、object-fit、懒加载；旁边已有名称则 alt 为空，图片失败仍展示完整数据。Vue scoped 样式要检查编译后选择器：不可让 filter/invert 意外作用到整个 html（回归见 `tests/overview-assets.test.js`）。

## 条目封面（2026-10-04）

官方 SDK `https://bbs.hycdn.cn/skland-fe-static/skland-game/9560.b49ee94b.js` 的 `getAkActInfo` 明确将 activityInfoMap、rogueInfoMap、towerInfoMap、campaignInfoMap 的 `picUrl` 用作对应记录的 bgUrl；后端按记录 ID 选取，不按名称猜图。生息演算未核实条目封面，仍用官方模式图。

终末地 `https://assets.skland.com/_static_assets/game-tools/dist-BZImVwlH.js` 的 codec 定义赛季 `kvImage` / `headerImage`、当前 indieHardGroup 的 `pic`。赛季用 kvImage，周记录用所属赛季 headerImage，秘境记录使用所属当前模式 pic；独立关卡缺少已核实封面时继续兜底，不把敌人图猜作关卡图。

`artworkUrl` 可缺省，兼容旧后端。前后端仅接受 HTTPS 的 bbs.hycdn.cn、web.hycdn.cn、assets.skland.com，不允许 URL 用户密码或非默认端口。前端图片使用 no-referrer，保持原色和完整比例，不应用地图背景的混合滤镜。图片加载失败依次切换回退资源，地址变化重置失败状态。动态条目封面不入公共静态目录、不保存账号响应、不在构建中联网同步。静态资源清单仍由既有脚本维护。
