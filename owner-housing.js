(() => {
 const basePrice = 145000;
 const term = 360;
 const downRate = .2;
 const basicInsurance = 85;

 function quote(priceMultiplier = 1) {
  const city = CITIES[state.city || 'orlando'];
  const price = Math.round(basePrice * priceMultiplier * (city.housing || 1) * (state.homeIndex || 100) / 100);
  const down = roundCash(price * downRate);
  const principal = roundCash(price - down);
  const economy = ECONOMIES[state.economy || 0];
  const inflation = state.annualInflation ?? .025;
  const apr = Math.round(Math.min(.12, Math.max(.035, economy.rate + .02 + (inflation - .025) * .5)) * 10000) / 10000;
  const payment = roundCash(paymentFor(principal, apr, term));
  const surplus = roundCash(calcMetrics().monthlyCF + (state.housingCost || 0) - payment - basicInsurance);
  return { price, down, principal, apr, payment, term, surplus, starts: state.month + 1 };
 }

 function monthLabel(month) {
  return '第 ' + (Math.floor(month / 12) + 1) + ' 年第 ' + (month % 12 + 1) + ' 月';
 }
 const aprLabel = apr => (apr * 100).toFixed(2) + '%';

 function purchase(offered) {
  const current = quote();
  const eligible = state.housing && state.housing !== 'unselected' &&
   state.housing !== 'own' && !state.pendingHomePurchase && !state.pendingHousingMove &&
   !state.homeEquity && !state.homeMortgage && !state.requiredIncident;
  if (!eligible || state.cash < current.down || current.surplus < 0) return show();
  if (JSON.stringify(current) !== JSON.stringify(offered)) return show();
  const saved = housingTransaction(() => {
   if (!spendConfirmed('ownerHomeDownpayment', current.down, { price: current.price })) return false;
   state.pendingHomePurchase = current;
   return true;
  });
  if (saved) show();
 }

 function show() {
  if (state.requiredIncident) return openRequiredIncident();
  syncFinance();
  if (state.pendingOwnerSale) return showSale();
  const pending = state.pendingHomePurchase;
  const back = ['返回生活', openLifeOverview, false];
  if (pending) {
   return showEvent('自住房','已预约入住','本月继续使用当前住房。入住时退回原住处押金，并开始计算房贷月供。',[
    ['入住月份',monthLabel(pending.starts)],['房价',priceText(pending.price)],
    ['首付已付',priceText(pending.down)],['固定年利率',aprLabel(pending.apr)],
    ['月供',priceText(pending.payment)]
   ],[back]);
  }
  if (state.housing === 'own' || state.ownerMortgage || state.homeEquity || state.homeMortgage) {
   return showEvent('自住房','我的自住房',state.ownerMortgage ? '本月房贷可在生活账单里支付。' : '本月住房费用可在生活账单里支付。',[
    ['房屋净值',priceText(state.homeEquity || 0)],['剩余房贷',priceText(state.homeMortgage || 0)],
    ['本月房贷',priceText(state.housingCost || 0)],
    ...(state.ownerMortgage ? [['固定年利率',aprLabel(state.ownerMortgage.apr)]] : [])
   ],[...(state.housing === 'own' ? [['查看房险',window.HomeInsurance.openPolicy,true],
    ...(saleValue()>0 && !state.pendingHousingMove ? [['出售或换购',chooseDestination,false]] : [])] : []),back]);
  }
  const q = quote();
  const needsHousing = !state.housing || state.housing === 'unselected';
  const message = state.pendingHousingMove ? '请先处理已有的住房预约。' :
   needsHousing ? '请先安排本月住处。签约后，下个月搬入自住房。' :
   state.cash < q.down ? '现金还差 '+priceText(q.down-state.cash)+'。签约付首付，下个月搬入。' :
   q.surplus < 0 ? '按当前收入及支出估算，每月预算暂时无法承担房贷。' :
   '签约付首付，下个月搬入并开始支付房贷。试算结余已计入基础房险。';
  showEvent('自住房','入门自住房',message,[
   ['房价',priceText(q.price)],['首付（20%）',priceText(q.down)],
   ['签约后现金',priceText(state.cash-q.down)],['贷款金额',priceText(q.principal)],
   ['30 年固定年利率',aprLabel(q.apr)],['每月房贷',priceText(q.payment)],
   ['入住后预计月结余',priceText(q.surplus)],['入住月份',monthLabel(q.starts)]
  ],[
   ['确认购房',()=>purchase(q),true,needsHousing||!!state.pendingHousingMove||state.cash<q.down||q.surplus<0],
   back
  ]);
 }

 function saleValue() {
  return roundCash((state.homeEquity || 0) + (state.homeMortgage || 0));
 }

 function saleDue() {
  return !!state?.pendingOwnerSale && state.pendingOwnerSale.starts <= state.month;
 }

 function chooseDestination() {
  if (state.requiredIncident) return openRequiredIncident();
  if (state.housing !== 'own' || saleValue() <= 0) return show();
  showEvent('自住房','出售或换购自住房','选择卖房之后的住处。预约当月继续住在现有房屋。',[],[
   ['换购改善型自住房',()=>showSale({key:'own',name:'改善型自住房',...quote(1.25)}),true],
   ...housingOptions().map(([name,monthly,,key])=>[
    '搬到'+name,()=>showSale({key,name,monthly,deposit:key==='family'?0:monthly}),false
   ]),
   ['返回自住房',show,false]
  ]);
 }

 function estimateBalance() {
  const balance = state.homeMortgage || 0;
  if (!balance) return 0;
  const loan = state.ownerMortgage || {apr:ECONOMIES[state.economy||0].rate,payment:state.housingCost,monthsLeft:360};
  return settleLoan({...loan},balance).balance;
 }

 function saleCosts(plan, closing) {
  const fee = roundCash(plan.price * .05);
  const payoff = closing ? state.homeMortgage || 0 : estimateBalance();
  const nextCost = plan.destination.key==='own' ? plan.destination.down :
   roundCash(plan.destination.monthly + plan.destination.deposit);
  const saleNet = roundCash(plan.price-fee-payoff);
  return {fee,payoff,nextCost,saleNet,cashAfter:roundCash(state.cash+saleNet-nextCost)};
 }

 function showSale(destination) {
  if (state.requiredIncident) return openRequiredIncident();
  const saved = state.pendingOwnerSale;
  const plan = saved || {price:saleValue(),starts:state.month+1,destination};
  const closing = saleDue(), costs = saleCosts(plan,closing);
  const buying = plan.destination.key==='own';
  const rows = [
   ['成交月份',monthLabel(plan.starts)],['出售价格',priceText(plan.price)],
   ['交易费用（5%）',priceText(costs.fee)],['清偿原房贷'+(closing?'':'（预计）'),priceText(costs.payoff)],
   ['卖房净到账',priceText(costs.saleNet)],['搬入',plan.destination.name],
   [buying?'新房首付':'首月住房费与押金',priceText(costs.nextCost)],
   ...(buying?[['新房价格',priceText(plan.destination.price)],['新房固定年利率',aprLabel(plan.destination.apr)],
    ['新房月供',priceText(plan.destination.payment)],['新房预计月结余',priceText(plan.destination.surplus)]]:[]),
   ['交接后现金'+(closing?'':'（预计）'),priceText(costs.cashAfter)]
  ];
  const message = closing
   ? '确认时同时清偿旧房贷、终止旧房险并入住新住处。'
   : '预约锁定报价，当月继续按原住房账单付款。下月确认交接时结算。';
  showEvent('自住房',closing?'办理自住房交接':saved?'已预约出售自住房':'确认出售方案',message,rows,[
   ...(!saved?[['预约次月交接',()=>{
    if(state.housing!=='own'||state.pendingOwnerSale||state.pendingHousingMove||state.requiredIncident||
       plan.starts!==state.month+1||plan.price!==saleValue()||saleCosts(plan,false).cashAfter<0||
       buying&&plan.destination.surplus<0)return show();
    if(housingTransaction(()=>{state.pendingOwnerSale=plan;return true}))showSale();
   },true,costs.cashAfter<0||(buying&&plan.destination.surplus<0)]]:[]),
   ...(closing?[['确认交接',closeSale,true,costs.cashAfter<0]]:[]),
   ...(closing&&costs.cashAfter<0?[['筹措交接资金',()=>showFundingOptions(roundCash(costs.nextCost-costs.saleNet),showSale),false]]:[]),
   ...(saved?[['取消出售预约',()=>{
    if(housingTransaction(()=>{if(state.pendingOwnerSale!==plan)return false;delete state.pendingOwnerSale;return true}))show();
   },false]]:[]),
   [saved?'返回房屋':'返回出售选项',saved?window.openRoom:chooseDestination,false]
  ]);
 }

 function closeSale() {
  const plan=state.pendingOwnerSale;
  if (!saleDue() || state.housing!=='own' || state.requiredIncident) return show();
  const costs=saleCosts(plan,true), destination=plan.destination;
  if (costs.cashAfter<0) return showSale();
  const ok=housingTransaction(()=>{
   state.cash=roundCash(state.cash+costs.saleNet);
   (state.financeLedger??=[]).push({kind:'ownerHomeSale',month:state.month,amount:costs.saleNet,
    price:plan.price,fee:costs.fee,payoff:costs.payoff});
   delete state.pendingOwnerSale;
   delete state.homeInsurance;
   delete state.housingLease;
   delete state.ownerMortgage;
   state.homeMortgage=0;
   state.homeEquity=0;
   if (destination.key==='own') {
    if(!spendConfirmed('ownerHomeDownpayment',destination.down,{price:destination.price}))return false;
    state.pendingHomePurchase={...destination,starts:state.month};
    activate(state);
   } else {
    if(!spendConfirmed('housingDeposit',destination.deposit,{housing:destination.key}) ||
       !payMonthly('housing',destination.monthly))return false;
    state.housing=destination.key;
    state.housingCost=destination.monthly;
    state.housingLease={key:destination.key,monthly:destination.monthly,depositHeld:destination.deposit,
     startMonth:state.month,renewalMonth:state.month+12};
   }
   state._computedExpenses=null;
   syncFinance();
   return true;
  });
  if(ok)openLifeOverview();
 }

 function activate(s) {
  const pending = s.pendingHomePurchase;
  if (!pending || pending.starts > s.month) return;
  const refund = heldHousingDeposit();
  if (refund) {
   s.cash = roundCash(s.cash + refund);
   (s.financeLedger ??= []).push({kind:'housingDepositRefund',month:pending.starts-1,amount:refund});
  }
  s.housing = 'own';
  s.homeEquity = pending.down;
  s.homeMortgage = pending.principal;
  s.ownerMortgage = { apr: pending.apr, payment: pending.payment, monthsLeft: pending.term };
  delete s.housingLease;
  delete s.pendingHomePurchase;
 }
 function monthlyDue(s) {
  const loan = s.ownerMortgage, balance = s.homeMortgage || 0;
  if (!balance) return 0;
  const payoff = roundCash(balance * (1 + loan.apr / 12));
  return loan.monthsLeft <= 1 ? payoff : Math.min(loan.payment, payoff);
 }

 const beforeSync = syncFinance;
 syncFinance = function () {
  if (state) {
   activate(state);
   if (state.ownerMortgage && state.housing === 'own') state.housingCost = monthlyDue(state);
  }
  return beforeSync.apply(this, arguments);
 };
 const beforeMetrics = calcMetrics;
 calcMetrics = function () {
  const metrics = beforeMetrics.apply(this, arguments);
  const paid = state?.pendingHomePurchase?.down || 0;
  return { ...metrics, assetValue: metrics.assetValue + paid, nw: metrics.nw + paid };
 };
 const beforeHousing = confirmHousing;
 confirmHousing = function (key) {
  if (state.pendingOwnerSale || state.pendingHomePurchase || state.housing === 'own' && saleValue()>0 && key !== 'own') {
   show();
   return false;
  }
  return beforeHousing.apply(this, arguments);
 };

 function propertyOverview() {
  syncFinance();
  const rows = [];
  if (state.housing === 'own' || state.homeMortgage || state.homeEquity) {
   rows.push(['自住房净值',priceText(state.homeEquity || 0)],['自住房贷款余额',priceText(state.homeMortgage || 0)]);
  }
  if (state.pendingHomePurchase) rows.push(['待入住自住房首付',priceText(state.pendingHomePurchase.down)]);
  for (const asset of state.assets.filter(a=>a.kind==='rental')) {
   rows.push(['投资房 · '+batchEscape(asset.name), '净值 '+priceText(asset.equity)+' · 租金 '+priceText(asset.rent)+'/月 · 净现金流 '+priceText(asset.cf)+'/月']);
  }
  showEvent('房产持仓','房产持仓',rows.length?'房产净值已计入资产总览。':'目前没有房产。',rows,[['返回资产总览',finish,true]]);
 }
 const beforeRender = render;
 render = function () {
  const result = beforeRender.apply(this, arguments);
  if (!state) return result;
  const assets = $('assets');
  if (!assets.querySelector('[data-owner-property]')) {
   const button = document.createElement('button');
   button.dataset.ownerProperty = '';
   button.textContent = '查看房产持仓';
   button.onclick = propertyOverview;
   assets.append(button);
  }
  return result;
 };
 const beforeBills = necessaryBills;
 necessaryBills = function () {
  if (saleDue()) return [{kind:'ownerSale',name:'办理自住房交接',due:0,action:showSale}];
  return beforeBills.apply(this,arguments);
 };
 const beforeSettlement=settleMonth;
 settleMonth=function(){
  if(state?.gameOver?.final || state?.requiredIncident || !saleDue())return beforeSettlement.apply(this,arguments);
  return showSale();
 };
 const beforeRoll=rollTown;
 rollTown=function(){
  if(saleDue()&&!state.requiredIncident&&!state.gameOver?.final)return showSale();
  return beforeRoll.apply(this,arguments);
 };
 window.OwnerHousing = { show, quote, saleDue };
})();
