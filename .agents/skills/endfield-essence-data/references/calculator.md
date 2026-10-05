# 计算契约与验证

## 数据模型

`src/constant/game/hypergryph/endfield/weapons.ts`：

- `WeaponData`：`name`、`type`、`rarity`、`attribute1`、`attribute2: string | null`、`skill: { type, name }`。当前五组按单手剑、双手剑、长柄武器、手铳、施术单元拼接成 `endfieldWeapons`。
- `WeaponBaseMaterialRegion`：`region`、`attribute1Array`、`attribute2Array`、`skillTypeArray`，汇总为 `endfieldWeaponBaseMaterialRegion`。
- `weaponMatchesRegion` 的三个条件都要满足：主属性在池中；附加属性为 null 或在池中；`skill.type` 在技能池中。`skill.name` 不参与匹配，星级和武器类型也不参与地区筛选。
- 当前规范附加词条包括“攻击提升”“法术伤害提升”“源石技艺提升”“终结技充能效率提升”。`src/i18n/games.ts` 仍有旧词条翻译键；翻译表中存在某个别名不代表该别名应写入武器或地区。
- 武器名是页面查找、去重和删除的键，地区名在数据回归中要求唯一。没有独立的本地稳定武器 ID；改名必须检查搜索与选择。

## 推荐与高亮

以 `src/pages/game/hypergryph/endfield/BaseMaterialCalculator.vue` 为准：

1. 下拉框绑定中文武器名；`addWeapon` 查找本地数组并按名称去重。按钮也禁用重复添加；`deleteWeapon` 按名称删除。选择保存在组件 ref 中，当前没有持久化。
2. 深度监听 `selectedWeapons`，对全部已选武器统计主属性、非空副属性和技能类型的次数。
3. 每个地区用 `weaponMatchesRegion` 收集可掉落武器，按匹配武器数降序选第一项。相同覆盖数没有额外优先级，稳定排序沿用地区数组顺序；调整地区顺序可能改变平局时推荐。
4. 只在推荐地区覆盖的武器中计数，主属性取次数最多的至多三项，技能类型取次数最多的一项；并列沿用 Map 首次插入顺序，与选武器顺序有关。副属性虽然计数和排序，当前没有副属性定向券输出。
5. 覆盖数是推荐地区可掉落的武器数。标签高亮还要求同时符合选出的主属性和技能类型，因此高亮数可能小于覆盖数。
6. 无武器时显示等待清单；有武器而覆盖数为零时显示无匹配地图。模板基于清单和覆盖数切换空状态，不能仅凭内部 `selectedMap` 非空就显示推荐。

这是按覆盖数量和词条频次的推荐；没有按掉落概率、探索等级、体力或材料收益优化。数据修正与算法需求应分别定位，避免用改掉落池来迎合期望的推荐结果。

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

现有 `tests/endfield-materials.test.js` 包含三组测试：快照数量和名称唯一性；名称及附加词条规范；真实武器正反地区匹配（包括三星 null）与每把武器至少有一个地区。当前断言对应本地快照，更新时根据已核实清单调整。它没有验证来源文件哈希、全部技能专名、全部翻译覆盖或页面推荐排序。

`tests/i18n.test.js` 验证语言键集合、消息编译及插值参数等，不证明每个武器词条都有翻译；页面 SSR／导航测试也不能代替选择、推荐和高亮的交互检查。`tests/e2e/endfield-ui.spec.ts` 等同名游戏测试针对森空岛概览，不能作为基质计算器覆盖依据。

浏览器打开 `/game/hypergryph/endfield`，根据变更检查：

- 搜索新增或改名武器，添加后再次添加受阻，删除最后一把后统计和推荐回到空状态。
- 新旧武器组合的副属性 null、覆盖数、前三主属性、最高频技能及标签高亮；涉及算法时加入并列覆盖和并列频次场景。
- 切换中英文后选择和结果保持，属性、技能类型及分隔符随语言变化；名称仍使用国服名称。
- 界面改动检查窄屏和明暗主题；浏览器不可用时说明未验证的交互，不声称数据单测覆盖 UI。
