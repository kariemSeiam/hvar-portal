# ERP draft-dt: first 5 rows — full response, all data keys (realtime)

Source: `GET /api/erp/drafts` (realtime, not demo).  
Raw JSON: `docs/call-center/erp-draft-first5-realtime.json`.

---

## Response envelope


| Key                    | Value                          |
| ---------------------- | ------------------------------ |
| `status`               | 200                            |
| `statusText`           | OK                             |
| `data.draw`            | 1                              |
| `data.recordsFiltered` | 172                            |
| `data.recordsTotal`    | 172                            |
| `data.data`            | Array of 5 row objects (below) |


---

## All data keys per row (ERP draft-dt)

Every row in `data.data` has these **30 keys**:


| #   | Key                      | Type          | Description                                                        |
| --- | ------------------------ | ------------- | ------------------------------------------------------------------ |
| 1   | `DT_RowAttr`             | object        | `{ "data-href": "https://erp.hvarstore.com/sells/{id}" }`          |
| 2   | `action`                 | string        | HTML: ERP UI actions (view, edit, print, delete, postpone, cancel) |
| 3   | `added_by`               | string        | User who added the draft                                           |
| 4   | `business_location`      | string        | e.g. "مخزن اون لاين"                                               |
| 5   | `commission_agent`       | string        | Agent code                                                         |
| 6   | `commission_agent_name`  | string        | Agent display name                                                 |
| 7   | `contact_id`             | number        | ERP contact id                                                     |
| 8   | `contact_name`           | string        | HTML link to contact                                               |
| 9   | `contact_name_text`      | string        | Plain name (no HTML)                                               |
| 10  | `coupon_code`            | string | null | Coupon if used                                                     |
| 11  | `final_total`            | string        | HTML span with `data-orig-value` (numeric) and "EGP X,XXX.XX"      |
| 12  | `invoice_no`             | string        | e.g. "DR2026/32807"                                                |
| 13  | `is_direct_sale`         | number        | 0 or 1                                                             |
| 14  | `is_export`              | number        | 0 or 1                                                             |
| 15  | `marketing_source`       | string        | HTML e.g. Facebook icon + "Facebook"                               |
| 16  | `mobile`                 | string        | Customer phone                                                     |
| 17  | `postpone_button`        | string        | HTML-escaped button markup                                         |
| 18  | `postponed_at`           | string | null | Date or null                                                       |
| 19  | `postponed_days`         | number        | 0 if not postponed                                                 |
| 20  | `postponed_status`       | string | null | null when not postponed                                            |
| 21  | `postponed_to`           | string        | "-" or date                                                        |
| 22  | `shipping_address`       | string        | Full address (may contain `\r\n`)                                  |
| 23  | `shipping_city`          | string        | City / area                                                        |
| 24  | `shipping_details`       | string        | Single line: items text (e.g. "1 * كبه هفار...")                   |
| 25  | `shipping_state`         | string        | Governorate                                                        |
| 26  | `sub_status`             | string | null | null in samples                                                    |
| 27  | `supplier_business_name` | string | null | null for sell drafts                                               |
| 28  | `total_items`            | string        | e.g. "1.00", "2.00"                                                |
| 29  | `total_quantity`         | string        | e.g. "1.00", "2.00"                                                |
| 30  | `transaction_date`       | string        | e.g. "02/03/2026 01:59 AM"                                         |


---

## First 5 rows — full key/value (realtime)

*(Values for `action` and `postpone_button` are abbreviated as `[HTML]`; full values are in the JSON file.)*

### Row 1 — invoice_no: DR2026/32807


| Key                    | Value                                                                                                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DT_RowAttr             | `{"data-href":"https://erp.hvarstore.com/sells/70880"}`                                                                                                             |
| action                 | [HTML]                                                                                                                                                              |
| added_by               | حسين مصطفي                                                                                                                                                          |
| business_location      | مخزن اون لاين                                                                                                                                                       |
| commission_agent       | مني                                                                                                                                                                 |
| commission_agent_name  | مني                                                                                                                                                                 |
| contact_id             | 51778                                                                                                                                                               |
| contact_name           | `<a href=".../contacts/51778">مارى جرجس عبد الحى</a>`                                                                                                               |
| contact_name_text      | مارى جرجس عبد الحى                                                                                                                                                  |
| coupon_code            | null                                                                                                                                                                |
| final_total            | `<span class="final-total" data-orig-value="3800.0000">EGP 3,800.00</span>`                                                                                         |
| invoice_no             | DR2026/32807                                                                                                                                                        |
| is_direct_sale         | 1                                                                                                                                                                   |
| is_export              | 0                                                                                                                                                                   |
| marketing_source       | `<i class="fab fa-facebook"></i> Facebook`                                                                                                                          |
| mobile                 | 01101332453                                                                                                                                                         |
| postpone_button        | [HTML]                                                                                                                                                              |
| postponed_at           | null                                                                                                                                                                |
| postponed_days         | 0                                                                                                                                                                   |
| postponed_status       | null                                                                                                                                                                |
| postponed_to           | -                                                                                                                                                                   |
| shipping_address       | العنوان :محافظه القاهرة\r\nتابعه لمركز اي /حلوان\r\nاسم الشارع /المشروع الأمريكى مجاورة 8 منزل 1 شارع 219 أمام مقبرة السيارات الطريق الجديد بجوار قنديل مصر للديكور |
| shipping_city          | حلوان                                                                                                                                                               |
| shipping_details       | 1 * كبه هفار 6.5 لتر 2000 وات 4 سرعات (5070+04) 1 * هاند بلندر هفار 1500 وات 4*1 (5057)                                                                             |
| shipping_state         | القاهره                                                                                                                                                             |
| sub_status             | null                                                                                                                                                                |
| supplier_business_name | null                                                                                                                                                                |
| total_items            | 2.00                                                                                                                                                                |
| total_quantity         | 2.00                                                                                                                                                                |
| transaction_date       | 02/03/2026 01:59 AM                                                                                                                                                 |


