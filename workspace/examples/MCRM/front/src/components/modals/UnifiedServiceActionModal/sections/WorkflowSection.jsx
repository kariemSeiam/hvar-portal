import { memo } from 'react';

/** Workflow-specific fields (pending_send_confirmation, scan_send). */
function WorkflowSection({ workflowAction, formData, onInputChange, existingServiceAction }) {
    if (workflowAction === 'pending_send_confirmation') {
        return (
            <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 font-cairo">تأكيد الإرسال المعلق</h3>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200 font-cairo mb-2">تأكيد أن العناصر جاهزة للإرسال للعميل برقم التتبع الجديد</p>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 font-cairo">رقم التتبع <span className="text-red-500">*</span></label>
                        <input type="text" value={formData.tracking_number} onChange={(e) => onInputChange('tracking_number', e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-right font-cairo bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-brand-red-500 focus:border-brand-blue-500" dir="rtl" placeholder="أدخل رقم التتبع الجديد" />
                        {existingServiceAction?.new_tracking_number && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-cairo">رقم التتبع الجديد المؤكد: {existingServiceAction.new_tracking_number}</p>}
                    </div>
                </div>
            </div>
        );
    }
    if (workflowAction === 'scan_send') {
        return (
            <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 font-cairo">مسح الإرسال</h3>
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                    <p className="text-sm text-green-800 dark:text-green-200 font-cairo mb-3">تأكيد إرسال العناصر فعلياً للعميل</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 font-cairo">الماسح <span className="text-red-500">*</span></label>
                            <input type="text" value={formData.scanned_by} onChange={(e) => onInputChange('scanned_by', e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-right font-cairo bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-brand-red-500 focus:border-brand-blue-500" dir="rtl" placeholder="اسم الماسح" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 font-cairo">موقع المسح</label>
                            <input type="text" value={formData.scan_location} onChange={(e) => onInputChange('scan_location', e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-right font-cairo bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-brand-red-500 focus:border-brand-blue-500" dir="rtl" placeholder="موقع المسح" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    return null;
}

export default memo(WorkflowSection);
