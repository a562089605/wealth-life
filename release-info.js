// Internal playtest: preserve the existing slot before the first upgraded write.
const releaseSaveBefore=save;save=function(){if(!state)return;try{const k=key(slot),backup=k+'_before_v283_internal1',raw=localStorage.getItem(k);if(raw&&!localStorage.getItem(backup))localStorage.setItem(backup,raw);}catch(error){console.warn('Save backup could not be written');showEvent('存档空间不足','暂未覆盖原存档','无法保存升级前备份，请先导出存档或释放浏览器存储空间。当前进度暂留在页面中。',[],[['返回',()=>clearModals(),true]]);return false;}return releaseSaveBefore();};
const releaseNotice=document.createElement('p');releaseNotice.className='wl-note';releaseNotice.textContent='内部试玩版：可先体验开局、住房、课程、职业事件、休息、康复和资金处理。店长／合伙人、学历与部分投资玩法仍在完善。';$('home').append(releaseNotice);

// Income-tax removal is a game rule; no historical tax refunds are generated.
