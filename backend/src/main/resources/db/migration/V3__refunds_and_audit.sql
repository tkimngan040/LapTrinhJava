-- =============================================================================
-- V3__refunds_and_audit.sql — PAYMENT_REFUNDS and AUDIT_LOGS (task L7)
--
-- The two tables the review workflow of UC-16 needs and V2 did not create:
--
--   * PAYMENT_REFUNDS holds one refund against one payment. Its
--     refund_reference is UNIQUE, and the application derives it from the
--     payment id, so asking twice for the same refund finds the first row
--     instead of creating a second one (idempotency, UC-16 step 6).
--   * AUDIT_LOGS answers "who did what to which record" for every sensitive
--     action (BR11, FR10.3). Normal users never update or delete it (BR12);
--     the application has no code path that does.
--
-- Conventions follow V1 and V2: primary key named <entity>_id, NUMERIC money,
-- TIMESTAMPTZ, CHECK constraints that list exactly the constants of the Java
-- enum, and no updated_at column.
-- =============================================================================

CREATE TABLE payment_refunds (
    refund_id         BIGSERIAL     PRIMARY KEY,
    brand_id          BIGINT        NOT NULL REFERENCES brands (brand_id),
    payment_id        BIGINT        NOT NULL REFERENCES payments (payment_id),
    refund_reference  VARCHAR(80)   NOT NULL,
    amount            NUMERIC(12,2) NOT NULL,
    reason            VARCHAR(400)  NOT NULL,
    status            VARCHAR(20)   NOT NULL,
    created_at        TIMESTAMPTZ   NOT NULL,
    completed_at      TIMESTAMPTZ,
    CONSTRAINT uq_refund_reference UNIQUE (refund_reference),
    CONSTRAINT ck_refund_amount_positive CHECK (amount > 0),
    CONSTRAINT ck_refund_status CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED'))
);

CREATE INDEX ix_refunds_payment ON payment_refunds (payment_id);
CREATE INDEX ix_refunds_brand   ON payment_refunds (brand_id);

CREATE TABLE audit_logs (
    audit_id     BIGSERIAL    PRIMARY KEY,
    brand_id     BIGINT       REFERENCES brands (brand_id),
    user_id      BIGINT       REFERENCES users (user_id),
    action       VARCHAR(60)  NOT NULL,
    entity_type  VARCHAR(60)  NOT NULL,
    entity_id    BIGINT       NOT NULL,
    old_values   JSONB,
    new_values   JSONB,
    source_ip    VARCHAR(45),
    created_at   TIMESTAMPTZ  NOT NULL
);

CREATE INDEX ix_audit_entity ON audit_logs (entity_type, entity_id);
CREATE INDEX ix_audit_brand  ON audit_logs (brand_id, created_at);
