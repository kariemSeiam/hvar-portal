import { useEffect, useRef, useState } from 'react';
import { Phone, User, FileText, Package, DollarSign, X, Clock, Loader2 } from 'lucide-react';
import { getOrderCalls } from '../../api/callCenterAPI';
import { CallNotesDisplay } from './CallNotesDisplay';
import { formatTimeAndDayName, formatDateWithArabicMonth } from '../../utils/core/date';
import { getCallType, getCallStatusForDisplay } from '../../utils/bosta/status';

/**
 * CallHistoryModal — سجل المحاولات
 * Design matches CallHistoryCard (session FAB): accent strip, type icon, status badge,
 * formatTimeAndDayName, formatDateWithArabicMonth, genome tokens.
 */
const CallHistoryModal = ({ orderId, isOpen, onClose, position, onMouseEnter: onMouseEnterPopover, onMouseLeave: onMouseLeavePopover }) => {
  const [calls, setCalls] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen && orderId) {
      fetchCallHistory();
    }
  }, [isOpen, orderId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  const fetchCallHistory = async () => {
    setIsLoading(true);
    try {
      const list = await getOrderCalls(orderId);
      setCalls(Array.isArray(list) ? list : []);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching call history:', error);
      setCalls([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 2
    }).format(price || 0);
  };

  if (!isOpen) return null;

  const isAbove = position?.direction === 'above';
  const modalWidth = 360;
  const leftPosition = position?.x ? `${position.x - modalWidth / 2}px` : '50%';
  const topPosition = position?.y ? `${position.y}px` : '50%';
  const transform = position?.y
    ? (isAbove ? 'translateY(-100%) translateY(-8px)' : 'translateY(8px)')
    : 'translate(-50%, -50%)';

  return (
    <div
      ref={modalRef}
      className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-w-md min-w-[320px] max-h-[90vh] flex flex-col overflow-hidden"
      onMouseEnter={onMouseEnterPopover}
      onMouseLeave={onMouseLeavePopover}
      style={{
        top: topPosition,
        left: leftPosition,
        transform,
        maxWidth: '90vw'
      }}
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="call-history-title"
    >
      {/* Arrow */}
      {position?.y && (
        <div
          className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-white dark:bg-gray-800 border-l border-t border-gray-200 dark:border-gray-700 rotate-45 ${
            isAbove ? '-bottom-1' : '-top-1'
          }`}
          aria-hidden
        />
      )}

      {/* Header — matches CallHistoryCard */}
      <div className="flex-shrink-0 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-brand-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-sm">
            <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" strokeWidth={2.5} />
          </div>
          <h3 id="call-history-title" className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 font-cairo">
            سجل المحاولات
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
          aria-label="إغلاق"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content — scrollable, fits viewport, visible scrollbar */}
      <div className="flex-1 min-h-0 p-3 overflow-y-auto overscroll-contain scrollbar-dropdown">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <Loader2 className="w-5 h-5 text-brand-blue-500 animate-spin" aria-hidden />
            <span className="text-xs text-gray-600 dark:text-gray-400 font-cairo">جاري التحميل...</span>
          </div>
        ) : calls.length === 0 ? (
          <p className="py-8 text-center text-xs text-gray-500 dark:text-gray-400 font-cairo">
            لا توجد محاولات مسجلة
          </p>
        ) : (
          <div className="space-y-3">
            {calls.map((call, index) => {
              const typeConfig = getCallType(call.call_type);
              const statusConfig = getCallStatusForDisplay(call.status || call.call_status, call.call_type);
              const dt = call.call_datetime || call.created_at;
              const notes = call.history || call.notes || '';
              const gradient = typeConfig.colors?.gradient || 'from-brand-blue-500 to-cyan-500';
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={call.id || call.call_id || `${call.attempt_number}-${dt}-${index}`}
                  className="group relative flex items-stretch gap-0 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:border-brand-blue-300 dark:hover:border-brand-blue-600 transition-all duration-200 shadow-sm hover:shadow-md overflow-hidden"
                  dir="rtl"
                >
                  {/* Accent strip */}
                  <div
                    className={`w-1 flex-shrink-0 self-stretch bg-gradient-to-b ${gradient} opacity-80 group-hover:opacity-100 transition-opacity`}
                    aria-hidden
                  />
                  {/* Icon column */}
                  <div className="flex-shrink-0 flex flex-col items-center p-2.5 pl-2">
                    <div className={`relative w-9 h-9 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm`}>
                      <Phone className="w-4 h-4 text-white" strokeWidth={2.5} />
                      {call.attempt_number > 0 && (
                        <div className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-brand-blue-600 border-2 border-white dark:border-gray-800 flex items-center justify-center">
                          <span className="text-[8px] font-bold text-white font-cairo leading-none" dir="ltr">
                            {call.attempt_number}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0 flex flex-col pt-2.5 pb-2.5 pe-2.5 ps-2 gap-2">
                    {/* Header: Date/time + Status badge */}
                    <header className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        {(dt && (formatTimeAndDayName(dt) || formatDateWithArabicMonth(dt))) && (
                          <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-700/50 px-2 py-1 rounded-md border border-gray-100 dark:border-gray-700/50">
                            <Clock className="w-3 h-3 flex-shrink-0 text-brand-blue-500 dark:text-brand-blue-400" />
                            <div className="flex items-center gap-1 flex-wrap">
                              {formatTimeAndDayName(dt) && (
                                <span className="text-[10px] sm:text-xs font-semibold text-gray-700 dark:text-gray-200 font-cairo">
                                  {formatTimeAndDayName(dt)}
                                </span>
                              )}
                              {formatTimeAndDayName(dt) && formatDateWithArabicMonth(dt) && (
                                <span className="text-gray-400 dark:text-gray-500 text-[10px]">•</span>
                              )}
                              {formatDateWithArabicMonth(dt) && (
                                <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-cairo">
                                  {formatDateWithArabicMonth(dt)}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <div
                        className={`flex items-center gap-1 px-2 py-1 rounded-md border shrink-0 ${statusConfig.colors?.bg || 'bg-gray-100 dark:bg-gray-700/50'} ${statusConfig.colors?.text || 'text-gray-700 dark:text-gray-300'} ${statusConfig.colors?.border || 'border-gray-200 dark:border-gray-600/50'}`}
                      >
                        {StatusIcon && <StatusIcon className="w-3 h-3 flex-shrink-0" aria-hidden />}
                        <span className="text-[9px] sm:text-[10px] font-semibold font-cairo whitespace-nowrap">
                          {statusConfig.label}
                        </span>
                      </div>
                    </header>

                    {/* Notes */}
                    {notes && (
                      <div className="flex items-start gap-1.5 min-w-0">
                        <FileText className="w-3 h-3 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" aria-hidden />
                        <div className="flex-1 min-w-0">
                          <CallNotesDisplay text={String(notes).trim()} />
                        </div>
                      </div>
                    )}

                    {/* Footer: Type + Agent */}
                    <footer className="mt-auto pt-2 border-t border-gray-100 dark:border-gray-700/50 flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        {typeConfig.label && (
                          <span
                            className={`px-2 py-0.5 text-[9px] sm:text-[10px] font-semibold rounded-md border whitespace-nowrap ${typeConfig.colors?.bg || 'bg-brand-blue-100 dark:bg-brand-blue-900/40'} ${typeConfig.colors?.text || 'text-brand-blue-700 dark:text-brand-blue-200'} ${typeConfig.colors?.border || 'border-brand-blue-200 dark:border-brand-blue-700/50'}`}
                          >
                            {typeConfig.label}
                          </span>
                        )}
                      </div>
                      {(call.agent_name || call.agent_id) && (
                        <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 font-cairo">
                          <User className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate max-w-[100px] sm:max-w-none" dir="auto">
                            {(call.agent_name || '').trim() || 'مستخدم غير محدد'}
                          </span>
                        </div>
                      )}
                    </footer>

                    {/* Items */}
                    {call.items && Array.isArray(call.items) && call.items.length > 0 && (
                      <div className="pt-2 border-t border-gray-100 dark:border-gray-700/50">
                        <div className="flex items-center gap-1 mb-1">
                          <Package className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                          <span className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 font-cairo">
                            تغييرات العناصر:
                          </span>
                        </div>
                        <div className="space-y-0.5 pr-4">
                          {call.items.map((item, idx) => (
                            <div key={idx} className="text-[10px] text-gray-600 dark:text-gray-400 font-cairo">
                              • {item.name || item.sku || '—'} (الكمية: {item.quantity ?? item.order_quantity ?? 1})
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Total */}
                    {call.total != null && call.total !== undefined && (
                      <div className="flex items-center gap-1.5 pt-1.5">
                        <DollarSign className="w-3 h-3 text-green-600 dark:text-green-400" />
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 font-cairo">المبلغ:</span>
                        <span className="text-xs font-bold text-gray-900 dark:text-gray-100 font-cairo">
                          {formatPrice(call.total)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CallHistoryModal;
