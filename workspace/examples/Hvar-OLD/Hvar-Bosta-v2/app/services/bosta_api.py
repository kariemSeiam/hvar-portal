"""
app/services/bosta_api.py
Business logic services for bosta_api
"""

from app.config import API_BASE_URL, API_KEY, API_TIMEOUT
from app.utils.phone_utils import clean_phone
import json
import logging
import os
import requests
import time

"""
Expert Bosta API integration service with enhanced error handling and retry logic
"""

# Setup logging
logger = logging.getLogger(__name__)

# Default Bosta credentials
BOSTA_EMAIL = "kariemseiam@gmail.com"
BOSTA_PASSWORD = "ZXzx1111"
TOKEN_CACHE_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'bosta_token.json')

# Expert API Configuration
API_CONFIG = {
    'max_retries': 5,
    'retry_delay': 2,
    'connection_timeout': 30,
    'read_timeout': 60,
    'backoff_factor': 2,
    'token_expiry_hours': 24  # Token valid for 24 hours
}

# Global token cache
_token_cache = None
_last_login_attempt = 0
_login_cooldown = 60  # Prevent rapid login attempts

def save_token(token_data):
    """
    Save authentication token to file
    
    Args:
        token_data: Dictionary containing token information
    """
    try:
        with open(TOKEN_CACHE_FILE, 'w') as f:
            json.dump(token_data, f)
        logger.info("✅ Authentication token saved successfully")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to save token: {e}")
        return False

def load_token():
    """
    Load authentication token from file with validation
    
    Returns:
        Dictionary with token data or None if not available/expired
    """
    global _token_cache
    
    # Return cached token if available and valid
    if _token_cache and _token_cache.get('token'):
        token_age = time.time() - _token_cache.get('timestamp', 0)
        if token_age < (API_CONFIG['token_expiry_hours'] * 3600):
            logger.debug("✅ Using cached authentication token")
            return _token_cache
        else:
            logger.info("⏰ Cached token expired, will login again")
            _token_cache = None
    
    try:
        if os.path.exists(TOKEN_CACHE_FILE):
            with open(TOKEN_CACHE_FILE, 'r') as f:
                token_data = json.load(f)
                
                # Validate token data structure
                if not isinstance(token_data, dict) or 'token' not in token_data:
                    logger.warning("⚠️ Invalid token data structure in cache file")
                    return None
                
                # Check if token is still valid
                if token_data.get('timestamp'):
                    token_age = time.time() - token_data['timestamp']
                    if token_age < (API_CONFIG['token_expiry_hours'] * 3600):
                        _token_cache = token_data
                        logger.info("✅ Loaded valid token from cache")
                        return token_data
                    else:
                        logger.info("⏰ Token from file expired, will login again")
                else:
                    logger.warning("⚠️ Token file missing timestamp")
                
                return None
        return None
    except Exception as e:
        logger.error(f"❌ Failed to load token: {e}")
        return None

def login():
    """
    Login to Bosta API and get authentication token with cooldown protection
    
    Returns:
        Dictionary with login result
    """
    global _last_login_attempt, _token_cache
    
    # Prevent rapid login attempts
    current_time = time.time()
    if current_time - _last_login_attempt < _login_cooldown:
        remaining = _login_cooldown - (current_time - _last_login_attempt)
        logger.warning(f"⏰ Login cooldown active, wait {remaining:.1f} seconds")
        return {
            'success': False,
            'error': f'Login cooldown active, wait {remaining:.1f} seconds'
        }
    
    _last_login_attempt = current_time
    url = f"{API_BASE_URL}/users/login"
    
    data = {
        "email": BOSTA_EMAIL,
        "password": BOSTA_PASSWORD
    }
    
    try:
        logger.info("🔐 Attempting to login to Bosta API...")
        response = requests.post(
            url, 
            json=data, 
            timeout=(API_CONFIG['connection_timeout'], API_CONFIG['read_timeout'])
        )
        
        if response.status_code == 200:
            response_data = response.json()
            if response_data.get('success'):
                token_data = {
                    'token': response_data['data']['token'],
                    'refreshToken': response_data['data'].get('refreshToken'),
                    'timestamp': time.time()
                }
                
                # Update both cache and file
                _token_cache = token_data
                save_token(token_data)
                
                logger.info("✅ Login successful")
                return {
                    'success': True,
                    'token': token_data['token']
                }
        
        logger.error(f"❌ Login failed: {response.status_code}, {response.text}")
        return {
            'success': False,
            'error': f"Login failed: {response.status_code} - {response.text}"
        }
    except requests.exceptions.Timeout:
        logger.error("⏰ Login timeout - server not responding")
        return {
            'success': False,
            'error': 'Login timeout - server not responding'
        }
    except requests.exceptions.ConnectionError:
        logger.error("🌐 Login connection error - check network connectivity")
        return {
            'success': False,
            'error': 'Login connection error - check network connectivity'
        }
    except Exception as e:
        logger.error(f"❌ Login error: {e}")
        return {
            'success': False,
            'error': f"Login error: {str(e)}"
        }

