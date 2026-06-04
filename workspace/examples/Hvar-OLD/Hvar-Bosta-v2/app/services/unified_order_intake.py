"""
Unified Order Intake Pipeline for HVAR Complete Cycle System
Handles all order types (normal, pending, return) with integrated product/parts management,
stock updates, and analytics according to HVAR_COMPLETE_CYCLE_SYSTEM.md requirements.

This module replaces the separate order processing functions with a single, unified pipeline.
"""

import json
import logging
import os
from datetime import datetime
from typing import Dict, List, Optional, Any, Tuple
from concurrent.futures import ThreadPoolExecutor, as_completed
from threading import Lock
import pytz

from app.utils.db_utils import get_db
from app.services.bosta_api import search_orders, get_order_details
from app.models.product_management import ProductManagement
from app.utils.phone_utils import clean_phone
from app.models.customer_management import CustomerManager
from app.services.customer_profile_manager import customer_profile_manager
from app.services.service_action_manager import service_action_manager

# Setup logging
logger = logging.getLogger(__name__)

# Egypt timezone for consistent timestamps
EGYPT_TZ = pytz.timezone('Africa/Cairo')

class UnifiedOrderIntake:
    """
    Unified Order Intake Pipeline for Complete Cycle Management
    
    Implements the modular design from HVAR_COMPLETE_CYCLE_SYSTEM.md:
    - Single pipeline for all order types
    - Product/parts association
    - Stock management integration  
    - Analytics integration
    - Downstream trigger hooks
    """
    
    def __init__(self):
        self.is_running = False
        self.sync_lock = Lock()
        self.product_manager = ProductManagement()
        # Feature toggle: disable automatic product linking by default
        self.auto_link_products = os.environ.get('AUTO_LINK_PRODUCTS', 'false').lower() == 'true'
        
    def fetch_orders_unified(self, order_type: str = "all", page: int = 1, limit: int = 100) -> Dict[str, Any]:
        """
        Unified order fetching from Bosta API for all order types
        
        Args:
            order_type: Type of orders to fetch ("normal", "pending", "all")
            page: Page number for pagination
            limit: Items per page
            
        Returns:
            Unified response with orders and metadata
        """
        try:
            if order_type == "all":
                # Fetch all orders (pending orders now integrated into main orders table)
                result = search_orders(page=page, limit=limit, order_type="all")
                
                if not result.get('success'):
                    return {'success': False, 'error': 'Failed to fetch orders from Bosta API'}
                
                # Return unified result
                all_orders = result.get('orders', [])
                total_count = result.get('totalCount', 0)
                
                return {
                    'success': True,
                    'orders': all_orders,
                    'totalCount': total_count,
                    'page': page,
                    'limit': limit,
                    'order_type': order_type
                }
            else:
                # Fetch specific order type
                return search_orders(page=page, limit=limit, order_type=order_type)
                
        except Exception as e:
            logger.error(f"Error fetching orders: {e}")
            return {'success': False, 'error': str(e)}
    
    def normalize_order_data(self, raw_order: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Normalize order data from Bosta API to unified internal format
        Maps all fields to the authoritative schema from HVAR_COMPLETE_CYCLE_SYSTEM.md
        
        Args:
            raw_order: Raw order data from Bosta API
            
        Returns:
            Normalized order data matching authoritative schema
        """
        try:
            if not raw_order or not isinstance(raw_order, dict):
                logger.error("Invalid raw order data")
                return None
            
            # Get detailed order data if only basic info provided
            # Handle both API format (trackingNumber) and database format (tracking_number)
            tracking_number = raw_order.get('trackingNumber') or raw_order.get('tracking_number')
            if not tracking_number:
                logger.error("Missing tracking number in order data")
                return None
            
            # If this is summary data, fetch full details
            if 'state' not in raw_order or not isinstance(raw_order.get('state'), dict):
                details_result = get_order_details(tracking_number)
                if details_result.get('success'):
                    raw_order = details_result.get('order', raw_order)
            
            # Extract and normalize all fields according to authoritative schema
            normalized = self._extract_core_fields(raw_order)
            normalized.update(self._extract_customer_fields(raw_order))
            normalized.update(self._extract_product_fields(raw_order))
            normalized.update(self._extract_geographic_fields(raw_order))
            normalized.update(self._extract_timeline_fields(raw_order))
            normalized.update(self._extract_financial_fields(raw_order))
            normalized.update(self._extract_delivery_fields(raw_order))
            normalized.update(self._extract_sla_fields(raw_order))
            normalized.update(self._extract_system_fields(raw_order))
            
            # Add business classification
            normalized.update(self._classify_order_business_type(normalized))
            
            return normalized
            
        except Exception as e:
            logger.error(f"Error normalizing order data for {tracking_number}: {e}")
            return None
    
    def _extract_core_fields(self, raw_order: Dict) -> Dict[str, Any]:
        """Extract core order identification and status fields"""
        # Handle both API format (trackingNumber) and database format (tracking_number)
        tracking_number = raw_order.get('trackingNumber') or raw_order.get('tracking_number')
        order_id = raw_order.get('_id', tracking_number)
        
        # State information
        state = self._safe_get_dict(raw_order, 'state')
        state_code = state.get('code')
        state_value = state.get('value')
        masked_state = raw_order.get('maskedState') or state_value or ''
        
        # Order type information
        order_type = self._safe_get_dict(raw_order, 'type')
        order_type_code = order_type.get('code')
        order_type_value = order_type.get('value')
        
        return {
            'id': order_id,
            'tracking_number': tracking_number,
            'state_code': state_code,
            'state_value': state_value,
            'masked_state': masked_state,
            'order_type_code': order_type_code,
            'order_type_value': order_type_value,
            'is_confirmed_delivery': bool(raw_order.get('isConfirmedDelivery', False)),
            'allow_open_package': bool(raw_order.get('allowToOpenPackage', False))
        }
    
    def _extract_customer_fields(self, raw_order: Dict) -> Dict[str, Any]:
        """Extract customer information fields"""
        receiver = self._safe_get_dict(raw_order, 'receiver')
        
        return {
            'receiver_phone': clean_phone(receiver.get('phone', '')),
            'receiver_name': receiver.get('name', ''),
            'receiver_first_name': receiver.get('firstName', ''),
            'receiver_last_name': receiver.get('lastName', ''),
            'receiver_second_phone': clean_phone(receiver.get('secondPhone', ''))
        }
    
    def _extract_product_fields(self, raw_order: Dict) -> Dict[str, Any]:
        """Extract product information and specifications"""
        specs = self._safe_get_dict(raw_order, 'specs')
        
        return {
            'notes': raw_order.get('notes', ''),
            'specs_items_count': specs.get('itemsCount', 1),
            'specs_description': specs.get('description', ''),
            'product_name': specs.get('description', ''),
            'product_count': specs.get('itemsCount', 1)
        }
    
    def _extract_geographic_fields(self, raw_order: Dict) -> Dict[str, Any]:
        """Extract geographic and address information"""
        dropoff = self._safe_get_dict(raw_order, 'dropOffAddress')
        pickup = self._safe_get_dict(raw_order, 'pickupAddress')
        
        # Dropoff address components
        dropoff_city = self._safe_get_dict(dropoff, 'city')
        dropoff_zone = self._safe_get_dict(dropoff, 'zone')
        dropoff_district = self._safe_get_dict(dropoff, 'district')
        
        # Pickup address components
        pickup_city = self._safe_get_dict(pickup, 'city')
        pickup_zone = self._safe_get_dict(pickup, 'zone')
        pickup_district = self._safe_get_dict(pickup, 'district')
        
        return {
            # Dropoff address
            'dropoff_city_name': dropoff_city.get('name', ''),
            'dropoff_city_name_ar': dropoff_city.get('nameAr', ''),
            'dropoff_zone_name': dropoff_zone.get('name', ''),
            'dropoff_zone_name_ar': dropoff_zone.get('nameAr', ''),
            'dropoff_district_name': dropoff_district.get('name', ''),
            'dropoff_district_name_ar': dropoff_district.get('nameAr', ''),
            'dropoff_first_line': dropoff.get('firstLine', ''),
            
            # Pickup address
            'pickup_city': pickup_city.get('name', ''),
            'pickup_zone': pickup_zone.get('name', ''),
            'pickup_district': pickup_district.get('name', ''),
            'pickup_address': pickup.get('firstLine', '')
        }
    
    def _extract_timeline_fields(self, raw_order: Dict) -> Dict[str, Any]:
        """Extract timeline and date information"""
        timeline = raw_order.get('timeline', [])
        timeline_json = json.dumps(timeline) if timeline else None
        
        # Extract key dates from timeline
        dates = self._extract_timeline_dates(timeline)
        
        # Creation timestamp
        creation_timestamp = raw_order.get('creationTimestamp')
        created_at = self._convert_timestamp_to_egypt_time(creation_timestamp)
        
        return {
            'timeline_json': timeline_json,
            'created_at': created_at.isoformat() if created_at else None,
            'scheduled_at': dates.get('scheduled_at'),
            'picked_up_at': dates.get('picked_up_at'),
            'received_at_warehouse': dates.get('received_at_warehouse'),
            'delivered_at': dates.get('delivered_at'),
            'returned_at': dates.get('returned_at'),
            'latest_awb_print_date': dates.get('latest_awb_print_date'),
            'last_call_time': dates.get('last_call_time')
        }
    
    def _extract_financial_fields(self, raw_order: Dict) -> Dict[str, Any]:
        """Extract financial and payment information"""
        wallet = self._safe_get_dict(raw_order, 'wallet')
        cash_cycle = self._safe_get_dict(wallet, 'cashCycle')
        
        return {
            'cod': float(cash_cycle.get('amountToCollect', 0)),
            'bosta_fees': float(cash_cycle.get('bostaFees', 0)),
            'deposited_amount': float(cash_cycle.get('depositedAmount', 0))
        }
    
    def _extract_delivery_fields(self, raw_order: Dict) -> Dict[str, Any]:
        """Extract delivery information and metrics"""
        dropoff = self._safe_get_dict(raw_order, 'dropOffAddress')
        star = self._safe_get_dict(raw_order, 'star')
        
        return {
            'delivery_lat': float(dropoff.get('lat', 0)) if dropoff.get('lat') else None,
            'delivery_lng': float(dropoff.get('lng', 0)) if dropoff.get('lng') else None,
            'star_name': star.get('name', ''),
            'star_phone': clean_phone(star.get('phone', '')),
            'delivery_time_hours': self._calculate_delivery_time(raw_order),
            'attempts_count': int(raw_order.get('attemptsCount', 0)),
            'calls_count': int(raw_order.get('callsCount', 0))
        }
    
    def _extract_sla_fields(self, raw_order: Dict) -> Dict[str, Any]:
        """Extract SLA and performance information"""
        order_sla = self._safe_get_dict(raw_order, 'orderSLA')
        e2e_sla = self._safe_get_dict(raw_order, 'e2eSLA')
        
        return {
            'order_sla_timestamp': order_sla.get('timestamp'),
            'order_sla_exceeded': bool(order_sla.get('exceeded', False)),
            'e2e_sla_timestamp': e2e_sla.get('timestamp'),
            'e2e_sla_exceeded': bool(e2e_sla.get('exceeded', False))
        }
    
    def _extract_system_fields(self, raw_order: Dict) -> Dict[str, Any]:
        """Extract system and metadata fields"""
        now = datetime.now(EGYPT_TZ)
        
        return {
            'last_synced': now.isoformat(),
            'created_by_system': now.isoformat()
        }
    
    def _classify_order_business_type(self, normalized_order: Dict) -> Dict[str, Any]:
        """
        Classify order using centralized classification service
        """
        from app.services.order_classification import order_classifier
        from app.services.order_classification import OrderClassificationService
        classifier = OrderClassificationService()
        return classifier.classify_order_comprehensive(normalized_order)
    
    def associate_products_and_parts(self, normalized_order: Dict) -> Dict[str, Any]:
        """
        Associate order with products and parts from product management system
        
        Args:
            normalized_order: Normalized order data
            
        Returns:
            Dictionary with product and parts information
        """
        try:
            # Respect feature toggle: skip auto association when disabled
            if not self.auto_link_products:
                return {
                    'product_info': None,
                    'parts_list': [],
                    'requires_parts_tracking': False,
                    'estimated_sku': None
                }
            product_name = normalized_order.get('product_name', '')
            specs_description = normalized_order.get('specs_description', '')
            
            # Try to find product by name or description
            product_info = None
            parts_list = []
            
            if product_name:
                # Search in product management system
                search_result = self.product_manager.search_products(query=product_name)
                if search_result.get('success') and search_result.get('products'):
                    product_info = search_result['products'][0]
                    
                    # Get parts for this product
                    parts_result = self.product_manager.get_product_parts(product_info['product_id'])
                    if parts_result.get('success'):
                        parts_list = parts_result.get('parts', [])
            
            return {
                'product_info': product_info,
                'parts_list': parts_list,
                'requires_parts_tracking': len(parts_list) > 0,
                'estimated_sku': self._generate_sku_from_description(product_name, specs_description)
            }
            
        except Exception as e:
            logger.error(f"Error associating products for order {normalized_order.get('tracking_number')}: {e}")
            return {
                'product_info': None,
                'parts_list': [],
                'requires_parts_tracking': False,
                'estimated_sku': None
            }
    
    def create_order_line_items(self, conn, order_data: Dict) -> List[Dict]:
        """
        Create order line items for detailed product/parts tracking
        
        Args:
            conn: Database connection
            order_data: Complete order data with product associations
            
        Returns:
            List of created line items
        """
        try:
            line_items = []
            order_id = order_data['id']
            
            # If auto linking is disabled, rely only on explicit items provided by caller
            if not self.auto_link_products and order_data.get('items'):
                for it in order_data.get('items', []):
                    sku = it.get('sku')
                    if not sku:
                        continue
                    quantity = int(it.get('quantity', 1))
                    unit_price = float(it.get('unit_price', 0))
                    line_type = it.get('line_type', 'main')
                    notes = it.get('notes', '')
                    cursor = conn.execute(
                        """
                        INSERT INTO order_line_items (order_id, sku, quantity, unit_price, line_type, status, notes)
                        VALUES (?, ?, ?, ?, ?, 'active', ?)
                        """,
                        (order_id, sku, quantity, unit_price, line_type, notes)
                    )
                    line_items.append({
                        'order_line_id': cursor.lastrowid,
                        'order_id': order_id,
                        'sku': sku,
                        'quantity': quantity,
                        'unit_price': unit_price,
                        'line_type': line_type,
                        'status': 'active',
                        'notes': notes
                    })

                return line_items

            # Auto-linking path (enabled only when toggle is on)
            # Main product line item
            if self.auto_link_products and order_data.get('estimated_sku'):
                main_item = {
                    'order_id': order_id,
                    'sku': order_data['estimated_sku'],
                    'quantity': order_data.get('product_count', 1),
                    'unit_price': order_data.get('cod', 0),
                    'line_type': 'main',
                    'status': 'active',
                    'notes': f"Main product: {order_data.get('product_name', '')}"
                }
                
                cursor = conn.execute("""
                    INSERT INTO order_line_items (order_id, sku, quantity, unit_price, line_type, status, notes)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    main_item['order_id'], main_item['sku'], main_item['quantity'],
                    main_item['unit_price'], main_item['line_type'], main_item['status'], main_item['notes']
                ))
                
                main_item['order_line_id'] = cursor.lastrowid
                line_items.append(main_item)
            
            # Parts line items (auto link only)
            for part in (order_data.get('parts_list', []) if self.auto_link_products else []):
                part_item = {
                    'order_id': order_id,
                    'sku': part.get('part_sku', ''),
                    'quantity': 1,
                    'unit_price': 0,  # Parts usually don't have separate pricing
                    'line_type': 'part',
                    'status': 'active',
                    'notes': f"Part: {part.get('part_name', '')}"
                }
                
                if part_item['sku']:
                    cursor = conn.execute("""
                        INSERT INTO order_line_items (order_id, sku, quantity, unit_price, line_type, status, notes)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, (
                        part_item['order_id'], part_item['sku'], part_item['quantity'],
                        part_item['unit_price'], part_item['line_type'], part_item['status'], part_item['notes']
                    ))
                    
                    part_item['order_line_id'] = cursor.lastrowid
                    line_items.append(part_item)
            
            return line_items
            
        except Exception as e:
            logger.error(f"Error creating order line items for {order_data.get('tracking_number')}: {e}")
            return []
    
    def update_stock_levels(self, conn, line_items: List[Dict], order_data: Dict) -> Dict[str, Any]:
        """
        Update stock levels based on order line items
        
        Args:
            conn: Database connection
            line_items: Order line items
            order_data: Order data for context
            
        Returns:
            Stock update results
        """
        try:
            stock_updates = []
            
            for item in line_items:
                sku = item['sku']
                quantity = item['quantity']
                line_type = item['line_type']
                
                # Determine stock movement direction
                if line_type in ['main', 'part'] and order_data.get('business_type') != 'return':
                    # Outgoing stock for sales/service orders
                    movement_qty = -quantity
                    movement_type = 'order'
                elif order_data.get('business_type') == 'return':
                    # Incoming stock for return orders
                    movement_qty = quantity
                    movement_type = 'return'
                else:
                    continue  # Skip items that don't affect stock
                
                # Update stock table
                cursor = conn.execute("""
                    SELECT stock_id, quantity, available_quantity 
                    FROM stock 
                    WHERE sku = ? AND location = 'main_warehouse'
                """, (sku,))
                
                stock_record = cursor.fetchone()
                
                if stock_record:
                    # Update existing stock record
                    new_qty = max(0, stock_record[1] + movement_qty)
                    new_available = max(0, stock_record[2] + movement_qty)
                    
                    conn.execute("""
                        UPDATE stock 
                        SET quantity = ?, available_quantity = ?, last_updated = CURRENT_TIMESTAMP
                        WHERE stock_id = ?
                    """, (new_qty, new_available, stock_record[0]))
                    
                else:
                    # Create new stock record for returns
                    if movement_qty > 0:
                        new_qty = movement_qty
                        new_available = movement_qty
                        
                        conn.execute("""
                            INSERT INTO stock (sku, location, quantity, available_quantity)
                            VALUES (?, 'main_warehouse', ?, ?)
                        """, (sku, new_qty, new_available))
                
                # Record stock movement
                conn.execute("""
                    INSERT INTO stock_movements (
                        sku, location_from, location_to, quantity, movement_type, 
                        reference_id, reference_type, notes
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    sku,
                    'main_warehouse' if movement_qty < 0 else None,
                    'main_warehouse' if movement_qty > 0 else None,
                    abs(movement_qty),
                    movement_type,
                    order_data['id'],
                    'order',
                    f"Order {order_data['tracking_number']} - {line_type}"
                ))
                
                stock_updates.append({
                    'sku': sku,
                    'quantity_change': movement_qty,
                    'movement_type': movement_type
                })
            
            return {'success': True, 'updates': stock_updates}
            
        except Exception as e:
            logger.error(f"Error updating stock levels for order {order_data.get('tracking_number')}: {e}")
            return {'success': False, 'error': str(e)}
    
    def detect_and_link_hierarchy(self, conn, order_data: Dict) -> Dict[str, Any]:
        """
        Detect and link order hierarchy using centralized classification service
        
        Args:
            conn: Database connection
            order_data: Order data
            
        Returns:
            Hierarchy detection results
        """
        from app.services.order_classification import order_classifier
        return order_classifier.detect_and_link_hierarchy(conn, order_data)
    
    def create_service_action(self, conn, order_data: Dict) -> Optional[int]:
        """
        Create service action - MANUAL CREATION ONLY
        
        Args:
            conn: Database connection
            order_data: Complete order data
            
        Returns:
            Created service action ID or None (only for explicit manual requests)
        """
        try:
            # DISABLED: Automatic service action creation
            # Service actions must be created manually through the UI
            
            # Only create if explicitly requested with manual flag
            if not order_data.get('requires_service_action', False) or not order_data.get('manual_creation', True):
                logger.info(f"No automatic service action created for order {order_data.get('tracking_number')} - Manual creation required")
                return None
            
            # Enhanced service action creation for manual requests only
            action_id = service_action_manager.create_service_action_with_parts(conn, order_data)
            
            if action_id:
                logger.info(f"✅ Manual service action {action_id} created for order {order_data.get('tracking_number')}")
                
                # Process manual service action (no automatic processing)
                self._process_manual_service_action(conn, action_id, order_data)
            
            return action_id
            
        except Exception as e:
            logger.error(f"❌ Error creating manual service action for order {order_data.get('tracking_number')}: {e}")
            return None
    
    def _process_manual_service_action(self, conn, action_id: int, order_data: Dict):
        """Process manual service action - No automatic processing"""
        try:
            # Manual service actions only - no automatic processing
            logger.info(f"Manual service action {action_id} processed for order {order_data.get('tracking_number')}")
            
            # Only process if explicitly requested
            if order_data.get('manual_processing', True):
                # Handle high-priority manual service actions
                if order_data.get('cod', 0) > 1000 or order_data.get('priority') == 'urgent':
                    self._handle_high_priority_service_action(conn, action_id, order_data)
                
                # Log manual processing
                logger.info(f"Manual service action {action_id} processing completed")
                
        except Exception as e:
            logger.error(f"Error processing manual service action {action_id}: {e}")
    
    def _create_return_order_tracking(self, conn, action_id: int, order_data: Dict) -> Optional[str]:
        """Create return order tracking number for service actions"""
        try:
            # Generate return tracking number
            from app.utils.tracking import generate_return_tracking
            base_tracking = order_data.get('tracking_number', 'UNKNOWN')
            return_tracking = generate_return_tracking(base_tracking)
            
            # Here you would integrate with Bosta API to create actual return order
            # For now, we'll just create the tracking reference
            
            logger.info(f"Return tracking {return_tracking} created for service action {action_id}")
            return return_tracking
            
        except Exception as e:
            logger.error(f"Error creating return order tracking: {e}")
            return None
    
    def _handle_high_priority_service_action(self, conn, action_id: int, order_data: Dict):
        """Handle special processing for high-priority service actions"""
        try:
            # Update priority if not already set
            conn.execute("""
                UPDATE service_actions 
                SET priority = 'high'
                WHERE action_id = ? AND priority != 'urgent'
            """, (action_id,))
            
            # Additional high-priority processing can be added here
            logger.info(f"High-priority processing completed for service action {action_id}")
            
        except Exception as e:
            logger.error(f"Error handling high-priority service action {action_id}: {e}")
    
    def update_analytics_realtime(self, conn, order_data: Dict, processing_results: Dict) -> Dict[str, Any]:
        """
        Update real-time analytics based on processed order
        
        Args:
            conn: Database connection
            order_data: Order data
            processing_results: Results from order processing
            
        Returns:
            Analytics update results
        """
        try:
            # Basic order metrics
            business_type = order_data.get('business_type')
            cod_value = order_data.get('cod', 0)
            
            # Update or insert analytics record
            cursor = conn.execute("""
                INSERT OR IGNORE INTO order_analytics (
                    date, total_orders, total_cod, business_type_stats, 
                    service_actions_created, hierarchy_links_created,
                    products_processed, parts_tracked, last_updated
                ) VALUES (date('now'), 0, 0, '{}', 0, 0, 0, 0, CURRENT_TIMESTAMP)
            """)
            
            # Update counters
            conn.execute("""
                UPDATE order_analytics 
                SET 
                    total_orders = total_orders + 1,
                    total_cod = total_cod + ?,
                    service_actions_created = service_actions_created + ?,
                    hierarchy_links_created = hierarchy_links_created + ?,
                    products_processed = products_processed + ?,
                    parts_tracked = parts_tracked + ?,
                    last_updated = CURRENT_TIMESTAMP
                WHERE date = date('now')
            """, (
                cod_value,
                1 if processing_results.get('service_action_created') else 0,
                processing_results.get('hierarchy_links_created', 0),
                1 if order_data.get('product_info') else 0,
                len(order_data.get('parts_list', []))
            ))
            
            return {'success': True, 'analytics_updated': True}
            
        except Exception as e:
            logger.error(f"Error updating analytics for order {order_data.get('tracking_number')}: {e}")
            return {'success': False, 'error': str(e)}
    
    def save_order_unified(self, conn, order_data: Dict) -> bool:
        """
        Save order to database using unified schema
        
        Args:
            conn: Database connection
            order_data: Complete normalized order data
            
        Returns:
            Success status
        """
        try:
            # Check which columns exist in the orders table
            cursor = conn.execute("PRAGMA table_info(orders)")
            existing_columns = {row[1] for row in cursor.fetchall()}
            
            # Filter order data to include only existing columns
            filtered_order = {k: v for k, v in order_data.items() if k in existing_columns}
            
            if not filtered_order:
                logger.error("No valid columns found for order data")
                return False
            
            # Prepare SQL for INSERT OR REPLACE
            columns = list(filtered_order.keys())
            placeholders = ','.join(['?'] * len(columns))
            sql = f"INSERT OR REPLACE INTO orders ({','.join(columns)}) VALUES ({placeholders})"
            
            # Execute insert
            conn.execute(sql, list(filtered_order.values()))

            # Mark the order as processed
            conn.execute(
                "UPDATE orders SET is_processed = 1 WHERE id = ?",
                (order_data['id'],)
            )
            
            return True
            
        except Exception as e:
            logger.error(f"Error saving order {order_data.get('tracking_number')}: {e}")
            return False
    
    def process_order_complete_cycle(self, raw_order: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process a single order through the complete unified cycle
        
        Args:
            raw_order: Raw order data from Bosta API
            
        Returns:
            Complete processing results
        """
        try:
            # Step 1: Normalize order data
            normalized_order = self.normalize_order_data(raw_order)
            if not normalized_order:
                return {'success': False, 'error': 'Failed to normalize order data'}
            
            # Step 2: Associate products and parts (may be skipped by feature toggle)
            product_association = self.associate_products_and_parts(normalized_order)
            normalized_order.update(product_association)

            # Preserve explicit items from incoming payload for manual linking
            # Only used when auto linking is disabled or caller prefers explicit mapping
            if isinstance(raw_order, dict) and raw_order.get('items'):
                normalized_order['items'] = raw_order.get('items')
            
            # Step 3: Process through database transaction
            with get_db() as conn:
                # Save order
                order_saved = self.save_order_unified(conn, normalized_order)
                if not order_saved:
                    return {'success': False, 'error': 'Failed to save order'}
                
                # Create line items
                line_items = self.create_order_line_items(conn, normalized_order)
                
                # Update stock
                stock_results = self.update_stock_levels(conn, line_items, normalized_order)
                
                # Detect hierarchy
                hierarchy_results = self.detect_and_link_hierarchy(conn, normalized_order)
                
                # Initialize customer profile for this order
                customer_results = self._initialize_customer_profile(conn, normalized_order)
                
                # DISABLED: Automatic service action creation
                # Service actions must be created manually through the UI
                # service_action_id = self.create_service_action(conn, normalized_order)
                service_action_id = None  # No automatic creation
                
                # Compile processing results
                processing_results = {
                    'service_action_created': False,  # Manual creation only
                    'service_action_id': None,
                    'hierarchy_links_created': hierarchy_results.get('links_created', 0),
                    'line_items_created': len(line_items),
                    'stock_updated': stock_results.get('success', False),
                    'customer_updated': customer_results.get('success', False),
                    'customer_profile': customer_results.get('customer_id'),
                    'customer_segment': customer_results.get('new_segment')
                }
                
                # Update analytics
                analytics_results = self.update_analytics_realtime(conn, normalized_order, processing_results)
                
                # Commit transaction
                conn.commit()
                
                return {
                    'success': True,
                    'tracking_number': normalized_order['tracking_number'],
                    'business_type': normalized_order.get('business_type'),
                    'order_saved': True,
                    'line_items_created': len(line_items),
                    'stock_updated': stock_results.get('success', False),
                    'hierarchy_linked': hierarchy_results.get('linked', False),
                    'customer_initialized': customer_results.get('success', False),
                    'customer_id': customer_results.get('customer_id'),
                    'customer_segment': customer_results.get('new_segment'),
                    'service_action_created': False, # Manual creation only
                    'analytics_updated': analytics_results.get('success', False),
                    'processing_results': processing_results
                }
                
        except Exception as e:
            logger.error(f"Error in complete cycle processing: {e}")
            return {'success': False, 'error': str(e)}

    def process_database_order_complete_cycle(self, db_order: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process a single database order through the complete unified cycle
        (Skips normalization since data is already in database format)
        
        Args:
            db_order: Order data from database (already normalized)
            
        Returns:
            Complete processing results
        """
        try:
            # Step 1: Associate products and parts (skip normalization)
            product_association = self.associate_products_and_parts(db_order)
            db_order.update(product_association)
            
            # Step 2: Process through database transaction
            with get_db() as conn:
                # Initialize customer profile for this order
                customer_results = self._initialize_customer_profile(conn, db_order)
                
                # Create line items
                line_items = self.create_order_line_items(conn, db_order)
                
                # Update stock
                stock_results = self.update_stock_levels(conn, line_items, db_order)
                
                # Detect hierarchy
                hierarchy_results = self.detect_and_link_hierarchy(conn, db_order)
                
                # Create service action if needed
                service_action_id = self.create_service_action(conn, db_order)
                
                # Process customer profile in real-time (Step 3: Customer Profile, Segmentation & Analytics)
                customer_results = customer_profile_manager.process_customer_from_order(conn, db_order)
                
                # Compile processing results
                processing_results = {
                    'service_action_created': service_action_id is not None,
                    'service_action_id': service_action_id,
                    'hierarchy_links_created': hierarchy_results.get('links_created', 0),
                    'line_items_created': len(line_items),
                    'stock_updated': stock_results.get('success', False),
                    'customer_updated': customer_results.get('success', False),
                    'customer_profile': customer_results
                }
                
                # Update analytics
                analytics_results = self.update_analytics_realtime(conn, db_order, processing_results)
                
                # Mark as processed
                conn.execute(
                    "UPDATE orders SET is_processed = 1 WHERE id = ?",
                    (db_order['id'],)
                )
                
                # Commit transaction
                conn.commit()
                
                return {
                    'success': True,
                    'tracking_number': db_order['tracking_number'],
                    'business_type': db_order.get('business_type'),
                    'order_saved': True,
                    'line_items_created': len(line_items),
                    'stock_updated': stock_results.get('success', False),
                    'hierarchy_linked': hierarchy_results.get('linked', False),
                    'service_action_created': service_action_id is not None,
                    'analytics_updated': analytics_results.get('success', False),
                    'processing_results': processing_results
                }
                
        except Exception as e:
            logger.error(f"Error in database order complete cycle processing: {e}")
            return {'success': False, 'error': str(e)}
    
    def process_database_batch_unified(self, orders: List[Dict], max_workers: int = 5) -> Dict[str, Any]:
        """
        Process multiple database orders in parallel through unified pipeline
        (Skips normalization since data is already in database format)
        
        Args:
            orders: List of database order data (already normalized)
            max_workers: Maximum parallel workers
            
        Returns:
            Batch processing results
        """
        if not orders:
            return {'success': True, 'processed': 0, 'results': []}
        
        results = []
        
        try:
            with ThreadPoolExecutor(max_workers=max_workers) as executor:
                # Submit all orders for processing
                future_to_order = {
                    executor.submit(self.process_database_order_complete_cycle, order): order 
                    for order in orders
                }
                
                # Collect results
                for future in as_completed(future_to_order):
                    order = future_to_order[future]
                    try:
                        result = future.result()
                        results.append(result)
                    except Exception as e:
                        logger.error(f"Error processing database order {order.get('tracking_number')}: {e}")
                        results.append({
                            'success': False, 
                            'tracking_number': order.get('tracking_number'),
                            'error': str(e)
                        })
            
            successful = sum(1 for r in results if r.get('success'))
            
            # Process customers from this batch using proper customer profile manager
            customer_results = self._process_customers_from_batch(orders)
            
            return {
                'success': True,
                'processed': len(results),
                'successful': successful,
                'failed': len(results) - successful,
                'results': results,
                'customer_processing': customer_results
            }
            
        except Exception as e:
            logger.error(f"Error in database batch processing: {e}")
            return {'success': False, 'error': str(e)}
    
    def _process_customers_from_batch(self, orders: List[Dict]) -> Dict[str, Any]:
        """
        Process customer profiles for a batch of orders
        
        This method ensures that customer data is properly initialized for each batch
        following the customer table structure and backend cycle requirements.
        
        Args:
            orders: List of processed order data
            
        Returns:
            Dict containing customer processing results
        """
        try:
            from app.services.customer_profile_manager import CustomerProfileManager
            
            # Initialize customer profile manager
            customer_manager = CustomerProfileManager()
            
            # Group orders by customer phone for efficient processing
            customer_orders = {}
            for order in orders:
                customer_phone = order.get('receiver_phone')
                if customer_phone:
                    if customer_phone not in customer_orders:
                        customer_orders[customer_phone] = []
                    customer_orders[customer_phone].append(order)
            
            # Process each unique customer
            customer_results = {
                'total_customers': len(customer_orders),
                'processed_customers': 0,
                'failed_customers': 0,
                'customer_details': []
            }
            
            with get_db() as conn:
                for customer_phone, customer_order_list in customer_orders.items():
                    try:
                        # Use the first order as the base for customer data
                        base_order = customer_order_list[0]
                        
                        # Process customer profile
                        customer_result = customer_manager.process_customer_from_order(conn, base_order)
                        
                        if customer_result.get('success'):
                            customer_results['processed_customers'] += 1
                            customer_results['customer_details'].append({
                                'phone': customer_phone,
                                'customer_id': customer_result.get('customer_id'),
                                'segment': customer_result.get('new_segment'),
                                'orders_count': len(customer_order_list),
                                'total_value': sum(order.get('cod', 0) for order in customer_order_list),
                                'profile_updated': customer_result.get('profile_updated', False),
                                'addresses_updated': customer_result.get('addresses_updated', 0),
                                'analytics_updated': customer_result.get('analytics_updated', False)
                            })
                            
                            logger.info(f"Customer {customer_phone} processed successfully: "
                                      f"ID {customer_result.get('customer_id')}, "
                                      f"Segment {customer_result.get('new_segment')}, "
                                      f"Orders {len(customer_order_list)}")
                        else:
                            customer_results['failed_customers'] += 1
                            logger.error(f"Failed to process customer {customer_phone}: "
                                       f"{customer_result.get('error')}")
                            
                    except Exception as e:
                        customer_results['failed_customers'] += 1
                        logger.error(f"Error processing customer {customer_phone}: {e}")
            
            return customer_results
            
        except Exception as e:
            logger.error(f"Error in batch customer processing: {e}")
            return {
                'total_customers': 0,
                'processed_customers': 0,
                'failed_customers': 0,
                'error': str(e)
            }
    
    def process_batch_unified(self, orders: List[Dict], max_workers: int = 5) -> Dict[str, Any]:
        """
        Process multiple orders in parallel through unified pipeline
        
        Args:
            orders: List of raw order data
            max_workers: Maximum parallel workers
            
        Returns:
            Batch processing results
        """
        if not orders:
            return {'success': True, 'processed': 0, 'results': []}
        
        results = []
        
        try:
            with ThreadPoolExecutor(max_workers=max_workers) as executor:
                # Submit all orders for processing
                future_to_order = {
                    executor.submit(self.process_order_complete_cycle, order): order 
                    for order in orders
                }
                
                # Collect results
                for future in as_completed(future_to_order):
                    order = future_to_order[future]
                    try:
                        result = future.result()
                        results.append(result)
                    except Exception as e:
                        logger.error(f"Error processing order {order.get('trackingNumber') or order.get('tracking_number')}: {e}")
                        results.append({
                            'success': False, 
                            'tracking_number': order.get('trackingNumber') or order.get('tracking_number'),
                            'error': str(e)
                        })
            
            successful = sum(1 for r in results if r.get('success'))
            
            # Process customers from this batch using proper customer profile manager
            customer_results = self._process_customers_from_batch(results)
            
            return {
                'success': True,
                'processed': len(results),
                'successful': successful,
                'failed': len(results) - successful,
                'results': results,
                'customer_processing': customer_results
            }
            
        except Exception as e:
            logger.error(f"Error in batch processing: {e}")
            return {'success': False, 'error': str(e)}
    
    def process_all_orders_unified(self, order_type: str = "all", page_size: int = 100) -> Dict[str, Any]:
        """
        Process all unprocessed orders from the local database using the unified pipeline.
        
        Args:
            order_type: This parameter is kept for compatibility but is no longer used for fetching.
            page_size: Number of orders to process per batch.
            
        Returns:
            Complete processing summary.
        """
        with self.sync_lock:
            if self.is_running:
                return {'success': False, 'error': 'Processing already running'}
            
            self.is_running = True
        
        try:
            logger.info(f"Starting unified order processing for local unprocessed orders.")
            
            page = 1
            total_processed = 0
            total_successful = 0
            all_results = []
            
            while True:
                # Fetch unprocessed orders from the local database
                with get_db() as conn:
                    cursor = conn.execute(
                        "SELECT * FROM orders WHERE is_processed = 0 LIMIT ?",
                        (page_size,)
                    )
                    orders = [dict(row) for row in cursor.fetchall()]

                if not orders:
                    logger.info("No more unprocessed orders to process")
                    break
                
                # Process batch using database-specific method
                batch_result = self.process_database_batch_unified(orders)
                
                if batch_result.get('success'):
                    total_processed += batch_result.get('processed', 0)
                    total_successful += batch_result.get('successful', 0)
                    all_results.extend(batch_result.get('results', []))
                    
                    # Log customer processing results
                    customer_processing = batch_result.get('customer_processing', {})
                    if customer_processing.get('success'):
                        logger.info(f"Processed batch {page}: {batch_result.get('successful')}/{batch_result.get('processed')} successful, "
                                  f"Customers: {customer_processing.get('customers_created', 0)} created, "
                                  f"{customer_processing.get('customers_processed', 0)} processed")
                    else:
                        logger.warning(f"Customer processing failed for batch {page}: {customer_processing.get('error')}")
                else:
                    logger.error(f"Batch processing failed on page {page}: {batch_result.get('error')}")
                
                page += 1
                
            # Customer profiles are now updated in real-time during order processing
            logging.info("✅ Customer profiles updated in real-time during order processing (Step 3: Customer Profile, Segmentation & Analytics)")
            return {
                'success': True,
                'total_processed': total_processed,
                'total_successful': total_successful,
                'total_failed': total_processed - total_successful,
                'pages_processed': page - 1,
                'results': all_results
            }
            
        except Exception as e:
            logger.error(f"Error in unified processing: {e}")
            return {'success': False, 'error': str(e)}
        
        finally:
            self.is_running = False
    
    # Helper methods
    def _safe_get_dict(self, data, key: str, default=None):
        """Safely get a dictionary value"""
        if not isinstance(data, dict):
            return default or {}
        value = data.get(key, default)
        return value if isinstance(value, dict) else (default or {})
    
    def _convert_timestamp_to_egypt_time(self, timestamp: int) -> Optional[datetime]:
        """Convert millisecond timestamp to Egyptian timezone"""
        if not timestamp:
            return None
        
        try:
            timestamp_seconds = timestamp / 1000
            utc_dt = datetime.fromtimestamp(timestamp_seconds, tz=pytz.UTC)
            return utc_dt.astimezone(EGYPT_TZ)
        except (ValueError, TypeError) as e:
            logger.warning(f"Error converting timestamp {timestamp}: {e}")
            return None
    
    def _extract_timeline_dates(self, timeline: List) -> Dict[str, str]:
        """Extract key dates from timeline events"""
        dates = {}
        
        for event in timeline or []:
            if not isinstance(event, dict):
                continue
            
            event_code = event.get('code')
            event_date = event.get('date')
            
            if not event_date:
                continue
            
            # Map timeline codes to date fields
            if event_code == 10:  # Scheduled
                dates['scheduled_at'] = event_date
            elif event_code == 20:  # Picked up
                dates['picked_up_at'] = event_date
            elif event_code == 30:  # Received at warehouse
                dates['received_at_warehouse'] = event_date
            elif event_code == 45:  # Delivered
                dates['delivered_at'] = event_date
            elif event_code == 46:  # Returned
                dates['returned_at'] = event_date
        
        return dates
    
    def _calculate_delivery_time(self, raw_order: Dict) -> Optional[float]:
        """Calculate delivery time in hours"""
        try:
            timeline = raw_order.get('timeline', [])
            created_time = None
            delivered_time = None
            
            # Get creation time
            creation_timestamp = raw_order.get('creationTimestamp')
            if creation_timestamp:
                created_time = self._convert_timestamp_to_egypt_time(creation_timestamp)
            
            # Find delivery time in timeline
            for event in timeline:
                if event.get('code') == 45:  # Delivered
                    event_date = event.get('date')
                    if event_date:
                        delivered_time = datetime.fromisoformat(event_date.replace('Z', '+00:00'))
                        if delivered_time.tzinfo is None:
                            delivered_time = delivered_time.replace(tzinfo=pytz.UTC)
                        delivered_time = delivered_time.astimezone(EGYPT_TZ)
                        break
            
            if created_time and delivered_time:
                delta = delivered_time - created_time
                return delta.total_seconds() / 3600  # Convert to hours
            
            return None
            
        except Exception as e:
            logger.warning(f"Error calculating delivery time: {e}")
            return None
    
    def _generate_sku_from_description(self, product_name: str, description: str) -> Optional[str]:
        """Generate estimated SKU from product description"""
        try:
            # Simple SKU generation logic - can be enhanced
            if product_name:
                # Take first 3 letters of product name + hash of description
                prefix = ''.join(c.upper() for c in product_name if c.isalnum())[:3]
                if len(prefix) < 3:
                    prefix = prefix.ljust(3, 'X')
                
                # Add numeric suffix based on description hash
                desc_hash = abs(hash(description or product_name)) % 1000
                return f"{prefix}{desc_hash:03d}"
            
            return None
            
        except Exception:
            return None
    
    def _create_and_link_products(self, conn, order_data: Dict) -> List[str]:
        """Create and link products for an order"""
        try:
            products = order_data.get('products', [])
            if not products:
                return []
            
            product_ids = []
            
            # Use a helper from product_management service
            product_manager = ProductManagement()
            
            for prod_data in products:
                # Ensure data consistency
                sku = prod_data.get('sku') or self._generate_sku_from_description(prod_data.get('name'), prod_data.get('description'))
                
                if not sku:
                    continue # Cannot process without a SKU
                
                # Check if product exists
                product = product_manager.get_product_by_sku(sku)
                
                if not product:
                    # Create new product if it doesn't exist
                    new_product_data = {
                        'sku': sku,
                        'name': prod_data.get('name', 'Unknown Product'),
                        'description': prod_data.get('description', ''),
                        'category': prod_data.get('category', 'Uncategorized'),
                        'unit_price': prod_data.get('price', 0),
                        'stock_quantity': prod_data.get('quantity', 0)
                    }
                    created_product = product_manager.create_product(new_product_data)
                    product_id = created_product.get('id') if created_product else None
                else:
                    product_id = product.get('id')
                
                if product_id:
                    product_ids.append(product_id)
                    
                    # Link product to order
                    conn.execute("""
                        INSERT INTO order_products (order_id, product_id, quantity) 
                        VALUES (?, ?, ?)
                    """, (order_data['id'], product_id, prod_data.get('quantity', 1)))

            return product_ids

        except Exception as e:
            logger.error(f"Error creating/linking products for order {order_data.get('id')}: {e}")
            return []
    
    def _initialize_customer_profile(self, conn, order_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Initialize customer profile for each order from Bosta
        
        This method ensures that every order creates/updates a customer profile
        in real-time during the order processing cycle, following the customer table structure.
        
        Customer table structure:
        - customer_id (PRIMARY KEY)
        - phone (UNIQUE, NOT NULL)
        - first_name, last_name, full_name
        - primary_city, primary_zone, primary_district, primary_address
        - total_orders, total_value, avg_order_value
        - first_order_date, last_order_date
        - customer_segment, return_rate, satisfaction_score
        - created_at, updated_at
        
        Args:
            conn: Database connection (within transaction)
            order_data: Normalized order data with required customer fields
            
        Returns:
            Dict containing customer initialization results
        """
        try:
            from app.services.customer_profile_manager import CustomerProfileManager
            
            # Validate required customer data
            customer_phone = order_data.get('receiver_phone')
            if not customer_phone:
                return {
                    'success': False,
                    'error': 'Missing customer phone number',
                    'customer_id': None,
                    'new_segment': None
                }
            
            # Initialize customer profile manager with proper configuration
            customer_manager = CustomerProfileManager(
                prevent_merge_for_same_phones=True,
                max_duplicate_phones=20,
                allow_merge_above_limit=False
            )
            
            # Process customer from order data
            customer_results = customer_manager.process_customer_from_order(conn, order_data)
            
            if customer_results.get('success'):
                logger.info(f"Customer initialized for order {order_data.get('tracking_number')}: "
                          f"Customer ID {customer_results.get('customer_id')}, "
                          f"Segment: {customer_results.get('new_segment')}, "
                          f"Phone: {customer_phone}")
                
                return {
                    'success': True,
                    'customer_id': customer_results.get('customer_id'),
                    'new_segment': customer_results.get('new_segment'),
                    'profile_updated': customer_results.get('profile_updated', False),
                    'addresses_updated': customer_results.get('addresses_updated', 0),
                    'analytics_updated': customer_results.get('analytics_updated', False),
                    'customer_phone': customer_phone
                }
            else:
                logger.error(f"Failed to initialize customer for order {order_data.get('tracking_number')}: "
                           f"{customer_results.get('error')}")
                
                return {
                    'success': False,
                    'error': customer_results.get('error'),
                    'customer_id': None,
                    'new_segment': None,
                    'customer_phone': customer_phone
                }
                
        except Exception as e:
            logger.error(f"Error initializing customer profile for order {order_data.get('tracking_number')}: {e}")
            return {
                'success': False,
                'error': str(e),
                'customer_id': None,
                'new_segment': None,
                'customer_phone': order_data.get('receiver_phone')
            }

# Global instance for use across the application
unified_order_intake = UnifiedOrderIntake() 