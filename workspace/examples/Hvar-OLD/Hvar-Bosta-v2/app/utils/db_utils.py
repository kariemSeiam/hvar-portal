"""
Unified Database Utilities
Centralized database connection and utility functions to eliminate duplication
"""

import os
import sqlite3
from contextlib import contextmanager
import logging
from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime

logger = logging.getLogger(__name__)

def get_database_path() -> str:
    """Get the database file path"""
    return os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'database.db')

@contextmanager
def get_db():
    """
    Database connection context manager
    Provides a connection to the SQLite database with proper error handling
    Uses a higher timeout and enables WAL mode for better concurrency
    """
    db_path = get_database_path()
    conn = None
    try:
        conn = sqlite3.connect(db_path, timeout=30, isolation_level=None)  # 30s timeout, autocommit
        conn.row_factory = sqlite3.Row  # Enable row factory for named access
        conn.execute('PRAGMA journal_mode=WAL;')  # Enable WAL mode for concurrency
        yield conn
    except Exception as e:
        logger.error(f"Database connection error: {e}")
        if conn:
            conn.rollback()
        raise
    finally:
        if conn:
            conn.close()

def check_table_exists(table_name: str) -> bool:
    """Check if a table exists in the database"""
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name=?
            """, (table_name,))
            return cursor.fetchone() is not None
    except Exception as e:
        logger.error(f"Error checking table existence: {e}")
        return False

def get_table_count(table_name: str) -> int:
    """Get the count of records in a table"""
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
            return cursor.fetchone()[0] or 0
    except Exception as e:
        logger.error(f"Error getting table count: {e}")
        return 0

def get_table_schema(table_name: str) -> List[Dict[str, Any]]:
    """Get the schema information for a table"""
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute(f"PRAGMA table_info({table_name})")
            columns = cursor.fetchall()
            return [
                {
                    'name': col[1],
                    'type': col[2],
                    'not_null': bool(col[3]),
                    'default_value': col[4],
                    'primary_key': bool(col[5])
                }
                for col in columns
            ]
    except Exception as e:
        logger.error(f"Error getting table schema: {e}")
        return []

def execute_query(query: str, params: Tuple = ()) -> List[Dict[str, Any]]:
    """Execute a query and return results as list of dictionaries"""
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            columns = [description[0] for description in cursor.description]
            return [dict(zip(columns, row)) for row in cursor.fetchall()]
    except Exception as e:
        logger.error(f"Error executing query: {e}")
        return []

def execute_single_query(query: str, params: Tuple = ()) -> Optional[Dict[str, Any]]:
    """Execute a query and return single result as dictionary"""
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            row = cursor.fetchone()
            if row:
                columns = [description[0] for description in cursor.description]
                return dict(zip(columns, row))
            return None
    except Exception as e:
        logger.error(f"Error executing single query: {e}")
        return None

def execute_update(query: str, params: Tuple = ()) -> int:
    """Execute an update query and return number of affected rows"""
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            return cursor.rowcount
    except Exception as e:
        logger.error(f"Error executing update: {e}")
        return 0

def get_database_status() -> Dict[str, Any]:
    """Get comprehensive database status information"""
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            
            # Get all tables
            cursor.execute("""
                SELECT name FROM sqlite_master 
                WHERE type='table' 
                ORDER BY name
            """)
            tables = [row[0] for row in cursor.fetchall()]
            
            # Get table sizes
            table_sizes = {}
            total_records = 0
            
            for table in tables:
                cursor.execute(f"SELECT COUNT(*) FROM {table}")
                count = cursor.fetchone()[0]
                table_sizes[table] = count
                total_records += count
            
            # Get database file size
            db_path = get_database_path()
            file_size = os.path.getsize(db_path) if os.path.exists(db_path) else 0
            
            return {
                'database_path': db_path,
                'file_size_bytes': file_size,
                'file_size_mb': round(file_size / (1024 * 1024), 2),
                'total_tables': len(tables),
                'total_records': total_records,
                'tables': tables,
                'table_sizes': table_sizes,
                'status': 'healthy',
                'last_checked': datetime.now().isoformat()
            }
    except Exception as e:
        logger.error(f"Error getting database status: {e}")
        return {
            'status': 'error',
            'error': str(e),
            'last_checked': datetime.now().isoformat()
        }

def backup_database(backup_path: Optional[str] = None) -> Dict[str, Any]:
    """Create a backup of the database"""
    try:
        db_path = get_database_path()
        
        if not backup_path:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            backup_path = f"{db_path}.backup_{timestamp}"
        
        with get_db() as conn:
            backup_conn = sqlite3.connect(backup_path)
            conn.backup(backup_conn)
            backup_conn.close()
        
        backup_size = os.path.getsize(backup_path)
        
        return {
            'success': True,
            'backup_path': backup_path,
            'backup_size_bytes': backup_size,
            'backup_size_mb': round(backup_size / (1024 * 1024), 2),
            'backup_created_at': datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error creating database backup: {e}")
        return {
            'success': False,
            'error': str(e)
        }

def optimize_database() -> Dict[str, Any]:
    """Optimize the database for better performance"""
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            
            # Run optimization commands
            cursor.execute("VACUUM")
            cursor.execute("ANALYZE")
            cursor.execute("REINDEX")
            
            return {
                'success': True,
                'message': 'Database optimization completed',
                'optimized_at': datetime.now().isoformat()
            }
    except Exception as e:
        logger.error(f"Error optimizing database: {e}")
        return {
            'success': False,
            'error': str(e)
        } 