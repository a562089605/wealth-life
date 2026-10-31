// A fixed monthly commitment, derived from enrollment rather than charged by reads.
// Existing tuition receipts and completed months are never rewritten or backcharged.
const EDUCATION_HOURS={associate:20,bachelor:20,master:20,doctorate:60};
function educationRequiredHours(target){return EDUCATION_HOURS[target]||20}
function educationStudyHours(study){return Number.isFinite(study?.monthlyHours)&&study.monthlyHours>0?study.monthlyHours:20}
function educationMonthlyHours(s){
 return s?.study&&!(typeof isRecoveryMonth==='function'&&isRecoveryMonth(s))?educationStudyHours(s.study):0;
}
function educationEnrollmentMissing(target=EDU[state.education]?.next){
 const missing=[],hours=educationRequiredHours(target);
 if(state.health<30||isRecoveryMonth(state))missing.push('疗养期间请先安心休养');
 const free=currentCareerTime().free,reserve=typeof necessaryPetCareHours==='function'?necessaryPetCareHours():0;
 if(free<hours)missing.push('本月还需要'+hours+'小时学习时间');
 else if(free-hours<reserve)missing.push('请先为宠物照护留出'+reserve+'小时');
 return missing;
}
const educationTimeBefore=currentCareerTime;
currentCareerTime=function(){
 const t=educationTimeBefore(),hours=educationMonthlyHours(state);
 return {...t,free:Math.max(0,t.free-hours),educationHours:hours};
};
function openEducationGraduationReceipt(settlement){
 const e=settlement.educationStudy;if(!e?.graduated)return;
 const raise=settlement.educationRaise,month=settlement.month-1,status=e.employmentStatus||(raise?'working':'unemployed');
 const payRows=status==='retired'?[['毕业记录','学位已完成，退休收入不变']]:status==='unemployed'?[['毕业记录','学位已保留，入职后按岗位工资计薪']]:status==='temporarilyUnemployed'?[...(raise?[['复工后月薪',priceText(raise.nextMonthSalary??raise.after)+'/月']]:[]),['工资安排','复工后按新标准计薪，失业期间不发工资']]:raise?[['毕业后月薪',priceText(raise.nextMonthSalary??raise.after)+'/月'],['工资生效','毕业后的下一月']]:[['毕业记录','学位已完成']];
 showEvent('EDUCATION',EDU[e.target].name+' · 毕业回执','这段求学旅程已经完成，为你的努力与成长喝彩。',[
  ['完成学位',EDU[e.target].name],['完成月份','第'+(Math.floor(month/12)+1)+'年 · 第'+(month%12+1)+'月'],['完成学习',e.progressAfter+' 个学习月'],
  ['已付学费',Number.isFinite(e.tuition)?priceText(e.tuition):'已支付'],['毕业月学习占用',e.hours+'h'],
  ...payRows,
  ['后续学习时间','本阶段学习已完成']
 ],[['返回本月账单',()=>showMonthlyAudit(settlement),false],['返回学历选择',openEducation,false]]);
}
const educationAuditBefore=showMonthlyAudit;
showMonthlyAudit=function(s){
 const result=educationAuditBefore(s),e=s.educationStudy;
 if(e&&$('eventTitle').textContent==='第 '+s.month+' 月结算完成'){
  const note=document.createElement('p');note.className='wl-note';
  note.textContent=e.paused?'本月休学疗养，课程进度保留。':'本月学习 '+e.hours+'h，已完成 '+e.progressAfter+' 个学习月。'+(e.graduated?'祝贺你顺利毕业！':'');
  $('eventData').prepend(note);
  if(e.graduated){
   const owner=state,month=state.month,title=$('eventTitle').textContent,button=document.createElement('button');button.type='button';button.textContent='查看毕业回执';
   button.onclick=()=>{if(state===owner&&state.month===month&&eventActionCurrent(button,title))openEducationGraduationReceipt(s);};$('eventData').prepend(button);
  }
 }
 return result;
};
