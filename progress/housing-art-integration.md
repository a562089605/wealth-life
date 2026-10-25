# 住房与生活费图片接入

新增3张：Updated housing selection cost preview.png（libfile_a6b329d3b5d08191813d3d7e4a57df92）、Studio move-in reservation preview.png（libfile_4fb72752a9b481918a55aedd568e8d72）、Cozy monthly living cost screen.png（libfile_7f31c84d52708191986164ae4f88f3aa）。本分支累计新增接入18张，不代表项目总量。

候选Cozy Small-Town Rental Room Preview.png和Cozy handpainted studio payment screen.png实际是投资房卡，本次未错接为自住房。

住房按钮先打开真实费用预览，确认才调用原支付/预约函数。报价失效重算；次月预约不扣款，预览旧押金返还和新押金/租金。仅取图片插画，静态金额不覆盖账本。生活费页沿用原本确认与付款回执。

浏览器实测：合租预览房租881+押金881，确认现金2650→888；Studio次月预约预览当前支付0、退款881、新月费/押金各1432、净付款1983。自动测试验证预览不扣款、报价变更重算、预约路由及原住房押金/生活费防重。生活费图片和完整换房交接未做浏览器实测。未合并/部署，未做iPhone/离线验收。
