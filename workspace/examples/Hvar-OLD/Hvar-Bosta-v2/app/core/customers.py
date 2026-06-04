"""
Core Customers Module - Unified Customer Management
Combines customer profile management, analytics, and segmentation
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from decimal import Decimal

from app.utils.db_utils import get_db
from app.utils.phone_utils import normalize_phone

logger = logging.getLogger(__name__)

class Customers:
    """Unified customer management and analytics"""
    
    def __init__(self):
        self.segments = {
            'new': {'min_orders': 1, 'min_value': 0, 'max_return_rate': 100},
            'regular': {'min_orders': 3, 'min_value': 0, 'max_return_rate': 30},
            'vip': {'min_orders': 10, 'min_value': 5000, 'max_return_rate': 20},
            'problematic': {'min_orders': 0, 'min_value': 0, 'max_return_rate': 100}
        }
    
    def create_or_update(self, order_data: Dict) -> Dict[str, Any]:
        """Create or update customer from order data"""
        try:
            phone = normalize_phone(order_data.get('receiver_phone'))
            if not phone:
                return {'success': False, 'error': 'Invalid phone number'}
            
            with get_db() as conn:
                # Check if customer exists
                cursor = conn.execute("SELECT customer_id FROM customers WHERE phone = ?", (phone,))
                existing = cursor.fetchone()
                
                if existing:
                    return self._update(conn, existing[0], order_data)
                else:
                    return self._create(conn, order_data, phone)
        except Exception as e:
            logger.error(f"Error creating/updating customer: {e}")
            return {'success': False, 'error': str(e)}
    
    def _create(self, conn, order_data: Dict, phone: str) -> Dict[str, Any]:
        """Create new customer"""
        try:
            cursor = conn.execute("""
                INSERT INTO customers (
                    phone, first_name, last_name, full_name, primary_city,
                    primary_zone, primary_district, primary_address,
                    total_orders, total_value, first_order_date, last_order_date,
                    customer_segment, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            """, (
                phone,
                order_data.get('receiver_first_name'),
                order_data.get('receiver_last_name'),
                order_data.get('receiver_name'),
                order_data.get('dropoff_city_name'),
                order_data.get('dropoff_zone_name'),
                order_data.get('dropoff_district_name'),
                order_data.get('dropoff_first_line'),
                1,  # total_orders
                float(order_data.get('cod', 0)),  # total_value
                order_data.get('created_at'),  # first_order_date
                order_data.get('created_at'),  # last_order_date
                'new'  # customer_segment
            ))
            
            customer_id = cursor.lastrowid
            
            # Create address record
            self._create_address(conn, customer_id, order_data)
            
            conn.commit()
            return {
                'success': True,
                'customer_id': customer_id,
                'action': 'created',
                'segment': 'new'
            }
        except Exception as e:
            logger.error(f"Error creating customer: {e}")
            return {'success': False, 'error': str(e)}
    
    def _update(self, conn, customer_id: int, order_data: Dict) -> Dict[str, Any]:
        """Update existing customer"""
        try:
            # Get current customer data
            cursor = conn.execute("""
                SELECT total_orders, total_value, first_order_date, last_order_date
                FROM customers WHERE customer_id = ?
            """, (customer_id,))
            current = cursor.fetchone()
            
            if not current:
                return {'success': False, 'error': 'Customer not found'}
            
            # Update values
            new_total_orders = current[0] + 1
            new_total_value = current[1] + float(order_data.get('cod', 0))
            new_last_order_date = order_data.get('created_at')
            
            # Determine segment
            segment = self._determine_segment(new_total_orders, new_total_value, 0)  # TODO: calculate return rate
            
            cursor = conn.execute("""
                UPDATE customers SET
                    total_orders = ?, total_value = ?, last_order_date = ?,
                    customer_segment = ?, avg_order_value = ?, updated_at = CURRENT_TIMESTAMP
                WHERE customer_id = ?
            """, (
                new_total_orders, new_total_value, new_last_order_date,
                segment, new_total_value / new_total_orders, customer_id
            ))
            
            # Update analytics
            self._update_analytics(conn, customer_id)
            
            conn.commit()
            return {
                'success': True,
                'customer_id': customer_id,
                'action': 'updated',
                'segment': segment
            }
        except Exception as e:
            logger.error(f"Error updating customer: {e}")
            return {'success': False, 'error': str(e)}
    
    def _create_address(self, conn, customer_id: int, order_data: Dict):
        """Create customer address record"""
        try:
            conn.execute("""
                INSERT INTO customer_addresses (
                    customer_id, city, zone, district, address_line, is_primary
                ) VALUES (?, ?, ?, ?, ?, 1)
            """, (
                customer_id,
                order_data.get('dropoff_city_name'),
                order_data.get('dropoff_zone_name'),
                order_data.get('dropoff_district_name'),
                order_data.get('dropoff_first_line')
            ))
        except Exception as e:
            logger.error(f"Error creating address: {e}")
    
    def _determine_segment(self, total_orders: int, total_value: float, return_rate: float) -> str:
        """Determine customer segment"""
        for segment, criteria in self.segments.items():
            if (total_orders >= criteria['min_orders'] and
                total_value >= criteria['min_value'] and
                return_rate <= criteria['max_return_rate']):
                return segment
        return 'new'
    
    def _update_analytics(self, conn, customer_id: int):
        """Update customer analytics"""
        try:
            # Get customer data
            cursor = conn.execute("""
                SELECT total_orders, total_value, first_order_date, last_order_date
                FROM customers WHERE customer_id = ?
            """, (customer_id,))
            customer = cursor.fetchone()
            
            if not customer:
                return
            
            total_orders, total_value, first_date, last_date = customer
            
            # Calculate analytics
            avg_order_value = total_value / total_orders if total_orders > 0 else 0
            order_frequency = self._calculate_frequency(first_date, last_date, total_orders)
            satisfaction_score = self._calculate_satisfaction(0, total_orders, total_value)  # TODO: return rate
            churn_risk = self._calculate_churn_risk(0, last_date, order_frequency)  # TODO: return rate
            health_score = self._calculate_health('new', satisfaction_score, 0)  # TODO: segment, return rate
            
            # Update analytics
            conn.execute("""
                INSERT OR REPLACE INTO customer_analytics (
                    customer_id, lifetime_value, avg_order_value, order_frequency,
                    satisfaction_score, churn_risk_score, customer_health_score,
                    last_updated
                ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            """, (
                customer_id, total_value, avg_order_value, order_frequency,
                satisfaction_score, churn_risk, health_score
            ))
        except Exception as e:
            logger.error(f"Error updating analytics: {e}")
    
    def _calculate_frequency(self, first_date: str, last_date: str, total_orders: int) -> float:
        """Calculate order frequency"""
        if total_orders <= 1:
            return 0.0
        
        try:
            first = datetime.fromisoformat(first_date)
            last = datetime.fromisoformat(last_date)
            days = (last - first).days
            return total_orders / max(days, 1) * 30  # orders per month
        except:
            return 0.0
    
    def _calculate_satisfaction(self, return_rate: float, total_orders: int, total_value: float) -> float:
        """Calculate satisfaction score (1-5 scale)"""
        if total_orders == 0:
            return 3.0
        
        # Base score from return rate
        base_score = 5.0 - (return_rate / 20.0)  # 0% return = 5.0, 100% return = 0.0
        
        # Bonus for high value customers
        value_bonus = min(total_value / 10000.0, 1.0)  # Max 1.0 bonus
        
        # Bonus for frequent customers
        frequency_bonus = min(total_orders / 20.0, 1.0)  # Max 1.0 bonus
        
        final_score = base_score + value_bonus + frequency_bonus
        return max(1.0, min(5.0, final_score))  # Clamp between 1-5
    
    def _calculate_churn_risk(self, return_rate: float, last_order_date: str, order_frequency: float) -> float:
        """Calculate churn risk (0-1 scale)"""
        try:
            last_order = datetime.fromisoformat(last_order_date)
            days_since_last = (datetime.now() - last_order).days
            
            # Risk factors
            time_risk = min(days_since_last / 365.0, 1.0)  # Higher risk if no recent orders
            return_risk = return_rate / 100.0  # Higher risk if high return rate
            frequency_risk = max(0, (1.0 - order_frequency / 2.0))  # Higher risk if low frequency
            
            # Weighted average
            total_risk = (time_risk * 0.4 + return_risk * 0.4 + frequency_risk * 0.2)
            return min(1.0, max(0.0, total_risk))
        except:
            return 0.5
    
    def _calculate_health(self, segment: str, satisfaction: float, return_rate: float) -> float:
        """Calculate customer health score (0-1 scale)"""
        # Base health from satisfaction
        base_health = satisfaction / 5.0
        
        # Segment multiplier
        segment_multipliers = {
            'vip': 1.2,
            'regular': 1.0,
            'new': 0.9,
            'problematic': 0.6
        }
        multiplier = segment_multipliers.get(segment, 1.0)
        
        # Return rate penalty
        return_penalty = return_rate / 100.0
        
        health = (base_health * multiplier) - return_penalty
        return max(0.0, min(1.0, health))
    
    def get(self, phone: str) -> Dict[str, Any]:
        """Get customer by phone"""
        try:
            with get_db() as conn:
                cursor = conn.execute("""
                    SELECT c.*, ca.* FROM customers c
                    LEFT JOIN customer_analytics ca ON c.customer_id = ca.customer_id
                    WHERE c.phone = ?
                """, (phone,))
                customer = cursor.fetchone()
                
                if customer:
                    return {
                        'success': True,
                        'customer': dict(customer)
                    }
                return {'success': False, 'error': 'Customer not found'}
        except Exception as e:
            logger.error(f"Error getting customer: {e}")
            return {'success': False, 'error': str(e)}
    
    def list(self, segment: str = None, limit: int = 50) -> Dict[str, Any]:
        """List customers with optional filtering"""
        try:
            with get_db() as conn:
                query = "SELECT * FROM customers"
                params = []
                
                if segment:
                    query += " WHERE customer_segment = ?"
                    params.append(segment)
                
                query += " ORDER BY total_value DESC LIMIT ?"
                params.append(limit)
                
                cursor = conn.execute(query, params)
                customers = [dict(row) for row in cursor.fetchall()]
                
                return {
                    'success': True,
                    'customers': customers,
                    'count': len(customers)
                }
        except Exception as e:
            logger.error(f"Error listing customers: {e}")
            return {'success': False, 'error': str(e)}

# Global instance
customers = Customers() 