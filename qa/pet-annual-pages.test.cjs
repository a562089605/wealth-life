// Reuse the lightweight DOM harness; execute shipped annual UI and real care payment transactions.
const fs=require('node:fs'),path=require('node:path'),{createRequire}=require('node:module');
const base=fs.readFileSync(path.join(__dirname,'pet-fee-insurance-dom.test.cjs'),'utf8');
const start=base.indexOf('reset();const before=');if(start<0)throw Error('DOM harness boundary missing');
const setup=base.slice(0,start).replace("vm.runInContext(fs.readFileSync('pet-pages.js','utf8'),ctx);", "ctx.currentCareerTime=()=>({free:100});vm.runInContext(fs.readFileSync('pet-care.js','utf8').split('const careTimeBefore=')[0],ctx);vm.runInContext(fs.readFileSync('pet-pages.js','utf8'),ctx);");
new Function('require',setup+`
const specs={dog:[150,2],cat:[150,2],tortoise:[100,2],chameleon:[120,2],gecko:[80,2],spider:[50,1],crocodile:[300,3]};
const flatten=e=>[e,...e.children.filter(x=>x&&typeof x==='object').flatMap(flatten)];
for(const [id,[fee,hours]] of Object.entries(specs)){
 const seedAnnual=(month=0)=>{ctx.saveWorks=true;ctx.state={...seed(),month,cpiIndex:100,pets:[{species:id,type:Adopt.pets[id].type,name:'玩家的名字',adoptMonth:0}],petCareTime:{month,hours:0}};};
 seedAnnual();let before=JSON.stringify(ctx.state);ctx.PetPages.openAnnual(0);
 let art=flatten(body).find(e=>e.className==='pet-illustrated');a.ok(art.innerHTML.includes('annual-'+id+'-20261106.webp'));a.ok(art['aria-label'].includes('体检费用 $'+fee.toFixed(2)));a.ok(art['aria-label'].includes('自由时间 '+hours+' 小时'));a.ok(art['aria-label'].includes('玩家的名字'));
 let blocked=buttons().find(b=>b.textContent==='尚未到期');a.ok(blocked.disabled);blocked.onclick();a.equal(JSON.stringify(ctx.state),before,'preview must preserve old save');
 seedAnnual(12);before=JSON.stringify(ctx.state);ctx.PetPages.openAnnual(0);click('核对体检费用');a.equal(JSON.stringify(ctx.state),before,'payment preview must not charge');
 ctx.saveWorks=false;let pay=click('确认支付');a.equal(JSON.stringify(ctx.state),before,'save failure restores full old record');ctx.saveWorks=true;pay.onclick();a.equal(ctx.state.cash,1000-fee);a.equal(ctx.state.petCareTime.hours,hours);a.equal(ctx.state.pets[0].care.nextAnnual,24);a.equal(ctx.state.pets[0].care.history.length,1);pay.onclick();a.equal(ctx.state.cash,1000-fee,'old callback cannot repay');
 ctx.PetPages.openAnnual(0);a.ok(buttons().find(b=>b.textContent==='尚未到期'&&b.disabled));art=flatten(body).find(e=>e.className==='pet-illustrated');a.ok(art['aria-label'].includes('第3年 · 第1月'));
 seedAnnual(12);ctx.state.cpiIndex=115;ctx.PetPages.openAnnual(0);click('核对体检费用');click('确认支付');a.equal(ctx.state.cash,1000-Math.round(fee*115)/100,'preserve existing CPI');
 seedAnnual(12);ctx.isRecoveryMonth=()=>true;ctx.PetPages.openAnnual(0);art=flatten(body).find(e=>e.className==='pet-illustrated');a.ok(art['aria-label'].includes('自由时间 0 小时'));click('核对体检费用');click('确认支付');a.equal(ctx.state.petCareTime.hours,0);a.equal(ctx.state.cash,1000-fee);ctx.isRecoveryMonth=()=>false;
 seedAnnual(12);ctx.PetPages.openAnnual(0);click('核对体检费用');pay=buttons().find(b=>b.textContent==='确认支付');ctx.state.month++;before=JSON.stringify(ctx.state);pay.onclick();a.equal(JSON.stringify(ctx.state),before,'stale month cannot pay');
 seedAnnual(12);ctx.state.cash=fee-1;ctx.PetPages.openAnnual(0);click('核对体检费用');a.ok(buttons().find(b=>b.textContent==='确认支付'&&b.disabled));
 console.log('PASS '+id+': approved art, name/date, not-due/read-only, canonical fee/hours, atomic rollback/retry, 12-month cycle, duplicate/stale guards, CPI/recovery and cash shortage.');
}
// The same confirmation handler must still allow legacy cleaning retries after rollback.
for(const [id,cost,hours,months] of [['dog',10,2,2],['spider',5,1,3]]){
 ctx.state={...seed(),month:3,cpiIndex:100,pets:[{species:id,type:Adopt.pets[id].type,name:'旧存档宠物',adoptMonth:0}]};ctx.saveWorks=true;const before=JSON.stringify(ctx.state);ctx.PetPages.openClean(0);click('确认选择');ctx.saveWorks=false;const pay=click('确认支付');a.equal(JSON.stringify(ctx.state),before);ctx.saveWorks=true;pay.onclick();a.equal(ctx.state.cash,1000-cost);a.equal(ctx.state.petCareTime.hours,hours);a.equal(ctx.state.pets[0].care.nextClean,3+months);
}
console.log('PASS legacy dog/spider cleaning save-failure retry through shared care confirmation.');
`)(createRequire(path.join(__dirname,'pet-fee-insurance-dom.test.cjs')));
