"""
Enhanced Customer Management API - Based on Real Analytics
Comprehensive customer profile and interaction management with business intelligence
"""
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Union, Any
from flask import Blueprint, jsonify, request
from app.utils.db_utils import get_db
from app.models.customer_management import CustomerManager, init_customer_management_db, get_customer_stats
from app.utils.phone_utils import normalize_phone
from app.services.customer_profile_manager import customer_profile_manager
from app.utils.api_response import create_api_response
import sqlite3

# Setup logging
logger = logging.getLogger(__name__)

# Create blueprint
bp = Blueprint('customers', __name__, url_prefix='/api/customers')

@bp.route('/init', methods=['GET', 'POST'])
def initialize_customer_management() -> Dict[str, Any]:
    """
    Initialize customer management database - idempotent operation
    
    Note: Customer profiles are now created/updated automatically during order processing.
    This endpoint only initializes the database schema.
    
    Returns:
        Dict[str, Any]: Standardized API response with initialization results
    """
    from app.utils.init_utils import initialize_customer_management
    return initialize_customer_management()

@bp.route('/stats', methods=['GET'])
def get_customers_stats() -> Dict[str, Any]:
    """
    Get enhanced customer management statistics based on real analytics
    
    Returns:
        Dict[str, Any]: Standardized API response with customer statistics
    """
    try:
        with get_db() as conn:
            # Get comprehensive customer statistics
            stats_query = """
                SELECT 
                    COUNT(*) as total_customers,
                    COUNT(CASE WHEN customer_segment = 'vip' THEN 1 END) as vip_customers,
                    COUNT(CASE WHEN customer_segment = 'regular' THEN 1 END) as regular_customers,
                    COUNT(CASE WHEN customer_segment = 'new' THEN 1 END) as new_customers,
                    COUNT(CASE WHEN customer_segment = 'problematic' THEN 1 END) as problematic_customers,
                    AVG(total_orders) as avg_orders_per_customer,
                    AVG(total_value) as avg_lifetime_value,
                    AVG(avg_order_value) as avg_order_value,
                    AVG(return_rate) as avg_return_rate,
                    AVG(satisfaction_score) as avg_satisfaction_score,
                    SUM(total_orders) as total_orders,
                    SUM(total_value) as total_revenue,
                    COUNT(CASE WHEN return_rate >= 30 THEN 1 END) as high_return_customers,
                    COUNT(CASE WHEN satisfaction_score >= 0.8 THEN 1 END) as satisfied_customers,
                    COUNT(CASE WHEN total_orders >= 10 OR total_value >= 5000 THEN 1 END) as premium_customers
                FROM customers
            """
            
            cursor = conn.execute(stats_query)
            result = cursor.fetchone()
            
            total_customers = result[0] or 0
            
            stats = {
                'total_customers': total_customers,
                'segment_distribution': {
                    'vip_customers': result[1] or 0,
                    'regular_customers': result[2] or 0,
                    'new_customers': result[3] or 0,
                    'problematic_customers': result[4] or 0,
                    'vip_percentage': round((result[1] / total_customers * 100) if total_customers > 0 else 0, 2),
                    'regular_percentage': round((result[2] / total_customers * 100) if total_customers > 0 else 0, 2),
                    'new_percentage': round((result[3] / total_customers * 100) if total_customers > 0 else 0, 2),
                    'problematic_percentage': round((result[4] / total_customers * 100) if total_customers > 0 else 0, 2)
                },
                'performance_metrics': {
                    'avg_orders_per_customer': round(result[5] or 0, 2),
                    'avg_lifetime_value': round(result[6] or 0, 2),
                    'avg_order_value': round(result[7] or 0, 2),
                    'avg_return_rate': round(result[8] or 0, 2),
                    'avg_satisfaction_score': round(result[9] or 0, 2)
                },
                'business_metrics': {
                    'total_orders': result[10] or 0,
                    'total_revenue': round(result[11] or 0, 2),
                    'high_return_customers': result[12] or 0,
                    'satisfied_customers': result[13] or 0,
                    'premium_customers': result[14] or 0,
                    'high_return_percentage': round((result[12] / total_customers * 100) if total_customers > 0 else 0, 2),
                    'satisfaction_percentage': round((result[13] / total_customers * 100) if total_customers > 0 else 0, 2),
                    'premium_percentage': round((result[14] / total_customers * 100) if total_customers > 0 else 0, 2)
                }
            }
            
            return create_api_response(True, data=stats)
            
    except Exception as e:
        logger.error(f"❌ Failed to get customer stats: {e}")
        return create_api_response(False, error=str(e))

