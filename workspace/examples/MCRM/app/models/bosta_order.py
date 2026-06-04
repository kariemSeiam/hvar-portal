# app/models/bosta_order.py
"""
Bosta Order Model
Handles database operations for cached Bosta order data.
"""
import json
from app.utils.db import execute_query, execute_update

def get_order_by_tracking_number(tracking_number):
    """
    Retrieves a cached Bosta order by its tracking number.
    """
    sql = "SELECT order_data FROM bosta_orders WHERE tracking_number = %s"
    result = execute_query(sql, (tracking_number,))
    if result and 'order_data' in result[0]:
        # The data is stored as a string, so we need to parse it.
        return json.loads(result[0]['order_data'])
    return None

def upsert_order(tracking_number, order_data):
    """
    Inserts a new Bosta order or updates an existing one.
    MySQL's ON DUPLICATE KEY UPDATE is used for the upsert operation.
    """
    sql = """
        INSERT INTO bosta_orders (tracking_number, order_data)
        VALUES (%s, %s)
        ON DUPLICATE KEY UPDATE
        order_data = VALUES(order_data),
        updated_at = CURRENT_TIMESTAMP
    """
    # Convert order_data dict to a JSON string for storing.
    order_data_str = json.dumps(order_data)
    execute_update(sql, (tracking_number, order_data_str))
