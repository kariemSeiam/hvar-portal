
/**
 * Simple Reason Input Component
 * A basic input field for entering reasons, matching the standard input pattern
 */
const ReasonChipSelector = ({
    value = '',
    onChange,
    placeholder = 'أدخل سبب الإجراء...',
    disabled = false,
    className = '',
    label = 'سبب الإجراء',
    required = false,
    error = '',
    ...props
}) => {
    return (
        <div className={`w-full ${className}`}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-cairo">
                    {label}
                    {required && <span className="text-red-500 mr-1">*</span>}
                </label>
            )}
            <input
                type="text"
                value={value}
                onChange={(e) => onChange?.(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                required={required}
                className={`
                    w-full px-3 py-2 text-sm font-cairo text-right
                    border border-gray-300 dark:border-gray-600
                    rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-brand-blue-500
                    bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                    disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed
                    transition-colors duration-200
                    ${error ? 'border-red-500 focus:ring-red-500' : ''}
                `}
                dir="rtl"
                {...props}
            />
            {error && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400 font-cairo">{error}</p>
            )}
        </div>
    );
};

export default ReasonChipSelector;
