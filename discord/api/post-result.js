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
   if(typeof b.token!=='string'||b.token.length>3000)return res.status(400).json({error:'Invalid daily session'});
   const r=await fetch(MAIN+'/api/daily',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'restore',token:b.token}),cache:'no-store'});
   if(!r.ok)throw Error('Unable to verify completed daily puzzle');
   const s=await r.json();
   if(!s.done)throw Error('Daily case is not yet complete');
   ({won,score,clue,used,day}=s);
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
