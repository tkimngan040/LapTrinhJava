-- ScentStation demo data for local development and UI testing.
-- Keeps the existing platform administrator untouched.
-- All demo users use the same BCrypt hash as the documented local demo password Admin@12345.

-- 1) Brands
INSERT INTO brands (name, description, status, created_at)
VALUES
    ('Maison Aroma', 'Demo perfume brand for ScentStation', 'ACTIVE', NOW() - INTERVAL '60 days'),
    ('Lumiere Scents', 'Second demo perfume brand for multi-tenant testing', 'ACTIVE', NOW() - INTERVAL '45 days')
ON CONFLICT (name) DO NOTHING;

-- 2) Locations
INSERT INTO locations (brand_id, name, address, status)
SELECT b.brand_id, v.location_name, v.address, 'ACTIVE'
FROM (VALUES
    ('Maison Aroma', 'District 1 Flagship', '12 Nguyen Hue, District 1, Ho Chi Minh City'),
    ('Lumiere Scents', 'Thu Duc Experience Store', '88 Vo Van Ngan, Thu Duc City, Ho Chi Minh City')
) AS v(brand_name, location_name, address)
JOIN brands b ON b.name = v.brand_name
ON CONFLICT DO NOTHING;

-- 3) Demo users. Password for all accounts: Admin@12345
INSERT INTO users (brand_id, email, password_hash, full_name, status, token_version, created_at)
SELECT b.brand_id, v.email, '$2a$10$6ceTAcoe3JytC52ER/khLe.9KXBWPpjuWmXZ7eYR2.yRR6bm.fg/C',
       v.full_name, 'ACTIVE', 0, NOW() - INTERVAL '30 days'
FROM (VALUES
    ('Maison Aroma', 'admin@maisonaroma.local', 'Maison Aroma Admin'),
    ('Maison Aroma', 'ops@maisonaroma.local', 'Maison Aroma Operations'),
    ('Maison Aroma', 'tech@maisonaroma.local', 'Maison Aroma Technician'),
    ('Maison Aroma', 'stock@maisonaroma.local', 'Maison Aroma Inventory'),
    ('Lumiere Scents', 'admin@lumierescents.local', 'Lumiere Scents Admin'),
    ('Lumiere Scents', 'ops@lumierescents.local', 'Lumiere Scents Operations'),
    ('Lumiere Scents', 'tech@lumierescents.local', 'Lumiere Scents Technician'),
    ('Lumiere Scents', 'stock@lumierescents.local', 'Lumiere Scents Inventory')
) AS v(brand_name, email, full_name)
JOIN brands b ON b.name = v.brand_name
ON CONFLICT (email) DO NOTHING;

INSERT INTO user_roles (user_id, role_id, assigned_at)
SELECT u.user_id, r.role_id, NOW() - INTERVAL '30 days'
FROM (VALUES
    ('admin@maisonaroma.local', 'BRAND_ADMIN'),
    ('ops@maisonaroma.local', 'OPERATIONS_MANAGER'),
    ('tech@maisonaroma.local', 'TECHNICIAN'),
    ('stock@maisonaroma.local', 'INVENTORY_STAFF'),
    ('admin@lumierescents.local', 'BRAND_ADMIN'),
    ('ops@lumierescents.local', 'OPERATIONS_MANAGER'),
    ('tech@lumierescents.local', 'TECHNICIAN'),
    ('stock@lumierescents.local', 'INVENTORY_STAFF')
) AS v(email, role_name)
JOIN users u ON u.email = v.email
JOIN roles r ON r.role_name = v.role_name
ON CONFLICT (user_id, role_id) DO NOTHING;

