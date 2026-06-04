import { useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * ServiceModalWrapper - Reusable wrapper component for service modals
 * Provides consistent modal backdrop and container styling
 */
const ServiceModalWrapper = ({ 
    isOpen, 
    onClose, 
    maxWidth = 'max-w-2xl',
    maxHeight = 'max-h-[90vh]',
    overflow = 'overflow-y-auto',
    children 
}) => {
    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            // Save current scroll position
            const scrollY = window.scrollY;
            // Lock body scroll
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollY}px`;
            document.body.style.width = '100%';
            document.body.style.overflow = 'hidden';
            
            return () => {
                // Restore body scroll when modal closes
                document.body.style.position = '';
                document.body.style.top = '';
                document.body.style.width = '';
                document.body.style.overflow = '';
                window.scrollTo(0, scrollY);
            };
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-3 md:p-4 lg:p-5"
            style={{ 
                top: 0, 
                left: 0, 
                right: 0, 
                bottom: 0,
                margin: 0,
                overflow: 'hidden' // Prevent backdrop from scrolling
            }}
            onClick={onClose}
        >
            <div
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-2xl ${maxWidth} w-full ${maxHeight} flex flex-col overflow-hidden`}
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    );
};

ServiceModalWrapper.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    maxWidth: PropTypes.string,
    maxHeight: PropTypes.string,
    overflow: PropTypes.string,
    children: PropTypes.node.isRequired
};

export default ServiceModalWrapper;

