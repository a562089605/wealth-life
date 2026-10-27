# 生活费按钮嵌入插画（2026-10-26）

用户看过手绘生活费卡后要求“把按钮嵌入插画里面”，认为更好看。本轮仅改生活费构图，不改变其他卡片或付款规则。

新增assets/career/living-bill-scene.webp（1024×1536，完整2:3）：原暖色绘本风的食材、夹板账单纸和黄色付款木牌组成同一场景。图像工具明确传入原房屋和已确认家居六场景作为风格参考，纸张和木牌保持无文字/数字，原PNG保留 /workspace/generated_images/exec-657ad293-f04d-4e67-bfcd-e3f9fb26070e.png。

household-paper.js/css把实时待付金额与基础生活/宠物养护/车辆维护/本月已付四行账单放进画中的纸张位置；原data-v26=living的真实button节点从footer移到画内黄色木牌区域。按整幅画等比缩放，按钮仍是可聚焦/可点击/可禁用的原控件，保留原事件委托、支付金额、已付防重和资金不足条件。原筹款、返回家中及明确确认本月安排仍保留在画外底部。没有用图片文字充当按钮，没有写死800或任何余额，也不增加自动付款。

[未付实页](evidence/living-cost-painted-2026-10-26.png)、[已付实页](evidence/living-paid-painted-2026-10-26.png)、[现金不足](evidence/living-insufficient-painted-2026-10-26.png)。此前分离插画/金额框/底部付款版本保留在progress/evidence/living-before-embedded/，旧图集和候选不改。

44个Node测试通过。qa/browser-household-paper.py通过：浏览无扣款；真实按钮在插画中且390px可见；实际付款800后余额9200、重开已付不重扣；现金100时禁用支付、保留筹款入口；320/390/桌面三种宽高实际点击嵌入按钮均成功，矮屏必要时滚动；住房/休息/保险切换不串样式；真实SW断网加载图并付款。证据qa/browser-evidence/household-paper.json，无页面异常。隔离Chromium，非真机。

生产图76、PR新增58、新接入40，候选459条保留，缓存wealth-life-v28.3-living-embedded1，HTML/SW精确查询版本和新图预缓存一致。旧存档、费用、押金、时间、月限不改。本地保存，未上传/合并/部署；新构图待用户视觉核对。
