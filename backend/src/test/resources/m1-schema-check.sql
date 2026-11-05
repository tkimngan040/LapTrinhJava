-- =============================================================================
-- m1-schema-check.sql — evidence that V1__core.sql does what task M1 says
--
-- Run it against a database that has had V1 and V2 applied:
--
--     psql -h localhost -U scent -d scentstation -f src/test/resources/m1-schema-check.sql
--
-- Every line of output marked EXPECT must read exactly as the label says.
-- Nothing here is left behind: the whole script runs inside one transaction
-- that is rolled back at the end.
-- =============================================================================

\set ON_ERROR_STOP on
BEGIN;

-- 1. The seven roles of Report section 1.4 ------------------------------------

SELECT 'EXPECT 7 roles -> ' || count(*)::text AS result FROM roles;

SELECT 'EXPECT all seven present -> ' ||
       CASE WHEN count(*) = 7 THEN 'yes' ELSE 'NO' END AS result
FROM roles
WHERE role_name IN ('PLATFORM_SUPER_ADMIN', 'BRAND_ADMIN', 'OPERATIONS_MANAGER',
                    'TECHNICIAN', 'INVENTORY_STAFF', 'VIEWER', 'CUSTOMER');

-- 2. The seeded administrator -------------------------------------------------

SELECT 'EXPECT platform admin, brand_id NULL -> ' ||
       CASE WHEN brand_id IS NULL THEN 'yes' ELSE 'NO' END AS result
FROM users WHERE email = 'admin@scentstation.local';

-- A BCrypt hash is 60 characters and starts with the cost-10 2a prefix.
SELECT 'EXPECT bcrypt cost 10, 60 chars -> ' ||
       CASE WHEN length(password_hash) = 60 AND password_hash LIKE '$2a$10$%'
            THEN 'yes' ELSE 'NO' END AS result
FROM users WHERE email = 'admin@scentstation.local';

SELECT 'EXPECT admin holds PLATFORM_SUPER_ADMIN -> ' ||
       CASE WHEN count(*) = 1 THEN 'yes' ELSE 'NO' END AS result
FROM users u
JOIN user_roles ur ON ur.user_id = u.user_id
JOIN roles r ON r.role_id = ur.role_id
WHERE u.email = 'admin@scentstation.local'
  AND r.role_name = 'PLATFORM_SUPER_ADMIN';

SELECT 'EXPECT assigned_at filled by its default -> ' ||
       CASE WHEN count(*) = 0 THEN 'yes' ELSE 'NO' END AS result
FROM user_roles WHERE assigned_at IS NULL;

-- 3. Fixtures for the constraint checks ---------------------------------------

INSERT INTO brands (name, status, created_at) VALUES ('Check Brand', 'ACTIVE', NOW());

INSERT INTO machines (brand_id, serial_number, device_identity,
                      connection_status, operating_status, created_at)
SELECT brand_id, 'SN-CHECK-1', 'KIOSK-CHECK-1', 'ONLINE', 'ACTIVE', NOW()
FROM brands WHERE name = 'Check Brand';

INSERT INTO machines (brand_id, serial_number, device_identity,
                      connection_status, operating_status, created_at)
SELECT brand_id, 'SN-CHECK-2', 'KIOSK-CHECK-2', 'ONLINE', 'ACTIVE', NOW()
FROM brands WHERE name = 'Check Brand';

INSERT INTO machine_slots (brand_id, machine_id, slot_number, spray_duration_ms, status)
SELECT m.brand_id, m.machine_id, 1, 800, 'EMPTY'
FROM machines m WHERE m.device_identity = 'KIOSK-CHECK-1';

-- 4. uq_slot_number_per_machine ----------------------------------------------
-- Report section 2.7.4: one slot number may appear only once per machine.

SAVEPOINT s1;
\echo 'EXPECT BLOCKED: slot number 1 twice on the same machine'
DO $$
BEGIN
    INSERT INTO machine_slots (brand_id, machine_id, slot_number, spray_duration_ms, status)
    SELECT m.brand_id, m.machine_id, 1, 800, 'EMPTY'
    FROM machines m WHERE m.device_identity = 'KIOSK-CHECK-1';
    RAISE EXCEPTION 'NOT BLOCKED — uq_slot_number_per_machine did not fire';
EXCEPTION
    WHEN unique_violation THEN RAISE NOTICE 'BLOCKED';
