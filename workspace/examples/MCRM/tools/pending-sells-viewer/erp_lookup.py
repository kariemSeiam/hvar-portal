# -*- coding: utf-8 -*-
"""
ERP (erp.hvarstore.com) lookup helpers — server-side proxy.

Required env vars (set in .env or via shell before running server.py):
  ERP_BASE          default https://erp.hvarstore.com
  ERP_SESSION_COOKIE  value of hvar_pos_session cookie
  ERP_XSRF_COOKIE     value of XSRF-TOKEN cookie
  ERP_XSRF_HEADER     value of x-csrf-token request header
  ERP_INSECURE      1 / true to skip TLS verify

The proxy hits: GET {ERP_BASE}/sells?search[value]={phone}&...
and returns the best matching order (payment_status=due, final_total ≈ cost).
"""
from __future__ import annotations

import os
import re
from typing import Any

import requests

_ERP_SELLS_PARAMS = (
    "draw=1"
    "&columns[0][data]=mass_delete&columns[0][searchable]=false&columns[0][orderable]=false"
    "&columns[1][data]=action&columns[1][searchable]=false&columns[1][orderable]=false"
    "&columns[2][data]=transaction_date"
    "&columns[3][data]=invoice_no"
    "&columns[4][data]=download_invoice"
    "&columns[5][data]=bill_code"
    "&columns[6][data]=download_bill_of_lading"
    "&columns[7][data]=conatct_name"
    "&columns[8][data]=mobile&columns[8][name]=contacts.mobile"
    "&columns[9][data]=business_location&columns[9][name]=bl.name"
    "&columns[10][data]=payment_status"
    "&columns[11][data]=payment_methods&columns[11][searchable]=false&columns[11][orderable]=false"
    "&columns[12][data]=commission_agent_name"
    "&columns[13][data]=final_total"
    "&columns[14][data]=total_paid&columns[14][searchable]=false"
    "&columns[15][data]=total_remaining"
    "&columns[16][data]=return_due&columns[16][searchable]=false&columns[16][orderable]=false"
    "&columns[17][data]=shipping_status"
    "&columns[18][data]=shipping_charges&columns[18][name]=shipping_charges "
    "&columns[19][data]=total_items&columns[19][searchable]=false"
    "&columns[20][data]=types_of_service_name&columns[20][name]=tos.name"
    "&columns[21][data]=marketing_source"
    "&columns[22][data]=service_custom_field_1"
    "&columns[23][data]=custom_field_1&columns[23][name]=transactions.custom_field_1"
    "&columns[24][data]=custom_field_2&columns[24][name]=transactions.custom_field_2"
    "&columns[25][data]=custom_field_3&columns[25][name]=transactions.custom_field_3"
    "&columns[26][data]=custom_field_4&columns[26][name]=transactions.custom_field_4"
    "&columns[27][data]=added_by&columns[27][name]=u.first_name"
    "&columns[28][data]=order_from"
    "&columns[29][data]=coupon_code&columns[29][name]=transactions.coupon_code"
    "&columns[30][data]=sell_note"
    "&columns[31][data]=staff_note"
    "&columns[32][data]=shipping_details"
    "&columns[33][data]=table_name&columns[33][name]=tables.name"
    "&columns[34][data]=waiter&columns[34][name]=ss.first_name"
    "&order[0][column]=2&order[0][dir]=desc"
    "&start=0&length=25"
    "&start_date=2026-01-01&end_date=2026-12-31"
    "&is_direct_sale=1"
)


def _erp_base() -> str:
    return os.environ.get("ERP_BASE", "https://erp.hvarstore.com").rstrip("/")


def _erp_session() -> str:
    return os.environ.get("ERP_SESSION_COOKIE", "").strip()


def _erp_xsrf_cookie() -> str:
    return os.environ.get("ERP_XSRF_COOKIE", "").strip()


def _erp_xsrf_header() -> str:
    return os.environ.get("ERP_XSRF_HEADER", "").strip()


def _erp_insecure() -> bool:
    return os.environ.get("ERP_INSECURE", "").lower() in ("1", "true", "yes")


_urllib3_insecure_warning_silenced = False


def _silence_unverified_https_warning_if_insecure() -> None:
    """Avoid spamming stderr when ERP_INSECURE=1 (verify=False is intentional)."""
    global _urllib3_insecure_warning_silenced
    if _urllib3_insecure_warning_silenced or not _erp_insecure():
        return
    import urllib3

    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    _urllib3_insecure_warning_silenced = True


def erp_configured() -> bool:
    """True if at least the session cookie is set."""
    return bool(_erp_session())


_ARABIC_INDIC = str.maketrans("٠١٢٣٤٥٦٧٨٩", "0123456789")
_PERSIAN_INDIC = str.maketrans("۰۱۲۳۴۵۶۷۸۹", "0123456789")


def _strip_html(s: str) -> str:
    return re.sub(r"<[^>]+>", " ", s or "")


def normalize_digits_ascii(s: str) -> str:
    """Arabic / Persian digits → ASCII 0–9."""
    if not s:
        return ""
    return str(s).translate(_ARABIC_INDIC).translate(_PERSIAN_INDIC)


def _extract_orig_value(html_str: str | None, default: str = "") -> str:
    """Pull data-orig-value="..." from an ERP HTML-in-JSON field."""
    if not html_str:
        return default
    m = re.search(r'data-orig-value=["\']([^"\']*)["\']', html_str)
    return m.group(1) if m else default


