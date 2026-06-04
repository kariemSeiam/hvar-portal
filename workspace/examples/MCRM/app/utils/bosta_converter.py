def _safe_float(v):
    """Coerce to float; None/empty -> 0.0. Handles int, float, str."""
    if v is None or v == '':
        return 0.0
    try:
        return float(v)
    except (TypeError, ValueError):
        return 0.0


def _safe_int(v):
    """Coerce to int; None/empty -> 0. Handles int, float, str."""
    if v is None or v == '':
        return 0
    try:
        return int(float(v))
    except (TypeError, ValueError):
        return 0


def _extract_description_from_product_or_goods(data):
    """Extract description from productInfo (search) or goodsInfo (business)."""
    if not isinstance(data, dict):
        return ''
    # goodsInfo (business): dict, may have description or items
    goods = data.get('goodsInfo', {})
    if isinstance(goods, dict):
        desc = goods.get('description') or goods.get('name')
        if desc and isinstance(desc, str):
            return desc
    # productInfo (search): list of items
    products = data.get('productInfo', [])
    if isinstance(products, list) and products:
        parts = []
        for p in products[:5]:  # limit to avoid huge strings
            if isinstance(p, dict):
                part = p.get('description') or p.get('name') or p.get('productName')
                if part:
                    parts.append(str(part))
            elif isinstance(p, str):
                parts.append(p)
        if parts:
            return ' | '.join(parts)
    return ''


def _is_meaningful_package_desc(value):
    if value is None:
        return False
    t = str(value).strip()
    return len(t) > 0 and t != "-"


def _description_from_return_specs(return_specs):
    """
    Live GET /deliveries/business (Customer Return Pickup, type 25): returnSpecs is
    typically { packageType, packageDetails: { description, itemsCount } } — the
    Arabic parcel note is often in packageDetails.description (verified 84768544, 86658272).

    Some payloads may use alternate nested blocks (returnedPackageDetails, etc.) or
    leave packageDetails as '-' while text lives elsewhere — try those first, then
    packageDetails.description.
    """
    if not isinstance(return_specs, dict):
        return ""
    for block_name in (
        "returnedPackageDetails",
        "returnPackageDetails",
        "returnedPackage",
        "oldPackageDetails",
        "pickupReturnPackageDetails",
        "returnedSpecs",
        "returned_package_details",
        "return_package_details",
    ):
        block = return_specs.get(block_name)
        if not isinstance(block, dict):
            continue
        for key in ("description", "productDescription", "note", "notes", "name"):
            v = block.get(key)
            if _is_meaningful_package_desc(v):
                return str(v).strip()
    pd = return_specs.get("packageDetails")
    if isinstance(pd, dict):
        v = pd.get("description")
        if _is_meaningful_package_desc(v):
            return str(v).strip()
    return ""


