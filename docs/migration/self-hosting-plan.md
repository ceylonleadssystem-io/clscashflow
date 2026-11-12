# Migration plan: from Netlify and Appwrite to our own server (Peek Hosting VPS)

Status: plan, nothing migrated yet. Written 11 November 2026, updated the same day with the PostgreSQL decision and the modular backend structure.

## 1. Goal and decisions already made

| Decision | Choice |
| --- | --- |
| Rule | No Netlify and no Appwrite dependency at all when finished. Every function and every computation moves. |
| Hosting | Peek Hosting, Linux KVM VPS with root access (not shared, business, enterprise or reseller plans: they are cPanel plans with no root, no PostgreSQL and no long-running Node service). |
| Starting size | 4 vCore / 8 GB RAM / 100 GB / 3 TB (listed at $30 a month, $25 a month if billed yearly). Growth path in section 9. |
| Scale to plan for | 50 to 100 businesses now, up to 5,000 later. |
| Who runs it | The team, with Claude's help, so everything is scripted and documented. |
| Rewrite | A full rewrite of the backend is acceptable. We still do it in stages and run both systems side by side first, so customers are never cut off. |
| Stack | A purpose-built "PERN-style" stack: **React** for everything users see, **Node.js** for a single backend split into modules, **PostgreSQL** for data. The frontend only shows and collects; all server-side work lives in the backend. |
| Database | **PostgreSQL**, not MongoDB. Reasons in section 3.2. |
| E-mail | One backend `mail` module with our own templates (no template limit) sends everything, including customer receipts and invoices that the apps send through EmailJS today. It sends through an authenticated outside SMTP or transactional e-mail service, never directly from the VPS's own IP (Peek's spam warning). EmailJS is removed. |
| Budget | Balanced: daily backups kept off the server, good uptime, no standby server at the start. |

What is allowed to stay (these are not Netlify or Appwrite): an outside authenticated e-mail sending service (SMTP today, possibly a transactional e-mail provider later, see Phase 5), Stripe (the `payable-*` routes are switched off; `stripe-webhook` still exists and should be reviewed for removal), and the Anthropic API for Ceylo. **EmailJS is removed** (its two-template limit is the reason): all e-mail templates move into our own code.

## 2. What exists today (inventory)

### 2.1 What Netlify does for us

