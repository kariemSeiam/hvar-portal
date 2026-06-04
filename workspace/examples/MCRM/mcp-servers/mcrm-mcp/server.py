#!/usr/bin/env python3
"""
HUB-MCRM MCP Server
====================
Complete MCP server exposing every HUB-MCRM API endpoint as an individual tool.

Environment variables:
  MCRM_API_URL       - Base URL (default: https://mcrm.hvarstore.com)
  MCRM_ADMIN_PHONE   - Admin phone for API login authentication (required)
  MCRM_ADMIN_PASSWORD - Admin password for API login authentication (required)
  MCRM_JWT_SECRET    - (Fallback) JWT secret for local token signing when API login is unavailable

Run:
  python server.py
"""

from __future__ import annotations

import json
import logging
import os
import asyncio
import sys
from pathlib import Path
from typing import Any, Optional
from datetime import datetime, timezone, timedelta

import jwt

import httpx
from mcp.server.fastmcp import FastMCP

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
BASE_URL = os.getenv("MCRM_API_URL", "https://mcrm.hvarstore.com").rstrip("/")
_JWT_SECRET = os.getenv("MCRM_JWT_SECRET", "")
_ADMIN_PHONE = os.getenv("MCRM_ADMIN_PHONE", "")
_ADMIN_PASSWORD = os.getenv("MCRM_ADMIN_PASSWORD", "")

_logger = logging.getLogger("hub-mcrm")

if not _ADMIN_PHONE or not _ADMIN_PASSWORD:
    if _JWT_SECRET:
        _logger.warning(
            "MCRM_ADMIN_PHONE and/or MCRM_ADMIN_PASSWORD not set. "
            "Falling back to local JWT generation with MCRM_JWT_SECRET."
        )
    else:
        _logger.warning(
            "MCRM_ADMIN_PHONE, MCRM_ADMIN_PASSWORD, and MCRM_JWT_SECRET are all unset. "
            "All tool calls will fail with 401 until the admin configures authentication."
        )

# ---------------------------------------------------------------------------
# Authentication — JWT token management
# ---------------------------------------------------------------------------
_auth_token: str | None = None
_auth_lock = asyncio.Lock()


async def _login() -> str | None:
    """Authenticate with the MCRM API via POST /api/auth/login.

    Stores the returned JWT in ``_auth_token``.  Falls back to locally-generated
    JWT (using ``MCRM_JWT_SECRET``) when API credentials are not configured.
    """
    global _auth_token

    if _ADMIN_PHONE and _ADMIN_PASSWORD:
        try:
            client = _get_client()
            resp = await client.post(
                "/api/auth/login",
                json={"phone": _ADMIN_PHONE, "password": _ADMIN_PASSWORD},
            )
            if resp.status_code == 200:
                data = resp.json()
                # Accept both { token } and { data: { token } } shapes
                token = (
                    data.get("token")
                    or data.get("access_token")
                    or (data.get("data") or {}).get("token")
                    or (data.get("data") or {}).get("access_token")
                )
                if token:
                    _auth_token = token
                    _logger.info("Successfully authenticated with MCRM API via /api/auth/login")
                    return token
            _logger.error("MCRM API login returned non-200: %s %s", resp.status_code, resp.text[:200])
        except Exception as exc:
            _logger.error("MCRM API login failed: %s", exc)

    # Fallback: generate a local JWT if the secret is configured
    if _JWT_SECRET:
        now = datetime.now(timezone.utc)
        payload = {
            "sub": 0,
            "phone": _ADMIN_PHONE,
            "role": "admin",
            "name": "mcp-server",
            "iat": now,
            "exp": now + timedelta(hours=24),
        }
        _auth_token = jwt.encode(payload, _JWT_SECRET, algorithm="HS256")
        _logger.info("Using locally-generated JWT (fallback)")
        return _auth_token

    _logger.error("No authentication method available")
    return None


async def _get_auth_token() -> str | None:
    """Return the cached auth token, logging in lazily if needed."""
    if _auth_token:
        return _auth_token
    async with _auth_lock:
        # Double-check after acquiring lock
        if _auth_token:
            return _auth_token
        return await _login()

# ---------------------------------------------------------------------------
# MCP Server
# ---------------------------------------------------------------------------
mcp = FastMCP(
    name="hub-mcrm",
    instructions=(
        "HUB-MCRM — Hvar Hub's customer-relationship & service-ticket management API. "
        "Use these tools to manage customers, tickets, stock, hub operations, "
        "call-center orders, Bosta shipping, and ERP integration. "
        "All tools return {status, data, error}. Admin-only endpoints are auto-authenticated."
    ),
)

# ---------------------------------------------------------------------------
# HTTP client helper
# ---------------------------------------------------------------------------
_client: httpx.AsyncClient | None = None


def _get_client() -> httpx.AsyncClient:
    global _client
    if _client is None or _client.is_closed:
        _client = httpx.AsyncClient(
            base_url=BASE_URL,
            timeout=30.0,
            headers={"Accept": "application/json", "Content-Type": "application/json"},
        )
    return _client


