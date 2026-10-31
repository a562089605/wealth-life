const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict'),{test}=require('node:test');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
function setup(){
 let modal,button;
 const s={month:0,cash:10000,education:'highschool',health:80,energy:80,stress:20,financeLedger:[],loans:[]};
 const c={state:s,Math,roundCash:n=>Math.round(n*100)/100,money:String,EDU:vm.runInNewContext('('+read('index.html').match(/const EDU=(.*);/)[1]+')'),
  currentCareerTime:()=>({free:100,baseFree:100,workHoursDelta:0,courseHours:0}),necessaryPetCareHours:()=>0,
  save(){},finish(){if(button)button.live=false;},openLearning(){},openBankLoan(){},showMonthlyAudit(){},
  showEvent(...args){if(button)button.live=false;button={live:true};modal=args;},$:()=>({get firstElementChild(){return button}}),
  eventActionCurrent:(b,title)=>b?.live&&modal[1]===title};
 vm.createContext(c);vm.runInContext(read('recovery-rules.js'),c);vm.runInContext(read('education-time.js'),c);
 const core=read('core.js');vm.runInContext(core.slice(core.indexOf('function openEducation(){'),core.indexOf('\nfunction debtDisplayName')),c);

 return {c,s,get modal(){return modal},get button(){return button}};
}
test('preview is free; confirming enrolls once, reserves 20h, and cannot withdraw',()=>{
 const x=setup();x.c.openEducation();assert.equal(x.c.currentCareerTime().free,100);assert.equal(x.s.cash,10000);
 const confirm=x.modal[4][0][1];assert.equal(confirm(),true);assert.equal(x.s.cash,3000);assert.equal(x.c.currentCareerTime().free,80);
 confirm();assert.equal(x.s.financeLedger.length,1);assert.equal(x.s.study.progress,0);assert.equal(x.s.study.total,30);
 x.c.openEducation();assert.equal(x.modal[4].map(a=>a[0]).join(','),'返回学习');assert.equal(x.c.currentCareerTime().free,80);
});
test('enrollment checks 20h, cash, pet care, and recovery at execution time',()=>{
 for(const mode of ['time','cash','pet','health','recovery']){
  const x=setup();x.c.openEducation();const confirm=x.modal[4][0][1];
  if(mode==='time')x.c.currentCareerTime=()=>({free:19});
  if(mode==='cash')x.s.cash=6999;
  if(mode==='pet')x.c.necessaryPetCareHours=()=>81;
  if(mode==='health')x.s.health=29;
  if(mode==='recovery')x.s.treatments={r:{paid:true,status:'scheduled',startMonth:0}};
  assert.equal(confirm(),false,mode);assert.equal(x.s.study,undefined,mode);assert.equal(x.s.financeLedger.length,0,mode);
 }
 const x=setup();x.c.currentCareerTime=()=>({free:20});x.c.openEducation();assert.equal(x.modal[4][0][1](),true);
});
test('stale confirmation after close, month change, or save switch cannot enroll',()=>{
 for(const mode of ['close','month','save']){
  const x=setup();x.c.openEducation();const confirm=x.modal[4][0][1];
  if(mode==='close')x.c.finish();if(mode==='month')x.s.month++;if(mode==='save')x.c.state=structuredClone(x.s);
  assert.equal(confirm(),false);assert.equal(x.c.state.study,undefined);assert.equal(x.c.state.cash,10000);
 }
});
test('save reload and legacy enrollment never backcharge money or mutate progress',()=>{
 const x=setup();x.s.month=16;x.s.study={target:'associate',progress:9,total:24};x.s.loans=[{balance:3500}];
 const before=JSON.stringify(x.s);for(let i=0;i<10;i++)assert.equal(x.c.currentCareerTime().free,80);
 assert.equal(JSON.stringify(x.s),before);x.c.state=JSON.parse(before);assert.equal(x.c.currentCareerTime().free,80);
 assert.equal(x.c.state.study.progress,9);assert.equal(x.c.state.loans[0].balance,3500);
});
test('recovery releases study commitment for that month and normal months resume',()=>{
 const x=setup();x.s.study={target:'associate',progress:2,total:24};x.s.treatments={r:{paid:true,status:'scheduled',startMonth:0}};
 assert.equal(x.c.educationMonthlyHours(x.s),0);x.s.month=1;assert.equal(x.c.educationMonthlyHours(x.s),20);
 x.s.study=null;assert.equal(x.c.educationMonthlyHours(x.s),0);
});
test('forced time ledger reconstruction retains education, courses and debt deductions',()=>{
 const x=setup(),c=x.c;c.state.study={progress:2,total:24};
 Object.assign(c,{shiftRecord:()=>null,finish(){},rollTown(){},resumeTownMove(){},openGame(){},showTown(){},document:{querySelector:()=>null}});
 vm.runInContext(read('time-ledger.js'),c);vm.runInContext(read('time-flow.js'),c);
 c.recordForcedEventTime(c.state,{id:'prior',month:0,hours:8,available:3});c.state.month=1;
 assert.equal(c.currentCareerTime().free,75);assert.equal(c.currentCareerTime().educationHours,20);
 for(let i=0;i<10;i++)assert.equal(c.currentCareerTime().free,75);
 c.state.treatments={r:{paid:true,status:'scheduled',startMonth:1}};assert.equal(c.currentCareerTime().free,0);
});
test('actual settlement records hours, pauses recovery, graduates once and releases next month',()=>{
 const x=setup(),c=x.c,s=x.s;
 Object.assign(s,{housing:'shared',turn:{index:9},retirement:{k401Balance:0,iraBalance:0,brokerageBalance:0},assets:[],loans:[],debt:{},debtSchedules:{},domainExperience:{},history:[],timeline:[],people:[],goalProgressHistory:[],social:50,friendship:50,happiness:60,baseLiving:800,study:{target:'associate',progress:22,total:24},education:'highschool',salary:1000,job:'test'});
 Object.assign(c,{pending:false,structuredClone,syncFinance(){},calcMetrics:()=>({remainingCF:0,kContrib:0,grossSalary:1000,tax:0}),ECONOMIES:[{rate:.05,home:0}],WORLD_SHOCKS:[],simulatedMarketReturn:()=>0,advanceQuotes(){},inferDomain:()=> 'general',applyCareerProgression(){},render(){},showMonthlyAudit(){},educationRaiseRate:()=>.08});
 c.Math=Object.create(Math);c.Math.random=()=>.99;
 const src=read('core.js');vm.runInContext(src.slice(src.indexOf('function settleMonthUnsafe(){'),src.indexOf('// Settlement owns')),c);
 c.settleMonthUnsafe();assert.equal(s.study.progress,23);assert.equal(s.history[0].educationStudy.hours,20);assert.equal(c.currentCareerTime().free,80);
 s.turn.index=9;c.pending=false;s.treatments={r:{id:'r',paid:true,status:'scheduled',startMonth:1}};
 c.settleMonthUnsafe();assert.equal(s.study.progress,23);assert.equal(s.history[1].educationStudy.hours,0);assert.equal(s.history[1].educationStudy.paused,true);
 s.turn.index=9;c.pending=false;c.settleMonthUnsafe();assert.equal(s.study,null);assert.equal(s.education,'associate');assert.equal(s.history[2].educationStudy.graduated,true);assert.equal(s.history[2].educationStudy.hours,20);assert.equal(c.currentCareerTime().free,100);
 assert.equal(s.salary,1080);assert.equal(s.educationRaises.associate.month,3);
});

test('new doctorate reserves 60h while lower degrees and legacy explicit contracts keep 20h',()=>{
 const x=setup();x.s.education='master';x.s.cash=60000;x.c.openEducation();assert.equal(x.modal[4][0][1](),true);assert.equal(x.s.study.monthlyHours,60);assert.equal(x.c.currentCareerTime().free,40);const cash=x.s.cash;for(let i=0;i<10;i++)assert.equal(x.c.currentCareerTime().free,40);assert.equal(x.s.cash,cash);x.s.study.monthlyHours=20;assert.equal(x.c.currentCareerTime().free,80);delete x.s.study.monthlyHours;assert.equal(x.c.currentCareerTime().free,80);assert.equal(x.c.educationRequiredHours('associate'),20);assert.equal(x.c.educationRequiredHours('bachelor'),20);assert.equal(x.c.educationRequiredHours('master'),20);
});

test('new doctorate rejects 59h and accepts exactly 60h without extra charge',()=>{
 for(const free of [59,60]){const x=setup();x.s.education='master';x.s.cash=60000;x.c.currentCareerTime=()=>({free});x.c.openEducation();const result=x.modal[4][0][1]();assert.equal(result,free===60);assert.equal(x.s.cash,free===60?12000:60000);}
});
