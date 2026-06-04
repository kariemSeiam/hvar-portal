#!/usr/bin/env python3
"""
Data Migration: Fix service_type from confirmation_snapshot
----------------------------------------------------------

One-time script to fix existing orders where service_type doesn't match
confirmation_snapshot.call_type.

This happens when orders were confirmed with the old code that didn't
update service_type correctly (Bug 1 from CALL-TYPE-AUDIT-2026-03-10.md).

Usage:
    python scripts/migrate_service_types.py [--dry-run]

Options:
    --dry-run    Show what would change without making changes
"""

import sys
import os
import json
import argparse

# Add parent directory to path so we can import app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.utils.db import execute_query, execute_update


def migrate_service_types(dry_run=False):
    """Fix service_type for orders where it doesn't match confirmation_snapshot.call_type"""
    
    # Find orders with mismatched service_type
    sql = """
        SELECT 
            id, 
            service_type,
            confirmation_snapshot
        FROM orders 
        WHERE confirmation_snapshot IS NOT NULL
          AND status = 'confirmed'
    """
    
    orders = execute_query(sql, ())
    
    if not orders:
        print("✓ No orders with confirmation_snapshot found")
        return
    
    updates = []
    for order in orders:
        snap_str = order.get('confirmation_snapshot')
        if not snap_str:
            continue
            
        try:
            snap = json.loads(snap_str) if isinstance(snap_str, str) else snap_str
        except (json.JSONDecodeError, TypeError):
            print(f"⚠️  Order {order['id']}: Invalid JSON in confirmation_snapshot, skipping")
            continue
        
        call_type = snap.get('call_type')
        current_service_type = order.get('service_type')
        
        if call_type and call_type != current_service_type:
            updates.append({
                'id': order['id'],
                'old': current_service_type,
                'new': call_type
            })
    
    if not updates:
        print("✓ All orders have correct service_type (matching confirmation_snapshot.call_type)")
        return
    
    print(f"\nFound {len(updates)} order(s) with mismatched service_type:\n")
    
    for u in updates:
        print(f"  Order #{u['id']}: '{u['old']}' → '{u['new']}'")
    
    if dry_run:
        print(f"\n[DRY RUN] Would update {len(updates)} orders")
        print("Run without --dry-run to apply changes")
        return
    
    # Apply updates
    for u in updates:
        try:
            execute_update(
                "UPDATE orders SET service_type = %s WHERE id = %s",
                (u['new'], u['id'])
            )
            print(f"✓ Updated order #{u['id']}")
        except Exception as e:
            print(f"✗ Failed to update order #{u['id']}: {e}")
    
    print(f"\n✓ Migration complete: {len(updates)} orders updated")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description='Fix service_type for orders with mismatched confirmation_snapshot'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Show what would change without making changes'
    )
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("Data Migration: Fix service_type from confirmation_snapshot")
    print("=" * 60)
    
    migrate_service_types(dry_run=args.dry_run)
