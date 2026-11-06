// Individual payment of existing monthly pet basics; preserve aggregate living receipts and prepaid adoption months.
(function(root){'use strict';
 const copy=s=>JSON.parse(JSON.stringify(s)),money=x=>Math.round(x*100)/100;
 const price=(p,prices)=>prices[p.type]??prices[p.species];
 function quote(s,index,{prices,nonPetLiving}){const p=s.pets?.[index],fee=p&&price(p,prices);if(!p||!Number.isFinite(fee)||fee<0||!Number.isFinite(nonPetLiving))return null;
  const paid=s.monthlyPayments?.month===s.month?s.monthlyPayments.living||0:0;
  let credit=Math.max(0,paid-nonPetLiving),covered=0;
  for(let i=0;i<=index;i++){const pet=s.pets[i];if(pet.basicFeePaidMonth===s.month)continue;const amount=price(pet,prices)||0;const used=Math.min(amount,Math.max(0,credit));if(i===index)covered=used;credit-=amount;}
  const prepaid=p.basicFeePaidMonth===s.month,due=prepaid?0:money(Math.max(0,fee-covered));
  const token=JSON.stringify([s.month,index,paid,nonPetLiving,s.pets.map(x=>[x.id,x.careId,x.type,x.species,x.name,x.adoptMonth,x.basicFeePaidMonth,price(x,prices)])]);
  return {month:s.month,index,fee,due,covered:prepaid?0:covered,prepaid,token};
 }
 function confirm(s,index,token,options,save){const q=quote(s,index,options);if(!q||q.token!==token||q.due<=0)return {ok:false,reason:'stale'};if(s.cash<q.due)return {ok:false,reason:'cash'};const before=copy(s);
  try{s.cash=money(s.cash-q.due);if(q.covered)s.monthlyPayments.living=money(s.monthlyPayments.living-q.covered);const p=s.pets[index];p.basicFeePaidMonth=s.month;
   (s.financeLedger??=[]).push({kind:'livingPayment',source:'petBasicFee',month:s.month,amount:q.due,species:p.species,petIndex:index,petName:p.name});if(save()===false)throw Error('save failed');return {ok:true,quote:q};
  }catch(e){for(const k of Object.keys(s))delete s[k];Object.assign(s,before);return {ok:false,reason:'save'};}
 }
 const api={quote,confirm};root.PetBasicFees=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