def convert_bosta_order(bosta_response):
    """
    Converts any Bosta order response to unified JSON format

    Args:
        bosta_response (dict): Raw Bosta API response containing 'data' field

    Returns:
        dict: Unified order object with all keys required for service actions
    """
    import logging

    # Setup logging for key extraction (Phase 2 enhancement)
    logger = logging.getLogger(__name__)

    if not bosta_response or not isinstance(bosta_response, dict):
        error_msg = "Invalid Bosta response: None or not a dictionary"
        logger.error(f"BOSTA Converter Error: {error_msg}")
        raise ValueError(error_msg)

    if not bosta_response.get('success') or 'data' not in bosta_response:
        error_msg = "Invalid Bosta response format: missing success or data field"
        logger.error(f"BOSTA Converter Error: {error_msg}")
        raise ValueError(error_msg)

    data = bosta_response['data']
    if not isinstance(data, dict):
        error_msg = f"Invalid Bosta response: data field is not a dictionary, got {type(data)}"
        logger.error(f"BOSTA Converter Error: {error_msg}")
        raise ValueError(error_msg)

    # Log key extraction for RTL text and debugging (Phase 2 enhancement)
    logger.info(f"BOSTA Converter: Processing order with keys: {list(data.keys())}")
    tracking_number = data.get('trackingNumber', 'Unknown')
    if tracking_number and not isinstance(tracking_number, str):
        logger.warning(f"BOSTA Converter: trackingNumber is not a string, got {type(tracking_number)}: {tracking_number}")
        tracking_number = str(tracking_number)
    logger.info(f"BOSTA Converter: Extracting data for tracking number: {tracking_number}")

    # Get order type information safely (Phase 2 enhancement)
    type_info = data.get('type', {})
    if isinstance(type_info, dict):
        order_type_code = type_info.get('code', 0)
        order_type_value = type_info.get('value', 'Unknown')
        if order_type_value and not isinstance(order_type_value, str):
            logger.warning(f"BOSTA Converter: order_type_value is not a string, got {type(order_type_value)}: {order_type_value}")
            order_type_value = str(order_type_value)
    else:
        # Handle case where type is a string
        order_type_code = 0
        order_type_value = str(type_info) if type_info else 'Unknown'
        logger.warning(f"BOSTA Converter: type field is not a dict, got: {type_info}")

    # Enhanced logging for order type (Phase 2 enhancement)
    logger.info(f"BOSTA Converter: Order type code: {order_type_code}, value: {order_type_value}")

    # Determine customer address based on order type (Phase 2 enhancement)
    customer_address = None
    address_sources = {
        10: 'dropOffAddress',    # Send
        20: 'dropOffAddress',    # Return to Origin (to business)
        25: 'pickupAddress',     # Customer Return Pickup
        30: 'dropOffAddress'     # Exchange
    }

    address_source = address_sources.get(order_type_code, 'dropOffAddress')
    customer_address = data.get(address_source)

    logger.info(f"BOSTA Converter: Using address source '{address_source}' for order type code {order_type_code}")
    if customer_address:
        logger.info(f"BOSTA Converter: Found customer address with keys: {list(customer_address.keys()) if isinstance(customer_address, dict) else 'Not a dict'}")
    else:
        logger.warning(f"BOSTA Converter: No customer address found for source '{address_source}'")

    # Extract financial data: cod and total bosta fees only.
    # - wallet.cashCycle.bosta_fees is the total fee including VAT (preferred)
    # - data.shipmentFees is fallback (subtotal before VAT, we derive total)
    wallet = data.get('wallet', {})
    if not isinstance(wallet, dict):
        wallet = {}
    cash_cycle = wallet.get('cashCycle') if isinstance(wallet, dict) else None
    if not isinstance(cash_cycle, dict):
        cash_cycle = {}
    pricing = data.get('pricing', {}) or {}
    if not isinstance(pricing, dict):
        pricing = {}

    cod_amount = None
    bosta_fees = None
    bosta_fees_source = None
    # True only when wallet.cashCycle.bosta_fees is set — Bosta already returns total incl. VAT
    bosta_fees_from_cash_authoritative = False
    if isinstance(cash_cycle, dict) and cash_cycle:
        cod_amount = cash_cycle.get('cod')
        cc_bf = cash_cycle.get('bosta_fees')
        if cc_bf is not None and cc_bf != '':
            bosta_fees = cc_bf
            bosta_fees_from_cash_authoritative = True
            bosta_fees_source = 'cash_cycle'
    if cod_amount is None or cod_amount == '':
        cod_amount = data.get('cod')  # Top-level fallback (search + business)
    if bosta_fees is None or bosta_fees == '':
        bosta_fees = data.get('shipmentFees')  # Top-level fallback (business) — usually net before VAT
        if bosta_fees is not None and bosta_fees != '':
            bosta_fees_source = 'shipment_fees_plus_vat'
    if bosta_fees is None or bosta_fees == '':
        bosta_fees = pricing.get('deliveryFees') or pricing.get('shipmentFees') or pricing.get('total')
        if bosta_fees is not None and bosta_fees != '':
            bosta_fees_source = 'pricing_fallback'

    # Convert to float before comparison to avoid str vs int comparison errors
    cod_amount = _safe_float(cod_amount)
    bosta_fees_net = _safe_float(bosta_fees)
    bosta_fees_float = bosta_fees_net
    if bosta_fees_from_cash_authoritative:
        vat_amount = cash_cycle.get('vat') if isinstance(cash_cycle, dict) else None
        vat_float = _safe_float(vat_amount) if vat_amount not in (None, '') else None
        if vat_float is not None and vat_float > 0:
            bosta_fees_net = max(0.0, round(bosta_fees_float - vat_float, 2))

    # Dashboard "مستحقات بوسطة" matches gross fees. When cashCycle is null/empty, shipmentFees is net;
    # we must add VAT (or cashCycle.vat when present) — previously skipped if cashCycle was {}.
    if bosta_fees_float > 0 and not bosta_fees_from_cash_authoritative:
        vat_amount = cash_cycle.get('vat') if isinstance(cash_cycle, dict) else None
        if vat_amount is not None and vat_amount != '':
            bosta_fees_float = bosta_fees_float + _safe_float(vat_amount)
        else:
            bosta_fees_float = round(bosta_fees_float * 1.14, 2)

    bosta_fees_gross = bosta_fees_float
    bosta_fees = bosta_fees_gross

    logger.info(f"BOSTA Converter: Financial data - COD: {cod_amount}, Bosta Fees: {bosta_fees}")

    # Handle description/notes fallback (Phase 2 enhancement)
    description = None
    
    # Customer Return Pickup (25): read returned-product path first (not only packageDetails — may be new shipment / '-').
    if order_type_code == 25:
        logger.info(f"BOSTA Converter: Detected Customer Return Pickup (code 25) for tracking {tracking_number}")
        return_specs = data.get("returnSpecs", {})
        if isinstance(return_specs, dict) and return_specs:
            logger.info(f"BOSTA Converter: returnSpecs keys: {list(return_specs.keys())}")
        desc_from_return = _description_from_return_specs(return_specs)
        if desc_from_return:
            description = desc_from_return
            logger.info(f"BOSTA Converter: description from returnSpecs (returned-product path): '{description}'")
    
    # Standard flow: try notes first
    if not description:
        notes_value = data.get('notes')
        if notes_value and not isinstance(notes_value, str):
            logger.warning(f"BOSTA Converter: notes is not a string, got {type(notes_value)}: {notes_value}")
            notes_value = str(notes_value)
        description = notes_value
        logger.info(f"BOSTA Converter: Initial description from notes: '{description}'")

    # Fallback to returnSpecs if still no description
    if not description:
        return_specs = data.get('returnSpecs', {})
        if isinstance(return_specs, dict) and return_specs:
            pkg_details = return_specs.get('packageDetails', {})
            if isinstance(pkg_details, dict):
                desc_value = pkg_details.get('description', '')
                if desc_value and not isinstance(desc_value, str):
                    logger.warning(f"BOSTA Converter: description from returnSpecs is not a string, got {type(desc_value)}: {desc_value}")
                    desc_value = str(desc_value)
                description = desc_value
                logger.info(f"BOSTA Converter: Got description from returnSpecs: '{description}'")
    
    # Final fallback to specs
    if not description:
        specs = data.get('specs', {})
        if isinstance(specs, dict):
            pkg_details = specs.get('packageDetails', {})
            if isinstance(pkg_details, dict):
                desc_value = pkg_details.get('description', '')
                if desc_value and not isinstance(desc_value, str):
                    logger.warning(f"BOSTA Converter: description from specs is not a string, got {type(desc_value)}: {desc_value}")
                    desc_value = str(desc_value)
                description = desc_value
                logger.info(f"BOSTA Converter: Got description from specs: '{description}'")

    # Fallback: productInfo (search) / goodsInfo (business) — different keys per endpoint
    if not description:
        description = _extract_description_from_product_or_goods(data)

    # Package block can miss text when search payloads omit returnSpecs; merge canonical description chain.
    package = extract_package_info(data, order_type_code)
    desc_merged = str(description).strip() if description is not None else ""
    pkg_desc = str(package.get("description") or "").strip()
    if desc_merged and not pkg_desc:
        package["description"] = desc_merged

    notes_val = data.get("notes")
    if notes_val is not None and not isinstance(notes_val, str):
        notes_val = str(notes_val)

    # Build unified order object (Phase 2 enhancement)
    logger.info(f"BOSTA Converter: Building unified order object for tracking: {data.get('trackingNumber', 'Unknown')}")

    order = {
        'type': order_type_value,  # Use the already extracted value
        'trackingNumber': data.get('trackingNumber'),
        'notes': notes_val if isinstance(notes_val, str) else None,
        'status': {
            'confirmed': data.get('isConfirmedDelivery', False),
            'timeline': data.get('timeline', []) if isinstance(data.get('timeline'), list) else []
        },
        'customerAddress': extract_address_info(customer_address) if customer_address else {},
        'customer': extract_customer_info(data.get('receiver') or {}),
        'package': package,
        'financial': {
            'cod': cod_amount,
            'bostaFees': bosta_fees_gross,  # backward-compatible alias
            'bostaFeesNet': bosta_fees_net,
            'bostaFeesGross': bosta_fees_gross,
            'feesSource': bosta_fees_source
        },
        'communication': {
            'calls': _safe_int(data.get('callsNumber')),
            'sms': _safe_int(data.get('smsNumber')),
            'attempts': _safe_int(data.get('attemptsCount') or data.get('numberOfAttempts')),  # search has numberOfAttempts
            'lastCall': data.get('lastCallTime')
        },
        'timestamps': extract_timestamps(data),
        'proofImages': data.get('starProofOfReturnedPackages', []) or [],
        'ticketCount': _safe_int(data.get('ticketCount')),
        'star': extract_star_info(data.get('star', {})),
        'deliveryAttemptsLength': _safe_int(data.get('deliveryAttemptsLength') or data.get('attemptsCount') or data.get('numberOfAttempts')),  # search lacks deliveryAttemptsLength
        'returnAttemptsLength': _safe_int(data.get('returnAttemptsLength')),
        'pickupAttemptsLength': _safe_int(data.get('pickupAttemptsLength')),
        'creationTimestamp': _safe_int(data.get('creationTimestamp'))
    }

    # Log final order structure for service action validation (Phase 2 enhancement)
    required_keys_for_service_actions = [
        'trackingNumber', 'customer', 'package', 'type',
        'status', 'financial', 'customerAddress'
    ]

    logger.info(f"BOSTA Converter: Created unified order with keys: {list(order.keys())}")
    for key in required_keys_for_service_actions:
        if key in order:
            logger.info(f"BOSTA Converter: ✓ Required key '{key}' present")
        else:
            logger.warning(f"BOSTA Converter: ✗ Required key '{key}' missing from order")

    logger.info(f"BOSTA Converter: Successfully converted order {tracking_number}")
    return order

