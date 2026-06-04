# ERP Last 50 Orders — order_description + Keys Mapping

> Generated from live ERP draft-dt. Date: 2026-03-09

---

## Key Mapping Summary

| ERP Key | Our Backend Key | Frontend Key | Stored in DB? |
|---------|-----------------|---------------|---------------|
| invoice_no | erp_order_id | order_number | Yes |
| mobile | customer_phone | customer.phone | Yes |
| contact_name_text | customer_name | customer.name | Yes |
| shipping_address | delivery_address | address_full | Yes |
| shipping_state | governorate | address_governorate | Yes |
| shipping_city | city | address_city | Yes |
| **shipping_details** | **order_description** | order_description, shipping_details | Yes |
| final_total | cod_amount | cod_amount | Yes (parsed) |
| total_quantity | — | items_count (raw ERP only) | No |
| transaction_date, added_by, business_location, etc. | — | — | No |

---

## Frontend Keys (from mapOrderFromBackend)

| Frontend key | Source | Where used |
|--------------|--------|------------|
| order_number | erp_order_id | OrdersTable, FAB, confirm, invoice label |
| customer.phone | customer_phone | Search, call session, Bosta match |
| customer.name | customer_name | Display, confirm, customer match |
| address_full | delivery_address | FAB address chip, confirm snapshot |
| address_governorate | governorate | Filters, FAB, OrdersTable |
| address_city | city | FAB, OrdersTable, confirm |
| **order_description** | order_description | Notes chip, FAB, autoMatchItems, confirm payload |
| shipping_details | order_description (same) | OrdersTable notes chip, getShortNotes |
| cod_amount | cod_amount | Display, confirm, leader-approve |
| bosta_tracking_number | bosta_tracking | OrdersTable, FAB, Bosta search |

---

## All 30 ERP Keys (Available per Row)

`invoice_no`, `transaction_date`, `contact_id`, `contact_name`, `contact_name_text`, `mobile`, `supplier_business_name`, `business_location`, `is_direct_sale`, `sub_status`, `commission_agent_name`, `commission_agent`, `shipping_state`, `shipping_city`, `shipping_address`, `shipping_details`, `final_total`, `coupon_code`, `total_items`, `total_quantity`, `added_by`, `is_export`, `postpone_button`, `postponed_days`, `postponed_at`, `postponed_to`, `postponed_status`, `marketing_source`, `action`, `DT_RowAttr`

---

## Last 50 Orders — order_description + Keys

### #1 DR2026/31203

**order_description (ERP shipping_details):**
```
1 * كبه هفار 2000 وات اسود b (5070+b)
```

**Our backend keys (from _erp_row_to_order):**
```
  attempt_count: 0
  city: 'مدينه منوف'
  cod_amount: 1850.0
  customer_name: 'ا نشوي حمدي رزق'
  customer_phone: '01067806329'
  delivery_address: 'منوف شارع عزيز نسيم أمام مستشفى الرمد منوفيه'
  erp_order_id: 'DR2026/31203'
  governorate: 'المنوفيه'
  order_description: '1 * كبه هفار 2000 وات اسود b (5070+b)'
  service_type: 'sell'
  source: 'erp'
  status: 'new'
```

**All ERP keys in this row:**
- `DT_RowAttr`: `{'data-href': 'https://erp.hvarstore.com/sells/68373'}`
- `action`: `<div class="btn-group">
                                <button type="button" class="tw-dw-btn tw-dw...`
- `added_by`: ` حسين مصطفي`
- `business_location`: `مخزن اون لاين`
- `commission_agent`: `شروق عبدالرحمن`
- `commission_agent_name`: ` شروق عبدالرحمن `
- `contact_id`: `50265`
- `contact_name`: `<a href="https://erp.hvarstore.com/contacts/50265">ا نشوي حمدي رزق</a>`
- `contact_name_text`: `ا نشوي حمدي رزق`
- `coupon_code`: null
- `final_total`: `<span class="final-total" data-orig-value="1850.0000">EGP 1,850.00</span>`
- `invoice_no`: `DR2026/31203`
- `is_direct_sale`: `1`
- `is_export`: `0`
- `marketing_source`: `<i class="fab fa-facebook"></i> Facebook`
- `mobile`: `01067806329`
- `postpone_button`: `&lt;button type=&quot;button&quot; class=&quot;btn btn-info btn-xs postpone-draft&quot; data-href=&q...`
- `postponed_at`: null
- `postponed_days`: `0`
- `postponed_status`: null
- `postponed_to`: `-`
- `shipping_address`: `منوف شارع عزيز نسيم أمام مستشفى الرمد منوفيه`
- `shipping_city`: `مدينه منوف`
- `shipping_details`: `1 * كبه هفار 2000 وات اسود b (5070+b)`
- `shipping_state`: `المنوفيه`
- `sub_status`: null
- `supplier_business_name`: null
- `total_items`: `1.00`
- `total_quantity`: `1.00`
- `transaction_date`: `11/02/2026 07:37 PM`

---

### #2 DR2026/32301

**order_description (ERP shipping_details):**
```
1 * هاند بلندر هفار 1500 وات 4*1 (5057)
```

**Our backend keys (from _erp_row_to_order):**
```
  attempt_count: 0
  city: 'طنطا'
  cod_amount: 2050.0
  customer_name: 'د ايمان عبد المعبود مصطفي'
  customer_phone: '01220219739'
  delivery_address: 'العنوان : الغربيه طنطا شارع الحكمه مركز الرحمن للعلاج الطبيعي أمام صيدليه الاسعاف'
  erp_order_id: 'DR2026/32301'
  governorate: 'الغربيه'
  order_description: '1 * هاند بلندر هفار 1500 وات 4*1 (5057)'
  service_type: 'sell'
  source: 'erp'
  status: 'new'
```

**All ERP keys in this row:**
- `DT_RowAttr`: `{'data-href': 'https://erp.hvarstore.com/sells/70045'}`
- `action`: `<div class="btn-group">
                                <button type="button" class="tw-dw-btn tw-dw...`
- `added_by`: ` حسين مصطفي`
- `business_location`: `مخزن اون لاين`
- `commission_agent`: `غاده`
- `commission_agent_name`: ` غاده `
- `contact_id`: `46872`
- `contact_name`: `<a href="https://erp.hvarstore.com/contacts/46872">د ايمان عبد المعبود مصطفي</a>`
- `contact_name_text`: `د ايمان عبد المعبود مصطفي`
- `coupon_code`: null
- `final_total`: `<span class="final-total" data-orig-value="2050.0000">EGP 2,050.00</span>`
- `invoice_no`: `DR2026/32301`
- `is_direct_sale`: `1`
- `is_export`: `0`
- `marketing_source`: `<i class="fab fa-facebook"></i> Facebook`
- `mobile`: `01220219739`
- `postpone_button`: `&lt;button type=&quot;button&quot; class=&quot;btn btn-info btn-xs postpone-draft&quot; data-href=&q...`
- `postponed_at`: `2026-02-23 11:46:16`
- `postponed_days`: `5`
- `postponed_status`: `postponed`
- `postponed_to`: `01/03/2026 12:00 AM`
- `shipping_address`: `العنوان : الغربيه طنطا شارع الحكمه مركز الرحمن للعلاج الطبيعي أمام صيدليه الاسعاف`
- `shipping_city`: `طنطا`
- `shipping_details`: `1 * هاند بلندر هفار 1500 وات 4*1 (5057)`
- `shipping_state`: `الغربيه`
- `sub_status`: null
- `supplier_business_name`: null
- `total_items`: `1.00`
- `total_quantity`: `1.00`
- `transaction_date`: `22/02/2026 01:48 PM`

---

### #3 DR2026/32558

**order_description (ERP shipping_details):**
```
1 * مضرب بيض 500 وات (1101)
```

**Our backend keys (from _erp_row_to_order):**
```
  attempt_count: 0
  city: 'الهرم - الاهرامات'
  cod_amount: 825.0
  customer_name: 'مدام شيماء'
  customer_phone: '01151088528'
  delivery_address: 'العنوان: شارع مكه من ترعه إخلاص طالبيه هرم محافظة الجيزة'
  erp_order_id: 'DR2026/32558'
  governorate: 'الجيزه'
  order_description: '1 * مضرب بيض 500 وات (1101)'
  service_type: 'sell'
  source: 'erp'
  status: 'new'
```

**All ERP keys in this row:**
- `DT_RowAttr`: `{'data-href': 'https://erp.hvarstore.com/sells/70510'}`
- `action`: `<div class="btn-group">
                                <button type="button" class="tw-dw-btn tw-dw...`
- `added_by`: ` حسين مصطفي`
- `business_location`: `مخزن اون لاين`
- `commission_agent`: `رحمه`
- `commission_agent_name`: ` رحمه `
- `contact_id`: `51565`
- `contact_name`: `<a href="https://erp.hvarstore.com/contacts/51565">مدام شيماء</a>`
- `contact_name_text`: `مدام شيماء`
- `coupon_code`: null
- `final_total`: `<span class="final-total" data-orig-value="825.0000">EGP 825.00</span>`
- `invoice_no`: `DR2026/32558`
- `is_direct_sale`: `1`
- `is_export`: `0`
- `marketing_source`: `<i class="fab fa-facebook"></i> Facebook`
- `mobile`: `01151088528`
- `postpone_button`: `&lt;button type=&quot;button&quot; class=&quot;btn btn-info btn-xs postpone-draft&quot; data-href=&q...`
- `postponed_at`: null
- `postponed_days`: `0`
- `postponed_status`: null
- `postponed_to`: `-`
- `shipping_address`: `العنوان: شارع مكه من ترعه إخلاص طالبيه هرم محافظة الجيزة`
- `shipping_city`: `الهرم - الاهرامات`
- `shipping_details`: `1 * مضرب بيض 500 وات (1101)`
- `shipping_state`: `الجيزه`
- `sub_status`: null
- `supplier_business_name`: null
- `total_items`: `1.00`
- `total_quantity`: `1.00`
- `transaction_date`: `26/02/2026 12:19 PM`

---

### #4 DR2026/32701

**order_description (ERP shipping_details):**
```
1 * هاند بلندر هفار 1500 وات 4*1 (5057)
```

**Our backend keys (from _erp_row_to_order):**
```
  attempt_count: 0
  city: 'سوهاج'
  cod_amount: 2250.0
  customer_name: 'ولاء فتحى عبد المولى'
  customer_phone: '01101810573'
  delivery_address: 'العنوان :سوهاج منطقة سيتى خلف معهد العارف شارع حسن ضيف الله آخره سوبر ماركت مكه الشارع اللى جمبه آخره البرج اللى على الشمال'
  erp_order_id: 'DR2026/32701'
  governorate: 'سوهاج'
  order_description: '1 * هاند بلندر هفار 1500 وات 4*1 (5057)'
  service_type: 'sell'
  source: 'erp'
  status: 'new'
```

**All ERP keys in this row:**
- `DT_RowAttr`: `{'data-href': 'https://erp.hvarstore.com/sells/70723'}`
- `action`: `<div class="btn-group">
                                <button type="button" class="tw-dw-btn tw-dw...`
- `added_by`: ` حسين مصطفي`
- `business_location`: `مخزن اون لاين`
- `commission_agent`: `غاده`
- `commission_agent_name`: ` غاده `
- `contact_id`: `51689`
- `contact_name`: `<a href="https://erp.hvarstore.com/contacts/51689">ولاء فتحى عبد المولى</a>`
- `contact_name_text`: `ولاء فتحى عبد المولى`
- `coupon_code`: null
- `final_total`: `<span class="final-total" data-orig-value="2250.0000">EGP 2,250.00</span>`
- `invoice_no`: `DR2026/32701`
- `is_direct_sale`: `1`
- `is_export`: `0`
- `marketing_source`: `<i class="fab fa-facebook"></i> Facebook`
- `mobile`: `01101810573`
- `postpone_button`: `&lt;button type=&quot;button&quot; class=&quot;btn btn-info btn-xs postpone-draft&quot; data-href=&q...`
- `postponed_at`: null
- `postponed_days`: `0`
- `postponed_status`: null
- `postponed_to`: `-`
- `shipping_address`: `العنوان :سوهاج منطقة سيتى خلف معهد العارف شارع حسن ضيف الله آخره سوبر ماركت مكه الشارع اللى جمبه آخر...`
- `shipping_city`: `سوهاج`
- `shipping_details`: `1 * هاند بلندر هفار 1500 وات 4*1 (5057)`
- `shipping_state`: `سوهاج`
- `sub_status`: null
- `supplier_business_name`: null
- `total_items`: `1.00`
- `total_quantity`: `1.00`
- `transaction_date`: `28/02/2026 01:25 PM`

---

### #5 DR2026/32807

**order_description (ERP shipping_details):**
```
1 * كبه هفار 6.5 لتر 2000 وات 4 سرعات (5070+04) 1 * هاند بلندر هفار 1500 وات 4*1 (5057)
```

**Our backend keys (from _erp_row_to_order):**
```
  attempt_count: 0
  city: 'حلوان'
  cod_amount: 3800.0
  customer_name: 'مارى جرجس عبد الحى'
  customer_phone: '01101332453'
  delivery_address: 'العنوان :محافظه القاهرة\r\nتابعه لمركز اي /حلوان\r\nاسم الشارع /المشروع الأمريكى مجاورة 8 منزل 1 شارع 219 أمام مقبرة السيارات الطريق الجديد بجوار قنديل مصر للديكور'
  erp_order_id: 'DR2026/32807'
  governorate: 'القاهره'
  order_description: '1 * كبه هفار 6.5 لتر 2000 وات 4 سرعات (5070+04) 1 * هاند بلندر هفار 1500 وات 4*1 (5057)'
  service_type: 'sell'
  source: 'erp'
  status: 'new'
```

**All ERP keys in this row:**
- `DT_RowAttr`: `{'data-href': 'https://erp.hvarstore.com/sells/70880'}`
- `action`: `<div class="btn-group">
                                <button type="button" class="tw-dw-btn tw-dw...`
- `added_by`: ` حسين مصطفي`
- `business_location`: `مخزن اون لاين`
- `commission_agent`: `مني`
- `commission_agent_name`: ` مني `
- `contact_id`: `51778`
- `contact_name`: `<a href="https://erp.hvarstore.com/contacts/51778">مارى جرجس عبد الحى</a>`
- `contact_name_text`: `مارى جرجس عبد الحى`
- `coupon_code`: null
- `final_total`: `<span class="final-total" data-orig-value="3800.0000">EGP 3,800.00</span>`
- `invoice_no`: `DR2026/32807`
- `is_direct_sale`: `1`
- `is_export`: `0`
- `marketing_source`: `<i class="fab fa-facebook"></i> Facebook`
- `mobile`: `01101332453`
- `postpone_button`: `&lt;button type=&quot;button&quot; class=&quot;btn btn-info btn-xs postpone-draft&quot; data-href=&q...`
- `postponed_at`: null
- `postponed_days`: `0`
- `postponed_status`: null
- `postponed_to`: `-`
- `shipping_address`: `العنوان :محافظه القاهرة
تابعه لمركز اي /حلوان
اسم الشارع /المشروع الأمريكى مجاورة 8 منزل 1 شارع 21...`
- `shipping_city`: `حلوان`
- `shipping_details`: `1 * كبه هفار 6.5 لتر 2000 وات 4 سرعات (5070+04) 1 * هاند بلندر هفار 1500 وات 4*1 (5057)`
- `shipping_state`: `القاهره`
- `sub_status`: null
- `supplier_business_name`: null
- `total_items`: `2.00`
- `total_quantity`: `2.00`
- `transaction_date`: `02/03/2026 01:59 AM`

---

### #6 DR2026/32827

**order_description (ERP shipping_details):**
```
1 * كبه هفار 6.5 لتر 2000 وات 4 سرعات (5070+04)
```

**Our backend keys (from _erp_row_to_order):**
```
  attempt_count: 0
  city: 'الهرم - فيصل'
  cod_amount: 1850.0
  customer_name: 'حسام الدين كريم جمال'
  customer_phone: '01019964498'
  delivery_address: 'العنوان :محافظه الجيزه \r\nش عطيه شراره ترعة عبد العال٢ من شارع العشرين فيصل ناصية الشارع موان ام النور'
  erp_order_id: 'DR2026/32827'
  governorate: 'الجيزه'
  order_description: '1 * كبه هفار 6.5 لتر 2000 وات 4 سرعات (5070+04)'
  service_type: 'sell'
  source: 'erp'
  status: 'new'
```

