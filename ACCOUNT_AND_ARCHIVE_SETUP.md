# Clue5 optional accounts and Archive

The website remains completely playable without registration. Guest data is kept in browser storage under `clue-five-v1`.

## Optional account
- The top-left account and settings controls are implemented in `index.html` and `assets/account.js`.
- Supabase project `rkzznvepvlzmkygcijda` holds the `clue5_profiles` table, protected by owner-only RLS. The client uses a **publishable** key, never the service-role key.
- On sign-in, local and remote daily entries are merged by completion/progress. Practice totals use a conservative maximum rather than summing them, preventing duplicated play counts. Players can disable sync or export a local backup.
- In **Supabase Authentication → URL Configuration**, set the Site URL to `https://clue5.io` and add `https://clue5.io/**` to allowed Redirect URLs. Confirm email/password auth is enabled and your email delivery setup works. These settings must be checked by the owner before sign-up/verification and password recovery can be considered production-tested.
- Authentication emails use `https://clue5.io/` as the requested redirect. Password recovery is handled by the Clue5 website with the Supabase recovery token.
- Test account creation, verification, sign-in, sync from a second browser, password reset, sign-out, guest mode, and privacy disclosures.

## Archive catch-up
- Stats navigation is renamed **Archive**. The calendar supports replaying past daily mysteries beginning **2026-11-15**. Future cases cannot be opened.
- The daily API issues encrypted tokens tied to a specific valid day, and keeps the correct answer server-side until the case is completed.
- The response supplies `playedOn` and `late` for completed sessions. Past cases solved after their original date are clearly labeled `Catch-up`, and do **not** increase the on-time streak. Existing older completed records without a new metadata field are treated as on-time historical records.
- The Archive keeps a calendar and detailed case history; users can open missed dates from their calendar.
- QA: solve a missing earlier day, reload, restore session, verify catch-up designation and on-time streak, attempt to open tomorrow (must fail), play without account, sync to another device and ensure no past record loss.

## Deployment
The GitHub main branch includes these changes. Confirm a READY **main website** deployment from the latest commit before claiming `clue5.io` is updated.
