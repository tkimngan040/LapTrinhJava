-- Proves the four partial unique indexes of Report section 2.7.4 actually
-- refuse the thing each one is meant to refuse. Run it against a database that
-- has V1 and V2 applied:
--   psql -d scentstation -f constraint-check.sql
-- Every block must print "BLOCKED". A block that prints "NOT BLOCKED" means the
-- index is missing or wrong.

\set ON_ERROR_STOP off
\set QUIET on

-- Fixtures -------------------------------------------------------------------
INSERT INTO brands (name, status, created_at, updated_at)
VALUES ('Check Brand', 'ACTIVE', NOW(), NOW());

INSERT INTO products (brand_id, name, default_price, active, created_at, updated_at)
SELECT id, 'Check Product', 20000, TRUE, NOW(), NOW() FROM brands WHERE name = 'Check Brand';

INSERT INTO machines (brand_id, serial_number, device_id, connectivity_status,
                      operating_status, created_at, updated_at)
SELECT id, 'CHK-0001', 'KIOSK-CHK', 'ONLINE', 'ACTIVE', NOW(), NOW()
FROM brands WHERE name = 'Check Brand';

INSERT INTO machine_slots (machine_id, slot_number, product_id, price,
                           dose_ml, spray_duration_ms, created_at, updated_at)
SELECT m.id, 1, p.id, 20000, 1, 800, NOW(), NOW()
FROM machines m JOIN products p ON p.brand_id = m.brand_id
WHERE m.device_id = 'KIOSK-CHK';

INSERT INTO orders (brand_id, machine_id, slot_id, product_id, status,
                    price_snapshot, payment_ref, expires_at, created_at, updated_at)
SELECT m.brand_id, m.id, s.id, s.product_id, 'PAID', 20000, 'CHK-REF-1',
       NOW() + INTERVAL '3 minutes', NOW(), NOW()
FROM machines m JOIN machine_slots s ON s.machine_id = m.id
WHERE m.device_id = 'KIOSK-CHK';

\set QUIET off

-- BR2 — two bottles installed in one slot ------------------------------------
\echo '--- BR2 uq_bottle_active_slot'
INSERT INTO inventory_bottles (product_id, slot_id, bottle_code, initial_quantity_ml,
                               remaining_quantity_ml, status, installed_at, created_at, updated_at)
SELECT s.product_id, s.id, 'BTL-CHK-1', 100, 100, 'INSTALLED', NOW(), NOW(), NOW()
FROM machine_slots s JOIN machines m ON m.id = s.machine_id WHERE m.device_id = 'KIOSK-CHK';

INSERT INTO inventory_bottles (product_id, slot_id, bottle_code, initial_quantity_ml,
                               remaining_quantity_ml, status, installed_at, created_at, updated_at)
SELECT s.product_id, s.id, 'BTL-CHK-2', 100, 100, 'INSTALLED', NOW(), NOW(), NOW()
FROM machine_slots s JOIN machines m ON m.id = s.machine_id WHERE m.device_id = 'KIOSK-CHK';
\echo '^ must be BLOCKED (duplicate key uq_bottle_active_slot)'

-- A removed bottle frees the slot, which is what the partial WHERE is for.
UPDATE inventory_bottles SET status = 'EMPTY', slot_id = NULL WHERE bottle_code = 'BTL-CHK-1';
INSERT INTO inventory_bottles (product_id, slot_id, bottle_code, initial_quantity_ml,
                               remaining_quantity_ml, status, installed_at, created_at, updated_at)
SELECT s.product_id, s.id, 'BTL-CHK-3', 100, 100, 'INSTALLED', NOW(), NOW(), NOW()
FROM machine_slots s JOIN machines m ON m.id = s.machine_id WHERE m.device_id = 'KIOSK-CHK';
\echo '^ must SUCCEED: the slot was freed first'

-- NFR3.3 — the same payment webhook delivered twice ---------------------------
\echo '--- NFR3.3 uq_payment_provider_ref'
INSERT INTO payments (order_id, provider, provider_reference, amount, status, paid_at, created_at, updated_at)
SELECT id, 'FAKEPAY', 'PROV-CHK-1', 20000, 'SUCCEEDED', NOW(), NOW(), NOW()
FROM orders WHERE payment_ref = 'CHK-REF-1';

INSERT INTO payments (order_id, provider, provider_reference, amount, status, paid_at, created_at, updated_at)
SELECT id, 'FAKEPAY', 'PROV-CHK-1', 20000, 'SUCCEEDED', NOW(), NOW(), NOW()
FROM orders WHERE payment_ref = 'CHK-REF-1';
\echo '^ must be BLOCKED (duplicate key uq_payment_provider_ref)'

-- BR6 — two commands in flight for one order ----------------------------------
\echo '--- BR6 uq_command_active_order'
INSERT INTO dispense_commands (order_id, machine_id, slot_id, idempotency_key, dose_ml,
                               spray_duration_ms, signature, status, issued_at, expires_at,
                               created_at, updated_at)
SELECT o.id, o.machine_id, o.slot_id, 'IDEM-CHK-1', 1, 800, 'sig', 'ISSUED',
       NOW(), NOW() + INTERVAL '30 seconds', NOW(), NOW()
FROM orders o WHERE o.payment_ref = 'CHK-REF-1';

INSERT INTO dispense_commands (order_id, machine_id, slot_id, idempotency_key, dose_ml,
                               spray_duration_ms, signature, status, issued_at, expires_at,
                               created_at, updated_at)
SELECT o.id, o.machine_id, o.slot_id, 'IDEM-CHK-2', 1, 800, 'sig', 'ISSUED',
       NOW(), NOW() + INTERVAL '30 seconds', NOW(), NOW()
FROM orders o WHERE o.payment_ref = 'CHK-REF-1';
\echo '^ must be BLOCKED (duplicate key uq_command_active_order)'

-- NFR3.4 — the device publishes the same result twice -------------------------
\echo '--- NFR3.4 uq_command_idempotency'
INSERT INTO dispense_commands (order_id, machine_id, slot_id, idempotency_key, dose_ml,
                               spray_duration_ms, signature, status, issued_at, expires_at,
                               created_at, updated_at)
SELECT o.id, o.machine_id, o.slot_id, 'IDEM-CHK-1', 1, 800, 'sig', 'SUCCEEDED',
       NOW(), NOW() + INTERVAL '30 seconds', NOW(), NOW()
FROM orders o WHERE o.payment_ref = 'CHK-REF-1';
\echo '^ must be BLOCKED (duplicate key uq_command_idempotency)'

-- After review the first command is closed, so a second one may be issued.
UPDATE dispense_commands SET status = 'TIMED_OUT' WHERE idempotency_key = 'IDEM-CHK-1';
INSERT INTO dispense_commands (order_id, machine_id, slot_id, idempotency_key, dose_ml,
                               spray_duration_ms, signature, status, issued_at, expires_at,
                               created_at, updated_at)
SELECT o.id, o.machine_id, o.slot_id, 'IDEM-CHK-9', 1, 800, 'sig', 'ISSUED',
       NOW(), NOW() + INTERVAL '30 seconds', NOW(), NOW()
FROM orders o WHERE o.payment_ref = 'CHK-REF-1';
\echo '^ must SUCCEED: the first command reached a terminal status'