**All ERP keys in this row:**
- `DT_RowAttr`: `{'data-href': 'https://erp.hvarstore.com/sells/70900'}`
- `action`: `<div class="btn-group">
                                <button type="button" class="tw-dw-btn tw-dw...`
- `added_by`: ` حسين مصطفي`
- `business_location`: `مخزن اون لاين`
- `commission_agent`: `مني`
- `commission_agent_name`: ` مني `
- `contact_id`: `51793`
- `contact_name`: `<a href="https://erp.hvarstore.com/contacts/51793">حسام الدين كريم جمال</a>`
- `contact_name_text`: `حسام الدين كريم جمال`
- `coupon_code`: null
- `final_total`: `<span class="final-total" data-orig-value="1850.0000">EGP 1,850.00</span>`
- `invoice_no`: `DR2026/32827`
- `is_direct_sale`: `1`
- `is_export`: `0`
- `marketing_source`: `<i class="fab fa-facebook"></i> Facebook`
- `mobile`: `01019964498`
- `postpone_button`: `&lt;button type=&quot;button&quot; class=&quot;btn btn-info btn-xs postpone-draft&quot; data-href=&q...`
- `postponed_at`: null
- `postponed_days`: `0`
- `postponed_status`: null
- `postponed_to`: `-`
- `shipping_address`: `العنوان :محافظه الجيزه 
ش عطيه شراره ترعة عبد العال٢ من شارع العشرين فيصل ناصية الشارع موان ام النو...`
- `shipping_city`: `الهرم - فيصل`
- `shipping_details`: `1 * كبه هفار 6.5 لتر 2000 وات 4 سرعات (5070+04)`
- `shipping_state`: `الجيزه`
- `sub_status`: null
- `supplier_business_name`: null
- `total_items`: `1.00`
- `total_quantity`: `1.00`
- `transaction_date`: `02/03/2026 02:18 AM`

---

### #7 DR2026/32904

**order_description (ERP shipping_details):**
```
1 * مضرب بيض 500 وات بالحلة (1104)
```

**Our backend keys (from _erp_row_to_order):**
```
  attempt_count: 0
  city: 'سيدي جابر - مصطفي كامل وبولكلي'
  cod_amount: 1500.0
  customer_name: 'ياسر الصعيدى'
  customer_phone: '01126493263'
  delivery_address: 'العنوان :اسكندرية منطقة بولكلي شارع احمد فؤاد درويش عمارة برج البارون رقم 12'
  erp_order_id: 'DR2026/32904'
  governorate: 'الاسكندريه'
  order_description: '1 * مضرب بيض 500 وات بالحلة (1104)'
  service_type: 'sell'
  source: 'erp'
  status: 'new'
```

**All ERP keys in this row:**
- `DT_RowAttr`: `{'data-href': 'https://erp.hvarstore.com/sells/70997'}`
- `action`: `<div class="btn-group">
                                <button type="button" class="tw-dw-btn tw-dw...`
- `added_by`: ` محمد راشد `
- `business_location`: `مخزن اون لاين`
- `commission_agent`: `غاده`
- `commission_agent_name`: ` غاده `
- `contact_id`: `51852`
- `contact_name`: `<a href="https://erp.hvarstore.com/contacts/51852">ياسر الصعيدى</a>`
- `contact_name_text`: `ياسر الصعيدى`
- `coupon_code`: null
- `final_total`: `<span class="final-total" data-orig-value="1500.0000">EGP 1,500.00</span>`
- `invoice_no`: `DR2026/32904`
- `is_direct_sale`: `1`
- `is_export`: `0`
- `marketing_source`: `<i class="fab fa-facebook"></i> Facebook`
- `mobile`: `01126493263`
- `postpone_button`: `&lt;button type=&quot;button&quot; class=&quot;btn btn-info btn-xs postpone-draft&quot; data-href=&q...`
- `postponed_at`: null
- `postponed_days`: `0`
- `postponed_status`: null
- `postponed_to`: `-`
- `shipping_address`: `العنوان :اسكندرية منطقة بولكلي شارع احمد فؤاد درويش عمارة برج البارون رقم 12`
- `shipping_city`: `سيدي جابر - مصطفي كامل وبولكلي`
- `shipping_details`: `1 * مضرب بيض 500 وات بالحلة (1104)`
- `shipping_state`: `الاسكندريه`
- `sub_status`: null
- `supplier_business_name`: null
- `total_items`: `1.00`
- `total_quantity`: `1.00`
- `transaction_date`: `02/03/2026 12:44 PM`

---

### #8 DR2026/32918

**order_description (ERP shipping_details):**
```
1 * كبه هفار 6.5 لتر 2000 وات 4 سرعات (5070+04)
```

**Our backend keys (from _erp_row_to_order):**
```
  attempt_count: 0
  city: 'طوخ'
  cod_amount: 1850.0
  customer_name: 'أسامة جوز نورا'
  customer_phone: '01093282323'
  delivery_address: 'كفر الجمال \r\nطوخ \r\nقليوبيه \r\nمدرسه كفر الجمال الابتدائيه بجوار سنترال احمد بدوى\r\nاحمد ابراهيم عبد الصمد'
  erp_order_id: 'DR2026/32918'
  governorate: 'القليوبيه'
  order_description: '1 * كبه هفار 6.5 لتر 2000 وات 4 سرعات (5070+04)'
  service_type: 'sell'
  source: 'erp'
  status: 'new'
```

**All ERP keys in this row:**
- `DT_RowAttr`: `{'data-href': 'https://erp.hvarstore.com/sells/71033'}`
- `action`: `<div class="btn-group">
                                <button type="button" class="tw-dw-btn tw-dw...`
- `added_by`: ` محمد راشد `
- `business_location`: `مخزن اون لاين`
- `commission_agent`: `شروق عبدالرحمن`
- `commission_agent_name`: ` شروق عبدالرحمن `
- `contact_id`: `51863`
- `contact_name`: `<a href="https://erp.hvarstore.com/contacts/51863">أسامة جوز نورا</a>`
- `contact_name_text`: `أسامة جوز نورا`
- `coupon_code`: null
- `final_total`: `<span class="final-total" data-orig-value="1850.0000">EGP 1,850.00</span>`
- `invoice_no`: `DR2026/32918`
- `is_direct_sale`: `1`
- `is_export`: `0`
- `marketing_source`: `<i class="fab fa-facebook"></i> Facebook`
- `mobile`: `01093282323`
- `postpone_button`: `&lt;button type=&quot;button&quot; class=&quot;btn btn-info btn-xs postpone-draft&quot; data-href=&q...`
- `postponed_at`: null
- `postponed_days`: `0`
- `postponed_status`: null
- `postponed_to`: `-`
- `shipping_address`: `كفر الجمال 
طوخ 
قليوبيه 
مدرسه كفر الجمال الابتدائيه بجوار سنترال احمد بدوى
احمد ابراهيم عبد ال...`
- `shipping_city`: `طوخ`
- `shipping_details`: `1 * كبه هفار 6.5 لتر 2000 وات 4 سرعات (5070+04)`
- `shipping_state`: `القليوبيه`
- `sub_status`: null
- `supplier_business_name`: null
- `total_items`: `1.00`
- `total_quantity`: `1.00`
- `transaction_date`: `02/03/2026 03:21 PM`

---

### #9 DR2026/32973

**order_description (ERP shipping_details):**
```
1 * مكنسة هفار 2000 وات تربو (7720)
```

**Our backend keys (from _erp_row_to_order):**
```
  attempt_count: 0
  city: 'كفر صقر'
  cod_amount: 2550.0
  customer_name: 'رمضان محمد حسن'
  customer_phone: '01080471463'
  delivery_address: 'العنوان :محافظة الشرقيه/مركز كفرصقر\r\nحي النصر /خلف مسجد الفتح'
  erp_order_id: 'DR2026/32973'
  governorate: 'الشرقيه'
  order_description: '1 * مكنسة هفار 2000 وات تربو (7720)'
  service_type: 'sell'
  source: 'erp'
  status: 'new'
```

**All ERP keys in this row:**
- `DT_RowAttr`: `{'data-href': 'https://erp.hvarstore.com/sells/71090'}`
- `action`: `<div class="btn-group">
                                <button type="button" class="tw-dw-btn tw-dw...`
- `added_by`: ` حسين مصطفي`
- `business_location`: `مخزن اون لاين`
- `commission_agent`: `مني`
- `commission_agent_name`: ` مني `
- `contact_id`: `51910`
- `contact_name`: `<a href="https://erp.hvarstore.com/contacts/51910">رمضان محمد حسن</a>`
- `contact_name_text`: `رمضان محمد حسن`
- `coupon_code`: null
- `final_total`: `<span class="final-total" data-orig-value="2550.0000">EGP 2,550.00</span>`
- `invoice_no`: `DR2026/32973`
- `is_direct_sale`: `1`
- `is_export`: `0`
- `marketing_source`: `<i class="fab fa-facebook"></i> Facebook`
- `mobile`: `01080471463`
- `postpone_button`: `&lt;button type=&quot;button&quot; class=&quot;btn btn-info btn-xs postpone-draft&quot; data-href=&q...`
- `postponed_at`: null
- `postponed_days`: `0`
- `postponed_status`: null
- `postponed_to`: `-`
- `shipping_address`: `العنوان :محافظة الشرقيه/مركز كفرصقر
حي النصر /خلف مسجد الفتح`
- `shipping_city`: `كفر صقر`
- `shipping_details`: `1 * مكنسة هفار 2000 وات تربو (7720)`
- `shipping_state`: `الشرقيه`
- `sub_status`: null
- `supplier_business_name`: null
- `total_items`: `1.00`
- `total_quantity`: `1.00`
- `transaction_date`: `03/03/2026 02:56 AM`

---

### #10 DR2026/32974

**order_description (ERP shipping_details):**
```
1 * مكنسة هفار 2000 وات تربو (7720)
```

**Our backend keys (from _erp_row_to_order):**
```
  attempt_count: 0
  city: 'كفر صقر'
  cod_amount: 2550.0
  customer_name: 'رمضان محمد حسن'
  customer_phone: '01080471463'
  delivery_address: 'العنوان :محافظة الشرقيه/مركز كفرصقر\r\nحي النصر /خلف مسجد الفتح'
  erp_order_id: 'DR2026/32974'
  governorate: 'الشرقيه'
  order_description: '1 * مكنسة هفار 2000 وات تربو (7720)'
  service_type: 'sell'
  source: 'erp'
  status: 'new'
```

**All ERP keys in this row:**
- `DT_RowAttr`: `{'data-href': 'https://erp.hvarstore.com/sells/71091'}`
- `action`: `<div class="btn-group">
                                <button type="button" class="tw-dw-btn tw-dw...`
- `added_by`: ` حسين مصطفي`
- `business_location`: `مخزن اون لاين`
- `commission_agent`: `مني`
- `commission_agent_name`: ` مني `
- `contact_id`: `51910`
- `contact_name`: `<a href="https://erp.hvarstore.com/contacts/51910">رمضان محمد حسن</a>`
- `contact_name_text`: `رمضان محمد حسن`
- `coupon_code`: null
- `final_total`: `<span class="final-total" data-orig-value="2550.0000">EGP 2,550.00</span>`
- `invoice_no`: `DR2026/32974`
- `is_direct_sale`: `1`
- `is_export`: `0`
- `marketing_source`: `<i class="fab fa-facebook"></i> Facebook`
- `mobile`: `01080471463`
- `postpone_button`: `&lt;button type=&quot;button&quot; class=&quot;btn btn-info btn-xs postpone-draft&quot; data-href=&q...`
- `postponed_at`: null
- `postponed_days`: `0`
- `postponed_status`: null
- `postponed_to`: `-`
- `shipping_address`: `العنوان :محافظة الشرقيه/مركز كفرصقر
حي النصر /خلف مسجد الفتح`
- `shipping_city`: `كفر صقر`
- `shipping_details`: `1 * مكنسة هفار 2000 وات تربو (7720)`
- `shipping_state`: `الشرقيه`
- `sub_status`: null
- `supplier_business_name`: null
- `total_items`: `1.00`
- `total_quantity`: `1.00`
- `transaction_date`: `03/03/2026 02:56 AM`

---

### #11 DR2026/32975

**order_description (ERP shipping_details):**
```
1 * خلاط هفار 8000 وات 2*1 (5062) 1 * هاند بلندر هفار 1500 وات 4*1 (5057)
```

**Our backend keys (from _erp_row_to_order):**
```
  attempt_count: 0
  city: 'كفر صقر'
  cod_amount: 3650.0
  customer_name: 'رمضان محمد حسن'
  customer_phone: '01080471463'
  delivery_address: 'العنوان :محافظة الشرقيه/مركز كفرصقر\r\nحي النصر /خلف مسجد الفتح'
  erp_order_id: 'DR2026/32975'
  governorate: 'الشرقيه'
  order_description: '1 * خلاط هفار 8000 وات 2*1 (5062) 1 * هاند بلندر هفار 1500 وات 4*1 (5057)'
  service_type: 'sell'
  source: 'erp'
  status: 'new'
```

**All ERP keys in this row:**
- `DT_RowAttr`: `{'data-href': 'https://erp.hvarstore.com/sells/71092'}`
- `action`: `<div class="btn-group">
                                <button type="button" class="tw-dw-btn tw-dw...`
- `added_by`: ` حسين مصطفي`
- `business_location`: `مخزن اون لاين`
- `commission_agent`: `مني`
- `commission_agent_name`: ` مني `
- `contact_id`: `51910`
- `contact_name`: `<a href="https://erp.hvarstore.com/contacts/51910">رمضان محمد حسن</a>`
- `contact_name_text`: `رمضان محمد حسن`
- `coupon_code`: null
- `final_total`: `<span class="final-total" data-orig-value="3650.0000">EGP 3,650.00</span>`
- `invoice_no`: `DR2026/32975`
- `is_direct_sale`: `1`
- `is_export`: `0`
- `marketing_source`: `<i class="fab fa-facebook"></i> Facebook`
- `mobile`: `01080471463`
- `postpone_button`: `&lt;button type=&quot;button&quot; class=&quot;btn btn-info btn-xs postpone-draft&quot; data-href=&q...`
- `postponed_at`: null
- `postponed_days`: `0`
- `postponed_status`: null
- `postponed_to`: `-`
- `shipping_address`: `العنوان :محافظة الشرقيه/مركز كفرصقر
حي النصر /خلف مسجد الفتح`
- `shipping_city`: `كفر صقر`
- `shipping_details`: `1 * خلاط هفار 8000 وات 2*1 (5062) 1 * هاند بلندر هفار 1500 وات 4*1 (5057)`
- `shipping_state`: `الشرقيه`
- `sub_status`: null
- `supplier_business_name`: null
- `total_items`: `2.00`
- `total_quantity`: `2.00`
- `transaction_date`: `03/03/2026 02:57 AM`

---

### #12 DR2026/32984

**order_description (ERP shipping_details):**
```
1 * خلاط هفار 8000 وات 2*1 (5062)
```

**Our backend keys (from _erp_row_to_order):**
```
  attempt_count: 0
  city: 'عين شمس - حلميه الزيتون'
  cod_amount: 1850.0
  customer_name: 'ابو انس'
  customer_phone: '01098907337'
  delivery_address: 'العنوان: 30 شارع عين شمس حلمية الزيتون القاهرة / في مطعم ام انس'
  erp_order_id: 'DR2026/32984'
  governorate: 'القاهره'
  order_description: '1 * خلاط هفار 8000 وات 2*1 (5062)'
  service_type: 'sell'
  source: 'erp'
  status: 'new'
```

**All ERP keys in this row:**
- `DT_RowAttr`: `{'data-href': 'https://erp.hvarstore.com/sells/71101'}`
- `action`: `<div class="btn-group">
                                <button type="button" class="tw-dw-btn tw-dw...`
