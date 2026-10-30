// Adapters for explicitly selected relationship cards. Selection probabilities remain deferred.
(function(){
 const R=RelationshipRules,helpKinds={'friend-life':'life','friend-hobby':'interest','friend-life-help':'life','friend-interest-help':'interest','classmate-help':'classmate','friend-help':'life','hobby-help':'interest'};
 const before=showMapRecord;
 function openHelp(r,kind){
  const p=(state.people||[]).find(p=>p.id===r.personId);if(!p)return before(r);
  r.relationshipHelp??={id:r.id,month:r.month,personId:p.id,kind,skill:r.skill||r.quote?.skill,status:r.status};
  const action=r.relationshipHelp,image=kind==='life'?'friend-life-help':kind==='interest'?'friend-shared-interest-help':'classmate-study-help';
  if(r.status!=='pending')return RelationshipUI.paint('朋友帮助结果',image,[['联系人',p.name],['状态',r.status==='resolved'?'帮助已兑现':'本次未接受'],...Object.entries(action.receipt||{}).map(([k,v])=>[({energy:'能量变化',stress:'压力变化',hours:'自由时间增加',xp:'技能经验增加',skill:'对应技能',studyMonths:'学制变化'})[k]||k,v])],[['继续探索',mapContinue]]);
  const effects=kind==='life'?'压力−3 · 自由时间+2h · 能量+2':kind==='interest'?(action.skill||'共同技能')+' +10 XP · 压力−2 · 能量+2':'剩余学制−3月 · 压力−2 · 能量+2 · 总学费不减少';
  RelationshipUI.paint('朋友帮助',image,[['联系人',p.name],['帮助效果',effects],['费用与额外耗时','免费 · 0h'],['次数','同一人同类型帮助仅可成功获得一次']],[['接受帮助',()=>{
   if(mapRecord()!==r||r.month!==state.month||r.status!=='pending')return;
   if(R.acceptHelp(state,action)){r.status='resolved';r.receipt={effects:{energy:2,stress:kind==='life'?-3:-2}};save();showMapRecord(r)}
  },!R.helpEligible(state,p,kind,action.skill)],['这次不接受',()=>{if(mapRecord()!==r||r.status!=='pending'||r.month!==state.month)return;r.status='declined';action.status='declined';save();mapContinue()}]]);return true;
 }
 showMapRecord=function(r=mapRecord()){
  if(!r)return before(r);
  if(['friend-hobby','friend-interest-help','hobby-help'].includes(r.cardId)&&r.status==='pending'){
   RelationshipUI.paint('工作介绍规则待完善','friend-shared-interest-help',[['说明','这类帮助按最新规则介绍工作获取收入，不增加技能经验。'],['状态','报价、耗时和完成机制尚待确认，本次不执行旧经验奖励。']],[['返回探索',()=>{if(mapRecord()!==r||r.status!=='pending'||r.month!==state.month)return;r.status='declined';save();mapContinue()}]]);return true;
  }
  if(r.cardId==='meet-coworker'){
   if(r.status==='pending')return RelationshipWork.openCoworker(r);
   if(r.status==='resolved'||r.status==='declined'){RelationshipUI.paint('同事相识结果','coworker-first-meeting',[['状态',r.status==='resolved'?'已加入通讯录':'本次未认识'],['姓名',r.contact?.name||''],['额外费用与耗时','0 · 0h']],[['继续探索',mapContinue]]);return true;}
  }
  const kind=helpKinds[r.cardId];return kind?openHelp(r,kind):before(r);
 };
 window.RelationshipMap={helpKinds,openHelp};
})();
