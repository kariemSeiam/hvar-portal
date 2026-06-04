"""
Unified Utilities Package
Centralized utilities to eliminate duplication across the project
"""

from .api_response import create_api_response
from .db_utils import (
    get_db, 
    get_database_path, 
    check_table_exists, 
    get_table_count,
    execute_query,
    execute_single_query,
    execute_update,
    get_database_status,
    backup_database,
    optimize_database
)
from .init_utils import (
    initialize_customer_management,
    initialize_customer_service,
    initialize_unified_service,
    initialize_maintenance,
    initialize_products
)
from .phone_utils import clean_phone, normalize_phone, is_valid_egyptian_phone

__all__ = [
    # API Response
    'create_api_response',
    
    # Database Utilities
    'get_db',
    'get_database_path',
    'check_table_exists',
    'get_table_count',
    'execute_query',
    'execute_single_query',
    'execute_update',
    'get_database_status',
    'backup_database',
    'optimize_database',
    
    # Initialization Utilities
    'initialize_customer_management',
    'initialize_customer_service',
    'initialize_unified_service',
    'initialize_maintenance',
    'initialize_products',
    
    # Phone Utilities
    'clean_phone',
    'normalize_phone',
    'is_valid_egyptian_phone'
] 