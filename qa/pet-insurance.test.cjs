const a=require('node:assert/strict'),I=require('../pet-insurance.js'),E=require('../pet-events.js'),A=require('../pet-adoption-entry.js');
const fees={dog:55,cat:40,tortoise:10,chameleon:15,gecko:10,spider:10,crocodile:50};
const seed=id=>({month:2,cash:5000,energy:50,happiness:50,stress:50,pets:[{species:id,type:A.pets[id].type,name:'伙伴',adoptMonth:0}],insurance:{health:{active:true,monthly:220,coverage:1}},monthlyPayments:{month:2,premiums:0},town:{movement:{id:1,to:2,resolved:false},history:[]}});
function eventQuote(s,index,id){return E.quote(s,id,{p:s.pets[index],index,sp:s.pets[index].species});}
a.deepEqual(I.monthly,fees);
for(const [id,fee]of Object.entries(fees)){
 const s=seed(id),q=I.quote(s,0),before=JSON.stringify(s);a.equal(q.monthly,fee);a.equal(q.due,fee);a.equal(I.held(s,s.pets[0]),null);a.equal(I.premiums(s),220);a.equal(JSON.stringify(s),before);a.equal(eventQuote(s,0,'unwell').cost,E.illness[id]);
 for(const fail of [()=>false,()=>{throw Error('storage failed');}]){a.equal(I.confirm(s,0,q.token,fail).reason,'save');a.equal(JSON.stringify(s),before);}
 const bought=I.confirm(s,0,q.token,()=>true);a.equal(bought.ok,true);a.equal(s.cash,5000-fee);a.equal(s.monthlyPayments.premiums,fee);a.equal(s.insurance[s.pets[0].insuranceKey].coverage,1);a.equal(I.premiums(s)-s.monthlyPayments.premiums,220);a.equal(I.confirm(s,0,q.token,()=>true).ok,false);
 a.equal(eventQuote(s,0,'unwell').cost,0);const accidental=eventQuote(s,0,'accident');a.equal(accidental.cost,id==='cat'?0:50);a.equal(accidental.gross,id==='cat'?500:50);
 s.pets.push({species:'cat',type:'猫',name:'未投保的伙伴',adoptMonth:0});a.equal(I.held(s,s.pets[1]),null);a.equal(eventQuote(s,1,'unwell').cost,200);a.equal(eventQuote(s,1,'accident').cost,500);
 const reload=JSON.parse(JSON.stringify(s));a.equal(eventQuote(reload,0,'unwell').cost,0);a.equal(eventQuote(reload,1,'unwell').cost,200);s.month++;a.equal(I.premiums(s),220+fee);a.equal(I.quote(s,0).due,0,'held policy is renewed through existing premium bill');
}
// All seven policies coexist, each paid once and bound only to its selected pet.
{const s=seed('dog');s.pets=Object.keys(fees).map(id=>({species:id,type:A.pets[id].type,name:id,adoptMonth:0}));let spent=0;for(let i=0;i<s.pets.length;i++){const q=I.quote(s,i);a.ok(q.monthly===fees[s.pets[i].species]);a.equal(I.confirm(s,i,q.token,()=>true).ok,true);spent+=q.monthly;}a.ok(spent===190);a.equal(s.cash,4810);a.equal(s.monthlyPayments.premiums,190);a.equal(I.premiums(s),410);a.equal(new Set(s.pets.map(p=>p.insuranceKey)).size,7);}
// Existing combined 45 contract is preserved; explicit historic percentages also stay intact.
for(const coverage of [undefined,.8,0,1]){const s=seed('cat');s.insurance.pet={name:'旧宠物保险',active:true,monthly:45,...coverage===undefined?{}:{coverage}};const before=JSON.stringify(s),q=I.quote(s,0);a.equal(q.monthly,45);a.ok(q.held);a.equal(eventQuote(s,0,'unwell').cost,Math.round(200*(1-(coverage??1))));a.equal(JSON.stringify(s),before);a.equal(I.confirm(s,0,q.token,()=>true).reason,'stale');}
// Future, inactive and malformed policies do not confer current medical cover; health is separate.
for(const policy of [{active:false,monthly:45,coverage:1},{active:true,monthly:45,coverage:1,startMonth:3},{active:true,monthly:45,coverage:-1}]){const s=seed('dog');s.insurance.pet=policy;a.equal(eventQuote(s,0,'unwell').cost,200);}
{const s=seed('dog');s.pets[0].insuranceKey='health';a.equal(eventQuote(s,0,'unwell').cost,200);}
// No retroactive discount on a drawn/saved event after buying insurance.
{const s=seed('cat');let n=0;const r=E.draw(s,s.town.movement,{free:10,names:['Alex'],jobs:['老师'],random:()=>[.1,.3,0][n++]??0});a.equal(r.id,'unwell');const raw=JSON.stringify(r);const q=I.quote(s,0);a.equal(I.confirm(s,0,q.token,()=>true).ok,true);a.equal(JSON.stringify(E.draw(s,s.town.movement,{free:10})),raw);a.equal(r.quote.cost,200);a.equal(eventQuote(s,0,'unwell').cost,0);}
for(const change of [s=>s.month++,s=>s.pets[0].name='另一个',s=>s.insurance.auto={active:true,monthly:165}]){const s=seed('dog'),q=I.quote(s,0);change(s);const before=JSON.stringify(s);a.equal(I.confirm(s,0,q.token,()=>true).reason,'stale');a.equal(JSON.stringify(s),before);}
{const s=seed('crocodile');s.cash=29;const q=I.quote(s,0),before=JSON.stringify(s);a.equal(I.confirm(s,0,q.token,()=>true).reason,'cash');a.equal(JSON.stringify(s),before);}
console.log('PASS optional seven-species prices, atomic payment/rollback/retry, per-pet medical100/property excluded, uninsured pet self-pay, old45 and explicit historic rates, no retroactive repricing, aggregate receipts and stale/shortage guards.');

// Full cover removes money cost only; original medical time/effects and rollback remain.
{const s=seed('cat'),q=I.quote(s,0);I.confirm(s,0,q.token,()=>true);s.cash=0;let n=0;const r=E.draw(s,s.town.movement,{free:10,names:['Alex'],jobs:['老师'],random:()=>[.1,.9,0][n++]??0});a.equal(r.id,'accident');a.equal(r.quote.cost,0);const before=JSON.stringify(s);a.equal(E.atomic(s,()=>E.execute(s,r.key,{free:10}),()=>false),false);a.equal(JSON.stringify(s),before);a.equal(E.atomic(s,()=>E.execute(s,r.key,{free:10}),()=>true),true);a.equal(s.cash,0);a.equal(s.petMapEvents.hours[2],4);a.equal(s.stress,53);}
