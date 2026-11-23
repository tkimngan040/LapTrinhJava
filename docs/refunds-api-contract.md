# Refund and operational review contract

Implements the missing refund operation needed by the screenshot audit task.
References: FR3.13, FR10.2–FR10.3, BR6, BR10–BR14. The project uses its configured
FAKEPAY development provider; no real bank transfer is claimed.

## Request and inspect a refund

PSA, Brand Admin and Operations Manager may use these endpoints. Brand users are
restricted to their own tenant; cross-brand objects return 404. Viewer, Technician
and Inventory Staff cannot request, retry or simulate a refund.

`POST /api/orders/{orderId}/refunds`:

```json
{"requestKey":"unique-client-request-123","reason":"Paid order; device definitely refused the spray"}
```

Returns 201 with the refund, or 200 for an identical repeat. Required reason:
1–1000 characters. Request key: 1–80 letters, digits or `._:-`; unique per brand.
Reusing a key for another order/reason returns 409. A different key cannot create
a second full refund for an order.

Eligibility: order FAILED, exactly one successful payment, exact matching amount
and currency. PENDING, DISPENSING, DISPENSED, CANCELLED, EXPIRED and UNCERTAIN
orders cannot be refunded through this endpoint. UNCERTAIN requires recorded
human review first. Refund amount/provider/payment are derived from persisted
evidence; clients cannot supply or alter them.

Response fields: `id`, `brandId`, `orderId`, `paymentId`, `refundReference`,
`requestKey`, `provider`, `amount`, `currency`, `status`, `reason`, `requestedBy`,
`attempt`, `providerReference`, `resultCode`, `createdAt`, `completedAt`.
The initial status is PENDING; order remains FAILED and payment remains SUCCEEDED.

`GET /api/refunds` returns the latest 100 in scope. `GET /api/refunds/{id}` returns
one scoped record. `POST /api/refunds/{id}/retry` is allowed only after FAILED;
it reuses the same refund reference and increases the attempt number. Existing
request/outcome evidence remains in the immutable audit ledger.

## Provider delivery and confirmation

The request and its dispatch row are committed atomically with REFUND_REQUESTED
audit. `RefundDispatcher` polls the durable queue every two seconds. Provider
adapters must use `(refundReference, attempt)` as an idempotency key. A crash
after submission but before marking delivery can cause redelivery, which the
provider must absorb. FAKEPAY retains an independent simulated-provider ledger;
no provider completion occurs merely because a request was enqueued.

`POST /api/refunds/webhook` is authenticated by HMAC, rather than a user JWT.
Signed fields: `eventType:"REFUND"`, `refundReference`, `provider`,
`providerReference`, `attempt`, `amount`, `currency`, `status`, `resultCode`.
The `signature` field itself is excluded from canonical signing, exactly as in
the existing payment webhook. Secret: configured payment webhook secret.

Only SUCCEEDED/FAILED are accepted. The stored request must match reference,
provider, attempt, amount and currency. An identical final callback is a no-op;
conflicting final results and old-attempt callbacks return 409. Invalid signatures
return 400. **Only a matching SUCCEEDED confirmation** transitions refund to
SUCCEEDED, order to REFUNDED and payment to REFUNDED. Failure retains the order's
FAILED state and the original successful payment for follow-up.

For the configured development provider, after delivery:

```http
POST /api/dev/refunds/{id}/simulate
Authorization: Bearer <PSA/BA/OM token>
Content-Type: application/json

{"attempt":1,"succeed":true}
```

This records the provider outcome in its separate ledger, signs it and delivers
it through the normal callback verifier. It can be repeated to redeliver an
outcome after backend persistence failure. The development endpoints and adapter
are absent when `scentstation.payment.fake-provider-enabled=false`. An unknown
provider has no installed adapter: its durable PENDING request remains queued
for configuration/reconciliation and is never falsely marked refunded.

## Human review

`POST /api/orders/{id}/review` (same operator/tenant rules):

```json
{"decision":"FAILED","note":"Checked the original device log","evidence":"Operator verified a definite refusal before pump activation"}
```

Requires an UNCERTAIN order, exactly one finished/timed-out command, nonblank
note (max 400) and evidence (max 1000). Decision must be FAILED or DISPENSED.
DISPENSED requires successful stock deduction for the original command in the
same transaction; insufficient stock rolls back the review completely. Definite
failure is forbidden after recorded successful inventory application. No review
issues another command. Repeating the same decision/note/evidence is idempotent;
an existing recorded review cannot be overwritten. Reviews and new order status
transitions have append-only database histories.

## Audit and validation

REFUND_REQUESTED, REFUND_RETRIED and REFUND_OUTCOME_RECORDED target REFUND and
retain amount, currency, attempt, reference, requesting user and before/after
order/payment/refund states. ORDER_REFUND_RECORDED records the actual order
transition. ORDER_REVIEWED retains the human actor and note; confirmed stock
application remains separately audited. All related database changes/audit inserts
commit together. Provider ledger entries remain independent evidence when a
callback must be retried after backend rollback.

`AuditIntegrationTest` exercises request/callback repetition, forged and mismatched
callbacks, failed-attempt retry and stale-callback rejection, authorization, tenant
isolation, reason/eligibility, human review, stock idempotency and audit rollback.
Live evidence is recorded in the all-screenshot acceptance checklist.
