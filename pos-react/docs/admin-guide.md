# Administrator guide

The administration portal is a separate page from the POS and has its own sign-in:

| Environment | URL |
| --- | --- |
| Production | `https://ceylonrylabs.io/posv2/admin.html` |
| Local dev | `http://localhost:5173/admin.html` |

## Signing in

**Production (Appwrite)**
- Sign in with an Appwrite user whose e-mail is on the allow-list. By default only
  `devteam@ceylonrylabs.io` is allowed — it is hard-coded in `netlify/functions/pos-admin-data.js`
  (`ADMIN_EMAIL`) and, for the page itself, `VITE_ADMIN_EMAILS` (defaults to the same address).
- Create the user in the Appwrite console of the production project: **Auth → Users → Create user** with
  that e-mail and a password (8+ characters). Use **Password → Update password** to reset an existing one.
- "This account is not an administrator." means the e-mail is not on the allow-list (or `VITE_ADMIN_EMAILS` on
  Netlify holds a different value). "Invalid credentials" means a wrong password or a different Appwrite
  project than production.

**Local dev (`VITE_AUTH_PROVIDER=local`)**
- The sign-in page shows the dev credentials: `admin@ceylonry.local` / `Admin#12345`
  (override with `VITE_DEV_ADMIN_EMAIL` / `VITE_DEV_ADMIN_PASSWORD`).
- Local mode manages the single POS database of that browser, so changes apply after reloading the POS.

## Account list
Search by business, owner or e-mail. Open an account to manage it.

## Enable / disable an account (non-payment)
Use **Disable account** / **Enable account**. Devices already signed in re-check every minute and switch to the
payment screen; enabling restores access. Payment status (trial / active / paused) is shown on the card.

## Features and locations
69 switches grouped by area. Each switch applies to the whole business; a **per-location** table lets you set
*Inherit / On / Off* for each location. Rules:
- Core features (checkout) cannot be switched off.
- A feature that requires another is off whenever the required one is off (e.g. CRM needs Customers).
- Stored in `settings.features` and `settings.locationFeatures`; synced to every device.

## Tiers
| Tier | Price (LKR) |
| --- | --- |
| Starter | 5,500 / month |
| Business | 7,500 / month |
| Pro | 15,500 / month |
| Enterprise | 150,000 one-time |

Choosing a tier applies a preset of features (see `PLAN_FEATURE_OFF` in `src/config/plans.js`). Switching on
features the tier does not include makes them *additional features*: **2 are free, then LKR 5,500 each**.

## Welcome message
Enable/disable, edit the title and text, and choose whether to show the plans. Each POS user sees it once;
**Show again to every user** increases the version number.

## Invoices
1. Select the tier and period. The invoice lines are built automatically (tier + chargeable extra features).
2. **Fixed-amount exception**: enter an agreed amount (and a note) to replace the computed total.
3. Save; the invoice is stored under the account (`users/{uid}/posInvoices`) with a status (unpaid / paid).
4. **E-mail** sends it through the existing `send-invoice` Netlify function.

## Related Netlify configuration
| Setting | Purpose |
| --- | --- |
| `VITE_ADMIN_EMAILS` (build) | Who the page lets through to the sign-in |
| `VITE_ADMIN_FUNCTION_URL` | Defaults to `/.netlify/functions/pos-admin-data` |
| `VITE_SEND_INVOICE_URL` | Defaults to `/.netlify/functions/send-invoice` |
| `APPWRITE_*` (functions) | Server credentials for the document store |

Server actions in `pos-admin-data`: `list`, `get`, `setAccess`, `saveSettings`, `listInvoices`, `saveInvoice`
(plus the legacy payment/catalogue actions).

## Known gaps
The Appwrite-mode admin flows (disable, invoice e-mail, welcome sync) have not been verified end-to-end against
the production backend; test with a non-customer account first.
