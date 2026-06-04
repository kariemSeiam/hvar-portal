"""
Simplified Product Management Routes
Core API endpoints for product catalog and inventory management
"""

from flask import Blueprint, request, jsonify
import logging
from typing import Dict, Any

from app.models.product_management import ProductManagement
from app.utils.db_utils import get_db

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create blueprint
bp = Blueprint('products', __name__, url_prefix='/api')

# Initialize product management
product_management = ProductManagement()

@bp.route('/products', methods=['GET'])
@bp.route('/products/', methods=['GET'])
def list_products():
    """List products with basic filtering"""
    try:
        # Get query parameters
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 50))
        search = request.args.get('search', '')
        category = request.args.get('category', '')
        
        # Build filters
        filters = {}
        if search:
            filters['search'] = search
        if category:
            filters['category'] = category
        
        # Get products
        result = product_management.list_products(filters=filters, page=page, limit=limit)
        
        if result['success']:
            return jsonify({
                'success': True,
                'data': result['products'],
                'pagination': result['pagination']
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': result['error']
            }), 400
            
    except Exception as e:
        logger.error(f"Error listing products: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@bp.route('/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    """Get product by ID"""
    try:
        result = product_management.get_product(product_id=product_id)
        
        if result['success']:
            return jsonify({
                'success': True,
                'data': result['product']
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': result['error']
            }), 404
            
    except Exception as e:
        logger.error(f"Error getting product: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@bp.route('/products', methods=['POST'])
def create_product():
    """Create new product"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        # Validate required fields
        if not data.get('name_ar'):
            return jsonify({
                'success': False,
                'error': 'Product name (name_ar) is required'
            }), 400
        
        result = product_management.create_product(data)
        
        if result['success']:
            return jsonify({
                'success': True,
                'data': {
                    'product_id': result['product_id'],
                    'sku': result['sku']
                },
                'message': result['message']
            }), 201
        else:
            return jsonify({
                'success': False,
                'error': result['error']
            }), 400
            
    except Exception as e:
        logger.error(f"Error creating product: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@bp.route('/products/<int:product_id>', methods=['PUT'])
def update_product(product_id):
    """Update product"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        result = product_management.update_product(product_id, data)
        
        if result['success']:
            return jsonify({
                'success': True,
                'data': {
                    'product_id': result['product_id']
                },
                'message': result['message']
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': result['error']
            }), 400
            
    except Exception as e:
        logger.error(f"Error updating product: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@bp.route('/products/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    """Delete product (soft delete)"""
    try:
        result = product_management.delete_product(product_id)
        
        if result['success']:
            return jsonify({
                'success': True,
                'data': {
                    'product_id': result['product_id']
                },
                'message': result['message']
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': result['error']
            }), 400
            
    except Exception as e:
        logger.error(f"Error deleting product: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@bp.route('/products/categories', methods=['GET'])
def get_categories():
    """Get product categories"""
    try:
        result = product_management.get_product_categories()
        
        if result['success']:
            return jsonify({
                'success': True,
                'data': result['categories']
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': result['error']
            }), 400
            
    except Exception as e:
        logger.error(f"Error getting categories: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@bp.route('/products/<int:product_id>/inventory', methods=['GET'])
def get_product_inventory(product_id):
    """Get product inventory status"""
    try:
        result = product_management.get_inventory_status(product_id=product_id)
        
        if result['success']:
            return jsonify({
                'success': True,
                'data': result['inventory']
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': result['error']
            }), 400
            
    except Exception as e:
        logger.error(f"Error getting product inventory: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@bp.route('/products/<int:product_id>/inventory', methods=['POST'])
def update_product_inventory(product_id):
    """Update product inventory"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        required_fields = ['location', 'quantity_change', 'transaction_type']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Required field "{field}" is missing'
                }), 400
        
        result = product_management.update_inventory(
            product_id=product_id,
            location=data['location'],
            quantity_change=data['quantity_change'],
            transaction_type=data['transaction_type'],
            reference_type=data.get('reference_type', 'manual'),
            reference_id=data.get('reference_id'),
            notes=data.get('notes')
        )
        
        if result['success']:
            return jsonify({
                'success': True,
                'data': {
                    'new_quantity': result['new_quantity'],
                    'change': result['change']
                },
                'message': result['message']
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': result['error']
            }), 400
            
    except Exception as e:
        logger.error(f"Error updating product inventory: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@bp.route('/products/inventory/alerts', methods=['GET'])
def get_low_stock_alerts():
    """Get low stock alerts"""
    try:
        result = product_management.get_low_stock_alerts()
        
        if result['success']:
            return jsonify({
                'success': True,
                'data': result['alerts'],
                'count': result['count']
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': result['error']
            }), 400
            
    except Exception as e:
        logger.error(f"Error getting low stock alerts: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@bp.route('/products/<int:product_id>/parts', methods=['GET'])
def get_product_parts(product_id):
    """Get all parts for a specific product"""
    try:
        result = product_management.get_product_parts(product_id)
        
        if result['success']:
            return jsonify({
                'success': True,
                'data': result['parts'],
                'count': result['count']
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': result['error']
            }), 400
            
    except Exception as e:
        logger.error(f"Error getting product parts: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@bp.route('/products/parts', methods=['GET'])
def get_all_parts():
    """Get all available parts"""
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT 
                    pp.part_id,
                    pp.part_sku,
                    pp.part_name,
                    pp.part_type,
                    pp.is_replaceable,
                    pp.warranty_period_months,
                    pp.is_active,
                    COALESCE(s.quantity, 0) as stock_quantity,
                    COALESCE(s.location, 'مخزن قطع الغيار') as location,
                    COALESCE(p.name_ar, 'غير محدد') as product_name,
                    COALESCE(p.sku, 'غير محدد') as product_sku
                FROM product_parts pp
                LEFT JOIN stock s ON pp.part_sku = s.sku
                LEFT JOIN products p ON pp.product_id = p.product_id
                WHERE pp.is_active = 1
                ORDER BY pp.part_name
            """)
            
            rows = cursor.fetchall()
            parts = [
                {
                    'part_id': row[0],
                    'part_sku': row[1],
                    'part_name': row[2],
                    'part_type': row[3],
                    'is_replaceable': bool(row[4]),
                    'warranty_period_months': row[5],
                    'is_active': bool(row[6]),
                    'stock_quantity': row[7],
                    'location': row[8],
                    'product_name': row[9],
                    'product_sku': row[10]
                }
                for row in rows
            ]
            
            return jsonify({
                'success': True,
                'data': parts,
                'count': len(parts)
            }), 200
            
    except Exception as e:
        logger.error(f"Error getting all parts: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500 