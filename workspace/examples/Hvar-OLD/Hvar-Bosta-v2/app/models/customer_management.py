"""
Customer Management Models and Schema for HVAR CRM
Comprehensive customer profile management with segmentation and analytics
"""
import logging
import sqlite3
from contextlib import contextmanager
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from app.utils.db_utils import get_db

# Setup logging
logger = logging.getLogger(__name__)

def init_customer_management_db() -> Dict[str, Any]:
    """
    Initialize customer management database tables
    This function ensures all customer-related tables exist
    """
    try:
        with get_db() as conn:
            # Customer management tables are already defined in database.py
            # Just check if they exist and return status
            cursor = conn.execute("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('customers', 'customer_addresses', 'customer_segments', 'customer_interactions', 'customer_service_queue', 'customer_analytics')")
            existing_tables = [row[0] for row in cursor.fetchall()]
            
            if len(existing_tables) >= 6:  # All customer tables exist
                # Get customer count
                cursor = conn.execute("SELECT COUNT(*) FROM customers")
                customer_count = cursor.fetchone()[0]
                
                return {
                    'success': True,
                    'message': 'Customer management database already initialized',
                    'customer_count': customer_count,
                    'tables': existing_tables
                }
            else:
                # Tables don't exist, they should be created by init_production_db
                from app.models.database import init_production_db
                init_result = init_production_db()
                
                if init_result.get('success'):
                    return {
                        'success': True,
                        'message': 'Customer management database initialized successfully',
                        'tables': init_result.get('tables', [])
                    }
                else:
                    return {
                        'success': False,
                        'error': init_result.get('error', 'Failed to initialize database')
                    }
                    
    except Exception as e:
        logger.error(f"❌ Customer management database initialization failed: {e}")
        return {
            'success': False,
            'error': str(e)
        }


def populate_customers_from_orders(batch_size: int = 1000):
    """
    Populate customers from existing orders data in batches
    """
    try:
        customer_manager = CustomerManager()
        extraction_result = customer_manager.extract_customers_from_orders_batch(batch_size)
        
        if extraction_result.get('success'):
            logger.info(f"✅ Customer extraction completed: {extraction_result.get('customers_created', 0)} customers created")
        else:
            logger.warning(f"⚠️ Customer extraction failed: {extraction_result.get('error')}")
        
        return extraction_result
        
    except Exception as e:
        logger.error(f"❌ Customer population failed: {e}")
        return {
            'success': False,
            'error': str(e)
        }

