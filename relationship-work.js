// Work-unit identities are independent of job titles; explicit applications choose the unit.
(function(){
 const R=RelationshipRules;
 function active(){return !!state.job&&!state.retired&&!state.unemployedMonths;}
 function current(){return R.init(state).units.find(u=>u.id===state.currentWorkUnitId);}
 function person(u,role,index){const gender=Math.random()<.5?'male':'female',compatible=gender==='female'?['Maya','Nora','Sofia','Ava','Lina','Jamie']:['Daniel','Leo','Ethan','Marcus','Jamie'];const names=NPC_NAMES.filter(n=>compatible.includes(n)&&!state.people.some(p=>p.name===n)),name=names[Math.floor(Math.random()*names.length)]||('工作联系人'+(state.people.length+1));
  const professional=/医|律师|工程|教授/.test(state.job),min=role==='经理'?30:professional?23:18,max=60;
  return {id:u.id+'-'+role+'-'+index,name,gender,age:min+Math.floor(Math.random()*(max-min+1)),job:state.job,origin:'work',status:role,workUnitId:u.id,relation:10,metMonth:state.month,city:state.city};
 }
 function register(existingId){const d=R.init(state);state.people??=[];let u=d.units.find(u=>u.id===existingId);if(!u){u={id:'work-unit-'+(d.units.length+1),name:'工作单位 '+(d.units.length+1),entryJob:state.job,createdMonth:state.month};d.units.push(u)}state.currentWorkUnitId=u.id;
  if(!u.managerId){const p=person(u,'经理',0);state.people.push(p);u.managerId=p.id;u.managerNotice=true}return u;
 }
 function managerNotice(u){if(!u?.managerNotice)return false;const p=state.people.find(p=>p.id===u.managerId);if(!p)return false;const owner=state,month=state.month;
  RelationshipUI.paint('认识单位经理','manager-welcome-generic',[['经理',p.name],['资料',RelationshipUI.identity(p)],['亲密度',p.relation+'/100'],['说明','入职时已加入通讯录；没有费用或额外耗时。']],[['继续',()=>{if(state!==owner||state.month!==month||current()!==u)return;u.managerNotice=false;save();finish()}]]);return true;
 }
 const openBefore=openGame;openGame=function(...args){const out=openBefore(...args);const d=R.init(state);if(state.month===0&&!d.openingContactsReset){if(save()===false)return out;R.resetOpeningContacts(state);if(active()){const u=current()||register();if(!u.managerId)register(u.id);save();managerNotice(u)}else save();}else if(active()){const u=current()||register();save();managerNotice(u)}return out};
 const startBefore=$('start').onclick;$('start').onclick=function(...args){const out=startBefore.apply(this,args);if(active())managerNotice(current());return out};
 const originalApply=applyCareer;
 applyCareer=function(i){const c=CAREERS[i];if(!c||careerMissing(c).length)return originalApply(i);const units=R.init(state).units,owner=state,month=state.month;
  function apply(unitId){if(state!==owner||state.month!==month||$('eventTitle').textContent!=='选择申请的单位')return;let succeeded=false;const showBefore=showEvent;showEvent=function(type,title,...rest){if(type==='CAREER'&&title==='求职成功')succeeded=true;return showBefore(type,title,...rest)};
   try{originalApply(i)}finally{showEvent=showBefore}
   if(succeeded){const u=register(unitId);save();managerNotice(u)}
  }
  showEvent('工作单位','选择申请的单位','入职成功后才改变单位。升职不会自动生成新单位。',[],[...units.map(u=>['申请原单位：'+u.name,()=>apply(u.id),false]),['申请新单位',()=>apply(null),true],['返回',openCareerMarket,false]]);
 };
 // Retain the canonical career-event chain but remove the superseded automatic monthly acquaintance.
 // The old base function is disabled in flow.js; cafe and shift event wrappers still run unchanged.
 function coworkerCandidate(){if(!active())return null;const u=current();if(!u)return null;const people=state.people.filter(p=>p.workUnitId===u.id&&p.status==='同事');if(people.length>=5)return null;
  if(!u.candidate||people.some(p=>p.id===u.candidate.id))u.candidate=person(u,'同事',people.length+1);return {u,p:u.candidate};
 }
 function openCoworker(record){const q=coworkerCandidate();if(!q)return false;if(!record||record.status!=='pending'||record.month!==state.month)return false;
  record.contact??=structuredClone(q.p);record.unitId??=q.u.id;save();const owner=state;
  RelationshipUI.paint('认识新同事','coworker-first-meeting-generic',[['姓名',record.contact.name],['资料',[record.contact.gender==='male'?'男':'女',record.contact.age+'岁',q.u.name].join(' · ')],['初始亲密度',10],['花费与额外耗时','免费 · 0h']],[['打个招呼',()=>{
   if(state!==owner||!active()||current()?.id!==record.unitId||record.month!==state.month||record.status!=='pending'||state.people.filter(p=>p.workUnitId===record.unitId&&p.status==='同事').length>=5||state.people.some(p=>p.id===record.contact.id))return;
   state.people.push({...record.contact,metMonth:state.month});record.status='resolved';save();showMapRecord(record);
  }],['暂不认识',()=>{if(state!==owner||record.status!=='pending'||record.month!==state.month)return;record.status='declined';save();mapContinue()}]]);return true;
 }
 window.RelationshipWork={register,current,managerNotice,coworkerCandidate,openCoworker};
})();

