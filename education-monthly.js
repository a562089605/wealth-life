// Confirmed monthly courses. Version 3 and earlier retain their original contracts.
(function(root){'use strict';
 const E=root.EducationPlans,old={...E},copy=s=>JSON.parse(JSON.stringify(s)),cents=n=>Math.round(n*100),money=n=>n/100;
 const make=(name,from,cost,books,months,units)=>({name,from,cost,books,tuition:cost-books,months:{slow:months,fast:months*2/3},units,rates:{slow:40,fast:60}});
 const routes={associate:make('转学型副学士 AA','highschool',8600,2400,36,1440),bachelor:make('本科','associate',15200,2400,36,1440),bachelorDirect:make('本科','highschool',30300,4800,72,2880),master:make('硕士','bachelor',15800,2400,36,1440),doctorate:make('专业博士','master',78600,3600,54,2160)};
 routes.bachelorDirect.target='bachelor';
 const current=st=>st?.version===4&&!!routes[st.route];
 const projection=(st,pace)=>current(st)?Math.ceil(Math.max(0,st.requiredUnits-st.completedUnits)/E.hours(pace)):old.projection(st,pace);
 function sync(st){st.total=st.requiredUnits/E.hours(st.pace);st.progress=st.completedUnits/E.hours(st.pace);}
 function atomic(s,fn,save){const before=copy(s);try{const r=fn();if(save()===false)throw Error('save');return {ok:true,...r};}catch(e){for(const k of Object.keys(s))delete s[k];Object.assign(s,before);return {ok:false,reason:'save'};}}
 const balance=st=>current(st)?Math.max(0,cents(st.receipt.tuition)-st.paidCents):0;
 const due=st=>current(st)&&!st.bill?.paid?st.bill?.cents||0:0;
 function bill(st,month){if(st.bill&&!st.bill.consumed)return;const remaining=balance(st);st.installmentCents??=Math.round(remaining/Math.max(1,projection(st,st.pace)));st.bill={month,sequence:(st.bill?.sequence||0)+1,cents:Math.min(remaining,projection(st,st.pace)<=1?remaining:st.installmentCents),paid:remaining===0,consumed:false};}
 function charge(s,st,amount,kind){if(amount<0||cents(s.cash)<amount)throw Error('funds');s.cash=money(cents(s.cash)-amount);st.paidCents+=amount;(s.financeLedger??=[]).push({id:st.id+'-'+kind+'-'+st.bill.sequence,kind:'tuitionPayment',month:s.month,amount:money(amount),target:st.target});}
 function enroll(s,route,pace,opts){const r=routes[route];if(s.study||!r||s.education!==r.from||!['slow','fast'].includes(pace))return {ok:false,reason:'stale'};if(opts.recovery||opts.available<E.hours(pace))return {ok:false,reason:'time'};const first=Math.round(cents(r.cost)/r.months[pace]);if(cents(s.cash)<first)return {ok:false,reason:'funds'};
 return atomic(s,()=>{s.nextEducationId=(s.nextEducationId||0)+1;const id='tuition-'+s.nextEducationId,st=s.study={version:4,id,route,target:r.target||route,pace,paused:false,completedUnits:0,requiredUnits:r.units,elapsedMonths:0,revision:0,startedMonth:s.month,lastAdvancedMonth:s.month-1,paidCents:0,receipt:{id,tuition:r.cost,books:r.books,paidMonth:s.month}};sync(st);bill(st,s.month);charge(s,st,st.bill.cents,'enroll');st.bill.paid=true;const d=s.educationPlans??={version:1,hours:{},graduates:[],revision:0};(d.hours[s.month]??={})[id]=E.hours(pace);opts.enroll?.(s,st);d.revision++;return {id};},opts.save);}
 function pay(s,id,revision,all,opts){const st=s.study;if(!current(st)||st.id!==id||st.revision!==revision)return {ok:false,reason:'stale'};const amount=all?balance(st):due(st);if(amount===0)return {ok:false,reason:'stale'};if(cents(s.cash)<amount)return {ok:false,reason:'funds'};return atomic(s,()=>{charge(s,st,amount,all?'balance':'monthly');st.bill.paid=true;st.revision++;return {};},opts.save);}
 function advance(s,month,recovery){const st=s.study;if(!current(st))return old.advance(s,month,recovery);if(st.lastAdvancedMonth>=month)return false;
 const recoveryFresh=recovery&&!st.bill?.paid&&st.bill?.month===month;
 if(recoveryFresh)st.bill.consumed=true;
 if(st.pending?.month<=month){st.pace=st.pending.pace;delete st.installmentCents;delete st.pending;}st.lastAdvancedMonth=month;
 if(!recovery&&st.bill?.paid){st.completedUnits=Math.min(st.requiredUnits,st.completedUnits+E.hours(st.pace));st.elapsedMonths++;st.bill.consumed=true;}
 const done=st.completedUnits>=st.requiredUnits&&balance(st)===0;
 if(!done&&st.pending?.month<=month+1){st.pace=st.pending.pace;delete st.installmentCents;delete st.pending;}sync(st);
 if(!done&&(!recovery||recoveryFresh))bill(st,month+1);
 // A paid recovery installment remains a single credit, including across a pace change.
 if(!done){(s.educationPlans.hours[month+1]??={})[st.id]=E.hours(st.pace);}
 return done;}
 function help(s,n){if(!current(s.study))return old.help(s,n);const st=s.study;if(balance(st)>0)return false;st.requiredUnits=Math.max(st.completedUnits,st.requiredUnits-n*E.hours(st.pace));sync(st);return true;}
 const modern=st=>current(st)||old.modern(st);
 Object.assign(E,{routes,legacyRoutes:old.routes,current,modern,projection,balance:st=>money(balance(st)),due:st=>money(due(st)),enroll,pay,advance,help,
 reserved(s,month=s.month){if(!current(s.study))return old.reserved(s,month);const st=s.study,records=s.educationPlans?.hours?.[month]||{},h=E.hours(st.pending?.month<=month?st.pending.pace:st.pace);return Object.entries(records).reduce((n,[id,v])=>n+(id===st.id?Math.max(v,h):v),0)+(Object.hasOwn(records,st.id)?0:h);},
 schedule(s,id,rev,action,pace,opts){if(!current(s.study))return old.schedule(s,id,rev,action,pace,opts);const st=s.study;if(st.id!==id||st.revision!==rev||action!=='pace'||!['slow','fast'].includes(pace))return {ok:false,reason:'stale'};if(opts.available<E.hours(pace))return {ok:false,reason:'time'};return atomic(s,()=>{st.pending={month:s.month+1,pace,paused:false};st.revision++;return {};},opts.save);},
 cancelQuote:s=>current(s.study)?false:old.cancelQuote(s),withdraw:(s,...args)=>current(s.study)?{ok:false,reason:'stale'}:old.withdraw(s,...args),
 graduated(s,st,month){if(!current(st))return old.graduated(s,st,month);const d=s.educationPlans;if(!d.graduates.some(g=>g.id===st.id))d.graduates.push({id:st.id,target:st.target,month,seen:false});},
 settleHelp(s){const st=s.study;if(!current(st))return true;const amount=balance(st);if(cents(s.cash)<amount)return false;if(amount)charge(s,st,amount,'help');st.bill.paid=true;return true;}});
 root.EducationMonthly=E;
})(typeof window==='undefined'?globalThis:window);
