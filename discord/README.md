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
- Paid subscriptions are future features. The /clue5 slash command endpoint and registration script exist, but registration and Discord Developer Portal configuration must be completed before the command is usable.

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

## /clue5 in servers and private DMs
- A global CHAT_INPUT command named `clue5` launches the same Activity. It supports server installs and user installs: `integration_types: [0, 1]`, `contexts: [0, 1, 2]`.
- Under Discord Developer Portal > Clue5 > Installation, enable BOTH User Install and Guild Install with the `applications.commands` scope. Server bot installation is optional for launching the Activity but is needed for bot-authored results in server channels.
- Under General Information, set **Interactions Endpoint URL** to `https://discord.clue5.io/api/interactions`. Set this only after the `discord/api/interactions.js` route is deployed and reachable. The route verifies requests using `DISCORD_PUBLIC_KEY` and responds to `/clue5` with Discord's Launch Activity callback.
- Register the global slash command **once** with `node discord/scripts/register-clue5.mjs`, with `DISCORD_BOT_TOKEN` set in your LOCAL shell. Never paste the token into GitHub, chat, or browser tools. This script creates/updates the command using Discord's API.
- To test private DMs with another user, install Clue5 to **your own Discord account** using the User Install authorization flow; the other person does not have to create or manage a server.
- Confirm `/clue5` appears in both a 1-on-1 DM and a server channel, and that the Activity launches. It may take a short time for Discord to propagate the global command.
- **Important:** Directly posting completed-game results into third-party DMs is not guaranteed by guild bot permissions. DM result delivery is a separate feature requiring DM-compatible authorization and verification; don't assume it works until independently tested.

## Wordle-style automatic results in private DMs and servers
- A finished Daily/Practice game publishes a compact spoiler-free score message with five colored squares, points, incorrect guesses, and a clickable `https://clue5.io` link. No manual sharing or image download.
- Guild channels use an authenticated bot channel message. DMs and group DMs use a followup to the signed `/clue5` interaction; the Discord application does not attempt to have a bot impersonate a participant in someone else's private conversation.
- Discord interaction followup tokens expire after 15 minutes. The dedicated Clue5 Supabase table `public.clue5_discord_launches` keeps the latest token private and short-lived; after the callback expires the game still saves the result but cannot post it in that conversation. Relaunch `/clue5` to obtain a fresh callback for a new case.
- The callback is claimed once; no continuous polling or public exposure of the interaction token. Scores never include the puzzle answer.
- The dedicated Supabase table is protected by RLS, revoked `anon`/`authenticated` grants, and server-only `service_role` access. Periodic cleanup of expired callback rows is recommended.
- If posting fails, the Activity shows a warning instead of throwing away the result.
