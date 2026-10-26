// Reviewed scene windows: never display the archived names, balances or checkmarks.
const PetArt={
 window(file,box,alt,extra='',sourceWidth=941){
  const [x,y,w,h]=box;
  return '<div class="pet-scene-window '+extra+'" style="aspect-ratio:'+w+'/'+h+'"><img src="assets/career/'+file+'.webp" alt="'+alt+'" style="width:'+sourceWidth/w*100+'%;left:'+(-x/w*100)+'%;top:'+(-y/h*100)+'%"></div>';
 },
 portrait(species,context='home'){
  if(species==='dog')return this.window('pet-owned-sheet',[40,238,410,430],'柯基插画');
  if(species==='cat')return context==='adoption'?this.window('pet-cat-adoption',[510,200,350,340],'银渐层领养插画'):this.window('pet-owned-sheet',[40,712,410,430],'银渐层插画');
  if(species==='crocodile'){
   const [file,box]=context==='adoption'?['pet-crocodile-adoption',[55,210,830,265]]:context==='policy'?['pet-policy',[45,310,850,330]]:['pet-crocodile-care',[55,310,830,265]];
   return this.window(file,box,'鳄鱼'+(context==='policy'?'保险':'')+'插画');
  }
  const box=({gecko:[505,570,280,230],spider:[44,880,270,230],tortoise:[505,890,270,220],chameleon:[160,1155,400,220]})[species];
  return box?this.window('pet-selection',box,PET_ADOPTION[species].name+'插画'):'';
 },
 crocodile(part){return this.window('pet-crocodile-cleaning',({hero:[40,255,530,295],self:[120,610,280,255],pro:[120,930,280,275]})[part],part==='hero'?'鳄鱼与栖息池':part==='self'?'自行清洁栖息池工具':'专业栖息池清洁工具','pet-reptile-scene')},
 catCleaning(part){return part==='self'?this.window('pet-cat-cleaning-scenes',[365,8,700,565],'银渐层在家洗澡','pet-cat-cleaning-scene',1402):'<div class="pet-scene-window pet-cat-cleaning-scene" style="aspect-ratio:1"><img src="assets/career/pet-cat-professional.webp" alt="宠物店美容师为银渐层梳理毛发" style="width:100%;left:0;top:0"></div>'}

};
