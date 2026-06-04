# app/api/auth_api.py
"""Auth API: JWT login + admin user CRUD (VENOM / POST /api/auth/users).

No public self-registration — admins create users after JWT login.

Migrated from plaintext passwords + X-User-Phone header spoofing (2026-05-11).
All auth is now JWT Bearer tokens. Passwords are bcrypt-hashed.
"""

import logging
from flask import Blueprint, request, jsonify, g
from app.utils.db import execute_query, execute_insert, execute_update
from app.utils.phone_normalizer import normalize_phone_safe
from app.utils.responses import error_response, success_response, unauthorized_response, forbidden_response
from app.utils.auth import (
    hash_password, check_password, needs_rehash,
    generate_token, decode_token,
    require_auth, require_admin, get_current_user, get_user_id,
    normalize_jwt_role,
)

logger = logging.getLogger(__name__)

auth_api_blueprint = Blueprint('auth_api', __name__, url_prefix='/api/auth')


def _get_user_by_phone(phone):
    """Look up user by normalized phone (never returns password hash)."""
    rows = execute_query(
        "SELECT id, phone, password, name, role FROM users WHERE phone = %s",
        (phone,),
    )
    return rows[0] if rows else None


def _get_user_by_id(user_id):
    """Look up user by id (never returns password hash)."""
    rows = execute_query(
        "SELECT id, phone, name, role, created_at, updated_at FROM users WHERE id = %s",
        (user_id,),
    )
    return rows[0] if rows else None


def _sanitize_user(row):
    """Strip password hash from a user dict."""
    return {
        'id': row['id'],
        'phone': row['phone'],
        'name': row.get('name'),
        'role': normalize_jwt_role(row.get('role')),
    }


def _valid_role(role, allow_admin=False):
    """Return validated role or 'agent'."""
    r = (role or 'agent').strip().lower()
    allowed = ('agent', 'team_leader')
    if allow_admin:
        allowed = allowed + ('admin',)
    return r if r in allowed else 'agent'


def _auto_rehash(user_id, plain_password):
    """If password is still plaintext, re-hash it in the background."""
    execute_update(
        "UPDATE users SET password = %s WHERE id = %s",
        (hash_password(plain_password), user_id),
    )


# ── Public Endpoints (no auth required) ──────────────────────────

@auth_api_blueprint.route('/login', methods=['POST'])
def login():
    """POST /login — body: { phone, password }. Returns JWT token + user info."""
    data = request.get_json() or {}
    phone_raw = (data.get('phone') or '').strip()
    password = (data.get('password') or '').strip()

    if not phone_raw or not password:
        return error_response('أدخل رقم الهاتف وكلمة المرور', 400)

    phone = normalize_phone_safe(phone_raw)
    if not phone:
        return error_response('رقم الهاتف غير صالح', 400)

    user = _get_user_by_phone(phone)
    if not user:
        return error_response(
            'مفيش حساب على الرقم ده عندنا في هفار دلوقتي — كلم المشرف أو الإدارة يفتحوا لك حساب جديد.',
            404,
        )

    if not check_password(password, user['password']):
        return unauthorized_response('كلمة المرور غير صحيحة')

    # Transparent re-hash: upgrade plaintext → bcrypt on successful login
    if needs_rehash(user['password']):
        _auto_rehash(user['id'], password)
        logger.info("Auto-rehashed password for user %s", user['id'])

    token = generate_token(user['id'], user['phone'], user['role'])
    return jsonify({
        "success": True,
        "token": token,
        "user": _sanitize_user(user),
    }), 200


# ── Token Refresh ─────────────────────────────────────────────────

@auth_api_blueprint.route('/refresh', methods=['POST'])
@require_auth
def refresh_token():
    """POST /refresh — re-issue JWT with fresh expiry. Requires valid (non-expired) token."""
    user = get_current_user()
    token = generate_token(user['id'], user['phone'], user['role'])
    return jsonify({"success": True, "token": token}), 200


# ── Admin Endpoints ──────────────────────────────────────────────

