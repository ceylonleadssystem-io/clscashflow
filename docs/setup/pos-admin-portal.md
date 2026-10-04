# POS administration portal

URL: `https://<main domain>/posv2/admin` (also reachable at `/posv2/admin.html`). Never framed, cached or indexed.

## How it is separated from clients
- Administrator accounts live in their own Appwrite database, `pos_admin` (`APPWRITE_ADMIN_DATABASE_ID` to override), not in the client database (`ceylonry` / `app_documents`) and not in Appwrite Auth. Admins and POS clients share no users, sessions or collections.
- Collections: `admins` (email, name, passwordHash, active, failedAttempts, lockedUntil, lastLoginAt) and `audit_log` (sign-ins, failed attempts, every data-changing admin action). Neither has client permissions: only the server API key can read or write them.
- Sign-in: `netlify/functions/pos-admin-login.js`. Email must end with `@ceylonrylabs.io` (enforced on the server), the account must exist and be `active`, password is verified against a scrypt hash, 5 wrong passwords lock the account for 15 minutes, and there is an additional per-IP rate limit.
- Session: an 8 hour HS256 token held in `sessionStorage`. `pos-admin-data` re-reads the admin record on every request, so setting `active = false` revokes access immediately.
- There is no sign-up, invite or password-reset flow. An administrator exists only if a record is added to `admins`.

## One-time setup
1. Create the database and collections (idempotent; needs an API key with the databases scope, which can be deleted afterwards):
   `APPWRITE_API_KEY=... node scripts/setup-admin-db.mjs`
2. In Netlify set `POS_ADMIN_TOKEN_SECRET` to a random string of at least 32 characters (for example `openssl rand -base64 48`).
3. Add an administrator: run `node scripts/hash-admin-password.mjs` (it generates the password and prints it once), and copy the printed `passwordHash`; then in the Appwrite console create a document in `pos_admin` > `admins` with `email` (lowercase @ceylonrylabs.io), `name`, `passwordHash` (printed hash), `active` = true, `failedAttempts` = 0.

## Changing or removing an administrator
- New password: generate a new hash and paste it into `passwordHash`.
- Remove access: set `active` = false (or delete the record). Existing sessions stop working on their next request.

## Admin screens
Account list, then per account: Access (enable/disable, optional fixed invoice amount), Features (one switch per feature, per business or per location), Welcome message, Invoices. Pricing tier information is no longer shown.

## Diagnostics bucket
POS log files are never stored in a database. An administrator clicks "Request logs from this POS" on the account's Diagnostics tab; the POS uploads its log on its next 30 s check-in into Appwrite Storage bucket `pos_diagnostics` (override with `APPWRITE_DIAGNOSTICS_BUCKET_ID`), files `r_<uid>` (request marker) and `l_<uid>` (log). The bucket has no client permissions (server API key only), 2 MB max, txt/json only. A request unanswered for 24 h expires and a received log is deleted after download or after 24 h.
Create it with `APPWRITE_API_KEY=... node scripts/setup-admin-db.mjs` (the key needs the buckets/storage scope too). Until it exists the diagnostics endpoints answer 503.
