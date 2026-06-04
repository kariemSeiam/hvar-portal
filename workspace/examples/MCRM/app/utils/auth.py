# app/utils/auth.py
"""JWT authentication + bcrypt password hashing.

Single source of truth for all auth operations.
Migrated from plaintext passwords + header spoofing (2026-05-11).
"""

import jwt
import bcrypt
import logging
from functools import wraps
from flask import request, jsonify, current_app, g
from datetime import datetime, timezone, timedelta

logger = logging.getLogger(__name__)

# ── Password Hashing ──────────────────────────────────────────────

_BCRYPT_PREFIX = ('$2b$', '$2a$')


def hash_password(plain_password: str) -> str:
    """Hash a plaintext password with bcrypt (cost=12)."""
    return bcrypt.hashpw(
        plain_password.encode('utf-8'),
        bcrypt.gensalt(rounds=12),
    ).decode('utf-8')


def check_password(plain_password: str, stored: str) -> bool:
    """Verify password. Supports bcrypt hashes AND legacy plaintext (auto-upgrades)."""
    if not plain_password or not stored:
        return False

    # Already hashed — fast path
    if stored.startswith(_BCRYPT_PREFIX):
        try:
            return bcrypt.checkpw(plain_password.encode('utf-8'), stored.encode('utf-8'))
        except Exception:
            logger.warning("bcrypt.checkpw failed on stored hash for user")
            return False

    # Legacy plaintext — compare directly (migration will eliminate these)
    return plain_password == stored


def needs_rehash(stored: str) -> bool:
    """True if stored password is still plaintext (needs migration)."""
    return bool(stored) and not stored.startswith(_BCRYPT_PREFIX)


def normalize_jwt_role(role):
    # type: (str | None) -> str
    """Canonical role for JWT claims and API responses (lowercase)."""
    return str(role or 'agent').strip().lower()


# ── JWT Token Management ──────────────────────────────────────────

def generate_token(user_id: int, phone: str, role: str) -> str:
    """Issue a signed JWT access token (HS256)."""
    now = datetime.now(timezone.utc)
    nr = normalize_jwt_role(role)
    payload = {
        'user_id': user_id,
        'phone': phone,
        'role': nr,
        'iat': now,
        'exp': now + timedelta(hours=current_app.config.get('JWT_EXPIRY_HOURS', 24)),
    }
    return jwt.encode(
        payload,
        current_app.config['JWT_SECRET_KEY'],
        algorithm='HS256',
    )


def decode_token(token: str):
    # type: (str) -> dict | None
    """Decode + validate JWT. Returns payload dict or None on any failure."""
    try:
        data = jwt.decode(
            token,
            current_app.config['JWT_SECRET_KEY'],
            algorithms=['HS256'],
        )
        out = dict(data)
        out['role'] = normalize_jwt_role(out.get('role'))
        return out
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError as exc:
        logger.warning("Invalid JWT: %s", exc)
        return None


# ── Request Context Helpers ───────────────────────────────────────

def get_current_user():
    # type: () -> dict | None
    """Return the authenticated user dict (set by @require_auth / before_request)."""
    return g.get('current_user')


def get_user_id():
    # type: () -> int | None
    """Shortcut: return authenticated user's DB id."""
    u = g.get('current_user')
    return u['id'] if u else None


# ── Decorators ────────────────────────────────────────────────────

PUBLIC_PATHS = frozenset({
    '/api/auth/login',
    '/api/health',
    '/api/health/db',
})


def require_auth(f):
    """Decorator / before_request filter: reject requests without valid JWT."""
    @wraps(f)
    def decorated(*args, **kwargs):
        path = request.path.rstrip('/')

        # Public endpoints skip auth
        if path in PUBLIC_PATHS:
            return f(*args, **kwargs)

        # Extract Bearer token
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({
                'success': False,
                'message': 'تسجيل الدخول مطلوب',
            }), 401

        payload = decode_token(auth_header[7:])
        if payload is None:
            return jsonify({
                'success': False,
                'message': 'انتهت صلاحية الجلسة — سجّل الدخول مجدداً',
            }), 401

        # Stash user in Flask g for downstream code
        g.current_user = {
            'id': payload['user_id'],
            'phone': payload['phone'],
            'role': normalize_jwt_role(payload.get('role')),
        }
        return f(*args, **kwargs)

    return decorated


def require_admin(f):
    """Decorator: require JWT + role == 'admin'."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'message': 'غير مصرح'}), 401

        payload = decode_token(auth_header[7:])
        if payload is None:
            return jsonify({'success': False, 'message': 'انتهت صلاحية الجلسة'}), 401

        if normalize_jwt_role(payload.get('role')) != 'admin':
            return jsonify({'success': False, 'message': 'مشرف فقط'}), 403

        g.current_user = {
            'id': payload['user_id'],
            'phone': payload['phone'],
            'role': normalize_jwt_role(payload.get('role')),
        }
        return f(*args, **kwargs)

    return decorated
