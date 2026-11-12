// Opening presentation only. No localStorage/sessionStorage or game-state writes.
(function(){'use strict';
 const screen=document.getElementById('welcomeScreen'),button=document.getElementById('enterGame'),image=document.getElementById('welcomeArt');
 if(!screen||!button)return;
 const fallback=()=>screen.classList.add('no-art');
 image.addEventListener('error',fallback);if(image.complete&&!image.naturalWidth)fallback();
 button.disabled=false;
 button.addEventListener('click',()=>{if(screen.hidden)return;screen.hidden=true;document.body.classList.remove('entry-cover');document.getElementById('slots')?.querySelector('button')?.focus({preventScroll:true});});
})();
