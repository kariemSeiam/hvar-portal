#!/usr/bin/env python3
"""
Full analysis: ALL ERP drafts + ALL stock items.
Extracts real patterns for adaptive order_description → items matching.
Output: .venom/work/ERP-AND-STOCK-FULL-ANALYSIS.md
"""
import os
import sys
import re
from pathlib import Path
from collections import defaultdict

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
os.chdir(ROOT)

from app import create_app
from app.api.erp_api import ERPAuth, ERP_BASE_URL
from app.api.call_center_api import _build_erp_draft_params
from app.models import stock as stock_model


def extract_skus_from_text(text):
    """Extract all SKU-like tokens from shipping_details. Adaptive: (X), (X+Y), (X+b), etc."""
    if not text or not isinstance(text, str):
        return []
    # Match (anything) - SKU can be 5070, 5070+04, 5070+b, 10011, etc.
    matches = re.findall(r'\(([^)]+)\)', text)
    return [m.strip() for m in matches if m.strip()]


def extract_items_patterns(text):
    """
    Parse order_description into item-like chunks. Returns list of {qty, name, sku}.
    Handles: "1 * name (sku)", "name *1", multi-item same line.
    """
    if not text or not isinstance(text, str):
        return []
    text = text.strip()
    items = []

    # Split by common multi-item separators
    parts = re.split(r'\s*\|\s*|\s{2,}|\n+', text)
    for part in parts:
        part = part.strip()
        if not part:
            continue

        # Pattern 1: "Qty * Name (SKU)" - SKU can be alphanumeric
        m1 = re.search(r'(\d+)\s*\*\s*(.+?)\s*\(([^)]+)\)', part)
        if m1:
            items.append({'qty': int(m1.group(1)), 'name': m1.group(2).strip(), 'sku': m1.group(3).strip()})
            continue

        # Pattern 2: "Name (SKU) * Qty" or "Name * Qty" at end
        m2 = re.search(r'(.+?)\s*\(([^)]+)\)\s*\*\s*(\d+)', part)
        if m2:
            items.append({'qty': int(m2.group(3)), 'name': m2.group(1).strip(), 'sku': m2.group(2).strip()})
            continue

        # Pattern 3: "Name * Qty" (no SKU)
        m3 = re.search(r'(.+?)\s*\*\s*(\d+)\s*$', part)
        if m3:
            items.append({'qty': int(m3.group(2)), 'name': m3.group(1).strip(), 'sku': None})
            continue

        # Pattern 4: "Qty * Name" (no SKU) - greedy to end
        m4 = re.search(r'^(\d+)\s*\*\s*(.+)$', part)
        if m4:
            items.append({'qty': int(m4.group(1)), 'name': m4.group(2).strip(), 'sku': None})
            continue

        # Fallback: whole part as single item if has (sku)
        skus = extract_skus_from_text(part)
        if skus:
            # Try to get qty from start
            qm = re.match(r'^(\d+)\s*\*\s*', part)
            qty = int(qm.group(1)) if qm else 1
            name = re.sub(r'^\d+\s*\*\s*', '', part)
            name = re.sub(r'\s*\([^)]+\)\s*$', '', name).strip()
            for sku in skus:
                items.append({'qty': qty, 'name': name or part[:50], 'sku': sku})

    return items


