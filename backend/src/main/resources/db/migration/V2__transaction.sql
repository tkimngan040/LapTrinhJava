-- =============================================================================
-- V2__transaction.sql — orders, payments, dispensing commands, inventory
--
-- DRAFT, owned by task M2 (Tra My). Carries the four partial unique indexes of
-- Report section 2.7.4 verbatim. Those four are the heart of the design: each
-- one enforces a business rule in the database rather than only in Java, so a
-- race between two threads cannot slip past it.
--
-- A partial unique index is a PostgreSQL feature (an index with a WHERE
-- clause). This is why section 1.5.2 chose PostgreSQL over MySQL: on MySQL the
-- four rules below would have no database-level guard at all.
-- =============================================================================

-- Nine states, exactly as Report section 2.9.2 lists them.
CREATE TABLE orders (
    id              BIGSERIAL PRIMARY KEY,
    brand_id        BIGINT       NOT NULL REFERENCES brands (id),
    machine_id      BIGINT       NOT NULL REFERENCES machines (id),
    slot_id         BIGINT       NOT NULL REFERENCES machine_slots (id),
    product_id      BIGINT       NOT NULL REFERENCES products (id),
    status          VARCHAR(20)  NOT NULL,
    price_snapshot  BIGINT       NOT NULL,
    currency        VARCHAR(3)   NOT NULL DEFAULT 'VND',
    payment_ref     VARCHAR(80)  NOT NULL,
    expires_at      TIMESTAMPTZ  NOT NULL,
    failure_reason  VARCHAR(200),
    review_note     VARCHAR(400),
    created_at      TIMESTAMPTZ  NOT NULL,
    updated_at      TIMESTAMPTZ  NOT NULL,
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
    id                  BIGSERIAL PRIMARY KEY,
    order_id            BIGINT       NOT NULL REFERENCES orders (id),
    provider            VARCHAR(40)  NOT NULL,
    provider_reference  VARCHAR(120) NOT NULL,
    amount              BIGINT       NOT NULL,
    currency            VARCHAR(3)   NOT NULL DEFAULT 'VND',
    status              VARCHAR(20)  NOT NULL,
    paid_at             TIMESTAMPTZ,
    created_at          TIMESTAMPTZ  NOT NULL,
    updated_at          TIMESTAMPTZ  NOT NULL,
    CONSTRAINT ck_payment_status CHECK (status IN ('SUCCEEDED', 'FAILED', 'REFUNDED'))
);

CREATE INDEX ix_payments_order ON payments (order_id);

-- NFR3.3: the provider may deliver the same webhook twice. The second delivery
-- hits this index and is absorbed, so a payment is never recorded twice.
CREATE UNIQUE INDEX uq_payment_provider_ref
    ON payments (provider, provider_reference);

CREATE TABLE dispense_commands (
    id                  BIGSERIAL PRIMARY KEY,
    order_id            BIGINT       NOT NULL REFERENCES orders (id),
    machine_id          BIGINT       NOT NULL REFERENCES machines (id),
    slot_id             BIGINT       NOT NULL REFERENCES machine_slots (id),
    idempotency_key     VARCHAR(80)  NOT NULL,
    dose_ml             INTEGER      NOT NULL,
    spray_duration_ms   INTEGER      NOT NULL,
    signature           VARCHAR(120) NOT NULL,
    status              VARCHAR(20)  NOT NULL,
    issued_at           TIMESTAMPTZ  NOT NULL,
    expires_at          TIMESTAMPTZ  NOT NULL,
    acknowledged_at     TIMESTAMPTZ,
    completed_at        TIMESTAMPTZ,
    result_code         VARCHAR(60),
    failure_reason      VARCHAR(200),
    inventory_applied   BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ  NOT NULL,
    updated_at          TIMESTAMPTZ  NOT NULL,
    CONSTRAINT ck_command_status CHECK (status IN (
        'ISSUED', 'ACKNOWLEDGED', 'REJECTED', 'SUCCEEDED', 'FAILED', 'TIMED_OUT'))
);

CREATE INDEX ix_commands_order ON dispense_commands (order_id);
CREATE INDEX ix_commands_machine ON dispense_commands (machine_id);

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
    id              BIGSERIAL PRIMARY KEY,
    brand_id        BIGINT       NOT NULL REFERENCES brands (id),
    product_id      BIGINT       NOT NULL REFERENCES products (id),
    batch_number    VARCHAR(80)  NOT NULL,
    quantity        INTEGER      NOT NULL,
    received_date   DATE         NOT NULL,
    expiry_date     DATE,
    created_at      TIMESTAMPTZ  NOT NULL,
    updated_at      TIMESTAMPTZ  NOT NULL,
    CONSTRAINT uq_batch_number_per_brand UNIQUE (brand_id, batch_number)
);

CREATE TABLE inventory_bottles (
    id                  BIGSERIAL PRIMARY KEY,
    batch_id            BIGINT       REFERENCES inventory_batches (id),
    product_id          BIGINT       NOT NULL REFERENCES products (id),
    slot_id             BIGINT       REFERENCES machine_slots (id),
    bottle_code         VARCHAR(80)  NOT NULL,
    initial_quantity_ml INTEGER      NOT NULL,
    remaining_quantity_ml INTEGER    NOT NULL,
    status              VARCHAR(20)  NOT NULL DEFAULT 'AVAILABLE',
    installed_at        TIMESTAMPTZ,
    removed_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ  NOT NULL,
    updated_at          TIMESTAMPTZ  NOT NULL,
    CONSTRAINT uq_bottle_code UNIQUE (bottle_code),
    CONSTRAINT ck_bottle_status CHECK (status IN (
        'AVAILABLE', 'INSTALLED', 'NEARLY_EMPTY', 'EMPTY', 'DAMAGED', 'EXPIRED')),
    -- Remaining volume can never go negative; the service refuses the deduction
    -- first, and this constraint is the backstop.
    CONSTRAINT ck_bottle_remaining CHECK (remaining_quantity_ml >= 0)
);

-- BR2: a slot holds at most one installed bottle at a time. The partial WHERE
-- is what allows the same slot to be reused after the old bottle is removed.
CREATE UNIQUE INDEX uq_bottle_active_slot
    ON inventory_bottles (slot_id)
    WHERE slot_id IS NOT NULL AND status = 'INSTALLED';

CREATE TABLE inventory_movements (
    id              BIGSERIAL PRIMARY KEY,
    bottle_id       BIGINT       NOT NULL REFERENCES inventory_bottles (id),
    slot_id         BIGINT       REFERENCES machine_slots (id),
    command_id      BIGINT       REFERENCES dispense_commands (id),
    performed_by    BIGINT       REFERENCES users (id),
    movement_type   VARCHAR(20)  NOT NULL,
    quantity_ml     INTEGER      NOT NULL,
    reason          VARCHAR(300),
    created_at      TIMESTAMPTZ  NOT NULL,
    updated_at      TIMESTAMPTZ  NOT NULL,
    -- BR10: only a confirmed customer spray reduces sale inventory. A
    -- DIAGNOSTIC movement is recorded separately and excluded from sales.
    CONSTRAINT ck_movement_type CHECK (movement_type IN (
        'INSTALL', 'REFILL', 'REMOVE', 'DISPENSE', 'DIAGNOSTIC', 'ADJUST', 'DISPOSE'))
);

CREATE INDEX ix_movements_bottle ON inventory_movements (bottle_id);
CREATE INDEX ix_movements_command ON inventory_movements (command_id);
