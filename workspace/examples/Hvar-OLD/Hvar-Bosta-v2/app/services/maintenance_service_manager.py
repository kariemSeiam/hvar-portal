"""
Comprehensive Maintenance & Repair Cycle Manager
Modular maintenance system with scheduling, technician assignment, parts tracking, 
SLA management, and real-time inventory integration according to HVAR_COMPLETE_CYCLE_SYSTEM.md.

Key Features:
- Modular scheduling system with SLA tracking
- Technician assignment and resource management
- Real-time parts tracking and inventory integration  
- Automated reminders for overdue repairs
- Complete stock management during maintenance operations
- Quality control and inspection workflows
"""

import logging
import sqlite3
from datetime import datetime, timedelta, date
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

class MaintenanceStatus(Enum):
    """Maintenance cycle status enumeration"""
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    PARTS_PENDING = "parts_pending"
    QUALITY_CHECK = "quality_check"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    OVERDUE = "overdue"

class MaintenancePriority(Enum):
    """Maintenance priority levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"
    CRITICAL = "critical"

class TechnicianStatus(Enum):
    """Technician availability status"""
    AVAILABLE = "available"
    BUSY = "busy"
    OFFLINE = "offline"
    ON_LEAVE = "on_leave"

@dataclass
class MaintenanceSLA:
    """SLA configuration for maintenance types"""
    maintenance_type: str
    response_time_hours: int
    resolution_time_hours: int
    escalation_time_hours: int
    priority_multiplier: float = 1.0

@dataclass
class TechnicianResource:
    """Technician resource information"""
    technician_id: str
    name: str
    skills: List[str]
    current_workload: int
    max_capacity: int
    location: str
    status: TechnicianStatus

class MaintenanceServiceManager:
    """
    Comprehensive Maintenance & Repair Cycle Manager
    
    Provides modular maintenance cycle management with:
    - Intelligent scheduling with SLA compliance
    - Dynamic technician assignment based on skills and workload
    - Real-time parts tracking and inventory management
    - Automated SLA monitoring and escalation
    - Complete stock movement tracking during maintenance
    """
    
    def __init__(self):
        self.product_manager = ProductManagement()
        self.sla_configs = self._load_sla_configurations()
        self._initialize_maintenance_tables()
    
    def _initialize_maintenance_tables(self):
        """Ensure production schema exists; avoid duplicating maintenance DDL."""
        try:
            with get_db() as conn:
                # Ensure authoritative schema is applied once
                conn.executescript(PRODUCTION_SCHEMA)
                conn.commit()
                logger.info("Maintenance database schema ensured via PRODUCTION_SCHEMA")
        except Exception as e:
            logger.error(f"Error initializing maintenance tables: {e}")
            raise

    def _load_sla_configurations(self) -> Dict[str, MaintenanceSLA]:
        """Load SLA configurations for different maintenance types"""
        return {
            'preventive': MaintenanceSLA('preventive', 24, 72, 48, 1.0),
            'corrective': MaintenanceSLA('corrective', 4, 24, 12, 1.5),
            'warranty': MaintenanceSLA('warranty', 8, 48, 24, 1.2),
            'emergency': MaintenanceSLA('emergency', 1, 4, 2, 3.0),
            'calibration': MaintenanceSLA('calibration', 48, 168, 96, 0.8),
            'upgrade': MaintenanceSLA('upgrade', 72, 240, 120, 0.6)
        }

    # =================== MAINTENANCE CYCLE CREATION ===================
    
    def create_maintenance_cycle(self, cycle_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a comprehensive maintenance cycle with automatic scheduling,
        technician assignment, parts allocation, and SLA setup
        """
        try:
            with get_db() as conn:
                # Validate required data
                validation_result = self._validate_cycle_data(cycle_data)
                if not validation_result['success']:
                    return validation_result
                
                # Create maintenance cycle record
                cycle_id = self._create_cycle_record(conn, cycle_data)
                
                # Setup SLA tracking
                sla_result = self._setup_sla_tracking(conn, cycle_id, cycle_data)
                
                # Assign technician
                technician_result = self._assign_technician(conn, cycle_id, cycle_data)
                
                # Allocate parts
                parts_result = self._allocate_parts(conn, cycle_id, cycle_data)
                
                # Update stock for allocated parts
                stock_result = self._update_stock_for_allocation(conn, cycle_id, parts_result['allocated_parts'])
                
                # Schedule quality inspections
                inspection_result = self._schedule_quality_inspections(conn, cycle_id)
                
                conn.commit()
                
                return {
                    'success': True,
                    'cycle_id': cycle_id,
                    'technician': technician_result.get('technician_id'),
                    'parts_allocated': len(parts_result.get('allocated_parts', [])),
                    'sla_deadlines': sla_result.get('deadlines', {}),
                    'stock_updated': stock_result.get('success', False),
                    'message': 'Maintenance cycle created successfully with full integration'
                }
                
        except Exception as e:
            logger.error(f"Error creating maintenance cycle: {e}")
            return {'success': False, 'error': str(e)}

    def _validate_cycle_data(self, cycle_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate maintenance cycle data"""
        required_fields = ['action_id', 'customer_phone', 'cycle_type', 'priority']
        
        for field in required_fields:
            if not cycle_data.get(field):
                return {'success': False, 'error': f'Required field "{field}" is missing'}
        
        # Validate cycle type
        valid_cycle_types = ['preventive', 'corrective', 'warranty', 'emergency', 'calibration', 'upgrade']
        if cycle_data['cycle_type'] not in valid_cycle_types:
            return {'success': False, 'error': f'Invalid cycle type. Must be one of: {valid_cycle_types}'}
        
        # Validate priority
        valid_priorities = [p.value for p in MaintenancePriority]
        if cycle_data['priority'] not in valid_priorities:
            return {'success': False, 'error': f'Invalid priority. Must be one of: {valid_priorities}'}
        
        return {'success': True}

    def _create_cycle_record(self, conn, cycle_data: Dict[str, Any]) -> int:
        """Create the main maintenance cycle record"""
        cursor = conn.execute("""
            INSERT INTO maintenance_cycles (
                action_id, customer_phone, order_id, tracking_number,
                cycle_type, maintenance_category, priority,
                scheduled_date, estimated_duration_hours,
                service_location, problem_description,
                parts_required_json, total_parts_cost,
                labor_cost, warranty_coverage,
                created_at, last_updated
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        """, (
            cycle_data['action_id'],
            cycle_data['customer_phone'],
            cycle_data.get('order_id'),
            cycle_data.get('tracking_number'),
            cycle_data['cycle_type'],
            cycle_data.get('maintenance_category', 'repair'),
            cycle_data['priority'],
            cycle_data.get('scheduled_date', date.today() + timedelta(days=1)),
            cycle_data.get('estimated_duration_hours', 2),
            cycle_data.get('service_location', 'customer_location'),
            cycle_data.get('problem_description', ''),
            json.dumps(cycle_data.get('parts_required', [])),
            cycle_data.get('total_parts_cost', 0),
            cycle_data.get('labor_cost', 0),
            cycle_data.get('warranty_coverage', False)
        ))
        
        return cursor.lastrowid

    def _setup_sla_tracking(self, conn, cycle_id: int, cycle_data: Dict[str, Any]) -> Dict[str, Any]:
        """Setup SLA tracking for the maintenance cycle"""
        cycle_type = cycle_data['cycle_type']
        priority = cycle_data['priority']
        
        sla_config = self.sla_configs.get(cycle_type)
        if not sla_config:
            return {'success': False, 'error': f'No SLA configuration for cycle type: {cycle_type}'}
        
        # Calculate priority multiplier
        priority_multipliers = {
            'low': 1.5, 'medium': 1.0, 'high': 0.7, 'urgent': 0.5, 'critical': 0.3
        }
        multiplier = priority_multipliers.get(priority, 1.0) * sla_config.priority_multiplier
        
        # Calculate SLA deadlines
        now = datetime.now()
        response_deadline = now + timedelta(hours=int(sla_config.response_time_hours * multiplier))
        resolution_deadline = now + timedelta(hours=int(sla_config.resolution_time_hours * multiplier))
        escalation_deadline = now + timedelta(hours=int(sla_config.escalation_time_hours * multiplier))
        
        # Update maintenance cycle with SLA deadlines
        conn.execute("""
            UPDATE maintenance_cycles 
            SET sla_response_deadline = ?, sla_resolution_deadline = ?, sla_escalation_deadline = ?
            WHERE cycle_id = ?
        """, (response_deadline, resolution_deadline, escalation_deadline, cycle_id))
        
        # Create SLA tracking records
        sla_types = [
            ('response', response_deadline),
            ('resolution', resolution_deadline), 
            ('escalation', escalation_deadline)
        ]
        
        for sla_type, deadline in sla_types:
            conn.execute("""
                INSERT INTO maintenance_sla_tracking (
                    cycle_id, sla_type, target_deadline, created_at
                ) VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            """, (cycle_id, sla_type, deadline))
        
        return {
            'success': True,
            'deadlines': {
                'response': response_deadline.isoformat(),
                'resolution': resolution_deadline.isoformat(),
                'escalation': escalation_deadline.isoformat()
            }
        }

    # =================== TECHNICIAN ASSIGNMENT ===================
    
    def _assign_technician(self, conn, cycle_id: int, cycle_data: Dict[str, Any]) -> Dict[str, Any]:
        """Intelligent technician assignment based on skills, workload, and location"""
        try:
            # Get maintenance cycle details
            cursor = conn.execute("""
                SELECT cycle_type, maintenance_category, priority, service_location
                FROM maintenance_cycles WHERE cycle_id = ?
            """, (cycle_id,))
            cycle_info = cursor.fetchone()
            
            if not cycle_info:
                return {'success': False, 'error': 'Maintenance cycle not found'}
            
            cycle_type, maintenance_category, priority, service_location = cycle_info
            
            # Find best available technician
            best_technician = self._find_best_technician(conn, {
                'cycle_type': cycle_type,
                'maintenance_category': maintenance_category,
                'priority': priority,
                'service_location': service_location,
                'required_skills': cycle_data.get('required_skills', [])
            })
            
            if not best_technician:
                return {'success': False, 'error': 'No available technician found'}
            
            # Assign technician
            conn.execute("""
                UPDATE maintenance_cycles 
                SET assigned_technician_id = ?, technician_team = ?
                WHERE cycle_id = ?
            """, (best_technician['technician_id'], best_technician.get('team'), cycle_id))
            
            # Update technician workload
            conn.execute("""
                UPDATE technician_resources 
                SET current_workload = current_workload + 1, updated_at = CURRENT_TIMESTAMP
                WHERE technician_id = ?
            """, (best_technician['technician_id'],))
            
            return {
                'success': True,
                'technician_id': best_technician['technician_id'],
                'technician_name': best_technician['name'],
                'assignment_reason': best_technician.get('assignment_reason', 'Best match')
            }
            
        except Exception as e:
            logger.error(f"Error assigning technician for cycle {cycle_id}: {e}")
            return {'success': False, 'error': str(e)}

    def _find_best_technician(self, conn, requirements: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Find the best available technician based on requirements"""
        try:
            # Get available technicians
            cursor = conn.execute("""
                SELECT technician_id, name, skills_json, certification_level,
                       current_workload, max_concurrent_jobs, location
                FROM technician_resources 
                WHERE status = 'available' AND is_active = 1
                AND current_workload < max_concurrent_jobs
                ORDER BY current_workload ASC, certification_level DESC
            """)
            
            technicians = cursor.fetchall()
            if not technicians:
                return None
            
            # Score technicians based on requirements
            scored_technicians = []
            for tech in technicians:
                tech_id, name, skills_json, cert_level, workload, max_jobs, location = tech
                
                try:
                    skills = json.loads(skills_json) if skills_json else []
                except:
                    skills = []
                
                score = self._calculate_technician_score(
                    skills, cert_level, workload, max_jobs, location, requirements
                )
                
                scored_technicians.append({
                    'technician_id': tech_id,
                    'name': name,
                    'skills': skills,
                    'score': score,
                    'workload': workload,
                    'assignment_reason': f'Score: {score:.2f}, Skills match, Low workload'
                })
            
            # Return best match
            if scored_technicians:
                best_tech = max(scored_technicians, key=lambda x: x['score'])
                return best_tech if best_tech['score'] > 0 else None
            
            return None
            
        except Exception as e:
            logger.error(f"Error finding best technician: {e}")
            return None

    def _calculate_technician_score(self, skills: List[str], cert_level: str, 
                                  workload: int, max_jobs: int, location: str,
                                  requirements: Dict[str, Any]) -> float:
        """Calculate technician suitability score"""
        score = 0.0
        
        # Skills matching (40% of score)
        required_skills = requirements.get('required_skills', [])
        if required_skills:
            skills_match = len(set(skills) & set(required_skills)) / len(required_skills)
            score += skills_match * 0.4
        else:
            score += 0.4  # No specific skills required
        
        # Certification level (25% of score)
        cert_scores = {'junior': 0.5, 'senior': 0.8, 'expert': 1.0}
        score += cert_scores.get(cert_level, 0.5) * 0.25
        
        # Workload availability (25% of score)
        workload_ratio = 1.0 - (workload / max_jobs)
        score += workload_ratio * 0.25
        
        # Location proximity (10% of score)
        service_location = requirements.get('service_location', '')
        if location and service_location:
            location_match = 1.0 if location.lower() in service_location.lower() else 0.5
            score += location_match * 0.1
        else:
            score += 0.05  # Partial score if no location info
        
        return score

    # =================== PARTS ALLOCATION ===================
    
    def _allocate_parts(self, conn, cycle_id: int, cycle_data: Dict[str, Any]) -> Dict[str, Any]:
        """Allocate required parts for maintenance cycle"""
        try:
            parts_required = cycle_data.get('parts_required', [])
            if not parts_required:
                return {'success': True, 'allocated_parts': []}
            
            # Ensure parts_required is a list
            if not isinstance(parts_required, list):
                return {'success': True, 'allocated_parts': []}
            
            allocated_parts = []
            allocation_errors = []
            
            for part_req in parts_required:
                try:
                    # Ensure part_req is a dictionary with required fields
                    if not isinstance(part_req, dict) or 'sku' not in part_req:
                        allocation_errors.append(f"Invalid part requirement: {part_req}")
                        continue
                        
                    allocation_result = self._allocate_single_part(conn, cycle_id, part_req)
                    if allocation_result['success']:
                        allocated_parts.append(allocation_result['allocation'])
                    else:
                        allocation_errors.append(f"Part {part_req.get('sku', 'unknown')}: {allocation_result['error']}")
                except Exception as e:
                    allocation_errors.append(f"Part {part_req.get('sku', 'unknown')}: {str(e)}")
            
            # Update maintenance cycle with allocated parts
            conn.execute("""
                UPDATE maintenance_cycles 
                SET parts_allocated_json = ?
                WHERE cycle_id = ?
            """, (json.dumps(allocated_parts), cycle_id))
            
            return {
                'success': len(allocation_errors) == 0,
                'allocated_parts': allocated_parts,
                'allocation_errors': allocation_errors,
                'parts_count': len(allocated_parts)
            }
            
        except Exception as e:
            logger.error(f"Error allocating parts for cycle {cycle_id}: {e}")
            return {'success': False, 'error': str(e)}

    def _allocate_single_part(self, conn, cycle_id: int, part_requirement: Dict[str, Any]) -> Dict[str, Any]:
        """Allocate a single part for maintenance cycle"""
        sku = part_requirement.get('sku')
        quantity_required = part_requirement.get('quantity', 1)
        
        if not sku:
            return {'success': False, 'error': 'SKU is required'}
        
        # Check stock availability
        cursor = conn.execute("""
            SELECT stock_id, quantity, available_quantity, location
            FROM stock 
            WHERE sku = ? AND location IN ('main_warehouse', 'technician_stock')
            AND available_quantity >= ?
            ORDER BY location = 'technician_stock' DESC, available_quantity DESC
        """, (sku, quantity_required))
        
        stock_record = cursor.fetchone()
        if not stock_record:
            return {'success': False, 'error': f'Insufficient stock for SKU {sku}'}
        
        stock_id, total_qty, available_qty, location = stock_record
        
        # Get part cost information
        part_cost = self._get_part_cost(conn, sku)
        total_cost = part_cost * quantity_required
        
        # Create allocation record
        cursor = conn.execute("""
            INSERT INTO maintenance_parts_allocation (
                cycle_id, sku, quantity_required, quantity_allocated,
                unit_cost, total_cost, allocation_status, allocated_at
            ) VALUES (?, ?, ?, ?, ?, ?, 'allocated', CURRENT_TIMESTAMP)
        """, (cycle_id, sku, quantity_required, quantity_required, part_cost, total_cost))
        
        allocation_id = cursor.lastrowid
        
        # Reserve stock
        conn.execute("""
            UPDATE stock 
            SET reserved_quantity = reserved_quantity + ?,
                available_quantity = available_quantity - ?
            WHERE stock_id = ?
        """, (quantity_required, quantity_required, stock_id))
        
        return {
            'success': True,
            'allocation': {
                'allocation_id': allocation_id,
                'sku': sku,
                'quantity_allocated': quantity_required,
                'unit_cost': part_cost,
                'total_cost': total_cost,
                'location': location,
                'allocation_status': 'allocated'
            }
        }

    def _get_part_cost(self, conn, sku: str) -> float:
        """Get part cost from product management or stock system"""
        try:
            # Try to get cost from products table
            cursor = conn.execute("""
                SELECT selling_price FROM products WHERE sku = ?
            """, (sku,))
            result = cursor.fetchone()
            
            if result and result[0]:
                return float(result[0])
            
            # Default cost if not found
            return 0.0
            
        except Exception as e:
            logger.error(f"Error getting part cost for SKU {sku}: {e}")
            return 0.0

    def _update_stock_for_allocation(self, conn, cycle_id: int, allocated_parts: List[Dict]) -> Dict[str, Any]:
        """Update stock levels for allocated parts"""
        try:
            # Handle case where allocated_parts might be a string or None
            if not allocated_parts or not isinstance(allocated_parts, list):
                return {'success': True, 'message': 'No parts to update'}
            
            updated_parts = []
            for part in allocated_parts:
                if isinstance(part, dict) and 'sku' in part:
                    # Update stock reservation
                    conn.execute("""
                        UPDATE stock 
                        SET reserved_quantity = reserved_quantity + ?,
                            available_quantity = available_quantity - ?
                        WHERE sku = ? AND location = ?
                    """, (
                        part.get('quantity_allocated', 1),
                        part.get('quantity_allocated', 1),
                        part['sku'],
                        part.get('location', 'main_warehouse')
                    ))
                    updated_parts.append(part['sku'])
            
            return {
                'success': True,
                'updated_parts': updated_parts,
                'message': f'Updated stock for {len(updated_parts)} parts'
            }
            
        except Exception as e:
            logger.error(f"Error updating stock for allocation: {e}")
            return {'success': False, 'error': str(e)}

    def _schedule_quality_inspections(self, conn, cycle_id: int) -> Dict[str, Any]:
        """Schedule quality inspections for maintenance cycle"""
        try:
            inspection_types = ['pre_service', 'post_service', 'final_check']
            
            for inspection_type in inspection_types:
                conn.execute("""
                    INSERT INTO maintenance_quality_inspections (
                        cycle_id, inspection_type, inspection_status, created_at
                    ) VALUES (?, ?, 'pending', CURRENT_TIMESTAMP)
                """, (cycle_id, inspection_type))
            
            return {
                'success': True,
                'inspections_scheduled': len(inspection_types)
            }
            
        except Exception as e:
            logger.error(f"Error scheduling quality inspections for cycle {cycle_id}: {e}")
            return {'success': False, 'error': str(e)}

    # =================== MAINTENANCE EXECUTION ===================
    
    def start_maintenance_cycle(self, cycle_id: int, execution_data: Dict[str, Any]) -> Dict[str, Any]:
        """Start maintenance cycle execution with real-time tracking"""
        try:
            with get_db() as conn:
                # Validate cycle exists and is scheduled
                cursor = conn.execute("""
                    SELECT cycle_status, assigned_technician_id, parts_allocated_json
                    FROM maintenance_cycles WHERE cycle_id = ?
                """, (cycle_id,))
                
                cycle_info = cursor.fetchone()
                if not cycle_info:
                    return {'success': False, 'error': 'Maintenance cycle not found'}
                
                status, technician_id, parts_json = cycle_info
                from app.constants.statuses import MaintenanceCycleStatus
                if status not in [MaintenanceCycleStatus.SCHEDULED, MaintenanceCycleStatus.PARTS_PENDING]:
                    return {'success': False, 'error': f'Cannot start cycle with status: {status}'}
                
                # Update cycle status to in_progress
                conn.execute("""
                    UPDATE maintenance_cycles 
                    SET cycle_status = 'in_progress', started_at = CURRENT_TIMESTAMP,
                        progress_percentage = 10, last_updated = CURRENT_TIMESTAMP
                    WHERE cycle_id = ?
                """, (cycle_id,))
                
                # Update SLA tracking
                sla_result = self._update_sla_on_start(conn, cycle_id)
                
                # Create pre-service inspection
                inspection_result = self._create_pre_service_inspection(conn, cycle_id, execution_data)
                
                # Update technician status
                if technician_id:
                    conn.execute("""
                        UPDATE technician_resources 
                        SET status = 'busy', updated_at = CURRENT_TIMESTAMP
                        WHERE technician_id = ?
                    """, (technician_id,))
                
                conn.commit()
                
                return {
                    'success': True,
                    'cycle_id': cycle_id,
                    'status': MaintenanceCycleStatus.IN_PROGRESS,
                    'technician_id': technician_id,
                    'sla_updated': sla_result.get('success', False),
                    'inspection_created': inspection_result.get('success', False),
                    'message': 'Maintenance cycle started successfully'
                }
                
        except Exception as e:
            logger.error(f"Error starting maintenance cycle {cycle_id}: {e}")
            return {'success': False, 'error': str(e)}

    def _update_sla_on_start(self, conn, cycle_id: int) -> Dict[str, Any]:
        """Update SLA tracking when maintenance starts"""
        try:
            # Mark response SLA as met
            conn.execute("""
                UPDATE maintenance_sla_tracking 
                SET actual_completion = CURRENT_TIMESTAMP, is_met = 1
                WHERE cycle_id = ? AND sla_type = 'response'
            """, (cycle_id,))
            
            return {'success': True}
            
        except Exception as e:
            logger.error(f"Error updating SLA for cycle {cycle_id}: {e}")
            return {'success': False, 'error': str(e)}

    def _create_pre_service_inspection(self, conn, cycle_id: int, execution_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create pre-service inspection record"""
        try:
            technician_id = execution_data.get('technician_id')
            
            cursor = conn.execute("""
                INSERT INTO maintenance_quality_inspections (
                    cycle_id, inspector_id, inspection_type, 
                    inspection_notes, created_at
                ) VALUES (?, ?, 'pre_service', ?, CURRENT_TIMESTAMP)
            """, (
                cycle_id,
                technician_id,
                execution_data.get('pre_service_notes', 'Pre-service inspection started')
            ))
            
            return {
                'success': True,
                'inspection_id': cursor.lastrowid
            }
            
        except Exception as e:
            logger.error(f"Error creating pre-service inspection for cycle {cycle_id}: {e}")
            return {'success': False, 'error': str(e)}

    # =================== PARTS USAGE TRACKING ===================
    
    def record_parts_usage(self, cycle_id: int, parts_usage: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Record actual parts usage during maintenance with real-time stock updates"""
        try:
            with get_db() as conn:
                usage_records = []
                stock_updates = []
                
                for part_usage in parts_usage:
                    usage_result = self._record_single_part_usage(conn, cycle_id, part_usage)
                    if usage_result['success']:
                        usage_records.append(usage_result['usage_record'])
                        if usage_result.get('stock_update'):
                            stock_updates.append(usage_result['stock_update'])
                
                # Update maintenance cycle with used parts
                conn.execute("""
                    UPDATE maintenance_cycles 
                    SET parts_used_json = ?, progress_percentage = 50,
                        last_updated = CURRENT_TIMESTAMP
                    WHERE cycle_id = ?
                """, (json.dumps(usage_records), cycle_id))
                
                conn.commit()
                
                return {
                    'success': True,
                    'usage_records': usage_records,
                    'stock_updates': stock_updates,
                    'parts_used_count': len(usage_records)
                }
                
        except Exception as e:
            logger.error(f"Error recording parts usage for cycle {cycle_id}: {e}")
            return {'success': False, 'error': str(e)}

    def _record_single_part_usage(self, conn, cycle_id: int, part_usage: Dict[str, Any]) -> Dict[str, Any]:
        """Record usage of a single part with stock update"""
        try:
            sku = part_usage.get('sku')
            quantity_used = part_usage.get('quantity_used', 1)
            condition_before = part_usage.get('condition_before', 'unknown')
            condition_after = part_usage.get('condition_after', 'used')
            usage_notes = part_usage.get('notes', '')
            
            # Update allocation record
            conn.execute("""
                UPDATE maintenance_parts_allocation 
                SET quantity_used = ?, condition_before = ?, condition_after = ?,
                    allocation_status = 'used', used_at = CURRENT_TIMESTAMP
                WHERE cycle_id = ? AND sku = ?
            """, (quantity_used, condition_before, condition_after, cycle_id, sku))
            
            # Update stock - convert reserved to used
            conn.execute("""
                UPDATE stock 
                SET reserved_quantity = reserved_quantity - ?,
                    quantity = quantity - ?
                WHERE sku = ? AND location = 'technician_stock'
            """, (quantity_used, quantity_used, sku))
            
            # Record stock movement
            conn.execute("""
                INSERT INTO stock_movements (
                    sku, location_from, quantity, movement_type,
                    reference_id, reference_type, notes, created_at
                ) VALUES (?, 'technician_stock', ?, 'service',
                         ?, 'maintenance_cycle', ?, CURRENT_TIMESTAMP)
            """, (sku, -quantity_used, str(cycle_id), f"Used in maintenance: {usage_notes}"))
            
            return {
                'success': True,
                'usage_record': {
                    'sku': sku,
                    'quantity_used': quantity_used,
                    'condition_before': condition_before,
                    'condition_after': condition_after,
                    'notes': usage_notes
                },
                'stock_update': {
                    'sku': sku,
                    'quantity_used': quantity_used,
                    'location': 'technician_stock'
                }
            }
            
        except Exception as e:
            logger.error(f"Error recording single part usage: {e}")
            return {'success': False, 'error': str(e)}

    # =================== MAINTENANCE COMPLETION ===================
    
    def complete_maintenance_cycle(self, cycle_id: int, completion_data: Dict[str, Any]) -> Dict[str, Any]:
        """Complete maintenance cycle with quality control and final stock updates"""
        try:
            with get_db() as conn:
                # Validate cycle can be completed
                cursor = conn.execute("""
                    SELECT cycle_status, assigned_technician_id 
                    FROM maintenance_cycles WHERE cycle_id = ?
                """, (cycle_id,))
                
                cycle_info = cursor.fetchone()
                if not cycle_info:
                    return {'success': False, 'error': 'Maintenance cycle not found'}
                
                status, technician_id = cycle_info
                from app.constants.statuses import MaintenanceCycleStatus
                if status != MaintenanceCycleStatus.IN_PROGRESS:
                    return {'success': False, 'error': f'Cannot complete cycle with status: {status}'}
                
                # Perform final quality inspection
                quality_result = self._perform_final_quality_inspection(conn, cycle_id, completion_data)
                
                # Handle returned parts
                returns_result = self._handle_returned_parts(conn, cycle_id, completion_data.get('returned_parts', []))
                
                # Update cycle completion
                conn.execute("""
                    UPDATE maintenance_cycles 
                    SET cycle_status = 'completed', completed_at = CURRENT_TIMESTAMP,
                        progress_percentage = 100, solution_description = ?,
                        repair_notes = ?, quality_check_passed = ?,
                        customer_satisfaction = ?, last_updated = CURRENT_TIMESTAMP
                    WHERE cycle_id = ?
                """, (
                    completion_data.get('solution_description', ''),
                    completion_data.get('repair_notes', ''),
                    quality_result.get('quality_passed', False),
                    completion_data.get('customer_satisfaction', 3),
                    cycle_id
                ))
                
                # Update SLA completion
                sla_result = self._complete_sla_tracking(conn, cycle_id)
                
                # Release technician
                if technician_id:
                    conn.execute("""
                        UPDATE technician_resources 
                        SET current_workload = current_workload - 1, status = 'available',
                            updated_at = CURRENT_TIMESTAMP
                        WHERE technician_id = ?
                    """, (technician_id,))
                
                conn.commit()
                
                return {
                    'success': True,
                    'cycle_id': cycle_id,
                    'status': 'completed',
                    'quality_passed': quality_result.get('quality_passed', False),
                    'quality_score': quality_result.get('quality_score'),
                    'parts_returned': len(completion_data.get('returned_parts', [])),
                    'sla_met': sla_result.get('sla_met', False),
                    'message': 'Maintenance cycle completed successfully'
                }
                
        except Exception as e:
            logger.error(f"Error completing maintenance cycle {cycle_id}: {e}")
            return {'success': False, 'error': str(e)}

    def _perform_final_quality_inspection(self, conn, cycle_id: int, completion_data: Dict[str, Any]) -> Dict[str, Any]:
        """Perform final quality inspection"""
        try:
            quality_score = completion_data.get('quality_score', 8)
            quality_notes = completion_data.get('quality_notes', '')
            visual_passed = completion_data.get('visual_inspection_passed', True)
            functional_passed = completion_data.get('functional_test_passed', True)
            safety_passed = completion_data.get('safety_check_passed', True)
            
            overall_passed = visual_passed and functional_passed and safety_passed and quality_score >= 7
            
            cursor = conn.execute("""
                INSERT INTO maintenance_quality_inspections (
                    cycle_id, inspection_type, quality_score,
                    visual_inspection_passed, functional_test_passed, safety_check_passed,
                    inspection_notes, inspection_status, approved_for_delivery,
                    completed_at, created_at
                ) VALUES (?, 'final_check', ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            """, (
                cycle_id, quality_score, visual_passed, functional_passed,
                safety_passed, quality_notes, 
                'passed' if overall_passed else 'failed',
                overall_passed
            ))
            
            return {
                'success': True,
                'quality_passed': overall_passed,
                'quality_score': quality_score,
                'inspection_id': cursor.lastrowid
            }
            
        except Exception as e:
            logger.error(f"Error performing final quality inspection for cycle {cycle_id}: {e}")
            return {'success': False, 'error': str(e)}

    def _handle_returned_parts(self, conn, cycle_id: int, returned_parts: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Handle returned parts and update stock"""
        try:
            returns_processed = 0
            
            for returned_part in returned_parts:
                sku = returned_part.get('sku')
                quantity_returned = returned_part.get('quantity_returned', 1)
                condition = returned_part.get('condition', 'used')
                
                # Update allocation record
                conn.execute("""
                    UPDATE maintenance_parts_allocation 
                    SET quantity_returned = ?, allocation_status = 'returned',
                        returned_at = CURRENT_TIMESTAMP
                    WHERE cycle_id = ? AND sku = ?
                """, (quantity_returned, cycle_id, sku))
                
                # Return to stock based on condition
                if condition in ['good', 'refurbished']:
                    location = 'main_warehouse'
                elif condition == 'damaged':
                    location = 'damaged_stock'
                else:
                    location = 'main_warehouse'  # Default
                
                # Update stock
                conn.execute("""
                    UPDATE stock 
                    SET quantity = quantity + ?, available_quantity = available_quantity + ?
                    WHERE sku = ? AND location = ?
                """, (quantity_returned, quantity_returned, sku, location))
                
                # Record stock movement
                conn.execute("""
                    INSERT INTO stock_movements (
                        sku, location_to, quantity, movement_type,
                        reference_id, reference_type, notes, created_at
                    ) VALUES (?, ?, ?, 'return', ?, 'maintenance_cycle', ?, CURRENT_TIMESTAMP)
                """, (
                    sku, location, quantity_returned, str(cycle_id),
                    f"Returned from maintenance cycle {cycle_id} - condition: {condition}"
                ))
                
                returns_processed += 1
            
            return {
                'success': True,
                'returns_processed': returns_processed
            }
            
        except Exception as e:
            logger.error(f"Error handling returned parts for cycle {cycle_id}: {e}")
            return {'success': False, 'error': str(e)}

    def _complete_sla_tracking(self, conn, cycle_id: int) -> Dict[str, Any]:
        """Complete SLA tracking for maintenance cycle"""
        try:
            # Update resolution SLA
            conn.execute("""
                UPDATE maintenance_sla_tracking 
                SET actual_completion = CURRENT_TIMESTAMP,
                    is_met = CASE 
                        WHEN CURRENT_TIMESTAMP <= target_deadline THEN 1
                        ELSE 0
                    END,
                    violation_minutes = CASE
                        WHEN CURRENT_TIMESTAMP > target_deadline THEN
                            CAST((julianday(CURRENT_TIMESTAMP) - julianday(target_deadline)) * 24 * 60 AS INTEGER)
                        ELSE 0
                    END
                WHERE cycle_id = ? AND sla_type = 'resolution'
            """, (cycle_id,))
            
            # Check if SLA was met
            cursor = conn.execute("""
                SELECT is_met FROM maintenance_sla_tracking 
                WHERE cycle_id = ? AND sla_type = 'resolution'
            """, (cycle_id,))
            
            result = cursor.fetchone()
            sla_met = bool(result[0]) if result else False
            
            return {
                'success': True,
                'sla_met': sla_met
            }
            
        except Exception as e:
            logger.error(f"Error completing SLA tracking for cycle {cycle_id}: {e}")
            return {'success': False, 'error': str(e)}

    # =================== SLA MONITORING & ALERTS ===================
    
    def monitor_sla_violations(self) -> Dict[str, Any]:
        """Delegate SLA monitoring to dedicated monitor service to avoid duplication"""
        try:
            from app.services.maintenance_sla_monitor import MaintenanceSLAMonitor
            monitor = MaintenanceSLAMonitor()
            return monitor.check_sla_violations()
        except Exception as e:
            logger.error(f"Error monitoring SLA violations: {e}")
            return {'success': False, 'error': str(e)}



    def _process_sla_violation(self, conn, sla_id: int, cycle_id: int, sla_type: str) -> Dict[str, Any]:
        """Process SLA violation with escalation"""
        try:
            # Calculate violation time
            cursor = conn.execute("""
                SELECT target_deadline FROM maintenance_sla_tracking WHERE sla_id = ?
            """, (sla_id,))
            deadline_result = cursor.fetchone()
            
            if deadline_result:
                deadline = datetime.fromisoformat(deadline_result[0])
                violation_minutes = int((datetime.now() - deadline).total_seconds() / 60)
                
                # Determine escalation level based on violation time
                if violation_minutes > 480:  # 8 hours
                    escalation_level = 3  # Director
                elif violation_minutes > 240:  # 4 hours
                    escalation_level = 2  # Manager
                elif violation_minutes > 60:  # 1 hour
                    escalation_level = 1  # Supervisor
                else:
                    escalation_level = 0  # No escalation yet
                
                # Update SLA tracking
                conn.execute("""
                    UPDATE maintenance_sla_tracking 
                    SET violation_notified = 1, violation_notified_at = CURRENT_TIMESTAMP,
                        violation_minutes = ?, escalation_level = ?
                    WHERE sla_id = ?
                """, (violation_minutes, escalation_level, sla_id))
                

                
                return {
                    'success': True,
                    'violation_minutes': violation_minutes,
                    'escalation_level': escalation_level
                }
            
            return {'success': False, 'error': 'Could not calculate violation time'}
            
        except Exception as e:
            logger.error(f"Error processing SLA violation: {e}")
            return {'success': False, 'error': str(e)}



    # =================== ANALYTICS & REPORTING ===================
    
    def get_maintenance_analytics(self, date_from: str = None, date_to: str = None) -> Dict[str, Any]:
        """Get comprehensive maintenance analytics"""
        try:
            with get_db() as conn:
                # Default date range (last 30 days)
                if not date_from:
                    date_from = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
                if not date_to:
                    date_to = datetime.now().strftime('%Y-%m-%d')
                
                # Maintenance cycle statistics
                cursor = conn.execute("""
                    SELECT 
                        COUNT(*) as total_cycles,
                        COUNT(CASE WHEN cycle_status = 'completed' THEN 1 END) as completed_cycles,
                        COUNT(CASE WHEN cycle_status = 'in_progress' THEN 1 END) as active_cycles,
                        COUNT(CASE WHEN cycle_status = 'overdue' THEN 1 END) as overdue_cycles,
                        AVG(CASE WHEN completed_at IS NOT NULL THEN 
                            (julianday(completed_at) - julianday(started_at)) * 24 
                        END) as avg_completion_hours,
                        AVG(quality_score) as avg_quality_score,
                        AVG(customer_satisfaction) as avg_customer_satisfaction
                    FROM maintenance_cycles 
                    WHERE date(created_at) BETWEEN ? AND ?
                """, (date_from, date_to))
                
                cycle_stats = cursor.fetchone()
                
                # SLA performance
                cursor = conn.execute("""
                    SELECT 
                        COUNT(*) as total_slas,
                        COUNT(CASE WHEN is_met = 1 THEN 1 END) as slas_met,
                        AVG(CASE WHEN violation_minutes > 0 THEN violation_minutes END) as avg_violation_minutes
                    FROM maintenance_sla_tracking sla
                    JOIN maintenance_cycles mc ON sla.cycle_id = mc.cycle_id
                    WHERE date(mc.created_at) BETWEEN ? AND ?
                """, (date_from, date_to))
                
                sla_stats = cursor.fetchone()
                
                # Parts usage statistics
                cursor = conn.execute("""
                    SELECT 
                        COUNT(DISTINCT sku) as unique_parts_used,
                        SUM(quantity_used) as total_parts_quantity,
                        SUM(total_cost) as total_parts_cost
                    FROM maintenance_parts_allocation mpa
                    JOIN maintenance_cycles mc ON mpa.cycle_id = mc.cycle_id
                    WHERE date(mc.created_at) BETWEEN ? AND ?
                    AND mpa.allocation_status = 'used'
                """, (date_from, date_to))
                
                parts_stats = cursor.fetchone()
                
                # Technician performance
                cursor = conn.execute("""
                    SELECT 
                        assigned_technician_id,
                        COUNT(*) as cycles_assigned,
                        COUNT(CASE WHEN cycle_status = 'completed' THEN 1 END) as cycles_completed,
                        AVG(quality_score) as avg_quality_score
                    FROM maintenance_cycles 
                    WHERE date(created_at) BETWEEN ? AND ?
                    AND assigned_technician_id IS NOT NULL
                    GROUP BY assigned_technician_id
                    ORDER BY cycles_completed DESC
                    LIMIT 10
                """, (date_from, date_to))
                
                technician_stats = cursor.fetchall()
                
                return {
                    'success': True,
                    'date_range': {'from': date_from, 'to': date_to},
                    'cycle_statistics': {
                        'total_cycles': cycle_stats[0] if cycle_stats else 0,
                        'completed_cycles': cycle_stats[1] if cycle_stats else 0,
                        'active_cycles': cycle_stats[2] if cycle_stats else 0,
                        'overdue_cycles': cycle_stats[3] if cycle_stats else 0,
                        'avg_completion_hours': round(cycle_stats[4], 2) if cycle_stats and cycle_stats[4] else 0,
                        'avg_quality_score': round(cycle_stats[5], 2) if cycle_stats and cycle_stats[5] else 0,
                        'avg_customer_satisfaction': round(cycle_stats[6], 2) if cycle_stats and cycle_stats[6] else 0
                    },
                    'sla_performance': {
                        'total_slas': sla_stats[0] if sla_stats else 0,
                        'slas_met': sla_stats[1] if sla_stats else 0,
                        'sla_compliance_rate': round((sla_stats[1] / sla_stats[0] * 100), 2) if sla_stats and sla_stats[0] > 0 else 0,
                        'avg_violation_minutes': round(sla_stats[2], 2) if sla_stats and sla_stats[2] else 0
                    },
                    'parts_usage': {
                        'unique_parts_used': parts_stats[0] if parts_stats else 0,
                        'total_parts_quantity': parts_stats[1] if parts_stats else 0,
                        'total_parts_cost': float(parts_stats[2]) if parts_stats and parts_stats[2] else 0
                    },
                    'technician_performance': [
                        {
                            'technician_id': row[0],
                            'cycles_assigned': row[1],
                            'cycles_completed': row[2],
                            'completion_rate': round(row[2]/row[1]*100, 2) if row[1] > 0 else 0,
                            'avg_quality_score': round(row[3], 2) if row[3] else 0
                        }
                        for row in technician_stats
                    ]
                }
                
        except Exception as e:
            logger.error(f"Error getting maintenance analytics: {e}")
            return {'success': False, 'error': str(e)}

    # =================== TECHNICIAN MANAGEMENT ===================
    
    def register_technician(self, technician_data: Dict[str, Any]) -> Dict[str, Any]:
        """Register a new technician resource"""
        try:
            with get_db() as conn:
                cursor = conn.execute("""
                    INSERT INTO technician_resources (
                        technician_id, name, email, phone, skills_json,
                        certification_level, max_concurrent_jobs, location,
                        shift_start, shift_end, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """, (
                    technician_data['technician_id'],
                    technician_data['name'],
                    technician_data.get('email'),
                    technician_data.get('phone'),
                    json.dumps(technician_data.get('skills', [])),
                    technician_data.get('certification_level', 'junior'),
                    technician_data.get('max_concurrent_jobs', 3),
                    technician_data.get('location'),
                    technician_data.get('shift_start'),
                    technician_data.get('shift_end')
                ))
                
                conn.commit()
                
                return {
                    'success': True,
                    'technician_id': technician_data['technician_id'],
                    'message': 'Technician registered successfully'
                }
                
        except sqlite3.IntegrityError:
            return {'success': False, 'error': 'Technician ID already exists'}
        except Exception as e:
            logger.error(f"Error registering technician: {e}")
            return {'success': False, 'error': str(e)}

    def get_technician_workload(self, technician_id: str = None) -> Dict[str, Any]:
        """Get current workload for technician(s)"""
        try:
            with get_db() as conn:
                if technician_id:
                    cursor = conn.execute("""
                        SELECT tr.technician_id, tr.name, tr.current_workload, tr.max_concurrent_jobs,
                               tr.status, COUNT(mc.cycle_id) as active_cycles
                        FROM technician_resources tr
                        LEFT JOIN maintenance_cycles mc ON tr.technician_id = mc.assigned_technician_id
                            AND mc.cycle_status IN ('scheduled', 'in_progress')
                        WHERE tr.technician_id = ?
                        GROUP BY tr.technician_id
                    """, (technician_id,))
                    
                    result = cursor.fetchone()
                    if result:
                        return {
                            'success': True,
                            'technician': {
                                'technician_id': result[0],
                                'name': result[1],
                                'current_workload': result[2],
                                'max_concurrent_jobs': result[3],
                                'status': result[4],
                                'active_cycles': result[5],
                                'capacity_utilization': round(result[2]/result[3]*100, 2) if result[3] > 0 else 0
                            }
                        }
                    else:
                        return {'success': False, 'error': 'Technician not found'}
                else:
                    cursor = conn.execute("""
                        SELECT tr.technician_id, tr.name, tr.current_workload, tr.max_concurrent_jobs,
                               tr.status, COUNT(mc.cycle_id) as active_cycles
                        FROM technician_resources tr
                        LEFT JOIN maintenance_cycles mc ON tr.technician_id = mc.assigned_technician_id
                            AND mc.cycle_status IN ('scheduled', 'in_progress')
                        WHERE tr.is_active = 1
                        GROUP BY tr.technician_id
                        ORDER BY tr.current_workload ASC
                    """)
                    
                    results = cursor.fetchall()
                    return {
                        'success': True,
                        'technicians': [
                            {
                                'technician_id': row[0],
                                'name': row[1],
                                'current_workload': row[2],
                                'max_concurrent_jobs': row[3],
                                'status': row[4],
                                'active_cycles': row[5],
                                'capacity_utilization': round(row[2]/row[3]*100, 2) if row[3] > 0 else 0
                            }
                            for row in results
                        ]
                    }
                    
        except Exception as e:
            logger.error(f"Error getting technician workload: {e}")
            return {'success': False, 'error': str(e)} 