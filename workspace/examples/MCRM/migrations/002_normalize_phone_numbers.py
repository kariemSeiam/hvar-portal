#!/usr/bin/env python3
# migrations/002_normalize_phone_numbers.py
"""
Migration script to normalize existing phone numbers in database to 01XXXXXXXXX format.
Converts all phone numbers from +201XXXXXXXXX, 201XXXXXXXXX, etc. to 01XXXXXXXXX format.
"""

import os
import sys
import pymysql
from pathlib import Path

# Add parent directory to path to import phone normalizer
sys.path.insert(0, str(Path(__file__).parent.parent))
from app.utils.phone_normalizer import normalize_phone_safe


def load_config(config_file='.env'):
    """Load database configuration from environment file."""
    config = {}
    if os.path.exists(config_file):
        with open(config_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    config[key.strip()] = value.strip().strip('"\'')
    
    # Default values
    config.setdefault('DATABASE_HOST', 'localhost')
    config.setdefault('DATABASE_PORT', '3306')
    config.setdefault('DATABASE_USER', 'mcrm_hvar_user')
    config.setdefault('DATABASE_PASSWORD', '1618')
    config.setdefault('DATABASE_NAME', 'mcrm_hvar_hub')
    
    return config


def normalize_phone_numbers():
    """Normalize all phone numbers in the database to 01XXXXXXXXX format."""
    config = load_config()
    
    print("=" * 60)
    print("Phone Number Normalization Migration")
    print("=" * 60)
    print(f"Database: {config['DATABASE_NAME']}")
    print(f"Host: {config['DATABASE_HOST']}")
    print()
    
    try:
        conn = pymysql.connect(
            host=config['DATABASE_HOST'],
            port=int(config['DATABASE_PORT']),
            user=config['DATABASE_USER'],
            password=config['DATABASE_PASSWORD'],
            database=config['DATABASE_NAME'],
            cursorclass=pymysql.cursors.DictCursor,
            autocommit=False
        )
        
        cursor = conn.cursor()
        
        # Get all customers with phone numbers
        cursor.execute("SELECT id, phone, phone_secondary FROM customers")
        customers = cursor.fetchall()
        
        print(f"Found {len(customers)} customers to process")
        print()
        
        updated_count = 0
        skipped_count = 0
        error_count = 0
        
        for customer in customers:
            customer_id = customer['id']
            phone = customer['phone']
            phone_secondary = customer.get('phone_secondary')
            
            updates = {}
            
            # Normalize primary phone
            if phone:
                normalized_phone = normalize_phone_safe(phone)
                if normalized_phone and normalized_phone != phone:
                    updates['phone'] = normalized_phone
                    print(f"Customer {customer_id}: {phone} -> {normalized_phone}")
                elif not normalized_phone:
                    print(f"WARNING: Customer {customer_id}: Could not normalize phone '{phone}' (skipping)")
                    error_count += 1
                    continue
            
            # Normalize secondary phone
            if phone_secondary:
                normalized_secondary = normalize_phone_safe(phone_secondary)
                if normalized_secondary and normalized_secondary != phone_secondary:
                    updates['phone_secondary'] = normalized_secondary
                    print(f"Customer {customer_id} (secondary): {phone_secondary} -> {normalized_secondary}")
                elif not normalized_secondary:
                    # Secondary phone is optional, so we can set it to NULL if invalid
                    updates['phone_secondary'] = None
                    print(f"WARNING: Customer {customer_id}: Invalid secondary phone '{phone_secondary}' (setting to NULL)")
            
            # Update customer if there are changes
            if updates:
                try:
                    set_clauses = []
                    params = []
                    for key, value in updates.items():
                        set_clauses.append(f"{key} = %s")
                        params.append(value)
                    
                    params.append(customer_id)
                    sql = f"UPDATE customers SET {', '.join(set_clauses)} WHERE id = %s"
                    cursor.execute(sql, params)
                    updated_count += 1
                except Exception as e:
                    print(f"ERROR: Error updating customer {customer_id}: {e}")
                    error_count += 1
                    conn.rollback()
                    continue
            else:
                skipped_count += 1
        
        # Commit all changes
        conn.commit()
        
        print()
        print("=" * 60)
        print("Migration Summary")
        print("=" * 60)
        print(f"Updated: {updated_count} customers")
        print(f"Skipped: {skipped_count} customers (already normalized)")
        print(f"Errors: {error_count} customers")
        print()
        
        if error_count == 0:
            print("Phone number normalization completed successfully!")
        else:
            print(f"Migration completed with {error_count} error(s)")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"ERROR: {e}")
        if 'conn' in locals():
            conn.rollback()
        sys.exit(1)


if __name__ == '__main__':
    # Set UTF-8 encoding for Windows console
    import sys
    import io
    if sys.platform == 'win32':
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
    
    # Ask for confirmation
    print("WARNING: This will update all phone numbers in the database!")
    print("All phone numbers will be normalized to 01XXXXXXXXX format.")
    print()
    response = input("Do you want to continue? (yes/no): ")
    
    if response.lower() != 'yes':
        print("Operation cancelled")
        sys.exit(0)
    
    normalize_phone_numbers()
