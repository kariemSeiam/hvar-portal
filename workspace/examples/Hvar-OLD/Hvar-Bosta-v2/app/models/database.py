"""
Production Database Models and Schema for Bosta Integration
Comprehensive order tracking with geographic hierarchy, timeline events, and analytics
"""
import logging
import sqlite3
from contextlib import contextmanager
import os
from datetime import datetime
from app.utils.db_utils import get_db, get_database_path


# Setup logging
logger = logging.getLogger(__name__)

# Production database schema
PRODUCTION_SCHEMA = """
-- Core Orders table with comprehensive data structure (Authoritative Production Schema)
CREATE TABLE IF NOT EXISTS orders (
    -- Primary identifiers
    id TEXT PRIMARY KEY,
    tracking_number TEXT UNIQUE NOT NULL,
    
    -- Order status & lifecycle
    state_code INTEGER NOT NULL,
    state_value TEXT,
    masked_state TEXT,
    is_confirmed_delivery BOOLEAN DEFAULT 0,
    allow_open_package BOOLEAN DEFAULT 0,
    
    -- Order type information
    order_type_code INTEGER,
    order_type_value TEXT,
    
    -- Financial data & wallet
    cod REAL DEFAULT 0,
    bosta_fees REAL DEFAULT 0,
    deposited_amount REAL DEFAULT 0,
    
    -- Customer information
    receiver_phone TEXT NOT NULL,
    receiver_name TEXT,
    receiver_first_name TEXT,
    receiver_last_name TEXT,
    receiver_second_phone TEXT,
    
    -- Product information & specifications
    notes TEXT,
    specs_items_count INTEGER DEFAULT 1,
    specs_description TEXT,
    product_name TEXT,
    product_count INTEGER DEFAULT 1,
    
    -- Geographic hierarchy - dropoff address (essential fields)
    dropoff_city_name TEXT,
    dropoff_city_name_ar TEXT,
    dropoff_zone_name TEXT,
    dropoff_zone_name_ar TEXT,
    dropoff_district_name TEXT,
    dropoff_district_name_ar TEXT,
    dropoff_first_line TEXT,
    
    -- Pickup location data
    pickup_city TEXT,
    pickup_zone TEXT,
    pickup_district TEXT,
    pickup_address TEXT,
    
    -- Delivery information
    delivery_lat REAL,
    delivery_lng REAL,
    star_name TEXT,
    star_phone TEXT,
    
    -- Timeline data (JSON format for dynamic events)
    timeline_json TEXT,
    
    -- Key timeline dates
    created_at TEXT NOT NULL,
    scheduled_at TEXT,
    picked_up_at TEXT,
    received_at_warehouse TEXT,
    delivered_at TEXT,
    returned_at TEXT,
    latest_awb_print_date TEXT,
    last_call_time TEXT,
    
    -- Delivery time calculation (in hours)
    delivery_time_hours REAL,
    
    -- Communication & attempts
    attempts_count INTEGER DEFAULT 0,
    calls_count INTEGER DEFAULT 0,
    
    -- SLA information
    order_sla_timestamp TEXT,
    order_sla_exceeded BOOLEAN DEFAULT 0,
    e2e_sla_timestamp TEXT,
    e2e_sla_exceeded BOOLEAN DEFAULT 0,
    
    -- System data
    last_synced TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by_system TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_processed BOOLEAN DEFAULT 0,

    -- Enhanced Classification Fields
    business_category TEXT,
    cod_category TEXT,
    risk_level TEXT
);

-- Service Actions Table for all service, maintenance, and return operations
CREATE TABLE IF NOT EXISTS service_actions (
    action_id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_phone TEXT NOT NULL,
    tracking_number TEXT,
    action_type VARCHAR(50) NOT NULL,
    action_status VARCHAR(50) DEFAULT 'requested',
    priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    service_reason TEXT,
    product_name TEXT,
    return_tracking_number TEXT,
    assigned_technician TEXT,
    service_notes TEXT,
    refund_amount DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Order Hierarchy Table for linking main orders with sub-orders
CREATE TABLE IF NOT EXISTS order_hierarchy (
    hierarchy_id INTEGER PRIMARY KEY AUTOINCREMENT,
    main_order_id TEXT NOT NULL,
    sub_order_id TEXT NOT NULL,
    relationship_type VARCHAR(50),
    linked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Hub Confirmation Workflow for mandatory hub scanning and quality control
CREATE TABLE IF NOT EXISTS hub_confirmation_workflow (
    workflow_id INTEGER PRIMARY KEY AUTOINCREMENT,
    action_id INTEGER NOT NULL,
    return_tracking_number TEXT NOT NULL,
    confirmation_status VARCHAR(50) DEFAULT 'pending',
    product_condition VARCHAR(50),
    quality_score INTEGER,
    inspection_notes TEXT,
    confirmed_at TIMESTAMP
);

-- Product Categories Table for product classification
CREATE TABLE IF NOT EXISTS product_categories (
    category_id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_name_ar TEXT NOT NULL UNIQUE,
    category_name_en TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products Table for complete product catalog management
CREATE TABLE IF NOT EXISTS products (
    product_id INTEGER PRIMARY KEY AUTOINCREMENT,
    sku TEXT UNIQUE NOT NULL,
    name_ar TEXT NOT NULL,
    name_en TEXT,
    category TEXT NOT NULL,
    brand TEXT DEFAULT 'هفار',
    model TEXT,
    serial_number TEXT,
    description TEXT,
    unit TEXT DEFAULT 'القطعة',
    selling_price DECIMAL(10,2),
    purchase_price DECIMAL(10,2),
    alert_quantity INTEGER DEFAULT 0,
    warranty_period_months INTEGER DEFAULT 12,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Product Parts Table for component-level tracking
CREATE TABLE IF NOT EXISTS product_parts (
    part_id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    part_sku TEXT UNIQUE NOT NULL,
    part_name TEXT NOT NULL,
    part_type TEXT NOT NULL,
    serial_number TEXT,
    is_replaceable BOOLEAN DEFAULT 1,
    warranty_period_months INTEGER DEFAULT 6,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

-- Stock Management Table for inventory control across locations
CREATE TABLE IF NOT EXISTS stock (
    stock_id INTEGER PRIMARY KEY AUTOINCREMENT,
    sku TEXT NOT NULL,
    location TEXT NOT NULL,
    quantity INTEGER DEFAULT 0,
    min_threshold INTEGER DEFAULT 0,
    max_threshold INTEGER DEFAULT 0,
    reserved_quantity INTEGER DEFAULT 0,
    available_quantity INTEGER DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(sku, location)
);

-- Order Line Items Table for detailed product/parts tracking per order
CREATE TABLE IF NOT EXISTS order_line_items (
    order_line_id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT NOT NULL,
    sku TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2),
    line_type VARCHAR(50) NOT NULL, -- 'main', 'part', 'replacement', 'return', 'service'
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'returned', 'replaced', 'cancelled'
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Service Action Parts Table for tracking parts used in service actions
CREATE TABLE IF NOT EXISTS service_action_parts (
    service_action_part_id INTEGER PRIMARY KEY AUTOINCREMENT,
    action_id INTEGER NOT NULL,
    sku TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    action_type VARCHAR(50) NOT NULL, -- 'used', 'replaced', 'returned', 'damaged'
    condition_before VARCHAR(50),
    condition_after VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (action_id) REFERENCES service_actions(action_id) ON DELETE CASCADE
);

-- Stock Movement History Table for complete audit trail
CREATE TABLE IF NOT EXISTS stock_movements (
    movement_id INTEGER PRIMARY KEY AUTOINCREMENT,
    sku TEXT NOT NULL,
    location_from TEXT,
    location_to TEXT,
    quantity INTEGER NOT NULL,
    movement_type VARCHAR(50) NOT NULL, -- 'order', 'return', 'service', 'transfer', 'adjustment'
    reference_id TEXT, -- order_id, action_id, etc.
    reference_type VARCHAR(50), -- 'order', 'service_action', 'manual'
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pending orders functionality has been integrated into main orders table
-- All pending orders are now managed through the unified orders system

-- Indexes for new product and service tables
CREATE INDEX IF NOT EXISTS idx_service_actions_phone ON service_actions(customer_phone);
CREATE INDEX IF NOT EXISTS idx_service_actions_tracking ON service_actions(tracking_number);
CREATE INDEX IF NOT EXISTS idx_service_actions_status ON service_actions(action_status);
CREATE INDEX IF NOT EXISTS idx_service_actions_type ON service_actions(action_type);

CREATE INDEX IF NOT EXISTS idx_order_hierarchy_main ON order_hierarchy(main_order_id);
CREATE INDEX IF NOT EXISTS idx_order_hierarchy_sub ON order_hierarchy(sub_order_id);

CREATE INDEX IF NOT EXISTS idx_hub_confirmation_action ON hub_confirmation_workflow(action_id);
CREATE INDEX IF NOT EXISTS idx_hub_confirmation_tracking ON hub_confirmation_workflow(return_tracking_number);
CREATE INDEX IF NOT EXISTS idx_hub_confirmation_status ON hub_confirmation_workflow(confirmation_status);

CREATE INDEX IF NOT EXISTS idx_product_categories_name_ar ON product_categories(category_name_ar);
CREATE INDEX IF NOT EXISTS idx_product_categories_active ON product_categories(is_active);

CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);

CREATE INDEX IF NOT EXISTS idx_product_parts_sku ON product_parts(part_sku);
CREATE INDEX IF NOT EXISTS idx_product_parts_product ON product_parts(product_id);
CREATE INDEX IF NOT EXISTS idx_product_parts_active ON product_parts(is_active);

CREATE INDEX IF NOT EXISTS idx_stock_sku ON stock(sku);
CREATE INDEX IF NOT EXISTS idx_stock_location ON stock(location);
CREATE INDEX IF NOT EXISTS idx_stock_quantity ON stock(quantity);

CREATE INDEX IF NOT EXISTS idx_order_line_order ON order_line_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_line_sku ON order_line_items(sku);
CREATE INDEX IF NOT EXISTS idx_order_line_type ON order_line_items(line_type);
CREATE INDEX IF NOT EXISTS idx_order_line_status ON order_line_items(status);

CREATE INDEX IF NOT EXISTS idx_service_parts_action ON service_action_parts(action_id);
CREATE INDEX IF NOT EXISTS idx_service_parts_sku ON service_action_parts(sku);
CREATE INDEX IF NOT EXISTS idx_service_parts_type ON service_action_parts(action_type);

CREATE INDEX IF NOT EXISTS idx_stock_movements_sku ON stock_movements(sku);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_ref ON stock_movements(reference_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements(created_at);

-- Order Analytics Table for real-time business intelligence
CREATE TABLE IF NOT EXISTS order_analytics (
    analytics_id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE NOT NULL,
    total_orders INTEGER DEFAULT 0,
    total_cod REAL DEFAULT 0,
    business_type_stats TEXT DEFAULT '{}',
    service_actions_created INTEGER DEFAULT 0,
    hierarchy_links_created INTEGER DEFAULT 0,
    products_processed INTEGER DEFAULT 0,
    parts_tracked INTEGER DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date)
);

-- Customer Management Tables
-- Core customer profiles
CREATE TABLE IF NOT EXISTS customers (
    customer_id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    full_name VARCHAR(200),
    primary_city VARCHAR(50),
    primary_zone VARCHAR(50),
    primary_district VARCHAR(50),
    primary_address TEXT,
    total_orders INTEGER DEFAULT 0,
    total_value DECIMAL(10,2) DEFAULT 0,
    avg_order_value DECIMAL(10,2) DEFAULT 0,
    first_order_date DATE,
    last_order_date DATE,
    customer_segment VARCHAR(20) DEFAULT 'new',
    return_rate DECIMAL(5,2) DEFAULT 0,
    satisfaction_score DECIMAL(3,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customer addresses (multiple addresses per customer)
CREATE TABLE IF NOT EXISTS customer_addresses (
    address_id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER,
    city VARCHAR(50),
    zone VARCHAR(50),
    district VARCHAR(50),
    address_line TEXT,
    is_primary BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

-- Customer segments and classification rules
CREATE TABLE IF NOT EXISTS customer_segments (
    segment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    segment_name VARCHAR(50) UNIQUE,
    min_orders INTEGER DEFAULT 0,
    min_value DECIMAL(10,2) DEFAULT 0,
    max_return_rate DECIMAL(5,2) DEFAULT 100,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customer interactions tracking
CREATE TABLE IF NOT EXISTS customer_interactions (
    interaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER,
    interaction_type VARCHAR(50),
    channel VARCHAR(50),
    subject VARCHAR(200),
    description TEXT,
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(20) DEFAULT 'pending',
    assigned_agent VARCHAR(100),
    customer_satisfaction VARCHAR(20),
    resolution_time_hours INTEGER,
    follow_up_date DATE,
    follow_up_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

-- Customer service queue
CREATE TABLE IF NOT EXISTS customer_service_queue (
    queue_id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER,
    interaction_id INTEGER,
    priority_score INTEGER DEFAULT 0,
    queue_position INTEGER,
    issue_type VARCHAR(50),
    customer_segment VARCHAR(20),
    estimated_wait_time INTEGER,
    assigned_agent VARCHAR(100),
    status VARCHAR(20) DEFAULT 'waiting',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_at TIMESTAMP,
    resolved_at TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
    FOREIGN KEY (interaction_id) REFERENCES customer_interactions(interaction_id)
);

-- Customer analytics and metrics
CREATE TABLE IF NOT EXISTS customer_analytics (
    analytics_id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER,
    lifetime_value DECIMAL(10,2),
    avg_order_value DECIMAL(10,2),
    order_frequency DECIMAL(5,2),
    return_rate DECIMAL(5,2),
    satisfaction_score DECIMAL(3,2),
    churn_risk_score DECIMAL(3,2),
    next_purchase_prediction DATE,
    customer_health_score DECIMAL(3,2),
    segment_recommendation VARCHAR(50),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

-- Customer Service Tables
-- Service Tickets (Core)
CREATE TABLE IF NOT EXISTS service_tickets (
    ticket_id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_phone VARCHAR(20) NOT NULL,
    order_id TEXT,
    tracking_number TEXT,
    ticket_type VARCHAR(30) NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(30) DEFAULT 'open',
    subject VARCHAR(200) NOT NULL,
    description TEXT,
    product_name TEXT,
    product_sku TEXT,
    assigned_agent VARCHAR(100),
    customer_satisfaction INTEGER,
    resolution_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- Team Calls table removed - functionality integrated into follow-ups system

-- Replacements (Full/Partial)
CREATE TABLE IF NOT EXISTS replacements (
    replacement_id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER,
    customer_phone VARCHAR(20),
    order_id TEXT,
    replacement_type VARCHAR(50),
    original_product_sku TEXT,
    replacement_product_sku TEXT,
    replacement_reason TEXT,
    replacement_status VARCHAR(30) DEFAULT 'requested',
    replacement_value DECIMAL(10,2),
    customer_contribution DECIMAL(10,2) DEFAULT 0,
    warranty_applies BOOLEAN DEFAULT 0,
    delivery_address TEXT,
    delivery_contact VARCHAR(100),
    delivery_phone VARCHAR(20),
    estimated_delivery_date DATE,
    actual_delivery_date DATE,
    customer_approval BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES service_tickets(ticket_id),
    FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- Hub Confirmations (Return Verification)
CREATE TABLE IF NOT EXISTS hub_confirmations (
    confirmation_id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER,
    order_id TEXT,
    tracking_number TEXT,
    hub_name VARCHAR(100),
    hub_agent VARCHAR(100),
    confirmation_type VARCHAR(50),
    confirmation_status VARCHAR(30) DEFAULT 'pending',
    confirmation_date DATE,
    inspection_notes TEXT,
    quality_score INTEGER,
    defects_found TEXT,
    recommended_action VARCHAR(100),
    team_leader_review_required BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES service_tickets(ticket_id),
    FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- Team Leader Actions (Final Verification)
CREATE TABLE IF NOT EXISTS team_leader_actions (
    action_id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER,
    hub_confirmation_id INTEGER,
    team_leader_name VARCHAR(100),
    action_type VARCHAR(50),
    action_status VARCHAR(30) DEFAULT 'pending',
    action_date DATE,
    verification_notes TEXT,
    quality_standards_met BOOLEAN DEFAULT 0,
    customer_satisfaction_confirmed BOOLEAN DEFAULT 0,
    final_resolution TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES service_tickets(ticket_id),
    FOREIGN KEY (hub_confirmation_id) REFERENCES hub_confirmations(confirmation_id)
);

-- Maintenance Management Tables
-- Maintenance Cycles Table (Primary)
CREATE TABLE IF NOT EXISTS maintenance_cycles (
    cycle_id INTEGER PRIMARY KEY AUTOINCREMENT,
    action_id INTEGER NOT NULL,
    customer_phone TEXT NOT NULL,
    order_id TEXT,
    tracking_number TEXT,
    cycle_type TEXT NOT NULL,
    maintenance_category TEXT,
    priority TEXT DEFAULT 'medium',
    scheduled_date DATE,
    estimated_duration_hours INTEGER DEFAULT 2,
    sla_response_deadline DATETIME,
    sla_resolution_deadline DATETIME,
    sla_escalation_deadline DATETIME,
    cycle_status TEXT DEFAULT 'scheduled',
    progress_percentage INTEGER DEFAULT 0,
    assigned_technician_id TEXT,
    technician_team TEXT,
    service_location TEXT,
    parts_required_json TEXT,
    parts_allocated_json TEXT,
    parts_used_json TEXT,
    total_parts_cost DECIMAL(10,2) DEFAULT 0,
    problem_description TEXT,
    solution_description TEXT,
    repair_notes TEXT,
    quality_check_notes TEXT,
    labor_cost DECIMAL(10,2) DEFAULT 0,
    total_cost DECIMAL(10,2) DEFAULT 0,
    warranty_coverage BOOLEAN DEFAULT 0,
    customer_contribution DECIMAL(10,2) DEFAULT 0,
    quality_check_passed BOOLEAN DEFAULT 0,
    quality_score INTEGER,
    customer_satisfaction INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (action_id) REFERENCES service_actions(action_id) ON DELETE CASCADE
);

-- Technician Resources Table
CREATE TABLE IF NOT EXISTS technician_resources (
    technician_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    skills_json TEXT,
    certification_level TEXT DEFAULT 'junior',
    max_concurrent_jobs INTEGER DEFAULT 3,
    current_workload INTEGER DEFAULT 0,
    location TEXT,
    status TEXT DEFAULT 'available',
    shift_start TIME,
    shift_end TIME,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Parts Allocation Tracking
CREATE TABLE IF NOT EXISTS maintenance_parts_allocation (
    allocation_id INTEGER PRIMARY KEY AUTOINCREMENT,
    cycle_id INTEGER NOT NULL,
    sku TEXT NOT NULL,
    quantity_required INTEGER NOT NULL,
    quantity_allocated INTEGER DEFAULT 0,
    quantity_used INTEGER DEFAULT 0,
    quantity_returned INTEGER DEFAULT 0,
    condition_before TEXT,
    condition_after TEXT,
    replacement_reason TEXT,
    unit_cost DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    allocation_status TEXT DEFAULT 'pending',
    allocated_at TIMESTAMP,
    used_at TIMESTAMP,
    returned_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cycle_id) REFERENCES maintenance_cycles(cycle_id) ON DELETE CASCADE
);

-- SLA Monitoring Table
CREATE TABLE IF NOT EXISTS maintenance_sla_tracking (
    sla_id INTEGER PRIMARY KEY AUTOINCREMENT,
    cycle_id INTEGER NOT NULL,
    sla_type TEXT NOT NULL,
    target_deadline DATETIME NOT NULL,
    actual_completion DATETIME,
    is_met BOOLEAN,
    violation_minutes INTEGER DEFAULT 0,
    escalation_level INTEGER DEFAULT 0,
    escalated_to TEXT,
    escalated_at TIMESTAMP,
    escalation_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cycle_id) REFERENCES maintenance_cycles(cycle_id) ON DELETE CASCADE
);

-- Quality Control Inspections
CREATE TABLE IF NOT EXISTS maintenance_quality_inspections (
    inspection_id INTEGER PRIMARY KEY AUTOINCREMENT,
    cycle_id INTEGER NOT NULL,
    inspector_id TEXT,
    inspection_type TEXT,
    quality_score INTEGER,
    visual_inspection_passed BOOLEAN DEFAULT 0,
    functional_test_passed BOOLEAN DEFAULT 0,
    safety_check_passed BOOLEAN DEFAULT 0,
    inspection_notes TEXT,
    defects_found_json TEXT,
    corrective_actions_json TEXT,
    photos_json TEXT,
    inspection_report_url TEXT,
    inspection_status TEXT DEFAULT 'pending',
    requires_rework BOOLEAN DEFAULT 0,
    approved_for_delivery BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    FOREIGN KEY (cycle_id) REFERENCES maintenance_cycles(cycle_id) ON DELETE CASCADE
);

-- SLA Configuration Table
CREATE TABLE IF NOT EXISTS sla_configuration (
    config_id INTEGER PRIMARY KEY AUTOINCREMENT,
    maintenance_type TEXT NOT NULL,
    priority TEXT NOT NULL,
    response_time_hours INTEGER NOT NULL,
    resolution_time_hours INTEGER NOT NULL,
    escalation_time_hours INTEGER NOT NULL,
    warning_threshold_hours INTEGER DEFAULT 2,
    auto_escalate BOOLEAN DEFAULT 1,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(maintenance_type, priority)
);

-- Escalation Rules Table
CREATE TABLE IF NOT EXISTS escalation_rules (
    rule_id INTEGER PRIMARY KEY AUTOINCREMENT,
    violation_hours INTEGER NOT NULL,
    escalation_level INTEGER NOT NULL,
    escalation_role TEXT NOT NULL,
    auto_assign BOOLEAN DEFAULT 0,
    rule_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(violation_hours, escalation_level, escalation_role)
);

-- SLA Performance Analytics
CREATE TABLE IF NOT EXISTS sla_performance_analytics (
    analytics_id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE NOT NULL,
    maintenance_type TEXT,
    priority TEXT,
    total_slas INTEGER DEFAULT 0,
    slas_met INTEGER DEFAULT 0,
    slas_violated INTEGER DEFAULT 0,
    avg_response_time_hours REAL,
    avg_resolution_time_hours REAL,
    avg_violation_hours REAL,
    escalations_triggered INTEGER DEFAULT 0,
    customer_satisfaction_impact REAL,
    compliance_percentage REAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date, maintenance_type, priority)
);

-- Escalation Actions Log
CREATE TABLE IF NOT EXISTS escalation_actions (
    action_id INTEGER PRIMARY KEY AUTOINCREMENT,
    cycle_id INTEGER NOT NULL,
    sla_id INTEGER NOT NULL,
    escalation_level INTEGER NOT NULL,
    escalated_from TEXT,
    escalated_to TEXT,
    escalation_reason TEXT,
    escalation_type TEXT,
    action_taken TEXT,
    resolution_provided BOOLEAN DEFAULT 0,
    escalated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    FOREIGN KEY (cycle_id) REFERENCES maintenance_cycles(cycle_id) ON DELETE CASCADE,
    FOREIGN KEY (sla_id) REFERENCES maintenance_sla_tracking(sla_id) ON DELETE CASCADE
);

-- Maintenance stock reservations tracking
CREATE TABLE IF NOT EXISTS maintenance_stock_reservations (
    reservation_id INTEGER PRIMARY KEY AUTOINCREMENT,
    cycle_id INTEGER NOT NULL,
    sku TEXT NOT NULL,
    quantity_reserved INTEGER NOT NULL,
    location TEXT NOT NULL,
    reservation_status TEXT DEFAULT 'active',
    reserved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    used_at TIMESTAMP,
    released_at TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (cycle_id) REFERENCES maintenance_cycles(cycle_id) ON DELETE CASCADE
);

-- Stock condition tracking for returns
CREATE TABLE IF NOT EXISTS stock_condition_tracking (
    condition_id INTEGER PRIMARY KEY AUTOINCREMENT,
    sku TEXT NOT NULL,
    stock_id INTEGER,
    condition_status TEXT NOT NULL,
    quality_score INTEGER,
    inspection_date TIMESTAMP,
    inspector_id TEXT,
    inspection_notes TEXT,
    photos_json TEXT,
    disposition TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stock location capacity tracking
CREATE TABLE IF NOT EXISTS stock_location_capacity (
    location_id INTEGER PRIMARY KEY AUTOINCREMENT,
    location_name TEXT UNIQUE NOT NULL,
    location_type TEXT,
    max_capacity INTEGER DEFAULT 1000,
    current_utilization INTEGER DEFAULT 0,
    reserved_capacity INTEGER DEFAULT 0,
    available_capacity INTEGER DEFAULT 1000,
    location_address TEXT,
    manager_id TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Predictive stock requirements
CREATE TABLE IF NOT EXISTS maintenance_stock_forecasting (
    forecast_id INTEGER PRIMARY KEY AUTOINCREMENT,
    sku TEXT NOT NULL,
    forecast_period TEXT,
    predicted_usage INTEGER,
    confidence_level FLOAT,
    historical_data_points INTEGER,
    trend_direction TEXT,
    seasonal_factor FLOAT DEFAULT 1.0,
    emergency_buffer INTEGER DEFAULT 0,
    recommended_stock_level INTEGER,
    forecast_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_analytics_date ON order_analytics(date);
CREATE INDEX IF NOT EXISTS idx_analytics_updated ON order_analytics(last_updated);

-- Pending orders indexes removed - functionality integrated into main orders table

-- Customer Management Indexes
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_segment ON customers(customer_segment);
CREATE INDEX IF NOT EXISTS idx_customers_city ON customers(primary_city);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer ON customer_addresses(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_interactions_customer ON customer_interactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_interactions_status ON customer_interactions(status);
CREATE INDEX IF NOT EXISTS idx_customer_service_queue_status ON customer_service_queue(status);
CREATE INDEX IF NOT EXISTS idx_customer_analytics_customer ON customer_analytics(customer_id);

-- Customer Service Indexes
CREATE INDEX IF NOT EXISTS idx_service_tickets_phone ON service_tickets(customer_phone);
CREATE INDEX IF NOT EXISTS idx_service_tickets_status ON service_tickets(status);
CREATE INDEX IF NOT EXISTS idx_service_tickets_type ON service_tickets(ticket_type);
-- Team calls indexes removed - functionality integrated into follow-ups system
CREATE INDEX IF NOT EXISTS idx_replacements_ticket ON replacements(ticket_id);
CREATE INDEX IF NOT EXISTS idx_hub_confirmations_ticket ON hub_confirmations(ticket_id);
CREATE INDEX IF NOT EXISTS idx_team_leader_actions_ticket ON team_leader_actions(ticket_id);

-- Maintenance Management Indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_cycles_action ON maintenance_cycles(action_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_cycles_phone ON maintenance_cycles(customer_phone);
CREATE INDEX IF NOT EXISTS idx_maintenance_cycles_status ON maintenance_cycles(cycle_status);
CREATE INDEX IF NOT EXISTS idx_maintenance_cycles_technician ON maintenance_cycles(assigned_technician_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_cycles_scheduled ON maintenance_cycles(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_cycles_sla ON maintenance_cycles(sla_resolution_deadline);

CREATE INDEX IF NOT EXISTS idx_technician_status ON technician_resources(status);
CREATE INDEX IF NOT EXISTS idx_technician_workload ON technician_resources(current_workload);
CREATE INDEX IF NOT EXISTS idx_technician_location ON technician_resources(location);

CREATE INDEX IF NOT EXISTS idx_parts_allocation_cycle ON maintenance_parts_allocation(cycle_id);
CREATE INDEX IF NOT EXISTS idx_parts_allocation_sku ON maintenance_parts_allocation(sku);
CREATE INDEX IF NOT EXISTS idx_parts_allocation_status ON maintenance_parts_allocation(allocation_status);

CREATE INDEX IF NOT EXISTS idx_sla_tracking_cycle ON maintenance_sla_tracking(cycle_id);
CREATE INDEX IF NOT EXISTS idx_sla_tracking_deadline ON maintenance_sla_tracking(target_deadline);
CREATE INDEX IF NOT EXISTS idx_sla_tracking_violation ON maintenance_sla_tracking(is_met);

CREATE INDEX IF NOT EXISTS idx_quality_inspection_cycle ON maintenance_quality_inspections(cycle_id);
CREATE INDEX IF NOT EXISTS idx_quality_inspection_status ON maintenance_quality_inspections(inspection_status);

-- SLA Configuration Indexes
CREATE INDEX IF NOT EXISTS idx_sla_config_type_priority ON sla_configuration(maintenance_type, priority);
CREATE INDEX IF NOT EXISTS idx_escalation_rules_hours ON escalation_rules(violation_hours);
CREATE INDEX IF NOT EXISTS idx_sla_performance_date ON sla_performance_analytics(date);
CREATE INDEX IF NOT EXISTS idx_escalation_actions_cycle ON escalation_actions(cycle_id);
CREATE INDEX IF NOT EXISTS idx_escalation_actions_level ON escalation_actions(escalation_level);

-- Stock Management Indexes
CREATE INDEX IF NOT EXISTS idx_stock_reservations_cycle ON maintenance_stock_reservations(cycle_id);
CREATE INDEX IF NOT EXISTS idx_stock_reservations_sku ON maintenance_stock_reservations(sku);
CREATE INDEX IF NOT EXISTS idx_stock_reservations_status ON maintenance_stock_reservations(reservation_status);

CREATE INDEX IF NOT EXISTS idx_condition_tracking_sku ON stock_condition_tracking(sku);
CREATE INDEX IF NOT EXISTS idx_condition_tracking_status ON stock_condition_tracking(condition_status);
CREATE INDEX IF NOT EXISTS idx_condition_tracking_date ON stock_condition_tracking(inspection_date);

CREATE INDEX IF NOT EXISTS idx_location_capacity_name ON stock_location_capacity(location_name);
CREATE INDEX IF NOT EXISTS idx_location_capacity_type ON stock_location_capacity(location_type);

CREATE INDEX IF NOT EXISTS idx_stock_forecasting_sku ON maintenance_stock_forecasting(sku);
CREATE INDEX IF NOT EXISTS idx_stock_forecasting_date ON maintenance_stock_forecasting(forecast_date);
"""

