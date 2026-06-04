import { memo } from 'react';

/** Customer info fields (creation mode only). */
function CustomerSection({ formData, onInputChange }) {
    return (
        <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 font-cairo">معلومات العميل</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 font-cairo">اسم العميل <span className="text-red-500">*</span></label>
                    <input type="text" value={formData.customer_full_name} onChange={(e) => onInputChange('customer_full_name', e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-right font-cairo bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-brand-red-500 focus:border-brand-blue-500" dir="rtl" placeholder="أدخل اسم العميل الكامل" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 font-cairo">رقم هاتف العميل <span className="text-red-500">*</span></label>
                    <input type="tel" value={formData.customer_phone} onChange={(e) => onInputChange('customer_phone', e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-right font-cairo bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-brand-red-500 focus:border-brand-blue-500" required dir="rtl" placeholder="أدخل رقم الهاتف" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 font-cairo">رقم التتبع الأصلي (اختياري)</label>
                    <input type="text" value={formData.original_tracking_number} onChange={(e) => onInputChange('original_tracking_number', e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-right font-cairo bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-brand-red-500 focus:border-brand-blue-500" dir="rtl" placeholder="أدخل رقم التتبع الأصلي" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 font-cairo">رقم هاتف إضافي (اختياري)</label>
                    <input type="tel" value={formData.customer_phone_secondary} onChange={(e) => onInputChange('customer_phone_secondary', e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-right font-cairo bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-brand-red-500 focus:border-brand-blue-500" dir="rtl" placeholder="رقم هاتف بديل للتواصل" />
                </div>
            </div>
        </div>
    );
}

export default memo(CustomerSection);
