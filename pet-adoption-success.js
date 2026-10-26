// A receipt for the completed transaction. This renderer never pays or adopts.
function paintPetAdoptionSuccess(p,q){
 if($('eventTitle').textContent!=='领养成功')return;
 const root=$('eventTitle').closest('.event');root.classList.add('pet-success-painted');
 const species=petCareSpecies(p),cfg=PET_ADOPTION[species];
 const boxes={dog:[40,238,410,430],cat:[40,712,410,430],crocodile:[0,290,941,350],gecko:[505,570,280,230],spider:[44,880,270,230],tortoise:[505,890,270,220],chameleon:[160,1155,400,220]};
 const [x,y,w,h]=boxes[species],src=species==='crocodile'?'pet-adoption-success':(['dog','cat'].includes(species)?'pet-owned-sheet':'pet-selection');
 const board=document.createElement('div');board.className='pet-success-board';
 const welcome=document.createElement('p');welcome.className='pet-success-welcome';welcome.textContent='欢迎'+p.name+'加入你的生活！';board.append(welcome);
 const art=document.createElement('div');art.className='pet-success-art';art.style.aspectRatio=w+'/'+h;
 art.innerHTML='<img src="assets/career/'+src+'.webp" alt="'+cfg.name+'插画" style="width:'+941/w*100+'%;left:'+(-x/w*100)+'%;top:'+(-y/h*100)+'%">';board.append(art);
 const name=document.createElement('h3');name.textContent=p.name+' · '+cfg.name;board.append(name);
 const complete=document.createElement('section');complete.className='pet-success-complete';
 complete.innerHTML='<h4>领养事项完成</h4><p>✓ 本月基础养护已完成</p><p>'+(q.insured?'✓ 宠物保险已生效':'○ 未购买宠物保险')+'</p><p>✓ 首次体检与清洁已包含</p>'+(cfg.deworm?'<small>猫狗本月驱虫已包含</small>':'');board.append(complete);
 const next=roundCash((cfg.monthly+cfg.deworm)*(state.cpiIndex||100)/100)+q.premium;
 const receipt=document.createElement('section');receipt.className='pet-success-receipt';receipt.innerHTML='<h4>费用结算</h4><dl><div><dt>本次已支付</dt><dd>'+priceText(q.total)+'</dd></div><div><dt>当前现金</dt><dd>'+priceText(state.cash)+'</dd></div></dl><p>下月基础养护'+(cfg.deworm?'、驱虫':'')+'与保险：'+priceText(next)+'</p><small>按当前物价估算，实际以结算时为准</small>';board.append(receipt);
 $('eventData').replaceChildren(board);$('eventData').style.display='block';
 for(const b of $('actions').querySelectorAll('button'))b.dataset.successAction=b.textContent==='查看我的宠物'?'pets':'back';
}
(function(){const before=showEvent;showEvent=function(...args){document.querySelector('.pet-success-painted')?.classList.remove('pet-success-painted');return before(...args)}})();
