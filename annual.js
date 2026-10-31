// V27.8: recovery window and annual decisions with the existing monthly ledger.
let annualBusy=false,annualTimer=null,annualPlanning=false;
const RECOVERY_LIMITS={happiness:50,health:20,energy:15,social:10};
function recoveryIssues(){return Object.entries(RECOVERY_LIMITS).filter(([k,v])=>state[k]<v||(k!=='happiness'&&state[k]===v)).map(([k])=>k)}
function updateRecovery(){if(!state||state.gameOver?.final)return;if(state.gameOver){state.crisis??={started:state.month,deadline:state.month+3,actions:{}};delete state.gameOver}const issues=recoveryIssues();if(!issues.length){if(state.crisis){state.recoveryHistory??=[];state.recoveryHistory.push({started:state.crisis.started,resolved:state.month});state.crisis=null;save()}return}if(!state.crisis){state.crisis={started:state.month,deadline:state.month+3,actions:{}};save()}if(state.month>=state.crisis.deadline){state.gameOver={final:true,reason:'三个月调整期结束，生活状态仍未恢复',month:state.month};if(state.annualRun)state.annualRun.paused=true;save()}}
gameOverReason=function(){return null};
const oldFinalNotice=showGameOver;showGameOver=function(){if(!state.gameOver?.final){updateRecovery();showRecovery();return}oldFinalNotice()};
function applyRecovery(kind){const c=state.crisis;if(!c||c.actions[state.month])return;const cost=kind==='care'?200:0;if(!spendConfirmed('recovery',cost,{choice:kind}))return;const effects=kind==='care'?{health:25,energy:8,happiness:5}:kind==='friend'?{social:22,happiness:10,energy:-2}:{energy:25,health:8,happiness:10,stress:-15};for(const[k,v]of Object.entries(effects))state[k]=Math.max(0,Math.min(100,state[k]+v));c.actions[state.month]=kind;c.ackMonth=state.month;save();updateRecovery();showRecovery()}
function showRecovery(){updateRecovery();if(state.gameOver?.final)return showGameOver();const c=state.crisis;if(!c){showEvent('危机补救','已恢复生活状态','这次调整已生效，可以继续人生。',[],[['继续',()=>{clearModals();finish()},true]]);return}showEvent('危机补救','先照顾好自己','不会因一次低落直接结束。本次调整期还有 '+Math.max(0,c.deadline-state.month)+' 个月；每月可选一次补救。',Object.entries(RECOVERY_LIMITS).map(([k])=>[V26_STATS[k],Math.round(state[k])+'/100']),[
 ['休息并减少负担 · $0',()=>applyRecovery('rest'),true,!!c.actions[state.month]],['联系朋友寻求支持 · $0',()=>applyRecovery('friend'),false,!!c.actions[state.month]],['治疗与健康管理 · $200',()=>applyRecovery('care'),false,!!c.actions[state.month]||state.cash<200],['继续，留出时间调整',()=>{c.ackMonth=state.month;save();clearModals();finish()},false]]);$('eventClose').hidden=true}
