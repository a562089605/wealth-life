// Confirmed house relationship rules. No map selector or probability is introduced here.
(function(root){'use strict';
 const copy=x=>JSON.parse(JSON.stringify(x)),clamp=n=>Math.max(0,Math.min(100,n));
 const plans={chat:{cost:0,hours:1,min:0},walk:{cost:0,hours:1,min:0},meal:{cost:45,hours:2,min:21},visit:{cost:30,hours:3,min:51}};
 const stage=p=>{const n=Number.isFinite(p.relation)?p.relation:0;return n<15?'认识':n<30?'熟人':n<50?'普通朋友':n<70?'较好朋友':n<88?'好朋友':'挚友';};
 const role=p=>p.relationshipRole==='teacher'?'教师':p.relationshipRole==='manager'||p.houseRole==='manager'||['经理','上司'].includes(p.status)?'经理':p.relationshipRole==='landlord'||p.houseRole==='landlord'||p.status==='房东'?'房东':p.relationshipRole==='classmate'?'同学':p.relationshipRole==='coworker'?'同事':p.origin==='pet-social'||p.status==='养宠物的朋友'||p.status==='宠友'?'宠友':p.status||'认识的人';
 const identity=p=>JSON.stringify([p.id,p.name,p.origin,p.relationshipRole||p.houseRole]);
 function data(s){return s.relationshipHome??={version:1,startedMonth:s.month,sequence:0,actions:[],settlements:{},managers:{}};}
 function workKey(job){return /咖啡师|值班主管|Barista|Shift Lead|店长|Store Manager|合伙人|Partner/i.test(job||'')?'coffee':job;}
 function education(p,careers){const job=p.job||p.sourceJob||'',exact=careers.find(c=>c.name===job);if(exact?.edu)return exact.edu;if(/医生|医师|兽医|律师|牙医|药剂师/.test(job))return 'professional';if(/教授|研究员/.test(job))return 'master';if(/教师|老师|护士|工程师|开发|会计|项目经理/.test(job))return 'bachelor';if(/技师|技术员|设计|剪辑/.test(job))return 'associate';return 'highschool';}
 function sync(s,{makePerson,careers=[]}={}){
  const d=data(s);s.people??=[];d.managers??={};
  let serial=0;for(const p of s.people)if(p.id==null){do{serial++;}while(s.people.some(q=>q.id==='relationship-legacy-'+serial));p.id='relationship-legacy-'+serial;}
  if(s.relationshipNewGame){delete s.relationshipNewGame;s.schoolNetworkVersion=1;}
  if(s.job&&!s.retired&&!s.unemployedMonths){const k=workKey(s.job);let manager=s.people.find(p=>p.id===d.managers[k]);
   if(!manager)manager=s.people.find(p=>role(p)==='经理'&&workKey(p.sourceJob||p.job)===k);
   if(!manager&&makePerson){manager=makePerson('manager');s.people.push(manager);}
   if(manager&&k==='coffee'){manager.supervisorTitle=/店长|Store Manager|合伙人|Partner/i.test(s.job)?'老板':'经理';}
   if(manager){d.managers[k]=manager.id;d.currentManagerId=manager.id;d.currentWorkKey=k;}
  }else{delete d.currentManagerId;delete d.currentWorkKey;}
  const rented=['shared','studio','rent1'].includes(s.housing),lease=s.housingLease;
  if(rented){const k=JSON.stringify([lease?.key||s.housing,lease?.startMonth??null]);if(k!==d.leaseKey){d.leaseKey=k;d.rentStarted=Number.isInteger(lease?.startMonth)?lease.startMonth:s.month;delete d.landlordId;}
   if(s.month>=Math.max(1,d.rentStarted+1)&&!d.landlordId&&makePerson){const p=makePerson('landlord');s.people.push(p);d.landlordId=p.id;}
  }else{delete d.leaseKey;delete d.rentStarted;delete d.landlordId;}
  for(const p of s.people){if(![p.education,p.educationLevel].some(x=>typeof x==='string'&&x.trim())){p.education=education(p,careers);p.educationSource='occupation-background-v1';}}
  // Mark existing map exchanges only after a real same-month change is saved; viewing is not contact.
  if(d.observed?.month===s.month&&s.townMode){for(const p of s.people){const old=d.observed.people.find(x=>x.id===p.id);if(!old||old.relation!==p.relation)p.lastContactMonth=s.month;}}
  d.observed={month:s.month,people:s.people.map(p=>({id:p.id,relation:p.relation}))};return s;
 }
 function hours(s){return (s.relationshipHome?.actions||[]).filter(r=>r.month===s.month).reduce((n,r)=>n+r.hours,0);}
 function contacted(s,p,month){return [p.lastContactMonth,p.lastInteractionMonth,p.metMonth].includes(month)||(s.relationshipHome?.actions||[]).some(r=>r.month===month&&r.people.includes(identity(p)))||(s.socialMonth?.month===month&&[p.id,p.name].includes(s.socialMonth.person));}
 function quote(s,kind,ids,{free,recovery=false}={}){
  const plan=kind==='teacherChat'?{cost:0,hours:1,min:0}:plans[kind],people=ids.map(id=>(s.people||[]).find(p=>identity(p)===id)),n=people.length;
  const q={kind,people:[...ids],hours:plan?.hours||0,cost:plan?plan.cost*(kind==='visit'?n:1):0,energy:2*n};const fail=reason=>({...q,ok:false,reason});
  if(!plan||!n||n>(kind==='visit'?5:1)||new Set(ids).size!==n||people.some(p=>!p))return fail('请选择有效联系人');
  if(kind==='teacherChat'&&(people.some(p=>p.relationshipRole!=='teacher')||(s.relationshipHome?.actions||[]).some(r=>r.month===s.month&&r.kind===kind&&r.people.some(id=>ids.includes(id)))))return fail('本月已与这位教师聊过');
  if(kind!=='teacherChat'&&people.some(p=>p?.relationshipRole==='teacher'))return fail('请使用教师聊天');
  if(people.some(p=>!Number.isFinite(p.relation)||p.relation<plan.min))return fail('亲密度暂不足');
  if(recovery)return fail('康复月暂不能安排');if(!Number.isFinite(s.health)||s.health<30)return fail('健康需达到30');
  if(kind==='visit'&&(!s.housing||s.housing==='unselected'))return fail('请先确认入住住房');
  if(!Number.isFinite(s.cash)||s.cash<q.cost)return fail('现金不足');if(!Number.isFinite(free)||free<q.hours)return fail('自由时间不足');
  if(!Number.isFinite(s.energy)||s.energy<q.energy)return fail('能量不足');return {...q,ok:true};
 }
 const token=(s,kind,ids)=>JSON.stringify([s.month,kind,ids,s.relationshipHome?.sequence||0]);
 function confirm(s,kind,ids,expected,{free,recovery=false,outcome,save}){
  if(token(s,kind,ids)!==expected)return {ok:false,reason:'页面已过期，请重新打开'};const q=quote(s,kind,ids,{free,recovery});if(!q.ok)return q;
  const before=copy(s);try{const outcomes=ids.map(id=>{const p=s.people.find(p=>identity(p)===id);return {...(kind==='teacherChat'?{scene:p.teacherLabel==='导师'?'与导师聊聊':'与老师聊聊',success:true,gain:2,happiness:0}:outcome(p)),person:id,name:p.name};});if(outcomes.some(o=>!Number.isFinite(o.gain)||!Number.isFinite(o.happiness)))throw Error('invalid outcome');
   const d=data(s),id='relationship-home-'+(++d.sequence),happy=s.happiness;s.cash=Math.round((s.cash-q.cost)*100)/100;s.energy=clamp(s.energy-q.energy);s.happiness=clamp(s.happiness+outcomes.reduce((n,o)=>n+o.happiness,0));
   for(const o of outcomes){const p=s.people.find(p=>identity(p)===o.person),prior=p.relation;p.relation=clamp(prior+o.gain);o.appliedGain=Math.round((p.relation-prior)*100)/100;p.lastContactMonth=s.month;}
   const receipt={id,month:s.month,...q,outcomes,happinessChange:s.happiness-happy};d.actions.push(receipt);if(q.cost)(s.financeLedger??=[]).push({kind:kind==='visit'?'socialVisit':'socialMeal',source:'relationshipHome',month:s.month,amount:q.cost,eventId:id});
   if(save()===false)throw Error('save failed');return {ok:true,receipt};
  }catch(e){for(const k of Object.keys(s))delete s[k];Object.assign(s,before);return {ok:false,reason:'保存失败，本次互动未结算，请重试'};}
 }
 function settle(s,month){if(month!==s.month)return [];const d=data(s);if(d.settlements[month])return [];const rows=[];for(const p of s.people||[]){if(!Number.isFinite(p.relation))continue;const before=p.relation,kept=contacted(s,p,month);p.relation=clamp(before-(kept?0:1));rows.push({person:p.id,before,after:p.relation,contacted:kept});}d.settlements[month]=rows;return rows;}
 const api={plans,data,identity,stage,role,sync,hours,quote,token,confirm,settle,contacted,workKey};root.RelationshipHomeRules=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
