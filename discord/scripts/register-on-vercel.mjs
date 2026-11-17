// Runs during production Vercel builds only. Uses the bot token stored in Vercel
// environment variables; it must never be passed through the browser or logs.
if(process.env.VERCEL_ENV!=='production'){
 console.log('Skipping /clue5 registration outside production.');
}else{
 if(!process.env.DISCORD_CLIENT_ID||!process.env.DISCORD_BOT_TOKEN)throw Error('Discord application ID or bot token is missing from production environment');
 await import('./register-clue5.mjs');
}
