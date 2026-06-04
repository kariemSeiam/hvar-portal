#!/usr/bin/env python3
"""
Fetch ERP drafts vs DB orders for a given date. Compare what exists where.
Usage:
  python scripts/fetch_erp_vs_db_comparison.py -u USER -p PASS --date 2026-02-27
  python scripts/fetch_erp_vs_db_comparison.py --date 2026-02-27  # uses ERP_DEFAULT_* from env
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
from app.api.call_center_api import _build_erp_draft_params, _erp_row_to_order
from app.models import order as order_model


def main():
    parser = argparse.ArgumentParser(description='ERP vs DB comparison for a date')
    parser.add_argument('-u', '--username', help='ERP username')
    parser.add_argument('-p', '--password', help='ERP password')
    parser.add_argument('--date', default='2026-02-27', help='YYYY-MM-DD')
    parser.add_argument('--json', action='store_true', help='Output JSON')
    args = parser.parse_args()

    username = args.username or os.environ.get('ERP_DEFAULT_USERNAME')
    password = args.password or os.environ.get('ERP_DEFAULT_PASSWORD')
    if not username or not password:
        print('Error: username and password required (or set ERP_DEFAULT_USERNAME, ERP_DEFAULT_PASSWORD)')
        sys.exit(1)

    date_str = args.date[:10]
    start_date = end_date = date_str

    # 1. Fetch ERP drafts
    try:
        erp_auth = ERPAuth(username, password)
        params = _build_erp_draft_params(start_date, end_date)
        url = f'{ERP_BASE_URL}/sells/draft-dt'
        resp = erp_auth.fetch_with_auth(url, params)
        if resp.status_code != 200:
            print(f'ERP error: {resp.status_code}')
            sys.exit(1)
        j = resp.json()
        erp_rows = j.get('data') or j.get('aaData') or []
    except Exception as e:
        print(f'ERP fetch failed: {e}')
        sys.exit(1)

    COLUMN_KEYS = [
        'action', 'transaction_date', 'invoice_no', 'contact_name', 'mobile',
        'whatsapp', 'business_location', 'total_items', 'added_by', 'commission_agent',
        'shipping_state', 'shipping_city', 'shipping_address', 'shipping_details', 'coupon_code'
    ]

    erp_invoices = set()
    erp_by_invoice = {}
    for row in erp_rows:
        if isinstance(row, list):
            row = dict(zip(COLUMN_KEYS, row[:15] if len(row) >= 15 else row + [None] * 15))
        inv = row.get('invoice_no') or row.get('invoice_number')
        if inv:
            erp_invoices.add(str(inv))
            erp_by_invoice[str(inv)] = {
                'invoice_no': inv,
                'mobile': row.get('mobile'),
                'contact_name_text': row.get('contact_name_text') or row.get('contact_name'),
                'transaction_date': row.get('transaction_date'),
                'shipping_state': row.get('shipping_state'),
                'shipping_city': row.get('shipping_city'),
            }

    # 2. DB orders for that date (created_at on date)
    from app import create_app
    app = create_app(os.getenv('FLASK_ENV', 'production'))
    with app.app_context():
        date_from = f'{date_str} 00:00:00'
        date_to = f'{date_str} 23:59:59'
        db_orders = order_model.list_orders(
            limit=500, offset=0,
            date_from=date_from, date_to=date_to, today=date_str
        )
        db_invoices = set()
        db_by_invoice = {}
        for o in db_orders:
            inv = o.get('erp_order_id')
            if inv:
                db_invoices.add(str(inv))
                db_by_invoice[str(inv)] = {
                    'id': o.get('id'),
                    'erp_order_id': inv,
                    'customer_phone': o.get('customer_phone'),
                    'customer_name': o.get('customer_name'),
                    'status': o.get('status'),
                    'created_at': str(o.get('created_at')) if o.get('created_at') else None,
                }

    # 3. Compare
    in_erp_not_db = erp_invoices - db_invoices
    in_db_not_erp = db_invoices - erp_invoices
    in_both = erp_invoices & db_invoices

    out = {
        'date': date_str,
        'erp': {'total': len(erp_invoices), 'invoices': sorted(erp_invoices)},
        'db': {'total': len(db_invoices), 'invoices': sorted(db_invoices)},
        'in_erp_not_db': sorted(in_erp_not_db),
        'in_db_not_erp': sorted(in_db_not_erp),
        'in_both': sorted(in_both),
        'counts': {
            'erp_total': len(erp_invoices),
            'db_total': len(db_invoices),
            'in_both': len(in_both),
            'erp_only': len(in_erp_not_db),
            'db_only': len(in_db_not_erp),
        },
    }

    if args.json:
        print(json.dumps(out, ensure_ascii=False, indent=2))
    else:
        print(f'Date: {date_str}')
        print(f'ERP drafts: {len(erp_invoices)}')
        print(f'DB orders:  {len(db_invoices)}')
        print(f'In both:    {len(in_both)}')
        print(f'ERP only (not in DB): {len(in_erp_not_db)}')
        print(f'DB only (not in ERP): {len(in_db_not_erp)}')
        if in_erp_not_db:
            print('\nIn ERP, not in DB:', ', '.join(sorted(in_erp_not_db)[:20]), '...' if len(in_erp_not_db) > 20 else '')
        if in_db_not_erp:
            print('\nIn DB, not in ERP:', ', '.join(sorted(in_db_not_erp)[:20]), '...' if len(in_db_not_erp) > 20 else '')


if __name__ == '__main__':
    main()
