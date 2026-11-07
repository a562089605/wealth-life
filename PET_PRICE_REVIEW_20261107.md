# 猫专业护理与蜘蛛普通病费用复查（用户已确认，2026-11-07）

继续原财富人生。基线main a666bcb414869fccf4212b22db9ed0f76c5e4ca1；本轮实际GitHub Cloudflare成功check https://github.com/a562089605/wealth-life/runs/128325946673 。工作区此前无已跟踪差异；游戏现价已读实际代码：猫专业护理60/次（1h、3个月周期）；捕鸟蛛不舒服卡80未投保原价（3h、玩家能量−2、压力+2）。以上是审查时基线；随后用户明确同意猫60保留、蜘蛛普通病改120。现已本地接入，待发布核对。

## 猫：修正此前“60偏低”的判断，建议保留60

直接门店同口径来源 All Creatures Pet Grooming，Orlando 2411 E South St：
https://www.allcreaturespetgrooming.com/cats
https://www.allcreaturespetgrooming.com/salon

官网公开基础猫洗护60起，含洗澡、剪指甲、耳部清洁、吹干和梳毛；局部修剪套餐80起，全身造型100起。最终按体型、性格和毛况调整，起价不是所有银渐层的保证报价。游戏现有专业清洁可按基础洗护理解，60有直接地方门店依据，建议保留。

此前只比照4Pets Mobile猫护理125，把上门服务价格拿来判断门店基础护理偏低，依据不够贴近；本次补到同口径门店报价后明确修正。4Pets的125仍为真实上门报价，但不能据此要求游戏门店护理一定涨价：
https://www.4petsmobile.com/mobile-services

## 蜘蛛：用户已确认普通病80改120

Exotic Animal Hospital of Orlando公开常规检查85、急诊检查155–185，仅检查不能等同完整治疗套餐；其公开价目并没有捕鸟蛛专属固定诊疗价：
https://orlandoexoticveterinarian.com/service-pricing/

附近Apopka的Park Avenue Animal Hospital确实列有捕鸟蛛就诊及生病/受伤服务，但公开页面没有同口径固定费用：
https://parkavenuevets.com/services/exotic-vet

因此不能说“蜘蛛治疗现实统一120”。120是基于当地异宠常规门诊量级、为简单处理留余量的游戏预算建议；80不是绝不可能，但若代表一次就诊和简单处理则预算较紧。该建议不把普通病当急诊/住院，也不改变已经确认的健康0治疗总费500。

## 已确认结果与接入边界

- 猫专业护理：60保留。
- 蜘蛛普通生病卡：80→120（未保险原价），用户已确认。
- 蜘蛛保险仍5/月，新保单涵盖的普通病仍全赔；健康0疏忽治疗仍总费500、有全额保障时自付250。自由时间/能量/压力及其余宠物价格、地图权重不变。
- 现已同步事件数据、普通原价和实际自付显示：复用现有金额层显示120/0/24；保留原画和其印刷价80，旧80/0/16报价仍原价呈现并结算。未批量重画。原approved-manifest的quote更新120，originalQuote保留80及原SHA，附本次用户确认的priceRevision。


## 验证与发布

61项Node58通过，原coffee-rules/opening-state/shift-lead三项基线失败保留，qa/spider-price-node-20261107.json。新检查覆盖新120与旧80、全额/80%/无保险、晚投保不改旧价、失败回滚/重试/回执、3h/能量−2/压力+2/宠物健康不变，猫60和蜘蛛危重500/基准保费5/基础月费18保留。

真实Chromium隔离925槽逐一核对新120/0/24与旧80/0/16的卡面和实际扣款、旧待处理卡刷新80、保存失败重试，320/375/390/1280价格不溢出。原35卡全套浏览器回归通过；qa/spider-price-browser-results-20261107.json、qa/spider-price-regression-20261107.json。原画不改，截图/workspace/spider-price-120-390.png等仅为隔离测试预览。SW实际去重回归与231唯一存在引用通过。

基线远端/Cloudflare已核，两个实际线上脚本与基线字节一致，qa/spider-price-baseline-20261107.json。本轮实现与验证已本地完成，待原main上传、Cloudflare成功及改动线上文件逐字节核对。

真实iPhone/PWA、完整离线和长期平衡仍未验收；Mac原目录仍不可访问。本次没有上调猫价，也没有修改其他宠物费用或存档。