| Netlify feature | What we use it for | Replacement |
| --- | --- | --- |
| Static hosting | The POS app (`pos-react/dist`), the admin portal, the CashFlow pages, the landing pages | Caddy web server serving files from disk |
| Domain aliases | `pos.`, `admin.`, `automobile.`, `ogf.` and the root domain, plus legacy `/posv2` paths | Caddy site blocks |
| Redirects and rewrites | 66 rules in `netlify.toml` (host rewrites, 301 redirects, old paths) | Caddyfile |
| Header rules | 22 rules (cache, service worker scope `Service-Worker-Allowed`, security headers) | Caddyfile |
| Functions | 36 functions in `netlify/functions` (full list in Appendix A) | One Node.js service |
| Scheduled function | `ogf-push-scheduled`, every 15 minutes | A scheduler inside the Node service, or a systemd timer |
| HTTPS certificates, wildcard | Certificates for all the hostnames | Caddy (automatic Let's Encrypt) |
| DNS | Netlify DNS for `ceylonrylabs.io` | A new DNS host (Peek DNS or another free DNS host). Must keep the mail records, see 5.7 |
| Build and deploy | Build on push (`npm run build`) | A deploy script or a CI job that uploads the built files |

### 2.2 What Appwrite does for us

| Appwrite feature | How it is used | Where in the code |
| --- | --- | --- |
| Accounts and sessions | E-mail and password sign-in, sessions, 15 minute JWTs for the functions, password recovery, one-time handoff tokens between POS addresses, Google sign-in call in the compatibility layer | `pos-react/src/services/appwrite/appwriteCompat.js`, `auth.service.js`, `assets/platform.js`, the CashFlow pages |
| Users API (server side) | Create, list, delete and update users from the admin portal | `netlify/lib/appwrite.js` (`users`), `admin-data.js`, `pos-admin-data.js`, `pos-handoff.js` |
| Document database | One document store addressed by path, for example `users/{uid}/pos/main`. Three databases: main (`ceylonry`), POS (`pos`), Guest Manager (`gm`), plus an admin database. Large documents are split into compressed pieces to fit Appwrite limits | `netlify/lib/appwrite.js`, `netlify/functions/appwrite-docs.js` |
| File storage | The images bucket (product photos, logos, QR codes) | `netlify/functions/appwrite-files.js`, `pos-react/src/services/imageStorage.js` |
| Browser SDK | `assets/appwrite-sdk.js` (4,143 lines), loaded by every static page that signs in | The CashFlow pages, `pos-onboarding.html`, the reservation system |
| Server SDK | `node-appwrite` | `netlify/lib/appwrite.js` and the functions that use it |

Appwrite is **not** used for realtime updates (no realtime calls were found), which keeps this simpler.

### 2.3 The seams that make this manageable

The code already isolates Appwrite in three places. Appwrite is replaced at the first two seams, not function by function and page by page. The third is where the code is reorganised into modules:

1. **Server data seam**: `netlify/lib/appwrite.js` (330 lines). The functions call `getDocument`, `upsertDocument`, `queryDocuments`, `deleteDocument`, `listStamps`, `users.*` and a Firestore-style shim. We keep these names and put PostgreSQL behind them.
2. **Client seam**: `appwriteCompat.js` exposes an older `clsBackend` style (`auth()` and `firestore()`). The pages talk to that, not to Appwrite directly. We write a new implementation with the same shape and a new small browser file replaces `assets/appwrite-sdk.js`.
3. **Functions**: each is `handler(event)` returning `{ statusCode, headers, body }`, with its rules in the function body. These are moved into backend modules (section 3.1), with an alias table keeping the old URLs working during the transition.

## 3. Target architecture

```
Internet
   |
Caddy (HTTPS, redirects, static files)            <- replaces Netlify hosting, redirects, headers, certificates
   |-- /*.html, /pos-react/dist, /assets ...        files on disk
   |-- /.netlify/functions/*  (kept as /api/*)      -> Node service on 127.0.0.1
Node.js service (systemd, 2 processes)            <- replaces Netlify Functions
   |-- modules: auth, accounts, sync, files, billing, invoices, mail, kds, ogf, ... (section 3.1)
   |-- auth service (sign-in, sessions, JWT, recovery)   <- replaces Appwrite accounts
   |-- scheduler (OGF sales push every 15 minutes)
PostgreSQL 16                                     <- replaces Appwrite databases
   |-- documents, users, sessions, files metadata, signalling rows
Files on disk (or MinIO later)                    <- replaces Appwrite storage
Backups: nightly dump + continuous log shipping to storage off this server
```

Choices and reasons:

* **Caddy** over Nginx: automatic HTTPS and a short config. Wildcard certificates need a DNS plugin, so we use one certificate per hostname (only five hostnames), which needs no plugin.
* **Node.js, current LTS** (Node 24 at the time of writing; use whichever is the active LTS when the server is built). Node 20, which `package.json` currently allows, reached end of life in April 2026, so the backend must not be built on it. The functions are already Node, so their logic carries over.
* **PostgreSQL with JSONB**: documents keep their shape. A single `documents` table keyed by `(store, path)` keeps today's path model, so the POS app's save and load logic does not change. No more splitting documents into pieces.
* **Own auth, not a library of unknown size**: the needs are small (password sign-in, sessions, recovery, handoff tokens, admin creation). Passwords use argon2id.
* **Files on disk first**: simple, backed up with the rest. Move to MinIO or similar only if file volume grows.

### 3.1 Frontend and backend, kept separate

One repository, separate parts with clear rules about who may call whom:

```
apps/
  pos/        React POS app (today pos-react, index.html)
  admin/      React admin portal (today pos-react/src/admin-app, admin.html)
  site/       the static pages: landing, CashFlow pages, onboarding, reservation system
server/       Node.js backend (one service, many modules)
  src/
    modules/
      auth/        sign-in, sessions, tokens, recovery, one-time handoff, admin login
      accounts/    create, list, update, delete accounts; business type; trial and plan state
      sync/        the document store the POS and CashFlow apps save to (path based)
      files/       image upload and serving
      billing/     plans and prices, payment slips, subscription state, Stripe hook
      invoices/    invoice sharing and public invoice view
      mail/        every outgoing e-mail: welcome, invites, invoices, payslips, tickets, contact, and the customer receipts and invoice e-mails the apps send today through EmailJS. Templates live in mail/templates; a PostgreSQL outbox queues, retries and records every send
      kds/         Kitchen Display pairing
      diagnostics/ POS and admin diagnostics signalling
      ogf/         Restaurant (OGF) sales push and its 15 minute job
      ceylo/       the AI key store and the AI request
      support/     tickets, contact, hardware orders
      analytics/   visit tracking
      system/      health and readiness
    db/            connection, migrations, query helpers
    http/          routing, CORS, rate limiting, error handling
    jobs/          the scheduler
shared/       code both sides use: data shapes, validation, plan prices, business types, the route list
deploy/       server setup, Caddyfile, backup and restore scripts
```

Rules:

* The **frontends never talk to the database** and never contain server logic. They call the API and show the result. Offline storage on the device stays in the frontend, because the POS must work without a connection.
* Each **backend module** has its own routes, service (the rules), data access and tests, and may call another module only through that module's service. No module reads another module's tables directly.
* **`shared/`** holds what must never differ between the two sides: plan prices (today the same numbers sit in the pricing sheet, the billing widget and the slip checker), the business type list, the trial length, and the shape of each request and response. A test fails if the two sides drift apart.
* The backend and `shared/` are written in **TypeScript** (recommended: the request and response shapes are checked when building, which is the main protection against the two sides breaking each other). The existing JavaScript React code can move over without conversion and be converted gradually.
* One backend service, **not many small services**: simpler to run, deploy and debug for a small team on one server. Modules can be split out later if a part needs its own server.

### 3.2 Why PostgreSQL and not MongoDB

The usual "MERN" stack uses MongoDB. For this app PostgreSQL is the better fit:

| Point | MongoDB | PostgreSQL |
| --- | --- | --- |
| Large documents | A document is capped at 16 MB. The POS saves a whole business as one document (`users/{uid}/pos/main`, with sales history inside). A busy shop can pass 16 MB, so we would be splitting and compressing documents again, as we do in Appwrite today. | The JSON type has no practical cap at this size. Documents stay whole. |
| Table-shaped data | Possible, but totals, joins and exact money maths are weaker. | Accounts, plans, invoices, payments and admin reports are table-shaped and need exact totals and transactions. |
| One system | Would be a second database to run if we also want tables. | Holds both the documents and the tables in one place. |
| Running it on one VPS | A separate server process with its own memory appetite. | One process, well known, easy to back up (dump plus log shipping). |
| Licence | Server Side Public Licence (more restrictive for self-hosting). | Permissive open-source licence. |

The path-based document model is kept (`documents(store, path, data)`), so the POS and CashFlow apps keep saving the same way. Over time the heaviest parts of the business document (sales history) can be moved to their own tables so each sync sends only what changed. That is an optimisation for later, not a requirement for the move.

### 3.3 What changes compared with a straight copy of the functions

The first version of this plan wrapped the 36 Netlify functions in an adapter. This version builds proper modules instead:

* The old function URLs keep working during the transition through a small route-alias table, then the aliases are removed.
* The function bodies are moved into module services and rewritten against the new data layer, not kept as they are.
* It costs more time up front (see the timeline) and leaves no Netlify-shaped code behind.

## 4. Principles

1. **Nothing big-bang.** Build and test the new stack on a staging address while production stays on Netlify and Appwrite.
2. **Keep the interfaces.** Same function URLs (under `/api`), same document paths, same `clsBackend` shape. The less the apps change, the less can break.
3. **Everything scripted.** Server setup, deploys, backups and migration are scripts in the repo, so the server can be rebuilt from scratch.
4. **Rehearse the data move** at least twice on a copy before the real cutover.
5. **Keep a way back** for two to four weeks after cutover (Appwrite and Netlify stay, read-only, until the new system has proven itself).
6. **The POS is offline-first**, so a short maintenance window is acceptable: sales are kept on the device and sync when the server is back.

## 5. Phases

Effort figures are planning estimates for one developer working with Claude, not measured. They assume the Peek checks in Phase 0 come back fine.

### Phase 0: Confirm before buying (1 to 2 days)

Ask Peek, in writing, and write the answers into this document:

* ~~The exact data centre location.~~ **Answered:** USA, North Carolina. No nearer location was offered. Expect a round trip of roughly 250 to 350 ms from Sri Lanka (to be measured in Phase 9).
* ~~Backups and snapshots on the VPS.~~ **Answered:** Peek keeps **two snapshots, weekly**, each a complete image of the server (OS and everything). That is useful for rebuilding the machine, but a week of data is too much to lose, so it does **not** replace our own nightly and continuous off-server backups (section 8). Price: none stated (included).
* ~~IPv6 and Docker.~~ **Answered:** both reported as allowed ("yes those are allowed"). Docker is optional for us. Confirm the IPv6 address block when the VPS is created; it is not required.
* ~~Whether outbound mail ports are open.~~ **Answered:** no port restrictions. Peek's warning: the server's IP can be put on spam lists because of e-mail activity, so **secure the IP well for e-mail sending** (see the new risk row and Phase 2 items).
* ~~Whether root access is on the plan we choose, and which Linux versions are offered.~~ **Answered 11 November 2026 by Peek support (chat):** root access is provided, the VPS is installed within about 5 minutes, and the offered systems include **Ubuntu 26 and AlmaLinux 10** ("anything available"). Still to confirm in writing: that Ubuntu is **26.04 LTS**, and whether **24.04 LTS** is also available.
* What "99.99% uptime" means in their terms (refund? credit?).
* DNS: whether Peek can host DNS for `ceylonrylabs.io`, including wildcard and TXT records. **No answer yet** (the message was read, not answered). Recommendation: keep DNS at a provider separate from the server host, so DNS stays reachable and can be repointed if the server is down. Ask only if we want Peek to host it.

Also decide on our side:

* **Where is the domain registered and who controls DNS today?** (Netlify DNS is in use. Moving it needs the registrar login.)
* **Is Google sign-in used by customers?** The compatibility layer has a Google call. If it is used, we need to build it (Phase 4).
* **Can Appwrite give us the password hashes?** Appwrite's server API normally returns each user's hash and hash settings. Confirm on one test user. If not, every customer resets their password once.
* **Measure the data**: number of users, number and total size of documents, number and size of image files, in each Appwrite database.
* **Order the VPS with the 30-day money-back guarantee**, and run the proof of concept (Phase 1 and a load test) inside that window.

Exit: written answers from Peek, data measurements, the DNS and Google sign-in decisions.

### Phase 1: Server and tooling (2 to 3 days)

**Operating system decision: Ubuntu 26.04 LTS.** Peek offers Ubuntu 26 and AlmaLinux 10. Both are suitable; Ubuntu is the better match because:

* It is a long-term-support release (standard support to 2031), so we build the server once and keep it.
* Caddy, PostgreSQL and Node.js all publish official packages for it, and most guides and tools assume it, which helps when Claude and the team write the setup scripts.
* AlmaLinux 10 is a good choice for teams that already use Red Hat tools. It adds SELinux and `dnf` habits we would have to learn for no gain here.

If Peek confirms that 24.04 LTS (supported to 2029) is also offered, it is the more settled choice and equally fine. Pick the newest LTS only if the scripts are tested on it in staging first. Whichever is chosen, the setup scripts in `deploy/` are the record, so the OS can be changed by rebuilding.

* Order the 4 vCore / 8 GB VPS with **Ubuntu 26.04 LTS** (decision below). Create a non-root admin user, SSH keys only, root login off, firewall (only 22, 80, 443), fail2ban, automatic security updates, time sync.
* Install Caddy, the current PostgreSQL major version from the official PostgreSQL repository (so we control the version and upgrades), and the current Node.js LTS from the NodeSource or official packages, and set up systemd services.
* Create `staging.ceylonrylabs.io` (and `*-staging` hostnames) pointing at the server.
* Write the setup as a script in `deploy/` (idempotent), so the server can be rebuilt.
* Set up backups from day one (see section 8) and test one restore.
* Uptime monitoring from outside, and disk, memory and database alerts.

Exit: staging site reachable over HTTPS, a backup restored successfully.

### Phase 2: Repository structure and backend modules (8 to 12 days)

* **Restructure the repository** into the layout in section 3.1: create `server/` and `shared/` (move `netlify/` to `server/` with git history kept), leave the frontends where they are for now. The frontend split into `apps/` happens in Phase 6.
* **Backend skeleton**: a Node.js service in TypeScript with an HTTP framework (Fastify or Express), request validation, one error format, CORS from `shared/`, and structured logs. Routes are under `/api/<module>/...`.
* **Route aliases**: while the apps still call `/.netlify/functions/<name>`, a table maps each old name to its new route. The apps' function URL settings (`pos-react/src/config/env.js`) switch to `/api` in Phase 6, and the aliases are then deleted.
* **Port the 36 functions into the modules** in Appendix A. For each: move the rules into the module service, write the route, port its existing test, and check the response matches the old one. Start with the ones that do not touch Appwrite (mail, contact, health, invoice mail, payslip), then the data-bound ones as Phases 3 and 4 land.
* **Replace Netlify-only pieces**: the `CONTEXT`, `URL`, `DEPLOY_URL`, `NETLIFY_DEV` variables in `security.js` become explicit settings, and the schedule moves to `server/src/jobs`.
* **Environment variables**: a root-only file, validated at start-up (the service refuses to start if one is missing). Inventory is in Appendix B.
* **Mail module** (see Phase 5 for the design): routes for receipts and invoices, the template engine, the outbox and the provider settings.
* **Mail safety**: all outgoing mail goes through one `mail` module that sends only through the authenticated external SMTP service, with fixed recipients on public forms, a per-IP and a per-address limit, and a daily cap. No function sends mail to an address a visitor typed unless that is the purpose (invites, receipts) and it is rate limited.
* **Rate limiting** is in memory today. With one long-running process it works; move the counters to PostgreSQL before running a second process.
* **Health and ready** endpoints check PostgreSQL instead of Appwrite.
* **Shared package**: start `shared/` with the plan prices, trial length, business types and the request and response shapes of each module. Add the parity tests (for example the price test already in `tests/pos-prices.test.js`) against it.

Exit: all functions that do not need Appwrite run as modules on staging with their tests passing, the alias table covers every function, and `shared/` is imported by the server.

### Phase 3: Data layer (5 to 8 days)

Design (all in PostgreSQL):

* `documents(store, path, data jsonb, owner_uid, created_at, updated_at, deleted_at)`, primary key `(store, path)`. `store` is `main`, `pos`, `gm` or `admin`. This reproduces today's routing (`isPosPath`, `isGmPath`, `storeFor`).
* A small table for the signalling rows (`kds-store.js`, `diagnostics-store.js`) with an expiry time, replacing the "setup collection" scripts.
* Indexes on `(store, path text_pattern_ops)` for prefix listing, and on `owner_uid`.

Work:

* New `server/src/db` and the `sync` module implementing the functions the code already calls: `getDocument`, `getDocumentStamp`, `listStamps`, `queryDocuments`, `upsertDocument`, `deleteDocument`, `newId`, and the Firestore-style shim (`appwriteAdmin().firestore()`) that `admin-data.js` and `pos-admin-data.js` use. Equality-only filters stay equality-only.
* Keep the permission rules `canRead`, `canWrite`, `sanitizeProfileWrite`. They are about who may touch which path, not about Appwrite.
* Drop the chunking and compression (`APPWRITE_COMPRESS`, the corrupt-chunk repair `isCorrupt`) and the POS-to-own-database fallback (`APPWRITE_POS_FALLBACK`). Real rows have no size limit problem.
* Fix a bug that moves with the shim: `admin-data.js` pages through `listUsers(1000, pageToken)`, but the shim's `listUsers` takes only a maximum and never returns a page token, so the CashFlow admin user list stops at 1,000 users. The new user listing must page properly. This matters at 5,000 accounts.
* Tests: the existing node tests mock the Appwrite layer. Point them at a test PostgreSQL (a throwaway database per test run) and keep their assertions.

Exit: the function tests that touch documents pass against PostgreSQL.

### Phase 4: Authentication (6 to 10 days)

Build in the Node service:

* **Tables**: `users(id, email unique lowercased, password_hash, name, labels, status, created_at, last_sign_in_at)`, `sessions(id, user_id, refresh_hash, expires_at, device, ip)`, `one_time_tokens(token_hash, user_id, purpose, expires_at)`.
* **Sign-in**: e-mail and password (argon2id), rate limit and lockout, returns a 15 minute JWT plus a refresh token in an HttpOnly cookie. This replaces `createEmailPasswordSession`, `createJWT`, `account.get` and `deleteSession`. It also removes today's limitation that Appwrite allows one active session per client (the "BUG 013" workaround in `appwriteCompat.js`).
* **Verification of tokens in the functions**: replace `getUserFromEvent` (which calls Appwrite) with local JWT verification. This is faster and needs no outside call per request.
* **Password recovery**: signed one-time link sent by the existing SMTP code to `/cashflow/reset-password.html` (the page already exists).
* **Account creation**: sign-up from `pos-onboarding.html` and the admin portal "New POS account".
* **Admin functions**: the places that use Appwrite's Users API: create, list (with paging), delete, update, set labels, and the admin sign-in in `admin-signin.js` (which today uses an Appwrite user). The separate POS admin login (`pos-admin-login.js`, scrypt) already works without Appwrite's users.
* **Handoff between POS addresses**: `pos-handoff.js` uses `users.createToken` and the client uses `createSession(userId, secret)`. Replace with the one-time token table.
* **Google sign-in**: only if Phase 0 says it is in use.
* **Existing passwords**: migrate the hashes with their algorithm settings, and let the sign-in code verify the old format and re-hash with argon2id at first sign-in. If the hashes cannot be exported, send everyone a reset link at cutover.
* Security review of this phase specifically (token lifetime, cookie flags, brute force, enumeration, recovery abuse).

Exit: sign-in, refresh, sign-out, recovery, create user, delete user and the handoff all pass tests, and an independent review has no open findings.

### Phase 5: Files and e-mail (5 to 7 days)

#### 5a. Files

* Store images under a data directory, served by Caddy or the Node service. Keep `appwrite-files.js` behaviour (upload, size limit, type check), renamed `files.js`.
* Image links stored inside documents point at Appwrite URLs today. The data migration (Phase 8) rewrites them to the new address. `pos-react/src/services/imageStorage.js` and its migration test are updated.
* Include the images folder in backups.

#### 5b. E-mail (replaces EmailJS)

Today the POS app sends customer receipts and Automobile invoice e-mails from the browser through EmailJS (`services/platform.service.js`, `orderEmail.js`), the billing widget in `assets/platform.js` sends document and payment-receipt e-mails the same way, and `emailjs-reminder` is a small function around it. EmailJS limits us to two templates. Everything else already sends from the Node functions with SMTP and has no such limit.

* **One mail module** sends all e-mail. The apps no longer talk to any e-mail service: they call authenticated routes such as `POST /api/mail/receipt` and `POST /api/mail/invoice` with the sale or invoice reference, and the server builds and sends the message.
* **Templates in our code**: `server/src/modules/mail/templates`, one file per e-mail (receipt, order, invoice, quote, payslip, welcome, invite, reminder, ticket, contact). Unlimited, versioned in git, tested. The existing `email-templates/emailjs-invoice-template.html` and the HTML now built in `orderEmail.js` become the first templates. A test renders every template with sample data and checks the required fields, links and escaping.
* **Sender identity**: sent from a Ceylonry address on our domain (so SPF, DKIM and DMARC pass), with the **shop's own address as Reply-To** and the shop's name in the display name, so customer replies reach the business. Confirm with the team whether shops expect the mail to appear to come from them (see open questions).
* **Outbox in PostgreSQL**: every message is saved first, then sent by a worker, with retries and a final status. This replaces `receiptSentAt` guesswork: the POS can show "sent", "failed" or "queued". A shop with no connection simply queues the request on the device and the POS sends it when back online.
* **Limits and abuse control**: a per-business daily cap, a per-IP limit on public routes, recipients only where the route's purpose allows it (the customer of that sale or invoice), and no free-text recipient on public forms. Retained from the mail-safety rules in Phase 2.
* **Provider**: the module sends through authenticated SMTP, so the provider can be changed by settings only. Start with the current SMTP service. Before the planned growth (hundreds of shops each sending receipts), move to a transactional e-mail service (for example Amazon SES, Postmark or Brevo): it is inexpensive, built for reputation and bounce handling, and the same SMTP code works. Decide with the Phase 9 volume numbers.
* **Bounces and complaints**: record them against the address, stop sending to addresses that bounce hard, and show the shop a clear message.
* **DNS**: SPF, DKIM and DMARC records for the chosen provider added **before** cutover (this also protects the move of DNS, see the mail risk).
* **Staging safety**: staging sends only to a catch-all test mailbox, never to real customer addresses, so copied production data cannot e-mail customers by mistake.
* **Tests**: the existing mail function tests are ported; add tests for the outbox (queued, sent, failed, retried), the daily cap, the Reply-To rule, and that no route accepts an arbitrary recipient.

### Phase 6: Apps (8 to 12 days)

* **Split the frontend** into `apps/pos`, `apps/admin` and `apps/site` as in section 3.1 (the admin portal is already a separate entry, `admin.html`, and a separate folder, `admin-app`). Code both apps use (the data layer, the design styles, sign-in) goes into one shared frontend package so there are no copies. Do this before the backend client work so it is done once.
* **POS app** (`apps/pos`, today `pos-react`): add a new backend implementation of the compatibility layer (`services/appwrite/appwriteCompat.js`, `auth.service.js`, `cloud.service.js`, `imageStorage.js`, `platform.service.js`). Rename it away from "Appwrite" (the folder, the `isAppwrite()` helper, the `VITE_AUTH_PROVIDER=appwrite` value) at the end of this phase. Keep the local test provider.
* **Browser file**: a new small `assets/backend-client.js` (a few hundred lines) that provides `window.clsBackend` with the same methods the pages use, replacing the 4,143 line `assets/appwrite-sdk.js`.
* **Static pages that sign in**: the CashFlow pages (`signin`, `onboarding`, `solo`, `starter`, `starter_3`, `growth`, `premium`, `team`, `accept-invite`, `reset-password`, `success`, `upgrade`, `payable-return`, `ceylonry-admin`), `pos-onboarding.html`, `assets/platform.js` (3,823 lines, 28 backend calls), and the reservation system. If the new client keeps the same method names, these need script-tag and small error-message changes only. Plan time for testing each page by hand, since they are large files.
* **E-mail from the apps**: `sendOrderEmail` in `platform.service.js` and the document and receipt e-mail calls in `assets/platform.js` (`clsSendDocumentEmail`, `clsSendPaymentReceiptEmail`) call the new mail routes. Remove the EmailJS script loading, the `VITE_EJS_*` settings and the hard-coded EmailJS key, service and template ids in `config/env.js`.
* **Remove Appwrite wording** in messages (for example the rate-limit message in `auth.service.js`).
* **Admin portal** (`pos-react/src/admin-app`): points at the new function URLs through the existing config.
* **Service worker**: unchanged, but test that the cache is replaced cleanly on the new origin.

Exit: the full test suites pass, and a manual run-through of each page works on staging.

### Phase 7: Static hosting and deploy (2 to 3 days)

* Translate `netlify.toml` into a Caddyfile: the five host rewrites to `index.html` or `admin.html`, the 301s from `/posv2` and old paths, the cache headers, `Service-Worker-Allowed`, and security headers. Write a test that parses the old `netlify.toml` and checks each rule against the Caddyfile (the existing `tests/pos-address.test.js` checks are a starting point).
* Build step: the same `npm run build`, run locally or in CI, then upload `pos-react/dist` and the static pages with a script. Keep the previous release folder so a deploy can be rolled back in seconds (a `releases/` folder and a `current` symlink).
* Certificates: one per hostname, automatic.

### Phase 8: Data migration tooling (4 to 6 days)

Write `scripts/migrate-from-appwrite.mjs` (temporary, deleted at the end):

1. **Export users** from Appwrite (with password hashes if possible, labels, status, created and last-sign-in dates).
2. **Export documents** from all four databases, reassemble the split pieces, decompress, and write full documents.
3. **Export files** from the images bucket and rewrite image links inside documents.
4. **Import** into PostgreSQL in one transaction per store, idempotent, so it can be re-run.
5. **Verify**: counts per store and per business, a checksum per document, and a sample compare of 100 random businesses through the apps.
6. **Delta run**: a fast second pass that copies only what changed since the first run (using the `updatedAt` stamps), used on cutover night.

Rehearse the full run at least twice against a copy and time it. The time of the final delta run decides the length of the maintenance window.

### Phase 9: Proving it (5 to 8 days)

* **Staging with real data**: a copy of production data on staging, with internal accounts.
* **Load test**: simulate sync traffic. Start at 100 businesses, then 500, 1,000, 5,000 simulated businesses with realistic patterns (idle most of the time, bursts at opening and closing). Record request rate, database CPU, memory and response times. This replaces guessing with numbers and tells us when to upgrade (section 9).
* **Failure drills**: restart the server, kill the database, fill the disk (alert fires), restore from backup onto a fresh server and time it.
* **Security**: dependency audit, a port scan, headers, a review of the auth phase and of each function that takes input.
* **Parity check**: every Netlify function has a matching route and a passing test (Appendix A is the checklist).

Exit: go/no-go checklist (section 7) is all ticked.

### Phase 10: Cutover (1 to 2 days of work, plus preparation)

Preparation (a week before):

* Lower the DNS TTL to 5 minutes.
* Tell customers about a short planned maintenance window (the POS keeps selling offline). Tell them they must sign in once again.
* Final rehearsal with the real delta run.

Cutover night (a quiet time in Sri Lanka):

1. Put the old site into maintenance (Netlify and Appwrite stay up but writes are blocked by a flag in the functions).
2. Run the final delta migration and the verification.
3. Switch DNS to the new server. All hostnames at once.
4. Smoke tests: sign in on each address, open a POS, make a test sale, sync, admin portal create and delete test account, send an e-mail, check the 15 minute schedule fired.
5. Open to customers. Watch logs and error rates for the first day.

Rollback: if the smoke tests fail before opening, point DNS back and lift maintenance (data on the old side is untouched). After opening, rollback means losing the writes made on the new side, so decide quickly, within the first hours.

After cutover: keep Netlify and Appwrite read-only for 2 to 4 weeks as the safety net.

### Phase 11: Decommission and clean-up (2 days)

* After the safety period: take a final full export of Appwrite (users, documents, files) and keep it in the backup storage.
* Delete the Appwrite project, remove the site from Netlify, and cancel the plans.
* In the repository: remove `node-appwrite`, `appwrite` and `node-fetch-native-with-agent` from `package.json`; delete `assets/appwrite-sdk.js`, `netlify.toml`, the route-alias table, `scripts/setup-*-db.mjs`, `scripts/migrate-pos-to-own-database.js`, and the migration script; remove Netlify and Appwrite from the docs, the README files, the comments and the tests that mention them; remove the Appwrite and Netlify origins from `security.js`.
* Remove EmailJS: the `emailjs-reminder` function, `email-templates/emailjs-invoice-template.html` once its content is in the new templates, the `EMAILJS_*` variables, the `ejs*` settings in `pos-react/src/config/env.js`, and the tests that mention it. Close the EmailJS account.
* Run `graphify update .`.
* Final search of the repository for the words `appwrite`, `netlify` and `.netlify`, and for the Appwrite project id and endpoint. Zero results is the finish line.

## 6. Risks and how they are handled

| Risk | Effect | Handling |
| --- | --- | --- |
| Peek's server is in the USA (North Carolina, confirmed) | Slower sync (round trip likely 250 to 350 ms) | POS is offline-first and syncs in the background. Measure in Phase 9. If it hurts, ask Peek about other locations or consider a second host later. |
| Password hashes cannot be exported | Every customer must reset their password | Detect in Phase 0. Prepare the reset e-mail and tell customers in advance. |
| Data corruption in the move | Lost or damaged business data | Two or more rehearsals, per-document checksums, the old system kept untouched and read-only for weeks, a full export archived. |
| Our own auth has a flaw | Account takeover | Standard well-reviewed parts (argon2id, JWT), rate limits, independent security review in Phase 4 and 9. |
| Mail stops working after DNS moves | Lost invoices, welcome and reset e-mails | Copy every MX, SPF, DKIM and DMARC record exactly before changing the nameservers. Send test mail from each function after the move. |
| The server's IP gets on spam lists because of e-mail activity (Peek's warning) | Invoices, welcome and reset e-mails land in spam or are rejected, and the IP may be blocked | Do not send mail directly from the VPS: keep sending through the existing authenticated SMTP service, so the VPS IP never appears as the sender. Keep SPF, DKIM and DMARC correct on the domain. Make sure no form (contact, support ticket, invites, hardware order) can be used to send mail to addresses the visitor chooses, and keep the per-IP rate limits and add a spam check on the public forms. If we ever send from the VPS: reverse DNS (PTR) set by Peek, a dedicated sender address, bounce and complaint handling, a daily send limit, and monitoring of IP reputation. |
| Single server failure | Downtime | Nightly dump plus continuous log shipping off the server, a tested restore script, and a short restore runbook (target: back within about an hour). Add a standby when the business needs it (section 9). |
| Disk full or database growth | Outage | Disk alerts at 70 percent and 85 percent, retention rules, move files to a bigger disk or MinIO. |
| Appwrite and Netlify behave differently from our assumptions | Surprises late in the project | Phase 3 and 4 tests are written against current behaviour first, and the old system stays alive during the whole build. |
| Customers cached the old app | Mix of old and new code after cutover | Same hostnames and a new service worker cache name. The first load after cutover fetches the new build. Test in Phase 9. |
| E-mail volume or reputation problems after receipts move to the backend | Receipts and invoices delayed, in spam, or rejected | Outbox with retries, per-business caps, bounce handling, SPF/DKIM/DMARC before cutover, and a move to a transactional e-mail provider when volume grows. Monitor delivery rate from the first day. |
| The modular rewrite takes longer than wrapping the old functions | Later cutover | Port module by module with the alias table, so each finished module is usable and tested on its own. The timeline below already includes it. |
| Peek page details are inconsistent (hardware, backups, locations) | Wrong sizing | Phase 0 written confirmation and the 30-day money-back window. |

