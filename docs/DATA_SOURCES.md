# 数据来源、许可与使用边界

应用代码使用根目录 [MIT LICENSE](../LICENSE)。以下第三方软件和数据库保留各自许可，应用的 MIT 标记不会把它们重新授权为 MIT。

| 内容 | 来源与固定版本 | 许可与随附文件 |
| --- | --- | --- |
| 334,348条中英文标签、原类别和帖子数量 | [ffdkj 中英标签表](https://github.com/ffdkj/ffdkj-Danbooru_Tag-Chinese-English-Translation-Table)，提交 `8fb4eb79225828bd7d401a5c0a2ad03d79c8a4e1` | 上游标示 MIT；完整上游版权及许可保留在 [THIRD_PARTY_NOTICES.txt](../THIRD_PARTY_NOTICES.txt) |
| 作品媒介映射及证据 | anime-offline-database 2026-27、Wikidata及逐条列出的事实来源 | 派生数据库按 ODbL-1.0，个别数据库内容按 DbCL-1.0；[完整许可](licenses/anime-offline-database.txt) |
| Wikidata 结构化事实 | [Wikidata 许可政策](https://www.wikidata.org/wiki/Wikidata:Licensing) | CC0；没有复制维基百科或Wikidata其他命名空间的长篇正文 |
| React、React DOM、Lucide、dnd-kit、tslib等运行依赖 | package-lock.json 的锁定版本 | MIT、ISC、0BSD等；构建时生成 [完整许可](../public/licenses/dependencies.txt) |

作品媒介派生数据库的机器可读来源为 [src/data/workMediaReviewed.json](../src/data/workMediaReviewed.json)，完整映射、逐条证据及署名可从 [public/catalog/work-media-review.json](../public/catalog/work-media-review.json) 获取，并随网站按 `catalog/work-media-review.json` 提供。此数据库许可独立于应用代码；再分发或修改此数据时应保留相应来源和许可义务。

原始标签来源、获取时间、快照提交、哈希及记录数见 [manifest.json](../public/catalog/manifest.json)。上游只收录其快照范围，不是 Danbooru 实时全集；中文来自社区翻译和校对，可能有误。合并本地基础标签后，应用当前显示约33.4万条，数量不等于上游原始行数。

分类规则、细类、多重归属和作品媒介判断是本工具的本地整理，不代表 Danbooru 官方完整分类。引用数量是快照中的帖子数，不是使用本工具的频率，也不是实时统计。正常安装和构建使用仓库内数据，不联网重新抓取词库。

本项目没有下载或分发 Danbooru 图片、作品封面、视频或 wiki 长文。完整文本词库可能含成人相关词语，部署和分享时请考虑目标人群及托管平台规则。作品、角色、画师和平台名称用于标签标识；本项目与 Danbooru、NovelAI 无官方隶属或背书关系。许可证不授予相关商标或第三方作品的额外权利。

网站同时分发：

- `licenses/project-license.txt`：本项目代码许可。
- `licenses/third-party-notices.txt`：数据来源和上游许可声明。
- `licenses/dependencies.txt`：所有锁定运行依赖的完整许可。
- `catalog/anime-offline-database-license.txt`：ODbL/DbCL完整许可。
- `catalog/work-media-review.json`：可直接获取的派生数据库与证据。

添加或更新数据前，请提供可核对的来源与许可，不要把来源不明的词库或用户私人数据合入公开仓库。
