// Approved fallback: only when both original housing choices are blocked and
// there are no employed work hours to exchange for leave. Never changes pay.
(function(root){
 function plan(s,pool,key,r,index,free,reserve=0,rates={}){
  const c=pool.cards.find(c=>c.id===r?.cardId),o=c?.choices[index];
  if(!o||r.status!=='pending'||r.month!==s.month||s[key]?.records[r.month]!==r)return null;
  if(!Number.isFinite(free)||free<0||!Number.isFinite(reserve)||reserve<0)return null;
  if(rates.working&&rates.availableWorkHours>0)return null;
  if(!c.choices.every((_,i)=>pool.missing(s,r,i,free,reserve).length))return null;
  const need=pool.requiredHours?.(r,index)??o.hours,used=Math.min(need,Math.max(0,free-reserve)),hours=need-used;
  if(!(hours>0))return null;
  return {hours,used,cost:Math.max(0,-(o.cash||0)),id:key+':'+r.month+':'+r.cardId};
 }
 function resolve(s,pool,key,month,id,index,free,reserve,rates){
  const r=s[key]?.records[month],p=plan(s,pool,key,r,index,free,reserve,rates);
  if(!p||r.cardId!==id||s.housingTimeDebt?.entries?.[p.id])return false;
  // Keep the current pet-care reserve intact; do not create extra borrowed time
  // for care that was already underfunded before this choice.
  if(!pool.resolve(s,month,id,index,free+p.hours,Math.min(reserve,free)))return false;
  const ledger=s.housingTimeDebt??={version:1,entries:{}};
  ledger.entries[p.id]={id:p.id,source:key,cardId:id,month,hours:p.hours,remaining:p.hours,allocations:[]};
  r.deferredTime={id:p.id,hours:p.hours,used:p.used};return true;
 }
 function credited(s){return Object.values(s.housingTimeDebt?.entries||{}).filter(e=>e.month===s.month).reduce((n,e)=>n+e.hours,0);}
 function allocate(s,{month=s.month,available,recovery=false}){
  if(!Number.isInteger(month)||month<0||!Number.isFinite(available)||available<0||typeof recovery!=='boolean')throw Error('Invalid housing time allocation');
  const entries=Object.values(s.housingTimeDebt?.entries||{});
  let applied=entries.reduce((n,e)=>n+e.allocations.filter(a=>a.month===month).reduce((v,a)=>v+a.hours,0),0);
  if(recovery)return applied;
  let capacity=Math.max(0,available-applied);
  for(const e of entries.sort((a,b)=>a.month-b.month||a.id.localeCompare(b.id))){
   if(e.month>=month||!(e.remaining>0)||!capacity)continue;
   const hours=Math.min(e.remaining,capacity),prior=e.allocations.find(a=>a.month===month);
   if(prior)prior.hours+=hours;else e.allocations.push({month,hours});
   e.remaining-=hours;capacity-=hours;applied+=hours;
  }
  return applied;
 }
 const api={plan,resolve,credited,allocate};root.HousingTimeDebt=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
