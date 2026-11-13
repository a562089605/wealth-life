const a=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
global.RelationshipHomeRules=require('../relationship-rules');
const A=require('../relationship-avatars');
const s={people:[],cash:1234,pets:[{name:'保留'}],study:{progress:4}};
for(const role of ['manager','coworker','classmate','petfriend','landlord'])for(const gender of ['female','male'])for(let i=0;i<7;i++)s.people.push({id:role+gender+i,name:'旧联系人'+i,relationshipRole:role,gender,relation:35,interests:['旧兴趣'],education:'bachelor'});
const old=JSON.parse(JSON.stringify(s));a.equal(A.sync(s,{random:()=>0}),60);
a.equal(new Set(s.people.map(p=>p.relationshipAvatarId).filter(Boolean)).size,60);
for(let i=0;i<s.people.length;i++){
 const {relationshipAvatarId,...rest}=s.people[i];a.deepEqual(rest,old.people[i]);
 if(i%7===6)a.equal(relationshipAvatarId,undefined);
 else{const art=A.portrait(s.people[i]);a.equal(art.role,s.people[i].relationshipRole);a.equal(art.gender,s.people[i].gender);}
}
const raw=JSON.stringify(s),loaded=JSON.parse(raw);a.equal(A.needsSync(loaded),false);a.equal(A.sync(loaded),0);a.equal(JSON.stringify(loaded),raw);
const bound=loaded.people.shift();loaded.people.push({id:'replacement',relationshipRole:'manager',gender:'female'});A.sync(loaded);a.equal(loaded.people.at(-1).relationshipAvatarId,undefined);a.ok(loaded.relationshipAvatars.used.includes(bound.relationshipAvatarId));
const unknown={people:[{id:'old',status:'同事'},{id:'other',status:'老师',gender:'male'}]};const unknownRaw=JSON.stringify(unknown);a.equal(A.sync(unknown),0);a.equal(JSON.stringify(unknown),unknownRaw);
const manifest=JSON.parse(fs.readFileSync('design/relationship-avatars-20261113/manifest.json'));
a.equal(manifest.runtimeResources.length,60);
for(const art of A.catalog){const item=manifest.runtimeResources.find(x=>x.id===art.id);a.ok(item);a.equal(crypto.createHash('sha256').update(fs.readFileSync(art.file)).digest('hex'),item.sha256);a.equal(crypto.createHash('sha256').update(fs.readFileSync(item.sourceFile)).digest('hex'),item.sourceSHA256);}
console.log('PASS: 60 unique matching portraits; six per gender/role; exhausted and unknown contacts unchanged; serialized identity stable; removed contacts never free a used portrait; approved source/resource hashes match.');
