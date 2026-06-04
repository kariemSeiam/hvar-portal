# app/api/call_center_api.py
"""Call-center API: orders queue, sync-from-ERP, confirm, schedule, no-answer, cancel, ask-only, leader workflow."""
import json
import logging
import re
from datetime import datetime, timedelta, date as date_type
from flask import Blueprint, request, jsonify, g
from app.utils.auth import require_auth

from app.models import order as order_model
from app.models import call as call_model
from app.models import service_ticket as ticket_model
from app.services import service_manager
from app.services.bosta_service import get_customer_orders_unified
from app.api.erp_api import ERPAuth
from app.utils.db import execute_update, execute_query

logger = logging.getLogger(__name__)

call_center_api_blueprint = Blueprint('call_center_api', __name__, url_prefix='/api/call-center')

CALL_TYPES = {'ask', 'sell', 'replacement', 'maintenance', 'return'}
CALL_OUTCOMES = {'confirmed', 'scheduled', 'no_answer', 'canceled'}

# Short codes sometimes appear on legacy rows; leader-approve normalizes to full CALL_TYPES names.
_LEGACY_SERVICE_TYPE_TO_CANONICAL = {'r': 'replacement', 'm': 'maintenance', 't': 'return', 's': 'sell'}

# Bidi / zero-width from RTL UIs or copy-paste breaks exact match with CALL_TYPES (e.g. "replacement\u200f")
_INVISIBLE_TYPE_CHARS = re.compile(r'[\u200b-\u200f\ufeff\u202a-\u202e]')


def _sanitize_call_type_token(raw):
    """Lowercase ASCII-ish service token; strip invisible Unicode so CALL_TYPES membership works."""
    if raw is None:
        return ''
    s = str(raw).strip()
    s = _INVISIBLE_TYPE_CHARS.sub('', s)
    return s.lower().strip()


def _normalize_leader_approve_call_type(req_data):
    """Parse call_type/service_type from leader-approve JSON; None if absent or unusable for tickets."""
    raw = None
    # Prefer explicit keys (avoid `or` losing empty-but-valid handling); support camelCase clients
    for key in ('call_type', 'service_type', 'callType'):
        if key not in req_data:
            continue
        v = req_data.get(key)
        if v is None:
            continue
        if isinstance(v, str) and v.strip() == '':
            continue
        raw = v
        break
    if raw is None:
        return None
    s = _sanitize_call_type_token(raw)
    s = _LEGACY_SERVICE_TYPE_TO_CANONICAL.get(s, s)
    if s not in CALL_TYPES or s == 'ask':
        return None
    return s


def _canonical_service_type_str(raw):
    """Normalize order/ticket service type string to full canonical name (sell, replacement, …)."""
    s = _sanitize_call_type_token(str(raw or 'sell'))
    return _LEGACY_SERVICE_TYPE_TO_CANONICAL.get(s, s)


def _resolve_leader_approve_original_tracking(tracking):
    """
    service_tickets.original_tracking must be unique across non-cancelled tickets
    (see service_manager._check_original_tracking_not_used).

    If the Bosta / shipment number is already used on another ticket — typical when the same
    customer order is reclassified (e.g. replacement ticket exists, then maintenance from call-center)
    — return (None, prefix_note) so ticket creation uses the generated ticket number as
    original_tracking; the real Bosta number stays in notes.

    Returns:
        (str | None, str): tracking to pass to create_* (or None), and optional note prefix.
    """
    if not tracking:
        return None, ''
    t = str(tracking).strip()
    if not t:
        return None, ''
    rows = execute_query(
        """SELECT id, ticket_number, service_type FROM service_tickets
           WHERE original_tracking = %s AND status != %s LIMIT 1""",
        (t, 'CANCELLED'),
    )
    if not rows:
        return t, ''
    prev = rows[0]
    tn = prev.get('ticket_number') or f"id={prev.get('id')}"
    st = (prev.get('service_type') or '').strip()
    st_part = f" — {st}" if st else ''
    prefix = (
        f"[رقم التتبع الأصلي {t} مسجل في تذكرة أخرى ({tn}{st_part}). "
        f"أُنشئت هذه التذكرة برقم داخلي في الحقل لتفادي التعارض. مرجع الشحنة: {t}]\n"
    )
    return None, prefix


def _err(code, message, status=400):
    """Standard error response for call-center."""
    return jsonify({"success": False, "error": code, "message": message}), status


def _safe_agent_id(data, key1='agent_id', key2='user_id'):
    """Extract and normalize agent_id from request data. Returns int 1-2147483647."""
    raw = data.get(key1) or data.get(key2) or 1
    try:
        n = int(raw)
        return n if 1 <= n <= 2147483647 else 1
    except (TypeError, ValueError):
        return 1


def _resolve_agent_name(agent_id, raw_name=None):
    """
    Resolve stable agent display name for call history persistence.
    Priority:
      1) payload name when present
      2) users.name by agent_id
      3) generic non-numeric fallback
    """
    name = str(raw_name or '').strip()
    if name:
        return name
    try:
        rows = execute_query("SELECT name FROM users WHERE id = %s LIMIT 1", (agent_id,))
        if rows and rows[0].get('name'):
            db_name = str(rows[0]['name']).strip()
            if db_name:
                return db_name
    except Exception:
        pass
    return 'مستخدم النظام'


def _canonical_order_status(status):
    """Normalize legacy/variant status names into canonical call-center statuses."""
    s = str(status or '').strip().lower()
    if s == 'completed':
        return 'converted'
    if s == 'cancelled':
        return 'canceled'
    return s


def _is_canceled_order(order):
    """True if order row is in canceled (or legacy cancelled) state."""
    return _canonical_order_status(order.get('status')) == 'canceled'


def _expand_status_for_query(status):
    """Expand canonical status to DB variants for robust filtering."""
    s = _canonical_order_status(status)
    if s == 'canceled':
        return ['canceled', 'cancelled']
    return [s] if s else []


# --- Health ---
@call_center_api_blueprint.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"}), 200


# --- Create direct order (Phase B: Journey B) ---
@call_center_api_blueprint.route('/orders', methods=['POST'])
@require_auth
def create_order():
    """POST /api/call-center/orders — create direct order (no ERP). Body: source, call_type, customer_phone, customer_name, notes."""
    data = request.get_json() or {}
    phone = data.get('customer_phone')
    if not phone:
        return _err('MISSING_REQUIRED_FIELDS', 'customer_phone required', 400)
    service_type = data.get('service_type') or data.get('call_type')
    row = order_model.create_order({
        'source': data.get('source', 'direct'),
        'service_type': service_type,
        'customer_phone': phone,
        'customer_name': data.get('customer_name'),
        'delivery_address': data.get('delivery_address'),
        'governorate': data.get('governorate'),
        'city': data.get('city'),
        'cod_amount': data.get('cod_amount'),
    })
    order = order_model.get_order_by_id(row)
    if order and isinstance(order.get('cod_amount'), (int, float)):
        order['cod_amount'] = float(order['cod_amount'])
    for k in ('created_at', 'updated_at', 'next_action_at', 'scheduled_callback_at', 'last_attempt_at'):
        if order and order.get(k):
            order[k] = order[k].isoformat() if hasattr(order[k], 'isoformat') else str(order[k])
    return jsonify({"success": True, "order": order}), 201


