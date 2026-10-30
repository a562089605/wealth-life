// Confirmed relationship changes; existing legacy social/month receipts are retained.
(function(){
 const R=RelationshipRules,art='assets/career/';let generation=0;
 function ensure(){const d=R.init(state);state.people??=[];for(const [i,p] of state.people.entries())if(p.id==null)p.id='legacy-relationship-'+i;return d;}
 function identity(p){const unit=R.init(state).units.find(u=>u.id===p.workUnitId),current=state.job&&!state.retired&&!state.unemployedMonths&&state.currentWorkUnitId===p.workUnitId;return [p.gender==='male'?'男':p.gender==='female'?'女':null,Number.isFinite(p.age)?Math.floor(p.age)+'岁':null,p.origin==='work'?(current?'':'原')+(p.status==='经理'||p.status==='上司'?'经理':'同事'):(p.status||p.job),unit?.name||(p.origin==='work'?'原单位未记录':null)].filter(Boolean).join(' · ');}
 function stylePanel(){const e=$('eventTitle').closest('.event');e.classList.add('life-pages-painted','social-pages-painted');}
 function node(tag,text,cls){const e=document.createElement(tag);if(text!=null)e.textContent=text;if(cls)e.className=cls;return e;}
 function button(label,fn,disabled=false){const b=node('button',label);b.disabled=disabled;b.onclick=fn;return b;}
 function paint(title,image,rows,choices){
  showEvent('关系',title,'',[],[]);stylePanel();const owner=state,month=state.month,view=++generation;
  const stage=node('div',null,'relationship-stage');stage.style.backgroundImage='url("'+art+image+'.webp")';
  const paper=node('div',null,'relationship-sheet');for(const [k,v]of rows){const row=node('p');row.append(node('strong',k+' '),node('span',String(v)));paper.append(row)}
  const controls=node('div',null,'relationship-controls');
  for(const [label,fn,disabled]of choices)controls.append(button(label,()=>{if(owner!==state||state.month!==month||view!==generation||!stage.isConnected||!stage.closest('.event')?.classList.contains('event-active'))return;fn()},disabled));
  stage.append(paper,controls);$('eventData').replaceChildren(stage);$('eventData').style.display='block';return {stage,paper,owner,month,view};
 }
 function guarded(pane,fn){return ()=>{if(state!==pane.owner||state.month!==pane.month||generation!==pane.view||!pane.stage.isConnected||!pane.stage.closest('.event')?.classList.contains('event-active'))return;fn()}}
 function outcome(p){state.socialSequence=(state.socialSequence||0)+1;const i=state.people.indexOf(p),scene=SOCIAL_SCENES[(state.month+i*2+state.socialSequence)%SOCIAL_SCENES.length],success=Math.random()<Math.max(.2,Math.min(.98,.8+attributeModifier()+(roleTrait().socialBonus||0)*.025));return {scene:scene.title,success,gain:success?scene.gain+(roleTrait().socialBonus||0):R.failureGain(Math.random),happiness:success?scene.happiness:-2};}
 const previousTime=currentCareerTime;currentCareerTime=function(){const t=previousTime();if(!state||t.recoveryPending||isRecoveryMonth(state))return t;return {...t,free:Math.max(0,t.free-R.hours(state)+(state.relationshipV1?.bonusHours?.[state.month]||0)),relationshipHours:R.hours(state)};};
 function context(){return {free:currentCareerTime().free,blocked:ordinaryRecoveryActivityBlocked(),outcome};}
 function execute(r){const result=R.execute(state,r,context());if(!result)return false;save();const image=r.kind==='socialVisit'?'friends-home-visit':null;
  const rows=[['已支付',priceText(r.cost)],['自由时间减少',r.hours+'小时'],['实际能量减少',Math.abs(r.effects.energy)],['实际幸福度变化',r.effects.happiness],...r.people.map((id,i)=>{const p=state.people.find(p=>p.id===id),o=r.outcomes[i];return [p.name,o.scene+' · 亲密度'+(o.appliedGain>0?'+':'')+o.appliedGain+' · 交流幸福影响'+(o.happiness>=0?'+':'')+o.happiness]})];
  if(image)paint('做客结果',image,rows,[['返回联系人',openContacts],['继续',finish]]);
  else{showEvent('关系结果',r.outcomes[0].scene,'本次交流已保存，可以主动安排下一次互动。',rows,[['返回联系人',openContacts,true],['继续',finish,false]]);const box=node('div',null,'social-scene');const i=r.kind==='socialMeal'?1:r.kind==='socialCoffee'?2:3;box.style.setProperty('--social-x',(i%2*100)+'%');box.style.setProperty('--social-y',(Math.floor(i/2)*100)+'%');$('eventData').prepend(box);}
  return result;
 }
 function openContacts(){ensure();showEvent('关系','联系认识的人','',[],[['返回',finish,false]]);stylePanel();const pane={owner:state,month:state.month,view:++generation};const stage=node('div',null,'social-address-desk'),paper=node('div',null,'social-address-sheet');pane.stage=stage;
  const count=(state.relationshipV1?.actions||[]).filter(r=>r.status==='resolved'&&r.month===state.month).length;paper.append(node('p','本月已安排 '+count+' 次互动；可重复安排。'));
  if(!state.people.length)paper.append(node('p','通讯录还是空白的。通过工作、地图等实际相识后，会记录在这里。'));
  for(const p of state.people){const done=R.contacted(state,p,state.month);const b=button('',guarded(pane,()=>openSocialPerson(state.people.indexOf(p))));b.className='social-contact';b.append(node('strong',p.name),node('small',identity(p)),node('small','亲密度 '+Math.round(p.relation)+'/100 · '+(done?'本月已联系':'本月尚未联系')));paper.append(b)}
  stage.append(paper);$('eventData').replaceChildren(stage);$('eventData').style.display='block';
  // showEvent already supplied the monthly acknowledgement; move that real node into the plaque.
  const confirm=[...$('actions').querySelectorAll('button')].find(b=>b.textContent.startsWith('确认本月关系安排'));if(confirm){confirm.classList.add('social-address-confirm');stage.append(confirm)}
 }
 $('networkBtn').onclick=openContacts;
 openSocialPerson=function(i){ensure();const p=state.people[i];if(!p)return;
  showEvent('关系互动',p.name,'每次确认分别结算，可重复安排。',[['人物资料',identity(p)],['亲密度',Math.round(p.relation)+'/100'],['剩余自由时间',currentCareerTime().free+'小时'],...((rows)=>rows.length?rows.map(x=>['兴趣技能',x.skill+(x.xp==null?' · 经验未记录':' · Lv.'+x.level+' · '+x.xp+' XP')]):[['兴趣资料','兴趣未记录']])(R.interestRows(p))],[]);stylePanel();const pane={owner:state,month:state.month,view:++generation,stage:null};
  const list=node('div',null,'social-option-list');pane.stage=list;[['一起吃饭 · 45 · 2h','socialMeal',1],['聊天 · 免费 · 1h','socialCoffee',2],['散步交流 · 免费 · 1h','socialWalk',3]].forEach(([label,kind,scene])=>{
   const plan=R.plans[kind],r=R.begin(state,kind,[p.id]),b=button(label,guarded(pane,()=>execute(r)),!R.check(state,r,context()));b.className='social-option';const img=node('div',null,'social-scene');img.style.setProperty('--social-x',(scene%2*100)+'%');img.style.setProperty('--social-y',(Math.floor(scene/2)*100)+'%');b.prepend(img);list.append(b);
  });$('eventData').append(list,node('p','每次能量−2；亲密度和幸福度随交流结果变化。吃饭需亲密度≥21。'));
  $('actions').append(button('邀请做客 · 亲密度≥51',guarded(pane,()=>openVisit(p.id)),p.relation<51),button('返回联系人',guarded(pane,openContacts)));save();
 };
 // Old callback signatures cannot bypass the current preview transaction.
 doSocial=function(){return false};
 function openVisit(first,selected=new Set([first])){
  if(ordinaryRecoveryActivityBlocked())return showRecoveryActivityRestriction();ensure();const ids=[...selected],n=ids.length;
  const r=R.begin(state,'socialVisit',ids);const pane=paint('邀请朋友做客','friends-home-visit',[['邀请人数',n+'/5'],['总费用',priceText(30*n)],['自由时间',3+'小时'],['能量消耗',2*n],['说明','可重复邀请，每位亲密度需≥51。'],['当前条件',!state.housing||state.housing==='unselected'?'请先确认入住住房':state.energy<2*n?'能量不足':currentCareerTime().free<3?'自由时间不足':state.cash<30*n?'现金不足':'可以邀请']],[[`确认邀请 · ${priceText(30*n)}`,()=>execute(r),!R.check(state,r,context())],['返回联系人',openContacts]]);
  const list=node('div',null,'relationship-guests');for(const p of state.people.filter(p=>p.relation>=51)){const label=node('label'),input=document.createElement('input');input.type='checkbox';input.checked=selected.has(p.id);input.disabled=!input.checked&&selected.size>=5;input.onchange=guarded(pane,()=>{const next=new Set(selected);if(input.checked)next.add(p.id);else next.delete(p.id);openVisit(first,next)});label.append(input,node('span',p.name+' · '+Math.round(p.relation)));list.append(label)}pane.paper.append(list);save();
 }
 // Backup must succeed before any relationship upgrade is written to the original slot.
 const beforeSave=save;save=function(){if(!state)return beforeSave();try{const k=key(slot),raw=localStorage.getItem(k),backups=[k+'_before_relationship_v1',k+'_before_relationship_logic_v2'];for(const backup of backups)if(raw&&localStorage.getItem(backup)===null)localStorage.setItem(backup,raw);}catch(e){showEvent('关系兼容','暂未覆盖原存档','关系升级备份未能保存。请释放空间或导出存档后重试。',[],[['返回',()=>clearModals(),true]]);return false;}return beforeSave();};
 // Export only map-card adapters; no new probabilities or random card selector are installed.
 window.RelationshipUI={openContacts,openVisit,paint,identity};
})();

