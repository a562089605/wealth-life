// Owned-pet board based on the archived illustrated layout. Domain billing remains canonical.
(function(){
 const emptyHub=openPetHub;
 const monthText=n=>'第'+(Math.floor(n/12)+1)+'年 · 第'+(n%12+1)+'月';
 const id=p=>p.id||p.careId;
 const methodName=(p,m)=>['dog','cat'].includes(petCareSpecies(p))?(m==='self'?'自己洗澡':'外出洗澡'):(m==='self'?'自行清洁':'专业清洁');
 function portrait(p){return '<div class="pet-owned-portrait">'+PetArt.portrait(petCareSpecies(p))+'</div>'}
 function renamePet(p){
  const owner=state,month=state.month;let input,done=false;
  showEvent('宠物取名','修改名字','只修改这只宠物的名字，不收费。',[],[['保存名字',()=>{
   if(done||state!==owner||state.month!==month||!(state.pets||[]).includes(p)||$('ownedPetName')!==input)return;
   const name=input.value.trim();if(!name||name.length>40)return;done=true;p.name=name;
   const policy=state.insurance?.[p.insuranceKey];if(policy)policy.name=name+' · 宠物保险';save();openPetHub();
  },true],['返回我的宠物',openPetHub,false]]);
  const label=document.createElement('label');label.textContent='宠物名字';input=document.createElement('input');input.id='ownedPetName';input.maxLength=40;input.value=p.name||'';input.setAttribute('aria-label','宠物名字');label.append(input);$('eventData').append(label);$('eventData').style.display='block';
 }
 openPetHub=function(){
  if(!(state.pets||[]).length)return emptyHub();
  syncFinance();const pets=ensurePetCare(state),tasks=petCareTasks(),owner=state,month=state.month;
  if(state.petCareDraft?.month!==month)state.petCareDraft={month,selections:{}};
  const draft=state.petCareDraft.selections??={},recovery=isRecoveryMonth(state);
  const validKeys=new Set(tasks.map(t=>t.key));for(const key of Object.keys(draft))if(!validKeys.has(key))delete draft[key];
  const q=petCareQuote(state,draft),frozen=JSON.stringify({cost:q.cost,hours:q.hours,keys:(q.rows||[]).map(r=>[r.key,r.method])});let paid=false;
  showEvent('宠物管理','我的宠物','',[],[
   ['确认支付已选照顾',()=>{
    if(paid||state!==owner||state.month!==month||!document.querySelector('.pet-owned-painted'))return;
    const fresh=petCareQuote(state,draft),now=JSON.stringify({cost:fresh.cost,hours:fresh.hours,keys:(fresh.rows||[]).map(r=>[r.key,r.method])});
    if(now!==frozen||fresh.blocked)return openPetHub();
    if(payPetCare(draft)){paid=true;openPetHub()}
   },true,!!q.blocked||!q.rows?.length],['返回房屋',townHome,false]
  ]);
  if($('eventTitle').textContent!=='我的宠物')return;
  $('eventTitle').closest('.event').classList.add('pet-owned-painted');
  const board=document.createElement('div');board.className='pet-owned-board';
  const home=document.createElement('button');home.type='button';home.className='pet-owned-home';home.textContent='‹';home.setAttribute('aria-label','返回房屋');home.onclick=townHome;$('eventTitle').before(home);
  const cash=document.createElement('div');cash.className='pet-owned-cash';const date=document.createElement('span');date.textContent=monthText(month);const amount=document.createElement('strong');amount.textContent='当前现金 '+priceText(state.cash);cash.append(date,amount);board.append(cash);
  let monthly=petMonthly()+(state.insurance?.pet?.active?(Number(state.insurance.pet.monthly)||0):0),paidCare=0;
  for(const p of pets){
   const sp=petCareSpecies(p),cfg=PET_ADOPTION[sp],rule=PET_CARE_RULES[sp];
   if(!cfg||!rule){const note=document.createElement('p');note.textContent=(p.name||p.type)+'：旧记录需核对';board.append(note);continue;}
   const factor=(state.cpiIndex||100)/100,modern=p.petRulesVersion===1;
   const deworm=modern&&state.month!==p.adoptMonth?roundCash(cfg.deworm*factor):0;
   const recurring=petIndividualMonthly(p),base=modern?roundCash(recurring-deworm):recurring;
   const policy=state.insurance?.[p.insuranceKey],insured=!!policy?.active&&(!Number.isInteger(policy.startMonth)||policy.startMonth<=month),premium=insured?policy.monthly||0:0;
   monthly+=premium;
   paidCare+=(p.care?.history||[]).filter(h=>h.month===month&&['Annual','Clean'].includes(h.kind)).reduce((n,h)=>n+(h.cost||0),0);
   const clean=tasks.find(t=>t.pet===p&&t.kind==='Clean'),annual=tasks.find(t=>t.pet===p&&t.kind==='Annual');
   const article=document.createElement('article');article.className='pet-owned-card';article.innerHTML=portrait(p)+'<div class="pet-owned-details"><div class="pet-owned-name"></div><dl><div><dt>基础养护</dt><dd>'+priceText(base)+'</dd></div>'+(cfg.deworm?'<div><dt>驱虫护理</dt><dd>'+(modern&&month===p.adoptMonth?'本月已包含':modern?priceText(deworm):'沿旧记录')+'</dd></div>':'')+'<div><dt>宠物保险</dt><dd>'+priceText(premium)+'</dd></div></dl><div class="pet-owned-policy"></div><button class="pet-owned-care-link" type="button">清洁护理 ›</button><div class="pet-owned-methods"></div><p class="pet-owned-due '+(clean?'due':'')+'">'+(clean?'本次清洁已到期':'下次清洁：'+monthText(p.care.nextClean))+'</p></div><div class="pet-owned-annual"></div>';
   const name=document.createElement('strong');name.textContent=(p.name||rule.name)+' · '+rule.name;article.querySelector('.pet-owned-name').append(name);
   const pencil=document.createElement('button');pencil.type='button';pencil.className='pet-owned-rename';pencil.textContent='✎';pencil.setAttribute('aria-label','修改'+(p.name||rule.name)+'的名字');pencil.onclick=()=>renamePet(p);article.querySelector('.pet-owned-name').append(pencil);
   const policyButton=document.createElement('button');policyButton.type='button';policyButton.textContent=insured?'医疗赔付 '+Math.round((policy.coverage??.8)*100)+'% · 查看保障':'未投保 · 查看保险';policyButton.setAttribute('aria-label',(p.name||rule.name)+' · 保险');policyButton.disabled=!p.id||(!modern&&p.legacyPetVersion!==1);policyButton.onclick=()=>openPetPolicy(p.id);article.querySelector('.pet-owned-policy').append(policyButton);
   const careLink=article.querySelector('.pet-owned-care-link');careLink.setAttribute('aria-label',pets.length===1?'宠物日常照顾':(p.name||rule.name)+' · 宠物日常照顾');careLink.onclick=()=>openPetCareForPet(id(p));
   for(const method of ['self','pro']){
    const button=document.createElement('button');button.type='button';button.setAttribute('aria-label',(p.name||rule.name)+' · '+methodName(p,method));button.setAttribute('aria-pressed',String(!!clean&&draft[clean.key]===method));
    button.innerHTML='<span>'+methodName(p,method)+'</span><small>'+priceText(roundCash(rule[method]*factor))+'</small><small>减少 '+(recovery?0:rule[method+'Hours'])+' 小时</small>';
    button.disabled=!clean||recovery&&method==='self';button.onclick=()=>{if(state!==owner||state.month!==month)return;draft[clean.key]=method;save();openPetHub()};article.querySelector('.pet-owned-methods').append(button);
   }
   const annualBox=article.querySelector('.pet-owned-annual');
   if(annual){const button=document.createElement('button');button.type='button';button.textContent='年度体检已到期 · '+priceText(roundCash(rule.annual*factor));button.setAttribute('aria-pressed',String(draft[annual.key]==='annual'));button.onclick=()=>{if(state!==owner||state.month!==month)return;draft[annual.key]='annual';save();openPetHub()};annualBox.append(button)}
   else annualBox.textContent='下次体检：'+monthText(p.care.nextAnnual);
   board.append(article);
  }
  const adopt=document.createElement('button');adopt.type='button';adopt.className='pet-owned-adopt';adopt.textContent='＋ 领养新伙伴';adopt.setAttribute('aria-label','领养新伙伴');adopt.onclick=openPetAdoptions;board.append(adopt);
  const summary=document.createElement('div');summary.className='pet-owned-summary';summary.innerHTML='<div><span>本月养护合计</span><strong>'+priceText(roundCash(monthly+paidCare+(q.cost||0)))+'</strong></div><div><span>本次照顾费用</span><strong>'+priceText(q.cost||0)+'</strong></div><div><span>自由时间</span><strong>减少 '+(q.hours||0)+' 小时</strong></div><p>本次支付后现金 '+priceText(state.cash-(q.cost||0))+'<small>已付的养护和保费不重复收费</small></p>';board.append(summary);
  if(q.blocked){const warning=document.createElement('p');warning.textContent=q.blocked;board.append(warning)}
  $('eventData').replaceChildren(board);$('eventData').style.display='block';
  for(const b of $('actions').querySelectorAll('button'))b.dataset.ownedAction=b.textContent==='确认支付已选照顾'?'pay':b.textContent.startsWith('确认本月')?'review':'back';
 };
 const showBefore=showEvent;showEvent=function(...args){document.querySelector('.pet-owned-painted')?.classList.remove('pet-owned-painted');document.querySelector('.pet-owned-home')?.remove();return showBefore(...args)};
 $('petBtn').onclick=()=>openPetHub();
})();
