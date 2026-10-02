# Parked tests

Four tests that describe features missing from the current system. They are not run by `npm test`.
Decide each feature, then move the test back to `tests/` (or delete it).

| Test | Missing feature |
|---|---|
| Business suppliers support QA-requested search, filters, sorting... | Supplier search, type filter and sort controls in `growth.html` |
| Business supplier payments persist paid and outstanding balances | "Outstanding / Paid" supplier summary |
| all plans use monthly bank transfer billing ... and grace period | Grace period after the due date |
| benefit slides are not misrepresented as named customer testimonials | On-page testimonial disclaimer in `index.html` |

Details: `docs/reference/test-audit.md`, section C.
