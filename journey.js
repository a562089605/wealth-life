// Two-stage single-player progression. Every financial value stays in the canonical state.
const FAST_CASHFLOW_TARGET = 50000;
Object.assign(LIFE_GOALS,DreamGoals.goals);
const dreamSelect=$('lifeGoal');
dreamSelect.replaceChildren(...Object.entries(DreamGoals.goals).map(([id,goal])=>
  new Option(goal.name+' · '+money(goal.target).replace(/\.00$/,''),id)));
dreamSelect.onchange();
const FAST_PROJECTS = [
  {id:'fast-apartments',name:'小型公寓组合',cost:400000,rent:6200,operating:3000,cf:3200,chance:1,salvage:1,kind:'rental',desc:'整组现金买入；净租金已扣空置、税费、保险和维护准备金。'},
  {id:'fast-shops',name:'连锁咖啡项目',cost:600000,revenue:18000,operating:13000,cf:5000,chance:.85,salvage:.5,kind:'business',desc:'收购并整合门店。落地失败时保留一半投入的可出售残值，不产生经营收入。'},
  {id:'fast-logistics',name:'仓储物业组合',cost:1200000,rent:19000,operating:9500,cf:9500,chance:1,salvage:1,kind:'rental',desc:'现金购买仓储物业，净租金已扣运营与预期空置。房产市值随游戏经济变化。'},
  {id:'fast-digital',name:'数字服务企业',cost:900000,revenue:27000,operating:18500,cf:8500,chance:.9,salvage:.4,kind:'business',desc:'收购客户合同及服务团队。整合失败时资产仅保留40%残值，不产生收入。'},
  {id:'fast-clinic',name:'诊所运营股权',cost:1500000,revenue:40000,operating:27500,cf:12500,chance:.9,salvage:.6,kind:'business',desc:'持有运营企业股权，净分配已扣人员和运营预算；失败仅保留60%残值。'},
  {id:'fast-commercial',name:'商业中心组合',cost:2500000,rent:40000,operating:20000,cf:20000,chance:1,salvage:1,kind:'rental',desc:'整组商业物业现金收购。显示的是扣除运营后的游戏净租金，不承诺现实收益。'}
];
function journeyState(){
  if(!state)return null;
  state.gameProgress??={version:1,phase:'rat',entryMonth:null,entryPassive:0,entryExpenses:0,win:null};
  return state.gameProgress;
}
function journeyMapPassiveIncome(){
  const market=typeof townMarketMonthlyIncome==='function'?townMarketMonthlyIncome(state,{forecast:true}):0;
  const projects=typeof townProjectPassiveIncome==='function'?townProjectPassiveIncome(state):0;
  return roundCash(market+projects);
}
function journeyPassiveIncome(){
  return roundCash(state.passive+journeyMapPassiveIncome());
}
function freedomEligible(){
  syncFinance();
  if(DreamGoals.selected(state))return DreamGoals.freedom(state).ready;
  return !!state.housing&&state.housing!=='unselected'&&state.expenses>0&&journeyPassiveIncome()>state.expenses;
}
function fastCashFlow(){
  return roundCash(state.assets.reduce((sum,a)=>sum+(a.fastTrack?Number(a.cf)||0:0),0));
}
function enterFastTrack(){
  const j=journeyState();
  if(j.phase!=='rat'||!freedomEligible())return;
  const dream=DreamGoals.selected(state);
  const snapshot=dream?JSON.stringify(state):null;
  const freedom=dream?DreamGoals.freedom(state):null;
  j.phase='fast';j.entryMonth=state.month;
  j.entryPassive=freedom?roundCash(freedom.income/12):journeyPassiveIncome();
  j.entryExpenses=freedom?roundCash(freedom.expenses/12):state.expenses;
  j.entryNetWorth=calcMetrics().nw;
  (state.timeline??=[]).push('第'+(state.month+1)+'个月：进入财务自由快车道');
  state.achievements=[...new Set([...(state.achievements||[]),'进入财务自由快车道'])];
  if(dream){
    const won=recordSavingsVictory();
    if(!persistDreamChange(snapshot))return;
    render();
    if(won)return showVictory();
  }else{save();render();}
  showEvent('阶段升级','欢迎进入第二阶段','现有现金、资产和负债原值保留。你可以继续工作、生活，并选择更大的投资项目。',[['进入时被动收入',money(j.entryPassive)+'/月'],['进入时必要支出',money(j.entryExpenses)+'/月'],['本次收支','$0.00']],[['查看快车道机会',openFastProjects,true],['继续本月安排',finish,false]]);
}
function openJourney(){
  const j=journeyState();
  if(j.win){showVictory();return}
  if(DreamGoals.selected(state))return openSavingsDream();
  syncFinance();
  if(j.phase==='rat'){
    const eligible=freedomEligible();
    showEvent('人生阶段','第一阶段：积累资产','通过资产建立被动收入。被动收入必须严格大于必要月支出，且已确定住房，才能确认进入第二阶段。地图资产按预计月净收入计入，浮动收入按平均值估算。工资、借款到账、投资浮盈和一次性回款不计入。',[['被动收入',priceText(journeyPassiveIncome())+'/月'],['其中地图资产净收入',priceText(journeyMapPassiveIncome())+'/月'],['必要生活/保费/月供',priceText(state.expenses)+'/月'],['离严格超过还差',priceText(Math.max(0,roundCash(state.expenses-journeyPassiveIncome()+.01)))+'/月'],['下一阶段','财务自由 · 快车道']],[['确认进入财务自由',enterFastTrack,true,!eligible],['返回继续积累',finish,false]]);
    if($('eventTitle').textContent==='第一阶段：积累资产'){
      const art=document.createElement('img');
      art.className='journey-stage-art';
      art.src='./assets/finance/asset-growth-crayon.webp';
      art.alt='';
      const description=$('eventDesc');
      const copy=document.createElement('p');
      copy.className='journey-stage-copy';
      copy.textContent=description.textContent;
      description.textContent='';
      $('eventData').prepend(art,copy);
    }
    return;
  }
  const gs=goalStats(),cf=fastCashFlow(),covered=freedomEligible();
  showEvent('人生阶段','第二阶段：财务自由','保留月度生活流程。满足任一路线即可通关：实现开局人生目标，或快车道项目当前新增净收入达到 $50,000.00/月；通关时被动收入仍需覆盖必要支出。',[['快车道新增净收入',money(cf)+' / $50,000.00 每月'],['开局人生目标',gs.g.name],['进入时被动收入',money(j.entryPassive)+'/月'],['当前收支安全',covered?'被动收入覆盖支出':'出现缺口，优先恢复现金流']],[['查看快车道机会',openFastProjects,true],['查看并实现人生梦想',openDreamFulfilment,false],['继续生活',finish,false]]);
}
function dreamQuote(){
  const gs=goalStats(),type=gs.g.type;
  const isExperience=type==='travel',isDonation=gs.g.project==='foundation';
  const cashCost=type==='project'||isExperience?roundCash(gs.target):0;
  const assetCreated=type==='project'&&!isDonation?cashCost:0;
  return{gs,cashCost,assetCreated,isExperience,isDonation,can:journeyState().phase==='fast'&&freedomEligible()&&gs.ready&&state.cash>=cashCost};
}
function openDreamFulfilment(){
  const j=journeyState();
  if(j.win){showVictory();return}
  const q=dreamQuote(),gs=q.gs;
  const explanation=q.assetCreated?'确认后现金投入目标项目，增加同额梦想用途资产；该资产暂不产生经营收入。':q.cashCost?'确认后实际支付旅行或公益预算，该费用不增加个人资产。':'这是财务资产目标。满足原目标即可确认，不会将退休或投资本金作为费用扣掉。';
  showEvent('人生梦想',gs.g.name,explanation+' 通关还需已进入第二阶段，并保持被动收入覆盖支出。',[['原目标要求',money(gs.target)+' · '+gs.label],['当前目标进度',money(gs.current)+' · '+gs.pct.toFixed(1)+'%'],['本次现金支出',priceText(q.cashCost)],['本次新增资产',priceText(q.assetCreated)],['可用现金',priceText(state.cash)],['年龄计划',gs.g.age+'岁；超期仍可继续完成']],[['确认实现梦想',fulfilDream,true,!q.can],['返回',finish,false]]);
}
function fulfilDream(){
  const j=journeyState();if(j.win)return;
  const q=dreamQuote();if(!q.can)return;
  const goalId=state.lifeGoal;
  if(!spendConfirmed('dreamFulfilment',q.cashCost,{goal:goalId}))return;
  if(q.assetCreated)state.assets.push({id:assetId(),name:'梦想：'+q.gs.g.name,kind:'dream',cost:q.cashCost,value:q.assetCreated,cf:0,dreamGoal:goalId});
  state.dreamFulfilment={goal:goalId,month:state.month,spent:q.cashCost,assetCreated:q.assetCreated,beforeProgress:q.gs.current,target:q.gs.target};
  if(q.gs.g.type==='project'){state.dreamProject??={stage:0,invested:0};state.dreamProject.stage=6;state.dreamProject.invested=(state.dreamProject.invested||0)+q.cashCost;state.dreamProject.completedMonth=state.month;}
  state.goalCompleted=true;state.goalCelebrated=true;
  winJourney('dream',q.gs.g.name);
}
function cashFlowWinReady(){return !DreamGoals.selected(state)&&journeyState().phase==='fast'&&!journeyState().win&&fastCashFlow()>=FAST_CASHFLOW_TARGET&&freedomEligible()}
function winJourney(reason,title){
  if(!recordJourneyWin(reason,title))return;
  save();render();showVictory();
}
function recordJourneyWin(reason,title){
  const j=journeyState();if(j.win)return false;
  syncFinance();
  j.win={reason,title,month:state.month,age:state.age,fastCashFlow:fastCashFlow(),passive:journeyPassiveIncome(),expenses:state.expenses,netWorth:calcMetrics().nw};
  (state.timeline??=[]).push('第'+(state.month+1)+'个月：通关 · '+title);
  state.achievements=[...new Set([...(state.achievements||[]),'财富人生通关：'+title])];
  return true;
}
function showVictory(back=finish){
  const win=journeyState().win;if(!win)return;
  showEvent('已通关','财富人生：目标达成',win.reason==='dreamSavings'?'梦想资金已备齐，财富自由达标。存档保留，你可以继续生活。':win.reason==='dream'?'你进入财务自由后，实现了开局选择的人生目标。存档保留，你可以继续生活。':'你的快车道项目当前新增净收入达到 $50,000.00/月，并仍能覆盖必要支出。存档保留，你可以继续生活。',[['通关路线',win.title],['通关年龄',win.age+'岁'],...(win.reason==='dreamSavings'?[['梦想资金',money(win.savings)],['过去12个月资产净收入',money(win.netIncome)],['过去12个月必要支出',money(win.necessaryExpenses)]]:[['当时被动收入',money(win.passive)+'/月'],['当时快车道新增',money(win.fastCashFlow)+'/月']])],[['继续生活',back,true],...(win.reason==='dreamSavings'?[['管理梦想专款',()=>openSavingsDream('',true),false]]:[]),['保存并返回存档',()=>{save();home()},false]]);
}

