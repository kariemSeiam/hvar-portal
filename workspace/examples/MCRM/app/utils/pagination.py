# app/utils/pagination.py
"""Pagination and filtering utilities."""

from flask import request
from typing import Dict, List, Any, Tuple, Optional
from datetime import datetime, date


def parse_pagination_params(request) -> Tuple[int, int]:
    """Parse pagination parameters from request."""
    limit = request.args.get('limit', 20, type=int)
    offset = request.args.get('offset', 0, type=int)
    
    # Validate limits
    if limit < 1:
        limit = 20
    if limit > 100:  # Maximum limit
        limit = 100
    if offset < 0:
        offset = 0
    
    return limit, offset


def paginate(query_results: List[Dict], limit: int, offset: int, total: int = None) -> Dict[str, Any]:
    """Create a paginated response dictionary."""
    if total is None:
        total = len(query_results)
    
    # Apply pagination to results
    paginated_data = query_results[offset:offset + limit]
    
    return {
        "data": paginated_data,
        "pagination": {
            "total": total,
            "limit": limit,
            "offset": offset,
            "has_more": offset + limit < total
        }
    }


def parse_date_filter(request, field_name: str) -> Optional[Tuple[date, date]]:
    """Parse date range filter from request."""
    start_date_str = request.args.get(f'{field_name}_start')
    end_date_str = request.args.get(f'{field_name}_end')
    
    start_date = None
    end_date = None
    
    if start_date_str:
        try:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        except ValueError:
            pass
    
    if end_date_str:
        try:
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
        except ValueError:
            pass
    
    if start_date or end_date:
        return start_date, end_date
    
    return None


def parse_status_filter(request, field_name: str = 'status') -> Optional[List[str]]:
    """Parse status filter from request."""
    status_str = request.args.get(field_name)
    if status_str:
        return [s.strip() for s in status_str.split(',') if s.strip()]
    return None


def parse_type_filter(request, field_name: str = 'type') -> Optional[List[str]]:
    """Parse type filter from request."""
    type_str = request.args.get(field_name)
    if type_str:
        return [t.strip() for t in type_str.split(',') if t.strip()]
    return None


def parse_search_filter(request, field_name: str = 'search') -> Optional[str]:
    """Parse search filter from request."""
    search = request.args.get(field_name)
    if search and search.strip():
        return search.strip()
    return None


def build_where_clause(filters: Dict[str, Any]) -> Tuple[str, List[Any]]:
    """Build WHERE clause and parameters from filters."""
    conditions = []
    params = []
    
    for field, value in filters.items():
        if value is None:
            continue
            
        if field.endswith('_start'):
            field_name = field[:-6]  # Remove '_start' suffix
            conditions.append(f"{field_name} >= %s")
            params.append(value)
        elif field.endswith('_end'):
            field_name = field[:-4]  # Remove '_end' suffix
            conditions.append(f"{field_name} <= %s")
            params.append(value)
        elif field.endswith('_status'):
            field_name = field[:-7]  # Remove '_status' suffix
            if isinstance(value, list):
                placeholders = ','.join(['%s'] * len(value))
                conditions.append(f"{field_name} IN ({placeholders})")
                params.extend(value)
            else:
                conditions.append(f"{field_name} = %s")
                params.append(value)
        elif field.endswith('_type'):
            field_name = field[:-5]  # Remove '_type' suffix
            if isinstance(value, list):
                placeholders = ','.join(['%s'] * len(value))
                conditions.append(f"{field_name} IN ({placeholders})")
                params.extend(value)
            else:
                conditions.append(f"{field_name} = %s")
                params.append(value)
        elif field.endswith('_search'):
            field_name = field[:-7]  # Remove '_search' suffix
            conditions.append(f"{field_name} LIKE %s")
            params.append(f"%{value}%")
        else:
            # Direct field filter
            if isinstance(value, list):
                placeholders = ','.join(['%s'] * len(value))
                conditions.append(f"{field} IN ({placeholders})")
                params.extend(value)
            else:
                conditions.append(f"{field} = %s")
                params.append(value)
    
    where_clause = ""
    if conditions:
        where_clause = "WHERE " + " AND ".join(conditions)
    
    return where_clause, params


