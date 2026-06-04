# app/models/tracking.py
"""Tracking model definition."""
# Define Tracking model here
from app.utils.db import execute_insert, execute_query

def create_scan(tracking_number, scan_type, ticket_id, user_id, location, notes):
    """Creates a new tracking scan record."""
    reference_type = 'service_ticket' if ticket_id else None
    sql = """
        INSERT INTO tracking_scans 
            (tracking_number, scan_type, reference_id, created_by, scan_location, notes, reference_type)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """
    params = (tracking_number, scan_type, ticket_id, user_id, location, notes, reference_type)
    return execute_insert(sql, params)

def get_scans_by_tracking(tracking_number):
    """Gets all scans for a tracking number, ordered chronologically."""
    sql = "SELECT * FROM tracking_scans WHERE tracking_number = %s ORDER BY created_at ASC"
    return execute_query(sql, (tracking_number,))

def get_scans_by_ticket(ticket_id):
    """Gets all scans associated with a service ticket."""
    sql = "SELECT * FROM tracking_scans WHERE reference_id = %s AND reference_type = 'service_ticket' ORDER BY created_at ASC"
    return execute_query(sql, (ticket_id,))

def get_last_scan(tracking_number):
    """Gets the most recent scan for a tracking number."""
    sql = "SELECT * FROM tracking_scans WHERE tracking_number = %s ORDER BY created_at DESC LIMIT 1"
    result = execute_query(sql, (tracking_number,))
    return result[0] if result else None
