# POS database and sync changes: team update

Covers the Appwrite database, storage and cloud-sync work merged to `main` (latest: PR 73, October 2026).

## 1. Summary

| Area | Before | Now |
|---|---|---|
| POS business data | Same Appwrite database (`ceylonry`, table `app_documents`) as the other Ceylonry system | Own database `pos`, table `pos_documents` (old table is read as a fallback while we migrate) |
| Images (products, logo, receipt QR) | Embedded in the synced business document | Appwrite Storage bucket `pos-images`; only the file URL is synced |
| Checking for changes | Every pull downloaded the whole business document | Pull asks for a tiny "last written" stamp and downloads only when it changed |
| Check interval | Every 1.5 s | 3 s in use, 15 s idle, 30 s hidden tab (per-device "Always live screen" switch) |
| Large documents | Stored as-is, split into pieces overwritten in place | Compressed above 50 KB, split into 400 KB pieces above 900 KB, each save writes a new set of pieces |
| Sync status | Green "Syncing POS with cloud…" bar | Sync icon next to Full Screen: turns while syncing, green when online and synced, red when offline or failed |

## 2. Database changes

### 2.1 Separate POS database
- Database `pos`, table `pos_documents`, holds everything under `users/{uid}/pos…` and its split pieces and catalogue backups.
- Database `ceylonry`, table `app_documents`, keeps everything else. `posInvoices` stays there.
- Reads fall back to the old table when a POS document isn't in `pos` yet (`APPWRITE_POS_FALLBACK`, on by default).
- `scripts/migrate-pos-to-own-database.js` copies and verifies the data. The copy has been run.
- The `/ready` health check now also checks the POS database.
- Backup policies: `pos-daily-backup` (POS) and `ceylonry-daily-backup` (recreated after creating the POS policy replaced the old one).
- Database `pos_admin` is used by the admin portal.

### 2.2 Document storage format (netlify/lib/appwrite.js)
- Documents above 50 KB are stored gzip-compressed (`{"__gz": base64}`). `APPWRITE_COMPRESS=off` stops compressing new saves.
- Documents above 900 KB are split into 400 KB pieces.
- Pieces are versioned (`chunkVersion`): every save writes a complete new set and removes the previous set afterwards. Pieces are never overwritten in place.
- An unreadable document falls back to its previous copy instead of failing every request.
- The server reads the current document once per save.

### 2.3 Function actions (netlify/functions/appwrite-docs.js)
- `get` also returns the write `stamp`.
- New `stamp` action: returns only the write stamp of a document.
- New `stamps` action: returns the stamps of the monthly sales documents (used by the sales split).
- `set` returns the new `stamp` and the `previousStamp`, so the saving device can skip re-reading its own write.

### 2.4 Storage
- Bucket `pos-images` (public view URLs) via the `appwrite-files` function.
- The POS falls back to inline images when offline, in local mode, or on upload errors.
- Settings has a one-time "Move saved images to cloud storage" button for existing images.

### 2.5 Sales history split (built, switched OFF)
- `VITE_SALES_SPLIT=on` stores sales one cloud document per month; only changed months upload.
- Keep it off until sync has been stable for a week or more.

### 2.6 Settings data
- Table layouts are saved per location (`tableLayout_{locationId}`). The old shared `tableLayout` is shown until a branch saves its own.

## 3. Sync behaviour

| Item | Value |
|---|---|
| Push check | Every 2.5 s, or 250 ms after an edit |
| Pull check, in use | Every 3 s (`VITE_SYNC_PULL_MS`) |
| Pull check, idle | Every 15 s after 2 minutes with no input (`VITE_SYNC_IDLE_AFTER_MS`, `VITE_SYNC_IDLE_PULL_MS`) |
| Pull check, hidden tab | Every 30 s (`VITE_SYNC_HIDDEN_PULL_MS`) |
| Back in use | First tap, key press, focus or tab return checks at once and restores full speed |
| After a failure | Wait 5 s, 10 s, 20 s, 40 s, then 60 s; reset after a success or a tap on the red icon |
| Sign-in token | Reused for 10 minutes |
| Always live screen | Settings > Operations, per device: keeps full speed on kitchen displays |

## 4. Incident and fix
- A business document became unreadable ("incorrect data check" errors) because two overlapping saves mixed their pieces in place.
- Fixed in PR 71 (versioned pieces, fallback to the previous copy, failure backoff).
- **Still to confirm:** the affected business has synced normally since the fix. If not, its rows in the `pos` database (main row and pieces under `users/6ab0b1cd00028ddaf797/pos`) need repairing.

## 5. Estimated savings

These are **estimates from the code's behaviour, not measured usage**. The real figures depend on the size of each business document, the number of devices and the hours they are open. Compare with the Appwrite Console usage graphs and Netlify function invocations before and after to confirm.

**Example business:** one 1 MB document (stored as the main row plus about 3 pieces = about 4 row reads for a full read), 3 devices open 12 hours a day (8 in use, 4 idle), and 200 edits a day, each downloaded by 2 other devices.

| Per day | Before (1.5 s, full download) | After step 1: stamp checks | After step 2: 3 s interval | After step 3: idle slowdown (now) |
|---|---|---|---|---|
| Function calls | 86,400 | 86,400 | 43,200 | 31,680 |
| Database row reads | 345,600 | 89,600 | 44,800 | 33,280 |
| Data downloaded | about 86 GB | about 0.4 GB | about 0.4 GB | about 0.4 GB |

| Saving vs before | Function calls | Row reads | Download |
|---|---|---|---|
| Total | about 63% fewer | about 90% fewer | about 99.5% less |

How each step contributes:
- **Stamp checks** account for almost all of the row-read and download saving. Before, every check downloaded the whole document.
- **Doubling the interval to 3 s** halves function calls.
- **Idle slowdown** removes another 27% of calls (4 of 12 hours at 15 s instead of 3 s) and a quarter of what is left in row reads.
- **Other savings that are not counted above:** no read-back after saving when nobody else wrote, one document read per save instead of several, token reuse (about 6 sign-in calls an hour instead of one per request), compression (fewer pieces and smaller transfers), and backoff when the server is failing.

To turn these into money, multiply the "after" and "before" counts by your Appwrite and Netlify plan rates, or read the usage of the last 30 days against the 30 days before 9 October.

## 6. Still to do
1. Confirm the affected business has recovered (section 4).
2. Set `APPWRITE_POS_FALLBACK=off` on Netlify after a few more days, then delete the 61 old POS rows in `ceylonry` once a `ceylonry` backup exists (needs approval).
3. Turn on `VITE_SALES_SPLIT=on` when sync has been stable.
4. Optional next steps: archive or cap the audit logs, per-table delta sync, Appwrite Realtime to replace polling.
5. Account reset and deletion does not yet cover POS documents (existing gap).

## 7. Other changes in the same period (non-database)
Sync status icon (PR 72), idle slowdown and Always live screen (PR 73), table layout per branch, PDF report export, admin menu export, location selection after PIN, navigation rail on all screen sizes, PWA and iOS install guide.
