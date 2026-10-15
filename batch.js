// Local V27.8 batch: explicit choices and a single auditable cash/debt/investment state.
const batchEscape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function loanTargets(){return [...(state.loans||[]).filter(l=>l.balance>0).map(l=>({key:l.id,name:loanDebtName(l),l,balance:l.balance,set:n=>l.balance=n})),...Object.entries(state.debtSchedules||{}).filter(([k])=>state.debt[k]>0).map(([k,l])=>({key:'legacy:'+k,name:k,l,balance:state.debt[k],set:n=>{state.debt[k]=n}}))]}
function currentLoanCycle(){
 if(state.loanCycle?.month!==state.month)state.loanCycle={month:state.month,items:[]};
 const cycle=state.loanCycle;
 for(const t of loanTargets())if(!cycle.items.some(x=>x.key===t.key)){
 const interest=roundCash(t.balance*t.l.apr/12),due=roundCash(t.l.monthsLeft===1?t.balance+interest:Math.min(t.l.payment,t.balance+interest));
 cycle.items.push({key:t.key,name:t.name,openingBalance:t.balance,apr:t.l.apr,due,interest,principal:roundCash(Math.max(0,due-interest)),status:'unpaid'});
 }
 for(const row of cycle.items){
  if(row.status==='paid')continue;
  const t=loanTargets().find(t=>t.key===row.key);
  if(!t){row.status='paid';row.due=0;row.principal=0;row.interest=0;continue}
  if(t.balance<row.openingBalance){row.openingBalance=t.balance;row.interest=roundCash(t.balance*row.apr/12);row.due=roundCash(Math.min(t.l.payment,t.balance+row.interest));row.principal=roundCash(Math.max(0,row.due-row.interest));}
 }
 return cycle;
}

