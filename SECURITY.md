# 安全与隐私反馈

NovelAI Prompt Studio 是静态前端，在线版由 GitHub Pages 提供。使用应用不需要账号或密钥，也不连接生图 API。草稿、收藏和个人标签保存在当前浏览器 LocalStorage，加载网页与词库仍会产生网络请求。详细边界见[隐私说明](docs/PRIVACY.md)。

请不要在公开 Issue 中附上可利用漏洞的完整攻击步骤、真实凭证或私人备份。仓库启用 GitHub Private vulnerability reporting 后，请使用 Security → Advisories → Report a vulnerability；如果该入口尚未启用，可先提交不含利用细节的 Issue，请维护者提供私密反馈渠道。本项目目前没有另设安全联系邮箱。

仅维护默认分支的当前代码，暂无旧版本安全修复承诺。更新依赖后会运行测试及构建；自动依赖审计不能证明所有安全问题均不存在。