def migrate_orders_table():
    """
    Migrate existing orders table to add missing columns
    """
    try:
        with get_db() as conn:
            # Check if is_processed column exists
            cursor = conn.execute("PRAGMA table_info(orders)")
            columns = [col[1] for col in cursor.fetchall()]
            
            # Add missing columns if they don't exist
            if 'is_processed' not in columns:
                conn.execute("ALTER TABLE orders ADD COLUMN is_processed BOOLEAN DEFAULT 0")
                logger.info("✅ Added is_processed column to orders table")
            
            conn.commit()
            return True
            
    except Exception as e:
        logger.error(f"❌ Migration failed: {e}")
        return False

def migrate_escalation_rules_table():
    """
    Migrate escalation_rules table to add unique constraint and clean duplicates
    """
    try:
        with get_db() as conn:
            # Check if unique constraint exists
            cursor = conn.execute("PRAGMA index_list(escalation_rules)")
            indexes = [row[1] for row in cursor.fetchall()]
            
            # Check if our unique constraint exists
            unique_constraint_exists = False
            for index in indexes:
                cursor = conn.execute(f"PRAGMA index_info({index})")
                index_columns = [row[2] for row in cursor.fetchall()]
                if len(index_columns) == 3 and 'violation_hours' in index_columns and 'escalation_level' in index_columns and 'escalation_role' in index_columns:
                    unique_constraint_exists = True
                    break
            
            if not unique_constraint_exists:
                # Create unique constraint
                conn.execute("""
                    CREATE UNIQUE INDEX idx_escalation_rules_unique 
                    ON escalation_rules(violation_hours, escalation_level, escalation_role)
                """)
                logger.info("✅ Added unique constraint to escalation_rules table")
            
            conn.commit()
            return True
            
    except Exception as e:
        logger.error(f"❌ Escalation rules migration failed: {e}")
        return False

