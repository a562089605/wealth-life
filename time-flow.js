// Schedule follow-up integration. Recovery engine must provide isRecoveryMonth(s).
function timeReturnPending(){return !!state?.forcedTimeReturn&&state.forcedTimeReturn.month===state.month}
const timeBudgetBefore=currentCareerTime;
currentCareerTime=function(){const t=timeBudgetBefore();if(!state?.eventTimeLedger)return t;
 const recovery=typeof isRecoveryMonth==='function'&&isRecoveryMonth(state);
 const a=allocateEventTimeDebt(state,{month:state.month,baseHours:t.baseFree,recovery:!!recovery});
 return {...t,free:a.blocked||recovery?0:Math.max(0,t.baseFree-t.workHoursDelta-(t.courseHours||0)-a.applied),timeDebtApplied:a.applied||0,timeDebtBlocked:!!a.blocked};};
function openForcedTimeReturn(){if(!timeReturnPending())return false;
 const r=shiftRecord();if(r?.follow&&!r.follow.settled){openShiftFollow();return true;}
 townVisible=false;save();showEvent('本月探索结束','返回房屋结算','当前事件已完成。超出的时间已保存，正常月份扣除一次；康复期间保留。',[['待扣自由时间',state.forcedTimeReturn.debt+'h']],[['返回房屋，结算本月',()=>{
 if(!timeReturnPending())return;
 const t=townState();if(!t.movement)t.movement={id:++t.rolls,to:t.position,die:0,month:state.month,resolved:false};
 t.movement.resolved=false;t.movement.payExpected=state.month+1;t.movement.returnReason='forced-time';
 clearModals();pending=false;state.turn={month:state.month,index:9,startCash:state.turn?.month===state.month?state.turn.startCash:state.cash};save();settleMonth();
 },true]]);$('eventClose').hidden=true;return true;}
const timeFinishBefore=finish;finish=function(){if(timeReturnPending()){clearModals();pending=false;openForcedTimeReturn();return;}return timeFinishBefore();};
const timeRollBefore=rollTown;rollTown=function(){if(timeReturnPending())return openForcedTimeReturn();return timeRollBefore();};
const timeResumeBefore=resumeTownMove;resumeTownMove=function(){if(timeReturnPending())return openForcedTimeReturn();return timeResumeBefore();};
const timeOpenBefore=openGame;openGame=function(){const result=timeOpenBefore();if(timeReturnPending())openForcedTimeReturn();return result;};
