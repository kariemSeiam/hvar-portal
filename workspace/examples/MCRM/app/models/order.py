# app/models/order.py
"""Call-center order model. Working record for ERP and direct orders."""
import json
from datetime import datetime, date as date_type
from app.utils.db import execute_insert, execute_query, execute_update
from app.utils.phone_normalizer import normalize_phone_safe

OPEN_STATUSES = ('new', 'scheduled', 'confirmed')


def roll_forward_backlog_to_today(today_date=None, limit=500):
    """
    Move old open orders into today: set next_action_at to start of today
    for any open order created before today or with next_action_at in the past/null.
    No cron: call from list_orders when viewing today. Batch-limited for safety.
    Returns number of rows updated.
    """
    if today_date is None:
        today_date = date_type.today()
    if isinstance(today_date, str):
        today_date = datetime.strptime(today_date[:10], '%Y-%m-%d').date()
    today_start = datetime.combine(today_date, datetime.min.time())
    placeholders = ','.join(['%s'] * len(OPEN_STATUSES))
    sql = """
        UPDATE orders
        SET next_action_at = %s
        WHERE status IN ({})
          AND (next_action_at IS NULL OR next_action_at < %s)
          AND created_at < %s
        LIMIT %s
    """.format(placeholders)
    params = [today_start] + list(OPEN_STATUSES) + [today_start, today_start, limit]
    return execute_update(sql, params)


def mark_erp_orders_not_in_sync():
    """Set in_erp=0 for all source='erp' orders. Call at sync start; sync then sets in_erp=1 for seen orders."""
    sql = "UPDATE orders SET in_erp = 0 WHERE source = 'erp'"
    return execute_update(sql, ())


def _build_date_where(date_from, date_to, today_str=None, table_alias='o'):
    """
    Build date condition for day-chip queue.
    When today_str given and date <= today: backlog (past open) + created today.
    When date > today: scheduled_callback_at in that day.
    When today_str absent: legacy created_at between date_from and date_to.
    Returns (conditions_list, params_list).
    table_alias: 'o' for list_orders (FROM orders o), '' for count/counts (FROM orders).
    """
    if not date_from or not date_to:
        return [], []
    pre = f"{table_alias}." if table_alias else ""
    date_str = date_from[:10] if len(date_from) >= 10 else date_from
    conds, parms = [], []
    if today_str is None:
        conds.append(f"{pre}created_at >= %s")
        conds.append(f"{pre}created_at <= %s")
        parms.extend([date_from, date_to])
    elif date_str <= today_str:
        # Backlog mode: (past open) OR (created today)
        conds.append(f"""(
            ({pre}created_at < %s AND {pre}status IN ('new','scheduled','confirmed'))
            OR ({pre}created_at >= %s AND {pre}created_at <= %s)
        )""")
        parms.extend([date_from, date_from, date_to])
    else:
        # Future: scheduled_callback_at in range
        conds.append(f"{pre}scheduled_callback_at >= %s")
        conds.append(f"{pre}scheduled_callback_at <= %s")
        parms.extend([date_from, date_to])
    return conds, parms


def create_order(data):
    """Create a new order. customer_phone normalized to 01XXXXXXXXX."""
    clean = dict(data)
    if clean.get('customer_phone'):
        clean['customer_phone'] = normalize_phone_safe(clean['customer_phone']) or clean['customer_phone']
    cols = [
        'source', 'service_type', 'status', 'attempt_count',
        'next_action_at', 'scheduled_callback_at', 'last_attempt_at', 'cancellation_reason',
        'erp_order_id', 'bosta_tracking', 'bosta_order_id',
        'customer_id', 'customer_phone', 'customer_name', 'delivery_address',
        'order_description', 'governorate', 'city', 'cod_amount', 'converted_to_ticket_id',
        'in_erp'
    ]
    filtered = {k: clean[k] for k in cols if k in clean and clean[k] is not None}
    filtered.setdefault('source', 'direct')
    filtered.setdefault('status', 'new')
    filtered.setdefault('attempt_count', 0)
    if 'customer_phone' not in filtered:
        raise ValueError("customer_phone is required")
    columns = ', '.join(f"`{k}`" for k in filtered.keys())
    placeholders = ', '.join(f"%({k})s" for k in filtered.keys())
    sql = f"INSERT INTO orders ({columns}) VALUES ({placeholders})"
    return execute_insert(sql, filtered)


