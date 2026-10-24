// Pure state helpers: caller owns save and the monthly settlement UI.
// Absolute zero-based month indices; never infer recovery from health alone.
function eventTimeLedger(s){return s.eventTimeLedger??={version:1,events:{},months:{}}}
function recordForcedEventTime(s,{id,month,hours,available}){
 if(!id||!Number.isInteger(month)||month<0||!Number.isFinite(hours)||hours<0||!Number.isFinite(available)||available<0)throw Error('Invalid forced time entry');
 const l=eventTimeLedger(s),key=month+':'+id;if(l.events[key])return l.events[key];
 const used=Math.min(available,hours),debt=hours-used;
 return l.events[key]={id,month,hours,used,debt,remaining:debt,allocations:[],returnRequired:debt>0||hours===available};
}
function allocateEventTimeDebt(s,{month,baseHours,recovery}){
 if(!Number.isInteger(month)||month<0||!Number.isFinite(baseHours)||baseHours<0||typeof recovery!=='boolean')throw Error('Invalid month time allocation');
 const l=eventTimeLedger(s),prior=l.months[month];if(prior)return prior;
 let capacity=baseHours,applied=0;
 if(!recovery){
 // Reject atomically if debt exceeds the normal month; policy is not confirmed.
 const due=Object.values(l.events).filter(e=>e.month<month).reduce((n,e)=>n+e.remaining,0);
 if(due>capacity)return {month,blocked:true,reason:'debt-exceeds-normal-month',due,baseHours};
 for(const e of Object.values(l.events).sort((a,b)=>a.month-b.month||a.id.localeCompare(b.id))){if(e.month>=month||!e.remaining)continue;const n=e.remaining;e.remaining=0;e.allocations.push({month,hours:n});applied+=n;capacity-=n;}}
 return l.months[month]={month,recovery,baseHours,applied,remainingHours:recovery?0:capacity};
}
if(typeof module!=='undefined')module.exports={recordForcedEventTime,allocateEventTimeDebt};
