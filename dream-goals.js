// Fixed opening dreams and their dedicated savings balances.
const DreamGoals=(()=>{
 const goals={
  dreamHome:{name:'有一套自己的房子',target:396550,desc:'全款购房 $385,000，加过户预算 $11,550。'},
  dreamBookshop:{name:'开一家有咖啡香的书店',target:150000,desc:'开店资金 $120,000，加三个月运营储备 $30,000。'},
  dreamFilm:{name:'拍一部自己的电影',target:1000000,desc:'筹齐一部独立剧情长片的拍摄、后期与首映资金。'},
  dreamRest:{name:'躺平',target:144000,desc:'按每月 $4,000，备足三年自由生活费。'},
  dreamSchool:{name:'捐一座学校',target:46600000,desc:'建校资金 $38,600,000，加首年运营经费 $8,000,000。'},
  dreamTravel:{name:'世界那么大我想去看看（环球旅行）',target:72000,desc:'一年旅费 $60,000，加返程生活储备 $12,000。'},
  dreamPark:{name:'建造属于自己的游乐园',target:104000000,desc:'备齐区域主题乐园的全额建设资金。'},
  dreamCruise:{name:'拥有一艘可以航行全球的邮轮',target:610000000,desc:'邮轮 $600,000,000，加首航预算 $10,000,000。'},
  dreamScholarship:{name:'建一笔助学基金',target:100000,desc:'备齐 $100,000 基金本金，年度发放目标 $3,000。'},
  dreamRetire:{name:'提前退休，自由安排时间',target:240000,desc:'按每月 $4,000，备足五年退休过渡金。'}
 };
 const cents=value=>Math.round(value*100);
 const amount=value=>cents(value)/100;
 const selected=s=>s&&Object.hasOwn(goals,s.lifeGoal)?goals[s.lifeGoal]:null;
 const balance=s=>selected(s)?s.dreamSavings||0:0;
 function progress(s){
  const g=selected(s);if(!g)return null;
  const current=balance(s),target=g.target;
  return {g,current,target,pct:Math.min(100,current/target*100),remaining:amount(Math.max(0,target-current)),label:'梦想专款',ready:current>=target};
 }
 // Annual planning allowances: 1% property tax, $85/month insurance, 1% maintenance.
 const fullCashHomeMonthly=amount(385000*.02/12+85);
 function freedom(s){
  const months=Array.from({length:12},(_,i)=>s.month-11+i);
  const byMonth=new Map((s.history||[]).slice(-12).map(row=>[row.month,row.dreamFinance]));
  const records=months.map(month=>byMonth.get(month)).filter(Boolean);
  const income=amount(records.reduce((sum,row)=>sum+row.income,0));
  const expenses=amount(records.reduce((sum,row)=>sum+row.expenses,0));
  const reserve=amount(Math.max(0,(s.cash||0)+(s.emergencyFund||0)));
  const required=amount((s.expenses||0)*6);
  const ready=!!s.housing&&s.housing!=='unselected'&&records.length===12&&expenses>0&&income>=expenses&&reserve>=required;
  const homeExpenses=s.lifeGoal==='dreamHome'?amount(Math.max(0,s.expenses-(s.housingCost||0))+fullCashHomeMonthly):0;
  const homeReady=!homeExpenses||(income>=amount(homeExpenses*12)&&reserve>=amount(homeExpenses*6));
  return {months:records.length,income,expenses,reserve,required,ready,homeExpenses,homeReady};
 }
 function recordMonth(s,receipt){
  if(!selected(s))return;
  const ledger=receipt.ledger||[];
  const cdInterest=ledger.filter(row=>['cdInterest','cdEarlyInterest'].includes(row.kind)).reduce((sum,row)=>sum+row.amount,0);
  receipt.dreamFinance={
   expenses:receipt.expenses,
   income:amount(receipt.passive+(receipt.dividends||0)+(receipt.bondInterest||0)+(receipt.cafeDividend||0)+(receipt.dreamMapIncome||0)+cdInterest)
  };
 }
 function transfer(s,value,direction){
  if(!selected(s)||!['deposit','withdraw'].includes(direction)||
     !Number.isFinite(value)||value<=0||Math.abs(cents(value)/100-value)>1e-8)return false;
  const current=balance(s),deposit=direction==='deposit';
  if(value>(deposit?s.cash:current))return false;
  s.cash=amount(s.cash+(deposit?-value:value));
  s.dreamSavings=amount(current+(deposit?value:-value));
  (s.financeLedger??=[]).push({month:s.month,kind:deposit?'dreamSavingsDeposit':'dreamSavingsWithdrawal',amount:value});
  if(deposit){
   const next=progress(s),earned=s.dreamSavingsMilestones??=[];
   for(const milestone of [25,50,75,100]){
    if(next.pct<milestone||earned.includes(milestone))continue;
    earned.push(milestone);
    (s.achievements??=[]).push(next.g.name+' · 筹资 '+milestone+'%');
   }
  }
  return true;
 }
 return {goals,selected,balance,progress,freedom,recordMonth,transfer};
})();
