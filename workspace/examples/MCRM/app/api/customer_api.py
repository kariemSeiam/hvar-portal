# app/api/customer_api.py
"""Customer API endpoints."""
import pymysql
from flask import Blueprint, request, jsonify, g
from app.utils.auth import require_auth
from app.services import bosta_service
from app.models import customer as customer_model
from app.services.bosta_service import BostaAPIService, BostaException
from app.utils.validators import is_phone_number, is_tracking_number
from app.utils.pagination import parse_pagination_params
from app.utils.messages import get_message, get_error_message
from app.utils.phone_normalizer import normalize_to_local_phone, normalize_phone_safe

customer_api_blueprint = Blueprint('customer_api', __name__, url_prefix='/api/customers')

@customer_api_blueprint.route('/', methods=['GET'])
@require_auth
def list_customers_endpoint():
    """List all customers with pagination."""
    limit, offset = parse_pagination_params(request)
    
    customers = customer_model.list_customers(limit, offset)
    total = customer_model.get_customers_count()
    
    return jsonify({
        "data": customers,
        "pagination": {
            "total": total,
            "limit": limit,
            "offset": offset,
            "has_more": offset + limit < total
        }
    })

@customer_api_blueprint.route('/', methods=['POST'])
@require_auth
def create_customer_endpoint():
    """Create a new customer."""
    import logging
    logger = logging.getLogger(__name__)
    
    data = request.get_json()
    if not data:
        return jsonify({"error": get_message("missing_fields")}), 400
    
    # Validate required fields
    if not data.get('name'):
        return jsonify({"error": get_message("name_required")}), 400
    
    if not data.get('phone'):
        return jsonify({"error": get_message("phone_required")}), 400
    
    # Normalize phone numbers to 01XXXXXXXXX format
    try:
        normalized_phone = normalize_to_local_phone(data['phone'])
    except Exception as e:
        return jsonify({"error": f"Invalid phone number format: {str(e)}"}), 400
    
    normalized_phone_secondary = None
    if data.get('phone_secondary'):
        try:
            normalized_phone_secondary = normalize_to_local_phone(data['phone_secondary'])
        except Exception:
            # Secondary phone is optional, so if invalid, just skip it
            pass
    
    # Check if phone already exists (using normalized format)
    existing_customer = customer_model.get_customer_by_phone(normalized_phone)
    if existing_customer:
        return jsonify({
            "error": get_message("duplicate_phone"),
            "code": "duplicate_phone",
            "existing_customer": existing_customer
        }), 409
    
    # Prepare customer data with defaults
    customer_data = {
        'name': data['name'],
        'phone': normalized_phone,  # Use normalized phone
        'phone_secondary': normalized_phone_secondary,  # Use normalized secondary phone
        'governorate': data.get('governorate'),
        'city': data.get('city'),
        'address_details': data.get('address_details'),
        'bosta_orders': '[]',  # Empty JSON array
        'customer_services': '[]',  # Empty JSON array
        'created_by': data.get('created_by', 'api_create')
    }
    
    try:
        logger.info(f"Creating new customer with data: {customer_data}")
        customer_id = customer_model.create_customer(customer_data)
        
        if customer_id:
            # Return the created customer
            new_customer = customer_model.get_customer_by_id(customer_id)
            return jsonify({
                "message": get_message("customer_created"),
                "data": new_customer
            }), 201
        else:
            return jsonify({"error": get_message("failed_create")}), 500
            
    except Exception as e:
        logger.error(f"Error creating customer: {str(e)}")
        return jsonify({"error": f"An error occurred while creating customer: {str(e)}"}), 500

