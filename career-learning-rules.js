// Latest confirmed career rules, 2026-11-15. Pure state helpers; caller owns save transaction.
(function(root){'use strict';
 const copy=x=>JSON.parse(JSON.stringify(x)),cash=n=>Math.round((Number(n)||0)*100)/100;
 const roles={barista:{name:'咖啡师 Barista',base:32000,weekly:40},shiftLead:{name:'值班主管 Shift Lead',base:44000,weekly:40},manager:{name:'店长 Store Manager',base:58000,weekly:45},partner:{name:'在店管理合伙人',base:70000,weekly:45}};
 const trust=n=>Math.max(0,Math.min(20,Number(n)||0));
 function role(job){return /^(咖啡师( Barista)?|Barista)$/.test(job||'')?'barista':/^(值班主管( Shift Lead)?|Shift Lead)$/.test(job||'')?'shiftLead':/^(店长( Store Manager)?|Store Manager)$/.test(job||'')?'manager':/^(在店管理合伙人|管理合伙人|Managing Partner)$/.test(job||'')?'partner':null;}
 const educationRate=e=>({associate:.08,bachelor:.12,master:.18,doctorate:.25,professional:.25}[e]||0); // preserve latest released education policy
 function payData(s,existing=true){if(s.careerLearning?.version===1)return s.careerLearning;const k=role(s.job),annual=Number(s.annualSalary)||(Number(s.salary)||0)*12;return s.careerLearning={version:1,payFloors:k&&existing?{[k]:cash(annual/(1+educationRate(s.education)))}:{},receipts:{}};}
 function annual(s,k=role(s.job)){const cfg=roles[k];if(!cfg)return null;const floor=s.careerLearning?.payFloors?.[k]||0;return cash(Math.max(cfg.base,floor)*(1+educationRate(s.education)));}
 function skillLevel(s,k){const xp=Math.max(0,Number(s.coffee?.skills?.[k]?.xp)||0);return k==='management'&&xp===0?0:Math.min(5,1+Math.floor(xp/100));}
 function specialty(s,id){const H=root.HobbyLearning;return H?H.level(H.xp(s,id)):0;}
 const working=s=>!!role(s.job)&&!s.retired&&!s.unemployedMonths;
 function requirements(s){const k=role(s.job),p=s.coffee?.progression||{},recognition=trust(s.coffee?.managerTrust);
  if(k==='barista')return [{id:'tenure',label:'咖啡师任职',value:p.baristaMonths||0,target:6,unit:'个月'},{id:'specialty',label:'咖啡专项',value:Math.max(specialty(s,'latte'),specialty(s,'pourOver')),target:3,detail:'拉花或手冲咖啡达到 Lv.3',levels:{latte:specialty(s,'latte'),pourOver:specialty(s,'pourOver')}},{id:'service',label:'顾客服务',value:skillLevel(s,'service'),target:3},{id:'trust',label:'上司认可度',value:recognition,target:4}];
  if(k==='shiftLead')return [{id:'tenure',label:'值班主管任职',value:p.shiftMonths||0,target:12,unit:'个月'},{id:'latte',label:'拉花',value:specialty(s,'latte'),target:5},{id:'pourOver',label:'手冲咖啡',value:specialty(s,'pourOver'),target:5},{id:'service',label:'顾客服务',value:skillLevel(s,'service'),target:5},{id:'management',label:'管理技能',value:skillLevel(s,'management'),target:5},{id:'trust',label:'上司认可度',value:recognition,target:10}];return [];
 }
 const next=s=>role(s.job)==='barista'?'shiftLead':role(s.job)==='shiftLead'?'manager':null;
 function missing(s){const rows=requirements(s).filter(r=>r.value<r.target).map(r=>r.label+' '+r.value+'/'+r.target+(r.unit||''));if(s.pendingResignation)rows.unshift('已安排下个月离职');if(!working(s)||!next(s))rows.unshift('当前需在职咖啡师或值班主管');return rows;}
 function atomic(s,fn,save){const before=copy(s);try{const result=fn();if(result===false||save()===false)throw Error('save');return {ok:true,...result};}catch(e){for(const k of Object.keys(s))delete s[k];Object.assign(s,before);return {ok:false,reason:'保存失败，本次操作已全部撤回，请重试。'};}}
 function promote(s,expected,save){const p=s.coffee?.progression;if(!p||expected!==JSON.stringify([s.month,s.job,p.pending||null])||p.pending||missing(s).length)return {ok:false,reason:'晋升条件或岗位已变化，请重新打开。'};return atomic(s,()=>{p.pending={from:s.job,to:roles[next(s)].name,effectiveCycle:s.month+1,cycle:s.month};return {};},save);}
 const promotionToken=s=>JSON.stringify([s.month,s.job,s.coffee?.progression?.pending||null]);
 function courseRows(s){const r=s.coffee?.progression?.courses?.[s.month];return !r?[]:r.entries||[{id:r.id,hours:r.hours,cost:r.cost,legacy:true}];}
 function courseMissing(s,{free,reserve=0,recovery=false}={}){const a=[];if(skillLevel(s,'management')>=5)a.push('管理技能已满级');if(recovery||s.health<30)a.push('当前需先安心疗养');if(s.cash<120)a.push('现金不足');if(!Number.isFinite(free)||free-3<reserve)a.push('自由时间不足，需保留必要宠物照护');if(s.energy<1)a.push('能量不足');return a;}
 const courseToken=s=>JSON.stringify([s.month,courseRows(s).length,s.coffee?.skills?.management?.xp||0]);
 function course(s,expected,opts){if(expected!==courseToken(s))return {ok:false,reason:'页面已过期，请重新打开。'};const miss=courseMissing(s,opts);if(miss.length)return {ok:false,reason:miss.join('；')};return atomic(s,()=>{const p=s.coffee.progression,entries=courseRows(s),xp=Math.min(10,400-(s.coffee.skills.management.xp||0));s.coffee.skills.management.xp+=xp;s.energy-=1;s.cash=cash(s.cash-120);entries.push({id:'management',hours:3,cost:120,xp});p.courses[s.month]={entries,hours:entries.reduce((n,r)=>n+(r.hours||0),0),cost:entries.reduce((n,r)=>n+(r.cost||0),0)};(s.financeLedger??=[]).push({kind:'coffeeCourse',month:s.month,amount:120,id:'management',sequence:entries.length});return {xp};},opts.save);}
 const api={roles,role,trust,educationRate,payData,annual,skillLevel,specialty,working,requirements,next,missing,atomic,promote,promotionToken,courseRows,courseMissing,courseToken,course};root.CareerLearningRules=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
