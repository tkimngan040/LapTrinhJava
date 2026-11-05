-- =============================================================================
-- m2-schema-check.sql — what task M2 promised of V2.
--
-- Run it against a database that has had V1 and V2 applied:
--
--     psql -h localhost -U scent -d scentstation -f src/test/resources/m2-schema-check.sql
--
-- It proves three things the ERD of Report section 2.7 asks for and that the
-- four partial unique indexes (constraint-check.sql) do not cover:
--
--   1. every transaction and inventory table carries brand_id, which is what
--      the Hibernate brand filter of BR13 narrows on;
--   2. an inventory movement cannot lie about its own arithmetic, and an
--      adjustment cannot be made without a reason;
--   3. quantities are NUMERIC, so half a dose is representable.
--
-- Every block marked EXPECT BLOCKED must print BLOCKED. The script runs in one
-- transaction that is rolled back, so it writes nothing.
-- =============================================================================

\set ON_ERROR_STOP on
BEGIN;

-- 1. brand_id on every table of rule 1, section 2.7.1 -------------------------

\echo '--- brand_id'
\echo 'EXPECT every row to read yes'
SELECT table_name,
       CASE WHEN EXISTS (
           SELECT 1 FROM information_schema.columns c
           WHERE c.table_name = t.table_name AND c.column_name = 'brand_id'
       ) THEN 'yes' ELSE 'NO — missing brand_id' END AS has_brand_id
FROM (VALUES ('orders'), ('payments'), ('dispense_commands'),
             ('inventory_batches'), ('inventory_bottles'), ('inventory_movements')) AS t(table_name)
ORDER BY table_name;

-- Fixtures --------------------------------------------------------------------

INSERT INTO brands (name, status, created_at) VALUES ('M2 Brand', 'ACTIVE', NOW());

INSERT INTO products (brand_id, name, price_per_spray, status)
SELECT brand_id, 'M2 Product', 20000.00, 'ACTIVE' FROM brands WHERE name = 'M2 Brand';

INSERT INTO machines (brand_id, serial_number, device_identity, connection_status, operating_status, created_at)
SELECT brand_id, 'M2-0001', 'KIOSK-M2', 'ONLINE', 'ACTIVE', NOW() FROM brands WHERE name = 'M2 Brand';

INSERT INTO machine_slots (brand_id, machine_id, product_id, slot_number, price, spray_duration_ms, status)
SELECT m.brand_id, m.machine_id, p.product_id, 1, 20000.00, 800, 'AVAILABLE'
FROM machines m JOIN products p ON p.brand_id = m.brand_id WHERE m.device_identity = 'KIOSK-M2';

INSERT INTO inventory_batches (brand_id, product_id, batch_number, quantity_received, received_at, status)
SELECT p.brand_id, p.product_id, 'BATCH-M2-1', 500.000, NOW(), 'ACTIVE'
FROM products p WHERE p.name = 'M2 Product';

INSERT INTO inventory_bottles (brand_id, batch_id, slot_id, bottle_code,
                               initial_quantity, remaining_quantity, status, installed_at)
SELECT s.brand_id, b.batch_id, s.slot_id, 'BTL-M2-1', 100.000, 100.000, 'INSTALLED', NOW()
FROM machine_slots s
JOIN machines m ON m.machine_id = s.machine_id
JOIN inventory_batches b ON b.brand_id = s.brand_id
WHERE m.device_identity = 'KIOSK-M2';

-- 2. a movement cannot lie about its own arithmetic ---------------------------

\echo '--- inventory_movements'
\echo 'EXPECT ALLOWED: a dispense of half a millilitre, before - 0.5 = after'
INSERT INTO inventory_movements (brand_id, bottle_id, command_id, movement_type,
                                 quantity, quantity_before, quantity_after, reason, created_at)
SELECT brand_id, bottle_id, NULL, 'DISPENSE', -0.500, 100.000, 99.500,
       'Confirmed spray', NOW()
FROM inventory_bottles WHERE bottle_code = 'BTL-M2-1';

SELECT ' EXPECT 99.500 kept exactly -> ' || quantity_after FROM inventory_movements
WHERE movement_type = 'DISPENSE';

SAVEPOINT arith;
\echo 'EXPECT BLOCKED: quantity_after that does not follow from before + quantity'
DO $$
BEGIN
    INSERT INTO inventory_movements (brand_id, bottle_id, movement_type,
                                     quantity, quantity_before, quantity_after, created_at)
    SELECT brand_id, bottle_id, 'DISPENSE', -1.000, 99.500, 50.000, NOW()
    FROM inventory_bottles WHERE bottle_code = 'BTL-M2-1';
    RAISE EXCEPTION 'NOT BLOCKED — ck_movement_arithmetic did not fire';
EXCEPTION
    WHEN check_violation THEN RAISE NOTICE 'BLOCKED';