END $$;
ROLLBACK TO SAVEPOINT s1;

-- The same number on a different machine is legitimate and must be allowed.
\echo 'EXPECT ALLOWED: slot number 1 on a second machine'
INSERT INTO machine_slots (brand_id, machine_id, slot_number, spray_duration_ms, status)
SELECT m.brand_id, m.machine_id, 1, 800, 'EMPTY'
FROM machines m WHERE m.device_identity = 'KIOSK-CHECK-2';

SELECT 'EXPECT 2 slots numbered 1, one per machine -> ' || count(*)::text AS result
FROM machine_slots WHERE slot_number = 1;

-- 5. The unique keys of section 2.7.2 ----------------------------------------

SAVEPOINT s2;
\echo 'EXPECT BLOCKED: a second machine with the same device_identity'
DO $$
BEGIN
    INSERT INTO machines (brand_id, serial_number, device_identity,
                          connection_status, operating_status, created_at)
    SELECT brand_id, 'SN-CHECK-3', 'KIOSK-CHECK-1', 'ONLINE', 'ACTIVE', NOW()
    FROM brands WHERE name = 'Check Brand';
    RAISE EXCEPTION 'NOT BLOCKED — uq_machine_device_identity did not fire';
EXCEPTION
    WHEN unique_violation THEN RAISE NOTICE 'BLOCKED';
END $$;
ROLLBACK TO SAVEPOINT s2;

SAVEPOINT s3;
\echo 'EXPECT BLOCKED: two accounts with the same email'
DO $$
BEGIN
    INSERT INTO users (email, password_hash, full_name, status, token_version, created_at)
    VALUES ('admin@scentstation.local', 'x', 'Impostor', 'ACTIVE', 0, NOW());
    RAISE EXCEPTION 'NOT BLOCKED — uq_user_email did not fire';
EXCEPTION
    WHEN unique_violation THEN RAISE NOTICE 'BLOCKED';
END $$;
ROLLBACK TO SAVEPOINT s3;

-- 6. The CHECK constraints behind the enumerations ----------------------------
-- These are what stop a typo in a status value from reaching the database and
-- then failing much later, inside Hibernate, as an unmappable enum.

SAVEPOINT s4;
\echo 'EXPECT BLOCKED: an unknown machine operating_status'
DO $$
BEGIN
    INSERT INTO machines (brand_id, serial_number, device_identity,
                          connection_status, operating_status, created_at)
    SELECT brand_id, 'SN-CHECK-4', 'KIOSK-CHECK-4', 'ONLINE', 'SLEEPING', NOW()
    FROM brands WHERE name = 'Check Brand';
    RAISE EXCEPTION 'NOT BLOCKED — ck_machine_operating did not fire';
EXCEPTION
    WHEN check_violation THEN RAISE NOTICE 'BLOCKED';
END $$;
ROLLBACK TO SAVEPOINT s4;

SAVEPOINT s5;
\echo 'EXPECT BLOCKED: a negative product price'
DO $$
BEGIN
    INSERT INTO products (brand_id, name, price_per_spray, status)
    SELECT brand_id, 'Impossible', -1, 'ACTIVE' FROM brands WHERE name = 'Check Brand';
    RAISE EXCEPTION 'NOT BLOCKED — ck_product_price did not fire';
EXCEPTION
    WHEN check_violation THEN RAISE NOTICE 'BLOCKED';
END $$;
ROLLBACK TO SAVEPOINT s5;

-- 7. A NULL slot price means "use the product price" (section 2.7.2) ----------

\echo 'EXPECT ALLOWED: a slot with no price of its own'
INSERT INTO machine_slots (brand_id, machine_id, slot_number, price, spray_duration_ms, status)
SELECT m.brand_id, m.machine_id, 2, NULL, 800, 'EMPTY'
FROM machines m WHERE m.device_identity = 'KIOSK-CHECK-1';

SELECT 'EXPECT price IS NULL on slot 2 -> ' ||
       CASE WHEN price IS NULL THEN 'yes' ELSE 'NO' END AS result
FROM machine_slots ms
JOIN machines m ON m.machine_id = ms.machine_id
WHERE m.device_identity = 'KIOSK-CHECK-1' AND ms.slot_number = 2;

ROLLBACK;

\echo '--- done: nothing was written, the transaction was rolled back ---'
