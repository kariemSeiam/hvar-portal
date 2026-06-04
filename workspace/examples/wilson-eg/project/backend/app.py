from flask import Flask, request, jsonify, send_from_directory, make_response
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import jwt
from datetime import datetime, timedelta
from functools import wraps
import os
import uuid
import random
import string
from sqlalchemy import or_, and_, desc, asc, case, event, func, text, distinct, select
from werkzeug.utils import secure_filename
from werkzeug.exceptions import RequestEntityTooLarge
from werkzeug.datastructures import FileStorage
import json
import requests
from urllib.parse import urlparse
import imghdr
from sqlalchemy.engine import Engine
import sqlite3
import time
from sqlalchemy.orm import joinedload, load_only, aliased
from itertools import zip_longest

app = Flask(__name__)

# Define allowed origins based on environment
ALLOWED_ORIGINS = [
    'http://localhost:5173',     # Vite dev server (old port)
    'http://localhost:3000',     # Wilson frontend dev server
    'http://127.0.0.1:3000',     # same origin, some browsers send this
    'http://localhost:3001',     # Wilson alternate port
    'http://localhost:3002',     # Wilson fallback port
    'https://trendy-corner.org',       # Production
    'https://www.trendy-corner.org',   # Production with www
]

# Configure CORS with proper settings
CORS(app, resources={
    r"/api/*": {
        "origins": ALLOWED_ORIGINS,
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "Access-Control-Allow-Origin"],
        "expose_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True,
        "max_age": 3600
    }
})


@app.before_request
def handle_preflight():
    """Respond to CORS preflight (OPTIONS) with 204 so browser gets 2xx."""
    if request.method == 'OPTIONS':
        origin = request.headers.get('Origin')
        if origin in ALLOWED_ORIGINS:
            r = make_response('', 204)
            r.headers['Access-Control-Allow-Origin'] = origin
            r.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
            r.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
            r.headers['Access-Control-Allow-Credentials'] = 'true'
            r.headers['Access-Control-Max-Age'] = '3600'
            return r
    return None


# Add CORS headers to all responses
@app.after_request
def add_cors_headers(response):
    origin = request.headers.get('Origin')
    if origin in ALLOWED_ORIGINS:
        response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        if request.method == 'OPTIONS':
            response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
            response.headers['Access-Control-Max-Age'] = '3600'
    return response


# Additional error handling for CORS
@app.errorhandler(500)
def internal_error(error):
    response = jsonify({
        'error': 'Internal Server Error',
        'message': str(error)
    })
    return response, 500


_backend_dir = os.path.dirname(os.path.abspath(__file__))
# Repo roots:
#   project/backend/app.py → data dirs at repo root (parent of project/)
#   backend/app.py (legacy) → parent of backend/
#   Flat Docker: only app.py in WORKDIR → that directory is root.


def _resolve_repo_root(backend_dir: str) -> str:
    if os.path.basename(backend_dir) != 'backend':
        return backend_dir
    parent = os.path.dirname(backend_dir)
    if os.path.basename(parent) == 'project':
        return os.path.dirname(parent)
    return parent


BASE_DIR = _resolve_repo_root(_backend_dir)
INSTANCE_DIR = os.path.join(BASE_DIR, 'instance')
SETTINGS_PATH = os.path.join(INSTANCE_DIR, 'store_settings.json')

# Optional: load repo-root .env before reading config (pip install python-dotenv)
try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(BASE_DIR, '.env'))
except ImportError:
    pass


def _is_production() -> bool:
    return os.environ.get('FLASK_ENV', '').lower() == 'production' or os.environ.get(
        'ENV', ''
    ).lower() == 'production'


# Configuration — prefer env in production (see .env.example)
_default_secret = 'your-secret-key-here'
_placeholder_secrets = frozenset(
    {_default_secret, 'your-secret-key-change-in-production', 'changeme', 'secret'}
)
_secret = os.environ.get('SECRET_KEY') or _default_secret
if _is_production() and (
    not os.environ.get('SECRET_KEY')
    or _secret in _placeholder_secrets
    or len(_secret.strip()) < 16
):
    raise RuntimeError(
        'SECRET_KEY must be set (min 16 chars, not a placeholder) when FLASK_ENV=production (or ENV=production).'
    )
