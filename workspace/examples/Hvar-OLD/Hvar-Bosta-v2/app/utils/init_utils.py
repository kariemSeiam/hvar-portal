"""
Unified Initialization Utilities
Centralized initialization functions to eliminate duplication across routes
"""

import logging
from datetime import datetime
from typing import Dict, Any, Optional
from app.utils.db_utils import get_db, check_table_exists, get_table_count
from app.models.customer_management import init_customer_management_db
from app.models.customer_service import CustomerServiceManager
from app.utils.api_response import create_api_response

logger = logging.getLogger(__name__)

def initialize_customer_management() -> Dict[str, Any]:
    """Initialize customer management database - idempotent operation"""
    try:
        # Check if already initialized
        if check_table_exists('customers'):
            customer_count = get_table_count('customers')
            
            return create_api_response(
                True,
                data={
                    'message': 'Customer management database already initialized',
                    'status': 'ready',
                    'customer_count': customer_count,
                    'note': 'Customer profiles are now created/updated automatically during order processing',
                    'real_time_processing': True,
                    'initialized_at': datetime.now().isoformat()
                }
            )
        
        # Initialize if not already done
        init_result = init_customer_management_db()
        if not init_result.get('success'):
            return create_api_response(False, error=init_result.get('error'))
        
        return create_api_response(
            True,
            data={
                'message': 'Customer management database initialized successfully',
                'status': 'initialized',
                'note': 'Customer profiles are now created/updated automatically during order processing',
                'real_time_processing': True,
                'initialized_at': datetime.now().isoformat()
            }
        )
            
    except Exception as e:
        logger.error(f"❌ Customer management initialization failed: {e}")
        return create_api_response(False, error=str(e))

def initialize_customer_service() -> Dict[str, Any]:
    """Initialize customer service database - idempotent operation"""
    try:
        # Check if already initialized
        if check_table_exists('service_tickets'):
            ticket_count = get_table_count('service_tickets')
            
            return create_api_response(
                True,
                data={
                    'message': 'Customer service system already initialized',
                    'status': 'ready',
                    'ticket_count': ticket_count,
                    'initialized_at': datetime.now().isoformat()
                }
            )
        
        # Initialize if not already done
        service_manager = CustomerServiceManager()
        service_manager.init_database()
        
        return create_api_response(
            True,
            data={
                'message': 'Customer service system initialized successfully',
                'status': 'initialized',
                'initialized_at': datetime.now().isoformat()
            }
        )
    except Exception as e:
        logger.error(f"Customer service initialization failed: {e}")
        return create_api_response(False, error=str(e))

def initialize_unified_service() -> Dict[str, Any]:
    """Initialize unified customer service database - idempotent operation"""
    try:
        # Check if already initialized - check both service_actions and service_action_follow_ups
        if check_table_exists('service_actions') and check_table_exists('service_action_follow_ups'):
            action_count = get_table_count('service_actions')
            follow_up_count = get_table_count('service_action_follow_ups')
            
            return create_api_response(
                True,
                data={
                    'message': 'Unified customer service system already initialized',
                    'status': 'ready',
                    'action_count': action_count,
                    'follow_up_count': follow_up_count,
                    'initialized_at': datetime.now().isoformat()
                }
            )
        
        # Initialize if not already done
        from app.routes.unified_customer_service import init_unified_service_database
        init_unified_service_database()
        
        # Get counts after initialization
        action_count = get_table_count('service_actions') if check_table_exists('service_actions') else 0
        follow_up_count = get_table_count('service_action_follow_ups') if check_table_exists('service_action_follow_ups') else 0
        
        return create_api_response(
            True,
            data={
                'message': 'Unified customer service system initialized successfully',
                'status': 'initialized',
                'action_count': action_count,
                'follow_up_count': follow_up_count,
                'initialized_at': datetime.now().isoformat()
            }
        )
    except Exception as e:
        logger.error(f"Unified customer service initialization failed: {e}")
        return create_api_response(False, error=str(e))

def initialize_maintenance() -> Dict[str, Any]:
    """Initialize maintenance database - idempotent operation"""
    try:
        # Check if already initialized
        if check_table_exists('maintenance_cycles'):
            cycle_count = get_table_count('maintenance_cycles')
            
            return create_api_response(
                True,
                data={
                    'message': 'Maintenance system already initialized',
                    'status': 'ready',
                    'cycle_count': cycle_count,
                    'initialized_at': datetime.now().isoformat()
                }
            )
        
        # Initialize if not already done
        from app.models.database import init_production_db
        init_result = init_production_db()
        
        if not init_result.get('success'):
            return create_api_response(False, error=init_result.get('error'))
        
        return create_api_response(
            True,
            data={
                'message': 'Maintenance system initialized successfully',
                'status': 'initialized',
                'initialized_at': datetime.now().isoformat()
            }
        )
    except Exception as e:
        logger.error(f"Maintenance initialization failed: {e}")
        return create_api_response(False, error=str(e))

def initialize_products() -> Dict[str, Any]:
    """Initialize product management database - idempotent operation"""
    try:
        # Check if already initialized
        if check_table_exists('products'):
            product_count = get_table_count('products')
            
            return create_api_response(
                True,
                data={
                    'message': 'Product management system already initialized',
                    'status': 'ready',
                    'product_count': product_count,
                    'initialized_at': datetime.now().isoformat()
                }
            )
        
        # Initialize if not already done
        from app.models.product_management import ProductManagement
        product_manager = ProductManagement()
        
        return create_api_response(
            True,
            data={
                'message': 'Product management system initialized successfully',
                'status': 'initialized',
                'initialized_at': datetime.now().isoformat()
            }
        )
    except Exception as e:
        logger.error(f"Product management initialization failed: {e}")
        return create_api_response(False, error=str(e)) 