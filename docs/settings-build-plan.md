# Settings section: build status and plan

Source: the "Settings Section Build Spec" (System Options, Users, Menu Admin, Device Manager). Decisions taken with the product owner:
new layout inside POS Settings (old tabs kept under "More settings" until each is replaced); roles stay, permission keys come behind them later;
drafts and Publish only in the new Menu Admin pages; first delivery = shared components + System Options.

## Delivered (slice 1)
- Shared kit (`pos-react/src/components/settings/kit/`): `SettingsShell` (grouped sidebar, dropdown on narrow screens, unsaved-changes guard),
  `SaveBar`, `PageHeader`, `SectionCard`, `SettingRow` with toggle, select, number, duration, time and text-area rows, `ConditionalGroup`, `Tooltip`,
  and `SystemOptionsContext` (draft, dirty count, validation, save, discard).
- `domain/systemOptions.js`: defaults, org < location resolution, patching, validation, Quick service / Full service presets, auto clock-out rule.
- Pages: Overview (cards and presets with a before/after preview), Order Entry, Receipts, Sign In, Clock In / Out.
- Audit entry on every save; settings saved at the location level only when the business has two or more locations.

## Only settings that act today are listed (no dead switches)
| Page | Live now | Needs behaviour built first |
|---|---|---|
| Order Entry | default order type, show prices on buttons | require order type, start new order after completing, split screen, modifiers screen rules, ready-by time, custom item tax (needs Taxes), delivery postal code, order number reset and limit |
| Receipts | footer message (shared with the older tab and printed receipts) | auto print, modifiers on receipts, tip line and suggestions, email / WhatsApp toggles |
| Sign In | screen after sign in | Quick PIN toggle, card swipe, staff feedback survey |
| Clock In / Out | clock out after a maximum time, clock out at a time of day | print shift summary; an "Auto" flag on the time entry (needs a new column) |

Auto clock-out defaults to OFF (the spec says on) so existing businesses see no change until they choose it.

## Delivered (slice 2): Payroll, 3rd Party Payments, Zones
- **Payroll** (organization-wide): pay week start, paid breaks, weekly overtime, daily overtime (two tiers), 7th consecutive day, carryover, and a History drawer.
  The rules drive Reports > Payroll > Labor Costs (regular, OT and OT 2 hours per employee, from `domain/payroll.js`). Paid meals is not listed: the POS records breaks, not meals.
  TODO(spec): the 7th-day tiers have no thresholds in the spec; the first 8 hours use tier 1.
- **3rd Party Payments**: add, edit, reorder, switch off and delete types; active ones appear on the checkout payment picker (after the standard methods) and in split bills
  (replacing the generic "3rd Party"); reports show them by name. A type used on a sale can only be switched off. Stored as `settings.thirdPartyPayments`.
- **Zones**: the zones are the floors of the Table Layout, so both pages share the same data. Add, rename, reorder (main zone stays first) and delete (refused while a table has an open check).
  Deactivating a zone is not offered; the table layout has no inactive floors.
- New shared pieces: `DetailDrawer`, `SortableList` (drag handle and keyboard up/down), `StatusBadge`, `EmptyState`, `AuditTrailDrawer`, `TextRow`, `DayTimeRow`.

## Delivered (slice 3): Users, Jobs and permission keys
- **Permission keys behind the roles** (`domain/access.js`): 11 keys, each already enforced by the POS: reports.pos, settings.system.edit, menu.view, inventory.view,
  users.view, users.edit, pos.order.create, pos.discount, pos.refund, pos.void.order, pos.payments.third_party. Role presets reproduce what each role could already do
  (checked by tests), so nothing changes until an owner edits a person. Personal changes are stored as `settings.userAccess[userId] = { grant, revoke, jobs }`.
  Owners and admins always hold everything. A person can only grant keys they hold themselves.
  Keys not in the list (void item, no-sale drawer, tips, transfers and so on) are not added until the POS has a check for them, so no switch is ever dead.
