CREATE TABLE refunds (
    id BIGSERIAL PRIMARY KEY,
    brand_id BIGINT NOT NULL REFERENCES brands(id),
    order_id BIGINT NOT NULL UNIQUE REFERENCES orders(id),
    payment_id BIGINT NOT NULL UNIQUE REFERENCES payments(id),
    refund_reference VARCHAR(80) NOT NULL UNIQUE,
    request_key VARCHAR(80) NOT NULL,
    provider VARCHAR(40) NOT NULL,
    amount BIGINT NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING','SUCCEEDED','FAILED')),
    reason VARCHAR(1000) NOT NULL CHECK (length(btrim(reason)) > 0),
    requested_by BIGINT NOT NULL REFERENCES users(id),
    attempt INTEGER NOT NULL DEFAULT 1 CHECK (attempt > 0),
    provider_reference VARCHAR(120),
    result_code VARCHAR(120),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    UNIQUE(brand_id, request_key)
);
CREATE INDEX ix_refunds_brand_time ON refunds(brand_id, created_at DESC);

CREATE TABLE refund_dispatches (
    id BIGSERIAL PRIMARY KEY,
    refund_id BIGINT NOT NULL REFERENCES refunds(id),
    attempt INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','DELIVERED')),
    delivered_at TIMESTAMPTZ,
    UNIQUE(refund_id, attempt)
);

-- Separate development-provider ledger. The stable reference/attempt is also
-- the provider's idempotency key; redelivery cannot create another refund.
CREATE TABLE simulated_refund_requests (
    refund_reference VARCHAR(80) NOT NULL,
    attempt INTEGER NOT NULL,
    provider VARCHAR(40) NOT NULL,
    payment_reference VARCHAR(120) NOT NULL,
    amount BIGINT NOT NULL,
    currency VARCHAR(3) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','SUCCEEDED','FAILED')),
    provider_reference VARCHAR(120) NOT NULL UNIQUE,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    completed_at TIMESTAMPTZ,
    PRIMARY KEY(refund_reference, attempt)
);

CREATE TABLE order_reviews (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL UNIQUE REFERENCES orders(id),
    reviewed_by BIGINT NOT NULL REFERENCES users(id),
    decision VARCHAR(20) NOT NULL CHECK (decision IN ('DISPENSED','FAILED')),
    evidence VARCHAR(1000) NOT NULL CHECK (length(btrim(evidence)) > 0),
    note VARCHAR(400) NOT NULL CHECK (length(btrim(note)) > 0),
    reviewed_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE order_status_events (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL,
    previous_status VARCHAR(20),
    status VARCHAR(20) NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);
CREATE FUNCTION append_order_status_event() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO order_status_events(order_id,status) VALUES (NEW.id,NEW.status);
    ELSIF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO order_status_events(order_id,previous_status,status)
        VALUES (NEW.id,OLD.status,NEW.status);
    END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER orders_status_history AFTER INSERT OR UPDATE OF status ON orders
    FOR EACH ROW EXECUTE FUNCTION append_order_status_event();
CREATE TRIGGER order_reviews_immutable BEFORE UPDATE OR DELETE OR TRUNCATE ON order_reviews
    FOR EACH STATEMENT EXECUTE FUNCTION reject_audit_mutation();
CREATE TRIGGER order_status_events_immutable BEFORE UPDATE OR DELETE OR TRUNCATE ON order_status_events
    FOR EACH STATEMENT EXECUTE FUNCTION reject_audit_mutation();
