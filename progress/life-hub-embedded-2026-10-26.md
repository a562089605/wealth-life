# 生活主页面嵌画增量（2026-10-26，美东）

基于远端195aab858e1c6495d8034582fdbcc44b26c4f830，继续fix/illustrated-home-scene。用户看过生活主页面后要求“可以做成嵌入插画的样子吗”。本次只修改生活主页面构图，未把新视觉标记为用户已确认。

新增assets/career/life-arrangements-embedded.webp，1024×1536。内置image_gen使用原life-arrangements和已确认living-bill-scene作参考，暖黄墨绿颗粒绘本桌面；房屋/食材/盾牌保单/手账/茶杯五个物件留白标牌，底部木牌留给动态待付汇总。原PNG保存在assets/archive/generated-originals/life-arrangements-embedded.png；生成提示见image-prompts/life-hub-embedded.txt。旧横版图、原截图、候选及全部归档不动。

life-hub-art.js仍移动原五个button节点，保留onclick和可访问名称；使用百分比定位在画内，标题为真实DOM文字，必要事项数量及待付金额仍从necessaryBills实时读取，不写死800。保留未报价事项提示及底部返回/原月度确认。简短说明保留给辅助技术，必要事项数量可见。未改变费用、时间、状态、月限、付款或存档；基础生活描述不再重复列已包含在住房费内的水电。

缓存更新wealth-life-v28.3-life-hub-embedded1；新图及精确JS/CSS查询URL加入SW。77张生产图（含保留旧图，不代表77张规则卡）、20张生成原PNG，459候选原样。

验证：45个Node测试通过，含生产资源哈希/精确预缓存URL/PNG原稿完整性。实际本地IAB独立试玩新档逐一点开五个入口，均进入原页面；查看后现金仍10000，时间仍100h，月份不变。未付住房/生活费时按月度确认仍进入必要事项页，不越过原门禁。完整桌面截图见evidence/life-hub-embedded-2026-10-26.png。按钮保留键盘焦点样式及最小44px点击高度；本轮未做真实手机、320/390视口或断网浏览器重跑，旧浏览器脚本结果不冒充本轮新构图验收。未访问用户实际存档。

本次本地保存，未上传/合并/部署。下一步让用户核对嵌画生活主页面；未确认新保险/活动规则。
