# Appendix A. Use Case Specifications

This appendix is the detailed companion to Section 2.5 of Chapter 2. Every use case drawn in the Use Case Diagram (Section 2.4) has exactly one entry here, using the template defined in Section 2.5.1 and the writing conventions of Section 2.5.2.

## A.1. Scope

This appendix specifies behaviour only. Business rules BR1–BR15 are defined in Section 2.1.13, functional requirements in Section 2.1, and non-functional requirements in Section 2.2; all three are referenced here by identifier. Order states follow the state machine of Section 2.9.2: `PENDING`, `PAID`, `DISPENSING`, `DISPENSED`, `FAILED`, `UNCERTAIN`, `CANCELLED`, `EXPIRED` and `REFUNDED`.

## A.2. Actors

| Actor | Abbr. | Type | Description |
| :--- | :--- | :--- | :--- |
| Platform Super Administrator | PSA | Human | Manages all brand tenants, platform settings and system-wide audit. |
| Brand Administrator | BA | Human | Manages one brand: catalogue, users, machines, locations and campaigns. |
| Operations Manager | OM | Human | Monitors daily operation, handles alerts, incidents and reconciliation. |
| Technician | TE | Human | Inspects, repairs and returns machines to service. |
| Inventory Staff | IS | Human | Manages batches, bottles, refills and stock reconciliation. |
| Viewer | VW | Human | Read-only access to dashboards and reports within an authorised scope. |
| Customer / Kiosk User | CU | Human | Selects a fragrance, pays by QR and receives one sample spray. |
| Payment Provider | PP | External system | Generates payment QR codes and reports transaction results. |
| IoT Device | DEV | External system | Executes dispensing commands; reports heartbeat, telemetry, events and results. |

**Authenticated User** is an abstract actor generalising PSA, BA, OM, TE, IS and VW. The generalisation covers authentication only; business permissions remain specific to each concrete role.

## A.3. Use case index

| ID | Use case | Primary actor | Related FR |
| :--- | :--- | :--- | :--- |
| UC-00 | Sign in / Sign out | Authenticated User | FR1.3, FR1.8, FR1.10 |
| UC-01 | Onboard and manage tenants and platform settings | PSA | FR1.1, FR1.2 |
| UC-02 | Manage brand users and role permissions | BA | FR1.3–FR1.9, FR1.11 |
| UC-03 | Manage catalog, slots, locations and campaigns | BA | FR2.2, FR2.3, FR2.5, FR2.10, FR2.11 |
| UC-04 | Browse and select fragrance | CU | FR3.1 |
| UC-05 | Confirm order and pay by QR | CU | FR3.2–FR3.9, FR3.11 |
| UC-06 | Track payment and dispensing status | CU | FR3.11, FR4.13, FR4.14 |
| UC-07 | Monitor and configure machines and slots | OM | FR2.6, FR2.7, FR5.1–FR5.4, FR5.10, FR5.11 |
| UC-08 | Dispense one calibrated spray | DEV | FR4.1–FR4.8 |
| UC-09 | Record confirmed dispensing result | DEV | FR4.9–FR4.12, FR5.6, FR6.7 |
| UC-10 | Manage batches, bottles and inventory history | IS | FR6.1–FR6.3, FR6.13 |
| UC-11 | Install, replace or refill a bottle | IS | FR6.4, FR6.11 |
| UC-12 | Monitor and reconcile remaining stock | IS | FR6.5, FR6.6, FR6.8–FR6.10, FR6.12 |
| UC-13 | Handle alerts and assign service tickets | OM | FR7.1–FR7.9 |
| UC-14 | Inspect, diagnose and repair a machine | TE | FR8.5–FR8.9 |
| UC-15 | Close ticket and restore operation | TE | FR8.11–FR8.13 |
| UC-16 | Review and reconcile transactions and failures | OM | FR3.13–FR3.15, FR4.12, FR9.5 |
| UC-17 | View scoped dashboards and reports | VW, BA, PSA | FR1.11, FR9.1–FR9.11 |
| UC-18 | Search audit log and end-to-end traceability | PSA | FR10.4–FR10.6 |

---

## A.4. Detailed specifications

### UC-00 — Sign in / Sign out

| Field | Value |
| :--- | :--- |
| Functional area | All |
| Primary actor | Authenticated User (PSA, BA, OM, TE, IS, VW) |
| Supporting actors | — |
| Related FR | FR1.3, FR1.8, FR1.10 |
| Related BR | BR13 |
| Preconditions | The user has an account that is neither locked nor disabled. |
| Postconditions (success) | An authenticated session exists, carrying the user's tenant and role scope. |
| Postconditions (failure) | No session is created; the attempt is written to the audit log. |

**Trigger:** The user opens the management portal and submits the sign-in form, or selects *Sign out*.

**Main Flow**

