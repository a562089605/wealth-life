function housingArtScene(key,scheduled){
 if(key==='studio'&&scheduled)return {file:'housing-reserve',width:1024,x:565,y:410,w:385,h:225};
 const y={family:365,shared:525,studio:680,rent1:840}[key];
 return y==null?null:{file:'housing-select',width:1024,x:70,y,w:255,h:125};
}
function previewHousingChoice(key){
 syncFinance();if(housingHandoverDue())return openHousingHandover();
 const h=housingChoices().find(x=>x[3]===key);if(!h)return;
 const q=housingQuote(h),owner=state,cycle=state.month,snapshot=JSON.stringify(q);let preview;
 const data=[['住处',h[0]],['月住房费',priceText(q.monthly)],['可退新押金',priceText(q.deposit)],['本次支付',priceText(q.total)],['支付后现金',priceText(state.cash-q.total)]];
 if(q.scheduled)data.push(['入住时间','次月交接'],['预计退回原押金',priceText(heldHousingDeposit())],['预计交接净付款',priceText(q.deposit+q.monthly-heldHousingDeposit())]);
 const title=q.scheduled?'换房预约预览':'住房付款预览';
 showEvent('住房详情',title,q.scheduled?'预约现在不扣款；次月交接时退旧押金，再支付新押金和房租。':'查看不扣款；确认才支付。已付本月房租不会重复收取。',data,[
 [q.scheduled?'确认预约，次月入住':'确认住房付款',()=>{if(state!==owner||!preview?.isConnected)return false;const fresh=housingChoices().find(x=>x[3]===key);if(!fresh||state.month!==cycle)return openHousing();if(JSON.stringify(housingQuote(fresh))!==snapshot)return previewHousingChoice(key);confirmHousing(key)},true,state.cash<q.total],['返回住房选择',openHousing,false]
 ]);
 preview=$('actions').firstElementChild;
 appendReturnScene(housingArtScene(key,q.scheduled),title);
}
const housingArtMarkupBefore=housingMarkup;
housingMarkup=function(){return housingArtMarkupBefore().replace(/data-v26="housing"/g,'data-housing-preview').replace(/确认支付 /g,'查看付款详情 ').replace(/预约次月入住/g,'查看预约详情');};
document.addEventListener('click',e=>{const b=e.target.closest('[data-housing-preview]');if(b)previewHousingChoice(b.dataset.key)});
const housingArtOpenBefore=openHousing;
openHousing=function(){const result=housingArtOpenBefore();appendReturnScene(housingArtScene('shared',false),'选择住房');return result};
$('housingBtn').onclick=openHousing;
const housingArtLivingBefore=openTownLiving;
openTownLiving=function(){const result=housingArtLivingBefore();appendReturnScene({file:'living-cost',width:1024,x:100,y:340,w:830,h:450},'本月必要生活成本');return result};
