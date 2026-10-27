# 第一项运动/户外确认2h（2026-10-26）

用户逐项确认第一项2h，其余八项仍待定；规则以docs/confirmed/life-activity-time-2026-10-26.md为准。本轮新增life-activity-time.js，仅对原lifestyle/运动支出加2h执行检查与当月lifeActivityTime凭据，时间不足/费用不足不扣费不扣时；复用currentCareerTime叠加已有课程、休息、社交、地图、欠时，不把其他活动草案接入。原费用和属性效果、月限、原随机后续均不改。

菜单、预览纸板及执行回执显示已确认耗时；预览签名包括当前空闲时间，执行前更新资源变化的报价并再检查。旧运动完成记录无时间凭据不追扣；读档保留凭据，次月失效。保留年度路径也经原lifestyle支付扣时，准备前检查时间避免先付其他账单后失败；没有改年度计划的其他费用和效果。

48项Node测试通过，新增life-activity-time.test.cjs覆盖2h/其余null、缺款和缺时原子性、恰好2h、重复、序列化、次月、旧档不追扣及年度预检查。IAB实际隔离fixture专项通过1h禁用不扣款、2h确认扣25剩0、原回调/读档防重、次月重置、旧完成记录不追扣；九项原费用/状态效果/月限回归通过，仅运动free减少2，其余维持。证据qa/browser-evidence/outdoor-time.txt与outdoor-time-nine-activities.txt。新预览截图progress/evidence/outdoor-two-hours-2026-10-26.png。

98张运行图及41张原PNG不变，191项缓存增加新JS为192项（精确URL静态资源检查通过；本轮未做真机/完整断网/24组生活审查全部重跑）。缓存wealth-life-v28.3-outdoor-time1。此前审查“九项均不扣时”已由本次确认部分覆盖，仅运动有已确认耗时，其他八项仍待用户逐项确认。本地保存未上传/合并/部署。
