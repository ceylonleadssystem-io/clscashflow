# Settings Section Build Spec: what is still pending

Checked against the "Settings Section Build Spec" (sections 1 to 13). Built work is described in `docs/settings-build-plan.md`; this file lists only what is **not done**, why, and what it needs.
Legend: **Needs a decision** = product input is needed; **Needs a feature** = the POS has nothing for it yet; **Needs a backend** = needs server work (this app is local-first); **Small** = can be done next.

## 1. Navigation and structure (spec 1, 2.2)
| Spec item | State |
|---|---|
| Routes such as `/settings/system/:page`, `/settings/menu/:page/:id` | Not done. The app uses view state, not a router, so pages have no URLs of their own and cannot be bookmarked or opened in a new tab. Needs a decision on adding a router. |
| Location switcher in the Settings header | The location is chosen in the top bar of the app, which the pages follow. A switcher inside Settings is **Small**. |
| Breadcrumb in the Settings header | Not done. **Small**. |
| Full detail pages with tabs for User and Item | Users has them. Items edits in a drawer (and the old full editor under Catalogue tools). A tabbed Item page is **Small** to medium. |
| Out of scope in the spec but moved in by you (Service Charge) | Done (System Options > Service Charge). |

## 2. System Options (spec 5)
**Order Entry**
- Screen after splitting a check (original order or order queue): **Small**.
- Always show modifiers screen / also for items without modifiers: partly covered by the Add extras button; the two switches themselves are **Small**.
- Default "ready by" time (0 to 240 minutes): **Needs a feature** (orders have no ready-by time).
- Apply a tax to custom (keypad) items, and its tax: **Needs a feature** (there are no custom items).
- Default delivery postal code: **Needs a feature** (no delivery address on orders).
- Reset order number daily, and order number limit (99 to 99999): **Needs a decision**. It changes numbering on live data and the "never duplicates within a business day" rule.
- Start a new order after completing one: the register already starts a new order; no switch.
- "Each toggle changes behaviour without a restart" holds for the options that exist.

**Receipts** (spec 5.3)
- Live receipt preview with a 58 / 80 mm toggle: **Small** to medium. Receipts are laid out for 80 mm only, so 58 mm needs the layout work too.
- Print receipt automatically after payment as a System Option (it exists as the older "Print customer receipt after sale" in Device Manager > Receipts & Printing): **Small**.
- Show modifiers on receipts (no-charge / paid): **Small**.
- Tip line on card receipts, tip suggestions and suggested percentages (chip list editor): **Needs a feature** (the POS records no tips; this also needs the card-payment flow).
- Email receipt switch: **Small** (the POS already emails receipts when a customer email is entered; no switch).
- WhatsApp receipt behind feature flag `receipts.whatsapp`: the WhatsApp receipt already exists, un-flagged. Hiding it behind the flag is **Small** and **Needs a decision** because it would remove a working feature.
- A digital receipt never sends without a customer email: already true for email.
- Footer message scope: it is saved for the whole business, not per location.

**Sign In** (spec 5.4)
- Quick PIN sign-in toggle, unique 4-digit PIN generation for everyone, show the PIN once, email PINs, duplicate PIN rejection message, first-sign-in prompt to change a PIN, manager PIN reset in POS setup: **Needs a feature / backend** (emailing needs the server; PIN reset exists as editing the PIN).
- Card swipe sign-in (`signin.card`, off, hidden): **Needs a feature** (no card readers).
- Staff feedback survey on sign out: **Needs a feature**.

**Clock In / Out** (spec 5.5)
- Print shift summary on clock out: **Needs a feature** (shift summary print; tips declared do not exist).
- An "Auto" flag on time entries that were clocked out automatically: **Needs a decision**, it adds a column to time entries (schema change). Auto clock-out defaults to off here (the spec says on) so existing businesses see no change.

**Payroll** (spec 5.6)
- Paid meals (switch and length): not built; the POS records breaks, not meals. **Needs a feature**.
- Show the allotted paid time when a break starts on the POS: **Small**.
- Tier 1 / Tier 2 multipliers for the 7th consecutive day and their thresholds: built with the first 8 hours at tier 1; the spec gives no thresholds. **Needs a decision**.

