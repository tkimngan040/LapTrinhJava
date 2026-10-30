# Appendix A. Use Case Specification

## A.1. Scope and conventions

This appendix specifies UC-00 through UC-18 from Chapter 2, Section 2.4.3, using the template and branching conventions in Section 2.5. It is a design specification derived from the supplied Chapter 2 and use case overview, not a claim that all functions are implemented or tested.

Names and identifiers follow the use case inventory exactly. UC-00 is inherited by PSA, BA, OM, TE, IS and VW through Authenticated User; it is documented even though the overview image does not display it. CU is anonymous. DEV is represented by the Java Device Simulator over MQTT in the project implementation scope.

Every protected staff operation revalidates role, tenant and assigned resource scope. Authentication is a precondition, not an invented include relationship. The related behaviour below preserves the include/extend names and guards stated in Section 2.4.3; those behaviours do not receive additional UC identifiers.

Alternative and exception labels identify the main-flow step where a branch leaves. Each branch states where processing resumes or terminates, and exceptions identify the persisted outcome. Audit entries are append-only for normal users. Acknowledgement means command receipt, not proof of actuation.

### Consistency decisions requiring team review

- UC-16 lists an optional authorised retry in Section 2.4.3, but Section 2.9 defines no retry transition from FAILED and explicitly prohibits a second command for UNCERTAIN. This appendix follows the stricter state machine and BR6/BR14: the current recovery path is human review/refund, with no second command from FAILED or UNCERTAIN. Any future retry needs a separately approved policy/state-machine design proving that duplicate actuation is impossible.
- UC-14/UC-15 diagnostic tests use the explicitly authorised maintenance path required by FR8.8. Ordinary customer dispensing remains blocked during maintenance. The implementation must distinguish diagnostic commands from customer commands and enforce applicable physical safety checks.
- Detailed recovery branches, such as late payment review and failed persistence handling, refine the requirements into testable design behaviour; the team should verify them against its implementation.

## A.2. Actor codes

| Code | Actor |
| :--- | :--- |
| PSA | Platform Super Administrator |
| BA | Brand Administrator |
| OM | Operations Manager |
| TE | Technician |
| IS | Inventory Staff |
| VW | Viewer |
| CU | Customer / Kiosk User |
| DEV | IoT Device (Java Device Simulator in project scope) |
| PP | Payment Provider |

## A.3. Index