function cutLivingBudget(){if(state.costCutMonth===state.month)return;state.baseLiving=roundCash(state.baseLiving*.9);state.costCutMonth=state.month;state._computedExpenses=null;state.happiness=Math.max(0,state.happiness-2);save();if(state.crisis)showRecovery();else showLiquidity()}
function annualActive(){return !!state?.annualMode&&!!state.annualRun&&!state.annualRun.complete}
function pauseAnnual(){clearTimeout(annualTimer);if(state?.annualRun){state.annualRun.paused=true;save()}}
function scheduleAnnual(){clearTimeout(annualTimer);if(annualActive()&&!state.annualRun.paused&&!document.querySelector('.event-active')){const expectedState=state,expectedRun=state.annualRun;annualTimer=setTimeout(()=>{if(state===expectedState&&state.annualRun===expectedRun)runAnnualMonth()},60)}}
function annualCost(){syncFinance();const r=paymentReceipt(),p=state.annualPlan||{},life=V26_LIFE[p.life==='simple'?8:state.energy<60?1:0],hobby=p.hobby?HOBBY_COSTS[p.hobby]||0:0;return {housing:roundCash(Math.max(0,state.housingCost-(r.housing||0))),living:roundCash(Math.max(0,livingTotal()-(r.living||0))),premiums:roundCash(Math.max(0,premiumsTotal()-(r.premiums||0))),loans:roundCash(currentLoanCycle().items.filter(x=>x.status!=='paid').reduce((n,x)=>n+x.due,0)),life,lifeCost:monthSelection('life')?0:life.cost,hobbyCost:monthSelection('hobby')?0:hobby}}
function annualRequiredCash(){const q=annualCost();return roundCash(q.housing+q.living+q.premiums+q.loans+q.lifeCost+q.hobbyCost)}
const HOBBY_COSTS={'摄影':90,'电影创作':120,'烹饪':65,'音乐':80,'园艺':55,'语言学习':45};
function showAnnualPlan(){if(state.requiredIncident)return openRequiredIncident();annualPlanning=true;clearModals();state.annualMode=true;const run=state.annualRun;if(run&&!run.complete){showAnnualProgress();return}const m=calcMetrics(),months=12-state.month%12;showEvent('年度安排','安排第 '+(Math.floor(state.month/12)+1)+' 年','已有住房、工作、保单、学习计划和定投继续沿用。后台按月结算，关键事件和现金不足时暂停。当前年度剩余 '+months+' 个月。',[],[['确认年度安排并推进',startAnnual,true,!state.housing||state.housing==='unselected'],['调整住房、工作与学习',showAnnualSetup,false],['改用按月试玩',useMonthly,false],['返回',()=>{annualPlanning=false;finish()},false]]);const form=document.createElement('div');form.innerHTML='<p><b>'+batchEscape(state.job||'未就业')+'</b> · 现金 '+priceText(state.cash)+'<br>持续月收支结余 '+priceText(m.monthlyCF)+'</p><label>今年生活重点<select id="yearLife"><option value="balanced">平衡：运动/休息 · $25–45/月</option><option value="simple">省钱：$0/月，幸福度下降</option></select></label><label>兴趣练习<select id="yearHobby"><option value="">暂不固定安排</option>'+Object.entries(HOBBY_COSTS).map(([n,c])=>'<option value="'+n+'">'+n+' · $'+c+'/月 · 8h/月</option>').join('')+'</select></label><p>确认后授权逐月支付尚未付的房租、基本生活、持续保费、月供及以上生活/兴趣费用；每笔仍进入月度账本。已有定投在月末按原设置执行，现金不足跳过。</p>';$('eventData').append(form);$('eventData').style.display='block';$('yearLife').value=state.annualPlan?.life||'balanced';$('yearHobby').value=state.annualPlan?.hobby||''}
function startAnnual(){if(annualActive())return;if(!state.housing||state.housing==='unselected')return;state.annualPlan={life:$('yearLife').value,hobby:$('yearHobby').value};state.annualRun={start:state.month,target:state.month+12-state.month%12,startCash:state.cash,startNW:calcMetrics().nw,records:[],paused:false,complete:false,quarterSeen:[],preparedMonth:null};annualPlanning=false;save();clearModals();render();scheduleAnnual()}
function showAnnualProgress(){annualPlanning=false;const r=state.annualRun;if(!r)return showAnnualPlan();showEvent('本年进度','第 '+(Math.floor(r.start/12)+1)+' 年 · 已推进 '+(state.month-r.start)+' 个月','每个月只结算一次。你可以继续剩余时间，或暂停后调整资产和安排。',[['现金',priceText(state.cash)],['距年末',Math.max(0,r.target-state.month)+'个月'],['今年现金变化',priceText(state.cash-r.startCash)]],[['继续本年',()=>{r.paused=false;save();clearModals();if(state.requiredIncident)return openRequiredIncident();if(state.crisis&&state.crisis.ackMonth!==state.month)return showRecovery();scheduleAnnual()},true],['查看补救',showRecovery,false,!state.crisis],['暂停，管理财务',()=>{pauseAnnual();clearModals();render();$('qAssets').click()},false],['改用按月试玩',useMonthly,false],['返回',()=>{pauseAnnual();finish()},false]])}
function useMonthly(){annualPlanning=false;pauseAnnual();state.annualMode=false;save();clearModals();render();startV24Turn(false)}
function showLiquidity(){const needed=annualRequiredCash();if(!annualActive())return;state.annualRun.paused=true;save();showEvent('资金补救','先解决资金缺口','时间停在当前月份，尚未支付的费用不会先扣。可以动用应急金、出售可变现资产、降低生活预算或查看贷款。',[['本月待付',priceText(needed)],['可用现金',priceText(state.cash)],['资金缺口',priceText(Math.max(0,needed-state.cash))]],[['使用应急金补足缺口',()=>{const amount=Math.min(state.emergencyFund||0,Math.max(0,needed-state.cash));state.emergencyFund-=amount;state.cash=roundCash(state.cash+amount);(state.financeLedger??=[]).push({kind:'emergencyWithdrawal',month:state.month,amount});save();showLiquidity()},true,!(state.emergencyFund>0)||state.cash>=needed],['出售资产筹款',showLiquidAssets,false],['降低基础生活预算10%',cutLivingBudget,false,state.costCutMonth===state.month],['查看贷款',()=>openBankLoan(Math.max(1,Math.ceil(needed-state.cash)),{after:showLiquidity}),false],['继续本年',()=>{if(state.cash<annualRequiredCash())return;state.annualRun.paused=false;save();clearModals();scheduleAnnual()},true,state.cash<needed],['暂停，保留当前进度',()=>{pauseAnnual();clearModals();render()},false]]);$('eventClose').hidden=true}
function showLiquidAssets(){showEvent('资产变现','选择可出售资产','CD到期前不能用于生活费；其他资产按确认时的市值变现。',[],state.assets.map((a,i)=>['出售 '+a.name,()=>{annualPlanning=false;sellAsset(i)},false,a.kind==='cd']).concat([['返回资金补救',showLiquidity,true]]))}
function prepareAnnualMonth(){const r=state.annualRun;if(r.preparedMonth===state.month)return true;const q=annualCost();if(state.cash<annualRequiredCash()){showLiquidity();return false}payMonthly('housing',q.housing);payMonthly('living',q.living);payMonthly('premiums',q.premiums);for(const row of currentLoanCycle().items){if(row.status==='paid')continue;const t=loanTargets().find(x=>x.key===row.key);if(!t)continue;if(!spendConfirmed('loanInstallment',row.due,{loan:row.name,principal:row.principal,interest:row.interest}))throw Error('Annual loan budget changed');t.set(Math.max(0,roundCash(t.balance-row.principal)));t.l.monthsLeft=Math.max(0,t.l.monthsLeft-1);row.status='paid'}if(!monthSelection('life')){if(!spendConfirmed('lifestyle',q.lifeCost,{choice:q.life.name}))throw Error('Annual lifestyle budget changed');for(const[k,v]of Object.entries(q.life.effects))state[k]=Math.max(0,Math.min(100,state[k]+v));state.lifetimeFunSpend=(state.lifetimeFunSpend||0)+q.lifeCost;setMonthSelection('life',q.life.name)}if(q.hobbyCost){const name=state.annualPlan.hobby;spendConfirmed('hobbyPractice',q.hobbyCost,{hobby:name});state.hobbyXP??={};state.hobbyXP[name]=(state.hobbyXP[name]||0)+35;state.hobbies[name]=hobbyLevel(name);state.happiness=Math.min(100,state.happiness+4);state.energy=Math.min(100,state.energy+2);state.stress=Math.max(0,state.stress-4);setMonthSelection('hobby',name)}r.preparedMonth=state.month;state.turn={month:state.month,index:9,startCash:state.turn?.month===state.month?state.turn.startCash:state.cash};save();return true}
function runAnnualMonth(){if(annualBusy||!annualActive()||state.annualRun.paused||document.querySelector('.event-active'))return;annualBusy=true;try{rebuildAnnualRecords();updateRecovery();if(state.gameOver?.final){showGameOver();return}if(state.requiredIncident){openRequiredIncident();return}if(state.crisis&&state.crisis.ackMonth!==state.month){showRecovery();return}const r=state.annualRun;if(state.month>=r.target){completeAnnual();return}const elapsed=state.month-r.start;if(elapsed>0&&elapsed%3===0&&!r.quarterSeen.includes(state.month)){r.quarterSeen.push(state.month);state.lifeRound={month:state.month,title:'这一季的机会',cashBefore:state.cash,pending:true};save();showEvent('季度机会','看看这一季的机会','最多选择一个，也可以保留现金。',[],[['这季不选择，继续',()=>{const o=monthlyOffers();if(!o.resolved)o.resolved='未选择';save();finish()},true]]);$('eventData').innerHTML=opportunityMarkup();$('eventData').style.display='block';return}if(!prepareAnnualMonth())return;clearModals();settleMonth()}catch(e){pauseAnnual();console.error('Annual step paused',e);showEvent('年度暂停','这一步未继续','已暂停自动推进，请保留存档并检查当前账目。',[],[['返回',finish,true]])}finally{annualBusy=false}}
function completeAnnual(){const r=state.annualRun;r.complete=true;r.paused=true;state.yearReports??=[];let report=state.yearReports.find(x=>x.start===r.start);if(!report){report={start:r.start,end:state.month,cashChange:roundCash(state.cash-r.startCash),nwChange:roundCash(calcMetrics().nw-r.startNW),salary:roundCash(r.records.reduce((n,s)=>n+s.grossSalary,0)),tax:roundCash(r.records.reduce((n,s)=>n+s.tax,0)),interest:roundCash(r.records.reduce((n,s)=>n+(s.bondInterest||0),0)),months:r.records.length};state.yearReports.push(report)}save();showEvent('年度结算','这一年走过了什么','年度结果来自逐月真实账本；资产涨跌与现金变化分别计算。',[['推进月份',report.months+'个月'],['全年工资',priceText(report.salary)],['工资税',priceText(report.tax)],['现金变化',priceText(report.cashChange)],['净资产变化',priceText(report.nwChange)],['当前年龄',state.age+'岁']],[['安排下一年',()=>{clearModals();showAnnualPlan()},true],['返回总览',()=>{annualPlanning=false;finish();$('qOverview').click()},false]])}
const auditBefore278=showMonthlyAudit;showMonthlyAudit=function(s){if(!annualActive()){updateRecovery();if(state.crisis)return showRecovery();return auditBefore278(s);}const r=state.annualRun;if(!r.records.some(x=>x.month===s.month))r.records.push(structuredClone(s));r.preparedMonth=null;save();updateRecovery();if(state.gameOver?.final)return showGameOver();if(state.crisis&&state.crisis.ackMonth!==state.month)return showRecovery();clearModals();monthlyEvent()};
const finishBefore278=finish;finish=function(){finishBefore278();if(!state||document.querySelector('.event-active'))return;if(annualPlanning){showAnnualPlan();return}scheduleAnnual()};
const renderBefore278=render;render=function(){if(!state)return;state.annualMode??=true;renderBefore278();updateRecovery();document.body.classList.toggle('annual-mode',state.annualMode);let box=$('annualDashboard');if(!box){box=document.createElement('div');box.id='annualDashboard';box.className='card';$('v24Turn').before(box)}box.innerHTML='<h2>这一年，你想怎样生活？</h2><p>工作与日常安排默认延续，把决定留给真正重要的事情。</p><p>当前现金 '+priceText(state.cash)+' · 月收支结余 '+priceText(calcMetrics().monthlyCF)+'</p><button class="primary" data-year="plan">'+(annualActive()?'继续本年':'安排这一年')+'</button>'+(state.crisis?'<button data-year="recovery">生活状态需要调整</button>':'')+'<button data-year="monthly">按月查看与安排</button>';if(state.gameOver?.final)showGameOver()};
const headerBefore278=refreshCardHeader;refreshCardHeader=function(){headerBefore278();if(!state)return;if(state.annualMode){$('wlDate').textContent='第'+(Math.floor(state.month/12)+1)+'年 · 第'+(Math.floor(state.month%12/3)+1)+'季';$('qNext').innerHTML='<span>→</span><small>本年</small>'}else $('qNext').innerHTML='<span>→</span><small>本月</small>'};
const eventBefore278=showEvent;showEvent=function(type,title,desc,data=[],actions=[]){if(type==='START'){type='年度起点';state.annualMode=true;actions=[['安排这一年',showAnnualPlan,true],['先按月试玩',useMonthly,false]];desc='初始现金 $10,000。先选择住房，再确定今年的生活重点；工资按月末账本结算，不提前发放。'}eventBefore278(type,title,desc,data,actions);if(state?.annualMode)$('eventMonth').textContent=type==='年度结算'?'第'+(Math.floor(state.annualRun.start/12)+1)+'年 · 年度总结':'第'+(Math.floor(state.month/12)+1)+'年 · 第'+(Math.floor(state.month%12/3)+1)+'季'};
const openBefore278=openGame;openGame=function(){if(state.gameOver&&!state.gameOver.final){state.crisis={started:state.month,deadline:state.month+3,actions:{}};delete state.gameOver}openBefore278();updateRecovery();if(state.requiredIncident)return openRequiredIncident();if(state.crisis)return showRecovery()};
$('qNext').onclick=$('hubNext').onclick=()=>{if(state.annualMode)showAnnualPlan();else startV24Turn(false)};
for(const id of ['qOverview','qCareer','qLife','qAssets']){const old=$(id).onclick;$(id).onclick=()=>{pauseAnnual();annualPlanning=false;old?.()}};
const menuYear=document.createElement('button');menuYear.textContent='切换到年度回合';menuYear.onclick=()=>{state.annualMode=true;$('wlCloseMenu').click();showAnnualPlan()};document.querySelector('.wl-menu-items').append(menuYear);
document.addEventListener('click',e=>{const b=e.target.closest('[data-year]');if(!b)return;if(b.dataset.year==='plan')showAnnualPlan();if(b.dataset.year==='monthly')useMonthly();if(b.dataset.year==='recovery')showRecovery()});
// A lower instalment trades a longer term for more interest; no cash is created.
function openRestructure(){showEvent('贷款调整','选择需要重组的贷款','可延长剩余期限来降低月供。新的APR及总付款会在确认前列出；不减免余额，也不产生现金。',[],loanTargets().map(t=>['查看 '+t.name,()=>previewRestructure(t.key),false,t.l.restructuredMonth===state.month]).concat([['返回',()=>annualActive()?showLiquidity():finish(),true]]))}
function previewRestructure(key){const t=loanTargets().find(t=>t.key===key);if(!t)return;const months=Math.min(120,Math.max(24,t.l.monthsLeft+12)),apr=Math.max(t.l.apr,currentBankAPR()+.01),payment=paymentFor(t.balance,apr,months);showEvent('重组预览',t.name,'延长还款期通常会增加总利息。本游戏此方案无额外手续费，新利率从确认本期合同起使用。',[['余额',priceText(t.balance)],['原月供',priceText(t.l.payment)],['新期限',months+'个月'],['新APR',(apr*100).toFixed(2)+'%'],['新月供',priceText(payment)],['新合同预计总利息',priceText(payment*months-t.balance)]],[['确认重组',()=>{if(t.l.restructuredMonth===state.month)return;t.l.apr=apr;t.l.monthsLeft=months;t.l.payment=payment;t.l.restructuredMonth=state.month;if(state.loanCycle?.month===state.month)state.loanCycle.items=state.loanCycle.items.filter(x=>x.key!==key||x.status==='paid');save();if(annualActive())showLiquidity();else openLoanPayments()},true,payment>=t.l.payment||t.l.restructuredMonth===state.month],['取消',openRestructure,false]])}
function showFundingOptions(needed,after){showEvent('资金补救','筹措当前费用','可以使用应急金、出售资产或查看贷款；确认前不会替你扣款。',[['费用',priceText(needed)],['缺口',priceText(Math.max(0,needed-state.cash))]],[['从应急金补足',()=>{const amount=Math.min(state.emergencyFund||0,Math.max(0,needed-state.cash));state.emergencyFund-=amount;state.cash=roundCash(state.cash+amount);(state.financeLedger??=[]).push({kind:'emergencyWithdrawal',month:state.month,amount});save();showFundingOptions(needed,after)},true,state.emergencyFund<=0||state.cash>=needed],['出售资产',()=>{showEvent('资产变现','选择可出售资产','CD未到期不能变现。',[],state.assets.map((a,i)=>['出售 '+a.name,()=>sellAsset(i),false,a.kind==='cd']).concat([['返回筹款',()=>showFundingOptions(needed,after),true]]))},false],['查看贷款',()=>openBankLoan(Math.max(1,Math.ceil(needed-state.cash)),{after:()=>showFundingOptions(needed,after)}),false],['返回付款',()=>{clearModals();after?.()},true,state.cash<needed],['返回',finish,false]])}
fundShortfall=function(amount,after){showFundingOptions(amount,after)};
const paymentsBefore278=openLoanPayments;openLoanPayments=function(){paymentsBefore278();if(loanTargets().length){const b=document.createElement('button');b.textContent='查看延长期限方案';b.onclick=openRestructure;$('actions').append(b)}};
const liquidityBefore278=showLiquidity;showLiquidity=function(){liquidityBefore278();if(annualActive()&&loanTargets().length){const b=document.createElement('button');b.textContent='查看贷款重组';b.onclick=openRestructure;$('actions').append(b)}};
openIncidentFunding=function(title,cost){state.requiredIncident??={id:'incident-'+state.month+'-'+title,title,cost,status:'unpaid'};showFundingOptions(cost,openRequiredIncident);$('eventClose').hidden=true};
// In monthly mode too, a projected deficit pauses before the settlement mutates state.
const settlementBefore278=settleMonth;settleMonth=function(){if(!state||state.gameOver?.final)return;const m=calcMetrics();if(state.turn?.index===9&&!document.querySelector('.event-active')&&state.cash+m.remainingCF<-.005){const needed=roundCash(-m.remainingCF);if(annualActive())state.annualRun.paused=true;save();showFundingOptions(needed,()=>{clearModals();if(annualActive()){state.annualRun.paused=false;save();scheduleAnnual()}else{render();startV24Turn(false)}});return}settlementBefore278()};
const homeBefore278=home;home=function(){pauseAnnual();annualPlanning=false;homeBefore278()};
const menuBefore278=$('wlMenu').onclick;$('wlMenu').onclick=()=>{pauseAnnual();annualPlanning=false;menuBefore278()};
function rebuildAnnualRecords(){const r=state?.annualRun;if(!r)return;r.records=(state.history||[]).filter(x=>x.month>r.start&&x.month<=Math.min(state.month,r.target)).map(x=>structuredClone(x));if(r.preparedMonth!=null&&r.preparedMonth<state.month)r.preparedMonth=null}
const loadAnnualBefore278=openGame;openGame=function(){if(state.annualRun){state.annualRun.paused=true;rebuildAnnualRecords()}loadAnnualBefore278()};
function showAnnualSetup(){showEvent('年度设置','调整今年的安排','可查看当前合同与计划，确认后才修改。',[],[['选择或更换住房',openHousing,true],['选择或调整工作',openWorkAdjustment,false],['学习计划',openEducation,false],['资产、保险与贷款',()=>{annualPlanning=false;pauseAnnual();finish();$('qAssets').click()},false],['返回年度安排',showAnnualPlan,false]])}