## 7. Go/no-go checklist for cutover

- [ ] All 36 functions have a route and a passing test (Appendix A).
- [ ] Sign-in, recovery, handoff, admin create and delete all pass on staging with real data.
- [ ] Two full data rehearsals matched on counts and checksums.
- [ ] A backup was restored on a clean server and the apps worked on it.
- [ ] Load test passed at the planned size with a safety margin of at least 2 times.
- [ ] Mail records verified and test mail received from every mail-sending function.
- [ ] Rollback steps rehearsed and written down.
- [ ] Customers informed and a support person on call during the window.
- [ ] DNS TTL lowered at least 24 hours earlier.

## 8. Operations after the move

* **Backups**: Peek's two weekly full-server snapshots are kept as an extra way to rebuild the machine, but they are not the backup plan. Ours is: nightly `pg_dump` kept 14 days, continuous write-ahead log shipping for point-in-time recovery, the images folder synced nightly. Stored **off** this server (a different provider or a second small server), encrypted. A restore drill every month, with the time recorded.
* **Monitoring**: external uptime check on each hostname and on `/api/health`, alerts for disk, memory, CPU, database connections, failed schedule runs and error rate. Logs rotated and kept 30 days.
* **Updates**: automatic security updates for the OS, a monthly window for Node, PostgreSQL and Caddy.
* **Secrets**: a root-only environment file and a documented rotation procedure for the JWT signing key, SMTP and API keys.
* **Runbooks** in `docs/operations/`: restart, restore, deploy, roll back a deploy, rotate secrets, add a server.

