# 终末地概览与 UI

维护森空岛终末地时按模块读取。本参考于 2026-10-05 对照当前工作区源码整理；下述截图确认与官方来源日期沿用既有维护记录，不代表本次重新联网核验或所有页面均经用户验收。路径相对仓库根目录，组件均在 `src/components/game/`。

## 入口、契约与兼容

入口为 `SklandPage.vue → GameOverviewPanel.vue → OverviewLiveDetails.vue`。读取角色概览时前端仅请求本站 `GET /game/hypergryph/account/overview`，通过 `src/common/api/gameOverview.ts` 定义类型、`validation.ts` 的 `parseGameOverview` 检验形状和角色三元组；下文官方接口是 CommonServerAPI 的上游来源，不在浏览器直接调用。

| 模块 | 展示入口 | 契约／适配 |
| --- | --- | --- |
| 实时数据与帝江号 | `OverviewLiveDetails.vue`、`EndfieldDetails.vue` | metrics、sections；`overviewSections.ts` 的 `endfieldSections` 合并旧 cnsLevel |
| 地区探索 | `EndfieldExploration.vue` | `overviewSections.ts` 合并六类 sections |
| 地区建设 | `RegionalDevelopment.vue` | 可选 `regionalDevelopment.regions` |
| 光荣之路 | `GloryRoad.vue` | 可选 `gloryRoad`；旧 metrics 数量兜底 |
| 战争回响 | `WarEchoesDetails.vue` | 可选 `warEchoes` |
| 影拓丰碑 | `MonolithDetails.vue`、`MonolithTheme.vue` | 可选 `monolith` |
| 干员与历史编队 | `GameOverviewPanel.vue`、`EndfieldRecordCard.vue` | `EndfieldPortraitBadges.vue`、`EndfieldOperatorFacts.vue` 共用 |

四个新对象在顶层均为可省略字段，不接受顶层 null；对象内部的可空字段依类型区分未知与已知空数组。`detailAvailable=false` 保留已知赛季／主题摘要。新对象存在时隐藏对应旧分组，旧响应继续通过 `EndfieldDetails.vue` 显示兼容摘要；不要仅因缺少新对象拒绝整个概览。光荣之路另从旧 achievements／medalLevel1–3 构造未知详情，避免收藏数量丢失。

前后端字段不能混读：下文 `isPass`、`passTs`、`ts`、`bestRecord.chars`、`firstPassTs` 是历史核对的上游来源；本仓库组件实际消费 `WarEchoesDifficulty.isPassed`、`record.durationSeconds`、`record.recordedAt`、`record.team`、`firstPassAt`。荣勋为 `warEchoes.honors`（`stars/acquired/acquiredAt`），不是上游 `achieves`；丰碑蚀刻章是 `theme.medal`（`acquired/plated/artworkUrl/acquiredAt`）。不要把上游字段直接加到 Vue 模板。前端不会重新校验“耗时正且通关”的业务归一化条件；此条件由后端保证，运行时解析只校验契约形状。

历史编队成员的 `rarity` 是可空字符串（例如 `rarity_6`），当前干员档案的 `rarity` 是可空数字；`endfieldRarityColor` 兼容这两种来源。历史编队契约没有 profession，不用当前档案职业补齐；同一个记录卡可保留超过四人的合法返回，四槽是最低占位数量而非裁掉额外成员的上限。

字段映射的通用时钟与缺失规则见[显示规则](../../easonweb-development/references/skland-data.md)，图片链路见[资源说明](assets.md)。新增契约要同步类型、边界解析、后端 OpenAPI 和合成夹具。

### 摘要指标与功能范围

终末地 metrics 沿接口的 group/key 展示；`dailyStatus.ts` 对终末地直接保留接口指标，不生成方舟九项卡片或倒计时公式。`src/i18n/overview.ts` 与 `overviewAssets.ts` 已有 `seekSuspicion`（蚀像寻遗）的词条及图标映射，收到该指标时使用通用摘要展示；当前没有独立的蚀像寻遗详情组件或嵌套契约，不将其与影拓丰碑合并。干员当前展示持有档案与养成属性，不包含额外履历故事或技能／装备详情。

## 标题、折叠与选择

