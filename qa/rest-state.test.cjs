const fs=require('fs'),vm=require('vm'),a=require('node:assert/strict'),path=require('path');let free=12,reserve=0,recovery=false;const c={state:{month:0,cash:500,health:99,energy:98,stress:1},Math,isRecoveryMonth:()=>recovery,necessaryPetCareHours:()=>reserve,currentCareerTime:()=>({free}),save(){},render(){},showEvent(){},finish(){},openHealthTreatment(){},$:()=>({})};vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(__dirname,'../rest-state.js'),'utf8'),c);a.equal(c.state.cash,500);a.equal(c.confirmExtraRest(0,0),true);a.equal(c.state.health,100);a.equal(c.state.energy,100);a.equal(c.state.stress,0);a.equal(c.state.cash,500);a.equal(c.currentCareerTime().free,8);a.equal(c.confirmExtraRest(0,0),false);reserve=5;a.equal(c.confirmExtraRest(0,1),false);reserve=0;a.equal(c.confirmExtraRest(0,1),true);a.equal(c.currentCareerTime().free,4);recovery=true;a.equal(c.confirmExtraRest(0,2),false);recovery=false;c.state.health=29;a.equal(c.confirmExtraRest(0,2),false);
for(const [energy,stress,loss]of [[30,69,0],[29,69,2],[20,70,4],[19,79,7],[19,80,10],[20,80,7],[30,80,5]]){const s={health:80,energy,stress};const r=c.applyMonthlyHealthEffects(s,11);a.equal(80-s.health,loss);a.equal(c.applyMonthlyHealthEffects(s,11),r);a.equal(80-s.health,loss);}
console.log('PASS: free 4h rest actual capped effects, stale confirmation, nursing reservation, no low-health bypass; health penalty threshold combinations add once per month.');

// Each fresh action rests once; failed persistence rolls back all rest effects.
c.state.health=50;c.state.energy=50;c.state.stress=50;c.state.happiness=50;free=24;
let events=0;c.showEvent=()=>events++;c.openExtraRest=()=>{};
const count=c.monthlyRest().entries.length;
a.equal(c.confirmExtraRest(0,count),true);a.equal(c.confirmExtraRest(0,count+1),true);a.equal(events,0);
const snapshot=JSON.stringify(c.state);c.save=()=>false;a.equal(c.confirmExtraRest(0,count+2),false);a.equal(JSON.stringify(c.state),snapshot);
c.save=()=>{throw Error('storage full')};a.equal(c.confirmExtraRest(0,count+2),false);a.equal(JSON.stringify(c.state),snapshot);
console.log('Direct rest, guards and save rollback passed');
