---
name: endfield-essence-data
description: 用于 EasonWeb 终末地基质计算器数据过期、新武器或淤积点缺失、武器名称和属性错误、地区掉落匹配异常时。涵盖官方公告与开源数据核对、本地武器和掉落池更新及来源记录；不用于森空岛账号概览或头像同步。
---

# 基质计算器数据维护

路径均相对于 EasonWeb 仓库根目录。将已核实的游戏事实更新到本地快照；界面和计算仍离线运行。

## 入口与当前基线

先检查 `git status --short`，阅读下列文件；以文件中的现状确定更新范围，不把本 skill 当作最新游戏版本清单。

| 文件 | 作用 |
| --- | --- |
| `src/constant/game/hypergryph/endfield/weapons.ts` | `WeaponData`、武器清单、地区词条池、`weaponMatchesRegion` |
| `src/constant/game/hypergryph/endfield/sources.json` | 上次核对日期、游戏版本、来源提交、文件 SHA-256 和计数 |
| [数据维护说明](../../../src/constant/game/hypergryph/endfield/README.md) | 已核实的来源、历史修正和维护范围 |
| `src/pages/game/hypergryph/endfield/BaseMaterialCalculator.vue` | 名称选择与去重、属性统计和地区推荐 |
| `tests/endfield-materials.test.js` | 数据完整性及真实武器三词条匹配回归 |
| `src/i18n/games.ts` | 属性及技能类型的中英文显示词条 |

## 查找与固定来源

1. 查看[官方公告](https://endfield.hypergryph.com/news)，按用户指定版本或当前日期确认已实装武器、地区与生效时间。公告用于确定实装范围，完整三词条和掉落池另查数据表；预告或解包表出现不等于已经开放。
2. 优先检查[终末地一图流](https://github.com/Arknights-yituliu/ef-frontend-v1)和[CEP](https://github.com/cmyyx/cep)。先读取仓库元信息与最新提交，再固定提交 SHA 下载文件；`main` 的提交日期不等于文件的数据版本。核对文件路径是否变动及本次实际新增内容，勿直接复用旧 SHA 声称完成最新更新。
3. 固定文件地址形如 `https://raw.githubusercontent.com/Arknights-yituliu/ef-frontend-v1/<sha>/custom/core/weapons.json`。下载到仓库外临时目录，计算原始字节的 SHA-256；不执行上游仓库中的脚本来解析数据。
4. 两份来源按稳定武器／淤积点 ID 比较，确认名称、星级、类型、三词条和各掉落池。两个项目可能共享游戏数据源，一致性不能冒充独立的游戏内验证。来源冲突时定位到具体 ID 和字段；未解决的字段保留已核实值并在交付中说明。

来源失效时可查官方资料或其他维护中的公开仓库，记录替代依据。没有证据的名称、属性、地区归属不通过相似条目推断。更新请求不需要登录账号、提取凭证或改动后端。

## 字段映射

一图流文件以固定提交下的实际结构为准：

| 本地字段 | 数据来源 |
| --- | --- |
| `name` | `custom/core/items.json` 中对应武器 ID 的 `name['zh-CN']` |
| `type`、`rarity` | `custom/core/weapons.json` 的 `weaponType` 本地化值、`rarity` |
| `attribute1`、`attribute2`、`skill.type` | 武器 `stats.attribute`、`stats.secondary`、`stats.skill`，通过 `i18n/locales/zh-CN-weapons.json` 解析点分 key |
| `region` | `custom/core/energyAlluviums.json` 的 `battleName` 本地化值，取“重度能量淤积点·”后的地区名 |
| `attribute2Array`、`skillTypeArray` | 淤积点 `secondaryStats`、`skillStats` 的本地化值 |

- `attribute1Array` 与 CEP `src/data/dungeons.ts` 的 `s1Pool` 核对；当前是敏捷、力量、意志、智识、主能力五种提升，下次更新仍需确认。
- CEP `src/data/weapons.ts` 的 `primaryStat`、`elementalDamage`、`specialAbility` 分别对应三条基质属性；`src/data/dungeons.ts` 的 `s2Pool`、`s3Pool` 分别对应附加属性与技能池。比较集合，不要求上游排序一致。
- 技能专名从 CEP `src/generated/i18n/wikiData/zh-CN.json` 的 `weapon|武器ID|skill|技能ID|name` 获取；在该武器的技能名称中，核对已解析的 `skill.type + '·'` 前缀再拆分。必须唯一匹配，不能拿通用属性技能名代替专名。
- 核对游戏原始名称和标点。旧数据曾含“不知规”“配科5”“O.B.J.讯极”和英文冒号，旧名称不能直接用于连接上游条目。

## 更新与匹配约束

- 保留 `WeaponData` 和 `WeaponBaseMaterialRegion` 契约。`attribute2: null` 对三星武器合法，表示无附加属性限制；未知值不伪装成 null。
- 武器和地区共用同一套规范词条。当前使用“攻击提升”“法术伤害提升”“源石技艺提升”“终结技充能效率提升”。不要只改武器显示值，或恢复“充能效率→效率”的单边转换，否则会产生漏匹配。
- `weaponMatchesRegion` 同时匹配主属性、非 null 附加属性、技能类型。技能专名不参与掉落筛选。中文规范值用于比较和 Map key，中英文翻译只作用于显示。
- 按类型保留原有武器分组，地区名称和武器名称唯一。新增地区需完整核对三个池；曾出现源石研究园重复、武陵城与清波寨技能池错配，不能因旧地区未新增就跳过差异。
- 更新本地常量、`sources.json` 和数据维护说明。清单记录核对日期、游戏版本、数量、官方公告、每个来源的固定 SHA／提交日期，以及所用文件原始哈希；不能把取数时间当作游戏更新时间。
- 本次任务默认只维护数据和必要的匹配修正。新词条同步 `src/i18n/games.ts`；涉及界面或交互改动时再遵循 `easonweb-development`。不在页面或构建流程加入自动拉取上游数据。

## 验证与交付

执行 `node --test tests/endfield-materials.test.js`、`npm test`、`npm run build`。按核实后的快照更新计数断言，验证名称／地区唯一、没有未解析 key、词条能匹配，以及新增武器和典型旧武器的正确与错误地区。三星 null 场景保留覆盖。

浏览器检查新增武器搜索与选择、重复添加受阻、删除恢复空状态、属性统计、推荐地区和技能高亮；中英文切换保留选择和结果。涉及显示变化时检查窄屏和明暗主题。浏览器不可用时如实说明验证边界。

交付说明实际采用的数据版本、新增／修正数量、官方及开源来源、测试结果和未核实项。来源清单随代码保存，普通数据更新不自动发布网站。
