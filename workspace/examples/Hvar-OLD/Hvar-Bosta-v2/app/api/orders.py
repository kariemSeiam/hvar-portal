"""
Expert Orders API - Clean Data-Driven Implementation
Based on comprehensive analytics: 51,139 orders with optimized patterns
- 71.6% Delivered orders (main revenue: 68M EGP)
- 23.6% Returns (mixed impact: -1.3M to +101K EGP) 
- 3.7% Terminated (operational)
- 4 order types with distinct business patterns
"""

from flask import Blueprint, request, jsonify, g
from typing import Dict, Any, Optional, List
import logging
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum

from app.core.orders import OrderManager
from app.utils.api_response import create_api_response
from app.utils.db_utils import get_db

logger = logging.getLogger(__name__)
bp = Blueprint('orders', __name__, url_prefix='/api/orders')

# ================================================================================
# ENUMS AND DATA CLASSES - Based on Analytics
# ================================================================================

class OrderState(Enum):
    """Order states based on real analytics distribution"""
    DELIVERED = (45, "Delivered", 71.6)          # Main revenue generator
    RETURNED_BUSINESS = (46, "Returned to business", 17.1)  # Primary returns
    RETURNED_FULFILLED = (46, "Returned", 6.5)   # Secondary returns  
    TERMINATED = (48, "Terminated", 3.7)          # Failed deliveries
    PICKUP_REQUESTED = (10, "Pickup requested", 0.8)  # Pending
    AT_WAREHOUSE = (24, "Received at warehouse", 0.2)  # In transit
    LOST = (100, "Lost", 0.1)                    # High risk
    IN_TRANSIT = (30, "In transit between Hubs", 0.0)  # Processing
    EXCEPTION = (47, "Exception", 0.0)           # Issues
    DAMAGED = (101, "Damaged", 0.0)              # High risk

class OrderType(Enum):
    """Order types based on analytics patterns"""
    SEND = (10, "Send", 75.7, 1759)              # Primary revenue: avg 1759 EGP
    RETURN_TO_ORIGIN = (20, "Return to Origin", 14.5, 0)  # No revenue
    EXCHANGE = (30, "Exchange", 6.6, 30)         # Low revenue: avg 30 EGP  
    CUSTOMER_RETURN = (25, "Customer Return Pickup", 3.2, -810)  # Refunds: avg -810 EGP

class BusinessCategory(Enum):
    """Business categories based on revenue analysis"""
    PREMIUM_HIGH = "premium_high"        # >5000 EGP - Top tier
    HIGH_VALUE = "high_value"            # 1500-5000 EGP - Main revenue
    STANDARD_VALUE = "standard_value"    # 500-1500 EGP - Regular
    LOW_VALUE = "low_value"              # 1-500 EGP - Maintenance
    ZERO_COD = "zero_cod"                # 0 EGP - Service
    SMALL_REFUND = "small_refund"        # -500 to 0 EGP
    LARGE_REFUND = "large_refund"        # <-500 EGP
    MAX_VALUE = "max_value"              # 10,500 EGP - Highest tier

@dataclass
class OrderFilters:
    """Clean filter structure for order queries"""
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    state_codes: Optional[List[int]] = None
    order_types: Optional[List[int]] = None
    business_categories: Optional[List[str]] = None
    cod_min: Optional[float] = None
    cod_max: Optional[float] = None
    city: Optional[str] = None
    phone: Optional[str] = None
    risk_levels: Optional[List[str]] = None
    limit: int = 50
    offset: int = 0
    sort_by: str = 'created_at'
    sort_dir: str = 'DESC'

# ================================================================================
# CORE API ENDPOINTS - Clean & Optimized
# ================================================================================

