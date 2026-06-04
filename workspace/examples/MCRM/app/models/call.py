# app/models/call.py
"""Call-center call model. One row per call attempt."""
from app.utils.db import execute_insert, execute_query
from app.utils.phone_normalizer import normalize_phone_safe


def _safe_agent_id(val):
    """Ensure agent_id fits MySQL INT (1–2147483647). Default 1 if invalid."""
    if val is None:
        return 1
    try:
        n = int(val)
        return n if 1 <= n <= 2147483647 else 1
    except (TypeError, ValueError):
        return 1


def create_call(data):
    """Create a call record. linked_to_order_id and linked_to_ticket_id are mutually exclusive (or both NULL for ASK-only)."""
    clean = dict(data)
    if clean.get('customer_phone'):
        clean['customer_phone'] = normalize_phone_safe(clean['customer_phone']) or clean['customer_phone']
    if 'agent_id' in clean:
        clean['agent_id'] = _safe_agent_id(clean['agent_id'])
    cols = [
        'linked_to_order_id', 'linked_to_ticket_id', 'call_type', 'status',
        'attempt_number', 'agent_id', 'agent_name', 'customer_phone',
        'scheduled_callback_at', 'next_action_at', 'notes', 'cancellation_reason'
    ]
    filtered = {k: clean[k] for k in cols if k in clean}
    filtered.setdefault('attempt_number', 1)
    if 'call_type' not in filtered or 'status' not in filtered:
        raise ValueError("call_type and status are required")
    columns = ', '.join(f"`{k}`" for k in filtered.keys())
    placeholders = ', '.join(f"%({k})s" for k in filtered.keys())
    sql = f"INSERT INTO calls ({columns}) VALUES ({placeholders})"
    return execute_insert(sql, filtered)


def get_calls_by_order_id(order_id):
    """Get all calls for an order, newest first."""
    sql = """
        SELECT
            c.*,
            COALESCE(NULLIF(TRIM(c.agent_name), ''), u.name) AS agent_name
        FROM calls c
        LEFT JOIN users u ON u.id = c.agent_id
        WHERE c.linked_to_order_id = %s
        ORDER BY c.created_at DESC
    """
    return execute_query(sql, (order_id,))


def get_calls_by_ticket_id(ticket_id):
    """Get all calls for a ticket (follow-up calls), newest first."""
    sql = """
        SELECT
            c.*,
            COALESCE(NULLIF(TRIM(c.agent_name), ''), u.name) AS agent_name
        FROM calls c
        LEFT JOIN users u ON u.id = c.agent_id
        WHERE c.linked_to_ticket_id = %s
        ORDER BY c.created_at DESC
    """
    return execute_query(sql, (ticket_id,))


def get_calls_for_customer(customer_id=None, phone=None, limit=50):
    """
    360° call history: normalized phone match and/or calls linked to this customer's
    orders or service tickets (covers denormalized customer_phone drift after phone changes).
    """
    norm = normalize_phone_safe(phone) if phone else None
    if not customer_id and not norm:
        return []

    parts = []
    params = []
    if norm:
        parts.append("c.customer_phone = %s")
        params.append(norm)
    if customer_id:
        parts.append("c.linked_to_order_id IN (SELECT id FROM orders WHERE customer_id = %s)")
        params.append(customer_id)
        parts.append("c.linked_to_ticket_id IN (SELECT id FROM service_tickets WHERE customer_id = %s)")
        params.append(customer_id)

    where_sql = " OR ".join(f"({p})" for p in parts)
    lim = int(limit) if limit is not None else 50
    params.append(lim)

    sql = f"""
        SELECT
            c.*,
            COALESCE(NULLIF(TRIM(c.agent_name), ''), u.name) AS agent_name
        FROM calls c
        LEFT JOIN users u ON u.id = c.agent_id
        WHERE ({where_sql})
        ORDER BY c.created_at DESC
        LIMIT %s
    """
    return execute_query(sql, tuple(params))


def get_calls_by_customer_phone(phone, limit=50):
    """Get calls by customer phone (for 360° view). Same as phone-only branch of get_calls_for_customer."""
    return get_calls_for_customer(customer_id=None, phone=phone, limit=limit)


def list_ask_calls(date_from=None, date_to=None, limit=100):
    """List ask-only calls (no order/ticket). Optional date range."""
    conds = ["c.linked_to_order_id IS NULL", "c.linked_to_ticket_id IS NULL", "c.call_type = 'ask'"]
    parms = []
    if date_from:
        conds.append("DATE(created_at) >= %s")
        parms.append(date_from[:10] if len(date_from) >= 10 else date_from)
    if date_to:
        conds.append("DATE(created_at) <= %s")
        parms.append(date_to[:10] if len(date_to) >= 10 else date_to)
    parms.append(limit)
    sql = f"""
        SELECT
            c.*,
            COALESCE(NULLIF(TRIM(c.agent_name), ''), u.name) AS agent_name
        FROM calls c
        LEFT JOIN users u ON u.id = c.agent_id
        WHERE {' AND '.join(conds)}
        ORDER BY c.created_at DESC
        LIMIT %s
    """
    return execute_query(sql, tuple(parms))
