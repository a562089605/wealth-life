// Schedule follow-up integration. Recovery engine must provide isRecoveryMonth(s).
function timeReturnPending(){return !!state?.forcedTimeReturn&&state.forcedTimeReturn.month===state.month}
const timeBudgetBefore=currentCareerTime;
currentCareerTime=function(){const t=timeBudgetBefore();if(!state)return t;
 const recovery=typeof isRecoveryMonth==='function'&&isRecoveryMonth(state);
 if(state.health<30&&!recovery)return {...t,free:0,recoveryPending:true};
 if(!state.eventTimeLedger&&!recovery)return t;
 const a=allocateEventTimeDebt(state,{month:state.month,baseHours:t.baseFree,recovery:!!recovery});
 return {...t,free:a.blocked||recovery?0:Math.max(0,t.baseFree-t.workHoursDelta-(t.courseHours||0)-a.applied),timeDebtApplied:a.applied||0,timeDebtBlocked:!!a.blocked};};

function explorationReturnReasons(){const reasons=[];
 if(state.energy<20)reasons.push('能量低于20');
 if(state.stress>=80)reasons.push('压力达到80或以上');
 if(state.happiness<20)reasons.push('幸福度低于20');
 if(currentCareerTime().free<=0)reasons.push('本月自由时间已用完');
 return reasons;
}
function explorationStarted(){return townEnabled()&&state.town?.explorationMonth===state.month}
function unfinishedCareerGroup(){const r=shiftRecord();if(r?.status==='followup'&&!r.follow?.settled)return true;
 const move=state.town?.movement,active=move&&!move.resolved&&move.opened&&typeof TOWN_TYPES!=='undefined'&&TOWN_TYPES[move.to]==='career';
 const b=typeof coffeeRecord==='function'?coffeeRecord():null;return !!active&&(r?.status==='pending'||b?.status==='pending');}
function markExplorationReturn(){if(!explorationStarted()||unfinishedCareerGroup())return false;
 const reasons=explorationReturnReasons();if(!reasons.length)return timeReturnPending();
 const prior=timeReturnPending()?state.forcedTimeReturn:null;
 state.forcedTimeReturn={month:state.month,id:prior?.id||'state-threshold',debt:prior?.debt||0,reasons:[...new Set([...(prior?.reasons||[]),...reasons])]};save();return true;
}
function openForcedTimeReturn(){if(!timeReturnPending())return false;
 const r=shiftRecord();if(r?.follow&&!r.follow.settled){openShiftFollow();return true;}
 townVisible=false;save();showEvent('本月探索结束','返回房屋结算','当前事件已完成，本月探索结束。若有欠时，将按既定规则处理。',[['返回原因',(state.forcedTimeReturn.reasons||['强制事件耗尽自由时间']).join('；')],['待扣自由时间',state.forcedTimeReturn.debt+'h']],[['返回房屋，结算本月',()=>{
 if(!timeReturnPending())return;
 const t=townState();if(!t.movement)t.movement={id:++t.rolls,to:t.position,die:0,month:state.month,resolved:false};
 t.movement.resolved=false;t.movement.payExpected=state.month+1;t.movement.returnReason='forced-time';
 clearModals();pending=false;state.turn={month:state.month,index:9,startCash:state.turn?.month===state.month?state.turn.startCash:state.cash};save();settleMonth();
 },true]]);$('eventClose').hidden=true;return true;}
const timeFinishBefore=finish;finish=function(){markExplorationReturn();if(timeReturnPending()){clearModals();pending=false;openForcedTimeReturn();return;}return timeFinishBefore();};
const timeRollBefore=rollTown;rollTown=function(){if(document.querySelector('.event-active'))return;if(markExplorationReturn()||timeReturnPending())return openForcedTimeReturn();if(currentCareerTime().free<=0&&typeof openHomeMonthEnd==='function')return openHomeMonthEnd();const reasons=explorationReturnReasons();if(reasons.length){showEvent('暂时不能出门','先在房屋调整状态',reasons.join('；')+'。本次没有推进月份。',[],[['返回房屋',townHome,true]]);return;}const before=state.town?.rolls||0;const result=timeRollBefore();if((state.town?.rolls||0)>before){state.town.explorationMonth=state.month;save();}return result;};
const timeResumeBefore=resumeTownMove;resumeTownMove=function(){if(timeReturnPending())return openForcedTimeReturn();return timeResumeBefore();};
const timeOpenBefore=openGame;openGame=function(){const result=timeOpenBefore();if(timeReturnPending())openForcedTimeReturn();return result;};

const timeShowTownBefore=showTown;showTown=function(){if(markExplorationReturn()||timeReturnPending())return openForcedTimeReturn();return timeShowTownBefore();};
