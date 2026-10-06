---
name: endfield-essence-data
description: 用于 EasonWeb 终末地基质计算器与养成计算器的统一版本同步，更新共享干员、武器、词条、掉落池、养成消耗、经验折算、翻译和素材，也用于基质推荐排查；不用于森空岛账号概览或私人养成记录同步。
---

# 终末地双计算器数据同步

保留调用名 `$endfield-essence-data`，同时维护基质与养成计算器。路径均相对于 EasonWeb 仓库根目录。两者共用本地目录与素材，无需登录。

## 一次对话的更新入口

用户说“同步两个计算器到最新版本”“更新终末地计算器数据”，或通过本 skill 发起版本更新时，默认完成两者的整套版本同步：查明已实装版本、取得并核对固定来源、更新统一数据和相关素材、适配必要的导入与校验代码、运行回归、交付差异。未指定版本时采用执行当日可确认的国服最新已实装版本。用户明确限定单项时遵守该范围。

示例：`请使用 $endfield-essence-data，将基质计算器和养成计算器的全部数据及素材同步到最新已实装版本，并完成验证。`

执行更新先读 [版本同步流程](references/version-sync.md)，再按需读 [基质字段与来源](references/data-sources.md) 和 [养成数据说明](../../../src/constant/game/hypergryph/endfield/GROWTH.md)。查找来源、更新导入器的旧版本锁定、处理新增 ID、补图片及回归均属于这次本地更新，不把常规步骤拆成新的用户请求。仅询问无法从公开证据确定且会影响结果的范围或冲突；上游缺项必须明确报告，不能称为全部同步完成。

## 按问题定位

| 任务 | 先读 |
| --- | --- |
| 新版本、全部数据与素材同步 | [版本同步流程](references/version-sync.md) |
| 单项武器／淤积点纠错 | [基质来源与字段映射](references/data-sources.md) |
| 推荐覆盖、主副技匹配、高亮不符 | [计算契约与验证](references/calculator.md)；`src/common/endfieldEssence.ts` |
| 养成消耗、等级、天赋、低阶折算 | [养成数据说明](../../../src/constant/game/hypergryph/endfield/GROWTH.md)；`src/common/endfieldGrowth.ts` |
| 素材来源和本地图片维护 | [森空岛资源说明](../skland-frontend/references/assets.md) |
| 页面布局、主题、国际化 | [easonweb-development](../easonweb-development/SKILL.md) |

## 共享入口

| 路径 | 职责 |
| --- | --- |
| `src/constant/game/hypergryph/endfield/catalog.json` | 唯一事实数据：干员、武器、材料、地区、筛选枚举、经验折算 |
| 同目录 `index.ts`、`weapons.ts` | 类型、ID 索引、基质投影；兼容入口与地区匹配，不复制事实记录 |
| 同目录 `sources.json`、[README.md](../../../src/constant/game/hypergryph/endfield/README.md) | 分领域版本、固定来源、文件哈希和维护说明 |
| `src/common/endfieldResources.ts` | 两个页面的统一数据与素材入口 |
| `scripts/import-endfield-growth.py` | 已固定版本的养成导入器；升级前核对并调整，不是自动追踪最新版的完整同步命令 |
| `src/assets/skland/sources.json`、`scripts/sync-overview-assets.mjs` | 素材来源、哈希、离线检查和显式重取 |
| `src/pages/game/hypergryph/endfield/` | 两个计算器、共用头像与筛选图标、养成编辑器 |

## 核心约束

- 干员与武器以稳定 ID 关联；武器名称、稀有度、类型只存一份。显示翻译不改变基质中文规范词条。保持已选武器顺序和 `essenceOrder` 的可解释性。
- `attribute2: null` 表示三星武器无附加属性限制，不表示未知。地区必须同时满足主属性、副属性及技能掉落池，覆盖数与高亮使用同一最终定向方案。
- 更新不仅追加新内容，也检查旧条目的勘误和数值变动。养成与经验表来源可有不同版本号，分别记录；来源未更新不能只改本地版本文字冒充更新。
- 保留用户工作区改动与本地计划。范围是公开游戏事实、素材和必要的本地适配；账号练度／仓库同步、后端修改、发布和定时监控不由本 skill 自动触发。
- 普通排错、文档维护不刷新远端游戏数据。本地快照和历史来源不是“当前最新”的证据。

## 验证与交付

版本同步按 [完整验证](references/version-sync.md#验证与完成条件) 执行。单项代码改动按影响面验证，不能用构建成功替代计算或浏览器检查。交付目标版本、更新范围、来源、数量变化、验证结果及尚缺的证据或素材。仅修改 skill 时检查结构、链接、源码契约和命令，不必运行应用构建。
