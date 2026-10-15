// Two-stage single-player progression. Every financial value stays in the canonical state.
const FAST_CASHFLOW_TARGET = 50000;
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
function freedomEligible(){
  syncFinance();
  return !!state.housing&&state.housing!=='unselected'&&state.expenses>0&&state.passive>state.expenses;
}
function fastCashFlow(){
  return roundCash(state.assets.reduce((sum,a)=>sum+(a.fastTrack?Number(a.cf)||0:0),0));
}
function enterFastTrack(){
  const j=journeyState();
  if(j.phase!=='rat'||!freedomEligible())return;
  j.phase='fast';j.entryMonth=state.month;j.entryPassive=state.passive;j.entryExpenses=state.expenses;
  j.entryNetWorth=calcMetrics().nw;
  (state.timeline??=[]).push('第'+(state.month+1)+'个月：进入财务自由快车道');
  state.achievements=[...new Set([...(state.achievements||[]),'进入财务自由快车道'])];
  save();render();
  showEvent('阶段升级','欢迎进入第二阶段','现有现金、资产和负债原值保留。你可以继续工作、生活，并选择更大的投资项目。',[['进入时被动收入',money(j.entryPassive)+'/月'],['进入时必要支出',money(j.entryExpenses)+'/月'],['本次收支','$0']],[['查看快车道机会',openFastProjects,true],['继续本月安排',finish,false]]);
}
function openJourney(){
  const j=journeyState();
  if(j.win){showVictory();return}
  syncFinance();
  if(j.phase==='rat'){
    const eligible=freedomEligible();
    showEvent('人生阶段','第一阶段：积累资产','通过资产建立被动收入。被动收入必须严格大于必要月支出，且已确定住房，才能确认进入第二阶段。工资、借款到账和投资浮盈不计入被动收入。',[['被动收入',priceText(state.passive)+'/月'],['必要生活/保费/月供',priceText(state.expenses)+'/月'],['离严格超过还差',priceText(Math.max(0,roundCash(state.expenses-state.passive+.01)))+'/月'],['下一阶段','财务自由 · 快车道']],[['确认进入财务自由',enterFastTrack,true,!eligible],['返回继续积累',finish,false]]);
    return;
  }
  const gs=goalStats(),cf=fastCashFlow(),covered=freedomEligible();
  showEvent('人生阶段','第二阶段：财务自由','保留月度生活流程。满足任一路线即可通关：实现开局人生目标，或快车道项目当前新增净收入达到 $50,000/月；通关时被动收入仍需覆盖必要支出。',[['快车道新增净收入',money(cf)+' / $50,000 每月'],['开局人生目标',gs.g.name],['进入时被动收入',money(j.entryPassive)+'/月'],['当前收支安全',covered?'被动收入覆盖支出':'出现缺口，优先恢复现金流']],[['查看快车道机会',openFastProjects,true],['查看并实现人生梦想',openDreamFulfilment,false],['继续生活',finish,false]]);
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
  const explanation=q.assetCreated?'确认后现金投入目标项目，增加同额梦想用途资产；该资产暂不模拟经营收入。':q.cashCost?'确认后实际支付旅行或公益预算，该费用不增加个人资产。':'这是财务资产目标。满足原目标即可确认，不会将退休或投资本金作为费用扣掉。';
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
function cashFlowWinReady(){return journeyState().phase==='fast'&&!journeyState().win&&fastCashFlow()>=FAST_CASHFLOW_TARGET&&freedomEligible()}
function winJourney(reason,title){
  const j=journeyState();if(j.win)return;
  syncFinance();
  j.win={reason,title,month:state.month,age:state.age,fastCashFlow:fastCashFlow(),passive:state.passive,expenses:state.expenses,netWorth:calcMetrics().nw};
  (state.timeline??=[]).push('第'+(state.month+1)+'个月：通关 · '+title);
  state.achievements=[...new Set([...(state.achievements||[]),'财富人生通关：'+title])];
  save();render();showVictory();
}
function showVictory(){
  const win=journeyState().win;if(!win)return;
  showEvent('已通关','财富人生：目标达成',win.reason==='dream'?'你进入财务自由后，实现了开局选择的人生目标。存档保留，你可以继续生活。':'你的快车道项目当前新增净收入达到 $50,000/月，并仍能覆盖必要支出。存档保留，你可以继续生活。',[['通关路线',win.title],['通关年龄',win.age+'岁'],['当时被动收入',money(win.passive)+'/月'],['当时快车道新增',money(win.fastCashFlow)+'/月']],[['继续生活',finish,true],['保存并返回存档',()=>{save();home()},false]]);
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
  showEvent('快车道结果',success?'项目已加入资产':'项目整合未成功',success?'投资额从现金转入资产。净收入从本月月末起计入被动现金流。':'现金已投入，资产按可出售残值入账；没有新增经营收入。',[['投入',money(p.cost)],['资产当前价值',money(value)],['新增净收入',money(cf)+'/月']],[['继续',()=>completeMonthlyStep(8),true]]);
};
function openFastProjects(){
  if(journeyState().phase!=='fast'){openJourney();return}
  showEvent('快车道','本月大型机会','阶段切换沿用本月最多一个机会的限制。',[],[['返回',finish,false]]);
  $('eventData').innerHTML=opportunityMarkup();$('eventData').style.display='block';
}
const journeyCard=document.createElement('button');journeyCard.id='wlJourney';journeyCard.type='button';journeyCard.setAttribute('aria-label','查看人生阶段');$('wlHeader').appendChild(journeyCard);journeyCard.onclick=openJourney;
function renderJourney(){
  if(!state)return;
  const j=journeyState(),fast=j.phase==='fast',eligible=freedomEligible(),ratio=Math.max(0,Math.min(1,state.passive/Math.max(1,state.expenses))),cf=fastCashFlow();
  journeyCard.innerHTML='<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="27" fill="none" stroke="'+(fast?'#d5aa30':'#becbc6')+'" stroke-width="6"/><circle cx="32" cy="32" r="15" fill="none" stroke="'+(fast?'#a4b7af':'#3a9b8c')+'" stroke-width="6"/><circle cx="32" cy="'+(fast?'5':'17')+'" r="5" fill="#253d43"/></svg><span><strong>'+(j.win?'已通关 · 继续人生':fast?'阶段2 · 财务自由':'阶段1 · 积累资产')+'</strong><small>'+(fast?'快车道新增 '+money(cf)+' / $50,000 每月':'被动收入 '+money(state.passive)+' / 支出 '+money(state.expenses)+'/月')+'</small><i><b style="width:'+Math.round((fast?Math.max(0,Math.min(1,cf/FAST_CASHFLOW_TARGET)):ratio)*100)+'%"></b></i><small>'+(j.win?'点击查看通关记录':fast?(eligible?'实现梦想或达到新增收入目标':'现金流出现缺口，优先恢复覆盖'):eligible?'已符合条件，点击进入第二阶段':'点击查看双阶段规则')+'</small></span><span aria-hidden="true">›</span>';
  if(state.dreamFulfilment?.goal===state.lifeGoal){$('lifeGoalBar').style.width='100%';$('lifeGoalProgress').textContent='梦想已实现；当前财务数值仍按实际资产显示。'}
}
const renderJourneyBase=render;render=function(){renderJourneyBase();if(state)renderJourney()};
const finishJourneyBase=finish;finish=function(){finishJourneyBase();if(state&&!document.querySelector('.event-active')&&cashFlowWinReady())winJourney('cashflow','快车道新增 $50,000/月')};
const oldDreamButton=$('dreamBtn').onclick;$('dreamBtn').onclick=()=>{if(journeyState().phase==='fast')openDreamFulfilment();else oldDreamButton()};
renderJourney();

const unfinishedDreamStory=maybeDreamStory;maybeDreamStory=function(){if(state.dreamFulfilment?.goal===state.lifeGoal)return false;return unfinishedDreamStory()};
