# CLS CashFlow

CeylonryLabs.io CashFlow system for Starter, Growth, and Premium plans.

## Files

- `index.html` - landing page
- `signin.html` - Firebase sign in
- `onboarding.html` - account setup flow
- `starter.html` - Starter dashboard
- `growth.html` - Growth dashboard
- `premium.html` - Premium dashboard
- `access-admin.html` - team access and invite management
- `accept-invite.html` - invite acceptance page
- `netlify/functions/send-invoice.js` - built-in SMTP invoice email fallback
- `netlify/functions/send-invite.js` - team invite email function
- `netlify/functions/send-welcome.js` - welcome email function
- `netlify.toml` - Netlify publish/functions configuration
- `package.json` - Netlify function dependency list
- `emailjs-custom-invoice-template.html` - optional no-logo EmailJS invoice body template
- `firestore.rules` - suggested Firebase Firestore rules for team invites and owner/team access

## GitHub Upload

Upload all files in this folder to the root of your GitHub repository.

## Netlify Deploy

Netlify should use:

- Publish directory: `.`
- Functions directory: `netlify/functions`

These are already configured in `netlify.toml`.

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

## Team Invites

`access-admin.html` now creates the invite link and calls `/.netlify/functions/send-invite` to email the person automatically.

If invite creation still shows a permission error after uploading, publish the included `firestore.rules` in Firebase:

Firebase Console -> Firestore Database -> Rules -> paste the contents of `firestore.rules` -> Publish.

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

If you want the no-logo stationery style, paste the contents of `emailjs-custom-invoice-template.html` into the EmailJS body instead. The Starter dashboard now sends the custom fields used by that template, including `business_name`, `client_name`, `invoice_no`, `items_html`, `subtotal`, and `grand_total`.
