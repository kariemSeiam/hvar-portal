-- migrations/001_initial_schema.sql
-- Complete database schema with all tables, columns, and indexes

-- ==============================================
-- TABLES
-- ==============================================

-- Create customers table
CREATE TABLE customers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    phone_secondary VARCHAR(20),
    governorate VARCHAR(100),
    city VARCHAR(100),
    address_details TEXT,
    bosta_orders JSON COMMENT 'Array of Bosta orders, stored as-is from API',
    customer_services JSON DEFAULT ('[]') COMMENT 'Array of customer service actions/history',
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create service_tickets table
CREATE TABLE service_tickets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ticket_number VARCHAR(50) UNIQUE NOT NULL COMMENT 'System-generated identifier (e.g., HVR-20251015-0001)',
    customer_id INT NOT NULL,
    service_type VARCHAR(20) NOT NULL COMMENT 'Defines the workflow: replacement, maintenance, return',
    status VARCHAR(30) NOT NULL,
    priority VARCHAR(10) DEFAULT 'normal',
    reason TEXT,
    notes TEXT,
    cost_adjustment DECIMAL(10, 2) DEFAULT 0,
    original_tracking VARCHAR(100) COMMENT 'Original Bosta order tracking number',
    new_tracking_send VARCHAR(100) COMMENT 'Tracking for items sent TO the customer',
    new_tracking_receive VARCHAR(100) COMMENT 'Tracking for items received FROM the customer',
    created_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT
);

-- Create service_ticket_history table
CREATE TABLE service_ticket_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ticket_id INT NOT NULL,
    old_status VARCHAR(30),
    new_status VARCHAR(30),
    notes TEXT,
    created_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES service_tickets(id) ON DELETE CASCADE
);

-- Create stock_items table
CREATE TABLE stock_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL COMMENT 'Enum: product, part',
    quantity_on_hand INT DEFAULT 0 COMMENT 'Physical count of good, valid items',
    quantity_reserved INT DEFAULT 0 COMMENT 'Count of on_hand items promised to active tickets',
    quantity_damaged INT DEFAULT 0 COMMENT 'Physical count of broken or unusable items',
    active BOOLEAN DEFAULT TRUE COMMENT 'Item is active and available for use',
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create stock_movements table
CREATE TABLE stock_movements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    item_id INT NOT NULL,
    quantity INT NOT NULL,
    movement_type VARCHAR(30) NOT NULL COMMENT 'Business action that triggered the stock change',
    `condition` VARCHAR(10) DEFAULT 'valid' COMMENT 'Item condition: valid, damaged, unknown',
    reference_type VARCHAR(20) COMMENT 'The type of object the movement is related to (e.g., service_ticket)',
    reference_id INT COMMENT 'The ID of the related object',
    created_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (item_id) REFERENCES stock_items(id) ON DELETE RESTRICT
);

-- Create tracking_scans table
CREATE TABLE tracking_scans (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tracking_number VARCHAR(100) NOT NULL,
    scan_type VARCHAR(50) NOT NULL COMMENT 'The business context of the scan',
    scan_location VARCHAR(50) NOT NULL DEFAULT 'HUB' COMMENT 'Where the scan occurred',
    reference_type VARCHAR(20),
    reference_id INT,
    created_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- Create service_items link table
CREATE TABLE service_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ticket_id INT NOT NULL,
    item_id INT NOT NULL,
    quantity INT NOT NULL,
    direction VARCHAR(10) NOT NULL COMMENT 'Enum: send (to customer), receive (from customer)',
    `condition` VARCHAR(10) NOT NULL COMMENT 'Item condition: valid, damaged',
    FOREIGN KEY (ticket_id) REFERENCES service_tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES stock_items(id) ON DELETE RESTRICT
);

-- Create product_components recipe table
CREATE TABLE product_components (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    part_id INT NOT NULL,
    quantity_needed INT NOT NULL,
    FOREIGN KEY (product_id) REFERENCES stock_items(id) ON DELETE CASCADE,
    FOREIGN KEY (part_id) REFERENCES stock_items(id) ON DELETE CASCADE
) COMMENT 'Defines the recipe for assembling products from parts';

