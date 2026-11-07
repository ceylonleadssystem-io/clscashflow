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

## Which POS opens after sign-in
After the business e-mail and password are accepted, the POS checks the business type (set by the Ceylonry team) before opening. A car detailing (Automobile) business belongs on `automobile.ceylonrylabs.io`; every other type belongs on the main POS (`pos.ceylonrylabs.io`). If the business signed in on the other address it is moved to the right one automatically, without signing in again (the sign-in is carried over by a one-time token that lasts a minute). A business that has not chosen its type yet stays where it is. After the staff PIN, an Automobile business opens on its Detailing page. Local development, previews and the admin address never redirect.

## Starting a shift
**Staff & Shifts → Clock In & Open Register** (also offered automatically after sign-in):
1. Enter the opening cash.
2. **Clock In** records attendance and opens the register in one step.

Your register opens when you clock in and closes when you clock out, so there is no separate open or close step.
Cash sales need you to be clocked in. Use **Break** for breaks. To finish, **Clock Out**: count the cash in the drawer
and the system shows the expected cash and the variance. If Settings > System Options > Clock In / Out has automatic
clock-out switched on, the register closes with the person, counted as the expected cash (no variance is recorded).

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

## Working offline
The POS keeps working without a connection: sales, open orders, stock and settings are saved on the device and sync when it is back online (the sync indicator shows "Offline · saved on this device"). If the POS is closed and reopened offline it opens with the account that last signed in online on this device, for up to 14 days since then; after that, or after signing out, one online sign-in is needed. Background admin work (billing widgets, onboarding e-mail, support check-ins, account status checks) is skipped while offline and resumes when the connection returns. Things that need the internet by nature, such as e-mailing a receipt, uploading photos to cloud storage or the Ceylo assistant, wait until you are online; photos stay on the device meanwhile.

## Sales, refunds and voids
**Sales** lists completed sales. Choose **Refund** (full, or partial by item and quantity) or **Void**. A reason
is mandatory. Stock is restored, and cash refunds need you to be clocked in. A void by an owner/admin removes the
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
Choosing **Reports** opens a page of boxes, one per report group (Dashboard, Sales, Menu, Payroll, Sales vs Labor,
Gift Cards, Taxes, Kitchen Operations, Transactions, Audit Trail, and Multi-Location with two or more locations).
Opening a box replaces the left navigation with the list of reports plus **Back to home**. Every report has a date
range (presets: Today, This Week, This Month, Last Month, Last Year), employee / order type / payment filters shown
as chips, sortable columns, a totals row, an Info panel, a Graph toggle, and CSV / PDF / Print export. Figures come
from one shared definition (Net Sales = Item Sales - (Discounts + Refunds)), so the Dashboard, Sales and
Multi-Location totals match. Where this POS does not record a value (tax, tips by card, wages, zones, gift cards) the
report says so on screen. **End of Day & Overview** keeps the full End of Day report, item sales, registers, staff
hours and customer reports. Tables scroll horizontally on small screens.

## Account admin portal (/admin)
Open `yoursite/admin`, sign in with the same business login and your staff PIN, and manage the account without any
POS features. Boxes: **Location Info** (business name, address, logo, locations), **Reports**, **Menu Admin** (products
and modifiers), **User Admin**, **Timesheets** (clock-in, clock-out and break hours with CSV export) and **Shop**
(hardware categories that open a quote email). What each person sees follows their role. Opening Reports swaps the
left navigation for the report list with a Back to home button. The Ceylonry staff portal is at `admin.ceylonrylabs.io`.

## System Options (Settings)
Settings has a sidebar. **System Options** holds Order Entry, Receipts, Sign In, Clock In / Out, Payroll, 3rd Party Payments and Zones; the older
tabs are under **More settings**. Changes are kept as a draft (a bar shows how many) until you press **Save**; **Discard** drops them.
- **Payroll**: the pay week and overtime rules, used for hours in Reports > Payroll. **History** shows who changed what.
- **3rd Party Payments**: delivery apps and other payment types; the active ones appear on the payment screen in the order you set.
- **Zones**: the areas of the floor that hold tables (the same floors as in Table Layout).
- **Presets** on the Overview page (Quick service, Full service) show what would change before you apply them.

## Users, jobs and permissions (Settings)
**Settings > Users** lists everyone who signs in. Open a person to change their **General** details and role, their **Permissions** (start from a role with
*Copy from*, then switch individual permissions) and their **POS setup** (jobs with an hourly rate, PIN, clock-in behaviour). **Jobs** holds the job titles and
their default hourly rate. The rate on a person's first job prices their hours in **Reports > Payroll** and **Sales vs Labor** (labor cost and labor %).
Owners and admins always have every permission, and you can only give a permission you hold yourself.

## Items ready to serve (restaurant with Kitchen Displays)
On a Kitchen Display each item has a **Ready** button; the ticket moves to Ready when its last item is marked. The POS then shows a notice with a sound ("Table 5 · Kitchen ready to collect: 2 × Burger"), and the Order Queue lists the ready items under **Ready to serve**. Tap **Collected** once they are picked up. An order with food from several stations (kitchen, bar) is tracked per station: the Kitchen column of the Order Queue shows "Kitchen: 1/2 ready", "Bar: 1/1 ready". Stations that only print tickets do not report back.

