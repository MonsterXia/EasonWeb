---
name: endfield-essence-data
description: 用于 EasonWeb 终末地基质计算器的武器或淤积点数据更新、名称与词条纠错、地区匹配和推荐结果排查；不用于森空岛角色概览、养成记录或头像同步。
---

# 基质计算器数据与匹配

路径均相对于 EasonWeb 仓库根目录。先检查工作区现状，以当前代码和来源清单确定任务范围；计算器使用本地常量，无需登录。

## 按问题定位

| 任务 | 先读 |
| --- | --- |
| 更新游戏版本、新武器、新淤积点、纠正数据 | [来源与字段映射](references/data-sources.md)，再读数据目录的 `sources.json` 和 `README.md` |
| 武器没有匹配地区、推荐地图或高亮不符预期 | [计算契约与验证](references/calculator.md)，再读 `weaponMatchesRegion` 与页面 watcher |
| 英文显示、统计标签、选择或界面交互 | [计算契约与验证](references/calculator.md)；界面规范另用 `easonweb-development` |

## 代码入口

| 路径 | 职责 |
| --- | --- |
| `src/constant/game/hypergryph/endfield/weapons.ts` | `WeaponData`、五种武器分组、`WeaponBaseMaterialRegion`、`weaponMatchesRegion` |
| `src/constant/game/hypergryph/endfield/sources.json` | 核对日期、快照版本、数量、固定提交和原始文件哈希 |
| [数据维护说明](../../../src/constant/game/hypergryph/endfield/README.md) | 已保存的来源、数据范围和修正记录 |
| `src/pages/game/hypergryph/endfield/BaseMaterialCalculator.vue` | 选择去重、属性计数、地区推荐、定向券与高亮 |
| `src/pages/game/hypergryph/endfield/EndfieldPage.vue` | 页面标题和计算器容器；路由 `/game/hypergryph/endfield` |
| `src/i18n/games.ts` | `game.calculator` 文案、`game.attributes` 中英文显示值 |
| `tests/endfield-materials.test.js` | 快照完整性、规范名称、真实三词条匹配 |

## 核心约束

- 保留 `WeaponData` 和地区契约。`attribute2: null` 表示三星武器无附加属性限制，未知值不能伪装成 null。
- 名称、中文规范词条用于选择、去重和计算；翻译仅用于显示。武器与地区必须使用同一套词条，不做单边缩写转换。
- `weaponMatchesRegion` 同时匹配主属性、非 null 附加属性和技能类型；技能专名不参与匹配。推荐覆盖数和定向券高亮是不同结果，见计算参考。
- `sources.json` 和数据说明是本地快照证据，不是最新版本承诺。只有任务要求游戏数据更新时才重新核对官方公告和固定提交。

## 验证与交付

数据或匹配修改运行 `node --test tests/endfield-materials.test.js`，新增翻译再检查 `tests/i18n.test.js`；代码变更完成后运行 `npm test`、`npm run build`。针对交互、推荐和语言切换的浏览器检查及现有测试边界见 [计算契约与验证](references/calculator.md)。仅修改 skill 时验证文档路径、契约和命令即可，不把业务测试通过当成文档行为验证。

数据更新交付采用的快照版本、增改数量、来源和未核实项；逻辑／文档任务说明实际变更和验证边界。保留任务开始时已有改动。
