// Confirmed fictional vehicle contract; existing car costs and attributes are untouched.
(function(root){'use strict';
const PLANS=Object.freeze({basic:Object.freeze({name:'基础车险',monthly:100,coverage:.8}),full:Object.freeze({name:'全赔车险',monthly:165,coverage:1})});
const EVENT=Object.freeze({name:'交通事故车辆维修',chance:.02,loss:5000});
const money=n=>Math.round((Number(n)||0)*100)/100,clone=x=>JSON.parse(JSON.stringify(x));
function meta(s){return s.autoInsurance??={version:1,sequence:0,payments:[],history:[]};}
function fee(p){return p?.monthly!=null&&Number.isFinite(Number(p.monthly))?Math.max(0,Number(p.monthly)):165;}
function sync(s){const p=s.insurance?.auto;if(!p)return;const m=meta(s);
 if(!p.autoPolicyId){p.autoPolicyId=++m.sequence;if(!PLANS[p.autoPlan])p.autoPlan='full';const r=s.monthlyPayments,lifeCredit=s.lifeInsurance?.opening?.month===s.month?s.lifeInsurance.opening.credit:0;
  const other=Object.entries(s.insurance||{}).reduce((n,[k,x])=>n+(k!=='auto'&&k!=='life'&&x?.active?(Number(x.monthly)||0):0),0);
  const receipt=!!(p.active&&p.monthly!=null&&r?.month===s.month),credit=receipt?money(Math.min(fee(p),Math.max(0,Number(r.premiums||0)-other-lifeCredit))):0;
  m.opening={month:s.month,policyId:p.autoPolicyId,credit,paid:receipt&&credit+.005>=fee(p)};
 }
 if(p.monthly==null)p.monthly=165;
 if(m.pending?.effectiveMonth<=s.month){const x=m.pending;if(p.active){if(x.plan===null)p.active=false;else if(PLANS[x.plan]){p.autoPlan=x.plan;p.monthly=PLANS[x.plan].monthly;}}delete m.pending;}
}
function credit(s){const o=s.autoInsurance?.opening;return o?.month===s.month?o.credit:0;}
function paid(s){return money(credit(s)+(s.autoInsurance?.payments||[]).filter(x=>x.month===s.month).reduce((n,x)=>n+x.amount,0));}
function policyPaid(s){const p=s.insurance?.auto,o=s.autoInsurance?.opening;if(!p)return false;const rows=(s.autoInsurance?.payments||[]).filter(x=>x.month===s.month&&x.policyId===p.autoPolicyId),opening=o?.month===s.month&&o.policyId===p.autoPolicyId;return !!((opening&&o.paid||rows.length)&&money((opening?o.credit:0)+rows.reduce((n,x)=>n+x.amount,0))+.005>=fee(p));}
function raw(s){return s.insurance?.auto?.active?fee(s.insurance.auto):0;}
function due(s){const p=s.insurance?.auto;if(!p?.active||policyPaid(s))return 0;const o=s.autoInsurance?.opening,partial=o?.month===s.month&&o.policyId===p.autoPolicyId?o.credit:0;return money(Math.max(0,fee(p)-partial));}
function budget(s){return money(paid(s)+due(s));}
function covered(s){return !!(s.carOwned&&s.insurance?.auto?.active&&policyPaid(s));}
function pay(s,plan){sync(s);if(!s.carOwned||s.gameOver)return false;let p=s.insurance?.auto;const fresh=!p?.active;if(fresh&&!PLANS[plan]||!fresh&&policyPaid(s))return false;const amount=fresh?PLANS[plan].monthly:due(s);if(!Number.isFinite(s.cash)||s.cash<amount)return false;const m=meta(s);
 if(fresh){if(p)m.history.push(clone(p));s.insurance??={};p=s.insurance.auto={name:'汽车保险',active:true,monthly:amount,autoPlan:plan,autoPolicyId:++m.sequence,startMonth:s.month};delete m.pending;delete s.pendingInsuranceChanges?.auto;}
 s.cash=money(s.cash-amount);const r={month:s.month,policyId:p.autoPolicyId,amount};m.payments.push(r);(s.financeLedger??=[]).push({kind:'autoPremium',...r});return true;
}
function schedule(s,plan){sync(s);if(s.gameOver||!s.insurance?.auto?.active||!(plan===null||PLANS[plan]))return false;delete s.pendingInsuranceChanges?.auto;const m=meta(s);if(plan===s.insurance.auto.autoPlan){delete m.pending;return true;}m.pending={plan,effectiveMonth:s.month+1};return true;}
function revoke(s){sync(s);if(s.gameOver)return false;const m=s.autoInsurance,x=m?.pending||s.pendingInsuranceChanges?.auto;if(!x||x.effectiveMonth<=s.month)return false;if(m)delete m.pending;delete s.pendingInsuranceChanges?.auto;return true;}
function assess(s,random=Math.random){if(s.autoIncidents?.[s.month])return s.autoIncidents[s.month];sync(s);const eligible=!!s.carOwned,p=covered(s)?clone(s.insurance.auto):null,b={month:s.month,eligible,vehicleValue:s.carValue,policy:p,roll:null,items:[],total:0,paid:false};if(eligible){b.roll=random();if(b.roll<EVENT.chance){const payout=money(EVENT.loss*(PLANS[p?.autoPlan]?.coverage||0));b.items.push({id:s.month+':auto',name:EVENT.name,loss:EVENT.loss,payout,due:money(EVENT.loss-payout)});}}b.total=money(b.items.reduce((n,x)=>n+x.due,0));if(!b.items.length)b.paid=true;(s.autoIncidents??={})[s.month]=b;return b;}
function combined(s){const batches=[s.rentersIncidents?.[s.month],s.autoIncidents?.[s.month]].filter(b=>b?.items.length);return {batches,items:batches.flatMap(b=>b.items),total:money(batches.filter(b=>!b.paid).reduce((n,b)=>n+b.total,0)),paid:batches.every(b=>b.paid)};}
function settleCombined(s){const q=combined(s);if(!q.batches.length||q.paid||!Number.isFinite(s.cash)||s.cash<q.total)return false;s.cash=money(s.cash-q.total);for(const b of q.batches.filter(b=>!b.paid)){b.paid=true;(s.financeLedger??=[]).push({kind:b===s.autoIncidents?.[s.month]?'autoIncidentPayment':'rentersIncidentPayment',month:s.month,amount:b.total,loss:b.items.reduce((n,x)=>n+x.loss,0),payout:b.items.reduce((n,x)=>n+x.payout,0),ids:b.items.map(x=>x.id)});}return true;}
const api={PLANS,EVENT,fee,sync,credit,paid,policyPaid,raw,due,budget,covered,pay,schedule,revoke,assess,combined,settleCombined};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.AutoInsuranceRules=api;
})(globalThis);
