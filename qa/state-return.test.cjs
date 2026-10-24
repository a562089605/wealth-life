const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),path=require('path'),read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');let modal,settlements=0,rolls=0,free=10,group=null;
const c={state:{month:0,energy:19,stress:80,happiness:19,cash:10000,townMode:true,town:{position:5,rolls:1,explorationMonth:0,movement:{month:0,to:5,resolved:false}}},Math,currentCareerTime:()=>({baseFree:100,workHoursDelta:0,free}),townVisible:true,document:{querySelector:()=>null},townEnabled:()=>true,coffeeRecord:()=>null,shiftRecord:()=>group,showEvent:(...a)=>modal=a,save(){},$:()=>({}),clearModals(){},openShiftFollow(){},townHome(){},townState:()=>c.state.town,settleMonth(){settlements++;c.state.month++;},finish(){},rollTown(){rolls++;},resumeTownMove(){},openGame(){},showTown(){},pending:false};vm.createContext(c);vm.runInContext(read('time-ledger.js'),c);vm.runInContext(read('time-flow.js'),c);
c.rollTown();assert.equal(rolls,0);assert.equal(c.state.forcedTimeReturn.reasons.length,3);const confirm=modal[4][0][1];confirm();confirm();assert.equal(settlements,1);
// Same low state in new month at home blocks departure without earning another wage.
c.rollTown();assert.equal(modal[1],'先在房屋调整状态');assert.equal(settlements,1);
// Exact allowed boundaries; ordinary time remains required.
c.state.energy=20;c.state.stress=79;c.state.happiness=20;assert.equal(c.explorationReturnReasons().length,0);free=0;assert.equal(c.explorationReturnReasons().length,1);
// Defer return until the current career follow-up is complete.
free=3;c.state.month=2;c.state.town.explorationMonth=2;c.state.energy=19;group={status:'followup',follow:{settled:false}};assert.equal(c.markExplorationReturn(),false);group.follow.settled=true;group.status='resolved';assert.equal(c.markExplorationReturn(),true);assert.equal(c.state.forcedTimeReturn.month,2);
c.state=JSON.parse(JSON.stringify(c.state));c.openGame();assert.equal(modal[1],'返回房屋结算');assert.equal(rolls,0);
console.log('PASS: merged state reasons, exact thresholds, one settlement, low-state home gate, event group completion and reload return recovery. Full health treatment and real browser not covered.');
