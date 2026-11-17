/* Clue5 PWA: local practice works offline; private daily API stays online-only. */
const CACHE='clue5-static-v5';
const SHELL=['/','/index.html','/how-to-play.html','/privacy.html','/data/practice.js','/assets/account.js','/assets/answer-aliases.js','/assets/noir-office.svg','/favicon.png?v=3','/manifest.webmanifest','/icons/clue5-192.svg','/icons/clue5-512.svg','/icons/clue5-maskable.svg'];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('clue5-static-')&&key!==CACHE).map(key=>caches.delete(key)))),self.clients.claim()]));
});
self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;
 const url=new URL(req.url);
 // Never cache server answers, signed daily sessions or internal case data.
 if(url.pathname.startsWith('/api/')||url.pathname.startsWith('/server/')||(url.pathname.startsWith('/data/')&&url.pathname!=='/data/practice.js'))return;
 if(req.mode==='navigate'){
  event.respondWith(fetch(req).then(res=>{
   if(res.ok){const clone=res.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put('/',clone)));}
   return res;
  }).catch(async()=>await caches.match('/')||Response.error()));
  return;
 }
 // Always fetch fresh practice content while online so new cases appear automatically.
 if(url.pathname==='/data/practice.js'){
  event.respondWith(fetch(req).then(res=>{
   if(res.ok){const clone=res.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put('/data/practice.js',clone)));}
   return res;
  }).catch(async()=>await caches.match('/data/practice.js')||Response.error()));
  return;
 }
 if(SHELL.some(path=>url.pathname===path.split('?')[0])){
  event.respondWith(caches.match(req,{ignoreSearch:true}).then(cached=>cached||fetch(req).then(res=>{
   if(res.ok){const clone=res.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(req,clone)));}
   return res;
  })));
 }
});
