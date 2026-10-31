// New practices reserve time; historical selections and XP are not backcharged.
const HOBBY_PRACTICE_HOURS=8;
function hobbyPracticeMissing(name){
 const cost=HOBBY_COSTS[name],missing=[];
 if(!Number.isFinite(cost))return ['请选择兴趣'];
 if(monthSelection('hobby'))missing.push('本月已完成兴趣练习');
 if(ordinaryRecoveryActivityBlocked())missing.push('请先安心疗养');
 if(state.cash<cost)missing.push('现金不足');
 const reserve=typeof necessaryPetCareHours==='function'?necessaryPetCareHours():0;
 if(currentCareerTime().free<HOBBY_PRACTICE_HOURS)missing.push('需要8小时自由时间');
 else if(currentCareerTime().free-HOBBY_PRACTICE_HOURS<reserve)missing.push('请先为宠物照护留出时间');
 return missing;
}
(function(){
 const timeBefore=currentCareerTime;
 currentCareerTime=function(){const t=timeBefore(),r=state?.hobbyPracticeTime,used=r?.month===state?.month?r.hours:0;return {...t,free:Math.max(0,t.free-used),hobbyHours:used};};
 const spendingBefore=spendConfirmed;
 spendConfirmed=function(kind,amount,meta){
  if(kind!=='hobbyPractice')return spendingBefore(kind,amount,meta);
  if(hobbyPracticeMissing(meta?.hobby).length||amount!==HOBBY_COSTS[meta.hobby])return false;
  const paid=spendingBefore(kind,amount,meta);
  if(paid)state.hobbyPracticeTime={month:state.month,name:meta.hobby,hours:HOBBY_PRACTICE_HOURS};
  return paid;
 };
 const annualBefore=prepareAnnualMonth;
 prepareAnnualMonth=function(...args){
  const name=state.annualPlan?.hobby;
  if(name&&state.annualRun?.preparedMonth!==state.month&&!monthSelection('hobby')){
   const lifeHours=monthSelection('life')?0:optionalLifeHours(V26_LIFE.indexOf(annualCost().life))||0;
   const reserve=typeof necessaryPetCareHours==='function'?necessaryPetCareHours():0;
   if(hobbyPracticeMissing(name).length||currentCareerTime().free<HOBBY_PRACTICE_HOURS+lifeHours+reserve){
    pauseAnnual();showEvent('HOBBY','兴趣练习暂未安排','请先确认可用时间、费用与身体状态，再继续年度安排。',[['本次兴趣时间','8h'],['剩余自由时间',currentCareerTime().free+'h']],[['返回房屋',townHome,true]]);return false;
   }
  }
  return annualBefore(...args);
 };
})();
$('hobbyBtn').onclick=()=>{
 if(ordinaryRecoveryActivityBlocked())return showRecoveryActivityRestriction();
 const done=monthSelection('hobby'),entries=Object.entries(HOBBY_COSTS);
 const data=entries.map(([name,cost])=>[name,'Lv.'+hobbyLevel(name)+' · '+hobbyXP(name)%100+'/100 XP · '+priceText(cost)+' · 8h']);
 const actions=entries.map(([name,cost])=>['练习 '+name,()=>{
  if(hobbyPracticeMissing(name).length||!spendConfirmed('hobbyPractice',cost,{hobby:name}))return false;
  state.hobbyXP??={};state.hobbies??={};state.hobbyXP[name]=(state.hobbyXP[name]||0)+35;state.hobbies[name]=hobbyLevel(name);
  state.happiness=Math.min(100,state.happiness+4);state.energy=Math.min(100,state.energy+2);state.stress=Math.max(0,state.stress-4);
  setMonthSelection('hobby',name);safe50();save();
  showEvent('HOBBY','完成一次练习',name+'的练习完成了，享受这段属于自己的时间。',[['等级','Lv.'+hobbyLevel(name)],['经验',hobbyXP(name)%100+'/100 XP'],['本次学习','8h · '+priceText(cost)],['剩余自由时间',currentCareerTime().free+'h']],[['返回兴趣技巧学习',openLearningSkills,true]]);return true;
 },false,!!hobbyPracticeMissing(name).length]);
 showEvent('HOBBY','发展兴趣',done?'本月已练习'+done+'，下个月可继续。':'每月自选一次，每次8小时；这个月也可以先不安排。',data,actions);
};
