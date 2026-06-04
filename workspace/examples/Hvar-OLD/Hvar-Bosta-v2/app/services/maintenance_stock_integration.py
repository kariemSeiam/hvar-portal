"""
Maintenance Stock Integration Service
Real-time inventory management during maintenance operations with comprehensive 
stock tracking, allocation, usage monitoring, and return processing.

Provides seamless integration between maintenance cycles and stock management
according to HVAR_COMPLETE_CYCLE_SYSTEM.md requirements.

Key Features:
- Real-time stock allocation during maintenance scheduling
- Dynamic stock updates during parts usage
- Automatic stock replenishment from returns
- Stock movement audit trail for maintenance operations
- Integration with multiple stock locations (warehouse, technician, damaged)
- Automated low stock alerts during maintenance planning
"""

import logging
import sqlite3
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from decimal import Decimal
import json
from dataclasses import dataclass
from enum import Enum

from app.utils.db_utils import get_db
from app.models.database import PRODUCTION_SCHEMA
from app.models.product_management import ProductManagement

# Setup logging
logger = logging.getLogger(__name__)

class StockLocation(Enum):
    """Stock location enumeration"""
    MAIN_WAREHOUSE = "main_warehouse"
    TECHNICIAN_STOCK = "technician_stock"
    DAMAGED_STOCK = "damaged_stock"
    QUARANTINE = "quarantine"
    CUSTOMER_SITE = "customer_site"

class StockMovementType(Enum):
    """Stock movement type enumeration"""
    ALLOCATION = "allocation"
    USAGE = "usage"
    RETURN = "return"
    TRANSFER = "transfer"
    ADJUSTMENT = "adjustment"
    DAMAGE = "damage"
    LOSS = "loss"

@dataclass
class StockMovement:
    """Stock movement record"""
    sku: str
    location_from: Optional[str]
    location_to: Optional[str]
    quantity: int
    movement_type: StockMovementType
    reference_id: str
    reference_type: str
    notes: str
    cost_impact: float = 0.0

@dataclass
class PartAllocation:
    """Parts allocation record for maintenance"""
    allocation_id: int
    cycle_id: int
    sku: str
    quantity_required: int
    quantity_allocated: int
    quantity_used: int
    quantity_returned: int
    allocation_status: str
    unit_cost: float
    total_cost: float

