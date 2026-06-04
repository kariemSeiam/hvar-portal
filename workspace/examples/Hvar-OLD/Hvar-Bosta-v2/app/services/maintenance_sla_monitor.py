"""
Maintenance SLA Monitoring & Automated Reminder Service
Comprehensive SLA tracking, automated reminders, escalation management, 
and performance analytics for maintenance operations.

Provides real-time SLA monitoring and automated escalation according to 
HVAR_COMPLETE_CYCLE_SYSTEM.md requirements.

Key Features:
- Real-time SLA monitoring with automated alerts
- Multi-level escalation system with configurable rules  
- Automated reminders for approaching deadlines
- Performance analytics and SLA compliance reporting
- Customizable SLA rules based on priority and type
"""

import logging
import sqlite3
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from decimal import Decimal
import json
from dataclasses import dataclass
from enum import Enum
import asyncio
import threading
import time

from app.utils.db_utils import get_db

# Setup logging
logger = logging.getLogger(__name__)

class SLAType(Enum):
    """SLA type enumeration"""
    RESPONSE = "response"
    RESOLUTION = "resolution"
    ESCALATION = "escalation"
    QUALITY_CHECK = "quality_check"

class EscalationLevel(Enum):
    """Escalation level enumeration"""
    NONE = 0
    SUPERVISOR = 1
    MANAGER = 2
    DIRECTOR = 3
    EXECUTIVE = 4



@dataclass
class SLARule:
    """SLA rule configuration"""
    maintenance_type: str
    priority: str
    response_time_hours: int
    resolution_time_hours: int
    escalation_time_hours: int
    warning_threshold_hours: int
    auto_escalate: bool = True

@dataclass
class EscalationRule:
    """Escalation rule configuration"""
    violation_hours: int
    escalation_level: EscalationLevel
    escalation_role: str
    auto_assign: bool = False

