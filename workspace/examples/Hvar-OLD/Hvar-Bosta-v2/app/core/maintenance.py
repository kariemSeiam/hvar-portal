"""
Core Maintenance Module - Unified Maintenance Management
Combines maintenance cycles, SLA monitoring, and stock integration
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from enum import Enum

from app.utils.db_utils import get_db

logger = logging.getLogger(__name__)

class MaintenanceStatus(Enum):
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class Maintenance:
    """Unified maintenance management"""
    
    def __init__(self):
        self.sla_rules = {
            'response_time_hours': 24,
            'resolution_time_hours': 72,
            'escalation_time_hours': 48
        }
    
    def create_cycle(self, cycle_data: Dict) -> Dict[str, Any]:
        """Create maintenance cycle"""
        try:
            with get_db() as conn:
                # Validate cycle data
                validation = self._validate_cycle(cycle_data)
                if not validation.get('valid'):
                    return {'success': False, 'error': validation.get('error')}
                
                # Create cycle record
                cycle_id = self._create_cycle_record(conn, cycle_data)
                
                # Setup SLA tracking
                self._setup_sla_tracking(conn, cycle_id, cycle_data)
                
                # Allocate parts if needed
                if cycle_data.get('parts_required'):
                    self._allocate_parts(conn, cycle_id, cycle_data['parts_required'])
                
                conn.commit()
                
                return {
                    'success': True,
                    'cycle_id': cycle_id,
                    'status': 'scheduled'
                }
        except Exception as e:
            logger.error(f"Error creating maintenance cycle: {e}")
            return {'success': False, 'error': str(e)}
    
    def _validate_cycle(self, cycle_data: Dict) -> Dict[str, Any]:
        """Validate maintenance cycle data"""
        required_fields = ['customer_phone', 'maintenance_type', 'priority']
        
        for field in required_fields:
            if not cycle_data.get(field):
                return {'valid': False, 'error': f'Missing required field: {field}'}
        
        # Validate priority
        valid_priorities = ['low', 'medium', 'high', 'urgent']
        if cycle_data.get('priority') not in valid_priorities:
            return {'valid': False, 'error': f'Invalid priority: {cycle_data.get("priority")}'}
        
        return {'valid': True}
    
    def _create_cycle_record(self, conn, cycle_data: Dict) -> int:
        """Create maintenance cycle record"""
        cursor = conn.execute("""
            INSERT INTO maintenance_cycles (
                customer_phone, maintenance_type, priority, description,
                scheduled_date, estimated_duration_hours, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        """, (
            cycle_data.get('customer_phone'),
            cycle_data.get('maintenance_type'),
            cycle_data.get('priority'),
            cycle_data.get('description', ''),
            cycle_data.get('scheduled_date'),
            cycle_data.get('estimated_duration_hours', 2),
            'scheduled'
        ))
        
        return cursor.lastrowid
    
    def _setup_sla_tracking(self, conn, cycle_id: int, cycle_data: Dict):
        """Setup SLA tracking for maintenance cycle"""
        priority = cycle_data.get('priority', 'medium')
        
        # Calculate SLA times based on priority
        response_time = self.sla_rules['response_time_hours']
        resolution_time = self.sla_rules['resolution_time_hours']
        
        if priority == 'urgent':
            response_time = 4
            resolution_time = 24
        elif priority == 'high':
            response_time = 12
            resolution_time = 48
        
        conn.execute("""
            INSERT INTO maintenance_sla_tracking (
                cycle_id, sla_type, target_hours, start_time, status
            ) VALUES 
            (?, 'response', ?, CURRENT_TIMESTAMP, 'active'),
            (?, 'resolution', ?, CURRENT_TIMESTAMP, 'active')
        """, (cycle_id, response_time, cycle_id, resolution_time))
    
    def _allocate_parts(self, conn, cycle_id: int, parts_required: List[Dict]):
        """Allocate parts for maintenance cycle"""
        for part in parts_required:
            conn.execute("""
                INSERT INTO maintenance_parts_allocation (
                    cycle_id, sku, quantity_required, quantity_allocated,
                    allocation_status, created_at
                ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            """, (
                cycle_id,
                part.get('sku'),
                part.get('quantity', 1),
                part.get('quantity', 1),  # Assume available
                'allocated'
            ))
    
    def start_cycle(self, cycle_id: int) -> Dict[str, Any]:
        """Start maintenance cycle"""
        try:
            with get_db() as conn:
                # Update cycle status
                cursor = conn.execute("""
                    UPDATE maintenance_cycles SET
                        status = ?, started_at = CURRENT_TIMESTAMP
                    WHERE cycle_id = ?
                """, ('in_progress', cycle_id))
                
                if cursor.rowcount == 0:
                    return {'success': False, 'error': 'Maintenance cycle not found'}
                
                # Update SLA tracking
                conn.execute("""
                    UPDATE maintenance_sla_tracking SET
                        start_time = CURRENT_TIMESTAMP
                    WHERE cycle_id = ? AND sla_type = 'response'
                """, (cycle_id,))
                
                conn.commit()
                return {'success': True, 'cycle_id': cycle_id, 'status': 'in_progress'}
        except Exception as e:
            logger.error(f"Error starting maintenance cycle: {e}")
            return {'success': False, 'error': str(e)}
    
    def complete_cycle(self, cycle_id: int, completion_data: Dict) -> Dict[str, Any]:
        """Complete maintenance cycle"""
        try:
            with get_db() as conn:
                # Update cycle status
                cursor = conn.execute("""
                    UPDATE maintenance_cycles SET
                        status = ?, completed_at = CURRENT_TIMESTAMP,
                        completion_notes = ?, actual_duration_hours = ?
                    WHERE cycle_id = ?
                """, (
                    'completed',
                    completion_data.get('notes', ''),
                    completion_data.get('duration_hours', 0),
                    cycle_id
                ))
                
                if cursor.rowcount == 0:
                    return {'success': False, 'error': 'Maintenance cycle not found'}
                
                # Complete SLA tracking
                conn.execute("""
                    UPDATE maintenance_sla_tracking SET
                        status = 'completed', completion_time = CURRENT_TIMESTAMP
                    WHERE cycle_id = ?
                """, (cycle_id,))
                
                # Process parts usage
                if completion_data.get('parts_used'):
                    self._process_parts_usage(conn, cycle_id, completion_data['parts_used'])
                
                conn.commit()
                return {'success': True, 'cycle_id': cycle_id, 'status': 'completed'}
        except Exception as e:
            logger.error(f"Error completing maintenance cycle: {e}")
            return {'success': False, 'error': str(e)}
    
    def _process_parts_usage(self, conn, cycle_id: int, parts_used: List[Dict]):
        """Process parts usage for completed cycle"""
        for part in parts_used:
            conn.execute("""
                UPDATE maintenance_parts_allocation SET
                    quantity_used = ?, usage_notes = ?
                WHERE cycle_id = ? AND sku = ?
            """, (
                part.get('quantity_used', 0),
                part.get('notes', ''),
                cycle_id,
                part.get('sku')
            ))
    
    def get_cycle(self, cycle_id: int) -> Dict[str, Any]:
        """Get maintenance cycle details"""
        try:
            with get_db() as conn:
                cursor = conn.execute("""
                    SELECT mc.*, mst.sla_type, mst.target_hours, mst.start_time, mst.status as sla_status
                    FROM maintenance_cycles mc
                    LEFT JOIN maintenance_sla_tracking mst ON mc.cycle_id = mst.cycle_id
                    WHERE mc.cycle_id = ?
                """, (cycle_id,))
                cycle_data = cursor.fetchall()
                
                if not cycle_data:
                    return {'success': False, 'error': 'Maintenance cycle not found'}
                
                # Get parts allocation
                cursor = conn.execute("""
                    SELECT * FROM maintenance_parts_allocation WHERE cycle_id = ?
                """, (cycle_id,))
                parts = [dict(row) for row in cursor.fetchall()]
                
                # Structure response
                cycle = dict(cycle_data[0])
                sla_tracking = []
                for row in cycle_data:
                    if row['sla_type']:
                        sla_tracking.append({
                            'sla_type': row['sla_type'],
                            'target_hours': row['target_hours'],
                            'start_time': row['start_time'],
                            'status': row['sla_status']
                        })
                
                return {
                    'success': True,
                    'cycle': cycle,
                    'sla_tracking': sla_tracking,
                    'parts': parts
                }
        except Exception as e:
            logger.error(f"Error getting maintenance cycle: {e}")
            return {'success': False, 'error': str(e)}
    
    def list_cycles(self, status: str = None, priority: str = None, limit: int = 50) -> Dict[str, Any]:
        """List maintenance cycles with filtering"""
        try:
            with get_db() as conn:
                query = "SELECT * FROM maintenance_cycles"
                params = []
                
                conditions = []
                if status:
                    conditions.append("status = ?")
                    params.append(status)
                if priority:
                    conditions.append("priority = ?")
                    params.append(priority)
                
                if conditions:
                    query += " WHERE " + " AND ".join(conditions)
                
                query += " ORDER BY created_at DESC LIMIT ?"
                params.append(limit)
                
                cursor = conn.execute(query, params)
                cycles = [dict(row) for row in cursor.fetchall()]
                
                return {
                    'success': True,
                    'cycles': cycles,
                    'count': len(cycles)
                }
        except Exception as e:
            logger.error(f"Error listing maintenance cycles: {e}")
            return {'success': False, 'error': str(e)}
    
    def check_sla_violations(self) -> Dict[str, Any]:
        """Check for SLA violations"""
        try:
            with get_db() as conn:
                cursor = conn.execute("""
                    SELECT mst.*, mc.customer_phone, mc.priority
                    FROM maintenance_sla_tracking mst
                    JOIN maintenance_cycles mc ON mst.cycle_id = mc.cycle_id
                    WHERE mst.status = 'active'
                    AND datetime('now') > datetime(mst.start_time, '+' || mst.target_hours || ' hours')
                """)
                
                violations = [dict(row) for row in cursor.fetchall()]
                
                return {
                    'success': True,
                    'violations': violations,
                    'count': len(violations)
                }
        except Exception as e:
            logger.error(f"Error checking SLA violations: {e}")
            return {'success': False, 'error': str(e)}
    
    def get_analytics(self, date_from: str = None, date_to: str = None) -> Dict[str, Any]:
        """Get maintenance analytics"""
        try:
            with get_db() as conn:
                # Base query
                query = """
                    SELECT 
                        status,
                        priority,
                        maintenance_type,
                        COUNT(*) as count,
                        AVG(actual_duration_hours) as avg_duration,
                        AVG(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completion_rate
                    FROM maintenance_cycles
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
                
                query += " GROUP BY status, priority, maintenance_type"
                
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
maintenance = Maintenance() 