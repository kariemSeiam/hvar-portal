# app/utils/phone_normalizer.py
"""Phone number normalization utilities for Egyptian phone numbers."""

import re
from typing import Optional


class PhoneNormalizationError(Exception):
    """Custom exception for phone normalization errors."""
    def __init__(self, message: str, field: str = None):
        self.message = message
        self.field = field
        super().__init__(message)


def normalize_to_local_phone(phone: str) -> str:
    """
    Normalize Egyptian phone number to local format: 01XXXXXXXXX
    
    Accepts any input format:
    - +201XXXXXXXXX (international format with +)
    - 201XXXXXXXXX (international format without +)
    - 01XXXXXXXXX (local format - already correct)
    - 1XXXXXXXXX (10 digits without leading 0)
    - +20 1X XXXX XXXX (formatted with spaces)
    - 201 XXXX XXXX (formatted with spaces)
    
    Always returns: 01XXXXXXXXX (11 digits)
    
    Args:
        phone: Phone number in any format
        
    Returns:
        Normalized phone number in 01XXXXXXXXX format
        
    Raises:
        PhoneNormalizationError: If phone number is invalid or cannot be normalized
    """
    if not phone:
        raise PhoneNormalizationError("Phone number is required", "phone")
    
    # Convert to string if not already
    if not isinstance(phone, str):
        phone = str(phone)
    
    # Strip all non-digit characters (spaces, dashes, parentheses, etc.)
    # Keep only digits
    clean_phone = ''.join(filter(str.isdigit, phone))
    
    if not clean_phone:
        raise PhoneNormalizationError("Phone number must contain digits", "phone")
    
    # Normalization rules
    if clean_phone.startswith('2001') and len(clean_phone) == 13:
        # +2001XXXXXXXXX -> remove 2001, keep XXXXXXXXX (9 digits), add 01 -> 01XXXXXXXXX
        normalized = '01' + clean_phone[4:]  # Remove '2001', add '01'
    elif clean_phone.startswith('201') and len(clean_phone) == 12:
        # 201XXXXXXXXX -> remove 20, keep 1XXXXXXXXX, add leading 0 -> 01XXXXXXXXX
        normalized = '0' + clean_phone[2:]  # Remove '20', add '0'
    elif clean_phone.startswith('201') and len(clean_phone) == 13:
        # 201XXXXXXXXXXX (13 digits) -> remove 201, add 01
        normalized = '01' + clean_phone[3:]
    elif clean_phone.startswith('01') and len(clean_phone) == 11:
        # 01XXXXXXXXX -> keep as is
        normalized = clean_phone
    elif clean_phone.startswith('1') and len(clean_phone) == 10:
        # 1XXXXXXXXX -> add leading 0 -> 01XXXXXXXXX
        normalized = '0' + clean_phone
    elif len(clean_phone) == 9:
        # XXXXXXXXX (9 digits) -> assume missing leading 01 -> 01XXXXXXXXX
        normalized = '01' + clean_phone
    elif len(clean_phone) == 12 and clean_phone.startswith('20'):
        # 20XXXXXXXXXX -> remove 20, add 0
        normalized = '0' + clean_phone[2:]
    else:
        raise PhoneNormalizationError(
            f"Cannot normalize phone number: {phone} (cleaned: {clean_phone}, length: {len(clean_phone)})",
            "phone"
        )
    
    # Validate final format is 01XXXXXXXXX (11 digits, starts with 01)
    if not re.match(r'^01[0-9]{9}$', normalized):
        raise PhoneNormalizationError(
            f"Invalid normalized phone number format: {normalized}. Expected format: 01XXXXXXXXX",
            "phone"
        )
    
    return normalized


def normalize_phone_safe(phone: Optional[str]) -> Optional[str]:
    """
    Safely normalize phone number, returning None if invalid instead of raising exception.
    
    Args:
        phone: Phone number in any format
        
    Returns:
        Normalized phone number in 01XXXXXXXXX format, or None if invalid
    """
    if not phone:
        return None
    
    try:
        return normalize_to_local_phone(phone)
    except (PhoneNormalizationError, ValueError):
        return None


def normalize_ticket_phone(ticket):
    """Normalize phone numbers in ticket data in-place. Returns the ticket."""
    if ticket and ticket.get('phone'):
        normalized_phone = normalize_phone_safe(ticket['phone'])
        if normalized_phone:
            ticket['phone'] = normalized_phone
    if ticket and ticket.get('phone_secondary'):
        normalized_secondary = normalize_phone_safe(ticket['phone_secondary'])
        if normalized_secondary:
            ticket['phone_secondary'] = normalized_secondary
    return ticket
