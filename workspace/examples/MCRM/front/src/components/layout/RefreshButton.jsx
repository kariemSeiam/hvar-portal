
const RefreshButton = ({
    onRefresh,
    isLoading = false,
    disabled = false,
    className = "",
    size = "default" // "small", "default", "large"
}) => {
    const sizeClasses = {
        small: 'px-3 sm:px-2.5 py-2 sm:py-1.5 text-xs min-h-[44px] sm:min-h-[36px]',
        default: 'px-3 sm:px-3 py-2.5 sm:py-2 text-sm min-h-[44px] sm:min-h-[40px]',
        large: 'px-4 sm:px-4 py-3 sm:py-2.5 text-base min-h-[48px] sm:min-h-[44px]'
    };

    const iconSizes = {
        small: 'w-4 h-4 sm:w-3.5 sm:h-3.5',
        default: 'w-5 h-5 sm:w-4 sm:h-4',
        large: 'w-6 h-6 sm:w-5 sm:h-5'
    };

    const baseClasses = 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-cairo font-medium transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation active:scale-95 flex items-center justify-center';

    return (
        <button
            onClick={onRefresh}
            disabled={disabled || isLoading}
            className={`${baseClasses} ${sizeClasses[size]} ${className}`}
            aria-label="تحديث"
        >
            <svg className={`${iconSizes[size]} ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
        </button>
    );
};

export default RefreshButton;