| ID | Use case |
| :--- | :--- |
| [UC-00](#uc-00) | Sign in / Sign out |
| [UC-01](#uc-01) | Onboard and manage tenants and platform settings |
| [UC-02](#uc-02) | Manage brand users and role permissions |
| [UC-03](#uc-03) | Manage catalog, slots, locations and campaigns |
| [UC-04](#uc-04) | Browse and select fragrance |
| [UC-05](#uc-05) | Confirm order and pay by QR |
| [UC-06](#uc-06) | Track payment and dispensing status |
| [UC-07](#uc-07) | Monitor and configure machines and slots |
| [UC-08](#uc-08) | Dispense one calibrated spray |
| [UC-09](#uc-09) | Record confirmed dispensing result |
| [UC-10](#uc-10) | Manage batches, bottles and inventory history |
| [UC-11](#uc-11) | Install, replace or refill a bottle |
| [UC-12](#uc-12) | Monitor and reconcile remaining stock |
| [UC-13](#uc-13) | Handle alerts and assign service tickets |
| [UC-14](#uc-14) | Inspect, diagnose and repair a machine |
| [UC-15](#uc-15) | Close ticket and restore operation |
| [UC-16](#uc-16) | Review and reconcile transactions and failures |
| [UC-17](#uc-17) | View scoped dashboards and reports |
| [UC-18](#uc-18) | Search audit log and end-to-end traceability |

---

<a id="uc-00"></a>

## UC-00 — Sign in / Sign out

| Field | Specification |
| :--- | :--- |
| **Use case ID / Name** | UC-00 — Sign in / Sign out |
| **Description** | Establish an authenticated staff session and terminate it safely. |
| **Actors** | Primary: Authenticated User (PSA, BA, OM, TE, IS or VW). |
| **Trigger** | A staff member requests sign-in or sign-out. |
| **Preconditions** | For sign-in, an active staff account exists. For sign-out, a session exists. CU uses the kiosk anonymously. |
| **Postconditions — success** | Sign-in creates a session with the permitted roles and scope; sign-out invalidates the session. |
| **Postconditions — failure** | No session is granted for a rejected sign-in. Protected operations remain unavailable to invalid or revoked sessions. |
| **Related behaviour** | — |
| **Business rules** | BR13; BR12 applies to authentication audit records. |
| **Requirements trace** | FR1.3–FR1.8, FR1.10–FR1.11; FR10.1–FR10.2 |

### Main flow

1. The staff member submits account credentials.
2. The system validates the credentials and checks account activation and tenant eligibility.
3. The system establishes a session with the account roles and assigned tenant and operational scope, and records the authentication event.
4. The staff member requests access to a protected operation.
5. The system checks the current session and the permission for that operation.
6. The staff member requests sign-out.
7. The system invalidates the session, records the event and ends authenticated access.

### Alternative flows

- A6 (from step 6): The user keeps the session open and performs another permitted operation; return to step 4.

### Exception flows

- E2 (from step 2): Credentials are invalid, the account is locked/disabled, or the tenant is suspended. The system denies sign-in and records the attempt; no new session exists. The use case terminates.
- E5 (from step 5): The session has expired or been revoked, or the operation exceeds the granted scope. The system denies the request without changing business data. An expired/revoked session requires sign-in; the use case terminates.

---

<a id="uc-01"></a>

## UC-01 — Onboard and manage tenants and platform settings

| Field | Specification |
| :--- | :--- |
| **Use case ID / Name** | UC-01 — Onboard and manage tenants and platform settings |
| **Description** | Create and administer brand tenants and platform settings. |
| **Actors** | Primary: PSA. Supporting: BA account recipient when provisioning is requested. |
| **Trigger** | The PSA requests tenant onboarding, a tenant lifecycle change or a platform-setting change. |
| **Preconditions** | The PSA has an active platform-level session and permission for the requested operation. |
| **Postconditions — success** | The validated tenant/settings change is persisted and audited; a provisioned BA is linked to the intended tenant. |
| **Postconditions — failure** | Rejected or uncommitted changes do not alter the previous tenant/settings state. |
| **Related behaviour** | «extend» Provision Brand Administrator *{tenant onboarding}* |
| **Business rules** | BR13, BR11, BR12; BR1 applies when changing machine ownership. |
| **Requirements trace** | FR1.1–FR1.2, FR1.4–FR1.5, FR1.10; FR10.1–FR10.3 |

### Main flow

1. The PSA specifies a tenant operation and supplies the tenant details, or identifies a platform setting to change.
2. The system checks platform privileges, validates the submitted values and checks relevant uniqueness constraints.
3. The PSA confirms the proposed change.
4. The system persists the tenant/settings change and records the before-and-after values.
5. The system evaluates Provision Brand Administrator {tenant onboarding}; if requested, it validates and provisions the BA account for this tenant.
6. The system reports the persisted tenant/settings state and provisioning outcome.

### Alternative flows

- A1 (from step 1): The PSA selects an existing tenant for update, activation or suspension; return to step 2.
- A5 (from step 5): No BA provisioning is requested during this operation; continue at step 6.

### Exception flows

- E2 (from step 2): The caller lacks platform privileges or submitted data conflicts with an existing record. The system rejects the change; previous data remains intact. The use case terminates.
- E4 (from step 4): Persistence fails. The change is rolled back and no successful update is reported. The use case terminates.
- E5 (from step 5): BA provisioning fails after tenant creation. The tenant remains in its committed state, no invalid BA account is created, and the provisioning failure is recorded for correction. Continue at step 6.

---

<a id="uc-02"></a>

## UC-02 — Manage brand users and role permissions

| Field | Specification |
| :--- | :--- |
| **Use case ID / Name** | UC-02 — Manage brand users and role permissions |
| **Description** | Administer staff accounts and permissions within the brand. |
| **Actors** | Primary: BA. Supporting: target staff account. |
| **Trigger** | The BA requests creation or modification of a brand user or permission assignment. |
| **Preconditions** | The BA is authenticated and authorised to manage the target brand. Requested permissions are within the BA authority. |
| **Postconditions — success** | The validated account/role/scope change is saved and audited; disabling an account revokes its active sessions. |
| **Postconditions — failure** | The previous account and permission assignments remain unchanged after rejection or rollback. |
| **Related behaviour** | «include» Enforce tenant and access scope |
| **Business rules** | BR13, BR11, BR12. |
| **Requirements trace** | FR1.3–FR1.11; FR10.1–FR10.3 |

### Main flow

1. The BA identifies a staff account or supplies details for a new account.
2. The system performs Enforce tenant and access scope for the requester and target account.
3. The BA specifies authorised roles, location/machine scope or an account lifecycle action.
4. The system validates tenant membership and prevents assignments beyond the BA authority.
5. The BA confirms; the system persists the change and revokes all target sessions if the account is disabled.
6. The system records the permission/account change and reports the resulting access scope.

### Alternative flows

- A3 (from step 3): The BA selects a read-only Viewer role; the system grants only permitted dashboard/report access and any separately granted report-export permission. Continue at step 4.
- A3b (from step 3): The BA requests an authorised account reset or lock/unlock action; continue at step 4.

### Exception flows

- E2 (from step 2): The target belongs to another tenant or is outside the BA scope. The system denies the operation and records the attempt; no target data changes. The use case terminates.
- E4 (from step 4): A role, identity or scope value is invalid. The system rejects the proposed assignment; previous permissions remain. Return to step 3.
- E5 (from step 5): Persistence fails. The system rolls back the account/role change and reports failure; no success is claimed. The use case terminates.

---

<a id="uc-03"></a>

## UC-03 — Manage catalog, slots, locations and campaigns

| Field | Specification |
| :--- | :--- |
| **Use case ID / Name** | UC-03 — Manage catalog, slots, locations and campaigns |
| **Description** | Maintain the brand catalogue, operating locations, slot assignments and campaigns. |
| **Actors** | Primary: BA. Supporting: registered machine configuration service. |
| **Trigger** | The BA requests a catalogue, slot, location, price or campaign change. |
| **Preconditions** | The BA is authenticated and authorised for the brand and target resources. Referenced machines/products exist when required. |
| **Postconditions — success** | The change and its history are persisted; existing orders retain their product and price snapshots. |
| **Postconditions — failure** | Invalid changes are rejected or rolled back. A device configuration awaiting acknowledgement is not represented as applied. |
| **Related behaviour** | «include» Configure prices, hours, dose and stock thresholds |
| **Business rules** | BR1, BR2, BR4, BR11, BR13. |
| **Requirements trace** | FR2.1–FR2.11; FR1.4–FR1.5; FR10.2–FR10.3 |

### Main flow

1. The BA selects a catalogue item, location, machine slot or campaign to create or update.
2. The system checks tenant ownership and presents the current authoritative configuration.
3. The BA supplies the proposed values; for slots/campaigns, the system performs Configure prices, hours, dose and stock thresholds as applicable.
4. The system validates product availability, campaign dates, prices and calibration values, and enforces one active bottle per slot and one tenant per machine.
5. The BA confirms; the system saves the new values/configuration version and audit history without modifying existing order snapshots.
6. The system reports the saved change and, where device application is needed, tracks acknowledgement through UC-07.

### Alternative flows

- A1 (from step 1): The BA deactivates a product, slot or campaign instead of creating one; continue at step 2.
- A3 (from step 3): The BA defines time-limited promotional pricing; the system stores validity and targeting rules. Continue at step 4.

### Exception flows

- E2 (from step 2): The resource belongs to another tenant. Access is denied; no configuration changes. The use case terminates.
- E4 (from step 4): A reference, price, date range or slot assignment is invalid. The system preserves the previous values; return to step 3.
- E5 (from step 5): Persistence fails. The system rolls back the change; the previous configuration remains authoritative. The use case terminates.
- E6 (from step 6): The device does not acknowledge the update. The saved desired configuration and unconfirmed application status remain recorded; no applied version is assumed. The use case terminates.

---

<a id="uc-04"></a>

## UC-04 — Browse and select fragrance

| Field | Specification |
| :--- | :--- |
| **Use case ID / Name** | UC-04 — Browse and select fragrance |
| **Description** | Discover an available fragrance and select it for an order. |
| **Actors** | Primary: CU. |
| **Trigger** | The customer starts browsing at a kiosk. |
| **Preconditions** | The kiosk identifies a registered machine; no customer account is required. |
| **Postconditions — success** | The selected available machine/slot/product is passed to order confirmation; no order or payment is created by browsing. |
| **Postconditions — failure** | Unavailable items cannot proceed to ordering; browsing failure creates no payment or dispensing command. |
| **Related behaviour** | «include» View details, price and usage instructions |
| **Business rules** | BR3, BR9; BR13 applies to machine/brand data resolution. |
| **Requirements trace** | FR3.1–FR3.2; FR4.13 |

### Main flow

1. The customer requests the fragrances for the current machine.
2. The system checks machine connectivity, operating mode and current slot/product availability.
3. The system performs View details, price and usage instructions for eligible fragrances, including brand, description, fragrance notes and image.
4. The customer selects a fragrance.
5. The system rechecks the selected item and supplies the selection to UC-05 for confirmation.

### Alternative flows

- A4 (from step 4): The customer requests details for another fragrance or changes the selection; return to step 3.
- A4b (from step 4): The customer leaves without ordering; no order is created and the use case terminates.

### Exception flows

- E2 (from step 2): The machine is offline, disabled, under maintenance or has no available products. The system explains unavailability; no order is created. The use case terminates.
- E5 (from step 5): The selected slot becomes empty or unavailable. The system rejects that selection without creating an order; return to step 2.

---

<a id="uc-05"></a>

## UC-05 — Confirm order and pay by QR

| Field | Specification |
| :--- | :--- |
| **Use case ID / Name** | UC-05 — Confirm order and pay by QR |
| **Description** | Create one fixed-price order and obtain backend-verified payment through its unique QR reference. |
| **Actors** | Primary: CU. Supporting: PP. |
| **Trigger** | The customer confirms a fragrance selection from UC-04. |
| **Preconditions** | The machine/slot/product selection is known; the machine communicates with the backend; payment-provider integration is configured. |
| **Postconditions — success** | The backend records a verified payment and marks the order PAID; dispensing proceeds separately through UC-08. |
| **Postconditions — failure** | No dispensing eligibility is granted by an invalid/unverified payment. Unpaid orders remain PENDING until cancellation or expiry; failure details and provider references remain traceable. |
| **Related behaviour** | «include» Check availability and generate payment QR |
| **Business rules** | BR3, BR4, BR5, BR6, BR9, BR13. |
| **Requirements trace** | FR3.1–FR3.12; FR4.1; NFR3.3 |

### Main flow

1. The customer submits the selected fragrance for confirmation.
2. The system performs Check availability and generate payment QR: it checks the machine/slot/product, fixes tenant, machine, slot, product, price, currency and expiry on a PENDING order, and obtains a unique payment reference and dynamic QR from PP.
3. The system supplies the QR, amount, validity period and usage guidance to the customer.
4. The customer scans the QR and authorises payment with PP.
5. PP sends a payment notification to the backend.
6. The system verifies the signature, unique provider/payment reference, amount, currency and successful transaction status, and checks order eligibility and notification idempotency.
7. The system records payment/history and changes the eligible PENDING order to PAID once; it makes that order available to UC-08 and status tracking in UC-06.

### Alternative flows

- A6 (from step 6): PP repeats a notification already processed. The system returns the prior processing outcome without another state change or dispensing trigger; this notification handling terminates.
- A4 (from step 4): A payment attempt fails while the order is still valid. The system records the failed payment attempt; the order stays PENDING. Return to step 3.

### Exception flows

- E2 (from step 2): The machine is offline/non-operational or the slot/product is unavailable. No order is created; the system rejects confirmation and the use case terminates.
- E2b (from step 2): QR generation fails after order creation. The order remains PENDING with the generation failure recorded; no command is created. It expires if unpaid. The use case terminates.
- E4 (from step 4): The customer cancels before accepted payment, or validity expires unpaid. The system persists CANCELLED or EXPIRED respectively; no dispensing command is permitted. The use case terminates.
- E6 (from step 6): Signature, reference, amount, currency or status validation fails. The notification is rejected and its reason retained; no PAID transition or dispensing command occurs. The order retains its existing state. The use case terminates.
- E6b (from step 6): Payment arrives for an EXPIRED/CANCELLED order or an otherwise ineligible order. The terminal order is not reopened and no spray is issued. The payment anomaly is recorded for UC-16 review. The use case terminates.
- E7 (from step 7): Persistence fails. The payment/state update rolls back; the existing order state remains and no successful transition is acknowledged. Recovery reconciles the provider payment idempotently. The use case terminates.

---

<a id="uc-06"></a>

## UC-06 — Track payment and dispensing status

| Field | Specification |
| :--- | :--- |
| **Use case ID / Name** | UC-06 — Track payment and dispensing status |
| **Description** | Show the authoritative progress and outcome of an order and guide recovery. |
| **Actors** | Primary: CU. Supporting: PP and DEV indirectly through backend-verified events. |
| **Trigger** | The customer requests or continues tracking an order. |
| **Preconditions** | An order and its kiosk/customer tracking context exist; only authorised order information is exposed. |
| **Postconditions — success** | The customer receives the latest known payment/dispensing status and recovery reference when necessary. |
| **Postconditions — failure** | A communication failure does not manufacture a successful payment/spray or change transaction state. |
| **Related behaviour** | «extend» Show recovery guidance *{paid, spray failed}* |
| **Business rules** | BR5, BR6, BR14; BR13 applies to order access. |
| **Requirements trace** | FR3.11–FR3.12; FR4.13–FR4.14; NFR6.2 |

### Main flow

1. The customer requests the status of the current order.
2. The system checks the tracking context and reads the authoritative order/payment/command history.
3. The system reports payment as waiting, successful, failed, cancelled or expired, using the recorded payment attempt and order state.
4. For a paid order, the system supplies positioning guidance and displays the recorded dispensing progress and confirmed result.
5. The system evaluates Show recovery guidance {paid, spray failed}; for failed or uncertain paid orders it supplies a reference and operational recovery instructions.
6. The customer acknowledges completion or continues tracking.

### Alternative flows

- A6 (from step 6): Processing is ongoing; return to step 2.
- A5 (from step 5): The result is UNCERTAIN. The system explicitly states that confirmation is pending human review, provides a reference and creates no retry; continue at step 6.

### Exception flows

- E2 (from step 2): The order does not exist or does not match the tracking context. Access is denied; order data and state remain unchanged. The use case terminates.
- E2b (from step 2): The backend cannot be reached. The system reports that the status cannot currently be refreshed; last known data is not presented as new confirmation. Persisted order state is unchanged. The use case terminates.

---

<a id="uc-07"></a>

## UC-07 — Monitor and configure machines and slots

| Field | Specification |
| :--- | :--- |
| **Use case ID / Name** | UC-07 — Monitor and configure machines and slots |
| **Description** | Observe machine health and apply authorised machine/slot configuration. |
| **Actors** | Primary: OM and DEV. Supporting: TE for permitted monitoring/diagnostic scope. |
| **Trigger** | A heartbeat, telemetry message or device event arrives, or the OM requests monitoring/configuration. |
| **Preconditions** | The machine is registered with a valid device identity. Human operations require an active session and assigned scope. |
| **Postconditions — success** | Validated device observations and command/application status are stored; monitoring reflects connectivity and configuration versions. |
| **Postconditions — failure** | Invalid devices cannot update trusted data. Unconfirmed configuration is retained as unconfirmed rather than applied. |
| **Related behaviour** | «include» Receive heartbeat, telemetry and device events |
| **Business rules** | BR1, BR2, BR9, BR11, BR13. |
| **Requirements trace** | FR5.1–FR5.11; FR2.1–FR2.9; FR1.9 |

### Main flow

1. DEV sends heartbeat, telemetry or an event; alternatively the OM requests the machine status.
2. The system validates device identity or staff scope and performs Receive heartbeat, telemetry and device events.
3. The system stores significant observations, updates last communication time and connectivity classification, and raises relevant conditions through UC-13.
4. The OM requests an authorised machine/slot configuration change or status/diagnostic command.
5. The system validates the change, records its desired configuration/version and dispatches a secure correlated command.
6. DEV validates the command, applies the permitted change and returns acknowledgement/result and its reported configuration version.
7. The system correlates the response, records the outcome and audit history, and presents confirmed and pending status.

### Alternative flows

- A3 (from step 3): Monitoring requires no configuration action; the system returns the observed status and the use case terminates.
- A2 (from step 2): DEV reconnects with buffered events. The system validates and deduplicates them using their identities/timestamps; continue at step 3.

### Exception flows

- E2 (from step 2): Device credentials are revoked/invalid, a message is malformed or the user exceeds scope. The request is rejected; trusted machine data is unchanged and the rejection is recorded. The use case terminates.
- E3 (from step 3): The heartbeat timeout is exceeded. The system records unstable/offline connectivity, blocks new orders for an offline machine and raises an alert; monitoring continues at step 3 on subsequent observations.
- E6 (from step 6): A command is rejected or no acknowledgement arrives. The recorded command remains rejected or unconfirmed with its reason; the applied configuration version is not advanced without confirmation. Continue at step 7.

---

<a id="uc-08"></a>

## UC-08 — Dispense one calibrated spray

| Field | Specification |
| :--- | :--- |
| **Use case ID / Name** | UC-08 — Dispense one calibrated spray |
| **Description** | Execute at most one calibrated customer spray for a backend-confirmed paid order. |
| **Actors** | Primary: DEV. Supporting: backend payment verification and CU receiving the sample. |
| **Trigger** | A backend-verified PAID order becomes eligible for dispatch. |
| **Preconditions** | The order is PAID, no successful spray is already recorded and no active command exists for the order. The addressed device is registered. |
| **Postconditions — success** | One calibrated actuation is executed and a correlated result is sent for UC-09; final DISPENSED status requires successful result recording. |
| **Postconditions — failure** | Unsafe/invalid commands do not actuate. Definite rejection/failure is recorded as FAILED; an unconfirmed outcome becomes UNCERTAIN for human review without a second command. |
| **Related behaviour** | «include» Verify payment, command and safety interlocks |
| **Business rules** | BR5, BR6, BR7, BR8, BR9, BR14. |
| **Requirements trace** | FR4.1–FR4.14; FR5.5–FR5.6; NFR3.4, NFR4.5, NFR2.6 |

### Main flow

1. The system identifies the PAID order and performs Verify payment, command and safety interlocks at dispatch and device acceptance.
2. The system creates the sole active command for that order with command/idempotency identity, target device/slot, HMAC-SHA256 signature, creation time and a 30-second expiry.
3. The system persists dispatch state as DISPENSING and transmits the command over the secure IoT channel.
4. DEV validates signature, target, expiry and deduplication identity, then checks maintenance mode, door, available perfume and critical-error interlocks.
5. DEV sends an acceptance acknowledgement before execution.
6. DEV activates only the addressed slot for one calibrated cycle and durably remembers execution for deduplication.
7. DEV sends the correlated success/failure result and relevant readings; UC-09 records the final outcome.

### Alternative flows

- A4 (from step 4): The same command is redelivered. DEV reports the previously known acknowledgement/result without another actuation; pass the existing outcome to UC-09 and terminate this delivery.

### Exception flows

- E1 (from step 1): Payment is unverified, the order already has an active command, or a spray is already confirmed. The system creates no new command and preserves the current order state; the use case terminates.
- E4 (from step 4): The command is invalid, expired or incorrectly addressed, or an interlock fails. DEV rejects without actuation. The backend records the correlated rejection as FAILED and opens an incident where applicable. The use case terminates.
- E6 (from step 6): DEV reports a definite execution failure. UC-09 persists FAILED, failure evidence and review context; no automatic second command is issued. The use case terminates.
- E5/7 (from step 5 or 7): Delivery/acknowledgement/result cannot be confirmed before timeout. The backend persists UNCERTAIN and an incident; human review is required and no second command is generated. The use case terminates.

---

<a id="uc-09"></a>

## UC-09 — Record confirmed dispensing result

| Field | Specification |
| :--- | :--- |
| **Use case ID / Name** | UC-09 — Record confirmed dispensing result |
| **Description** | Persist a device-confirmed outcome and account for customer consumption exactly once. |
| **Actors** | Primary: DEV. Supporting: inventory and transaction services. |
| **Trigger** | DEV submits a result for a known dispensing command. |
| **Preconditions** | The device is authenticated; the command/order/slot correlation is known. An acknowledgement alone is not a successful execution result. |
| **Postconditions — success** | A confirmed success atomically records the result, order DISPENSED state and one customer-sale stock movement; a definite failure is recorded without a customer-sale deduction. |
| **Postconditions — failure** | Duplicates do not cause another deduction. Invalid results are rejected; failed persistence does not leave a partially completed transaction. |
| **Related behaviour** | «include» Update stock and command / event history |
| **Business rules** | BR6, BR10, BR11, BR12, BR14. |
| **Requirements trace** | FR4.9–FR4.12; FR6.5–FR6.7; FR10.1–FR10.6; NFR3.4 |

### Main flow

1. DEV submits the execution identity, outcome, time, failure code if applicable and relevant sensor readings.
2. The system validates device identity, command/order correlation, result eligibility and whether this result was already applied.
3. The system records the confirmed success evidence and performs Update stock and command / event history in one transaction with the order DISPENSED transition.
4. The system commits the result, one inventory movement and the linked audit/event history.
5. The system acknowledges processing and makes the confirmed outcome available to UC-06, UC-12 and reports.

### Alternative flows

- A2 (from step 2): The same result is already committed. The system returns the committed outcome and creates no additional inventory movement; the use case terminates.
- A3 (from step 3): DEV reports a definite failure. The system records FAILED and the failure evidence, creates review/alert context and performs no customer-sale deduction; continue at step 4.

### Exception flows

- E2 (from step 2): Identity or correlation is invalid, or a result contradicts a committed outcome. The system rejects/quarantines the event for investigation; the existing order and stock remain unchanged. The use case terminates.
- E2b (from step 2): The order is UNCERTAIN. The system retains the late result as evidence but does not automatically resolve the order or deduct stock; UC-16 human review decides the outcome. The use case terminates.
- E4 (from step 4): The result/stock transaction fails. All partial changes roll back. The order is held for review, with UNCERTAIN/review state and incident persisted by recovery; the durable result evidence is retried idempotently without re-actuation. If persistence is unavailable, the last committed state remains and no completion is reported until recovery. The use case terminates.

---

<a id="uc-10"></a>

## UC-10 — Manage batches, bottles and inventory history

| Field | Specification |
| :--- | :--- |
| **Use case ID / Name** | UC-10 — Manage batches, bottles and inventory history |
| **Description** | Maintain traceable inventory batches, individual bottles and their lifecycle history. |
| **Actors** | Primary: IS. Supporting: OM where inventory privileges permit. |
| **Trigger** | Inventory staff receives stock or requests a bottle/batch lifecycle operation. |
| **Preconditions** | The actor is authenticated with inventory permission for the target tenant; the referenced product belongs to that tenant. |
| **Postconditions — success** | Validated batch/bottle data and lifecycle history are committed with unique bottle identifiers. |
| **Postconditions — failure** | Rejected or rolled-back operations preserve the previous quantities, identifiers and lifecycle state. |
| **Related behaviour** | «include» Register bottle ID, quantity and expiry |
| **Business rules** | BR2, BR11, BR12, BR13. |
| **Requirements trace** | FR6.1–FR6.3, FR6.12–FR6.13 |

### Main flow

1. IS supplies a product and batch receipt or requests an update to existing stock.
2. The system validates tenant scope and performs Register bottle ID, quantity and expiry.
3. IS supplies batch number, quantity, receipt/expiry dates and unique bottle/cartridge identities.
4. The system checks identity uniqueness, valid quantities/dates and permitted lifecycle changes.
5. IS confirms; the system commits batch/bottle records and the relevant inventory/audit history.
6. The system returns the resulting available, installed, nearly empty, empty, damaged or expired classification as applicable.

### Alternative flows

- A1 (from step 1): IS requests inventory history only. The system verifies scope and returns receipt, installation, removal, refill, adjustment and disposal history without changes; the use case terminates.
- A3 (from step 3): IS records damage or expiry. The system validates the lifecycle change and prevents that bottle being offered as usable stock; continue at step 4.

### Exception flows

- E2 (from step 2): The product/bottle belongs to another tenant or the actor lacks permission. The system denies the operation without changing inventory. The use case terminates.
- E4 (from step 4): The identity is duplicated or supplied quantity/date/lifecycle transition is invalid. No new stock is committed; return to step 3.
- E5 (from step 5): Persistence fails. The change rolls back and existing stock/history remains authoritative. The use case terminates.

---

<a id="uc-11"></a>

## UC-11 — Install, replace or refill a bottle

| Field | Specification |
| :--- | :--- |
| **Use case ID / Name** | UC-11 — Install, replace or refill a bottle |
| **Description** | Record a safe bottle installation, replacement or refill with traceable quantities. |
| **Actors** | Primary: IS. Supporting: OM/TE for access to a machine under service, and DEV for readings. |
| **Trigger** | IS requests installation, replacement or refill of a selected slot. |
| **Preconditions** | IS is authenticated for the tenant/machine; the slot is protected from customer dispensing during service. The bottle/product and stock record exist. |
| **Postconditions — success** | Exactly one active bottle is associated with the slot, initial/refill quantity is recorded and the full operation history is saved. |
| **Postconditions — failure** | Rejected or uncommitted assignments do not change authoritative stock; a physical/record mismatch leaves the slot unavailable for review. |
| **Related behaviour** | «include» Verify slot and fragrance; record refill and weight |
| **Business rules** | BR1, BR2, BR8, BR11, BR13, BR15. |
| **Requirements trace** | FR6.4, FR6.7–FR6.9, FR6.11–FR6.13; FR2.4; FR8.5 |

### Main flow

1. IS identifies the target machine, slot and service operation.
2. The system checks scope, confirms service access and performs Verify slot and fragrance; record refill and weight.
3. IS identifies the outgoing/incoming bottle where applicable and supplies observed starting quantity or weight and refill details.
4. The system validates product compatibility, bottle availability/expiry, quantities and the one-active-bottle constraint.
5. IS confirms the physical service; the system commits bottle/slot association, quantity changes and history including employee, time, machine, slot and old/new bottle.
6. The system recalculates availability and low-stock state; any machine under maintenance returns to service only through UC-15.

### Alternative flows

- A3 (from step 3): The existing bottle is refilled rather than replaced. IS supplies the added quantity and new measured baseline; continue at step 4.
- A3b (from step 3): The slot has no outgoing bottle because this is its first installation; the system records an installation rather than replacement. Continue at step 4.

### Exception flows

- E2 (from step 2): Scope/service conditions are not satisfied. No service assignment is committed; the use case terminates.
- E4 (from step 4): The bottle is expired, belongs to another tenant, is already installed elsewhere or is incompatible. The previous assignment remains; return to step 3.
- E5 (from step 5): The physical operation cannot be confirmed or saving fails. The logical transaction rolls back. The slot remains unavailable pending reconciliation of physical and recorded stock; the discrepancy is recorded when persistence is available. The use case terminates.

---

<a id="uc-12"></a>

## UC-12 — Monitor and reconcile remaining stock

| Field | Specification |
| :--- | :--- |
| **Use case ID / Name** | UC-12 — Monitor and reconcile remaining stock |
| **Description** | Monitor remaining perfume and reconcile measured and recorded stock. |
| **Actors** | Primary: IS. Supporting: OM and DEV measurements. |
| **Trigger** | IS requests stock review or new consumption/measurement data arrives. |
| **Preconditions** | The actor has scoped inventory access; bottle installation baselines and available consumption/measurement history can be identified. |
| **Postconditions — success** | Remaining stock, low/empty availability and any authorised adjustment are recorded with traceable reasons. |
| **Postconditions — failure** | Unreliable readings do not silently overwrite stock. Rejected/uncommitted adjustments preserve the prior balance. |
| **Related behaviour** | «extend» Adjust inventory *{authorised + reason}* |
| **Business rules** | BR10, BR11, BR12, BR13. |
| **Requirements trace** | FR6.5–FR6.10, FR6.12–FR6.13; FR1.9 |

### Main flow

1. IS requests remaining stock for a permitted brand, location, machine or slot.
2. The system derives estimated remaining quantity from installation/refill baselines and confirmed consumption, keeping diagnostic consumption separate.
3. The system compares the estimate against load-cell/level measurements where available and records low-stock, empty or abnormal-loss conditions.
4. IS reviews discrepancies and, if necessary, requests Adjust inventory {authorised + reason}.
5. The system checks additional adjustment authority and a mandatory reason, then commits the adjustment and its audit/history entry if eligible.
6. The system returns the reconciled view and marks slots unavailable when insufficient perfume remains for one safe spray.

### Alternative flows

- A4 (from step 4): No adjustment is needed. The system retains the recorded balance and proceeds to step 6.
- A3 (from step 3): No level sensor is available. The system uses the consumption-based estimate and identifies its basis; continue at step 4.

### Exception flows

- E3 (from step 3): Measurements are invalid or show abnormal loss. The system retains the previous reliable baseline, flags the discrepancy and raises the appropriate alert; continue at step 4 without an automatic manual adjustment.
- E5 (from step 5): Adjustment permission or reason is missing. The system rejects the adjustment, keeps the prior balance and records the denied operation; return to step 4.
- E5b (from step 5): Persistence fails. The adjustment and audit mutation roll back; the previous balance remains authoritative. The use case terminates.

---

<a id="uc-13"></a>

## UC-13 — Handle alerts and assign service tickets

| Field | Specification |
| :--- | :--- |
| **Use case ID / Name** | UC-13 — Handle alerts and assign service tickets |
| **Description** | Triage alerts and assign accountable service work. |
| **Actors** | Primary: OM. Supporting: TE, IS and the device/event monitoring service. |
| **Trigger** | An operational condition creates an alert or the OM reviews unresolved alerts. |
| **Preconditions** | The alert source can be correlated with a machine/slot/transaction; human handling requires assigned scope. |
| **Postconditions — success** | The deduplicated alert has recorded severity, ownership and handling history; required service tickets are linked and assigned. |
| **Postconditions — failure** | A failed assignment/notification does not falsely resolve an alert; previously committed alert/ticket state remains visible. |
| **Related behaviour** | «extend» Auto-create ticket *{critical alert rule}* |
| **Business rules** | BR8, BR11, BR12, BR13; BR15 applies to restoration. |
| **Requirements trace** | FR7.1–FR7.9; FR8.1–FR8.4, FR8.10 |

### Main flow

1. The system receives a qualifying condition or the OM requests the alert queue.
2. The system validates scope/source, classifies the condition and creates or updates the unresolved alert without duplicate open alerts for the same problem.
3. The system evaluates Auto-create ticket {critical alert rule} and links a ticket when the configured condition holds.
4. The OM acknowledges the alert and specifies the responsible technician/staff, priority and due date, creating a manual ticket if needed.
5. The system persists assignment/history and notifies the responsible users through configured channels.
6. The OM reviews progress; the system records resolution evidence or escalates overdue unresolved work.

### Alternative flows

- A3 (from step 3): The condition is not covered by an automatic ticket rule. The system retains the alert for OM handling; continue at step 4.
- A6 (from step 6): A resolved problem recurs and reopening is authorised. The system reopens the alert and retains history; return to step 4.

### Exception flows

- E2 (from step 2): The caller/source is invalid or outside scope. No unauthorised alert change is accepted; the rejection is recorded. The use case terminates.
- E5 (from step 5): Notification delivery fails after assignment commits. The alert/ticket remains assigned and unresolved; delivery failure is recorded for bounded retry/escalation. Continue at step 6.
- E6 (from step 6): Resolution evidence is insufficient or a critical condition persists. The system keeps the alert/ticket unresolved and the affected machine blocked as required; return to step 4.

---

<a id="uc-14"></a>

## UC-14 — Inspect, diagnose and repair a machine

| Field | Specification |
| :--- | :--- |
| **Use case ID / Name** | UC-14 — Inspect, diagnose and repair a machine |
| **Description** | Inspect and repair a machine through controlled maintenance and diagnostics. |
| **Actors** | Primary: TE and DEV. Supporting: OM and IS when refill support is needed. |
| **Trigger** | An assigned technician begins service on a machine/ticket. |
| **Preconditions** | The technician is authenticated, assigned to the machine/ticket and authorised for requested diagnostic actions. |
| **Postconditions — success** | Inspection evidence, repairs and diagnostic results are saved; the machine remains under maintenance until UC-15 verifies restoration. |
| **Postconditions — failure** | Unsafe diagnostics do not actuate; incomplete or failed repair leaves the ticket open and machine unavailable. |
| **Related behaviour** | «include» Maintenance mode, checklist and test spray |
| **Business rules** | BR8, BR10, BR11, BR13, BR15. Diagnostic sprays use the separately authorised service path; ordinary customer dispensing remains prohibited in maintenance mode. |
| **Requirements trace** | FR8.5–FR8.9, FR8.13; FR1.9; FR6.7 |

### Main flow

1. TE identifies the assigned ticket and machine and requests maintenance access.
2. The system verifies technician authority and performs Maintenance mode, checklist and test spray as the required controlled service behaviour.
3. The system places/confirms the machine in maintenance mode and prevents new customer transactions; TE performs the inspection checklist.
4. TE records findings, corrective actions, replaced components, costs and supporting evidence.
5. For the required test spray, the system checks additional diagnostic authority and diagnostic safety conditions; DEV executes only a specifically authorised diagnostic command and returns its result.
6. The system records the test result and its inventory consumption separately from customer-sale transactions, with a diagnostic audit entry.
7. TE submits the repair evidence; the system retains maintenance status for UC-15 acceptance.

### Alternative flows

- A4 (from step 4): Diagnosis requires refill support. TE requests the permitted IS operation through UC-11; after that operation completes, return to step 4.

### Exception flows

- E2 (from step 2): Technician identity, assignment or permission is invalid. Maintenance/diagnostic access is denied; ticket and machine states are unchanged. The use case terminates.
- E5 (from step 5): Diagnostic authorisation is missing or an applicable safety condition fails. No spray executes; the blocked test is recorded and the machine remains under maintenance. Return to step 4.
- E5b (from step 5): The diagnostic outcome is unknown. No automatic second diagnostic spray is issued; the test is recorded as unconfirmed for investigation, with the machine still under maintenance. The use case terminates.
- E7 (from step 7): Repair or evidence is incomplete. The ticket stays open and the machine remains under maintenance; return to step 3.

---

<a id="uc-15"></a>

## UC-15 — Close ticket and restore operation

| Field | Specification |
| :--- | :--- |
| **Use case ID / Name** | UC-15 — Close ticket and restore operation |
| **Description** | Verify completed maintenance, close the ticket and restore safe operation. |
| **Actors** | Primary: TE and DEV. Supporting: OM. |
| **Trigger** | TE requests ticket closure and return to service after repair. |
| **Preconditions** | The technician has scoped service authority; the ticket contains repair activity and the machine is under maintenance. |
| **Postconditions — success** | The successful checklist and post-maintenance test are recorded, the ticket is closed and the eligible machine returns to active service. |
| **Postconditions — failure** | A failed or unconfirmed verification leaves the machine under maintenance and the ticket open; restoration is not assumed. |
| **Related behaviour** | «include» Record repair and pass post-maintenance test |
| **Business rules** | BR8, BR10, BR11, BR13, BR15. |
| **Requirements trace** | FR8.4, FR8.7–FR8.13; FR6.7; FR2.7 |

### Main flow

1. TE requests closure for the repaired machine/ticket.
2. The system verifies the actor scope and performs Record repair and pass post-maintenance test.
3. TE confirms the required repair details and completed checklist; the system checks for unresolved blocking conditions.
4. The system requests the authorised post-maintenance test; DEV reports its correlated result and current safety/health state.
5. The system records successful verification and any diagnostic consumption separately, and confirms no open critical ticket still blocks service.
6. The system persists ticket closure and restoration approval and obtains confirmation of the active operating state before advertising customer availability.

### Alternative flows

- A3 (from step 3): A required repair detail/checklist item is missing. TE completes it; return to step 3 without closing the ticket.

### Exception flows

- E2 (from step 2): The requester lacks authority. The closure request is denied; ticket and machine state are unchanged. The use case terminates.
- E4 (from step 4): The test fails or its outcome is unconfirmed. The failure/pending evidence is recorded; ticket stays open, machine stays under maintenance and no automatic repeat spray occurs. Continue service through UC-14; this use case terminates.
- E5 (from step 5): A critical fault or another open critical ticket remains. The system records the blocked restoration; the machine remains unavailable and the ticket is not closed by this operation. The use case terminates.
- E6 (from step 6): Persistence or device activation confirmation fails. No successful closure/restoration is claimed; recovery retains/reinstates the unresolved ticket/restoration task and keeps customer availability blocked until verified. The use case terminates.

---

<a id="uc-16"></a>

## UC-16 — Review and reconcile transactions and failures

| Field | Specification |
| :--- | :--- |
| **Use case ID / Name** | UC-16 — Review and reconcile transactions and failures |
| **Description** | Reconcile financial and dispensing evidence and resolve operational failures. |
| **Actors** | Primary: OM and PP. Supporting: DEV execution history; additionally authorised refund approver when required. |
| **Trigger** | An operator reviews a transaction, a provider reconciliation discrepancy or a failed/uncertain paid order. |
| **Preconditions** | The operator has scoped transaction access; refund or other sensitive actions require additional authority. |
| **Postconditions — success** | The review decision and evidence are recorded; eligible refunds are traceable and successful refunds produce REFUNDED state. |
| **Postconditions — failure** | Unresolved uncertainty remains UNCERTAIN; a failed/pending refund is not reported as complete, and review never causes an automatic duplicate spray. |
| **Related behaviour** | «extend» Refund or authorised retry *{policy permits}* |
| **Business rules** | BR5, BR6, BR10, BR11, BR12, BR13, BR14. |
| **Requirements trace** | FR3.12–FR3.15; FR9.3–FR9.5; FR1.9; FR10.3, FR10.6; NFR4.5 |

### Main flow

1. The OM supplies transaction filters or selects an incident/order.
2. The system retrieves scoped order, payment, command/result, inventory and incident history and obtains relevant PP records.
3. The OM compares provider and execution evidence; the system highlights paid-but-unconfirmed transactions and mismatches.
4. For UNCERTAIN orders, the OM records a reasoned decision only when evidence establishes success or definite failure; the system records DISPENSED with one stock deduction or FAILED without customer-sale deduction, retaining the review audit.
5. The OM requests Refund or authorised retry {policy permits}, when applicable.
6. The system checks additional authority, reason, eligibility and idempotency. For an eligible FAILED order it submits a uniquely referenced refund to PP and records the refund request.
7. PP confirms the refund outcome; the system records successful completion as REFUNDED or retains the pending/failed refund record and original order state for follow-up.
8. The system saves reconciliation findings and the end-to-end review trail.

### Alternative flows

- A3 (from step 3): All records reconcile and no recovery is needed. The OM records the finding; continue at step 8.
- A4 (from step 4): The order is not UNCERTAIN; the system preserves its valid state and continues at step 5.
- A5 (from step 5): No refund is requested; continue at step 8.
- A6 (from step 6): An authorised retry is requested. Section 2.9 provides no retry transition from FAILED or UNCERTAIN, so this specification does not issue a second command or reopen a terminal order. The system records the request for policy/design review and permits only supported recovery such as refund. Continue at step 8.

### Exception flows

- E2 (from step 2): Access is out of scope or PP records are unavailable. The system denies access or retains an unresolved reconciliation finding respectively; no financial/order state is changed by missing evidence. The use case terminates.
- E4 (from step 4): Evidence cannot prove whether a spray occurred. UNCERTAIN remains persisted with an open review incident; no repeat command or stock deduction occurs. Continue at step 8.
- E6 (from step 6): Authority, reason or refund eligibility is missing. The request is rejected and audited; the payment/order state remains unchanged. Continue at step 8.
- E7 (from step 7): PP rejects the refund or times out. The system records failed/pending status with the same refund reference; the order does not become REFUNDED without confirmation. Continue at step 8.

---

<a id="uc-17"></a>

## UC-17 — View scoped dashboards and reports

| Field | Specification |
| :--- | :--- |
| **Use case ID / Name** | UC-17 — View scoped dashboards and reports |
| **Description** | Read dashboards and reports within granted scope, with separately authorised export. |
| **Actors** | Primary: VW, BA and PSA. Supporting: OM where its reporting permission is granted. |
| **Trigger** | The user requests a dashboard, report or permitted report export. |
| **Preconditions** | The user is authenticated with report-read permission. Platform-wide queries require PSA authority. |
| **Postconditions — success** | Only authorised data is returned; an export is generated only when export permission is present. No operational/business record is created, modified or deleted by Viewer actions. |
| **Postconditions — failure** | Denied queries/exports disclose no out-of-scope data and leave business records unchanged. |
| **Related behaviour** | «extend» Export CSV / Excel *{export permission}* |
| **Business rules** | BR13, BR12. System-generated access/security logs do not grant the Viewer mutation rights. |
| **Requirements trace** | FR9.1–FR9.11; FR1.11; FR1.4–FR1.5 |

### Main flow

1. The user requests a dashboard/report and supplies time, brand, location, machine or product filters.
2. The system verifies report-read authority and intersects requested filters with the user tenant and assigned scope; only PSA may use platform-wide scope.
3. The system aggregates permitted machine status, transaction/revenue, dispensing outcomes, inventory and incident metrics.
4. The system returns the scoped report and applied filters; the user reviews it.
5. The user optionally requests Export CSV / Excel {export permission}.
6. The system rechecks the same data scope and explicit export permission, then generates the authorised report export.

### Alternative flows

- A4 (from step 4): The user changes report filters; return to step 2.
- A5 (from step 5): No export is requested; the read-only use case terminates.
- A3 (from step 3): No data matches the permitted filters. The system returns an empty report without widening scope; continue at step 4.

### Exception flows

- E2 (from step 2): The request exceeds granted scope. The system denies the request without disclosing other tenants data; no business records change. The use case terminates.
- E6 (from step 6): Export permission is absent or was revoked. No export is produced; business records remain unchanged. The use case terminates.
- E4 (from step 4): A Viewer attempts a create, update, delete, configuration, refund or inventory operation. The system denies that operation and may record a security event; all business records remain unchanged. The use case terminates.
- E6b (from step 6): Export generation fails. No successful export is claimed and source data remains unchanged; the use case terminates.

---

<a id="uc-18"></a>

## UC-18 — Search audit log and end-to-end traceability

| Field | Specification |
| :--- | :--- |
| **Use case ID / Name** | UC-18 — Search audit log and end-to-end traceability |
| **Description** | Search protected audit history and reconstruct complete transaction and security traces. |
| **Actors** | Primary: PSA. Supporting: security/access-management services for authorised investigation. |
| **Trigger** | The PSA searches audit events or investigates an order, device or suspected security incident. |
| **Preconditions** | The PSA is authenticated and authorised for audit investigation. Audit records and correlation identities are available. |
| **Postconditions — success** | The requested protected history and end-to-end trace are returned; any authorised security response is separately audited without altering original evidence. |
| **Postconditions — failure** | Unauthorised or failed requests do not edit/delete audit evidence or silently change access rights. |
| **Related behaviour** | «extend» Investigate security and revoke access *{suspicion}* |
| **Business rules** | BR11, BR12, BR13. |
| **Requirements trace** | FR10.1–FR10.6; FR1.6, FR1.8, FR1.10; FR5.11 |

### Main flow

1. The PSA supplies time, user, machine, action, object, severity or order/payment/command references.
2. The system verifies audit access and validates the search criteria.
3. The system retrieves matching records including actor, tenant, target, timestamp, source and relevant before-and-after values.
4. The system reconstructs the linked order, payment, dispensing command, device result, inventory movement, incident and refund where applicable.
5. The PSA reviews the trace and may invoke Investigate security and revoke access {suspicion}.
6. For an authorised response, the system verifies the target and requested action, revokes the selected account sessions/device access as applicable and creates a new audit record retaining original evidence.
7. The system returns the trace and any recorded investigation/response outcome.

### Alternative flows

- A3 (from step 3): No events match. The system returns an empty result without altering evidence; continue at step 7.
- A5 (from step 5): No suspicion or response request exists; continue at step 7.

### Exception flows

- E2 (from step 2): The requester lacks audit authority. The system denies access and records the attempt where possible; audit/business records are not modified. The use case terminates.
- E4 (from step 4): Part of the trace is missing or a source is unavailable. The system identifies the evidence gap rather than inferring success; original records remain intact. Continue at step 5.
- E6 (from step 6): The response is unauthorised or target validation fails. The system rejects it and preserves existing access state and audit evidence. Continue at step 7.
- E6b (from step 6): Revocation fails. The system records an unresolved security action and does not claim access was revoked; original audit evidence remains unchanged. Continue at step 7.

---

## A.4. Review and test coverage checklist

- Cover every numbered main-flow step and each alternative/exception branch.
- Verify tenant isolation and permission denial for protected staff operations, including direct API requests.
- Verify UC-05 with valid payment, forged signature, incorrect amount/currency/reference, duplicate webhook, expiry, cancellation and late payment.
- Verify UC-08/UC-09 with invalid/expired/duplicate commands, unsafe interlocks, lost acknowledgement/result, duplicate result and failed inventory persistence. Assert at most one successful customer spray and one corresponding customer-sale inventory deduction.
- Verify UNCERTAIN is resolved only through recorded human review and never produces an automatic second dispensing command.
- Verify diagnostic consumption reduces remaining physical stock separately from customer-sale movements and produces no sales revenue.
- Verify UC-15 cannot restore service without checklist completion, confirmed test success and absence of blocking critical incidents.
- Verify Viewer read/export permissions without any permission to create, modify or delete business records.
- Verify audit search links order, payment, command, result, inventory, incident and refund while preserving original evidence.