def get_total_count(table_name: str, where_clause: str = "", params: List[Any] = None) -> int:
    """Get total count for pagination."""
    from app.utils.db import execute_query
    
    query = f"SELECT COUNT(*) as count FROM {table_name} {where_clause}"
    result = execute_query(query, params or [])
    return result[0]['count'] if result else 0


def paginate_query(table_name: str, filters: Dict[str, Any] = None, 
                  order_by: str = "id", order_direction: str = "ASC",
                  limit: int = 20, offset: int = 0) -> Dict[str, Any]:
    """Execute a paginated query with filters."""
    from app.utils.db import execute_query
    
    # Build WHERE clause
    where_clause, params = build_where_clause(filters or {})
    
    # Get total count
    total = get_total_count(table_name, where_clause, params)
    
    # Build main query
    query = f"""
        SELECT * FROM {table_name} 
        {where_clause}
        ORDER BY {order_by} {order_direction}
        LIMIT %s OFFSET %s
    """
    params.extend([limit, offset])
    
    # Execute query
    results = execute_query(query, params)
    
    return paginate(results, limit, offset, total)


def parse_customer_filters(request) -> Dict[str, Any]:
    """Parse customer-specific filters."""
    filters = {}
    
    # Search filter
    search = parse_search_filter(request, 'search')
    if search:
        filters['name_search'] = search
        filters['phone_search'] = search
    
    # Date filters
    date_range = parse_date_filter(request, 'created')
    if date_range:
        start_date, end_date = date_range
        if start_date:
            filters['created_start'] = start_date
        if end_date:
            filters['created_end'] = end_date
    
    return filters


def parse_ticket_filters(request) -> Dict[str, Any]:
    """Parse ticket-specific filters."""
    filters = {}
    
    # Status filter
    status = parse_status_filter(request, 'status')
    if status:
        filters['status'] = status
    
    # Type filter
    service_type = parse_type_filter(request, 'type')
    if service_type:
        filters['service_type'] = service_type
    
    # Customer filter
    customer_id = request.args.get('customer_id', type=int)
    if customer_id:
        filters['customer_id'] = customer_id
    
    # Date filters
    date_range = parse_date_filter(request, 'created')
    if date_range:
        start_date, end_date = date_range
        if start_date:
            filters['created_start'] = start_date
        if end_date:
            filters['created_end'] = end_date
    
    return filters


def parse_stock_filters(request) -> Dict[str, Any]:
    """Parse stock-specific filters."""
    filters = {}
    
    # Type filter
    item_type = parse_type_filter(request, 'type')
    if item_type:
        filters['type'] = item_type
    
    # Search filter
    search = parse_search_filter(request, 'search')
    if search:
        filters['name_search'] = search
        filters['sku_search'] = search
    
    # Quantity filters
    min_quantity = request.args.get('min_quantity', type=int)
    if min_quantity is not None:
        filters['quantity_on_hand_start'] = min_quantity
    
    max_quantity = request.args.get('max_quantity', type=int)
    if max_quantity is not None:
        filters['quantity_on_hand_end'] = max_quantity
    
    return filters


def parse_queue_filters(request) -> Dict[str, Any]:
    """Parse queue-specific filters."""
    filters = {}
    
    # Status filter
    status = parse_status_filter(request, 'status')
    if status:
        filters['status'] = status
    
    # Priority filter
    priority = request.args.get('priority')
    if priority:
        filters['priority'] = priority
    
    # Date filters
    date_range = parse_date_filter(request, 'created')
    if date_range:
        start_date, end_date = date_range
        if start_date:
            filters['created_start'] = start_date
        if end_date:
            filters['created_end'] = end_date
    
    return filters
