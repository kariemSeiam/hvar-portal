/** Modal footer: cancel and submit. */
function Footer({ config, isWorkflowAction, workflowAction, onClose, isSubmitting }) {
    return (
        <div className="flex items-center justify-end space-x-2 space-x-reverse pt-4 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-cairo">إلغاء</button>
            <button type="submit" disabled={isSubmitting} className={`px-4 py-1.5 text-xs bg-gradient-to-r ${config.color} text-white rounded-md hover:opacity-90 disabled:bg-gray-400 transition-colors font-cairo`}>
                {isSubmitting ? (isWorkflowAction ? 'جاري التنفيذ...' : 'جاري الإنشاء...') : (isWorkflowAction ? (workflowAction === 'pending_send_confirmation' ? 'تأكيد الإرسال المعلق' : workflowAction === 'scan_send' ? 'إرسال' : workflowAction) : `إنشاء إجراء ${config.title}`)}
            </button>
        </div>
    );
}

export default Footer;