---

### Row 2 — invoice_no: DR2026/32827


| Key                    | Value                                                                                                   |
| ---------------------- | ------------------------------------------------------------------------------------------------------- |
| DT_RowAttr             | `{"data-href":"https://erp.hvarstore.com/sells/70900"}`                                                 |
| action                 | [HTML]                                                                                                  |
| added_by               | حسين مصطفي                                                                                              |
| business_location      | مخزن اون لاين                                                                                           |
| commission_agent       | مني                                                                                                     |
| commission_agent_name  | مني                                                                                                     |
| contact_id             | 51793                                                                                                   |
| contact_name           | `<a href=".../contacts/51793">حسام الدين كريم جمال</a>`                                                 |
| contact_name_text      | حسام الدين كريم جمال                                                                                    |
| coupon_code            | null                                                                                                    |
| final_total            | `<span ... data-orig-value="1850.0000">EGP 1,850.00</span>`                                             |
| invoice_no             | DR2026/32827                                                                                            |
| is_direct_sale         | 1                                                                                                       |
| is_export              | 0                                                                                                       |
| marketing_source       | `<i class="fab fa-facebook"></i> Facebook`                                                              |
| mobile                 | 01019964498                                                                                             |
| postpone_button        | [HTML]                                                                                                  |
| postponed_at           | null                                                                                                    |
| postponed_days         | 0                                                                                                       |
| postponed_status       | null                                                                                                    |
| postponed_to           | -                                                                                                       |
| shipping_address       | العنوان :محافظه الجيزه \r\nش عطيه شراره ترعة عبد العال٢ من شارع العشرين فيصل ناصية الشارع موان ام النور |
| shipping_city          | الهرم - فيصل                                                                                            |
| shipping_details       | 1 * كبه هفار 6.5 لتر 2000 وات 4 سرعات (5070+04)                                                         |
| shipping_state         | الجيزه                                                                                                  |
| sub_status             | null                                                                                                    |
| supplier_business_name | null                                                                                                    |
| total_items            | 1.00                                                                                                    |
| total_quantity         | 1.00                                                                                                    |
| transaction_date       | 02/03/2026 02:18 AM                                                                                     |


---

### Row 3 — invoice_no: DR2026/32904


| Key                    | Value                                                                        |
| ---------------------- | ---------------------------------------------------------------------------- |
| DT_RowAttr             | `{"data-href":"https://erp.hvarstore.com/sells/70997"}`                      |
| action                 | [HTML]                                                                       |
| added_by               | محمد راشد                                                                    |
| business_location      | مخزن اون لاين                                                                |
| commission_agent       | غاده                                                                         |
| commission_agent_name  | غاده                                                                         |
| contact_id             | 51852                                                                        |
| contact_name           | `<a href=".../contacts/51852">ياسر الصعيدى</a>`                              |
| contact_name_text      | ياسر الصعيدى                                                                 |
| coupon_code            | null                                                                         |
| final_total            | `<span ... data-orig-value="1500.0000">EGP 1,500.00</span>`                  |
| invoice_no             | DR2026/32904                                                                 |
| is_direct_sale         | 1                                                                            |
| is_export              | 0                                                                            |
| marketing_source       | `<i class="fab fa-facebook"></i> Facebook`                                   |
| mobile                 | 01126493263                                                                  |
| postpone_button        | [HTML]                                                                       |
| postponed_at           | null                                                                         |
| postponed_days         | 0                                                                            |
| postponed_status       | null                                                                         |
| postponed_to           | -                                                                            |
| shipping_address       | العنوان :اسكندرية منطقة بولكلي شارع احمد فؤاد درويش عمارة برج البارون رقم 12 |
| shipping_city          | سيدي جابر - مصطفي كامل وبولكلي                                               |
| shipping_details       | 1 * مضرب بيض 500 وات بالحلة (1104)                                           |
| shipping_state         | الاسكندريه                                                                   |
| sub_status             | null                                                                         |
| supplier_business_name | null                                                                         |
| total_items            | 1.00                                                                         |
| total_quantity         | 1.00                                                                         |
| transaction_date       | 02/03/2026 12:44 PM                                                          |


