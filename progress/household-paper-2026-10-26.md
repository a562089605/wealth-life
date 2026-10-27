# 住房、生活费及休息卡片手绘统一（2026-10-26）

用户要求“把卡片都改成手绘风格，符合游戏风格”。本轮承接正在核对的住房、生活费和刚完成休息页面，统一这些尚未匹配的卡片及住房付款/预约/交接。既有生活入口、保险、必要安排、可选活动、宠物和关系的已确认绘本页面保留；没有重建游戏。新结果待用户视觉核对，不把风格沿用当作用户已经验收所有新页面。

## 实际页面

- [住房四选项](evidence/housing-painted-2026-10-26.png)：四种房型各自场景，保留实际月租、押金和查看详情入口。全卡可查看，矮屏滚动。
- [住房付款](evidence/housing-payment-painted-2026-10-26.png)：对应房型画面与实时账单；预约/交接同套纸卡，原按钮和快照防护保留。
- [基本生活费](evidence/living-cost-painted-2026-10-26.png)：食材插画、实际待付总额、基础/宠物/车辆分项、本月已付；原确认支付节点移至固定底部，不再藏在长卡片下面。
- [生活费已付](evidence/living-paid-painted-2026-10-26.png)、[现金不足](evidence/living-insufficient-painted-2026-10-26.png)：按真实付款回执和原禁用/筹款条件显示。
- [休息](evidence/rest-painted-2026-10-26.png)、[休息结果](evidence/rest-result-painted-2026-10-26.png)：复用用户确认life-activities中的原圆脸女孩沙发场景；原免费4h与实际状态变化保留。

## 图片与排版

新增assets/career/household-scenes.webp，1536×1024的3×2六场景图集：家人同住卧室、合租公共客厅、开放Studio、独立卧室1B、生活食材、钥匙合同账单。图像工具明确传入home-mobile和已确认生活图作为风格参考，使用厚实颗粒笔触、暖黄墨绿、圆润木家具和植物，不用写实肖像、不写死费用/文字、不画无关宠物。原生成PNG：/workspace/generated_images/exec-6d8b25d8-37c3-4c7b-b5c0-d6d62788b648.png。休息直接复用已确认图，不新增人物版本。

新增household-paper.js/css，沿既有life纸卡样式，手账边框、衬线标题、账单虚线与暖色按钮。四种房型仍用原data-housing-preview按钮；生活费仍用原data-v26/living及data-town/livingFund节点，只移动到footer，保留事件委托、金额、禁用和防重。预览和交接仍走原owner/月/在屏/报价校验，休息原确认节点不替换。医疗重定向时不覆盖页面，离开时清除本模块样式。

不改任何价格、押金、时长、状态、付款时机、次月续租/换房或已存档数据。住房/生活费用仍分别确认，不新增自动代扣。此前原图继续保留；旧截图存progress/evidence/household-before-painted/，此前住房和休息current截图已更新为新实际页面。

生产资源75、PR新增57、新接入39；候选459条不改。缓存wealth-life-v28.3-household-paper1，HTML/SW新JS/CSS和图一致，归档仍不部署。

## 验证

44个Node测试全部通过（含资源哈希/精确预缓存URL）。三个实际Chromium脚本均通过：

1. qa/browser-household-paper.py：四种房型对应场景和原按钮；浏览不消费；320/390/桌面居中无横溢；原生活费按钮在固定footer可见，实际支付800、余9200、已付重开不重扣；低现金付款禁用、原筹款入口可见；休息原4h执行及结果；保险/低健康页面不串样式；真实SW安装后断网可读图并支付生活费。证据qa/browser-evidence/household-paper.json。
2. qa/browser-housing-flow.py：首次租金+押金、生活费保险不随住房支付、同月不重复租金、次月不自动扣且无新押金、免费预约/取消、次月押金净额交接、缺款不部分扣、旧付款跨档/月/离屏拒绝。证据housing-flow.json。
3. qa/browser-rest-flow.py：免费4h、实际封顶变化、重复/再安排、读档/次月、时间不足/恰好够、原必要宠物照护1h预留、执行再查时间、旧回调防护、低健康/康复、明确不休息打勾、真实SW断网确认。证据rest-flow.json。

均无页面异常。这是隔离浏览器，不是真机或多年全事件验收。仅本地保存，未上传/合并/部署。