def extract_address_info(address_data):
    """Extract complete address information"""
    import logging
    logger = logging.getLogger(__name__)
    
    if not address_data or not isinstance(address_data, dict):
        logger.warning(f"BOSTA Converter: address_data is not a dict, got {type(address_data)}")
        return {
            'city': '',
            'zone': '',
            'district': '',
            'fullAddress': ''
        }
    
    # Safely extract city name
    city = ''
    city_data = address_data.get('city')
    if isinstance(city_data, dict):
        city = city_data.get('nameAr', '')
    elif city_data and not isinstance(city_data, str):
        logger.warning(f"BOSTA Converter: city is not a string or dict, got {type(city_data)}: {city_data}")
        city = str(city_data)
    
    # Safely extract zone name
    zone = ''
    zone_data = address_data.get('zone')
    if isinstance(zone_data, dict):
        zone = zone_data.get('nameAr', '')
    elif zone_data and not isinstance(zone_data, str):
        logger.warning(f"BOSTA Converter: zone is not a string or dict, got {type(zone_data)}: {zone_data}")
        zone = str(zone_data)
    
    # Safely extract district name
    district = ''
    district_data = address_data.get('district')
    if isinstance(district_data, dict):
        district = district_data.get('nameAr', '')
    elif district_data and not isinstance(district_data, str):
        logger.warning(f"BOSTA Converter: district is not a string or dict, got {type(district_data)}: {district_data}")
        district = str(district_data)
    
    # Safely extract full address
    full_address = address_data.get('firstLine', '')
    if full_address and not isinstance(full_address, str):
        logger.warning(f"BOSTA Converter: fullAddress is not a string, got {type(full_address)}: {full_address}")
        full_address = str(full_address)
    
    return {
        'city': city,
        'zone': zone,
        'district': district,
        'fullAddress': full_address
    }

