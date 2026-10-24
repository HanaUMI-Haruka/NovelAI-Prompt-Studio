# 版本发布与维护

## 当前发布状态

- [项目仓库](https://github.com/HanaUMI-Haruka/NovelAI-Prompt-Studio)：Public，默认分支 `main`。
- [v0.1.0 Release](https://github.com/HanaUMI-Haruka/NovelAI-Prompt-Studio/releases/tag/v0.1.0)：首个公开源码版本，提供 GitHub 自动生成的源码 ZIP 和 tar.gz，没有额外安装包。
- [在线编辑器](https://hanaumi-haruka.github.io/NovelAI-Prompt-Studio/)：已部署到 GitHub Pages，支持电脑和手机浏览器。

源码提交、版本 Tag、Release 说明和线上站点是不同的发布对象。默认分支可继续修改；已发布 Tag 保留该版本的固定代码，后续更新不应移动或覆盖旧 Tag。网站通过手动运行 `Deploy GitHub Pages` 更新，普通代码推送不会自动部署。

## 准备干净源码

需要生成供他人下载或重新建仓的独立源码副本时，不要直接打包整个本地开发文件夹。运行：

```sh
npm ci
npm test
npm run build
npm run release:check
npm run release:prepare
```

最后一条命令会在 `release/` 下创建新的源码文件夹，也支持 `-- --output 新的目标文件夹`。目标存在时停止，不会删除或覆盖原目录。明确清单只复制源码、词库、许可证、当前用户文档、构建脚本和 `.github` 配置；不包含 `node_modules`、`dist`、`.tools`、旧任务附件、浏览器导出或历史工作记录。

包内 `RELEASE_MANIFEST.json` 列出交付文件与 SHA-256，可用于检查是否完整；`工作说明.txt` 提醒后续操作。发布检查只识别常见凭证和本机用户路径，不能保证发现所有敏感信息。提交前仍应审阅文件清单和内容。

原开发记录只在本地保留，`.gitignore` 也会排除它们。若以前已经提交过私密文件，加入 ignore 不会清除 Git 历史，应另外处理历史。`release:prepare` 生成的新副本不复制 `.git` 历史。

## 维护本仓库与发布新版本

1. 检查工作区、提交差异、发布范围及敏感内容，确认 `origin` 指向自己的预期仓库。
2. 同步 `package.json`、`package-lock.json` 和界面显示的版本，整理 `CHANGELOG.md`；发布说明只描述该版本真实可用的功能。
3. 本地运行适用测试、生产构建、发布检查和依赖审计，再提交并推送 `main`，确认该提交的 Windows/Linux CI 通过。
4. 为通过检查的提交创建新 Tag，推送后创建对应 GitHub Release。Tag 或 Release 已存在时先检查原因，不要覆盖已有版本。
5. 如需更新在线版，按[部署说明](DEPLOYMENT.md)手动运行 Pages 工作流，再检查真实公开网址、完整词库和手机布局。

以下仅以未来的 `v0.1.1` 为示例，请替换为实际版本并先准备 `RELEASE_NOTES.md`；不要为了更新说明而重建 `v0.1.0`：

```sh
git tag -a v0.1.1 -m "NovelAI Prompt Studio v0.1.1"
git push origin refs/tags/v0.1.1
gh release create v0.1.1 --verify-tag --title "NovelAI Prompt Studio v0.1.1" --notes-file RELEASE_NOTES.md
```

GitHub CLI 发布前需要由维护者本人完成 `gh auth login`，不要把密码、Token 或登录备份放进源码。Release 说明可以补充访问入口和勘误，但应区分固定版本的能力与网站后续更新，不能把未发布功能写成已经提供。

## Fork 或创建自己的仓库

1. 可以直接 Fork 本项目，或用干净源码创建自己的空仓库，名称可用 `NovelAI-Prompt-Studio`。
2. 已准备LICENSE及README，因此创建仓库时不要再生成同名文件。
   `package.json` 中的 `private: true` 只用于避免误发布到npm，不影响GitHub公开或MIT授权。
3. 仅当使用没有 `.git` 的独立源码副本创建新仓库时，才执行下面的初始化示例；已有仓库不需要重新初始化或重复添加 `origin`：

```sh
git init -b main
git add .
git status --short
git commit -m "Initial open-source release"
git remote add origin https://github.com/YOUR-NAME/NovelAI-Prompt-Studio.git
git push -u origin main
```

把 `YOUR-NAME` 和仓库名换成你自己的值。上传前确认 `git status` 没有私人备份或本机工具。首次使用 Git 需要配置提交姓名和邮箱；仓库可见性、账号授权与推送由维护者决定，应用和构建脚本不会自动执行这些操作。

## 上传后

- 查看 Actions → CI。应完成 Windows 和 Linux 两个平台的安装、测试、构建、发布检查及依赖审计。
- 在自己仓库的 About 添加项目简介；网站部署成功后填入自己的真实网址，Fork 不会自动获得原站部署权限。
- 在 Settings → Security 启用私密漏洞反馈。联系渠道目前没有虚构个人邮箱。
- 如需自己的在线站点，按[部署说明](DEPLOYMENT.md)启用 Pages 并手动运行工作流。
- 确认LICENSE版权行。当前使用 `AI Prompt Studio contributors` 项目贡献者署名，不包含本机用户名或推测的真实姓名；你可以在发布前改成自己的公开署名。
- 可以发布与自己代码匹配的版本。若另附静态网页包，应说明需要 HTTP/HTTPS 服务运行，并保留全部词库和许可文件；不要把静态网页包描述为可直接安装的桌面或手机应用。

应用代码MIT，第三方数据库不会因此改为MIT。请保留 [数据来源](DATA_SOURCES.md)、[上游声明](../THIRD_PARTY_NOTICES.txt)和完整许可文件。