def get_order_by_id(order_id):
    """Get order by ID."""
    sql = "SELECT * FROM orders WHERE id = %s"
    result = execute_query(sql, (order_id,))
    return result[0] if result else None


def get_order_by_erp_order_id(erp_order_id):
    """Get order by ERP invoice_no. For dedup/sync."""
    if not erp_order_id:
        return None
    sql = "SELECT * FROM orders WHERE erp_order_id = %s"
    result = execute_query(sql, (erp_order_id,))
    return result[0] if result else None


def get_order_by_bosta_tracking(bosta_tracking):
    """Get order by Bosta tracking. For dedup."""
    if not bosta_tracking:
        return None
    sql = "SELECT * FROM orders WHERE bosta_tracking = %s"
    result = execute_query(sql, (bosta_tracking,))
    return result[0] if result else None


def list_orders(limit=25, offset=0, status=None, status_list=None, source=None, service_type=None,
                search=None, date_from=None, date_to=None, today=None, governorate=None,
                min_attempts=None, attempt_list=None):
    """
    List orders with filters and pagination. Tab-based: no date filter (all-time).
    search = phone (normalized) or name LIKE.
    For "all" tab (status=None): orders with at least one call are sorted to the bottom.
    For "new" status with source='erp': only show orders with in_erp=1 (still in ERP).
    NEW: Supports status_list (multi-status), min_attempts, attempt_list for SearchBar filters.
    """
    conditions = []
    params = []

    # Status filter (single or multiple)
    if status_list:
        placeholders = ','.join(['%s'] * len(status_list))
        conditions.append(f"o.status IN ({placeholders})")
        params.extend(status_list)
    elif status:
        conditions.append("o.status = %s")
        params.append(status)

    if source:
        conditions.append("o.source = %s")
        params.append(source)
    # Filter: "new" ERP orders must have in_erp=1 (still exist in ERP)
    if (status == 'new' or (status_list and 'new' in status_list)) and source == 'erp':
        conditions.append("o.in_erp = 1")
    if service_type:
        conditions.append("o.service_type = %s")
        params.append(service_type)

    # NEW: Min attempts filter (for "لم يرد" = status new + attempt_count >= 1)
    if min_attempts is not None:
        conditions.append("o.attempt_count >= %s")
        params.append(min_attempts)

    # NEW: Specific attempt counts filter (multi-select: 0, 1, 2, 3+)
    if attempt_list:
        exact_attempts = [a for a in attempt_list if a < 3]
        has_3_plus = 3 in attempt_list

        attempt_conditions = []
        if exact_attempts:
            placeholders = ','.join(['%s'] * len(exact_attempts))
            attempt_conditions.append(f"o.attempt_count IN ({placeholders})")
            params.extend(exact_attempts)
        if has_3_plus:
            attempt_conditions.append("o.attempt_count >= 3")

        if attempt_conditions:
            conditions.append(f"({' OR '.join(attempt_conditions)})")

    if search:
        norm = normalize_phone_safe(search)
        if norm:
            conditions.append("(o.customer_phone = %s OR o.customer_phone LIKE %s)")
            params.extend([norm, f"%{norm}%"])
        else:
            conditions.append("(o.customer_name LIKE %s OR o.customer_phone LIKE %s)")
            params.extend([f"%{search}%", f"%{search}%"])
    # Date filter: when date <= today show backlog (past open) + created that day; when date > today show scheduled that day
    if date_from and date_to:
        today_str = (today[:10] if today and len(today) >= 10 else None) if today else None
        date_conds, date_parms = _build_date_where(date_from, date_to, today_str, table_alias='o')
        if date_conds:
            conditions.extend(date_conds)
            params.extend(date_parms)
    if governorate:
        conditions.append("o.governorate = %s")
        params.append(governorate)
    where = " AND ".join(conditions) if conditions else "1=1"
    # الكل (no status): orders that have been called go to the bottom (no-call first, then next_action_at, created_at)
    order_clause = (
        "(SELECT 1 FROM calls c WHERE c.linked_to_order_id = o.id LIMIT 1) IS NULL DESC, "
        "o.next_action_at IS NULL, o.next_action_at ASC, o.created_at DESC"
        if status is None and not status_list
        else "o.next_action_at IS NULL, o.next_action_at ASC, o.created_at DESC"
    )
    params.extend([limit, offset])
    sql = f"""
        SELECT * FROM orders o
        WHERE {where}
        ORDER BY {order_clause}
        LIMIT %s OFFSET %s
    """
    return execute_query(sql, tuple(params))