- `added_by`: ` حسين مصطفي`
- `business_location`: `مخزن اون لاين`
- `commission_agent`: `رحمه`
- `commission_agent_name`: ` رحمه `
- `contact_id`: `51917`
- `contact_name`: `<a href="https://erp.hvarstore.com/contacts/51917">ابو انس</a>`
- `contact_name_text`: `ابو انس`
- `coupon_code`: null
- `final_total`: `<span class="final-total" data-orig-value="1850.0000">EGP 1,850.00</span>`
- `invoice_no`: `DR2026/32984`
- `is_direct_sale`: `1`
- `is_export`: `0`
- `marketing_source`: `<i class="fab fa-facebook"></i> Facebook`
- `mobile`: `01098907337`
- `postpone_button`: `&lt;button type=&quot;button&quot; class=&quot;btn btn-info btn-xs postpone-draft&quot; data-href=&q...`
- `postponed_at`: null
- `postponed_days`: `0`
- `postponed_status`: null
- `postponed_to`: `-`
- `shipping_address`: `العنوان: 30 شارع عين شمس حلمية الزيتون القاهرة / في مطعم ام انس`
- `shipping_city`: `عين شمس - حلميه الزيتون`
- `shipping_details`: `1 * خلاط هفار 8000 وات 2*1 (5062)`
- `shipping_state`: `القاهره`
- `sub_status`: null
- `supplier_business_name`: null
- `total_items`: `1.00`
- `total_quantity`: `1.00`
- `transaction_date`: `03/03/2026 03:05 AM`

---

### #13 DR2026/32986

**order_description (ERP shipping_details):**
```
1 * مضرب بيض 500 وات بالحلة (1104)
```

**Our backend keys (from _erp_row_to_order):**
```
  attempt_count: 0
  city: 'الاسماعيليه 01 - نفيشه'
  cod_amount: 1600.0
  customer_name: 'ام حنين'
  customer_phone: '01200635653'
  delivery_address: 'العنوان: محافظة الاسماعيليه نفيشه البحريه بجوار مركز القاضي وبجوار مركز البشير'
  erp_order_id: 'DR2026/32986'
  governorate: 'الاسماعيليه'
  order_description: '1 * مضرب بيض 500 وات بالحلة (1104)'
  service_type: 'sell'
  source: 'erp'
  status: 'new'
```

**All ERP keys in this row:**
- `DT_RowAttr`: `{'data-href': 'https://erp.hvarstore.com/sells/71103'}`
- `action`: `<div class="btn-group">
                                <button type="button" class="tw-dw-btn tw-dw...`
- `added_by`: ` حسين مصطفي`
- `business_location`: `مخزن اون لاين`
- `commission_agent`: `رحمه`
- `commission_agent_name`: ` رحمه `
- `contact_id`: `51919`
- `contact_name`: `<a href="https://erp.hvarstore.com/contacts/51919">ام حنين</a>`
- `contact_name_text`: `ام حنين`
- `coupon_code`: null
- `final_total`: `<span class="final-total" data-orig-value="1600.0000">EGP 1,600.00</span>`
- `invoice_no`: `DR2026/32986`
- `is_direct_sale`: `1`
- `is_export`: `0`
- `marketing_source`: `<i class="fab fa-facebook"></i> Facebook`
- `mobile`: `01200635653`
- `postpone_button`: `&lt;button type=&quot;button&quot; class=&quot;btn btn-info btn-xs postpone-draft&quot; data-href=&q...`
- `postponed_at`: null
- `postponed_days`: `0`
- `postponed_status`: null
- `postponed_to`: `-`
- `shipping_address`: `العنوان: محافظة الاسماعيليه نفيشه البحريه بجوار مركز القاضي وبجوار مركز البشير`
- `shipping_city`: `الاسماعيليه 01 - نفيشه`
- `shipping_details`: `1 * مضرب بيض 500 وات بالحلة (1104)`
- `shipping_state`: `الاسماعيليه`
- `sub_status`: null
- `supplier_business_name`: null
- `total_items`: `1.00`
- `total_quantity`: `1.00`
- `transaction_date`: `03/03/2026 03:06 AM`

---

### #14 DR2026/33006

**order_description (ERP shipping_details):**
```
1 * كبه هفار 6.5 لتر 2000 وات 4 سرعات (5070+04)
```

**Our backend keys (from _erp_row_to_order):**
```
  attempt_count: 0
  city: '٦ اكتوبر - حدائق أكتوبر'
  cod_amount: 1850.0
  customer_name: 'آية أيمن عبدالرازق علي'
  customer_phone: '01226551759'
  delivery_address: 'العنوان :   حدائق أكتوبر المنطقة الخامسة قطاع ك قطعة ١٥٤'
  erp_order_id: 'DR2026/33006'
  governorate: 'الجيزه'
  order_description: '1 * كبه هفار 6.5 لتر 2000 وات 4 سرعات (5070+04)'
  service_type: 'sell'
  source: 'erp'
  status: 'new'
```

**All ERP keys in this row:**
- `DT_RowAttr`: `{'data-href': 'https://erp.hvarstore.com/sells/71139'}`
- `action`: `<div class="btn-group">
                                <button type="button" class="tw-dw-btn tw-dw...`
- `added_by`: ` محمد راشد `
- `business_location`: `مخزن اون لاين`
- `commission_agent`: `مايفن`
- `commission_agent_name`: ` مايفن `
- `contact_id`: `51941`
- `contact_name`: `<a href="https://erp.hvarstore.com/contacts/51941">آية أيمن عبدالرازق علي</a>`
- `contact_name_text`: `آية أيمن عبدالرازق علي`
- `coupon_code`: null
- `final_total`: `<span class="final-total" data-orig-value="1850.0000">EGP 1,850.00</span>`
- `invoice_no`: `DR2026/33006`
- `is_direct_sale`: `1`
- `is_export`: `0`
- `marketing_source`: `<i class="fab fa-facebook"></i> Facebook`
- `mobile`: `01226551759`
- `postpone_button`: `&lt;button type=&quot;button&quot; class=&quot;btn btn-info btn-xs postpone-draft&quot; data-href=&q...`
- `postponed_at`: null
- `postponed_days`: `0`
- `postponed_status`: null
- `postponed_to`: `-`
- `shipping_address`: `العنوان :   حدائق أكتوبر المنطقة الخامسة قطاع ك قطعة ١٥٤`
- `shipping_city`: `٦ اكتوبر - حدائق أكتوبر`
- `shipping_details`: `1 * كبه هفار 6.5 لتر 2000 وات 4 سرعات (5070+04)`
- `shipping_state`: `الجيزه`
- `sub_status`: null
- `supplier_business_name`: null
- `total_items`: `1.00`
- `total_quantity`: `1.00`
- `transaction_date`: `03/03/2026 10:50 AM`

---

### #15 DR2026/33016

**order_description (ERP shipping_details):**
```
1 * هاند بلندر هفار 1500 وات 4*1 (5057)
```

**Our backend keys (from _erp_row_to_order):**
```
  attempt_count: 0
  city: 'قسم اول - السلام'
  cod_amount: 2250.0
  customer_name: 'هنا'
  customer_phone: '01005600612'
  delivery_address: 'عنوان الشحن\r\nحي السلام\r\nالاسماعيليه, Ismailia'
  erp_order_id: 'DR2026/33016'
  governorate: 'الاسماعيليه'
  order_description: '1 * هاند بلندر هفار 1500 وات 4*1 (5057)'
  service_type: 'sell'
  source: 'erp'
  status: 'new'
```

**All ERP keys in this row:**
- `DT_RowAttr`: `{'data-href': 'https://erp.hvarstore.com/sells/71155'}`
- `action`: `<div class="btn-group">
                                <button type="button" class="tw-dw-btn tw-dw...`
- `added_by`: ` محمد راشد `
- `business_location`: `مخزن اون لاين`
- `commission_agent`: `فواتير السايت`
- `commission_agent_name`: ` فواتير السايت `
- `contact_id`: `51950`
- `contact_name`: `<a href="https://erp.hvarstore.com/contacts/51950">هنا</a>`
- `contact_name_text`: `هنا`
- `coupon_code`: null
- `final_total`: `<span class="final-total" data-orig-value="2250.0000">EGP 2,250.00</span>`
- `invoice_no`: `DR2026/33016`
- `is_direct_sale`: `1`
- `is_export`: `0`
- `marketing_source`: `<i class="fas fa-store"></i> Walk-in`
- `mobile`: `01005600612`
- `postpone_button`: `&lt;button type=&quot;button&quot; class=&quot;btn btn-info btn-xs postpone-draft&quot; data-href=&q...`
- `postponed_at`: null
- `postponed_days`: `0`
- `postponed_status`: null
- `postponed_to`: `-`
- `shipping_address`: `عنوان الشحن
حي السلام
الاسماعيليه, Ismailia`
- `shipping_city`: `قسم اول - السلام`
- `shipping_details`: `1 * هاند بلندر هفار 1500 وات 4*1 (5057)`
- `shipping_state`: `الاسماعيليه`
- `sub_status`: null
- `supplier_business_name`: null
- `total_items`: `1.00`
- `total_quantity`: `1.00`
- `transaction_date`: `03/03/2026 10:58 AM`

---

### #16 DR2026/33049

**order_description (ERP shipping_details):**
```
1 * كبه هفار 6.5 لتر 2000 وات 4 سرعات (5070+04)
```

**Our backend keys (from _erp_row_to_order):**
```
  attempt_count: 0
  city: 'ابو حمص'
  cod_amount: 1850.0
  customer_name: 'رحاب عبد الجواد احمد ماضي'
  customer_phone: '01282331197'
  delivery_address: 'العنوان :  البحيرة \r\nمركز ابو حمص \r\nشارع ٨ خلف البنك الأهلي'
  erp_order_id: 'DR2026/33049'
  governorate: 'البحيره'
  order_description: '1 * كبه هفار 6.5 لتر 2000 وات 4 سرعات (5070+04)'
  service_type: 'sell'
  source: 'erp'
  status: 'new'
```

**All ERP keys in this row:**
- `DT_RowAttr`: `{'data-href': 'https://erp.hvarstore.com/sells/71193'}`
- `action`: `<div class="btn-group">
                                <button type="button" class="tw-dw-btn tw-dw...`
- `added_by`: ` محمد راشد `
- `business_location`: `مخزن اون لاين`
- `commission_agent`: `مايفن`
- `commission_agent_name`: ` مايفن `
- `contact_id`: `51979`
- `contact_name`: `<a href="https://erp.hvarstore.com/contacts/51979">رحاب عبد الجواد احمد ماضي</a>`
- `contact_name_text`: `رحاب عبد الجواد احمد ماضي`
- `coupon_code`: null
- `final_total`: `<span class="final-total" data-orig-value="1850.0000">EGP 1,850.00</span>`
- `invoice_no`: `DR2026/33049`
- `is_direct_sale`: `1`
- `is_export`: `0`
- `marketing_source`: `<i class="fab fa-facebook"></i> Facebook`
- `mobile`: `01282331197`
- `postpone_button`: `&lt;button type=&quot;button&quot; class=&quot;btn btn-info btn-xs postpone-draft&quot; data-href=&q...`
- `postponed_at`: null
- `postponed_days`: `0`
- `postponed_status`: null
- `postponed_to`: `-`
- `shipping_address`: `العنوان :  البحيرة 
مركز ابو حمص 
شارع ٨ خلف البنك الأهلي`
- `shipping_city`: `ابو حمص`
- `shipping_details`: `1 * كبه هفار 6.5 لتر 2000 وات 4 سرعات (5070+04)`
- `shipping_state`: `البحيره`
- `sub_status`: null
- `supplier_business_name`: null
- `total_items`: `1.00`
- `total_quantity`: `1.00`
- `transaction_date`: `03/03/2026 02:28 PM`

---

### #17 DR2026/33063

**order_description (ERP shipping_details):**
```
خلاط هفار 8000 وات 2*1  *1
```

**Our backend keys (from _erp_row_to_order):**
```
  attempt_count: 0
  city: 'لا يوجد'
  cod_amount: 1950.0
  customer_name: 'نبيل هنداوي'
  customer_phone: '01116611198'
  delivery_address: 'لا يوجد'
  erp_order_id: 'DR2026/33063'
  governorate: 'لا يوجد'
  order_description: 'خلاط هفار 8000 وات 2*1  *1'
  service_type: 'sell'
  source: 'erp'
  status: 'new'
```

**All ERP keys in this row:**
- `DT_RowAttr`: `{'data-href': 'https://erp.hvarstore.com/sells/71232'}`
- `action`: `<div class="btn-group">
                                <button type="button" class="tw-dw-btn tw-dw...`
- `added_by`: `Mr Ahmed Elghazaly`
- `business_location`: `مخزن اون لاين`
- `commission_agent`: `لا يوجد`
- `commission_agent_name`: `  `
- `contact_id`: `51993`
- `contact_name`: `<a href="https://erp.hvarstore.com/contacts/51993">نبيل هنداوي</a>`
- `contact_name_text`: `نبيل هنداوي`
- `coupon_code`: null
- `final_total`: `<span class="final-total" data-orig-value="1950.0000">EGP 1,950.00</span>`
- `invoice_no`: `DR2026/33063`
- `is_direct_sale`: `0`
- `is_export`: `0`
- `marketing_source`: `-`
- `mobile`: `01116611198`
- `postpone_button`: `&lt;button type=&quot;button&quot; class=&quot;btn btn-info btn-xs postpone-draft&quot; data-href=&q...`
- `postponed_at`: null
- `postponed_days`: `0`
- `postponed_status`: null
- `postponed_to`: `-`
- `shipping_address`: `لا يوجد`
- `shipping_city`: `لا يوجد`
- `shipping_details`: `خلاط هفار 8000 وات 2*1  *1`
- `shipping_state`: `لا يوجد`
- `sub_status`: null
- `supplier_business_name`: null
- `total_items`: `1.00`
- `total_quantity`: `1.00`
- `transaction_date`: `03/03/2026 02:40 PM`

---

### #18 DR2026/33066

**order_description (ERP shipping_details):**
```
1 * كبه هفار 6.5 لتر 2000 وات 4 سرعات (5070+04)
```

**Our backend keys (from _erp_row_to_order):**
```
  attempt_count: 0
  city: 'دكرنس'
  cod_amount: 1850.0
  customer_name: 'علي رضا منصور'
  customer_phone: '01012743382'
  delivery_address: 'العنوان :  مركز دكرنس ديم الشلت دقهليه'
  erp_order_id: 'DR2026/33066'
  governorate: 'الدقهليه'
  order_description: '1 * كبه هفار 6.5 لتر 2000 وات 4 سرعات (5070+04)'
  service_type: 'sell'
  source: 'erp'
  status: 'new'
```

**All ERP keys in this row:**
- `DT_RowAttr`: `{'data-href': 'https://erp.hvarstore.com/sells/71244'}`
- `action`: `<div class="btn-group">
                                <button type="button" class="tw-dw-btn tw-dw...`
- `added_by`: ` حسين مصطفي`
- `business_location`: `مخزن اون لاين`
- `commission_agent`: `مايفن`
- `commission_agent_name`: ` مايفن `
- `contact_id`: `51996`
- `contact_name`: `<a href="https://erp.hvarstore.com/contacts/51996">علي رضا منصور</a>`
- `contact_name_text`: `علي رضا منصور`
- `coupon_code`: null
- `final_total`: `<span class="final-total" data-orig-value="1850.0000">EGP 1,850.00</span>`
- `invoice_no`: `DR2026/33066`
- `is_direct_sale`: `1`
- `is_export`: `0`
- `marketing_source`: `<i class="fab fa-facebook"></i> Facebook`
- `mobile`: `01012743382`
- `postpone_button`: `&lt;button type=&quot;button&quot; class=&quot;btn btn-info btn-xs postpone-draft&quot; data-href=&q...`
- `postponed_at`: `2026-03-04 12:21:24`
- `postponed_days`: `8`
- `postponed_status`: `postponed`
- `postponed_to`: `13/03/2026 12:00 AM`
- `shipping_address`: `العنوان :  مركز دكرنس ديم الشلت دقهليه`
- `shipping_city`: `دكرنس`
- `shipping_details`: `1 * كبه هفار 6.5 لتر 2000 وات 4 سرعات (5070+04)`
- `shipping_state`: `الدقهليه`
- `sub_status`: null
- `supplier_business_name`: null
- `total_items`: `1.00`
- `total_quantity`: `1.00`
- `transaction_date`: `04/03/2026 01:06 AM`

