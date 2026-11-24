// Internal playtest: preserve the existing slot before the first upgraded write.
const releaseSaveBefore=save;save=function(){if(!state)return;try{const k=key(slot),backup=k+'_before_v283_internal1',raw=localStorage.getItem(k);if(raw&&!localStorage.getItem(backup))localStorage.setItem(backup,raw);}catch(error){console.warn('Save backup could not be written');showEvent('存档空间不足','暂未覆盖原存档','无法保存升级前备份，请先导出存档或释放浏览器存储空间。当前进度暂留在页面中。',[],[['返回',()=>clearModals(),true]]);return false;}return releaseSaveBefore();};
const releaseNotice=document.createElement('p');releaseNotice.className='wl-note';releaseNotice.textContent='内部试玩版：可先体验开局、住房、课程、职业事件、休息、康复和资金处理。店长／合伙人、学历与部分投资玩法仍在完善。';$('home').append(releaseNotice);

// Income-tax removal is a game rule; no historical tax refunds are generated.

const recentUpdates=document.createElement('details');
const recentUpdatesTitle=document.createElement('summary');
recentUpdatesTitle.textContent='查看本次更新 · 2026-11-24';
recentUpdates.append(recentUpdatesTitle);
const recentUpdatesList=document.createElement('ul');
for(const [title,description] of [
 [
  "住房与出门",
  "房屋里可查看本月生活账单。生活页的「当前住房」直达详情，可单独缴当月住房费用，换房从「更换住房」进入。与家人同住每月 $500 称为家用，租住称为房租。收据按游戏月份记账，已付费用不会重复扣除。出门或恢复小镇行程前须结清当月住房费用。"
 ],
 [
  "保险与保障",
  "新版保险方案页用蜡笔插画区分医疗险、宠物险、车险和房险，显示实时应付金额。可在财务或出门前手动缴费；当月待付保费须付清才能出门或恢复小镇行程。"
 ],
 [
  "小镇投资与账单",
  "两只地图股票和两只基金的买卖报价随游戏市场和累计通胀变化，单张卡已生成的报价会保留。核对了 43 张可抽投资机会卡，调低部分偏高的收益。小镇资产与月末入账明细可分别查看。"
 ],
 [
  "财务界面",
  "更新了基金买入确认、股票买入和山谷食品公司买家报价的画面。6、12、24 个月 CD 的存入确认页采用统一样式，按当前报价显示本金、利率、到期日、利息和总额。"
 ],
 [
  "关系、学习与宠物",
  "关系详情采用奶油纸和咖啡馆蜡笔插画，人物资料和互动状态实时显示。更新了学历路线和职业技能页、宠物领养收据及年度体检的价格排版。"
 ]
]){
 const item=document.createElement('li');
 const label=document.createElement('strong');
 label.textContent=title;
 const content=document.createElement('p');
 content.textContent=description;
 item.append(label,content);
 recentUpdatesList.append(item);
}
recentUpdates.append(recentUpdatesList);
releaseNotice.after(recentUpdates);