function persistDreamChange(snapshot){
  try{
    if(save()!==false)return true;
  }catch(error){console.error('Dream progress save failed',error);}
  const restored=JSON.parse(snapshot);
  for(const key of Object.keys(state))delete state[key];
  Object.assign(state,restored);
  openSavingsDream('本次操作未保存，请重试。',!!journeyState().win);
  return false;
}
function recordSavingsVictory(){
  const goal=DreamGoals.progress(state),j=journeyState();
  if(!goal?.ready||j.phase!=='fast'||j.win)return false;
  const f=DreamGoals.freedom(state);
  if(!f.ready||!f.homeReady)return false;
  recordJourneyWin('dreamSavings',goal.g.name);
  Object.assign(j.win,{savings:goal.current,netIncome:f.income,necessaryExpenses:f.expenses});
  return true;
}
function openSavingsDream(notice='',manage=false){
  syncFinance();
  const progress=DreamGoals.progress(state),f=DreamGoals.freedom(state),j=journeyState();
  if(j.win&&!manage)return showVictory();
  const owner=state,activeSlot=slot,month=state.month;
  const transfer=direction=>{
    if(state!==owner||slot!==activeSlot||state.month!==month)return;
    const input=$('dreamSavingsAmount');
    if(!input?.reportValidity())return;
    const snapshot=JSON.stringify(state);
    if(!DreamGoals.transfer(state,input.valueAsNumber,direction))return openSavingsDream('请输入可转入或转回的有效金额。',manage);
    const won=recordSavingsVictory();
    if(!persistDreamChange(snapshot))return;
    render();
    if(won)return showVictory();
    openSavingsDream(direction==='deposit'?'已存入梦想专款。':'已转回可用现金。',manage);
  };
  const finishGoal=()=>{
    const snapshot=JSON.stringify(state);
    if(recordSavingsVictory()&&persistDreamChange(snapshot)){render();showVictory();}
  };
  const earned=state.dreamSavingsMilestones||[];
  const rows=[
    ['梦想资金',money(progress.current)+' / '+money(progress.target)+' · '+progress.pct.toFixed(1)+'%'],
    ['还差',money(progress.remaining)],
    ['已达里程碑',earned.length?earned.map(value=>value+'%').join(' · '):'首个里程碑 25%'],
    ['可用现金',money(state.cash)],
    ['财富自由 · 已结算月份',f.months+' / 12'],
    ['过去12个月资产净收入',money(f.income)],
    ['同期必要支出',money(f.expenses)],
    ['可用储备（现金及应急金）',money(f.reserve)+' / '+money(f.required)]
  ];
  if(f.homeExpenses)rows.push(['全款入住后预计必要支出',money(f.homeExpenses)+'/月 · '+(f.homeReady?'已达标':'待达标')]);
  const actions=[
    ['存入梦想专款',()=>transfer('deposit'),true,state.cash<=0],
    ['转回可用现金',()=>transfer('withdraw'),false,progress.current<=0]
  ];
  if(j.win)actions.push(['查看通关记录',showVictory,false]);
  else if(j.phase==='rat')actions.push(['进入财富自由快车道',enterFastTrack,false,!f.ready]);
  else{
    actions.push(['确认梦想通关',finishGoal,true,!(f.ready&&f.homeReady&&progress.ready)]);
    actions.push(['查看快车道机会',openFastProjects,false]);
  }
  actions.push(['返回',finish,false]);
  showEvent('我的梦想',progress.g.name,progress.g.desc+' 连续结算 12 个月后，资产净收入覆盖同期必要支出，并备有 6 个月必要支出的储备，即可进入快车道。梦想专款与生活储备分开计算。'+(notice?' '+notice:''),rows,actions);
  const bar=document.createElement('progress');
  bar.max=progress.target;bar.value=progress.current;bar.setAttribute('aria-label','梦想筹资进度');
  bar.style.cssText='width:100%;grid-column:1/-1;accent-color:#82945b';
  $('eventData').prepend(bar);
  const label=document.createElement('label');
  label.textContent='转账金额';label.style.gridColumn='1/-1';
  const input=document.createElement('input');
  input.id='dreamSavingsAmount';input.type='number';input.inputMode='decimal';input.min='0.01';input.step='0.01';input.required=true;
  label.htmlFor=input.id;
  label.append(input);
  $('eventData').append(label);
}
function renderSavingsDream(){
  const j=journeyState(),g=DreamGoals.progress(state),f=DreamGoals.freedom(state);
  const ratio=f.expenses?Math.max(0,Math.min(100,100*f.income/f.expenses)):0;
  const title=j.win?'梦想资金已备齐 · 游戏通关':j.phase==='fast'?'第二阶段 · 快车道':f.ready?'可进入快车道':'第一阶段 · 积累资产';
  const moneyLine='已存 '+money(g.current)+' · 还差 '+money(g.remaining)+' · '+g.pct.toFixed(1)+'%';
  const freedomLine='财富自由 · '+f.months+'/12 月 · 覆盖 '+(f.expenses?Math.max(0,100*f.income/f.expenses).toFixed(0):'0')+'%';
  journeyCard.innerHTML='<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="24" fill="none" stroke="#82945b" stroke-width="5"/><circle cx="32" cy="32" r="8" fill="#315139"/></svg><span><strong>'+title+'</strong><small>'+freedomLine+
    '</small><i><b style="width:'+ratio+'%"></b></i><strong>'+g.g.name+'</strong><small>'+moneyLine+
    '</small><i><b style="width:'+g.pct+'%"></b></i><small>查看详情</small></span><span aria-hidden="true">›</span>';
  $('goalDeadline').textContent='固定筹资目标';
  $('goal').textContent=freedomLine+' · '+g.g.name;
  $('dreamCard').style.display='block';
  $('dreamStage').textContent=j.win?'已通关':j.phase==='fast'?'快车道':'起步地图';
  $('dreamCapital').textContent=moneyLine;
  $('dreamDesc').textContent=g.g.desc+' 存够梦想专款且财富自由达标即可通关。';
  $('dreamBtn').textContent=j.win?'查看通关记录':'查看梦想进度';
}

