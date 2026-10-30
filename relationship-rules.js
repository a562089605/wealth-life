// Additive transaction history. Legacy social receipts remain untouched.
(function(root){
 const plans={socialCoffee:{cost:0,hours:1,min:0},socialWalk:{cost:0,hours:1,min:0},socialMeal:{cost:45,hours:2,min:21},socialVisit:{cost:30,hours:3,min:51}};
 const clamp=n=>Math.max(0,Math.min(100,n));
 function init(s){return s.relationshipV1??={sequence:0,actions:[],help:[],units:[]};}
 function resetOpeningContacts(s){const d=init(s);if(s.month!==0||d.openingContactsReset)return false;s.people=[];for(const u of d.units){delete u.managerId;delete u.candidate;}d.openingContactsReset=true;return true;}
 function hours(s){return (s.relationshipV1?.actions||[]).filter(x=>x.month===s.month&&x.status==='resolved').reduce((n,x)=>n+x.hours,0);}
 function begin(s,kind,people){if(!plans[kind])return null;const d=init(s),r={id:'relationship-'+(++d.sequence),month:s.month,kind,people:[...people],status:'pending'};d.actions.push(r);return r;}
 function check(s,r,{free,blocked=false}={}){
  if(!r||!init(s).actions.includes(r)||r.status!=='pending'||r.month!==s.month||blocked)return false;
  const plan=plans[r.kind],people=r.people.map(id=>(s.people||[]).find(p=>p.id===id));
  if(!plan||!people.length||people.length>(r.kind==='socialVisit'?5:1)||new Set(r.people).size!==people.length||people.some(p=>!p||!Number.isFinite(p.relation)||p.relation<plan.min))return false;
  const n=people.length,cost=plan.cost*(r.kind==='socialVisit'?n:1),energy=2*n;
  if(!Number.isFinite(free)||free<plan.hours||!Number.isFinite(s.cash)||s.cash<cost)return false;
  if(r.kind==='socialVisit'&&(!s.housing||s.housing==='unselected'||s.energy<energy))return false;
  return {people,cost,energy,hours:plan.hours};
 }
 function execute(s,r,context){
  const q=check(s,r,context);if(!q)return false;
  // Roll only after every member and resource has passed validation.
  const outcomes=q.people.map(p=>context.outcome(p));
  if(outcomes.some(o=>!o||!Number.isFinite(o.gain)||!Number.isFinite(o.happiness)))return false;
  const prior={energy:s.energy,happiness:s.happiness};
  s.cash=Math.round((s.cash-q.cost)*100)/100;s.energy=clamp(s.energy-q.energy);
  s.happiness=clamp(s.happiness+outcomes.reduce((n,o)=>n+o.happiness,0));
  q.people.forEach((p,i)=>{const before=p.relation;p.relation=clamp(p.relation+outcomes[i].gain);outcomes[i].appliedGain=Math.round((p.relation-before)*100)/100;});
  Object.assign(r,{status:'resolved',hours:q.hours,cost:q.cost,energy:q.energy,effects:{energy:s.energy-prior.energy,happiness:s.happiness-prior.happiness},outcomes});
  if(q.cost)(s.financeLedger??=[]).push({kind:r.kind,month:s.month,amount:q.cost,eventId:r.id});
  return r;
 }
 function helpEligible(s,p,kind,skill){
  if(!p?.id||!(s.people||[]).includes(p)||!Number.isFinite(p.relation)||p.relation<=80)return false;
  if(init(s).help.some(r=>r.personId===p.id&&r.kind===kind&&r.status==='resolved'))return false;
  if(s.mapCards?.permanent?.['classmate:'+p.id]&&kind==='classmate')return false;
  if(kind==='life')return true;
  if(kind==='classmate')return !!s.study&&p.studyProjectId===s.study.id&&s.study.total-s.study.progress>=3;
  if(kind==='interest')return !!skill&&Object.prototype.hasOwnProperty.call(s.hobbies||{},skill)&&(Array.isArray(p.hobbies||p.interests)?(p.hobbies||p.interests).includes(skill):!!(p.hobbies||p.interests||{})[skill]);
  return false;
 }
 function acceptHelp(s,r){
  const p=(s.people||[]).find(p=>p.id===r?.personId);
  if(!r||r.status!=='pending'||r.month!==s.month||!helpEligible(s,p,r.kind,r.skill))return false;
  const before={energy:s.energy,stress:s.stress};
  s.energy=clamp(s.energy+2);s.stress=clamp(s.stress-(r.kind==='life'?3:2));
  if(r.kind==='life'){init(s).bonusHours??={};init(s).bonusHours[s.month]=(init(s).bonusHours[s.month]||0)+2;}
  if(r.kind==='interest'){s.hobbyXP??={};s.hobbyXP[r.skill]=(s.hobbyXP[r.skill]||0)+10;}
  if(r.kind==='classmate'){s.study.total-=3;}
  r.receipt={energy:s.energy-before.energy,stress:s.stress-before.stress,...(r.kind==='life'?{hours:2}:r.kind==='interest'?{xp:10,skill:r.skill}:{studyMonths:-3})};r.status='resolved';init(s).help.push({...r});return r;
 }
 const api={plans,init,resetOpeningContacts,hours,begin,check,execute,helpEligible,acceptHelp};
 if(typeof module!=='undefined')module.exports=api;else root.RelationshipRules=api;
})(globalThis);
