"""
app/config.py
config module
"""

from flask import Flask
from flask_cors import CORS
import logging
import os

"""
Hvar-Bosta application configuration - Orders Only
"""

# Setup logging
logger = logging.getLogger(__name__)

# Base directory is parent of app package
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Database configuration
DATABASE_PATH = os.environ.get('DATABASE_PATH', os.path.join(BASE_DIR, 'database.db'))

# API request configuration
BATCH_SIZE = int(os.environ.get('BATCH_SIZE', 200))
API_TIMEOUT = int(os.environ.get('API_TIMEOUT', 30))
API_BASE_URL = os.environ.get('API_BASE_URL', 'https://app.bosta.co/api/v2')
API_KEY = os.environ.get('API_KEY', None)

# Application settings
DEBUG = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'

# Feature toggles
# Disable automatic product linking from Bosta orders to internal products/stock by default
# Set AUTO_LINK_PRODUCTS=true to re-enable heuristic linking
AUTO_LINK_PRODUCTS = os.environ.get('AUTO_LINK_PRODUCTS', 'false').lower() == 'true'

# Clean database schema - Orders Only
SCHEMA = """
-- Core Orders Table
CREATE TABLE IF NOT EXISTS orders (
    -- Primary identifiers
    id TEXT PRIMARY KEY,
    tracking_number TEXT UNIQUE NOT NULL,
    
    -- Order status & lifecycle
    state_code INTEGER NOT NULL,
    state_value TEXT,
    is_confirmed_delivery BOOLEAN DEFAULT 0,
    
    -- Order type information
    order_type_code INTEGER,
    order_type_value TEXT,
    
    -- Financial data
    cod REAL DEFAULT 0,
    bosta_fees REAL DEFAULT 0,
    
    -- Customer information
    receiver_phone TEXT NOT NULL,
    receiver_name TEXT,
    receiver_first_name TEXT,
    receiver_last_name TEXT,
    
    -- Product information
    notes TEXT,
    product_name TEXT,
    product_count INTEGER DEFAULT 1,
    
    -- Geographic information - delivery address
    dropoff_city_name TEXT,
    dropoff_zone_name TEXT,
    dropoff_district_name TEXT,
    dropoff_first_line TEXT,
    
    -- Pickup location
    pickup_city TEXT,
    pickup_zone TEXT,
    pickup_district TEXT,
    pickup_address TEXT,
    
    -- Timeline dates
    created_at TEXT NOT NULL,
    delivered_at TEXT,
    returned_at TEXT,
    
    -- Delivery metrics
    delivery_time_hours REAL,
    attempts_count INTEGER DEFAULT 0,
    calls_count INTEGER DEFAULT 0,
    
    -- System data
    last_synced TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by_system TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for orders table
CREATE INDEX IF NOT EXISTS idx_orders_tracking ON orders(tracking_number);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(receiver_phone);
CREATE INDEX IF NOT EXISTS idx_orders_state ON orders(state_code);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_delivered ON orders(delivered_at);
CREATE INDEX IF NOT EXISTS idx_orders_city ON orders(dropoff_city_name);
CREATE INDEX IF NOT EXISTS idx_orders_zone ON orders(dropoff_zone_name);
"""

def configure_app(app: Flask):
    """
    Configure Flask application with essential settings
    
    Args:
        app: Flask application instance
    """
    # Set default configuration
    app.config.update(
        SECRET_KEY=os.environ.get('SECRET_KEY', 'hvar-bosta-api-secret-key'),
        DATABASE_PATH=DATABASE_PATH,
        DEBUG=DEBUG,
        AUTO_LINK_PRODUCTS=AUTO_LINK_PRODUCTS,
        JSON_SORT_KEYS=False,
        JSONIFY_PRETTYPRINT_REGULAR=False,
        MAX_CONTENT_LENGTH=16 * 1024 * 1024  # 16MB max upload
    )
    
    # Configure CORS
    CORS(app)
    
    # Log configuration
    logger.info(f"App configured with DATABASE_PATH={DATABASE_PATH}")
    
    return app 