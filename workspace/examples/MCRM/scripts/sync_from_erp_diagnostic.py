#!/usr/bin/env python3
# scripts/sync_from_erp_diagnostic.py
"""Diagnostic script for sync-from-erp: full cycle with per-row skip reasons and recommendations."""

import argparse
import json
import os
import sys
from datetime import datetime
from pathlib import Path

# Project root
ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
os.chdir(ROOT)

# After path setup, import app deps
from app.api.erp_api import ERPAuth, ERP_BASE_URL
from app.api.call_center_api import (
    _build_erp_draft_params,
    _erp_row_to_order,
)
from app.models import order as order_model


def _get_db_config():
    """Load DB config from .env."""
    config = {}
    env_path = ROOT / '.env'
    if env_path.exists():
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    k, v = line.split('=', 1)
                    config[k.strip()] = v.strip().strip('"\'')
    config.setdefault('DATABASE_HOST', '127.0.0.1')
    config.setdefault('DATABASE_PORT', '3306')
    config.setdefault('DATABASE_USER', 'mcrm_hvar_user')
    config.setdefault('DATABASE_PASSWORD', '1618')
    config.setdefault('DATABASE_NAME', 'mcrm_hvar_hub')
    return config


def _order_exists(erp_order_id):
    """Check if order exists (uses app context via order_model)."""
    return order_model.get_order_by_erp_order_id(erp_order_id) is not None


def run_diagnostic(username, password, start_date, end_date, dry_run=True):
    """Run full sync cycle and return per-row results + summary."""
    from app import create_app
    app = create_app(os.getenv('FLASK_ENV', 'production'))

    COLUMN_KEYS = [
        'action', 'transaction_date', 'invoice_no', 'contact_name', 'mobile',
        'whatsapp', 'business_location', 'total_items', 'added_by', 'commission_agent',
        'shipping_state', 'shipping_city', 'shipping_address', 'shipping_details', 'coupon_code'
    ]

    results = {
        'meta': {
            'start_date': start_date,
            'end_date': end_date,
            'dry_run': dry_run,
            'ran_at': datetime.utcnow().isoformat() + 'Z',
        },
        'summary': {'total': 0, 'created': 0, 'skipped': 0, 'by_reason': {}},
        'rows': [],
        'errors': [],
    }

    with app.app_context():
        try:
            erp_auth = ERPAuth(username, password)
            params = _build_erp_draft_params(start_date, end_date)
            url = f'{ERP_BASE_URL}/sells/draft-dt'
            resp = erp_auth.fetch_with_auth(url, params)
            if resp.status_code != 200:
                results['errors'].append(f'ERP returned {resp.status_code}')
                return results

            j = resp.json()
            rows_raw = j.get('data') or j.get('aaData') or []
        except Exception as e:
            results['errors'].append(str(e))
            return results

        results['summary']['total'] = len(rows_raw)

        for idx, row in enumerate(rows_raw):
            row_dict = row
            if isinstance(row, list):
                row_dict = dict(zip(COLUMN_KEYS, row[:15] if len(row) >= 15 else row + [None] * 15))

            order_data = _erp_row_to_order(row_dict)
            erp_order_id = order_data.get('erp_order_id')
            customer_phone = order_data.get('customer_phone')
            customer_name = order_data.get('customer_name') or ''

            rec = {
                'index': idx + 1,
                'erp_order_id': erp_order_id,
                'customer_phone': customer_phone,
                'customer_name': customer_name[:50] if customer_name else '',
                'raw_invoice': row_dict.get('invoice_no') or row_dict.get('invoice_number'),
                'raw_mobile': row_dict.get('mobile') or (row_dict.get('contacts') or {}).get('mobile') if isinstance(row_dict.get('contacts'), dict) else row_dict.get('contacts'),
                'outcome': None,
                'reason': None,
            }

            # 1. Missing phone or invoice
            if not customer_phone or not erp_order_id:
                missing = []
                if not customer_phone:
                    missing.append('customer_phone (from mobile/contacts)')
                if not erp_order_id:
                    missing.append('erp_order_id (from invoice_no)')
                rec['outcome'] = 'skipped'
                rec['reason'] = 'missing_required'
                rec['detail'] = f"Missing: {', '.join(missing)}"
                results['summary']['by_reason']['missing_required'] = results['summary']['by_reason'].get('missing_required', 0) + 1
                results['summary']['skipped'] += 1
                results['rows'].append(rec)
                continue

            # 2. Already exists
            if _order_exists(erp_order_id):
                rec['outcome'] = 'skipped'
                rec['reason'] = 'already_exists'
                rec['detail'] = 'Order with this erp_order_id already in orders table'
                results['summary']['by_reason']['already_exists'] = results['summary']['by_reason'].get('already_exists', 0) + 1
                results['summary']['skipped'] += 1
                results['rows'].append(rec)
                continue

            # 3. Would create / Create
            if dry_run:
                rec['outcome'] = 'would_create'
                rec['reason'] = 'ok'
                rec['detail'] = 'Would be created (dry run)'
                results['summary']['by_reason']['would_create'] = results['summary']['by_reason'].get('would_create', 0) + 1
                results['rows'].append(rec)
                continue

            try:
                order_model.create_order(order_data)
                rec['outcome'] = 'created'
                rec['reason'] = 'ok'
                rec['detail'] = 'Created successfully'
                results['summary']['created'] += 1
                results['rows'].append(rec)
            except Exception as e:
                rec['outcome'] = 'skipped'
                rec['reason'] = 'create_failed'
                rec['detail'] = str(e)
                results['summary']['by_reason']['create_failed'] = results['summary']['by_reason'].get('create_failed', 0) + 1
                results['summary']['skipped'] += 1
                results['rows'].append(rec)

    return results


