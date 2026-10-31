// Three confirmed legacy-pet groups; migrate metadata without recreating adoption or financial history.
(function(root){'use strict';
const money=n=>Math.round((Number(n)||0)*100)/100;
function combinedActive(s){const p=s.insurance?.pet;return !!(p?.active&&(!Number.isInteger(p.startMonth)||p.startMonth<=s.month));}
function migrate(s,{rules,aliases,monthly}){if(!s?.pets?.length)return;const used=new Set(s.pets.flatMap(p=>[p.id,p.careId]).filter(x=>x!=null));for(const k of Object.keys(s.insurance||{}))if(k.startsWith('pet:'))used.add(k.slice(4));
 const id=()=>{let next;do{next='legacy-pet-'+(s.nextLegacyPetId=(s.nextLegacyPetId||0)+1)}while(used.has(next));used.add(next);return next;};
 for(const p of s.pets){if(p.petRulesVersion===1)continue;
  if(!p.id){p.id=p.careId&&!s.pets.some(x=>x!==p&&x.id===p.careId)?p.careId:id();used.add(p.id);}if(!p.careId)p.careId=p.id;
  if(p.legacyPetMonthly==null)p.legacyPetMonthly=money(monthly(p));
  if(!p.insuranceKey){const matches=Object.entries(s.insurance||{}).filter(([k,x])=>k!=='pet'&&x?.petId===p.id);p.insuranceKey=matches.length===1?matches[0][0]:'pet:'+p.id;}
  const sp=rules[p.species]?p.species:aliases[p.type];if(sp&&rules[sp]){if(!p.species)p.species=sp;p.legacySpeciesPending=false;p.care??={};
   // Existing deadlines/history are authoritative. Only missing dates start from this upgrade month.
   if(!Number.isInteger(p.care.nextAnnual))p.care.nextAnnual=s.month+12;
   if(!Number.isInteger(p.care.nextClean))p.care.nextClean=s.month+rules[sp].selfMonths;
   p.care.history??=[];
  }else p.legacySpeciesPending=true;
  if(!Number.isInteger(p.adoptMonth))p.legacyAdoptionUnknown=true;
  p.legacyPetVersion=1;p.legacyMigrationMonth??=s.month;
  // Preserve an old unactivated request for review; do not auto-create an overlapping policy later.
  if(combinedActive(s)&&p.policyChange?.active&&!s.insurance?.[p.insuranceKey]?.active){(p.legacyHeldPolicyChanges??=[]).push({...p.policyChange});delete p.policyChange;}
 }
}
function resolveSpecies(s,id,sp,rules){const p=s.pets?.find(p=>p.id===id);if(s.gameOver||!p?.legacySpeciesPending||!rules[sp])return false;p.legacyOriginalSpecies??=p.species??null;p.species=sp;p.legacySpeciesPending=false;p.care??={};if(!Number.isInteger(p.care.nextAnnual))p.care.nextAnnual=s.month+12;if(!Number.isInteger(p.care.nextClean))p.care.nextClean=s.month+rules[sp].selfMonths;p.care.history??=[];return true;}
function overlaps(s){return combinedActive(s)?Object.entries(s.insurance||{}).filter(([k,p])=>k!=='pet'&&p?.active&&(k.startsWith('pet:')||p.petId!=null)).map(([key])=>key):[];}
const api={combinedActive,migrate,resolveSpecies,overlaps};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.LegacyPetRules=api;
})(globalThis);
