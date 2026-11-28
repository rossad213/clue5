# Clue5 branded authentication emails

These HTML templates are **ready for use with Supabase Auth**. Clue5 already calls Supabase Auth for account confirmation and password resets. Resend is the SMTP delivery provider, not the template editor in this setup.

## Brand
- From name: **Clue5**
- From email: **detective@clue5.io**, assuming this remains your configured and verified sending address in Resend
- Shared style: dark detective case-file header, cream paper body, brick-red button, concise security copy, footer link to clue5.io
- Layout: 570px max-width, tables and inline CSS for email clients, readable phone widths
- No images or external CSS; nothing can fail due to blocked remote image loading

## Installation

1. Open the Clue5 Supabase project: https://supabase.com/dashboard/project/rkzznvepvlzmkygcijda/auth/templates
2. Under **Confirm signup**, set the email subject to: `Clue5 | Confirm your email`
3. Replace that template's HTML with the entire contents of [confirm-signup.html](./confirm-signup.html), then save.
4. Under **Reset password**, set the email subject to: `Clue5 | Reset your password`
5. Replace that template's HTML with the entire contents of [reset-password.html](./reset-password.html), then save.
6. Verify **Authentication → SMTP Settings** has custom SMTP enabled with the existing Resend credentials, the verified sender email, and sender display name `Clue5`. Do not rotate or paste your SMTP/API credentials into source code or chat.
7. Test a **new account confirmation** and a **password reset** using accounts you control. Verify the email displays on desktop/mobile, that the button works once, and that the user returns to https://clue5.io/ properly.
8. If you have email confirmation disabled, the confirmation template won't be sent; do not switch that authentication setting without considering existing user flows.

## Template variables and security

Both templates use Supabase's native `{{ .ConfirmationURL }}` variable for their secure, signed action links. **Do not** substitute a static link, hardcode a token, or send action links in routine test messages.

Resend does not need these HTML files imported separately when used as Supabase's custom SMTP provider: Supabase uses its configured Auth email templates when invoking SMTP.

Updates to these repository files alone do **not** change the email that users receive. Supabase's hosted Auth templates must be updated in the Supabase dashboard or via its authenticated Management API. No SMTP configuration or authentication settings have been modified in this GitHub change.

Official guide: https://supabase.com/docs/guides/auth/auth-email-templates