def init_default_customer_segments(conn):
    """Initialize default customer segments"""
    default_segments = [
        ('new', 1, 0, 100, 'New customers with 1-2 orders'),
        ('regular', 3, 0, 30, 'Regular customers with 3-10 orders'),
        ('vip', 10, 5000, 20, 'VIP customers with high value or many orders'),
        ('problematic', 0, 0, 100, 'Customers with high return rates or complaints')
    ]
    
    try:
        cursor = conn.execute("SELECT segment_name FROM customer_segments")
        existing_segments = {row[0] for row in cursor.fetchall()}
        
        segments_to_insert = [
            segment for segment in default_segments 
            if segment[0] not in existing_segments
        ]
        
        if segments_to_insert:
            conn.executemany("""
                INSERT INTO customer_segments 
                (segment_name, min_orders, min_value, max_return_rate, description)
                VALUES (?, ?, ?, ?, ?)
            """, segments_to_insert)
            logger.info(f"✅ Inserted {len(segments_to_insert)} new customer segments")
        else:
            logger.info("✅ All default customer segments already exist")
            
    except Exception as e:
        logger.error(f"❌ Failed to insert default segments: {e}")

def init_default_sla_configurations(conn):
    """Initialize default SLA configurations"""
    default_configs = [
        ('preventive', 'low', 48, 168, 96, 24),
        ('preventive', 'medium', 24, 72, 48, 12),
        ('preventive', 'high', 12, 48, 24, 6),
        ('corrective', 'low', 12, 48, 24, 6),
        ('corrective', 'medium', 4, 24, 12, 2),
        ('corrective', 'high', 2, 12, 6, 1),
        ('corrective', 'urgent', 1, 4, 2, 1),
        ('warranty', 'low', 24, 72, 48, 12),
        ('warranty', 'medium', 8, 48, 24, 4),
        ('warranty', 'high', 4, 24, 12, 2),
        ('emergency', 'high', 1, 4, 2, 1),
        ('emergency', 'urgent', 0.5, 2, 1, 0.5),
        ('emergency', 'critical', 0.25, 1, 0.5, 0.25)
    ]
    
    try:
        for config in default_configs:
            maintenance_type, priority, response_hours, resolution_hours, escalation_hours, warning_hours = config
            
            conn.execute("""
                INSERT OR IGNORE INTO sla_configuration (
                    maintenance_type, priority, response_time_hours, resolution_time_hours,
                    escalation_time_hours, warning_threshold_hours
                ) VALUES (?, ?, ?, ?, ?, ?)
            """, (maintenance_type, priority, response_hours, resolution_hours, 
                  escalation_hours, warning_hours))
        
        logger.info("✅ Default SLA configurations initialized")
        
    except Exception as e:
        logger.error(f"❌ Failed to insert default SLA configurations: {e}")



