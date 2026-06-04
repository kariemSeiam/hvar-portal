/**
 * ServiceTicketItem - Renders a single service ticket with full details
 * Enhanced design matching BostaOrderItem quality
 * Supports all backend ticket data fields
 */
import { useState } from 'react';
import {
    FileText, RotateCcw, Wrench, RefreshCw, Package, Truck, AlertCircle,
    ChevronDown, ChevronUp, Calendar, Clock, CheckCircle, XCircle, Loader2
} from 'lucide-react';
import { formatDateOnly, getRelativeTime } from '../../../utils/core/date';
import { getSafeNotesDisplay } from '../../../utils/ui/notes';
import { normalizeServiceTypeOrFallback } from '../../../constants/serviceTypes.js';

// Format ticket number for display
const formatTicketNumberLabel = (ticket) => {
    if (!ticket) return null;
    if (ticket.ticket_number) {
        const numParts = ticket.ticket_number.split('-');
        return numParts[numParts.length - 1];
    }
    return ticket.id || null;
};

// Get status badge config
const getStatusConfig = (status) => {
    const statusLower = status?.toLowerCase() || '';

    const configs = {
        'draft': {
            label: 'مسودة',
            bg: 'bg-accent-amber-100 dark:bg-accent-amber-900/30',
            text: 'text-accent-amber-700 dark:text-accent-amber-300',
            border: 'border-accent-amber-300 dark:border-accent-amber-700',
            icon: AlertCircle,
            pulse: true
        },
        'pending': {
            label: 'قيد الانتظار',
            bg: 'bg-gray-100 dark:bg-gray-700/50',
            text: 'text-gray-700 dark:text-gray-300',
            border: 'border-gray-300 dark:border-gray-600',
            icon: Clock
        },
        'confirmed': {
            label: 'مؤكد',
            bg: 'bg-ui-warning-100 dark:bg-ui-warning-900/30',
            text: 'text-ui-warning-700 dark:text-ui-warning-300',
            border: 'border-ui-warning-300 dark:border-ui-warning-700',
            icon: CheckCircle
        },
        'in_process': {
            label: 'قيد المعالجة',
            bg: 'bg-brand-blue-100 dark:bg-brand-blue-900/30',
            text: 'text-brand-blue-700 dark:text-brand-blue-300',
            border: 'border-brand-blue-300 dark:border-brand-blue-700',
            icon: Loader2,
            spin: true
        },
        'in_transit': {
            label: 'قيد الشحن',
            bg: 'bg-brand-blue-100 dark:bg-brand-blue-900/30',
            text: 'text-brand-blue-700 dark:text-brand-blue-300',
            border: 'border-brand-blue-300 dark:border-brand-blue-700',
            icon: Truck
        },
        'delivered': {
            label: 'تم التسليم',
            bg: 'bg-accent-green-100 dark:bg-accent-green-900/30',
            text: 'text-accent-green-700 dark:text-accent-green-300',
            border: 'border-accent-green-300 dark:border-accent-green-700',
            icon: CheckCircle
        },
        'completed': {
            label: 'مكتمل',
            bg: 'bg-accent-green-100 dark:bg-accent-green-900/30',
            text: 'text-accent-green-700 dark:text-accent-green-300',
            border: 'border-accent-green-300 dark:border-accent-green-700',
            icon: CheckCircle
        },
        'cancelled': {
            label: 'ملغي',
            bg: 'bg-brand-red-100 dark:bg-brand-red-900/30',
            text: 'text-brand-red-700 dark:text-brand-red-300',
            border: 'border-brand-red-300 dark:border-brand-red-700',
            icon: XCircle
        },
        'failed': {
            label: 'فشل',
            bg: 'bg-brand-red-100 dark:bg-brand-red-900/30',
            text: 'text-brand-red-700 dark:text-brand-red-300',
            border: 'border-brand-red-300 dark:border-brand-red-700',
            icon: XCircle
        },
        'returned': {
            label: 'مرتجع',
            bg: 'bg-brand-red-100 dark:bg-brand-red-900/30',
            text: 'text-brand-red-700 dark:text-brand-red-300',
            border: 'border-brand-red-300 dark:border-brand-red-700',
            icon: RefreshCw
        }
    };

    return configs[statusLower] || {
        label: status || 'غير محدد',
        bg: 'bg-gray-100 dark:bg-gray-700/50',
        text: 'text-gray-700 dark:text-gray-300',
        border: 'border-gray-300 dark:border-gray-600',
        icon: FileText
    };
};

