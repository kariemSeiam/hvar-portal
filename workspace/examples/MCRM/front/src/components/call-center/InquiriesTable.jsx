import { useMemo, useState } from 'react';
import { PhoneCall, MessageSquare, Calendar, FileText, Copy, Check } from 'lucide-react';
import { formatGregorianDate } from '../../utils/core/date';
import EmptyState from '../ui/EmptyState';

/**
 * InquiriesTable — Ask-only calls (استفسارات) with no order.
 * Matches OrdersTable design system: rounded-xl, genome tokens, RTL, scrollbar, skeleton.
 */
const InquiriesTable = ({ inquiries, onCall, isLoading }) => {
  const [copiedPhoneId, setCopiedPhoneId] = useState(null);
  const sortedInquiries = useMemo(() => {
    const toTs = (value) => {
      if (!value) return 0;
      const d = value instanceof Date ? value : new Date(value);
      const t = d.getTime();
      return Number.isFinite(t) ? t : 0;
    };
    return [...(inquiries || [])].sort((a, b) => {
      const t = Math.max(toTs(b?.updated_at), toTs(b?.created_at)) - Math.max(toTs(a?.updated_at), toTs(a?.created_at));
      if (t !== 0) return t;
      return Number(b?.id || 0) - Number(a?.id || 0);
    });
  }, [inquiries]);

  const handleCopyPhone = async (phone, id) => {
    if (!phone) return;
    try {
      await navigator.clipboard.writeText(phone);
      setCopiedPhoneId(id);
      setTimeout(() => setCopiedPhoneId(null), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = phone;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedPhoneId(id);
      setTimeout(() => setCopiedPhoneId(null), 2000);
    }
  };

  const SKELETON_ROWS = 6;

  if (isLoading) {
    return (
      <div className="w-full px-0">
        <div className="bg-white dark:bg-gray-800/95 rounded-xl shadow-sm border border-gray-200/60 dark:border-gray-700/40 overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800">
            <table className="w-full min-w-[600px] sm:min-w-full" dir="rtl">
              <thead className="bg-gray-50 dark:bg-gray-800/80 border-b-2 border-gray-200/80 dark:border-gray-600/40">
                <tr>
                  <th className="px-2 sm:px-3 py-2 text-right text-xs font-bold text-gray-700 dark:text-gray-200 font-cairo tracking-tight">
                    العميل
                  </th>
                  <th className="px-2 sm:px-3 py-2 text-center text-xs font-bold text-gray-700 dark:text-gray-200 font-cairo tracking-tight">
                    الملاحظات
                  </th>
                  <th className="px-2 sm:px-3 py-2 text-center text-xs font-bold text-gray-700 dark:text-gray-200 font-cairo tracking-tight">
                    التاريخ
                  </th>
                  <th className="px-2 sm:px-3 py-2 text-center text-xs font-bold text-gray-700 dark:text-gray-200 font-cairo tracking-tight">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800/95 divide-y divide-gray-100 dark:divide-gray-700/30">
                {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                  <tr key={i} className="bg-white dark:bg-gray-800/95 animate-pulse">
                    <td className="px-3 sm:px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-11 h-11 rounded-xl bg-gray-200 dark:bg-gray-700" />
                        <div className="flex flex-col gap-1.5">
                          <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" />
                          <div className="h-3 w-20 rounded bg-gray-100 dark:bg-gray-600" />
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700 mx-auto" />
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <div className="h-4 w-20 rounded bg-gray-200 dark:bg-gray-700 mx-auto" />
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <div className="h-9 w-9 rounded-lg bg-gray-200 dark:bg-gray-700 mx-auto" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (!sortedInquiries.length) {
    return (
      <div className="w-full px-0">
        <EmptyState
          icon={<MessageSquare className="mx-auto" />}
          title="لا توجد استفسارات"
          description="لم تُسجّل أي استفسارات حتى الآن"
          variant="cool"
        />
      </div>
    );
  }

  return (
    <div className="w-full px-0">
      <div className="bg-white dark:bg-gray-800/95 rounded-xl shadow-sm border border-gray-200/60 dark:border-gray-700/40 overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800">
          <table className="w-full min-w-[600px] sm:min-w-full" dir="rtl">
            <thead className="bg-gray-50 dark:bg-gray-800/80 border-b-2 border-gray-200/80 dark:border-gray-600/40">
              <tr>
                <th className="px-2 sm:px-3 py-2 text-right text-xs font-bold text-gray-700 dark:text-gray-200 font-cairo tracking-tight">
                  العميل
                </th>
                <th className="px-2 sm:px-3 py-2 text-center text-xs font-bold text-gray-700 dark:text-gray-200 font-cairo tracking-tight">
                  الملاحظات
                </th>
                <th className="px-2 sm:px-3 py-2 text-center text-xs font-bold text-gray-700 dark:text-gray-200 font-cairo tracking-tight">
                  التاريخ
                </th>
                <th className="px-2 sm:px-3 py-2 text-center text-xs font-bold text-gray-700 dark:text-gray-200 font-cairo tracking-tight">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800/95 divide-y divide-gray-100 dark:divide-gray-700/30">
              {sortedInquiries.map((inv) => (
                <tr
                  key={inv.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors duration-150 bg-white dark:bg-gray-800/95"
                >
                  {/* Phone with icon + copy */}
                  <td className="px-3 sm:px-4 py-3">
                    <div className="flex items-start gap-2.5">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md bg-brand-blue-600 dark:bg-brand-blue-500">
                        <MessageSquare className="w-5 h-5 text-white drop-shadow-sm" />
                      </div>
                      <div className="flex flex-col min-w-0 flex-1 gap-0.5">
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100 font-cairo truncate leading-tight">
                          استفسار
                        </span>
                        {inv.customer_phone ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-cairo font-medium leading-tight" dir="ltr">
                              {inv.customer_phone}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyPhone(inv.customer_phone, inv.id);
                              }}
                              className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors flex-shrink-0"
                              title="نسخ الرقم"
                              aria-label="نسخ رقم الهاتف"
                            >
                              {copiedPhoneId === inv.id ? (
                                <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                              ) : (
                                <Copy className="w-3 h-3 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-gray-500 font-cairo">—</span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Notes */}
                  <td className="px-3 sm:px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <div className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 font-cairo truncate max-w-[180px]">
                        {inv.notes || '—'}
                      </span>
                    </div>
                  </td>

                  {/* Date */}
                  <td className="px-3 sm:px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 font-cairo whitespace-nowrap">
                        {formatGregorianDate(inv.created_at)}
                      </span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-3 sm:px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => onCall?.({ customer: { phone: inv.customer_phone }, orders: [], services: [] })}
                        className="p-2 rounded-lg bg-brand-blue-600 hover:bg-brand-blue-700 dark:bg-brand-blue-700 dark:hover:bg-brand-blue-600 text-white transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:ring-offset-2"
                        title="اتصال"
                        aria-label="اتصال بالعميل"
                      >
                        <PhoneCall className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InquiriesTable;
