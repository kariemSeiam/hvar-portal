# -*- coding: utf-8 -*-
"""
Pending sells dashboard — Flask Blueprint (mount on hub :5050) or standalone (:8765).

Mounted on hub (default):
  http://127.0.0.1:5050/pending-sells/

Standalone:
  python tools/pending-sells-viewer/server.py
  http://127.0.0.1:8765/

Query: ?status=PENDING|CONFIRMED  ?base=  ?token=  ?insecure=1  ?user_id=

Env: MCRM_API_BASE (default http://127.0.0.1:5050), MCRM_API_TOKEN, ERP_*, MCRM_ACTION_USER_ID, …
"""
from __future__ import annotations

import os
import sys
from datetime import datetime, timezone
from pathlib import Path

import requests

_HERE = Path(__file__).resolve().parent
if str(_HERE) not in sys.path:
    sys.path.insert(0, str(_HERE))

try:
    from dotenv import load_dotenv

    load_dotenv(_HERE.parent.parent / ".env")
    load_dotenv(_HERE / ".env", override=True)
except ImportError:
    pass

from fetch_pending import (
    VALID_SELL_STATUSES,
    default_api_base,
    default_insecure,
    default_token,
    fetch_both_status_totals_parallel,
    fetch_sell_tickets_by_status,
)
from tracking_stats import (
    cost_field_stats,
    enrich_cost_for_template,
    enrich_for_template,
    tracking_field_stats,
)

from erp_lookup import erp_config_summary, erp_configured, find_erp_match

from flask import Blueprint, jsonify, render_template, request, url_for

pending_sells_bp = Blueprint(
    "pending_sells",
    __name__,
    template_folder=str(_HERE / "templates"),
)


@pending_sells_bp.after_request
def _viewer_no_cache(response):
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response


def _viewer_query_args() -> dict:
    d: dict = {}
    for k in ("status", "base", "token", "insecure", "user_id"):
        v = request.args.get(k)
        if v is not None and v != "":
            d[k] = v
    return d


def _chip_url(status: str) -> str:
    q = _viewer_query_args()
    q["status"] = status
    return url_for("pending_sells.index", **q)


@pending_sells_bp.route("/", strict_slashes=False)
def index():
    api_base = (request.args.get("base") or default_api_base()).strip()
    token = request.args.get("token") or default_token()
    insecure = request.args.get("insecure") == "1" or default_insecure()

    raw = (request.args.get("status") or "PENDING").strip().upper()
    current_status = raw if raw in VALID_SELL_STATUSES else "PENDING"

    error = None
    rows: list = []
    pending_total = 0
    confirmed_total = 0

    try:
        pending_total, confirmed_total = fetch_both_status_totals_parallel(
            api_base, token=token, verify_ssl=not insecure
        )
    except Exception:
        pass

    try:
        rows = fetch_sell_tickets_by_status(
            base_url=api_base,
            status=current_status,
            token=token,
            verify_ssl=not insecure,
        )
    except Exception as e:
        error = str(e)

    generated_at = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    count = len(rows)

    refresh_url = url_for("pending_sells.index", **_viewer_query_args())

    if current_status == "CONFIRMED":
        page_title = "مبيعات مؤكدة"
        status_badge_class = "badge-confirmed"
        status_label = "مؤكدة"
    else:
        page_title = "مبيعات معلقة"
        status_badge_class = "badge-pending"
        status_label = "في الانتظار"

    st_orig = enrich_for_template(tracking_field_stats(rows, "original_tracking"))
    st_send = enrich_for_template(tracking_field_stats(rows, "new_tracking_send"))
    st_cost = enrich_cost_for_template(cost_field_stats(rows, "cost_adjustment"))

    return render_template(
        "index.html",
        rows=rows,
        error=error,
        count=count,
        api_base=api_base,
        generated_at=generated_at,
        refresh_url=refresh_url,
        current_status=current_status,
        pending_total=pending_total,
        confirmed_total=confirmed_total,
        pending_url=_chip_url("PENDING"),
        confirmed_url=_chip_url("CONFIRMED"),
        page_title=page_title,
        status_badge_class=status_badge_class,
        status_label=status_label,
        stats_original=st_orig,
        stats_send=st_send,
        stats_cost=st_cost,
        erp_config=erp_config_summary(),
    )


