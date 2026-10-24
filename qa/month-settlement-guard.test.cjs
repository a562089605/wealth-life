const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),path=require('path');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
let calls=0;const c={state:{month:11,turn:{index:9},housing:'rented'},pending:false,document:{querySelector:()=>null},$:()=>({classList:{contains:()=>false}}),settleMonthUnsafe(){calls++;c.state.month++;c.state.turn.index=0;},clearModals(){},save(){},render(){},showEvent(){},finish(){},console:{error(){}},window:{}};
vm.createContext(c);const core=read('core.js');vm.runInContext(core.slice(core.indexOf('let settlementInProgress=false;'),core.indexOf('// Keep existing random opportunity')),c);
// Exercise actual core wrapper with stubbed underlying business ledger, not a full money simulation.
c.settleMonth();assert.equal(calls,1);assert.equal(c.state.month,12);
// Core delegates an out-of-review request to its underlying entry gate; reproduce that gate.
c.settleMonthUnsafe=()=>{if(c.state.turn.index!==9)return;calls++;c.state.month++;c.state.turn.index=0;};c.settleMonth();assert.equal(calls,1);
c.state.turn.index=9;c.document.querySelector=()=>({});c.settleMonth();assert.equal(calls,1);c.document.querySelector=()=>null;
c.state.requiredIncident={status:'unpaid'};let incidents=0;c.openRequiredIncident=()=>incidents++;c.settleMonth();assert.equal(incidents,1);assert.equal(calls,1);delete c.state.requiredIncident;
c.settleMonthUnsafe=()=>{c.state.month++;throw Error('injected failure');};c.settleMonth();assert.equal(c.state.month,12);assert.equal(c.state.turn.index,9);
// Actual town wrapper blocks repeated settlement after month advance, including reload.
let townCalls=0;c.settleMonth=()=>{townCalls++;c.state.month++;};c.townEnabled=()=>true;
vm.runInContext(read('town.js').split('\n').find(l=>l.startsWith('const townSettlementBefore=')),c);
c.state.town={movement:{payExpected:13,resolved:false}};c.settleMonth();c.settleMonth();assert.equal(townCalls,1);assert.equal(c.state.month,13);
c.state=JSON.parse(JSON.stringify(c.state));c.settleMonth();assert.equal(townCalls,1);
c.state.month=12;c.state.town.movement.resolved=true;c.settleMonth();assert.equal(townCalls,1);
console.log('PASS: core modal/unpaid-incident gates, error rollback; town repeat-click/reload/month-advance guard. Underlying ledger and browser not covered.');
