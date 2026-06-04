#!/usr/bin/env python3
"""
Clean Bosta Integration Application - Orders Only
Unified and deduplicated codebase
"""
import logging
import sys
from datetime import datetime
from flask import Flask
from app.config import configure_app
from app.utils import get_db, get_database_status

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def create_app():
    app = Flask(__name__)
    configure_app(app)
    
    # Initialize database using unified utilities
    try:
        from app.models.database import init_production_db
        init_production_db()
        logger.info("✅ Database initialized successfully")
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")

    # Initialize all system components
    try:
        from app.utils.init_utils import (
            initialize_customer_management,
            initialize_unified_service,
            initialize_maintenance,
            initialize_products
        )
        
        # Initialize customer management
        customer_result = initialize_customer_management()
        if customer_result['success']:
            logger.info("✅ Customer management system initialized successfully")
        else:
            logger.error(f"❌ Customer management initialization failed: {customer_result.get('error')}")
        
        # Initialize unified customer service (includes service_action_follow_ups table)
        unified_service_result = initialize_unified_service()
        if unified_service_result['success']:
            logger.info("✅ Unified customer service system initialized successfully")
        else:
            logger.error(f"❌ Unified customer service initialization failed: {unified_service_result.get('error')}")
        
        # Initialize maintenance system
        maintenance_result = initialize_maintenance()
        if maintenance_result['success']:
            logger.info("✅ Maintenance system initialized successfully")
        else:
            logger.error(f"❌ Maintenance initialization failed: {maintenance_result.get('error')}")
        
        # Initialize product management
        product_result = initialize_products()
        if product_result['success']:
            logger.info("✅ Product management system initialized successfully")
        else:
            logger.error(f"❌ Product management initialization failed: {product_result.get('error')}")
            
    except Exception as e:
        logger.error(f"❌ System initialization failed: {e}")

    # Import and register blueprints for existing routes
    try:
        from app.routes import customers, products, maintenance, customer_service, unified_customer_service
        from app.api import orders, unified_orders
        app.register_blueprint(customers.bp)
        app.register_blueprint(products.bp)
        app.register_blueprint(maintenance.bp)
        app.register_blueprint(customer_service.bp)
        app.register_blueprint(unified_customer_service.bp)
        app.register_blueprint(orders.bp)
        app.register_blueprint(unified_orders.bp)
        logger.info("✅ All route blueprints registered successfully")
    except ImportError as e:
        logger.warning(f"⚠️ Some route modules could not be imported: {e}")

    # Add health check endpoint
    @app.route('/health', methods=['GET'])
    def health_check():
        """System health check endpoint"""
        try:
            db_status = get_database_status()
            return {
                'status': 'healthy',
                'database': db_status,
                'timestamp': datetime.now().isoformat(),
                'version': '2.0.0',
                'message': 'HVAR system is running with unified utilities'
            }
        except Exception as e:
            return {
                'status': 'unhealthy',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }, 500

    # Add root route
    @app.route('/', methods=['GET'])
    def root():
        """Root endpoint with system information"""
        # Check if sync is running by trying to import order_processor
        sync_status = "Unknown"
        try:
            from app.services.order_processor import order_processor
            sync_status = "Running" if order_processor.is_running else "Stopped"
        except:
            sync_status = "Not Available"
        
        return {
            'message': 'HVAR Bosta Integration System v2.0.0',
            'status': 'running',
            'timestamp': datetime.now().isoformat(),
            'sync_status': sync_status,
            'endpoints': {
                'health': '/health',
                'api_docs': '/api/docs',
                'sync_status': '/api/sync/status',
                'sync_start': '/api/sync/start',
                'sync_stop': '/api/sync/stop',
                'customers': '/api/customers',
                'products': '/api/products',
                'maintenance': '/api/maintenance',
                'customer_service': '/api/customer-service',
                'unified_service': '/api/unified-service',
                'orders': '/api/orders'
            },
            'database': get_database_status()
        }

    # Add sync status endpoint
    @app.route('/api/sync/status', methods=['GET'])
    def sync_status():
        """Get sync status and control"""
        try:
            from app.services.order_processor import order_processor
            return {
                'sync_running': order_processor.is_running,
                'current_page': getattr(order_processor, 'current_page', 0),
                'total_pages': getattr(order_processor, 'total_pages', 0),
                'processed_orders': getattr(order_processor, 'processed_orders', 0),
                'last_sync': getattr(order_processor, 'last_sync', None),
                'next_sync': getattr(order_processor, 'next_sync', None),
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            return {
                'sync_running': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }

    # Add sync start endpoint
    @app.route('/api/sync/start', methods=['POST'])
    def start_sync():
        """Start background sync manually"""
        try:
            from app.services.order_processor import order_processor
            if order_processor.is_running:
                return {
                    'success': False,
                    'message': 'Sync is already running',
                    'timestamp': datetime.now().isoformat()
                }
            
            order_processor.start_background_sync()
            return {
                'success': True,
                'message': 'Background sync started successfully',
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }, 500

    # Add sync stop endpoint
    @app.route('/api/sync/stop', methods=['POST'])
    def stop_sync():
        """Stop background sync manually"""
        try:
            from app.services.order_processor import order_processor
            if not order_processor.is_running:
                return {
                    'success': False,
                    'message': 'Sync is not running',
                    'timestamp': datetime.now().isoformat()
                }
            
            order_processor.stop_background_sync()
            return {
                'success': True,
                'message': 'Background sync stopped successfully',
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }, 500

    # Add API documentation endpoint
    @app.route('/api/docs', methods=['GET'])
    def api_docs():
        """Dynamic API documentation endpoint"""
        try:
            from app.utils.api_docs_generator import generate_comprehensive_api_docs
            return generate_comprehensive_api_docs()
        except Exception as e:
            logger.error(f"Error generating API docs: {e}")
            return {
                'title': 'HVAR Bosta Integration API v2.0.0',
                'description': 'Comprehensive order management and customer service system',
                'version': '2.0.0',
                'timestamp': datetime.now().isoformat(),
                'error': f'Failed to generate dynamic documentation: {str(e)}',
                'database_status': get_database_status()
            }

    return app 