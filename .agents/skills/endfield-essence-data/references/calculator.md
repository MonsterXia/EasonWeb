# 计算契约与验证

## 数据模型

`src/constant/game/hypergryph/endfield/index.ts` 提供数据投影与类型，`weapons.ts` 保留兼容入口和匹配函数：

- `WeaponData`：`id`、`name`、`type`、`rarity`、`attribute1`、`attribute2: string | null`、`skill: { type, name }`。从统一目录派生 `endfieldWeapons`，按 `essenceOrder` 保留单手剑、双手剑、长柄武器、手铳、施术单元的原有排列。
- `WeaponBaseMaterialRegion`：`region`、`attribute1Array`、`attribute2Array`、`skillTypeArray`，汇总为 `endfieldWeaponBaseMaterialRegion`。
- `weaponMatchesRegion` 的三个条件都要满足：主属性在池中；附加属性为 null 或在池中；`skill.type` 在技能池中。`skill.name` 不参与匹配，星级和武器类型也不参与地区筛选。
- 当前规范附加词条包括“攻击提升”“法术伤害提升”“源石技艺提升”“终结技充能效率提升”。`src/i18n/games.ts` 仍有旧词条翻译键；翻译表中存在某个别名不代表该别名应写入武器或地区。
- 武器名是页面查找、去重和删除的键，地区名在数据回归中要求唯一。`WeaponData.id` 对应统一目录的稳定武器 ID，用于跨计算器关联和配图；改名仍须检查搜索与选择。

## 推荐与高亮

计算入口为 `src/common/endfieldEssence.ts`，页面通过 computed 派生推荐和覆盖清单。

1. 下拉框绑定中文武器名，按名称去重；移除后候选恢复。选择保存在组件 ref 中，无持久化。
2. 属性统计覆盖全部已选武器，三星武器的 null 副属性不计数。
3. 遍历地图，用 `weaponMatchesRegion` 筛出符合主属性、副属性及技能掉落池的武器。
4. 对地图内每种技能类型分别统计主属性，选频次最高的至多三种主属性，生成具体定向方案。
5. 从原始已选清单反查同时匹配地图、所选主属性和技能类型的武器，作为该方案的真实覆盖清单。以真实覆盖数量选择最佳方案；同分沿用地图顺序，地图内技能与主属性的同分沿用清单首次出现顺序。
6. 覆盖数字和图卡高亮直接使用同一份覆盖清单；无可匹配方案或清单为空时返回 null，页面清空旧推荐。

例如仰止、不知归、熔铸火焰三把武器，选择“夜幕”时只覆盖仰止与熔铸火焰，显示 2 / 3；不知归的技能是“流转”，即使地图可掉落也不能计入。

这是对当前“最多三种主属性＋一种技能类型”方案的覆盖数量优化，没有按掉落概率、探索等级、体力或材料收益优化。

## 语言与展示

- `displayAttribute` 查询 `game.attributes.<规范中文词条>`，存在翻译时显示翻译，否则回退原值。计算仍使用中文 Map key。
- `recommendedAttributeLabels` 使用本地化分隔符；语言切换不会重新写入选择和匹配数据。
- 英文界面保留国服武器／地区名并显示说明；搜索仍按中文武器名。技能类型使用描述性翻译，不把描述性英文声称为官方英文专名。
- 新词条同步 `src/i18n/games.ts` 的 `zhCN.attributes` 与 `en.attributes`，并核对数据中的所有词条均有显示映射。

## 验证选择

在仓库根目录执行：

```bash
node --test tests/endfield-materials.test.js
node --test tests/i18n.test.js
npm test
npm run build
```

按改动选取检查：数据／匹配改动先跑第一项；翻译改动跑第二项；业务代码完成后跑全量测试与包含类型检查的构建。`npm test` 仅运行 `tests/*.test.js`，不会运行 Playwright。

`tests/endfield-materials.test.js` 的数据回归覆盖：快照数量和名称唯一性；名称及附加词条规范；真实武器正反地区匹配（包括三星 null）与每把武器至少有一个地区。当前断言对应本地快照，更新时根据已核实清单调整。另外覆盖混合技能反算、地图实际覆盖排序、主属性上限、副属性约束及空清单；浏览器回归检查覆盖数字、高亮和删除后更新。它没有验证来源文件哈希、全部技能专名或全部翻译覆盖。

`tests/i18n.test.js` 验证语言键集合、消息编译及插值参数等，不证明每个武器词条都有翻译；页面 SSR／导航测试也不能代替选择、推荐和高亮的交互检查。`tests/e2e/endfield-ui.spec.ts` 等同名游戏测试针对森空岛概览，不能作为基质计算器覆盖依据。

浏览器打开 `/game/hypergryph/endfield`，根据变更检查：

- 搜索新增或改名武器，添加后再次添加受阻，删除最后一把后统计和推荐回到空状态。
- 新旧武器组合的副属性 null、覆盖数、前三主属性、最高频技能及标签高亮；涉及算法时加入并列覆盖和并列频次场景。
- 切换中英文后选择和结果保持，属性、技能类型及分隔符随语言变化；名称仍使用国服名称。
- 界面改动检查窄屏和明暗主题；浏览器不可用时说明未验证的交互，不声称数据单测覆盖 UI。
