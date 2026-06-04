"""
Common validation helpers to avoid duplication across services and routes.
"""

from typing import Dict, List, Optional, Any


def validate_required_fields(data: Dict[str, Any], required_fields: List[str]) -> Optional[str]:
	"""Validate that required fields are present in a mapping.

	Returns an error message if missing, otherwise None.
	"""
	missing = [field for field in required_fields if not data.get(field)]
	if missing:
		return f"Missing required fields: {', '.join(missing)}"
	return None


def validate_required_params(params: Dict[str, Any], required_params: List[str]) -> Optional[str]:
	"""Validate that required params are present.

	Returns an error message if missing, otherwise None.
	"""
	missing = [param for param in required_params if not params.get(param)]
	if missing:
		return f"Missing required parameters: {', '.join(missing)}"
	return None


