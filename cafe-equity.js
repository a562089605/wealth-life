// Store cash, personal cash, and share transfers are tracked separately.
(function(root){
 'use strict';
 const R=root.CareerLearningRules,E=root.CareerEventRules;
 const baseValue=200000,controlShare=51,tiers=[10,20,30,40,controlShare],reserveTarget=50000,reserveFloor=25000;

 const money=n=>Math.round((n+Number.EPSILON)*100)/100;
 const employed=s=>!!s.job&&!s.retired&&!s.unemployedMonths;
 const accounts=s=>Object.values(s.cafeEquity?.stores||{});
 const current=s=>s.cafeEquity?.stores?.[E.storeKey(s)];
 const position=s=>accounts(s).filter(a=>a.shares||a.trade||a.handover);
 function managerMonths(s){
  if(Number.isFinite(s.careerStartedAt)&&s.careerStartedAt>=0&&s.careerStartedAt<=s.month)
   return s.month-s.careerStartedAt;
  return s.coffee?.progression?.managerMonths||0;
 }
 const eligible=s=>R.role(s.job)==='manager'&&employed(s)&&!s.pendingResignation&&managerMonths(s)>=1;
 function account(s,id){
  s.cafeEquity??={stores:{}};
  if(s.cafeEquity.stores[id])return s.cafeEquity.stores[id];
  const store=s.cafe?.store?.id===id?s.cafe.store:null;
  const legacy=store?s.cafe.holdings:null;
  const shares=Number.isFinite(legacy?.effectivePct)?money(legacy.effectivePct*100):0;
  const cash=Number.isFinite(store?.cash)?store.cash:reserveTarget;
  const reserve=Number.isFinite(store?.reserve)?Math.min(cash,store.reserve):Math.min(cash,reserveTarget);
  return s.cafeEquity.stores[id]={id,cash,reserve,loss:store?.lossCarry||0,shares,
   managing:shares>0&&R.role(s.job)==='partner',
   lots:(legacy?.lots||[]).filter(x=>Number.isFinite(x.pct)&&Number.isFinite(x.cost))
    .map(x=>({shares:money(x.pct*100),cost:x.cost,month:x.month})),
   months:{},trade:null,handover:null};
 }
 function valuation(a){
  const rows=Object.values(a?.months||{}).sort((x,y)=>y.month-x.month).slice(0,12);
  const base=rows.reduce((n,x)=>n+x.baseRevenue,0);
  return base>0?money(baseValue*rows.reduce((n,x)=>n+x.revenue,0)/base):baseValue;
 }
 const requiresManagement=s=>position(s).some(a=>a.shares>0&&a.shares<controlShare&&a.managing);
 const hasDelegatedControl=s=>position(s).some(a=>a.shares===controlShare&&!a.managing);
 const purchaseTargets=a=>tiers.filter(tier=>tier>(a?.shares||0)&&(!a?.shares||a.managing||tier===controlShare));
 function quote(s,id,target,mode){
  const a=s.cafeEquity?.stores?.[id],shares=a?.shares||0;
  if(a?.trade)return {ok:false,reason:'已有一笔股份交易等待交割。'};
  if(!(target===0&&shares>0)&&!(purchaseTargets(a).includes(target)))return {ok:false,reason:shares&&!a.managing?'目前不在店管理，只能增持至 51% 或卖出全部股份。':'请选择更高的持股档位，或卖出全部股份。'};
  const first=!shares,buy=target>shares;
  if(first&&(id!==E.storeKey(s)||!eligible(s)))return {ok:false,reason:'店长任职第二个月起可购买门店股权。'};
  if(first&&target<controlShare&&mode!=='manage')return {ok:false,reason:'持股低于 51% 时须自己管理门店。'};
  if(first&&!['manage','shareholder'].includes(mode))
   return {ok:false,reason:'请选择交割后的管理身份。'};
  if(!buy)mode=a.managing?'manager':undefined;
  if(!target&&a?.handover)return {ok:false,reason:'请先完成已安排的管理交接。'};
  const value=valuation(a);
  return {ok:true,id,from:shares,target,buy,mode,value,amount:money(value*Math.abs(target-shares)/100),month:s.month,
   effectiveMonth:s.month+1};
 }
 function ledger(s,kind,month,amount,id){
  (s.financeLedger??=[]).push({kind,month,amount,storeId:id});
 }
 function confirm(s,q,save){
  const live=quote(s,q.id,q.target,q.mode);
  if(!live.ok||JSON.stringify(q)!==JSON.stringify(live))return {ok:false,reason:live.reason||'报价已更新，请重新查看。'};
  if(live.buy&&s.cash<live.amount)return {ok:false,reason:'现金不足。'};
  return E.transaction(s,()=>{
   const a=account(s,q.id);
   if(q.buy){s.cash=money(s.cash-q.amount);ledger(s,'cafeEquityDeposit',s.month,q.amount,q.id);}
   a.trade=live;
   return {};
  },save);
 }
 function handover(s,id,save){
  const a=s.cafeEquity?.stores?.[id];
  if(!a?.shares||a.handover||a.trade?.target===0||s.retired||position(s).some(x=>x.id!==id&&(x.managing||x.handover?.managing)))return {ok:false,reason:'当前无法安排管理交接。'};
  if(a.shares<controlShare)return {ok:false,reason:'持股达到 51% 后才可切换管理方式。'};
  if(!a.managing&&s.job&&s.pendingResignation?.from!==s.job)
   return {ok:false,reason:'请先在我的职业安排现有工作的离职。'};
  return E.transaction(s,()=>{
   a.handover={managing:!a.managing,effectiveMonth:Math.max(s.month+1,s.pendingResignation?.effectiveCycle||0)};
   return {};
  },save);
 }
 function job(s,a,mode){
  if(mode==='leave'&&!(a.managing||R.role(s.job)==='manager'&&E.storeKey(s)===a.id))return;
  const role=mode==='manage'?'partner':mode==='manager'?'manager':null;
  if(role==='manager'&&s.coffee?.progression)s.coffee.progression.managerMonths=0;
  a.managing=role==='partner';
  if(role){s.job=R.roles[role].name;s.workHoursPerWeek=45;s.annualSalary=R.annual(s,role);s.salary=money(s.annualSalary/12);s.careerStartedAt=s.month;(s.coffee??={}).storeId=a.id;}
  else{s.job=null;s.salary=0;s.annualSalary=0;delete s.workHoursPerWeek;}
  s.unemployedMonths=0;
 }
 function closeBooks(s,settlement,storeId){
  const month=settlement.month-1,inflation=(s.cpiIndex||100)/100;
  // Local cafe demand responds less sharply than the broader market.
  const demand=Math.max(.85,Math.min(1.15,1+((s.marketIndex||100)/100-1)*.25));
  const targets=new Set(accounts(s).map(a=>a.id));
  if(storeId)targets.add(storeId);
  for(const id of targets){
   const a=account(s,id);
   if(a.months[month])continue;
   const {adjustment,retention}=E.partnerEffects(s,month,id);
   const sales=E.sales(s,month,id),revenue=money(sales.revenue*inflation*demand),materials=money(revenue*.30);
   const income=id===storeId?settlement.careerIncome:null;
   const management=income?money(income.baseWages+(income.fixedBonus||0)+(income.eventWages||0)+(income.eventBonus||0)):id===storeId?0:5333.33;
   const fixed=money((28000-5333.33)*inflation+management),profit=money(revenue-materials-fixed-sales.expenses+adjustment);
   const priorLoss=a.loss;
   a.loss=money(Math.max(0,priorLoss-profit));
   a.cash=money(Math.max(0,a.cash+profit));
   a.reserve=Math.min(a.reserve,a.cash);
   const available=money(Math.max(0,profit-priorLoss));
   const contribution=money(Math.min(Math.max(0,reserveTarget-a.reserve),available*(a.reserve<reserveFloor?1:.5),Math.max(0,a.cash-a.reserve)));
   const belowFloor=a.reserve<reserveFloor;
   a.reserve=money(a.reserve+contribution);
   const distributable=belowFloor?0:money(Math.max(0,Math.min(available-contribution,a.cash-a.reserve)));
   const retained=money(Math.min(distributable,retention)),pool=money(distributable-retained);
   a.reserve=money(a.reserve+retained);
   a.cash=money(a.cash-pool);
   const dividend=money(pool*a.shares/100);
   a.months[month]={month,baseRevenue:sales.baseRevenue,revenue,materials,fixed,expenses:sales.expenses,adjustment,retained,profit,pool,shares:a.shares,dividend,reserve:a.reserve,cash:a.cash,
    reason:pool?'':belowFloor||contribution||retained?'门店补充营运储备':'本月无可分配利润'};
   if(dividend){s.cash=money(s.cash+dividend);ledger(s,'cafeDividend',month,dividend,id);settlement.cafeDividend=money((settlement.cafeDividend||0)+dividend);}
  }
 }
 function deliver(s){
  for(const a of accounts(s)){
   const t=a.trade;
   if(t&&t.effectiveMonth<=s.month){
    if(t.buy&&t.from===0&&(R.role(s.job)!=='manager'||E.storeKey(s)!==a.id||s.retired||s.unemployedMonths)){
     s.cash=money(s.cash+t.amount);ledger(s,'cafeEquityRefund',s.month-1,t.amount,a.id);
    }else{
     if(t.buy)a.lots.push({shares:t.target-t.from,cost:t.amount,month:s.month});
     else {
      let sold=t.from-t.target;
      while(sold>0&&a.lots.length){
       const lot=a.lots[0],part=Math.min(sold,lot.shares);
       lot.cost=money(lot.cost*(lot.shares-part)/lot.shares);
       lot.shares-=part;sold-=part;
       if(!lot.shares)a.lots.shift();
      }
      s.cash=money(s.cash+t.amount);
      ledger(s,'cafeEquitySale',s.month-1,t.amount,a.id);
     }
     a.shares=t.target;
     if(!t.from)job(s,a,t.mode==='manage'?'manage':'leave');
     if(!t.target&&a.managing&&R.role(s.job)==='partner'&&!s.retired)job(s,a,t.mode==='leave'?'leave':'manager');
    }
    a.trade=null;
   }
   if(a.handover?.effectiveMonth<=s.month){
    if(a.shares&&(!a.handover.managing||(!s.job&&!s.retired)))job(s,a,a.handover.managing?'manage':'leave');
    a.handover=null;
   }
   if(a.managing&&(R.role(s.job)!=='partner'||s.retired))a.managing=false;
  }
 }
 function closeMonth(s,settlement){
  const role=R.role(s.job);
  const id=employed(s)&&(role==='manager'||role==='partner')?E.storeKey(s):null;
  closeBooks(s,settlement,id);
 }
 const assetValue=s=>money(accounts(s).reduce((n,a)=>n+valuation(a)*a.shares/100+(a.trade?.buy?a.trade.amount:0),0));
 const api={controlShare,tiers,purchaseTargets,requiresManagement,hasDelegatedControl,eligible,current,position,valuation,quote,confirm,handover,closeMonth,deliver,assetValue};
 root.CafeEquity=api;
 if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
