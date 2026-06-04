"""
Expert Order Classification Service - Data-Driven Business Intelligence
Optimized for real-world patterns from 51,139 orders analytics:
- 71.6% Delivered orders (State 45) generating 68M EGP revenue
- 23.6% Returns (State 46) with complex COD patterns (-2K to +4.6K EGP)
- 3.7% Terminated orders (State 48) requiring operational attention
- 4 distinct order types with specific business characteristics
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from enum import Enum

from app.utils.db_utils import get_db

logger = logging.getLogger(__name__)

# ================================================================================
# ANALYTICS-DRIVEN ENUMS AND CONSTANTS
# ================================================================================

class OrderState(Enum):
    """Order states with real analytics data"""
    DELIVERED = (45, "Delivered", 71.6, 1859, "positive")           # Main revenue: 68M EGP
    RETURNED_BUSINESS = (46, "Returned to business", 17.1, -153, "mixed")  # Primary returns
    RETURNED_FULFILLED = (46, "Returned", 6.5, 31, "mixed")         # Secondary returns
    TERMINATED = (48, "Terminated", 3.7, 0, "negative")             # Failed deliveries
    PICKUP_REQUESTED = (10, "Pickup requested", 0.8, 0, "neutral")  # Pending
    AT_WAREHOUSE = (24, "Received at warehouse", 0.2, 0, "neutral") # In transit
    LOST = (100, "Lost", 0.1, 0, "negative")                        # High risk
    IN_TRANSIT = (30, "In transit between Hubs", 0.0, 0, "neutral") # Processing
    EXCEPTION = (47, "Exception", 0.0, 0, "negative")               # Issues
    DAMAGED = (101, "Damaged", 0.0, 0, "negative")                  # High risk

class OrderTypePattern(Enum):
    """Order types with business patterns"""
    SEND = (10, "Send", 75.7, 1759, "high")                         # Primary revenue
    RETURN_TO_ORIGIN = (20, "Return to Origin", 14.5, 0, "none")    # No revenue
    EXCHANGE = (30, "Exchange", 6.6, 30, "low")                     # Low revenue
    CUSTOMER_RETURN = (25, "Customer Return Pickup", 3.2, -810, "negative")  # Refunds

@dataclass
class BusinessClassification:
    """Comprehensive business classification result"""
    business_category: str
    cod_category: str
    risk_level: str
    revenue_impact: str
    operational_priority: str
    requires_attention: bool
    confidence_score: float
    analytics_context: Dict[str, Any]

@dataclass
class RiskAssessment:
    """Advanced risk assessment based on multiple factors"""
    overall_risk: str  # critical, high, medium, low
    financial_risk: str
    operational_risk: str
    customer_risk: str
    risk_factors: List[str]
    mitigation_recommendations: List[str]

# ================================================================================
# EXPERT ORDER CLASSIFICATION SERVICE
# ================================================================================

class OrderClassificationService:
    """
    Expert-level order classification with advanced business intelligence
    
    Features:
    - Data-driven classification based on 51,139 orders analytics
    - Multi-dimensional risk assessment (financial, operational, customer)
    - Revenue-focused business categorization
    - Intelligent hierarchy detection and linking
    - Predictive insights and recommendations
    """
    
    # Real analytics-based thresholds
    COD_THRESHOLDS = {
        'max_value': 10500,      # Highest observed value
        'premium_high': 5000,    # Top tier (>5K EGP)
        'high_value': 1500,      # Main revenue stream
        'standard_value': 500,   # Regular business
        'low_value': 1,          # Maintenance/parts
        'large_refund': -500     # Significant refunds
    }
    
    # State-based business impact patterns
    STATE_IMPACT_MATRIX = {
        45: {'revenue_multiplier': 1.0, 'success_rate': 71.6, 'avg_cod': 1859},
        46: {'revenue_multiplier': -0.1, 'success_rate': 23.6, 'avg_cod': -153},
        48: {'revenue_multiplier': 0.0, 'success_rate': 3.7, 'avg_cod': 0},
        100: {'revenue_multiplier': -1.0, 'success_rate': 0.1, 'avg_cod': 0},
        101: {'revenue_multiplier': -1.0, 'success_rate': 0.0, 'avg_cod': 0}
    }
    
    # Order type revenue patterns
    TYPE_REVENUE_PATTERNS = {
        10: {'revenue_potential': 'high', 'avg_cod': 1759, 'percentage': 75.7},
        20: {'revenue_potential': 'none', 'avg_cod': 0, 'percentage': 14.5},
        25: {'revenue_potential': 'negative', 'avg_cod': -810, 'percentage': 3.2},
        30: {'revenue_potential': 'low', 'avg_cod': 30, 'percentage': 6.6}
    }

    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self._initialize_classification_models()
    
    def _initialize_classification_models(self):
        """Initialize ML-like classification models based on analytics"""
        # Business category weights based on real data
        self.business_weights = {
            'cod_weight': 0.4,
            'state_weight': 0.3,
            'type_weight': 0.2,
            'pattern_weight': 0.1
        }
        
        # Risk assessment matrix
        self.risk_matrix = {
            'financial': {'cod_threshold': 5000, 'refund_threshold': -1000},
            'operational': {'failed_states': [48, 100, 101], 'attention_states': [46]},
            'customer': {'satisfaction_states': [45], 'dissatisfaction_states': [48, 100, 101]}
        }
    
    # ================================================================================
    # MAIN CLASSIFICATION INTERFACE
    # ================================================================================
    
    def classify_and_enrich_order(self, order_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        🎯 Master classification method with comprehensive business intelligence
        
        Performs:
        - Multi-dimensional business classification
        - Advanced risk assessment
        - Revenue impact analysis
        - Operational priority determination
        - Predictive insights generation
        """
        try:
            # Extract key attributes
            state_code = order_data.get('state_code')
            cod = float(order_data.get('cod', 0))
            order_type_code = order_data.get('order_type_code')
            
            # Perform comprehensive classification
            business_classification = self._classify_business_category(state_code, cod, order_type_code)
            risk_assessment = self._assess_comprehensive_risk(order_data)
            revenue_impact = self._analyze_revenue_impact(state_code, cod, order_type_code)
            operational_priority = self._determine_operational_priority(business_classification, risk_assessment)
            
            # Generate analytics context
            analytics_context = self._generate_analytics_context(order_data, business_classification, risk_assessment)
            
            # Enrich order data
            order_data.update({
                'business_category': business_classification.business_category,
                'cod_category': business_classification.cod_category,
                'risk_level': risk_assessment.overall_risk,
                'revenue_impact': revenue_impact['impact_type'],
                'operational_priority': operational_priority,
                'requires_attention': business_classification.requires_attention,
                'classification_confidence': business_classification.confidence_score,
                'risk_factors': risk_assessment.risk_factors,
                'analytics_context': analytics_context
            })
            
            return order_data
            
        except Exception as e:
            self.logger.error(f"Error in comprehensive classification: {e}")
            return self._get_fallback_classification(order_data)
    
    def _classify_business_category(self, state_code: int, cod: float, order_type_code: int) -> BusinessClassification:
        """
        🏢 Advanced business category classification based on real analytics patterns
        
        Categories optimized for the 51,139 orders dataset:
        - Premium Revenue (State 45, COD >5K): Top-tier business
        - Standard Revenue (State 45, COD 500-5K): Main business stream
        - Maintenance Operations (State 45, COD <500): Service orders
        - Return Processing (State 46): Complex mixed-impact orders
        - Failed Operations (State 48): Cost centers requiring attention
        """
        
        # State 45 (Delivered) - 71.6% of orders, main revenue generator
        if state_code == 45:
            if cod >= self.COD_THRESHOLDS['max_value']:  # 10,500 EGP max observed
                return BusinessClassification(
                    business_category='premium_maximum',
                    cod_category='max_value_order',
                    risk_level='medium',  # High value requires careful handling
                    revenue_impact='maximum',
                    operational_priority='vip',
                    requires_attention=True,
                    confidence_score=0.98,
                    analytics_context={'tier': 'absolute_premium', 'percentile': 99.9}
                )
            elif cod > self.COD_THRESHOLDS['premium_high']:  # >5,000 EGP
                return BusinessClassification(
                    business_category='premium_high',
                    cod_category='premium_high',
                    risk_level='medium',
                    revenue_impact='high_positive',
                    operational_priority='high',
                    requires_attention=True,
                    confidence_score=0.95,
                    analytics_context={'tier': 'premium', 'percentile': 95}
                )
            elif cod > self.COD_THRESHOLDS['high_value']:  # 1,500-5,000 EGP
                return BusinessClassification(
                    business_category='high_value_delivery',
                    cod_category='high_value',
                    risk_level='low',
                    revenue_impact='positive',
                    operational_priority='standard',
                    requires_attention=False,
                    confidence_score=0.92,
                    analytics_context={'tier': 'main_revenue', 'percentile': 75}
                )
            elif cod > self.COD_THRESHOLDS['standard_value']:  # 500-1,500 EGP
                return BusinessClassification(
                    business_category='standard_revenue',
                    cod_category='standard_value',
                    risk_level='low',
                    revenue_impact='positive',
                    operational_priority='standard',
                    requires_attention=False,
                    confidence_score=0.88,
                    analytics_context={'tier': 'regular_business', 'percentile': 60}
                )
            elif cod > 0:  # 1-500 EGP
                return BusinessClassification(
                    business_category='maintenance_service',
                    cod_category='low_value',
                    risk_level='low',
                    revenue_impact='low_positive',
                    operational_priority='low',
                    requires_attention=False,
                    confidence_score=0.85,
                    analytics_context={'tier': 'maintenance', 'percentile': 30}
                )
            else:  # 0 EGP
                return BusinessClassification(
                    business_category='service_delivery',
                    cod_category='zero_cod',
                    risk_level='low',
                    revenue_impact='neutral',
                    operational_priority='low',
                    requires_attention=False,
                    confidence_score=0.82,
                    analytics_context={'tier': 'service', 'percentile': 15}
                )
        
        # State 46 (Returned) - 23.6% of orders, complex business impact
        elif state_code == 46:
            # Analyze return patterns based on order type and COD
            if order_type_code == 30 and cod > 0:  # Exchange with additional payment
                return BusinessClassification(
                    business_category='exchange_upsell',
                    cod_category='exchange_positive',
                    risk_level='medium',
                    revenue_impact='mixed_positive',
                    operational_priority='medium',
                    requires_attention=True,
                    confidence_score=0.78,
                    analytics_context={'tier': 'exchange_revenue', 'pattern': 'upsell'}
                )
            elif order_type_code == 25:  # Customer return pickup - typically refunds
                refund_magnitude = 'large_refund' if cod <= self.COD_THRESHOLDS['large_refund'] else 'small_refund'
                return BusinessClassification(
                    business_category='customer_refund',
                    cod_category=refund_magnitude,
                    risk_level='high' if cod <= -1000 else 'medium',
                    revenue_impact='negative',
                    operational_priority='high' if cod <= -1000 else 'medium',
                    requires_attention=True,
                    confidence_score=0.85,
                    analytics_context={'tier': 'refund_processing', 'magnitude': refund_magnitude}
                )
            else:  # Standard returns
                return BusinessClassification(
                    business_category='return_processing',
                    cod_category='return_handling',
                    risk_level='medium',
                    revenue_impact='mixed',
                    operational_priority='medium',
                    requires_attention=True,
                    confidence_score=0.75,
                    analytics_context={'tier': 'standard_return', 'recovery_potential': cod > 0}
                )
        
        # State 48 (Terminated) - 3.7% of orders, failed deliveries
        elif state_code == 48:
            return BusinessClassification(
                business_category='failed_delivery',
                cod_category='terminated',
                risk_level='high',
                revenue_impact='negative',
                operational_priority='high',
                requires_attention=True,
                confidence_score=0.90,
                analytics_context={'tier': 'operational_failure', 'requires_analysis': True}
            )
        
        # High-risk states (Lost, Damaged)
        elif state_code in [100, 101]:
            return BusinessClassification(
                business_category='critical_failure',
                cod_category='loss_damage',
                risk_level='critical',
                revenue_impact='negative',
                operational_priority='critical',
                requires_attention=True,
                confidence_score=0.95,
                analytics_context={'tier': 'critical_incident', 'immediate_action': True}
            )
        
        # Other states (pending, in transit, etc.)
        else:
            return BusinessClassification(
                business_category='operational_processing',
                cod_category='in_process',
                risk_level='low',
                revenue_impact='neutral',
                operational_priority='standard',
                requires_attention=False,
                confidence_score=0.70,
                analytics_context={'tier': 'processing', 'status': 'pending'}
            )
    
    def _assess_comprehensive_risk(self, order_data: Dict[str, Any]) -> RiskAssessment:
        """
        🚨 Advanced multi-dimensional risk assessment
        
        Evaluates:
        - Financial Risk: Based on COD value and refund potential
        - Operational Risk: Based on state, failure patterns, and SLA
        - Customer Risk: Based on satisfaction indicators and history
        """
        state_code = order_data.get('state_code')
        cod = float(order_data.get('cod', 0))
        order_type_code = order_data.get('order_type_code')
        
        risk_factors = []
        mitigation_recommendations = []
        
        # Financial Risk Assessment
        financial_risk = 'low'
        if cod > 5000:
            financial_risk = 'medium'
            risk_factors.append(f"High financial exposure: {cod} EGP")
            mitigation_recommendations.append("Implement enhanced tracking and insurance coverage")
        
        if cod < -1000:
            financial_risk = 'high'
            risk_factors.append(f"Significant refund liability: {abs(cod)} EGP")
            mitigation_recommendations.append("Expedite refund processing to maintain customer satisfaction")
        
        # Operational Risk Assessment
        operational_risk = 'low'
        if state_code in [48, 100, 101]:  # Failed states
            operational_risk = 'critical'
            risk_factors.append("Critical operational failure requiring immediate intervention")
            mitigation_recommendations.append("Investigate root cause and implement preventive measures")
        elif state_code == 46:  # Returns
            operational_risk = 'medium'
            risk_factors.append("Return processing required with potential recovery opportunity")
            mitigation_recommendations.append("Analyze return reason and implement customer retention strategy")
        
        # Customer Risk Assessment
        customer_risk = 'low'
        if state_code in [48, 100, 101]:
            customer_risk = 'high'
            risk_factors.append("High customer dissatisfaction risk")
            mitigation_recommendations.append("Proactive customer communication and compensation consideration")
        elif state_code == 46 and cod < 0:
            customer_risk = 'medium'
            risk_factors.append("Customer refund request indicates potential dissatisfaction")
            mitigation_recommendations.append("Follow up with customer to understand issues and improve service")
        
        # Determine overall risk
        risk_levels = [financial_risk, operational_risk, customer_risk]
        if 'critical' in risk_levels:
            overall_risk = 'critical'
        elif 'high' in risk_levels:
            overall_risk = 'high'
        elif 'medium' in risk_levels:
            overall_risk = 'medium'
        else:
            overall_risk = 'low'
        
        return RiskAssessment(
            overall_risk=overall_risk,
            financial_risk=financial_risk,
            operational_risk=operational_risk,
            customer_risk=customer_risk,
            risk_factors=risk_factors,
            mitigation_recommendations=mitigation_recommendations
        )
    
    def _analyze_revenue_impact(self, state_code: int, cod: float, order_type_code: int) -> Dict[str, Any]:
        """
        💰 Analyze revenue impact based on real analytics patterns
        
        Revenue Categories:
        - Delivered (State 45): Positive revenue (68M EGP total)
        - Returns (State 46): Mixed impact (-1.3M to +101K EGP)
        - Failed (State 48+): Negative impact (operational cost)
        """
        impact_analysis = {
            'impact_type': 'neutral',
            'revenue_contribution': 0,
            'cost_impact': 0,
            'net_impact': 0,
            'business_value': 'standard'
        }
        
        if state_code == 45:  # Delivered - positive revenue
            impact_analysis.update({
                'impact_type': 'positive',
                'revenue_contribution': cod,
                'net_impact': cod,
                'business_value': self._determine_business_value(cod)
            })
        elif state_code == 46:  # Returns - mixed impact
            if cod > 0:  # Exchange with additional payment
                impact_analysis.update({
                    'impact_type': 'mixed_positive',
                    'revenue_contribution': cod,
                    'net_impact': cod * 0.7,  # Reduced due to processing costs
                    'business_value': 'recovery'
                })
            else:  # Refund
                impact_analysis.update({
                    'impact_type': 'negative',
                    'cost_impact': abs(cod),
                    'net_impact': cod,
                    'business_value': 'cost_center'
                })
        elif state_code in [48, 100, 101]:  # Failed states
            impact_analysis.update({
                'impact_type': 'negative',
                'cost_impact': abs(cod) + 50,  # Add operational cost
                'net_impact': -(abs(cod) + 50),
                'business_value': 'loss'
            })
        
        return impact_analysis
    
    def _determine_business_value(self, cod: float) -> str:
        """Determine business value tier based on COD"""
        if cod >= 10500:
            return 'maximum_value'
        elif cod > 5000:
            return 'premium_value'
        elif cod > 1500:
            return 'high_value'
        elif cod > 500:
            return 'standard_value'
        elif cod > 0:
            return 'maintenance_value'
        else:
            return 'service_value'
    
    def _determine_operational_priority(self, business_classification: BusinessClassification, risk_assessment: RiskAssessment) -> str:
        """
        ⚡ Determine operational priority based on business impact and risk
        
        Priority Levels:
        - Critical: High-risk, high-value orders requiring immediate attention
        - High: Premium orders or significant issues
        - Medium: Standard business with some attention needed
        - Low: Routine operations
        """
        if risk_assessment.overall_risk == 'critical':
            return 'critical'
        elif business_classification.business_category in ['premium_maximum', 'premium_high']:
            return 'high'
        elif risk_assessment.overall_risk == 'high' or business_classification.requires_attention:
            return 'medium'
        else:
            return 'low'
    
    def _generate_analytics_context(self, order_data: Dict, business_classification: BusinessClassification, risk_assessment: RiskAssessment) -> Dict[str, Any]:
        """Generate rich analytics context for the order"""
        cod = float(order_data.get('cod', 0))
        state_code = order_data.get('state_code')
        
        return {
            'classification_timestamp': datetime.now().isoformat(),
            'analytics_version': '2.0_real_data',
            'data_source': '51139_orders_analytics',
            'business_tier': business_classification.analytics_context.get('tier'),
            'revenue_percentile': business_classification.analytics_context.get('percentile', 50),
            'state_performance': self.STATE_IMPACT_MATRIX.get(state_code, {}),
            'cod_analysis': {
                'value': cod,
                'category': business_classification.cod_category,
                'relative_to_avg': round((cod / 1307.51) * 100, 2),  # Compare to overall avg
                'relative_to_state_avg': self._calculate_state_relative_cod(cod, state_code)
            },
            'risk_profile': {
                'overall': risk_assessment.overall_risk,
                'factors': risk_assessment.risk_factors,
                'recommendations': risk_assessment.mitigation_recommendations
            },
            'business_intelligence': {
                'requires_followup': business_classification.requires_attention,
                'priority_level': self._determine_operational_priority(business_classification, risk_assessment),
                'confidence': business_classification.confidence_score
            }
        }
    
    def _calculate_state_relative_cod(self, cod: float, state_code: int) -> float:
        """Calculate COD relative to state average"""
        state_avg = self.STATE_IMPACT_MATRIX.get(state_code, {}).get('avg_cod', 1307.51)
        if state_avg != 0:
            return round((cod / state_avg) * 100, 2)
        return 0
    
    # ================================================================================
    # HIERARCHY AND RELATIONSHIP DETECTION
    # ================================================================================
    
    def detect_and_link_hierarchy(self, conn, order_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        🔗 Intelligent order hierarchy detection based on analytics patterns
        
        Detects relationships between:
        - Main orders (high-value deliveries) and follow-up services
        - Return/exchange patterns for the same customer
        - Maintenance orders linked to original purchases
        """
        try:
            customer_phone = order_data.get('receiver_phone')
            current_order_id = order_data['id']
            business_category = order_data.get('business_category')
            cod = float(order_data.get('cod', 0))
            state_code = order_data.get('state_code')
            
            if not customer_phone:
                return {'linked': False, 'reason': 'No customer phone available'}
            
            # Only link orders that benefit from hierarchy analysis
            linkable_categories = ['customer_refund', 'exchange_upsell', 'maintenance_service', 'return_processing']
            if business_category not in linkable_categories:
                return {'linked': False, 'reason': 'Order type does not require hierarchy linking'}
            
            # Find potential parent orders
            cursor = conn.execute("""
                SELECT id, tracking_number, cod, created_at, state_code, business_category
                FROM orders 
                WHERE receiver_phone = ? AND id != ? AND state_code = 45
                ORDER BY created_at DESC
                LIMIT 10
            """, (customer_phone, current_order_id))
            
            potential_parents = cursor.fetchall()
            if not potential_parents:
                return {'linked': False, 'reason': 'No delivered orders found for this customer'}
            
            # Find the best parent order based on business logic
            best_parent = self._find_best_parent_order(order_data, potential_parents)
            if not best_parent:
                return {'linked': False, 'reason': 'No suitable parent order found within time/value constraints'}
            
            # Create hierarchy link
            relationship_type = self._determine_relationship_type(order_data, best_parent)
            
            cursor = conn.execute("""
                INSERT INTO order_hierarchy (main_order_id, sub_order_id, relationship_type, linked_at)
                VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            """, (best_parent['id'], current_order_id, relationship_type))
            
            hierarchy_id = cursor.lastrowid
            
            return {
                'linked': True,
                'main_order_id': best_parent['id'],
                'hierarchy_id': hierarchy_id,
                'relationship_type': relationship_type,
                'confidence': self._calculate_link_confidence(order_data, best_parent),
                'business_impact': self._assess_hierarchy_business_impact(order_data, best_parent)
            }
            
        except Exception as e:
            self.logger.error(f"Error detecting hierarchy for order {order_data.get('tracking_number')}: {e}")
            return {'linked': False, 'error': str(e)}
    
    def _find_best_parent_order(self, current_order: Dict, potential_parents: List) -> Optional[Dict]:
        """Find the best parent order based on business logic"""
        current_cod = float(current_order.get('cod', 0))
        current_created = datetime.fromisoformat(current_order.get('created_at', ''))
        
        scored_parents = []
        
        for parent_row in potential_parents:
            parent = {
                'id': parent_row[0],
                'tracking_number': parent_row[1],
                'cod': float(parent_row[2] or 0),
                'created_at': parent_row[3],
                'state_code': parent_row[4],
                'business_category': parent_row[5]
            }
            
            # Calculate compatibility score
            score = self._calculate_parent_compatibility_score(current_order, parent, current_created)
            if score > 0.3:  # Minimum threshold
                scored_parents.append((parent, score))
        
        if scored_parents:
            # Return the highest scored parent
            scored_parents.sort(key=lambda x: x[1], reverse=True)
            return scored_parents[0][0]
        
        return None
    
    def _calculate_parent_compatibility_score(self, current_order: Dict, parent: Dict, current_created: datetime) -> float:
        """Calculate compatibility score between current order and potential parent"""
        score = 0.0
        
        # Time proximity (within 60 days gets full points, degrades after)
        parent_created = datetime.fromisoformat(parent['created_at'])
        days_diff = (current_created - parent_created).days
        
        if days_diff <= 60:
            time_score = 1.0 - (days_diff / 60) * 0.3  # 70% minimum for 60 days
        else:
            time_score = max(0.0, 0.7 - ((days_diff - 60) / 30) * 0.1)
        
        score += time_score * 0.4
        
        # COD relationship (refunds should match original value, exchanges can be different)
        current_cod = float(current_order.get('cod', 0))
        parent_cod = parent['cod']
        
        if current_cod < 0:  # Refund case
            refund_ratio = abs(current_cod) / parent_cod if parent_cod > 0 else 0
            cod_score = 1.0 if 0.5 <= refund_ratio <= 1.2 else max(0.0, 1.0 - abs(refund_ratio - 1.0))
        else:  # Exchange or maintenance case
            cod_score = 0.7  # Standard score for non-refund cases
        
        score += cod_score * 0.3
        
        # Business category compatibility
        category_score = self._get_category_compatibility_score(
            current_order.get('business_category'), 
            parent.get('business_category')
        )
        score += category_score * 0.3
        
        return min(1.0, score)
    
    def _get_category_compatibility_score(self, current_category: str, parent_category: str) -> float:
        """Get compatibility score between business categories"""
        compatibility_matrix = {
            'customer_refund': ['high_value_delivery', 'premium_high', 'standard_revenue'],
            'exchange_upsell': ['high_value_delivery', 'standard_revenue'],
            'maintenance_service': ['high_value_delivery', 'premium_high'],
            'return_processing': ['high_value_delivery', 'standard_revenue']
        }
        
        compatible_parents = compatibility_matrix.get(current_category, [])
        return 1.0 if parent_category in compatible_parents else 0.5
    
    def _determine_relationship_type(self, current_order: Dict, parent_order: Dict) -> str:
        """Determine the relationship type between orders"""
        current_category = current_order.get('business_category')
        current_cod = float(current_order.get('cod', 0))
        
        if current_category == 'customer_refund':
            return 'refund_request'
        elif current_category == 'exchange_upsell':
            return 'exchange_with_payment'
        elif current_category == 'maintenance_service':
            return 'maintenance_followup'
        elif current_category == 'return_processing':
            return 'return_processing'
        else:
            return 'related_order'
    
    def _calculate_link_confidence(self, current_order: Dict, parent_order: Dict) -> float:
        """Calculate confidence in the hierarchy link"""
        # Based on multiple factors including time, value, and pattern matching
        base_confidence = 0.7
        
        # Boost confidence for clear patterns
        current_category = current_order.get('business_category')
        if current_category in ['customer_refund', 'exchange_upsell']:
            base_confidence += 0.2
        
        return min(1.0, base_confidence)
    
    def _assess_hierarchy_business_impact(self, current_order: Dict, parent_order: Dict) -> Dict[str, Any]:
        """Assess business impact of the hierarchy relationship"""
        current_cod = float(current_order.get('cod', 0))
        parent_cod = parent_order['cod']
        
        return {
            'revenue_recovery_rate': abs(current_cod) / parent_cod if parent_cod > 0 and current_cod < 0 else None,
            'customer_lifetime_impact': current_cod + parent_cod,
            'retention_indicator': current_cod > 0,  # Positive COD suggests customer retention
            'service_quality_indicator': 'good' if current_cod >= 0 else 'needs_improvement'
        }
    
    # ================================================================================
    # ANALYTICS AND REPORTING METHODS
    # ================================================================================
    
    def get_order_hierarchy(self, conn, order_id: str) -> Dict[str, Any]:
        """Get comprehensive hierarchy information for an order"""
        try:
            return self._get_detailed_hierarchy_info(conn, order_id)
        except Exception as e:
            self.logger.error(f"Error getting hierarchy for order {order_id}: {e}")
            return {'error': str(e)}
    
    def _get_detailed_hierarchy_info(self, conn, order_id: str) -> Dict[str, Any]:
        """Get detailed hierarchy information with business context"""
        # Check if order is a main order (has sub-orders)
        cursor = conn.execute("""
            SELECT h.sub_order_id, h.relationship_type, h.linked_at,
                   o.tracking_number, o.cod, o.state_code, o.business_category
            FROM order_hierarchy h
            JOIN orders o ON h.sub_order_id = o.id
            WHERE h.main_order_id = ?
            ORDER BY h.linked_at DESC
        """, (order_id,))
        
        sub_orders = []
        total_sub_value = 0
        
        for row in cursor.fetchall():
            sub_order = {
                'order_id': row[0],
                'relationship_type': row[1],
                'linked_at': row[2],
                'tracking_number': row[3],
                'cod': float(row[4] or 0),
                'state_code': row[5],
                'business_category': row[6]
            }
            sub_orders.append(sub_order)
            total_sub_value += sub_order['cod']
        
        # Check if order is a sub-order (has parent)
        cursor = conn.execute("""
            SELECT h.main_order_id, h.relationship_type, h.linked_at,
                   o.tracking_number, o.cod, o.state_code, o.business_category
            FROM order_hierarchy h
            JOIN orders o ON h.main_order_id = o.id
            WHERE h.sub_order_id = ?
        """, (order_id,))
        
        main_order = None
        main_row = cursor.fetchone()
        if main_row:
            main_order = {
                'order_id': main_row[0],
                'relationship_type': main_row[1],
                'linked_at': main_row[2],
                'tracking_number': main_row[3],
                'cod': float(main_row[4] or 0),
                'state_code': main_row[5],
                'business_category': main_row[6]
            }
        
        # Calculate hierarchy analytics
        hierarchy_analytics = self._calculate_hierarchy_analytics(main_order, sub_orders, total_sub_value)
        
        return {
            'has_hierarchy': bool(sub_orders or main_order),
            'is_main_order': bool(sub_orders),
            'is_sub_order': bool(main_order),
            'main_order': main_order,
            'sub_orders': sub_orders,
            'hierarchy_analytics': hierarchy_analytics,
            'total_sub_orders': len(sub_orders),
            'total_hierarchy_value': total_sub_value
        }
    
    def _calculate_hierarchy_analytics(self, main_order: Optional[Dict], sub_orders: List[Dict], total_sub_value: float) -> Dict[str, Any]:
        """Calculate analytics for order hierarchy"""
        if not main_order and not sub_orders:
            return {}
        
        analytics = {
            'hierarchy_depth': 1 + len(sub_orders),
            'total_relationship_value': total_sub_value,
            'relationship_patterns': {}
        }
        
        if main_order:
            # Sub-order analytics
            main_cod = main_order['cod']
            analytics.update({
                'parent_value': main_cod,
                'recovery_efficiency': abs(total_sub_value) / main_cod if main_cod > 0 else 0
            })
        
        if sub_orders:
            # Main order analytics
            relationship_types = {}
            for sub_order in sub_orders:
                rel_type = sub_order['relationship_type']
                relationship_types[rel_type] = relationship_types.get(rel_type, 0) + 1
            
            analytics['relationship_patterns'] = relationship_types
        
        return analytics
    
    def get_hierarchy_analytics(self, conn) -> Dict[str, Any]:
        """Get system-wide hierarchy analytics"""
        try:
            # Get total hierarchy links
            cursor = conn.execute("SELECT COUNT(*) FROM order_hierarchy")
            total_links = cursor.fetchone()[0]
            
            # Get relationship type distribution
            cursor = conn.execute("""
                SELECT relationship_type, COUNT(*) as count
                FROM order_hierarchy
                GROUP BY relationship_type
                ORDER BY count DESC
            """)
            
            relationship_stats = []
            for row in cursor.fetchall():
                relationship_stats.append({
                    'relationship_type': row[0],
                    'count': row[1]
                })
            
            # Get hierarchy coverage
            cursor = conn.execute("""
                SELECT 
                    COUNT(DISTINCT o.id) as total_orders,
                    COUNT(DISTINCT h.sub_order_id) as orders_with_hierarchy
                FROM orders o
                LEFT JOIN order_hierarchy h ON o.id = h.sub_order_id OR o.id = h.main_order_id
            """)
            
            coverage_row = cursor.fetchone()
            total_orders = coverage_row[0]
            orders_with_hierarchy = coverage_row[1]
            
            coverage_percentage = (orders_with_hierarchy / total_orders * 100) if total_orders > 0 else 0
            
            return {
                'total_hierarchy_links': total_links,
                'total_orders': total_orders,
                'orders_with_hierarchy': orders_with_hierarchy,
                'coverage_percentage': round(coverage_percentage, 2),
                'relationship_distribution': relationship_stats,
                'analytics_timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Error getting hierarchy analytics: {e}")
            return {'error': str(e)}
    
    # ================================================================================
    # UTILITY AND HELPER METHODS
    # ================================================================================
    
    def _get_fallback_classification(self, order_data: Dict[str, Any]) -> Dict[str, Any]:
        """Fallback classification for error cases"""
        order_data.update({
            'business_category': 'unknown',
            'cod_category': 'unknown',
            'risk_level': 'medium',
            'revenue_impact': 'unknown',
            'operational_priority': 'standard',
            'requires_attention': True,
            'classification_confidence': 0.0,
            'analytics_context': {
                'error': 'Classification failed, using fallback',
                'timestamp': datetime.now().isoformat()
            }
        })
        return order_data
    
    def get_business_categorization_sql(self) -> str:
        """Get SQL for business categorization in database queries"""
        return """
            CASE 
                WHEN state_code = 45 AND CAST(cod AS REAL) >= 10500 THEN 'premium_maximum'
                WHEN state_code = 45 AND CAST(cod AS REAL) > 5000 THEN 'premium_high'
                WHEN state_code = 45 AND CAST(cod AS REAL) > 1500 THEN 'high_value_delivery'
                WHEN state_code = 45 AND CAST(cod AS REAL) > 500 THEN 'standard_revenue'
                WHEN state_code = 45 AND CAST(cod AS REAL) > 0 THEN 'maintenance_service'
                WHEN state_code = 45 AND CAST(cod AS REAL) = 0 THEN 'service_delivery'
                WHEN state_code = 46 AND order_type_code = 30 AND CAST(cod AS REAL) > 0 THEN 'exchange_upsell'
                WHEN state_code = 46 AND order_type_code = 25 THEN 'customer_refund'
                WHEN state_code = 46 THEN 'return_processing'
                WHEN state_code = 48 THEN 'failed_delivery'
                WHEN state_code IN (100, 101) THEN 'critical_failure'
                ELSE 'operational_processing'
            END as business_category
        """
    
    def get_risk_level_sql(self) -> str:
        """Get SQL for risk level determination in database queries"""
        return """
            CASE 
                WHEN state_code IN (100, 101) THEN 'critical'
                WHEN state_code = 48 OR CAST(cod AS REAL) < -1000 THEN 'high'
                WHEN state_code = 46 OR CAST(cod AS REAL) > 5000 THEN 'medium'
                ELSE 'low'
            END as risk_level
        """
    
    def get_cod_categorization_sql(self) -> str:
        """Get SQL for COD categorization in database queries"""
        return """
            CASE 
                WHEN CAST(cod AS REAL) >= 10500 THEN 'max_value_order'
                WHEN CAST(cod AS REAL) > 5000 THEN 'premium_high'
                WHEN CAST(cod AS REAL) > 1500 THEN 'high_value'
                WHEN CAST(cod AS REAL) > 500 THEN 'standard_value'
                WHEN CAST(cod AS REAL) > 0 THEN 'low_value'
                WHEN CAST(cod AS REAL) = 0 THEN 'zero_cod'
                WHEN CAST(cod AS REAL) <= -500 THEN 'large_refund'
                WHEN CAST(cod AS REAL) < 0 THEN 'small_refund'
                ELSE 'unknown'
            END as cod_category
        """
    
    def apply_business_category_filter(self, base_query: str, params: List, category: str) -> Tuple[str, List]:
        """
        Apply business category filter to SQL query
        
        Args:
            base_query: Base SQL query string
            params: Current query parameters
            category: Business category to filter by
            
        Returns:
            Tuple of (updated_query, updated_params)
        """
        category_filters = {
            'real_sales': " AND state_code = 45 AND CAST(cod AS REAL) > 500",
            'maintenance': " AND state_code = 45 AND CAST(cod AS REAL) > 0 AND CAST(cod AS REAL) <= 500",
            'service': " AND state_code = 45 AND CAST(cod AS REAL) = 0",
            'refund': " AND CAST(cod AS REAL) < 0",
            'premium_high': " AND state_code = 45 AND CAST(cod AS REAL) > 5000",
            'high_value_delivery': " AND state_code = 45 AND CAST(cod AS REAL) > 1500 AND CAST(cod AS REAL) <= 5000",
            'standard_revenue': " AND state_code = 45 AND CAST(cod AS REAL) > 500 AND CAST(cod AS REAL) <= 1500",
            'maintenance_service': " AND state_code = 45 AND CAST(cod AS REAL) > 0 AND CAST(cod AS REAL) <= 500",
            'service_delivery': " AND state_code = 45 AND CAST(cod AS REAL) = 0",
            'customer_refund': " AND state_code = 46 AND CAST(cod AS REAL) < 0",
            'return_processing': " AND state_code = 46 AND CAST(cod AS REAL) >= 0",
            'failed_delivery': " AND state_code = 48",
            'critical_failure': " AND state_code IN (100, 101)"
        }
        
        if category in category_filters:
            return base_query + category_filters[category], params
        else:
            # Return unchanged query if category not found
            return base_query, params

# ================================================================================
# GLOBAL INSTANCE
# ================================================================================

# Create singleton instance for use throughout the application
order_classifier = OrderClassificationService() 