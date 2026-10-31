// Move existing policy content/actions onto themed paper; never transact here.
function paintInsuranceDocument(kind,{board,primary}={}){
 const root=$('eventTitle').closest('.event');if(!board)return;
 root.classList.add('insurance-document');
 if(!board.querySelector('.insurance-toolbar')){const bar=document.createElement('div');bar.className='insurance-toolbar';const date=document.createElement('span'),cash=document.createElement('strong');date.textContent='第'+(Math.floor(state.month/12)+1)+'年 · 第'+(state.month%12+1)+'月';cash.textContent='现金 '+priceText(state.cash);bar.append(date,cash);board.prepend(bar)}
 const scene=document.createElement('figure');scene.className='insurance-document-scene';scene.dataset.documentKind=kind;
 const image=document.createElement('img');image.src='assets/career/insurance-'+kind+'-document.webp';image.alt=({income:'工作挎包和收入保障文件',auto:'汽车钥匙和车险合同',pets:'宠物保单、照护用品与保障文件',premiums:'保险文件、信封与保费核对账单',life:'家庭相册、保障信封与人寿保险文件','life-ending':'人生相册、沙漏与受益人的一次性家庭保障回执',renters:'租住房屋、钥匙、个人物品箱和租客险合同','renters-receipt':'租住房屋和三类事故标记旁的个人物品损失结算回执'})[kind];scene.append(image);
 const sheet=document.createElement('div');sheet.className='insurance-document-sheet';sheet.tabIndex=0;sheet.setAttribute('aria-label','保障内容与费用，可上下滚动');
 for(const node of [...board.children]){
  if(node.classList.contains('insurance-toolbar'))continue;
  if(node.classList.contains('insurance-hero')){node.remove();continue;}
  sheet.append(node);
 }
 scene.append(sheet);
 if(primary){primary.classList.add('insurance-document-action');scene.append(primary)}
 else{const note=document.createElement('div');note.className='insurance-document-action insurance-document-readonly';note.textContent='查看保障与投保条件';scene.append(note)}
 board.append(scene);
}
(function(){
 const before=openPetPolicy;
 openPetPolicy=function(id){
  const result=before(id),p=(state.pets||[]).find(p=>p.id===id);
  if(!p||$('eventTitle').textContent!==(p.name||p.type||'宠物')+' · 保障')return result;
  paintInsuranceDocument('pets',{board:$('eventData'),primary:$('actions').querySelector('button.primary')});return result;
 };
 const showBefore=showEvent;showEvent=function(...args){document.querySelector('.insurance-document')?.classList.remove('insurance-document');return showBefore(...args)};
})();