@bp.route('/', methods=['GET'])
@bp.route('', methods=['GET'])
def get_customers() -> Dict[str, Any]:
    """
    Get customers with enhanced filtering based on real analytics
    
    Query Parameters:
        segment: Filter by customer segment (vip, regular, new, problematic)
        city: Filter by primary city
        limit: Number of customers to return (default: 50)
        offset: Number of customers to skip (default: 0)
        search: Search in customer names and phone numbers
        satisfaction_min: Minimum satisfaction score
        return_rate_max: Maximum return rate
        order_count_min: Minimum order count
        lifetime_value_min: Minimum lifetime value
        last_order_days: Days since last order
        has_maintenance_orders: Filter customers with maintenance orders (true/false)
        has_refunds: Filter customers with refunds (true/false)
        
    Returns:
        Dict[str, Any]: Standardized API response with customers data
    """
    try:
        # Get query parameters
        segment = request.args.get('segment')
        city = request.args.get('city')
        limit = int(request.args.get('limit', 50))
        offset = int(request.args.get('offset', 0))
        search = request.args.get('search')
        satisfaction_min = request.args.get('satisfaction_min')
        return_rate_max = request.args.get('return_rate_max')
        order_count_min = request.args.get('order_count_min')
        lifetime_value_min = request.args.get('lifetime_value_min')
        last_order_days = request.args.get('last_order_days')
        has_maintenance_orders = request.args.get('has_maintenance_orders')
        has_refunds = request.args.get('has_refunds')
        
        with get_db() as conn:
            # Build query with enhanced filters
            query = """
                SELECT 
                    c.customer_id,
                    c.phone,
                    c.first_name,
                    c.last_name,
                    c.full_name,
                    c.primary_city,
                    c.primary_zone,
                    c.primary_district,
                    c.primary_address,
                    c.total_orders,
                    c.total_value,
                    c.avg_order_value,
                    c.first_order_date,
                    c.last_order_date,
                    c.customer_segment,
                    c.return_rate,
                    c.satisfaction_score,
                    c.created_at,
                    c.updated_at,
                    -- Enhanced analytics
                    CASE 
                        WHEN c.total_orders >= 10 OR c.total_value >= 5000 THEN 'Premium'
                        WHEN c.total_orders >= 3 THEN 'Regular'
                        WHEN c.return_rate >= 30 THEN 'Problematic'
                        ELSE 'New'
                    END as business_segment,
                    CASE 
                        WHEN c.satisfaction_score >= 0.8 THEN 'Satisfied'
                        WHEN c.satisfaction_score >= 0.6 THEN 'Neutral'
                        ELSE 'Dissatisfied'
                    END as satisfaction_level,
                    CASE 
                        WHEN c.return_rate >= 30 THEN 'High Risk'
                        WHEN c.return_rate >= 15 THEN 'Medium Risk'
                        ELSE 'Low Risk'
                    END as risk_level
                FROM customers c
                WHERE 1=1
            """
            params = []
            
            if segment:
                query += " AND c.customer_segment = ?"
                params.append(segment)
            
            if city:
                query += " AND c.primary_city = ?"
                params.append(city)
            
            if search:
                query += """ AND (
                    c.full_name LIKE ? OR 
                    c.first_name LIKE ? OR 
                    c.last_name LIKE ? OR 
                    c.phone LIKE ?
                )"""
                search_term = f"%{search}%"
                params.extend([search_term, search_term, search_term, search_term])
            
            if satisfaction_min:
                query += " AND c.satisfaction_score >= ?"
                params.append(float(satisfaction_min))
            
            if return_rate_max:
                query += " AND c.return_rate <= ?"
                params.append(float(return_rate_max))
            
            if order_count_min:
                query += " AND c.total_orders >= ?"
                params.append(int(order_count_min))
            
            if lifetime_value_min:
                query += " AND c.total_value >= ?"
                params.append(float(lifetime_value_min))
            
            if last_order_days:
                days_ago = datetime.now() - timedelta(days=int(last_order_days))
                query += " AND c.last_order_date >= ?"
                params.append(days_ago.isoformat())
            
            # Complex filters for maintenance orders and refunds
            if has_maintenance_orders is not None:
                if has_maintenance_orders.lower() == 'true':
                    query += """ AND EXISTS (
                        SELECT 1 FROM orders o 
                        WHERE o.receiver_phone = c.phone 
                        AND o.state_code = 45 
                        AND CAST(o.cod AS REAL) <= 500 
                        AND CAST(o.cod AS REAL) > 0
                    )"""
                else:
                    query += """ AND NOT EXISTS (
                        SELECT 1 FROM orders o 
                        WHERE o.receiver_phone = c.phone 
                        AND o.state_code = 45 
                        AND CAST(o.cod AS REAL) <= 500 
                        AND CAST(o.cod AS REAL) > 0
                    )"""
            
            if has_refunds is not None:
                if has_refunds.lower() == 'true':
                    query += """ AND EXISTS (
                        SELECT 1 FROM orders o 
                        WHERE o.receiver_phone = c.phone 
                        AND CAST(o.cod AS REAL) < 0
                    )"""
                else:
                    query += """ AND NOT EXISTS (
                        SELECT 1 FROM orders o 
                        WHERE o.receiver_phone = c.phone 
                        AND CAST(o.cod AS REAL) < 0
                    )"""
            
            # Add ordering and pagination
            query += " ORDER BY c.last_order_date DESC, c.total_value DESC, c.customer_id DESC"
            query += " LIMIT ? OFFSET ?"
            params.extend([limit, offset])
            
            # Execute query
            cursor = conn.execute(query, params)
            customers = []
            
            for row in cursor.fetchall():
                customers.append({
                    'customer_id': row[0],
                    'phone': row[1],
                    'first_name': row[2],
                    'last_name': row[3],
                    'full_name': row[4],
                    'primary_city': row[5],
                    'primary_zone': row[6],
                    'primary_district': row[7],
                    'primary_address': row[8],
                    'total_orders': row[9],
                    'total_value': row[10],
                    'avg_order_value': row[11],
                    'first_order_date': row[12],
                    'last_order_date': row[13],
                    'customer_segment': row[14],
                    'return_rate': row[15],
                    'satisfaction_score': row[16],
                    'created_at': row[17],
                    'updated_at': row[18],
                    'business_segment': row[19],
                    'satisfaction_level': row[20],
                    'risk_level': row[21]
                })
            
            # Get total count for pagination
            count_query = "SELECT COUNT(*) FROM customers WHERE 1=1"
            count_params = []
            
            if segment:
                count_query += " AND customer_segment = ?"
                count_params.append(segment)
            
            if city:
                count_query += " AND primary_city = ?"
                count_params.append(city)
            
            if search:
                count_query += """ AND (
                    full_name LIKE ? OR 
                    first_name LIKE ? OR 
                    last_name LIKE ? OR 
                    phone LIKE ?
                )"""
                search_term = f"%{search}%"
                count_params.extend([search_term, search_term, search_term, search_term])
            
            if satisfaction_min:
                count_query += " AND satisfaction_score >= ?"
                count_params.append(float(satisfaction_min))
            
            if return_rate_max:
                count_query += " AND return_rate <= ?"
                count_params.append(float(return_rate_max))
            
            if order_count_min:
                count_query += " AND total_orders >= ?"
                count_params.append(int(order_count_min))
            
            if lifetime_value_min:
                count_query += " AND total_value >= ?"
                count_params.append(float(lifetime_value_min))
            
            if last_order_days:
                days_ago = datetime.now() - timedelta(days=int(last_order_days))
                count_query += " AND last_order_date >= ?"
                count_params.append(days_ago.isoformat())
            
            # Add complex filters for maintenance orders and refunds to count query
            if has_maintenance_orders is not None:
                if has_maintenance_orders.lower() == 'true':
                    count_query += """ AND EXISTS (
                        SELECT 1 FROM orders o 
                        WHERE o.receiver_phone = customers.phone 
                        AND o.state_code = 45 
                        AND CAST(o.cod AS REAL) <= 500 
                        AND CAST(o.cod AS REAL) > 0
                    )"""
                else:
                    count_query += """ AND NOT EXISTS (
                        SELECT 1 FROM orders o 
                        WHERE o.receiver_phone = customers.phone 
                        AND o.state_code = 45 
                        AND CAST(o.cod AS REAL) <= 500 
                        AND CAST(o.cod AS REAL) > 0
                    )"""
            
            if has_refunds is not None:
                if has_refunds.lower() == 'true':
                    count_query += """ AND EXISTS (
                        SELECT 1 FROM orders o 
                        WHERE o.receiver_phone = customers.phone 
                        AND CAST(o.cod AS REAL) < 0
                    )"""
                else:
                    count_query += """ AND NOT EXISTS (
                        SELECT 1 FROM orders o 
                        WHERE o.receiver_phone = customers.phone 
                        AND CAST(o.cod AS REAL) < 0
                    )"""
            
            cursor = conn.execute(count_query, count_params)
            total_count = cursor.fetchone()[0]
            
            return create_api_response(
                True,
                data={
                    'customers': customers,
                    'pagination': {
                        'total': total_count,
                        'limit': limit,
                        'offset': offset,
                        'has_more': (offset + limit) < total_count
                    }
                }
            )
            
    except Exception as e:
        logger.error(f"❌ Failed to get customers: {e}")
        return create_api_response(False, error=str(e))