@pending_sells_bp.route("/api/erp-lookup")
def api_erp_lookup():
    phone = (request.args.get("phone") or "").strip()
    if not phone:
        return jsonify({"ok": False, "error": "phone required"}), 400

    cost_raw = (request.args.get("cost") or "").strip()
    cost: float | None = None
    if cost_raw:
        try:
            cost = float(cost_raw)
        except ValueError:
            pass

    if not erp_configured():
        return jsonify({"ok": False, "error": "ERP not configured — set ERP_SESSION_COOKIE in .env"}), 503

    match = find_erp_match(phone, cost)
    if match is None:
        return jsonify({"ok": True, "match": None})
    if "_error" in match:
        return jsonify({"ok": False, "error": match["_error"]}), 502

    match.pop("_raw_row", None)
    return jsonify({"ok": True, "match": match})


def _action_user_id(body: dict) -> int:
    raw = body.get("user_id")
    if raw is not None and str(raw).strip() != "":
        try:
            return int(raw)
        except (TypeError, ValueError):
            pass
    try:
        return int(os.environ.get("MCRM_ACTION_USER_ID", "1"))
    except ValueError:
        return 1


@pending_sells_bp.route("/api/confirm-ticket", methods=["POST"])
def api_confirm_ticket():
    body = request.get_json(silent=True) or {}
    ticket_id = body.get("ticket_id")
    tracking = (body.get("tracking") or "").strip()
    cost_adjustment = body.get("cost_adjustment")
    api_base = (body.get("api_base") or default_api_base()).strip()
    token = body.get("token") or default_token()
    user_id = _action_user_id(body)

    if not ticket_id:
        return jsonify({"ok": False, "error": "ticket_id required"}), 400
    if not tracking:
        return jsonify({"ok": False, "error": "tracking (Bosta number) required"}), 400

    headers: dict[str, str] = {"Accept": "application/json", "Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token.strip()}"

    payload: dict = {
        "action": "confirm",
        "user_id": user_id,
        "new_tracking_send": tracking,
    }
    if cost_adjustment is not None:
        try:
            payload["cost_adjustment"] = float(cost_adjustment)
        except (TypeError, ValueError):
            pass

    insecure = default_insecure()
    confirm_url = f"{api_base.rstrip('/')}/api/tickets/{int(ticket_id)}/action"
    try:
        resp = requests.post(confirm_url, headers=headers, json=payload, timeout=30, verify=not insecure)
        resp.raise_for_status()
        return jsonify({"ok": True, "ticket_id": ticket_id, "result": resp.json()})
    except requests.HTTPError as exc:
        raw = exc.response.text if exc.response else ""
        detail: dict | str
        reason = str(exc)
        try:
            detail = exc.response.json() if exc.response else {}
            if isinstance(detail, dict):
                if detail.get("error"):
                    reason = str(detail["error"])
                elif detail.get("message"):
                    reason = str(detail["message"])
        except Exception:
            detail = raw[:800] if raw else str(exc)
            reason = raw[:500] if raw else str(exc)

        return jsonify(
            {
                "ok": False,
                "error": str(exc),
                "reason": reason,
                "detail": detail,
            }
        ), exc.response.status_code if exc.response else 502
    except Exception as exc:
        return jsonify({"ok": False, "error": str(exc), "reason": str(exc)}), 502


def main():
    from flask import Flask

    port = int(os.environ.get("PENDING_SELLS_VIEWER_PORT", "8765"))
    app = Flask(__name__, template_folder=str(_HERE / "templates"))
    app.register_blueprint(pending_sells_bp)
    print(f"Pending sells viewer -> http://127.0.0.1:{port}/")
    print(f"API base (override ?base=): {default_api_base()}")
    print("Tip: use hub on :5050 -> http://127.0.0.1:5050/pending-sells/")
    app.run(host="127.0.0.1", port=port, debug=False)


if __name__ == "__main__":
    main()
