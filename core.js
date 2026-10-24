function educationRaiseRate(target){return {associate:.08,bachelor:.12,master:.18,professional:.25}[target]||0}
// V24.7 QA: canonical state adapters and a single monthly settlement.
const roundCash=n=>Math.round((Number(n)||0)*100)/100;
function assetId(){state.nextAssetId=(state.nextAssetId||0)+1;return 'asset-'+state.nextAssetId}
function paymentFor(balance,apr,months){const r=apr/12;return r?balance*r/(1-Math.pow(1+r,-months)):balance/months}
const INSURANCE={health:['健康保险',220],life:['人寿保险',35],auto:['汽车保险',165],pet:['宠物保险',45],income:['收入保障',65]};
function inferDomain(job){if(/护士|护理/.test(job||''))return'nursing';if(/教师/.test(job||''))return'education';if(/机械工程/.test(job||''))return'engineering';if(/软件/.test(job||''))return'computing';if(/汽车技师/.test(job||''))return'automotive';if(/剪辑/.test(job||''))return'film';if(/设计/.test(job||''))return'design';if(/主厨|餐厅/.test(job||''))return'hospitality';return'general'}
function loanDebtName(l){return(l.type==='学生贷款'?'学生贷款':'银行贷款')+' · '+l.id}
function syncFinance(){
 if(!state)return;const s=state;s.assets??=[];s.debt??={};s.loans??=[];s.insurance??={};s.pets??=[];s.retirement??={k401Balance:0,iraBalance:0,brokerageBalance:0,k401Rate:0};
 if(s.schemaVersion!==247){
  // Reconcile V24's alternate writes exactly once, keeping original values.
  for(const [name,cost] of Object.entries(s.simpleInvestments||{}))s.assets.push({id:assetId(),name,kind:'market',cost,value:cost,cf:0});delete s.simpleInvestments;
  for(const p of s.rentalProperties||[])s.assets.push({id:assetId(),name:p.name,kind:'rental',cost:p.downPayment,value:p.value,purchasePrice:p.price,mortgage:p.loanBalance,apr:p.apr,payment:p.monthlyMortgage,monthsLeft:360,rent:p.rent,operating:p.rent-p.monthlyMortgage-p.estimatedNetCF,cf:p.estimatedNetCF});delete s.rentalProperties;
  let included=(s.housingCost||0)+petMonthly()+(s.healthInsurance?220:0)+(s.incomeProtection?65:0);
  if(s.carOwned)included+=480;
  s.baseLiving=Math.max(0,(s.expenses||0)-included);
  if(s.monthlyHousing!=null){s.housingCost=s.monthlyHousing;s.housing=({'与家人同住':'family','2B2B 合租':'shared','Studio':'studio','1B1B':'rent1'})[s.housingChoice]||s.housing;}
  delete s.monthlyHousing;delete s.housingChoice;
  if(s.healthInsurance&&!s.insurance.health)s.insurance.health={active:true,monthly:220};
  if(s.incomeProtection&&!s.insurance.income)s.insurance.income={active:true,monthly:65};
  s.assets=s.assets.filter(a=>{if(a.kind==='cd'&&a.matured){s.cash+=a.cost;return false}return true});
  s.major??=inferDomain(s.job);s.licenses??=[];if(/护士/.test(s.job||''))s.licenses.push('RN');if(/教师/.test(s.job||''))s.licenses.push('teaching');
  s.domainExperience??={};s.domainExperience[inferDomain(s.job)]??=(s.experienceYears||0)*12;
  s.carValue??=s.carOwned?24000:0;s.carRunningCost??=s.carOwned?150:0;
  s.taxRate??=.15;s.schemaVersion=247;s.yearStartNetWorth??=5000;
 }
 // Changes made by retained life modules adjust only the non-financial living budget.
 if(s._computedExpenses!=null&&Math.abs(s.expenses-s._computedExpenses)>.01)s.baseLiving=Math.max(0,s.baseLiving+s.expenses-s._computedExpenses);
 s.healthInsurance=!!s.insurance.health?.active;s.incomeProtection=!!s.insurance.income?.active;
 const securedNames=['投资房贷款','自住房贷款'];for(const k of Object.keys(s.debt))if(securedNames.includes(k)||k.startsWith('投资房 · ')||k.startsWith('银行贷款 · ')||k.startsWith('学生贷款 · '))delete s.debt[k];
 if(s.homeMortgage>0)s.debt['自住房贷款']=s.homeMortgage;
 s.assets.forEach(a=>{a.id??=assetId();if(a.kind==='rental'){a.apr??=ECONOMIES[s.economy||0].rate;a.monthsLeft??=360;a.operating??=(a.rent||0)-(a.payment||0)-(a.cf||0);a.equity=(a.value||a.purchasePrice||0)-(a.mortgage||0);a.cf=(a.rent||0)-(a.operating||0)-(a.mortgage>0?Math.min(a.monthsLeft===1?a.mortgage*(1+a.apr/12):a.payment,a.mortgage*(1+a.apr/12)):0);if(a.mortgage>0)s.debt['投资房 · '+a.id]=a.mortgage;}});
 s.loans.forEach((l,i)=>{l.id??='loan-'+i;l.monthsLeft??=36;l.apr??=.055;l.payment??=paymentFor(l.balance,l.apr,l.monthsLeft);if(l.balance>0)s.debt[loanDebtName(l)]=l.balance;});
 const represented=new Set(['自住房贷款',...s.assets.filter(a=>a.kind==='rental').map(a=>'投资房 · '+a.id),...s.loans.map(l=>loanDebtName(l))]);
 s.debtSchedules??={};for(const [k,v]of Object.entries(s.debt)){if(!represented.has(k)&&v>0&&!s.debtSchedules[k])s.debtSchedules[k]={apr:.055,monthsLeft:60,payment:paymentFor(v,.055,60)};}
 const loanMonthly=typeof loanBudgetTotal==='function'?loanBudgetTotal():s.loans.reduce((n,l)=>n+(l.balance>0?Math.min(l.monthsLeft===1?l.balance*(1+l.apr/12):l.payment,l.balance*(1+l.apr/12)):0),0)+Object.entries(s.debtSchedules).reduce((n,[k,l])=>n+(s.debt[k]>0?Math.min(l.monthsLeft===1?s.debt[k]*(1+l.apr/12):l.payment,s.debt[k]*(1+l.apr/12)):0),0);
 const premiums=Object.values(s.insurance).reduce((n,i)=>n+(i.active?i.monthly:0),0);
 s.expenses=roundCash(s.baseLiving+(s.housingCost||0)+petMonthly()+premiums+(s.carRunningCost||0)+loanMonthly);s._computedExpenses=s.expenses;
 s.passive=roundCash(s.assets.reduce((n,a)=>n+(a.cf||0),0)+(typeof expectedInvestmentIncome==='function'?expectedInvestmentIncome():0));s.cash=roundCash(s.cash);
}
calcMetrics=function(){
 syncFinance();const s=state||{},rr=s.retirement||{};
 const debtTotal=Object.values(s.debt||{}).reduce((n,v)=>n+v,0);
 const assetValue=(s.cash||0)+(s.emergencyFund||0)+(rr.k401Balance||0)+(rr.iraBalance||0)+(rr.brokerageBalance||0)+(s.carValue||0)+(s.homeEquity||0)+(s.homeMortgage||0)+(s.assets||[]).reduce((n,a)=>n+(a.kind==='rental'?(a.value||a.purchasePrice||0):(a.value??a.cost??0))+(a.kind==='cd'?(a.interestAccrued||0):0),0);
 const recovery=typeof isRecoveryMonth==='function'&&isRecoveryMonth(s);
 const careerIncome=!recovery&&typeof coffeeMonthlyIncome==='function'?coffeeMonthlyIncome():null;
 const salary=recovery?0:careerIncome?careerIncome.total:(s.job&&!s.retired&&!s.unemployedMonths?s.salary:0),contrib=roundCash(salary*(rr.k401Rate||0)),tax=roundCash(Math.max(0,salary-contrib)*(s.taxRate??.15));
 const recurring=careerIncome?careerIncome.recurring:salary,recurringContrib=roundCash(recurring*(rr.k401Rate||0)),recurringTax=roundCash(Math.max(0,recurring-recurringContrib)*(s.taxRate??.15));
 return{careerIncome,debtTotal,assetValue,nw:assetValue-debtTotal,investable:assetValue-(s.carValue||0)-(s.homeEquity||0)-(s.homeMortgage||0)-debtTotal,monthlyExpenses:roundCash(remainingExpenses()+paidThisMonth()),grossSalary:salary,tax,kContrib:contrib,monthlyCF:roundCash(recurring-recurringTax-recurringContrib+(s.passive||0)-remainingExpenses()-paidThisMonth()),remainingExpenses:remainingExpenses(),prepaidExpenses:paidThisMonth(),remainingCF:roundCash(salary-tax-contrib+(s.passive||0)-remainingExpenses())};
};
const savedRender=render;
render=function(){if(!state)return;syncFinance();savedRender();const m=calcMetrics();$('net').textContent=money(m.monthlyCF);$('net').className='value '+(m.monthlyCF>=0?'good':'bad');$('salary').textContent=money(m.grossSalary)+'/月（税前）';$('annualSalary').textContent='年薪 '+money(state.annualSalary||0)+' · 游戏税款 '+money(m.tax)+'/月';if(window.refreshV24Turn)window.refreshV24Turn();};
let saveTimer;
save=function(){if(!state)return;syncFinance();try{localStorage.setItem(key(slot),JSON.stringify(state));$('saveState').textContent='已自动存档';clearTimeout(saveTimer);saveTimer=setTimeout(()=>$('saveState').textContent='自动存档',900)}catch(e){$('saveState').textContent='保存失败，请保留此页面';console.error('Save failed',e)}};
function clearModals(){document.querySelectorAll('.event-active').forEach(e=>e.classList.remove('event-active'));$('eventBackdrop').classList.remove('active');$('v242RE').classList.remove('open');$('v245Housing').classList.remove('open');document.body.classList.remove('event-open');pending=false;$('next').disabled=false;}
const openBase=openGame;openGame=function(){clearModals();syncFinance();openBase();window.startV24Turn?.(false)};
const homeBase=home;home=function(){clearModals();homeBase();state=null;};
const startBase=$('start').onclick;$('start').onclick=()=>{startBase();state.yearStartNetWorth=state.cash;state.turn={month:state.month,index:0,startCash:state.cash};save();window.startV24Turn?.(false)};
$('saveExit').onclick=()=>{save();home()};
$('qNext').onclick=$('hubNext').onclick=()=>{if(state)window.startV24Turn?.(false)};
const finishBase=finish;finish=function(){finishBase();if(window.refreshV24Turn)window.refreshV24Turn()};
// Never retain actionable stale modal buttons after dismissal.
const finishSafe=finish;finish=function(){clearModals();$('actions').innerHTML='';finishSafe()};
$('eventClose').onclick=$('eventBackdrop').onclick=()=>finish();
const showBase=showEvent;showEvent=function(...args){showBase(...args);const buttons=[...$('actions').children];buttons.forEach(b=>{const fn=b.onclick;b.onclick=e=>{if(b.disabled)return;b.disabled=true;fn(e)}})};
function housingOptions(){const city=CITIES[state.city||'orlando'],infl=(state.cpiIndex||100)/100;return[['与家人同住',Math.round(450*infl),0,'family'],['2B2B 合租',Math.round((city.rent2||1695*city.housing)*.52*infl),Math.round((city.rent2||1695*city.housing)*.52*infl+350),'shared'],['Studio',Math.round((city.rentStudio||1432*city.housing)*infl),Math.round((city.rentStudio||1432*city.housing)*infl*2),'studio'],['1B1B Apartment',Math.round((city.rent1||1450*city.housing)*infl),Math.round((city.rent1||1450*city.housing)*infl*2),'rent1']]}
$('housingBtn').onclick=()=>{
 syncFinance();const opts=housingOptions(),hasHome=!!state.housing&&state.housing!=='unselected';
 const cheapest=Math.min(...opts.map(o=>o[2]));
 const choices=opts.map(o=>{
  const current=state.housing===o[3],shortfall=Math.max(0,roundCash(o[2]-state.cash));
  return ['选择 '+o[0],()=>{if(current){finish();return}if(state.cash<o[2])return;state.cash-=o[2];const firstHome=state.housing==='unselected'&&state.month===0;state.housing=o[3];state.housingCost=o[1];syncFinance();if(firstHome){state.goalBaseExpenses=state.expenses;state.goalTarget=0}finish()},true,!current&&shortfall>0];
 });
 if(opts.some(o=>state.housing!==o[3]&&state.cash<o[2])){
  choices.push(['申请银行贷款后选择住房',()=>{finish();openBankLoan(Math.max(1,Math.ceil(cheapest-state.cash)));$('housingBtn').click()},false]);
  choices.push(['查看资产与银行',()=>{finish();$('game').classList.remove('v24-running');showV21Section('wealth')},false]);
 }
 choices.push([hasHome?'继续当前住房':'返回',finish,false]);
 showEvent('HOUSING','选择住房','搬入成本只在改变住房时支付；月租在月末结算。'+(!hasHome&&state.cash<cheapest?'当前现金不足以支付最便宜的搬入费。可先申请银行贷款，或管理资产筹款。贷款默认补足最便宜住房的搬入费差额；若选择更贵的住房，请修改申请金额。':''),[['可用现金',money(state.cash)],...opts.map(o=>[o[0],money(o[1])+'/月 · 搬入 '+money(o[2])+(state.housing===o[3]?' · 当前住房，无须再次付搬入费':state.cash<o[2]?' · 还差 '+money(o[2]-state.cash):' · 可选择')])],choices);
};

