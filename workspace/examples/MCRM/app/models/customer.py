# app/models/customer.py
"""Customer model definition."""
# Define Customer model here
from app.utils.db import execute_insert, execute_query, execute_update, transaction
from app.utils.phone_normalizer import normalize_to_local_phone, normalize_phone_safe


def _reassign_calls_customer_phone_via_links(customer_id, new_phone_norm, cursor=None):
    """
    Set customer_phone on call rows tied to this customer through orders or tickets.
    Catches rows whose denormalized phone never matched normalize_phone_safe(old) updates.
    """
    if not customer_id or not new_phone_norm:
        return
    stmts = (
        (
            """
            UPDATE calls c
            INNER JOIN orders o ON o.id = c.linked_to_order_id
            SET c.customer_phone = %s
            WHERE o.customer_id = %s
            """,
            (new_phone_norm, customer_id),
        ),
        (
            """
            UPDATE calls c
            INNER JOIN service_tickets st ON st.id = c.linked_to_ticket_id
            SET c.customer_phone = %s
            WHERE st.customer_id = %s
            """,
            (new_phone_norm, customer_id),
        ),
    )
    if cursor:
        for sql, params in stmts:
            cursor.execute(sql, params)
    else:
        for sql, params in stmts:
            execute_update(sql, params)


def create_customer(data):
    """Create a new customer. Phone numbers are normalized to 01XXXXXXXXX format."""
    # Normalize phone numbers before insertion
    normalized_data = data.copy()
    
    if normalized_data.get('phone'):
        try:
            normalized_data['phone'] = normalize_to_local_phone(normalized_data['phone'])
        except Exception:
            raise ValueError(f"Invalid phone number format: {normalized_data.get('phone')}")
    
    if normalized_data.get('phone_secondary'):
        try:
            normalized_data['phone_secondary'] = normalize_to_local_phone(normalized_data['phone_secondary'])
        except Exception:
            # Secondary phone is optional, so if invalid, set to None
            normalized_data['phone_secondary'] = None
    
    sql = """
        INSERT INTO customers (name, phone, phone_secondary, governorate, city, address_details, created_by)
        VALUES (%(name)s, %(phone)s, %(phone_secondary)s, %(governorate)s, %(city)s, %(address_details)s, %(created_by)s)
    """
    return execute_insert(sql, normalized_data)

def get_customer_by_id(customer_id):
    """Get customer by ID."""
    sql = "SELECT * FROM customers WHERE id = %s"
    result = execute_query(sql, (customer_id,), json_fields=['bosta_orders', 'customer_services'])
    return result[0] if result else None

def get_customer_by_phone(phone):
    """Get customer by phone number. Phone is normalized to 01XXXXXXXXX format before searching."""
    # Normalize phone before searching
    normalized_phone = normalize_phone_safe(phone)
    if not normalized_phone:
        return None
    
    sql = "SELECT * FROM customers WHERE phone = %s"
    result = execute_query(sql, (normalized_phone,), json_fields=['bosta_orders', 'customer_services'])
    return result[0] if result else None


def get_customer_primary_phone_conflict(normalized_phone, exclude_customer_id):
    """
    If normalized_phone is already another customer's primary phone, return that row.
    Used before UPDATE to avoid MySQL UNIQUE on customers.phone and to mirror POST duplicate checks.
    """
    if not normalized_phone:
        return None
    row = get_customer_by_phone(normalized_phone)
    if row and row['id'] != exclude_customer_id:
        return row
    return None


