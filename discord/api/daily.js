// Server-authoritative Daily Mystery, one session per verified Discord user per
// Central-time day. Each DM/server Activity loads the SAME encrypted session.
// Client-supplied session tokens are ignored; a new conversation cannot reset it.
import {verifiedActivity} from '../lib/channel-results.js';
const MAIN='https://clue-five-wheat.vercel.app';
const TABLE='clue5_discord_daily_sessions';
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
function dbHeaders(prefer){
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!key||!process.env.SUPABASE_URL)throw Error('Daily sync storage unavailable');
 return {apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json',...(prefer?{Prefer:prefer}:{})};
}
function dbUrl(query=''){return process.env.SUPABASE_URL.replace(/\/$/,'')+'/rest/v1/'+TABLE+query}
const keyQuery=(id,day)=>'?discord_user_id=eq.'+encodeURIComponent(id)+'&puzzle_day=eq.'+encodeURIComponent(day);
async function read(id,day){
 const r=await fetch(dbUrl(keyQuery(id,day)+'&select=session_token,version'),{headers:dbHeaders(),cache:'no-store'});
 if(!r.ok)throw Error('Unable to load Daily progress ('+r.status+')');
 return (await r.json())[0]||null;
}
async function upstream(action,token,guess){
 const body=action==='open'?null:{action:action==='open'?'restore':action,token,...(action==='guess'?{guess}:{})};
 const r=await fetch(MAIN+'/api/daily',{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined,cache:'no-store'});
 const v=await r.json().catch(()=>({}));
 if(!r.ok)throw Error(v.error||'Daily puzzle unavailable');
 if(!v?.token||typeof v.day!=='string')throw Error('Invalid Daily server response');
 return v;
}
async function initialize(id,day){
 const fresh=await upstream('open');
 if(fresh.day!==day)throw Error('Daily puzzle changed. Try again.');
 const insert=await fetch(dbUrl('?on_conflict=discord_user_id,puzzle_day'),{
  method:'POST',headers:dbHeaders('resolution=ignore-duplicates,return=minimal'),
  body:JSON.stringify({discord_user_id:id,puzzle_day:day,session_token:fresh.token})
 });
 if(!insert.ok)throw Error('Unable to save Daily progress ('+insert.status+')');
 return read(id,day);
}
async function update(id,day,version,token){
 const query=keyQuery(id,day)+'&version=eq.'+version+'&select=version';
 const r=await fetch(dbUrl(query),{method:'PATCH',headers:dbHeaders('return=representation'),
  body:JSON.stringify({session_token:token,version:version+1,updated_at:new Date().toISOString()})});
 if(!r.ok)throw Error('Unable to save Daily progress ('+r.status+')');
 return (await r.json()).length===1;
}
export default async function handler(req,res){
 res.setHeader('Cache-Control','private,no-store');
 if(req.method!=='POST')return res.status(405).json({error:'Use the authenticated Discord Daily game'});
 const b=req.body||{},action=b.action;
 if(!['open','guess','reveal','giveup'].includes(action))return res.status(400).json({error:'Invalid Daily action'});
 if(JSON.stringify(b).length>1500)return res.status(413).json({error:'Request too large'});
 if(action==='guess'&&(typeof b.guess!=='string'||b.guess.length<1||b.guess.length>80))return res.status(400).json({error:'Enter a guess up to 80 characters'});
 try{
  const who=await verifiedActivity(req,b.instanceId);
  const day=today();
  let row=await read(who.userId,day);
  if(!row)row=await initialize(who.userId,day);
  if(!row)throw Error('Unable to start your Daily session');
  // Open and completed games are read-only. Never start another attempt.
  const current=await upstream('restore',row.session_token);
  if(current.day!==day)throw Error('Daily date changed. Reopen the case.');
  if(action==='open'||current.done)return res.status(200).json(current);
  const result=await upstream(action,row.session_token,b.guess);
  if(result.day!==day)throw Error('Daily date changed. Reopen the case.');
  if(!await update(who.userId,day,row.version,result.token)){
   return res.status(409).json({error:'Your Daily case changed in another conversation. Reopen it to see your latest progress.'});
  }
  return res.status(200).json(result);
 }catch(e){
  console.warn('Discord daily error:',String(e.message||e));
  return res.status(400).json({error:String(e.message||'Daily case unavailable').slice(0,160)});
 }
}