@customer_api_blueprint.route('/search', methods=['GET'])
@require_auth
def search_customers_endpoint():
    """
    Universal search for customers.
    Searches locally first. If not found, attempts to search Bosta by phone or tracking number
    and syncs the customer if found.
    Accepts 'q' for query and optional 'type' ('phone' or 'tracking').
    """
    query = request.args.get('q')
    search_type = request.args.get('type') # Optional: 'phone', 'tracking'
    limit = request.args.get('limit', 20, type=int)
    offset = request.args.get('offset', 0, type=int)

    if not query:
        return jsonify({"error": get_message("missing_fields")}), 400

    # 1. First, search in the local database
    customers = customer_model.search_customers(query, limit, offset)
    if customers:
        return jsonify(customers)

    # 2. If not found locally, determine search type and try to sync from Bosta
    phone_to_sync = None

    if (search_type == 'phone') or (not search_type and is_phone_number(query)):
        # Normalize phone to 01XXXXXXXXX format for syncing
        phone_to_sync = normalize_phone_safe(query) or BostaAPIService.normalize_phone(query)
    
    elif (search_type == 'tracking') or (not search_type and is_tracking_number(query)):
        try:
            success, order_data, error = BostaAPIService.fetch_order_data(query)
            if success and order_data:
                customer_details = order_data.get('customer', {})
                if customer_details and customer_details.get('phone'):
                    # Normalize phone from Bosta order data
                    phone_to_sync = normalize_phone_safe(customer_details['phone']) or customer_details['phone']
                else:
                    return jsonify({"error": get_message("no_customer")}), 404
            else:
                 return jsonify({"error": get_message("bosta_no_orders")}), 404
        except BostaException as e:
            return jsonify({"error": f"Bosta API error when searching by tracking number: {str(e)}"}), 500

    if not phone_to_sync:
        # If we couldn't determine a phone number to sync, return empty
        return jsonify([])

    # 3. Sync customer data using the determined phone number
    try:
        customer_id = bosta_service.sync_customer_data(phone_to_sync)
        if customer_id:
            synced_customer = customer_model.get_customer_by_id(customer_id)
            return jsonify([synced_customer]) # Return as an array to match search format
        else:
            return jsonify([]) # No orders found on Bosta for this number
            
    except BostaException as e:
        return jsonify({"error": f"Failed to sync with Bosta: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": f"An unexpected error occurred during sync: {str(e)}"}), 500


@customer_api_blueprint.route('/<int:customer_id>', methods=['GET'])
@require_auth
def get_customer_endpoint(customer_id):
    """
    Get customer details by ID.
    This endpoint also triggers a fresh sync from Bosta.
    """
    customer = customer_model.get_customer_by_id(customer_id)
    if not customer:
        return jsonify({"error": get_message("not_found_customer")}), 404

    try:
        # Trigger a fresh sync from Bosta
        bosta_service.sync_customer_data(customer['phone'])
        # Re-fetch the customer to get the updated data
        updated_customer = customer_model.get_customer_by_id(customer_id)
        return jsonify(updated_customer)
    except bosta_service.BostaException as e:
        # If Bosta fails, return the stale data with a warning
        return jsonify({
            "warning": get_message("bosta_sync_failed"),
            "data": customer
        }), 200

