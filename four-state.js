function normalizeFeelingEffects(e){const out={...e};if(out.happiness==null&&out.mood!=null)out.happiness=out.mood;delete out.mood;return out;}
function migrateFourStates(s){if(!s)return;if(s.fourStateVersion!==1){const old=s.mood;if(s.happiness==null)s.happiness=Number.isFinite(old)?Math.max(0,Math.min(100,old)):68;
 s.fourStateMigration={month:s.month,previousMood:old??null,keptHappiness:s.happiness};s.fourStateVersion=1;}
 delete s.mood;
 // This old crisis is a state timer, not financial insolvency. Keep its record without running it.
 if(s.crisis?.deadline!=null&&s.crisis?.actions){s.legacyStateCrisis=s.crisis;s.crisis=null;}
}
const fourStateSyncBefore=syncFinance;syncFinance=function(){migrateFourStates(state);return fourStateSyncBefore();};
const fourStateOpenBefore=openGame;openGame=function(){migrateFourStates(state);return fourStateOpenBefore();};
// Status thresholds lead to rest/treatment, never an automatic three-month Game Over.
recoveryIssues=function(){return [['health',state.health<30],['energy',state.energy<20],['happiness',state.happiness<20],['stress',state.stress>=80]].filter(x=>x[1]).map(x=>x[0]);};
updateRecovery=function(){if(state)migrateFourStates(state);};
showRecovery=function(){if(state.gameOver?.final)return showGameOver();if(state.health<30||isRecoveryMonth(state))return openHealthTreatment();showEvent('状态调整','回到房屋照顾自己','状态不会因等待三个游戏月而自动结束本局。按实际活动恢复，费用和时间照常。',[
 ['健康',state.health],['能量',state.energy],['压力',state.stress],['幸福度',state.happiness]],[['安排额外休息',openExtraRest,true],['生活活动',()=>$('lifestyleBtn').click(),false],['联系朋友',()=>$('networkBtn').click(),false],['返回房屋',townHome,false]]);};
applyRecovery=function(){return showRecovery();};