function loanBudgetTotal(){return roundCash(currentLoanCycle().items.reduce((n,x)=>n+x.due,0))}
function paidLoanTotal(){return roundCash((state.loanCycle?.month===state.month?state.loanCycle.items:[]).filter(x=>x.status==='paid').reduce((n,x)=>n+x.due,0))}
function payLoanInstallment(key){
 const row=currentLoanCycle().items.find(x=>x.key===key),t=loanTargets().find(x=>x.key===key);
 if(!row||!t||row.status==='paid'||state.cash<row.due)return;
 if(!spendConfirmed('loanInstallment',row.due,{loan:row.name,principal:row.principal,interest:row.interest}))return;
 t.set(Math.max(0,roundCash(t.balance-row.principal)));t.l.monthsLeft=Math.max(0,t.l.monthsLeft-1);row.status='paid';save();openLoanPayments();
}
function openLoanPayments(){syncFinance();const rows=currentLoanCycle().items;
 showEvent('本月还款','我的贷款','本月需明确确认还款。支付月供同时偿还本金与当月利息；主动还 $1,000 是额外还本金，不能代替本月月供。未付月供不会偷偷扣现金：月末把当月利息及逾期费用加入本金，未缩短期限。逾期费用采用游戏规则：新贷款采用未付月供5%（最高$35，随物价调整）；旧贷款保留原合同。',[],[['OK · 完成还款查看',finish,true]]);
 $('eventData').innerHTML=rows.length?rows.map(x=>'<div class="wl-panel"><h3>'+batchEscape(x.name)+'</h3><p>本月月供 '+priceText(x.due)+' · 本金 '+priceText(x.principal)+' · 利息 '+priceText(x.interest)+'<br>固定 APR '+(x.apr*100).toFixed(2)+'% · '+(x.status==='paid'?'本月已付':'尚未支付')+'</p><button data-batch="payLoan" data-key="'+batchEscape(x.key)+'" '+(x.status==='paid'||state.cash<x.due?'disabled':'')+'>'+(x.status==='paid'?'已还款，不再扣费':'确认支付 '+priceText(x.due))+'</button>'+(x.status!=='paid'&&state.cash<x.due?'<small>现金不足，还差 '+priceText(x.due-state.cash)+'</small>':'')+'</div>').join(''):'<p>目前没有需要还款的个人/教育/车辆贷款。投资房月供已在净租金里扣除，不再另扣。</p>';
 $('eventData').style.display='block';
}
function settleMonthlyDebts(settlement){
 const rows=currentLoanCycle().items;settlement.loanPayments=rows.map(x=>({...x}));
 for(const row of rows){if(row.status==='paid')continue;
 const t=loanTargets().find(t=>t.key===row.key);if(!t)continue;
 // Scheduled unpaid payments were in the budget; restore them because cash wasn't paid.
 state.cash=roundCash(state.cash+row.due);settlement.netCF=roundCash(settlement.netCF+row.due);
 const penalty=latePaymentCharge(row,t.l),capitalized=roundCash(row.interest+penalty);
 t.set(roundCash(t.balance+capitalized));t.l.overdueMonths=(t.l.overdueMonths||0)+1;
 settlement.loanPayments.find(x=>x.key===row.key).status='overdue';
 settlement.loanPayments.find(x=>x.key===row.key).penalty=penalty;
 settlement.loanPayments.find(x=>x.key===row.key).capitalized=capitalized;
 state.financeLedger??=[];state.financeLedger.push({month:state.month,kind:'loanOverdue',loan:row.name,amount:0,capitalized,penalty});
 }
}
// Career cards combine requirements and action; browsing never resigns.
function openCareerMarket(){syncFinance();showEvent('职业市场','工作机会','每张卡同时显示薪资与资格。只查看不会辞职；申请成功才替换当前工作，申请失败仍保留原岗位。',[],[['返回',finish,true]]);
 $('eventData').innerHTML='<div class="wl-careers">'+CAREERS.map((c,i)=>({c,i})).sort((a,b)=>careerMissing(a.c).length-careerMissing(b.c).length||a.i-b.i).map(({c,i})=>{const missing=careerMissing(c);return '<div class="wl-panel"><h3>'+batchEscape(c.name)+'</h3><b>'+priceText(careerSalary(c))+'/年</b><p>'+batchEscape(EDU[c.edu].name)+' · 相关经验 '+c.minExp+' 年<br>'+batchEscape(missing.length?'尚缺：'+missing.join('；'):'资格符合，可申请')+'</p><button data-batch="applyCareer" data-i="'+i+'" '+(missing.length?'disabled':'')+'>确认申请 '+batchEscape(c.name)+'</button></div>'}).join('')+'</div>';$('eventData').style.display='block';
}
function applyCareer(i){const c=CAREERS[i];if(!c||careerMissing(c).length)return;
 if(Math.random()>=careerSuccessChance(c)){showEvent('CAREER','这次没有录取','原工作保持不变。可以返回查看其他职位。',[],[['返回职业市场',openCareerMarket,true],['继续本月',finish,false]]);return}
 state.job=c.name;state.annualSalary=careerSalary(c);state.salary=roundCash(state.annualSalary/12);state.careerStartedAt=state.month;state.lastPromotionMonth=state.month;state.unemployedMonths=0;save();showEvent('CAREER','求职成功','已确认入职，工资从本月月末计入。',[['职位',c.name],['年薪',priceText(state.annualSalary)]],[['继续',()=>completeMonthlyStep(2),true]]);
}
$('jobMarketBtn').onclick=openCareerMarket;
function openWorkAdjustment(){showEvent('职业预览','调整工作','查看其他工作不影响现职。只有在这里明确确认辞职，才会失去工资。',[['当前工作',state.job||'未就业'],['税前年薪',priceText(state.annualSalary||0)]],[['查看其他工作机会',openCareerMarket,true],['确认辞职',()=>{state.job=null;state.salary=0;state.annualSalary=0;state.unemployedMonths=0;save();finish()},false,!state.job],['返回，不修改',finish,false]])}
// Expanded saved monthly opportunity pool. Outcomes are resolved and shown before month end.
V26_OFFERS.push(
 {id:'tutor',name:'周末辅导项目',cost:80,reward:260,chance:.8,effects:{energy:-5,social:3},desc:'支付教材和交通费，学生是否报名存在不确定性。'},
 {id:'repair',name:'社区维修摊位',cost:200,reward:480,chance:.7,effects:{energy:-8},desc:'工具和材料投入，订单不足会亏损。'},
 {id:'craft',name:'手工小店',cost:450,cf:42,chance:.7,effects:{energy:-5,mood:3},desc:'小批量制作并尝试销售；订单稳定后净分配已扣耗材。'},
 {id:'market-research',name:'付费用户访谈',cost:20,reward:90,chance:.9,effects:{energy:-3,social:3},desc:'支付交通费，符合访谈条件才会得到报酬。'},
 {id:'garden',name:'社区园艺服务',cost:180,cf:28,chance:.8,effects:{health:2,energy:-6},desc:'购买工具争取固定客户，收入已扣耗材。'},
 {id:'resale',name:'二手商品整理',cost:300,reward:430,chance:.65,effects:{energy:-4},desc:'购买并整备二手商品，可能积压卖不出去。'},
 {id:'design',name:'小店海报接单',cost:75,reward:210,chance:.75,effects:{energy:-5,mood:2},desc:'支付素材授权和打样费，客户验收后才能获得收入。'},
 {id:'sound',name:'活动音响出租',cost:1600,cf:100,chance:.7,effects:{stress:3},desc:'设备和推广成本，净月收入已扣维护和空置。'}
);
function opportunityChance(o){const hobby=({photo:'摄影',rental:'摄影',editing:'电影创作',garden:'园艺',stall:'烹饪',tutor:'语言学习'})[o.id];return o.chance===1?1:Math.max(.05,Math.min(.95,o.chance+(hobby?Math.min(.15,hobbyLevel(hobby)*.02):0)-Math.max(0,(state.stress||0)-85)*.002))}
takeOpportunity=function(id){const offer=monthlyOffers(),o=V26_OFFERS.find(o=>o.id===id);if(!o||offer.resolved||!offer.ids.includes(id))return;if(!spendConfirmed('opportunity',o.cost,{offer:id}))return;
 const chance=opportunityChance(o),success=Math.random()<chance;offer.resolved=o.name;offer.success=success;offer.cost=o.cost;offer.income=success?(o.reward||0):0;offer.newMonthlyIncome=success?(o.cf||0):0;offer.chance=chance;
 for(const [k,v]of Object.entries(o.effects))state[k]=Math.max(k==='stress'||k==='social'?0:0,Math.min(100,(state[k]||0)+v));
 if(success&&o.cf)state.assets.push({id:assetId(),name:o.name,kind:'business',cost:o.cost,value:o.cost,cf:o.cf});
 if(offer.income){state.cash=roundCash(state.cash+offer.income);state.financeLedger.push({kind:'opportunityIncome',month:state.month,amount:offer.income,offer:id})}
 save();showEvent('机会结果',success?'已完成：'+o.name:'未成功：'+o.name,success?'项目成功，收入或新增月净收入已记录；持续收入从本月月末到账。':'项目未成功，客户或订单未形成，本次启动投入已损失。本次投入与结果已记录。',[['本次投入',priceText(o.cost)],['实际一次性收入',priceText(offer.income)],['新增月净收入',priceText(offer.newMonthlyIncome)+'/月'],['当前被动收入',priceText(state.passive)+'/月']],[['继续',()=>completeMonthlyStep(8),true]]);
};
// ETF monthly distributions are removed from quotes before cash/reinvestment: no free double return.
const ETF_YIELDS={us500:.018,ustotal:.02,international:.03,world:.024};
function ensureInvestSettings(){state.autoInvest??={};state.dividendReinvest??=true;}
function buyUnits(id,amount,kind='investmentBuy'){const cfg=V26_INSTRUMENTS.find(x=>x.id===id),q=quoteFor(id);if(!cfg||!Number.isFinite(amount)||amount<=0||amount>state.cash)return false;if(!spendConfirmed(kind,amount,{instrument:id,price:q.price}))return false;initQuotes();state.assets.push({id:assetId(),name:cfg.name,kind:'market',category:cfg.kind,instrument:id,cost:amount,value:amount,shares:amount/q.price,entryPrice:q.price,entryMonth:state.month,cf:0});return true}
function openInvestSettings(id){ensureInvestSettings();const cfg=V26_INSTRUMENTS.find(x=>x.id===id);if(!cfg||cfg.kind!=='ETF')return;
 showEvent('ETF 设置',cfg.name+' · 每月自动购买','确认后从本月月末起尝试购买；工资与支出结算后资金足够才执行，现金不足则跳过，不借钱、不透支。分红为游戏按月简化分配，非保证收益；除息会降低价格，再投资不等于额外获利。',[],[['确认保存设置',()=>{const amount=Number($('batchAutoAmount').value);if(!Number.isFinite(amount)||amount<0||Math.abs(roundCash(amount)-amount)>.00001)return;state.autoInvest[id]={amount};state.dividendReinvest=$('batchDrip').checked;save();finish()},true],['取消，不修改',finish,false]]);
 $('eventData').innerHTML='<label>每月购买金额（0 为停止）<input id="batchAutoAmount" type="number" inputmode="decimal" min="0" step="0.01" value="'+(state.autoInvest[id]?.amount||0)+'"></label><label class="wl-check"><input id="batchDrip" type="checkbox" '+(state.dividendReinvest?'checked':'')+'>所有 ETF 分红自动再投资（取消则留在现金）</label>';$('eventData').style.display='block';
}
const instrumentBeforeBatch=openInstrument;openInstrument=function(id){instrumentBeforeBatch(id);const cfg=V26_INSTRUMENTS.find(x=>x.id===id);if(cfg?.kind==='ETF'){const b=document.createElement('button');b.textContent='每月自动购买 / 分红设置';b.onclick=()=>openInvestSettings(id);$('actions').append(b);const note=document.createElement('p');const dividends=(state.financeLedger||[]).filter(x=>x.kind==='dividend'&&x.instrument===id).reduce((n,x)=>n+x.amount,0),reinvested=(state.financeLedger||[]).filter(x=>x.kind==='dividendReinvest'&&x.instrument===id).reduce((n,x)=>n+x.amount,0);note.textContent='模拟年分配率 '+(ETF_YIELDS[id]*100).toFixed(1)+'%，按月分红；价格已含除息变化。累计分红 '+priceText(dividends)+'，其中再投资 '+priceText(reinvested)+'。分红与浮动盈亏分开展示，不重复合计。';$('eventData').append(note)}};
const BOND_TERMS=[12,36,60];
function bondPrice(a,rate){const n=Math.max(0,a.maturesAt-state.month),r=rate/12,c=a.face*a.coupon/12;return n===0?a.face:roundCash(r?c*(1-Math.pow(1+r,-n))/r+a.face/Math.pow(1+r,n):a.face+c*n)}
function openBonds(){const rate=ECONOMIES[state.economy||0].rate;showEvent('债券市场','政府债券','游戏中的本国政府固定息债券：每月支付票息，到期返还面值。年票息在买入时锁定；市场利率上升会使已有债券价格下降。提前出售按当前估价，可能亏损；不套用截图中的保证8%回报。',[],BOND_TERMS.map(n=>['查看 '+n+'个月债券',()=>previewBond(n),false]).concat([['返回',finish,true]]))}
function previewBond(months){const coupon=bondYield(months),face=1000;showEvent('债券预览',months+'个月政府债券','固定年票息，按月支付；以下价格与利率为游戏模拟。',[['买入价格/面值',priceText(face)],['年票息率',(coupon*100).toFixed(2)+'%'],['每月票息',priceText(face*coupon/12)],['到期期数',months+' 次月末']],[['确认买入债券 $1,000',()=>{if(!spendConfirmed('bondBuy',face,{months,coupon}))return;state.assets.push({id:assetId(),name:months+'个月政府债券',kind:'bond',face,cost:face,value:face,coupon,cf:0,maturesAt:state.month+months,entryMonth:state.month});save();finish()},true,state.cash<face],['返回债券市场',openBonds,false]])}
function expectedInvestmentIncome(){
 let total=0;
 for(const [id,yieldRate] of Object.entries(ETF_YIELDS)){const perShare=roundCash(quoteFor(id).price*yieldRate/12),shares=(state.assets||[]).filter(a=>a.instrument===id).reduce((n,a)=>n+a.shares,0);total+=roundCash(shares*perShare)}
 for(const a of state.assets||[])if(a.kind==='bond')total+=roundCash(a.face*a.coupon/12);
 return roundCash(total);
}
function settleInvestingBatch(settlement,month){ensureInvestSettings();
 const budget=settlement.investmentIncomeBudget||0;
 if(budget){state.cash=roundCash(state.cash-budget);settlement.netCF=roundCash(settlement.netCF-budget);settlement.passive=roundCash(settlement.passive-budget)}
settlement.dividends=0;settlement.dividendReinvested=0;settlement.autoPurchases=[];settlement.bondInterest=0;settlement.bondPrincipal=0;
 for(const [id,yieldRate] of Object.entries(ETF_YIELDS)){
 const held=state.assets.filter(a=>a.instrument===id),shares=held.reduce((n,a)=>n+a.shares,0);if(!shares)continue;
 const q=quoteFor(id),perShare=roundCash(q.price*yieldRate/12),total=roundCash(shares*perShare);q.price=Math.max(.01,roundCash(q.price-perShare));if(q.history.at(-1)?.month===month)q.history.at(-1).price=q.price;
 for(const a of held)a.value=roundCash(a.shares*q.price);state.cash=roundCash(state.cash+total);settlement.dividends=roundCash(settlement.dividends+total);state.financeLedger.push({kind:'dividend',month:month-1,amount:total,instrument:id});
 if(state.dividendReinvest&&total>0&&buyUnits(id,total,'dividendReinvest'))settlement.dividendReinvested=roundCash(settlement.dividendReinvested+total);
 }
 const rate=ECONOMIES[state.economy||0].rate;
 state.assets=state.assets.filter(a=>{if(a.kind!=='bond')return true;const interest=roundCash(a.face*a.coupon/12);state.cash=roundCash(state.cash+interest);settlement.bondInterest=roundCash(settlement.bondInterest+interest);state.financeLedger.push({kind:'bondInterest',month:month-1,amount:interest,assetId:a.id});if(month>=a.maturesAt){state.cash=roundCash(state.cash+a.face);settlement.bondPrincipal=roundCash(settlement.bondPrincipal+a.face);state.financeLedger.push({kind:'bondMaturity',month:month-1,amount:a.face,assetId:a.id});return false}const n=a.maturesAt-month,r=bondYield(n)/12,c=a.face*a.coupon/12;a.value=roundCash(r?c*(1-Math.pow(1+r,-n))/r+a.face/Math.pow(1+r,n):a.face+c*n);return true});
 for(const [id,plan]of Object.entries(state.autoInvest)){if(!(plan.amount>0))continue;const ok=buyUnits(id,plan.amount,'autoInvest');settlement.autoPurchases.push({instrument:id,amount:plan.amount,status:ok?'purchased':'skippedInsufficientCash'});}
}
function completeCashAudit(s){
 const ledger=(state.financeLedger||[]).filter(x=>x.month===s.month-1);s.ledger=ledger.map(x=>({...x}));
 s.monthOpeningCash=state.turn?.month===s.month-1?state.turn.startCash:s.startCash;
 s.monthCashChange=roundCash(state.cash-s.monthOpeningCash);
 s.beforeSettlementChange=roundCash(s.startCash-s.monthOpeningCash);
 s.settlementCashChange=roundCash(state.cash-s.startCash);
 s.totalMonthlyCF=roundCash(s.totalMonthlyCF-(s.investmentIncomeBudget||0)+s.dividends+s.bondInterest);
}
function auditRows(s){const list=s.ledger||[],sum=k=>roundCash(list.filter(x=>x.kind===k).reduce((n,x)=>n+(x.amount||0),0));
 const loanPaid=(s.loanPayments||[]).filter(x=>x.status==='paid').reduce((n,x)=>n+x.due,0);
 const knownOut=['housingPayment','livingPayment','premiumsPayment','loanInstallment','hobbyPractice','lifestyle','opportunity','tuitionPayment','investmentBuy','bondBuy','autoInvest','dividendReinvest','movingCost','emergencyTransfer','lifeIncident','socialMeal','socialCoffee','extraPrincipal','cdPurchase','vehicleDownpayment','propertyDownpayment','iraTransfer'];
 const knownIn=['emergencyWithdrawal','incomeProtectionClaim','loanDisbursement','opportunityIncome','tuitionReversal','dividend','bondInterest','bondMaturity','socialIncome','assetSale'];
 const out=roundCash(knownOut.reduce((n,k)=>n+sum(k),0)),inc=roundCash(knownIn.reduce((n,k)=>n+sum(k),0));
 // Purchases retained from older modules may have no ledger; show an explicit reconciliation item.
 const settlementBase=roundCash(s.grossSalary-s.tax-s.kContrib+s.passive-(s.expenses-s.prepaidExpenses)+(s.loanPayments||[]).filter(x=>x.status==='overdue').reduce((n,x)=>n+x.due,0)+(s.cdPayout||0));
 const tracked=roundCash(inc-out+settlementBase),unclassified=roundCash(s.monthCashChange-tracked);
 return [['月初现金',s.monthOpeningCash],['税前工资 +',s.grossSalary],['工资税 −',s.tax],['401(k)个人缴费 −',s.kContrib],['资产净收入 +',s.passive],['应急金转回现金 +',sum('emergencyWithdrawal')],['收入保障赔款 +',sum('incomeProtectionClaim')],['贷款到账 +',sum('loanDisbursement')],['本月已付住房/基本生活/保险 −',sum('housingPayment')+sum('livingPayment')+sum('premiumsPayment')],['兴趣练习 −',sum('hobbyPractice')],['生活安排 −',sum('lifestyle')],['关系互动 −',sum('socialMeal')+sum('socialCoffee')],['机会投入 −',sum('opportunity')],['机会一次性收入 +',sum('opportunityIncome')],['学费支出 −',sum('tuitionPayment')],['学费退回 +',sum('tuitionReversal')],['月供已支付 −',loanPaid],['额外偿还本金 −',sum('extraPrincipal')],['本次月末支付（不含已付月供） −',roundCash(s.expenses-s.prepaidExpenses-(s.loanPayments||[]).filter(x=>x.status==='overdue').reduce((n,x)=>n+x.due,0))],['股票/ETF/债券买入 −',sum('investmentBuy')+sum('bondBuy')],['CD存入本金 −',sum('cdPurchase')],['车辆首付 −',sum('vehicleDownpayment')],['投资房首付 −',sum('propertyDownpayment')],['IRA账户转入 −',sum('iraTransfer')],['出售资产到账 +',sum('assetSale')],['ETF分红到账 +',s.dividends||0],['分红再投资 −',s.dividendReinvested||0],['ETF自动购买 −',sum('autoInvest')],['债券票息 +',s.bondInterest||0],['债券到期本金返还 +',s.bondPrincipal||0],['CD到期本金及利息返还 +',s.cdPayout||0],['其他已记录支出 −',sum('movingCost')+sum('emergencyTransfer')+sum('lifeIncident')],['关系事件额外收入 +',sum('socialIncome')],['其他现金变化（含旧模块未分类项）',unclassified],['整月现金实际变化',s.monthCashChange],['月末现金',s.endCash??state.cash]];
}
function showMonthlyAudit(s){
 showEvent('MONTH END','第 '+s.month+' 月结算完成','这是刚结束的第 '+s.month+' 月账单。住房、生活、兴趣与机会按实际付款汇总，已付款项不会重复扣除。',[],[['继续',()=>{clearModals();monthlyEvent()},true]]);
 $('eventData').innerHTML='<div class="wl-panel"><p>整月现金实际变化 <b>'+priceText(s.monthCashChange)+'</b><br>月末这一次收付 <b>'+priceText(s.settlementCashChange)+'</b><br>持续月度收支结余 <b>'+priceText(s.totalMonthlyCF)+'</b></p><details><summary>持续收支结余怎么计算？</summary><small>持续月度收支结余 = 税后工资 − 401(k)缴费 + 持续资产收入/本期分红票息 − 必要月支出及应付月供。它不含学费、兴趣、机会投入、买卖资产、借款本金或到期返本；自动再投资另外减少现金。</small></details></div><details><summary>展开完整现金明细</summary><table class="wl-review">'+auditRows(s).map(([k,v])=>'<tr><th>'+batchEscape(k)+'</th><td>'+priceText(v)+'</td></tr>').join('')+'</table></details><h3>贷款本月明细</h3>'+((s.loanPayments||[]).map(x=>'<p>'+batchEscape(x.name)+'：'+(x.status==='paid'?'已付 '+priceText(x.due)+'（本金 '+priceText(x.principal)+' / 利息 '+priceText(x.interest)+'）':'未付；当月利息 '+priceText(x.interest)+' + 逾期费用 '+priceText(x.penalty||0)+' 已入本金')+'</p>').join('')||'<p>无个人月供。</p>')+'<h3>自动购买执行情况</h3>'+((s.autoPurchases||[]).map(x=>'<p>'+batchEscape(V26_INSTRUMENTS.find(i=>i.id===x.instrument)?.name||x.instrument)+'：'+(x.status==='purchased'?'已购买 '+priceText(x.amount):'现金不足，已跳过 '+priceText(x.amount))+'</p>').join('')||'<p>未设置自动购买。</p>');$('eventData').style.display='block';
}
function openMedicalEvent(){const insured=!!state.insurance.health?.active,gross=600+Math.floor(Math.random()*5)*200,due=insured?0:gross;
 showEvent('医疗事件','突发疾病需要就医','需要门诊检查和治疗。'+(insured?'本游戏健康保险全额承担本次涵盖的医疗费用，保费仍按月支付。':'未购买健康保险，本次医疗费用由自己承担。'),[['医疗费用',priceText(gross)],['保险承担',priceText(gross-due)],['实际自付',priceText(due)]],[['确认就医 · '+priceText(due),()=>{if(!spendConfirmed('lifeIncident',due,{incident:'疾病就医',insurancePaid:gross-due}))return;state.health=Math.min(100,state.health+3);state.medicalEvents??=[];state.medicalEvents.push({month:state.month,gross,insured,due});save();finish()},true,state.cash<due],['暂缓就医',()=>{state.health=Math.max(0,state.health-4);state.stress=Math.min(100,state.stress+4);save();finish()},false]])}