// Event pacing: stop after a meaningful decision; quiet accounting months remain automatic.
let dispatchingLifeEvent=false;
const eventPacingShow=showEvent;
showEvent=function(type,title,desc,data=[],actions=[]){
 if(dispatchingLifeEvent&&annualActive()){
  state.lifeRound={month:state.month,title,cashBefore:state.cash,pending:true};save();
 }
 eventPacingShow(type,title,desc,data,actions);
};
const eventPacingMonthly=monthlyEvent;
monthlyEvent=function(){dispatchingLifeEvent=true;try{return eventPacingMonthly()}finally{dispatchingLifeEvent=false}};
const eventPacingFinish=finish;
finish=function(){
 if(annualActive()&&state.lifeRound?.pending&&!state.requiredIncident){
  state.lifeRound.pending=false;state.lifeRound.cashAfter=state.cash;
  state.lifeRound.completed=true;pauseAnnual();save();
 }
 eventPacingFinish();
};
function continueLife(){
 if(!state.annualMode)return startV24Turn(false);
 if(state.requiredIncident)return openRequiredIncident();
 if(state.gameOver?.final)return showGameOver();
 if(!annualActive())return showAnnualPlan();
 if(state.crisis&&state.crisis.ackMonth!==state.month)return showRecovery();
 annualPlanning=false;clearModals();state.annualRun.paused=false;save();render();scheduleAnnual();
}
const eventPacingRender=render;
render=function(){eventPacingRender();if(!state?.annualMode)return;const box=$('annualDashboard');
 const h=box?.querySelector('h2');if(h)h.textContent=state.lifeRound?.completed?'刚刚经历：'+state.lifeRound.title:'人生继续，选择留给重要时刻';
 const b=box?.querySelector('[data-year="plan"]');if(b){b.textContent=annualActive()?'继续人生':'安排生活并开始';b.removeAttribute('data-year');b.onclick=continueLife}
};
const eventPacingHeader=refreshCardHeader;
refreshCardHeader=function(){eventPacingHeader();if(state?.annualMode){$('qNext').innerHTML='<span>→</span><small>继续人生</small>';$('wlResume').textContent='继续人生 →'}else $('wlResume').textContent='继续本月安排 →'};
$('qNext').onclick=$('hubNext').onclick=continueLife;

