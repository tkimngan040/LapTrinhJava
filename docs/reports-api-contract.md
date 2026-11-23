# Dashboard / Reports — confirmed frontend names

The user selected Kim Tuyen's existing schema (option 2) on 2026-11-15.
Note: transaction rows use exactly these names:

```text
orderId, createdAt, kioskCode, brandName, productName, volumeMl, amount, currency, status
```

`status` is the original backend enum name. The frontend translates it for
display. `kioskCode` maps to the machine's `device_id`. Order `amount` is the
immutable order price snapshot, not today's catalogue price. `volumeMl` uses the
most recently issued CUSTOMER command's saved dose; an order with no command uses
the slot's current calibrated dose as an estimate.

## Requests, filters and permissions

GET endpoints: `/api/reports/machines`, `/revenue`, `/orders`, `/products`,
`/inventory`. Common optional query parameters:

| Parameter | Meaning |
| --- | --- |
| `brandId`, `machineId`, `productId`, `locationId` | Intersect the selected dimensions with the caller's scope |
| `from`, `to` | Inclusive YYYY-MM-DD calendar dates, Asia/Ho_Chi_Minh; default most recent 30 days |
| `format` | json (default) or csv |
| `groupBy` | Revenue only: DAY (default), WEEK, MONTH; Monday starts a week |
| `page`, `size` | Order JSON only: page defaults to 0; size defaults to 50, maximum 500 |

All JSON responses include `filters`: applied IDs, `from`, `to`, `timeZone` and
`scope` (BRAND or PLATFORM). Null IDs are omitted, consistent with the project.

Readers: PSA, BA, Operations Manager, Viewer. A brand user automatically receives
their own brand; requesting another brand returns 403. Foreign machine/product/
location IDs return 404. Only PSA may aggregate all brands. Valid but mutually
nonmatching filters return an empty report. No report endpoint writes data.

CSV requires PSA/BA/Operations Manager. Viewer may read JSON but cannot export,
because no separate export permission is modelled. Exports use identical scope
and calculations, UTF-8 with BOM, escaped cells and CRLF. Order export includes
all matched rows regardless of JSON pagination. CSV protects text cells that
could be interpreted as spreadsheet formulas. Its nine transaction headers match
the approved names and order exactly.

Invalid IDs/dates/format/grouping/pagination return 400 with the existing ApiError
shape. Unknown reports return 404. All money aggregates explicitly use VND.

## Responses

Aggregate containers describe their metrics; the approved transaction names apply
to each object inside `orders.items`, rather than limiting every aggregate to an
order-shaped object.

### machines

`totalMachines`, `statusCounts`, `items`, `filters`.
Items: `machineId`, `kioskCode`, `brandName`, `status`, `connectivityStatus`,
`operatingStatus`. MAINTENANCE/DISABLED/ERROR override connectivity; ACTIVE
machines use ONLINE/OFFLINE/UNSTABLE. All six count keys are present, including
zero counts. Multiple slots never duplicate a machine.

### revenue

`amount` (net), `grossAmount`, `refundedAmount`, `currency`, `transactionCount`,
`groupBy`, `series`, `filters`. Series items: `periodStart`, `amount`,
`grossAmount`, `refundedAmount`, `currency`, `transactionCount`.

Gross sums SUCCEEDED and REFUNDED payment amounts; refunded sums REFUNDED; net
is gross minus refunded. Counts are distinct paid order IDs. Group by payment
`paidAt`, with zero buckets included. Refunds are attributed to their original
payment period because no refund timestamp exists. Weekly/monthly bucket labels
can precede `from` for a partial first bucket; amounts still obey the exact date
bounds. More than 10,000 buckets requires a shorter range or coarser grouping.

### orders

`totalOrders`, `statusCounts`, `successfulDispenses`, `failedDispenses`,
`uncertainDispenses`, `dispenseSuccessRate`, `paidButUnconfirmed`, `items`,
`page`, `size`, `filters`.

```json
{
  "items": [{
    "orderId": 1,
    "createdAt": "2026-11-15T03:00:00Z",
    "kioskCode": "REPORT-A-1",
    "brandName": "REPORT-SEED-A",
    "productName": "Rose",
    "volumeMl": 2,
    "amount": 20000,
    "currency": "VND",
    "status": "DISPENSED"
  }]
}
```

All nine OrderStatus count keys are included, even when zero. Order counts/rows
use order creation time. Dispensing metrics use CUSTOMER command issued time.
Success = SUCCEEDED; failure = FAILED/REJECTED; uncertain = TIMED_OUT.
Success rate = success / (success + failure + uncertain), as a percentage rounded
to two decimal places; an empty denominator returns 0. Diagnostics and in-flight
commands are excluded. Paid-but-unconfirmed means a SUCCEEDED payment exists
while the order is neither DISPENSED nor REFUNDED.

### products

`items`, `filters`. Items: `productId`, `productName`, `brandName`,
`orderCount`, `soldCount`, `amount`, `currency`. Rank by sold count, selection
count, then product ID. Count all selected orders; sold count and amount use
DISPENSED orders and immutable price snapshots. Dates use order creation time.
This is fulfilled-sales value; revenue reports confirmed payment value.

### inventory

`items`, `filters`. Items: `slotId`, `slotNumber`, `kioskCode`, `brandName`,
`productName`, `bottleCode`, `volumeMl` (remaining), `initialVolumeMl`,
`thresholdMl`, `status` (BottleStatus), `available`, `refillRequiredMl`.
Include attached bottles at/below threshold or unable to provide another dose.
Refill requirement is the nonnegative shortfall from the installed baseline.

Machines and inventory are current snapshots; time filters do not pretend to
reconstruct historical states or historical stock. Dates apply to transaction
reports. Historical uptime/downtime requires state-event history not available in
the current schema.

## Deterministic 30-day acceptance data

`backend/src/test/resources/domain/report/seed-30-days.sql` seeds two brands.
Use only a disposable database/transaction; the fixture intentionally fails on
duplicate fixed identifiers instead of overwriting existing business data.
Set LOCAL `scent.reports_seed_end` to choose its last calendar day.

| Dataset | Orders | Gross VND | Refunded VND | Net VND |
| --- | ---: | ---: | ---: | ---: |
| REPORT-SEED-A | 120 | 2,100,000 | 900,000 | 1,200,000 |
| REPORT-SEED-B | 30 | 1,500,000 | 0 | 1,500,000 |
| Platform | 150 | 3,600,000 | 900,000 | 2,700,000 |

Brand A has 30 successful and 60 failed customer commands: 33.33% success.
Its 30 diagnostic commands are excluded. Its best seller has 30 sales worth
600,000 VND, despite a deliberately different current catalogue price.
ReportIntegrationTest rolls back its seed after every test.