def extract_customer_info(receiver_data):
    """Extract complete customer information"""
    import logging
    logger = logging.getLogger(__name__)
    
    if not isinstance(receiver_data, dict):
        logger.warning(f"BOSTA Converter: receiver_data is not a dict, got {type(receiver_data)}")
        return {
            'phone': '',
            'secondPhone': None,
            'name': ''
        }
    
    # Ensure phone is a string
    phone = receiver_data.get('phone', '')
    if phone and not isinstance(phone, str):
        logger.warning(f"BOSTA Converter: phone is not a string, got {type(phone)}: {phone}")
        phone = str(phone)
    
    # Ensure name is a string
    name = receiver_data.get('fullName', '')
    if name and not isinstance(name, str):
        logger.warning(f"BOSTA Converter: name is not a string, got {type(name)}: {name}")
        name = str(name)
    
    return {
        'phone': phone,
        'secondPhone': receiver_data.get('secondPhone'),
        'name': name
    }

def extract_star_info(star_data):
    """Extract clean star information without _id"""
    if not star_data or not isinstance(star_data, dict):
        return {}

    # Remove _id field and return clean star info
    clean_star = {k: v for k, v in star_data.items() if k != '_id'}
    return clean_star

def extract_package_info(data, order_type_code=0):
    """Extract complete package information with all possible fields"""
    import logging
    logger = logging.getLogger(__name__)
    
    if not isinstance(data, dict):
        logger.warning(f"BOSTA Converter: extract_package_info data is not a dict, got {type(data)}")
        return {
            'type': '',
            'description': '',
            'itemsCount': 0
        }
    
    specs = data.get('specs', {})
    return_specs = data.get('returnSpecs', {})

    # Get items count with fallback
    items_count = 0
    
    # For Customer Return Pickup (code 25), prioritize returnSpecs.packageDetails
    if order_type_code == 25 and isinstance(return_specs, dict) and return_specs.get('packageDetails'):
        pkg_details = return_specs.get('packageDetails', {})
        if isinstance(pkg_details, dict):
            items_count = pkg_details.get('itemsCount', 0)
    
    # Fallback to specs if not found
    if not items_count and isinstance(specs, dict) and specs.get('packageDetails'):
        pkg_details = specs.get('packageDetails', {})
        if isinstance(pkg_details, dict):
            items_count = pkg_details.get('itemsCount', 0)

    # Fallback: goodsInfo (business) / productInfo (search) for itemsCount
    if not items_count:
        goods = data.get('goodsInfo', {})
        if isinstance(goods, dict):
            items_count = _safe_int(goods.get('itemsCount') or goods.get('count'))
        if not items_count:
            products = data.get('productInfo', [])
            if isinstance(products, list):
                items_count = len(products)

    # Get description with fallback chain
    description = ''

    if order_type_code == 25:
        logger.info(f"BOSTA Converter [extract_package_info]: Customer Return Pickup (25), returnSpecs keys: {list(return_specs.keys()) if isinstance(return_specs, dict) else []}")
        description = _description_from_return_specs(return_specs)

    # Standard flow: Try specs description first
    if not description and isinstance(specs, dict) and specs.get('packageDetails'):
        pkg_details = specs.get('packageDetails', {})
        if isinstance(pkg_details, dict):
            desc_value = pkg_details.get('description', '')
            if desc_value and not isinstance(desc_value, str):
                logger.warning(f"BOSTA Converter: description is not a string, got {type(desc_value)}: {desc_value}")
                desc_value = str(desc_value)
            description = desc_value

    # Fallback to returnSpecs description
    if not description and isinstance(return_specs, dict) and return_specs.get('packageDetails'):
        pkg_details = return_specs.get('packageDetails', {})
        if isinstance(pkg_details, dict):
            desc_value = pkg_details.get('description', '')
            if desc_value and not isinstance(desc_value, str):
                logger.warning(f"BOSTA Converter: description is not a string, got {type(desc_value)}: {desc_value}")
                desc_value = str(desc_value)
            description = desc_value

    # Final fallback to notes
    if not description:
        notes_value = data.get('notes', '')
        if notes_value and not isinstance(notes_value, str):
            logger.warning(f"BOSTA Converter: notes is not a string, got {type(notes_value)}: {notes_value}")
            notes_value = str(notes_value)
        description = notes_value

    # Fallback: productInfo (search) / goodsInfo (business)
    if not description:
        description = _extract_description_from_product_or_goods(data)

    # Get package type - prioritize returnSpecs for Customer Return Pickup
    package_type = ''
    if order_type_code == 25 and isinstance(return_specs, dict):
        type_value = return_specs.get('packageType', '')
        if type_value and not isinstance(type_value, str):
            logger.warning(f"BOSTA Converter: packageType from returnSpecs is not a string, got {type(type_value)}: {type_value}")
            type_value = str(type_value)
        package_type = type_value
    
    # Fallback to specs
    if not package_type and isinstance(specs, dict):
        type_value = specs.get('packageType', '')
        if type_value and not isinstance(type_value, str):
            logger.warning(f"BOSTA Converter: packageType is not a string, got {type(type_value)}: {type_value}")
            type_value = str(type_value)
        package_type = type_value

    if description and str(description).strip() == "-":
        description = ""

    # Return complete package structure (always include all fields)
    return {
        'type': package_type,
        'description': description,
        'itemsCount': items_count
    }


