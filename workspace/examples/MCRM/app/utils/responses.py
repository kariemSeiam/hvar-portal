# app/utils/responses.py
"""Standardized response helpers."""

from flask import jsonify
from typing import Any, Dict, List, Optional


def success_response(data: Any = None, message: str = None, status: int = 200) -> tuple:
    """Create a standardized success response."""
    response = {"success": True}
    
    if message:
        response["message"] = message
    
    if data is not None:
        response["data"] = data
    
    return jsonify(response), status


def error_response(message: str, status: int = 400, errors: Dict[str, List[str]] = None) -> tuple:
    """Create a standardized error response."""
    response = {
        "success": False,
        "message": message
    }
    
    if errors:
        response["errors"] = errors
    
    return jsonify(response), status


def validation_error_response(errors: Dict[str, List[str]], message: str = "Validation failed") -> tuple:
    """Create a standardized validation error response."""
    return error_response(message, 400, errors)


def not_found_response(resource_type: str, resource_id: str = None) -> tuple:
    """Create a standardized not found response."""
    message = f"{resource_type} not found"
    if resource_id:
        message += f" with ID: {resource_id}"
    return error_response(message, 404)


def unauthorized_response(message: str = "Unauthorized") -> tuple:
    """Create a standardized unauthorized response."""
    return error_response(message, 401)


def forbidden_response(message: str = "Forbidden") -> tuple:
    """Create a standardized forbidden response."""
    return error_response(message, 403)


def conflict_response(message: str = "Conflict") -> tuple:
    """Create a standardized conflict response."""
    return error_response(message, 409)


def internal_error_response(message: str = "Internal server error") -> tuple:
    """Create a standardized internal server error response."""
    return error_response(message, 500)


def paginated_response(data: List[Any], page: int, per_page: int, total: int, 
                     message: str = None) -> tuple:
    """Create a standardized paginated response."""
    response = {
        "success": True,
        "data": data,
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "pages": (total + per_page - 1) // per_page
        }
    }
    
    if message:
        response["message"] = message
    
    return jsonify(response), 200


def created_response(data: Any = None, message: str = "Created successfully") -> tuple:
    """Create a standardized created response."""
    return success_response(data, message, 201)


def updated_response(data: Any = None, message: str = "Updated successfully") -> tuple:
    """Create a standardized updated response."""
    return success_response(data, message, 200)


def deleted_response(message: str = "Deleted successfully") -> tuple:
    """Create a standardized deleted response."""
    return success_response(None, message, 200)


def no_content_response() -> tuple:
    """Create a standardized no content response."""
    return "", 204


def bad_request_response(message: str = "Bad request") -> tuple:
    """Create a standardized bad request response."""
    return error_response(message, 400)


def method_not_allowed_response(message: str = "Method not allowed") -> tuple:
    """Create a standardized method not allowed response."""
    return error_response(message, 405)


def unsupported_media_type_response(message: str = "Unsupported media type") -> tuple:
    """Create a standardized unsupported media type response."""
    return error_response(message, 415)


def too_many_requests_response(message: str = "Too many requests") -> tuple:
    """Create a standardized too many requests response."""
    return error_response(message, 429)


def service_unavailable_response(message: str = "Service unavailable") -> tuple:
    """Create a standardized service unavailable response."""
    return error_response(message, 503)


def gateway_timeout_response(message: str = "Gateway timeout") -> tuple:
    """Create a standardized gateway timeout response."""
    return error_response(message, 504)
