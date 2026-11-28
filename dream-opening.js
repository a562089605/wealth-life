(function(){
 const illustrations={
  dreamHome:['自己的房子',0],dreamBookshop:['咖啡书店',1],dreamFilm:['拍自己的电影',2],
  dreamRest:['躺平',3],dreamSchool:['捐一座学校',4],dreamTravel:['环球旅行',5],
  dreamPark:['建造游乐园',6],dreamCruise:['环球邮轮',7],dreamScholarship:['助学基金',8],
  dreamRetire:['提前退休',9]
 };
 const dollars=value=>money(value).replace(/\.00$/,'');
 const make=(tag,text,className)=>{
  const el=document.createElement(tag);
  if(text)el.textContent=text;
  if(className)el.className=className;
  return el;
 };
 let starting=false;

 function choose(){
  const panel=make('section','','dream-opening');
  panel.id='dreamOpening';
  panel.setAttribute('aria-labelledby','dreamOpeningTitle');
  const career=$('job');
  const back=make('button','← 返回职业选择','dream-back');
  back.type='button';
  back.onclick=()=>{
   career.dispatchEvent(new Event('change',{bubbles:true}));
   $('wlJob').querySelector('[data-career-selection=browse]')?.focus();
  };
  const title=make('h2','选择你的梦想');
  title.id='dreamOpeningTitle';
  const heading=make('p','已选职业：'+JOBS[career.value][0].split(' ')[0],'dream-career');
  const list=make('fieldset','','dream-options');
  list.append(make('legend','梦想及所需资金','dream-sr'));
  for(const [id,goal] of Object.entries(DreamGoals.goals)){
   const [label,index]=illustrations[id];
   const item=make('label','','dream-option');
   const radio=make('input');
   radio.type='radio';
   radio.name='openingDream';
   radio.value=id;
   const name=make('strong',label);
   const amount=make('span',dollars(goal.target));
   const icon=make('span','','dream-illustration');
   icon.style.backgroundPositionX=(index*100/9)+'%';
   icon.setAttribute('aria-hidden','true');
   item.append(radio,name,amount,icon);
   list.append(item);
  }
  const confirm=make('button','确认梦想，开始新人生','dream-primary');
  confirm.type='button';
  confirm.disabled=true;
  list.onchange=()=>{confirm.disabled=!list.querySelector(':checked');};
  confirm.onclick=()=>{
   const selected=list.querySelector(':checked');
   if(!selected||starting)return;
   $('lifeGoal').value=selected.value;
   $('lifeGoal').onchange();
   starting=true;
   confirm.disabled=true;
   try{$('start').click();}
   finally{
    starting=false;
    if($("home").classList.contains("hidden"))career.dispatchEvent(new Event("change",{bubbles:true}));
    else confirm.disabled=false;
   }
  };
  panel.append(back,title,heading,list,confirm);
  $('wlJob').replaceChildren(panel);
  back.focus();
 }

 function initialize(s){
  if(starting&&DreamGoals.selected(s))s.dreamWelcome='pending';
 }

 function welcome(){
  if(state?.dreamWelcome!=='pending'||document.getElementById('dreamWelcome'))return;
  const goal=DreamGoals.selected(state);
  if(!goal)return;
  const owner=state;
  const dialog=make('dialog','','dream-welcome');
  dialog.id='dreamWelcome';
  dialog.setAttribute('aria-labelledby','dreamWelcomeTitle');
  const title=make('h2','欢迎回家');
  title.id='dreamWelcomeTitle';
  const label=make('p','你的梦想','dream-career');
  const dream=make('p',goal.name+' · '+dollars(goal.target),'dream-welcome-goal');
  const stage=make('h3','第一阶段 · 积累资产');
  const instruction=make('p','让过去 12 个月的资产净收入覆盖同期必要支出，并留足 6 个月必要支出的储备。');
  const encouragement=make('p','从今天的小决定开始，慢慢走向你想要的生活。','dream-encouragement');
  const status=make('p');
  status.setAttribute('role','status');
  status.hidden=true;
  const close=make('button','开始本月安排','dream-primary');
  close.type='button';
  close.onclick=()=>{
   if(state!==owner){dialog.close();return;}
   state.dreamWelcome='seen';
   try{
    if(save()===false)throw Error('Could not save dream welcome');
    dialog.close();
   }catch{
    state.dreamWelcome='pending';
    status.textContent='暂未保存，请再试一次。';
    status.hidden=false;
   }
  };
  dialog.addEventListener('cancel',event=>event.preventDefault());
  dialog.addEventListener('close',()=>dialog.remove(),{once:true});
  dialog.append(title,label,dream,stage,instruction,encouragement,status,close);
  document.body.append(dialog);
  dialog.showModal();
 }

 window.DreamOpening={choose,initialize,welcome};
})();
