import { memo, useState } from 'react';
import { ArrowUpFromLine, ArrowDownToLine, Edit, Lock, Plus, Minus, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getMovementTypeLabel, formatMovementDate, formatRelativeTime } from '../../utils/stock/utils';

/**
 * MovementTableRow Component - HVAR Design System
 * 
 * Displays a single stock movement row in the movements table.
 * WCAG 2.1 AA compliant with keyboard navigation and accessibility.
 * 
 * @param {Object} movement - Movement data object
 */
const MovementTableRow = memo(({ movement }) => {
    const navigate = useNavigate();
    const [isNotesExpanded, setIsNotesExpanded] = useState(false);
    const MAX_NOTES_LENGTH = 80;
    const notesText = movement.notes || '';
    const shouldTruncate = notesText.length > MAX_NOTES_LENGTH;
    const displayedNotes = isNotesExpanded || !shouldTruncate
        ? notesText
        : notesText.substring(0, MAX_NOTES_LENGTH) + '...';

    // Icon mapping function - maps movement type directly to icon components
    const getMovementIconComponent = (movementType) => {
        const iconMap = {
            'SEND': () => <ArrowUpFromLine className="w-4 h-4 text-brand-red-600 dark:text-brand-red-400" aria-hidden="true" />,
            'RECEIVE': () => <ArrowDownToLine className="w-4 h-4 text-accent-green-600 dark:text-accent-green-400" aria-hidden="true" />,
            'MANUAL': () => <Edit className="w-4 h-4 text-accent-amber-600 dark:text-accent-amber-400" aria-hidden="true" />,
            'RESERVE': () => <Lock className="w-4 h-4 text-brand-blue-600 dark:text-brand-blue-400" aria-hidden="true" />,
        };

        const IconComponent = iconMap[movementType];
        return IconComponent ? <IconComponent /> : <Activity className="w-4 h-4 text-gray-600 dark:text-gray-400" aria-hidden="true" />;
    };

    const handleNavigateToTicket = () => {
        navigate(`/?serviceId=${movement.reference_id}`);
        toast.loading('جاري الانتقال إلى طلب الخدمة...', { id: `nav-${movement.reference_id}` });
    };

    return (
        <tr className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150">
            {/* Movement Type */}
            <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3">
                <div className="flex items-center gap-x-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${movement.movement_type === 'SEND' ? 'bg-brand-red-100 dark:bg-brand-red-900/30' :
                        movement.movement_type === 'RECEIVE' ? 'bg-accent-green-100 dark:bg-accent-green-900/30' :
                            movement.movement_type === 'MANUAL' ? 'bg-accent-amber-100 dark:bg-accent-amber-900/30' :
                                movement.movement_type === 'RESERVE' ? 'bg-brand-blue-100 dark:bg-brand-blue-900/30' :
                                    'bg-gray-100 dark:bg-gray-700'
                        }`}
                        aria-hidden="true"
                    >
                        {getMovementIconComponent(movement.movement_type)}
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 font-cairo">
                        {getMovementTypeLabel(movement.movement_type)}
                    </span>
                </div>
            </td>

            {/* Item */}
            <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3">
                <div className="flex flex-col space-y-1">
                    <div className="flex items-center space-x-1 sm:space-x-2 space-x-reverse">
                        <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 font-cairo truncate">
                            {movement.item_name}
                        </span>
                        <span className={`text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${movement.item_type === 'product'
                            ? 'bg-brand-blue-100 text-brand-blue-700 dark:bg-brand-blue-900/30 dark:text-brand-blue-200'
                            : 'bg-accent-purple-100 text-accent-purple-700 dark:bg-accent-purple-900/30 dark:text-accent-purple-200'
                            }`}
                            aria-label={movement.item_type === 'product' ? 'منتج' : 'قطعة'}
                        >
                            {movement.item_type === 'product' ? 'منتج' : 'قطعة'}
                        </span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-cairo truncate">
                        {movement.sku}
                    </span>
                </div>
            </td>

            {/* Quantity */}
            <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-center">
                <div className="flex items-center justify-center space-x-1 space-x-reverse">
                    {movement.movement_type === 'RESERVE' ? (
                        <Lock className="w-3 h-3 text-accent-amber-600 dark:text-accent-amber-400" aria-hidden="true" />
                    ) : movement.quantity > 0 ? (
                        <Plus className="w-3 h-3 text-accent-green-600 dark:text-accent-green-400" aria-hidden="true" />
                    ) : movement.quantity < 0 ? (
                        <Minus className="w-3 h-3 text-brand-red-600 dark:text-brand-red-400" aria-hidden="true" />
                    ) : (
                        <Activity className="w-3 h-3 text-gray-500 dark:text-gray-400" aria-hidden="true" />
                    )}
                    <span className={`text-sm font-bold ${movement.movement_type === 'RESERVE'
                        ? 'text-accent-amber-600 dark:text-accent-amber-400'
                        : movement.quantity > 0
                            ? 'text-accent-green-600 dark:text-accent-green-400'
                            : movement.quantity < 0
                                ? 'text-brand-red-600 dark:text-brand-red-400'
                                : 'text-gray-500 dark:text-gray-400'
                        }`}
                        aria-label={`الكمية: ${Math.abs(movement.quantity)}`}
                    >
                        {Math.abs(movement.quantity)}
                    </span>
                </div>
            </td>

            {/* Condition */}
            <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-center">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${movement.movement_type === 'RESERVE'
                    ? 'bg-accent-amber-100 text-accent-amber-700 dark:bg-accent-amber-900/30 dark:text-accent-amber-300'
                    : movement.condition === 'damaged'
                        ? 'bg-ui-danger-100 text-ui-danger-700 dark:bg-ui-danger-900/30 dark:text-ui-danger-300'
                        : 'bg-accent-green-100 text-accent-green-700 dark:bg-accent-green-900/30 dark:text-accent-green-300'
                    }`}
                    role="status"
                    aria-label={movement.movement_type === 'RESERVE' ? 'حجز' : (movement.condition === 'damaged' ? 'تالف' : 'سليم')}
                >
                    {movement.movement_type === 'RESERVE' ? 'حجز' : (movement.condition === 'damaged' ? 'تالف' : 'سليم')}
                </span>
            </td>

            {/* Reference */}
            <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-center">
                <div className="flex items-center justify-center flex-wrap gap-1">
                    {movement.reference_type === 'service_ticket' && movement.reference_id && (
                        <button
                            onClick={handleNavigateToTicket}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    handleNavigateToTicket();
                                }
                            }}
                            className="text-xs bg-accent-purple-100 text-accent-purple-800 dark:bg-accent-purple-900/30 dark:text-accent-purple-200 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded font-medium cursor-pointer hover:bg-accent-purple-200 dark:hover:bg-accent-purple-800/50 hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-red-500 focus:ring-offset-2"
                            aria-label={`الانتقال إلى طلب الخدمة رقم ${movement.reference_id}`}
                        >
                            #{movement.reference_id}
                        </button>
                    )}
                    {movement.reference_type === 'manual_adjustment' && (
                        <span 
                            className="text-xs bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded font-medium"
                            role="status"
                            aria-label="تعديل يدوي"
                        >
                            تعديل
                        </span>
                    )}
                </div>
            </td>

            {/* Date */}
            <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-center">
                <div className="flex flex-col items-center">
                    <div className="flex items-center justify-center space-x-1 space-x-reverse whitespace-nowrap">
                        <time 
                            className="text-sm text-gray-900 dark:text-gray-100 font-cairo"
                            dateTime={movement.created_at}
                        >
                            {formatMovementDate(movement.created_at)}
                        </time>
                    </div>
                    <span className="text-xs text-accent-green-600 dark:text-accent-green-400 font-cairo font-medium mt-1">
                        {formatRelativeTime(movement.created_at)}
                    </span>
                </div>
            </td>

            {/* Notes */}
            <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3">
                {movement.notes && (
                    <div className="text-xs text-gray-600 dark:text-gray-400 font-cairo bg-gray-50 dark:bg-gray-700 p-1.5 sm:p-2 rounded max-w-xs">
                        <div className="whitespace-pre-wrap break-words">
                            {displayedNotes}
                        </div>
                        {shouldTruncate && (
                            <button
                                onClick={() => setIsNotesExpanded(!isNotesExpanded)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        setIsNotesExpanded(!isNotesExpanded);
                                    }
                                }}
                                className="mt-1.5 text-xs font-medium text-brand-blue-600 dark:text-brand-blue-400 hover:text-brand-blue-700 dark:hover:text-brand-blue-300 transition-colors duration-200 font-cairo focus:outline-none focus:ring-2 focus:ring-brand-red-500 focus:ring-offset-2 rounded"
                                aria-label={isNotesExpanded ? 'عرض أقل' : 'عرض المزيد'}
                                aria-expanded={isNotesExpanded}
                            >
                                {isNotesExpanded ? 'عرض أقل' : 'عرض المزيد'}
                            </button>
                        )}
                    </div>
                )}
            </td>
        </tr>
    );
});

MovementTableRow.displayName = 'MovementTableRow';

export default MovementTableRow;