@bp.route('/', methods=['GET'])
@bp.route('', methods=['GET'])
def get_orders():
    """
    🎯 Get orders with intelligent filtering based on analytics patterns
    
    Optimized for the most common use cases:
    - Revenue analysis (delivered orders: 71.6%)
    - Return management (returns: 23.6%) 
    - Operational tracking (terminated: 3.7%)
    
    Query Parameters:
        date_from/date_to: Date range filtering
        states: Comma-separated state codes (45,46,48)
        types: Comma-separated order types (10,20,25,30)
        categories: Business categories (premium_high,high_value,etc)
        cod_range: min,max COD values
        city: Delivery city filter
        phone: Customer phone filter
        risk: Risk levels (low,medium,high,critical)
        limit: Results per page (default: 50, max: 1000)
        offset: Pagination offset
        sort_by: Sort field (created_at, cod, state_code, etc.)
        sort_dir: Sort direction (ASC, DESC)
        include: Additional data (timeline,service_actions,hierarchy)
    """
    try:
        # Parse and validate filters
        filters = _parse_order_filters(request.args)
        include_flags = _parse_include_flags(request.args.get('include', ''))
        
        # Add sorting parameters to filters
        sort_by = request.args.get('sort_by', 'created_at')
        sort_dir = request.args.get('sort_dir', 'DESC').upper()
        
        # Validate sort parameters
        valid_sort_fields = ['created_at', 'cod', 'state_code', 'tracking_number', 'receiver_name', 'dropoff_city_name']
        if sort_by not in valid_sort_fields:
            sort_by = 'created_at'
        
        if sort_dir not in ['ASC', 'DESC']:
            sort_dir = 'DESC'
        
        # Add sorting to filters
        filters.sort_by = sort_by
        filters.sort_dir = sort_dir
        
        # Get orders with business intelligence
        order_manager = OrderManager()
        result = order_manager.get_orders_with_analytics(filters, include_flags)
        
        if not result['success']:
            return create_api_response(False, error=result['error'])
        
        # Add analytics context
        analytics_context = _build_analytics_context(result['data']['orders'])
        
        return create_api_response(True, data={
            'orders': result['data']['orders'],
            'pagination': result['data']['pagination'],
            'analytics': analytics_context,
            'filters_applied': filters.__dict__
        })
        
    except Exception as e:
        logger.error(f"Error in get_orders: {e}")
        return create_api_response(False, error=str(e))

@bp.route('/analytics', methods=['GET'])
def get_comprehensive_analytics():
    """
    📊 Comprehensive analytics based on the 51,139 orders dataset
    
    Returns business intelligence across:
    - State distribution (delivered 71.6%, returns 23.6%, terminated 3.7%)
    - Order type performance (send 75.7%, returns 14.5%, exchange 6.6%)
    - Revenue analysis (68M EGP revenue, 3.4M EGP fees)
    - Business category breakdown
    - Risk assessment patterns
    """
    try:
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        granularity = request.args.get('granularity', 'daily')  # daily, weekly, monthly
        
        order_manager = OrderManager()
        analytics = order_manager.get_comprehensive_analytics(
            date_from=date_from,
            date_to=date_to,
            granularity=granularity
        )
        
        return create_api_response(True, data=analytics)
        
    except Exception as e:
        logger.error(f"Error in analytics: {e}")
        return create_api_response(False, error=str(e))

@bp.route('/states/distribution', methods=['GET'])
def get_state_distribution():
    """
    🔄 Order states distribution with business impact analysis
    
    Based on analytics patterns:
    - Delivered (45): 71.6% - Main revenue generator
    - Returned (46): 23.6% - Mixed business impact  
    - Terminated (48): 3.7% - Operational cost
    """
    try:
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        
        order_manager = OrderManager()
        distribution = order_manager.get_state_distribution_analytics(date_from, date_to)
        
        return create_api_response(True, data=distribution)
        
    except Exception as e:
        logger.error(f"Error in state distribution: {e}")
        return create_api_response(False, error=str(e))

