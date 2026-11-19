// User-confirmed 29 career artworks and final effects. Internal rules are kept out of card copy.
(function(r){const cards={"barista-busy":{"id":"barista-busy","title":"周末爆单","story":"这个周末，店里订单接连不断，吧台忙得停不下来。经理问你愿不愿意加班帮忙。","art":"assets/career-events-20261116/barista-busy-painted-batch2-20261117.webp","options":[{"label":"加班帮忙","description":"","effects":{"energy":-5,"stress":3,"tips":"按当前规则另计","hours":8,"service":1,"paidHours":8,"tipFormula":"barista-busy"}},{"label":"不加班","description":"","effects":{}}],"effects":null},"barista-cut":{"id":"barista-cut","title":"经理削减排班","story":"门店客流减少，经理提出削减一个平常日的8小时班。","art":"assets/career-events-20261116/barista-cut-painted-20261117.webp","options":[{"label":"接受调整","description":"","effects":{"energy":3,"tips":"按减少工时扣减，运行页面显示当月准确金额","hours":-8,"paidHours":-8,"tipFormula":"cut","stress":2}},{"label":"先与经理商量","description":"能不能少减一点班？","effects":{},"follow":"cut"}],"effects":null},"barista-departure":{"id":"barista-departure","title":"同事突然离职","story":"一名同事突然离职。新人到岗前，经理问你愿不愿意多帮忙上四个班，分散安排在本月：两个平常日、两个周末，每班8小时。","art":"assets/career-events-20261116/barista-departure-painted-batch2-20261117.webp","options":[{"label":"接受临时加班","description":"","effects":{"energy":-12,"stress":6,"trust":2,"tips":"按当前规则另计","hours":32,"service":4,"paidHours":32,"tipFormula":"barista-departure"}},{"label":"不接受加班","description":"","effects":{}}],"effects":null},"barista-staff":{"id":"barista-staff","title":"同事临时请假","story":"今天早上，经理发来消息：“有同事突然生病了，你今天能来顶一个完整班吗？”","art":"assets/career-events-20261116/barista-staff-painted-batch2-20261117.webp","options":[{"label":"去顶班","description":"","effects":{"energy":-4,"stress":2,"trust":1,"tips":"按当前规则另计","hours":8,"service":1,"paidHours":8,"tipFormula":"barista-staff"}},{"label":"婉拒","description":"","effects":{}}],"effects":null},"barista-tip":{"id":"barista-tip","title":"常客的大额小费","story":"一位常客很喜欢你做的咖啡，夸奖了你的服务，并留下$20.00额外小费。","art":"assets/career-events-20261116/barista-tip-painted-batch2-20261117.webp","options":[{"label":"开心接受","description":"","effects":{"happiness":3,"tips":20}}],"effects":null},"manager-decline":{"id":"manager-decline","title":"经营业绩下滑","story":"最近店里的营业额有所下滑。你查看了经营报表，准备怎么应对？","art":"assets/career-events-20261116/manager-decline.webp","options":[{"label":"亲自分析问题，调整服务与经营安排","description":"","effects":{"energy":-2,"stress":3,"management":15,"service":5},"follow":"decline-a"},{"label":"召集团队讨论，一起改进","description":"","effects":{"energy":-1,"stress":1,"management":10},"follow":"decline-b"},{"label":"暂时维持现状，继续观察","description":"","effects":{},"followCardId":"manager-decline-c-followup"}],"effects":null},"manager-decline-a-failure":{"id":"manager-decline-a-failure","title":"暂未见效","story":"你尝试调整了服务和经营安排，但生意暂时没有明显起色，还需要继续摸索。","art":"assets/career-events-20261116/manager-decline-a-failure-painted-batch6-20261117.webp","options":[],"effects":{"stress":1,"management":5}},"manager-decline-a-success":{"id":"manager-decline-a-success","title":"调整见效","story":"调整逐渐见效，顾客反馈有所改善，店里的生意也有了起色。","art":"assets/career-events-20261116/manager-decline-a-success-painted-batch6-20261117.webp","options":[],"effects":{"stress":-4,"happiness":2,"management":10,"sales":0.05}},"manager-decline-b-failure":{"id":"manager-decline-b-failure","title":"还得再想想办法","story":"大家提出了一些改进办法，但尝试后，店里的生意暂时没有明显改善。","art":"assets/career-events-20261116/manager-decline-b-failure-painted-batch6-20261117.webp","options":[],"effects":{"stress":1,"management":3}},"manager-decline-b-success":{"id":"manager-decline-b-success","title":"大家的办法奏效了","story":"大家一起提出的改进办法逐渐见效，服务更顺畅，店里的生意也有了改善。","art":"assets/career-events-20261116/manager-decline-b-success-painted-batch6-20261117.webp","options":[],"effects":{"stress":-2,"happiness":1,"management":5,"sales":0.03}},"manager-departure":{"id":"manager-departure","title":"员工突然离职","story":"一名员工突然离职。新人到岗前，招聘和工作交接都需要尽快安排。你准备怎么处理？","art":"assets/career-events-20261116/manager-departure-painted-batch8-20261117.webp","options":[{"label":"亲自招聘、交接","description":"额外加班完成招聘与交接。","effects":{"energy":-2,"stress":2,"trust":1,"management":15,"hours":4,"paidHours":4}},{"label":"安排主管协助","description":"正常班内安排主管协助招聘与交接。","effects":{"stress":1,"management":8}},{"label":"请求上级支援","description":"","effects":{"stress":-2,"trust":-1}}],"effects":null},"manager-equipment":{"id":"manager-equipment","title":"设备故障","story":"店里的咖啡机突然出了故障，部分饮品暂时无法制作。你准备怎么安排？","art":"assets/career-events-20261116/manager-equipment-painted-batch8-20261117.webp","options":[{"label":"亲自协调抢修与现场安排","description":"","effects":{"energy":-2,"stress":2,"trust":1,"management":15,"storeCost":500}},{"label":"交由主管执行，你负责审核","description":"","effects":{"stress":1,"management":8,"storeCost":500}},{"label":"暂停受影响的出品，等待维修","description":"","effects":{"stress":-1,"management":3,"storeCost":500}}],"effects":null},"manager-excellent":{"id":"manager-excellent","title":"门店经营表现优秀","story":"这个月，门店运营顺畅，顾客反馈良好。上级肯定了你的管理表现，并发给你一笔奖金。","art":"assets/career-events-20261116/manager-excellent-painted-batch8-20261117.webp","options":[{"label":"开心接受","description":"","effects":{"stress":-3,"happiness":3,"trust":1,"management":15,"bonus":200}}],"effects":null},"manager-research":{"id":"manager-research","title":"研发新品","story":"店里准备推出一款新饮品。你打算怎样推进研发？","art":"assets/career-events-20261116/manager-research-painted-batch7-20261117.webp","options":[{"label":"亲自试做，调整配方","description":"","effects":{"energy":-2,"stress":2,"management":15,"storeCost":100},"follow":"research-a"},{"label":"组织团队试做，汇总意见","description":"","effects":{"energy":-1,"stress":1,"management":10,"storeCost":100},"follow":"research-b"}],"effects":null},"manager-research-a-failure":{"id":"manager-research-a-failure","title":"配方还得再调整","story":"试做了几轮，新饮品的口味还是不够稳定，暂时没能达到推出的标准。","art":"assets/career-events-20261116/manager-research-a-failure.webp","options":[],"effects":{"stress":1,"management":5,"pourOver":3,"latte":3}},"manager-research-a-success":{"id":"manager-research-a-success","title":"新口味受到欢迎","story":"反复调整后，新饮品终于定下配方。推出后，顾客的反馈不错，也带动了店里的生意。","art":"assets/career-events-20261116/manager-research-a-success-painted-batch7-20261117.webp","options":[],"effects":{"stress":-3,"happiness":2,"trust":1,"latte":5,"pourOver":5,"bonus":150,"sales":0.05}},"manager-research-b-failure":{"id":"manager-research-b-failure","title":"还没找到合适的配方","story":"大家试做了几种方案，但口味和制作流程还不够稳定，新饮品暂时没能推出。","art":"assets/career-events-20261116/manager-research-b-failure-painted-batch7-20261117.webp","options":[],"effects":{"stress":1,"management":3}},"manager-research-b-success":{"id":"manager-research-b-success","title":"一起做出了新口味","story":"大家分工试做，反复交流意见，终于确定了新饮品的配方。推出后，顾客的反馈不错。","art":"assets/career-events-20261116/manager-research-b-success-painted-batch7-20261117.webp","options":[],"effects":{"stress":-2,"happiness":1,"management":5,"bonus":75,"sales":0.05}},"shift-acting":{"id":"shift-acting","title":"临时代理经理","story":"经理临时有事需要离店，希望你额外多上一个完整8小时班，并负责这一班的门店运营。","art":"assets/career-events-20261116/shift-acting-painted-batch5-20261117.webp","options":[{"label":"接受代理","description":"","effects":{"energy":-4,"stress":2,"trust":1,"management":10,"tips":"按当前规则另计","hours":8,"paidHours":8,"tipFormula":"shift"},"follow":"acting"},{"label":"婉拒","description":"","effects":{}}],"effects":null},"shift-acting-failure":{"id":"shift-acting-failure","title":"忙不过来","story":"","art":"assets/career-events-20261116/shift-acting-failure-painted-batch5-20261117.webp","options":[],"effects":{"stress":2,"trust":-1}},"shift-acting-success":{"id":"shift-acting-success","title":"代理非常成功","story":"","art":"assets/career-events-20261116/shift-acting-success-painted-batch5-20261117.webp","options":[],"effects":{"stress":-1,"trust":1,"bonus":100}},"shift-complaint":{"id":"shift-complaint","title":"顾客严重投诉","story":"顾客的饮品连续做错两次，非常生气，要求负责人立即处理。你会怎么做？","art":"assets/career-events-20261116/shift-complaint-painted-batch4-20261117.webp","options":[{"label":"亲自处理并补偿","description":"","effects":{"energy":-1,"stress":2,"trust":1,"management":8,"service":12}},{"label":"让员工先处理","description":"","effects":{},"follow":"complaint"},{"label":"直接退款","description":"","effects":{"stress":1,"management":3,"storeRefund":true}}],"effects":null},"shift-complaint-failure":{"id":"shift-complaint-failure","title":"处理失败","story":"","art":"assets/career-events-20261116/shift-complaint-failure-painted-batch4-20261117.webp","options":[],"effects":{"stress":1,"trust":-1,"service":3}},"shift-complaint-success":{"id":"shift-complaint-success","title":"处理成功","story":"员工成功安抚顾客，并重新制作了正确的饮品。","art":"assets/career-events-20261116/shift-complaint-success-painted-batch4-20261117.webp","options":[],"effects":{"management":6,"service":6}},"shift-praise":{"id":"shift-praise","title":"团队表现优秀","story":"","art":"assets/career-events-20261116/shift-praise-painted-batch5-20261117.webp","options":[{"label":"开心接受","description":"","effects":{"stress":-2,"happiness":3,"trust":1,"management":10,"service":5,"bonus":150}}],"effects":null},"shift-schedule":{"id":"shift-schedule","title":"排班冲突","story":"两位员工同一天无法上班，门店出现一个完整8小时班次缺口。你需要协调处理。","art":"assets/career-events-20261116/shift-schedule-painted-batch3-20261117.webp","options":[{"label":"重新协调排班","description":"","effects":{"energy":-1,"stress":1,"trust":1,"management":12}},{"label":"让两位同事自行协调","description":"","effects":{},"follow":"schedule"},{"label":"自己加班补上","description":"","effects":{"energy":-4,"stress":2,"trust":1,"management":3,"tips":"按当前规则另计","hours":8,"paidHours":8,"tipFormula":"shift"}},{"label":"请经理决定","description":"","effects":{"stress":-1}}],"effects":null},"shift-schedule-failure":{"id":"shift-schedule-failure","title":"协调失败","story":"两位同事最终没能找到替班人，这个8小时的班最后还是由你补上。","art":"assets/career-events-20261116/shift-schedule-failure-painted-batch3-20261117.webp","options":[],"effects":{"energy":-5,"stress":3,"trust":1,"management":3,"tips":"按当前规则另计","hours":8,"paidHours":8,"tipFormula":"shift"}},"shift-schedule-success":{"id":"shift-schedule-success","title":"协调成功","story":"两位员工成功找到替班人，门店排班问题解决。","art":"assets/career-events-20261116/shift-schedule-success-painted-batch3-20261117.webp","options":[],"effects":{"stress":-1,"management":5}},"shift-training":{"id":"shift-training","title":"新人培训","story":"门店来了新同事，经理安排你在正常排班内负责带教。这位新人对咖啡很有热情，但还不太熟悉流程。","art":"assets/career-events-20261116/shift-training-painted-batch3-20261117.webp","options":[{"label":"认真带教","description":"","effects":{"energy":-2,"stress":1,"trust":1,"management":15}},{"label":"请咖啡师同事帮忙带教","description":"请一位熟悉流程的咖啡师同事带新人，你负责交代带教重点。","effects":{"energy":-1,"management":5}}],"effects":null},"barista-cut-followup":{"id":"barista-cut-followup","title":"商量后的排班","story":"你和经理商量后，经理同意只削减半个班。","art":"assets/career-events-20261116/barista-cut-followup-painted-20261117.webp","options":[],"effects":{"hours":-4,"paidHours":-4,"tipFormula":"cut","energy":1,"stress":1}},"manager-decline-c-followup":{"id":"manager-decline-c-followup","title":"上司询问改进计划","story":"上司看完经营报表后，问你打算什么时候采取行动。你说明想再观察一段时间，上司希望你尽快拿出改进计划。","art":"assets/career-events-20261116/manager-decline-c-followup-20261118.webp","options":[],"effects":{"trust":-1},"confirmLabel":"知道了"}};
 Object.assign(cards,{
 "partner-reserve": {
  "id": "partner-reserve",
  "title": "淡季前的账本",
  "story": "9 月的淡季快到了。你翻开账本，考虑要不要多留一笔营运现金。",
  "art": "assets/career-events-20261116/partner-reserve.webp?v=20261119-painted2",
  "options": [
   {
    "label": "照常分红",
    "description": "按现有月结规则计算分红。",
    "effects": {}
   },
   {
    "label": "给门店多留一笔现金",
    "description": "从本月可分配利润最多留 $2,000，补充营运储备；实际留存以月结为准。",
    "effects": {
     "retain": 2000
    }
   }
  ],
  "effects": null
 },
 "partner-machine": {
  "id": "partner-machine",
  "title": "咖啡机修还是换",
  "story": "咖啡机又闹起了脾气。维修师傅递过来两份报价。",
  "art": "assets/career-events-20261116/partner-machine.webp?v=20261119-painted2",
  "options": [
   {
    "label": "维修旧机器",
    "description": "门店支付 $500。",
    "effects": {
     "storeCost": 500
    }
   },
   {
    "label": "更换机器",
    "description": "门店支付 $2,000。次月起每月节省 $300，持续 6 个月。",
    "effects": {
     "storeCost": 2000,
     "monthlySaving": 300,
     "duration": 6
    }
   },
   {
    "label": "暂缓处理",
    "description": "先维持营业，门店本月不花这笔钱。",
    "effects": {}
   }
  ],
  "effects": null
 },
 "partner-beans": {
  "id": "partner-beans",
  "title": "豆商的年度报价",
  "story": "豆商带着样品来访，愿意给门店一份采购折扣。",
  "art": "assets/career-events-20261116/partner-beans.webp?v=20261119-painted2",
  "options": [
   {
    "label": "继续按月采购",
    "description": "本月无需预付。",
    "effects": {}
   },
   {
    "label": "预付豆款",
    "description": "门店预付 $1,200。次月起连续 6 个月，每月抵扣 $200，另省 $100。",
    "effects": {
     "storeCost": 1200,
     "monthlySaving": 300,
     "duration": 6
    }
   }
  ],
  "effects": null
 },
 "partner-order": {
  "id": "partner-order",
  "title": "周末的大订单",
  "story": "附近公司要订一批饮品。现有排班忙不过来，你得决定怎么接单。",
  "art": "assets/career-events-20261116/partner-order.webp?v=20261119-painted2",
  "options": [
   {
    "label": "自己加班接单",
    "description": "占用 4 小时自由时间，门店本月净增 $450。",
    "effects": {
     "hours": 4,
     "storeNet": 450
    }
   },
   {
    "label": "请员工加班",
    "description": "含员工加班费，门店本月净增 $250。",
    "effects": {
     "storeNet": 250
    }
   },
   {
    "label": "婉拒订单",
    "description": "维持原排班。",
    "effects": {}
   }
  ],
  "effects": null
 },
 "partner-bakery": {
  "id": "partner-bakery",
  "title": "隔壁面包店来谈合作",
  "story": "隔壁老板带来新烤的面包，想与你一起推出早餐套餐。",
  "art": "assets/career-events-20261116/partner-bakery.webp?v=20261119-painted2",
  "options": [
   {
    "label": "小规模试卖",
    "description": "门店投入 $200，扣原料后的额外收入为 $100–$500。",
    "effects": {
     "storeCost": 200,
     "netRange": [
      100,
      500
     ]
    }
   },
   {
    "label": "投入正式推广",
    "description": "门店投入 $600，扣原料后的额外收入为 $300–$1,300。",
    "effects": {
     "storeCost": 600,
     "netRange": [
      300,
      1300
     ]
    }
   },
   {
    "label": "暂缓合作",
    "description": "先维持现有菜单。",
    "effects": {}
   }
  ],
  "effects": null
 }
});
 r.CareerEventData={cards,managerNaturalDrawEnabled:true,managerTriggerProbability:.35,managerRepeatMonths:3};if(typeof module!=="undefined")module.exports=r.CareerEventData;})(typeof window==="undefined"?globalThis:window);
