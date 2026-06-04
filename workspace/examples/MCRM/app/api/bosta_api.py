# app/api/bosta_api.py
"""Bosta API endpoints."""
from flask import Blueprint, request, jsonify, current_app
from app.utils.auth import require_auth
import logging
from app.services.bosta_service import BostaAPIService, BostaException, get_customer_orders_unified, sync_customer_data
from app.utils.responses import success_response, error_response
from app.utils.validators import validate_phone_number

logger = logging.getLogger(__name__)

bosta_api_blueprint = Blueprint('bosta_api', __name__, url_prefix='/api/bosta')

@bosta_api_blueprint.route('/search', methods=['POST'])
@require_auth
def search_deliveries():
    """
    Search Bosta deliveries by phone, name, or tracking number
    POST /api/bosta/search
    Body: {
        "phone": "optional phone number",
        "name": "optional customer name", 
        "tracking": "optional tracking number",
        "page": 1,
        "limit": 50,
        "group": false
    }
    """
    try:
        data = request.get_json() or {}
        
        phone = data.get('phone')
        name = data.get('name')
        tracking = data.get('tracking')
        page = data.get('page', 1)
        limit = min(data.get('limit', 50), 100)  # Cap at 100
        group = data.get('group', False)
        
        # Validate input
        if not any([phone, name, tracking]):
            return error_response("At least one search parameter (phone, name, tracking) is required", 400)
        
        if phone and not validate_phone_number(phone):
            return error_response("Invalid phone number format", 400)
        
        # Search deliveries
        success, result, error = BostaAPIService.search_deliveries(
            phone=phone,
            name=name,
            tracking=tracking,
            page=page,
            limit=limit,
            group=group
        )
        
        if not success:
            return error_response(error, 400)
        
        return success_response(result, "Search completed successfully")
        
    except Exception as e:
        logger.error(f"Error in search_deliveries endpoint: {str(e)}")
        return error_response("Internal server error", 500)

@bosta_api_blueprint.route('/order/<tracking_number>', methods=['GET'])
@require_auth
def get_order_details(tracking_number):
    """
    Get order details by tracking number
    GET /api/bosta/order/{tracking_number}
    Query Params:
        force_sync (bool): Set to 'true' to bypass cache and fetch from Bosta.
    """
    try:
        if not tracking_number:
            return error_response("Tracking number is required", 400)
        
        force_sync = request.args.get('force_sync', 'false').lower() == 'true'
        
        success, result, error = BostaAPIService.fetch_order_data(tracking_number, force_sync=force_sync)
        
        if not success:
            return error_response(error, 404)
        
        return success_response(result, "Order details retrieved successfully")
        
    except Exception as e:
        logger.error(f"Error in get_order_details endpoint: {str(e)}")
        return error_response("Internal server error", 500)

@bosta_api_blueprint.route('/customer/<phone_number>/orders', methods=['GET'])
@require_auth
def get_customer_orders(phone_number):
    """
    Get customer orders in unified format
    GET /api/bosta/customer/{phone_number}/orders

    Query:
        enrich (default true): pass 0/false/no/minimal to skip per-order business merges (faster; search payload only).
    """
    try:
        if not phone_number:
            return error_response("Phone number is required", 400)
        
        if not validate_phone_number(phone_number):
            return error_response("Invalid phone number format", 400)

        raw_enrich = (request.args.get('enrich') or '1').strip().lower()
        enrich = raw_enrich not in ('0', 'false', 'no', 'minimal', 'off')

        unified_data = get_customer_orders_unified(phone_number, enrich=enrich)
        
        return success_response(unified_data, "Customer orders retrieved successfully")
        
    except Exception as e:
        logger.error(f"Error in get_customer_orders endpoint: {str(e)}")
        return error_response("Internal server error", 500)

@bosta_api_blueprint.route('/customer/<phone_number>/sync', methods=['POST'])
@require_auth
def sync_customer(phone_number):
    """
    Sync customer data from Bosta to local database
    POST /api/bosta/customer/{phone_number}/sync
    """
    try:
        if not phone_number:
            return error_response("Phone number is required", 400)
        
        if not validate_phone_number(phone_number):
            return error_response("Invalid phone number format", 400)
        
        # Sync customer data
        customer_id = sync_customer_data(phone_number)
        
        if customer_id is None:
            return error_response("No orders found for this customer", 404)
        
        return success_response(
            {"customer_id": customer_id, "phone": phone_number}, 
            "Customer data synced successfully"
        )
        
    except BostaException as e:
        logger.error(f"Bosta error in sync_customer endpoint: {str(e)}")
        return error_response(str(e), 400)
    except Exception as e:
        logger.error(f"Error in sync_customer endpoint: {str(e)}")
        return error_response("Internal server error", 500)

@bosta_api_blueprint.route('/health', methods=['GET'])
def health_check():
    """
    Health check for Bosta API integration
    GET /api/bosta/health
    """
    try:
        # Check if token is configured
        token = BostaAPIService.get_token()
        if not token:
            return error_response("Bosta token not configured", 503)
        
        # Try a simple API call to verify connectivity
        success, result, error = BostaAPIService.search_deliveries(phone="+201000000000", limit=1)
        
        if success:
            return success_response({
                "status": "healthy",
                "token_configured": True,
                "api_accessible": True
            }, "Bosta API is healthy")
        else:
            return error_response(f"Bosta API not accessible: {error}", 503)
            
    except Exception as e:
        logger.error(f"Error in health_check endpoint: {str(e)}")
        return error_response("Health check failed", 503)