def init_default_escalation_rules(conn):
    """Initialize default escalation rules"""
    default_rules = [
        (1, 1, 'supervisor', 0, 1),
        (4, 2, 'manager', 0, 2),
        (8, 3, 'director', 1, 3),
        (24, 4, 'executive', 1, 4)
    ]
    
    try:
        inserted_count = 0
        for rule in default_rules:
            violation_hours, level, role, auto_assign, order = rule
            
            # Use INSERT OR REPLACE to handle existing records
            cursor = conn.execute("""
                INSERT OR REPLACE INTO escalation_rules (
                    violation_hours, escalation_level, escalation_role,
                    auto_assign, rule_order
                ) VALUES (?, ?, ?, ?, ?)
            """, (violation_hours, level, role, auto_assign, order))
            
            if cursor.rowcount > 0:
                inserted_count += 1
        
        logger.info(f"✅ Default escalation rules initialized: {inserted_count} rules processed")
        
    except Exception as e:
        logger.error(f"❌ Failed to insert default escalation rules: {e}")

def init_production_db():
    """
    Initialize the production database with comprehensive schema
    Creates all tables and indexes if they don't exist
    """
    try:
        with get_db() as conn:
            # Execute the complete schema
            conn.executescript(PRODUCTION_SCHEMA)
            conn.commit()
            
            # Run migrations for existing tables
            migrate_orders_table()
            migrate_escalation_rules_table()
            
            # Initialize default data
            init_default_customer_segments(conn)
            init_default_sla_configurations(conn)
            init_default_escalation_rules(conn)
            
            # Get table information
            cursor = conn.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = [row[0] for row in cursor.fetchall()]
            
            logger.info(f"✅ Production database initialized successfully")
            logger.info(f"📊 Tables created: {', '.join(tables)}")
            
            # Get orders count
            cursor = conn.execute("SELECT COUNT(*) FROM orders")
            orders_count = cursor.fetchone()[0]
            logger.info(f"📦 Orders in database: {orders_count}")

        return {
            'success': True,
            'tables': tables,
            'orders_count': orders_count
        }
        
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")
        return {
            'success': False,
            'error': str(e)
        }

