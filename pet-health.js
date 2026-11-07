// Confirmed health tiers and neglect treatment; annual exams remain separate.
(function(root){'use strict';
 const vetFees={dog:1500,cat:1500,tortoise:1000,chameleon:1200,gecko:800,spider:500,crocodile:5000};
 const vetHours={dog:4,cat:4,tortoise:3,chameleon:3,gecko:3,spider:3,crocodile:6};
 const aliases={狗:'dog',柯基:'dog',猫:'cat',银渐层:'cat',乌龟:'tortoise',陆龟:'tortoise',变色龙:'chameleon',蜥蜴:'gecko',豹纹守宫:'gecko',蜘蛛:'spider',捕鸟蛛:'spider',鳄鱼:'crocodile'};
 const species=p=>p&&(Object.hasOwn(vetFees,p.species)?p.species:Object.hasOwn(aliases,p.type)?aliases[p.type]:undefined);
 const copy=s=>JSON.parse(JSON.stringify(s)),money=n=>Math.round(n*100)/100;
 const identity=p=>JSON.stringify([p.id,p.species,p.type,p.adoptMonth,p.name]);
 const value=p=>Number.isFinite(p?.health)?Math.max(0,Math.min(100,p.health)):80;
 const activeVet=p=>(p?.vetCases||[]).find(x=>x.status==='pending')||null;
 const illnessShare=p=>value(p)>=50?.2:value(p)>30?.5:.75;
 function illnessFactor(p,otherWeight=80){return value(p)>=50||otherWeight<=0?1:otherWeight/20*illnessShare(p)/(1-illnessShare(p));}
 function ensureDeadline(s,r,atMonthEnd=false){if(!Number.isInteger(r.deadlineMonth)){r.deadlineStartedMonth=s.month;r.deadlineMonth=s.month+(atMonthEnd?3:2);r.deadlineVersion=1;}}
 function createVet(s,p,atMonthEnd=false){if(value(p)!==0||activeVet(p)||!species(p))return;
  const I=root.PetInsurance||(typeof require==='function'?require('./pet-insurance.js'):null),policy=I?.medicalPolicy(s,p),coverage=Math.min(.5,policy?.coverage||0),total=vetFees[species(p)];
  let n=s.nextPetVetId||0,id;do{id='pet-vet-'+(++n);}while([...(s.pets||[]),...(s.petMemorials||[])].some(x=>(x.vetCases||[]).some(c=>c.id===id)));s.nextPetVetId=n;
  const r={id,status:'pending',cause:'neglect',month:s.month,species:species(p),identity:identity(p),total,coverage,insurancePaid:money(total*coverage),due:money(total*(1-coverage))};ensureDeadline(s,r,atMonthEnd);(p.vetCases??=[]).push(r);
 }
 function ensure(s){for(const p of s.pets||[]){if(!species(p))continue;p.health=value(p);p.cleanHealth??={version:1,startedMonth:s.month,lastSettledMonth:s.month-1,history:[]};createVet(s,p);const r=activeVet(p);if(r)ensureDeadline(s,r);}return s;}
 function expire(s,month){const expired=(s.pets||[]).filter(p=>activeVet(p)?.deadlineMonth<=month);if(!expired.length)return [];
  s.pets=s.pets.filter(p=>!expired.includes(p));const rows=[];
  for(const p of expired){const r=activeVet(p);r.status='expired';r.expiredMonth=month;Object.assign(p,{status:'deceased',diedMonth:month,deathCause:'untreatedNeglect',deathCaseId:r.id});(s.petMemorials??=[]).push(p);
   const k=p.insuranceKey;if(typeof k==='string'&&k.startsWith('pet-policy-')&&s.insurance?.[k]&&!s.pets.some(x=>x.insuranceKey===k))Object.assign(s.insurance[k],{active:false,endedMonth:month+1,endReason:'petDeath'});
   const row={month,kind:'petDeath',caseId:r.id,species:species(p),petName:p.name||p.type,deadlineMonth:r.deadlineMonth};rows.push(row);(s.timeline??=[]).push((p.name||p.type)+'因三个月内未接受治疗，于第'+(month+1)+'月离世。');
  }
  if(!s.pets.length&&s.insurance?.pet)Object.assign(s.insurance.pet,{active:false,endedMonth:month+1,endReason:'petDeath'});return rows;
 }
 function settle(s,month=s.month){if(!Number.isInteger(month)||month!==s.month)return [];ensure(s);const rows=[];
  for(const p of s.pets||[]){if(!species(p))continue;const t=p.cleanHealth;if(month<t.startedMonth||month<=t.lastSettledMonth)continue;t.lastSettledMonth=month;
   if(!Number.isInteger(p.care?.nextClean)||p.care.nextClean>month)continue;
   const before=value(p);p.health=Math.max(0,before-10);const r={month,kind:'overdueClean',dueMonth:p.care.nextClean,before,after:p.health,change:p.health-before};t.history.push(r);rows.push({...r,petName:p.name||p.type,careId:p.careId});createVet(s,p,true);
  }return rows.concat(expire(s,month));
 }
 function clean(s,p,method){ensure(s);if(!species(p)||activeVet(p))return;const before=value(p);p.health=Math.min(100,before+20);p.cleanHealth.history.push({month:s.month,kind:'clean',method,before,after:p.health,change:p.health-before});}
 function quoteVet(s,index){const original=s.pets?.[index];if(!original||!species(original))return null;const preview=copy(s);ensure(preview);const p=preview.pets[index],record=activeVet(p);if(!record||record.identity!==identity(original))return null;
  const hours=vetHours[species(original)];
  return {...record,hours,petName:original.name||original.type,token:JSON.stringify([s.month,index,identity(original),record,hours])};
 }
 function confirmVet(s,index,token,save,{free}={}){const q=quoteVet(s,index);if(!q||q.token!==token)return {ok:false,reason:'stale'};if(s.cash<q.due)return {ok:false,reason:'cash'};if(!Number.isFinite(free)||free<q.hours)return {ok:false,reason:'time'};const before=copy(s);
  try{ensure(s);const p=s.pets[index],r=activeVet(p);if(r?.id!==q.id||!Number.isFinite(q.due)||q.due<0)throw Error('stale treatment');
   if(s.petCareTime?.month!==s.month)s.petCareTime={month:s.month,hours:0};s.petCareTime.hours+=q.hours;
   const healthBefore=value(p);s.cash=money(s.cash-q.due);p.health=80;r.status='completed';r.completedMonth=s.month;r.receipt={cost:q.due,total:q.total,insurancePaid:q.insurancePaid,coverage:q.coverage,hours:q.hours,healthBefore,healthAfter:80};p.cleanHealth.history.push({month:s.month,kind:'vetTreatment',caseId:r.id,hours:q.hours,before:healthBefore,after:80,change:80-healthBefore});
   (s.financeLedger??=[]).push({kind:'lifeIncident',source:'petVetTreatment',month:s.month,amount:q.due,gross:q.total,insurancePaid:q.insurancePaid,coverage:q.coverage,hours:q.hours,caseId:r.id,species:r.species,petName:p.name||p.type});
   if(save()===false)throw Error('save failed');return {ok:true,quote:q};
  }catch(e){for(const k of Object.keys(s))delete s[k];Object.assign(s,before);return {ok:false,reason:'save'};}
 }
 function pendingNotices(s){return (s.petMemorials||[]).filter(p=>!p.deathAcknowledged);}
 function acknowledgeDeaths(s,ids,save){const before=copy(s);try{for(const p of pendingNotices(s))if(ids.includes(p.deathCaseId))p.deathAcknowledged=true;if(save()===false)throw Error('save failed');return true;}catch(e){for(const k of Object.keys(s))delete s[k];Object.assign(s,before);return false;}}
 const api={value,ensure,settle,clean,illnessFactor,illnessShare,vetFees,vetHours,activeVet,quoteVet,confirmVet,pendingNotices,acknowledgeDeaths};root.PetHealth=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
// Preserve original slots and pending medical quotes before first writing this version.
if(typeof document!=='undefined'&&typeof save==='function'){
 const petHealthSaveBefore=save;save=function(){try{if(state?.pets?.length||state?.petMemorials?.length){const k=key(slot),raw=localStorage.getItem(k);for(const suffix of ['_before_pet_health_20261107','_before_pet_vet_20261107','_before_pet_vet_time_20261107','_before_pet_vet_deadline_20261107']){const bk=k+suffix;if(raw&&!localStorage.getItem(bk))localStorage.setItem(bk,raw);}}}catch(e){return false;}return petHealthSaveBefore.apply(this,arguments);};
}
