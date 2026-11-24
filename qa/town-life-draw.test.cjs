const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const P = require('../pet-events');
const R = require('../relationship-life-cards');
const S = require('../shared-interest-selection');
const C = require('../shared-interest-cards');

let dailyAvailable, appointmentDue, opened, saveWorks;
const ctx = vm.createContext({
  PetMapEvents:P, RelationshipLifeCards:R, SharedInterestSelection:S, SharedInterestCards:C,
  NPC_NAMES:['Alex'], NPC_JOBS:['老师'], slot:1, key:String,
  document:{addEventListener(){}},
  localStorage:{getItem:()=>null},
  townEnabled:()=>true, townMoveType:move=>move.type,
  currentCareerTime:()=>({free:15}),
  save:()=>saveWorks,
  hasMapLifeCard:()=>dailyAvailable, mapLifeAppointmentDue:()=>appointmentDue,
  resolveTownMove:()=>{ctx.state.town.movement.resolved=true;opened='none';},
  openMapLife:(move,appointment)=>{move.mapLife={};opened=appointment?'appointment':'daily';},
  openTownLanding:()=>{opened='other';},
  RelationshipLifePages:{canOpen:()=>true,open:()=>{opened='relationship';}},
  SharedInterestPages:{open:()=>{opened='interest';}},
  showEvent:(...args)=>{ctx.retry=args[4][0][1];},
  markExplorationReturn(){}, openForcedTimeReturn(){}, finish(){},
  home(){}, openGame(){}, openRoom(){}, rollTown(){}
});
ctx.window=ctx;
const source = fs.readFileSync('pet-events-ui.js','utf8');
const start = source.indexOf(' function show()');
const end = source.indexOf(' const timeBefore=',start);
// Use the real landing and persistence code with a stand-in for the visual overlay.
vm.runInContext(source.slice(0,start)+
  " function show(){return window.onPetOpen();}\n"+source.slice(end),ctx);
ctx.onPetOpen=()=>{opened='pet';};

function seed({pet=true, relationship=true, interest=true, daily=true}={}){
  dailyAvailable=daily;
  appointmentDue=false;
  saveWorks=true;
  opened=null;
  ctx.retry=null;
  ctx.state={
    month:2, cash:1000, job:relationship?'咖啡师':'', salary:3000,
    pets:pet?[{species:'dog',name:'Bobo',health:80}]:[],
    people:interest?[{id:'friend',name:'Alex',interests:['摄影']}]:[],
    hobbyLearning:{xp:{photography:50}},
    town:{movement:{id:1,type:'life',month:2,opened:false}}
  };
}
function roll(n){
  vm.runInContext('Math.random=()=>'+n,ctx);
  ctx.openTownLanding();
  return opened;
}

seed();
assert.ok(S.groups(ctx.state).length,'interest fixture is eligible');
for(const [n,expected] of [[0,'daily'],[.25,'pet'],[.5,'relationship'],[.75,'interest']]){
  seed();
  assert.equal(roll(n),expected);
  assert.equal(roll(.99),expected,'resume the saved card without drawing again');
}
for(const [n,expected] of [[.32,'daily'],[.34,'relationship'],[.67,'interest']]){
  seed({pet:false});
  assert.equal(roll(n),expected);
}
seed({daily:false,pet:false,relationship:false,interest:false});
assert.equal(roll(0),'none');
seed();
appointmentDue=true;
assert.equal(roll(.99),'appointment');
seed();
saveWorks=false;
assert.equal(roll(.75),null);
assert.equal(ctx.state.town.movement.opened,false);
saveWorks=true;
vm.runInContext('Math.random=()=>0',ctx);
ctx.retry();
assert.equal(opened,'interest','save retry preserves the selected category and card');
console.log('PASS town life category odds, excluded pools, saved resume, appointments and save retry');