def get_db_status():
    """
    Get comprehensive database status and statistics
    """
    try:
        with get_db() as conn:
            # Get table information
            cursor = conn.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = [row[0] for row in cursor.fetchall()]
            
            # Get orders statistics
            cursor = conn.execute("SELECT COUNT(*) FROM orders")
            total_orders = cursor.fetchone()[0]
            
            cursor = conn.execute("SELECT COUNT(*) FROM orders WHERE state_value = 'Delivered'")
            delivered_orders = cursor.fetchone()[0]
            
            cursor = conn.execute("SELECT COUNT(*) FROM orders WHERE state_value LIKE '%Return%' OR state_code = 46")
            returned_orders = cursor.fetchone()[0]
            
            cursor = conn.execute("SELECT COUNT(*) FROM orders WHERE state_value = 'Terminated'")
            failed_orders = cursor.fetchone()[0]
            
            # Timeline data is now stored in orders.timeline_json field
            timeline_events = 0
            
            # Get customers count (handle missing table gracefully)
            try:
                cursor = conn.execute("SELECT COUNT(*) FROM customers")
                customers_count = cursor.fetchone()[0]
            except sqlite3.OperationalError:
                customers_count = 0
            
            # Get products count (handle missing table gracefully)
            try:
                cursor = conn.execute("SELECT COUNT(*) FROM products")
                products_count = cursor.fetchone()[0]
            except sqlite3.OperationalError:
                products_count = 0
            
            # Get locations count (handle missing table gracefully)
            try:
                cursor = conn.execute("SELECT COUNT(*) FROM locations")
                locations_count = cursor.fetchone()[0]
            except sqlite3.OperationalError:
                locations_count = 0
            
            # Get database file size
            db_path = get_database_path()
            file_size = os.path.getsize(db_path) if os.path.exists(db_path) else 0
            file_size_mb = file_size / (1024 * 1024)
            
            return {
                'success': True,
                'tables': tables,
                'total_orders': total_orders,
                'delivered_orders': delivered_orders,
                'returned_orders': returned_orders,
                'failed_orders': failed_orders,
                'timeline_events': 0,  # Timeline data now in orders.timeline_json
                'customers_count': customers_count,
                'products_count': products_count,
                'locations_count': locations_count,
                'file_size_mb': round(file_size_mb, 2),
                'database_path': db_path
            }
            
    except Exception as e:
        logger.error(f"❌ Database status check failed: {e}")
        return {
            'success': False,
            'error': str(e)
        }

