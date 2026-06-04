# app/utils/errors.py
"""Custom exception classes for the application."""


class ValidationError(Exception):
    """Raised when input validation fails."""
    def __init__(self, message: str, field: str = None, errors: dict = None):
        self.message = message
        self.field = field
        self.errors = errors or {}
        super().__init__(message)


class NotFoundError(Exception):
    """Raised when a requested resource is not found."""
    def __init__(self, resource_type: str, resource_id: str = None):
        self.resource_type = resource_type
        self.resource_id = resource_id
        message = f"{resource_type} not found"
        if resource_id:
            message += f" with ID: {resource_id}"
        super().__init__(message)


class InsufficientStockError(Exception):
    """Raised when there's insufficient stock for an operation."""
    def __init__(self, sku: str, requested: int, available: int):
        self.sku = sku
        self.requested = requested
        self.available = available
        message = f"Insufficient stock for {sku}: requested {requested}, available {available}"
        super().__init__(message)


class InvalidStateTransitionError(Exception):
    """Raised when an invalid state transition is attempted."""
    def __init__(self, current_state: str, target_state: str, context: str = None):
        self.current_state = current_state
        self.target_state = target_state
        self.context = context
        message = f"Cannot transition from {current_state} to {target_state}"
        if context:
            message += f" in context: {context}"
        super().__init__(message)


class DatabaseError(Exception):
    """Raised when a database operation fails."""
    def __init__(self, operation: str, details: str = None):
        self.operation = operation
        self.details = details
        message = f"Database error during {operation}"
        if details:
            message += f": {details}"
        super().__init__(message)


class DuplicateResourceError(Exception):
    """Raised when trying to create a resource that already exists."""
    def __init__(self, resource_type: str, identifier: str):
        self.resource_type = resource_type
        self.identifier = identifier
        message = f"{resource_type} with identifier '{identifier}' already exists"
        super().__init__(message)


class BusinessLogicError(Exception):
    """Raised when a business rule is violated."""
    def __init__(self, rule: str, details: str = None):
        self.rule = rule
        self.details = details
        message = f"Business rule violation: {rule}"
        if details:
            message += f" - {details}"
        super().__init__(message)


class ExternalServiceError(Exception):
    """Raised when an external service call fails."""
    def __init__(self, service: str, operation: str, details: str = None):
        self.service = service
        self.operation = operation
        self.details = details
        message = f"External service error: {service}.{operation}"
        if details:
            message += f" - {details}"
        super().__init__(message)


class AuthenticationError(Exception):
    """Raised when authentication fails."""
    def __init__(self, details: str = None):
        self.details = details
        message = "Authentication failed"
        if details:
            message += f": {details}"
        super().__init__(message)


class AuthorizationError(Exception):
    """Raised when authorization fails."""
    def __init__(self, action: str, resource: str = None):
        self.action = action
        self.resource = resource
        message = f"Not authorized to perform {action}"
        if resource:
            message += f" on {resource}"
        super().__init__(message)


class RateLimitError(Exception):
    """Raised when rate limit is exceeded."""
    def __init__(self, limit: int, window: str):
        self.limit = limit
        self.window = window
        message = f"Rate limit exceeded: {limit} requests per {window}"
        super().__init__(message)


class ConfigurationError(Exception):
    """Raised when there's a configuration error."""
    def __init__(self, setting: str, details: str = None):
        self.setting = setting
        self.details = details
        message = f"Configuration error for {setting}"
        if details:
            message += f": {details}"
        super().__init__(message)
