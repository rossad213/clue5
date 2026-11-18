// Solo results are posted automatically on completion, from the authenticated Activity.
import {verifiedActivity,postResult,soloResult} from '../lib/channel-results.js';
import {claimLaunch,postInteractionResult} from '../lib/launch-tokens.js';
const MAIN='https://clue-five-wheat.vercel.app';
export default async function handler(req,res){
 res.setHeader('Cache-Control','private, no-store');
 if(req.method!=='POST')return res.status(405).json({error:'POST required'});
 const b=req.body||{};
 if(!['daily','practice'].includes(b.mode))return res.status(400).json({error:'Invalid result mode'});
 try{
  const activity=await verifiedActivity(req,b.instanceId);
  let won,score,clue,used,day,identity;
  if(b.mode==='daily'){
   // Only use the verified Discord player's authoritative session. The browser
   // cannot submit another person's token or forge an improved score.
   const currentDay=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
   const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
   if(!key||!process.env.SUPABASE_URL)throw Error('Daily result storage unavailable');
   const url=process.env.SUPABASE_URL.replace(/\\/$/,'')+'/rest/v1/clue5_discord_daily_sessions?discord_user_id=eq.'+
    encodeURIComponent(activity.userId)+'&puzzle_day=eq.'+encodeURIComponent(currentDay)+'&select=session_token';
   const saved=await fetch(url,{headers:{apikey:key,Authorization:'Bearer '+key},cache:'no-store'});
   if(!saved.ok)throw Error('Could not load Daily result');
   const rows=await saved.json();
   if(!rows.length)throw Error('You have not played today\'s Daily Mystery yet');
   const r=await fetch(MAIN+'/api/daily',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({action:'restore',token:rows[0].session_token}),cache:'no-store'});
   if(!r.ok)throw Error('Unable to verify completed Daily Mystery');
   const state=await r.json();
   if(!state.done||state.day!==currentDay)throw Error('Finish today\'s Daily Mystery before sharing');
   ({won,score,clue,used,day}=state);
   identity='daily:'+day;
  }else{
   if(typeof b.caseId!=='number'||!Number.isInteger(b.caseId)||b.caseId<0||typeof b.roundId!=='string'||!/^[a-zA-Z0-9_-]{12,80}$/.test(b.roundId))throw Error('Invalid practice result');
   won=b.won===true;clue=b.clue;used=b.used;
   if(!Number.isInteger(clue)||clue<1||clue>5||!Number.isInteger(used)||used<0||used>6)throw Error('Invalid practice score');
   score=won?120-clue*20:0;
   if(Number(b.score)!==score)throw Error('Practice score does not match the clues used');
   day='';identity='practice:'+b.roundId;
  }
  const key=activity.userId+':'+activity.channel+':'+identity;
  const message=soloResult(activity.name,day,won,score,clue,used,b.mode==='daily');
  if(activity.locationKind==='pc'){
   const launchToken=await claimLaunch(activity.channel,activity.userId);
   if(!launchToken)throw Error('Discord DM result window expired. Relaunch /clue5 to play another case.');
   await postInteractionResult(launchToken,message);
  }else await postResult(activity.channel,key,message);
  return res.status(200).json({posted:true});
 }catch(err){return res.status(400).json({error:String(err.message||'Could not publish result').slice(0,160)})}
}
