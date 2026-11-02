const assert=require('node:assert/strict'),F=require('../family-events.js');
const fresh=()=>({month:1,housing:'family',cash:1000,energy:70,stress:30,happiness:60});
let s=fresh(),calls=0,r=F.draw(s,()=>{calls++;return 0});assert.equal(r.cardId,'lamplight');assert.equal(calls,2);
const saved=JSON.parse(JSON.stringify(s));F.draw(saved,()=>{throw Error('reload reroll')});assert.deepEqual(saved,s);
assert(F.resolve(s,1,r.cardId,0,100));assert.equal(s.happiness,64);assert.equal(s.stress,27);assert.equal(F.used(s),1);const after=JSON.stringify(s);assert(!F.resolve(s,1,r.cardId,0,100));assert.equal(JSON.stringify(s),after);
for(let month=2;month<=7;month++){s.month=month;assert(!F.eligible(s).some(c=>c.id==='lamplight'));}s.month=8;assert(!F.eligible(s).some(c=>c.id==='lamplight'),'unseen prioritized even when cooldown expired');
// All twelve, including the red envelope, are available in any calendar month.
s=fresh();const ids=[];for(let month=1;month<=12;month++){s.month=month;ids.push(F.draw(s,()=>0).cardId);}assert.equal(new Set(ids).size,12);assert(ids.includes('blessing'));s.month=13;assert.equal(F.eligible(s)[0].id,'lamplight');
s=fresh();F.data(s).seen=Object.fromEntries(F.cards.map(c=>[c.id,1]));s.month=7;assert.equal(F.eligible(s).length,0);s.month=8;assert.equal(F.eligible(s).length,12);
s=fresh();r=F.draw(s,()=>.5);assert.equal(r.status,'none');F.draw(s,()=>{throw Error('no-card rerolled')});
s=fresh();s.housing='studio';s.pendingHousingMove={key:'family'};assert.equal(F.draw(s,()=>0).status,'none');
// Every option has exactly its approved deltas; no implicit refusal penalties or health changes.
for(const c of F.cards)for(let i=0;i<c.choices.length;i++){
 s=fresh();const d=F.data(s);d.records[1]={month:1,cardId:c.id,status:'pending'};const o=c.choices[i];
 assert(F.resolve(s,1,c.id,i,100));for(const k of ['cash','energy','stress','happiness'])assert.equal(s[k],fresh()[k]+(o[k]||0),c.id+' '+i+' '+k);assert.equal(F.used(s),o.hours);assert.equal(s.health,undefined);
}
// Cost/time shortage is atomic, including two compulsory care options.
for(const [id,index,cash,free] of [['dinner',0,199,100],['portrait',0,349,100],['care',0,1000,11],['care',1,299,100],['flowers',1,1000,2]]){
 s=fresh();s.cash=cash;F.data(s).records[1]={month:1,cardId:id,status:'pending'};const before=JSON.stringify(s);assert(!F.resolve(s,1,id,index,free));assert.equal(JSON.stringify(s),before);
}
s=fresh();F.data(s).records[1]={month:1,cardId:'care',status:'pending'};assert(!F.resolve(s,1,'care',0,12,1));assert(!F.resolve(s,0,'care',0,100));
assert(F.cards.find(c=>c.id==='flowers').choices.every(o=>o.hours===3));assert.equal(F.cards.find(c=>c.id==='blessing').choices[0].cash,500);assert.equal(F.cards.find(c=>c.id==='portrait').choices[0].cash,-350);
console.log('PASS: twelve cards, all 23 choices, 50% boundary, saved none/result, actual housing, unseen priority, six full cooldown months, repeat/stale clicks, costs/time/pet reserves atomic.');
