/**
 * LoadingSpinner component with different sizes
 */
const LoadingSpinner = ({
    size = 'md',
    className = '',
    color = 'blue'
}) => {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8',
        xl: 'w-12 h-12'
    };

    const colorClasses = {
        blue: 'text-blue-600',
        gray: 'text-gray-600',
        white: 'text-white',
        green: 'text-green-600',
        red: 'text-red-600'
    };

    return (
        <div className={`inline-block animate-spin rounded-full border-2 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite] ${sizeClasses[size]} ${colorClasses[color]} ${className}`}>
            <span className="sr-only">جاري التحميل...</span>
        </div>
    );
};

export default LoadingSpinner;
