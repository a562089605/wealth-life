// Only individually confirmed activities have a time cost. Null means still unconfirmed.
function optionalLifeHours(i){return ({0:2,1:4,2:2})[i]??null;}
function optionalLifeTimeMissing(i){const hours=optionalLifeHours(i);return hours!==null&&currentCareerTime().free<hours;}
(function(){
 const timeBefore=currentCareerTime;
 currentCareerTime=function(){const t=timeBefore(),r=state?.lifeActivityTime,used=r&&r.month===state?.month?r.hours:0;return {...t,free:Math.max(0,t.free-used),lifeActivityHours:used};};
 const spendingBefore=spendConfirmed;
 spendConfirmed=function(kind,amount,meta){
  const i=kind==='lifestyle'?V26_LIFE.findIndex(o=>o.name===meta?.choice):-1,hours=optionalLifeHours(i);
  if(hours===null)return spendingBefore(kind,amount,meta);
  if(optionalLifeTimeMissing(i)||state.lifeActivityTime?.month===state.month)return false;
  const paid=spendingBefore(kind,amount,meta);if(paid)state.lifeActivityTime={month:state.month,name:V26_LIFE[i].name,hours};return paid;
 };
 // Retained annual preparation also uses lifestyle spending: preflight before any monthly payments.
 const annualBefore=prepareAnnualMonth;
 prepareAnnualMonth=function(...args){
  const eligible=!ordinaryRecoveryActivityBlocked()&&state.annualRun?.preparedMonth!==state.month&&!monthSelection('life'),i=eligible?V26_LIFE.indexOf(annualCost().life):-1;
  if(eligible&&optionalLifeTimeMissing(i)){
   pauseAnnual();showEvent('生活安排',V26_LIFE[i].name+'时间不足','本项需要'+optionalLifeHours(i)+'小时自由时间；本次没有执行年度准备或扣款。',[['剩余自由时间',currentCareerTime().free+'小时']],[['返回房屋',townHome,true]]);return false;
  }
  return annualBefore(...args);
 };
})();
