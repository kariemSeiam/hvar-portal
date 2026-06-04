/**
 * BostaOrderItem - Renders a single Bosta order with full details
 * Matches ServiceModalViewer order item design (lines 800-1158)
 */
import { useState } from 'react';
import { Package, ExternalLink, Calendar, Star, ChevronDown, ChevronUp, User, Phone, Copy, Check } from 'lucide-react';
import { formatDateOnly, getRelativeTime } from '../../../utils/core/date';
import { getBostaCodValue, getBostaFeesValues, getBostaOrderDisplayNote, bostaFeesChipVisible } from '../../../utils/bosta/cod';
import { BostaCodMainChip, BostaFeesCompactChip } from './BostaOrderMoneyChips';
import { translateOrderType, getBostaOrderStatus, getStatusBadgeColor, getStatusLabel } from './constants';

// Helper: Get package type label
const getPackageTypeLabel = (type) => {
    if (!type) return null;
    const typeLower = type.toLowerCase();
    const translations = {
        'small': 'صغير',
        'medium': 'متوسط',
        'large': 'كبير',
        'parcel': 'طرد',
        'package': 'طرد',
        'box': 'صندوق',
        'envelope': 'ظرف'
    };
    return translations[typeLower] || type;
};

export default function BostaOrderItem({
    order,
    index = 0,
    isCompact = false,
    isSelected = false,
    isLinked = false,
    isTrackingLinked = false,
    matchedTrackingType = null,
    onSelectOrder,
    linkedServices = [],
}) {
    const [copiedPhone, setCopiedPhone] = useState(null);

    // Order data extraction
    const orderDate = order.createdAt || order.timestamps?.created ? new Date(order.createdAt || order.timestamps.created) : null;
    const formattedDate = orderDate ? formatDateOnly(orderDate.toISOString()) : null;
    const relativeTime = orderDate ? getRelativeTime(orderDate.toISOString()) : null;

    const displayNote = getBostaOrderDisplayNote(order, linkedServices);
    const rawNotesTrim = typeof order.notes === 'string' ? order.notes.trim() : '';
    const extraNotes =
        rawNotesTrim && rawNotesTrim !== (displayNote || '').trim() ? rawNotesTrim : null;
    const showLeftIconColumn = Boolean(displayNote || extraNotes);
    const cod = getBostaCodValue(order) ?? 0;
    const fees = getBostaFeesValues(order);
    const hasFeesChip = bostaFeesChipVisible(fees);
    const packageTypeRaw = order.package?.type || order.type || null;
    const itemsCount = order.package?.itemsCount || order.itemsCount || null;
    const packageType = getPackageTypeLabel(packageTypeRaw);
    const orderType = order.type || 'Send';
    const orderTypeLabel = translateOrderType(orderType);
    const starName = order.star?.name || null;
    const starPhone = order.star?.phone || null;
    const communicationAttempts = order.communication?.attempts || 0;
    const callsCount = order.communication?.calls || 0;

    // Customer Phones
    const customerPhone1 = order.customer?.phone || null;
    const customerPhone2 = order.customer?.secondPhone || null;

    // Tracking number and link
    const trackingNumber = order.trackingNumber || order.tracking_number || '-';
    const extractOrderId = () => {
        if (order.id) return String(order.id);
        if (order.order_id) return String(order.order_id);
        if (order.trackingNumber) {
            const parts = order.trackingNumber.split('-');
            const lastPart = parts[parts.length - 1];
            if (lastPart && /^\d+$/.test(lastPart)) {
                return lastPart;
            }
            const numericMatch = order.trackingNumber.match(/\d+/);
            if (numericMatch) {
                return numericMatch[0];
            }
        }
        return null;
    };
    const bostaOrderId = extractOrderId();
    const bostaLink = bostaOrderId ? `https://business.bosta.co/orders/${bostaOrderId}` : null;

    const bostaStatus = getBostaOrderStatus(order);

    // Extract Address Info
    const displayCity = order.customerAddress?.city || '';
    const displayZone = order.customerAddress?.zone || '';
    const addressDetails = [displayCity, displayZone].filter(Boolean).join('، ');

    // Extract Timestamps
    const timeline = order.status?.timeline || [];
    const lastUpdate = order.timestamps?.updated ? new Date(order.timestamps.updated) : null;
    const scheduledDate = order.timestamps?.scheduled ? new Date(order.timestamps.scheduled) : null;

    // Removed toggle logic

    // Compact mode - simplified rendering
    if (isCompact) {
        return (
            <div
                onClick={() => onSelectOrder?.(order)}
                className={`
                    relative flex items-center justify-between gap-2
                    px-3 py-2.5
                    min-h-[44px]
                    rounded-lg
                    ${isTrackingLinked
                        ? 'bg-gradient-to-r from-brand-red-50 to-rose-50 dark:from-brand-red-900/40 dark:to-rose-900/30 ring-1 ring-brand-red-200 dark:ring-brand-red-800 cursor-pointer'
                        : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-white dark:hover:bg-gray-800 cursor-pointer'
                    }
                    border border-gray-200 dark:border-gray-600
                    transition-all duration-200
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-500
                `}
                dir="rtl"
            >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    {bostaLink && trackingNumber !== '-' ? (
                        <a
                            href={bostaLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="font-cairo font-medium text-xs text-gray-900 dark:text-gray-100 hover:text-brand-blue-600 truncate hover:underline flex-shrink min-w-0"
                            dir="ltr"
                        >
                            #{trackingNumber}
                        </a>
                    ) : (
                        <span className="font-cairo font-medium text-xs text-gray-900 dark:text-gray-100 truncate">
                            #{trackingNumber}
                        </span>
                    )}
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded whitespace-nowrap ${getStatusBadgeColor(bostaStatus)}`}>
                        {getStatusLabel(bostaStatus)}
                    </span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
            </div>
        );
    }

    // Full mode - detailed rendering matching ServiceModalViewer
    return (
        <div
            onClick={() => !isLinked && onSelectOrder?.(order)}
            className={`
                w-full flex items-start gap-3 p-3.5 rounded-xl border transition-all duration-200 text-right
                ${isLinked
                    ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 cursor-not-allowed opacity-75'
                    : isSelected
                        ? 'border-brand-blue-500 bg-brand-blue-50 dark:bg-brand-blue-900/20 ring-2 ring-brand-blue-300 dark:ring-brand-blue-700 shadow-md cursor-pointer'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-brand-blue-400 dark:hover:border-brand-blue-600 hover:bg-brand-blue-50/50 dark:hover:bg-brand-blue-900/10 hover:shadow-md cursor-pointer'
                }
            `}
            dir="rtl"
        >
            {/* Left Side: Icon + Star Button */}
            <div className="flex flex-col items-center gap-2 flex-shrink-0">
                {showLeftIconColumn && (
                    <div className="w-12 h-12 rounded-xl bg-brand-red-600 dark:bg-brand-red-500 flex items-center justify-center shadow-sm">
                        <Package className="w-6 h-6 text-white" />
                    </div>
                )}
                {starName && (
                    <div className="flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg border bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800/50">
                        <User className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span className="text-[9px] font-semibold text-amber-700 dark:text-amber-300 font-cairo whitespace-nowrap leading-tight">
                            المندوب
                        </span>
                    </div>
                )}
            </div>

            <div className="flex-1 min-w-0">
                {/* Top Row: Order Number and Status */}
                <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] sm:text-xs font-semibold text-gray-600 dark:text-gray-400 font-cairo">
                                طلب Bosta
                            </span>
                            {isTrackingLinked && (
                                <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full bg-brand-blue-50 dark:bg-brand-blue-900/30 text-brand-blue-700 dark:text-brand-blue-300 font-bold font-cairo inline-flex items-center gap-1">
                                    <span>مرتبط بالتذكرة</span>
                                    {matchedTrackingType === 'send' && <span>(إرسال)</span>}
                                    {matchedTrackingType === 'receive' && <span>(استلام)</span>}
                                    {matchedTrackingType === 'original' && <span>(أصلي)</span>}
                                </span>
                            )}
                        </div>
                        {bostaLink && trackingNumber !== '-' ? (
                            <a
                                href={bostaLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-1.5 text-xs font-bold text-brand-red-600 dark:text-brand-red-400 hover:text-brand-red-700 dark:hover:text-brand-red-300 font-cairo transition-colors"
                            >
                                <span>#{trackingNumber}</span>
                                <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                            </a>
                        ) : (
                            <span className="text-xs font-bold text-brand-red-600 dark:text-brand-red-400 font-cairo">
                                #{trackingNumber}
                            </span>
                        )}
                    </div>
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold inline-flex items-center gap-1 shadow-sm ${getStatusBadgeColor(bostaStatus)}`}>
                        {getStatusLabel(bostaStatus)}
                    </span>
                </div>

                {/* Package Info Row */}
                <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                    {(packageType || itemsCount || orderType) && (
                        <div className="flex items-center gap-2 flex-wrap">
                            {orderType && (
                                <span className="text-[10px] px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-md font-medium font-cairo">
                                    {orderTypeLabel}
                                </span>
                            )}
                            {packageType && (
                                <span className="text-[10px] px-2 py-0.5 bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 rounded-md font-medium font-cairo">
                                    {packageType}
                                </span>
                            )}
                            {itemsCount && (
                                <span className="text-[10px] px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md font-medium font-cairo">
                                    {itemsCount} عنصر
                                </span>
                            )}
                        </div>
                    )}
                    {formattedDate && relativeTime && (
                        <div className="flex flex-col items-end gap-1 text-xs text-gray-600 dark:text-gray-300 font-cairo flex-shrink-0">
                            <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-700/50 px-2 py-1 rounded-md border border-gray-100 dark:border-gray-700/50">
                                <Calendar className="w-3.5 h-3.5 flex-shrink-0 text-brand-blue-500" />
                                <span className="font-semibold text-gray-700 dark:text-gray-200">{formattedDate}</span>
                                <span className="text-gray-400 dark:text-gray-500 text-[10px]">•</span>
                                <span className="text-gray-500 dark:text-gray-400">{relativeTime}</span>
                            </div>
                            {lastUpdate && (
                                <span className="text-[10px] text-gray-400 dark:text-gray-500 px-1">
                                    آخر تحديث: {getRelativeTime(lastUpdate.toISOString())}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Client Details Row (Phones + Address Chips) */}
                {(customerPhone1 || customerPhone2 || displayCity || displayZone) && (
                    <div className="mb-2.5 flex flex-wrap items-center gap-2 p-2 bg-gray-50/70 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700">
                        {/* Phones */}
                        {customerPhone1 && (
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600 shadow-sm group">
                                <Phone className="w-3 h-3 text-brand-blue-500" />
                                <a href={`tel:${customerPhone1}`} className="text-xs font-bold text-gray-800 dark:text-gray-200 hover:text-brand-blue-600 dark:hover:text-brand-blue-400 font-cairo" onClick={(e) => e.stopPropagation()}>
                                    {customerPhone1}
                                </a>
                                <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(customerPhone1); setCopiedPhone(customerPhone1); setTimeout(() => setCopiedPhone(null), 2000); }} className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors" title="نسخ الرقم">
                                    {copiedPhone === customerPhone1 ? <Check className="w-3 h-3 text-green-600 dark:text-green-400" /> : <Copy className="w-3 h-3 text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300" />}
                                </button>
                            </div>
                        )}
                        {customerPhone2 && (
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600 shadow-sm group">
                                <Phone className="w-3 h-3 text-brand-blue-500" />
                                <a href={`tel:${customerPhone2}`} className="text-xs font-bold text-gray-800 dark:text-gray-200 hover:text-brand-blue-600 dark:hover:text-brand-blue-400 font-cairo" onClick={(e) => e.stopPropagation()}>
                                    {customerPhone2}
                                </a>
                                <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(customerPhone2); setCopiedPhone(customerPhone2); setTimeout(() => setCopiedPhone(null), 2000); }} className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors" title="نسخ الرقم">
                                    {copiedPhone === customerPhone2 ? <Check className="w-3 h-3 text-green-600 dark:text-green-400" /> : <Copy className="w-3 h-3 text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300" />}
                                </button>
                            </div>
                        )}
                        {/* Address Chips */}
                        {displayCity && (
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-brand-blue-50 dark:bg-brand-blue-900/20 rounded-md border border-brand-blue-100 dark:border-brand-blue-800/50">
                                <svg className="w-3 h-3 text-brand-blue-600 dark:text-brand-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="text-xs font-bold text-brand-blue-700 dark:text-brand-blue-300 font-cairo">{displayCity}</span>
                            </div>
                        )}
                        {displayZone && (
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 font-cairo">{displayZone}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Package / shipment description (unified + notes passthrough) */}
                {displayNote && (
                    <div className="mb-2.5 p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-md border border-gray-200 dark:border-gray-600">
                        <div className="flex items-center gap-1.5 mb-1">
                            <div className="relative">
                                <div className="absolute inset-0 bg-brand-red-400 dark:bg-brand-red-500 rounded-full opacity-20 animate-pulse"></div>
                                <div className="relative bg-brand-red-600 dark:bg-brand-red-500 p-1 rounded-lg shadow-sm">
                                    <Package className="w-3 h-3 text-white" />
                                </div>
                            </div>
                            <span className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 font-cairo">
                                وصف الطرد:
                            </span>
                        </div>
                        <div className="text-xs text-gray-800 dark:text-gray-200 font-cairo leading-relaxed whitespace-pre-line line-clamp-3">
                            {displayNote}
                        </div>
                    </div>
                )}

                {/* Extra Bosta notes only when different from merged description */}
                {extraNotes && (
                    <div className="mb-2.5 p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-md border border-gray-200 dark:border-gray-600">
                        <div className="text-xs text-gray-700 dark:text-gray-300 font-cairo leading-relaxed line-clamp-3">
                            {extraNotes}
                        </div>
                    </div>
                )}

                {/* Timeline Info (Flat) */}
                {timeline && timeline.length > 0 && (
                    <div className="mb-2.5 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm max-h-[120px] overflow-y-auto custom-scrollbar">
                        <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-gray-100 dark:border-gray-700/50 sticky top-0 bg-white dark:bg-gray-800 z-10">
                            <div className="w-1.5 h-1.5 rounded-full bg-brand-blue-500 animate-pulse"></div>
                            <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 font-cairo">
                                مسار الشحنة:
                            </span>
                        </div>
                        <div className="space-y-2">
                            {timeline.map((event, idx) => (
                                <div key={idx} className="flex items-start gap-2 relative">
                                    {idx < timeline.length - 1 && (
                                        <div className="absolute top-4 bottom-[-12px] right-1.5 w-0.5 bg-gray-100 dark:bg-gray-700"></div>
                                    )}
                                    <div className="w-3 h-3 rounded-full border-2 border-brand-blue-500 bg-white dark:bg-gray-800 mt-1 flex-shrink-0 z-10"></div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[11px] font-semibold text-gray-800 dark:text-gray-200 font-cairo truncate">
                                            {event.value || event.state || "تحديث حالة"}
                                        </div>
                                        {event.date && (
                                            <div className="text-[9px] text-gray-500 dark:text-gray-400 font-cairo mt-0.5">
                                                {formatDateOnly(event.date)} • {getRelativeTime(event.date)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Financial Info — same chips as Bosta grid (main COD + single Bosta fees chip) */}
                {(cod !== 0 || hasFeesChip) && (
                    <div className="mb-2.5 flex items-center gap-2 sm:gap-3 flex-wrap">
                        {cod !== 0 && <BostaCodMainChip codValue={cod} bostaOrder={order} />}
                        {hasFeesChip && <BostaFeesCompactChip fees={fees} />}
                    </div>
                )}

                {/* Fixed Star Details */}
                {starName && (
                    <div className="mt-2.5 flex items-center justify-between gap-3 p-2.5 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 rounded-lg border border-amber-100 dark:border-amber-900/30">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="p-1.5 rounded-md bg-amber-100 dark:bg-amber-800/50 flex-shrink-0 text-amber-700 dark:text-amber-300">
                                <User className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-xs font-bold text-amber-900 dark:text-amber-100 font-cairo truncate">
                                    {starName}
                                </span>
                                {starPhone && (
                                    <div className="flex items-center gap-1.5 mt-0.5 group">
                                        <a href={`tel:${starPhone}`} className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 hover:underline font-cairo" onClick={(e) => e.stopPropagation()}>
                                            {starPhone}
                                        </a>
                                        <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(starPhone); setCopiedPhone(starPhone); setTimeout(() => setCopiedPhone(null), 2000); }} className="p-0.5 hover:bg-amber-200 dark:hover:bg-amber-800 rounded transition-colors" title="نسخ الرقم">
                                            {copiedPhone === starPhone ? <Check className="w-2.5 h-2.5 text-green-600 dark:text-green-400" /> : <Copy className="w-2.5 h-2.5 text-amber-600/70 dark:text-amber-400/70 group-hover:text-amber-700 dark:group-hover:text-amber-300" />}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        {communicationAttempts > 0 && (
                            <div className="flex flex-col items-end gap-1 px-2 py-1 bg-white/60 dark:bg-gray-800/50 rounded border border-amber-200/50 dark:border-amber-700/30 flex-shrink-0">
                                <div className="flex items-center gap-1" title="محاولات التواصل">
                                    <Phone className="w-2.5 h-2.5 text-brand-red-500 dark:text-brand-red-400 flex-shrink-0" />
                                    <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 font-cairo">
                                        {communicationAttempts}
                                    </span>
                                </div>
                                {callsCount > 0 && (
                                    <div className="flex items-center gap-1" title="المكالمات المجابة">
                                        <Phone className="w-2.5 h-2.5 text-green-600 dark:text-green-400 flex-shrink-0" />
                                        <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 font-cairo">
                                            {callsCount}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
