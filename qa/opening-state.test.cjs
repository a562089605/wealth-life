const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),path=require('path');
const root=path.join(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const nodes={job:{value:'barista'},lifeGoal:{value:'freedom'},start:{},cancel:{},newGame:{}};
const saves=[];const ctx={state:null,JOBS:{barista:['咖啡师',32000,2700,0,{},'highschool']},LIFE_GOALS:{},$:id=>nodes[id]||(nodes[id]={}),inferDomain:()=> 'hospitality',makePeople:()=>[],save:()=>saves.push(JSON.parse(JSON.stringify(ctx.state))),openGame:()=>{},showEvent:()=>{},window:{},setTimeout:()=>{}};
vm.createContext(ctx);
vm.runInContext(read('index.html').split('\n').find(l=>l.includes("$('start').onclick=()=>{const j=JOBS")),ctx);
vm.runInContext(read('core.js').split('\n').find(l=>l.startsWith('const startBase=')),ctx);
nodes.start.onclick();
for(const s of saves){assert.equal(s.cash,10000);assert.equal(s.expenses,800);assert.equal(s.baseLiving,800);assert.equal(s.livingBudgetVersion,1);assert.equal(s.job,'咖啡师');assert.equal(s.education,'highschool');assert.equal(s.age,20);assert.equal(s.month,0);assert.equal(s.annualSalary,32000);assert.equal(s.salary,32000/12);assert.equal(s.assets.length,0);assert.equal(Object.keys(s.debt).length,0);assert.equal(s.history.length,0);assert.equal(s.yearStartCash,10000);assert.equal(s.yearStartNetWorth,10000);}
assert.equal(ctx.state.turn.startCash,10000);assert.equal(ctx.state.turn.month,0);
ctx.save();assert.equal(ctx.state.cash,10000);
for(const file of ['core.js','coffee.js','town.js','annual.js']){assert.ok(read('index.html').includes(file+'?v='+(file==='core.js'?'28.2-recovery1':'28.2-start1')));assert.ok(read('sw.js').includes(file+'?v='+(file==='core.js'?'28.2-recovery1':'28.2-start1')));}
console.log('PASS: actual opening initializer and core wrapper, all initial snapshots, no advance wages, opening ledger, cache URL alignment. Browser and old-save migration not covered.');
