"""
String constants for statuses and priorities used across services.
Centralizing avoids typos and keeps values consistent in DB.
"""

# Service Action statuses
class ServiceActionStatus:
	REQUESTED = 'requested'
	IN_PROGRESS = 'in_progress'
	HUB_CONFIRMED = 'hub_confirmed'
	COMPLETED = 'completed'
	REJECTED = 'rejected'
	CANCELLED = 'cancelled'
	CLOSED = 'closed'


# Maintenance Cycle statuses
class MaintenanceCycleStatus:
	SCHEDULED = 'scheduled'
	IN_PROGRESS = 'in_progress'
	PARTS_PENDING = 'parts_pending'
	QUALITY_CHECK = 'quality_check'
	COMPLETED = 'completed'
	CANCELLED = 'cancelled'
	OVERDUE = 'overdue'
	ESCALATED = 'escalated'
	URGENT = 'urgent'


# Generic priorities
class Priority:
	LOW = 'low'
	MEDIUM = 'medium'
	HIGH = 'high'
	URGENT = 'urgent'
	CRITICAL = 'critical'