## 9. Capacity and the path to 5,000 businesses

These sizes are estimates to be confirmed by the Phase 9 load test.

| Stage | Businesses | Suggested Peek plan | Monthly list price | Notes |
| --- | --- | --- | --- | --- |
| Start | 50 to 100 | VPS 4 vCore / 8 GB / 100 GB | $30 ($25 yearly) | Everything on one server, plus off-server backup storage |
| Growing | up to about 500 | VPS 8 vCore / 16 GB / 200 GB | $55 | Add connection pooling (PgBouncer) |
| Large | about 500 to 2,000 | Two VPS: app and database | about $55 + $55 to $75 | Database on its own server, tuned, with a replica for backups |
| Very large | 2,000 to 5,000 | Dedicated server for the database (listed plans from $130 to $280) plus the VPS for the app | $185 and up | Uses the dedicated plan's SSD storage and RAM. Check current hardware (some listed CPUs are old). Setup takes 24 to 48 hours. |

Things that make the system lighter as it grows: the POS already syncs only changed data and backs off when idle, documents are served by path (cheap lookups), and static files are cached by browsers and by Caddy.

Total monthly cost at the start: the VPS ($25 to $30) plus off-server backup storage (a few dollars), with DNS, certificates and mail unchanged. This is below the combined cost of a paid Netlify and Appwrite setup once usage grows, and the Netlify functions returned a usage-exceeded error when checked on 10 November 2026.

