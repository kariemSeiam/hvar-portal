#!/usr/bin/env python3
"""Audit Bosta financial fields for multiple phones/orders."""
import json
import os
import sys
from collections import defaultdict

import requests


PHONES = [
    "201003580830",
    "201226635140",
    "201201133753",
    "201224383359",
    "201050010662",
    "201024700105",
    "201210404848",
]


def load_env():
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
    if not os.path.exists(env_path):
        return
    with open(env_path, encoding="utf-8") as file:
        for line in file:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, value = line.split("=", 1)
                os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def normalize_phone(phone):
    digits = "".join(ch for ch in str(phone) if ch.isdigit())
    if digits.startswith("20") and len(digits) == 12:
        return "0" + digits[2:]
    return digits


def get_token():
    return os.environ.get("BOSTA_TOKEN") or os.environ.get("BOSTA_API_KEY")


def fetch_search_orders(phone, headers):
    base = "https://app.bosta.co/api/v2"
    response = requests.post(
        f"{base}/deliveries/search",
        headers=headers,
        json={"mobilePhones": [normalize_phone(phone)], "limit": 100, "page": 1, "sortBy": "-updatedAt"},
        timeout=20,
    )
    response.raise_for_status()
    data = response.json()
    return data.get("data", {}).get("deliveries") or data.get("deliveries") or []


def fetch_business_order(tracking, headers):
    base = "https://app.bosta.co/api/v2"
    response = requests.get(f"{base}/deliveries/business/{tracking}", headers=headers, timeout=20)
    response.raise_for_status()
    data = response.json()
    return data.get("data", data)


def main():
    load_env()
    token = get_token()
    if not token:
        print("Missing BOSTA_TOKEN/BOSTA_API_KEY")
        return 1

    headers = {
        "Accept": "application/json",
        "Authorization": token,
        "Content-Type": "application/json",
    }

    financial_key_types = defaultdict(set)
    unknown_financial_paths = defaultdict(set)
    orders = []

    for phone in PHONES:
        deliveries = fetch_search_orders(phone, headers)
        for delivery in deliveries:
            tracking = delivery.get("trackingNumber")
            if not tracking:
                continue
            business = fetch_business_order(tracking, headers)
            pricing = business.get("pricing") or {}
            wallet = business.get("wallet") or {}
            cash_cycle = wallet.get("cashCycle") if isinstance(wallet, dict) else None
            type_info = business.get("type") or {}
            order_type = type_info.get("value") if isinstance(type_info, dict) else type_info
            type_code = type_info.get("code") if isinstance(type_info, dict) else None

            for key, value in business.items():
                lowered = str(key).lower()
                if any(token in lowered for token in ("fee", "tax", "vat", "price", "amount", "cod", "insurance")):
                    financial_key_types[key].add(type(value).__name__)

            if isinstance(pricing, dict):
                for key, value in pricing.items():
                    financial_key_types[f"pricing.{key}"].add(type(value).__name__)
                    lowered = str(key).lower()
                    if any(token in lowered for token in ("fee", "tax", "vat", "price", "amount", "insurance", "delivery", "shipment")):
                        unknown_financial_paths[f"pricing.{key}"].add(json.dumps(value, ensure_ascii=False, default=str))

            if isinstance(cash_cycle, dict):
                for key, value in cash_cycle.items():
                    financial_key_types[f"wallet.cashCycle.{key}"].add(type(value).__name__)
                    unknown_financial_paths[f"wallet.cashCycle.{key}"].add(json.dumps(value, ensure_ascii=False, default=str))

            shipment_fees = business.get("shipmentFees")
            vat_14 = round(float(shipment_fees) * 0.14, 2) if shipment_fees is not None else None
            gross_fees = round(float(shipment_fees) * 1.14, 2) if shipment_fees is not None else None

            orders.append({
                "phone": phone,
                "tracking": tracking,
                "typeCode": type_code,
                "type": order_type,
                "codSearch": delivery.get("cod"),
                "codBusiness": business.get("cod"),
                "shipmentFees": shipment_fees,
                "vat14Derived": vat_14,
                "grossFeesDerived": gross_fees,
                "pricing": pricing,
                "wallet": wallet,
            })

    report = {
        "phones": PHONES,
        "ordersCount": len(orders),
        "financialKeyTypes": {k: sorted(v) for k, v in sorted(financial_key_types.items())},
        "financialFieldSamples": {k: sorted(v)[:10] for k, v in sorted(unknown_financial_paths.items())},
        "orders": orders,
    }

    output = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".venom", "work", "BOSTA-FINANCIAL-AUDIT.json")
    os.makedirs(os.path.dirname(output), exist_ok=True)
    with open(output, "w", encoding="utf-8") as file:
        json.dump(report, file, ensure_ascii=False, indent=2)

    print(f"Wrote {output}")
    print(f"Orders audited: {len(orders)}")
    print("Financial keys:")
    for key in sorted(report["financialKeyTypes"]):
        print(f"  {key}: {report['financialKeyTypes'][key]}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
