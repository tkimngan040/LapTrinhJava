-- =============================================================================
-- V1__core.sql — tenancy, identity, catalogue and physical assets
--
-- DRAFT, owned by task M1 (Tra My). It holds the subset of the entity
-- inventory in Report section 2.7.2 that the authentication, ordering and
-- dispensing code needs in order to run. Check it against 2.7.2 and add the
-- missing columns and tables: in this file while it is unmerged, in a new
-- migration once it has been pushed.
--
-- Conventions: money is an integer amount in VND; volumes are integer
-- millilitres; every timestamp is TIMESTAMPTZ in UTC; enumerations are stored
-- as text and guarded by a CHECK so the database refuses an unknown value.
-- =============================================================================

-- A. Tenancy and identity -----------------------------------------------------

CREATE TABLE brands (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(120) NOT NULL,
    status      VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    created_at  TIMESTAMPTZ  NOT NULL,
    updated_at  TIMESTAMPTZ  NOT NULL,
    CONSTRAINT uq_brand_name UNIQUE (name),
    CONSTRAINT ck_brand_status CHECK (status IN ('ACTIVE', 'SUSPENDED'))
);

CREATE TABLE roles (
    id          BIGSERIAL PRIMARY KEY,
    role_name   VARCHAR(40) NOT NULL,
    description VARCHAR(200),
    created_at  TIMESTAMPTZ NOT NULL,
    updated_at  TIMESTAMPTZ NOT NULL,
    CONSTRAINT uq_role_name UNIQUE (role_name)
);

-- brand_id is NULL for platform-level accounts, which is how a Platform Super
-- Administrator is recognised (Report section 2.7.2 group A).
-- token_version backs FR1.8: incrementing it invalidates every JWT already
-- issued to that account, with no session state on the server.
CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    brand_id        BIGINT       REFERENCES brands (id),
    email           VARCHAR(160) NOT NULL,
    password_hash   VARCHAR(100) NOT NULL,
    full_name       VARCHAR(120) NOT NULL,
    status          VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    token_version   INTEGER      NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ  NOT NULL,
    updated_at      TIMESTAMPTZ  NOT NULL,
    CONSTRAINT uq_user_email UNIQUE (email),
    CONSTRAINT ck_user_status CHECK (status IN ('ACTIVE', 'LOCKED', 'DISABLED'))
);

CREATE INDEX ix_users_brand ON users (brand_id);

CREATE TABLE user_roles (
    user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES roles (id),
    PRIMARY KEY (user_id, role_id)
);

-- B. Catalogue and physical assets --------------------------------------------

CREATE TABLE locations (
    id          BIGSERIAL PRIMARY KEY,
    brand_id    BIGINT       NOT NULL REFERENCES brands (id),
    name        VARCHAR(160) NOT NULL,
    address     VARCHAR(255),
    created_at  TIMESTAMPTZ  NOT NULL,
    updated_at  TIMESTAMPTZ  NOT NULL
);

CREATE INDEX ix_locations_brand ON locations (brand_id);

CREATE TABLE products (
    id              BIGSERIAL PRIMARY KEY,
    brand_id        BIGINT       NOT NULL REFERENCES brands (id),
    name            VARCHAR(160) NOT NULL,
    description     VARCHAR(600),
    fragrance_notes VARCHAR(300),
    image_url       VARCHAR(400),
    default_price   BIGINT       NOT NULL,
    active          BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL,
    updated_at      TIMESTAMPTZ  NOT NULL,
    CONSTRAINT ck_product_price CHECK (default_price >= 0)
);

CREATE INDEX ix_products_brand ON products (brand_id);

-- BR1: a machine belongs to exactly one brand at any time, so brand_id is NOT NULL.
CREATE TABLE machines (
    id                  BIGSERIAL PRIMARY KEY,
    brand_id            BIGINT       NOT NULL REFERENCES brands (id),
    location_id         BIGINT       REFERENCES locations (id),
    serial_number       VARCHAR(60)  NOT NULL,
    device_id           VARCHAR(60)  NOT NULL,
    connectivity_status VARCHAR(20)  NOT NULL DEFAULT 'OFFLINE',
    operating_status    VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    firmware_version    VARCHAR(40),
    config_version      VARCHAR(40),
    last_seen_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ  NOT NULL,
    updated_at          TIMESTAMPTZ  NOT NULL,
    CONSTRAINT uq_machine_serial UNIQUE (serial_number),
    CONSTRAINT uq_machine_device UNIQUE (device_id),
    CONSTRAINT ck_machine_connectivity CHECK (connectivity_status IN ('ONLINE', 'UNSTABLE', 'OFFLINE')),
    CONSTRAINT ck_machine_operating CHECK (operating_status IN ('ACTIVE', 'MAINTENANCE', 'DISABLED', 'ERROR'))
);

CREATE INDEX ix_machines_brand ON machines (brand_id);

-- FR2.3 requires at least four independently controlled slots per machine.
-- dose_ml and spray_duration_ms are the calibrated values a dispensing command
-- carries (Report section 2.9.3 step 6).
CREATE TABLE machine_slots (
    id                      BIGSERIAL PRIMARY KEY,
    machine_id              BIGINT      NOT NULL REFERENCES machines (id) ON DELETE CASCADE,
    slot_number             INTEGER     NOT NULL,
    product_id              BIGINT      REFERENCES products (id),
    price                   BIGINT,
    low_stock_threshold_ml  INTEGER     NOT NULL DEFAULT 10,
    dose_ml                 INTEGER     NOT NULL DEFAULT 1,
    spray_duration_ms       INTEGER     NOT NULL DEFAULT 800,
    available               BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at              TIMESTAMPTZ NOT NULL,
    updated_at              TIMESTAMPTZ NOT NULL,
    CONSTRAINT uq_slot_number_per_machine UNIQUE (machine_id, slot_number),
    CONSTRAINT ck_slot_number CHECK (slot_number >= 1),
    CONSTRAINT ck_slot_dose CHECK (dose_ml >= 1),
    CONSTRAINT ck_slot_duration CHECK (spray_duration_ms >= 1)
);

CREATE INDEX ix_slots_machine ON machine_slots (machine_id);

-- Seed the seven roles of Report section 1.4 so the application can start and
-- an administrator account can be created. Tra My replaces this with the full
-- sample data set in V4__seed.sql (task M4).
INSERT INTO roles (role_name, description, created_at, updated_at) VALUES
    ('PLATFORM_SUPER_ADMIN', 'Platform Super Administrator', NOW(), NOW()),
    ('BRAND_ADMIN',          'Brand Administrator',          NOW(), NOW()),
    ('OPERATIONS_MANAGER',   'Operations Manager',           NOW(), NOW()),
    ('TECHNICIAN',           'Technician',                   NOW(), NOW()),
    ('INVENTORY_STAFF',      'Inventory Staff',              NOW(), NOW()),
    ('VIEWER',               'Read-only viewer',             NOW(), NOW()),
    ('CUSTOMER',             'Kiosk customer',               NOW(), NOW());
