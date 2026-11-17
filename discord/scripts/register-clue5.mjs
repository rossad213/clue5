// One-time command registration; run LOCALLY using your bot token.
// Do not place the bot token in GitHub, this file, chat, or the browser.
const id=process.env.DISCORD_CLIENT_ID||'1572073551312322580';
const token=process.env.DISCORD_BOT_TOKEN;
if(!token){console.error('Missing DISCORD_BOT_TOKEN environment variable.');process.exit(1)}
const url='https://discord.com/api/v10/applications/'+encodeURIComponent(id)+'/commands';
const body={name:'clue5',description:'Play Clue5 — five clues, six guesses, one mystery.',type:1,integration_types:[0,1],contexts:[0,1,2]};
const r=await fetch(url,{method:'POST',headers:{Authorization:'Bot '+token,'Content-Type':'application/json'},body:JSON.stringify(body)});
const response=await r.json().catch(()=>({}));
if(!r.ok){console.error('Discord rejected /clue5 registration:',r.status,response.message||JSON.stringify(response.errors||{}));process.exit(1)}
console.log('Registered /clue5 successfully. Command ID:',response.id);
