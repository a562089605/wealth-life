// Incremental browser adapters; canonical player state, original ledgers and month lock remain owners.
const CAFE_MISSING={dailyPool:'店长日常卡完整适配表缺失',declineAB:'经营下滑A/B原文、最终主效果与耗时缺失',excellent:'优秀卡最终奖励/按钮与身份差异缺失',partnerPool:'在店合伙人完整卡池/权重缺失',research:'新品成本及多种营收效果叠加顺序缺失',promotion:'主管升店长技能门槛最终表缺失',trade:'合伙邀请最终资格、离店替代管理方案及旧季度权益字段迁移缺失'};
function cafeOwnsWorkState(s){return !!CafeRules.role(s)}
function cafeReturn(){return townPending()?showTown():townHome()}
function cafeRole(){return CafeRules.role(state||{})}
function cafePending(){return Object.values(state?.cafe?.groups||{}).find(g=>g.month===state.month&&g.status!=='resolved')}
function cafeSeason(){return coffeeSeason(coffeeCalendar().month)}
function cafeStoreQuote(){const st=CafeRules.ensureStore(state),stopped=cafeRole()&&(isRecoveryMonth(state)||state.retired||state.unemployedMonths),income=stopped?null:CafeRules.payroll(state,cafeSeason().tips),labor=stopped?0:income?income.baseWages+income.fixedBonus:undefined,extra=income?income.extraWages:0;
 return CafeRules.operatingQuote(st,{season:cafeSeason().key,month:state.month,...labor!=null?{normalPay:labor}: {},extraPay:extra});}
function cafeViewStatus(){const c=CafeRules.data(state),st=CafeRules.ensureStore(state),holding=c.holdings;
 showEvent('咖啡店','我的门店',st.status==='ready'?'经营、必要成本、储备与分红由后台按月处理。个人与门店资金分开。':'旧存档门店历史尚待核对；不重置门店资产，不补造过去利润或分红。',[
 ['身份',cafeRole()==='partner'?'在店管理合伙人':cafeRole()==='manager'?(holding.effectivePct>0?'店长兼股东':'受雇店长'):holding.effectivePct>0?'不在店股东':'未持股'],['有效持股',Number.isFinite(holding.effectivePct)?(holding.effectivePct*100)+'%':'持股历史待核对'],['最近实际到账分红',priceText(c.lastPaidDividend?.amount||0)],['交易入口','资格与替代管理安排待核对，暂不能确认交易']],
 [['本月工作安排',openWorkAdjustment,true,!cafeRole()],['职业事件资料与缺口',openCafeCardCatalog,false],['股权与退出管理',openCafeOwnership,false],['返回房屋',cafeReturn,false]]);}
function openCafeOwnership(){const h=CafeRules.data(state).holdings;showEvent('咖啡店','股权与管理身份','股权与劳动岗位分开。现有持股和已归属未付权益保留；资格及替代管理安排尚未封板，不自动买卖、改身份或离店。',[
 ['当前有效持股',Number.isFinite(h.effectivePct)?(h.effectivePct*100)+'%':'持股历史待核对'],['待交割交易',h.pending?'已有锁定交易':'无'],['基准估值',priceText(200000)],['待核对',CAFE_MISSING.trade]], [['返回门店',cafeViewStatus,true]]);}
function openCafeCardCatalog(){showEvent('咖啡店','职业卡接入范围','店长日常30%与专属70%只在两个池都有合格卡时使用。日常表尚缺，现只从已具备可执行选项的专属卡抽取。合伙人不套用店长卡池。',[
 ...Object.keys(CafeRules.CARDS).map(id=>[CafeRules.CARDS[id].name,CafeRules.eligible(state,id,currentCareerTime().free)?'已有明确可执行选项':CafeRules.CARDS[id].blocked||'资格、资源、冷却或参数尚不满足']),
 ['其他缺口',Object.values(CAFE_MISSING).join('；')]], [['返回门店',cafeViewStatus,true]]);}