def get_auth_headers():
    """
    Get authentication headers with automatic token refresh
    
    Returns:
        Dictionary with headers
    """
    # First try to use the cached token
    token_data = load_token()
    
    if token_data and token_data.get('token'):
        return {
            "authorization": token_data['token'],
            "content-type": "application/json"
        }
    
    # Fallback to environment variable
    if API_KEY:
        logger.info("🔑 Using API key from environment")
        return {
            "authorization": f"Bearer {API_KEY}",
            "content-type": "application/json"
        }
    
    # Try to login and get a new token
    logger.info("🔐 No valid token found, attempting login...")
    login_result = login()
    if login_result.get('success'):
        return {
            "authorization": login_result['token'],
            "content-type": "application/json"
        }
    
    # Return empty headers if all else fails
    logger.warning("⚠️ No authentication available")
    return {"content-type": "application/json"}

def handle_auth_error(request_func):
    """
    Handle authentication errors by logging in again
    
    Args:
        request_func: Function to retry after login
        
    Returns:
        Result of the request function or error
    """
    global _token_cache
    
    logger.info("🔐 Authentication error detected. Attempting to login...")
    
    # Clear cached token to force fresh login
    _token_cache = None
    
    login_result = login()
    
    if login_result.get('success'):
        logger.info("✅ Login successful. Retrying request...")
        return request_func()
    
    return {
        'success': False,
        'error': 'Authentication failed after login attempt',
        'status_code': 401
    }

def make_api_request(url, method='GET', data=None, headers=None, timeout=None):
    """
    Make API request with automatic authentication and retry logic
    
    Args:
        url: API endpoint URL
        method: HTTP method (GET, POST, etc.)
        data: Request data for POST requests
        headers: Additional headers
        timeout: Request timeout
        
    Returns:
        Dictionary with response or error information
    """
    if timeout is None:
        timeout = (API_CONFIG['connection_timeout'], API_CONFIG['read_timeout'])
    
    if headers is None:
        headers = {}
    
    # Get authentication headers
    auth_headers = get_auth_headers()
    headers.update(auth_headers)
    
    try:
        if method.upper() == 'GET':
            response = requests.get(url, headers=headers, timeout=timeout)
        elif method.upper() == 'POST':
            response = requests.post(url, headers=headers, json=data, timeout=timeout)
        else:
            return {
                'success': False,
                'error': f'Unsupported HTTP method: {method}'
            }
        
        if response.status_code == 200:
            return {
                'success': True,
                'data': response.json(),
                'status_code': response.status_code
            }
        elif response.status_code == 401:
            logger.error("🔐 API authentication error. Token may be expired.")
            return {
                'success': False,
                'error': 'Authentication error - token expired',
                'status_code': response.status_code
            }
        elif response.status_code == 429:
            logger.warning("⏰ API rate limit exceeded.")
            return {
                'success': False,
                'error': 'Rate limit exceeded',
                'status_code': response.status_code
            }
        elif 500 <= response.status_code < 600:
            logger.warning(f"🔧 Server error: {response.status_code}")
            return {
                'success': False,
                'error': f'Server error: {response.status_code}',
                'status_code': response.status_code
            }
        else:
            logger.warning(f"⚠️ API error: {response.status_code}, {response.text}")
            return {
                'success': False,
                'error': f"API error: {response.status_code} - {response.text}",
                'status_code': response.status_code
            }
    except requests.exceptions.Timeout:
        logger.warning("⏰ API timeout")
        return {
            'success': False,
            'error': 'API timeout - server not responding'
        }
    except requests.exceptions.ConnectionError:
        logger.error("🌐 API connection error. Check network connectivity.")
        return {
            'success': False,
            'error': 'API connection error - check network connectivity'
        }
    except requests.exceptions.RequestException as e:
        logger.error(f"❌ Request exception: {e}")
        return {
            'success': False,
            'error': f"Request exception: {str(e)}"
        }
    except Exception as e:
        logger.error(f"❌ Unexpected API error: {e}")
        return {
            'success': False,
            'error': f"Unexpected error: {str(e)}"
        }