1. The user enters an email address and a password.
2. The system verifies the password against the stored BCrypt hash.
3. The system confirms that the account is active and loads its tenant and roles.
4. The system issues a signed access token carrying the user identifier, tenant, roles and the account's current `token_version`.
5. The system records the successful sign-in in the audit log.
6. The system opens the home screen permitted by the user's roles.
7. When the user selects *Sign out*, the system invalidates the session on the client and records the sign-out.

**Alternative Flows**

- **A1 — Two-factor authentication enabled.** After step 3, the system requests a one-time code. The flow continues at step 4 only when the code is valid.
- **A2 — Forgotten password.** At step 1, the user requests a reset. The system sends a time-limited reset link to the registered address and returns to step 1.

**Exception Flows**

- **E1 — Wrong credentials.** At step 2, verification fails. The system shows a generic error that does not reveal whether the email exists, records the failure and increments the failed-attempt counter.
- **E2 — Account locked or disabled.** At step 3, the account is not active. The system refuses the sign-in and records the attempt.
- **E3 — Token revoked.** On any later request, the token's `token_version` is lower than the account's current value because the account was disabled or its permissions changed (FR1.8). The system rejects the request and returns the user to the sign-in screen.

---

### UC-01 — Onboard and manage tenants and platform settings

| Field | Value |
| :--- | :--- |
| Functional area | 1. Brand, Users and Catalog |
| Primary actor | Platform Super Administrator |
| Supporting actors | — |
| Related FR | FR1.1, FR1.2 |
| Related BR | BR1, BR13 |
| Relationship | «extend» Provision Brand Administrator *{tenant onboarding}* |
| Preconditions | The PSA is signed in with platform-wide scope. |
| Postconditions (success) | The tenant record is created or updated; a newly onboarded tenant has a Brand Administrator account. |
| Postconditions (failure) | No tenant data is changed. |

**Trigger:** The PSA opens *Brands* to add a new perfume brand or to change an existing one.

**Main Flow**

1. The PSA selects *Add Brand*.
2. The system displays the tenant form.
3. The PSA enters the brand name, logo, description and initial status.
4. The system validates that the brand name is unique.
5. The system creates the tenant and records the action in the audit log.
6. **[extension point: tenant onboarding]** The system offers to provision the first Brand Administrator.
7. The PSA enters the administrator's name and email; the system creates the account scoped to the new tenant and sends an invitation.

**Alternative Flows**

- **A1 — Update an existing tenant.** At step 1, the PSA selects an existing brand. The system loads its record; the PSA edits it and the flow continues at step 4. Step 6 does not apply.
- **A2 — Suspend a tenant.** The PSA changes the tenant status to suspended. The system blocks sign-in for every account of that tenant and stops accepting orders on its machines, then records the change.

**Exception Flows**

- **E1 — Duplicate brand name.** At step 4, the name already exists. The system rejects the form and highlights the field.
- **E2 — Administrator email already in use.** At step 7, the email belongs to another account. The system rejects the provisioning; the tenant remains created without an administrator, and the PSA may repeat step 7.

---

### UC-02 — Manage brand users and role permissions

| Field | Value |
| :--- | :--- |
| Functional area | 1. Brand, Users and Catalog |
| Primary actor | Brand Administrator |
| Supporting actors | — |
| Related FR | FR1.3–FR1.9, FR1.11 |
| Related BR | BR13 |
| Relationship | «include» Enforce tenant and access scope |
| Preconditions | The BA is signed in and scoped to exactly one tenant. |
| Postconditions (success) | User accounts, roles and permissions within the tenant are updated; the change is written to the audit log. |
| Postconditions (failure) | No account or permission is changed. |

**Trigger:** The BA opens *Users & Roles*.

**Main Flow**

1. The system lists the users of the BA's tenant only. **[include: Enforce tenant and access scope]**
2. The BA selects *Invite User* and enters the name, email and one or more roles: Operations Manager, Technician, Inventory Staff or Viewer.
3. The BA optionally restricts the scope to selected locations or machines (FR1.7).
4. The system validates the input and creates the account bound to the BA's tenant.
5. The system sends an invitation and records the change in the audit log.

**Alternative Flows**

- **A1 — Change roles or scope.** The BA edits an existing user's roles or scope. The system saves the change and increments the user's `token_version`, so that tokens issued under the old permissions stop working (FR1.8).
- **A2 — Deactivate, lock or reset an account.** The BA selects the action. The system applies it, increments `token_version` and records it (FR1.6).
- **A3 — Viewer account.** At step 2 the BA selects the Viewer role. The system grants read access to dashboards and reports within the chosen scope and no create, update or delete permission (FR1.11).

**Exception Flows**

- **E1 — Cross-tenant access.** The BA requests or modifies a user that belongs to another brand, for example by changing an identifier in the request. The system returns *403 Forbidden*, changes nothing and writes a security entry to the audit log (FR1.5, BR13).
- **E2 — Privilege escalation.** The BA attempts to grant the Brand Administrator or Platform Super Administrator role. The system refuses; these roles can be granted only by the PSA.

---

### UC-03 — Manage catalog, slots, locations and campaigns

