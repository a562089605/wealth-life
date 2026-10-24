function unfinishedTreatment(){return Object.values(state.treatments||{}).find(t=>t.status!=='completed')}
function ensureHealthTreatment(){let t=unfinishedTreatment();if(t)return t;const kind=healthTreatmentKind(state.health);if(!kind)return null;
 const startMonth=state.month+(explorationStarted()?1:0),id='treatment-'+state.month+'-'+kind;
 t=beginTreatment(state,{id,quote:treatmentQuote({kind,coverage:medicalCoverage()}),startMonth});save();return t;}
function openHealthTreatment(){if(state.requiredIncident){openRequiredIncident();return true;}const t=ensureHealthTreatment();if(!t)return false;
 if(t.paid){continueTreatment(t);return true;}
 showEvent('医疗与康复',t.quote.kind==='special'?'严重健康问题':'整月康复安排','完整疗程包含1个月康复，只收费一次。费用按本次触发时的有效保单锁定，之后投保不追溯赔付。',[
 ['治疗与康复总费用',priceText(t.quote.gross)],['保险承担',priceText(t.quote.gross-t.quote.due)],['本次自付',priceText(t.quote.due)],['支付后现金',priceText(state.cash-t.quote.due)],['康复月份','第'+(Math.floor(t.startMonth/12)+1)+'年·第'+(t.startMonth%12+1)+'月']],
 [['确认支付并安排康复',()=>{const result=payTreatment(state,t.id);if(!result.paid){openHealthTreatment();return;}save();continueTreatment(t);},true,state.cash<t.quote.due],['查看资金补救',()=>showFundingOptions(t.quote.due,openHealthTreatment),false],['筹措治疗费用',()=>openBankLoan(Math.max(1,Math.ceil(t.quote.due-state.cash)),{after:openHealthTreatment}),false]]);$('eventClose').hidden=true;return true;}
function continueTreatment(t){
 if(t.startMonth>state.month){const prior=timeReturnPending()?state.forcedTimeReturn:null;state.forcedTimeReturn={month:state.month,id:prior?.id||t.id,debt:prior?.debt||0,reasons:[...(prior?.reasons||[]),'健康过低，治疗已安排']};save();
 if(unfinishedCareerGroup()){const r=shiftRecord();if(r?.follow&&!r.follow.settled)openShiftFollow();else if(r?.status==='pending')openShiftEvent();else openCoffeeCareerEvent();return;}openForcedTimeReturn();return;}
 showEvent('整月康复','完成本月康复','本月不工作、不学习、不出门。生活、住房等必要账单继续结算，符合条件的被动收入照常；月底最后执行恢复，不重复收取疗程费用。',[
 ['疗程费用','已支付'],['康复后状态','健康30、能量至少60、压力最多40；幸福度保留']],
 [['确认执行本月康复',()=>{if(!isRecoveryMonth(state))return;clearModals();pending=false;const town=townState();town.movement={id:++town.rolls,to:town.position,die:0,month:state.month,resolved:false,payExpected:state.month+1,returnReason:'recovery'};state.turn={month:state.month,index:9,startCash:state.turn?.month===state.month?state.turn.startCash:state.cash};save();settleMonth();},true],['查看必要账单与资金',townHome,false]]);$('eventClose').hidden=true;
}
const healthRollBefore=rollTown;rollTown=function(){if(unfinishedTreatment()||healthTreatmentKind(state.health))return openHealthTreatment();return healthRollBefore();};
const healthTownBefore=showTown;showTown=function(){if(unfinishedTreatment()||healthTreatmentKind(state.health))return openHealthTreatment();return healthTownBefore();};
const healthFinishBefore=finish;finish=function(){if(unfinishedTreatment()||healthTreatmentKind(state.health)){clearModals();pending=false;return openHealthTreatment();}return healthFinishBefore();};
const healthOpenBefore=openGame;openGame=function(){const result=healthOpenBefore();if(unfinishedTreatment()||healthTreatmentKind(state.health))openHealthTreatment();return result;};
// Critical health intercepts the next event display after its effects were saved.
// The existing event record remains intact; treatment does not reroll its result.
const healthShowBefore=showEvent;showEvent=function(...args){if(state&&state.health<=15&&!['资金处理','破产确认','宠物托付','人生结束'].includes(args[0])&&!state.requiredIncident&&!unfinishedTreatment())return openHealthTreatment();return healthShowBefore(...args);};
const recoveryWorkBefore=openWorkAdjustment;openWorkAdjustment=function(){if(isRecoveryMonth(state))return openHealthTreatment();return recoveryWorkBefore();};
const recoveryEducationBefore=openEducation;openEducation=function(){if(isRecoveryMonth(state))return openHealthTreatment();return recoveryEducationBefore();};
