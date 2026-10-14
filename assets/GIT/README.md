# Product walkthroughs

Animated GIFs of the main Ceylonry products, used by the project [README](../../README.md).

| File | Product | Screens |
|---|---|---|
| `pos-demo.gif` | POS | Setup for a business type, checkout, pay now, order queue, table layout, dashboard |
| `kitchen-display-demo.gif` | Kitchen Display (`/KDS`) | POS-account sign-in, pairing code, a ticket from the POS moving new → preparing → ready |
| `guest-manager-demo.gif` | Guest Manager (`/GM`) | Bookings, new booking with live availability, floor plan, calendar, waitlist, guests, reports, shift handover |
| `admin-portal-demo.gif` | POS admin portal (`/posv2/admin`) | Accounts list with the Products column, business presets, a feature switch saved |

All data is fictional (business "Ceylon Spice Kitchen" / "My Business", guests with `@example.com` addresses and `0770000xxx` numbers). They show the apps as they were on 14 Oct 2026; re-record after a visible UI change.

## How they were recorded

1. Run the apps locally (see "Run it locally" in the README): `npm run dev` in `pos-react` for the POS, admin portal and KDS, and a static server for Guest Manager (`python3 -m http.server`, local mode).
2. Open each screen in a browser about 800 px wide (a tablet portrait layout), take one screenshot per step, then join the screenshots into a GIF with a caption bar (Python and Pillow; about 2 s per frame, 640 px wide, 160 colours).
3. The KDS needs the pairing function: any local stand-in for `netlify/functions/kds-pair.js` works (the real handler with an in-memory store), with the dev origin added to `EXTRA_ALLOWED_ORIGINS`.

Keep each file under about 1 MB: they are served from `/assets/` and loaded by the README.