---

### #19 DR2026/33092

**order_description (ERP shipping_details):**
```
1 * كبه هفار 6.5 لتر 2000 وات 4 سرعات (5070+04)
```

**Our backend keys (from _erp_row_to_order):**
```
  attempt_count: 0
  city: 'محرم بك'
  cod_amount: 1750.0
  customer_name: 'محمد عبد الفتاح محمد'
  customer_phone: '01229591385'
  delivery_address: 'العنوان : محافظه الاسكندريه محرم بك \r\n11ش الخرطوم محرم بك امبروزو بجوار مكتبة ناجي \r\nمحافظة الإسكندرية'
  erp_order_id: 'DR2026/33092'
  governorate: 'الاسكندريه'
  order_description: '1 * كبه هفار 6.5 لتر 2000 وات 4 سرعات (5070+04)'
  service_type: 'sell'
  source: 'erp'
  status: 'new'
```

**All ERP keys in this row:**
- `DT_RowAttr`: `{'data-href': 'https://erp.hvarstore.com/sells/71270'}`
- `action`: `<div class="btn-group">
                                <button type="button" class="tw-dw-btn tw-dw...`
- `added_by`: ` حسين مصطفي`
- `business_location`: `مخزن اون لاين`
- `commission_agent`: `مني`
- `commission_agent_name`: ` مني `
- `contact_id`: `49565`
- `contact_name`: `<a href="https://erp.hvarstore.com/contacts/49565">محمد عبد الفتاح محمد</a>`
- `contact_name_text`: `محمد عبد الفتاح محمد`
- `coupon_code`: null
- `final_total`: `<span class="final-total" data-orig-value="1750.0000">EGP 1,750.00</span>`
- `invoice_no`: `DR2026/33092`
- `is_direct_sale`: `1`
- `is_export`: `0`
- `marketing_source`: `<i class="fab fa-facebook"></i> Facebook`
- `mobile`: `01229591385`
- `postpone_button`: `&lt;button type=&quot;button&quot; class=&quot;btn btn-info btn-xs postpone-draft&quot; data-href=&q...`
- `postponed_at`: null
- `postponed_days`: `0`
- `postponed_status`: null
- `postponed_to`: `-`
- `shipping_address`: `العنوان : محافظه الاسكندريه محرم بك 
11ش الخرطوم محرم بك امبروزو بجوار مكتبة ناجي 
محافظة الإسكندر...`
- `shipping_city`: `محرم بك`
- `shipping_details`: `1 * كبه هفار 6.5 لتر 2000 وات 4 سرعات (5070+04)`
- `shipping_state`: `الاسكندريه`
- `sub_status`: null
- `supplier_business_name`: null
- `total_items`: `1.00`
- `total_quantity`: `1.00`
- `transaction_date`: `04/03/2026 01:52 AM`

---

### #20 DR2026/33140

**order_description (ERP shipping_details):**
```
كبه هفار  6.5 لتر 2000 وات  اسود -نيو  *1
```

**Our backend keys (from _erp_row_to_order):**
```
  attempt_count: 0
  city: 'لا يوجد'
  cod_amount: 1850.0
  customer_name: 'احمد حمدى'
  customer_phone: '01553057703'
  delivery_address: 'لا يوجد'
  erp_order_id: 'DR2026/33140'
  governorate: 'لا يوجد'
  order_description: 'كبه هفار  6.5 لتر 2000 وات  اسود -نيو  *1'
  service_type: 'sell'
  source: 'erp'
  status: 'new'
```

**All ERP keys in this row:**
- `DT_RowAttr`: `{'data-href': 'https://erp.hvarstore.com/sells/71320'}`
- `action`: `<div class="btn-group">
                                <button type="button" class="tw-dw-btn tw-dw...`
- `added_by`: `Mr Ahmed Elghazaly`
- `business_location`: `مخزن اون لاين`
- `commission_agent`: `لا يوجد`
- `commission_agent_name`: `  `
- `contact_id`: `52051`
- `contact_name`: `<a href="https://erp.hvarstore.com/contacts/52051">احمد حمدى</a>`
- `contact_name_text`: `احمد حمدى`
- `coupon_code`: null
- `final_total`: `<span class="final-total" data-orig-value="1850.0000">EGP 1,850.00</span>`
- `invoice_no`: `DR2026/33140`
- `is_direct_sale`: `0`
- `is_export`: `0`
- `marketing_source`: `-`
- `mobile`: `01553057703`
- `postpone_button`: `&lt;button type=&quot;button&quot; class=&quot;btn btn-info btn-xs postpone-draft&quot; data-href=&q...`
- `postponed_at`: null
- `postponed_days`: `0`
- `postponed_status`: null
- `postponed_to`: `-`
- `shipping_address`: `لا يوجد`
- `shipping_city`: `لا يوجد`
- `shipping_details`: `كبه هفار  6.5 لتر 2000 وات  اسود -نيو  *1`
- `shipping_state`: `لا يوجد`
- `sub_status`: null
- `supplier_business_name`: null
- `total_items`: `1.00`
- `total_quantity`: `1.00`
- `transaction_date`: `04/03/2026 05:43 AM`

---

### #21 53879

**order_description (ERP shipping_details):**
```
2 * هاند بلندر هفار 1500 وات 4*1 (5057) 4 * مضرب بيض 500 وات (1101) 2 * مضرب بيض 500 وات بالحلة (1104) 3 * كاتيل بيركس هفار 2 لتر (10002) 2 * كبه هفار 1000 وات تربو أبيض (5027)
```

**Our backend keys (from _erp_row_to_order):**
```
  attempt_count: 0
  city: 'لا يوجد'
  cod_amount: 13320.0
  customer_name: 'احمد الحاوى'
  customer_phone: '01271988104'
  delivery_address: 'لا يوجد'
  erp_order_id: '53879'
  governorate: 'لا يوجد'
  order_description: '2 * هاند بلندر هفار 1500 وات 4*1 (5057) 4 * مضرب بيض 500 وات (1101) 2 * مضرب بيض 500 وات بالحلة (110'...
  service_type: 'sell'
  source: 'erp'
  status: 'new'
```

**All ERP keys in this row:**
- `DT_RowAttr`: `{'data-href': 'https://erp.hvarstore.com/sells/71396'}`
- `action`: `<div class="btn-group">
                                <button type="button" class="tw-dw-btn tw-dw...`
- `added_by`: ` حسين مصطفي`
- `business_location`: `HVAR Bulky`
- `commission_agent`: `دولت`
- `commission_agent_name`: ` دولت `
- `contact_id`: `46112`
- `contact_name`: `<a href="https://erp.hvarstore.com/contacts/46112">احمد الحاوى</a>`
- `contact_name_text`: `احمد الحاوى`
- `coupon_code`: null
- `final_total`: `<span class="final-total" data-orig-value="13320.0000">EGP 13,320.00</span>`
- `invoice_no`: `53879`
- `is_direct_sale`: `1`
- `is_export`: `0`
- `marketing_source`: `<i class="fab fa-whatsapp"></i> WhatsApp`
- `mobile`: `01271988104`
- `postpone_button`: `&lt;button type=&quot;button&quot; class=&quot;btn btn-info btn-xs postpone-draft&quot; data-href=&q...`
- `postponed_at`: null
- `postponed_days`: `0`
- `postponed_status`: null
- `postponed_to`: `-`
- `shipping_address`: `لا يوجد`
- `shipping_city`: `لا يوجد`
- `shipping_details`: `2 * هاند بلندر هفار 1500 وات 4*1 (5057) 4 * مضرب بيض 500 وات (1101) 2 * مضرب بيض 500 وات بالحلة (110...`
- `shipping_state`: `لا يوجد`
- `sub_status`: null
- `supplier_business_name`: null
- `total_items`: `5.00`
- `total_quantity`: `13.00`
- `transaction_date`: `04/03/2026 02:56 PM`

---

### #22 DR2026/33203

**order_description (ERP shipping_details):**
```
كبه هفار  6.5 لتر 2000 وات  اسود -نيو  *1
```

**Our backend keys (from _erp_row_to_order):**
```
  attempt_count: 0
  city: 'لا يوجد'
  cod_amount: 1850.0
  customer_name: 'شروق وجدي'
  customer_phone: '01273722376'
  delivery_address: 'لا يوجد'
  erp_order_id: 'DR2026/33203'
  governorate: 'لا يوجد'
  order_description: 'كبه هفار  6.5 لتر 2000 وات  اسود -نيو  *1'
  service_type: 'sell'
  source: 'erp'
  status: 'new'
```

**All ERP keys in this row:**
- `DT_RowAttr`: `{'data-href': 'https://erp.hvarstore.com/sells/71425'}`
- `action`: `<div class="btn-group">
                                <button type="button" class="tw-dw-btn tw-dw...`
- `added_by`: `Mr Ahmed Elghazaly`
- `business_location`: `مخزن اون لاين`
- `commission_agent`: `لا يوجد`
- `commission_agent_name`: `  `
- `contact_id`: `4190`
- `contact_name`: `<a href="https://erp.hvarstore.com/contacts/4190">شروق وجدي</a>`
- `contact_name_text`: `شروق وجدي`
- `coupon_code`: null
- `final_total`: `<span class="final-total" data-orig-value="1850.0000">EGP 1,850.00</span>`
- `invoice_no`: `DR2026/33203`
- `is_direct_sale`: `0`
- `is_export`: `0`
- `marketing_source`: `-`
- `mobile`: `01273722376`
- `postpone_button`: `&lt;button type=&quot;button&quot; class=&quot;btn btn-info btn-xs postpone-draft&quot; data-href=&q...`
- `postponed_at`: null
- `postponed_days`: `0`
- `postponed_status`: null
- `postponed_to`: `-`
- `shipping_address`: `لا يوجد`
- `shipping_city`: `لا يوجد`
- `shipping_details`: `كبه هفار  6.5 لتر 2000 وات  اسود -نيو  *1`
- `shipping_state`: `لا يوجد`
- `sub_status`: null
- `supplier_business_name`: null
- `total_items`: `1.00`
- `total_quantity`: `1.00`
- `transaction_date`: `04/03/2026 02:46 PM`

---

### #23 DR2026/33214

**order_description (ERP shipping_details):**
```
1 * هاند بلندر هفار 1500 وات 4*1 (5057)
```

**Our backend keys (from _erp_row_to_order):**
```
  attempt_count: 0
  city: 'شبرا الخيمه'
  cod_amount: 2250.0
  customer_name: 'مرقص جبره رزق الله'
  customer_phone: '01150889660'
  delivery_address: 'العنوان :محافظه القاهره \r\n٢شارع جمال الدين الافغاني أمام محطة مترو كليه الزراعه'
  erp_order_id: 'DR2026/33214'
  governorate: 'القليوبيه'
  order_description: '1 * هاند بلندر هفار 1500 وات 4*1 (5057)'
  service_type: 'sell'
  source: 'erp'
  status: 'new'
```

**All ERP keys in this row:**
- `DT_RowAttr`: `{'data-href': 'https://erp.hvarstore.com/sells/71438'}`
- `action`: `<div class="btn-group">
                                <button type="button" class="tw-dw-btn tw-dw...`
- `added_by`: ` حسين مصطفي`
- `business_location`: `مخزن اون لاين`
- `commission_agent`: `مني`
- `commission_agent_name`: ` مني `
- `contact_id`: `52120`
- `contact_name`: `<a href="https://erp.hvarstore.com/contacts/52120">مرقص جبره رزق الله</a>`
- `contact_name_text`: `مرقص جبره رزق الله`
- `coupon_code`: null
- `final_total`: `<span class="final-total" data-orig-value="2250.0000">EGP 2,250.00</span>`
- `invoice_no`: `DR2026/33214`
- `is_direct_sale`: `1`
- `is_export`: `0`
- `marketing_source`: `<i class="fab fa-facebook"></i> Facebook`
- `mobile`: `01150889660`
- `postpone_button`: `&lt;button type=&quot;button&quot; class=&quot;btn btn-info btn-xs postpone-draft&quot; data-href=&q...`
- `postponed_at`: null
- `postponed_days`: `0`
- `postponed_status`: null
- `postponed_to`: `-`
- `shipping_address`: `العنوان :محافظه القاهره 
٢شارع جمال الدين الافغاني أمام محطة مترو كليه الزراعه`
- `shipping_city`: `شبرا الخيمه`
- `shipping_details`: `1 * هاند بلندر هفار 1500 وات 4*1 (5057)`
- `shipping_state`: `القليوبيه`
- `sub_status`: null
- `supplier_business_name`: null
- `total_items`: `1.00`
- `total_quantity`: `1.00`
- `transaction_date`: `05/03/2026 01:35 AM`

---

### #24 DR2026/33376

**order_description (ERP shipping_details):**
```
1 * مكنسة هفار 2000 وات تربو (7720)
```

**Our backend keys (from _erp_row_to_order):**
```
  attempt_count: 0
  city: 'المرج - المرج الجديده'
  cod_amount: 2650.0
  customer_name: 'ساره خالد'
  customer_phone: '01098559980'
  delivery_address: 'العنوان :القاهره المرج الجديده شارع الصرف بجوار قهوه ام كلثوم وهايبر الشرق'
  erp_order_id: 'DR2026/33376'
  governorate: 'القاهره'
  order_description: '1 * مكنسة هفار 2000 وات تربو (7720)'
  service_type: 'sell'
  source: 'erp'
  status: 'new'
```

**All ERP keys in this row:**
- `DT_RowAttr`: `{'data-href': 'https://erp.hvarstore.com/sells/71668'}`
- `action`: `<div class="btn-group">
                                <button type="button" class="tw-dw-btn tw-dw...`
- `added_by`: ` حسين مصطفي`
- `business_location`: `مخزن اون لاين`
- `commission_agent`: `مني`
- `commission_agent_name`: ` مني `
- `contact_id`: `47509`
- `contact_name`: `<a href="https://erp.hvarstore.com/contacts/47509">ساره خالد</a>`
- `contact_name_text`: `ساره خالد`
- `coupon_code`: null
- `final_total`: `<span class="final-total" data-orig-value="2650.0000">EGP 2,650.00</span>`
- `invoice_no`: `DR2026/33376`
- `is_direct_sale`: `1`
- `is_export`: `0`
- `marketing_source`: `<i class="fab fa-facebook"></i> Facebook`
- `mobile`: `01098559980`
- `postpone_button`: `&lt;button type=&quot;button&quot; class=&quot;btn btn-info btn-xs postpone-draft&quot; data-href=&q...`
- `postponed_at`: null
- `postponed_days`: `0`
- `postponed_status`: null
- `postponed_to`: `-`
- `shipping_address`: `العنوان :القاهره المرج الجديده شارع الصرف بجوار قهوه ام كلثوم وهايبر الشرق`
- `shipping_city`: `المرج - المرج الجديده`
- `shipping_details`: `1 * مكنسة هفار 2000 وات تربو (7720)`
- `shipping_state`: `القاهره`
- `sub_status`: null
- `supplier_business_name`: null
- `total_items`: `1.00`
- `total_quantity`: `1.00`
- `transaction_date`: `06/03/2026 03:33 AM`

---

### #25 DR2026/33407

**order_description (ERP shipping_details):**
```
1 * مضرب بيض 500 وات بالحلة (1104)
```

**Our backend keys (from _erp_row_to_order):**
```
  attempt_count: 0
  city: 'قسم الرمل - جناكليس'
  cod_amount: 1600.0
  customer_name: 'دكتورة سوزان'
  customer_phone: '01223669152'
  delivery_address: 'اسكندريه ش عبدالمنعم الدليل نمره7 الدور 14 امام كنيسه جناكليس'
  erp_order_id: 'DR2026/33407'
  governorate: 'الاسكندريه'
  order_description: '1 * مضرب بيض 500 وات بالحلة (1104)'
  service_type: 'sell'
  source: 'erp'
  status: 'new'
```

**All ERP keys in this row:**
- `DT_RowAttr`: `{'data-href': 'https://erp.hvarstore.com/sells/71699'}`
- `action`: `<div class="btn-group">
                                <button type="button" class="tw-dw-btn tw-dw...`
