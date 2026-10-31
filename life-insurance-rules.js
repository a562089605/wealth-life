// Five user-confirmed fictional-game groups; no random death or estate transfers.
(function(root){'use strict';
const TERMS=Object.freeze({monthly:35,benefit:100000,minAge:18,maxEntryAge:65,deathAge:90});
const money=n=>Math.round((Number(n)||0)*100)/100,clone=x=>JSON.parse(JSON.stringify(x));
function meta(s){return s.lifeInsurance??={version:1,sequence:0,payments:[],beneficiary:{type:'family',name:'家庭保障账户'}};}
function fee(p){return Number.isFinite(Number(p?.monthly))&&p?.monthly!=null?Math.max(0,Number(p.monthly)):TERMS.monthly;}
function benefit(p){for(const k of ['benefit','deathBenefit','sumAssured','insuredAmount','coverageAmount','payout'])if(p?.[k]!=null&&Number.isFinite(Number(p[k]))&&Number(p[k])>=0)return money(p[k]);return TERMS.benefit;}
function sync(s){const p=s.insurance?.life;if(!p)return;const m=meta(s);
 if(!p.lifePolicyId){p.lifePolicyId=++m.sequence;const all=Object.values(s.insurance||{}).reduce((n,x)=>n+(x?.active?(Number(x.monthly)||0):0),0),r=s.monthlyPayments;
  const receipt=!!(p.active&&p.monthly!=null&&r?.month===s.month),allocated=receipt?money(Math.min(fee(p),Math.max(0,Number(r.premiums||0)-(all-(Number(p.monthly)||0))))):0;
  m.opening={month:s.month,policyId:p.lifePolicyId,credit:allocated,paid:receipt&&allocated+.005>=fee(p)};
 }
 if(p.benefit==null)p.benefit=benefit(p);if(p.monthly==null)p.monthly=TERMS.monthly;
 const x=s.pendingInsuranceChanges?.life;if(!s.lifeEnding&&x?.effectiveMonth<=s.month){if(x.active===false)p.active=false;delete s.pendingInsuranceChanges.life;}
}
function credit(s){const o=s.lifeInsurance?.opening;return o?.month===s.month?o.credit:0;}
function paid(s){return money(credit(s)+(s.lifeInsurance?.payments||[]).filter(x=>x.month===s.month).reduce((n,x)=>n+x.amount,0));}
function policyPaidAmount(s,p=s.insurance?.life){if(!p)return 0;const o=s.lifeInsurance?.opening;return money((o?.month===s.month&&o.policyId===p.lifePolicyId?o.credit:0)+(s.lifeInsurance?.payments||[]).filter(x=>x.month===s.month&&x.policyId===p.lifePolicyId).reduce((n,x)=>n+x.amount,0));}
function paidPolicy(s,p=s.insurance?.life){const o=s.lifeInsurance?.opening;return !!(p&&policyPaidAmount(s,p)+.005>=fee(p)&&(o?.month===s.month&&o.policyId===p.lifePolicyId&&o.paid||(s.lifeInsurance?.payments||[]).some(x=>x.month===s.month&&x.policyId===p.lifePolicyId)));}
function raw(s){const p=s.insurance?.life;return p?.active?fee(p):0;}
function due(s){const p=s.insurance?.life;return p?.active&&!paidPolicy(s,p)?money(Math.max(0,fee(p)-policyPaidAmount(s,p))):0;}
function budget(s){return money(paid(s)+due(s));}
function covered(s){return !s.lifeEnding&&!!s.insurance?.life?.active&&paidPolicy(s);}
function canBuy(s){return !s.gameOver&&!s.lifeEnding&&!s.insurance?.life?.active&&s.age>=TERMS.minAge&&s.age<=TERMS.maxEntryAge;}
function pay(s){sync(s);const old=s.insurance?.life,fresh=!old?.active;if(s.lifeEnding||s.gameOver||fresh&&!canBuy(s)||!fresh&&paidPolicy(s,old))return false;
 const amount=fresh?TERMS.monthly:due(s);if(!Number.isFinite(s.cash)||s.cash<amount)return false;const m=meta(s);s.insurance??={};
 if(fresh){if(old)(m.policyHistory??=[]).push(clone(old));s.insurance.life={name:'人寿保险',active:true,monthly:TERMS.monthly,benefit:TERMS.benefit,lifePolicyId:++m.sequence,startMonth:s.month};delete s.pendingInsuranceChanges?.life;}
 const p=s.insurance.life;s.cash=money(s.cash-amount);const r={month:s.month,policyId:p.lifePolicyId,amount};m.payments.push(r);(s.financeLedger??=[]).push({kind:'lifePremium',...r});return true;
}
function cancel(s){sync(s);if(s.lifeEnding||s.gameOver||!s.insurance?.life?.active)return false;(s.pendingInsuranceChanges??={}).life={active:false,effectiveMonth:s.month+1};return true;}
function revoke(s){if(s.lifeEnding||s.gameOver)return false;sync(s);const x=s.pendingInsuranceChanges?.life;if(!x||x.effectiveMonth<=s.month)return false;delete s.pendingInsuranceChanges.life;return true;}
function beneficiaryOptions(s){return [{key:'family',type:'family',name:'家庭保障账户'},...(s.people||[]).map((p,i)=>({key:'person:'+String(p.id??i),type:'person',personId:p.id??null,name:p.name||'联系人'+(i+1)}))];}
function setBeneficiary(s,key){if(s.lifeEnding||s.gameOver)return false;const b=beneficiaryOptions(s).find(b=>b.key===key);if(!b)return false;meta(s).beneficiary=clone(b);return true;}
function snapshot(s){sync(s);return {month:s.month,age:s.age,policy:s.insurance?.life?clone(s.insurance.life):null,paid:covered(s),due:due(s),beneficiary:clone(s.lifeInsurance?.beneficiary||{type:'family',name:'家庭保障账户'})};}
function recordMonthlyPayment(s,x){if(!x?.policy?.active||x.due<=0||s.month!==x.month||paidPolicy(s))return false;
 const r={month:x.month,policyId:x.policy.lifePolicyId,amount:x.due,atMonthEnd:true};meta(s).payments.push(r);(s.financeLedger??=[]).push({kind:'lifePremiumMonthEnd',...r});x.paid=true;return true;}
function finalize(s,x,settlement){if(s.lifeEnding||s.gameOver?.final||s.age<TERMS.deathAge||!x||s.month!==x.month+1)return false;
 const eligible=!!(x.policy?.active&&x.paid),amount=eligible?benefit(x.policy):0;
 s.lifeEnding={version:1,id:'natural:'+x.month,cause:'natural-age',age:s.age,month:s.month,insuredMonth:x.month,policy:x.policy,beneficiary:clone(x.beneficiary),eligible,amount,paid:true,reason:eligible?'已付有效保单，一次性记录受益保障':'无当月已付有效保单，不赔付',cashAfterSettlement:s.cash,assets:clone(s.assets||[]),debt:clone(s.debt||{}),loans:clone(s.loans||[]),settlementMonth:settlement?.month};
 s.gameOver={final:true,kind:'natural-death',reason:'90岁自然寿命结束',month:s.month};if(s.annualRun)s.annualRun.paused=true;return true;
}
const api={TERMS,fee,benefit,sync,credit,paid,policyPaidAmount,paidPolicy,raw,due,budget,covered,canBuy,pay,cancel,revoke,beneficiaryOptions,setBeneficiary,snapshot,recordMonthlyPayment,finalize};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.LifeInsuranceRules=api;
})(globalThis);