END $$;
ROLLBACK TO SAVEPOINT arith;

SAVEPOINT adjust;
\echo 'EXPECT BLOCKED: an ADJUST movement with no reason'
DO $$
BEGIN
    INSERT INTO inventory_movements (brand_id, bottle_id, movement_type,
                                     quantity, quantity_before, quantity_after, created_at)
    SELECT brand_id, bottle_id, 'ADJUST', -2.000, 99.500, 97.500, NOW()
    FROM inventory_bottles WHERE bottle_code = 'BTL-M2-1';
    RAISE EXCEPTION 'NOT BLOCKED — ck_movement_adjust_reason did not fire';
EXCEPTION
    WHEN check_violation THEN RAISE NOTICE 'BLOCKED';
END $$;
ROLLBACK TO SAVEPOINT adjust;

\echo 'EXPECT ALLOWED: the same ADJUST once it carries a reason'
INSERT INTO inventory_movements (brand_id, bottle_id, movement_type,
                                 quantity, quantity_before, quantity_after, reason, created_at)
SELECT brand_id, bottle_id, 'ADJUST', -2.000, 99.500, 97.500, 'Spillage during refill', NOW()
FROM inventory_bottles WHERE bottle_code = 'BTL-M2-1';

SAVEPOINT negative;
\echo 'EXPECT BLOCKED: a movement that would take a bottle below zero'
DO $$
BEGIN
    INSERT INTO inventory_movements (brand_id, bottle_id, movement_type,
                                     quantity, quantity_before, quantity_after, created_at)
    SELECT brand_id, bottle_id, 'DISPENSE', -100.000, 97.500, -2.500, NOW()
    FROM inventory_bottles WHERE bottle_code = 'BTL-M2-1';
    RAISE EXCEPTION 'NOT BLOCKED — ck_movement_after_nonneg did not fire';
EXCEPTION
    WHEN check_violation THEN RAISE NOTICE 'BLOCKED';
END $$;
ROLLBACK TO SAVEPOINT negative;

-- 3. quantities keep their fraction -------------------------------------------

\echo '--- NUMERIC quantities'
\echo 'EXPECT ALLOWED: a bottle holding a fractional millilitre'
UPDATE inventory_bottles SET remaining_quantity = 0.250 WHERE bottle_code = 'BTL-M2-1';
SELECT ' EXPECT 0.250, not 0 -> ' || remaining_quantity
FROM inventory_bottles WHERE bottle_code = 'BTL-M2-1';

SAVEPOINT bottle_neg;
\echo 'EXPECT BLOCKED: a bottle with a negative remaining quantity'
DO $$
BEGIN
    UPDATE inventory_bottles SET remaining_quantity = -1 WHERE bottle_code = 'BTL-M2-1';
    RAISE EXCEPTION 'NOT BLOCKED — ck_bottle_remaining did not fire';
EXCEPTION
    WHEN check_violation THEN RAISE NOTICE 'BLOCKED';
END $$;
ROLLBACK TO SAVEPOINT bottle_neg;

SAVEPOINT cmd_ref;
\echo 'EXPECT BLOCKED: two commands sharing one command_reference'
INSERT INTO orders (brand_id, machine_id, slot_id, product_id, status,
                    price_snapshot, payment_ref, expires_at, created_at)
SELECT m.brand_id, m.machine_id, s.slot_id, s.product_id, 'PAID', 20000.00,
       'M2-REF-1', NOW() + INTERVAL '3 minutes', NOW()
FROM machines m JOIN machine_slots s ON s.machine_id = m.machine_id
WHERE m.device_identity = 'KIOSK-M2';

INSERT INTO dispense_commands (brand_id, order_id, slot_id, command_reference,
                               idempotency_key, signature, status, expires_at, created_at)
SELECT o.brand_id, o.order_id, o.slot_id, 'CMD-M2-1', 'IDEM-M2-1', 'sig', 'SUCCEEDED',
       NOW() + INTERVAL '30 seconds', NOW()
FROM orders o WHERE o.payment_ref = 'M2-REF-1';

DO $$
BEGIN
    INSERT INTO dispense_commands (brand_id, order_id, slot_id, command_reference,
                                   idempotency_key, signature, status, expires_at, created_at)
    SELECT o.brand_id, o.order_id, o.slot_id, 'CMD-M2-1', 'IDEM-M2-2', 'sig', 'SUCCEEDED',
           NOW() + INTERVAL '30 seconds', NOW()
    FROM orders o WHERE o.payment_ref = 'M2-REF-1';
    RAISE EXCEPTION 'NOT BLOCKED — uq_command_reference did not fire';
EXCEPTION
    WHEN unique_violation THEN RAISE NOTICE 'BLOCKED';
END $$;
ROLLBACK TO SAVEPOINT cmd_ref;

ROLLBACK;

\echo '--- done: nothing was written, the transaction was rolled back ---'
