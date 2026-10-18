# Plan: move from Netlify + Appwrite Cloud to a VPS

Status: plan only, nothing implemented. Written 2026-10-18.

## What the repo looks like today
- **Netlify:** about 40 function files in `netlify/functions`, which call 10 shared helpers in `netlify/lib`. `netlify.toml` (474 lines) holds the redirects and security headers. The build runs `npm run build`, which builds `pos-react`. Functions read Netlify-specific env vars (`URL`, `DEPLOY_URL`, `CONTEXT`). The only scheduled work mentioned is a comment about billing enforcement in `admin-data.js`.
- **Appwrite:** the server side goes through one file, `netlify/lib/appwrite.js` (API key, three databases: main, `pos`, `gm`, plus an images bucket). The browser pages also use the Appwrite SDK (`assets/appwrite-compat.js`), which is where login happens.
- **Other services** do not depend on Netlify: SMTP email, Stripe, Payable, EmailJS. They only need keys and webhook URLs updated.

## Phase 0: decisions (needed before starting)
1. Keep Appwrite, self-hosted on the VPS (recommended), or replace it. Replacing it means rewriting the data layer and login: treat as a separate project.
2. Provider and size. Self-hosted Appwrite needs at least 2 vCPU / 4 GB RAM. Start at 4 GB with daily backups.
3. Cutover tolerance: can the POS be read-only for about 30 minutes during the data move?

## Phase 1: server setup (no code changes)
- Create the VPS: firewall, SSH keys only, automatic security updates, Docker.
- Run Caddy for automatic HTTPS in front of everything.
- Self-host Appwrite with Docker Compose. Recreate the project, the three databases, the images bucket and the API key (`scripts/setup-admin-db.mjs` and `scripts/setup-gm-db.mjs` already exist).

## Phase 2: replace Netlify (small code change)
- **Functions:** one Node server that loads every `netlify/functions` file as a route at `/.netlify/functions/<name>`, so the browser code stays untouched. Replace the Netlify-only env vars with `PUBLIC_SITE_URL`.
- **Static files:** Caddy serves the root pages and the built `pos-react/dist`.
- **Redirects and headers:** translate `netlify.toml` into Caddy rules.
- **Process:** systemd or a Docker container with automatic restart; all env vars in a server-only `.env`.
- **Deploys:** a GitHub Action runs `npm run build`, then rsync/SSH to the server and restarts the service.

## Phase 3: move the data
- Export from Appwrite Cloud, import into the self-hosted instance (use `scripts/migrate-pos-to-own-database.js` as a starting pattern).
- Take a full backup first. Dry-run into a staging copy and compare row counts before the real move.
- **Check early:** browser login accounts. Appwrite Cloud users cannot always be exported with password hashes. If they cannot, users will need a password reset.

## Phase 4: cutover
1. Run the whole stack on a staging subdomain and test: sign-in, POS sale, KDS pairing, invoices, Stripe and Payable webhooks, emails, hardware orders.
2. Lower the DNS TTL a day before.
3. Freeze writes, final data sync, switch DNS.
4. Update webhook URLs in Stripe and Payable.
5. Keep Netlify and Appwrite Cloud running about two weeks as rollback.

## Phase 5: running it
- Nightly Appwrite and database backups copied off the server, with a restore test.
- Uptime monitoring on the existing health endpoint, log rotation.

## Risks
- Login hashes (Phase 3) are the biggest unknown.
- Payment webhooks must stay reachable at the new URL throughout.
- One server is a single point of failure: backups and a restore drill are essential.
- Email deliverability (SPF/DKIM) should not change since SMTP stays the same.

## Rough effort
2–4 days for Phases 1–2 and staging tests; 1–2 days for the data move and cutover, depending on the login question.

## Open questions
- Self-hosted Appwrite, or replace it?
- Which VPS provider?
- Acceptable read-only window at cutover?
