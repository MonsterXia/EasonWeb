# 干员头像静态资源

页面用 `appCode + 干员 ID` 查询 `catalog.json`，不从 CommonServerAPI 获取头像、链接或映射，也不请求运行时资源目录服务。

- **明日方舟**：仓库缓存全部可获取干员的官方 CDN 默认头像链接。ID 清单来自 [ArknightsGameResource](https://github.com/yuanyan3060/ArknightsGameResource) 的 `character_table.json`；图片路径参考 [森空岛头像实现](https://github.com/SciNancy/astrbot_plugin_sklands/blob/master/schemas/arknights/models/assist_chars.py)。`#1` 需编码为 `%231`。默认头像与角色当前皮肤无关。阿米娅的近卫、医疗形态虽在数据表中标为 `isNotObtainable`，仍会出现在持有列表中，需保留 `sources.json` 的 `additionalCharacterIds` 显式例外；这两种形态仅使用 `#2` 的精二默认图，通过 `defaultSkins` 覆盖，不能拼接不存在的 `#1`。
- **终末地**：仓库内置 `endfield/*.png`，来源为 [EndfieldAssets](https://github.com/555me/EndfieldAssets) 的 `charicon` 资源。森空岛的 `charData.id` 使用游戏 ID（例如 `chr_0016_laevat`）的 MD5，而素材文件名使用原始 ID；同步脚本在静态目录中同时生成两种键，浏览器无需散列计算或额外查询。该对应关系已通过生产角色核对。构建时 Vite 为图片生成内容哈希路径，通过前端 Pages/CDN 提供，不在用户访问时连接 GitHub。
- 游戏图片版权归鹰角网络及相关权利人；这里保留游戏原图，仅作对应干员的识别图。

`sources.json` 固定来源仓库、提交和资源路径。维护时核对上游新提交后更新 revision，再显式运行 `npm run avatars:sync`，审查目录和资源差异并提交。脚本校验终末地图像的 Git blob 哈希和 PNG 文件头，已有一致文件复用，不因单张失败写出半份目录。构建和运行时都不会自动执行同步。上游删除的文件需人工审查后清理。

未知 ID、资源缺失或图片失败使用文字头像，不按名称猜测另一名干员。不将角色等级、持有情况或账号私有数据写入此资源目录。浏览器按需懒加载图片，并复用 CDN/浏览器缓存。

管理员的共用 ID 为 `chr_9000_endmin`（见 [CharacterTable 数据来源](https://github.com/3aKHP/EndFieldGameData/releases/tag/v0.2.0)）。`endfieldVariants` 预缓存男女两套形象的本地图片映射，使用角色资料里的 `profile.endministratorGender` 选择；这个字段描述游戏角色，不是用户性别。未知形象保留文字兜底，不默认猜测男或女。
