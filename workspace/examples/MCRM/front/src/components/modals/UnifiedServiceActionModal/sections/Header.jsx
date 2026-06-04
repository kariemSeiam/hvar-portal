
/** Modal header: icon, title, subtitle, workflow badges, autofill, close. */
function Header({ config, isWorkflowAction, existingServiceAction, customerData, selectedOrder, onAutoFill, onClose, isSubmitting }) {
    return (
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2 space-x-reverse">
                <div className={`w-10 h-10 bg-gradient-to-r ${config.color} rounded-lg flex items-center justify-center shadow-md`}>
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={config.icon} /></svg>
                </div>
                <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 font-cairo">{config.title}</h2>
                    <p className="text-xs text-gray-600 dark:text-gray-400 font-cairo">{config.subtitle}</p>
                    {isWorkflowAction && existingServiceAction && (
                        <div className="flex items-center space-x-2 space-x-reverse mt-1">
                            <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded font-cairo">حالة: {existingServiceAction.status}</span>
                            <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded font-cairo">رقم التتبع: {existingServiceAction.original_tracking_number}</span>
                        </div>
                    )}
                </div>
                {(customerData || selectedOrder || existingServiceAction) && !isWorkflowAction && (
                    <button type="button" onClick={onAutoFill} disabled={isSubmitting} className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors font-cairo" title="ملء البيانات تلقائياً">
                        <div className="flex items-center space-x-1 space-x-reverse">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        </div>
                    </button>
                )}
            </div>
            <button onClick={onClose} disabled={isSubmitting} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>
    );
}

export default Header;
