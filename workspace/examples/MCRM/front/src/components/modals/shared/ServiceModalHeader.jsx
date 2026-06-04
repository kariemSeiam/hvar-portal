import PropTypes from 'prop-types';
import { X, Calendar, Copy } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatServiceType, formatPriority, getServiceStatusLabel, getServiceStatusBadgeColor } from '../../../utils/service/utils';
import { parseHVticketNumber, HV_TYPE_LETTER_LABEL_AR } from '../../../utils/service/ticketNumberFormat';
import { getServiceTypeLabelAr, normalizeServiceTypeOrFallback } from '../../../constants/serviceTypes.js';
import { getServiceTypeHeaderIconClass, SERVICE_TYPE_TITLE_TEXT_CLASS } from '../../../constants/serviceTypeUi.js';
import { ServiceStatusBadge } from '../../ui';

/**
 * ServiceModalHeader - Enhanced header component with badges, date, and status-based styling
 * Provides consistent header styling across all service modals with creative design
 */
const ServiceModalHeader = ({ 
    title, 
    subtitle, 
    icon: Icon, 
    iconColor = 'from-blue-500 to-blue-600',
    iconBgColor, // Optional: e.g. 'bg-brand-blue-600' for schedule modal
    onClose, 
    isSubmitting = false,
    sticky = false,
    ticket = null, // Optional ticket data for badges and date
    /** When true with ticket: first line = subtitle (نوع الخدمة) — title (e.g. تأكيد التذكرة); subtitle is not repeated below */
    subtitleAsServiceTypeLabel = false
}) => {
    // Normalize status to lowercase for consistent matching
    const normalizedStatus = ticket?.status?.toLowerCase() || '';

    // Get status-based border color
    const getStatusBorderColor = (status) => {
        const statusColors = {
            'pending': 'border-gray-400',
            'confirmed': 'border-blue-500',
            'in_process': 'border-purple-500',
            'in-process': 'border-purple-500',
            'ready_for_dispatch': 'border-amber-500',
            'ready-for-dispatch': 'border-amber-500',
            'sent': 'border-indigo-500',
            'delivered': 'border-green-500',
            'completed': 'border-emerald-500',
            'cancelled': 'border-red-500',
            'returned': 'border-pink-500',
        };
        return statusColors[status] || 'border-gray-400';
    };

    // Note: Status badge color now handled by ServiceStatusBadge component using centralized getServiceStatusBadgeColor

    // Get priority badge color
    const getPriorityBadgeColor = (priority) => {
        if (priority === 'high') return 'from-brand-red-600 to-brand-red-700';
        if (priority === 'medium') return 'from-amber-500 to-orange-500';
        return 'from-green-500 to-emerald-600';
    };

    // Get icon color based on priority (not status or service type)
    const getPriorityIconColor = (priority) => {
        if (priority === 'high') return 'from-brand-red-600 to-brand-red-700';
        if (priority === 'medium') return 'from-amber-500 to-orange-500';
        return 'from-green-500 to-emerald-600'; // low or normal
    };

    const statusBorder = ticket ? getStatusBorderColor(normalizedStatus) : 'border-gray-400';
    const iconColorBasedOnPriority = ticket ? getPriorityIconColor(ticket.priority) : iconColor;
    const serviceTypeIconStyle = ticket ? getServiceTypeHeaderIconClass(ticket.service_type) : null;
    const ticketNumberRaw =
        ticket?.ticket_number !== undefined && ticket?.ticket_number !== null
            ? String(ticket.ticket_number).trim()
            : '';
    const hvDisplay = ticketNumberRaw ? parseHVticketNumber(ticketNumberRaw) : null;
    const copyTicketRef = hvDisplay?.full || ticketNumberRaw || '';

    const handleCopyTicketNumber = () => {
        if (!copyTicketRef) return;
        navigator.clipboard.writeText(copyTicketRef).then(() => {
            toast.success('تم نسخ رقم التذكرة');
        }).catch(() => {
            toast.error('فشل النسخ');
        });
    };

    const serviceLabelPaired =
        subtitleAsServiceTypeLabel && ticket
            ? (subtitle?.trim() ||
                  getServiceTypeLabelAr(ticket.service_type || ticket.action_type, { short: false })) ||
              ''
            : '';
    const showPairedServiceTitle =
        Boolean(subtitleAsServiceTypeLabel && ticket && serviceLabelPaired && serviceLabelPaired !== '—');

    const pairedServiceTypeTextClass = ticket
        ? SERVICE_TYPE_TITLE_TEXT_CLASS[
              normalizeServiceTypeOrFallback(ticket.service_type || ticket.action_type)
          ] ?? 'text-gray-900 dark:text-gray-100'
        : 'text-gray-900 dark:text-gray-100';

    return (
        <div className={`relative flex flex-col px-3 py-2 sm:px-4 sm:py-2.5 flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 ${sticky ? 'sticky top-0 z-10' : ''}`}>
            {/* Top Row: Icon, Title, Date, Status, Close */}
            <div className="flex items-center justify-between gap-2 sm:gap-3">
                <div className="flex items-center gap-2 sm:gap-2.5 space-x-reverse flex-1 min-w-0">
                    {/* Icon with Tooltip */}
                    {ticket ? (
                        <div className="relative group flex-shrink-0">
                            <div
                                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center shadow-sm border border-white/20 dark:border-gray-700 ${
                                    serviceTypeIconStyle || `bg-brand-red-600 text-white`
                                }`}
                            >
                                <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-current" />
                            </div>
                            {/* Tooltip - Shows on Hover with Service Type, Priority, and Status */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                <div className="font-cairo text-center space-y-1">
                                    <div className="font-bold">{formatServiceType(ticket.service_type)}</div>
                                    <div className="text-gray-300">{formatPriority(ticket.priority)}</div>
                                    <div className="text-gray-400 text-[10px]">{getServiceStatusLabel(ticket.status)}</div>
                                </div>
                                {/* Tooltip Arrow */}
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                                    <div className="w-2 h-2 bg-gray-900 dark:bg-gray-800 rotate-45"></div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-white shadow-sm border border-white/20 dark:border-gray-700 flex-shrink-0 ${iconBgColor || 'bg-brand-red-600'}`}>
                            <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white" />
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        {showPairedServiceTitle ? (
                            <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 font-cairo leading-snug">
                                <span
                                    className={`text-sm sm:text-base font-bold tracking-tight ${pairedServiceTypeTextClass}`}
                                >
                                    {serviceLabelPaired}
                                </span>
                                <span
                                    className="select-none text-xs font-light text-gray-300 dark:text-gray-600"
                                    aria-hidden
                                >
                                    —
                                </span>
                                <span className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100">
                                    {title}
                                </span>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
                                    <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 font-cairo leading-tight">
                                        {title}
                                    </h2>
                                </div>
                                {/* Subtitle hidden when compact HV row is shown — avoids duplicating ticket_number (e.g. ServiceModalViewer) */}
                                {subtitle && !hvDisplay && (
                                    <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 font-cairo mt-0.5 truncate leading-tight">
                                        {subtitle}
                                    </p>
                                )}
                            </>
                        )}
                        {copyTicketRef ? (
                            <button
                                type="button"
                                onClick={handleCopyTicketNumber}
                                title="نسخ رقم التذكرة الكامل"
                                className="mt-1.5 inline-flex max-w-full items-center border-0 bg-transparent py-px text-left transition-opacity hover:opacity-90 active:opacity-80"
                            >
                                {hvDisplay ? (
                                    <span
                                        dir="ltr"
                                        className="inline-flex min-w-0 flex-wrap items-center gap-2 sm:gap-2.5"
                                    >
                                        <span
                                            className="inline-flex items-center gap-1.5 font-mono text-[11px] leading-none text-gray-900 dark:text-gray-100 sm:text-xs"
                                            title="رمز التذكرة: نوع الخدمة + التاريخ + التسلسل اليومي"
                                        >
                                            <span className="text-gray-400 dark:text-gray-500" aria-hidden>
                                                #
                                            </span>
                                            <span
                                                className="font-semibold tracking-tight"
                                                title={HV_TYPE_LETTER_LABEL_AR[hvDisplay.typeLetter] || undefined}
                                            >
                                                {hvDisplay.prefix}
                                            </span>
                                            <span className="text-gray-300 dark:text-gray-600 select-none" aria-hidden>
                                                |
                                            </span>
                                            <span
                                                className="tabular-nums text-gray-700 dark:text-gray-200"
                                                title="سنة · شهر · يوم"
                                            >
                                                {hvDisplay.yy}-{hvDisplay.mm}-{hvDisplay.dd}
                                            </span>
                                            <span className="text-gray-300 dark:text-gray-600 select-none" aria-hidden>
                                                |
                                            </span>
                                            <span
                                                className="font-semibold tabular-nums text-gray-900 dark:text-gray-50"
                                                title="تسلسل ذلك اليوم"
                                            >
                                                {hvDisplay.seq}
                                            </span>
                                        </span>
                                        <Copy
                                            className="h-3 w-3 shrink-0 text-gray-400 dark:text-gray-500 sm:h-3.5 sm:w-3.5"
                                            aria-hidden
                                        />
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-gray-800 dark:text-gray-100">
                                        <span className="font-cairo text-[10px] font-normal text-gray-500 dark:text-gray-400 sm:text-xs">
                                            رقم التذكرة
                                        </span>
                                        <span>{ticketNumberRaw}</span>
                                        <Copy className="h-3 w-3 shrink-0 text-gray-400" aria-hidden />
                                    </span>
                                )}
                            </button>
                        ) : null}
                    </div>
                </div>

                {/* Date, Status Badge, Close - End */}
                <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
                    {/* Date Display */}
                    {ticket?.created_at && (
                        <div className="flex items-center gap-1 sm:gap-1.5 text-gray-600 dark:text-gray-400">
                            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="text-[10px] sm:text-xs font-medium font-cairo whitespace-nowrap hidden sm:inline">
                                {new Date(ticket.created_at).toLocaleDateString('ar-EG', { 
                                    year: 'numeric', 
                                    month: 'short', 
                                    day: 'numeric' 
                                })}
                            </span>
                        </div>
                    )}

                    {/* Status Badge — Hub-style with icon (same as ServiceActionCard) */}
                    {ticket && (
                        <ServiceStatusBadge
                            status={normalizedStatus}
                            size="sm"
                            showIcon={true}
                            className="flex-shrink-0"
                        />
                    )}

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="w-7 h-7 sm:w-7 sm:h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

ServiceModalHeader.propTypes = {
    title: PropTypes.string.isRequired,
    subtitle: PropTypes.string,
    icon: PropTypes.elementType.isRequired,
    iconColor: PropTypes.string,
    iconBgColor: PropTypes.string,
    onClose: PropTypes.func.isRequired,
    isSubmitting: PropTypes.bool,
    sticky: PropTypes.bool,
    ticket: PropTypes.object,
    subtitleAsServiceTypeLabel: PropTypes.bool
};

export default ServiceModalHeader;

