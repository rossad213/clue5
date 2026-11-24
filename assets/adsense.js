/* Clue5 AdSense: single, explicit home-page ad unit only.
 * No publisher ID / slot = no AdSense network request and no blank ad panel.
 * Ads do not render in the active case, archive, or modal.
 * Auto ads must remain disabled in AdSense to avoid uncontrolled overlays.
 */
(function(){
 'use strict';
 var config=window.CLUE5_ADSENSE_CONFIG||{};
 var publisher=String(config.publisherId||'').trim();
 var slot=String(config.homeAdSlot||'').trim();
 var container=document.getElementById('clue5-home-ad');
 if(!container)return;
 if(!/^ca-pub-\d{16}$/.test(publisher))return;
 // Load Google's official script for AdSense site verification. The ad unit
 // is rendered only when a real numeric slot ID is also configured.
 var script=document.createElement('script');
 script.async=true;
 script.crossOrigin='anonymous';
 script.src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client='+encodeURIComponent(publisher);
 document.head.appendChild(script);
 if(!/^\d{8,20}$/.test(slot))return;
 var label=document.createElement('div');
 label.className='clue5-ad-label';
 label.textContent='Advertisement';
 var unit=document.createElement('ins');
 unit.className='adsbygoogle';
 unit.style.display='block';
 unit.setAttribute('data-ad-client',publisher);
 unit.setAttribute('data-ad-slot',slot);
 unit.setAttribute('data-ad-format','auto');
 unit.setAttribute('data-full-width-responsive','true');
 container.appendChild(label);
 container.appendChild(unit);
 container.classList.add('is-ready');
 // Keep out of the game panel. An ad shown on Home is hidden whenever
 // another view is active because its parent #home is hidden.
 window.adsbygoogle=window.adsbygoogle||[];
 window.adsbygoogle.push({});
})();