@bp.route('/<phone>', methods=['GET'])
def get_customer(phone: str) -> Dict[str, Any]:
    """
    Get detailed customer information with enhanced analytics and order breakdown
    
    Args:
        phone: Customer phone number (can be 01, 201, etc.)
        
    Returns:
        Dict[str, Any]: Standardized API response with customer details
    """
    try:
        # Normalize phone number to handle different formats
        normalized_phone = normalize_phone(phone)
        
        with get_db() as conn:
            # Get customer basic info by phone number (try both original and normalized)
            cursor = conn.execute("""
                SELECT 
                    customer_id, phone, first_name, last_name, full_name,
                    primary_city, primary_zone, primary_district, primary_address,
                    total_orders, total_value, avg_order_value,
                    first_order_date, last_order_date, customer_segment,
                    return_rate, satisfaction_score, created_at, updated_at
                FROM customers 
                WHERE phone = ? OR phone = ?
            """, (phone, normalized_phone))
            
            customer_row = cursor.fetchone()
            if not customer_row:
                return create_api_response(False, error="Customer not found")
            
            customer = {
                'customer_id': customer_row[0],
                'phone': customer_row[1],
                'first_name': customer_row[2],
                'last_name': customer_row[3],
                'full_name': customer_row[4],
                'primary_city': customer_row[5],
                'primary_zone': customer_row[6],
                'primary_district': customer_row[7],
                'primary_address': customer_row[8],
                'total_orders': customer_row[9],
                'total_value': customer_row[10],
                'avg_order_value': customer_row[11],
                'first_order_date': customer_row[12],
                'last_order_date': customer_row[13],
                'customer_segment': customer_row[14],
                'return_rate': customer_row[15],
                'satisfaction_score': customer_row[16],
                'created_at': customer_row[17],
                'updated_at': customer_row[18]
            }
            
            # Get enhanced order analytics for this customer
            cursor = conn.execute("""
                SELECT 
                    COUNT(*) as total_orders,
                    COUNT(CASE WHEN state_code = 45 THEN 1 END) as delivered_orders,
                    COUNT(CASE WHEN state_code = 46 THEN 1 END) as returned_orders,
                    COUNT(CASE WHEN state_code = 48 THEN 1 END) as cancelled_orders,
                    
                    -- COD analysis
                    SUM(CASE WHEN CAST(cod AS REAL) > 0 THEN CAST(cod AS REAL) ELSE 0 END) as total_cod_revenue,
                    AVG(CASE WHEN CAST(cod AS REAL) > 0 THEN CAST(cod AS REAL) ELSE NULL END) as avg_cod,
                    COUNT(CASE WHEN CAST(cod AS REAL) > 500 THEN 1 END) as high_value_orders,
                    COUNT(CASE WHEN CAST(cod AS REAL) > 0 AND CAST(cod AS REAL) <= 500 THEN 1 END) as maintenance_orders,
                    COUNT(CASE WHEN CAST(cod AS REAL) = 0 THEN 1 END) as service_orders,
                    COUNT(CASE WHEN CAST(cod AS REAL) < 0 THEN 1 END) as refund_orders,
                    SUM(CASE WHEN CAST(cod AS REAL) < 0 THEN CAST(cod AS REAL) ELSE 0 END) as total_refunds,
                    
                    -- Order types
                    COUNT(CASE WHEN order_type_code = 10 THEN 1 END) as send_orders,
                    COUNT(CASE WHEN order_type_code = 20 THEN 1 END) as return_orders,
                    COUNT(CASE WHEN order_type_code = 25 THEN 1 END) as customer_return_orders,
                    COUNT(CASE WHEN order_type_code = 30 THEN 1 END) as exchange_orders,
                    
                    -- Performance metrics
                    AVG(CASE WHEN delivery_time_hours IS NOT NULL THEN delivery_time_hours ELSE NULL END) as avg_delivery_time,
                    COUNT(CASE WHEN order_sla_exceeded = 1 THEN 1 END) as sla_exceeded_orders,
                    COUNT(CASE WHEN e2e_sla_exceeded = 1 THEN 1 END) as e2e_sla_exceeded_orders
                FROM orders
                WHERE receiver_phone = ? OR receiver_phone = ?
            """, (phone, normalized_phone))
            
            analytics_row = cursor.fetchone()
            order_analytics = {
                'total_orders': analytics_row[0] or 0,
                'delivered_orders': analytics_row[1] or 0,
                'returned_orders': analytics_row[2] or 0,
                'cancelled_orders': analytics_row[3] or 0,
                'delivery_success_rate': round((analytics_row[1] / analytics_row[0] * 100) if analytics_row[0] > 0 else 0, 2),
                'return_rate': round((analytics_row[2] / analytics_row[0] * 100) if analytics_row[0] > 0 else 0, 2),
                'cod_analysis': {
                    'total_cod_revenue': float(analytics_row[4] or 0),
                    'avg_cod': float(analytics_row[5] or 0),
                    'high_value_orders': analytics_row[6] or 0,
                    'maintenance_orders': analytics_row[7] or 0,
                    'service_orders': analytics_row[8] or 0,
                    'refund_orders': analytics_row[9] or 0,
                    'total_refunds': float(analytics_row[10] or 0),
                    'net_revenue': float((analytics_row[4] or 0) + (analytics_row[10] or 0))
                },
                'order_types': {
                    'send_orders': analytics_row[11] or 0,
                    'return_orders': analytics_row[12] or 0,
                    'customer_return_orders': analytics_row[13] or 0,
                    'exchange_orders': analytics_row[14] or 0
                },
                'performance_metrics': {
                    'avg_delivery_time': float(analytics_row[15] or 0),
                    'sla_exceeded_orders': analytics_row[16] or 0,
                    'e2e_sla_exceeded_orders': analytics_row[17] or 0,
                    'sla_compliance_rate': round(((analytics_row[0] - analytics_row[16]) / analytics_row[0] * 100) if analytics_row[0] > 0 else 0, 2)
                },

            }
            
            # Get customer addresses
            cursor = conn.execute("""
                SELECT address_id, city, zone, district, address_line, is_primary, created_at
                FROM customer_addresses 
                WHERE customer_id = ?
                ORDER BY is_primary DESC, created_at DESC
            """, (customer_row[0],))
            
            addresses = []
            for row in cursor.fetchall():
                addresses.append({
                    'address_id': row[0],
                    'city': row[1],
                    'zone': row[2],
                    'district': row[3],
                    'address_line': row[4],
                    'is_primary': bool(row[5]),
                    'created_at': row[6]
                })
            
            # Get customer analytics
            cursor = conn.execute("""
                SELECT 
                    lifetime_value, avg_order_value, order_frequency,
                    return_rate, satisfaction_score, churn_risk_score,
                    next_purchase_prediction, customer_health_score,
                    segment_recommendation, last_updated
                FROM customer_analytics 
                WHERE customer_id = ?
            """, (customer_row[0],))
            
            analytics_row = cursor.fetchone()
            analytics = None
            if analytics_row:
                analytics = {
                    'lifetime_value': analytics_row[0],
                    'avg_order_value': analytics_row[1],
                    'order_frequency': analytics_row[2],
                    'return_rate': analytics_row[3],
                    'satisfaction_score': analytics_row[4],
                    'churn_risk_score': analytics_row[5],
                    'next_purchase_prediction': analytics_row[6],
                    'customer_health_score': analytics_row[7],
                    'segment_recommendation': analytics_row[8],
                    'last_updated': analytics_row[9]
                }
            
            # Get recent interactions
            cursor = conn.execute("""
                SELECT 
                    interaction_id, interaction_type, channel, subject,
                    priority, status, assigned_agent, customer_satisfaction,
                    created_at, resolved_at
                FROM customer_interactions 
                WHERE customer_id = ?
                ORDER BY created_at DESC
                LIMIT 10
            """, (customer_row[0],))
            
            interactions = []
            for row in cursor.fetchall():
                interactions.append({
                    'interaction_id': row[0],
                    'interaction_type': row[1],
                    'channel': row[2],
                    'subject': row[3],
                    'priority': row[4],
                    'status': row[5],
                    'assigned_agent': row[6],
                    'customer_satisfaction': row[7],
                    'created_at': row[8],
                    'resolved_at': row[9]
                })
            
            return create_api_response(
                True,
                data={
                    'customer': customer,
                    'order_analytics': order_analytics,
                    'addresses': addresses,
                    'analytics': analytics,
                    'recent_interactions': interactions
                }
            )
            
    except Exception as e:
        logger.error(f"❌ Failed to get customer {phone}: {e}")
        return create_api_response(False, error=str(e))

