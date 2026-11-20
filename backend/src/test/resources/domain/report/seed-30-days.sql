-- Deterministic report fixtures; use only a disposable database/transaction.
-- Set LOCAL scent.reports_seed_end = '2024-06-30' for repeatable test dates.
-- A: 120 orders, gross 2,100,000, refunded 900,000, net 1,200,000 VND.
-- B: 30 orders, net 1,500,000 VND. Diagnostics are not sales.
DO $$
DECLARE
    a BIGINT; b BIGINT; la BIGINT; lb BIGINT; rose BIGINT; jasmine BIGINT; bp BIGINT;
    ma BIGINT; ma2 BIGINT; mb BIGINT; sa BIGINT; sa2 BIGINT; sb BIGINT;
    operator_id BIGINT; oid BIGINT; day DATE; stamp TIMESTAMPTZ;
    anchor DATE := coalesce(nullif(current_setting('scent.reports_seed_end', true), ''), current_date::text)::date;
    state TEXT; price BIGINT; machine BIGINT; slot BIGINT; product BIGINT; brand BIGINT;
    index INTEGER; category INTEGER;
BEGIN
    INSERT INTO brands(name,status,created_at,updated_at) VALUES ('REPORT-SEED-A','ACTIVE',now(),now()) RETURNING id INTO a;
    INSERT INTO brands(name,status,created_at,updated_at) VALUES ('REPORT-SEED-B','ACTIVE',now(),now()) RETURNING id INTO b;
    INSERT INTO locations(brand_id,name,created_at,updated_at) VALUES (a,'Report A location',now(),now()) RETURNING id INTO la;
    INSERT INTO locations(brand_id,name,created_at,updated_at) VALUES (b,'Report B location',now(),now()) RETURNING id INTO lb;
    INSERT INTO products(brand_id,name,default_price,active,created_at,updated_at) VALUES (a,'Rose, "Fresh"',99999,true,now(),now()) RETURNING id INTO rose;
    INSERT INTO products(brand_id,name,default_price,active,created_at,updated_at) VALUES (a,'Jasmine',88888,true,now(),now()) RETURNING id INTO jasmine;
    INSERT INTO products(brand_id,name,default_price,active,created_at,updated_at) VALUES (b,'Other brand',50000,true,now(),now()) RETURNING id INTO bp;
    INSERT INTO machines(brand_id,location_id,serial_number,device_id,connectivity_status,operating_status,created_at,updated_at)
        VALUES (a,la,'REPORT-A-1','REPORT-A-1','ONLINE','ACTIVE',now(),now()) RETURNING id INTO ma;
    INSERT INTO machines(brand_id,location_id,serial_number,device_id,connectivity_status,operating_status,created_at,updated_at)
        VALUES (a,la,'REPORT-A-2','REPORT-A-2','OFFLINE','ACTIVE',now(),now()) RETURNING id INTO ma2;
    INSERT INTO machines(brand_id,location_id,serial_number,device_id,connectivity_status,operating_status,created_at,updated_at)
        VALUES (b,lb,'REPORT-B-1','REPORT-B-1','ONLINE','ACTIVE',now(),now()) RETURNING id INTO mb;
    INSERT INTO machines(brand_id,location_id,serial_number,device_id,connectivity_status,operating_status,created_at,updated_at) VALUES
        (a,la,'REPORT-A-3','REPORT-A-3','UNSTABLE','ACTIVE',now(),now()),
        (a,la,'REPORT-A-4','REPORT-A-4','ONLINE','MAINTENANCE',now(),now()),
        (a,la,'REPORT-A-5','REPORT-A-5','ONLINE','DISABLED',now(),now()),
        (a,la,'REPORT-A-6','REPORT-A-6','OFFLINE','ERROR',now(),now());
    INSERT INTO machine_slots(machine_id,slot_number,product_id,dose_ml,available,created_at,updated_at) VALUES (ma,1,rose,2,true,now(),now()) RETURNING id INTO sa;
    -- Two slots on the same machine/product must not duplicate machine counts.
    INSERT INTO machine_slots(machine_id,slot_number,product_id,dose_ml,available,created_at,updated_at) VALUES (ma,2,rose,2,false,now(),now());
    INSERT INTO machine_slots(machine_id,slot_number,product_id,dose_ml,available,created_at,updated_at) VALUES (ma2,1,jasmine,3,false,now(),now()) RETURNING id INTO sa2;
    INSERT INTO machine_slots(machine_id,slot_number,product_id,dose_ml,available,created_at,updated_at) VALUES (mb,1,bp,2,true,now(),now()) RETURNING id INTO sb;
    INSERT INTO inventory_bottles(product_id,slot_id,bottle_code,initial_quantity_ml,remaining_quantity_ml,status,created_at,updated_at) VALUES
        (rose,sa,'REPORT-BTL-A',100,5,'NEARLY_EMPTY',now(),now()),
        (jasmine,sa2,'REPORT-BTL-A2',100,0,'EMPTY',now(),now()),
        (bp,sb,'REPORT-BTL-B',100,2,'NEARLY_EMPTY',now(),now());
    INSERT INTO users(brand_id,email,password_hash,full_name,status,created_at,updated_at)
        VALUES (a,'report-seed-operator@example.com','not-a-login-account','Seed diagnostic operator','ACTIVE',now(),now()) RETURNING id INTO operator_id;

    FOR index IN 0..29 LOOP
        day := anchor - index;
        stamp := (day + time '10:00') AT TIME ZONE 'Asia/Ho_Chi_Minh';
        FOR category IN 1..5 LOOP
            brand := CASE WHEN category = 5 THEN b ELSE a END;
            product := CASE WHEN category = 5 THEN bp WHEN category IN (1,2) THEN rose ELSE jasmine END;
            machine := CASE WHEN category = 5 THEN mb WHEN category IN (1,2) THEN ma ELSE ma2 END;
            slot := CASE WHEN category = 5 THEN sb WHEN category IN (1,2) THEN sa ELSE sa2 END;
            price := CASE WHEN category = 5 THEN 50000 WHEN category IN (1,2) THEN 20000 ELSE 30000 END;
            state := CASE category WHEN 1 THEN 'DISPENSED' WHEN 2 THEN 'FAILED' WHEN 3 THEN 'EXPIRED' WHEN 4 THEN 'REFUNDED' ELSE 'DISPENSED' END;
            INSERT INTO orders(brand_id,machine_id,slot_id,product_id,status,price_snapshot,currency,payment_ref,expires_at,created_at,updated_at)
                VALUES (brand,machine,slot,product,state,price,'VND','REPORT-'||category||'-'||day,stamp + interval '3 minutes',stamp,stamp) RETURNING id INTO oid;
            IF category <> 3 THEN
                INSERT INTO payments(order_id,provider,provider_reference,amount,currency,status,paid_at,created_at,updated_at)
                    VALUES (oid,'REPORT-SEED','PAY-'||category||'-'||day,price,'VND',CASE WHEN category = 4 THEN 'REFUNDED' ELSE 'SUCCEEDED' END,
                            stamp + interval '1 minute',stamp,stamp);
                INSERT INTO dispense_commands(order_id,machine_id,slot_id,idempotency_key,dose_ml,spray_duration_ms,signature,status,issued_at,expires_at,completed_at,inventory_applied,created_at,updated_at)
                    VALUES (oid,machine,slot,'CMD-'||category||'-'||day,CASE WHEN category = 4 THEN 3 ELSE 2 END,800,'seed',
                            CASE WHEN category IN (1,5) THEN 'SUCCEEDED' ELSE 'FAILED' END,stamp + interval '1 minute',stamp + interval '2 minutes',stamp + interval '2 minutes',category IN (1,5),stamp,stamp);
            END IF;
        END LOOP;
        INSERT INTO dispense_commands(purpose,requested_by,machine_id,slot_id,idempotency_key,dose_ml,spray_duration_ms,signature,status,issued_at,expires_at,completed_at,inventory_applied,created_at,updated_at)
            VALUES ('DIAGNOSTIC',operator_id,ma,sa,'DIAG-'||day,1,800,'seed','SUCCEEDED',stamp,stamp + interval '1 minute',stamp,true,stamp,stamp);
    END LOOP;
END $$;