| Field | Value |
| :--- | :--- |
| Functional area | 1. Brand, Users and Catalog |
| Primary actor | Brand Administrator |
| Supporting actors | — |
| Related FR | FR2.2, FR2.3, FR2.5, FR2.10, FR2.11 |
| Related BR | BR1, BR3, BR4 |
| Relationship | «include» Configure prices, hours, dose and stock thresholds |
| Preconditions | The BA is signed in; the target machines belong to the BA's tenant. |
| Postconditions (success) | Catalogue, slot assignment, location and campaign records are updated; price and threshold changes are written to the audit log. |
| Postconditions (failure) | No catalogue or slot configuration is changed. |

**Trigger:** The BA opens *Perfume Products*, *Machines* or *Settings → Brands*.

**Main Flow**

1. The BA creates or edits a product: name, description, fragrance notes, image and default price per spray (FR2.10).
2. The BA opens a machine and selects a slot.
3. The BA assigns a product to the slot. **[include: Configure prices, hours, dose and stock thresholds]** The BA sets the slot price (or leaves it empty to use the product price), the spray duration, the low-stock threshold and availability.
4. The system validates the values and saves the configuration.
5. The system records every price and threshold change in the audit log.
6. Customers see the new configuration on the next catalogue load; orders already created keep the price fixed at their creation (BR4).

**Alternative Flows**

- **A1 — Location.** The BA creates a location and assigns machines to it (FR2.2).
- **A2 — Campaign.** The BA creates a time-limited campaign that applies a discount or a free-trial price to selected products or machines (FR2.11). The effective price at order creation includes the campaign and is then fixed on the order.

**Exception Flows**

- **E1 — Invalid value.** At step 4, a price is negative or a spray duration is outside the safe range. The system rejects the change.
- **E2 — Machine of another brand.** At step 2, the machine does not belong to the BA's tenant. The system returns *403 Forbidden* (BR1, BR13).

---

### UC-04 — Browse and select fragrance

| Field | Value |
| :--- | :--- |
| Functional area | 2. Customer Experience and Payment |
| Primary actor | Customer / Kiosk User |
| Supporting actors | — |
| Related FR | FR3.1 |
| Related BR | BR3 |
| Relationship | «include» View details, price and usage instructions |
| Preconditions | The machine is online and operational; at least one slot holds an available product. |
| Postconditions (success) | A fragrance is selected and its price is displayed to the customer. |
| Postconditions (failure) | No selection is made; the kiosk returns to the home screen. |

**Trigger:** The customer touches the kiosk screen.

**Main Flow**

1. The kiosk requests the available catalogue for this machine.
2. The system returns only products installed in available slots of this online, operational machine (BR3).
3. The kiosk displays the fragrance cards with image, brand, name and price.
4. The customer selects a fragrance. **[include: View details, price and usage instructions]**
5. The kiosk displays the description, fragrance notes, price per spray and usage instructions.
6. The customer confirms the selection; the flow continues in UC-05.

**Alternative Flows**

- **A1 — Change selection.** At step 5, the customer goes back and selects another fragrance.
- **A2 — Inactivity.** The customer does not interact for the idle timeout. The kiosk returns to the home screen; nothing is recorded.

**Exception Flows**

- **E1 — Machine becomes unavailable.** During steps 1–5, the machine goes offline or enters maintenance. The kiosk shows a *temporarily unavailable* screen and does not allow an order (BR9).
- **E2 — No available product.** At step 2, every slot is empty or disabled. The kiosk shows the unavailable screen.

---

### UC-05 — Confirm order and pay by QR

| Field | Value |
| :--- | :--- |
| Functional area | 2. Customer Experience and Payment |
| Primary actor | Customer / Kiosk User |
| Supporting actors | Payment Provider |
| Related FR | FR3.2–FR3.9, FR3.11 |
| Related BR | BR3, BR4, BR5, BR9 |
| Relationship | «include» Check availability and generate payment QR |
| Preconditions | A fragrance has been selected (UC-04); the machine is online; the selected slot holds enough perfume for one safe spray. |
| Postconditions (success) | The order is `PAID`, carrying the product and price captured at creation. |
| Postconditions (failure) | The order is `EXPIRED` or `CANCELLED`; no dispensing command is created. |

**Trigger:** The customer confirms the selected fragrance on the kiosk screen.

**Main Flow**

1. The system re-checks that the machine is online and the selected slot is available. **[include: Check availability and generate payment QR]**
2. The system creates an order in state `PENDING`, storing the tenant, machine, slot, product, price, currency and expiry time.
3. The system fixes the product and the price on the order so that later price changes do not affect it (BR4).
4. The system requests a payment reference and a QR code from the Payment Provider.
5. The system displays the QR code and the remaining time.
6. The customer pays with their own banking or e-wallet application.
7. The Payment Provider sends a payment notification to the system.
8. The system verifies the notification signature, payment reference, amount, currency and status (FR3.7).
9. The system marks the order `PAID` and displays the result.
10. The system hands control to UC-08.

