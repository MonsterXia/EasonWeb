# 养成计算器数据与边界

核对日期：2026-10-05（Asia/Shanghai）。统一的 `catalog.json` 中养成部分是游戏 v1.5 的离线快照，包含 32 名干员、80 把武器与 39 种养成材料（含 5 种低阶经验材料）。页面位于 `/game/hypergryph/endfield?tool=growth`，与基质计算器并列，无需登录。

## 来源

- 交互与预设参考[森空岛官方养成计算器](https://game.skland.com/tools/endfield/cost-calculator)。2026-10-05 的公开模块 `cost-calculator-DlHbGmGk.js` 定义基础（60/6/60）、进阶（80/9/80）、精通（90/9/90）、卓越（90/12/90）。三个数字分别为干员等级、技能等级、武器等级。
- 官方公开[文案](https://assets.skland.com/_static_assets/game-tools/locales/zh_Hans.json) 的 `cost_calc_rules_4` 规定目标 20/40/60/80 级默认计入突破和装备适配。公开 `dist-BZImVwlH.js` 中的计算流程按干员/武器分别累计经验，再对各经验素材向上取整。
- 数值与游戏名称来自 [CEP 固定提交的游戏数据](https://github.com/cmyyx/cep/tree/286962b95408078ca91c99dece748d74166e74b1/src/generated)：`data/planner.ts`、`data/wiki/{characters,weapons}.ts`、`i18n/{characters,weapons,wikiData}/{zh-CN,en}.json`。其维护文档将上游标为 AKEData 游戏表。仅提取等级消耗、养成材料、节点、正式名称等事实数据，未复制其程序算法或 UI。头像地址来自同提交 `public/images/characters/sources.json`，仅保留森空岛 CDN 地址，失败回退文字。
- 游戏内容权利归鹰角网络及相关权利人。CEP 程序标注 AGPL-3.0，复用其程序代码时需另行遵循对应许可。

`sources.json` 的 `growth` 记录固定提交、核对日期与养成来源，`catalog.sha256` 记录统一数据文件的 SHA-256。官方材料接口本次返回 401，因此**未完成登录后的官方结果逐项对照**；不将离线测试描述为官方接口验证。

## 计算约定

- 干员和武器升级使用对应等级行的经验/折金票，累计区间为 `[当前等级, 目标等级)`。经验使用每份 10,000 点的高级素材；干员 1→60 和 60→90 分别取整，每个目标分别取整再相加。
- 干员精英化分界采用等级表中的突破行 20/40/60/80，不用天赋节点的 `requiredLevel` 充当等级上限。精英化与装备适配材料分别存储；目标默认计入对应装备适配，当前已解锁的装备适配阶段可单独修改。
- 处于分界等级时可选择当前是否已突破，目标默认完成突破；当前已完成的阶段不重复收取。技能按每一级目标行累计；天赋仅计入计划解锁且尚未拥有的节点。
- 基础预设不选额外天赋，其余预设选择目标阶段可用天赋。默认使用卓越；切换预设按官方手动模式将当前练度重置为 1，手动编辑标记为自定义；手动等级限定 1–90，技能限定 1–12。配套武器按干员武器类型筛选，新选武器沿用干员当前预设的武器目标，自定义时使用卓越默认值；其材料并入干员总计与独立明细。战斗和后勤天赋按同一分支联动前置／后续节点，能力提升独立选择。
- 同一清单的库存仅扣除一次；差值为库存减消耗，正数剩余、负数短缺，仍需总览只展示缺少项。可关闭扣除库存，切换为所需总览。高级库存填写实际件数；低阶经验材料单独填写，同类型、同等级段合并经验后按每 10,000 点向下取整。差值使用实际高级库存＋折算件数，不改写用户输入；不足一份的余量单独展示。技能／突破材料不折算，自选箱不自动扣除。练度和库存手动填写，不调用账号接口。
- 两个模式分别计算，切换模式或基质/养成标签保留本次页面内的输入；开始计算时在此浏览器保存 90 天内最近 5 次练度记录（不保存库存），可恢复继续编辑；恢复时校验目标、上下限与武器类型，过期或损坏记录忽略。没有云端历史记录。

## 官方逐项对照（2026-10-05）

本次依据官方公开模块和文案核对行为并独立实现。2026-10-06 补充依据用户提供的官方选择、筛选、技能与天赋阵列截图对齐结构。官方页面在未登录环境显示登录提示，规则接口返回 401；未取得登录后的材料响应，不能据此声称全部数值与当前官方账号一致。

| 项目 | 官方证据／行为 | 本地实现 |
| --- | --- | --- |
| 双模式与上限 | `cost_calc_select_operator_count_tip`、`cost_calc_weapon_limit_tip`：1–8 项 | 干员／武器分别保留清单；零选择禁用确认；8 项后仅允许取消 |
| 目标编辑 | `controller-D45F8z-s.js` 的当前目标与删除邻项逻辑 | 头像列表切换单个编辑器，保存每个目标输入；移除后选邻项 |
| 默认及预设 | 同模块初始化选择 PERFECT；手动模式从 1 开始；基础不选额外天赋 | 新增默认 90／12；四档数值一致，选中高亮，手动编辑为自定义；重置说明直接展示 |
| 配套武器 | 同模块新选武器按当前预设获取目标，自定义回退 PERFECT | 按武器类型筛选；60／80／90／90 目标跟随预设 |
| 天赋前置 | 同模块 `toggleTalent`：ability 独立，combat/cultivation 高阶包含前阶、取消级联后阶 | 用事实表的分支与阶段实现联动；已拥有节点不计费；后勤名称按 index/level 对应正式词条 |
| 分界等级 | `cost_calc_rules_4`：20／40／60／80 包含精英化和装备适配 | 目标默认包含；支持单独设置已完成突破和装备适配 |
| 库存差值 | `cost_calc_difference`、`cost_calc_diff_explanation` | 总计＋已有＋有正负号的差值；库存开关、所需／仍需总览 |
| 分项明细 | `cost_calc_cost_details`：升级、技能、武器 | 按目标展开升级、技能、天赋、配套武器材料 |
| 最近查看 | `cost_calc_rules_5`：90 天内最近 5 次 | 浏览器本地记录，点击恢复，可清空；不假装云端同步 |
| 主题与手机 | 官方独立移动页面、游戏风格 UI | 沿用本站樱花主题与语义颜色，适配 320px、中英文和明暗模式；结构与行为对齐，不声称视觉完全一致 |
| 账号与仓库同步 | `cost_calc_rules_2/6`：同步练度、仓库，约 30 分钟延迟 | 尚未接入；明确手动填写，不显示虚假的同步开关或已拥有筛选 |
| 低阶折算、自选箱 | SDK `getHighPriorityItemCount`、`cost_calc_low_tier_conversion` | 已实现三组经验库存折算、向下取整、余量展示；不跨等级段，不转换技能／突破材料。自选箱仍未实现 |
| 官方素材与分享 | 结果材料图标、武器图标与分享页 | 干员用官方 CDN 头像；80 武器与 37 材料采用下述本地游戏原图；武器检查单元／装置暂无可用图标，保留名称与数量。尚无官方分享图与二维码 |

参考公开资源：[编辑控制器](https://assets.skland.com/_static_assets/game-tools/controller-D45F8z-s.js)、[预设常量](https://assets.skland.com/_static_assets/game-tools/cost-calculator-DlHbGmGk.js)、[桌面结果布局](https://assets.skland.com/_static_assets/game-tools/cost-calculator-DhDhL4lg.js)、[计算 SDK](https://assets.skland.com/_static_assets/game-tools/dist-BZImVwlH.js)。模块名随官方发布可能变化；本项目未复制这些实现代码。

## 低阶折算与图标来源

`catalog.json` 的 `experienceGroups` 记录折算事实值，低阶材料名称、图标 ID 与稀有度统一存于 `materials`；`sources.json` 的 `experience` 记录版本与源文件 SHA-256。依据 [ExpItemDataMap](https://data.akedata.wiki/public/1.5.3/10506507-7/TableCfg/ExpItemDataMap.json) 和 [WeaponExpItemTable](https://data.akedata.wiki/public/1.5.3/10506507-7/TableCfg/WeaponExpItemTable.json)，固定游戏表版本 `1.5.3@10506507-7`（不据此升级原有等级消耗快照）：

| 高阶输出 | 低阶输入 | 单份经验 |
| --- | --- | --- |
| 高级作战记录（1–60 级） | 初级／中级作战记录 | 200／1,000 |
| 高级认知载体（60–90 级） | 初级认知载体 | 1,000 |
| 武器检查套组 | 武器检查单元／装置 | 200／1,000 |

三种高阶材料均为 10,000 经验。示例：49 初级＋1 中级作战记录共 10,800 经验，折合 1 高级并显示余 800；整个计划共用这 1 份库存，不能按每个目标重复扣除。余量按官方规则不抵扣不足一份的高级需求。

114 张图为同一固定 CEP 提交的游戏原图 AVIF，另有 3 张低阶作战记录／认知载体原始 PNG 来自 AKEData 游戏资源镜像，按 `ItemTable.iconId` 匹配（不要用 item ID 猜图；例如高级作战记录对应 `item_expcard_2_3`）。CEP 资源管线说明原图来自 AKEData 游戏资源镜像。它们是第三方镜像提供的游戏素材，**不是本次从森空岛 CDN 获取的图**；权利仍归游戏权利人。资源级 URL、SHA-256 和事实 ID 记录于 `src/assets/skland/sources.json`，通过现有 `sync-overview-assets.mjs` 检查／重取，运行时只加载本站构建文件。保留图像原色和完整比例，失败不隐藏名称或阻止选择。

## 技能与天赋编辑（2026-10-06）

等级、技能使用紧凑的当前 → 目标行，点击打开双列滚轮；干员／武器为 1–90 级，技能 10–12 级显示三档专精标识。中央选中行高亮，上下渐隐，支持鼠标按住拖动（松开吸附且不触发误点击）、滚动、触摸滑动、点击相邻项与方向键／Home／End／PageUp／PageDown。目标不低于当前值，抬高当前值时同步抬高目标；确认才写回计划，右上关闭或 Escape 丢弃本次草稿；底部只保留通栏胶囊确定按钮（内描边、官方等高线纹理及圆形勾号），使用本站主题色。突破与装备适配默认收起。天赋摘要显示已拥有及计划解锁的图标，编辑弹窗按能力提升、战斗天赋、后勤技能分支排列，支持切换当前／目标、全选与清除计划；目标视图不能取消已拥有节点。节点仍按突破阶段限制，战斗／后勤天赋联动前置节点，能力提升独立选择。

新增 179 张原始游戏技能、天赋、后勤及属性 AVIF，来自同一 CEP 固定提交的 `public/images/wiki/{skills,logistics}` 和 `public/images/panel-preview`。技能 iconId 来自 planner，天赋和属性图标映射来自固定 [CharGrowthTable](https://data.akedata.wiki/public/1.5.3/10506507-7/TableCfg/CharGrowthTable.json)，后勤图标及 α/β/γ 阶段来自 wiki 角色数据。表哈希为 `8a6bad97c01bf74243f64e5acd4412fdf03946aa0309fdf5f1ffdbf749a81202`。这次仅补充视觉字段，没有更换消耗数值。黎智彦的双属性自定义图标 `icon_attribute_wisd_will` 暂无可用原图，保留文字回退。专精六边形标识参考用户截图独立绘制；节点选择使用本站主题色，未解锁后勤图标以灰度区分。

## 更新与验证

取得上述固定提交的上游源码后运行：

```sh
python3 scripts/import-endfield-growth.py /path/to/cep /path/to/CharGrowthTable.json
node --test tests/endfield-growth.test.js
npm test
npm run build
npm run test:e2e -- tests/e2e/endfield-growth.spec.ts
```

导入器只解析自动生成文件中的 JSON 字面量，不执行上游 JS/TS。输出写入统一的 `catalog.json` 与 `sources.json`，按稳定武器 ID 保留已有基质词条、排序、掉落池和经验折算规则；出现新增／删除武器或共享稀有度／类型变化会停止，要求先核对统一记录，避免静默丢失另一计算器的数据。更新时先核对实装范围与表结构，再修改脚本固定提交、版本和日期；同步检查名称、所有材料引用、等级行完整性及 20/40/60/80 分界。浏览器回归覆盖选择/取消/删除、8 项上限、配套武器、预设、库存、标签保留状态及中英文、浅深主题、320px 窄屏；外部头像网络在测试中被阻止。
