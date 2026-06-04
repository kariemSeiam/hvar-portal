#!/usr/bin/env python3
"""Ensure user with phone 0000000000 exists and has role=admin. Run from project root."""
import sys
import os
_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(_ROOT, 'project', 'backend'))

from app import app, db
from app import User

def main():
    with app.app_context():
        admin = User.query.filter_by(phone='0000000000').first()
        if not admin:
            admin = User(phone='0000000000', name='Admin', role='admin')
            db.session.add(admin)
            db.session.commit()
            print('Created admin user (0000000000).')
        elif admin.role != 'admin':
            admin.role = 'admin'
            db.session.commit()
            print('Updated user 0000000000 to admin.')
        else:
            print('Admin user (0000000000) already exists.')
    return 0

if __name__ == '__main__':
    sys.exit(main())
