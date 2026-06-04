"""
Customer Profile Manager Service for HVAR Complete Cycle System
Real-time customer profile management with event-driven analytics and deduplication

This service integrates with the unified order intake to ensure every order sync
creates/updates corresponding customer profiles and triggers real-time analytics.

Based on requirements from @HVAR_COMPLETE_CYCLE_SYSTEM.md Step 3.
"""

import logging
import sqlite3
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from decimal import Decimal
import json
from collections import defaultdict

from app.utils.db_utils import get_db
from app.utils.phone_utils import normalize_phone

# Setup logging
logger = logging.getLogger(__name__)

class CustomerProfileManager:
    """
    Real-time customer profile management for the HVAR Complete Cycle System
    
    Features:
    - Real-time customer profile creation/updates on every order
    - Event-driven analytics and segmentation
    - Customer deduplication and merge logic
    - Multiple address tracking
    - Customer health and satisfaction scoring
    - Integration with unified order intake
    """
    
    def __init__(self, prevent_merge_for_same_phones: bool = True, max_duplicate_phones: int = 20, allow_merge_above_limit: bool = False):
        self.logger = logging.getLogger(__name__)
        self.prevent_merge_for_same_phones = prevent_merge_for_same_phones
        self.max_duplicate_phones = max_duplicate_phones
        self.allow_merge_above_limit = allow_merge_above_limit
    
    def process_customer_from_order(self, conn, order_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process customer profile from order data in real-time
        
        This is the main entry point called by unified order intake for every order.
        
        Args:
            conn: Database connection (within transaction)
            order_data: Normalized order data from unified intake
            
        Returns:
            Dict containing customer processing results
        """
        try:
            customer_phone = order_data.get('receiver_phone')
            if not customer_phone:
                return {'success': False, 'error': 'No customer phone provided'}
            
            # Normalize phone for consistency
            normalized_phone = normalize_phone(customer_phone)
            
            # Check for existing customer (including deduplication)
            customer_id = self._find_or_create_customer(conn, order_data, normalized_phone)
            
            # Update customer profile with new order data
            update_result = self._update_customer_profile_realtime(conn, customer_id, order_data)
            
            # Update customer addresses
            address_result = self._update_customer_addresses(conn, customer_id, order_data)
            
            # Trigger real-time analytics update
            analytics_result = self._update_customer_analytics_realtime(conn, customer_id)
            
            return {
                'success': True,
                'customer_id': customer_id,
                'profile_updated': update_result['success'],
                'addresses_updated': address_result['addresses_updated'],
                'analytics_updated': analytics_result['success'],
                'segment_changed': analytics_result.get('segment_changed', False),
                'new_segment': analytics_result.get('new_segment')
            }
            
        except Exception as e:
            self.logger.error(f"Error processing customer from order: {e}")
            return {'success': False, 'error': str(e)}
    
    def _find_or_create_customer(self, conn, order_data: Dict, normalized_phone: str) -> int:
        """
        Find existing customer or create new one with deduplication logic
        
        Args:
            conn: Database connection
            order_data: Order data
            normalized_phone: Normalized phone number
            
        Returns:
            Customer ID
        """
        # Try to find existing customer by normalized phone
        cursor = conn.execute("""
            SELECT customer_id FROM customers WHERE phone = ? OR phone = ?
        """, (order_data['receiver_phone'], normalized_phone))
        
        existing_customer = cursor.fetchone()
        if existing_customer:
            return existing_customer[0]
        
        # Disable duplicate finding and merging - treat each phone number as separate customer
        # duplicates = self._find_potential_duplicates(conn, order_data)
        # if duplicates:
        #     # Use the first duplicate and update phone numbers
        #     customer_id = duplicates[0]['customer_id']
        #     
        #     # Check if we should prevent merging for same phones
        #     if self.prevent_merge_for_same_phones:
        #         # Check if the phone numbers are essentially the same
        #         existing_phone = duplicates[0]['phone']
        #         normalized_existing = normalize_phone(existing_phone) if existing_phone else None
        #         normalized_new = normalize_phone(order_data['receiver_phone'])
        #         
        #         if normalized_existing == normalized_new:
        #             self.logger.info(f"Skipping merge for customer {customer_id}: phone numbers are identical after normalization")
        #             return customer_id
        #     
        #     # Disable merge functionality - treat same phone numbers as same customer without merging
        #     # self._merge_customer_phones(conn, customer_id, [order_data['receiver_phone'], normalized_phone])
        #     return customer_id
        
        # Create new customer
        return self._create_new_customer(conn, order_data, normalized_phone)
    
    def _find_potential_duplicates(self, conn, order_data: Dict) -> List[Dict]:
        """
        Find potential duplicate customers by name and address similarity
        
        Args:
            conn: Database connection
            order_data: Order data
            
        Returns:
            List of potential duplicate customer records
        """
        receiver_name = order_data.get('receiver_name', '').strip()
        first_name = order_data.get('receiver_first_name', '').strip()
        last_name = order_data.get('receiver_last_name', '').strip()
        city = order_data.get('dropoff_city_name', '').strip()
        
        if not any([receiver_name, first_name, city]):
            return []
        
        # Search for similar customers
        search_conditions = []
        params = []
        
        if receiver_name:
            search_conditions.append("(c.full_name LIKE ? OR c.first_name LIKE ? OR c.last_name LIKE ?)")
            params.extend([f"%{receiver_name}%", f"%{receiver_name}%", f"%{receiver_name}%"])
        
        if first_name and last_name:
            search_conditions.append("(c.first_name LIKE ? AND c.last_name LIKE ?)")
            params.extend([f"%{first_name}%", f"%{last_name}%"])
        
        if city:
            search_conditions.append("c.primary_city = ?")
            params.append(city)
        
        if not search_conditions:
            return []
        
        query = f"""
            SELECT customer_id, phone, full_name, first_name, last_name, primary_city
            FROM customers c
            WHERE ({' OR '.join(search_conditions)})
            ORDER BY c.updated_at DESC
            LIMIT 5
        """
        
        cursor = conn.execute(query, params)
        return [dict(zip([col[0] for col in cursor.description], row)) for row in cursor.fetchall()]
    
    def _merge_customer_phones(self, conn, customer_id: int, phone_numbers: List[str]):
        """
        Merge phone numbers for a customer (deduplication)
        
        Args:
            conn: Database connection
            customer_id: Customer ID
            phone_numbers: List of phone numbers to associate
        """
        # Get current customer phone
        cursor = conn.execute("SELECT phone FROM customers WHERE customer_id = ?", (customer_id,))
        current_phone = cursor.fetchone()[0]
        
        # Normalize all phone numbers for comparison
        normalized_phones = [normalize_phone(phone) for phone in phone_numbers if phone]
        normalized_current = normalize_phone(current_phone) if current_phone else None
        
        # Check if all phone numbers are essentially the same after normalization
        all_phones = set(normalized_phones + [normalized_current])
        if len(all_phones) <= 1:
            # All phones are the same, no need to merge
            self.logger.info(f"Skipping merge for customer {customer_id}: all phone numbers are identical after normalization")
            return
        
        # Check for excessive duplicate phone numbers (more than configured limit)
        phone_counts = {}
        for phone in normalized_phones + [normalized_current]:
            if phone:
                phone_counts[phone] = phone_counts.get(phone, 0) + 1
        
        # Handle duplicate phone number logic based on configuration
        for phone, count in phone_counts.items():
            if count > self.max_duplicate_phones:
                if self.allow_merge_above_limit:
                    # Allow merge when above limit (e.g., +20 means merge if >20)
                    self.logger.info(f"Allowing merge for customer {customer_id}: phone {phone} appears {count} times (above limit of {self.max_duplicate_phones}, but merge allowed)")
                else:
                    # Skip merge when above limit (default behavior)
                    self.logger.warning(f"Skipping merge for customer {customer_id}: phone {phone} appears {count} times (exceeds limit of {self.max_duplicate_phones})")
                    return
        
        # Choose the best phone number (longer, more complete)
        all_phone_numbers = [phone for phone in phone_numbers if phone] + [current_phone] if current_phone else []
        best_phone = max(all_phone_numbers, key=lambda x: len(x) if x else 0)
        
        # Only update if the phone number is actually different
        if normalize_phone(best_phone) != normalized_current:
            conn.execute("""
                UPDATE customers 
                SET phone = ?, updated_at = CURRENT_TIMESTAMP 
                WHERE customer_id = ?
            """, (best_phone, customer_id))
            
            # Disable verbose logging - only log errors
            pass
        else:
            # Disable verbose logging - only log errors
            pass
    
    def _create_new_customer(self, conn, order_data: Dict, normalized_phone: str) -> int:
        """
        Create a new customer from order data
        
        Args:
            conn: Database connection
            order_data: Order data
            normalized_phone: Normalized phone number
            
        Returns:
            New customer ID
        """
        # Extract customer information
        phone = order_data.get('receiver_phone', normalized_phone)
        first_name = order_data.get('receiver_first_name', '').strip()
        last_name = order_data.get('receiver_last_name', '').strip()
        full_name = order_data.get('receiver_name', '').strip() or f"{first_name} {last_name}".strip()
        
        # Geographic information
        primary_city = order_data.get('dropoff_city_name', '').strip()
        primary_zone = order_data.get('dropoff_zone_name', '').strip()
        primary_district = order_data.get('dropoff_district_name', '').strip()
        primary_address = order_data.get('dropoff_first_line', '').strip()
        
        # Initial metrics
        total_orders = 1
        cod_value = order_data.get('cod', 0) or 0
        total_value = cod_value if cod_value > 0 else 0
        avg_order_value = total_value
        first_order_date = order_data.get('created_at')
        last_order_date = first_order_date
        
        # Initial segmentation
        customer_segment = self._determine_initial_segment(total_value, cod_value)
        return_rate = 0.0
        satisfaction_score = 0.5  # Neutral initial score
        
        # Insert new customer
        cursor = conn.execute("""
            INSERT INTO customers (
                phone, first_name, last_name, full_name,
                primary_city, primary_zone, primary_district, primary_address,
                total_orders, total_value, avg_order_value,
                first_order_date, last_order_date, customer_segment,
                return_rate, satisfaction_score,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        """, (
            phone, first_name, last_name, full_name,
            primary_city, primary_zone, primary_district, primary_address,
            total_orders, total_value, avg_order_value,
            first_order_date, last_order_date, customer_segment,
            return_rate, satisfaction_score
        ))
        
        customer_id = cursor.lastrowid
        # Disable verbose logging - only log errors
        pass
        return customer_id
    
    def _update_customer_profile_realtime(self, conn, customer_id: int, order_data: Dict) -> Dict[str, Any]:
        """
        Update customer profile in real-time with new order data
        
        Args:
            conn: Database connection
            customer_id: Customer ID
            order_data: New order data
            
        Returns:
            Update results
        """
        try:
            # Get current customer data
            cursor = conn.execute("""
                SELECT total_orders, total_value, avg_order_value, first_order_date, 
                       last_order_date, return_rate, customer_segment
                FROM customers WHERE customer_id = ?
            """, (customer_id,))
            
            current_data = cursor.fetchone()
            if not current_data:
                return {'success': False, 'error': 'Customer not found'}
            
            current_orders, current_value, current_avg, first_date, last_date, current_return_rate, current_segment = current_data
            
            # Calculate new metrics
            new_total_orders = current_orders + 1
            cod_value = order_data.get('cod', 0) or 0
            new_total_value = current_value + (cod_value if cod_value > 0 else 0)
            new_avg_order_value = new_total_value / new_total_orders if new_total_orders > 0 else 0
            
            # Update dates
            new_last_order_date = order_data.get('created_at') or last_date
            new_first_order_date = first_date  # Keep original first order date
            
            # Calculate return rate (state_code 46 = returned)
            cursor = conn.execute("""
                SELECT COUNT(*) FROM orders 
                WHERE receiver_phone = (SELECT phone FROM customers WHERE customer_id = ?)
                AND state_code = 46
            """, (customer_id,))
            returned_orders = cursor.fetchone()[0]
            new_return_rate = (returned_orders / new_total_orders * 100) if new_total_orders > 0 else 0
            
            # Calculate satisfaction score
            new_satisfaction_score = self._calculate_satisfaction_score(new_return_rate, new_total_orders, new_total_value)
            
            # Determine new segment
            new_segment = self._determine_customer_segment(new_total_orders, new_total_value, new_return_rate)
            
            # Update customer record
            conn.execute("""
                UPDATE customers SET
                    total_orders = ?, total_value = ?, avg_order_value = ?,
                    last_order_date = ?, return_rate = ?, satisfaction_score = ?,
                    customer_segment = ?, updated_at = CURRENT_TIMESTAMP
                WHERE customer_id = ?
            """, (
                new_total_orders, new_total_value, new_avg_order_value,
                new_last_order_date, new_return_rate, new_satisfaction_score,
                new_segment, customer_id
            ))
            
            return {
                'success': True,
                'orders_updated': new_total_orders,
                'value_updated': new_total_value,
                'segment_changed': new_segment != current_segment,
                'old_segment': current_segment,
                'new_segment': new_segment
            }
            
        except Exception as e:
            self.logger.error(f"Error updating customer profile {customer_id}: {e}")
            return {'success': False, 'error': str(e)}
    
    def _update_customer_addresses(self, conn, customer_id: int, order_data: Dict) -> Dict[str, Any]:
        """
        Update customer addresses with new order delivery information
        
        Args:
            conn: Database connection
            customer_id: Customer ID
            order_data: Order data with address information
            
        Returns:
            Address update results
        """
        try:
            # Safely handle None values by converting to empty string first
            city = (order_data.get('dropoff_city_name') or '').strip()
            zone = (order_data.get('dropoff_zone_name') or '').strip()
            district = (order_data.get('dropoff_district_name') or '').strip()
            address_line = (order_data.get('dropoff_first_line') or '').strip()
            
            if not any([city, zone, district, address_line]):
                return {'success': True, 'addresses_updated': 0}
            
            # Check if this address already exists
            cursor = conn.execute("""
                SELECT address_id FROM customer_addresses 
                WHERE customer_id = ? AND city = ? AND zone = ? AND district = ?
            """, (customer_id, city, zone, district))
            
            existing_address = cursor.fetchone()
            if existing_address:
                return {'success': True, 'addresses_updated': 0}
            
            # Check if customer has any addresses
            cursor = conn.execute("""
                SELECT COUNT(*) FROM customer_addresses WHERE customer_id = ?
            """, (customer_id,))
            address_count = cursor.fetchone()[0]
            
            # Insert new address
            is_primary = address_count == 0  # First address is primary
            
            conn.execute("""
                INSERT INTO customer_addresses (
                    customer_id, city, zone, district, address_line, 
                    is_primary, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            """, (customer_id, city, zone, district, address_line, is_primary))
            
            return {'success': True, 'addresses_updated': 1}
            
        except Exception as e:
            self.logger.error(f"Error updating customer addresses {customer_id}: {e}")
            return {'success': False, 'error': str(e)}
    
    def _update_customer_analytics_realtime(self, conn, customer_id: int) -> Dict[str, Any]:
        """
        Update customer analytics in real-time (event-driven)
        
        Args:
            conn: Database connection
            customer_id: Customer ID
            
        Returns:
            Analytics update results
        """
        try:
            # Get current customer data
            cursor = conn.execute("""
                SELECT customer_id, total_value, avg_order_value, total_orders,
                       return_rate, satisfaction_score, customer_segment,
                       first_order_date, last_order_date, phone
                FROM customers WHERE customer_id = ?
            """, (customer_id,))
            
            customer_data = cursor.fetchone()
            if not customer_data:
                return {'success': False, 'error': 'Customer not found'}
            
            (cust_id, total_value, avg_order_value, total_orders, return_rate, 
             satisfaction_score, customer_segment, first_order_date, last_order_date, phone) = customer_data
            
            # Calculate advanced metrics
            order_frequency = self._calculate_order_frequency(first_order_date, last_order_date, total_orders)
            churn_risk_score = self._calculate_churn_risk(return_rate, last_order_date, order_frequency)
            customer_health_score = self._calculate_customer_health(customer_segment, satisfaction_score, return_rate)
            next_purchase_prediction = self._predict_next_purchase(last_order_date, order_frequency)
            segment_recommendation = self._recommend_segment(total_orders, total_value, return_rate)
            
            # Update analytics table
            conn.execute("""
                INSERT OR REPLACE INTO customer_analytics (
                    customer_id, lifetime_value, avg_order_value, order_frequency,
                    return_rate, satisfaction_score, churn_risk_score, customer_health_score,
                    next_purchase_prediction, segment_recommendation, last_updated
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            """, (
                customer_id, total_value, avg_order_value, order_frequency,
                return_rate, satisfaction_score, churn_risk_score, customer_health_score,
                next_purchase_prediction, segment_recommendation
            ))
            
            # Check if segment should change
            segment_changed = segment_recommendation != customer_segment
            if segment_changed:
                conn.execute("""
                    UPDATE customers 
                    SET customer_segment = ?, updated_at = CURRENT_TIMESTAMP 
                    WHERE customer_id = ?
                """, (segment_recommendation, customer_id))
            
            return {
                'success': True,
                'analytics_updated': True,
                'segment_changed': segment_changed,
                'old_segment': customer_segment,
                'new_segment': segment_recommendation,
                'churn_risk_score': churn_risk_score,
                'customer_health_score': customer_health_score
            }
            
        except Exception as e:
            self.logger.error(f"Error updating customer analytics {customer_id}: {e}")
            return {'success': False, 'error': str(e)}
    
    # Helper methods for calculations
    
    def _determine_initial_segment(self, total_value: float, cod_value: float) -> str:
        """Determine initial customer segment based on first order"""
        if cod_value > 1000:
            return 'potential_vip'
        elif cod_value > 0:
            return 'new'
        else:
            return 'service_only'
    
    def _calculate_satisfaction_score(self, return_rate: float, total_orders: int, total_value: float) -> float:
        """Calculate customer satisfaction score"""
        base_score = 0.5
        
        # Adjust based on return rate
        if return_rate <= 5:
            return_adjustment = 0.3
        elif return_rate <= 15:
            return_adjustment = 0.1
        elif return_rate <= 30:
            return_adjustment = -0.1
        else:
            return_adjustment = -0.3
        
        # Adjust based on order history
        if total_orders >= 10:
            loyalty_adjustment = 0.2
        elif total_orders >= 5:
            loyalty_adjustment = 0.1
        else:
            loyalty_adjustment = 0
        
        # Adjust based on value
        if total_value >= 5000:
            value_adjustment = 0.1
        elif total_value >= 1000:
            value_adjustment = 0.05
        else:
            value_adjustment = 0
        
        final_score = base_score + return_adjustment + loyalty_adjustment + value_adjustment
        return max(0.0, min(1.0, final_score))  # Clamp between 0 and 1
    
    def _determine_customer_segment(self, total_orders: int, total_value: float, return_rate: float) -> str:
        """Determine customer segment based on metrics"""
        if return_rate > 30:
            return 'problematic'
        elif total_orders >= 10 and total_value >= 5000:
            return 'vip'
        elif total_orders >= 10 or total_value >= 2000:
            return 'regular'
        elif total_orders >= 3:
            return 'regular'
        else:
            return 'new'
    
    def _calculate_order_frequency(self, first_order_date: str, last_order_date: str, total_orders: int) -> float:
        """Calculate order frequency per month"""
        if not first_order_date or not last_order_date or total_orders <= 1:
            return 0.0
        
        try:
            first_date = datetime.fromisoformat(first_order_date.replace('Z', '+00:00'))
            last_date = datetime.fromisoformat(last_order_date.replace('Z', '+00:00'))
            
            days_diff = (last_date - first_date).days
            if days_diff <= 0:
                return total_orders  # All orders on same day
            
            months_diff = days_diff / 30.44  # Average days per month
            return total_orders / months_diff
            
        except (ValueError, TypeError):
            return 0.0
    
    def _calculate_churn_risk(self, return_rate: float, last_order_date: str, order_frequency: float) -> float:
        """Calculate churn risk score"""
        base_risk = 0.2
        
        # Risk based on return rate
        if return_rate > 30:
            return_risk = 0.6
        elif return_rate > 20:
            return_risk = 0.4
        elif return_rate > 10:
            return_risk = 0.2
        else:
            return_risk = 0.0
        
        # Risk based on last order recency
        if last_order_date:
            try:
                last_date = datetime.fromisoformat(last_order_date.replace('Z', '+00:00'))
                days_since_last = (datetime.now() - last_date).days
                
                if days_since_last > 180:
                    recency_risk = 0.5
                elif days_since_last > 90:
                    recency_risk = 0.3
                elif days_since_last > 30:
                    recency_risk = 0.1
                else:
                    recency_risk = 0.0
            except (ValueError, TypeError):
                recency_risk = 0.1
        else:
            recency_risk = 0.1
        
        # Risk based on order frequency
        if order_frequency < 0.5:  # Less than 0.5 orders per month
            frequency_risk = 0.3
        elif order_frequency < 1:
            frequency_risk = 0.1
        else:
            frequency_risk = 0.0
        
        final_risk = base_risk + return_risk + recency_risk + frequency_risk
        return max(0.0, min(1.0, final_risk))
    
    def _calculate_customer_health(self, segment: str, satisfaction_score: float, return_rate: float) -> float:
        """Calculate overall customer health score"""
        # Base score by segment
        segment_scores = {
            'vip': 0.9,
            'regular': 0.7,
            'new': 0.5,
            'potential_vip': 0.6,
            'service_only': 0.4,
            'problematic': 0.2
        }
        
        base_score = segment_scores.get(segment, 0.5)
        
        # Adjust by satisfaction
        satisfaction_adjustment = (satisfaction_score - 0.5) * 0.4
        
        # Adjust by return rate
        if return_rate <= 5:
            return_adjustment = 0.1
        elif return_rate <= 15:
            return_adjustment = 0.0
        elif return_rate <= 30:
            return_adjustment = -0.2
        else:
            return_adjustment = -0.4
        
        final_health = base_score + satisfaction_adjustment + return_adjustment
        return max(0.0, min(1.0, final_health))
    
    def _predict_next_purchase(self, last_order_date: str, order_frequency: float) -> Optional[str]:
        """Predict next purchase date"""
        if not last_order_date or order_frequency <= 0:
            return None
        
        try:
            last_date = datetime.fromisoformat(last_order_date.replace('Z', '+00:00'))
            days_between_orders = 30.44 / order_frequency if order_frequency > 0 else 90
            
            next_purchase_date = last_date + timedelta(days=int(days_between_orders))
            return next_purchase_date.date().isoformat()
            
        except (ValueError, TypeError):
            return None
    
    def _recommend_segment(self, total_orders: int, total_value: float, return_rate: float) -> str:
        """Recommend customer segment based on current metrics"""
        return self._determine_customer_segment(total_orders, total_value, return_rate)
    
    def get_customer_realtime_analytics(self, customer_phone: str) -> Dict[str, Any]:
        """
        Get real-time analytics for a specific customer
        
        Args:
            customer_phone: Customer phone number
            
        Returns:
            Customer analytics data
        """
        try:
            normalized_phone = normalize_phone(customer_phone)
            
            with get_db() as conn:
                # Get customer with analytics
                cursor = conn.execute("""
                    SELECT 
                        c.customer_id, c.phone, c.full_name, c.customer_segment,
                        c.total_orders, c.total_value, c.avg_order_value,
                        c.return_rate, c.satisfaction_score,
                        c.first_order_date, c.last_order_date,
                        ca.lifetime_value, ca.order_frequency, ca.churn_risk_score,
                        ca.customer_health_score, ca.next_purchase_prediction,
                        ca.segment_recommendation, ca.last_updated
                    FROM customers c
                    LEFT JOIN customer_analytics ca ON c.customer_id = ca.customer_id
                    WHERE c.phone = ? OR c.phone = ?
                """, (customer_phone, normalized_phone))
                
                customer_data = cursor.fetchone()
                if not customer_data:
                    return {'success': False, 'error': 'Customer not found'}
                
                # Format response
                column_names = [
                    'customer_id', 'phone', 'full_name', 'customer_segment',
                    'total_orders', 'total_value', 'avg_order_value',
                    'return_rate', 'satisfaction_score',
                    'first_order_date', 'last_order_date',
                    'lifetime_value', 'order_frequency', 'churn_risk_score',
                    'customer_health_score', 'next_purchase_prediction',
                    'segment_recommendation', 'analytics_last_updated'
                ]
                
                result = dict(zip(column_names, customer_data))
                result['success'] = True
                
                return result
                
        except Exception as e:
            self.logger.error(f"Error getting customer analytics for {customer_phone}: {e}")
            return {'success': False, 'error': str(e)}

    def merge_duplicate_customers(self, conn, primary_customer_id: int, duplicate_customer_ids: List[int]) -> Dict[str, Any]:
        """
        Merge duplicate customers into a primary customer record
        
        Args:
            conn: Database connection
            primary_customer_id: The customer to keep
            duplicate_customer_ids: List of customer IDs to merge into primary
            
        Returns:
            Merge results
        """
        try:
            merged_count = 0
            
            for duplicate_id in duplicate_customer_ids:
                if duplicate_id == primary_customer_id:
                    continue
                
                # Get duplicate customer data
                cursor = conn.execute("""
                    SELECT phone, first_name, last_name, full_name, 
                           total_orders, total_value, first_order_date, last_order_date
                    FROM customers WHERE customer_id = ?
                """, (duplicate_id,))
                
                duplicate_data = cursor.fetchone()
                if not duplicate_data:
                    continue
                
                dup_phone, dup_first, dup_last, dup_full, dup_orders, dup_value, dup_first_date, dup_last_date = duplicate_data
                
                # Update orders to point to primary customer
                conn.execute("""
                    UPDATE orders SET receiver_phone = (
                        SELECT phone FROM customers WHERE customer_id = ?
                    ) WHERE receiver_phone = ?
                """, (primary_customer_id, dup_phone))
                
                # Merge addresses
                cursor = conn.execute("""
                    SELECT city, zone, district, address_line 
                    FROM customer_addresses WHERE customer_id = ?
                """, (duplicate_id,))
                
                duplicate_addresses = cursor.fetchall()
                for addr in duplicate_addresses:
                    # Check if address already exists for primary customer
                    cursor = conn.execute("""
                        SELECT address_id FROM customer_addresses 
                        WHERE customer_id = ? AND city = ? AND zone = ? AND district = ?
                    """, (primary_customer_id, addr[0], addr[1], addr[2]))
                    
                    if not cursor.fetchone():
                        # Add unique address to primary customer
                        conn.execute("""
                            INSERT INTO customer_addresses (customer_id, city, zone, district, address_line, created_at)
                            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                        """, (primary_customer_id, addr[0], addr[1], addr[2], addr[3]))
                
                # Merge customer interactions
                conn.execute("""
                    UPDATE customer_interactions 
                    SET customer_id = ? 
                    WHERE customer_id = ?
                """, (primary_customer_id, duplicate_id))
                
                # Merge service queue entries
                conn.execute("""
                    UPDATE customer_service_queue 
                    SET customer_id = ? 
                    WHERE customer_id = ?
                """, (primary_customer_id, duplicate_id))
                
                # Update primary customer metrics
                cursor = conn.execute("""
                    SELECT total_orders, total_value, first_order_date, last_order_date
                    FROM customers WHERE customer_id = ?
                """, (primary_customer_id,))
                
                primary_data = cursor.fetchone()
                if primary_data:
                    prim_orders, prim_value, prim_first_date, prim_last_date = primary_data
                    
                    # Merge metrics
                    new_total_orders = prim_orders + dup_orders
                    new_total_value = prim_value + dup_value
                    new_avg_value = new_total_value / new_total_orders if new_total_orders > 0 else 0
                    
                    # Merge dates (earliest first, latest last)
                    new_first_date = min(prim_first_date, dup_first_date) if prim_first_date and dup_first_date else (prim_first_date or dup_first_date)
                    new_last_date = max(prim_last_date, dup_last_date) if prim_last_date and dup_last_date else (prim_last_date or dup_last_date)
                    
                    # Update primary customer
                    conn.execute("""
                        UPDATE customers SET
                            total_orders = ?, total_value = ?, avg_order_value = ?,
                            first_order_date = ?, last_order_date = ?,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE customer_id = ?
                    """, (new_total_orders, new_total_value, new_avg_value,
                          new_first_date, new_last_date, primary_customer_id))
                
                # Delete duplicate customer record
                conn.execute("DELETE FROM customer_analytics WHERE customer_id = ?", (duplicate_id,))
                conn.execute("DELETE FROM customer_addresses WHERE customer_id = ?", (duplicate_id,))
                conn.execute("DELETE FROM customers WHERE customer_id = ?", (duplicate_id,))
                
                merged_count += 1
                self.logger.info(f"Merged customer {duplicate_id} into {primary_customer_id}")
            
            # Recalculate analytics for primary customer
            if merged_count > 0:
                self._update_customer_analytics_realtime(conn, primary_customer_id)
            
            return {
                'success': True,
                'merged_count': merged_count,
                'primary_customer_id': primary_customer_id
            }
            
        except Exception as e:
            self.logger.error(f"Error merging customers: {e}")
            return {'success': False, 'error': str(e)}
    
    def find_and_merge_duplicates(self, conn, similarity_threshold: float = 0.8) -> Dict[str, Any]:
        """
        Find and automatically merge duplicate customers
        
        Args:
            conn: Database connection
            similarity_threshold: Minimum similarity score for auto-merge
            
        Returns:
            Merge operation results
        """
        try:
            # Get all customers for duplicate detection
            cursor = conn.execute("""
                SELECT customer_id, phone, full_name, first_name, last_name, primary_city
                FROM customers ORDER BY customer_id
            """)
            
            customers = cursor.fetchall()
            duplicates_found = []
            processed_ids = set()
            
            for i, customer in enumerate(customers):
                if customer[0] in processed_ids:
                    continue
                
                customer_id, phone, full_name, first_name, last_name, city = customer
                potential_duplicates = []
                
                # Check against remaining customers
                for j in range(i + 1, len(customers)):
                    other_customer = customers[j]
                    other_id, other_phone, other_full_name, other_first_name, other_last_name, other_city = other_customer
                    
                    if other_id in processed_ids:
                        continue
                    
                    # Calculate similarity score
                    similarity_score = self._calculate_customer_similarity(
                        (phone, full_name, first_name, last_name, city),
                        (other_phone, other_full_name, other_first_name, other_last_name, other_city)
                    )
                    
                    if similarity_score >= similarity_threshold:
                        potential_duplicates.append({
                            'customer_id': other_id,
                            'similarity_score': similarity_score
                        })
                        processed_ids.add(other_id)
                
                if potential_duplicates:
                    duplicates_found.append({
                        'primary_customer_id': customer_id,
                        'duplicates': potential_duplicates
                    })
                    processed_ids.add(customer_id)
            
            # Auto-merge high confidence duplicates
            merged_groups = 0
            total_merged = 0
            
            for duplicate_group in duplicates_found:
                primary_id = duplicate_group['primary_customer_id']
                duplicate_ids = [d['customer_id'] for d in duplicate_group['duplicates'] 
                               if d['similarity_score'] >= 0.9]  # High confidence threshold
                
                if duplicate_ids:
                    merge_result = self.merge_duplicate_customers(conn, primary_id, duplicate_ids)
                    if merge_result['success']:
                        merged_groups += 1
                        total_merged += merge_result['merged_count']
            
            return {
                'success': True,
                'duplicate_groups_found': len(duplicates_found),
                'merged_groups': merged_groups,
                'total_customers_merged': total_merged,
                'manual_review_needed': len(duplicates_found) - merged_groups
            }
            
        except Exception as e:
            self.logger.error(f"Error in duplicate detection and merge: {e}")
            return {'success': False, 'error': str(e)}
    
    def _calculate_customer_similarity(self, customer1: tuple, customer2: tuple) -> float:
        """
        Calculate similarity score between two customers
        
        Args:
            customer1: (phone, full_name, first_name, last_name, city)
            customer2: (phone, full_name, first_name, last_name, city)
            
        Returns:
            Similarity score between 0 and 1
        """
        phone1, full_name1, first_name1, last_name1, city1 = customer1
        phone2, full_name2, first_name2, last_name2, city2 = customer2
        
        # Normalize for comparison
        phone1_norm = normalize_phone(phone1 or '')
        phone2_norm = normalize_phone(phone2 or '')
        
        full_name1_norm = (full_name1 or '').lower().strip()
        full_name2_norm = (full_name2 or '').lower().strip()
        
        first_name1_norm = (first_name1 or '').lower().strip()
        first_name2_norm = (first_name2 or '').lower().strip()
        
        last_name1_norm = (last_name1 or '').lower().strip()
        last_name2_norm = (last_name2 or '').lower().strip()
        
        city1_norm = (city1 or '').lower().strip()
        city2_norm = (city2 or '').lower().strip()
        
        similarity_score = 0.0
        
        # Phone similarity (high weight)
        if phone1_norm and phone2_norm:
            if phone1_norm == phone2_norm:
                similarity_score += 0.4
            elif phone1_norm in phone2_norm or phone2_norm in phone1_norm:
                similarity_score += 0.3
        
        # Name similarity
        if full_name1_norm and full_name2_norm:
            if full_name1_norm == full_name2_norm:
                similarity_score += 0.3
            elif self._string_similarity(full_name1_norm, full_name2_norm) > 0.8:
                similarity_score += 0.2
        
        # First/Last name similarity
        if first_name1_norm and first_name2_norm and first_name1_norm == first_name2_norm:
            similarity_score += 0.15
        
        if last_name1_norm and last_name2_norm and last_name1_norm == last_name2_norm:
            similarity_score += 0.15
        
        # City similarity
        if city1_norm and city2_norm and city1_norm == city2_norm:
            similarity_score += 0.1
        
        return min(1.0, similarity_score)
    
    def _string_similarity(self, str1: str, str2: str) -> float:
        """
        Calculate string similarity using simple character overlap
        """
        if not str1 or not str2:
            return 0.0
        
        if str1 == str2:
            return 1.0
        
        # Simple character-based similarity
        set1 = set(str1.lower())
        set2 = set(str2.lower())
        
        intersection = len(set1.intersection(set2))
        union = len(set1.union(set2))
        
        return intersection / union if union > 0 else 0.0
    


    def configure_merge_behavior(self, prevent_merge_for_same_phones: bool = None, max_duplicate_phones: int = None, allow_merge_above_limit: bool = None):
        """
        Configure merge behavior dynamically
        
        Args:
            prevent_merge_for_same_phones: Whether to prevent merging when phone numbers are the same after normalization
            max_duplicate_phones: Maximum number of duplicate phone numbers before skipping merge
            allow_merge_above_limit: Whether to allow merge when above the duplicate limit (e.g., +20 means merge if >20)
        """
        if prevent_merge_for_same_phones is not None:
            self.prevent_merge_for_same_phones = prevent_merge_for_same_phones
            self.logger.info(f"Updated prevent_merge_for_same_phones to: {prevent_merge_for_same_phones}")
        
        if max_duplicate_phones is not None:
            self.max_duplicate_phones = max_duplicate_phones
            self.logger.info(f"Updated max_duplicate_phones to: {max_duplicate_phones}")
        
        if allow_merge_above_limit is not None:
            self.allow_merge_above_limit = allow_merge_above_limit
            self.logger.info(f"Updated allow_merge_above_limit to: {allow_merge_above_limit}")
    
    def get_merge_configuration(self) -> Dict[str, Any]:
        """
        Get current merge configuration
        
        Returns:
            Current merge configuration
        """
        return {
            'prevent_merge_for_same_phones': self.prevent_merge_for_same_phones,
            'max_duplicate_phones': self.max_duplicate_phones,
            'allow_merge_above_limit': self.allow_merge_above_limit
        }

# Create global instance
customer_profile_manager = CustomerProfileManager(
    prevent_merge_for_same_phones=True,
    max_duplicate_phones=20,
    allow_merge_above_limit=False
) 