**Alternative Flows**

- **A1 — Payment not completed in time.** At step 6, the expiry time passes. The system marks the order `EXPIRED` and returns to the home screen.
- **A2 — Customer cancels.** At step 5 or 6, the customer cancels. The system marks the order `CANCELLED`.
- **A3 — Duplicate notification.** At step 7, a notification arrives for an order already `PAID`. The system records the duplicate and changes nothing; no second command is created (FR3.8).
- **A4 — Payment attempt fails.** At step 7, the provider reports a failed attempt. The system records it on the payment record; the order stays `PENDING` and the customer may retry until the order expires.

**Exception Flows**

- **E1 — Invalid signature.** At step 8, verification fails. The system rejects the notification, leaves the order unpaid and writes a security entry to the audit log.
- **E2 — Amount or currency mismatch.** At step 8, the paid amount or currency differs from the order. The system holds the order for manual review (UC-16) and does not authorise dispensing.
- **E3 — Machine goes offline after payment.** Between steps 7 and 10, the machine stops communicating. The system does not dispense and routes the order to review (UC-16).

---

### UC-06 — Track payment and dispensing status

| Field | Value |
| :--- | :--- |
| Functional area | 2. Customer Experience and Payment |
| Primary actor | Customer / Kiosk User |
| Supporting actors | — |
| Related FR | FR3.11, FR4.13, FR4.14 |
| Related BR | BR5, BR14 |
| Relationship | «extend» Show recovery guidance *{paid, spray failed}* |
| Preconditions | An order exists for the current kiosk session. |
| Postconditions (success) | The customer has seen the final payment and dispensing status. |
| Postconditions (failure) | The customer has seen recovery guidance and the order has entered the review workflow. |

**Trigger:** An order is created in UC-05.

**Main Flow**

1. The kiosk displays the payment status: waiting, successful, failed, cancelled or expired (FR3.11).
2. When payment succeeds, the kiosk shows the instruction to place a test strip or wrist in the spraying area (FR4.13).
3. The kiosk displays the dispensing status as processing (FR4.14).
4. The system reports the final result from UC-09.
5. The kiosk displays *success* and returns to the home screen after a short delay.

**Alternative Flows**

- **A1 — Payment expired or cancelled.** At step 1, the kiosk displays the final state and returns to the home screen. Steps 2–5 do not apply.

**Exception Flows**

- **E1 — Paid but spray failed or uncertain.** At step 4, the result is `FAILED` or `UNCERTAIN`. **[extension point: paid, spray failed]** The kiosk displays the order reference and recovery guidance: the order has been recorded and will be reviewed for a refund. The kiosk never offers a second spray on its own (BR14).
- **E2 — Kiosk loses connection.** The kiosk cannot reach the backend. It displays the order reference and the recovery guidance; the backend still records whatever result arrives.

---

### UC-07 — Monitor and configure machines and slots

| Field | Value |
| :--- | :--- |
| Functional area | 3. Machine and Secure Dispensing |
| Primary actor | Operations Manager |
| Supporting actors | IoT Device |
| Related FR | FR2.6, FR2.7, FR5.1–FR5.4, FR5.10, FR5.11 |
| Related BR | BR1, BR9 |
| Relationship | «include» Receive heartbeat, telemetry and device events |
| Preconditions | The OM is signed in; the machines belong to the OM's authorised scope. |
| Postconditions (success) | Connectivity, operating mode and slot status reflect the latest device data; configuration changes are written to the audit log. |
| Postconditions (failure) | No configuration is changed. |

**Trigger:** The OM opens *Machines*, or a device publishes a message.

**Main Flow**

1. Each machine publishes heartbeat, telemetry and events over MQTT. **[include: Receive heartbeat, telemetry and device events]**
2. The system validates each message against the registered device identity and the message schema.
3. The system updates the machine's connectivity, last-seen time, firmware version and slot readings.
4. The OM opens the machine list and selects a machine.
5. The system displays connectivity, operating mode, firmware and configuration versions, slot status and recent events (FR2.6).
6. The OM enables or disables the machine or an individual slot (FR2.7).
7. The system applies the change, sends the configuration to the device and records it in the audit log.

**Alternative Flows**

- **A1 — Heartbeat missed.** At step 1, no heartbeat arrives within the configured interval. The system marks the machine `OFFLINE`, stops offering it to customers (BR9) and raises an alert (UC-13).
- **A2 — Machine returns.** A heartbeat arrives from an `OFFLINE` machine. The system marks it online; it accepts orders again only if its operating status is active.

**Exception Flows**

- **E1 — Unregistered or revoked device.** At step 2, the sender is unknown or revoked. The system discards the message and records a security event (FR5.11).
- **E2 — Malformed message.** At step 2, the payload fails schema validation. The system discards it and logs the error without changing machine state.

---

### UC-08 — Dispense one calibrated spray