def print_report(results, output_json=False):
    """Print human-readable or JSON report."""
    if output_json:
        print(json.dumps(results, indent=2, ensure_ascii=False))
        return

    meta = results.get('meta', {})
    summary = results.get('summary', {})
    rows = results.get('rows', [])
    errors = results.get('errors', [])

    print('=' * 70)
    print('SYNC-FROM-ERP DIAGNOSTIC REPORT')
    print('=' * 70)
    print(f"Date range: {meta.get('start_date')} to {meta.get('end_date')}")
    print(f"Ran at: {meta.get('ran_at')}")
    print(f"Dry run: {meta.get('dry_run')}")
    print()

    if errors:
        print('ERRORS:')
        for e in errors:
            print(f"  - {e}")
        print()
        return

    print('SUMMARY')
    print('-' * 40)
    print(f"Total rows from ERP: {summary.get('total', 0)}")
    print(f"Created: {summary.get('created', 0)}")
    print(f"Skipped: {summary.get('skipped', 0)}")
    print()
    print('Skip reasons:')
    for reason, count in sorted(summary.get('by_reason', {}).items()):
        print(f"  - {reason}: {count}")
    print()

    # Sample of skipped rows
    skipped = [r for r in rows if r.get('outcome') == 'skipped']
    would_create = [r for r in rows if r.get('outcome') == 'would_create']
    created = [r for r in rows if r.get('outcome') == 'created']

    if skipped:
        print('SAMPLE SKIPPED ROWS (first 15)')
        print('-' * 40)
        for r in skipped[:15]:
            print(f"  #{r['index']} erp_order_id={r.get('erp_order_id')} | phone={r.get('customer_phone')} | reason={r.get('reason')} | {r.get('detail', '')[:60]}")
        if len(skipped) > 15:
            print(f"  ... and {len(skipped) - 15} more")
        print()

    if would_create:
        print('WOULD CREATE (first 5)')
        print('-' * 40)
        for r in would_create[:5]:
            print(f"  #{r['index']} erp_order_id={r.get('erp_order_id')} | phone={r.get('customer_phone')}")
        if len(would_create) > 5:
            print(f"  ... and {len(would_create) - 5} more")
        print()

    if created:
        print('CREATED')
        print('-' * 40)
        for r in created:
            print(f"  #{r['index']} erp_order_id={r.get('erp_order_id')}")
        print()

    # Recommendations hint
    by_reason = summary.get('by_reason', {})
    if by_reason.get('missing_required') or by_reason.get('create_failed'):
        print('RECOMMENDATIONS')
        print('-' * 40)
        if by_reason.get('missing_required'):
            print('  - missing_required: Check ERP column mapping (invoice_no, mobile/contacts).')
        if by_reason.get('already_exists'):
            print('  - already_exists: Orders already in DB. Re-sync skips them. Expected.')
        if by_reason.get('create_failed'):
            print('  - create_failed: Check backend logs for DB/validation errors.')
        print()
        print('See docs/call-center/sync-from-erp-recommendations.md for full guidance.')
    print('=' * 70)


def main():
    parser = argparse.ArgumentParser(
        description='Run sync-from-erp diagnostic: full cycle with per-row skip reasons.'
    )
    parser.add_argument('--username', '-u', required=True, help='ERP username')
    parser.add_argument('--password', '-p', required=True, help='ERP password')
    parser.add_argument('--start-date', default='2026-01-01', help='Start date YYYY-MM-DD')
    parser.add_argument('--end-date', default='2026-12-31', help='End date YYYY-MM-DD')
    parser.add_argument('--execute', action='store_true', help='Actually create orders (default: dry run)')
    parser.add_argument('--json', action='store_true', help='Output JSON instead of human report')
    args = parser.parse_args()

    results = run_diagnostic(
        username=args.username,
        password=args.password,
        start_date=args.start_date,
        end_date=args.end_date,
        dry_run=not args.execute,
    )
    print_report(results, output_json=args.json)


if __name__ == '__main__':
    main()
