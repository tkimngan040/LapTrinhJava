-- =============================================================================
-- constraint-check.sql — the four partial unique indexes of Report section
-- 2.7.4, each one shown refusing exactly the thing it exists to refuse.
--
-- Run it against a database that has had V1 and V2 applied:
--
--     psql -h localhost -U scent -d scentstation -f src/test/resources/constraint-check.sql
--
-- Every block marked EXPECT BLOCKED must print BLOCKED, and every block marked
-- EXPECT ALLOWED must pass without an error. A block that prints NOT BLOCKED
-- means its index is missing or its WHERE clause is wrong.
--
-- The whole script runs inside one transaction that is rolled back at the end,
-- so it leaves nothing behind.
-- =============================================================================

\set ON_ERROR_STOP on
BEGIN;

-- Fixtures --------------------------------------------------------------------

INSERT INTO brands (name, status, created_at) VALUES ('Check Brand', 'ACTIVE', NOW());

INSERT INTO products (brand_id, name, price_per_spray, status)
SELECT brand_id, 'Check Product', 20000.00, 'ACTIVE'
FROM brands WHERE name = 'Check Brand';

INSERT INTO machines (brand_id, serial_number, device_identity,
                      connection_status, operating_status, created_at)
SELECT brand_id, 'CHK-0001', 'KIOSK-CHK', 'ONLINE', 'ACTIVE', NOW()
FROM brands WHERE name = 'Check Brand';

INSERT INTO machine_slots (brand_id, machine_id, product_id, slot_number,
                           price, spray_duration_ms, status)
SELECT m.brand_id, m.machine_id, p.product_id, 1, 20000.00, 800, 'AVAILABLE'
FROM machines m
JOIN products p ON p.brand_id = m.brand_id
WHERE m.device_identity = 'KIOSK-CHK';

INSERT INTO orders (brand_id, machine_id, slot_id, product_id, status,
                    price_snapshot, payment_ref, expires_at, created_at)
SELECT m.brand_id, m.machine_id, s.slot_id, s.product_id, 'PAID', 20000.00,
       'CHK-REF-1', NOW() + INTERVAL '3 minutes', NOW()
FROM machines m
JOIN machine_slots s ON s.machine_id = m.machine_id
WHERE m.device_identity = 'KIOSK-CHK';

-- BR2 — at most one bottle installed in a slot at a time ----------------------

\echo '--- BR2 uq_bottle_active_slot'

INSERT INTO inventory_bottles (product_id, slot_id, bottle_code, initial_quantity_ml,
                               remaining_quantity_ml, status, installed_at, created_at)
SELECT s.product_id, s.slot_id, 'BTL-CHK-1', 100, 100, 'INSTALLED', NOW(), NOW()
FROM machine_slots s JOIN machines m ON m.machine_id = s.machine_id
WHERE m.device_identity = 'KIOSK-CHK';

SAVEPOINT br2;
\echo 'EXPECT BLOCKED: a second bottle installed in the same slot'
DO $$
BEGIN
    INSERT INTO inventory_bottles (product_id, slot_id, bottle_code, initial_quantity_ml,
                                   remaining_quantity_ml, status, installed_at, created_at)
    SELECT s.product_id, s.slot_id, 'BTL-CHK-2', 100, 100, 'INSTALLED', NOW(), NOW()
    FROM machine_slots s JOIN machines m ON m.machine_id = s.machine_id
    WHERE m.device_identity = 'KIOSK-CHK';
    RAISE EXCEPTION 'NOT BLOCKED — uq_bottle_active_slot did not fire';
EXCEPTION
    WHEN unique_violation THEN RAISE NOTICE 'BLOCKED';
END $$;
ROLLBACK TO SAVEPOINT br2;

-- Removing the bottle frees the slot. This is the case the partial WHERE
-- exists for: a plain unique index would have made a slot single-use forever.
\echo 'EXPECT ALLOWED: a new bottle once the old one has been removed'
UPDATE inventory_bottles SET status = 'EMPTY', slot_id = NULL, removed_at = NOW()
WHERE bottle_code = 'BTL-CHK-1';

INSERT INTO inventory_bottles (product_id, slot_id, bottle_code, initial_quantity_ml,
                               remaining_quantity_ml, status, installed_at, created_at)
SELECT s.product_id, s.slot_id, 'BTL-CHK-3', 100, 100, 'INSTALLED', NOW(), NOW()
FROM machine_slots s JOIN machines m ON m.machine_id = s.machine_id
WHERE m.device_identity = 'KIOSK-CHK';

