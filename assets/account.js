/* Clue5 optional accounts. Guest play and local records always work without signing in.
   Public Supabase publishable key is intentionally client-visible. RLS protects user rows. */
(()=>{
 'use strict';
 const ROOT='https://rkzznvepvlzmkygcijda.supabase.co';
 const KEY='sb_publishable__knST15J5uSLdlgvJlAo0A_f5yryzVF';
 const AUTH='clue5-account-session-v1',PREF='clue5-account-preferences-v1',TABLE=ROOT+'/rest/v1/clue5_profiles';
 const button=document.getElementById('accountButton'),settingsButton=document.getElementById('settingsButton');
 if(!button||!settingsButton)return;
 let session=null,refreshPromise=null,syncTimer=null,cloudBusy=false,modal=null;
 const pref=(()=>{try{return JSON.parse(localStorage.getItem(PREF))||{}}catch{return {}}})();
 const text=(s)=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function savePref(){try{localStorage.setItem(PREF,JSON.stringify(pref))}catch{}}
 function setMotion(){document.documentElement.classList.toggle('clue5-less-motion',!!pref.reducedMotion)}
 setMotion();
 function notify(message,bad=false){const area=document.getElementById('accountMessage');if(area){area.textContent=message;area.className='account-message'+(bad?' bad':'')}}
 function renderButton(){button.textContent=session?.user?.email?'◉ '+String(session.user.email).split('@')[0].slice(0,18):'♙ Sign in';button.title=session?.user?.email?'Clue5 account: '+session.user.email:'Sign in to save Clue5 progress across devices'}
 function persistSession(value){session=value||null;try{if(session)localStorage.setItem(AUTH,JSON.stringify(session));else localStorage.removeItem(AUTH)}catch{}renderButton()}
 async function request(path,opts={}){
  const r=await fetch(ROOT+'/auth/v1/'+path,{...opts,headers:{apikey:KEY,'Content-Type':'application/json',...(opts.headers||{})}});
  const v=await r.json().catch(()=>({}));
  if(!r.ok)throw Error(v.msg||v.error_description||v.message||v.error||'Account service unavailable');
  return v;
 }
 async function activeToken(){
  if(!session?.access_token)return null;
  if(Date.now()<Number(session.expires_at||0)*1000-65000)return session.access_token;
  if(refreshPromise)return refreshPromise;
  refreshPromise=(async()=>{
   if(!session?.refresh_token)return null;
   try{
    const r=await request('token?grant_type=refresh_token',{method:'POST',body:JSON.stringify({refresh_token:session.refresh_token})});
    persistSession({...r,expires_at:Math.floor(Date.now()/1000)+Number(r.expires_in||3600)});
    return session.access_token;
   }catch{persistSession(null);return null}
  })();
  try{return await refreshPromise}finally{refreshPromise=null}
 }
 function snapshot(){return {daily:data.daily||{},dailySessions:data.dailySessions||{},practice:Math.max(0,Number(data.practice)||0),practiceSeen:Array.isArray(data.practiceSeen)?data.practiceSeen:[],practiceSchema:2}}
 function safeDaily(record){return record&&typeof record==='object'&&!Array.isArray(record)?record:null}
 function mergeRecords(remote,local){
  const r=remote&&typeof remote==='object'?remote:{},l=local&&typeof local==='object'?local:{};
  const daily={...(r.daily||{})};for(const [day,rec] of Object.entries(l.daily||{})){
   if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!safeDaily(rec))continue;
   const old=safeDaily(daily[day]);const oldProgress=(old?.done?100:0)+Number(old?.clue||0)+Number(old?.used||0);
   const newProgress=(rec.done?100:0)+Number(rec.clue||0)+Number(rec.used||0);
   if(!old||newProgress>=oldProgress)daily[day]=rec;
  }
  const tokens={...(r.dailySessions||{}),...(l.dailySessions||{})};
  return {daily,dailySessions:tokens,practice:Math.max(Number(r.practice)||0,Number(l.practice)||0),
   practiceSeen:[...new Set([...(Array.isArray(r.practiceSeen)?r.practiceSeen:[]),...(Array.isArray(l.practiceSeen)?l.practiceSeen:[])])].filter(Number.isInteger).slice(0,5000),practiceSchema:2};
 }
 async function cloudCall(method,body=null,query=''){
  const token=await activeToken();if(!token)throw Error('Please sign in again');
  const response=await fetch(TABLE+query,{method,headers:{apikey:KEY,Authorization:'Bearer '+token,'Content-Type':'application/json',...(method==='POST'?{Prefer:'resolution=merge-duplicates,return=minimal'}:{})},body:body?JSON.stringify(body):undefined,cache:'no-store'});
  if(!response.ok)throw Error('Cloud sync unavailable ('+response.status+')');
  if(method==='GET')return response.json();
 }
 async function syncNow(show=false){
  if(!session?.user?.id||cloudBusy)return;
  cloudBusy=true;
  try{
   const rows=await cloudCall('GET',null,'?user_id=eq.'+encodeURIComponent(session.user.id)+'&select=saved_data&limit=1');
   const merged=mergeRecords(rows?.[0]?.saved_data,snapshot());
   data={...data,...merged};
   localStorage.setItem('clue-five-v1',JSON.stringify(data));
   if(typeof dailyStatus==='function')dailyStatus();
   await cloudCall('POST',{user_id:session.user.id,saved_data:merged,updated_at:new Date().toISOString()},'?on_conflict=user_id');
   if(show)notify('Progress synced! Your saved cases are available on this account.');
  }catch(e){if(show)notify('Saved locally. '+e.message,true);else console.warn('Clue5 cloud sync:',e.message)}
  finally{cloudBusy=false}
 }
 function scheduleSync(){if(!session?.access_token||pref.autoSync===false)return;clearTimeout(syncTimer);syncTimer=setTimeout(()=>syncNow(),1100)}
 window.addEventListener('clue5:progress',scheduleSync);
 function close(){modal?.remove();modal=null;button.focus()}
 function open(mode='account'){
  modal?.remove();
  const backdrop=document.createElement('div');backdrop.className='clue5-account-backdrop';
  backdrop.innerHTML='<section class="clue5-account-dialog" role="dialog" aria-modal="true" aria-label="Clue5 account and settings"><div class="account-head"><div><small class="eyebrow">Detective profile</small><h2>'+(mode==='settings'?'Settings':'Your Clue5 account')+'</h2></div><button type="button" id="accountClose" aria-label="Close">×</button></div><div id="accountBody"></div><p class="account-message" id="accountMessage" role="status" aria-live="polite"></p></section>';
  document.body.append(backdrop);modal=backdrop;
  backdrop.addEventListener('click',e=>{if(e.target===backdrop)close()});
  backdrop.querySelector('#accountClose').onclick=close;
  draw(mode);
  document.addEventListener('keydown',esc,{once:true});
  function esc(e){if(e.key==='Escape'&&modal)close()}
 }
 function draw(mode){
  const body=document.getElementById('accountBody');if(!body)return;
  const tabs='<div class="account-tabs"><button type="button" data-page="account" class="'+(mode==='account'?'selected':'')+'">Account</button><button type="button" data-page="settings" class="'+(mode==='settings'?'selected':'')+'">Settings</button></div>';
  if(mode==='settings'){
   body.innerHTML=tabs+'<p class="account-help">You can change these settings without creating an account.</p>'+
    '<label class="account-toggle"><span>Reduce animations<small>Minimize transitions and moving effects.</small></span><input id="settingReduced" type="checkbox" '+(pref.reducedMotion?'checked':'')+'></label>'+
    '<label class="account-toggle"><span>Automatic cloud sync<small>Only applies when signed in. Guest records remain on this browser.</small></span><input id="settingSync" type="checkbox" '+(pref.autoSync===false?'':'checked')+'></label>'+
    '<button class="account-action secondary" id="settingExport" type="button">Download my progress backup</button>'+
    '<button class="account-action secondary" id="settingStats" type="button">View my statistics</button>'+
    '<p class="account-help">Your existing guest records are preserved when you create an account or sign in. You can play without signing in.</p>';
   document.getElementById('settingReduced').onchange=e=>{pref.reducedMotion=e.target.checked;savePref();setMotion()};
   document.getElementById('settingSync').onchange=e=>{pref.autoSync=e.target.checked;savePref();if(pref.autoSync)syncNow(true)};
   document.getElementById('settingExport').onclick=()=>{
    const blob=new Blob([JSON.stringify({app:'clue5',version:2,exportedAt:new Date().toISOString(),data:snapshot()},null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='clue5-progress.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    notify('Backup downloaded.');
   };
   document.getElementById('settingStats').onclick=()=>{close();document.getElementById('statsButton')?.click()};
  }else if(session?.user?.email){
   body.innerHTML=tabs+'<p class="account-help">Signed in as <strong>'+text(session.user.email)+'</strong>.</p>'+
    '<p class="account-help">Your daily history, streaks, practice count and completed cases can sync across devices. Guest play remains free.</p>'+
    '<button class="account-action" id="syncAccount" type="button">Sync my progress now</button>'+
    '<button class="account-action secondary" id="signOut" type="button">Sign out</button>';
   document.getElementById('syncAccount').onclick=()=>syncNow(true);
   document.getElementById('signOut').onclick=async()=>{
    const token=await activeToken();
    if(token)request('logout',{method:'POST',headers:{Authorization:'Bearer '+token},body:'{}'}).catch(()=>{});
    persistSession(null);clearTimeout(syncTimer);draw('account');notify('Signed out. Records on this device are still available.');
   };
  }else{
   body.innerHTML=tabs+'<p class="account-help">Keep playing as a guest, or sign in to save progress across your devices.</p>'+
    '<form id="clue5AuthForm" class="account-form"><label for="accountEmail">Email</label><input id="accountEmail" type="email" required autocomplete="email" maxlength="254" placeholder="you@example.com">'+
    '<label for="accountPassword">Password</label><input id="accountPassword" type="password" required minlength="6" autocomplete="current-password" placeholder="At least 6 characters">'+
    '<button class="account-action" type="submit" id="accountLoginSubmit">Sign in</button></form>'+
    '<div class="account-links"><button type="button" id="accountSignUp">Create an account</button><button type="button" id="accountRecover">Forgot password?</button></div>'+
    '<p class="account-help">No account required. Current guest history will be merged with your account after sign-in.</p>';
   const form=document.getElementById('clue5AuthForm'),submit=document.getElementById('accountLoginSubmit');
   form.onsubmit=async e=>{
    e.preventDefault();submit.disabled=true;const email=document.getElementById('accountEmail').value.trim(),password=document.getElementById('accountPassword').value;
    try{
     const result=await request('token?grant_type=password',{method:'POST',body:JSON.stringify({email,password})});
     persistSession({...result,expires_at:Math.floor(Date.now()/1000)+Number(result.expires_in||3600)});
     draw('account');await syncNow(true);
    }catch(e){notify(e.message,true)}finally{submit.disabled=false}
   };
   document.getElementById('accountSignUp').onclick=async()=>{
    const email=document.getElementById('accountEmail').value.trim(),password=document.getElementById('accountPassword').value;
    if(!email||password.length<6){notify('Enter a valid email and a password of at least six characters.',true);return}
    try{
     const result=await request('signup',{method:'POST',body:JSON.stringify({email,password})});
     if(result.access_token){persistSession({...result,expires_at:Math.floor(Date.now()/1000)+Number(result.expires_in||3600)});draw('account');await syncNow(true)}
     else notify('Check your email for a confirmation link, then return here to sign in.');
    }catch(e){notify(e.message,true)}
   };
   document.getElementById('accountRecover').onclick=async()=>{
    const email=document.getElementById('accountEmail').value.trim();
    if(!email){notify('Enter your email address first.',true);return}
    try{await request('recover',{method:'POST',body:JSON.stringify({email})});notify('If this email has an account, a password reset email has been sent.')}
    catch(e){notify(e.message,true)}
   };
  }
  body.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>{draw(b.dataset.page);notify('')});
 }
 button.onclick=()=>open('account');settingsButton.onclick=()=>open('settings');
 try{const saved=JSON.parse(localStorage.getItem(AUTH));if(saved?.access_token&&saved?.refresh_token&&saved?.user?.id)persistSession(saved)}catch{}
 renderButton();
 if(session)activeToken().then(t=>{if(t&&pref.autoSync!==false)syncNow()}).catch(()=>{});
})();