-- Create bosta_orders table
CREATE TABLE bosta_orders (
    tracking_number VARCHAR(100) PRIMARY KEY,
    order_data JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Caches raw and unified order data from the Bosta API to minimize external calls.';

-- Create ticket_sequences table
CREATE TABLE ticket_sequences (
    service_type VARCHAR(20) NOT NULL COMMENT 'Type of service (e.g., replacement, maintenance, return)',
    sequence_date DATE NOT NULL COMMENT 'Date for which the sequence number applies',
    sequence_number INT NOT NULL DEFAULT 0 COMMENT 'The current sequential number for the day and type',
    PRIMARY KEY (service_type, sequence_date)
);

-- ==============================================
-- BASIC INDEXES
-- ==============================================

-- Customer indexes
CREATE INDEX idx_customer_phone ON customers(phone);
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_customers_created_at ON customers(created_at);
CREATE INDEX idx_customers_updated_at ON customers(updated_at);

-- Service ticket indexes
CREATE INDEX idx_ticket_status ON service_tickets(status);
CREATE INDEX idx_ticket_customer ON service_tickets(customer_id);
CREATE INDEX idx_service_tickets_ticket_number ON service_tickets(ticket_number);
-- Note: This index is already created in the schema, added here for clarity
CREATE INDEX idx_service_tickets_original_tracking ON service_tickets(original_tracking);
CREATE INDEX idx_service_tickets_new_tracking_send ON service_tickets(new_tracking_send);
CREATE INDEX idx_service_tickets_new_tracking_receive ON service_tickets(new_tracking_receive);
CREATE INDEX idx_service_tickets_created_at ON service_tickets(created_at);
CREATE INDEX idx_service_tickets_updated_at ON service_tickets(updated_at);

-- Composite index for tracking number lookups (OR query optimization)
CREATE INDEX idx_service_tickets_all_tracking ON service_tickets(original_tracking, new_tracking_send, new_tracking_receive);

-- Stock item indexes
CREATE INDEX idx_stock_sku ON stock_items(sku);
CREATE INDEX idx_stock_type ON stock_items(type);
CREATE INDEX idx_stock_items_name ON stock_items(name);
CREATE INDEX idx_stock_items_quantity_on_hand ON stock_items(quantity_on_hand);
CREATE INDEX idx_stock_items_active ON stock_items(active);

-- Stock movements indexes
CREATE INDEX idx_stock_movements_created_at ON stock_movements(created_at);
CREATE INDEX idx_movements_condition ON stock_movements(`condition`);

-- Tracking scans indexes
CREATE INDEX idx_scan_tracking_number ON tracking_scans(tracking_number);
CREATE INDEX idx_tracking_scans_created_at ON tracking_scans(created_at);

-- Ticket sequences indexes
CREATE INDEX idx_ticket_sequences_date ON ticket_sequences(sequence_date);

-- ==============================================
-- COMPOSITE INDEXES FOR COMMON QUERY PATTERNS
-- ==============================================

-- Service ticket history queries (ticket_id + created_at)
CREATE INDEX idx_service_ticket_history_ticket_created 
ON service_ticket_history(ticket_id, created_at);

-- Stock movements queries (item_id + created_at)
CREATE INDEX idx_stock_movements_item_created 
ON stock_movements(item_id, created_at);

-- Tracking scans queries (tracking_number + created_at)
CREATE INDEX idx_tracking_scans_tracking_created 
ON tracking_scans(tracking_number, created_at);

-- Service tickets by customer and status
CREATE INDEX idx_service_tickets_customer_status 
ON service_tickets(customer_id, status);

-- Service tickets by type and status
CREATE INDEX idx_service_tickets_type_status 
ON service_tickets(service_type, status);

-- Stock items by type and quantity
CREATE INDEX idx_stock_items_type_quantity 
ON stock_items(type, quantity_on_hand);

-- Stock items by type and active status
CREATE INDEX idx_stock_items_type_active 
ON stock_items(type, active);

-- Tracking scans by reference and scan type
CREATE INDEX idx_tracking_scans_reference_type 
ON tracking_scans(reference_type, scan_type);

-- Status-based queries with dates
CREATE INDEX idx_service_tickets_status_created 
ON service_tickets(status, created_at);

-- ==============================================
-- FULL-TEXT SEARCH INDEXES
-- ==============================================

-- Full-text search on customer names
CREATE FULLTEXT INDEX idx_customers_name_fulltext ON customers(name);

-- Full-text search on stock item names
CREATE FULLTEXT INDEX idx_stock_items_name_fulltext ON stock_items(name);

-- Full-text search on service ticket notes
CREATE FULLTEXT INDEX idx_service_tickets_notes_fulltext ON service_tickets(notes);

-- ==============================================
-- TABLE OPTIMIZATION
-- ==============================================

-- Analyze tables to update statistics
ANALYZE TABLE customers;
ANALYZE TABLE service_tickets;
ANALYZE TABLE service_ticket_history;
ANALYZE TABLE stock_items;
ANALYZE TABLE stock_movements;
ANALYZE TABLE tracking_scans;
ANALYZE TABLE service_items;
ANALYZE TABLE product_components;
ANALYZE TABLE bosta_orders;
ANALYZE TABLE ticket_sequences;