## Restaurant (OGF) and Sales push
A business of type **Restaurant (OGF)** works like a restaurant and lives at `ogf.ceylonrylabs.io`. Under Settings > System Options it has **Sales push (OGF only)**: the property code and server address OGF gave you, one login per register, what is sent and how, **Test connection**, **Preview what is sent**, **Send now**, and the log of what the mall answered. Completed sales (with voids and refunds as their own records) are sent about once an hour. The client secret is kept on the server and is never shown again. The full set-up steps and the points still to confirm with OGF are in `docs/ogf-sales-push.md`.

## Label printer through the print helper (Windows)
If the browser says "Access denied" when you connect a USB label printer (for example an Xprinter XP-365B), Windows is keeping it for its own printer driver and a web page may not open it. Instead of changing the driver, use the print helper: 1) install the printer's Windows driver so it shows under Printers & scanners; 2) install the free **QZ Tray** app from qz.io/download and start it (it sits in the system tray); 3) in Settings > Device Manager > Printers press **Connect via Print Helper**, choose the printer and press **Use this printer**. The first time, QZ Tray asks to allow the site: choose Allow and tick Remember this decision. Press **Calibrate Label Gap**, then print a test label. The choice is remembered on this computer; labels, calibration and the alignment test then go through the helper (receipt and kitchen printers still use USB or the browser dialog). The helper must be running when you print. Direct USB (Connect Label Printer) and the helper replace each other: connecting one forgets the other.

## Printers by device (Settings > Device Manager)
Each register or order pad appears in **Printers** the first time someone signs in on it. Pick a device on the left to see its printers: a **Receipt printer** and any
kitchen printers you add, each serving a station. Open a printer to choose the connection (USB or the system print dialog), the station, the number of receipt copies,
whether this device prints at all (off = log only), a **backup printer** and a **duplicate to** printer. Connect and test a USB printer on the device it is plugged into.
**Copy setup from** another device saves retyping. A device you have not set up keeps using Receipt Printing and the Stations page.

## Where things are in Settings
Settings opens on four boxes: System Options, Users, Menu Admin and Device Manager. Open one to see its pages; "All settings" brings you back. Business Profile is the first page under System Options.

System Options: Order Entry, Receipts, Sign In, Clock In / Out, Payroll, 3rd Party Payments, Zones, **Service Charge**, **Appearance** and **Customer Feedback**. Menu Admin: Items, Categories, Modifiers, Availability, Taxes, Sales Categories
(Items and Modifiers also hold the full item and group editors). Device Manager: **Printers** (when to print, each device's printers, USB devices) and **Stations**; receipt socials are under Receipts and the order types under Order Entry. The business type is chosen once during setup; Ceylonry support changes it afterwards.

## Menu Admin (Settings)
Menu Admin pages save **drafts**: nothing changes on the register until you press **Publish** in the bar at the top right of the page ("N unpublished changes", with **Review** to see each change and **Discard all**).
- **Sales Categories**: reporting groups (Food, Beverage and so on) that you fill with items. Once published, Reports, Menu, Sales Category uses them; items with none show as Unassigned.
- **Availability**: menus such as Breakfast and Dinner, each with days, hours and the categories to show. The register shows the categories of every menu running now; when none runs it shows the
  Default menu from System Options, Order Entry (or everything). Overlapping menus both show.
- **Taxes**: add your rates (for example VAT 18%) and groups, choose a default tax and a tax per category, then Publish. Tax is added on top of item prices after any discount, and shows on the
  checkout, the receipt and Reports, Taxes. Until a tax is published nothing is added. A partial refund returns the tax with the items.
- **Items**: for each item, its own tax (or none), a takeaway tax, the **prep ticket name** shown to the kitchen and the **receipt name** printed on receipts. Name, price and stock stay in Products & Services.
- **Categories**: add, rename or remove categories, give them a description, and decide whether taking items off an order **after it was sent to the kitchen** needs a manager's PIN (and after how many seconds).
  Managers and owners are never asked; the removal is recorded in the audit log.
- **Items, categories and modifier groups** can be edited here as drafts (name, price, cost, category, code, description, groups and their options); they change on the register only when you Publish.
  You can also **add items** here (with their stations, modifier groups and subcategory); the photo is set in the item drawer too. The **Catalogue tools** tab is gone: its tools now sit on the Items page. Search and filter by category and by Products / Services; on each item **Edit** saves a draft that goes live on Publish, while **Details and stock** (the full POS item editor: stock count, unit, supplier, recipe, photo position), **Print barcode** and **Delete**, and **Import items** at the top act on the register's items straight away. Categories has the same search and filters as the POS category manager; subcategories are added, renamed and removed in the category drawer.
- **Require order type selection** (Order Entry): payment waits until the order type is chosen.
- **Modifiers**: set how many options of a "choose several" group staff must or may pick, and add **global modifiers** (onion, sauce, ice) with prefixes such as Add, Extra, Side and No. When global modifiers are
  on in Order Entry, each order line shows **Add extras**; "No Onion" or "Extra Sauce" then prints on the receipt and the kitchen ticket.

## Settings
Business profile (name, e-mail, address, logo, receipt footer, socials), POS setup (business type presets),
operations (printers, service charge, order channels), support code (24 h, lets Ceylonry support view the
account read-only), theme, and the plan sheet.