-- 4) Products
INSERT INTO products (brand_id, name, description, image_url, fragrance_notes, price_per_spray, status)
SELECT b.brand_id, v.product_name, v.description, NULL, v.notes, v.price, 'ACTIVE'
FROM (VALUES
    ('Maison Aroma', 'Citrus Morning', 'Fresh citrus fragrance for daytime use', 'Bergamot, lemon, neroli', 12000.00),
    ('Maison Aroma', 'Velvet Rose', 'Soft floral fragrance', 'Rose, peony, musk', 15000.00),
    ('Maison Aroma', 'Amber Night', 'Warm evening fragrance', 'Amber, vanilla, sandalwood', 18000.00),
    ('Lumiere Scents', 'Ocean Breeze', 'Clean aquatic fragrance', 'Sea salt, citrus, cedar', 13000.00),
    ('Lumiere Scents', 'White Jasmine', 'Elegant white floral fragrance', 'Jasmine, lily, white musk', 16000.00),
    ('Lumiere Scents', 'Golden Oud', 'Rich woody fragrance', 'Oud, saffron, amber', 20000.00)
) AS v(brand_name, product_name, description, notes, price)
JOIN brands b ON b.name = v.brand_name
WHERE NOT EXISTS (
    SELECT 1 FROM products p WHERE p.brand_id = b.brand_id AND p.name = v.product_name
);

-- 5) Machines
INSERT INTO machines (brand_id, location_id, serial_number, device_identity, firmware_version,
                      connection_status, operating_status, last_seen_at, created_at)
SELECT b.brand_id, l.location_id, v.serial_number, v.device_identity, '1.0.0',
       'ONLINE', 'ACTIVE', NOW() - INTERVAL '2 minutes', NOW() - INTERVAL '35 days'
FROM (VALUES
    ('Maison Aroma', 'District 1 Flagship', 'MA-MACHINE-001', 'ma-device-001'),
    ('Lumiere Scents', 'Thu Duc Experience Store', 'LS-MACHINE-001', 'ls-device-001')
) AS v(brand_name, location_name, serial_number, device_identity)
JOIN brands b ON b.name = v.brand_name
JOIN locations l ON l.brand_id = b.brand_id AND l.name = v.location_name
ON CONFLICT (serial_number) DO NOTHING;

-- 6) Machine slots (three slots per machine)
INSERT INTO machine_slots (brand_id, machine_id, product_id, slot_number, price,
                           low_stock_threshold, spray_duration_ms, status)
SELECT b.brand_id, m.machine_id, p.product_id, v.slot_number, p.price_per_spray,
       10.000, 800, 'AVAILABLE'
FROM (VALUES
    ('Maison Aroma', 1, 'Citrus Morning'),
    ('Maison Aroma', 2, 'Velvet Rose'),
    ('Maison Aroma', 3, 'Amber Night'),
    ('Lumiere Scents', 1, 'Ocean Breeze'),
    ('Lumiere Scents', 2, 'White Jasmine'),
    ('Lumiere Scents', 3, 'Golden Oud')
) AS v(brand_name, slot_number, product_name)
JOIN brands b ON b.name = v.brand_name
JOIN machines m ON m.brand_id = b.brand_id
JOIN products p ON p.brand_id = b.brand_id AND p.name = v.product_name
ON CONFLICT (machine_id, slot_number) DO NOTHING;

-- 7) Inventory batches and installed bottles for slot 1 of each machine
INSERT INTO inventory_batches (brand_id, product_id, batch_number, quantity_received,
                               received_at, expiration_date, status)
SELECT b.brand_id, p.product_id, v.batch_number, 100.000,
       NOW() - INTERVAL '25 days', CURRENT_DATE + INTERVAL '300 days', 'ACTIVE'
FROM (VALUES
    ('Maison Aroma', 'Citrus Morning', 'MA-BATCH-001'),
    ('Lumiere Scents', 'Ocean Breeze', 'LS-BATCH-001')
) AS v(brand_name, product_name, batch_number)
JOIN brands b ON b.name = v.brand_name
JOIN products p ON p.brand_id = b.brand_id AND p.name = v.product_name
ON CONFLICT (brand_id, batch_number) DO NOTHING;

