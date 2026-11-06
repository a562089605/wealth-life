// V28.10: approved seven-pet adoption cards on the existing save transactions.
(function(){
 const A=PetAdoptionEntry,asset=id=>id==='adoption-dog'?'assets/pets/adoption-card-20261105.webp':['detail-actions','monthly-fee'].includes(id)?'assets/pets/'+id+'-20261106.webp':'assets/pets/'+id+'-20261104.webp';
 const copy=s=>JSON.parse(JSON.stringify(s)),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let active=null,returnFocus=null,view=null,paying=false;
 function close(){if(active){active.remove();active=null;}document.body.classList.remove('pet-pages-open');view=null;returnFocus?.isConnected&&returnFocus.focus({preventScroll:true});}
 function panel(kind){A.close();close();clearModals();returnFocus=document.activeElement;const owner=state,month=state.month,chosenSlot=slot;
  const node=document.createElement('section');node.className='pet-pages-overlay';node.setAttribute('role','dialog');node.setAttribute('aria-modal','true');node.setAttribute('aria-label',kind);document.body.append(node);document.body.classList.add('pet-pages-open');active=node;
  const ctx={node,owner,month,chosenSlot,valid:()=>active===node&&node.isConnected&&state===owner&&state.month===month&&slot===chosenSlot};view=ctx;return ctx;
 }
 function textNode(tag,txt,cls=''){const e=document.createElement(tag);e.className=cls;e.textContent=txt;return e;}
 function canvas(ctx,id,ratio='941/1672'){const e=document.createElement('div');e.className='pet-illustrated';e.style.aspectRatio=ratio;e.innerHTML='<img class="pet-page-art" src="'+asset(id)+'" alt="" aria-hidden="true">';ctx.node.append(e);return e;}
 function box(parent,txt,x,y,w,h,cls=''){const e=textNode('div',txt,'pet-live '+cls);e.style.cssText='left:'+x+'%;top:'+y+'%;width:'+w+'%;height:'+h+'%';parent.append(e);return e;}
 function hit(ctx,parent,label,x,y,w,h,run,cls=''){const b=textNode('button',label,'pet-hit '+cls);b.type='button';b.style.cssText='left:'+x+'%;top:'+y+'%;width:'+w+'%;height:'+h+'%';b.onclick=()=>{if(ctx.valid()&&!b.disabled)run(b);};parent.append(b);return b;}
 function message(parent){const e=textNode('p','','pet-message');e.setAttribute('role','status');parent.append(e);return e;}
 function focusFirst(ctx){ctx.node.querySelector('button:not(:disabled),input')?.focus({preventScroll:true});}
 function spec(p){return petCareSpecies(p);}
 function cfg(p){return A.pets[spec(p)];}
 function petName(p){return p.name||cfg(p)?.name||p.type||'待核对宠物';}
 function petInsurancePolicy(p){const individual=p.insuranceKey&&state.insurance?.[p.insuranceKey],policies=[individual,state.insurance?.pet].filter(x=>x?.active);return policies.find(x=>!Number.isInteger(x.startMonth)||x.startMonth<=state.month)||policies[0];}
 function petInsuranceStatus(p){const policy=petInsurancePolicy(p);return !policy?'未投保':Number.isInteger(policy.startMonth)&&policy.startMonth>state.month?'待生效':'已投保';}
 function calendar(month){return Number.isInteger(month)?'第'+(Math.floor(month/12)+1)+'年 · 第'+(month%12+1)+'月':'日期未记录';}
 function preview(){const s=copy(state);ensurePetCare(s);return s;}
 function due(p,kind){const s=preview(),i=state.pets.indexOf(p);return petCareTasks(s).filter(t=>t.pet===s.pets[i]&&(!kind||t.kind===kind));}
 function validPet(ctx,p,index){const now=state.pets?.[index],identity=x=>JSON.stringify([x.type,x.species,x.adoptMonth,x.careId,x.id,x.name]);return ctx.valid()&&!!now&&(now===p||identity(now)===identity(p));}
 function portrait(src){const frame=document.createElement('span');frame.className='pet-crop';frame.innerHTML='<img src="'+src+'" alt="">';return frame;}
 function room(){close();openRoom();}
 function selection(id='dog'){close();A.openSelection(id);}
 function plain(ctx,title){const p=document.createElement('div');p.className='pet-paper';p.append(textNode('h2',title));ctx.node.append(p);return p;}
 function action(ctx,parent,label,fn,disabled=false){const b=textNode('button',label,'pet-solid-button');b.type='button';b.disabled=disabled;b.onclick=()=>{if(ctx.valid()&&!b.disabled)fn(b);};parent.append(b);return b;}
 function backup(){const k=key(slot),raw=localStorage.getItem(k),b=k+'_before_pet_pages_20261104';if(raw&&!localStorage.getItem(b))localStorage.setItem(b,raw);}
 function transaction(change){const owner=state,before=copy(state);try{backup();if(change()===false)throw Error('invalid pet operation');if(save()===false)throw Error('save failed');return true;}catch(e){for(const k of Object.keys(owner))delete owner[k];Object.assign(owner,before);return false;}}
 function openOverview(){if(!state)return;const ctx=panel('我的宠物'),paper=document.createElement('div');paper.className='pet-overview';
  const header=document.createElement('div');header.className='pet-overview-heading';header.innerHTML='<img src="'+asset('overview')+'" alt="我的宠物，每一位伙伴都有自己的小天地">';const back=textNode('button','','pet-overview-back');back.type='button';back.setAttribute('aria-label','返回房屋（顶部）');back.onclick=()=>{if(ctx.valid())room();};header.append(back);paper.append(header);
  const pets=state.pets||[],grid=document.createElement('div');grid.className='pet-tile-grid'+(pets.length>1?' pet-many':'')+(pets.length>4?' pet-many-more':'');
  for(const [index,p]of pets.entries()){const b=document.createElement('button');b.type='button';b.className='pet-tile';b.setAttribute('aria-label','查看'+petName(p));const id=spec(p);if(A.pets[id])b.append(portrait(asset('success-'+id)));b.append(textNode('strong',petName(p)),textNode('small','点击查看 ›'));b.onclick=()=>{if(validPet(ctx,p,index))openDetail(index);};grid.append(b);}
  const add=document.createElement('button');add.type='button';add.className='pet-add-tile';add.setAttribute('aria-label','领养新伙伴');add.innerHTML='<span aria-hidden="true">＋</span><strong>领养新伙伴</strong>';add.onclick=()=>{if(ctx.valid())selection();};grid.append(add);paper.append(grid);action(ctx,paper,'返回房屋',room);ctx.node.append(paper);focusFirst(ctx);
 }
 function openDetail(index){const p=state.pets?.[index];if(!p)return openOverview();const c=cfg(p);if(!c){const ctx=panel('宠物资料'),paper=plain(ctx,'宠物资料待核对');paper.append(textNode('p',petName(p)+'：保留旧记录，不重新领养或收费。'));action(ctx,paper,'查看原照护',()=>{close();legacyOpenCare();});action(ctx,paper,'返回我的宠物',openOverview);return;}
  const ctx=panel(c.name+'的资料'),e=canvas(ctx,'detail-actions');
  if(spec(p)!=='dog'){const hero=box(e,'',0,9,100,25.4,'pet-detail-hero');hero.append(portrait(asset('success-'+spec(p))));}
  box(e,petName(p)+' · '+c.name,22,35.1,56,4.2,'pet-name');
  box(e,due(p).length?'有到期照护，请查看处理':'目前没有到期照护',20,39.8,61,4.1,'pet-status');
  hit(ctx,e,'每月费用',4,44.5,92,9.5,()=>{if(validPet(ctx,p,index))openBasicFees(index);});
  hit(ctx,e,'日常照顾',4,54.7,92,9.3,()=>{if(validPet(ctx,p,index))openClean(index);});
  hit(ctx,e,'年度体检',4,64.9,92,9.3,()=>{if(validPet(ctx,p,index))openAnnual(index);});
  hit(ctx,e,'保险',4,74.8,92,9.3,()=>{if(validPet(ctx,p,index))openPetInsurance(index);});
  hit(ctx,e,'返回我的宠物',6,86.8,88,6.4,openOverview);
  hit(ctx,e,'返回房屋',26,94.3,49,4.4,room);
  hit(ctx,e,'返回我的宠物',2,1,13,7,openOverview);focusFirst(ctx);
 }
 function basicFeeOptions(){return {prices:Object.fromEntries(Object.entries(PETS).map(([type,c])=>[type,c.monthly])),nonPetLiving:roundCash(livingBaseAmount(state)+(state.carRunningCost||0))};}
 function openBasicFees(index){const p=state.pets?.[index],c=p&&cfg(p);if(!c)return openOverview();const ctx=panel('每月费用'),q=PetBasicFees.quote(state,index,basicFeeOptions());
  if(!q){const paper=plain(ctx,petName(p)+' · 每月费用');paper.append(textNode('p','原宠物费用记录待核对，暂不收费。'));action(ctx,paper,'返回宠物资料',()=>openDetail(index));return;}
  const e=canvas(ctx,'monthly-fee');
  if(spec(p)!=='dog'){const hero=box(e,'',0,9.4,100,20.3,'pet-monthly-hero');hero.append(portrait(asset('success-'+spec(p))));}
  box(e,petName(p),34,30.2,32,4.8,'pet-monthly-name');
  box(e,priceText(q.fee),52,47.7,31,6.2,'pet-monthly-amount');
  const notes={dog:'包含狗粮/零食/玩具/驱虫药等。',cat:'包含猫粮/罐头/玩具/猫砂等。',tortoise:'包含食物/钙粉/垫材/照明与保温耗用等。',chameleon:'包含活体饲料/钙粉/喷淋与照明耗用等。',gecko:'包含活体饲料/钙粉/垫材/保温耗用等。',spider:'包含活体饲料/垫材及基础耗材等。',crocodile:'包含食物/水质维护/日常耗材等。'};
  box(e,notes[spec(p)],44,54.7,48,7.3,'pet-monthly-note');
  box(e,q.due?'本月待付':'本月已付',11,67.5,35,6.1,'pet-monthly-due-label');
  box(e,priceText(q.due),58,67.3,28,6.4,'pet-monthly-amount');
  box(e,q.due?'确认付款 '+priceText(q.due):'本月已支付',24,82.5,52,5.2,'pet-monthly-pay-label');
  const status=message(ctx.node);hit(ctx,e,q.due?'确认付款 '+priceText(q.due):'本月已支付',4,80.4,92,9.5,button=>{if(paying||!validPet(ctx,p,index))return;paying=true;button.disabled=true;
   const result=PetBasicFees.confirm(state,index,q.token,basicFeeOptions(),()=>{backup();const k=key(slot),raw=localStorage.getItem(k),bk=k+'_before_pet_basic_fee_20261106';if(raw&&!localStorage.getItem(bk))localStorage.setItem(bk,raw);return save();});paying=false;
   if(!result.ok){button.disabled=false;status.textContent='暂未完成，请返回核对或重试。';return;}render();openBasicFees(index);
  }).disabled=!q.due||state.cash<q.due;
  if(q.due>state.cash)status.textContent='现金不足，尚未扣款。';hit(ctx,e,'返回宠物资料',22,91.5,56,6,()=>openDetail(index));hit(ctx,e,'返回宠物资料',2,1,13,7,()=>openDetail(index));focusFirst(ctx);
 }
 function openPetInsurance(index){const p=state.pets?.[index],c=p&&cfg(p);if(!c)return openOverview();
  const ctx=panel('宠物保险'),paper=plain(ctx,'宠物保险'),profile=textNode('div','','pet-insurance-profile');profile.append(portrait(asset('success-'+spec(p))),textNode('strong',petName(p)));paper.append(profile);
  const held=petInsurancePolicy(p),monthly=held?.monthly??INSURANCE.pet[1];
  paper.append(textNode('p','当前状态：'+petInsuranceStatus(p),'pet-insurance-state'),textNode('p','每月保费 '+priceText(monthly)));
  if(held){if(Number.isFinite(held.coverage))paper.append(textNode('p','医疗费用赔付 '+Math.round(held.coverage*100)+'%'));if(Number.isInteger(held.startMonth)&&held.startMonth>state.month)paper.append(textNode('p','生效时间：'+calendar(held.startMonth)));}
  else{
   const total=premiumsTotal(),paid=paymentReceipt().premiums||0,due=roundCash(Math.max(0,total+monthly-Math.max(total,paid)));
   paper.append(textNode('p','本次支付 '+priceText(due)));const status=message(paper);
   action(ctx,paper,'确认投保',button=>{if(paying||!validPet(ctx,p,index)||state.insurance?.pet?.active||premiumsTotal()!==total||(paymentReceipt().premiums||0)!==paid)return;paying=true;button.disabled=true;
    const ok=transaction(()=>{const k=key(slot),raw=localStorage.getItem(k),bk=k+'_before_pet_insurance_20261106';if(raw&&!localStorage.getItem(bk))localStorage.setItem(bk,raw);if(!payMonthly('premiums',due))return false;state.insurance??={};state.insurance.pet={name:INSURANCE.pet[0],active:true,monthly};syncFinance();return true;});paying=false;
    if(!ok){button.disabled=false;status.textContent='暂未完成，请重试。';return;}openPetInsurance(index);
   },state.cash<due);
   if(state.cash<due)status.textContent='现金不足，尚未扣款。';
  }
  action(ctx,paper,'返回宠物资料',()=>openDetail(index));focusFirst(ctx);
 }
 function openAdoption(id){const q=A.quote(state,id);if(!q)return selection();const ctx=panel('取名与费用'),e=canvas(ctx,'adoption-dog','1024/1536');
  const cash=box(e,'',73,4.5,15.5,5.8,'pet-adoption-cash');cash.append(textNode('span','可用现金'),textNode('strong',new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:0,maximumFractionDigits:2}).format(state.cash)));if(cash.lastChild.textContent.length>9)cash.classList.add('pet-cash-long');box(e,calendar(state.month),36,8.8,28,3,'pet-date');
  if(id!=='dog'){const hero=box(e,'',16,12,70,26,'pet-adopt-hero');hero.append(portrait(asset('success-'+id)));}
  // The approved draft contains historical insurance and prices: cover that entire region.
  const form=document.createElement('div');form.className='pet-adoption-form';form.innerHTML='<h2>'+esc(q.name)+' · 取名与费用</h2><label for="petNameInput">给它取个名字</label><input id="petNameInput" required maxlength="24" autocomplete="off" placeholder="请输入宠物名字"><dl><dt>领养'+(q.setup||id==='crocodile'?'及初始设备':'费用')+'</dt><dd>'+priceText(q.initialFee)+'</dd><dt>每月基础费用</dt><dd>'+priceText(q.monthly)+'</dd></dl><p class="pet-basic-note">'+(id==='dog'?'包含狗粮/零食/玩具/驱虫药等。':id==='cat'?'包含猫粮/罐头/玩具/猫砂等。':id==='tortoise'?'包含食物/钙粉/垫材/照明与保温耗用等。':id==='chameleon'?'包含活体饲料/钙粉/喷淋与照明耗用等。':id==='gecko'?'包含活体饲料/钙粉/垫材/保温耗用等。':id==='spider'?'包含活体饲料/垫材及基础耗材等。':id==='crocodile'?'包含食物/水质维护/日常耗材等。':'包含日常食物及基础耗材等。')+'</p><dl class="pet-payment"><dt>本次支付<span>含首月基础费用</span></dt><dd>'+priceText(q.total)+'</dd><dt>支付后现金</dt><dd>'+priceText(state.cash-q.total)+'</dd></dl>';e.append(form);const status=message(form);
  const confirm=action(ctx,form,'确认领养'+q.name,b=>{const input=form.querySelector('input'),name=input.value.trim().slice(0,24);if(!name){status.textContent='请先给它取个名字。';input.setAttribute('aria-invalid','true');input.focus();return;}input.removeAttribute('aria-invalid');status.textContent='';const fresh=A.quote(state,id);if(!fresh||fresh.owned||state.cash<fresh.total||fresh.total!==q.total)return;b.disabled=true;
   const result=A.confirm(state,id,()=>{ensurePetCare(state);backup();const k=key(slot),raw=localStorage.getItem(k),bk=k+'_before_pet_entry_20261104';if(raw&&!localStorage.getItem(bk))localStorage.setItem(bk,raw);return save();},name);
   if(!result.ok){b.disabled=false;status.textContent='暂未保存，领养和费用均未结算，请重试。';return;}
   openSuccess(state.pets.length-1,result.quote);
  },q.owned||state.cash<q.total);
  form.querySelector('input').addEventListener('input',()=>{if(form.querySelector('input').value.trim()){status.textContent='';form.querySelector('input').removeAttribute('aria-invalid');}});
  if(q.owned)status.textContent='已拥有该种宠物，同种不可重复领养。';else if(state.cash<q.total)status.textContent='现金不足，尚未扣款。';
  action(ctx,form,'暂不领养，返回选择',()=>selection(id));hit(ctx,e,'返回选择',15,3,9,7,()=>selection(id));focusFirst(ctx);
 }
 function openSuccess(index,q){const p=state.pets[index],id=spec(p),ctx=panel('领养成功'),e=canvas(ctx,'success-'+id);box(e,petName(p)+' · '+q.name,26,38.7,49,3.3,'pet-name');box(e,priceText(q.total),65,69.7,27,5.5,'pet-gold');box(e,priceText(state.cash),55,75,37,4.5,'pet-status');box(e,priceText(q.monthly),73,80.2,18,4.5,'pet-status');hit(ctx,e,'查看我的宠物',5,87.2,90,6.5,openOverview);hit(ctx,e,'返回房屋',32,94.7,35,4.5,room);focusFirst(ctx);}
 function openClean(index){const p=state.pets?.[index],c=p&&cfg(p);if(!c)return openDetail(index);const ctx=panel(c.name+'清洁护理'),id=spec(p),e=canvas(ctx,'clean-'+id,'852/1846');let selected=isRecoveryMonth(state)?'pro':'self';const status=message(ctx.node);
  box(e,calendar(state.month),53,7.3,33,2.8,'pet-date');
  box(e,petName(p)+' · '+c.name,46,19.2,47,4.1,'pet-name');
  const petPreview=preview().pets[index];box(e,'下次清洁：'+calendar(petPreview.care?.nextClean),46,24.1,47,5.1,'pet-due');
  const marks=[box(e,'✓',7.4,34.4,7,3.3,'pet-check'),box(e,'',7.4,50.2,7,3.3,'pet-check')];
  const rows=[box(e,'',43.8,34.5,49.5,13.4,'pet-care-row pet-care-self'),box(e,'',43.8,50.5,49.5,13.4,'pet-care-row')];
  const sum=box(e,'',6,69,88,5.8,'pet-summary');
  const date=box(e,'',5,64.7,90,3,'pet-helper');
  const rules=PET_CARE_RULES[id],factor=(state.cpiIndex||100)/100,recovery=isRecoveryMonth(state);
  const amount=m=>roundCash(rules[m]*factor),hours=m=>recovery?0:rules[m+'Hours'];
  const label=m=>(id==='dog'||id==='cat')?(m==='self'?'自己洗澡':'外出洗澡'):(m==='self'?'自行清洁':'专业清洁');
  const choices=['self','pro'].map((m,i)=>hit(ctx,e,label(m),5,i?49.4:33.4,90,15.3,()=>{if(validPet(ctx,p,index)){selected=m;update();}}));
  const b=hit(ctx,e,'确认选择',7,76.7,86,5.6,()=>{if(!validPet(ctx,p,index))return;openCareConfirm(index,'Clean',selected);});
  box(e,'返回'+petName(p)+'的资料',17,83.3,67,3.7,'pet-status');hit(ctx,e,'返回宠物资料',14,83.1,72,4.5,()=>openDetail(index));
  box(e,'返回我的宠物',22,88,57,2.4,'pet-helper');hit(ctx,e,'返回我的宠物',18,87.3,65,4.6,openOverview);
  function update(){const ready=due(p,'Clean').length>0;marks.forEach((mark,i)=>{mark.textContent=selected===(i?'pro':'self')?'✓':'';mark.classList.toggle('selected',selected===(i?'pro':'self'));choices[i].setAttribute('aria-pressed',String(selected===(i?'pro':'self')));});
   choices[0].disabled=recovery;for(const [i,m]of ['self','pro'].entries()){rows[i].innerHTML='<strong>'+label(m)+'</strong><span>'+(m==='self'?'自己动手，细心照顾。':'交给专业人员清洁照顾。')+'</span><span>费用：'+priceText(amount(m))+'</span><b>'+(m==='self'&&recovery?'康复月不可自行清洁':'自由时间减少 '+hours(m)+' 小时')+'</b><span>清洁后，隔 '+rules[m+'Months']+' 个月再清洁</span>';}
   sum.innerHTML='<small>已选方式　／　本次费用　／　自由时间</small><strong>'+label(selected)+'　'+priceText(amount(selected))+'　减少 '+hours(selected)+' 小时</strong>';date.textContent=ready?'清洁完成后，按所选间隔计算下次时间':'尚未到期，仅可预览，不提前收费';b.disabled=!ready;b.setAttribute('aria-label',ready?'确认选择':'尚未到期，不能确认支付');}
  update();focusFirst(ctx);
 }
 function openAnnual(index){const p=state.pets?.[index];if(!p)return openOverview();const ctx=panel('年度体检'),paper=plain(ctx,petName(p)+' · 年度体检'),s=preview(),cp=s.pets[index],rule=PET_CARE_RULES[spec(p)];if(!rule)return openDetail(index);
  paper.append(textNode('p','下次体检：'+calendar(cp.care?.nextAnnual)),textNode('p','年度体检费用 '+priceText(roundCash(rule.annual*(state.cpiIndex||100)/100))+' · 本人时间 '+(isRecoveryMonth(state)?0:rule.annualHours)+' 小时'));
  const ready=due(p,'Annual').length>0;action(ctx,paper,ready?'核对体检费用':'尚未到期',()=>{if(validPet(ctx,p,index))openCareConfirm(index,'Annual','annual');},!ready);action(ctx,paper,'返回宠物资料',()=>openDetail(index));focusFirst(ctx);
 }
 function openCareConfirm(index,kind,method){const p=state.pets?.[index];if(!p)return openOverview();const s=preview(),task=petCareTasks(s).find(t=>t.pet===s.pets[index]&&t.kind===kind);if(!task)return openDetail(index);
  const selections={[task.key]:method},q=petCareQuote(s,selections),ctx=panel('核对照护费用'),paper=plain(ctx,'核对'+petName(p)+'的照护费用');
  if(q.blocked){paper.append(textNode('p',q.blocked));action(ctx,paper,'返回宠物资料',()=>openDetail(index));return;}
  paper.append(textNode('p',(kind==='Annual'?'年度体检':method==='self'?'自行清洁':'专业清洁')+' · '+priceText(q.cost)+' · '+q.hours+' 小时'),textNode('p','支付后现金：'+priceText(state.cash-q.cost)));const status=message(paper);
  action(ctx,paper,'确认支付',b=>{if(paying||!validPet(ctx,p,index))return;const fresh=preview(),t=petCareTasks(fresh).find(t=>t.pet===fresh.pets[index]&&t.key===task.key);if(!t)return;const nq=petCareQuote(fresh,selections);if(nq.blocked||nq.cost!==q.cost||nq.hours!==q.hours){status.textContent='条件已变化，请返回重新核对。';return;}
   paying=true;b.disabled=true;const before=copy(state);let ok=false;try{backup();ok=payPetCare(selections);}catch(e){for(const k of Object.keys(state))delete state[k];Object.assign(state,before);}finally{paying=false;}
   if(!ok){b.disabled=false;status.textContent='暂未完成：未结算费用、时间或照护日期，请检查余额和时间后重试。';return;}openDetail(index);
  },state.cash<q.cost||currentCareerTime().free<q.hours);
  if(state.cash<q.cost){status.textContent='现金不足，尚未扣款。';action(ctx,paper,'前往银行',()=>{close();openBankLoan(Math.max(1,Math.ceil(q.cost-state.cash)),{after:()=>{if(state===ctx.owner&&slot===ctx.chosenSlot&&state.month===ctx.month&&state.pets[index]===p)openCareConfirm(index,kind,method);}});});}
  if(currentCareerTime().free<q.hours)status.textContent='自由时间不足，尚未扣款或扣时。';action(ctx,paper,'返回调整',()=>kind==='Clean'?openClean(index):openAnnual(index));focusFirst(ctx);
 }
 const legacyOpenCare=openPetCare;openPetCare=function(){if(paying)return;return openDueCare();};
 function openDueCare(){if(!state)return;const ctx=panel('到期宠物照护'),paper=plain(ctx,'到期宠物照护'),s=preview(),tasks=petCareTasks(s);if(!tasks.length)paper.append(textNode('p','目前没有到期照护。'));
  for(const t of tasks){const index=s.pets.indexOf(t.pet);if(t.unsupported){paper.append(textNode('p',petName(state.pets[index])+'：旧物种待核对，原记录保留。'));continue;}action(ctx,paper,petName(state.pets[index])+' · '+(t.kind==='Annual'?'年度体检':'清洁护理'),()=>t.kind==='Annual'?openAnnual(index):openClean(index));}
  action(ctx,paper,'返回我的宠物',openOverview);focusFirst(ctx);
 }
 window.PetPages={openOverview,openDetail,openBasicFees,openPetInsurance,openAdoption,openClean,openAnnual,openDueCare,close};
 // The same living receipt covers both the combined bill and individual pet payments.
 function unpaidBasicFees(){return (state?.pets||[]).flatMap((p,index)=>{const q=PetBasicFees.quote(state,index,basicFeeOptions());return q?.due>.005?[{kind:'petBasicFee',name:petName(p)+' · 每月费用',due:q.due,action:()=>openBasicFees(index)}]:[];});}
 const basicFeeBillsBefore=necessaryBills;necessaryBills=function(){const rows=basicFeeBillsBefore(),pets=unpaidBasicFees();if(!pets.length)return rows;
  const total=roundCash(pets.reduce((n,r)=>n+r.due,0));let remaining=total;
  const adjusted=rows.flatMap(r=>{if(!['living','livingBill'].includes(r.kind)||remaining<=0)return [r];const removed=Math.min(r.due,remaining);remaining=roundCash(remaining-removed);const due=roundCash(r.due-removed);return due>.005?[{...r,due}]:[];});
  return [...adjusted,...pets];
 };
 const basicFeeTownBefore=showTown;showTown=function(){
  // Preserve already-drawn cards, medical/incident handling, and forced returns.
  if(!state||townPending()||state.requiredIncident||healthTreatmentKind(state.health)||unfinishedTreatment()||timeReturnPending())return basicFeeTownBefore.apply(this,arguments);
  if(unpaidBasicFees().length){close();A.close();townVisible=false;return openNecessaryBills();}return basicFeeTownBefore.apply(this,arguments);
 };
 document.getElementById('petBtn').onclick=()=>{if(!state)return;if((state.pets||[]).length)openOverview();else selection();};
 // Navigation cannot leave an actionable pet overlay attached to another slot/page.
 for(const name of ['home','openGame','openRoom']){const before=window[name];window[name]=function(...args){close();A.close();return before.apply(this,args);};}
 document.addEventListener('keydown',e=>{if(!active)return;if(e.key==='Escape'){e.preventDefault();openOverview();return;}if(e.key!=='Tab')return;const list=[...active.querySelectorAll('button,input')].filter(b=>!b.disabled&&b.getClientRects().length),first=list[0],last=list.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}});
})();
