const fs=require('fs'),vm=require('vm'),a=require('node:assert/strict');
let last,scene;const nodes=new Map();function node(id){if(!nodes.has(id))nodes.set(id,{textContent:'',value:'barista',prepend(){},addEventListener(){}});return nodes.get(id)}
const c={state:{month:0,cash:100,pets:[],petCareDraft:{month:0,selections:{}}},document:{createElement:()=>({})},$:node,showEvent(...args){last=args;node('eventTitle').textContent=args[1]},appendReturnScene(s,t){scene=s},petCareQuote:()=>({cost:0,hours:0}),currentCareerTime:()=>({free:10}),coffeeWorking:()=>true,petCareSpecies:p=>p.species,openBankLoan(){node('eventTitle').textContent='银行贷款'},openLoanPayments(){node('eventTitle').textContent='我的贷款'},openWorkAdjustment(){node('eventTitle').textContent='调整工作'}};
vm.createContext(c);vm.runInContext(fs.readFileSync('candidate-art.js','utf8'),c);
const action=()=>{};c.showEvent('宠物照护','本月到期宠物照护','',[],[['确认',action]]);a.equal(last[4][0][1],action);a.equal(scene,null);
c.petCareQuote=()=>({cost:200,hours:11});a.equal(c.candidateArtScene('宠物照护','本月到期宠物照护').file,'pet-time-shortage');
c.petCareQuote=()=>({cost:200,hours:1});a.equal(c.candidateArtScene('宠物照护','本月到期宠物照护').file,'pet-funds-shortage');
c.petCareQuote=()=>({cost:0,hours:0});c.state.pets=[{species:'crocodile'}];a.equal(c.candidateArtScene('宠物照护','本月到期宠物照护').file,'pet-crocodile-care');c.state.pets=[{species:'dog'}];a.equal(c.candidateArtScene('宠物照护','本月到期宠物照护'),null);
c.openBankLoan();a.equal(scene.file,'bank-application');c.openLoanPayments();a.equal(scene.file,'bank-payment');
console.log('PASS: real shortage conditions, species-specific routing, unchanged actions and post-form decoration.');

a.equal(c.candidateArtScene('职业学习','饮品制作基础').file,'coffee-course');a.equal(c.candidateArtScene('职业发展','晋升值班主管').file,'shift-promotion-preview');c.state.coffee={progression:{pending:{}}};a.equal(c.candidateArtScene('职业发展','晋升值班主管').file,'shift-promotion-pending');
