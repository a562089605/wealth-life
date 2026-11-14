const a=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
const D=require('../shared-interest-card-data'),S=require('../shared-interest-selection'),H=require('../hobby-learning');
const root=path.resolve(__dirname,'..');
a.equal(D.cards.length,20);a.equal(D.naturalDrawEnabled,false);a.equal(D.triggerProbability,null);
let artwork=0;
for(const c of D.cards){
 a.equal(D.cards.filter(x=>x.hobby===c.hobby).length,5);
 for(const x of [c,...(c.followup?.outcomes||[])]){
  a.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,x.file))).digest('hex'),x.sha256);artwork++;
 }
 for(const q of [...c.options,...(c.followup?.outcomes||[])])for(const [k,v]of Object.entries(q.effects)){
  a.ok(Number.isFinite(v));if(k==='hours')a.ok(v>=1);
 }
}
a.equal(artwork,23);
const s={month:1,hobbyLearning:{xp:{tasting:50,baking:49,photography:800,drawing:50}},people:[
 {id:'a',relation:0,interestProfile:{version:2,skills:{咖啡品鉴:0,摄影:800}}},
 {id:'b',relation:0,interestProfile:{version:2,skills:{咖啡品鉴:100}}},
 {id:'c',relation:0,interests:['音乐']}
]};
const before=JSON.stringify(s);a.deepEqual(S.groups(s).map(g=>g.hobby),['tasting','photography']);
let draws=[0,.99,0];let selected=S.choose(s,()=>draws.shift());a.equal(selected.personId,'b');a.equal(selected.card.hobby,'tasting');
draws=[.99,0,0];selected=S.choose(s,()=>draws.shift());a.equal(selected.card.hobby,'photography');
a.equal(S.options(s,selected.card)[0].effects.xp,0);a.equal(S.options(s,selected.card)[0].effects.cash,-20);
a.equal(JSON.stringify(s),before);
s.sharedInterestCards={used:D.cards.filter(c=>c.hobby==='tasting').map(c=>({personId:'a',kind:c.id}))};
a.deepEqual(S.groups(s)[0].people.map(p=>p.personId),['b']);
s.sharedInterestCards.used.push(...D.cards.filter(c=>c.hobby==='tasting').map(c=>({personId:'b',kind:c.id})));
a.deepEqual(S.groups(s).map(g=>g.hobby),['photography']);
a.equal(S.choose({people:s.people}),null);a.throws(()=>S.choose(s,()=>1));
const exploring=D.cards.find(c=>c.id==='tasting-queue');a.deepEqual(exploring.followup.weights,[1,1,1]);a.equal(exploring.followup.choice,1);
a.deepEqual(D.cards.find(c=>c.id==='drawing-colors').options[0].effects,{cash:100,hours:4,energy:-3,xp:10,intimacy:3});
// Deterministic sampling: category probability is independent of contact count.
let seed=123;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
const sample={hobbyLearning:{xp:{tasting:50,photography:50}},people:Array.from({length:9},(_,i)=>({id:i,interests:i===8?['摄影']:['咖啡品鉴']}))};
let photos=0;for(let i=0;i<12000;i++)if(S.choose(sample,random).hobby==='photography')photos++;
a.ok(photos>5700&&photos<6300);
// The prepared modules must not activate the production map or alter resource loading.
a.ok(fs.readFileSync(path.join(root,'index.html'),'utf8').includes('shared-interest-selection.js'));
a.equal(D.naturalDrawEnabled,false);
a.equal(H.activities.drawing.cost,25);
console.log(JSON.stringify({ok:true,mainCards:20,followups:3,artworkHashes:artwork,sampleDraws:12000,photographyDraws:photos,naturalDrawEnabled:false}));
