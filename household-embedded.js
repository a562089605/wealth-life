// Layout-only decorators: retain original quote rows, buttons, closures and transaction guards.
(function(){
 const paths={family:'housing-family-embedded',shared:'housing-shared-embedded',studio:'housing-studio-embedded',rent1:'housing-one-bedroom-embedded',handover:'housing-handover-embedded'};
 function image(key){const img=document.createElement('img');img.src='assets/career/'+(paths[key]||paths.handover)+'.webp';img.alt=key==='handover'?'住房钥匙、租约与押金交接绘本':'对应住房的暖色绘本场景与账单纸';return img;}
 function decorate(board,key,buttons){
  if(!board)return;board.closest('.event').classList.add('housing-embedded');
  board.querySelectorAll(':scope > .household-scene').forEach(n=>n.remove());
  const scene=document.createElement('figure');scene.className='housing-painted-scene';scene.append(image(key));
  const paper=document.createElement('div');paper.className='housing-painted-sheet';paper.tabIndex=0;paper.setAttribute('aria-label','住房账单与说明，可上下滚动');
  for(const n of [...board.children].slice(1))paper.append(n);scene.append(paper);
  const button=buttons.find(b=>b.classList.contains('primary'))||buttons[0];if(button){button.classList.add('housing-painted-action');scene.append(button)}
  board.append(scene);
 }
 const openBefore=openHousing;openHousing=function(...args){const result=openBefore(...args);if($('eventTitle').textContent!=='选择住房')return result;const board=$('eventData').querySelector('.household-board');if(!board)return result;
  board.closest('.event').classList.add('housing-embedded');
  for(const button of board.querySelectorAll('.household-option')){
   const key=button.dataset.key;button.querySelector('.household-scene')?.remove();const paper=document.createElement('div');paper.className='housing-option-sheet';
   const link=button.lastElementChild;for(const n of [...button.children])if(n!==link)paper.append(n);
   button.append(image(key),paper);if(link){link.classList.add('housing-option-link');button.append(link)}
  }
  const handover=board.querySelector('[data-lease-handover]'),cancel=board.querySelector('[data-lease-cancel]');
  if(handover||cancel){const banner=document.createElement('div');banner.append(document.createElement('div'));const grid=board.querySelector('.household-options');for(const node of [...board.children].slice(1))if(node!==grid)banner.append(node);board.insertBefore(banner,grid);decorate(banner,'handover',[handover||cancel]);}return result;
 };$('housingBtn').onclick=openHousing;
 const previewBefore=previewHousingChoice;previewHousingChoice=function(key){const result=previewBefore(key);if(['住房付款预览','换房预约预览'].includes($('eventTitle').textContent))decorate($('eventData').querySelector('.household-board'),key,[...$('actions').querySelectorAll('button')]);return result};
 const handoverBefore=openHousingHandover;openHousingHandover=function(...args){const result=handoverBefore(...args);if($('eventTitle').textContent==='退旧押金，入住新住处')decorate($('eventData').querySelector('.household-board'),'handover',[...$('actions').querySelectorAll('button')]);return result};
 const restBefore=confirmExtraRest;confirmExtraRest=function(...args){const result=restBefore(...args);if(result===true&&$('eventTitle').textContent==='休息完成'){
  const board=$('eventData').querySelector('.household-board');board.querySelector('.household-rest-scene')?.remove();paintOutdoorPreview(board,1,true);
  const scene=board.querySelector('.outdoor-painted-scene'),button=$('actions').querySelector('button.primary');if(scene&&button){button.classList.add('outdoor-embedded-pay');scene.append(button)}
 }return result};
 // Preserve the original optional friends/hobby follow-up and its outcomes; move their live nodes only.
 let followupOwner=null,followupMonth=null;const eventBefore=showEvent;showEvent=function(...args){const isFollowupStart=['朋友介绍小订单','发现共同爱好'].includes(args[1]),isFollowupResult=['交流完成','订单未通过验收'].includes(args[1])&&followupOwner===state&&followupMonth===state?.month&&['朋友介绍小订单','发现共同爱好'].includes($('eventTitle').textContent);document.querySelector('.housing-embedded')?.classList.remove('housing-embedded');const result=eventBefore(...args);
  const chosen=state&&monthSelection('life'),i=V26_LIFE.findIndex(o=>o.name===chosen);
  if([2,3].includes(i)&&(isFollowupStart||isFollowupResult)){if(isFollowupStart){followupOwner=state;followupMonth=state.month;}
   $('eventTitle').closest('.event').classList.add('life-pages-painted');const board=document.createElement('div');board.className='life-paper';board.append(document.createElement('div'));const desc=document.createElement('p');desc.className='life-paper-note';desc.textContent=args[2]||'';board.append(desc);for(const n of [...$('eventData').childNodes])board.append(n);$('eventData').replaceChildren(board);$('eventData').style.display='block';paintOutdoorPreview(board,i,true);
   const button=$('actions').querySelector('button.primary');if(button){button.classList.add('outdoor-embedded-pay');board.querySelector('.outdoor-painted-scene').append(button)}
  }return result;
 };
})();
