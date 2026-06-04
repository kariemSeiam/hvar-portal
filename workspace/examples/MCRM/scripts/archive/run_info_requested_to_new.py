#!/usr/bin/env python3
"""One-off: UPDATE orders SET status = 'new' WHERE status = 'info_requested'. Uses .env.
Archived: request-info restructure; normal flow is status=new, no info_requested."""
import sys
import pymysql
from pathlib import Path

def main():
    base = Path(__file__).resolve().parent.parent.parent
    config = {}
    env = base / '.env'
    if env.exists():
        with open(env, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    k, v = line.split('=', 1)
                    config[k.strip()] = v.strip().strip('"\'')
    config.setdefault('DATABASE_HOST', '127.0.0.1')
    config.setdefault('DATABASE_PORT', '3306')
    config.setdefault('DATABASE_USER', 'mcrm_hvar_user')
    config.setdefault('DATABASE_PASSWORD', '1618')
    config.setdefault('DATABASE_NAME', 'mcrm_hvar_hub')
    conn = pymysql.connect(
        host=config['DATABASE_HOST'],
        port=int(config['DATABASE_PORT']),
        user=config['DATABASE_USER'],
        password=config['DATABASE_PASSWORD'],
        database=config['DATABASE_NAME'],
        charset='utf8mb4',
    )
    cur = conn.cursor()
    cur.execute("UPDATE orders SET status = 'new' WHERE status = 'info_requested'")
    n = cur.rowcount
    conn.commit()
    cur.close()
    conn.close()
    print(f"Updated {n} order(s) from info_requested to new.")
    return 0 if n >= 0 else 1

if __name__ == '__main__':
    sys.exit(main())
