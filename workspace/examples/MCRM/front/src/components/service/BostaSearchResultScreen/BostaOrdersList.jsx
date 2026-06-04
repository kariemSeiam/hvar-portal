/**
 * BostaOrdersList - طلبات Bosta list with ServiceModalViewer-inspired styling
 * Updated with brand-red accent bar, lock indicators, Bosta links, status badges
 */
import { Package, ExternalLink, Lock, CheckCircle } from 'lucide-react';

export default function BostaOrdersList({ orders = [], onSelectOrder, selectedOrderId, onLinkOrder }) {
    if (!orders || orders.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex items-center gap-2.5">
                    <span className="w-1 h-6 rounded-full bg-brand-red-500" />
                    <Package className="w-4 h-4 text-brand-red-600 dark:text-brand-red-400 flex-shrink-0" />
                    <span className="font-cairo font-bold text-sm text-gray-900 dark:text-gray-100">طلبات Bosta</span>
                </div>
                <div className="p-4 text-center">
                    <p className="font-cairo text-xs text-gray-500 dark:text-gray-400">لا توجد طلبات</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
            {/* Header with brand-red accent */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <span className="w-1 h-6 rounded-full bg-brand-red-500" />
                    <Package className="w-4 h-4 text-brand-red-600 dark:text-brand-red-400 flex-shrink-0" />
                    <span className="font-cairo font-bold text-sm text-gray-900 dark:text-gray-100">طلبات Bosta</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-brand-red-100 dark:bg-brand-red-900/50 text-brand-red-700 dark:text-brand-red-300">
                    {orders.length}
                </span>
            </div>

            {/* Orders list */}
            <div className="p-2 space-y-1.5 max-h-48 overflow-y-auto scrollbar-hide" dir="rtl">
                {orders.map((order, idx) => {
                    const trackingNumber = order.trackingNumber || order.tracking_number;
                    const isSelected = selectedOrderId === trackingNumber;
                    const isLinked = order.linked_ticket_id !== null;

                    return (
                        <div
                            key={trackingNumber || idx}
                            onClick={() => !isLinked && onSelectOrder?.(order)}
                            className={`
                                relative flex items-center justify-between gap-2
                                px-3 py-2.5
                                min-h-[44px]
                                rounded-lg
                                ${isSelected
                                    ? 'bg-gradient-to-r from-brand-red-50 to-rose-50 dark:from-red-900/40 dark:to-rose-900/30 ring-1 ring-brand-red-200 dark:ring-red-800 cursor-pointer'
                                    : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-white dark:hover:bg-gray-800 cursor-pointer'
                                }
                                border border-gray-200 dark:border-gray-600
                                transition-all duration-200
                                focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-500
                            `}
                        >
                            {/* Left: Tracking + info */}
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                {/* Lock indicator if linked */}
                                {isLinked && (
                                    <Lock className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 flex-shrink-0" title={`مرتبط: ${order.linked_ticket_number}`} />
                                )}

                                {/* Tracking number with link */}
                                <a
                                    href={`https://business.bosta.co/orders/${trackingNumber}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className={`
                                        font-cairo font-medium text-xs
                                        ${isSelected
                                            ? 'text-brand-red-700 dark:text-brand-red-300'
                                            : 'text-gray-900 dark:text-gray-100 hover:text-brand-blue-600'
                                        }
                                        truncate hover:underline
                                        focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-500
                                        flex-shrink min-w-0
                                    `}
                                    dir="ltr"
                                >
                                    #{trackingNumber}
                                </a>

                                {/* Status */}
                                {order.status && (
                                    <span className={`
                                        text-[10px] font-medium px-1.5 py-0.5 rounded whitespace-nowrap
                                        ${order.status === 'delivered'
                                            ? 'bg-accent-green-100 text-accent-green-700 border-accent-green-200'
                                            : 'bg-gray-100 text-gray-700 border-gray-300'
                                        }
                                    `}>
                                        {order.status === 'delivered' ? 'تم التسليم' : 'قيد المعالجة'}
                                    </span>
                                )}
                            </div>

                            {/* Right: External link icon */}
                            <ExternalLink className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
