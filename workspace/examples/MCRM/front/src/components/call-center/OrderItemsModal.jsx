import { useState, useEffect, useRef } from 'react';
import { Package, Settings, X, RotateCcw, Wrench, RefreshCw, ShoppingBag, MessageCircleQuestion, ArrowDown, ArrowUp } from 'lucide-react';
import { getOrderItemsFromSnapshot, getOrderItems } from '../../api/callCenterAPI';

/**
 * Service type metadata — label, icon, color, directional semantics
 */
const SERVICE_TYPE_META = {
  sell: {
    label: 'بيع',
    Icon: ShoppingBag,
    color: 'green',
    directional: false,
    sendLabel: null,
    receiveLabel: null,
    singleLabel: 'عناصر البيع',
  },
  replacement: {
    label: 'استبدال',
    Icon: RotateCcw,
    color: 'blue',
    directional: true,
    sendLabel: 'يُرسل للعميل',
    receiveLabel: 'يُستلم من العميل',
    singleLabel: 'عناصر الاستبدال',
  },
  maintenance: {
    label: 'صيانة',
    Icon: Wrench,
    color: 'amber',
    directional: true,
    sendLabel: 'يُرسل للعميل بعد الصيانة',
    receiveLabel: 'يُستلم من العميل للصيانة',
    singleLabel: 'عناصر الصيانة',
  },
  return: {
    label: 'استرجاع',
    Icon: RefreshCw,
    color: 'red',
    directional: false,
    sendLabel: null,
    receiveLabel: 'يُستلم من العميل',
    singleLabel: 'عناصر الاسترجاع',
  },
  ask: {
    label: 'استفسار',
    Icon: MessageCircleQuestion,
    color: 'emerald',
    directional: false,
    sendLabel: null,
    receiveLabel: null,
    singleLabel: 'عناصر الطلب',
  },
};