- **Jobs** (`settings.jobs`): title, code, default hourly rate, active; reorder, edit, delete (refused while someone holds the job).
- **Users page** (Settings > Users): list with search, and a detail view with General, Permissions (copy from a role) and POS setup (jobs with a pay rate each, PIN, clock-in behaviour).
  Only an owner or admin can give the owner or admin role. Deleting a user removes their access record.
- **Labor cost**: a person's rate is the rate on their first job. Reports > Payroll > Labor Costs now shows Hourly Rate and Paid (overtime priced at the multipliers), and
  Reports > Sales vs Labor shows Labor Cost and Labor % per day. People with no rate are listed in a note and not costed.
- Deviations from the spec: one Name field (no first and last name), no email, phone or invite (needs a backend), no job colour, and one rate per person because time entries do not record a job yet.

## Register flow (changed with slice 2)
Clocking in opens the register (opening cash) and clocking out closes it (cash count, variance recorded); the separate Open and Close Register buttons are gone.
Automatic clock-out closes an open register with the expected cash as the count, because nobody is there to count.

## Delivered (slice 4): Device Manager > Printers
- **Devices** register themselves: the first time a signed-in browser opens the POS it adds itself to `settings.posDevices` as "Register N" (rename it, or mark it an order pad, in Printers).
  The page lists the devices of the location chosen in the top bar; "Copy setup from another device" copies printers (USB connections are not copied: USB access belongs to the browser it was granted in).
- **Printers** (`settings.devicePrinters`, `domain/devices.js`): every device has a Receipt printer, plus kitchen printers that each serve a station. Drawer: Station (a kitchen printer is named after it), Connection (with Connect and Test print on the device itself),
  Receipt copies (USB), Print from this device, Backup printer, Duplicate to. Backup and duplicate must be another printer of the same device; a printer cannot back itself up and backup loops are refused.
- **What it changes at the till** (`services/pos/printing.js`): a device with a Receipt printer setup prints receipts that way (copies, log only); a kitchen ticket for a station prints on this device's printer for that station
  (backup if it fails, a copy to the duplicate printer, "logged" and not printed when Print from this device is off). A device with no setup behaves exactly as before.
- **Stations without a printer** are listed on the page (printer stations with no printer chosen on the Stations page and none on any device).
- Deviations from the spec: the connection is the existing USB (WebUSB) or system print dialog flow, not an IP address (this POS has no network printing); Paper width and Printer type are not offered
  (receipts and tickets are laid out for 80 mm only, so a switch would do nothing); the status badge is live only for the receipt printer of the device you are on, other printers show no status;
  an offline printer shows a notice and the ticket stays in the Order Queue (no banner, no automatic retry); the "items with no station" warning is omitted because an item with no station goes to the first station;
  no `devices.edit` key: the page follows the Settings permission.
- Not yet verified: a real USB printer (no hardware here), a second physical device picking up the list.

## Delivered (slice 5): Menu Admin foundation, Sales Categories, Availability
- **Save then Publish** (`domain/menuAdmin.js`, `components/settings/kit/PublishBar.jsx`): a Save in a Menu Admin drawer stores a draft in `settings.menuDraft`; nothing changes on the POS until **Publish**,
  which copies every draft over the published lists in one write, bumps `settings.menuVersion` and writes an audit entry. The bar shows "N unpublished changes" with **Review** (each entity, field, before to after) and **Discard all**.
  A draft equal to the published list is not counted. Any further Menu Admin page plugs into the same bar by adding its key to `PAGES`.
- **Sales Categories** (`settings.salesCategories`): list with drag reorder, drawer with name, active and an item tree (ticking a category ticks its items; an item has one sales category, so ticking it moves it).
  "Add the standard five" (Food, Beverage, Alcohol, Retail, Other) for an empty list. A category that holds items cannot be removed or made inactive. **Live:** once published, Reports > Menu > Sales Category groups by them
  (items with none show as Unassigned); until then it groups by display category, as before.
