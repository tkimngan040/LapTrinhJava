ALTER TABLE alerts
    DROP CONSTRAINT alerts_alert_type_check,
    DROP CONSTRAINT alerts_status_check,
    ALTER COLUMN slot_id DROP NOT NULL,
    ALTER COLUMN bottle_id DROP NOT NULL,
    ALTER COLUMN remaining_quantity_ml DROP NOT NULL,
    ALTER COLUMN threshold_ml DROP NOT NULL,
    ADD COLUMN incident_key VARCHAR(180),
    ADD COLUMN severity VARCHAR(20) NOT NULL DEFAULT 'WARNING',
    ADD COLUMN condition_active BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN acknowledged_by BIGINT REFERENCES users(id),
    ADD COLUMN acknowledged_at TIMESTAMPTZ,
    ADD COLUMN assigned_to BIGINT REFERENCES users(id),
    ADD COLUMN resolved_by BIGINT REFERENCES users(id),
    ADD COLUMN resolution VARCHAR(1000),
    ADD COLUMN reopened_by BIGINT REFERENCES users(id),
    ADD COLUMN reopened_at TIMESTAMPTZ,
    ADD COLUMN reopen_count INTEGER NOT NULL DEFAULT 0;
UPDATE alerts SET incident_key = 'LOW_STOCK:BOTTLE:' || bottle_id,
    condition_active = status <> 'RESOLVED';
ALTER TABLE alerts ALTER COLUMN incident_key SET NOT NULL;
ALTER TABLE alerts ADD CONSTRAINT ck_alert_type CHECK (alert_type IN ('OFFLINE','LOW_STOCK','DOOR_OPEN','LEAK','DISPENSE_FAILED')),
    ADD CONSTRAINT ck_alert_status CHECK (status IN ('OPEN','ACKNOWLEDGED','ASSIGNED','RESOLVED')),
    ADD CONSTRAINT ck_alert_severity CHECK (severity IN ('INFO','WARNING','CRITICAL'));
DROP INDEX uq_open_low_stock_bottle;
CREATE UNIQUE INDEX uq_active_alert_incident ON alerts(incident_key) WHERE status <> 'RESOLVED';

CREATE TABLE maintenance_tickets (
    id BIGSERIAL PRIMARY KEY,
    brand_id BIGINT NOT NULL REFERENCES brands(id),
    machine_id BIGINT NOT NULL REFERENCES machines(id),
    title VARCHAR(160) NOT NULL,
    description VARCHAR(1000),
    category VARCHAR(30) NOT NULL,
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('LOW','NORMAL','HIGH','CRITICAL')),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('INFO','WARNING','CRITICAL')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('OPEN','ASSIGNED','IN_PROGRESS','REPAIRED','TESTING','CLOSED')),
    due_at TIMESTAMPTZ,
    created_by BIGINT REFERENCES users(id),
    assigned_to BIGINT REFERENCES users(id),
    started_at TIMESTAMPTZ,
    repair_result VARCHAR(1000),
    repaired_at TIMESTAMPTZ,
    repaired_by BIGINT REFERENCES users(id),
    test_command_id BIGINT REFERENCES dispense_commands(id),
    closed_at TIMESTAMPTZ,
    closed_by BIGINT REFERENCES users(id),
    previous_operating_status VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);
ALTER TABLE alerts ADD COLUMN maintenance_ticket_id BIGINT REFERENCES maintenance_tickets(id);
CREATE INDEX ix_tickets_brand ON maintenance_tickets(brand_id);
CREATE INDEX ix_tickets_machine_active ON maintenance_tickets(machine_id) WHERE status <> 'CLOSED';
CREATE INDEX ix_alerts_ticket ON alerts(maintenance_ticket_id);
