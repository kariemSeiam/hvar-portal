#!/usr/bin/env python3
"""
Merge duplicate categories: reassign products to canonical slug, then delete the duplicate Category row.
Run from project root: python scripts/dedupe_categories.py
"""
import sys
import os

_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(_ROOT, 'project', 'backend'))

from app import app, db
from app import Category, Product

# Alias slug -> canonical slug (one category per display name)
MERGE_MAP = {
    'refrigerators_freezers': 'refrigerators',
    'stoves_ovens': 'stoves',
    'coolers': 'water_coolers',
    'vacuums': 'vacuum_cleaners',
    'small': 'small_appliances',
}


def main():
    with app.app_context():
        for alias_slug, canonical_slug in MERGE_MAP.items():
            cat = Category.query.filter_by(slug=alias_slug).first()
            if not cat:
                continue
            canonical = Category.query.filter_by(slug=canonical_slug).first()
            if not canonical:
                print(f"Skip {alias_slug}: canonical {canonical_slug} not found")
                continue
            updated = Product.query.filter_by(category=alias_slug).update({Product.category: canonical_slug})
            db.session.delete(cat)
            db.session.commit()
            print(f"Merged {alias_slug} -> {canonical_slug}: updated {updated} product(s), deleted category")

        # Optional: delete test/zero-product duplicate categories (e.g. testst)
        for slug in ['testst']:
            c = Category.query.filter_by(slug=slug).first()
            if c and Product.query.filter_by(category=slug).count() == 0:
                db.session.delete(c)
                db.session.commit()
                print(f"Removed empty category: {slug}")

        print("Done. Total categories:", Category.query.count())


if __name__ == '__main__':
    main()
