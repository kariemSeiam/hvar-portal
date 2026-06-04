"""
HVAR Products & Parts Data
Contains the complete list of HVAR products and their associated parts for database seeding.
"""

def get_hvar_products_with_parts():
    """Complete HVAR products with their parts data"""
    
    return [
        {
            'product': {
                'name_ar': 'هاند بلندر هفار 1500 وات 5057 (5057)',
                'name_en': 'HVAR Hand Blender 1500W 5057',
                'category': 'هاند بلندر',
                'sku': 'hvar5057',
                'selling_price': 1991.26,
                'purchase_price': 1500.00,
                'opening_stock': 10000
            },
            'parts': [
                {'part_name': 'كبة هاند بلندر 5057', 'part_sku': 'hvar0178', 'part_type': 'component', 'quantity': 1000},
                {'part_name': 'سلاح فرم هاند بلندر 5057', 'part_sku': 'hvar0179', 'part_type': 'component', 'quantity': 1000},
                {'part_name': 'غطا كبه هاند 5057', 'part_sku': 'hvar0181', 'part_type': 'component', 'quantity': 1000},
                {'part_name': 'خافق شبكي هاند 5057', 'part_sku': 'hvar0177', 'part_type': 'component', 'quantity': 1000},
                {'part_name': 'ماتور هاند 5057', 'part_sku': 'hvar0182', 'part_type': 'motor', 'quantity': 1000},
                {'part_name': 'هراسه هاند 5057', 'part_sku': 'hvar0183', 'part_type': 'component', 'quantity': 1000},
                {'part_name': 'كوب معياري هاند 5057', 'part_sku': 'hvar0184', 'part_type': 'component', 'quantity': 1000},
                {'part_name': 'كرتون خارجي 5057', 'part_sku': 'hvar0185', 'part_type': 'packaging', 'quantity': 1000},
                {'part_name': 'شريحه 1 كرتون 5057', 'part_sku': 'hvar0187', 'part_type': 'packaging', 'quantity': 1000},
                {'part_name': 'شريحه 2 كرتون 5057', 'part_sku': 'hvar0188', 'part_type': 'packaging', 'quantity': 1000},
                {'part_name': 'شريحه 3 كرتون 5057', 'part_sku': 'hvar0189', 'part_type': 'packaging', 'quantity': 1000},
                {'part_name': 'مكمله خافق شبكي 5057', 'part_sku': 'hvar0190', 'part_type': 'component', 'quantity': 1000},
                {'part_name': 'تجميعه هاند 5057', 'part_sku': 'hvar0180', 'part_type': 'assembly', 'quantity': 1000},
                {'part_name': 'ضمان عامين', 'part_sku': 'hvar0058', 'part_type': 'warranty', 'quantity': 1000},
                {'part_name': 'كوبون خصم 100', 'part_sku': 'hvar0109', 'part_type': 'coupon', 'quantity': 1000}
            ]
        },
        {
            'product': {
                'name_ar': 'هاند بلندر هفار 1500 وات 5055 (5055)',
                'name_en': 'HVAR Hand Blender 1500W 5055',
                'category': 'هاند بلندر',
                'sku': 'hvar5055',
                'selling_price': 1255.00,
                'purchase_price': 900.00,
                'opening_stock': 10000
            },
            'parts': [
                {'part_name': 'هاند بلندر هفار 1500 وات 5055', 'part_sku': 'hvar5055', 'part_type': 'assembly', 'quantity': 1000},
                {'part_name': 'مضرب بيض هاند 5055', 'part_sku': 'hvar0092', 'part_type': 'component', 'quantity': 1000},
                {'part_name': 'وعاء هاند 5055', 'part_sku': 'hvar0089', 'part_type': 'component', 'quantity': 1000},
                {'part_name': 'سلاح هاند 5055', 'part_sku': 'hvar0091', 'part_type': 'component', 'quantity': 1000},
                {'part_name': 'كبه هاند 5055', 'part_sku': 'hvar0093', 'part_type': 'component', 'quantity': 1000},
                {'part_name': 'ماتور هاند 5055', 'part_sku': 'hvar0090', 'part_type': 'motor', 'quantity': 1000}
            ]
        },
        {
            'product': {
                'name_ar': 'مكنسة هفار بطه 2800 وات (228)',
                'name_en': 'HVAR Vacuum Cleaner 2800W 228',
                'category': 'مكنسة',
                'sku': 'hvar228',
                'selling_price': 1.00,
                'purchase_price': 0.50,
                'opening_stock': 10000
            },
            'parts': [
                {'part_name': 'موصل خرطوم مكنسة بطه', 'part_sku': 'hvar0174', 'part_type': 'component', 'quantity': 1000},
                {'part_name': 'خرطوم مكنسة بطة', 'part_sku': 'hvar0173', 'part_type': 'component', 'quantity': 1000},
                {'part_name': 'فرشه ارضية مكنسه بطه', 'part_sku': 'hvar0104', 'part_type': 'component', 'quantity': 1000}
            ]
        },
        {
            'product': {
                'name_ar': 'مكنسة هفار برميل 30 لتر (hvar0010)',
                'name_en': 'HVAR Vacuum Cleaner 30L Barrel',
                'category': 'مكنسة',
                'sku': 'hvar0010',
                'selling_price': 2101.00,
                'purchase_price': 1500.00,
                'opening_stock': 10000
            },
            'parts': [
                {'part_name': 'مكنسة هفار برميل 30 لتر', 'part_sku': 'hvar0010', 'part_type': 'assembly', 'quantity': 1000},
                {'part_name': 'فرشه مكنسه برميل', 'part_sku': 'hvar0106', 'part_type': 'component', 'quantity': 1000},
                {'part_name': 'خرطوم مكنسة برميل', 'part_sku': 'hvar0154', 'part_type': 'component', 'quantity': 1000},
                {'part_name': 'ماسوره معدنية لمكنسة برميل', 'part_sku': 'hvar0155', 'part_type': 'component', 'quantity': 1000},
                {'part_name': 'دراع موصل خرطوم مكنسة برميل', 'part_sku': 'hvar0161', 'part_type': 'component', 'quantity': 1000}
            ]
        },
        {
            'product': {
                'name_ar': 'مطحنة توابل هفار (5030)',
                'name_en': 'HVAR Spice Grinder 5030',
                'category': 'مطحنه توابل',
                'sku': 'hvar5030',
                'selling_price': 507.00,
                'purchase_price': 350.00,
                'opening_stock': 10000
            },
            'parts': [
                {'part_name': 'مطحنة توابل هفار', 'part_sku': 'hvar5030', 'part_type': 'assembly', 'quantity': 1000},
                {'part_name': 'غطاء مطحنة توابل 5030', 'part_sku': 'hvar0072', 'part_type': 'component', 'quantity': 1000}
            ]
        },
        {
            'product': {
                'name_ar': 'كبه هفار 6.5 لتر 2000 وات احمر (5070+5)',
                'name_en': 'HVAR Food Processor 6.5L 2000W Red',
                'category': 'كبه',
                'sku': 'hvar5070p5',
                'selling_price': 1335.41,
                'purchase_price': 900.00,
                'opening_stock': 10000
            },
            'parts': [
                {'part_name': 'ماتور كبه 5070', 'part_sku': 'hvar5071', 'part_type': 'motor', 'quantity': 1000},
                {'part_name': 'وعاء كبه 6.5 لتر', 'part_sku': 'hvar5072', 'part_type': 'component', 'quantity': 1000},
                {'part_name': 'شفرة كبه 5070', 'part_sku': 'hvar5073', 'part_type': 'component', 'quantity': 1000},
                {'part_name': 'غطا كبه 5070', 'part_sku': 'hvar5074', 'part_type': 'component', 'quantity': 1000},
                {'part_name': 'قاعدة كبه 5070', 'part_sku': 'hvar5075', 'part_type': 'component', 'quantity': 1000},
                {'part_name': 'كرتون كبه 5070', 'part_sku': 'hvar5076', 'part_type': 'packaging', 'quantity': 1000}
            ]
        },
        {
            'product': {
                'name_ar': 'كبه هفار 6.5 لتر 2000 وات 3 سرعات (5073)',
                'name_en': 'HVAR Food Processor 6.5L 2000W 3-Speed',
                'category': 'كبه',
                'sku': 'hvar5073',
                'selling_price': 970.00,
                'purchase_price': 650.00,
                'opening_stock': 10000
            },
            'parts': [
                {'part_name': 'ماتور كبه 5073', 'part_sku': 'hvar5074', 'part_type': 'motor', 'quantity': 1000},
                {'part_name': 'وعاء كبه 6.5 لتر', 'part_sku': 'hvar5075', 'part_type': 'component', 'quantity': 1000},
                {'part_name': 'شفرة كبه 5073', 'part_sku': 'hvar5076', 'part_type': 'component', 'quantity': 1000},
                {'part_name': 'غطا كبه 5073', 'part_sku': 'hvar5077', 'part_type': 'component', 'quantity': 1000},
                {'part_name': 'قاعدة كبه 5073', 'part_sku': 'hvar5078', 'part_type': 'component', 'quantity': 1000},
                {'part_name': 'كرتون كبه 5073', 'part_sku': 'hvar5079', 'part_type': 'packaging', 'quantity': 1000}
            ]
        },
        {
            'product': {
                'name_ar': 'كبه هفار 2000 وات - 5077 بلاك (5077)',
                'name_en': 'HVAR Food Processor 2000W Black 5077',
                'category': 'كبه',
                'sku': 'hvar5077',
                'selling_price': 560.00,
                'purchase_price': 380.00,
                'opening_stock': 10000
            },
            'parts': [
                {'part_name': 'ماتور كبه 5077', 'part_sku': 'hvar5078', 'part_type': 'motor', 'quantity': 1000},
                {'part_name': 'وعاء كبه 5077', 'part_sku': 'hvar5079', 'part_type': 'component', 'quantity': 1000},
                {'part_name': 'شفرة كبه 5077', 'part_sku': 'hvar5080', 'part_type': 'component', 'quantity': 1000},
                {'part_name': 'غطا كبه 5077', 'part_sku': 'hvar5081', 'part_type': 'component', 'quantity': 1000},
                {'part_name': 'قاعدة كبه 5077', 'part_sku': 'hvar5082', 'part_type': 'component', 'quantity': 1000},
                {'part_name': 'كرتون كبه 5077', 'part_sku': 'hvar5083', 'part_type': 'packaging', 'quantity': 1000}
            ]
        },
        {
            'product': {
                'name_ar': 'كبه هفار 1500 وات (5022)',
                'name_en': 'HVAR Food Processor 1500W 5022',
                'category': 'كبه',
                'sku': 'hvar5022',
                'selling_price': 578.31,
                'purchase_price': 400.00,
                'opening_stock': 10000
            },
            'parts': [
                {'part_name': 'ماتور كبه 5022', 'part_sku': 'hvar5023', 'part_type': 'motor', 'quantity': 1000},
                {'part_name': 'وعاء كبه 5022', 'part_sku': 'hvar5024', 'part_type': 'component', 'quantity': 1000},
                {'part_name': 'شفرة كبه 5022', 'part_sku': 'hvar5025', 'part_type': 'component', 'quantity': 1000},
                {'part_name': 'غطا كبه 5022', 'part_sku': 'hvar5026', 'part_type': 'component', 'quantity': 1000},
                {'part_name': 'قاعدة كبه 5022', 'part_sku': 'hvar5027', 'part_type': 'component', 'quantity': 1000},
                {'part_name': 'كرتون كبه 5022', 'part_sku': 'hvar5028', 'part_type': 'packaging', 'quantity': 1000}
            ]
        },
        {
            'product': {
                'name_ar': 'كبه هفار 1200 وات (5025)',
                'name_en': 'HVAR Food Processor 1200W 5025',
                'category': 'كبه',
                'sku': 'hvar5025',
                'selling_price': 1202.41,
                'purchase_price': 800.00,
                'opening_stock': 0  # Out of stock as per data
            },
            'parts': [
                {'part_name': 'ماتور كبه 5025', 'part_sku': 'hvar5026', 'part_type': 'motor', 'quantity': 1000},
                {'part_name': 'وعاء كبه 5025', 'part_sku': 'hvar5027', 'part_type': 'component', 'quantity': 1000},
                {'part_name': 'شفرة كبه 5025', 'part_sku': 'hvar5028', 'part_type': 'component', 'quantity': 1000},
                {'part_name': 'غطا كبه 5025', 'part_sku': 'hvar5029', 'part_type': 'component', 'quantity': 1000},
                {'part_name': 'قاعدة كبه 5025', 'part_sku': 'hvar5030', 'part_type': 'component', 'quantity': 1000},
                {'part_name': 'كرتون كبه 5025', 'part_sku': 'hvar5031', 'part_type': 'packaging', 'quantity': 1000}
            ]
        },
        {
            'product': {
                'name_ar': 'كبه هفار 1000 وات تربو أبيض (5027)',
                'name_en': 'HVAR Food Processor 1000W Turbo White 5027',
                'category': 'كبه',
                'sku': 'hvar5027',
                'selling_price': 1176.00,
                'purchase_price': 750.00,
                'opening_stock': 10000
            },
            'parts': [
                {'part_name': 'ماتور كبه 5027', 'part_sku': 'hvar5028', 'part_type': 'motor', 'quantity': 1000},
                {'part_name': 'وعاء كبه 5027', 'part_sku': 'hvar5029', 'part_type': 'component', 'quantity': 1000},
                {'part_name': 'شفرة كبه 5027', 'part_sku': 'hvar5030', 'part_type': 'component', 'quantity': 1000},
                {'part_name': 'غطا كبه 5027', 'part_sku': 'hvar5031', 'part_type': 'component', 'quantity': 1000},
                {'part_name': 'قاعدة كبه 5027', 'part_sku': 'hvar5032', 'part_type': 'component', 'quantity': 1000},
                {'part_name': 'كرتون كبه 5027', 'part_sku': 'hvar5033', 'part_type': 'packaging', 'quantity': 1000}
            ]
        },
        {
            'product': {
                'name_ar': 'كبه هفار 6.5 لتر 2000 وات موف (5070+4)',
                'name_en': 'HVAR Food Processor 6.5L 2000W Mauve',
                'category': 'كبه',
                'sku': 'hvar5070p4',
                'selling_price': 100.00,
                'purchase_price': 70.00,
                'opening_stock': 10000
            },
            'parts': [
                {'part_name': 'ماتور كبه 5070', 'part_sku': 'hvar5071', 'part_type': 'motor', 'quantity': 1000},
                {'part_name': 'وعاء كبه 6.5 لتر', 'part_sku': 'hvar5072', 'part_type': 'component', 'quantity': 1000},
                {'part_name': 'شفرة كبه 5070', 'part_sku': 'hvar5073', 'part_type': 'component', 'quantity': 1000},
                {'part_name': 'غطا كبه 5070', 'part_sku': 'hvar5074', 'part_type': 'component', 'quantity': 1000},
                {'part_name': 'قاعدة كبه 5070', 'part_sku': 'hvar5075', 'part_type': 'component', 'quantity': 1000},
                {'part_name': 'كرتون كبه 5070', 'part_sku': 'hvar5076', 'part_type': 'packaging', 'quantity': 1000}
            ]
        },
        {
            'product': {
                'name_ar': 'كبه هفار 6.5 لتر 2000 وات ليمونى (5070+3)',
                'name_en': 'HVAR Food Processor 6.5L 2000W Lemon',
                'category': 'كبه',
                'sku': 'hvar5070p3',
                'selling_price': 265.00,
                'purchase_price': 180.00,
                'opening_stock': 10000
            },
            'parts': [
                {'part_name': 'ماتور كبه 5070', 'part_sku': 'hvar5071', 'part_type': 'motor', 'quantity': 1000},
                {'part_name': 'وعاء كبه 6.5 لتر', 'part_sku': 'hvar5072', 'part_type': 'component', 'quantity': 1000},
                {'part_name': 'شفرة كبه 5070', 'part_sku': 'hvar5073', 'part_type': 'component', 'quantity': 1000},
                {'part_name': 'غطا كبه 5070', 'part_sku': 'hvar5074', 'part_type': 'component', 'quantity': 1000},
                {'part_name': 'قاعدة كبه 5070', 'part_sku': 'hvar5075', 'part_type': 'component', 'quantity': 1000},
                {'part_name': 'كرتون كبه 5070', 'part_sku': 'hvar5076', 'part_type': 'packaging', 'quantity': 1000}
            ]
        },
        {
            'product': {
                'name_ar': 'كبه هفار 6.5 لتر 2000 وات اسود - 5070 (5070)',
                'name_en': 'HVAR Food Processor 6.5L 2000W Black 5070',
                'category': 'كبه',
                'sku': 'hvar5070',
                'selling_price': 1015.91,
                'purchase_price': 680.00,
                'opening_stock': 10000
            },
            'parts': [
                {'part_name': 'ماتور كبه 5070', 'part_sku': 'hvar5071', 'part_type': 'motor', 'quantity': 1000},
                {'part_name': 'وعاء كبه 6.5 لتر', 'part_sku': 'hvar5072', 'part_type': 'component', 'quantity': 1000},
                {'part_name': 'شفرة كبه 5070', 'part_sku': 'hvar5073', 'part_type': 'component', 'quantity': 1000},
                {'part_name': 'غطا كبه 5070', 'part_sku': 'hvar5074', 'part_type': 'component', 'quantity': 1000},
                {'part_name': 'قاعدة كبه 5070', 'part_sku': 'hvar5075', 'part_type': 'component', 'quantity': 1000},
                {'part_name': 'كرتون كبه 5070', 'part_sku': 'hvar5076', 'part_type': 'packaging', 'quantity': 1000}
            ]
        },
        {
            'product': {
                'name_ar': 'كبه هفار 6.5 لتر 2000 وات بينك / روز (5070+1)',
                'name_en': 'HVAR Food Processor 6.5L 2000W Pink/Rose 5070+1',
                'category': 'كبه',
                'sku': 'hvar5070p1',
                'selling_price': 1795.41,
                'purchase_price': 1200.00,
                'opening_stock': 10000
            },
            'parts': [
                {'part_name': 'ماتور كبه 5070', 'part_sku': 'hvar5071', 'part_type': 'motor', 'quantity': 1000},
                {'part_name': 'وعاء كبه 6.5 لتر', 'part_sku': 'hvar5072', 'part_type': 'component', 'quantity': 1000},
                {'part_name': 'شفرة كبه 5070', 'part_sku': 'hvar5073', 'part_type': 'component', 'quantity': 1000},
                {'part_name': 'غطا كبه 5070', 'part_sku': 'hvar5074', 'part_type': 'component', 'quantity': 1000},
                {'part_name': 'قاعدة كبه 5070', 'part_sku': 'hvar5075', 'part_type': 'component', 'quantity': 1000},
                {'part_name': 'كرتون كبه 5070', 'part_sku': 'hvar5076', 'part_type': 'packaging', 'quantity': 1000}
            ]
        },
        {
            'product': {
                'name_ar': 'فرن هفار 46 لتر 2200 وات (10046)',
                'name_en': 'HVAR Electric Oven 46L 2200W 10046',
                'category': 'فرن هفار كهربائي',
                'sku': 'hvar10046',
                'selling_price': 0.00,  # Price not set
                'purchase_price': 0.00,
                'opening_stock': 10000
            },
            'parts': [
                {'part_name': 'ماتور فرن 10046', 'part_sku': 'hvar10047', 'part_type': 'motor', 'quantity': 1000},
                {'part_name': 'عنصر تسخين فرن', 'part_sku': 'hvar10048', 'part_type': 'heating_element', 'quantity': 1000},
                {'part_name': 'باب فرن', 'part_sku': 'hvar10049', 'part_type': 'component', 'quantity': 1000},
                {'part_name': 'صينية فرن', 'part_sku': 'hvar10050', 'part_type': 'component', 'quantity': 1000},
                {'part_name': 'مقياس حرارة فرن', 'part_sku': 'hvar10051', 'part_type': 'component', 'quantity': 1000},
                {'part_name': 'كرتون فرن', 'part_sku': 'hvar10052', 'part_type': 'packaging', 'quantity': 1000}
            ]
        },
        {
            'product': {
                'name_ar': 'عجان هفار 7 لتر (10007)',
                'name_en': 'HVAR Dough Mixer 7L 10007',
                'category': 'عجان',
                'sku': 'hvar10007',
                'selling_price': 0.00,  # Price not set
                'purchase_price': 0.00,
                'opening_stock': 10000
            },
            'parts': [
                {'part_name': 'ماتور عجان 10007', 'part_sku': 'hvar10008', 'part_type': 'motor', 'quantity': 1000},
                {'part_name': 'وعاء عجان 7 لتر', 'part_sku': 'hvar10009', 'part_type': 'component', 'quantity': 1000},
                {'part_name': 'شفرة عجان', 'part_sku': 'hvar10010', 'part_type': 'component', 'quantity': 1000},
                {'part_name': 'غطا عجان', 'part_sku': 'hvar10011', 'part_type': 'component', 'quantity': 1000},
                {'part_name': 'قاعدة عجان', 'part_sku': 'hvar10012', 'part_type': 'component', 'quantity': 1000},
                {'part_name': 'كرتون عجان', 'part_sku': 'hvar10013', 'part_type': 'packaging', 'quantity': 1000}
            ]
        },
        {
            'product': {
                'name_ar': 'خلاط هفار 8000 وات 3*1 (5066)',
                'name_en': 'HVAR Mixer 8000W 3*1 5066',
                'category': 'خلاط هفار',
                'sku': 'hvar5066',
                'selling_price': 2093.00,
                'purchase_price': 1400.00,
                'opening_stock': 10000
            },
            'parts': [
                {'part_name': 'ماتور خلاط 5066', 'part_sku': 'hvar5067', 'part_type': 'motor', 'quantity': 1000},
                {'part_name': 'وعاء خلاط 5066', 'part_sku': 'hvar5068', 'part_type': 'component', 'quantity': 1000},
                {'part_name': 'شفرة خلاط 5066', 'part_sku': 'hvar5069', 'part_type': 'component', 'quantity': 1000},
                {'part_name': 'غطا خلاط 5066', 'part_sku': 'hvar5070', 'part_type': 'component', 'quantity': 1000},
                {'part_name': 'قاعدة خلاط 5066', 'part_sku': 'hvar5071', 'part_type': 'component', 'quantity': 1000},
                {'part_name': 'كرتون خلاط 5066', 'part_sku': 'hvar5072', 'part_type': 'packaging', 'quantity': 1000}
            ]
        },
        {
            'product': {
                'name_ar': 'خلاط هفار 8000 وات 2*1 (5060)',
                'name_en': 'HVAR Mixer 8000W 2*1 5060',
                'category': 'خلاط هفار',
                'sku': 'hvar5060',
                'selling_price': 1769.00,
                'purchase_price': 1200.00,
                'opening_stock': 10000
            },
            'parts': [
                {'part_name': 'ماتور خلاط 5060', 'part_sku': 'hvar5061', 'part_type': 'motor', 'quantity': 1000},
                {'part_name': 'وعاء خلاط 5060', 'part_sku': 'hvar5062', 'part_type': 'component', 'quantity': 1000},
                {'part_name': 'شفرة خلاط 5060', 'part_sku': 'hvar5063', 'part_type': 'component', 'quantity': 1000},
                {'part_name': 'غطا خلاط 5060', 'part_sku': 'hvar5064', 'part_type': 'component', 'quantity': 1000},
                {'part_name': 'قاعدة خلاط 5060', 'part_sku': 'hvar5065', 'part_type': 'component', 'quantity': 1000},
                {'part_name': 'كرتون خلاط 5060', 'part_sku': 'hvar5066', 'part_type': 'packaging', 'quantity': 1000}
            ]
        }
    ] 