| Field | Value |
| :--- | :--- |
| Functional area | 3. Machine and Secure Dispensing |
| Primary actor | IoT Device |
| Supporting actors | — |
| Related FR | FR4.1–FR4.8 |
| Related BR | BR5, BR6, BR7, BR8 |
| Relationship | «include» Verify payment, command and safety interlocks |
| Preconditions | The order is `PAID`, verified by the backend; the machine is online and not in maintenance mode. |
| Postconditions (success) | Exactly one calibrated spray has been executed on the selected slot and its result has been reported. |
| Postconditions (failure) | No spray has been executed; the order is routed to review and no second command is issued automatically. |

**Trigger:** The backend confirms a successful payment (UC-05, step 9).

**Main Flow**

1. The system confirms that the order is `PAID` and that no active command exists for it. **[include: Verify payment, command and safety interlocks]**
2. The system creates a command with a unique identifier, idempotency key, target machine and slot, creation time, thirty-second expiry and HMAC-SHA256 signature. The order becomes `DISPENSING`.
3. The system publishes the command to the machine's command topic.
4. The machine verifies the signature, the expiry, the addressing and whether the command has already been executed.
5. The machine checks the safety interlocks: door closed, slot not empty, no critical fault, not in maintenance (BR8).
6. The machine publishes an acknowledgement.
7. The machine activates the selected slot for exactly one calibrated cycle.
8. The machine publishes the execution result with the relevant sensor readings.
9. The system hands control to UC-09.

**Alternative Flows**

- **A1 — Command already executed.** At step 4, the identifier has already been processed. The machine rejects the command and reports the duplicate. No second spray occurs.
- **A2 — Command expired.** At step 4, the expiry has passed. The machine rejects it. The order becomes `FAILED` and is routed to review; no replacement command is issued automatically.

**Exception Flows**

- **E1 — Invalid signature or wrong address.** At step 4, verification fails. The machine rejects the command and the system writes a security entry to the audit log.
- **E2 — Safety interlock blocks execution.** At step 5, a condition fails. The machine refuses to spray and reports the reason. The order becomes `FAILED` and is routed to UC-16.
- **E3 — No response.** After step 3 or step 6, no acknowledgement or result arrives within the timeout. The order becomes `UNCERTAIN`, an incident is opened for manual review and **no** other command is issued (BR14).
- **E4 — Spray reported as failed.** At step 8, the machine reports a failure code. The order becomes `FAILED`, UC-06 shows recovery guidance and the order is routed to UC-16.

---

### UC-09 — Record confirmed dispensing result

| Field | Value |
| :--- | :--- |
| Functional area | 3. Machine and Secure Dispensing |
| Primary actor | IoT Device |
| Supporting actors | — |
| Related FR | FR4.9–FR4.12, FR5.6, FR6.7 |
| Related BR | BR6, BR10, BR11, BR14 |
| Relationship | «include» Update stock and command / event history |
| Preconditions | A dispensing command has been sent and a result or a timeout has been observed. |
| Postconditions (success) | The order is `DISPENSED`; the slot's estimated stock is reduced by one spray; command and event history is updated. |
| Postconditions (failure) | The order is held for review; customer-sale stock is not reduced. |

**Trigger:** The machine publishes a result on the `result` topic (UC-08, step 8).

**Main Flow**

1. The system receives the result and correlates it with its command through the command identifier (FR5.6).
2. The system checks the idempotency key so that the same result is processed only once.
3. The system records the result, execution time and sensor readings on the command.
4. On success, the system marks the order `DISPENSED`. **[include: Update stock and command / event history]**
5. The system reduces the estimated remaining quantity of the installed bottle and writes an inventory movement of type *sale* (BR10).
6. The system reports the final status to the kiosk (UC-06).

**Alternative Flows**

- **A1 — Duplicate result.** At step 2, the result was already processed. The system ignores it; stock is reduced once only.
- **A2 — Diagnostic spray.** The command was a technician test spray (UC-14). The system records a movement of type *diagnostic*, which is excluded from sales (BR10).

**Exception Flows**

- **E1 — Uncertain result.** No result arrives before the timeout, or the result contradicts the sensor readings. The order becomes `UNCERTAIN`; stock is **not** reduced; no new command is generated; an incident is opened (BR14).
- **E2 — Database failure during recording.** Step 4 or 5 fails. The transaction is rolled back and the order is held for review rather than reported as complete.

---

### UC-10 — Manage batches, bottles and inventory history

| Field | Value |
| :--- | :--- |
| Functional area | 4. Inventory and Refill |
| Primary actor | Inventory Staff |
| Supporting actors | — |
| Related FR | FR6.1–FR6.3, FR6.13 |
| Related BR | BR1, BR11 |
| Relationship | «include» Register bottle ID, quantity and expiry |
| Preconditions | The IS is signed in and scoped to one tenant. |
| Postconditions (success) | Batch and bottle records are created or updated with status and expiry. |
| Postconditions (failure) | No inventory record is changed. |

**Trigger:** A delivery of perfume bottles arrives at the warehouse.

**Main Flow**

