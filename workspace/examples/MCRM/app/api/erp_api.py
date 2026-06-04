# app/api/erp_api.py
"""ERP API proxy endpoints to avoid CORS issues."""
import os

from flask import Blueprint, request, jsonify
from app.utils.auth import require_auth
import requests
from urllib.parse import urlencode
import re
import urllib3
from app.utils.messages import get_message

# Suppress SSL warnings for ERP API (self-signed certificate)
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

erp_api_blueprint = Blueprint('erp_api', __name__, url_prefix='/api/erp')

# ERP base URL
ERP_BASE_URL = 'https://erp.hvarstore.com'


def _erp_http_timeout():
    """
    Requests cannot hang indefinitely: sync worker would stay 'running' with total=0 forever.
    Returns (connect_timeout_sec, read_timeout_sec).
    Override with ERP_HTTP_CONNECT_TIMEOUT / ERP_HTTP_READ_TIMEOUT (seconds, integers).
    """
    try:
        c = max(5, min(120, int(os.environ.get("ERP_HTTP_CONNECT_TIMEOUT", "15"))))
    except (TypeError, ValueError):
        c = 15
    try:
        r = max(30, min(900, int(os.environ.get("ERP_HTTP_READ_TIMEOUT", "180"))))
    except (TypeError, ValueError):
        r = 180
    return (c, r)


class ERPAuth:
    """Server-side ERP authentication handler."""

    def __init__(self, username, password):
        self.username = username
        self.password = password
        self.session = requests.Session()
        self.csrf_token = None
        self.last_login_time = 0
        self.session_timeout = 3600  # 1 hour

    def is_session_expired(self):
        """Check if session is expired."""
        import time
        if not self.last_login_time:
            return True
        return (time.time() - self.last_login_time) >= self.session_timeout

    def extract_csrf_token(self, html):
        """Extract CSRF token from HTML page."""
        # Look for: <input type="hidden" name="_token" value="...">
        token_match = re.search(r'name="_token"\s+value="([^"]+)"', html)
        if token_match:
            return token_match.group(1)

        # Alternative: Look for meta tag
        meta_match = re.search(r'<meta\s+name="csrf-token"\s+content="([^"]+)"', html)
        if meta_match:
            return meta_match.group(1)

        return None

    def login(self):
        """Login to ERP system."""
        import time

        login_url = f'{ERP_BASE_URL}/login'

        to = _erp_http_timeout()

        # Step 1: Get login page to extract CSRF token
        response = self.session.get(login_url, verify=False, allow_redirects=True, timeout=to)

        if response.status_code != 200:
            raise Exception(f"Failed to load login page: {response.status_code}")

        csrf_token = self.extract_csrf_token(response.text)

        if not csrf_token:
            raise Exception("Could not extract CSRF token from login page")

        # Step 2: Perform login
        login_data = {
            'username': self.username,
            'password': self.password,
            '_token': csrf_token
        }

        response = self.session.post(
            login_url,
            data=login_data,
            verify=False,
            allow_redirects=True,
            timeout=to,
        )

        # Check if login was successful (200 or 302 redirect)
        if response.status_code in [200, 302]:
            self.csrf_token = csrf_token
            self.last_login_time = time.time()
            return True

        # If redirected to login page again, login failed
        if response.status_code == 302:
            location = response.headers.get('Location', '')
            if 'login' in location.lower():
                raise Exception('Login failed: Invalid credentials or session issue')

        raise Exception(f"Login failed. Status: {response.status_code}")

    def get_auth_headers(self):
        """Get CSRF token for API requests."""
        import time

        # Auto-login if expired
        if self.is_session_expired():
            self.login()

        return {
            'X-CSRF-TOKEN': self.csrf_token,
            'X-Requested-With': 'XMLHttpRequest'
        }

    def fetch_with_auth(self, url, params=None):
        """Fetch with automatic authentication retry."""
        # Get auth headers
        headers = self.get_auth_headers()
        headers.update({
            'Accept': 'application/json, text/javascript, */*; q=0.01'
        })

        to = _erp_http_timeout()

        # First attempt
        response = self.session.get(
            url,
            params=params,
            headers=headers,
            verify=False,
            timeout=to,
        )

        # If unauthorized, try login and retry once
        if response.status_code in [401, 403]:
            self.last_login_time = 0  # Force re-login
            self.login()

            # Retry with new auth
            headers = self.get_auth_headers()
            headers.update({
                'Accept': 'application/json, text/javascript, */*; q=0.01'
            })

            response = self.session.get(
                url,
                params=params,
                headers=headers,
                verify=False,
                timeout=to,
            )

        return response