// Service type configuration with icons and colors
const SERVICE_TYPE_INFO = {
    'replacement': {
        icon: RotateCcw,
        gradient: 'from-brand-blue-500 to-cyan-500',
        label: 'استبدال',
        bgLight: 'bg-brand-blue-50 dark:bg-brand-blue-900/30',
        borderLight: 'border-brand-blue-200 dark:border-brand-blue-700'
    },
    'maintenance': {
        icon: Wrench,
        gradient: 'from-accent-amber-500 to-orange-500',
        label: 'صيانة',
        bgLight: 'bg-accent-amber-50 dark:bg-accent-amber-900/30',
        borderLight: 'border-accent-amber-200 dark:border-accent-amber-700'
    },
    'return': {
        icon: RefreshCw,
        gradient: 'from-brand-red-500 to-pink-500',
        label: 'استرجاع',
        bgLight: 'bg-brand-red-50 dark:bg-brand-red-900/30',
        borderLight: 'border-brand-red-200 dark:border-brand-red-700'
    },
    'sell': {
        icon: Package,
        gradient: 'from-accent-green-500 to-emerald-500',
        label: 'المبيعات',
        bgLight: 'bg-accent-green-50 dark:bg-accent-green-900/30',
        borderLight: 'border-accent-green-200 dark:border-accent-green-700'
    }
};

