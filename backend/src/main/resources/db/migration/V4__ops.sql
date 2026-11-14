-- =====================================================================
-- V4: Operational schema
-- Source: ERD Figure 2.6
-- Existing tables from V1-V3 are reused.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. DEVICE EVENTS
-- ---------------------------------------------------------------------

CREATE TABLE device_events (
    event_id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    brand_id         BIGINT NOT NULL REFERENCES brands(brand_id),
    machine_id       BIGINT NOT NULL REFERENCES machines(machine_id),
    event_type       VARCHAR(100) NOT NULL,
    event_reference  VARCHAR(255) NOT NULL,
    event_data       JSONB,
    occurred_at      TIMESTAMPTZ NOT NULL,
    received_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_device_event_ref UNIQUE (event_reference)
);

CREATE INDEX idx_device_events_machine_time
    ON device_events (machine_id, occurred_at DESC);


-- ---------------------------------------------------------------------
-- 2. TELEMETRY READINGS
-- ---------------------------------------------------------------------

CREATE TABLE telemetry_readings (
    reading_id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    brand_id             BIGINT NOT NULL REFERENCES brands(brand_id),
    machine_id           BIGINT NOT NULL REFERENCES machines(machine_id),
    slot_id              BIGINT REFERENCES machine_slots(slot_id),
    reading_reference    VARCHAR(255) NOT NULL,
    weight_g             NUMERIC(12,3),
    estimated_remaining  NUMERIC(12,3),
    door_open            BOOLEAN,
    leak_detected        BOOLEAN,
    actuator_state       VARCHAR(50),
    power_status         VARCHAR(50),
    occurred_at          TIMESTAMPTZ NOT NULL,
    received_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_telemetry_machine_reading
        UNIQUE (machine_id, reading_reference)
);

CREATE INDEX idx_telemetry_machine_time
    ON telemetry_readings (machine_id, occurred_at DESC);

CREATE INDEX idx_telemetry_slot
    ON telemetry_readings (slot_id);


-- ---------------------------------------------------------------------
-- 3. INCIDENTS
-- ---------------------------------------------------------------------

CREATE TABLE incidents (
    incident_id       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    brand_id          BIGINT NOT NULL REFERENCES brands(brand_id),
    order_id          BIGINT REFERENCES orders(order_id),
    machine_id        BIGINT NOT NULL REFERENCES machines(machine_id),
    assigned_user_id  BIGINT REFERENCES users(user_id),
    incident_type     VARCHAR(100) NOT NULL,
    severity          VARCHAR(30) NOT NULL,
    status            VARCHAR(30) NOT NULL DEFAULT 'OPEN',
    description       TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at       TIMESTAMPTZ
);

CREATE INDEX idx_incidents_machine
    ON incidents (machine_id);

CREATE INDEX idx_incidents_order
    ON incidents (order_id);

CREATE INDEX idx_incidents_assigned
    ON incidents (assigned_user_id);


-- ---------------------------------------------------------------------
-- 4. ALERTS
-- ---------------------------------------------------------------------

CREATE TABLE alerts (
    alert_id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    brand_id          BIGINT NOT NULL REFERENCES brands(brand_id),
    machine_id        BIGINT NOT NULL REFERENCES machines(machine_id),
    incident_id       BIGINT REFERENCES incidents(incident_id),
    assigned_user_id  BIGINT REFERENCES users(user_id),
    alert_type        VARCHAR(100) NOT NULL,
    severity          VARCHAR(30) NOT NULL,
    status            VARCHAR(30) NOT NULL DEFAULT 'OPEN',
    message           TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    acknowledged_at   TIMESTAMPTZ,
    resolved_at       TIMESTAMPTZ
);

CREATE INDEX idx_alerts_machine
    ON alerts (machine_id);

CREATE INDEX idx_alerts_incident
    ON alerts (incident_id);

CREATE INDEX idx_alerts_assigned
    ON alerts (assigned_user_id);


-- ---------------------------------------------------------------------
-- 5. NOTIFICATIONS
-- ---------------------------------------------------------------------

CREATE TABLE notifications (
    notification_id    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    brand_id           BIGINT NOT NULL REFERENCES brands(brand_id),
    user_id            BIGINT NOT NULL REFERENCES users(user_id),
    alert_id           BIGINT REFERENCES alerts(alert_id),
    notification_type  VARCHAR(50) NOT NULL,
    message            TEXT,
    status             VARCHAR(30) NOT NULL DEFAULT 'UNREAD',
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at            TIMESTAMPTZ
);

CREATE INDEX idx_notifications_user_status
    ON notifications (user_id, status);

CREATE INDEX idx_notifications_alert
    ON notifications (alert_id);


-- ---------------------------------------------------------------------
-- 6. MAINTENANCE TICKETS
-- ---------------------------------------------------------------------

CREATE TABLE maintenance_tickets (
    ticket_id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    brand_id          BIGINT NOT NULL REFERENCES brands(brand_id),
    machine_id        BIGINT NOT NULL REFERENCES machines(machine_id),
    alert_id          BIGINT REFERENCES alerts(alert_id),
    assigned_user_id  BIGINT REFERENCES users(user_id),
    category          VARCHAR(100),
    priority          VARCHAR(30) NOT NULL DEFAULT 'MEDIUM',
    status            VARCHAR(30) NOT NULL DEFAULT 'OPEN',
    description       TEXT,
    corrective_action TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    due_at            TIMESTAMPTZ,
    completed_at      TIMESTAMPTZ
);

CREATE INDEX idx_tickets_machine
    ON maintenance_tickets (machine_id);

CREATE INDEX idx_tickets_alert
    ON maintenance_tickets (alert_id);

CREATE INDEX idx_tickets_assigned
    ON maintenance_tickets (assigned_user_id);


-- ---------------------------------------------------------------------
-- 7. MAINTENANCE TASKS
-- ---------------------------------------------------------------------

CREATE TABLE maintenance_tasks (
    task_id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    brand_id          BIGINT NOT NULL REFERENCES brands(brand_id),
    ticket_id         BIGINT NOT NULL REFERENCES maintenance_tickets(ticket_id),
    assigned_user_id  BIGINT REFERENCES users(user_id),
    sort_order        INTEGER NOT NULL,
    task_name         VARCHAR(255) NOT NULL,
    task_result       TEXT,
    status            VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    completed_at      TIMESTAMPTZ,
    CONSTRAINT uq_maintenance_tasks_ticket_order
        UNIQUE (ticket_id, sort_order)
);

CREATE INDEX idx_tasks_assigned
    ON maintenance_tasks (assigned_user_id);
