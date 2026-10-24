// One medical policy per player. Existing active legacy contracts keep their terms.
const MEDICAL_PLANS={basic:{name:'基础医疗险',monthly:200,coverage:.8},full:{name:'全额医疗险',monthly:400,coverage:1}};
INSURANCE.health=['基础医疗险',200];
function medicalCoverage(s=state){const p=s.insurance?.health;if(!p?.active)return 0;return p.coverage??1;}
function applyPendingMedicalPolicy(s){const x=s.pendingMedicalPolicy;if(!x||x.effectiveMonth>s.month)return false;
 s.insurance??={};s.insurance.health=x.plan?{...MEDICAL_PLANS[x.plan],plan:x.plan,active:true,effectiveMonth:x.effectiveMonth}: {...s.insurance.health,active:false};delete s.pendingMedicalPolicy;return true;}
function confirmMedicalPlan(plan){if(plan!==null&&!MEDICAL_PLANS[plan])return false;syncFinance();const old=state.insurance.health;
 if(old?.active){if(plan===old.plan){delete state.pendingMedicalPolicy;save();openMedicalInsurance();return true;}state.pendingMedicalPolicy={plan,effectiveMonth:state.month+1};save();openMedicalInsurance();return true;}
 if(plan===null){delete state.pendingMedicalPolicy;save();openMedicalInsurance();return true;}
 const p=MEDICAL_PLANS[plan],other=premiumsTotal(),due=Math.max(0,roundCash(other+p.monthly-(paymentReceipt().premiums||0)));
 if(!payMonthly('premiums',due)){showEvent('医疗保险','保费不足','付款完成后才生效，不自动借款。',[['本次应付',priceText(due)]],[['申请借款',()=>openBankLoan(Math.max(1,Math.ceil(due-state.cash)),{after:openMedicalInsurance}),true],['返回',openMedicalInsurance,false]]);return false;}
 state.insurance.health={...p,plan,active:true,effectiveMonth:state.month};syncFinance();save();openMedicalInsurance();return true;}
function openMedicalInsurance(){syncFinance();const p=state.insurance.health,x=state.pendingMedicalPolicy;
 showEvent('医疗保险','医疗保障选择','未投保时确认付款后立即生效；已有保障的切换或取消从下月生效，当月保障和已付保费保留。已经发生的治疗按原报价，不追溯赔付。',[
 ['当前保障',p?.active?(p.name||'旧版医疗险')+' · 赔付'+Math.round(medicalCoverage()*100)+'%':'未投保'],['月保费',priceText(p?.active?p.monthly:0)],...(x?[['下月安排',x.plan?MEDICAL_PLANS[x.plan].name:'停止保障']]:[])],
 [['基础医疗险 · $200/月 · 赔付80%',()=>confirmMedicalPlan('basic'),true],['全额医疗险 · $400/月 · 赔付100%',()=>confirmMedicalPlan('full'),false],['不购买／下月停保',()=>confirmMedicalPlan(null),false],['返回',finish,false]]);}
const medicalSyncBefore=syncFinance;syncFinance=function(){if(state)applyPendingMedicalPolicy(state);return medicalSyncBefore();};
const medicalOpenInsuranceBefore=openInsurance;openInsurance=function(type){if(type==='health')return openMedicalInsurance();return medicalOpenInsuranceBefore(type);};
const medicalBuyInsuranceBefore=buyInsurance;buyInsurance=function(type){if(type==='health')return openMedicalInsurance();return medicalBuyInsuranceBefore(type);};
document.addEventListener('click',e=>{if(e.target.closest('[data-medical-insurance]'))openMedicalInsurance();});