def optimize_database():
    """Delegate optimization to centralized utils to avoid duplication."""
    try:
        from app.utils.db_utils import optimize_database as _optimize
        return _optimize()
    except Exception as e:
        logger.error(f"❌ Database optimization failed: {e}")
        return {'success': False, 'error': str(e)}

def backup_database(backup_path=None):
    """Delegate backup to centralized utils to avoid duplication."""
    try:
        from app.utils.db_utils import backup_database as _backup
        return _backup(backup_path)
    except Exception as e:
        logger.error(f"❌ Database backup failed: {e}")
        return {'success': False, 'error': str(e)}

 

def analyze_order_text_analytics():
    """
    Comprehensive analytics for order notes, product descriptions, and names
    Identifies duplicated words, patterns, and text insights
    """
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            
            # Get all text fields from orders
            cursor.execute("""
                SELECT 
                    notes, specs_description, product_name,
                    COUNT(*) as frequency
                FROM orders 
                WHERE (notes IS NOT NULL AND notes != '') 
                   OR (specs_description IS NOT NULL AND specs_description != '')
                   OR (product_name IS NOT NULL AND product_name != '')
                GROUP BY notes, specs_description, product_name
                ORDER BY frequency DESC
            """)
            
            text_combinations = cursor.fetchall()
            
            # Analyze individual words
            word_analysis = analyze_words_in_orders(cursor)
            
            # Analyze patterns
            pattern_analysis = analyze_text_patterns(cursor)
            
            # Analyze product categories
            category_analysis = analyze_product_categories(cursor)
            
            # Analyze common phrases
            phrase_analysis = analyze_common_phrases(cursor)
            
            # Analyze text length distribution
            length_analysis = analyze_text_lengths(cursor)
            
            return {
                'success': True,
                'analytics': {
                    'text_combinations': text_combinations,
                    'word_analysis': word_analysis,
                    'pattern_analysis': pattern_analysis,
                    'category_analysis': category_analysis,
                    'phrase_analysis': phrase_analysis,
                    'length_analysis': length_analysis
                }
            }
            
    except Exception as e:
        logger.error(f"❌ Text analytics failed: {e}")
        return {
            'success': False,
            'error': str(e)
        }

