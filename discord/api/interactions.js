// Vercel HTTP interactions endpoint for Discord /clue5.
// Discord signs each request; reject invalid signatures before responding.
// Parsing MUST remain disabled to preserve the exact signed request bytes.
import {createPublicKey,verify} from 'node:crypto';
export const config={api:{bodyParser:false}};
function valid(raw,signature,timestamp,keyHex){
 if(!/^[a-f0-9]{128}$/i.test(signature||'')||!/^[a-f0-9]{64}$/i.test(keyHex||'')||!/^\d{8,20}$/.test(timestamp||''))return false;
 if(Math.abs(Date.now()/1000-Number(timestamp))>300)return false;
 try{
  const key=createPublicKey({key:Buffer.concat([Buffer.from('302a300506032b6570032100','hex'),Buffer.from(keyHex,'hex')]),format:'der',type:'spki'});
  return verify(null,Buffer.concat([Buffer.from(timestamp),raw]),key,Buffer.from(signature,'hex'));
 }catch{return false}
}
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).json({error:'POST required'});
 try{
  const parts=[];let size=0;
  for await(const chunk of req){size+=chunk.length;if(size>16000)return res.status(413).json({error:'Request too large'});parts.push(chunk)}
  const raw=Buffer.concat(parts);
  if(!valid(raw,req.headers['x-signature-ed25519'],req.headers['x-signature-timestamp'],process.env.DISCORD_PUBLIC_KEY))
   return res.status(401).json({error:'Invalid Discord request signature'});
  let interaction;try{interaction=JSON.parse(raw.toString('utf8'))}catch{return res.status(400).json({error:'Invalid JSON'})}
  if(interaction.type===1)return res.status(200).json({type:1});
  if(interaction.type===2&&interaction.data?.type===1&&interaction.data?.name==='clue5')return res.status(200).json({type:12});
  return res.status(400).json({error:'Unsupported interaction'});
 }catch(e){console.error('Discord interactions error:',e);return res.status(500).json({error:'Interactions unavailable'})}
}
