# -*- coding: utf-8 -*-
"""Classify tracking fields: ASCII digits-only vs other (HVS, symbols, etc.) vs empty."""
from __future__ import annotations

import re
from typing import Any, TypedDict


class TrackingBreakdown(TypedDict):
    empty: int
    digits_only: int
    other: int


_DIGITS_ONLY = re.compile(r"^[0-9]+$")


def classify_tracking_value(value: Any) -> str:
    """
    Returns:
      'empty' — null or blank
      'digits_only' — only ASCII digits 0–9 after strip
      'other' — letters (HVS…), ./, mixed, spaces, unicode, etc.
    """
    if value is None:
        return "empty"
    s = str(value).strip()
    if not s:
        return "empty"
    if _DIGITS_ONLY.match(s):
        return "digits_only"
    return "other"


def tracking_field_stats(rows: list[dict[str, Any]], field: str) -> TrackingBreakdown:
    out: TrackingBreakdown = {"empty": 0, "digits_only": 0, "other": 0}
    for row in rows:
        k = classify_tracking_value(row.get(field))
        if k == "empty":
            out["empty"] += 1
        elif k == "digits_only":
            out["digits_only"] += 1
        else:
            out["other"] += 1
    return out


def total_rows(b: TrackingBreakdown) -> int:
    return b["empty"] + b["digits_only"] + b["other"]


def pct(part: int, whole: int) -> float:
    if whole <= 0:
        return 0.0
    return round(100.0 * part / whole, 1)


def enrich_for_template(b: TrackingBreakdown) -> dict[str, Any]:
    """Adds total + percentage fields for Jinja."""
    tot = total_rows(b)
    return {
        "empty": b["empty"],
        "digits_only": b["digits_only"],
        "other": b["other"],
        "total": tot,
        "pct_empty": pct(b["empty"], tot),
        "pct_digits": pct(b["digits_only"], tot),
        "pct_other": pct(b["other"], tot),
    }


class CostBreakdown(TypedDict):
    zero: int
    nonzero: int
    unset: int


def classify_cost_value(value: Any) -> str:
    """صفر رقمي | غير صفر | غير محدد (None)."""
    if value is None:
        return "unset"
    try:
        f = float(value)
    except (TypeError, ValueError):
        return "nonzero"
    if abs(f) < 1e-12:
        return "zero"
    return "nonzero"


def cost_field_stats(rows: list[dict[str, Any]], field: str = "cost_adjustment") -> CostBreakdown:
    out: CostBreakdown = {"zero": 0, "nonzero": 0, "unset": 0}
    for row in rows:
        k = classify_cost_value(row.get(field))
        if k == "unset":
            out["unset"] += 1
        elif k == "zero":
            out["zero"] += 1
        else:
            out["nonzero"] += 1
    return out


def total_cost_rows(b: CostBreakdown) -> int:
    return b["zero"] + b["nonzero"] + b["unset"]


def enrich_cost_for_template(b: CostBreakdown) -> dict[str, Any]:
    tot = total_cost_rows(b)
    return {
        "zero": b["zero"],
        "nonzero": b["nonzero"],
        "unset": b["unset"],
        "total": tot,
        "pct_zero": pct(b["zero"], tot),
        "pct_nonzero": pct(b["nonzero"], tot),
        "pct_unset": pct(b["unset"], tot),
    }
