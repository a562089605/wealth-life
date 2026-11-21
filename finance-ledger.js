// Cash amounts in legacy receipts are positive magnitudes, except sale proceeds.
const FinanceLedger = (() => {
 const incoming={
  sharedInterestIncome:'共同兴趣收入',apartmentIncome:'小公寓事件收入',studioIncome:'独居事件收入',
  sharedIncome:'合租事件收入',familyIncome:'家庭事件收入',housingDepositRefund:'退回住房押金',
  emergencyWithdrawal:'应急金转回',retirementWithdrawal:'退休账户提款',incomeProtectionClaim:'收入保障赔款',loanDisbursement:'贷款到账',
  opportunityIncome:'机会收入',tuitionReversal:'学费退款',dividend:'ETF分红',bondInterest:'债券票息',
  bondMaturity:'债券到期还本',socialIncome:'关系活动收入',assetSale:'出售资产净到账',
  ownerHomeSale:'出售自住房净到账',cafeDividend:'门店分红',cafeEquitySale:'门店股份出售',
  cafeEquityRefund:'门店股份退款',relationshipReward:'关系事件收入',lifeReward:'摄影展奖金',bonus:'奖金或项目收入',
  cdPrincipal:'定期存款到期还本',cdInterest:'定期存款到期利息',
  cdEarlyPrincipal:'定期存款提前支取本金',cdEarlyInterest:'定期存款提前支取实收利息'
 };
 const outgoing={
  sharedInterestExpense:'共同兴趣支出',apartmentExpense:'小公寓事件支出',studioExpense:'独居事件支出',
  sharedExpense:'合租事件支出',familyExpense:'家庭事件支出',ownerHomeDownpayment:'自住房首付',
  housingDeposit:'住房押金',housingPayment:'住房付款',livingPayment:'基本生活及日常养护',
  premiumsPayment:'保费',loanInstallment:'个人贷款还款',hobbyPractice:'兴趣练习',
  specialistPractice:'专项练习',lifestyle:'生活活动',opportunity:'机会投入',tuitionPayment:'学费',
  investmentBuy:'买入投资',bondBuy:'买入债券',autoInvest:'自动投资',dividendReinvest:'分红再投资',
  movingCost:'搬家支出',emergencyTransfer:'划入应急金',lifeIncident:'生活事件支出',socialMeal:'聚餐',
  socialCoffee:'咖啡与社交',extraPrincipal:'额外偿还本金',cdPurchase:'定期存款本金',
  vehicleDownpayment:'车辆首付',propertyDownpayment:'投资房首付',propertyCashPurchase:'投资房全款',iraTransfer:'转入 IRA',
  brokerageTransfer:'转入普通投资账户',cafeEquityDeposit:'门店股份暂存',relationshipExpense:'关系事件支出',
  socialVisit:'关系探访',petAdoption:'领养宠物',petCare:'宠物护理',coffeeCourse:'职业课程',
  medicalTreatment:'医疗费用',homeInsurancePremium:'房险保费',homeDamage:'房屋损坏自付',
  recovery:'恢复期支出',fastInvestment:'项目投资',dreamFulfilment:'梦想项目支出'
 };

 function receipts(entries){
  return entries.map(row=>{
   const credit=Object.hasOwn(incoming,row.kind);
   const debit=Object.hasOwn(outgoing,row.kind)||row.direction==='out';
   const label=Object.hasOwn(incoming,row.kind)?incoming[row.kind]:Object.hasOwn(outgoing,row.kind)?outgoing[row.kind]:row.title||row.kind||'未分类记录';
   const instrument=V26_INSTRUMENTS.find(item=>item.id===row.instrument)?.name;
   const context=[row.loan||instrument||row.choice||row.hobby||row.petName||row.species||row.title];
   if(row.kind==='loanInstallment')context.push('本金 '+priceText(row.principal)+' / 利息 '+priceText(row.interest));
   if(row.kind==='loanOverdue')context.push('计入贷款余额 '+priceText(row.capitalized||0));
   if(row.forfeitedInterest>0)context.push('扣除利息 '+priceText(row.forfeitedInterest));
   if(row.insurancePaid>0)context.push('保险承担 '+priceText(row.insurancePaid));
   const amount=Number.isFinite(row.amount)?row.amount:0;
   return {label:row.kind==='loanOverdue'?'贷款逾期（未扣现金）':label,
    amount:debit?-amount:amount,uncategorized:!credit&&!debit&&amount!==0,context:context.filter(Boolean).join(' · ')};
  });
 }

 function reconcile(rows,change){
  if(!Number.isFinite(change))return rows;
  const gap=roundCash(change-rows.reduce((sum,row)=>sum+(row.uncategorized?0:row.amount),0));
  return gap?[...rows,{label:'未分类现金差额',amount:gap,context:'存档未保留逐笔记录'}]:rows;
 }

 function forecastExpenses(includeLoanPayments=true){
  const paid=paymentReceipt();
  const outstanding=(amount,alreadyPaid)=>roundCash(Math.max(0,amount-(alreadyPaid||0)));
  const loans=unpaidLoanRows();
  const rows=[
   ['住房',outstanding(state.housingCost||0,paid.housing)],
   ['基本生活及日常养护',outstanding(livingTotal(),paid.living)],
   ['有效保单保费',outstanding(premiumsTotal(),paid.premiums)],
   ...loans.filter(()=>includeLoanPayments).map(row=>[row.name+'月供',row.due])
  ];
  const other=roundCash(remainingExpenses()-(includeLoanPayments?0:loans.reduce((sum,row)=>sum+row.due,0))-rows.reduce((sum,[,amount])=>sum+amount,0));
  if(other)rows.push(['其他经常支出',other]);
  return rows.filter(([,amount])=>amount!==0);
 }

 function month(settlement,entries){
  const rows=receipts(entries);
  const overdue=(settlement.loanPayments||[]).filter(row=>row.status==='overdue')
   .reduce((sum,row)=>sum+row.due,0);
  const remaining=roundCash(settlement.expenses-settlement.prepaidExpenses-overdue);
  const recurring=[
   ['工资（税前）',settlement.grossSalary],['工资税',-settlement.tax],
   ['401(k) 个人缴费',-settlement.kContrib],
   ...(settlement.cashAssetLines||[['持续资产净现金流',settlement.passive]]),
   ...(settlement.cashExpenseLines||[['月末补付经常支出',remaining]]).map(([label,amount])=>[label,-amount])
  ];
  if(!entries.some(row=>row.kind==='cdPrincipal'||row.kind==='cdInterest'))recurring.push(['定期存款到期本息',settlement.cdPayout]);
  if(!entries.some(row=>row.kind==='dividend'))recurring.push(['ETF分红',settlement.dividends]);
  if(!entries.some(row=>row.kind==='bondInterest'))recurring.push(['债券票息',settlement.bondInterest]);
  if(!entries.some(row=>row.kind==='bondMaturity'))recurring.push(['债券到期还本',settlement.bondPrincipal]);
  rows.push(...recurring.filter(([,amount])=>Number.isFinite(amount)&&amount!==0).map(([label,amount])=>({label,amount})));
  const start=settlement.monthOpeningCash;
  const end=settlement.endCash;
  const change=settlement.monthCashChange??(Number.isFinite(start)&&Number.isFinite(end)?end-start:undefined);
  return reconcile(rows,change);
 }

 return {receipts,reconcile,forecastExpenses,month};
})();