def merge_customer_into(target_customer_id, source_customer_id, target_phone=None, target_name=None, updated_by='api_update'):
    """
    Merge source customer into target customer and move all references.
    Keeps target_customer_id as the surviving identity.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    if not source_customer_id or source_customer_id == target_customer_id:
        logger.warning(f"[MERGE] Invalid: source={source_customer_id}, target={target_customer_id}")
        return False

    target = get_customer_by_id(target_customer_id)
    source = get_customer_by_id(source_customer_id)
    if not target or not source:
        logger.error(f"[MERGE] Customer not found: target={target is not None}, source={source is not None}")
        return False
    
    logger.info(
        f"[MERGE] START: source_id={source_customer_id} ({source.get('name')}, {source.get('phone')}) "
        f"→ target_id={target_customer_id} ({target.get('name')}, {target.get('phone')})"
    )

    old_target_phone = normalize_phone_safe(target.get('phone') or '')
    old_source_phone = normalize_phone_safe(source.get('phone') or '')
    final_phone = normalize_phone_safe(target_phone or target.get('phone'))
    final_name = target_name or target.get('name')

    with transaction() as cursor:
        # 1) Move FK references first so deleting source won't lose data.
        cursor.execute(
            "UPDATE service_tickets SET customer_id = %s WHERE customer_id = %s",
            (target_customer_id, source_customer_id),
        )
        cursor.execute(
            "UPDATE orders SET customer_id = %s WHERE customer_id = %s",
            (target_customer_id, source_customer_id),
        )

        # 2) Normalize phone-based history rows to the final primary phone.
        phone_candidates = [p for p in {old_target_phone, old_source_phone, final_phone} if p]
        if phone_candidates and final_phone:
            placeholders = ', '.join(['%s'] * len(phone_candidates))

            # Calls rely heavily on customer_phone in 360/history views.
            cursor.execute(
                f"UPDATE calls SET customer_phone = %s WHERE customer_phone IN ({placeholders})",
                [final_phone] + phone_candidates,
            )

            # Orders keep denormalized phone/name fields used in UI/search.
            cursor.execute(
                f"UPDATE orders SET customer_phone = %s WHERE customer_id = %s OR customer_phone IN ({placeholders})",
                [final_phone, target_customer_id] + phone_candidates,
            )

        if final_phone:
            _reassign_calls_customer_phone_via_links(
                target_customer_id, final_phone, cursor=cursor
            )

        # 3) Keep order names consistent with surviving customer identity.
        if final_name:
            cursor.execute(
                "UPDATE orders SET customer_name = %s WHERE customer_id = %s",
                (final_name, target_customer_id),
            )

        # 4) Merge sparse profile fields from source when target is missing.
        merged_governorate = target.get('governorate') or source.get('governorate')
        merged_city = target.get('city') or source.get('city')
        merged_address = target.get('address_details') or source.get('address_details')
        merged_secondary = target.get('phone_secondary') or source.get('phone_secondary')
        if merged_secondary and final_phone and normalize_phone_safe(merged_secondary) == final_phone:
            merged_secondary = None

        cursor.execute(
            """
            UPDATE customers
            SET name = %s,
                phone = %s,
                phone_secondary = %s,
                governorate = %s,
                city = %s,
                address_details = %s,
                updated_by = %s
            WHERE id = %s
            """,
            (
                final_name,
                final_phone,
                merged_secondary,
                merged_governorate,
                merged_city,
                merged_address,
                updated_by,
                target_customer_id,
            ),
        )

        # 5) Delete merged source identity.
        logger.info(f"[MERGE] Deleting source customer {source_customer_id}")
        cursor.execute("DELETE FROM customers WHERE id = %s", (source_customer_id,))

    # Rebuild customer_services JSON snapshot for surviving customer.
    logger.info(f"[MERGE] Rebuilding customer_services for target {target_customer_id}")
    update_customer_services(target_customer_id)
    logger.info(f"[MERGE] COMPLETE: Customer {source_customer_id} merged into {target_customer_id}")
    return True


def sync_customer_identity_references(customer_id, old_phone=None, new_phone=None, new_name=None):
    """
    Keep denormalized order/call identity fields in sync after customer edits.
    """
    norm_old = normalize_phone_safe(old_phone) if old_phone else None
    norm_new = normalize_phone_safe(new_phone) if new_phone else None

    if norm_new:
        if norm_old and norm_old != norm_new:
            execute_update(
                "UPDATE calls SET customer_phone = %s WHERE customer_phone IN (%s, %s)",
                (norm_new, norm_old, norm_new),
            )
            execute_update(
                "UPDATE orders SET customer_phone = %s WHERE customer_id = %s OR customer_phone IN (%s, %s)",
                (norm_new, customer_id, norm_old, norm_new),
            )
        else:
            execute_update(
                "UPDATE orders SET customer_phone = %s WHERE customer_id = %s",
                (norm_new, customer_id),
            )
        _reassign_calls_customer_phone_via_links(customer_id, norm_new)

    if new_name:
        execute_update(
            "UPDATE orders SET customer_name = %s WHERE customer_id = %s",
            (new_name, customer_id),
        )

def list_customers(limit=20, offset=0):
    """List all customers with pagination."""
    sql = """
        SELECT * FROM customers 
        ORDER BY created_at DESC
        LIMIT %s OFFSET %s
    """
    return execute_query(sql, (limit, offset), json_fields=['bosta_orders', 'customer_services'])

def get_customers_count():
    """Get total count of customers."""
    sql = "SELECT COUNT(*) as count FROM customers"
    result = execute_query(sql)
    return result[0]['count'] if result else 0

def search_customers(query, limit=20, offset=0):
    """Search for customers by name or phone. Phone queries are normalized to 01XXXXXXXXX format."""
    # Try to normalize phone query
    normalized_phone = normalize_phone_safe(query)
    
    if normalized_phone:
        # Search using normalized phone format
        search_query = f"%{normalized_phone}%"
        sql = """
            SELECT * FROM customers
            WHERE name LIKE %s OR phone LIKE %s OR phone_secondary LIKE %s
            LIMIT %s OFFSET %s
        """
        params = (f"%{query}%", search_query, search_query, limit, offset)
        return execute_query(sql, params, json_fields=['bosta_orders', 'customer_services'])

    # Regular search for non-phone queries
    search_query = f"%{query}%"
    sql = """
        SELECT * FROM customers
        WHERE name LIKE %s OR phone LIKE %s OR phone_secondary LIKE %s
        LIMIT %s OFFSET %s
    """
    params = (search_query, search_query, search_query, limit, offset)
    return execute_query(sql, params, json_fields=['bosta_orders', 'customer_services'])

def update_customer(customer_id, data):
    """Update customer details. Phone numbers are normalized to 01XXXXXXXXX format."""
    import logging
    logger = logging.getLogger(__name__)
    
    if not isinstance(data, dict):
        logger.error(f"Customer Model: update_customer data is not a dict, got {type(data)}: {data}")
        raise ValueError("data must be a dictionary")
    
    # Ensure all keys are strings and normalize phone numbers
    safe_data = {}
    for key, value in data.items():
        if not isinstance(key, str):
            logger.warning(f"Customer Model: key is not a string, got {type(key)}: {key}")
            key = str(key)
        
        # Normalize phone / phone_secondary if provided
        if key == 'phone' and value:
            try:
                safe_data[key] = normalize_to_local_phone(value)
            except Exception:
                logger.warning(f"Customer Model: Failed to normalize phone: {value}")
                continue
        elif key == 'phone_secondary' and value:
            try:
                safe_data[key] = normalize_to_local_phone(value)
            except Exception:
                # If normalization fails, skip the field (don't update with invalid phone)
                logger.warning(f"Customer Model: Failed to normalize phone_secondary: {value}")
                continue
        else:
            safe_data[key] = value
    
    fields = ', '.join([f"{key} = %({key})s" for key in safe_data])
    sql = f"UPDATE customers SET {fields} WHERE id = %(customer_id)s"
    safe_data['customer_id'] = customer_id
    return execute_update(sql, safe_data) > 0

def update_customer_services(customer_id):
    """Update customer_services JSON snapshot for the customer.

    Includes notes and line items (with direction) so call-center / search matches
    ServiceModal / Hub full ticket cards — not only id/status/cost stubs.
    """
    import json

    sql = """
        SELECT id, ticket_number, service_type, status, created_at, updated_at,
               cost_adjustment, original_tracking, new_tracking_send, new_tracking_receive,
               notes, reason
        FROM service_tickets
        WHERE customer_id = %s
        ORDER BY created_at DESC
    """
    tickets = execute_query(sql, (customer_id,)) or []

    if tickets:
        ticket_ids = [t['id'] for t in tickets]
        placeholders = ','.join(['%s'] * len(ticket_ids))
        items_sql = f"""
            SELECT si.ticket_id, si.item_id, si.quantity, si.direction, si.`condition`,
                   s.sku, s.name, s.type AS item_type
            FROM service_items si
            JOIN stock_items s ON si.item_id = s.id
            WHERE si.ticket_id IN ({placeholders})
            ORDER BY si.id
        """
        all_items = execute_query(items_sql, tuple(ticket_ids)) or []
        items_by_ticket = {}
        for row in all_items:
            tid = row['ticket_id']
            raw_type = row.get('item_type') or 'part'
            if isinstance(raw_type, str):
                type_lower = raw_type.strip().lower()
            else:
                type_lower = 'part'
            items_by_ticket.setdefault(tid, []).append({
                'item_id': row['item_id'],
                'name': row['name'],
                'sku': row['sku'],
                'quantity': row['quantity'],
                'direction': row['direction'],
                'condition': row['condition'],
                'type': type_lower,
            })
        for t in tickets:
            t['items'] = items_by_ticket.get(t['id'], [])

    customer_services = json.dumps(tickets, default=str)
    
    # Update the customer record
    sql = "UPDATE customers SET customer_services = %s WHERE id = %s"
    execute_update(sql, (customer_services, customer_id))
    
    return True

def upsert_customer_bosta_data(bosta_data):
    """
    Upsert customer data based on Bosta information.
    Creates a new customer or updates an existing one based on the phone number.
    Phone numbers are normalized to 01XXXXXXXXX format.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    if not isinstance(bosta_data, dict):
        logger.error(f"Customer Model: bosta_data is not a dict, got {type(bosta_data)}: {bosta_data}")
        raise ValueError("bosta_data must be a dictionary")
    
    phone = bosta_data.get('phone')
    if phone and not isinstance(phone, str):
        logger.warning(f"Customer Model: phone is not a string, got {type(phone)}: {phone}")
        phone = str(phone)
    
    # Normalize phone before searching
    normalized_phone = normalize_phone_safe(phone) if phone else None
    if normalized_phone:
        bosta_data['phone'] = normalized_phone
    
    # Normalize phone_secondary if provided
    if bosta_data.get('phone_secondary'):
        try:
            bosta_data['phone_secondary'] = normalize_to_local_phone(bosta_data['phone_secondary'])
        except Exception:
            bosta_data['phone_secondary'] = None
    
    existing_customer = get_customer_by_phone(normalized_phone) if normalized_phone else None
    
    if existing_customer:
        # Update existing customer
        sql = """
            UPDATE customers SET name = %(name)s, phone_secondary = %(phone_secondary)s, 
                               governorate = %(governorate)s, city = %(city)s, 
                               address_details = %(address_details)s, bosta_orders = %(bosta_orders)s,
                               updated_by = 'bosta_sync'
            WHERE id = %(customer_id)s
        """
        bosta_data['customer_id'] = existing_customer['id']
        execute_update(sql, bosta_data)
        return existing_customer['id']
    else:
        # Insert new customer
        sql = """
            INSERT INTO customers (name, phone, phone_secondary, governorate, city, address_details, bosta_orders, created_by)
            VALUES (%(name)s, %(phone)s, %(phone_secondary)s, %(governorate)s, %(city)s, %(address_details)s, %(bosta_orders)s, 'bosta_sync')
        """
        return execute_insert(sql, bosta_data)