@bp.route('/business/counts', methods=['GET'])
def get_business_counts():
    """
    📊 Business-focused order counts for quick filters
    
    Returns counts for:
    - Total orders (all states)
    - Sales orders (delivered with COD > 500)
    - Maintenance orders (delivered with COD 1-500)
    - Free service orders (delivered with COD = 0)
    - Returns (state 46)
    - Processing orders (states 10,24,30)
    - Problem orders (states 47,48,100,101)
    """
    try:
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        
        order_manager = OrderManager()
        
        # Get counts for different business categories
        counts = {}
        
        # Total orders (all states)
        total_filters = OrderFilters(
            date_from=date_from,
            date_to=date_to
        )
        total_result = order_manager.get_orders_with_analytics(total_filters, {})
        counts['total'] = total_result['data']['pagination']['total'] if total_result['success'] else 0
        
        # Sales orders (delivered with COD > 500)
        sales_filters = OrderFilters(
            state_codes=[45],
            cod_min=500.01,
            date_from=date_from,
            date_to=date_to
        )
        sales_result = order_manager.get_orders_with_analytics(sales_filters, {})
        counts['sales'] = sales_result['data']['pagination']['total'] if sales_result['success'] else 0
        
        # Service orders (delivered with COD <= 500, including negative values for refunds)
        # This includes maintenance orders (1-500), free service (0), and refunds (negative COD)
        service_filters = OrderFilters(
            state_codes=[45],
            cod_max=500,
            date_from=date_from,
            date_to=date_to
        )
        service_result = order_manager.get_orders_with_analytics(service_filters, {})
        counts['service'] = service_result['data']['pagination']['total'] if service_result['success'] else 0
        
        # Also include refunds from other states (like state 46 - returns)
        refund_filters = OrderFilters(
            cod_max=-0.01,  # Negative COD values
            date_from=date_from,
            date_to=date_to
        )
        refund_result = order_manager.get_orders_with_analytics(refund_filters, {})
        refund_count = refund_result['data']['pagination']['total'] if refund_result['success'] else 0
        
        # Add refunds to service count
        counts['service'] += refund_count
        
        # Returns (state 46)
        returns_filters = OrderFilters(
            state_codes=[46],
            date_from=date_from,
            date_to=date_to
        )
        returns_result = order_manager.get_orders_with_analytics(returns_filters, {})
        counts['returns'] = returns_result['data']['pagination']['total'] if returns_result['success'] else 0
        
        # Processing orders (states 10,24,30)
        processing_filters = OrderFilters(
            state_codes=[10, 24, 30],
            date_from=date_from,
            date_to=date_to
        )
        processing_result = order_manager.get_orders_with_analytics(processing_filters, {})
        counts['processing'] = processing_result['data']['pagination']['total'] if processing_result['success'] else 0
        
        # Problem orders (states 47,48,100,101)
        problem_filters = OrderFilters(
            state_codes=[47, 48, 100, 101],
            date_from=date_from,
            date_to=date_to
        )
        problem_result = order_manager.get_orders_with_analytics(problem_filters, {})
        counts['problems'] = problem_result['data']['pagination']['total'] if problem_result['success'] else 0
        
        return create_api_response(True, data=counts)
        
    except Exception as e:
        logger.error(f"Error in business counts: {e}")
        return create_api_response(False, error=str(e))

@bp.route('/revenue/analysis', methods=['GET'])
def get_revenue_analysis():
    """
    💰 Revenue analysis based on COD patterns
    
    Analytics insights:
    - Total Revenue: 68,099,885 EGP (delivered orders)
    - Average COD: 1,859 EGP (delivered), 1,307 EGP (overall)
    - COD Range: -2,000 to 10,500 EGP
    - Return Impact: -1,337,038 EGP
    """
    try:
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        breakdown_by = request.args.get('breakdown_by', 'category')  # category, state, type
        
        order_manager = OrderManager()
        revenue_analysis = order_manager.get_revenue_analysis(
            date_from=date_from,
            date_to=date_to,
            breakdown_by=breakdown_by
        )
        
        return create_api_response(True, data=revenue_analysis)
        
    except Exception as e:
        logger.error(f"Error in revenue analysis: {e}")
        return create_api_response(False, error=str(e))

