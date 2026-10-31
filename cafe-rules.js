// Confirmed single-store rules. Missing contracts and event parameters remain explicit blockers.
(function(root){
'use strict';
const money=n=>Math.round((n+Number.EPSILON)*100)/100;
const ROLES={manager:{base:58000,hours:45,free:80,tips:1.5,bonus:500,xp:{coffee:5,service:15,management:15}},partner:{base:60000,hours:45,free:80,tips:0,bonus:0,xp:{coffee:5,service:10,management:15}}};
function role(s){return ['店长','店长 Store Manager','Store Manager'].includes(s.job)?'manager':['在店管理合伙人','管理合伙人','Managing Partner'].includes(s.job)?'partner':null}
function data(s){s.cafe??={version:1,work:{},groups:{},completedCards:{},eventHours:{},payroll:{},xpMonths:{},holdings:{effectivePct:s.month===0?0:null,status:s.month===0?'known':'history-required',lots:[],earnedUnpaid:[]}};return s.cafe}
function ensureStore(s){const c=data(s);if(c.store)return c.store;
 c.store=s.month===0?{version:1,id:'first-cafe',status:'ready',cash:50000,reserve:50000,lossCarry:0,history:[],months:{},invoices:{},permanentSales:1,temporarySales:{}}:{version:1,id:'first-cafe',status:'history-required',reason:'旧档缺少可核对的门店历史；不重置现金、补造历史分红或季度权益'};return c.store}
function workQuote(s,{absentHours=0,missedTipWeight=0}={},seasonTips){const r=role(s),cfg=ROLES[r];if(!cfg)return {blocked:'当前不是在店管理劳动身份'};
 const annual=Number(s.annualSalary)||Number(s.salary)*12,normalHours=45*52/12;
 if(!(annual>0)||!Number.isFinite(absentHours)||absentHours<0||absentHours>normalHours)return {blocked:'缺席小时或有效合同工资不适用'};
 if(!Number.isFinite(missedTipWeight)||missedTipWeight<0||missedTipWeight>23||absentHours===0&&missedTipWeight!==0||r==='manager'&&absentHours>0&&missedTipWeight===0)return {blocked:'须核对实际缺席班次小费份额'};
 const factor=(normalHours-absentHours)/normalHours;
 return {role:r,job:s.job,annualSalary:annual,weeklyHours:45,normalHours,absentHours,missedTipWeight,factor,baseWages:money(annual/52/45*(normalHours-absentHours)),baseTips:money(seasonTips*cfg.tips*(1-missedTipWeight/23)),fixedBonus:absentHours===0?cfg.bonus:0,energy:money(-28*factor),stress:money(12*factor),free:cfg.free+absentHours};}
function confirmWork(s,q){if(q.blocked||q.job!==s.job)return false;const c=data(s),old=c.work[s.month];if(old&&old.annualSalary!==q.annualSalary)return false;
 const previous=old||{energy:0,stress:0,applied:{energy:0,stress:0}},applied={...(previous.applied||{energy:previous.energy,stress:previous.stress})};for(const k of ['energy','stress']){let delta=q[k]-previous[k];if(k==='energy'&&delta>0)delta=Math.min(delta,Math.max(0,-applied.energy));if(k==='stress'&&delta<0)delta=-Math.min(-delta,Math.max(0,applied.stress));const before=s[k];s[k]=Math.max(0,Math.min(100,before+delta));applied[k]=money(applied[k]+s[k]-before)}c.work[s.month]={...q,month:s.month,applied};return true;}
function payroll(s,seasonTips){const c=data(s),q=c.work[s.month];if(!role(s)||s.retired||s.unemployedMonths||!q)return null;const extra=c.payroll[s.month]||{wages:0,bonus:0};
 return {...q,cycle:s.month,role:q.role,extraWages:money(extra.wages+extra.bonus),eventWages:extra.wages,eventBonus:extra.bonus,total:money(q.baseWages+q.baseTips+q.fixedBonus+extra.wages+extra.bonus),recurring:money(q.baseWages+q.baseTips+q.fixedBonus)};}
const CARDS={departure:{name:'员工突然离职',weight:25},equipment:{name:'设备故障',weight:20},decline:{name:'经营业绩下滑',weight:20},research:{name:'研发新品',weight:20},excellent:{name:'门店经营表现优秀',weight:15,blocked:'优秀卡最终奖励与按钮尚未确认'}};
function choices(s,id){const st=ensureStore(s);const ordinary=st.status==='ready';
 if(id==='departure')return [{label:'亲自招聘、交接',hours:4,energy:-2,stress:2,management:15,trust:1,paidHours:4},{label:'安排主管协助',stress:1,management:8},{label:'请求上级支援',stress:-2,trust:-1}];
 if(id==='equipment')return [{label:'亲自协调抢修与现场安排',energy:-2,stress:2,management:15,trust:1,storeCost:500,blocked:ordinary?null:st.reason},{label:'交由主管执行，你负责审核',stress:1,management:8,storeCost:500,blocked:ordinary?null:st.reason},{label:'暂停受影响的出品，等待维修',stress:-1,management:3,service:-3,storeCost:500,blocked:ordinary?null:st.reason}];
 if(id==='decline')return [{label:'方案A：原选项与耗时待核对',blocked:'主卡完整原文、最终数值及工时未确认'},{label:'方案B：原选项与耗时待核对',blocked:'主卡完整原文、最终数值及工时未确认'},{label:'维持现有安排，继续观察',trust:-1}];
 if(id==='research'){const cost=st.researchCost,known=ordinary&&cost?.confirmed===true&&Number.isFinite(cost.amount)&&cost.amount>=0;
 return [{label:'亲自研发',energy:-2,stress:2,coffee:15,management:10,follow:'research',skill:'coffee',storeCost:known?cost.amount:undefined,blocked:known?null:'门店研发成本缺少确认金额'},{label:'组织团队研发',energy:-1,stress:1,management:10,coffee:5,follow:'research',skill:'management',storeCost:known?cost.amount:undefined,blocked:known?null:'门店研发成本缺少确认金额'}];}
 return [];
}
function eligible(s,id,free){const c=data(s),st=ensureStore(s);return role(s)==='manager'&&!s.retired&&!s.unemployedMonths&&!CARDS[id].blocked&&!(id==='research'&&st.researchSucceeded)&&c.completedCards[s.month+':'+id]!==true&&choices(s,id).some(x=>!x.blocked&&(x.hours||0)<=free)}
function draw(s,free,random=Math.random){const c=data(s),pending=Object.values(c.groups).find(g=>g.month===s.month&&g.status!=='resolved');if(pending)return pending;
 const pool=Object.keys(CARDS).filter(id=>eligible(s,id,free));if(!pool.length)return null;
 // Daily manager pool is explicitly unavailable, so use the only eligible subpool.
 let n=random()*pool.reduce((a,id)=>a+CARDS[id].weight,0),id=pool.at(-1);for(const k of pool){n-=CARDS[k].weight;if(n<0){id=k;break}}
 const index=Object.keys(c.groups).length+1,g={id:'manager-'+s.month+'-'+index,month:s.month,storeId:ensureStore(s).id,eventId:id,status:'pending',receipts:[],quote:{annualSalary:Number(s.annualSalary)||s.salary*12,weeklyHours:45,job:s.job},choices:choices(s,id)};c.groups[g.id]=g;return g;
}
function apply(s,g,phase,e){if(g.receipts.some(x=>x.phase===phase))return false;const c=data(s),actual={};
 for(const k of ['energy','stress','happiness'])if(e[k]){const before=s[k];s[k]=Math.max(0,Math.min(100,before+e[k]));if(s[k]!==before)actual[k]=money(s[k]-before)}
 s.coffee??={};s.coffee.skills??={};for(const k of ['coffee','service','management'])if(e[k]){const a=s.coffee.skills[k]??={xp:0},before=a.xp;a.xp=Math.max(0,Math.min(400,before+e[k]));if(a.xp!==before)actual[k]=a.xp-before}
 if(e.trust){const before=s.coffee.managerTrust||0;s.coffee.managerTrust=Math.max(0,Math.min(20,before+e.trust));if(s.coffee.managerTrust!==before)actual.trust=s.coffee.managerTrust-before}
 if(e.hours){c.eventHours[s.month]=(c.eventHours[s.month]||0)+e.hours;actual.hours=e.hours}
 const pay=c.payroll[s.month]??={wages:0,bonus:0};if(e.wages){pay.wages=money(pay.wages+e.wages);actual.wages=e.wages}if(e.bonus){pay.bonus=money(pay.bonus+e.bonus);actual.bonus=e.bonus}
 if(e.storeCost!=null){const st=ensureStore(s);if(st.status!=='ready')throw Error('Missing store history');const key=g.id+':'+phase;st.invoices[key]??={month:s.month,amount:e.storeCost,kind:g.eventId};if(e.storeCost)actual.storeCost=e.storeCost}
 if(e.sales){const st=ensureStore(s);if(e.permanent){if(!st.researchSucceeded){st.permanentSales=1.05;st.researchSucceeded=true;actual.sales=e.sales}}else{st.temporarySales[s.month]=e.sales;actual.sales=e.sales}}
 g.receipts.push({phase,effects:actual});return true;
}
function lockFollow(g,kind,index,level,random=Math.random){if(g.follow)return g.follow;const probability=(40+level*10)/100,success=random()<probability;g.follow={kind,index,level,probability,success,settled:false};return g.follow}
function followEffects(g){const f=g.follow;if(!f)return null;
 if(f.kind==='decline')return f.index===0?f.success?{management:10,happiness:2,stress:-4,sales:.05}:{management:5,stress:1}:f.success?{management:5,happiness:1,stress:-2,sales:.03}:{management:3,stress:1};
 if(f.kind==='research')return f.index===0?f.success?{coffee:10,trust:1,happiness:2,stress:-3,sales:.05,permanent:true,bonus:g.quote.role==='partner'?0:150}:{coffee:5,stress:1}:f.success?{management:5,happiness:1,stress:-2,sales:.05,permanent:true,bonus:g.quote.role==='partner'?0:75}:{management:3,stress:1};
 throw Error('Unconfirmed follow-up');}
function choose(s,groupId,index,free,random=Math.random){const c=data(s),g=c.groups[groupId],e=g?.choices[index];if(!g||g.month!==s.month||g.status!=='pending'||g.quote.job!==s.job||!e||e.blocked||(e.hours||0)>free)return false;
 if(e.storeCost!=null&&ensureStore(s).status!=='ready'||g.eventId==='research'&&ensureStore(s).researchSucceeded)return false;const copy={...e};if(e.paidHours)copy.wages=money(g.quote.annualSalary/52/45*1.5*e.paidHours);
 g.choice=index;g.quote.role=role(s);g.skillSnapshot=Object.fromEntries(['coffee','service','management'].map(k=>[k,s.coffee?.skills?.[k]?.xp||0]));
 if(e.follow){const level=Math.min(5,1+Math.floor(g.skillSnapshot[e.skill]/100));lockFollow(g,e.follow,index,level,random)}
 apply(s,g,'main',copy);if(g.follow)g.status='followup';else{g.status='resolved';c.completedCards[s.month+':'+g.eventId]=true}return true;
}
function finishFollow(s,id){const c=data(s),g=c.groups[id];if(!g?.follow||g.month!==s.month||g.follow.settled)return false;apply(s,g,'follow',followEffects(g));g.follow.settled=true;g.status='resolved';c.completedCards[s.month+':'+g.eventId]=true;return true;}
function operatingQuote(st,{season,normalPay=58000/12+500,extraPay=0,month,interest}={}){if(st.status!=='ready')return {blocked:st.reason||'门店历史待核对'};if(!['low','normal','peak'].includes(season))return {blocked:'沿用原季节日历，不能猜季节'};
 if(st.permanentSales!==1&&(st.temporarySales[month]||0)!==0)return {blocked:'新品永久效果与临时营收效果叠加顺序未确认'};
 if(st.debt&&!Number.isFinite(interest))return {blocked:'真实利息未核对'};
 const base={low:42500,normal:50000,peak:60000}[season],sales=base*st.permanentSales*(1+(st.temporarySales[month]||0)),materials=sales*.3,fixed=28000+(normalPay-(58000/12+500));
 const expenses=Object.values(st.invoices).filter(x=>x.month===month).reduce((a,x)=>a+x.amount,0),actualInterest=interest??0,profit=sales-materials-fixed-expenses-extraPay-actualInterest;
 if(st.cash+profit<0)return {blocked:'门店现金不足；须按已有补救规则处理，不自动个人垫款',profit:money(profit)};
 return {month,sales:money(sales),materials:money(materials),fixed:money(fixed),events:money(expenses),extraPay:money(extraPay),interest:money(actualInterest),profit:money(profit),rawProfit:profit};
}
function settleStore(st,q,pct){if(q.blocked)return q;if(st.months[q.month])return {...st.months[q.month],duplicate:true};if(!Number.isFinite(pct)||pct<0||pct>1)throw Error('Invalid effective holding');
 let cash=st.cash+q.rawProfit,reserve=Math.min(st.reserve,cash),loss=st.lossCarry,available=0,retained=0,dividend=0;
 if(q.rawProfit<0)loss+=-q.rawProfit;else{const offset=Math.min(loss,q.rawProfit);loss-=offset;available=q.rawProfit-offset;
 if(reserve<25000){retained=Math.min(50000-reserve,available)}else{retained=Math.min(Math.max(0,50000-reserve),available*.5);dividend=Math.min(available-retained,Math.max(0,cash-reserve-retained))}reserve+=retained;cash-=dividend;}
 const record={...q,lossCarry:money(loss),reserve:money(reserve),cash:money(cash),companyDividend:money(dividend),effectivePct:pct,playerDividend:money(dividend*pct),retained:money(retained)};
 st.cash=record.cash;st.reserve=record.reserve;st.lossCarry=record.lossCarry;st.months[q.month]=record;st.history.push(record);return record;
}
// Transaction primitives require explicit access confirmation from a recovered qualification rule.
function quoteTrade(s,{targetPct,valuation=200000,accessConfirmed=false}={}){const c=data(s),h=c.holdings;if(!accessConfirmed)return {blocked:'买卖资格/离店替代管理安排尚未核对'};if(h.pending)return {blocked:'已有待交割交易'};if(!Number.isFinite(targetPct)||targetPct<0||targetPct>1||!Number.isFinite(valuation)||valuation<=0)return {blocked:'无效股比/报价'};if(!Number.isFinite(h.effectivePct))return {blocked:'旧持股历史待核对'};const delta=targetPct-h.effectivePct;return {month:s.month,from:h.effectivePct,targetPct,valuation,delta,amount:money(Math.abs(delta)*valuation),effectiveMonth:s.month+1};}
function confirmTrade(s,q){const h=data(s).holdings;if(q.blocked||h.pending||q.month!==s.month||q.from!==h.effectivePct||q.delta===0||q.delta>0&&s.cash<q.amount)return false;if(q.delta>0)s.cash=money(s.cash-q.amount);h.pending={...q,status:'escrowed'};(s.financeLedger??=[]).push({kind:q.delta>0?'cafeShareEscrow':'cafeShareSaleConfirmed',month:s.month,amount:q.delta>0?q.amount:0});return true;}
function applyTrade(s){const c=data(s),h=c.holdings,t=h.pending;if(!t||t.effectiveMonth>s.month)return false;const st=ensureStore(s);if(st.status==='liquidated'){if(t.delta>0)s.cash=money(s.cash+t.amount);t.status='refunded'}else{if(t.delta<0)s.cash=money(s.cash+t.amount);h.effectivePct=t.targetPct;if(t.delta>0)h.lots.push({pct:t.delta,cost:t.amount,month:s.month});t.status='settled'};(h.trades??=[]).push(t);delete h.pending;return true;}
const api={money,ROLES,CARDS,role,data,ensureStore,workQuote,confirmWork,payroll,choices,eligible,draw,apply,lockFollow,followEffects,choose,finishFollow,operatingQuote,settleStore,quoteTrade,confirmTrade,applyTrade};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CafeRules=api;
})(typeof globalThis!=='undefined'?globalThis:this);
