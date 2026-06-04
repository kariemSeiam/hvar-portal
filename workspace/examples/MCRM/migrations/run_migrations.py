#!/usr/bin/env python3
# migrations/run_migrations.py
"""Simple database migration runner."""

import os
import sys
import re
import pymysql
from pathlib import Path
from typing import List, Dict, Optional
import argparse


class MigrationRunner:
    """Simple database migration runner."""
    
    def __init__(self, config_file: str = '.env'):
        """Initialize migration runner with database configuration."""
        self.config = self._load_config(config_file)
        self.migrations_dir = Path(__file__).parent
        
    def _load_config(self, config_file: str) -> Dict[str, str]:
        """Load database configuration from environment file."""
        config = {}
        if os.path.exists(config_file):
            with open(config_file, 'r') as f:
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
    
    def _get_connection(self):
        """Get database connection."""
        host = self.config['DATABASE_HOST']
        if host == 'localhost':
            host = '127.0.0.1'
        return pymysql.connect(
            host=host,
            port=int(self.config['DATABASE_PORT']),
            user=self.config['DATABASE_USER'],
            password=self.config['DATABASE_PASSWORD'],
            database=self.config['DATABASE_NAME'],
            charset='utf8mb4',
            cursorclass=pymysql.cursors.DictCursor,
            autocommit=False
        )
    
    def _init_migrations_table(self):
        """Initialize migrations history table."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            
            # Create migrations history table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS migrations_history (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    migration_name VARCHAR(255) NOT NULL UNIQUE,
                    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    checksum VARCHAR(64),
                    INDEX idx_migration_name (migration_name)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """)
            
            conn.commit()
    
    def _get_applied_migrations(self) -> List[str]:
        """Get list of applied migrations."""
        self._init_migrations_table()
        
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT migration_name FROM migrations_history ORDER BY id")
            return [row['migration_name'] for row in cursor.fetchall()]
    
    def _get_migration_files(self) -> List[Path]:
        """Get list of migration files in order."""
        migration_files = []
        
        for file_path in self.migrations_dir.glob('*.sql'):
            if file_path.name.startswith('run_migrations'):
                continue
                
            # Extract migration number from filename
            match = re.match(r'^(\d+)_', file_path.name)
            if match:
                migration_number = int(match.group(1))
                migration_files.append((migration_number, file_path))
        
        # Sort by migration number
        migration_files.sort(key=lambda x: x[0])
        return [file_path for _, file_path in migration_files]
    
    def _parse_migration_file(self, file_path: Path) -> Dict[str, str]:
        """Parse migration file for UP and DOWN sections."""
        content = file_path.read_text(encoding='utf-8')
        
        # Split content into UP and DOWN sections
        up_section = []
        down_section = []
        current_section = None
        
        for line in content.split('\n'):
            line = line.strip()
            
            if line.upper().startswith('-- UP'):
                current_section = 'up'
                continue
            elif line.upper().startswith('-- DOWN'):
                current_section = 'down'
                continue
            elif line.upper().startswith('-- END'):
                current_section = None
                continue
            
            if current_section == 'up' and line and not line.startswith('--'):
                up_section.append(line)
            elif current_section == 'down' and line and not line.startswith('--'):
                down_section.append(line)
            elif current_section is None and line and not line.startswith('--'):
                # If no sections defined, treat entire file as UP
                up_section.append(line)
        
        return {
            'up': '\n'.join(up_section),
            'down': '\n'.join(down_section)
        }
    
    def _calculate_checksum(self, content: str) -> str:
        """Calculate simple checksum for migration content."""
        import hashlib
        return hashlib.md5(content.encode('utf-8')).hexdigest()
    
    def _apply_migration(self, migration_name: str, content: str) -> bool:
        """Apply a single migration."""
        checksum = self._calculate_checksum(content)
        
        with self._get_connection() as conn:
            cursor = conn.cursor()
            
            try:
                # Execute migration content
                if content.strip():
                    # Split by semicolon and execute each statement
                    statements = [stmt.strip() for stmt in content.split(';') if stmt.strip()]
                    for statement in statements:
                        if statement:
                            cursor.execute(statement)
                
                # Record migration in history
                cursor.execute("""
                    INSERT INTO migrations_history (migration_name, checksum)
                    VALUES (%s, %s)
                """, (migration_name, checksum))
                
                conn.commit()
                return True
                
            except Exception as e:
                conn.rollback()
                print(f"Error applying migration {migration_name}: {e}")
                return False
    
    def _rollback_migration(self, migration_name: str, content: str) -> bool:
        """Rollback a single migration."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            
            try:
                # Execute rollback content
                if content.strip():
                    # Split by semicolon and execute each statement
                    statements = [stmt.strip() for stmt in content.split(';') if stmt.strip()]
                    for statement in statements:
                        if statement:
                            cursor.execute(statement)
                
                # Remove migration from history
                cursor.execute("""
                    DELETE FROM migrations_history WHERE migration_name = %s
                """, (migration_name,))
                
                conn.commit()
                return True
                
            except Exception as e:
                conn.rollback()
                print(f"Error rolling back migration {migration_name}: {e}")
                return False
    
    def status(self):
        """Show migration status."""
        print("Migration Status:")
        print("=" * 50)
        
        applied_migrations = self._get_applied_migrations()
        migration_files = self._get_migration_files()
        
        print(f"Applied migrations: {len(applied_migrations)}")
        print(f"Available migrations: {len(migration_files)}")
        print()
        
        for file_path in migration_files:
            migration_name = file_path.name
            status = "[OK] Applied" if migration_name in applied_migrations else "[--] Pending"
            print(f"{migration_name:<30} {status}")
        
        if len(applied_migrations) == len(migration_files):
            print("\nAll migrations are up to date!")
        else:
            pending = len(migration_files) - len(applied_migrations)
            print(f"\n{pending} migration(s) pending")
    
    def up(self):
        """Apply pending migrations."""
        print("Applying pending migrations...")
        print("=" * 50)
        
        applied_migrations = self._get_applied_migrations()
        migration_files = self._get_migration_files()
        
        pending_migrations = [
            f for f in migration_files 
            if f.name not in applied_migrations
        ]
        
        if not pending_migrations:
            print("[OK] No pending migrations")
            return
        
        for file_path in pending_migrations:
            migration_name = file_path.name
            print(f"Applying {migration_name}...")
            
            sections = self._parse_migration_file(file_path)
            if self._apply_migration(migration_name, sections['up']):
                print(f"[OK] {migration_name} applied successfully")
            else:
                print(f"[FAIL] Failed to apply {migration_name}")
                return
        
        print(f"\nApplied {len(pending_migrations)} migration(s) successfully!")
    
    def down(self):
        """Rollback last migration."""
        print("Rolling back last migration...")
        print("=" * 50)
        
        applied_migrations = self._get_applied_migrations()
        migration_files = self._get_migration_files()
        
        if not applied_migrations:
            print("[OK] No migrations to rollback")
            return
        
        # Find the last applied migration
        last_migration = None
        for file_path in migration_files:
            if file_path.name in applied_migrations:
                last_migration = file_path
        
        if not last_migration:
            print("[FAIL] No migration file found for rollback")
            return
        
        migration_name = last_migration.name
        print(f"Rolling back {migration_name}...")
        
        sections = self._parse_migration_file(last_migration)
        if sections['down']:
            if self._rollback_migration(migration_name, sections['down']):
                print(f"[OK] {migration_name} rolled back successfully")
            else:
                print(f"[FAIL] Failed to rollback {migration_name}")
        else:
            print(f"[WARN] No DOWN section found in {migration_name}")
    
    def reset(self):
        """Reset all migrations (dangerous!)."""
        print("WARNING: This will rollback ALL migrations!")
        print("This action cannot be undone.")
        response = input("Are you sure? Type 'yes' to continue: ")
        
        if response.lower() != 'yes':
            print("Operation cancelled")
            return
        
        applied_migrations = self._get_applied_migrations()
        migration_files = self._get_migration_files()
        
        # Rollback in reverse order
        for file_path in reversed(migration_files):
            if file_path.name in applied_migrations:
                migration_name = file_path.name
                print(f"Rolling back {migration_name}...")
                
                sections = self._parse_migration_file(file_path)
                if sections['down']:
                    if not self._rollback_migration(migration_name, sections['down']):
                        print(f"[FAIL] Failed to rollback {migration_name}")
                        return
                else:
                    print(f"[WARN] No DOWN section found in {migration_name}")
        
        print("All migrations rolled back successfully!")


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description='Database migration runner')
    parser.add_argument('command', choices=['status', 'up', 'down', 'reset'],
                       help='Migration command to run')
    parser.add_argument('--config', default='.env',
                       help='Configuration file (default: .env)')
    parser.add_argument('--database', default=None,
                       help='Override database name from config')
    
    args = parser.parse_args()
    
    try:
        runner = MigrationRunner(args.config)
        
        # Override database name if provided
        if args.database:
            runner.config['DATABASE_NAME'] = args.database
        
        if args.command == 'status':
            runner.status()
        elif args.command == 'up':
            runner.up()
        elif args.command == 'down':
            runner.down()
        elif args.command == 'reset':
            runner.reset()
            
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
