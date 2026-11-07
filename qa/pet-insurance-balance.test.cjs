const a=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),I=require('../pet-insurance'),E=require('../pet-events'),A=require('../pet-adoption-entry');
const ids=Object.keys(I.monthly),cash=10000,money=n=>Math.round(n*100)/100;
const seed=species=>({schemaVersion:247,month:2,cash,baseLiving:800,energy:50,happiness:50,stress:50,pets:species.map(id=>({species:id,type:A.pets[id].type,name:id,adoptMonth:0})),insurance:{health:{active:true,monthly:220}},monthlyPayments:{month:2,living:0,premiums:0},financeLedger:[],town:{history:[],movement:{id:1,to:2,resolved:false}}});
function buy(s,index){const q=I.quote(s,index);a.ok(q);a.equal(I.confirm(s,index,q.token,()=>true).ok,true);return q;}
function medical(s,index){const p=s.pets[index];return E.quote(s,'unwell',{p,index,sp:p.species}).cost;}
// Every non-empty owned subset and every insured subset, in both purchase orders.
let combinations=0;
for(let mask=1;mask<128;mask++){const owned=ids.filter((_,i)=>mask&(1<<i));for(let insured=1;insured<(1<<owned.length);insured++)for(const reverse of [false,true]){
 const s=seed(owned),order=owned.map((_,i)=>i).filter(i=>insured&(1<<i));if(reverse)order.reverse();
 const expected=money(order.reduce((n,i)=>n+I.monthly[owned[i]],0));
 for(const i of order)buy(s,i);
 a.equal(s.cash,money(cash-expected));a.equal(s.monthlyPayments.premiums,expected);a.equal(I.premiums(s),money(220+expected));
 const before=JSON.stringify(s);for(let i=0;i<owned.length;i++)a.equal(medical(s,i),(insured&(1<<i))?0:E.illness[owned[i]]);a.equal(JSON.stringify(s),before);
 s.month++;I.sync(s);a.equal(I.premiums(s),money(220+expected));const raw=JSON.stringify(s);I.sync(s);a.equal(JSON.stringify(s),raw,'renewal is idempotent');combinations++;
}}
// Changed ownership invalidates stale confirmation, but never discounts another pet.
{const s=seed(['dog']),q=I.quote(s,0);s.pets.push({species:'cat',name:'new'});const raw=JSON.stringify(s);a.equal(I.confirm(s,0,q.token,()=>true).reason,'stale');a.equal(JSON.stringify(s),raw);a.equal(I.quote(s,0).monthly,55);}
{const s=seed([]);a.equal(I.quote(s,0),null);a.equal(I.premiums(s),220);a.equal(s.cash,cash);}
// Mid-month adoption never refunds/reprices another policy or discounts its renewal.
{const s=seed(['dog']);buy(s,0);const policy=s.insurance[s.pets[0].insuranceKey],receipt=JSON.stringify(s.monthlyPayments);s.pets.push({species:'cat',name:'cat'});I.sync(s);a.equal(policy.monthly,55);a.equal(JSON.stringify(s.monthlyPayments),receipt);buy(s,1);a.equal(I.premiums(s),315);a.equal(s.cash,9905);s.month++;I.sync(s);a.equal(I.premiums(s),315);a.equal(policy.monthly,55);a.equal(s.cash,9905);}
// Stopping requires successful save, keeps current cover/cash/receipts, stops next month only.
for(const id of ids){const s=seed([id]),q=buy(s,0),stop=I.quote(s,0),before=JSON.stringify(s);
 for(const fail of [()=>false,()=>{throw Error('quota');}]){a.equal(I.stop(s,0,stop.token,fail).reason,'save');a.equal(JSON.stringify(s),before);}
 a.equal(I.stop(s,0,stop.token,()=>true).ok,true);a.equal(s.cash,cash-q.due);a.equal(s.monthlyPayments.premiums,q.due);a.equal(medical(s,0),0);a.equal(I.premiums(s),220+q.monthly);a.equal(I.stop(s,0,stop.token,()=>true).reason,'stale');
 const reload=JSON.parse(JSON.stringify(s));a.equal(medical(reload,0),0);reload.month++;a.equal(medical(reload,0),E.illness[id]);I.sync(reload);a.equal(I.premiums(reload),220);a.equal(I.quote(reload,0).held,null);a.equal(reload.cash,s.cash);buy(reload,0);a.equal(medical(reload,0),0);a.equal(reload.cash,money(s.cash-q.monthly));}
