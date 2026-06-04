"""
app/utils/api_response.py
Utility functions for api_response
"""

from datetime import datetime
from typing import Any, Optional, Dict

"""
API Response Utility
Standardized API response formatting for consistent responses
"""


def create_api_response(
    success: bool, 
    data: Optional[Any] = None, 
    error: Optional[str] = None,
    **kwargs
) -> Dict[str, Any]:
    """
    Create consistent API responses
    
    Args:
        success: Whether the operation was successful
        data: Response data (optional)
        error: Error message (optional)
        **kwargs: Additional fields to include in response
        
    Returns:
        Formatted API response dictionary
    """
    response = {
        'success': success,
        'timestamp': datetime.now().isoformat()
    }
    
    if data is not None:
        response['data'] = data
    
    if error is not None:
        response['error'] = error
    
    # Add any additional fields
    response.update(kwargs)
    
    return response 