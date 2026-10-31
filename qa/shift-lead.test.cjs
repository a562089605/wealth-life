const fs=require('fs'),vm=require('vm'),assert=require('assert'),crypto=require('crypto');
const root=require('path').resolve(__dirname,'..'),checks=[];let nodes,ctx;
function boot(saved){nodes=new Map();function node(id){if(!nodes.has(id))nodes.set(id,{innerHTML:'',textContent:'',style:{},classList:{add(){},remove(){}},closest(){return this},insertAdjacentHTML(_,s){this.innerHTML+=s}});return nodes.get(id)}
ctx={state:saved||fresh(),CAREERS:[],Math:Object.create(Math),structuredClone,document:{addEventListener(){},querySelector(){return null}},$:node,roundCash:n=>Math.round(n*100)/100,priceText:n=>'$'+Number(n).toFixed(2),save(){ctx.saved=JSON.stringify(ctx.state)},showEvent(kind,title,desc,data,actions){ctx.modal={kind,title,desc,data,actions}},finish(){},openRequiredIncident(){},showGameOver(){},window:{v26Choices(){return '<p>existing</p>'}},openWorkAdjustment(){},learningCareerCard(){return''},workplaceEvent(){ctx.oldWorkplace=true;return'barista'},settleMonth(){ctx.settles=(ctx.settles||0)+1;return'core'},showMonthlyAudit(){},openGame(){},townEnabled(){return false},recordForcedEventTime(){return {returnRequired:false,debt:0}},careerMissing(){return[]},careerSalary(c){return c.salary},applyCareerProgression(){},educationRaiseRate(t){return {associate:.08,bachelor:.12,master:.18,professional:.25}[t]||0}};vm.createContext(ctx);
vm.runInContext(fs.readFileSync(root+'/coffee.js','utf8').split('// Register one background')[0],ctx);vm.runInContext(fs.readFileSync(root+'/shift-lead.js','utf8'),ctx);vm.runInContext(fs.readFileSync(root+'/coffee-career.js','utf8'),ctx);return ctx}
function fresh(month=0){return{month,job:'值班主管 Shift Lead',salary:44000/12,annualSalary:44000,cash:5000,energy:60,stress:30,happiness:60,turn:{index:9},coffee:{version:2,managerTrust:3,customerFavor:0,monthly:null,skills:{coffee:{xp:200},service:{xp:200},management:{xp:200}}}}}
function setup(id,month=0){boot(fresh(month));ctx.shiftData();ctx.Math.random=()=>.99;const r=ctx.ensureShiftMonth();Object.assign(r,{eventId:id,status:'pending'});return r}
function effects(id,index,random=.1){const r=setup(id);assert(ctx.resolveShiftEvent(0,id,index,()=>random));return r}
function delta(r){const e={};for(const row of r.receipts)for(const [k,v]of Object.entries(row.effects))e[k]=(e[k]||0)+v;return e}
const cases=[
['training',0,null,{hours:4,energy:-2,stress:1,management:15,trust:1}],
['training',1,null,{hours:1,energy:-1,management:5}],
['schedule',0,null,{energy:-1,stress:1,management:12,trust:1}],
['schedule',1,.1,{energy:1,stress:-1,management:5}],
['schedule',1,.99,{wages:253.85,tips:16.96,hours:8,energy:-4,stress:2,management:3,trust:1}],
['schedule',2,null,{wages:253.85,tips:16.96,hours:8,energy:-4,stress:2,management:3,trust:1}],
['schedule',3,null,{energy:1,stress:-1}],
['complaint',0,null,{energy:-1,stress:2,service:12,management:8,trust:1}],
['complaint',1,.1,{management:6,service:6}],
['complaint',1,.99,{trust:-1,stress:1,service:3}],
['complaint',2,null,{stress:1,management:3,storeCost:5}],
['acting',0,.1,{wages:253.85,tips:16.96,hours:8,energy:-4,stress:2,management:10,trust:1,bonus:100}],
['acting',0,.99,{wages:253.85,tips:16.96,hours:8,energy:-4,stress:2,management:10,trust:0}],
['acting',1,null,{}]
];
for(const [id,i,u,expected]of cases){const r=effects(id,i,u??.1);if(r.followGenerated){assert.equal(r.status,'followup');assert(!r.follow.settled);assert(ctx.modal.kind.includes('FOLLOW-UP'));assert(ctx.settleShiftFollow(0,id));}assert.deepEqual(delta(r),expected);assert.equal(ctx.state.cash,5000);assert.equal(ctx.currentCareerTime().free,100-(expected.hours||0));assert.equal(ctx.state.energy,60+(expected.energy||0));assert.equal(ctx.state.stress,30+(expected.stress||0));assert.equal(ctx.state.coffee.managerTrust,3+(expected.trust||0));assert.equal(ctx.state.coffee.skills.service.xp,200+(expected.service||0));assert.equal(ctx.state.coffee.skills.management.xp,200+(expected.management||0));const income=ctx.coffeeMonthlyIncome();assert.equal(income.extraWages,(expected.wages||0)+(expected.bonus||0));assert.equal(income.extraTips,expected.tips||0);assert.equal(income.total,Math.round((44000/12+390+income.extraWages+income.extraTips)*100)/100);const before=JSON.stringify(ctx.state);assert(!ctx.resolveShiftEvent(0,id,i));assert(!ctx.settleShiftFollow(0,id));assert.equal(JSON.stringify(ctx.state),before);checks.push(id+' option '+i+(u===null?'':u<.5?' success':' failure'));}
boot();ctx.Math.random=()=>.80;const praise=ctx.ensureShiftMonth();assert.equal(praise.eventId,'praise');assert.equal(praise.status,'resolved');assert.equal(ctx.state.happiness,63);assert.equal(ctx.state.stress,28);assert.equal(praise.bonus,150);const after=JSON.stringify(ctx.state);ctx.ensureShiftMonth();assert.equal(JSON.stringify(ctx.state),after);ctx.openShiftEvent();assert.equal(ctx.shiftRecord().bonus,150);checks.push('praise automatic exactly once');
for(const id of ['schedule','complaint','acting']){let r=effects(id,id==='acting'?0:1,.99);const outcome=r.follow.success;const saved=JSON.parse(ctx.saved);boot(saved);ctx.Math.random=()=>0;ctx.openGame();r=ctx.shiftRecord();assert.equal(r.follow.success,outcome);assert.equal(r.follow.settled,false);assert(ctx.modal.kind.includes('FOLLOW-UP'));ctx.settleShiftFollow(0,id);const settled=JSON.parse(ctx.saved);boot(settled);ctx.openGame();assert.equal(ctx.shiftRecord().follow.success,outcome);assert.equal(ctx.shiftRecord().follow.settled,true);const before=JSON.stringify(ctx.state);assert(!ctx.settleShiftFollow(0,id));assert.equal(JSON.stringify(ctx.state),before);}
checks.push('all followups reload before/after settlement preserve result and idempotency');
for(let month=0;month<13;month++){const r=setup('schedule',month);assert.equal(ctx.coffeeMonthlyIncome().baseTips,[8].includes(month%12)?292.5:month%12>=10?585:390);assert(ctx.resolveShiftEvent(month,'schedule',2));assert.equal(ctx.shiftRecord().extraTips,month%12===8?12.72:month%12>=10?25.43:16.96);const income=ctx.coffeeMonthlyIncome();ctx.state.month++;ctx.finalizeCoffeeMonth({careerIncome:income});assert.equal(ctx.state.coffee.shiftLead.monthly,null);assert.equal(ctx.state.coffee.shiftLead.history.length,1);assert.equal(ctx.currentCareerTime().free,100);assert.equal(ctx.currentCareerTime().weeklyHours,40);}
checks.push('13 months: Aug→Sep→Oct→Nov→Dec→Jan seasonal tips, income snapshot, temporary hours cleared');
for(let lv=1;lv<=5;lv++){const r=setup('acting');ctx.state.coffee.skills.management.xp=(lv-1)*100+95;ctx.resolveShiftEvent(0,'acting',0,()=>.65);assert(Math.abs(r.follow.probability-(.4+lv*.1))<1e-9);assert.equal(r.follow.managementLevel,lv);}
checks.push('acting success 50/60/70/80/90 uses pre-choice skill level');
setup('acting');ctx.openShiftEvent();const html=nodes.get('eventData').innerHTML;assert(!html.includes('代理非常成功'));assert(!html.includes('忙不过来'));assert(!html.includes('$0'));assert(!html.includes('无变化'));assert(!html.includes('+0'));assert(!/>[+-]?0h</.test(html));assert(ctx.shiftWeights().praise<100);ctx.state.coffee.skills.management.xp=400;const hi=ctx.shiftWeights().praise;ctx.state.coffee.skills.management.xp=0;assert(hi>ctx.shiftWeights().praise);checks.push('main card hides followup detail and zero fields; praise weight grows but never guaranteed');
setup('acting');ctx.state.coffee.skills.management.xp=400;ctx.state.coffee.skills.service.xp=0;ctx.resolveShiftEvent(0,'acting',0,()=>.99);ctx.settleShiftFollow(0,'acting');assert.equal(ctx.state.coffee.skills.service.xp,0);assert(!ctx.shiftChangeRows(ctx.shiftRecord().receipts.at(-1).effects).some(x=>x[0]==='Service XP'));checks.push('XP clamps zero/max and result shows actual applied change');
setup('schedule');ctx.state.workHoursPerWeek=60;assert.equal(ctx.currentCareerTime().free,100);ctx.shiftRecord().workHoursDelta=96;assert(ctx.resolveShiftEvent(0,'schedule',1));ctx.settleShiftFollow(0,'schedule');r=setup('schedule');ctx.shiftRecord().workHoursDelta=96;assert(!ctx.resolveShiftEvent(0,'schedule',2));assert(ctx.resolveShiftEvent(0,'schedule',0));checks.push('time budget guards include potential failed coordination shift');
setup('acting');ctx.settleMonth();assert.equal(ctx.settles,undefined);ctx.resolveShiftEvent(0,'acting',0,()=>.1);ctx.finish();ctx.settleMonth();assert.equal(ctx.settles,undefined);ctx.settleShiftFollow(0,'acting');ctx.settleMonth();assert.equal(ctx.settles,1);checks.push('monthly settlement blocks pending main/followup and resumes once resolved');
boot();ctx.state.job='咖啡师 Barista';assert(!ctx.shiftWorking());const job=ctx.state.job;ctx.workplaceEvent();assert(!ctx.shiftRecord());assert.equal(ctx.state.job,job);assert.equal(ctx.coffeeMonthlyIncome().baseTips,300);checks.push('Barista routing unchanged; never samples Shift Lead event');
for(const id of ['schedule','complaint','acting']){setup(id);ctx.openShiftEvent();const body=nodes.get('eventData').innerHTML;assert(!body.includes('协调成功'));assert(!body.includes('协调失败'));assert(!body.includes('处理成功'));assert(!body.includes('处理失败'));}
checks.push('all followup branches hidden on main card');