INSERT INTO inventory_bottles (brand_id, batch_id, slot_id, bottle_code, initial_quantity,
                               remaining_quantity, status, installed_at)
SELECT b.brand_id, ib.batch_id, s.slot_id, v.bottle_code, 100.000, 90.000,
       'INSTALLED', NOW() - INTERVAL '20 days'
FROM (VALUES
    ('Maison Aroma', 'Citrus Morning', 1, 'MA-BOTTLE-001'),
    ('Lumiere Scents', 'Ocean Breeze', 1, 'LS-BOTTLE-001')
) AS v(brand_name, product_name, slot_number, bottle_code)
JOIN brands b ON b.name = v.brand_name
JOIN products p ON p.brand_id = b.brand_id AND p.name = v.product_name
JOIN inventory_batches ib ON ib.brand_id = b.brand_id AND ib.product_id = p.product_id
JOIN machines m ON m.brand_id = b.brand_id
JOIN machine_slots s ON s.machine_id = m.machine_id AND s.slot_number = v.slot_number
WHERE NOT EXISTS (SELECT 1 FROM inventory_bottles x WHERE x.bottle_code = v.bottle_code);

-- Initial installation movements: 100 ml loaded into each bottle.
INSERT INTO inventory_movements (brand_id, bottle_id, user_id, command_id, movement_type,
                                 quantity, quantity_before, quantity_after, reason, created_at)
SELECT b.brand_id, ib.bottle_id, u.user_id, NULL, 'INSTALL',
       100.000, 0.000, 100.000, 'Initial demo bottle installation', NOW() - INTERVAL '20 days'
FROM (VALUES ('Maison Aroma', 'MA-BOTTLE-001', 'stock@maisonaroma.local'),
             ('Lumiere Scents', 'LS-BOTTLE-001', 'stock@lumierescents.local'))
     AS v(brand_name, bottle_code, email)
JOIN brands b ON b.name = v.brand_name
JOIN inventory_bottles ib ON ib.brand_id = b.brand_id AND ib.bottle_code = v.bottle_code
JOIN users u ON u.email = v.email
WHERE NOT EXISTS (
    SELECT 1 FROM inventory_movements im
    WHERE im.bottle_id = ib.bottle_id AND im.movement_type = 'INSTALL'
);

-- 8) Thirty days of dashboard orders. 20 dispensed, 4 failed, 2 uncertain,
--    2 currently dispensing, 1 pending and 1 cancelled.
INSERT INTO orders (brand_id, machine_id, slot_id, product_id, status, price_snapshot,
                    currency, payment_ref, expires_at, failure_reason, review_note, created_at)
SELECT b.brand_id, m.machine_id, s.slot_id, p.product_id,
       CASE
           WHEN g.n <= 20 THEN 'DISPENSED'
           WHEN g.n <= 24 THEN 'FAILED'
           WHEN g.n <= 26 THEN 'UNCERTAIN'
           WHEN g.n <= 28 THEN 'DISPENSING'
           WHEN g.n = 29 THEN 'PENDING'
           ELSE 'CANCELLED'
       END,
       p.price_per_spray, 'VND', 'SEED-PAY-' || LPAD(g.n::text, 4, '0'),
       NOW() - ((g.n - 1) * INTERVAL '1 day') + INTERVAL '15 minutes',
       CASE WHEN g.n BETWEEN 21 AND 24 THEN 'Demo dispensing failure'
            WHEN g.n BETWEEN 25 AND 26 THEN 'Device response timeout'
            ELSE NULL END,
       CASE WHEN g.n BETWEEN 25 AND 26 THEN 'Requires operator review' ELSE NULL END,
       NOW() - ((g.n - 1) * INTERVAL '1 day')
