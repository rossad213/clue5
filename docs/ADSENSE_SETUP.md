# Google AdSense for Clue5

Clue5 uses **one explicit, clearly labeled ad unit on the Home page only**.
Do not enable Google Auto ads for this single-page game: Auto ads may place
ads in or near the interactive clues or guess controls.

## Set up in AdSense

1. Visit https://adsense.google.com/ and sign in or create an AdSense account.
2. Add **clue5.io** under Sites, then follow Google's site ownership and review flow.
3. Find your publisher ID at Account > Settings > Account information.
   It looks like `pub-1234567890123456` (example only).
4. In Ads > By ad unit > Display ads, create a responsive display ad and copy
   its numeric **ad unit/slot ID** (not the sample value above).
5. Edit `assets/adsense-config.js`:
   - `publisherId`: your exact publisher ID in `ca-pub-XXXXXXXXXXXXXXXX` format.
   - `homeAdSlot`: numeric ad slot ID.
   Leave values empty until ready; no Google code loads in that state.
6. Keep **Auto ads OFF** in the AdSense site settings to prevent ad placement
   around interactive game buttons. The custom unit appears after the Home
   page's introductory content, never inside the active case or archive.
7. Publish an `ads.txt` file at the site root after receiving the publisher
   ID. Follow the exact value provided by the AdSense account. A typical line:
   `google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0`
   Replace every X with the **real** 16-digit publisher ID, not a sample ID.
   Confirm that https://clue5.io/ads.txt serves plain text.
8. Configure Google's supported consent solution (or another Google-certified
   CMP) for visitors in the EEA, UK and Switzerland as applicable, and verify
   the privacy page describes the actual advertising configuration.
9. Wait for the site's AdSense review and **Ready** status. The fact that the
   JavaScript has loaded does not mean the site has been approved or that an
   advertisement will be served.
10. Check mobile and desktop layouts, the homepage, the active case, the
    archive, and the installed PWA for accidental taps or ads near controls.

## Implementation notes

- The script in `assets/adsense.js` loads Google's official AdSense
  client only after a syntactically valid publisher ID is configured.
- A blank ad slot ID will load the verification script but no visible ad.
- The actual ad slot is appended only when both IDs are configured.
- No simulated advertisement or default revenue claim is included.
- AdSense policies prohibit ads that lead to accidental clicks or encourage
  clicking. Keep adequate separation from game controls.
- Site eligibility, AdSense review, legal compliance, and consent settings
  must be completed in the AdSense account and hosting environment.

Official references:
- https://support.google.com/adsense/answer/7584263
- https://support.google.com/adsense/answer/9274019
- https://support.google.com/adsense/answer/1346295
- https://support.google.com/adsense/answer/2768340
- https://support.google.com/adsense/answer/12171244
