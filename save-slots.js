// Presentation only: decorate the original save buttons, retaining their existing handlers.
(function(){'use strict';
 const home=document.getElementById('home'),slots=document.getElementById('slots'),newGame=document.getElementById('newGame');if(!home||!slots||!newGame)return;
 const make=(tag,text,cls)=>{const e=document.createElement(tag);if(text!=null)e.textContent=text;if(cls)e.className=cls;return e;};
 const header=make('header',null,'save-page-header');header.id='savePageHeader';const art=make('img',null,'save-page-art');art.src='assets/career/town.webp';art.alt='';art.setAttribute('aria-hidden','true');
 const heading=make('div',null,'save-page-heading');heading.append(make('p','财富人生 · WEALTH LIFE','save-page-eyebrow'),make('h2','我的人生存档'),make('p','挑一段人生，接着往前走。','save-page-intro'));header.append(art,heading);slots.before(header);
 const summary=make('p',null,'save-page-summary');header.after(summary);
 function decorate(){const rows=[...slots.querySelectorAll('.saveRow')];let occupied=0;
  rows.forEach((row,i)=>{const record=load(i+1),button=row.querySelector('button');if(!button)return;const filled=!!record;occupied+=filled?1:0;row.classList.add('save-slot');row.classList.toggle('save-slot-filled',filled);row.classList.toggle('save-slot-empty',!filled);button.classList.add('save-slot-main');button.setAttribute('aria-label',slotLabel(record,i+1));
   const number=make('span',String(i+1).padStart(2,'0'),'save-slot-number'),body=make('span',null,'save-slot-body'),top=make('span',null,'save-slot-top');top.append(make('span','存档 '+String(i+1).padStart(2,'0'),'save-slot-id'),make('span',filled?'进行中':'新的开始','save-slot-status'));body.append(top);
   body.append(make('strong',filled?(record.retired?'退休生活':record.job||'人生进行中'):'还没有故事','save-slot-title'));
   if(filled){const age=Number.isFinite(record.age)?record.age+'岁':'',month=Number.isInteger(record.month)&&record.month>=0?'第'+(Math.floor(record.month/12)+1)+'年 · 第'+(record.month%12+1)+'月':'时间未记录';body.append(make('span',[age,month].filter(Boolean).join(' · '),'save-slot-date'));const bottom=make('span',null,'save-slot-bottom'),cash=make('span',null,'save-slot-cash');cash.append(make('small','可用现金'),make('b',Number.isFinite(record.cash)?money(record.cash):'未记录'));bottom.append(cash,make('span','继续游戏 →','save-slot-action'));body.append(bottom);
   }else{body.append(make('span','从这里，开启一段新人生','save-slot-date'),make('span','开始新人生 →','save-slot-action'));}
   button.replaceChildren(number,body);const del=row.querySelector('.miniSave');if(del)del.setAttribute('aria-label','删除存档 '+String(i+1).padStart(2,'0'));
  });summary.textContent='已有 '+occupied+' 段人生 · '+rows.length+' 个存档位';
 }
 function visibility(){const visible=!home.classList.contains('hidden')&&newGame.classList.contains('hidden')&&!document.body.classList.contains('entry-cover');if(document.body.classList.contains('save-list-open')!==visible)document.body.classList.toggle('save-list-open',visible);}
 const before=buildHome;buildHome=function(){const result=before.apply(this,arguments);decorate();visibility();return result;};
 const observer=new MutationObserver(visibility);for(const target of [home,newGame,document.body])observer.observe(target,{attributes:true,attributeFilter:['class']});decorate();visibility();
})();