def extract_timestamps(data):
    """Extract all possible timestamps with defaults"""
    import logging
    logger = logging.getLogger(__name__)
    
    if not isinstance(data, dict):
        logger.warning(f"BOSTA Converter: extract_timestamps data is not a dict, got {type(data)}")
        return {
            'created': '',
            'updated': '',
            'collected': '',
            'collectedFromConsignee': '',
            'scheduled': ''
        }
    
    def safe_get_timestamp(key):
        value = data.get(key) or ''
        if value and not isinstance(value, str):
            logger.warning(f"BOSTA Converter: timestamp {key} is not a string, got {type(value)}: {value}")
            value = str(value)
        return value
    
    return {
        'created': safe_get_timestamp('createdAt'),
        'updated': safe_get_timestamp('updatedAt'),
        'collected': safe_get_timestamp('collectedFromBusiness'),
        'collectedFromConsignee': safe_get_timestamp('collectedFromConsignee'),
        'scheduled': safe_get_timestamp('scheduledAt'),
        'confirmedDelivery': safe_get_timestamp('confirmedDeliveryAt')  # search has this
    }

def convert_bosta_orders(bosta_responses):
    """
    Converts multiple Bosta order responses to unified format

    Args:
        bosta_responses (list): List of Bosta API responses

    Returns:
        dict: Unified response with orders array
    """
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info(f"BOSTA Converter: Processing {len(bosta_responses)} responses")
    logger.info(f"BOSTA Converter: Response types: {[type(r) for r in bosta_responses]}")
    
    orders = []

    for i, response in enumerate(bosta_responses):
        try:
            logger.info(f"BOSTA Converter: Processing response {i+1}: {type(response)}")
            if isinstance(response, dict):
                logger.info(f"BOSTA Converter: Response {i+1} keys: {list(response.keys())}")
            order = convert_bosta_order(response)
            orders.append(order)
        except Exception as e:
            logger.error(f"Error converting order {i+1}: {e}")
            logger.error(f"  Response type: {type(response)}")
            if response:
                logger.error(f"  Response keys: {list(response.keys()) if isinstance(response, dict) else 'Not a dict'}")
            continue

    return {
        'orders': orders,
        'totalOrders': len(orders),
        'types': list(set(order['type'] for order in orders)),
        'processedAt': "2025-10-12T00:00:00.000Z"
    }