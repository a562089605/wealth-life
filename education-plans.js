// Confirmed part-time education. All mutations belong to the caller's save transaction.
(function(root){'use strict';
 const routes={associate:{name:'副学士',from:'highschool',cost:6200,months:{slow:48,fast:36},units:144,rates:{slow:3,fast:4}},bachelor:{name:'学士',from:'associate',cost:12800,months:{slow:48,fast:36},units:144,rates:{slow:3,fast:4}},master:{name:'硕士',from:'bachelor',cost:13400,months:{slow:36,fast:24},units:72,rates:{slow:2,fast:3}},doctorate:{name:'博士',from:'master',cost:75000,months:{slow:96,fast:72},units:288,rates:{slow:3,fast:4}}};
 const copy=s=>JSON.parse(JSON.stringify(s)),modern=st=>st?.version===3&&!!routes[st.target];
 const hours=pace=>pace==='fast'?60:40;
 function effective(st,month){return st.pending&&st.pending.month<=month?st.pending:{pace:st.pace,paused:!!st.paused};}
 function projection(st,pace){const r=routes[st.target];return Math.ceil(Math.max(0,st.requiredUnits-st.completedUnits)/r.rates[pace]);}
 function sync(st){const r=routes[st.target];st.total=st.requiredUnits/r.rates[st.pace];st.progress=st.completedUnits/r.rates[st.pace];}
 function data(s){return s.educationPlans??={version:1,hours:{},graduates:[],revision:0};}
 function reserved(s,month=s.month){const records=s.educationPlans?.hours?.[month]||{},st=s.study,active=modern(st)&&!effective(st,month).paused?hours(effective(st,month).pace):0;return Object.entries(records).reduce((n,[id,h])=>n+(id===st?.id?Math.max(h,active):h),0)+(active&&!Object.hasOwn(records,st.id)?active:0);}
 function atomic(s,fn,save){const before=copy(s);try{const result=fn();if(save()===false)throw Error('save');return {ok:true,...result};}catch(e){for(const k of Object.keys(s))delete s[k];Object.assign(s,before);return {ok:false,reason:'save'};}}
 function enroll(s,target,pace,opts){const r=routes[target];if(s.study||!r||s.education!==r.from||!['slow','fast'].includes(pace))return {ok:false,reason:'stale'};
 if(s.cash<r.cost)return {ok:false,reason:'funds'};if(opts.recovery||opts.available<hours(pace))return {ok:false,reason:'time'};
 return atomic(s,()=>{const d=data(s);s.cash=Math.round((s.cash-r.cost)*100)/100;s.nextEducationId=(s.nextEducationId||0)+1;const id='tuition-'+s.nextEducationId;
 s.study={version:3,id,target,pace,paused:false,completedUnits:0,requiredUnits:r.units,elapsedMonths:0,revision:0,startedMonth:s.month,lastAdvancedMonth:s.month-1,receipt:{id,tuition:r.cost,paidMonth:s.month}};sync(s.study);(d.hours[s.month]??={})[id]=hours(pace);
 opts.enroll?.(s,s.study);(s.financeLedger??=[]).push({id,kind:'tuitionPayment',month:s.month,amount:r.cost,target});d.revision++;return {id};},opts.save);}
 function schedule(s,id,revision,action,pace,opts){const st=s.study;if(!modern(st)||st.id!==id||st.revision!==revision||!['pace','pause','resume'].includes(action)||!['slow','fast'].includes(pace))return {ok:false,reason:'stale'};
 if(action==='resume'&&!st.paused||action!=='resume'&&st.paused)return {ok:false,reason:'stale'};
 if(action!=='pause'&&opts.available<hours(pace))return {ok:false,reason:'time'};
 return atomic(s,()=>{st.pending={month:s.month+1,pace:action==='pause'?st.pace:pace,paused:action==='pause'};st.revision++;data(s).revision++;return {};},opts.save);}
 function advance(s,finishedMonth,recovery){const st=s.study;if(!modern(st))return false;
 if(st.lastAdvancedMonth>=finishedMonth)return false;
 // Settle the schedule that actually applied in the month being closed.
 if(st.pending?.month<=finishedMonth){Object.assign(st,{pace:st.pending.pace,paused:st.pending.paused});delete st.pending;}
 st.lastAdvancedMonth=finishedMonth;
 if(!recovery&&!st.paused){st.completedUnits=Math.min(st.requiredUnits,st.completedUnits+routes[st.target].rates[st.pace]);st.elapsedMonths++;}
 sync(st);const done=st.completedUnits>=st.requiredUnits;
 if(!done&&st.pending?.month<=finishedMonth+1){Object.assign(st,{pace:st.pending.pace,paused:st.pending.paused});delete st.pending;sync(st);}
 if(!done&&!st.paused)(data(s).hours[finishedMonth+1]??={})[st.id]=hours(st.pace);
 return done;}
 function help(s,months){const st=s.study;if(!modern(st)||st.paused||!(months>0))return false;st.requiredUnits=Math.max(st.completedUnits,st.requiredUnits-months*routes[st.target].rates[st.pace]);sync(st);return true;}
 function graduated(s,st,month){if(!modern(st))return;const d=data(s);if(!d.graduates.some(g=>g.id===st.id))d.graduates.push({id:st.id,target:st.target,month,seen:false});}
 function cancelQuote(s){const st=s.study;return !!st&&st.progress===0&&st.receipt?.paidMonth===s.month&&Number.isFinite(st.receipt.tuition)&&st.receipt.tuition>=0;}
 function withdraw(s,id,revision,refund,opts){const st=s.study;if(!modern(st)||st.id!==id||st.revision!==revision||refund!==cancelQuote(s))return {ok:false,reason:'stale'};
 return atomic(s,()=>{if(refund){s.cash=Math.round((s.cash+st.receipt.tuition)*100)/100;(s.financeLedger??=[]).push({id:st.id+'-refund',kind:'tuitionReversal',month:s.month,amount:st.receipt.tuition});if(s.educationPlans?.hours?.[s.month])delete s.educationPlans.hours[s.month][id];}s.study=null;data(s).revision++;return {};},opts.save);}
 const api={routes,modern,hours,effective,projection,reserved,enroll,schedule,advance,help,graduated,cancelQuote,withdraw};root.EducationPlans=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