const SEND_COLORS = {
  blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-700/50', header: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', icon: 'text-blue-600 dark:text-blue-400', dot: 'bg-blue-500', badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' },
  amber: { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-700/50', header: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', icon: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500', badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' },
  red: { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-700/50', header: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', icon: 'text-red-600 dark:text-red-400', dot: 'bg-red-500', badge: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' },
  green: { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-700/50', header: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', icon: 'text-green-600 dark:text-green-400', dot: 'bg-green-500', badge: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-700/50', header: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', icon: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500', badge: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' },
};

const RECEIVE_COLORS = {
  blue: { bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-700/50', header: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', icon: 'text-purple-600 dark:text-purple-400', dot: 'bg-purple-500', badge: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' },
  amber: { bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-700/50', header: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', icon: 'text-orange-600 dark:text-orange-400', dot: 'bg-orange-500', badge: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' },
  red: { bg: 'bg-pink-50 dark:bg-pink-900/20', border: 'border-pink-200 dark:border-pink-700/50', header: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-700 dark:text-pink-300', icon: 'text-pink-600 dark:text-pink-400', dot: 'bg-pink-500', badge: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300' },
  green: { bg: 'bg-teal-50 dark:bg-teal-900/20', border: 'border-teal-200 dark:border-teal-700/50', header: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-700 dark:text-teal-300', icon: 'text-teal-600 dark:text-teal-400', dot: 'bg-teal-500', badge: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300' },
  emerald: { bg: 'bg-gray-50 dark:bg-gray-700/30', border: 'border-gray-200 dark:border-gray-600', header: 'bg-gray-100 dark:bg-gray-700/50', text: 'text-gray-700 dark:text-gray-300', icon: 'text-gray-600 dark:text-gray-400', dot: 'bg-gray-400', badge: 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400' },
};

function getAvailabilityStatus(availableQty, orderQuantity) {
  const qty = availableQty ?? null;
  if (qty === null) return null; // Unknown — no stock data
  if (qty >= orderQuantity) return { text: 'متاح', dotColor: 'bg-green-500', bg: 'bg-green-100 dark:bg-green-900/30', textColor: 'text-green-700 dark:text-green-300' };
  if (qty > 0) return { text: 'محدود', dotColor: 'bg-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30', textColor: 'text-amber-700 dark:text-amber-300' };
  return { text: 'غير متاح', dotColor: 'bg-red-500', bg: 'bg-red-100 dark:bg-red-900/30', textColor: 'text-red-700 dark:text-red-300' };
}

function formatPrice(price) {
  const num = parseFloat(price || 0);
  return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', minimumFractionDigits: num % 1 === 0 ? 0 : 2 }).format(num);
}

/** Condition → label + semantic color (damaged = red, good = green, etc.) */
function getConditionStyle(condition) {
  if (!condition) return null;
  const c = String(condition).trim().toLowerCase();
  const damaged = ['damaged', 'تالف', 'talef', 'bad'];
  const good = ['good', 'سليم', 'salem', 'ok', 'new', 'جديد'];
  const used = ['used', 'مستعمل', 'mustaamal'];
  if (damaged.some((x) => c.includes(x) || c === x))
    return { label: 'تالف', className: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700/50' };
  if (good.some((x) => c.includes(x) || c === x))
    return { label: 'سليم', className: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700/50' };
  if (used.some((x) => c.includes(x) || c === x))
    return { label: 'مستعمل', className: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700/50' };
  return { label: condition, className: 'bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600/50' };
}

function ItemCard({ item, showAvailability = true }) {
  const isProduct = item.type !== 'part';
  const availability = showAvailability ? getAvailabilityStatus(item.available_qty, item.order_quantity || item.quantity || 1) : null;
  const qty = item.order_quantity || item.quantity || 1;
  const hasPrice = item.price_customer != null && item.price_customer > 0;
  const conditionStyle = item.condition ? getConditionStyle(item.condition) : null;

  return (
    <div
      className="rounded-lg border border-gray-200 dark:border-gray-600/50 bg-white dark:bg-gray-800/80 hover:border-gray-300 dark:hover:border-gray-500 transition-colors p-2 flex flex-col gap-1.5"
      dir="rtl"
    >
      {/* 1. Type icon + name — same horizontal bar */}
      <div className="flex items-center gap-2 min-w-0">
        <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${isProduct ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-purple-100 dark:bg-purple-900/30'}`}>
          {isProduct ? <Package className="w-3 h-3 text-blue-600 dark:text-blue-400" /> : <Settings className="w-3 h-3 text-purple-600 dark:text-purple-400" />}
        </div>
        <span className="text-xs font-bold text-gray-900 dark:text-gray-100 font-cairo leading-snug break-words min-w-0 flex-1">
          {item.name || 'غير محدد'}
        </span>
      </div>

      {/* 2. SKU — under name */}
      {item.sku && (
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-gray-400 dark:text-gray-500 font-cairo">SKU</span>
          <span className="text-[10px] font-mono font-medium text-gray-600 dark:text-gray-400">{item.sku}</span>
        </div>
      )}

      {/* 3. Bottom bar: quantity, متوفر, availability, price, الحالة at end */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 pt-1.5 border-t border-gray-100 dark:border-gray-700/50">
        <span className="text-[10px] text-gray-500 dark:text-gray-400 font-cairo">
          الكمية <span className="font-bold text-gray-800 dark:text-gray-200">{qty}</span>
        </span>
        {item.available_qty !== undefined && item.available_qty !== null && (
          <span className="text-[10px] text-gray-500 dark:text-gray-400 font-cairo">
            متوفر <span className="font-semibold text-gray-700 dark:text-gray-300">{item.available_qty}</span>
          </span>
        )}
        {availability && (
          <span className={`text-[10px] font-medium px-1 py-0.5 rounded ${availability.bg} ${availability.textColor}`}>
            {availability.text}
          </span>
        )}
        {hasPrice && (
          <span className="text-[10px] font-bold text-gray-800 dark:text-gray-200 font-cairo">
            {formatPrice(item.price_customer)}
          </span>
        )}
        {conditionStyle && (
          <span className={`text-[10px] font-bold font-cairo px-1.5 py-0.5 rounded border ms-auto ${conditionStyle.className}`}>
            {conditionStyle.label}
          </span>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, label, count, colors }) {
  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${colors.header} mb-1.5`}>
      <Icon className={`w-3 h-3 ${colors.icon} flex-shrink-0`} />
      <span className={`text-[10px] font-bold font-cairo ${colors.text}`}>{label}</span>
      <span className={`mr-auto text-[10px] font-bold px-1.5 py-0.5 rounded ${colors.badge}`}>{count}</span>
    </div>
  );
}

/**
 * OrderItemsModal — service-type-aware items popup
 *
 * Renders items contextually based on service_type:
 * - sell: flat list (items going to customer)
 * - replacement: two sections (send new ↕ receive broken)
 * - maintenance: two sections (send repaired ↕ receive for repair)
 * - return: receive-only section
 * - ask / unknown: flat info list
 */
const OrderItemsModal = ({ orderId, order, isOpen, onClose, position }) => {
  const [data, setData] = useState({ items: [], itemsToSend: [], itemsToReceive: [], total: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const modalRef = useRef(null);

  const rawType = order?.service_type;
  const shortMap = { r: 'replacement', m: 'maintenance', t: 'return', s: 'sell' };
  const serviceType = rawType == null ? null : (shortMap[String(rawType).toLowerCase()] || String(rawType).toLowerCase());
  const meta = SERVICE_TYPE_META[serviceType] || SERVICE_TYPE_META.sell;
  const typeColor = meta.color;
  const sendColors = SEND_COLORS[typeColor] || SEND_COLORS.blue;
  const receiveColors = RECEIVE_COLORS[typeColor] || RECEIVE_COLORS.blue;

  useEffect(() => {
    if (isOpen && orderId && order) {
      fetchItems();
    }
  }, [isOpen, orderId]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const snap = order?.confirmation_snapshot;
      const hasSnapshot = snap && Array.isArray(snap?.items) && snap.items.length > 0;

      let result;
      if (hasSnapshot) {
        // Confirmed order: use snapshot (has direction, call_type, etc.)
        result = await getOrderItemsFromSnapshot(order);
      } else {
        // Pending/new order: auto-match from order_description
        result = await getOrderItems(orderId);
      }

      setData({
        items: result.items || [],
        itemsToSend: result.itemsToSend || [],
        itemsToReceive: result.itemsToReceive || [],
        total: result.total || 0,
      });
    } catch {
      setData({ items: [], itemsToSend: [], itemsToReceive: [], total: 0 });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const isAbove = position?.direction === 'above';
  const modalWidth = 340;
  const leftPosition = position?.x ? `${position.x - modalWidth / 2}px` : '50%';
  const topPosition = position?.y ? `${position.y}px` : '50%';
  const transform = position?.y
    ? (isAbove ? 'translateY(-100%) translateY(-8px)' : 'translateY(8px)')
    : 'translate(-50%, -50%)';

  const { items, itemsToSend, itemsToReceive, total } = data;

  // Determine rendering mode
  const isRMT = ['replacement', 'maintenance', 'return'].includes(serviceType);
  const hasDirectional = isRMT && (itemsToSend.length > 0 || itemsToReceive.length > 0);
  const hasFlatItems = items.length > 0;
  const isEmpty = !hasDirectional && !hasFlatItems;

  const TypeIcon = meta.Icon;

  return (
    <div
      ref={modalRef}
      className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-2.5 min-w-[280px] max-w-[min(92vw,360px)]"
      style={{ top: topPosition, left: leftPosition, transform }}
      dir="rtl"
    >
      {/* Arrow */}
      {position?.y && (
        <div className={`absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white dark:bg-gray-800 border-l border-t border-gray-200 dark:border-gray-700 rotate-45 ${isAbove ? '-bottom-0.5' : '-top-0.5'}`} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 ${sendColors.header}`}>
            <TypeIcon className={`w-3 h-3 ${sendColors.icon}`} />
          </div>
          <div className="min-w-0">
            <h3 className="text-[11px] font-bold text-gray-900 dark:text-gray-100 font-cairo leading-tight truncate">
              {meta.singleLabel}
            </h3>
            <span className={`text-[10px] font-medium ${sendColors.text} font-cairo`}>{meta.label}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {total > 0 && (
            <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 font-cairo bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
              {formatPrice(total)}
            </span>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
            aria-label="إغلاق"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Body */}
      {isLoading ? (
        <div className="flex items-center justify-center py-6">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-200 dark:border-gray-600 border-t-brand-blue-600" />
        </div>
      ) : isEmpty ? (
        <div className="text-center py-6 text-[11px] text-gray-500 dark:text-gray-400 font-cairo">
          لا توجد عناصر مسجلة
        </div>
      ) : (
        <div className="space-y-2 max-h-[380px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800 pr-0.5">

          {/* Directional mode: R / M / T */}
          {hasDirectional && (
            <>
              {/* Items to SEND */}
              {itemsToSend.length > 0 && (
                <div>
                  <SectionHeader
                    icon={ArrowDown}
                    label={meta.sendLabel || 'يُرسل'}
                    count={itemsToSend.length}
                    colors={sendColors}
                  />
                  <div className="space-y-1">
                    {itemsToSend.map((item, i) => (
                      <ItemCard key={item._uid ?? `send-${i}`} item={item} showAvailability />
                    ))}
                  </div>
                </div>
              )}

              {/* Items to RECEIVE */}
              {itemsToReceive.length > 0 && (
                <div>
                  <SectionHeader
                    icon={ArrowUp}
                    label={meta.receiveLabel || 'يُستلم'}
                    count={itemsToReceive.length}
                    colors={receiveColors}
                  />
                  <div className="space-y-1">
                    {itemsToReceive.map((item, i) => (
                      <ItemCard key={item._uid ?? `recv-${i}`} item={item} showAvailability={false} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Flat mode: sell / ask / legacy / unresolved RMT */}
          {!hasDirectional && hasFlatItems && (
            <div className="space-y-1">
              {items.map((item, i) => (
                <ItemCard key={item._uid ?? `item-${i}`} item={item} showAvailability />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderItemsModal;
