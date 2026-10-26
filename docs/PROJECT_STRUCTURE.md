# Project structure

Netlify publishes the repository root, so public page URLs map 1:1 to the files.
The CashFlow app (dashboards, sign-in, onboarding, team, payments, invoices and its admin console) lives in `cashflow/` and is served at `/cashflow/...`.
The landing page, POS entry pages, legal and story pages stay in the root. The old root addresses (for example `/signin.html`) redirect to `/cashflow/` in `netlify.toml`, so bookmarks and e-mailed links keep working.

## Public pages (repo root and `cashflow/`)
| Area | Files |
|---|---|
| Marketing | `index.html` (main landing page, Ceylonry POS), `cashflow-home.html` (internal CashFlow homepage, not linked or indexed), `privacy.html`, `terms.html`, `mrs-gamage-story.html`, `story-thank-you.html` |
| Sign-in and onboarding | `/cashflow/signin.html`, `/cashflow/onboarding.html`, `pos-onboarding.html`, `/cashflow/accept-invite.html`, `/cashflow/reset-password.html`, `/cashflow/upgrade.html`, `/cashflow/success.html`, `/cashflow/payable-return.html` |
| CashFlow plans | `/cashflow/solo.html`, `/cashflow/starter.html`, `/cashflow/starter_3.html` (legacy), `/cashflow/premium.html`, `/cashflow/growth.html`, `/cashflow/team.html` (team access and invites) |
| Admin | `/cashflow/ceylonry-admin.html` (CashFlow admin); POS administration is the React app at `/posv2/admin` |
| Invoices | `/cashflow/invoice-public.html` |
| PWA | `manifest.webmanifest`, `sw.js`, `app/` |

## Applications
- The original single-file POS (`pos-system/`) was retired and archived as `posv1.zip`; `/pos-system/*` redirects to the React POS.
- `pos-react/` - React POS (served at `/posv2`); see `pos-react/README.md`

## Shared
- `assets/` - browser scripts, styles and images shared by the root pages

## Backend
- `netlify/functions/` - serverless endpoints; `netlify/lib/` shared helpers (`appwrite.js`, `security.js`, `config-merge.js` for the admin portal's assist changes)
- `netlify/function-handlers/` - legacy `.cjs` handler copies

## Tooling and docs (not served)
- `docs/setup/` - email and payment environment setup
- `docs/reference/` - reference material
- `email-templates/` - EmailJS body templates
- `tests/` - root test suite; `scripts/` - build checks
