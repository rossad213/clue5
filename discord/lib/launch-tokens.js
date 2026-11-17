// Short-lived slash-command delivery tokens, stored server-side only in the
// dedicated Clue5 Discord Supabase project. Never return a token to the browser.
const TABLE='clue5_discord_launches';
function headers(prefer){
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!process.env.SUPABASE_URL||!key)throw Error('Discord result storage not configured');
 return {'apikey':key,'Authorization':'Bearer '+key,'Content-Type':'application/json',...(prefer?{'Prefer':prefer}:{})};
}
function url(query=''){
 return process.env.SUPABASE_URL.replace(/\/$/,'')+'/rest/v1/'+TABLE+query;
}
export async function rememberLaunch(interaction){
 const user=interaction.member?.user?.id||interaction.user?.id;
 const channel=interaction.channel_id,token=interaction.token;
 if(!/^\d{15,22}$/.test(String(user||''))||!/^\d{15,22}$/.test(String(channel||''))||typeof token!=='string'||token.length<20)return false;
 const expiry=new Date(Date.now()+14*60*1000).toISOString();
 const body={launch_id:String(interaction.id),channel_id:String(channel),user_id:String(user),interaction_token:token,expires_at:expiry};
 const r=await fetch(url('?on_conflict=launch_id'),{method:'POST',headers:headers('resolution=ignore-duplicates,return=minimal'),body:JSON.stringify(body)});
 if(!r.ok)throw Error('Could not save result callback ('+r.status+')');
 return true;
}
export async function claimLaunch(channel,user){
 const now=new Date().toISOString();
 const query='?channel_id=eq.'+encodeURIComponent(channel)+'&user_id=eq.'+encodeURIComponent(user)+'&expires_at=gt.'+encodeURIComponent(now)+'&consumed_at=is.null&order=created_at.desc&limit=1&select=launch_id,interaction_token';
 const r=await fetch(url(query),{headers:headers()});
 if(!r.ok)throw Error('Could not read result callback');
 const rows=await r.json(),one=rows[0];
 if(!one)return null;
 // Atomic claim prevents multiple completed cases reusing the same launch interaction.
 const claim='?launch_id=eq.'+encodeURIComponent(one.launch_id)+'&consumed_at=is.null&select=launch_id';
 const marked=await fetch(url(claim),{method:'PATCH',headers:headers('return=representation'),body:JSON.stringify({consumed_at:new Date().toISOString()})});
 if(!marked.ok)throw Error('Could not claim result callback');
 const claimed=await marked.json();
 return claimed.length?one.interaction_token:null;
}
export async function postInteractionResult(token,content){
 if(!process.env.DISCORD_CLIENT_ID)throw Error('Discord application not configured');
 const route='https://discord.com/api/v10/webhooks/'+process.env.DISCORD_CLIENT_ID+'/'+encodeURIComponent(token);
 const r=await fetch(route,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({content:String(content).slice(0,1800),allowed_mentions:{parse:[]}})});
 if(!r.ok)throw Error('Discord could not deliver result into this DM ('+r.status+')');
 return true;
}
