import PropTypes from 'prop-types';

/**
 * TicketInfoCard - Reusable component for displaying ticket information
 * Shows customer name, tracking number, and optional ticket number
 */
const TicketInfoCard = ({ 
    customerName, 
    trackingNumber, 
    ticketNumber 
}) => {
    return (
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
            {ticketNumber && (
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-600 dark:text-gray-400 font-cairo">رقم التذكرة:</span>
                    <span className="text-sm font-mono font-semibold text-gray-900 dark:text-gray-100">{ticketNumber}</span>
                </div>
            )}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2 space-x-reverse">
                    <span className="text-xs text-gray-600 dark:text-gray-400 font-cairo">العميل:</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 font-cairo">{customerName}</span>
                </div>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 font-cairo">
                تتبع: <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">{trackingNumber}</span>
            </div>
        </div>
    );
};

TicketInfoCard.propTypes = {
    customerName: PropTypes.string.isRequired,
    trackingNumber: PropTypes.string.isRequired,
    ticketNumber: PropTypes.string
};

export default TicketInfoCard;