**3rd Party Payments** (spec 5.7): built. Reports break down by name, including inactive ones.

**Zones** (spec 5.8)
- Deactivate a zone (the spec makes it the primary action): not offered, the table layout has no inactive floors. **Needs a decision**.
- "Zones are needed only with table service" note: **Small**.
- A zone with open orders can't be deleted: done. Moving a zone's tables to another zone in the delete dialog: **Small**.

**Overview presets** (spec 5.1): Quick service and Full service presets set only the options that exist. Rows for options not built (require order type is now built; force modifiers screen, print receipts automatically, tip line, Quick PIN) are not part of the presets yet.

## 3. Users (spec 6)
- First name and last name as separate fields: one Name field today. Splitting it changes how names show everywhere. **Needs a decision**.
- Email invite to set up a login, and email as the secure login: **Needs a backend**.
- Mobile phone, validation: **Small**.
- Users list columns: Locations and last/first name ordering: **Small**.
- Location switcher filtering the user list: **Small**.
- A full "owner" toggle that turns on and locks every permission: owners and admins hold everything already; a toggle on other roles is **Small**.
- "Copy from" another user: **Small** (copy from a role exists).
- The last active owner can't be deactivated, deleted or lose Owner: **Small**, check it.
- Deactivate vs delete explicit status: users have an active flag; the explicit action wording is **Small**.
- Jobs: colour palette, status inactive vs active toggle exist partly; seeded with the roles as you asked (the spec listed Manager, Cashier, Server, Bartender, Kitchen).
- Job per time entry (so a person with two jobs is paid per job worked): **Needs a decision**, adds a field to time entries.

## 4. Menu Admin (spec 7)
- **Items:** `showOn` (POS / Online) chips, `onlineDescription`, per-category price ordering inside a category (drag reorder in the tree), "Duplicate item", max 2 print stations, item code uniqueness, items on past orders can only be deactivated: **Small** each; Online is **Needs a feature**.
- Items: new items on drafts have no photo and no stock tracking (photos and stock stay in the Catalogue tools tab): **Needs a decision** (drafts of image uploads and stock rows).
- **Modifiers:** group `showOn`, assignment tree (assign a group to a whole category), minimum for optional groups: **Small**.
- **Global modifiers:** built; "also show for items without modifiers" switch is the Add extras button.
- **Availability:** evaluated in the location's time zone (the device clock is used today): **Needs a decision**; per-location menus: **Needs a decision** (spec open question 2).
- **Categories:** `showOn`, `isGroup` parent categories (the POS has categories and one level of subcategories, which covers it), delete approval (built).
- **Sales Categories:** inactive categories can't be deactivated while holding items (done) and "bulk reassign" offer: **Small**.
- **Taxes:** built. Item-level takeaway tax exists; tax groups cannot be compounded (by design). A tax on custom items: **Needs a feature**.
- **Publish:** atomic across the menu: done (one write). Optimistic locking (`409` when two people publish at once): **Needs a backend**. Terminals pick up published menus through the normal sync; a "menu version" refresh banner is **Small**.
- Items on drafts: name, price, cost, category, code, description, stations, modifier groups, subcategory, tax and names. **Not on drafts:** photos, stock, recipes and import / export (they live in Catalogue tools and save at once).

