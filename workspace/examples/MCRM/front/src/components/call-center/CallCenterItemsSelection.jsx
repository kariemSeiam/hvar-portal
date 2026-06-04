import { useState, useRef, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Package, Wrench, Truck, RefreshCw, RotateCcw, Lock, Search, Plus, Minus, X, CheckCircle, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { SessionItemCardLayout } from './SessionItemCard';

const CALL_TYPE_LABELS = {
  replacement: 'الاستبدال',
  maintenance: 'الصيانة',
  return: 'الإرجاع',
};

const CONDITION_LABELS = { valid: 'سليم', damaged: 'تالف', unknown: 'غير محدد' };

/** Same product in both إرسال and استلام — thin accent line on the card (viewer parity). */
function itemAlsoInOtherColumn(item, otherList) {
  const id = item?.id ?? item?.item_id ?? item?.product_id;
  if (id == null) return false;
  return (otherList || []).some(
    (o) => o && (o.id === id || o.item_id === id || o.product_id === id)
  );
}

/**
 * Interactive line item — same shell as SessionItemCardReadonly / ServiceModalViewer (dark card, icon tile, mono SKU, footer strip).
 */
function ItemCard({
  item,
  onQuantityChange,
  onRemove,
  onConditionChange,
  showCondition = true,
  disabled,
  listRole = 'send',
  dualPresenceAccent = false,
}) {
  const isProduct = (item.type || 'product') === 'product';
  const condition = item.condition || 'valid';
  const isValid = condition === 'valid';
  const key = item._uid ?? item.item_id ?? item.id;
  const qty = item.quantity ?? item.order_quantity ?? 1;

  const itemName = item.name || item.item_name || item.product_name || `#${item.item_id ?? item.id}`;
  const itemSkuRaw = item.sku != null ? String(item.sku) : item.product_sku != null ? String(item.product_sku) : '—';
  const showSku = itemSkuRaw.trim() !== '' && itemSkuRaw !== '—';

  const topAccent = dualPresenceAccent ? (listRole === 'send' ? 'blue' : 'green') : undefined;

  const isSend = listRole === 'send';
  /** Qty text only (no colored pill): green = سليم، red = تالف */
  const qtyTextClass = isValid
    ? 'text-accent-green-700 dark:text-accent-green-300'
    : 'text-brand-red-600 dark:text-brand-red-400';
  const qtyIconClass = isValid
    ? 'text-accent-green-600 dark:text-accent-green-400'
    : 'text-brand-red-500 dark:text-brand-red-400';

  return (
    <SessionItemCardLayout
      listRole={listRole}
      isProduct={isProduct}
      itemName={itemName}
      itemSku={itemSkuRaw}
      showSku={showSku}
      topAccent={topAccent}
    >
      {/*
        Footer RTL: كمية واضحة + أيقونة إرسال/استلام (محاذاة أفقية/عمودية) + stepper + حذف.
      */}
      <div
        className="mt-2 flex w-full min-w-0 items-center justify-between gap-2 border-t border-gray-200 pt-2 dark:border-gray-700/70"
        dir="rtl"
      >
        <div className="flex min-h-6 min-w-0 shrink-0 flex-nowrap items-center justify-start gap-1.5">
          <span
            className="inline-flex h-6 shrink-0 items-center gap-1.5 font-cairo"
            title={`الكمية: ${qty}`}
            aria-label={`الكمية ${qty}`}
          >
            <span className="inline-flex h-6 w-3 shrink-0 items-center justify-center" aria-hidden>
              {isSend ? (
                <Truck className={`h-3 w-3 opacity-90 ${qtyIconClass}`} strokeWidth={2.25} />
              ) : (
                <Package className={`h-3 w-3 opacity-90 ${qtyIconClass}`} strokeWidth={2.25} />
              )}
            </span>
            <span
              className={`flex h-6 min-w-[1.25rem] items-center justify-center text-base font-black leading-none tabular-nums tracking-tight ${qtyTextClass}`}
              aria-live="polite"
            >
              {qty}
            </span>
          </span>
          {!disabled && onQuantityChange && onRemove ? (
            <div className="flex h-6 shrink-0 items-center gap-0.5">
              <div
                className="inline-flex h-5 min-h-5 items-center overflow-hidden rounded-full border border-gray-200 bg-white p-px shadow-sm dark:border-gray-600 dark:bg-gray-800/90"
                role="group"
                aria-label="تعديل الكمية"
              >
                <button
                  type="button"
                  onClick={() => onQuantityChange(key, -1)}
                  disabled={qty <= 1}
                  className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400/50 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent dark:text-gray-400 dark:hover:bg-gray-700/80 dark:focus-visible:ring-gray-500/40"
                  aria-label="نقص الكمية"
                >
                  <Minus className="h-2.5 w-2.5" strokeWidth={2.5} />
                </button>
                <span className="h-3 w-px shrink-0 bg-gray-200 dark:bg-gray-600" aria-hidden />
                <button
                  type="button"
                  onClick={() => onQuantityChange(key, 1)}
                  className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400/50 dark:text-gray-400 dark:hover:bg-gray-700/80 dark:focus-visible:ring-gray-500/40"
                  aria-label="زيادة الكمية"
                >
                  <Plus className="h-2.5 w-2.5" strokeWidth={2.5} />
                </button>
              </div>
              <button
                type="button"
                onClick={() => onRemove(key)}
                className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-red-600 dark:hover:bg-gray-700/70 dark:hover:text-red-400"
                title="إزالة من القائمة"
                aria-label="إزالة من القائمة"
              >
                <X className="h-2.5 w-2.5" strokeWidth={2.5} />
              </button>
            </div>
          ) : null}
        </div>
        {showCondition && !disabled && onConditionChange ? (
          <button
            type="button"
            onClick={() => onConditionChange(key, isValid ? 'damaged' : 'valid')}
            className={`inline-flex min-h-6 shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-cairo font-medium leading-none shadow-sm transition-colors ${
              isValid
                ? 'border-accent-green-300 dark:border-accent-green-700 bg-accent-green-50 dark:bg-accent-green-900/25 text-accent-green-800 dark:text-accent-green-200 hover:bg-accent-green-100 dark:hover:bg-accent-green-900/35'
                : 'border-brand-red-300 dark:border-brand-red-700 bg-brand-red-50 dark:bg-brand-red-900/25 text-brand-red-800 dark:text-brand-red-200 hover:bg-brand-red-100 dark:hover:bg-brand-red-900/35'
            }`}
            dir="rtl"
          >
            {isValid ? <CheckCircle className="h-3 w-3 shrink-0" /> : <AlertTriangle className="h-3 w-3 shrink-0" />}
            <span>{CONDITION_LABELS[condition] || condition}</span>
          </button>
        ) : null}
        {showCondition && disabled ? (
          <div
            className={`inline-flex min-h-6 shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-cairo font-medium leading-none shadow-sm ${
              isValid
                ? 'border-accent-green-300 dark:border-accent-green-700 bg-accent-green-50 dark:bg-accent-green-900/25 text-accent-green-800 dark:text-accent-green-200'
                : 'border-brand-red-300 dark:border-brand-red-700 bg-brand-red-50 dark:bg-brand-red-900/25 text-brand-red-800 dark:text-brand-red-200'
            }`}
            dir="rtl"
          >
            {isValid ? <CheckCircle className="h-3 w-3 shrink-0" /> : <AlertTriangle className="h-3 w-3 shrink-0" />}
            <span>{CONDITION_LABELS[condition] || condition}</span>
          </div>
        ) : null}
      </div>
    </SessionItemCardLayout>
  );
}

ItemCard.propTypes = {
  item: PropTypes.shape({
    type: PropTypes.string,
    condition: PropTypes.string,
    _uid: PropTypes.string,
    item_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    quantity: PropTypes.number,
    order_quantity: PropTypes.number,
    name: PropTypes.string,
    item_name: PropTypes.string,
    product_name: PropTypes.string,
    sku: PropTypes.string,
    product_sku: PropTypes.string,
  }).isRequired,
  onQuantityChange: PropTypes.func,
  onRemove: PropTypes.func,
  onConditionChange: PropTypes.func,
  showCondition: PropTypes.bool,
  disabled: PropTypes.bool,
  listRole: PropTypes.oneOf(['send', 'receive']),
  dualPresenceAccent: PropTypes.bool,
};

const COLLAPSED_ITEM_COUNT = 2;
/** Expanded: at most this many rows visible; extra rows scroll inside (shorter lists stay content-sized). */
const EXPANDED_MAX_VISIBLE_ROWS = 7;

function expandedListMaxHeightCss(compact) {
  const rowRem = compact ? 5.25 : 5.875;
  const gapRem = compact ? 0.375 : 0.5;
  const n = EXPANDED_MAX_VISIBLE_ROWS;
  return `min(calc(${n} * (${rowRem}rem + ${gapRem}rem) - ${gapRem}rem), min(72vh, 50rem))`;
}

/**
 * Items stack: default height ≈ 2 cards; if more, full-width bar to expand.
 * Expanded: same padding as collapsed; max ~7 card rows then internal scroll (fewer rows = shorter panel).
 * Optional accordion: pass panelId + expandedPanelId + onExpandedPanelIdChange so only one column expands (send vs receive).
 * Optional linked columns: pass syncExpanded + onSyncExpandedChange so both lists expand/collapse together (viewer modal).
 */
function CollapsibleItemsList({
  items,
  tone,
  empty,
  renderItem,
  panelId = null,
  expandedPanelId = null,
  onExpandedPanelIdChange = null,
  /** When onSyncExpandedChange is set, expanded state is shared (e.g. إرسال + استلام in ServiceModalViewer). */
  syncExpanded = false,
  onSyncExpandedChange = null,
  /** Tighter padding/gap for read-only viewers (e.g. ServiceModalViewer) */
  compact = false,
}) {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const isSynced = typeof onSyncExpandedChange === 'function';
  const isPanelControlled =
    !isSynced && typeof onExpandedPanelIdChange === 'function' && panelId != null;
  const expanded = isSynced ? !!syncExpanded : isPanelControlled ? expandedPanelId === panelId : internalExpanded;
  const setExpanded = useCallback(
    (next) => {
      const v = !!next;
      if (isSynced) {
        onSyncExpandedChange(v);
      } else if (isPanelControlled) {
        onExpandedPanelIdChange(v ? panelId : null);
      } else {
        setInternalExpanded(v);
      }
    },
    [isSynced, isPanelControlled, onSyncExpandedChange, onExpandedPanelIdChange, panelId]
  );

  const total = items.length;
  const showToggle = total > COLLAPSED_ITEM_COUNT;
  const restCount = total - COLLAPSED_ITEM_COUNT;
  const isGreen = tone === 'green';
  const barBorder = isGreen ? 'border-green-200 dark:border-green-700' : 'border-blue-200 dark:border-blue-700';
  const barBg = isGreen ? 'bg-green-50/90 dark:bg-green-900/30' : 'bg-blue-50/90 dark:bg-blue-900/30';
  const barText = isGreen ? 'text-green-800 dark:text-green-200' : 'text-blue-800 dark:text-blue-200';
  const barHover = isGreen ? 'hover:bg-green-100/90 dark:hover:bg-green-900/40' : 'hover:bg-blue-100/90 dark:hover:bg-blue-900/40';

  if (total === 0) {
    return <div className={compact ? 'p-2 sm:p-2.5' : 'p-3'}>{empty}</div>;
  }

  const collapsedItems = items.slice(0, COLLAPSED_ITEM_COUNT);
  /** Same vertical rhythm as OrderItemsEditor (sell); compact = denser for read-only viewer modals */
  const gapClass = compact ? 'space-y-1.5' : 'space-y-2';
  const bodyPad = compact
    ? `px-2.5 pt-2.5 ${showToggle ? 'pb-0' : 'pb-2.5'}`
    : `px-3 pt-3 ${showToggle ? 'pb-0' : 'pb-3'}`;
  const togglePad = compact ? 'py-1.5 px-2.5' : 'py-2.5 px-3';

  return (
    <div className="flex min-h-0 flex-col">
      {/* ① Body: two rows by default, or full list in scroll when expanded — same chrome as collapsed (no extra border/bg) */}
      <div className={bodyPad}>
        {!expanded ? (
          <div className={gapClass}>
            {collapsedItems.map((item, index) => renderItem(item, index))}
          </div>
        ) : (
          <div
            className={`${gapClass} min-h-0 overflow-y-auto overscroll-contain scrollbar-hide`}
            style={{ maxHeight: expandedListMaxHeightCss(compact) }}
          >
            {items.map((item, index) => renderItem(item, index))}
          </div>
        )}
      </div>

      {/* ② Horizontal expand / collapse — only if more than 2 items */}
      {showToggle && (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
          className={`flex w-full items-center justify-center border-t font-cairo font-semibold transition-colors ${barBorder} ${barBg} ${barText} ${barHover} ${
            compact ? 'gap-1.5 text-[11px] sm:text-xs' : 'gap-2 text-xs sm:text-sm'
          } ${togglePad}`}
        >
          {expanded ? (
            <>
              <ChevronUp className={`${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} shrink-0 opacity-90`} aria-hidden />
              تصغير القائمة
            </>
          ) : (
            <>
              <ChevronDown className={`${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} shrink-0 opacity-90`} aria-hidden />
              عرض الكل
              <span className="tabular-nums opacity-90">(+{restCount})</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}

/**
 * Confirmed-items read-only view — used when viewOnly (leader reviewing confirmed order).
 */
function ConfirmedItemsView({ callType, itemsToSend, itemsToReceive }) {
  const typeLabel = CALL_TYPE_LABELS[callType] || callType;
  const hasSend = itemsToSend.length > 0;
  const hasReceive = itemsToReceive.length > 0;
  const isReturn = callType === 'return';

  if (!hasSend && !hasReceive) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 p-6 text-center" dir="rtl">
        <Lock className="w-5 h-5 text-gray-400 mx-auto" />
        <p className="text-sm text-gray-500 dark:text-gray-400 font-cairo mt-2">
          لم يتم تحديد عناصر لهذا الطلب
        </p>
      </div>
    );
  }

  if (isReturn) {
    return (
      <div className="space-y-3" dir="rtl">
        <div className="flex items-center gap-2">
          <RotateCcw className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 flex-shrink-0" />
          <h3 className="text-xs font-bold text-gray-600 dark:text-gray-300 font-cairo">
            العناصر للإرجاع ({itemsToReceive.length})
          </h3>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="p-2.5 space-y-1.5 max-h-64 overflow-y-auto scrollbar-hide">
            {itemsToReceive.map((item, i) => (
              <ItemCard
                key={item._uid ?? item.item_id ?? item.id ?? i}
                item={item}
                listRole="receive"
                showCondition
                disabled
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const isMaintenance = callType === 'maintenance';
  const SendPanel = () => (
    <div className="rounded-xl border border-brand-blue-200 dark:border-brand-blue-700 bg-brand-blue-50 dark:bg-brand-blue-900/20">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-brand-blue-200 dark:border-brand-blue-700">
        <Truck className="w-3.5 h-3.5 text-brand-blue-600 dark:text-brand-blue-400" />
        <span className="text-xs font-bold text-brand-blue-700 dark:text-brand-blue-300 font-cairo">
          العناصر للإرسال ({itemsToSend.length})
        </span>
      </div>
      <div className="p-2.5 space-y-1.5 max-h-48 overflow-y-auto scrollbar-hide">
        {hasSend ? (
          itemsToSend.map((item, i) => (
            <ItemCard
              key={item._uid ?? item.item_id ?? item.id ?? i}
              item={item}
              listRole="send"
              dualPresenceAccent={itemAlsoInOtherColumn(item, itemsToReceive)}
              showCondition
              disabled
            />
          ))
        ) : (
          <p className="text-xs text-gray-400 dark:text-gray-500 font-cairo text-center py-3">لا توجد عناصر للإرسال</p>
        )}
      </div>
    </div>
  );
  const ReceivePanel = () => (
    <div className="rounded-xl border border-accent-green-200 dark:border-accent-green-700 bg-accent-green-50 dark:bg-accent-green-900/20">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-accent-green-200 dark:border-accent-green-700">
        <RefreshCw className="w-3.5 h-3.5 text-accent-green-600 dark:text-accent-green-400" />
        <span className="text-xs font-bold text-accent-green-700 dark:text-accent-green-300 font-cairo">
          العناصر للاستلام ({itemsToReceive.length})
        </span>
      </div>
      <div className="p-2.5 space-y-1.5 max-h-48 overflow-y-auto scrollbar-hide">
        {hasReceive ? (
          itemsToReceive.map((item, i) => (
            <ItemCard
              key={item._uid ?? item.item_id ?? item.id ?? i}
              item={item}
              listRole="receive"
              dualPresenceAccent={itemAlsoInOtherColumn(item, itemsToSend)}
              showCondition
              disabled
            />
          ))
        ) : (
          <p className="text-xs text-gray-400 dark:text-gray-500 font-cairo text-center py-3">لا توجد عناصر للاستلام</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-3" dir="rtl">
      <div className="flex items-center gap-2">
        <Lock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
        <h3 className="text-xs font-bold text-gray-600 dark:text-gray-300 font-cairo">
          عناصر {typeLabel} — مؤكدة
        </h3>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {isMaintenance ? (
          <>
            <ReceivePanel />
            <SendPanel />
          </>
        ) : (
          <>
            <SendPanel />
            <ReceivePanel />
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Unified search bar — same as OrderItemsEditor (sell type).
 * Search results show each item with "إرسال" | "استلام" buttons to add.
 */
function UnifiedSearchWithSendReceive({
  onStockSearch,
  onAddToSend,
  onAddToReceive,
  itemsToSend,
  itemsToReceive,
  disabled,
  isReturn,
  isMaintenance,
}) {
  const [searchType, setSearchType] = useState('product');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  const doSearch = useCallback(
    async (q) => {
      if (!q?.trim() || !onStockSearch) {
        setResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const res = await onStockSearch(q.trim(), searchType);
        setResults(res || []);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [onStockSearch, searchType]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query), 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, doSearch]);

  useEffect(() => {
    if (query?.trim()) doSearch(query);
  }, [searchType]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /** Same stock product as a row already in send/receive (تكرار الضغط يزيد الكمية لا يكرر السطر). */
  const sameSku = (stock, row) =>
    (row.item_id ?? row.id) === stock.id && (row.type || 'product') === (stock.type || 'product');
  /** إجمالي القطع في العمود لذلك المنتج. */
  const qtySumSend = (item) =>
    itemsToSend.filter((i) => sameSku(item, i)).reduce((s, i) => s + (Number(i.quantity ?? i.order_quantity) || 1), 0);
  const qtySumRecv = (item) =>
    itemsToReceive.filter((i) => sameSku(item, i)).reduce((s, i) => s + (Number(i.quantity ?? i.order_quantity) || 1), 0);

  const toItem = (stockItem) => ({
    _uid: `new-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    item_id: stockItem.id,
    id: stockItem.id,
    sku: stockItem.sku,
    name: stockItem.name,
    type: stockItem.type,
    quantity: 1,
    order_quantity: 1,
  });

  const placeholder =
    searchType === 'product'
      ? 'ابحث: اسم، SKU، أو كلمات متعددة (مثلاً: خلاط 8000)...'
      : searchType === 'part'
      ? 'ابحث: قطعة، SKU، أو كلمات متعددة...'
      : 'ابحث عن منتج أو قطعة...';

  return (
    <div className="space-y-3" ref={searchRef}>
      {/* Search bar — same as OrderItemsEditor */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 z-10 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              setShowDropdown(true);
              if (query?.trim()) doSearch(query);
            }}
            onClick={() => {
              if (query?.trim()) {
                setShowDropdown(true);
                doSearch(query);
              }
            }}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full px-3 pr-10 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-cairo focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500 transition-all duration-150"
            dir="rtl"
          />
          {/* Search results dropdown — each item has إرسال | استلام buttons */}
          {showDropdown && query && (
            <div className="absolute top-full left-0 right-0 z-[100] mt-1.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xl ring-1 ring-black/5 dark:ring-white/10 overflow-hidden">
              <div
                className="max-h-[min(28rem,calc(100dvh-10rem))] sm:max-h-[min(26rem,55vh)] overflow-y-auto overscroll-contain scrollbar-dropdown py-1.5 touch-pan-y [scrollbar-gutter:stable]"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                {isSearching && (
                  <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-3 font-cairo">جاري البحث...</div>
                )}
                {!isSearching && results.length > 0 && (
                  <div className="px-1.5 pb-1 space-y-1">
                    {results.map((item) => {
                      const nSend = qtySumSend(item);
                      const nRecv = qtySumRecv(item);
                      const inSendOrRecv = nSend > 0 || nRecv > 0;
                      return (
                        <div
                          key={item.id}
                          className={`flex flex-col min-[400px]:flex-row items-stretch min-[400px]:items-center justify-between gap-2 p-2.5 rounded-lg border transition-colors ${
                            inSendOrRecv
                              ? 'bg-gray-100 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                              : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                          }`}
                          dir="rtl"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            {item.type === 'product' ? (
                              <Package className="w-4 h-4 text-brand-blue-500 flex-shrink-0" />
                            ) : (
                              <Wrench className="w-4 h-4 text-amber-500 flex-shrink-0" />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 font-cairo leading-snug line-clamp-2 break-words">
                                {item.name}
                              </p>
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
                                <span className="text-xs font-mono font-medium text-gray-600 dark:text-gray-400 font-cairo tabular-nums">
                                  {item.sku}
                                </span>
                                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-cairo whitespace-nowrap">
                                  متوفر: {item.available_qty}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0 w-full min-[400px]:w-auto justify-end pt-0.5 min-[400px]:pt-0" dir="rtl">
                            {isReturn ? (
                              <button
                                type="button"
                                onClick={() => onAddToReceive(toItem(item))}
                                disabled={disabled}
                                title={nRecv > 0 ? 'زيادة الكمية في الاستلام' : undefined}
                                className="px-2 py-1 text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors font-cairo"
                              >
                                استلام{nRecv > 0 ? ` (${nRecv})` : ''}
                              </button>
                            ) : (
                              <>
                                {isMaintenance ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => onAddToReceive(toItem(item))}
                                      disabled={disabled}
                                      title={nRecv > 0 ? 'زيادة الكمية في الاستلام' : undefined}
                                      className="px-2 py-1 text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors font-cairo"
                                    >
                                      استلام{nRecv > 0 ? ` (${nRecv})` : ''}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => onAddToSend(toItem(item))}
                                      disabled={disabled}
                                      title={nSend > 0 ? 'زيادة الكمية في الإرسال' : undefined}
                                      className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors font-cairo"
                                    >
                                      إرسال{nSend > 0 ? ` (${nSend})` : ''}
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => onAddToSend(toItem(item))}
                                      disabled={disabled}
                                      title={nSend > 0 ? 'زيادة الكمية في الإرسال' : undefined}
                                      className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors font-cairo"
                                    >
                                      إرسال{nSend > 0 ? ` (${nSend})` : ''}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => onAddToReceive(toItem(item))}
                                      disabled={disabled}
                                      title={nRecv > 0 ? 'زيادة الكمية في الاستلام' : undefined}
                                      className="px-2 py-1 text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors font-cairo"
                                    >
                                      استلام{nRecv > 0 ? ` (${nRecv})` : ''}
                                    </button>
                                  </>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {!isSearching && query && results.length === 0 && (
                  <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-3 font-cairo">لا توجد نتائج</div>
                )}
              </div>
            </div>
          )}
        </div>
        {/* Product / Part toggles — same as OrderItemsEditor */}
        <div className="flex items-center gap-1 p-1 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700 flex-shrink-0">
          <button
            type="button"
            onClick={() => setSearchType('product')}
            disabled={disabled}
            className={`px-2 py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold font-cairo transition-all ${
              searchType === 'product'
                ? 'bg-brand-blue-100 dark:bg-brand-blue-900/40 text-brand-blue-700 dark:text-brand-blue-300'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
            }`}
          >
            منتجات
          </button>
          <button
            type="button"
            onClick={() => setSearchType('part')}
            disabled={disabled}
            className={`px-2 py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold font-cairo transition-all ${
              searchType === 'part'
                ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
            }`}
          >
            قطع
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Editable items selection — unified modal layout.
 * One search at top (like sell), with إرسال | استلام on each result. Two panels below.
 */
function EditableItemsView({
  callType,
  itemsToSend,
  itemsToReceive,
  onItemsToSendChange,
  onItemsToReceiveChange,
  onStockSearch,
  disabled,
}) {
  const isReturn = callType === 'return';
  const isMaintenance = callType === 'maintenance';
  /** إرسال + استلام: one toggle expands/collapses both columns (same as ServiceModalViewer). */
  const [itemsListsExpanded, setItemsListsExpanded] = useState(false);

  const getKey = (item) => item._uid ?? item.item_id ?? item.id;

  const sameProduct = (a, b) =>
    (a.item_id ?? a.id) != null &&
    (a.item_id ?? a.id) === (b.item_id ?? b.id) &&
    (a.type || 'product') === (b.type || 'product');

  const addToSend = useCallback(
    (item) => {
      const idx = itemsToSend.findIndex((row) => sameProduct(item, row));
      if (idx >= 0) {
        onItemsToSendChange(
          itemsToSend.map((row, j) => {
            if (j !== idx) return row;
            const q = (row.quantity ?? row.order_quantity ?? 1) + 1;
            return { ...row, quantity: q, order_quantity: q };
          })
        );
        return;
      }
      onItemsToSendChange([...itemsToSend, { ...item, condition: item.condition || 'valid', direction: 'send' }]);
    },
    [itemsToSend, onItemsToSendChange]
  );

  const addToReceive = useCallback(
    (item) => {
      const idx = itemsToReceive.findIndex((row) => sameProduct(item, row));
      if (idx >= 0) {
        onItemsToReceiveChange(
          itemsToReceive.map((row, j) => {
            if (j !== idx) return row;
            const q = (row.quantity ?? row.order_quantity ?? 1) + 1;
            return { ...row, quantity: q, order_quantity: q };
          })
        );
        return;
      }
      onItemsToReceiveChange([...itemsToReceive, { ...item, condition: item.condition || 'damaged', direction: 'receive' }]);
    },
    [itemsToReceive, onItemsToReceiveChange]
  );

  const updateSendQty = useCallback(
    (key, delta) => {
      onItemsToSendChange(
        itemsToSend.map((i) => {
          if (getKey(i) !== key) return i;
          const q = Math.max(1, (i.quantity ?? i.order_quantity ?? 1) + delta);
          return { ...i, quantity: q, order_quantity: q };
        })
      );
    },
    [itemsToSend, onItemsToSendChange]
  );

  const updateReceiveQty = useCallback(
    (key, delta) => {
      onItemsToReceiveChange(
        itemsToReceive.map((i) => {
          if (getKey(i) !== key) return i;
          const q = Math.max(1, (i.quantity ?? i.order_quantity ?? 1) + delta);
          return { ...i, quantity: q, order_quantity: q };
        })
      );
    },
    [itemsToReceive, onItemsToReceiveChange]
  );

  const updateSendCondition = useCallback(
    (key, condition) => {
      onItemsToSendChange(itemsToSend.map((i) => (getKey(i) === key ? { ...i, condition } : i)));
    },
    [itemsToSend, onItemsToSendChange]
  );

  const updateReceiveCondition = useCallback(
    (key, condition) => {
      onItemsToReceiveChange(itemsToReceive.map((i) => (getKey(i) === key ? { ...i, condition } : i)));
    },
    [itemsToReceive, onItemsToReceiveChange]
  );

  const removeFromSend = useCallback(
    (key) => onItemsToSendChange(itemsToSend.filter((i) => getKey(i) !== key)),
    [itemsToSend, onItemsToSendChange]
  );

  const removeFromReceive = useCallback(
    (key) => onItemsToReceiveChange(itemsToReceive.filter((i) => getKey(i) !== key)),
    [itemsToReceive, onItemsToReceiveChange]
  );

  if (isReturn) {
    return (
      <div className="space-y-3" dir="rtl">
        <UnifiedSearchWithSendReceive
          onStockSearch={onStockSearch}
          onAddToReceive={addToReceive}
          itemsToSend={[]}
          itemsToReceive={itemsToReceive}
          disabled={disabled}
          isReturn
        />
        <div className="border border-green-200 dark:border-green-700 rounded-lg bg-green-50 dark:bg-green-900/20 overflow-hidden">
          <div className="p-3 border-b border-green-200 dark:border-green-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-green-600 dark:text-green-400" />
                <h5 className="text-sm font-medium text-green-800 dark:text-green-200 font-cairo">
                  العناصر للإرجاع ({itemsToReceive.length})
                </h5>
              </div>
              {itemsToReceive.length > 0 && (
                <button
                  type="button"
                  onClick={() => onItemsToReceiveChange([])}
                  className="text-xs text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200 font-cairo"
                >
                  مسح الكل
                </button>
              )}
            </div>
          </div>
          <CollapsibleItemsList
            items={itemsToReceive}
            tone="green"
            empty={
              <div className="py-4 text-center text-xs text-gray-500 dark:text-gray-400">
                <Package className="mx-auto mb-1 h-4 w-4 text-gray-300 dark:text-gray-600" />
                لا توجد عناصر للإرجاع
              </div>
            }
            renderItem={(item, index) => (
              <ItemCard
                key={`receive-${getKey(item)}-${index}`}
                item={item}
                listRole="receive"
                dualPresenceAccent={itemAlsoInOtherColumn(item, itemsToSend)}
                onQuantityChange={updateReceiveQty}
                onRemove={removeFromReceive}
                onConditionChange={updateReceiveCondition}
                showCondition
                disabled={disabled}
              />
            )}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3" dir="rtl">
      <UnifiedSearchWithSendReceive
        onStockSearch={onStockSearch}
        onAddToSend={addToSend}
        onAddToReceive={addToReceive}
        itemsToSend={itemsToSend}
        itemsToReceive={itemsToReceive}
        disabled={disabled}
        isReturn={false}
        isMaintenance={isMaintenance}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Maintenance: receive first, send second. Replacement: send first, receive second */}
        {isMaintenance ? (
          <>
            <div className="border border-green-200 dark:border-green-700 rounded-lg bg-green-50 dark:bg-green-900/20 overflow-hidden">
              <div className="p-3 border-b border-green-200 dark:border-green-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <h5 className="text-sm font-medium text-green-800 dark:text-green-200 font-cairo">
                      العناصر للاستلام ({itemsToReceive.length})
                    </h5>
                  </div>
                  {itemsToReceive.length > 0 && (
                    <button type="button" onClick={() => onItemsToReceiveChange([])}
                      className="text-xs text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200 font-cairo">
                      مسح الكل
                    </button>
                  )}
                </div>
              </div>
              <CollapsibleItemsList
                syncExpanded={itemsListsExpanded}
                onSyncExpandedChange={setItemsListsExpanded}
                items={itemsToReceive}
                tone="green"
                empty={
                  <div className="py-4 text-center text-xs text-gray-500 dark:text-gray-400">
                    <Package className="mx-auto mb-1 h-4 w-4 text-gray-300 dark:text-gray-600" />
                    لا توجد عناصر للاستلام
                  </div>
                }
                renderItem={(item, index) => (
                  <ItemCard
                    key={`receive-${getKey(item)}-${index}`}
                    item={item}
                    listRole="receive"
                    dualPresenceAccent={itemAlsoInOtherColumn(item, itemsToSend)}
                    onQuantityChange={updateReceiveQty}
                    onRemove={removeFromReceive}
                    onConditionChange={updateReceiveCondition}
                    showCondition
                    disabled={disabled}
                  />
                )}
              />
            </div>
            <div className="border border-blue-200 dark:border-blue-700 rounded-lg bg-blue-50 dark:bg-blue-900/20 overflow-hidden">
              <div className="p-3 border-b border-blue-200 dark:border-blue-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <h5 className="text-sm font-medium text-blue-800 dark:text-blue-200 font-cairo">
                      العناصر للإرسال ({itemsToSend.length})
                    </h5>
                  </div>
                  {itemsToSend.length > 0 && (
                    <button type="button" onClick={() => onItemsToSendChange([])}
                      className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 font-cairo">
                      مسح الكل
                    </button>
                  )}
                </div>
              </div>
              <CollapsibleItemsList
                syncExpanded={itemsListsExpanded}
                onSyncExpandedChange={setItemsListsExpanded}
                items={itemsToSend}
                tone="blue"
                empty={
                  <div className="py-4 text-center text-xs text-gray-500 dark:text-gray-400">
                    <Package className="mx-auto mb-1 h-4 w-4 text-gray-300 dark:text-gray-600" />
                    لا توجد عناصر للإرسال
                  </div>
                }
                renderItem={(item, index) => (
                  <ItemCard
                    key={`send-${getKey(item)}-${index}`}
                    item={item}
                    listRole="send"
                    dualPresenceAccent={itemAlsoInOtherColumn(item, itemsToReceive)}
                    onQuantityChange={updateSendQty}
                    onRemove={removeFromSend}
                    onConditionChange={updateSendCondition}
                    showCondition
                    disabled={disabled}
                  />
                )}
              />
            </div>
          </>
        ) : (
          <>
        {/* Send panel — replacement: send first */}
        <div className="border border-blue-200 dark:border-blue-700 rounded-lg bg-blue-50 dark:bg-blue-900/20 overflow-hidden">
          <div className="p-3 border-b border-blue-200 dark:border-blue-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h5 className="text-sm font-medium text-blue-800 dark:text-blue-200 font-cairo">
                  العناصر للإرسال ({itemsToSend.length})
                </h5>
              </div>
              {itemsToSend.length > 0 && (
                <button
                  type="button"
                  onClick={() => onItemsToSendChange([])}
                  className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 font-cairo"
                >
                  مسح الكل
                </button>
              )}
            </div>
          </div>
          <CollapsibleItemsList
            syncExpanded={itemsListsExpanded}
            onSyncExpandedChange={setItemsListsExpanded}
            items={itemsToSend}
            tone="blue"
            empty={
              <div className="py-4 text-center text-xs text-gray-500 dark:text-gray-400">
                <Package className="mx-auto mb-1 h-4 w-4 text-gray-300 dark:text-gray-600" />
                لا توجد عناصر للإرسال
              </div>
            }
            renderItem={(item, index) => (
              <ItemCard
                key={`send-${getKey(item)}-${index}`}
                item={item}
                listRole="send"
                dualPresenceAccent={itemAlsoInOtherColumn(item, itemsToReceive)}
                onQuantityChange={updateSendQty}
                onRemove={removeFromSend}
                onConditionChange={updateSendCondition}
                showCondition
                disabled={disabled}
              />
            )}
          />
        </div>
        {/* Receive panel */}
        <div className="border border-green-200 dark:border-green-700 rounded-lg bg-green-50 dark:bg-green-900/20 overflow-hidden">
          <div className="p-3 border-b border-green-200 dark:border-green-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-green-600 dark:text-green-400" />
                <h5 className="text-sm font-medium text-green-800 dark:text-green-200 font-cairo">
                  العناصر للاستلام ({itemsToReceive.length})
                </h5>
              </div>
              {itemsToReceive.length > 0 && (
                <button
                  type="button"
                  onClick={() => onItemsToReceiveChange([])}
                  className="text-xs text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200 font-cairo"
                >
                  مسح الكل
                </button>
              )}
            </div>
          </div>
          <CollapsibleItemsList
            syncExpanded={itemsListsExpanded}
            onSyncExpandedChange={setItemsListsExpanded}
            items={itemsToReceive}
            tone="green"
            empty={
              <div className="py-4 text-center text-xs text-gray-500 dark:text-gray-400">
                <Package className="mx-auto mb-1 h-4 w-4 text-gray-300 dark:text-gray-600" />
                لا توجد عناصر للاستلام
              </div>
            }
            renderItem={(item, index) => (
              <ItemCard
                key={`receive-${getKey(item)}-${index}`}
                item={item}
                listRole="receive"
                dualPresenceAccent={itemAlsoInOtherColumn(item, itemsToSend)}
                onQuantityChange={updateReceiveQty}
                onRemove={removeFromReceive}
                onConditionChange={updateReceiveCondition}
                showCondition
                disabled={disabled}
              />
            )}
          />
        </div>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Call-center items selection — unified modal layout.
 * One search (like sell), إرسال | استلام on each result, two panels below.
 */
const CallCenterItemsSelection = ({
  callType,
  itemsToSend = [],
  itemsToReceive = [],
  onItemsToSendChange,
  onItemsToReceiveChange,
  onStockSearch,
  disabled = false,
  viewOnly = false,
}) => {
  if (viewOnly) {
    return (
      <ConfirmedItemsView
        callType={callType}
        itemsToSend={itemsToSend}
        itemsToReceive={itemsToReceive}
      />
    );
  }

  return (
    <EditableItemsView
      callType={callType}
      itemsToSend={itemsToSend}
      itemsToReceive={itemsToReceive}
      onItemsToSendChange={onItemsToSendChange}
      onItemsToReceiveChange={onItemsToReceiveChange}
      onStockSearch={onStockSearch}
      disabled={disabled}
    />
  );
};

CallCenterItemsSelection.propTypes = {
  callType: PropTypes.oneOf(['replacement', 'maintenance', 'return']).isRequired,
  itemsToSend: PropTypes.array,
  itemsToReceive: PropTypes.array,
  onItemsToSendChange: PropTypes.func.isRequired,
  onItemsToReceiveChange: PropTypes.func.isRequired,
  onStockSearch: PropTypes.func,
  disabled: PropTypes.bool,
  viewOnly: PropTypes.bool,
};

export { CollapsibleItemsList };
export default CallCenterItemsSelection;
