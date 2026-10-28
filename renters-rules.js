// Confirmed fictional game contract; isolated from legacy policies and player attributes.
(function(root){'use strict';
const PLANS=Object.freeze({basic:Object.freeze({name:'基础租客险',monthly:20,coverage:.8,cap:2000}),full:Object.freeze({name:'全赔租客险',monthly:30,coverage:1,cap:null})});
const EVENTS=Object.freeze([{id:'fire',name:'火灾',loss:3000,chance:.002},{id:'water',name:'漏水',loss:800,chance:.01},{id:'theft',name:'入室盗窃',loss:1500,chance:.005}].map(Object.freeze));
const money=n=>Math.round((Number(n)||0)*100)/100;
function renting(s){return ['shared','studio','rent1','rented','rent'].includes(s.housing)||!!(s.housing&&s.housing!=='own'&&s.housing!=='family'&&s.housing!=='unselected'&&s.housingLease?.key===s.housing&&s.housingLease.depositHeld>0);}
function data(s){return s.rentersInsurance??=( {version:1,sequence:0,payments:[],history:[]} );}
function sync(s){const d=s.rentersInsurance;if(!d)return;const p=d.policy;
 if(p?.active&&!renting(s)){p.active=false;p.endedMonth=s.month;p.endedReason='housing';delete d.pending;}
 if(d.pending&&d.pending.effectiveMonth<=s.month){const x=d.pending;if(p?.active){if(x.plan===null){p.active=false;p.endedMonth=s.month;p.endedReason='cancel';}else if(PLANS[x.plan])p.plan=x.plan;}delete d.pending;}
 if(p?.active)p.housing=s.housing;
}
function paid(s){return money((s.rentersInsurance?.payments||[]).filter(p=>p.month===s.month).reduce((n,p)=>n+p.amount,0));}
function due(s){const p=s.rentersInsurance?.policy;return p?.active&&renting(s)&&p.paidMonth!==s.month?(PLANS[p.plan]?.monthly||0):0;}
function budget(s){return money(paid(s)+due(s));}
function covered(s){const p=s.rentersInsurance?.policy;return !!(renting(s)&&p?.active&&PLANS[p.plan]&&p.paidMonth===s.month);}
function pay(s,plan){sync(s);if(!renting(s))return false;let d=s.rentersInsurance,p=d?.policy;const fresh=!p?.active;
 if(fresh&&!PLANS[plan])return false;if(!fresh&&p.paidMonth===s.month)return false;
 const selected=fresh?plan:p.plan,amount=PLANS[selected]?.monthly;if(!amount||!Number.isFinite(s.cash)||s.cash<amount)return false;
 d=data(s);if(fresh){if(p)d.history.push({...p});p=d.policy={id:++d.sequence,plan:selected,active:true,housing:s.housing,startMonth:s.month};delete d.pending;}
 s.cash=money(s.cash-amount);p.paidMonth=s.month;const receipt={month:s.month,policyId:p.id,plan:selected,amount};d.payments.push(receipt);(s.financeLedger??=[]).push({kind:'rentersPremium',...receipt});return true;
}
function schedule(s,plan){sync(s);const d=s.rentersInsurance,p=d?.policy;if(!p?.active||!(plan===null||PLANS[plan]))return false;
 if(plan===p.plan){delete d.pending;return true;}d.pending={plan,effectiveMonth:s.month+1};return true;
}
function revoke(s){sync(s);const d=s.rentersInsurance;if(!d?.pending||d.pending.effectiveMonth<=s.month)return false;delete d.pending;return true;}
function indemnity(plan,loss){const p=PLANS[plan];return p?money(Math.min(loss*p.coverage,p.cap===null?Infinity:p.cap)):0;}
function assess(s,random=Math.random){
 if(s.rentersIncidents?.[s.month])return s.rentersIncidents[s.month];sync(s);
 const eligible=renting(s),p=covered(s)?{...s.rentersInsurance.policy}:null;
 const batch={month:s.month,housing:s.housing,eligible,policy:p,rolls:[],items:[],total:0,paid:false};
 if(eligible)for(const e of EVENTS){const roll=random();batch.rolls.push({id:e.id,value:roll});if(roll<e.chance){const payout=indemnity(p?.plan,e.loss);batch.items.push({id:s.month+':'+e.id,name:e.name,loss:e.loss,payout,due:money(e.loss-payout)});}}
 batch.total=money(batch.items.reduce((n,e)=>n+e.due,0));if(!batch.items.length)batch.paid=true;
 (s.rentersIncidents??={})[s.month]=batch;return batch;
}
function settle(s){const b=s.rentersIncidents?.[s.month];if(!b||b.paid||!Number.isFinite(s.cash)||(b.total>0&&s.cash<b.total))return false;
 s.cash=money(s.cash-b.total);b.paid=true;(s.financeLedger??=[]).push({kind:'rentersIncidentPayment',month:s.month,amount:b.total,loss:b.items.reduce((n,e)=>n+e.loss,0),payout:b.items.reduce((n,e)=>n+e.payout,0),ids:b.items.map(e=>e.id)});return true;
}
const api={PLANS,EVENTS,renting,sync,paid,due,budget,covered,pay,schedule,revoke,indemnity,assess,settle};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.RentersRules=api;
})(globalThis);
