# Report verification

The frontend field names were confirmed by the user. The contract and examples
are in `docs/reports-api-contract.md` at the repository root.

From `backend`, in PowerShell, use a disposable PostgreSQL database:

```powershell
$env:SCENT_REPORTS_TEST_DB_URL = 'jdbc:postgresql://localhost:5432/report_test'
$env:SCENT_REPORTS_TEST_DB_USER = 'postgres'
$env:SCENT_REPORTS_TEST_DB_PASSWORD = 'your-test-password'
mvn test -Dtest=ReportIntegrationTest
```

Without the URL the integration class is skipped. Flyway creates/validates the
existing schema. Tests use real JWT/method security and SQL aggregation, seed 30
days for two brands, and roll back fixtures after each test. No MQTT broker or
extra Maven dependency is needed. The seed date is fixed in tests for repeatable
totals; when used independently the SQL defaults to the current calendar date.

Acceptance totals: brand A 120 orders and 1,200,000 VND net; brand B 30 orders and
1,500,000 VND net; platform 150 orders and 2,700,000 VND net. Brand A success rate
is 33.33%, excluding diagnostic commands. Tests also cover all five Viewer reads,
denied writes/exports, tenant isolation, CSV escaping and all-row export, current
low stock, ranking, empty/invalid filters, local-midnight bounds and saved dose
snapshots after recalibration.

`Reports.postman_collection.json` runs 22 HTTP requests against the current-date
seed and creates a unique Viewer fixture. Set the PSA credentials before running.
The running application's watchdog may mark seeded machines OFFLINE when they
have no live heartbeat; the collection checks current connectivity counts and
fixed operational states rather than assuming the initial ONLINE flags persist.
