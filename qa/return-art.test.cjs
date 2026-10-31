const fs=require('fs'),vm=require('vm'),a=require('node:assert/strict');const make=()=>({style:{},children:[],append(x){this.children.push(x)},prepend(x){this.children.unshift(x)}}),nodes={eventTitle:{textContent:''},eventData:make()};let last,redirect=false;
const c={document:{createElement:make},$:id=>nodes[id],showEvent(...args){last=args;nodes.eventTitle.textContent=redirect?'严重健康问题':args[1];nodes.eventData=make()},openInsurance(){nodes.eventTitle.textContent='保险与保障';nodes.eventData=make()}};
vm.createContext(c);vm.runInContext(fs.readFileSync('return-art.js','utf8'),c);
for(const [type,title,data,file]of [['医疗保险','医疗保障选择',[],'insurance'],['发薪日','核对本月收支',[],'payday'],['本月探索结束','返回房屋结算',[['返回原因','能量低于20；压力达到80或以上']],'return-energy'],['本月探索结束','返回房屋结算',[['返回原因','压力达到80或以上']],'return-stress']]){const action=()=>{};c.showEvent(type,title,'',data,[['确认',action]]);a.equal(last[4][0][1],action);a.equal(last[3],data);a.ok(nodes.eventData.children[0].children[0].src.includes(file))}
c.openInsurance();a.ok(nodes.eventData.children[0].children[0].src.includes('insurance'));a.equal(c.returnArtScene('本月探索结束','返回房屋结算',[['返回原因','本月自由时间已用完']]),null);
redirect=true;c.showEvent('发薪日','核对本月收支');a.equal(nodes.eventData.children.length,0);
console.log('PASS: insurance form ordering, medical/payday/reason mapping, unchanged data and confirm callbacks, unrelated and redirected events.');
