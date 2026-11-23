# Alert and maintenance acceptance checks

From `backend` in PowerShell, using a disposable PostgreSQL database:

```powershell
$env:SCENT_MAINTENANCE_TEST_DB_URL = 'jdbc:postgresql://localhost:5432/maintenance_test'
$env:SCENT_MAINTENANCE_TEST_DB_USER = 'postgres'
$env:SCENT_MAINTENANCE_TEST_DB_PASSWORD = 'your-test-password'
mvn test -Dtest=MaintenanceIntegrationTest
```

Without the URL the integration class is skipped. Flyway applies V1–V5. Fixtures
use unique identifiers and remain in the disposable database. Tests exercise
real JWT/method authorization, PostgreSQL constraints/locks and the actual
device-result dispatcher; only outbound DeviceGateway is mocked.

Covered: duplicate/concurrent alerts, automatic critical tickets, machine order
blocking, actor/brand/assignee guards, acknowledge/assign/resolve/reopen, repair
before test, actual confirmed diagnostic before close, failed/stale tests,
broker-failure rollback, telemetry type validation and OFFLINE recovery.
`offlineAlertRemainsSingleAcrossWatchdogCyclesAndAcknowledgement` verifies that
four subsequent watchdog calls retain the same single alert after acknowledgement;
heartbeat recovery resolves it, and a later outage creates a new incident.

Simulator safety tests run separately from the repository root:

```powershell
mvn -f simulator/pom.xml test
```

They verify that a signed diagnostic can run during maintenance, while customer
commands remain blocked, and that diagnostics cannot bypass door/error/volume
checks or alter purpose without invalidating their signature.

API JSON bodies and lifecycle details are in `docs/maintenance-api-contract.md`.
For a live ticket test, start the configured MQTT broker and registered simulator
first. Requesting a diagnostic is not a successful test; close only after the
device result is received and `testPassed` is true. These automated tests mock
outbound MQTT and do not establish physical-hardware correctness.

## Live OFFLINE acceptance

1. Start PostgreSQL, a local MQTT broker and the backend using the same broker URL.
2. Register a dedicated machine in the development database; use its `device_id`
   for `java -jar simulator/target/simulator.jar --device=<device_id>
   --broker=tcp://127.0.0.1:1883 --fault=none` (one command).
3. Confirm heartbeat reception, machine ONLINE and no OFFLINE alert for that machine.
4. Stop only that simulator process. Leave the broker and backend running.
5. Allow the configured 45-second heartbeat timeout and 15-second watchdog cycle.
   `GET /api/alerts?activeOnly=true`, filtered by the machine ID, must return one
   OFFLINE incident. Record its ID.
6. Acknowledge the alert and wait through at least two more watchdog cycles.
   Active and historical lists must still contain exactly one OFFLINE alert for
   this new machine, with the same ID and status ACKNOWLEDGED.

The recorded broker-connected run is in [offline-acceptance-result.md](offline-acceptance-result.md).
