// User-confirmed Studio cards, 2026-11-03. Independent pool; no lease/save resets.
(function(root){
 const cards=[
 {
  "id": "morning",
  "title": "晨光正好",
  "desc": "休息日，你睡到自然醒。阳光透过窗帘落在地板上，房间安安静静。今天不用配合谁的安排，整个早晨都属于你。",
  "art": "assets/studio/morning-20261103.webp",
  "hotspots": [
   [
    76,
    9
   ],
   [
    87,
    9
   ]
  ],
  "choices": [
   {
    "label": "泡杯咖啡，听着音乐享受早晨",
    "cash": 0,
    "hours": 0,
    "happiness": 4,
    "energy": 0,
    "stress": -3,
    "health": 0
   },
   {
    "label": "做份早餐，配着搞笑综艺一起吃",
    "cash": 0,
    "hours": 0,
    "happiness": 3,
    "energy": 2,
    "stress": -2,
    "health": 0
   }
  ]
 },
 {
  "id": "cook",
  "title": "小试牛刀",
  "desc": "你翻到一道收藏很久的菜谱，刚好厨房也空着。今天没人催你，也不用迁就别人的口味，要不要试着给自己做顿好吃的？",
  "art": "assets/studio/cook-20261103.webp",
  "hotspots": [
   [
    68,
    10
   ],
   [
    79,
    9
   ],
   [
    89,
    8
   ]
  ],
  "choices": [
   {
    "label": "买好食材，照着菜谱认真做一顿",
    "cash": -20,
    "hours": 2,
    "happiness": 5,
    "energy": -1,
    "stress": 0,
    "health": 0
   },
   {
    "label": "做份简单的，吃饱也很满足",
    "cash": -8,
    "hours": 1,
    "happiness": 3,
    "energy": 0,
    "stress": 0,
    "health": 0
   },
   {
    "label": "还是叫个外卖吧",
    "cash": -30,
    "hours": 0,
    "happiness": 2,
    "energy": 0,
    "stress": 0,
    "health": 0
   }
  ]
 },
 {
  "id": "corner",
  "title": "属于我的小角落",
  "desc": "窗边一直空着。你想把这里布置成一个舒服的小角落，下班后可以坐下来看看书、发发呆，让房间更有自己的样子。",
  "art": "assets/studio/corner-20261103.webp",
  "hotspots": [
   [
    74,
    11
   ],
   [
    86,
    11
   ]
  ],
  "choices": [
   {
    "label": "添一盏灯和软垫，布置得舒服些",
    "cash": -60,
    "hours": 3,
    "happiness": 5,
    "energy": -1,
    "stress": 0,
    "health": 0
   },
   {
    "label": "挪挪现有家具，也能焕然一新",
    "cash": 0,
    "hours": 2,
    "happiness": 3,
    "energy": -2,
    "stress": 0,
    "health": 0
   }
  ]
 },
 {
  "id": "cinema",
  "title": "一个人的放映厅",
  "desc": "晚饭后，你翻到一部收藏很久的电影。窝进舒服的位置，今晚看什么、什么时候暂停，都由自己决定。",
  "art": "assets/studio/cinema-20261103.webp",
  "hotspots": [
   [
    76,
    10
   ],
   [
    87,
    10
   ]
  ],
  "choices": [
   {
    "label": "备好零食，享受一场电影",
    "cash": -10,
    "hours": 3,
    "happiness": 5,
    "energy": 0,
    "stress": -4,
    "health": 0
   },
   {
    "label": "看集短剧，轻松一下就休息",
    "cash": 0,
    "hours": 1,
    "happiness": 2,
    "energy": 0,
    "stress": -2,
    "health": 0
   }
  ]
 },
 {
  "id": "tea",
  "title": "朋友来做客",
  "desc": "朋友发来消息：“还没去过你的新家呢！”你看看小小的房间，收拾一下，正好可以准备些小零食，和朋友喝个下午茶、聊聊近况。",
  "art": "assets/studio/tea-20261103.webp",
  "hotspots": [
   [
    76,
    12
   ],
   [
    89,
    7
   ]
  ],
  "choices": [
   {
    "label": "准备些小零食，一起享受下午茶",
    "cash": -35,
    "hours": 3,
    "happiness": 6,
    "energy": -1,
    "stress": -4,
    "health": 0
   },
   {
    "label": "今天想自己待着，改天再约",
    "cash": 0,
    "hours": 0,
    "happiness": 0,
    "energy": 0,
    "stress": 0,
    "health": 0
   }
  ]
 },
 {
  "id": "gaming",
  "title": "开麦，快乐加倍",
  "desc": "晚上，朋友喊你上线：“就差你了，开麦一起玩！”独住的好处这时格外明显，不用顾虑打扰同屋的人，可以自在地语音聊天，和朋友痛快玩几局。",
  "art": "assets/studio/gaming-20261103.webp",
  "hotspots": [
   [
    76,
    10
   ],
   [
    87,
    10
   ]
  ],
  "choices": [
   {
    "label": "开黑到天明",
    "cash": 0,
    "hours": 3,
    "happiness": 6,
    "energy": -1,
    "stress": -4,
    "health": -1
   },
   {
    "label": "今晚玩一小会儿，过过瘾就下线",
    "cash": 0,
    "hours": 1,
    "happiness": 3,
    "energy": 0,
    "stress": -2,
    "health": 0
   }
  ]
 },
 {
  "id": "keepsake",
  "title": "柜子里的小惊喜",
  "desc": "整理柜子时，你翻出一件闲置已久的小物件，保存得还不错。与其继续放着积灰，不如给它找个新去处，或者动手改造，让旧物焕发新意。",
  "art": "assets/studio/keepsake-20261103.webp",
  "hotspots": [
   [
    75,
    12
   ],
   [
    88,
    9
   ]
  ],
  "choices": [
   {
    "label": "拍照挂上二手平台，卖给需要的人",
    "cash": 40,
    "hours": 1,
    "happiness": 2,
    "energy": 0,
    "stress": 0,
    "health": 0
   },
   {
    "label": "旧物改造",
    "cash": 0,
    "hours": 3,
    "happiness": 5,
    "energy": -1,
    "stress": 0,
    "health": 0
   }
  ]
 },
 {
  "id": "rain",
  "title": "雨落小窗",
  "desc": "回到家，窗外的雨还在下。关上房门，点亮暖黄的小灯，终于可以把外面的忙碌放下，好好陪自己待一会儿。",
  "art": "assets/studio/rain-20261103.webp",
  "hotspots": [
   [
    76,
    10
   ],
   [
    87,
    10
   ]
  ],
  "choices": [
   {
    "label": "泡个热水澡，慢慢放松下来",
    "cash": 0,
    "hours": 1,
    "happiness": 3,
    "energy": 2,
    "stress": -4,
    "health": 0
   },
   {
    "label": "裹着毯子，听雨发一会儿呆",
    "cash": 0,
    "hours": 1,
    "happiness": 2,
    "energy": 2,
    "stress": -3,
    "health": 0
   }
  ]
 },
 {
  "id": "fridge",
  "title": "冰箱里的倒计时",
  "desc": "打开冰箱，你发现前几天买的食材还剩不少，有几样已经不太耐放。趁着还新鲜，得想办法安排一下，免得最后只能扔掉。",
  "art": "assets/studio/fridge-20261103.webp",
  "hotspots": [
   [
    76,
    11
   ],
   [
    88,
    9
   ]
  ],
  "choices": [
   {
    "label": "做成几份便当，接下来吃得省心",
    "cash": 0,
    "hours": 2,
    "happiness": 3,
    "energy": -2,
    "stress": 0,
    "health": 0
   },
   {
    "label": "今晚简单做一顿，剩下的分装冷冻",
    "cash": 0,
    "hours": 1,
    "happiness": 2,
    "energy": -1,
    "stress": 0,
    "health": 0
   }
  ]
 },
 {
  "id": "keys",
  "title": "钥匙落在屋里",
  "desc": "你出门倒垃圾，门在身后“咔哒”一声关上。摸摸口袋，才发现钥匙忘在了屋里。好在附近的朋友那里，还放着一把备用钥匙。",
  "art": "assets/studio/keys-20261103.webp",
  "hotspots": [
   [
    76,
    10
   ],
   [
    87,
    10
   ]
  ],
  "choices": [
   {
    "label": "请锁匠上门，花钱解决",
    "cash": -100,
    "hours": 1,
    "happiness": 0,
    "energy": 0,
    "stress": 1,
    "health": 0
   },
   {
    "label": "去朋友那里取备用钥匙",
    "cash": 0,
    "hours": 3,
    "happiness": 0,
    "energy": -2,
    "stress": 1,
    "health": 0
   }
  ]
 },
 {
  "id": "call",
  "title": "想找个人说说话",
  "desc": "今天发生了一件小事，你很想讲给谁听。回到家，房间安安静静，你拿起手机，翻到了熟悉的名字。",
  "art": "assets/studio/call-20261103.webp",
  "hotspots": [
   [
    76,
    11
   ],
   [
    88,
    8
   ]
  ],
  "choices": [
   {
    "label": "打个电话，聊聊彼此的近况",
    "cash": 0,
    "hours": 2,
    "happiness": 4,
    "energy": 0,
    "stress": -3,
    "health": 0
   },
   {
    "label": "睡一觉，明天早上什么都好了",
    "cash": 0,
    "hours": 0,
    "happiness": 0,
    "energy": 0,
    "stress": 0,
    "health": 0
   }
  ]
 },
 {
  "id": "noise",
  "title": "门外的施工声",
  "desc": "难得想在家安静休息，隔壁却传来钻墙声。问过物业，才知道今天还有一阵施工。原定的休息计划，只好临时调整。",
  "art": "assets/studio/noise-20261103.webp",
  "hotspots": [
   [
    76,
    11
   ],
   [
    88,
    8
   ]
  ],
  "choices": [
   {
    "label": "去咖啡馆坐坐，换个清静地方",
    "cash": -15,
    "hours": 1,
    "happiness": 0,
    "energy": 0,
    "stress": 1,
    "health": 0
   },
   {
    "label": "戴上耳塞，留在家里等施工结束",
    "cash": 0,
    "hours": 0,
    "happiness": -2,
    "energy": 0,
    "stress": 2,
    "health": 0
   }
  ]
 }
];
 function data(s){return s.studioEvents??={version:1,seen:{},records:{}};}
 function eligible(s){const seen=s.studioEvents?.seen||{},pool=cards.filter(c=>seen[c.id]==null||s.month-seen[c.id]>6),unseen=pool.filter(c=>seen[c.id]==null);return unseen.length?unseen:pool;}
 function draw(s,random=Math.random){const d=data(s);if(d.records[s.month])return d.records[s.month];const r=d.records[s.month]={pool:'studio',month:s.month,status:'none',cardId:null};if(s.housing!=='studio')return r;const pool=eligible(s);if(random()>=.5||!pool.length)return r;const c=pool[Math.min(pool.length-1,Math.floor(random()*pool.length))];r.cardId=c.id;r.status='pending';r.presented=false;d.seen[c.id]=s.month;return r;}
 function missing(s,r,index,free,reserve=0){const o=cards.find(c=>c.id===r?.cardId)?.choices[index];if(!o||r.status!=='pending'||r.month!==s.month)return ['此选项已失效'];const a=[];if(s.cash+(o.cash||0)<0)a.push('现金不足');if(free<o.hours)a.push('自由时间不足');else if(o.hours&&free-o.hours<reserve)a.push('需保留必要宠物照护时间');return a;}
 function resolve(s,month,id,index,free,reserve=0){const r=s.studioEvents?.records[month];if(!r||r.cardId!==id||missing(s,r,index,free,reserve).length)return false;const o=cards.find(c=>c.id===id).choices[index];r.status='resolved';r.choice=index;r.hours=o.hours;r.effects={};for(const k of ['cash','health','energy','stress','happiness']){if(!o[k])continue;const before=s[k]||0;s[k]=k==='cash'?Math.round((before+o[k])*100)/100:Math.max(0,Math.min(100,before+o[k]));r.effects[k]=s[k]-before;}if(o.cash)(s.financeLedger??=[]).push({kind:o.cash>0?'studioIncome':'studioExpense',month,id,amount:Math.abs(o.cash)});return true;}
 function used(s){return Object.values(s.studioEvents?.records||{}).filter(r=>r.month===s.month&&r.status==='resolved').reduce((n,r)=>n+(r.hours||0),0);}
 function plan(s,r,index,free,reserve=0,rates={}){const o=cards.find(c=>c.id===r?.cardId)?.choices[index];if(!o||r.status!=='pending'||r.month!==s.month||!Number.isFinite(free)||free<0||!Number.isFinite(reserve)||reserve<0)return null;const hours=o.hours?Math.max(0,o.hours+reserve-free):0;if(hours&&(!rates.working||hours>(rates.availableWorkHours||0)))return null;const round=n=>Math.round(n*100)/100;return {hours,wages:round(hours*(rates.wageRate||0)),tips:round(hours*(rates.tipRate||0)),cost:Math.max(0,-(o.cash||0))};}
 function resolveWithLeave(s,month,index,free,reserve,rates){const r=s.studioEvents?.records[month],p=plan(s,r,index,free,reserve,rates);if(!p||!resolve(s,month,r.cardId,index,free+p.hours,reserve))return false;if(p.hours)r.leave={hours:p.hours,wages:p.wages,tips:p.tips,job:s.job};return true;}
 function leave(s){return Object.values(s.studioEvents?.records||{}).filter(r=>r.month===s.month&&r.status==='resolved'&&r.leave).reduce((a,r)=>({hours:a.hours+r.leave.hours,wages:a.wages+r.leave.wages,tips:a.tips+r.leave.tips}),{hours:0,wages:0,tips:0});}
 const api={cards,data,eligible,draw,missing,resolve,used,plan,resolveWithLeave,leave};root.StudioEvents=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
