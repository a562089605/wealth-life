// Original archived seven-pet sheet, with live cash/quotes and original adoption previews.
(function(){
 const before=openPetAdoptions;
 openPetAdoptions=function(){
  const result=before();
  if($('eventTitle').textContent!=='选择新伙伴')return result;
  const card=$('eventTitle').closest('.event'),owner=state,month=state.month;
  card.classList.add('pet-selection-painted');
  let selected='dog';
  const sheet=document.createElement('div');sheet.className='pet-adoption-sheet';sheet.setAttribute('role','group');sheet.setAttribute('aria-label','领养宠物：选择新伙伴');
  const img=document.createElement('img');img.src='assets/career/pet-selection.webp';img.alt='七种宠物：柯基、银渐层、鳄鱼、豹纹守宫、捕鸟蛛、陆龟、变色龙';sheet.append(img);
  const currency=n=>'$'+Number(n).toLocaleString('en-US',{maximumFractionDigits:2});
  const overlay=(cls,text,x,y,w,h)=>{const n=document.createElement('span');n.className=cls;n.textContent=text;n.style.cssText='left:'+x+'%;top:'+y+'%;width:'+w+'%;height:'+h+'%';sheet.append(n);return n};
  overlay('pet-sheet-cash',currency(state.cash),75,6.35,21.8,2.9);
  const positions=[
   ['dog',3.4,11,46,19.6,34,20.5,41,25.2],['cat',50.6,11,46,19.6,83.5,20.5,89,25],
   ['crocodile',3.4,31.3,46,17.8,33,38.7,43,43],['gecko',50.6,31.3,46,17.8,83.5,38.7,90.4,43.2],
   ['spider',3.4,49.8,46,16.8,34,57,42.1,61.2],['tortoise',50.6,49.8,46,16.8,83.5,57,90.5,61.1],
   ['chameleon',12,67.3,76,14.8,71,74,76.3,78.6]
  ];
  const selectors=[];
  function active(){return state===owner&&state.month===month&&sheet.isConnected}
  for(const [species,x,y,w,h,px,py,cx,cy]of positions){
   const q=petAdoptionQuote(species,false);
   overlay('pet-sheet-price',currency(q.adopt),px,py,14.5,3.2);
   const mark=overlay('pet-sheet-choice','',cx-2.9,cy-1.7,5.8,3.4);
   const b=document.createElement('button');b.type='button';b.className='pet-sheet-option';b.setAttribute('aria-label','查看'+PET_ADOPTION[species].name);b.style.cssText='left:'+x+'%;top:'+y+'%;width:'+w+'%;height:'+h+'%';
   b.onclick=()=>{if(!active())return;selected=species;update()};sheet.append(b);selectors.push({species,b,mark});
  }
  function update(){for(const {species,b,mark}of selectors){const yes=species===selected;b.setAttribute('aria-pressed',String(yes));mark.classList.toggle('selected',yes);mark.textContent=yes?'✓':''}}
  function action(label,x,y,w,h,run){const b=document.createElement('button');b.type='button';b.className='pet-sheet-action';b.setAttribute('aria-label',label);b.style.cssText='left:'+x+'%;top:'+y+'%;width:'+w+'%;height:'+h+'%';b.onclick=()=>{if(active())run()};sheet.append(b)}
  action('返回我的宠物',2.8,2.4,9.5,5.4,openPetHub);
  action('下一步：取名与费用',4.5,88,91,6.3,()=>previewPetAdoption(selected));
  action('返回宠物页',29,95,42,4.4,openPetHub);
  $('eventData').replaceChildren(sheet);$('eventData').style.display='block';update();
  return result;
 };
 const showBefore=showEvent;
 showEvent=function(...args){document.querySelector('.pet-selection-painted')?.classList.remove('pet-selection-painted');return showBefore(...args)};
})();
