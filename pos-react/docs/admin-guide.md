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
Switches grouped by area; each screen's own switch (marked **Screen**) sits at the top of the area it belongs to, followed by that screen's features (for example Sales History with Refunds and Voids; Order Queue, Tables, Guest Manager, KOT and KDS under *Restaurant & kitchen*). Each switch applies to the whole business; a **per-location** table lets you set
*Inherit / On / Off* for each location. Rules:
- Core features (checkout) cannot be switched off.
- A feature that requires another is off whenever the required one is off (e.g. CRM needs Customers).
- **Ceylo setup checker** (*Settings & platform*, on by default) shows the Ceylo button in the POS top bar and "Check my setup" under Settings > Plan & Support. Ceylo only reads the settings and links each problem to the screen that fixes it.
- **Ceylo AI answers** (*Settings & platform*, off by default, needs the Ceylo switch) adds "Ask Ceylo" to the panel: staff type a question and Claude (`claude-opus-5-5`, via the `ceylo-ask` Netlify function) answers from Ceylo's check results. Set `ANTHROPIC_API_KEY` in the Netlify environment (server only, never in the POS). Each question is a paid AI request; the function allows 20 questions a minute per device and refuses when the switch is off for that business. Only check titles, the business name and type, the role and the switched-off features are sent, never PINs, keys or customer data.
- **Own AI key**: when Ceylo AI answers is on, owners and managers see **Settings > Plan & Support > Ceylo AI key**. They choose Claude (Anthropic), ChatGPT (OpenAI) or Gemini (Google), paste their API key and model, and press *Save & test key*. The key is tested with one tiny request, stored encrypted (AES-256-GCM with `CEYLO_KEY_SECRET`, at least 32 characters, set in Netlify) in a server-only row, and never shown again (only its last 4 characters). Ceylo then answers with that account, billed by the business's AI provider; without a key it falls back to Ceylonry's `ANTHROPIC_API_KEY`.
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

## Subscription management and deleting an account

**Subscription management** (button in the admin header) lists the constraints of every plan: Starter (2 users, 1 location), Business (10 users, 3 locations), Pro and Enterprise (unlimited), and which features each plan switches off. Under **Founders** you define your own constraint sets: user and location limits, the features included, and any other constraint as a label and value.

Assign a plan to a business on its **Subscription** tab. The POS then follows it: a user or location beyond the limit is refused (existing ones stay, none can be added or re-activated until the business is under the limit), the plan's excluded features are switched off whatever the Features tab says, and Settings > Plan shows the limits. A business with no plan assigned has no limits, so existing accounts are not affected until you assign one. Assigning a standard plan also sets the invoice tier.

**Delete account** (account tab): removes the business's users, database documents (including the split pieces and monthly sales documents), image files, payment records (unless you tick "Keep payment records"), profile and sign-in. It works in three steps: 1) run the pre-delete checks, which change nothing and list what will be deleted with warnings (paid subscription, account still active, recent sync, unpaid invoices, payment records, linked team sign-ins); 2) confirm you reviewed them; 3) type the business name and delete. The server checks both confirmations and the name again, then counts what is left and reports it. If anything remains, run the delete again. The only way back afterwards is a database backup, and only until it expires.