app.config['SECRET_KEY'] = _secret
_default_db_path = os.path.join(BASE_DIR, 'wilson.db').replace('\\', '/')
app.config['SQLALCHEMY_DATABASE_URI'] = (
    os.environ.get('SQLALCHEMY_DATABASE_URI') or f'sqlite:///{_default_db_path}'
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
SLIDES_FOLDER = os.path.join(BASE_DIR,'uploads', 'slides')
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
# Add these configurations to your Flask app
app.config['SQLALCHEMY_POOL_SIZE'] = 10
app.config['SQLALCHEMY_MAX_OVERFLOW'] = 20
app.config['SQLALCHEMY_POOL_TIMEOUT'] = 30
app.config['SQLALCHEMY_POOL_RECYCLE'] = 1800

MAX_CONTENT_LENGTH = 5 * 1024 * 1024  # 5MB in bytes
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

UPLOAD_URL_PREFIX = os.environ.get('UPLOAD_URL_PREFIX', 'http://127.0.0.1:5004/uploads/').rstrip('/') + '/'


# Ensure upload directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

db = SQLAlchemy(app)

# In-memory LRU cache implementation
class LRUCache:
    def __init__(self, capacity: int, ttl_seconds: int):
        self.capacity = capacity
        self.ttl_seconds = ttl_seconds
        self.cache = {}
        self.timestamps = {}
        self.usage = {}
        self.counter = 0

    def get(self, key: str):
        current_time = time.time()
        if key in self.cache:
            # Check TTL
            if current_time - self.timestamps[key] > self.ttl_seconds:
                self.remove(key)
                return None
            self.counter += 1
            self.usage[key] = self.counter
            return self.cache[key]
        return None

    def put(self, key: str, value):
        current_time = time.time()
        if len(self.cache) >= self.capacity:
            # Remove least recently used item
            lru_key = min(self.usage.items(), key=lambda x: x[1])[0]
            self.remove(lru_key)

        self.counter += 1
        self.cache[key] = value
        self.timestamps[key] = current_time
        self.usage[key] = self.counter

    def remove(self, key: str):
        self.cache.pop(key, None)
        self.timestamps.pop(key, None)
        self.usage.pop(key, None)

    def clear_expired(self):
        current_time = time.time()
        expired_keys = [
            key for key, timestamp in self.timestamps.items()
            if current_time - timestamp > self.ttl_seconds
        ]
        for key in expired_keys:
            self.remove(key)

    def clear(self):
        """Clear all items from the cache"""
        self.cache.clear()
        self.timestamps.clear()
        self.usage.clear()
        self.counter = 0

# Add error handler for large files
@app.errorhandler(413)
def request_entity_too_large(error):
    return jsonify({
        'message': f'File size exceeds the {MAX_CONTENT_LENGTH / (1024 * 1024)}MB limit'
    }), 413

# Initialize caches
slides_cache = LRUCache(capacity=100, ttl_seconds=300)  # 5 minutes TTL
products_cache = LRUCache(capacity=1000, ttl_seconds=60)  # 1 minute TTL

def cache_key_generator(prefix, **kwargs):
    """Generate a cache key from the request parameters"""
    sorted_params = sorted(kwargs.items())
    return f"{prefix}:" + ":".join(f"{k}={v}" for k, v in sorted_params)

def optimize_product_query(query, eager_load=True):
    """Apply optimization techniques to product query"""
    if eager_load:
        query = query.options(
            joinedload(Product.variants).joinedload(ProductVariant.images),
            joinedload(Product.variants).joinedload(ProductVariant.sizes),
            joinedload(Product.features)
        )
    return query.execution_options(max_row_buffer=100)

@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    if isinstance(dbapi_connection, sqlite3.Connection):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA busy_timeout=5000")
        cursor.close()

# Enhanced Database Models
class User(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    phone = db.Column(db.String(20), unique=True, nullable=False)
    name = db.Column(db.String(100))
    role = db.Column(db.String(20), default='user')  # 'user' or 'admin'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    orders = db.relationship('Order', backref='user', lazy=True)
    addresses = db.relationship('Address', backref='user', lazy=True)
    favorites = db.relationship('Favorite', backref='user', lazy=True)

class Order(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('user.id'), nullable=False)
    total = db.Column(db.Float, nullable=False)
    shipping = db.Column(db.Float, nullable=False)
    discount = db.Column(db.Float, default=0)
    payment_method = db.Column(db.String(20), nullable=False)  # 'cod', 'card', etc.
    address_id = db.Column(db.String(36), db.ForeignKey('address.id'), nullable=False)
    status = db.Column(db.String(20), nullable=False)  # pending, processing, shipped, delivered, cancelled
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    items = db.relationship('OrderItem', backref='order', lazy=True, cascade='all, delete-orphan')
    tracking_steps = db.relationship('OrderTracking', backref='order', lazy=True, cascade='all, delete-orphan')
    coupon_usage = db.relationship('CouponUsage', backref='order', uselist=False)


class OrderItem(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = db.Column(db.String(36), db.ForeignKey('order.id', ondelete='CASCADE'), nullable=False)
    product_id = db.Column(db.String(36), db.ForeignKey('product.id'), nullable=False)
    variant_id = db.Column(db.String(36), db.ForeignKey('product_variant.id'), nullable=False)
    size = db.Column(db.String(10), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Float, nullable=False)
    variant = db.relationship('ProductVariant', backref='order_items')

class OrderTracking(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = db.Column(db.String(36), db.ForeignKey('order.id', ondelete='CASCADE'), nullable=False)
    status = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    completed = db.Column(db.Boolean, default=False)

class Favorite(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('user.id'), nullable=False)
    product_id = db.Column(db.String(36), db.ForeignKey('product.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Address(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('user.id'), nullable=False)
    governorate = db.Column(db.String(100))
    district = db.Column(db.String(100))
    details = db.Column(db.Text)
    is_default = db.Column(db.Boolean, default=False)

class Product(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    code = db.Column(db.String(20), unique=True, nullable=False)
    product_number = db.Column(db.Integer, unique=True, nullable=False)
    name = db.Column(db.String(200), nullable=False)
    name_ar = db.Column(db.String(200))
    name_en = db.Column(db.String(200))
    description = db.Column(db.Text)
    description_ar = db.Column(db.Text)
    description_en = db.Column(db.Text)
    category = db.Column(db.String(50), nullable=False)
    base_price = db.Column(db.Float, nullable=False)
    discount_price = db.Column(db.Float)
    tag = db.Column(db.String(50))
    tag_color = db.Column(db.String(50))
    rating = db.Column(db.Float, default=0)
    rating_count = db.Column(db.Integer, default=0)
    status = db.Column(db.String(20), default='active')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    features = db.relationship('ProductFeature', backref='product', lazy=True, cascade='all, delete-orphan')
    variants = db.relationship('ProductVariant', backref='product', lazy=True, cascade='all, delete-orphan')
    views = db.Column(db.Integer, default=0)
    sales_count = db.Column(db.Integer, default=0)


    def to_dict(self):
        name_ar = self.name_ar or self.name
        name_en = self.name_en or self.name
        desc_ar = self.description_ar or self.description
        desc_en = self.description_en or self.description
        features_ar = [f.feature_ar or f.feature for f in self.features]
        features_en = [f.feature_en or f.feature for f in self.features]
        return {
            'id': self.id,
            'name': self.name,
            'nameAr': name_ar,
            'nameEn': name_en,
            'code': self.code,
            'description': self.description,
            'descriptionAr': desc_ar,
            'descriptionEn': desc_en,
            'category': self.category,
            'basePrice': self.base_price,
            'discountPrice': self.discount_price,
            'tag': self.tag,
            'tagColor': self.tag_color,
            'rating': self.rating,
            'ratingCount': self.rating_count,
            'status': self.status,
            'features': features_ar,
            'featuresAr': features_ar,
            'featuresEn': features_en,
            'variants': [{
                'id': v.id,
                'colorName': v.color_name,
                'colorCode': v.color_code,
                'images': [i.image_url for i in v.images],
                'sizes': [{
                    'size': s.size,
                    'inStock': s.in_stock,
                    'quantity': s.quantity
                } for s in v.sizes]
            } for v in self.variants],
            'views': self.views,
            'salesCount': self.sales_count,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None
        }


class ProductFeature(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    product_id = db.Column(db.String(36), db.ForeignKey('product.id', ondelete='CASCADE'), nullable=False)
    feature = db.Column(db.String(200), nullable=False)
    feature_ar = db.Column(db.String(200))
    feature_en = db.Column(db.String(200))

class ProductVariant(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    product_id = db.Column(db.String(36), db.ForeignKey('product.id', ondelete='CASCADE'), nullable=False)
    color_name = db.Column(db.String(50), nullable=False)
    color_code = db.Column(db.String(20), nullable=False)
    images = db.relationship('VariantImage', backref='variant', lazy=True, cascade='all, delete-orphan')
    sizes = db.relationship('VariantSize', backref='variant', lazy=True, cascade='all, delete-orphan')

class VariantImage(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    variant_id = db.Column(db.String(36), db.ForeignKey('product_variant.id', ondelete='CASCADE'), nullable=False)
    image_url = db.Column(db.String(500), nullable=False)

class VariantSize(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    variant_id = db.Column(db.String(36), db.ForeignKey('product_variant.id', ondelete='CASCADE'), nullable=False)
    size = db.Column(db.String(10), nullable=False)
    quantity = db.Column(db.Integer, default=0)
    in_stock = db.Column(db.Boolean, default=True)

class OfferSlide(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = db.Column(db.String(200))
    description = db.Column(db.Text)
    image_url = db.Column(db.String(500), nullable=False)
    product_id = db.Column(db.String(36), db.ForeignKey('product.id'))
    position = db.Column(db.Integer, default=0)
    status = db.Column(db.String(20), default='active')  # active, inactive
    placement = db.Column(db.String(20), default='offer')  # 'hero' = home hero slider, 'offer' = product offer
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Add relationship to Product
    product = db.relationship('Product', backref='slides')

    def to_dict(self):
        """Convert slide object to dictionary"""
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'imageUrl': self.image_url,
            'productId': self.product_id,
            'position': self.position,
            'status': self.status,
            'placement': self.placement or 'offer',
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None,
            'product': self.product.to_dict() if self.product else None
        }

class Coupon(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    code = db.Column(db.String(20), unique=True, nullable=False)
    discount_type = db.Column(db.String(20), nullable=False)  # 'percentage' or 'fixed'
    discount_value = db.Column(db.Float, nullable=False)
    max_uses = db.Column(db.Integer)  # None means unlimited
    used_count = db.Column(db.Integer, default=0)
    start_date = db.Column(db.DateTime, nullable=False)
    end_date = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(20), default='active')  # 'active' or 'inactive'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # For specific user targeting
    specific_users = db.relationship('CouponUser', backref='coupon', lazy=True, cascade='all, delete-orphan')
    # For tracking usage
    usage_history = db.relationship('CouponUsage', backref='coupon', lazy=True)

    def is_valid(self, user_phone=None):
        now = datetime.utcnow()

        # Check basic validity
        if self.status != 'active':
            return False, "الكوبون غير مفعّل"

        if now < self.start_date:
            return False, "لم يتم تفعيل الكوبون بعد"

        if now > self.end_date:
            return False, "انتهت صلاحية الكوبون"

        if self.max_uses and self.used_count >= self.max_uses:
            return False, "تم استنفاذ الحد الأقصى لاستخدام هذا الكوبون"

        # Check user-specific restrictions
        if self.specific_users:
            if not user_phone:
                return False, "هذا الكوبون مخصص لمستخدمين محددين فقط"

            user_coupon = CouponUser.query.filter_by(
                coupon_id=self.id,
                user_phone=user_phone
            ).first()

            if not user_coupon:
                return False, "هذا الكوبون غير صالح للاستخدام"

            if user_coupon.max_uses and user_coupon.used_count >= user_coupon.max_uses:
                return False, "لقد وصلت إلى الحد الأقصى لاستخدام هذا الكوبون"

        return True, "الكوبون صالح للاستخدام"

    def calculate_discount(self, subtotal):
        if self.discount_type == 'percentage':
            return round(subtotal * (self.discount_value / 100), 2)
        return min(self.discount_value, subtotal)  # For fixed discount

class CouponUser(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    coupon_id = db.Column(db.String(36), db.ForeignKey('coupon.id', ondelete='CASCADE'), nullable=False)
    user_phone = db.Column(db.String(20), nullable=False)
    max_uses = db.Column(db.Integer)  # None means unlimited within coupon's global limit
    used_count = db.Column(db.Integer, default=0)

    __table_args__ = (db.UniqueConstraint('coupon_id', 'user_phone'),)

class CouponUsage(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    coupon_id = db.Column(db.String(36), db.ForeignKey('coupon.id'), nullable=False)
    order_id = db.Column(db.String(36), db.ForeignKey('order.id'), nullable=False)
    user_id = db.Column(db.String(36), db.ForeignKey('user.id'), nullable=False)
    discount_amount = db.Column(db.Float, nullable=False)
    used_at = db.Column(db.DateTime, default=datetime.utcnow)


class ContactMessage(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    message = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Category(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    slug = db.Column(db.String(50), unique=True, nullable=False)
    name_ar = db.Column(db.String(200), nullable=False)
    name_en = db.Column(db.String(200), nullable=False)
    sort_order = db.Column(db.Integer, default=0)


# Authentication Decorators
def _extract_bearer_token():
    """Safely extract Bearer token from Authorization header. Returns None if missing/invalid."""
    auth = request.headers.get('Authorization')
    if not auth or not isinstance(auth, str):
        return None
    parts = auth.strip().split()
    return parts[1] if len(parts) == 2 and parts[0].lower() == 'bearer' else None

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = _extract_bearer_token()
        if not token:
            return jsonify({'message': 'Token is missing or invalid format'}), 401
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = db.session.get(User, data['user_id'])
            if not current_user:
                return jsonify({'message': 'Token is invalid'}), 401
        except Exception:
            return jsonify({'message': 'Token is invalid'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = _extract_bearer_token()
        if not token:
            return jsonify({'message': 'Token is missing or invalid format'}), 401
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = db.session.get(User, data['user_id'])
            if not current_user:
                return jsonify({'message': 'Token is invalid'}), 401
            if current_user.role != 'admin':
                return jsonify({'message': 'Admin access required'}), 403
        except Exception:
            return jsonify({'message': 'Token is invalid'}), 401
        return f(current_user, *args, **kwargs)
    return decorated


@app.route('/api/admin/products', methods=['GET'])
@admin_required
def get_admin_products(current_user):
    try:
        # Extract parameters
        search = request.args.get('search')
        code = request.args.get('code')
        category = request.args.get('category')
        sort = request.args.get('sort', 'newest')
        page = max(1, request.args.get('page', 1, type=int))
        per_page = 150

        # Base query with all relationships
        query = Product.query.options(
            joinedload(Product.variants).joinedload(ProductVariant.sizes),
            joinedload(Product.variants).joinedload(ProductVariant.images),
            joinedload(Product.features)
        )

        # Apply search if provided
        if search:
            search_terms = search.split()
            search_filters = []
            for term in search_terms:
                term = f"%{term}%"
                search_filters.append(or_(
                    Product.name.ilike(term),
                    Product.description.ilike(term),
                    Product.description_ar.ilike(term),
                    Product.description_en.ilike(term),
                    Product.code.ilike(term)
                ))
            query = query.filter(and_(*search_filters))

        # Apply code filter if provided
        if code:
            query = query.filter(
                or_(
                    Product.code.ilike(f"%{code}%"),
                    Product.code == f"COD-{code.zfill(6)}" if code.isdigit() else None
                )
            )

        # Apply category filter if provided (skip 'all')
        if category and category != 'all':
            query = query.filter(Product.category == category)

        # Apply sorting
        if sort == 'newest':
            query = query.order_by(desc(Product.created_at))
        elif sort == 'oldest':
            query = query.order_by(asc(Product.created_at))
        elif sort == 'price-asc':
            query = query.order_by(asc(Product.base_price))
        elif sort == 'price-desc':
            query = query.order_by(desc(Product.base_price))
        elif sort == 'views':
            query = query.order_by(desc(Product.views))
        elif sort == 'sales':
            query = query.order_by(desc(Product.sales_count))
        elif sort == 'rating':
            query = query.order_by(desc(Product.rating))
        elif sort == 'product-number':
            query = query.order_by(asc(Product.product_number))

        # Execute paginated query
        paginated_products = query.paginate(page=page, per_page=per_page, error_out=False)

        # Process products
        products_data = []
        for product in paginated_products.items:
            # Get base product data using existing to_dict method
            product_dict = product.to_dict()

            # Add admin-specific data
            additional_data = {
                'productNumber': product.product_number,
                'totalStock': sum(
                    size.quantity
                    for variant in product.variants
                    for size in variant.sizes
                ),
                'lowStockSizes': [
                    {
                        'variantId': variant.id,
                        'colorName': variant.color_name,
                        'size': size.size,
                        'quantity': size.quantity
                    }
                    for variant in product.variants
                    for size in variant.sizes
                    if size.quantity <= 5 and size.in_stock
                ],
                'outOfStockSizes': [
                    {
                        'variantId': variant.id,
                        'colorName': variant.color_name,
                        'size': size.size
                    }
                    for variant in product.variants
                    for size in variant.sizes
                    if size.quantity == 0 or not size.in_stock
                ],
                'orderCount': OrderItem.query.filter_by(product_id=product.id).count(),
                'offerSlides': [
                    {
                        'id': slide.id,
                        'title': slide.title,
                        'status': slide.status,
                        'position': slide.position
                    }
                    for slide in product.slides
                ]
            }
            product_dict.update(additional_data)
            products_data.append(product_dict)

        # Prepare response with summary statistics
        response_data = {
            'products': products_data,
            'total': paginated_products.total,
            'pages': paginated_products.pages,
            'currentPage': page,
            'summary': {
                'totalProducts': Product.query.count(),
                'statusCounts': {
                    'active': Product.query.filter_by(status='active').count(),
                    'inactive': Product.query.filter_by(status='inactive').count(),
                    'outOfStock': Product.query.filter_by(status='out_of_stock').count()
                },
                'totalOrders': db.session.query(func.count(distinct(OrderItem.product_id))).scalar() or 0,
                'lowStockCount': Product.query.join(ProductVariant).join(VariantSize).filter(
                    VariantSize.quantity <= 5,
                    VariantSize.in_stock == True
                ).distinct().count(),
                'activeOfferSlides': OfferSlide.query.filter_by(status='active').count()
            }
        }

        return jsonify(response_data)

    except Exception as e:
        print(f"Error in get_admin_products: {str(e)}")
        return jsonify({'message': 'An error occurred while fetching products'}), 500


def _admin_product_dict(product):
    """Build single product dict in same shape as list item (to_dict + admin extras)."""
    product_dict = product.to_dict()
    additional_data = {
        'productNumber': product.product_number,
        'totalStock': sum(
            size.quantity
            for variant in product.variants
            for size in variant.sizes
        ),
        'lowStockSizes': [
            {'variantId': v.id, 'colorName': v.color_name, 'size': s.size, 'quantity': s.quantity}
            for v in product.variants
            for s in v.sizes
            if s.quantity <= 5 and s.in_stock
        ],
        'outOfStockSizes': [
            {'variantId': v.id, 'colorName': v.color_name, 'size': s.size}
            for v in product.variants
            for s in v.sizes
            if s.quantity == 0 or not s.in_stock
        ],
        'orderCount': OrderItem.query.filter_by(product_id=product.id).count(),
        'offerSlides': [
            {'id': slide.id, 'title': slide.title, 'status': slide.status, 'position': slide.position}
            for slide in product.slides
        ]
    }
    product_dict.update(additional_data)
    return product_dict


@app.route('/api/admin/products/<product_id>', methods=['GET'])
@admin_required
def get_admin_product(current_user, product_id):
    """Return a single product in same shape as list item (for edit/detail)."""
    try:
        product = Product.query.options(
            joinedload(Product.variants).joinedload(ProductVariant.sizes),
            joinedload(Product.variants).joinedload(ProductVariant.images),
            joinedload(Product.features)
        ).get_or_404(product_id)
        return jsonify(_admin_product_dict(product))
    except Exception as e:
        return jsonify({'message': str(e)}), 500


@app.route('/api/admin/products', methods=['POST'])
@admin_required
def create_product(current_user):
    try:
        data = request.json
        product_code = generate_product_code()

        name_val = data.get('name') or data.get('nameEn') or data.get('nameAr') or ''
        desc_ar = data.get('descriptionAr') or data.get('description') or ''
        desc_en = data.get('descriptionEn') or data.get('description') or ''
        product = Product(
            code=product_code[0],
            product_number=product_code[1],
            name=name_val,
            name_ar=data.get('nameAr'),
            name_en=data.get('nameEn'),
            description=desc_ar or desc_en,
            description_ar=desc_ar or None,
            description_en=desc_en or None,
            category=data['category'],
            base_price=float(data['basePrice']),
            discount_price=float(data.get('discountPrice', 0)) or None,
            tag=data.get('tag'),
            tag_color=data.get('tagColor'),
            status=data.get('status', 'active')
        )

        # Add features (dual language or single list for backward compat)
        features_ar = data.get('featuresAr') or data.get('features') or []
        features_en = data.get('featuresEn') or data.get('features') or []
        for ar, en in zip_longest(features_ar, features_en, fillvalue=''):
            ar = (ar or '').strip()
            en = (en or '').strip()
            product.features.append(ProductFeature(
                feature=ar or en or '-',
                feature_ar=ar or None,
                feature_en=en or None
            ))

        # Add variants (without images initially)
        for variant_data in data.get('variants', []):
            variant = ProductVariant(
                color_name=variant_data['colorName'],
                color_code=variant_data['colorCode']
            )

            # Add sizes
            for size_data in variant_data.get('sizes', []):
                quantity = int(size_data['quantity'])
                variant.sizes.append(VariantSize(
                    size=size_data['size'],
                    quantity=quantity,
                    in_stock=quantity > 0
                ))

            product.variants.append(variant)

        db.session.add(product)
        db.session.commit()
        products_cache.clear()

        # Return with product code for subsequent image uploads
        response_data = product.to_dict()
        response_data['code'] = product_code[0]  # Ensure code is included
        return jsonify(response_data), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/products/<product_id>', methods=['PUT'])
@admin_required
def update_product(current_user, product_id):
    try:
        product = Product.query.get_or_404(product_id)
        data = request.json

        # Update basic info
        name_val = data.get('name') or data.get('nameEn') or data.get('nameAr') or ''
        product.name = name_val
        product.name_ar = data.get('nameAr')
        product.name_en = data.get('nameEn')
        desc_ar = data.get('descriptionAr') or data.get('description') or ''
        desc_en = data.get('descriptionEn') or data.get('description') or ''
        product.description = desc_ar or desc_en
        product.description_ar = desc_ar or None
        product.description_en = desc_en or None
        product.category = data['category']
        product.base_price = float(data['basePrice'])
        product.discount_price = float(data.get('discountPrice', 0)) or None
        product.tag = data.get('tag')
        product.tag_color = data.get('tagColor')
        product.status = data.get('status', 'active')

        # Update features (dual language or single list for backward compat)
        product.features.clear()
        features_ar = data.get('featuresAr') or data.get('features') or []
        features_en = data.get('featuresEn') or data.get('features') or []
        for ar, en in zip_longest(features_ar, features_en, fillvalue=''):
            ar = (ar or '').strip()
            en = (en or '').strip()
            product.features.append(ProductFeature(
                feature=ar or en or '-',
                feature_ar=ar or None,
                feature_en=en or None
            ))

        # Update variants
        existing_variants = {v.id: v for v in product.variants}
        updated_variant_ids = set()

        for variant_data in data.get('variants', []):
            variant_id = variant_data.get('id')

            if variant_id in existing_variants:
                # Update existing variant
                variant = existing_variants[variant_id]
                updated_variant_ids.add(variant_id)

                variant.color_name = variant_data['colorName']
                variant.color_code = variant_data['colorCode']

                # Keep track of existing images
                existing_images = {img.image_url for img in variant.images}

                # Update images (keep existing, add new)
                new_images = set(variant_data.get('images', []))

                # Remove images that are no longer present
                variant.images = [img for img in variant.images
                                if img.image_url in new_images]

                # Add new images that weren't present before
                for image_url in new_images - existing_images:
                    variant.images.append(VariantImage(image_url=image_url))

                # Update sizes
                variant.sizes.clear()
                for size_data in variant_data.get('sizes', []):
                    quantity = int(size_data['quantity'])
                    variant.sizes.append(VariantSize(
                        size=size_data['size'],
                        quantity=quantity,
                        in_stock=quantity > 0
                    ))
            else:
                # Add new variant
                new_variant = ProductVariant(
                    color_name=variant_data['colorName'],
                    color_code=variant_data['colorCode']
                )

                # Add images for new variant
                for image_url in variant_data.get('images', []):
                    new_variant.images.append(VariantImage(image_url=image_url))

                # Add sizes for new variant
                for size_data in variant_data.get('sizes', []):
                    quantity = int(size_data['quantity'])
                    new_variant.sizes.append(VariantSize(
                        size=size_data['size'],
                        quantity=quantity,
                        in_stock=quantity > 0
                    ))

                product.variants.append(new_variant)

        # Remove deleted variants (only if not referenced by any order)
        for variant_id in set(existing_variants.keys()) - updated_variant_ids:
            variant = existing_variants[variant_id]
            if variant.order_items:
                db.session.rollback()
                return jsonify({
                    'error': 'Cannot remove variant that is used in existing orders. Variant id: {}'.format(variant_id)
                }), 400
            # Clean up variant images from storage
            for image in variant.images:
                try:
                    image_path = os.path.join(
                        app.config['UPLOAD_FOLDER'],
                        image.image_url.split('/uploads/')[-1]
                    )
                    if os.path.exists(image_path):
                        os.remove(image_path)
                except Exception as e:
                    print(f"Error removing image: {str(e)}")

            db.session.delete(variant)

        db.session.commit()
        products_cache.clear()
        return jsonify(product.to_dict())

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/products/<product_id>', methods=['DELETE'])
@admin_required
def delete_product(current_user, product_id):
    try:
        product = Product.query.get_or_404(product_id)

        # Delete product images
        product_path = os.path.join(app.config['UPLOAD_FOLDER'], product.code)
        if os.path.exists(product_path):
            import shutil
            shutil.rmtree(product_path)

        db.session.delete(product)
        db.session.commit()
        products_cache.clear()

        return jsonify({'message': 'Product deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/products/<product_id>/inventory', methods=['PUT'])
@admin_required
def update_inventory(current_user, product_id):
    try:
        product = Product.query.options(
            joinedload(Product.variants).joinedload(ProductVariant.sizes)
        ).get_or_404(product_id)

        data = request.json
        validate_inventory_data(data)

        update_product_inventory(product, data['variants'])

        db.session.commit()
        products_cache.clear()
        return jsonify({'message': 'Inventory updated successfully'})

    except ValidationError as e:
        return jsonify({'message': str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error updating inventory: {str(e)}'}), 500

@app.route('/uploads/slides/<path:filename>')
def serve_slide(filename):
    try:
        # Remove any 'slides/' prefix if it exists in the filename
        clean_filename = filename.replace('slides/', '')

        # Ensure SLIDES_FOLDER exists
        if not os.path.exists(SLIDES_FOLDER):
            os.makedirs(SLIDES_FOLDER, exist_ok=True)


        response = send_from_directory(SLIDES_FOLDER, clean_filename)

        # Set headers for no caching
        response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, post-check=0, pre-check=0, max-age=0'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '-1'

        return response

    except FileNotFoundError as e:
        return jsonify({'message': 'File not found', 'error': str(e)}), 404
    except Exception as e:
        return jsonify({'message': 'Error serving file', 'error': str(e)}), 500

# Keep the general uploads route for other files
@app.route('/uploads/<path:filename>')
def serve_upload(filename):
    try:
        if filename.startswith('slides/'):
            return serve_slide(filename.replace('slides/', ''))

        response = send_from_directory(app.config['UPLOAD_FOLDER'], filename)
        response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, post-check=0, pre-check=0, max-age=0'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '-1'
        return response

    except FileNotFoundError:
        return jsonify({'message': 'File not found'}), 404


def save_image_with_validation(file, filepath):
    try:
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(filepath), exist_ok=True)

        # Save file directly without modification
        file.save(filepath)

        # Validate if it's an image
        return True if imghdr.what(filepath) else False
    except Exception as e:
        return False

# Product Routes
@app.route('/api/products', methods=['GET'])
def get_products():
    # Extract and validate parameters
    try:
        category = request.args.get('category')
        search = request.args.get('search')
        min_price = request.args.get('minPrice', type=float)
        max_price = request.args.get('maxPrice', type=float)
        size = request.args.get('size')
        color = request.args.get('color')
        code = request.args.get('code')
        sort = request.args.get('sort', 'popular')
        page = max(1, request.args.get('page', 1, type=int))
        per_page = 150  # Limit max items

        # Get user context if available
        current_user = None
        token = _extract_bearer_token()
        if token:
            try:
                data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
                current_user = db.session.get(User, data['user_id'])
            except Exception:
                pass

        # Generate cache key
        cache_key = cache_key_generator(
            'products',
            category=category,
            search=search,
            min_price=min_price,
            max_price=max_price,
            size=size,
            color=color,
            sort=sort,
            page=page,
            per_page=per_page
        )

        # Try to get from cache if no user context (can't cache user-specific data)
        if not current_user:
            cached_data = products_cache.get(cache_key)
            if cached_data:
                return jsonify(cached_data)

        # Base query with optimization
        query = optimize_product_query(
            Product.query.filter_by(status='active')
        )

        # Apply filters efficiently
        if category and category != 'all':
            query = query.filter_by(category=category)

        if search:
            search_terms = search.split()
            search_filters = []
            for term in search_terms:
                term = f"%{term}%"
                search_filters.append(or_(
                    Product.name.ilike(term),
                    Product.description.ilike(term),
                    Product.description_ar.ilike(term),
                    Product.description_en.ilike(term)
                ))
            query = query.filter(and_(*search_filters))

        if code:
            query = query.filter(
                or_(
                    Product.code.ilike(f"%{code}%"),
                    Product.code == f"COD-{code.zfill(6)}" if code.isdigit() else None
                )
            )

        if min_price is not None or max_price is not None:
            price_column = case(
                (Product.discount_price.isnot(None), Product.discount_price),
                else_=Product.base_price
            )
            if min_price is not None:
                query = query.filter(price_column >= min_price)
            if max_price is not None:
                query = query.filter(price_column <= max_price)

        # Optimize size and color filtering (one row per product via subquery; joins can duplicate rows)
        if size or color:
            query = query.join(ProductVariant)
            if size:
                query = query.join(VariantSize).filter(
                    VariantSize.size == size,
                    VariantSize.in_stock == True
                )
            if color:
                query = query.filter(ProductVariant.color_name == color)
            ids_subq = query.with_entities(Product.id).distinct().subquery()
            query = optimize_product_query(Product.query.filter(Product.id.in_(select(ids_subq.c.id))))

        # Apply sorting with indexes
        if sort == 'newest':
            query = query.order_by(desc(Product.created_at))
        elif sort == 'price-asc':
            query = query.order_by(price_column.asc())
        elif sort == 'price-desc':
            query = query.order_by(price_column.desc())
        else:  # popular (default)
            query = query.order_by(desc(Product.sales_count))

        # Execute paginated query efficiently
        paginated_products = query.paginate(page=page, per_page=per_page, error_out=False)

        # Process products
        user_favorites = set()
        if current_user:
            user_favorites = {f.product_id for f in current_user.favorites}

        products_data = []
        for product in paginated_products.items:
            product_dict = product.to_dict()
            product_dict['isFavorite'] = product.id in user_favorites if current_user else False
            products_data.append(product_dict)

        response_data = {
            'products': products_data,
            'total': paginated_products.total,
            'pages': paginated_products.pages,
            'currentPage': page
        }

        # Cache response if no user context
        if not current_user:
            products_cache.put(cache_key, response_data)

        return jsonify(response_data)

    except Exception as e:
        print(f"Error in get_products: {str(e)}")
        return jsonify({'message': 'An error occurred while fetching products'}), 500

@app.route('/api/products/<identifier>', methods=['GET'])
def get_product(identifier):
    """Get product by UUID (id) or by SKU (code). Supports /products/<uuid> and /products/<sku>."""
    try:
        identifier = (identifier or '').strip()
        if not identifier:
            return jsonify({'error': 'Product not found'}), 404
        product = Product.query.options(
            joinedload(Product.variants).joinedload(ProductVariant.images),
            joinedload(Product.variants).joinedload(ProductVariant.sizes)
        ).filter(
            or_(
                Product.id == identifier,
                func.lower(Product.code) == identifier.lower()
            )
        ).first()
        if not product:
            return jsonify({'error': 'Product not found'}), 404

        product.views += 1
        db.session.commit()

        return jsonify(product.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Categories endpoint - reads from Category table with product counts
@app.route('/api/categories', methods=['GET'])
def get_categories():
    """Get all categories from Category table with active product counts. Deduped by (name_ar, name_en) so same label appears once; count = sum of products in all slugs with that name."""
    try:
        categories = Category.query.order_by(Category.sort_order, Category.name_en).all()
        seen = set()
        result = []
        for c in categories:
            key = (c.name_ar or '', c.name_en or '')
            if key in seen:
                continue
            seen.add(key)
            # Count products in this slug and any other slug with same name (so merged display count is correct)
            same_name_slugs = [x.slug for x in categories if (x.name_ar or '') == (c.name_ar or '') and (x.name_en or '') == (c.name_en or '')]
            count = Product.query.filter(Product.category.in_(same_name_slugs), Product.status == 'active').count()
            result.append({
                'id': c.id,
                'slug': c.slug,
                'nameAr': c.name_ar,
                'nameEn': c.name_en,
                'productCount': count
            })
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/categories/<slug>', methods=['GET'])
def get_category(slug):
    """Get category details by slug from Category table"""
    try:
        c = Category.query.filter_by(slug=slug).first()
        if not c:
            return jsonify({'error': 'Category not found'}), 404
        count = Product.query.filter(Product.category == c.slug, Product.status == 'active').count()
        return jsonify({
            'id': c.id,
            'slug': c.slug,
            'nameAr': c.name_ar,
            'nameEn': c.name_en,
            'productCount': count
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Admin categories CRUD
@app.route('/api/admin/categories', methods=['GET'])
@admin_required
def admin_list_categories(current_user):
    """List all categories with product count. Deduped by (name_ar, name_en) so same label appears once."""
    try:
        categories = Category.query.order_by(Category.sort_order, Category.name_en).all()
        seen = set()
        result = []
        for c in categories:
            key = (c.name_ar or '', c.name_en or '')
            if key in seen:
                continue
            seen.add(key)
            same_name_slugs = [x.slug for x in categories if (x.name_ar or '') == (c.name_ar or '') and (x.name_en or '') == (c.name_en or '')]
            count = Product.query.filter(Product.category.in_(same_name_slugs)).count()
            result.append({
                'id': c.id,
                'slug': c.slug,
                'nameAr': c.name_ar,
                'nameEn': c.name_en,
                'sortOrder': c.sort_order,
                'productCount': count
            })
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/admin/categories', methods=['POST'])
@admin_required
def admin_create_category(current_user):
    """Create a category. Slug must be unique."""
    try:
        data = request.get_json() or {}
        slug = (data.get('slug') or '').strip().lower().replace(' ', '_')
        name_ar = (data.get('nameAr') or '').strip()
        name_en = (data.get('nameEn') or '').strip()
        sort_order = data.get('sortOrder')
        if sort_order is None:
            sort_order = 0
        try:
            sort_order = int(sort_order)
        except (TypeError, ValueError):
            sort_order = 0
        if not slug:
            return jsonify({'error': 'Slug is required'}), 400
        if not name_ar or not name_en:
            return jsonify({'error': 'nameAr and nameEn are required'}), 400
        if Category.query.filter_by(slug=slug).first():
            return jsonify({'error': 'Category with this slug already exists'}), 400
        c = Category(slug=slug, name_ar=name_ar, name_en=name_en, sort_order=sort_order)
        db.session.add(c)
        db.session.commit()
        return jsonify({
            'id': c.id,
            'slug': c.slug,
            'nameAr': c.name_ar,
            'nameEn': c.name_en,
            'sortOrder': c.sort_order,
            'productCount': 0
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/admin/categories/<category_id>', methods=['PUT'])
@admin_required
def admin_update_category(current_user, category_id):
    """Update a category. If slug changes, optionally update Product.category for products using old slug."""
    try:
        c = db.session.get(Category, category_id)
        if not c:
            return jsonify({'error': 'Category not found'}), 404
        data = request.get_json() or {}
        old_slug = c.slug
        slug = (data.get('slug') or '').strip().lower().replace(' ', '_')
        if slug:
            c.slug = slug
        name_ar = data.get('nameAr')
        if name_ar is not None:
            c.name_ar = (name_ar or '').strip()
        name_en = data.get('nameEn')
        if name_en is not None:
            c.name_en = (name_en or '').strip()
        sort_order = data.get('sortOrder')
        if sort_order is not None:
            try:
                c.sort_order = int(sort_order)
            except (TypeError, ValueError):
                pass
        if slug and slug != old_slug:
            if Category.query.filter(Category.slug == slug, Category.id != category_id).first():
                db.session.rollback()
                return jsonify({'error': 'Another category with this slug already exists'}), 400
            Product.query.filter_by(category=old_slug).update({Product.category: slug})
            products_cache.clear()
        db.session.commit()
        count = Product.query.filter_by(category=c.slug).count()
        return jsonify({
            'id': c.id,
            'slug': c.slug,
            'nameAr': c.name_ar,
            'nameEn': c.name_en,
            'sortOrder': c.sort_order,
            'productCount': count
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/admin/categories/<category_id>', methods=['DELETE'])
@admin_required
def admin_delete_category(current_user, category_id):
    """Delete category only if no products use it."""
    try:
        c = db.session.get(Category, category_id)
        if not c:
            return jsonify({'error': 'Category not found'}), 404
        count = Product.query.filter_by(category=c.slug).count()
        if count > 0:
            return jsonify({'error': f'Cannot delete: {count} product(s) use this category'}), 400
        db.session.delete(c)
        db.session.commit()
        return jsonify({'message': 'Category deleted'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/admin/products/upload-images', methods=['POST'])
@admin_required
def upload_product_images(current_user):
    try:
        product_code = request.form.get('productCode')
        color_name = request.form.get('colorName')

        if not product_code or not color_name:
            return jsonify({'error': 'Product code and color name are required'}), 400

        if 'image' not in request.files:
            return jsonify({'error': 'No image provided'}), 400

        file = request.files['image']
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file format'}), 400

        # Create safe color name for file path
        safe_color = secure_filename(color_name.lower())

        # Create upload directory structure (products subfolder)
        products_path = os.path.join(app.config['UPLOAD_FOLDER'], 'products')
        os.makedirs(products_path, exist_ok=True)

        # Generate unique filename (allow multiple images per variant)
        ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else 'jpg'
        filename = f"{product_code}_{safe_color}_{uuid.uuid4().hex[:8]}.{ext}"
        filepath = os.path.join(products_path, filename)

        # Save and validate image
        if save_image_with_validation(file, filepath):
            relative_path = os.path.join('products', filename)
            image_url = f'{request.host_url.rstrip("/")}/uploads/{relative_path}'

            # Update product variant with new image URL
            product = Product.query.filter_by(code=product_code).first()
            if product:
                for variant in product.variants:
                    if variant.color_name.lower() == color_name.lower():
                        variant.images.append(VariantImage(image_url=image_url))
                        db.session.commit()
                        products_cache.clear()
                        break

            return jsonify({'imageUrls': [image_url]})

        return jsonify({'error': 'Failed to save image'}), 500

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# Helper functions
class ValidationError(Exception):
    pass

def validate_inventory_data(data):
    if 'variants' not in data:
        raise ValidationError('Missing variants data')

    for variant in data['variants']:
        if 'id' not in variant or 'sizes' not in variant:
            raise ValidationError('Invalid variant data')

        for size in variant['sizes']:
            if not all(k in size for k in ['size', 'quantity']):
                raise ValidationError('Invalid size data')


def generate_product_code():
    last_product = Product.query.order_by(Product.product_number.desc()).first()
    next_number = 1 if not last_product else last_product.product_number + 1
    return f"COD-{str(next_number).zfill(6)}", next_number

def update_product_inventory(product, variants_data):
    variant_dict = {v.id: v for v in product.variants}

    for variant_data in variants_data:
        variant = variant_dict.get(variant_data['id'])
        if not variant:
            continue

        size_dict = {s.size: s for s in variant.sizes}
        for size_data in variant_data['sizes']:
            size = size_dict.get(size_data['size'])
            if size:
                quantity = int(size_data['quantity'])
                size.quantity = quantity
                size.in_stock = quantity > 0


def allowed_file(filename):
    if not filename or not isinstance(filename, str):
        return False
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Error handlers
@app.errorhandler(413)
def request_entity_too_large(error):
    return jsonify({
        'message': f'File size exceeds the {MAX_CONTENT_LENGTH / (1024 * 1024)}MB limit'
    }), 413

@app.errorhandler(500)
def internal_server_error(error):
    return jsonify({
        'message': f'An internal {error} occurred'
    }), 500


# Customer Management Routes
@app.route('/api/admin/customers', methods=['GET'])
@admin_required
def get_customers(current_user):
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('perPage', 20, type=int)
    search = request.args.get('search')

    query = User.query.filter_by(role='user')

    if search:
        search_term = f"%{search}%"
        query = query.filter(or_(
            User.name.ilike(search_term),
            User.phone.ilike(search_term)
        ))

    customers = query.paginate(page=page, per_page=per_page, error_out=False)

    # Exclude cancelled orders from totals (customer didn't pay; order.total already includes coupon discount)
    def _paid_orders(orders):
        return [o for o in orders if o.status != 'cancelled']

    return jsonify({
        'customers': [{
            'id': user.id,
            'name': user.name,
            'phone': user.phone,
            'createdAt': user.created_at.isoformat(),
            'orderCount': len(_paid_orders(user.orders)),
            'totalSpent': round(sum(o.total for o in _paid_orders(user.orders)), 2),
            'addresses': [{
                'governorate': addr.governorate,
                'district': addr.district,
                'details':addr.details
            } for addr in user.addresses]
        } for user in customers.items],
        'total': customers.total,
        'pages': customers.pages,
        'currentPage': page
    })


@app.route('/api/admin/customers/<customer_id>', methods=['GET'])
@admin_required
def get_single_customer(current_user, customer_id):
    user = User.query.filter_by(id=customer_id, role='user').first_or_404()

    def _paid_orders(orders):
        return [o for o in orders if o.status != 'cancelled']

    return jsonify({
        'id': user.id,
        'name': user.name,
        'phone': user.phone,
        'createdAt': user.created_at.isoformat(),
        'orderCount': len(_paid_orders(user.orders)),
        'totalSpent': round(sum(o.total for o in _paid_orders(user.orders)), 2),
        'addresses': [{
            'governorate': addr.governorate,
            'district': addr.district,
            'details': addr.details
        } for addr in user.addresses]
    })


# ----------------------------- Offer Slides -----------------------------

class SlideImageHandler:
    @staticmethod
    def generate_unique_filename(original_filename, slide_id=None):
        """Generate a unique filename for slide images"""
        ext = os.path.splitext(original_filename)[1].lower()
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        unique_id = slide_id or str(uuid.uuid4())[:8]
        return f"slide_{unique_id}_{timestamp}{ext}"

    @staticmethod
    def get_file_path(filename):
        """Get the full file path for a slide image"""
        return os.path.join(SLIDES_FOLDER, filename)

    @staticmethod
    def get_image_url(filename):
        """Generate the public URL for a slide image"""
        return f'{UPLOAD_URL_PREFIX}slides/{filename}'

    @staticmethod
    def validate_image(file):
        """Validate image file type and content"""
        if not file or not file.filename:
            return False, "No file selected"

        # Check file extension
        ext = os.path.splitext(file.filename)[1].lower()[1:]
        if ext not in ALLOWED_EXTENSIONS:
            return False, f"File type not allowed. Supported types: {', '.join(ALLOWED_EXTENSIONS)}"

        return True, None

    @staticmethod
    def save_image(file, filename):
        """Save image file with validation"""
        # Ensure slides directory exists
        os.makedirs(SLIDES_FOLDER, exist_ok=True)

        file_path = SlideImageHandler.get_file_path(filename)
        file.save(file_path)

        # Verify saved file is actually an image
        if not imghdr.what(file_path):
            os.remove(file_path)
            return False, "Invalid image file"

        return True, file_path

    @staticmethod
    def delete_image(image_url):
        """Safely delete an image file"""
        if image_url and image_url.startswith(UPLOAD_URL_PREFIX):
            # Extract filename from URL
            filename = image_url.split('/')[-1]
            file_path = SlideImageHandler.get_file_path(filename)
            if os.path.exists(file_path):
                os.remove(file_path)

class SlideManager:
    @staticmethod
    def validate_slide_data(form_data):
        """Validate required slide data. Title is required; productId is optional for both hero and offer."""
        if not form_data.get('title', '').strip():
            return False, "Missing required field: title"
        return True, None

    @staticmethod
    def get_next_position():
        """Get the next available position for a new slide"""
        max_position = db.session.query(func.max(OfferSlide.position)).scalar() or -1
        return max_position + 1

    @staticmethod
    def create_slide_object(form_data, image_url):
        """Create a new OfferSlide object"""
        pid = form_data.get('productId')
        placement = (form_data.get('placement') or 'offer').lower()
        if placement == 'hero':
            placement = 'offer'
        return OfferSlide(
            id=str(uuid.uuid4()),
            title=form_data['title'],
            description=form_data.get('description', ''),
            image_url=image_url,
            product_id=pid if pid else None,
            position=SlideManager.get_next_position(),
            status='active',
            placement=placement
        )

    @staticmethod
    def update_slide_object(slide, form_data, image_url=None):
        """Update an existing OfferSlide object"""
        if 'title' in form_data:
            slide.title = form_data['title']
        if 'description' in form_data:
            slide.description = form_data['description']
        if 'productId' in form_data:
            slide.product_id = form_data['productId']
        if 'position' in form_data:
            new_position = int(form_data['position'])
            if new_position != slide.position:
                SlideManager.reorder_slides(slide, new_position)
        if 'status' in form_data:
            slide.status = form_data['status']
        if 'placement' in form_data:
            p = (form_data['placement'] or 'offer').lower()
            slide.placement = 'offer' if p == 'hero' else (p if p == 'offer' else 'offer')
        if image_url:
            slide.image_url = image_url

    @staticmethod
    def reorder_slides(slide, new_position):
        """Reorder slides when position changes"""
        current_position = slide.position
        slides = OfferSlide.query.filter(OfferSlide.id != slide.id).order_by(OfferSlide.position).all()

        if new_position < current_position:
            # Moving up - shift affected slides down
            for s in slides:
                if current_position > s.position >= new_position:
                    s.position += 1
        else:
            # Moving down - shift affected slides up
            for s in slides:
                if current_position < s.position <= new_position:
                    s.position -= 1

        slide.position = new_position


def _ensure_offer_slide_placement_column():
    """Add placement column to offer_slide if missing (hero vs offer slides)."""
    with app.app_context():
        try:
            res = db.session.execute(text("PRAGMA table_info(offer_slide)"))
            cols = [row[1] for row in res.fetchall()]
            if cols is not None and 'placement' not in cols:
                db.session.execute(text("ALTER TABLE offer_slide ADD COLUMN placement VARCHAR(20) DEFAULT 'offer'"))
                db.session.commit()
        except Exception:
            db.session.rollback()


@app.route('/api/admin/slides', methods=['GET'])
@admin_required
def get_slides(current_user):
    slides = OfferSlide.query.order_by(OfferSlide.position).all()
    return jsonify([{
        'id': slide.id,
        'title': slide.title,
        'description': slide.description,
        'imageUrl': slide.image_url,
        'productId': slide.product_id,
        'position': slide.position,
        'status': slide.status,
        'placement': getattr(slide, 'placement', None) or 'offer'
    } for slide in slides])


# Route handlers
@app.route('/api/admin/slides', methods=['POST'])
@admin_required
def create_slide(current_user):
    try:
        # Validate request content type
        if not request.content_type or not request.content_type.startswith('multipart/form-data'):
            return jsonify({'message': 'Invalid request. Expected multipart/form-data'}), 400

        # Validate form data
        valid, error_message = SlideManager.validate_slide_data(request.form)
        if not valid:
            return jsonify({'message': error_message}), 400

        # Validate and save image
        if 'image' not in request.files:
            return jsonify({'message': 'No image file provided'}), 400

        file = request.files['image']
        valid, error_message = SlideImageHandler.validate_image(file)
        if not valid:
            return jsonify({'message': error_message}), 400

        # Generate unique filename and save image
        filename = SlideImageHandler.generate_unique_filename(file.filename)
        success, result = SlideImageHandler.save_image(file, filename)
        if not success:
            return jsonify({'message': result}), 400

        # Create slide object
        image_url = SlideImageHandler.get_image_url(filename)
        new_slide = SlideManager.create_slide_object(request.form, image_url)

        try:
            db.session.add(new_slide)
            db.session.commit()
            slides_cache.clear()  # Clear cache after modification

            return jsonify(new_slide.to_dict()), 201

        except Exception as e:
            db.session.rollback()
            SlideImageHandler.delete_image(image_url)
            raise e

    except RequestEntityTooLarge:
        return jsonify({
            'message': f'File size exceeds the {MAX_CONTENT_LENGTH / (1024 * 1024)}MB limit'
        }), 413
    except Exception as e:
        return jsonify({'message': f'Error creating slide: {str(e)}'}), 500

@app.route('/api/admin/slides/<slide_id>', methods=['PUT'])
@admin_required
def update_slide(current_user, slide_id):
    try:
        slide = OfferSlide.query.get_or_404(slide_id)
        content_type = request.headers.get('Content-Type', '')
        old_image_url = slide.image_url

        if content_type.startswith('multipart/form-data'):
            form_data = request.form
            if 'image' in request.files:
                file = request.files['image']
                valid, error_message = SlideImageHandler.validate_image(file)
                if not valid:
                    return jsonify({'message': error_message}), 400

                # Save new image
                filename = SlideImageHandler.generate_unique_filename(file.filename, slide_id)
                success, result = SlideImageHandler.save_image(file, filename)
                if not success:
                    return jsonify({'message': result}), 400

                # Update slide with new image
                new_image_url = SlideImageHandler.get_image_url(filename)
                SlideManager.update_slide_object(slide, form_data, new_image_url)

                # Delete old image after successful update
                SlideImageHandler.delete_image(old_image_url)
            else:
                SlideManager.update_slide_object(slide, form_data)
        else:
            # Handle JSON data
            SlideManager.update_slide_object(slide, request.get_json())

        db.session.commit()
        slides_cache.clear()  # Clear cache after modification

        return jsonify(slide.to_dict())

    except RequestEntityTooLarge:
        return jsonify({
            'message': f'File size exceeds the {MAX_CONTENT_LENGTH / (1024 * 1024)}MB limit'
        }), 413
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error updating slide: {str(e)}'}), 500

@app.route('/api/admin/slides/<slide_id>', methods=['DELETE'])
@admin_required
def delete_slide(current_user, slide_id):
    try:
        slide = OfferSlide.query.get_or_404(slide_id)

        # Delete image file
        SlideImageHandler.delete_image(slide.image_url)

        # Delete slide from database
        db.session.delete(slide)
        db.session.commit()
        slides_cache.clear()  # Clear cache after modification

        return jsonify({'message': 'Slide deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error deleting slide: {str(e)}'}), 500

# Public endpoint for active slides (all; used for home hero and product offers)
@app.route('/api/slides', methods=['GET'])
def get_public_slides():
    try:
        cached_slides = slides_cache.get('active_slides')
        if cached_slides:
            return jsonify(cached_slides)

        slides = OfferSlide.query.filter_by(
            status='active'
        ).options(
            joinedload(OfferSlide.product).joinedload(Product.variants).joinedload(ProductVariant.images),
            joinedload(OfferSlide.product).joinedload(Product.variants).joinedload(ProductVariant.sizes),
            joinedload(OfferSlide.product).joinedload(Product.features)
        ).order_by(
            OfferSlide.position
        ).all()

        slides_data = [{
            'id': slide.id,
            'title': slide.title,
            'description': slide.description,
            'imageUrl': slide.image_url,
            'product': slide.product.to_dict() if slide.product else None
        } for slide in slides]

        slides_cache.put('active_slides', slides_data)
        return jsonify(slides_data)

    except Exception as e:
        print(f"Error in get_public_slides: {str(e)}")
        return jsonify({'message': 'An error occurred while fetching slides'}), 500


# ----------------------------- Authentication Routes -----------------------------
@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json(silent=True) or {}
        phone = data.get('phone')

        if not phone:
            return jsonify({'message': 'Phone number is required'}), 400

        # Find or create user
        user = User.query.filter_by(phone=phone).first()
        if not user:
            user = User(phone=phone, role='admin' if phone == '0000000000' else 'user')
            db.session.add(user)
            db.session.commit()
        elif phone == '0000000000' and user.role != 'admin':
            user.role = 'admin'
            db.session.commit()

        # Generate token (ensure string for JSON)
        payload = {
            'user_id': user.id,
            'exp': datetime.utcnow() + timedelta(days=30)
        }
        token = jwt.encode(payload, app.config['SECRET_KEY'], algorithm="HS256")
        if hasattr(token, 'decode'):
            token = token.decode('utf-8')

        created_at = user.created_at
        created_str = created_at.isoformat() if created_at else datetime.utcnow().isoformat()

        return jsonify({
            'token': str(token),
            'user': {
                'id': str(user.id),
                'phone': user.phone,
                'name': user.name,
                'role': user.role or 'user',
                'isProfileComplete': bool(user.name),
                'createdAt': created_str
            }
        })
    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({'message': str(e)}), 500


# ----------------------------- Profile Routes -----------------------------
@app.route('/api/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    orders_count = len(current_user.orders)
    favorites_count = len(current_user.favorites)

    return jsonify({
        'id': current_user.id,
        'phone': current_user.phone,
        'name': current_user.name,
        'role': current_user.role or 'user',
        'ordersCount': orders_count,
        'favoritesCount': favorites_count,
        'addresses': [{
            'id': addr.id,
            'governorate': addr.governorate,
            'district': addr.district,
            'details': addr.details,
            'is_default': addr.is_default
        } for addr in current_user.addresses]
    })

@app.route('/api/profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    data = request.get_json(silent=True) or {}

    if 'name' in data:
        current_user.name = data['name']

    db.session.commit()

    return jsonify({
        'message': 'Profile updated successfully',
        'user': {
            'id': current_user.id,
            'phone': current_user.phone,
            'name': current_user.name
        }
    })


# ----------------------------- Address Routes -----------------------------
@app.route('/api/addresses', methods=['POST'])
@token_required
def add_address(current_user):
    data = request.get_json(silent=True)
    if not data or not isinstance(data, dict):
        return jsonify({'message': 'Invalid request body'}), 400
    if not data.get('governorate') or not data.get('district') or not data.get('details'):
        return jsonify({'message': 'governorate, district and details are required'}), 400

    # If this is the first address, make it default
    is_default = len(current_user.addresses) == 0

    new_address = Address(
        user_id=current_user.id,
        governorate=data['governorate'],
        district=data['district'],
        details=data['details'],
        is_default=is_default
    )

    db.session.add(new_address)
    db.session.commit()

    return jsonify({
        'message': 'Address added successfully',
        'address': {
            'id': new_address.id,
            'governorate': new_address.governorate,
            'district': new_address.district,
            'details': new_address.details,
            'is_default': new_address.is_default
        }
    }), 201

@app.route('/api/addresses/<address_id>', methods=['PUT'])
@token_required
def update_address(current_user, address_id):
    address = Address.query.get_or_404(address_id)

    # Verify address belongs to user
    if address.user_id != current_user.id:
        return jsonify({'message': 'Address not found'}), 404

    data = request.get_json(silent=True) or {}

    if 'governorate' in data:
        address.governorate = data['governorate']
    if 'district' in data:
        address.district = data['district']
    if 'details' in data:
        address.details = data['details']

    # Handle default address setting
    if data.get('is_default', False):
        # Remove default from other addresses
        for addr in current_user.addresses:
            addr.is_default = False
        address.is_default = True

    db.session.commit()

    return jsonify({
        'message': 'Address updated successfully',
        'address': {
            'id': address.id,
            'governorate': address.governorate,
            'district': address.district,
            'details': address.details,
            'is_default': address.is_default
        }
    })

@app.route('/api/addresses/<address_id>', methods=['DELETE'])
@token_required
def delete_address(current_user, address_id):
    address = Address.query.get_or_404(address_id)

    # Verify address belongs to user
    if address.user_id != current_user.id:
        return jsonify({'message': 'Address not found'}), 404

    was_default = address.is_default
    db.session.delete(address)

    # If deleted address was default and other addresses exist, make another one default
    if was_default:
        other_address = Address.query.filter_by(user_id=current_user.id).first()
        if other_address:
            other_address.is_default = True

    db.session.commit()

    return jsonify({'message': 'Address deleted successfully'})


# ----------------------------- Favorites Routes -----------------------------
@app.route('/api/favorites', methods=['POST'])
@token_required
def toggle_favorite(current_user):
    data = request.get_json(silent=True)
    if not data or not isinstance(data, dict):
        return jsonify({'message': 'Invalid request body'}), 400
    product_id = data.get('product_id')

    if not product_id:
        return jsonify({'message': 'Product ID is required'}), 400

    # Check if product exists
    product = Product.query.get_or_404(product_id)

    # Check if already favorited
    existing_favorite = Favorite.query.filter_by(
        user_id=current_user.id,
        product_id=product_id
    ).first()

    if existing_favorite:
        db.session.delete(existing_favorite)
        message = 'Product removed from favorites'
    else:
        new_favorite = Favorite(
            user_id=current_user.id,
            product_id=product_id
        )
        db.session.add(new_favorite)
        message = 'Product added to favorites'

    db.session.commit()

    return jsonify({'message': message})

@app.route('/api/favorites', methods=['GET'])
@token_required
def get_favorites(current_user):
    try:
        page = max(1, request.args.get('page', 1, type=int))
        per_page = min(50, request.args.get('perPage', 20, type=int))

        # Optimize query with joins and eager loading
        favorites = db.session.query(Product).options(
            joinedload(Product.variants).joinedload(ProductVariant.images),
            joinedload(Product.variants).joinedload(ProductVariant.sizes),
            joinedload(Product.features)
        ).join(
            Favorite
        ).filter(
            Favorite.user_id == current_user.id
        ).order_by(
            desc(Favorite.created_at)
        ).paginate(page=page, per_page=per_page, error_out=False)

        return jsonify({
            'favorites': [product.to_dict() for product in favorites.items],
            'total': favorites.total,
            'pages': favorites.pages,
            'currentPage': page
        })

    except Exception as e:
        print(f"Error in get_favorites: {str(e)}")
        return jsonify({'message': 'An error occurred while fetching favorites'}), 500

@app.route('/api/favorites/<product_id>/status', methods=['GET'])
@token_required
def get_favorite_status(current_user, product_id):
    try:
        # Check if product exists
        product = Product.query.get_or_404(product_id)

        # Check if product is in user's favorites
        is_favorite = Favorite.query.filter_by(
            user_id=current_user.id,
            product_id=product_id
        ).first() is not None

        return jsonify({
            'isFavorite': is_favorite,
            'productId': product_id
        })

    except Exception as e:
        print(f"Error in get_favorite_status: {str(e)}")
        return jsonify({'message': 'An error occurred while checking favorite status'}), 500


# ----------------------------- Order Routes -----------------------------
@app.route('/api/admin/orders', methods=['GET'])
@admin_required
def get_orders(current_user):
    start_dt = None
    end_dt = None
    start_date = request.args.get('startDate')
    end_date = request.args.get('endDate')
    if start_date and start_date.lower() != 'null':
        try:
            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        except (ValueError, TypeError):
            return jsonify({'message': 'Invalid startDate format. Use ISO 8601.'}), 400
    if end_date and end_date.lower() != 'null':
        try:
            end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        except (ValueError, TypeError):
            return jsonify({'message': 'Invalid endDate format. Use ISO 8601.'}), 400
    try:
        return _get_orders_impl(start_dt=start_dt, end_dt=end_dt)
    except Exception as e:
        app.logger.exception('GET /api/admin/orders failed')
        return jsonify({'message': 'An error occurred while fetching orders', 'error': str(e)}), 500


def _serialize_order_for_admin(order):
    """Serialize a single order for admin (same shape as list item)."""
    user = order.user
    order_data = {
        'id': order.id,
        'userId': order.user_id,
        'userName': user.name if user else None,
        'userPhone': user.phone if user else None,
        'total': order.total,
        'subtotal': sum(item.quantity * item.price for item in order.items),
        'shipping': order.shipping,
        'status': order.status,
        'createdAt': order.created_at.isoformat() if order.created_at else None,
        'items': [],
        'tracking': [{
            'status': step.status,
            'description': step.description,
            'timestamp': step.timestamp.isoformat() if step.timestamp else None,
            'completed': step.completed
        } for step in order.tracking_steps]
    }
    for item in order.items:
        variant = db.session.get(ProductVariant, item.variant_id)
        if variant and variant.product:
            order_data['items'].append({
                'productName': variant.product.name,
                'variant': variant.color_name,
                'size': item.size,
                'quantity': item.quantity,
                'price': item.price,
                'image': variant.images[0].image_url if variant.images else None
            })
    return order_data


def _get_orders_impl(start_dt=None, end_dt=None):
    # Extract filter parameters
    status = request.args.get('status')
    search = request.args.get('search')
    user_id = request.args.get('userId')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('perPage', 20, type=int)

    query = Order.query

    # Apply filters
    if user_id:
        query = query.filter(Order.user_id == user_id)

    if status and status != 'all':
        query = query.filter_by(status=status)

    if start_dt is not None:
        query = query.filter(Order.created_at >= start_dt)

    if end_dt is not None:
        query = query.filter(Order.created_at <= end_dt)

    if search:
        search_term = f"%{search}%"
        query = query.join(User).filter(or_(
            User.name.ilike(search_term),
            User.phone.ilike(search_term),
            Order.id.ilike(search_term)
        ))

    # Sort by creation date, newest first
    query = query.order_by(desc(Order.created_at))

    # Paginate results
    paginated_orders = query.paginate(page=page, per_page=per_page, error_out=False)

    orders_response = [_serialize_order_for_admin(order) for order in paginated_orders.items]

    return jsonify({
        'orders': orders_response,
        'total': paginated_orders.total,
        'pages': paginated_orders.pages,
        'currentPage': page
    })


@app.route('/api/admin/orders/<order_id>', methods=['GET'])
@admin_required
def get_single_order(current_user, order_id):
    order = Order.query.get_or_404(order_id)
    return jsonify(_serialize_order_for_admin(order))


@app.route('/api/admin/orders/<order_id>/status', methods=['PUT'])
@admin_required
def update_order_status(current_user, order_id):
    order = Order.query.get_or_404(order_id)
    data = request.get_json(silent=True)
    if not data or not isinstance(data, dict):
        return jsonify({'message': 'Invalid request body'}), 400

    # Check if status is provided
    if 'status' not in data:
        return jsonify({'message': 'Status is required'}), 400

    status = data['status']
    allowed_statuses = ('pending', 'processing', 'shipped', 'delivered', 'cancelled')
    if status not in allowed_statuses:
        return jsonify({'message': f'Invalid status. Must be one of: {", ".join(allowed_statuses)}'}), 400

    # Define descriptions based on status
    status_descriptions = {
        'pending': 'تم استلام طلبك بنجاح',
        'processing': 'الطلب قيد المعالجة',
        'shipped': 'تم شحن الطلب',
        'delivered': 'تم تسليم الطلب',
        'cancelled': 'تم إلغاء الطلب بواسطة العميل'
    }

    # Determine if the task is completed based on status
    completed = status in ['delivered', 'cancelled']

    # Check the most recent tracking step
    if order.tracking_steps and order.tracking_steps[-1].status == status:
        return jsonify({
            'message': 'No changes made as the status is already set to the requested value',
            'status': order.status
        })

    # Create new tracking step if status is different
    tracking = OrderTracking(
        order_id=order.id,
        status=status,
        description=status_descriptions.get(status, 'حالة غير معروفة'),
        completed=completed
    )
    order.tracking_steps.append(tracking)

    # Update order status
    order.status = status

    db.session.commit()

    return jsonify({
        'message': 'Order status updated successfully',
        'status': order.status
    })

@app.route('/api/orders', methods=['POST'])
@token_required
def create_order(current_user):
    data = request.get_json(silent=True)
    if not data or not isinstance(data, dict):
        return jsonify({'message': 'Invalid request body'}), 400
    if 'items' not in data:
        return jsonify({'message': 'Items are required'}), 400
    if not isinstance(data['items'], list) or len(data['items']) == 0:
        return jsonify({'message': 'At least one item is required'}), 400

    # Start a new transaction
    db.session.begin_nested()

    try:
        # Validate inventory and calculate totals with proper locking
        items = []
        subtotal = 0
        inventory_updates = []

        for item_data in data['items']:
            # Lock the variant and size records for update using updated syntax
            variant = db.session.get(ProductVariant, item_data['variant_id'], with_for_update=True)
            if not variant:
                db.session.rollback()
                return jsonify({'message': 'Product variant not found'}), 404

            size_val = item_data.get('size')
            if size_val is None or (isinstance(size_val, str) and not str(size_val).strip()):
                # Optional size: infer when variant has exactly one size
                variant_sizes = db.session.query(VariantSize).with_for_update().filter_by(
                    variant_id=variant.id
                ).all()
                if len(variant_sizes) == 0:
                    db.session.rollback()
                    return jsonify({'message': 'Variant has no sizes'}), 400
                if len(variant_sizes) > 1:
                    db.session.rollback()
                    return jsonify({'message': 'Size is required when variant has multiple sizes'}), 400
                size = variant_sizes[0]
            else:
                size = db.session.query(VariantSize).with_for_update().filter_by(
                    variant_id=variant.id,
                    size=size_val
                ).first()
                if not size:
                    db.session.rollback()
                    return jsonify({'message': 'Size not found'}), 404

            # Check inventory
            if not size.in_stock or size.quantity < item_data['quantity']:
                db.session.rollback()
                return jsonify({
                    'message': f'Insufficient inventory for {variant.product.name}'
                }), 400

            # Calculate price
            price = (variant.product.discount_price or variant.product.base_price)
            subtotal += price * item_data['quantity']

            items.append({
                'variant': variant,
                'size': size,
                'quantity': item_data['quantity'],
                'price': price
            })

            # Update inventory immediately
            size.quantity -= item_data['quantity']
            size.in_stock = size.quantity > 0

            # Update product sales count
            variant.product.sales_count += item_data['quantity']

        # Calculate shipping
        shipping = 0 if subtotal > 500 else 25

        # Handle coupon and calculate discount
        discount = 0
        coupon_details = None
        coupon = None
        coupon_code = data.get('coupon')

        # Get or validate address
        address_id = data.get('addressId')
        if not address_id:
            default_address = Address.query.filter_by(
                user_id=current_user.id,
                is_default=True
            ).first() or Address.query.filter_by(
                user_id=current_user.id
            ).first()

            if not default_address:
                db.session.rollback()
                return jsonify({
                    'message': 'No delivery address found. Please add an address.'
                }), 400

            address_id = default_address.id
        else:
            # Use updated syntax for getting address
            address = db.session.get(Address, address_id)
            if not address or address.user_id != current_user.id:
                db.session.rollback()
                return jsonify({
                    'message': 'Invalid address selected'
                }), 400

        # Create order first
        new_order = Order(
            user_id=current_user.id,
            total=subtotal + shipping,  # We'll update this after coupon
            shipping=shipping,
            discount=0,  # We'll update this after coupon
            payment_method=data.get('paymentMethod', 'cod'),
            address_id=address_id,
            status='pending'
        )

        # Add order items
        for item in items:
            order_item = OrderItem(
                product_id=item['variant'].product.id,
                variant_id=item['variant'].id,
                size=item['size'].size,
                quantity=item['quantity'],
                price=item['price']
            )
            new_order.items.append(order_item)

        # Add initial tracking step
        tracking = OrderTracking(
            status='pending',
            description='تم استلام طلبك بنجاح',
            completed=False
        )
        new_order.tracking_steps.append(tracking)

        # Add order to session and flush to get ID
        db.session.add(new_order)
        db.session.flush()

        # Now handle coupon after order is created and has an ID
        if coupon_code:
            # Find and validate coupon with lock
            coupon = Coupon.query.filter_by(code=coupon_code.upper()).with_for_update().first()
            if not coupon:
                db.session.rollback()
                return jsonify({'message': 'هذا الكوبون غير صالح للاستخدام'}), 400

            # Check coupon validity
            is_valid, message = coupon.is_valid(current_user.phone)
            if not is_valid:
                db.session.rollback()
                return jsonify({'message': message}), 400

            # Calculate discount
            discount = coupon.calculate_discount(subtotal)

            # Update order with discount
            new_order.discount = discount
            new_order.total = subtotal + shipping - discount

            # Set coupon details for response
            coupon_details = {
                'code': coupon.code,
                'discountType': coupon.discount_type,
                'discountValue': coupon.discount_value,
                'discountAmount': discount
            }

            # Record coupon usage
            usage = CouponUsage(
                coupon_id=coupon.id,
                order_id=new_order.id,  # Now we have the order ID
                user_id=current_user.id,
                discount_amount=discount
            )
            db.session.add(usage)

            # Update usage counts
            coupon.used_count += 1
            if coupon.specific_users:
                user_coupon = CouponUser.query.filter_by(
                    coupon_id=coupon.id,
                    user_phone=current_user.phone
                ).first()
                if user_coupon:
                    user_coupon.used_count += 1

        db.session.commit()

        response_data = {
            'message': 'Order created successfully',
            'order': {
                'id': new_order.id,
                'subtotal': subtotal,
                'shipping': shipping,
                'discount': discount,
                'total': new_order.total,
                'status': new_order.status,
                'coupon': coupon_details
            }
        }

        return jsonify(response_data), 201

    except Exception as e:
        db.session.rollback()
        print(f"Error creating order: {str(e)}")
        return jsonify({
            'message': 'An error occurred while processing your order. Please try again.'
        }), 500

# Order Tracking
@app.route('/api/orders/<order_id>/track', methods=['GET'])
@token_required
def track_order(current_user, order_id):
    order = Order.query.get_or_404(order_id)

    # Verify order belongs to user
    if order.user_id != current_user.id:
        return jsonify({'message': 'Order not found'}), 404

    return jsonify({
        'id': order.id,
        'status': order.status,
        'tracking_steps': [{
            'status': step.status,
            'description': step.description,
            'timestamp': step.timestamp.isoformat(),
            'completed': step.completed
        } for step in order.tracking_steps]
    })

# Cancel Order
@app.route('/api/orders/<order_id>/cancel', methods=['POST'])
@token_required
def cancel_order(current_user, order_id):
    order = Order.query.get_or_404(order_id)

    # Verify order belongs to user
    if order.user_id != current_user.id:
        return jsonify({'message': 'Order not found'}), 404

    # Check if order can be cancelled
    if order.status not in ['pending', 'processing']:
        return jsonify({
            'message': 'Order cannot be cancelled at this stage'
        }), 400

    # Add cancellation tracking step
    tracking = OrderTracking(
        order_id=order.id,
        status='cancelled',
        description='تم إلغاء الطلب بواسطة العميل',
        completed=True
    )
    order.tracking_steps.append(tracking)

    # Update order status
    order.status = 'cancelled'

    # Restore inventory
    for item in order.items:
        size = VariantSize.query.filter_by(
            variant_id=item.variant_id,
            size=item.size
        ).first()
        if size:
            size.quantity += item.quantity
            size.in_stock = True
            # Update product sales count
            product = db.session.get(Product, item.product_id)
            if product:
                product.sales_count -= item.quantity

    db.session.commit()

    return jsonify({
        'message': 'Order cancelled successfully',
        'order': {
            'id': order.id,
            'status': order.status,
            'tracking_steps': [{
                'status': step.status,
                'description': step.description,
                'timestamp': step.timestamp.isoformat(),
                'completed': step.completed
            } for step in order.tracking_steps]
        }
    })

def _order_item_display(item):
    """Safe serialization for an order item; variant/product may be missing (e.g. deleted)."""
    product_name = None
    variant_name = None
    image_url = None
    if item.variant:
        if item.variant.product:
            product_name = item.variant.product.name_ar or item.variant.product.name_en or item.variant.product.name
        variant_name = item.variant.color_name
        if item.variant.images:
            image_url = item.variant.images[0].image_url
    if product_name is None:
        product = db.session.get(Product, item.product_id)
        product_name = (product.name_ar or product.name_en or product.name) if product else ''
    return {
        'productName': product_name or '',
        'variant': variant_name or '',
        'size': item.size,
        'quantity': item.quantity,
        'price': item.price,
        'totalPrice': item.quantity * item.price,
        'image': image_url
    }


@app.route('/api/orders', methods=['GET'])
@token_required
def get_user_orders(current_user):
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('perPage', 20, type=int)

        orders = Order.query\
            .filter_by(user_id=current_user.id)\
            .options(
                joinedload(Order.items).joinedload(OrderItem.variant)
                .joinedload(ProductVariant.images),
                joinedload(Order.tracking_steps),
                joinedload(Order.coupon_usage).joinedload(CouponUsage.coupon)
            )\
            .order_by(desc(Order.created_at))\
            .paginate(page=page, per_page=per_page, error_out=False)

        orders_data = []
        for order in orders.items:
            coupon_block = None
            if order.coupon_usage and getattr(order.coupon_usage, 'coupon', None):
                c = order.coupon_usage.coupon
                coupon_block = {
                    'code': c.code,
                    'discountType': c.discount_type,
                    'discountValue': c.discount_value,
                    'discountAmount': order.coupon_usage.discount_amount
                }
            orders_data.append({
                'id': order.id,
                'totalQuantity': sum(item.quantity for item in order.items),
                'shippingFee': order.shipping,
                'subtotal': sum(item.quantity * item.price for item in order.items),
                'discount': order.discount,
                'total': order.total,
                'status': order.status,
                'createdAt': order.created_at.isoformat() if order.created_at else None,
                'items': [_order_item_display(item) for item in order.items],
                'tracking': [{
                    'status': step.status,
                    'description': step.description,
                    'timestamp': step.timestamp.isoformat() if step.timestamp else None,
                    'completed': step.completed
                } for step in order.tracking_steps],
                'coupon': coupon_block
            })

        return jsonify({
            'orders': orders_data,
            'total': orders.total,
            'pages': orders.pages,
            'currentPage': page
        })
    except Exception as e:
        app.logger.exception('GET /api/orders failed')
        return jsonify({'message': 'Internal Server Error', 'error': str(e)}), 500

# Admin Routes for Coupon Management
@app.route('/api/admin/coupons', methods=['POST'])
@admin_required
def create_coupon(current_user):
    data = request.json

    # Generate unique coupon code if not provided
    if not data.get('code'):
        while True:
            code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
            if not Coupon.query.filter_by(code=code).first():
                break
    else:
        code = data['code'].upper()
        if Coupon.query.filter_by(code=code).first():
            return jsonify({'message': 'Coupon code already exists'}), 400

    try:
        coupon = Coupon(
            code=code,
            discount_type=data['discountType'],
            discount_value=float(data['discountValue']),
            max_uses=data.get('maxUses'),
            start_date=datetime.fromisoformat(data['startDate']),
            end_date=datetime.fromisoformat(data['endDate']),
            status=data.get('status', 'active')
        )

        # Add specific users if provided
        if 'specificUsers' in data:
            for user_data in data['specificUsers']:
                user_coupon = CouponUser(
                    user_phone=user_data['phone'],
                    max_uses=user_data.get('maxUses')
                )
                coupon.specific_users.append(user_coupon)

        db.session.add(coupon)
        db.session.commit()

        return jsonify({
            'message': 'Coupon created successfully',
            'coupon': {
                'id': coupon.id,
                'code': coupon.code,
                'discountType': coupon.discount_type,
                'discountValue': coupon.discount_value,
                'maxUses': coupon.max_uses,
                'usedCount': coupon.used_count,
                'startDate': coupon.start_date.isoformat(),
                'endDate': coupon.end_date.isoformat(),
                'status': coupon.status
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 400

@app.route('/api/admin/coupons/<coupon_id>', methods=['PUT'])
@admin_required
def update_coupon(current_user, coupon_id):
    coupon = Coupon.query.get_or_404(coupon_id)
    data = request.json

    try:
        if 'discountType' in data:
            coupon.discount_type = data['discountType']
        if 'discountValue' in data:
            coupon.discount_value = float(data['discountValue'])
        if 'maxUses' in data:
            coupon.max_uses = data['maxUses']
        if 'startDate' in data:
            coupon.start_date = datetime.fromisoformat(data['startDate'])
        if 'endDate' in data:
            coupon.end_date = datetime.fromisoformat(data['endDate'])
        if 'status' in data:
            coupon.status = data['status']

        # Update specific users if provided
        if 'specificUsers' in data:
            # Remove existing users
            CouponUser.query.filter_by(coupon_id=coupon.id).delete()

            # Add new users
            for user_data in data['specificUsers']:
                user_coupon = CouponUser(
                    coupon_id=coupon.id,
                    user_phone=user_data['phone'],
                    max_uses=user_data.get('maxUses')
                )
                db.session.add(user_coupon)

        db.session.commit()

        return jsonify({
            'message': 'Coupon updated successfully',
            'coupon': {
                'id': coupon.id,
                'code': coupon.code,
                'discountType': coupon.discount_type,
                'discountValue': coupon.discount_value,
                'maxUses': coupon.max_uses,
                'usedCount': coupon.used_count,
                'startDate': coupon.start_date.isoformat(),
                'endDate': coupon.end_date.isoformat(),
                'status': coupon.status
            }
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 400

# User Routes for Coupon Validation and Usage
@app.route('/api/contact', methods=['POST'])
def contact_submit():
    """Handle contact form submission (no auth required)"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'message': 'Invalid request'}), 400
        name = (data.get('name') or '').strip()
        phone = (data.get('phone') or '').strip()
        message = (data.get('message') or '').strip()
        if not name or not phone or not message:
            return jsonify({'message': 'Name, phone and message are required'}), 400
        msg = ContactMessage(name=name, phone=phone, message=message)
        db.session.add(msg)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Message sent successfully'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500


@app.route('/api/coupons/validate', methods=['POST'])
@token_required
def validate_coupon(current_user):
    try:
        data = request.get_json(silent=True)

        # Validate required fields
        if not data or not isinstance(data, dict):
            return jsonify({
                'valid': False,
                'message': 'Invalid request data'
            }), 400

        code = data.get('code')
        subtotal = data.get('subtotal')

        # Validate required fields
        if not code or not isinstance(code, str):
            return jsonify({
                'valid': False,
                'message': 'Coupon code is required'
            }), 400

        if not subtotal or not isinstance(subtotal, (int, float)):
            return jsonify({
                'valid': False,
                'message': 'Valid subtotal is required'
            }), 400

        # Now safely convert code to uppercase
        code = code.strip().upper()

        # Rest of your coupon validation logic here
        coupon = Coupon.query.filter_by(code=code).first()

        if not coupon:
            return jsonify({
                'valid': False,
                'message': 'هذا الكوبون غير صالح للاستخدام'
            }), 404

        is_valid, message = coupon.is_valid(current_user.phone)
        if not is_valid:
            return jsonify({'valid': False, 'message': message}), 400

        discount_amount = coupon.calculate_discount(float(subtotal))

        # Return successful validation response
        return jsonify({
            'valid': True,
            'code': coupon.code,
            'discountType': coupon.discount_type,
            'discountValue': coupon.discount_value,
            'discountAmount': discount_amount,
            'message': 'Coupon applied successfully'
        })

    except Exception as e:
        app.logger.error(f"Error validating coupon: {str(e)}")
        return jsonify({
            'valid': False,
            'message': 'Error validating coupon'
        }), 500

@app.route('/api/admin/coupons', methods=['GET'])
@admin_required
def list_coupons(current_user):
    # Extract filter parameters
    status = request.args.get('status')
    search = request.args.get('search')
    coupon_type = request.args.get('type')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('perPage', 20, type=int)

    # Base query with eager loading of relationships
    query = Coupon.query.options(
        db.joinedload(Coupon.specific_users),
        db.joinedload(Coupon.usage_history)
    )

    # Apply filters
    if status and status != 'all':
        query = query.filter(Coupon.status == status)

    if coupon_type:
        query = query.filter(Coupon.discount_type == coupon_type)

    if search:
        search_term = f"%{search}%"
        query = query.join(CouponUser, isouter=True).filter(or_(
            Coupon.code.ilike(search_term),
            CouponUser.user_phone.ilike(search_term)
        ))

    # Sort by creation date, newest first
    query = query.order_by(desc(Coupon.created_at))

    # Paginate results
    paginated_coupons = query.paginate(page=page, per_page=per_page, error_out=False)

    # Prepare response data
    coupons_response = []
    for coupon in paginated_coupons.items:
        # Get total discount given by this coupon
        total_discount = db.session.query(func.sum(CouponUsage.discount_amount))\
            .filter(CouponUsage.coupon_id == coupon.id)\
            .scalar() or 0

        # Get recent usage history
        recent_usage = db.session.query(CouponUsage)\
            .filter(CouponUsage.coupon_id == coupon.id)\
            .order_by(desc(CouponUsage.used_at))\
            .limit(5)\
            .all()

        coupon_data = {
            'id': coupon.id,
            'code': coupon.code,
            'discountType': coupon.discount_type,
            'discountValue': coupon.discount_value,
            'maxUses': coupon.max_uses,
            'usedCount': coupon.used_count,
            'startDate': coupon.start_date.isoformat(),
            'endDate': coupon.end_date.isoformat(),
            'status': coupon.status,
            'createdAt': coupon.created_at.isoformat(),
            'updatedAt': coupon.updated_at.isoformat(),
            'totalDiscountGiven': round(total_discount, 2),
            'isExpired': coupon.end_date < datetime.utcnow(),
            'specificUsers': [{
                'phone': user.user_phone,
                'maxUses': user.max_uses,
                'usedCount': user.used_count
            } for user in coupon.specific_users],
            'recentUsage': [{

                'orderId': usage.order_id,
                'discountAmount': usage.discount_amount,
                'usedAt': usage.used_at.isoformat()
            } for usage in recent_usage]
        }
        coupons_response.append(coupon_data)

    return jsonify({
        'coupons': coupons_response,
        'total': paginated_coupons.total,
        'pages': paginated_coupons.pages,
        'currentPage': page,
        'hasNext': paginated_coupons.has_next,
        'hasPrev': paginated_coupons.has_prev
    })

@app.route('/api/admin/coupons/<coupon_id>', methods=['DELETE'])
@admin_required
def delete_coupon(current_user, coupon_id):
    try:
        coupon = Coupon.query.get_or_404(coupon_id)

        # Check if coupon has been used
        if coupon.used_count > 0:
            # Instead of deleting, mark as inactive
            coupon.status = 'inactive'
            db.session.commit()
            return jsonify({
                'message': 'Coupon has been used and cannot be deleted. It has been marked as inactive instead.',
                'status': 'deactivated'
            })

        # If never used, we can safely delete it
        db.session.delete(coupon)
        db.session.commit()

        return jsonify({
            'message': 'Coupon deleted successfully',
            'status': 'deleted'
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'message': f'Error deleting coupon: {str(e)}'
        }), 500

@app.route('/api/admin/coupons/stats', methods=['GET'])
@admin_required
def get_coupon_stats(current_user):
    try:
        now = datetime.utcnow()

        # Base query for active coupons
        active_query = Coupon.query.filter_by(status='active')

        # Get basic counts
        total_coupons = Coupon.query.count()
        active_coupons = active_query.count()
        expired_coupons = active_query.filter(Coupon.end_date < now).count()

        # Calculate total discount given with proper joins
        total_discount = db.session.query(func.coalesce(func.sum(CouponUsage.discount_amount), 0.0))\
            .scalar()

        # Find most used coupon with proper joins and handling
        most_used = db.session.query(
            Coupon,
            func.count(CouponUsage.id).label('usage_count'),
            func.coalesce(func.sum(CouponUsage.discount_amount), 0.0).label('total_discount')
        ).outerjoin(CouponUsage)\
         .group_by(Coupon.id)\
         .order_by(desc('usage_count'), desc('total_discount'))\
         .first()

        most_used_data = None
        if most_used and most_used[1] > 0:  # Only include if there are actual uses
            most_used_data = {
                'code': most_used[0].code,
                'usageCount': most_used[1],
                'totalDiscount': round(most_used[2], 2)
            }

        # Get recent activities with proper eager loading
        recent_activities = db.session.query(
            CouponUsage,
            User.phone.label('user_phone'),
            Coupon.code.label('coupon_code')
        ).join(User)\
         .join(Coupon)\
         .order_by(desc(CouponUsage.used_at))\
         .limit(5)\
         .all()

        # Get coupon type counts using a single query
        type_counts = db.session.query(
            Coupon.discount_type,
            func.count(Coupon.id)
        ).group_by(Coupon.discount_type)\
         .all()

        types_dict = {
            'percentage': 0,
            'fixed': 0
        }
        for discount_type, count in type_counts:
            types_dict[discount_type] = count

        # Get status counts using a single query
        status_counts = db.session.query(
            Coupon.status,
            func.count(Coupon.id)
        ).group_by(Coupon.status)\
         .all()

        status_dict = {
            'active': 0,
            'inactive': 0
        }
        for status, count in status_counts:
            status_dict[status] = count

        return jsonify({
            'totalCoupons': total_coupons,
            'activeCoupons': active_coupons,
            'expiredCoupons': expired_coupons,
            'totalDiscountGiven': round(total_discount, 2),
            'mostUsedCoupon': most_used_data,
            'couponsByType': types_dict,
            'couponsByStatus': status_dict,
            'recentActivities': [{
                'userPhone': activity.user_phone,
                'couponCode': activity.coupon_code,
                'discountAmount': activity.CouponUsage.discount_amount,
                'usedAt': activity.CouponUsage.used_at.isoformat()
            } for activity in recent_activities] if recent_activities else []
        })

    except Exception as e:
        return jsonify({
            'message': f'Error fetching coupon statistics: {str(e)}'
        }), 500

@app.route('/api/admin/analytics/dashboard', methods=['GET'])
@admin_required
def get_dashboard_analytics(current_user):
    try:
        period = request.args.get('period', 'month')
        end_date = datetime.utcnow()

        date_ranges = {
            'today': end_date.replace(hour=0, minute=0, second=0, microsecond=0),
            'week': end_date - timedelta(days=7),
            'month': end_date - timedelta(days=30),
            'year': end_date - timedelta(days=365),
            'all': end_date - timedelta(days=36500)
        }
        start_date = date_ranges.get(period, date_ranges['all'])

        prev_duration = end_date - start_date
        prev_start = start_date - prev_duration
        prev_end = start_date

        current_orders = db.session.query(
            Order.id,
            Order.total,
            Order.created_at,
            Order.status
        ).filter(
            Order.created_at.between(start_date, end_date)
        ).all()

        prev_orders = db.session.query(
            func.count(Order.id),
            func.sum(Order.total)
        ).filter(
            Order.created_at.between(prev_start, prev_end)
        ).first()

        status_counts = db.session.query(
            Order.status,
            func.count(Order.id)
        ).filter(
            Order.created_at >= start_date
        ).group_by(Order.status).all()

        total_customers = db.session.query(func.count(func.distinct(Order.user_id))).filter(
            Order.created_at.between(start_date, end_date)
        ).scalar()

        returning_customers = db.session.query(func.count(func.distinct(Order.user_id))).filter(
            Order.created_at.between(start_date, end_date),
            Order.user_id.in_(
                db.session.query(Order.user_id).filter(
                    Order.created_at.between(prev_start, start_date)
                )
            )
        ).scalar()

        ProductVariantAlias = aliased(ProductVariant)
        top_products = db.session.query(
            Product.id,
            Product.name,
            func.count(Order.id).label('order_count'),
            func.sum(OrderItem.quantity).label('total_quantity'),
            func.sum(OrderItem.quantity * OrderItem.price).label('total_revenue'),
            func.avg(OrderItem.price).label('avg_price')
        ).select_from(Order).join(
            OrderItem, Order.id == OrderItem.order_id
        ).join(
            ProductVariantAlias, OrderItem.variant_id == ProductVariantAlias.id
        ).join(
            Product, ProductVariantAlias.product_id == Product.id
        ).filter(
            Order.created_at.between(start_date, end_date)
        ).group_by(
            Product.id
        ).order_by(
            func.sum(OrderItem.quantity * OrderItem.price).desc()
        ).limit(5).all()

        revenue_data = db.session.query(
            func.strftime('%Y-%m-%d', Order.created_at).label('date'),
            func.sum(Order.total).label('revenue'),
            func.count(Order.id).label('orders')
        ).filter(
            Order.created_at.between(start_date, end_date)
        ).group_by(
            'date'
        ).order_by(
            'date'
        ).all()

        current_metrics = {
            'total_sales': sum(order.total for order in current_orders),
            'order_count': len(current_orders),
            'avg_order_value': sum(order.total for order in current_orders) / len(current_orders) if current_orders else 0
        }

        retention_rate = (returning_customers / total_customers * 100) if total_customers else 0

        response = {
            'totalSales': current_metrics['total_sales'],
            'orderCount': current_metrics['order_count'],
            'previousOrderCount': prev_orders[0],
            'avgOrderValue': current_metrics['avg_order_value'],
            'previousAvgOrderValue': prev_orders[1] / prev_orders[0] if prev_orders[0] else 0,

            'ordersByStatus': dict(status_counts),

            'retention': {
                'rate': retention_rate,
                'returningCustomers': returning_customers,
                'totalCustomers': total_customers
            },

            'topProducts': [{
                'id': product.id,
                'name': product.name,
                'orderCount': product.order_count,
                'quantity': product.total_quantity,
                'revenue': product.total_revenue,
                'avgPrice': product.avg_price
            } for product in top_products],

            'revenueChart': [{
                'date': data.date,
                'revenue': float(data.revenue),
                'orders': data.orders
            } for data in revenue_data]
        }

        return jsonify(response)

    except Exception as e:
        app.logger.error(f'Analytics Dashboard Error: {str(e)}')
        return jsonify({
            'error': 'An error occurred while fetching analytics data',
            'details': str(e)
        }), 500


def _default_store_settings():
    return {
        'nameAr': 'ويلسون مصر',
        'nameEn': 'Wilson Egypt',
        'phone': '',
        'email': '',
        'addressAr': '',
        'addressEn': '',
        'freeShippingThreshold': 5000,
        'cairoFees': 50,
        'gizaFees': 60,
        'alexandriaFees': 80,
        'otherGovernoratesFees': 100,
        'codEnabled': True,
        'cardEnabled': False,
        'orderConfirmationSms': True,
        'shippingUpdates': True,
        'deliveryConfirmation': True,
    }


@app.route('/api/admin/settings', methods=['GET'])
@admin_required
def get_settings(current_user):
    try:
        if os.path.isfile(SETTINGS_PATH):
            with open(SETTINGS_PATH, 'r', encoding='utf-8') as f:
                data = json.load(f)
        else:
            data = _default_store_settings()
        return jsonify(data)
    except Exception as e:
        app.logger.error(f'Error reading settings: {e}')
        return jsonify(_default_store_settings())


@app.route('/api/admin/settings', methods=['PUT'])
@admin_required
def update_settings(current_user):
    try:
        data = request.get_json()
        if not data:
            return jsonify({'message': 'No data provided'}), 400
        os.makedirs(INSTANCE_DIR, exist_ok=True)
        current = _default_store_settings()
        if os.path.isfile(SETTINGS_PATH):
            with open(SETTINGS_PATH, 'r', encoding='utf-8') as f:
                current = json.load(f)
        for key in current:
            if key in data:
                current[key] = data[key]
        with open(SETTINGS_PATH, 'w', encoding='utf-8') as f:
            json.dump(current, f, ensure_ascii=False, indent=2)
        return jsonify(current)
    except Exception as e:
        app.logger.error(f'Error saving settings: {e}')
        return jsonify({'message': str(e)}), 500


# Initialize database with admin user
def init_db():
    with app.app_context():
        # Create all tables
        db.create_all()

        # Create indexes using raw SQL for better performance
        with db.engine.connect() as conn:
            # Product indexes
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_product_status
                ON product(status)
            """))

            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_product_category
                ON product(category)
            """))

            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_product_created_at
                ON product(created_at)
            """))

            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_product_sales_count
                ON product(sales_count)
            """))

            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_product_base_price
                ON product(base_price)
            """))

            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_product_discount_price
                ON product(discount_price)
            """))

            # Product variant indexes
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_variant_color
                ON product_variant(color_name)
            """))

            # Variant size indexes
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_variant_size
                ON variant_size(size, in_stock)
            """))

            # Favorite indexes
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_favorite_user
                ON favorite(user_id, created_at)
            """))

            # Offer slide indexes
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_offer_slide_status
                ON offer_slide(status, position)
            """))

            # Commit the index creation
            conn.commit()

        # Create admin user if not exists
        admin = User.query.filter_by(phone='0000000000').first()
        if not admin:
            admin = User(
                phone='0000000000',
                name='Admin',
                role='admin'
            )
            db.session.add(admin)
            db.session.commit()


def _database_needs_init():
    """True if DB file is missing or tables were never created (e.g. empty wilson.db)."""
    db_path = os.path.join(BASE_DIR, 'wilson.db')
    if not os.path.isfile(db_path):
        return True
    try:
        with app.app_context():
            from sqlalchemy import inspect as sa_inspect

            inspector = sa_inspect(db.engine)
            return not inspector.has_table('user')
    except Exception:
        return True


try:
    if _database_needs_init():
        init_db()
except Exception as e:
    app.logger.warning('Database init on load skipped: %s', e)

try:
    with app.app_context():
        _ensure_offer_slide_placement_column()
except Exception:
    pass

if __name__ == '__main__':
    if _database_needs_init():
        init_db()

    # For Jupyter environment, use this instead of app.run():
    from werkzeug.serving import run_simple
    run_simple('127.0.0.1', 5004, app, use_debugger=True, use_reloader=False)