function cafeOpenWork(){if(isRecoveryMonth(state))return openHealthTreatment();const c=CafeRules.data(state),old=c.work[state.month];let hours,weights,quoted,cycle=state.month,owner=state;
 function update(){quoted=CafeRules.workQuote(state,{absentHours:Number(hours.value),missedTipWeight:Number(weights.value)},cafeSeason().tips);$('cafeWorkQuote').textContent=quoted.blocked||'本月正常工资 '+priceText(quoted.baseWages)+' · 小费 '+priceText(quoted.baseTips)+' · 固定奖金 '+priceText(quoted.fixedBonus)+' · 能量 '+quoted.energy+' · 压力 +'+quoted.stress+'。修改安排只处理与已确认安排的差额。';$('actions').firstElementChild.disabled=!!quoted.blocked;}
 showEvent('咖啡店工作',cafeRole()==='partner'?'在店管理合伙人 · 工作安排':'店长 · 工作安排','正常工作已包含在80h基础自由时间中；本页不发工资或经验。确认后执行正常工作状态消耗，工资及经验月底结算。',[],[
 ['确认本月工作安排',()=>{if(state!==owner||state.month!==cycle||$('cafeAbsentHours')!==hours)return;const fresh=CafeRules.workQuote(state,{absentHours:Number(hours.value),missedTipWeight:Number(weights.value)},cafeSeason().tips);if(JSON.stringify(fresh)!==JSON.stringify(quoted)){update();return;}if(CafeRules.confirmWork(state,fresh)){save();render();showEvent('咖啡店工作','本月工作安排已确认','工资、小费、固定奖金和正常经验尚未发放；重复查看不再扣正常工作状态。', [['正常工资',priceText(fresh.baseWages)],['小费',priceText(fresh.baseTips)],['固定奖金',priceText(fresh.fixedBonus)]],[['返回房屋',cafeReturn,true],['查看门店',cafeViewStatus,false]])}},true],['查看门店',cafeViewStatus,false],['返回房屋',cafeReturn,false]]);
 const form=document.createElement('div');form.className='wl-loan-form';form.innerHTML='<label for="cafeAbsentHours">本月无薪缺席小时</label><input id="cafeAbsentHours" type="number" min="0" max="195" step="0.5"><label for="cafeMissedTips">缺席小费份额（普通8h班计1、周末8h班计1.5）</label><input id="cafeMissedTips" type="number" min="0" max="23" step="0.5"><p id="cafeWorkQuote"></p>';
 $('eventData').append(form);$('eventData').style.display='block';hours=$('cafeAbsentHours');weights=$('cafeMissedTips');hours.value=old?.absentHours||0;weights.value=old?.missedTipWeight||0;hours.oninput=weights.oninput=update;update();}
function cafeEffectRows(e){const labels={energy:'能量',stress:'压力',happiness:'幸福',coffee:'Coffee XP',service:'Service XP',management:'Management XP',trust:'上级认可',hours:'额外工作小时',wages:'月底额外工资',bonus:'月底专项奖金',storeCost:'门店支付',sales:'营业收入变化'};return Object.entries(e).filter(([k,v])=>labels[k]&&v).map(([k,v])=>[labels[k],['wages','bonus','storeCost'].includes(k)?priceText(v):k==='sales'?'+'+(v*100)+'%':(v>0?'+':'')+v]);}
function openManagerGroup(group){const g=group||cafePending();if(!g)return false;
 if(g.follow&&!g.follow.settled){showEvent('店长后续',CafeRules.CARDS[g.eventId].name+' · 后续结果',g.follow.success?'成功，结果已锁定。':'未成功，结果已锁定。',cafeEffectRows(CafeRules.followEffects(g)),[['确认后续结果',()=>{captureCoffeePayMilestones();if(CafeRules.finishFollow(state,g.id)){captureCoffeePayMilestones();save();openManagerGroup(g)}},true]]);return true;}
 if(g.status==='resolved'){showEvent('店长事件结果',CafeRules.CARDS[g.eventId].name,'本组已完成。个人工资/奖金月底发，门店费用仅记门店一次。',g.receipts.flatMap(r=>cafeEffectRows(r.effects)),[['继续',finish,true]]);return true;}
 showEvent('店长职业事件',CafeRules.CARDS[g.eventId].name,'状态和技能在确认时执行；正常班内职责不额外付工资或小费。',[],g.choices.map((e,i)=>{
 const shown={...e};if(e.paidHours)shown.wages=roundCash(g.quote.annualSalary/52/45*1.5*e.paidHours);
 return [e.label+(e.blocked?'（资料待核对）':''),()=>{captureCoffeePayMilestones();if(CafeRules.choose(state,g.id,i,currentCareerTime().free)){captureCoffeePayMilestones();save();openManagerGroup(g)}},i===0,!!e.blocked||(e.hours||0)>currentCareerTime().free];}).concat([['保留待处理',finish,false]]));
 $('eventData').innerHTML=g.choices.map((e,i)=>'<p>'+batchEscape(String.fromCharCode(65+i)+': '+e.label)+(e.blocked?' · '+batchEscape(e.blocked):cafeEffectRows({...e,...e.paidHours?{wages:roundCash(g.quote.annualSalary/52/45*1.5*e.paidHours)}:{}}).map(r=>' · '+batchEscape(r[0]+' '+r[1])).join(''))+'</p>').join('');$('eventData').style.display='block';return true;}
