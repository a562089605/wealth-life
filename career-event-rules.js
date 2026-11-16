// Prospective career-event ledger. No legacy company cash, profits, equity or dividends are fabricated.
(function(root){'use strict';const D=root.CareerEventData,H=root.HobbyLearning,copy=x=>JSON.parse(JSON.stringify(x)),money=n=>Math.round((Number(n)||0)*100)/100;
 const role=s=>root.CareerLearningRules.role(s.job),working=s=>!!role(s)&&!s.retired&&!s.unemployedMonths;
 function data(s){return s.careerEvents??={version:1,sequence:0,groups:{},stores:{},settlements:{}};}
 function storeKey(s){return String(s.coffee?.storeId||s.cafe?.store?.id||s.employerId||('coffee-employer:'+ (s.relationshipHome?.currentManagerId||s.relationshipHome?.managers?.coffee||'legacy')));}
 function store(s,key=storeKey(s)){const d=data(s);return d.stores[key]??={id:key,startedMonth:s.month,modifiers:{},completed:{},cooldowns:{},expenses:[],months:{}};}
 function quote(s,raw={},context){const e=copy(raw),q=context||{annualSalary:s.annualSalary||s.salary*12,weeklyHours:s.workHoursPerWeek||40,calendarMonth:s.month%12+1},tips=q.calendarMonth===9?225:q.calendarMonth>=11?450:300;
  if(e.paidHours){e.wages=money(q.annualSalary/(52*q.weeklyHours)*e.paidHours*(e.paidHours>0?1.5:1));const h=e.paidHours,m=q.weeklyHours===40&&role(s)==='shiftLead'?1.3:1;e.tips=e.tipFormula==='barista-staff'?money(tips/23*1.5*m):e.tipFormula==='barista-busy'?money(50*tips/300*m):e.tipFormula==='barista-departure'?money(tips/23*5*m):e.tipFormula==='cut'?money(tips/23*h/8*m):e.tipFormula==='shift'?money(tips/23*1.3):0;}
  delete e.paidHours;delete e.tipFormula;if(e.storeRefund){e.storeCost=money(s.coffee?.lastDrinkPrice??5);delete e.storeRefund;}return e;
 }
 function apply(s,e,record,phase){const actual=copy(e);s.coffee??={};s.coffee.skills??={};
  for(const k of ['energy','stress','happiness'])if(e[k]){const old=s[k]??50;s[k]=Math.max(0,Math.min(100,old+e[k]));actual[k]=money(s[k]-old);}
  for(const k of ['service','management','coffee'])if(e[k]){const item=s.coffee.skills[k]??={xp:0},old=item.xp||0;item.xp=Math.max(0,Math.min(400,old+e[k]));actual[k]=item.xp-old;}
  if(e.trust){const old=s.coffee.managerTrust||0;s.coffee.managerTrust=Math.max(0,old+e.trust);actual.trust=s.coffee.managerTrust-old;}
  for(const k of ['latte','pourOver'])if(e[k]){const old=H.xp(s,k),gain=Math.max(0,Math.min(e[k],800-old));if(gain){const d=s.hobbyLearning??={version:1,xp:{},receipts:[],sequence:0};d.xp??={};d.xp[k]=old+gain;}actual[k]=gain;}
  if(e.storeCost){const st=store(s,record.storeId),id=record.id+':'+phase;if(!st.expenses.some(x=>x.id===id))st.expenses.push({id,month:s.month,event:record.cardId||record.eventId,amount:e.storeCost});}
  if(e.sales){const st=store(s,record.storeId),family=record.cardId==='manager-decline'?'decline':'research';if(!st.modifiers[family])st.modifiers[family]={rate:e.sales,fromMonth:s.month,receipt:record.id};st.completed[family]=record.id;}
  return actual;
 }
 function guard(s,e,{free=0,reserve=0,recovery=false,forced=false}={}){if(!working(s))return '当前岗位已变化';if(recovery||s.health<30)return '请先处理健康与疗养';if(!forced&&e.hours>0&&free-reserve<e.hours)return '自由时间不足，需保留必要照护';if(!forced&&e.energy<0&&s.energy < -e.energy)return '能量不足';return '';}
 function transaction(s,fn,save){return root.CareerLearningRules.atomic(s,fn,save);}
 function pending(s){return Object.values(s.careerEvents?.groups||{}).find(g=>g.month===s.month&&g.status!=='resolved'&&g.storeId===storeKey(s));}
 function reserve(s,cardId,{save,random=Math.random}={}){if(role(s)!=='manager'||!working(s)||!D.cards[cardId]||!cardId.startsWith('manager-')||D.cards[cardId].effects)return {ok:false,reason:'岗位或事件不适用'};const current=pending(s);if(current)return {ok:true,record:current};
  const st=s.careerEvents?.stores?.[storeKey(s)],family=cardId==='manager-decline'?'decline':cardId==='manager-research'?'research':cardId;if(st?.completed[family]||st?.cooldowns[cardId]===s.month)return {ok:false,reason:'本事件已完成'};
  const context={annualSalary:s.annualSalary||s.salary*12,weeklyHours:45,calendarMonth:s.month%12+1},roll=random();if(!(roll>=0&&roll<1))return {ok:false,reason:'无效随机结果'};
  return transaction(s,()=>{const d=data(s),r={id:'career-manager-'+(++d.sequence),month:s.month,job:s.job,storeId:storeKey(s),cardId,status:'pending',roll,quoteContext:context,options:D.cards[cardId].options.map(o=>({...copy(o),effects:quote(s,o.effects,context)})),receipts:[]};store(s,r.storeId);d.groups[r.id]=r;return {record:r};},save);
 }
 const managementLevel=s=>Math.max(1,root.CareerLearningRules.skillLevel(s,'management'));
 function follow(s,r,opt){const kind=opt.follow,skill=kind==='research-a'?H.level(H.xp(s,'tasting')):managementLevel(s),rate=(40+skill*10)/100,success=r.roll<rate,cardId='manager-'+kind+'-'+(success?'success':'failure');return {kind,level:skill,probability:rate,success,cardId,status:'pending',effects:quote(s,D.cards[cardId].effects,r.quoteContext)};}
 function choose(s,id,index,opts){const r=s.careerEvents?.groups?.[id],o=r?.options[index];if(!r||r.month!==s.month||r.job!==s.job||r.storeId!==storeKey(s)||r.status!=='pending'||!o)return {ok:false,reason:'事件已变化或完成'};const miss=guard(s,o.effects,opts);if(miss)return {ok:false,reason:miss};
  return transaction(s,()=>{const lockedFollow=o.follow?follow(s,r,o):null;const e=apply(s,o.effects,r,'main');r.receipts.push({phase:'main',effects:e});r.choice=index;if(lockedFollow){r.follow=lockedFollow;r.status='followup';}else r.status='resolved';store(s,r.storeId).cooldowns[r.cardId]=s.month;return {record:r};},opts.save);
 }
 function settleFollow(s,id,opts){const r=s.careerEvents?.groups?.[id];if(!r||r.month!==s.month||r.job!==s.job||r.storeId!==storeKey(s)||r.status!=='followup'||r.follow?.status!=='pending')return {ok:false,reason:'后续已变化或完成'};const miss=guard(s,r.follow.effects,opts);if(miss)return {ok:false,reason:miss};return transaction(s,()=>{const e=apply(s,r.follow.effects,r,'follow');r.receipts.push({phase:'follow',effects:e});r.follow.status='resolved';r.status='resolved';return {record:r};},opts.save);}
 function earned(s,month=s.month){const rows=Object.values(s.careerEvents?.groups||{}).filter(g=>g.month===month&&g.storeId===storeKey(s));return rows.flatMap(r=>r.receipts).reduce((x,r)=>{for(const k of ['wages','tips','bonus','hours'])x[k]=money(x[k]+(r.effects[k]||0));return x;},{wages:0,tips:0,bonus:0,hours:0});}
 function sales(s,month=s.month,key=storeKey(s)){const st=s.careerEvents?.stores?.[key],season=(month%12)+1,base=season===9?42500:season>=11?60000:50000,rate=Object.values(st?.modifiers||{}).filter(m=>m.fromMonth<=month).reduce((n,m)=>n+m.rate,0);return {month,storeId:key,baseRevenue:base,modifierRate:money(rate),revenue:money(base*(1+rate)),expenses:(st?.expenses||[]).filter(e=>e.month===month).reduce((n,e)=>money(n+e.amount),0)};}
 function book(s,month){if(!s.careerEvents)return;const d=data(s),key=storeKey(s),st=d.stores[key];if(!st||st.months[month])return;st.months[month]=sales(s,month,key);d.settlements[month]={storeId:key,earnings:earned(s,month)};}
 const api={data,storeKey,store,quote,apply,guard,transaction,pending,reserve,choose,settleFollow,earned,sales,book};root.CareerEventRules=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
