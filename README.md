# 财富人生 Wealth Life — V28.2

保留月度结算、24格小镇、存档、投资/保险/贷款和双阶段目标。咖啡师与值班主管共10张主事件，以及6张后续结果已接入。17张已确认原画包含职业起始页；游戏金额和选择使用原生动态UI。

本版规则、存档与验证范围见 [COFFEE_CAREERS_V28_2.md](COFFEE_CAREERS_V28_2.md)。历史QA报告仅代表相应旧版本，不代表本版全部实机回归。

Cloudflare Workers现有Git集成可用根目录 `npx wrangler deploy`，wrangler.jsonc指定静态目录和wealth-life Worker；不需要编译，保留原workers.dev网址和本地存档。

验证：`node qa/coffee-rules.test.cjs`、`node qa/shift-lead.test.cjs`。手机真实Safari/PWA尚未验证。
