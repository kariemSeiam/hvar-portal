# app/utils/messages.py
"""Centralized Arabic messages for the application."""

# General messages
MESSAGES = {
    # Success messages
    "success": "تم بنجاح",
    "created": "تم الإنشاء بنجاح",
    "updated": "تم التحديث بنجاح",
    "deleted": "تم الحذف بنجاح",
    "completed": "تم الإكمال بنجاح",
    "scanned": "تم المسح بنجاح",
    "synced": "تم المزامنة بنجاح",
    
    # Error messages
    "not_found": "غير موجود",
    "not_found_ticket": "التذكرة غير موجودة",
    "not_found_customer": "العميل غير موجود",
    "not_found_item": "القطعة غير موجودة",
    "not_found_stock": "المخزون غير موجود",
    "not_found_tracking": "لا توجد تذكرة مرتبطة برقم التتبع هذا",
    
    "missing_fields": "الحقول المطلوبة مفقودة",
    "missing_ticket_id": "معرف التذكرة مطلوب",
    "missing_user_id": "معرف المستخدم مطلوب",
    "missing_tracking": "رقم التتبع مطلوب",
    "missing_phone": "رقم الهاتف مطلوب",
    "missing_name": "الاسم مطلوب",
    "missing_items": "القطع مطلوبة",
    "missing_customer_data": "بيانات العميل مطلوبة",
    
    "invalid_type": "النوع غير صحيح",
    "invalid_status": "الحالة غير صحيحة",
    "invalid_state_transition": "الانتقال بين الحالات غير صحيح",
    "invalid_condition": "الحالة غير صحيحة",
    "invalid_ticket_type": "نوع التذكرة غير صحيح",
    "invalid_item_type": "نوع القطعة غير صحيح",
    
    "insufficient_stock": "المخزون غير كافٍ",
    "already_exists": "موجود بالفعل",
    "already_used": "مستخدم بالفعل",
    "duplicate_sku": "الكود موجود بالفعل",
    "duplicate_tracking": "رقم التتبع مستخدم بالفعل",
    "duplicate_phone": "رقم الهاتف موجود بالفعل",
    "phone_primary_secondary_same": "رقم أساسي وثانوي لا يمكن أن يكونا نفس الرقم",
    
    "failed_create": "فشل الإنشاء",
    "failed_update": "فشل التحديث",
    "failed_delete": "فشل الحذف",
    "failed_execute": "فشل التنفيذ",
    "failed_sync": "فشل المزامنة",
    
    "cannot_delete_item": "لا يمكن حذف القطعة",
    "item_referenced_tickets": "القطعة مرتبطة بتذاكر نشطة",
    "item_referenced_movements": "القطعة لها حركات مخزون",
    "service_items_count": "عنصر خدمة",
    "stock_movements_count": "حركة مخزون",
    
    "no_changes": "لا توجد تغييرات",
    "no_items": "لا توجد قطع",
    "no_history": "لا يوجد تاريخ",
    "no_customer": "لا يوجد عميل",
    "no_orders": "لا توجد طلبات",
    
    # Validation messages
    "validation_failed": "فشل التحقق",
    "phone_required": "رقم الهاتف مطلوب",
    "name_required": "الاسم مطلوب",
    "phone_exists": "رقم الهاتف موجود بالفعل",
    "name_phone_required": "الاسم ورقم الهاتف مطلوبان",
    "items_required": "القطع مطلوبة",
    "condition_required": "الحالة مطلوبة",
    "tracking_required": "رقم التتبع مطلوب",
    
    # Stock messages
    "stock_reserved": "تم حجز المخزون",
    "stock_committed": "تم تأكيد المخزون",
    "stock_adjusted": "تم تعديل المخزون",
    "stock_received": "تم استلام المخزون",
    "stock_processed": "تم معالجة المخزون",
    
    # Ticket messages
    "ticket_created": "تم إنشاء التذكرة",
    "ticket_confirmed": "تم تأكيد التذكرة",
    "ticket_cancelled": "تم إلغاء التذكرة",
    "ticket_completed": "تم إكمال التذكرة",
    "ticket_received": "تم استلام التذكرة",
    "ticket_sent": "تم إرسال التذكرة",
    "ticket_in_process": "التذكرة قيد المعالجة",
    "ticket_ready_dispatch": "التذكرة جاهزة للإرسال",
    
    # Scan messages
    "scan_logged": "تم تسجيل المسح",
    "scan_received": "تم استلام الشحنة",
    "scan_dispatched": "تم إرسال الشحنة",
    "scan_recorded": "تم تسجيل المسح وتحديث حالة التذكرة بنجاح",
    
    # Customer messages
    "customer_created": "تم إنشاء العميل",
    "customer_updated": "تم تحديث بيانات العميل",
    "customer_merged": "تم دمج بيانات العميل وتحديث الرقم بنجاح",
    "customer_not_found": "العميل غير موجود",
    "customer_search_failed": "فشل البحث عن العميل",
    
    # Warning messages
    "warning_no_history": "لا يوجد تاريخ مسح لهذا الرقم",
    "warning_cancelled": "هذه التذكرة تم إلغاؤها",
    "warning_no_ticket": "لا توجد تذكرة مرتبطة",
    
    # API specific messages
    "api_error": "خطأ في الاتصال",
    "internal_error": "خطأ داخلي",
    "service_unavailable": "الخدمة غير متاحة",
    "bad_request": "طلب غير صحيح",
    
    # Bosta messages
    "bosta_not_configured": "بوستا غير معد",
    "bosta_not_accessible": "بوستا غير متاح",
    "bosta_sync_failed": "فشل مزامنة بوستا",
    "bosta_no_orders": "لا توجد طلبات في بوستا",
    
    # Maintenance messages
    "maintenance_started": "تم بدء الصيانة",
    "maintenance_completed": "تم إكمال الصيانة",
    "maintenance_only": "هذا الإجراء خاص بتذاكر الصيانة فقط",
    
    # Return messages
    "return_received": "تم استلام المرتجع",
    "return_validated": "تم التحقق من المرتجع",
    "return_processed": "تم معالجة المرتجع",
    
    # Replacement messages
    "replacement_prepared": "تم تحضير البديل",
    "replacement_ready": "البديل جاهز للإرسال",
    
    # Field specific messages
    "field_sku": "كود المنتج",
    "field_name": "الاسم",
    "field_type": "النوع",
    "field_quantity": "الكمية",
    "field_tracking": "رقم التتبع",
    "field_phone": "رقم الهاتف",
    "field_address": "العنوان",
    
    # Button labels
    "btn_create": "إنشاء",
    "btn_update": "تحديث",
    "btn_delete": "حذف",
    "btn_cancel": "إلغاء",
    "btn_confirm": "تأكيد",
    "btn_send": "إرسال",
    "btn_receive": "استلام",
    "btn_scan": "مسح",
    "btn_dispatch": "إرسال",
    "btn_complete": "إكمال",
    
    # Action labels
    "action_receive": "استلام الشحنة",
    "action_dispatch": "إرسال الشحنة",
    "action_scan": "مسح الرمز",
    "action_create_ticket": "إنشاء تذكرة",
    "action_archive": "أرشفة التذكرة",
    
    # Status labels
    "status_pending": "قيد الانتظار",
    "status_confirmed": "مؤكد",
    "status_in_process": "قيد المعالجة",
    "status_ready": "جاهز",
    "status_sent": "مرسل",
    "status_completed": "مكتمل",
    "status_cancelled": "ملغي",
    
    # Type labels
    "type_replacement": "استبدال",
    "type_maintenance": "صيانة",
    "type_return": "إرجاع",
    
    # Direction labels
    "direction_send": "إرسال",
    "direction_receive": "استلام",
    
    # Condition labels
    "condition_valid": "سليم",
    "condition_damaged": "تالف",
    
    # Exception messages
    "err_tracking_already_used": "رقم التتبع الأصلي مستخدم بالفعل في تذكرة أخرى",
    "err_tracking_used_once": "يمكن استخدام رقم التتبع الأصلي مرة واحدة فقط",
    "err_new_tracking_already_used": "رقم التتبع الجديد مستخدم بالفعل في تذكرة أخرى",
    "err_new_tracking_used_once": "يمكن استخدام رقم التتبع الجديد مرة واحدة فقط في أي تذكرة",
    "err_customer_data_required": "يجب توفير معرف العميل أو بيانات العميل (الاسم والهاتف)",
    "err_phone_required": "رقم الهاتف مطلوب للبحث عن العميل أو إنشائه",
    "err_name_required": "الاسم مطلوب لإنشاء عميل جديد",
    "err_customer_create_failed": "فشل إنشاء العميل",
    "err_ticket_not_found": "التذكرة غير موجودة",
    "err_invalid_transition": "الانتقال غير صحيح",
    "err_condition_required": "الحالة مطلوبة للقطعة",
    "err_invalid_condition": "الحالة غير صحيحة للقطعة",
    "err_no_items_to_send": "لا توجد قطع محددة للإرسال لهذه التذكرة",
    "err_maintenance_only": "هذا الإجراء خاص بتذاكر الصيانة فقط",
    "err_sell_only": "هذا الإجراء خاص بتذاكر البيع فقط",
    "err_cannot_start_maintenance": "لا يمكن بدء الصيانة على تذكرة بالحالة",
    "err_no_reservations": "لا توجد حجوزات مخزون لهذه التذكرة",
    "err_items_required_maintenance": "القطع مطلوبة لإكمال الصيانة",
    "err_invalid_direction": "الاتجاه غير صحيح. يجب أن يكون 'SEND' أو 'RECEIVE'",
    "err_tracking_required_ready": "رقم التتبع مطلوب لوضع التذكرة جاهزة للإرسال",
    "err_reservation_not_found": "الحجز غير موجود",
    "err_reservation_actioned": "تم تنفيذ هذا الحجز بالفعل",
    "err_return_condition_invalid": "حالة الإرجاع غير صحيحة",
    "err_condition_must_be_valid_damaged": "الحالة يجب أن تكون 'valid' أو 'damaged'",
    "err_only_cancelled_tickets_deletable": "لا يمكن حذف التذكرة. يجب أن تكون التذكرة ملغاة أولاً",
    "err_failed_delete_ticket": "فشل حذف التذكرة",

    # Default notes
    "note_confirmed_reserved": "تم تأكيد التذكرة وحجز المخزون",
    "note_maintenance_confirmed": "تم تأكيد تذكرة الصيانة",
    "note_return_confirmed": "تم تأكيد تذكرة الإرجاع",
    "note_delivered": "تم تسليم المنتج للعميل",
    "note_maintenance_started": "بدأت الصيانة",
    "note_return_received": "تم استلام المرتجع برقم التتبع",
    "note_validation_processed": "تم التحقق من المنتجات ومعالجتها",
    "note_dispatched": "وحدات تم إرسالها",
    "note_condition_not_specified": "حالة غير محددة",
    "note_units_dispatched": "وحدات تم إرسالها",
    "note_validated_good": "وحدات تم التحقق منها كسليمة",
    "note_marked_damaged": "وحدات تم وضع علامة عليها كتالفة",
    "note_condition_unspecified": "حالة غير محددة",
    "note_return_received_tracking": "تم استلام المرتجع برقم التتبع",
    "note_refers_to_reservation": "يشير إلى الحجز",
    "note_dispatched_to": "تم الإرسال إلى",
    "note_sku_fallback": "SKU",
    
    # Error fallbacks
    "err_failed_cancel": "فشل إلغاء التذكرة",
    "err_invalid_date_format": "تنسيق التاريخ غير صحيح. استخدم YYYY-MM-DD",
}

def get_message(key: str, default: str = None) -> str:
    """Get a message by key."""
    return MESSAGES.get(key, default or key)

def get_error_message(key: str, details: str = None) -> str:
    """Get an error message with optional details."""
    message = MESSAGES.get(key, key)
    if details:
        return f"{message}: {details}"
    return message

