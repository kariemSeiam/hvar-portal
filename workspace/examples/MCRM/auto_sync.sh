#!/bin/bash

# auto_sync.sh
# Automated sync script for syncing customer data with Bosta API
# This script can be run manually or via cron job

# Set script directory
SCRIPT_DIR="/home/mcrm.hvarstore.com/public_html"
cd "$SCRIPT_DIR" || exit 1

# Set log file
LOG_FILE="$SCRIPT_DIR/sync.log"

# Log function
log() {
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$TIMESTAMP] $1" | tee -a "$LOG_FILE"
}

# Error handling
set -e
trap 'log "ERROR: Script failed at line $LINENO"' ERR

log "=== Starting auto sync ==="

# Activate virtual environment
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
    log "Virtual environment activated"
else
    log "ERROR: Virtual environment not found at venv/bin/activate"
    exit 1
fi

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    log "ERROR: python3 not found"
    exit 1
fi

# Create sync script if it doesn't exist
SYNC_PY="$SCRIPT_DIR/scripts/auto_sync.py"
if [ ! -f "$SYNC_PY" ]; then
    log "Creating sync Python script..."
    mkdir -p "$SCRIPT_DIR/scripts"
    cat > "$SYNC_PY" << 'PYTHON_EOF'
#!/usr/bin/env python3
"""
Auto sync script for syncing customer data with Bosta API
"""
import sys
import os
import logging
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def main():
    """Main sync function"""
    try:
        # Import Flask app and database utilities
        from app import create_app
        from app.utils.db import get_db
        from app.services.bosta_service import sync_customer_data
        from app.models.customer import list_customers
        
        # Create Flask app context
        app = create_app('production')
        
        with app.app_context():
            logger.info("Starting auto sync process...")
            
            # Option 1: Sync all customers with phone numbers
            # Get all customers with phone numbers
            # Note: list_customers() returns a list directly, not a dict
            customers = list_customers(limit=1000, offset=0)
            
            # Handle both list and dict return types
            if isinstance(customers, dict):
                customer_list = customers.get('data', [])
            else:
                customer_list = customers if isinstance(customers, list) else []
            
            synced_count = 0
            error_count = 0
            
            for customer in customer_list:
                phone = customer.get('phone')
                if phone:
                    try:
                        logger.info(f"Syncing customer: {phone}")
                        customer_id = sync_customer_data(phone)
                        if customer_id:
                            synced_count += 1
                            logger.info(f"Successfully synced customer {customer_id} (phone: {phone})")
                        else:
                            logger.warning(f"No orders found for phone: {phone}")
                    except Exception as e:
                        error_count += 1
                        logger.error(f"Error syncing customer {phone}: {str(e)}")
                        continue
            
            logger.info(f"Sync completed. Synced: {synced_count}, Errors: {error_count}")
            return 0
            
    except Exception as e:
        logger.error(f"Fatal error in sync script: {str(e)}", exc_info=True)
        return 1

if __name__ == '__main__':
    sys.exit(main())
PYTHON_EOF
    chmod +x "$SYNC_PY"
    log "Sync Python script created at $SYNC_PY"
fi

# Run sync script
log "Running sync script..."
if python3 "$SYNC_PY" >> "$LOG_FILE" 2>&1; then
    log "=== Auto sync completed successfully ==="
    exit 0
else
    log "=== Auto sync failed ==="
    exit 1
fi

