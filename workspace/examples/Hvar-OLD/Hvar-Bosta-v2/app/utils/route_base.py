"""
Base Route Class
Provides common functionality for all route handlers to eliminate duplication
"""

import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List, Union
from datetime import datetime
from flask import Blueprint, jsonify, request, current_app
from app.utils.api_response import create_api_response
from app.utils.db_utils import get_db

logger = logging.getLogger(__name__)

class BaseRoute(ABC):
    """Base route class with common functionality"""
    
    def __init__(self, blueprint: Blueprint, route_name: str = "BaseRoute"):
        self.blueprint = blueprint
        self.route_name = route_name
        self.logger = logging.getLogger(f"{__name__}.{route_name}")
    
    def log_request(self, method: str, endpoint: str, details: Dict[str, Any] = None):
        """Log route requests consistently"""
        log_message = f"[{self.route_name}] {method} {endpoint}"
        if details:
            log_message += f" - {details}"
        self.logger.info(log_message)
    
    def log_error(self, method: str, endpoint: str, error: str, details: Dict[str, Any] = None):
        """Log route errors consistently"""
        log_message = f"[{self.route_name}] {method} {endpoint} failed - {error}"
        if details:
            log_message += f" - {details}"
        self.logger.error(log_message)
    
    def get_request_data(self) -> Dict[str, Any]:
        """Get request data consistently"""
        if request.is_json:
            return request.get_json() or {}
        elif request.form:
            return dict(request.form)
        else:
            return {}
    
    def get_query_params(self) -> Dict[str, Any]:
        """Get query parameters consistently"""
        return dict(request.args)
    
    def get_path_params(self) -> Dict[str, Any]:
        """Get path parameters consistently"""
        return dict(request.view_args or {})
    
    def validate_required_params(self, required_params: List[str], data: Dict[str, Any]) -> Optional[str]:
        """Validate that required parameters are present"""
        from app.utils.validation import validate_required_params as _validate_required_params
        return _validate_required_params(data, required_params)
    
    def validate_required_fields(self, required_fields: List[str], data: Dict[str, Any]) -> Optional[str]:
        """Validate that required fields are present in request data"""
        from app.utils.validation import validate_required_fields as _validate_required_fields
        return _validate_required_fields(data, required_fields)
    
    def parse_pagination_params(self) -> Dict[str, int]:
        """Parse pagination parameters consistently"""
        try:
            page = max(1, int(request.args.get('page', 1)))
            limit = max(1, min(100, int(request.args.get('limit', 50))))
            return {'page': page, 'limit': limit}
        except (ValueError, TypeError):
            return {'page': 1, 'limit': 50}
    
    def parse_date_range_params(self) -> Dict[str, Optional[str]]:
        """Parse date range parameters consistently"""
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        
        # Validate date format if provided
        if date_from:
            try:
                datetime.fromisoformat(date_from.replace('Z', '+00:00'))
            except ValueError:
                date_from = None
        
        if date_to:
            try:
                datetime.fromisoformat(date_to.replace('Z', '+00:00'))
            except ValueError:
                date_to = None
        
        return {'date_from': date_from, 'date_to': date_to}
    
    def create_success_response(self, data: Any = None, message: str = None, status_code: int = 200, **kwargs):
        """Create a standardized success response"""
        response = create_api_response(True, data, message=message, **kwargs)
        return jsonify(response), status_code
    
    def create_error_response(self, error: str, status_code: int = 400, details: Dict[str, Any] = None):
        """Create a standardized error response"""
        response = create_api_response(False, error=error, details=details)
        return jsonify(response), status_code
    
    def create_not_found_response(self, resource: str = "Resource"):
        """Create a standardized not found response"""
        return self.create_error_response(f"{resource} not found", 404)
    
    def create_validation_error_response(self, field: str, message: str):
        """Create a standardized validation error response"""
        return self.create_error_response(f"Validation error for {field}: {message}", 400)
    
    def handle_database_error(self, operation: str, error: Exception):
        """Handle database errors consistently"""
        self.log_error("DATABASE", operation, str(error))
        return self.create_error_response(f"Database error during {operation}", 500)
    
    def handle_validation_error(self, field: str, message: str):
        """Handle validation errors consistently"""
        self.log_error("VALIDATION", f"{field}: {message}")
        return self.create_validation_error_response(field, message)
    
    def safe_get_request_param(self, key: str, default=None, param_type=str):
        """Safely get a request parameter with type conversion"""
        value = request.args.get(key, default)
        if value is None:
            return default
        
        try:
            if param_type == int:
                return int(value)
            elif param_type == float:
                return float(value)
            elif param_type == bool:
                return value.lower() in ('true', '1', 'yes', 'on')
            else:
                return str(value)
        except (ValueError, TypeError):
            return default
    
    def build_filter_dict(self, allowed_filters: List[str]) -> Dict[str, Any]:
        """Build a filter dictionary from request parameters"""
        filters = {}
        for filter_name in allowed_filters:
            value = request.args.get(filter_name)
            if value is not None and value != '':
                filters[filter_name] = value
        return filters
    
    def validate_json_request(self) -> Union[Dict[str, Any], tuple]:
        """Validate that request contains valid JSON"""
        if not request.is_json:
            return self.create_error_response("Request must be JSON", 400)
        
        data = request.get_json()
        if data is None:
            return self.create_error_response("Invalid JSON data", 400)
        
        return data
    
    def execute_with_error_handling(self, operation: str, func, *args, **kwargs):
        """Execute a function with consistent error handling"""
        try:
            self.log_request("EXECUTE", operation)
            result = func(*args, **kwargs)
            return result
        except Exception as e:
            self.log_error("EXECUTE", operation, str(e))
            return self.create_error_response(f"Error during {operation}: {str(e)}", 500)
    
    def register_route(self, rule: str, methods: List[str] = None, **options):
        """Register a route with the blueprint"""
        if methods is None:
            methods = ['GET']
        
        def decorator(f):
            self.blueprint.route(rule, methods=methods, **options)(f)
            return f
        return decorator
    
    @abstractmethod
    def get_route_info(self) -> Dict[str, Any]:
        """Get information about the route"""
        pass
    
    def get_health_check(self) -> Dict[str, Any]:
        """Get health check information for the route"""
        try:
            info = self.get_route_info()
            return {
                'status': 'healthy',
                'route': self.route_name,
                'info': info,
                'checked_at': datetime.now().isoformat()
            }
        except Exception as e:
            return {
                'status': 'unhealthy',
                'route': self.route_name,
                'error': str(e),
                'checked_at': datetime.now().isoformat()
            } 