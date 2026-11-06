const a=require('node:assert/strict'),fs=require('fs'),P=require('../pet-events.js');
const expected=JSON.parse(fs.readFileSync('design/pet-events-expansion-20261105/approved-manifest.json','utf8')).cards;
const kinds=['companion','unwell','social','surprise','accident'],species=Object.keys(P.companions);
const seed=(sp='dog')=>({month:2,cash:5000,energy:50,happiness:50,stress:50,age:25,city:'orlando',pets:[{species:sp,type:sp,name:'伙伴',adoptMonth:0}],people:[],town:{movement:{id:1,to:2,resolved:false},history:[]}});
function draw(s,id,pet=0,free=10){let n=0;const available=kinds.filter(k=>P.choices(s,k,free).length);return P.draw(s,s.town.movement,{free,names:['Maya','Alex'],jobs:['老师'],random:()=>[.1,(available.indexOf(id)+.5)/available.length,pet,.2,.1,.3][n++]??0});}
a.equal(Object.keys(P.cards).length,35);a.deepEqual(P.weights,{companion:20,unwell:20,social:20,surprise:20,accident:20});
for(const c of expected){const s=seed(c.species),r=draw(s,c.kind),q=r.quote;a.equal(r.id,c.kind);a.equal(q.title,c.title);a.equal(q.species,c.species);a.ok(fs.existsSync(q.art));
 for(const k of ['cost','hours','energy','happiness','stress'])a.equal(q[k]||0,c.quote[k]||0,c.id+' '+k);
 const before=JSON.stringify(s);a.equal(P.draw(s,s.town.movement,{free:10}),r);a.equal(JSON.stringify(s),before);
 a.equal(P.atomic(s,()=>P.execute(s,r.key,{free:10}),()=>false),false);a.equal(JSON.stringify(s),before);
 a.equal(P.atomic(s,()=>P.execute(s,r.key,{free:10}),()=>true),true);a.equal(s.cash,5000-q.cost);
 for(const k of ['energy','happiness','stress'])a.equal(s[k],50+(q[k]||0));a.equal(s.petMapEvents.hours[2],q.hours);a.equal(s.town.history.length,1);a.equal(P.execute(s,r.key,{free:10}),false);
 if(c.kind==='social'){a.equal(s.people.length,1);a.equal(s.people[0].relation,10);}
 if(c.kind!=='companion'){a.equal(P.choices(s,c.kind,10).length,0);s.pets.push({species:c.species==='dog'?'cat':'dog'});a.equal(P.choices(s,c.kind,10).length,0);s.month++;a.equal(P.choices(s,c.kind,10).length,2);}else a.equal(P.choices(s,c.kind,10).length,1);
}
for(const count of [0,1,2,7]){let hits=0;const sampled=new Set();for(let i=0;i<100;i++){const s=seed();s.pets=species.slice(0,count).map(sp=>({species:sp,name:sp}));let n=0;const r=P.draw(s,s.town.movement,{free:10,names:['Maya'],jobs:['老师'],random:()=>n++===0?(i+.5)/100:.1});if(r.status==='pending')hits++;}a.equal(hits,count?20:0);
 for(const kind of kinds)for(let i=0;i<count;i++){const s=seed();s.pets=species.slice(0,count).map(sp=>({species:sp,name:sp}));const r=draw(s,kind,(i+.5)/count);a.equal(r.id,kind);a.equal(r.quote.species,species[i]);sampled.add(r.quote.species+'-'+r.id);}a.equal(sampled.size,count*5);
}
const buckets=Object.fromEntries(kinds.map(x=>[x,0]));for(let i=0;i<100;i++){const s=seed();let n=0;const r=P.draw(s,s.town.movement,{free:10,names:['Maya'],jobs:['老师'],random:()=>[.1,(i+.5)/100,0][n++]??0});buckets[r.id]++;}a.deepEqual(Object.values(buckets),[20,20,20,20,20]);
for(const flag of ['injury','mishap','accident']){const s=seed('gecko');s.petMapEvents={version:1,records:{},seen:{['2:'+flag]:true},hours:{2:2}};a.equal(P.choices(s,'accident',10).length,0);a.equal(s.petMapEvents.hours[2],2);s.month++;a.equal(P.choices(s,'accident',10).length,1);}
for(const [sp,kind,cost,hours]of [['cat','mishap',50,1],['dog','injury',500,4]]){const s=seed(sp),q=P.quote(s,kind,{p:s.pets[0],index:0,sp}),k=P.key(s,s.town.movement);a.equal(q.cost,cost);s.petMapEvents={version:1,records:{[k]:{key:k,id:kind,month:2,moveId:1,status:'pending',forced:true,quote:q}},seen:{},hours:{}};a.equal(P.draw(s,s.town.movement,{free:10}).quote,q);a.equal(P.choices(s,'accident',10).length,0);a.equal(P.cardForRecord(s.petMapEvents.records[k]),null);a.equal(P.atomic(s,()=>P.execute(s,k,{free:10}),()=>true),true);a.equal(s.cash,5000-cost);a.equal(s.petMapEvents.hours[2],hours);}
for(const coverage of [undefined,.8,0,1])for(const [sp,kind,gross,medical]of [['dog','unwell',200,true],['cat','accident',500,true],['crocodile','unwell',600,true],['tortoise','accident',50,false]]){const s=seed(sp);s.insurance={pet:{active:true,...coverage===undefined?{}:{coverage}}};a.equal(draw(s,kind).quote.cost,medical?Math.round(gross*(1-(coverage??1))):gross);}
{const s=seed();s.insurance={pet:{active:true,coverage:.8,startMonth:3}};a.equal(draw(s,'unwell').quote.cost,200);}
{const s=seed();s.pets=[];s.housing='studio';a.equal(P.draw(s,s.town.movement,{free:10}).status,'legacy');}
{const s=seed(),r=draw(s,'unwell');s.cash=0;const before=JSON.stringify(s);a.equal(P.atomic(s,()=>P.execute(s,r.key,{free:10}),()=>true),false);a.equal(JSON.stringify(s),before);s.cash=5000;let recorded;const opts={free:1,forcedTime:x=>(recorded=x,{used:1,debt:2})};a.equal(P.atomic(s,()=>P.execute(s,r.key,opts),()=>true),true);a.equal(recorded.hours,3);a.equal(s.forcedTimeReturn.debt,2);a.equal(s.petMapEvents.hours[2],1);}
{const s=seed(),r=draw(s,'surprise',0,0);a.equal(r.id,'surprise');a.equal(r.forced,false);a.equal(P.execute(s,r.key,{free:0}),true);a.equal(s.forcedTimeReturn,undefined);a.equal(s.cash,5000);a.equal(s.petMapEvents.hours[2],0);}
{const s=seed(),r=draw(s,'companion');s.month++;a.equal(P.execute(s,r.key,{free:10}),false);s.month--;s.pets[0].name='其他';a.equal(P.execute(s,r.key,{free:10}),false);}
{const s=seed(),before=JSON.stringify(s);a.equal(P.atomic(s,()=>draw(s,'surprise'),()=>false),false);a.equal(JSON.stringify(s),before);a.equal(draw(s,'surprise').id,'surprise');}
a.equal(P.cards['gecko-surprise'].title,'小守宫睡得正香');a.equal(Object.values(P.cards).some(c=>c.title.includes('哈欠')),false);
console.log('PASS pet35: 35 approved effects, gate, equal category/species odds, monthly limits/reset, legacy pending/limits, insurance scope, atomic save retry, zero-hour surprise, stale/duplicate protection.');
