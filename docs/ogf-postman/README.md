# OGF POS-02 UAT in Postman

Postman collection that follows OGF's "RestFul API Testing with Postman" guide and the POS REST API spec (v2.4 / 2.5): OAuth 2.0 client credentials with the
credentials sent in the body, then `POST /api/possale/importpossaleswithitems` with a Bearer token. The bodies are what the POS sends (the same numbers as the
unit tests of `netlify/lib/ogf-sales.js`). It was run with Postman's command line runner against a local stand-in for OGF's server: 14 requests, 59 checks, none failed.
It has **not** been run against OGF's real UAT server yet.

## Run it
1. Postman: **Import** `ogf-pos02-uat.postman_collection.json` and `ogf-uat.postman_environment.json`, then pick the **OGF UAT** environment.
2. Fill in the environment (from OGF's information sheet; they are kept in your Postman, never in these files): `clientId`, `clientSecret`, `propertyCode`,
   `posInterfaceCode`. `baseUrl` is `https://uat2-pos.imonitor.center`.
3. Run **1. Get access token**, then the other requests in order, or use the **Runner** on the whole collection with a delay of 1500 ms between requests (each
   submission needs its own batch number, which is the time to the second).
4. Every request has checks. **2 to 8** should say `ReturnStatus: Success` with every record imported. The four **Negative tests** are *expected* to be refused: they
   show the mall's answer (`DefectiveRowNos` / `ErrorDetails`) in the Postman console.

## What each request is
| Request | Shows |
|---|---|
| 1 | The login: a Bearer token and its lifetime |
| 2 | OGF's own sample receipt (cash, 5% tax) |
| 3 | A restaurant bill: discount, service charge and tax, card |
| 4 | Two receipts in one batch, one paid by a split payment (`Cash, Credit Card`) |
| 5a / 5b | A sale, then its **Void** (same receipt number, later batch) |
| 6a / 6b | A sale, then a partial **Refund** |
| 7 | **Return** |
| 8 | **Exchange** (the POS does not create these yet: ask OGF how they expect one) |
| N1 to N4 | Duplicate receipt in a batch, a date in the future, a wrong property code, a negative amount |

## Rebuild
`python3 docs/ogf-postman/build.py` writes both JSON files again. Receipt numbers and dates are made fresh by each request's pre-request script, so the same
collection can be run again and again.

## Points the Postman guide shows (to confirm with OGF)
- The text of the guide gives `https://uat2-pos.imonitor.center`; its screenshots show `https://uat-pos.imonitor.center` (no 2). Use the one OGF confirms.
- Its working request body has `"SalesType": "SALES"` (capitals) where the spec says `Sales`, and spells the discount field both ways in the same body
  (`ItemDiscoumtAmt` and `ItemDiscountAmt`). The POS sends both spellings and `Sales` as in the spec; ask whether `SALES` is required.
- The token in the guide lasts 3000 seconds; the spec says 3600. The POS asks for a new token for every batch, so it does not matter.
