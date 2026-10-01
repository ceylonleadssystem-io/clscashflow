# Development guide

## Setup
```bash
cd pos-react
npm install
cp .env.example .env.local
npm run dev        # POS:    http://localhost:5173/posv2/   (base path from VITE_BASE_PATH, default /posv2/)
                   # Admin:  http://localhost:5173/posv2/admin.html
npm test           # vitest
npm run build      # dist/
```
Set `VITE_AUTH_PROVIDER=local` for offline development (owner PIN `1234`, dev admin
`admin@ceylonry.local` / `Admin#12345`). For Appwrite mode run `netlify dev` in the repository root and set
`VITE_FUNCTIONS_PROXY=http://localhost:8888`.

## Conventions
- Keep business rules in `domain/` (pure) and side effects in `services/`.
- Components never call Appwrite, USB or `window.cls*`; go through a service.
- Writes go through `store.write(tx => …)`; one user action = one transaction.
- User-facing dialogs use `ctx.ui.alert/confirm/prompt/notice` (promise based).
- AGENTS.md rule: do not remove or simplify features when changing the design — restyle them.

## Recipes
**Add a feature switch** — append `f("group.id", "group", "Label", "Description", { requires: [...] })` to
`FEATURES` in `src/config/features.js`; read it with `useFeature("group.id")` or `ctx.features()["group.id"]`;
add it to `PLAN_FEATURE_OFF` if a tier excludes it.

**Add a table or column** — add/extend the spec in `src/db/tables/*`; add a migration step in
`src/db/migrations.js` and bump `SCHEMA_VERSION`; extend the sync payload only if it must sync.

**Add an action** — write `async function myAction(ctx, …)` in `src/services/pos/<domain>.js`, register it in
`services/pos/index.js`, call it as `svc.<domain>.myAction(…)`, add a test using `tests/harness.js`.

**Add a screen** — create `src/views/X.jsx`, register it in `ViewRouter.jsx`, `ROLE_VIEWS` (`config/roles.js`)
and `VIEW_FEATURE` (`config/features.js`).

**Styling** — add rules to the matching file in `src/styles/`; if a rule must beat an earlier one, put it in
the later file.

## Debugging
- Local database: browser DevTools → Application → IndexedDB → `ceylonry-pos-*`.
- Reset local data: clear site data for the origin.
- Sync problems: check the `appwrite-docs` function logs in Netlify.
