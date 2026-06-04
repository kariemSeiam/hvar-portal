# -*- coding: utf-8 -*-
"""Fetch sell tickets from the hub API — parallel pagination, no caching."""
from __future__ import annotations

import math
import os
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Any

import requests

try:
    from dotenv import load_dotenv

    load_dotenv()
except ImportError:
    pass

API_MAX_PAGE = 100

VALID_SELL_STATUSES = frozenset({"PENDING", "CONFIRMED"})

# Parallel fetches (page 0 is sequential, then remaining pages in parallel). No caching.
_DEFAULT_WORKERS = 8


def _max_workers() -> int:
    try:
        w = int(os.environ.get("MCRM_VIEWER_MAX_WORKERS", str(_DEFAULT_WORKERS)))
        return max(2, min(32, w))
    except ValueError:
        return _DEFAULT_WORKERS


def phone_primary(row: dict[str, Any]) -> str | None:
    return row.get("phone_primary") or row.get("phone")


def _request_headers(token: str | None) -> dict[str, str]:
    headers: dict[str, str] = {"Accept": "application/json", "Cache-Control": "no-cache"}
    if token:
        headers["Authorization"] = f"Bearer {token.strip()}"
    return headers


def _session(token: str | None, verify_ssl: bool) -> requests.Session:
    s = requests.Session()
    s.headers.update(_request_headers(token))
    return s


def fetch_sell_status_total(
    base_url: str,
    status: str,
    token: str | None = None,
    verify_ssl: bool = True,
) -> int:
    """Return total count of sell tickets for one status (one API round-trip)."""
    base = base_url.rstrip("/")
    url = f"{base}/api/tickets/"
    session = _session(token, verify_ssl)
    params = {
        "service_type": "sell",
        "status": status,
        "limit": 1,
        "offset": 0,
        "include_bosta": "false",
    }
    resp = session.get(url, params=params, timeout=60, verify=verify_ssl)
    resp.raise_for_status()
    body = resp.json()
    if isinstance(body, dict) and body.get("error") and not body.get("data"):
        msg = body.get("message") or body.get("error")
        raise RuntimeError(f"API error: {msg}")
    pag = body.get("pagination") or {}
    return int(pag.get("total", 0))


def fetch_both_status_totals_parallel(
    base_url: str,
    token: str | None = None,
    verify_ssl: bool = True,
) -> tuple[int, int]:
    """PENDING total and CONFIRMED total in parallel (two HTTP calls at once)."""

    def _one(status: str) -> tuple[str, int]:
        return status, fetch_sell_status_total(base_url, status, token=token, verify_ssl=verify_ssl)

    pending_n = confirmed_n = 0
    with ThreadPoolExecutor(max_workers=2) as ex:
        futures = [ex.submit(_one, s) for s in ("PENDING", "CONFIRMED")]
        for fut in as_completed(futures):
            status, val = fut.result()
            if status == "PENDING":
                pending_n = val
            else:
                confirmed_n = val
    return pending_n, confirmed_n


def _fetch_one_page_raw(
    base_url: str,
    status: str,
    offset: int,
    limit: int,
    token: str | None,
    verify_ssl: bool,
) -> tuple[int, list[dict[str, Any]], dict[str, Any]]:
    """Single GET; returns (offset, data_chunk, pagination dict)."""
    url = f"{base_url.rstrip('/')}/api/tickets/"
    params = {
        "service_type": "sell",
        "status": status,
        "limit": limit,
        "offset": offset,
        "include_bosta": "false",
    }
    # Fresh request per call — no shared Session across threads
    resp = requests.get(
        url,
        params=params,
        headers=_request_headers(token),
        timeout=120,
        verify=verify_ssl,
    )
    resp.raise_for_status()
    body = resp.json()
    if isinstance(body, dict) and body.get("error") and not body.get("data"):
        msg = body.get("message") or body.get("error")
        raise RuntimeError(f"API error: {msg}")
    chunk = body.get("data")
    if chunk is None:
        raise RuntimeError("Unexpected API response (missing data)")
    pag = body.get("pagination") or {}
    return offset, chunk, pag


def fetch_sell_tickets_by_status(
    base_url: str,
    status: str,
    page_size: int = API_MAX_PAGE,
    token: str | None = None,
    verify_ssl: bool = True,
) -> list[dict[str, Any]]:
    """
    Fetch all sell tickets for a status.

    Page 0 is fetched first to read ``pagination.total``; remaining pages are
    requested in parallel (ThreadPoolExecutor). If ``total`` is absent, falls
    back to sequential pagination. No caching.
    """
    page_size = max(1, min(int(page_size), API_MAX_PAGE))
    base = base_url.rstrip("/")

    offset0, chunk0, pag0 = _fetch_one_page_raw(
        base, status, 0, page_size, token, verify_ssl
    )

    total = pag0.get("total")
    limit_eff = int(pag0.get("limit", page_size))

    if total is None:
        # API did not return total — continue page-by-page from offset (no parallel)
        all_rows = list(chunk0)
        offset = limit_eff
        pag = pag0
        while pag.get("has_more"):
            _o, next_chunk, pag = _fetch_one_page_raw(
                base, status, offset, page_size, token, verify_ssl
            )
            all_rows.extend(next_chunk)
            offset += int(pag.get("limit", page_size))
        all_rows.sort(key=lambda t: (str(t.get("created_at") or ""), t.get("id") or 0))
        return all_rows

    total = int(total)
    if total == 0:
        return []

    num_pages = max(1, math.ceil(total / limit_eff))
    if num_pages == 1:
        rows = list(chunk0)
        rows.sort(key=lambda t: (str(t.get("created_at") or ""), t.get("id") or 0))
        return rows

    chunks: dict[int, list[dict[str, Any]]] = {0: list(chunk0)}
    offsets_rest = [i * limit_eff for i in range(1, num_pages)]
    workers = min(_max_workers(), len(offsets_rest))

    def _job(off: int) -> tuple[int, list[dict[str, Any]]]:
        o, ch, _pag = _fetch_one_page_raw(base, status, off, limit_eff, token, verify_ssl)
        return o, ch

    with ThreadPoolExecutor(max_workers=workers) as ex:
        futures = {ex.submit(_job, off): off for off in offsets_rest}
        for fut in as_completed(futures):
            off, ch = fut.result()
            chunks[off] = ch

    all_rows: list[dict[str, Any]] = []
    for off in sorted(chunks.keys()):
        all_rows.extend(chunks[off])

    all_rows.sort(key=lambda t: (str(t.get("created_at") or ""), t.get("id") or 0))
    return all_rows


def fetch_pending_sells_api(
    base_url: str,
    page_size: int = API_MAX_PAGE,
    token: str | None = None,
    verify_ssl: bool = True,
) -> list[dict[str, Any]]:
    """Backward-compatible: pending sell tickets only."""
    return fetch_sell_tickets_by_status(
        base_url, "PENDING", page_size=page_size, token=token, verify_ssl=verify_ssl
    )


def default_api_base() -> str:
    """Local dev default: hub API on port 5050 (see run.py). Override with MCRM_API_BASE."""
    return os.environ.get("MCRM_API_BASE", "http://127.0.0.1:5050").strip()


def default_token() -> str | None:
    t = os.environ.get("MCRM_API_TOKEN", "").strip()
    return t or None


def default_insecure() -> bool:
    return os.environ.get("MCRM_API_INSECURE", "").lower() in ("1", "true", "yes")
