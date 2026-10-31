const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
let paid=0,last;const nodes={};const make=()=>({style:{},children:[],append(x){this.children.push(x)},setAttribute(k,v){this[k]=v}});
const c={state:{month:0},hobbyPracticeMissing:()=>[],eventActionCurrent:b=>!!b?.current,openLearningSkills(){},document:{createElement:make},$:id=>nodes[id]??={...make(),click(){}},showEvent(...args){if(nodes.actions?.firstElementChild)nodes.actions.firstElementChild.current=false;last=args;c.$('actions').firstElementChild={current:true}},monthSelection:()=>null,currentCareerTime:()=>({free:24}),openLearning(){},finish(){}};
vm.createContext(c);vm.runInContext(fs.readFileSync('hobby-art.js','utf8'),c);
const names=['摄影','电影创作','烹饪','音乐','园艺','语言学习'];
c.showEvent('HOBBY','发展兴趣','',names.map(n=>[n,'Lv.0 · $90']),names.slice().reverse().map(n=>['练习 '+n,()=>{paid++},false,n==='烹饪']));
const panel=nodes.eventData.children[0],photo=panel.children.find(x=>x['aria-label']==='查看摄影详情');assert.ok(photo);assert.equal(paid,0);photo.onclick();assert.equal(last[1],'兴趣详情：摄影');assert.equal(paid,0);last[4][0][1]();assert.equal(paid,1);
panel.children.find(x=>x['aria-label']==='查看烹饪详情').onclick();assert.equal(last[4][0][3],true);
assert.ok(panel.children.some(x=>x.textContent==='24h'));console.log('PASS: name-based mapping, preview without payment, original confirm action, disabled confirmation and dynamic time.');
