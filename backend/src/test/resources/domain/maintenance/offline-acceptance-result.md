# Live OFFLINE acceptance evidence

Run date: 2026-11-15. All times below use Asia/Bangkok (UTC+07:00).

Criterion: stopping a simulator creates exactly one OFFLINE alert for that
machine; subsequent watchdog cycles must not duplicate the incident, including
after acknowledgement.

## Environment and actions

- Backend: packaged Spring Boot application on `http://127.0.0.1:8080`.
- Database: local PostgreSQL 16.4, development database, Flyway V1–V5 applied.
- MQTT: local Moquette 0.17 broker bound to `127.0.0.1:1883`; telemetry,
  metrics, error reporting and persistence disabled for this acceptance run.
- Simulator: packaged `simulator/target/simulator.jar`, four slots, 100 ml per
  slot, `--fault=none`, connected through the real MQTT gateway.
- Dedicated fixture: brand ID `4`, machine ID `9`, device ID
  `OFFLINE-ACCEPT-20261115-144714`.
- Heartbeat timeout: 45 seconds; scheduled watchdog interval: 15 seconds.

The simulator connected at 14:47:15.490. The backend logged the ONLINE transition
at 14:47:15.531. Only the simulator process was stopped at 14:47:38.371; the broker,
backend and database continued running. No watchdog invocation, heartbeat timestamp
or machine status was manually changed during this live run.

## Observations

Counts are scoped to machine ID `9` and alert type `OFFLINE`.

| Sample time | Connectivity | Active OFFLINE alerts | Historical OFFLINE rows | Alert ID / status |
|---|---|---:|---:|---|
| 14:47:22.450, simulator running | ONLINE | 0 | 0 | None |
| 14:47:39.347, simulator stopped | ONLINE | 0 | 0 | None; timeout not reached |
| 14:48:35.226 | OFFLINE | 1 | 1 | `1` / OPEN |
| 14:49:28.160, after acknowledgement and further watchdog cycles | OFFLINE | 1 | 1 | `1` / ACKNOWLEDGED |

The final received heartbeat was at 14:47:35.494. The scheduled watchdog created
the OFFLINE incident at 14:48:29.613, approximately 54.1 seconds after that heartbeat.
`GET /api/alerts?activeOnly=true` returned the same single OPEN incident at
14:48:34.548. `PATCH /api/alerts/1/acknowledge` returned ACKNOWLEDGED at
14:48:35.280.

At 14:49:27.534, both active and historical API lists still contained exactly one
OFFLINE row for this machine, with the same ID `1`. A database query at
14:49:28.160 independently confirmed both counts, status ACKNOWLEDGED and the
unchanged final-heartbeat timestamp. More than three 15-second watchdog intervals
had elapsed since acknowledgement. The simulator process remained stopped; the
backend, broker and PostgreSQL listeners remained running.

**Result: PASS.** Stopping the real simulator produced one OFFLINE alert, and
scheduled checks did not duplicate it after acknowledgement.

## Automated coverage

`MaintenanceIntegrationTest`: **10 tests, 0 failures, 0 errors, 0 skipped**
(2026-11-15, 14:41:50). Its
`offlineAlertRemainsSingleAcrossWatchdogCyclesAndAcknowledgement` case verifies
the same alert ID through four further watchdog invocations, heartbeat recovery,
and a distinct new incident for a later outage. Those tests mock outbound MQTT;
the observations above use an actual broker and simulator process.

This run checks liveness and alert deduplication. It does not establish physical
hardware safety, selectable simulator fault modes, or a complete broker-connected
payment/dispensing/maintenance workflow.
