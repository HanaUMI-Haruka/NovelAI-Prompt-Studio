# 参与贡献

欢迎为 NovelAI Prompt Studio 提交问题、改进中文译名、补充分类依据或发送 Pull Request。先在[在线编辑器](https://hanaumi-haruka.github.io/NovelAI-Prompt-Studio/)体验功能；问题和方案可通过[本仓库 Issues](https://github.com/HanaUMI-Haruka/NovelAI-Prompt-Studio/issues)反馈。改动较大时，请先说明使用场景与方案。

错误反馈请注明在线版或本地版、浏览器、操作系统、项目版本、复现步骤和最小示例。提交截图前去除私人内容，避免直接上传真实备份。

## 开发

使用 Node.js 24 LTS 和自带的 npm：

```sh
npm ci
npm run dev
npm test
npm run build
npm run release:check
```

提交代码前运行适用验证，说明实际结果；新增有实质影响的逻辑时提供能复现需求或问题的少量测试。界面改动请检查桌面、手机和现有主题。

普通推送和 Pull Request 会运行 Windows/Linux CI，不会自动更新公开网站。合并后由维护者按[部署说明](docs/DEPLOYMENT.md)手动发布；源码 Tag、GitHub Release 和线上站点是分别维护的发布对象。

- 保留结构化标签、权重和草稿数据；Prompt 文本是派生输出。
- 草稿、收藏及个人标签使用版本化 LocalStorage。兼容旧数据，读取失败不能覆盖原文，保存失败需要可见反馈。
- 不把凭证、用户备份、真实私人 Prompt、浏览器资料或本机绝对路径提交到仓库。
- 不在本项目加入生图 API、账号或云同步，除非先讨论并明确功能范围。
- 33万条词库使用六份预生成排序索引。避免在界面切换时全量排序；改动词库或排序规则后重新生成索引并验证。
- 应用代码按 MIT 贡献；第三方数据仍遵循其原许可证。补充数据必须附来源和许可，详见[数据来源](docs/DATA_SOURCES.md)。

## 依赖更新

使用锁文件并提交相应改动。`esbuild` 是生成排序资源的直接开发依赖；Vitest 更新修复了旧测试工具链公告。`postcss-selector-parser` 的固定 override 用于修复 GHSA-rj75-hqrm-r3gf，同时保持现有 Tailwind 3 界面；调整它前须重新检查公告与 CSS 构建结果。不要直接使用 `npm audit fix --force` 跨框架升级。

`npm run build` 会从锁定且已安装的生产依赖生成完整许可文本。依赖版本不匹配或缺少许可时会停止构建；运行 `npm ci` 后重试。
