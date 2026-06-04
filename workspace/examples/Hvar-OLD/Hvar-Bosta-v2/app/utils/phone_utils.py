"""
app/utils/phone_utils.py
Utility functions for phone_utils
"""

import re

"""
Phone number formatting and validation utilities
"""

def clean_phone(phone):
    """
    Standardize phone numbers to Egyptian format
    
    Args:
        phone: The phone number to clean
        
    Returns:
        Cleaned phone number or None if invalid
    """
    if not phone:
        return None
    
    # Remove non-digit characters
    phone = re.sub(r'[^\d]', '', phone)
    
    # Handle Egyptian country code
    if phone.startswith('20'):
        phone = phone[2:]
    
    # Add leading zero if missing
    if len(phone) == 10 and not phone.startswith('0'):
        phone = '0' + phone
    
    return phone

def normalize_phone(phone):
    """
    Normalize phone numbers to a standard format for consistent storage and comparison
    
    Args:
        phone: The phone number to normalize
        
    Returns:
        Normalized phone number or 'unknown' if invalid
    """
    if not phone:
        return 'unknown'
    
    # First clean the phone number
    cleaned = clean_phone(phone)
    
    if not cleaned:
        return 'unknown'
    
    # Ensure it's a valid Egyptian number
    if is_valid_egyptian_phone(cleaned):
        return cleaned
    
    # If not a valid Egyptian number but we have something, return the cleaned version
    if cleaned:
        return cleaned
    
    return 'unknown'

def is_valid_egyptian_phone(phone):
    """
    Validate if a phone number is a valid Egyptian mobile number
    
    Args:
        phone: The phone number to validate
        
    Returns:
        Boolean indicating if the phone number is valid
    """
    if not phone:
        return False
    
    # Clean and standardize the phone number
    clean_number = clean_phone(phone)
    
    # Egyptian mobile numbers start with 01 and are 11 digits long
    if clean_number and len(clean_number) == 11 and clean_number.startswith('01'):
        return True
    
    return False 