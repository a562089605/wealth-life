# 继续《财富人生 Wealth Life》交接

原仓库 a562089605/wealth-life；线上 https://wealth-life.a562089605.workers.dev 。请先实际核对最新 main、Cloudflare 成功记录、线上文件与本地差异，不能仅依据此文宣称发布完成。V28.8 为本文件随附版本；完整提交及发布记录以 GitHub 和交付提示词核对为准。

本机原仓库路径：/Users/yumifang/Documents/Codex/2026-11-04/wealth-life-a562089605-wealth-life-https/work/wealth-life 。不要重做游戏、另建替代项目、覆盖整个远端或重置存档。

先读 README.md、PET_ENTRY_20261104.md、HOME_RELOAD_REGRESSION_20261104.md、HOUSING_SAVE_TRANSACTIONS_20261104.md、APARTMENT_EVENTS_20261104.md、STUDIO_EVENTS_20261103.md、SHARED_EVENTS_20261102.md、SHARED_BALANCE_REVIEW_V28_5_5.md、FAMILY_EVENTS_20261102.md、四套住房主场景交接文档；再核对 room.js/.css、family-home.js/.css、housing-lease.js、housing-bills.js、housing-time-debt.js、pet-care.js、pet-adoption-entry.js/.css 和相关 manifest。

住房四场景已接入 family/shared/studio/rent1，只按实际住房切换；首月未选住房保留原图。固定三色柯基始终出现，不能因未领养隐藏或自动领养收费。V28.7.6 修复在家刷新误触发回家月结；四卡池各12张及所有确认数值、六完整月冷却、50%回家一次判定、动画前保存、一次结算、资源规则和住房保存回滚必须保留。Studio 强制请假是用户确认项。较早文档为历史，最新用户确认和代码优先，不补造缺失资料。

V28.8 接入历史七宠选择原画与鳄鱼，保留 main 原六宠费用。费用：柯基430/月105、银渐层370/月80、鳄鱼2000（含设备）/月300、豹纹守宫360/月35、捕鸟蛛190/月18、陆龟270/月28、变色龙500/月45。未养宠进入选择及费用确认；已养宠进入原照护。领养保存失败回滚，成功才导航，保留原键和首次领养前备份。历史 fix/illustrated-home-scene 支线整套宠物功能与另一套费用没有合并。当前仍同种不可重复，尚未制作宠物总览/继续领养入口或新增取名方案，不要说这些已完成。

本轮22组检查及真实桌面Chromium七宠选择/取消、鳄鱼保存失败回滚与重试、刷新读档、原照护入口通过；真实iPhone Safari/PWA、完整离线、长期平衡未验证。不能把规则/DOM/VM测试当真机，也不能说住房或宠物整个板块已全面验证。

接下来由用户指定宠物板块下一项。先简要说明实际状态与待做项。未确认的新图不替换线上；温暖蜡笔/彩铅绘本风、手机竖屏、刘海与底部安全区；每次作图必须直接发图，保留旧素材，不擅自新增机制或调平衡。全游戏无税，门店分红每月底一次。
