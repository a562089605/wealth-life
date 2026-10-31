// Embedded illustrated receipt; all amounts and actions still use the completed transaction.
function paintPetAdoptionSuccess(p,q){
 if($('eventTitle').textContent!=='领养成功')return;
 const root=$('eventTitle').closest('.event');root.classList.add('pet-success-painted');
 const species=petCareSpecies(p),cfg=PET_ADOPTION[species];
 const board=document.createElement('div');board.className='pet-success-board';board.dataset.species=species;
 const background=document.createElement('img');background.className='pet-success-background';background.src='assets/career/pet-adoption-success.webp';background.alt='花叶围绕的领养成功绘本、养护清单与费用结算纸面';board.append(background);
 const title=document.createElement('h2');title.className='pet-success-title';title.textContent='领养成功';board.append(title);
 const welcome=document.createElement('p');welcome.className='pet-success-welcome';welcome.textContent='欢迎'+p.name+'加入你的生活！';board.append(welcome);
 const art=document.createElement('div');art.className='pet-success-art';
 art.innerHTML=species==='crocodile'?PetArt.window('pet-adoption-success',[0,290,941,350],'鳄鱼领养成功插画'):PetArt.portrait(species);
 board.append(art);
 const name=document.createElement('h3');name.textContent=p.name+' · '+cfg.name;board.append(name);
 const complete=document.createElement('section');complete.className='pet-success-complete';
 complete.innerHTML='<h4>领养事项完成</h4><p>✓ 本月基础养护已完成</p><p>'+(q.insured?'✓ 宠物保险已生效':'○ 未购买宠物保险')+'</p><p>✓ 首次体检与清洁已包含</p>'+(cfg.deworm?'<small>猫狗本月驱虫已包含</small>':'');board.append(complete);
 const next=roundCash((cfg.monthly+cfg.deworm)*(state.cpiIndex||100)/100)+q.premium;
 const receipt=document.createElement('section');receipt.className='pet-success-receipt';receipt.innerHTML='<h4>费用结算</h4><dl><div><dt>本次已支付</dt><dd>'+priceText(q.total)+'</dd></div><div><dt>当前现金</dt><dd>'+priceText(state.cash)+'</dd></div></dl><p>下月基础养护'+(cfg.deworm?'、驱虫':'')+'与保险：'+priceText(next)+'</p><small>按当前物价估算，实际以结算时为准</small>';board.append(receipt);
 $('eventData').replaceChildren(board);$('eventData').style.display='block';
 for(const b of $('actions').querySelectorAll('button'))b.dataset.successAction=b.textContent==='查看我的宠物'?'pets':b.textContent==='返回房屋'?'back':'review';
 board.append($('actions'));
}
(function(){const before=showEvent;showEvent=function(...args){
 const root=document.querySelector('.pet-success-painted');
 // Restore the canonical action container before the next event replaces its data.
 if(root){root.append($('actions'));root.classList.remove('pet-success-painted')}
 return before(...args);
}})();
