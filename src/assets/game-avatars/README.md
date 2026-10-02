# 干员头像静态资源

页面用 `appCode + 干员 ID` 查询 `catalog.json`，不从 CommonServerAPI 获取头像、链接或映射，也不请求运行时资源目录服务。

- **明日方舟**：仓库缓存全部可获取干员的官方 CDN 默认头像链接。ID 清单来自 [ArknightsGameResource](https://github.com/yuanyan3060/ArknightsGameResource) 的 `character_table.json`；图片路径参考 [森空岛头像实现](https://github.com/SciNancy/astrbot_plugin_sklands/blob/master/schemas/arknights/models/assist_chars.py)。`#1` 需编码为 `%231`。默认头像与角色当前皮肤无关。
- **终末地**：仓库内置 `endfield/*.png`，来源为 [EndfieldAssets](https://github.com/555me/EndfieldAssets) 的 `charicon` 资源。构建时 Vite 为图片生成内容哈希路径，通过前端 Pages/CDN 提供，不在用户访问时连接 GitHub。
- 游戏图片版权归鹰角网络及相关权利人；这里保留游戏原图，仅作对应干员的识别图。

`sources.json` 固定来源仓库、提交和资源路径。维护时核对上游新提交后更新 revision，再显式运行 `npm run avatars:sync`，审查目录和资源差异并提交。脚本校验终末地图像的 Git blob 哈希和 PNG 文件头，已有一致文件复用，不因单张失败写出半份目录。构建和运行时都不会自动执行同步。上游删除的文件需人工审查后清理。

未知 ID、资源缺失或图片失败使用文字头像，不按名称猜测另一名干员。不将角色等级、持有情况或账号私有数据写入此资源目录。浏览器按需懒加载图片，并复用 CDN/浏览器缓存。
