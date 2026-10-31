// Essential-arrangements composition; preserve every original bill and action node.
(function(){
 const before=openNecessaryBills;
 openNecessaryBills=function(...args){
  const result=before(...args);if($('eventTitle').textContent!=='出门前完成本月必要事项')return result;
  const root=$('eventTitle').closest('.event'),board=$('eventData').querySelector('.life-paper');if(!board)return result;
  root.classList.add('necessary-embedded');
  const controls=[...$('actions').querySelectorAll('button')];
  board.querySelector('.life-paper-table')?.remove();
  const scene=document.createElement('figure');scene.className='necessary-painted-scene';
  const image=document.createElement('img');image.src='assets/career/necessary-arrangements-embedded.webp';image.alt='房屋钥匙、食材与保单旁的必要安排账单、筹款纸牌和确认木牌';scene.append(image);
  const sheet=document.createElement('div');sheet.className='necessary-painted-sheet';sheet.tabIndex=0;sheet.setAttribute('aria-label','本月必要待办与金额，可上下滚动');
  const rows=[...board.querySelectorAll('.life-paper-row')];if(rows[1])sheet.append(rows[1]);
  const notes=[...board.querySelectorAll('.life-paper-note')];
  const unknown=notes.find(n=>n.textContent.startsWith('另有待确认事项'));if(unknown)sheet.append(unknown);
  const list=board.querySelector('.life-bill-list');if(list)sheet.append(list);
  for(const note of notes)if(note!==unknown)sheet.append(note);
  scene.append(sheet);
  for(const [index,prefix] of ['资金不足','查看银行','确认本月'].entries()){
   const button=controls.find(b=>b.textContent.startsWith(prefix));if(!button)continue;
   button.classList.add('necessary-painted-action');button.dataset.necessaryAction=['fund','bank','confirm'][index];scene.append(button);
  }
  board.append(scene);return result;
 };
 const showBefore=showEvent;showEvent=function(...args){document.querySelector('.necessary-embedded')?.classList.remove('necessary-embedded');return showBefore(...args)};
})();