FROM generate_series(1, 30) AS g(n)
JOIN brands b ON b.name = CASE WHEN g.n % 2 = 1 THEN 'Maison Aroma' ELSE 'Lumiere Scents' END
JOIN machines m ON m.brand_id = b.brand_id
JOIN machine_slots s ON s.machine_id = m.machine_id AND s.slot_number = 1
JOIN products p ON p.product_id = s.product_id
WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.payment_ref = 'SEED-PAY-' || LPAD(g.n::text, 4, '0'));

-- 9) Successful payments for orders that reached the device workflow.
INSERT INTO payments (brand_id, order_id, provider_reference, payment_method, amount,
                      currency, status, paid_at, created_at)
SELECT o.brand_id, o.order_id, 'SEED-PROVIDER-' || o.payment_ref, 'QR',
       o.price_snapshot, o.currency, 'SUCCEEDED', o.created_at + INTERVAL '1 minute',
       o.created_at + INTERVAL '1 minute'
FROM orders o
WHERE o.payment_ref LIKE 'SEED-PAY-%'
  AND o.status IN ('DISPENSED', 'FAILED', 'UNCERTAIN', 'DISPENSING')
  AND NOT EXISTS (SELECT 1 FROM payments p WHERE p.order_id = o.order_id);

-- 10) One command per paid order; command status follows the order state.
INSERT INTO dispense_commands (brand_id, order_id, slot_id, command_reference, idempotency_key,
                               signature, status, expires_at, acked_at, executed_at,
                               failure_reason, inventory_applied, created_at)
SELECT o.brand_id, o.order_id, o.slot_id,
       'SEED-CMD-' || o.payment_ref, 'SEED-IDEM-' || o.payment_ref,
       'DEMO-SEED-SIGNATURE-NOT-FOR-DEVICE-USE',
       CASE o.status
           WHEN 'DISPENSED' THEN 'SUCCEEDED'
           WHEN 'FAILED' THEN 'FAILED'
           WHEN 'UNCERTAIN' THEN 'TIMED_OUT'
           ELSE 'ACKNOWLEDGED'
       END,
       o.created_at + INTERVAL '5 minutes',
       CASE WHEN o.status IN ('DISPENSED', 'FAILED', 'UNCERTAIN', 'DISPENSING')
            THEN o.created_at + INTERVAL '2 minutes' ELSE NULL END,
       CASE WHEN o.status IN ('DISPENSED', 'FAILED')
            THEN o.created_at + INTERVAL '3 minutes' ELSE NULL END,
       CASE WHEN o.status = 'FAILED' THEN 'Demo device reported failure'
            WHEN o.status = 'UNCERTAIN' THEN 'Demo command timed out'
            ELSE NULL END,
       (o.status = 'DISPENSED'), o.created_at + INTERVAL '1 minute'
FROM orders o
WHERE o.payment_ref LIKE 'SEED-PAY-%'
  AND o.status IN ('DISPENSED', 'FAILED', 'UNCERTAIN', 'DISPENSING')
  AND NOT EXISTS (SELECT 1 FROM dispense_commands c WHERE c.order_id = o.order_id);

-- 11) Dispense movements for the 20 successful demo orders (10 per brand).
--     Quantities reconcile exactly with each bottle's 90 ml remaining balance.
WITH successful_dispenses AS (
    SELECT o.brand_id, o.order_id, c.command_id, ib.bottle_id,
           ROW_NUMBER() OVER (PARTITION BY o.brand_id ORDER BY o.created_at) AS seq
    FROM orders o
    JOIN dispense_commands c ON c.order_id = o.order_id
    JOIN inventory_bottles ib ON ib.brand_id = o.brand_id AND ib.status = 'INSTALLED'
    WHERE o.payment_ref LIKE 'SEED-PAY-%' AND o.status = 'DISPENSED'
)
INSERT INTO inventory_movements (brand_id, bottle_id, user_id, command_id, movement_type,
                                 quantity, quantity_before, quantity_after, reason, created_at)
SELECT sd.brand_id, sd.bottle_id, NULL, sd.command_id, 'DISPENSE',
       -1.000, 101.000 - sd.seq, 100.000 - sd.seq,
       'Demo successful perfume dispense', NOW() - ((sd.seq) * INTERVAL '1 day')
