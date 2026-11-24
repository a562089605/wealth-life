(() => {
 'use strict';
 const maxSlots=100, sessionKey='wealthLife_cloud_session', draftKey='wealthLife_cloud_registration', countKey='wealthLife_slotCount';
 const legacyKey=key, localSave=save, localBuild=buildHome;
 const homePanel=$('home'), slots=$('slots'), newGame=$('newGame');
 let account=null, ledger={}, transmitting=false, conflicts={}, retryTimer, showEntry;
 const readJSON=(storage,k,fallback)=>{try{return JSON.parse(storage.getItem(k))??fallback;}catch{return fallback;}};
 const node=(tag,label,cls)=>{const e=document.createElement(tag);if(label)e.textContent=label;if(cls)e.className=cls;return e;};
 const panel=node('section','','cloud-save-panel'), heading=node('h2','私人存档'), status=node('p','','cloud-save-status');
 status.setAttribute('role','status');
 panel.append(heading,status);
 slots.before(panel);
 const slotKey=(name,id)=>'wealthLifeCloud:'+name+':slot:'+id;
 const metaKey=name=>'wealthLifeCloud:'+name+':sync';
 const setStatus=text=>{status.textContent=text;};
 const notify=text=>{setStatus(text);const label=$('saveState');if(label)label.textContent=text;};
 function persist(){localStorage.setItem(metaKey(account.name),JSON.stringify(ledger));}
 async function request(action,access,detail={}){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
  try{
   const response=await fetch('/api/private-save',{method:'POST',headers:{'Content-Type':'application/json'},cache:'no-store',
    body:JSON.stringify({action,...access,...detail}),signal:controller.signal});
   const result=await response.json();
   if(!response.ok&&response.status!==409)throw Error(result.error||'network');
   return result;
  }finally{clearTimeout(timer);}
 }
 function writeSlot(name,id,raw){
  if(raw===null)localStorage.removeItem(slotKey(name,id));
  else localStorage.setItem(slotKey(name,id),raw);
 }
 key=function(id){return account?slotKey(account.name,id):slotKey('signed-out',id);};
 slotCount=function(){
  if(!account)return 3;
  return Math.min(maxSlots,Math.max(3,Number(localStorage.getItem(slotKey(account.name,'count')))||3));
 };
 setSlotCount=function(n){if(account)localStorage.setItem(slotKey(account.name,'count'),String(Math.min(maxSlots,Math.max(3,n))));};
 function recordSave(id){
  if(!account)return;
  ledger[id]={revision:ledger[id]?.revision??0,pending:true};
  try{persist();}catch{notify('本机空间不足，云端同步待重试');}
  clearTimeout(retryTimer);
  retryTimer=setTimeout(flush,400);
 }
 save=function(){const result=localSave.apply(this,arguments);if(result!==false&&state)recordSave(slot);return result;};
 window.deleteCloudSaveSlot=function(id){localStorage.removeItem(key(id));recordSave(id);};
 function setSlotFromCloud(row){
  writeSlot(account.name,row.slot,row.data);
  ledger[row.slot]={revision:row.revision,pending:false};
  setSlotCount(Math.max(slotCount(),row.slot));
 }
 function applyRemote(rows){
  for(const row of rows){
   const local=ledger[row.slot];
   if(local?.pending&&local.revision!==row.revision){
    if(localStorage.getItem(key(row.slot))===row.data){ledger[row.slot]={revision:row.revision,pending:false};continue;}
    conflicts[row.slot]={current:row};
   }else if(!local?.pending)setSlotFromCloud(row);
  }
  persist();
 }
 function renderConflictControls(){
  panel.querySelector('.cloud-save-conflicts')?.remove();
  if(!account||!Object.keys(conflicts).length)return;
  const section=node('div','','cloud-save-conflicts');
  for(const [id,{current}] of Object.entries(conflicts)){
   const row=node('div');
   row.append(node('p','存档 '+id+' 在另一台设备上也有修改。请选择要保留的版本。'));
   const remote=node('button','使用云端版本','secondary'),local=node('button','保留本机版本','secondary');
   remote.type=local.type='button';
   remote.onclick=()=>{
    if(!confirm('使用云端版本并替换此设备未同步的进度？'))return;
    setSlotFromCloud({slot:Number(id),...current});persist();delete conflicts[id];renderConflictControls();buildHome();flush();
   };
   local.onclick=()=>{
    if(!confirm('将本机版本同步到云端并替换此存档的云端版本？'))return;
    ledger[id]={revision:current.revision,pending:true};persist();delete conflicts[id];renderConflictControls();flush();
   };
   row.append(remote,local);section.append(row);
  }
  panel.append(section);
 }
 async function flush(){
  if(!account||transmitting)return;
  transmitting=true;
  const owner=account;
  try{
   for(const id of Object.keys(ledger)){
    if(!ledger[id].pending||conflicts[id])continue;
    const data=localStorage.getItem(key(id)), revision=ledger[id].revision;
    const result=await request('write',owner,{slot:Number(id),revision,data});
    if(account!==owner)return;
    if(result.error==='conflict'){
     conflicts[id]={current:result.current};renderConflictControls();continue;
    }
    if(result.error)throw Error(result.error);
    ledger[id]={revision:result.revision,pending:localStorage.getItem(key(id))!==data};
    persist();
   }
   if(Object.keys(conflicts).length)notify('有存档冲突，请回开始页选择版本');
   else if(Object.values(ledger).some(entry=>entry.pending))retryTimer=setTimeout(flush,400);
   else notify('云端存档已同步');
  }catch(error){
   if(account!==owner)return;
   notify(error.message==='size'?'存档过大，进度保存在本机':'云端暂未同步，进度保存在本机');
   if(!['size','input','credentials'].includes(error.message))retryTimer=setTimeout(flush,5000);
  }finally{transmitting=false;}
 }
 function legacyEntries(){
  if(localStorage.getItem('wealthLifeCloud:legacyImported'))return [];
  const n=Math.min(maxSlots,Math.max(3,Number(localStorage.getItem(countKey))||3));
  return Array.from({length:n},(_,i)=>localStorage.getItem(legacyKey(i+1))).filter(raw=>{
   if(!raw)return false;
   try{const data=JSON.parse(raw);return Number.isInteger(data?.month)&&Number.isFinite(data?.cash);}catch{return false;}
  });
 }
 function refresh(...args){
  if(!account){slots.replaceChildren();newGame.classList.add('hidden');return;}
  const result=localBuild(...args);
  const add=slots.querySelector('.addSave');if(add)add.disabled=slotCount()>=maxSlots;
  return result;
 }
 buildHome=refresh;
 function showAccount(createdCode){
  panel.replaceChildren(heading,status);
  heading.textContent='私人存档 · '+account.name;
  const out=node('button','退出私人存档','secondary');out.type='button';
  out.onclick=()=>{
   if(transmitting){setStatus('正在同步，请稍后再退出。');return;}
   if(Object.values(ledger).some(entry=>entry.pending)&&!confirm('此设备还有未同步的进度。退出后，可用同一账号回来继续同步。现在退出？'))return;
   for(const id of Object.keys(ledger))if(!ledger[id].pending)writeSlot(account.name,id,null);
   clearTimeout(retryTimer);sessionStorage.removeItem(sessionKey);account=null;state=null;ledger={};conflicts={};showEntry();
  };
  const codeLabel=node('label','请妥善保存私人存档码，换设备时要用到。');
  const code=node('input');code.type='text';code.readOnly=true;code.value=account.code;code.setAttribute('aria-label','私人存档码');
  code.onclick=()=>code.select();codeLabel.append(code);
  codeLabel.hidden=!createdCode;
  const toggleCode=node('button','显示私人存档码','secondary');toggleCode.type='button';
  toggleCode.textContent=createdCode?'隐藏私人存档码':'显示私人存档码';
  toggleCode.onclick=()=>{
   codeLabel.hidden=!codeLabel.hidden;
   toggleCode.textContent=codeLabel.hidden?'显示私人存档码':'隐藏私人存档码';
  };
  panel.append(toggleCode,codeLabel);
  const raw=legacyEntries();
  if(raw.length){
   const button=node('button','导入这台设备的旧存档（'+raw.length+' 笔）','secondary');
   button.type='button';button.onclick=()=>{
    const empty=Array.from({length:maxSlots},(_,i)=>i+1).filter(i=>!localStorage.getItem(key(i))&&!ledger[i]?.pending&&!conflicts[i]);
    if(raw.length>empty.length){setStatus('存档位不足，旧存档仍保留在本机。');return;}
    if(!confirm('把这台设备的旧存档复制到「'+account.name+'」？现有云端存档会保留。'))return;
    try{
     raw.forEach((data,i)=>{writeSlot(account.name,empty[i],data);setSlotCount(Math.max(slotCount(),empty[i]));recordSave(empty[i]);});
     localStorage.setItem('wealthLifeCloud:legacyImported',account.name);
    }catch{setStatus('本机空间不足，旧存档仍保留。');return;}
    button.remove();buildHome();flush();
   };
   panel.append(button);
  }
  panel.append(out);renderConflictControls();
 }
 function createCode(){
  return Array.from(crypto.getRandomValues(new Uint8Array(16)),n=>n.toString(16).padStart(2,'0')).join('');
 }
 showEntry=function(){
  homePanel.classList.add('cloud-save-locked');
  buildHome();
  panel.replaceChildren(heading,status);
  heading.textContent='私人存档';
  setStatus('');
  const form=node('form'), name=node('input'), code=node('input');
  name.name='username';name.autocomplete='username';name.required=true;name.maxLength=24;name.placeholder='用户名';
  code.type='password';code.name='code';code.autocomplete='current-password';code.placeholder='私人存档码';
  const nameLabel=node('label','用户名'),codeLabel=node('label','私人存档码');
  nameLabel.append(name);codeLabel.append(code);
  const signIn=node('button','进入我的存档','primary'),create=node('button','建立私人存档','secondary');
  signIn.type='submit';create.type='button';
  form.append(nameLabel,codeLabel,signIn,create);
  panel.append(node('p','手机或平板使用同一个用户名和私人存档码，就能继续同一份进度。'),form);
  async function enter(action,access){
   signIn.disabled=create.disabled=true;
   try{
    const result=await request(action,access);
    if(result.error==='taken'){sessionStorage.removeItem(draftKey);setStatus('这个用户名已有人使用。已有账号请输入私人存档码。');return;}
    if(!Array.isArray(result.slots))throw Error('network');
    account=access;ledger=readJSON(localStorage,metaKey(account.name),{});conflicts={};
    applyRemote(result.slots);sessionStorage.setItem(sessionKey,JSON.stringify(access));
    if(action==='create')sessionStorage.removeItem(draftKey);
    homePanel.classList.remove('cloud-save-locked');
    setStatus(action==='create'?'存档已建立。请先保存你的私人存档码。':'已进入私人存档。');
    showAccount(action==='create'?access.code:null);buildHome();
    if(Object.values(ledger).some(entry=>entry.pending))flush();
   }catch(error){
    account=null;ledger={};conflicts={};homePanel.classList.add('cloud-save-locked');buildHome();
    setStatus(error.message==='credentials'?'用户名或私人存档码不正确。':'目前无法连接云端存档，请稍后重试。');
   }finally{signIn.disabled=create.disabled=false;}
  }
  function submit(action){
   const normalized=name.value.normalize('NFKC').trim().toLowerCase();
   if(!/^[\p{L}\p{N}_-]{2,24}$/u.test(normalized)){setStatus('用户名须为 2–24 个字符，可用文字、数字、下划线或连字符。');return;}
   const draft=readJSON(sessionStorage,draftKey,null);
   const secret=action==='create'?(draft?.name===normalized?draft.code:createCode()):code.value.trim().toLowerCase();
   if(!/^[0-9a-f]{32}$/.test(secret)){setStatus('请输入建立账号时收到的 32 位私人存档码。');return;}
   const access={name:normalized,code:secret};
   if(action==='create')sessionStorage.setItem(draftKey,JSON.stringify(access));
   enter(action,access);
  }
  form.onsubmit=e=>{e.preventDefault();submit('read');};
  create.onclick=()=>submit('create');
  const session=readJSON(sessionStorage,sessionKey,null);
  if(session)enter('read',session);
 };
 window.addEventListener('online',flush);
 showEntry();
})();
