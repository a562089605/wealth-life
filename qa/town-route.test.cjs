const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(require('path').join(__dirname,'../town.js'),'utf8');
const c={state:{townMode:true,housing:'rented',month:0},save(){},render(){},resumeTownMove(){},openHousing(){throw Error('unexpected housing')},openRequiredIncident(){},showRecovery(){},document:{querySelector:()=>null},Math:Object.create(Math)};
vm.createContext(c);vm.runInContext(source.match(/const TOWN_TYPES=.*;/)[0]+'\n'+source.match(/function townState\(\).*\n/)[0]+source.match(/function townPending\(\).*\n/)[0]+source.match(/function townEnabled\(\).*\n/)[0]+source.slice(source.indexOf('function rollTown(){'),source.indexOf('function resumeTownMove(){')),c);
const types=vm.runInContext('TOWN_TYPES',c);assert.equal(types.length,24);assert.deepEqual(Array.from(types).map((t,i)=>t==='payday'?i+1:null).filter(Boolean),[1,7,13,19]);
assert.equal(types.filter(t=>t==='opportunity').length,5);
for(let from=0;from<24;from++)for(let die=1;die<=6;die++){
 c.state={townMode:true,housing:'rented',month:11,town:{position:from,rolls:0,movement:null,history:[]}};c.Math.random=()=>(die-.5)/6;c.rollTown();const m=c.state.town.movement;assert.equal(m.to,(from+die)%24);assert.equal(m.payExpected,types[m.to]==='payday'?12:null);const before=c.state.town.rolls;c.rollTown();assert.equal(c.state.town.rolls,before);
}
console.log('PASS: 144 start/die combinations; landing-only payday, year boundary target, pending movement blocks repeat roll.');
