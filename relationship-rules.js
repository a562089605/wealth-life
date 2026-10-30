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
  if(!Number.isFinite(s.energy)||s.energy<energy||!Number.isFinite(s.health)||s.health<30)return false;
  if(Object.values(s.treatments||{}).some(t=>t.paid&&t.status!=='completed'&&t.startMonth===s.month))return false;
  if(r.kind==='socialVisit'&&(!s.housing||s.housing==='unselected'))return false;
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
  q.people.forEach((p,i)=>{const before=p.relation;p.relation=clamp(p.relation+outcomes[i].gain);outcomes[i].appliedGain=Math.round((p.relation-before)*100)/100;markContact(s,p);});
  Object.assign(r,{status:'resolved',hours:q.hours,cost:q.cost,energy:q.energy,effects:{energy:s.energy-prior.energy,happiness:s.happiness-prior.happiness},outcomes});
  if(q.cost)(s.financeLedger??=[]).push({kind:r.kind,month:s.month,amount:q.cost,eventId:r.id});
  return r;
 }
 function helpEligible(s,p,kind,skill){
  if(!p?.id||!(s.people||[]).includes(p)||!Number.isFinite(p.relation)||p.relation<80)return false;
  if(kind==='life')return true;
  if(kind==='classmate')return !!s.study&&p.studyProjectId===s.study.id&&s.study.total-s.study.progress>=3;
  // Skill-themed work orders remain disabled until their map rules are confirmed.
  if(kind==='interest')return false;
  return false;
 }
 function acceptHelp(s,r){
  const p=(s.people||[]).find(p=>p.id===r?.personId);
  if(!r?.id||r.status!=='pending'||r.month!==s.month||init(s).help.some(x=>x.id===r.id&&x.month===r.month&&x.status==='resolved')||!helpEligible(s,p,r.kind,r.skill))return false;
  const before={energy:s.energy,stress:s.stress};
  s.energy=clamp(s.energy+2);s.stress=clamp(s.stress-(r.kind==='life'?3:2));
  if(r.kind==='life'){init(s).bonusHours??={};init(s).bonusHours[s.month]=(init(s).bonusHours[s.month]||0)+2;}
  if(r.kind==='classmate'){s.study.total-=3;}
  r.receipt={energy:s.energy-before.energy,stress:s.stress-before.stress,...(r.kind==='life'?{hours:2}:r.kind==='interest'?{xp:10,skill:r.skill}:{studyMonths:-3})};r.status='resolved';markContact(s,p);init(s).help.push({...r});return r;
 }
 function markContact(s,p){if(!(s.people||[]).includes(p))return false;p.lastContactMonth=s.month;return true;}
 function contacted(s,p,month){
  if(p.lastContactMonth===month||p.lastInteractionMonth===month||p.metMonth===month)return true;
  const d=init(s);
  if(d.actions.some(r=>r.status==='resolved'&&r.month===month&&r.people.includes(p.id))||d.help.some(r=>r.status==='resolved'&&r.month===month&&r.personId===p.id))return true;
  const receipts=[...(s.socialInteractions?.receipts||[]),...(s.socialMonth?[s.socialMonth]:[])];
  return receipts.some(r=>{if(r.month!==month)return false;if(r.personKey)return r.personKey===(p.id!=null?'id:'+p.id:'name:'+p.name);if(p.id!=null&&r.person===p.id)return true;return r.person===p.name&&(s.people||[]).filter(x=>x.name===p.name).length===1;});
 }
 function settleContacts(s,month){
  const d=init(s);d.contactSettlements??={};if(d.contactSettlements[month])return false;
  const rows=[];for(const p of s.people||[]){if(!Number.isFinite(p.relation))continue;const before=p.relation,kept=contacted(s,p,month);p.relation=clamp(before-(kept?0:1));rows.push({personId:p.id,before,after:p.relation,contacted:kept});}
  d.contactSettlements[month]=rows;return rows;
 }
 function failureGain(random=Math.random){return -(1+Math.min(2,Math.floor(random()*3)));}
 const skills=['摄影','电影创作','烹饪','音乐','园艺','语言学习'];
 function interestRows(p){
  const rows=[];
  if(p.interestProfile?.version===1){for(const [skill,xp]of Object.entries(p.interestProfile.skills||{}))if(skills.includes(skill)&&Number.isInteger(xp)&&xp>=0&&xp<=999)rows.push({skill,xp,level:Math.floor(xp/100)});return rows;}
  const old=p.hobbies??p.interests;
  const names=Array.isArray(old)?old:Object.keys(old||{});
  for(const skill of names){if(!skills.includes(skill))continue;const xp=p.hobbyXP?.[skill];rows.push({skill,xp:Number.isInteger(xp)&&xp>=0?xp:null,level:Number.isInteger(xp)&&xp>=0?Math.floor(xp/100):null});}return rows;
 }
 // Caller must supply confirmed background weights; no default uniform skill draw.
 function generateInterests(p,weights,random=Math.random){
  if(p.interestProfile||p.hobbies!=null||p.interests!=null)return false;
  let pool=Object.entries(weights||{}).filter(([name,w])=>skills.includes(name)&&Number.isFinite(w)&&w>0);
  if(pool.length<2)return false;
  const count=random()<.5?1:2,chosen={};
  for(let i=0;i<count;i++){let n=random()*pool.reduce((sum,[,w])=>sum+w,0),at=pool.length-1;for(let j=0;j<pool.length;j++){n-=pool[j][1];if(n<0){at=j;break;}}const [skill]=pool.splice(at,1)[0];chosen[skill]=Math.min(999,Math.floor(random()*1000));}
  p.interestProfile={version:1,skills:chosen};return p.interestProfile;
 }
 function helpWeight(p,skill){const row=interestRows(p).find(x=>x.skill===skill);return row?.xp!=null?1+row.xp/100:null;}
 const api={plans,init,resetOpeningContacts,hours,begin,check,execute,helpEligible,acceptHelp,markContact,contacted,settleContacts,failureGain,interestRows,generateInterests,helpWeight};
 if(typeof module!=='undefined')module.exports=api;else root.RelationshipRules=api;
})(globalThis);

