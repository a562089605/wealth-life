const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),F=require('../family-events.js');
const fresh=()=>({month:1,job:'咖啡师 Barista',housing:'family',cash:1000,energy:70,stress:30,happiness:60,familyEvents:{records:{1:{month:1,cardId:'care',status:'pending'}},seen:{care:1}}});
const rates={working:true,availableWorkHours:160,wageRate:32000/(52*40),tipRate:300/23/8};
let s=fresh(),p=F.carePlan(s,s.familyEvents.records[1],0,5,0,rates);
assert.equal(p.hours,7);assert.equal(p.wages,107.69);assert.equal(p.tips,11.41);
assert(F.resolveCare(s,1,0,5,0,rates));assert.equal(s.cash,1000,'unpaid wages are not a cash expense');assert.equal(s.energy,64);assert.equal(s.stress,34);assert.equal(s.happiness,60);assert.equal(F.used(s),12);assert.equal(F.leave(s).hours,7);
const saved=JSON.parse(JSON.stringify(s)),before=JSON.stringify(s);assert.deepEqual(F.leave(saved),F.leave(s));assert(!F.resolveCare(s,1,0,5,0,rates));assert.equal(JSON.stringify(s),before);
s.month=2;assert.deepEqual(F.leave(s),{hours:0,wages:0,tips:0});assert.equal(F.used(s),0,'no time debt carried to next month');
for(const i of [0,1])for(const free of [0,1,2,5,12,20])for(const reserve of [0,3]){
 s=fresh();p=F.carePlan(s,s.familyEvents.records[1],i,free,reserve,rates);const hours=F.cards.find(c=>c.id==='care').choices[i].hours;
 assert.equal(p.hours,Math.max(0,hours+reserve-free));assert(F.resolveCare(s,1,i,free,reserve,rates));assert.equal(free+F.leave(s).hours-F.used(s),Math.max(reserve,free-hours));assert.equal(s.happiness,60);
}
s=fresh();s.cash=299;const unpaid=JSON.stringify(s);assert(!F.resolveCare(s,1,1,0,0,rates));assert.equal(JSON.stringify(s),unpaid,'cash shortage cannot take leave or apply effects');
s.loans=[{principal:1,balance:1}];s.cash+=1;assert.equal(s.familyEvents.records[1].status,'pending','loan arrival does not pay');assert(F.resolveCare(s,1,1,0,0,rates));assert.equal(s.cash,0);assert.equal(s.loans[0].balance,1);assert.equal(s.financeLedger.length,1);assert.equal(s.financeLedger[0].amount,300);
assert(!F.carePlan(fresh(),fresh().familyEvents.records[1],0,0,Infinity,rates));
assert(!F.carePlan(fresh(),fresh().familyEvents.records[1],0,0,0,{...rates,working:false}));
assert(!F.carePlan(fresh(),fresh().familyEvents.records[1],0,0,0,{...rates,availableWorkHours:2}));
const ordinary=fresh();ordinary.familyEvents.records[1].cardId='dinner';assert.equal(F.carePlan(ordinary,ordinary.familyEvents.records[1],0,0,0,rates),null);assert(!F.resolveCare(ordinary,1,0,0,0,rates));

// Execute the production time/pay wrappers with real coffee/shift income functions.
const noop=()=>{},node=()=>({classList:{add:noop,remove:noop}});
const c={console,setTimeout,clearTimeout,FamilyEvents:F,state:fresh(),slot:'a',key:x=>x,localStorage:{getItem:()=>null,setItem:noop},document:{getElementById:node,addEventListener:noop,body:node()},
 save:noop,openRoom:noop,currentCareerTime:()=>({free:5,weeklyHours:40,monthlyWork:160,workHoursDelta:0}),settleMonth:noop,showMonthlyAudit:noop,monthlyEvent:noop,finish:noop,openGame:noop,home:noop,showTown:noop,rollTown:noop,eventEligible:()=>true,requireIncident:noop,
 roundCash:n=>Math.round(n*100)/100,isRecoveryMonth:()=>false,coffeeIncomeMarkup:()=>'<section>income</section>',priceText:String,
 coffeeCareerData:noop,coffeeRecord:()=>null,coffeeWorking:()=>true,coffeeCalendar:()=>({year:1,month:2}),coffeeSeason:()=>({tips:300,name:'普通月',key:'normal'}),
 coffeeMonthlyIncome:null,calcMetrics(){const x=c.coffeeMonthlyIncome();return {careerIncome:x,grossSalary:x?x.total:32000/12,kContrib:0,remainingCF:x?x.total:32000/12,monthlyCF:x?x.recurring:32000/12};}};
c.state.salary=32000/12;c.window=c;vm.createContext(c);
const coffee=fs.readFileSync(require('path').join(__dirname,'../coffee.js'),'utf8');vm.runInContext(coffee.slice(coffee.indexOf('function coffeeMonthlyIncome(){'),coffee.indexOf('function finalizeCoffeeMonth(')),c);
const base=c.coffeeMonthlyIncome().total;vm.runInContext(fs.readFileSync(require('path').join(__dirname,'../family-home.js'),'utf8'),c);
assert(F.resolveCare(c.state,1,0,5,0,rates));let time=c.currentCareerTime();assert.equal(time.free,0);assert.equal(time.workHoursDelta,-7);assert.equal(time.monthlyWork,153);
let income=c.coffeeMonthlyIncome();assert.equal(income.total,c.roundCash(base-107.69-11.41));assert.equal(income.extraWages,-107.69);assert.equal(income.extraTips,-11.41);assert.equal(c.calcMetrics().grossSalary,income.total);assert(c.coffeeIncomeMarkup(income).includes('家庭照护请假 7h'));
const repeat=c.coffeeMonthlyIncome().total;assert.equal(repeat,income.total,'reading income does not deduct twice');c.state.month=2;assert.equal(c.coffeeMonthlyIncome().familyLeave,undefined);
// Generic jobs use the same salary deduction without fabricating tips.
c.state=fresh();c.state.job='普通岗位';c.coffeeWorking=()=>false;c.state.salary=32000/12;c.state.retirement={k401Rate:.06};
assert(F.resolveCare(c.state,1,0,5,0,{...rates,tipRate:0}));const m=c.calcMetrics();assert.equal(m.grossSalary,32000/12-107.69);assert.equal(c.state.salary,32000/12,'contract salary is unchanged');
console.log('PASS: exact missing hours, pet reserve, original care effects, wage/tip rates, same-month pay, reload/repeat/next-month guards, loan-before-payment, atomic shortage, other cards unchanged, production time/income/metrics wrappers.');