终末地标题（2026-10-05 用户截图）：日常状态分组标题使用官方“实时数据”，干员档案分组标题使用官方“干员”。对应图标复用 EndfieldTitleIcon.vue 中 GameData-CKtD4-ed.js 的 bn／yn 原始 SVG 路径（ks／ao 标题组件引用），20px 容器、currentColor 适配主题；不使用通用太阳图标或方舟专属标识。词条独立维护在 endfieldTitles。

终末地标题折叠（2026-10-05 用户确认）：实时数据与干员两组同样使用 details/summary、vAnimatedDetails 三角及共享动画，默认展开。搜索和展开全部放在干员组的内容区；同角色更新保留整组手动折叠状态，切换角色恢复默认展开。标题图标沿用官方 20px SVG，在 28px 居中占位内显示，使文字与其他栏目对齐；沿用统一细分隔线和 18px 上下间距，页脚不叠加旧 30px 顶部空白。

终末地默认折叠（2026-10-05）：帝江号 endfieldSpaceship、地区建设 endfieldDomains 初始收起，点击标题展开；保持共享展开动画及同角色局部刷新时的手动展开状态。

概览下拉菜单（2026-10-05）：影拓丰碑主题和战争回响赛季统一使用 OverviewSelect.vue，复用 Element Plus 的选择与键盘交互，菜单通过 Teleport 避免被 OverviewReveal 裁切。浮层使用主题变量、圆角、柔和悬停／选中底色和选中勾号，窄屏限制宽度；不再使用浏览器原生 select 子菜单。

账号切换以 appCode/gameId/uid 三元组为 key 重建分组；同账号原位更新保留仍有效的主题、赛季、地区更多、光荣之路筛选与外层折叠状态。整组折叠与内部“更多”分别管理：光荣之路默认展开摘要；帝江号、地区建设、地区探索、战争回响、影拓丰碑外层默认收起。实时数据内部仍按两行收纳。

干员列表的搜索／展开全部是另一套状态：当前 `GameOverviewPanel.vue` 在 data 对象替换时重置，不承诺同账号刷新也保留。角色切换、数据替换与单纯语言切换要分别验证。

## 帝江号

2026-10-04 用户明确要求：终末地基建概况与帝江号合并。总控中枢等级只在帝江号显示；旧响应仅有 `cnsLevel` 时仍在帝江号保留等级，不能随重复卡片一起丢弃。此项与用户提供的舱室截图是本节依据，不代表其余终末地 UI 已完成核对。

舱室显示等级／等级上限、进驻人数／容量、实际进驻干员头像及姓名。总控等级上限 5、其他已支持舱室 3、容量 3 来自已核实官方 codec；后端返回 `maxLevel` 与可选 `staff`。驻员只能来自 `spaceShip.rooms[].chars`，按 charId 匹配已取得的 chars 名称（优先 charData.id，再匹配外层 id，两个 ID 分别索引；ID 不对应时允许按上游官方完整头像 URL 唯一匹配档案，共用 URL 不推断）；头像优先房间记录 avatarUrl，再取匹配 charData 的 avatarSqUrl / avatarRtUrl，均经官方 CDN 校验。不能用账号干员列表顺序代替驻员关系。`staff=[]` 表示无人进驻；null／缺字段表示驻员详情未知；当前组件若已有明确 current=0 仍显示无人，否则保留已有计数并显示缺失说明；图片失败复用 `OperatorAvatar` 文字兜底，不改变卡片布局。后端字段、OpenAPI 与两端解析需同步，兼容线上旧响应。

## 地区探索

2026-10-04 用户截图确认：六类探索合并为一个「地区探索」，按地区罗列，默认显示 5 个地区，其余通过「更多」展开并可收起。外层与其他详情一致使用原生 `details/summary` 和 `vAnimatedDetails`，默认折叠；展开后显示前 5 项，「更多／收起」放在列表下方，沿用现有透明、居中的整行展开按钮样式。使用 `EndfieldExploration.vue`，复用 `OverviewReveal` 动画；切换账号重置展开，刷新同账号保留展开。标题使用官方 `ef-regionExplore.png`（GameData 模块 `Oa` 引用 `wn`），不能用通用地图图标替代。区域图、地区名、所属大区在左，同列数字上下对齐；手机保留六列顺序、缩小缩略图并换行地区名，禁止整页横向溢出。缺图仍保留图片位置。

