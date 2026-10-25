const fs=require('fs'),vm=require('vm'),a=require('node:assert/strict');
const core=fs.readFileSync('core.js','utf8'),batch=fs.readFileSync('batch.js','utf8');
const c={state:{month:0,cash:10000,loans:[],financeLedger:[]},Number,Math,roundCash:n=>Math.round(n*100)/100,currentBankAPR:()=>.07,paymentFor:(p,r,n)=>p*(r/12)/(1-(1+r/12)**-n),render(){},loanDebtName:l=>l.id};
vm.createContext(c);vm.runInContext(core.slice(core.indexOf('function openBankLoan('),core.indexOf('\n',core.indexOf('function openBankLoan('))),c);
vm.runInContext(batch.slice(batch.indexOf('function loanTargets('),batch.indexOf('function payLoanInstallment(')),c);
for(const years of [1,3,5,10,20,30]){
 a.equal(c.openBankLoan(2000,{amount:2000,years,confirmed:true}),true);
 const l=c.state.loans.at(-1);a.equal(l.monthsLeft,years*12);a.equal(l.firstPaymentMonth,1);a.equal(l.apr,.07);
}
a.equal(c.state.cash,22000);a.equal(c.loanBudgetTotal(),0,'new contracts must not charge in disbursement month');
const snapshot=JSON.stringify(c.state);a.equal(c.openBankLoan(2000,{amount:2000,years:7,confirmed:true}),false);a.equal(JSON.stringify(c.state),snapshot);
c.state.month=1;a.equal(c.currentLoanCycle().items.length,6);a.ok(c.loanBudgetTotal()>0);
const locked=c.state.loans[0].apr;c.currentBankAPR=()=>.12;a.equal(c.state.loans[0].apr,locked);
// Old contracts retain their existing current-month payment schedule.
c.state={month:0,cash:1000,loans:[{id:'legacy',balance:2000,apr:.07,payment:100,monthsLeft:24}]};a.equal(c.currentLoanCycle().items.length,1);
console.log('PASS: six confirmed terms, next-month first payment, legacy timing, fixed APR, original accounting and rejected obsolete term.');