---

### Row 4 — invoice_no: DR2026/32910


| Key                    | Value                                                                      |
| ---------------------- | -------------------------------------------------------------------------- |
| DT_RowAttr             | `{"data-href":"https://erp.hvarstore.com/sells/71004"}`                    |
| action                 | [HTML]                                                                     |
| added_by               | حسين مصطفي                                                                 |
| business_location      | مخزن اون لاين                                                              |
| commission_agent       | غاده                                                                       |
| commission_agent_name  | غاده                                                                       |
| contact_id             | 51848                                                                      |
| contact_name           | `<a href=".../contacts/51848">شهرذاد أخنوخ</a>`                            |
| contact_name_text      | شهرذاد أخنوخ                                                               |
| coupon_code            | null                                                                       |
| final_total            | `<span ... data-orig-value="3600.0000">EGP 3,600.00</span>`                |
| invoice_no             | DR2026/32910                                                               |
| is_direct_sale         | 1                                                                          |
| is_export              | 0                                                                          |
| marketing_source       | `<i class="fab fa-facebook"></i> Facebook`                                 |
| mobile                 | 01152849432                                                                |
| postpone_button        | [HTML]                                                                     |
| postponed_at           | null                                                                       |
| postponed_days         | 0                                                                          |
| postponed_status       | null                                                                       |
| postponed_to           | -                                                                          |
| shipping_address       | العنوان :القاهرة مدينة نصر التبة شارع الثلاجة قرب الجامع الأخضر            |
| shipping_city          | مدينه نصر - الحديقه الدوليه                                                |
| shipping_details       | 1 * مضرب بيض 500 وات بالحلة (1104) 1 * هاند بلندر هفار 1500 وات 4*1 (5057) |
| shipping_state         | القاهره                                                                    |
| sub_status             | null                                                                       |
| supplier_business_name | null                                                                       |
| total_items            | 2.00                                                                       |
| total_quantity         | 2.00                                                                       |
| transaction_date       | 02/03/2026 02:45 PM                                                        |


---

### Row 5 — invoice_no: DR2026/32918


| Key                    | Value                                                                                                           |
| ---------------------- | --------------------------------------------------------------------------------------------------------------- |
| DT_RowAttr             | `{"data-href":"https://erp.hvarstore.com/sells/71033"}`                                                         |
| action                 | [HTML]                                                                                                          |
| added_by               | محمد راشد                                                                                                       |
| business_location      | مخزن اون لاين                                                                                                   |
| commission_agent       | شروق عبدالرحمن                                                                                                  |
| commission_agent_name  | شروق عبدالرحمن                                                                                                  |
| contact_id             | 51863                                                                                                           |
| contact_name           | `<a href=".../contacts/51863">أسامة جوز نورا</a>`                                                               |
| contact_name_text      | أسامة جوز نورا                                                                                                  |
| coupon_code            | null                                                                                                            |
| final_total            | `<span ... data-orig-value="1850.0000">EGP 1,850.00</span>`                                                     |
| invoice_no             | DR2026/32918                                                                                                    |
| is_direct_sale         | 1                                                                                                               |
| is_export              | 0                                                                                                               |
| marketing_source       | `<i class="fab fa-facebook"></i> Facebook`                                                                      |
| mobile                 | 01093282323                                                                                                     |
| postpone_button        | [HTML]                                                                                                          |
| postponed_at           | null                                                                                                            |
| postponed_days         | 0                                                                                                               |
| postponed_status       | null                                                                                                            |
| postponed_to           | -                                                                                                               |
| shipping_address       | كفر الجمال \r\nطوخ \r\nقليوبيه \r\nمدرسه كفر الجمال الابتدائيه بجوار سنترال احمد بدوى\r\nاحمد ابراهيم عبد الصمد |
| shipping_city          | طوخ                                                                                                             |
| shipping_details       | 1 * كبه هفار 6.5 لتر 2000 وات 4 سرعات (5070+04)                                                                 |
| shipping_state         | القليوبيه                                                                                                       |
| sub_status             | null                                                                                                            |
| supplier_business_name | null                                                                                                            |
| total_items            | 1.00                                                                                                            |
| total_quantity         | 1.00                                                                                                            |
| transaction_date       | 02/03/2026 03:21 PM                                                                                             |


---

## Summary

- **Response**: Realtime `GET /api/erp/drafts` (first 5 of 172 rows).
- **Row keys**: 30 keys per row (see table above); full JSON in `erp-draft-first5-realtime.json`.
- **Numeric from HTML**: `final_total` → use `data-orig-value` from the span for EGP amount.