1. The IS opens *Inventory* and selects *Add Stock*.
2. The IS selects the product and enters the batch number, quantity received, received date and expiration date.
3. The system creates the batch.
4. **[include: Register bottle ID, quantity and expiry]** The IS scans or enters the code of each bottle and its initial quantity.
5. The system creates the bottle records in warehouse status and writes a *receipt* movement for each.
6. The system displays the updated stock.

**Alternative Flows**

- **A1 — Review history.** The IS opens *Stock History* and filters by time, product or movement type. The system displays installation, refill, removal, adjustment and disposal records (FR6.13).
- **A2 — Dispose of a bottle.** The IS marks a bottle as disposed with a reason. The system records the movement.

**Exception Flows**

- **E1 — Duplicate bottle code.** At step 4, the code already exists. The system rejects that bottle and keeps the others.
- **E2 — Expired batch.** At step 2, the expiration date is in the past. The system rejects the batch.

---

### UC-11 — Install, replace or refill a bottle

| Field | Value |
| :--- | :--- |
| Functional area | 4. Inventory and Refill |
| Primary actor | Inventory Staff |
| Supporting actors | — |
| Related FR | FR6.4, FR6.11 |
| Related BR | BR2, BR11 |
| Relationship | «include» Verify slot and fragrance; record refill and weight |
| Preconditions | The IS is signed in; the machine and slot belong to the IS's scope. |
| Postconditions (success) | The slot holds exactly one active bottle; the operation is recorded with operator, time, machine, slot, previous bottle and new bottle. |
| Postconditions (failure) | The slot assignment is unchanged. |

**Trigger:** A refill task is assigned, or a low-stock alert is raised for a slot.

**Main Flow**

1. The IS opens the refill task and goes to the machine.
2. The IS opens the cabinet; the machine reports the door open and stops accepting orders (BR8).
3. The IS removes the old bottle and scans its code.
4. The IS scans the new bottle. **[include: Verify slot and fragrance; record refill and weight]**
5. The system checks that the new bottle's product matches the product configured for the slot.
6. The system records removal of the old bottle and installation of the new one in a single transaction, so that the slot never holds two active bottles (BR2).
7. The machine reports the measured weight; the system stores it as the starting quantity.
8. The IS closes the cabinet; the machine resumes operation when the door is closed.

**Alternative Flows**

- **A1 — First installation.** The slot is empty. Step 3 does not apply.

**Exception Flows**

- **E1 — Wrong fragrance.** At step 5, the product does not match the slot. The system refuses the installation and asks the IS to install the correct bottle or change the slot configuration (UC-03).
- **E2 — Bottle already installed elsewhere.** At step 4, the scanned bottle is active in another slot. The partial unique index rejects the operation.

---

### UC-12 — Monitor and reconcile remaining stock

| Field | Value |
| :--- | :--- |
| Functional area | 4. Inventory and Refill |
| Primary actor | Inventory Staff |
| Supporting actors | — |
| Related FR | FR6.5, FR6.6, FR6.8–FR6.10, FR6.12 |
| Related BR | BR10, BR11 |
| Relationship | «extend» Adjust inventory *{authorised + reason}* |
| Preconditions | At least one bottle is installed in a slot. |
| Postconditions (success) | Estimated remaining quantities are current; low-stock and leakage alerts have been raised where thresholds were crossed. |
| Postconditions (failure) | No stock figure is changed. |

**Trigger:** Telemetry arrives from a machine, or the IS opens *Inventory*.

**Main Flow**

1. The system computes each slot's estimated remaining quantity from confirmed sprays.
2. The system compares the estimate with the weight reported by the slot sensor.
3. When the estimate falls below the slot's threshold, the system raises a low-stock alert.
4. The IS opens the inventory view and reviews remaining quantities by machine and slot.
5. **[extension point: authorised + reason]** If a correction is needed, the IS adjusts the quantity and enters a mandatory reason (FR6.12).
6. The system records an *adjustment* movement with the quantity before and after, the user and the reason.

**Alternative Flows**

- **A1 — No correction needed.** At step 5, figures are consistent. The use case ends without changes.

**Exception Flows**

- **E1 — Abnormal loss.** At step 2, the sensor shows a drop much larger than the confirmed sprays explain. The system raises a leakage or abnormal-loss alert to the OM (UC-13).
- **E2 — Adjustment without reason or permission.** At step 5, the reason is empty or the user lacks adjustment permission. The system refuses the change.

---

### UC-13 — Handle alerts and assign service tickets

| Field | Value |
| :--- | :--- |
| Functional area | 5. Alerts and Maintenance |
| Primary actor | Operations Manager |
| Supporting actors | — |
| Related FR | FR7.1–FR7.9 |
| Related BR | BR11 |
| Relationship | «extend» Auto-create ticket *{critical alert rule}* |
| Preconditions | The OM is signed in; at least one alert exists within the OM's scope. |
| Postconditions (success) | The alert is acknowledged, assigned or resolved; a maintenance ticket exists where the critical rule applies. |
| Postconditions (failure) | The alert remains open and unassigned. |

