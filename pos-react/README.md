# Ceylonry POS — React + WatermelonDB

📚 Full documentation: [docs/](docs/README.md) — user guide, administrator guide, architecture, development, deployment, test plan.


* Every screen, modal and action of the **final** (last-layer-wins) behaviour of the original was ported
  — see the [parity checklist](#parity-checklist).
* The original stylesheets are reused (`src/styles/*.css`, merged into six files in cascade order), and the
  components render the same markup/classes, so the UI looks and behaves like the current POS.
* Local, relational, persistent data lives in **WatermelonDB** (LokiJS/IndexedDB on the web).
* Authentication, cloud sync, e-mail, billing and hardware sit behind **service abstractions**
  (nothing in a component talks to Appwrite, USB or `window.cls*` directly).
* A new **Admin Dashboard** switches each POS feature on/off (`/#/admin`).

> This project does not modify the legacy app. It lives in `pos-react/` next to it and reads/writes
> the **same cloud document** (`users/{workspaceUid}/pos/main`), so both can run against one account.

---

## 1. Quick start

```bash
cd pos-react
npm install
cp .env.example .env.local      # adjust (see §3)
npm run dev                     # http://localhost:5173
npm run build                   # production build -> dist/
npm test                        # vitest (domain, WatermelonDB, cloud sync)
```

Two ways to run:

| Mode | `.env.local` | What you get |
| --- | --- | --- |
| **Local / offline** (no backend needed) | `VITE_AUTH_PROVIDER=local` | First visit asks you to create the business login (stored hashed on the device). Data stays in IndexedDB. Default owner PIN is `1234`. |
| **Appwrite** (production) | `VITE_AUTH_PROVIDER=appwrite` | Business sign-in against Appwrite, cloud sync, billing/paywall, e-mail receipts. Needs the Netlify functions, see §4. Run `netlify dev` in the main repo and set `VITE_FUNCTIONS_PROXY=http://localhost:8888`. |

Node ≥ 18. The repo root `package.json` (Netlify functions) is untouched.

---

## 2. Project structure

```
pos-react/
├─ index.html · vite.config.js · package.json · .env.example
├─ public/                     manifest, service worker, icons, catalogue template, platform.js
└─ src/
   ├─ main.jsx · App.jsx       provider tree + gates
   ├─ config/                  env, constants, roles, POS presets, FEATURE REGISTRY
   ├─ db/                      WatermelonDB: schema, models, repositories, PosStore
   │   ├─ tables/*             one declarative spec per table  (→ schema + model + mapper)
   │   ├─ defineTable.js       spec → Model class with typed accessors
   │   ├─ schema.js · migrations.js · database.js · models/
   │   ├─ rowMapper.js         raw row ⇄ plain legacy object (+ lossless `extra` column)
   │   ├─ PosStore.js          observe(), atomic write(tx), replaceAll(), readSnapshot()
   │   └─ repositories/        BaseRepository + domain repositories
   ├─ domain/                  PURE business logic (cart, refunds, cash, analytics, inventory, catalogue…)
   ├─ services/
   │   ├─ pos/                 action services (sales, catalog, customers, inventory, staff, settings, printing, locations, industry)
   │   ├─ sync/                payload mapper, merge rules, workspace bootstrap
   │   ├─ appwrite/            ES-module port of assets/appwrite-compat.js
   │   ├─ auth.service.js      Appwrite / local providers behind one interface
   │   ├─ cloud.service.js     pull/push/merge sync engine
   │   ├─ platform.service.js  bridge to platform.js (EmailJS receipts, paywall, bank transfer)
   │   ├─ billing.js · support.js · xlsx.js
   │   └─ printing/            receipt & KOT documents, ESC/POS, USB label printer, barcode, scanner
   ├─ store/                   React providers: Ui, Session, Data, Feature, Modals, Pos, Checkout
   ├─ hooks/ · components/ · views/ · modals/ · gates/ · admin/
   ├─ styles/                  six CSS files: base, shell, checkout-catalogue, features, dialogs-settings, app
   └─ tests/                   vitest
```

Layering rule: `views/components → store (hooks) → services/pos → db (PosStore/repositories)`;
`domain/` is pure and used by services and views; only `services/*` touch the network, USB or `window`.

---

## 3. Environment variables

All are optional (defaults match the legacy app). Only `VITE_*` values reach the browser — **never put
secrets here** (the Appwrite API key and SMTP passwords stay in Netlify).

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_AUTH_PROVIDER` | `appwrite` | `appwrite` or `local` (see §1) |
| `VITE_APPWRITE_ENDPOINT` / `VITE_APPWRITE_PROJECT_ID` | Singapore cloud / project `6a947d6e0012c551dfde` | Public Appwrite identifiers used for sign-in |
| `VITE_DOCS_FUNCTION_URL` | `/.netlify/functions/appwrite-docs` | Serverless document API (holds the server-only `APPWRITE_API_KEY`) |
| `VITE_FUNCTIONS_PROXY` | `http://localhost:8888` | Where `vite dev` proxies `/.netlify/functions/*` |
| `VITE_ONBOARDING_EMAIL_URL` | `/.netlify/functions/pos-onboarding-email` | Welcome e-mails after first sign-in |
| `VITE_PLATFORM_SCRIPT_URL` | `/assets/platform.js` | Shared platform script (see §4) |
| `VITE_DEVELOPER_EMAIL` | `devteam@ceylonrylabs.io` | This account is redirected to the developer portal after sign-in |
| `VITE_SUPPORT_PORTAL_URL` | `/pos-system/pos-admin.html` | "Open Admin Portal" / "Exit Support Session" target |
| `VITE_HOME_URL` / `VITE_ONBOARDING_URL` | `/index.html` / `/pos-onboarding.html` | Links on the sign-in gate |
| `VITE_EJS_KEY` / `VITE_EJS_SERVICE` / `VITE_EJS_RECEIPT_TEMPLATE` | legacy EmailJS ids | Defaults for receipt e-mails (per-business override in settings) |
| `VITE_CATALOGUE_IMAGES_URL` | *(empty)* | Optional bundle defining `window.CLS_AZURE_SWIM_IMAGES` |
| `VITE_SYNC_PULL_MS` / `VITE_SYNC_PUSH_MS` | `1500` / `2500` | Cloud sync cadence |
| `VITE_BASE_PATH` | `/posv2/` | Use `/pos-system/` (or any sub-path) when hosting beside the legacy pages |

---

## 4. External files and integration points (not reproduced here)

| Integration | Where it lives | What the React app does |
| --- | --- | --- |
| **Netlify function `appwrite-docs`** | `netlify/functions/appwrite-docs.js` (main repo) | Required in `appwrite` mode. All cloud documents go through it. Env on Netlify: `APPWRITE_ENDPOINT`, `APPWRITE_PROJECT_ID`, `APPWRITE_DATABASE_ID`, `APPWRITE_COLLECTION_ID`, `APPWRITE_API_KEY`. |
| **Netlify function `pos-onboarding-email`** | main repo | Called once per account after sign-in (`services/platform.service.js`). Best-effort. |
| **`platform.js`** | copied to `public/assets/platform.js` from the main repo | Loaded lazily after sign-in. Provides `clsSendPaymentReceiptEmail` (EmailJS), the subscription paywall and the bank-transfer dialog. If it fails to load the POS keeps working; e-mail receipts and the paywall are then unavailable. Re-copy it when the main repo updates it. It needs `window.clsBackend`, which `services/appwrite/appwriteCompat.js` installs. |
| **EmailJS** | CDN, loaded by `platform.js` | Needs the business' EmailJS key/service/template (Settings) or the `VITE_EJS_*` defaults. |
| **SheetJS (xlsx)** | `https://cdn.jsdelivr.net/npm/xlsx@0.18.5/...` | Lazy-loaded for catalogue import and stock-count upload (`services/xlsx.js`). |
| **Catalogue template** | `public/assets/Ceylonry-POS-Catalogue-Template.xlsx` | Copied from `pos-system/assets/`. |
| **Azure Swim catalogue photos** | `assets/azure-swim-products.js` (15 MB, **not copied**) | Optional: host it and set `VITE_CATALOGUE_IMAGES_URL`; empty product images are filled for businesses named "Azure Swim". |
| **Developer/support portal** | `pos-system/pos-admin.html` | Separate legacy page, linked from Settings. Read-only support sessions (`?support=1`) are honoured by the React app (audit + write-lock). |
| **Hardware** | Chrome/Android: WebUSB (ESC/POS receipt printer, TSPL label printer), WebHID/keyboard-wedge barcode scanner | `services/printing/*`. Requires HTTPS and a user gesture the first time. |
| **Landing/onboarding pages** | `index.html`, `pos-onboarding.html`, `reset-password.html` of the main site | Linked from the gates; password-reset e-mails point to `/reset-password.html`. |

Deploying next to the legacy site: build with `VITE_BASE_PATH=/pos-system/` (or another sub-path), publish
`dist/` there and forward unknown paths to `index.html`. `public/sw.js` is the React shell's own service
worker (the legacy root `sw.js` is untouched).

---

## 5. Data layer (WatermelonDB)

* **Adapter**: LokiJS with incremental IndexedDB persistence (`useWebWorker: false`); automatic in-memory
  fallback when IndexedDB is unavailable. One database **per business workspace**
  (`ceylonry-pos-<workspaceUid>`), replacing the per-account `localStorage` keys of the legacy POS.
* **Schema** (`src/db/tables/*`, version 1, 27 tables). Every table is described once with `defineTable()`;
  the schema, the Model class and the legacy mapper are generated from that spec. Columns are optional,
  JSON values are stored as strings, every table has an `extra` column for unknown legacy fields (lossless
  cloud round-trips) and a `seq` column that preserves legacy array order.

| Area | Tables |
| --- | --- |
| Catalogue | `products`, `categories`, `subcategories`, `modifier_groups` |
| Customers | `customers`, `customer_communications` |
| Orders | `sales` (header) + `sale_lines` (order lines), `open_orders`, `void_orders`, `kitchen_tickets` |
| Staff & cash | `users`, `time_entries`, `cash_shifts` |
| Inventory | `inventory_items`, `stock_movements`, `stock_transfers` |
| Business | `locations`, `location_audit`, `support_audit`, `settings` (key/value, per-key `updatedAt`), `app_meta` (order sequence, tombstones, sync info) |
| Industry tools | `appointments`, `memberships`, `prescriptions`, `medicine_batches`, `commission_payments` |

* **Models**: `src/db/models` (classes generated by `defineTable`; `createdAt/updatedAt` are exposed as
  `createdIso/updatedIso` because those names are reserved by WatermelonDB).
* **`PosStore`**: `observe(cb)` pushes a live plain snapshot (same shape as the legacy `db` object) to React;
  `write(tx => …)` is an atomic multi-table unit of work (one `database.write` + `batch`) that also maintains
  `updatedAt` for cloud merging; `replaceAll()` applies a merged cloud payload, writing only changed rows.
* **Repositories** (`src/db/repositories`): `BaseRepository` (`all`, `byId`, `where`, `save`, `remove`,
  `observe`, `count`) and domain repositories (`ProductRepository.findByCode`, `CustomerRepository.findByPhone`,
  `SaleRepository.inRange/lines`, `CashShiftRepository.openFor`, `SettingsRepository.get/set`, …), available
  through `useRepositories()` / `ctx.repos`.
* **Migrations**: `src/db/migrations.js` (add a step + bump `SCHEMA_VERSION` when a column is added).
* **Legacy data**: on first start a legacy `localStorage` blob (`ceylonry-pos-v1[-<uid>]`) is imported; the
  cloud document is merged with the same rules as the original (per-row last-writer-wins, tombstones,
  per-setting timestamps, pending-sync flag, offline tolerance).

---

## 6. Services (abstractions)

| Service | Interface | Implementations |
| --- | --- | --- |
| `auth.service` | `onChange, signIn, signOut, resetPassword, hasAccount, register` | `AppwriteAuthProvider`, `LocalAuthProvider` |
| `cloud.service` | `resolveWorkspace, attach, start/stop, pull, syncNow, retry` | Appwrite-document payload (`users/{uid}/pos/main`) |
| `platform.service` | `sendReceiptEmail, renderPaywall, openBankTransfer, loadPlatformScript` | wraps `window.cls*` |
| `printing/*` | `receiptPrinter`, `labelPrinter`, `barcodeScanner`, `documents`, `printDocument` | WebUSB, WebHID, iframe print |
| `pos/*` | bound as `useServices()` → `svc.sales.completeSale(...)`, `svc.catalog.saveProduct(...)`, … | one module per domain |

Action services receive a `ctx` (`store`, `repos`, `data()`, `session()`, `features()`, `ui`) and use the
promise-based `ui.alert/confirm/prompt/notice` (dialogs replace `window.alert/confirm/prompt`).

---

## 7. Administration portal (separate login)

Open **`admin.html`** (built as a second Vite entry; e.g. `/posv2/admin.html`). It has its own
administrator sign-in (Appwrite account listed in `VITE_ADMIN_EMAILS`; the Netlify function
`pos-admin-data` enforces the real allow-list, currently the single address hard-coded as `ADMIN_EMAIL` in the function) and is **not** reachable from the POS sidebar.

Per POS account the administrator can:

* **Enable / disable the account for non-payment** (`setAccess`). Running POS sessions re-check the profile
  every minute and show the payment screen immediately.
* **Tier** (Starter 5,500 · Business 7,500 · Pro 15,500 · Enterprise 150,000 one-time) with a
  **fixed-amount exception** for clients on an agreed price; tier presets switch the matching features.
* **Features**: 69 switches for the whole business, plus **per-location overrides** (Inherit / On / Off).
  Stored in `settings.features` / `settings.locationFeatures`, synced to all devices.
* **First-login welcome message** (title, text, optional pricing tiers); "show again to every user" bumps
  the version. Each POS user sees it once (`users.welcomeSeenVersion`). Staff can reopen the tier sheet from
  Settings → Plan & Support.
* **Invoices**: built from the tier price + additional features beyond the 2 free (LKR 5,500 each), or the
  fixed exception; saved per account (`users/{uid}/posInvoices`), status tracking, and **e-mailed** through the
  existing `send-invoice` function.

New server actions in `netlify/functions/pos-admin-data.js`: `saveSettings`, `listInvoices`, `saveInvoice`.

Use in code: `useFeature("checkout.splitBill")`; services read `ctx.features()["…"]`. Add a feature by
appending to `src/config/features.js`. *Business Tools* is off by default (removed by the last legacy layer).

### Order e-mail
After checkout the customer receives the **order itself** (items, modifiers, totals, payment) built by
`services/printing/orderEmail.js` and sent through EmailJS with body `{{{message_html}}}`
(`public/email-templates/pos-order-email.html`). Set `VITE_EJS_ORDER_TEMPLATE` (or settings `ejsOrderTemplate`);
empty reuses the legacy receipt template id.

### Inventory behaviour
* Deleting a product's stock row turns stock tracking **off** for it: always sellable (re-enable via *Add Stock*).
* Adjustments: *Stock received* adds; *Wastage / Damaged / Internal use / Return to supplier* subtract;
  *Stock count correction* replaces stock with the counted quantity.
* *Add Stock* is a search box (existing items, or “Add stock item ‘name’”). *Phone stock count* shows a QR for
  `/#/count`, a touch-friendly count page.

---

## 8. Parity checklist

**Screens** — Dashboard · Checkout · Order Queue · Products & Services · Modifiers · Customers ·
CRM & Feedback · Sales History · Reports · Inventory & Stock · Staff & Shifts · Settings (Business Profile /
POS Setup / Operations / Plan & Support tabs) · Business Tools · Admin Dashboard *(new)*.

**Gates & shell** — business sign-in (Appwrite or local) incl. forgot-password and developer redirect ·
staff PIN gate with location · checkout mode chooser (mobile/POS) · full-screen & kiosk modes, menu
toggle, mobile cart toggle · location switcher (incl. All Locations) · cloud status/billing banner ·
read-only support session banner · POS themes (Orange / Graphite / Gold) · subscription paywall.

**Modals** — POS setup wizard · product (image drag/arrow positioning, modifier rules, recipes, barcode) ·
modifier group · modifier picker · customer profile (+ next-visit discount) · customer WhatsApp ·
POS user (PIN, role, branch access, sign-in behaviour) · cash register (clock-in+open / open / close) ·
start-shift prompt · refund/void (full & partial) · split bill · inventory item · stock adjustment ·
branch stock / bulk branch count · location editor / switcher · catalogue import · barcode labels ·
appointment / membership / prescription / medicine batch.

**Actions** — add/edit/delete products, categories, subcategories, modifiers · Excel/CSV import ·
thumbnail/list views · cart with modifiers, quantities, void · order discount · service charge · cash
tender & change · split bill (per-share payments) · customer lookup/create · e-mail, WhatsApp and print
receipts · open orders, kitchen tickets (KOT), order channels · refunds/voids with stock & cash-drawer
reversal · permanent sale deletion (owner/admin) · clock in/out, breaks, register open/close with
reconciliation · user create/edit/delete · stock items, adjustments, recipes, sellable-product stock
guard, count-sheet upload, low-stock WhatsApp · multi-location stock · reports & CSV exports ·
USB receipt printer, USB label printer, barcode scanner · business logo & social QR on receipts ·
support code (24 h) · POS pricing calculator · billing/bank-transfer dialog.

### Deliberate differences from the original

These were bugs/inconsistencies in the stacked layers; the React port fixes them:

1. Business date uses the **local** calendar date (legacy stamped UTC, reports filtered local → a sale after
   local midnight vanished from “today”).
2. Refund/void **restore stock once** (legacy layers restored recipe ingredients twice) and partial refunds
   also restore sellable-product stock proportionally.
3. `printerType = system` really prints through the browser (legacy final layer only supported USB-direct).
4. The location switcher / header printer button are actually inserted (legacy inserted them before a node
   that was no longer a child of `.top`, so the script aborted).
5. Saved open orders of non-kitchen presets stay reachable (Order Queue appears once one exists).
6. The Order “Give 10 % reward” card button (removed by the last legacy layer) is replaced by an **Apply**
   button in the checkout customer panel for next-visit discounts/birthday reward.
7. `alert/confirm/prompt` are in-app dialogs.

---

## 9. Testing

`npm test` runs vitest (138 tests; see [docs/testing.md](docs/testing.md)): pure domain logic (cart, refunds, cash drawer, analytics, catalogue parsing, order
sequence, inventory), WatermelonDB (relational round-trip, repositories), feature-flag resolution, merge
rules and an end-to-end **cloud sync** test (two devices against an in-memory Appwrite-style store).
For UI, run `npm run dev` in local mode and walk through the screens.