class MaintenanceSLAMonitor:
    """
    Comprehensive SLA Monitoring & Automated Reminder Service
    
    Provides real-time SLA monitoring with:
    - Automated deadline tracking and alerts
    - Multi-level escalation with role-based assignment
    - Performance analytics and compliance reporting
    - Customizable SLA rules and escalation policies
    """
    
    def __init__(self):
        self.sla_rules = self._load_sla_rules()
        self.escalation_rules = self._load_escalation_rules()
        self.monitoring_active = False
        self.monitor_thread = None
        self._initialize_sla_monitoring_tables()
    
    def _initialize_sla_monitoring_tables(self):
        """Initialize SLA monitoring tables"""
        try:
            with get_db() as conn:
                # SLA Configuration Table
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS sla_configuration (
                        config_id INTEGER PRIMARY KEY AUTOINCREMENT,
                        maintenance_type TEXT NOT NULL,
                        priority TEXT NOT NULL,
                        response_time_hours INTEGER NOT NULL,
                        resolution_time_hours INTEGER NOT NULL,
                        escalation_time_hours INTEGER NOT NULL,
                        warning_threshold_hours INTEGER DEFAULT 2,
                        auto_escalate BOOLEAN DEFAULT 1,

                        is_active BOOLEAN DEFAULT 1,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE(maintenance_type, priority)
                    )
                """)
                
                # Escalation Rules Table
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS escalation_rules (
                        rule_id INTEGER PRIMARY KEY AUTOINCREMENT,
                        violation_hours INTEGER NOT NULL,
                        escalation_level INTEGER NOT NULL,
                        escalation_role TEXT NOT NULL,
                        auto_assign BOOLEAN DEFAULT 0,
                        rule_order INTEGER DEFAULT 0,
                        is_active BOOLEAN DEFAULT 1,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                

                
                # SLA Performance Analytics
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS sla_performance_analytics (
                        analytics_id INTEGER PRIMARY KEY AUTOINCREMENT,
                        date DATE NOT NULL,
                        maintenance_type TEXT,
                        priority TEXT,
                        total_slas INTEGER DEFAULT 0,
                        slas_met INTEGER DEFAULT 0,
                        slas_violated INTEGER DEFAULT 0,
                        avg_response_time_hours REAL,
                        avg_resolution_time_hours REAL,
                        avg_violation_hours REAL,
                        escalations_triggered INTEGER DEFAULT 0,
                        customer_satisfaction_impact REAL,
                        compliance_percentage REAL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE(date, maintenance_type, priority)
                    )
                """)
                
                # Escalation Actions Log
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS escalation_actions (
                        action_id INTEGER PRIMARY KEY AUTOINCREMENT,
                        cycle_id INTEGER NOT NULL,
                        sla_id INTEGER NOT NULL,
                        escalation_level INTEGER NOT NULL,
                        escalated_from TEXT,
                        escalated_to TEXT,
                        escalation_reason TEXT,
                        escalation_type TEXT, -- 'automatic', 'manual'
                        action_taken TEXT,
                        resolution_provided BOOLEAN DEFAULT 0,
                        escalated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        resolved_at TIMESTAMP,
                        FOREIGN KEY (cycle_id) REFERENCES maintenance_cycles(cycle_id) ON DELETE CASCADE,
                        FOREIGN KEY (sla_id) REFERENCES maintenance_sla_tracking(sla_id) ON DELETE CASCADE
                    )
                """)
                
                # Create indexes
                conn.execute("CREATE INDEX IF NOT EXISTS idx_sla_config_type_priority ON sla_configuration(maintenance_type, priority)")
                conn.execute("CREATE INDEX IF NOT EXISTS idx_escalation_rules_hours ON escalation_rules(violation_hours)")

                conn.execute("CREATE INDEX IF NOT EXISTS idx_sla_performance_date ON sla_performance_analytics(date)")
                conn.execute("CREATE INDEX IF NOT EXISTS idx_escalation_actions_cycle ON escalation_actions(cycle_id)")
                conn.execute("CREATE INDEX IF NOT EXISTS idx_escalation_actions_level ON escalation_actions(escalation_level)")
                
                # Insert default SLA configurations
                self._insert_default_sla_configurations(conn)
                
                # Insert default escalation rules
                self._insert_default_escalation_rules(conn)
                
                conn.commit()
                logger.info("SLA monitoring tables initialized successfully")
                
        except Exception as e:
            logger.error(f"Error initializing SLA monitoring tables: {e}")
            raise

    def _insert_default_sla_configurations(self, conn):
        """Insert default SLA configurations"""
        default_configs = [
            ('preventive', 'low', 48, 168, 96, 24),
            ('preventive', 'medium', 24, 72, 48, 12),
            ('preventive', 'high', 12, 48, 24, 6),
            ('corrective', 'low', 12, 48, 24, 6),
            ('corrective', 'medium', 4, 24, 12, 2),
            ('corrective', 'high', 2, 12, 6, 1),
            ('corrective', 'urgent', 1, 4, 2, 1),
            ('warranty', 'low', 24, 72, 48, 12),
            ('warranty', 'medium', 8, 48, 24, 4),
            ('warranty', 'high', 4, 24, 12, 2),
            ('emergency', 'high', 1, 4, 2, 1),
            ('emergency', 'urgent', 0.5, 2, 1, 0.5),
            ('emergency', 'critical', 0.25, 1, 0.5, 0.25)
        ]
        
        for config in default_configs:
            maintenance_type, priority, response_hours, resolution_hours, escalation_hours, warning_hours = config
            
            conn.execute("""
                INSERT OR IGNORE INTO sla_configuration (
                    maintenance_type, priority, response_time_hours, resolution_time_hours,
                    escalation_time_hours, warning_threshold_hours
                ) VALUES (?, ?, ?, ?, ?, ?)
            """, (maintenance_type, priority, response_hours, resolution_hours, 
                  escalation_hours, warning_hours))

    def _insert_default_escalation_rules(self, conn):
        """Insert default escalation rules"""
        default_rules = [
            (1, 1, 'supervisor', 0, 1),
            (4, 2, 'manager', 0, 2),
            (8, 3, 'director', 1, 3),
            (24, 4, 'executive', 1, 4)
        ]
        
        for rule in default_rules:
            violation_hours, level, role, auto_assign, order = rule
            
            conn.execute("""
                INSERT OR IGNORE INTO escalation_rules (
                    violation_hours, escalation_level, escalation_role,
                    auto_assign, rule_order
                ) VALUES (?, ?, ?, ?, ?)
            """, (violation_hours, level, role, auto_assign, order))

    def _load_sla_rules(self) -> Dict[str, Dict[str, SLARule]]:
        """Load SLA rules from database"""
        try:
            with get_db() as conn:
                cursor = conn.execute("""
                    SELECT maintenance_type, priority, response_time_hours, resolution_time_hours,
                           escalation_time_hours, warning_threshold_hours, auto_escalate
                    FROM sla_configuration WHERE is_active = 1
                """)
                
                rules = {}
                for row in cursor.fetchall():
                    mtype, priority, response, resolution, escalation, warning, auto_escalate = row
                    
                    methods = ['system']
                    
                    if mtype not in rules:
                        rules[mtype] = {}
                    
                    rules[mtype][priority] = SLARule(
                        maintenance_type=mtype,
                        priority=priority,
                        response_time_hours=response,
                        resolution_time_hours=resolution,
                        escalation_time_hours=escalation,
                        warning_threshold_hours=warning,
                        auto_escalate=bool(auto_escalate)
                    )
                
                return rules
                
        except Exception as e:
            logger.error(f"Error loading SLA rules: {e}")
            return {}

    def _load_escalation_rules(self) -> List[EscalationRule]:
        """Load escalation rules from database"""
        try:
            with get_db() as conn:
                cursor = conn.execute("""
                    SELECT violation_hours, escalation_level, escalation_role,
                           auto_assign
                    FROM escalation_rules WHERE is_active = 1
                    ORDER BY rule_order ASC
                """)
                
                rules = []
                for row in cursor.fetchall():
                    violation_hours, level, role, auto_assign = row
                    
                    methods = ['system']
                    
                    rules.append(EscalationRule(
                        violation_hours=violation_hours,
                        escalation_level=EscalationLevel(level),
                        escalation_role=role,
                        auto_assign=bool(auto_assign)
                    ))
                
                return rules
                
        except Exception as e:
            logger.error(f"Error loading escalation rules: {e}")
            return []

    # =================== SLA MONITORING AUTOMATION ===================
    
    def start_automated_monitoring(self):
        """Start automated SLA monitoring in background thread"""
        if self.monitoring_active:
            logger.warning("SLA monitoring is already active")
            return
        
        self.monitoring_active = True
        self.monitor_thread = threading.Thread(target=self._monitoring_loop, daemon=True)
        self.monitor_thread.start()
        
        logger.info("Automated SLA monitoring started")

    def stop_automated_monitoring(self):
        """Stop automated SLA monitoring"""
        self.monitoring_active = False
        if self.monitor_thread:
            self.monitor_thread.join(timeout=10)
        
        logger.info("Automated SLA monitoring stopped")

    def _monitoring_loop(self):
        """Main monitoring loop for SLA tracking"""
        while self.monitoring_active:
            try:
                # Check for SLA violations and warnings
                self.check_sla_violations()
                
                # Process escalations
                self.process_escalations()
                

                
                # Update performance analytics
                self.update_performance_analytics()
                
                # Sleep for monitoring interval (5 minutes)
                time.sleep(300)
                
            except Exception as e:
                logger.error(f"Error in SLA monitoring loop: {e}")
                time.sleep(60)  # Wait 1 minute before retrying

    def check_sla_violations(self) -> Dict[str, Any]:
        """Check for SLA violations and generate alerts"""
        try:
            with get_db() as conn:
                # Find SLA violations
                cursor = conn.execute("""
                    SELECT sla.sla_id, sla.cycle_id, sla.sla_type, sla.target_deadline,
                           mc.cycle_type, mc.priority, mc.assigned_technician_id,
                           mc.customer_phone, sla.warning_sent, sla.violation_notified
                    FROM maintenance_sla_tracking sla
                    JOIN maintenance_cycles mc ON sla.cycle_id = mc.cycle_id
                    WHERE sla.actual_completion IS NULL
                    AND mc.cycle_status NOT IN ('completed', 'cancelled')
                """)
                
                sla_records = cursor.fetchall()
                warnings_sent = 0
                violations_processed = 0
                
                current_time = datetime.now()
                
                for record in sla_records:
                    sla_id, cycle_id, sla_type, deadline_str, mtype, priority, technician_id, phone, warning_sent, violation_notified = record
                    
                    try:
                        deadline = datetime.fromisoformat(deadline_str)
                        time_to_deadline = (deadline - current_time).total_seconds() / 3600  # hours
                        
                        # Get SLA rule for warning threshold
                        sla_rule = self.sla_rules.get(mtype, {}).get(priority)
                        warning_threshold = sla_rule.warning_threshold_hours if sla_rule else 2
                        
                        # Check for warnings (approaching deadline)
                        if not warning_sent and 0 < time_to_deadline <= warning_threshold:
                            self._mark_warning_sent(conn, sla_id)
                            warnings_sent += 1
                        
                        # Check for violations (past deadline)
                        elif not violation_notified and time_to_deadline <= 0:
                            violation_hours = abs(time_to_deadline)
                            violation_result = self._process_sla_violation(
                                conn, sla_id, cycle_id, sla_type, violation_hours
                            )
                            if violation_result['success']:
                                violations_processed += 1
                                
                    except ValueError as e:
                        logger.error(f"Invalid deadline format for SLA {sla_id}: {deadline_str}")
                        continue
                
                conn.commit()
                
                return {
                    'success': True,
                    'warnings_sent': warnings_sent,
                    'violations_processed': violations_processed,
                    'total_slas_checked': len(sla_records)
                }
                
        except Exception as e:
            logger.error(f"Error checking SLA violations: {e}")
            return {'success': False, 'error': str(e)}



    def _mark_warning_sent(self, conn, sla_id: int):
        """Mark SLA warning as sent"""
        conn.execute("""
            UPDATE maintenance_sla_tracking 
            SET warning_sent = 1, warning_sent_at = CURRENT_TIMESTAMP
            WHERE sla_id = ?
        """, (sla_id,))

    def _process_sla_violation(self, conn, sla_id: int, cycle_id: int, 
                              sla_type: str, violation_hours: float) -> Dict[str, Any]:
        """Process SLA violation with escalation"""
        try:
            # Update SLA tracking
            conn.execute("""
                UPDATE maintenance_sla_tracking 
                SET is_met = 0, violation_minutes = ?,
                    violation_notified = 1, violation_notified_at = CURRENT_TIMESTAMP
                WHERE sla_id = ?
            """, (int(violation_hours * 60), sla_id))
            
            # Determine escalation level
            escalation_rule = self._get_escalation_rule_for_violation(violation_hours)
            
            if escalation_rule:
                # Create escalation action
                escalation_result = self._create_escalation_action(
                    conn, cycle_id, sla_id, escalation_rule, violation_hours
                )
                

                
                return {
                    'success': True,
                    'escalation_level': escalation_rule.escalation_level.value,
                    'escalated_to': escalation_rule.escalation_role
                }
            else:
                return {'success': True, 'escalation_level': 0}
                
        except Exception as e:
            logger.error(f"Error processing SLA violation: {e}")
            return {'success': False, 'error': str(e)}

    def _get_escalation_rule_for_violation(self, violation_hours: float) -> Optional[EscalationRule]:
        """Get appropriate escalation rule for violation duration"""
        applicable_rules = [
            rule for rule in self.escalation_rules 
            if violation_hours >= rule.violation_hours
        ]
        
        if applicable_rules:
            # Return the highest level applicable rule
            return max(applicable_rules, key=lambda r: r.escalation_level.value)
        
        return None

    def _create_escalation_action(self, conn, cycle_id: int, sla_id: int, 
                                 escalation_rule: EscalationRule, violation_hours: float) -> Dict[str, Any]:
        """Create escalation action record"""
        try:
            # Get current assignee
            cursor = conn.execute("""
                SELECT assigned_technician_id FROM maintenance_cycles WHERE cycle_id = ?
            """, (cycle_id,))
            result = cursor.fetchone()
            current_assignee = result[0] if result else None
            
            # Create escalation record
            cursor = conn.execute("""
                INSERT INTO escalation_actions (
                    cycle_id, sla_id, escalation_level, escalated_from, escalated_to,
                    escalation_reason, escalation_type, action_taken
                ) VALUES (?, ?, ?, ?, ?, ?, 'automatic', ?)
            """, (
                cycle_id, sla_id, escalation_rule.escalation_level.value,
                current_assignee, escalation_rule.escalation_role,
                f"SLA violation of {violation_hours:.1f} hours",
                f"Escalated to {escalation_rule.escalation_role} due to SLA violation"
            ))
            
            action_id = cursor.lastrowid
            
            # Auto-assign if configured
            if escalation_rule.auto_assign:
                self._auto_assign_escalated_cycle(conn, cycle_id, escalation_rule.escalation_role)
            
            return {
                'success': True,
                'action_id': action_id,
                'escalated_to': escalation_rule.escalation_role
            }
            
        except Exception as e:
            logger.error(f"Error creating escalation action: {e}")
            return {'success': False, 'error': str(e)}

    def _auto_assign_escalated_cycle(self, conn, cycle_id: int, escalation_role: str):
        """Auto-assign escalated cycle to appropriate person"""
        try:
            # This would integrate with your user/role management system
            # For now, just update the cycle status to indicate escalation
            conn.execute("""
                UPDATE maintenance_cycles 
                SET cycle_status = 'escalated', last_updated = CURRENT_TIMESTAMP
                WHERE cycle_id = ?
            """, (cycle_id,))
            
        except Exception as e:
            logger.error(f"Error auto-assigning escalated cycle: {e}")


    








    # =================== ESCALATION PROCESSING ===================
    
    def process_escalations(self) -> Dict[str, Any]:
        """Process pending escalations and take automated actions"""
        try:
            with get_db() as conn:
                # Find cycles requiring escalation
                cursor = conn.execute("""
                    SELECT DISTINCT ea.cycle_id, ea.escalation_level, ea.escalated_to,
                           mc.cycle_status, mc.assigned_technician_id, mc.priority
                    FROM escalation_actions ea
                    JOIN maintenance_cycles mc ON ea.cycle_id = mc.cycle_id
                    WHERE ea.resolution_provided = 0
                    AND mc.cycle_status NOT IN ('completed', 'cancelled')
                    AND ea.escalated_at <= datetime('now', '-1 hour')
                    ORDER BY ea.escalation_level DESC, ea.escalated_at ASC
                """)
                
                escalations = cursor.fetchall()
                processed_count = 0
                
                for escalation in escalations:
                    cycle_id, level, escalated_to, status, technician_id, priority = escalation
                    
                    # Take escalation action based on level
                    action_result = self._take_escalation_action(
                        conn, cycle_id, level, escalated_to, priority
                    )
                    
                    if action_result['success']:
                        processed_count += 1
                
                conn.commit()
                
                return {
                    'success': True,
                    'escalations_processed': processed_count,
                    'total_escalations': len(escalations)
                }
                
        except Exception as e:
            logger.error(f"Error processing escalations: {e}")
            return {'success': False, 'error': str(e)}

    def _take_escalation_action(self, conn, cycle_id: int, escalation_level: int, 
                               escalated_to: str, priority: str) -> Dict[str, Any]:
        """Take automated escalation action"""
        try:
            actions_taken = []
            
            if escalation_level >= 2:  # Manager level and above
                # Increase priority if not already at maximum
                if priority != 'critical':
                    new_priority = self._escalate_priority(priority)
                    conn.execute("""
                        UPDATE maintenance_cycles 
                        SET priority = ?, last_updated = CURRENT_TIMESTAMP
                        WHERE cycle_id = ?
                    """, (new_priority, cycle_id))
                    actions_taken.append(f"Priority escalated to {new_priority}")
            
            if escalation_level >= 3:  # Director level and above
                # Mark for immediate attention
                conn.execute("""
                    UPDATE maintenance_cycles 
                    SET cycle_status = 'urgent', last_updated = CURRENT_TIMESTAMP
                    WHERE cycle_id = ?
                """, (cycle_id,))
                actions_taken.append("Marked for urgent attention")
            
            # Log the actions taken
            if actions_taken:
                conn.execute("""
                    UPDATE escalation_actions 
                    SET action_taken = ?, resolution_provided = 1, resolved_at = CURRENT_TIMESTAMP
                    WHERE cycle_id = ? AND escalation_level = ?
                """, ('; '.join(actions_taken), cycle_id, escalation_level))
            
            return {
                'success': True,
                'actions_taken': actions_taken
            }
            
        except Exception as e:
            logger.error(f"Error taking escalation action: {e}")
            return {'success': False, 'error': str(e)}

    def _escalate_priority(self, current_priority: str) -> str:
        """Escalate priority to next level"""
        priority_escalation = {
            'low': 'medium',
            'medium': 'high',
            'high': 'urgent',
            'urgent': 'critical'
        }
        return priority_escalation.get(current_priority, 'critical')

    # =================== ANALYTICS & REPORTING ===================
    
    def update_performance_analytics(self) -> Dict[str, Any]:
        """Update SLA performance analytics"""
        try:
            with get_db() as conn:
                today = datetime.now().date()
                
                # Get SLA performance data for today
                cursor = conn.execute("""
                    SELECT mc.cycle_type as maintenance_type, mc.priority,
                           COUNT(*) as total_slas,
                           COUNT(CASE WHEN sla.is_met = 1 THEN 1 END) as slas_met,
                           COUNT(CASE WHEN sla.is_met = 0 THEN 1 END) as slas_violated,
                           AVG(CASE WHEN sla.sla_type = 'response' AND sla.actual_completion IS NOT NULL THEN
                               (julianday(sla.actual_completion) - julianday(mc.created_at)) * 24
                           END) as avg_response_hours,
                           AVG(CASE WHEN sla.sla_type = 'resolution' AND sla.actual_completion IS NOT NULL THEN
                               (julianday(sla.actual_completion) - julianday(mc.created_at)) * 24
                           END) as avg_resolution_hours,
                           AVG(CASE WHEN sla.violation_minutes > 0 THEN sla.violation_minutes / 60.0 END) as avg_violation_hours,
                           COUNT(CASE WHEN ea.escalation_level > 0 THEN 1 END) as escalations_triggered
                    FROM maintenance_cycles mc
                    JOIN maintenance_sla_tracking sla ON mc.cycle_id = sla.cycle_id
                    LEFT JOIN escalation_actions ea ON mc.cycle_id = ea.cycle_id
                    WHERE date(mc.created_at) = ?
                    GROUP BY mc.cycle_type, mc.priority
                """, (today,))
                
                analytics_data = cursor.fetchall()
                
                for data in analytics_data:
                    maintenance_type, priority, total, met, violated, avg_response, avg_resolution, avg_violation, escalations = data
                    
                    compliance_percentage = (met / total * 100) if total > 0 else 0
                    
                    # Insert or update analytics record
                    conn.execute("""
                        INSERT OR REPLACE INTO sla_performance_analytics (
                            date, maintenance_type, priority, total_slas, slas_met, slas_violated,
                            avg_response_time_hours, avg_resolution_time_hours, avg_violation_hours,
                            escalations_triggered, compliance_percentage
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (today, maintenance_type, priority, total, met, violated,
                          avg_response, avg_resolution, avg_violation, escalations, compliance_percentage))
                
                conn.commit()
                
                return {
                    'success': True,
                    'analytics_updated': len(analytics_data),
                    'date': today.isoformat()
                }
                
        except Exception as e:
            logger.error(f"Error updating performance analytics: {e}")
            return {'success': False, 'error': str(e)}

    def get_sla_performance_report(self, date_from: str = None, date_to: str = None) -> Dict[str, Any]:
        """Get comprehensive SLA performance report"""
        try:
            with get_db() as conn:
                # Default date range (last 30 days)
                if not date_from:
                    date_from = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
                if not date_to:
                    date_to = datetime.now().strftime('%Y-%m-%d')
                
                # Overall performance
                cursor = conn.execute("""
                    SELECT 
                        SUM(total_slas) as total_slas,
                        SUM(slas_met) as total_met,
                        SUM(slas_violated) as total_violated,
                        AVG(compliance_percentage) as avg_compliance,
                        SUM(escalations_triggered) as total_escalations
                    FROM sla_performance_analytics 
                    WHERE date BETWEEN ? AND ?
                """, (date_from, date_to))
                
                overall_stats = cursor.fetchone()
                
                # Performance by maintenance type
                cursor = conn.execute("""
                    SELECT maintenance_type, priority,
                           SUM(total_slas) as total_slas,
                           SUM(slas_met) as slas_met,
                           AVG(compliance_percentage) as compliance_rate,
                           AVG(avg_response_time_hours) as avg_response,
                           AVG(avg_resolution_time_hours) as avg_resolution
                    FROM sla_performance_analytics 
                    WHERE date BETWEEN ? AND ?
                    GROUP BY maintenance_type, priority
                    ORDER BY maintenance_type, priority
                """, (date_from, date_to))
                
                performance_by_type = cursor.fetchall()
                
                # Recent escalations
                cursor = conn.execute("""
                    SELECT ea.cycle_id, ea.escalation_level, ea.escalated_to,
                           ea.escalation_reason, ea.escalated_at,
                           mc.cycle_type, mc.priority
                    FROM escalation_actions ea
                    JOIN maintenance_cycles mc ON ea.cycle_id = mc.cycle_id
                    WHERE date(ea.escalated_at) BETWEEN ? AND ?
                    ORDER BY ea.escalated_at DESC
                    LIMIT 20
                """, (date_from, date_to))
                
                recent_escalations = cursor.fetchall()
                
                return {
                    'success': True,
                    'date_range': {'from': date_from, 'to': date_to},
                    'overall_performance': {
                        'total_slas': overall_stats[0] if overall_stats else 0,
                        'slas_met': overall_stats[1] if overall_stats else 0,
                        'slas_violated': overall_stats[2] if overall_stats else 0,
                        'compliance_rate': round(overall_stats[3], 2) if overall_stats and overall_stats[3] else 0,
                        'total_escalations': overall_stats[4] if overall_stats else 0
                    },
                    'performance_by_type': [
                        {
                            'maintenance_type': row[0],
                            'priority': row[1],
                            'total_slas': row[2],
                            'slas_met': row[3],
                            'compliance_rate': round(row[4], 2) if row[4] else 0,
                            'avg_response_hours': round(row[5], 2) if row[5] else 0,
                            'avg_resolution_hours': round(row[6], 2) if row[6] else 0
                        }
                        for row in performance_by_type
                    ],
                    'recent_escalations': [
                        {
                            'cycle_id': row[0],
                            'escalation_level': row[1],
                            'escalated_to': row[2],
                            'reason': row[3],
                            'escalated_at': row[4],
                            'maintenance_type': row[5],
                            'priority': row[6]
                        }
                        for row in recent_escalations
                    ]
                }
                
        except Exception as e:
            logger.error(f"Error getting SLA performance report: {e}")
            return {'success': False, 'error': str(e)} 