- **Availability** (`settings.availabilityMenus`): menus with hours (days, start, end; an end before the start runs past midnight) and categories. **Live:** the register follows every active menu whose hours apply now
  (overlaps show both), else the **Default menu** chosen in Order Entry, else everything; the category chips and the "All" list narrow to those categories and switch at the boundary (checked every 30 seconds).
  A search still looks through every item. Renaming a category keeps menus pointing at it.
- Deviations from the spec: categories are referred to by name (this POS has no category ids); times follow the device clock, not a per-location time zone; the menu page permission is `menu.view`
  (there is no separate publish key yet); no VisibilityChips (Online is not built) and no per-category tax.
- **Not built, and why**: Taxes (this POS has no tax concept: adding one changes every total, receipt and report, so it needs a decision on rounding, inclusive or exclusive prices and takeaway rules first);
  Categories, Modifiers and Items as draft pages (the existing Products, Modifiers and category screens edit these live; putting them behind drafts means moving that editing, which is a larger change to the working catalogue).

## Delivered (slice 6): Taxes
Decisions taken (change them if you disagree): prices are entered **without tax** and tax is **added on top**; it is worked out **per line**, **half-up to the cent**, on the amount after the order discount;
a tax group applies each member to the same amount (not compounded) and lists them separately; no preset rates.
- **Taxes page** (Menu Admin, same Save then Publish): single taxes and groups (name, rate to 3 decimals, active, live preview "1,000 -> tax -> total"); **Special tax treatments** (default tax, takeaway tax,
  tax on the service charge with its own tax); **Tax by category** (a tax per category, and a takeaway tax per category when that is on). A tax in use (group member, default, category, service charge) cannot be removed.
- **At the till** (`domain/taxes.js`, `cartTotals`, `completeSale`): nothing is added until an active tax is published and a default or category tax applies, so existing businesses see no change. The checkout summary and pay screen
  show each tax; the sale stores each tax as its own line (code TAX, taxable amount in `basePrice`, so no database change); receipts print it as "VAT (18%)".
- **Refunds:** a partial refund returns the tax in proportion with the items (the tax line is not offered on its own); a full refund returns the total. Past sales keep the tax they were charged.
- **Reports:** Sales (Tax and Gross Sales), Dashboard figures and Total Sales now include tax; Reports > Taxes lists each tax with its rate, taxable sales and tax collected.
- Deviations from the spec: tax is set per **category** and as a default, not per **item** (the item screens are not on drafts yet, so there is nowhere to put an item tax; the per-item and takeaway-per-item fields come with Items);
  "Takeaway" means the Takeaway order type only (delivery apps count as other channels); custom keypad items and the Order Entry custom-item tax rows are not built.
- Not yet verified: card or cash rounding rules beyond the cent, tax on gift cards (none), a second terminal picking up published taxes.

## Delivered (slice 7): Items (per-item overrides)
- **Menu Admin > Items** (`settings.itemSettings`, drafts and Publish like the other pages): a list of items by category with search, and a drawer per item for **Tax** (follow the category, no tax, or one of your taxes),
  **Takeaway tax** (only when "Takeaway tax" is on in Taxes), **Prep ticket name** and **Receipt name**. The drawer shows the price with tax (read only). Only items with an override are stored; clearing every field removes it.
  A tax used by an item cannot be removed.
- **At the till:** an item's own tax beats its category's and the default; the prep ticket name is what the kitchen printer and Kitchen Display show; the receipt name is what receipts (printed, e-mailed text and WhatsApp) show.
  A reprinted receipt uses the names published now.
- Deviation: name, price, code, stock, photos, categories, stations and modifier assignment are still edited in Products & Services (live), not on drafts. Moving that editing behind Publish would change the working
  catalogue screens and stock handling; the new page links to it. No show-on-POS/Online chips (Online is not built), no "Duplicate item".