const cafeBudgetBefore=careerTimeBudget;careerTimeBudget=function(weekly,delta){return cafeBudgetBefore(cafeRole()?45:weekly,delta)};
const cafeTimeBefore=currentCareerTime;currentCareerTime=function(){const t=cafeTimeBefore();if(!cafeRole()||!state)return t;const c=CafeRules.data(state),q=c.work[state.month];return {...t,free:isRecoveryMonth(state)||t.recoveryPending||t.timeDebtBlocked?0:Math.max(0,t.free+(q?.absentHours||0)-(c.eventHours[state.month]||0)),managerEventHours:c.eventHours[state.month]||0};};
const cafeIncomeBefore=coffeeMonthlyIncome;coffeeMonthlyIncome=function(){if(!cafeRole())return cafeIncomeBefore();const x=CafeRules.payroll(state,cafeSeason().tips);if(!x)return null;const date=coffeeCalendar(),season=cafeSeason(),t=currentCareerTime();return {...x,year:date.year,calendarMonth:date.month,season:season.name,seasonKey:season.key,extraTips:0,baseWeeklyHours:45,workHoursDelta:(state.cafe.eventHours[state.month]||0)-x.absentHours,freeHours:t.free,baseFreeHours:80}};
const cafeIncomeMarkupBefore=coffeeIncomeMarkup;coffeeIncomeMarkup=function(x,heading){if(!CafeRules.ROLES[x.role])return cafeIncomeMarkupBefore(x,heading);return '<section class="wl-panel coffee-income"><h3>'+(x.role==='manager'?'店长':'在店管理合伙人')+'本月收入</h3><p>第'+x.year+'年 · '+x.calendarMonth+'月 · '+x.season+'</p><table class="wl-review">'+[['正常工资',x.baseWages],['小费',x.baseTips],['固定奖金',x.fixedBonus],['有薪额外班',x.eventWages],['专项奖金',x.eventBonus],['本月劳动收入合计',x.total]].map(([k,v])=>'<tr><th>'+k+'</th><td>'+priceText(v)+'</td></tr>').join('')+'</table><p>基础工时45h/周 · 基础自由时间80h/月 · 本月剩余'+x.freeHours+'h</p></section>'};
const cafeWorkBefore=openWorkAdjustment;openWorkAdjustment=function(){return cafeRole()?cafeOpenWork():cafeWorkBefore()};
const cafeCareerBefore=workplaceEvent;workplaceEvent=function(){if(!cafeRole())return cafeCareerBefore();if(isRecoveryMonth(state))return openHealthTreatment();if(cafeRole()==='partner'){showEvent('职业事件','合伙人事件待核对',CAFE_MISSING.partnerPool,[],[['继续',finish,true]]);return true;}
 if(!CafeRules.data(state).work[state.month]){cafeOpenWork();return true;}const g=CafeRules.draw(state,currentCareerTime().free);save();if(g)return openManagerGroup(g);showEvent('职业事件','本次没有合格职业事件','当前岗位、冷却、资源或已确认卡片均不满足；本次不扣款、不扣时、不发奖励。',[],[['继续',finish,true]]);return true;};
