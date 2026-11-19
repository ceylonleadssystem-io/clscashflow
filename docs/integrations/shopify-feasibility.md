# Shopify orders into the POS: feasibility

**Verdict: feasible.** One-way (Shopify order arrives in the POS) is a small-to-medium build. The hard parts are Shopify's customer-data rules, matching Shopify products to POS items, and (only if wanted later) keeping stock in step in both directions.

## What the POS already has
- **Order channels:** open orders already store `orderChannel` and `platformOrderId` (built for PickMe and Uber Eats). A Shopify order fits as an open order with channel "Shopify" and the Shopify order id as `platformOrderId`, which also gives a natural duplicate check.
- **Kitchen and receipts:** an open order can be sent to the kitchen (tickets, stations, KDS) through the existing `queueKitchenTicket` path.
- **Item matching:** each POS item has a `code`; Shopify line items carry a SKU. Using SKU = POS code is the simplest match.
- **Payment:** 3rd Party Payments (Settings > System Options) can hold a "Shopify" type, so a prepaid web order is recorded without touching the cash drawer.
- **Server side:** Netlify functions with an HMAC-style public endpoint already exist (`stripe-webhook`, `payable-webhook`), and the Appwrite document store can hold a per-business inbox.
- **Not present:** no Shopify code anywhere in the repo.

## How it would work
1. The business connects a Shopify store (see "Connecting a store").
2. Shopify sends an `orders/create` webhook to a new function, `shopify-webhook`.
3. The function verifies the signature, writes the order to a per-business **inbox** document (`users/{owner}/shopifyInbox/{webhookId}`) and returns 200 at once.
4. A POS device that is open pulls new inbox rows (same pull loop as cloud sync), turns each into an open order, rings the alert and sends it to the kitchen if the business wants that, then marks the row as taken.
5. Staff see it in Orders with the Shopify channel, prepare it, and complete it as a paid 3rd Party sale. Stock and recipe deduction then work as for any sale.

Why an inbox and not writing straight into the POS data: the POS is local-first and merges changes per row. A server writing into the same cloud document could collide with a device's push. An inbox with "taken" marks avoids that.

