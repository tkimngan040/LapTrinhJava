-- Inventory management: keep V1/V2 checksums intact.
-- A bottle occupies its slot until explicitly removed, including when empty,
-- nearly empty, damaged or expired. Clearing slot_id releases the slot.
DROP INDEX uq_bottle_active_slot;
CREATE UNIQUE INDEX uq_bottle_active_slot
    ON inventory_bottles (slot_id) WHERE slot_id IS NOT NULL;

ALTER TABLE inventory_movements
    ADD COLUMN machine_id BIGINT REFERENCES machines (id),
    ADD COLUMN previous_bottle_id BIGINT REFERENCES inventory_bottles (id),
    ADD COLUMN new_bottle_id BIGINT REFERENCES inventory_bottles (id),
    ADD COLUMN quantity_before_ml INTEGER,
    ADD COLUMN quantity_after_ml INTEGER;

-- Old rows have no before/after baseline; preserve them rather than inventing one.
ALTER TABLE inventory_movements ADD CONSTRAINT ck_adjustment_reason
    CHECK (movement_type <> 'ADJUST' OR (reason IS NOT NULL AND length(btrim(reason)) > 0));

-- Backstop for concurrent/repeated confirmed device results.
CREATE UNIQUE INDEX uq_inventory_dispense_command
    ON inventory_movements (command_id)
    WHERE command_id IS NOT NULL AND movement_type = 'DISPENSE';

CREATE INDEX ix_bottles_batch ON inventory_bottles (batch_id);