@bp.route('/<phone>/orders', methods=['GET'])
def get_customer_orders(phone: str) -> Dict[str, Any]:
    """
    Get customer orders with enhanced business categorization
    
    Args:
        phone: Customer phone number
        
    Query Parameters:
        page: Page number (default: 1)
        limit: Items per page (default: 25, max: 100)
        order_category: Filter by order category (real_sales, maintenance, service, refund)
        state: Filter by order state
        date_from: Filter from date (YYYY-MM-DD)
        date_to: Filter to date (YYYY-MM-DD)
        
    Returns:
        Dict[str, Any]: Standardized API response with orders data
    """
    try:
        # Normalize phone number
        normalized_phone = normalize_phone(phone)
        
        # Get query parameters
        page = int(request.args.get('page', 1))
        limit = min(int(request.args.get('limit', 25)), 100)
        offset = (page - 1) * limit
        order_category = request.args.get('order_category')
        state_str = request.args.get('state')
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        
        with get_db() as conn:
            # Check if customer exists
            cursor = conn.execute("SELECT 1 FROM customers WHERE phone = ? OR phone = ?", (phone, normalized_phone))
            if not cursor.fetchone():
                return create_api_response(False, error="Customer not found"), 404

            # Build query with enhanced categorization
            # Use centralized classification service for consistent categorization
            from app.services.order_classification import order_classifier
            business_cat_sql = order_classifier.get_business_categorization_sql()
            cod_cat_sql = order_classifier.get_cod_categorization_sql()
            
            query = f"""
                SELECT 
                    *,
                    {business_cat_sql},
                    {cod_cat_sql}
                FROM orders 
                WHERE (receiver_phone = ? OR receiver_phone = ?)
            """
            params = [phone, normalized_phone]
            
            if order_category:
                # Use centralized classification service for filtering
                base_query = ""
                updated_query, _ = order_classifier.apply_business_category_filter(
                    base_query, [], order_category
                )
                if updated_query:
                    query += updated_query
            
            if state_str:
                try:
                    state = int(state_str)
                    query += " AND state_code = ?"
                    params.append(state)
                except ValueError:
                    return create_api_response(False, error=f"Invalid state value: {state_str}")
            
            if date_from:
                query += " AND date(created_at) >= date(?)"
                params.append(date_from)
            
            if date_to:
                query += " AND date(created_at) <= date(?)"
                params.append(date_to)
            
            # Get total count
            # Create a simple count query without the classification SQL
            count_query = f"""
                SELECT COUNT(*)
                FROM orders 
                WHERE (receiver_phone = ? OR receiver_phone = ?)
            """
            count_params = [phone, normalized_phone]
            
            # Apply the same filters to count query
            if order_category:
                base_query = ""
                updated_query, _ = order_classifier.apply_business_category_filter(
                    base_query, [], order_category
                )
                if updated_query:
                    count_query += updated_query
            
            if state_str:
                try:
                    state = int(state_str)
                    count_query += " AND state_code = ?"
                    count_params.append(state)
                except ValueError:
                    return create_api_response(False, error=f"Invalid state value: {state_str}")
            
            if date_from:
                count_query += " AND date(created_at) >= date(?)"
                count_params.append(date_from)
            
            if date_to:
                count_query += " AND date(created_at) <= date(?)"
                count_params.append(date_to)
            
            cursor = conn.execute(count_query, count_params)
            count_result = cursor.fetchone()
            total_count = int(count_result[0]) if count_result and count_result[0] is not None else 0
            
            # Add ordering and pagination
            query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
            params.extend([limit, offset])
            
            cursor = conn.execute(query, params)
            
            # Convert to list of dictionaries
            columns = [column[0] for column in cursor.description]
            orders = []
            
            for row in cursor.fetchall():
                order = dict(zip(columns, row))
                # Format financial data
                for field in ['cod', 'bosta_fees', 'deposited_amount']:
                    if field in order and order[field] is not None:
                        order[field] = float(order[field])
                
                # Format boolean fields
                for field in ['is_confirmed_delivery', 'allow_open_package', 'order_sla_exceeded', 'e2e_sla_exceeded']:
                    if field in order:
                        order[field] = bool(order[field])
                
                # Parse timeline JSON safely
                if 'timeline_json' in order:
                    if order['timeline_json'] is not None:
                        try:
                            import json
                            order['timeline'] = json.loads(order['timeline_json'])
                        except (json.JSONDecodeError, TypeError):
                            order['timeline'] = []
                    else:
                        order['timeline'] = []
                else:
                    order['timeline'] = []
                
                # Remove timeline_json field as it's not needed in response
                order.pop('timeline_json', None)
                
                orders.append(order)
            
            return create_api_response(
                True,
                data={
                    'orders': orders,
                    'pagination': {
                        'total': total_count,
                        'page': page,
                        'limit': limit,
                        'has_more': (offset + limit) < total_count
                    }
                }
            )
            
    except Exception as e:
        logger.error(f"❌ Failed to get customer orders {phone}: {e}")
        return create_api_response(False, error=str(e))