def main():
    username = os.environ.get('ERP_DEFAULT_USERNAME') or 'kariemseiam'
    password = os.environ.get('ERP_DEFAULT_PASSWORD') or '123123'

    out = []
    out.append('# ERP + Stock Full Analysis — Adaptive order_description → Items')
    out.append('')
    out.append('> Generated from live ERP draft-dt + DB stock_items. Adaptive patterns.')
    out.append('')

    # --- 1. Fetch ALL ERP drafts ---
    erp_auth = ERPAuth(username, password)
    params = _build_erp_draft_params('2026-01-01', '2026-12-31')
    params['length'] = '500'  # Max drafts
    try:
        resp = erp_auth.fetch_with_auth(f'{ERP_BASE_URL}/sells/draft-dt', params)
        if resp.status_code != 200:
            out.append(f'## ERP Error: {resp.status_code}')
            out.append('')
        else:
            j = resp.json()
            rows = j.get('data') or j.get('aaData') or []
            total_erp = len(rows)

            out.append('## 1. ERP Drafts Summary')
            out.append('')
            out.append(f'- **Total drafts fetched:** {total_erp}')
            out.append('')

            # Extract all shipping_details
            all_details = []
            all_skus_erp = set()
            all_parsed = []
            pattern_counts = defaultdict(int)

            for row in rows:
                if isinstance(row, list):
                    row = dict(zip(
                        ['action', 'transaction_date', 'invoice_no', 'contact_name', 'mobile',
                         'whatsapp', 'business_location', 'total_items', 'added_by', 'commission_agent',
                         'shipping_state', 'shipping_city', 'shipping_address', 'shipping_details', 'coupon_code'],
                        row[:15] if len(row) >= 15 else row + [None] * 15
                    ))
                sd = (row.get('shipping_details') or row.get('order_description') or '').strip()
                if sd:
                    all_details.append(sd)
                    skus = extract_skus_from_text(sd)
                    all_skus_erp.update(skus)
                    parsed = extract_items_patterns(sd)
                    all_parsed.extend(parsed)
                    for p in parsed:
                        key = 'with_sku' if p['sku'] else 'no_sku'
                        pattern_counts[key] += 1

            out.append('### 1.1 Unique shipping_details (order_description) samples')
            out.append('')
            unique_details = list(dict.fromkeys(all_details))[:80]
            for i, d in enumerate(unique_details[:30]):
                out.append(f'{i+1}. `{d[:120]}{"..." if len(d) > 120 else ""}`')
            out.append('')
            out.append(f'... and {len(unique_details) - 30} more unique (total {len(unique_details)} shown).')
            out.append('')

            out.append('### 1.2 All SKUs found in ERP (from parentheses)')
            out.append('')
            out.append('| SKU | Count in drafts |')
            out.append('|-----|-----------------|')
            sku_counts = defaultdict(int)
            for sd in all_details:
                for sku in extract_skus_from_text(sd):
                    sku_counts[sku] += 1
            for sku in sorted(sku_counts.keys(), key=lambda x: (-sku_counts[x], x)):
                out.append(f'| {sku} | {sku_counts[sku]} |')
            out.append('')

            out.append('### 1.3 Parse pattern coverage (extract_items_patterns)')
            out.append('')
            out.append('| Pattern | Count |')
            out.append('|---------|-------|')
            for k, v in sorted(pattern_counts.items()):
                out.append(f'| {k} | {v} |')
            out.append('')

    except Exception as e:
        out.append(f'## ERP Error: {e}')
        out.append('')
        all_skus_erp = set()
        sku_counts = {}

    # --- 2. Fetch ALL stock items ---
    out.append('## 2. Stock Items Summary')
    out.append('')
    app = create_app()
    try:
        with app.app_context():
            products = stock_model.get_stock_items_by_type(item_type='product', active_only=True)
            parts = stock_model.get_stock_items_by_type(item_type='part', active_only=True)
            all_stock = products + parts
            all_stock_skus = {str(s.get('sku')): s for s in all_stock if s.get('sku')}

        out.append(f'- **Products:** {len(products)}')
        out.append(f'- **Parts:** {len(parts)}')
        out.append(f'- **Total active:** {len(all_stock)}')
        out.append('')

        out.append('### 2.1 Stock SKUs (products)')
        out.append('')
        out.append('| SKU | Name | Type |')
        out.append('|-----|------|------|')
        for s in products[:60]:
            sku = s.get('sku') or ''
            name = (s.get('name') or '')[:50]
            out.append(f'| {sku} | {name} | product |')
        if len(products) > 60:
            out.append(f'| ... | ... | ... ({len(products)} total) |')
        out.append('')

        out.append('### 2.2 Stock SKUs (parts)')
        out.append('')
        out.append('| SKU | Name | Type |')
        out.append('|-----|------|------|')
        for s in parts[:40]:
            sku = s.get('sku') or ''
            name = (s.get('name') or '')[:50]
            out.append(f'| {sku} | {name} | part |')
        if len(parts) > 40:
            out.append(f'| ... | ... | ... ({len(parts)} total) |')
        out.append('')

        # --- 3. Match analysis ---
        out.append('## 3. ERP → Stock Match Analysis')
        out.append('')
        all_skus_erp = all_skus_erp  # from ERP block
        if all_skus_erp:
            exact_match = []
            no_match = []
            for sku in all_skus_erp:
                if sku in all_stock_skus:
                    exact_match.append(sku)
                else:
                    norm = sku.replace('+', '').replace(' ', '').lower()
                    found = False
                    for stock_sku in all_stock_skus:
                        if stock_sku.replace('+', '').replace(' ', '').lower() == norm:
                            exact_match.append(f'{sku} → {stock_sku}')
                            found = True
                            break
                    if not found:
                        no_match.append(sku)

            out.append('### 3.1 ERP SKUs with exact stock match')
            out.append('')
            out.append(', '.join(sorted(exact_match)) or 'None')
            out.append('')

            out.append('### 3.2 ERP SKUs with NO stock match')
            out.append('')
            out.append(', '.join(sorted(no_match)) or 'None')
            out.append('')

            out.append('### 3.3 SKU normalization suggestions')
            out.append('')
            out.append('| ERP SKU | Try stock as |')
            out.append('|---------|--------------|')
            for sku in sorted(no_match)[:30]:
                variants = [sku, sku.replace('+', ''), sku.replace('+', ' '), sku.replace('+b', 'B').replace('+04', '04')]
                out.append(f'| {sku} | {", ".join(variants)} |')
            out.append('')

    except Exception as e:
        out.append(f'## Stock Error: {e}')
        out.append('')

    # --- 4. Adaptive parse rules (extracted from real data) ---
    out.append('## 4. Adaptive Parse Rules (from real data)')
    out.append('')
    out.append('```')
    out.append('1. SKU pattern: \\(([^)]+)\\)  # capture any chars in parens')
    out.append('2. Item pattern: (\\d+)\\s*\\*\\s*(.+?)\\s*\\(([^)]+)\\)  # qty * name (sku)')
    out.append('3. Reversed: (.+?)\\s*\\(([^)]+)\\)\\s*\\*\\s*(\\d+)  # name (sku) * qty')
    out.append('4. No SKU: (.+?)\\s*\\*\\s*(\\d+)\\s*$  # name * qty')
    out.append('5. Multi-item split: \\s*\\|\\s*|\\s{2,}|\\n+')
    out.append('```')
    out.append('')

    md_path = ROOT / '.venom' / 'work' / 'ERP-AND-STOCK-FULL-ANALYSIS.md'
    md_path.parent.mkdir(parents=True, exist_ok=True)
    md_path.write_text('\n'.join(out), encoding='utf-8')
    print(f'Wrote: {md_path}')


if __name__ == '__main__':
    main()
