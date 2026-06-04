"""
Core Services Module - Unified Service Action Management
Combines service actions, maintenance, and lifecycle management
"""

import logging
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any

from app.utils.db_utils import get_db

logger = logging.getLogger(__name__)

class Services:
    """Unified service action management"""
    
    def __init__(self):
        self.action_types = {
            'maintenance': 'Maintenance Service',
            'product_swap': 'Product Swap (Full/Partial)',
            'refund': 'Refund Processing',
            'return': 'Product Return',
            'repair': 'Product Repair'
        }
        
        self.priorities = {
            'low': 1,
            'medium': 2,
            'high': 3,
            'urgent': 4
        }
    
    def create(self, order_data: Dict) -> Dict[str, Any]:
        """Create service action from order data"""
        try:
            # Determine if service action is needed
            action_type = self._determine_action_type(order_data)
            if not action_type:
                return {'success': False, 'error': 'No service action required'}
            
            # Determine priority
            priority = self._determine_priority(order_data)
            
            with get_db() as conn:
                # Create main service action
                action_id = self._create_action(conn, order_data, action_type, priority)
                
                # Create parts tracking if needed
                if action_type in ['maintenance', 'product_swap', 'repair']:
                    self._create_parts(conn, action_id, order_data)
                
                # Create hub confirmation workflow
                self._create_hub_workflow(conn, action_id, order_data)
                
                conn.commit()
                
                return {
                    'success': True,
                    'action_id': action_id,
                    'action_type': action_type,
                    'priority': priority
                }
        except Exception as e:
            logger.error(f"Error creating service action: {e}")
            return {'success': False, 'error': str(e)}
    
    def _determine_action_type(self, order_data: Dict) -> Optional[str]:
        """Determine service action type based on order data"""
        state_code = order_data.get('state_code')
        business_type = order_data.get('business_type')
        service_type = order_data.get('service_type')
        cod = float(order_data.get('cod', 0))
        
        # Return orders
        if state_code == 46:  # Returned
            if cod < 0:
                return 'refund'
            else:
                return 'return'
        
        # Product swap orders (exchange/replacement)
        if business_type in ['exchange', 'replacement'] or service_type in ['exchange', 'replacement']:
            return 'product_swap'
        
        # High value orders might need maintenance
        if cod > 5000:
            return 'maintenance'
        
        # Check product type for maintenance needs
        product_name = order_data.get('product_name', '').lower()
        if any(keyword in product_name for keyword in ['machine', 'device', 'equipment']):
            return 'maintenance'
        
        return None
    
    def _determine_priority(self, order_data: Dict) -> str:
        """Determine service action priority"""
        cod = float(order_data.get('cod', 0))
        state_code = order_data.get('state_code')
        
        # High priority for high value or problematic orders
        if cod > 5000 or state_code in [46, 48, 100, 101]:
            return 'high'
        elif cod > 1500:
            return 'medium'
        else:
            return 'low'
    
    def _create_action(self, conn, order_data: Dict, action_type: str, priority: str) -> int:
        """Create main service action record"""
        cursor = conn.execute("""
            INSERT INTO service_actions (
                customer_phone, tracking_number, action_type, action_status,
                priority, service_reason, product_name, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        """, (
            order_data.get('receiver_phone'),
            order_data.get('tracking_number'),
            action_type,
            'requested',
            priority,
            self._generate_reason(order_data, action_type),
            order_data.get('product_name')
        ))
        
        return cursor.lastrowid
    
    def _create_parts(self, conn, action_id: int, order_data: Dict):
        """Create parts tracking for service action"""
        product_name = order_data.get('product_name', '')
        
        # Generate basic parts based on product type
        parts = self._generate_parts_list(product_name)
        
        for part in parts:
            conn.execute("""
                INSERT INTO service_action_parts (
                    action_id, sku, quantity, action_type, created_at
                ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
            """, (
                action_id,
                part['sku'],
                part['quantity'],
                'required'
            ))
    
    def _generate_parts_list(self, product_name: str) -> List[Dict]:
        """Generate parts list based on product name"""
        product_lower = product_name.lower()
        
        if 'machine' in product_lower:
            return [
                {'sku': 'MACHINE-001', 'quantity': 1},
                {'sku': 'MACHINE-002', 'quantity': 2}
            ]
        elif 'device' in product_lower:
            return [
                {'sku': 'DEVICE-001', 'quantity': 1}
            ]
        else:
            return [
                {'sku': 'GENERIC-001', 'quantity': 1}
            ]
    
    def _create_hub_workflow(self, conn, action_id: int, order_data: Dict):
        """Create hub confirmation workflow"""
        conn.execute("""
            INSERT INTO hub_confirmation_workflow (
                action_id, return_tracking_number, confirmation_status, created_at
            ) VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        """, (
            action_id,
            f"RET-{order_data.get('tracking_number')}",
            'pending'
        ))
    
    def _generate_reason(self, order_data: Dict, action_type: str) -> str:
        """Generate service reason based on order data and action type"""
        state_code = order_data.get('state_code')
        business_type = order_data.get('business_type')
        service_type = order_data.get('service_type')
        
        reasons = {
            'return': f"Product return from order state {state_code}",
            'refund': f"Refund processing for order state {state_code}",
            'maintenance': f"Maintenance service for {business_type or service_type} order",
            'product_swap': f"Product swap request ({business_type or service_type})",
            'repair': f"Product repair service"
        }
        
        return reasons.get(action_type, f"Service action for order state {state_code}")
    
    def get(self, action_id: int) -> Dict[str, Any]:
        """Get service action details"""
        try:
            with get_db() as conn:
                cursor = conn.execute("""
                    SELECT sa.*, hcw.confirmation_status, hcw.return_tracking_number
                    FROM service_actions sa
                    LEFT JOIN hub_confirmation_workflow hcw ON sa.action_id = hcw.action_id
                    WHERE sa.action_id = ?
                """, (action_id,))
                action = cursor.fetchone()
                
                if not action:
                    return {'success': False, 'error': 'Service action not found'}
                
                # Get parts
                cursor = conn.execute("""
                    SELECT * FROM service_action_parts WHERE action_id = ?
                """, (action_id,))
                parts = [dict(row) for row in cursor.fetchall()]
                
                return {
                    'success': True,
                    'action': dict(action),
                    'parts': parts
                }
        except Exception as e:
            logger.error(f"Error getting service action: {e}")
            return {'success': False, 'error': str(e)}
    
    def update_status(self, action_id: int, new_status: str, **kwargs) -> Dict[str, Any]:
        """Update service action status"""
        try:
            with get_db() as conn:
                cursor = conn.execute("""
                    UPDATE service_actions SET
                        action_status = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE action_id = ?
                """, (new_status, action_id))
                
                if cursor.rowcount == 0:
                    return {'success': False, 'error': 'Service action not found'}
                
                conn.commit()
                return {'success': True, 'action_id': action_id, 'status': new_status}
        except Exception as e:
            logger.error(f"Error updating service action status: {e}")
            return {'success': False, 'error': str(e)}
    
    def list(self, status: str = None, action_type: str = None, limit: int = 50) -> Dict[str, Any]:
        """List service actions with filtering"""
        try:
            with get_db() as conn:
                query = "SELECT * FROM service_actions"
                params = []
                
                conditions = []
                if status:
                    conditions.append("action_status = ?")
                    params.append(status)
                if action_type:
                    conditions.append("action_type = ?")
                    params.append(action_type)
                
                if conditions:
                    query += " WHERE " + " AND ".join(conditions)
                
                query += " ORDER BY created_at DESC LIMIT ?"
                params.append(limit)
                
                cursor = conn.execute(query, params)
                actions = [dict(row) for row in cursor.fetchall()]
                
                return {
                    'success': True,
                    'actions': actions,
                    'count': len(actions)
                }
        except Exception as e:
            logger.error(f"Error listing service actions: {e}")
            return {'success': False, 'error': str(e)}
    
    def get_analytics(self, date_from: str = None, date_to: str = None) -> Dict[str, Any]:
        """Get service action analytics"""
        try:
            with get_db() as conn:
                # Base query
                query = """
                    SELECT 
                        action_type,
                        action_status,
                        priority,
                        COUNT(*) as count,
                        AVG(CASE WHEN action_status = 'completed' THEN 1 ELSE 0 END) as completion_rate
                    FROM service_actions
                """
                params = []
                
                # Add date filters
                if date_from or date_to:
                    conditions = []
                    if date_from:
                        conditions.append("created_at >= ?")
                        params.append(date_from)
                    if date_to:
                        conditions.append("created_at <= ?")
                        params.append(date_to)
                    
                    if conditions:
                        query += " WHERE " + " AND ".join(conditions)
                
                query += " GROUP BY action_type, action_status, priority"
                
                cursor = conn.execute(query, params)
                analytics = [dict(row) for row in cursor.fetchall()]
                
                return {
                    'success': True,
                    'analytics': analytics
                }
        except Exception as e:
            logger.error(f"Error getting analytics: {e}")
            return {'success': False, 'error': str(e)}

# Global instance
services = Services() 