def get_orders_count(status=None, status_list=None, source=None, service_type=None, search=None,
                     date_from=None, date_to=None, today=None, governorate=None,
                     min_attempts=None, attempt_list=None):
    """Count orders with same filters as list_orders. Tab-based: no date filter (all-time)."""
    conditions = []
    params = []

    # Status filter (single or multiple)
    if status_list:
        placeholders = ','.join(['%s'] * len(status_list))
        conditions.append(f"status IN ({placeholders})")
        params.extend(status_list)
    elif status:
        conditions.append("status = %s")
        params.append(status)

    if source:
        conditions.append("source = %s")
        params.append(source)
    # Filter: "new" ERP orders must have in_erp=1 (still exist in ERP)
    if (status == 'new' or (status_list and 'new' in status_list)) and source == 'erp':
        conditions.append("in_erp = 1")
    if service_type:
        conditions.append("service_type = %s")
        params.append(service_type)

    # NEW: Min attempts filter
    if min_attempts is not None:
        conditions.append("attempt_count >= %s")
        params.append(min_attempts)

    # NEW: Specific attempt counts filter
    if attempt_list:
        exact_attempts = [a for a in attempt_list if a < 3]
        has_3_plus = 3 in attempt_list

        attempt_conditions = []
        if exact_attempts:
            placeholders = ','.join(['%s'] * len(exact_attempts))
            attempt_conditions.append(f"attempt_count IN ({placeholders})")
            params.extend(exact_attempts)
        if has_3_plus:
            attempt_conditions.append("attempt_count >= 3")

        if attempt_conditions:
            conditions.append(f"({' OR '.join(attempt_conditions)})")

    if search:
        norm = normalize_phone_safe(search)
        if norm:
            conditions.append("(customer_phone = %s OR customer_phone LIKE %s)")
            params.extend([norm, f"%{norm}%"])
        else:
            conditions.append("(customer_name LIKE %s OR customer_phone LIKE %s)")
            params.extend([f"%{search}%", f"%{search}%"])
    # Date filter: same backlog logic as list_orders so pagination total matches
    if date_from and date_to:
        today_str = (today[:10] if today and len(today) >= 10 else None) if today else None
        date_conds, date_parms = _build_date_where(date_from, date_to, today_str, table_alias='')
        if date_conds:
            conditions.extend(date_conds)
            params.extend(date_parms)
    if governorate:
        conditions.append("governorate = %s")
        params.append(governorate)
    where = " AND ".join(conditions) if conditions else "1=1"
    sql = f"SELECT COUNT(*) as count FROM orders WHERE {where}"
    result = execute_query(sql, tuple(params))
    return result[0]['count'] if result else 0


def get_dates_with_orders():
    """Return sorted list of date strings (YYYY-MM-DD) that have at least one order (past, today, future)."""
    sql = """
        SELECT d FROM (
            SELECT DATE(created_at) AS d FROM orders WHERE created_at IS NOT NULL
            UNION
            SELECT DATE(scheduled_callback_at) AS d FROM orders WHERE scheduled_callback_at IS NOT NULL
        ) u
        WHERE d IS NOT NULL
        ORDER BY d
    """
    rows = execute_query(sql, ())
    return [r['d'].strftime('%Y-%m-%d') if hasattr(r['d'], 'strftime') else str(r['d'])[:10] for r in rows]


def get_orders_counts_by_status(date_from=None, date_to=None, today=None):
    """Counts per status. If date_from/date_to given, filter by that calendar day (DATE so timezone-safe)."""
    where_parts = []
    params = []
    if date_from and date_to:
        today_str = (today[:10] if today and len(today) >= 10 else None) if today else None
        date_str = date_from[:10] if len(date_from) >= 10 else date_from
        if today_str and date_str > today_str:
            where_parts.append("DATE(scheduled_callback_at) = %s")
            params.append(date_str)
        else:
            where_parts.append("DATE(created_at) = %s")
            params.append(date_str)
    where_clause = ("WHERE " + " AND ".join(where_parts)) if where_parts else ""
    sql = f"""
        SELECT status, COUNT(*) as count FROM orders
        {where_clause}
        GROUP BY status
    """
    rows = execute_query(sql, tuple(params))
    counts = {r['status']: r['count'] for r in rows}
    return counts


