// Keep existing contacts, interactions, outcome rolls and monthly receipt; only arrange their presentation.
(function(){
 const scenes=['联系人手账、电话与明信片','小餐馆里为两人摆好的餐桌','窗边的两杯咖啡与点心','树荫下的长椅与散步小路'];
 function scene(i){const d=document.createElement('div');d.className='social-scene';d.setAttribute('role','img');d.setAttribute('aria-label',scenes[i]);d.style.setProperty('--social-x',(i%2*100)+'%');d.style.setProperty('--social-y',(Math.floor(i/2)*100)+'%');return d;}
 function note(s){const p=document.createElement('p');p.className='life-paper-note';p.textContent=s;return p;}
 function row(label,value){const d=document.createElement('div');d.className='life-paper-row';const l=document.createElement('span'),v=document.createElement('strong');l.textContent=label;v.textContent=value;d.append(l,v);return d;}
 function board(title,i,keep=false){
  if($('eventTitle').textContent!==title)return null;
  const root=$('eventTitle').closest('.event');root.classList.add('life-pages-painted','social-pages-painted');
  const previous=keep?[...$('eventData').childNodes]:[],desc=keep?$('eventDesc').textContent:'',b=document.createElement('div');b.className='life-paper social-paper';
  b.append(row('第'+(Math.floor(state.month/12)+1)+'年 · 第'+(state.month%12+1)+'月','现金 '+priceText(state.cash)),scene(i));if(desc)b.append(note(desc));b.append(...previous);
  $('eventData').replaceChildren(b);$('eventData').style.display='block';return b;
 }
 function actions(){for(const b of $('actions').querySelectorAll('button'))b.dataset.lifePaperAction=b.textContent.startsWith('确认本月')?'review':b.classList.contains('primary')?'confirm':'back';}
 function monthly(b){
  const r=socialRecord();if(!r){b.append(note('本月尚未交流。先查看，再确认相处方式；每月可与一位联系人互动一次。'));return;}
  const p=(state.people||[]).find(p=>(p.id||p.name)===r.person);
  b.append(row('✓ 本月已交流',p?.name||'已记录的联系人'),row('本月交流',r.scene),note('本月交流已完成。查看联系人不会再次扣费或改变关系，下个月可以继续互动。'));
 }
 const networkBefore=$('networkBtn').onclick;
 $('networkBtn').onclick=function(...args){
  const result=networkBefore.apply(this,args),buttons=[...$('actions').querySelectorAll('button')],b=board('联系认识的人',0);if(!b)return result;
  monthly(b);const list=document.createElement('div');list.className='social-contact-list';
  for(const p of state.people||[]){
   const button=buttons.find(x=>x.getAttribute('aria-label')==='联系 '+p.name||x.textContent==='联系 '+p.name);if(!button)continue;
   const original=button.onclick,owner=state,month=state.month;button.onclick=function(e){if(state!==owner||state.month!==month||!b.isConnected||!state.people.includes(p))return;return original.call(this,e)};
   button.className='social-contact';button.setAttribute('aria-label','联系 '+p.name);
   const seal=document.createElement('span');seal.className='social-contact-seal';seal.setAttribute('aria-hidden','true');seal.textContent=String(p.name||'友').slice(0,1);
   const copy=document.createElement('span');copy.className='social-contact-copy';const name=document.createElement('strong'),identity=document.createElement('small'),stage=document.createElement('small');
   name.textContent=p.name;identity.textContent=p.status||p.job||'已认识的人';stage.textContent=(relationStage(p)?relationStage(p)+' · ':'')+'亲密度 '+Math.round(p.relation)+'/100';copy.append(name,identity,stage);
   const arrow=document.createElement('span');arrow.textContent='›';arrow.setAttribute('aria-hidden','true');button.replaceChildren(seal,copy,arrow);list.append(button);
  }
  if(!list.children.length)b.append(note('暂时还没有联系人。以后认识的新朋友会显示在这里。'));else b.append(list);
  b.append(note('打开联系人不会自动互动或消费。'));actions();return result;
 };
 const personBefore=openSocialPerson;
 openSocialPerson=function(i){
  const result=personBefore(i),p=state.people?.[i];if(!p)return result;
  const title=p.name+' · '+relationStage(p),buttons=[...$('actions').querySelectorAll('button')],b=board(title,0);if(!b)return result;
  b.classList.add('social-person-paper');$('eventTitle').textContent=p.name+(relationStage(p)?' · '+relationStage(p):'');
  b.append(row('身份',p.status||p.job||'已认识的人'),row('亲密度',Math.round(p.relation)+'/100'));monthly(b);
  const descriptions=['在小餐馆坐下来，一起吃顿饭。','找个舒服的位置，聊聊近况。','沿着小路走走，边走边聊。'];
  const options=[['确认一起吃饭 · $45','一起吃饭','$45',1],['确认聊天 · $15','聊天','$15',2],['确认散步交流 · $0','散步交流','$0',3]],list=document.createElement('div');list.className='social-option-list';
  options.forEach(([label,name,cost,s],n)=>{
   const button=buttons.find(x=>x.textContent===label);if(!button)return;const original=button.onclick,owner=state,month=state.month;
   button.onclick=function(e){if(state!==owner||state.month!==month||!b.isConnected||!state.people.includes(p))return;return original.call(this,e)};
   button.className='social-option';button.setAttribute('aria-label',label);button.dataset.socialScene=s;
   const copy=document.createElement('span'),heading=document.createElement('strong'),desc=document.createElement('small'),price=document.createElement('b');heading.textContent=name;desc.textContent=descriptions[n];price.textContent=cost+' · 确认互动';copy.append(heading,desc,price);button.replaceChildren(scene(s),copy);list.append(button);
  });b.append(list);
  b.append(note('确认后能量减少2，社交增加3（受状态上下限影响）；亲密度和幸福度以本次交流结果为准。'));
  if(!socialRecord()&&state.cash<45)b.append(note('灰色选项暂不可选；现金不足时，也可以选择免费的散步交流。'));
  actions();return result;
 };
 const socialBefore=doSocial;
 doSocial=function(...args){
  const previous=socialRecord(),before={energy:state.energy,social:state.social,happiness:state.happiness},result=socialBefore(...args),r=socialRecord();
  if(!r||r===previous)return result;
  const kind=args[3],i=kind==='socialMeal'?1:kind==='socialCoffee'?2:3,b=board(r.scene,i,true);if(!b)return result;
  const p=args[0];b.append(row('本次交流',p.name),row('本次已支付',priceText(r.cost)),row('能量变化',signed(state.energy-before.energy)),row('社交变化',signed(state.social-before.social)),row('幸福度变化',signed(state.happiness-before.happiness)),note('本月交流已记录。返回联系人只查看结果，不会重复付款或再次抽取结果。'));
  const returnButton=document.createElement('button');returnButton.textContent='返回联系人';returnButton.onclick=()=>$('networkBtn').click();$('actions').prepend(returnButton);actions();return result;
 };
 function signed(n){return(n>0?'+':'')+n;}
 const before=showEvent;showEvent=function(...args){document.querySelector('.social-pages-painted')?.classList.remove('social-pages-painted');return before(...args)};
})();