// Exercise the actual core metrics and monthly settlement functions against Shift Lead hooks.
boot();Object.assign(ctx,{pending:false,syncFinance(){},remainingExpenses(){return 0},paidThisMonth(){return 0},petMonthly(){return 0},simulatedMarketReturn(){return 0},advanceQuotes(){},inferDomain(){return 'hospitality'},applyCareerProgression(){},goalStats(){return{pct:0,current:0,target:1}},render(){},ECONOMIES:[{home:0,rate:.05}],WORLD_SHOCKS:[]});
const core=fs.readFileSync(root+'/core.js','utf8');
vm.runInContext(core.slice(core.indexOf('calcMetrics=function(){'),core.indexOf('const savedRender')),ctx);
vm.runInContext(core.slice(core.indexOf('function settleMonthUnsafe(){'),core.indexOf('// Settlement owns')),ctx);
Object.assign(ctx.state,{housing:'family',retirement:{k401Balance:0,iraBalance:0,brokerageBalance:0,k401Rate:.05},debt:{},assets:[],loans:[],debtSchedules:{},domainExperience:{hospitality:12},history:[],timeline:[],baseLiving:0,housingCost:0,cash:5000,health:80,social:60,friendship:60,mood:60,people:[],cpiIndex:100,marketIndex:100,homeIndex:100,goalProgressHistory:[],age:22,energy:90,stress:10});
ctx.Math.random=()=>.99;
for(let m=0;m<13;m++){
 ctx.state.turn.index=9;const r=ctx.ensureShiftMonth();r.eventId='schedule';r.status='pending';
 assert(ctx.resolveShiftEvent(m,'schedule',2));const income=ctx.coffeeMonthlyIncome();
 const metrics=ctx.calcMetrics();assert.equal(metrics.grossSalary,income.total);assert.equal(metrics.kContrib,ctx.roundCash(income.total*.05));
 assert.equal(metrics.tax,0);
 const cash=ctx.state.cash,cf=metrics.remainingCF;ctx.pending=false;ctx.settleMonthUnsafe();assert.equal(ctx.state.month,m+1);assert(Math.abs(ctx.state.cash-cash-cf)<.001);assert.equal(ctx.state.history.length,m+1);assert.equal(ctx.state.history.at(-1).careerIncome.extraTips,m%12===8?12.72:m%12>=10?25.43:16.96);assert.equal(ctx.state.coffee.shiftLead.monthly,null);assert.equal(ctx.currentCareerTime().free,100);
}
checks.push('actual core calcMetrics + settleMonthUnsafe: 13 monthly payrolls, confirmed zero tax/401k, cash, history, season rollover');

const output={passed:true,checks,caseCount:checks.length,scope:'Node VM integration/state tests; no real browser/mobile layout validation',uploaded:false};fs.writeFileSync(root+'/qa-shift-lead-v1.json',JSON.stringify(output,null,2));console.log(JSON.stringify(output,null,2));