function buyInsurance(type){syncFinance();const cfg=INSURANCE[type];if(!cfg)return;if(state.insurance[type]?.active){showEvent('INSURANCE',cfg[0]+'已持有','不会重复购买或重复计费。',[['保费',money(cfg[1])+'/月']],[['返回',finish,true]]);return}if(type==='auto'&&!state.carOwned)return;if(type==='pet'&&!state.pets.length)return;state.insurance[type]={name:cfg[0],active:true,monthly:cfg[1]};syncFinance();showEvent('INSURANCE',cfg[0]+'已生效','保费从本月月末开始扣除，每月只扣一次。',[['持续保费',money(cfg[1])+'/月']],[['继续',finish,true]]);render()}
$('healthBtn').onclick=()=>buyInsurance('health');$('incomeBtn').onclick=()=>buyInsurance('income');
function buyInvestment(kind,requestedAmount=null){const amt=requestedAmount===null?Number(prompt('投入'+kind+'金额（美元）','200')):Number(requestedAmount);if(!Number.isFinite(amt)||amt<=0||amt>state.cash)return;state.cash-=amt;state.assets.push({id:assetId(),name:kind,kind:'market',category:kind,cost:amt,value:amt,cf:0});render();}
function openCD(){showEvent('CD','12个月 CD','本金锁定12次月末结算，到期自动回到现金。利息不重复计入月现金流。',[['本金','$1,000'],['年利率','4%'],['期限','12个月']],[['存入 $1,000',()=>{if(state.cash<1000)return;state.cash-=1000;(state.financeLedger??=[]).push({kind:'cdPurchase',month:state.month,amount:1000});state.assets.push({id:assetId(),name:'12个月CD',kind:'cd',cost:1000,cf:0,rate:.04,maturesAt:state.month+12,interestAccrued:0});finish()},true,state.cash<1000],['取消',finish,false]])}
function openLearning(){showEvent('LEARNING','学习与技能','选择学历学习或兴趣练习；打开菜单不会自动扣款。',[],[['学历学习',()=>$('studyBtn').click(),true,!state.study&&!EDU[state.education].next],['练习兴趣技能',()=>$('hobbyBtn').click(),false],['返回',finish,false]])}
function openBankLoan(suggestedAmount=10000,terms=null){const amt=terms?Number(terms.amount):Number(prompt('贷款金额（美元）',String(suggestedAmount)));if(!Number.isFinite(amt)||amt<=0||Math.abs(Math.round(amt*100)-amt*100)>.00001)return;const years=terms?Number(terms.years):Number(prompt('贷款期限（年）：1 / 3 / 5 / 7','3'));if(![1,3,5,7].includes(years))return;const apr=currentBankAPR();const months=years*12,pmt=paymentFor(amt,apr,months);if(!terms?.confirmed&&!confirm('贷款 '+money(amt)+' · '+years+' 年 · APR '+(apr*100).toFixed(2)+'% · 月供 '+money(pmt)+'。确认？'))return;state.cash+=amt;state.nextLoanId=(state.nextLoanId||0)+1;state.loans.push({id:'bank-'+state.nextLoanId,type:terms?.type==='学生贷款'?'学生贷款':'银行贷款',educationTarget:terms?.educationTarget||null,principal:amt,balance:amt,apr,monthsLeft:months,payment:pmt,latePolicy:'fee5cap35',lateFeeCap:roundCash(35*(state.cpiIndex||100)/100)});state.financeLedger??=[];state.financeLedger.push({kind:'loanDisbursement',month:state.month,loanId:state.loans.at(-1).id,amount:amt});render();}
$('carBtn').onclick=()=>{if(state.carOwned){showEvent('TRANSPORT','已有车辆','燃油与维护准备金每月 $150；汽车贷款和车险分别结算。',[['车辆资产',money(state.carValue)],['车险',state.insurance.auto?.active?'已投保':'未投保']],[['继续',finish,true]]);return}const payment=paymentFor(21000,.06,60);showEvent('TRANSPORT','购买车辆','车价 $24,000，首付 $3,000；5年车贷 APR 6%。燃油/维护 $150/月，车险 $165/月。',[],[['买车',()=>{if(state.cash<3000||state.carOwned)return;state.cash-=3000;(state.financeLedger??=[]).push({kind:'vehicleDownpayment',month:state.month,amount:3000});state.carOwned=true;state.carValue=24000;state.carRunningCost=150;state.debt['汽车贷款']=21000;state.debtSchedules['汽车贷款']={apr:.06,monthsLeft:60,payment};state.insurance.auto={name:'汽车保险',active:true,monthly:165};finish()},true,state.cash<3000],['暂时不买',finish,false]])};
$('rentalBtn').onclick=()=>window.v242RealEstate();
sellAsset=function(i){const a=state.assets[i];if(!a)return;if(a.kind==='cd'){showEvent('CD','本金已锁定','到期时自动回到现金。',[],[['返回',finish,true]]);return}const proceeds=a.kind==='rental'?(a.value-a.mortgage):(a.value??a.cost);if(!Number.isFinite(proceeds)||state.cash+proceeds<0)return;state.cash+=proceeds;(state.financeLedger??=[]).push({kind:'assetSale',month:state.month,amount:proceeds,assetId:a.id});state.assets.splice(i,1);syncFinance();showEvent('SALE','资产已出售','出售款已计入现金；投资房贷款已随出售清偿。',[['现金变化',money(proceeds)]],[['继续',finish,true]]);render()};
payDebt=function(name){syncFinance();const owed=state.debt[name]||0,amt=Math.min(owed,state.cash,1000);if(amt<=0)return;state.cash-=amt;const loan=state.loans.find(l=>loanDebtName(l)===name),rental=state.assets.find(a=>'投资房 · '+a.id===name);if(loan)loan.balance-=amt;else if(rental)rental.mortgage-=amt;else if(name==='自住房贷款'){state.homeMortgage-=amt;state.homeEquity+=amt}else{state.debt[name]-=amt;if(state.debt[name]<=0){delete state.debt[name];delete state.debtSchedules[name]}}syncFinance();render();};
// Qualification checks apply to the initial role's credentials and relevant experience.
function careerMissing(c){const d=c.domain||inferDomain(c.name),miss=[];if((EDU_RANK[state.education]||0)<EDU_RANK[c.edu])miss.push('学历：'+EDU[c.edu].name);if(d!=='general'&&d!=='hospitality'&&state.major!==d)miss.push('专业：'+d);const exp=d==='general'?(state.experienceYears||0):((state.domainExperience[d]||0)/12);if(exp<c.minExp)miss.push('相关经验 '+c.minExp+' 年');if(d==='nursing'&&!state.licenses.includes('RN'))miss.push('RN 执照');if(d==='education'&&!state.licenses.includes('teaching'))miss.push('教师执照');return miss}
$('jobMarketBtn').onclick=()=>{syncFinance();showEvent('JOB MARKET','工作机会','学历、专业、相关经验和已有执照共同决定资格。',CAREERS.map(c=>[c.name,money(c.salary)+'/年 · '+(careerMissing(c).join(' · ')||'可申请')]),CAREERS.map(c=>['申请 '+c.name,()=>{if(careerMissing(c).length)return;if(Math.random()>=.55+Math.min(.25,(state.experienceYears||0)*.03)){showEvent('CAREER','这次没有录取','可以再次申请，或返回继续本月。',[],[['返回',finish,true]]);return}state.job=c.name;state.salary=roundCash(c.salary/12);state.annualSalary=c.salary;state.unemployedMonths=0;showEvent('CAREER','求职成功','工资从本月月末结算开始计入。',[['职位',c.name]],[['继续',finish,true]])},false,careerMissing(c).length>0]).concat([['返回',finish,true]]))};
function settleLoan(l,balance){if(balance<=0)return{balance:0,paid:0,interest:0,principal:0};const interest=balance*l.apr/12,paid=l.monthsLeft===1?balance+interest:Math.min(l.payment,balance+interest),principal=paid-interest;l.monthsLeft=Math.max(0,l.monthsLeft-1);return{balance:Math.max(0,roundCash(balance-principal)),paid:roundCash(paid),interest:roundCash(interest),principal:roundCash(principal)}}
function settleMonthUnsafe(){
 if(!state||pending)return;if(state.housing==='unselected'||!state.housing){$('housingBtn').click();return}if(state.turn?.index!==9){window.startV24Turn?.(false);return}
 pending=true;const s=state,recovery=typeof isRecoveryMonth==='function'&&isRecoveryMonth(s),recoveryTreatment=recovery?Object.values(s.treatments).find(t=>t.paid&&t.status!=='completed'&&t.startMonth===s.month):null;syncFinance();const start=s.cash,month=s.month+1,metrics=calcMetrics(),cf=metrics.remainingCF;
 // All recurring flows are paid here; purchases remain immediate actions.
 s.cash+=cf;const settlement={month,startCash:start,recovery:!!recovery,careerIncome:metrics.careerIncome?structuredClone(metrics.careerIncome):null,investmentIncomeBudget:typeof expectedInvestmentIncome==='function'?expectedInvestmentIncome():0,grossSalary:metrics.grossSalary,tax:metrics.tax,kContrib:metrics.kContrib,passive:s.passive,expenses:s.expenses,netCF:cf,prepaidExpenses:metrics.prepaidExpenses,totalMonthlyCF:metrics.monthlyCF};
 const rr=s.retirement;if(metrics.kContrib>0){rr.k401Balance+=metrics.kContrib+Math.min(metrics.kContrib,metrics.grossSalary*.03);rr.totalContrib=(rr.totalContrib||0)+metrics.kContrib}
 if(typeof settleMonthlyDebts==='function')settleMonthlyDebts(settlement);else{s.loans.forEach(l=>{const p=settleLoan(l,l.balance);l.balance=p.balance});for(const [name,l]of Object.entries(s.debtSchedules)){if(!(s.debt[name]>0)){delete s.debtSchedules[name];continue}const p=settleLoan(l,s.debt[name]);s.debt[name]=p.balance;if(p.balance===0){delete s.debt[name];delete s.debtSchedules[name]}}}
 s.economyMonths=(s.economyMonths||0)+1;if(s.economyMonths>=6&&Math.random()<.18){s.economy=Math.floor(Math.random()*ECONOMIES.length);s.economyMonths=0}const ec=ECONOMIES[s.economy||0],shock=s.worldShock?.monthsLeft>0?WORLD_SHOCKS[s.worldShock.index]:null,marketChange=simulatedMarketReturn(ec,shock);
 s.assets.forEach(a=>{if(a.kind==='rental'){const p=settleLoan({apr:a.apr,payment:a.payment,monthsLeft:a.monthsLeft},a.mortgage);a.mortgage=p.balance;a.monthsLeft=Math.max(0,a.monthsLeft-1);a.value=roundCash(a.value*(1+ec.home));}else if(a.kind==='cd'){a.interestAccrued=(a.interestAccrued||0)+a.cost*a.rate/12;}else if(!a.instrument&&(a.kind==='market'||a.kind==='stock'))a.value=roundCash((a.value??a.cost)*(1+marketChange*(a.category==='股票'||a.kind==='stock'?1.6:a.category==='基金'?.9:1)));});
 s.assets=s.assets.filter(a=>{if(a.kind==='cd'&&month>=a.maturesAt){const payout=roundCash(a.cost+(a.interestAccrued||0));s.cash+=payout;settlement.cdPayout=(settlement.cdPayout||0)+payout;return false}return true});
 advanceQuotes(marketChange,month);
 if(typeof settleInvestingBatch==='function')settleInvestingBatch(settlement,month);
 for(const k of ['k401Balance','iraBalance','brokerageBalance'])rr[k]=roundCash((rr[k]||0)*(1+marketChange));
 if(s.carOwned)s.carValue=roundCash(s.carValue*.995);
 if(s.homeMortgage>0){const old=s.homeMortgage,p=settleLoan({apr:ec.rate,payment:s.housingCost,monthsLeft:360},old);s.homeMortgage=p.balance;s.homeEquity+=old-p.balance;}
 if(!recovery&&s.job&&!s.retired&&!s.unemployedMonths){const d=inferDomain(s.job);s.domainExperience[d]=(s.domainExperience[d]||0)+1;s.workMonths=(s.workMonths??(s.experienceYears||0)*12)+1;s.experienceYears=Math.floor(s.workMonths/12)}
 if(!recovery&&s.burnoutMonths>0){s.burnoutMonths--;if(s.job&&!s.retired)s.salary=roundCash(s.salary*.995)}if(!recovery&&s.stress>90&&Math.random()<.12){s.burnoutMonths=3;s.energy=Math.max(0,s.energy-15);s.happiness=Math.max(0,s.happiness-8)}if(s.unemployedMonths>0)s.unemployedMonths--;if(s.romance)s.romance.months++;s.month=month;
 if(s.study&&!recovery){s.study.progress++;if(s.study.progress>=s.study.total){const previous=s.education,target=s.study.target;s.education=target;s.study=null;const ranks={highschool:0,associate:1,bachelor:2,master:3,professional:4};s.educationRaises??={};if(s.job&&!s.retired&&(ranks[target]??0)>(ranks[previous]??0)&&!s.educationRaises[target]){const rate=educationRaiseRate(target),before=s.salary;s.salary=roundCash(before*(1+rate)/((typeof isCoffeeRole==='function'&&(isCoffeeRole()||typeof shiftWorking==='function'&&shiftWorking()))?1+educationRaiseRate(previous):1));s.annualSalary=roundCash(s.salary*12);s.educationRaises[target]={month,rate,before,after:s.salary};settlement.educationRaise={target,rate,before,after:s.salary};s.timeline.push('完成'+EDU[target].name+'，当前税前薪资提高'+Math.round(rate*100)+'%，下月起按新工资结算');}}}
 if(!recovery){s.happiness=Math.max(0,s.happiness-1);s.energy=Math.max(0,s.energy-2);s.stress=Math.min(100,s.stress+2);s.social=Math.max(0,s.social-1);s.friendship=Math.max(0,s.friendship-.5);if(s.relationship==='married')s.partnerQuality=Math.max(0,s.partnerQuality-.4);s.mood=Math.max(0,s.mood-1);if(s.stress>75)s.health=Math.max(0,s.health-2);else if(s.stress<45&&s.energy>55)s.health=Math.min(100,s.health+.5);(s.people||[]).forEach(p=>p.relation=Math.max(0,p.relation-.22));}
 s.annualInflation=Math.max(-.005,Math.min(.10,(s.economy===4?.055:s.economy===3?.015:s.economy===1?.03:.025)+(shock?.inflation||0)));if(s.worldShock?.monthsLeft>0){s.worldShock.monthsLeft--;if(!s.worldShock.monthsLeft)s.worldShock=null}const infl=Math.pow(1+s.annualInflation,1/12);s.marketIndex=(s.marketIndex||100)*(1+marketChange);s.homeIndex=(s.homeIndex||100)*(1+ec.home);s.cpiIndex=(s.cpiIndex||100)*infl;s.baseLiving=roundCash(s.baseLiving*infl);if(s.housing!=='own')s.housingCost=roundCash(s.housingCost*(1+(infl-1)*.45));
 s._computedExpenses=null;syncFinance();if(typeof completeCashAudit==='function')completeCashAudit(settlement);settlement.endCash=s.cash;s.lastSettlement=settlement;s.history.push(settlement);if(typeof finalizeCoffeeMonth==='function')finalizeCoffeeMonth(settlement);
 if(month%12===0){s.age++;(s.people||[]).forEach(p=>p.age++);const g=goalStats();s.goalProgressHistory.push({year:month/12,age:s.age,pct:g.pct,current:g.current,target:g.target});s.yearStartNetWorth=calcMetrics().nw;s.yearStartCash=s.cash;if(!recovery&&s.job&&!s.retired){const growth=s.experienceYears<=5?.035:s.experienceYears<=10?.025:.015;s.salary=roundCash(s.salary*(1+growth));s.annualSalary=roundCash(s.salary*12)}}
 if(!recovery)applyCareerProgression();if(recoveryTreatment){completeTreatment(s,{id:recoveryTreatment.id,completedMonth:month-1,monthEffectsComplete:true});settlement.recoveryTreatmentId=recoveryTreatment.id;}s.turn={month:s.month,index:0,startCash:s.cash};save();render();if(typeof showMonthlyAudit==='function')showMonthlyAudit(settlement);else showEvent('MONTH END','第 '+month+' 月结算完成','本月已结算。',[['当前现金',money(s.cash)]],[['继续',()=>{clearModals();monthlyEvent()},true]]);
}
// Settlement owns its synchronous lock; a stale event flag cannot strand the month.
let settlementInProgress=false;
function settleMonth(){
 if(!state||state.gameOver||settlementInProgress)return;if(state.requiredIncident?.status==='unpaid'){openRequiredIncident();return}
 if(document.querySelector('.event-active')||$('v242RE').classList.contains('open'))return;
 pending=false;
 if(state.turn?.index!==9||!state.housing||state.housing==='unselected'){settleMonthUnsafe();return}
 const snapshot=JSON.parse(JSON.stringify(state));
 settlementInProgress=true;
 try{settleMonthUnsafe()}
 catch(error){
  console.error('Monthly settlement rolled back',error);
  state=snapshot;pending=false;clearModals();save();render();window.refreshV24Turn?.();
  showEvent('月末结算','本次结算未完成','本月账目已恢复，未重复扣款。请返回本月确认后重试。',[],[['返回本月确认',finish,true]]);
 }finally{settlementInProgress=false}
}
// Keep existing random opportunity content available in the opportunity action, rather than a second settlement.
$('businessBtn').onclick=(()=>{const base=$('businessBtn').onclick;return()=>base()})();

