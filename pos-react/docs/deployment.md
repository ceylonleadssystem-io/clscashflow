# Deployment & operations

## Build
The repository root `package.json` runs `npm run build` on Netlify:
`npm run check && npm --prefix pos-react ci --include=dev && npm --prefix pos-react run build`.
`netlify.toml` publishes the repository root (`publish = "."`), so the compiled app is served from
`pos-react/dist` through redirects:

```
/posv2        → /pos-react/dist/index.html   (200)
/posv2/       → /pos-react/dist/index.html   (200)
/posv2/*      → /pos-react/dist/:splat        (200)
```
`vite.config.js` sets `base` to `VITE_BASE_PATH` or `/posv2/`, so assets are requested from `/posv2/assets/…`.
`dist/` is git-ignored and built on every deploy.

Pages: `/posv2/` (POS) and `/posv2/admin.html` (administration).

## Environment variables
Build-time `VITE_*` values are listed in [`.env.example`](../.env.example); changing one needs a new deploy.
Function-side variables (never `VITE_`): `APPWRITE_ENDPOINT`, `APPWRITE_PROJECT_ID`, `APPWRITE_DATABASE_ID`,
`APPWRITE_COLLECTION_ID`, `APPWRITE_API_KEY`, `PUBLIC_SITE_URL`, and the SMTP settings used by `send-invoice`.

Netlify checklist for production: `VITE_AUTH_PROVIDER=appwrite`, `VITE_ADMIN_EMAILS` (or leave unset),
`VITE_ADMIN_FUNCTION_URL`, `VITE_SEND_INVOICE_URL`, EmailJS ids (`VITE_EJS_*`), and the server `APPWRITE_*`.

## Releasing
1. `npm test` and `npm run build` in `pos-react/`.
2. Push the branch, open a PR to `main`, merge → Netlify deploys.
3. After deploy open `/posv2/` and `/posv2/admin.html` and sign in.

## Troubleshooting
| Symptom | Cause / fix |
| --- | --- |
| *Refused to apply style … MIME type 'text/html'* | The browser has a cached page that points to an old hashed asset (`index-XXXX.css`) that no longer exists, so the redirect/404 returns HTML. Hard-reload (Cmd/Ctrl+Shift+R); clear site data / unregister the service worker if it persists. |
| Admin: "This account is not an administrator." | E-mail not on the allow-list — see the [administrator guide](admin-guide.md#signing-in). |
| Admin: "Document with the requested ID … could not be found." | A large stored document lost one of its chunks. `queryDocuments` now skips unreadable documents and logs `Skipping unreadable document <path> <id>` in the `pos-admin-data` function log; inspect that record. |
| Cloud sync stuck | Check the `appwrite-docs` function log and the Appwrite API key. |
| E-mail receipts not sent | EmailJS key/service/template in Settings or `VITE_EJS_*`; `platform.js` must load. |
| USB printer/scanner unavailable | Needs Chrome/Android, HTTPS and a user gesture (WebUSB / WebHID). |

## Caching
`/*.html` is cached briefly (`max-age=60`, edge `stale-while-revalidate`); hashed assets are immutable. Users
may need one reload after a deploy.

## Backups and data
Business data lives in Appwrite (document `users/{uid}/pos/main`) and in each device's IndexedDB. Catalogue
backups are kept under `users/{uid}/posCatalogBackups` when the admin function edits the catalogue.
