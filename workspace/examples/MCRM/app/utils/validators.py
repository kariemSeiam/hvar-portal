# app/utils/validators.py
"""Input validation utilities."""

import re
from typing import Dict, List, Any, Optional
from app.utils.phone_normalizer import normalize_to_local_phone, normalize_phone_safe


def validate_phone_number(phone: str) -> bool:
    """
    Validate Egyptian phone number format.
    Accepts any format (+201, 201, 01, etc.) and normalizes before validation.
    """
    if not phone:
        return False
    
    # Try to normalize the phone number first
    # This handles +201, 201, 01, 1XXXXXXXXX formats
    normalized = normalize_phone_safe(phone)
    if not normalized:
        return False
    
    # Now validate the normalized format against Egyptian phone patterns
    patterns = [
        r'^01[0-9]{9}$',  # Mobile: 01xxxxxxxxx
        r'^02[0-9]{8}$',  # Cairo landline: 02xxxxxxxx
        r'^03[0-9]{8}$',  # Alexandria landline: 03xxxxxxxx
        r'^040[0-9]{7}$', # Other governorates: 040xxxxxxx
        r'^045[0-9]{7}$', # Other governorates: 045xxxxxxx
        r'^047[0-9]{7}$', # Other governorates: 047xxxxxxx
        r'^055[0-9]{7}$', # Other governorates: 055xxxxxxx
        r'^057[0-9]{7}$', # Other governorates: 057xxxxxxx
        r'^062[0-9]{7}$', # Other governorates: 062xxxxxxx
        r'^064[0-9]{7}$', # Other governorates: 064xxxxxxx
        r'^065[0-9]{7}$', # Other governorates: 065xxxxxxx
        r'^068[0-9]{7}$', # Other governorates: 068xxxxxxx
        r'^069[0-9]{7}$', # Other governorates: 069xxxxxxx
        r'^082[0-9]{7}$', # Other governorates: 082xxxxxxx
        r'^084[0-9]{7}$', # Other governorates: 084xxxxxxx
        r'^086[0-9]{7}$', # Other governorates: 086xxxxxxx
        r'^088[0-9]{7}$', # Other governorates: 088xxxxxxx
        r'^092[0-9]{7}$', # Other governorates: 092xxxxxxx
        r'^093[0-9]{7}$', # Other governorates: 093xxxxxxx
        r'^095[0-9]{7}$', # Other governorates: 095xxxxxxx
        r'^097[0-9]{7}$', # Other governorates: 097xxxxxxx
    ]
    
    for pattern in patterns:
        if re.match(pattern, normalized):
            return True
    
    return False


def validate_tracking_number(tracking: str) -> bool:
    """Validate tracking number format."""
    if not tracking:
        return False
    
    # Common tracking number patterns
    patterns = [
        r'^[A-Z]{3}-[A-Z]{3}-\d{8}$',  # BOS-RCV-12345678
        r'^[A-Z]{3}-\d{6,10}$',        # BOS123456
        r'^[A-Z]{2,4}\d{6,12}$',       # BOS123456789
        r'^[A-Z0-9]{8,20}$',           # Alphanumeric 8-20 chars
    ]
    
    for pattern in patterns:
        if re.match(pattern, tracking):
            return True
    
    return False


def validate_sku(sku: str) -> bool:
    """Validate SKU format."""
    if not sku:
        return False
    
    # SKU patterns: HVR-MTR-05, PROD-001, PART-001
    pattern = r'^[A-Z]{2,4}-[A-Z]{2,4}-\d{2,4}$'
    return bool(re.match(pattern, sku))


def validate_required_fields(data: Dict[str, Any], required_fields: List[str]) -> Dict[str, List[str]]:
    """Validate that all required fields are present and not empty."""
    errors = {}
    
    for field in required_fields:
        if field not in data or data[field] is None or data[field] == '':
            if 'required' not in errors:
                errors['required'] = []
            errors['required'].append(f"{field} is required")
    
    return errors


def validate_enum_value(value: Any, allowed_values: List[str], field_name: str) -> Optional[str]:
    """Validate that a value is one of the allowed enum values."""
    if value not in allowed_values:
        return f"{field_name} must be one of: {', '.join(allowed_values)}"
    return None