FROM successful_dispenses sd
WHERE NOT EXISTS (SELECT 1 FROM inventory_movements im WHERE im.command_id = sd.command_id);

-- 12) Device events and telemetry over the recent month.
INSERT INTO device_events (brand_id, machine_id, event_type, event_reference, event_data,
                           occurred_at, received_at)
SELECT b.brand_id, m.machine_id, v.event_type, v.event_reference, v.event_data::jsonb,
       NOW() - (v.days_ago * INTERVAL '1 day'), NOW() - (v.days_ago * INTERVAL '1 day') + INTERVAL '2 seconds'
FROM (VALUES
    ('Maison Aroma', 'HEARTBEAT', 'SEED-EVT-MA-001', '{"status":"ONLINE","battery":98}', 0),
    ('Maison Aroma', 'DOOR_OPEN', 'SEED-EVT-MA-002', '{"door":"OPEN","source":"maintenance"}', 3),
    ('Maison Aroma', 'LOW_STOCK', 'SEED-EVT-MA-003', '{"slot":1,"remaining":9.5}', 5),
    ('Lumiere Scents', 'HEARTBEAT', 'SEED-EVT-LS-001', '{"status":"ONLINE","battery":96}', 0),
    ('Lumiere Scents', 'DISPENSE_ERROR', 'SEED-EVT-LS-002', '{"slot":1,"code":"ACTUATOR_TIMEOUT"}', 2),
    ('Lumiere Scents', 'LEAK_WARNING', 'SEED-EVT-LS-003', '{"sensor":"LEAK","detected":true}', 7)
) AS v(brand_name, event_type, event_reference, event_data, days_ago)
JOIN brands b ON b.name = v.brand_name
JOIN machines m ON m.brand_id = b.brand_id
ON CONFLICT (event_reference) DO NOTHING;

INSERT INTO telemetry_readings (brand_id, machine_id, slot_id, reading_reference, weight_g,
                                estimated_remaining, door_open, leak_detected, actuator_state,
                                power_status, occurred_at, received_at)
SELECT b.brand_id, m.machine_id, s.slot_id, v.reading_reference, v.weight_g,
       v.estimated_remaining, v.door_open, v.leak_detected, v.actuator_state,
       v.power_status, NOW() - (v.days_ago * INTERVAL '1 day'),
       NOW() - (v.days_ago * INTERVAL '1 day') + INTERVAL '2 seconds'
FROM (VALUES
    ('Maison Aroma', 'SEED-READ-MA-001', 450.000, 90.000, FALSE, FALSE, 'IDLE', 'NORMAL', 0),
    ('Maison Aroma', 'SEED-READ-MA-002', 420.000, 75.000, FALSE, FALSE, 'IDLE', 'NORMAL', 4),
    ('Maison Aroma', 'SEED-READ-MA-003', 390.000, 60.000, TRUE, FALSE, 'IDLE', 'NORMAL', 8),
    ('Lumiere Scents', 'SEED-READ-LS-001', 455.000, 90.000, FALSE, FALSE, 'IDLE', 'NORMAL', 0),
    ('Lumiere Scents', 'SEED-READ-LS-002', 430.000, 70.000, FALSE, FALSE, 'IDLE', 'NORMAL', 3),
    ('Lumiere Scents', 'SEED-READ-LS-003', 400.000, 55.000, FALSE, TRUE, 'STOPPED', 'NORMAL', 7)
) AS v(brand_name, reading_reference, weight_g, estimated_remaining, door_open,
      leak_detected, actuator_state, power_status, days_ago)
JOIN brands b ON b.name = v.brand_name
JOIN machines m ON m.brand_id = b.brand_id
JOIN machine_slots s ON s.machine_id = m.machine_id AND s.slot_number = 1
ON CONFLICT (machine_id, reading_reference) DO NOTHING;

