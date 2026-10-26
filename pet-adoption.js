// Confirmed seven-species adoption. Legacy pets keep their original monthly budget.
const PET_ADOPTION={
 dog:{name:'柯基',type:'狗',adopt:300,monthly:100,deworm:20,premium:30},
 cat:{name:'银渐层',type:'猫',adopt:300,monthly:100,deworm:20,premium:30},
 crocodile:{name:'鳄鱼',type:'鳄鱼',adopt:2000,monthly:300,deworm:0,premium:80},
 gecko:{name:'豹纹守宫',type:'蜥蜴',adopt:250,monthly:40,deworm:0,premium:10},
 spider:{name:'捕鸟蛛',type:'蜘蛛',adopt:150,monthly:20,deworm:0,premium:5},
 tortoise:{name:'陆龟',type:'乌龟',adopt:400,monthly:50,deworm:0,premium:15},
 chameleon:{name:'变色龙',type:'变色龙',adopt:500,monthly:70,deworm:0,premium:20}
};
const legacyPetPrices=Object.fromEntries(Object.entries(PETS).map(([k,v])=>[k,v.monthly]));
PETS['鳄鱼']??={monthly:300};
function petIndividualMonthly(p){
 if(p.petRulesVersion!==1)return legacyPetPrices[p.type]??PETS[p.type]?.monthly??0;
 const cfg=PET_ADOPTION[petCareSpecies(p)];if(!cfg)return 0;
 return roundCash((cfg.monthly+(state.month===p.adoptMonth?0:cfg.deworm))*(state.cpiIndex||100)/100);
}
petMonthly=function(){return roundCash((state.pets||[]).reduce((sum,p)=>sum+petIndividualMonthly(p),0))};
function petAdoptionQuote(species,insured){
 const cfg=PET_ADOPTION[species];if(!cfg)return null;const factor=(state.cpiIndex||100)/100;
 const adopt=roundCash(cfg.adopt*factor),monthly=roundCash(cfg.monthly*factor),premium=insured?roundCash(cfg.premium*factor):0;
 return {species,insured:!!insured,adopt,monthly,premium,total:roundCash(adopt+monthly+premium)};
}
function openPetAdoptions(){showEvent('宠物领养','选择新伙伴','先查看品种，再取名字和核对费用。可以领养多只；每只分别记录照护与保单。',[],[
 ...Object.entries(PET_ADOPTION).map(([id,cfg])=>['查看'+cfg.name,()=>previewPetAdoption(id),false]),['返回我的宠物',openPetHub,false]]);}
