# Test plan

`npm test` (vitest, Node). 138 automated tests, 11 files. The service tests run the **real** services against
a real in-memory WatermelonDB (`src/tests/harness.js`); only the e-mail sender is faked.

## Harness
```js
const h = await createHarness({ role: "cashier", features: { "checkout.discounts": false }, settings: {...} });
const p = await addProduct(h);                       // Service type (no stock tracking)
await openShift(h);                                  // clock in + open register
const { sale } = await h.svc.sales.completeSale({ cart: [line(p, 2)], discount: noDiscount, payment: "Card" });
h.data();      // latest snapshot      h.lastAlert();  // last validation message
h.answers.confirm = false;                           // decline confirmations
```
`h.svc.*` refreshes the snapshot before and after every call.

## Automated coverage
| File | Workflows |
| --- | --- |
| `domain.test.js` | cart totals, discounts/service charge, split shares, refunds & cash drawer, analytics, catalogue parsing, order numbers, feature flags, merge rules, formatting, stock reasons, invoices, validators |
| `db.test.js` | WatermelonDB round trip, ordering, `extra` column, sale lines, cloud payload mapping |
| `cloud.test.js` | two-device sync with a fake Appwrite store |
| `checkout.test.js` | guards, cash/change/register, card, discounts, stock block & deduction, recipes, order e-mail, WhatsApp, split bill, restaurant service charge, open orders, void order |
| `refunds.test.js` | reason required, full/partial refund, double reversal, cash register rule, stock restore, owner purge vs cashier void, permanent delete rules |
| `shifts-users.test.js` | Clock In & Open Register, breaks, close variance, clock-out rule, user validation/duplicates/deletion/permissions |
| `catalog.test.js` | product validation, categories, subcategories, modifiers, import (merge/replace) |
| `inventory.test.js` | item create/edit, every adjustment reason, negative guard, deleting a stock row ⇒ always available, ingredient delete, branch/bulk counts |
| `customers.test.js` | validation, duplicate phone, total spent/visits, refunded sales excluded, phone matching |
| `settings-locations.test.js` | location rules, settings validation, support code, setup wizard, theme |
| `admin.test.js` | dev admin login, local admin API (disable, features per location, welcome, plan, invoices), tier prices, extra-feature billing, fixed-amount exception, welcome rules |

## Manual checklist (not automated)
- Sign-in gates: Appwrite sign-in, forgot password, staff PIN, location chooser.
- Admin portal against the real backend: sign-in, disable/enable account (POS shows payment screen within
  ~1 min), feature per location, welcome message on a fresh user, invoice e-mail.
- Printing: browser print, USB receipt/label printer, barcode scanner, KOT.
- E-mail receipt (EmailJS) and WhatsApp sharing.
- Phone stock count: QR modal → `#/count` page on a phone.
- Responsive layouts: phone, tablet, desktop (checkout, tables in Reports/Sales, settings).
- Offline: work offline, reconnect, confirm sync and no lost sales.
- Cloud merge of two devices editing the same record.
