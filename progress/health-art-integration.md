# 休息与康复图片接入

新增4张：Cozy Rest Arrangement Game Screen.png（libfile_e84b3825c7f0819185f4d3d2f9306588）、Cozy Rest Completed at Home.png（libfile_29c09dc6e8b081918a4e6696b62f2422）、Hospital Recovery Plan Preview.png（libfile_12449c350a1c819195864d62d36a3c6b）、Full-Month Recovery Game Popup.png（libfile_7f6025e477b08191bf7b35e75deb12fe）。本分支累计新增接入11张，不代表全项目接入总量。

仅显示插画区域，旧休息8h/+8与静态状态、旧图保险和自付金额均不展示。实际休息、医疗保单与冻结报价、确认按钮和恢复顺序使用原有实现。重病拦截改变弹窗时，不给医疗弹窗误插休息图。

浏览器实测休息预览/确认/结果/再次预览/返回：94h→90h，能量+6、压力-2、健康+1，现金2850和月份保持不变。插画路由VM检查保持原数据和确认动作，含重病重定向；另回归原休息和医疗康复测试。康复图片路由为自动测试，未完成整条医疗浏览器或真实手机验收。未合并、未部署。
