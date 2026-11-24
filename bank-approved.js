(function(){
 'use strict';
 const card=$('eventTitle').closest('.event');
 const art='./assets/bank-loans/';
 function place(node,x,y,w,h){
  node.classList.add('bank-approved-slot');
  for(const [name,value] of Object.entries({x,y,w,h}))node.style.setProperty('--bank-'+name,value+'%');
 }
 function frame(kind){
  card.dataset.bankApproved=kind;
  const image=document.createElement('img');
  image.src=art+kind+'-approved.webp';image.className='bank-approved-frame';image.alt='';
  card.prepend(image);
 }
 function action(index,...box){place($('actions').children[index],...box);}
 const previous=showEvent;
 showEvent=function(...args){
  if(card.dataset.bankApproved==='repayment'){
   $('eventData').onscroll=null;
   $('eventData').removeAttribute('tabindex');
   $('eventData').removeAttribute('aria-label');
  }
  delete card.dataset.bankApproved;
  card.querySelector('.bank-approved-scroll-rail')?.remove();
  card.querySelector('.bank-approved-frame')?.remove();
  return previous.apply(this,args);
 };
 window.ApprovedBankCards={
  form(){
   frame('form');
   const form=$('wlLoanAmount').closest('.wl-loan-form');
   place($('wlLoanAmount').parentElement,60.5,38.2,29,4.8);
   place($('wlLoanRange'),20,44.5,60,4.3);
   place($('wlLoanYears'),61.5,53.3,28,4.3);
   for(const [i,id] of ['wlLoanApr','wlLoanPayment','wlLoanInterest'].entries())place($(id),65,62+5.7*i,25,4.8);
   for(const [direction,left,label] of [[-1,10,'減少貸款金額'],[1,82,'增加貸款金額']]){
    const button=document.createElement('button');
    button.type='button';button.className='bank-art-button';button.setAttribute('aria-label',label);
    button.onclick=()=>{
     const range=$('wlLoanRange');
     range.value=Math.max(0,Math.min(Number(range.max),Number(range.value)+direction*100));
     range.dispatchEvent(new Event('input'));
    };
    place(button,left,44,9,5.2);form.append(button);
   }
   form.querySelector('.wl-loan-rules').append($('wlLoanTiming'));
   action(0,16,81,68,8.4);
   action(1,20,90.6,60,7.4);
  },
  receipt(){
   frame('receipt');
   const fields=$('eventData').querySelectorAll('.stat .value');
   [[66,40,27,5.4],[66,51.4,26,4.7],[66,57.6,26,4.7],[66,64.1,26,4.7],[66,70.4,26,4.7]]
    .forEach((box,index)=>place(fields[index],...box));
   action(0,15,80.9,70,8.5);
   action(1,20,90.6,60,7.4);
  },
  repayment(){
   frame('repayment');
   const data=$('eventData');
   data.tabIndex=0;
   data.setAttribute('aria-label','贷款明细，可上下滚动');
   const scroller=document.createElement('div');
   scroller.className='bank-approved-scroll-rail';
   const thumb=document.createElement('span');scroller.append(thumb);
   scroller.setAttribute('aria-hidden','true');
   const update=()=>{
    const max=data.scrollHeight-data.clientHeight;
    scroller.hidden=max<=0;
    if(max>0){
     const fraction=Math.max(.09,data.clientHeight/data.scrollHeight);
     thumb.style.height=fraction*100+'%';
     thumb.style.top=(1-fraction)*data.scrollTop/max*100+'%';
    }
   };
   card.append(scroller);
   data.onscroll=update;
   requestAnimationFrame(update);
   const buttons=$('actions').children;
   if(buttons.length>1)action(0,18,83.8,64,4.1);
   action(buttons.length-1,18,88.1,65,7.9);
  }
 };
})();
