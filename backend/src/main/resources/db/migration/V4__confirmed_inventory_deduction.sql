-- Distinguish authorised diagnostic commands from paid customer commands.
ALTER TABLE dispense_commands
    ADD COLUMN purpose VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER',
    ADD COLUMN requested_by BIGINT REFERENCES users (id),
    ALTER COLUMN order_id DROP NOT NULL,
    ADD CONSTRAINT ck_command_purpose CHECK (purpose IN ('CUSTOMER', 'DIAGNOSTIC')),
    ADD CONSTRAINT ck_command_order_scope CHECK (
        (purpose = 'CUSTOMER' AND order_id IS NOT NULL)
        OR (purpose = 'DIAGNOSTIC' AND order_id IS NULL AND requested_by IS NOT NULL));

-- One consumption entry per persisted command, including diagnostics. The
-- command's uq_command_idempotency already makes duplicate device keys one command.
DROP INDEX uq_inventory_dispense_command;
CREATE UNIQUE INDEX uq_inventory_command_consumption
    ON inventory_movements (command_id)
    WHERE command_id IS NOT NULL AND movement_type IN ('DISPENSE', 'DIAGNOSTIC');

CREATE TABLE alerts (
    id BIGSERIAL PRIMARY KEY,
    brand_id BIGINT NOT NULL REFERENCES brands (id),
    machine_id BIGINT NOT NULL REFERENCES machines (id),
    slot_id BIGINT NOT NULL REFERENCES machine_slots (id),
    bottle_id BIGINT NOT NULL REFERENCES inventory_bottles (id),
    alert_type VARCHAR(20) NOT NULL CHECK (alert_type = 'LOW_STOCK'),
    status VARCHAR(20) NOT NULL CHECK (status IN ('OPEN', 'RESOLVED')),
    remaining_quantity_ml INTEGER NOT NULL,
    threshold_ml INTEGER NOT NULL,
    message VARCHAR(300) NOT NULL,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);
CREATE UNIQUE INDEX uq_open_low_stock_bottle
    ON alerts (bottle_id) WHERE status = 'OPEN' AND alert_type = 'LOW_STOCK';
CREATE INDEX ix_alerts_brand ON alerts (brand_id);