- `added_by`: ` حسين مصطفي`
- `business_location`: `مخزن اون لاين`
- `commission_agent`: `احمد`
- `commission_agent_name`: ` احمد `
- `contact_id`: `50711`
- `contact_name`: `<a href="https://erp.hvarstore.com/contacts/50711">دكتورة سوزان</a>`
- `contact_name_text`: `دكتورة سوزان`
- `coupon_code`: null
- `final_total`: `<span class="final-total" data-orig-value="1600.0000">EGP 1,600.00</span>`
- `invoice_no`: `DR2026/33407`
- `is_direct_sale`: `1`
- `is_export`: `0`
- `marketing_source`: `<i class="fas fa-store"></i> Walk-in`
- `mobile`: `01223669152`
- `postpone_button`: `&lt;button type=&quot;button&quot; class=&quot;btn btn-info btn-xs postpone-draft&quot; data-href=&q...`
- `postponed_at`: null
- `postponed_days`: `0`
- `postponed_status`: null
- `postponed_to`: `-`
- `shipping_address`: `اسكندريه ش عبدالمنعم الدليل نمره7 الدور 14 امام كنيسه جناكليس`
- `shipping_city`: `قسم الرمل - جناكليس`
- `shipping_details`: `1 * مضرب بيض 500 وات بالحلة (1104)`
- `shipping_state`: `الاسكندريه`
- `sub_status`: null
- `supplier_business_name`: null
- `total_items`: `1.00`
- `total_quantity`: `1.00`
- `transaction_date`: `06/03/2026 03:59 AM`

---

### #26 DR2026/33421

**order_description (ERP shipping_details):**
```
1 * كبه هفار 6.5 لتر 2000 وات 4 سرعات (5070+04)
```

**Our backend keys (from _erp_row_to_order):**
```
  attempt_count: 0
  city: 'الفشن'
  cod_amount: 1850.0
  customer_name: 'ولاء محمد'
  customer_phone: '01124874053'
  delivery_address: 'العنوان: محافظة بني سويف مركز الفشن عزبة محمد محمود باشا صفط النور عند القهوة البحرية'
  erp_order_id: 'DR2026/33421'
  governorate: 'بني سويف'
  order_description: '1 * كبه هفار 6.5 لتر 2000 وات 4 سرعات (5070+04)'
  service_type: 'sell'
  source: 'erp'
  status: 'new'
```

**All ERP keys in this row:**
- `DT_RowAttr`: `{'data-href': 'https://erp.hvarstore.com/sells/71713'}`
- `action`: `<div class="btn-group">
                                <button type="button" class="tw-dw-btn tw-dw...`
- `added_by`: ` حسين مصطفي`
- `business_location`: `مخزن اون لاين`
- `commission_agent`: `سلوي ابراهيم`
- `commission_agent_name`: ` سلوي ابراهيم `
- `contact_id`: `52301`
- `contact_name`: `<a href="https://erp.hvarstore.com/contacts/52301">ولاء محمد</a>`
- `contact_name_text`: `ولاء محمد`
- `coupon_code`: null
- `final_total`: `<span class="final-total" data-orig-value="1850.0000">EGP 1,850.00</span>`
- `invoice_no`: `DR2026/33421`
- `is_direct_sale`: `1`
- `is_export`: `0`
- `marketing_source`: `<i class="fab fa-facebook"></i> Facebook`
- `mobile`: `01124874053`
- `postpone_button`: `&lt;button type=&quot;button&quot; class=&quot;btn btn-info btn-xs postpone-draft&quot; data-href=&q...`
- `postponed_at`: null
- `postponed_days`: `0`
- `postponed_status`: null
- `postponed_to`: `-`
- `shipping_address`: `العنوان: محافظة بني سويف مركز الفشن عزبة محمد محمود باشا صفط النور عند القهوة البحرية`
- `shipping_city`: `الفشن`
- `shipping_details`: `1 * كبه هفار 6.5 لتر 2000 وات 4 سرعات (5070+04)`
- `shipping_state`: `بني سويف`
- `sub_status`: null
- `supplier_business_name`: null
- `total_items`: `1.00`
- `total_quantity`: `1.00`
- `transaction_date`: `06/03/2026 04:10 AM`

---

### #27 DR2026/33451

**order_description (ERP shipping_details):**
```
خلاط هفار 8000 وات 2*1  *1
```

**Our backend keys (from _erp_row_to_order):**
```
  attempt_count: 0
  city: 'لا يوجد'
  cod_amount: 1950.0
  customer_name: 'سما سامح'
  customer_phone: '01107196954'
  delivery_address: 'لا يوجد'
  erp_order_id: 'DR2026/33451'
  governorate: 'لا يوجد'
  order_description: 'خلاط هفار 8000 وات 2*1  *1'
  service_type: 'sell'
  source: 'erp'
  status: 'new'
```

**All ERP keys in this row:**
- `DT_RowAttr`: `{'data-href': 'https://erp.hvarstore.com/sells/71744'}`
- `action`: `<div class="btn-group">
                                <button type="button" class="tw-dw-btn tw-dw...`
- `added_by`: `Mr Ahmed Elghazaly`
- `business_location`: `مخزن اون لاين`
- `commission_agent`: `لا يوجد`
- `commission_agent_name`: `  `
- `contact_id`: `52327`
- `contact_name`: `<a href="https://erp.hvarstore.com/contacts/52327">سما سامح</a>`
- `contact_name_text`: `سما سامح`
- `coupon_code`: null
- `final_total`: `<span class="final-total" data-orig-value="1950.0000">EGP 1,950.00</span>`
- `invoice_no`: `DR2026/33451`
- `is_direct_sale`: `0`
- `is_export`: `0`
- `marketing_source`: `-`
- `mobile`: `01107196954`
- `postpone_button`: `&lt;button type=&quot;button&quot; class=&quot;btn btn-info btn-xs postpone-draft&quot; data-href=&q...`
- `postponed_at`: null
- `postponed_days`: `0`
- `postponed_status`: null
- `postponed_to`: `-`
- `shipping_address`: `لا يوجد`
- `shipping_city`: `لا يوجد`
- `shipping_details`: `خلاط هفار 8000 وات 2*1  *1`
- `shipping_state`: `لا يوجد`
- `sub_status`: null
- `supplier_business_name`: null
- `total_items`: `1.00`
- `total_quantity`: `1.00`
- `transaction_date`: `06/03/2026 02:14 PM`

---

### #28 DR2026/33455

**order_description (ERP shipping_details):**
```
1 * مضرب بيض 500 وات بالحلة (1104)
```

**Our backend keys (from _erp_row_to_order):**
```
  attempt_count: 0
  city: 'شبراخيت'
  cod_amount: 1600.0
  customer_name: 'ام بدر'
  customer_phone: '01028122123'
  delivery_address: 'العنوان: البحيره محله فرنوي شبراخيت بجوار منشار عبد الباسط'
  erp_order_id: 'DR2026/33455'
  governorate: 'البحيره'
  order_description: '1 * مضرب بيض 500 وات بالحلة (1104)'
  service_type: 'sell'
  source: 'erp'
  status: 'new'
```

**All ERP keys in this row:**
- `DT_RowAttr`: `{'data-href': 'https://erp.hvarstore.com/sells/71748'}`
- `action`: `<div class="btn-group">
                                <button type="button" class="tw-dw-btn tw-dw...`
- `added_by`: ` حسين مصطفي`
- `business_location`: `مخزن اون لاين`
- `commission_agent`: `سارةناجي`
- `commission_agent_name`: ` سارة ناجي`
- `contact_id`: `52331`
- `contact_name`: `<a href="https://erp.hvarstore.com/contacts/52331">ام بدر</a>`
- `contact_name_text`: `ام بدر`
- `coupon_code`: null
- `final_total`: `<span class="final-total" data-orig-value="1600.0000">EGP 1,600.00</span>`
- `invoice_no`: `DR2026/33455`
- `is_direct_sale`: `1`
- `is_export`: `0`
- `marketing_source`: `<i class="fab fa-facebook"></i> Facebook`
- `mobile`: `01028122123`
- `postpone_button`: `&lt;button type=&quot;button&quot; class=&quot;btn btn-info btn-xs postpone-draft&quot; data-href=&q...`
- `postponed_at`: null
- `postponed_days`: `0`
- `postponed_status`: null
- `postponed_to`: `-`
- `shipping_address`: `العنوان: البحيره محله فرنوي شبراخيت بجوار منشار عبد الباسط`
- `shipping_city`: `شبراخيت`
- `shipping_details`: `1 * مضرب بيض 500 وات بالحلة (1104)`
- `shipping_state`: `البحيره`
- `sub_status`: null
- `supplier_business_name`: null
- `total_items`: `1.00`
- `total_quantity`: `1.00`
- `transaction_date`: `06/03/2026 04:30 PM`

---

### #29 DR2026/33476

**order_description (ERP shipping_details):**
```
1 * مضرب بيض 500 وات (1101)
```

**Our backend keys (from _erp_row_to_order):**
```
  attempt_count: 0
  city: 'فاقوس'
  cod_amount: 825.0
  customer_name: 'محمود ناصر حسن'
  customer_phone: '01021464136'
  delivery_address: 'العنوان :محافظه الشرقيه مركز فاقوس الخطاره الصغري امام صيدليه بدران'
  erp_order_id: 'DR2026/33476'
  governorate: 'الشرقيه'
  order_description: '1 * مضرب بيض 500 وات (1101)'
  service_type: 'sell'
  source: 'erp'
  status: 'new'
```

**All ERP keys in this row:**
- `DT_RowAttr`: `{'data-href': 'https://erp.hvarstore.com/sells/71769'}`
- `action`: `<div class="btn-group">
                                <button type="button" class="tw-dw-btn tw-dw...`
- `added_by`: ` حسين مصطفي`
- `business_location`: `مخزن اون لاين`
- `commission_agent`: `غاده`
- `commission_agent_name`: ` غاده `
- `contact_id`: `52350`
- `contact_name`: `<a href="https://erp.hvarstore.com/contacts/52350">محمود ناصر حسن</a>`
- `contact_name_text`: `محمود ناصر حسن`
- `coupon_code`: null
- `final_total`: `<span class="final-total" data-orig-value="825.0000">EGP 825.00</span>`
- `invoice_no`: `DR2026/33476`
- `is_direct_sale`: `1`
- `is_export`: `0`
- `marketing_source`: `<i class="fab fa-facebook"></i> Facebook`
- `mobile`: `01021464136`
- `postpone_button`: `&lt;button type=&quot;button&quot; class=&quot;btn btn-info btn-xs postpone-draft&quot; data-href=&q...`
- `postponed_at`: null
- `postponed_days`: `0`
- `postponed_status`: null
- `postponed_to`: `-`
- `shipping_address`: `العنوان :محافظه الشرقيه مركز فاقوس الخطاره الصغري امام صيدليه بدران`
- `shipping_city`: `فاقوس`
- `shipping_details`: `1 * مضرب بيض 500 وات (1101)`
- `shipping_state`: `الشرقيه`
- `sub_status`: null
- `supplier_business_name`: null
- `total_items`: `1.00`
- `total_quantity`: `1.00`
- `transaction_date`: `06/03/2026 04:48 PM`

---

### #30 DR2026/33483

**order_description (ERP shipping_details):**
```
1 * كبه هفار 6.5 لتر 2000 وات 4 سرعات (5070+04)
```

**Our backend keys (from _erp_row_to_order):**
```
  attempt_count: 0
  city: 'المنتزه - السيوف قبلي'
  cod_amount: 1850.0
  customer_name: 'كريم احمد محمد'
  customer_phone: '01221719714'
  delivery_address: 'العنوان : اسكندريه السىيوف شماعه شارع نور الاسلام منزل رقم ٣٩بجوارمسجدالعلم والايمان'
  erp_order_id: 'DR2026/33483'
  governorate: 'الاسكندريه'
  order_description: '1 * كبه هفار 6.5 لتر 2000 وات 4 سرعات (5070+04)'
  service_type: 'sell'
  source: 'erp'
  status: 'new'
```

**All ERP keys in this row:**
- `DT_RowAttr`: `{'data-href': 'https://erp.hvarstore.com/sells/71776'}`
- `action`: `<div class="btn-group">
                                <button type="button" class="tw-dw-btn tw-dw...`
- `added_by`: ` حسين مصطفي`
- `business_location`: `مخزن اون لاين`
- `commission_agent`: `غاده`
- `commission_agent_name`: ` غاده `
- `contact_id`: `52357`
- `contact_name`: `<a href="https://erp.hvarstore.com/contacts/52357">كريم احمد محمد</a>`
- `contact_name_text`: `كريم احمد محمد`
- `coupon_code`: null
- `final_total`: `<span class="final-total" data-orig-value="1850.0000">EGP 1,850.00</span>`
- `invoice_no`: `DR2026/33483`
- `is_direct_sale`: `1`
- `is_export`: `0`
- `marketing_source`: `<i class="fab fa-facebook"></i> Facebook`
- `mobile`: `01221719714`
- `postpone_button`: `&lt;button type=&quot;button&quot; class=&quot;btn btn-info btn-xs postpone-draft&quot; data-href=&q...`
- `postponed_at`: null
- `postponed_days`: `0`
- `postponed_status`: null
- `postponed_to`: `-`
- `shipping_address`: `العنوان : اسكندريه السىيوف شماعه شارع نور الاسلام منزل رقم ٣٩بجوارمسجدالعلم والايمان`
- `shipping_city`: `المنتزه - السيوف قبلي`
- `shipping_details`: `1 * كبه هفار 6.5 لتر 2000 وات 4 سرعات (5070+04)`
- `shipping_state`: `الاسكندريه`
- `sub_status`: null
- `supplier_business_name`: null
- `total_items`: `1.00`
- `total_quantity`: `1.00`
- `transaction_date`: `06/03/2026 04:52 PM`

---

### #31 DR2026/33491

**order_description (ERP shipping_details):**
```
1 * عجان هفار 11 لتر (10011)
```

**Our backend keys (from _erp_row_to_order):**
```
  attempt_count: 0
  city: 'فاقوس'
  cod_amount: 7300.0
  customer_name: 'رانيا عبدالمنعم'
  customer_phone: '01023136012'
  delivery_address: 'العنوان :   محافظه الشرقيه مركز فاقوس اكياد القبليه شارع المحطه بجوار صيدلية التوحيد'
  erp_order_id: 'DR2026/33491'
  governorate: 'الشرقيه'
  order_description: '1 * عجان هفار 11 لتر (10011)'
  service_type: 'sell'
  source: 'erp'
  status: 'new'
```

**All ERP keys in this row:**
- `DT_RowAttr`: `{'data-href': 'https://erp.hvarstore.com/sells/71784'}`
- `action`: `<div class="btn-group">
                                <button type="button" class="tw-dw-btn tw-dw...`
- `added_by`: ` حسين مصطفي`
- `business_location`: `مخزن اون لاين`
- `commission_agent`: `مايفن`
- `commission_agent_name`: ` مايفن `
- `contact_id`: `52365`
- `contact_name`: `<a href="https://erp.hvarstore.com/contacts/52365">رانيا عبدالمنعم</a>`
- `contact_name_text`: `رانيا عبدالمنعم`
- `coupon_code`: null
- `final_total`: `<span class="final-total" data-orig-value="7300.0000">EGP 7,300.00</span>`
- `invoice_no`: `DR2026/33491`
- `is_direct_sale`: `1`
- `is_export`: `0`
- `marketing_source`: `<i class="fab fa-facebook"></i> Facebook`
- `mobile`: `01023136012`
- `postpone_button`: `&lt;button type=&quot;button&quot; class=&quot;btn btn-info btn-xs postpone-draft&quot; data-href=&q...`
- `postponed_at`: null
- `postponed_days`: `0`
- `postponed_status`: null
- `postponed_to`: `-`
- `shipping_address`: `العنوان :   محافظه الشرقيه مركز فاقوس اكياد القبليه شارع المحطه بجوار صيدلية التوحيد`
- `shipping_city`: `فاقوس`
- `shipping_details`: `1 * عجان هفار 11 لتر (10011)`
- `shipping_state`: `الشرقيه`
- `sub_status`: null
- `supplier_business_name`: null
- `total_items`: `1.00`
- `total_quantity`: `1.00`
- `transaction_date`: `06/03/2026 04:59 PM`

---

