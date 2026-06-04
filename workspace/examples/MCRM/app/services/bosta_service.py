# app/services/bosta_service.py
"""Bosta integration service."""
import requests
import json
import logging
from typing import Dict, Optional, Tuple, List, Any
from flask import current_app
from app.utils.bosta_converter import convert_bosta_order, convert_bosta_orders
from app.models import customer as customer_model
from app.models import bosta_order as bosta_order_model
from app.utils.phone_normalizer import normalize_to_local_phone, normalize_phone_safe

logger = logging.getLogger(__name__)

class BostaException(Exception):
    """Custom exception for Bosta API errors."""
    pass

class BostaAPIService:
    """Service for Bosta API integration"""
    
    BASE_URL = 'https://app.bosta.co/api/v2'
    
    @classmethod
    def get_token(cls):
        """Get Bosta token dynamically from environment or config"""
        import os
        
        # Try to get from environment first, then from config
        token = os.environ.get('BOSTA_TOKEN') or os.environ.get('BOSTA_API_KEY')
        if not token and current_app:
            token = current_app.config.get('BOSTA_TOKEN') or current_app.config.get('BOSTA_API_KEY')
        return token
    
    @classmethod
    def get_headers(cls):
        """Get headers for Bosta API requests"""
        token = cls.get_token()
        if not token:
            raise BostaException("BOSTA_TOKEN not configured")
        return {
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'ar',
            'Authorization': f'{token}',
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    
    @classmethod
    def normalize_phone(cls, phone: str) -> str:
        """
        Normalize Egyptian phone number to local format: 01XXXXXXXXX
        Accepts any format (+201, 201, 01, etc.) and returns 01XXXXXXXXX
        """
        if not phone:
            return phone
        
        # Ensure phone is a string
        if not isinstance(phone, str):
            logger.warning(f"BOSTA Service: phone is not a string, got {type(phone)}: {phone}")
            phone = str(phone)
        
        # Use the phone normalizer to convert to 01XXXXXXXXX format
        normalized = normalize_phone_safe(phone)
        if normalized:
            return normalized
        
        # If normalization fails, return original (for backward compatibility)
        logger.warning(f"BOSTA Service: Failed to normalize phone: {phone}")
        return phone
    
    @classmethod
    def fetch_order_data(cls, tracking_number: str, force_sync: bool = False) -> Tuple[bool, Optional[Dict], Optional[str]]:
        """
        Fetch order data from Bosta API and convert to unified format.
        It uses a local cache to avoid redundant API calls.

        Args:
            tracking_number (str): The tracking number of the order.
            force_sync (bool): If True, forces a fetch from the Bosta API 
                               and updates the cache.

        Returns:
            Tuple[bool, Optional[Dict], Optional[str]]: (success, unified_data, error_message)
        """
        if not tracking_number:
            return False, None, "Tracking number is required"

        # 1. Check cache first, unless force_sync is requested
        if not force_sync:
            cached_order = bosta_order_model.get_order_by_tracking_number(tracking_number)
            if cached_order:
                logger.info(f"Cache hit for tracking number: {tracking_number}")
                return True, cached_order, None

        logger.info(f"Cache miss or force sync for tracking number: {tracking_number}")
        # 2. Fetch from Bosta API if not in cache or if forced
        try:
            if not cls.get_token():
                return False, None, "BOSTA_TOKEN not configured on server"

            # Try the business endpoint first
            url = f"{cls.BASE_URL}/deliveries/business/{tracking_number}"
            response = requests.get(url, headers=cls.get_headers(), timeout=10)

            raw_data = None
            if response.status_code == 200:
                data = response.json()
                raw_data = data.get('data', data)

            elif response.status_code == 404:
                # If not found in business endpoint, try search by tracking number
                search_url = f"{cls.BASE_URL}/deliveries/search"
                search_payload = {
                    "limit": 1,
                    "page": 1,
                    "sortBy": "-updatedAt",
                    "trackingNumbers": [tracking_number]
                }
                search_response = requests.post(search_url, headers=cls.get_headers(), json=search_payload, timeout=10)

                if search_response.status_code == 200:
                    search_data = search_response.json()
                    # Handle different response structures
                    deliveries = None
                    if 'data' in search_data and 'deliveries' in search_data['data']:
                        deliveries = search_data['data']['deliveries']
                    elif 'deliveries' in search_data:
                        deliveries = search_data['deliveries']

                    if deliveries and len(deliveries) > 0:
                        # Find the delivery with the matching tracking number
                        for delivery in deliveries:
                            if delivery.get('trackingNumber') == tracking_number:
                                raw_data = delivery
                                break
                        
                        if not raw_data:
                            return False, None, "Order not found with this tracking number"
                    else:
                        return False, None, "Order not found with this tracking number"
                else:
                    return False, None, f"Search error: {search_response.status_code}"
            elif response.status_code == 401:
                return False, None, "Authentication error - check API settings"
            elif response.status_code == 400:
                try:
                    error_data = response.json()
                    error_message = error_data.get('message', f'Request error: {response.status_code}')
                    return False, None, error_message
                except:
                    return False, None, f"Request error: {response.status_code}"
            else:
                return False, None, f"Server error: {response.status_code}"

            # Convert raw data to unified format using the converter
            if raw_data:
                try:
                    bosta_response = {'success': True, 'data': raw_data}
                    unified_order = convert_bosta_order(bosta_response)

                    # 3. Cache the successful result, but do not fail the request if cache write fails.
                    try:
                        bosta_order_model.upsert_order(tracking_number, unified_order)
                        logger.info(f"Cached order for tracking number: {tracking_number}")
                    except Exception as cache_error:
                        logger.warning(f"Failed to cache order {tracking_number}: {cache_error}")

                    return True, unified_order, None
                except Exception as e:
                    logger.error(f"Error converting order data: {str(e)}")
                    return False, None, f"Error processing order data: {str(e)}"
            else:
                return False, None, "No order data found"

        except requests.exceptions.RequestException as e:
            error_message = f"Network error fetching Bosta data for {tracking_number}: {e}"
            logger.error(error_message)
            return False, None, error_message
        except Exception as e:
            error_message = f"An unexpected error occurred while fetching Bosta data for {tracking_number}: {e}"
            logger.error(error_message)
            return False, None, error_message

    @classmethod
    def search_deliveries(cls, *, phone: Optional[str] = None, name: Optional[str] = None,
                          tracking: Optional[str] = None, page: int = 1, limit: int = 50,
                          group: bool = False) -> Tuple[bool, Optional[Dict], Optional[str]]:
        """
        Enhanced search Bosta deliveries by phone, name, or tracking using /deliveries/search
        Returns: (success, data, error_message)
        """
        try:
            if not cls.get_token():
                return False, None, "BOSTA_TOKEN not configured on server"
            
            url = f"{cls.BASE_URL}/deliveries/search"
            payload: Dict = {
                "limit": limit,
                "page": page,
                "sortBy": "-updatedAt",
            }

            if phone:
                # Normalize phone number
                clean_phone = cls.normalize_phone(phone)
                payload["mobilePhones"] = [clean_phone]
                logger.info(f"Searching by phone: {phone} -> {clean_phone}")

            if tracking:
                payload["trackingNumbers"] = [tracking] if isinstance(tracking, str) else tracking
                logger.info(f"Searching by tracking: {tracking}")

            if name and not tracking and not phone:
                payload["searchTerm"] = name
                logger.info(f"Searching by name: {name}")

            logger.info(f"Bosta API request to {url}: {json.dumps(payload, indent=2)}")

            response = requests.post(url, headers=cls.get_headers(), json=payload, timeout=12)

            logger.info(f"Bosta API response status: {response.status_code}")

            if response.status_code == 200:
                data = response.json()
                logger.info(f"Bosta API success: {json.dumps(data, indent=2)[:500]}...")

                # Extract deliveries from response
                deliveries = []
                if isinstance(data, dict):
                    if 'deliveries' in data:
                        deliveries = data['deliveries']
                    elif 'data' in data and 'deliveries' in data['data']:
                        deliveries = data['data']['deliveries']

                if not deliveries:
                    return True, {'orders': [], 'totalOrders': 0, 'types': [], 'processedAt': '2025-10-12T00:00:00.000Z'}, None

                # Convert all deliveries to unified format using the converter
                try:
                    bosta_responses = [{'success': True, 'data': d} for d in deliveries]
                    unified_data = convert_bosta_orders(bosta_responses)
                    
                    # Transform search response to grouped customer format if requested
                    if group:
                        grouped_data = cls._transform_search_response_to_unified(unified_data)
                        logger.info(f"Grouped {len(grouped_data.get('customers', []))} customers")
                        return True, grouped_data, None
                    else:
                        # Return unified search results
                        return True, unified_data, None
                        
                except Exception as e:
                    logger.error(f"Error converting search results: {str(e)}")
                    return False, None, f"Error processing search results: {str(e)}"

            elif response.status_code == 401:
                logger.error(f"Bosta API authentication error: {response.text}")
                return False, None, "Authentication error - check API settings"
            elif response.status_code == 400:
                logger.error(f"Bosta API bad request: {response.text}")
                return False, None, f"Bad request: {response.text}"
            else:
                logger.error(f"Bosta API error {response.status_code}: {response.text}")
                return False, None, f"Server error: {response.status_code} - {response.text}"
                
        except requests.RequestException as e:
            logger.error(f"Network error in Bosta search: {str(e)}")
            return False, None, f"Network error: {str(e)}"
        except Exception as e:
            logger.error(f"Unexpected error in Bosta search: {str(e)}")
            import traceback
            traceback.print_exc()
            return False, None, f"Unexpected error: {str(e)}"
    
    @classmethod
    def _transform_search_response_to_unified(cls, unified_data: Dict) -> Dict:
        """Transform unified search response to grouped customer format"""
        orders = unified_data.get('orders', [])
        
        # Group orders by customer phone
        customers_dict = {}
        for order in orders:
            customer = order.get('customer', {})
            phone = customer.get('phone', '')
            
            if phone not in customers_dict:
                customers_dict[phone] = {
                    'phone': phone,
                    'name': customer.get('name', ''),
                    'secondPhone': customer.get('secondPhone'),
                    'address': order.get('customerAddress', {}),
                    'orders': []
                }
            
            customers_dict[phone]['orders'].append(order)
        
        return {
            'customers': list(customers_dict.values()),
            'totalCustomers': len(customers_dict),
            'totalOrders': len(orders),
            'types': unified_data.get('types', []),
            'processedAt': unified_data.get('processedAt', '2025-10-12T00:00:00.000Z')
        }


def fetch_customer_orders(phone_number):
    """Fetches all orders for a phone number from Bosta in unified format."""
    success, data, error = BostaAPIService.search_deliveries(phone=phone_number, limit=100)
    if not success:
        raise BostaException(f"Error fetching Bosta orders: {error}")
    
    # Return unified orders
    if isinstance(data, dict) and 'orders' in data:
        return data['orders']
    
    return []

def fetch_order_details(tracking_number, force_sync=False):
    """Fetches details for a single order from Bosta in unified format."""
    success, data, error = BostaAPIService.fetch_order_data(tracking_number, force_sync=force_sync)
    if not success:
        raise BostaException(f"Error fetching Bosta order details: {error}")
    return data

def sync_customer_data(phone_number):
    """
    Fetches customer orders from Bosta, transforms them, and upserts
    the data into the local database.
    """
    try:
        # Use the new search method to get unified data directly
        success, unified_data, error = BostaAPIService.search_deliveries(phone=phone_number, limit=100)
        if not success:
            logger.error(f"Error searching customer orders: {error}")
            return None
        
        # Extract unified orders from response
        unified_orders = []
        if isinstance(unified_data, dict):
            if 'orders' in unified_data:
                unified_orders = unified_data['orders']
            elif 'customers' in unified_data:
                # Handle grouped response
                for customer in unified_data['customers']:
                    if customer.get('phone') == BostaAPIService.normalize_phone(phone_number):
                        unified_orders = customer.get('orders', [])
                        break
        
        if not unified_orders:
            logger.info(f"No orders found for phone: {phone_number}")
            return None
            
        # Use the latest order as the source of truth for customer details
        latest_order = sorted(unified_orders, key=lambda o: o.get('creationTimestamp', 0), reverse=True)[0]
        
        customer_details = latest_order.get('customer', {})
        address_details = latest_order.get('customerAddress', {})
        
        # Ensure customer_details and address_details are dicts
        if not isinstance(customer_details, dict):
            logger.warning(f"BOSTA Service: customer_details is not a dict, got {type(customer_details)}: {customer_details}")
            customer_details = {}
        
        if not isinstance(address_details, dict):
            logger.warning(f"BOSTA Service: address_details is not a dict, got {type(address_details)}: {address_details}")
            address_details = {}

        # Safely extract string values
        def safe_get_string(data, key, default=''):
            value = data.get(key, default)
            if value and not isinstance(value, str):
                logger.warning(f"BOSTA Service: {key} is not a string, got {type(value)}: {value}")
                value = str(value)
            return value
        
        # Safely serialize bosta_orders to JSON string
        import json
        bosta_orders_json = json.dumps(unified_orders, ensure_ascii=False) if unified_orders else '[]'
        
        upsert_data = {
            'name': safe_get_string(customer_details, 'name'),
            'phone': safe_get_string(customer_details, 'phone'),
            'phone_secondary': customer_details.get('secondPhone'),
            'governorate': safe_get_string(address_details, 'city'), # Bosta 'city' is our 'governorate'
            'city': safe_get_string(address_details, 'zone'),       # Bosta 'zone' is our 'city'
            'address_details': safe_get_string(address_details, 'fullAddress'),
            'bosta_orders': bosta_orders_json # Store as JSON string
        }
        
        customer_id = customer_model.upsert_customer_bosta_data(upsert_data)
        logger.info(f"Successfully synced customer data for phone: {phone_number}, customer_id: {customer_id}")
        return customer_id
        
    except Exception as e:
        logger.error(f"Error syncing customer data for phone {phone_number}: {str(e)}")
        raise BostaException(f"Error syncing customer data: {str(e)}")


def _package_description_missing(ord_dict: Any) -> bool:
    """Search payloads often omit returnSpecs; business endpoint has full package text."""
    if not isinstance(ord_dict, dict):
        return True
    pkg = ord_dict.get('package') if isinstance(ord_dict.get('package'), dict) else {}
    raw = pkg.get("description")
    if raw is None or raw == "":
        return True
    if isinstance(raw, str):
        return not raw.strip()
    return False


def _nonempty_desc(val) -> Optional[str]:
    if val is None:
        return None
    t = str(val).strip()
    return t if t else None


def _enrich_single_order_with_business(order: Any) -> Any:
    """Merge one search-hit order with Bosta business/detail when fees or package text are thin."""
    if not isinstance(order, dict):
        return order

    tracking = order.get('trackingNumber') or order.get('tracking_number')
    if not tracking:
        return order

    financial = order.get('financial', {})
    if not isinstance(financial, dict):
        financial = {}

    fees_missing = financial.get('bostaFees') in (None, "", 0, 0.0)
    needs_detail_refresh = fees_missing or _package_description_missing(order)

    detail_success, detailed_order, _ = BostaAPIService.fetch_order_data(
        tracking,
        force_sync=needs_detail_refresh,
    )

    if detail_success and isinstance(detailed_order, dict):
        merged_order = {**order, **detailed_order}
        for nested_key in (
            'status',
            'customer',
            'customerAddress',
            'package',
            'financial',
            'communication',
            'timestamps',
            'star',
        ):
            search_nested = order.get(nested_key, {})
            detail_nested = detailed_order.get(nested_key, {})
            if isinstance(search_nested, dict) or isinstance(detail_nested, dict):
                s = search_nested if isinstance(search_nested, dict) else {}
                d = detail_nested if isinstance(detail_nested, dict) else {}
                if nested_key == "package":
                    merged_pkg = {**s, **d}
                    best_desc = _nonempty_desc(d.get("description")) or _nonempty_desc(
                        s.get("description")
                    )
                    if best_desc:
                        merged_pkg["description"] = best_desc
                    merged_order["package"] = merged_pkg
                else:
                    merged_order[nested_key] = {**s, **d}
        dn = detailed_order.get("notes")
        sn = order.get("notes")
        if isinstance(dn, str) and dn.strip():
            merged_order["notes"] = dn.strip()
        elif isinstance(sn, str) and sn.strip():
            merged_order["notes"] = sn.strip()
        return merged_order

    return order


def get_customer_orders_unified(phone_number, enrich: bool = True):
    """
    Get customer orders in unified format using the converter.

    Args:
        phone_number: Customer phone (normalized by search_deliveries).
        enrich: If False, return Bosta search results only (one upstream call). Fast for call-center lists.
                If True, merge business/detail per order when needed (parallelized).
    """
    try:
        success, unified_data, error = BostaAPIService.search_deliveries(phone=phone_number, limit=100)
        if not success:
            return {'orders': [], 'totalOrders': 0, 'types': [], 'processedAt': '2025-10-12T00:00:00.000Z'}

        if not isinstance(unified_data, dict):
            return {'orders': [], 'totalOrders': 0, 'types': [], 'processedAt': '2025-10-12T00:00:00.000Z'}

        orders = unified_data.get('orders', [])

        if not enrich:
            enriched_orders = [o for o in orders if isinstance(o, dict)]
            return {
                **unified_data,
                'orders': enriched_orders,
                'totalOrders': len(enriched_orders),
                'types': list(dict.fromkeys(
                    order.get('type') for order in enriched_orders if order.get('type')
                )),
            }

        dict_orders = [o for o in orders if isinstance(o, dict)]
        if not dict_orders:
            return {
                **unified_data,
                'orders': [],
                'totalOrders': 0,
                'types': [],
            }

        # Sequential enrichment only: fetch_order_data uses Flask request-scoped DB (g); no thread pool.
        enriched_orders = [_enrich_single_order_with_business(o) for o in dict_orders]

        return {
            **unified_data,
            'orders': enriched_orders,
            'totalOrders': len(enriched_orders),
            'types': list(dict.fromkeys(
                order.get('type') for order in enriched_orders
                if isinstance(order, dict) and order.get('type')
            )),
        }

    except Exception as e:
        logger.error(f"Error getting unified customer orders: {str(e)}")
        return {'orders': [], 'totalOrders': 0, 'types': [], 'processedAt': '2025-10-12T00:00:00.000Z'}

def fetch_ticket_bosta_orders(original_tracking=None, new_tracking_send=None, new_tracking_receive=None, force_sync=False):
    """
    Fetch Bosta order data for ticket tracking numbers.
    Returns array of unified order objects.
    
    Args:
        original_tracking: Original Bosta order tracking number
        new_tracking_send: Tracking for items sent TO the customer
        new_tracking_receive: Tracking for items received FROM the customer
        force_sync (bool): If True, forces a fetch from Bosta for all tracking numbers.
    
    Returns:
        list: Array of unified order objects
    """
    bosta_orders = []
    tracking_numbers = [
        ('original_tracking', original_tracking),
        ('new_tracking_send', new_tracking_send),
        ('new_tracking_receive', new_tracking_receive)
    ]
    
    for tracking_label, tracking_number in tracking_numbers:
        if tracking_number:
            try:
                logger.info(f"Fetching Bosta order for {tracking_label}: {tracking_number}")
                success, unified_order, error = BostaAPIService.fetch_order_data(tracking_number, force_sync=force_sync)
                
                if success and unified_order:
                    # Add tracking type label to the order
                    unified_order['tracking_type'] = tracking_label
                    bosta_orders.append(unified_order)
                    logger.info(f"Successfully fetched order for {tracking_label}: {tracking_number}")
                else:
                    logger.warning(f"Failed to fetch order for {tracking_label} {tracking_number}: {error}")
            except Exception as e:
                logger.error(f"Error fetching order for {tracking_label} {tracking_number}: {str(e)}")
                continue
    
    logger.info(f"Fetched {len(bosta_orders)} Bosta orders for ticket")
    return bosta_orders