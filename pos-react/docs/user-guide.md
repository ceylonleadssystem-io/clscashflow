# User guide

## Roles

| Role | Can open |
| --- | --- |
| Owner | Everything |
| Manager | Everything except Reports |
| Accountant | Dashboard, Sales, Reports, Inventory, Staff, Settings |
| Cashier | Checkout, Orders, Customers, Staff, Settings |

The administrator can also switch individual screens and features off per business or per location, so some
items below may be missing for your account.

## Signing in
1. **Business sign-in** — the business e-mail and password (Appwrite). Shared by every device of the business.
2. **Staff PIN** — each user has a 4–6 digit PIN. Pick the location you are working at.
3. **First time only** — a welcome message (and the available plans) is shown once per user. It appears again
   only if the administrator publishes a new version.

If the account is disabled for non-payment, the payment screen replaces the POS (within a minute for devices
that are already signed in).

## Starting a shift
**Staff & Shifts → Clock In & Open Register** (also offered automatically after sign-in):
1. Enter the opening cash.
2. **Clock In** records attendance and opens the register in one step.

Cash sales need an open register. Use **Break** for breaks. To finish: **Close Register** (count the cash; the
system shows expected cash and the variance), then **Clock Out**. You cannot clock out with the register open.

## Checkout
1. Tap products (variants/modifiers open a picker). Quantity buttons change lines; **Void** discards the order.
2. Optional: customer (search or **+ New**), order discount, service charge (restaurant/café), order channel.
3. Choose payment: **Cash** (enter the cash received or **Exact Cash**; change is shown), **Card**, other methods,
   or **Split Bill** (each share must be marked paid).
4. Optional: e-mail the order, WhatsApp receipt, print.
5. **Complete Sale**. Receipt numbers are sequential (`ORD-0001`…).

Checkout is refused when: the cart is empty, no real location is selected, cash is short or the register is not
open, a tracked product has too little stock, a recipe ingredient is short, or an e-mail/phone is invalid.
Products whose stock row was deleted are always available.

**Order e-mail** sends the order itself (items, modifiers, totals, payment). If the e-mail fails the sale is
still saved.

### Open orders & kitchen (restaurant / café)
**Save as open order** keeps a bill (table/channel) for later; **Send to kitchen** prints a kitchen ticket.
Open it from **Order Queue**, add items and pay. Voiding an open order asks for a reason.

## Sales, refunds and voids
**Sales** lists completed sales. Choose **Refund** (full, or partial by item and quantity) or **Void**. A reason
is mandatory. Stock is restored, and cash refunds need an open register. A void by an owner/admin removes the
sale everywhere; a cashier's void stays in the history marked *voided*. Owner/admin can **Delete permanently**
a refunded/voided sale.

## Products, categories, modifiers
- **Products & Services**: add/edit (name, category, cost, price, type, image, modifiers, recipe, barcode),
  import from the Excel/CSV template, thumbnail or list view.
- A **Product** is stock-tracked automatically (starts at 0 — add stock before selling); a **Service** is not.
- Deleting a category moves its products to *Uncategorized*. Deleting a modifier group unlinks it from products.

## Inventory & stock
- **Add Stock**: type in the item search; pick an existing item or *Add stock item "name"*.
- **Adjust** by reason: *Stock received* adds; *Wastage*, *Damaged*, *Internal use*, *Return to supplier*
  subtract; *Stock count correction* sets the counted quantity. Stock can never go below zero.
- **Delete** a stock row on a sellable product → the product is always available (no tracking).
- **Start phone stock count** shows a QR code; scan it with a phone to enter counts on a touch page.
- **Branch counts** (owner/admin) set quantities per location; counts can also be uploaded from a sheet.

## Customers & loyalty
Name and a valid mobile number are required (7+ digits, unique per business); e-mail is optional but must be
valid. **Visits** and **Total spent** are calculated from completed sales (refunded/voided sales are excluded).
CRM shows segments, birthdays, WhatsApp messages and feedback requests; a customer can have a next-visit
discount that is applied at checkout.

## Reports
Dashboard (today / 7 days / month / custom), item report, payments mix, cash-shift reconciliation, staff hours
and customer reports, with CSV export. Tables scroll horizontally on small screens.

## Settings
Business profile (name, e-mail, address, logo, receipt footer, socials), POS setup (business type presets),
operations (printers, service charge, order channels), support code (24 h, lets Ceylonry support view the
account read-only), theme, and the plan sheet.