@bp.route('/<tracking_number>', methods=['GET'])
def get_order_details(tracking_number: str):
    """
    🔍 Get comprehensive order details with business context
    
    Includes:
    - Order information with classification
    - Timeline events with business impact
    - Service actions and hierarchy
    - Risk assessment and recommendations
    """
    try:
        include_flags = _parse_include_flags(request.args.get('include', 'all'))
        
        order_manager = OrderManager()
        result = order_manager.get_order_with_context(tracking_number, include_flags)
        
        if not result['success']:
            return create_api_response(False, error=result['error'])
        
        return create_api_response(True, data=result['data'])
        
    except Exception as e:
        logger.error(f"Error getting order {tracking_number}: {e}")
        return create_api_response(False, error=str(e))

# ================================================================================
# ORDER MANAGEMENT ENDPOINTS
# ================================================================================

@bp.route('/sync', methods=['POST'])
def sync_orders():
    """🔄 Intelligent order synchronization with analytics-driven optimization"""
    try:
        data = request.get_json() or {}
        sync_type = data.get('type', 'incremental')  # incremental, full, targeted
        order_types = data.get('order_types', ['all'])
        priority_states = data.get('priority_states', [45, 46, 48])  # Focus on main states
        
        order_manager = OrderManager()
        result = order_manager.sync_orders_intelligent(
            sync_type=sync_type,
            order_types=order_types,
            priority_states=priority_states
        )
        
        return create_api_response(True, data=result)
        
    except Exception as e:
        logger.error(f"Error in sync_orders: {e}")
        return create_api_response(False, error=str(e))

@bp.route('/process/batch', methods=['POST'])
def process_orders_batch():
    """⚡ Batch process orders with intelligent classification"""
    try:
        data = request.get_json()
        if not data or 'orders' not in data:
            return create_api_response(False, error='Orders data required')
        
        orders = data['orders']
        processing_mode = data.get('mode', 'standard')  # standard, priority, background
        
        order_manager = OrderManager()
        result = order_manager.process_orders_batch(orders, processing_mode)
        
        return create_api_response(True, data=result)
        
    except Exception as e:
        logger.error(f"Error in batch processing: {e}")
        return create_api_response(False, error=str(e))

# ================================================================================
# BUSINESS INTELLIGENCE ENDPOINTS
# ================================================================================

@bp.route('/business/categories', methods=['GET'])
def get_business_categories():
    """
    🏢 Business category analysis based on revenue patterns
    
    Categories derived from analytics:
    - Premium High (>5000): Top revenue tier
    - High Value (1500-5000): Main revenue stream  
    - Standard (500-1500): Regular business
    - Low Value (1-500): Maintenance orders
    - Refunds (<0): Customer returns
    """
    try:
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        
        order_manager = OrderManager()
        categories = order_manager.get_business_category_analysis(date_from, date_to)
        
        return create_api_response(True, data=categories)
        
    except Exception as e:
        logger.error(f"Error in business categories: {e}")
        return create_api_response(False, error=str(e))

@bp.route('/performance/metrics', methods=['GET'])
def get_performance_metrics():
    """
    ⚡ Performance metrics based on analytics patterns
    
    Key metrics:
    - Delivery Success Rate: 71.6%
    - Return Rate: 23.6%
    - Termination Rate: 3.7%
    - Average Processing Time
    - Revenue per Order: 1,307 EGP
    """
    try:
        period = request.args.get('period', 'last_30_days')
        compare_to = request.args.get('compare_to', 'previous_period')
        
        order_manager = OrderManager()
        metrics = order_manager.get_performance_metrics(period, compare_to)
        
        return create_api_response(True, data=metrics)
        
    except Exception as e:
        logger.error(f"Error in performance metrics: {e}")
        return create_api_response(False, error=str(e))

# ================================================================================
# HELPER FUNCTIONS - Clean Implementation
# ================================================================================

