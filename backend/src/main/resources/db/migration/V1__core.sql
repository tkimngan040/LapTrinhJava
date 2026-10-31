-- 1. Bảng Brands
CREATE TABLE brands (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Bảng Roles
CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Bảng Users
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    brand_id BIGINT REFERENCES brands(id) ON DELETE CASCADE,
    role_id BIGINT REFERENCES roles(id),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Bảng Perfumes
CREATE TABLE perfumes (
    id BIGSERIAL PRIMARY KEY,
    brand_id BIGINT REFERENCES brands(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    fragrance_notes TEXT,
    description TEXT,
    price_per_spray DECIMAL(12, 2) NOT NULL,
    image_url TEXT,
    status VARCHAR(50) DEFAULT 'AVAILABLE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Bảng Sampling Machines
CREATE TABLE sampling_machines (
    id BIGSERIAL PRIMARY KEY,
    brand_id BIGINT REFERENCES brands(id) ON DELETE CASCADE,
    machine_code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    location_address TEXT,
    connection_status VARCHAR(50) DEFAULT 'DISCONNECTED',
    operating_status VARCHAR(50) DEFAULT 'ACTIVE',
    last_ping_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Bảng Compartments
CREATE TABLE compartments (
    id BIGSERIAL PRIMARY KEY,
    machine_id BIGINT REFERENCES sampling_machines(id) ON DELETE CASCADE,
    slot_number INT NOT NULL,
    max_capacity INT NOT NULL,
    current_quantity INT NOT NULL DEFAULT 0,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    CONSTRAINT uk_machine_slot UNIQUE (machine_id, slot_number)
);

-- 7. Bảng Inventory
CREATE TABLE inventory (
    id BIGSERIAL PRIMARY KEY,
    compartment_id BIGINT REFERENCES compartments(id) ON DELETE CASCADE,
    perfume_id BIGINT REFERENCES perfumes(id) ON DELETE CASCADE,
    refilled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    batch_number VARCHAR(100)
);

-- 8. Bảng Audit Logs
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    brand_id BIGINT REFERENCES brands(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    target_object VARCHAR(100) NOT NULL,
    target_id BIGINT,
    details TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_users_brand ON users(brand_id);
CREATE INDEX idx_perfumes_brand ON perfumes(brand_id);
CREATE INDEX idx_machines_brand ON sampling_machines(brand_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);