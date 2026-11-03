const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),U=require('../studio-events.js'),D=require('../housing-time-debt.js');
// Independent user-approved matrix: cash, consumed hours, happiness, energy, stress, health.
const expected={morning:[[0,0,4,0,-3,0],[0,0,3,2,-2,0]],cook:[[-20,2,5,-1,0,0],[-8,1,3,0,0,0],[-30,0,2,0,0,0]],corner:[[-60,3,5,-1,0,0],[0,2,3,-2,0,0]],cinema:[[-10,3,5,0,-4,0],[0,1,2,0,-2,0]],tea:[[-35,3,6,-1,-4,0],[0,0,0,0,0,0]],gaming:[[0,3,6,-1,-4,-1],[0,1,3,0,-2,0]],keepsake:[[40,1,2,0,0,0],[0,3,5,-1,0,0]],rain:[[0,1,3,2,-4,0],[0,1,2,2,-3,0]],fridge:[[0,2,3,-2,0,0],[0,1,2,-1,0,0]],keys:[[-100,1,0,0,1,0],[0,3,0,-2,1,0]],call:[[0,2,4,0,-3,0],[0,0,0,0,0,0]],noise:[[-15,1,0,0,1,0],[0,0,-2,0,2,0]]};
const fresh=()=>({month:1,housing:'studio',cash:1000,health:80,energy:50,happiness:50,stress:30});
const pending=(s,id)=>U.data(s).records[s.month]={pool:'studio',month:s.month,status:'pending',cardId:id};
assert.equal(U.cards.length,12);assert.equal(U.cards.reduce((n,c)=>n+c.choices.length,0),25);
for(const c of U.cards)for(const [i,o]of c.choices.entries()){
 const m=expected[c.id][i];assert.deepEqual(['cash','hours','happiness','energy','stress','health'].map(k=>o[k]||0),m);
 const s=fresh();pending(s,c.id);assert(U.resolve(s,1,c.id,i,100));assert.deepEqual([s.cash-1000,U.used(s),s.happiness-50,s.energy-50,s.stress-30,s.health-80],m);const snap=JSON.stringify(s);assert(!U.resolve(s,1,c.id,i,100));assert.equal(JSON.stringify(s),snap);assert(!s.familyEvents&&!s.sharedEvents);
 if(m[0])assert.equal(s.financeLedger[0].kind,m[0]>0?'studioIncome':'studioExpense');
 for(const [cash,free]of [[Math.max(0,-m[0]-1),100],[1000,Math.max(0,m[1]-1)]]){const x=fresh();x.cash=cash;const r=pending(x,c.id),before=JSON.stringify(x);if(U.missing(x,r,i,free).length){assert(!U.resolve(x,1,c.id,i,free));assert.equal(JSON.stringify(x),before);}}
}
for(const h of ['family','shared','rent1']){const s=fresh();s.housing=h;s.pendingHousingMove={key:'studio'};assert.equal(U.draw(s,()=>0).status,'none');}
let s=fresh();assert.equal(U.draw(s,()=>.5).status,'none');U.draw(s,()=>{throw Error('none reroll')});
s=fresh();const ids=[];for(let month=1;month<=12;month++){s.month=month;ids.push(U.draw(s,()=>0).cardId);}assert.equal(new Set(ids).size,12);
s=fresh();s.studioEvents={seen:Object.fromEntries(U.cards.map(c=>[c.id,1])),records:{}};for(let month=2;month<=7;month++){s.month=month;assert.equal(U.eligible(s).length,0);}s.month=8;assert.equal(U.eligible(s).length,12);
s=fresh();pending(s,'gaming');s.health=0;s.energy=0;s.stress=0;s.happiness=99;assert(U.resolve(s,1,'gaming',0,3));assert.deepEqual([s.health,s.energy,s.stress,s.happiness],[0,0,0,100]);
s=fresh();const r=pending(s,'corner');const rates={working:false,availableWorkHours:0};assert(D.resolve(s,U,'studioEvents',1,'corner',1,0,0,rates));assert.equal(s.housingTimeDebt.entries['studioEvents:1:corner'].remaining,2);assert.equal(s.cash,1000);s.month=2;assert.equal(D.allocate(s,{available:1}),1);assert.equal(D.allocate(s,{available:1}),1);s.month=3;assert.equal(D.allocate(s,{available:0}),0);s.month=4;assert.equal(D.allocate(s,{available:5}),1);
const ctx={state:{cash:1025},roundCash:n=>Math.round(n*100)/100};vm.createContext(ctx);const source=fs.readFileSync('batch.js','utf8');vm.runInContext(source.slice(source.indexOf('function auditRows('),source.indexOf('function showMonthlyAudit(')),ctx);const rows=ctx.auditRows({ledger:[{kind:'studioIncome',amount:40},{kind:'studioExpense',amount:15}],monthCashChange:25,monthOpeningCash:1000,grossSalary:0,tax:0,kContrib:0,passive:0,expenses:0,prepaidExpenses:0});assert.equal(rows.find(x=>x[0].startsWith('其他现金变化'))[1],0);
console.log('PASS: Studio approved 12/25 independent matrix, health/clamps, atomic resources, real occupancy, no reroll, unseen/cooldown, debt partial/repeat and finance audit.');
