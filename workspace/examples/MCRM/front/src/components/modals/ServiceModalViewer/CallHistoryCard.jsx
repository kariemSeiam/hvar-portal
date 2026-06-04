import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Phone, Loader2, XCircle, Clock, User, CheckCircle, Calendar, PhoneCall, PhoneOff, PhoneIncoming, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { getCallsByPhone } from '../../../api/callCenterAPI';
import { CallNotesDisplay } from '../../call-center/CallNotesDisplay';
import { formatTimeAndDayName, formatDateWithArabicMonth } from '../../../utils/core/date';
import { getCallType, getCallStatusForDisplay } from '../../../utils/bosta/status';

/**
 * Call history card for ServiceModalViewer: recent calls by customer phone.
 * Compact collapsible design matching app standards.
 */
function CallHistoryCard({ phone, customerId }) {
    const [calls, setCalls] = useState([]);
    const [loading, setLoading] = useState(false);
    const lastPhoneRef = useRef(null);
    const abortControllerRef = useRef(null);
    const [error, setError] = useState(null);
    
    // Collapse/expand state - default collapsed for compact view
    const [isExpanded, setIsExpanded] = useState(() => {
        if (typeof sessionStorage === 'undefined') return false;
        try {
            const saved = sessionStorage.getItem('service-modal-call-history-expanded');
            return saved === 'true';
        } catch {
            return false;
        }
    });

    const toggleExpanded = useCallback(() => {
        setIsExpanded(prev => {
            const newValue = !prev;
            try {
                sessionStorage.setItem('service-modal-call-history-expanded', String(newValue));
            } catch {
                // ignore
            }
            return newValue;
        });
    }, []);

    useEffect(() => {
        const normalizedPhone = phone && String(phone).trim() ? String(phone).trim() : null;
        const cid = customerId != null && customerId !== '' ? String(customerId) : null;
        const fetchKey = `${cid ?? ''}|${normalizedPhone ?? ''}`;

        if (fetchKey === lastPhoneRef.current) {
            return;
        }

        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        lastPhoneRef.current = fetchKey;

        if (!normalizedPhone && !cid) {
            setCalls([]);
            setLoading(false);
            setError(null);
            return;
        }

        abortControllerRef.current = new AbortController();
        const currentAbortController = abortControllerRef.current;

        setLoading(true);
        setError(null);
        getCallsByPhone(normalizedPhone || '', { customerId: cid })
            .then((list) => {
                // Only update if this request hasn't been aborted
                if (!currentAbortController.signal.aborted) {
                    // Validate list is an array
                    if (Array.isArray(list)) {
                        // Validate each call object
                        const validCalls = list.filter(call => 
                            call && typeof call === 'object' && !Array.isArray(call)
                        );
                        setCalls(validCalls);
                    } else {
                        setCalls([]);
                        setError('تنسيق بيانات غير صحيح');
                    }
                }
            })
            .catch((error) => {
                // Ignore abort errors
                if (error.name !== 'AbortError' && !currentAbortController.signal.aborted) {
                    setCalls([]);
                    const errorMessage = error?.message || error?.response?.data?.error || 'فشل تحميل سجل المكالمات';
                    setError(errorMessage);
                    if (import.meta.env.DEV) {
                        console.error('[CallHistoryCard] Error loading calls:', error);
                    }
                }
            })
            .finally(() => {
                // Only update loading state if this request hasn't been aborted
                if (!currentAbortController.signal.aborted) {
                    setLoading(false);
                }
            });

        // Cleanup: abort request on unmount or when phone changes
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [phone, customerId]);


    if ((!phone || !String(phone).trim()) && (customerId == null || customerId === '')) return null;

    const hasCalls = calls.length > 0;
    const cardBase = 'bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm sm:shadow-md relative transition-all duration-200';

    // When no calls: show compact horizontal bar only (no header)
    if (!loading && !error && !hasCalls) {
        return (
            <div className={cardBase} data-testid="service-modal-viewer-call-history-card">
                <div
                    className="flex items-center gap-2 sm:gap-2.5 w-full rounded-lg px-2.5 sm:px-3 py-2 sm:py-2.5"
                    role="status"
                    aria-label="لا توجد مكالمات سابقة"
                    dir="rtl"
                >
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-brand-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" aria-hidden />
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 font-cairo">سجل المكالمات</span>
                    <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-cairo">لا توجد مكالمات سابقة</span>
                </div>
            </div>
        );
    }

    // Collapsed view - compact summary bar
    if (!isExpanded) {
        return (
            <div className={cardBase} data-testid="service-modal-viewer-call-history-card">
                <button
                    type="button"
                    onClick={toggleExpanded}
                    dir="rtl"
                    className="w-full flex items-center gap-2 sm:gap-2.5 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-right font-cairo transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-800 min-h-[44px]"
                    aria-expanded="false"
                    title="عرض سجل المكالمات"
                >
                    {/* Icon - right side (RTL start) */}
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-brand-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-sm order-1">
                        <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" aria-hidden />
                    </div>
                    {/* Title and count - right side after icon (RTL start) */}
                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-shrink-0 order-2">
                        <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 font-cairo whitespace-nowrap">سجل المكالمات</span>
                        {loading ? (
                            <Loader2 className="w-3.5 h-3.5 text-brand-blue-500 animate-spin flex-shrink-0" aria-hidden />
                        ) : hasCalls ? (
                            <span className="text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full bg-brand-blue-100 dark:bg-brand-blue-900/30 text-brand-blue-700 dark:text-brand-blue-200 font-semibold font-cairo whitespace-nowrap">
                                {calls.length}
                            </span>
                        ) : error ? (
                            <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" aria-hidden />
                        ) : null}
                    </div>
                    {/* Subtitle - takes remaining space, right-aligned */}
                    {hasCalls && !loading && (
                        <div className="flex-1 min-w-0 text-right order-3">
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-cairo">
                                {calls.length === 1 ? 'مكالمة واحدة' : `${calls.length} مكالمات`}
                            </p>
                        </div>
                    )}
                    {/* Chevron - left side (RTL end) */}
                    <ChevronDown className={`w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0 transition-transform duration-200 rotate-90 order-4`} aria-hidden />
                </button>
            </div>
        );
    }

    // Expanded view - full card
    return (
        <div className={cardBase} data-testid="service-modal-viewer-call-history-card">
            {/* Header - clickable to collapse */}
            <button
                type="button"
                onClick={toggleExpanded}
                dir="rtl"
                className="w-full flex items-center gap-2 sm:gap-2.5 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-t-lg sm:rounded-t-xl border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-800"
                aria-expanded="true"
                title="إخفاء سجل المكالمات"
            >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-brand-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" aria-hidden />
                </div>
                <div className="flex-1 min-w-0 text-right">
                    <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 font-cairo">سجل المكالمات</h3>
                    {hasCalls && !loading && (
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-cairo mt-0.5">
                            {calls.length} {calls.length === 1 ? 'مكالمة' : 'مكالمات'}
                        </p>
                    )}
                </div>
                <ChevronUp className={`w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0 transition-transform duration-200 -rotate-90`} aria-hidden />
            </button>

            {/* Content */}
            <div className="p-2.5 sm:p-3">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-6 gap-2">
                        <Loader2 className="w-5 h-5 text-brand-blue-500 animate-spin" aria-hidden />
                        <span className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 font-cairo">جاري التحميل...</span>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center gap-2 py-4 px-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                        <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" aria-hidden />
                        <span className="text-[10px] sm:text-xs text-red-700 dark:text-red-300 font-cairo text-center">{error}</span>
                    </div>
                ) : (
                    <div className="space-y-2 max-h-[280px] sm:max-h-[320px] overflow-y-auto scrollbar-hide pr-1" dir="rtl">
                    {calls.map((call, index) => {
                        // Validate call is an object
                        if (!call || typeof call !== 'object' || Array.isArray(call)) {
                            return null;
                        }

                        const callId = call.id || call.call_id;
                        if (!callId) return null;

                        // Safely extract call fields
                        const callDatetime = call.call_datetime || call.created_at || call.call_date;
                        const callStatus = call.status || call.call_status || '';
                        const callType = call.call_type || call.service_type || 'ask';
                        const attemptNumber = call.attempt_number ?? call.attempt_count ?? 1;
                        const agentName = (call.agent_name || call.agent_name_text || '').trim();
                        const agentId = call.agent_id;
                        const callNotes = call.history || call.notes || '';
                        const hasNotes = callNotes && String(callNotes).trim();

                        const timeAndDay = callDatetime ? formatTimeAndDayName(callDatetime) : null;
                        const dateArabic = callDatetime ? formatDateWithArabicMonth(callDatetime) : null;

                        const typeConfig = getCallType(callType);
                        const statusConfig = getCallStatusForDisplay(callStatus, callType);
                        const TypeIcon = typeConfig.icon;
                        const StatusIcon = statusConfig.icon;

                        return (
                            <div
                                key={callId}
                                className="group relative flex items-stretch gap-0 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:border-brand-blue-300 dark:hover:border-brand-blue-600 transition-all duration-200 shadow-sm hover:shadow-md overflow-hidden"
                                dir="rtl"
                            >
                                {/* Accent strip — same pattern as ticket cards */}
                                <div className={`w-1 flex-shrink-0 self-stretch ${typeConfig.colors?.gradient ? `bg-gradient-to-b ${typeConfig.colors.gradient}` : 'bg-brand-blue-500'} opacity-80 group-hover:opacity-100 transition-opacity`} aria-hidden />
                                
                                {/* Icon column — same padding as ticket cards */}
                                <div className="flex-shrink-0 flex flex-col items-center gap-1 p-3 pl-2">
                                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${typeConfig.colors?.gradient || 'from-brand-blue-500 to-cyan-500'} flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow relative`}>
                                        <TypeIcon className="w-5 h-5 text-white" aria-hidden />
                                        {/* Attempt badge - top right corner */}
                                        {attemptNumber > 0 && (
                                            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-brand-blue-600 dark:bg-brand-blue-500 border-2 border-white dark:border-gray-800 flex items-center justify-center shadow-sm">
                                                <span className="text-[9px] font-bold text-white font-cairo leading-none" dir="ltr">
                                                    {attemptNumber}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Content — same padding as ticket cards */}
                                <div className="flex-1 min-w-0 flex flex-col pt-3 pb-3 pe-3 ps-2 gap-2">
                                    {/* Header: Date/time + Status badge */}
                                    <header className="flex items-center justify-between gap-2 w-full shrink-0 flex-wrap">
                                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                            {(timeAndDay || dateArabic) && (
                                                <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-700/50 px-2 py-1 rounded-md border border-gray-100 dark:border-gray-700/50">
                                                    <Clock className="w-3.5 h-3.5 flex-shrink-0 text-brand-blue-500 dark:text-brand-blue-400" aria-hidden />
                                                    <div className="flex items-center gap-1 flex-wrap">
                                                        {timeAndDay && (
                                                            <span className="text-[10px] sm:text-xs font-semibold text-gray-700 dark:text-gray-200 font-cairo" dir="rtl">
                                                                {timeAndDay}
                                                            </span>
                                                        )}
                                                        {timeAndDay && dateArabic && (
                                                            <span className="text-gray-400 dark:text-gray-500 text-[10px]">•</span>
                                                        )}
                                                        {dateArabic && (
                                                            <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-cairo" dir="rtl">
                                                                {dateArabic}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        {/* Status badge */}
                                        <div className={`flex items-center gap-1 px-2 py-1 rounded-md border shrink-0 ${statusConfig.colors?.bg || 'bg-gray-100 dark:bg-gray-700/50'} ${statusConfig.colors?.text || 'text-gray-700 dark:text-gray-300'} ${statusConfig.colors?.border || 'border-gray-200 dark:border-gray-600/50'}`} dir="rtl">
                                            <StatusIcon className="w-3 h-3 flex-shrink-0" aria-hidden />
                                            <span className="text-[9px] sm:text-[10px] font-semibold font-cairo whitespace-nowrap">
                                                {statusConfig.label}
                                            </span>
                                        </div>
                                    </header>
                                    
                                    {/* Notes section */}
                                    {hasNotes && (
                                        <section className="flex-1 min-w-0" aria-label="ملاحظات المكالمة">
                                            <CallNotesDisplay text={String(callNotes).trim()} />
                                        </section>
                                    )}
                                    
                                    {/* Footer: Type label + Agent */}
                                    <footer className="mt-auto pt-2 border-t border-gray-100 dark:border-gray-700/50 flex items-center justify-between gap-2 flex-wrap">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {typeConfig.label && (
                                                <span className={`px-2 py-0.5 text-[9px] sm:text-[10px] font-semibold rounded-md border whitespace-nowrap ${typeConfig.colors?.bg || 'bg-brand-blue-100 dark:bg-brand-blue-900/40'} ${typeConfig.colors?.text || 'text-brand-blue-700 dark:text-brand-blue-200'} ${typeConfig.colors?.border || 'border-brand-blue-200 dark:border-brand-blue-700/50'}`} dir="rtl">
                                                    {typeConfig.label}
                                                </span>
                                            )}
                                        </div>
                                        {(agentName || agentId) && (
                                            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 font-cairo min-w-0">
                                                <User className="w-3.5 h-3.5 flex-shrink-0" aria-hidden />
                                                <span className="truncate max-w-[120px] sm:max-w-none" dir="auto">
                                                    {agentName || 'مستخدم غير محدد'}
                                                </span>
                                            </div>
                                        )}
                                    </footer>
                                </div>
                            </div>
                        );
                    })}
                    </div>
                )}
            </div>
        </div>
    );
}

CallHistoryCard.propTypes = {
    phone: PropTypes.string,
    customerId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default CallHistoryCard;
