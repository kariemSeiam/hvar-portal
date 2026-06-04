"""
Comprehensive API Documentation Generator
Dynamic documentation system that analyzes all routes and generates detailed API documentation
"""

import inspect
import re
import ast
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
import logging
from flask import current_app
from app.utils.db_utils import get_db

logger = logging.getLogger(__name__)

class APIDocumentationGenerator:
    """Dynamic API documentation generator that analyzes route functions"""
    
    def __init__(self):
        self.endpoint_patterns = {}
        self.parameter_patterns = {}
        self.response_patterns = {}
        self._load_patterns()
    
    def _load_patterns(self):
        """Load regex patterns for parsing route functions"""
        self.endpoint_patterns = {
            'query_params': r'request\.args\.get\([\'"]([^\'"]+)[\'"](?:,\s*([^)]+))?\)',
            'path_params': r'<([^:>]+)(?::([^>]+))?>',
            'json_data': r'request\.get_json\(\)',
            'required_fields': r'required_fields\s*=\s*\[([^\]]+)\]',
            'validation': r'if\s+not\s+([^:]+):\s*return.*error.*[\'"]([^\'"]+)[\'"]',
            'response_format': r'create_api_response\s*\(\s*([^,]+),\s*([^)]+)\)',
            'database_query': r'with\s+get_db\(\)\s+as\s+conn:',
            'pagination': r'page\s*=\s*int\(request\.args\.get\([\'"]([^\'"]+)[\'"](?:,\s*(\d+))?\)\)',
            'limit': r'limit\s*=\s*(?:min\()?int\(request\.args\.get\([\'"]([^\'"]+)[\'"](?:,\s*(\d+))?\)\)',
            'filters': r'filters\s*=\s*\{\}',
            'error_handling': r'except\s+Exception\s+as\s+e:',
            'logging': r'logger\.(error|info|warning|debug)\s*\(\s*[\'"]([^\'"]+)[\'"]',
        }
        
        self.parameter_patterns = {
            'query_params': r'request\.args\.get\([\'"]([^\'"]+)[\'"](?:,\s*([^)]+))?\)',
            'path_params': r'def\s+\w+\([^)]*<([^:>]+)(?::([^>]+))?>[^)]*\):',
            'json_fields': r'data\.get\([\'"]([^\'"]+)[\'"]',
            'required_validation': r'if\s+not\s+data\.get\([\'"]([^\'"]+)[\'"]\):',
        }
        
        self.response_patterns = {
            'success_response': r'create_api_response\s*\(\s*True,\s*([^)]+)\)',
            'error_response': r'create_api_response\s*\(\s*False,\s*error=([^)]+)\)',
            'json_response': r'jsonify\s*\(\s*([^)]+)\)',
            'status_codes': r'(\d{3})\s*if\s+([^:]+)\s+else\s+(\d{3})',
        }
    
    def generate_comprehensive_api_docs(self) -> Dict[str, Any]:
        """Generate comprehensive API documentation"""
        try:
            # Get all registered blueprints
            blueprints = self._get_all_blueprints()
            
            # Analyze each blueprint
            api_docs = {
                'title': 'HVAR Bosta Integration API v2.0.0',
                'description': 'Comprehensive order management and customer service system with dynamic documentation',
                'version': '2.0.0',
                'timestamp': datetime.now().isoformat(),
                'total_endpoints': 0,
                'total_blueprints': len(blueprints),
                'generation_method': 'Dynamic analysis of route functions',
                'blueprints': {},
                'system_endpoints': self._get_system_endpoints(),
                'database_status': self._get_database_status(),
                'api_statistics': self._generate_api_statistics(blueprints),
                'usage_examples': self._generate_usage_examples(),
                'error_codes': self._get_error_codes(),
                'authentication': self._get_authentication_info(),
                'rate_limiting': self._get_rate_limiting_info(),
                'data_formats': self._get_data_formats(),
            }
            
            # Process each blueprint
            for blueprint_name, blueprint in blueprints.items():
                blueprint_docs = self._analyze_blueprint(blueprint_name, blueprint)
                api_docs['blueprints'][blueprint_name] = blueprint_docs
                api_docs['total_endpoints'] += blueprint_docs['total_endpoints']
            
            return api_docs
            
        except Exception as e:
            logger.error(f"Error generating API docs: {e}")
            return self._get_fallback_docs()
    
    def _get_all_blueprints(self) -> Dict[str, Any]:
        """Get all registered blueprints from the Flask app"""
        blueprints = {}
        
        # Core system blueprints
        try:
            from app.routes import customers, products, maintenance, customer_service, unified_customer_service
            from app.api import orders
            from app.routes import service_actions
            
            blueprints.update({
                'customers': customers.bp,
                'products': products.bp,
                'maintenance': maintenance.bp,
                'customer_service': customer_service.bp,
                'unified_customer_service': unified_customer_service.bp,
                'orders': orders.bp,
                'service_actions': service_actions.bp,
            })
        except ImportError as e:
            logger.warning(f"Could not import some blueprints: {e}")
        
        return blueprints
    
    def _analyze_blueprint(self, blueprint_name: str, blueprint) -> Dict[str, Any]:
        """Analyze a single blueprint and extract all endpoint information"""
        try:
            blueprint_docs = {
                'name': blueprint_name,
                'url_prefix': blueprint.url_prefix,
                'description': self._get_blueprint_description(blueprint_name),
                'total_endpoints': 0,
                'endpoints': {},
                'categories': self._categorize_endpoints(blueprint),
                'statistics': {},
            }
            
            # Get all routes from the blueprint
            routes = self._get_blueprint_routes(blueprint)
            
            for route in routes:
                endpoint_docs = self._analyze_endpoint(route)
                if endpoint_docs:
                    blueprint_docs['endpoints'][endpoint_docs['path']] = endpoint_docs
                    blueprint_docs['total_endpoints'] += 1
            
            # Generate statistics
            blueprint_docs['statistics'] = self._generate_blueprint_statistics(blueprint_docs['endpoints'])
            
            return blueprint_docs
            
        except Exception as e:
            logger.error(f"Error analyzing blueprint {blueprint_name}: {e}")
            return {
                'name': blueprint_name,
                'error': str(e),
                'total_endpoints': 0,
                'endpoints': {}
            }
    
    def _get_blueprint_routes(self, blueprint) -> List[Dict[str, Any]]:
        """Extract all routes from a blueprint"""
        routes = []
        
        try:
            # Get the blueprint's view functions
            for endpoint, view_func in blueprint.view_functions.items():
                if hasattr(view_func, 'methods'):
                    methods = view_func.methods
                else:
                    methods = ['GET']  # Default method
                
                # Get the route rule
                for rule in blueprint.url_map.iter_rules():
                    if rule.endpoint == endpoint:
                        routes.append({
                            'endpoint': endpoint,
                            'rule': rule,
                            'view_func': view_func,
                            'methods': methods,
                            'path': rule.rule,
                            'function_name': view_func.__name__,
                            'function_source': self._get_function_source(view_func),
                        })
                        break
        except Exception as e:
            logger.error(f"Error extracting routes from blueprint: {e}")
        
        return routes
    
    def _get_function_source(self, func) -> str:
        """Get the source code of a function"""
        try:
            return inspect.getsource(func)
        except:
            return ""
    
    def _analyze_endpoint(self, route: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Analyze a single endpoint and extract comprehensive information"""
        try:
            func = route['view_func']
            source = route['function_source']
            
            endpoint_docs = {
                'path': route['path'],
                'methods': list(route['methods']),
                'function_name': route['function_name'],
                'description': self._extract_description(func, source),
                'parameters': self._extract_parameters(route['path'], source),
                'request_body': self._extract_request_body(source),
                'response_format': self._extract_response_format(source),
                'error_handling': self._extract_error_handling(source),
                'database_operations': self._extract_database_operations(source),
                'validation_rules': self._extract_validation_rules(source),
                'pagination': self._extract_pagination_info(source),
                'filters': self._extract_filters(source),
                'examples': self._generate_endpoint_examples(route),
                'complexity': self._calculate_endpoint_complexity(source),
                'security': self._extract_security_info(source),
                'dependencies': self._extract_dependencies(source),
                'business_logic': self._extract_business_logic(source),
                'performance_notes': self._extract_performance_notes(source),
            }
            
            return endpoint_docs
            
        except Exception as e:
            logger.error(f"Error analyzing endpoint {route.get('path', 'unknown')}: {e}")
            return None
    
    def _extract_description(self, func, source: str) -> str:
        """Extract description from function docstring"""
        try:
            if func.__doc__:
                # Clean up docstring
                doc = func.__doc__.strip()
                # Get first paragraph
                lines = doc.split('\n')
                description = lines[0].strip()
                return description
            else:
                # Try to extract from comments
                lines = source.split('\n')
                for line in lines:
                    if '"""' in line or "'''" in line:
                        return line.strip().strip('"\'')
                return "No description available"
        except:
            return "No description available"
    
    def _extract_parameters(self, path: str, source: str) -> Dict[str, Any]:
        """Extract all parameters from endpoint"""
        parameters = {
            'path_parameters': self._extract_path_parameters(path),
            'query_parameters': self._extract_query_parameters(source),
            'body_parameters': self._extract_body_parameters(source),
        }
        return parameters
    
    def _extract_path_parameters(self, path: str) -> List[Dict[str, Any]]:
        """Extract path parameters from URL"""
        path_params = []
        pattern = r'<([^:>]+)(?::([^>]+))?>'
        matches = re.findall(pattern, path)
        
        for param_name, param_type in matches:
            path_params.append({
                'name': param_name,
                'type': param_type or 'string',
                'required': True,
                'description': f'Path parameter: {param_name}',
                'example': self._get_parameter_example(param_name, param_type)
            })
        
        return path_params
    
    def _extract_query_parameters(self, source: str) -> List[Dict[str, Any]]:
        """Extract query parameters from source code"""
        query_params = []
        pattern = r'request\.args\.get\([\'"]([^\'"]+)[\'"](?:,\s*([^)]+))?\)'
        matches = re.findall(pattern, source)
        
        for param_name, default_value in matches:
            # Clean up default value
            if default_value:
                default_value = default_value.strip().strip('"\'')
            
            query_params.append({
                'name': param_name,
                'type': self._infer_parameter_type(default_value),
                'required': False,
                'default': default_value,
                'description': f'Query parameter: {param_name}',
                'example': self._get_parameter_example(param_name, default_value)
            })
        
        return query_params
    
    def _extract_body_parameters(self, source: str) -> List[Dict[str, Any]]:
        """Extract request body parameters"""
        body_params = []
        
        # Look for JSON data extraction
        pattern = r'data\.get\([\'"]([^\'"]+)[\'"]'
        matches = re.findall(pattern, source)
        
        for param_name in matches:
            body_params.append({
                'name': param_name,
                'type': 'string',  # Default type
                'required': self._is_parameter_required(source, param_name),
                'description': f'Request body field: {param_name}',
                'example': self._get_parameter_example(param_name, 'string')
            })
        
        return body_params
    
    def _extract_request_body(self, source: str) -> Dict[str, Any]:
        """Extract request body structure"""
        has_json = 'request.get_json()' in source
        has_form_data = 'request.form' in source
        has_files = 'request.files' in source
        
        return {
            'content_type': 'application/json' if has_json else 'application/x-www-form-urlencoded' if has_form_data else None,
            'has_files': has_files,
            'required': has_json or has_form_data or has_files,
            'schema': self._generate_request_schema(source)
        }
    
    def _extract_response_format(self, source: str) -> Dict[str, Any]:
        """Extract response format information"""
        response_info = {
            'format': 'JSON',
            'status_codes': self._extract_status_codes(source),
            'success_structure': self._extract_success_structure(source),
            'error_structure': self._extract_error_structure(source),
        }
        return response_info
    
    def _extract_status_codes(self, source: str) -> List[int]:
        """Extract HTTP status codes from source"""
        status_codes = [200]  # Default
        
        # Look for explicit status codes
        pattern = r'(\d{3})\s*if\s+([^:]+)\s+else\s+(\d{3})'
        matches = re.findall(pattern, source)
        
        for match in matches:
            status_codes.extend([int(match[0]), int(match[2])])
        
        # Look for single status codes
        pattern = r',\s*(\d{3})\)'
        matches = re.findall(pattern, source)
        
        for match in matches:
            status_codes.append(int(match))
        
        return list(set(status_codes))  # Remove duplicates
    
    def _extract_success_structure(self, source: str) -> Dict[str, Any]:
        """Extract success response structure"""
        return {
            'success': True,
            'data': 'Response data object',
            'message': 'Optional success message',
            'pagination': 'Optional pagination object'
        }
    
    def _extract_error_structure(self, source: str) -> Dict[str, Any]:
        """Extract error response structure"""
        return {
            'success': False,
            'error': 'Error message string',
            'timestamp': 'ISO timestamp'
        }
    
    def _extract_error_handling(self, source: str) -> List[Dict[str, Any]]:
        """Extract error handling information"""
        errors = []
        
        # Look for exception handling
        if 'except Exception as e:' in source:
            errors.append({
                'type': 'General Exception',
                'description': 'Catches all exceptions',
                'response_code': 500
            })
        
        # Look for specific error responses
        pattern = r'create_api_response\s*\(\s*False,\s*error=([^)]+)\)'
        matches = re.findall(pattern, source)
        
        for match in matches:
            errors.append({
                'type': 'API Error',
                'description': match.strip(),
                'response_code': 400
            })
        
        return errors
    
    def _extract_database_operations(self, source: str) -> List[str]:
        """Extract database operations from source"""
        operations = []
        
        if 'get_db()' in source:
            operations.append('Database connection')
        
        if 'SELECT' in source.upper():
            operations.append('Read operations')
        
        if 'INSERT' in source.upper():
            operations.append('Create operations')
        
        if 'UPDATE' in source.upper():
            operations.append('Update operations')
        
        if 'DELETE' in source.upper():
            operations.append('Delete operations')
        
        return operations
    
    def _extract_validation_rules(self, source: str) -> List[Dict[str, Any]]:
        """Extract validation rules from source"""
        validations = []
        
        # Required field validation
        pattern = r'if\s+not\s+([^:]+):\s*return.*error.*[\'"]([^\'"]+)[\'"]'
        matches = re.findall(pattern, source)
        
        for field, error_msg in matches:
            validations.append({
                'field': field.strip(),
                'rule': 'Required',
                'error_message': error_msg.strip()
            })
        
        # Type validation
        if 'int(' in source:
            validations.append({
                'field': 'Numeric fields',
                'rule': 'Must be integer',
                'error_message': 'Invalid numeric value'
            })
        
        return validations
    
    def _extract_pagination_info(self, source: str) -> Dict[str, Any]:
        """Extract pagination information"""
        has_pagination = 'page' in source and 'limit' in source
        
        if has_pagination:
            return {
                'enabled': True,
                'parameters': ['page', 'limit'],
                'default_page': 1,
                'default_limit': 50,
                'max_limit': 100
            }
        else:
            return {'enabled': False}
    
    def _extract_filters(self, source: str) -> List[str]:
        """Extract available filters"""
        filters = []
        
        # Look for filter patterns
        filter_patterns = [
            'segment', 'status', 'priority', 'customer_phone', 'assigned_agent',
            'ticket_type', 'order_type', 'date_from', 'date_to', 'search',
            'category', 'city', 'satisfaction_min', 'return_rate_max'
        ]
        
        for pattern in filter_patterns:
            if pattern in source:
                filters.append(pattern)
        
        return filters
    
    def _generate_endpoint_examples(self, route: Dict[str, Any]) -> Dict[str, Any]:
        """Generate usage examples for endpoint"""
        path = route['path']
        methods = route['methods']
        
        examples = {
            'curl': self._generate_curl_example(path, methods),
            'python': self._generate_python_example(path, methods),
            'javascript': self._generate_javascript_example(path, methods),
        }
        
        return examples
    
    def _generate_curl_example(self, path: str, methods: List[str]) -> str:
        """Generate cURL example"""
        method = methods[0] if methods else 'GET'
        url = f"http://192.168.1.202:5000{path}"
        
        if method == 'GET':
            return f'curl -X GET "{url}"'
        elif method == 'POST':
            return f'curl -X POST "{url}" \\\n  -H "Content-Type: application/json" \\\n  -d \'{{"key": "value"}}\''
        else:
            return f'curl -X {method} "{url}"'
    
    def _generate_python_example(self, path: str, methods: List[str]) -> str:
        """Generate Python example"""
        method = methods[0] if methods else 'GET'
        url = f"http://192.168.1.202:5000{path}"
        
        if method == 'GET':
            return f'import requests\n\nresponse = requests.get("{url}")\nprint(response.json())'
        elif method == 'POST':
            return f'import requests\n\ndata = {{"key": "value"}}\nresponse = requests.post("{url}", json=data)\nprint(response.json())'
        else:
            return f'import requests\n\nresponse = requests.{method.lower()}("{url}")\nprint(response.json())'
    
    def _generate_javascript_example(self, path: str, methods: List[str]) -> str:
        """Generate JavaScript example"""
        method = methods[0] if methods else 'GET'
        url = f"http://192.168.1.202:5000{path}"
        
        if method == 'GET':
            return f'fetch("{url}")\n  .then(response => response.json())\n  .then(data => console.log(data));'
        elif method == 'POST':
            return f'fetch("{url}", {{\n  method: "POST",\n  headers: {{ "Content-Type": "application/json" }},\n  body: JSON.stringify({{key: "value"}})\n}})\n  .then(response => response.json())\n  .then(data => console.log(data));'
        else:
            return f'fetch("{url}", {{ method: "{method}" }})\n  .then(response => response.json())\n  .then(data => console.log(data));'
    
    def _calculate_endpoint_complexity(self, source: str) -> str:
        """Calculate endpoint complexity"""
        lines = len(source.split('\n'))
        
        if lines < 20:
            return 'Simple'
        elif lines < 50:
            return 'Medium'
        elif lines < 100:
            return 'Complex'
        else:
            return 'Very Complex'
    
    def _extract_security_info(self, source: str) -> Dict[str, Any]:
        """Extract security information"""
        return {
            'authentication': 'None required',
            'authorization': 'None required',
            'rate_limiting': 'Not implemented',
            'input_validation': 'Basic validation present' if 'validation' in source.lower() else 'Limited validation'
        }
    
    def _extract_dependencies(self, source: str) -> List[str]:
        """Extract dependencies from source"""
        dependencies = []
        
        if 'get_db()' in source:
            dependencies.append('Database connection')
        
        if 'create_api_response' in source:
            dependencies.append('API response utility')
        
        if 'logger' in source:
            dependencies.append('Logging system')
        
        if 'request' in source:
            dependencies.append('Flask request object')
        
        return dependencies
    
    def _extract_business_logic(self, source: str) -> List[str]:
        """Extract business logic from source"""
        logic = []
        
        if 'customer_segment' in source:
            logic.append('Customer segmentation')
        
        if 'return_rate' in source:
            logic.append('Return rate calculation')
        
        if 'satisfaction_score' in source:
            logic.append('Satisfaction scoring')
        
        if 'maintenance' in source.lower():
            logic.append('Maintenance cycle management')
        
        if 'inventory' in source.lower():
            logic.append('Inventory management')
        
        return logic
    
    def _extract_performance_notes(self, source: str) -> List[str]:
        """Extract performance-related notes"""
        notes = []
        
        if 'LIMIT' in source.upper():
            notes.append('Pagination implemented')
        
        if 'INDEX' in source.upper():
            notes.append('Database indexes used')
        
        if 'batch' in source.lower():
            notes.append('Batch processing available')
        
        return notes
    
    def _get_blueprint_description(self, blueprint_name: str) -> str:
        """Get description for blueprint"""
        descriptions = {
            'customers': 'Comprehensive customer management and analytics with segmentation, interactions, and real-time profiling',
            'products': 'Product catalog and inventory management with stock tracking, categories, and low-stock alerts',
            'maintenance': 'Advanced maintenance cycle management with SLA tracking, technician allocation, and stock integration',
            'customer_service': 'Customer service ticket management with follow-ups, replacements, and hub confirmations',
            'unified_customer_service': 'Unified service action management with comprehensive workflow and analytics',
            'orders': 'Order management and synchronization with Bosta API integration',
            'service_actions': 'Service action management with parts tracking and hub operations',
        }
        return descriptions.get(blueprint_name, 'API endpoints for system functionality')
    
    def _categorize_endpoints(self, blueprint) -> Dict[str, List[str]]:
        """Categorize endpoints by functionality"""
        categories = {
            'CRUD Operations': [],
            'Analytics & Reporting': [],
            'System Management': [],
            'Integration': [],
            'Workflow': [],
        }
        
        # This would be implemented based on endpoint analysis
        return categories
    
    def _generate_blueprint_statistics(self, endpoints: Dict[str, Any]) -> Dict[str, Any]:
        """Generate statistics for a blueprint"""
        total_endpoints = len(endpoints)
        methods_count = {}
        complexity_count = {}
        
        for endpoint in endpoints.values():
            # Count methods
            for method in endpoint.get('methods', []):
                methods_count[method] = methods_count.get(method, 0) + 1
            
            # Count complexity
            complexity = endpoint.get('complexity', 'Unknown')
            complexity_count[complexity] = complexity_count.get(complexity, 0) + 1
        
        return {
            'total_endpoints': total_endpoints,
            'methods_distribution': methods_count,
            'complexity_distribution': complexity_count,
            'avg_parameters_per_endpoint': self._calculate_avg_parameters(endpoints),
        }
    
    def _calculate_avg_parameters(self, endpoints: Dict[str, Any]) -> float:
        """Calculate average parameters per endpoint"""
        total_params = 0
        total_endpoints = len(endpoints)
        
        for endpoint in endpoints.values():
            params = endpoint.get('parameters', {})
            total_params += (
                len(params.get('path_parameters', [])) +
                len(params.get('query_parameters', [])) +
                len(params.get('body_parameters', []))
            )
        
        return round(total_params / total_endpoints, 2) if total_endpoints > 0 else 0
    
    def _generate_api_statistics(self, blueprints: Dict[str, Any]) -> Dict[str, Any]:
        """Generate overall API statistics"""
        total_endpoints = 0
        total_blueprints = len(blueprints)
        all_methods = set()
        
        for blueprint_name, blueprint in blueprints.items():
            routes = self._get_blueprint_routes(blueprint)
            total_endpoints += len(routes)
            
            for route in routes:
                all_methods.update(route.get('methods', []))
        
        return {
            'total_endpoints': total_endpoints,
            'total_blueprints': total_blueprints,
            'supported_methods': list(all_methods),
            'avg_endpoints_per_blueprint': round(total_endpoints / total_blueprints, 2) if total_blueprints > 0 else 0,
        }
    
    def _get_system_endpoints(self) -> Dict[str, Any]:
        """Get system-level endpoints"""
        return {
            'health': {
                'path': '/health',
                'method': 'GET',
                'description': 'System health check with database status',
                'response': 'System status and database information'
            },
            'root': {
                'path': '/',
                'method': 'GET',
                'description': 'System information and endpoint overview',
                'response': 'System overview with available endpoints'
            },
            'api_docs': {
                'path': '/api/docs',
                'method': 'GET',
                'description': 'Comprehensive API documentation',
                'response': 'Dynamic API documentation'
            },
            'sync_status': {
                'path': '/api/sync/status',
                'method': 'GET',
                'description': 'Background sync status',
                'response': 'Sync status and progress information'
            },
            'sync_start': {
                'path': '/api/sync/start',
                'method': 'POST',
                'description': 'Start background sync manually',
                'response': 'Sync start confirmation'
            },
            'sync_stop': {
                'path': '/api/sync/stop',
                'method': 'POST',
                'description': 'Stop background sync manually',
                'response': 'Sync stop confirmation'
            }
        }
    
    def _get_database_status(self) -> Dict[str, Any]:
        """Get database status"""
        try:
            from app.utils.db_utils import get_database_status
            return get_database_status()
        except:
            return {'error': 'Could not retrieve database status'}
    
    def _generate_usage_examples(self) -> Dict[str, Any]:
        """Generate comprehensive usage examples"""
        return {
            'authentication': 'No authentication required for this API',
            'base_url': 'http://192.168.1.202:5000',
            'common_headers': {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            'response_format': {
                'success': True,
                'data': 'Response data',
                'message': 'Optional message',
                'pagination': 'Optional pagination info'
            },
            'error_format': {
                'success': False,
                'error': 'Error message',
                'timestamp': 'ISO timestamp'
            },
            'pagination': {
                'page': 'Page number (default: 1)',
                'limit': 'Items per page (default: 50, max: 100)',
                'offset': 'Alternative to page for offset-based pagination'
            },
            'filtering': {
                'query_parameters': 'Most endpoints support filtering via query parameters',
                'search': 'Text search across relevant fields',
                'date_ranges': 'date_from and date_to parameters for time-based filtering'
            }
        }
    
    def _get_error_codes(self) -> Dict[str, Any]:
        """Get error codes and their meanings"""
        return {
            '200': 'OK - Request successful',
            '201': 'Created - Resource created successfully',
            '400': 'Bad Request - Invalid request data',
            '401': 'Unauthorized - Authentication required',
            '403': 'Forbidden - Access denied',
            '404': 'Not Found - Resource not found',
            '405': 'Method Not Allowed - HTTP method not supported',
            '410': 'Gone - Resource no longer available (deprecated endpoints)',
            '422': 'Unprocessable Entity - Validation failed',
            '500': 'Internal Server Error - Server error',
            '503': 'Service Unavailable - Service temporarily unavailable'
        }
    
    def _get_authentication_info(self) -> Dict[str, Any]:
        """Get authentication information"""
        return {
            'type': 'None required',
            'description': 'This API does not require authentication for basic operations',
            'security_notes': 'Consider implementing authentication for production use',
            'rate_limiting': 'Not currently implemented'
        }
    
    def _get_rate_limiting_info(self) -> Dict[str, Any]:
        """Get rate limiting information"""
        return {
            'enabled': False,
            'description': 'Rate limiting is not currently implemented',
            'recommendation': 'Consider implementing rate limiting for production use'
        }
    
    def _get_data_formats(self) -> Dict[str, Any]:
        """Get data format specifications"""
        return {
            'request_format': 'JSON for POST/PUT requests',
            'response_format': 'JSON for all responses',
            'date_format': 'ISO 8601 (YYYY-MM-DDTHH:MM:SS)',
            'phone_format': 'Egyptian phone numbers (01xxxxxxxxx or 201xxxxxxxxx)',
            'currency': 'Egyptian Pound (EGP)',
            'encoding': 'UTF-8'
        }
    
    def _get_fallback_docs(self) -> Dict[str, Any]:
        """Get fallback documentation when generation fails"""
        return {
            'title': 'HVAR Bosta Integration API v2.0.0',
            'description': 'Comprehensive order management and customer service system',
            'version': '2.0.0',
            'timestamp': datetime.now().isoformat(),
            'error': 'Dynamic documentation generation failed',
            'fallback_endpoints': {
                'health': '/health',
                'customers': '/api/customers',
                'products': '/api/products',
                'maintenance': '/api/maintenance',
                'customer_service': '/api/customer-service',
                'unified_service': '/api/unified-service',
                'orders': '/api/orders'
            }
        }
    
    # Helper methods for parameter analysis
    def _infer_parameter_type(self, default_value: str) -> str:
        """Infer parameter type from default value"""
        if not default_value:
            return 'string'
        
        if default_value.isdigit():
            return 'integer'
        elif default_value.lower() in ['true', 'false']:
            return 'boolean'
        elif default_value.startswith('"') or default_value.startswith("'"):
            return 'string'
        else:
            return 'string'
    
    def _is_parameter_required(self, source: str, param_name: str) -> bool:
        """Check if parameter is required"""
        required_pattern = f'if not data.get(\'{param_name}\'):'
        return required_pattern in source
    
    def _get_parameter_example(self, param_name: str, param_type: str) -> Any:
        """Get example value for parameter"""
        examples = {
            'phone': '01234567890',
            'email': 'user@example.com',
            'name': 'John Doe',
            'id': 123,
            'status': 'active',
            'date': '2025-01-01',
            'amount': 100.50,
            'boolean': True,
        }
        
        return examples.get(param_name, 'example_value')
    
    def _generate_request_schema(self, source: str) -> Dict[str, Any]:
        """Generate request schema based on source analysis"""
        schema = {
            'type': 'object',
            'properties': {},
            'required': []
        }
        
        # Extract properties from source
        pattern = r'data\.get\([\'"]([^\'"]+)[\'"]'
        matches = re.findall(pattern, source)
        
        for field in matches:
            schema['properties'][field] = {
                'type': 'string',
                'description': f'{field} field'
            }
        
        return schema

# Global instance
api_docs_generator = APIDocumentationGenerator()

def generate_comprehensive_api_docs() -> Dict[str, Any]:
    """Generate comprehensive API documentation"""
    return api_docs_generator.generate_comprehensive_api_docs() 