function monthlyEvent(){pending=true;$('next').disabled=true;if(!state.worldShock&&maybeWorldShock()){render();return;}if(maybeDreamStory()){render();return;}if(maybeNetworkCareerStory()){render();return;}if(maybePeopleStory()){render();return;}if(state.job&&!state.retired&&state.unemployedMonths===0&&Math.random()<((state.economy===3?.055:.012)+(industryScore()<90?.018:0))){state.unemployedMonths=2+Math.floor(Math.random()*3);const benefit=state.incomeProtection?Math.round(state.salary*.55):0;if(benefit){state.cash+=benefit;showEvent('RISK','暂时失业','经济或公司变化导致你暂时失去工作。收入保障支付了本月简化给付。',[['失业期',state.unemployedMonths+' 个月'],['本月保障给付',money(benefit)],['应急金',money(state.emergencyFund)]],[['继续',finish,true]]);}else{showEvent('RISK','暂时失业','经济或公司变化导致你暂时失去工作。失业期间没有工资，应急金和被动收入将承担生活支出。',[['失业期',state.unemployedMonths+' 个月'],['工资','$0/月'],['应急金',money(state.emergencyFund)]],[['继续',finish,true]]);}render();return;}const r=Math.random();if(r<.38){const d=DEALS[Math.floor(Math.random()*DEALS.length)];if(d[0]==='小型出租屋首付'){$('rentalBtn').click();return}const ret=Math.round(d[3]*12/d[2]*100);showEvent('OPPORTUNITY',d[0],d[1],[['需要现金',money(d[2])],['月现金流','+'+money(d[3])],['现金回报率',ret+'%/年']],[['购买',()=>{if(state.cash<d[2])return;state.cash-=d[2];state.assets.push({name:d[0],cost:d[2],value:d[2],cf:d[3],kind:d[0]==='宽基指数基金'?'market':'business',category:'基金'});finish()},true,state.cash<d[2]],['跳过',finish,false]])}else if(r<.56){const x=STOCKS[Math.floor(Math.random()*STOCKS.length)],price=Math.max(1,Math.round(x[1]*(state.marketIndex/100)*(.72+Math.random()*.55))),qty=Math.max(1,Math.min(50,Math.floor(state.cash/price/4)));showEvent('MARKET',x[0],`当前报价 ${money(price)}/股；游戏参考区间 ${money(x[2])}–${money(x[3])}。股票不提供固定月现金流。`,[['当前价',money(price)],['参考区间',money(x[2])+'–'+money(x[3])],['建议批量',qty+' 股']],[['买 '+qty+' 股',()=>{const c=price*qty;if(state.cash<c)return;state.cash-=c;state.assets.push({name:x[0]+' × '+qty,cost:c,cf:0,kind:'stock'});finish()},true,state.cash<price*qty],['跳过',finish,false]])}else if(r<.68){const c=CDS[Math.floor(Math.random()*CDS.length)],monthly=Math.round(c[1]*c[2]/12*100)/100;showEvent('SAFE ASSET',c[0],c[0]==='高收益储蓄'?'储蓄账户本金可随时取回；游戏把利息每月付入现金。':'CD本金锁定12个月，利息在到期时结算。',[['最低投入',money(c[1])],['年利率',(c[2]*100).toFixed(1)+'%'],['月利息',money(monthly)]],[['存入',()=>{if(state.cash<c[1])return;state.cash-=c[1];state.assets.push({name:c[0],cost:c[1],cf:c[0]==='高收益储蓄'?monthly:0,kind:c[0]==='高收益储蓄'?'savings':'cd',rate:c[2],maturesAt:c[0]==='高收益储蓄'?null:state.month+12,interestAccrued:0});finish()},true,state.cash<c[1]],['跳过',finish,false]])}else if(r<.84){const pool=(Math.random()<.55?AGE_EVENTS[lifeStage()]:LIFE).filter(e=>eventEligible(e[0]));const e=pool[Math.floor(Math.random()*pool.length)];if(!e){finish();return}let cost=e[2];if(e[0]==='医疗自付额'&&state.healthInsurance)cost=Math.round(cost*.35);showEvent('LIFE',e[0],e[0]==='搬家押金'?'你发现了更合适的住处。是否搬家由你决定；选择搬家后再处理住房。':e[1]+(e[0]==='医疗自付额'&&state.healthInsurance?' 医疗保险会降低本次自付成本。':''),[['预计费用',money(cost)],['当前幸福度',Math.round(state.happiness)+'/100']],[[e[0]==='搬家押金'?'搬家':'正常处理',()=>{if(e[0]==='搬家押金'){$('housingBtn').click();return}let c=cost;if(state.emergencyFund>0&&c>state.cash){const use=Math.min(state.emergencyFund,c-state.cash);state.emergencyFund-=use;c-=use;}state.cash-=c;state.happiness=Math.min(100,state.happiness+1);finish()},true],[e[0]==='搬家押金'?'暂时不搬':'尽量省钱',()=>{if(e[0]==='搬家押金'){finish();return}state.cash-=Math.round(cost*.55);state.happiness=Math.max(0,state.happiness-4);finish()},false]])}else if(r<.95){const a=[250,400,600,850][Math.floor(Math.random()*4)];state.cash+=a;showEvent('BONUS','额外收入','你获得了一笔奖金或项目收入。',[['收入','+'+money(a)]],[['存入现金',finish,true]])}else{if(!state.job||state.retired){finish();return}state.salary=Math.round(state.salary*1.03);state.annualSalary=Math.round(state.salary*12);showEvent('CAREER','绩效加薪','工作表现不错，你的月工资额外提高 3%。',[['新月薪',money(state.salary)],['新年薪',money(state.annualSalary)]],[['继续',finish,true]])}render()}