@bp.route('/<phone>/interactions', methods=['GET'])
def get_customer_interactions(phone: str) -> Dict[str, Any]:
    """
    Get customer interactions with filtering and pagination
    
    Args:
        phone: Customer phone number (can be 01, 201, etc.)
        
    Query Parameters:
        status: Filter by interaction status
        type: Filter by interaction type
        limit: Number of interactions to return (default: 20)
        offset: Number of interactions to skip (default: 0)
        
    Returns:
        Dict[str, Any]: Standardized API response with interactions data
    """
    try:
        # Normalize phone number to handle different formats
        normalized_phone = normalize_phone(phone)
        
        # Get query parameters
        status = request.args.get('status')
        interaction_type = request.args.get('type')
        limit = int(request.args.get('limit', 20))
        offset = int(request.args.get('offset', 0))
        
        with get_db() as conn:
            # First get customer_id from phone (try both original and normalized)
            cursor = conn.execute("SELECT customer_id FROM customers WHERE phone = ? OR phone = ?", (phone, normalized_phone))
            customer_row = cursor.fetchone()
            if not customer_row:
                return create_api_response(False, error="Customer not found")
            
            customer_id = customer_row[0]
            
            # Build query with filters
            query = """
                SELECT 
                    interaction_id, interaction_type, channel, subject, description,
                    priority, status, assigned_agent, customer_satisfaction,
                    resolution_time_hours, follow_up_date, follow_up_notes,
                    created_at, updated_at, resolved_at
                FROM customer_interactions
                WHERE customer_id = ?
            """
            params = [customer_id]
            
            if status:
                query += " AND status = ?"
                params.append(status)
            
            if interaction_type:
                query += " AND interaction_type = ?"
                params.append(interaction_type)
            
            # Add ordering and pagination
            query += " ORDER BY created_at DESC"
            query += " LIMIT ? OFFSET ?"
            params.extend([limit, offset])
            
            # Execute query
            cursor = conn.execute(query, params)
            interactions = []
            
            for row in cursor.fetchall():
                interactions.append({
                    'interaction_id': row[0],
                    'interaction_type': row[1],
                    'channel': row[2],
                    'subject': row[3],
                    'description': row[4],
                    'priority': row[5],
                    'status': row[6],
                    'assigned_agent': row[7],
                    'customer_satisfaction': row[8],
                    'resolution_time_hours': row[9],
                    'follow_up_date': row[10],
                    'follow_up_notes': row[11],
                    'created_at': row[12],
                    'updated_at': row[13],
                    'resolved_at': row[14]
                })
            
            # Get total count for pagination
            count_query = "SELECT COUNT(*) FROM customer_interactions WHERE customer_id = ?"
            count_params = [customer_id]
            
            if status:
                count_query += " AND status = ?"
                count_params.append(status)
            
            if interaction_type:
                count_query += " AND interaction_type = ?"
                count_params.append(interaction_type)
            
            cursor = conn.execute(count_query, count_params)
            total_count = cursor.fetchone()[0]
            
            return create_api_response(
                True,
                data={
                    'interactions': interactions,
                    'pagination': {
                        'total': total_count,
                        'limit': limit,
                        'offset': offset,
                        'has_more': (offset + limit) < total_count
                    }
                }
            )
            
    except Exception as e:
        logger.error(f"❌ Failed to get customer interactions {phone}: {e}")
        return create_api_response(False, error=str(e))

