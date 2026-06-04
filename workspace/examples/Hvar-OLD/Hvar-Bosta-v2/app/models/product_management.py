"""
Simplified Product Management Models
Core product catalog and inventory management system
"""

import sqlite3
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
from decimal import Decimal
from app.utils.db_utils import get_db
from app.models.database import init_production_db
from app.core.product_data import get_hvar_products_with_parts

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ProductManagement:
    """Simplified Product Management System for HVAR CRM"""
    
    def __init__(self):
        self.init_database()
    
    def init_database(self):
        """Initialize product management using production database schema"""
        try:
            # Use the production database initialization
            result = init_production_db()
            if not result['success']:
                raise Exception(f"Failed to initialize production database: {result['error']}")
            
            # Initialize product-specific default data
            with get_db() as conn:
                cursor = conn.cursor()
                self._init_default_categories(cursor)
                conn.commit()
                self._seed_initial_products() # Seed initial products
                
        except Exception as e:
            logger.error(f"Error initializing database: {e}")
            raise
    

    
    def _init_default_categories(self, cursor):
        """Initialize default product categories"""
        try:
            cursor.execute("SELECT COUNT(*) FROM product_categories")
            if cursor.fetchone()[0] == 0:
                default_categories = [
                    ('كبه', 'Blender'),
                    ('خلاط هفار', 'HVAR Mixer'),
                    ('فرن هفار كهربائي', 'HVAR Electric Oven'),
                    ('قلاية كهربائية', 'Electric Fryer'),
                    ('مكواه بخار هفار', 'HVAR Steam Iron'),
                    ('مكنسة', 'Vacuum Cleaner'),
                    ('عجان', 'Dough Mixer'),
                    ('مطحنه توابل', 'Spice Grinder'),
                    ('هاند بلندر', 'Hand Blender'),
                    ('خامات تصنيع', 'Raw Materials'),
                    ('كرتون', 'Packaging'),
                    ('قطع غيار', 'Spare Parts')
                ]
                cursor.executemany(
                    "INSERT INTO product_categories (category_name_ar, category_name_en) VALUES (?, ?)",
                    default_categories
                )
        except Exception as e:
            logger.error(f"Error initializing default categories: {e}")
            
    def _seed_initial_products(self):
        """Seed the database with initial HVAR products if they don't exist"""
        try:
            with get_db() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT COUNT(*) FROM products")
                if cursor.fetchone()[0] == 0:
                    logger.info("🌱 Seeding initial products...")
                    products_data = get_hvar_products_with_parts()
                    for product_info in products_data:
                        self.create_product_with_parts(
                            product_info['product'],
                            product_info['parts']
                        )
                    logger.info("✅ Initial products seeded successfully.")
        except Exception as e:
            logger.error(f"Error seeding initial products: {e}")
    
    def create_product(self, product_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new product"""
        try:
            with get_db() as conn:
                cursor = conn.cursor()
                # Generate SKU if not provided
                if not product_data.get('sku'):
                    product_data['sku'] = self._generate_sku(product_data['name_ar'])
                # Insert product
                cursor.execute("""
                    INSERT INTO products (
                        sku, name_ar, name_en, brand, category, unit,
                        selling_price, purchase_price, alert_quantity
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    product_data['sku'],
                    product_data['name_ar'],
                    product_data.get('name_en', ''),
                    product_data.get('brand', 'هفار'),
                    product_data.get('category', ''),
                    product_data.get('unit', 'القطعة'),
                    product_data.get('selling_price', 0),
                    product_data.get('purchase_price', 0),
                    product_data.get('alert_quantity', 0)
                ))
                product_id = cursor.lastrowid
                # Initialize inventory
                self._initialize_inventory(cursor, product_id, product_data)
                conn.commit()
                return {
                    'success': True,
                    'product_id': product_id,
                    'sku': product_data['sku'],
                    'message': 'Product created successfully'
                }
        except sqlite3.IntegrityError as e:
            if 'UNIQUE constraint failed' in str(e):
                return {
                    'success': False,
                    'error': 'SKU already exists'
                }
            return {
                'success': False,
                'error': 'Database constraint error'
            }
        except Exception as e:
            logger.error(f"Error creating product: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _generate_sku(self, name_ar: str) -> str:
        """Generate SKU from product name"""
        import re
        # Extract numbers from name
        numbers = re.findall(r'\d+', name_ar)
        if numbers:
            return f"hvar{numbers[0]}"
        
        # Generate based on name hash
        name_hash = hash(name_ar) % 10000
        return f"hvar{name_hash:04d}"
    
    def _initialize_inventory(self, cursor, product_id: int, product_data: Dict[str, Any]):
        """Initialize inventory for new product"""
        try:
            # Get the product SKU for stock tracking
            cursor.execute("SELECT sku FROM products WHERE product_id = ?", (product_id,))
            result = cursor.fetchone()
            if result:
                sku = result[0]
                # Create stock record for default location
                cursor.execute("""
                    INSERT INTO stock (sku, location, quantity, min_threshold, available_quantity)
                    VALUES (?, ?, ?, ?, ?)
                """, (
                    sku,
                    'المستودع الرئيسي',  # Default location
                    product_data.get('opening_stock', 0),
                    product_data.get('alert_quantity', 0),
                    product_data.get('opening_stock', 0)
                ))
        except Exception as e:
            logger.error(f"Error initializing inventory: {e}")
    
    def get_product(self, product_id: int = None, sku: str = None) -> Dict[str, Any]:
        """Get product by ID or SKU"""
        try:
            with get_db() as conn:
                cursor = conn.cursor()
                if product_id:
                    cursor.execute("""
                        SELECT p.*, s.quantity, s.min_threshold
                        FROM products p
                        LEFT JOIN stock s ON p.sku = s.sku
                        WHERE p.product_id = ? AND p.is_active = 1
                    """, (product_id,))
                elif sku:
                    cursor.execute("""
                        SELECT p.*, s.quantity, s.min_threshold
                        FROM products p
                        LEFT JOIN stock s ON p.sku = s.sku
                        WHERE p.sku = ? AND p.is_active = 1
                    """, (sku,))
                else:
                    return {
                        'success': False,
                        'error': 'Product ID or SKU is required'
                    }
                row = cursor.fetchone()
                if row:
                    columns = [description[0] for description in cursor.description]
                    product = dict(zip(columns, row))
                    return {
                        'success': True,
                        'product': product
                    }
                else:
                    return {
                        'success': False,
                        'error': 'Product not found'
                    }
        except Exception as e:
            logger.error(f"Error getting product: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def update_product(self, product_id: int, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update product"""
        try:
            with get_db() as conn:
                cursor = conn.cursor()
                
                # Build update query
                update_fields = []
                update_values = []
                
                allowed_fields = ['name_ar', 'name_en', 'brand', 'category', 'unit', 
                                'selling_price', 'purchase_price', 'alert_quantity']
                
                for field in allowed_fields:
                    if field in update_data:
                        update_fields.append(f"{field} = ?")
                        update_values.append(update_data[field])
                
                if not update_fields:
                    return {
                        'success': False,
                        'error': 'No valid fields to update'
                    }
                
                update_fields.append("updated_at = CURRENT_TIMESTAMP")
                update_values.append(product_id)
                
                # Execute update
                cursor.execute(f"""
                    UPDATE products 
                    SET {', '.join(update_fields)}
                    WHERE product_id = ?
                """, update_values)
                
                if cursor.rowcount == 0:
                    return {
                        'success': False,
                        'error': 'Product not found'
                    }
                
                conn.commit()
                
                return {
                    'success': True,
                    'product_id': product_id,
                    'message': 'Product updated successfully'
                }
                
        except Exception as e:
            logger.error(f"Error updating product: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def delete_product(self, product_id: int) -> Dict[str, Any]:
        """Soft delete product"""
        try:
            with get_db() as conn:
                cursor = conn.cursor()
                
                cursor.execute("""
                    UPDATE products 
                    SET is_active = 0, updated_at = CURRENT_TIMESTAMP
                    WHERE product_id = ?
                """, (product_id,))
                
                if cursor.rowcount == 0:
                    return {
                        'success': False,
                        'error': 'Product not found'
                    }
                
                conn.commit()
                
                return {
                    'success': True,
                    'product_id': product_id,
                    'message': 'Product deleted successfully'
                }
                
        except Exception as e:
            logger.error(f"Error deleting product: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def list_products(self, filters: Dict[str, Any] = None, page: int = 1, limit: int = 50) -> Dict[str, Any]:
        """List products with filtering and pagination"""
        try:
            with get_db() as conn:
                cursor = conn.cursor()
                
                # Build query to aggregate stock levels, preventing duplicate product listings
                base_query = """
                    FROM products p
                    LEFT JOIN stock s ON p.sku = s.sku
                    WHERE p.is_active = 1
                """
                query_params = []
                
                # Apply filters
                if filters:
                    if filters.get('search'):
                        search_term = f"%{filters['search']}%"
                        base_query += " AND (p.name_ar LIKE ? OR p.name_en LIKE ? OR p.sku LIKE ?)"
                        query_params.extend([search_term, search_term, search_term])
                
                    if filters.get('category'):
                        base_query += " AND p.category = ?"
                        query_params.append(filters['category'])
                
                # Get total count of unique products matching filters
                count_query = f"SELECT COUNT(DISTINCT p.product_id) {base_query}"
                cursor.execute(count_query, query_params)
                total_count = cursor.fetchone()[0]
                
                # Build main query with aggregation and pagination
                query = f"""
                    SELECT 
                        p.*,
                        SUM(s.quantity) as quantity,
                        SUM(s.available_quantity) as available_quantity,
                        MIN(s.min_threshold) as min_threshold
                    {base_query}
                    GROUP BY p.product_id
                    ORDER BY p.created_at DESC
                    LIMIT ? OFFSET ?
                """
                offset = (page - 1) * limit
                query_params.extend([limit, offset])
                
                # Execute query
                cursor.execute(query, query_params)
                rows = cursor.fetchall()
                
                # Format results
                columns = [description[0] for description in cursor.description]
                products = [dict(zip(columns, row)) for row in rows]
                
                # Calculate pagination info
                total_pages = (total_count + limit - 1) // limit
                
                return {
                    'success': True,
                    'products': products,
                    'pagination': {
                        'page': page,
                        'limit': limit,
                        'total_count': total_count,
                        'total_pages': total_pages
                    }
                }
                
        except Exception as e:
            logger.error(f"Error listing products: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_product_categories(self) -> Dict[str, Any]:
        """Get product categories"""
        try:
            with get_db() as conn:
                cursor = conn.cursor()
                
                cursor.execute("""
                    SELECT category_id, category_name_ar, category_name_en
                    FROM product_categories
                    WHERE is_active = 1 
                    ORDER BY category_name_ar
                """)
                
                rows = cursor.fetchall()
                categories = [
                    {
                        'category_id': row[0],
                        'category_name_ar': row[1],
                        'category_name_en': row[2]
                    }
                    for row in rows
                ]
                
                return {
                    'success': True,
                    'categories': categories
                }
                
        except Exception as e:
            logger.error(f"Error getting categories: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def update_inventory(self, product_id: int, location: str, quantity_change: int, 
                        transaction_type: str, reference_type: str = 'manual', 
                        reference_id: str = None, notes: str = None) -> Dict[str, Any]:
        """Update product inventory"""
        try:
            with get_db() as conn:
                cursor = conn.cursor()
                
                # Get product SKU
                cursor.execute("SELECT sku FROM products WHERE product_id = ?", (product_id,))
                product_result = cursor.fetchone()
                if not product_result:
                    return {
                        'success': False,
                        'error': 'Product not found'
                    }
                sku = product_result[0]
                
                # Get current stock
                cursor.execute("""
                    SELECT quantity, available_quantity FROM stock
                    WHERE sku = ? AND location = ?
                """, (sku, location))
                result = cursor.fetchone()
                
                if result:
                    current_quantity = result[0]
                    current_available = result[1]
                    new_quantity = current_quantity + quantity_change
                    new_available = current_available + quantity_change
                    
                    if new_quantity < 0 or new_available < 0:
                        return {
                            'success': False,
                            'error': 'Insufficient stock'
                        }
                    
                    # Update stock
                    cursor.execute("""
                        UPDATE stock 
                        SET quantity = ?, available_quantity = ?, last_updated = CURRENT_TIMESTAMP
                        WHERE sku = ? AND location = ?
                    """, (new_quantity, new_available, sku, location))
                    
                else:
                    # Create new stock record
                    if quantity_change < 0:
                        return {
                            'success': False,
                            'error': 'No stock record found'
                        }
                    
                    cursor.execute("""
                        INSERT INTO stock (sku, location, quantity, available_quantity)
                        VALUES (?, ?, ?, ?)
                    """, (sku, location, quantity_change, quantity_change))
                    
                    new_quantity = quantity_change
                
                # Record stock movement
                cursor.execute("""
                    INSERT INTO stock_movements (
                        sku, location_to, quantity, movement_type, reference_id, notes
                    ) VALUES (?, ?, ?, ?, ?, ?)
                """, (sku, location, quantity_change, transaction_type, reference_id, notes))
                
                conn.commit()
                
                return {
                    'success': True,
                    'new_quantity': new_quantity,
                    'change': quantity_change,
                    'message': 'Inventory updated successfully'
                }
                
        except Exception as e:
            logger.error(f"Error updating inventory: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_inventory_status(self, product_id: int = None, location: str = None) -> Dict[str, Any]:
        """Get inventory status"""
        try:
            with get_db() as conn:
                cursor = conn.cursor()
                
                if product_id:
                    cursor.execute("""
                        SELECT p.name_ar, p.sku, s.quantity, s.min_threshold, s.location
                        FROM stock s
                        JOIN products p ON s.sku = p.sku
                        WHERE p.product_id = ?
                    """, (product_id,))
                elif location:
                    cursor.execute("""
                        SELECT p.name_ar, p.sku, s.quantity, s.min_threshold, s.location
                        FROM stock s
                        JOIN products p ON s.sku = p.sku
                        WHERE s.location = ?
                    """, (location,))
                else:
                    cursor.execute("""
                        SELECT p.name_ar, p.sku, s.quantity, s.min_threshold, s.location
                        FROM stock s
                        JOIN products p ON s.sku = p.sku
                    """)
                
                rows = cursor.fetchall()
                inventory = [
                    {
                        'name_ar': row[0],
                        'sku': row[1],
                        'quantity_available': row[2],
                        'min_stock_level': row[3],
                        'location_name': row[4]
                    }
                    for row in rows
                ]
                
                return {
                    'success': True,
                    'inventory': inventory
                }
                
        except Exception as e:
            logger.error(f"Error getting inventory status: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_low_stock_alerts(self) -> Dict[str, Any]:
        """Get low stock alerts"""
        try:
            with get_db() as conn:
                cursor = conn.cursor()
                
                cursor.execute("""
                    SELECT p.name_ar, p.sku, s.quantity, s.min_threshold, s.location
                    FROM stock s
                    JOIN products p ON s.sku = p.sku
                    WHERE s.quantity <= s.min_threshold
                    AND s.quantity > 0
                    ORDER BY s.quantity ASC
                """)
                
                rows = cursor.fetchall()
                alerts = [
                    {
                        'name_ar': row[0],
                        'sku': row[1],
                        'quantity_available': row[2],
                        'min_stock_level': row[3],
                        'location_name': row[4]
                    }
                    for row in rows
                ]
                
                return {
                    'success': True,
                    'alerts': alerts,
                    'count': len(alerts)
                }
                
        except Exception as e:
            logger.error(f"Error getting low stock alerts: {e}")
            return {
                'success': False,
                'error': str(e)
            } 

    def search_products(self, query: str = None) -> Dict[str, Any]:
        """Stub: Search products by name or SKU (returns empty for now)"""
        return {'success': True, 'products': []}

    def create_product_with_parts(self, product_data: Dict[str, Any], parts_data: List[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Create a new product with its parts"""
        try:
            with get_db() as conn:
                cursor = conn.cursor()
                
                # Create the main product first
                product_result = self.create_product(product_data)
                if not product_result['success']:
                    return product_result
                
                product_id = product_result['product_id']
                
                # Create and link parts if provided
                if parts_data:
                    for part_data in parts_data:
                        part_result = self._create_product_part(cursor, product_id, part_data)
                        if not part_result['success']:
                            logger.warning(f"Failed to create part {part_data.get('sku', 'unknown')}: {part_result['error']}")
                
                conn.commit()
                return {
                    'success': True,
                    'product_id': product_id,
                    'message': f"Product created with {len(parts_data) if parts_data else 0} parts"
                }
                
        except Exception as e:
            logger.error(f"Error creating product with parts: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _create_product_part(self, cursor, product_id: int, part_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a part and link it to a product"""
        try:
            # Generate part SKU if not provided
            if not part_data.get('part_sku'):
                part_data['part_sku'] = self._generate_part_sku(part_data['part_name'])
            
            # Insert part into product_parts table
            cursor.execute("""
                INSERT OR IGNORE INTO product_parts (
                    product_id, part_sku, part_name, part_type, 
                    is_replaceable, warranty_period_months, is_active
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                product_id,
                part_data['part_sku'],
                part_data['part_name'],
                part_data.get('part_type', 'component'),
                part_data.get('is_replaceable', 1),
                part_data.get('warranty_period_months', 6),
                part_data.get('is_active', 1)
            ))
            
            part_id = cursor.lastrowid
            
            # Create stock entry for the part
            cursor.execute("""
                INSERT OR IGNORE INTO stock (
                    sku, location, quantity, min_threshold, max_threshold
                ) VALUES (?, ?, ?, ?, ?)
            """, (
                part_data['part_sku'],
                part_data.get('location', 'مخزن قطع الغيار'),
                part_data.get('quantity', 0),
                part_data.get('min_threshold', 10),
                part_data.get('max_threshold', 1000)
            ))
            
            return {
                'success': True,
                'part_id': part_id,
                'part_sku': part_data['part_sku']
            }
            
        except Exception as e:
            logger.error(f"Error creating product part: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _generate_part_sku(self, part_name: str) -> str:
        """Generate a unique SKU for a part"""
        import hashlib
        # Create a hash-based SKU for parts
        hash_object = hashlib.md5(part_name.encode())
        hash_hex = hash_object.hexdigest()[:8]
        return f"hvar{hash_hex}"
    
    def add_part_to_product(self, product_id: int, part_data: Dict[str, Any]) -> Dict[str, Any]:
        """Add a part to an existing product"""
        try:
            with get_db() as conn:
                cursor = conn.cursor()
                result = self._create_product_part(cursor, product_id, part_data)
                conn.commit()
                return result
                
        except Exception as e:
            logger.error(f"Error adding part to product: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_product_parts(self, product_id: int) -> Dict[str, Any]:
        """Get all parts for a specific product"""
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
                        s.quantity as stock_quantity,
                        s.location
                    FROM product_parts pp
                    LEFT JOIN stock s ON pp.part_sku = s.sku
                    WHERE pp.product_id = ? AND pp.is_active = 1
                    ORDER BY pp.part_name
                """, (product_id,))
                
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
                        'stock_quantity': row[7] or 0,
                        'location': row[8] or 'مخزن قطع الغيار'
                    }
                    for row in rows
                ]
                
                return {
                    'success': True,
                    'parts': parts,
                    'count': len(parts)
                }
                
        except Exception as e:
            logger.error(f"Error getting product parts: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def update_part_stock(self, part_sku: str, quantity_change: int, location: str = 'مخزن قطع الغيار') -> Dict[str, Any]:
        """Update stock for a specific part"""
        try:
            with get_db() as conn:
                cursor = conn.cursor()
                
                # Get current stock
                cursor.execute("""
                    SELECT quantity FROM stock WHERE sku = ? AND location = ?
                """, (part_sku, location))
                
                result = cursor.fetchone()
                if result:
                    current_quantity = result[0]
                    new_quantity = max(0, current_quantity + quantity_change)
                    
                    # Update stock
                    cursor.execute("""
                        UPDATE stock SET quantity = ? WHERE sku = ? AND location = ?
                    """, (new_quantity, part_sku, location))
                    
                    # Record movement
                    cursor.execute("""
                        INSERT INTO stock_movements (
                            sku, location_from, location_to, quantity, 
                            movement_type, reference_type, notes
                        ) VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, (
                        part_sku,
                        location if quantity_change < 0 else None,
                        location if quantity_change > 0 else None,
                        abs(quantity_change),
                        'adjustment',
                        'manual',
                        f"Manual stock adjustment: {quantity_change}"
                    ))
                    
                    conn.commit()
                    
                    return {
                        'success': True,
                        'old_quantity': current_quantity,
                        'new_quantity': new_quantity,
                        'change': quantity_change
                    }
                else:
                    return {
                        'success': False,
                        'error': f"Part {part_sku} not found in location {location}"
                    }
                    
        except Exception as e:
            logger.error(f"Error updating part stock: {e}")
            return {
                'success': False,
                'error': str(e)
            } 