for(const [id,section] of Object.entries({qOverview:'overview',qCareer:'career',qLife:'life',qAssets:'wealth',hubCareer:'career',hubLife:'life',hubWealth:'wealth'}))$(id).onclick=()=>{$('game').classList.remove('v24-running');showV21Section(section);window.scrollTo({top:0,behavior:'instant'})};
$('cityBtn').onclick=()=>{const old=CITIES[state.city];showEvent('CITY','考虑搬家','先查看城市，只有明确确认才扣搬家费。',[],Object.entries(CITIES).filter(([k])=>k!==state.city).map(([k,c])=>['查看 '+c.name,()=>{const cost=Math.round(1200*c.cost);showEvent('CITY',c.name,c.desc,[['搬家费用',money(cost)]],[['搬去 '+c.name,()=>{if(state.cash<cost)return;state.cash-=cost;state.baseLiving=roundCash(state.baseLiving*c.cost/old.cost);state.city=k;state.moves++;state.housing='unselected';state.housingCost=0;state._computedExpenses=null;syncFinance();finish();$('housingBtn').click()},true,state.cash<cost],['返回城市列表',()=>$('cityBtn').click(),false]])},false]).concat([['留在当前城市',finish,true]]))};

function eventEligible(name){return !(name==='汽车维修'&&!state.carOwned || name==='宠物临时照护'&&!state.pets.length || name==='孩子活动费'&&!state.children || name==='室友搬走'&&state.housing!=='shared' || name==='房屋维修'&&state.housing!=='own'&&!state.assets.some(a=>a.kind==='rental') || name==='保险上涨'&&!Object.values(state.insurance).some(i=>i.active));}
// Education is a preview until the player explicitly pays the tuition.
function educationUndoQuote(){
 const st=state.study;if(!st)return null;
 if(st.receipt&&st.progress===0&&st.receipt.paidMonth===state.month)return{cash:st.receipt.tuition,autoDebt:0,legacy:false};
 const ed=EDU[state.education],debt=state.debt['学生贷款']||0;
 // V25's initial-month auto-enrolment is identifiable: no earlier course can have completed at month zero.
 if(!st.receipt&&state.month===0&&st.progress===0&&ed?.next===st.target&&debt>=ed.cost*.65&&debt<=ed.cost)return{cash:roundCash(ed.cost-debt),autoDebt:debt,legacy:true};
 return null;
}
function openEducation(){
 if(!state)return;
 if(state.study){const st=state.study,q=educationUndoQuote();const data=[['当前课程',EDU[st.target].name],['学习进度',st.progress+'/'+st.total+' 个月']];
  if(q){data.push(['撤销后现金退回',money(q.cash)],['撤销的旧自动贷款',money(q.autoDebt)]);}else data.push(['退出说明','已支付学费与已有贷款保留']);
  showEvent('EDUCATION','当前学习计划',q?(q.legacy?'这是旧版首月自动报名。以下按旧版融资规则列出撤销金额；只有点击撤销才会修改。你另外确认申请的银行贷款不会被删除。':'本月刚报名、尚未开始学习。可撤销报名并退回本次学费；已确认申请的贷款仍保留，可自行还款。'):'可以退出学习。该存档没有可核对的本月退款凭证，不会自动抹掉历史贷款。',data,[[q?(q.legacy?'撤销旧版自动报名':'撤销本月报名并退回学费'):'退出学习（学费不退）',()=>{if(state.study!==st)return;if(q){const fresh=educationUndoQuote();if(!fresh||fresh.cash!==q.cash||fresh.autoDebt!==q.autoDebt)return;state.cash+=q.cash;if(q.autoDebt){state.debt['学生贷款']-=q.autoDebt;if(state.debt['学生贷款']<=0)delete state.debt['学生贷款'];delete state.debtSchedules['学生贷款'];}state.financeLedger??=[];state.financeLedger.push({kind:'tuitionReversal',month:state.month,amount:q.cash,oldAutomaticDebtReversed:q.autoDebt});}state.study=null;finish()},false],['继续保留学习计划',finish,true]]);return;
 }
 const ed=EDU[state.education];if(!ed?.next){showEvent('EDUCATION','学历学习','当前没有更高学历路线，可以继续练习兴趣技能。',[],[['返回',finish,true]]);return}
 const target=ed.next,cost=ed.cost,shortfall=Math.max(0,roundCash(cost-state.cash));
 showEvent('EDUCATION',EDU[target].name+' · 课程预览','查看和返回都不会报名、扣款或生成贷款。贷款到账后，仍需在这里单独确认交学费。',[['学制',ed.months+' 个月'],['一次性学费',money(cost)],['可用现金',money(state.cash)],['还差',money(shortfall)],['支付后现金',state.cash>=cost?money(state.cash-cost):'现金不足，需先筹款'],['贷款金额说明','默认按完整学费预览，可调低；只借差额会用尽当前现金。']],[['确认投资自己 · 支付学费 '+money(cost),()=>{if(state.study||EDU[state.education]?.next!==target||state.cash<cost)return;state.cash=roundCash(state.cash-cost);state.nextEducationId=(state.nextEducationId||0)+1;const id='tuition-'+state.nextEducationId;state.study={target,progress:0,total:ed.months,receipt:{id,tuition:cost,paidMonth:state.month}};state.financeLedger??=[];state.financeLedger.push({id,kind:'tuitionPayment',month:state.month,amount:cost,target});finish()},true,state.cash<cost],['申请学生贷款',()=>{finish();openBankLoan(cost,{type:'学生贷款',educationTarget:target,after:openEducation})},false],['返回，不报名',finish,false]]);
}

function debtDisplayName(name){const l=state.loans.find(l=>loanDebtName(l)===name);return l?(l.type||'银行贷款')+' · 剩余'+l.monthsLeft+'期':name}

