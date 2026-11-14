// Conditional selection only: caller must not use this to decide map trigger odds.
(function(root){'use strict';
 const D=root.SharedInterestCardData||(typeof require==='function'?require('./shared-interest-card-data'):null);
 const H=root.HobbyLearning||(typeof require==='function'?require('./hobby-learning'):null);
 const copy=x=>JSON.parse(JSON.stringify(x));
 const used=(s,pid,id)=>(s.sharedInterestCards?.used||[]).some(r=>r.personId===pid&&r.kind===id);
 function groups(s){
  return H.hobbies.flatMap(hobby=>{
   if(H.xp(s,hobby)<50)return [];
   const name=H.activities[hobby].name;
   const people=(s.people||[]).filter(p=>p.id!=null&&H.interestRows(p).some(r=>r.name===name)).flatMap(p=>{
    const cards=D.cards.filter(c=>c.hobby===hobby&&!used(s,p.id,c.id));
    return cards.length?[{personId:p.id,cards}]:[];
   });
   return people.length?[{hobby,people}]:[];
  });
 }
 function choose(s,random=Math.random){
  const pick=xs=>{const n=random();if(!Number.isFinite(n)||n<0||n>=1)throw Error('invalid random');return xs[Math.floor(n*xs.length)];};
  const pool=groups(s);if(!pool.length)return null;
  const group=pick(pool),person=pick(group.people),card=pick(person.cards);
  return copy({hobby:group.hobby,personId:person.personId,card});
 }
 // Pure quote snapshot; reserve/settlement integration must persist it atomically.
 function options(s,card){const gain=Math.max(0,800-H.xp(s,card.hobby));return card.options.map(q=>({...copy(q),effects:{...q.effects,...(q.effects.xp?{xp:Math.min(q.effects.xp,gain)}:{})}}));}
 const api={groups,choose,options,used};root.SharedInterestSelection=api;
 if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
