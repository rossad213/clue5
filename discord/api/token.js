// Discord OAuth exchange. Never send a client secret to the browser.
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).json({error:'POST required'});
 if(!process.env.DISCORD_CLIENT_ID||!process.env.DISCORD_CLIENT_SECRET)return res.status(503).json({error:'Discord credentials not configured'});
 const code=req.body?.code;
 if(typeof code!=='string'||code.length<10||code.length>500)return res.status(400).json({error:'Invalid authorization code'});
 try{
  const exchange=await fetch('https://discord.com/api/oauth2/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:process.env.DISCORD_CLIENT_ID,client_secret:process.env.DISCORD_CLIENT_SECRET,grant_type:'authorization_code',code})});
  const data=await exchange.json();
  if(!exchange.ok||!data.access_token)return res.status(401).json({error:'Discord authorization failed'});
  return res.status(200).json({access_token:data.access_token});
 }catch{return res.status(502).json({error:'Discord temporarily unavailable'});}
}
