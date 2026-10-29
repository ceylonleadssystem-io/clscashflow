# POS variants (verticals)

One app serves every business field. A variant is configuration, not a fork. Four places describe it:

| What | Where |
|---|---|
| Field and its feature switches (Food & Beverage, Retail, Personal & Beauty, Hospitality, Health & Wellness, Automotive, Entertainment, Education, Other) | `src/config/featurePresets.js` |
| Business type: starter categories and guidance | `src/config/presets.js` (`POS_TYPE_PRESETS`) |
| What a business type can do (kitchen, service charge, appointments, ...) | `src/config/capabilities.js` |
| Individual feature switches | `src/config/features.js` |

## Rules
- Never test a business type directly (`businessType === "salon"`). Ask `hasCapability(type, "appointments")`.
- A screen that only some verticals need is a module with a capability. Business Tools is the model: `src/views/businessTools/index.js`
  lists the modules, each tagged with its capability, and `views/Industry.jsx` shows the ones the business type has.
- Maths and rules live in `src/domain/` (pure, tested); screens only display them. Reports follow the same pattern
  (`domain/reportBuilders.js` + `domain/reportsCatalog.js`).

## Add a new business type
1. Add it to `POS_TYPE_PRESETS` (label, categories, note) and `BUSINESS_TYPE_OPTIONS`.
2. Add its capabilities to `CAPABILITIES` in `config/capabilities.js`.
3. Point the field's preset in `featurePresets.js` (`posType`) at it and set that field's `off` switches.
4. `npx vitest run`: `src/tests/capabilities.test.js` fails if a type has a preset but no capabilities.

## Add a new module (for example vehicles and job cards for Automotive)
1. Build it as one component in `src/views/businessTools/` that reads its own data and takes `{ canManage, setModal }`.
2. Register it in `views/businessTools/index.js` with a new capability name.
3. Give that capability to the business types that use it in `config/capabilities.js`.
4. New data (a table) also needs a definition in `src/db/tables/` and the cloud sync lists; this is the part that needs a product spec.