**Trigger:** The system raises an alert: machine offline, low stock, leakage, sensor fault or dispensing failure.

**Main Flow**

1. The system creates the alert with type, severity, machine and time, and notifies the responsible users.
2. **[extension point: critical alert rule]** If the alert is critical, the system creates a maintenance ticket automatically.
3. The OM opens *Notifications / Alerts* and filters by severity, category or machine.
4. The OM opens an alert and reviews its cause and the related machine.
5. The OM acknowledges the alert; the system records the acknowledgement time.
6. The OM assigns the alert, or its ticket, to a technician or to inventory staff.
7. When the cause is fixed, the alert is marked resolved and the system records the resolution time.

**Alternative Flows**

- **A1 — Create a ticket manually.** At step 6, the OM selects *Create Maintenance Ticket*.
- **A2 — Escalation.** An alert is not acknowledged within the configured time. The system raises its severity and notifies the next level.

**Exception Flows**

- **E1 — Duplicate alerts.** The same condition repeats. The system groups the repeats under the open alert instead of creating new ones.

---

### UC-14 — Inspect, diagnose and repair a machine

| Field | Value |
| :--- | :--- |
| Functional area | 5. Alerts and Maintenance |
| Primary actor | Technician |
| Supporting actors | IoT Device |
| Related FR | FR8.5–FR8.9 |
| Related BR | BR8, BR10, BR15 |
| Relationship | «include» Maintenance mode, checklist and test spray |
| Preconditions | A ticket is assigned to the technician; the technician has authenticated for maintenance functions (FR8.6). |
| Postconditions (success) | The machine is in maintenance mode; diagnostic results, corrective actions and replaced components are recorded; test sprays are recorded separately from sales. |
| Postconditions (failure) | The machine remains in its previous state and the ticket stays open. |

**Trigger:** The technician starts work on an assigned ticket.

**Main Flow**

1. The technician opens the ticket and selects *Start Maintenance*.
2. **[include: Maintenance mode, checklist and test spray]** The system places the machine in maintenance mode; it stops accepting customer orders.
3. The system presents the inspection checklist for the ticket category.
4. The technician inspects the machine and records each checklist item.
5. The technician runs a diagnostic test spray; the system sends a signed command flagged as diagnostic.
6. The machine executes the test and reports the result; the system records it separately from customer transactions (BR10).
7. The technician records the diagnosis, corrective action, replaced components, cost and evidence.

**Alternative Flows**

- **A1 — Parts not available.** At step 7, the repair cannot be finished. The technician records the status; the machine stays in maintenance and the ticket stays open.

**Exception Flows**

- **E1 — Machine offline.** At step 2 or step 5, the machine cannot be reached. The technician records the visit; the test step is postponed.
- **E2 — Not authorised.** A user who is not the assigned technician attempts maintenance functions. The system refuses (FR8.6).

---

### UC-15 — Close ticket and restore operation

| Field | Value |
| :--- | :--- |
| Functional area | 5. Alerts and Maintenance |
| Primary actor | Technician |
| Supporting actors | IoT Device |
| Related FR | FR8.11–FR8.13 |
| Related BR | BR15 |
| Relationship | «include» Record repair and pass post-maintenance test |
| Preconditions | Repair work is complete and recorded; the required checklist is complete. |
| Postconditions (success) | The post-maintenance test has passed, the ticket is closed and the machine accepts customer orders again. |
| Postconditions (failure) | The ticket stays open and the machine remains in maintenance mode. |

**Trigger:** The technician selects *Mark as Completed* on the ticket.

**Main Flow**

1. The system checks that every mandatory checklist item is recorded.
2. **[include: Record repair and pass post-maintenance test]** The system runs the post-maintenance test: heartbeat, sensor readings and one diagnostic spray.
3. The machine reports a successful test.
4. The system closes the ticket and records the repair result (FR8.12).
5. The system takes the machine out of maintenance mode; it accepts orders again (BR15).
6. The system adds the ticket to the machine's maintenance history (FR8.13) and resolves the related alerts.

**Alternative Flows**

- **A1 — Machine stays disabled.** The OM has disabled the machine for another reason. At step 5, the machine leaves maintenance mode but remains disabled.

**Exception Flows**

- **E1 — Checklist incomplete.** At step 1, a mandatory item is missing. The system refuses to close the ticket.
- **E2 — Post-maintenance test fails.** At step 3, the test fails. The ticket stays open, the machine stays in maintenance mode and **does not** return to service (BR15).

---

### UC-16 — Review and reconcile transactions and failures

| Field | Value |
| :--- | :--- |
| Functional area | 6. Transactions, Reports and Audit |
| Primary actor | Operations Manager |
| Supporting actors | Payment Provider |
| Related FR | FR3.13–FR3.15, FR4.12, FR9.5 |
| Related BR | BR5, BR6, BR14 |
| Relationship | «extend» Refund or authorised retry *{policy permits}* |
| Preconditions | At least one transaction requires review, or a reconciliation period has been selected. |
| Postconditions (success) | The transaction is reconciled; a refund or an authorised retry is recorded where policy permits. |
| Postconditions (failure) | The transaction stays in the review queue. |