-- 13) Incidents, alerts, notifications and maintenance work.
INSERT INTO incidents (brand_id, order_id, machine_id, assigned_user_id, incident_type,
                       severity, status, description, created_at, resolved_at)
SELECT b.brand_id, o.order_id, m.machine_id, u.user_id, v.incident_type,
       v.severity, v.status, v.description, NOW() - (v.days_ago * INTERVAL '1 day'),
       CASE WHEN v.status = 'RESOLVED' THEN NOW() - ((v.days_ago - 1) * INTERVAL '1 day') ELSE NULL END
FROM (VALUES
    ('Maison Aroma', 'ACTUATOR_ERROR', 'HIGH', 'OPEN', 'Actuator response was not received in time', 3, 'tech@maisonaroma.local'),
    ('Lumiere Scents', 'LEAK_DETECTED', 'CRITICAL', 'IN_PROGRESS', 'Leak sensor reported a possible liquid leak', 7, 'tech@lumierescents.local'),
    ('Maison Aroma', 'DISPENSE_FAILURE', 'MEDIUM', 'RESOLVED', 'A demo dispense command failed', 12, 'tech@maisonaroma.local')
) AS v(brand_name, incident_type, severity, status, description, days_ago, assigned_email)
JOIN brands b ON b.name = v.brand_name
JOIN machines m ON m.brand_id = b.brand_id
JOIN users u ON u.email = v.assigned_email
LEFT JOIN LATERAL (
    SELECT ord.order_id FROM orders ord
    WHERE ord.brand_id = b.brand_id AND ord.status IN ('FAILED', 'UNCERTAIN')
    ORDER BY ord.created_at DESC LIMIT 1
) o ON TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM incidents i WHERE i.brand_id = b.brand_id AND i.incident_type = v.incident_type
);

INSERT INTO alerts (brand_id, machine_id, incident_id, assigned_user_id, alert_type,
                    severity, status, message, created_at, acknowledged_at, resolved_at)
SELECT b.brand_id, m.machine_id, i.incident_id, u.user_id, v.alert_type,
       v.severity, v.status, v.message, NOW() - (v.days_ago * INTERVAL '1 day'),
       CASE WHEN v.status IN ('ACKNOWLEDGED', 'RESOLVED') THEN NOW() - ((v.days_ago - 0.5) * INTERVAL '1 day') ELSE NULL END,
       CASE WHEN v.status = 'RESOLVED' THEN NOW() - ((v.days_ago - 1) * INTERVAL '1 day') ELSE NULL END
FROM (VALUES
    ('Maison Aroma', 'ACTUATOR_ERROR', 'ACTUATOR_TIMEOUT', 'HIGH', 'OPEN', 'Actuator timeout detected', 3, 'ops@maisonaroma.local'),
    ('Lumiere Scents', 'LEAK_DETECTED', 'LEAK_WARNING', 'CRITICAL', 'ACKNOWLEDGED', 'Possible liquid leak detected', 7, 'ops@lumierescents.local'),
    ('Maison Aroma', 'DISPENSE_FAILURE', 'DISPENSE_FAILURE', 'MEDIUM', 'RESOLVED', 'Dispensing failure was reviewed', 12, 'ops@maisonaroma.local')
) AS v(brand_name, incident_type, alert_type, severity, status, message, days_ago, assigned_email)
JOIN brands b ON b.name = v.brand_name
JOIN machines m ON m.brand_id = b.brand_id
JOIN users u ON u.email = v.assigned_email
JOIN incidents i ON i.brand_id = b.brand_id AND i.incident_type = v.incident_type
WHERE NOT EXISTS (SELECT 1 FROM alerts a WHERE a.brand_id = b.brand_id AND a.alert_type = v.alert_type);