## Delivered (slice 8): Modifiers (limits and global modifiers)
- **Menu Admin > Modifiers** has two tabs, on Save then Publish like the other pages.
  - **Modifier groups**: the live groups (created and assigned to items in Modifier Groups and Products as before) with their options, required or optional, assigned item count and the new
    **Limits** drawer: minimum and maximum choices for "choose several" groups (`settings.modifierLimits`, no database change). The picker at the register enforces them: a box past the maximum will not tick,
    and Save to Ticket asks for the minimum. Groups where staff choose one have no limits.
  - **Global modifiers**: extras offered on any item, each with a name, an optional extra charge and an active switch (`settings.globalModifiers`), plus editable **instruction prefixes**
    (`settings.modifierPrefixes`, Add / Extra / Side / No until changed).
- **At the register:** with **Enable global modifiers** on (System Options > Order Entry, on by default) and at least one active global modifier, every order line gets an **Add extras** button
  (and the picker gets an Extras section): choose an instruction and a modifier, for example "No Onion" or "Extra Sauce (+50)". The charge goes into the line price (and is taxed with it), and the extra prints on the
  receipt, the kitchen ticket and the Kitchen Display without a group prefix ("No Onion", not "Global: No Onion"). Nothing shows until a global modifier is published.
- Deviations from the spec: groups are still created, edited and assigned in Modifier Groups and Products (live), so the assignment tree and "Show on" chips are not rebuilt; the option "Also show for items without
  modifiers" is replaced by the Add extras button on each line; a limit stored for a deleted group is simply ignored.
- Seen while testing and not changed: at 375 px the existing "Choose Modifiers" dialog is partly covered on the left by the navigation rail.

## Delivered (slice 9): sent-item approval, Categories, catalogue edits on drafts
- **Till check** (`domain/deleteApproval.js`, `pos.void.item`): when an order is sent to the kitchen its lines remember how many were sent and when. If a category asks for approval (Categories page: switch
  and grace period in seconds), taking those sent items off the order after the grace period shows a **Manager approval** dialog; a manager's or owner's PIN lets it through and writes a
  "sent-item-removed" audit entry. New permission "Remove sent items without a manager": owners, admins and managers hold it; accountants and cashiers do not (an owner can grant it to anyone). Nothing is asked until a category switches it on.
  Not covered: voiding a whole order (its own permission), items that were never sent, and lines removed by paying.
- **Menu Admin > Categories** (`settings.categorySettings` plus drafts): list with item counts and tax, **Add**, **rename**, **remove** (choose where its items move) as drafts, a **description**, and the approval rule.
  A rename or removal carries availability menus, tax by category and category settings with it (the Products screen's rename and delete do the same now).
- **Items, categories and modifier groups on drafts** (`domain/catalogDraft.js`, `applyCatalogDrafts`): the Items drawer edits name, selling price, cost, category, code and description; Modifiers has Add / Edit / Remove for groups
  (name, one or several choices, required, options with prices). These are held as drafts; **Publish applies them to the live catalogue in the same write as the rest of the menu** (adds and renames first, then removals, then item
  edits, then groups; stock rows follow). Review shows before and after, a single entry can be undone, and **Discard all** drops them. Live screens keep showing the old values until then.
- Still edited live in Products & Services (not on drafts): creating an item, photos, stock counts, printing stations, modifier assignment to items, subcategories. Item descriptions have no online use yet.

## Next slices, in the spec's order
1. Menu Admin remainder: creating items on drafts (with photos, stock and stations), modifier assignment to items, subcategories. Then wire the remaining Settings rows that waited for these (see the tables above).
2. Wire the "needs behaviour" rows above as their dependencies land (Taxes, Availability, order numbers), and more permission keys as the POS checks them.