const cafeCoffeeOpenBefore=openCoffeeCareerEvent;openCoffeeCareerEvent=function(){return cafePending()?openManagerGroup(cafePending()):cafeCoffeeOpenBefore()};
const cafeGroupBefore=unfinishedCareerGroup;unfinishedCareerGroup=function(){return !!cafePending()||cafeGroupBefore()};
const cafeOpenBefore=openGame;openGame=function(){const result=cafeOpenBefore();if(state&&cafePending()&&!state.requiredIncident&&!state.gameOver&&!unfinishedTreatment()&&!healthTreatmentKind(state.health))openManagerGroup(cafePending());return result};
const cafeShowBefore=showEvent;showEvent=function(type,...args){if(type==='读档成功'&&state&&cafePending()&&!state.requiredIncident&&!unfinishedTreatment()&&!healthTreatmentKind(state.health))return openManagerGroup(cafePending());return cafeShowBefore(type,...args)};
const cafeProgressBefore=applyCareerProgression;applyCareerProgression=function(){if(cafeRole())return;return cafeProgressBefore()};
const cafeSyncBefore=syncFinance;syncFinance=function(){if(state){CafeRules.ensureStore(state);CafeRules.applyTrade(state)}return cafeSyncBefore()};
const cafeSettlementBefore=settleMonth;settleMonth=function(){
 if(cafePending()){openManagerGroup(cafePending());return;}
 if(cafeRole()&&!isRecoveryMonth(state)&&!state.retired&&!state.unemployedMonths&&!CafeRules.data(state).work[state.month])return cafeOpenWork();
 const st=state&&CafeRules.ensureStore(state);if(st?.status==='ready'){const q=cafeStoreQuote();if(q.blocked)return showEvent('门店结算待处理','门店账目需要核对',q.blocked,[],[['返回房屋',cafeReturn,true]])}
 return cafeSettlementBefore();};
const cafeInvestBefore=settleInvestingBatch;settleInvestingBatch=function(s,nextMonth){cafeInvestBefore(s,nextMonth);const c=CafeRules.data(state),st=CafeRules.ensureStore(state);
 if(st.status!=='ready'){s.cafeStoreDeferred=st.reason;return;}
 // Recovery has zero actual player management pay; no substitute wage is invented.
 const q=cafeStoreQuote(),record=CafeRules.settleStore(st,q,c.holdings.effectivePct);if(record.blocked)throw Error(record.blocked);s.cafeStore=record;
 if(record.duplicate)return;const div=record.playerDividend;if(div){state.cash=roundCash(state.cash+div);s.passive=roundCash(s.passive+div);s.netCF=roundCash(s.netCF+div);s.cafeDividend=div;(state.financeLedger??=[]).push({kind:'cafeDividend',month:state.month,amount:div,storeId:st.id});c.lastPaidDividend={month:state.month,amount:div};}
};
const cafeFinalizeBefore=finalizeCoffeeMonth;finalizeCoffeeMonth=function(s){cafeFinalizeBefore(s);const x=s.careerIncome;if(!x||!CafeRules.ROLES[x.role]||s.recovery)return;const c=CafeRules.data(state),cycle=x.cycle;if(c.xpMonths[cycle])return;c.xpMonths[cycle]={status:'recorded'};
 if(x.absentHours>0){c.xpMonths[cycle].status='absence-rule-pending';s.cafeGrowthDeferred='请假月份XP及有效任职口径待核对';return;}
 const gains={...CafeRules.ROLES[x.role].xp};coffeeSkillGain(gains);(c.observedWorkMonths??=[]).push({cycle,role:x.role});s.cafeGrowth=gains;};
const cafeRenderBefore=render;render=function(){const result=cafeRenderBefore();const tools=$('roomView')?.querySelector('.room-tools');if(tools&&!$('cafeStoreBtn')){const b=document.createElement('button');b.id='cafeStoreBtn';b.textContent='咖啡店';b.onclick=cafeViewStatus;tools.append(b)}return result};

const cafeBillsBefore=necessaryBills;necessaryBills=function(){const rows=cafeBillsBefore();if(cafeRole()&&!isRecoveryMonth(state)&&!state.retired&&!state.unemployedMonths&&!CafeRules.data(state).work[state.month])rows.push({kind:'cafeWork',name:'确认本月咖啡店工作安排',due:0,action:openWorkAdjustment});return rows;};

const cafeAuditBefore=completeCashAudit;completeCashAudit=function(s){cafeAuditBefore(s);s.totalMonthlyCF=roundCash(s.totalMonthlyCF+(s.cafeDividend||0))};
