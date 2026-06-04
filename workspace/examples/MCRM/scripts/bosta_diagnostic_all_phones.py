#!/usr/bin/env python3
"""
Bosta Multi-Phone Diagnostic
Runs on multiple phones to collect ALL Bosta API keys and value shapes.
Output: JSON report for solid bosta_converter.
"""
import os
import sys
import json
from collections import defaultdict

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, v = line.split('=', 1)
                os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))

PHONES = [
    '01003580830',
    '01226635140',
    '01201133753',
    '01224383359',
    '01050010662',
    '01024700105',
    '01210404848',
]


def deep_collect_keys(obj, prefix='', out=None):
    """Recursively collect all keys and their value types."""
    if out is None:
        out = {}
    if obj is None:
        out[prefix or 'null'] = 'null'
        return out
    if isinstance(obj, dict):
        for k, v in obj.items():
            p = f"{prefix}.{k}" if prefix else k
            if isinstance(v, (dict, list)):
                deep_collect_keys(v, p, out)
            else:
                out[p] = type(v).__name__ if v is not None else 'null'
        return out
    if isinstance(obj, list):
        if obj and isinstance(obj[0], (dict, list)):
            deep_collect_keys(obj[0], f"{prefix}[0]", out)
        return out
    return out


def safe_value_summary(v):
    if v is None:
        return 'null'
    if isinstance(v, (int, float)):
        return str(v)
    if isinstance(v, str):
        return v[:50] + '...' if len(v) > 50 else v
    if isinstance(v, dict):
        return f"dict({len(v)} keys)"
    if isinstance(v, list):
        return f"list({len(v)})"
    return str(type(v).__name__)


def main():
    token = os.environ.get('BOSTA_TOKEN') or os.environ.get('BOSTA_API_KEY')
    if not token:
        print("ERROR: BOSTA_TOKEN not set")
        return 1

    import requests
    from app.utils.phone_normalizer import normalize_phone_safe

    BASE = 'https://app.bosta.co/api/v2'
    headers = {
        'Accept': 'application/json',
        'Authorization': token,
        'Content-Type': 'application/json',
    }

    all_search_keys = set()
    all_business_keys = set()
    search_key_types = defaultdict(set)
    business_key_types = defaultdict(set)
    financial_samples = []
    type_codes_seen = set()
    errors = []

    for phone in PHONES:
        norm = normalize_phone_safe(phone) or phone
        try:
            resp = requests.post(
                f'{BASE}/deliveries/search',
                headers=headers,
                json={'mobilePhones': [norm], 'limit': 20, 'page': 1, 'sortBy': '-updatedAt'},
                timeout=15
            )
            if resp.status_code != 200:
                errors.append(f"{phone}: search {resp.status_code}")
                continue

            data = resp.json()
            deliveries = data.get('data', {}).get('deliveries') or data.get('deliveries') or []
            if not deliveries:
                continue

            for d in deliveries:
                all_search_keys.update(d.keys())
                for k, v in d.items():
                    search_key_types[k].add(type(v).__name__ if v is not None else 'null')
                if 'cod' in d or 'pricing' in d or 'wallet' in d:
                    financial_samples.append({
                        'phone': phone,
                        'tracking': d.get('trackingNumber'),
                        'cod': d.get('cod'),
                        'pricing': d.get('pricing'),
                        'wallet': 'present' if 'wallet' in d else 'missing',
                        'shipmentFees': d.get('shipmentFees'),
                    })
                t = d.get('type')
                if isinstance(t, dict):
                    type_codes_seen.add(t.get('code'))

            # Fetch business for first tracking to get full key set
            tr = deliveries[0].get('trackingNumber')
            if tr:
                biz = requests.get(f'{BASE}/deliveries/business/{tr}', headers=headers, timeout=10)
                if biz.status_code == 200:
                    bd = biz.json().get('data', biz.json())
                    if isinstance(bd, dict):
                        all_business_keys.update(bd.keys())
                        for k, v in bd.items():
                            business_key_types[k].add(type(v).__name__ if v is not None else 'null')
        except Exception as e:
            errors.append(f"{phone}: {e}")

    # Build report
    report = {
        'phones_tested': PHONES,
        'errors': errors,
        'search_keys': sorted(all_search_keys),
        'business_keys': sorted(all_business_keys),
        'keys_in_business_not_search': sorted(all_business_keys - all_search_keys),
        'search_key_types': {k: list(v) for k, v in sorted(search_key_types.items())},
        'business_key_types': {k: list(v) for k, v in sorted(business_key_types.items())},
        'type_codes_seen': list(type_codes_seen),
        'financial_samples': financial_samples[:15],
    }

    out_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.venom', 'work', 'BOSTA-DIAGNOSTIC-ALL-PHONES.json')
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    print(f"Report written to {out_path}")
    print(f"Search keys: {len(all_search_keys)}")
    print(f"Business keys: {len(all_business_keys)}")
    print(f"Keys only in business: {report['keys_in_business_not_search']}")
    print(f"Type codes: {report['type_codes_seen']}")
    print(f"Financial samples: {len(financial_samples)}")
    if errors:
        print(f"Errors: {errors}")

    return 0


if __name__ == '__main__':
    sys.exit(main())
