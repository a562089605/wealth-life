const a=require('node:assert/strict'),test=require('node:test'),fs=require('fs'),vm=require('vm'),R=require('../relationship-rules.js');
const fixture=()=>({month:4,cash:1000,energy:50,health:80,happiness:80,stress:100,housing:'family',people:[{id:'a',name:'同名',relation:80},{id:'b',name:'同名',relation:80}]});
const context={free:10,outcome:()=>({gain:7,happiness:4})};
test('all activities recheck energy, health, recovery and resources before rolling',()=>{
 for(const kind of Object.keys(R.plans))for(const change of [s=>s.energy=1,s=>s.energy=NaN,s=>s.health=29,s=>s.health=NaN,s=>s.treatments={t:{paid:true,status:'scheduled',startMonth:4}}]){const s=fixture(),r=R.begin(s,kind,['a']);change(s);const before=JSON.stringify(s);a.equal(R.execute(s,r,{free:10,outcome(){throw Error('must not roll')}}),false);a.equal(JSON.stringify(s),before);}
 for(const kind of Object.keys(R.plans)){const s=fixture();s.energy=2;s.health=30;a.ok(R.execute(s,R.begin(s,kind,['a']),context));a.equal(s.energy,0);a.equal(s.stress,100);a.equal(s.health,30);}
});
test('negative outcomes clamp and visits mark each attendee, including failed exchanges',()=>{
 const s=fixture();s.people[0].relation=1;let r=R.begin(s,'socialWalk',['a']);R.execute(s,r,{free:1,outcome:()=>({gain:-3,happiness:-2})});a.equal(s.people[0].relation,0);a.equal(r.outcomes[0].appliedGain,-1);a.equal(s.happiness,78);a.equal(s.people[0].lastContactMonth,4);
 s.people[0].relation=100;r=R.begin(s,'socialVisit',['a','b']);a.ok(R.execute(s,r,{free:3,outcome:p=>({gain:p.id==='a'?7:-3,happiness:p.id==='a'?4:-2})}));a.equal(r.outcomes[0].appliedGain,0);a.equal(s.people[1].relation,77);a.equal(s.people[1].lastContactMonth,4);a.equal(s.happiness,80);a.equal(R.execute(s,r,context),false);
 a.deepEqual([0,.333333,.5,.99999].map(x=>R.failureGain(()=>x)),[-1,-1,-2,-3]);
});
test('month settlement exempts real contacts and introductions, not previews or declines; reload is idempotent',()=>{
 const s=fixture();s.people=Array.from({length:10},(_,i)=>({id:'p'+i,name:'同名',relation:i===9?.2:50}));
 s.people[0].lastContactMonth=4;s.people[1].lastInteractionMonth=4;s.people[2].metMonth=4;
 const d=R.init(s);d.actions.push({month:4,status:'resolved',people:['p3']},{month:4,status:'pending',people:['p7']});d.help.push({month:4,status:'resolved',personId:'p4'},{month:4,status:'declined',personId:'p8'});
 s.socialInteractions={month:4,receipts:[{month:4,personKey:'id:p5',person:'同名'}]};s.socialMonth={month:4,person:'p6'};
 const rows=R.settleContacts(s,4);a.equal(rows.length,10);a.deepEqual(s.people.map(p=>p.relation),[50,50,50,50,50,50,50,49,49,0]);
 const loaded=JSON.parse(JSON.stringify(s));a.equal(R.settleContacts(loaded,4),false);a.deepEqual(loaded.people,s.people);R.settleContacts(loaded,5);a.equal(loaded.people[0].relation,49);
});
test('80 boundary permits different help events forever, with old permanent records retained and single-event replay blocked',()=>{
 const s=fixture(),p=s.people[0];s.mapCards={permanent:{['classmate:'+p.id]:{month:1}}};s.study={id:'degree',progress:0,total:12};p.studyProjectId='degree';
 for(const kind of ['life','classmate']){p.relation=79;a.equal(R.helpEligible(s,p,kind),false);p.relation=80;a.ok(R.helpEligible(s,p,kind));for(let i=0;i<2;i++){const r={id:kind+i,month:4,status:'pending',kind,personId:p.id};a.ok(R.acceptHelp(s,r));a.equal(R.acceptHelp(s,JSON.parse(JSON.stringify({...r,status:'pending'}))),false);}}
 a.equal(s.study.total,6);a.ok(s.mapCards.permanent['classmate:a']);a.equal(p.lastContactMonth,4);a.equal(s.relationshipV1.help.length,4);
 s.month=5;a.ok(R.acceptHelp(s,{id:'next-month',month:5,status:'pending',kind:'life',personId:p.id}));a.equal(R.helpEligible(s,p,'interest','摄影'),false);
});
test('interest generation requires explicit background weights, freezes count/XP and never fills legacy profiles',()=>{
 const p={};a.equal(R.generateInterests(p),false);let values=[.6,0,0,.99,.999];a.ok(R.generateInterests(p,{'摄影':2,'电影创作':1},()=>values.shift()));a.deepEqual(R.interestRows(p),[{skill:'摄影',xp:0,level:0},{skill:'电影创作',xp:999,level:9}]);
 const before=JSON.stringify(p);a.equal(R.generateInterests(p,{'音乐':1,'烹饪':1}),false);a.equal(JSON.stringify(p),before);a.equal(R.helpWeight(p,'电影创作'),10.99);a.equal(R.helpWeight(p,'音乐'),null);
 a.deepEqual(R.interestRows({}),[]);a.equal(R.generateInterests({interests:['摄影']},{'音乐':1,'烹饪':1}),false);a.deepEqual(R.interestRows({interests:['摄影']}),[{skill:'摄影',xp:null,level:null}]);a.deepEqual(R.interestRows({hobbies:{摄影:0},hobbyXP:{摄影:0}}),[{skill:'摄影',xp:0,level:0}]);
 values=[.1,.99,.25];const single={};R.generateInterests(single,{'摄影':1,'音乐':1},()=>values.shift());a.equal(R.interestRows(single).length,1);a.equal(R.interestRows(single)[0].xp,250);
});
test('current UI failure roll, signed receipts and interest data use actual relationship module',()=>{
 const source=fs.readFileSync('relationship-ui.js','utf8');const fn=source.slice(source.indexOf('function outcome(p)'),source.indexOf('const previousTime='));const s=fixture(),m=Object.create(Math);m.random=()=>.999;
 const c={R,state:s,Math:m,attributeModifier:()=>0,roleTrait:()=>({}),SOCIAL_SCENES:[{title:'交流',gain:7,happiness:4}]};vm.createContext(c);vm.runInContext(fn,c);const o=c.outcome(s.people[0]);a.equal(o.gain,-3);a.equal(o.happiness,-2);a.equal(o.success,false);a.ok(source.includes("(o.appliedGain>0?'+':'')"));a.ok(source.includes('R.interestRows(p)'));
});
