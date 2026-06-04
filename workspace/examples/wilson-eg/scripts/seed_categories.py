#!/usr/bin/env python3
"""
One-time seed: create Category rows from current distinct Product.category values
and from the legacy category_mapping (nameAr, nameEn).
Run from project root: python scripts/seed_categories.py
"""
import os
import sys

_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(_ROOT, 'project', 'backend'))

from app import app, db
from app import Category, Product

# Legacy mapping (slug -> nameAr, nameEn)
CATEGORY_MAPPING = {
    'refrigerators': {'nameAr': 'الثلاجات والفريزرات', 'nameEn': 'Refrigerators & Freezers'},
    'refrigerators_freezers': {'nameAr': 'الثلاجات والفريزرات', 'nameEn': 'Refrigerators & Freezers'},
    'freezers': {'nameAr': 'الفريزرات', 'nameEn': 'Freezers'},
    'stoves': {'nameAr': 'البوتاجازات والأفران', 'nameEn': 'Stoves & Ovens'},
    'stoves_ovens': {'nameAr': 'البوتاجازات والأفران', 'nameEn': 'Stoves & Ovens'},
    'coolers': {'nameAr': 'مبردات المياه', 'nameEn': 'Water Coolers'},
    'water_coolers': {'nameAr': 'مبردات المياه', 'nameEn': 'Water Coolers'},
    'vacuums': {'nameAr': 'المكانس الكهربائية', 'nameEn': 'Vacuum Cleaners'},
    'vacuum_cleaners': {'nameAr': 'المكانس الكهربائية', 'nameEn': 'Vacuum Cleaners'},
    'small': {'nameAr': 'الأجهزة الصغيرة', 'nameEn': 'Small Appliances'},
    'small_appliances': {'nameAr': 'الأجهزة الصغيرة', 'nameEn': 'Small Appliances'},
    'home_appliances': {'nameAr': 'الأجهزة المنزلية', 'nameEn': 'Home Appliances'},
    'tvs': {'nameAr': 'شاشات ويلسن', 'nameEn': 'Wilson TVs'},
    'blenders': {'nameAr': 'خلاطات وكبة', 'nameEn': 'Blenders & Choppers'},
    'washers': {'nameAr': 'غسالات الملابس', 'nameEn': 'Washing Machines'},
    'aircon': {'nameAr': 'تكييفات', 'nameEn': 'Air Conditioners'},
}


def main():
    with app.app_context():
        db.create_all()
        slugs_from_products = set()
        for row in db.session.query(Product.category).distinct():
            if row[0]:
                slugs_from_products.add(row[0].strip().lower())
        all_slugs = slugs_from_products | set(CATEGORY_MAPPING.keys())
        existing = {c.slug for c in Category.query.all()}
        sort_order = 0
        added = 0
        for slug in sorted(all_slugs):
            if slug in existing:
                continue
            mapping = CATEGORY_MAPPING.get(slug, {
                'nameAr': slug.replace('_', ' ').title(),
                'nameEn': slug.replace('_', ' ').title(),
            })
            c = Category(
                slug=slug,
                name_ar=mapping['nameAr'],
                name_en=mapping['nameEn'],
                sort_order=sort_order
            )
            db.session.add(c)
            added += 1
            sort_order += 1
        db.session.commit()
        print(f"Seeded {added} category/categories. Total categories: {Category.query.count()}")


if __name__ == '__main__':
    main()
