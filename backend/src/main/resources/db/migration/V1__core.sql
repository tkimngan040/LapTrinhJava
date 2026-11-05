-- =============================================================================
-- V1__core.sql — tenancy, identity, catalogue and physical assets
--
-- Task M1. The eight tables of groups A and B of the entity inventory in
-- Report section 2.7.2, with the column names, types and keys of the ERD in
-- Figure 2.6.
--
-- Conventions taken from Report section 2.7.1:
--   * every table's primary key is named <entity>_id, as the ERD shows it;
--   * every tenant-owned table carries brand_id (rule 1, BR13 and NFR2.3);
--   * money and quantities are NUMERIC, never floating point;
--   * every point in time is TIMESTAMPTZ, never TIMESTAMP (rule 4);
--   * an enumeration is stored as text and guarded by a CHECK, so the database
--     refuses a value the application does not know.
--
-- Two notes where this file is stricter than the diagram, on purpose:
--   * the ERD writes `text` for the free-text columns; VARCHAR with a generous
--     limit is used where a limit is meaningful and TEXT where it is not;
--   * the ERD shows no updated_at anywhere, and none is added here. Who
--     changed what is recorded in AUDIT_LOGS (BR12, FR10.4), not in a column
--     that would silently overwrite its own history.
-- =============================================================================

-- A. Tenancy and identity -----------------------------------------------------

CREATE TABLE brands (
    brand_id    BIGSERIAL    PRIMARY KEY,
    name        VARCHAR(120) NOT NULL,
    logo_url    VARCHAR(400),
    description TEXT,
    status      VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    created_at  TIMESTAMPTZ  NOT NULL,
    CONSTRAINT uq_brand_name UNIQUE (name),
    CONSTRAINT ck_brand_status CHECK (status IN ('ACTIVE', 'SUSPENDED'))
);

CREATE TABLE roles (
    role_id     BIGSERIAL   PRIMARY KEY,
    role_name   VARCHAR(40) NOT NULL,
    description VARCHAR(200),
    CONSTRAINT uq_role_name UNIQUE (role_name)
);

-- brand_id is NULL for a platform-level account, which is how a Platform Super
-- Administrator is recognised (Report section 2.7.2 group A).
--
-- token_version backs FR1.8. Every issued JWT carries the value it was signed
-- with; incrementing the column rejects every token minted before the increment
-- at the next request, with no session state on the server.
CREATE TABLE users (
    user_id       BIGSERIAL    PRIMARY KEY,
    brand_id      BIGINT       REFERENCES brands (brand_id),
    email         VARCHAR(160) NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    full_name     VARCHAR(120) NOT NULL,
    status        VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    token_version INTEGER      NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ  NOT NULL,
    CONSTRAINT uq_user_email UNIQUE (email),
    CONSTRAINT ck_user_status CHECK (status IN ('ACTIVE', 'LOCKED', 'DISABLED'))
);

CREATE INDEX ix_users_brand ON users (brand_id);

-- Composite primary key, exactly as the ERD has it: a user holds a role once.
-- assigned_at defaults so that the JPA @ManyToMany mapping, which writes only
-- the two key columns, still produces a complete row.
CREATE TABLE user_roles (
    user_id     BIGINT      NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
    role_id     BIGINT      NOT NULL REFERENCES roles (role_id),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id)
);

-- B. Catalogue and physical assets --------------------------------------------

CREATE TABLE locations (
    location_id BIGSERIAL    PRIMARY KEY,
    brand_id    BIGINT       NOT NULL REFERENCES brands (brand_id),
    name        VARCHAR(160) NOT NULL,
    address     TEXT,
    status      VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    CONSTRAINT ck_location_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
);

CREATE INDEX ix_locations_brand ON locations (brand_id);

-- price_per_spray is the brand-wide default. A slot may override it; see the
-- note on machine_slots.price below.
CREATE TABLE products (
    product_id      BIGSERIAL     PRIMARY KEY,
    brand_id        BIGINT        NOT NULL REFERENCES brands (brand_id),
    name            VARCHAR(160)  NOT NULL,
    description     TEXT,
    image_url       VARCHAR(400),
    fragrance_notes VARCHAR(300),
    price_per_spray NUMERIC(12,2) NOT NULL,
    status          VARCHAR(20)   NOT NULL DEFAULT 'ACTIVE',
    CONSTRAINT ck_product_price CHECK (price_per_spray >= 0),
    CONSTRAINT ck_product_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'DISCONTINUED'))
);

CREATE INDEX ix_products_brand ON products (brand_id);