@bp.route('/<phone>/interactions', methods=['POST'])
def create_customer_interaction(phone: str) -> Dict[str, Any]:
    """
    Create a new customer interaction
    
    Args:
        phone: Customer phone number (can be 01, 201, etc.)
        
    Request Body:
        interaction_type: Type of interaction
        channel: Communication channel
        subject: Interaction subject
        description: Interaction description
        priority: Priority level
        assigned_agent: Assigned agent name
        
    Returns:
        Dict[str, Any]: Standardized API response with created interaction
    """
    try:
        # Normalize phone number to handle different formats
        normalized_phone = normalize_phone(phone)
        
        data = request.get_json()
        if not data:
            return create_api_response(False, error="No data provided")
        
        required_fields = ['interaction_type', 'channel', 'subject']
        for field in required_fields:
            if field not in data:
                return create_api_response(False, error=f"Missing required field: {field}")
        
        with get_db() as conn:
            # First get customer_id from phone (try both original and normalized)
            cursor = conn.execute("SELECT customer_id FROM customers WHERE phone = ? OR phone = ?", (phone, normalized_phone))
            customer_row = cursor.fetchone()
            if not customer_row:
                return create_api_response(False, error="Customer not found")
            
            customer_id = customer_row[0]
            
            # Insert interaction
            cursor = conn.execute("""
                INSERT INTO customer_interactions (
                    customer_id, interaction_type, channel, subject, description,
                    priority, status, assigned_agent
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                customer_id,
                data['interaction_type'],
                data['channel'],
                data['subject'],
                data.get('description', ''),
                data.get('priority', 'medium'),
                'pending',
                data.get('assigned_agent', '')
            ))
            
            interaction_id = cursor.lastrowid
            conn.commit()
            
            # Get created interaction
            cursor = conn.execute("""
                SELECT 
                    interaction_id, interaction_type, channel, subject, description,
                    priority, status, assigned_agent, created_at
                FROM customer_interactions 
                WHERE interaction_id = ?
            """, (interaction_id,))
            
            interaction_row = cursor.fetchone()
            interaction = {
                'interaction_id': interaction_row[0],
                'interaction_type': interaction_row[1],
                'channel': interaction_row[2],
                'subject': interaction_row[3],
                'description': interaction_row[4],
                'priority': interaction_row[5],
                'status': interaction_row[6],
                'assigned_agent': interaction_row[7],
                'created_at': interaction_row[8]
            }
            
            return create_api_response(
                True,
                data={'interaction': interaction},
                message="Customer interaction created successfully"
            )
            
    except Exception as e:
        logger.error(f"❌ Failed to create customer interaction: {e}")
        return create_api_response(False, error=str(e))

@bp.route('/segments', methods=['GET'])
def get_customer_segments() -> Dict[str, Any]:
    """
    Get customer segments with enhanced statistics
    
    Returns:
        Dict[str, Any]: Standardized API response with segments data
    """
    try:
        with get_db() as conn:
            cursor = conn.execute("""
                SELECT 
                    segment_name, min_orders, min_value, max_return_rate, description
                FROM customer_segments
                ORDER BY min_orders, min_value
            """)
            
            segments = []
            for row in cursor.fetchall():
                segments.append({
                    'segment_name': row[0],
                    'min_orders': row[1],
                    'min_value': row[2],
                    'max_return_rate': row[3],
                    'description': row[4]
                })
            
            return create_api_response(True, data={'segments': segments})
            
    except Exception as e:
        logger.error(f"❌ Failed to get customer segments: {e}")
        return create_api_response(False, error=str(e))

@bp.route('/analytics', methods=['GET'])
def get_customer_analytics() -> Dict[str, Any]:
    """
    Get comprehensive customer analytics based on real data
    
    Query Parameters:
        segment: Filter by customer segment
        city: Filter by primary city
        date_from: Filter from date (YYYY-MM-DD)
        date_to: Filter to date (YYYY-MM-DD)
        
    Returns:
        Dict[str, Any]: Standardized API response with analytics data
    """
    try:
        segment = request.args.get('segment')
        city = request.args.get('city')
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        
        with get_db() as conn:
            # Build analytics query
            query = """
                SELECT 
                    c.customer_segment,
                    COUNT(*) as customer_count,
                    AVG(c.total_value) as avg_lifetime_value,
                    AVG(c.avg_order_value) as avg_order_value,
                    AVG(c.return_rate) as avg_return_rate,
                    AVG(c.satisfaction_score) as avg_satisfaction,
                    SUM(c.total_orders) as total_orders,
                    SUM(c.total_value) as total_revenue,
                    COUNT(CASE WHEN c.total_orders >= 10 OR c.total_value >= 5000 THEN 1 END) as premium_customers,
                    COUNT(CASE WHEN c.return_rate >= 30 THEN 1 END) as high_return_customers,
                    COUNT(CASE WHEN c.satisfaction_score >= 0.8 THEN 1 END) as satisfied_customers
                FROM customers c
                WHERE 1=1
            """
            params = []
            
            if segment:
                query += " AND c.customer_segment = ?"
                params.append(segment)
            
            if city:
                query += " AND c.primary_city = ?"
                params.append(city)
            
            query += " GROUP BY c.customer_segment"
            
            cursor = conn.execute(query, params)
            analytics = []
            
            for row in cursor.fetchall():
                analytics.append({
                    'segment': row[0],
                    'customer_count': row[1],
                    'avg_lifetime_value': row[2],
                    'avg_order_value': row[3],
                    'avg_return_rate': row[4],
                    'avg_satisfaction': row[5],
                    'total_orders': row[6],
                    'total_revenue': row[7],
                    'premium_customers': row[8],
                    'high_return_customers': row[9],
                    'satisfied_customers': row[10]
                })
            
            # Get overall metrics
            overall_query = """
                SELECT 
                    COUNT(*) as total_customers,
                    AVG(total_value) as avg_lifetime_value,
                    AVG(return_rate) as avg_return_rate,
                    AVG(satisfaction_score) as avg_satisfaction,
                    SUM(total_orders) as total_orders,
                    SUM(total_value) as total_revenue,
                    COUNT(CASE WHEN total_orders >= 10 OR total_value >= 5000 THEN 1 END) as premium_customers,
                    COUNT(CASE WHEN return_rate >= 30 THEN 1 END) as high_return_customers,
                    COUNT(CASE WHEN satisfaction_score >= 0.8 THEN 1 END) as satisfied_customers
                FROM customers
                WHERE 1=1
            """
            overall_params = []
            
            if segment:
                overall_query += " AND customer_segment = ?"
                overall_params.append(segment)
            
            if city:
                overall_query += " AND primary_city = ?"
                overall_params.append(city)
            
            cursor = conn.execute(overall_query, overall_params)
            overall_row = cursor.fetchone()
            
            total_customers = overall_row[0] or 0
            
            overall_metrics = {
                'total_customers': total_customers,
                'avg_lifetime_value': overall_row[1],
                'avg_return_rate': overall_row[2],
                'avg_satisfaction': overall_row[3],
                'total_orders': overall_row[4],
                'total_revenue': overall_row[5],
                'premium_customers': overall_row[6],
                'high_return_customers': overall_row[7],
                'satisfied_customers': overall_row[8],
                'premium_percentage': round((overall_row[6] / total_customers * 100) if total_customers > 0 else 0, 2),
                'high_return_percentage': round((overall_row[7] / total_customers * 100) if total_customers > 0 else 0, 2),
                'satisfaction_percentage': round((overall_row[8] / total_customers * 100) if total_customers > 0 else 0, 2)
            }
            
            return create_api_response(
                True,
                data={
                    'overall_metrics': overall_metrics,
                    'segment_analytics': analytics
                }
            )
            
    except Exception as e:
        logger.error(f"❌ Failed to get customer analytics: {e}")
        return create_api_response(False, error=str(e)) 

@bp.route('/realtime-analytics/<phone>', methods=['GET'])
def get_customer_realtime_analytics(phone: str) -> Dict[str, Any]:
    """
    Get real-time analytics for a specific customer using the new CustomerProfileManager
    
    Args:
        phone: Customer phone number
        
    Returns:
        Dict[str, Any]: Standardized API response with real-time customer analytics
    """
    try:
        # Use the new real-time analytics system
        analytics_result = customer_profile_manager.get_customer_realtime_analytics(phone)
        
        if analytics_result.get('success'):
            return create_api_response(
                True,
                data=analytics_result,
                message='Real-time customer analytics retrieved successfully'
            )
        else:
            return create_api_response(False, error=analytics_result.get('error'))
            
    except Exception as e:
        logger.error(f"❌ Failed to get real-time customer analytics: {e}")
        return create_api_response(False, error=str(e))

@bp.route('/duplicates/detect', methods=['POST'])
def detect_customer_duplicates() -> Dict[str, Any]:
    """
    Detect potential duplicate customers using similarity scoring
    
    Request Body:
        similarity_threshold: Float (0.0-1.0, default 0.8) - Minimum similarity for detection
        auto_merge: Boolean (default False) - Whether to automatically merge high-confidence duplicates
        
    Returns:
        Dict[str, Any]: Standardized API response with duplicate detection results
    """
    try:
        request_data = request.get_json() or {}
        similarity_threshold = float(request_data.get('similarity_threshold', 0.8))
        auto_merge = bool(request_data.get('auto_merge', False))
        
        # Validate threshold
        if not 0.0 <= similarity_threshold <= 1.0:
            return create_api_response(False, error='similarity_threshold must be between 0.0 and 1.0')
        
        with get_db() as conn:
            if auto_merge:
                # Perform automatic detection and merging
                result = customer_profile_manager.find_and_merge_duplicates(conn, similarity_threshold)
            else:
                # Just detect duplicates without merging
                cursor = conn.execute("""
                    SELECT customer_id, phone, full_name, first_name, last_name, primary_city
                    FROM customers ORDER BY customer_id
                """)
                customers = cursor.fetchall()
                
                duplicates_found = []
                processed_ids = set()
                
                for i, customer in enumerate(customers):
                    if customer[0] in processed_ids:
                        continue
                    
                    customer_id, phone, full_name, first_name, last_name, city = customer
                    potential_duplicates = []
                    
                    # Check against remaining customers
                    for j in range(i + 1, len(customers)):
                        other_customer = customers[j]
                        other_id = other_customer[0]
                        
                        if other_id in processed_ids:
                            continue
                        
                        # Calculate similarity score
                        similarity_score = customer_profile_manager._calculate_customer_similarity(
                            (phone, full_name, first_name, last_name, city),
                            other_customer[1:]  # Skip ID
                        )
                        
                        if similarity_score >= similarity_threshold:
                            potential_duplicates.append({
                                'customer_id': other_id,
                                'phone': other_customer[1],
                                'full_name': other_customer[2],
                                'similarity_score': round(similarity_score, 3)
                            })
                            processed_ids.add(other_id)
                    
                    if potential_duplicates:
                        duplicates_found.append({
                            'primary_customer': {
                                'customer_id': customer_id,
                                'phone': phone,
                                'full_name': full_name
                            },
                            'duplicates': potential_duplicates
                        })
                        processed_ids.add(customer_id)
                
                result = {
                    'success': True,
                    'duplicate_groups_found': len(duplicates_found),
                    'duplicates': duplicates_found
                }
            
            return create_api_response(
                True,
                data=result,
                message=f'Duplicate detection completed with threshold {similarity_threshold}'
            )
            
    except Exception as e:
        logger.error(f"❌ Failed to detect customer duplicates: {e}")
        return create_api_response(False, error=str(e))

@bp.route('/duplicates/merge', methods=['POST'])
def merge_customer_duplicates() -> Dict[str, Any]:
    """
    Merge duplicate customers manually
    
    Request Body:
        primary_customer_id: Integer - The customer to keep
        duplicate_customer_ids: List of integers - Customer IDs to merge into primary
        
    Returns:
        Dict[str, Any]: Standardized API response with merge results
    """
    try:
        request_data = request.get_json()
        if not request_data:
            return create_api_response(False, error='Request body is required')
        
        primary_customer_id = request_data.get('primary_customer_id')
        duplicate_customer_ids = request_data.get('duplicate_customer_ids', [])
        
        if not primary_customer_id or not duplicate_customer_ids:
            return create_api_response(False, error='primary_customer_id and duplicate_customer_ids are required')
        
        if not isinstance(duplicate_customer_ids, list):
            return create_api_response(False, error='duplicate_customer_ids must be a list')
        
        with get_db() as conn:
            # Perform the merge
            merge_result = customer_profile_manager.merge_duplicate_customers(
                conn, primary_customer_id, duplicate_customer_ids
            )
            
            if merge_result.get('success'):
                conn.commit()
                return create_api_response(
                    True,
                    data=merge_result,
                    message=f'Successfully merged {merge_result.get("merged_count", 0)} customers'
                )
            else:
                return create_api_response(False, error=merge_result.get('error'))
            
    except Exception as e:
        logger.error(f"❌ Failed to merge customer duplicates: {e}")
        return create_api_response(False, error=str(e))



@bp.route('/merge-by-phone', methods=['POST'])
def merge_customers_by_phone() -> Dict[str, Any]:
    """
    Merge two customers using two phone numbers as identifiers.

    Request Body:
      - primary_phone: Phone of the customer to keep
      - secondary_phone: Phone of the customer to merge into the primary

    Behavior:
      - Normalizes both phone numbers
      - Finds both customers by phone
      - Merges orders, addresses, interactions, and service queue into primary
      - Chooses the better display name between the two and updates the primary
    """
    try:
        payload = request.get_json() or {}
        primary_phone_raw = payload.get('primary_phone')
        secondary_phone_raw = payload.get('secondary_phone')

        if not primary_phone_raw or not secondary_phone_raw:
            return create_api_response(False, error='primary_phone and secondary_phone are required')

        primary_phone = normalize_phone(primary_phone_raw)
        secondary_phone = normalize_phone(secondary_phone_raw)

        if primary_phone == 'unknown' or secondary_phone == 'unknown':
            return create_api_response(False, error='Provided phone numbers are invalid')

        if primary_phone == secondary_phone:
            return create_api_response(False, error='Both phones normalize to the same number; nothing to merge')

        with get_db() as conn:
            # Lookup customers by phone
            cursor = conn.execute(
                """
                SELECT customer_id, phone, full_name, first_name, last_name, total_orders, total_value
                FROM customers WHERE phone IN (?, ?)
                """,
                (primary_phone, secondary_phone)
            )
            rows = cursor.fetchall()

            # Map by phone
            customers_map = {row['phone']: row for row in rows}
            primary_row = customers_map.get(primary_phone)
            secondary_row = customers_map.get(secondary_phone)

            if not primary_row:
                return create_api_response(False, error=f'Primary customer not found for phone {primary_phone}')
            if not secondary_row:
                return create_api_response(False, error=f'Secondary customer not found for phone {secondary_phone}')

            primary_customer_id = primary_row['customer_id']
            duplicate_customer_id = secondary_row['customer_id']

            # Determine better display name between the two
            def resolve_full_name(row) -> str:
                fn = (row['full_name'] or '').strip()
                if fn:
                    return fn
                first = (row['first_name'] or '').strip()
                last = (row['last_name'] or '').strip()
                return f"{first} {last}".strip()

            name_primary = resolve_full_name(primary_row)
            name_secondary = resolve_full_name(secondary_row)

            # Prefer non-empty name with longer length; if tie, prefer the one with higher total_orders/total_value
            def name_score(name: str, row) -> tuple:
                return (1 if name else 0, len(name), int(row['total_orders'] or 0), float(row['total_value'] or 0.0))

            best_name = name_primary
            best_first = primary_row['first_name']
            best_last = primary_row['last_name']

            if name_score(name_secondary, secondary_row) > name_score(name_primary, primary_row):
                best_name = name_secondary
                best_first = secondary_row['first_name']
                best_last = secondary_row['last_name']

            # Perform merge via existing service
            merge_result = customer_profile_manager.merge_duplicate_customers(
                conn, primary_customer_id, [duplicate_customer_id]
            )

            if not merge_result.get('success'):
                return create_api_response(False, error=merge_result.get('error', 'Merge failed'))

            # Update primary customer name if we found a better one
            if best_name and best_name.strip():
                conn.execute(
                    """
                    UPDATE customers
                    SET full_name = COALESCE(?, full_name),
                        first_name = COALESCE(?, first_name),
                        last_name = COALESCE(?, last_name),
                        updated_at = CURRENT_TIMESTAMP
                    WHERE customer_id = ?
                    """,
                    (best_name, best_first, best_last, primary_customer_id)
                )

            # Commit done implicitly by context manager (autocommit enabled)
            return create_api_response(
                True,
                data={
                    'primary_customer_id': primary_customer_id,
                    'merged_customer_id': duplicate_customer_id,
                    'primary_phone': primary_phone,
                    'secondary_phone': secondary_phone,
                    'updated_full_name': best_name,
                    'merged_count': merge_result.get('merged_count', 1)
                },
                message='Customers merged successfully'
            )

    except Exception as e:
        logger.error(f"❌ Failed to merge customers by phone: {e}")
        return create_api_response(False, error=str(e))

@bp.route('/profile/update/<phone>', methods=['POST'])
def update_customer_profile_manual(phone: str) -> Dict[str, Any]:
    """
    Manually trigger customer profile update from all their orders
    
    This endpoint is for manual profile refresh when needed, but normally
    profiles are updated automatically during order processing.
    
    Args:
        phone: Customer phone number
        
    Returns:
        Dict[str, Any]: Standardized API response with update results
    """
    try:
        normalized_phone = normalize_phone(phone)
        
        with get_db() as conn:
            # Get all orders for this customer
            cursor = conn.execute("""
                SELECT * FROM orders 
                WHERE receiver_phone = ? OR receiver_phone = ?
                ORDER BY created_at DESC
            """, (phone, normalized_phone))
            
            orders = cursor.fetchall()
            if not orders:
                return create_api_response(False, error='No orders found for this customer')
            
            # Process the most recent order to update profile
            column_names = [description[0] for description in cursor.description]
            recent_order = dict(zip(column_names, orders[0]))
            
            # Update customer profile
            update_result = customer_profile_manager.process_customer_from_order(conn, recent_order)
            
            if update_result.get('success'):
                conn.commit()
                return create_api_response(
                    True,
                    data={
                        'customer_id': update_result.get('customer_id'),
                        'orders_found': len(orders),
                        'profile_updated': update_result.get('profile_updated'),
                        'analytics_updated': update_result.get('analytics_updated'),
                        'segment_changed': update_result.get('segment_changed'),
                        'new_segment': update_result.get('new_segment')
                    },
                    message='Customer profile updated successfully'
                )
            else:
                return create_api_response(False, error=update_result.get('error'))
            
    except Exception as e:
        logger.error(f"❌ Failed to update customer profile: {e}")
        return create_api_response(False, error=str(e))

@bp.route('/segments/update', methods=['POST'])
def update_all_customer_segments() -> Dict[str, Any]:
    """
    Update all customer segments based on current analytics
    
    Returns:
        Dict[str, Any]: Standardized API response with update results
    """
    try:
        with get_db() as conn:
            # Update all customer segments
            update_query = """
                UPDATE customers 
                SET customer_segment = CASE
                    WHEN total_orders >= 10 OR total_value >= 5000 THEN 'vip'
                    WHEN total_orders >= 3 OR total_value >= 1000 THEN 'regular'
                    WHEN return_rate >= 30 THEN 'problematic'
                    ELSE 'new'
                END
                WHERE customer_segment IS NULL OR customer_segment = ''
            """
            
            cursor = conn.execute(update_query)
            updated_count = cursor.rowcount
            
            return create_api_response(
                success=True,
                data={
                    'updated_customers': updated_count,
                    'message': f'Updated segments for {updated_count} customers'
                }
            )
            
    except Exception as e:
        logger.error(f"Error updating customer segments: {e}")
        return create_api_response(
            success=False,
            error=f"Failed to update customer segments: {str(e)}"
        )

@bp.route('/create', methods=['POST'])
def create_customer() -> Dict[str, Any]:
    """
    Create a new customer profile without requiring any orders.

    Accepts flexible fields and maps legacy keys to the current schema.

    Request JSON:
      - phone: required if secondary_phone not provided
      - secondary_phone: optional (used only to select best phone if provided)
      - first_name, last_name: optional
      - full_name or name: optional (falls back to first_name + last_name)
      - city or primary_city: optional
      - zone or primary_zone: optional
      - district or primary_district: optional
      - address or street or primary_address: optional

    Returns standardized API response with created customer data.
    """
    try:
        data = request.get_json() or {}

        # Normalize and validate phones
        primary_phone_input = data.get('phone') or data.get('primary_phone')
        secondary_phone_input = data.get('secondary_phone')

        primary_phone = normalize_phone(primary_phone_input) if primary_phone_input else None
        secondary_phone = normalize_phone(secondary_phone_input) if secondary_phone_input else None

        phone = primary_phone or secondary_phone
        if not phone or phone == 'unknown':
            return create_api_response(False, error='Valid phone number is required')

        # Names handling
        first_name = (data.get('first_name') or '').strip()
        last_name = (data.get('last_name') or '').strip()
        full_name_input = (data.get('full_name') or data.get('name') or '').strip()
        full_name = full_name_input or f"{first_name} {last_name}".strip()

        # Address and location (map legacy keys)
        primary_city = (data.get('primary_city') or data.get('city') or '').strip()
        primary_zone = (data.get('primary_zone') or data.get('zone') or data.get('governorate') or '').strip()
        primary_district = (data.get('primary_district') or data.get('district') or '').strip()
        primary_address = (data.get('primary_address') or data.get('address') or data.get('street') or '').strip()

        with get_db() as conn:
            # Check if a customer already exists by primary or secondary phone
            cursor = conn.execute(
                """
                SELECT customer_id, phone, full_name FROM customers 
                WHERE phone IN (?, ?) AND phone IS NOT NULL
                """,
                (phone, secondary_phone)
            )
            existing = cursor.fetchone()
            if existing:
                return create_api_response(
                    False,
                    error=f"Customer with phone {existing['phone']} already exists",
                    data={'existing_customer_id': existing['customer_id'], 'existing_customer_phone': existing['phone'], 'existing_customer_name': existing['full_name']}
                )

            # Insert new customer according to current schema
            cursor = conn.execute(
                """
                INSERT INTO customers (
                    phone, first_name, last_name, full_name,
                    primary_city, primary_zone, primary_district, primary_address,
                    total_orders, total_value, avg_order_value,
                    first_order_date, last_order_date, customer_segment,
                    return_rate, satisfaction_score,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0.0, 0.0, NULL, NULL, 'new', 0.0, 0.5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """,
                (
                    phone, first_name or None, last_name or None, (full_name or None),
                    primary_city or None, primary_zone or None, primary_district or None, primary_address or None,
                )
            )

            customer_id = cursor.lastrowid

            # Create a primary address entry if any location/address info present
            if any([primary_city, primary_zone, primary_district, primary_address]):
                conn.execute(
                    """
                    INSERT INTO customer_addresses (
                        customer_id, city, zone, district, address_line, is_primary
                    ) VALUES (?, ?, ?, ?, ?, 1)
                    """,
                    (customer_id, primary_city or None, primary_zone or None, primary_district or None, primary_address or None)
                )

            return create_api_response(
                True,
                data={
                    'customer_id': customer_id,
                    'phone': phone,
                    'full_name': full_name,
                    'first_name': first_name,
                    'last_name': last_name,
                    'primary_city': primary_city,
                    'primary_zone': primary_zone,
                    'primary_district': primary_district,
                    'primary_address': primary_address
                },
                message='Customer created successfully'
            )

    except Exception as e:
        logger.error(f"Error creating customer: {e}")
        return create_api_response(False, error=f"Failed to create customer: {str(e)}")

 