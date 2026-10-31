const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
let route='',last;const node=()=>({style:{},children:[],append(x){this.children.push(x)},prepend(x){this.children.unshift(x)},setAttribute(k,v){this[k]=v}}),els={};
const c={document:{createElement:node},$:id=>els[id]??={...node(),click(){route=id}},showEvent(...a){last=a;els.eventData={...node()};},currentCareerTime:()=>({free:42}),openEducation(){route='education'},openCoffeeCourses(){route='courses'},COFFEE_COURSES:[],priceText:String,townEnabled:()=>true,townPending:()=>false,townHome(){route='home'},finish(){route='finish'}};
vm.createContext(c);vm.runInContext(fs.readFileSync('learning-art.js','utf8'),c);
c.openLearning();const panel=els.eventData.children[0];assert.ok(panel.children.some(x=>x.textContent==='42h'));
for(const [name,target]of [['学历学习','education'],['返回房屋','home']]){panel.children.flatMap(x=>[x,...(x.children||[])]).find(x=>x['aria-label']===name).onclick();assert.equal(route,target)}
const board=panel.children.find(x=>x.className==='learning-choice-board');assert.equal(board.children.length,2);assert.equal(board.children[0].children[0].textContent,'兴趣技巧学习');assert.equal(board.children[1].children[0].textContent,'学历学习');board.children[0].onclick();assert.equal(last[1],'兴趣技巧学习');
const original=()=>{};for(const [title,file]of [['顾客服务基础','service-course'],['门店管理基础','management-course']]){c.showEvent('职业学习',title,'',[['技能经验','20 XP']],[['确认',original]]);assert.equal(last[4][0][1],original);assert.ok(els.eventData.children[0].children[0].src.includes(file))}
console.log('PASS: learning navigation, dynamic time, course-art mapping and unchanged confirmation actions.');
