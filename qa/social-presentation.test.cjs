// Presentation-only regression: saved information is shown without inferring missing legacy data.
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
class Node {
 constructor(tag){this.tag=tag;this.children=[];this.attrs={};this.style={setProperty:(k,v)=>this.attrs[k]=v};this.classList={add:(...v)=>this.className=[this.className||'',...v].join(' ')};this.own=''}
 append(...nodes){this.children.push(...nodes)}
 set textContent(s){this.own=String(s);this.children=[]}
 get textContent(){return this.own+this.children.map(n=>n.textContent).join('\n')}
 setAttribute(k,v){this.attrs[k]=v}
}
const source=fs.readFileSync('social-pages-art.js','utf8');
const context={document:{createElement:t=>new Node(t)},SocialRecords:{all:()=>[]},state:{},priceText:v=>'$'+v,receipt:null,socialRecord:()=>context.receipt};
vm.createContext(context);
vm.runInContext(source.slice(source.indexOf(' const scenes='),source.indexOf(' function board('))+source.slice(source.indexOf(' function monthly('),source.indexOf(' const networkBefore='))+source.slice(source.indexOf(' function signed('),source.indexOf(' const before=showEvent')),context);
const board=()=>new Node('div');
for(const [kind,i] of [['socialMeal',1],['socialCoffee',2],['socialWalk',3]]){
 context.receipt={kind,scene:'一起了解彼此',cost:kind==='socialMeal'?45:0,hours:kind==='socialMeal'?2:1,success:true,appliedGain:1,effects:{energy:-2,social:0,happiness:2}};
 const b=board();context.monthly(b,{name:'朋友'});
 const images=b.children.filter(n=>(n.className||'').includes('social-receipt-scene'));
 assert.equal(images.length,1);assert.equal(images[0].attrs['--social-x'],i%2*100+'%');assert.equal(images[0].attrs['--social-y'],Math.floor(i/2)*100+'%');
 assert.match(b.textContent.replace(/\n/g,''),/实际亲密度变化\+1/);assert.match(b.textContent.replace(/\n/g,''),/能量变化-2/);assert.match(b.textContent.replace(/\n/g,''),/社交变化0/);assert.match(b.textContent.replace(/\n/g,''),/幸福度变化\+2/);
 assert.match(b.textContent.replace(/\n/g,''),/本次已支付\$/);assert.match(b.textContent.replace(/\n/g,''),/本次自由时间减少/);
}
context.receipt={scene:'历史交流',cost:15,gain:5};let b=board();context.monthly(b,{name:'老朋友'});assert.match(b.textContent.replace(/\n/g,''),/历史交流/);assert.match(b.textContent.replace(/\n/g,''),/\$15/);assert.doesNotMatch(b.textContent.replace(/\n/g,''),/实际亲密度变化|自由时间减少|能量变化|幸福度变化|社交变化/);assert.equal(b.children.filter(n=>(n.className||'').includes('social-receipt-scene')).length,0);
context.receipt={scene:'对话',success:false,kind:'socialWalk',hours:1,cost:0};b=board();context.monthly(b,{name:'朋友'});assert.match(b.textContent.replace(/\n/g,''),/不会重新判定/);
context.receipt=null;b=board();context.monthly(b,{name:'朋友'});assert.match(b.textContent.replace(/\n/g,''),/本月尚未/);assert.doesNotMatch(b.textContent.replace(/\n/g,''),/本次已支付/);
b=board();context.monthly(b);assert.match(b.textContent.replace(/\n/g,''),/本月已交流0位联系人/);
assert.ok(source.includes("eventActionCurrent(button,'联系认识的人')"),'contact callbacks must require current visible event');
assert.ok(source.includes('eventActionCurrent(button,displayTitle)'),'interaction callbacks must require current visible event');
assert.ok(source.includes('eventActionCurrent(returnButton,title)'),'receipt back navigation must require current visible event');
assert.ok(!source.includes('!b.isConnected'),'connected hidden paper is not proof of active event');
console.log('PASS: three saved receipt art mappings, actual effect display, zero effects, legacy unknown preservation, unsuccessful/monthly/empty states and current-event callback guards.');
