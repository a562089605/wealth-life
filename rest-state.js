function applyMonthlyHealthEffects(s,cycle){s.monthlyHealthEffects??={};if(s.monthlyHealthEffects[cycle])return s.monthlyHealthEffects[cycle];const energy=s.energy<20?5:s.energy<30?2:0,stress=s.stress>=80?5:s.stress>=70?2:0,before=s.health;s.health=Math.max(0,s.health-energy-stress);return s.monthlyHealthEffects[cycle]={cycle,energyPenalty:energy,stressPenalty:stress,healthChange:s.health-before};}
function monthlyRest(){if(state.extraRest?.month!==state.month)state.extraRest={month:state.month,entries:[]};return state.extraRest;}
function restMissing(){const missing=[];if(state.health<30||isRecoveryMonth(state))missing.push('低健康请执行医疗康复');const reserve=necessaryPetCareHours(),free=currentCareerTime().free;if(free<4)missing.push('自由时间不足4h');else if(free-4<reserve)missing.push('需保留必要宠物照护时间');return missing;}
function confirmExtraRest(cycle,count){
 if(state.month!==cycle||monthlyRest().entries.length!==count||restMissing().length)return false;
 const snapshot=JSON.parse(JSON.stringify(state));
 const before={energy:state.energy,stress:state.stress,health:state.health,happiness:state.happiness};
 state.energy=Math.min(100,state.energy+4);state.stress=Math.max(0,state.stress-2);state.health=Math.min(100,state.health+1);state.happiness=Math.min(100,state.happiness+1);
 monthlyRest().entries.push({energy:state.energy-before.energy,stress:state.stress-before.stress,health:state.health-before.health,happiness:state.happiness-before.happiness,hours:4});
 try{if(save()===false)throw Error('rest save failed');}catch(e){for(const k of Object.keys(state))delete state[k];Object.assign(state,snapshot);return false;}
 render();openExtraRest();return true;
}
function openExtraRest(){if(state.health<30||isRecoveryMonth(state))return openHealthTreatment();const cycle=state.month,count=monthlyRest().entries.length,missing=restMissing();showEvent('休息','额外休息4小时','每次4h：能量+4、压力−2、健康+1、幸福度+1；最高100。可重复安排，不自动执行。',[
 ['本月剩余时间',currentCareerTime().free+'h'],['费用','$0'],...(missing.length?[['尚缺',missing.join('；')]]:[])],[['确认休息4h',()=>confirmExtraRest(cycle,count),true,!!missing.length],['返回，不休息',finish,false]]);}
const restTimeBefore=currentCareerTime;currentCareerTime=function(){const t=restTimeBefore(),used=state.extraRest?.month===state.month?state.extraRest.entries.length*4:0;return {...t,free:Math.max(0,t.free-used),restHours:used};};
$('wellnessBtn').onclick=openExtraRest;