### #32 DR2026/33498

**order_description (ERP shipping_details):**
```
1 * كبه هفار 6.5 لتر 2000 وات 4 سرعات (5070+04)
```

**Our backend keys (from _erp_row_to_order):**
```
  attempt_count: 0
  city: 'المنصوره'
  cod_amount: 1850.0
  customer_name: 'مدام شيماء محمد احمد'
  customer_phone: '01066284402'
  delivery_address: 'العنوان :المنصوره اول مدينه مبارك عند مقله الاستاد'
  erp_order_id: 'DR2026/33498'
  governorate: 'الدقهليه'
  order_description: '1 * كبه هفار 6.5 لتر 2000 وات 4 سرعات (5070+04)'
  service_type: 'sell'
  source: 'erp'
  status: 'new'
```

**All ERP keys in this row:**
- `DT_RowAttr`: `{'data-href': 'https://erp.hvarstore.com/sells/71791'}`
- `action`: `<div class="btn-group">
                                <button type="button" class="tw-dw-btn tw-dw...`
- `added_by`: ` حسين مصطفي`
- `business_location`: `مخزن اون لاين`
- `commission_agent`: `غاده`
- `commission_agent_name`: ` غاده `
- `contact_id`: `52372`
- `contact_name`: `<a href="https://erp.hvarstore.com/contacts/52372">مدام شيماء محمد احمد</a>`
- `contact_name_text`: `مدام شيماء محمد احمد`
- `coupon_code`: null
- `final_total`: `<span class="final-total" data-orig-value="1850.0000">EGP 1,850.00</span>`
- `invoice_no`: `DR2026/33498`
- `is_direct_sale`: `1`
- `is_export`: `0`
- `marketing_source`: `<i class="fab fa-facebook"></i> Facebook`
- `mobile`: `01066284402`
- `postpone_button`: `&lt;button type=&quot;button&quot; class=&quot;btn btn-info btn-xs postpone-draft&quot; data-href=&q...`
- `postponed_at`: null
- `postponed_days`: `0`
- `postponed_status`: null
- `postponed_to`: `-`
- `shipping_address`: `العنوان :المنصوره اول مدينه مبارك عند مقله الاستاد`
- `shipping_city`: `المنصوره`
- `shipping_details`: `1 * كبه هفار 6.5 لتر 2000 وات 4 سرعات (5070+04)`
- `shipping_state`: `الدقهليه`
- `sub_status`: null
- `supplier_business_name`: null
- `total_items`: `1.00`
- `total_quantity`: `1.00`
- `transaction_date`: `06/03/2026 05:04 PM`

---

### #33 DR2026/33514

**order_description (ERP shipping_details):**
```
1 * كبه هفار 6.5 لتر 2000 وات 4 سرعات (5070+04)
```

**Our backend keys (from _erp_row_to_order):**
```
  attempt_count: 0
  city: 'بني سويف'
  cod_amount: 1850.0
  customer_name: 'مروه هيكل محمود'
  customer_phone: '01002928028'
  delivery_address: 'العنوان : بني سويف كورنيش النيل    العماره الزرقاء بجانب كافيه بريك أوت'
  erp_order_id: 'DR2026/33514'
  governorate: 'بني سويف'
  order_description: '1 * كبه هفار 6.5 لتر 2000 وات 4 سرعات (5070+04)'
  service_type: 'sell'
  source: 'erp'
  status: 'new'
```

**All ERP keys in this row:**
- `DT_RowAttr`: `{'data-href': 'https://erp.hvarstore.com/sells/71807'}`
- `action`: `<div class="btn-group">
                                <button type="button" class="tw-dw-btn tw-dw...`
- `added_by`: ` حسين مصطفي`
- `business_location`: `مخزن اون لاين`
- `commission_agent`: `غاده`
- `commission_agent_name`: ` غاده `
- `contact_id`: `52386`
- `contact_name`: `<a href="https://erp.hvarstore.com/contacts/52386">مروه هيكل محمود</a>`
- `contact_name_text`: `مروه هيكل محمود`
- `coupon_code`: null
- `final_total`: `<span class="final-total" data-orig-value="1850.0000">EGP 1,850.00</span>`
- `invoice_no`: `DR2026/33514`
- `is_direct_sale`: `1`
- `is_export`: `0`
- `marketing_source`: `<i class="fab fa-facebook"></i> Facebook`
- `mobile`: `01002928028`
- `postpone_button`: `&lt;button type=&quot;button&quot; class=&quot;btn btn-info btn-xs postpone-draft&quot; data-href=&q...`
- `postponed_at`: null
- `postponed_days`: `0`
- `postponed_status`: null
- `postponed_to`: `-`
- `shipping_address`: `العنوان : بني سويف كورنيش النيل    العماره الزرقاء بجانب كافيه بريك أوت`
- `shipping_city`: `بني سويف`
- `shipping_details`: `1 * كبه هفار 6.5 لتر 2000 وات 4 سرعات (5070+04)`
- `shipping_state`: `بني سويف`
- `sub_status`: null
- `supplier_business_name`: null
- `total_items`: `1.00`
- `total_quantity`: `1.00`
- `transaction_date`: `06/03/2026 05:17 PM`

---

### #34 DR2026/33540

**order_description (ERP shipping_details):**
```
1 * هاند بلندر هفار 1500 وات 4*1 (5057)
```

**Our backend keys (from _erp_row_to_order):**
```
  attempt_count: 0
  city: 'الشهداء'
  cod_amount: 2250.0
  customer_name: 'الاء فتحى معوض'
  customer_phone: '01028232090'
  delivery_address: 'العنوان : محافظه المنوفيه مركز الشهداء كفر الجلابطه عند المسجد القبلى'
  erp_order_id: 'DR2026/33540'
  governorate: 'المنوفيه'
  order_description: '1 * هاند بلندر هفار 1500 وات 4*1 (5057)'
  service_type: 'sell'
  source: 'erp'
  status: 'new'
```

**All ERP keys in this row:**
- `DT_RowAttr`: `{'data-href': 'https://erp.hvarstore.com/sells/71833'}`
- `action`: `<div class="btn-group">
                                <button type="button" class="tw-dw-btn tw-dw...`
- `added_by`: ` حسين مصطفي`
- `business_location`: `مخزن اون لاين`
- `commission_agent`: `اسماء مختار`
- `commission_agent_name`: ` اسماء مختار `
- `contact_id`: `52409`
- `contact_name`: `<a href="https://erp.hvarstore.com/contacts/52409">الاء فتحى معوض</a>`
- `contact_name_text`: `الاء فتحى معوض`
- `coupon_code`: null
- `final_total`: `<span class="final-total" data-orig-value="2250.0000">EGP 2,250.00</span>`
- `invoice_no`: `DR2026/33540`
- `is_direct_sale`: `1`
- `is_export`: `0`
- `marketing_source`: `<i class="fab fa-facebook"></i> Facebook`
- `mobile`: `01028232090`
- `postpone_button`: `&lt;button type=&quot;button&quot; class=&quot;btn btn-info btn-xs postpone-draft&quot; data-href=&q...`
- `postponed_at`: null
- `postponed_days`: `0`
- `postponed_status`: null
- `postponed_to`: `-`
- `shipping_address`: `العنوان : محافظه المنوفيه مركز الشهداء كفر الجلابطه عند المسجد القبلى`
- `shipping_city`: `الشهداء`
- `shipping_details`: `1 * هاند بلندر هفار 1500 وات 4*1 (5057)`
- `shipping_state`: `المنوفيه`
- `sub_status`: null
- `supplier_business_name`: null
- `total_items`: `1.00`
- `total_quantity`: `1.00`
- `transaction_date`: `06/03/2026 05:38 PM`

---

### #35 DR2026/33557

**order_description (ERP shipping_details):**
```
1 * كبه هفار 6.5 لتر 2000 وات 4 سرعات (5070+04)
```

**Our backend keys (from _erp_row_to_order):**
```
  attempt_count: 0
  city: 'سملوط'
  cod_amount: 1850.0
  customer_name: 'مدام سماح ظريف'
  customer_phone: '01212685188'
  delivery_address: 'العنوان :  محافظة المنيا مركز سمالوط شرق بحري الكبري الجديد على ناصية الشارع الواسع'
  erp_order_id: 'DR2026/33557'
  governorate: 'المنيا'
  order_description: '1 * كبه هفار 6.5 لتر 2000 وات 4 سرعات (5070+04)'
  service_type: 'sell'
  source: 'erp'
  status: 'new'
```

**All ERP keys in this row:**
- `DT_RowAttr`: `{'data-href': 'https://erp.hvarstore.com/sells/71850'}`
- `action`: `<div class="btn-group">
                                <button type="button" class="tw-dw-btn tw-dw...`
- `added_by`: ` حسين مصطفي`
- `business_location`: `مخزن اون لاين`
- `commission_agent`: `ميري كمال`
- `commission_agent_name`: ` ميري كمال `
- `contact_id`: `52422`
- `contact_name`: `<a href="https://erp.hvarstore.com/contacts/52422">مدام سماح ظريف</a>`
- `contact_name_text`: `مدام سماح ظريف`
- `coupon_code`: null
- `final_total`: `<span class="final-total" data-orig-value="1850.0000">EGP 1,850.00</span>`
- `invoice_no`: `DR2026/33557`
- `is_direct_sale`: `1`
- `is_export`: `0`
- `marketing_source`: `<i class="fab fa-facebook"></i> Facebook`
- `mobile`: `01212685188`
- `postpone_button`: `&lt;button type=&quot;button&quot; class=&quot;btn btn-info btn-xs postpone-draft&quot; data-href=&q...`
- `postponed_at`: null
- `postponed_days`: `0`
- `postponed_status`: null
- `postponed_to`: `-`
- `shipping_address`: `العنوان :  محافظة المنيا مركز سمالوط شرق بحري الكبري الجديد على ناصية الشارع الواسع`
- `shipping_city`: `سملوط`
- `shipping_details`: `1 * كبه هفار 6.5 لتر 2000 وات 4 سرعات (5070+04)`
- `shipping_state`: `المنيا`
- `sub_status`: null
- `supplier_business_name`: null
- `total_items`: `1.00`
- `total_quantity`: `1.00`
- `transaction_date`: `07/03/2026 02:55 AM`

---

### #36 DR2026/33570

**order_description (ERP shipping_details):**
```
1 * كبه هفار 6.5 لتر 2000 وات 4 سرعات (5070+04)
```

**Our backend keys (from _erp_row_to_order):**
```
  attempt_count: 0
  city: 'الوراق - جزيره محمد'
  cod_amount: 1850.0
  customer_name: 'مروان وليد محرم فؤاد'
  customer_phone: '01066215581'
  delivery_address: 'العنوان : الجيزه الوراق جزيره محمد شارع عبد الحليم السيسي امام مدرسه جزيره محمد الجديده علي طريق طناش'
  erp_order_id: 'DR2026/33570'
  governorate: 'الجيزه'
  order_description: '1 * كبه هفار 6.5 لتر 2000 وات 4 سرعات (5070+04)'
  service_type: 'sell'
  source: 'erp'
  status: 'new'
```

**All ERP keys in this row:**
- `DT_RowAttr`: `{'data-href': 'https://erp.hvarstore.com/sells/71863'}`
- `action`: `<div class="btn-group">
                                <button type="button" class="tw-dw-btn tw-dw...`
- `added_by`: ` حسين مصطفي`
- `business_location`: `مخزن اون لاين`
- `commission_agent`: `اسماء مختار`
- `commission_agent_name`: ` اسماء مختار `
- `contact_id`: `52433`
- `contact_name`: `<a href="https://erp.hvarstore.com/contacts/52433">مروان وليد محرم فؤاد</a>`
- `contact_name_text`: `مروان وليد محرم فؤاد`
- `coupon_code`: null
- `final_total`: `<span class="final-total" data-orig-value="1850.0000">EGP 1,850.00</span>`
- `invoice_no`: `DR2026/33570`
- `is_direct_sale`: `1`
- `is_export`: `0`
- `marketing_source`: `<i class="fab fa-facebook"></i> Facebook`
- `mobile`: `01066215581`
- `postpone_button`: `&lt;button type=&quot;button&quot; class=&quot;btn btn-info btn-xs postpone-draft&quot; data-href=&q...`
- `postponed_at`: `2026-03-07 13:24:13`
- `postponed_days`: `17`
- `postponed_status`: `postponed`
- `postponed_to`: `25/03/2026 12:00 AM`
- `shipping_address`: `العنوان : الجيزه الوراق جزيره محمد شارع عبد الحليم السيسي امام مدرسه جزيره محمد الجديده علي طريق طنا...`
- `shipping_city`: `الوراق - جزيره محمد`
- `shipping_details`: `1 * كبه هفار 6.5 لتر 2000 وات 4 سرعات (5070+04)`
- `shipping_state`: `الجيزه`
- `sub_status`: null
- `supplier_business_name`: null
- `total_items`: `1.00`
- `total_quantity`: `1.00`
- `transaction_date`: `07/03/2026 03:06 AM`

---

### #37 DR2026/33581

**order_description (ERP shipping_details):**
```
1 * كبه هفار 6.5 لتر 2000 وات 4 سرعات (5070+04)
```

**Our backend keys (from _erp_row_to_order):**
```
  attempt_count: 0
  city: 'المحله الكبري'
  cod_amount: 1850.0
  customer_name: 'هانم زكي'
  customer_phone: '01032945513'
  delivery_address: 'العنوان: الغربيه قريه نمره البصل مركز المحله الكبرى أمام المدرسه الثانوي مشتركه'
  erp_order_id: 'DR2026/33581'
  governorate: 'الغربيه'
  order_description: '1 * كبه هفار 6.5 لتر 2000 وات 4 سرعات (5070+04)'
  service_type: 'sell'
  source: 'erp'
  status: 'new'
```

**All ERP keys in this row:**
- `DT_RowAttr`: `{'data-href': 'https://erp.hvarstore.com/sells/71874'}`
- `action`: `<div class="btn-group">
                                <button type="button" class="tw-dw-btn tw-dw...`
- `added_by`: ` حسين مصطفي`
- `business_location`: `مخزن اون لاين`
- `commission_agent`: `رحمه`
- `commission_agent_name`: ` رحمه `
- `contact_id`: `52442`
- `contact_name`: `<a href="https://erp.hvarstore.com/contacts/52442">هانم زكي</a>`
- `contact_name_text`: `هانم زكي`
- `coupon_code`: null
- `final_total`: `<span class="final-total" data-orig-value="1850.0000">EGP 1,850.00</span>`
- `invoice_no`: `DR2026/33581`
- `is_direct_sale`: `1`
- `is_export`: `0`
- `marketing_source`: `<i class="fab fa-facebook"></i> Facebook`
- `mobile`: `01032945513`
- `postpone_button`: `&lt;button type=&quot;button&quot; class=&quot;btn btn-info btn-xs postpone-draft&quot; data-href=&q...`
- `postponed_at`: null
- `postponed_days`: `0`
- `postponed_status`: null
- `postponed_to`: `-`
- `shipping_address`: `العنوان: الغربيه قريه نمره البصل مركز المحله الكبرى أمام المدرسه الثانوي مشتركه`
- `shipping_city`: `المحله الكبري`
- `shipping_details`: `1 * كبه هفار 6.5 لتر 2000 وات 4 سرعات (5070+04)`
- `shipping_state`: `الغربيه`
- `sub_status`: null
- `supplier_business_name`: null
- `total_items`: `1.00`
- `total_quantity`: `1.00`
- `transaction_date`: `07/03/2026 03:16 AM`

---

### #38 DR2026/33589

**order_description (ERP shipping_details):**
```
1 * كبه هفار 6.5 لتر 2000 وات 4 سرعات (5070+04)
```

**Our backend keys (from _erp_row_to_order):**
```
  attempt_count: 0
  city: 'سمسطا'
  cod_amount: 1850.0
  customer_name: 'حليمه معوض'
  customer_phone: '01016128574'
  delivery_address: 'العنوان :  بني سويف مركز سمسط قريه دشطوط'
  erp_order_id: 'DR2026/33589'
  governorate: 'بني سويف'
  order_description: '1 * كبه هفار 6.5 لتر 2000 وات 4 سرعات (5070+04)'
  service_type: 'sell'
  source: 'erp'
  status: 'new'
```

