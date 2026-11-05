const a=require('node:assert/strict'),A=require('../pet-adoption-entry.js');
const adopt=(s,id,save,name='测试伙伴')=>A.confirm(s,id,save,name);
const expected={dog:[550,50],cat:[450,80],crocodile:[2300,300],gecko:[395,35],spider:[208,18],tortoise:[435,35],chameleon:[545,45]};
for(const [id,[total,monthly]]of Object.entries(expected)){const s={month:3,cash:10000,happiness:68,pets:[]},before=JSON.stringify(s);a.equal(A.quote(s,id).total,total);a.equal(A.quote(s,id).monthly,monthly);a.equal(JSON.stringify(s),before);let saved;const result=adopt(s,id,()=>{saved=JSON.stringify(s);return true;});a.equal(result.ok,true);a.equal(s.cash,10000-total);a.equal(s.pets.length,1);a.equal(s.pets[0].adoptMonth,3);a.equal(s.happiness,74);a.equal(JSON.stringify(s),saved);a.equal(adopt(s,id,()=>true).ok,false);a.equal(s.cash,10000-total);a.equal(s.financeLedger.length,1);}
for(const save of [()=>false,()=>{throw Error('quota')}]){const s={month:0,cash:3000,happiness:99,pets:[],nested:{contract:{deposit:900}}},before=JSON.stringify(s);a.equal(adopt(s,'crocodile',()=>{s.pets[0].care={nextAnnual:12};return save();}).reason,'save');a.equal(JSON.stringify(s),before);a.equal(adopt(s,'crocodile',()=>true).ok,true);a.equal(s.cash,700);a.equal(s.happiness,100);}
const s={month:0,cash:1999,happiness:60,pets:[]},before=JSON.stringify(s);a.equal(adopt(s,'crocodile',()=>true).reason,'cash');a.equal(JSON.stringify(s),before);
console.log('PASS: seven live prices, preview without mutations, exact one-time payment, original happiness, duplicate/insufficient rejection, save-failure rollback and retry.');

for(const name of [undefined,"","   "]){const s={month:0,cash:3000,pets:[]},before=JSON.stringify(s);a.equal(A.confirm(s,"dog",()=>true,name).reason,"name");a.equal(JSON.stringify(s),before);}
