// Confirmed family housing events, 2026-11-02. Pure state rules; no save migration resets.
(function(root){
 const choice=(label,hours=0,effects={})=>({label,hours,...effects});
 const cards=[
  {id:'lamplight',title:'灯下话家常',desc:'回到家，家人问起你最近过得怎么样。你可以坐下来聊聊，也可以告诉他们，今天想先自己休息。',choices:[choice('坐下来，和家人聊聊',1,{happiness:4,stress:-3}),choice('今天有些累，想自己待一会儿')]},
  {id:'dinner',title:'家庭聚餐',desc:'家人提议周末一起外出聚餐。你可以请大家吃一顿，聊聊最近的生活，也可以告诉他们，这周很累，想要休息。',choices:[choice('一起去聚餐',3,{cash:-200,happiness:6,stress:-4}),choice('这周很累，想要休息')]},
  {id:'memories',title:'旧物里的时光',desc:'回到家，家人正在收拾储物间。翻看旧物时，你们聊起了过去的小故事。要不要一起整理，让家里更清爽一些？',choices:[choice('帮家人一起整理',4,{energy:-3,happiness:4}),choice('今天有些累，想先休息')]},
  {id:'love',title:'爱子心无尽',desc:'家人递给你一个小红包：“在外面工作辛苦了，给自己买点喜欢的，别总舍不得。”简简单单的一句话，藏着满满的牵挂。',choices:[choice('收下红包，谢谢家人的支持',0,{cash:100,happiness:4}),choice('心意收下，钱留给家人，告诉他们自己最近过得不错',0,{happiness:4,stress:-3})]},
  {id:'disagreement',title:'家庭小摩擦',desc:'因为作息和家务安排，你和家人有了一点分歧，语气也渐渐急了起来。你想坐下来把话说开，还是先给彼此一点空间？',choices:[choice('坐下来，慢慢把话说开',2,{happiness:2,stress:-3}),choice('先各自冷静，整理自己的心情',1,{happiness:1})]},
  {id:'fridge',title:'家里的旧冰箱',desc:'家里的冰箱用了很多年，最近终于停止了工作。家人商量着换一台新的，你可以出钱添置，也可以先让家人安排。',choices:[choice('这次我来，给家里换台新冰箱',0,{cash:-650,happiness:5}),choice('最近手头有些紧，先让家人安排')]},
  {id:'care',title:'殷殷盼早康',desc:'家里有人生病了，需要休息两天。你可以亲自准备饭菜、陪伴照顾，也可以请人帮忙，让家人得到照料。',choices:[choice('这两天，让我照顾你',12,{energy:-6,stress:4}),choice('请人帮忙，好好照顾家人',2,{cash:-300,stress:2})]},
  {id:'blessing',title:'新岁有福',desc:'过年了，家人笑着把红包递到你手里：“新的一年，平平安安，顺顺利利！”你也向家人送上了新年祝福。',choices:[choice('收下红包，给家人拜年',0,{cash:500,happiness:5})]},
  {id:'movie',title:'家庭电影夜',desc:'家人挑好了一部老电影，招呼你一起看。灯光调暗，大家窝进沙发，给今晚留一点轻松的时间。',choices:[choice('一起看，今晚就放松一下',3,{happiness:5,stress:-4}),choice('今晚不想看电影')]},
  {id:'portrait',title:'拍一张全家福',desc:'翻看旧相册时，才发现上次一家人合照已经是很久以前。家人提议：“找个时间，再一起拍张全家福吧。”',choices:[choice('去照相馆，认真拍一张',3,{cash:-350,happiness:6}),choice('在家用手机，留下这一刻',2,{happiness:3})]},
  {id:'teacher',title:'小老师',desc:'家人想和远方的亲友视频聊天，却找不到通话按钮，拿着手机问你：“这个怎么弄呀？”',choices:[choice('耐心教一教，让家人自己试试',2,{happiness:4,energy:-1}),choice('帮忙拨通，陪着聊一会儿',1,{happiness:2})]},
  {id:'flowers',title:'一起逛花市',desc:'家人听说附近的花市开得正热闹，邀你一起去走走。挑几盆喜欢的花草，也给家里添一点新颜色。',choices:[choice('一起逛，挑些花草带回家',3,{cash:-60,happiness:5,stress:-3}),choice('陪家人逛逛，看看花也开心',3,{happiness:3,stress:-2})]}
 ];
 function data(s){return s.familyEvents??={version:1,seen:{},records:{}};}
 function eligible(s){const seen=s.familyEvents?.seen||{};const available=cards.filter(c=>seen[c.id]==null||s.month-seen[c.id]>6);const unseen=available.filter(c=>seen[c.id]==null);return unseen.length?unseen:available;}
 function draw(s,random=Math.random){
  const d=data(s);if(d.records[s.month])return d.records[s.month];
  const r={month:s.month,status:'none',cardId:null};d.records[s.month]=r;
  if(s.housing!=='family')return r;
  const pool=eligible(s);if(random()>=.5||!pool.length)return r;
  const c=pool[Math.min(pool.length-1,Math.floor(random()*pool.length))];
  r.cardId=c.id;r.status='pending';r.presented=false;d.seen[c.id]=s.month;return r;
 }
 function missing(s,r,index,free,reserve=0){const c=cards.find(c=>c.id===r?.cardId),o=c?.choices[index];if(!o||r.status!=='pending'||r.month!==s.month)return ['此选项已失效'];const a=[];if(s.cash+(o.cash||0)<0)a.push('现金不足');if(free<o.hours)a.push('自由时间不足');else if(o.hours&&free-o.hours<reserve)a.push('需保留必要宠物照护时间');return a;}
 function resolve(s,month,id,index,free,reserve=0){const r=s.familyEvents?.records[month];if(!r||r.cardId!==id||missing(s,r,index,free,reserve).length)return false;
  const o=cards.find(c=>c.id===id).choices[index];r.status='resolved';r.choice=index;r.hours=o.hours;r.effects={};
  for(const k of ['cash','energy','stress','happiness']){if(!o[k])continue;const before=s[k]||0;s[k]=k==='cash'?Math.round((before+o[k])*100)/100:Math.max(0,Math.min(100,before+o[k]));r.effects[k]=s[k]-before;}
  if(o.cash)(s.financeLedger??=[]).push({kind:o.cash>0?'familyIncome':'familyExpense',month,id,amount:Math.abs(o.cash)});
  return true;
 }
 function used(s){return Object.values(s.familyEvents?.records||{}).filter(r=>r.month===s.month&&r.status==='resolved').reduce((n,r)=>n+(r.hours||0),0);}
 // Only the compulsory care card can exchange missing free hours for unpaid leave.
 // Rates come from the existing career quote, not new family-card pay rules.
 function carePlan(s,r,index,free,reserve=0,rates={}){
  const o=cards.find(c=>c.id===r?.cardId)?.choices[index];
  if(r?.cardId!=='care'||r.status!=='pending'||r.month!==s.month||!o)return null;
  if(!Number.isFinite(free)||free<0||!Number.isFinite(reserve)||reserve<0)return null;
  const hours=Math.max(0,o.hours+reserve-free);
  if(hours&&(!rates.working||hours>(rates.availableWorkHours||0)))return null;
  const round=n=>Math.round(n*100)/100;
  return {hours,wages:round(hours*(rates.wageRate||0)),tips:round(hours*(rates.tipRate||0)),cost:Math.max(0,-(o.cash||0))};
 }
 function resolveCare(s,month,index,free,reserve,rates){
  const r=s.familyEvents?.records[month],p=carePlan(s,r,index,free,reserve,rates);
  if(!p||!resolve(s,month,'care',index,free+p.hours,reserve))return false;
  if(p.hours)r.leave={hours:p.hours,wages:p.wages,tips:p.tips,job:s.job};
  return true;
 }
 function leave(s){return Object.values(s.familyEvents?.records||{}).filter(r=>r.month===s.month&&r.status==='resolved'&&r.leave).reduce((a,r)=>({hours:a.hours+r.leave.hours,wages:a.wages+r.leave.wages,tips:a.tips+r.leave.tips}),{hours:0,wages:0,tips:0});}
 const api={cards,data,eligible,draw,missing,resolve,used,carePlan,resolveCare,leave};root.FamilyEvents=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);

