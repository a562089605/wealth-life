// Prospective career-event ledger. No legacy company cash, profits, equity or dividends are fabricated.
(function(root){'use strict';const D=root.CareerEventData,H=root.HobbyLearning,copy=x=>JSON.parse(JSON.stringify(x)),money=n=>Math.round((Number(n)||0)*100)/100;
 const role=s=>root.CareerLearningRules.role(s.job),working=s=>!!role(s)&&!s.retired&&!s.unemployedMonths;
 const runsStore=s=>!!s&&working(s)&&(role(s)==='manager'||role(s)==='partner'&&!!root.CafeEquity?.current(s)?.managing);
 function data(s){return s.careerEvents??={version:1,sequence:0,groups:{},stores:{},settlements:{}};}
 function storeKey(s){return String(s.coffee?.storeId||s.cafe?.store?.id||s.employerId||('coffee-employer:'+ (s.relationshipHome?.currentManagerId||s.relationshipHome?.managers?.coffee||'legacy')));}
 function store(s,key=storeKey(s)){const d=data(s);return d.stores[key]??={id:key,startedMonth:s.month,modifiers:{},completed:{},cooldowns:{},expenses:[],months:{}};}
 function quote(s,raw={},context){const e=copy(raw),q=context||{annualSalary:s.annualSalary||s.salary*12,weeklyHours:s.workHoursPerWeek||40,calendarMonth:s.month%12+1},tips=q.calendarMonth===9?225:q.calendarMonth>=11?450:300;
  if(e.paidHours){
   const h=e.paidHours,m=role(s)==='shiftLead'?1.3:1;
   const rates=root.CareerLearningRules.shiftRates(q.annualSalary,q.weeklyHours,tips*m);
   const shiftTips=rates.tip*8;
   e.wages=money(rates.wage*h*(h>0?1.5:1));
   e.tips=e.tipFormula==='barista-staff'?money(shiftTips*1.5):e.tipFormula==='barista-busy'?money(50*tips/300*m):e.tipFormula==='barista-departure'?money(shiftTips*5):e.tipFormula==='cut'?money(rates.tip*h):e.tipFormula==='shift'?money(shiftTips):0;
  }
  delete e.paidHours;delete e.tipFormula;if(e.storeRefund){e.storeCost=money(s.coffee?.lastDrinkPrice??5);delete e.storeRefund;}return e;
 }
 function apply(s,e,record,phase){const actual=copy(e);s.coffee??={};s.coffee.skills??={};
  for(const k of ['energy','stress','happiness'])if(e[k]){const old=s[k]??50;s[k]=Math.max(0,Math.min(100,old+e[k]));actual[k]=money(s[k]-old);}
  for(const k of ['service','management','coffee'])if(e[k]){const item=s.coffee.skills[k]??={xp:0},old=item.xp||0;item.xp=Math.max(0,Math.min(400,old+e[k]));actual[k]=item.xp-old;}
  if(e.trust){const old=s.coffee.managerTrust||0;const clamp=root.CareerLearningRules.trust,before=clamp(old);s.coffee.managerTrust=clamp(before+e.trust);actual.trust=s.coffee.managerTrust-before;}
  for(const k of ['latte','pourOver'])if(e[k]){const old=H.xp(s,k),gain=Math.max(0,Math.min(e[k],800-old));if(gain){const d=s.hobbyLearning??={version:1,xp:{},receipts:[],sequence:0};d.xp??={};d.xp[k]=old+gain;}actual[k]=gain;}
  if(e.storeCost){const st=store(s,record.storeId),id=record.id+':'+phase;if(!st.expenses.some(x=>x.id===id))st.expenses.push({id,month:s.month,event:record.cardId||record.eventId,amount:e.storeCost});}
  if(e.sales){const st=store(s,record.storeId),family=record.cardId==='manager-decline'?'decline':'research';if(!st.modifiers[family])st.modifiers[family]={rate:e.sales,fromMonth:s.month,receipt:record.id};st.completed[family]=record.id;}
  return actual;
 }
 function guard(s,e,{free=0,reserve=0,recovery=false,forced=false}={}){if(!working(s))return '当前岗位已变化';if(recovery||s.health<30)return '请先处理健康与疗养';if(!forced&&e.hours>0&&free-reserve<e.hours)return '自由时间不足，需保留必要照护';if(!forced&&e.energy<0&&s.energy < -e.energy)return '能量不足';return '';}
 function transaction(s,fn,save){return root.CareerLearningRules.atomic(s,fn,save);}
 function pending(s){return Object.values(s.careerEvents?.groups||{}).find(g=>g.month===s.month&&g.status!=='resolved'&&g.storeId===storeKey(s));}
 const partnerCards=['reserve','machine','beans','order','bakery'].map(id=>'partner-'+id);
 const managerCards=['departure','equipment','decline','research','excellent'].map(id=>'manager-'+id);
 const machineCard='partner-machine';
 const machineUnavailable=(st,month)=>month<(st?.machine?.protectedUntil??0);
 function machineLoanDue(s){
  const machine=s.careerEvents?.stores?.[storeKey(s)]?.machine;
  return !!machine?.onLoan&&machine.dueMonth<=s.month;
 }
 function machineWeight(st,month){
  const machine=st?.machine;
  const repairedAt=machine?.repairedAt??(!machine?.onLoan&&Number.isInteger(machine?.dueMonth)?machine.dueMonth-3:null);
  if(repairedAt===null||month<=repairedAt)return 1;
  return month-repairedAt>=3?4:2;
 }
 function eventOptions(s,r){
  if(r.status!=='pending')return r.options;
  if(r.cardId===machineCard||r.cardId==='partner-reserve')return D.cards[r.cardId].options;
  if(r.cardId==='partner-bakery'||r.cardId==='partner-beans')return r.options.map((option,index)=>{
   const {label,description}=D.cards[r.cardId].options[index];
   return {...option,label,description};
  });
  if(r.cardId==='partner-order'&&r.options[0].effects.wages===undefined){
   const option=D.cards[r.cardId].options[0];
   return [{...option,effects:quote(s,option.effects,r.quoteContext)},...r.options.slice(1)];
  }
  return r.options;
 }
 function recordMachineChoice(s,r,e){
  const st=store(s,r.storeId);
  if(e.machineTemporaryRepair)st.machine={repairedAt:s.month};
  if(e.machineWarrantyMonths)st.machine={protectedUntil:s.month+e.machineWarrantyMonths};
 }
 function optionGuard(s,cardId,e,opts){
  const miss=guard(s,e,opts);
  if(miss||!cardId.startsWith('partner-'))return miss;
  const id=storeKey(s),account=root.CafeEquity?.current(s);
  const expenses=(s.careerEvents?.stores?.[id]?.expenses||[]).filter(x=>x.month===s.month).reduce((n,x)=>n+x.amount,0);
  const available=Math.max(0,(account?.cash||0)-expenses);
  // A required repair can be paid from this month's sales when the cash balance is short.
  const requiredRepair=cardId===machineCard&&e.machineTemporaryRepair;
  if(e.storeCost>available&&!requiredRepair)return '门店现金还差 '+money(e.storeCost-available).toFixed(2)+' 美元';
  if(e.duration&&Object.values(s.careerEvents?.groups||{}).some(r=>r.storeId===id&&r.cardId===cardId&&
   r.receipts.some(x=>x.effects.duration&&s.month<=r.month+x.effects.duration)))return '现有方案还在生效';
  return '';
 }
 function reserve(s,cardId,{save,random=Math.random}={}){if(!runsStore(s)||!working(s)||!(role(s)==='partner'?partnerCards:managerCards).includes(cardId)||cardId==='partner-reserve'&&s.month%12!==7)return {ok:false,reason:'岗位或事件不适用'};const current=pending(s);if(current)return {ok:true,record:current};
  const st=s.careerEvents?.stores?.[storeKey(s)];
  if(cardId===machineCard&&machineUnavailable(st,s.month))return {ok:false,reason:'咖啡机尚未到处理时间'};
  const family=cardId==='manager-decline'?'decline':cardId==='manager-research'?'research':cardId;if(st?.completed[family]||st?.cooldowns[cardId]===s.month)return {ok:false,reason:'本事件已完成'};
  const context={annualSalary:s.annualSalary||s.salary*12,weeklyHours:45,calendarMonth:s.month%12+1},roll=random();if(!(roll>=0&&roll<1))return {ok:false,reason:'无效随机结果'};
  return transaction(s,()=>{const d=data(s),r={id:'career-manager-'+(++d.sequence),month:s.month,job:s.job,storeId:storeKey(s),cardId,status:'pending',roll,quoteContext:context,options:D.cards[cardId].options.map(o=>({...copy(o),effects:quote(s,o.effects,context)})),receipts:[]};store(s,r.storeId);d.groups[r.id]=r;return {record:r};},save);
 }
 function drawManager(s,opts={}){
  const {save,random=Math.random}=opts;
  if(!runsStore(s)||guard(s,{},opts))return {ok:true};
  const current=pending(s);
  if(current)return {ok:true,record:current};
  if(role(s)==='partner'&&machineLoanDue(s))return reserve(s,machineCard,{save,random:()=>0});
  if(!D.managerNaturalDrawEnabled||s.pendingResignation)return {ok:true};
  const ledger=s.careerEvents;
  if(ledger?.managerDrawMonth===s.month||Object.values(ledger?.groups||{}).some(r=>r.month===s.month))
   return {ok:true};
  const st=ledger?.stores?.[storeKey(s)];
  const cards=role(s)==='partner'?partnerCards:managerCards;
  const candidates=cards.filter(id=>{
   const family=id.replace(/^manager-/,''),last=st?.cooldowns?.[id];
   return (id!==machineCard||!machineUnavailable(st,s.month))&&(id!=='partner-reserve'||s.month%12===7)&&!st?.completed?.[family]&&
    (last==null||s.month-last>=D.managerRepeatMonths||id===machineCard&&machineWeight(st,s.month)>1)&&D.cards[id].options.some(o=>!optionGuard(s,id,o.effects,opts));
  });
  const weighted=candidates.flatMap(id=>Array(id===machineCard?machineWeight(st,s.month):1).fill(id));
  return transaction(s,()=>{
   data(s).managerDrawMonth=s.month;
   if(!candidates.length||random()>=D.managerTriggerProbability)return {};
   const cardId=weighted[Math.floor(random()*weighted.length)];
   const result=reserve(s,cardId,{save:()=>true,random});
   return result.ok?{record:result.record}:false;
  },save);
 }
 const managementLevel=s=>Math.max(1,root.CareerLearningRules.skillLevel(s,'management'));
 function follow(s,r,opt){const kind=opt.follow,skill=kind==='research-a'?H.level(H.xp(s,'tasting')):managementLevel(s),rate=(40+skill*10)/100,success=r.roll<rate,cardId='manager-'+kind+'-'+(success?'success':'failure');return {kind,level:skill,probability:rate,success,cardId,status:'pending',effects:quote(s,D.cards[cardId].effects,r.quoteContext)};}
 function choose(s,id,index,opts){const r=s.careerEvents?.groups?.[id],o=r&&eventOptions(s,r)[index];if(!r||r.month!==s.month||r.job!==s.job||r.storeId!==storeKey(s)||r.status!=='pending'||!o)return {ok:false,reason:'事件已变化或完成'};const miss=optionGuard(s,r.cardId,o.effects,opts);if(miss)return {ok:false,reason:miss};
  return transaction(s,()=>{const lockedFollow=o.followCardId
   ? {cardId:o.followCardId,status:'pending',effects:quote(s,D.cards[o.followCardId].effects,r.quoteContext)}
   : o.follow?follow(s,r,o):null;const effects=copy(o.effects);if(effects.netRange){const [min,max]=effects.netRange;effects.storeNet=min+Math.floor(r.roll*(max-min+1));delete effects.netRange;}const e=apply(s,effects,r,'main');if(r.cardId===machineCard)recordMachineChoice(s,r,e);r.receipts.push({phase:'main',effects:e});r.choice=index;if(r.cardId==='partner-bakery'&&e.storeCost)r.bakeryResultPending=true;if(lockedFollow){r.follow=lockedFollow;r.status='followup';}else r.status='resolved';store(s,r.storeId).cooldowns[r.cardId]=s.month;return {record:r};},opts.save);
 }
 function bakeryResult(s){
  return Object.values(s.careerEvents?.groups||{}).find(r=>r.month===s.month&&r.bakeryResultPending);
 }
 function acknowledgeBakeryResult(s,id,save){
  const r=bakeryResult(s);
  if(r?.id!==id)return {ok:false,reason:'销售结果已确认'};
  return transaction(s,()=>{r.bakeryResultPending=false;return {};},save);
 }
 function settleFollow(s,id,opts){const r=s.careerEvents?.groups?.[id];if(!r||r.month!==s.month||r.job!==s.job||r.storeId!==storeKey(s)||r.status!=='followup'||r.follow?.status!=='pending')return {ok:false,reason:'后续已变化或完成'};const miss=guard(s,r.follow.effects,opts);if(miss)return {ok:false,reason:miss};return transaction(s,()=>{const e=apply(s,r.follow.effects,r,'follow');r.receipts.push({phase:'follow',effects:e});r.follow.status='resolved';r.status='resolved';return {record:r};},opts.save);}
 function earned(s,month=s.month){const rows=Object.values(s.careerEvents?.groups||{}).filter(g=>g.month===month&&g.storeId===storeKey(s));return rows.flatMap(r=>r.receipts).reduce((x,r)=>{for(const k of ['wages','tips','bonus','hours'])x[k]=money(x[k]+(r.effects[k]||0));return x;},{wages:0,tips:0,bonus:0,hours:0});}
 function sales(s,month=s.month,key=storeKey(s)){const st=s.careerEvents?.stores?.[key],season=(month%12)+1,base=season===9?42500:season>=11?60000:50000,rate=Object.values(st?.modifiers||{}).filter(m=>m.fromMonth<=month).reduce((n,m)=>n+m.rate,0);const loan=Object.values(s.careerEvents?.groups||{}).find(r=>r.storeId===key&&r.month===month&&r.cardId===machineCard)?.receipts.find(x=>x.effects.machineLoanRevenueRate);
  return {month,storeId:key,baseRevenue:base,modifierRate:money(rate),revenue:money(base*(1+rate)*(1-(loan?.effects.machineLoanRevenueRate||0))),expenses:(st?.expenses||[]).filter(e=>e.month===month).reduce((n,e)=>money(n+e.amount),0)};}
 function partnerEffects(s,month,id){
  let adjustment=0,retention=0,deferDividend=false;
  for(const r of Object.values(s.careerEvents?.groups||{})){
   if(r.storeId!==id||!r.cardId.startsWith('partner-'))continue;
   for(const {effects:e} of r.receipts){
    if(r.month===month){adjustment+=e.storeNet||0;retention+=e.retain||0;deferDividend||=!!e.deferDividend;}
    if(e.duration&&r.month<month&&month<=r.month+e.duration)adjustment+=e.monthlySaving||0;
   }
  }
  return {adjustment,retention,deferDividend};
 }
 function book(s,month){if(!s.careerEvents)return;const d=data(s),key=storeKey(s),st=d.stores[key];if(!st||st.months[month])return;st.months[month]=sales(s,month,key);d.settlements[month]={storeId:key,earnings:earned(s,month)};}
 const api={runsStore,data,storeKey,store,quote,apply,guard,transaction,pending,reserve,drawManager,machineLoanDue,eventOptions,optionGuard,partnerEffects,bakeryResult,acknowledgeBakeryResult,choose,settleFollow,earned,sales,book};root.CareerEventRules=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
