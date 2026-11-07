// V28.10: approved seven-pet adoption cards on the existing save transactions.
(function(){
 const A=PetAdoptionEntry,asset=id=>id==='adoption-dog'?'assets/pets/adoption-card-20261105.webp':['detail-actions','monthly-fee'].includes(id)||(id.startsWith('annual-')||id.startsWith('insurance-'))?'assets/pets/'+id+'-20261106.webp':'assets/pets/'+id+'-20261104.webp';
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
 function healthValue(p){return typeof PetHealth!=='undefined'?PetHealth.value(p):80;}
 function needsVet(p){return typeof PetHealth!=='undefined'&&(!!PetHealth.activeVet(p)||healthValue(p)===0);}
 function healthLabel(p){return needsVet(p)?'待就医':healthValue(p)<=30?'生病风险档位 75%':healthValue(p)<50?'生病风险档位 50%':'状态平稳';}
 function petName(p){return p.name||cfg(p)?.name||p.type||'待核对宠物';}
 function petInsurancePolicy(p){return PetInsurance.held(state,p);}
 function petInsuranceStatus(p){const policy=petInsurancePolicy(p);return !policy?'未投保':Number.isInteger(policy.stopMonth)?'下月停保':Number.isInteger(policy.startMonth)&&policy.startMonth>state.month?'待生效':'已投保';}
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
  for(const [index,p]of pets.entries()){const b=document.createElement('button');b.type='button';b.className='pet-tile';b.setAttribute('aria-label','查看'+petName(p));const id=spec(p);if(A.pets[id])b.append(portrait(asset('success-'+id)));b.append(textNode('strong',petName(p)),textNode('small','健康 '+healthValue(p)+'/100'+(needsVet(p)?' · 待就医':due(p,'Clean').length?' · 护理到期':''),'pet-tile-health'),textNode('small','点击查看 ›'));b.onclick=()=>{if(validPet(ctx,p,index))openDetail(index);};grid.append(b);}
  const add=document.createElement('button');add.type='button';add.className='pet-add-tile';add.setAttribute('aria-label','领养新伙伴');add.innerHTML='<span aria-hidden="true">＋</span><strong>领养新伙伴</strong>';add.onclick=()=>{if(ctx.valid())selection();};grid.append(add);paper.append(grid);if(state.petMemorials?.length)action(ctx,paper,'离世记录（'+state.petMemorials.length+'）',openMemorials);action(ctx,paper,'返回房屋',room);ctx.node.append(paper);focusFirst(ctx);
 }
 function openMemorials(){const ctx=panel('宠物离世记录'),paper=plain(ctx,'宠物离世记录');for(const p of state.petMemorials||[])paper.append(textNode('h3',petName(p)),textNode('p',calendar(p.diedMonth)+'末 · 已离世'),textNode('p','因健康归零后三个月内未接受治疗而离世。'));action(ctx,paper,'返回我的宠物',openOverview);focusFirst(ctx);}
 function showDeathNotice(after){if(!state||typeof PetHealth==='undefined'||!state.petMemorials?.length||state.gameOver?.final||state.financialCrisis?.finalConfirmed)return false;const rows=PetHealth.pendingNotices(state);if(!rows.length)return false;close();A.close();const owner=state,month=state.month,chosenSlot=slot,ids=rows.map(p=>p.deathCaseId);
  showEvent('宠物健康','宠物离世',rows.map(p=>petName(p)+'因三个月内未接受治疗，已离世。').join('\n'),rows.map(p=>[esc(petName(p)),calendar(p.diedMonth)+'末']),[['知道了',()=>{if(state!==owner||state.month!==month||slot!==chosenSlot)return;if(!PetHealth.acknowledgeDeaths(state,ids,save)){document.getElementById('eventDesc').textContent='记录暂未保存，请重试。';document.getElementById('actions').firstElementChild.disabled=false;return;}clearModals();after?.();},true]]);return true;
 }
 window.showPetDeathNotice=showDeathNotice;
 function openDetail(index){const p=state.pets?.[index];if(!p)return openOverview();const c=cfg(p);if(!c){const ctx=panel('宠物资料'),paper=plain(ctx,'宠物资料待核对');paper.append(textNode('p',petName(p)+'：保留旧记录，不重新领养或收费。'));action(ctx,paper,'查看原照护',()=>{close();legacyOpenCare();});action(ctx,paper,'返回我的宠物',openOverview);return;}
  const ctx=panel(c.name+'的资料'),e=canvas(ctx,'detail-actions');ctx.node.classList.add('pet-detail-overlay');
  if(spec(p)!=='dog'){const hero=box(e,'',0,9,100,25.4,'pet-detail-hero');hero.append(portrait(asset('success-'+spec(p))));}
  box(e,petName(p)+' · '+c.name,22,35.1,56,4.2,'pet-name');
  hit(ctx,e,'每月费用',4,44.5,92,9.5,()=>{if(validPet(ctx,p,index))openBasicFees(index);});
  hit(ctx,e,'日常照顾',4,54.7,92,9.3,()=>{if(validPet(ctx,p,index))openClean(index);});
  hit(ctx,e,'年度体检',4,64.9,92,9.3,()=>{if(validPet(ctx,p,index))openAnnual(index);});
  hit(ctx,e,'保险',4,74.8,92,9.3,()=>{if(validPet(ctx,p,index))openPetInsurance(index);});
  hit(ctx,e,'返回我的宠物',6,86.8,88,6.4,openOverview);
  hit(ctx,e,'返回房屋',26,94.3,49,4.4,room);
  hit(ctx,e,'返回我的宠物',2,1,13,7,openOverview);healthCard(ctx,p,index,e);focusFirst(ctx);
 }
 function healthCard(ctx,p,index,parent){const b=action(ctx,parent,'',()=>{if(validPet(ctx,p,index))openHealth(index);});b.className='pet-health-card'+(needsVet(p)?' pet-health-critical':healthValue(p)<50?' pet-health-warning':'');b.setAttribute('aria-label','查看'+petName(p)+'的健康状况');
  const line=textNode('span','','pet-health-card-line');line.append(textNode('span','健康度'),textNode('strong',healthValue(p)+' / 100','pet-health-value pet-health-status'),textNode('small',needsVet(p)?'待就医':healthValue(p)<50?healthLabel(p).replace('生病风险档位 ','生病'):due(p,'Clean').length?'护理到期':due(p,'Annual').length?'体检到期':'状态平稳'));const painted=textNode('span','','pet-health-painted');painted.append(line);
  const meter=textNode('span','','pet-health-meter'),fill=textNode('span','','pet-health-fill');meter.setAttribute('role','progressbar');meter.setAttribute('aria-label','健康度');meter.setAttribute('aria-valuemin','0');meter.setAttribute('aria-valuemax','100');meter.setAttribute('aria-valuenow',String(healthValue(p)));fill.style.width=healthValue(p)+'%';meter.append(fill);painted.append(meter);b.append(painted);
 }
 function openHealth(index){const p=state.pets?.[index];if(!p||typeof PetHealth==='undefined')return openOverview();const ctx=panel('宠物健康状况'),paper=plain(ctx,petName(p)+' · 健康状况'),q=PetHealth.quoteVet(state,index);
  paper.append(textNode('p','健康度 '+healthValue(p)+' / 100','pet-health-heading'),textNode('p',healthLabel(p),'pet-health-current'));
  const tiers=document.createElement('dl');tiers.className='pet-health-tiers';for(const [range,meaning]of [['50–100','常规生病风险'],['31–49','生病事件占比50%'],['1–30','生病事件占比75%'],['0','需要就医，治疗后恢复80']])tiers.append(textNode('dt',range),textNode('dd',meaning));paper.append(tiers);
  paper.append(textNode('p','生病占比按该宠物可抽事件计算，仍受每月次数上限限制。清洁护理每次恢复20，上限100。'));
  if(q){paper.append(textNode('h3','疏忽照护治疗'));const bill=document.createElement('dl');bill.className='pet-health-tiers';for(const [label,v]of [['治疗总费',priceText(q.total)],['保险报销'+Math.round(q.coverage*100)+'%',priceText(q.insurancePaid)],['实际自付',priceText(q.due)],['本人自由时间',q.hours+' 小时'],['治疗截止',calendar(q.deadlineMonth)+'末'],['治疗后健康','80 / 100']])bill.append(textNode('dt',label),textNode('dd',v));paper.append(bill,textNode('p','三个月内未完成治疗，宠物将离世。待就医期间暂停新的普通宠物地图事件，完成治疗后恢复。疏忽照护治疗保险最多赔付50%。需先完成治疗，再安排清洁护理。'));
   const status=message(paper);action(ctx,paper,'确认治疗 · '+priceText(q.due),b=>{if(paying||!validPet(ctx,p,index))return;paying=true;b.disabled=true;const result=PetHealth.confirmVet(state,index,q.token,()=>{backup();return save();},{free:currentCareerTime().free});paying=false;
    if(!result.ok){b.disabled=false;status.textContent=result.reason==='cash'?'现金不足，尚未治疗。':result.reason==='time'?'自由时间不足，尚未治疗。':'暂未完成，请重试。';return;}render();openDetail(index);
   },state.cash<q.due||currentCareerTime().free<q.hours);
   if(currentCareerTime().free<q.hours)status.textContent='需要'+q.hours+'小时自由时间，当前剩余'+currentCareerTime().free+'小时。';
   if(state.cash<q.due){status.textContent='现金不足，可向银行申请贷款。';action(ctx,paper,'前往银行贷款',()=>{close();openBankLoan(Math.max(1,Math.ceil(q.due-state.cash)),{after:()=>{if(state===ctx.owner&&slot===ctx.chosenSlot&&state.month===ctx.month)openHealth(index);}});});action(ctx,paper,'查看筹款方式',()=>{close();showFundingOptions(q.due,()=>{if(state===ctx.owner&&slot===ctx.chosenSlot&&state.month===ctx.month)openHealth(index);});});}
  }
  action(ctx,paper,'前往日常照顾',()=>openClean(index));action(ctx,paper,'返回宠物资料',()=>openDetail(index));focusFirst(ctx);
 }
 function basicFeeOptions(){return {prices:Object.fromEntries([...Object.entries(PETS).map(([type,c])=>[type,c.monthly]),...Object.entries(A.pets).flatMap(([id,c])=>[[id,PETS[c.type]?.monthly],[c.name,PETS[c.type]?.monthly]])]),nonPetLiving:roundCash(livingBaseAmount(state)+(state.carRunningCost||0))};}
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
 function openInsuranceSelection(){const pets=state.pets||[];if(pets.length===1)return openPetInsurance(0);const ctx=panel('选择宠物保险'),paper=plain(ctx,'宠物保险');paper.append(textNode('p','自愿选择投保的伙伴，每只宠物单独计费，已投保的保费相加。普通生病、受伤医疗费全额赔付；疏忽照护治疗最多赔付50%，物损自付。'));
  if(!pets.length)paper.append(textNode('p','领养伙伴后可选择投保。'));
  for(const [index,p]of pets.entries()){const q=PetInsurance.quote(state,index);if(q)action(ctx,paper,petName(p)+' · '+petInsuranceStatus(p)+' · '+priceText(q.monthly)+'/月',()=>{if(validPet(ctx,p,index))openPetInsurance(index);});}
  action(ctx,paper,'返回我的宠物',openOverview);focusFirst(ctx);
 }
 function openPetInsurance(index){const p=state.pets?.[index],q=PetInsurance.quote(state,index);if(!p||!q)return openOverview();const ctx=panel('宠物保险'),held=q.held,e=canvas(ctx,'insurance-'+q.species,'981/1602');e.setAttribute('role','group');e.setAttribute('aria-label',petName(p)+'，'+petInsuranceStatus(p)+'，每月保费 '+priceText(q.monthly)+(held?'':'，本次支付 '+priceText(q.due))+'，自愿投保，医疗费赔付 '+Math.round(q.coverage*100)+'%，物损自付');
  ctx.node.classList.add('pet-insurance-overlay');box(e,petName(p),34,36.8,32,4.8,'pet-insurance-name');
  box(e,petInsuranceStatus(p),66,47.6,26,5.4,'pet-insurance-state');
  box(e,priceText(q.monthly),69,57.8,22,5.2,'pet-insurance-value');
  box(e,held?'医疗赔付':'本次支付',35,69.3,27,4.8,'pet-insurance-total-label');
  box(e,held?(q.coverage===null?'待核对':Math.round(q.coverage*100)+'%'):priceText(q.due),69,69,22,5.4,'pet-insurance-value');
  box(e,'普通医疗全赔 · 疏忽治疗赔50% · 物损自付',10,78,80,2.5,'pet-insurance-note');
  if(held&&q.coverage!==1)box(e,'普通医疗按原比例 · 疏忽治疗最多赔50%',10,78,80,2.5,'pet-insurance-note');
  const label=held?(held.stopMonth!==undefined?'已安排下月停保':'下月停保'):'确认投保';
  if(held)box(e,label,25,82.8,50,4.4,'pet-insurance-pay-label');
  const status=message(ctx.node);const button=hit(ctx,e,label,5,80.5,90,8.8,b=>{if(paying||!validPet(ctx,p,index))return;
   if(held){if(PetInsurance.quote(state,index)?.token!==q.token){status.textContent='保单已变化，请返回重新查看。';return;}return openStopInsurance(index,q);}
   paying=true;b.disabled=true;
   const result=PetInsurance.confirm(state,index,q.token,insuranceSave);paying=false;
   if(!result.ok){b.disabled=false;status.textContent=result.reason==='cash'?'现金不足，尚未投保。':'暂未完成，请返回核对或重试。';return;}render();openPetInsurance(index);
  });button.disabled=held?held.stopMonth!==undefined:state.cash<q.due;
  status.textContent=q.policyKey==='pet'?'旧版共用保单，按原合同续保。':held&&held.pricingVersion!==3?'本月原保费保留；下月起按 '+priceText(q.baseMonthly)+'/月单独续保。':'每月保费 '+priceText(q.baseMonthly)+'，仅保障这位伙伴；其他宠物可单独投保。';
  if(held?.stopMonth!==undefined)status.textContent='本月保障保留，'+calendar(held.stopMonth)+'起停止续保和保障。';
  if(!held&&state.cash<q.due)status.textContent='现金不足，尚未投保。';
  if(held&&Number.isInteger(held.startMonth)&&held.startMonth>state.month)status.textContent='生效时间：'+calendar(held.startMonth);
  hit(ctx,e,'返回宠物资料',5,90.7,90,7.2,()=>openDetail(index));hit(ctx,e,'返回宠物资料',2,1,13,7,()=>openDetail(index));focusFirst(ctx);
 }
 function insuranceSave(){backup();const k=key(slot),raw=localStorage.getItem(k),bk=k+'_before_pet_insurance_20261106';if(raw&&!localStorage.getItem(bk))localStorage.setItem(bk,raw);return save();}
 function openStopInsurance(index,q){const p=state.pets[index],ctx=panel('下月停保'),paper=plain(ctx,petName(p)+' · 下月停保');
  paper.append(textNode('p',q.policyKey==='pet'?'这是旧版共用保单，停保会同时影响该保单保障的所有宠物。':'仅停止这位伙伴的保险。'));
  paper.append(textNode('p','本月保障保留，不退本月保费。'+calendar(state.month+1)+'起停止续保和保障。'));
  const status=message(paper);action(ctx,paper,'确认下月停保',b=>{if(paying||!validPet(ctx,p,index))return;paying=true;b.disabled=true;const result=PetInsurance.stop(state,index,q.token,insuranceSave);paying=false;
   if(!result.ok){b.disabled=false;status.textContent='暂未完成，请返回核对或重试。';return;}render();openPetInsurance(index);
  });action(ctx,paper,'保留保险',()=>openPetInsurance(index));focusFirst(ctx);
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
   sum.innerHTML='<small>已选方式　／　本次费用　／　自由时间</small><strong>'+label(selected)+'　'+priceText(amount(selected))+'　减少 '+hours(selected)+' 小时</strong>';date.textContent=needsVet(p)?'需要先就医，治疗后可按周期护理':ready?'完成清洁：健康+20（上限100），重新计算下次护理':'尚未到期，仅可预览，不提前收费';b.disabled=!ready||needsVet(p);b.setAttribute('aria-label',ready?'确认选择':'尚未到期，不能确认支付');}
  update();focusFirst(ctx);
 }
 function openAnnual(index){const p=state.pets?.[index],id=p&&spec(p),rule=PET_CARE_RULES[id];if(!p||!rule)return openDetail(index);
  const ctx=panel('年度体检'),s=preview(),cp=s.pets[index],e=canvas(ctx,'annual-'+id,'981/1602');
  const cost=roundCash(rule.annual*(state.cpiIndex||100)/100),hours=isRecoveryMonth(state)?0:rule.annualHours,ready=due(p,'Annual').length>0;
  e.setAttribute('role','group');e.setAttribute('aria-label',petName(p)+'，年度体检，每年一次，下次体检：'+calendar(cp.care?.nextAnnual)+'，体检费用 '+priceText(cost)+'，自由时间 '+hours+' 小时');
  box(e,petName(p),34,36.5,32,4.8,'pet-annual-name');
  if(cp.care?.nextAnnual!==12)box(e,'下次体检：'+calendar(cp.care?.nextAnnual),20,55.2,61,4.4,'pet-annual-date');
  if(cost!==rule.annual)box(e,priceText(cost),24,67.8,23,4.9,'pet-annual-value');
  if(hours!==rule.annualHours)box(e,hours+'小时',69,67.8,23,4.9,'pet-annual-value');
  if(ready)box(e,'核对体检费用',25,81.1,50,4.8,'pet-annual-action-label');
  hit(ctx,e,ready?'核对体检费用':'尚未到期',8,79.5,84,7.8,()=>{if(validPet(ctx,p,index))openCareConfirm(index,'Annual','annual');},ready?'pet-annual-ready':'').disabled=!ready;
  hit(ctx,e,'返回宠物资料',7,89.2,86,8.2,()=>openDetail(index));hit(ctx,e,'返回宠物资料',2,1,13,7,()=>openDetail(index));focusFirst(ctx);
 }
 function openCareConfirm(index,kind,method){const p=state.pets?.[index];if(!p)return openOverview();const target=copy(p),s=preview(),task=petCareTasks(s).find(t=>t.pet===s.pets[index]&&t.kind===kind);if(!task)return openDetail(index);
  const selections={[task.key]:method},q=petCareQuote(s,selections),ctx=panel('核对照护费用'),paper=plain(ctx,'核对'+petName(p)+'的照护费用');
  if(q.blocked){paper.append(textNode('p',q.blocked));action(ctx,paper,'返回宠物资料',()=>openDetail(index));return;}
  paper.append(textNode('p',(kind==='Annual'?'年度体检':method==='self'?'自行清洁':'专业清洁')+' · '+priceText(q.cost)+' · '+q.hours+' 小时'),textNode('p','支付后现金：'+priceText(state.cash-q.cost)));if(kind==='Clean')paper.append(textNode('p','护理后健康：'+healthValue(p)+' → '+Math.min(100,healthValue(p)+20)+'/100'));const status=message(paper);
  action(ctx,paper,'确认支付',b=>{if(paying||!validPet(ctx,target,index))return;const fresh=preview(),t=petCareTasks(fresh).find(t=>t.pet===fresh.pets[index]&&t.key===task.key);if(!t)return;const nq=petCareQuote(fresh,selections);if(nq.blocked||nq.cost!==q.cost||nq.hours!==q.hours){status.textContent='条件已变化，请返回重新核对。';return;}
   paying=true;b.disabled=true;const before=copy(state);let ok=false;try{backup();ok=payPetCare(selections);}catch(e){for(const k of Object.keys(state))delete state[k];Object.assign(state,before);}finally{paying=false;}
   if(!ok){b.disabled=false;status.textContent='暂未完成：未结算费用、时间或照护日期，请检查余额和时间后重试。';return;}openDetail(index);
  },state.cash<q.cost||currentCareerTime().free<q.hours);
  if(state.cash<q.cost){status.textContent='现金不足，尚未扣款。';action(ctx,paper,'前往银行',()=>{close();openBankLoan(Math.max(1,Math.ceil(q.cost-state.cash)),{after:()=>{if(state===ctx.owner&&slot===ctx.chosenSlot&&state.month===ctx.month&&state.pets[index]===p)openCareConfirm(index,kind,method);}});});}
  if(currentCareerTime().free<q.hours)status.textContent='自由时间不足，尚未扣款或扣时。';action(ctx,paper,'返回调整',()=>kind==='Clean'?openClean(index):openAnnual(index));focusFirst(ctx);
 }
 const legacyOpenCare=openPetCare;openPetCare=function(){if(paying)return;return openDueCare();};
 function openDueCare(){if(!state)return;const ctx=panel('到期宠物照护'),paper=plain(ctx,'到期宠物照护'),s=preview(),tasks=petCareTasks(s);if(!tasks.length)paper.append(textNode('p','目前没有到期照护。'));
  for(const t of tasks){const index=s.pets.indexOf(t.pet);if(t.unsupported){paper.append(textNode('p',petName(state.pets[index])+'：旧物种待核对，原记录保留。'));continue;}action(ctx,paper,petName(state.pets[index])+' · '+(t.kind==='Annual'?'年度体检':'清洁护理'),()=>t.kind==='Annual'?openAnnual(index):openClean(index));}
  if(tasks.some(t=>t.kind==='Clean'))paper.append(textNode('p','清洁护理可以稍后完成。月底仍逾期，每只健康−10；完成清洁护理恢复20，上限100。年度体检沿用原规则。'));
  action(ctx,paper,'返回我的宠物',openOverview);focusFirst(ctx);
 }
 window.PetPages={openOverview,openDetail,openHealth,openBasicFees,openPetInsurance,openInsuranceSelection,openAdoption,openClean,openAnnual,openDueCare,close};
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
 const petInsuranceOpenBefore=openInsurance;openInsurance=function(type){if(type==='pet')return openInsuranceSelection();return petInsuranceOpenBefore.apply(this,arguments);};
 const petInsuranceBuyBefore=buyInsurance;buyInsurance=function(type){if(type==='pet')return openInsuranceSelection();return petInsuranceBuyBefore.apply(this,arguments);};
 document.addEventListener('click',e=>{const b=e.target.closest('[data-pet-insurance]');if(b&&!b.disabled)openInsuranceSelection();});
 document.getElementById('petBtn').onclick=()=>{if(!state)return;if((state.pets||[]).length||state.petMemorials?.length)openOverview();else selection();};
 // Navigation cannot leave an actionable pet overlay attached to another slot/page.
 for(const name of ['home','openGame','openRoom']){const before=window[name];window[name]=function(...args){close();A.close();const result=before.apply(this,args);if(name==='openGame'&&state)showDeathNotice(()=>before.apply(this,args));return result;};}
 document.addEventListener('keydown',e=>{if(!active)return;if(e.key==='Escape'){e.preventDefault();openOverview();return;}if(e.key!=='Tab')return;const list=[...active.querySelectorAll('button,input')].filter(b=>!b.disabled&&b.getClientRects().length),first=list[0],last=list.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}});
})();