**Trigger:** An order enters `FAILED` or `UNCERTAIN`, or the OM starts a periodic reconciliation.

**Main Flow**

1. The OM opens the review queue, which lists orders paid but not confirmed as dispensed (FR9.5).
2. The OM opens an order and reviews its payment, command, acknowledgement, result and sensor readings.
3. The OM decides the outcome: the spray did happen, or it did not.
4. If it did, the OM records the decision and the order becomes `DISPENSED`; stock is reduced at this point.
5. If it did not, **[extension point: policy permits]** the OM issues a refund through the Payment Provider; the order becomes `REFUNDED`, or the OM authorises a single manual retry.
6. The system records the decision, the user and the reason in the audit log.

**Alternative Flows**

- **A1 — Periodic reconciliation.** The OM selects a period. The system compares internal payments with the Payment Provider's records and lists every mismatch (FR3.14).

**Exception Flows**

- **E1 — Refund rejected by the provider.** At step 5, the provider refuses the refund. The order stays in the queue with the provider's reason.
- **E2 — Retry not permitted.** At step 5, a manual retry is requested for an order that already has a confirmed spray. The system refuses, because one paid order may produce at most one successful spray (BR6).

---

### UC-17 — View scoped dashboards and reports

| Field | Value |
| :--- | :--- |
| Functional area | 6. Transactions, Reports and Audit |
| Primary actor | Viewer, Brand Administrator, Platform Super Administrator |
| Supporting actors | — |
| Related FR | FR1.11, FR9.1–FR9.11 |
| Related BR | BR13 |
| Relationship | «extend» Export CSV / Excel *{export permission}* |
| Preconditions | The user is signed in with a defined reporting scope. |
| Postconditions (success) | The requested report is displayed within the user's authorised scope; an export file is produced where the user holds export permission. |
| Postconditions (failure) | No report data is displayed. |

**Trigger:** The user opens *Dashboard* or *Reports*.

**Main Flow**

1. The system determines the user's scope: the whole platform for PSA, one brand for BA, the granted locations or machines for VW.
2. The user selects a report and filters by period, brand, location, machine or product (FR9.9).
3. The system computes the report from data inside the scope only.
4. The system displays KPIs, trends, machine status, top products and inventory status.
5. **[extension point: export permission]** If the user holds export permission, the user selects *Export* and the system produces a CSV or Excel file (FR9.10).

**Alternative Flows**

- **A1 — No data.** At step 3, no record matches the filters. The system displays an empty-state message.

**Exception Flows**

- **E1 — Out-of-scope request.** A Viewer, or a BA, requests data outside the granted scope, for example by changing the brand filter in the request. The system returns *403 Forbidden* and records the attempt (BR13).
- **E2 — Modification attempt by a Viewer.** A Viewer calls any create, update or delete operation. The system refuses it (FR1.11).
- **E3 — Platform-wide report requested by a non-PSA user.** The system refuses (FR9.11).

---

### UC-18 — Search audit log and end-to-end traceability

| Field | Value |
| :--- | :--- |
| Functional area | 6. Transactions, Reports and Audit |
| Primary actor | Platform Super Administrator |
| Supporting actors | — |
| Related FR | FR10.4–FR10.6 |
| Related BR | BR11, BR12 |
| Relationship | «extend» Investigate security and revoke access *{suspicion}* |
| Preconditions | The PSA is signed in with platform-wide scope. |
| Postconditions (success) | Matching audit records are displayed; an order can be traced end to end from payment through command, device result, stock deduction and refund. |
| Postconditions (failure) | No audit record is displayed and none is modified. |

**Trigger:** The PSA opens *Audit Logs*, or investigates a specific order.

**Main Flow**

1. The PSA filters the audit log by time, user, machine, action, object or severity (FR10.5).
2. The system displays matching records with actor, tenant, action, target, time, source and before-and-after values.
3. The PSA enters an order reference.
4. The system displays the trace: order, payment, command, acknowledgement, result, inventory movement, incident and refund where present (FR10.6).
5. **[extension point: suspicion]** If the PSA suspects misuse, the PSA locks the account involved and revokes its sessions; the system increments its `token_version` and records the action.

**Alternative Flows**

- **A1 — Export.** The PSA exports the filtered records for an external investigation.

**Exception Flows**

- **E1 — Attempt to edit or delete an audit record.** Any user, including a PSA, tries to modify or delete a record through the application. No such operation exists; the request is refused and the attempt is itself recorded (BR12, FR10.4).

---

## A.5. Traceability

Every use case above carries the identifiers of the functional requirements it realises. The same identifiers are used in Section 2.1 and are reused in the test results table of Section 3.7, so that a requirement can be followed from specification through design to verification.