// Priority config
const getPriorityConfig = (priority) => {
    const configs = {
        'high': { label: 'عاجل', bg: 'bg-brand-red-100 text-brand-red-700 dark:bg-brand-red-900/30 dark:text-brand-red-300' },
        'medium': { label: 'متوسط', bg: 'bg-accent-amber-100 text-accent-amber-700 dark:bg-accent-amber-900/30 dark:text-accent-amber-300' },
        'low': { label: 'عادي', bg: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' }
    };
    return configs[priority?.toLowerCase()] || null;
};

export default function ServiceTicketItem({
    ticket,
    index = 0,
    isCompact = false,
    isCurrentTicket = false,
    onViewTicket,
}) {
    const [expandedDescriptions, setExpandedDescriptions] = useState({});

    // Get service type info
    const serviceInfo = SERVICE_TYPE_INFO[normalizeServiceTypeOrFallback(ticket.service_type, { fallback: 'replacement' })] || {
        icon: FileText,
        gradient: 'from-gray-500 to-gray-600',
        label: ticket.service_type || 'خدمة',
        bgLight: 'bg-gray-50 dark:bg-gray-800',
        borderLight: 'border-gray-200 dark:border-gray-700'
    };
    const ServiceIcon = serviceInfo.icon;

    // Date formatting
    const ticketDate = ticket.created_at ? new Date(ticket.created_at) : null;
    const formattedDate = ticketDate ? formatDateOnly(ticketDate.toISOString()) : null;
    const relativeTime = ticketDate ? getRelativeTime(ticketDate.toISOString()) : null;

    // Notes with expand/collapse (safe: filters placeholder/garbage)
    const ticketNotes = getSafeNotesDisplay(ticket.notes) || getSafeNotesDisplay(ticket.description) || null;
    const descriptionKey = `service-${index}`;
    const isExpanded = expandedDescriptions[descriptionKey] || false;
    const MAX_DESCRIPTION_LENGTH = 100;
    const shouldTruncate = ticketNotes && ticketNotes.length > MAX_DESCRIPTION_LENGTH;
    const displayNotes = shouldTruncate && !isExpanded
        ? ticketNotes.substring(0, MAX_DESCRIPTION_LENGTH) + '...'
        : ticketNotes;

    // Ticket number
    const displayTicketNumber = formatTicketNumberLabel(ticket);

    // Status config
    const statusConfig = getStatusConfig(ticket.status);
    const StatusIcon = statusConfig.icon;

    // Priority
    const priorityConfig = getPriorityConfig(ticket.priority);

    // Get items by direction
    const getItemsByDirection = () => {
        const items = ticket.items || ticket.service_items || ticket.order_items || [];
        if (!items || items.length === 0) {
            return { send: [], receive: [] };
        }
        return items.reduce((acc, item) => {
            const direction = item.direction?.toLowerCase();
            if (direction === 'send') {
                acc.send.push(item);
            } else if (direction === 'receive') {
                acc.receive.push(item);
            }
            return acc;
        }, { send: [], receive: [] });
    };

    const { send, receive } = getItemsByDirection();

    // Compact mode
    if (isCompact) {
        return (
            <button
                type="button"
                onClick={() => onViewTicket?.(ticket)}
                className={`
                    w-full text-right
                    flex items-center justify-between gap-2
                    px-3 py-2.5
                    min-h-[44px]
                    rounded-lg
                    ${isCurrentTicket
                        ? 'bg-brand-blue-50 dark:bg-brand-blue-900/20 border-brand-blue-400'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-brand-blue-400'
                    }
                    border
                    transition-all duration-200
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-500
                `}
                dir="rtl"
            >
                <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${serviceInfo.gradient} flex items-center justify-center flex-shrink-0`}>
                        <ServiceIcon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="font-cairo font-medium text-xs text-gray-900 dark:text-gray-100 truncate">
                            #{displayTicketNumber || ticket.id}
                        </span>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 font-cairo">
                            {serviceInfo.label}
                        </span>
                    </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                    {statusConfig.label}
                </span>
            </button>
        );
    }

    // Items display component
    const getItemsDisplay = () => {
        if (normalizeServiceTypeOrFallback(ticket.service_type, { fallback: 'replacement' }) === 'sell') {
            const parts = send.filter(item => item.type === 'part');
            const products = send.filter(item => item.type === 'product');
            if (parts.length === 0 && products.length === 0) return null;

            return (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-accent-green-100 dark:bg-accent-green-900/30 border border-accent-green-200 dark:border-accent-green-700 rounded-md">
                    <Package className="w-3 h-3 text-accent-green-600 dark:text-accent-green-400 flex-shrink-0" />
                    <span className="text-[10px] font-medium text-accent-green-700 dark:text-accent-green-300 font-cairo">
                        {send.length} قطعة
                    </span>
                </div>
            );
        }

        if (send.length === 0 && receive.length === 0) return null;

        return (
            <>
                {send.length > 0 && (
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-brand-blue-100 dark:bg-brand-blue-900/30 border border-brand-blue-200 dark:border-brand-blue-700 rounded-md">
                        <Truck className="w-3 h-3 text-brand-blue-600 dark:text-brand-blue-400 flex-shrink-0" />
                        <span className="text-[10px] font-medium text-brand-blue-700 dark:text-brand-blue-300 font-cairo">
                            إرسال ({send.length})
                        </span>
                    </div>
                )}
                {receive.length > 0 && (
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-accent-green-100 dark:bg-accent-green-900/30 border border-accent-green-200 dark:border-accent-green-700 rounded-md">
                        <Package className="w-3 h-3 text-accent-green-600 dark:text-accent-green-400 flex-shrink-0" />
                        <span className="text-[10px] font-medium text-accent-green-700 dark:text-accent-green-300 font-cairo">
                            استلام ({receive.length})
                        </span>
                    </div>
                )}
            </>
        );
    };

    // Full mode - detailed rendering
    return (
        <div
            onClick={() => !isCurrentTicket && onViewTicket?.(ticket)}
            className={`
                w-full flex items-start gap-3 p-3.5 rounded-xl border transition-all duration-200 text-right
                ${isCurrentTicket
                    ? 'bg-brand-blue-50 dark:bg-brand-blue-900/20 border-brand-blue-400 dark:border-brand-blue-600 shadow-md ring-2 ring-brand-blue-200 dark:ring-brand-blue-800 cursor-default'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-brand-blue-400 dark:hover:border-brand-blue-600 hover:bg-brand-blue-50/50 dark:hover:bg-brand-blue-900/10 hover:shadow-md cursor-pointer'
                }
            `}
            dir="rtl"
        >
            {/* Service Type Icon */}
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${serviceInfo.gradient} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                <ServiceIcon className="w-6 h-6 text-white" />
            </div>

            <div className="flex-1 min-w-0">
                {/* Top Row: Type + Ticket Number + Status */}
                <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="flex items-start gap-2">
                        {isCurrentTicket && (
                            <div className="w-2 h-2 rounded-full bg-brand-blue-600 dark:bg-brand-blue-400 flex-shrink-0 animate-pulse mt-1.5" />
                        )}
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-xs font-semibold font-cairo ${isCurrentTicket ? 'text-brand-blue-700 dark:text-brand-blue-300' : 'text-gray-600 dark:text-gray-400'}`}>
                                    {serviceInfo.label}
                                </span>
                                {isCurrentTicket && (
                                    <span className="text-[9px] px-1.5 py-0.5 bg-brand-blue-600 dark:bg-brand-blue-500 text-white rounded-full font-bold font-cairo">
                                        الحالي
                                    </span>
                                )}
                                {priorityConfig && (
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium font-cairo ${priorityConfig.bg}`}>
                                        {priorityConfig.label}
                                    </span>
                                )}
                            </div>
                            {displayTicketNumber && (
                                <span className={`text-xs font-bold font-cairo ${isCurrentTicket ? 'text-brand-blue-800 dark:text-brand-blue-200' : 'text-gray-900 dark:text-gray-100'}`}>
                                    #{displayTicketNumber}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Status Badge */}
                    <span className={`
                        text-[10px] px-2.5 py-1 rounded-full font-semibold
                        inline-flex items-center gap-1 shadow-sm
                        ${statusConfig.bg} ${statusConfig.text} border ${statusConfig.border}
                        ${statusConfig.pulse ? 'animate-pulse' : ''}
                    `}>
                        <StatusIcon className={`w-3 h-3 ${statusConfig.spin ? 'animate-spin' : ''}`} />
                        {statusConfig.label}
                    </span>
                </div>

                {/* Items Display */}
                {(send.length > 0 || receive.length > 0) && (
                    <div className="mb-2 flex items-center gap-1.5 flex-wrap">
                        {getItemsDisplay()}
                    </div>
                )}

                {/* Date Row */}
                {formattedDate && relativeTime && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 font-cairo mb-2">
                        <Calendar className="w-3 h-3 flex-shrink-0" />
                        <span className="font-semibold text-gray-700 dark:text-gray-200">{formattedDate}</span>
                        <span className="text-gray-400 dark:text-gray-500 text-[10px]">•</span>
                        <span className="text-gray-500 dark:text-gray-400">{relativeTime}</span>
                    </div>
                )}

                {/* Notes Section */}
                {ticketNotes && (
                    <div className="p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-md border border-gray-200 dark:border-gray-600">
                        <div className="flex items-center gap-1.5 mb-1">
                            <FileText className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                            <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-400 font-cairo">ملاحظات:</span>
                        </div>
                        <p className="text-xs text-gray-700 dark:text-gray-300 font-cairo leading-relaxed whitespace-pre-line">
                            {displayNotes}
                        </p>
                        {shouldTruncate && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedDescriptions(prev => ({
                                        ...prev,
                                        [descriptionKey]: !prev[descriptionKey]
                                    }));
                                }}
                                className="mt-2 text-xs text-brand-blue-600 dark:text-brand-blue-400 hover:text-brand-blue-700 dark:hover:text-brand-blue-300 font-semibold font-cairo flex items-center gap-1 transition-colors"
                            >
                                {isExpanded ? (
                                    <>
                                        <ChevronUp className="w-3 h-3" />
                                        <span>عرض أقل</span>
                                    </>
                                ) : (
                                    <>
                                        <ChevronDown className="w-3 h-3" />
                                        <span>عرض المزيد</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
