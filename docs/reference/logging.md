# Logging

## POS app (browser)
- `pos-react/src/utils/logger.js`: `createLogger("scope")` returns `debug/info/warn/error(message, error?, context?)`.
- Entries are kept in memory (last 1000) and mirrored to `localStorage` (last 300, key `pos-log-buffer`), so they survive reloads and crashes.
- Export: Settings > Plan & Support > Diagnostics > **Download log file** (`pos-log-YYYY-MM-DD.log`), or **Clear logs**.
- Redaction: any context key matching password, pin, token, secret, authorization, api key, card, cvv or otp is stored as `[redacted]`. Do not put customer names, emails or phone numbers in log messages.
- Uncaught errors, unhandled promise rejections and online/offline changes are captured automatically (`installGlobalLogging`).
- Scopes in use: `session`, `staff`, `checkout`, `sales`, `inventory`, `printing`, `cloud`, `auth`, `sync`, `admin`, `ui`, `db`.

## Netlify functions (server)
- `netlify/lib/log.js`: `createLogger('scope')` writes one JSON line per event (`t`, `level`, `scope`, `message`, `context`, `error`) to the function log, with the same redaction.
- Used by `pos-admin-data`, `pos-onboarding-email`, `hardware-order`, `appwrite-docs`, `admin-signin`, `account-danger-zone`, `submit-subscription-receipt`, `track-visit`. Search the Netlify function log by `scope` or `"level":"error"`.
