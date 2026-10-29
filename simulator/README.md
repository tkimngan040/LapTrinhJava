# simulator — kiosk device simulator

This **is** the device tier of the system, not a temporary stand-in for one.
Report sections 1.5.3 and 2.8.1 specify the device tier as a Java simulator
speaking the same MQTT contract hardware would, and the architecture diagram
labels that box "IoT Device / Simulator". The backend cannot tell the
difference, which is what makes the integration tests in Report section 3.6
mean anything.

## Running it

```bash
mvn package
java -jar target/simulator.jar --device=KIOSK-001
```

| Flag | Default | Meaning |
|---|---|---|
| `--device` | `KIOSK-001` | Must match a machine's `device_id` in the database |
| `--broker` | `tcp://localhost:1883` | Mosquitto |
| `--secret` | `dev-command-signing-secret` | **Must match the backend's `scentstation.mqtt.command-secret`** |
| `--slots` | `4` | FR2.3 requires at least four |
| `--volume` | `100` | Starting millilitres in every slot |
| `--fault` | `none` | See below |

If the secret does not match, every command is refused with
`INVALID_SIGNATURE` and nothing ever sprays. That is the correct behaviour
(BR7), and it is also the first thing to check when a demo will not work.

## Fault modes

Each mode reproduces one row of the exception table in Report section 2.9.4,
and each gives one integration test case in section 3.6.

| Flag | What the simulator does | Expected backend outcome |
|---|---|---|
| `--fault=none` | works normally | order DISPENSED, stock down by one dose |
| `--fault=reject` | refuses the command in its ack | order FAILED, incident opened (BR7) |
| `--fault=interlock` | reports the door as open | order FAILED, machine status updated (BR8) |
| `--fault=silent` | accepts, never sends a result | order UNCERTAIN, **no second command** (BR14) |
| `--fault=duplicate` | publishes its result twice | stock deducted exactly once (NFR3.4) |
| `--fault=offline` | stops sending heartbeats | machine OFFLINE, new orders refused (BR9) |

`none` is implemented (task L4, Long). The other five are task **N2**
(Kim Ngan): each is a small implementation of `FaultInjector` overriding one
default method, added inside `FaultInjector.forName`. No other file needs to
change — that is what the interface is for, and it is why L4 and N2 can be
done at the same time.

`silent` and `duplicate` are the two most valuable modes in the whole project.
They produce test cases IT-04 and IT-05, which show that a customer is never
charged twice and never sprayed twice when the network misbehaves.

## What the device checks before it sprays

`CommandVerifier` runs the four checks of Report section 2.9.3 step 8, in that
order:

1. **HMAC signature** — a command that cannot be authenticated is refused and
   never actuated (BR7);
2. **device id** — a command addressed to another machine is refused (FR4.6);
3. **expiry and idempotency key** — a stale or already-seen command is refused,
   which is what stops a replay from spraying twice (BR7, NFR3.4);
4. **safety interlocks** — door, maintenance mode, slot volume, critical error
   (BR8, FR4.7).

The order matters: authenticity first, because an unsigned command's own
fields cannot be trusted to answer any of the later questions.

## Three files are shared with the backend

`Topics.java`, `CanonicalJson.java` and `CommandSigner.java` exist in both
projects and **the two copies must stay byte-identical** in their code. Edit
one without the other and every signature fails; the symptom (every command
refused) points nowhere near the cause.

Checking they are still in step, from the repository root:

```bash
for f in Topics CanonicalJson CommandSigner; do
  diff <(sed '/^package/d' backend/src/main/java/vn/edu/uth/scentstation/iot/$f.java) \
       <(sed '/^package/d' simulator/src/main/java/vn/edu/uth/scentstation/simulator/$f.java) \
    && echo "$f: in step"
done
```

Only the package line and the class Javadoc may differ.
