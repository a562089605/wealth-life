// User-confirmed optional interaction hours; old receipts are not charged retroactively.
function socialInteractionHours(kind){return ({socialCoffee:1,socialWalk:1,socialMeal:2})[kind]??null;}
(function(){
 const timeBefore=currentCareerTime;
 currentCareerTime=function(){const t=timeBefore(),used=SocialRecords.all(state).reduce((n,r)=>n+(Number.isFinite(r.hours)?Math.max(0,r.hours):0),0);return {...t,free:Math.max(0,t.free-used),socialHours:used};};
 const before=doSocial;
 doSocial=function(p,cost,points,kind){
  const hours=socialInteractionHours(kind);if(hours===null)return before(p,cost,points,kind);
  if(socialRecord(p))return false;
  if(currentCareerTime().free<hours){const i=state.people.indexOf(p);if(i>=0)openSocialPerson(i);return false;}
  const result=before(p,cost,points,kind),r=socialRecord(p);
  if(r){r.hours=hours;save();}
  return result;
 };
})();