**All ERP keys in this row:**
- `DT_RowAttr`: `{'data-href': 'https://erp.hvarstore.com/sells/71882'}`
- `action`: `<div class="btn-group">
                                <button type="button" class="tw-dw-btn tw-dw...`
- `added_by`: ` حسين مصطفي`
- `business_location`: `مخزن اون لاين`
- `commission_agent`: `ميري كمال`
- `commission_agent_name`: ` ميري كمال `
- `contact_id`: `52448`
- `contact_name`: `<a href="https://erp.hvarstore.com/contacts/52448">حليمه معوض</a>`
- `contact_name_text`: `حليمه معوض`
- `coupon_code`: null
- `final_total`: `<span class="final-total" data-orig-value="1850.0000">EGP 1,850.00</span>`
- `invoice_no`: `DR2026/33589`
- `is_direct_sale`: `1`
- `is_export`: `0`
- `marketing_source`: `<i class="fab fa-facebook"></i> Facebook`
- `mobile`: `01016128574`
- `postpone_button`: `&lt;button type=&quot;button&quot; class=&quot;btn btn-info btn-xs postpone-draft&quot; data-href=&q...`
- `postponed_at`: null
- `postponed_days`: `0`
- `postponed_status`: null
- `postponed_to`: `-`
- `shipping_address`: `العنوان :  بني سويف مركز سمسط قريه دشطوط`
- `shipping_city`: `سمسطا`
- `shipping_details`: `1 * كبه هفار 6.5 لتر 2000 وات 4 سرعات (5070+04)`
- `shipping_state`: `بني سويف`
- `sub_status`: null
- `supplier_business_name`: null
- `total_items`: `1.00`
- `total_quantity`: `1.00`
- `transaction_date`: `07/03/2026 03:31 AM`

---

### #39 DR2026/33601

**order_description (ERP shipping_details):**
```
1 * مكنسة هفار 2000 وات تربو (7720)
```

**Our backend keys (from _erp_row_to_order):**
```
  attempt_count: 0
  city: 'بلقاس'
  cod_amount: 2650.0
  customer_name: 'ريم ابوالمعاطي يونس'
  customer_phone: '01055361913'
  delivery_address: 'العنوان: محافظه الدقهليه مركز بلقاس هجرس شارع مسجد الرحمن'
  erp_order_id: 'DR2026/33601'
  governorate: 'الدقهليه'
  order_description: '1 * مكنسة هفار 2000 وات تربو (7720)'
  service_type: 'sell'
  source: 'erp'
  status: 'new'
```

**All ERP keys in this row:**
- `DT_RowAttr`: `{'data-href': 'https://erp.hvarstore.com/sells/71894'}`
- `action`: `<div class="btn-group">
                                <button type="button" class="tw-dw-btn tw-dw...`
- `added_by`: ` حسين مصطفي`
- `business_location`: `مخزن اون لاين`
- `commission_agent`: `رحمه`
- `commission_agent_name`: ` رحمه `
- `contact_id`: `52455`
- `contact_name`: `<a href="https://erp.hvarstore.com/contacts/52455">ريم ابوالمعاطي يونس</a>`
- `contact_name_text`: `ريم ابوالمعاطي يونس`
- `coupon_code`: null
- `final_total`: `<span class="final-total" data-orig-value="2650.0000">EGP 2,650.00</span>`
- `invoice_no`: `DR2026/33601`
- `is_direct_sale`: `1`
- `is_export`: `0`
- `marketing_source`: `<i class="fab fa-facebook"></i> Facebook`
- `mobile`: `01055361913`
- `postpone_button`: `&lt;button type=&quot;button&quot; class=&quot;btn btn-info btn-xs postpone-draft&quot; data-href=&q...`
- `postponed_at`: null
- `postponed_days`: `0`
- `postponed_status`: null
- `postponed_to`: `-`
- `shipping_address`: `العنوان: محافظه الدقهليه مركز بلقاس هجرس شارع مسجد الرحمن`
- `shipping_city`: `بلقاس`
- `shipping_details`: `1 * مكنسة هفار 2000 وات تربو (7720)`
- `shipping_state`: `الدقهليه`
- `sub_status`: null
- `supplier_business_name`: null
- `total_items`: `1.00`
- `total_quantity`: `1.00`
- `transaction_date`: `07/03/2026 03:47 AM`

---

### #40 DR2026/33611

**order_description (ERP shipping_details):**
```
200 * كبه هفار 6.5 لتر 2000 وات 4 سرعات (5070+04) 100 * خلاط هفار 8000 وات 2*1 (5062)
```

**Our backend keys (from _erp_row_to_order):**
```
  attempt_count: 0
  city: 'لا يوجد'
  cod_amount: 442960.0
  customer_name: 'محمد عماد'
  customer_phone: '01067967094'
  delivery_address: 'العنوان: القليوبية شبرا الخيمةسنتر العالمي للاجهزه المنزليهطريق بيجام بعد نادي بيجام امام فرع اورنج والراعي الصالح'
  erp_order_id: 'DR2026/33611'
  governorate: 'لا يوجد'
  order_description: '200 * كبه هفار 6.5 لتر 2000 وات 4 سرعات (5070+04) 100 * خلاط هفار 8000 وات 2*1 (5062)'
  service_type: 'sell'
  source: 'erp'
  status: 'new'
```

**All ERP keys in this row:**
- `DT_RowAttr`: `{'data-href': 'https://erp.hvarstore.com/sells/71908'}`
- `action`: `<div class="btn-group">
                                <button type="button" class="tw-dw-btn tw-dw...`
- `added_by`: ` حسين مصطفي`
- `business_location`: `HVAR Bulky`
- `commission_agent`: `دولت`
- `commission_agent_name`: ` دولت `
- `contact_id`: `9503`
- `contact_name`: `<a href="https://erp.hvarstore.com/contacts/9503">محمد عماد</a>`
- `contact_name_text`: `محمد عماد`
- `coupon_code`: null
- `final_total`: `<span class="final-total" data-orig-value="442960.0000">EGP 442,960.00</span>`
- `invoice_no`: `DR2026/33611`
- `is_direct_sale`: `1`
- `is_export`: `0`
- `marketing_source`: `<i class="fab fa-whatsapp"></i> WhatsApp`
- `mobile`: `01067967094`
- `postpone_button`: `&lt;button type=&quot;button&quot; class=&quot;btn btn-info btn-xs postpone-draft&quot; data-href=&q...`
- `postponed_at`: null
- `postponed_days`: `0`
- `postponed_status`: null
- `postponed_to`: `-`
- `shipping_address`: `العنوان: القليوبية شبرا الخيمةسنتر العالمي للاجهزه المنزليهطريق بيجام بعد نادي بيجام امام فرع اورنج ...`
- `shipping_city`: `لا يوجد`
- `shipping_details`: `200 * كبه هفار 6.5 لتر 2000 وات 4 سرعات (5070+04) 100 * خلاط هفار 8000 وات 2*1 (5062)`
- `shipping_state`: `لا يوجد`
- `sub_status`: null
- `supplier_business_name`: null
- `total_items`: `2.00`
- `total_quantity`: `300.00`
- `transaction_date`: `07/03/2026 11:54 AM`

---

### #41 DR2026/33612

**order_description (ERP shipping_details):**
```
12 * خلاط هفار 8000 وات 2*1 (5062)
```

**Our backend keys (from _erp_row_to_order):**
```
  attempt_count: 0
  city: 'لا يوجد'
  cod_amount: 18720.0
  customer_name: 'حسين مصطفى كامل ( فن بيوت )'
  customer_phone: '01111137735'
  delivery_address: 'لا يوجد'
  erp_order_id: 'DR2026/33612'
  governorate: 'لا يوجد'
  order_description: '12 * خلاط هفار 8000 وات 2*1 (5062)'
  service_type: 'sell'
  source: 'erp'
  status: 'new'
```

**All ERP keys in this row:**
- `DT_RowAttr`: `{'data-href': 'https://erp.hvarstore.com/sells/71912'}`
- `action`: `<div class="btn-group">
                                <button type="button" class="tw-dw-btn tw-dw...`
- `added_by`: ` حسين مصطفي`
- `business_location`: `HVAR Bulky`
- `commission_agent`: `دولت`
- `commission_agent_name`: ` دولت `
- `contact_id`: `51332`
- `contact_name`: `<a href="https://erp.hvarstore.com/contacts/51332">حسين مصطفى كامل ( فن بيوت )</a>`
- `contact_name_text`: `حسين مصطفى كامل ( فن بيوت )`
- `coupon_code`: null
- `final_total`: `<span class="final-total" data-orig-value="18720.0000">EGP 18,720.00</span>`
- `invoice_no`: `DR2026/33612`
- `is_direct_sale`: `1`
- `is_export`: `0`
- `marketing_source`: `<i class="fab fa-whatsapp"></i> WhatsApp`
- `mobile`: `01111137735`
- `postpone_button`: `&lt;button type=&quot;button&quot; class=&quot;btn btn-info btn-xs postpone-draft&quot; data-href=&q...`
- `postponed_at`: null
- `postponed_days`: `0`
- `postponed_status`: null
- `postponed_to`: `-`
- `shipping_address`: `لا يوجد`
- `shipping_city`: `لا يوجد`
- `shipping_details`: `12 * خلاط هفار 8000 وات 2*1 (5062)`
- `shipping_state`: `لا يوجد`
- `sub_status`: null
- `supplier_business_name`: null
- `total_items`: `1.00`
- `total_quantity`: `12.00`
- `transaction_date`: `07/03/2026 11:58 AM`

---

### #42 DR2026/33613

**order_description (ERP shipping_details):**
```
1 * مكواه 2800 هفار New (1115)
```

**Our backend keys (from _erp_row_to_order):**
```
  attempt_count: 0
  city: 'المطريه'
  cod_amount: 1150.0
  customer_name: 'فاطمه اسامه'
  customer_phone: '01108168919'
  delivery_address: 'القاهرة\r\n12ش سيف النصر خلف شاليمو شارع المطراوي المطريه'
  erp_order_id: 'DR2026/33613'
  governorate: 'القاهره'
  order_description: '1 * مكواه 2800 هفار New (1115)'
  service_type: 'sell'
  source: 'erp'
  status: 'new'
```

**All ERP keys in this row:**
- `DT_RowAttr`: `{'data-href': 'https://erp.hvarstore.com/sells/71924'}`
- `action`: `<div class="btn-group">
                                <button type="button" class="tw-dw-btn tw-dw...`
- `added_by`: ` حسين مصطفي`
- `business_location`: `مخزن اون لاين`
- `commission_agent`: `يحيي`
- `commission_agent_name`: ` يحيي `
- `contact_id`: `52468`
- `contact_name`: `<a href="https://erp.hvarstore.com/contacts/52468">فاطمه اسامه</a>`
- `contact_name_text`: `فاطمه اسامه`
- `coupon_code`: null
- `final_total`: `<span class="final-total" data-orig-value="1150.0000">EGP 1,150.00</span>`
- `invoice_no`: `DR2026/33613`
- `is_direct_sale`: `1`
- `is_export`: `0`
- `marketing_source`: `<i class="fas fa-store"></i> Walk-in`
- `mobile`: `01108168919`
- `postpone_button`: `&lt;button type=&quot;button&quot; class=&quot;btn btn-info btn-xs postpone-draft&quot; data-href=&q...`
- `postponed_at`: null
- `postponed_days`: `0`
- `postponed_status`: null
- `postponed_to`: `-`
- `shipping_address`: `القاهرة
12ش سيف النصر خلف شاليمو شارع المطراوي المطريه`
- `shipping_city`: `المطريه`
- `shipping_details`: `1 * مكواه 2800 هفار New (1115)`
- `shipping_state`: `القاهره`
- `sub_status`: null
- `supplier_business_name`: null
- `total_items`: `1.00`
- `total_quantity`: `1.00`
- `transaction_date`: `07/03/2026 12:58 PM`

---

### #43 DR2026/33614

**order_description (ERP shipping_details):**
```
1 * كبه هفار 6.5 لتر 2000 وات 4 سرعات (5070+04)
```

**Our backend keys (from _erp_row_to_order):**
```
  attempt_count: 0
  city: 'عين شمس - احمد عصمت'
  cod_amount: 1850.0
  customer_name: 'سمير صابر'
  customer_phone: '01279847578'
  delivery_address: 'العنوان : القاهرة 46 شارع سعد طلبه بجوار فرن الكفاح المهاجرين عين شمس.'
  erp_order_id: 'DR2026/33614'
  governorate: 'القاهره'
  order_description: '1 * كبه هفار 6.5 لتر 2000 وات 4 سرعات (5070+04)'
  service_type: 'sell'
  source: 'erp'
  status: 'new'
```

**All ERP keys in this row:**
- `DT_RowAttr`: `{'data-href': 'https://erp.hvarstore.com/sells/71929'}`
- `action`: `<div class="btn-group">
                                <button type="button" class="tw-dw-btn tw-dw...`
- `added_by`: ` حسين مصطفي`
- `business_location`: `مخزن اون لاين`
- `commission_agent`: `ام مارك`
- `commission_agent_name`: ` ام مارك `
- `contact_id`: `52471`
- `contact_name`: `<a href="https://erp.hvarstore.com/contacts/52471">سمير صابر</a>`
- `contact_name_text`: `سمير صابر`
- `coupon_code`: null
- `final_total`: `<span class="final-total" data-orig-value="1850.0000">EGP 1,850.00</span>`
- `invoice_no`: `DR2026/33614`
- `is_direct_sale`: `1`
- `is_export`: `0`
- `marketing_source`: `<i class="fas fa-store"></i> Walk-in`
- `mobile`: `01279847578`
- `postpone_button`: `&lt;button type=&quot;button&quot; class=&quot;btn btn-info btn-xs postpone-draft&quot; data-href=&q...`
- `postponed_at`: null
- `postponed_days`: `0`
- `postponed_status`: null
- `postponed_to`: `-`
- `shipping_address`: `العنوان : القاهرة 46 شارع سعد طلبه بجوار فرن الكفاح المهاجرين عين شمس.`
- `shipping_city`: `عين شمس - احمد عصمت`
- `shipping_details`: `1 * كبه هفار 6.5 لتر 2000 وات 4 سرعات (5070+04)`
- `shipping_state`: `القاهره`
- `sub_status`: null
- `supplier_business_name`: null
- `total_items`: `1.00`
- `total_quantity`: `1.00`
- `transaction_date`: `07/03/2026 01:03 PM`

---

### #44 DR2026/33652

**order_description (ERP shipping_details):**
```
1 * كبه هفار 6.5 لتر 2000 وات 4 سرعات (5070+04)
```

**Our backend keys (from _erp_row_to_order):**
```
  attempt_count: 0
  city: 'الهرم - فيصل'
  cod_amount: 1850.0
  customer_name: 'محمد ناصر ربيع'
  customer_phone: '01107304793'
  delivery_address: 'العنوان :  اشارع المنشية الطوابق فيصل جيزه مجمع المدارس منشيه البكارى امام مستشفى الكوثر'
  erp_order_id: 'DR2026/33652'
  governorate: 'الجيزه'
  order_description: '1 * كبه هفار 6.5 لتر 2000 وات 4 سرعات (5070+04)'
  service_type: 'sell'
  source: 'erp'
  status: 'new'
```

**All ERP keys in this row:**
- `DT_RowAttr`: `{'data-href': 'https://erp.hvarstore.com/sells/71982'}`
- `action`: `<div class="btn-group">
                                <button type="button" class="tw-dw-btn tw-dw...`