-- BR1: a machine belongs to exactly one brand at any time, so brand_id is
-- NOT NULL. location_id is nullable because a machine may be in storage
-- (Report section 2.7.3).
--
-- connection_status and operating_status are separate and independent
-- (Report section 2.7.2 group B): a machine can be ONLINE and under
-- MAINTENANCE at the same time, and either one alone must block new orders.
CREATE TABLE machines (
    machine_id        BIGSERIAL   PRIMARY KEY,
    brand_id          BIGINT      NOT NULL REFERENCES brands (brand_id),
    location_id       BIGINT      REFERENCES locations (location_id),
    serial_number     VARCHAR(60) NOT NULL,
    device_identity   VARCHAR(60) NOT NULL,
    firmware_version  VARCHAR(40),
    connection_status VARCHAR(20) NOT NULL DEFAULT 'OFFLINE',
    operating_status  VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    last_seen_at      TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL,
    CONSTRAINT uq_machine_serial UNIQUE (serial_number),
    CONSTRAINT uq_machine_device_identity UNIQUE (device_identity),
    CONSTRAINT ck_machine_connection CHECK (connection_status IN ('ONLINE', 'UNSTABLE', 'OFFLINE')),
    CONSTRAINT ck_machine_operating CHECK (operating_status IN ('ACTIVE', 'MAINTENANCE', 'DISABLED', 'ERROR'))
);

CREATE INDEX ix_machines_brand ON machines (brand_id);

-- FR2.3 requires at least four independently controlled slots per machine.
--
-- price is nullable by design (Report section 2.7.2 group B): NULL means "use
-- PRODUCTS.price_per_spray", so a brand-wide price change does not require
-- touching every slot, while one location can still be priced differently.
--
-- spray_duration_ms is the calibrated value a dispensing command carries
-- (Report section 2.9.3 step 6).
CREATE TABLE machine_slots (
    slot_id             BIGSERIAL     PRIMARY KEY,
    brand_id            BIGINT        NOT NULL REFERENCES brands (brand_id),
    machine_id          BIGINT        NOT NULL REFERENCES machines (machine_id) ON DELETE CASCADE,
    product_id          BIGINT        REFERENCES products (product_id),
    slot_number         INTEGER       NOT NULL,
    price               NUMERIC(12,2),
    low_stock_threshold NUMERIC(10,2) NOT NULL DEFAULT 10,
    spray_duration_ms   INTEGER       NOT NULL DEFAULT 800,
    status              VARCHAR(20)   NOT NULL DEFAULT 'EMPTY',
    CONSTRAINT ck_slot_number CHECK (slot_number >= 1),
    CONSTRAINT ck_slot_price CHECK (price IS NULL OR price >= 0),
    CONSTRAINT ck_slot_duration CHECK (spray_duration_ms >= 1),
    CONSTRAINT ck_slot_status CHECK (status IN ('AVAILABLE', 'EMPTY', 'LOW', 'DISABLED'))
);

CREATE INDEX ix_slots_machine ON machine_slots (machine_id);

-- Report section 2.7.4: one slot number may appear only once per machine.
CREATE UNIQUE INDEX uq_slot_number_per_machine
    ON machine_slots (machine_id, slot_number);

-- Seed ------------------------------------------------------------------------
-- The seven roles of Report section 1.4, and one platform administrator so that
-- sign-in can be exercised as soon as the application starts. Tra My replaces
-- this with the full sample data set in V4__seed.sql (task M4).

INSERT INTO roles (role_name, description) VALUES
    ('PLATFORM_SUPER_ADMIN', 'Platform Super Administrator'),
    ('BRAND_ADMIN',          'Brand Administrator'),
    ('OPERATIONS_MANAGER',   'Operations Manager'),
    ('TECHNICIAN',           'Technician'),
    ('INVENTORY_STAFF',      'Inventory Staff'),
    ('VIEWER',               'Read-only viewer'),
    ('CUSTOMER',             'Kiosk customer');

-- brand_id is NULL: this account is platform-level and sees every brand.
-- password_hash is BCrypt, cost 10, of the password 'Admin@12345'.
-- Change it before the application is shown to anyone outside the team.
INSERT INTO users (brand_id, email, password_hash, full_name, status, token_version, created_at)
VALUES (NULL,
        'admin@scentstation.local',
        '$2a$10$6ceTAcoe3JytC52ER/khLe.9KXBWPpjuWmXZ7eYR2.yRR6bm.fg/C',
        'Platform Administrator',
        'ACTIVE',
        0,
        NOW());

INSERT INTO user_roles (user_id, role_id)
SELECT u.user_id, r.role_id
FROM users u, roles r
WHERE u.email = 'admin@scentstation.local'
  AND r.role_name = 'PLATFORM_SUPER_ADMIN';
