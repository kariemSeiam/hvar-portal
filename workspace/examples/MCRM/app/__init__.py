# app/__init__.py
"""Main application package."""
import os
from flask import Flask, request, send_from_directory, send_file
from flask_cors import CORS
from pathlib import Path
from .config import config
from .utils import db

# Paths that bypass JWT authentication
_PUBLIC_API_PREFIXES = ('/api/auth/login', '/api/health')


def _is_public_api(path):
    """Check if an API path is public (no JWT required)."""
    stripped = path.rstrip('/')
    for prefix in _PUBLIC_API_PREFIXES:
        if stripped == prefix or stripped.startswith(prefix + '/'):
            return True
    return False


def create_app(config_name='production'):
    """Creates and configures an instance of the Flask application."""
    # Get the project root directory (HUB-MCRM)
    # __file__ is at: app/__init__.py → parent.parent = project root
    project_root = Path(__file__).parent.parent
    dist_folder = project_root / 'dist'

    # Configure Flask (don't use automatic static serving to avoid conflicts)
    app = Flask(__name__)
    app.config.from_object(config[config_name])

    # Configure CORS — allow all API routes
    CORS_ORIGINS = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5050",
        "http://127.0.0.1:5050",
        "https://mcrm.hvarstore.com",
        "http://mcrm.hvarstore.com",
    ]
    CORS_ALLOW_HEADERS = [
        "Content-Type", "Authorization", "X-Requested-With",
    ]
    CORS(app, resources={
        r"/api/.*": {
            "origins": CORS_ORIGINS,
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
            "allow_headers": CORS_ALLOW_HEADERS,
            "supports_credentials": True,
            "expose_headers": ["Content-Type", "Authorization"]
        }
    }, supports_credentials=True)

    db.init_app(app)

    # ── Global JWT authentication ─────────────────────────────────
    from .utils.auth import decode_token, PUBLIC_PATHS

    @app.before_request
    def _auth_guard():
        """Enforce JWT on all /api/* routes except public endpoints."""
        # CORS preflight never sends Authorization — must not 401 or browser blocks the real request.
        if request.method == 'OPTIONS':
            return None

        path = request.path.rstrip('/')
        if not path.startswith('/api/'):
            return  # Let frontend routes through

        if path in PUBLIC_PATHS:
            return

        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return _auth_reject(401, 'تسجيل الدخول مطلوب')

        payload = decode_token(auth_header[7:])
        if payload is None:
            return _auth_reject(401, 'انتهت صلاحية الجلسة — سجّل الدخول مجدداً')

        # Store user in request context for downstream code
        from flask import g
        g.current_user = {
            'id': payload['user_id'],
            'phone': payload['phone'],
            'role': payload['role'],
        }

    def _auth_reject(status, message):
        from flask import jsonify
        if request.path.startswith('/api/'):
            return jsonify({'success': False, 'message': message}), status

    # ── Security headers ──────────────────────────────────────────
    @app.after_request
    def _security_headers(response):
        """Inject security headers on every response."""
        if request.path.startswith('/api/'):
            response.headers['X-Content-Type-Options'] = 'nosniff'
            response.headers['X-Frame-Options'] = 'DENY'
            response.headers['X-XSS-Protection'] = '1; mode=block'
            response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
            response.headers['Cache-Control'] = 'no-store'
        return response

    # Register blueprints for different parts of the API
    from .api.auth_api import auth_api_blueprint
    from .api.customer_api import customer_api_blueprint
    from .api.hub_api import hub_api_blueprint
    from .api.service_api import service_api_blueprint
    from .api.stock_api import stock_api_blueprint
    from .api.bosta_api import bosta_api_blueprint
    from .api.erp_api import erp_api_blueprint
    from .api.call_center_api import call_center_api_blueprint

    app.register_blueprint(auth_api_blueprint)
    app.register_blueprint(customer_api_blueprint)
    app.register_blueprint(hub_api_blueprint)
    app.register_blueprint(erp_api_blueprint)
    app.register_blueprint(service_api_blueprint)
    app.register_blueprint(stock_api_blueprint)
    app.register_blueprint(bosta_api_blueprint)
    app.register_blueprint(call_center_api_blueprint)

    try:
        from .pending_sells_viewer import register_pending_sells

        register_pending_sells(app)
    except Exception as e:
        import logging

        logging.getLogger(__name__).warning("Pending sells viewer not loaded: %s", e)

    # Root fix: disable strict_slashes for ALL /api/* routes.
    # Flask redirects /api/tickets → /api/tickets/ by default; CORS preflight cannot follow redirects.
    # One place, all API routes fixed. No per-route patches.
    for rule in app.url_map.iter_rules():
        if rule.rule.startswith('/api/'):
            rule.strict_slashes = False

    # Initialize scheduled ERP sync (runs every 20 minutes)
    with app.app_context():
        try:
            from app.workers import erp_sync_worker
            erp_sync_worker.start_scheduled_sync(interval_minutes=20)
        except Exception as e:
            import logging
            logging.getLogger(__name__).warning(f"Failed to initialize scheduled sync: {e}")

    # 404 error handler for API routes
    @app.errorhandler(404)
    def not_found_handler(error):
        """Handle 404 errors - return JSON for API routes, HTML for frontend routes."""
        from flask import request, jsonify

        # If it's an API route, return JSON
        if request.path.startswith('/api/'):
            return jsonify({
                "error": "Endpoint not found",
                "message": f"The requested API endpoint '{request.path}' does not exist",
                "path": request.path
            }), 404

        # For frontend routes, re-raise the error so Flask's catch-all route can handle it
        # The catch-all route will serve index.html for React Router
        raise error

    @app.route('/api/health')
    def health_check():
        return "OK"

    @app.route('/api/health/db')
    def db_health_check():
        """Check database connection status."""
        from flask import jsonify
        from app.utils.db import get_db
        import pymysql

        try:
            # Try to get database connection
            db = get_db()
            cursor = db.cursor()

            # Avoid alias "current_user" — reserved in MariaDB/MySQL (CURRENT_USER), causes syntax error 1064
            cursor.execute("SELECT 1 AS test, DATABASE() AS current_db, USER() AS conn_user")
            result = cursor.fetchone()

            # Get database version
            cursor.execute("SELECT VERSION() as version")
            version_result = cursor.fetchone()

            return jsonify({
                "status": "connected",
                "database": result.get('current_db') if result else None,
                "user": result.get('conn_user') if result else None,
                "version": version_result.get('version') if version_result else None,
                "message": "Database connection successful"
            }), 200

        except pymysql.Error as e:
            return jsonify({
                "status": "error",
                "error_code": e.args[0] if e.args else None,
                "error_message": str(e),
                "message": "Database connection failed"
            }), 500
        except ConnectionError as e:
            return jsonify({
                "status": "error",
                "error_message": str(e),
                "message": "Database connection failed"
            }), 500

        except Exception as e:
            return jsonify({
                "status": "error",
                "error_message": str(e),
                "message": "Unexpected error while checking database connection"
            }), 500

    # Frontend serving - always serve from dist folder for non-API routes
    # All routes that don't start with /api will serve from dist folder

    @app.route('/')
    def serve_index():
        """Serve index.html for root route."""
        index_path = dist_folder / 'index.html'
        if index_path.exists():
            return send_file(str(index_path))
        from flask import abort
        abort(404)

    # Serve static assets from dist/assets folder
    @app.route('/assets/<path:filename>')
    def serve_assets(filename):
        """Serve static assets from dist/assets folder."""
        file_path = dist_folder / 'assets' / filename
        if file_path.exists() and file_path.is_file():
            return send_from_directory(str(dist_folder / 'assets'), filename)
        from flask import abort
        abort(404)

    # Catch-all route for frontend (must be last)
    # Serves files from dist folder for all non-API routes
    # Block sensitive file paths from being served
    _BLOCKED_EXTENSIONS = frozenset({
        '.env', '.git', '.htaccess', '.htpasswd', '.svn',
        '.sql', '.log', '.bak', '.old', '.orig', '.key', '.pem', '.crt', '.p12',
        '.py', '.php', '.conf',
    })
    _BLOCKED_PREFIXES = frozenset({
        'app/', 'migrations/', 'mcp-servers/', 'tests/', '.git/',
        'wsgi.py', 'requirements.txt', 'Dockerfile', 'docker-compose',
    })

    @app.route('/<path:path>')
    def serve_frontend(path):
        """Serve static files or index.html for frontend routes."""
        # Block sensitive paths — return 404 directly (not abort, to avoid 404 handler loop)
        from flask import jsonify, make_response

        if path.startswith("api/") or path.startswith("pending-sells"):
            return jsonify({"error": "not found"}), 404

        # Block dotfiles (.env, .gitignore, etc.)
        if path.startswith('.'):
            return jsonify({"error": "not found"}), 404

        # Block by extension
        from os.path import splitext
        _, ext = splitext(path)
        if ext.lower() in _BLOCKED_EXTENSIONS:
            return jsonify({"error": "not found"}), 404

        # Block by prefix
        for prefix in _BLOCKED_PREFIXES:
            if path.startswith(prefix):
                return jsonify({"error": "not found"}), 404

        # Try to serve static files from dist root first (manifest.json, icon.svg, etc.)
        file_path = dist_folder / path
        if file_path.exists() and file_path.is_file():
            return send_from_directory(str(dist_folder), path)

        # For all frontend routes (React Router routes), serve index.html
        index_path = dist_folder / 'index.html'
        if index_path.exists():
            return send_file(str(index_path))

        # File not found
        from flask import abort
        abort(404)

    return app
