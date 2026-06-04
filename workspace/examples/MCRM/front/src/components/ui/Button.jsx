/**
 * Button component with various variants and sizes
 */
const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    disabled = false,
    onClick,
    className = '',
    type = 'button',
    ...props
}) => {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variantClasses = {
        primary: 'bg-brand-red-600 text-white hover:bg-brand-red-700 focus:ring-brand-red-500',
        secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
        ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
        success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
    };

    // Responsive sizing with touch-friendly targets
    const sizeClasses = {
        sm: 'px-3 sm:px-3.5 py-2 sm:py-1.5 text-sm min-h-[44px] sm:min-h-[36px]',
        md: 'px-4 sm:px-5 py-2.5 sm:py-2 text-sm sm:text-base min-h-[44px]',
        lg: 'px-5 sm:px-6 py-3 sm:py-3 text-base sm:text-lg min-h-[48px] sm:min-h-[44px]'
    };

    const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} touch-manipulation active:scale-95 ${className}`;

    return (
        <button
            type={type}
            className={classes}
            disabled={disabled}
            onClick={onClick}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
