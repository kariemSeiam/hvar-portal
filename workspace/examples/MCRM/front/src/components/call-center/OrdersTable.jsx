import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Phone, Eye, Lock, Package, Calendar, DollarSign, ShoppingBag, Building2, FileText, Copy, Check, Clock, CheckCircle2, AlertCircle, Edit2, RotateCcw, Wrench, RefreshCw, MessageSquare } from 'lucide-react';
import OrderItemsModal from './OrderItemsModal';
import OrderNotesModal from './OrderNotesModal';
import CallHistoryModal from './CallHistoryModal';
import { formatGregorianDate } from '../../utils/core/date';
import { Button } from '../';
import PaginationControls from '../ui/PaginationControls';

/** Derive service type / draft state for display chip (call-related: draft, sell needs confirmation, R/M/T/S). */
function getServiceTypeDisplay(order) {
  const status = order.status;
  // ERP orders default to sell; others use DB value
  const raw = order.service_type ?? (order.source === 'erp' ? 'sell' : null);
  const shortMap = { r: 'replacement', m: 'maintenance', t: 'return', s: 'sell' };
  const type = raw == null ? null : (shortMap[String(raw).toLowerCase()] || String(raw).toLowerCase());

  const needsCall = status === 'new' || status === 'scheduled';
  const isTerminal = status === 'completed' || status === 'canceled';

  // "Not in ERP" is only meaningful for fresh ERP queue rows; don't override labels in other states/tabs.
  if (order.source === 'erp' && Number(order.in_erp) === 0 && status === 'new') {
    return { label: 'غير موجود في ERP', className: 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-500' };
  }

  if (isTerminal) {
    if (status === 'canceled') return { label: 'ملغى', className: 'bg-gray-100 text-gray-600 dark:bg-gray-700/50 dark:text-gray-400' };
    if (type) {
      const labels = { replacement: 'استبدال', maintenance: 'صيانة', return: 'استرجاع', sell: 'بيع', ask: 'استفسار' };
      return { label: `منتهي · ${labels[type] || type}`, className: 'bg-gray-100 text-gray-600 dark:bg-gray-700/50 dark:text-gray-400' };
    }
    return { label: 'منتهي', className: 'bg-gray-100 text-gray-600 dark:bg-gray-700/50 dark:text-gray-400' };
  }

  if (!type && needsCall) return { label: 'مسودة - لم يُحدد النوع', className: 'bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-300' };
  if (!type && status === 'confirmed') return { label: 'مؤكد - حدد النوع', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' };

  if (type === 'sell') {
    if (status === 'confirmed') return { label: 'بيع', className: 'bg-accent-green-100 text-accent-green-700 dark:bg-accent-green-900/40 dark:text-accent-green-300' };
    return { label: 'بيع - يحتاج تأكيد', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' };
  }
  if (type === 'replacement') return { label: 'استبدال', className: 'bg-brand-blue-100 text-brand-blue-700 dark:bg-brand-blue-900/40 dark:text-brand-blue-300' };
  if (type === 'maintenance') return { label: 'صيانة', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' };
  if (type === 'return') return { label: 'استرجاع', className: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' };
  if (type === 'ask') return { label: 'استفسار', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' };

  return { label: '—', className: 'bg-gray-100 text-gray-500 dark:bg-gray-700/50 dark:text-gray-400' };
}

/** Status icon container background — genome design tokens (no raw gradients). */
function getStatusIconBg(status, scheduledCallbackDate) {
  if (status === 'new') return 'bg-accent-green-500 dark:bg-accent-green-600';
  if (status === 'scheduled') {
    return scheduledCallbackDate ? 'bg-brand-blue-600 dark:bg-brand-blue-500' : 'bg-accent-amber-500 dark:bg-accent-amber-600';
  }
  if (status === 'confirmed') return 'bg-accent-purple-500 dark:bg-accent-purple-600';
  return 'bg-gray-500 dark:bg-gray-600';
}

/**
 * OrdersTable Component - Modern Table Design
 * 
 * Replaces card-based OrderRow with a professional table layout
 * Following HVAR design system patterns from StockProducts and StockMovements
 * 
 * Features:
 * - Clean table layout with proper spacing (8-point grid)
 * - Status indicators with colored backgrounds
 * - Hover effects and transitions
 * - RTL support
 * - WCAG 2.1 AA compliant
 */
const OrdersTable = ({ orders, onOpenOrder, isLoading, orderModifications = {}, pagination = null, onPageChange }) => {
  const [itemsModal, setItemsModal] = useState({ isOpen: false, orderId: null, order: null, position: null });
  const [notesModal, setNotesModal] = useState({ isOpen: false, orderId: null, notes: null, position: null });
  const [historyModal, setHistoryModal] = useState({ isOpen: false, orderId: null, position: null });
  const [copiedPhoneId, setCopiedPhoneId] = useState(null);
  const showHistoryTimeoutRef = useRef(null);
  const hideHistoryTimeoutRef = useRef(null);

  const calculateModalPosition = (rect) => {
    const modalHeight = 400; // Estimated modal height
    const modalWidth = 320; // min-w-[320px]
    const spacing = 8;
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    
    // Check if there's enough space below (modal height + spacing)
    const hasSpaceBelow = spaceBelow >= (modalHeight + spacing);
    
    let y, direction, x;
    if (hasSpaceBelow) {
      // Position below
      y = rect.bottom + spacing;
      direction = 'below';
    } else if (spaceAbove >= (modalHeight + spacing)) {
      // Position above
      y = rect.top - spacing;
      direction = 'above';
    } else {
      // Not enough space either way, position below but adjust
      y = rect.bottom + spacing;
      direction = 'below';
    }
    
    // Calculate horizontal position (center on button, but keep within viewport)
    const centerX = rect.left + rect.width / 2;
    const halfModalWidth = modalWidth / 2;
    const padding = 16; // Viewport padding
    
    if (centerX - halfModalWidth < padding) {
      // Too far left, align to left edge with padding
      x = padding + halfModalWidth;
    } else if (centerX + halfModalWidth > viewportWidth - padding) {
      // Too far right, align to right edge with padding
      x = viewportWidth - padding - halfModalWidth;
    } else {
      // Center on button
      x = centerX;
    }
    
    return {
      x,
      y,
      direction
    };
  };

  // No bulk availability check: was firing getOrderItems for every row (182 requests). Availability shown in OrderItemsModal on open.

  const handleItemsClick = (event, order) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const position = calculateModalPosition(rect);
    setItemsModal({
      isOpen: true,
      orderId: order.id,
      order,
      position
    });
  };

  const handleNotesClick = (event, orderId, notes) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const position = calculateModalPosition(rect);
    setNotesModal({
      isOpen: true,
      orderId,
      notes,
      position
    });
  };

  const handleCloseItemsModal = () => {
    setItemsModal({ isOpen: false, orderId: null, order: null, position: null });
  };

  const handleCloseNotesModal = () => {
    setNotesModal({ isOpen: false, orderId: null, notes: null, position: null });
  };

  const handleCloseHistoryModal = useCallback(() => {
    if (showHistoryTimeoutRef.current) clearTimeout(showHistoryTimeoutRef.current);
    showHistoryTimeoutRef.current = null;
    if (hideHistoryTimeoutRef.current) clearTimeout(hideHistoryTimeoutRef.current);
    hideHistoryTimeoutRef.current = null;
    setHistoryModal({ isOpen: false, orderId: null, position: null });
  }, []);

  const handleHistoryMouseEnter = (event, orderId) => {
    if (hideHistoryTimeoutRef.current) {
      clearTimeout(hideHistoryTimeoutRef.current);
      hideHistoryTimeoutRef.current = null;
    }
    if (showHistoryTimeoutRef.current) clearTimeout(showHistoryTimeoutRef.current);
    const rect = event.currentTarget.getBoundingClientRect();
    showHistoryTimeoutRef.current = setTimeout(() => {
      showHistoryTimeoutRef.current = null;
      setHistoryModal({ isOpen: true, orderId, position: calculateModalPosition(rect) });
    }, 300);
  };

  const handleHistoryMouseLeave = () => {
    if (showHistoryTimeoutRef.current) {
      clearTimeout(showHistoryTimeoutRef.current);
      showHistoryTimeoutRef.current = null;
    }
    if (hideHistoryTimeoutRef.current) clearTimeout(hideHistoryTimeoutRef.current);
    hideHistoryTimeoutRef.current = setTimeout(handleCloseHistoryModal, 150);
  };

  const cancelHistoryClose = useCallback(() => {
    if (hideHistoryTimeoutRef.current) {
      clearTimeout(hideHistoryTimeoutRef.current);
      hideHistoryTimeoutRef.current = null;
    }
  }, []);

  const scheduleHistoryClose = useCallback(() => {
    if (hideHistoryTimeoutRef.current) clearTimeout(hideHistoryTimeoutRef.current);
    hideHistoryTimeoutRef.current = setTimeout(handleCloseHistoryModal, 150);
  }, [handleCloseHistoryModal]);

  const handleCopyPhone = async (phone, orderId) => {
    if (!phone) return;
    
    try {
      await navigator.clipboard.writeText(phone);
      setCopiedPhoneId(orderId);
      setTimeout(() => setCopiedPhoneId(null), 2000);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Failed to copy phone:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = phone;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedPhoneId(orderId);
      setTimeout(() => setCopiedPhoneId(null), 2000);
    }
  };

  const formatAmount = (amount) => {
    const numAmount = parseFloat(amount || 0);
    // Check if amount is a whole number
    const isWholeNumber = numAmount % 1 === 0;
    
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: isWholeNumber ? 0 : 2,
      maximumFractionDigits: isWholeNumber ? 0 : 2
    }).format(numAmount);
  };

  // Extract "n *" and first two words after it
  const getShortNotes = (notes) => {
    if (!notes) return '';
    
    // Match pattern like "1 * كبه هفار 6.5 لتر..." or "2 * خلاط هفار..."
    const match = notes.match(/(\d+\s*\*)\s*(.+)/);
    if (match && match[1] && match[2]) {
      const numberAndAsterisk = match[1].trim(); // "1 *" or "2*"
      const afterAsterisk = match[2].trim();
      // Split by spaces and get first two words
      const words = afterAsterisk.split(/\s+/).filter(w => w.length > 0);
      if (words.length >= 2) {
        return `${numberAndAsterisk} ${words[0]} ${words[1]}`;
      } else if (words.length === 1) {
        return `${numberAndAsterisk} ${words[0]}`;
      }
    }
    
    // Fallback: if no pattern match, return first three words of the whole text
    const words = notes.split(/\s+/).filter(w => w.length > 0);
    return words.slice(0, 3).join(' ') || notes;
  };


  const SKELETON_ROWS = 6;

  if (isLoading) {
    return (
      <div className="w-full px-0">
        <div className="bg-white dark:bg-gray-800/95 rounded-xl shadow-sm border border-gray-200/60 dark:border-gray-700/40 overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800">
            <table className="w-full min-w-[800px] sm:min-w-full" dir="rtl">
              <thead className="bg-gray-50 dark:bg-gray-800/80 border-b-2 border-gray-200/80 dark:border-gray-600/40">
                <tr>
                  <th className="px-2 sm:px-3 py-2 text-right text-xs font-bold text-gray-700 dark:text-gray-200 font-cairo tracking-tight">
                    العميل
                  </th>
                  <th className="px-2 sm:px-3 py-2 text-center text-xs font-bold text-gray-700 dark:text-gray-200 font-cairo tracking-tight">
                    نوع الخدمة / الحالة
                  </th>
                  <th className="px-2 sm:px-3 py-2 text-center text-xs font-bold text-gray-700 dark:text-gray-200 font-cairo tracking-tight">
                    العناصر
                  </th>
                  <th className="px-2 sm:px-3 py-2 text-center text-xs font-bold text-gray-700 dark:text-gray-200 font-cairo tracking-tight">
                    المبلغ
                  </th>
                  <th className="px-2 sm:px-3 py-2 text-center text-xs font-bold text-gray-700 dark:text-gray-200 font-cairo tracking-tight">
                    العنوان
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
                      <div className="h-6 w-16 rounded-lg bg-gray-200 dark:bg-gray-700 mx-auto" />
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <div className="h-7 w-12 rounded-lg bg-gray-200 dark:bg-gray-700 mx-auto" />
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <div className="h-4 w-14 rounded bg-gray-200 dark:bg-gray-700 mx-auto" />
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <div className="h-4 w-20 rounded bg-gray-200 dark:bg-gray-700 mx-auto" />
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <div className="h-4 w-16 rounded bg-gray-200 dark:bg-gray-700 mx-auto" />
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <div className="flex justify-center gap-1">
                        <div className="h-9 w-9 rounded-lg bg-gray-200 dark:bg-gray-700" />
                        <div className="h-9 w-9 rounded-lg bg-gray-200 dark:bg-gray-700" />
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
  }

  if (!orders || orders.length === 0) {
    return null;
  }

  return (
    <div className="w-full px-0">
      <div className="bg-white dark:bg-gray-800/95 rounded-xl shadow-sm border border-gray-200/60 dark:border-gray-700/40 overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800">
          <table className="w-full min-w-[800px] sm:min-w-full" dir="rtl">
            <thead className="bg-gray-50 dark:bg-gray-800/80 border-b-2 border-gray-200/80 dark:border-gray-600/40">
              <tr>
                <th className="px-2 sm:px-3 py-2 text-right text-xs font-bold text-gray-700 dark:text-gray-200 font-cairo tracking-tight">
                  العميل
                </th>
                <th className="px-2 sm:px-3 py-2 text-center text-xs font-bold text-gray-700 dark:text-gray-200 font-cairo tracking-tight">
                  نوع الخدمة / الحالة
                </th>
                <th className="px-2 sm:px-3 py-2 text-center text-xs font-bold text-gray-700 dark:text-gray-200 font-cairo tracking-tight">
                  العناصر
                </th>
                <th className="px-2 sm:px-3 py-2 text-center text-xs font-bold text-gray-700 dark:text-gray-200 font-cairo tracking-tight">
                  المبلغ
                </th>
                <th className="px-2 sm:px-3 py-2 text-center text-xs font-bold text-gray-700 dark:text-gray-200 font-cairo tracking-tight">
                  العنوان
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
              {orders.map((order) => {
                const isLocked = Boolean(order.locked_by);
                const isInGapTime = order.next_action_at && new Date(order.next_action_at) > new Date();
                const isConfirmed = order.status === 'confirmed';
                const hasScheduledCallback = order.status === 'scheduled' && Boolean(order.scheduled_callback_date);
                const displayDate = hasScheduledCallback ? order.scheduled_callback_date : order.order_date;

                return (
                  <tr
                    key={order.id}
                    className={`
                      hover:bg-gray-50 dark:hover:bg-gray-700/40 
                      transition-colors duration-150
                      ${isInGapTime ? 'opacity-60' : ''}
                      ${isLocked ? 'bg-brand-blue-50/30 dark:bg-brand-blue-900/20' : 'bg-white dark:bg-gray-800/95'}
                    `}
                  >
                    {/* Customer Name with Creative Status Icon */}
                    <td className="px-3 sm:px-4 py-3">
                      <div className="flex items-start gap-2.5">
                        {/* Creative Status Icon with Attempt Count — hover to show سجل المحاولات when attempt_count > 0 */}
                        <div
                          className={`relative flex-shrink-0 ${(order.attempt_count || 0) > 0 ? 'cursor-pointer' : ''}`}
                          {...((order.attempt_count || 0) > 0
                            ? {
                                onMouseEnter: (e) => handleHistoryMouseEnter(e, order.id),
                                onMouseLeave: handleHistoryMouseLeave,
                                role: 'button',
                                tabIndex: 0,
                                title: 'عرض سجل المحاولات',
                                'aria-label': 'عرض سجل المحاولات'
                              }
                            : {})}
                        >
                          {/* Main Icon Container with Status-Based Design (genome tokens) */}
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md relative ${getStatusIconBg(order.status, order.scheduled_callback_date)}`}>
                            {/* Icon */}
                            {order.status === 'new' ? (
                              <Phone className="w-5 h-5 text-white drop-shadow-sm" />
                            ) : order.status === 'scheduled' ? (
                              order.scheduled_callback_date ? (
                                <Calendar className="w-5 h-5 text-white drop-shadow-sm" />
                              ) : (
                                <Clock className="w-5 h-5 text-white drop-shadow-sm" />
                              )
                            ) : order.status === 'confirmed' ? (
                              <CheckCircle2 className="w-5 h-5 text-white drop-shadow-sm" />
                            ) : (
                              <AlertCircle className="w-5 h-5 text-white drop-shadow-sm" />
                            )}
                          </div>
                          
                          {/* Attempt Count Badge (Top Right) - Centered on Icon Corner */}
                          {(order.attempt_count || 0) > 0 && (
                            <div className={`
                              absolute top-0 right-0 transform translate-x-1/3 -translate-y-1/4
                              min-w-[20px] h-[20px] rounded-full 
                              flex items-center justify-center px-1
                              ${order.attempt_count >= 3
                                ? 'bg-red-500 dark:bg-red-600'
                                : order.attempt_count >= 2
                                ? 'bg-orange-500 dark:bg-orange-600'
                                : 'bg-yellow-500 dark:bg-yellow-600'
                              }
                              shadow-lg border-2 border-white dark:border-gray-800
                            `}>
                              <span className="text-[10px] font-bold text-white font-cairo leading-none">
                                {order.attempt_count}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col min-w-0 flex-1 gap-0.5">
                          {/* Name with Status Badge */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-gray-900 dark:text-gray-100 font-cairo truncate leading-tight">
                              {order.customer?.name || 'غير محدد'}
                            </span>
                            {/* Compact Status Badge */}
                            <span className={`
                              inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold font-cairo flex-shrink-0 leading-tight
                              ${order.status === 'new'
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                                : order.status === 'scheduled'
                                ? order.scheduled_callback_date
                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                                : order.status === 'confirmed'
                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                                : 'bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-300'
                              }
                            `}>
                              {order.status === 'new' && 'جديد'}
                              {order.status === 'scheduled' && (
                                order.scheduled_callback_date 
                                  ? 'مجدولة'
                                  : 'لم يرد'
                              )}
                              {order.status === 'confirmed' && 'مؤكد'}
                            </span>
                            {/* Modification Badge */}
                            {orderModifications[order.id] && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold font-cairo flex-shrink-0 leading-tight bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" title="تم تعديل الطلب">
                                <Edit2 className="w-3 h-3" />
                                تم التعديل
                              </span>
                            )}
                          </div>
                          
                          {/* Phone with Copy */}
                          {order.customer?.phone && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-gray-500 dark:text-gray-400 font-cairo font-medium leading-tight">
                                {order.customer.phone}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyPhone(order.customer.phone, order.id);
                                }}
                                className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors flex-shrink-0"
                                title="نسخ الرقم"
                                aria-label="نسخ رقم الهاتف"
                              >
                                {copiedPhoneId === order.id ? (
                                  <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                                ) : (
                                  <Copy className="w-3 h-3 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300" />
                                )}
                              </button>
                            </div>
                          )}
                          
                          {/* Locked Badge */}
                          {isLocked && (
                            <span className="text-xs text-brand-blue-600 dark:text-brand-blue-400 font-cairo flex items-center gap-1 mt-0.5">
                              <Lock className="w-3 h-3" />
                              مقفول
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Service type / draft state (call-related) */}
                    <td className="px-3 sm:px-4 py-3">
                      {(() => {
                        const { label, className } = getServiceTypeDisplay(order);
                        const raw = order.service_type;
                        const type = raw == null ? null : String(raw).toLowerCase();
                        const typeMap = { r: 'replacement', replacement: 'replacement', m: 'maintenance', maintenance: 'maintenance', t: 'return', return: 'return', s: 'sell', sell: 'sell', ask: 'ask' };
                        const resolved = typeMap[type] || type;
                        const Icon = resolved === 'replacement' ? RotateCcw : resolved === 'maintenance' ? Wrench : resolved === 'return' ? RefreshCw : resolved === 'sell' ? Package : resolved === 'ask' ? MessageSquare : null;
                        return (
                          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold font-cairo leading-tight ${className}`}>
                            {Icon && <Icon className="w-3.5 h-3.5 flex-shrink-0" aria-hidden />}
                            {label}
                          </span>
                        );
                      })()}
                    </td>

                    {/* Items Count - Clickable Card/Chip with Notes and History */}
                    <td className="px-3 sm:px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2 flex-wrap">
                        <div className="relative inline-flex items-center">
                          <button
                            onClick={(e) => handleItemsClick(e, order)}
                            className="inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer group"
                            title="عرض العناصر"
                            aria-label="عرض عناصر الطلب"
                          >
                            <div className="w-5 h-5 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                              <Package className="w-3 h-3 text-green-600 dark:text-green-400" />
                            </div>
                            <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 font-cairo">
                              {order.items_count || 0}
                            </span>
                          </button>
                        </div>
                        {order.shipping_details && (
                          <button
                            onClick={(e) => handleNotesClick(e, order.id, order.shipping_details)}
                            className="inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700/70 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer group"
                            title={order.shipping_details}
                            aria-label="عرض وصف بنود الطلب (نص الشحن من ERP)"
                          >
                            <div className="w-5 h-5 rounded-lg bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center flex-shrink-0">
                              <FileText className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                            </div>
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 font-cairo whitespace-nowrap">
                              {getShortNotes(order.shipping_details)}
                            </span>
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="px-3 sm:px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="w-6 h-6 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                          <DollarSign className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100 font-cairo">
                          {formatAmount(order.cod_amount)}
                        </span>
                      </div>
                    </td>

                     {/* Address (Governorate Only) */}
                     <td className="px-3 sm:px-4 py-3 text-center">
                       <div className="flex items-center justify-center gap-1.5">
                         <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                           <Building2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                         </div>
                         <span className="text-sm font-medium text-gray-700 dark:text-gray-300 font-cairo truncate max-w-[120px]">
                           {order.address_governorate || order.customer?.governorate || 'لا يوجد'}
                         </span>
                       </div>
                     </td>

                    {/* Date — when viewing today, backlog (created before today) shows today so queue day matches chip */}
                    <td className="px-3 sm:px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 font-cairo whitespace-nowrap">
                          {formatGregorianDate(displayDate, hasScheduledCallback)}
                        </span>
                      </div>
                      {hasScheduledCallback && (
                        <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded-md bg-brand-blue-50 dark:bg-brand-blue-900/30 text-brand-blue-700 dark:text-brand-blue-300 text-[10px] font-bold font-cairo">
                          موعد مجدول
                        </div>
                      )}
                    </td>

                    {/* Actions — one button: Call for non-confirmed, View for confirmed */}
                    <td className="px-3 sm:px-4 py-3">
                      <div className="flex items-center justify-center gap-2 flex-wrap">
                        {onOpenOrder && (
                          <button
                            onClick={() => onOpenOrder(order)}
                            className={isConfirmed
                              ? 'p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2'
                              : 'p-2 rounded-lg bg-brand-blue-600 hover:bg-brand-blue-700 dark:bg-brand-blue-700 dark:hover:bg-brand-blue-600 text-white transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:ring-offset-2'
                            }
                            title={isConfirmed ? 'عرض التفاصيل' : 'اتصال'}
                            aria-label={isConfirmed ? 'عرض تفاصيل الطلب' : 'اتصال بالعميل'}
                          >
                            {isConfirmed ? <Eye className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {pagination && onPageChange && pagination.total > pagination.limit && (
        <PaginationControls
          pagination={pagination}
          onPageChange={onPageChange}
          showSummary={true}
        />
      )}

      {/* Order Items Modal */}
      <OrderItemsModal
        orderId={itemsModal.orderId}
        order={itemsModal.order}
        isOpen={itemsModal.isOpen}
        onClose={handleCloseItemsModal}
        position={itemsModal.position}
      />

      {/* Order Notes Modal */}
      <OrderNotesModal
        orderId={notesModal.orderId}
        notes={notesModal.notes}
        isOpen={notesModal.isOpen}
        onClose={handleCloseNotesModal}
        position={notesModal.position}
      />

      {/* Call History — toolkit-style popover: portal to body, hover to show, stays open when moving to popover */}
      {historyModal.isOpen &&
        createPortal(
          <CallHistoryModal
            orderId={historyModal.orderId}
            isOpen
            onClose={handleCloseHistoryModal}
            position={historyModal.position}
            onMouseEnter={cancelHistoryClose}
            onMouseLeave={scheduleHistoryClose}
          />,
          document.body
        )}
    </div>
  );
};

export default OrdersTable;
