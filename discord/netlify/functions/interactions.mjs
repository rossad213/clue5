// Discord /clue5 slash command -> launch existing Clue5 Activity.
// Discord verifies this endpoint when configured in Developer Portal.
// Verify every request using the application's public signing key.
import {createPublicKey, verify} from 'node:crypto';

const error=(status,msg)=>Response.json({error:msg},{status,headers:{'Cache-Control':'no-store'}});
function validSignature(raw,signature,timestamp,publicKey){
  if(!/^[a-f0-9]{128}$/i.test(signature||'')||!/^[a-f0-9]{64}$/i.test(publicKey||'')||!/^\d{8,20}$/.test(timestamp||''))return false;
  const seconds=Number(timestamp);
  if(!Number.isFinite(seconds)||Math.abs(Date.now()/1000-seconds)>300)return false;
  try{
    const prefix=Buffer.from('302a300506032b6570032100','hex');
    const key=createPublicKey({key:Buffer.concat([prefix,Buffer.from(publicKey,'hex')]),format:'der',type:'spki'});
    return verify(null,Buffer.from(timestamp+raw,'utf8'),key,Buffer.from(signature,'hex'));
  }catch{return false}
}
export default async function handler(request){
  if(request.method!=='POST')return error(405,'POST required');
  const raw=await request.text();
  if(raw.length>16000)return error(413,'Request too large');
  const publicKey=Netlify.env.get('DISCORD_PUBLIC_KEY');
  if(!publicKey)return error(503,'Discord public key not configured');
  if(!validSignature(raw,request.headers.get('x-signature-ed25519'),request.headers.get('x-signature-timestamp'),publicKey))return error(401,'Invalid Discord signature');
  let interaction;try{interaction=JSON.parse(raw)}catch{return error(400,'Invalid JSON')}
  // PING is used by Discord to verify the configured Interactions Endpoint.
  if(interaction.type===1)return Response.json({type:1});
  // Only this exact registered slash command can launch the Activity.
  if(interaction.type===2&&interaction.data?.type===1&&interaction.data?.name==='clue5')
    return Response.json({type:12});
  return error(400,'Unsupported Discord interaction');
}
export const config={path:'/api/interactions',method:['POST']};
