const a=require('node:assert/strict'),B=require('../pet-basic-fees.js');
const options={prices:{狗:50,猫:80},nonPetLiving:800};
const seed=()=>({month:2,cash:1000,pets:[{type:'狗',species:'dog',name:'豆豆'},{type:'猫',species:'cat',name:'猫猫'}],monthlyPayments:{month:2,living:0},financeLedger:[]});
const outstanding=s=>Math.max(0,800+s.pets.reduce((n,p)=>n+(p.basicFeePaidMonth===s.month?0:options.prices[p.type]),0)-(s.monthlyPayments.month===s.month?s.monthlyPayments.living:0));
for(const receipt of [0,800,830,850,880,930])for(const order of [[0,1],[1,0]]){const s=seed();s.monthlyPayments.living=receipt;const before=outstanding(s);let spent=0;for(const i of order){const q=B.quote(s,i,options);if(q.due){a.equal(B.confirm(s,i,q.token,options,()=>true).ok,true);spent+=q.due;}}a.equal(spent+outstanding(s),before,'double-counted living credit '+receipt+' '+order);a.equal(s.cash,1000-spent);}
{const s=seed(),q=B.quote(s,0,options),before=JSON.stringify(s);a.equal(B.confirm(s,0,q.token,options,()=>false).ok,false);a.equal(JSON.stringify(s),before);a.equal(B.confirm(s,0,q.token,options,()=>true).ok,true);a.equal(B.confirm(s,0,q.token,options,()=>true).ok,false);a.equal(s.cash,950);s.month++;a.equal(B.quote(s,0,options).due,50);}
{const s=seed();s.pets[0].basicFeePaidMonth=2;a.equal(B.quote(s,0,options).due,0);a.equal(s.cash,1000);}
{const s=seed();s.monthlyPayments.living=930;a.equal(B.quote(s,0,options).due,0);a.equal(B.quote(s,1,options).due,0);}
{const s=seed();s.cash=10;const q=B.quote(s,0,options),before=JSON.stringify(s);a.equal(B.confirm(s,0,q.token,options,()=>true).reason,'cash');a.equal(JSON.stringify(s),before);}
{const s=seed(),q=B.quote(s,0,options);s.pets[0].name='另一个';a.equal(B.confirm(s,0,q.token,options,()=>true).reason,'stale');}
console.log('PASS monthly pet fee: split payments and old living receipts reconcile in either pet order, first-month prepaid, next month, atomic failure/retry, paid-once, insufficient cash and stale quote.');
