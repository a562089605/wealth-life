// Confirmed 2026-11-13 activities; career progression remains independent.
(function(root){'use strict';
 const thresholds=[0,50,150,300,500,800],clamp=n=>Math.max(0,Math.min(100,n));
 const activities={
  tasting:{name:'咖啡品鉴',kind:'hobby',cost:30,hours:2,energy:1,xp:10,happiness:4,stress:-4,art:'coffee-tasting-10xp-confirmed',action:'参加品鉴',description:'尝试不同的咖啡，认识香气、酸甜与口感。'},
  baking:{name:'烘焙',kind:'hobby',cost:45,hours:3,energy:2,xp:10,happiness:4,stress:-4,art:'baking-confirmed',action:'开始烘焙',description:'亲手制作饼干、蛋糕或面包，享受揉面与烘烤的乐趣。'},
  photography:{name:'摄影',kind:'hobby',cost:20,hours:2,energy:1,xp:10,happiness:4,stress:-4,art:'photography-confirmed',action:'开始摄影',description:'记录咖啡、甜点与街景，发现光线与构图的乐趣。'},
  drawing:{name:'绘画',kind:'hobby',cost:25,hours:2,energy:1,xp:10,happiness:4,stress:-4,art:'drawing-confirmed',action:'开始绘画',description:'画下咖啡、甜点与店内一角，享受线条与色彩的乐趣。'},
  latte:{name:'拉花',kind:'specialist',cost:40,hours:2,energy:2,xp:10,happiness:0,stress:0,art:'latte-art-confirmed',action:'开始练习',description:'练习奶泡与注奶，让一杯咖啡开出心形。'},
  pourOver:{name:'手冲咖啡',kind:'specialist',cost:35,hours:2,energy:2,xp:10,happiness:0,stress:0,art:'pour-over-confirmed',action:'开始练习',description:'练习研磨、水温与注水，找到一杯咖啡的好风味。'}
 };
 const hobbies=Object.keys(activities).filter(id=>activities[id].kind==='hobby');
 const copy=x=>JSON.parse(JSON.stringify(x));
 const level=xp=>thresholds.reduce((lv,t,i)=>xp>=t?i:lv,0);
 function xp(s,id){const a=activities[id],saved=s.hobbyLearning?.xp?.[id];if(Number.isFinite(saved))return saved;
  // Preserve same-name legacy experience without rewriting its original fields.
  const legacy=a?.kind==='hobby'?s.hobbyXP?.[a.name]:0;return Number.isFinite(legacy)&&legacy>=0?legacy:0;
 }
 const hours=s=>(s.hobbyLearning?.receipts||[]).filter(r=>r.month===s.month).reduce((n,r)=>n+r.hours,0);
 const token=(s,id)=>JSON.stringify([s.month,id,s.hobbyLearning?.sequence||0,xp(s,id)]);
 function quote(s,id,{free=0,reserve=0,recovery=false}={}){const a=activities[id],fail=reason=>({ok:false,reason});
  if(!a)return fail('activity');if(xp(s,id)>=800)return fail('max');
  if(recovery||!Number.isFinite(s.health)||s.health<30)return fail('recovery');
  if(!Number.isFinite(s.cash)||s.cash<a.cost)return fail('funds');
  if(!Number.isFinite(free)||free<a.hours||free-a.hours<reserve)return fail('time');
  if(!Number.isFinite(s.energy)||s.energy<a.energy)return fail('energy');
  return {ok:true,...a,id,gain:Math.min(a.xp,800-xp(s,id))};
 }
 function confirm(s,id,expected,opts){if(expected!==token(s,id))return {ok:false,reason:'stale'};const q=quote(s,id,opts);if(!q.ok)return q;
  if(typeof opts?.save!=='function')return {ok:false,reason:'save'};
  const before=copy(s);try{const d=s.hobbyLearning??={version:1,xp:{},sequence:0,receipts:[]};
   const receipt={id:'hobby-learning-'+(++d.sequence),activity:id,name:q.name,kind:q.kind,month:s.month,cost:q.cost,hours:q.hours,energy:q.energy,xp:q.gain};
   d.xp[id]=xp(s,id)+q.gain;s.cash=Math.round((s.cash-q.cost)*100)/100;s.energy=clamp(s.energy-q.energy);
   s.happiness=clamp(s.happiness+q.happiness);s.stress=clamp(s.stress+q.stress);d.receipts.push(receipt);
   (s.financeLedger??=[]).push({id:receipt.id,kind:q.kind==='hobby'?'hobbyPractice':'specialistPractice',hobby:q.name,month:s.month,amount:q.cost});
   if(opts.save()===false)throw Error('save');return {ok:true,receipt};
  }catch(e){for(const k of Object.keys(s))delete s[k];Object.assign(s,before);return {ok:false,reason:'save'};}
 }
 const hasInterests=p=>p.interestProfile!=null||p.interests!=null||p.hobbies!=null||p.hobbyXP!=null;
 function generate(p,random=Math.random){if(hasInterests(p))return false;
  const draw=()=>{const n=random();if(!Number.isFinite(n)||n<0||n>=1)throw Error('invalid interest draw');return n;};
  const count=draw()<.5?1:2,pool=[...hobbies],skills={};
  const spans=[[0,49],[50,149],[150,299],[300,499],[500,799],[800,800]],edges=[.10,.35,.65,.85,.95,1];
  for(let i=0;i<count;i++){const id=pool.splice(Math.floor(draw()*pool.length),1)[0],n=draw(),lv=edges.findIndex(e=>n<e),[lo,hi]=spans[lv];skills[activities[id].name]=lo+Math.floor(draw()*(hi-lo+1));}
  p.interestProfile={version:2,skills};return true;
 }
 function pendingPerson(s){return s.town?.movement?.relationshipLifeCard?.newClassmate;}
 function syncNewContacts(s,prior,{random=Math.random}={}){
  const old=[...(prior?.people||[]),pendingPerson(prior||{})].filter(Boolean),wasKnown=p=>old.some(q=>(p.id!=null&&q.id===p.id)||(q.id==null&&q.name===p.name&&q.origin===p.origin));
  for(const p of [...(s.people||[]),pendingPerson(s)].filter(Boolean))if(!wasKnown(p))generate(p,random);
 }
 function interestRows(p){
  if(p.interestProfile?.skills)return Object.entries(p.interestProfile.skills).map(([name,n])=>({name,xp:Number.isFinite(n)?n:null,level:Number.isFinite(n)?p.interestProfile.version===2?level(n):Math.floor(n/100):null}));
  const old=p.interests??p.hobbies,names=Array.isArray(old)?old:typeof old==='string'?[old]:old&&typeof old==='object'?Object.keys(old):Object.keys(p.hobbyXP||{});
  return names.filter(n=>typeof n==='string').map(name=>{const n=p.hobbyXP?.[name],stored=old&&!Array.isArray(old)&&typeof old==='object'?old[name]:null;return {name,xp:Number.isFinite(n)?n:null,level:Number.isFinite(n)?Math.floor(n/100):Number.isFinite(stored)?stored:null};});
 }
 const api={activities,hobbies,thresholds,level,xp,hours,token,quote,confirm,generate,syncNewContacts,interestRows};root.HobbyLearning=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
