# simulator — kiosk device simulator

This **is** the device tier of the system, not a temporary stand-in
(Report §1.5.3, §2.8.1).

Run with `java -jar target/simulator.jar --device=KIOSK-001 --fault=none`

| File | Owner | Task |
|---|---|---|
| `KioskSimulator.java`, `CommandVerifier.java`, `SafetyInterlock.java` | Long | L4 |
| `FaultInjector.java` | Kim Ngan | N2 |
| `Topics.java` (identical copy of the backend one) | Long | L5 |

## Fault modes

| Flag | What the simulator does | Expected backend outcome |
|---|---|---|
| `--fault=none` | normal operation | DISPENSED |
| `--fault=reject` | rejects the command in `ack` | FAILED, incident opened |
| `--fault=interlock` | reports the door as open | FAILED, machine status updated |
| `--fault=silent` | accepts the command, never sends `result` | UNCERTAIN, no second command |
| `--fault=duplicate` | publishes `result` twice | inventory deducted exactly once |
| `--fault=offline` | stops sending heartbeats | machine OFFLINE, new orders refused |