def analyze_words_in_orders(cursor):
    """Analyze individual words in order text fields"""
    try:
        # Get all text content
        cursor.execute("""
            SELECT 
                COALESCE(notes, '') as notes,
                COALESCE(specs_description, '') as specs_description,
                COALESCE(product_name, '') as product_name
            FROM orders 
            WHERE (notes IS NOT NULL AND notes != '') 
               OR (specs_description IS NOT NULL AND specs_description != '')
               OR (product_name IS NOT NULL AND product_name != '')
        """)
        
        rows = cursor.fetchall()
        
        # Process words
        word_frequency = {}
        word_by_field = {
            'notes': {},
            'specs_description': {},
            'product_name': {}
        }
        
        for row in rows:
            notes, specs_desc, product_name = row
            
            # Process each field
            if notes:
                words = extract_arabic_words(notes)
                for word in words:
                    word_frequency[word] = word_frequency.get(word, 0) + 1
                    word_by_field['notes'][word] = word_by_field['notes'].get(word, 0) + 1
            
            if specs_desc:
                words = extract_arabic_words(specs_desc)
                for word in words:
                    word_frequency[word] = word_frequency.get(word, 0) + 1
                    word_by_field['specs_description'][word] = word_by_field['specs_description'].get(word, 0) + 1
            
            if product_name:
                words = extract_arabic_words(product_name)
                for word in words:
                    word_frequency[word] = word_frequency.get(word, 0) + 1
                    word_by_field['product_name'][word] = word_by_field['product_name'].get(word, 0) + 1
        
        # Sort by frequency
        sorted_words = sorted(word_frequency.items(), key=lambda x: x[1], reverse=True)
        
        return {
            'total_unique_words': len(word_frequency),
            'most_common_words': sorted_words[:50],
            'word_frequency_by_field': word_by_field,
            'words_with_frequency_10_plus': [word for word, freq in sorted_words if freq >= 10],
            'words_with_frequency_50_plus': [word for word, freq in sorted_words if freq >= 50]
        }
        
    except Exception as e:
        logger.error(f"Error analyzing words: {e}")
        return {}

def analyze_text_patterns(cursor):
    """Analyze text patterns and structures"""
    try:
        # Get text patterns
        cursor.execute("""
            SELECT 
                notes, specs_description, product_name,
                COUNT(*) as frequency
            FROM orders 
            WHERE (notes IS NOT NULL AND notes != '') 
               OR (specs_description IS NOT NULL AND specs_description != '')
               OR (product_name IS NOT NULL AND product_name != '')
            GROUP BY notes, specs_description, product_name
            HAVING COUNT(*) > 1
            ORDER BY frequency DESC
            LIMIT 100
        """)
        
        duplicate_patterns = cursor.fetchall()
        
        # Analyze common prefixes and suffixes
        cursor.execute("""
            SELECT 
                product_name,
                COUNT(*) as frequency
            FROM orders 
            WHERE product_name IS NOT NULL AND product_name != ''
            GROUP BY product_name
            HAVING COUNT(*) > 1
            ORDER BY frequency DESC
            LIMIT 50
        """)
        
        duplicate_product_names = cursor.fetchall()
        
        # Analyze specs patterns
        cursor.execute("""
            SELECT 
                specs_description,
                COUNT(*) as frequency
            FROM orders 
            WHERE specs_description IS NOT NULL AND specs_description != ''
            GROUP BY specs_description
            HAVING COUNT(*) > 1
            ORDER BY frequency DESC
            LIMIT 50
        """)
        
        duplicate_specs = cursor.fetchall()
        
        return {
            'duplicate_patterns': duplicate_patterns,
            'duplicate_product_names': duplicate_product_names,
            'duplicate_specs': duplicate_specs,
            'total_duplicate_patterns': len(duplicate_patterns),
            'total_duplicate_products': len(duplicate_product_names),
            'total_duplicate_specs': len(duplicate_specs)
        }
        
    except Exception as e:
        logger.error(f"Error analyzing patterns: {e}")
        return {}

def analyze_product_categories(cursor):
    """Analyze product categories and classifications"""
    try:
        # Analyze by common product types
        cursor.execute("""
            SELECT 
                CASE 
                    WHEN product_name LIKE '%كبه%' OR product_name LIKE '%خلاط%' THEN 'كبه/خلاط'
                    WHEN product_name LIKE '%فرن%' THEN 'فرن'
                    WHEN product_name LIKE '%قلاية%' THEN 'قلاية'
                    WHEN product_name LIKE '%مكواه%' THEN 'مكواه'
                    WHEN product_name LIKE '%مكنسة%' THEN 'مكنسة'
                    WHEN product_name LIKE '%عجان%' THEN 'عجان'
                    WHEN product_name LIKE '%مطحنه%' THEN 'مطحنه'
                    WHEN product_name LIKE '%هاند%' THEN 'هاند بلندر'
                    WHEN product_name LIKE '%قطع%' OR product_name LIKE '%غيار%' THEN 'قطع غيار'
                    WHEN product_name LIKE '%هفار%' THEN 'هفار'
                    ELSE 'أخرى'
                END as product_category,
                COUNT(*) as frequency,
                AVG(cod) as avg_price,
                SUM(cod) as total_value
            FROM orders 
            WHERE product_name IS NOT NULL AND product_name != ''
            GROUP BY product_category
            ORDER BY frequency DESC
        """)
        
        categories = cursor.fetchall()
        
        # Analyze by wattage patterns
        cursor.execute("""
            SELECT 
                CASE 
                    WHEN product_name LIKE '%1200%' THEN '1200 وات'
                    WHEN product_name LIKE '%1000%' THEN '1000 وات'
                    WHEN product_name LIKE '%800%' THEN '800 وات'
                    WHEN product_name LIKE '%600%' THEN '600 وات'
                    WHEN product_name LIKE '%وات%' THEN 'واط أخرى'
                    ELSE 'بدون واط'
                END as wattage_category,
                COUNT(*) as frequency,
                AVG(cod) as avg_price
            FROM orders 
            WHERE product_name IS NOT NULL AND product_name != ''
            GROUP BY wattage_category
            ORDER BY frequency DESC
        """)
        
        wattage_categories = cursor.fetchall()
        
        return {
            'product_categories': categories,
            'wattage_categories': wattage_categories,
            'total_categories': len(categories),
            'total_wattage_categories': len(wattage_categories)
        }
        
    except Exception as e:
        logger.error(f"Error analyzing categories: {e}")
        return {}

def analyze_common_phrases(cursor):
    """Analyze common phrases and combinations"""
    try:
        # Get all text content for phrase analysis
        cursor.execute("""
            SELECT 
                COALESCE(notes, '') as notes,
                COALESCE(specs_description, '') as specs_description,
                COALESCE(product_name, '') as product_name
            FROM orders 
            WHERE (notes IS NOT NULL AND notes != '') 
               OR (specs_description IS NOT NULL AND specs_description != '')
               OR (product_name IS NOT NULL AND product_name != '')
        """)
        
        rows = cursor.fetchall()
        
        # Extract common phrases (2-3 word combinations)
        phrase_frequency = {}
        
        for row in rows:
            notes, specs_desc, product_name = row
            
            # Extract phrases from each field
            for text in [notes, specs_desc, product_name]:
                if text:
                    phrases = extract_arabic_phrases(text)
                    for phrase in phrases:
                        phrase_frequency[phrase] = phrase_frequency.get(phrase, 0) + 1
        
        # Sort by frequency
        sorted_phrases = sorted(phrase_frequency.items(), key=lambda x: x[1], reverse=True)
        
        return {
            'total_unique_phrases': len(phrase_frequency),
            'most_common_phrases': sorted_phrases[:50],
            'phrases_with_frequency_5_plus': [phrase for phrase, freq in sorted_phrases if freq >= 5],
            'phrases_with_frequency_10_plus': [phrase for phrase, freq in sorted_phrases if freq >= 10]
        }
        
    except Exception as e:
        logger.error(f"Error analyzing phrases: {e}")
        return {}

