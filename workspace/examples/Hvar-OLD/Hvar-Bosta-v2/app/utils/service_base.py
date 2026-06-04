"""
Base Service Class
Provides common functionality for all service classes to eliminate duplication
"""

import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List, Union
from datetime import datetime
from app.utils.db_utils import get_db, execute_query, execute_single_query, execute_update
from app.utils.api_response import create_api_response

logger = logging.getLogger(__name__)

class BaseService(ABC):
    """Base service class with common functionality"""
    
    def __init__(self, service_name: str = "BaseService"):
        self.service_name = service_name
        self.logger = logging.getLogger(f"{__name__}.{service_name}")
    
    def log_operation(self, operation: str, details: Dict[str, Any] = None):
        """Log service operations consistently"""
        log_message = f"[{self.service_name}] {operation}"
        if details:
            log_message += f" - {details}"
        self.logger.info(log_message)
    
    def log_error(self, operation: str, error: str, details: Dict[str, Any] = None):
        """Log service errors consistently"""
        log_message = f"[{self.service_name}] {operation} failed - {error}"
        if details:
            log_message += f" - {details}"
        self.logger.error(log_message)
    
    def create_success_response(self, data: Any = None, message: str = None, **kwargs) -> Dict[str, Any]:
        """Create a standardized success response via central api_response"""
        return create_api_response(True, data, message=message, service=self.service_name, **kwargs)
    
    def create_error_response(self, error: str, details: Dict[str, Any] = None) -> Dict[str, Any]:
        """Create a standardized error response via central api_response"""
        extra = {'service': self.service_name}
        if details:
            extra['details'] = details
        return create_api_response(False, error=error, **extra)
    
    def validate_required_fields(self, data: Dict[str, Any], required_fields: List[str]) -> Optional[str]:
        """Validate that required fields are present in data"""
        from app.utils.validation import validate_required_fields as _validate_required_fields
        return _validate_required_fields(data, required_fields)
    
    def safe_get(self, data: Dict[str, Any], key: str, default=None):
        """Safely get a value from a dictionary"""
        return data.get(key, default)
    
    def safe_get_nested(self, data: Dict[str, Any], keys: List[str], default=None):
        """Safely get a nested value from a dictionary"""
        current = data
        for key in keys:
            if isinstance(current, dict) and key in current:
                current = current[key]
            else:
                return default
        return current
    
    def format_datetime(self, dt: datetime) -> str:
        """Format datetime consistently"""
        return dt.isoformat() if dt else None
    
    def parse_datetime(self, dt_str: str) -> Optional[datetime]:
        """Parse datetime string consistently"""
        if not dt_str:
            return None
        try:
            return datetime.fromisoformat(dt_str.replace('Z', '+00:00'))
        except ValueError:
            try:
                return datetime.strptime(dt_str, '%Y-%m-%d %H:%M:%S')
            except ValueError:
                return None
    
    def execute_with_retry(self, operation: str, func, *args, max_retries: int = 3, **kwargs):
        """Execute a function with retry logic"""
        for attempt in range(max_retries):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                if attempt == max_retries - 1:
                    self.log_error(operation, str(e))
                    raise
                else:
                    self.logger.warning(f"Attempt {attempt + 1} failed for {operation}: {e}")
                    import time
                    time.sleep(0.1 * (attempt + 1))  # Exponential backoff
    
    def execute_with_error_handling(self, operation: str, func, *args, **kwargs):
        """Execute a function with consistent error handling"""
        try:
            self.log_operation(operation)
            result = func(*args, **kwargs)
            return result
        except Exception as e:
            self.log_error(operation, str(e))
            return self.create_error_response(f"Error during {operation}: {str(e)}")
    
    def validate_data_types(self, data: Dict[str, Any], type_specs: Dict[str, type]) -> Optional[str]:
        """Validate data types against specifications"""
        for field, expected_type in type_specs.items():
            if field in data:
                value = data[field]
                if not isinstance(value, expected_type):
                    return f"Field '{field}' must be of type {expected_type.__name__}, got {type(value).__name__}"
        return None
    
    def sanitize_string(self, value: str, max_length: int = 255) -> str:
        """Sanitize string values"""
        if not value:
            return ""
        return str(value).strip()[:max_length]
    
    def validate_email(self, email: str) -> bool:
        """Validate email format"""
        import re
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email))
    
    def validate_phone(self, phone: str) -> bool:
        """Validate phone number via centralized phone utils"""
        from app.utils.phone_utils import is_valid_egyptian_phone
        return is_valid_egyptian_phone(phone)
    
    def generate_unique_id(self, prefix: str = "") -> str:
        """Generate a unique identifier"""
        import uuid
        unique_id = str(uuid.uuid4()).replace('-', '')[:12]
        return f"{prefix}{unique_id}" if prefix else unique_id
    
    def calculate_pagination(self, total_count: int, page: int = 1, limit: int = 50) -> Dict[str, Any]:
        """Calculate pagination information"""
        total_pages = (total_count + limit - 1) // limit
        offset = (page - 1) * limit
        
        return {
            'page': page,
            'limit': limit,
            'total_count': total_count,
            'total_pages': total_pages,
            'offset': offset,
            'has_next': page < total_pages,
            'has_prev': page > 1
        }
    
    def build_search_query(self, base_query: str, search_fields: List[str], search_term: str) -> tuple:
        """Build a search query with LIKE conditions"""
        if not search_term:
            return base_query, ()
        
        search_conditions = []
        params = []
        
        for field in search_fields:
            search_conditions.append(f"{field} LIKE ?")
            params.append(f"%{search_term}%")
        
        if search_conditions:
            base_query += " WHERE " + " OR ".join(search_conditions)
        
        return base_query, tuple(params)
    
    def build_sort_query(self, base_query: str, sort_field: str, sort_order: str = "ASC") -> str:
        """Build a sort query"""
        if not sort_field:
            return base_query
        
        sort_order = sort_order.upper()
        if sort_order not in ["ASC", "DESC"]:
            sort_order = "ASC"
        
        base_query += f" ORDER BY {sort_field} {sort_order}"
        return base_query
    
    def filter_data(self, data: List[Dict[str, Any]], filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Filter data based on criteria"""
        if not filters:
            return data
        
        filtered_data = []
        for item in data:
            matches = True
            for key, value in filters.items():
                if key in item:
                    if isinstance(value, str) and value.lower() not in str(item[key]).lower():
                        matches = False
                        break
                    elif item[key] != value:
                        matches = False
                        break
                else:
                    matches = False
                    break
            
            if matches:
                filtered_data.append(item)
        
        return filtered_data
    
    def transform_data(self, data: List[Dict[str, Any]], transformations: Dict[str, str]) -> List[Dict[str, Any]]:
        """Transform data using field mappings"""
        transformed_data = []
        for item in data:
            transformed_item = {}
            for new_key, old_key in transformations.items():
                if old_key in item:
                    transformed_item[new_key] = item[old_key]
            transformed_data.append(transformed_item)
        return transformed_data
    
    @abstractmethod
    def get_service_info(self) -> Dict[str, Any]:
        """Get information about the service"""
        pass
    
    def get_health_check(self) -> Dict[str, Any]:
        """Get health check information for the service"""
        try:
            info = self.get_service_info()
            return {
                'status': 'healthy',
                'service': self.service_name,
                'info': info,
                'checked_at': datetime.now().isoformat()
            }
        except Exception as e:
            return {
                'status': 'unhealthy',
                'service': self.service_name,
                'error': str(e),
                'checked_at': datetime.now().isoformat()
            } 