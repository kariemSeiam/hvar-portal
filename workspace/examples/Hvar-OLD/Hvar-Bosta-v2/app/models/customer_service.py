"""
Minimal Customer Service Management System
Streamlined customer service, maintenance, and repair cycle based on existing CRM data
"""

import sqlite3
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from decimal import Decimal
import json

from app.utils.db_utils import get_db

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)



class CustomerServiceManager:
    """Minimal Customer Service Management System for HVAR CRM"""
    
    def __init__(self, db_path: str = "database.db"):
        self.db_path = db_path
    
    def init_database(self) -> Dict[str, Any]:
        """
        Initialize customer service database tables
        This function ensures all customer service tables exist
        """
        try:
            with get_db() as conn:
                # Customer service tables are already defined in database.py
                # Just check if they exist and return status
                cursor = conn.execute("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('service_tickets', 'replacements', 'hub_confirmations', 'team_leader_actions')")
                existing_tables = [row[0] for row in cursor.fetchall()]
                
                if len(existing_tables) >= 5:  # All customer service tables exist
                    # Get ticket count
                    cursor = conn.execute("SELECT COUNT(*) FROM service_tickets")
                    ticket_count = cursor.fetchone()[0]
                    
                    return {
                        'success': True,
                        'message': 'Customer service database already initialized',
                        'ticket_count': ticket_count,
                        'tables': existing_tables
                    }
                else:
                    # Tables don't exist, they should be created by init_production_db
                    from app.models.database import init_production_db
                    init_result = init_production_db()
                    
                    if init_result.get('success'):
                        return {
                            'success': True,
                            'message': 'Customer service database initialized successfully',
                            'tables': init_result.get('tables', [])
                        }
                    else:
                        return {
                            'success': False,
                            'error': init_result.get('error', 'Failed to initialize database')
                        }
                        
        except Exception as e:
            logger.error(f"❌ Customer service database initialization failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def create_service_ticket(self, ticket_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new service ticket"""
        try:
            from app.utils.db_utils import get_db
            with get_db() as conn:
                cursor = conn.cursor()
                
                # Get customer info from existing data
                customer_info = self._get_customer_info(conn, ticket_data.get('customer_phone'))
                
                # Insert ticket
                cursor.execute("""
                    INSERT INTO service_tickets (
                        customer_phone, order_id, tracking_number, ticket_type, priority,
                        subject, description, product_name, product_sku, assigned_agent
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    ticket_data['customer_phone'],
                    ticket_data.get('order_id'),
                    ticket_data.get('tracking_number'),
                    ticket_data['ticket_type'],
                    ticket_data.get('priority', 'medium'),
                    ticket_data['subject'],
                    ticket_data.get('description', ''),
                    ticket_data.get('product_name'),
                    ticket_data.get('product_sku'),
                    ticket_data.get('assigned_agent')
                ))
                
                ticket_id = cursor.lastrowid
                conn.commit()
                
                return {
                    'success': True,
                    'ticket_id': ticket_id,
                    'customer_info': customer_info,
                    'message': 'Service ticket created successfully'
                }
                
        except Exception as e:
            logger.error(f"Error creating service ticket: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _get_customer_info(self, conn, customer_phone: str) -> Dict[str, Any]:
        """Get customer information from existing data"""
        try:
            # Try to get from customers table first
            cursor = conn.execute("""
                SELECT customer_id, full_name, primary_city, total_orders, total_value, customer_segment
                FROM customers 
                WHERE phone = ?
            """, (customer_phone,))
            
            customer_row = cursor.fetchone()
            if customer_row:
                return {
                    'customer_id': customer_row[0],
                    'full_name': customer_row[1],
                    'primary_city': customer_row[2],
                    'total_orders': customer_row[3],
                    'total_value': customer_row[4],
                    'customer_segment': customer_row[5]
                }
            
            # If not in customers table, get from orders
            cursor = conn.execute("""
                SELECT receiver_name, dropoff_city_name, COUNT(*) as order_count, SUM(cod) as total_value
                FROM orders 
                WHERE receiver_phone = ?
                GROUP BY receiver_phone
            """, (customer_phone,))
            
            order_row = cursor.fetchone()
            if order_row:
                return {
                    'full_name': order_row[0],
                    'primary_city': order_row[1],
                    'total_orders': order_row[2],
                    'total_value': order_row[3],
                    'customer_segment': 'new'
                }
            
            return {}
            
        except Exception as e:
            logger.error(f"Error getting customer info: {e}")
            return {}
    
    def get_service_tickets(self, filters: Dict[str, Any] = None, page: int = 1, limit: int = 50) -> Dict[str, Any]:
        """Get service tickets with filtering and pagination"""
        try:
            from app.utils.db_utils import get_db
            with get_db() as conn:
                cursor = conn.cursor()
                
                # Build query
                query = """
                    SELECT st.*, c.full_name as customer_name, c.customer_segment
                    FROM service_tickets st
                    LEFT JOIN customers c ON st.customer_phone = c.phone
                    WHERE 1=1
                """
                params = []
                
                # Apply filters
                if filters:
                    if filters.get('status'):
                        query += " AND st.status = ?"
                        params.append(filters['status'])
                    
                    if filters.get('ticket_type'):
                        query += " AND st.ticket_type = ?"
                        params.append(filters['ticket_type'])
                    
                    if filters.get('priority'):
                        query += " AND st.priority = ?"
                        params.append(filters['priority'])
                    
                    if filters.get('customer_phone'):
                        query += " AND st.customer_phone LIKE ?"
                        params.append(f"%{filters['customer_phone']}%")
                    
                    if filters.get('assigned_agent'):
                        query += " AND st.assigned_agent = ?"
                        params.append(filters['assigned_agent'])
                
                # Get total count
                count_query = query.replace("SELECT st.*, c.full_name as customer_name, c.customer_segment", "SELECT COUNT(*)")
                cursor.execute(count_query, params)
                total_count = cursor.fetchone()[0]
                
                # Add pagination
                query += " ORDER BY st.created_at DESC LIMIT ? OFFSET ?"
                offset = (page - 1) * limit
                params.extend([limit, offset])
                
                cursor.execute(query, params)
                rows = cursor.fetchall()
                
                # Format results
                columns = [description[0] for description in cursor.description]
                tickets = [dict(zip(columns, row)) for row in rows]
                
                return {
                    'success': True,
                    'tickets': tickets,
                    'pagination': {
                        'page': page,
                        'limit': limit,
                        'total_count': total_count,
                        'total_pages': (total_count + limit - 1) // limit
                    }
                }
                
        except Exception as e:
            logger.error(f"Error getting service tickets: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    # Team calls methods removed - functionality integrated into follow-ups system
    
    def create_replacement_request(self, replacement_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a replacement request (full or partial)"""
        try:
            from app.utils.db_utils import get_db
            with get_db() as conn:
                cursor = conn.cursor()
                
                cursor.execute("""
                    INSERT INTO replacements (
                        ticket_id, customer_phone, order_id, replacement_type,
                        original_product_sku, replacement_product_sku, replacement_reason,
                        replacement_value, customer_contribution, warranty_applies,
                        delivery_address, delivery_contact, delivery_phone,
                        estimated_delivery_date
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    replacement_data.get('ticket_id'),
                    replacement_data['customer_phone'],
                    replacement_data.get('order_id'),
                    replacement_data['replacement_type'],
                    replacement_data.get('original_product_sku'),
                    replacement_data.get('replacement_product_sku'),
                    replacement_data['replacement_reason'],
                    replacement_data.get('replacement_value', 0),
                    replacement_data.get('customer_contribution', 0),
                    replacement_data.get('warranty_applies', False),
                    replacement_data.get('delivery_address'),
                    replacement_data.get('delivery_contact'),
                    replacement_data.get('delivery_phone'),
                    replacement_data.get('estimated_delivery_date')
                ))
                
                replacement_id = cursor.lastrowid
                conn.commit()
                
                return {
                    'success': True,
                    'replacement_id': replacement_id,
                    'message': 'Replacement request created successfully'
                }
                
        except Exception as e:
            logger.error(f"Error creating replacement request: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def create_hub_confirmation(self, confirmation_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create hub confirmation for returned orders/repairs"""
        try:
            from app.utils.db_utils import get_db
            with get_db() as conn:
                cursor = conn.cursor()
                
                cursor.execute("""
                    INSERT INTO hub_confirmations (
                        ticket_id, order_id, tracking_number, hub_name, hub_agent,
                        confirmation_type, confirmation_date, inspection_notes,
                        quality_score, defects_found, recommended_action,
                        team_leader_review_required
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    confirmation_data.get('ticket_id'),
                    confirmation_data.get('order_id'),
                    confirmation_data.get('tracking_number'),
                    confirmation_data['hub_name'],
                    confirmation_data['hub_agent'],
                    confirmation_data['confirmation_type'],
                    confirmation_data['confirmation_date'],
                    confirmation_data.get('inspection_notes', ''),
                    confirmation_data.get('quality_score'),
                    json.dumps(confirmation_data.get('defects_found', [])),
                    confirmation_data.get('recommended_action'),
                    confirmation_data.get('team_leader_review_required', False)
                ))
                
                confirmation_id = cursor.lastrowid
                conn.commit()
                
                return {
                    'success': True,
                    'confirmation_id': confirmation_id,
                    'message': 'Hub confirmation created successfully'
                }
                
        except Exception as e:
            logger.error(f"Error creating hub confirmation: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def create_team_leader_action(self, action_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create team leader action for final verification"""
        try:
            from app.utils.db_utils import get_db
            with get_db() as conn:
                cursor = conn.cursor()
                
                cursor.execute("""
                    INSERT INTO team_leader_actions (
                        ticket_id, hub_confirmation_id, team_leader_name, action_type,
                        action_date, verification_notes, quality_standards_met,
                        customer_satisfaction_confirmed, final_resolution
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    action_data.get('ticket_id'),
                    action_data.get('hub_confirmation_id'),
                    action_data['team_leader_name'],
                    action_data['action_type'],
                    action_data['action_date'],
                    action_data.get('verification_notes', ''),
                    action_data.get('quality_standards_met', False),
                    action_data.get('customer_satisfaction_confirmed', False),
                    action_data.get('final_resolution', '')
                ))
                
                action_id = cursor.lastrowid
                conn.commit()
                
                return {
                    'success': True,
                    'action_id': action_id,
                    'message': 'Team leader action created successfully'
                }
                
        except Exception as e:
            logger.error(f"Error creating team leader action: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_customer_follow_up_list(self, filters: Dict[str, Any] = None) -> Dict[str, Any]:
        """Get customer list for team follow-up calls"""
        try:
            from app.utils.db_utils import get_db
            with get_db() as conn:
                cursor = conn.cursor()
                
                # Build query to get customers with active tickets or recent orders
                query = """
                    SELECT DISTINCT 
                        COALESCE(c.phone, o.receiver_phone) as customer_phone,
                        COALESCE(c.full_name, o.receiver_name) as customer_name,
                        COALESCE(c.primary_city, o.dropoff_city_name) as city,
                        COALESCE(c.total_orders, 0) as total_orders,
                        COALESCE(c.total_value, 0) as total_value,
                        COALESCE(c.customer_segment, 'new') as customer_segment,
                        st.ticket_id,
                        st.ticket_type,
                        st.status as ticket_status,
                        st.subject,
                        -- Team calls fields removed - functionality integrated into follow-ups system
                    FROM (
                        SELECT DISTINCT receiver_phone, receiver_name, dropoff_city_name
                        FROM orders 
                        WHERE created_at >= date('now', '-30 days')
                    ) o
                    LEFT JOIN customers c ON o.receiver_phone = c.phone
                    LEFT JOIN service_tickets st ON o.receiver_phone = st.customer_phone AND st.status IN ('open', 'in_progress')
                    -- Team calls removed - functionality integrated into follow-ups system
                    WHERE st.ticket_id IS NOT NULL
                """
                params = []
                
                # Apply filters
                if filters:
                    if filters.get('city'):
                        query += " AND COALESCE(c.primary_city, o.dropoff_city_name) = ?"
                        params.append(filters['city'])
                    
                    if filters.get('segment'):
                        query += " AND COALESCE(c.customer_segment, 'new') = ?"
                        params.append(filters['segment'])
                
                query += " ORDER BY st.created_at DESC"
                
                cursor.execute(query, params)
                rows = cursor.fetchall()
                
                # Format results
                columns = [description[0] for description in cursor.description]
                customers = [dict(zip(columns, row)) for row in rows]
                
                return {
                    'success': True,
                    'customers': customers,
                    'count': len(customers)
                }
                
        except Exception as e:
            logger.error(f"Error getting customer follow-up list: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_service_analytics(self, date_from: str = None, date_to: str = None) -> Dict[str, Any]:
        """Get service analytics and metrics"""
        try:
            from app.utils.db_utils import get_db
            with get_db() as conn:
                cursor = conn.cursor()
                
                # Build date filter
                date_filter = ""
                params = []
                if date_from and date_to:
                    date_filter = "WHERE date(created_at) BETWEEN ? AND ?"
                    params = [date_from, date_to]
                
                # Get ticket statistics
                cursor.execute(f"""
                    SELECT 
                        COUNT(*) as total_tickets,
                        COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_tickets,
                        COUNT(CASE WHEN status IN ('open', 'in_progress') THEN 1 END) as open_tickets,
                        AVG(CASE WHEN customer_satisfaction IS NOT NULL THEN customer_satisfaction END) as avg_satisfaction
                    FROM service_tickets
                    {date_filter}
                """, params)
                
                ticket_stats = cursor.fetchone()
                
                # Team calls analytics removed - functionality integrated into follow-ups system
                call_stats = (0, 0, 0)  # Placeholder for removed team calls
                
                # Get replacement statistics
                cursor.execute(f"""
                    SELECT 
                        COUNT(*) as total_replacements,
                        COUNT(CASE WHEN replacement_status = 'delivered' THEN 1 END) as delivered_replacements,
                        COUNT(CASE WHEN warranty_applies = 1 THEN 1 END) as warranty_replacements
                    FROM replacements
                    {date_filter}
                """, params)
                
                replacement_stats = cursor.fetchone()
                
                return {
                    'success': True,
                    'analytics': {
                        'tickets': {
                            'total': ticket_stats[0] or 0,
                            'resolved': ticket_stats[1] or 0,
                            'open': ticket_stats[2] or 0,
                            'avg_satisfaction': float(ticket_stats[3]) if ticket_stats[3] else 0
                        },
                        'calls': {
                            'total': call_stats[0] or 0,
                            'completed': call_stats[1] or 0,
                            'satisfied': call_stats[2] or 0
                        },
                        'replacements': {
                            'total': replacement_stats[0] or 0,
                            'delivered': replacement_stats[1] or 0,
                            'warranty': replacement_stats[2] or 0
                        }
                    }
                }
                
        except Exception as e:
            logger.error(f"Error getting service analytics: {e}")
            return {
                'success': False,
                'error': str(e)
            } 