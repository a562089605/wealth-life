function heldHousingDeposit(){return state.housingLease?.depositHeld||0}
function housingHandoverDue(){return !!state.pendingHousingMove&&state.pendingHousingMove.effectiveMonth<=state.month}
function housingQuote(h){const current=state.housing===h[3]&&state.housing!=='unselected',first=!state.housing||state.housing==='unselected',paid=paymentReceipt().housing||0;
 const monthly=current?state.housingCost:h[1],rent=Math.max(0,monthly-paid),deposit=h[3]==='family'||h[3]==='own'?0:monthly;
 return {current,first,monthly,rent,deposit:current?0:deposit,total:current?roundCash(rent):first?roundCash(rent+deposit):0,scheduled:!first&&!current};}
function confirmHousing(key){syncFinance();if(housingHandoverDue())return openHousingHandover();const h=housingChoices().find(h=>h[3]===key);if(!h)return false;const q=housingQuote(h);
 if(q.scheduled){state.pendingHousingMove={key,name:h[0],monthly:q.monthly,deposit:q.deposit,effectiveMonth:state.month+1,requestedMonth:state.month};save();openHousing();return true;}
 if(state.cash<q.total)return false;
 if(q.first){if(!spendConfirmed('housingDeposit',q.deposit,{housing:key}))return false;}
 if(!payMonthly('housing',q.rent))return false;
 state.housing=key;state.housingCost=q.monthly;
 if(q.first)state.housingLease={key,monthly:q.monthly,depositHeld:q.deposit,startMonth:state.month,renewalMonth:state.month+12};
 state._computedExpenses=null;state.paymentUpgradeNotice=false;syncFinance();save();completeMonthlyStep(0);return true;}
function housingHandoverQuote(){const m=state.pendingHousingMove;if(!m||!housingHandoverDue())return null;
 const refund=heldHousingDeposit(),total=roundCash(m.deposit+m.monthly);return {...m,refund,total,net:roundCash(total-refund),shortfall:roundCash(Math.max(0,total-state.cash-refund))};}
function confirmHousingHandover(){const q=housingHandoverQuote();if(!q||q.shortfall>0)return false;
 const id=state.month+':'+q.key+':'+q.requestedMonth;state.housingHandoverReceipts??={};if(state.housingHandoverReceipts[id])return false;
 state.cash=roundCash(state.cash+q.refund-q.deposit-q.monthly);
 const log=state.financeLedger??=[];if(q.refund)log.push({kind:'housingDepositRefund',month:state.month,amount:q.refund,id});if(q.deposit)log.push({kind:'housingDeposit',month:state.month,amount:q.deposit,id});log.push({kind:'housingPayment',month:state.month,amount:q.monthly,id});
 if(state.monthlyPayments?.month!==state.month)state.monthlyPayments={month:state.month,housing:0,living:0,premiums:0};state.monthlyPayments.housing=q.monthly;
 state.housing=q.key;state.housingCost=q.monthly;state.housingLease={key:q.key,monthly:q.monthly,depositHeld:q.deposit,startMonth:state.month,renewalMonth:state.month+12};state.housingHandoverReceipts[id]=true;delete state.pendingHousingMove;state._computedExpenses=null;syncFinance();save();openHousing();return true;}
function cancelHousingMove(){if(!state.pendingHousingMove||housingHandoverDue())return false;delete state.pendingHousingMove;save();openHousing();return true;}
function openHousingHandover(){const q=housingHandoverQuote();if(!q)return openHousing();const owner=state,cycle=state.month,snapshot=JSON.stringify(q);let preview;showEvent('住房交接','退旧押金，入住新住处','确认时结算旧押金、新押金与本月新房租。费用不足不部分扣款，也不重复收旧房本月租金。',[
 ['新住处',q.name],['退回旧押金',priceText(q.refund)],['新押金',priceText(q.deposit)],['本月房租',priceText(q.monthly)],['交接后现金',priceText(state.cash-q.net)],['尚缺',priceText(q.shortfall)]],[['确认交接',()=>{if(state!==owner||state.month!==cycle||!eventActionCurrent(preview,'退旧押金，入住新住处'))return false;if(JSON.stringify(housingHandoverQuote())!==snapshot)return openHousingHandover();return confirmHousingHandover()},true,q.shortfall>0],['筹措资金',()=>openBankLoan(Math.max(1,Math.ceil(q.shortfall)),{after:openHousingHandover}),false]]);preview=$('actions').firstElementChild;}
function housingMarkup(){if(housingHandoverDue())return '<button data-lease-handover class="primary">办理本月住房交接</button>';
 const move=state.pendingHousingMove;return (move?'<div class="wl-panel">已预约下月入住：'+batchEscape(move.name)+'；预约未扣款。<button data-lease-cancel>取消换房预约</button></div>':'')+'<div class="wl-mini-grid">'+housingChoices().map(h=>{const q=housingQuote(h);return '<button class="wl-choice-card" data-v26="housing" data-key="'+h[3]+'" '+(state.cash<q.total?'disabled':'')+'><strong>'+batchEscape(q.current?'继续当前住房':h[0])+'</strong><b>'+priceText(q.monthly)+'/月</b><small>'+(q.scheduled?'次月换房，预约不扣款':'本月房租 '+priceText(q.rent)+' · 新押金 '+priceText(q.deposit))+'</small><span>'+(q.scheduled?'预约次月入住':'确认支付 '+priceText(q.total))+'</span></button>';}).join('')+'</div><p>租房押金为一个月房租，退租交接返还。住房费用已包含水电与家庭网络。</p>';}
const leaseMetricsBefore=calcMetrics;calcMetrics=function(){const m=leaseMetricsBefore(),deposit=heldHousingDeposit();return {...m,assetValue:m.assetValue+deposit,nw:m.nw+deposit};};
const leaseBillsBefore=necessaryBills;necessaryBills=function(){const rows=leaseBillsBefore();if(!housingHandoverDue())return rows;return [{kind:'housingHandover',name:'次月住房交接',due:Math.max(0,housingHandoverQuote().net),action:openHousingHandover},...rows.filter(r=>r.kind!=='housing')];};
document.addEventListener('click',e=>{if(e.target.closest('[data-lease-handover]'))openHousingHandover();if(e.target.closest('[data-lease-cancel]'))cancelHousingMove();});
// Requote rental cost only at the 12-month boundary; the original deposit stays held.
const leaseSyncBefore=syncFinance;syncFinance=function(){const l=state?.housingLease;if(l&&state.month>=l.renewalMonth&&!housingHandoverDue()){
 const h=housingOptions().find(h=>h[3]===l.key);if(h){l.monthly=h[1];state.housingCost=h[1];while(l.renewalMonth<=state.month)l.renewalMonth+=12;}}
 return leaseSyncBefore();};