const monthlyEventBeforeBatch=monthlyEvent;monthlyEvent=function(){const risk=.025+Math.max(0,80-(state.health||80))*.0015+Math.max(0,(state.stress||0)-50)*.001;if(Math.random()<risk){openMedicalEvent();return}monthlyEventBeforeBatch()};
// Selected social activities can reveal shared interests and actual paid work.
function maybeSocialFollowUp(person){if(Math.random()>=.35){finish();return}
 const hobby=Object.keys(state.hobbyXP||{}).find(k=>state.hobbyXP[k]>0)||'摄影',key=state.month+':'+(person?.id||'life');state.socialEvents??={};
 if(state.socialEvents[key]){finish();return}
 const job=Math.random()<.5;showEvent('关系事件',job?'朋友介绍小订单':'发现共同爱好',job?(person?.name||'朋友')+'介绍了一份'+hobby+'小订单。需要投入时间，完成质量存在不确定性。':'你和'+(person?.name||'朋友')+'聊到了'+hobby+'，可以约一次免费交流，增进关系。',[['成本','$0'],['可能收入',job?'$160（成功时）':'$0'],['成功率',job?Math.round(Math.min(.95,.65+hobbyLevel(hobby)*.03)*100)+'%':'100%']],[['确认参加',()=>{if(state.socialEvents[key])return;const success=!job||Math.random()<Math.min(.95,.65+hobbyLevel(hobby)*.03);const reward=job&&success?160:0;state.socialEvents[key]={job,success,reward};if(person)person.relation=Math.min(100,person.relation+8);state.social=Math.min(100,state.social+4);state.mood=Math.min(100,state.mood+3);state.energy=Math.max(0,state.energy-4);if(reward){state.cash=roundCash(state.cash+reward);state.financeLedger??=[];state.financeLedger.push({kind:'socialIncome',month:state.month,amount:reward})}save();showEvent('关系结果',success?'交流完成':'订单未通过验收',reward?'订单已完成，报酬已进入现金。':job?'本次没有获得报酬；关系仍有所进展。':'一起交流了共同爱好，关系与心情有所增加。',[['实际收入',priceText(reward)],['亲密度',person?Math.round(person.relation)+'/100':'社交 +4']],[['继续',finish,true]])},true],['这次不参加',()=>{state.socialEvents[key]={skipped:true};save();finish()},false]])}