def list_pending_orders(limit=25, offset=0, source=None, service_type=None):
    """List orders awaiting leader approval: status=confirmed, converted_to_ticket_id IS NULL."""
    conditions = [
        "status = %s",
        "converted_to_ticket_id IS NULL"
    ]
    params = ['confirmed']
    if source:
        conditions.append("source = %s")
        params.append(source)
    if service_type:
        conditions.append("service_type = %s")
        params.append(service_type)
    where = " AND ".join(conditions)
    params.extend([limit, offset])
    sql = f"""
        SELECT * FROM orders
        WHERE {where}
        ORDER BY created_at DESC
        LIMIT %s OFFSET %s
    """
    return execute_query(sql, tuple(params))


def get_pending_orders_count(source=None, service_type=None):
    """Count orders awaiting leader approval."""
    conditions = [
        "status = %s",
        "converted_to_ticket_id IS NULL"
    ]
    params = ['confirmed']
    if source:
        conditions.append("source = %s")
        params.append(source)
    if service_type:
        conditions.append("service_type = %s")
        params.append(service_type)
    where = " AND ".join(conditions)
    sql = f"SELECT COUNT(*) as count FROM orders WHERE {where}"
    result = execute_query(sql, tuple(params))
    return result[0]['count'] if result else 0


def delete_orders_not_in_erp():
    """
    Delete orders with status='new', source='erp', in_erp=0 (not in ERP anymore).
    Also sets linked calls' linked_to_order_id to NULL to avoid orphaned foreign keys.
    Returns number of orders deleted.
    """
    # First, find orders to delete
    sql_find = """
        SELECT id FROM orders
        WHERE status = 'new' AND source = 'erp' AND in_erp = 0
    """
    orders_to_delete = execute_query(sql_find, ())
    if not orders_to_delete:
        return 0

    order_ids = [o['id'] for o in orders_to_delete]

    # Set calls.linked_to_order_id to NULL for these orders
    if order_ids:
        placeholders = ','.join(['%s'] * len(order_ids))
        sql_update_calls = f"""
            UPDATE calls
            SET linked_to_order_id = NULL
            WHERE linked_to_order_id IN ({placeholders})
        """
        execute_update(sql_update_calls, tuple(order_ids))

    # Delete orders
    sql_delete = """
        DELETE FROM orders
        WHERE status = 'new' AND source = 'erp' AND in_erp = 0
    """
    deleted_count = execute_update(sql_delete, ())
    return deleted_count


def update_order(order_id, data):
    """Update order. Only provided keys are updated."""
    allowed = {
        'status', 'attempt_count', 'next_action_at', 'scheduled_callback_at',
        'last_attempt_at', 'cancellation_reason', 'bosta_tracking', 'bosta_order_id',
        'customer_id', 'customer_phone', 'customer_name', 'delivery_address',
        'order_description', 'governorate', 'city', 'cod_amount', 'converted_to_ticket_id', 'service_type',
        'approved_by', 'approved_at', 'confirmation_snapshot', 'in_erp'
    }
    # Allow explicit NULL for selected nullable columns (e.g. clear cancellation_reason on reactivate).
    nullable_explicit_null = {'cancellation_reason'}
    updates = {}
    for k, v in data.items():
        if k not in allowed:
            continue
        if v is None and k in nullable_explicit_null:
            updates[k] = None
        elif v is not None:
            updates[k] = v
    if not updates:
        return 0
    if 'confirmation_snapshot' in updates and isinstance(updates['confirmation_snapshot'], dict):
        updates['confirmation_snapshot'] = json.dumps(updates['confirmation_snapshot'], default=str)
    if 'customer_phone' in updates:
        updates['customer_phone'] = normalize_phone_safe(updates['customer_phone']) or updates['customer_phone']
    set_clause = ", ".join(f"`{k}` = %({k})s" for k in updates.keys())
    updates['id'] = order_id
    sql = f"UPDATE orders SET {set_clause} WHERE id = %(id)s"
    return execute_update(sql, updates)
