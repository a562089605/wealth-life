// Optional pet-specific medical policies; confirmed prices and full medical coverage.
(function(root){'use strict';
 const monthly={dog:60,cat:40,tortoise:20,chameleon:20,gecko:20,spider:5,crocodile:60};
 const aliases={狗:'dog',柯基:'dog',猫:'cat',银渐层:'cat',乌龟:'tortoise',陆龟:'tortoise',变色龙:'chameleon',蜥蜴:'gecko',豹纹守宫:'gecko',蜘蛛:'spider',捕鸟蛛:'spider',鳄鱼:'crocodile'};
 const copy=s=>JSON.parse(JSON.stringify(s)),money=x=>Math.round(x*100)/100;
 const species=p=>Object.hasOwn(monthly,p?.species)?p.species:aliases[p?.type];
 const identity=p=>[p.id,p.careId,p.species,p.type,p.adoptMonth,p.name,p.insuranceKey];
 function policies(s,p){const k=p?.insuranceKey,individual=k&&!['health','life','auto','income'].includes(k)&&s.insurance?.[k];return [individual,s.insurance?.pet].filter(x=>x?.active);}
 function effective(s,x){return !Number.isInteger(x.startMonth)||x.startMonth<=s.month;}
 function held(s,p){const all=policies(s,p);return all.find(x=>effective(s,x))||all[0]||null;}
 // Previously missing coverage now follows the user's explicit full-medical choice; saved event quotes stay locked.
 function coverage(x){return x?.coverage===undefined?1:Number.isFinite(x.coverage)&&x.coverage>=0&&x.coverage<=1?x.coverage:null;}
 function medicalPolicy(s,p){for(const x of policies(s,p)){const rate=coverage(x);if(effective(s,x)&&rate!==null)return {...x,coverage:rate};}return null;}
 function premiums(s){return money(Object.values(s.insurance||{}).reduce((n,x)=>n+(x.active?x.monthly||0:0),0));}
 function quote(s,index){const p=s.pets?.[index],sp=species(p);if(!p||!sp)return null;const current=held(s,p),fee=current?.monthly??monthly[sp],total=premiums(s),paid=s.monthlyPayments?.month===s.month?s.monthlyPayments.premiums||0:0;
  const due=current?0:money(Math.max(0,total+fee-Math.max(total,paid)));
  const token=JSON.stringify([s.month,index,identity(p),s.insurance||{},paid,s.nextPetInsuranceId||0]);return {species:sp,monthly:fee,due,held:current,coverage:current?coverage(current):1,token};
 }
 function confirm(s,index,token,save){const q=quote(s,index);if(!q||q.held||q.token!==token)return {ok:false,reason:'stale'};if(s.cash<q.due)return {ok:false,reason:'cash'};const before=copy(s);
  try{const p=s.pets[index];s.insurance??={};let n=s.nextPetInsuranceId||0,k;do{k='pet-policy-'+(++n);}while(Object.hasOwn(s.insurance,k));s.nextPetInsuranceId=n;
   if(q.due){s.cash=money(s.cash-q.due);if(s.monthlyPayments?.month!==s.month)s.monthlyPayments={month:s.month,housing:0,living:0,premiums:0};s.monthlyPayments.premiums=money((s.monthlyPayments.premiums||0)+q.due);(s.financeLedger??=[]).push({kind:'premiumsPayment',source:'petInsurance',month:s.month,amount:q.due,petIndex:index,species:q.species,petName:p.name,policyKey:k});}
   s.insurance[k]={name:(p.name||p.type||'宠物')+' · 宠物医疗保险',active:true,monthly:q.monthly,coverage:1,startMonth:s.month,species:q.species,petIndex:index};p.insuranceKey=k;
   if(save()===false)throw Error('save failed');return {ok:true,key:k,quote:q};
  }catch(e){for(const k of Object.keys(s))delete s[k];Object.assign(s,before);return {ok:false,reason:'save'};}
 }
 const api={monthly,species,held,coverage,medicalPolicy,premiums,quote,confirm};root.PetInsurance=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
