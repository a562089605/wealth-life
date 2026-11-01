// Approved monthly bill: rent and living costs share one confirmation, retain separate receipts.
function livingBillQuote(){
 const paid=paymentReceipt(),selected=!!state.housing&&state.housing!=='unselected';
 const housing=roundCash(Math.max(0,(state.housingCost||0)-(paid.housing||0))),living=roundCash(Math.max(0,livingTotal()-(paid.living||0)));
 const q={month:state.month,selected,housing,living,total:roundCash(housing+living),blocked:housingHandoverDue()};
 q.token=[q.month,state.housing,state.housingCost,livingTotal(),paid.housing||0,paid.living||0,state.pendingHousingMove?.requestedMonth??'',q.blocked].join('|');return q;
}
function confirmLivingBill(month,token){
 syncFinance();const q=livingBillQuote();
 if(q.month!==month||q.token!==token||!q.selected||q.blocked||q.total<=0||state.cash<q.total)return false;
 // Both amounts are preflighted before either synchronous payment; no partial charge on shortage.
 if(!payMonthly('housing',q.housing))return false;
 if(!payMonthly('living',q.living))throw Error('Living bill preflight invariant failed');
 setMonthSelection('lifeArrangement',true);save();render();return true;
}
(function(){
 const oldBills=necessaryBills;
 necessaryBills=function(){const rows=oldBills();if(!state.housing||state.housing==='unselected')return rows;
  const q=livingBillQuote(),result=rows.filter(r=>r.kind!=='housing'&&r.kind!=='living');
  const due=q.blocked?q.living:q.total;
  if(due>.005)result.push({kind:'livingBill',name:'本月生活账单',due,action:()=>window.openLifeOverview()});return result;
 };
 // Existing necessary-bill and town entry points lead to the same paid-once bill.
 openTownLiving=function(){return window.openLifeOverview();};
})();
