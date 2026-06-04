/**
 * Select Component
 * A customizable select dropdown component with consistent styling
 */
const Select = ({
    value,
    onChange,
    placeholder = 'اختر خياراً',
    className = '',
    disabled = false,
    required = false,
    error = '',
    label = '',
    children,
    ...props
}) => {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {label}
                    {required && <span className="text-red-500 mr-1">*</span>}
                </label>
            )}
            <select
                value={value}
                onChange={onChange}
                disabled={disabled}
                required={required}
                className={`
                    w-full px-3 sm:px-4 py-2.5 sm:py-2 text-sm sm:text-base
                    min-h-[44px] sm:min-h-[40px]
                    border border-gray-300 dark:border-gray-600
                    rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-brand-blue-500
                    bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                    disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed
                    transition-colors duration-200
                    touch-manipulation
                    ${error ? 'border-red-500 focus:ring-red-500' : ''}
                    ${className}
                `}
                {...props}
            >
                {placeholder && (
                    <option value="" disabled>
                        {placeholder}
                    </option>
                )}
                {children}
            </select>
            {error && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
        </div>
    );
};

export default Select;
