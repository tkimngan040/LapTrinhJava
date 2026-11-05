-- =============================================================================
-- l7-schema-check.sql — what V3 (PAYMENT_REFUNDS, AUDIT_LOGS) promises.
--
-- Run it against a database that has had V1, V2 and V3 applied:
--
--     psql -h localhost -U scent -d scentstation -f src/test/resources/l7-schema-check.sql
--
-- Every block marked EXPECT BLOCKED must print BLOCKED. The script runs in one
-- transaction that is rolled back, so it writes nothing.
-- =============================================================================

\set ON_ERROR_STOP on
BEGIN;

INSERT INTO brands (name, status, created_at) VALUES ('L7 Brand', 'ACTIVE', NOW());

INSERT INTO products (brand_id, name, price_per_spray, status)
SELECT brand_id, 'L7 Product', 20000.00, 'ACTIVE' FROM brands WHERE name = 'L7 Brand';

INSERT INTO machines (brand_id, serial_number, device_identity, connection_status, operating_status, created_at)
SELECT brand_id, 'L7-0001', 'KIOSK-L7', 'ONLINE', 'ACTIVE', NOW() FROM brands WHERE name = 'L7 Brand';

INSERT INTO machine_slots (brand_id, machine_id, product_id, slot_number, price, spray_duration_ms, status)
SELECT m.brand_id, m.machine_id, p.product_id, 1, 20000.00, 800, 'AVAILABLE'
FROM machines m JOIN products p ON p.brand_id = m.brand_id WHERE m.device_identity = 'KIOSK-L7';

INSERT INTO orders (brand_id, machine_id, slot_id, product_id, status, price_snapshot, payment_ref, expires_at, created_at)
SELECT m.brand_id, m.machine_id, s.slot_id, s.product_id, 'FAILED', 20000.00, 'L7-REF-1',
       NOW() + INTERVAL '3 minutes', NOW()
FROM machines m JOIN machine_slots s ON s.machine_id = m.machine_id WHERE m.device_identity = 'KIOSK-L7';

INSERT INTO payments (order_id, provider, provider_reference, amount, status, paid_at, created_at)
SELECT order_id, 'FAKEPAY', 'PROV-L7-1', 20000.00, 'SUCCEEDED', NOW(), NOW()
FROM orders WHERE payment_ref = 'L7-REF-1';

\echo '--- uq_refund_reference'

INSERT INTO payment_refunds (brand_id, payment_id, refund_reference, amount, reason, status, created_at)
SELECT o.brand_id, p.payment_id, 'RF-' || p.payment_id, 20000.00, 'Device jammed', 'PENDING', NOW()
FROM payments p JOIN orders o ON o.order_id = p.order_id WHERE p.provider_reference = 'PROV-L7-1';

SAVEPOINT refund_dup;
\echo 'EXPECT BLOCKED: the same refund reference twice (a retried request cannot refund twice)'
DO $$
BEGIN
    INSERT INTO payment_refunds (brand_id, payment_id, refund_reference, amount, reason, status, created_at)
    SELECT o.brand_id, p.payment_id, 'RF-' || p.payment_id, 20000.00, 'Again', 'PENDING', NOW()
    FROM payments p JOIN orders o ON o.order_id = p.order_id WHERE p.provider_reference = 'PROV-L7-1';
    RAISE EXCEPTION 'NOT BLOCKED — uq_refund_reference did not fire';
EXCEPTION
    WHEN unique_violation THEN RAISE NOTICE 'BLOCKED';
END $$;
ROLLBACK TO SAVEPOINT refund_dup;

\echo 'EXPECT ALLOWED: the same refund moving PENDING -> FAILED -> COMPLETED (same row, same reference)'
UPDATE payment_refunds SET status = 'FAILED' WHERE refund_reference LIKE 'RF-%';
UPDATE payment_refunds SET status = 'COMPLETED', completed_at = NOW() WHERE refund_reference LIKE 'RF-%';
SELECT ' EXPECT 1 row, COMPLETED -> ' || count(*) || ', ' || min(status) FROM payment_refunds;

SAVEPOINT refund_amount;
\echo 'EXPECT BLOCKED: a refund of zero'
DO $$
BEGIN
    INSERT INTO payment_refunds (brand_id, payment_id, refund_reference, amount, reason, status, created_at)
    SELECT o.brand_id, p.payment_id, 'RF-ZERO', 0, 'zero', 'PENDING', NOW()
    FROM payments p JOIN orders o ON o.order_id = p.order_id WHERE p.provider_reference = 'PROV-L7-1';
    RAISE EXCEPTION 'NOT BLOCKED — ck_refund_amount_positive did not fire';
EXCEPTION
    WHEN check_violation THEN RAISE NOTICE 'BLOCKED';
END $$;
ROLLBACK TO SAVEPOINT refund_amount;

SAVEPOINT refund_status;
\echo 'EXPECT BLOCKED: a refund status the Java enum does not have'
DO $$
BEGIN
    INSERT INTO payment_refunds (brand_id, payment_id, refund_reference, amount, reason, status, created_at)
    SELECT o.brand_id, p.payment_id, 'RF-BAD', 100, 'bad', 'DONE', NOW()
    FROM payments p JOIN orders o ON o.order_id = p.order_id WHERE p.provider_reference = 'PROV-L7-1';
    RAISE EXCEPTION 'NOT BLOCKED — ck_refund_status did not fire';
EXCEPTION
    WHEN check_violation THEN RAISE NOTICE 'BLOCKED';
END $$;
ROLLBACK TO SAVEPOINT refund_status;

\echo '--- audit_logs'

\echo 'EXPECT ALLOWED: an audit line with before/after JSON, and one with no user (system action)'
INSERT INTO audit_logs (brand_id, user_id, action, entity_type, entity_id, old_values, new_values, source_ip, created_at)
SELECT o.brand_id, (SELECT user_id FROM users WHERE email = 'admin@scentstation.local'),
       'ORDER_REVIEW_RESOLVED', 'ORDER', o.order_id,
       '{"status":"UNCERTAIN"}'::jsonb, '{"status":"DISPENSED","reviewNote":"seen"}'::jsonb,
       '10.0.0.1', NOW()
FROM orders o WHERE o.payment_ref = 'L7-REF-1';
INSERT INTO audit_logs (action, entity_type, entity_id, created_at) VALUES ('SYSTEM_TICK', 'ORDER', 0, NOW());
SELECT ' EXPECT 2 lines, new_values readable -> ' || count(*) || ', '
       || max(new_values ->> 'status') FROM audit_logs;

ROLLBACK;

\echo '--- done: nothing was written, the transaction was rolled back ---'