def search_orders(page=1, limit=200, phone=None, order_type=None, max_retries=None):
    """
    Search orders from Bosta API with expert retry logic
    
    Args:
        page: Page number (default: 1)
        limit: Results per page (default: 200)
        phone: Filter by phone number (optional)
        order_type: Type of orders ("normal", "pending", "exchange", "return")
        max_retries: Maximum number of retry attempts (default: from config)
        
    Returns:
        Dictionary with API response or error information
    """
    if max_retries is None:
        max_retries = API_CONFIG['max_retries']
    
    url = f"{API_BASE_URL}/deliveries/search"
    data = {"limit": limit, "page": page, "sortBy": "-updatedAt"}
    
    # Handle different order types
    if order_type == "pending":
        data["type"] = ["EXCHANGE", "CUSTOMER_RETURN_PICKUP"]
    elif order_type == "exchange":
        data["type"] = ["EXCHANGE"]
    elif order_type == "return":
        data["type"] = ["CUSTOMER_RETURN_PICKUP"]
    
    if phone:
        clean_p = clean_phone(phone)
        if clean_p and clean_p.startswith('0'):
            clean_p = clean_p[1:]  # Remove leading zero for API
        data["mobilePhones"] = clean_p
    
    retries = 0
    while retries < max_retries:
        logger.debug(f"🌐 Making API request to {url} (page {page}, limit {limit})")
        result = make_api_request(url, method='POST', data=data)
        
        if result.get('success'):
            logger.debug(f"✅ API request successful for page {page}")
            return result
        
        # Handle authentication errors
        if result.get('status_code') == 401 and retries < max_retries - 1:
            logger.info("🔐 Authentication error, attempting to login and retry...")
            auth_result = handle_auth_error(lambda: make_api_request(url, method='POST', data=data))
            if auth_result.get('success'):
                return auth_result
        
        # Handle rate limiting
        if result.get('status_code') == 429 and retries < max_retries - 1:
            delay = API_CONFIG['retry_delay'] * (API_CONFIG['backoff_factor'] ** retries)
            logger.info(f"⏰ Rate limited. Waiting {delay} seconds before retry...")
            # time.sleep(delay)
            retries += 1
            continue
        
        # Handle server errors with exponential backoff
        if 500 <= result.get('status_code', 0) < 600 and retries < max_retries - 1:
            delay = API_CONFIG['retry_delay'] * (API_CONFIG['backoff_factor'] ** retries)
            logger.info(f"🔧 Server error. Retrying in {delay} seconds ({retries + 1}/{max_retries})...")
            # time.sleep(delay)
            retries += 1
            continue
        
        # Handle connection errors with exponential backoff
        if 'connection error' in result.get('error', '').lower() and retries < max_retries - 1:
            delay = API_CONFIG['retry_delay'] * (API_CONFIG['backoff_factor'] ** retries)
            logger.info(f"🌐 Connection error. Retrying in {delay} seconds ({retries + 1}/{max_retries})...")
            # time.sleep(delay)
            retries += 1
            continue
        
        # For other errors or if we've reached max retries, return the result
        if retries >= max_retries - 1:
            logger.error(f"❌ Maximum retries ({max_retries}) reached for page {page}")
            return result
            
        retries += 1
    
    return {
        'success': False,
        'error': f'Maximum retries ({max_retries}) reached'
    }

def get_order_details(tracking_number, max_retries=None):
    """
    Get detailed information for a single order using tracking number with expert retry logic
    
    Args:
        tracking_number: The Bosta tracking number
        max_retries: Maximum number of retry attempts (default: from config)
        
    Returns:
        Dictionary with order details or error information
    """
    if max_retries is None:
        max_retries = API_CONFIG['max_retries']
    
    url = f"{API_BASE_URL}/deliveries/business/{tracking_number}"
    
    retries = 0
    while retries < max_retries:
        logger.debug(f"🌐 Fetching details for tracking number: {tracking_number}")
        result = make_api_request(url, method='GET')
        
        if result.get('success'):
            logger.debug(f"✅ Order details fetched successfully for {tracking_number}")
            return result
        
        # Handle 404 errors (order not found)
        if result.get('status_code') == 404:
            logger.warning(f"📭 Order {tracking_number} not found")
            return result
        
        # Handle authentication errors
        if result.get('status_code') == 401 and retries < max_retries - 1:
            logger.info("🔐 Authentication error, attempting to login and retry...")
            auth_result = handle_auth_error(lambda: make_api_request(url, method='GET'))
            if auth_result.get('success'):
                return auth_result
        
        # Handle rate limiting
        if result.get('status_code') == 429 and retries < max_retries - 1:
            delay = API_CONFIG['retry_delay'] * (API_CONFIG['backoff_factor'] ** retries)
            logger.info(f"⏰ Rate limited. Waiting {delay} seconds before retry...")
            # time.sleep(delay)
            retries += 1
            continue
        
        # Handle server errors with exponential backoff
        if 500 <= result.get('status_code', 0) < 600 and retries < max_retries - 1:
            delay = API_CONFIG['retry_delay'] * (API_CONFIG['backoff_factor'] ** retries)
            logger.info(f"🔧 Server error. Retrying in {delay} seconds ({retries + 1}/{max_retries})...")
            # time.sleep(delay)
            retries += 1
            continue
        
        # Handle connection errors with exponential backoff
        if 'connection error' in result.get('error', '').lower() and retries < max_retries - 1:
            delay = API_CONFIG['retry_delay'] * (API_CONFIG['backoff_factor'] ** retries)
            logger.info(f"🌐 Connection error. Retrying in {delay} seconds ({retries + 1}/{max_retries})...")
            # time.sleep(delay)
            retries += 1
            continue
        
        # For other errors or if we've reached max retries, return the result
        if retries >= max_retries - 1:
            logger.error(f"❌ Maximum retries ({max_retries}) reached for tracking number {tracking_number}")
            return result
            
        retries += 1
    
    return {
        'success': False,
        'error': f'Maximum retries ({max_retries}) reached'
    } 