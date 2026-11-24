/* Clue5 AdSense manual placements.
 * One wide home-page ad; one desktop-only ad below the notebook footer.
 * Neither unit renders until a real publisher ID and its slot are configured.
 * Do not enable site-wide Auto ads: they may overlap game controls.
 */
(function(){
 'use strict';
 var config=window.CLUE5_ADSENSE_CONFIG||{};
 var publisher=String(config.publisherId||'').trim();
 if(/^pub-\d{16}$/.test(publisher))publisher='ca-'+publisher;
 if(!/^ca-pub-\d{16}$/.test(publisher))return;

 // Loading the official client also supports AdSense site verification when
 // the publisher ID is set but the two ad slot IDs are not available yet.
 var script=document.createElement('script');
 script.async=true;
 script.crossOrigin='anonymous';
 script.src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client='+encodeURIComponent(publisher);
 document.head.appendChild(script);
 var initialized=new Set();

 function addUnit(containerId,slot,format){
  if(initialized.has(containerId)||!/^\d{8,20}$/.test(slot))return;
  var container=document.getElementById(containerId);
  if(!container||container.getBoundingClientRect().width<120)return;
  var label=document.createElement('div');
  label.className='clue5-ad-label';
  label.textContent='Advertisement';
  var unit=document.createElement('ins');
  unit.className='adsbygoogle';
  unit.style.display='block';
  unit.setAttribute('data-ad-client',publisher);
  unit.setAttribute('data-ad-slot',slot);
  unit.setAttribute('data-ad-format',format);
  unit.setAttribute('data-full-width-responsive',format==='auto'?'true':'false');
  container.appendChild(label);
  container.appendChild(unit);
  container.classList.add('is-ready');
  initialized.add(containerId);
  (window.adsbygoogle=window.adsbygoogle||[]).push({});
 }
 function update(){
  var home=document.getElementById('home');
  if(home&&!home.classList.contains('hidden')){
   addUnit('clue5-home-ad',String(config.homeAdSlot||'').trim(),'auto');
  }
  var game=document.getElementById('game');
  // A tall, narrow sidebar on phones/tablets would put an ad beside gameplay
  // controls. Only render the sidebar placement on wide desktop viewports.
  if(game&&!game.classList.contains('hidden')&&window.matchMedia('(min-width: 1100px)').matches){
   addUnit('clue5-sidebar-ad',String(config.sidebarAdSlot||'').trim(),'rectangle');
  }
 }
 window.addEventListener('clue5:viewchange',function(){requestAnimationFrame(update);});
 window.addEventListener('resize',function(){requestAnimationFrame(update);});
 requestAnimationFrame(update);
})();
