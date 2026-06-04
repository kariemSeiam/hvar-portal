#!/usr/bin/env python3
"""
Full ERP vs DB comparison — same date range as sync. Diagnose "غير موجود في ERP".
Usage:
  python scripts/erp_vs_db_full_comparison.py
  python scripts/erp_vs_db_full_comparison.py --start 2026-01-01 --end 2026-12-31
  python scripts/erp_vs_db_full_comparison.py --json
"""
import argparse
import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
os.chdir(ROOT)

from app.api.erp_api import ERPAuth, ERP_BASE_URL
from app.api.call_center_api import _build_erp_draft_params, _erp_row_to_order, _dedupe_erp_rows_by_order
from app.models import order as order_model
from app.utils.db import execute_query

COLUMN_KEYS = [
    'action', 'transaction_date', 'invoice_no', 'contact_name', 'mobile',
    'whatsapp', 'business_location', 'total_items', 'added_by', 'commission_agent',
    'shipping_state', 'shipping_city', 'shipping_address', 'shipping_details', 'coupon_code'
]


def fetch_all_erp_orders(username, password, start_date, end_date):
    """Fetch all ERP drafts with pagination (same as sync worker)."""
    erp_auth = ERPAuth(username, password)
    url = f'{ERP_BASE_URL}/sells/draft-dt'
    all_rows = []
    page_size = 500
    start = 0
    while True:
        params = _build_erp_draft_params(start_date, end_date, start=start, length=page_size)
        resp = erp_auth.fetch_with_auth(url, params)
        if resp.status_code != 200:
            raise RuntimeError(f'ERP API returned {resp.status_code}')
        j = resp.json()
        page_rows = j.get('data') or j.get('aaData') or []
        all_rows.extend(page_rows)
        if len(page_rows) < page_size:
            break
        start += page_size
    return _dedupe_erp_rows_by_order(all_rows)


def extract_erp_order_id(row):
    """Extract erp_order_id from row (list or dict)."""
    if isinstance(row, list):
        row = dict(zip(COLUMN_KEYS, row[:15] if len(row) >= 15 else row + [None] * 15))
    inv = row.get('invoice_no') or row.get('invoice_number')
    if not inv:
        return None
    inv_str = str(inv).strip()
    import re
    inv_norm = re.sub(r'-\d+$', '', inv_str) if inv_str else None
    return inv_norm


def main():
    parser = argparse.ArgumentParser(description='Full ERP vs DB comparison (sync date range)')
    parser.add_argument('-u', '--username', help='ERP username')
    parser.add_argument('-p', '--password', help='ERP password')
    parser.add_argument('--start', default='2026-01-01', help='Start date YYYY-MM-DD')
    parser.add_argument('--end', default='2026-12-31', help='End date YYYY-MM-DD')
    parser.add_argument('--json', action='store_true', help='Output JSON')
    args = parser.parse_args()

    username = args.username or os.environ.get('ERP_DEFAULT_USERNAME')
    password = args.password or os.environ.get('ERP_DEFAULT_PASSWORD')
    if not username or not password:
        print('Error: set ERP_DEFAULT_USERNAME, ERP_DEFAULT_PASSWORD or use -u -p')
        sys.exit(1)

    start_date = args.start[:10]
    end_date = args.end[:10]

    # 1. Fetch all ERP orders (paginated)
    print('Fetching ERP drafts...', file=sys.stderr)
    try:
        erp_rows = fetch_all_erp_orders(username, password, start_date, end_date)
    except Exception as e:
        print(f'ERP fetch failed: {e}', file=sys.stderr)
        sys.exit(1)

    erp_order_ids = set()
    for row in erp_rows:
        oid = extract_erp_order_id(row)
        if oid:
            erp_order_ids.add(oid)

    # 2. Fetch all DB orders with source='erp'
    from app import create_app
    app = create_app(os.getenv('FLASK_ENV', 'production'))
    with app.app_context():
        sql = """
            SELECT id, erp_order_id, customer_phone, customer_name, status, in_erp, source, created_at
            FROM orders
            WHERE source = 'erp'
        """
        db_orders = execute_query(sql, ())

    db_order_ids = set()
    db_by_id = {}
    for o in db_orders:
        oid = o.get('erp_order_id')
        if oid:
            oid_str = str(oid).strip()
            db_order_ids.add(oid_str)
            db_by_id[oid_str] = o

    # 3. Compare
    in_erp_not_db = erp_order_ids - db_order_ids
    in_db_not_erp = db_order_ids - erp_order_ids
    in_both = erp_order_ids & db_order_ids

    # 4. in_erp flag breakdown for in_db_not_erp
    in_db_not_erp_with_in_erp_1 = [oid for oid in in_db_not_erp if db_by_id.get(oid, {}).get('in_erp') == 1]
    in_db_not_erp_with_in_erp_0 = [oid for oid in in_db_not_erp if db_by_id.get(oid, {}).get('in_erp') == 0]

    out = {
        'date_range': f'{start_date} to {end_date}',
        'erp_total': len(erp_order_ids),
        'db_total': len(db_order_ids),
        'in_both': len(in_both),
        'in_erp_not_db': len(in_erp_not_db),
        'in_db_not_erp': len(in_db_not_erp),
        'in_db_not_erp_with_in_erp_1': len(in_db_not_erp_with_in_erp_1),
        'in_db_not_erp_with_in_erp_0': len(in_db_not_erp_with_in_erp_0),
        'in_erp_not_db_sample': sorted(in_erp_not_db)[:30],
        'in_db_not_erp_sample': sorted(in_db_not_erp)[:30],
    }

    if args.json:
        print(json.dumps(out, ensure_ascii=False, indent=2))
    else:
        print(f'\n=== ERP vs DB Full Comparison ({start_date} to {end_date}) ===\n')
        print(f'ERP drafts:     {out["erp_total"]}')
        print(f'DB orders:      {out["db_total"]}')
        print(f'In both:        {out["in_both"]}')
        print(f'ERP only:       {out["in_erp_not_db"]} (in ERP, not synced to DB)')
        print(f'DB only:        {out["in_db_not_erp"]} (in DB, not in ERP -> "ghayr mawjood fi ERP")')
        print(f'  - of those, in_erp=1: {out["in_db_not_erp_with_in_erp_1"]} (BUG: should be 0)')
        print(f'  - of those, in_erp=0: {out["in_db_not_erp_with_in_erp_0"]} (correct)')
        if in_erp_not_db:
            print(f'\nERP-only sample: {", ".join(sorted(in_erp_not_db)[:15])}...')
        if in_db_not_erp:
            print(f'DB-only sample:  {", ".join(sorted(in_db_not_erp)[:15])}...')


if __name__ == '__main__':
    main()
