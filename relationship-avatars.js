// Approved portrait resources. Bind only within the existing whole-save transaction.
(function(root){'use strict';
 const roles=['manager','coworker','classmate','petfriend','landlord'];
 const catalog=roles.flatMap(role=>['female','male'].flatMap(gender=>Array.from({length:6},(_,i)=>{
  const id=role+'-'+gender+'-'+String(i+1).padStart(2,'0');
  return {id,role,gender,file:'assets/relationships/avatars/'+id+'.webp'};
 })));
 const byId=new Map(catalog.map(a=>[a.id,a]));
 function group(p){
  const label=root.RelationshipHomeRules?.role(p)||p.status;
  const role=roles.includes(p.relationshipRole)?p.relationshipRole:({'经理':'manager','上司':'manager','同事':'coworker','同学':'classmate','宠友':'petfriend','养宠物的朋友':'petfriend','房东':'landlord'})[label];
  const gender=({female:'female',male:'male','女':'female','男':'male'})[p.gender];
  return role&&gender?{role,gender}:null;
 }
 function used(s){return new Set([...(s.relationshipAvatars?.used||[]),...(s.people||[]).map(p=>p.relationshipAvatarId).filter(Boolean)]);}
 const candidates=(p,taken)=>{const g=group(p);return g?catalog.filter(a=>a.role===g.role&&a.gender===g.gender&&!taken.has(a.id)):[];};
 function needsSync(s){const taken=used(s);return (s.people||[]).some(p=>!p.relationshipAvatarId&&candidates(p,taken).length);}
 function sync(s,{random=Math.random}={}){
  const taken=used(s);let count=0;
  for(const p of s.people||[]){
   // Existing identities stay fixed, including unknown legacy bindings.
   if(p.relationshipAvatarId)continue;
   const pool=candidates(p,taken);if(!pool.length)continue;
   const n=random();if(!Number.isFinite(n)||n<0||n>=1)throw Error('invalid portrait choice');
   p.relationshipAvatarId=pool[Math.floor(n*pool.length)].id;taken.add(p.relationshipAvatarId);count++;
  }
  if(count)s.relationshipAvatars={...(s.relationshipAvatars||{}),version:1,used:[...taken]};
  return count;
 }
 const portrait=p=>byId.get(p.relationshipAvatarId)||null;
 const api={catalog,group,needsSync,sync,portrait};root.RelationshipAvatars=api;
 if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
