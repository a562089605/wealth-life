function necessaryBills(){syncFinance();const paid=paymentReceipt(),rows=[];
 if(!state.housing||state.housing==='unselected')rows.push({kind:'housing',name:'选择住房',due:0,action:openHousing});
 const add=(kind,name,due,action)=>{due=roundCash(Math.max(0,due));if(due>.005)rows.push({kind,name,due,action});};
 add('housing','本月住房',(state.housingCost||0)-(paid.housing||0),openHousing);
 add('living','基本生活及日常养护',livingTotal()-(paid.living||0),openTownLiving);
 add('premiums','有效保单保费',premiumsTotal()-(paid.premiums||0),()=>openInsurance());
 for(const l of currentLoanCycle().items)if(l.status!=='paid')add('loan',l.name+'月供',l.due,openLoanPayments);
 if(state.carOwned&&!state.insurance.auto?.active)rows.push({kind:'auto',name:'车辆需有效车险',due:0,action:()=>openInsurance('auto')});
 if(petCareTasks().length)rows.push({kind:'petCare',name:'到期宠物照护',due:0,action:openPetCare});
 return rows;}
function openNecessaryBills(){const rows=necessaryBills();save();showEvent('必要安排','出门前完成本月必要事项','已付费用不会重复收取。资金不足可筹款或调整尚未执行的安排；本页不推进月份。',rows.map(r=>[r.name,r.due?priceText(r.due):'待处理']),[
 ...rows.map(r=>[r.name,r.action,true]),['资金不足，查看补救',()=>showFundingOptions(rows.reduce((n,r)=>n+r.due,0),openNecessaryBills),false],['查看银行',()=>openBankLoan(Math.max(1,Math.ceil(rows.reduce((n,r)=>n+r.due,0)-state.cash)),{after:openNecessaryBills}),false],['返回房屋',townHome,false]]);}
const billsRollBefore=rollTown;rollTown=function(){if(healthTreatmentKind(state.health)||unfinishedTreatment())return billsRollBefore();if(!explorationStarted()&&necessaryBills().length)return openNecessaryBills();return billsRollBefore();};
const billsSettlementBefore=settleMonth;settleMonth=function(){if(isRecoveryMonth(state)&&necessaryBills().length)return openNecessaryBills();return billsSettlementBefore();};
