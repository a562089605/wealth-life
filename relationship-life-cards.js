// Confirmed relationship cards: explicit saved map records only. No natural draw/weight.
(function(root){'use strict';
 const D=root.RelationshipCardData||(typeof require==='function'?require('./relationship-card-data'):null);
 const copy=x=>JSON.parse(JSON.stringify(x)),clamp=n=>Math.max(0,Math.min(100,n));
 const cards=Object.fromEntries(D.cards.map(c=>[c.id,c]));
 const spec={...cards['manager-experience'],art:'assets/relationships/manager-experience-20261110.webp',monthlyLimit:1}; // v1 frozen-record compatibility
 const role=p=>root.RelationshipHomeRules?root.RelationshipHomeRules.role(p):p.relationshipRole==='manager'?'经理':p.relationshipRole==='landlord'?'房东':p.origin==='pet-social'?'宠友':p.status;
 function data(s){const d=s.relationshipLife??={version:2,hours:{},receipts:[],used:[],courses:{}};d.hours??={};d.receipts??=[];d.used??=[];d.courses??={};return d;}
 const project=s=>s.study&&(s.study.id||s.study.receipt?.id);
 const coffeeRole=s=>['咖啡师 Barista','咖啡师','Barista','值班主管 Shift Lead','值班主管','Shift Lead','店长','店长 Store Manager','Store Manager','在店管理合伙人','管理合伙人','Managing Partner'].includes(s.job);
 const bossLabel=s=>/店长|Store Manager|合伙人|Partner/i.test(s.job||'')?'老板':'经理';
 function payQuote(s,c){const monthly=Number(s.salary),weekly=Number(s.workHoursPerWeek)||40;if(!Number.isFinite(monthly)||monthly<=0||weekly<=0)throw Error('invalid salary');const money=n=>Math.round(n*100)/100,hourly=monthly/(52/12*weekly),wages=money(hourly*(c.payMode==='pickup'?2:40)*1.5),month=s.month%12+1,seasonTips=month===9?225:month>=11?450:300,multiplier=/值班主管|Shift Lead/i.test(s.job||'')?1.3:1,tips=c.payMode==='shifts'?money(seasonTips/23*(3*1.5+2)*multiplier):0;return {cash:money(wages+tips),wages,tips,payContext:{monthly,weekly,calendarMonth:month}};}
 const contactPet=s=>(s.pets||[]).find(p=>['dog','cat'].includes(p.species)||['狗','柯基','猫','银渐层'].includes(p.type));
 function used(s,pid,kind){return (s.relationshipLife?.used||[]).some(r=>r.personId===pid&&r.kind===kind)||(s.relationshipLife?.receipts||[]).some(r=>r.personId===pid&&r.kind===kind);}
 function eligible(s,p,c,opts={}){
  if(!p||!c||role(p)!==c.role||!Number.isFinite(p.relation)||p.relation<c.minIntimacy||used(s,p.id,c.id))return false;
  if(c.role==='教师'&&(!s.study||s.study.paused||p.studyProjectId!==project(s)))return false;
  if(c.role==='同学'&&(!s.study||s.study.paused||!project(s)))return false;
  if(c.role==='经理'&&(!s.job||s.retired||s.unemployedMonths||p.id!==s.relationshipHome?.currentManagerId))return false;
  if(c.coffeeOnly&&!coffeeRole(s))return false;
  if(c.contactPets&&!contactPet(s))return false;
  if(c.currentLandlord&&(!['shared','studio','rent1'].includes(s.housing)||p.id!==s.relationshipHome?.landlordId))return false;
  // Equipment must be verified by the caller; the 50/50 outcome is locked in the saved record.
  if(c.aircon&&opts.hasAirConditioner!==true)return false;
  return true;
 }
 function atomic(s,fn,save){const before=copy(s);try{const result=fn();if(result===false||save()===false)throw Error('save');return result;}catch(e){for(const k of Object.keys(s))delete s[k];Object.assign(s,before);return false;}}
 function makeStudent(s,id,courseId){const gender=Math.random()<.5?'female':'male',names=gender==='female'?['林悦','陈曦','许宁','苏晴','江月']:['林泽','陈远','许言','周明','江川'];let name=names.find(n=>!s.people?.some(p=>p.name===n))||'同学'+((s.people?.length||0)+1);return {id,name,gender,origin:'school',relationshipRole:'classmate',status:'同学',job:'学生',education:s.education,studyProjectId:courseId,relation:10,metMonth:s.month,lastContactMonth:s.month,city:s.city};}
 function reserveLegacy(s){const r=s.town?.movement?.relationshipLifeCard;if(r?.version===1&&['pending','followup'].includes(r.status)&&!used(s,r.personId,r.kind))data(s).used.push({id:r.id,personId:r.personId,kind:r.kind,month:r.month});}
 function enroll(s,study){const id=study.id||study.receipt?.id;if(!id)throw Error('missing study identity');const d=data(s);if(d.courses[id])return;s.people??=[];const pid='relationship-classmate-'+id;const p=s.people.find(p=>p.id===pid)||makeStudent(s,pid,id);if(!s.people.includes(p))s.people.push(p);d.courses[id]=p.id;}
 // Legacy call remains a pure v1 quote builder for existing integrations; new code must use saveCard.
 function create(s,pid,moveId){const c=cards['manager-experience'],p=s.people?.find(p=>p.id===pid);if(!eligible(s,p,c))return null;return {id:s.month+':'+moveId+':'+c.id,version:1,kind:c.id,month:s.month,moveId,personId:pid,personName:p.name,status:'pending',quotes:copy(c.options),art:spec.art};}
 function saveCard(s,kind,pid,moveId,opts){const m=s.town?.movement,c=cards[kind],p=s.people?.find(p=>p.id===pid);if(!m||m.id!==moveId||m.resolved||m.relationshipLifeCard||m.month!==s.month||m.opened||s.petMapEvents?.records?.[s.month+':'+moveId]||!eligible(s,p,c,opts)||typeof opts?.save!=='function')return null;
  return atomic(s,()=>{const r={id:s.month+':'+moveId+':'+kind,version:2,kind,month:s.month,moveId,personId:pid,personName:p.name,status:'pending',quotes:copy(c.options),art:c.art,title:c.title,boxes:copy(c.boxes),role:c.role,studyProjectId:['同学','教师'].includes(c.role)?project(s):null,leaseKey:c.currentLandlord?s.relationshipHome?.leaseKey:null};
   if(c.role==='教师')r.role=p.teacherLabel||'老师';
   if(c.payMode)Object.assign(r.quotes[0],payQuote(s,c));
   if(c.coffeeOnly){r.sourceJob=s.job;r.role=bossLabel(s);}
   if(c.contactPets){const pet=contactPet(s);r.petIdentity=JSON.stringify([pet.careId,pet.id,pet.species,pet.type,pet.adoptMonth]);}
   if(c.aircon){const random=opts.random||Math.random;r.airconOutcome=['success','failure'].includes(opts.airconOutcome)?opts.airconOutcome:random()<.5?'success':'failure';}
   if(c.id==='classmate-library')r.newClassmate=makeStudent(s,'relationship-library-'+r.id,r.studyProjectId);
   data(s).used.push({id:r.id,personId:pid,kind,month:s.month});m.relationshipLifeCard=r;m.opened=true;return r;},opts.save)||null;
 }
 function apply(s,p,q){s.cash=Math.round((s.cash+(q.cash||0))*100)/100;for(const k of ['energy','happiness','stress'])s[k]=clamp(s[k]+(q[k]||0));p.relation=clamp(p.relation+(q.intimacy||0));p.lastContactMonth=s.month;if(q.careCoupons)s.petCareCoupons=(s.petCareCoupons||0)+q.careCoupons;}
 function finishMove(s,m,r){r.status='resolved';m.resolved=true;m.completedMonth=s.month;(s.town.history??=[]).push({id:m.id,to:m.to,month:s.month,type:'community',relationshipCard:r.kind});}
 function confirm(s,id,index,opts){const m=s.town?.movement,r=m?.relationshipLifeCard,p=s.people?.find(p=>p.id===r?.personId),q=r?.quotes?.[index];
  if(!r||!m||m.resolved||r.id!==id||!['pending','followup'].includes(r.status)||r.month!==s.month||r.moveId!==m.id||!p||!Number.isInteger(index)||!q||!Number.isFinite(opts.free)||opts.free<0||typeof opts.save!=='function')return {ok:false,reason:'stale'};
  if(r.status==='followup')return {ok:false,reason:'followup'};
  if(![q.hours,q.energy,q.intimacy,q.happiness,q.stress,q.cash].every(Number.isFinite)||q.hours<0)return {ok:false,reason:'quote'};
  if(q.studyMonths&&root.EducationPlans?.current(s.study)&&s.cash<root.EducationPlans.balance(s.study)-q.cash)return {ok:false,reason:'funds'};
  if(s.cash+q.cash<0)return {ok:false,reason:'funds'};
  const def=cards[r.kind];
  if(def?.strictResources&&opts.free<q.hours)return {ok:false,reason:'time'};
  if(s.energy+q.energy<0)return {ok:false,reason:'energy'};
  if(def?.coffeeOnly&&(!coffeeRole(s)||s.retired||s.unemployedMonths||p.id!==s.relationshipHome?.currentManagerId||r.sourceJob&&r.sourceJob!==s.job))return {ok:false,reason:'job'};
  if(def?.contactPets&&!(s.pets||[]).some(p=>JSON.stringify([p.careId,p.id,p.species,p.type,p.adoptMonth])===r.petIdentity))return {ok:false,reason:'pet'};
  if(r.version===2){if(r.studyProjectId&&project(s)!==r.studyProjectId)return {ok:false,reason:'study'};if(r.leaseKey&&s.relationshipHome?.leaseKey!==r.leaseKey)return {ok:false,reason:'lease'};}
  const result=atomic(s,()=>{const d=data(s);if(!d.used.some(x=>x.id===r.id))d.used.push({id:r.id,personId:r.personId,kind:r.kind,month:s.month});let time=null;if(q.hours>opts.free){if(!opts.forcedTime)throw Error('missing time adapter');time=opts.forcedTime({id:'relationship-'+r.id,month:s.month,hours:q.hours,available:opts.free});if(!time||!Number.isFinite(time.used))throw Error('invalid time adapter');}
   const usedHours=time?time.used:q.hours,prior=p.relation;apply(s,p,q);d.hours[s.month]=(d.hours[s.month]||0)+usedHours;
   if(q.studyMonths){if(root.EducationPlans?.current(s.study)&&!root.EducationPlans.settleHelp(s))throw Error('funds');if(!s.study||!Number.isFinite(s.study.total)||!Number.isFinite(s.study.progress)||s.study.total<=s.study.progress)throw Error('study');if(root.EducationPlans?.modern(s.study)){if(!root.EducationPlans?.help(s,q.studyMonths))throw Error('study');}else s.study.total=Math.max(s.study.progress,s.study.total-q.studyMonths);if(s.study.progress>=s.study.total){if(!opts.graduate)throw Error('missing graduation adapter');opts.graduate(s);}}
   if(q.cash)(s.financeLedger??=[]).push({id:r.id,kind:q.cash>0?'relationshipReward':'relationshipExpense',source:'relationshipLife',incomeKind:def?.payMode||def?.incomeKind||'relationship',wages:q.wages||0,tips:q.tips||0,instant:true,eventId:r.id,month:s.month,amount:Math.abs(q.cash),personId:p.id});
   r.choice=index;r.receipt={...copy(q),used:usedHours,time,appliedIntimacy:p.relation-prior};d.receipts.push({id:r.id,kind:r.kind,personId:p.id,month:s.month,choice:index,...r.receipt});
   if(q.hours>0&&q.hours>=opts.free)s.forcedTimeReturn={month:s.month,id:'relationship-'+r.id,debt:time?.debt||0};
   if(q.followup){const k=q.followup==='aircon'?r.airconOutcome:q.followup==='moving-meal'?'moving-meal':'classmate';if(!D.followups[k]||k==='classmate'&&!r.newClassmate)throw Error('missing locked outcome');r.status='followup';r.followup={...copy(D.followups[k]),key:k};}else finishMove(s,m,r);return {ok:true,receipt:r.receipt,followup:r.status==='followup'};
  },opts.save);return result||{ok:false,reason:'save'};
 }
 function confirmFollowup(s,id,opts){const m=s.town?.movement,r=m?.relationshipLifeCard,p=s.people?.find(p=>p.id===r?.personId);if(!r||m.resolved||r.id!==id||r.status!=='followup'||r.month!==s.month||r.moveId!==m.id||!p||!r.followup||typeof opts.save!=='function')return {ok:false,reason:'stale'};
  if(r.studyProjectId&&project(s)!==r.studyProjectId)return {ok:false,reason:'study'};
  if(r.leaseKey&&s.relationshipHome?.leaseKey!==r.leaseKey)return {ok:false,reason:'lease'};
  return atomic(s,()=>{if(r.followup.key==='classmate'){if(!r.newClassmate||s.people.some(p=>p.id===r.newClassmate.id))throw Error('contact');s.people.push(copy(r.newClassmate));}else apply(s,p,r.followup.options[0]);r.followupReceipt={key:r.followup.key,month:s.month,newPersonId:r.newClassmate?.id};finishMove(s,m,r);return {ok:true};},opts.save)||{ok:false,reason:'save'};
 }
 const api={cards,spec,data,eligible,used,create,saveCard,confirm,confirmFollowup,enroll,makeStudent,reserveLegacy,payQuote,coffeeRole,bossLabel};root.RelationshipLifeCards=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