## 10. Rough timeline

Planning estimate, one developer with Claude, phases partly overlapping:

| Weeks | Work |
| --- | --- |
| 1 | Phase 0 and 1 (confirm with Peek, server up, backups working) |
| 2 to 4 | Phase 2 (repository structure, backend modules), with Phase 3 starting alongside |
| 3 to 5 | Phase 3 (PostgreSQL data layer) |
| 4 to 7 | Phases 4 and 5 (authentication, files and e-mail) |
| 6 to 9 | Phases 6 and 7 (frontend split, apps on the new backend, static hosting) |
| 8 to 10 | Phase 8 (migration tooling and rehearsals) |
| 10 to 11 | Phase 9 (load test, drills, security, parity) |
| 12 | Phase 10 (cutover) |
| 14 to 16 | Phase 11 (decommission, after the safety period) |

About 12 to 13 weeks to cutover and about 16 to 17 weeks to being fully free of both services. The module rewrite, authentication, the apps phase and the data rehearsals are the parts most likely to run over.

## 11. Open questions

1. Peek's remaining answers: DNS hosting, what the 99.99% uptime means (refund or credit), and the IPv6 block.
2. Where is the domain registered, and who holds the login?
3. Is Google sign-in in real use?
4. Can Appwrite export password hashes for all users?
5. How much data is there today (users, documents, files)?
6. Which outside backup storage will we use (a second provider or a second small server)?
7. Which Sri Lankan time window is quietest for the cutover?
8. Who is the second person for security review and on-call during cutover?
9. TypeScript for the backend and `shared/` is recommended. Confirm, or choose plain JavaScript (the types are then not checked when building).
10. E-mail: keep the current SMTP service for the start, or move straight to a transactional provider (SES, Postmark or Brevo)? Expected receipts per day decides it.
11. Sender policy: should receipts appear to come from a Ceylonry address with the shop as Reply-To (recommended), or must the shop's own address be the sender (needs each shop to verify its domain)?

