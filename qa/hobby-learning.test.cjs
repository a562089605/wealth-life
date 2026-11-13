const a=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),H=require('../hobby-learning');
let checks=0;const eq=(x,y)=>{a.deepEqual(x,y);checks++},copy=x=>JSON.parse(JSON.stringify(x));
const seed=()=>({month:2,cash:10000,energy:90,health:80,happiness:60,stress:50,hobbyXP:{摄影:20,音乐:500},hobbies:{摄影:0,音乐:5},salary:2600,coffee:{skills:{coffee:{xp:240},service:{xp:220},management:{xp:100}}},people:[],pets:[{name:'保留'}]});
const opts={free:100,reserve:0,recovery:false,save:()=>true};
eq(Object.keys(H.activities).length,6);eq(H.hobbies.length,4);
for(const [id,cost,hours,energy,happy,stress]of [['tasting',30,2,1,4,-4],['baking',45,3,2,4,-4],['photography',20,2,1,4,-4],['drawing',25,2,1,4,-4],['latte',40,2,2,0,0],['pourOver',35,2,2,0,0]]){
 const s=seed(),before=copy(s),t=H.token(s,id);eq(H.confirm(s,id,t,{...opts,save:()=>false}).reason,'save');eq(s,before);
 eq(H.confirm(s,id,t,opts).ok,true);eq([s.cash,s.energy,s.happiness,s.stress],[10000-cost,90-energy,60+happy,50+stress]);eq(H.xp(s,id),(id==='photography'?20:0)+10);eq(H.hours(s),hours);eq(s.financeLedger[0].amount,cost);
 eq(H.confirm(s,id,t,opts).reason,'stale');eq(H.confirm(s,id,H.token(s,id),opts).ok,true);eq(H.hours(s),hours*2);
 eq([s.coffee,s.salary,s.hobbies,s.hobbyXP,s.pets],[before.coffee,before.salary,before.hobbies,before.hobbyXP,before.pets]);
 const loaded=JSON.parse(JSON.stringify(s));eq(H.hours(loaded),hours*2);eq(H.xp(loaded,id),H.xp(s,id));loaded.month++;eq(H.hours(loaded),0);eq(H.confirm(loaded,id,H.token(s,id),opts).reason,'stale');
 for(const [extra,reason]of [[{free:hours-1},'time'],[{free:hours,reserve:1},'time'],[{recovery:true},'recovery']])eq(H.quote(s,id,{...opts,...extra}).reason,reason);
 for(const [field,value,reason]of [['energy',energy-1,'energy'],['cash',cost-1,'funds'],['health',29,'recovery']]){const weak=copy(s);weak[field]=value;const raw=JSON.stringify(weak);eq(H.confirm(weak,id,H.token(weak,id),opts).reason,reason);eq(JSON.stringify(weak),raw);}
 const cap=seed();cap.hobbyLearning={version:1,xp:{[id]:795},sequence:0,receipts:[]};eq(H.confirm(cap,id,H.token(cap,id),opts).ok,true);eq(H.xp(cap,id),800);const raw=JSON.stringify(cap);eq(H.confirm(cap,id,H.token(cap,id),opts).reason,'max');eq(JSON.stringify(cap),raw);
}
for(const [xp,lv]of [[0,0],[49,0],[50,1],[149,1],[150,2],[299,2],[300,3],[499,3],[500,4],[799,4],[800,5],[999,5]])eq(H.level(xp),lv);
const old=seed();old.hobbyXP.摄影=950;eq(H.quote(old,'photography',opts).reason,'max');eq(old.hobbyXP.摄影,950);
const legacy={id:'old',interests:['摄影'],hobbyXP:{摄影:999}},fresh={id:'new'},locked={id:'locked'},s={people:[legacy,fresh],town:{movement:{relationshipLifeCard:{newClassmate:locked}}}};
H.syncNewContacts(s,{people:[copy(legacy)]},{random:()=>0});eq(legacy,{id:'old',interests:['摄影'],hobbyXP:{摄影:999}});eq(fresh.interestProfile.version,2);eq(locked.interestProfile.version,2);const saved=copy(s);H.syncNewContacts(s,saved,{random:()=>.99});eq(s,saved);
const missing={people:[{id:'missing'}]};H.syncNewContacts(missing,copy(missing));eq(missing.people[0].interestProfile,undefined);
const idlessPrior={people:[{name:'旧无编号联系人',origin:'work'}]},idlessState={people:[{id:'relationship-legacy-1',name:'旧无编号联系人',origin:'work'}]};H.syncNewContacts(idlessState,idlessPrior);eq(idlessState.people[0].interestProfile,undefined);
 eq(H.interestRows(legacy),[{name:'摄影',xp:999,level:9}]);eq(H.interestRows({interestProfile:{version:2,skills:{烘焙:150}}}),[{name:'烘焙',xp:150,level:2}]);
// Independent seeded sampling checks the two-stage distribution and unique four-interest pool.
let n=19473;const rand=()=>((n=(Math.imul(1664525,n)+1013904223)>>>0)/4294967296);let one=0,total=0;const bins=[0,0,0,0,0,0],skills={};
for(let i=0;i<30000;i++){const p={};H.generate(p,rand);const rows=H.interestRows(p);if(rows.length===1)one++;a.ok(rows.length===1||rows.length===2);a.equal(new Set(rows.map(r=>r.name)).size,rows.length);for(const r of rows){total++;bins[r.level]++;skills[r.name]=(skills[r.name]||0)+1;a.ok(Number.isInteger(r.xp)&&r.xp>=0&&r.xp<=800);}}
a.ok(Math.abs(one/30000-.5)<.015);for(let i=0;i<6;i++)a.ok(Math.abs(bins[i]/total-[.10,.25,.30,.20,.10,.05][i])<.015);for(const count of Object.values(skills))a.ok(Math.abs(count/total-.25)<.015);eq(Object.keys(skills).sort(),H.hobbies.map(id=>H.activities[id].name).sort());
const manifest=JSON.parse(fs.readFileSync('design/hobbies-20261113/manifest.json'));eq(manifest.runtimeResources.length,6);for(const r of manifest.runtimeResources){eq(crypto.createHash('sha256').update(fs.readFileSync(r.file)).digest('hex'),r.sha256);eq(crypto.createHash('sha256').update(fs.readFileSync(r.sourceFile)).digest('hex'),r.sourceSHA256);}
console.log('PASS '+checks+' assertions plus 30,000-contact sampling: exact six quotes, repeat/time/energy gates, cap, rollback, stale tokens, old fields/career preserved, frozen new contacts, distribution and six approved art hashes.');
