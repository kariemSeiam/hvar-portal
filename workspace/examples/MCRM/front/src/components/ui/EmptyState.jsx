import { cloneElement } from 'react';

const EmptyState = ({
    icon,
    title,
    description,
    action,
    className = "",
    size = "default", // "small", "default", "large", "medium"
    variant = "default" // "default", "minimal", "creative"
}) => {
    const sizeClasses = {
        small: {
            container: 'w-16 h-16',
            icon: 'w-8 h-8',
            title: 'text-base',
            description: 'text-sm',
            spacing: 'py-8'
        },
        default: {
            container: 'w-20 h-20',
            icon: 'w-10 h-10',
            title: 'text-lg',
            description: 'text-base',
            spacing: 'py-12'
        },
        medium: {
            container: 'w-24 h-24',
            icon: 'w-12 h-12',
            title: 'text-xl',
            description: 'text-lg',
            spacing: 'py-16'
        },
        large: {
            container: 'w-28 h-28',
            icon: 'w-14 h-14',
            title: 'text-2xl',
            description: 'text-xl',
            spacing: 'py-20'
        }
    };

    const variantClasses = {
        default: {
            container: 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900',
            icon: 'text-gray-400 dark:text-gray-500',
            title: 'text-gray-700 dark:text-gray-200',
            description: 'text-gray-500 dark:text-gray-400'
        },
        minimal: {
            container: 'bg-transparent',
            icon: 'text-gray-300 dark:text-gray-600',
            title: 'text-gray-600 dark:text-gray-300',
            description: 'text-gray-400 dark:text-gray-500'
        },
        creative: {
            container: 'bg-gradient-to-br from-brand-blue-50 via-accent-purple-50 to-accent-purple-50 dark:from-brand-blue-900/30 dark:via-accent-purple-900/20 dark:to-accent-purple-900/30 border border-brand-blue-200/50 dark:border-brand-blue-700/30 shadow-lg shadow-brand-blue-100/50 dark:shadow-brand-blue-900/20',
            icon: 'text-brand-blue-500 dark:text-brand-blue-400',
            title: 'text-gray-800 dark:text-gray-100',
            description: 'text-gray-600 dark:text-gray-300'
        },
        elegant: {
            container: 'bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 dark:from-slate-800/50 dark:via-gray-800/30 dark:to-zinc-800/50 border border-slate-200/60 dark:border-slate-700/40 shadow-xl shadow-slate-200/40 dark:shadow-slate-900/30',
            icon: 'text-slate-500 dark:text-slate-400',
            title: 'text-gray-800 dark:text-gray-100',
            description: 'text-gray-600 dark:text-gray-300'
        },
        vibrant: {
            container: 'bg-gradient-to-br from-accent-green-50 via-accent-green-50 to-accent-green-50 dark:from-accent-green-900/30 dark:via-accent-green-900/20 dark:to-accent-green-900/30 border border-accent-green-200/50 dark:border-accent-green-700/30 shadow-lg shadow-accent-green-100/50 dark:shadow-accent-green-900/20',
            icon: 'text-accent-green-500 dark:text-accent-green-400',
            title: 'text-gray-800 dark:text-gray-100',
            description: 'text-gray-600 dark:text-gray-300'
        },
        warm: {
            container: 'bg-gradient-to-br from-accent-amber-50 via-accent-amber-50 to-brand-red-50 dark:from-accent-amber-900/30 dark:via-accent-amber-900/20 dark:to-brand-red-900/30 border border-accent-amber-200/50 dark:border-accent-amber-700/30 shadow-lg shadow-accent-amber-100/50 dark:shadow-accent-amber-900/20',
            icon: 'text-accent-amber-500 dark:text-accent-amber-400',
            title: 'text-gray-800 dark:text-gray-100',
            description: 'text-gray-600 dark:text-gray-300'
        },
        cool: {
            container: 'bg-gradient-to-br from-brand-blue-50 via-brand-blue-50 to-brand-blue-50 dark:from-brand-blue-900/30 dark:via-brand-blue-900/20 dark:to-brand-blue-900/30 border border-brand-blue-200/50 dark:border-brand-blue-700/30 shadow-lg shadow-brand-blue-100/50 dark:shadow-brand-blue-900/20',
            icon: 'text-brand-blue-500 dark:text-brand-blue-400',
            title: 'text-gray-800 dark:text-gray-100',
            description: 'text-gray-600 dark:text-gray-300'
        },
        purple: {
            container: 'bg-gradient-to-br from-accent-purple-50 via-accent-purple-50 to-accent-purple-50 dark:from-accent-purple-900/30 dark:via-accent-purple-900/20 dark:to-accent-purple-900/30 border border-accent-purple-200/50 dark:border-accent-purple-700/30 shadow-lg shadow-accent-purple-100/50 dark:shadow-accent-purple-900/20',
            icon: 'text-accent-purple-500 dark:text-accent-purple-400',
            title: 'text-gray-800 dark:text-gray-100',
            description: 'text-gray-600 dark:text-gray-300'
        }
    };

    // Ensure size is valid and fallback to default if not
    const validSize = sizeClasses[size] ? size : 'default';
    const validVariant = variantClasses[variant] ? variant : 'default';
    const classes = sizeClasses[validSize];
    const variantStyles = variantClasses[validVariant];

    // Ensure all required props are present
    if (!icon || !title) {
        console.warn('EmptyState: Missing required props (icon or title)');
        return null;
    }

    return (
        <div
            className={`text-center ${classes.spacing} ${className}`}
            role="status"
            aria-live="polite"
            aria-atomic="true"
        >
            <div
                className={`${classes.container} ${variantStyles.container} ${variantStyles.icon} rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm transition-transform hover:scale-105 duration-300`}
                aria-hidden="true"
            >
                {cloneElement(icon, {
                    // Force the icon to use the exact size defined in classes.icon and strip any inline sizing props
                    className: `${classes.icon} transition-all duration-300 drop-shadow-md`,
                    width: undefined, // Strip internal SVG width
                    height: undefined // Strip internal SVG height
                })}
            </div>
            <h3 className={`font-semibold ${variantStyles.title} mb-2 font-cairo ${classes.title}`}>
                {title}
            </h3>
            {description && (
                <p className={`${variantStyles.description} font-cairo ${classes.description} max-w-md mx-auto leading-relaxed`}>
                    {description}
                </p>
            )}
            {action && (
                <div className="mt-6">
                    <button
                        onClick={action.onClick}
                        disabled={action.loading}
                        aria-label={action.label || 'تنفيذ الإجراء'}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-brand-red-600 hover:bg-brand-red-700 disabled:bg-brand-red-400 disabled:opacity-50 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-red-500 focus:ring-offset-2 font-cairo"
                    >
                        {action.loading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                جاري التحميل...
                            </>
                        ) : (
                            action.label
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};

export default EmptyState;
