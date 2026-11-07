// Exercise shipped fee accounting, necessary bills, combined housing bill and room/map entry guards together.
const fs=require('node:fs'),vm=require('node:vm'),a=require('node:assert/strict'),B=require('../pet-basic-fees.js');
let maps=0,reminders=0,saved=true,paused=false,medical=false,returns=false;
const prices={狗:50,猫:80},c={close(){},A:{close(){}},PetBasicFees:B,console,Math,roundCash:n=>Math.round(n*100)/100,livingBaseAmount:s=>s.baseLiving,PETS:{狗:{monthly:50},猫:{monthly:80}},syncFinance(){},currentLoanCycle:()=>({items:[]}),petCareTasks:()=>[],openHousing(){},openTownLiving(){},openInsurance(){},openLoanPayments(){},openPetCare(){},openBasicFees(){},openBankLoan(){},openLifeOverview(){},petName:p=>p.name,healthTreatmentKind:()=>medical,unfinishedTreatment:()=>false,timeReturnPending:()=>returns,explorationStarted:()=>false,isRecoveryMonth:()=>false,townPending:()=>paused,showTown(){maps++;},rollTown(){},settleMonth(){},showEvent(){reminders++;},save:()=>saved,priceText:String,townHome(){},housingHandoverDue:()=>false,showFundingOptions(){},basicFeeOptions(){return {prices,nonPetLiving:c.state.baseLiving+(c.state.carRunningCost||0)};},state:null,townVisible:false,openNecessaryBills:null,showGameOver(){},openRequiredIncident(){},openHealthTreatment(){},explorationReturnReasons:()=>[],visible:true,syncRoom(){},townState(){},window:null};c.window=c;vm.createContext(c);
const html=fs.readFileSync('index.html','utf8');vm.runInContext(html.split('\n').filter(l=>/^function pet(?:MonthlyFee|Monthly|PrepaidMonthly)\(/.test(l)).join('\n'),c);
const flow=fs.readFileSync('flow.js','utf8');vm.runInContext(flow.slice(0,flow.indexOf('const V26_STATS')),c);
for(const f of ['necessary-bills.js','housing-bills.js'])vm.runInContext(fs.readFileSync(f,'utf8'),c);
const pages=fs.readFileSync('pet-pages.js','utf8');vm.runInContext(pages.slice(pages.indexOf(' function unpaidBasicFees()'),pages.indexOf(" const petInsuranceOpenBefore=")),c);
const room=fs.readFileSync('room.js','utf8');vm.runInContext(room.slice(room.indexOf(' function leaveRoom('),room.indexOf(' function learning(){')),c);
function seed(){maps=reminders=0;paused=medical=returns=false;saved=true;c.state={month:2,cash:1000,baseLiving:800,housing:'studio',housingCost:1400,health:80,insurance:{},pets:[{name:'豆豆',type:'狗',species:'dog'},{name:'猫猫',type:'猫',species:'cat'}],monthlyPayments:{month:2,housing:1400,living:800,premiums:0}};}
const petRows=()=>c.necessaryBills().filter(r=>r.kind==='petBasicFee');
function pay(i,works=true){const q=B.quote(c.state,i,c.basicFeeOptions());return B.confirm(c.state,i,q.token,c.basicFeeOptions(),()=>works);}
seed();const before=JSON.stringify(c.state);a.equal(petRows().length,2);a.equal(c.necessaryBills().reduce((n,r)=>n+r.due,0),130);a.equal(JSON.stringify(c.state),before);c.leaveRoom();a.equal(maps,0);a.equal(reminders,1);c.showTown();a.equal(maps,0);a.equal(reminders,2);
a.equal(pay(0,false).ok,false);a.equal(JSON.stringify(c.state),before);c.leaveRoom();a.equal(maps,0);a.equal(pay(0).ok,true);a.equal(c.state.cash,950);c.leaveRoom();a.equal(maps,0);a.equal(petRows().length,1);a.equal(pay(1).ok,true);c.leaveRoom();a.equal(maps,1);a.equal(c.state.cash,870);a.equal(c.necessaryBills().length,0);c.showTown();a.equal(maps,2);
// Reconstructed saved state keeps payment; next month's fees resume without touching cash.
c.state=JSON.parse(JSON.stringify(c.state));c.showTown();a.equal(maps,3);c.state.month++;c.showTown();a.equal(maps,3);a.equal(petRows().length,2);a.equal(c.state.cash,870);
// Aggregate legacy receipt and adoption-month markers each satisfy the same gate.
seed();c.state.monthlyPayments.living=930;c.leaveRoom();a.equal(maps,1);a.equal(petRows().length,0);a.equal(c.state.cash,1000);
seed();for(const p of c.state.pets)p.basicFeePaidMonth=2;c.leaveRoom();a.equal(maps,1);a.equal(c.state.cash,1000);
seed();c.state.pets=[];c.leaveRoom();a.equal(maps,1);a.equal(c.state.cash,1000);
// Partial old receipt is allocated once; the reminder never double-counts pet fees.
seed();c.state.monthlyPayments.living=830;a.equal(c.necessaryBills().reduce((n,r)=>n+r.due,0),100);a.equal(pay(0).ok,true);a.equal(c.state.cash,980);a.equal(c.necessaryBills().reduce((n,r)=>n+r.due,0),80);c.leaveRoom();a.equal(maps,0);a.equal(pay(1).ok,true);c.leaveRoom();a.equal(maps,1);a.equal(c.state.cash,900);
seed();c.state.cash=20;a.equal(pay(0).reason,'cash');c.showTown();a.equal(maps,0);a.equal(c.state.cash,20);
// Existing drawn events and priority treatment/return paths keep their original routing.
for(const priority of ['paused','medical','returns']){seed();if(priority==='paused')paused=true;if(priority==='medical')medical=true;if(priority==='returns')returns=true;c.showTown();a.equal(maps,1);a.equal(c.state.cash,1000);}
console.log('PASS actual room departure and alternate map guard: all pets paid before entry, unpaid/failed save/shortage block, prepaid/legacy receipts/no pets pass, next month and saved-state reload, shared bills counted once, pending event/medical/forced-return priorities retained.');
// Cleaning is a skippable reminder; monthly fees and annual exams retain their gates.
let careModal;c.PetHealth=require('../pet-health');c.openRoom=()=>{};c.showEvent=(...args)=>{reminders++;careModal=args;};
seed();c.state.monthlyPayments.living=930;c.petCareTasks=()=>[{kind:'Clean',pet:c.state.pets[0]}];c.leaveRoom();a.equal(maps,0);a.equal(careModal[1],'清洁护理到期');a.equal(c.state.cash,1000);careModal[4].find(x=>x[0]==='暂不护理，继续出门')[1]();a.equal(maps,1);a.equal(c.state.cash,1000);
seed();c.state.monthlyPayments.living=800;c.leaveRoom();a.equal(maps,0);a.equal(careModal[1],'出门前完成本月必要事项','unpaid pet basic fees remain compulsory');
seed();c.state.monthlyPayments.living=930;c.petCareTasks=()=>[{kind:'Annual',pet:c.state.pets[0]}];c.leaveRoom();a.equal(maps,0);a.ok(c.necessaryBills().some(x=>x.kind==='petCare'),'annual exam gate unchanged');
console.log('PASS overdue cleaning reminder can continue to map; unpaid basic fees and annual exams still block.');
