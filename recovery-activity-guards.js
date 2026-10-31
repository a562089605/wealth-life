// Recovery pauses ordinary activities without changing their prices or state effects.
function ordinaryRecoveryActivityBlocked(){
 return !!state&&(isRecoveryMonth(state)||healthTreatmentKind(state.health)!==null);
}
function showRecoveryActivityRestriction(){openHealthTreatment();return false;}
(function(){
 const spendingBefore=spendConfirmed;
 const ordinaryKinds=new Set(['hobbyPractice','lifestyle','socialMeal','socialCoffee','socialWalk']);
 spendConfirmed=function(kind,...args){
  if(ordinaryKinds.has(kind)&&ordinaryRecoveryActivityBlocked())return showRecoveryActivityRestriction();
  return spendingBefore(kind,...args);
 };
 // A saved confirmation can outlive its preview; guard the action, not just the menu.
 const chooseLifeBefore=chooseLife;chooseLife=function(...args){return ordinaryRecoveryActivityBlocked()?showRecoveryActivityRestriction():chooseLifeBefore(...args)};
 const socialBefore=doSocial;doSocial=function(...args){return ordinaryRecoveryActivityBlocked()?showRecoveryActivityRestriction():socialBefore(...args)};
 const courseBefore=completeCoffeeCourse;completeCoffeeCourse=function(...args){return ordinaryRecoveryActivityBlocked()?showRecoveryActivityRestriction():courseBefore(...args)};
 const courseMenuBefore=openCoffeeCourses;openCoffeeCourses=function(...args){return ordinaryRecoveryActivityBlocked()?showRecoveryActivityRestriction():courseMenuBefore(...args)};
 const socialMenuBefore=openSocialPerson;openSocialPerson=function(...args){return ordinaryRecoveryActivityBlocked()?showRecoveryActivityRestriction():socialMenuBefore(...args)};
 const hobbyMenuBefore=$('hobbyBtn').onclick;$('hobbyBtn').onclick=function(...args){return ordinaryRecoveryActivityBlocked()?showRecoveryActivityRestriction():hobbyMenuBefore.apply(this,args)};
 const lifeMenuBefore=$('lifestyleBtn').onclick;$('lifestyleBtn').onclick=function(...args){return ordinaryRecoveryActivityBlocked()?showRecoveryActivityRestriction():lifeMenuBefore.apply(this,args)};
 // Annual preparation previously paid ordinary activity costs before checking recovery.
 const annualBefore=prepareAnnualMonth;prepareAnnualMonth=function(...args){
  if(ordinaryRecoveryActivityBlocked()){pauseAnnual();return showRecoveryActivityRestriction();}
  return annualBefore(...args);
 };
})();