def _parse_order_filters(args) -> OrderFilters:
    """Parse and validate order filters from request arguments"""
    filters = OrderFilters()
    
    # Date filters
    filters.date_from = args.get('date_from')
    filters.date_to = args.get('date_to')
    
    # State filters - support multiple states
    if states := args.get('states') or args.get('state_codes'):
        try:
            if isinstance(states, str):
                filters.state_codes = [int(s.strip()) for s in states.split(',') if s.strip()]
            else:
                filters.state_codes = [int(s) for s in states if s is not None]
        except ValueError:
            pass
    
    # Order type filters
    if types := args.get('types') or args.get('order_types'):
        try:
            if isinstance(types, str):
                filters.order_types = [int(t.strip()) for t in types.split(',') if t.strip()]
            else:
                filters.order_types = [int(t) for t in types if t is not None]
        except ValueError:
            pass
    
    # Business category filters
    if categories := args.get('categories') or args.get('business_categories'):
        if isinstance(categories, str):
            filters.business_categories = [c.strip() for c in categories.split(',') if c.strip()]
        else:
            filters.business_categories = [c for c in categories if c]
    
    # COD range filters
    if cod_range := args.get('cod_range'):
        try:
            cod_min, cod_max = cod_range.split(',')
            filters.cod_min = float(cod_min.strip()) if cod_min.strip() else None
            filters.cod_max = float(cod_max.strip()) if cod_max.strip() else None
        except ValueError:
            pass
    
    # Individual COD filters
    if cod_min := args.get('cod_min'):
        try:
            filters.cod_min = float(cod_min)
        except ValueError:
            pass
    
    if cod_max := args.get('cod_max'):
        try:
            filters.cod_max = float(cod_max)
        except ValueError:
            pass
    
    # Location and contact filters
    filters.city = args.get('city')
    filters.phone = args.get('phone')
    
    # Risk level filters
    if risk := args.get('risk') or args.get('risk_levels'):
        if isinstance(risk, str):
            filters.risk_levels = [r.strip() for r in risk.split(',') if r.strip()]
        else:
            filters.risk_levels = [r for r in risk if r]
    
    # Pagination
    try:
        filters.limit = min(int(args.get('limit', 50)), 1000)  # Max 1000 for performance
        filters.offset = max(int(args.get('offset', 0)), 0)
    except ValueError:
        pass
    
    return filters

def _parse_include_flags(include_str: str) -> Dict[str, bool]:
    """Parse include flags for additional data"""
    if include_str == 'all':
        return {
            'service_actions': True,
            'hierarchy': True,
            'analytics': True
        }
    
    includes = [i.strip() for i in include_str.split(',') if i.strip()]
    return {
        'service_actions': 'service_actions' in includes,
        'hierarchy': 'hierarchy' in includes,
        'analytics': 'analytics' in includes
    }

def _build_analytics_context(orders: List[Dict]) -> Dict[str, Any]:
    """Build analytics context for the current result set"""
    if not orders:
        return {}
    
    total_orders = len(orders)
    
    # Safe COD calculation with error handling
    total_cod = 0
    for order in orders:
        try:
            cod_value = order.get('cod', 0)
            if cod_value is not None:
                total_cod += float(cod_value)
        except (ValueError, TypeError):
            # Skip invalid COD values
            pass
    
    avg_cod = total_cod / total_orders if total_orders > 0 else 0
    
    # State distribution
    state_counts = {}
    for order in orders:
        state = order.get('state_code')
        state_counts[state] = state_counts.get(state, 0) + 1
    
    # Business category distribution
    category_counts = {}
    for order in orders:
        category = order.get('business_category', 'unknown')
        category_counts[category] = category_counts.get(category, 0) + 1
    
    return {
        'total_orders': total_orders,
        'total_cod': round(total_cod, 2),
        'avg_cod': round(avg_cod, 2),
        'state_distribution': state_counts,
        'category_distribution': category_counts
    } 