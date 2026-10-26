const a=require('node:assert/strict'),C=require('../pet-social-contacts.js'),R=require('../map-card-rules.js');
const config={names:['Maya','Leo','Nora'],jobs:['老师','护士','设计师']};
const fresh=()=>({month:0,age:30,city:'orlando',cash:1000,energy:80,happiness:60,stress:20,health:80,housing:'own',carOwned:true,people:[],pets:[{id:'p',species:'dog',name:'豆豆'}],insurance:{}});
let female=0,male=0;
for(let i=0;i<1000;i++){
 const s=fresh(),p=C.prepare(s,{...config,random:()=>i/1000});
 if(p.gender==='female')female++;else if(p.gender==='male')male++;
 a.ok(Number.isInteger(p.age)&&p.age>=18);a.ok(config.jobs.includes(p.job));a.equal(s.people.length,0);
}
a.deepEqual({female,male},{female:500,male:500},'the 50/50 threshold must not be affected by chosen pet or name');
let s=fresh(),p=C.prepare(s,{...config,random:()=>.1}),saved=JSON.stringify(s);
C.prepare(s,{...config,random:()=>{throw Error('rerolled an existing candidate')}});a.equal(JSON.stringify(s),saved);
s=JSON.parse(saved);C.prepare(s,{...config,random:()=>{throw Error('rerolled after restore')}});a.equal(JSON.stringify(s),saved);
const seq=xs=>()=>xs.shift();let r=R.drawLife(s,{id:1},80,seq([.85,.75,0]));
a.equal(r.cardId,'pet-social');a.equal(s.people.length,0);a.equal(s.cash,1000);
const quoted=JSON.stringify(r.quote.contact);a.equal(R.drawLife(s,{id:1},80,()=>{throw Error('rerolled existing event')}),r);
a.equal(R.execute(s,r,{free:80}),true);a.equal(s.cash,980);a.equal(s.people.length,1);a.equal(s.people[0].relation,10);a.equal(s.people[0].id,p.id);a.equal(s.people[0].age,p.age);a.equal(s.people[0].job,p.job);a.equal(s.people[0].gender,p.gender);
a.equal(R.execute(s,r,{free:80}),false);a.equal(s.people.length,1);a.equal(JSON.stringify(r.quote.contact),quoted);
let next=C.prepare(s,{...config,random:()=>.9});a.notEqual(next.id,p.id);a.equal(next.gender,'male');a.equal(s.people.length,1,'replenishing the finite name pool must not enroll a friend');
// Legacy pending quotes and actual friends must survive profile upgrades byte-for-byte.
s=fresh();const legacy={id:'old',name:'Old',age:77,job:'旧职业',gender:'male'};s.mapContactCandidates=[structuredClone(legacy)];s.mapCards={events:{pending:{status:'pending',quote:{contact:structuredClone(legacy)}}}};
C.prepare(s,{...config,random:()=>{throw Error('rerolled locked legacy contact')}});a.deepEqual(s.mapContactCandidates[0],legacy);a.deepEqual(s.mapCards.events.pending.quote.contact,legacy);
s=fresh();s.people=[{id:'pet-friend-1',name:'Maya',age:77,job:'旧职业'}];const old=JSON.stringify(s.people);next=C.prepare(s,{...config,random:()=>.2});a.notEqual(next.id,'pet-friend-1');a.equal(JSON.stringify(s.people),old);
console.log('PASS: automatic pet friends 50/50 gender, assigned age/job, no preview enrollment, stable save/quote, once-only cost/contact, exhausted pool refill, old friends and pending quotes preserved.');
