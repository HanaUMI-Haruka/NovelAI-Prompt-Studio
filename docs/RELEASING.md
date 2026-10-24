# 发布到自己的 GitHub 仓库

## 准备干净源码

不要把整个本地开发文件夹直接上传。运行：

```sh
npm ci
npm test
npm run build
npm run release:check
npm run release:prepare
```

最后一条命令会在 `release/` 下创建新的源码文件夹，也支持 `-- --output 新的目标文件夹`。目标存在时停止，不会删除或覆盖原目录。明确清单只复制源码、词库、许可证、当前用户文档、构建脚本和 `.github` 配置；不包含 `node_modules`、`dist`、`.tools`、旧任务附件、浏览器导出或历史工作记录。

包内 `RELEASE_MANIFEST.json` 列出交付文件与 SHA-256，可用于检查是否完整；`工作说明.txt` 提醒后续操作。发布检查只识别常见凭证和本机用户路径，不能保证发现所有敏感信息。提交前仍应审阅文件清单和内容。

原开发记录只在本地保留，`.gitignore`也会排除它们。若以前已经提交过私密文件，加入ignore不会清除Git历史，应另外处理历史；本次干净源码不包含任何旧Git历史。

## 创建并上传仓库

1. 登录自己的GitHub，创建空仓库，名称可用 `AI-Prompt-Studio`，选择Public。
2. 已准备LICENSE及README，因此创建仓库时不要再生成同名文件。
   `package.json` 中的 `private: true` 只用于避免误发布到npm，不影响GitHub公开或MIT授权。
3. 在干净源码目录中初始化Git并提交，再使用GitHub显示的仓库地址：

```sh
git init -b main
git add .
git status --short
git commit -m "Initial open-source release"
git remote add origin https://github.com/YOUR-NAME/AI-Prompt-Studio.git
git push -u origin main
```

把 `YOUR-NAME` 和仓库名换成你自己的值。上传前确认 `git status` 没有私人备份或本机工具。首次使用Git可能需要自行配置提交姓名和邮箱。本项目不会替你设置身份、创建仓库、公开代码或推送。

## 上传后

- 查看 Actions → CI。应完成 Windows 和 Linux 两个平台的安装、测试、构建、发布检查及依赖审计。
- 在仓库 About 添加项目简介、主题标签；准备好网站后再添加真实网址。
- 在 Settings → Security 启用私密漏洞反馈。联系渠道目前没有虚构个人邮箱。
- 如需在线演示，按[部署说明](DEPLOYMENT.md)启用Pages并手动运行工作流。
- 确认LICENSE版权行。当前使用 `AI Prompt Studio contributors` 项目贡献者署名，不包含本机用户名或推测的真实姓名；你可以在发布前改成自己的公开署名。
- 可以创建 `v0.1.0` Release，介绍功能并附上完整静态构建。若分发静态包，请保持全部词库和许可文件。

应用代码MIT，第三方数据库不会因此改为MIT。请保留 [数据来源](DATA_SOURCES.md)、[上游声明](../THIRD_PARTY_NOTICES.txt)和完整许可文件。
