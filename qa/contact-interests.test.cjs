const a=require('node:assert/strict'),test=require('node:test'),vm=require('vm'),fs=require('fs'),R=require('../relationship-rules.js'),Pets=require('../pet-social-contacts.js');
const skills=['摄影','电影创作','烹饪','音乐','园艺','语言学习'];
const valid=p=>{const rows=R.interestRows(p);a.ok(rows.length===1||rows.length===2);a.equal(new Set(rows.map(x=>x.skill)).size,rows.length);for(const r of rows){a.ok(skills.includes(r.skill));a.ok(Number.isInteger(r.xp)&&r.xp>=0&&r.xp<=999);a.equal(r.level,Math.floor(r.xp/100));}};
test('six skills have identical initial intervals; count is 50/50 and integer XP spans both endpoints',()=>{
 for(let i=0;i<6;i++){const values=[0,(i+.5)/6,0],p={};R.initializeInterests(p,()=>values.shift());a.deepEqual(R.interestRows(p),[{skill:skills[i],xp:0,level:0}]);}
 let one=0,two=0;for(let i=0;i<1000;i++){const p={};R.initializeInterests(p,()=>i/1000);valid(p);R.interestRows(p).length===1?one++:two++;}a.deepEqual([one,two],[500,500]);
 for(let xp=0;xp<1000;xp++){const values=[0,0,(xp+.1)/1000],p={};R.initializeInterests(p,()=>values.shift());a.equal(R.interestRows(p)[0].xp,xp);}
 const p={};R.initializeInterests(p,()=>.999999);const before=JSON.stringify(p);a.equal(R.initializeInterests(p,()=>{throw Error('reroll')}),false);a.equal(JSON.stringify(p),before);
});
test('actual work entry creates fixed manager/coworker profiles; old units and candidates remain untouched',()=>{
 const state={month:3,job:'工程师',people:[],city:'test'},start={onclick(){}};
 const c={RelationshipRules:R,state,window:{},Math,NPC_NAMES:['Maya','Nora','Sofia','Ava','Lina','Jamie','Daniel','Leo','Ethan','Marcus'],RelationshipUI:{},openGame(){},applyCareer(){},$:()=>start};vm.createContext(c);vm.runInContext(fs.readFileSync('relationship-work.js','utf8'),c);const work=c.window.RelationshipWork,u=work.register();valid(state.people[0]);const saved=JSON.stringify(state.people);work.register(u.id);a.equal(JSON.stringify(state.people),saved);
 const q=work.coworkerCandidate();valid(q.p);const candidate=JSON.stringify(q.p);a.equal(JSON.stringify(work.coworkerCandidate().p),candidate);
 const restored=JSON.parse(JSON.stringify(state));c.state=restored;a.equal(JSON.stringify(work.coworkerCandidate().p),candidate);
 restored.relationshipV1.units[0].candidate={id:'old-candidate',name:'Old',relation:10};a.equal(work.coworkerCandidate().p.interestProfile,undefined);a.equal(restored.people.length,1);
});
test('new pet acquaintances receive interests before quoting, while legacy/known/pending profiles do not change',()=>{
 const s={month:2,age:30,people:[]},cfg={names:['Maya','Leo'],jobs:['护士'],random:()=>.9};let p=Pets.prepare(s,cfg);valid(p);const saved=JSON.stringify(s);Pets.prepare(s,{...cfg,random:()=>{throw Error('reroll')}});a.equal(JSON.stringify(s),saved);
 const loaded=JSON.parse(saved);Pets.prepare(loaded,{...cfg,random:()=>{throw Error('reload reroll')}});a.equal(JSON.stringify(loaded),saved);
 const old={id:'old',name:'Old',petContactProfileVersion:1};const legacy={month:2,people:[{id:'known',name:'Known'}],mapContactCandidates:[old]};const before=JSON.stringify(legacy);Pets.prepare(legacy,cfg);a.equal(JSON.stringify(legacy),before);
 const locked={month:2,people:[],mapContactCandidates:[{id:'pending',name:'Pending'}],mapCards:{events:{q:{status:'pending',quote:{contact:{id:'pending',name:'Pending'}}}}}};const raw=JSON.stringify(locked);Pets.prepare(locked,cfg);a.equal(JSON.stringify(locked),raw);
});
