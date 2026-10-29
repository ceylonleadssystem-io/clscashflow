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
| Order Entry | default order type, show prices on buttons | require order type, start new order after completing, split screen, default menu (needs Availability), modifiers screen rules, ready-by time, custom item tax (needs Taxes), delivery postal code, order number reset and limit |
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

## Register flow (changed with slice 2)
Clocking in opens the register (opening cash) and clocking out closes it (cash count, variance recorded); the separate Open and Close Register buttons are gone.
Automatic clock-out closes an open register with the expected cash as the count (no variance), because nobody is there to count.

## Next slices, in the spec's order
1. Users, Jobs and permission keys behind the roles (jobs with hourly rates will switch on labor cost and Labor % in Reports).
2. Device Manager: per-device Printers (Stations already exist as the Stations page).
3. Menu Admin with Save then Publish: Sales Categories, Taxes, Categories, Modifiers, Items, Availability.
4. Wire the "needs behaviour" rows above as their dependencies land (Taxes, Availability, order numbers).
