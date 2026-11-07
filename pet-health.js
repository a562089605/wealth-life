// User-approved cleaning health rules; annual exams remain separate.
(function(root){'use strict';
 const ids=new Set(['dog','cat','tortoise','chameleon','gecko','spider','crocodile']);
 const aliases={狗:'dog',柯基:'dog',猫:'cat',银渐层:'cat',乌龟:'tortoise',陆龟:'tortoise',变色龙:'chameleon',蜥蜴:'gecko',豹纹守宫:'gecko',蜘蛛:'spider',捕鸟蛛:'spider',鳄鱼:'crocodile'};
 const supported=p=>p&&(ids.has(p.species)||Object.hasOwn(aliases,p.type));
 const value=p=>Number.isFinite(p?.health)?Math.max(0,Math.min(100,p.health)):80;
 function ensure(s){for(const p of s.pets||[]){if(!supported(p))continue;p.health=value(p);p.cleanHealth??={version:1,startedMonth:s.month,lastSettledMonth:s.month-1,history:[]};}return s;}
 const illnessFactor=p=>value(p)<30?1.5:1;
 function settle(s,month=s.month){if(!Number.isInteger(month)||month!==s.month)return [];ensure(s);const rows=[];
  for(const p of s.pets||[]){if(!supported(p))continue;const t=p.cleanHealth;if(month<t.startedMonth||month<=t.lastSettledMonth)continue;t.lastSettledMonth=month;
   if(!Number.isInteger(p.care?.nextClean)||p.care.nextClean>month)continue;
   const before=value(p);p.health=Math.max(0,before-10);const r={month,kind:'overdueClean',dueMonth:p.care.nextClean,before,after:p.health,change:p.health-before};t.history.push(r);rows.push({...r,petName:p.name||p.type,careId:p.careId});
  }return rows;
 }
 function clean(s,p,method){ensure(s);if(!supported(p))return;const before=value(p);p.health=Math.min(100,before+20);p.cleanHealth.history.push({month:s.month,kind:'clean',method,before,after:p.health,change:p.health-before});}
 const api={value,ensure,settle,clean,illnessFactor};root.PetHealth=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
// Preserve the original slot before the first save with health tracking.
if(typeof document!=='undefined'&&typeof save==='function'){
 const petHealthSaveBefore=save;save=function(){try{if(state?.pets?.length){const k=key(slot),bk=k+'_before_pet_health_20261107',raw=localStorage.getItem(k);if(raw&&!localStorage.getItem(bk))localStorage.setItem(bk,raw);}}catch(e){return false;}return petHealthSaveBefore.apply(this,arguments);};
}
