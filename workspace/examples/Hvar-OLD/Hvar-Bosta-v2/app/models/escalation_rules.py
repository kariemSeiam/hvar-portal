"""
Escalation Rules Management for HVAR Complete Cycle System
Handles SLA violations and automatic escalation workflows

This module provides business logic functions for managing escalation rules.
DB setup is handled in database.py.
"""

import logging
import json
from app.utils.db_utils import get_db

# Setup logging
logger = logging.getLogger(__name__)

def get_active_escalation_rules():
    """
    Get all active escalation rules
    
    Returns:
        dict: List of active escalation rules
    """
    try:
        with get_db() as conn:
            cursor = conn.execute("""
                SELECT rule_id, violation_hours, escalation_level, escalation_role,
                       auto_assign, rule_order, is_active, created_at
                FROM escalation_rules
                WHERE is_active = 1
                ORDER BY rule_order ASC
            """)
            
            columns = [col[0] for col in cursor.description]
            rules = [dict(zip(columns, row)) for row in cursor.fetchall()]
            
            return {'success': True, 'rules': rules}
            
    except Exception as e:
        logger.error(f"❌ Failed to get escalation rules: {e}")
        return {'success': False, 'error': str(e)}

def update_escalation_rule(rule_id, **kwargs):
    """
    Update an existing escalation rule
    
    Args:
        rule_id: ID of the rule to update
        **kwargs: Fields to update
        
    Returns:
        dict: Result of update operation
    """
    try:
        allowed_fields = [
            'violation_hours', 'escalation_level', 'escalation_role',
            'auto_assign', 'rule_order', 'is_active'
        ]
        
        # Filter out invalid fields
        update_data = {k: v for k, v in kwargs.items() if k in allowed_fields}
        
        if not update_data:
            return {'success': False, 'error': 'No valid fields to update'}
        
        # Build update query
        set_clause = ', '.join([f"{field} = ?" for field in update_data.keys()])
        values = list(update_data.values()) + [rule_id]
        
        with get_db() as conn:
            conn.execute(
                f"UPDATE escalation_rules SET {set_clause} WHERE rule_id = ?",
                values
            )
            
            if conn.total_changes > 0:
                return {'success': True, 'updated': True}
            else:
                return {'success': True, 'updated': False, 'message': 'Rule not found or no changes made'}
                
    except Exception as e:
        logger.error(f"❌ Failed to update escalation rule: {e}")
        return {'success': False, 'error': str(e)}

def add_escalation_rule(violation_hours, escalation_level, escalation_role, 
                       auto_assign=0, rule_order=None):
    """
    Add a new escalation rule with duplicate prevention
    
    Args:
        violation_hours: Hours before escalation
        escalation_level: Level of escalation
        escalation_role: Role to escalate to
        auto_assign: Whether to auto-assign
        rule_order: Order of the rule
        
    Returns:
        dict: Result of add operation
    """
    try:
        with get_db() as conn:
            # Check if rule already exists
            cursor = conn.execute("""
                SELECT rule_id FROM escalation_rules 
                WHERE violation_hours = ? AND escalation_level = ? AND escalation_role = ?
            """, (violation_hours, escalation_level, escalation_role))
            
            if cursor.fetchone():
                return {'success': False, 'error': 'Rule already exists with these parameters'}
            
            # Determine rule order if not provided
            if rule_order is None:
                cursor = conn.execute("SELECT MAX(rule_order) FROM escalation_rules")
                max_order = cursor.fetchone()[0] or 0
                rule_order = max_order + 1
            
            # Insert new rule
            conn.execute("""
                INSERT INTO escalation_rules 
                (violation_hours, escalation_level, escalation_role,
                 auto_assign, rule_order, is_active)
                VALUES (?, ?, ?, ?, ?, 1)
            """, (violation_hours, escalation_level, escalation_role, 
                  auto_assign, rule_order))
            
            return {'success': True, 'rule_id': conn.lastrowid}
            
    except Exception as e:
        logger.error(f"❌ Failed to add escalation rule: {e}")
        return {'success': False, 'error': str(e)}

def delete_escalation_rule(rule_id):
    """
    Delete an escalation rule (soft delete by setting is_active = 0)
    
    Args:
        rule_id: ID of the rule to delete
        
    Returns:
        dict: Result of delete operation
    """
    try:
        with get_db() as conn:
            conn.execute("UPDATE escalation_rules SET is_active = 0 WHERE rule_id = ?", (rule_id,))
            
            if conn.total_changes > 0:
                return {'success': True, 'deleted': True}
            else:
                return {'success': True, 'deleted': False, 'message': 'Rule not found'}
                
    except Exception as e:
        logger.error(f"❌ Failed to delete escalation rule: {e}")
        return {'success': False, 'error': str(e)} 