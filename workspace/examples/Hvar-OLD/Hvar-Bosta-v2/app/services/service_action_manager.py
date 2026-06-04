"""
Enhanced Service Action Management System
Unified service action creation, parts tracking, and lifecycle management
Following HVAR Complete Cycle System specifications
"""

import sqlite3
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from decimal import Decimal
import json

from app.utils.db_utils import get_db, get_database_path


# Setup logging
logger = logging.getLogger(__name__)

class ServiceActionManager:
    """
    Unified Service Action Management System
    Handles automated service action creation, parts tracking, and lifecycle management
    """
    
    def __init__(self, db_path: str = None):
        self.db_path = db_path or get_database_path()
        self.business_rules = self._load_business_rules()
        
    def _load_business_rules(self) -> Dict[str, Any]:
        """Load business rules for manual service action creation - NO AUTO CREATION"""
        return {
            'auto_create_conditions': [],  # DISABLED - No automatic creation
            
            # Manual creation only - explicit flag required
            'manual_create_conditions': [
                {
                    'name': 'explicit_service_request',
                    'condition': lambda order: order.get('requires_service_action', False) and order.get('manual_creation', True),
                    'action_type': 'manual',
                    'priority': 'medium'
                }
            ],

            'parts_tracking_required': ['maintenance', 'service', 'product_swap', 'premium_service'],
            'hub_confirmation_required': ['return_refund', 'product_swap', 'maintenance'],
            
            # New: Manual creation requirements
            'manual_creation_required': True,
            'auto_creation_disabled': True
        }
        
    # =================== ENHANCED SERVICE ACTION CREATION ===================
    
    def create_service_action_with_parts(self, conn, order_data: Dict) -> Optional[int]:
        """
        Enhanced service action creation with parts tracking
        Following HVAR Complete Cycle System logic
        """
        try:
            # Enhanced business rules validation
            action_rule = self._evaluate_business_rules(order_data)
            if not action_rule:
                return None
            
            action_type = action_rule['action_type']
            priority = action_rule['priority']
            
            # Get product and parts information
            product_info = self._get_product_info(conn, order_data.get('product_sku'))

            # Prefer explicitly selected parts (from UI) over auto parts discovery
            explicit_parts = []
            try:
                if order_data.get('parts_required'):
                    for p in order_data['parts_required']:
                        # Accept either part_sku or sku field from UI
                        part_sku = p.get('part_sku') or p.get('sku')
                        if part_sku:
                            explicit_parts.append({
                                'part_sku': part_sku,
                                'part_name': p.get('part_name'),
                                'part_type': p.get('part_type'),
                                'quantity': int(p.get('quantity', 1))
                            })
            except Exception as _:
                # Fallback silently to automatic parts if parsing fails
                explicit_parts = []

            parts_list = explicit_parts if explicit_parts else self._get_product_parts(conn, order_data.get('product_sku'))
            
            # Create main service action with enhanced data
            action_id = self._create_main_service_action(conn, order_data, action_type, product_info, priority)
            
            if action_id:
                # Add parts tracking if required by business rules
                if action_type in self.business_rules['parts_tracking_required'] and parts_list:
                    self._create_service_action_parts(conn, action_id, parts_list, order_data)
                
                # Create hub confirmation workflow entry if required
                if action_type in self.business_rules['hub_confirmation_required']:
                    self._create_hub_confirmation_workflow(conn, action_id, order_data)
                
                # Update stock allocations (reserve only explicitly selected parts, or discovered parts if no explicit selection)
                if parts_list and action_type in self.business_rules['parts_tracking_required']:
                    self._update_stock_on_service_action_creation(conn, action_id, parts_list, action_type)
                

                
                # Log service action creation
                logger.info(f"✅ Service action {action_id} created for order {order_data.get('tracking_number')} - Type: {action_type}, Priority: {priority}")
                
                return action_id
            
        except Exception as e:
            logger.error(f"❌ Error creating service action for order {order_data.get('tracking_number')}: {e}")
            return None
    
    def _evaluate_business_rules(self, order_data: Dict) -> Optional[Dict[str, str]]:
        """Evaluate business rules - MANUAL CREATION ONLY - No automatic service actions"""
        try:
            # DISABLED: Automatic service action creation
            # All service actions must be created manually through the UI
            
            # Check for explicit manual service action flag
            if order_data.get('requires_service_action', False) and order_data.get('manual_creation', True):
                logger.info(f"Manual service action requested for order {order_data.get('tracking_number')}")
                return {
                    'action_type': order_data.get('action_type', 'manual'),
                    'priority': order_data.get('priority', 'medium'),
                    'rule_name': 'manual_creation'
                }
            
            # No automatic creation - return None
            logger.info(f"No automatic service action created for order {order_data.get('tracking_number')} - Manual creation required")
            return None
            
        except Exception as e:
            logger.error(f"Error evaluating business rules: {e}")
            return None
    

    
    def _requires_service_action(self, order_data: Dict) -> bool:
        """Determine if order requires service action based on enhanced business rules"""
        state_code = order_data.get('state_code')
        business_type = order_data.get('business_type')
        cod = order_data.get('cod', 0)
        
        # Enhanced business rules for service action creation
        service_action_rules = [
            state_code == 46,  # Returned orders
            business_type in ['return', 'maintenance', 'service', 'exchange'],
            cod < 0,  # Negative COD indicates refund/return
            order_data.get('requires_service_action', False),  # Explicit flag
            order_data.get('service_type') in ['maintenance', 'service', 'return']
        ]
        
        return any(service_action_rules)
    
    def _determine_action_type(self, order_data: Dict) -> str:
        """Determine action type based on enhanced business logic"""
        state_code = order_data.get('state_code')
        business_type = order_data.get('business_type')
        service_type = order_data.get('service_type')
        cod = order_data.get('cod', 0)
        
        # Enhanced action type determination
        if state_code == 46 or business_type == 'return' or cod < 0:
            return 'return_refund'
        elif business_type == 'maintenance' or service_type == 'maintenance':
            return 'maintenance'
        elif business_type == 'service' or service_type == 'service':
            return 'service'
        elif business_type in ['exchange', 'replacement'] or service_type in ['exchange', 'replacement']:
            return 'product_swap'
        elif cod > 500:  # High-value orders might need special handling
            return 'premium_service'
        else:
            return 'general'
    
    def _create_main_service_action(self, conn, order_data: Dict, action_type: str, product_info: Optional[Dict], priority: str = 'medium') -> Optional[int]:
        """Create main service action record with priority"""
        try:
            from app.constants.statuses import ServiceActionStatus
            cursor = conn.execute("""
                INSERT INTO service_actions (
                    customer_phone, tracking_number, action_type, action_status, priority,
                    service_reason, product_name, return_tracking_number,
                    assigned_technician, service_notes, refund_amount, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            """, (
                order_data['receiver_phone'],
                order_data['tracking_number'],
                action_type,
                ServiceActionStatus.REQUESTED,
                priority,
                self._generate_service_reason(order_data, action_type),
                product_info['name'] if product_info else order_data.get('product_name', 'Unknown'),
                order_data.get('return_tracking_number'),
                order_data.get('assigned_technician'),
                order_data.get('service_notes', ''),
                order_data.get('refund_amount', 0)
            ))
            
            return cursor.lastrowid
            
        except Exception as e:
            logger.error(f"Error creating main service action: {e}")
            return None
    
    def _create_service_action_parts(self, conn, action_id: int, parts_list: List[Dict], order_data: Dict):
        """Create service action parts tracking records"""
        try:
            for part in parts_list:
                qty = int(part.get('quantity', 1))
                conn.execute("""
                    INSERT INTO service_action_parts (
                        action_id, sku, quantity, action_type, condition_before, notes, created_at
                    ) VALUES (?, ?, ?, 'used', 'unknown', ?, CURRENT_TIMESTAMP)
                """, (
                    action_id,
                    part['part_sku'],
                    qty,
                    f"Part from product {order_data.get('product_name', 'Unknown')}"
                ))
                
        except Exception as e:
            logger.error(f"Error creating service action parts: {e}")
    
    def _create_hub_confirmation_workflow(self, conn, action_id: int, order_data: Dict):
        """Create hub confirmation workflow entry"""
        try:
            from app.utils.tracking import generate_return_tracking
            return_tracking = order_data.get('return_tracking_number') or generate_return_tracking(order_data.get('tracking_number'))
            
            conn.execute("""
                INSERT INTO hub_confirmation_workflow (
                    action_id, return_tracking_number, confirmation_status,
                    product_condition, quality_score, inspection_notes
                ) VALUES (?, ?, 'pending', 'unknown', 0, ?)
            """, (
                action_id,
                return_tracking,
                f"Awaiting hub confirmation for service action {action_id}"
            ))
            
        except Exception as e:
            logger.error(f"Error creating hub confirmation workflow: {e}")
    
    # =================== PARTS & PRODUCT MANAGEMENT ===================
    
    def _get_product_info(self, conn, product_sku: str) -> Optional[Dict]:
        """Get product information by SKU"""
        if not product_sku:
            return None
            
        try:
            cursor = conn.execute("""
                SELECT product_id, sku, name_ar, name_en, category, brand, model, warranty_period_months
                FROM products WHERE sku = ? AND is_active = 1
            """, (product_sku,))
            
            result = cursor.fetchone()
            if result:
                return {
                    'product_id': result[0],
                    'sku': result[1],
                    'name': result[2] or result[3],  # Use name_ar, fallback to name_en
                    'name_ar': result[2],
                    'name_en': result[3],
                    'category': result[4],
                    'brand': result[5],
                    'model': result[6],
                    'warranty_period': result[7]
                }
            return None
            
        except Exception as e:
            logger.error(f"Error getting product info for SKU {product_sku}: {e}")
            return None
    
    def _get_product_parts(self, conn, product_sku: str) -> List[Dict]:
        """Get all parts for a product"""
        if not product_sku:
            return []
            
        try:
            cursor = conn.execute("""
                SELECT pp.part_id, pp.part_sku, pp.part_name, pp.part_type, 
                       pp.is_replaceable, pp.warranty_period_months
                FROM product_parts pp
                JOIN products p ON pp.product_id = p.product_id
                WHERE p.sku = ? AND pp.is_active = 1
            """, (product_sku,))
            
            return [
                {
                    'part_id': row[0],
                    'part_sku': row[1],
                    'part_name': row[2],
                    'part_type': row[3],
                    'is_replaceable': bool(row[4]),
                    'warranty_period': row[5]
                }
                for row in cursor.fetchall()
            ]
            
        except Exception as e:
            logger.error(f"Error getting product parts for SKU {product_sku}: {e}")
            return []
    
    # =================== STOCK MANAGEMENT ===================
    
    def _update_stock_on_service_action_creation(self, conn, action_id: int, parts_list: List[Dict], action_type: str):
        """Update stock when service action is created"""
        try:
            for part in parts_list:
                if action_type in ['maintenance', 'service', 'product_swap']:
                    # Reserve parts for service action
                    conn.execute("""
                        UPDATE stock 
                        SET reserved_quantity = reserved_quantity + COALESCE(?, 1),
                            available_quantity = available_quantity - COALESCE(?, 1)
                        WHERE sku = ? AND location = 'technician_stock'
                    """, (
                        int(part.get('quantity', 1)),
                        int(part.get('quantity', 1)),
                        part['part_sku']
                    ))
                    
                    # Record stock movement
                    conn.execute("""
                        INSERT INTO stock_movements (
                            sku, location_from, location_to, quantity, movement_type, 
                            reference_id, reference_type, notes, created_at
                        ) VALUES (?, 'main_warehouse', 'technician_stock', 1, 'service', 
                                 ?, 'service_action', ?, CURRENT_TIMESTAMP)
                    """, (
                        part['part_sku'],
                        str(action_id),
                        f"Reserved for service action {action_id}"
                    ))
                    
        except Exception as e:
            logger.error(f"Error updating stock for service action {action_id}: {e}")
    
    def update_stock_on_service_completion(self, conn, action_id: int, parts_actions: List[Dict]) -> Dict:
        """Update stock when service action is completed"""
        try:
            updates = []
            
            for part_action in parts_actions:
                sku = part_action['sku']
                quantity = int(part_action.get('quantity', 1))
                action_type = part_action['action_type']
                
                if action_type in ['swapped', 'replaced']:
                    # Reduce stock for swapped/replaced parts
                    conn.execute("""
                        UPDATE stock 
                        SET quantity = quantity - ?, 
                            reserved_quantity = reserved_quantity - ?,
                            available_quantity = available_quantity
                        WHERE sku = ? AND location = 'technician_stock'
                    """, (quantity, quantity, sku))
                    
                    # Record movement
                    conn.execute("""
                        INSERT INTO stock_movements (
                            sku, location_from, quantity, movement_type, reference_id, reference_type, notes
                        ) VALUES (?, 'technician_stock', ?, 'service', ?, 'service_action', ?)
                    """, (sku, -quantity, str(action_id), f"Used in service action {action_id}"))
                    
                elif action_type == 'returned':
                    # Process returned parts for restocking
                    conn.execute("""
                        UPDATE stock 
                        SET quantity = quantity + ?, 
                            reserved_quantity = reserved_quantity - ?,
                            available_quantity = available_quantity + ?
                        WHERE sku = ? AND location = 'technician_stock'
                    """, (quantity, quantity, quantity, sku))
                    
                    # Record return movement
                    conn.execute("""
                        INSERT INTO stock_movements (
                            sku, location_from, location_to, quantity, movement_type, reference_id, reference_type, notes
                        ) VALUES (?, 'technician_stock', 'main_warehouse', ?, 'return', ?, 'service_action', ?)
                    """, (sku, quantity, str(action_id), f"Returned from service action {action_id}"))
                
                updates.append({
                    'sku': sku,
                    'action_type': action_type,
                    'quantity': quantity
                })
            
            return {
                'success': True,
                'updates': updates,
                'total_parts_processed': len(updates)
            }
            
        except Exception as e:
            logger.error(f"Error updating stock on service completion: {e}")
            return {'success': False, 'error': str(e)}

    def process_full_product_swap(self, conn, action_id: int, old_products: List[Dict[str, Any]], new_products: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Process full product swap: decrement new products from main warehouse, increment returned old products.

        Records stock movements and order line items, and logs replacement entries.
        """
        try:
            if not new_products:
                return {'success': False, 'error': 'No new products provided for full swap'}

            # Fetch context from service action
            cursor = conn.execute(
                """
                SELECT customer_phone, tracking_number FROM service_actions WHERE action_id = ?
                """,
                (action_id,)
            )
            row = cursor.fetchone()
            if not row:
                return {'success': False, 'error': 'Service action not found'}

            customer_phone, order_id = row[0], row[1]

            stock_location = 'المستودع الرئيسي'  # Main warehouse for finished goods

            # Issue new replacement products to the customer
            for item in new_products:
                sku = item.get('sku') or item.get('product_sku')
                if not sku:
                    return {'success': False, 'error': 'New product item missing sku'}
                qty = int(item.get('quantity', 1))

                # Decrement stock
                conn.execute(
                    """
                    UPDATE stock
                    SET quantity = quantity - ?,
                        available_quantity = CASE WHEN available_quantity >= ? THEN available_quantity - ? ELSE available_quantity END,
                        last_updated = CURRENT_TIMESTAMP
                    WHERE sku = ? AND location = ?
                    """,
                    (qty, qty, qty, sku, stock_location)
                )

                # Movement record (issue)
                conn.execute(
                    """
                    INSERT INTO stock_movements (
                        sku, location_from, location_to, quantity, movement_type, reference_id, reference_type, notes
                    ) VALUES (?, ?, 'customer', ?, 'service', ?, 'service_action', ?)
                    """,
                    (sku, stock_location, qty, str(action_id), f'Full swap - issued replacement for order {order_id}')
                )

                # Record order line as replacement
                conn.execute(
                    """
                    INSERT INTO order_line_items (order_id, sku, quantity, unit_price, line_type, status, notes)
                    VALUES (?, ?, ?, NULL, 'replacement', 'active', ?)
                    """,
                    (order_id, sku, qty, f'Replacement issued by service action {action_id}')
                )

            # Receive returned old products
            for item in old_products or []:
                sku = item.get('sku') or item.get('product_sku')
                if not sku:
                    # Skip if not provided; UI might not always supply
                    continue
                qty = int(item.get('quantity', 1))

                # Increment stock back to main warehouse
                conn.execute(
                    """
                    UPDATE stock
                    SET quantity = quantity + ?,
                        available_quantity = available_quantity + ?,
                        last_updated = CURRENT_TIMESTAMP
                    WHERE sku = ? AND location = ?
                    """,
                    (qty, qty, sku, stock_location)
                )

                # Movement record (return)
                conn.execute(
                    """
                    INSERT INTO stock_movements (
                        sku, location_from, location_to, quantity, movement_type, reference_id, reference_type, notes
                    ) VALUES (?, 'customer', ?, ?, 'return', ?, 'service_action', ?)
                    """,
                    (sku, stock_location, qty, str(action_id), f'Returned old product from order {order_id}')
                )

                # Record order line as return
                conn.execute(
                    """
                    INSERT INTO order_line_items (order_id, sku, quantity, unit_price, line_type, status, notes)
                    VALUES (?, ?, ?, NULL, 'return', 'replaced', ?)
                    """,
                    (order_id, sku, qty, f'Returned by service action {action_id}')
                )

            # Optional: log replacements table for audit (per new product)
            for item in new_products:
                new_sku = item.get('sku') or item.get('product_sku')
                conn.execute(
                    """
                    INSERT INTO replacements (
                        customer_phone, order_id, replacement_type, original_product_sku, replacement_product_sku,
                        replacement_reason, replacement_status, customer_approval, created_at
                    ) VALUES (?, ?, 'full', ?, ?, 'Full product swap', 'completed', 1, CURRENT_TIMESTAMP)
                    """,
                    (
                        customer_phone,
                        order_id,
                        (old_products or [{}])[0].get('sku') or (old_products or [{}])[0].get('product_sku'),
                        new_sku
                    )
                )

            return {
                'success': True,
                'issued_products': len(new_products),
                'returned_products': len(old_products or [])
            }
        except Exception as e:
            logger.error(f"Error processing full product swap for action {action_id}: {e}")
            return {'success': False, 'error': str(e)}
    
    # =================== EVENT-DRIVEN STATUS TRANSITIONS ===================
    
    def update_service_action_status(self, conn, action_id: int, new_status: str, **kwargs) -> Dict[str, Any]:
        """Event-driven status transition for service actions"""
        try:
            # Get current action
            cursor = conn.execute("""
                SELECT action_id, action_status, action_type, customer_phone, tracking_number
                FROM service_actions WHERE action_id = ?
            """, (action_id,))
            
            current_action = cursor.fetchone()
            if not current_action:
                return {'success': False, 'error': 'Service action not found'}
            
            current_status = current_action[1]
            
            # Validate status transition
            if not self._is_valid_status_transition(current_status, new_status):
                return {'success': False, 'error': f'Invalid status transition from {current_status} to {new_status}'}
            
            # Update main status
            update_fields = {'action_status': new_status, 'updated_at': 'CURRENT_TIMESTAMP'}
            
            # Handle status-specific updates
            from app.constants.statuses import ServiceActionStatus
            if new_status == ServiceActionStatus.IN_PROGRESS:
                update_fields['assigned_technician'] = kwargs.get('technician')
                update_fields['service_notes'] = kwargs.get('notes', '')
            
            elif new_status == ServiceActionStatus.COMPLETED:
                update_fields['completed_at'] = 'CURRENT_TIMESTAMP'
                update_fields['refund_amount'] = kwargs.get('refund_amount', 0)
                
                # Update stock if parts were used
                parts_actions = kwargs.get('parts_actions', [])
                if parts_actions:
                    self.update_stock_on_service_completion(conn, action_id, parts_actions)
            
            # Build and execute update query
            set_clause = ', '.join([f"{field} = ?" for field in update_fields.keys() if field != 'updated_at'])
            set_clause += ', updated_at = CURRENT_TIMESTAMP'
            
            values = [value for field, value in update_fields.items() if field != 'updated_at']
            values.append(action_id)
            
            conn.execute(f"""
                UPDATE service_actions 
                SET {set_clause}
                WHERE action_id = ?
            """, values)
            
            # Trigger downstream events
            self._trigger_status_change_events(conn, action_id, current_status, new_status, **kwargs)
            
            return {
                'success': True,
                'action_id': action_id,
                'old_status': current_status,
                'new_status': new_status,
                'message': f'Service action {action_id} status updated to {new_status}'
            }
            
        except Exception as e:
            logger.error(f"Error updating service action status: {e}")
            return {'success': False, 'error': str(e)}
    
    def _is_valid_status_transition(self, current: str, new: str) -> bool:
        """Validate service action status transitions"""
        from app.constants.statuses import ServiceActionStatus
        valid_transitions = {
            ServiceActionStatus.REQUESTED: [ServiceActionStatus.IN_PROGRESS, ServiceActionStatus.CANCELLED],
            ServiceActionStatus.IN_PROGRESS: [ServiceActionStatus.HUB_CONFIRMED, ServiceActionStatus.COMPLETED, ServiceActionStatus.CANCELLED],
            ServiceActionStatus.HUB_CONFIRMED: [ServiceActionStatus.COMPLETED, ServiceActionStatus.REJECTED],
            ServiceActionStatus.COMPLETED: [ServiceActionStatus.CLOSED],
            ServiceActionStatus.REJECTED: [ServiceActionStatus.IN_PROGRESS, ServiceActionStatus.CANCELLED],
            ServiceActionStatus.CANCELLED: [],
            ServiceActionStatus.CLOSED: []
        }
        
        return new in valid_transitions.get(current, [])
    
    def _trigger_status_change_events(self, conn, action_id: int, old_status: str, new_status: str, **kwargs):
        """Trigger events when service action status changes"""
        try:
            # Handle specific status transitions
            if new_status == 'hub_confirmed':
                # Update hub confirmation workflow
                conn.execute("""
                    UPDATE hub_confirmation_workflow 
                    SET confirmation_status = 'confirmed', confirmed_at = CURRENT_TIMESTAMP
                    WHERE action_id = ?
                """, (action_id,))
            
        except Exception as e:
            logger.error(f"Error triggering status change events: {e}")
    

    
    # =================== UTILITY METHODS ===================
    
    def _generate_service_reason(self, order_data: Dict, action_type: str) -> str:
        """Generate service reason based on order data and action type"""
        state_code = order_data.get('state_code')
        business_type = order_data.get('business_type')
        service_type = order_data.get('service_type')
        
        reasons = {
            'return_refund': f"Return/refund request from order state {state_code}",
            'maintenance': f"Maintenance required for {business_type or service_type} order",
            'service': f"Service request for {business_type or service_type} order",
            'product_swap': f"Product swap request ({business_type or service_type})",
            'premium_service': f"Premium service for high-value order"
        }
        
        return reasons.get(action_type, f"Auto-detected service action from order state {state_code}")
    
    def _generate_return_tracking(self, order_data: Dict) -> str:
        from app.utils.tracking import generate_return_tracking
        return generate_return_tracking(order_data.get('tracking_number'))
    
    def _normalize_return_tracking(self, tracking_number: str) -> str:
        from app.utils.tracking import normalize_return_tracking
        return normalize_return_tracking(tracking_number)
    
    # =================== SERVICE ACTION QUERIES ===================
    
    def get_service_actions(self, filters: Dict = None, page: int = 1, limit: int = 50) -> Dict[str, Any]:
        """Get service actions with filtering and pagination"""
        try:
            with get_db() as conn:
                # Build WHERE clause
                where_conditions = []
                params = []
                
                if filters:
                    if filters.get('customer_phone'):
                        where_conditions.append("customer_phone = ?")
                        params.append(filters['customer_phone'])
                    
                    if filters.get('action_status'):
                        where_conditions.append("action_status = ?")
                        params.append(filters['action_status'])
                    
                    if filters.get('action_type'):
                        where_conditions.append("action_type = ?")
                        params.append(filters['action_type'])
                
                where_clause = "WHERE " + " AND ".join(where_conditions) if where_conditions else ""
                
                # Get total count
                cursor = conn.execute(f"""
                    SELECT COUNT(*) FROM service_actions {where_clause}
                """, params)
                total_count = cursor.fetchone()[0]
                
                # Get paginated results
                offset = (page - 1) * limit
                cursor = conn.execute(f"""
                    SELECT * FROM service_actions {where_clause}
                    ORDER BY created_at DESC LIMIT ? OFFSET ?
                """, params + [limit, offset])
                
                actions = [dict(zip([col[0] for col in cursor.description], row)) 
                          for row in cursor.fetchall()]
                
                return {
                    'success': True,
                    'actions': actions,
                    'pagination': {
                        'page': page,
                        'limit': limit,
                        'total': total_count,
                        'pages': (total_count + limit - 1) // limit
                    }
                }
                
        except Exception as e:
            logger.error(f"Error getting service actions: {e}")
            return {'success': False, 'error': str(e)}
    
    def get_service_action_with_details(self, action_id: int) -> Dict[str, Any]:
        """Get complete service action details including parts and workflow"""
        try:
            with get_db() as conn:
                # Get main action
                cursor = conn.execute("""
                    SELECT * FROM service_actions WHERE action_id = ?
                """, (action_id,))
                
                action = cursor.fetchone()
                if not action:
                    return {'success': False, 'error': 'Service action not found'}
                
                action_dict = dict(zip([col[0] for col in cursor.description], action))
                
                # Get parts
                cursor = conn.execute("""
                    SELECT * FROM service_action_parts WHERE action_id = ?
                """, (action_id,))
                parts = [dict(zip([col[0] for col in cursor.description], row)) 
                        for row in cursor.fetchall()]
                
                # Get hub confirmation
                cursor = conn.execute("""
                    SELECT * FROM hub_confirmation_workflow WHERE action_id = ?
                """, (action_id,))
                hub_confirmation = cursor.fetchone()
                if hub_confirmation:
                    hub_confirmation = dict(zip([col[0] for col in cursor.description], hub_confirmation))
                
                return {
                    'success': True,
                    'action': action_dict,
                    'parts': parts,
                    'hub_confirmation': hub_confirmation
                }
                
        except Exception as e:
            logger.error(f"Error getting service action details: {e}")
            return {'success': False, 'error': str(e)}


# Global instance
service_action_manager = ServiceActionManager() 