def validate_positive_integer(value: Any, field_name: str) -> Optional[str]:
    """Validate that a value is a positive integer."""
    if not isinstance(value, int) or value <= 0:
        return f"{field_name} must be a positive integer"
    return None


def validate_non_negative_integer(value: Any, field_name: str) -> Optional[str]:
    """Validate that a value is a non-negative integer."""
    if not isinstance(value, int) or value < 0:
        return f"{field_name} must be a non-negative integer"
    return None


def validate_string_length(value: str, min_length: int = 0, max_length: int = None, field_name: str = "Field") -> Optional[str]:
    """Validate string length."""
    if not isinstance(value, str):
        return f"{field_name} must be a string"
    
    if len(value) < min_length:
        return f"{field_name} must be at least {min_length} characters long"
    
    if max_length and len(value) > max_length:
        return f"{field_name} must be no more than {max_length} characters long"
    
    return None


def validate_email(email: str) -> bool:
    """Validate email format."""
    if not email:
        return False
    
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def validate_ticket_status_transition(current_status: str, new_status: str) -> Optional[str]:
    """Validate service ticket status transitions."""
    valid_transitions = {
        'PENDING': ['CONFIRMED', 'CANCELLED'],
        'CONFIRMED': ['IN_PROCESS', 'CANCELLED'],
        'IN_PROCESS': ['READY_FOR_DISPATCH', 'COMPLETED', 'CANCELLED'],
        'READY_FOR_DISPATCH': ['SENT', 'CANCELLED'],
        'SENT': ['DELIVERED', 'RETURNED'],
        'DELIVERED': ['COMPLETED'],
        'RETURNED': ['IN_PROCESS', 'CANCELLED'],
        'COMPLETED': [],  # Terminal state
        'CANCELLED': [],  # Terminal state
    }
    
    if current_status not in valid_transitions:
        return f"Invalid current status: {current_status}"
    
    if new_status not in valid_transitions[current_status]:
        return f"Cannot transition from {current_status} to {new_status}"
    
    return None


def validate_service_type(service_type: str) -> Optional[str]:
    """Validate service type."""
    allowed_types = ['replacement', 'maintenance', 'return', 'sell']
    return validate_enum_value(service_type, allowed_types, 'service_type')


def validate_stock_item_type(item_type: str) -> Optional[str]:
    """Validate stock item type."""
    allowed_types = ['product', 'part']
    return validate_enum_value(item_type, allowed_types, 'item_type')


def validate_movement_type(movement_type: str) -> Optional[str]:
    """Validate stock movement type."""
    allowed_types = ['reserve', 'commit', 'cancel', 'adjust', 'receive', 'return', 'assemble', 'disassemble']
    return validate_enum_value(movement_type, allowed_types, 'movement_type')


def validate_scan_type(scan_type: str) -> Optional[str]:
    """Validate tracking scan type."""
    allowed_types = ['received', 'dispatched', 'in_transit', 'delivered', 'returned']
    return validate_enum_value(scan_type, allowed_types, 'scan_type')


def validate_condition(condition: str) -> Optional[str]:
    """Validate part condition."""
    allowed_conditions = ['valid', 'damaged']
    return validate_enum_value(condition, allowed_conditions, 'condition')


def is_phone_number(query: str) -> bool:
    """
    Check if a query string looks like an Egyptian phone number.
    Accepts any format (+201, 201, 01, etc.) and normalizes before checking.
    """
    if not query:
        return False
    
    # Try to normalize - if it succeeds, it's a valid phone number format
    normalized = normalize_phone_safe(query)
    if normalized:
        return True
    
    # Fallback: check if it looks like a phone number pattern
    # Regex for Egyptian phone numbers (e.g., 01xxxxxxxxx, +201xxxxxxxxx, 201xxxxxxxxx)
    clean_query = ''.join(filter(str.isdigit, query))
    return bool(re.match(r'^(\+?2)?01[0-2,5]{1}[0-9]{8}$', clean_query))


def is_tracking_number(query: str) -> bool:
    """Check if a query string could be a tracking number."""
    # Basic check: typically a mix of letters and numbers, or just a long number
    # This can be refined if Bosta has a specific format.
    return query and (query.isalnum() and not is_phone_number(query))