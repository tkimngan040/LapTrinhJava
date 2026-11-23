# Live product-price audit acceptance

**PASS — 15 November 2026, 15:14:23 (Asia/Bangkok, UTC+07:00).**

Criterion: changing a product price produces an audit row containing both the
old and new price.

The packaged backend was rebuilt and started on `http://127.0.0.1:8080` against
the local development PostgreSQL database. Flyway applied V6 successfully.
A dedicated fixture was inserted with a 20,000 VND default price; existing
business products were retained. The price change itself used HTTP and the
real JWT/security/AOP/database path.

1. Sign in as the local seeded PSA.
2. `PATCH /api/products/5/price` with `{"price":25000}` returned 200 and
   `defaultPrice:25000`.
3. `GET /api/audit-logs?action=PRODUCT_PRICE_CHANGED&targetType=PRODUCT&targetId=5`
   returned 200 with exactly one matching record.

| Field | Observed value |
|---|---|
| Audit ID | `2` |
| Actor ID / identifier | `1` / `psa@scentstation.local` |
| Target brand | `5` |
| Target type / ID | PRODUCT / `5` |
| Action | PRODUCT_PRICE_CHANGED |
| Before `defaultPrice` | `20000` |
| After `defaultPrice` | `25000` |
| Source | `PATCH /api/products/5/price` |

The actual response, without access tokens, is retained in
[price-acceptance-result.json](price-acceptance-result.json).

Validation also completed on this date: **105 backend tests, 0 failures,
0 errors, 0 skipped**, including 18 audit cases. They cover concurrent price
changes, tenant/role rejection, rollback after audit persistence failure, safe
login evidence, stock/permission/slot/maintenance/diagnostic auditing, search,
and rejection of API and direct-SQL audit mutation.

This earlier result validates price auditing. At this snapshot only the refund
state hook existed. The subsequently completed simulated-provider refund workflow
and final verification are recorded in the all-screenshot acceptance checklist;
remaining project-wide scope is listed in Report sections 3.3/4.2.
