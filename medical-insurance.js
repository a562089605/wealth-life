// One medical policy per player. Existing active legacy contracts keep their terms.
const MEDICAL_PLANS={basic:{name:'基础医疗险',monthly:200,coverage:.8},full:{name:'全额医疗险',monthly:400,coverage:1}};
INSURANCE.health=['基础医疗险',200];
function medicalCoverage(s=state){const p=s.insurance?.health;if(!p?.active)return 0;return p.coverage??1;}
function applyPendingMedicalPolicy(s){const x=s.pendingMedicalPolicy;if(!x||x.effectiveMonth>s.month)return false;
 s.insurance??={};s.insurance.health=x.plan?{...MEDICAL_PLANS[x.plan],plan:x.plan,active:true,effectiveMonth:x.effectiveMonth}: {...s.insurance.health,active:false};delete s.pendingMedicalPolicy;return true;}
function medicalPremiumDue(plan){
 return Math.max(0,roundCash(premiumsTotal()+MEDICAL_PLANS[plan].monthly-(paymentReceipt().premiums||0)));
}
function confirmMedicalPlan(plan,reopen=openMedicalInsurance){
 if(plan!==null&&!MEDICAL_PLANS[plan])return false;
 syncFinance();
 const old=state.insurance.health;
 const previous=structuredClone(state);
 if(old?.active&&plan!==old.plan){
  state.pendingMedicalPolicy={plan,effectiveMonth:state.month+1};
 }else if(old?.active||plan===null){
  delete state.pendingMedicalPolicy;
 }else{
  const selected=MEDICAL_PLANS[plan];
  const due=medicalPremiumDue(plan);
  if(!payMonthly('premiums',due)){
   showEvent('医疗保险','保费不足','付款完成后才生效，不自动借款。',[['本次应付',priceText(due)]],[
    ['申请借款',()=>openBankLoan(Math.max(1,Math.ceil(due-state.cash)),{after:reopen}),true],
    ['返回',reopen,false]
   ]);
   return false;
  }
  state.insurance.health={...selected,plan,active:true,effectiveMonth:state.month};
 }
 try{
  syncFinance();
  if(save()===false)throw Error('save failed');
 }catch(error){
  state=previous;
  showEvent('医疗保险','保险变更未保存','现金、保费和保单已恢复，可以返回重试。',[],[['返回医疗保障选择',reopen,true]]);
  return false;
 }
 reopen();
 return true;
}
function previewMedicalPlan(plan,reopen){
 const current=state.insurance.health;
 const selected=MEDICAL_PLANS[plan];
 const keeping=current?.active&&plan===current.plan;
 const due=current?.active ? 0 : medicalPremiumDue(plan);
 const effective=keeping?'保留当前保障':current?.active?'下月生效':'确认后立即生效';
 const action=keeping?'确认保留当前保障':current?.active?'确认下月切换':due>0?'确认支付 '+priceText(due):'确认方案';
 showEvent('医疗保险',selected.name+(current?.active&&!keeping?'切换预览':'投保预览'),'',[
  ...(current?.active&&!keeping?[['当前保障',current.name||'旧版医疗险']]:[]),
  ['赔付比例',Math.round(selected.coverage*100)+'%'],
  ['方案月保费',priceText(selected.monthly)],
  ['本次应付',priceText(due)],
  ['生效时间',effective]
 ],[[action,()=>confirmMedicalPlan(plan,reopen),true],['返回医疗保障选择',reopen,false]]);
 window.modalReturn=reopen;
}
function previewMedicalStop(reopen){
 showEvent('医疗保险','确认下月停保','本月保障和已付保费保留，下月起停止保障。',[
  ['本次应付',priceText(0)]
 ],[['确认下月停保',()=>confirmMedicalPlan(null,reopen),true],['返回医疗保障选择',reopen,false]]);
 window.modalReturn=reopen;
}
function openMedicalInsurance(back=finish){const reopen=()=>openMedicalInsurance(back);syncFinance();const p=state.insurance.health,x=state.pendingMedicalPolicy;
 showEvent('医疗保险','医疗保障选择','',[
 ['当前保障',p?.active?(p.name||'旧版医疗险')+' · 赔付'+Math.round(medicalCoverage()*100)+'%':'未投保'],['月保费',priceText(p?.active?p.monthly:0)],...(x?[['下月安排',x.plan?MEDICAL_PLANS[x.plan].name:'停止保障']]:[])],
 [...Object.entries(MEDICAL_PLANS).map(([plan,option])=>[
  option.name+' · '+priceText(option.monthly)+'/月 · 赔付'+Math.round(option.coverage*100)+'%'+(p?.active&&p.plan===plan?' · 当前方案':''),
  ()=>previewMedicalPlan(plan,reopen),!p?.active||p.plan!==plan,p?.active&&p.plan===plan&&!x
 ]),...(p?.active?[['下月停保',()=>previewMedicalStop(reopen),false]]:[]),[back===finish?'返回':'返回保险与保障',back,false]]);
 window.modalReturn=back;
}
const medicalSyncBefore=syncFinance;syncFinance=function(){if(state)applyPendingMedicalPolicy(state);return medicalSyncBefore();};
const medicalOpenInsuranceBefore=openInsurance;openInsurance=function(type){if(type==='health')return openMedicalInsurance();return medicalOpenInsuranceBefore(type);};
const medicalBuyInsuranceBefore=buyInsurance;buyInsurance=function(type){if(type==='health')return openMedicalInsurance();return medicalBuyInsuranceBefore(type);};
document.addEventListener('click',e=>{if(e.target.closest('[data-medical-insurance]'))openMedicalInsurance();});
