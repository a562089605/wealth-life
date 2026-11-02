const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),F=require('../family-events.js');
let saved=[],audit=0,medical=0,handovers=0,draws=0,failSave=false;
const storage=new Map(),nodes=new Map();const node=id=>nodes.get(id)||{classList:{add(){},remove(){}},hidden:false};
const c={console,setTimeout,clearTimeout,key:s=>'slot'+s,slot:'test',localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},document:{getElementById:node,addEventListener(){},body:{classList:{add(){},remove(){}}}},
 state:{month:0,housing:'family',cash:1000,health:80,roomLocation:'home'},townVisible:false,pending:false,
 FamilyEvents:{...F,draw(s){draws++;return F.draw(s,()=>.9);}},save(){if(failSave)return false;saved.push(JSON.stringify(c.state));storage.set('slottest',JSON.stringify(c.state));},openRoom(){c.townVisible=false;c.state.roomLocation='home';},currentCareerTime:()=>({free:100}),
 townEnabled:()=>true,townState:()=>c.state.town??={position:7,rolls:0,movement:null,history:[]},townPending:()=>!!c.state.town?.movement&&!c.state.town.movement.resolved,
 healthTreatmentKind:h=>h<30,unfinishedTreatment:()=>false,isRecoveryMonth:()=>false,housingHandoverDue:()=>!!c.state.moveDue,showGameOver(){},openRequiredIncident(){},openHealthTreatment(){medical++;},openHousingHandover(){handovers++;},clearModals(){},
 settleMonth(){if(c.state.town.movement.payExpected<=c.state.month)return;c.state.month++;c.showMonthlyAudit();},showMonthlyAudit(){audit++;},monthlyEvent(){},finish(){},openGame(){},home(){},showTown(){c.townVisible=true;c.state.roomLocation='town';},rollTown(){},resumeTownMove(){c.state.resumed=true;},resolveTownMove(){c.state.town.movement.resolved=true;},eventEligible:()=>true,requireIncident(){},necessaryPetCareHours:()=>0};
c.window=c;vm.createContext(c);vm.runInContext(fs.readFileSync(require('path').join(__dirname,'../family-home.js'),'utf8'),c);
c.openRoom();assert.equal(c.state.month,0);c.showTown();c.townHome();assert.equal(c.state.month,1);assert.equal(audit,1);assert.equal(draws,0,'draw waits for settlement review');c.monthlyEvent();assert.equal(draws,1);assert.equal(c.state.homeArrival.status,'completed');assert.equal(c.state.town.position,7);c.openRoom();c.openRoom();c.finish();assert.equal(c.state.month,1);assert.equal(draws,1);
// Reload and completed home navigation cannot reroll the none result.
c.openGame();assert.equal(draws,1);
// Existing map event is resumed rather than replaced by a synthetic return.
c.state.town.movement={id:2,to:8,opened:true,resolved:false};c.showTown();c.townHome();assert(c.state.resumed);assert.equal(c.state.month,1);assert.equal(c.state.town.movement.id,2);
// A pending arrival gives medical and housing handover precedence over all draws.
c.state.homeArrival={targetMonth:1,status:'ready'};c.state.health=20;c.openRoom();assert.equal(medical,1);assert.equal(draws,1);c.state.health=80;c.state.moveDue=true;c.openRoom();assert.equal(handovers,1);assert.equal(draws,1);
c.state.moveDue=false;c.state.housing='studio';delete c.state.familyEvents.records[1];c.openRoom();assert.equal(c.state.familyEvents.records[1].status,'none');assert.equal(c.state.homeArrival.status,'completed');
// Older saves do not get an unsolicited arrival or a new event; existing money survives.
c.state={month:22,housing:'family',cash:1234,health:80,roomLocation:'home'};c.openGame();c.openRoom();assert.equal(c.state.cash,1234);assert.equal(c.state.month,22);assert.equal(c.state.familyEvents,undefined);
console.log('PASS: home entry vs map return, exactly one settlement, review-before-draw, none-result reload, unresolved map event, medical/handover priority, actual post-move housing and old saves.');
