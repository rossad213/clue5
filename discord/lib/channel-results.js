// Server-only Discord channel result publisher. Never expose the bot token to the Activity.
import {createHash} from 'node:crypto';
export async function verifiedActivity(req,instanceId){
 if(!process.env.DISCORD_CLIENT_ID||!process.env.DISCORD_BOT_TOKEN)throw Error('Discord bot configuration missing');
 if(typeof instanceId!=='string'||!/^[a-zA-Z0-9_-]{8,128}$/.test(instanceId))throw Error('Invalid Activity instance');
 const access=String(req.headers.authorization||'').match(/^Bearer ([a-zA-Z0-9._-]{20,4000})$/)?.[1];
 if(!access)throw Error('Discord sign-in required');
 const me=await fetch('https://discord.com/api/v10/users/@me',{headers:{Authorization:'Bearer '+access}});
 if(!me.ok)throw Error('Discord sign-in expired');
 const user=await me.json();
 const r=await fetch('https://discord.com/api/v10/applications/'+process.env.DISCORD_CLIENT_ID+'/activity-instances/'+encodeURIComponent(instanceId),{headers:{Authorization:'Bot '+process.env.DISCORD_BOT_TOKEN}});
 if(!r.ok)throw Error('Discord Activity has ended');
 const activity=await r.json();
 const members=Array.isArray(activity.users)?activity.users:activity.participants?.map(p=>p.user_id)||[];
 if(!user?.id||!members.map(String).includes(String(user.id)))throw Error('Player is not in this Activity');
 const channel=String(activity.location?.channel_id||activity.channel_id||'');
 if(!/^\d{15,22}$/.test(channel))throw Error('Activity has no writable channel');
 return {userId:String(user.id),name:String(user.global_name||user.username||'Detective').slice(0,40),channel};
}
export async function postResult(channel,key,body){
 const nonce=createHash('sha256').update('clue5:'+key).digest('hex').slice(0,25);
 const r=await fetch('https://discord.com/api/v10/channels/'+channel+'/messages',{
  method:'POST',headers:{Authorization:'Bot '+process.env.DISCORD_BOT_TOKEN,'Content-Type':'application/json'},
  body:JSON.stringify({content:String(body).slice(0,1800),nonce,enforce_nonce:true,allowed_mentions:{parse:[]},flags:4})
 });
 if(!r.ok)throw Error(r.status===403?'Bot needs View Channel and Send Messages permissions':'Discord could not publish the result ('+r.status+')');
 return true;
}
export function soloResult(name,day,won,score,clue,used,daily){
 const label=daily?'Daily Case · '+day:'Practice Case';
 const squares=Array.from({length:5},(_,i)=>i<clue?(won&&i===clue-1?'🟩':'🟨'):'⬛').join('');
 return ['🗂️ **CLUE5 · '+label+'**','**'+(won?'CASE SOLVED':'CASE CLOSED')+'**',squares,'**'+(won?score:0)+' points** · '+Math.min(6,used)+'/6 incorrect guesses','Detective: '+name,'Play: https://clue5.io'].join('\n');
}
export function partyResult(round,players){
 const top=Object.values(players||{}).sort((a,b)=>Number(b.score||0)-Number(a.score||0)).slice(0,10);
 const lines=top.map((p,i)=>(i+1)+'. '+String(p.name||'Detective').replace(/[@*_`~<>]/g,'').slice(0,38)+' — '+Math.max(0,Number(p.score)||0)+' pts'+(p.solved?' ✅':''));
 return ['🗂️ **CLUE5 · Party Round '+round+' Complete**','**Final leaderboard**',...lines,'Play: https://clue5.io'].join('\n');
}
