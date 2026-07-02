# CLS CashFlow

CeylonryLabs.io CashFlow system for Solo, Studio, and Business plans.

## Files

- `index.html` - landing page
- `signin.html` - Supabase sign in
- `onboarding.html` - account setup flow
- `solo.html` - Solo dashboard
- `starter.html` - Studio dashboard
- `growth.html` - Business dashboard
- `premium.html` - legacy premium prototype page, no longer linked in the active plan flow
- `access-admin.html` - team access and invite management
- `accept-invite.html` - invite acceptance page
- `netlify/functions/send-invoice.js` - built-in SMTP invoice email fallback
- `netlify/functions/send-invite.js` - team invite email function
- `netlify/functions/send-welcome.js` - welcome email function
- `netlify/functions/payable-create-checkout.js` - server-side Payable checkout creator
- `netlify/functions/payable-webhook.js` - server-side Payable payment confirmation handler
- `netlify.toml` - Netlify publish/functions configuration
- `package.json` - Netlify function dependency list
- `emailjs-custom-invoice-template.html` - optional no-logo EmailJS invoice body template
- `supabase/schema.sql` - Supabase document table used by Auth, dashboards, admin, support, visits, and payments

## GitHub Upload

Upload all files in this folder to the root of your GitHub repository.

## Netlify Deploy

Netlify should use:

- Publish directory: `.`
- Functions directory: `netlify/functions`

These are already configured in `netlify.toml`.

## Supabase

This version stores application data in Supabase through `netlify/functions/supabase-docs.js` and `netlify/lib/supabase.js`.

Run `supabase/schema.sql` in the Supabase SQL editor for project `iudcinvfqbdzaptnnzqg`, then add these variables in Netlify environment variables only:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Do not add these values to GitHub, HTML, or a committed `.env` file. The service role key is server-only and must stay in Netlify.

## Optional SMTP Environment Variables

Only add these in Netlify environment variables, not in GitHub. These are required if you want welcome emails, invite emails, and the built-in SMTP invoice fallback to send from Netlify functions:

- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_FROM`

For Hostinger, the common values are:

- `SMTP_HOST`: `smtp.hostinger.com`
- `SMTP_PORT`: `465`
- `SMTP_USER`: your full mailbox, for example `noreply@ceylonrylabs.io`
- `SMTP_PASS`: the mailbox password
- `SMTP_FROM`: optional, usually same as `SMTP_USER`

## Payable Subscription Payments

Payable credentials must be added only in Netlify environment variables. Do not place keys or tokens in GitHub, HTML, or browser JavaScript.

Required for Payable checkout:

- `PAYABLE_MERCHANT_ID` - from Payable Settings -> API Integration
- `PAYABLE_MERCHANT_TOKEN` - from Payable Settings -> API Integration
- `PAYABLE_BUSINESS_KEY` - from Payable Settings -> Business Integration
- `PAYABLE_BUSINESS_TOKEN` - from Payable Settings -> Business Integration
- `PAYABLE_CHECKOUT_URL` - the checkout/session API endpoint Payable gives you
- `PAYABLE_WEBHOOK_SECRET` - any strong private value you choose for verifying callback requests
- `SITE_URL` - your production site URL, for example `https://your-site.netlify.app`

Give Payable this callback URL after you choose `PAYABLE_WEBHOOK_SECRET`:

`https://www.ceylonrylabs.io/.netlify/functions/payable-webhook?secret=YOUR_PAYABLE_WEBHOOK_SECRET`

The 15-day trial is controlled by each user's `trialEnd` value in Supabase. After it ends, the dashboards require payment unless the user profile has `paid: true`. The Payable webhook sets `paid: true`, `subscriptionStatus: active`, and the selected plan after a verified paid callback.

If Payable checkout is not ready yet, the expired-trial paywall creates a manual payment request token in the `paymentRequests` document path. The admin panel shows those tokens so the team can manually send an invoice, mark the request as invoiced, mark it paid, or close it.

The Payable API field names may need one final adjustment once Payable sends the exact checkout documentation. The integration is centralized in `netlify/functions/payable-create-checkout.js`, so that mapping can be changed without touching the dashboards.

## Team Invites

`access-admin.html` now creates invites under `users/{ownerUid}/team/{inviteId}` and calls `/.netlify/functions/send-invite` to email the person automatically. The invite link opens `accept-invite.html`, where the invited person creates a password or continues with Google.

If invite creation shows `Not allowed`, confirm the user is signed in, the invite is being written under `users/{ownerUid}/team`, and the Supabase `app_documents` table from `supabase/schema.sql` has been created.

## EmailJS

In the dashboard Settings, use your EmailJS Public Key, Service ID, and Template ID. In EmailJS, set:

- Subject: `{{subject}}`
- To Email: `{{to_email}}`
- From Name: `{{from_name}}`
- Reply To: `{{reply_to}}`

For the simplest EmailJS body, use:

```html
{{{message_html}}}
```

If you want the no-logo stationery style, paste the contents of `emailjs-custom-invoice-template.html` into the EmailJS body instead. The Solo and Studio invoice dashboards send the custom fields used by that template, including `business_name`, `client_name`, `invoice_no`, `items_html`, `subtotal`, and `grand_total`.
