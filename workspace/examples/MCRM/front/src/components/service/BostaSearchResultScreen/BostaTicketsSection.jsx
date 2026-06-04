/**
 * BostaTicketsSection - Type-grouped or chip-filtered service tickets (reusable)
 * showTypeChips + full: type filter chips (الكل + types), list sorted latest-first, card style.
 * Cards show: type, ticket#, status, notes (truncated), cost, items send/receive, time.
 */
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { FileText, Package, RotateCcw, Wrench, Truck, Settings } from 'lucide-react';
import { SERVICE_TYPE_CONFIG, SERVICE_TYPE_ORDER, DRAFT_TICKET_CONFIG } from './constants';
import { normalizeServiceTypeOrFallback } from '../../../constants/serviceTypes.js';
import {
    SERVICE_TYPE_ICONS as TYPE_ICONS,
    SERVICE_TYPE_STRIP_BG as TYPE_STRIP_BG,
    SERVICE_TYPE_TAB_STYLES as TYPE_CHIP_STYLES,
} from '../../../constants/serviceTypeUi.js';
import { getRelativeTime } from '../../../utils/core/date';
import { getServiceStatusBadgeColor, getServiceStatusLabel } from '../../../utils/service/utils';
import { getSafeNotesDisplay } from '../../../utils/ui/notes';
import { SessionStyleMoneyBadge } from '../../ui';

function ticketTypeKey(t) {
    return normalizeServiceTypeOrFallback(t?.service_type, { fallback: 'replacement' });
}

// Status badge helper - uses centralized service status utilities
function getTicketStatusBadge(status) {
    const s = (status || '').toLowerCase();
    
    // Handle draft status (not in serviceActionUtils)
    if (s === 'draft') {
        return {
            className: 'bg-accent-amber-100 text-accent-amber-800 border-accent-amber-200 dark:bg-accent-amber-900/30 dark:text-accent-amber-200 dark:border-accent-amber-700/60',
            label: 'مسودة'
        };
    }
    
    return {
        className: getServiceStatusBadgeColor(s),
        label: getServiceStatusLabel(s)
    };
}

const NOTES_TRUNCATE = 48;

function getItemsSummary(service) {
    const items = service?.items || service?.service_items || service?.order_items || [];
    if (!items.length) return { sendCount: 0, receiveCount: 0, isSell: false, send: [], receive: [] };
    const isSell = normalizeServiceTypeOrFallback(service?.service_type, { fallback: 'replacement' }) === 'sell';
    const send = items.filter((item) => (item.direction || '').toLowerCase() === 'send');
    const receive = items.filter((item) => (item.direction || '').toLowerCase() === 'receive');
    return { sendCount: send.length, receiveCount: receive.length, isSell, send, receive };
}

// Simple time ago formatter for draft tickets
const formatDistanceToNowAr = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    return `منذ ${diffDays} يوم`;
};

const FILTER_ALL = '__all__';

