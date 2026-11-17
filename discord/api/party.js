// Shared Discord Party Mode, backed by a dedicated Supabase table.
// Authentication is verified with Discord on every request; no guesses or answers leak before case completion.
import spoilerGuard from '../../assets/clue-safety.js';
import answerAliases from '../../assets/answer-aliases.js';
const MAIN='https://clue-five-wheat.vercel.app';
let cached=null,loaded=0;
const normalize=s=>String(s||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');
const synonyms={Automobile:['car','auto'],Bicycle:['bike'],Television:['tv'],Airplane:['plane'],Refrigerator:['fridge'],Telephone:['phone']};
async function cases(){
 if(cached&&Date.now()-loaded<600000)return cached;
 const response=await fetch(MAIN+'/data/practice.js');if(!response.ok)throw Error('Practice archive unavailable');
 const src=await response.text(),i=src.indexOf('.concat(');if(i<0)throw Error('Practice format changed');
 cached=JSON.parse(src.slice(i+8).trim().replace(/\);\s*$/,'')).filter(c=>Array.isArray(c)&&typeof c[0]==='string'&&Array.isArray(c[2])&&c[2].length===5);cached=spoilerGuard.clean(cached,answerAliases);loaded=Date.now();return cached;
}
function config(){return process.env.DISCORD_CLIENT_ID&&process.env.DISCORD_BOT_TOKEN&&process.env.SUPABASE_URL&&process.env.SUPABASE_SERVICE_ROLE_KEY}
function dbUrl(query){return process.env.SUPABASE_URL.replace(/\/$/,'')+'/rest/v1/clue5_discord_rooms'+query}
function headers(prefer){return {'apikey':process.env.SUPABASE_SERVICE_ROLE_KEY,'Authorization':'Bearer '+process.env.SUPABASE_SERVICE_ROLE_KEY,'Content-Type':'application/json',...(prefer?{'Prefer':prefer}:{})}}
async function db(method,query,body,prefer){
 const r=await fetch(dbUrl(query),{method,headers:headers(prefer),body:body===undefined?undefined:JSON.stringify(body)});
 if(!r.ok)throw Error('Room storage error ('+r.status+')');
 const raw=await r.text();return raw?JSON.parse(raw):[];
}
const query=id=>'?instance_id=eq.'+encodeURIComponent(id)+'&select=*';
async function read(id){const rows=await db('GET',query(id));return rows[0]||null}
async function checkIdentity(req,id){
 const token=(req.headers.authorization||'').match(/^Bearer ([a-zA-Z0-9._-]{20,4000})$/)?.[1];
 if(!token)throw Error('Discord sign-in required');
 const response=await fetch('https://discord.com/api/v10/users/@me',{headers:{Authorization:'Bearer '+token}});
 if(!response.ok)throw Error('Discord session expired');const user=await response.json();
 if(!user?.id)throw Error('User authentication failed');
 // Verify instance is active; a spoofed Discord iframe alone never authorizes a room.
 const instance=await fetch('https://discord.com/api/v10/applications/'+process.env.DISCORD_CLIENT_ID+'/activity-instances/'+encodeURIComponent(id),{headers:{Authorization:'Bot '+process.env.DISCORD_BOT_TOKEN}});
 if(!instance.ok)throw Error('This Discord Activity room is not active');
 const room=await instance.json();
 if(!Array.isArray(room.users)||!room.users.includes(String(user.id)))throw Error('You are not a participant in this Discord Activity');
 return {id:String(user.id),name:String(user.global_name||user.username||'Detective').slice(0,40)};
}
function chosen(pool,exclude=-1){let index=Math.floor(Math.random()*pool.length);if(index===exclude&&pool.length>1)index=(index+1)%pool.length;return index}
function fresh(id,who,pool,index){const c=pool[index];return {instance_id:id,round:1,case_index:index,category:c[1],answer:c[0],clues:c[2],aliases:c[3]||[],players:{[who.id]:{name:who.name,score:0,used:0,solved:false}},host_id:who.id,clue_count:1,ended:false,started_at:new Date().toISOString(),expires_at:new Date(Date.now()+10800000).toISOString(),version:0}}
function publicState(state,userId){
 const timedOut=Date.now()-Date.parse(state.started_at)>180000;
 const people=Object.entries(state.players||{}).map(([id,p])=>({name:p.name,score:p.score,solved:p.solved}));
 return {round:state.round,clueCount:state.clue_count,category:state.category,clues:state.clues.slice(0,state.clue_count),ended:state.ended||timedOut,answer:state.ended||timedOut?state.answer:null,players:people,mySolved:!!state.players?.[userId]?.solved,myUsed:state.players?.[userId]?.used||0,isHost:state.host_id===userId};
}
function equal(guess,state){return [state.answer,...(state.aliases||[]),...(synonyms[state.answer]||[])].some(x=>normalize(x)===normalize(guess))}
export default async function handler(req,res){
 res.setHeader('Cache-Control','private,no-store');
 if(req.method!=='POST')return res.status(405).json({error:'POST required'});
 if(!config())return res.status(503).json({error:'Party Mode is not connected yet. Configure Discord credentials and a dedicated Supabase room database.'});
 const body=req.body||{},id=body.instanceId;
 if(typeof id!=='string'||!/^[-a-zA-Z0-9_]{8,128}$/.test(id)||!['join','state','guess','reveal','answer','next'].includes(body.action))return res.status(400).json({error:'Invalid room request'});
 try{
  const who=await checkIdentity(req,id);
  const pool=await cases();
  for(let attempt=0;attempt<5;attempt++){
   let row=await read(id);
   if(!row){
    if(body.action!=='join')return res.status(404).json({error:'Join this party first'});
    const initial=fresh(id,who,pool,chosen(pool));
    await db('POST','?on_conflict=instance_id',initial,'resolution=ignore-duplicates,return=minimal');
    row=await read(id);if(!row)continue;
   }
   if(row.expires_at&&Date.parse(row.expires_at)<Date.now())return res.status(410).json({error:'Party room expired; launch a new Discord Activity'});
   const members={...(row.players||{})};
   if(body.action==='state'){if(!members[who.id])return res.status(403).json({error:'Join the party before viewing it'});return res.status(200).json(publicState(row,who.id));}
   let patch={};
   if(body.action==='join'){
    if(!members[who.id]){
     if(Object.keys(members).length>=10)return res.status(403).json({error:'This party is full (10 detectives)'});
     members[who.id]={name:who.name,score:0,used:0,solved:false};
     patch.players=members;
    }else return res.status(200).json(publicState(row,who.id));
   }else{
    if(!members[who.id])return res.status(403).json({error:'Join this party first'});
    const over=row.ended||Date.now()-Date.parse(row.started_at)>180000;
    if(body.action==='guess'){
     const guess=body.guess;
     if(over)return res.status(409).json({error:'The round has ended'});
     if(!Number.isInteger(body.round)||body.round!==row.round)return res.status(409).json({error:'Round changed; refresh'});
     if(typeof guess!=='string'||guess.trim().length<1||guess.length>80)return res.status(400).json({error:'Enter a guess up to 80 characters'});
     if(members[who.id].solved||members[who.id].used>=6)return res.status(409).json({error:'You have finished this round'});
     const right=equal(guess,row);
     if(right){members[who.id].solved=true;members[who.id].score+=120-row.clue_count*20;}
     else members[who.id].used++;
     patch.players=members;
     if(Object.values(members).every(p=>p.solved||p.used>=6))patch.ended=true;
    }else if(body.action==='reveal'){
     if(who.id!==row.host_id)return res.status(403).json({error:'Only the party host can reveal clues'});
     if(over)return res.status(409).json({error:'Round ended'});
     if(row.clue_count>=5)return res.status(409).json({error:'All clues revealed'});
     patch.clue_count=row.clue_count+1;
    }else if(body.action==='answer'){
     if(who.id!==row.host_id)return res.status(403).json({error:'Only the party host can reveal the answer'});
     if(over)return res.status(409).json({error:'Round already ended'});
     if(row.clue_count<5)return res.status(409).json({error:'Reveal all five clues first'});
     patch.ended=true;
    }else if(body.action==='next'){
     if(who.id!==row.host_id)return res.status(403).json({error:'Only the party host can start a new round'});
     if(!over)return res.status(409).json({error:'Finish this case before starting the next round'});
     if(row.round>=500)return res.status(409).json({error:'Party has reached its round limit'});
     const index=chosen(pool,row.case_index),c=pool[index];
     patch={round:row.round+1,case_index:index,category:c[1],answer:c[0],clues:c[2],aliases:c[3]||[],clue_count:1,ended:false,started_at:new Date().toISOString(),players:Object.fromEntries(Object.entries(members).map(([id,p])=>[id,{...p,solved:false,used:0}]))};
    }
   }
   if(!Object.keys(patch).length)return res.status(200).json(publicState(row,who.id));
   const updated=await db('PATCH',query(id)+'&version=eq.'+row.version,{...patch,version:row.version+1},'return=representation');
   if(updated.length)return res.status(200).json(publicState(updated[0],who.id));
  }
  return res.status(409).json({error:'The room is busy. Try again.'});
 }catch(err){return res.status(400).json({error:String(err.message||'Party unavailable').slice(0,180)})}
}