## Appendix A: the 36 functions, where each goes, and what it depends on

Mark each as ported and tested during Phases 2 to 4. "Data" means it reads or writes documents or users through `netlify/lib/appwrite.js`; "Mail" means it sends e-mail through SMTP (only the environment variables change).

| Function | Target module | Data | Mail | Notes |
| --- | --- | --- | --- | --- |
| account-danger-zone | accounts | yes | | Backs up then deletes an account's data |
| admin-data | accounts and billing (CashFlow admin) | yes | yes | Plans, invoices, users, billing. Uses the Firestore-style shim and user paging (fix the 1,000 user cap) |
| admin-signin | auth | yes | | Admin sign-in through an Appwrite user. Move to own auth |
| appwrite-docs | sync | yes | | The document API the apps call |
| appwrite-files | files | yes | | Image upload, disk storage |
| ceylo-ai-key | ceylo | yes | | Stores each business's AI key (encrypted with `CEYLO_KEY_SECRET`) |
| ceylo-ask | ceylo | yes | | Calls the Anthropic API |
| emailjs-reminder | mail | | | Replaced by a reminder template in the mail module. EmailJS is removed |
| growth-partner-code | support | yes | | Partner codes |
| hardware-order | support | | yes | |
| health | system | | | Check PostgreSQL |
| invoice-share | invoices | yes | | Public invoice links |
| kds-pair | kds | yes | | Kitchen Display pairing rows with expiry |
| ogf-push | ogf | yes | | Sales push settings and manual send |
| ogf-push-scheduled | ogf (job) | yes | | Runs every 15 minutes: move to `jobs` |
| payable-create-checkout | billing | | | Switched off (503): drop, do not port |
| payable-status | billing | | | Switched off (410): drop |
| payable-webhook | billing | | | Switched off (410): drop |
| pos-admin-data | accounts | yes | | POS admin portal: accounts, create, delete, business type, menu import |
| pos-admin-diagnostics | diagnostics | yes | | Diagnostics signalling |
| pos-admin-login | auth | yes | | Admin login (scrypt, already independent of Appwrite users) |
| pos-diagnostics | diagnostics | yes | | Diagnostics signalling |
| pos-handoff | auth | yes | | One-time token between POS addresses. Rebuild on the token table |
| pos-onboarding-email | accounts and mail | yes | yes | |
| public-invoice | invoices | yes | | Public invoice view |
| ready | system | yes | | Admin-only readiness check, PostgreSQL |
| send-contact | mail | | yes | |
| send-invite | mail | | yes | |
| send-invoice | mail | | yes | |
| send-payslip | mail | | yes | |
| send-story-submission | mail | yes | yes | |
| send-welcome | mail | | yes | CashFlow welcome e-mail |
| stripe-webhook | billing | yes | | Stripe payment hook. Decide whether it is still used before porting |
| submit-subscription-receipt | billing | yes | yes | Checks payment slips against the plan prices (uses `shared/` prices) |
| submit-ticket | support | yes | yes | Support tickets |
| track-visit | analytics | yes | | Visit counter |

