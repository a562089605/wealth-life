// Optional per-pet medical insurance. Game balance approved 2026-11-07.
(function(root){'use strict';
 const monthly={dog:10,cat:30,tortoise:8,chameleon:10,gecko:5,spider:5,crocodile:30};
 const aliases={狗:'dog',柯基:'dog',猫:'cat',银渐层:'cat',乌龟:'tortoise',陆龟:'tortoise',变色龙:'chameleon',蜥蜴:'gecko',豹纹守宫:'gecko',蜘蛛:'spider',捕鸟蛛:'spider',鳄鱼:'crocodile'};
 const copy=s=>JSON.parse(JSON.stringify(s)),money=x=>Math.round(x*100)/100;
 const species=p=>Object.hasOwn(monthly,p?.species)?p.species:Object.hasOwn(aliases,p?.type)?aliases[p.type]:undefined;
 const identity=p=>p&&[p.id,p.careId,p.species,p.type,p.adoptMonth,p.name,p.insuranceKey];
 const ownedCount=s=>(s.pets||[]).filter(p=>p&&typeof p==='object').length;
 const live=(s,x)=>!!x?.active&&(!Number.isInteger(x.stopMonth)||x.stopMonth>s.month);
 function policies(s,p){const k=p?.insuranceKey,individual=k&&!['health','life','auto','income'].includes(k)&&s.insurance?.[k];return [individual,s.insurance?.pet].filter(x=>live(s,x));}
 function effective(s,x){return !Number.isInteger(x.startMonth)||x.startMonth<=s.month;}
 function held(s,p){const all=policies(s,p);return all.find(x=>effective(s,x))||all[0]||null;}
 // Saved event quotes stay locked; explicit legacy coverage remains unchanged.
 function coverage(x){return x?.coverage===undefined?1:Number.isFinite(x.coverage)&&x.coverage>=0&&x.coverage<=1?x.coverage:null;}
 function medicalPolicy(s,p){for(const x of policies(s,p)){const rate=coverage(x);if(effective(s,x)&&rate!==null)return {...x,coverage:rate};}return null;}
 function individualRows(s){return (s.pets||[]).flatMap(p=>{const k=p?.insuranceKey,x=k&&s.insurance?.[k],sp=species(p);return typeof k==='string'&&k.startsWith('pet-policy-')&&x&&sp?[[k,x,sp]]:[];}).filter(([k],i,rows)=>rows.findIndex(r=>r[0]===k)===i);}
 // Called by the existing finance synchronizer. No cash, receipts or event quotes change.
 function sync(s){if(!s)return;const count=ownedCount(s),rows=individualRows(s),renew=[];
  for(const x of [...rows.map(r=>r[1]),s.insurance?.pet].filter(Boolean))if(x.active&&Number.isInteger(x.stopMonth)&&x.stopMonth<=s.month)x.active=false;
  for(const [,x,sp]of rows){if(!live(s,x))continue;
   if(x.pricingVersion!==2){x.pricingStartsMonth??=s.month+1;if(s.month<x.pricingStartsMonth)continue;}
   else if(x.pricedMonth>=s.month)continue;
   renew.push([x,sp]);
  }
  if(!count||!renew.length)return;
  let exact=rows.reduce((n,[,x])=>n+(live(s,x)&&x.pricingVersion===2&&x.pricedMonth===s.month?x.baseMonthly/x.ownedCount:0),0);
  for(const [x,sp]of renew){const before=money(exact);exact+=monthly[sp]/count;Object.assign(x,{monthly:money(money(exact)-before),pricingVersion:2,baseMonthly:monthly[sp],ownedCount:count,pricedMonth:s.month});}
 }
 function projected(s){const v={month:s.month,pets:s.pets,insurance:copy(s.insurance||{})};sync(v);return v;}
 function total(s){return money(Object.values(s.insurance||{}).reduce((n,x)=>n+(live(s,x)?x.monthly||0:0),0));}
 function premiums(s){return total(projected(s));}
 function quote(s,index){const p=s.pets?.[index],sp=species(p),count=ownedCount(s);if(!p||!sp||!count)return null;const v=projected(s),current=held(v,p),sum=total(v),paid=s.monthlyPayments?.month===s.month?s.monthlyPayments.premiums||0:0;
  const exact=individualRows(v).reduce((n,[,x])=>n+(live(v,x)&&x.pricingVersion===2&&x.pricedMonth===s.month?x.baseMonthly/x.ownedCount:0),0);
  // Increment the rounded household total; never rewrite an already-paid policy's cents.
  const fee=current?.monthly??money(money(exact+monthly[sp]/count)-money(exact)),due=current?0:money(Math.max(0,sum+fee-Math.max(sum,paid)));
  const policyKey=current&&Object.keys(v.insurance).find(k=>v.insurance[k]===current);
  const token=JSON.stringify([s.month,index,(s.pets||[]).map(identity),s.insurance||{},paid,s.nextPetInsuranceId||0]);
  return {species:sp,baseMonthly:monthly[sp],ownedCount:count,monthly:fee,due,held:current,policyKey,coverage:current?coverage(current):1,token};
 }
 function atomic(s,save,change){const before=copy(s);try{sync(s);const result=change();if(save()===false)throw Error('save failed');return result;}catch(e){for(const k of Object.keys(s))delete s[k];Object.assign(s,before);return {ok:false,reason:'save'};}}
 function confirm(s,index,token,save){const q=quote(s,index);if(!q||q.held||q.token!==token)return {ok:false,reason:'stale'};if(s.cash<q.due)return {ok:false,reason:'cash'};
  return atomic(s,save,()=>{const p=s.pets[index];s.insurance??={};let n=s.nextPetInsuranceId||0,k;do{k='pet-policy-'+(++n);}while(Object.hasOwn(s.insurance,k));s.nextPetInsuranceId=n;
   if(q.due){s.cash=money(s.cash-q.due);if(s.monthlyPayments?.month!==s.month)s.monthlyPayments={month:s.month,housing:0,living:0,premiums:0};s.monthlyPayments.premiums=money((s.monthlyPayments.premiums||0)+q.due);(s.financeLedger??=[]).push({kind:'premiumsPayment',source:'petInsurance',month:s.month,amount:q.due,petIndex:index,species:q.species,petName:p.name,policyKey:k});}
   s.insurance[k]={name:(p.name||p.type||'宠物')+' · 宠物医疗保险',active:true,monthly:q.monthly,coverage:1,startMonth:s.month,species:q.species,petIndex:index,pricingVersion:2,baseMonthly:q.baseMonthly,ownedCount:q.ownedCount,pricedMonth:s.month};p.insuranceKey=k;
   return {ok:true,key:k,quote:q};
  });
 }
 function stop(s,index,token,save){const q=quote(s,index);if(!q?.held||q.token!==token||q.held.stopMonth!==undefined)return {ok:false,reason:'stale'};
  return atomic(s,save,()=>{s.insurance[q.policyKey].stopMonth=s.month+1;return {ok:true,key:q.policyKey,stopMonth:s.month+1};});
 }
 const api={monthly,species,held,coverage,medicalPolicy,premiums,quote,confirm,stop,sync};root.PetInsurance=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
