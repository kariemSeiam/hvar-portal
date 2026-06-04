"""
server.py
server module
"""

from app import create_app
from app.config import DATABASE_PATH
from app.models.database import init_production_db, get_db_status
from app.services.order_processor import order_processor
from datetime import datetime
from flask import Flask, jsonify
from flask_cors import CORS
from threading import Thread
import argparse
import logging
import os
import sys

#!/usr/bin/env python3
"""
Advanced Bosta Integration Server - Orders Only
Automatic order synchronization with resume capability
"""

# Import production modules

# Import the Flask app factory

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('bosta_server.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def create_server_app(init_db=True, enable_sync=True):
    """Create and configure the Flask application with optional background sync"""
    # Use the app factory
    app = create_app()
    
    # Initialize production database if requested
    if init_db:
        try:
            logger.info("Initializing production database...")
            init_production_db()
            
            # Get database status for logging
            db_status = get_db_status()
            if db_status.get('success'):
                logger.info(f"Production database ready - Tables: {db_status.get('tables', {})}")
            else:
                logger.error(f"Database status check failed: {db_status.get('error')}")
                
        except Exception as e:
            logger.error(f"Database initialization failed: {e}")
            raise
    
    # Start background sync only if enabled
    if enable_sync:
        try:
            logger.info("Starting background order sync...")
            order_processor.start_background_sync()
            logger.info("Background sync started successfully")
        except Exception as e:
            logger.error(f"Failed to start background sync: {e}")
    else:
        logger.info("🔄 Background sync disabled (--nsync flag used)")
    
    return app

def main():
    """Main application entry point"""
    parser = argparse.ArgumentParser(description='Bosta Integration Server')
    parser.add_argument('--host', default='0.0.0.0', help='Host to bind to')
    parser.add_argument('--port', type=int, default=5000, help='Port to bind to')
    parser.add_argument('--debug', action='store_true', help='Enable debug mode')
    parser.add_argument('--no-db-init', action='store_true', help='Skip database initialization')
    parser.add_argument('--nsync', action='store_true', help='Disable background sync (API server only)')
    
    args = parser.parse_args()
    
    try:
        # Create and configure the application
        app = create_server_app(init_db=not args.no_db_init, enable_sync=not args.nsync)
        
        # Start the Flask development server
        logger.info(f"🚀 Starting Bosta Integration Server on {args.host}:{args.port}")
        logger.info(f"📊 Database: {DATABASE_PATH}")
        logger.info(f"🔧 Debug mode: {args.debug}")
        logger.info(f"🔄 Background sync: {'Disabled' if args.nsync else 'Enabled'}")
        
        app.run(
            host=args.host,
            port=args.port,
            debug=args.debug,
            use_reloader=False  # Disable reloader to prevent duplicate background sync
        )
        
    except KeyboardInterrupt:
        logger.info("🛑 Server stopped by user")
    except Exception as e:
        logger.error(f"❌ Server startup failed: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main() 