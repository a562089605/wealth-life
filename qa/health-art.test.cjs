const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const make=()=>({style:{},children:[],append(x){this.children.push(x)},prepend(x){this.children.unshift(x)}}),nodes={eventTitle:{textContent:''},eventData:make()};let last,redirect=false;
const c={document:{createElement:make},$:id=>nodes[id],showEvent(...a){last=a;nodes.eventTitle.textContent=redirect?'严重健康问题':a[1];nodes.eventData=make()}};
vm.createContext(c);vm.runInContext(fs.readFileSync('health-art.js','utf8'),c);
for(const [type,title,file]of [['休息','额外休息4小时','rest-arrange'],['额外休息','休息完成','rest-complete'],['医疗与康复','严重健康问题','hospital-recovery'],['医疗与康复','整月康复安排','month-recovery'],['整月康复','完成本月康复','month-recovery']]){
 const action=()=>{};c.showEvent(type,title,'',[['费用',100]],[['确认',action]]);assert.equal(last[4][0][1],action);assert.equal(last[3][0][1],100);const hero=nodes.eventData.children[0];assert.ok(hero.children[0].src.includes(file));assert.ok(hero.style.aspectRatio);
}
redirect=true;c.showEvent('休息','额外休息4小时');assert.equal(nodes.eventData.children.length,0);
assert.equal(c.healthArtScene('其他','严重健康问题'),null);console.log('PASS: all health-art routes preserve data/actions; critical-health redirection and unrelated events are not decorated.');