INSERT INTO notifications (brand_id, user_id, alert_id, notification_type, message, status, created_at, read_at)
SELECT b.brand_id, u.user_id, a.alert_id, 'ALERT', a.message,
       CASE WHEN a.status = 'RESOLVED' THEN 'READ' ELSE 'UNREAD' END,
       a.created_at + INTERVAL '1 minute',
       CASE WHEN a.status = 'RESOLVED' THEN a.created_at + INTERVAL '10 minutes' ELSE NULL END
FROM alerts a
JOIN brands b ON b.brand_id = a.brand_id
JOIN users u ON u.brand_id = b.brand_id AND u.email LIKE 'admin@%'
WHERE NOT EXISTS (SELECT 1 FROM notifications n WHERE n.alert_id = a.alert_id AND n.user_id = u.user_id);

INSERT INTO maintenance_tickets (brand_id, machine_id, alert_id, assigned_user_id, category,
                                 priority, status, description, corrective_action, created_at,
                                 due_at, completed_at)
SELECT b.brand_id, m.machine_id, a.alert_id, u.user_id, v.category, v.priority,
       v.status, v.description, v.corrective_action, NOW() - (v.days_ago * INTERVAL '1 day'),
       NOW() + (v.due_in_days * INTERVAL '1 day'),
       CASE WHEN v.status = 'COMPLETED' THEN NOW() - INTERVAL '1 day' ELSE NULL END
FROM (VALUES
    ('Maison Aroma', 'ACTUATOR_TIMEOUT', 'ACTUATOR', 'HIGH', 'IN_PROGRESS', 'Inspect actuator and wiring', 'Technician inspection in progress', 3, 1, 'tech@maisonaroma.local'),
    ('Lumiere Scents', 'LEAK_WARNING', 'LEAK_SENSOR', 'URGENT', 'OPEN', 'Inspect liquid path and leak sensor', NULL, 7, 0, 'tech@lumierescents.local'),
    ('Maison Aroma', 'DISPENSE_FAILURE', 'DISPENSER', 'MEDIUM', 'COMPLETED', 'Review previous dispensing failure', 'Cleaned nozzle and verified operation', 12, -2, 'tech@maisonaroma.local')
) AS v(brand_name, alert_type, category, priority, status, description, corrective_action,
      days_ago, due_in_days, assigned_email)
JOIN brands b ON b.name = v.brand_name
JOIN machines m ON m.brand_id = b.brand_id
JOIN alerts a ON a.brand_id = b.brand_id AND a.alert_type = v.alert_type
JOIN users u ON u.email = v.assigned_email
WHERE NOT EXISTS (
    SELECT 1 FROM maintenance_tickets t WHERE t.brand_id = b.brand_id AND t.category = v.category
);

INSERT INTO maintenance_tasks (brand_id, ticket_id, assigned_user_id, sort_order, task_name,
                               task_result, status, completed_at)
SELECT t.brand_id, t.ticket_id, t.assigned_user_id, v.sort_order, v.task_name,
       v.task_result, v.status,
       CASE WHEN v.status = 'COMPLETED' THEN COALESCE(t.completed_at, NOW() - INTERVAL '1 day') ELSE NULL END
FROM maintenance_tickets t
JOIN (VALUES
    ('ACTUATOR', 1, 'Inspect actuator connection', 'Connector checked', 'COMPLETED'),
    ('ACTUATOR', 2, 'Run actuator test', NULL, 'IN_PROGRESS'),
    ('LEAK_SENSOR', 1, 'Inspect liquid tubing', NULL, 'PENDING'),
    ('LEAK_SENSOR', 2, 'Test leak sensor', NULL, 'PENDING'),
    ('DISPENSER', 1, 'Clean dispenser nozzle', 'Nozzle cleaned', 'COMPLETED'),
    ('DISPENSER', 2, 'Verify spray output', 'Spray output verified', 'COMPLETED')
) AS v(category, sort_order, task_name, task_result, status) ON v.category = t.category
WHERE NOT EXISTS (
    SELECT 1 FROM maintenance_tasks mt WHERE mt.ticket_id = t.ticket_id AND mt.sort_order = v.sort_order
);