// Stop one of two; the other stays independently covered at its full price.
{const s=seed(['dog','cat']);buy(s,0);buy(s,1);const q=I.quote(s,0);I.stop(s,0,q.token,()=>true);s.month++;I.sync(s);a.equal(I.premiums(s),260);a.equal(medical(s,0),200);a.equal(medical(s,1),0);a.equal(I.quote(s,0).monthly,55);}
// Old individually priced contract: preserve current money/rate, migrate price only on next renewal.
{const s=seed(['dog','cat']);s.pets[0].insuranceKey='pet-policy-8';s.insurance['pet-policy-8']={active:true,monthly:60,coverage:.8,startMonth:0};s.monthlyPayments.premiums=60;const raw=JSON.stringify(s);a.equal(I.quote(s,0).monthly,60);a.equal(JSON.stringify(s),raw);I.sync(s);a.equal(I.premiums(s),280);a.equal(medical(s,0),40);s.month++;I.sync(s);a.equal(I.premiums(s),275);a.equal(medical(s,0),40);a.equal(s.cash,cash);a.equal(s.monthlyPayments.premiums,60);}
// The original shared45 contract remains shared; stopping explicitly stops the whole shared contract.
// Paid version2 contracts keep their original receipts and medical ratios this month.
// Next renewal converts each to its own price without changing any old event quote.
for(const paid of [0,20,240]){const s=seed(['dog','cat']);s.monthlyPayments.premiums=paid;
 for(const [i,id,fee]of [[0,'dog',5],[1,'cat',15]]){const k='pet-policy-'+i;s.pets[i].insuranceKey=k;s.insurance[k]={active:true,monthly:fee,coverage:i?.8:1,startMonth:0,pricingVersion:2,baseMonthly:I.monthly[id],ownedCount:2,pricedMonth:2};}
 const raw=JSON.stringify(s);a.equal(I.quote(s,0).monthly,5);a.equal(I.quote(s,1).monthly,15);a.equal(I.premiums(s),240);a.equal(JSON.stringify(s),raw,'old preview is read-only');I.sync(s);a.equal(JSON.stringify(s),raw,'current saved contract remains locked');
 const reloaded=JSON.parse(JSON.stringify(s));reloaded.month++;a.equal(I.quote(reloaded,0).monthly,55);a.equal(I.quote(reloaded,1).monthly,40);a.equal(reloaded.insurance['pet-policy-0'].monthly,5,'renewal preview is read-only');I.sync(reloaded);a.equal(I.premiums(reloaded),315);a.equal(reloaded.cash,cash);a.equal(reloaded.monthlyPayments.premiums,paid);a.equal(reloaded.insurance['pet-policy-1'].coverage,.8);a.equal(reloaded.insurance['pet-policy-0'].ownedCount,2,'historical metadata retained');a.equal(reloaded.insurance['pet-policy-0'].pricingVersion,3);
}
// An unpaid version2 renewal from a past month uses individual prices immediately.
// Existing version3 single-pet prices also remain locked for the current month.
{const s=seed(['dog','cat']);for(const [i,sp,fee]of [[0,'dog',10],[1,'cat',30]]){const k='pet-policy-'+i;s.pets[i].insuranceKey=k;s.insurance[k]={active:true,monthly:fee,coverage:1,startMonth:0,pricingVersion:3,baseMonthly:fee,pricedMonth:2};}s.monthlyPayments.premiums=40;const raw=JSON.stringify(s);a.equal(I.premiums(s),260);a.equal(I.quote(s,0).monthly,10);a.equal(I.quote(s,0).baseMonthly,55);a.equal(I.quote(s,1).monthly,30);a.equal(JSON.stringify(s),raw);I.sync(s);a.equal(JSON.stringify(s),raw);const reloaded=JSON.parse(raw);reloaded.month++;I.sync(reloaded);a.equal(I.premiums(reloaded),315);a.equal(I.quote(reloaded,0).monthly,55);a.equal(I.quote(reloaded,1).monthly,40);a.equal(reloaded.cash,cash);a.equal(reloaded.monthlyPayments.premiums,40);}
{const s=seed(['dog','cat']);s.pets[0].insuranceKey='pet-policy-1';s.insurance['pet-policy-1']={active:true,monthly:5,coverage:1,pricingVersion:2,baseMonthly:10,ownedCount:2,pricedMonth:1};a.equal(I.quote(s,0).monthly,55);I.sync(s);a.equal(s.insurance['pet-policy-1'].monthly,55);a.equal(s.cash,cash);}
// Buying a new policy after loading old discounted contracts charges only its own price.
{const s=seed(['dog','cat']);s.pets[0].insuranceKey='pet-policy-1';s.insurance['pet-policy-1']={active:true,monthly:5,coverage:1,pricingVersion:2,baseMonthly:10,ownedCount:2,pricedMonth:2};s.monthlyPayments.premiums=5;const q=buy(s,1);a.equal(q.due,40);a.equal(s.cash,9960);a.equal(s.monthlyPayments.premiums,45);a.equal(s.insurance['pet-policy-1'].monthly,5);s.month++;I.sync(s);a.equal(I.premiums(s),315);}
// Additional uninsured pets, their removal and pet ordering cannot lower another premium.
{const s=seed(['dog','cat']);buy(s,0);a.equal(I.quote(s,1).monthly,40);s.pets.push({species:'spider',name:'uninsured'});I.sync(s);a.equal(I.premiums(s),275);s.pets.reverse();a.equal(I.quote(s,2).monthly,55);s.pets.splice(0,1);s.month++;I.sync(s);a.equal(I.premiums(s),275);a.equal(s.cash,9945);}
{const s=seed(['dog','cat']);s.insurance.pet={active:true,monthly:45,coverage:.8};I.sync(s);s.month++;I.sync(s);a.equal(I.premiums(s),265);const q=I.quote(s,0);a.equal(q.policyKey,'pet');I.stop(s,0,q.token,()=>true);a.equal(medical(s,1),40);s.month++;I.sync(s);a.equal(I.premiums(s),220);a.equal(medical(s,1),200);}
// Pending event has its original medical amount, even across stop/save/reload.
{const s=seed(['dog']);buy(s,0);let n=0;const r=E.draw(s,s.town.movement,{free:10,random:()=>[.1,.3,0][n++]??0});a.equal(r.quote.cost,0);const raw=JSON.stringify(r.quote),q=I.quote(s,0);I.stop(s,0,q.token,()=>true);a.equal(JSON.stringify(r.quote),raw);a.equal(E.execute(s,r.key,{free:10}),true);a.equal(s.cash,9945);}
// Actual finance calculations combine the monthly insurance bill, current paid receipt and month boundary.
{const c={state:seed(['dog','cat']),Math,PetInsurance:I};vm.createContext(c);const html=fs.readFileSync('index.html','utf8'),core=fs.readFileSync('core.js','utf8'),flow=fs.readFileSync('flow.js','utf8');vm.runInContext(html.split('\n').filter(l=>l.startsWith('const PETS=')||/^function pet(?:MonthlyFee|Monthly|PrepaidMonthly)\(/.test(l)).join('\n'),c);vm.runInContext(core.slice(0,core.indexOf('const savedRender=')),c);vm.runInContext(flow.slice(0,flow.indexOf('const V26_STATS')),c);
 buy(c.state,0);buy(c.state,1);let m=c.calcMetrics();a.equal(m.monthlyExpenses,1245);a.equal(m.prepaidExpenses,95);a.equal(m.remainingExpenses,1150);c.payMonthly('premiums',220);a.equal(c.calcMetrics().remainingExpenses,930);const q=I.quote(c.state,0);I.stop(c.state,0,q.token,()=>true);a.equal(c.calcMetrics().monthlyExpenses,1245);c.state.month++;m=c.calcMetrics();a.equal(m.monthlyExpenses,1190);a.equal(m.prepaidExpenses,0);a.equal(m.remainingExpenses,1190);a.equal(c.state.insurance[c.state.pets[0].insuranceKey].active,false);
}
console.log('PASS '+combinations+' owned/insured/order combinations, individual totals, ownership stale guard, prepaid month lock, old-contract renewal, next-month stop rollback/reload/repurchase, locked event and actual finance metrics.');
