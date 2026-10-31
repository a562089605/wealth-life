// One monthly receipt per saved contact. Keep the former single receipt for old saves.
const SocialRecords=(()=>{
 function key(p){return p?.id!=null?'id:'+p.id:p?.name?'name:'+p.name:null;}
 function receiptKey(s,r){return r.personKey||key((s.people||[]).find(p=>p.id!=null&&p.id===r.person))||key((s.people||[]).find(p=>p.name===r.person))||'legacy:'+r.person;}
 function all(s){
  if(!s)return [];
  const rows=s.socialInteractions?.month===s.month?s.socialInteractions.receipts||[]:[],old=s.socialMonth?.month===s.month?s.socialMonth:null,result=[],seen=new Set();
  for(const r of [...rows,...(old?[old]:[])]){if(r.month!==s.month)continue;const k=receiptKey(s,r);if(seen.has(k))continue;seen.add(k);result.push(r);}return result;
 }
 function find(s,p){const rows=all(s);return p?rows.find(r=>receiptKey(s,r)===key(p))||null:rows[rows.length-1]||null;}
 function add(s,p,r){const rows=all(s);if(find(s,p))return false;r.personKey=key(p);s.socialInteractions={month:s.month,receipts:[...rows,r]};s.socialMonth=r;return true;}
 return {key,all,find,add};
})();
if(typeof module!=='undefined')module.exports=SocialRecords;