async def _request(
    method: str,
    path: str,
    *,
    path_params: dict[str, Any] | None = None,
    query_params: dict[str, Any] | None = None,
    body: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Unified async HTTP helper. Returns {status, data, error}.

    Automatically authenticates with the MCRM API.  On 401 responses the token
    is refreshed (re-login) and the request is retried exactly once.
    """
    client = _get_client()
    token = await _get_auth_token()
    headers: dict[str, str] = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    # Resolve path params
    resolved = path
    if path_params:
        for k, v in path_params.items():
            resolved = resolved.replace(f"{{{k}}}", str(v))

    # Clean query params (remove None / empty)
    qp = {k: v for k, v in (query_params or {}).items() if v is not None and v != ""}

    try:
        resp = await client.request(
            method,
            resolved,
            params=qp,
            json=body if body else None,
            headers=headers,
        )
        # --- 401 handling: re-authenticate and retry once ---
        if resp.status_code == 401:
            _logger.warning("Received 401 from %s %s — re-authenticating…", method, resolved)
            new_token = await _login()
            if new_token:
                headers["Authorization"] = f"Bearer {new_token}"
                resp = await client.request(
                    method,
                    resolved,
                    params=qp,
                    json=body if body else None,
                    headers=headers,
                )
            else:
                _logger.error("Re-authentication failed after 401")

        try:
            resp_data = resp.json()
        except Exception:
            resp_data = resp.text

        if resp.status_code < 400:
            return {"status": "ok", "data": resp_data, "error": None}
        return {"status": "error", "data": resp_data, "error": f"HTTP {resp.status_code}"}
    except httpx.ConnectError as exc:
        return {"status": "error", "data": None, "error": f"Connection failed: {exc}"}
    except httpx.TimeoutException as exc:
        return {"status": "error", "data": None, "error": f"Timeout: {exc}"}
    except Exception as exc:
        return {"status": "error", "data": None, "error": str(exc)}


# ---------------------------------------------------------------------------
# Resources
# ---------------------------------------------------------------------------

_MANIFEST_PATH = Path(__file__).resolve().parent.parent.parent / "docs" / "system" / "api-manifest.json"


@mcp.resource("mcrm://manifest")
async def resource_manifest() -> str:
    """api-manifest.json — full endpoint registry."""
    if _MANIFEST_PATH.exists():
        return _MANIFEST_PATH.read_text()
    return json.dumps({"error": "api-manifest.json not found"}, indent=2)


@mcp.resource("mcrm://health")
async def resource_health() -> str:
    """Live health check from the MCRM API."""
    result = await _request("GET", "/api/health")
    return json.dumps(result, indent=2, default=str)


# ===================================================================
# HEALTH (2 tools)
# ===================================================================


@mcp.tool()
async def mcrm_health() -> dict[str, Any]:
    """[Health] Check MCRM API health.

    Returns basic liveness info from the MCRM backend. No parameters required.
    """
    return await _request("GET", "/api/health")


@mcp.tool()
async def mcrm_db_health() -> dict[str, Any]:
    """[Health] Check MCRM database connectivity.

    Returns database health info including connection status and latency.
    """
    return await _request("GET", "/api/health/db")


# ===================================================================
# AUTH (7 tools)
# ===================================================================


@mcp.tool()
async def mcrm_login(phone: str, password: str) -> dict[str, Any]:
    """[Auth] Authenticate user and get session token.

    Args:
        phone: User phone number.
        password: User password.
    """
    return await _request("POST", "/api/auth/login", body={"phone": phone, "password": password})


@mcp.tool()
async def mcrm_register(
    phone: str,
    password: str,
    name: str,
    role: Optional[str] = None,
) -> dict[str, Any]:
    """[Auth · Admin] Create user — alias for mcrm_create_user (JWT admin required).

    Public self-registration was removed; use after admin login / MCP auth.
    """
    body: dict[str, Any] = {"phone": phone, "password": password, "name": name}
    if role:
        body["role"] = role
    return await _request("POST", "/api/auth/users", body=body)


@mcp.tool()
async def mcrm_list_users() -> dict[str, Any]:
    """[Auth · Admin] List all registered users.

    Returns all users in the system. Requires admin privileges (auto-authenticated).
    """
    return await _request("GET", "/api/auth/users")


@mcp.tool()
async def mcrm_create_user(
    phone: str,
    password: str,
    name: str,
    role: Optional[str] = None,
) -> dict[str, Any]:
    """[Auth · Admin] Create a new user (admin-only).

    Args:
        phone: Phone number for the new user.
        password: Password for the new user.
        name: Display name.
        role: Optional role (e.g. admin, agent, hub).
    """
    body: dict[str, Any] = {"phone": phone, "password": password, "name": name}
    if role:
        body["role"] = role
    return await _request("POST", "/api/auth/users", body=body)


@mcp.tool()
async def mcrm_delete_user(user_id: int) -> dict[str, Any]:
    """[Auth · Admin] Delete a user by ID (admin-only).

    Args:
        user_id: The ID of the user to delete.
    """
    return await _request("DELETE", "/api/auth/users/{user_id}", path_params={"user_id": user_id})


@mcp.tool()
async def mcrm_update_user_role(
    user_id: int,
    role: Optional[str] = None,
) -> dict[str, Any]:
    """[Auth · Admin] Update a user's role (admin-only).

    Args:
        user_id: The ID of the user to update.
        role: New role to assign (e.g. admin, agent, hub).
    """
    body: dict[str, Any] = {}
    if role is not None:
        body["role"] = role
    return await _request("PATCH", "/api/auth/users/{user_id}", path_params={"user_id": user_id}, body=body)


@mcp.tool()
async def mcrm_reset_user_password(
    user_id: int,
    password: str,
) -> dict[str, Any]:
    """[Auth · Admin] Reset a user's password (admin-only).

    Args:
        user_id: The ID of the user whose password to reset.
        password: The new password to set.
    """
    return await _request(
        "PATCH",
        "/api/auth/users/{user_id}/reset-password",
        path_params={"user_id": user_id},
        body={"password": password},
    )


# ===================================================================
# CUSTOMERS (5 tools)
# ===================================================================


@mcp.tool()
async def mcrm_list_customers(
    limit: Optional[int] = None,
    offset: Optional[int] = None,
) -> dict[str, Any]:
    """[Customers] List all customers with pagination.

    Args:
        limit: Max number of results per page.
        offset: Number of records to skip.
    """
    return await _request(
        "GET",
        "/api/customers/",
        query_params={"limit": limit, "offset": offset},
    )


@mcp.tool()
async def mcrm_create_customer(
    name: str,
    phone: str,
    phone_secondary: Optional[str] = None,
    governorate: Optional[str] = None,
    city: Optional[str] = None,
    address_details: Optional[str] = None,
) -> dict[str, Any]:
    """[Customers] Create a new customer record.

    Args:
        name: Customer full name.
        phone: Primary phone number.
        phone_secondary: Secondary/alternative phone number.
        governorate: Governorate (region/province).
        city: City name.
        address_details: Full street address or delivery details.
    """
    body: dict[str, Any] = {"name": name, "phone": phone}
    if phone_secondary is not None:
        body["phone_secondary"] = phone_secondary
    if governorate is not None:
        body["governorate"] = governorate
    if city is not None:
        body["city"] = city
    if address_details is not None:
        body["address_details"] = address_details
    return await _request("POST", "/api/customers/", body=body)


@mcp.tool()
async def mcrm_search_customers(
    q: str,
    type: Optional[str] = None,
    limit: Optional[int] = None,
    offset: Optional[int] = None,
) -> dict[str, Any]:
    """[Customers] Search customers by query string.

    Args:
        q: Search query — matches name, phone, or address.
        type: Optional search type filter.
        limit: Max number of results.
        offset: Number of records to skip.
    """
    return await _request(
        "GET",
        "/api/customers/search",
        query_params={"q": q, "type": type, "limit": limit, "offset": offset},
    )


@mcp.tool()
async def mcrm_get_customer(customer_id: int) -> dict[str, Any]:
    """[Customers] Get a customer by ID.

    Args:
        customer_id: The customer's unique identifier.
    """
    return await _request("GET", "/api/customers/{customer_id}", path_params={"customer_id": customer_id})


@mcp.tool()
async def mcrm_update_customer(
    customer_id: int,
    name: Optional[str] = None,
    phone: Optional[str] = None,
    governorate: Optional[str] = None,
    city: Optional[str] = None,
    address_details: Optional[str] = None,
    phone_secondary: Optional[str] = None,
) -> dict[str, Any]:
    """[Customers] Update an existing customer's details.

    Args:
        customer_id: The customer's unique identifier.
        name: Updated full name.
        phone: Updated primary phone.
        governorate: Updated governorate.
        city: Updated city.
        address_details: Updated address.
        phone_secondary: Updated secondary phone.
    """
    body: dict[str, Any] = {}
    if name is not None:
        body["name"] = name
    if phone is not None:
        body["phone"] = phone
    if governorate is not None:
        body["governorate"] = governorate
    if city is not None:
        body["city"] = city
    if address_details is not None:
        body["address_details"] = address_details
    if phone_secondary is not None:
        body["phone_secondary"] = phone_secondary
    return await _request(
        "PUT",
        "/api/customers/{customer_id}",
        path_params={"customer_id": customer_id},
        body=body,
    )


# ===================================================================
# TICKETS (11 tools)
# ===================================================================


@mcp.tool()
async def mcrm_create_ticket(
    type: str,
    user_id: Optional[int] = None,
    customer_id: Optional[int] = None,
    notes: Optional[str] = None,
    priority: Optional[str] = None,
    items: Optional[list] = None,
    original_tracking: Optional[str] = None,
    reason: Optional[str] = None,
    cost_adjustment: Optional[float] = None,
    name: Optional[str] = None,
    phone: Optional[str] = None,
    phone_secondary: Optional[str] = None,
    city: Optional[str] = None,
    governorate: Optional[str] = None,
    address_details: Optional[str] = None,
    customer_type: Optional[str] = None,
) -> dict[str, Any]:
    """[Tickets] Create a new service ticket.

    Ticket types: replacement, maintenance, return, sell.
    Requires either customer_id OR (name + phone).
    Items array required for replacement/sell types.

    Args:
        type: Ticket type — one of: replacement, maintenance, return, sell.
        user_id: ID of the user creating the ticket.
        customer_id: Existing customer ID (use instead of name/phone).
        notes: Additional notes about the ticket.
        priority: Priority level (e.g. high, normal, low).
        items: Array of items (required for replacement/sell).
        original_tracking: Original Bosta tracking number.
        reason: Reason for the service request.
        cost_adjustment: Any cost adjustment amount.
        name: Customer name (if creating new customer inline).
        phone: Customer phone (if creating new customer inline).
        phone_secondary: Secondary phone number.
        city: City for shipping.
        governorate: Governorate for shipping.
        address_details: Full address for shipping.
        customer_type: Customer type classification.
    """
    body: dict[str, Any] = {"type": type}
    if user_id is not None:
        body["user_id"] = user_id
    if customer_id is not None:
        body["customer_id"] = customer_id
    if notes is not None:
        body["notes"] = notes
    if priority is not None:
        body["priority"] = priority
    if items is not None:
        body["items"] = items
    if original_tracking is not None:
        body["original_tracking"] = original_tracking
    if reason is not None:
        body["reason"] = reason
    if cost_adjustment is not None:
        body["cost_adjustment"] = cost_adjustment
    if name is not None:
        body["name"] = name
    if phone is not None:
        body["phone"] = phone
    if phone_secondary is not None:
        body["phone_secondary"] = phone_secondary
    if city is not None:
        body["city"] = city
    if governorate is not None:
        body["governorate"] = governorate
    if address_details is not None:
        body["address_details"] = address_details
    if customer_type is not None:
        body["customer_type"] = customer_type
    return await _request("POST", "/api/tickets/create", body=body)


@mcp.tool()
async def mcrm_list_tickets(
    status: Optional[str] = None,
    customer_id: Optional[int] = None,
    service_type: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    search: Optional[str] = None,
    available_actions: Optional[str] = None,
    limit: Optional[int] = None,
    offset: Optional[int] = None,
    include_bosta: Optional[str] = None,
    force_sync: Optional[str] = None,
) -> dict[str, Any]:
    """[Tickets] List all tickets with filters and pagination.

    Args:
        status: Filter by ticket status.
        customer_id: Filter by customer ID.
        service_type: Filter by service type (replacement/maintenance/return/sell).
        start_date: Filter start date (ISO format).
        end_date: Filter end date (ISO format).
        search: Free-text search query.
        available_actions: Filter by available actions.
        limit: Max results per page.
        offset: Records to skip.
        include_bosta: Set to 'true' to include Bosta shipping data.
        force_sync: Set to 'true' to force sync with Bosta.
    """
    return await _request(
        "GET",
        "/api/tickets/",
        query_params={
            "status": status,
            "customer_id": customer_id,
            "service_type": service_type,
            "start_date": start_date,
            "end_date": end_date,
            "search": search,
            "available_actions": available_actions,
            "limit": limit,
            "offset": offset,
            "include_bosta": include_bosta,
            "force_sync": force_sync,
        },
    )


@mcp.tool()
async def mcrm_get_ticket_counts(
    force_refresh: Optional[str] = None,
) -> dict[str, Any]:
    """[Tickets] Get ticket counts grouped by status.

    Returns counts for replacement, maintenance, return, sell, and pending tickets.

    Args:
        force_refresh: Set to 'true' to bypass backend cache.
    """
    return await _request(
        "GET",
        "/api/tickets/counts",
        query_params={"force_refresh": force_refresh},
    )


@mcp.tool()
async def mcrm_get_ticket(
    ticket_id: int,
    include_bosta: Optional[str] = None,
) -> dict[str, Any]:
    """[Tickets] Get a single ticket by ID.

    Args:
        ticket_id: The ticket's unique identifier.
        include_bosta: Set to 'true' to include Bosta shipping data.
    """
    return await _request(
        "GET",
        "/api/tickets/{ticket_id}",
        path_params={"ticket_id": ticket_id},
        query_params={"include_bosta": include_bosta},
    )


@mcp.tool()
async def mcrm_get_ticket_history(ticket_id: int) -> dict[str, Any]:
    """[Tickets] Get the full status-change history of a ticket.

    Args:
        ticket_id: The ticket's unique identifier.
    """
    return await _request("GET", "/api/tickets/{ticket_id}/history", path_params={"ticket_id": ticket_id})


@mcp.tool()
async def mcrm_confirm_ticket(
    ticket_id: int,
    user_id: int,
    city: Optional[str] = None,
    governorate: Optional[str] = None,
    address_details: Optional[str] = None,
    original_tracking: Optional[str] = None,
    new_tracking_send: Optional[str] = None,
    cost_adjustment: Optional[float] = None,
    notes: Optional[str] = None,
    items: Optional[list] = None,
    phone: Optional[str] = None,
    phone_secondary: Optional[str] = None,
    name: Optional[str] = None,
    customer_id: Optional[int] = None,
    priority: Optional[str] = None,
    reason: Optional[str] = None,
) -> dict[str, Any]:
    """[Tickets] Confirm a ticket (e.g. approve replacement).

    Args:
        ticket_id: The ticket to confirm.
        user_id: ID of the confirming user.
        city: City for shipping.
        governorate: Governorate for shipping.
        address_details: Full address.
        original_tracking: Original tracking number.
        new_tracking_send: New outbound tracking number.
        cost_adjustment: Cost adjustment amount.
        notes: Confirmation notes.
        items: Items for replacement/sell.
        phone: Customer phone.
        phone_secondary: Secondary phone.
        name: Customer name.
        customer_id: Customer ID.
        priority: Priority level.
        reason: Reason for the ticket.
    """
    body: dict[str, Any] = {"user_id": user_id}
    if city is not None:
        body["city"] = city
    if governorate is not None:
        body["governorate"] = governorate
    if address_details is not None:
        body["address_details"] = address_details
    if original_tracking is not None:
        body["original_tracking"] = original_tracking
    if new_tracking_send is not None:
        body["new_tracking_send"] = new_tracking_send
    if cost_adjustment is not None:
        body["cost_adjustment"] = cost_adjustment
    if notes is not None:
        body["notes"] = notes
    if items is not None:
        body["items"] = items
    if phone is not None:
        body["phone"] = phone
    if phone_secondary is not None:
        body["phone_secondary"] = phone_secondary
    if name is not None:
        body["name"] = name
    if customer_id is not None:
        body["customer_id"] = customer_id
    if priority is not None:
        body["priority"] = priority
    if reason is not None:
        body["reason"] = reason
    return await _request(
        "POST",
        "/api/tickets/{ticket_id}/confirm",
        path_params={"ticket_id": ticket_id},
        body=body,
    )


@mcp.tool()
async def mcrm_cancel_ticket(
    ticket_id: int,
    user_id: int,
    reason: Optional[str] = None,
) -> dict[str, Any]:
    """[Tickets] Cancel a ticket.

    Args:
        ticket_id: The ticket to cancel.
        user_id: ID of the user cancelling.
        reason: Cancellation reason.
    """
    body: dict[str, Any] = {"user_id": user_id}
    if reason is not None:
        body["reason"] = reason
    return await _request(
        "POST",
        "/api/tickets/{ticket_id}/cancel",
        path_params={"ticket_id": ticket_id},
        body=body,
    )


@mcp.tool()
async def mcrm_delete_ticket(
    ticket_id: int,
    user_id: int,
) -> dict[str, Any]:
    """[Tickets] Delete a ticket permanently.

    Args:
        ticket_id: The ticket to delete.
        user_id: ID of the user performing the deletion.
    """
    return await _request(
        "DELETE",
        "/api/tickets/{ticket_id}",
        path_params={"ticket_id": ticket_id},
        body={"user_id": user_id},
    )


@mcp.tool()
async def mcrm_get_ticket_actions(ticket_id: int) -> dict[str, Any]:
    """[Tickets] Get available actions for a ticket.

    Returns a list of actions that can be performed on the ticket in its current state.

    Args:
        ticket_id: The ticket to query.
    """
    return await _request("GET", "/api/tickets/{ticket_id}/actions", path_params={"ticket_id": ticket_id})


@mcp.tool()
async def mcrm_execute_ticket_action(
    ticket_id: int,
    action: str,
    user_id: int,
    notes: Optional[str] = None,
    cost_adjustment: Optional[float] = None,
    items: Optional[list] = None,
    phone: Optional[str] = None,
    phone_secondary: Optional[str] = None,
    name: Optional[str] = None,
    customer_id: Optional[int] = None,
    priority: Optional[str] = None,
    reason: Optional[str] = None,
    tracking_number: Optional[str] = None,
    new_tracking_send: Optional[str] = None,
    new_tracking_receive: Optional[str] = None,
    item_validations: Optional[list] = None,
) -> dict[str, Any]:
    """[Tickets] Execute an action on a ticket.

    The action must be one of the available actions returned by mcrm_get_ticket_actions.
    Different actions accept different fields in the payload.

    Args:
        ticket_id: The ticket to act on.
        action: The action name (e.g. 'receive', 'send_to_workshop', 'dispatch').
        user_id: ID of the user performing the action.
        notes: Optional notes.
        cost_adjustment: Cost adjustment amount.
        items: Items array (for replacement/sell).
        phone: Customer phone.
        phone_secondary: Secondary phone.
        name: Customer name.
        customer_id: Customer ID.
        priority: Priority level.
        reason: Reason string.
        tracking_number: Tracking number.
        new_tracking_send: New outbound tracking.
        new_tracking_receive: New inbound tracking.
        item_validations: Item validation results.
    """
    body: dict[str, Any] = {"action": action, "user_id": user_id}
    if notes is not None:
        body["notes"] = notes
    if cost_adjustment is not None:
        body["cost_adjustment"] = cost_adjustment
    if items is not None:
        body["items"] = items
    if phone is not None:
        body["phone"] = phone
    if phone_secondary is not None:
        body["phone_secondary"] = phone_secondary
    if name is not None:
        body["name"] = name
    if customer_id is not None:
        body["customer_id"] = customer_id
    if priority is not None:
        body["priority"] = priority
    if reason is not None:
        body["reason"] = reason
    if tracking_number is not None:
        body["tracking_number"] = tracking_number
    if new_tracking_send is not None:
        body["new_tracking_send"] = new_tracking_send
    if new_tracking_receive is not None:
        body["new_tracking_receive"] = new_tracking_receive
    if item_validations is not None:
        body["item_validations"] = item_validations
    return await _request(
        "POST",
        "/api/tickets/{ticket_id}/action",
        path_params={"ticket_id": ticket_id},
        body=body,
    )


@mcp.tool()
async def mcrm_filter_tickets(
    service_type: Optional[str] = None,
    status: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    search: Optional[str] = None,
    export: Optional[str] = None,
) -> dict[str, Any]:
    """[Tickets] Advanced ticket filtering with full query parameters.

    Args:
        service_type: Filter by service type (replacement/maintenance/return/sell).
        status: Filter by ticket status.
        start_date: Filter start date (ISO format).
        end_date: Filter end date (ISO format).
        search: Free-text search across ticket fields.
        export: Set to 'true' to export results.
    """
    return await _request(
        "GET",
        "/api/tickets/filter",
        query_params={
            "service_type": service_type,
            "status": status,
            "start_date": start_date,
            "end_date": end_date,
            "search": search,
            "export": export,
        },
    )


# ===================================================================
# HUB (7 tools)
# ===================================================================


@mcp.tool()
async def mcrm_scan_tracking(
    tracking_number: str,
    include_bosta: Optional[str] = None,
) -> dict[str, Any]:
    """[Hub] Scan a tracking number to get ticket info and available actions.

    Args:
        tracking_number: Bosta tracking number to scan.
        include_bosta: Set to 'true' to include full Bosta order data.
    """
    return await _request(
        "GET",
        "/api/hub/scan/{tracking_number}",
        path_params={"tracking_number": tracking_number},
        query_params={"include_bosta": include_bosta},
    )


@mcp.tool()
async def mcrm_receive_package(
    tracking_number: str,
    user_id: int,
    condition: Optional[str] = None,
    location: Optional[str] = None,
    notes: Optional[str] = None,
) -> dict[str, Any]:
    """[Hub] Receive a package at the hub (scan receive).

    Args:
        tracking_number: Bosta tracking number of the incoming package.
        user_id: ID of the user receiving the package.
        condition: Package condition (e.g. good, damaged).
        location: Storage location in the hub.
        notes: Any additional notes.
    """
    body: dict[str, Any] = {"tracking_number": tracking_number, "user_id": user_id}
    if condition is not None:
        body["condition"] = condition
    if location is not None:
        body["location"] = location
    if notes is not None:
        body["notes"] = notes
    return await _request("POST", "/api/hub/scan/receive", body=body)


@mcp.tool()
async def mcrm_dispatch_package(
    tracking_number: str,
    user_id: int,
    destination: Optional[str] = None,
) -> dict[str, Any]:
    """[Hub] Dispatch a package from the hub.

    Args:
        tracking_number: Bosta tracking number to dispatch.
        user_id: ID of the user dispatching.
        destination: Dispatch destination info.
    """
    body: dict[str, Any] = {"tracking_number": tracking_number, "user_id": user_id}
    if destination is not None:
        body["destination"] = destination
    return await _request("POST", "/api/hub/scan/dispatch", body=body)


@mcp.tool()
async def mcrm_get_workshop_queue() -> dict[str, Any]:
    """[Hub] Get the workshop queue — tickets awaiting or in maintenance.

    Returns all tickets currently in the workshop for repair/maintenance.
    """
    return await _request("GET", "/api/hub/queues/workshop")


@mcp.tool()
async def mcrm_get_pending_dispatch_queue() -> dict[str, Any]:
    """[Hub] Get the pending dispatch queue — tickets ready to ship.

    Returns all tickets that have completed processing and are waiting for dispatch.
    """
    return await _request("GET", "/api/hub/queues/pending-dispatch")


@mcp.tool()
async def mcrm_complete_maintenance(
    ticket_id: int,
    user_id: int,
    notes: Optional[str] = None,
    cost_adjustment: Optional[float] = None,
    items: Optional[list] = None,
) -> dict[str, Any]:
    """[Hub] Mark a maintenance ticket as completed in the workshop.

    Args:
        ticket_id: The maintenance ticket to complete.
        user_id: ID of the technician completing the work.
        notes: Workshop notes about the completed maintenance.
        cost_adjustment: Any additional costs incurred.
        items: Items used or replaced during maintenance.
    """
    body: dict[str, Any] = {"ticket_id": ticket_id, "user_id": user_id}
    if notes is not None:
        body["notes"] = notes
    if cost_adjustment is not None:
        body["cost_adjustment"] = cost_adjustment
    if items is not None:
        body["items"] = items
    return await _request("POST", "/api/hub/workshop/complete", body=body)


@mcp.tool()
async def mcrm_mark_ready(
    ticket_id: int,
    user_id: int,
    new_tracking_send: Optional[str] = None,
    notes: Optional[str] = None,
    cost_adjustment: Optional[float] = None,
) -> dict[str, Any]:
    """[Hub] Mark a ticket as ready for dispatch.

    Args:
        ticket_id: The ticket to mark ready.
        user_id: ID of the user marking it ready.
        new_tracking_send: New outbound Bosta tracking number.
        notes: Any notes.
        cost_adjustment: Cost adjustment amount.
    """
    body: dict[str, Any] = {"ticket_id": ticket_id, "user_id": user_id}
    if new_tracking_send is not None:
        body["new_tracking_send"] = new_tracking_send
    if notes is not None:
        body["notes"] = notes
    if cost_adjustment is not None:
        body["cost_adjustment"] = cost_adjustment
    return await _request("POST", "/api/hub/workshop/mark-ready", body=body)


# ===================================================================
# STOCK (11 tools)
# ===================================================================


@mcp.tool()
async def mcrm_list_stock_items(
    type: Optional[str] = None,
    limit: Optional[int] = None,
    offset: Optional[int] = None,
    active_only: Optional[str] = None,
) -> dict[str, Any]:
    """[Stock] List all stock items with filters.

    Args:
        type: Filter by type (product or part).
        limit: Max results per page.
        offset: Records to skip.
        active_only: Set to 'true' to show only active items.
    """
    return await _request(
        "GET",
        "/api/stock/items",
        query_params={"type": type, "limit": limit, "offset": offset, "active_only": active_only},
    )


@mcp.tool()
async def mcrm_create_stock_item(
    sku: str,
    name: str,
    type: str,
    quantity_on_hand: Optional[int] = None,
    user_id: Optional[int] = None,
    price_customer: Optional[float] = None,
    price_merchant: Optional[float] = None,
    components: Optional[list] = None,
) -> dict[str, Any]:
    """[Stock] Create a new stock item.

    Args:
        sku: Stock keeping unit (unique identifier).
        name: Item display name.
        type: Item type — one of: product, part.
        quantity_on_hand: Initial stock quantity.
        user_id: ID of the user creating the item.
        price_customer: Selling price to customers.
        price_merchant: Cost price from merchants/suppliers.
        components: Array of component definitions (for products).
    """
    body: dict[str, Any] = {"sku": sku, "name": name, "type": type}
    if quantity_on_hand is not None:
        body["quantity_on_hand"] = quantity_on_hand
    if user_id is not None:
        body["user_id"] = user_id
    if price_customer is not None:
        body["price_customer"] = price_customer
    if price_merchant is not None:
        body["price_merchant"] = price_merchant
    if components is not None:
        body["components"] = components
    return await _request("POST", "/api/stock/items", body=body)


@mcp.tool()
async def mcrm_get_stock_item(item_id: int) -> dict[str, Any]:
    """[Stock] Get a stock item by ID.

    Args:
        item_id: The stock item's unique identifier.
    """
    return await _request("GET", "/api/stock/items/{item_id}", path_params={"item_id": item_id})


@mcp.tool()
async def mcrm_update_stock_item(
    item_id: int,
    sku: Optional[str] = None,
    name: Optional[str] = None,
    active: Optional[bool] = None,
    user_id: Optional[int] = None,
    price_customer: Optional[float] = None,
    price_merchant: Optional[float] = None,
) -> dict[str, Any]:
    """[Stock] Update an existing stock item.

    Args:
        item_id: The stock item's unique identifier.
        sku: Updated SKU.
        name: Updated display name.
        active: Whether the item is active.
        user_id: ID of the user making the update.
        price_customer: Updated customer price.
        price_merchant: Updated merchant price.
    """
    body: dict[str, Any] = {}
    if sku is not None:
        body["sku"] = sku
    if name is not None:
        body["name"] = name
    if active is not None:
        body["active"] = active
    if user_id is not None:
        body["user_id"] = user_id
    if price_customer is not None:
        body["price_customer"] = price_customer
    if price_merchant is not None:
        body["price_merchant"] = price_merchant
    return await _request(
        "PUT",
        "/api/stock/items/{item_id}",
        path_params={"item_id": item_id},
        body=body,
    )


@mcp.tool()
async def mcrm_delete_stock_item(item_id: int) -> dict[str, Any]:
    """[Stock] Delete a stock item.

    Args:
        item_id: The stock item to delete.
    """
    return await _request("DELETE", "/api/stock/items/{item_id}", path_params={"item_id": item_id})


@mcp.tool()
async def mcrm_adjust_stock_quantity(
    item_id: int,
    quantity_delta: int,
    reason: str,
    user_id: int,
) -> dict[str, Any]:
    """[Stock] Adjust the quantity of a stock item.

    Args:
        item_id: The stock item to adjust.
        quantity_delta: Amount to add (positive) or remove (negative).
        reason: Reason for the adjustment.
        user_id: ID of the user making the adjustment.
    """
    return await _request(
        "POST",
        "/api/stock/items/{item_id}/adjust",
        path_params={"item_id": item_id},
        body={"quantity_delta": quantity_delta, "reason": reason, "user_id": user_id},
    )


@mcp.tool()
async def mcrm_add_product_component(
    product_id: int,
    part_id: int,
    quantity_needed: int,
) -> dict[str, Any]:
    """[Stock] Add a component (part) to a product's bill of materials.

    Args:
        product_id: The product to add the component to.
        part_id: The part (stock item) to add as a component.
        quantity_needed: Number of this part needed per product.
    """
    return await _request(
        "POST",
        "/api/stock/items/{product_id}/components",
        path_params={"product_id": product_id},
        body={"part_id": part_id, "quantity_needed": quantity_needed},
    )


@mcp.tool()
async def mcrm_remove_product_component(
    product_id: int,
    component_id: int,
) -> dict[str, Any]:
    """[Stock] Remove a component from a product's bill of materials.

    Args:
        product_id: The product to remove the component from.
        component_id: The component relationship ID to remove.
    """
    return await _request(
        "DELETE",
        "/api/stock/items/{product_id}/components/{component_id}",
        path_params={"product_id": product_id, "component_id": component_id},
    )


@mcp.tool()
async def mcrm_manual_stock_adjustment(
    sku: str,
    quantity: int,
    condition: Optional[str] = None,
    user_id: Optional[int] = None,
    ticket_id: Optional[int] = None,
    notes: Optional[str] = None,
) -> dict[str, Any]:
    """[Stock] Manual stock adjustment by SKU.

    Args:
        sku: SKU of the item to adjust.
        quantity: New quantity to set.
        condition: Item condition (e.g. new, used, refurbished).
        user_id: ID of the user performing the adjustment.
        ticket_id: Associated ticket ID (if applicable).
        notes: Notes about the adjustment.
    """
    body: dict[str, Any] = {"sku": sku, "quantity": quantity}
    if condition is not None:
        body["condition"] = condition
    if user_id is not None:
        body["user_id"] = user_id
    if ticket_id is not None:
        body["ticket_id"] = ticket_id
    if notes is not None:
        body["notes"] = notes
    return await _request("POST", "/api/stock/manual", body=body)


@mcp.tool()
async def mcrm_list_stock_movements(
    item_id: Optional[int] = None,
    movement_type: Optional[str] = None,
    reference_type: Optional[str] = None,
    reference_id: Optional[int] = None,
    created_by: Optional[int] = None,
    condition: Optional[str] = None,
    item_type: Optional[str] = None,
    service_type: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: Optional[int] = None,
    offset: Optional[int] = None,
    order_by: Optional[str] = None,
    order_direction: Optional[str] = None,
) -> dict[str, Any]:
    """[Stock] List stock movement history with advanced filters.

    Args:
        item_id: Filter by stock item ID.
        movement_type: Filter by movement type.
        reference_type: Filter by reference type (ticket, manual, etc.).
        reference_id: Filter by reference ID.
        created_by: Filter by user who created the movement.
        condition: Filter by item condition.
        item_type: Filter by item type (product/part).
        service_type: Filter by service type.
        start_date: Filter start date (ISO format).
        end_date: Filter end date (ISO format).
        limit: Max results per page.
        offset: Records to skip.
        order_by: Field to order by.
        order_direction: Order direction (asc/desc).
    """
    return await _request(
        "GET",
        "/api/stock/movements",
        query_params={
            "item_id": item_id,
            "movement_type": movement_type,
            "reference_type": reference_type,
            "reference_id": reference_id,
            "created_by": created_by,
            "condition": condition,
            "item_type": item_type,
            "service_type": service_type,
            "start_date": start_date,
            "end_date": end_date,
            "limit": limit,
            "offset": offset,
            "order_by": order_by,
            "order_direction": order_direction,
        },
    )


@mcp.tool()
async def mcrm_export_stock(
    item_type: Optional[str] = None,
) -> dict[str, Any]:
    """[Stock] Export stock items (returns data or file).

    Args:
        item_type: Filter by item type (product/part) for export.
    """
    return await _request(
        "GET",
        "/api/stock/export",
        query_params={"item_type": item_type},
    )


# ===================================================================
# BOSTA (5 tools)
# ===================================================================


@mcp.tool()
async def mcrm_bosta_search(
    phone: Optional[str] = None,
    name: Optional[str] = None,
    tracking: Optional[str] = None,
    page: Optional[int] = None,
    limit: Optional[int] = None,
    group: Optional[str] = None,
) -> dict[str, Any]:
    """[Bosta] Search Bosta deliveries by phone, name, or tracking number.

    Args:
        phone: Customer phone number to search.
        name: Customer name to search.
        tracking: Bosta tracking number.
        page: Page number for pagination.
        limit: Results per page.
        group: Group results (e.g. by status).
    """
    body: dict[str, Any] = {}
    if phone is not None:
        body["phone"] = phone
    if name is not None:
        body["name"] = name
    if tracking is not None:
        body["tracking"] = tracking
    if page is not None:
        body["page"] = page
    if limit is not None:
        body["limit"] = limit
    if group is not None:
        body["group"] = group
    return await _request("POST", "/api/bosta/search", body=body)


@mcp.tool()
async def mcrm_bosta_get_order(
    tracking_number: str,
    force_sync: Optional[str] = None,
) -> dict[str, Any]:
    """[Bosta] Get a Bosta order by tracking number.

    Args:
        tracking_number: Bosta tracking number.
        force_sync: Set to 'true' to force refresh from Bosta API.
    """
    return await _request(
        "GET",
        "/api/bosta/order/{tracking_number}",
        path_params={"tracking_number": tracking_number},
        query_params={"force_sync": force_sync},
    )


@mcp.tool()
async def mcrm_bosta_customer_orders(
    phone_number: str,
    enrich: Optional[str] = None,
) -> dict[str, Any]:
    """[Bosta] Get all Bosta orders for a customer by phone.

    Args:
        phone_number: Customer phone number.
        enrich: Set to 'true' to include enriched order data.
    """
    return await _request(
        "GET",
        "/api/bosta/customer/{phone_number}/orders",
        path_params={"phone_number": phone_number},
        query_params={"enrich": enrich},
    )


@mcp.tool()
async def mcrm_bosta_customer_sync(phone_number: str) -> dict[str, Any]:
    """[Bosta] Sync Bosta customer data by phone number.

    Fetches latest delivery status from Bosta for all orders associated with this phone.

    Args:
        phone_number: Customer phone number to sync.
    """
    return await _request(
        "POST",
        "/api/bosta/customer/{phone_number}/sync",
        path_params={"phone_number": phone_number},
    )


@mcp.tool()
async def mcrm_bosta_health() -> dict[str, Any]:
    """[Bosta] Check Bosta API integration health.

    Returns connectivity status to the Bosta shipping API.
    """
    return await _request("GET", "/api/bosta/health")


# ===================================================================
# CALL CENTER (16 tools)
# ===================================================================


@mcp.tool()
async def mcrm_cc_health() -> dict[str, Any]:
    """[Call Center] Check call center API health.

    Returns the health status of the call center module.
    """
    return await _request("GET", "/api/call-center/health")


@mcp.tool()
async def mcrm_cc_create_order(
    source: str,
    call_type: str,
    customer_phone: str,
    customer_name: Optional[str] = None,
    delivery_address: Optional[str] = None,
    governorate: Optional[str] = None,
    city: Optional[str] = None,
    cod_amount: Optional[float] = None,
) -> dict[str, Any]:
    """[Call Center] Create a new call center order.

    Args:
        source: Order source (e.g. direct, erp).
        call_type: Type of call (e.g. sell, replacement, return, maintenance, ask).
        customer_phone: Customer phone number (required).
        customer_name: Customer name.
        delivery_address: Delivery address.
        governorate: Governorate.
        city: City.
        cod_amount: Cash on delivery amount.
    """
    body: dict[str, Any] = {"source": source, "call_type": call_type, "customer_phone": customer_phone}
    if customer_name is not None:
        body["customer_name"] = customer_name
    if delivery_address is not None:
        body["delivery_address"] = delivery_address
    if governorate is not None:
        body["governorate"] = governorate
    if city is not None:
        body["city"] = city
    if cod_amount is not None:
        body["cod_amount"] = cod_amount
    return await _request("POST", "/api/call-center/orders", body=body)


@mcp.tool()
async def mcrm_cc_list_orders(
    status: Optional[str] = None,
    source: Optional[str] = None,
    service_type: Optional[str] = None,
    search: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    today: Optional[str] = None,
    governorate: Optional[str] = None,
    statuses: Optional[str] = None,
    min_attempts: Optional[int] = None,
    attempts: Optional[int] = None,
    all_dates: Optional[str] = None,
    page: Optional[int] = None,
    per_page: Optional[int] = None,
) -> dict[str, Any]:
    """[Call Center] List call center orders with filters and pagination.

    Args:
        status: Filter by status (new, scheduled, confirmed, all).
        source: Filter by source.
        service_type: Filter by service type.
        search: Free-text search.
        date_from: Start date filter (ISO format).
        date_to: End date filter (ISO format).
        today: Set to 'true' to filter today's orders only.
        governorate: Filter by governorate.
        statuses: Comma-separated list of statuses.
        min_attempts: Minimum attempt count.
        attempts: Filter by exact attempt count.
        all_dates: Set to 'true' to include all dates.
        page: Page number.
        per_page: Results per page.
    """
    return await _request(
        "GET",
        "/api/call-center/orders",
        query_params={
            "status": status,
            "source": source,
            "service_type": service_type,
            "search": search,
            "date_from": date_from,
            "date_to": date_to,
            "today": today,
            "governorate": governorate,
            "statuses": statuses,
            "min_attempts": min_attempts,
            "attempts": attempts,
            "all_dates": all_dates,
            "page": page,
            "per_page": per_page,
        },
    )


@mcp.tool()
async def mcrm_cc_order_dates() -> dict[str, Any]:
    """[Call Center] Get dates that have order data.

    Returns a list of dates that contain at least one order, useful for date-picker UIs.
    """
    return await _request("GET", "/api/call-center/orders/dates-with-data")


@mcp.tool()
async def mcrm_cc_order_counts(
    date: Optional[str] = None,
    dates: Optional[str] = None,
    today: Optional[str] = None,
) -> dict[str, Any]:
    """[Call Center] Get order counts by status.

    Args:
        date: Specific date to get counts for (ISO format).
        dates: Comma-separated list of dates.
        today: Set to 'true' for today's counts.
    """
    return await _request(
        "GET",
        "/api/call-center/orders/counts",
        query_params={"date": date, "dates": dates, "today": today},
    )


@mcp.tool()
async def mcrm_cc_get_order(order_id: int) -> dict[str, Any]:
    """[Call Center] Get a single order by ID with full details.

    Returns the order, its call history, and associated ticket (if converted).

    Args:
        order_id: The order's unique identifier.
    """
    return await _request(
        "GET",
        "/api/call-center/orders/{order_id}",
        path_params={"order_id": order_id},
    )


@mcp.tool()
async def mcrm_cc_sync_from_erp(
    username: Optional[str] = None,
    password: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    force: Optional[str] = None,
) -> dict[str, Any]:
    """[Call Center] Sync sell orders from ERP system.

    Fetches draft orders from the ERP and creates corresponding call center orders.
    Bosta data is auto-enriched during sync.

    Args:
        username: ERP username (falls back to env ERP_DEFAULT_USERNAME).
        password: ERP password (falls back to env ERP_DEFAULT_PASSWORD).
        start_date: Start date for sync range (ISO format).
        end_date: End date for sync range (ISO format).
        force: Set to 'true' to force re-sync existing orders.
    """
    body: dict[str, Any] = {}
    if username is not None:
        body["username"] = username
    if password is not None:
        body["password"] = password
    if start_date is not None:
        body["start_date"] = start_date
    if end_date is not None:
        body["end_date"] = end_date
    if force is not None:
        body["force"] = force
    return await _request("POST", "/api/call-center/orders/sync-from-erp", body=body)


@mcp.tool()
async def mcrm_cc_confirm_by_customer(
    order_id: int,
    call_type: str,
    items: Optional[list] = None,
    items_to_send: Optional[list] = None,
    items_to_receive: Optional[list] = None,
    user_id: Optional[int] = None,
    customer_name: Optional[str] = None,
    customer_phone: Optional[str] = None,
    delivery_address: Optional[str] = None,
    governorate: Optional[str] = None,
    city: Optional[str] = None,
    cod_amount: Optional[float] = None,
    notes: Optional[str] = None,
    agent_name: Optional[str] = None,
    original_tracking: Optional[str] = None,
    cost_adjustment: Optional[float] = None,
) -> dict[str, Any]:
    """[Call Center] Agent confirms an order with the customer.

    Order status changes to 'confirmed'. Creates a confirmation snapshot for leader review.

    Args:
        order_id: The order to confirm.
        call_type: Type of call/service (sell, replacement, return, maintenance).
        items: Items array for the order.
        items_to_send: Items to send (for replacements).
        items_to_receive: Items to receive (for returns/maintenance).
        user_id: Agent user ID.
        customer_name: Customer name.
        customer_phone: Customer phone.
        delivery_address: Delivery address.
        governorate: Governorate.
        city: City.
        cod_amount: COD amount.
        notes: Confirmation notes.
        agent_name: Agent display name.
        original_tracking: Original tracking number.
        cost_adjustment: Cost adjustment.
    """
    body: dict[str, Any] = {"call_type": call_type}
    if items is not None:
        body["items"] = items
    if items_to_send is not None:
        body["items_to_send"] = items_to_send
    if items_to_receive is not None:
        body["items_to_receive"] = items_to_receive
    if user_id is not None:
        body["user_id"] = user_id
    if customer_name is not None:
        body["customer_name"] = customer_name
    if customer_phone is not None:
        body["customer_phone"] = customer_phone
    if delivery_address is not None:
        body["delivery_address"] = delivery_address
    if governorate is not None:
        body["governorate"] = governorate
    if city is not None:
        body["city"] = city
    if cod_amount is not None:
        body["cod_amount"] = cod_amount
    if notes is not None:
        body["notes"] = notes
    if agent_name is not None:
        body["agent_name"] = agent_name
    if original_tracking is not None:
        body["original_tracking"] = original_tracking
    if cost_adjustment is not None:
        body["cost_adjustment"] = cost_adjustment
    return await _request(
        "POST",
        "/api/call-center/orders/{order_id}/confirm-by-customer",
        path_params={"order_id": order_id},
        body=body,
    )


@mcp.tool()
async def mcrm_cc_leader_approve(
    order_id: int,
    user_id: Optional[int] = None,
    call_type: Optional[str] = None,
    customer: Optional[dict] = None,
    new_tracking_send: Optional[str] = None,
    new_tracking_receive: Optional[str] = None,
    items: Optional[list] = None,
    cod_amount: Optional[float] = None,
    cost_adjustment: Optional[float] = None,
    order_description: Optional[str] = None,
    notes: Optional[str] = None,
    original_tracking: Optional[str] = None,
) -> dict[str, Any]:
    """[Call Center] Leader approves a confirmed order — creates ticket.

    Creates a service ticket from the confirmation snapshot. Order status changes to 'converted'.

    Args:
        order_id: The order to approve.
        user_id: Leader user ID.
        call_type: Service type override.
        customer: Customer info override.
        new_tracking_send: New outbound tracking number.
        new_tracking_receive: New inbound tracking number.
        items: Items override.
        cod_amount: COD amount override.
        cost_adjustment: Cost adjustment.
        order_description: Description of the order.
        notes: Approval notes.
        original_tracking: Original tracking number.
    """
    body: dict[str, Any] = {}
    if user_id is not None:
        body["user_id"] = user_id
    if call_type is not None:
        body["call_type"] = call_type
    if customer is not None:
        body["customer"] = customer
    if new_tracking_send is not None:
        body["new_tracking_send"] = new_tracking_send
    if new_tracking_receive is not None:
        body["new_tracking_receive"] = new_tracking_receive
    if items is not None:
        body["items"] = items
    if cod_amount is not None:
        body["cod_amount"] = cod_amount
    if cost_adjustment is not None:
        body["cost_adjustment"] = cost_adjustment
    if order_description is not None:
        body["order_description"] = order_description
    if notes is not None:
        body["notes"] = notes
    if original_tracking is not None:
        body["original_tracking"] = original_tracking
    return await _request(
        "POST",
        "/api/call-center/orders/{order_id}/leader-approve",
        path_params={"order_id": order_id},
        body=body,
    )


@mcp.tool()
async def mcrm_cc_leader_reject(
    order_id: int,
    rejection_reason: Optional[str] = None,
) -> dict[str, Any]:
    """[Call Center] Leader rejects a confirmed order.

    Order status returns to 'new' and the confirmation snapshot is cleared.

    Args:
        order_id: The order to reject.
        rejection_reason: Reason for rejection (shown to the agent).
    """
    body: dict[str, Any] = {}
    if rejection_reason is not None:
        body["rejection_reason"] = rejection_reason
    return await _request(
        "POST",
        "/api/call-center/orders/{order_id}/reject",
        path_params={"order_id": order_id},
        body=body,
    )


@mcp.tool()
async def mcrm_cc_schedule_order(
    order_id: int,
    call_type: str,
    callback_at: str,
    agent_id: Optional[int] = None,
    agent_name: Optional[str] = None,
    notes: Optional[str] = None,
) -> dict[str, Any]:
    """[Call Center] Schedule a callback for an order.

    Order status changes to 'scheduled'.

    Args:
        order_id: The order to schedule.
        call_type: Type of call (sell, replacement, return, maintenance, ask).
        callback_at: Scheduled callback time (ISO datetime).
        agent_id: ID of the assigned agent.
        agent_name: Name of the assigned agent.
        notes: Scheduling notes.
    """
    body: dict[str, Any] = {"call_type": call_type, "callback_at": callback_at}
    if agent_id is not None:
        body["agent_id"] = agent_id
    if agent_name is not None:
        body["agent_name"] = agent_name
    if notes is not None:
        body["notes"] = notes
    return await _request(
        "POST",
        "/api/call-center/orders/{order_id}/schedule",
        path_params={"order_id": order_id},
        body=body,
    )


@mcp.tool()
async def mcrm_cc_no_answer(
    order_id: int,
    call_type: str,
    agent_id: Optional[int] = None,
    agent_name: Optional[str] = None,
    notes: Optional[str] = None,
) -> dict[str, Any]:
    """[Call Center] Log a no-answer call attempt.

    Increments the attempt counter and may schedule a next action.

    Args:
        order_id: The order being called.
        call_type: Type of call attempted.
        agent_id: ID of the calling agent.
        agent_name: Name of the calling agent.
        notes: Notes about the attempt.
    """
    body: dict[str, Any] = {"call_type": call_type}
    if agent_id is not None:
        body["agent_id"] = agent_id
    if agent_name is not None:
        body["agent_name"] = agent_name
    if notes is not None:
        body["notes"] = notes
    return await _request(
        "POST",
        "/api/call-center/orders/{order_id}/no-answer",
        path_params={"order_id": order_id},
        body=body,
    )


@mcp.tool()
async def mcrm_cc_cancel_order(
    order_id: int,
    call_type: str,
    cancellation_reason: Optional[str] = None,
    agent_id: Optional[int] = None,
    agent_name: Optional[str] = None,
    notes: Optional[str] = None,
) -> dict[str, Any]:
    """[Call Center] Cancel an order.

    Order status changes to 'cancelled'.

    Args:
        order_id: The order to cancel.
        call_type: Type of call that led to cancellation.
        cancellation_reason: Reason for cancellation.
        agent_id: ID of the cancelling agent.
        agent_name: Name of the cancelling agent.
        notes: Additional notes.
    """
    body: dict[str, Any] = {"call_type": call_type}
    if cancellation_reason is not None:
        body["cancellation_reason"] = cancellation_reason
    if agent_id is not None:
        body["agent_id"] = agent_id
    if agent_name is not None:
        body["agent_name"] = agent_name
    if notes is not None:
        body["notes"] = notes
    return await _request(
        "POST",
        "/api/call-center/orders/{order_id}/cancel",
        path_params={"order_id": order_id},
        body=body,
    )


@mcp.tool()
async def mcrm_cc_list_pending(
    source: Optional[str] = None,
    service_type: Optional[str] = None,
    page: Optional[int] = None,
    per_page: Optional[int] = None,
) -> dict[str, Any]:
    """[Call Center] List orders pending leader approval (status=confirmed).

    Args:
        source: Filter by order source.
        service_type: Filter by service type.
        page: Page number.
        per_page: Results per page.
    """
    return await _request(
        "GET",
        "/api/call-center/pending",
        query_params={"source": source, "service_type": service_type, "page": page, "per_page": per_page},
    )


@mcp.tool()
async def mcrm_cc_list_calls(
    call_type: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    customer_phone: Optional[str] = None,
    customer_id: Optional[int] = None,
    limit: Optional[int] = None,
) -> dict[str, Any]:
    """[Call Center] List call history records.

    Args:
        call_type: Filter by call type (sell, replacement, return, maintenance, ask).
        date_from: Start date filter (ISO format).
        date_to: End date filter (ISO format).
        customer_phone: Filter by customer phone.
        customer_id: Filter by customer ID.
        limit: Max results to return.
    """
    return await _request(
        "GET",
        "/api/call-center/calls",
        query_params={
            "call_type": call_type,
            "date_from": date_from,
            "date_to": date_to,
            "customer_phone": customer_phone,
            "customer_id": customer_id,
            "limit": limit,
        },
    )


@mcp.tool()
async def mcrm_cc_ask_only(
    customer_phone: str,
    agent_id: Optional[int] = None,
    agent_name: Optional[str] = None,
    notes: Optional[str] = None,
) -> dict[str, Any]:
    """[Call Center] Log an ASK-only call (inquiry, no order/ticket).

    Records a customer inquiry call that doesn't result in an order or ticket.

    Args:
        customer_phone: Customer phone number.
        agent_id: ID of the agent who took the call.
        agent_name: Name of the agent.
        notes: Call notes/inquiry details.
    """
    body: dict[str, Any] = {"customer_phone": customer_phone}
    if agent_id is not None:
        body["agent_id"] = agent_id
    if agent_name is not None:
        body["agent_name"] = agent_name
    if notes is not None:
        body["notes"] = notes
    return await _request("POST", "/api/call-center/calls/ask-only", body=body)


# ===================================================================
# ERP (1 tool)
# ===================================================================


@mcp.tool()
async def mcrm_erp_get_drafts(
    username: Optional[str] = None,
    password: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> dict[str, Any]:
    """[ERP] Get ERP sell orders in draft status awaiting confirmation.

    If username/password are not provided, uses ERP_DEFAULT_USERNAME and
    ERP_DEFAULT_PASSWORD from environment variables.

    Args:
        username: ERP API username (optional, falls back to env).
        password: ERP API password (optional, falls back to env).
        start_date: Start date for draft orders (ISO format).
        end_date: End date for draft orders (ISO format).
    """
    return await _request(
        "GET",
        "/api/erp/drafts",
        query_params={
            "username": username,
            "password": password,
            "start_date": start_date,
            "end_date": end_date,
        },
    )


# --------------------------------------------------------------------------- #
# Body Reflex Tools (Composite)
# --------------------------------------------------------------------------- #
# These tools combine multiple API calls into single intelligent responses,
# providing a "nervous system" layer over the fine-grained endpoints above.
# They use asyncio.gather for parallel execution and handle partial failures
# gracefully — if one sub-call fails, the others are still returned.


async def _safe_get(path: str, *, timeout: float = 15.0, admin: bool = False) -> dict[str, Any]:
    """Fire-and-forget GET that always returns a dict (never raises)."""
    client = _get_client()
    token = await _get_auth_token()
    headers: dict[str, str] = {"Authorization": f"Bearer {token}"} if token else {}
    try:
        resp = await client.request("GET", path, headers=headers, timeout=timeout)
        try:
            data = resp.json()
        except Exception:
            data = resp.text
        if resp.status_code < 400:
            return {"status": "ok", "data": data}
        return {"status": "error", "data": data, "error": f"HTTP {resp.status_code}"}
    except Exception as exc:
        return {"status": "error", "data": None, "error": str(exc)}


@mcp.tool()
async def mcrm_pulse() -> str:
    """[Body Reflex · Brain] Full system pulse check — API health, DB health, ticket counts, call-center counts.

    Combines four health/status endpoints into a single response. Use this to quickly
    assess whether the entire MCRM system is operational. Returns 'alive' if all
    endpoints return 200, 'degraded' otherwise.
    """
    api_health, db_health, ticket_counts, call_counts = await asyncio.gather(
        _safe_get("/api/health"),
        _safe_get("/api/health/db"),
        _safe_get("/api/tickets/counts"),
        _safe_get("/api/call-center/orders/counts?today=true"),
    )
    all_ok = all(r["status"] == "ok" for r in [api_health, db_health, ticket_counts, call_counts])
    result = {
        "pulse": "alive" if all_ok else "degraded",
        "organs": {
            "api": api_health,
            "db": db_health,
            "tickets": ticket_counts,
            "call_center": call_counts,
        },
    }
    return json.dumps(result, ensure_ascii=False, default=str)


@mcp.tool()
async def mcrm_daily_digest() -> str:
    """[Body Reflex · Brain] Daily operational digest — combines ALL body reflexes into one call.

    Runs pulse, call_radar, workshop_view, and stock_brief in parallel, giving you
    a complete snapshot of the system's current state. Ideal for morning briefings
    or periodic status checks.
    """
    pulse_task = asyncio.create_task(mcrm_pulse())
    radar_task = asyncio.create_task(mcrm_call_radar())
    workshop_task = asyncio.create_task(mcrm_workshop_view())
    stock_task = asyncio.create_task(mcrm_stock_brief())

    pulse_str, radar_str, workshop_str, stock_str = await asyncio.gather(
        pulse_task, radar_task, workshop_task, stock_task
    )

    def _parse(s: str) -> Any:
        try:
            return json.loads(s)
        except Exception:
            return s

    result = {
        "digest": {"generated_at": __import__("datetime").datetime.utcnow().isoformat()},
        "brain": _parse(pulse_str),
        "ears": _parse(radar_str),
        "arms": _parse(workshop_str),
        "bones": _parse(stock_str),
    }
    return json.dumps(result, ensure_ascii=False, default=str)


@mcp.tool()
async def mcrm_omniscan(tracking_number: str) -> str:
    """[Body Reflex · Eyes] Universal tracking scan — looks up a tracking number across Hub scans and Bosta.

    Parallel queries the Hub scan history (with Bosta integration) and the Bosta order
    details for a given tracking number. Returns whatever data is available; 404s are
    handled gracefully since some data may not exist in all systems.

    Args:
        tracking_number: The Bosta tracking number to scan across all systems.
    """
    scan_result, bosta_result = await asyncio.gather(
        _safe_get(f"/api/hub/scan/{tracking_number}?include_bosta=true"),
        _safe_get(f"/api/bosta/order/{tracking_number}"),
    )
    result = {
        "tracking": tracking_number,
        "ticket": scan_result,
        "bosta": bosta_result,
    }
    return json.dumps(result, ensure_ascii=False, default=str)


@mcp.tool()
async def mcrm_customer_dna(phone: str) -> str:
    """[Body Reflex · Heart] Complete customer DNA — finds customer then pulls tickets, orders, and shipping history.

    Step 1: Searches for the customer by phone to get their ID.
    Step 2: In parallel, fetches their tickets (up to 50), call-center orders (up to 50),
    and Bosta shipping orders. Returns a comprehensive profile even if the customer
    isn't found (with appropriate error messages).

    Args:
        phone: Customer phone number to look up.
    """
    # Step 1: Find customer
    search_result = await _safe_get(f"/api/customers/search?q={phone}")

    customer_id = None
    customer_data = search_result.get("data", {})
    if isinstance(customer_data, dict):
        # Could be a single result or a paginated response
        items = customer_data.get("data") or customer_data.get("items") or customer_data.get("results") or []
        if isinstance(items, list) and items:
            first = items[0]
            customer_id = first.get("id")
        elif isinstance(customer_data, dict) and "id" in customer_data:
            customer_id = customer_data["id"]
    elif isinstance(customer_data, list) and customer_data:
        customer_id = customer_data[0].get("id")

    if not customer_id:
        return json.dumps(
            {"customer": search_result, "tickets": {"error": "Customer not found"},
             "orders": {"error": "Customer not found"}, "bosta": {"error": "Customer not found"}},
            ensure_ascii=False, default=str,
        )

    # Step 2: Parallel fetch
    tickets_result, orders_result, bosta_result = await asyncio.gather(
        _safe_get(f"/api/tickets/?customer_id={customer_id}&limit=50"),
        _safe_get(f"/api/call-center/orders?search={phone}&limit=50"),
        _safe_get(f"/api/bosta/customer/{phone}/orders"),
    )

    result = {
        "customer": search_result,
        "customer_id": customer_id,
        "tickets": tickets_result,
        "orders": orders_result,
        "bosta": bosta_result,
    }
    return json.dumps(result, ensure_ascii=False, default=str)


@mcp.tool()
async def mcrm_ticket_heartbeat(ticket_id: int) -> str:
    """[Body Reflex · Heart] Ticket heartbeat — full ticket details, history, and available actions.

    Fetches the ticket details (with Bosta info), its full change history, and the
    actions available on it — all in parallel. Gives a complete picture of where
    the ticket is and what can be done with it.

    Args:
        ticket_id: The ticket ID to inspect.
    """
    ticket_result, history_result, actions_result = await asyncio.gather(
        _safe_get(f"/api/tickets/{ticket_id}?include_bosta=true"),
        _safe_get(f"/api/tickets/{ticket_id}/history"),
        _safe_get(f"/api/tickets/{ticket_id}/actions"),
    )
    result = {
        "ticket": ticket_result,
        "history": history_result,
        "available_actions": actions_result,
    }
    return json.dumps(result, ensure_ascii=False, default=str)


@mcp.tool()
async def mcrm_call_radar() -> str:
    """[Body Reflex · Ears] Call center radar — today's order counts, pending approvals, scheduled callbacks.

    Provides a real-time view of the call center's current state: how many orders came
    in today, which ones are pending approval, and which customers have scheduled
    callbacks. Essential for call-center supervisors.

    No parameters required — always returns today's data.
    """
    counts_result, pending_result, scheduled_result = await asyncio.gather(
        _safe_get("/api/call-center/orders/counts?today=true"),
        _safe_get("/api/call-center/pending"),
        _safe_get("/api/call-center/orders?status=scheduled&per_page=50"),
    )
    result = {
        "today_counts": counts_result,
        "pending_approvals": pending_result,
        "scheduled_callbacks": scheduled_result,
    }
    return json.dumps(result, ensure_ascii=False, default=str)


@mcp.tool()
async def mcrm_workshop_view() -> str:
    """[Body Reflex · Arms] Workshop view — current workshop queue and pending dispatch queue.

    Shows what's currently in the workshop (being repaired/processed) and what's
    waiting to be dispatched. Use this to manage physical operations flow.

    No parameters required — always returns current queue state.
    """
    workshop_result, dispatch_result = await asyncio.gather(
        _safe_get("/api/hub/queues/workshop"),
        _safe_get("/api/hub/queues/pending-dispatch"),
    )
    result = {
        "workshop_queue": workshop_result,
        "pending_dispatch": dispatch_result,
    }
    return json.dumps(result, ensure_ascii=False, default=str)


@mcp.tool()
async def mcrm_stock_brief() -> str:
    """[Body Reflex · Bones] Stock brief — active inventory items and recent movements.

    Fetches up to 100 active stock items and the 20 most recent stock movements.
    Returns the total count of active items for quick reference. Essential for
    warehouse and inventory management checks.

    No parameters required — always returns current stock state.
    """
    items_result, movements_result = await asyncio.gather(
        _safe_get("/api/stock/items?limit=100&active_only=true"),
        _safe_get("/api/stock/movements?limit=20"),
    )

    total_active = 0
    items_data = items_result.get("data") if isinstance(items_result.get("data"), dict) else {}
    if isinstance(items_data, dict):
        total_active = items_data.get("total", items_data.get("count", len(items_data.get("items", items_data.get("data", [])))))
    elif isinstance(items_data, list):
        total_active = len(items_data)

    result = {
        "items": items_result,
        "movements": movements_result,
        "total_active": total_active,
    }
    return json.dumps(result, ensure_ascii=False, default=str)


# ===================================================================
# Entry point
# ===================================================================

if __name__ == "__main__":
    mcp.run(transport="stdio")