## Appendix B: environment variables to carry over

* **Mail**: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `SMTP_REPLY_TO`, `POS_SMTP_FROM`, `POS_INTERNAL_SMTP_FROM`, `SUPPORT_TO`, `STORY_SUBMISSION_TO`, `BUSINESS_OWNER_EMAIL`
* **Site**: `PUBLIC_SITE_URL`, `EXTRA_ALLOWED_ORIGINS`
* **Security**: `POS_ADMIN_TOKEN_SECRET`, `ADMIN_PASSWORD_SHA256`, `ADMIN_EMAIL`, `CEYLO_KEY_SECRET`
* **Outside services that stay**: `ANTHROPIC_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
* **To be removed**: the `EMAILJS_*` variables (5 values), every `APPWRITE_*` variable (endpoint, project, API key, database and collection ids, routing and compression switches) and the Netlify ones (`URL`, `DEPLOY_URL`, `DEPLOY_PRIME_URL`, `CONTEXT`, `NETLIFY_DEV`)
* **New**: `MAIL_DAILY_CAP_PER_BUSINESS`, `MAIL_FROM_ADDRESS`, `MAIL_STAGING_CATCHALL`, `DATABASE_URL`, `JWT_SIGNING_KEY`, `DATA_DIR` (files), `BACKUP_*` settings
