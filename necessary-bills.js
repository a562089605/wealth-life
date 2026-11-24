function necessaryBills(){syncFinance();const paid=paymentReceipt(),rows=[];
 if(!state.housing||state.housing==='unselected')rows.push({kind:'housing',name:'选择住房',due:0,action:openHousing});
 const add=(kind,name,due,action)=>{due=roundCash(Math.max(0,due));if(due>.005)rows.push({kind,name,due,action});};
 add('housing','本月住房',(state.housingCost||0)-(paid.housing||0),openHousing);
 add('living','基本生活及日常养护',livingTotal()-(paid.living||0),openTownLiving);
 add('premiums','支付本月保费',HomeInsurance.premiumBill().total,()=>HomeInsurance.openPremiumPayment(openNecessaryBills,()=>necessaryBills().length?openNecessaryBills():isRecoveryMonth(state)?townHome():leaveTownRoom()));
 for(const l of currentLoanCycle().items)if(l.status!=='paid')add('loan',l.name+'月供',l.due,openLoanPayments);
 if(state.carOwned&&!state.insurance.auto?.active)rows.push({kind:'auto',name:'有效车险或停用车辆',due:0,action:()=>openInsurance('auto')});
 if(petCareTasks().some(t=>t.kind!=='Clean'))rows.push({kind:'petCare',name:'到期宠物照护',due:0,action:openPetCare});
 return rows;}
function openNecessaryBills(){
 const rows=necessaryBills();
 const total=rows.reduce((sum,row)=>sum+row.due,0);
 save();
 showEvent('必要安排','出门前完成本月必要事项','已支付的费用不会重复收取。处理这些事项不会推进月份。',[],[
  ...rows.map(row=>[row.name,row.action,true]),
  ['资金不足，查看补救',()=>showFundingOptions(total,openNecessaryBills),false],
  ['查看银行',()=>openBankLoan(Math.max(1,Math.ceil(total-state.cash)),{after:openNecessaryBills}),false],
  ['返回房屋',townHome,false]
 ]);
 const data=$('eventData');
 if(data.closest('.event').dataset.homeNotice!=='bills')return;
 const list=document.createElement('div');
 list.className='home-notice-checklist';
 const buttons=Array.from($('actions').children);
 rows.forEach((row,index)=>{
  const button=buttons[index];
  const title=document.createElement('span');
  title.textContent=row.name;
  const status=document.createElement('strong');
  status.textContent=row.due?priceText(row.due):'待处理';
  const arrow=document.createElement('span');
  arrow.className='home-notice-arrow';
  arrow.setAttribute('aria-hidden','true');
  arrow.textContent='→';
  button.replaceChildren(title,status,arrow);
  list.append(button);
 });
 if(rows.length)data.append(list);
}
const billsRollBefore=rollTown;rollTown=function(){if(healthTreatmentKind(state.health)||unfinishedTreatment())return billsRollBefore();if(!explorationStarted()&&necessaryBills().length)return openNecessaryBills();return billsRollBefore();};
const billsSettlementBefore=settleMonth;settleMonth=function(){if(isRecoveryMonth(state)&&necessaryBills().length)return openNecessaryBills();return billsSettlementBefore();};
