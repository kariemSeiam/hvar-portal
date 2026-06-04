const StatusIndicator = ({
    status,
    statusConfig,
    className = ""
}) => {
    const getStatusColor = (status) => {
        const colors = {
            'initializing': 'bg-yellow-500 animate-pulse',
            'processing': 'bg-blue-500 animate-pulse',
            'scanning': 'bg-green-500',
            'active': 'bg-green-500',
            'loading': 'bg-yellow-500 animate-pulse',
            'error': 'bg-red-500',
            'stopped': 'bg-gray-400',
            'idle': 'bg-gray-400'
        };
        return colors[status] || colors.idle;
    };

    const getStatusText = (status) => {
        const texts = {
            'initializing': 'جاري التشغيل...',
            'processing': 'جاري المعالجة...',
            'scanning': 'نشط',
            'active': 'نشط',
            'loading': 'جاري التحميل...',
            'error': 'خطأ',
            'stopped': 'متوقف',
            'idle': 'جاهز'
        };
        return texts[status] || texts.idle;
    };

    return (
        <div className={`flex items-center space-x-2 space-x-reverse ${className}`}>
            <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${getStatusColor(status)}`}></div>
            <span className="text-xs text-gray-600 dark:text-gray-300 font-cairo">
                {statusConfig?.customText || getStatusText(status)}
            </span>
        </div>
    );
};

export default StatusIndicator;
