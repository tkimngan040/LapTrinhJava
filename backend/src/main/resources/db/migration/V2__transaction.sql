-- =============================================================================
-- V2__transaction.sql — orders, payments, dispensing commands, inventory
--
-- Task M2. Carries the four partial unique indexes of Report section 2.7.4
-- verbatim. Those four are the heart of the design: each one enforces a
-- business rule in the database rather than only in Java, so a race between
-- two threads cannot slip past it.
--
-- A partial unique index is a PostgreSQL feature (an index with a WHERE
-- clause). This is why section 1.5.2 chose PostgreSQL over MySQL: on MySQL the
-- four rules below would have no database-level guard at all.
--
-- Conventions follow V1: primary key named <entity>_id, money and quantities
-- NUMERIC, TIMESTAMPTZ, no updated_at column anywhere, and a CHECK listing
-- exactly the constants of the matching Java enum.
--
-- Every table carries brand_id, which is rule 1 of section 2.7.1 and what
-- makes the Hibernate brand filter of BR13 able to narrow it.
--
-- Columns this file adds beyond the ERD of Figure 2.6, each because a
-- requirement needs it. They are listed here so the figure and the schema can
-- be reconciled deliberately rather than by accident:
--   * ORDERS.payment_ref — the reference printed in the QR code and matched by
--     the provider webhook (FR3.5, FR3.7);
--   * ORDERS.failure_reason — why an order failed, kept after it moves on
--     (FR3.12);
--   * ORDERS.review_note — what the reviewer found when leaving UNCERTAIN
--     (BR14, NFR4.5);
--   * DISPENSE_COMMANDS.inventory_applied — the guard that makes a repeated
--     device result deduct stock once and only once (NFR3.4);
--   * INVENTORY_MOVEMENTS.command_id — end-to-end traceability from order to
--     payment to command to the deduction it caused (FR10.6).
--
-- Still to create, in V4__ops.sql (task M4), because V3 is taken by the
-- refund and audit tables: DEVICE_EVENTS, TELEMETRY_READINGS, INCIDENTS,
-- ALERTS, NOTIFICATIONS, MAINTENANCE_TICKETS, MAINTENANCE_TASKS.
-- =============================================================================

-- Nine states, exactly as Report section 2.9.2 lists them.
--
-- currency is VARCHAR(3) rather than the ERD's CHAR(3): CHAR pads the value
-- with spaces, which would break every equality check on it.
CREATE TABLE orders (
    order_id        BIGSERIAL     PRIMARY KEY,
    brand_id        BIGINT        NOT NULL REFERENCES brands (brand_id),
    machine_id      BIGINT        NOT NULL REFERENCES machines (machine_id),
    slot_id         BIGINT        NOT NULL REFERENCES machine_slots (slot_id),
    product_id      BIGINT        NOT NULL REFERENCES products (product_id),
    status          VARCHAR(20)   NOT NULL,
    price_snapshot  NUMERIC(12,2) NOT NULL,
    currency        VARCHAR(3)    NOT NULL DEFAULT 'VND',
    payment_ref     VARCHAR(80)   NOT NULL,
    expires_at      TIMESTAMPTZ   NOT NULL,
    failure_reason  VARCHAR(200),
    review_note     VARCHAR(400),
    created_at      TIMESTAMPTZ   NOT NULL,
    CONSTRAINT uq_order_payment_ref UNIQUE (payment_ref),
    CONSTRAINT ck_order_status CHECK (status IN (
        'PENDING', 'PAID', 'DISPENSING', 'DISPENSED',
        'FAILED', 'UNCERTAIN', 'CANCELLED', 'EXPIRED', 'REFUNDED')),
    -- BR4: the price is fixed when the order is created, so it is stored on the
    -- order rather than read from the product at any later moment.
    CONSTRAINT ck_order_price CHECK (price_snapshot >= 0)
);

CREATE INDEX ix_orders_brand_created ON orders (brand_id, created_at DESC);
CREATE INDEX ix_orders_machine ON orders (machine_id);
CREATE INDEX ix_orders_status ON orders (status);

