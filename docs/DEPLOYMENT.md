# 安装与部署

## 直接访问网站

[打开 NovelAI Prompt Studio](https://hanaumi-haruka.github.io/NovelAI-Prompt-Studio/)。公开站点已通过 GitHub Pages 上线并启用 HTTPS，电脑和手机浏览器均可直接使用，无需安装 Node.js、登录 GitHub 或提供密钥。

首次打开会加载网页、约 20MB 标签 JSON 和约 7.65MiB 排序索引，请等待“词库已就绪”。在线版目前没有完整离线缓存或可安装 PWA，不能保证断网后重新打开或刷新仍然可用。需要离线使用时，请在电脑上准备下方的本地运行环境。

## 本地运行

从 [Release](https://github.com/HanaUMI-Haruka/NovelAI-Prompt-Studio/releases/tag/v0.1.0) 下载源码，或克隆 [项目仓库](https://github.com/HanaUMI-Haruka/NovelAI-Prompt-Studio)。安装 Node.js 24 LTS（带 npm），在含有 `package.json` 的项目根目录运行：

```sh
npm ci
npm run dev
```

打开终端给出的地址，通常为 `http://127.0.0.1:5173/`；端口被占用时 Vite 会选择其他端口。Windows 若 PowerShell 限制 `npm.ps1`，可使用 `npm.cmd ci`、`npm.cmd run dev`，无需改变系统执行策略。

第一次安装需要从 npm 注册表下载依赖。词库已经包含在仓库中，不需要再运行 Python、下载数据或配置密钥。

准备完成后，本地编辑功能可在不连接互联网时使用，但本地服务必须保持运行。源码不是 Windows、Android 或 iOS 安装包，不能靠双击 HTML 完整运行。

手机可以直接使用公开网址。若要在同一局域网访问电脑上的开发服务，需要显式开放监听地址，例如 `npm run dev -- --host 0.0.0.0`，并根据电脑实际地址、终端端口和防火墙设置访问。默认 `127.0.0.1` 仅本机可用；局域网 HTTP 的剪贴板权限可能受浏览器限制，可手动选择文本复制。

## 静态构建

```sh
npm test
npm run build
npm run preview
```

`dist/` 包含完整网页、词库、排序索引及许可证。把整个目录交给静态服务器；不要只复制 `index.html`。`npm run preview` 用于本地验证，默认端口4173，不是生产服务器。

部署到域名根路径时，默认构建即可。部署到子路径时，例如 `/prompt-studio/`：

```sh
npm run build -- --base=/prompt-studio/
```

浏览器代码、favicon、词库请求和许可链接都会使用该路径。直接双击构建后的 HTML 不受支持；请使用 HTTP/HTTPS。线上启用 HTTPS 以使用剪贴板。

## GitHub Pages

1. 先按[发布说明](RELEASING.md)把干净源码推送到自己的仓库。
2. 在仓库 Settings → Pages 中，将 Source 设置为 GitHub Actions。
3. 在 Actions 中选择 `Deploy GitHub Pages`，点击 Run workflow。
4. 工作流会测试、按仓库实际路径构建并部署，完成后显示网址。后续更新也需手动运行该工作流。

Pages工作流只允许手动触发；普通push和Pull Request只运行CI，不会自动发布网站。构建只读仓库与Pages配置，部署任务单独申请Pages写入权限。不需要你提供自定义密钥；使用GitHub工作流自带的最小权限凭据。

本仓库已通过实际 Pages 构建与部署，并在公开网址验证了词库、排序索引、搜索、权重、复制、本地保存与手机布局。每次更新仍应检查当次工作流和线上结果；Fork 到自己的仓库时，需要在自己的仓库重新启用 Pages，不能直接沿用原站的部署状态。

GitHub Pages 有流量和站点大小限制，详见[官方限制](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)。用户首次打开会加载完整词库和排序索引，实际传输量受压缩与缓存影响，访问量较大时需要考虑带宽。也可把同一个 `dist/` 部署到其他静态托管服务。

无论使用哪种托管方式，草稿仍只保存在用户浏览器。域名、协议或端口改变时请先备份，详见[隐私说明](PRIVACY.md)。

参考：[Vite官方静态部署说明](https://vite.dev/guide/static-deploy.html)。
