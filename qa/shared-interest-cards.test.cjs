const a=require('node:assert/strict'),C=require('../shared-interest-cards'),D=require('../shared-interest-card-data'),H=require('../hobby-learning');
let assertions=0;const eq=(x,y)=>{a.deepEqual(x,y);assertions++},copy=x=>JSON.parse(JSON.stringify(x));
const seed=()=>({month:2,cash:1000,health:80,energy:80,happiness:50,stress:50,salary:2600,pets:[{name:'保留'}],study:{id:'old',progress:12,total:48},hobbies:{音乐:3},hobbyXP:{音乐:360},coffee:{skills:{coffee:{xp:123}}},hobbyLearning:{xp:{tasting:50,baking:50,photography:50,drawing:50}},people:[{id:'p',name:'同好',relation:0,interestProfile:{version:2,skills:{咖啡品鉴:100,烘焙:100,摄影:100,绘画:100}}}],town:{movement:{id:3,month:2,to:4,resolved:false},history:[]}});
const opts={free:100,reserve:0,save:()=>true,random:()=>0};
function reserve(s,kind,extra={}){return C.saveCard(s,kind,'p',3,{...opts,...extra});}
for(const def of D.cards)for(let i=0;i<def.options.length;i++){
 const s=seed(),original=copy(s);eq(reserve(s,def.id,{save:()=>false}).reason,'save');eq(s,original);
 eq(reserve(s,def.id).ok,true);eq(s.sharedInterestCards.used.length,1);eq(C.eligible(s,def.id,'p'),false);
 const saved=copy(s),id=C.current(s).id;eq(C.confirm(s,id,i,'pending',{...opts,save:()=>false}).reason,'save');eq(s,saved);
 const q=C.quote(s,C.current(s),i,opts),result=C.confirm(s,id,i,'pending',opts);eq(result.ok,true);eq(s.cash,1000+q.effects.cash);eq(s.energy,80+q.effects.energy);eq(C.hours(s),q.effects.hours);eq(H.xp(s,def.hobby),50+q.effects.xp);
 const once=copy(s);eq(C.confirm(s,id,i,'pending',opts).ok,false);eq(s,once);
 if(result.followup){const before=copy(s);eq(C.confirm(s,id,0,'followup',{...opts,save:()=>false}).reason,'save');eq(s,before);eq(C.confirm(s,id,0,'followup',opts).ok,true);eq(C.hours(s),2);eq(s.sharedInterestCards.used.length,1);eq(s.sharedInterestCards.receipts.length,2);}
 eq(C.current(s).status,'resolved');eq(s.month,original.month);eq(s.salary,original.salary);eq(s.study,original.study);eq(s.coffee,original.coffee);eq(s.pets,original.pets);eq(s.hobbyXP,original.hobbyXP);eq(s.hobbies,original.hobbies);eq(s.town.history.length,1);
}
for(const [random,key]of [[0,'queue'],[1/3,'no-queue'],[2/3,'no-suitable-cafe']]){
 const s=seed();eq(reserve(s,'tasting-queue',{random:()=>random}).ok,true);eq(C.current(s).lockedOutcome.id,key);
 const restored=copy(s);eq(C.current(restored).lockedOutcome,C.current(s).lockedOutcome);eq(C.confirm(restored,C.current(restored).id,1,'pending',opts).ok,true);eq(C.confirm(restored,C.current(restored).id,0,'followup',opts).ok,true);
 eq(restored.cash,key==='no-suitable-cafe'?1000:970);eq(C.hours(restored),2);eq(restored.people[0].relation,key==='no-suitable-cafe'?1:3);
}
for(const [field,value,options,reason]of [['cash',20,{},'funds'],['energy',0,{},'energy'],['health',20,{},'recovery'],['health',80,{free:1},'time'],['health',80,{free:3,reserve:2},'time'],['health',80,{recovery:true},'recovery']]){
 const s=seed();reserve(s,'tasting-queue');s[field]=value;const before=copy(s);eq(C.confirm(s,C.current(s).id,1,'pending',{...opts,...options}).reason,reason);eq(s,before);
}
for(const n of [798,800]){const s=seed();s.hobbyLearning.xp.drawing=n;reserve(s,'drawing-colors');eq(C.confirm(s,C.current(s).id,0,'pending',opts).ok,true);eq(H.xp(s,'drawing'),800);eq(s.cash,1100);eq(s.financeLedger[0].kind,'sharedInterestIncome');}
const s=seed();reserve(s,'baking-burnt');eq(C.confirm(s,C.current(s).id,1,'pending',opts).ok,true);eq([s.cash,s.energy,s.stress,s.people[0].relation],[980,79,51,1]);eq(H.xp(s,'baking'),50);
for(const marker of ['relationshipLifeCard','sharedInterestCard']){const s=seed();s.town.movement[marker]={};eq(reserve(s,'tasting-invite').ok,false);}
{const s=seed();s.town.movement.payExpected=3;eq(reserve(s,'tasting-invite').ok,false);}
{const s=seed();s.people=[];eq(reserve(s,'tasting-invite').ok,false);}
{const s=seed();s.hobbyLearning.xp.tasting=49;eq(reserve(s,'tasting-invite').ok,false);}
{const s=seed();reserve(s,'tasting-invite');const r=C.current(s),before=copy(s);eq(C.confirm(s,r.id,0,'pending',{...opts,save:()=>{s.people.push({id:'save-side-effect'});throw Error('quota')}}).reason,'save');eq(s,before);}
// Verify the original cash-audit function classifies both event income and expenses.
{const fs=require('node:fs'),vm=require('node:vm'),source=fs.readFileSync(require('node:path').join(__dirname,'../batch.js'),'utf8');
 const start=source.indexOf('function auditRows('),body=source.slice(start,source.indexOf('\n}',start)+2);
 const ctx={roundCash:n=>Math.round(n*100)/100,state:{cash:1070}};vm.createContext(ctx);vm.runInContext(body,ctx);
 const rows=ctx.auditRows({ledger:[{kind:'sharedInterestIncome',amount:100},{kind:'sharedInterestExpense',amount:30}],grossSalary:0,tax:0,kContrib:0,passive:0,expenses:0,prepaidExpenses:0,monthCashChange:70,endCash:1070});
 eq(rows.find(r=>r[0]==='共同兴趣事件收入 +')[1],100);eq(rows.find(r=>r[0]==='共同兴趣事件支出 −')[1],30);eq(rows.find(r=>r[0]==='其他现金变化（含旧模块未分类项）')[1],0);
}
console.log(JSON.stringify({ok:true,assertions,cards:D.cards.length,scope:'all choices, rollback/retry, no duplicate, lifetime, frozen 3 outcomes, resource gates, cap, legacy preservation'}));