# --- Orders list ---
@call_center_api_blueprint.route('/orders', methods=['GET'])
@require_auth
def list_orders():
    """GET /api/call-center/orders with filters and pagination. Default: today + backlog when no date."""
    status = _canonical_order_status(request.args.get('status'))
    source = request.args.get('source')
    service_type = request.args.get('service_type')
    search = request.args.get('search')
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')
    today = request.args.get('today')
    governorate = request.args.get('governorate')
    
    # NEW: Filter params for SearchBar filters
    statuses_str = request.args.get('statuses')  # comma-separated: "new,scheduled"
    min_attempts = request.args.get('min_attempts', type=int)  # For "لم يرد" filter
    attempts_str = request.args.get('attempts')  # comma-separated: "0,1,2,3"
    
    # Convert statuses to list
    status_list = []
    if statuses_str:
        expanded = []
        for s in [x.strip() for x in statuses_str.split(',') if x.strip()]:
            expanded.extend(_expand_status_for_query(s))
        status_list = list(dict.fromkeys(expanded))
    elif status:
        status_list = _expand_status_for_query(status)
    
    # Convert attempts to list
    attempt_list = []
    if attempts_str:
        attempt_list = [int(a.strip()) for a in attempts_str.split(',') if a.strip().isdigit()]
    
    all_dates = request.args.get('all_dates', '').lower() in ('1', 'true', 'yes')
    if all_dates:
        date_from = None
        date_to = None
        today = today or date_type.today().isoformat()
    else:
        if not date_from or not date_to:
            today_dt = date_type.today()
            today = today or today_dt.isoformat()
            date_from = date_from[:10] if date_from and len(date_from) >= 10 else today_dt.isoformat()
            date_to = date_to[:10] if date_to and len(date_to) >= 10 else today_dt.isoformat()
        if date_from and len(date_from) == 10:
            date_from = f"{date_from} 00:00:00"
        if date_to and len(date_to) == 10:
            date_to = f"{date_to} 23:59:59"
        if not today or len(today) < 10:
            today = date_type.today().isoformat()
        today_str = today[:10] if len(today) >= 10 else date_type.today().isoformat()
        if date_from and date_from[:10] == today_str:
            order_model.roll_forward_backlog_to_today(today_str)
    page = max(1, int(request.args.get('page', 1)))
    per_page = min(100, max(1, int(request.args.get('per_page', 25))))
    offset = (page - 1) * per_page

    rows = order_model.list_orders(
        limit=per_page, offset=offset,
        status=status, status_list=status_list, source=source, service_type=service_type,
        search=search, date_from=date_from, date_to=date_to, today=today, governorate=governorate,
        min_attempts=min_attempts, attempt_list=attempt_list
    )
    total = order_model.get_orders_count(
        status=status, status_list=status_list, source=source, service_type=service_type,
        search=search, date_from=date_from, date_to=date_to, today=today, governorate=governorate,
        min_attempts=min_attempts, attempt_list=attempt_list
    )

    import json as _json
    for r in rows:
        if isinstance(r.get('cod_amount'), (int, float)):
            r['cod_amount'] = float(r['cod_amount'])
        for k in ('created_at', 'updated_at', 'next_action_at', 'scheduled_callback_at', 'last_attempt_at'):
            if r.get(k):
                r[k] = r[k].isoformat() if hasattr(r[k], 'isoformat') else str(r[k])
        if isinstance(r.get('confirmation_snapshot'), str):
            try:
                r['confirmation_snapshot'] = _json.loads(r['confirmation_snapshot'])
            except (_json.JSONDecodeError, ValueError):
                r['confirmation_snapshot'] = None

    return jsonify({
        "data": rows,
        "pagination": {"page": page, "per_page": per_page, "total": total, "pages": (total + per_page - 1) // per_page}
    }), 200


# --- Dates that have orders (for day chips: only show days with data) ---
@call_center_api_blueprint.route('/orders/dates-with-data', methods=['GET'])
@require_auth
def order_dates_with_data():
    """GET /api/call-center/orders/dates-with-data. Returns list of YYYY-MM-DD that have at least one order."""
    dates = order_model.get_dates_with_orders()
    return jsonify({"dates": dates}), 200


# --- Order counts (for QueueStatusBar) ---
def _counts_payload_from_raw(raw, date_key=None):
    """Build JSON payload from get_orders_counts_by_status raw dict."""
    def c(s):
        return raw.get(s, 0)
    payload = {
        "new": c('new'),
        "scheduled": c('scheduled'),
        "confirmed": c('confirmed'),
        "completed": c('converted'),
        "canceled": c('canceled') + c('cancelled'),
        "attempts": {"new": c('new'), "retry1": 0, "retry2": 0}
    }
    if date_key:
        payload["_date"] = date_key
    return payload


@call_center_api_blueprint.route('/orders/counts', methods=['GET'])
@require_auth
def order_counts():
    """GET /api/call-center/orders/counts. Single date: ?date=YYYY-MM-DD. Multiple: ?dates=YYYY-MM-DD,YYYY-MM-DD. No args = today totals."""
    from datetime import datetime, date
    date_arg = request.args.get('date')
    dates_arg = request.args.get('dates')  # comma-separated for batch (QueueStatusBar)
    today_arg = request.args.get('today')
    today_dt = date.today()
    today_str = today_arg[:10] if today_arg and len(today_arg) >= 10 else today_dt.isoformat()

    # Batch: return counts for multiple dates in one response (reduces N requests to 1)
    if dates_arg:
        date_keys = [d.strip()[:10] for d in dates_arg.split(',') if d.strip() and len(d.strip()) >= 10]
        date_keys = list(dict.fromkeys(date_keys))  # unique, preserve order
        result = {}
        for dk in date_keys:
            try:
                dt = datetime.strptime(dk, '%Y-%m-%d')
                date_from = dt.strftime('%Y-%m-%d 00:00:00')
                date_to = dt.strftime('%Y-%m-%d 23:59:59')
            except ValueError:
                continue
            raw = order_model.get_orders_counts_by_status(date_from=date_from, date_to=date_to, today=today_str)
            result[dk] = _counts_payload_from_raw(raw, dk)
        return jsonify({"dates": result}), 200

    # Single date or no date (today totals)
    date_from = None
    date_to = None
    if date_arg and len(date_arg) >= 10:
        try:
            dt = datetime.strptime(date_arg[:10], '%Y-%m-%d')
            date_from = dt.strftime('%Y-%m-%d 00:00:00')
            date_to = dt.strftime('%Y-%m-%d 23:59:59')
        except ValueError:
            pass
    raw = order_model.get_orders_counts_by_status(date_from=date_from, date_to=date_to, today=today_str)
    payload = _counts_payload_from_raw(raw, date_arg[:10] if date_arg and len(date_arg) >= 10 else None)
    return jsonify(payload), 200


# --- Single order + call history ---
@call_center_api_blueprint.route('/orders/<int:order_id>', methods=['GET'])
@require_auth
def get_order(order_id):
    """
    GET /api/call-center/orders/:id — order + call history + linked ticket.
    Lazy Bosta enrichment: if order has no bosta_tracking and source='erp', enrich on-demand.
    """
    order = order_model.get_order_by_id(order_id)
    if not order:
        return _err('ORDER_NOT_FOUND', f'No order with id {order_id}', 404)
    
    # Lazy enrichment removed — ERP sync already enriches, on-demand too slow for real-time UX

    calls = call_model.get_calls_by_order_id(order_id)
    ticket = None
    if order.get('converted_to_ticket_id'):
        ticket = ticket_model.get_ticket_by_id(order['converted_to_ticket_id'])
        if ticket:
            ticket = ticket_model.enrich_ticket_with_bosta_orders(ticket)

    import json as _json
    for r in (order, ticket) if ticket else (order,):
        if r:
            for k in list(r.keys()):
                v = r[k]
                if hasattr(v, 'isoformat'):
                    r[k] = v.isoformat()
                elif k == 'cod_amount' and isinstance(v, (int, float)):
                    r[k] = float(v)
                elif k == 'confirmation_snapshot' and isinstance(v, str):
                    try:
                        r[k] = _json.loads(v)
                    except (_json.JSONDecodeError, ValueError):
                        r[k] = None
    for c in calls:
        for k in list(c.keys()):
            v = c[k]
            if hasattr(v, 'isoformat'):
                c[k] = v.isoformat()

    return jsonify({
        "order": order,
        "calls": calls,
        "ticket": ticket
    }), 200


# --- Sync from ERP ---
def _erp_row_to_order(row):
    """Map ERP DataTables row to order dict. See docs/call-center/erp-draft-dt-response-shape.md."""
    invoice_no = row.get('invoice_no') or row.get('invoice_number')
    mobile = row.get('mobile') or row.get('whatsapp')
    if not mobile and isinstance(row.get('contacts'), dict):
        mobile = (row.get('contacts') or {}).get('mobile')
    if not mobile and isinstance(row.get('contacts'), str):
        mobile = row.get('contacts')
    contact_name = row.get('contact_name_text') or row.get('contact_name') or row.get('name')
    addr = row.get('shipping_address') or row.get('delivery_address') or ''
    gov = row.get('shipping_state') or row.get('governorate')
    city = row.get('shipping_city') or row.get('city')
    cod = row.get('cod_amount') or row.get('cod') or row.get('total')
    if cod is None:
        raw = row.get('final_total')
        if isinstance(raw, str):
            m = re.search(r'data-orig-value="([\d.]+)"', raw)
            cod = float(m.group(1)) if m else 0.0
        else:
            cod = raw or 0
    try:
        cod = float(cod)
    except (TypeError, ValueError):
        cod = 0.0
    shipping_details = str(row.get('shipping_details') or row.get('order_description') or '').strip()

    out = {
        'source': 'erp',
        'service_type': 'sell',  # ERP COD orders are always sell (بيع)
        'status': 'new',
        'attempt_count': 0,
        'erp_order_id': str(invoice_no) if invoice_no else None,
        'customer_phone': str(mobile).strip() if mobile else None,
        'customer_name': str(contact_name) if contact_name else None,
        'delivery_address': str(addr) if addr else None,
        'governorate': str(gov) if gov else None,
        'city': str(city) if city else None,
        'cod_amount': cod,
    }
    if shipping_details:
        out['order_description'] = shipping_details
    return out


def _dedupe_erp_rows_by_order(rows):
    """
    Group ERP rows by invoice_no (normalized). ERP may return one row per line item.
    Return one row per order; merge shipping_details when multiple rows share same invoice.
    """
    groups = {}
    col_keys = [
        'action', 'transaction_date', 'invoice_no', 'contact_name', 'mobile',
        'whatsapp', 'business_location', 'total_items', 'added_by', 'commission_agent',
        'shipping_state', 'shipping_city', 'shipping_address', 'shipping_details', 'coupon_code'
    ]
    for row in rows:
        if isinstance(row, list):
            row = dict(zip(col_keys, row[:15] if len(row) >= 15 else row + [None] * 15))
        inv = row.get('invoice_no') or row.get('invoice_number')
        if not inv:
            continue
        inv_str = str(inv).strip()
        inv_norm = re.sub(r'-\d+$', '', inv_str) if inv_str else None
        if not inv_norm:
            continue
        if inv_norm not in groups:
            groups[inv_norm] = []
        groups[inv_norm].append(row)

    result = []
    for inv_norm, group in groups.items():
        first = dict(group[0])
        first['invoice_no'] = inv_norm
        if len(group) > 1:
            descs = []
            for r in group:
                d = (r.get('shipping_details') or r.get('order_description') or '').strip()
                if d and d not in descs:
                    descs.append(d)
            if descs:
                first['shipping_details'] = '\n'.join(descs)
        result.append(first)
    return result


def _build_erp_draft_params(start_date, end_date, start=0, length=2000):
    """Build full DataTables params for ERP draft-dt endpoint. Pagination: start, length."""
    base = {
        'is_quotation': '0', 'draw': '1',
        'columns[0][data]': 'action', 'columns[0][name]': 'action', 'columns[0][searchable]': 'false', 'columns[0][orderable]': 'false', 'columns[0][search][value]': '', 'columns[0][search][regex]': 'false',
        'columns[1][data]': 'transaction_date', 'columns[1][name]': 'transaction_date', 'columns[1][searchable]': 'true', 'columns[1][orderable]': 'true', 'columns[1][search][value]': '', 'columns[1][search][regex]': 'false',
        'columns[2][data]': 'invoice_no', 'columns[2][name]': 'invoice_no', 'columns[2][searchable]': 'true', 'columns[2][orderable]': 'true', 'columns[2][search][value]': '', 'columns[2][search][regex]': 'false',
        'columns[3][data]': 'contact_name', 'columns[3][name]': 'contact_name', 'columns[3][searchable]': 'true', 'columns[3][orderable]': 'true', 'columns[3][search][value]': '', 'columns[3][search][regex]': 'false',
        'columns[4][data]': 'mobile', 'columns[4][name]': 'contacts.mobile', 'columns[4][searchable]': 'true', 'columns[4][orderable]': 'true', 'columns[4][search][value]': '', 'columns[4][search][regex]': 'false',
        'columns[5][data]': 'whatsapp', 'columns[5][name]': 'whatsapp', 'columns[5][searchable]': 'false', 'columns[5][orderable]': 'false', 'columns[5][search][value]': '', 'columns[5][search][regex]': 'false',
        'columns[6][data]': 'business_location', 'columns[6][name]': 'bl.name', 'columns[6][searchable]': 'true', 'columns[6][orderable]': 'true', 'columns[6][search][value]': '', 'columns[6][search][regex]': 'false',
        'columns[7][data]': 'total_items', 'columns[7][name]': 'total_items', 'columns[7][searchable]': 'false', 'columns[7][orderable]': 'true', 'columns[7][search][value]': '', 'columns[7][search][regex]': 'false',
        'columns[8][data]': 'added_by', 'columns[8][name]': 'added_by', 'columns[8][searchable]': 'true', 'columns[8][orderable]': 'true', 'columns[8][search][value]': '', 'columns[8][search][regex]': 'false',
        'columns[9][data]': 'commission_agent', 'columns[9][name]': 'commission_agent', 'columns[9][searchable]': 'true', 'columns[9][orderable]': 'true', 'columns[9][search][value]': '', 'columns[9][search][regex]': 'false',
        'columns[10][data]': 'shipping_state', 'columns[10][name]': 'shipping_state', 'columns[10][searchable]': 'true', 'columns[10][orderable]': 'true', 'columns[10][search][value]': '', 'columns[10][search][regex]': 'false',
        'columns[11][data]': 'shipping_city', 'columns[11][name]': 'shipping_city', 'columns[11][searchable]': 'true', 'columns[11][orderable]': 'true', 'columns[11][search][value]': '', 'columns[11][search][regex]': 'false',
        'columns[12][data]': 'shipping_address', 'columns[12][name]': 'shipping_address', 'columns[12][searchable]': 'true', 'columns[12][orderable]': 'true', 'columns[12][search][value]': '', 'columns[12][search][regex]': 'false',
        'columns[13][data]': 'shipping_details', 'columns[13][name]': 'shipping_details', 'columns[13][searchable]': 'true', 'columns[13][orderable]': 'true', 'columns[13][search][value]': '', 'columns[13][search][regex]': 'false',
        'columns[14][data]': 'coupon_code', 'columns[14][name]': 'transactions.coupon_code', 'columns[14][searchable]': 'true', 'columns[14][orderable]': 'true', 'columns[14][search][value]': '', 'columns[14][search][regex]': 'false',
        'order[0][column]': '0', 'order[0][dir]': 'desc', 'start': str(start), 'length': str(length), 'search[value]': '', 'search[regex]': 'false',
        'start_date': start_date, 'end_date': end_date, 'location_id': '', 'customer_id': '', 'created_by': '', 'sales_cmsn_agnt': '', 'coupon_code': ''
    }
    return base


def _bosta_enrich_order(phone):
    """Return (bosta_tracking, bosta_order_id) from Bosta by phone. (None, None) on failure."""
    if not phone:
        return None, None
    try:
        data = get_customer_orders_unified(phone, enrich=False)
        orders = data.get('orders') or data.get('customers', [{}])[0].get('orders', []) if isinstance(data.get('customers'), list) else []
        if not orders and isinstance(data, dict) and 'data' in data:
            orders = data.get('data', []) if isinstance(data.get('data'), list) else []
        if orders:
            o = orders[0] if isinstance(orders[0], dict) else {}
            tr = o.get('trackingNumber') or o.get('tracking_number')
            oid = o.get('id') or o.get('bosta_order_id')
            return (str(tr) if tr else None), (str(oid) if oid else None)
    except Exception as e:
        logger.warning(f"Bosta enrich failed for {phone}: {e}")
    return None, None


@call_center_api_blueprint.route('/orders/sync-from-erp', methods=['POST'])
@require_auth
def sync_from_erp():
    """
    POST /api/call-center/orders/sync-from-erp — Start background sync worker (manual trigger).
    Returns job_id immediately (non-blocking). Use GET /sync-status/{job_id} to poll progress.
    
    If sync is already running, returns existing job_id (no duplicate syncs).
    Body: {username?, password?, start_date?, end_date?, force?}
    """
    import os
    from app.workers import erp_sync_worker

    erp_sync_worker.reconcile_stale_active_sync_job()

    data = request.get_json() or {}
    username = data.get('username') or os.environ.get('ERP_DEFAULT_USERNAME')
    password = data.get('password') or os.environ.get('ERP_DEFAULT_PASSWORD')
    start_date = data.get('start_date', '2026-01-01')
    end_date = data.get('end_date', '2026-12-31')
    force = data.get('force', False)

    if not username or not password:
        return _err('MISSING_CREDENTIALS', 'username and password required (or set ERP_DEFAULT_USERNAME, ERP_DEFAULT_PASSWORD)', 400)

    try:
        # Check if sync is already running
        if erp_sync_worker.is_sync_running() and not force:
            active_job_id = erp_sync_worker.get_active_sync_job_id()
            return jsonify({
                "success": True,
                "job_id": active_job_id,
                "message": "Sync is already running. Use /sync-status/{job_id} to check progress.",
                "already_running": True
            }), 200
        
        # Start background worker (non-blocking)
        job_id = erp_sync_worker.start_sync_worker(username, password, start_date, end_date, force=force)
        
        if job_id:
            return jsonify({
                "success": True,
                "job_id": job_id,
                "message": "Sync started in background. Use /sync-status/{job_id} to check progress.",
                "already_running": False
            }), 202  # Accepted (not completed)
        else:
            return _err('SYNC_ALREADY_RUNNING', 'Sync is already running and force=false', 409)
            
    except Exception as e:
        logger.exception("Failed to start sync worker")
        return _err('SYNC_FAILED', str(e), 500)


@call_center_api_blueprint.route('/sync-status', methods=['GET'])
@require_auth
def get_sync_status_active():
    """GET /api/call-center/sync-status — Active sync snapshot (may be cluster-wide vs this worker only)."""
    from app.workers import erp_sync_worker

    erp_sync_worker.reconcile_stale_active_sync_job()

    cluster_busy = erp_sync_worker.is_cluster_erp_sync_busy()
    local_running = erp_sync_worker.is_sync_running()
    active_job_id = erp_sync_worker.get_active_sync_job_id() if local_running else None

    if not cluster_busy and not local_running:
        return jsonify({
            "running": False,
            "cluster_lock_held": False,
            "message": "No sync currently running"
        }), 200

    payload = {
        "running": True,
        "cluster_lock_held": cluster_busy,
    }

    if active_job_id:
        job = erp_sync_worker.get_job_status(active_job_id)
        if job:
            # Local worker view (best detail when LB hits same process that holds the thread)
            return jsonify({
                "job_id": active_job_id,
                **payload,
                **job,
            }), 200

        return jsonify({
            "job_id": active_job_id,
            **payload,
            "message": "Sync status unavailable",
        }), 200

    # Cluster lock indicates sync somewhere; memory job may be on another worker.
    return jsonify({
        "job_id": None,
        **payload,
        "message": "ERP sync likely running on another app worker (exclusive DB lock held).",
        "status": "running",
    }), 200


@call_center_api_blueprint.route('/sync-status/<job_id>', methods=['GET'])
@require_auth
def get_sync_status(job_id):
    """GET /api/call-center/sync-status/{job_id} — Get ERP sync job status."""
    from app.workers import erp_sync_worker
    
    job = erp_sync_worker.get_job_status(job_id)
    if not job:
        return _err('JOB_NOT_FOUND', f'Sync job {job_id} not found', 404)
    
    return jsonify(job), 200


# --- Confirm by customer (unified: all types go to leader) ---
def _items_for_sell(items):
    """Map confirm body items to service_manager format. Accept product_id or item_id.
    Returns items with item_id, quantity — caller must add direction/condition for ticket creation."""
    out = []
    for it in (items or []):
        iid = it.get('item_id') or it.get('product_id') or it.get('id')
        if iid is None or (isinstance(iid, str) and not str(iid).strip()):
            continue
        try:
            qty = it.get('quantity', it.get('order_quantity', 1))
            out.append({'item_id': int(iid), 'quantity': int(qty)})
        except (TypeError, ValueError):
            continue
    return out


def _items_for_snapshot(items, items_to_send, items_to_receive, call_type):
    """Map confirm body to snapshot items. For sell: flat items. For R/M/T: items with direction/condition.
    Accepts items (unified) or items_to_send/items_to_receive. Adds defaults when direction/condition missing."""
    if call_type == 'sell':
        return _items_for_sell(items)

    # R/M/T: build from items_to_send/items_to_receive if provided, else from items
    out = []
    if items_to_send or items_to_receive:
        for it in (items_to_send or []):
            iid = it.get('item_id') or it.get('product_id')
            if iid is not None:
                out.append({
                    'item_id': int(iid),
                    'quantity': int(it.get('quantity', 1)),
                    'direction': 'send',
                    'condition': it.get('condition') or 'valid',
                })
        for it in (items_to_receive or []):
            iid = it.get('item_id') or it.get('product_id')
            if iid is not None:
                out.append({
                    'item_id': int(iid),
                    'quantity': int(it.get('quantity', 1)),
                    'direction': 'receive',
                    'condition': it.get('condition') or 'damaged',
                })
    else:
        for it in (items or []):
            iid = it.get('item_id') or it.get('product_id')
            if iid is not None:
                direction = it.get('direction')
                condition = it.get('condition')
                if call_type == 'return':
                    direction = direction or 'receive'
                    condition = condition or 'damaged'
                else:
                    direction = direction or 'send'
                    condition = condition or ('valid' if direction == 'send' else 'damaged')
                out.append({
                    'item_id': int(iid),
                    'quantity': int(it.get('quantity', 1)),
                    'direction': direction,
                    'condition': condition,
                })
    return out


def _items_for_ticket(snap_items, default_direction='send', default_condition='valid'):
    """Map snapshot items to _create_ticket_and_items format. Requires item_id, quantity, direction, condition."""
    out = []
    for it in (snap_items or []):
        iid = it.get('item_id') or it.get('product_id')
        if iid is not None:
            out.append({
                'item_id': int(iid),
                'quantity': int(it.get('quantity', 1)),
                'direction': it.get('direction') or default_direction,
                'condition': it.get('condition') or default_condition,
            })
    return out


@call_center_api_blueprint.route('/orders/<int:order_id>/confirm-by-customer', methods=['POST'])
@require_auth
def confirm_by_customer(order_id):
    """POST confirm-by-customer: create call, set status=confirmed, store snapshot. NO ticket — leader approves later."""
    order = order_model.get_order_by_id(order_id)
    if not order:
        return _err('ORDER_NOT_FOUND', f'No order with id {order_id}', 404)
    # Canceled orders can be reactivated: confirm → مؤكدة (new snapshot). Audit stays in calls.
    reactivating_from_canceled = _is_canceled_order(order)
    if order.get('converted_to_ticket_id'):
        return _err('ORDER_ALREADY_CONVERTED', 'Order already has a ticket', 400)

    data = request.get_json() or {}
    call_type = data.get('call_type', 'sell')
    if call_type not in CALL_TYPES:
        return _err('INVALID_CALL_TYPE', f'call_type must be one of: {sorted(CALL_TYPES)}', 400)

    items = _items_for_snapshot(
        data.get('items'),
        data.get('items_to_send') or data.get('itemsToSend'),
        data.get('items_to_receive') or data.get('itemsToReceive'),
        call_type,
    )
    if call_type == 'sell' and not items:
        return _err('MISSING_REQUIRED_FIELDS', 'items (with item_id/product_id and quantity) required for sell', 400)
    if call_type == 'replacement':
        if not items:
            return _err('MISSING_REQUIRED_FIELDS', 'items required for replacement', 400)
        has_send = any(it.get('direction') == 'send' for it in items)
        has_receive = any(it.get('direction') == 'receive' for it in items)
        if not (has_send and has_receive):
            return _err(
                'MISSING_REQUIRED_FIELDS',
                'replacement requires at least one item to send and one item to receive',
                400,
            )

    user_id = g.current_user['id']
    name = data.get('customer_name') or order.get('customer_name')
    phone = data.get('customer_phone') or order.get('customer_phone')
    if not phone:
        return _err('MISSING_REQUIRED_FIELDS', 'customer_phone required', 400)

    # cod_amount: prefer payload (agent's items total) over order (ERP). 0 is valid — don't use 'or' (falsy).
    cod_amount_raw = data.get('cod_amount') if data.get('cod_amount') is not None else (
        data.get('total') if data.get('total') is not None else order.get('cod_amount')
    )
    try:
        cod_amount = float(cod_amount_raw) if cod_amount_raw is not None else 0.0
    except (TypeError, ValueError):
        cod_amount = 0.0

    agent_name = _resolve_agent_name(user_id, data.get('agent_name'))

    # original_tracking: optional — agent-selected Bosta shipment. Only add to snapshot when present.
    original_tracking_raw = data.get('original_tracking')
    original_tracking = str(original_tracking_raw).strip() if original_tracking_raw and str(original_tracking_raw).strip() else None

    # Build confirmation snapshot for leader-approve
    snapshot = {
        'items': items or data.get('items', []),
        'customer_name': name,
        'customer_phone': phone,
        'delivery_address': data.get('delivery_address') or order.get('delivery_address'),
        'governorate': data.get('governorate') or order.get('governorate'),
        'city': data.get('city') or order.get('city'),
        'cod_amount': cod_amount,
        'notes': data.get('notes', ''),
        'call_type': call_type,
        'cost_adjustment': data.get('cost_adjustment'),
        'agent_name': agent_name,
    }
    if original_tracking:
        snapshot['original_tracking'] = original_tracking

    call_id = call_model.create_call({
        'linked_to_order_id': order_id,
        'call_type': call_type,
        'status': 'confirmed',
        'attempt_number': (order.get('attempt_count') or 0) + 1,
        'agent_id': user_id,
        'agent_name': agent_name,
        'customer_phone': phone,
        'notes': data.get('notes'),
    })

    update_payload = {
        'status': 'confirmed',
        'confirmation_snapshot': snapshot,
        'service_type': call_type,
        'cod_amount': cod_amount,
    }
    if reactivating_from_canceled:
        update_payload['cancellation_reason'] = None
    if data.get('order_description') is not None:
        update_payload['order_description'] = data.get('order_description')
    order_model.update_order(order_id, update_payload)

    logger.info(f"Order {order_id} confirmed as call_type={call_type}, service_type={call_type}")

    return jsonify({
        "success": True,
        "call_id": call_id,
        "order_status": "confirmed",
        "message": "تم التأكيد. بانتظار موافقة المشرف."
    }), 200


# --- Leader workflow ---
@call_center_api_blueprint.route('/pending', methods=['GET'])
@require_auth
def list_pending():
    """GET /api/call-center/pending — orders awaiting leader approval (status=confirmed, no ticket)."""
    source = request.args.get('source')
    service_type = request.args.get('service_type')
    page = max(1, int(request.args.get('page', 1)))
    per_page = min(100, max(1, int(request.args.get('per_page', 25))))
    offset = (page - 1) * per_page

    rows = order_model.list_pending_orders(limit=per_page, offset=offset, source=source, service_type=service_type)
    total = order_model.get_pending_orders_count(source=source, service_type=service_type)

    import json as _json
    for r in rows:
        if isinstance(r.get('cod_amount'), (int, float)):
            r['cod_amount'] = float(r['cod_amount'])
        for k in ('created_at', 'updated_at', 'next_action_at', 'scheduled_callback_at', 'last_attempt_at'):
            if r.get(k):
                r[k] = r[k].isoformat() if hasattr(r[k], 'isoformat') else str(r[k])
        if isinstance(r.get('confirmation_snapshot'), str):
            try:
                r['confirmation_snapshot'] = _json.loads(r['confirmation_snapshot'])
            except (_json.JSONDecodeError, ValueError):
                r['confirmation_snapshot'] = None

    return jsonify({
        "data": rows,
        "pagination": {"page": page, "per_page": per_page, "total": total, "pages": (total + per_page - 1) // per_page}
    }), 200


@call_center_api_blueprint.route('/orders/<int:order_id>/leader-approve', methods=['POST'])
@require_auth
def leader_approve(order_id):
    """POST leader-approve: validate final data, create ticket from confirmation_snapshot, set status=converted."""
    order = order_model.get_order_by_id(order_id)
    if not order:
        return _err('ORDER_NOT_FOUND', f'No order with id {order_id}', 404)
    if order.get('status') != 'confirmed':
        return _err('ORDER_INVALID_STATE', 'Order must be confirmed to approve', 400)
    if order.get('converted_to_ticket_id'):
        return _err('ORDER_ALREADY_CONVERTED', 'Order already has a ticket', 400)

    snap = order.get('confirmation_snapshot')
    if isinstance(snap, str):
        snap = json.loads(snap) if snap else {}
    snap = snap or {}

    req_data = request.get_json(silent=True) or {}
    user_id = g.current_user['id']

    # Merge req_data into snap if it's the new modal flow
    is_full_modal_flow = 'customer' in req_data or 'new_tracking_send' in req_data
    
    if req_data.get('customer'):
        snap['customer_name'] = req_data['customer'].get('name', snap.get('customer_name'))
        snap['customer_phone'] = req_data['customer'].get('phone', snap.get('customer_phone'))
        snap['governorate'] = req_data['customer'].get('governorate', snap.get('governorate'))
        snap['city'] = req_data['customer'].get('city', snap.get('city'))
        snap['delivery_address'] = req_data['customer'].get('address_details', snap.get('delivery_address'))

    if 'original_tracking' in req_data: snap['original_tracking'] = req_data['original_tracking']
    # Do not replace snapshot items with [] — empty list was wiping lines at leader approve (ticket created with no items)
    if 'items' in req_data:
        _req_items = req_data.get('items')
        if _req_items is not None and len(_req_items) > 0:
            snap['items'] = _req_items
    if 'cod_amount' in req_data: snap['cod_amount'] = req_data['cod_amount']
    if 'cost_adjustment' in req_data: snap['cost_adjustment'] = req_data['cost_adjustment']
    if 'order_description' in req_data: snap['order_description'] = req_data['order_description']
    if 'notes' in req_data: snap['notes'] = req_data['notes']

    leader_ct = _normalize_leader_approve_call_type(req_data)
    if leader_ct:
        snap['call_type'] = leader_ct

    # Final variables for ticket creation — snapshot (and leader body) wins over stale order.service_type
    service_type = _canonical_service_type_str(snap.get('call_type') or order.get('service_type') or 'sell')
    st = str(service_type).lower().strip()
    
    name = snap.get('customer_name') or order.get('customer_name')
    phone = snap.get('customer_phone') or order.get('customer_phone')
    governorate = snap.get('governorate') or order.get('governorate')
    city = snap.get('city') or order.get('city')
    address_details = snap.get('delivery_address') or order.get('delivery_address')
    original_tracking = snap.get('original_tracking') if snap.get('original_tracking') else order.get('bosta_tracking')
    if original_tracking is not None:
        original_tracking = str(original_tracking).strip() or None

    orig_for_ticket, orig_note_prefix = _resolve_leader_approve_original_tracking(original_tracking)
    if orig_note_prefix:
        snap['notes'] = orig_note_prefix + (snap.get('notes') or '')
        logger.info(
            'Leader approve order %s: original_tracking %s already on another ticket; using generated tracking + note prefix',
            order_id,
            original_tracking,
        )

    new_tracking_send = req_data.get('new_tracking_send')
    new_tracking_receive = req_data.get('new_tracking_receive')

    # Full Validation if it's the new modal flow
    if is_full_modal_flow:
        if not name or not str(name).strip(): return _err('VALIDATION_FAILED', 'اسم العميل مطلوب', 400)
        if not phone or not str(phone).strip(): return _err('VALIDATION_FAILED', 'رقم الهاتف مطلوب', 400)
        if not governorate or not city or not address_details:
            return _err('VALIDATION_FAILED', 'بيانات العنوان (المحافظة، المدينة، التفاصيل) مطلوبة', 400)

    # Cost Calculation
    cod_amount = snap.get('cod_amount') if snap.get('cod_amount') is not None else order.get('cod_amount')
    try:
        cod_amount = float(cod_amount) if cod_amount is not None else 0.0
    except (TypeError, ValueError):
        cod_amount = 0.0
    cost_adjustment = cod_amount
    adj = snap.get('cost_adjustment')
    if adj is not None:
        try:
            cost_adjustment = cod_amount + float(adj)
        except (TypeError, ValueError):
            pass

    customer_params = {
        'name': name,
        'phone': phone,
        'phone_secondary': None,
        'city': city,
        'governorate': governorate,
        'address_details': address_details,
        'original_tracking': orig_for_ticket,
        'reason': None,
        'cost_adjustment': cost_adjustment,
        'notes': snap.get('notes', ''),
        'user_id': user_id,
    }

    # Save final snapshot + service_type before ticket creation (UI lists مؤكدة/converted by order.service_type)
    order_model.update_order(order_id, {'confirmation_snapshot': snap, 'service_type': service_type})

    logger.info(f"Leader approve order {order_id}: service_type={st}, snap.items count={len(snap.get('items') or [])}, req_data keys={list(req_data.keys())}")

    try:
        from app.services import stock_manager
        reservation_ids = []
        approved_at_now = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')

        if st in ('sell', 's'):
            items = _items_for_ticket(snap.get('items', []), default_direction='send', default_condition='valid')
            if not items:
                logger.warning(f"Sell approval for order {order_id}: snap.items={snap.get('items')}")
                return _err('MISSING_REQUIRED_FIELDS', 'items required for sell approval', 400)
            logger.info(f"Sell approval order {order_id}: {len(items)} items -> ticket")
            
            # Stock check but no reservation for products, parts reserved later
            ticket_id = service_manager.create_sell_ticket(
                customer_id=None,
                items=items,
                user_id=user_id,
                notes=customer_params['notes'],
                priority='normal',
                city=customer_params['city'],
                governorate=customer_params['governorate'],
                address_details=customer_params['address_details'],
                original_tracking=customer_params['original_tracking'],
                reason=customer_params['reason'],
                cost_adjustment=customer_params['cost_adjustment'],
                name=customer_params['name'],
                phone=customer_params['phone'],
                phone_secondary=customer_params['phone_secondary'],
                customer_type='customer',
                initial_status='CONFIRMED',
                source='call_center',
                approved_by=user_id,
                approved_at=approved_at_now,
                new_tracking_send=new_tracking_send,
                new_tracking_receive=new_tracking_receive
            )

        elif st in ('replacement', 'r'):
            items = _items_for_ticket(snap.get('items', []))
            has_send = any(it.get('direction') == 'send' for it in items)
            has_receive = any(it.get('direction') == 'receive' for it in items)
            if not (has_send and has_receive):
                logger.warning(f"Replacement approval for order {order_id}: {len(items)} items, has_send={has_send}, has_receive={has_receive}, snap.items={snap.get('items')}")
                return _err('VALIDATION_FAILED', 'استبدال يتطلب عناصر للإرسال وعناصر للاستلام', 400)
            logger.info(f"Replacement approval order {order_id}: {len(items)} items ({sum(1 for i in items if i['direction']=='send')} send, {sum(1 for i in items if i['direction']=='receive')} receive) -> ticket")

            # Stock Reservation BEFORE ticket creation
            for item in items:
                if item.get('direction') == 'send':
                    res_id = stock_manager.reserve_stock(item['item_id'], item['quantity'], None, user_id)
                    reservation_ids.append(res_id)

            ticket_id = service_manager.create_replacement_ticket(
                customer_id=None,
                items=items,
                user_id=user_id,
                notes=customer_params['notes'],
                priority='normal',
                city=customer_params['city'],
                governorate=customer_params['governorate'],
                address_details=customer_params['address_details'],
                original_tracking=customer_params['original_tracking'],
                reason=customer_params['reason'],
                cost_adjustment=customer_params['cost_adjustment'],
                name=customer_params['name'],
                phone=customer_params['phone'],
                phone_secondary=customer_params['phone_secondary'],
                initial_status='CONFIRMED',
                source='call_center',
                approved_by=user_id,
                approved_at=approved_at_now,
                new_tracking_send=new_tracking_send,
                new_tracking_receive=new_tracking_receive,
                reservation_ids=reservation_ids
            )

        elif st in ('maintenance', 'm'):
            snap_items = snap.get('items')
            items = _items_for_ticket(snap_items if snap_items is not None else []) if snap_items is not None else []
            if not items and snap_items:
                logger.warning(f"Maintenance ticket for order {order_id}: snapshot had {len(snap_items)} items but _items_for_ticket produced 0 — item_id mismatch? snap_items={snap_items}")
            
            for item in items:
                if item.get('direction') == 'send':
                    res_id = stock_manager.reserve_stock(item['item_id'], item['quantity'], None, user_id)
                    reservation_ids.append(res_id)

            ticket_id = service_manager.create_maintenance_ticket(
                customer_id=None,
                user_id=user_id,
                notes=customer_params['notes'],
                priority='normal',
                original_tracking=customer_params['original_tracking'],
                reason=customer_params['reason'],
                cost_adjustment=customer_params['cost_adjustment'],
                name=customer_params['name'],
                phone=customer_params['phone'],
                phone_secondary=customer_params['phone_secondary'],
                city=customer_params['city'],
                governorate=customer_params['governorate'],
                address_details=customer_params['address_details'],
                items=items,
                initial_status='CONFIRMED',
                source='call_center',
                approved_by=user_id,
                approved_at=approved_at_now,
                new_tracking_send=new_tracking_send,
                new_tracking_receive=new_tracking_receive,
                reservation_ids=reservation_ids
            )

        elif st in ('return', 't'):
            snap_items = snap.get('items')
            items = _items_for_ticket(snap_items if snap_items is not None else []) if snap_items is not None else []
            if not items and snap_items:
                logger.warning(f"Return ticket for order {order_id}: snapshot had {len(snap_items)} items but _items_for_ticket produced 0 — item_id mismatch? snap_items={snap_items}")
            ticket_id = service_manager.create_return_ticket(
                customer_id=None,
                user_id=user_id,
                notes=customer_params['notes'],
                priority='normal',
                original_tracking=customer_params['original_tracking'],
                reason=customer_params['reason'],
                cost_adjustment=customer_params['cost_adjustment'],
                name=customer_params['name'],
                phone=customer_params['phone'],
                phone_secondary=customer_params['phone_secondary'],
                city=customer_params['city'],
                governorate=customer_params['governorate'],
                address_details=customer_params['address_details'],
                items=items,
                initial_status='CONFIRMED',
                source='call_center',
                approved_by=user_id,
                approved_at=approved_at_now,
                new_tracking_send=new_tracking_send,
                new_tracking_receive=new_tracking_receive
            )
        else:
            if str(service_type).lower().strip() == 'ask':
                logger.warning(
                    'Leader approve order %s: resolved service_type=ask (snap.call_type=%r order.service_type=%r req keys=%s)',
                    order_id,
                    (snap or {}).get('call_type'),
                    order.get('service_type'),
                    list((req_data or {}).keys()),
                )
                return _err(
                    'CALL_TYPE_REQUIRED',
                    'Cannot approve as «استفسار» — send call_type (sell / replacement / maintenance / return) in the JSON body, or confirm the order as a service type first.',
                    400,
                )
            return _err('SERVICE_TYPE_NOT_SUPPORTED', f'Leader approve for {service_type} not yet implemented', 501)
    except service_manager.ServiceManagerException as e:
        return _err('TICKET_CREATE_FAILED', str(e), 400)
    except Exception as e:
        logger.error(f"Failed to create ticket: {e}")
        return _err('TICKET_CREATE_FAILED', 'حدث خطأ غير متوقع', 500)

    execute_update(
        "UPDATE service_tickets SET created_from_order_id = %s WHERE id = %s",
        (order_id, ticket_id)
    )
    ticket = ticket_model.get_ticket_by_id(ticket_id)
    ticket_number = ticket.get('ticket_number', f'HVS-{ticket_id}')

    order_model.update_order(order_id, {
        'status': 'converted',
        'converted_to_ticket_id': ticket_id,
        'approved_by': user_id,
        'approved_at': datetime.utcnow(),
    })

    return jsonify({
        "success": True,
        "ticket_id": ticket_id,
        "ticket_number": ticket_number,
        "order_status": "converted"
    }), 200


@call_center_api_blueprint.route('/orders/<int:order_id>/reject', methods=['POST'])
@require_auth
def leader_reject(order_id):
    """POST reject: return order to agent (status=new). Body: { rejection_reason? }."""
    order = order_model.get_order_by_id(order_id)
    if not order:
        return _err('ORDER_NOT_FOUND', f'No order with id {order_id}', 404)
    if order.get('converted_to_ticket_id'):
        return _err('ORDER_ALREADY_CONVERTED', 'Order already has a ticket', 400)

    order_model.update_order(order_id, {'status': 'new'})
    execute_update("UPDATE orders SET confirmation_snapshot = NULL WHERE id = %s", (order_id,))
    return jsonify({"success": True, "order_status": "new"}), 200


@call_center_api_blueprint.route('/orders/<int:order_id>/request-info', methods=['POST'])
@require_auth
def leader_request_info(order_id):
    """POST request-info: set status=new (order returns to agent queue), store leader message in snapshot."""
    order = order_model.get_order_by_id(order_id)
    if not order:
        return _err('ORDER_NOT_FOUND', f'No order with id {order_id}', 404)
    if order.get('converted_to_ticket_id'):
        return _err('ORDER_ALREADY_CONVERTED', 'Order already has a ticket', 400)

    data = request.get_json() or {}
    message = data.get('message', '')

    snap = order.get('confirmation_snapshot')
    if isinstance(snap, str):
        snap = json.loads(snap) if snap else {}
    snap = dict(snap or {})
    snap['info_request_message'] = message

    order_model.update_order(order_id, {'status': 'new', 'confirmation_snapshot': snap})
    return jsonify({"success": True, "order_status": "new"}), 200


# --- Schedule ---
@call_center_api_blueprint.route('/orders/<int:order_id>/schedule', methods=['POST'])
@require_auth
def schedule_order(order_id):
    """POST schedule: create call, update order."""
    order = order_model.get_order_by_id(order_id)
    if not order:
        return _err('ORDER_NOT_FOUND', f'No order with id {order_id}', 404)
    reactivating_from_canceled = _is_canceled_order(order)

    data = request.get_json() or {}
    call_type = data.get('call_type', 'sell')
    if call_type not in CALL_TYPES:
        return _err('INVALID_CALL_TYPE', f'call_type must be one of: {sorted(CALL_TYPES)}', 400)
    callback_at = data.get('callback_at')
    if not callback_at:
        return _err('MISSING_REQUIRED_FIELDS', 'callback_at required', 400)
    try:
        cb_dt = datetime.fromisoformat(callback_at.replace('Z', '+00:00')) if 'T' in str(callback_at) else datetime.strptime(str(callback_at), '%Y-%m-%d %H:%M:%S')
    except Exception:
        return _err('INVALID_CALLBACK_AT', 'callback_at must be ISO datetime', 400)

    agent_id = _safe_agent_id(data)
    agent_name = _resolve_agent_name(agent_id, data.get('agent_name'))
    call_id = call_model.create_call({
        'linked_to_order_id': order_id,
        'call_type': call_type,
        'status': 'scheduled',
        'attempt_number': (order.get('attempt_count') or 0) + 1,
        'agent_id': agent_id,
        'agent_name': agent_name,
        'customer_phone': order.get('customer_phone'),
        'scheduled_callback_at': cb_dt,
        'next_action_at': cb_dt,
        'notes': data.get('notes'),
    })

    schedule_update = {
        'status': 'scheduled',
        'service_type': call_type,
        'scheduled_callback_at': cb_dt,
        'next_action_at': cb_dt,
        'attempt_count': (order.get('attempt_count') or 0) + 1,
        'last_attempt_at': datetime.utcnow(),
    }
    if reactivating_from_canceled:
        schedule_update['cancellation_reason'] = None
    order_model.update_order(order_id, schedule_update)

    return jsonify({"success": True, "call_id": call_id, "order_status": "scheduled"}), 200


# --- No-answer ---
@call_center_api_blueprint.route('/orders/<int:order_id>/no-answer', methods=['POST'])
@require_auth
def no_answer_order(order_id):
    """POST no-answer: create call, increment attempt. Status unchanged — 3+ attempts stay in queue until agent acts."""
    order = order_model.get_order_by_id(order_id)
    if not order:
        return _err('ORDER_NOT_FOUND', f'No order with id {order_id}', 404)
    reactivating_from_canceled = _is_canceled_order(order)

    data = request.get_json() or {}
    call_type = data.get('call_type', 'sell')
    if call_type not in CALL_TYPES:
        return _err('INVALID_CALL_TYPE', f'call_type must be one of: {sorted(CALL_TYPES)}', 400)

    attempt = (order.get('attempt_count') or 0) + 1
    next_at = datetime.utcnow() + timedelta(hours=4)
    # Canceled → treat as back in queue (new). Otherwise keep status (e.g. new, scheduled).
    new_status = 'new' if reactivating_from_canceled else order.get('status')

    agent_id = _safe_agent_id(data)
    agent_name = _resolve_agent_name(agent_id, data.get('agent_name'))
    call_id = call_model.create_call({
        'linked_to_order_id': order_id,
        'call_type': call_type,
        'status': 'no_answer',
        'attempt_number': attempt,
        'agent_id': agent_id,
        'agent_name': agent_name,
        'customer_phone': order.get('customer_phone'),
        'next_action_at': next_at,
        'notes': data.get('notes'),
    })

    no_answer_update = {
        'status': new_status,
        'service_type': call_type,
        'attempt_count': attempt,
        'next_action_at': next_at,
        'last_attempt_at': datetime.utcnow(),
    }
    if reactivating_from_canceled:
        no_answer_update['cancellation_reason'] = None
    order_model.update_order(order_id, no_answer_update)

    return jsonify({"success": True, "call_id": call_id, "order_status": new_status, "attempt_count": attempt}), 200


# --- Cancel ---
@call_center_api_blueprint.route('/orders/<int:order_id>/cancel', methods=['POST'])
@require_auth
def cancel_order(order_id):
    """POST cancel: create call, update order."""
    order = order_model.get_order_by_id(order_id)
    if not order:
        return _err('ORDER_NOT_FOUND', f'No order with id {order_id}', 404)
    if _canonical_order_status(order.get('status')) == 'canceled':
        return _err('ORDER_CANCELED', 'Order already canceled', 400)

    data = request.get_json() or {}
    call_type = data.get('call_type', 'sell')
    if call_type not in CALL_TYPES:
        return _err('INVALID_CALL_TYPE', f'call_type must be one of: {sorted(CALL_TYPES)}', 400)

    agent_id = _safe_agent_id(data)
    agent_name = _resolve_agent_name(agent_id, data.get('agent_name'))
    call_id = call_model.create_call({
        'linked_to_order_id': order_id,
        'call_type': call_type,
        'status': 'canceled',
        'attempt_number': (order.get('attempt_count') or 0) + 1,
        'agent_id': agent_id,
        'agent_name': agent_name,
        'customer_phone': order.get('customer_phone'),
        'cancellation_reason': data.get('cancellation_reason'),
        'notes': data.get('notes'),
    })

    order_model.update_order(order_id, {
        'status': 'canceled',
        'service_type': call_type,
        'cancellation_reason': data.get('cancellation_reason'),
    })

    return jsonify({"success": True, "call_id": call_id, "order_status": "canceled"}), 200


# --- List ask-only calls ---
@call_center_api_blueprint.route('/calls', methods=['GET'])
@require_auth
def list_calls():
    """GET /api/call-center/calls — list calls. Params: call_type=ask, date_from, date_to, customer_phone, customer_id."""
    call_type = request.args.get('call_type')
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')
    phone = request.args.get('customer_phone')
    customer_id = request.args.get('customer_id', type=int)
    limit = min(int(request.args.get('limit', 100)), 200)

    if phone or customer_id:
        rows = call_model.get_calls_for_customer(
            customer_id=customer_id, phone=phone, limit=limit
        )
    elif call_type == 'ask':
        rows = call_model.list_ask_calls(date_from=date_from, date_to=date_to, limit=limit)
    else:
        return _err(
            'INVALID_PARAMS',
            'call_type=ask or customer_phone or customer_id required',
            400,
        )

    for r in rows:
        for k in list(r.keys()):
            v = r[k]
            if hasattr(v, 'isoformat'):
                r[k] = v.isoformat()
            elif k == 'cod_amount' and isinstance(v, (int, float)):
                r[k] = float(v)
    return jsonify({"calls": rows}), 200


# --- Ask-only (no order) ---
@call_center_api_blueprint.route('/calls/ask-only', methods=['POST'])
@require_auth
def ask_only():
    """POST ask-only: create call with no order/ticket link."""
    data = request.get_json() or {}
    call_type = data.get('call_type', 'ask')
    if call_type != 'ask':
        return _err('INVALID_CALL_TYPE', 'call_type must be "ask" for ask-only', 400)

    phone = data.get('customer_phone')
    if not phone:
        return _err('MISSING_REQUIRED_FIELDS', 'customer_phone required', 400)

    agent_id = _safe_agent_id(data)
    agent_name = _resolve_agent_name(agent_id, data.get('agent_name'))
    call_id = call_model.create_call({
        'linked_to_order_id': None,
        'linked_to_ticket_id': None,
        'call_type': 'ask',
        'status': 'completed',  # مكتملة — ask has no ticket, so completed not confirmed
        'agent_id': agent_id,
        'agent_name': agent_name,
        'customer_phone': phone,
        'notes': data.get('notes'),
    })

    return jsonify({"success": True, "call_id": call_id}), 201