-- NFR3.3 — the same payment webhook delivered twice ---------------------------

\echo '--- NFR3.3 uq_payment_provider_ref'

INSERT INTO payments (order_id, provider, provider_reference, amount, status, paid_at, created_at)
SELECT order_id, 'FAKEPAY', 'PROV-CHK-1', 20000.00, 'SUCCEEDED', NOW(), NOW()
FROM orders WHERE payment_ref = 'CHK-REF-1';

SAVEPOINT nfr33;
\echo 'EXPECT BLOCKED: the same provider reference recorded twice'
DO $$
BEGIN
    INSERT INTO payments (order_id, provider, provider_reference, amount, status, paid_at, created_at)
    SELECT order_id, 'FAKEPAY', 'PROV-CHK-1', 20000.00, 'SUCCEEDED', NOW(), NOW()
    FROM orders WHERE payment_ref = 'CHK-REF-1';
    RAISE EXCEPTION 'NOT BLOCKED — uq_payment_provider_ref did not fire';
EXCEPTION
    WHEN unique_violation THEN RAISE NOTICE 'BLOCKED';
END $$;
ROLLBACK TO SAVEPOINT nfr33;

-- BR6 — one paid order, at most one command in flight -------------------------

\echo '--- BR6 uq_command_active_order'

INSERT INTO dispense_commands (order_id, machine_id, slot_id, idempotency_key, dose_ml,
                               spray_duration_ms, signature, status, issued_at,
                               expires_at, created_at)
SELECT o.order_id, o.machine_id, o.slot_id, 'IDEM-CHK-1', 1, 800, 'sig', 'ISSUED',
       NOW(), NOW() + INTERVAL '30 seconds', NOW()
FROM orders o WHERE o.payment_ref = 'CHK-REF-1';

SAVEPOINT br6;
\echo 'EXPECT BLOCKED: a second command while the first is still in flight'
DO $$
BEGIN
    INSERT INTO dispense_commands (order_id, machine_id, slot_id, idempotency_key, dose_ml,
                                   spray_duration_ms, signature, status, issued_at,
                                   expires_at, created_at)
    SELECT o.order_id, o.machine_id, o.slot_id, 'IDEM-CHK-2', 1, 800, 'sig', 'ISSUED',
           NOW(), NOW() + INTERVAL '30 seconds', NOW()
    FROM orders o WHERE o.payment_ref = 'CHK-REF-1';
    RAISE EXCEPTION 'NOT BLOCKED — uq_command_active_order did not fire';
EXCEPTION
    WHEN unique_violation THEN RAISE NOTICE 'BLOCKED';
END $$;
ROLLBACK TO SAVEPOINT br6;

-- NFR3.4 — the device publishes the same result twice -------------------------

\echo '--- NFR3.4 uq_command_idempotency'

SAVEPOINT nfr34;
\echo 'EXPECT BLOCKED: a command reusing an idempotency key already seen'
DO $$
BEGIN
    INSERT INTO dispense_commands (order_id, machine_id, slot_id, idempotency_key, dose_ml,
                                   spray_duration_ms, signature, status, issued_at,
                                   expires_at, created_at)
    SELECT o.order_id, o.machine_id, o.slot_id, 'IDEM-CHK-1', 1, 800, 'sig', 'SUCCEEDED',
           NOW(), NOW() + INTERVAL '30 seconds', NOW()
    FROM orders o WHERE o.payment_ref = 'CHK-REF-1';
    RAISE EXCEPTION 'NOT BLOCKED — uq_command_idempotency did not fire';
EXCEPTION
    WHEN unique_violation THEN RAISE NOTICE 'BLOCKED';
END $$;
ROLLBACK TO SAVEPOINT nfr34;

-- Once the first command reaches a terminal status a new one may be issued,
-- which is how an order resolved by human review (BR14) can be retried.
\echo 'EXPECT ALLOWED: a new command once the first one has finished'
UPDATE dispense_commands SET status = 'TIMED_OUT' WHERE idempotency_key = 'IDEM-CHK-1';

INSERT INTO dispense_commands (order_id, machine_id, slot_id, idempotency_key, dose_ml,
                               spray_duration_ms, signature, status, issued_at,
                               expires_at, created_at)
SELECT o.order_id, o.machine_id, o.slot_id, 'IDEM-CHK-9', 1, 800, 'sig', 'ISSUED',
       NOW(), NOW() + INTERVAL '30 seconds', NOW()
FROM orders o WHERE o.payment_ref = 'CHK-REF-1';

ROLLBACK;

\echo '--- done: nothing was written, the transaction was rolled back ---'
