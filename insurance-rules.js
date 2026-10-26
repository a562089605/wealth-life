// Shared monthly premium receipts include every actual policy, including per-pet policies.
(function(root){'use strict';
const money=n=>Math.round((n+Number.EPSILON)*100)/100;
function quote(s,addition=null){
 const monthly=money(Object.values(s.insurance||{}).reduce((n,p)=>n+(p?.active?Number(p.monthly)||0:0),0));
 const extra=addition&&!s.insurance?.[addition.key]?.active?Number(addition.monthly)||0:0;
 const paid=s.monthlyPayments?.month===s.month?Number(s.monthlyPayments.premiums)||0:0;
 return {month:s.month,monthly:money(monthly+extra),paid,due:money(Math.max(0,monthly+extra-paid))};
}
function applyChanges(s){
 for(const [key,change] of Object.entries(s.pendingInsuranceChanges||{})){
  if(!Number.isInteger(change.effectiveMonth)||change.effectiveMonth>s.month)continue;
  if(change.active===false&&s.insurance?.[key])s.insurance[key].active=false;
  delete s.pendingInsuranceChanges[key];
 }
}
const api={quote,applyChanges};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.InsuranceRules=api;
})(globalThis);
