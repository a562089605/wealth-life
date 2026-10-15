# 财富人生 Wealth Life

当前版本：V27.4 双阶段人生。纯静态 PWA，完整游戏入口为仓库根目录的 index.html；无需安装依赖、数据库或后端。

## Cloudflare Pages 自动部署

在 Cloudflare 的 Workers & Pages 中创建 Pages 项目，选择 Import an existing Git repository，连接本仓库。

| 配置 | 值 |
| --- | --- |
| Production branch | main |
| Framework preset | None |
| Build command | exit 0 |
| Build output directory | . |
| Root directory | 默认仓库根目录 |

首次连接和授权需要在 Cloudflare 完成。连接成功后，main 的新提交会触发自动部署。不要选择 Workers 应用或要求 wrangler deploy 的入口。

正式游戏始终使用同一个生产网址。存档在玩家浏览器本地保存，不在 GitHub；Netlify 或不同预览域名的存档不会自动迁移。

## 本版本与测试

包含首月主动求职、CD购买入口、月末结算/兴趣跳转修复、收入保障理赔及 IRA/401(k)说明。细节见 QA_REPORT.md 与 qa-evidence.json。

已完成本地 Chromium 手机触控模拟、实际12个月流程、离线进入第13月、存档/财务/教育/双阶段专项，以及模拟 Cloudflare Pages 默认静态响应行为的兼容检查。尚未验证真实 Cloudflare 部署和真实 iPhone Safari；不承诺零 bug。后期通关与异常边界使用明确测试存档。

每次更改运行代码时同步升级页面资源版本号和 sw.js 缓存版本，保持统一 state 与现有存档兼容。