`overviewSections.ts` 按后端 domainId:levelId 合并，不能按名称或数组位置关联；排序优先级为 indie_dg016 置顶、非旧地区在前、旧地区按代码内 legacy 列表置后；同优先级保留首次出现的大区顺序，再按 levelId 降序；保留零值和部分缺失，缺失项显示横线，上限 0 显示单横线。列顺序按[官方 RegionExploreTable](https://assets.skland.com/_static_assets/game-tools/RegionExploreTable-D36RE3Dz.js)核实为储藏箱、醚质、黑盒、维修灵感点、装备储藏箱、其他；图标需有可访问名称和悬停标签。不将未核实的类别改名为推测玩法。无需新增请求或改后端计数契约。

## 地区建设

地区建设用 `RegionalDevelopment.vue` 将地区与原始 `domain[].settlements` 据点归组，摘要列出地区等级、调度券与上限、据点名称／等级；更多详情保留据点发展值与上限／MAX、调度券储量与上限、实际派驻干员头像和姓名。`moneyMgr.count/total` 是地区持有的调度券；`remainMoney/moneyMax` 是据点剩余调度券储量，不能合并或相加为同一余额。谷地／武陵按地区分别命名，未知地区不猜专属货币名。

官方 `DomainDataCodec` 将原始 `expToLevelUp` 映射为 `expMax`、`officerCharIds` 映射为 `officerCharId`（该版本是单个字符串标识）。直接读取原始字段；MAX 只取 `isFinalMaxLevel=true`，不能由等级、经验满条推断。等级 0 为未解锁，缺等级为未知。经验上限 0 保留数值，不相除；缺字段用横线。派驻只取据点记录，姓名按 charData.id／外层 id 或唯一完整官方头像 URL 匹配档案，不能按持有干员顺序分配。`officerCharAvatar` 优先，无图用档案合法官方头像，再文字兜底。

地区建设布局迭代（2026-10-05）：每个地区为独占一行的长卡片，标题与调度券余额只显示一次；卡内据点在宽屏横排、窄屏换行。每张卡底部独立的更多／收起通过 OverviewReveal 展开各据点的派驻、发展值与储量，不另建重复地区详情卡。展开状态按地区 ID 保存，同账号刷新保留，切换账号重置。

## 光荣之路

终末地日常状态之后、帝江号之前显示 GloryRoad.vue，外层复用原生 details/shared animation，默认显示概览；底部更多展开完整已获得奖章列表。概览保留上游 count、三档计数与 10 个账号设置的展示位置，上排 1/3/5/7/9、下排 2/4/6/8/10，不能以最近获得奖章填充空位。已迁入该分组的 achievements／medalLevel1–3 不在顶部收藏统计重复展示。gloryRoad 为可选契约，旧接口保留已有数量并提示详情不可用；对象内部 display／medals 的 null 与空数组区分。

列表按官方 achieve-detail-CoqJrXCS.js 排序：获得时间倒序，同时间等级倒序；切换等级排序后，同等级再按时间倒序。筛选提供等级、镀层、认证；认证资格为 canCertify=true 且 level=3，缺失字段不视为 false。桌面紧凑多列、手机单列，保留名称和日期完整换行；筛选、展开状态同账号刷新保留，换账号重置。图片沿官方 CDN 校验与失败回退，新增通用空六边形／认证素材在 sources.json；完整奖章图来自接口，不保存私人图集。回归 tests/e2e/glory-road.spec.ts、api-boundary.test.js。

光荣之路概览卡保留官方 Ia（medalCardBg-BkS_UR-_.png）的等高线／颗粒纹理；背景层按主题融合，不自行绘制假纹理或反色奖章。来源与哈希记于 src/assets/skland/sources.json。

## 战争回响

2026-10-05 按用户确认方案合并为单一折叠分组。`WarEchoesDetails.vue` 展示赛季横幅、评级、模式荣勋、轮换及关卡；`EndfieldRecordCard.vue` 共用记录卡保留普通／困难／残酷各自的最佳记录、历史编队属性、关卡描述、敌人资料。默认当前赛季／轮换，日期无匹配时取开始前首项或结束后末项；所有返回赛季、轮换与难度均可查看。刷新同账号保留选择与展开，切换账号重置。外观复用主题边框、小圆角、原生折叠与共享动画；官方素材由清单同步，不重画评级或星标。

后端概览新增可选 `warEchoes`，角色归属验证后并行读取官方 `/web/v1/game/endfield/card/war-echoes`（不传 seasonId 获取返回的赛季集合）。此接口与 card/detail 不同；前者失败时保留后者的赛季摘要并标记详情暂不可用，不使全部概览失败。旧前端 sections 保留兼容，新前端有嵌套数据时隐藏重复的周期、挑战分组。`passTs` 是秒数耗时，`ts`／`firstPassTs` 是 Unix 秒，不混淆；最佳记录仅在 isPass 为 true 且耗时为正时有效。荣勋来自 warEchoes.achieves；金级计入金银铜，银级计入银铜，只统计 firstPassTs>0 的已获得项，缺字段不能当作零或未获得。未获得荣勋名显示未探明。编队来自各难度 bestRecord.chars，等级等使用历史记录，姓名可匹配现有档案 ID 或唯一完整官方头像 URL，不能用持有干员替换队伍。

战争回响赛季切换（2026-10-05）：将 OverviewSelect 的 heading 外观嵌入赛季横幅标题，标题与下拉箭头本身即入口；不保留卡片上方的独立“赛季”表单行，也不重复显示当前标题。单赛季只显示静态标题。下方保留日期，横幅素材随选择更新；选择菜单仍 Teleport 并支持键盘、主题及长名称换行。heading 外观不修改其他使用 OverviewSelect 的普通选择栏。

战争回响更多收纳（2026-10-05）：赛季选择、横幅、赛季评级及荣勋保持概览可见；其下轮换标签、周期、本轮评级、关卡导航和全量战斗记录默认收入底部“更多”。复用 OverviewReveal 动画、箭头旋转及 inert／aria-hidden，展开后按钮在内容底部显示“收起”；收起保留赛季／轮换选择，同角色刷新保留展开状态。war-details 使用 flow-root 包含外边距，确保底部记录不被裁切。

战争回响专属编排（2026-10-05 用户提供官方 stage-detail 截图）：轮换下方以横排关卡卡片展示星级和名称，点击定位到对应关卡；各关卡保留全部难度，普通／困难／残酷独立成卡，不再共用一个大边框。组标题为关卡名与最佳记录，额外挑战的已完成／未完成状态进入机制详情，减少常驻重复行。普通／困难共用官方 stage-detail-DGptjXe5.js 的 war-echo-level-detail-card-bg-tpOcJ3Oe.png 底纹，叠加 DungeonRecordCard 的 bg-left-KX4hJsGd.png 左侧颗粒渐变；残酷额外叠加 cruel_mode_bg-Dcu9f__0.png，按官方 rightBackgroundFullSize 全卡居中 cover。不得用 CSS 径向渐变或丰碑苦难右下斜纹替代。保留原图，浅色仅对灰阶底纹反色并融合主题，残酷彩色叠层不反色。关卡导航保留键盘操作、当前定位标识、主题颜色和窄屏三列换行，减少动态效果时禁用平滑滚动。

荣勋列表（2026-10-05 官方截图对齐）：沿 honor-detail-DyHS7yPO.js 的横向卡片，名称居左、徽章居右。明确未获得只显示“未探明”及官方 j 灰色六边形徽章（ef-war-unearned），不重复“尚未获得”、不提前透露名称、不使用铜徽章代替未获得。已获得保留名称、对应等级徽章及日期胶囊；未知获得状态仍显示资料缺失，不推断为未获得。统计留在折叠标题，展开后列表容器占满内容宽度，内部使用自适应紧凑网格（每列至少 240px，窄屏单列）；保留左侧名称、右侧徽章，不能将每张卡片在桌面拉满整行，也不挤在赛季评级右侧半栏；卡片沿项目主题表面与边框。

荣勋布局动画（2026-10-05）：使用 vHonorDisclosure 串联两个阶段。桌面展开先动画展宽赛季评级、将荣勋移到下一行，再展开列表；收起先折叠列表，再缩回并排布局。布局状态独立于 details.open，父容器高度一并过渡，三角随内容展开旋转。快速点击以最新意图为准，当前阶段结束后可反向；窄屏已上下排列则省略布局阶段，减少动态效果时直接切换，窗口宽度变化取消过期的尺寸动画。实现位于 `src/common/honorDisclosure.ts`，它自行管理 summary 与 `.facility-content`，不要在同一荣勋 details 叠加 `vAnimatedDetails`；两阶段状态使用 `data-details-expanded` 共用三角样式。

## 影拓丰碑

影拓丰碑使用 `MonolithDetails.vue`／`MonolithTheme.vue`，后端当前主题取概览 `indieHardGroups[0].id`，前端按 `currentThemeId` 匹配，失配回退 themes 首项，主题标题可选择独立接口返回的全部主题。后端 `GET web/v1/game/endfield/card/indie-hard` 在角色归属校验后与 card/detail、war-echoes 并行读取；失败保留概览并标明详情不可用。新可选契约为 `regionalDevelopment`、`monolith`，旧 sections 留作兼容，有新数据时隐藏重复据点和旧简单丰碑计数。

官方 `umbral-monument` 明确 On 选择 hardDungeon（苦难），Off 选择 normalDungeon（普通）；本地直接显示难度名称。逐关保留两种难度状态，false=未通关，null=状态未提供，不能把所有缺记录都叫未挑战。最佳记录 `passTs` 为秒数耗时，`ts` 为 Unix 秒，只有 isPass=true 且耗时>0 才展示成功记录。历史队员等级／潜能／突破来自该次 bestRecord.chars；姓名可按档案匹配，不以当前养成覆盖历史属性。敌方情报保留 imageUrl/name/level/desc/ability；机制保留关卡 name/desc/feature/recommendLevel。机制／敌人描述中的 `<@ba.info>…</>` 等游戏强调标记由 `endfieldPlainText` 去除，仅保留正文及换行；仍使用文字插值，不执行上游 HTML。合成单测覆盖标记清理、普通文本及惰性 HTML。

蚀刻章来自主题 `achieve`：obtainTs>0=获得，0=未获得，缺失=未知；isPlated 独立保留 true／false／null。图片优先镀层 platedIcon，否则按 level 2/3 使用 reforge2Icon/reforge3Icon，其余 initIcon；缺图回 initIcon，未获得使用官方 Xn 占位，不把缺图推断成未获得。主题进度逐关展示普通与苦难是否通关，不编造百分比。

影拓丰碑单卡布局（2026-10-05）：主题选择器融入唯一主题概览卡的标题（多个主题时显示），默认当前主题，切换后原位替换封面／进度／蚀刻章。更多只展开所选主题的记录和关卡详情，收起保留所选主题；禁止同时渲染固定当前主题卡与所选主题卡。

影拓丰碑主题切换（2026-10-05）：与战争回响保持一致，OverviewSelect heading 外观嵌入 MonolithTheme 标题插槽，去掉上方独立选择行；活动期仍保留活动标题与日期，菜单展示各主题名称。单主题使用静态标题，选择后原位更新封面、进度、蚀刻章及记录，不新增第二张主题卡，保留更多与难度状态。

影拓丰碑主题卡（2026-10-05 用户截图修正）：左侧封面、右侧主题名与活动日期、逐关分段进度、蚀刻章横条。进度沿官方 wr/hr：苦难通过优先黄色、仅普通通过其次、明确均未过为灰色；缺失状态使用带问号的灰段，不能视为未通关。使用官方 Yn 标识和 $n/er/tr 段素材，每段可聚焦并提示完整关卡名及两难度状态，不再默认展示多行关卡清单。蚀刻章文字居左、图居右，点击横条通过原生 details 与共享动画展开获得／镀层状态、等级、名称及日期；摘要与官方 Cr 一致：优先显示已镀层，其次已获得，未获得或字段缺失均只显示“蚀刻章”与默认章图，不追加“状态未提供”副标题或悬停提示；底层仍区分 false/null，未知说明仅保留在主动展开的详情中。标题／活动日期、图片失败兜底、全量记录保持不丢失。

影拓丰碑封面（2026-10-05）：官方 umbral-monument-jhlt_L1E.js 的 rr/or 将 122×152 的完整透明素材盒置于 90×120 的海报底板盒，四边偏移 −16。按此比例等比显示，让矩形底板贴齐卡片，雷电／角色等装饰可溢出，不把完整 PNG 缩在带内边距的小缩略图中。边框与底色只放在右侧内容区，左侧直角且无边框，右侧保留圆角，避免外层 1px 边框将海报内缩产生接缝。只对主题封面开放溢出并预留外侧空间，避免被外层折叠容器裁切；缺图回退图标不应用装饰扩张。窄屏长标题和蚀刻章详情允许卡片增高，保持图片比例和文字完整。

苦难呈现（2026-10-05）：记录卡仅在苦难模式显示官方 DungeonRecordCard 的 bg-right-C2XtR6xt.png 红色纹理，固定在右下角并降低透明度，不影响内容高度或点击。难度选择参照官方左侧开启、右侧关闭的胶囊双段布局，使用明确的苦难／普通文案，旁边保留官方 Dr 苦难标识。底板、边框、文字沿用项目主题变量，选中底板平滑位移，减少动态效果时停用过渡。

影拓丰碑展开高度：monolith-detail 使用 flow-root 包含难度栏的上下外边距，避免外边距折叠到 OverviewReveal 测量范围之外、裁切最后一张卡片。验证底部卡片边框包含在展开容器中，含嵌套详情切换和窄屏换行。

## 历史记录卡与干员档案

影拓丰碑记录卡（2026-10-05 用户截图修正）：使用 EndfieldRecordCard.vue，沿官方信息位置排布，标题／通关标记左上、日期位于标题下、耗时以 mm:ss 在右上、敌方情报／机制特性入口左下、四个编队槽位横排于右下。空记录保留四个占位，缺少队员不能补造。头像左上显示属性、左下显示历史等级、右下显示潜能，不显示右上突破图标；底部色条按官方 DungeonRecordCard 的 rarity 映射（6 星橙、5 星黄、4 星紫），不得用主题粉色或突破阶段替代。使用官方 CharElementIcon／CharPotentialIcon 原始素材；潜能 0 与突破 0 均为有效值，缺失不推算，点击头像展开完整姓名、突破、潜能、稀有度和属性；关卡资料分别按入口展开。保持项目主题边框／底色和单列卡片，不把完整养成档案默认铺成两列长列表，不再重复外层关卡名与内部难度标题。战争回响与影拓丰碑复用同一 EndfieldRecordCard.vue，保持小卡片、头像角标、稀有度色条、空编队占位及详情入口一致。战争回响普通／困难／残酷全部保留，额外挑战状态、首次通关与目标保留在机制详情；不要把战争回响困难误当成丰碑苦难来套红色纹理。

空编队槽位（2026-10-05）：影拓丰碑使用官方 DungeonRecordCard-u3WKcZOq.js 的 w 圆圈斜杠 PNG（ef-record-empty），不能用 CircleClose 圆圈叉号替代。以原图轮廓遮罩配合主题 muted 色，居中占槽位约三分之一，四槽尺寸和头像槽位一致。

终末地干员档案（2026-10-05 用户修正）：默认仅显示 48px 头像和右侧姓名。头像左上官方属性、左下等级、右下潜能、底部官方稀有度色条，与记录卡共用 EndfieldPortraitBadges；禁止把等级／属性／稀有度继续铺成姓名右侧的多行文字。点击头像姓名行以共享 details 动画按顺序展开等级、突破、稀有度、潜能、职业和属性，保留零值／缺失区分、键盘操作、搜索及展开全部。明日方舟档案维持已核对布局。

终末地养成详情统一（2026-10-05）：干员档案、战争回响／影拓丰碑编队详情共用 EndfieldOperatorFacts。姓名下方使用 11px 的紧凑可换行信息行，顺序固定为等级、突破、稀有度、潜能、职业、属性，不再拆成“Lv.／潜能”和“星级／属性”两行。战斗记录保留历史值；未返回职业时不从当前干员档案补造。

终末地档案网格密度（2026-10-05）：以档案容器实际宽度决定列数，窄屏 1／2 列、中等 4 列、宽屏 6／8 列；头像维持 48px，条目上下间距 4px、头像姓名间隔 8px，不通过缩小角标或裁切姓名提高密度。OverviewReveal 的收起高度取前 N 项底边最大值，不能只取最后一项，确保同排任何干员展开详情均完整可见。

## 定位数据与交互故障

完整概览请求失败、合法响应的 detailAvailable=false、合法空数组与 null 是不同状态，先沿 [数据流与状态](architecture.md) 区分再修 UI。`OverviewSelect.vue` 提供默认表单和 heading 两种外观；选择值、有效 ID 回退由父组件维护。战争回响换赛季重置 weekId，换轮换重置 activeStageId 和锚点映射；丰碑选择主题不重置已选难度。

## 来源与验证

以下是既有核对记录；本次文档更新仅对照本地源码、来源清单与合成测试定义，不新增官方核实结论。

核实来源：官方 `dist-BZImVwlH.js` WarEchoesCodec、`GameData-CKtD4-ed.js` 的评级／星标／轮换函数、`war-echoes-C7XS9Zk9.js` 和 `silver-CMo64lkE.js` 的详情与荣勋统计，均位于 https://assets.skland.com/_static_assets/game-tools/ 。资源变量和 SHA-256 记录在 sources.json。回归入口 `tests/e2e/war-echoes.spec.ts`；后续验证分别覆盖合成全数据和真实账号可用的记录状态。

既有来源记录（2026-10-05；当时仅检查公开模块文本，未执行模块）：[codec](https://assets.skland.com/_static_assets/game-tools/dist-BZImVwlH.js)、[地区详情](https://assets.skland.com/_static_assets/game-tools/region-dev-detail-Cq-A_xh2.js)、[丰碑详情](https://assets.skland.com/_static_assets/game-tools/umbral-monument-jhlt_L1E.js)、[记录卡](https://assets.skland.com/_static_assets/game-tools/DungeonRecordCard-u3WKcZOq.js)、[主页](https://assets.skland.com/_static_assets/game-tools/GameData-CKtD4-ed.js)。货币用途交叉核对游戏物品资料及[据点管理](https://wiki.biligame.com/zmd/据点管理)／[谷地调度券](https://wiki.biligame.com/zmd/谷地调度券)，页面代码确认具体字段落点，不从截图数字猜资源。

按变更选择现有回归：`tests/e2e/*.spec.ts` 使用 `npm run test:e2e -- <测试路径>`，`tests/*.test.js` 使用 `node --test <测试路径>`；`tests/fixtures/` 只是供测试导入的合成数据，不直接运行。测试名称仅说明覆盖范围，不表示本次已经执行。

| 涉及模块 | 测试路径（相对仓库根目录） |
| --- | --- |
| 帝江号、地区探索、旧响应、标题 | `tests/e2e/endfield-ui.spec.ts`、`tests/overview-sections.test.js` |
| 地区建设、影拓丰碑、账号切换、记录底部裁切 | `tests/e2e/endfield-development.spec.ts`，夹具 `tests/fixtures/endfield-development.js` |
| 战争回响全难度、部分详情、历史队伍 | `tests/e2e/war-echoes.spec.ts` |
| 荣勋两阶段动画、反向切换、减少动态效果 | `tests/e2e/honor-animation.spec.ts` |
| 光荣之路展示墙、筛选、空／未知／旧数量 | `tests/e2e/glory-road.spec.ts` |
| 干员角标、零潜能、详情、窄屏密度 | `tests/e2e/operator-archive.spec.ts` |
| 契约、文本、资源 | `tests/api-boundary.test.js`、`tests/endfield-text.test.js`、`tests/overview-assets.test.js` |

检查 320px／390px 与桌面、中英文、明暗主题、缺图、长名称、零值和未知。嵌套详情展开后，`OverviewReveal` 必须包含最后一张卡片底边；monolith-detail／war-details 的 flow-root 用于包含外边距。源码中的合成覆盖和历史真实账号记录，均不等于本次已验证线上行为。
