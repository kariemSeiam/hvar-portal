import React, { useEffect } from 'react';

/**
 * Modal component with backdrop and close functionality
 */
const Modal = ({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    className = ''
}) => {
    // Handle escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    // Responsive modal sizes
    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl'
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={onClose}
            />

            {/* Modal - Mobile optimized */}
            <div className="flex min-h-full items-end sm:items-center justify-center p-2 sm:p-3 md:p-4">
                <div className={`relative bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-xl shadow-2xl w-full max-h-[90vh] sm:max-h-[85vh] overflow-y-auto ${sizeClasses[size]} ${className}`}>
                    {/* Header - Mobile optimized */}
                    {title && (
                        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 sm:px-5 sm:py-3.5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
                            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 flex-1 min-w-0 truncate pr-2 font-cairo">
                                {title}
                            </h3>
                            <button
                                onClick={onClose}
                                className="flex-shrink-0 min-w-[44px] min-h-[44px] w-7 h-7 sm:w-7 sm:h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 touch-manipulation"
                                aria-label="إغلاق"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    )}

                    {/* Content - Mobile safe padding */}
                    <div className="p-4 sm:p-5 pb-safe">
                        <div dir="rtl">
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Modal;
