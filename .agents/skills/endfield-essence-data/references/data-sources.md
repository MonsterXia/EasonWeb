# 数据来源与字段映射

仅在任务要求核对或更新游戏数据时查远端。先读 `src/constant/game/hypergryph/endfield/sources.json` 和同目录 `README.md`；它们记录本地快照，不保证等于当前游戏版本。单纯修订 skill、解释代码或排查已有计算逻辑不需要刷新数据来源。

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

## 落地与来源清单

- 本地 `WeaponData` 没有上游 ID 字段。对账时保留临时的上游稳定 ID → 正式中文名映射，核实名称后写入常量；不要把旧拼写作为连接键。
- 维持五种武器类型分组，更新 `src/constant/game/hypergryph/endfield/weapons.ts` 的实际记录。新增地区核对主属性、附加属性、技能类型三个池；旧地区也需比较差异。
- 同步 `sources.json` 的 `checkedAt`、`gameVersion`、`weaponCount`、`regionCount`、`officialReleaseNotes`；各来源记录 `repository`、`revision`、`committedAt` 和 `files[].path/sha256`。SHA-256 来自下载文件原始字节，不是 JSON 重新序列化结果。
- 同步数据 `README.md` 的范围、修正说明与证据。区分核对日期、来源提交日期和游戏实装日期，不能把取数时间当作游戏更新时间。
- 仅采集游戏事实数据；若任务需要复用上游算法或组件，先查对应仓库许可，不能把数据核对的授权扩展成程序代码复用。
- 按新快照调整数量断言并补新增／修正武器的正反地区例；验证方法见 [calculator.md](calculator.md)。不在页面或构建流程加入上游自动取数，也不因数据更新自动发布网站。