class CustomerManager:
    """
    Customer management class for handling customer operations
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    def extract_customers_from_orders_batch(self, batch_size: int = 1000) -> Dict[str, Any]:
        """
        Extract unique customers from existing orders table in batches
        Process customers batch by batch instead of loading all orders at once
        """
        try:
            with get_db() as conn:
                # Get total count of orders with phone numbers
                cursor = conn.execute("""
                    SELECT COUNT(*) FROM orders 
                    WHERE receiver_phone IS NOT NULL AND receiver_phone != ''
                """)
                total_orders = cursor.fetchone()[0]
                
                self.logger.info(f"🔄 Starting batch customer extraction for {total_orders} orders")
                
                customers_created = 0
                addresses_created = 0
                processed_orders = 0
                processed_customers = 0
                offset = 0
                
                while True:
                    # Fetch batch of orders
                    cursor = conn.execute("""
                        SELECT 
                            receiver_phone,           -- 0
                            receiver_name,            -- 1
                            receiver_first_name,      -- 2
                            receiver_last_name,       -- 3
                            dropoff_city_name,        -- 4
                            dropoff_zone_name,        -- 5
                            dropoff_district_name,    -- 6
                            dropoff_first_line,       -- 7
                            cod,                      -- 8
                            created_at,               -- 9
                            delivered_at,             -- 10
                            returned_at,              -- 11
                            state_code,               -- 12
                            state_value               -- 13
                        FROM orders 
                        WHERE receiver_phone IS NOT NULL AND receiver_phone != ''
                        ORDER BY receiver_phone, created_at
                        LIMIT ? OFFSET ?
                    """, (batch_size, offset))
                    
                    batch_orders = cursor.fetchall()
                    if not batch_orders:
                        break
                    
                    # Group orders by phone for this batch
                    from collections import defaultdict
                    customer_orders = defaultdict(list)
                    for order in batch_orders:
                        phone = order[0]
                        if phone:
                            customer_orders[phone].append(order)
                    
                    self.logger.info(f"📦 Processing batch: {len(batch_orders)} orders for {len(customer_orders)} unique customers")
                    
                    # Process each customer in this batch
                    for phone, orders in customer_orders.items():
                        try:
                            # Check if customer already exists
                            cursor = conn.execute("SELECT customer_id FROM customers WHERE phone = ?", (phone,))
                            existing_customer = cursor.fetchone()
                            
                            if existing_customer:
                                # Update existing customer with orders from this batch
                                self._update_customer_from_orders(conn, existing_customer[0], orders)
                            else:
                                # Create new customer with orders from this batch
                                customer_id = self._create_customer_from_orders(conn, phone, orders)
                                if customer_id:
                                    customers_created += 1
                                    addresses_created += self._create_customer_addresses(conn, customer_id, orders)
                            
                            processed_customers += 1
                            
                        except Exception as e:
                            self.logger.error(f"❌ Failed to process customer {phone}: {e}")
                            continue
                    
                    processed_orders += len(batch_orders)
                    offset += batch_size
                    
                    # Update customer analytics after each batch
                    self._update_customer_analytics(conn)
                    
                    self.logger.info(f"📊 Batch completed: {processed_orders}/{total_orders} orders, "
                                   f"{processed_customers} customers processed, "
                                   f"{customers_created} customers created, {addresses_created} addresses")
                
                self.logger.info(f"✅ Customer extraction completed: "
                               f"{customers_created} customers, {addresses_created} addresses")
                
                return {
                    'success': True,
                    'customers_created': customers_created,
                    'addresses_created': addresses_created,
                    'total_processed': processed_customers,
                    'total_orders_processed': processed_orders
                }
        except Exception as e:
            self.logger.error(f"❌ Customer extraction failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def process_customers_from_order_batch(self, orders: List[Dict]) -> Dict[str, Any]:
        """
        Process customers from a specific batch of orders
        This method is designed to be called after each batch of orders is processed
        
        Args:
            orders: List of order dictionaries from a batch
            
        Returns:
            Processing results
        """
        try:
            with get_db() as conn:
                # Group orders by customer phone
                from collections import defaultdict
                customer_orders = defaultdict(list)
                
                for order in orders:
                    phone = order.get('receiver_phone')
                    if phone:
                        customer_orders[phone].append(order)
                
                customers_created = 0
                addresses_created = 0
                processed = 0
                
                self.logger.info(f"🔄 Processing {len(customer_orders)} customers from {len(orders)} orders")
                
                for phone, phone_orders in customer_orders.items():
                    try:
                        # Check if customer already exists
                        cursor = conn.execute("SELECT customer_id FROM customers WHERE phone = ?", (phone,))
                        existing_customer = cursor.fetchone()
                        
                        if existing_customer:
                            # Update existing customer with new orders
                            self._update_customer_from_orders(conn, existing_customer[0], phone_orders)
                        else:
                            # Create new customer with orders
                            customer_id = self._create_customer_from_orders(conn, phone, phone_orders)
                            if customer_id:
                                customers_created += 1
                                addresses_created += self._create_customer_addresses(conn, customer_id, phone_orders)
                        
                        processed += 1
                        
                    except Exception as e:
                        self.logger.error(f"❌ Failed to process customer {phone}: {e}")
                        continue
                
                # Update customer analytics for this batch
                self._update_customer_analytics(conn)
                
                return {
                    'success': True,
                    'customers_created': customers_created,
                    'addresses_created': addresses_created,
                    'customers_processed': processed,
                    'orders_processed': len(orders)
                }
                
        except Exception as e:
            self.logger.error(f"❌ Batch customer processing failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _create_customer_from_orders(self, conn, phone: str, orders: List) -> Optional[int]:
        """
        Create a new customer from order data
        
        Args:
            conn: Database connection
            phone: Customer phone number
            orders: List of customer orders
            
        Returns:
            Customer ID if created successfully, None otherwise
        """
        try:
            # Calculate customer metrics with correct column indices
            total_orders = len(orders)
            
            # Calculate total_value from COD (column 8) - only positive COD values
            total_value = sum(float(order[8] or 0) for order in orders if float(order[8] or 0) > 0)
            avg_order_value = total_value / total_orders if total_orders > 0 else 0
            
            # Get first and last order dates (column 9 - created_at)
            order_dates = [order[9] for order in orders if order[9]] # Use column 9 for created_at
            first_order_date = min(order_dates) if order_dates else None
            last_order_date = max(order_dates) if order_dates else None
            
            # Calculate return rate based on state_code = 46 (Returned to business)
            returned_orders = sum(1 for order in orders if order[12] == 46)  # state_code = 46
            return_rate = (returned_orders / total_orders * 100) if total_orders > 0 else 0
            
            # Calculate satisfaction score based on return rate and order patterns
            satisfaction_score = self._calculate_satisfaction_score(return_rate, total_orders, total_value)
            
            # Determine customer segment
            customer_segment = self._determine_customer_segment(total_orders, total_value, return_rate)
            
            # Get customer name from most recent order
            latest_order = max(orders, key=lambda x: x[9] or '')  # created_at
            first_name = latest_order[2] or ''  # receiver_first_name
            last_name = latest_order[3] or ''   # receiver_last_name
            full_name = latest_order[1] or f"{first_name} {last_name}".strip()  # receiver_name
            
            # Get primary address from most frequent location
            address_counts = {}
            for order in orders:
                city = order[4]  # dropoff_city_name
                zone = order[5]  # dropoff_zone_name
                district = order[6]  # dropoff_district_name
                address_key = f"{city}|{zone}|{district}"
                address_counts[address_key] = address_counts.get(address_key, 0) + 1
            
            primary_location = max(address_counts.items(), key=lambda x: x[1])[0] if address_counts else None
            primary_city, primary_zone, primary_district = primary_location.split('|') if primary_location else (None, None, None)
            
            # Insert customer
            cursor = conn.execute("""
                INSERT INTO customers (
                    phone, first_name, last_name, full_name,
                    primary_city, primary_zone, primary_district,
                    total_orders, total_value, avg_order_value,
                    first_order_date, last_order_date,
                    customer_segment, return_rate, satisfaction_score
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                phone, first_name, last_name, full_name,
                primary_city, primary_zone, primary_district,
                total_orders, total_value, avg_order_value,
                first_order_date, last_order_date,
                customer_segment, return_rate, satisfaction_score
            ))
            
            return cursor.lastrowid
            
        except Exception as e:
            self.logger.error(f"❌ Failed to create customer {phone}: {e}")
            return None
    
    def _update_customer_from_orders(self, conn, customer_id: int, orders: List):
        """
        Update existing customer with new order data
        
        Args:
            conn: Database connection
            customer_id: Customer ID to update
            orders: List of customer orders
        """
        try:
            # Recalculate metrics with correct column indices
            total_orders = len(orders)
            
            # Calculate total_value from COD (column 8) - only positive COD values
            total_value = sum(float(order[8] or 0) for order in orders if float(order[8] or 0) > 0)
            avg_order_value = total_value / total_orders if total_orders > 0 else 0
            
            # Get order dates (column 9 - created_at)
            order_dates = [order[9] for order in orders if order[9]] # Use column 9 for created_at
            first_order_date = min(order_dates) if order_dates else None
            last_order_date = max(order_dates) if order_dates else None
            
            # Calculate return rate based on state_code = 46 (Returned to business)
            returned_orders = sum(1 for order in orders if order[12] == 46)  # state_code = 46
            return_rate = (returned_orders / total_orders * 100) if total_orders > 0 else 0
            
            # Calculate satisfaction score
            satisfaction_score = self._calculate_satisfaction_score(return_rate, total_orders, total_value)
            
            # Determine customer segment
            customer_segment = self._determine_customer_segment(total_orders, total_value, return_rate)
            
            # Update customer
            conn.execute("""
                UPDATE customers SET
                    total_orders = ?,
                    total_value = ?,
                    avg_order_value = ?,
                    first_order_date = ?,
                    last_order_date = ?,
                    customer_segment = ?,
                    return_rate = ?,
                    satisfaction_score = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE customer_id = ?
            """, (
                total_orders, total_value, avg_order_value,
                first_order_date, last_order_date,
                customer_segment, return_rate, satisfaction_score, customer_id
            ))
            
        except Exception as e:
            self.logger.error(f"❌ Failed to update customer {customer_id}: {e}")
    
    def _create_customer_addresses(self, conn, customer_id: int, orders: List) -> int:
        """
        Create customer addresses from order data
        
        Args:
            conn: Database connection
            customer_id: Customer ID
            orders: List of customer orders
            
        Returns:
            Number of addresses created
        """
        try:
            addresses_created = 0
            
            # Group addresses by location with correct column indices
            address_counts = {}
            for order in orders:
                city = order[4]  # dropoff_city_name
                zone = order[5]  # dropoff_zone_name
                district = order[6]  # dropoff_district_name
                address_line = order[7]  # dropoff_first_line
                
                if city and zone:  # Only create addresses with valid city/zone
                    address_key = f"{city}|{zone}|{district}|{address_line}"
                    address_counts[address_key] = address_counts.get(address_key, 0) + 1
            
            # Create addresses, marking the most frequent as primary
            sorted_addresses = sorted(address_counts.items(), key=lambda x: x[1], reverse=True)
            
            for i, (address_key, count) in enumerate(sorted_addresses):
                city, zone, district, address_line = address_key.split('|')
                is_primary = (i == 0)  # First address is primary
                
                # Check if address already exists
                cursor = conn.execute("""
                    SELECT address_id FROM customer_addresses 
                    WHERE customer_id = ? AND city = ? AND zone = ? AND district = ?
                """, (customer_id, city, zone, district))
                
                if not cursor.fetchone():
                    conn.execute("""
                        INSERT INTO customer_addresses (
                            customer_id, city, zone, district, address_line, is_primary
                        ) VALUES (?, ?, ?, ?, ?, ?)
                    """, (customer_id, city, zone, district, address_line, is_primary))
                    addresses_created += 1
            
            return addresses_created
            
        except Exception as e:
            self.logger.error(f"❌ Failed to create addresses for customer {customer_id}: {e}")
            return 0
    
    def _calculate_satisfaction_score(self, return_rate: float, total_orders: int, total_value: float) -> float:
        """
        Calculate customer satisfaction score based on various factors
        
        Args:
            return_rate: Customer return rate percentage
            total_orders: Total number of orders
            total_value: Total order value
            
        Returns:
            Satisfaction score between 0 and 5
        """
        try:
            # Base score starts at 3.0 (neutral)
            score = 3.0
            
            # Adjust based on return rate (lower is better)
            if return_rate <= 5:
                score += 1.5
            elif return_rate <= 10:
                score += 1.0
            elif return_rate <= 20:
                score += 0.5
            elif return_rate > 50:
                score -= 1.5
            
            # Adjust based on order frequency (more orders = more engagement)
            if total_orders >= 10:
                score += 0.5
            elif total_orders >= 5:
                score += 0.3
            elif total_orders >= 2:
                score += 0.1
            
            # Adjust based on order value (higher value = more satisfied)
            # For customers with very low values, don't penalize too much
            if total_value > 10000:
                score += 0.5
            elif total_value > 5000:
                score += 0.3
            elif total_value > 1000:
                score += 0.1
            elif total_value > 100:
                score += 0.05
            elif total_value == 0:
                # For customers with 0 value, assume they might be new or have free orders
                score += 0.1
            
            # Ensure score is within bounds
            return max(1.0, min(5.0, score))  # Minimum score of 1.0
            
        except Exception as e:
            self.logger.error(f"❌ Error calculating satisfaction score: {e}")
            return 3.0  # Default neutral score
    
    def _determine_customer_segment(self, total_orders: int, total_value: float, return_rate: float) -> str:
        """
        Determine customer segment based on order patterns
        
        Args:
            total_orders: Total number of orders
            total_value: Total order value
            return_rate: Return rate percentage
            
        Returns:
            Customer segment string
        """
        # Problematic customers (high return rate)
        if return_rate > 30:
            return 'problematic'
        
        # VIP customers (high value or many orders)
        if total_value > 5000 or total_orders >= 10:
            return 'vip'
        
        # Regular customers (consistent ordering)
        if total_orders >= 3:
            return 'regular'
        
        # New customers
        return 'new'
    
    def _update_customer_analytics(self, conn):
        """
        Update customer analytics after extraction
        
        Args:
            conn: Database connection
        """
        try:
            # Calculate customer lifetime value and other metrics, including next_purchase_prediction and segment_recommendation
            conn.execute("""
                INSERT OR REPLACE INTO customer_analytics (
                    customer_id, lifetime_value, avg_order_value, order_frequency,
                    return_rate, satisfaction_score, churn_risk_score, customer_health_score,
                    next_purchase_prediction, segment_recommendation
                )
                SELECT 
                    c.customer_id,
                    c.total_value as lifetime_value,
                    c.avg_order_value,
                    CASE 
                        WHEN c.total_orders > 0 AND c.first_order_date IS NOT NULL 
                        THEN CAST(c.total_orders AS FLOAT) / 
                             (julianday(c.last_order_date) - julianday(c.first_order_date) + 1) * 30
                        ELSE 0 
                    END as order_frequency,
                    c.return_rate,
                    c.satisfaction_score,
                    CASE 
                        WHEN c.return_rate > 30 THEN 0.8
                        WHEN c.return_rate > 20 THEN 0.6
                        WHEN c.return_rate > 10 THEN 0.4
                        ELSE 0.2
                    END as churn_risk_score,
                    CASE 
                        WHEN c.customer_segment = 'vip' THEN 0.9
                        WHEN c.customer_segment = 'regular' THEN 0.7
                        WHEN c.customer_segment = 'new' THEN 0.5
                        ELSE 0.3
                    END as customer_health_score,
                    CASE 
                        WHEN c.total_orders > 0 AND c.last_order_date IS NOT NULL AND (
                            CAST(c.total_orders AS FLOAT) / (julianday(c.last_order_date) - julianday(c.first_order_date) + 1)
                        ) > 0 THEN date(c.last_order_date, '+' || CAST(30.0 / (CAST(c.total_orders AS FLOAT) / (julianday(c.last_order_date) - julianday(c.first_order_date) + 1)) AS INTEGER) || ' days')
                        ELSE date(c.last_order_date, '+90 days')
                    END as next_purchase_prediction,
                    CASE 
                        WHEN c.total_orders >= 10 AND c.total_value >= 5000 THEN 'vip'
                        WHEN c.total_orders >= 3 THEN 'regular'
                        WHEN c.return_rate > 30 THEN 'problematic'
                        ELSE 'new'
                    END as segment_recommendation
                FROM customers c
            """)
            conn.commit()
            self.logger.info("✅ Customer analytics updated")
        except Exception as e:
            self.logger.error(f"❌ Failed to update customer analytics: {e}")

