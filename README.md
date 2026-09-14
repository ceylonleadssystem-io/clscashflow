# CLS CashFlow

CeylonryLabs.io CashFlow system for Solo, Studio, and Business plans.

## Files

- `index.html` - landing page
- `signin.html` - Appwrite sign in
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
- `netlify.toml` - Netlify publish/functions configuration
- `package.json` - Netlify function dependency list
- `emailjs-custom-invoice-template.html` - optional no-logo EmailJS invoice body template
- `assets/appwrite-firebase-compat.js` - compatibility layer that preserves the existing application data API
- `netlify/lib/appwrite.js` - server-side Appwrite adapter

## GitHub Upload

Upload all files in this folder to the root of your GitHub repository.

## Netlify Deploy

Netlify should use:

- Publish directory: `.`
- Functions directory: `netlify/functions`

These are already configured in `netlify.toml`.

## Appwrite

This version stores application data in Appwrite through `netlify/functions/appwrite-docs.js` and `netlify/lib/appwrite.js`.

The Appwrite project is `6a947d6e0012c551dfde` in the Singapore region. It uses database `ceylonry`, collection `app_documents`, and bucket `payment-receipts`. Add these variables in Netlify environment variables only:

- `APPWRITE_ENDPOINT=https://sgp.cloud.appwrite.io/v1`
- `APPWRITE_PROJECT_ID=6a947d6e0012c551dfde`
- `APPWRITE_DATABASE_ID=ceylonry`
- `APPWRITE_COLLECTION_ID=app_documents`
- `APPWRITE_API_KEY` (server-only secret)

Do not add the API key to GitHub, HTML, or a committed `.env` file. It is server-only and must stay in Netlify.

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

## Subscription Payments

The 15-day trial is controlled by each user's `trialEnd` value in Appwrite. After it ends, the dashboards require payment unless the user profile has an active paid status.

Customers prepay each month by bank transfer and upload a PDF or image payment slip. The receipt is emailed to the accounts team and recorded in the subscription ledger. Payment may be submitted during the trial; in that case, the paid month begins when the 15-day trial ends. Otherwise the payment popup blocks access at the end of the trial and on each monthly due date until a new slip is uploaded. Expired trials also create a manual payment request in the `paymentRequests` document path so an administrator can send an invoice, mark the request as invoiced, mark it paid, or close it.

## Team Invites

`access-admin.html` now creates invites under `users/{ownerUid}/team/{inviteId}` and calls `/.netlify/functions/send-invite` to email the person automatically. The invite link opens `accept-invite.html`, where the invited person creates a password or continues with Google.

If invite creation shows `Not allowed`, confirm the user is signed in and the invite is being written under `users/{ownerUid}/team` in the Appwrite `app_documents` collection.

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