- `added_by`: ` محمد راشد `
- `business_location`: `مخزن اون لاين`
- `commission_agent`: `مايفن`
- `commission_agent_name`: ` مايفن `
- `contact_id`: `52511`
- `contact_name`: `<a href="https://erp.hvarstore.com/contacts/52511">محمد ناصر ربيع</a>`
- `contact_name_text`: `محمد ناصر ربيع`
- `coupon_code`: null
- `final_total`: `<span class="final-total" data-orig-value="1850.0000">EGP 1,850.00</span>`
- `invoice_no`: `DR2026/33652`
- `is_direct_sale`: `1`
- `is_export`: `0`
- `marketing_source`: `<i class="fab fa-facebook"></i> Facebook`
- `mobile`: `01107304793`
- `postpone_button`: `&lt;button type=&quot;button&quot; class=&quot;btn btn-info btn-xs postpone-draft&quot; data-href=&q...`
- `postponed_at`: null
- `postponed_days`: `0`
- `postponed_status`: null
- `postponed_to`: `-`
- `shipping_address`: `العنوان :  اشارع المنشية الطوابق فيصل جيزه مجمع المدارس منشيه البكارى امام مستشفى الكوثر`
- `shipping_city`: `الهرم - فيصل`
- `shipping_details`: `1 * كبه هفار 6.5 لتر 2000 وات 4 سرعات (5070+04)`
- `shipping_state`: `الجيزه`
- `sub_status`: null
- `supplier_business_name`: null
- `total_items`: `1.00`
- `total_quantity`: `1.00`
- `transaction_date`: `07/03/2026 02:13 PM`

---

### #45 DR2026/33665

**order_description (ERP shipping_details):**
```
1 * عجان هفار 11 لتر (10011)
```

**Our backend keys (from _erp_row_to_order):**
```
  attempt_count: 0
  city: 'النزهه - النزهه الجديده'
  cod_amount: 7300.0
  customer_name: 'مصطفي محمود جاب الله'
  customer_phone: '01017991344'
  delivery_address: 'اسم المحافظه القاهره\r\nتابعه لمركز اي النزهه الجديده\r\n العنوان تفصيلي 10 شارع الزهراء متفرع من ش ال15 من شارع ال100 جسر السويس- بيرتي\r\nبجوار اي او علامه مميزه في المكان علي ناصيه الشارع محل البطل الكهربائي و قدام البيت مسجد'
  erp_order_id: 'DR2026/33665'
  governorate: 'القاهره'
  order_description: '1 * عجان هفار 11 لتر (10011)'
  service_type: 'sell'
  source: 'erp'
  status: 'new'
```

**All ERP keys in this row:**
- `DT_RowAttr`: `{'data-href': 'https://erp.hvarstore.com/sells/71995'}`
- `action`: `<div class="btn-group">
                                <button type="button" class="tw-dw-btn tw-dw...`
- `added_by`: ` محمد راشد `
- `business_location`: `مخزن اون لاين`
- `commission_agent`: `شروق عبدالرحمن`
- `commission_agent_name`: ` شروق عبدالرحمن `
- `contact_id`: `52523`
- `contact_name`: `<a href="https://erp.hvarstore.com/contacts/52523">مصطفي محمود جاب الله</a>`
- `contact_name_text`: `مصطفي محمود جاب الله`
- `coupon_code`: null
- `final_total`: `<span class="final-total" data-orig-value="7300.0000">EGP 7,300.00</span>`
- `invoice_no`: `DR2026/33665`
- `is_direct_sale`: `1`
- `is_export`: `0`
- `marketing_source`: `<i class="fab fa-facebook"></i> Facebook`
- `mobile`: `01017991344`
- `postpone_button`: `&lt;button type=&quot;button&quot; class=&quot;btn btn-info btn-xs postpone-draft&quot; data-href=&q...`
- `postponed_at`: null
- `postponed_days`: `0`
- `postponed_status`: null
- `postponed_to`: `-`
- `shipping_address`: `اسم المحافظه القاهره
تابعه لمركز اي النزهه الجديده
 العنوان تفصيلي 10 شارع الزهراء متفرع من ش ال15...`
- `shipping_city`: `النزهه - النزهه الجديده`
- `shipping_details`: `1 * عجان هفار 11 لتر (10011)`
- `shipping_state`: `القاهره`
- `sub_status`: null
- `supplier_business_name`: null
- `total_items`: `1.00`
- `total_quantity`: `1.00`
- `transaction_date`: `07/03/2026 02:26 PM`

---

### #46 DR2026/33675

**order_description (ERP shipping_details):**
```
1 * كبه هفار 6.5 لتر 2000 وات 4 سرعات (5070+04)
```

**Our backend keys (from _erp_row_to_order):**
```
  attempt_count: 0
  city: 'طنطا'
  cod_amount: 1850.0
  customer_name: 'ادم الصاوي'
  customer_phone: '01014543470'
  delivery_address: 'الغربيه طنطا كوبرى قحافه أمام الشهر العقاري'
  erp_order_id: 'DR2026/33675'
  governorate: 'الغربيه'
  order_description: '1 * كبه هفار 6.5 لتر 2000 وات 4 سرعات (5070+04)'
  service_type: 'sell'
  source: 'erp'
  status: 'new'
```

**All ERP keys in this row:**
- `DT_RowAttr`: `{'data-href': 'https://erp.hvarstore.com/sells/72005'}`
- `action`: `<div class="btn-group">
                                <button type="button" class="tw-dw-btn tw-dw...`
- `added_by`: ` محمد راشد `
- `business_location`: `مخزن اون لاين`
- `commission_agent`: `شروق عبدالرحمن`
- `commission_agent_name`: ` شروق عبدالرحمن `
- `contact_id`: `52532`
- `contact_name`: `<a href="https://erp.hvarstore.com/contacts/52532">ادم الصاوي</a>`
- `contact_name_text`: `ادم الصاوي`
- `coupon_code`: null
- `final_total`: `<span class="final-total" data-orig-value="1850.0000">EGP 1,850.00</span>`
- `invoice_no`: `DR2026/33675`
- `is_direct_sale`: `1`
- `is_export`: `0`
- `marketing_source`: `<i class="fab fa-facebook"></i> Facebook`
- `mobile`: `01014543470`
- `postpone_button`: `&lt;button type=&quot;button&quot; class=&quot;btn btn-info btn-xs postpone-draft&quot; data-href=&q...`
- `postponed_at`: null
- `postponed_days`: `0`
- `postponed_status`: null
- `postponed_to`: `-`
- `shipping_address`: `الغربيه طنطا كوبرى قحافه أمام الشهر العقاري`
- `shipping_city`: `طنطا`
- `shipping_details`: `1 * كبه هفار 6.5 لتر 2000 وات 4 سرعات (5070+04)`
- `shipping_state`: `الغربيه`
- `sub_status`: null
- `supplier_business_name`: null
- `total_items`: `1.00`
- `total_quantity`: `1.00`
- `transaction_date`: `07/03/2026 02:38 PM`

---

### #47 DR2026/33680

**order_description (ERP shipping_details):**
```
كبه هفار  6.5 لتر 2000 وات  اسود -نيو  *1
```

**Our backend keys (from _erp_row_to_order):**
```
  attempt_count: 0
  city: 'لا يوجد'
  cod_amount: 1850.0
  customer_name: 'عمرو محمود'
  customer_phone: '01153225757'
  delivery_address: 'لا يوجد'
  erp_order_id: 'DR2026/33680'
  governorate: 'لا يوجد'
  order_description: 'كبه هفار  6.5 لتر 2000 وات  اسود -نيو  *1'
  service_type: 'sell'
  source: 'erp'
  status: 'new'
```

**All ERP keys in this row:**
- `DT_RowAttr`: `{'data-href': 'https://erp.hvarstore.com/sells/72010'}`
- `action`: `<div class="btn-group">
                                <button type="button" class="tw-dw-btn tw-dw...`
- `added_by`: `Mr Ahmed Elghazaly`
- `business_location`: `مخزن اون لاين`
- `commission_agent`: `لا يوجد`
- `commission_agent_name`: `  `
- `contact_id`: `52536`
- `contact_name`: `<a href="https://erp.hvarstore.com/contacts/52536">عمرو محمود</a>`
- `contact_name_text`: `عمرو محمود`
- `coupon_code`: null
- `final_total`: `<span class="final-total" data-orig-value="1850.0000">EGP 1,850.00</span>`
- `invoice_no`: `DR2026/33680`
- `is_direct_sale`: `0`
- `is_export`: `0`
- `marketing_source`: `-`
- `mobile`: `01153225757`
- `postpone_button`: `&lt;button type=&quot;button&quot; class=&quot;btn btn-info btn-xs postpone-draft&quot; data-href=&q...`
- `postponed_at`: null
- `postponed_days`: `0`
- `postponed_status`: null
- `postponed_to`: `-`
- `shipping_address`: `لا يوجد`
- `shipping_city`: `لا يوجد`
- `shipping_details`: `كبه هفار  6.5 لتر 2000 وات  اسود -نيو  *1`
- `shipping_state`: `لا يوجد`
- `sub_status`: null
- `supplier_business_name`: null
- `total_items`: `1.00`
- `total_quantity`: `1.00`
- `transaction_date`: `07/03/2026 12:43 PM`

---

### #48 DR2026/33693

**order_description (ERP shipping_details):**
```
1 * كبه هفار 6.5 لتر 2000 وات 4 سرعات (5070+04) 1 * مضرب بيض 500 وات (1101)
```

**Our backend keys (from _erp_row_to_order):**
```
  attempt_count: 0
  city: 'اشمون'
  cod_amount: 2675.0
  customer_name: 'أحمد حمدي عمران'
  customer_phone: '01040556116'
  delivery_address: 'عنوان الشحن\r\n10 شارع دكتور محمود عبدالله الدور الثانى قريه دروه المنوفيه المحطه اللي بعد القناطر الخيريه\r\nقريه دروه مركز اشمون, Monufia'
  erp_order_id: 'DR2026/33693'
  governorate: 'المنوفيه'
  order_description: '1 * كبه هفار 6.5 لتر 2000 وات 4 سرعات (5070+04) 1 * مضرب بيض 500 وات (1101)'
  service_type: 'sell'
  source: 'erp'
  status: 'new'
```

**All ERP keys in this row:**
- `DT_RowAttr`: `{'data-href': 'https://erp.hvarstore.com/sells/72023'}`
- `action`: `<div class="btn-group">
                                <button type="button" class="tw-dw-btn tw-dw...`
- `added_by`: ` محمد راشد `
- `business_location`: `مخزن اون لاين`
- `commission_agent`: `فواتير السايت`
- `commission_agent_name`: ` فواتير السايت `
- `contact_id`: `52547`
- `contact_name`: `<a href="https://erp.hvarstore.com/contacts/52547">أحمد حمدي عمران</a>`
- `contact_name_text`: `أحمد حمدي عمران`
- `coupon_code`: null
- `final_total`: `<span class="final-total" data-orig-value="2675.0000">EGP 2,675.00</span>`
- `invoice_no`: `DR2026/33693`
- `is_direct_sale`: `1`
- `is_export`: `0`
- `marketing_source`: `<i class="fas fa-store"></i> Walk-in`
- `mobile`: `01040556116`
- `postpone_button`: `&lt;button type=&quot;button&quot; class=&quot;btn btn-info btn-xs postpone-draft&quot; data-href=&q...`
- `postponed_at`: null
- `postponed_days`: `0`
- `postponed_status`: null
- `postponed_to`: `-`
- `shipping_address`: `عنوان الشحن
10 شارع دكتور محمود عبدالله الدور الثانى قريه دروه المنوفيه المحطه اللي بعد القناطر الخ...`
- `shipping_city`: `اشمون`
- `shipping_details`: `1 * كبه هفار 6.5 لتر 2000 وات 4 سرعات (5070+04) 1 * مضرب بيض 500 وات (1101)`
- `shipping_state`: `المنوفيه`
- `sub_status`: null
- `supplier_business_name`: null
- `total_items`: `2.00`
- `total_quantity`: `2.00`
- `transaction_date`: `07/03/2026 02:56 PM`

---

### #49 DR2026/33696

**order_description (ERP shipping_details):**
```
كبه هفار  6.5 لتر 2000 وات  اسود -نيو  *1
```

**Our backend keys (from _erp_row_to_order):**
```
  attempt_count: 0
  city: 'لا يوجد'
  cod_amount: 1850.0
  customer_name: 'اشرف فتحي عبده علي'
  customer_phone: '01009682792'
  delivery_address: 'لا يوجد'
  erp_order_id: 'DR2026/33696'
  governorate: 'لا يوجد'
  order_description: 'كبه هفار  6.5 لتر 2000 وات  اسود -نيو  *1'
  service_type: 'sell'
  source: 'erp'
  status: 'new'
```

**All ERP keys in this row:**
- `DT_RowAttr`: `{'data-href': 'https://erp.hvarstore.com/sells/72026'}`
- `action`: `<div class="btn-group">
                                <button type="button" class="tw-dw-btn tw-dw...`
- `added_by`: `Mr Ahmed Elghazaly`
- `business_location`: `مخزن اون لاين`
- `commission_agent`: `لا يوجد`
- `commission_agent_name`: `  `
- `contact_id`: `52551`
- `contact_name`: `<a href="https://erp.hvarstore.com/contacts/52551">اشرف فتحي عبده علي</a>`
- `contact_name_text`: `اشرف فتحي عبده علي`
- `coupon_code`: null
- `final_total`: `<span class="final-total" data-orig-value="1850.0000">EGP 1,850.00</span>`
- `invoice_no`: `DR2026/33696`
- `is_direct_sale`: `0`
- `is_export`: `0`
- `marketing_source`: `-`
- `mobile`: `01009682792`
- `postpone_button`: `&lt;button type=&quot;button&quot; class=&quot;btn btn-info btn-xs postpone-draft&quot; data-href=&q...`
- `postponed_at`: null
- `postponed_days`: `0`
- `postponed_status`: null
- `postponed_to`: `-`
- `shipping_address`: `لا يوجد`
- `shipping_city`: `لا يوجد`
- `shipping_details`: `كبه هفار  6.5 لتر 2000 وات  اسود -نيو  *1`
- `shipping_state`: `لا يوجد`
- `sub_status`: null
- `supplier_business_name`: null
- `total_items`: `1.00`
- `total_quantity`: `1.00`
- `transaction_date`: `07/03/2026 01:01 PM`

---

### #50 DR2026/33697

**order_description (ERP shipping_details):**
```
1 * كبه هفار 6.5 لتر 2000 وات 4 سرعات (5070+04)
```

**Our backend keys (from _erp_row_to_order):**
```
  attempt_count: 0
  city: 'الخانكه - الخصوص'
  cod_amount: 1850.0
  customer_name: 'سما سامح'
  customer_phone: '01107196954'
  delivery_address: 'عنوان الشحن\r\nالخصوص نفق الرشاح\r\nالخصوص, Cairo'
  erp_order_id: 'DR2026/33697'
  governorate: 'القليوبيه'
  order_description: '1 * كبه هفار 6.5 لتر 2000 وات 4 سرعات (5070+04)'
  service_type: 'sell'
  source: 'erp'
  status: 'new'
```

**All ERP keys in this row:**
- `DT_RowAttr`: `{'data-href': 'https://erp.hvarstore.com/sells/72027'}`
- `action`: `<div class="btn-group">
                                <button type="button" class="tw-dw-btn tw-dw...`
- `added_by`: ` محمد راشد `
- `business_location`: `مخزن اون لاين`
- `commission_agent`: `فواتير السايت`
- `commission_agent_name`: ` فواتير السايت `
- `contact_id`: `52550`
- `contact_name`: `<a href="https://erp.hvarstore.com/contacts/52550">سما سامح</a>`
- `contact_name_text`: `سما سامح`
- `coupon_code`: null
- `final_total`: `<span class="final-total" data-orig-value="1850.0000">EGP 1,850.00</span>`
- `invoice_no`: `DR2026/33697`
- `is_direct_sale`: `1`
- `is_export`: `0`
- `marketing_source`: `<i class="fas fa-store"></i> Walk-in`
- `mobile`: `01107196954`
- `postpone_button`: `&lt;button type=&quot;button&quot; class=&quot;btn btn-info btn-xs postpone-draft&quot; data-href=&q...`
- `postponed_at`: null
- `postponed_days`: `0`
- `postponed_status`: null
- `postponed_to`: `-`
- `shipping_address`: `عنوان الشحن
الخصوص نفق الرشاح
الخصوص, Cairo`
- `shipping_city`: `الخانكه - الخصوص`
- `shipping_details`: `1 * كبه هفار 6.5 لتر 2000 وات 4 سرعات (5070+04)`
- `shipping_state`: `القليوبيه`
- `sub_status`: null
- `supplier_business_name`: null
- `total_items`: `1.00`
- `total_quantity`: `1.00`
- `transaction_date`: `07/03/2026 03:00 PM`

---
