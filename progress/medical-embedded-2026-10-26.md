# 医疗方案嵌画（2026-10-26，美东）

用户点开医疗保险后要求“也做成嵌入插画的样子”。在bbe4bf6上增量修改医疗方案页面，不改保费/赔付/时点/旧档规则。

新增assets/career/medical-plans-embedded.webp（1024×1536），内置image_gen参考保险主入口新图。原PNG保存在assets/archive/generated-originals/medical-plans-embedded.png；完整提示词progress/image-prompts/medical-plans-embedded.txt。实际画面为三张方案纸牌、下方共享当前保障/费用说明纸牌及黄色确认木牌；按实际画面调整定位。旧图、旧截图、原稿全保留。

移动原三个选项button、当前保障section、原quoteBox和原confirmButton进scene；所有引用、onclick、aria-pressed、disabled、银行筹款及原确认快照继续使用。基础200/80%、全额400/100%、不投保/下月停保动态文案保留。旧版保单保留原合同按钮、已预约下月安排独立提示留在画外，不因嵌画删除。当前保障与费用文字实时更新；底部返回与月度生活确认仍用原节点。

本地IAB独立新档：选择基础不扣款，实际嵌画确认后现金10000→9800、当前保障基础200/80%；改全额确认只预约下月，现金仍9800/当前80%；下月停保确认同样保留当月保障与现金。重新加载最终排版后重开并选择基础，截图evidence/medical-embedded-2026-10-26.png为未付款预览，现金10000。没有访问用户真实存档。

45项Node测试通过，生产图哈希/精确预缓存URL及22原PNG校验通过；本次无小屏、真机、离线或长线浏览器重跑，不以旧证据冒充新验收。79生产资源含旧图，不代表79张完整规则卡；22生成原PNG，459候选不变。缓存wealth-life-v28.3-medical-embedded1。本地保存，未上传/合并/部署，新视觉待核对。
