# Architecture

## Stack
React 18 · Vite 5 (two entries: `index.html` POS, `admin.html` administration) · WatermelonDB 0.27 on
LokiJS/IndexedDB · RxJS · Appwrite (auth + documents through Netlify functions) · vitest.

## Layers
```
views / components / modals      React UI (no business rules, no network)
        │  hooks
store/*                          providers: Ui → Session → Data → Feature → Modals → Pos → Checkout
        │
services/pos/*                   action services (completeSale, reverseSale, saveProduct, …)
        │   ctx = { store, repos, data(), session(), features(), ui }
db/*  (PosStore, repositories)   WatermelonDB
domain/*                         PURE logic: cart, sales, analytics, inventory, catalogue, orders, validators
services/{auth,cloud,platform,printing,sync}   network, e-mail, hardware, sync
```
Only `services/*` touch the network, USB or `window`. `domain/` has no side effects and is unit-tested.

## Data model
`defineTable()` (in `src/db/tables`) describes each table once and generates the WatermelonDB schema, the Model
and the row mapper. 27 tables (catalogue, customers, sales + sale_lines, open orders, users, shifts, inventory,
stock movements, locations, audit, settings, app_meta, industry tools). Conventions:
- JSON columns are stored as strings; an `extra` column keeps unknown legacy fields (lossless round-trips).
- `seq` preserves legacy array order (newest first).
- `createdAt` / `updatedAt` map to `created_iso` / `updated_iso` (WatermelonDB reserves `created_at`/`updated_at`).
- `settings` is key/value with a per-key `updatedAt`; `app_meta` holds the order sequence and **tombstones**
  (`deletedIds`) so deletes survive sync.

### PosStore
- `observe(cb)` — live plain snapshot in the legacy `db` shape (microtask-coalesced).
- `write(tx => …)` — one atomic unit of work. `tx.put/putSale/remove/removeSale/setSetting/setMeta/addCategory`.
  `tx.get` is *read-your-writes* inside a transaction (important when writing two tombstones in one save).
- `replaceAll(snapshot)` — applies a merged cloud payload, writing only changed rows.
- `readSnapshot()`, `all()`, `get()`, `getSale()`.

## Cloud sync
`cloud.service` pulls/pushes one document `users/{uid}/pos/main` (compatible with the legacy POS):
payload mapping in `services/sync/payload.js`, merge in `merge.js` (per-row last-writer-wins by
`id + updatedAt`, tombstones, per-setting timestamps). The browser talks to Appwrite through the Netlify
function `appwrite-docs`, which holds the API key. Large documents are chunked server-side.

## Feature flags
`src/config/features.js` is the registry (id, group, label, `default`, `core`, `requires`).
`resolveFeatures(saved)` → `{ enabled, raw, blockedBy }`. `FeatureProvider` merges `settings.features` with
`settings.locationFeatures[locationId]` for the active location. UI: `useFeature(id)`; services:
`ctx.features()[id]`.

## Sessions and gates
`SessionProvider`: business sign-in, workspace resolution, 60-second account status re-check, paywall.
`PosProvider`: staff PIN, active location (`locationStore`), view routing (`canView`), welcome message, shift
prompt. Hash route `#/count` is the phone stock-count page.

## Admin portal
`src/admin-app/*`: `AdminLogin`, `AdminApp`, `AccountDetail`, `adminApi.js` (Bearer JWT → `pos-admin-data`),
`billing.js` (invoice lines), `localAdmin.js` (dev back end over the local DB).

## Order e-mail
`services/printing/orderEmail.js` renders the order HTML/subject; `platform.service.sendOrderEmail` sends it
through EmailJS (`public/email-templates/pos-order-email.html`, body `{{{message_html}}}`).

## Styling
`src/styles/index.css` imports six files in cascade order: `base`, `shell`, `checkout-catalogue`, `features`,
`dialogs-settings`, `app` (admin, plans, stock search/QR and the responsive rules). Later rules intentionally
override earlier ones; do not reorder.

## Responsive layout
The last block of `src/styles/app.css` ("RESPONSIVE LAYER") owns the header and checkout sizing; it replaces the
older per-breakpoint header rules, so edit it rather than adding more overrides elsewhere.

| Width | Header | POS checkout | Mobile checkout |
| --- | --- | --- | --- |
| > 1100 | full action row | products + cart; customer/payment fields scroll, totals + Complete Sale stay visible | (wide screens) products + cart side by side |
| 700-1100 | location switcher + **More** menu (also holds navigation when the sidebar is hidden) | products + cart columns | side by side (landscape phones, tablets) |
| < 700 | same | single column with a **View Order** bar and cart sheet; sidebar becomes a top strip | single column, **View Order** bar, cart is one scroll area with Total + Complete Sale pinned |
| height <= 500 | 52px header | - | compact products + cart, no brand line |

Components: `Topbar.jsx` renders `.top-right` (location switcher, `#top-more`, `.top-actions`) and the fixed
`#mobile-cart-toggle` bar. Body classes `mobile-checkout` and `mobile-cart-open` select the layout.
