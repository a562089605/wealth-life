// Visually reviewed candidate artwork. Only scene pixels are shown; live UI owns all rules.
const CANDIDATE_SCENES={
 promotionPreview:{file:'shift-promotion-preview',width:1024,x:60,y:180,w:900,h:175},
 promotionPending:{file:'shift-promotion-pending',width:1024,x:60,y:175,w:900,h:190},
 coffeeCourse:{file:'coffee-course',width:1199,x:370,y:250,w:450,h:220},
 bankApplication:{file:'bank-application',width:1024,x:740,y:440,w:225,h:260},
 bankPayment:{file:'bank-payment',width:1024,x:35,y:5,w:950,h:115},
 petTime:{file:'pet-time-shortage',width:941,x:235,y:340,w:550,h:280},
 petFunds:{file:'pet-funds-shortage',width:941,x:200,y:330,w:590,h:290},
 crocodile:{file:'pet-crocodile-care',width:941,x:65,y:280,w:870,h:350}
};
function candidateArtScene(type,title){
 if(type==='职业发展'&&title==='晋升值班主管'&&coffeeWorking())return state.coffee?.progression?.pending?CANDIDATE_SCENES.promotionPending:CANDIDATE_SCENES.promotionPreview;
 if(type==='职业学习'&&title==='饮品制作基础')return CANDIDATE_SCENES.coffeeCourse;
 if(type==='本月还款'&&title==='我的贷款')return CANDIDATE_SCENES.bankPayment;
 if(type!=='宠物照护'||!['本月到期宠物照护','康复月委托专业照护'].includes(title))return null;
 const q=petCareQuote(state,state.petCareDraft?.month===state.month?state.petCareDraft.selections:{});
 if(q.blocked)return null;
 if((q.hours||0)>currentCareerTime().free)return CANDIDATE_SCENES.petTime;
 if((q.cost||0)>state.cash)return CANDIDATE_SCENES.petFunds;
 if(state.pets?.length===1&&petCareSpecies(state.pets[0])==='crocodile')return CANDIDATE_SCENES.crocodile;
 return null;
}
const candidateShowBefore=showEvent;
showEvent=function(type,title,desc,data=[],actions=[]){const result=candidateShowBefore(type,title,desc,data,actions);appendReturnScene(candidateArtScene(type,title),title);return result};
// These forms replace eventData after showEvent, so decorate them after rendering.
const candidateBankBefore=openBankLoan;
openBankLoan=function(amount,config){const result=candidateBankBefore(amount,config);appendReturnScene(CANDIDATE_SCENES.bankApplication,config?.type==='学生贷款'?'学生贷款':'银行贷款');const hero=$('eventData').firstElementChild;if(hero?.classList.contains('health-art-window'))hero.classList.add('candidate-bank-scene');return result};
const candidatePaymentsBefore=openLoanPayments;
openLoanPayments=function(){const result=candidatePaymentsBefore();appendReturnScene(CANDIDATE_SCENES.bankPayment,'我的贷款');return result};
const candidateWorkBefore=openWorkAdjustment;
openWorkAdjustment=function(){const result=candidateWorkBefore();if(!['咖啡师 Barista','咖啡师','Barista'].includes(state?.job)||$('eventTitle').textContent!=='调整工作')return result;
 const image=document.createElement('img');image.src='assets/career/barista-portrait.webp';image.alt='已确认的咖啡师人物：棕色发髻、墨绿围裙、手捧咖啡';image.className='candidate-barista-portrait';$('eventData').prepend(image);return result;
};
// The existing background selector controls the portrait; no save is created by browsing.
const candidatePortrait=document.createElement('img');candidatePortrait.src='assets/career/barista-portrait.webp';candidatePortrait.alt='咖啡师人物预览';candidatePortrait.className='candidate-barista-portrait';
$('newGame').prepend(candidatePortrait);
function updateCandidatePortrait(){candidatePortrait.hidden=$('job').value!=='barista'}
$('job').addEventListener('change',updateCandidatePortrait);updateCandidatePortrait();