@erp_api_blueprint.route('/drafts', methods=['GET'])
@require_auth
def get_draft_orders():
    """
    GET /api/erp/drafts
    Simplified proxy endpoint to fetch draft orders from ERP API

    Query Parameters (simple):
    - start_date: YYYY-MM-DD (default: 2026-01-01)
    - end_date: YYYY-MM-DD (default: 2026-12-31)
    - username: ERP username (required)
    - password: ERP password (required)

    Returns:
    - DataTables format response from ERP
    """
    try:
        username = request.args.get('username')
        password = request.args.get('password')
        start_date = request.args.get('start_date', '2026-01-01')
        end_date = request.args.get('end_date', '2026-12-31')

        if not username or not password:
            return jsonify({
                "error": "Username and password are required"
            }), 400

        # Initialize ERP auth
        erp_auth = ERPAuth(username, password)

        # Build ERP API URL
        base_url = f'{ERP_BASE_URL}/sells/draft-dt'

        # Build all DataTables parameters internally (expert implementation)
        # Frontend doesn't need to know about these details
        params = {
            'is_quotation': '0',
            'draw': '1',
            'columns[0][data]': 'action',
            'columns[0][name]': 'action',
            'columns[0][searchable]': 'false',
            'columns[0][orderable]': 'false',
            'columns[0][search][value]': '',
            'columns[0][search][regex]': 'false',
            'columns[1][data]': 'transaction_date',
            'columns[1][name]': 'transaction_date',
            'columns[1][searchable]': 'true',
            'columns[1][orderable]': 'true',
            'columns[1][search][value]': '',
            'columns[1][search][regex]': 'false',
            'columns[2][data]': 'invoice_no',
            'columns[2][name]': 'invoice_no',
            'columns[2][searchable]': 'true',
            'columns[2][orderable]': 'true',
            'columns[2][search][value]': '',
            'columns[2][search][regex]': 'false',
            'columns[3][data]': 'contact_name',
            'columns[3][name]': 'contact_name',
            'columns[3][searchable]': 'true',
            'columns[3][orderable]': 'true',
            'columns[3][search][value]': '',
            'columns[3][search][regex]': 'false',
            'columns[4][data]': 'mobile',
            'columns[4][name]': 'contacts.mobile',
            'columns[4][searchable]': 'true',
            'columns[4][orderable]': 'true',
            'columns[4][search][value]': '',
            'columns[4][search][regex]': 'false',
            'columns[5][data]': 'whatsapp',
            'columns[5][name]': 'whatsapp',
            'columns[5][searchable]': 'false',
            'columns[5][orderable]': 'false',
            'columns[5][search][value]': '',
            'columns[5][search][regex]': 'false',
            'columns[6][data]': 'business_location',
            'columns[6][name]': 'bl.name',
            'columns[6][searchable]': 'true',
            'columns[6][orderable]': 'true',
            'columns[6][search][value]': '',
            'columns[6][search][regex]': 'false',
            'columns[7][data]': 'total_items',
            'columns[7][name]': 'total_items',
            'columns[7][searchable]': 'false',
            'columns[7][orderable]': 'true',
            'columns[7][search][value]': '',
            'columns[7][search][regex]': 'false',
            'columns[8][data]': 'added_by',
            'columns[8][name]': 'added_by',
            'columns[8][searchable]': 'true',
            'columns[8][orderable]': 'true',
            'columns[8][search][value]': '',
            'columns[8][search][regex]': 'false',
            'columns[9][data]': 'commission_agent',
            'columns[9][name]': 'commission_agent',
            'columns[9][searchable]': 'true',
            'columns[9][orderable]': 'true',
            'columns[9][search][value]': '',
            'columns[9][search][regex]': 'false',
            'columns[10][data]': 'shipping_state',
            'columns[10][name]': 'shipping_state',
            'columns[10][searchable]': 'true',
            'columns[10][orderable]': 'true',
            'columns[10][search][value]': '',
            'columns[10][search][regex]': 'false',
            'columns[11][data]': 'shipping_city',
            'columns[11][name]': 'shipping_city',
            'columns[11][searchable]': 'true',
            'columns[11][orderable]': 'true',
            'columns[11][search][value]': '',
            'columns[11][search][regex]': 'false',
            'columns[12][data]': 'shipping_address',
            'columns[12][name]': 'shipping_address',
            'columns[12][searchable]': 'true',
            'columns[12][orderable]': 'true',
            'columns[12][search][value]': '',
            'columns[12][search][regex]': 'false',
            'columns[13][data]': 'shipping_details',
            'columns[13][name]': 'shipping_details',
            'columns[13][searchable]': 'true',
            'columns[13][orderable]': 'true',
            'columns[13][search][value]': '',
            'columns[13][search][regex]': 'false',
            'columns[14][data]': 'coupon_code',
            'columns[14][name]': 'transactions.coupon_code',
            'columns[14][searchable]': 'true',
            'columns[14][orderable]': 'true',
            'columns[14][search][value]': '',
            'columns[14][search][regex]': 'false',
            'order[0][column]': '0',
            'order[0][dir]': 'desc',
            'start': '0',
            'length': '200',
            'search[value]': '',
            'search[regex]': 'false',
            'start_date': start_date,
            'end_date': end_date,
            'location_id': '',
            'customer_id': '',
            'created_by': '',
            'sales_cmsn_agnt': '',
            'coupon_code': ''
        }

        # Fetch data from ERP
        response = erp_auth.fetch_with_auth(base_url, params)

        if response.status_code != 200:
            return jsonify({
                "error": f"ERP API error: {response.status_code} {response.text[:200]}"
            }), response.status_code

        # Return ERP response as-is (DataTables format)
        return jsonify(response.json()), 200

    except Exception as e:
        return jsonify({
            "error": f"Failed to fetch draft orders: {str(e)}"
        }), 500