CREATE TABLE payments (
    payment_id          BIGSERIAL     PRIMARY KEY,
    brand_id            BIGINT        NOT NULL REFERENCES brands (brand_id),
    order_id            BIGINT        NOT NULL REFERENCES orders (order_id),
    provider_reference  VARCHAR(120)  NOT NULL,
    payment_method      VARCHAR(40)   NOT NULL,
    amount              NUMERIC(12,2) NOT NULL,
    currency            VARCHAR(3)    NOT NULL DEFAULT 'VND',
    status              VARCHAR(20)   NOT NULL,
    paid_at             TIMESTAMPTZ,
    created_at          TIMESTAMPTZ   NOT NULL,
    CONSTRAINT ck_payment_status CHECK (status IN ('SUCCEEDED', 'FAILED', 'REFUNDED')),
    CONSTRAINT ck_payment_amount CHECK (amount >= 0)
);

CREATE INDEX ix_payments_order ON payments (order_id);
CREATE INDEX ix_payments_brand ON payments (brand_id);

-- NFR3.3: the provider may deliver the same webhook twice. The second delivery
-- hits this index and is absorbed, so a payment is never recorded twice. The
-- ERD makes provider_reference unique on its own, and it is: the reference is
-- issued by the provider and is unique in its own namespace.
CREATE UNIQUE INDEX uq_payment_provider_ref
    ON payments (provider_reference);

CREATE TABLE dispense_commands (
    command_id          BIGSERIAL    PRIMARY KEY,
    brand_id            BIGINT       NOT NULL REFERENCES brands (brand_id),
    order_id            BIGINT       NOT NULL REFERENCES orders (order_id),
    slot_id             BIGINT       NOT NULL REFERENCES machine_slots (slot_id),
    command_reference   VARCHAR(80)  NOT NULL,
    idempotency_key     VARCHAR(80)  NOT NULL,
    signature           VARCHAR(120) NOT NULL,
    status              VARCHAR(20)  NOT NULL,
    expires_at          TIMESTAMPTZ  NOT NULL,
    acked_at            TIMESTAMPTZ,
    executed_at         TIMESTAMPTZ,
    failure_reason      TEXT,
    inventory_applied   BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ  NOT NULL,
    CONSTRAINT uq_command_reference UNIQUE (command_reference),
    CONSTRAINT ck_command_status CHECK (status IN (
        'ISSUED', 'ACKNOWLEDGED', 'REJECTED', 'SUCCEEDED', 'FAILED', 'TIMED_OUT'))
);

-- There is no machine_id here, and no dose or spray duration. The ERD reaches
-- the machine through the slot, the spray duration is a property of the slot
-- that calibrates it, and what was actually dispensed is recorded by the
-- INVENTORY_MOVEMENTS row the result produced. Storing any of them again on
-- the command would be a second copy that can disagree with the first.
CREATE INDEX ix_commands_order ON dispense_commands (order_id);
CREATE INDEX ix_commands_slot ON dispense_commands (slot_id);
CREATE INDEX ix_commands_brand ON dispense_commands (brand_id);

-- BR6: a paid order results in at most one successful spray. Only one command
-- per order may be in flight; the partial WHERE lets a new command be issued
-- after human review once the first one has reached a terminal status.
CREATE UNIQUE INDEX uq_command_active_order
    ON dispense_commands (order_id)
    WHERE status IN ('ISSUED', 'ACKNOWLEDGED');

-- NFR3.4: the device may publish the same result twice. The key makes the
-- second one a no-op, so inventory is deducted exactly once.
CREATE UNIQUE INDEX uq_command_idempotency
    ON dispense_commands (idempotency_key);

-- C. Inventory ----------------------------------------------------------------

CREATE TABLE inventory_batches (
    batch_id          BIGSERIAL     PRIMARY KEY,
    brand_id          BIGINT        NOT NULL REFERENCES brands (brand_id),
    product_id        BIGINT        NOT NULL REFERENCES products (product_id),
    batch_number      VARCHAR(80)   NOT NULL,
    quantity_received NUMERIC(10,3) NOT NULL,
    received_at       TIMESTAMPTZ   NOT NULL,
    expiration_date   DATE,
    status            VARCHAR(20)   NOT NULL DEFAULT 'ACTIVE',
    CONSTRAINT uq_batch_number_per_brand UNIQUE (brand_id, batch_number),
    CONSTRAINT ck_batch_quantity CHECK (quantity_received > 0),
    CONSTRAINT ck_batch_status CHECK (status IN ('ACTIVE', 'DEPLETED', 'EXPIRED', 'QUARANTINED'))
);