def _parse_final_total(row: dict[str, Any]) -> float | None:
    """Extract numeric total from the ERP final_total HTML blob."""
    raw = row.get("final_total") or ""
    if isinstance(raw, (int, float)):
        try:
            return float(raw)
        except (TypeError, ValueError):
            return None
    orig = normalize_digits_ascii(_extract_orig_value(str(raw)))
    if orig:
        try:
            return float(orig)
        except ValueError:
            pass
    # Fallback: strip EGP and commas from visible text
    stripped = re.sub(r"[<][^>]+[>]", "", str(raw))
    cleaned = stripped.replace("EGP", "").replace(",", "").strip()
    try:
        return float(cleaned)
    except ValueError:
        return None


def _is_due(row: dict[str, Any]) -> bool:
    """payment_status field contains data-orig-value="due"."""
    ps = row.get("payment_status") or ""
    orig = _extract_orig_value(str(ps))
    if orig:
        return orig.strip().lower() == "due"
    # Fallback: check visible text contains مستحق
    return "مستحق" in str(ps)


def _parse_bill_code(row: dict[str, Any]) -> str | None:
    """
    Bosta tracking from ERP `bill_code` (ASCII digits only).
    Skips 'لا يوجد' and non-numeric placeholders.
    """
    raw = row.get("bill_code")
    if raw is None:
        return None
    if isinstance(raw, (int, float)):
        s = str(int(raw))
        return s if s.isdigit() and len(s) >= 4 else None
    plain = _strip_html(str(raw)).strip()
    if "لا يوجد" in plain or "لايوجد" in plain.replace(" ", ""):
        return None
    text = normalize_digits_ascii(plain)
    text = re.sub(r"\s+", "", text)
    if not text:
        return None
    digits = re.sub(r"[^\d]", "", text)
    if len(digits) >= 4:
        return digits
    return None


def _fetch_erp_sells_raw(phone: str, draw: int = 1) -> list[dict[str, Any]]:
    """Hit ERP sells endpoint, return raw data array."""
    session_cookie = _erp_session()
    xsrf_cookie = _erp_xsrf_cookie()
    xsrf_header = _erp_xsrf_header()
    verify = not _erp_insecure()
    _silence_unverified_https_warning_if_insecure()

    if not session_cookie:
        raise RuntimeError("ERP_SESSION_COOKIE not configured. Set it in .env")

    url = f"{_erp_base()}/sells"
    params_str = f"{_ERP_SELLS_PARAMS}&search[value]={phone}&draw={draw}"

    cookie_header = f"hvar_pos_session={session_cookie}"
    if xsrf_cookie:
        cookie_header = f"XSRF-TOKEN={xsrf_cookie}; {cookie_header}"

    headers: dict[str, str] = {
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "Accept-Language": "en-US,en;q=0.9,ar;q=0.8",
        "X-Requested-With": "XMLHttpRequest",
        "Referer": f"{_erp_base()}/sells",
        "Cache-Control": "no-cache",
    }
    if xsrf_header:
        headers["X-CSRF-Token"] = xsrf_header
    if cookie_header:
        headers["Cookie"] = cookie_header

    resp = requests.get(
        url,
        params=params_str,
        headers=headers,
        timeout=30,
        verify=verify,
    )
    resp.raise_for_status()
    body = resp.json()
    return body.get("data") or []


def find_erp_match(
    phone: str,
    cost: float | None,
    cost_tolerance: float = 1.0,
) -> dict[str, Any] | None:
    """
    Return the latest ERP sell row for `phone` that:
      - has payment_status = due (مستحق)
      - final_total is within ±cost_tolerance of `cost` (if cost is provided)

    Returns None if not found or ERP not configured.
    Rows are already sorted desc by date from ERP.
    """
    if not erp_configured():
        return None

    try:
        rows = _fetch_erp_sells_raw(phone)
    except Exception as exc:
        return {"_error": str(exc)}

    for row in rows:
        if not _is_due(row):
            continue
        total = _parse_final_total(row)
        if cost is not None and total is not None:
            if abs(total - cost) > cost_tolerance:
                continue
        bill = _parse_bill_code(row)
        # Match found — extract clean summary
        return {
            "invoice_no": row.get("invoice_no_text") or row.get("invoice_no") or "",
            "name": row.get("name") or "",
            "mobile": row.get("mobile") or "",
            "final_total": total,
            "bill_code": bill,
            "payment_status": "مستحق",
            "transaction_date": row.get("transaction_date") or "",
            "erp_sell_id": _extract_erp_id_from_action(row),
            "_raw_row": row,
        }

    return None  # no matching due order found


def _extract_erp_id_from_action(row: dict[str, Any]) -> str | None:
    """Pull ERP transaction ID from the action HTML blob."""
    action = row.get("action") or row.get("DT_RowAttr", {}).get("data-href") or ""
    if isinstance(action, dict):
        href = action.get("data-href") or ""
        m = re.search(r"/sells/(\d+)", href)
        return m.group(1) if m else None
    m = re.search(r"/sells/(\d+)", str(action))
    return m.group(1) if m else None


def erp_config_summary() -> dict[str, Any]:
    """Return safe summary of ERP config for template display."""
    session = _erp_session()
    return {
        "configured": bool(session),
        "base": _erp_base(),
        "session_set": bool(session),
        "xsrf_set": bool(_erp_xsrf_header()),
        "insecure": _erp_insecure(),
    }