export default function BostaTicketsSection({
    tickets,
    onViewTicket,
    variant = 'compact',
    title,
    emptyMessage = 'لا توجد تذاكر سابقة',
    showTypeChips = false,
    onDraftConfirm,
    onDraftCall,
    onDraftDelete
}) {
    const [typeFilter, setTypeFilter] = useState(FILTER_ALL);
    const [expandedNotes, setExpandedNotes] = useState({});
    const [itemsTooltip, setItemsTooltip] = useState(null); // { serviceId, direction, items, anchorRect }
    const [tooltipReady, setTooltipReady] = useState(false); // for enter animation
    const itemsTooltipRef = useRef(null);

    useEffect(() => {
        if (!itemsTooltip) {
            setTooltipReady(false);
            return;
        }
        const t = requestAnimationFrame(() => setTooltipReady(true));
        return () => cancelAnimationFrame(t);
    }, [itemsTooltip]);

    useEffect(() => {
        if (!itemsTooltip) return;
        const close = (e) => {
            if (itemsTooltipRef.current && !itemsTooltipRef.current.contains(e.target) && !e.target.closest('[data-items-chip]')) setItemsTooltip(null);
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, [itemsTooltip]);

    // Separate drafts from confirmed
    const draftTickets = (Array.isArray(tickets) ? tickets : []).filter(t => !t.service_type || t.status === 'draft');
    const confirmedTickets = (Array.isArray(tickets) ? tickets : []).filter(t => t.service_type && t.status !== 'draft');

    // Sort by latest first (created_at desc)
    const sortedConfirmed = useMemo(() => {
        return [...confirmedTickets].sort((a, b) => {
            const da = a.created_at ? new Date(a.created_at).getTime() : 0;
            const db = b.created_at ? new Date(b.created_at).getTime() : 0;
            return db - da;
        });
    }, [confirmedTickets]);

    // Filter by type when chip selected
    const filteredTickets = useMemo(() => {
        if (typeFilter === FILTER_ALL) return sortedConfirmed;
        return sortedConfirmed.filter(t => ticketTypeKey(t) === typeFilter);
    }, [sortedConfirmed, typeFilter]);

    // Group confirmed tickets by type (for non-chip layout and for chip counts)
    const grouped = confirmedTickets.reduce((acc, t) => {
        const type = ticketTypeKey(t);
        if (!acc[type]) acc[type] = [];
        acc[type].push(t);
        return acc;
    }, {});

    const typesWithTickets = SERVICE_TYPE_ORDER.filter(t => grouped[t]?.length);

    // Render function for compact variant
    if (variant === 'compact') {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-y-auto scrollbar-hide flex-shrink-0 p-2 space-y-2 max-h-48">
                    {/* Drafts first */}
                    {draftTickets.length > 0 && (
                        <div className="rounded-xl border border-accent-amber-200 dark:border-accent-amber-700/60 bg-accent-amber-50 dark:bg-accent-amber-900/30 overflow-hidden">
                            <div className="px-3 py-2.5 border-b border-accent-amber-200 dark:border-accent-amber-700/30 flex items-center gap-2">
                                <span className={`w-1 h-5 rounded-full ${DRAFT_TICKET_CONFIG.solid}`} />
                                <span className="font-cairo font-bold text-xs text-accent-amber-800 dark:text-accent-amber-200">{DRAFT_TICKET_CONFIG.label}</span>
                                <span className="text-xs text-accent-amber-600 dark:text-accent-amber-400">({draftTickets.length})</span>
                            </div>
                            <div className="p-2 space-y-1.5 max-h-28 overflow-y-auto">
                                {draftTickets.map((draft) => (
                                    <div
                                        key={draft.id}
                                        onClick={() => onViewTicket(draft)}
                                        className="w-full text-right flex items-center justify-between gap-2 px-3 py-2.5 min-h-[44px] rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-accent-amber-300 dark:hover:border-accent-amber-600 hover:bg-accent-50 dark:hover:bg-accent-900/30 transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-amber-500"
                                        role="button"
                                        tabIndex={0}
                                        aria-label={`مسودة: ${draft.notes || draft.customer_name}`}
                                        title={`${draft.notes || draft.customer_name} • ${formatDistanceToNowAr(draft.created_at)}`}
                                    >
                                        <span className="font-cairo font-medium text-xs text-gray-900 dark:text-gray-100 truncate max-w-[120px]">
                                            {draft.notes || draft.customer_name || '—'}
                                        </span>
                                        <span className="text-xs text-accent-amber-600 dark:text-accent-amber-400 flex-shrink-0 whitespace-nowrap">
                                            {formatDistanceToNowAr(draft.created_at)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Confirmed tickets by type */}
                    {typesWithTickets.map(type => {
                        const config = SERVICE_TYPE_CONFIG[type] || SERVICE_TYPE_CONFIG.replacement;
                        return (
                            <div key={type} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
                                <div className="px-3 py-2.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 flex items-center gap-2">
                                    <span className={`w-1 h-5 rounded-full ${config.solid}`} />
                                    <span className="font-cairo font-bold text-xs text-gray-900 dark:text-gray-100">{config.label}</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">({(grouped[type] || []).length})</span>
                                </div>
                                <div className="p-2 space-y-1.5 max-h-28 overflow-y-auto">
                                    {(grouped[type] || []).map((service) => (
                                        <button
                                            key={service.id}
                                            type="button"
                                            onClick={() => onViewTicket(service)}
                                            className="
                                                w-full text-right
                                                flex items-center justify-between gap-2
                                                px-3 py-2.5
                                                min-h-[44px]
                                                rounded-lg
                                                bg-white dark:bg-gray-800
                                                border border-gray-200 dark:border-gray-700
                                                hover:border-brand-blue-400 dark:hover:border-brand-blue-600
                                                hover:bg-gray-50 dark:hover:bg-gray-700/30
                                                transition-all duration-200
                                                focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-500 focus-visible:ring-offset-1
                                            "
                                        >
                                            <span className="font-cairo font-medium text-xs text-gray-900 dark:text-gray-100 truncate">
                                                {service.ticket_number?.split('-').pop() || service.id}
                                            </span>
                                            <span className="font-cairo text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                                                {service.status || '—'}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
            </div>
        );
    }

    // full variant with type chips: chips on top, grid 2 cols + vertical scroll (match BostaOrdersGrid)
    if (variant === 'full' && showTypeChips) {
        const hasBosta = (t) => !!(t.original_tracking || t.original_tracking_number || t.new_tracking_send || t.new_tracking_receive);
        return (
            <div className="flex flex-col min-h-0 flex-1 overflow-hidden">
                {title && <h4 className="font-cairo font-bold text-sm text-gray-900 dark:text-gray-100 mb-3 flex-shrink-0">{title}</h4>}
                {tickets && tickets.length > 0 ? (
                    <>
                        {/* Type filter chips: الكل + types that have tickets — theme sizing, touch-target, focus ring */}
                        <div
                            className="mb-3 flex w-full min-w-0 flex-nowrap items-center gap-2 sm:gap-2.5 overflow-x-auto scrollbar-hide [-webkit-overflow-scrolling:touch] flex-shrink-0"
                            dir="rtl"
                        >
                            <button
                                type="button"
                                onClick={() => setTypeFilter(FILTER_ALL)}
                                className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-lg py-2 ps-3 pe-3 text-[10px] sm:text-xs font-medium font-cairo transition-colors whitespace-nowrap touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-500 focus-visible:ring-offset-2 ${typeFilter === FILTER_ALL ? 'bg-brand-blue-100 dark:bg-brand-blue-900/30 text-brand-blue-700 dark:text-brand-blue-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                            >
                                <span className="shrink-0">الكل</span>
                                {confirmedTickets.length > 0 && (
                                    <span className={`inline-flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded-full px-1.5 text-[9px] font-bold tabular-nums leading-none ${typeFilter === FILTER_ALL ? 'bg-brand-blue-200 dark:bg-brand-blue-800' : 'bg-gray-200 dark:bg-gray-600'}`}>
                                        {confirmedTickets.length}
                                    </span>
                                )}
                            </button>
                            {SERVICE_TYPE_ORDER.map(type => {
                                const config = SERVICE_TYPE_CONFIG[type] || SERVICE_TYPE_CONFIG.replacement;
                                const count = (grouped[type] || []).length;
                                if (count === 0) return null;
                                const isActive = typeFilter === type;
                                const chipStyle = TYPE_CHIP_STYLES[type] || TYPE_CHIP_STYLES.replacement;
                                return (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setTypeFilter(type)}
                                        className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-lg py-2 ps-3 pe-3 text-[10px] sm:text-xs font-medium font-cairo transition-colors whitespace-nowrap touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-500 focus-visible:ring-offset-2 ${isActive ? chipStyle.active : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                    >
                                        <span className="shrink-0">{config.label}</span>
                                        <span className={`inline-flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded-full px-1.5 text-[9px] font-bold tabular-nums leading-none ${isActive ? chipStyle.badge : 'bg-gray-200 dark:bg-gray-600'}`}>
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Drafts first (when any) */}
                        {draftTickets.length > 0 && (
                            <div className="rounded-xl border border-accent-amber-200 dark:border-accent-amber-700/60 bg-accent-amber-50 dark:bg-accent-amber-900/30 overflow-hidden mb-3 flex-shrink-0">
                                <div className="px-3 py-2 border-b border-accent-amber-200 dark:border-accent-amber-700/30 flex items-center gap-2">
                                    <span className={`w-1 h-4 rounded-full ${DRAFT_TICKET_CONFIG.solid}`} />
                                    <span className="font-cairo font-bold text-xs text-accent-amber-800 dark:text-accent-amber-200">{DRAFT_TICKET_CONFIG.label}</span>
                                    <span className="text-xs text-accent-amber-600 dark:text-accent-amber-400">({draftTickets.length})</span>
                                </div>
                                <div className="p-2 space-y-1.5 max-h-28 overflow-y-auto">
                                    {draftTickets.map((draft) => (
                                        <button
                                            key={draft.id}
                                            type="button"
                                            onClick={() => onViewTicket(draft)}
                                            className="w-full text-right flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-accent-amber-400 dark:hover:border-accent-amber-600 font-cairo text-sm"
                                        >
                                            <span className="truncate">{draft.notes || draft.customer_name || '—'}</span>
                                            <span className="text-xs text-accent-amber-600 dark:text-accent-amber-400 flex-shrink-0">{formatDistanceToNowAr(draft.created_at)}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Grid 2 cols + vertical scroll — same layout as BostaOrdersGrid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 overflow-y-auto scrollbar-hide items-start flex-1 min-h-0">
                            {filteredTickets.length === 0 ? (
                                <p className="col-span-full font-cairo text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
                                    {typeFilter === FILTER_ALL ? emptyMessage : 'لا توجد تذاكر لهذا النوع'}
                                </p>
                            ) : (
                                filteredTickets.map((service) => {
                                    const type = ticketTypeKey(service);
                                    const config = SERVICE_TYPE_CONFIG[type] || SERVICE_TYPE_CONFIG.replacement;
                                    const TypeIcon = TYPE_ICONS[type] || RotateCcw;
                                    const ticketShort = service.ticket_number?.split('-').pop() || service.id;
                                    const createdAt = service.created_at ? new Date(service.created_at) : null;
                                    const relativeTime = createdAt ? getRelativeTime(createdAt.toISOString()) : '';
                                    const linkedToBosta = hasBosta(service);
                                    const hasCost = service.cost_adjustment != null && String(service.cost_adjustment).trim() !== '';
                                    const itemsSum = getItemsSummary(service);
                                    const hasItems = itemsSum.sendCount > 0 || itemsSum.receiveCount > 0;
                                    const notesKey = `notes-${service.id}`;
                                    const isNotesExpanded = expandedNotes[notesKey];
                                    const safeNotes = getSafeNotesDisplay(service.notes);
                                    const showNotesBlock = !!safeNotes;
                                    return (
                                        <div key={service.id} className="min-w-0">
                                        <div
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => onViewTicket(service)}
                                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onViewTicket(service); } }}
                                            className={`
                                                w-full flex items-start gap-0 rounded-xl border transition-all duration-200 text-right bg-white dark:bg-gray-800 min-h-0 overflow-hidden
                                                border-gray-200 dark:border-gray-700
                                                hover:border-red-600 dark:hover:border-red-800 hover:bg-red-50/50 dark:hover:bg-red-900/10 hover:shadow-md cursor-pointer
                                                focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-500
                                                ${linkedToBosta ? 'ring-1 ring-brand-red-200 dark:ring-brand-red-800/50' : ''}
                                            `}
                                            dir="rtl"
                                            aria-label={`تذكرة ${service.ticket_number || ticketShort}`}
                                        >
                                            {/* Accent strip (inline-start in RTL) */}
                                            <div className={`w-1 flex-shrink-0 self-stretch ${TYPE_STRIP_BG[type] || 'bg-brand-blue-500'}`} aria-hidden />
                                            {/* Type icon (match Bosta order card) */}
                                            <div className="flex-shrink-0 flex flex-col items-center gap-1 p-3 pl-2">
                                                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-sm`}>
                                                    <TypeIcon className="w-5 h-5 text-white" />
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0 flex flex-col pt-3 pb-3 pe-3 ps-2">
                                                {/* Header: type badge + ticket# + status badge (match order card) */}
                                                {(() => {
                                                    const statusBadge = getTicketStatusBadge(service.status);
                                                    return (
                                                        <div className="flex items-start justify-between gap-2 mb-2 w-full">
                                                            <div className="flex flex-col gap-1 min-w-0">
                                                                <div className="flex items-center gap-2 min-w-0 flex-wrap">
                                                                    <span className={`shrink-0 px-2 py-0.5 rounded-lg text-[10px] font-cairo font-bold ${config.bg} ${config.text} ${config.border}`}>
                                                                        {config.label}
                                                                    </span>
                                                                    <span className="font-cairo font-bold text-sm text-gray-900 dark:text-gray-100 truncate" dir="ltr">
                                                                        {service.ticket_number || ticketShort}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-md whitespace-nowrap border shrink-0 font-cairo ${statusBadge.className}`}>
                                                                {statusBadge.label}
                                                            </span>
                                                        </div>
                                                    );
                                                })()}

                                                {/* Notes block — styled like وصف الطرد */}
                                                {showNotesBlock && (
                                                    <div className="mb-2">
                                                        <div className="rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50/80 dark:bg-gray-700/40 p-2 space-y-1.5">
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-brand-blue-100 dark:bg-brand-blue-900/40 flex items-center justify-center">
                                                                    <FileText className="w-4 h-4 text-brand-blue-600 dark:text-brand-blue-400" />
                                                                </div>
                                                                <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 font-cairo">
                                                                    الملاحظات
                                                                </span>
                                                            </div>
                                                            <div className="text-xs text-gray-800 dark:text-gray-200 font-tajawal leading-relaxed">
                                                                {safeNotes.length > NOTES_TRUNCATE ? (
                                                                    <>
                                                                        <span className={!isNotesExpanded ? 'line-clamp-2' : 'whitespace-pre-line break-words'}>
                                                                            {isNotesExpanded ? safeNotes : `${safeNotes.slice(0, NOTES_TRUNCATE)}…`}
                                                                        </span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={(e) => { e.stopPropagation(); setExpandedNotes(prev => ({ ...prev, [notesKey]: !prev[notesKey] })); }}
                                                                            className="mt-1 text-brand-blue-600 dark:text-brand-blue-400 hover:text-brand-blue-700 dark:hover:text-brand-blue-300 text-[10px] font-semibold font-cairo inline-flex items-center gap-1"
                                                                        >
                                                                            {isNotesExpanded ? 'عرض أقل' : 'عرض المزيد'}
                                                                        </button>
                                                                    </>
                                                                ) : (
                                                                    <span className="break-words">{safeNotes}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Items — chip buttons like TicketsPage (إرسال blue, استلام green) + tooltip */}
                                                {hasItems && (
                                                    <div className="flex flex-wrap gap-1.5 mb-2" onClick={(e) => e.stopPropagation()}>
                                                        {itemsSum.isSell && itemsSum.sendCount > 0 && (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                                    const sendTracking = service.new_tracking_send || service.original_tracking || service.original_tracking_number;
                                                                    const receiveTracking = service.new_tracking_receive;
                                                                    setItemsTooltip({ serviceId: service.id, direction: 'send', items: itemsSum.send || [], sendTracking, receiveTracking, anchorRect: rect });
                                                                }}
                                                                className="flex items-center space-x-1 space-x-reverse px-2 py-1 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg text-[10px] font-medium transition-all duration-200 hover:scale-105 cursor-pointer"
                                                                data-items-chip
                                                            >
                                                                <Truck className="w-3 h-3" />
                                                                <span>إرسال</span>
                                                                <span className="bg-blue-200 dark:bg-blue-800 px-1 py-0.5 rounded-full text-[9px] font-bold">{itemsSum.sendCount}</span>
                                                            </button>
                                                        )}
                                                        {!itemsSum.isSell && itemsSum.sendCount > 0 && (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                                    const sendTracking = service.new_tracking_send || service.original_tracking || service.original_tracking_number;
                                                                    const receiveTracking = service.new_tracking_receive;
                                                                    setItemsTooltip({ serviceId: service.id, direction: 'send', items: itemsSum.send || [], sendTracking, receiveTracking, anchorRect: rect });
                                                                }}
                                                                className="flex items-center space-x-1 space-x-reverse px-2 py-1 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg text-[10px] font-medium transition-all duration-200 hover:scale-105 cursor-pointer"
                                                                data-items-chip
                                                            >
                                                                <Truck className="w-3 h-3" />
                                                                <span>إرسال</span>
                                                                <span className="bg-blue-200 dark:bg-blue-800 px-1 py-0.5 rounded-full text-[9px] font-bold">{itemsSum.sendCount}</span>
                                                            </button>
                                                        )}
                                                        {!itemsSum.isSell && itemsSum.receiveCount > 0 && (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                                    const sendTracking = service.new_tracking_send || service.original_tracking || service.original_tracking_number;
                                                                    const receiveTracking = service.new_tracking_receive;
                                                                    setItemsTooltip({ serviceId: service.id, direction: 'receive', items: itemsSum.receive || [], sendTracking, receiveTracking, anchorRect: rect });
                                                                }}
                                                                className="flex items-center space-x-1 space-x-reverse px-2 py-1 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-700 dark:text-green-300 rounded-lg text-[10px] font-medium transition-all duration-200 hover:scale-105 cursor-pointer"
                                                                data-items-chip
                                                            >
                                                                <Package className="w-3 h-3" />
                                                                <span>استلام</span>
                                                                <span className="bg-green-200 dark:bg-green-800 px-1 py-0.5 rounded-full text-[9px] font-bold">{itemsSum.receiveCount}</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Footer: relative time + price badge at end */}
                                                {(relativeTime || hasCost) && (
                                                    <div className="mt-auto pt-2 border-t border-gray-100 dark:border-gray-700/50 flex items-center justify-between gap-2">
                                                        <div className="flex items-center gap-1.5 text-[10px] font-medium text-gray-400 dark:text-gray-500 font-cairo min-w-0">
                                                            {relativeTime && (
                                                                <>
                                                                    <svg className="w-3.5 h-3.5 opacity-70 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                    </svg>
                                                                    <span>{relativeTime}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                        {hasCost && (
                                                            <span className="inline-flex items-center gap-1 shrink-0" dir="rtl">
                                                                <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 font-cairo whitespace-nowrap">
                                                                    التكلفة:
                                                                </span>
                                                                <SessionStyleMoneyBadge value={service.cost_adjustment} size="sm" />
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Floating items tooltip — below trigger, viewport-clamped, arrow, enter animation */}
                        {itemsTooltip?.items?.length > 0 && itemsTooltip?.anchorRect && (() => {
                            const r = itemsTooltip.anchorRect;
                            const gap = 8;
                            const tooltipW = 320;
                            const tooltipH = 200;
                            let top = r.bottom + gap;
                            let left = r.left + (r.width / 2) - (tooltipW / 2);
                            left = Math.max(12, Math.min(left, typeof window !== 'undefined' ? window.innerWidth - tooltipW - 12 : left));
                            const isAbove = typeof window !== 'undefined' && top + tooltipH > window.innerHeight - 12;
                            if (isAbove) top = r.top - tooltipH - gap;
                            const chipCenterX = r.left + (r.width / 2);
                            const arrowOffsetPx = Math.max(12, Math.min(tooltipW - 20, chipCenterX - left - 8));
                            return (
                                <div
                                    ref={itemsTooltipRef}
                                    role="tooltip"
                                    aria-live="polite"
                                    className={`fixed z-50 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-xl p-4 max-w-[min(20rem,90vw)] transition-all duration-200 ease-out ${tooltipReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[-6px]'}`}
                                    style={{
                                        top: `${top}px`,
                                        left: `${left}px`,
                                        width: 'max-content',
                                        maxWidth: 'min(20rem, 90vw)',
                                        boxShadow: 'var(--shadow-xl, 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04))',
                                    }}
                                >
                                    {/* Arrow pointing at trigger */}
                                    <div
                                        className="absolute w-3 h-3 rotate-45 border-t border-s border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
                                        style={{
                                            [isAbove ? 'bottom' : 'top']: '-5px',
                                            left: `${arrowOffsetPx}px`,
                                            transform: isAbove ? 'rotate(45deg)' : 'rotate(-135deg)',
                                        }}
                                    />
                                    <div className="relative">
                                        <div className="flex items-center gap-2 space-x-reverse mb-3 pb-2 border-b border-gray-100 dark:border-gray-700">
                                            {itemsTooltip.direction === 'send' ? (
                                                <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                            ) : (
                                                <Package className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                                            )}
                                            <span className="font-semibold text-gray-900 dark:text-gray-100 font-cairo text-sm">
                                                {itemsTooltip.direction === 'send' ? 'عناصر الإرسال' : 'عناصر الاستلام'}
                                            </span>
                                        </div>
                                        <div className="space-y-2">
                                            {itemsTooltip.items.map((item, index) => {
                                                const isProduct = (item.type || '').toLowerCase() === 'product';
                                                const name = item.name || item.sku || item.product_name || `عنصر ${index + 1}`;
                                                const qty = item.quantity ?? item.qty ?? 1;
                                                return (
                                                    <div key={index} className="flex items-center gap-2 space-x-reverse text-xs font-cairo">
                                                        <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${isProduct ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
                                                            {isProduct ? <Package className="w-3 h-3 text-blue-600 dark:text-blue-400" /> : <Settings className="w-3 h-3 text-green-600 dark:text-green-400" />}
                                                        </div>
                                                        <span className="text-gray-900 dark:text-gray-100 font-medium truncate flex-1 min-w-0">{name}</span>
                                                        <span className="text-gray-500 dark:text-gray-400 tabular-nums">{qty}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </>
                ) : (
                    <p className="font-cairo text-sm text-gray-500 dark:text-gray-400 py-2 flex-shrink-0">{emptyMessage}</p>
                )}
            </div>
        );
    }

    // full variant - Panel B style with drafts first (grouped by type, no chips)
    return (
        <div className="mb-4">
            {title && <h4 className="font-cairo font-bold text-sm text-gray-900 dark:text-gray-100 mb-3">{title}</h4>}
            {tickets && tickets.length > 0 ? (
                <div className="space-y-3">
                    {/* Drafts section in full variant */}
                    {draftTickets.length > 0 && (
                        <div className="rounded-xl border border-accent-amber-200 dark:border-accent-amber-700/60 bg-accent-amber-50 dark:bg-accent-amber-900/30 overflow-hidden">
                            <div className="px-4 py-3 border-b border-accent-amber-200 dark:border-accent-amber-700/30 flex items-center gap-2">
                                <span className={`w-1 h-6 rounded-full ${DRAFT_TICKET_CONFIG.solid}`} />
                                <span className="font-cairo font-bold text-sm text-accent-amber-800 dark:text-accent-amber-200">{DRAFT_TICKET_CONFIG.label}</span>
                                <span className="text-xs text-accent-amber-600 dark:text-accent-amber-400">({draftTickets.length})</span>
                            </div>
                            <div className="p-3 space-y-2 max-h-40 overflow-y-auto">
                                {draftTickets.map((draft) => (
                                    <div
                                        key={draft.id}
                                        onClick={() => onViewTicket(draft)}
                                        className="w-full text-right flex items-center justify-between gap-2 px-4 py-3 min-h-[48px] rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-accent-amber-300 dark:hover:border-accent-amber-600 hover:bg-accent-50 dark:hover:bg-accent-900/30 transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-amber-500"
                                        role="button"
                                        tabIndex={0}
                                        aria-label={`مسودة: ${draft.notes || draft.customer_name}`}
                                        title={`${draft.notes || draft.customer_name} • ${formatDistanceToNowAr(draft.created_at)}`}
                                    >
                                        <span className="font-cairo font-medium text-sm text-gray-900 dark:text-gray-100 truncate max-w-[200px]">
                                            {draft.notes || draft.customer_name || '—'}
                                        </span>
                                        <span className="text-sm text-accent-amber-600 dark:text-accent-amber-400 flex-shrink-0 whitespace-nowrap">
                                            {formatDistanceToNowAr(draft.created_at)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Confirmed tickets by type */}
                    {typesWithTickets.map(type => {
                        const config = SERVICE_TYPE_CONFIG[type] || SERVICE_TYPE_CONFIG.replacement;
                        return (
                            <div key={type} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
                                {/* Header with accent left border */}
                                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 flex items-center gap-2">
                                    <span className={`w-1 h-6 rounded-full ${config.solid}`} />
                                    <span className="font-cairo font-bold text-sm text-gray-900 dark:text-gray-100">{config.label}</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">({(grouped[type] || []).length})</span>
                                </div>
                                <div className="p-3 space-y-2 max-h-40 overflow-y-auto">
                                    {(grouped[type] || []).map((service) => (
                                        <button
                                            key={service.id}
                                            type="button"
                                            onClick={() => onViewTicket(service)}
                                            className="
                                                w-full text-right
                                                flex flex-col items-stretch
                                                px-4 py-3
                                                min-h-[48px]
                                                rounded-lg
                                                bg-white dark:bg-gray-800
                                                border border-gray-200 dark:border-gray-700
                                                hover:border-brand-blue-400 dark:hover:border-brand-blue-600
                                                hover:bg-gray-50 dark:hover:bg-gray-700/30
                                                transition-all duration-200
                                                focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-500 focus-visible:ring-offset-1
                                            "
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="font-cairo font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                                                    {service.ticket_number?.split('-').pop() || service.id}
                                                </span>
                                                <span className="font-cairo text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
                                                    {service.status || '—'}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <p className="font-cairo text-sm text-gray-500 dark:text-gray-400 py-2">{emptyMessage}</p>
            )}
        </div>
    );
}
