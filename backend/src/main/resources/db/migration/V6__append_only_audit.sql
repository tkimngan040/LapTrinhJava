CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    actor_id BIGINT,
    actor_identifier VARCHAR(160) NOT NULL,
    brand_id BIGINT,
    action VARCHAR(80) NOT NULL,
    target_type VARCHAR(40) NOT NULL,
    target_id BIGINT,
    machine_id BIGINT,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    source VARCHAR(255) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('INFO', 'WARNING', 'CRITICAL')),
    before_values JSONB,
    after_values JSONB,
    reason VARCHAR(1000)
);

-- Historical identities are snapshots; deleting/renaming an operational object
-- must never rewrite its evidence. Deliberately no cascading foreign keys.
CREATE INDEX ix_audit_time ON audit_logs(occurred_at DESC, id DESC);
CREATE INDEX ix_audit_brand_time ON audit_logs(brand_id, occurred_at DESC);
CREATE INDEX ix_audit_actor ON audit_logs(actor_id, occurred_at DESC);
CREATE INDEX ix_audit_target ON audit_logs(target_type, target_id, occurred_at DESC);
CREATE INDEX ix_audit_machine ON audit_logs(machine_id, occurred_at DESC);
CREATE INDEX ix_audit_action ON audit_logs(action, occurred_at DESC);

CREATE FUNCTION reject_audit_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION 'Audit records are append-only' USING ERRCODE = '55000';
END;
$$;

CREATE TRIGGER audit_logs_immutable
    BEFORE UPDATE OR DELETE OR TRUNCATE ON audit_logs
    FOR EACH STATEMENT EXECUTE FUNCTION reject_audit_mutation();

REVOKE UPDATE, DELETE, TRUNCATE ON audit_logs FROM PUBLIC;
