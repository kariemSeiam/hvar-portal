#!/usr/bin/env python3
# migrations/backup_database.py
"""Script to backup database to SQL file for import into phpMyAdmin."""

import os
import sys
import subprocess
import pymysql
from pathlib import Path
from datetime import datetime
from typing import Dict, List


def load_config(config_file='.env'):
    """Load database configuration from environment file."""
    config = {}
    if os.path.exists(config_file):
        with open(config_file, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    config[key.strip()] = value.strip().strip('"\'')
    
    # Default values — 127.0.0.1 avoids WinError 10054 on Windows
    config.setdefault('DATABASE_HOST', '127.0.0.1')
    config.setdefault('DATABASE_PORT', '3306')
    config.setdefault('DATABASE_USER', 'mcrm_hvar_user')
    config.setdefault('DATABASE_PASSWORD', '1618')
    config.setdefault('DATABASE_NAME', 'mcrm_hvar_hub')
    
    return config


def backup_with_mysqldump(config: Dict, output_file: Path):
    """Backup database using mysqldump command."""
    try:
        cmd = [
            'mysqldump',
            f'--host={config["DATABASE_HOST"]}',
            f'--port={config["DATABASE_PORT"]}',
            f'--user={config["DATABASE_USER"]}',
            f'--password={config["DATABASE_PASSWORD"]}',
            '--single-transaction',
            '--routines',
            '--triggers',
            '--add-drop-table',
            '--default-character-set=utf8mb4',
            config['DATABASE_NAME']
        ]
        
        with open(output_file, 'w', encoding='utf-8') as f:
            result = subprocess.run(
                cmd,
                stdout=f,
                stderr=subprocess.PIPE,
                text=True,
                env={**os.environ, 'MYSQL_PWD': config['DATABASE_PASSWORD']}
            )
            
            if result.returncode != 0:
                print(f"mysqldump error: {result.stderr}")
                return False
                
        return True
    except FileNotFoundError:
        print("mysqldump not found, using Python-based backup...")
        return None
    except Exception as e:
        print(f"Error with mysqldump: {e}")
        return None


def get_table_list(conn):
    """Get list of all tables in the database."""
    cursor = conn.cursor(pymysql.cursors.DictCursor)
    cursor.execute("SHOW TABLES")
    rows = cursor.fetchall()
    # Handle both dict and tuple results
    if rows and isinstance(rows[0], dict):
        tables = [row[list(row.keys())[0]] for row in rows]
    else:
        tables = [row[0] for row in rows]
    return tables


def sort_tables_by_dependencies(conn, tables: List[str]) -> List[str]:
    """Sort tables respecting foreign key dependencies.
    Parent tables are created before child tables."""
    # Define table creation order based on foreign key dependencies
    # Tables with no dependencies first, then dependent tables
    table_order = [
        # Independent tables (no foreign keys)
        'customers',
        'bosta_orders',
        'stock_items',
        'ticket_sequences',
        'migrations_history',
        # Tables that depend on customers
        'service_tickets',
        # Tables that depend on service_tickets
        'service_ticket_history',
        'service_items',
        # Tables that depend on stock_items
        'stock_movements',
        'product_components',
        # Independent tables
        'tracking_scans',
    ]
    
    # Create ordered list: known tables in order, then unknown tables at the end
    ordered = []
    remaining = set(tables)
    
    for table in table_order:
        if table in remaining:
            ordered.append(table)
            remaining.remove(table)
    
    # Add any remaining tables that weren't in our predefined order
    for table in tables:
        if table in remaining:
            ordered.append(table)
    
    return ordered


def get_create_table_sql(conn, table_name):
    """Get CREATE TABLE statement for a table."""
    cursor = conn.cursor(pymysql.cursors.DictCursor)
    cursor.execute(f"SHOW CREATE TABLE `{table_name}`")
    result = cursor.fetchone()
    # Handle both dict and tuple results
    if isinstance(result, dict):
        return result['Create Table'] + ';'
    else:
        # If tuple, second column is the CREATE TABLE statement
        return result[1] + ';'


def get_table_data(conn, table_name):
    """Get INSERT statements for table data."""
    cursor = conn.cursor(pymysql.cursors.DictCursor)
    cursor.execute(f"SELECT * FROM `{table_name}`")
    rows = cursor.fetchall()
    
    if not rows:
        return []
    
    # Get column names - handle both dict and tuple
    if isinstance(rows[0], dict):
        columns = list(rows[0].keys())
    else:
        # Get column names from cursor description
        columns = [desc[0] for desc in cursor.description]
    
    # Generate INSERT statements
    inserts = []
    for row in rows:
        values = []
        if isinstance(row, dict):
            for col in columns:
                value = row[col]
                if value is None:
                    values.append('NULL')
                elif isinstance(value, (int, float)):
                    values.append(str(value))
                elif isinstance(value, bool):
                    values.append('1' if value else '0')
                else:
                    # Escape string values
                    escaped = str(value).replace('\\', '\\\\').replace("'", "\\'")
                    values.append(f"'{escaped}'")
        else:
            # Handle tuple rows
            for value in row:
                if value is None:
                    values.append('NULL')
                elif isinstance(value, (int, float)):
                    values.append(str(value))
                elif isinstance(value, bool):
                    values.append('1' if value else '0')
                else:
                    # Escape string values
                    escaped = str(value).replace('\\', '\\\\').replace("'", "\\'")
                    values.append(f"'{escaped}'")
        
        values_str = ', '.join(values)
        inserts.append(f"INSERT INTO `{table_name}` (`{'`, `'.join(columns)}`) VALUES ({values_str});")
    
    return inserts


def backup_with_python(config: Dict, output_file: Path):
    """Backup database using Python (fallback method)."""
    host = config['DATABASE_HOST']
    if host == 'localhost':
        host = '127.0.0.1'
    try:
        conn = pymysql.connect(
            host=host,
            port=int(config['DATABASE_PORT']),
            user=config['DATABASE_USER'],
            password=config['DATABASE_PASSWORD'],
            database=config['DATABASE_NAME'],
            charset='utf8mb4'
        )
        
        with open(output_file, 'w', encoding='utf-8') as f:
            # Write header
            f.write(f"-- Database Backup\n")
            f.write(f"-- Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"-- Database: {config['DATABASE_NAME']}\n")
            f.write(f"-- Host: {config['DATABASE_HOST']}:{config['DATABASE_PORT']}\n\n")
            f.write("SET NAMES utf8mb4;\n")
            f.write("SET FOREIGN_KEY_CHECKS = 0;\n\n")
            
            # Get all tables and sort by dependencies
            tables = get_table_list(conn)
            tables = sort_tables_by_dependencies(conn, tables)
            print(f"Found {len(tables)} tables to backup...")
            
            # Backup each table
            for i, table in enumerate(tables, 1):
                print(f"  Backing up {table} ({i}/{len(tables)})...")
                
                # Write CREATE TABLE statement
                f.write(f"\n-- Table structure for `{table}`\n")
                f.write(f"DROP TABLE IF EXISTS `{table}`;\n")
                create_sql = get_create_table_sql(conn, table)
                f.write(create_sql + "\n\n")
                
                # Write INSERT statements
                inserts = get_table_data(conn, table)
                if inserts:
                    f.write(f"-- Data for table `{table}`\n")
                    for insert in inserts:
                        f.write(insert + "\n")
                    f.write("\n")
            
            # Write footer
            f.write("\nSET FOREIGN_KEY_CHECKS = 1;\n")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"Error backing up database: {e}")
        return False


def main():
    """Main entry point."""
    config = load_config()
    
    # Create backup filename with timestamp
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_dir = Path(__file__).parent
    output_file = backup_dir / f"backup_{config['DATABASE_NAME']}_{timestamp}.sql"
    
    print(f"Backing up database: {config['DATABASE_NAME']}")
    print(f"Host: {config['DATABASE_HOST']}:{config['DATABASE_PORT']}")
    print(f"Output file: {output_file}\n")
    
    # Try mysqldump first, fallback to Python
    print("Attempting mysqldump backup...")
    result = backup_with_mysqldump(config, output_file)
    
    if result is None or result is False:
        # Fallback to Python method
        print("Using Python-based backup method...")
        result = backup_with_python(config, output_file)
    
    if result:
        file_size = output_file.stat().st_size / (1024 * 1024)  # Size in MB
        print(f"\n[SUCCESS] Backup completed successfully!")
        print(f"   File: {output_file}")
        print(f"   Size: {file_size:.2f} MB")
        print(f"\n[INFO] You can now import this file into phpMyAdmin:")
        print(f"   1. Go to phpMyAdmin")
        print(f"   2. Select database: {config['DATABASE_NAME']}")
        print(f"   3. Click 'Import' tab")
        print(f"   4. Choose file: {output_file.name}")
        print(f"   5. Click 'Go'")
    else:
        print("\n[ERROR] Backup failed!")
        sys.exit(1)


if __name__ == '__main__':
    main()

