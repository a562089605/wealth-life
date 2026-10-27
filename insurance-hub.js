// Illustrated insurance navigation over the existing premiums receipt and medical/pet contracts.
(function(){
 const syncBefore=syncFinance;syncFinance=function(){if(state)InsuranceRules.applyChanges(state);return syncBefore()};
 const descriptions={income:'因随机失业事件失业时，按事件发生时税前月薪的55%一次性赔付；主动辞职、退休及投保前已发生的失业不赔。',auto:'拥有车辆后可投保。车辆相关费用和处理方式以实际事件卡为准，保费不包含燃油、日常维护或贷款。',life:'原有人寿保单按原合同保留。新的保障条款尚未确认，暂不新增投保。',pet:'这是旧版合并宠物保单。原费用保留，不自动拆分或重复新增；新伙伴按每只宠物单独管理。'};
 let renderReady=false;
 const back=()=>openInsurance();
 const price=n=>priceText(n);
 const current=p=>p?.active;
 function show(title,desc,actions=[]){renderReady=false;showEvent('保险管理',title,desc,[],actions);renderReady=$('eventTitle').textContent===title;if(renderReady)$('eventTitle').closest('.event').classList.add('insurance-painted');}
 function section(title,text){const el=document.createElement('section');el.className='insurance-note';const h=document.createElement('h3');h.textContent=title;const p=document.createElement('p');p.textContent=text;if(/^\$[\d,.]+$/.test(text))el.classList.add('insurance-money');el.append(h,p);return el;}
 function hero(){const f=document.createElement('div');f.className='insurance-hero';f.innerHTML='<img src="assets/career/insurance.webp" alt="医疗箱、房屋和绿色保障盾牌">';return f;}
 function board(){if(!renderReady)return null;const b=document.createElement('div');b.className='insurance-board';const bar=document.createElement('div');bar.className='insurance-toolbar';bar.textContent='第'+(Math.floor(state.month/12)+1)+'年 · 第'+(state.month%12+1)+'月';const amount=document.createElement('strong');amount.textContent='现金 '+price(state.cash);bar.append(amount);b.append(bar,hero());$('eventData').replaceChildren(b);$('eventData').style.display='block';return b;}
 function card(label,summary,amount,action){const b=document.createElement('button');b.type='button';b.className='insurance-option';b.setAttribute('aria-label',label);const title=document.createElement('strong');title.textContent=label;const note=document.createElement('small');note.textContent=summary;const value=document.createElement('span');value.textContent=amount;b.append(title,note,value);b.onclick=action;return b;}
 function styleActions(){for(const b of $('actions').querySelectorAll('button'))b.dataset.insuranceAction=b.textContent.startsWith('确认本月')?'review':b.classList.contains('primary')?'confirm':'back';}
 // Decorate only the hub, leaving all existing policy/transaction flows intact.
 function embedHub(b,q){
  $('eventTitle').closest('.event').classList.add('insurance-embedded');
  b.querySelector('.insurance-hero')?.remove();
  b.querySelector('.insurance-note')?.remove();
  const scene=document.createElement('figure');scene.className='insurance-painted-scene';
  const image=document.createElement('img');image.src='assets/career/insurance-hub-embedded.webp';image.alt='暖阳桌面上的医疗箱、工作挎包、汽车钥匙、猫狗木偶与保费账单';scene.append(image);
  const options=[...b.querySelectorAll('.insurance-option')];
  options.slice(0,4).forEach((button,i)=>{button.dataset.insuranceSpot=String(i);scene.append(button)});
  const ledger=document.createElement('div');ledger.className='insurance-painted-ledger';
  for(const [label,value] of [['本月保费',q.monthly],['本月已付',q.paid],['尚需支付',q.due]]){
   const row=document.createElement('div'),name=document.createElement('span'),amount=document.createElement('strong');name.textContent=label;amount.textContent=price(value);row.append(name,amount);ledger.append(row);
  }
  scene.append(ledger);
  const pay=$('actions').querySelector('button');if(pay){pay.classList.add('insurance-embedded-pay');scene.append(pay)}
  b.insertBefore(scene,b.querySelector('.insurance-option'));
 }
 function embedMedical(b,buttons,quoteBox,confirmButton){
  $('eventTitle').closest('.event').classList.add('medical-embedded');
  b.querySelector('.insurance-hero')?.remove();
  const scene=document.createElement('figure');scene.className='medical-painted-scene';
  const image=document.createElement('img');image.src='assets/career/medical-plans-embedded.webp';image.alt='医疗箱和绿盾旁的三份医疗方案、费用纸条与确认木牌';scene.append(image);
  const notes=[...b.querySelectorAll('.insurance-note')].filter(e=>e!==quoteBox),status=notes.shift();
  if(status){status.classList.add('medical-painted-status');scene.append(status)}
  buttons.slice(0,3).forEach(({button},i)=>{button.dataset.medicalSpot=String(i);scene.append(button)});
  quoteBox.classList.add('medical-painted-quote');scene.append(quoteBox);
  confirmButton.classList.add('medical-embedded-confirm');scene.append(confirmButton);
  b.insertBefore(scene,b.children[1]||null);
 }
 function payAll(){
  syncFinance();const owner=state,month=state.month,q=InsuranceRules.quote(state);let done=false;
  show('核对本月保费','只支付本月尚未付清的保费；已付金额不重复扣除。',[
   ['确认支付本月保费',()=>{if(done||state!==owner||state.month!==month)return;syncFinance();if(JSON.stringify(InsuranceRules.quote(state))!==JSON.stringify(q))return payAll();if(payMonthly('premiums',q.due)){done=true;save();openInsurance()}},true,q.due<=0||state.cash<q.due],
   ...(state.cash<q.due?[['前往银行筹款',()=>openBankLoan(Math.max(1,Math.ceil(q.due-state.cash)),{after:payAll}),false]]:[]),['返回保险管理',back,false]
  ]);const b=board();if(!b)return;b.append(section('本月保费',price(q.monthly)),section('本月已付',price(q.paid)),section('本次尚需支付',price(q.due)),section('支付后现金',price(state.cash-q.due)));styleActions();
 }
 function generic(key){
  syncFinance();const cfg=INSURANCE[key],p=state.insurance?.[key];if(!cfg&&!p)return back();
  const name=p?.name||cfg?.[0]||'原有保单',monthly=current(p)?Number(p.monthly)||0:cfg?.[1]||0;
  const q=InsuranceRules.quote(state,{key,monthly}),owner=state,month=state.month;let done=false;
  const allowed=key==='income'||key==='auto'&&state.carOwned;
  const pending=state.pendingInsuranceChanges?.[key];
  show(name,'先查看保障和费用，确认后才投保；已有保单停保从下月生效。',[
   ...!current(p)&&allowed?[["确认投保并支付",()=>{if(done||state!==owner||state.month!==month)return;syncFinance();if(state.insurance?.[key]?.active)return generic(key);const fresh=InsuranceRules.quote(state,{key,monthly});if(JSON.stringify(fresh)!==JSON.stringify(q))return generic(key);if(!payMonthly('premiums',q.due))return;state.insurance[key]={name:cfg[0],active:true,monthly,effectiveMonth:month};done=true;syncFinance();save();generic(key)},true,state.cash<q.due]]:[],
   ...current(p)&&!pending?[['预约下月停保',()=>{if(done||state!==owner||state.month!==month)return;done=true;state.pendingInsuranceChanges??={};state.pendingInsuranceChanges[key]={active:false,effectiveMonth:month+1};save();generic(key)},false]]:[],
   ...pending?[['撤销停保，保留原保障',()=>{if(state!==owner||state.month!==month)return;delete state.pendingInsuranceChanges[key];save();generic(key)},false]]:[],
   ...!current(p)&&allowed&&state.cash<q.due?[['前往银行筹款',()=>openBankLoan(Math.max(1,Math.ceil(q.due-state.cash)),{after:()=>generic(key)}),false]]:[],['返回保险管理',back,false]
  ]);
  const b=board();if(!b)return;b.append(section('当前状态',current(p)?'✓ 本月保障有效':'未投保'),section('每月保费',price(monthly)),section('保障说明',descriptions[key]||'原合同资料保留。'));
  if(current(p))b.append(section('本月保障与停保',pending?'已预约下月停止；本月保障和已付保费保留。':'预约取消后从下月停止，本月已付保费不退款。'));
  else if(allowed)b.append(section('本次需付保费',price(q.due)+'，包含其他有效保单本月尚未付清的保费。'),section('支付后现金',price(state.cash-q.due)));
  else b.append(section('投保条件',key==='auto'?'拥有车辆后再选择车险。':'目前保留原有保单，不开放新的投保。'));
  styleActions();
 }
 function petList(){
  syncFinance();const pets=state.pets||[];
  show('宠物保险','每只宠物单独投保。疾病和意外治疗按有效保单赔付80%，例行养护、清洁和体检不赔。',[['返回保险管理',back,true]]);
  const b=board();if(!b)return;
  for(const p of pets){const cfg=PET_ADOPTION[petCareSpecies(p)],policy=state.insurance?.[p.insuranceKey];if(!cfg)continue;
   const v=current(policy)?policy.monthly:roundCash(cfg.premium*(state.cpiIndex||100)/100);
   const button=card(p.name||cfg.name,current(policy)?'✓ 已投保 · 医疗赔付80%':'未投保 · 查看本只宠物保障',price(v)+'/月',()=>openPetPolicy(p.id));button.disabled=!p.id||p.petRulesVersion!==1;b.append(button);
  }
  if(!pets.length)b.append(section('尚未领养宠物','领养时可为新伙伴单独选择保险，现在无需购买宠物险。'));
  if(current(state.insurance.pet))b.append(card('旧版合并宠物保单','保留原合同，不自动拆分或重复投保',price(state.insurance.pet.monthly)+'/月',()=>generic('pet')));
  styleActions();
 }
 openInsurance=function(type){
  if(type==='health')return openMedicalInsurance();if(type==='pet')return petList();if(['income','auto','life'].includes(type))return generic(type);
  syncFinance();const q=InsuranceRules.quote(state),p=state.insurance.health;
  show('保险与保障','按需要选择保障，查看和返回不会投保或扣款。',[[q.due>0?'核对并支付本月保费':'本月保费已付清',payAll,true,q.due<=0],['返回生活安排',openRoomLife,false]]);
  const b=board();if(!b)return;b.append(section('本月保费',price(q.monthly)+' / 已付 '+price(q.paid)+' / 待付 '+price(q.due)));
  b.append(card('医疗保险',current(p)?'✓ '+(p.name||'原医疗保单')+' · 赔付'+Math.round(medicalCoverage()*100)+'%'+(state.pendingMedicalPolicy?' · 下月'+(state.pendingMedicalPolicy.plan?MEDICAL_PLANS[state.pendingMedicalPolicy.plan].name:'停保'):''):'基础200/月赔80% · 全额400/月赔100%',current(p)?price(p.monthly)+'/月':'查看方案',openMedicalInsurance));
  b.append(card('收入保障',current(state.insurance.income)?state.pendingInsuranceChanges?.income?'已预约下月停保，本月仍有效':'✓ 本月保障有效':'随机失业时一次性赔付，非每月补助',price(current(state.insurance.income)?state.insurance.income.monthly:INSURANCE.income[1])+'/月',()=>generic('income')));
  b.append(card('汽车保险',current(state.insurance.auto)?'✓ 本月保障有效':state.carOwned?'拥有车辆，查看车险':'尚无车辆，暂不需要投保',price(current(state.insurance.auto)?state.insurance.auto.monthly:INSURANCE.auto[1])+'/月',()=>generic('auto')));
  b.append(card('宠物保险',(state.pets||[]).length?'逐只查看与管理，不购买重复的统一宠物险':'尚未领养宠物，暂不需要投保','逐只管理',petList));
  if(state.insurance.life)b.append(card('原有人寿保单',current(state.insurance.life)?'原保单持续有效':'原保单记录保留',price(state.insurance.life.monthly||INSURANCE.life[1])+'/月',()=>generic('life')));
  for(const key of Object.keys(state.insurance||{}).filter(k=>!['health','income','auto','pet','life'].includes(k)&&!k.startsWith('pet:'))){const v=state.insurance[key];if(v?.active)b.append(card(v.name||'原有保单','原合同与费用保留',price(v.monthly)+'/月',()=>generic(key)))}
  styleActions();embedHub(b,q);
 };
 buyInsurance=type=>openInsurance(type);
 openMedicalInsurance=function(preferred){
  if(![null,'basic','full','keep'].includes(preferred))preferred=undefined;
  syncFinance();const p=state.insurance.health,pending=state.pendingMedicalPolicy,owner=state,month=state.month;
  const policySnapshot=JSON.stringify(p);
  let selected=preferred!==undefined?preferred:pending?pending.plan:current(p)?p.plan||'keep':null,confirmButton,quoteBox,presentedQuote,loanButton;
  show('医疗保障选择','新投保确认付款后生效；已有保单切换或取消从下月生效。已发生治疗按原锁定报价，不追溯赔付。',[
   ['确认医疗安排',()=>{if(state!==owner||state.month!==month||!confirmButton?.isConnected)return;if(JSON.stringify(state.insurance.health)!==policySnapshot)return openMedicalInsurance();const now=InsuranceRules.quote(state,!current(p)&&selected?{key:'health',monthly:MEDICAL_PLANS[selected].monthly}:null);if(JSON.stringify(now)!==presentedQuote){update();return;}if(selected==='keep'){delete state.pendingMedicalPolicy;save();return openMedicalInsurance();}return confirmMedicalPlan(selected)},true],['返回保险管理',back,false]
  ]);
  confirmButton=$('actions').querySelector('button');const b=board();if(!b)return;b.append(section('当前保障',current(p)?(p.name||'旧版医疗险')+' · '+price(p.monthly)+'/月 · 赔付'+Math.round(medicalCoverage()*100)+'%':'未投保'));
  if(pending)b.append(section('已预约下月安排',pending.plan?MEDICAL_PLANS[pending.plan].name:'停止医疗保障'));
  const buttons=[];
  for(const plan of [null,'basic','full',...(current(p)&&!p.plan?['keep']:[])]){
   const cfg=plan==='keep'?{name:'保留原保单',monthly:p.monthly,coverage:medicalCoverage()}:plan?MEDICAL_PLANS[plan]:{name:current(p)?'下月停止医疗保障':'暂不购买医疗保险',monthly:0,coverage:0};
   const button=card(cfg.name,plan==='keep'?'保留原合同，不重复购买':cfg.coverage?'赔付治疗费用的'+Math.round(cfg.coverage*100)+'%':'治疗费用自行承担',price(cfg.monthly)+'/月',()=>{selected=plan;update()});b.append(button);buttons.push({plan,button});
  }
  quoteBox=section('本次安排','');b.append(quoteBox);loanButton=document.createElement('button');loanButton.textContent='前往银行筹款';loanButton.className='insurance-option';loanButton.onclick=()=>{if(state!==owner||state.month!==month||!loanButton.isConnected)return;const q=InsuranceRules.quote(state,{key:'health',monthly:MEDICAL_PLANS[selected].monthly});openBankLoan(Math.max(1,Math.ceil(q.due-state.cash)),{after:()=>openMedicalInsurance(selected)})};b.append(loanButton);
  function update(){
   for(const {plan,button} of buttons)button.setAttribute('aria-pressed',String(plan===selected));
   const immediate=!current(p)&&selected,quote=InsuranceRules.quote(state,immediate?{key:'health',monthly:MEDICAL_PLANS[selected].monthly}:null),due=immediate?quote.due:0;
   presentedQuote=JSON.stringify(quote);loanButton.hidden=!immediate||state.cash>=due;
   const text=immediate?'本次需付 '+price(due)+'（含其他保单本月未付保费）；支付后现金 '+price(state.cash-due):current(p)?'本次不扣款；变更或停保从下月生效，本月保障和已付保费保留。':'本次不投保，不扣款。';quoteBox.querySelector('p').textContent=text;
   confirmButton.disabled=!!immediate&&state.cash<due;confirmButton.textContent=immediate?'确认投保并支付 '+price(due):current(p)?selected==='keep'||selected===p.plan?'确认保留当前保障':selected===null?'确认下月停止保障':'确认下月切换方案':'保持不投保';
  }
  update();styleActions();embedMedical(b,buttons,quoteBox,confirmButton);
 };
 // Old monthly-wizard entry links to this same manager instead of selling a second flat pet policy.
 insuranceMarkup=function(){const q=InsuranceRules.quote(state);return '<div class="insurance-entry-bridge"><h3>本月保险安排</h3><p>本月有效保费 '+price(q.monthly)+'，尚待支付 '+price(q.due)+'。</p><button data-insurance-hub>查看与管理保单</button><button data-v26="insuranceSkip">继续，不新增保单</button></div>'};
 document.addEventListener('click',e=>{if(e.target.closest('[data-insurance-hub]'))openInsurance()});
 const showBefore=showEvent;showEvent=function(...args){document.querySelector('.insurance-painted')?.classList.remove('insurance-painted','insurance-embedded','medical-embedded');return showBefore(...args)};
})();
