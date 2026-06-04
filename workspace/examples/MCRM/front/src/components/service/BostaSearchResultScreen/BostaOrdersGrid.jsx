/**
 * BostaOrdersGrid - Order cards: same creative structure as ticket cards (strip + icon + content).
 * Shows: مغلق + تذكرة when locked, tracking link, نوع/حالة, وصف الطرد, footer time.
 * Data: trackingNumber/tracking_number, package.description, type, status, creationTimestamp/createdAt/timestamps.created
 */
import React, { useState } from 'react';
import { Package } from 'lucide-react';
import { formatDistanceToNowAr, getRelativeTime } from '../../../utils/core/date';
import { getBostaCodValue, getBostaFeesValues, getBostaOrderDisplayNote, bostaFeesChipVisible } from '../../../utils/bosta/cod';
import { BostaCodMainChip, BostaFeesCompactChip } from './BostaOrderMoneyChips';
import { translateOrderType, getBostaOrderStatus, getStatusBadgeColor, getStatusLabel } from './constants';

const MAX_PACKAGE_DESCRIPTION_LENGTH = 80;

export default function BostaOrdersGrid({
    customerOrders = [],
    existingServices = [],
    selectedOrder,
    onOrderSelect,
    hideTitle = false,
}) {
    const [expandedDescriptions, setExpandedDescriptions] = useState({});

    if (!customerOrders || customerOrders.length === 0) return null;

    return (
        <div className={`flex flex-col min-h-0 ${hideTitle ? 'flex-1' : 'mb-4'}`}>
            {!hideTitle && (
                <h4 className="font-cairo font-bold text-sm text-gray-900 dark:text-gray-100 mb-3">
                    الطلبات {customerOrders.length > 0 && `(${customerOrders.length})`}
                </h4>
            )}
            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 overflow-y-auto scrollbar-hide items-start ${hideTitle ? 'flex-1 min-h-0' : 'max-h-[min(70vh,480px)]'}`}>
                {customerOrders.map((order, idx) => {
                    const trackingNumber = order.trackingNumber || order.tracking_number;
                    const existingService = Array.isArray(existingServices)
                        ? existingServices.find(s =>
                            (s.original_tracking === trackingNumber) ||
                            (s.original_tracking_number === trackingNumber))
                        : null;
                    const isLocked = !!existingService;
                    const isSelected = selectedOrder?.trackingNumber === trackingNumber || selectedOrder?.tracking_number === trackingNumber;

                    const orderDate = order.createdAt || order.creationTimestamp || order.timestamps?.created
                        ? new Date(order.createdAt || order.creationTimestamp || order.timestamps?.created)
                        : null;
                    const relativeTime = orderDate ? getRelativeTime(orderDate.toISOString()) : formatDistanceToNowAr(order.creationTimestamp || order.createdAt);
                    const packageDescription = getBostaOrderDisplayNote(order, existingServices);
                    const packageDescriptionKey = `bosta-pkg-${idx}`;
                    const isPackageExpanded = expandedDescriptions[packageDescriptionKey] || false;
                    const orderType = order.type || 'Send';
                    const bostaStatus = getBostaOrderStatus(order);
                    const orderTypeLabel = translateOrderType(orderType);
                    const bostaOrderId = order.id || order.order_id || trackingNumber;
                    const bostaLink = bostaOrderId && String(bostaOrderId).trim().length >= 3
                        ? `https://business.bosta.co/orders/${bostaOrderId}`
                        : null;
                    const codValue = getBostaCodValue(order) ?? 0;
                    const fees = getBostaFeesValues(order);
                    const hasCod = codValue !== 0;
                    const hasFeesChip = bostaFeesChipVisible(fees);

                    return (
                        <div key={trackingNumber || idx} className="min-w-0">
                        <div
                            role={isLocked ? 'presentation' : 'button'}
                            tabIndex={isLocked ? -1 : 0}
                            onClick={() => !isLocked && onOrderSelect?.(order)}
                            onKeyDown={(e) => { if (!isLocked && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onOrderSelect?.(order); } }}
                            className={`
                                w-full flex items-start gap-0 rounded-xl border transition-all duration-200 text-right bg-white dark:bg-gray-800 min-h-0 overflow-hidden
                                ${isLocked
                                    ? 'border-brand-blue-400 dark:border-brand-blue-600 ring-2 ring-brand-blue-200 dark:ring-brand-blue-800 shadow-md cursor-default'
                                    : isSelected
                                        ? 'border-brand-blue-500 dark:border-brand-blue-400 ring-2 ring-brand-blue-300 dark:ring-brand-blue-700 shadow-md cursor-pointer'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-red-600 dark:hover:border-red-800 hover:bg-red-50/50 dark:hover:bg-red-900/10 hover:shadow-md cursor-pointer'
                                }
                                focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-500
                            `}
                            dir="rtl"
                            aria-label={isLocked ? `طلب ${trackingNumber} مقفل` : `طلب ${trackingNumber}`}
                        >
                            {/* Accent strip — Bosta red (same pattern as ticket type strip) */}
                            <div className="w-1 flex-shrink-0 self-stretch bg-brand-red-500" aria-hidden />
                            {/* Icon column — always visible for consistent card shape */}
                            <div className="flex-shrink-0 flex flex-col items-center gap-1 p-3 pl-2">
                                <div className="w-10 h-10 rounded-lg bg-brand-red-600 dark:bg-brand-red-500 flex items-center justify-center shadow-sm">
                                    <Package className="w-5 h-5 text-white" />
                                </div>
                            </div>
                            {/* Content — same padding as ticket cards */}
                            <div className="flex-1 min-w-0 flex flex-col pt-3 pb-3 pe-3 ps-2">
                                {/* Status / Lock + Tracking + Ticket badge + Type badge — same horizontal bar */}
                                <div className="flex items-center justify-between gap-2 mb-2 w-full flex-wrap">
                                    <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                                        {bostaLink && !isLocked ? (
                                            <a
                                                href={bostaLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="font-cairo font-bold text-brand-red-600 dark:text-brand-red-400 hover:text-brand-red-700 dark:hover:text-brand-red-300 text-sm tracking-tight cursor-pointer shrink-0"
                                                dir="ltr"
                                            >
                                                #{trackingNumber}
                                            </a>
                                        ) : (
                                            <span className="font-cairo font-bold text-gray-900 dark:text-gray-100 text-sm tracking-tight shrink-0" dir="ltr">
                                                #{trackingNumber}
                                            </span>
                                        )}
                                        {existingService && (
                                            <span className="text-[10px] font-bold text-accent-green-700 dark:text-accent-green-400 bg-accent-green-50/50 dark:bg-accent-green-900/10 px-2 py-0.5 rounded-md border border-accent-green-200/50 dark:border-accent-green-800/30 shrink-0">
                                                تذكرة: {existingService.ticket_number?.split('-').pop() || '—'}
                                            </span>
                                        )}
                                    </div>
                                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-md whitespace-nowrap border shrink-0 ${getStatusBadgeColor(bostaStatus).replace('bg-ui-warning-100', 'bg-ui-warning-100 border-ui-warning-200').replace('bg-brand-blue-100', 'bg-brand-blue-100 border-brand-blue-200').replace('bg-accent-green-100', 'bg-accent-green-100').replace('bg-gray-100', 'bg-gray-100 border-gray-200')}`}>
                                        {orderTypeLabel !== 'توصيل عادي' ? orderTypeLabel : getStatusLabel(bostaStatus)}
                                    </span>
                                </div>

                                {/* وصف الطرد — show when we have description */}
                                {packageDescription && (
                                    <div className="mb-1.5">
                                        <div className="rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50/80 dark:bg-gray-700/40 p-1.5 space-y-1">
                                            <div className="flex items-center gap-1.5">
                                                <div className="flex-shrink-0 w-6 h-6 rounded-md bg-brand-red-100 dark:bg-brand-red-900/40 flex items-center justify-center">
                                                    <Package className="w-3 h-3 text-brand-red-600 dark:text-brand-red-400" />
                                                </div>
                                                <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 font-cairo">
                                                    وصف الطرد
                                                </span>
                                            </div>
                                            <div className="text-[11px] sm:text-xs font-medium text-gray-800 dark:text-gray-200 font-cairo leading-relaxed">
                                                {packageDescription.length > MAX_PACKAGE_DESCRIPTION_LENGTH ? (
                                                    <>
                                                        {!isPackageExpanded ? (
                                                            <span className="line-clamp-2 break-words">{packageDescription.substring(0, MAX_PACKAGE_DESCRIPTION_LENGTH)}...</span>
                                                        ) : (
                                                            <span className="whitespace-pre-line break-words">{packageDescription}</span>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setExpandedDescriptions(prev => ({ ...prev, [packageDescriptionKey]: !prev[packageDescriptionKey] }));
                                                            }}
                                                            className="mt-1 text-brand-blue-600 dark:text-brand-blue-400 hover:text-brand-blue-700 dark:hover:text-brand-blue-300 text-[10px] font-semibold font-cairo inline-flex items-center gap-1"
                                                        >
                                                            {isPackageExpanded ? 'عرض أقل' : 'عرض المزيد'}
                                                        </button>
                                                    </>
                                                ) : (
                                                    <span className="break-words">{packageDescription}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Footer: relative time + COD + Bosta fees badges */}
                                <footer className="mt-auto pt-2 border-t border-gray-100 dark:border-gray-700/50 flex items-center justify-between gap-2 flex-wrap flex-row-reverse">
                                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 font-cairo min-w-0 shrink-0">
                                        <svg className="w-4 h-4 opacity-80 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        <span>{relativeTime}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-wrap justify-start">
                                        {hasCod && <BostaCodMainChip codValue={codValue} bostaOrder={order} />}
                                        {hasFeesChip && <BostaFeesCompactChip fees={fees} />}
                                    </div>
                                </footer>
                            </div>
                        </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