function previewPetAdoption(species){
 const cfg=PET_ADOPTION[species];if(!cfg)return;const cycle=state.month,owner=state;let settled=false,input,checkbox,quoted;
 function quote(){return petAdoptionQuote(species,checkbox?.checked||false)}
 function confirm(){
  if(settled||state!==owner||state.month!==cycle||$('petAdoptionName')!==input)return false;
  const q=quote();if(JSON.stringify(q)!==JSON.stringify(quoted)){update();return false;}
  const name=input.value.trim();if(!name||name.length>40||state.cash<q.total)return false;
  // All payments are validated together before any mutation. Adoption is not a monthly bill.
  if(!spendConfirmed('petAdoption',q.adopt,{species,name}))return false;
  if(!payMonthly('living',q.monthly))return false;
  if(q.premium&&!payMonthly('premiums',q.premium))return false;
  let id;do{id='pet-'+(state.nextPetId=(state.nextPetId||0)+1)}while((state.pets||[]).some(p=>p.id===id||p.careId===id));const policyKey='pet:'+id;
  const p={id,careId:id,name,species,type:cfg.type,petRulesVersion:1,adoptMonth:cycle,insuranceKey:policyKey,
   care:{nextAnnual:cycle+12,nextClean:cycle+PET_CARE_RULES[species].selfMonths,history:[{month:cycle,kind:'adoption-included',cost:0,hours:0}]}};
  (state.pets??=[]).push(p);
  if(q.insured)state.insurance[policyKey]={name:name+' · 宠物保险',active:true,monthly:q.premium,coverage:.8,petId:id,startMonth:cycle};
  settled=true;syncFinance();save();render();
  showEvent('宠物领养','领养成功','首次体检与清洁已包含；猫狗本月驱虫已包含。后续按每只宠物的到期日期处理，不重复收费。',[
   ['新伙伴',batchEscape(name)+' · '+cfg.name],['本次支付',priceText(q.total)],['当前现金',priceText(state.cash)],['保险',q.insured?'本只宠物保障已生效':'未购买，可自行决定']],
   [['查看我的宠物',openPetHub,true],['返回房屋',townHome,false]]);return true;
 }
 showEvent('宠物领养','领养'+cfg.name,'查看不扣款、不占用照护时间。取名字、选择是否投保，确认才支付。',[],[['确认领养',confirm,true],['返回品种选择',openPetAdoptions,false]]);
 const form=document.createElement('div');form.className='wl-loan-form';
 form.innerHTML='<label for="petAdoptionName">给新伙伴取名字</label><input id="petAdoptionName" maxlength="40" placeholder="请输入名字"><label><input id="petAdoptionInsurance" type="checkbox"> 为本只宠物投保（疾病与意外80%，不含例行服务）</label><div id="petAdoptionQuote"></div>';
 $('eventData').append(form);$('eventData').style.display='block';input=$('petAdoptionName');checkbox=$('petAdoptionInsurance');
 function update(){quoted=quote();$('petAdoptionQuote').innerHTML='<p>领养及初始设施 '+priceText(quoted.adopt)+'<br>本月基础养护 '+priceText(quoted.monthly)+'<br>本月可选保费 '+priceText(quoted.premium)+'<br>本次合计 '+priceText(quoted.total)+'<br>支付后现金 '+priceText(state.cash-quoted.total)+'</p>';
  $('actions').firstElementChild.disabled=!input.value.trim()||state.cash<quoted.total;}
 const updateView=()=>{update();if(typeof paintPetAdoptionQuote==='function')paintPetAdoptionQuote(quoted)};
 input.oninput=updateView;checkbox.onchange=updateView;updateView();
}
function applyPetPolicyChanges(){for(const p of state?.pets||[]){const change=p.policyChange;if(!change||change.effectiveMonth>state.month)continue;
 const policy=state.insurance[p.insuranceKey];if(change.active){state.insurance[p.insuranceKey]={name:p.name+' · 宠物保险',active:true,monthly:change.monthly,coverage:.8,petId:p.id,startMonth:state.month};}else if(policy)policy.active=false;
 delete p.policyChange;
}}
const petPolicySyncBefore=syncFinance;syncFinance=function(){if(state){state.insurance??={};applyPetPolicyChanges()}return petPolicySyncBefore()};
function openPetPolicy(id){
 const p=state.pets.find(p=>p.id===id),cfg=PET_ADOPTION[petCareSpecies(p||{})];if(!p||!cfg)return;
 const policy=state.insurance[p.insuranceKey],active=!!policy?.active,cycle=state.month;let confirmed=false;
 const premium=roundCash(cfg.premium*(state.cpiIndex||100)/100),afterExploring=explorationStarted();
 showEvent('宠物保险',p.name+' · 保障','疾病和意外治疗赔付80%，不赔例行照护。保单按每只宠物单独记录；不追溯已发生费用。',[
 ['当前保障',active?'本月有效':'未生效'],['月保费',priceText(active?policy.monthly:premium)],['下月变更',p.policyChange?(p.policyChange.active?'投保':'停止保障'):'无']],
 [[active?'预约下月取消':'确认投保',()=>{if(confirmed||state.month!==cycle)return;
  if(active){p.policyChange={active:false,effectiveMonth:cycle+1};}
  else if(afterExploring){p.policyChange={active:true,effectiveMonth:cycle+1,monthly:premium};}
  else{if(!payMonthly('premiums',premium))return;state.insurance[p.insuranceKey]={name:p.name+' · 宠物保险',active:true,monthly:premium,coverage:.8,petId:p.id,startMonth:cycle};}
  confirmed=true;save();openPetHub();},true,!active&&!afterExploring&&state.cash<premium],
 ...active&&p.policyChange?.active===false&&!afterExploring?[['撤销取消，保留原保单',()=>{delete p.policyChange;save();openPetHub()},false]]:[],
 ...active&&p.policyChange?.active===false&&afterExploring?[['新合同下月接续',()=>{p.policyChange={active:true,effectiveMonth:cycle+1,monthly:premium};save();openPetHub()},false]]:[],['返回我的宠物',openPetHub,false]]);
}
function openPetHub(){
 syncFinance();showEvent('宠物','我的宠物','每只宠物分别保存名字、保单及到期照护。日常不可出售或送养。',
 (state.pets||[]).map(p=>[batchEscape(p.name||p.type), (PET_ADOPTION[petCareSpecies(p)]?.name||batchEscape(p.type))+' · 月养护 '+priceText(petIndividualMonthly(p))]),
 [['领养新伙伴',openPetAdoptions,true],...((state.pets||[]).length?[['宠物日常照顾',openPetCare,false]]:[]),
 ...(state.pets||[]).filter(p=>p.petRulesVersion===1).map(p=>[p.name+' · 保险',()=>openPetPolicy(p.id),false]),['返回房屋',townHome,false]]);
}
$('petBtn').onclick=openPetHub;