$('wlResume').onclick=()=>{$('wlCloseMenu').click();continueLife()};

// V27.10: return to manual monthly decisions. Keep all existing transactions.
function restoreMonthlyPlay(){
 if(!state)return;
 const migrating=state.annualMode===true;
 state.annualMode=false;annualPlanning=false;clearTimeout(annualTimer);
 if(state.annualRun)state.annualRun.paused=true;
 if(migrating){
  state.turn={month:state.month,index:0,startCash:state.turn?.month===state.month?state.turn.startCash:state.cash};
  state.monthlyModeRestored=state.month;
 }
}
annualActive=function(){return false};
scheduleAnnual=function(){clearTimeout(annualTimer)};
const monthlyRender=render;
render=function(){restoreMonthlyPlay();monthlyRender();document.body.classList.remove('annual-mode')};
const monthlyOpen=openGame;
openGame=function(){restoreMonthlyPlay();monthlyOpen();save()};
const monthlyShow=showEvent;
showEvent=function(type,title,desc,data=[],actions=[]){
 if(type==='START'){
  restoreMonthlyPlay();type='月度起点';
  desc=state.job?'初始现金 $10,000，已入职咖啡师。先选择住房，再安排本月生活；工资月末到账。':'初始现金 $10,000。先选择住房，再安排本月生活和工作。每次只结算一个月，所有消费确认后才付款。';
  actions=[['开始本月安排',()=>{clearModals();startV24Turn(false)},true]];
 }
 monthlyShow(type,title,desc,data,actions);
};
continueLife=function(){restoreMonthlyPlay();if(state.requiredIncident)return openRequiredIncident();if(state.gameOver?.final)return showGameOver();if(state.crisis&&state.crisis.ackMonth!==state.month)return showRecovery();startV24Turn(false)};
showAnnualPlan=useMonthly;showAnnualProgress=useMonthly;
menuYear.remove();
$('qNext').onclick=$('hubNext').onclick=continueLife;
$('wlResume').onclick=()=>{$('wlCloseMenu').click();continueLife()};

