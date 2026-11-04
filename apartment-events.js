// Confirmed small-apartment cards; party followup reserves its hour before purchase.
(function(root){
 const cards=[
 {
  "id": "flowers",
  "title": "新居的第一束花",
  "desc": "朋友来做客，带来一束花：“送你的，祝你在这里住得开心。”你捧着花看看房间，开始琢磨摆在哪里最合适。",
  "art": "assets/apartment/flowers-20261104.webp",
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
    "label": "摆在客厅，让进门就有好心情",
    "cash": 0,
    "hours": 0,
    "happiness": 4,
    "energy": 0,
    "stress": -2,
    "health": 0
   },
   {
    "label": "放在卧室，给自己留一点温柔",
    "cash": 0,
    "hours": 0,
    "happiness": 3,
    "energy": 0,
    "stress": -3,
    "health": 0
   }
  ]
 },
 {
  "id": "pajamas",
  "title": "今晚，睡衣派对",
  "desc": "朋友们提议来你家办一场睡衣派对。换上舒服的睡衣，在客厅铺好软垫，摆上零食，今晚就一起看电影、玩小游戏，聊些平时来不及说的话。",
  "art": "assets/apartment/pajamas-20261104.webp",
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
    "label": "准备零食和软垫，今晚一起尽兴",
    "cash": -50,
    "hours": 4,
    "happiness": 7,
    "energy": -2,
    "stress": -5,
    "health": 0
   },
   {
    "label": "简单准备，和朋友们轻松聚聚",
    "cash": -20,
    "hours": 2,
    "happiness": 4,
    "energy": -1,
    "stress": -3,
    "health": 0
   }
  ]
 },
 {
  "id": "display",
  "title": "一格一欢喜",
  "desc": "喜欢的娃娃和拼好的乐高，终于有机会好好摆出来了。你看着客厅空着的一面墙，想给这些小收藏安排一个属于它们的位置。",
  "art": "assets/apartment/display-20261104.webp",
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
    "label": "买个展示柜，把心爱的收藏摆好",
    "cash": -150,
    "hours": 2,
    "happiness": 6,
    "energy": -2,
    "stress": 0,
    "health": 0
   },
   {
    "label": "动手改造旧书架，腾出收藏展示区",
    "cash": 0,
    "hours": 4,
    "happiness": 5,
    "energy": -2,
    "stress": 0,
    "health": 0
   }
  ]
 },
 {
  "id": "bricks",
  "title": "积木里的小世界",
  "desc": "拼到一半的乐高还摆在客厅桌上，不用为了睡觉收起来。看着模型渐渐成形，你有些期待它完成后的样子。",
  "art": "assets/apartment/bricks-20261104.webp",
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
    "label": "放点音乐，今晚一口气拼好",
    "cash": 0,
    "hours": 3,
    "happiness": 5,
    "energy": 0,
    "stress": -3,
    "health": 0
   },
   {
    "label": "再拼一小段，慢慢享受过程",
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
  "id": "exercise",
  "title": "客厅动一动",
  "desc": "把茶几挪开一点，客厅刚好够铺开瑜伽垫。打开收藏的运动视频，今天就在家活动一下，让久坐的身体舒展开来。",
  "art": "assets/apartment/exercise-20261104.webp",
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
    "label": "跟着视频，完整练一组",
    "cash": 0,
    "hours": 2,
    "happiness": 3,
    "energy": -2,
    "stress": -3,
    "health": 1
   },
   {
    "label": "轻轻拉伸，舒展一下筋骨",
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
  "id": "lastbus",
  "title": "末班车之后",
  "desc": "朋友错过了末班车，发来消息：“今晚能在你家沙发借住一晚吗？”你看看客厅，铺好沙发就能睡，自己的卧室也能照常休息。",
  "art": "assets/apartment/lastbus-20261104.webp",
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
    "label": "让普通朋友来借住",
    "cash": 0,
    "hours": 1,
    "happiness": 0,
    "energy": -1,
    "stress": 0,
    "health": 0
   },
   {
    "label": "帮忙找附近的酒店",
    "cash": 0,
    "hours": 2,
    "happiness": 1,
    "energy": -2,
    "stress": 1,
    "health": 0
   }
  ]
 },
 {
  "id": "lighting",
  "title": "暖暖的",
  "desc": "晚上打开客厅顶灯，总觉得有些晃眼。你想调整一下照明，让看书、聊天和放松的时候，都有舒服的光陪着。",
  "art": "assets/apartment/lighting-20261104.webp",
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
    "label": "添一盏落地灯，让客厅柔和些",
    "cash": -50,
    "hours": 2,
    "happiness": 4,
    "energy": -1,
    "stress": -2,
    "health": 0
   },
   {
    "label": "调整现有灯的位置，试试新感觉",
    "cash": 0,
    "hours": 1,
    "happiness": 2,
    "energy": 0,
    "stress": -1,
    "health": 0
   }
  ]
 },
 {
  "id": "company",
  "title": "陪伴",
  "desc": "朋友带着书来你家，你也有些工作想处理。两个人一起待在客厅，一个安静看书，一个低头忙碌。偶尔抬起头，就能看见对方，什么也不说，也觉得心里暖暖的。",
  "art": "assets/apartment/company-20261104.webp",
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
    "label": "好盆友陪在身侧，心里暖暖的很幸福",
    "cash": 0,
    "hours": 0,
    "happiness": 4,
    "energy": 0,
    "stress": -3,
    "health": 0
   },
   {
    "label": "泡两杯茶，陪着彼此坐一会儿",
    "cash": 0,
    "hours": 1,
    "happiness": 5,
    "energy": 0,
    "stress": -4,
    "health": 0
   }
  ]
 },
 {
  "id": "clean",
  "title": "大扫除",
  "desc": "客厅积了灰，卧室也该整理了。住得宽松舒服，打扫时才发现，需要照顾的角落也多了一些。",
  "art": "assets/apartment/clean-20261104.webp",
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
    "label": "自己动手，把家打扫清爽",
    "cash": 0,
    "hours": 3,
    "happiness": 3,
    "energy": -3,
    "stress": 0,
    "health": 0
   },
   {
    "label": "请人做一次基础清洁",
    "cash": -100,
    "hours": 1,
    "happiness": 3,
    "energy": -1,
    "stress": 0,
    "health": 0
   }
  ]
 },
 {
  "id": "spill",
  "title": "这下得收拾了",
  "desc": "你不小心把饮料打翻在客厅地毯上。擦掉表面的水渍后，还是留下了一片污痕。得趁早处理，免得变得更难清理。",
  "art": "assets/apartment/spill-20261104.webp",
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
    "label": "买清洁用品，自己慢慢清理",
    "cash": -15,
    "hours": 2,
    "happiness": 0,
    "energy": -2,
    "stress": 0,
    "health": 0
   },
   {
    "label": "请专业清洁，省些力气",
    "cash": -100,
    "hours": 1,
    "happiness": 0,
    "energy": -1,
    "stress": 0,
    "health": 0
   }
  ]
 },
 {
  "id": "sing",
  "title": "我的家我的舞台",
  "desc": "听到一首喜欢的歌，你忍不住跟着哼起来。把客厅空出一点，拿起遥控器当麦克风，今晚也可以有一场属于自己的小演出。",
  "art": "assets/apartment/sing-20261104.webp",
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
    "label": "认真练歌",
    "cash": 0,
    "hours": 3,
    "happiness": 5,
    "energy": -1,
    "stress": -4,
    "health": 0
   },
   {
    "label": "随心哼唱，开心就好",
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
  "id": "party",
  "title": "热热闹闹小聚会",
  "desc": "朋友们来你家聚会，有人惦记热腾腾的火锅和烧烤，有人已经翻起了歌单。难得凑在一起，今晚就选一种喜欢的方式，好好热闹一下。",
  "art": "assets/apartment/party-20261104.webp",
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
    "label": "火锅配烧烤，今晚好好吃一顿",
    "cash": -100,
    "hours": 3,
    "happiness": 6,
    "energy": -2,
    "stress": -3,
    "health": 0
   },
   {
    "label": "兴致来了，开启KTV模式唱上几首",
    "cash": 0,
    "hours": 2,
    "happiness": 5,
    "energy": -1,
    "stress": -4,
    "health": 0
   }
  ]
 }
];
 function data(s){return s.apartmentEvents??={version:1,seen:{},records:{}};}
 function eligible(s){const seen=s.apartmentEvents?.seen||{},pool=cards.filter(c=>seen[c.id]==null||s.month-seen[c.id]>6),unseen=pool.filter(c=>seen[c.id]==null);return unseen.length?unseen:pool;}
 function draw(s,random=Math.random){const d=data(s);if(d.records[s.month])return d.records[s.month];const r=d.records[s.month]={pool:'apartment',month:s.month,status:'none',cardId:null};if(s.housing!=='rent1')return r;const pool=eligible(s);if(random()>=.5||!pool.length)return r;const c=pool[Math.min(pool.length-1,Math.floor(random()*pool.length))];r.cardId=c.id;r.status='pending';r.presented=false;d.seen[c.id]=s.month;return r;}
 function requiredHours(r,index){const o=cards.find(c=>c.id===r?.cardId)?.choices[index];return o?o.hours+(r.cardId==='party'&&index===1?1:0):0;}
 function missing(s,r,index,free,reserve=0){const o=cards.find(c=>c.id===r?.cardId)?.choices[index];if(!o||r.status!=='pending'||r.month!==s.month)return ['此选项已失效'];const a=[];if(s.cash+(o.cash||0)<0)a.push('现金不足');const need=requiredHours(r,index);if(free<need)a.push('自由时间不足');else if(need&&free-need<reserve)a.push('需保留必要宠物照护时间');return a;}
 function resolve(s,month,id,index,free,reserve=0){const r=s.apartmentEvents?.records[month];if(!r||r.cardId!==id||missing(s,r,index,free,reserve).length)return false;const o=cards.find(c=>c.id===id).choices[index];r.status='resolved';r.choice=index;r.hours=o.hours;r.effects={};for(const k of ['cash','health','energy','stress','happiness']){if(!o[k])continue;const before=s[k]||0;s[k]=k==='cash'?Math.round((before+o[k])*100)/100:Math.max(0,Math.min(100,before+o[k]));r.effects[k]=s[k]-before;}if(o.cash)(s.financeLedger??=[]).push({kind:o.cash>0?'apartmentIncome':'apartmentExpense',month,id,amount:Math.abs(o.cash)});if(id==='party'&&index===1)r.followup={status:'pending',reservedHours:1};return true;}
 function used(s){return Object.values(s.apartmentEvents?.records||{}).filter(r=>r.month===s.month&&r.status==='resolved').reduce((n,r)=>n+(r.hours||0)+(followupPending(r)?1:0),0);}
 function plan(s,r,index,free,reserve=0,rates={}){const o=cards.find(c=>c.id===r?.cardId)?.choices[index];if(!o||r.status!=='pending'||r.month!==s.month||!Number.isFinite(free)||free<0||!Number.isFinite(reserve)||reserve<0)return null;const need=requiredHours(r,index),hours=need?Math.max(0,need+reserve-free):0;if(hours&&(!rates.working||hours>(rates.availableWorkHours||0)))return null;const round=n=>Math.round(n*100)/100;return {hours,wages:round(hours*(rates.wageRate||0)),tips:round(hours*(rates.tipRate||0)),cost:Math.max(0,-(o.cash||0))};}
 function resolveWithLeave(s,month,index,free,reserve,rates){const r=s.apartmentEvents?.records[month],p=plan(s,r,index,free,reserve,rates);if(!p||!resolve(s,month,r.cardId,index,free+p.hours,reserve))return false;if(p.hours)r.leave={hours:p.hours,wages:p.wages,tips:p.tips,job:s.job};return true;}
 function leave(s){return Object.values(s.apartmentEvents?.records||{}).filter(r=>r.month===s.month&&r.status==='resolved'&&r.leave).reduce((a,r)=>({hours:a.hours+r.leave.hours,wages:a.wages+r.leave.wages,tips:a.tips+r.leave.tips}),{hours:0,wages:0,tips:0});}
 function followupPending(r){return r?.cardId==='party'&&r.status==='resolved'&&r.choice===1&&r.followup?.status==='pending';}
 function followupCard(r){return followupPending(r)?{id:'knock',title:'敲门声响了',desc:'大家正唱得起劲，门外突然传来敲门声。邻居皱着眉说：“声音有点大，已经影响我们休息了，麻烦小声一点。”你赶紧暂停音乐，向对方道歉。',art:'assets/apartment/knock-20261104.webp',hotspots:[[77,16]],choices:[{label:'道个歉，把音量降下来',hours:1,energy:-1,stress:2}]}:null;}
 function claimFollowup(s,month){const r=s.apartmentEvents?.records[month];if(month!==s.month||!followupPending(r))return false;const before={energy:s.energy,stress:s.stress};s.energy=Math.max(0,Math.min(100,s.energy-1));s.stress=Math.max(0,Math.min(100,s.stress+2));r.hours+=1;r.followup.status='resolved';r.followup.reservedHours=0;r.followup.effects={hours:1,energy:s.energy-before.energy,stress:s.stress-before.stress};return true;}
 const api={cards,data,eligible,draw,missing,resolve,used,plan,resolveWithLeave,leave,requiredHours,followupPending,followupCard,claimFollowup};root.ApartmentEvents=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
