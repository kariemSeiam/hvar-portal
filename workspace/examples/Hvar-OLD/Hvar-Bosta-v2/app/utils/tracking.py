"""
Utilities for tracking numbers and identifiers
"""

from datetime import datetime
from typing import Optional


def generate_return_tracking(base_tracking: Optional[str]) -> str:
	"""Generate a standardized return tracking reference.

	Format: RTN-<base>-<YYYYMMDDHHMM>
	"""
	base = base_tracking or "UNKNOWN"
	timestamp = datetime.now().strftime("%Y%m%d%H%M")
	return f"RTN-{base}-{timestamp}"


def normalize_return_tracking(tracking_number: Optional[str]) -> Optional[str]:
	"""Normalize return tracking to base tracking number.

	- RET<base> -> <base>
	- RTN-<base>-<timestamp> -> <base>
	- otherwise returns as-is
	"""
	if not tracking_number:
		return tracking_number

	if tracking_number.startswith("RET"):
		return tracking_number[3:]
	if tracking_number.startswith("RTN-"):
		parts = tracking_number.split("-")
		if len(parts) >= 2:
			return parts[1]
	return tracking_number


