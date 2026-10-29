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

## Next slices, in the spec's order
1. Payroll, 3rd Party Payments, Zones (new tables for payment types and zones).
2. Users, Jobs and permission keys behind the roles.
3. Device Manager: Stations (exists as the Stations page) and per-device Printers.
4. Menu Admin with Save then Publish: Sales Categories, Taxes, Categories, Modifiers, Items, Availability.
5. Wire the "needs behaviour" rows above as their dependencies land.
