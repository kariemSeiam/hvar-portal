import pymysql
import json
import logging
from flask import current_app, g
from contextlib import contextmanager

logger = logging.getLogger(__name__)

def get_db():
    """Get database connection with error handling."""
    if 'db' not in g:
        try:
            host = current_app.config['DATABASE_HOST']
            if host == 'localhost':
                host = '127.0.0.1'  # Avoids WinError 10054 on Windows + MySQL 8
            g.db = pymysql.connect(
                host=host,
                port=current_app.config['DATABASE_PORT'],
                user=current_app.config['DATABASE_USER'],
                password=current_app.config['DATABASE_PASSWORD'],
                database=current_app.config['DATABASE_NAME'],
                cursorclass=pymysql.cursors.DictCursor,
                charset='utf8mb4',
                autocommit=True,
                connect_timeout=10,
                read_timeout=30,
                write_timeout=30,
            )
            logger.info(f"Database connection established to {current_app.config['DATABASE_HOST']}:{current_app.config['DATABASE_PORT']}")
        except pymysql.err.OperationalError as e:
            error_code = e.args[0] if e.args else None
            error_msg = str(e)
            
            logger.error(f"Database connection failed: {error_msg} (Error code: {error_code})")
            
            # Provide helpful error messages based on error code
            if error_code == 2003:
                raise ConnectionError(
                    f"Can't connect to MySQL server at '{current_app.config['DATABASE_HOST']}:{current_app.config['DATABASE_PORT']}'. "
                    f"Please ensure MySQL is running and accessible. "
                    f"Error: {error_msg}"
                )
            elif error_code == 1045:
                raise ConnectionError(
                    f"Access denied for MySQL user '{current_app.config['DATABASE_USER']}'. "
                    f"Please check your database credentials. "
                    f"Error: {error_msg}"
                )
            elif error_code == 1049:
                raise ConnectionError(
                    f"Database '{current_app.config['DATABASE_NAME']}' does not exist. "
                    f"Please create the database or check the configuration. "
                    f"Error: {error_msg}"
                )
            else:
                raise ConnectionError(
                    f"Database connection error: {error_msg} (Error code: {error_code})"
                )
        except Exception as e:
            logger.error(f"Unexpected database connection error: {str(e)}")
            raise ConnectionError(f"Unexpected database error: {str(e)}")
    
    # Check if connection is still alive
    try:
        g.db.ping(reconnect=True)
    except (pymysql.err.OperationalError, AttributeError):
        # Connection is dead, remove it and reconnect
        logger.warning("Database connection is dead, reconnecting...")
        g.pop('db', None)
        return get_db()
    
    return g.db

def close_db(e=None):
    db = g.pop('db', None)
    if db is not None:
        db.close()

def init_app(app):
    app.teardown_appcontext(close_db)

@contextmanager
def transaction():
    """Transaction context manager."""
    db = get_db()
    db.autocommit(False)
    try:
        yield db.cursor()
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.autocommit(True)

def parse_json_fields(row, json_fields=None):
    """Parse JSON string fields back into Python objects."""
    if not row or not json_fields:
        return row
    
    parsed_row = row.copy()
    for field in json_fields:
        if field in parsed_row and parsed_row[field]:
            if isinstance(parsed_row[field], str):
                try:
                    parsed_row[field] = json.loads(parsed_row[field])
                except (json.JSONDecodeError, ValueError):
                    # If parsing fails, keep the original value
                    pass
    return parsed_row

def execute_query(query, params=None, json_fields=None):
    """Execute a SELECT query with error handling."""
    if params and not isinstance(params, (tuple, list, dict)):
        logger.warning(f"DB Utils: params is not a tuple/list/dict, got {type(params)}: {params}")
        params = tuple(params) if hasattr(params, '__iter__') and not isinstance(params, str) else (params,)
    
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute(query, params)
        results = cursor.fetchall()
        
        # Parse JSON fields if specified
        if json_fields and results:
            results = [parse_json_fields(row, json_fields) for row in results]
        
        return results
    except ConnectionError as e:
        logger.error(f"Database connection error in execute_query: {str(e)}")
        raise
    except pymysql.Error as e:
        logger.error(f"MySQL error in execute_query: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error in execute_query: {str(e)}")
        raise

def execute_update(query, params=None):
    """Execute an UPDATE/DELETE query with error handling."""
    if params and not isinstance(params, (tuple, list, dict)):
        logger.warning(f"DB Utils: params is not a tuple/list/dict, got {type(params)}: {params}")
        params = tuple(params) if hasattr(params, '__iter__') and not isinstance(params, str) else (params,)
    
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute(query, params)
        return cursor.rowcount
    except ConnectionError as e:
        logger.error(f"Database connection error in execute_update: {str(e)}")
        raise
    except pymysql.Error as e:
        logger.error(f"MySQL error in execute_update: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error in execute_update: {str(e)}")
        raise

def execute_insert(query, params=None):
    """Execute an INSERT query with error handling."""
    if params and not isinstance(params, (tuple, list, dict)):
        logger.warning(f"DB Utils: params is not a tuple/list/dict, got {type(params)}: {params}")
        params = tuple(params) if hasattr(params, '__iter__') and not isinstance(params, str) else (params,)
    
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute(query, params)
        return cursor.lastrowid
    except ConnectionError as e:
        logger.error(f"Database connection error in execute_insert: {str(e)}")
        raise
    except pymysql.Error as e:
        logger.error(f"MySQL error in execute_insert: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error in execute_insert: {str(e)}")
        raise