class MaintenanceStockIntegration:
    """
    Comprehensive Stock Integration for Maintenance Operations
    
    Manages real-time inventory during maintenance cycles with:
    - Dynamic stock allocation based on maintenance requirements
    - Real-time stock updates during parts usage
    - Automated return processing with condition assessment
    - Complete audit trail for all stock movements
    - Integration with multiple stock locations
    - Predictive stock planning for maintenance operations
    """
    
    def __init__(self):
        self.product_manager = ProductManagement()
        self._initialize_stock_tracking()
    
    def _initialize_stock_tracking(self):
        """Initialize stock tracking enhancement tables"""
        try:
            with get_db() as conn:
                # FIRST, ensure the entire production schema exists.
                conn.executescript(PRODUCTION_SCHEMA)
                
                # THEN, create the stock-specific tables.
                # Maintenance stock reservations tracking
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS maintenance_stock_reservations (
                        reservation_id INTEGER PRIMARY KEY AUTOINCREMENT,
                        cycle_id INTEGER NOT NULL,
                        sku TEXT NOT NULL,
                        quantity_reserved INTEGER NOT NULL,
                        location TEXT NOT NULL,
                        reservation_status TEXT DEFAULT 'active', -- 'active', 'used', 'released', 'expired'
                        reserved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        expires_at TIMESTAMP,
                        used_at TIMESTAMP,
                        released_at TIMESTAMP,
                        notes TEXT,
                        FOREIGN KEY (cycle_id) REFERENCES maintenance_cycles(cycle_id) ON DELETE CASCADE
                    )
                """)
                
                # Stock condition tracking for returns
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS stock_condition_tracking (
                        condition_id INTEGER PRIMARY KEY AUTOINCREMENT,
                        sku TEXT NOT NULL,
                        stock_id INTEGER,
                        condition_status TEXT NOT NULL, -- 'new', 'good', 'fair', 'poor', 'damaged', 'scrap'
                        quality_score INTEGER, -- 1-10 scale
                        inspection_date TIMESTAMP,
                        inspector_id TEXT,
                        inspection_notes TEXT,
                        photos_json TEXT,
                        disposition TEXT, -- 'sellable', 'refurbishable', 'scrap', 'warranty_claim'
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                
                # Stock location capacity tracking
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS stock_location_capacity (
                        location_id INTEGER PRIMARY KEY AUTOINCREMENT,
                        location_name TEXT UNIQUE NOT NULL,
                        location_type TEXT, -- 'warehouse', 'technician', 'hub', 'customer'
                        max_capacity INTEGER DEFAULT 1000,
                        current_utilization INTEGER DEFAULT 0,
                        reserved_capacity INTEGER DEFAULT 0,
                        available_capacity INTEGER DEFAULT 1000,
                        location_address TEXT,
                        manager_id TEXT,
                        is_active BOOLEAN DEFAULT 1,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                
                # Predictive stock requirements
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS maintenance_stock_forecasting (
                        forecast_id INTEGER PRIMARY KEY AUTOINCREMENT,
                        sku TEXT NOT NULL,
                        forecast_period TEXT, -- 'weekly', 'monthly', 'quarterly'
                        predicted_usage INTEGER,
                        confidence_level FLOAT, -- 0-1 scale
                        historical_data_points INTEGER,
                        trend_direction TEXT, -- 'increasing', 'decreasing', 'stable'
                        seasonal_factor FLOAT DEFAULT 1.0,
                        emergency_buffer INTEGER DEFAULT 0,
                        recommended_stock_level INTEGER,
                        forecast_date DATE,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                
                # Create indexes
                conn.execute("CREATE INDEX IF NOT EXISTS idx_stock_reservations_cycle ON maintenance_stock_reservations(cycle_id)")
                conn.execute("CREATE INDEX IF NOT EXISTS idx_stock_reservations_sku ON maintenance_stock_reservations(sku)")
                conn.execute("CREATE INDEX IF NOT EXISTS idx_stock_reservations_status ON maintenance_stock_reservations(reservation_status)")
                
                conn.execute("CREATE INDEX IF NOT EXISTS idx_condition_tracking_sku ON stock_condition_tracking(sku)")
                conn.execute("CREATE INDEX IF NOT EXISTS idx_condition_tracking_status ON stock_condition_tracking(condition_status)")
                conn.execute("CREATE INDEX IF NOT EXISTS idx_condition_tracking_date ON stock_condition_tracking(inspection_date)")
                
                conn.execute("CREATE INDEX IF NOT EXISTS idx_location_capacity_name ON stock_location_capacity(location_name)")
                conn.execute("CREATE INDEX IF NOT EXISTS idx_location_capacity_type ON stock_location_capacity(location_type)")
                
                conn.execute("CREATE INDEX IF NOT EXISTS idx_stock_forecasting_sku ON maintenance_stock_forecasting(sku)")
                conn.execute("CREATE INDEX IF NOT EXISTS idx_stock_forecasting_date ON maintenance_stock_forecasting(forecast_date)")
                
                conn.commit()
                logger.info("Maintenance stock integration tables initialized successfully")
                
        except Exception as e:
            logger.error(f"Error initializing stock tracking tables: {e}")
            raise

    # =================== STOCK ALLOCATION FOR MAINTENANCE ===================
    
    def allocate_stock_for_maintenance(self, cycle_id: int, parts_requirements: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Allocate stock for maintenance cycle with real-time availability checking
        and automatic reservation management
        """
        try:
            with get_db() as conn:
                allocations_created = []
                allocation_errors = []
                total_cost = 0.0
                
                for part_req in parts_requirements:
                    allocation_result = self._allocate_single_part_with_reservation(
                        conn, cycle_id, part_req
                    )
                    
                    if allocation_result['success']:
                        allocations_created.append(allocation_result['allocation'])
                        total_cost += allocation_result['allocation']['total_cost']
                    else:
                        allocation_errors.append(allocation_result['error'])
                
                # Update maintenance cycle with allocation summary
                if allocations_created:
                    conn.execute("""
                        UPDATE maintenance_cycles 
                        SET parts_allocated_json = ?, total_parts_cost = ?,
                            last_updated = CURRENT_TIMESTAMP
                        WHERE cycle_id = ?
                    """, (json.dumps(allocations_created), total_cost, cycle_id))
                
                conn.commit()
                
                return {
                    'success': len(allocation_errors) == 0,
                    'allocations_created': allocations_created,
                    'allocation_errors': allocation_errors,
                    'total_parts_allocated': len(allocations_created),
                    'total_cost': total_cost,
                    'message': f'Stock allocated for {len(allocations_created)} parts with total cost ${total_cost:.2f}'
                }
                
        except Exception as e:
            logger.error(f"Error allocating stock for maintenance cycle {cycle_id}: {e}")
            return {'success': False, 'error': str(e)}

    def _allocate_single_part_with_reservation(self, conn, cycle_id: int, part_requirement: Dict[str, Any]) -> Dict[str, Any]:
        """Allocate a single part with stock reservation"""
        try:
            sku = part_requirement.get('sku')
            quantity_required = part_requirement.get('quantity', 1)
            priority = part_requirement.get('priority', 'medium')
            
            if not sku:
                return {'success': False, 'error': 'SKU is required for allocation'}
            
            # Check stock availability across locations
            available_stock = self._get_available_stock_by_location(conn, sku, quantity_required)
            
            if not available_stock:
                return {'success': False, 'error': f'Insufficient stock for SKU {sku}'}
            
            # Select best location based on priority and availability
            best_location = self._select_best_stock_location(available_stock, priority)
            
            # Get part cost
            part_cost = self._get_part_cost_from_stock(conn, sku, best_location['location'])
            total_cost = part_cost * quantity_required
            
            # Create stock reservation
            reservation_result = self._create_stock_reservation(
                conn, cycle_id, sku, quantity_required, best_location['location']
            )
            
            if not reservation_result['success']:
                return reservation_result
            
            # Update stock tables
            self._update_stock_for_allocation(
                conn, sku, quantity_required, best_location['location'], cycle_id
            )
            
            # Create allocation record in maintenance_parts_allocation
            cursor = conn.execute("""
                INSERT INTO maintenance_parts_allocation (
                    cycle_id, sku, quantity_required, quantity_allocated,
                    unit_cost, total_cost, allocation_status, allocated_at
                ) VALUES (?, ?, ?, ?, ?, ?, 'allocated', CURRENT_TIMESTAMP)
            """, (cycle_id, sku, quantity_required, quantity_required, part_cost, total_cost))
            
            allocation_id = cursor.lastrowid
            
            return {
                'success': True,
                'allocation': {
                    'allocation_id': allocation_id,
                    'reservation_id': reservation_result['reservation_id'],
                    'sku': sku,
                    'quantity_allocated': quantity_required,
                    'location': best_location['location'],
                    'unit_cost': part_cost,
                    'total_cost': total_cost,
                    'allocation_status': 'allocated'
                }
            }
            
        except Exception as e:
            logger.error(f"Error allocating single part: {e}")
            return {'success': False, 'error': str(e)}

    def _get_available_stock_by_location(self, conn, sku: str, quantity_required: int) -> List[Dict[str, Any]]:
        """Get available stock across all locations for a SKU"""
        cursor = conn.execute("""
            SELECT location, quantity, available_quantity, reserved_quantity
            FROM stock 
            WHERE sku = ? AND available_quantity >= ?
            ORDER BY 
                CASE location 
                    WHEN 'technician_stock' THEN 1
                    WHEN 'main_warehouse' THEN 2
                    ELSE 3
                END,
                available_quantity DESC
        """, (sku, quantity_required))
        
        return [
            {
                'location': row[0],
                'total_quantity': row[1],
                'available_quantity': row[2],
                'reserved_quantity': row[3]
            }
            for row in cursor.fetchall()
        ]

    def _select_best_stock_location(self, available_stock: List[Dict[str, Any]], priority: str) -> Dict[str, Any]:
        """Select the best stock location based on priority and availability"""
        if not available_stock:
            return None
        
        # Priority-based location selection
        location_priority = {
            'urgent': ['technician_stock', 'main_warehouse'],
            'high': ['technician_stock', 'main_warehouse'],
            'medium': ['main_warehouse', 'technician_stock'],
            'low': ['main_warehouse', 'technician_stock']
        }
        
        preferred_locations = location_priority.get(priority, ['main_warehouse', 'technician_stock'])
        
        # Find best match based on preferred locations
        for preferred_loc in preferred_locations:
            for stock in available_stock:
                if stock['location'] == preferred_loc:
                    return stock
        
        # Fallback to first available
        return available_stock[0]

    def _get_part_cost_from_stock(self, conn, sku: str, location: str) -> float:
        """Get part cost with location-specific pricing"""
        try:
            # Try to get cost from products table
            cursor = conn.execute("""
                SELECT selling_price, purchase_price FROM products WHERE sku = ?
            """, (sku,))
            result = cursor.fetchone()
            
            if result:
                selling_price, purchase_price = result
                # Use purchase price for internal maintenance, selling price for customer billing
                return float(purchase_price) if purchase_price else float(selling_price) if selling_price else 0.0
            
            return 0.0
            
        except Exception as e:
            logger.error(f"Error getting part cost for SKU {sku}: {e}")
            return 0.0

    def _create_stock_reservation(self, conn, cycle_id: int, sku: str, quantity: int, location: str) -> Dict[str, Any]:
        """Create stock reservation for maintenance cycle"""
        try:
            # Set expiration time (24 hours for maintenance reservations)
            expires_at = datetime.now() + timedelta(hours=24)
            
            cursor = conn.execute("""
                INSERT INTO maintenance_stock_reservations (
                    cycle_id, sku, quantity_reserved, location, 
                    expires_at, notes
                ) VALUES (?, ?, ?, ?, ?, ?)
            """, (
                cycle_id, sku, quantity, location, expires_at,
                f"Reserved for maintenance cycle {cycle_id}"
            ))
            
            reservation_id = cursor.lastrowid
            
            return {
                'success': True,
                'reservation_id': reservation_id,
                'expires_at': expires_at.isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error creating stock reservation: {e}")
            return {'success': False, 'error': str(e)}

    def _update_stock_for_allocation(self, conn, sku: str, quantity: int, location: str, cycle_id: int):
        """Update stock tables for allocation"""
        # Update main stock table
        conn.execute("""
            UPDATE stock 
            SET reserved_quantity = reserved_quantity + ?,
                available_quantity = available_quantity - ?,
                last_updated = CURRENT_TIMESTAMP
            WHERE sku = ? AND location = ?
        """, (quantity, quantity, sku, location))
        
        # Record stock movement
        conn.execute("""
            INSERT INTO stock_movements (
                sku, location_from, quantity, movement_type,
                reference_id, reference_type, notes, created_at
            ) VALUES (?, ?, ?, 'allocation', ?, 'maintenance_cycle', ?, CURRENT_TIMESTAMP)
        """, (sku, location, -quantity, str(cycle_id), f"Allocated for maintenance cycle {cycle_id}"))

    # =================== REAL-TIME STOCK USAGE TRACKING ===================
    
    def record_stock_usage_real_time(self, cycle_id: int, usage_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Record real-time stock usage during maintenance operations"""
        try:
            with get_db() as conn:
                usage_records = []
                stock_movements = []
                total_cost_used = 0.0
                
                for usage_item in usage_data:
                    usage_result = self._process_single_stock_usage(conn, cycle_id, usage_item)
                    
                    if usage_result['success']:
                        usage_records.append(usage_result['usage_record'])
                        stock_movements.append(usage_result['stock_movement'])
                        total_cost_used += usage_result['cost_impact']
                
                # Update maintenance cycle progress
                self._update_maintenance_progress_on_usage(conn, cycle_id, usage_records, total_cost_used)
                
                # Update stock reservations
                self._update_reservations_on_usage(conn, cycle_id, usage_records)
                
                conn.commit()
                
                return {
                    'success': True,
                    'usage_records': usage_records,
                    'stock_movements': stock_movements,
                    'parts_used_count': len(usage_records),
                    'total_cost_used': total_cost_used,
                    'message': f'Real-time stock usage recorded for {len(usage_records)} parts'
                }
                
        except Exception as e:
            logger.error(f"Error recording real-time stock usage for cycle {cycle_id}: {e}")
            return {'success': False, 'error': str(e)}

    def _process_single_stock_usage(self, conn, cycle_id: int, usage_item: Dict[str, Any]) -> Dict[str, Any]:
        """Process usage of a single stock item"""
        try:
            sku = usage_item.get('sku')
            quantity_used = usage_item.get('quantity_used', 1)
            condition_before = usage_item.get('condition_before', 'new')
            condition_after = usage_item.get('condition_after', 'used')
            usage_notes = usage_item.get('notes', '')
            technician_id = usage_item.get('technician_id')
            
            # Get allocation details
            cursor = conn.execute("""
                SELECT allocation_id, unit_cost FROM maintenance_parts_allocation 
                WHERE cycle_id = ? AND sku = ? AND allocation_status = 'allocated'
            """, (cycle_id, sku))
            
            allocation_info = cursor.fetchone()
            if not allocation_info:
                return {'success': False, 'error': f'No allocation found for SKU {sku} in cycle {cycle_id}'}
            
            allocation_id, unit_cost = allocation_info
            cost_impact = float(unit_cost) * quantity_used
            
            # Update allocation record
            conn.execute("""
                UPDATE maintenance_parts_allocation 
                SET quantity_used = quantity_used + ?, 
                    condition_before = ?, condition_after = ?,
                    allocation_status = 'used', used_at = CURRENT_TIMESTAMP
                WHERE allocation_id = ?
            """, (quantity_used, condition_before, condition_after, allocation_id))
            
            # Update stock - convert reserved to used
            conn.execute("""
                UPDATE stock 
                SET reserved_quantity = reserved_quantity - ?,
                    quantity = quantity - ?,
                    last_updated = CURRENT_TIMESTAMP
                WHERE sku = ? AND location = 'technician_stock'
            """, (quantity_used, quantity_used, sku))
            
            # Record detailed stock movement
            conn.execute("""
                INSERT INTO stock_movements (
                    sku, location_from, quantity, movement_type,
                    reference_id, reference_type, notes, created_at
                ) VALUES (?, 'technician_stock', ?, 'usage', 
                         ?, 'maintenance_cycle', ?, CURRENT_TIMESTAMP)
            """, (sku, -quantity_used, str(cycle_id), 
                  f"Used by {technician_id}: {usage_notes}"))
            
            return {
                'success': True,
                'usage_record': {
                    'sku': sku,
                    'quantity_used': quantity_used,
                    'condition_before': condition_before,
                    'condition_after': condition_after,
                    'unit_cost': unit_cost,
                    'cost_impact': cost_impact,
                    'technician_id': technician_id,
                    'notes': usage_notes,
                    'used_at': datetime.now().isoformat()
                },
                'stock_movement': {
                    'sku': sku,
                    'quantity': quantity_used,
                    'location_from': 'technician_stock',
                    'movement_type': 'usage'
                },
                'cost_impact': cost_impact
            }
            
        except Exception as e:
            logger.error(f"Error processing single stock usage: {e}")
            return {'success': False, 'error': str(e)}

    def _update_maintenance_progress_on_usage(self, conn, cycle_id: int, usage_records: List[Dict], total_cost_used: float):
        """Update maintenance cycle progress based on parts usage"""
        try:
            # Calculate progress based on parts usage
            cursor = conn.execute("""
                SELECT COUNT(*) as total_parts_allocated 
                FROM maintenance_parts_allocation 
                WHERE cycle_id = ?
            """, (cycle_id,))
            
            result = cursor.fetchone()
            total_parts = result[0] if result else 1
            
            # Calculate progress percentage (parts usage = 60% of total progress)
            parts_used = len(usage_records)
            parts_progress = min(60, int(60 * parts_used / total_parts))
            
            # Update maintenance cycle
            conn.execute("""
                UPDATE maintenance_cycles 
                SET progress_percentage = CASE 
                        WHEN progress_percentage < ? THEN ?
                        ELSE progress_percentage
                    END,
                    parts_used_json = ?,
                    total_parts_cost = total_parts_cost + ?,
                    last_updated = CURRENT_TIMESTAMP
                WHERE cycle_id = ?
            """, (parts_progress, parts_progress, json.dumps(usage_records), 
                  total_cost_used, cycle_id))
            
        except Exception as e:
            logger.error(f"Error updating maintenance progress: {e}")

    def _update_reservations_on_usage(self, conn, cycle_id: int, usage_records: List[Dict]):
        """Update stock reservations when parts are used"""
        try:
            for usage_record in usage_records:
                sku = usage_record['sku']
                quantity_used = usage_record['quantity_used']
                
                # Update reservation status
                conn.execute("""
                    UPDATE maintenance_stock_reservations 
                    SET reservation_status = 'used', used_at = CURRENT_TIMESTAMP,
                        quantity_reserved = quantity_reserved - ?
                    WHERE cycle_id = ? AND sku = ? AND reservation_status = 'active'
                """, (quantity_used, cycle_id, sku))
                
        except Exception as e:
            logger.error(f"Error updating reservations on usage: {e}")

    # =================== STOCK RETURN PROCESSING ===================
    
    def process_stock_returns_with_condition_assessment(self, cycle_id: int, return_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Process stock returns with comprehensive condition assessment"""
        try:
            with get_db() as conn:
                return_records = []
                condition_assessments = []
                stock_movements = []
                total_value_returned = 0.0
                
                for return_item in return_data:
                    return_result = self._process_single_stock_return(conn, cycle_id, return_item)
                    
                    if return_result['success']:
                        return_records.append(return_result['return_record'])
                        condition_assessments.append(return_result['condition_assessment'])
                        stock_movements.append(return_result['stock_movement'])
                        total_value_returned += return_result['value_returned']
                
                # Update maintenance cycle with return summary
                self._update_maintenance_cycle_on_returns(conn, cycle_id, return_records, total_value_returned)
                
                conn.commit()
                
                return {
                    'success': True,
                    'return_records': return_records,
                    'condition_assessments': condition_assessments,
                    'stock_movements': stock_movements,
                    'parts_returned_count': len(return_records),
                    'total_value_returned': total_value_returned,
                    'message': f'Processed returns for {len(return_records)} parts with total value ${total_value_returned:.2f}'
                }
                
        except Exception as e:
            logger.error(f"Error processing stock returns for cycle {cycle_id}: {e}")
            return {'success': False, 'error': str(e)}

    def _process_single_stock_return(self, conn, cycle_id: int, return_item: Dict[str, Any]) -> Dict[str, Any]:
        """Process return of a single stock item with condition assessment"""
        try:
            sku = return_item.get('sku')
            quantity_returned = return_item.get('quantity_returned', 1)
            condition_status = return_item.get('condition_status', 'good')
            quality_score = return_item.get('quality_score', 7)
            inspector_id = return_item.get('inspector_id')
            inspection_notes = return_item.get('inspection_notes', '')
            photos = return_item.get('photos', [])
            
            # Determine stock disposition based on condition
            disposition = self._determine_stock_disposition(condition_status, quality_score)
            target_location = self._get_target_location_for_condition(disposition)
            
            # Get original allocation info
            cursor = conn.execute("""
                SELECT allocation_id, unit_cost FROM maintenance_parts_allocation 
                WHERE cycle_id = ? AND sku = ?
            """, (cycle_id, sku))
            
            allocation_info = cursor.fetchone()
            if not allocation_info:
                return {'success': False, 'error': f'No allocation found for SKU {sku}'}
            
            allocation_id, unit_cost = allocation_info
            value_returned = float(unit_cost) * quantity_returned * self._get_value_recovery_rate(disposition)
            
            # Update allocation record
            conn.execute("""
                UPDATE maintenance_parts_allocation 
                SET quantity_returned = quantity_returned + ?,
                    allocation_status = 'returned', returned_at = CURRENT_TIMESTAMP
                WHERE allocation_id = ?
            """, (quantity_returned, allocation_id))
            
            # Create condition assessment record
            cursor = conn.execute("""
                INSERT INTO stock_condition_tracking (
                    sku, condition_status, quality_score, inspection_date,
                    inspector_id, inspection_notes, photos_json, disposition,
                    created_at, updated_at
                ) VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?, 
                         CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            """, (sku, condition_status, quality_score, inspector_id, 
                  inspection_notes, json.dumps(photos), disposition))
            
            condition_id = cursor.lastrowid
            
            # Update stock in target location
            self._update_stock_on_return(conn, sku, quantity_returned, target_location)
            
            # Record stock movement
            conn.execute("""
                INSERT INTO stock_movements (
                    sku, location_to, quantity, movement_type,
                    reference_id, reference_type, notes, created_at
                ) VALUES (?, ?, ?, 'return', ?, 'maintenance_cycle', ?, CURRENT_TIMESTAMP)
            """, (sku, target_location, quantity_returned, str(cycle_id),
                  f"Returned from maintenance - condition: {condition_status}, disposition: {disposition}"))
            
            return {
                'success': True,
                'return_record': {
                    'sku': sku,
                    'quantity_returned': quantity_returned,
                    'condition_status': condition_status,
                    'disposition': disposition,
                    'target_location': target_location,
                    'value_returned': value_returned,
                    'returned_at': datetime.now().isoformat()
                },
                'condition_assessment': {
                    'condition_id': condition_id,
                    'quality_score': quality_score,
                    'inspector_id': inspector_id,
                    'inspection_notes': inspection_notes
                },
                'stock_movement': {
                    'sku': sku,
                    'quantity': quantity_returned,
                    'location_to': target_location,
                    'movement_type': 'return'
                },
                'value_returned': value_returned
            }
            
        except Exception as e:
            logger.error(f"Error processing single stock return: {e}")
            return {'success': False, 'error': str(e)}

    def _determine_stock_disposition(self, condition_status: str, quality_score: int) -> str:
        """Determine stock disposition based on condition and quality"""
        if condition_status == 'new' or (condition_status == 'good' and quality_score >= 8):
            return 'sellable'
        elif condition_status == 'good' or (condition_status == 'fair' and quality_score >= 6):
            return 'sellable'
        elif condition_status == 'fair' or (condition_status == 'poor' and quality_score >= 4):
            return 'refurbishable'
        elif condition_status == 'damaged' or quality_score < 4:
            return 'scrap'
        else:
            return 'quarantine'  # For uncertain cases

    def _get_target_location_for_condition(self, disposition: str) -> str:
        """Get target stock location based on disposition"""
        location_mapping = {
            'sellable': 'main_warehouse',
            'refurbishable': 'main_warehouse',  # Still usable
            'scrap': 'damaged_stock',
            'quarantine': 'quarantine',
            'warranty_claim': 'quarantine'
        }
        return location_mapping.get(disposition, 'quarantine')

    def _get_value_recovery_rate(self, disposition: str) -> float:
        """Get value recovery rate based on disposition"""
        recovery_rates = {
            'sellable': 1.0,      # Full value
            'refurbishable': 0.7,  # 70% value
            'scrap': 0.1,         # 10% scrap value
            'quarantine': 0.5,     # 50% pending assessment
            'warranty_claim': 0.0  # No immediate value
        }
        return recovery_rates.get(disposition, 0.5)

    def _update_stock_on_return(self, conn, sku: str, quantity: int, location: str):
        """Update stock levels on return"""
        # Check if stock record exists for location
        cursor = conn.execute("""
            SELECT stock_id FROM stock WHERE sku = ? AND location = ?
        """, (sku, location))
        
        if cursor.fetchone():
            # Update existing record
            conn.execute("""
                UPDATE stock 
                SET quantity = quantity + ?,
                    available_quantity = available_quantity + ?,
                    last_updated = CURRENT_TIMESTAMP
                WHERE sku = ? AND location = ?
            """, (quantity, quantity, sku, location))
        else:
            # Create new stock record
            conn.execute("""
                INSERT INTO stock (sku, location, quantity, available_quantity, last_updated)
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
            """, (sku, location, quantity, quantity))

    def _update_maintenance_cycle_on_returns(self, conn, cycle_id: int, return_records: List[Dict], total_value_returned: float):
        """Update maintenance cycle with return information"""
        try:
            # Update progress to completion if returns are processed
            conn.execute("""
                UPDATE maintenance_cycles 
                SET progress_percentage = CASE 
                        WHEN progress_percentage < 90 THEN 90
                        ELSE progress_percentage
                    END,
                    cycle_status = CASE 
                        WHEN cycle_status = 'in_progress' THEN 'quality_check'
                        ELSE cycle_status
                    END,
                    last_updated = CURRENT_TIMESTAMP
                WHERE cycle_id = ?
            """, (cycle_id,))
            
        except Exception as e:
            logger.error(f"Error updating maintenance cycle on returns: {e}")

    # =================== STOCK FORECASTING & PLANNING ===================
    
    def generate_maintenance_stock_forecast(self, forecast_period: str = 'monthly') -> Dict[str, Any]:
        """Generate stock forecast for maintenance operations"""
        try:
            with get_db() as conn:
                # Get historical usage data
                cursor = conn.execute("""
                    SELECT sku, SUM(quantity_used) as total_used, COUNT(*) as usage_count
                    FROM maintenance_parts_allocation 
                    WHERE allocation_status = 'used'
                    AND created_at >= date('now', '-90 days')
                    GROUP BY sku
                    HAVING total_used > 0
                    ORDER BY total_used DESC
                """)
                
                historical_data = cursor.fetchall()
                forecasts = []
                
                for sku, total_used, usage_count in historical_data:
                    forecast = self._calculate_stock_forecast(
                        sku, total_used, usage_count, forecast_period
                    )
                    forecasts.append(forecast)
                    
                    # Save forecast to database
                    self._save_stock_forecast(conn, forecast)
                
                conn.commit()
                
                return {
                    'success': True,
                    'forecast_period': forecast_period,
                    'forecasts': forecasts,
                    'total_skus_forecasted': len(forecasts),
                    'message': f'Generated {forecast_period} stock forecast for {len(forecasts)} SKUs'
                }
                
        except Exception as e:
            logger.error(f"Error generating maintenance stock forecast: {e}")
            return {'success': False, 'error': str(e)}

    def _calculate_stock_forecast(self, sku: str, total_used: int, usage_count: int, 
                                forecast_period: str) -> Dict[str, Any]:
        """Calculate stock forecast for a specific SKU"""
        try:
            # Calculate basic metrics
            avg_usage_per_cycle = total_used / usage_count if usage_count > 0 else 0
            
            # Period multipliers
            period_multipliers = {
                'weekly': 0.25,
                'monthly': 1.0,
                'quarterly': 3.0,
                'yearly': 12.0
            }
            
            multiplier = period_multipliers.get(forecast_period, 1.0)
            
            # Estimate cycles per period (rough estimate)
            estimated_cycles_per_month = usage_count / 3  # 3 months of data
            estimated_cycles_per_period = estimated_cycles_per_month * multiplier
            
            # Calculate predicted usage
            predicted_usage = int(avg_usage_per_cycle * estimated_cycles_per_period)
            
            # Add safety buffer (20% for variability)
            safety_buffer = int(predicted_usage * 0.2)
            recommended_stock = predicted_usage + safety_buffer
            
            # Confidence level based on data points
            confidence_level = min(0.9, usage_count / 10)  # Higher confidence with more data
            
            return {
                'sku': sku,
                'forecast_period': forecast_period,
                'predicted_usage': predicted_usage,
                'safety_buffer': safety_buffer,
                'recommended_stock_level': recommended_stock,
                'confidence_level': confidence_level,
                'historical_usage': total_used,
                'historical_cycles': usage_count,
                'avg_usage_per_cycle': avg_usage_per_cycle
            }
            
        except Exception as e:
            logger.error(f"Error calculating stock forecast for SKU {sku}: {e}")
            return {}

    def _save_stock_forecast(self, conn, forecast: Dict[str, Any]):
        """Save stock forecast to database"""
        try:
            conn.execute("""
                INSERT OR REPLACE INTO maintenance_stock_forecasting (
                    sku, forecast_period, predicted_usage, confidence_level,
                    recommended_stock_level, forecast_date, created_at
                ) VALUES (?, ?, ?, ?, ?, date('now'), CURRENT_TIMESTAMP)
            """, (
                forecast['sku'],
                forecast['forecast_period'],
                forecast['predicted_usage'],
                forecast['confidence_level'],
                forecast['recommended_stock_level']
            ))
            
        except Exception as e:
            logger.error(f"Error saving stock forecast: {e}")

    # =================== STOCK ALERTS & MONITORING ===================
    
    def monitor_maintenance_stock_levels(self) -> Dict[str, Any]:
        """Monitor stock levels for maintenance operations and generate alerts"""
        try:
            with get_db() as conn:
                alerts = []
                
                # Low stock alerts based on forecasting
                cursor = conn.execute("""
                    SELECT s.sku, s.location, s.quantity, s.available_quantity,
                           s.min_threshold, msf.recommended_stock_level,
                           COALESCE(p.name_ar, p.name_en, 'Unknown Product') as product_name
                    FROM stock s
                    LEFT JOIN maintenance_stock_forecasting msf ON s.sku = msf.sku
                    LEFT JOIN products p ON s.sku = p.sku
                    WHERE s.available_quantity <= COALESCE(msf.recommended_stock_level, s.min_threshold, 5)
                    AND s.location IN ('main_warehouse', 'technician_stock')
                    ORDER BY s.available_quantity ASC
                """)
                
                low_stock_items = cursor.fetchall()
                
                for item in low_stock_items:
                    sku, location, quantity, available, min_threshold, recommended, product_name = item
                    
                    alert = {
                        'alert_type': 'low_stock',
                        'sku': sku,
                        'product_name': product_name or 'Unknown',
                        'location': location,
                        'current_quantity': available,
                        'minimum_threshold': min_threshold or 0,
                        'recommended_level': recommended or min_threshold or 5,
                        'shortage': max(0, (recommended or min_threshold or 5) - available),
                        'priority': self._calculate_alert_priority(available, recommended or min_threshold or 5)
                    }
                    alerts.append(alert)
                
                # Reserved stock expiring alerts
                cursor = conn.execute("""
                    SELECT msr.sku, msr.quantity_reserved, msr.location,
                           msr.expires_at, mc.cycle_id, mc.assigned_technician_id
                    FROM maintenance_stock_reservations msr
                    JOIN maintenance_cycles mc ON msr.cycle_id = mc.cycle_id
                    WHERE msr.reservation_status = 'active'
                    AND datetime(msr.expires_at) <= datetime('now', '+2 hours')
                    ORDER BY msr.expires_at ASC
                """)
                
                expiring_reservations = cursor.fetchall()
                
                for reservation in expiring_reservations:
                    sku, qty_reserved, location, expires_at, cycle_id, technician_id = reservation
                    
                    alert = {
                        'alert_type': 'reservation_expiring',
                        'sku': sku,
                        'location': location,
                        'quantity_reserved': qty_reserved,
                        'expires_at': expires_at,
                        'cycle_id': cycle_id,
                        'technician_id': technician_id,
                        'priority': 'high'
                    }
                    alerts.append(alert)
                
                return {
                    'success': True,
                    'alerts': alerts,
                    'low_stock_alerts': len([a for a in alerts if a['alert_type'] == 'low_stock']),
                    'expiring_reservations': len([a for a in alerts if a['alert_type'] == 'reservation_expiring']),
                    'total_alerts': len(alerts)
                }
                
        except Exception as e:
            logger.error(f"Error monitoring maintenance stock levels: {e}")
            return {'success': False, 'error': str(e)}

    def _calculate_alert_priority(self, current_quantity: int, recommended_level: int) -> str:
        """Calculate alert priority based on stock levels"""
        if current_quantity <= 0:
            return 'critical'
        elif current_quantity <= recommended_level * 0.25:
            return 'high'
        elif current_quantity <= recommended_level * 0.5:
            return 'medium'
        else:
            return 'low' 