## Shopify facts that shape the design
- **Webhooks:** Shopify signs each delivery with HMAC-SHA256 of the raw body, sent base64 in `X-Shopify-Hmac-SHA256`, using the app's client secret. It expects a 200 within 5 seconds, retries 8 times over 4 hours, then deletes the subscription. Deliveries can repeat, so processing must be idempotent (use `X-Shopify-Webhook-Id`). So the function must only verify, store and acknowledge.
- **Scopes:** reading orders needs `read_orders`; by default that covers the last 60 days of orders, which is fine for new orders.
- **Customer data:** order name, address, email and phone are "protected customer data". Without approval Shopify redacts them. Shopify lists a custom app for one store as always having Level 1 access (order data without those fields); Level 2 (name, address, phone, email) is "always available" for custom apps in one table but varies by plan for admin-created custom apps. A public app needs Shopify's review. Delivery orders need name, phone and address, so this must be confirmed for the target store's plan.
- **Sources of these facts:** [webhooks](https://shopify.dev/docs/apps/build/webhooks/subscribe/https) and [protected customer data](https://shopify.dev/docs/apps/launch/protected-customer-data) on shopify.dev. Third-party guides disagree on some details (which secret signs custom-app webhooks, app model in 2026), so confirm in a test store before building.

## Connecting a store: two options
| Option | Fits | Effort | Catch |
| --- | --- | --- | --- |
| **Custom app per store** (merchant creates it in their Shopify admin and pastes the token and secret into POS Settings) | A few known customers, e.g. one cafe group | Low | The merchant does a manual setup; each token and secret must be stored encrypted |
| **Public app with install button (OAuth)** | Many customers connecting themselves | High | Shopify app review, protected-data approval, billing and privacy requirements |

Recommendation: start with the custom-app route for the first customer, keep the inbox and mapping code independent of how the store was connected, and move to a public app only if demand justifies it.

## Mapping Shopify to the POS
- **Items:** SKU = POS `code`. An unmatched line is kept as a text line at the Shopify price and flagged for staff, so an order is never lost.
- **Modifiers:** Shopify variants and line properties do not map to POS modifier groups; map by variant title where needed, otherwise show as a note.
- **Prices, tax, discounts, shipping:** take Shopify's totals as the source of truth for the order (do not re-price), and show shipping and discount as lines. Tax-inclusive vs exclusive shops need a setting.
- **Currency:** the POS formats everything as LKR. Orders in another currency need a stated rule (reject, or store the shop currency) before launch.
- **Customer:** create or match a POS customer by phone for delivery and receipts, only when Level 2 data is approved.
- **Status:** `financial_status = paid` means a prepaid order. Pay on delivery orders need a "collect on delivery" flow.

## Risks and open decisions
1. **Customer data approval** (above): decides whether delivery details can be used at all.
2. **Overselling:** Shopify stock and POS stock are separate. One-way orders do not keep them equal. Pushing POS stock to Shopify (inventory levels API) is a second phase and needs a single source of truth.
3. **A POS must be open to receive orders.** The inbox keeps orders until one pulls them, but a closed shop would not hear a new order. A sound plus a push to the owner's phone would be needed for unattended shops.
4. **Cancellations and edits:** `orders/cancelled` and `orders/updated` webhooks should update or void the matching open order; only handled if the order has not been prepared.
5. **Hosting:** the planned move off Netlify means the webhook endpoint becomes a module of the new backend. Build it as a self-contained module (verify, store, ack) so it moves unchanged.
6. **Secrets:** per-store tokens and secrets must be stored encrypted, never in the frontend.

## Suggested phases
1. **Receive (about 1 to 2 weeks):** `shopify-webhook` function, inbox, Settings page to connect a store, orders appear as open orders with the Shopify channel, duplicate-safe.
2. **Operate (about 1 week):** kitchen and KDS routing, new-order alert, unmatched-item flags, cancel handling, "Shopify" payment type, reports by channel.
3. **Sync back (optional, 1 to 2 weeks):** mark orders fulfilled in Shopify, push stock levels, product import/mapping tool.

Estimates assume one store and one developer, and exclude Shopify app review if a public app is chosen.

## Questions for you
1. How many stores will connect, and are they yours or customers'? (decides custom vs public app)
2. Which Shopify plan is the first store on, and are delivery name and address needed on the order?
3. Is the shop currency LKR?
4. Prepaid only, or also pay on delivery?
5. Do you also want stock kept in step (phase 3) or only orders in?
6. Should web orders go straight to the kitchen, or wait for staff to accept?

## Status: phase 1 (receive) built
- **Connect:** Settings > System Options > Online Store. Per store: address, the webhook signing secret from Shopify (Settings > Notifications > Webhooks) and the location that prepares its orders. More stores can be added the same way; each store has its own row.
- **Receive:** `netlify/functions/shopify-webhook.js` verifies the signature, stores the order in a server-only inbox and answers at once; duplicates and cancellations are handled. `shopify-store.js` saves the (encrypted) secret and `shopify-inbox.js` hands new orders to the POS.
- **POS:** a device at the store's location checks every 30 seconds, saves each order as an open order with the Shopify channel (one row per Shopify order, so two devices never double it), matches items by SKU = item code, and shows it under Online Orders.
- **Needs:** `CEYLO_KEY_SECRET` set on Netlify (the same secret that protects AI keys encrypts the signing secret).
- **Admin switch:** Online orders (Shopify) is a feature switch in the admin Features tab (group "Online orders"), off for every business until an admin turns it on. It shows or hides the cart button, the Online Orders page and the Online Store settings page, and stops the order checking.
- **Kitchen:** an Online Store option sends each new order to the kitchen as it arrives (restaurant and cafe businesses); otherwise orders wait under Online Orders.
- **Payment:** connecting a store adds a "Shopify" payment type; a recalled online order is preselected to it. A Shopify order keeps its channel and order number through payment, also in a shop without a kitchen.
- **Closed shop:** an optional address per store gets an e-mail when an order arrives and no POS has checked for orders in the last 3 minutes (needs `SMTP_USER` and `SMTP_PASS`, as the other e-mails).
- **Currency:** each store has a currency and, if it is not LKR, a fixed exchange rate (LKR for 1 unit). Amounts are converted when the order is saved. An order in a currency with no rate is not saved and the staff are told once; it arrives after the rate is set (by connecting the store again).
- **Not yet:** fulfilment and stock sent back to Shopify, a phone push for a closed shop, live exchange rates, and the Admin API (not needed for receiving).
- **Checked:** the three functions were run against an in-memory fake database (signature, duplicates, cancellation, location filter, disconnect). Not yet run against a real Shopify store or the real Appwrite database.