@customer_api_blueprint.route('/<int:customer_id>', methods=['PUT'])
@require_auth
def update_customer_endpoint(customer_id):
    """Update customer address information."""
    import logging
    logger = logging.getLogger(__name__)
    
    # Check if customer exists
    customer = customer_model.get_customer_by_id(customer_id)
    if not customer:
        return jsonify({"error": get_message("not_found_customer")}), 404
    
    data = request.get_json()
    if not data:
        return jsonify({"error": get_message("missing_fields")}), 400
    
    original_phone = customer.get('phone')

    # Validate and prepare update data
    allowed_fields = ['name', 'phone', 'governorate', 'city', 'address_details', 'phone_secondary', 'updated_by']
    update_data = {}
    
    for field in allowed_fields:
        if field in data:
            value = data[field]
            if value is not None and value != '':
                # Normalize phone fields if provided
                if field in ('phone', 'phone_secondary'):
                    try:
                        update_data[field] = normalize_to_local_phone(value)
                    except Exception:
                        # If normalization fails, skip the field (don't update with invalid phone)
                        continue
                else:
                    update_data[field] = value
            else:
                # Allow clearing fields by setting them to None
                update_data[field] = None
    
    # Set default updated_by if not provided
    if 'updated_by' not in update_data:
        update_data['updated_by'] = 'api_update'
    
    # Remove updated_by from the check since it's always set
    fields_to_check = {k: v for k, v in update_data.items() if k != 'updated_by'}
    if not fields_to_check:
        return jsonify({"error": get_message("no_changes")}), 400

    merge_performed = False
    primary_phone_conflict = None

    # Detect primary-phone conflict first; merge will run only after all validations pass.
    if update_data.get('phone') is not None:
        logger.info(f"[PHONE CHANGE] Customer {customer_id}: {original_phone} → {update_data['phone']}")
        primary_phone_conflict = customer_model.get_customer_primary_phone_conflict(
            update_data['phone'], customer_id
        )
        if primary_phone_conflict:
            logger.warning(
                f"[PHONE CONFLICT] Customer {customer_id} trying to use phone {update_data['phone']} "
                f"already owned by customer {primary_phone_conflict['id']} ({primary_phone_conflict.get('name')})"
            )
        else:
            logger.info(f"[NO CONFLICT] Phone {update_data['phone']} is available for customer {customer_id}")

    # Secondary cannot be another customer's primary (identity collision in UI/search)
    if update_data.get('phone_secondary') is not None:
        conflict = customer_model.get_customer_primary_phone_conflict(
            update_data['phone_secondary'], customer_id
        )
        if conflict:
            return jsonify({
                "error": get_message("duplicate_phone"),
                "code": "duplicate_phone",
                "conflict_field": "phone_secondary",
                "existing_customer": conflict
            }), 409

    # Effective values after patch — primary and secondary must not be identical on the same row
    effective_primary = (
        update_data['phone'] if 'phone' in update_data else customer.get('phone')
    )
    effective_secondary = (
        update_data['phone_secondary'] if 'phone_secondary' in update_data else customer.get('phone_secondary')
    )
    if (
        effective_primary
        and effective_secondary
        and effective_primary == effective_secondary
    ):
        return jsonify({"error": get_message("phone_primary_secondary_same")}), 400

    try:
        # Run merge only after all validations above have passed.
        if primary_phone_conflict:
            logger.info(
                f"[MERGE START] Merging customer {primary_phone_conflict['id']} INTO customer {customer_id}"
            )
            merge_ok = customer_model.merge_customer_into(
                target_customer_id=customer_id,
                source_customer_id=primary_phone_conflict['id'],
                target_phone=update_data.get('phone'),
                target_name=update_data.get('name') or customer.get('name'),
                updated_by=update_data.get('updated_by', 'api_update')
            )
            if not merge_ok:
                logger.error(f"[MERGE FAILED] Could not merge customer {primary_phone_conflict['id']} into {customer_id}")
                return jsonify({"error": get_message("failed_update")}), 500
            merge_performed = True
            logger.info(f"[MERGE SUCCESS] Customer {primary_phone_conflict['id']} merged into {customer_id}")

        logger.info(f"[UPDATE] Customer {customer_id} with data: {update_data}")
        success = customer_model.update_customer(customer_id, update_data)

        # If merge already happened, update may report 0 rows affected (no-op values). That's still success.
        if success or merge_performed:
            updated_customer = customer_model.get_customer_by_id(customer_id)
            logger.info(f"[SYNC] Syncing identity references for customer {customer_id}")
            customer_model.sync_customer_identity_references(
                customer_id=customer_id,
                old_phone=original_phone,
                new_phone=updated_customer.get('phone') if updated_customer else update_data.get('phone'),
                new_name=updated_customer.get('name') if updated_customer else update_data.get('name')
            )
            logger.info(
                f"[UPDATE SUCCESS] Customer {customer_id} updated. "
                f"Merged: {merge_performed}, Final phone: {updated_customer.get('phone') if updated_customer else 'N/A'}"
            )
            return jsonify({
                "message": get_message("customer_merged") if merge_performed else get_message("customer_updated"),
                "data": updated_customer
            })
        else:
            logger.error(f"[UPDATE FAILED] Customer {customer_id} update returned false")
            return jsonify({"error": get_message("failed_update")}), 500
            
    except pymysql.err.IntegrityError as e:
        if e.args and e.args[0] == 1062:
            logger.warning(
                "Customer update duplicate phone (race or bypass): customer_id=%s err=%s",
                customer_id,
                e,
            )
            return jsonify({
                "error": get_message("duplicate_phone"),
                "code": "duplicate_phone"
            }), 409
        logger.error(f"Integrity error updating customer {customer_id}: {str(e)}")
        return jsonify({"error": get_message("failed_update")}), 500
    except Exception as e:
        logger.error(f"Error updating customer {customer_id}: {str(e)}")
        return jsonify({"error": f"An error occurred while updating customer: {str(e)}"}), 500