const lifeBeforeBatch=chooseLife;chooseLife=function(i){const already=monthSelection('life');lifeBeforeBatch(i);if(!already&&monthSelection('life')&&['朋友聚餐','兴趣爱好'].includes(V26_LIFE[i]?.name))maybeSocialFollowUp((state.people||[])[0])};
$('networkBtn').onclick=()=>{const people=state.people||[];showEvent('关系网','联系认识的人','先查看人物，再确认具体活动。每次付款前显示费用。',[],people.map((p,i)=>['联系 '+p.name,()=>openSocialPerson(i),false]).concat([['返回',finish,true]]))};
function openSocialPerson(i){const p=state.people[i];if(!p)return;showEvent('关系互动',p.name+' · '+relationStage(p),'选择与这位熟人相处的方式。',[['身份',p.status||p.job],['亲密度',Math.round(p.relation)+'/100']],[['确认一起吃饭 · $45',()=>doSocial(p,45,8,'socialMeal'),true,state.cash<45],['确认聊天 · $15',()=>doSocial(p,15,5,'socialCoffee'),false,state.cash<15],['返回，不互动',finish,false]])}
function doSocial(p,cost,points,kind){if(!spendConfirmed(kind,cost,{person:p.id||p.name}))return;p.relation=Math.min(100,p.relation+points);state.social=Math.min(100,state.social+3);state.mood=Math.min(100,state.mood+3);save();maybeSocialFollowUp(p)}
const choicesBeforeBatch=window.v26Choices;window.v26Choices=function(key,api){
 if(key==='work'&&state.job&&!state.retired&&!state.unemployedMonths)return api.option('继续当前工作','保持现有工作与工资。',()=>completeMonthlyStep(2),true)+api.option('查看工作调整','预览职位或明确确认辞职。查看不改变工作。',openWorkAdjustment);
 if(key==='money')return '<div class="wl-panel"><h3>本月贷款还款</h3><p>应付 '+priceText(loanBudgetTotal())+' · 已付 '+priceText(paidLoanTotal())+'。忘记确认将产生逾期费用。</p><button data-batch="loanPayments">查看并确认还款</button></div>'+api.option('ETF','查看价格、买入及每月自动购买设置。',()=>openMarket('ETF'),true)+api.option('股票','查看模拟公司与价格。',()=>openMarket('股票'))+api.option('基金','混合资产基金。',()=>openMarket('基金'))+api.option('政府债券','固定票息，提前卖出价格有波动。',openBonds)+api.option('CD 定期存款','到期还本付息。',openCD)+api.option('房产投资','比较首付、租金与成本。',()=>window.v242RealEstate())+api.option('完成本月资产安排','保留当前配置并继续。',()=>completeMonthlyStep(7));
 if(key==='review'){const m=calcMetrics(),loan=currentLoanCycle().items;return '<div class="wl-panel"><h3>本月现金核对</h3><p>月初现金 '+priceText(state.turn.startCash)+'<br>当前现金 '+priceText(state.cash)+'<br>月内实际变化 '+priceText(state.cash-state.turn.startCash)+'</p><p>月末税后工资 '+priceText(m.grossSalary-m.tax-m.kContrib)+'<br>持续资产收入预算（含分红票息） '+priceText(state.passive)+'<br>尚未支付的必要成本 '+priceText(m.remainingExpenses)+'（含待付月供预算）</p><p>ETF分红、票息、到期返本和自动购买将在结算时逐项记录。</p></div><div class="wl-panel"><h3>机会结果</h3><p>'+batchEscape(state.monthlyOpportunities?.resolved||'未选择')+'</p><p>投入 '+priceText(state.monthlyOpportunities?.cost||0)+' · 一次性收入 '+priceText(state.monthlyOpportunities?.income||0)+' · 新增净收入 '+priceText(state.monthlyOpportunities?.newMonthlyIncome||0)+'/月</p></div><div class="wl-panel"><h3>还款提醒</h3><p>'+loan.map(x=>batchEscape(x.name)+'：'+(x.status==='paid'?'已付':'未付 '+priceText(x.due))).join('<br>')+'</p><button data-batch="loanPayments">查看还款卡</button></div><button data-v26="settle" class="wl-secondary">确认结算，进入下个月 →</button>'}
 return choicesBeforeBatch(key,api);
};
const batchRenderBase=render;render=function(){batchRenderBase();if(!state)return;for(const a of state.assets){const cfg=V26_INSTRUMENTS.find(i=>i.id===a.instrument);if(cfg)a.name=cfg.name}const box=$('assets');if(!document.getElementById('batchBondsEntry')){const b=document.createElement('button');b.id='batchBondsEntry';b.textContent='政府债券 · 查看市场';b.onclick=openBonds;box.append(b)}const debts=$('debts');const pay=document.createElement('button');pay.textContent='本月贷款还款卡';pay.onclick=openLoanPayments;debts.append(pay)};
document.addEventListener('click',e=>{const b=e.target.closest('[data-batch]');if(!b||b.disabled)return;const k=b.dataset.batch;if(k==='loanPayments')openLoanPayments();if(k==='payLoan')payLoanInstallment(b.dataset.key);if(k==='applyCareer'){b.disabled=true;applyCareer(+b.dataset.i)}});
// Keep older extra-principal controls auditable, with their existing confirmation preview.
const extraPrincipalBeforeBatch=payDebt;payDebt=function(name){extraPrincipalBeforeBatch(name);const b=$('actions').firstElementChild;if(!b||b.textContent!=='确认还款')return;const original=b.onclick;b.onclick=e=>{const before=state.cash;original(e);const amount=roundCash(before-state.cash);if(amount>0){state.financeLedger??=[];state.financeLedger.push({kind:'extraPrincipal',month:state.month,loan:name,amount});save()}}};