## 5. Permissions (spec 8)
Built keys (13): reports, change settings, menu, inventory, see users, edit users, take orders, discounts, refund, void order, remove sent items, 3rd party payments. Not built because the POS has no check for them yet:
`settings.location.edit`, `menu.edit`, `menu.publish`, `menu.stations`, `menu.taxes`, `menu.availability`, `menu.sales_categories`, `menu.images`, `time.edit_entries`, `devices.edit`, `pos.access`, `pos.clock.self`, `pos.shift_report`, `pos.item.edit`, `pos.item.edit_sent`, `pos.drawer.open`, `pos.drawer.cash_in_out`, `pos.order.reopen`, `pos.item.resend`, `pos.table_layout.edit`, `pos.custom_items`, `pos.discount.custom`, `pos.order.transfer`, `pos.split`, `pos.item.notes`, `pos.stock`, `pos.clock.open_orders`, `pos.break.override`, `pos.tips.declare`, `pos.tips.all`, `pos.orders.all`, `pos.drawer.assign`.
Each is **Small** to add as its check is added. **Needs a decision:** splitting Menu into publish / taxes / availability keys would change who can do what today.
- Presets named Owner / Manager / Employee (the app has five roles): the role presets cover this.
- "Sidebar items the user can't use are hidden; disabled actions show a tooltip": the sidebar hides pages; tooltips on disabled actions are **Small**. A person an owner has given the menu permission but not "change settings" cannot reach Menu Admin, because the Settings sidebar needs the settings permission. No built-in role is in that position, so it only matters once permissions are edited per person. **Needs a decision**.

## 6. Device Manager (spec 9)
- Printers: connection is USB or the system print dialog (no network search, as decided); IP address printers: **Needs a feature**. Paper width 58 mm and printer type: **Needs a feature** (layouts are 80 mm only).
- Offline printer banner on the POS and automatic retry of queued tickets: **Small** to medium (a notice and the Order Queue exist today).
- Copy setup between devices: done (USB connections are not copied).
- Kitchen ticket content (order type, table / zone, number, user, time, modifiers with prefix): the prefix is done; confirm table / zone and user on the ticket: **Small**.
- Stations: warning for active items with no station: not shown (an item with no station goes to the first station). Stations without a printer: shown.

## 7. Cross-cutting (spec 4, 10, 11, 12)
- Audit trail: a History action on every page (only Payroll and 3rd-party types have one; most saves are audited but cannot be read back on the page): **Small** to medium.
- Server validation matching the front end, `409` on stale writes, `POST /api/...` endpoints: **Needs a backend**. The app is local-first, so there is no API for this to live in.
- Settings saved by one device reaching a running terminal "without restart": works through the normal sync; not verified across two physical terminals.
- Editing needs a connection (offline banner, Save disabled): **Needs a decision** (the POS is offline-first by design).
- Performance (pages under 1.5 s, lists of 2,000 items virtualised): the item lists are not virtualised. **Small** to medium.
- Accessibility: labelled fields, keyboard reorder, visible focus are built; a full audit with a screen reader has not been done.
- Localisation (all copy in translation files, Sinhala and Tamil later): **Needs a decision**, copy is inline today.
- Tests: unit tests exist for validation, overtime and totals; "one end-to-end test per module" is not built (browser checks were done by hand).
- Definition of done items: loading skeletons and error states on every list, "no raw hex in screen code" (a few fallbacks remain in CSS), the word "Client" nowhere (checked for new copy only): **Small**.
- `ColorPicker` for job colour, `PercentRow` and `CurrencyRow`: **Small**.
- Browser coverage: Chrome only so far. Safari, Firefox and real tablets are not tested.

## 8. Open questions from the spec (section 13)
1. Which order types are needed at launch: the app offers Dine-in, Takeaway and the delivery apps; bar tab and others are not defined.
2. Per-location menus or only per-location price / status overrides: the menu is organisation-wide; location fields are not stored.
3. Whether managers can view a PIN or only reset it: managers can see PINs today when editing a user. **Needs a decision**, the spec default is reset-only, hashed.
4. Card swipe devices: none supported; stays off.

## 9. New requests from this round, and their state
Done: Service Charge, Appearance and text size, Customer Feedback moved to System Options; Receipts & Printing and Stations moved to Device Manager; business type chosen once at setup and changed only from the admin portal; jobs start as the roles; Products & Services, Modifiers and Stations removed from the navigation and available in Menu Admin / Device Manager (with the full live editors kept under "Catalogue tools" and "Group editor"); Menu Admin order; admin portal Menu Admin updated; admin portal analytics (overall on the main page and a tab per business).
Not done or partly: the Operations tab keeps "Always live screen" (a per-device switch) and, for staff without settings access, text size; the "Receipt Printing" tab remains for staff without settings access so they can reconnect a USB printer.
