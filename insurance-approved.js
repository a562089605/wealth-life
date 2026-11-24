(function(){
 'use strict';
 const art='./assets/insurance-approved/';
 const exactTitles={
  medical:'医疗保障选择',pet:'宠物保险',auto:'车险',home:'房险',
  enroll:'投保预览',premium:'支付本月保费',stop:'确认下月停保',claim:'房屋维修结算'
 };
 const month=()=> '第'+(Math.floor(state.month/12)+1)+'年 · 第'+(state.month%12+1)+'月';
 function frame(card,kind,title){
  const image=document.createElement('img');
  image.className='insurance-approved-frame';image.src=art+kind+'.webp';image.alt='';
  card.prepend(image);
  const date=document.createElement('p');
  date.className='insurance-approved-month';date.textContent=month();card.append(date);
  if(title!==exactTitles[kind]){
   const heading=document.createElement('p');
   heading.className='insurance-approved-title';heading.textContent=title;
   card.append(heading);
  }
 }
 function body(card){
  const content=document.createElement('div');
  content.className='insurance-approved-body';
  content.tabIndex=0;content.setAttribute('aria-label','保险明细，可上下滚动');
  card.append(content);
  return content;
 }
 function eventKind(type,title){
  if(title==='支付本月保费')return 'premium';
  if(type==='保险'&&title==='保险与保障')return 'enroll';
  if(title.startsWith('房屋维修结算'))return 'claim';
  if(!['医疗保险','车险','房险'].includes(type))return null;
  if(/停保|停止续保/.test(title))return 'stop';
  if(/预览|确认投保|确认下月切换|保费不足|未保存/.test(title))return 'enroll';
  return {医疗保险:'medical',车险:'auto',房险:'home'}[type];
 }
 let restore=null;
 const previous=showEvent;
 showEvent=function(type,title,...args){
  restore?.();restore=null;
  const result=previous.call(this,type,title,...args);
  const kind=eventKind(type,title);
  if(!kind||$('eventTitle').textContent!==title)return result;
  const card=$('eventTitle').closest('.event');
  card.classList.add('insurance-approved-card');
  frame(card,kind,title);
  const content=body(card);
  const moved=[$('eventDesc'),$('eventData'),$('actions')].map(node=>{
   const marker=document.createComment('insurance layout');
   node.before(marker);content.append(node);
   return [node,marker];
  });
  const last=$('actions').lastElementChild;
  const back=last?.textContent.startsWith('返回')?last:null;
  if(back){
   card.classList.add('insurance-approved-fixed-back');
   back.classList.add('insurance-approved-back');
   card.append(back);
  }
  restore=()=>{
   if(back){
    $('actions').append(back);
    back.classList.remove('insurance-approved-back');
   }
   moved.forEach(([node,marker])=>marker.replaceWith(node));
   card.classList.remove('insurance-approved-card','insurance-approved-fixed-back');
   card.querySelectorAll('.insurance-approved-frame,.insurance-approved-month,.insurance-approved-title').forEach(node=>node.remove());
   content.remove();
  };
  return result;
 };
 const previousClear=clearModals;
 clearModals=function(...args){
  restore?.();restore=null;
  return previousClear.apply(this,args);
 };
 window.InsuranceApproved={
  petBack(content,button){
   button.classList.add('insurance-approved-back');
   content.parentElement.classList.add('insurance-approved-fixed-back');
   content.parentElement.append(button);
  },
  pet(node,kind,title){
   const card=document.createElement('div');
   card.className='insurance-approved-card insurance-approved-pet';
   node.append(card);
   frame(card,kind,title);
   return body(card);
  }
 };
})();