def analyze_text_lengths(cursor):
    """Analyze text length distributions"""
    try:
        cursor.execute("""
            SELECT 
                AVG(LENGTH(COALESCE(notes, ''))) as avg_notes_length,
                AVG(LENGTH(COALESCE(specs_description, ''))) as avg_specs_length,
                AVG(LENGTH(COALESCE(product_name, ''))) as avg_product_name_length,
                MAX(LENGTH(COALESCE(notes, ''))) as max_notes_length,
                MAX(LENGTH(COALESCE(specs_description, ''))) as max_specs_length,
                MAX(LENGTH(COALESCE(product_name, ''))) as max_product_name_length,
                MIN(LENGTH(COALESCE(notes, ''))) as min_notes_length,
                MIN(LENGTH(COALESCE(specs_description, ''))) as min_specs_length,
                MIN(LENGTH(COALESCE(product_name, ''))) as min_product_name_length
            FROM orders
        """)
        
        length_stats = cursor.fetchone()
        
        # Analyze length distribution
        cursor.execute("""
            SELECT 
                CASE 
                    WHEN LENGTH(COALESCE(product_name, '')) <= 10 THEN 'قصير (1-10)'
                    WHEN LENGTH(COALESCE(product_name, '')) <= 20 THEN 'متوسط (11-20)'
                    WHEN LENGTH(COALESCE(product_name, '')) <= 30 THEN 'طويل (21-30)'
                    ELSE 'طويل جداً (30+)'
                END as length_category,
                COUNT(*) as frequency
            FROM orders 
            WHERE product_name IS NOT NULL AND product_name != ''
            GROUP BY length_category
            ORDER BY frequency DESC
        """)
        
        length_distribution = cursor.fetchall()
        
        return {
            'length_statistics': {
                'avg_notes_length': length_stats[0],
                'avg_specs_length': length_stats[1],
                'avg_product_name_length': length_stats[2],
                'max_notes_length': length_stats[3],
                'max_specs_length': length_stats[4],
                'max_product_name_length': length_stats[5],
                'min_notes_length': length_stats[6],
                'min_specs_length': length_stats[7],
                'min_product_name_length': length_stats[8]
            },
            'length_distribution': length_distribution
        }
        
    except Exception as e:
        logger.error(f"Error analyzing text lengths: {e}")
        return {}

def extract_arabic_words(text):
    """Extract Arabic words from text"""
    import re
    
    # Remove numbers, punctuation, and extra spaces
    cleaned_text = re.sub(r'[0-9\s\-\(\)]+', ' ', text)
    
    # Extract Arabic words (3+ characters)
    arabic_pattern = r'[\u0600-\u06FF]{3,}'
    words = re.findall(arabic_pattern, cleaned_text)
    
    # Filter out common stop words
    stop_words = {'في', 'من', 'إلى', 'على', 'هذا', 'هذه', 'ذلك', 'تلك', 'كان', 'كانت', 'يكون', 'تكون'}
    words = [word for word in words if word not in stop_words]
    
    return words

def extract_arabic_phrases(text):
    """Extract 2-3 word phrases from Arabic text"""
    import re
    
    # Remove numbers and punctuation
    cleaned_text = re.sub(r'[0-9\s\-\(\)]+', ' ', text)
    
    # Extract Arabic words
    arabic_pattern = r'[\u0600-\u06FF]{3,}'
    words = re.findall(arabic_pattern, cleaned_text)
    
    # Generate 2-3 word phrases
    phrases = []
    for i in range(len(words) - 1):
        # 2-word phrases
        phrase = f"{words[i]} {words[i+1]}"
        phrases.append(phrase)
        
        # 3-word phrases
        if i < len(words) - 2:
            phrase = f"{words[i]} {words[i+1]} {words[i+2]}"
            phrases.append(phrase)
    
    return phrases

def get_order_text_summary():
    """
    Get a summary of order text analytics
    """
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            
            # Get basic counts
            cursor.execute("""
                SELECT 
                    COUNT(*) as total_orders,
                    COUNT(CASE WHEN notes IS NOT NULL AND notes != '' THEN 1 END) as orders_with_notes,
                    COUNT(CASE WHEN specs_description IS NOT NULL AND specs_description != '' THEN 1 END) as orders_with_specs,
                    COUNT(CASE WHEN product_name IS NOT NULL AND product_name != '' THEN 1 END) as orders_with_product_name
                FROM orders
            """)
            
            counts = cursor.fetchone()
            
            # Get most common product names
            cursor.execute("""
                SELECT 
                    product_name,
                    COUNT(*) as frequency
                FROM orders 
                WHERE product_name IS NOT NULL AND product_name != ''
                GROUP BY product_name
                ORDER BY frequency DESC
                LIMIT 10
            """)
            
            top_products = cursor.fetchall()
            
            # Get most common specs
            cursor.execute("""
                SELECT 
                    specs_description,
                    COUNT(*) as frequency
                FROM orders 
                WHERE specs_description IS NOT NULL AND specs_description != ''
                GROUP BY specs_description
                ORDER BY frequency DESC
                LIMIT 10
            """)
            
            top_specs = cursor.fetchall()
            
            return {
                'success': True,
                'summary': {
                    'total_orders': counts[0],
                    'orders_with_notes': counts[1],
                    'orders_with_specs': counts[2],
                    'orders_with_product_name': counts[3],
                    'top_products': top_products,
                    'top_specs': top_specs
                }
            }
            
    except Exception as e:
        logger.error(f"❌ Text summary failed: {e}")
        return {
            'success': False,
            'error': str(e)
        }

def get_duplicate_text_analysis():
    """
    Get detailed analysis of duplicate text patterns
    """
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            
            # Find exact duplicates
            cursor.execute("""
                SELECT 
                    notes, specs_description, product_name,
                    COUNT(*) as frequency,
                    GROUP_CONCAT(tracking_number, ', ') as tracking_numbers
                FROM orders 
                WHERE (notes IS NOT NULL AND notes != '') 
                   OR (specs_description IS NOT NULL AND specs_description != '')
                   OR (product_name IS NOT NULL AND product_name != '')
                GROUP BY notes, specs_description, product_name
                HAVING COUNT(*) > 1
                ORDER BY frequency DESC
                LIMIT 50
            """)
            
            exact_duplicates = cursor.fetchall()
            
            # Find similar patterns (same product name with different specs)
            cursor.execute("""
                SELECT 
                    product_name,
                    COUNT(DISTINCT specs_description) as unique_specs_count,
                    COUNT(*) as total_orders,
                    GROUP_CONCAT(specs_description, ' | ') as all_specs
                FROM orders 
                WHERE product_name IS NOT NULL AND product_name != ''
                GROUP BY product_name
                HAVING COUNT(DISTINCT specs_description) > 1
                ORDER BY total_orders DESC
                LIMIT 20
            """)
            
            similar_patterns = cursor.fetchall()
            
            return {
                'success': True,
                'duplicates': {
                    'exact_duplicates': exact_duplicates,
                    'similar_patterns': similar_patterns,
                    'total_exact_duplicates': len(exact_duplicates),
                    'total_similar_patterns': len(similar_patterns)
                }
            }
            
    except Exception as e:
        logger.error(f"❌ Duplicate analysis failed: {e}")
        return {
            'success': False,
            'error': str(e)
        } 

 