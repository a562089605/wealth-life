// Recovery lifecycle domain functions. UI and accounting engine own the execution order.
function healthTreatmentKind(health){return health<=15?'special':health<30?'ordinary':null}
function treatmentQuote({kind,coverage}){
 if(!['ordinary','special'].includes(kind)||![0,.8,1].includes(coverage))throw Error('Invalid treatment quote');
 const gross=kind==='special'?10000:500;
 return {kind,gross,coverage,due:Math.round(gross*(1-coverage)*100)/100,recoveryMonths:1};
}
function beginTreatment(s,{id,quote,startMonth}){
 if(!id||!Number.isInteger(startMonth)||startMonth<s.month)throw Error('Invalid treatment');
 s.treatments??={};if(s.treatments[id])return s.treatments[id];
 const active=Object.values(s.treatments).find(t=>t.status!=='completed');if(active)throw Error('Existing unfinished treatment');
 const verified=treatmentQuote(quote);if(quote.due!==verified.due||quote.gross!==verified.gross)throw Error('Quote mismatch');
 return s.treatments[id]={id,quote:{...verified},startMonth,status:'awaiting-payment',paid:false,completedMonth:null};
}
function payTreatment(s,id){const t=s.treatments?.[id];if(!t)throw Error('Missing treatment');if(t.paid)return {paid:true,duplicate:true,due:0};
 if(s.cash<t.quote.due)return {paid:false,shortfall:Math.round((t.quote.due-s.cash)*100)/100};
 s.cash=Math.round((s.cash-t.quote.due)*100)/100;t.paid=true;t.status='scheduled';
 (s.financeLedger??=[]).push({kind:'medicalTreatment',id,month:s.month,amount:t.quote.due});return {paid:true,due:t.quote.due};
}
function isRecoveryMonth(s){return Object.values(s.treatments||{}).some(t=>t.paid&&t.status!=='completed'&&t.startMonth===s.month)}
function recoveryMonthEffects(s){return isRecoveryMonth(s)?{wages:false,tips:false,bonus:false,workXP:false,workTenure:false,studyProgress:false,tuition:false,ordinaryFreeHours:0,necessaryBills:true,eligibleDividends:true}:null}
function completeTreatment(s,{id,completedMonth,pressureCap=40,monthEffectsComplete}){
 const t=s.treatments?.[id];if(!t)throw Error('Missing treatment');if(t.status==='completed')return false;
 if(!monthEffectsComplete||!t.paid||completedMonth!==t.startMonth||pressureCap!==40)throw Error('Recovery completion requirements not met');
 // Execute after this month's ordinary state penalties, never before.
 s.health=30;s.energy=Math.max(s.energy,60);s.stress=Math.min(s.stress,pressureCap);
 t.status='completed';t.completedMonth=completedMonth;return true;
}
if(typeof module!=='undefined')module.exports={healthTreatmentKind,treatmentQuote,beginTreatment,payTreatment,isRecoveryMonth,recoveryMonthEffects,completeTreatment};
