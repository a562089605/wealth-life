const fs=require('fs'),vm=require('vm'),a=require('node:assert/strict');
let recovery=false,called=[],nodes={hobbyBtn:{onclick(){called.push('hobby')}},lifestyleBtn:{onclick(){called.push('life-menu')}}};
const c={state:{health:80,cash:1000},isRecoveryMonth:()=>recovery,healthTreatmentKind:h=>h<=15?'special':h<30?'ordinary':null,openHealthTreatment(){called.push('treatment')},spendConfirmed(k,n){c.state.cash-=n;called.push(k);return true},chooseLife(){called.push('life')},doSocial(){called.push('social')},completeCoffeeCourse(){called.push('course');return true},openCoffeeCourses(){called.push('course-menu')},openSocialPerson(){called.push('social-menu')},prepareAnnualMonth(){called.push('annual');return true},pauseAnnual(){called.push('paused')},$:id=>nodes[id]};
vm.createContext(c);vm.runInContext(fs.readFileSync('recovery-activity-guards.js','utf8'),c);
a.equal(c.spendConfirmed('hobbyPractice',90),true);a.equal(c.state.cash,910);a.equal(c.completeCoffeeCourse(),true);
recovery=true;c.state.health=60;called=[];
for(const k of ['hobbyPractice','lifestyle','socialMeal','socialCoffee','socialWalk'])a.equal(c.spendConfirmed(k,100),false);
c.chooseLife();c.doSocial();c.completeCoffeeCourse();c.openCoffeeCourses();c.openSocialPerson();nodes.hobbyBtn.onclick();nodes.lifestyleBtn.onclick();a.equal(c.prepareAnnualMonth(),false);
a.equal(c.state.cash,910);a.ok(called.includes('paused'));a.ok(called.every(x=>['treatment','paused'].includes(x)));
// Necessary charges remain possible during recovery, including delegated pet care.
for(const k of ['livingPayment','housingPayment','premiumsPayment','petCare','medicalTreatment'])a.equal(c.spendConfirmed(k,1),true);
a.equal(c.state.cash,905);
recovery=false;c.state.health=29;called=[];a.equal(c.spendConfirmed('hobbyPractice',90),false);a.deepEqual(called,['treatment']);
c.state.health=30;called=[];a.equal(c.completeCoffeeCourse(),true);a.deepEqual(called,['course']);
console.log('PASS: paid recovery and untreated low-health block elective effects, annual preparation pauses, financial/necessary/delegated care remains allowed, normal activity boundary preserved.');