def get_customer_stats():
    """
    Get customer management statistics
    
    Returns:
        Dictionary with customer statistics
    """
    try:
        with get_db() as conn:
            # Get customer counts by segment
            cursor = conn.execute("""
                SELECT 
                    customer_segment,
                    COUNT(*) as count,
                    AVG(total_value) as avg_value,
                    AVG(return_rate) as avg_return_rate,
                    AVG(satisfaction_score) as avg_satisfaction
                FROM customers 
                GROUP BY customer_segment
            """)
            
            segment_stats = cursor.fetchall()
            
            # Get total customers
            cursor = conn.execute("SELECT COUNT(*) FROM customers")
            total_customers = cursor.fetchone()[0]
            
            # Get customers with interactions
            cursor = conn.execute("SELECT COUNT(DISTINCT customer_id) FROM customer_interactions")
            customers_with_interactions = cursor.fetchone()[0]
            
            # Get data quality metrics
            cursor = conn.execute("""
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN satisfaction_score IS NOT NULL AND satisfaction_score > 0 THEN 1 ELSE 0 END) as satisfaction_filled,
                    SUM(CASE WHEN primary_address IS NOT NULL AND primary_address != '' THEN 1 ELSE 0 END) as address_filled
                FROM customers
            """)
            quality_stats = cursor.fetchone()
            
            return {
                'success': True,
                'total_customers': total_customers,
                'customers_with_interactions': customers_with_interactions,
                'data_quality': {
                    'total': quality_stats[0],
                    'satisfaction_filled': quality_stats[1],
                    'address_filled': quality_stats[2],
                    'satisfaction_percentage': round((quality_stats[1] / quality_stats[0]) * 100, 2) if quality_stats[0] > 0 else 0,
                    'address_percentage': round((quality_stats[2] / quality_stats[0]) * 100, 2) if quality_stats[0] > 0 else 0
                },
                'segment_stats': [
                    {
                        'segment': row[0],
                        'count': row[1],
                        'avg_value': row[2],
                        'avg_return_rate': row[3],
                        'avg_satisfaction': row[4]
                    }
                    for row in segment_stats
                ]
            }
            
    except Exception as e:
        logger.error(f"❌ Failed to get customer stats: {e}")
        return {
            'success': False,
            'error': str(e)
        } 