const everydayOffers=monthlyOffers;
monthlyOffers=function(){
  if(journeyState().phase!=='fast')return everydayOffers();
  const old=state.monthlyOpportunities;
  // Entering phase two never grants a second purchase after a resolved monthly choice.
  if(old?.month===state.month&&(old.resolved||old.pool==='fast'))return old;
  state.offerSeed??=Math.floor(Math.random()*1000000);
  let seed=(state.offerSeed+state.month*7919+104729)>>>0;
  const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296};
  const pool=[...FAST_PROJECTS];for(let i=pool.length-1;i>0;i--){const k=Math.floor(rand()*(i+1));[pool[i],pool[k]]=[pool[k],pool[i]]}
  state.monthlyOpportunities={month:state.month,pool:'fast',ids:pool.slice(0,3).map(p=>p.id),resolved:null};save();return state.monthlyOpportunities;
};
const everydayOpportunityMarkup=opportunityMarkup;
opportunityMarkup=function(){
  const offers=monthlyOffers();if(offers.pool!=='fast')return everydayOpportunityMarkup();
  if(offers.resolved)return '<div class="wl-panel"><h3>本月已处理：'+offers.resolved+'</h3><p>每月最多选择一个机会。下个月会有新的三项机会。</p><button data-v26="opportunityContinue" class="primary">继续月度确认 →</button></div>';
  return '<div class="wl-panel"><h3>快车道 · 大型项目</h3><p>现金收购，收入已扣项目运营预算。自筹贷款的月供仍在个人必要支出中另计。每月三选一或不选。</p></div><div class="wl-mini-grid">'+offers.ids.map(id=>{
    const p=FAST_PROJECTS.find(p=>p.id===id);
    return '<button class="wl-choice-card" data-v26="opportunity" data-key="'+id+'" aria-label="确认快车道 '+p.name+'" '+(state.cash<p.cost?'disabled':'')+'><strong>'+p.name+'</strong><b>'+money(p.cost)+'</b><small>'+p.desc+'</small><small>'+(p.rent?'月租金 ':'月营业收入 ')+money(p.rent||p.revenue)+'<br>运营预算 '+money(p.operating)+'/月<br>成功后净收入 '+money(p.cf)+'/月<br>落地成功率 '+Math.round(p.chance*100)+'%'+(p.chance<1?'<br>失败残值 '+money(p.cost*p.salvage):'')+'</small><span>确认投资 →</span></button>';
  }).join('')+'</div><button data-v26="opportunitySkip" class="wl-secondary">本月不投资，保留现金 →</button>';
};
const everydayTakeOpportunity=takeOpportunity;
takeOpportunity=function(id){
  const offers=monthlyOffers();if(offers.pool!=='fast'){everydayTakeOpportunity(id);return}
  const p=FAST_PROJECTS.find(p=>p.id===id);if(!p||offers.resolved||!offers.ids.includes(id))return;
  if(!spendConfirmed('fastInvestment',p.cost,{project:id}))return;
  const success=Math.random()<p.chance;
  const value=success?p.cost:roundCash(p.cost*p.salvage),cf=success?p.cf:0;
  const a={id:assetId(),name:p.name,kind:success?p.kind:'business',cost:p.cost,value,cf,fastTrack:true,fastProject:id,acquiredMonth:state.month};
  if(a.kind==='rental')Object.assign(a,{purchasePrice:p.cost,mortgage:0,apr:.065,monthsLeft:0,payment:0,rent:p.rent,operating:p.operating});
  state.assets.push(a);offers.resolved=p.name;offers.success=success;syncFinance();save();render();
  const rows=[['投入',money(p.cost)],['资产当前价值',money(value)],['新增净收入',money(cf)+'/月']];
  if(success)showOpportunityCompletion(p,rows);
  else showEvent('快车道结果','项目整合未成功','现金已投入，资产按可出售残值入账；没有新增经营收入。',rows,[['继续',()=>completeMonthlyStep(8),true]]);
};
function openFastProjects(){
  if(journeyState().phase!=='fast'){openJourney();return}
  showEvent('快车道','本月大型机会','阶段切换沿用本月最多一个机会的限制。',[],[['返回',finish,false]]);
  $('eventData').innerHTML=opportunityMarkup();$('eventData').style.display='block';
}
const journeyCard=document.createElement('button');journeyCard.id='wlJourney';journeyCard.type='button';journeyCard.setAttribute('aria-label','查看人生阶段');$('wlHeader').appendChild(journeyCard);journeyCard.onclick=openJourney;
function renderJourney(){
  if(!state)return;
  if(DreamGoals.selected(state))return renderSavingsDream();
  const j=journeyState(),fast=j.phase==='fast',eligible=freedomEligible(),ratio=Math.max(0,Math.min(1,journeyPassiveIncome()/Math.max(1,state.expenses))),cf=fastCashFlow();
  journeyCard.innerHTML='<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="27" fill="none" stroke="'+(fast?'#d5aa30':'#becbc6')+'" stroke-width="6"/><circle cx="32" cy="32" r="15" fill="none" stroke="'+(fast?'#a4b7af':'#3a9b8c')+'" stroke-width="6"/><circle cx="32" cy="'+(fast?'5':'17')+'" r="5" fill="#253d43"/></svg><span><strong>'+(j.win?'已通关 · 继续人生':fast?'阶段2 · 财务自由':'阶段1 · 积累资产')+'</strong><small>'+(fast?'快车道新增 '+money(cf)+' / $50,000.00 每月':'被动收入 '+money(journeyPassiveIncome())+' / 支出 '+money(state.expenses)+'/月')+'</small><i><b style="width:'+Math.round((fast?Math.max(0,Math.min(1,cf/FAST_CASHFLOW_TARGET)):ratio)*100)+'%"></b></i><small>'+(j.win?'点击查看通关记录':fast?(eligible?'实现梦想或达到新增收入目标':'现金流出现缺口，优先恢复覆盖'):eligible?'已符合条件，点击进入第二阶段':'点击查看双阶段规则')+'</small></span><span aria-hidden="true">›</span>';
  if(state.dreamFulfilment?.goal===state.lifeGoal){$('lifeGoalBar').style.width='100%';$('lifeGoalProgress').textContent='梦想已实现；当前财务数值仍按实际资产显示。'}
}
const renderJourneyBase=render;render=function(){renderJourneyBase();if(state)renderJourney()};
const finishJourneyBase=finish;finish=function(){finishJourneyBase();if(state&&!document.querySelector('.event-active')&&cashFlowWinReady())winJourney('cashflow','快车道新增 $50,000.00/月')};
const oldDreamButton=$('dreamBtn').onclick;$('dreamBtn').onclick=()=>{if(DreamGoals.selected(state))return openSavingsDream();if(journeyState().phase==='fast')openDreamFulfilment();else oldDreamButton()};
renderJourney();

const unfinishedDreamStory=maybeDreamStory;maybeDreamStory=function(){if(state.dreamFulfilment?.goal===state.lifeGoal)return false;return unfinishedDreamStory()};