@auth_api_blueprint.route('/users', methods=['GET'])
@require_admin
def list_users():
    """GET /users — admin only. Lists all users WITHOUT passwords."""
    rows = execute_query(
        "SELECT id, phone, name, role, created_at, updated_at FROM users ORDER BY id"
    )
    users = [
        {
            "id": r['id'],
            "phone": r['phone'],
            "name": r['name'],
            "role": normalize_jwt_role(r.get('role')),
            "created_at": str(r['created_at']) if r.get('created_at') else None,
            "updated_at": str(r['updated_at']) if r.get('updated_at') else None,
        }
        for r in rows
    ]
    return jsonify({"success": True, "users": users}), 200


@auth_api_blueprint.route('/users', methods=['POST'])
@require_admin
def create_user():
    """POST /users — admin only. Creates user with hashed password."""
    data = request.get_json() or {}
    phone_raw = (data.get('phone') or '').strip()
    password = (data.get('password') or '').strip()
    name = (data.get('name') or '').strip()
    role = _valid_role(data.get('role'), allow_admin=True)

    if not phone_raw or not password or not name:
        return error_response('أدخل رقم الهاتف وكلمة المرور والاسم', 400)

    if len(password) < 4:
        return error_response('كلمة المرور قصيرة جداً (4 أحرف على الأقل)', 400)

    phone = normalize_phone_safe(phone_raw)
    if not phone:
        return error_response('رقم الهاتف غير صالح', 400)

    existing = _get_user_by_phone(phone)
    if existing:
        return error_response('رقم الهاتف مسجل مسبقاً', 409)

    hashed = hash_password(password)
    execute_insert(
        "INSERT INTO users (phone, password, name, role) VALUES (%s, %s, %s, %s)",
        (phone, hashed, name, role),
    )
    user = _get_user_by_phone(phone)
    return jsonify({
        "success": True,
        "user": _sanitize_user(user),
    }), 201


@auth_api_blueprint.route('/users/<int:user_id>', methods=['DELETE'])
@require_admin
def delete_user(user_id):
    """DELETE /users/:id — admin only. Cannot delete self."""
    me = get_current_user()
    if me['id'] == user_id:
        return error_response('لا يمكن حذف حسابك', 403)

    rows = execute_query("SELECT id, phone FROM users WHERE id = %s", (user_id,))
    if not rows:
        return error_response('المستخدم غير موجود', 404)

    execute_update("DELETE FROM users WHERE id = %s", (user_id,))
    return jsonify({"success": True, "message": "تم حذف المستخدم"}), 200


@auth_api_blueprint.route('/users/<int:user_id>', methods=['PATCH'])
@require_admin
def update_user(user_id):
    """PATCH /users/:id — admin only. Update user role."""
    me = get_current_user()
    if me['id'] == user_id:
        return error_response('لا يمكنك تغيير دور حسابك', 403)

    data = request.get_json() or {}
    role = _valid_role(data.get('role'), allow_admin=True)

    rows = execute_query("SELECT id, phone FROM users WHERE id = %s", (user_id,))
    if not rows:
        return error_response('المستخدم غير موجود', 404)

    execute_update(
        "UPDATE users SET role = %s, updated_at = NOW() WHERE id = %s",
        (role, user_id),
    )
    return jsonify({"success": True, "message": "تم تحديث الدور"}), 200


@auth_api_blueprint.route('/users/<int:user_id>/reset-password', methods=['PATCH'])
@require_admin
def reset_user_password(user_id):
    """PATCH /users/:id/reset-password — admin only."""
    data = request.get_json() or {}
    password = (data.get('password') or '').strip()

    if not password:
        return error_response('أدخل كلمة المرور الجديدة', 400)

    if len(password) < 4:
        return error_response('كلمة المرور قصيرة جداً (4 أحرف على الأقل)', 400)

    rows = execute_query("SELECT id FROM users WHERE id = %s", (user_id,))
    if not rows:
        return error_response('المستخدم غير موجود', 404)

    hashed = hash_password(password)
    execute_update(
        "UPDATE users SET password = %s, updated_at = NOW() WHERE id = %s",
        (hashed, user_id),
    )
    return jsonify({"success": True, "message": "تم تغيير كلمة المرور"}), 200
