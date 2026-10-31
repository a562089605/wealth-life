// Candidate profiles are generated once; the map card confirmation adds the friend.
(function(root){'use strict';
const AGE_OFFSETS=[-2,-1,0,2]; // Reuse the original game's acquaintance age offsets.
function prepare(s,{names,jobs,random=Math.random}){
 s.mapContactCandidates??=[];
 const known=new Set((s.people||[]).map(p=>p.id));
 const locked=new Set(Object.values(s.mapCards?.events||{}).filter(r=>r.status==='pending').map(r=>r.quote?.contact?.id).filter(Boolean));
 const pick=xs=>xs[Math.min(xs.length-1,Math.floor(random()*xs.length))];
 let available=s.mapContactCandidates.filter(p=>p.id&&p.name&&!known.has(p.id));
 if(!available.length){
  const usedNames=new Set((s.people||[]).map(p=>p.name)),unused=names.filter(n=>!usedNames.has(n));
  if(!names.length||!jobs.length)return null;
  const usedIds=new Set([...known,...s.mapContactCandidates.map(p=>p.id),...locked]);let id;
  do{id='pet-friend-'+(s.nextPetFriendId=(s.nextPetFriendId||0)+1)}while(usedIds.has(id));
  const p={id,name:pick(unused.length?unused:names)};
  const relationships=typeof module!=='undefined'&&module.exports?require('./relationship-rules.js'):root.RelationshipRules;
  if(relationships)relationships.initializeInterests(p,random);
  s.mapContactCandidates.push(p);available=[p];
 }
 for(const p of available){
  if(p.petContactProfileVersion===1||locked.has(p.id))continue;
  if(!['male','female'].includes(p.gender))p.gender=random()<.5?'female':'male';
  p.age=Math.max(18,Math.round(Number(s.age)||20)+pick(AGE_OFFSETS));
  p.job=jobs.length?pick(jobs):'小镇居民';
  Object.assign(p,{status:'养宠物的朋友',origin:'pet-social',city:p.city||s.city,life:'在宠物交流活动中认识',relation:10,petContactProfileVersion:1});
 }
 return available[0]||null;
}
const api={prepare};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MapPetContacts=api;
})(globalThis);

