# Clue5 Discord Edition

Separate Vercel project: clue5-discord (root directory: discord/). Existing Clue5 website stays untouched.

## Play modes
- Single Player: daily case (via original secure daily API) and unlimited spoiler-free practice (via original practice pool).
- Party Mode: shared Discord Activity instance, 2–10 players, private guesses, 6 incorrect guesses per player, up to 5 clues, score and cumulative leaderboard, host-controlled reveals and 3-minute round limit.

## Required owner setup
1. Create a Clue5 Discord app at https://discord.com/developers/applications. Copy its public Application ID.
2. OAuth2: add placeholder Redirect URI https://127.0.0.1 .
3. Activities settings: map prefix / to the dedicated Clue5 Discord Vercel deployment hostname; enable Activities.
4. In Vercel project clue5-discord set VITE_DISCORD_CLIENT_ID and DISCORD_CLIENT_ID to your application ID.
5. Add DISCORD_CLIENT_SECRET and DISCORD_BOT_TOKEN as private Vercel environment variables. Never paste them into chat or GitHub.
6. Create a dedicated Supabase project (do not reuse the LeagueBuddies or Scripture Pulse database). Run schema.sql in its SQL editor.
7. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY as Vercel server-side environment variables. The key must NEVER reach browser code.
8. Redeploy the Discord Vercel project after adding Vercel environment variables.
9. Launch the Activity in Discord. Test with two accounts in the same Activity; the room is keyed by Discord's instanceId.

## Testing
- Browser preview: Single Player can run without Discord credentials. Party Mode explains why Discord configuration is needed.
- Discord client: Play daily solo, play practice solo, join same Party Mode with two people, submit private guesses, reveal another clue, close an unsolved round after 3 minutes, and start next round.
- Rooms expire 3 hours after creation; schedule deletion of expired database rows later as usage grows.

## Limitations
- The Party Mode API has been coded, but cannot connect players before owner configures Discord OAuth, bot token, URL mapping, and dedicated Supabase project.
- The initial multiplayer engine uses 4-second polling, not WebSockets.
- Existing Clue5 website and Discord edition do not synchronize statistics or streaks.
- Paid subscriptions and slash-command bot are future features.

## Security
- Never expose Discord secrets or the Supabase service role key publicly.
- Party API checks Discord OAuth user and verifies Activity instance with Discord Bot API before accessing rooms.
- Database table enables RLS and denies anon/authenticated role access; all access is server-side.
- Solo daily puzzles use the existing secure Clue5 server and do not publish upcoming daily answers.

## Automatic channel results
- Completed solo Daily and Practice cases publish a spoiler-free result into the Discord channel that launched the Activity, without a Share button or prompt.
- Party Mode publishes a final leaderboard when the round is completed by all players or ended by the host. The secret answer is never included in the channel message.
- The bot must be installed in the server and have **View Channel** and **Send Messages** for that channel. For private-channel Activities, the bot must be able to access the target channel.
- Result messages are sent server-side via DISCORD_BOT_TOKEN after checking the player's OAuth identity and membership in the active Activity. The client cannot select an arbitrary posting destination.
- Discord's message nonce prevents duplicate posts within a short window. Solo results also record successful deliveries locally, but permanent server-side deduplication is not yet available.
- If Discord denies posting, the Activity preserves the score and displays a delivery warning instead of blocking the game. No automatic sharing occurs in standalone browser preview.
