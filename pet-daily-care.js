// A small visual menu over the original due dates, quotes, payment ledger and care history.
(function(){
 const legacyCare=openPetCare;
 let selectedId=null,previewToken=null;
 const monthText=n=>'第'+(Math.floor(n/12)+1)+'年 · 第'+(n%12+1)+'月';
 const petId=p=>p.id||p.careId;
 const label=(p,method)=>['dog','cat'].includes(petCareSpecies(p))?(method==='self'?'自己洗澡':'外出洗澡'):(method==='self'?'自行清洁':'专业清洁');
 const icon=method=>method==='self'?'<svg viewBox="0 0 100 78" aria-hidden="true"><path d="M13 39h74l-7 23H22zM25 63l-3 8m53-8 3 8M22 38V21q0-11 12-10h9v8h-9v19"/><path d="M45 37q-6-13 5-17l4 6 7-6q13 4 7 17M51 32h1m10 0h1"/><circle cx="78" cy="14" r="5"/><circle cx="87" cy="26" r="3"/></svg>':'<svg viewBox="0 0 100 78" aria-hidden="true"><path d="M15 30l8-18h55l8 18M19 31v39h63V31M37 70V47h26v23M13 31h74M24 13v18m17-18v18m18-18v18m17-18v18"/><path d="M36 38q4 6 8 0m12 0q4 6 8 0"/></svg>';
 function currentPet(){const pets=ensurePetCare(state);return pets.find(p=>petId(p)===selectedId)||pets[0]}
 function cleanTask(p){return petCareTasks().find(t=>!t.unsupported&&t.pet===p&&t.kind==='Clean')}
 function previewBath(p,method){
  const rule=PET_CARE_RULES[petCareSpecies(p)],task=cleanTask(p),owner=state,month=state.month,recovery=isRecoveryMonth(state);
  const q=task?petCareQuote(state,{[task.key]:method}):{cost:roundCash(rule[method]*(state.cpiIndex||100)/100),hours:recovery?0:rule[method+'Hours']};
  const ready=!!task&&!q.blocked&&!(recovery&&method==='self');
  const token={};let paid=false;
  showEvent('宠物日常照顾',label(p,method),!task?'现在还不用洗，下次时间是'+monthText(p.care.nextClean)+'。这里只查看，不会扣款。':recovery?'康复期间由专业机构代为清洁，不占本人时间。':'为'+(p.name||rule.name)+'安排本次清洁。确认后才扣款并计入时间。',[
   ['涉及宠物',p.name||rule.name],['本次费用',priceText(q.cost||0)],['自由时间',(q.hours||0)>0?'减少 '+q.hours+' 小时':'不减少'],['下次洗澡',monthText(state.month+rule[method+'Months'])]
  ],[['确认'+label(p,method),()=>{
   if(paid||state!==owner||state.month!==month||previewToken!==token||!document.querySelector('.event-active'))return;
   const actual=cleanTask(p);if(!actual||actual.key!==task?.key)return openPetCare();
   const fresh=petCareQuote(state,{[actual.key]:method});if(fresh.blocked||fresh.cost!==q.cost||fresh.hours!==q.hours)return previewBath(p,method);
   if(payPetCare({[actual.key]:method}))paid=true;
  },true,!ready||state.cash<(q.cost||0)||currentCareerTime().free<(q.hours||0)],['返回日常照顾',openPetCare,false]]);
  previewToken=token;
 }
 openPetCare=function(){
  const pets=ensurePetCare(state);if(!pets.length)return openPetAdoptions();
  const p=currentPet(),rule=PET_CARE_RULES[petCareSpecies(p)];if(!rule)return legacyCare();
  selectedId=petId(p);const due=!!cleanTask(p),recovery=isRecoveryMonth(state);
  const annualDue=petCareTasks().some(t=>t.kind==='Annual');
  showEvent('宠物日常照顾','宠物日常照顾','选一种照顾方式，查看后再确认。',[],[
   ...(annualDue?[['查看已到期的年度体检',legacyCare,false]]:[]),['返回我的宠物',openPetHub,false]
  ]);
  if($('eventTitle').textContent!=='宠物日常照顾')return;
  $('eventTitle').closest('.event').classList.add('pet-care-painted');
  const panel=document.createElement('div');panel.className='pet-care-simple';
  const note=due?'现在可以安排清洁。':((p.care.history||[]).some(h=>h.kind==='Clean')?'已完成上次清洁。':'首次清洁已包含。')+'下次时间：'+monthText(p.care.nextClean)+'。';
  panel.innerHTML='<div class="pet-care-pet">'+(petCareSpecies(p)==='dog'?'<div class="pet-care-portrait"><img src="assets/career/pet-corgi-adoption.webp" alt="柯基插画"></div>':'<span class="pet-care-paw" aria-hidden="true">✿</span>')+'<div><strong class="pet-care-name"></strong><p>'+note+'</p></div></div><div class="pet-care-choices"></div>';
  panel.querySelector('.pet-care-name').textContent=p.name||rule.name;
  if(pets.length>1){const select=document.createElement('select');select.setAttribute('aria-label','选择要照顾的宠物');for(const pet of pets){const option=document.createElement('option');option.value=petId(pet);option.textContent=pet.name||pet.type;option.selected=pet===p;select.append(option)}select.onchange=()=>{selectedId=select.value;openPetCare()};panel.prepend(select)}
  const owner=state,month=state.month;
  for(const method of ['self','pro']){
   const b=document.createElement('button');b.type='button';b.className='pet-care-square '+method;b.setAttribute('aria-label',label(p,method));
   const cost=roundCash(rule[method]*(state.cpiIndex||100)/100),hours=recovery?0:rule[method+'Hours'];
   b.innerHTML=icon(method)+'<strong>'+label(p,method)+'</strong><span>费用：'+priceText(cost)+'</span><span class="pet-care-time">'+(hours>0?'自由时间减少 '+hours+' 小时':'不消耗自由时间')+'</span><small>洗完后，隔 '+rule[method+'Months']+' 个月再洗</small>';
   b.disabled=recovery&&method==='self';b.onclick=()=>{if(state===owner&&state.month===month&&panel.isConnected)previewBath(p,method)};panel.querySelector('.pet-care-choices').append(b);
  }
  if(recovery){const note=document.createElement('p');note.className='pet-care-recovery';note.textContent='康复期间请选择专业照顾，由机构代为处理。';panel.append(note)}
  $('eventData').replaceChildren(panel);$('eventData').style.display='block';
 };
 const showBefore=showEvent;
 showEvent=function(...args){previewToken=null;document.querySelector('.pet-care-painted')?.classList.remove('pet-care-painted');return showBefore(...args)};
})();