CREATE INDEX ix_batches_brand ON inventory_batches (brand_id);

CREATE TABLE inventory_bottles (
    bottle_id          BIGSERIAL     PRIMARY KEY,
    brand_id           BIGINT        NOT NULL REFERENCES brands (brand_id),
    batch_id           BIGINT        REFERENCES inventory_batches (batch_id),
    slot_id            BIGINT        REFERENCES machine_slots (slot_id),
    bottle_code        VARCHAR(80)   NOT NULL,
    initial_quantity   NUMERIC(10,3) NOT NULL,
    remaining_quantity NUMERIC(10,3) NOT NULL,
    status             VARCHAR(20)   NOT NULL DEFAULT 'AVAILABLE',
    installed_at       TIMESTAMPTZ,
    removed_at         TIMESTAMPTZ,
    CONSTRAINT uq_bottle_code UNIQUE (bottle_code),
    CONSTRAINT ck_bottle_status CHECK (status IN (
        'AVAILABLE', 'INSTALLED', 'NEARLY_EMPTY', 'EMPTY', 'DAMAGED', 'EXPIRED')),
    -- Remaining volume can never go negative; the service refuses the deduction
    -- first, and this constraint is the backstop.
    CONSTRAINT ck_bottle_remaining CHECK (remaining_quantity >= 0),
    CONSTRAINT ck_bottle_initial CHECK (initial_quantity > 0)
);

CREATE INDEX ix_bottles_brand ON inventory_bottles (brand_id);
CREATE INDEX ix_bottles_batch ON inventory_bottles (batch_id);

-- BR2: a slot holds at most one installed bottle at a time. The partial WHERE
-- is what allows the same slot to be reused after the old bottle is removed.
CREATE UNIQUE INDEX uq_bottle_active_slot
    ON inventory_bottles (slot_id)
    WHERE slot_id IS NOT NULL AND status = 'INSTALLED';

CREATE TABLE inventory_movements (
    movement_id     BIGSERIAL     PRIMARY KEY,
    brand_id        BIGINT        NOT NULL REFERENCES brands (brand_id),
    bottle_id       BIGINT        NOT NULL REFERENCES inventory_bottles (bottle_id),
    user_id         BIGINT        REFERENCES users (user_id),
    command_id      BIGINT        REFERENCES dispense_commands (command_id),
    movement_type   VARCHAR(20)   NOT NULL,
    quantity        NUMERIC(10,3) NOT NULL,
    quantity_before NUMERIC(10,3) NOT NULL,
    quantity_after  NUMERIC(10,3) NOT NULL,
    reason          VARCHAR(300),
    created_at      TIMESTAMPTZ   NOT NULL,
    -- BR10: only a confirmed customer spray reduces sale inventory. A
    -- DIAGNOSTIC movement is recorded separately and excluded from sales.
    CONSTRAINT ck_movement_type CHECK (movement_type IN (
        'INSTALL', 'REFILL', 'REMOVE', 'DISPENSE', 'DIAGNOSTIC', 'ADJUST', 'DISPOSE')),
    -- The ERD marks the reason mandatory for an adjustment: an adjustment is
    -- the one movement with no document behind it, so it must carry its own.
    CONSTRAINT ck_movement_adjust_reason CHECK (
        movement_type <> 'ADJUST' OR (reason IS NOT NULL AND btrim(reason) <> '')),
    -- The arithmetic has to agree with itself, whoever wrote the row.
    CONSTRAINT ck_movement_arithmetic CHECK (quantity_after = quantity_before + quantity),
    CONSTRAINT ck_movement_after_nonneg CHECK (quantity_after >= 0)
);

CREATE INDEX ix_movements_bottle ON inventory_movements (bottle_id);
CREATE INDEX ix_movements_command ON inventory_movements (command_id);
CREATE INDEX ix_movements_brand ON inventory_movements (brand_id);
