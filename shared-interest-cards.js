// Saved shared-interest events only. No natural map trigger or trigger probability.
(function(root){'use strict';
 const D=root.SharedInterestCardData||(typeof require==='function'?require('./shared-interest-card-data'):null);
 const S=root.SharedInterestSelection||(typeof require==='function'?require('./shared-interest-selection'):null);
 const H=root.HobbyLearning||(typeof require==='function'?require('./hobby-learning'):null);
 const cards=Object.fromEntries(D.cards.map(c=>[c.id,c])),copy=x=>JSON.parse(JSON.stringify(x)),clamp=x=>Math.max(0,Math.min(100,x));
 const current=s=>s.town?.movement?.sharedInterestCard;
 const hours=s=>(s.sharedInterestCards?.receipts||[]).filter(r=>r.month===s.month).reduce((n,r)=>n+r.effects.hours,0);
 function data(s){return s.sharedInterestCards??={version:1,used:[],receipts:[]};}
 function atomic(s,fn,save){const before=copy(s);try{const result=fn();if(save()===false)throw Error('save');return result;}catch(e){for(const k of Object.keys(s))delete s[k];Object.assign(s,before);return {ok:false,reason:'save'};}}
 function eligible(s,kind,pid){return S.groups(s).some(g=>g.people.some(p=>p.personId===pid&&p.cards.some(c=>c.id===kind)));}
 function saveCard(s,kind,pid,moveId,opts={}){
  const m=s.town?.movement,c=cards[kind],p=s.people?.find(p=>p.id===pid);
  if(!m||m.id!==moveId||m.month!==s.month||m.resolved||m.opened||m.payExpected||m.sharedInterestCard||m.relationshipLifeCard||s.petMapEvents?.records?.[s.month+':'+moveId]||!c||!p||!eligible(s,kind,pid)||typeof opts.save!=='function')return {ok:false,reason:'stale'};
  return atomic(s,()=>{
   const r={version:1,id:'shared-interest:'+s.month+':'+moveId+':'+kind,kind,hobby:c.hobby,personId:pid,personName:p.name,month:s.month,moveId,status:'pending',options:copy(c.options)};
   if(c.followup){const n=(opts.random||Math.random)();if(!Number.isFinite(n)||n<0||n>=1)throw Error('random');r.lockedOutcome=copy(c.followup.outcomes[Math.floor(n*3)]);}
   data(s).used.push({id:r.id,personId:pid,kind,month:s.month});m.sharedInterestCard=r;m.opened=true;return {ok:true,record:r};
  },opts.save);
 }
 function quote(s,r,index,opts={}){
  const m=s.town?.movement,p=s.people?.find(p=>p.id===r?.personId),fail=reason=>({ok:false,reason});
  if(!r||m?.sharedInterestCard!==r||m.resolved||r.month!==s.month||r.moveId!==m.id||!p||!Number.isInteger(index)||!['pending','followup'].includes(r.status))return fail('stale');
  let q;if(r.status==='followup'){if(index!==0||!r.lockedOutcome)return fail('stale');q={label:'继续',effects:r.lockedOutcome.effects};}else q=r.options?.[index];
  if(!q)return fail('stale');
  if(opts.recovery||s.requiredIncident||s.gameOver?.final||!Number.isFinite(s.health)||s.health<30)return fail('recovery');
  const effects={hours:0,cash:0,energy:0,xp:0,happiness:0,stress:0,intimacy:0,...q.effects};
  if(!Object.values(effects).every(Number.isFinite)||effects.hours<0||effects.xp<0)return fail('quote');
  // Reserve enough resources for the already-locked second stage before accepting B.
  const followup=r.status==='pending'&&index===cards[r.kind]?.followup?.choice;
  if(followup&&!r.lockedOutcome)return fail('stale');
  const next=followup?r.lockedOutcome.effects:{},requiredHours=effects.hours+(next.hours||0),requiredCash=effects.cash+(next.cash||0),requiredEnergy=effects.energy+(next.energy||0);
  if(!Number.isFinite(s.cash)||s.cash+requiredCash<0)return fail('funds');
  if(!Number.isFinite(opts.free)||opts.free<requiredHours||(requiredHours>0&&(!Number.isFinite(opts.reserve??0)||opts.free-requiredHours<(opts.reserve||0))))return fail('time');
  if(!Number.isFinite(s.energy)||s.energy+requiredEnergy<0)return fail('energy');
  effects.xp=Math.min(effects.xp,Math.max(0,800-H.xp(s,r.hobby)));
  return {ok:true,label:q.label,effects,followup};
 }
 function confirm(s,id,index,expectedPhase,opts={}){
  const r=current(s),m=s.town?.movement;
  if(!r||r.id!==id||r.status!==expectedPhase||typeof opts.save!=='function')return {ok:false,reason:'stale'};
  const q=quote(s,r,index,opts);if(!q.ok)return q;
  const receiptId=r.id+':'+r.status;
  if(s.sharedInterestCards?.receipts?.some(x=>x.id===receiptId))return {ok:false,reason:'stale'};
  return atomic(s,()=>{
   const p=s.people.find(p=>p.id===r.personId),e=q.effects,d=data(s),prior=p.relation;
   s.cash=Math.round((s.cash+e.cash)*100)/100;
   for(const k of ['energy','happiness','stress'])s[k]=clamp(s[k]+e[k]);
   p.relation=clamp((p.relation||0)+e.intimacy);if(e.intimacy)p.lastContactMonth=s.month;
   if(e.xp){const beforeXP=H.xp(s,r.hobby);s.hobbyLearning??={version:1,xp:{},sequence:0,receipts:[]};s.hobbyLearning.xp??={};s.hobbyLearning.xp[r.hobby]=beforeXP+e.xp;}
   const receipt={id:receiptId,eventId:r.id,month:s.month,kind:r.kind,personId:r.personId,phase:r.status,choice:index,effects:copy(e),appliedIntimacy:p.relation-prior};
   d.receipts.push(receipt);
   if(e.cash)(s.financeLedger??=[]).push({id:receiptId,kind:e.cash>0?'sharedInterestIncome':'sharedInterestExpense',eventId:r.id,month:s.month,amount:Math.abs(e.cash),personId:p.id});
   if(r.status==='pending')r.choice=index;
   if(q.followup)r.status='followup';else{r.status='resolved';m.resolved=true;m.completedMonth=s.month;(s.town.history??=[]).push({id:m.id,to:m.to,month:s.month,type:'shared-interest',sharedInterestCard:r.kind});}
   return {ok:true,receipt,followup:q.followup};
  },opts.save);
 }
 const api={cards,current,hours,eligible,saveCard,quote,confirm};root.SharedInterestCards=api;
 if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
