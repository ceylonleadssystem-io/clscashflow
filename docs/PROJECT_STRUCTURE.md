# Project structure

Netlify publishes the repository root, so public page URLs map 1:1 to the files in the root.
Moving a page would change its URL, so the pages stay put and are grouped here instead.

## Public pages (repo root)
| Area | Files |
|---|---|
| Marketing | `index.html`, `pos.html`, `privacy.html`, `terms.html`, `mrs-gamage-story.html`, `story-thank-you.html` |
| Sign-in and onboarding | `signin.html`, `onboarding.html`, `pos-onboarding.html`, `accept-invite.html`, `reset-password.html`, `upgrade.html`, `success.html`, `payable-return.html` |
| CashFlow plans | `solo.html`, `starter.html`, `starter_3.html` (legacy), `premium.html`, `growth.html`, `team.html` (team access and invites) |
| Admin | `ceylonry-admin.html` (CashFlow admin); POS administration is the React app at `/posv2/admin` |
| Invoices | `invoice-public.html` |
| PWA | `manifest.webmanifest`, `sw.js`, `app/` |

## Applications
- The original single-file POS (`pos-system/`) was retired and archived as `posv1.zip`; `/pos-system/*` redirects to the React POS.
- `pos-react/` - React POS (served at `/posv2`); see `pos-react/README.md`

## Shared
- `assets/` - browser scripts, styles and images shared by the root pages

## Backend
- `netlify/functions/` - serverless endpoints; `netlify/lib/` shared helpers (`appwrite.js`, `security.js`)
- `netlify/function-handlers/` - legacy `.cjs` handler copies

## Tooling and docs (not served)
- `docs/setup/` - email and payment environment setup
- `docs/reference/` - reference material
- `email-templates/` - EmailJS body templates
- `tests/` - root test suite; `scripts/` - build checks