-- 14) Refund two failed orders. The order transition is FAILED -> REFUNDED;
--     the related command remains FAILED as the physical dispense did not succeed.
WITH refund_candidates AS (
    SELECT o.order_id, o.brand_id, p.payment_id, o.payment_ref,
           ROW_NUMBER() OVER (ORDER BY o.created_at) AS rn
    FROM orders o
    JOIN payments p ON p.order_id = o.order_id
    WHERE o.payment_ref LIKE 'SEED-PAY-%' AND o.status = 'FAILED'
)
UPDATE orders o SET status = 'REFUNDED'
FROM refund_candidates rc
WHERE rc.order_id = o.order_id AND rc.rn <= 2;

WITH refund_candidates AS (
    SELECT o.order_id, p.payment_id, o.payment_ref,
           ROW_NUMBER() OVER (ORDER BY o.created_at) AS rn
    FROM orders o
    JOIN payments p ON p.order_id = o.order_id
    WHERE o.payment_ref LIKE 'SEED-PAY-%' AND o.status = 'REFUNDED'
)
UPDATE payments p SET status = 'REFUNDED'
FROM refund_candidates rc
WHERE rc.payment_id = p.payment_id AND rc.rn <= 2;

INSERT INTO payment_refunds (brand_id, payment_id, refund_reference, amount, reason,
                             status, created_at, completed_at)
SELECT p.brand_id, p.payment_id, 'SEED-REFUND-' || o.payment_ref,
       p.amount, 'Demo refund after unsuccessful dispense', 'COMPLETED',
       o.created_at + INTERVAL '10 minutes', o.created_at + INTERVAL '15 minutes'
FROM orders o
JOIN payments p ON p.order_id = o.order_id
WHERE o.payment_ref LIKE 'SEED-PAY-%' AND o.status = 'REFUNDED'
  AND NOT EXISTS (SELECT 1 FROM payment_refunds r WHERE r.payment_id = p.payment_id);

-- 15) Audit trail samples
INSERT INTO audit_logs (brand_id, user_id, action, entity_type, entity_id,
                        old_values, new_values, source_ip, created_at)
SELECT b.brand_id, u.user_id, v.action, v.entity_type, v.entity_id,
       v.old_values::jsonb, v.new_values::jsonb, '127.0.0.1', NOW() - (v.days_ago * INTERVAL '1 day')
FROM (VALUES
    ('Maison Aroma', 'admin@maisonaroma.local', 'CREATE', 'PRODUCT', (SELECT product_id FROM products WHERE name = 'Citrus Morning' LIMIT 1), NULL, '{"status":"ACTIVE"}', 25),
    ('Lumiere Scents', 'admin@lumierescents.local', 'UPDATE', 'MACHINE', (SELECT machine_id FROM machines WHERE serial_number = 'LS-MACHINE-001'), '{"operating_status":"MAINTENANCE"}', '{"operating_status":"ACTIVE"}', 10),
    ('Maison Aroma', 'ops@maisonaroma.local', 'RESOLVE', 'INCIDENT', (SELECT incident_id FROM incidents WHERE incident_type = 'DISPENSE_FAILURE' LIMIT 1), '{"status":"OPEN"}', '{"status":"RESOLVED"}', 12)
) AS v(brand_name, email, action, entity_type, entity_id, old_values, new_values, days_ago)
JOIN brands b ON b.name = v.brand_name
JOIN users u ON u.email = v.email
WHERE v.entity_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM audit_logs al WHERE al.brand_id = b.brand_id AND al.action = v.action AND al.entity_type = v.entity_type AND al.entity_id = v.entity_id);

-- Keep installed bottles and their inventory ledger consistent with the seeded dispenses.
UPDATE inventory_bottles ib
SET remaining_quantity = 90.000
WHERE ib.bottle_code IN ('MA-BOTTLE-001', 'LS-BOTTLE-001');

