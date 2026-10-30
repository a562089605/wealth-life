const fs=require('fs'),vm=require('vm'),a=require('node:assert/strict'),test=require('node:test'),SocialRecords=require('../social-records.js');
function fixture(){
 const c={SocialRecords,state:{month:0,people:[{id:'a',name:'同名',relation:50},{id:'b',name:'同名',relation:50}],cash:100,energy:70,social:40,happiness:60},base:10,saved:[],events:[],Math:Object.create(Math)};
 c.Math.random=()=>0;c.currentCareerTime=()=>({free:c.base});c.attributeModifier=()=>0;c.roleTrait=()=>({});c.relationStage=()=>'';c.finish=()=>{};c.openSocialPerson=()=>{};
 c.spendConfirmed=(kind,cost)=>{if(c.state.cash<cost)return false;c.state.cash-=cost;if(cost){c.state.financeLedger??=[];c.state.financeLedger.push({kind,cost})}return true};
 c.save=()=>c.saved.push(JSON.parse(JSON.stringify(c.state)));c.showEvent=(...args)=>c.events.push(args);vm.createContext(c);
 const source=fs.readFileSync('revision.js','utf8');vm.runInContext(source.slice(source.indexOf('const SOCIAL_SCENES='),source.indexOf('// Buyer offers')),c);
 vm.runInContext(fs.readFileSync('social-time.js','utf8'),c);return c;
}
function snap(c){return JSON.stringify(c.state)}
test('actual social handler atomically saves kind, hours, roll and actual changes',()=>{
 for(const [kind,hours,cost]of [['socialMeal',2,45],['socialCoffee',1,0],['socialWalk',1,0]]){
  const c=fixture();a.equal(c.doSocial(c.state.people[0],999,999,kind),true);const r=c.socialRecord(c.state.people[0]);
  a.equal(r.kind,kind);a.equal(r.hours,hours);a.equal(r.cost,cost);a.equal(c.state.cash,100-cost);a.equal(c.currentCareerTime().free,10-hours);
  a.equal(r.effects.energy,-2);a.equal(r.effects.social,3);a.equal(r.effects.happiness,4);a.equal(r.appliedGain,9);
  a.equal(c.saved.length,1);a.equal(c.saved[0].socialMonth.hours,hours);a.equal(c.saved[0].socialMonth.kind,kind);
  const after=snap(c);c.doSocial(c.state.people[0],cost,0,kind);a.equal(snap(c),after);a.equal(c.saved.length,1);
 }
});
test('same names with distinct IDs have independent quotas and cumulative hours; reload locks outcomes',()=>{
 const c=fixture();c.doSocial(c.state.people[0],0,0,'socialWalk');c.doSocial(c.state.people[1],45,0,'socialMeal');a.equal(c.currentCareerTime().free,7);a.equal(SocialRecords.all(c.state).length,2);
 c.state=JSON.parse(JSON.stringify(c.state));const before=snap(c);c.Math.random=()=>.99;c.doSocial(c.state.people[0],0,0,'socialCoffee');a.equal(snap(c),before);
 c.state.month++;a.equal(c.currentCareerTime().free,10);a.equal(c.doSocial(c.state.people[0],0,0,'socialCoffee'),true);
});
test('stale person from another save, removed contact and invalid kinds cannot debit',()=>{
 const c=fixture(),old=c.state.people[0];c.state=JSON.parse(JSON.stringify(c.state));let before=snap(c);a.equal(c.doSocial(old,45,0,'socialMeal'),false);a.equal(snap(c),before);
 const p=c.state.people.shift();before=snap(c);a.equal(c.doSocial(p,45,0,'socialMeal'),false);a.equal(snap(c),before);
 a.equal(c.doSocial(c.state.people[0],0,0,'madeUpFreeAction'),false);a.equal(snap(c),before);a.equal(c.saved.length,0);
});
test('resource recheck after preview and failed payment have no partial effects',()=>{
 const c=fixture(),p=c.state.people[0];c.openSocialPerson(0);const callback=c.events.at(-1)[4][0][1];c.base=1;let before=snap(c);callback();a.equal(snap(c),before);a.equal(c.saved.length,0);
 c.base=10;c.state.cash=44;before=snap(c);callback();a.equal(snap(c),before);a.equal(c.saved.length,0);
 c.state.cash=0;c.base=1;a.equal(c.doSocial(p,15,0,'socialCoffee'),true);a.equal(c.currentCareerTime().free,0);a.equal(c.state.cash,0);
});
test('failure and status bounds preserve existing outcomes while recording actual capped deltas',()=>{
 const c=fixture();c.Math.random=()=>.999;c.state.energy=1;c.state.social=99;c.state.happiness=1;c.state.people[0].relation=100;
 c.doSocial(c.state.people[0],0,0,'socialWalk');const r=c.socialRecord(c.state.people[0]);a.equal(r.success,false);a.equal(r.gain,2);a.equal(r.appliedGain,0);a.equal(r.effects.energy,-1);a.equal(r.effects.social,1);a.equal(r.effects.happiness,-1);a.equal(c.events.at(-1)[3][0][1],'+0');
});
test('legacy receipts retain old cost and absent hours without retroactive effects',()=>{
 const c=fixture();c.state.socialMonth={month:0,person:'a',cost:15,scene:'原结果',success:true,gain:7};let before=snap(c);a.equal(c.currentCareerTime().free,10);c.doSocial(c.state.people[0],0,0,'socialCoffee');a.equal(snap(c),before);a.equal(c.saved.length,0);
 c.doSocial(c.state.people[1],0,0,'socialCoffee');a.equal(c.currentCareerTime().free,9);a.equal(SocialRecords.all(c.state)[0].hours,undefined);a.equal(SocialRecords.all(c.state)[0].kind,undefined);a.equal(SocialRecords.all(c.state)[0].cost,15);
});
test('actual recovery wrapper blocks health below30 and paid recovery without effects;30 boundary allows',()=>{
 const c=fixture();let recovering=false,opened=0;
 Object.assign(c,{isRecoveryMonth:()=>recovering,healthTreatmentKind:h=>h<30?'ordinary':null,openHealthTreatment:()=>opened++,chooseLife(){},completeCoffeeCourse(){},openCoffeeCourses(){},prepareAnnualMonth(){},pauseAnnual(){},$:()=>({onclick(){}})});
 vm.runInContext(fs.readFileSync('recovery-activity-guards.js','utf8'),c);
 for(const health of [0,15,16,29]){c.state.health=health;const before=snap(c);c.doSocial(c.state.people[0],0,0,'socialWalk');a.equal(snap(c),before)}
 recovering=true;c.state.health=80;let before=snap(c);c.doSocial(c.state.people[0],0,0,'socialWalk');a.equal(snap(c),before);
 recovering=false;c.state.health=30;a.equal(c.doSocial(c.state.people[0],0,0,'socialWalk'),true);a.equal(opened,5);
});
test('actual month-end uses relationship settlement for normal and recovery months',()=>{
 const source=fs.readFileSync('core.js','utf8');a.equal(source.includes('p.relation-.22'),false);
 const line=source.split('\n').find(l=>l.includes('RelationshipRules.settleContacts(s,month-1)'));a.ok(line);
 for(const recovery of [false,true]){const c={RelationshipRules:require('../relationship-rules.js'),s:{month:2,people:[{id:'a',relation:50},{id:'b',relation:.1},{id:'c',relation:80,lastContactMonth:1}]},settlement:{},month:2,recovery};vm.createContext(c);vm.runInContext(line,c);a.equal(c.s.people[0].relation,49);a.equal(c.s.people[1].relation,0);a.equal(c.s.people[2].relation,80);vm.runInContext(line,c);a.equal(c.s.people[0].relation,49);}
});
