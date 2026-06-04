import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { Plus, Minus, Search, X, Package, Wrench, FileText, List } from 'lucide-react';
import CallCenterAmountPanel from './CallCenterAmountPanel';

/** × between unit price (or «سعر غير معروض») and quantity — chip, not a stray punctuation run */
function MultiplyChip() {
  return (
    <span
      className="inline-flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded-md bg-gray-100 px-1.5 text-[11px] font-semibold leading-none text-gray-500 dark:bg-gray-700/70 dark:text-gray-300"
      aria-hidden
      title="×"
    >
      ×
    </span>
  );
}

/** Unit price missing in UI — not the same as «free» or zero cost */
const PRICE_NOT_SHOWN_LABEL = 'سعر غير معروض';
const PRICE_NOT_SHOWN_TITLE =
  'السعر غير ظاهر هنا من المخزون أو الطلب — لا يعني أن البند مجانياً أو بصفر؛ راجع المجموع أو COD أو مصدر التسعير الفعلي.';

/**
 * Order Items Editor Component (Mini-POS)
 * Allows editing order items during call session.
 * وصف الطلب = order_description (ERP shipping_details: items text like "1 * كبه هفار...")
 * Agent sees this and manually converts to items via search. Never use address here.
 *
 * @param {array} items - Initial items array
 * @param {function} onItemsChange - Handler when items change `(items)` — does not pass totals (COD is user-only)
 * @param {function} onUserCodChange - When agent sets COD / flow via amount panel `( { flow, signed } )`
 * @param {function} onStockSearch - Handler for stock search (returns promise)
 * @param {string} notes - order_description (ERP items text), NOT delivery_address
 * @param {function} onNotesChange - Handler when notes change
 * @param {string} defaultViewMode - 'items' | 'notes' | undefined. When 'items', show items tab by default (sell flow).
 */
const OrderItemsEditor = ({ 
  items = [], 
  onItemsChange,
  onUserCodChange,
  onStockSearch,
  notes = '',
  onNotesChange,
  defaultViewMode,
  initialTotal,
  cashFlowMode = 'collect',
  onCashFlowModeChange,
  bostaCod = null,
  amountPanelDisabled = false,
  /** @deprecated Parent should use onUserCodChange; kept for one-frame compatibility */
  onExplicitAmountCommit,
}) => {
  const [editingItems, setEditingItems] = useState(items);
  const [showStockSearch, setShowStockSearch] = useState(false);
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [stockResults, setStockResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchType, setSearchType] = useState('product'); // 'product' | 'part' | 'all'
  const searchRef = useRef(null);
  const searchDebounceRef = useRef(null);
  const searchTypeRef = useRef(searchType);
  const stockSearchQueryRef = useRef(stockSearchQuery);
  searchTypeRef.current = searchType;
  stockSearchQueryRef.current = stockSearchQuery;
  
  // View mode: 'items' or 'notes' - defaultViewMode='items' for sell flow; else items if matched, else notes
  const [viewMode, setViewMode] = useState(() => {
    if (defaultViewMode === 'items') return 'items';
    return items && items.length > 0 ? 'items' : 'notes';
  });
  // When items arrive later (e.g. auto-match), switch to items view so agent sees auto-selected products
  useEffect(() => {
    if (items && items.length > 0 && viewMode === 'notes') {
      setViewMode('items');
    }
  }, [items?.length]);
  
  // Local notes state
  const [editingNotes, setEditingNotes] = useState(notes || '');
  const [tempNotes, setTempNotes] = useState(notes || '');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesEditHistory, setNotesEditHistory] = useState([]);
  
  // Update notes when props change
  useEffect(() => {
    setEditingNotes(notes || '');
    setTempNotes(notes || '');
  }, [notes]);
  
  // Handle notes change (for direct textarea editing)
  const handleNotesChange = (value) => {
    setEditingNotes(value);
    if (onNotesChange) {
      onNotesChange(value);
    }
  };
  
  // Start editing notes
  const handleStartEditNotes = () => {
    setTempNotes(editingNotes);
    setIsEditingNotes(true);
  };
  
  // Cancel editing notes
  const handleCancelEditNotes = () => {
    setTempNotes(editingNotes);
    setIsEditingNotes(false);
  };
  
  // Confirm editing notes
  const handleConfirmEditNotes = () => {
    setEditingNotes(tempNotes);
    if (onNotesChange) {
      onNotesChange(tempNotes);
    }
    
    // Add to edit history
    const newHistory = {
      agentName: 'المستخدم', // You can pass this as prop if needed
      editDate: new Date()
    };
    setNotesEditHistory(prev => [newHistory, ...prev]);
    
    setIsEditingNotes(false);
  };
  
  // Get relative time helper
  const getRelativeTime = (date) => {
    if (!date) return '';
    const now = new Date();
    const editDate = new Date(date);
    const diffMs = now - editDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    return editDate.toLocaleDateString('ar-EG');
  };
  
  // Close search dropdown when clicking outside (always, even when query is non-empty)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowStockSearch(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, []);
  
  /**
   * COD magnitude is user-driven only (amount panel).
   * If savedTotalOverride is null, show hydrated value from parent `initialTotal` (snapshot / order cod), else 0.
   * Line-item Σ(price×qty) is never applied as COD.
   */
  const [savedTotalOverride, setSavedTotalOverride] = useState(null);
  const codMagnitude =
    savedTotalOverride !== null
      ? savedTotalOverride
      : Math.abs(Number(initialTotal) || 0);
  const signedTotal =
    cashFlowMode === 'refund'
      ? codMagnitude === 0
        ? 0
        : -Math.abs(codMagnitude)
      : Math.abs(codMagnitude);
  
  // Sync from parent before paint so the notify effect below never runs with stale [] while props already have lines (was wiping editableItems in CallSessionFAB).
  useLayoutEffect(() => {
    setEditingItems(items);
  }, [items]);
  
  useEffect(() => {
    if (onItemsChange) {
      onItemsChange(editingItems);
    }
  }, [editingItems, onItemsChange]);

  const handleAmountPanelChange = useCallback(
    ({ flow, magnitude, signed }) => {
      onCashFlowModeChange?.(flow);
      const mag = Math.max(0, Number(magnitude) || 0);
      setSavedTotalOverride(mag);
      onExplicitAmountCommit?.();
      const s =
        signed !== undefined && Number.isFinite(Number(signed))
          ? Number(signed)
          : flow === 'refund'
            ? mag === 0
              ? 0
              : -mag
            : mag;
      onUserCodChange?.({ flow, signed: s });
    },
    [onCashFlowModeChange, onExplicitAmountCommit, onUserCodChange]
  );
  
  /** When user is typing quantity: { [itemKey]: inputValue } */
  const [editingQty, setEditingQty] = useState({});
  
  const handleQuantityChange = (itemKey, delta) => {
    setEditingItems((prev) => {
      const item = prev.find((i) => getItemKey(i) === itemKey);
      if (!item) return prev;
      const current = item.order_quantity || 1;
      const newQuantity = current + delta;
      if (newQuantity <= 0) {
        return prev.filter((i) => getItemKey(i) !== itemKey);
      }
      return prev.map((i) =>
        getItemKey(i) === itemKey ? { ...i, order_quantity: newQuantity } : i
      );
    });
  };

  /** Set quantity from typed value (blur/Enter). 0 = remove line; 1–9999 otherwise. */
  const handleQuantitySet = (itemKey, value) => {
    const raw = String(value).trim();
    if (raw === '') return;
    const n = parseInt(raw, 10);
    if (n === 0) {
      setEditingItems((prev) => prev.filter((item) => getItemKey(item) !== itemKey));
      setEditingQty((prev) => {
        const next = { ...prev };
        delete next[itemKey];
        return next;
      });
      return;
    }
    if (isNaN(n) || n < 1) return;
    const clamped = Math.min(9999, n);
    setEditingItems((prev) =>
      prev.map((item) =>
        getItemKey(item) === itemKey ? { ...item, order_quantity: clamped } : item
      )
    );
    setEditingQty((prev) => {
      const next = { ...prev };
      delete next[itemKey];
      return next;
    });
  };
  
  const handleRemoveItem = (itemKey) => {
    setEditingItems(prev => prev.filter(item => getItemKey(item) !== itemKey));
  };
  
  const handleSearchStock = useCallback(async (query) => {
    setStockSearchQuery(query);
    
    if (!query || !onStockSearch) {
      setStockResults([]);
      return;
    }
    
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    const typeToUse = searchTypeRef.current;
    searchDebounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await onStockSearch(query, typeToUse);
        setStockResults(results || []);
        // Auto-switch: if results are only parts but toggle is products, switch to parts (and vice versa)
        if (results?.length > 0) {
          const hasProducts = results.some(r => r.type === 'product');
          const hasParts = results.some(r => r.type === 'part');
          if (hasParts && !hasProducts && typeToUse === 'product') setSearchType('part');
          else if (hasProducts && !hasParts && typeToUse === 'part') setSearchType('product');
        }
      } catch (error) {
        if (import.meta.env.DEV) console.error('Stock search error:', error);
        setStockResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);
  }, [onStockSearch]);

  // Re-search when toggle changes and we have a query
  useEffect(() => {
    const q = stockSearchQueryRef.current?.trim();
    if (q && onStockSearch) handleSearchStock(q);
  }, [searchType]);

  const getItemKey = (item) => item._uid ?? item.item_id;

  useEffect(() => {
    const valid = new Set(editingItems.map(getItemKey));
    setEditingQty((prev) => {
      let changed = false;
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        if (!valid.has(k)) {
          delete next[k];
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [editingItems]);

  const handleAddStockItem = (stockItem) => {
    setEditingItems((prev) => {
      const sameLine = prev.find(
        (row) =>
          row.item_id === stockItem.id && (row.type || 'product') === (stockItem.type || 'product')
      );
      if (sameLine) {
        const key = getItemKey(sameLine);
        return prev.map((row) =>
          getItemKey(row) === key
            ? {
                ...row,
                order_quantity: (row.order_quantity || 1) + 1,
                quantity: (row.quantity || row.order_quantity || 1) + 1
              }
            : row
        );
      }
      const newItem = {
        _uid: `new-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        item_id: stockItem.id,
        sku: stockItem.sku,
        name: stockItem.name,
        type: stockItem.type,
        available_qty: stockItem.available_qty,
        price_customer: stockItem.price_customer,
        price_merchant: stockItem.price_merchant,
        order_quantity: 1
      };
      return [...prev, newItem];
    });

    // Clear search
    setStockSearchQuery('');
    setStockResults([]);
    setShowStockSearch(false);
  };
  
  // Separate items: parts are explicit; everything else (product, null from auto-match not_found, etc.)
  // renders in the product column. Matching only `type === 'product'` hid untyped rows → blank list + no empty state.
  const parts = editingItems.filter(item => item.type === 'part');
  const products = editingItems.filter(item => item.type !== 'part');

  /** Shared − / input / + / حذف — − at qty 1 removes the line; typing 0 removes */
  const renderQtyStepper = (item) => {
    const key = getItemKey(item);
    const q = item.order_quantity || 1;
    return (
      <div className="flex items-center gap-1.5 flex-shrink-0" dir="rtl">
        <div className="inline-flex min-w-0 items-stretch overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-800">
          <button
            type="button"
            onClick={() => handleQuantityChange(key, -1)}
            className="flex h-8 w-8 shrink-0 items-center justify-center text-gray-600 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gray-400/50 dark:text-gray-400 dark:hover:bg-gray-700/70 dark:focus-visible:ring-gray-500/40"
            title={q <= 1 ? 'إزالة السطر' : 'تقليل الكمية'}
            aria-label={q <= 1 ? 'إزالة السطر' : 'تقليل الكمية'}
          >
            <Minus className="h-3.5 w-3.5" strokeWidth={2.25} />
          </button>
          <input
            type="number"
            min={0}
            max={9999}
            inputMode="numeric"
            className="w-11 px-1 py-1.5 text-center text-xs font-bold text-gray-900 dark:text-gray-100 font-cairo tabular-nums bg-transparent border-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:outline-none focus:ring-0"
            value={editingQty[key] !== undefined ? editingQty[key] : q}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, '');
              setEditingQty((prev) => ({ ...prev, [key]: v }));
            }}
            onFocus={() => setEditingQty((prev) => ({ ...prev, [key]: String(q) }))}
            onBlur={(e) => {
              const v = editingQty[key] !== undefined ? editingQty[key] : e.target.value;
              const raw = String(v).trim();
              if (raw === '') {
                setEditingQty((prev) => {
                  const n = { ...prev };
                  delete n[key];
                  return n;
                });
                handleQuantitySet(key, '1');
                return;
              }
              handleQuantitySet(key, raw);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.target.blur();
            }}
            aria-label="الكمية"
          />
          <button
            type="button"
            onClick={() => handleQuantityChange(key, 1)}
            className="flex h-8 w-8 shrink-0 items-center justify-center text-gray-600 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gray-400/50 dark:text-gray-400 dark:hover:bg-gray-700/70 dark:focus-visible:ring-gray-500/40"
            title="زيادة الكمية"
            aria-label="زيادة الكمية"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.25} />
          </button>
        </div>
        <button
          type="button"
          onClick={() => handleRemoveItem(key)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-red-600 dark:hover:bg-gray-700/70 dark:hover:text-red-400"
          aria-label="حذف"
          title="حذف"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2.25} />
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-2 sm:space-y-2.5 md:space-y-3" dir="rtl">
      {/* Toggle Tabs + Search Bar / Notes Title - Same Horizontal Bar */}
      <div className="flex items-center gap-2">
        {/* Toggle Tabs - Icon Only */}
        <div className="flex items-center gap-1 p-1 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700 flex-shrink-0">
          <button
            onClick={() => setViewMode('items')}
            className={`
              p-2 rounded-md transition-all duration-200
              ${viewMode === 'items'
                ? 'bg-white dark:bg-gray-800 text-brand-blue-600 dark:text-brand-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }
            `}
            title="المنتجات"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('notes')}
            className={`
              p-2 rounded-md transition-all duration-200
              ${viewMode === 'notes'
                ? 'bg-white dark:bg-gray-800 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }
            `}
            title="الملاحظات"
          >
            <FileText className="w-4 h-4" />
          </button>
        </div>
        
        {/* Notes Title + Controls - Show when notes mode */}
        {viewMode === 'notes' && (
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 font-cairo whitespace-nowrap">
              وصف الطلب
            </h4>
            <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
              {/* Edit History Chip */}
              {notesEditHistory.length > 0 && (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-md flex-shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-blue-500 dark:bg-brand-blue-400 flex-shrink-0"></div>
                  <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300 font-cairo whitespace-nowrap">
                    {notesEditHistory.length} تعديل
                  </span>
                  <span className="text-[9px] text-gray-400 dark:text-gray-500 font-cairo">•</span>
                  <span className="text-[10px] text-gray-600 dark:text-gray-400 font-cairo truncate max-w-[60px]">
                    {notesEditHistory[0].agentName}
                  </span>
                  <span className="text-[9px] text-gray-400 dark:text-gray-500 font-cairo">•</span>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-cairo whitespace-nowrap">
                    {getRelativeTime(notesEditHistory[0].editDate)}
                  </span>
                </div>
              )}
              {!isEditingNotes && (
                <button
                  onClick={handleStartEditNotes}
                  className="px-2.5 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-md transition-colors font-cairo whitespace-nowrap flex-shrink-0"
                >
                  تعديل
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* Search + منتجات/قطع — بدون خلفية إضافية؛ يتوافق مع باقي البطاقات */}
        {viewMode === 'items' && (
          <div className="flex-1 min-w-0" ref={searchRef}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-2.5">
              <div className="relative flex-1 min-w-0 min-h-[2.75rem]">
                <div className="relative h-full">
                  <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 z-10 pointer-events-none" />
                  <input
                    type="text"
                    placeholder={
                      searchType === 'product'
                        ? 'بحث منتجات — اسم أو SKU'
                        : searchType === 'part'
                          ? 'بحث قطع — اسم أو SKU'
                          : 'ابحث عن منتج أو قطعة...'
                    }
                    value={stockSearchQuery}
                    onChange={(e) => handleSearchStock(e.target.value)}
                    onFocus={() => {
                      setShowStockSearch(true);
                      if (stockSearchQuery?.trim()) handleSearchStock(stockSearchQuery);
                    }}
                    onClick={() => {
                      if (stockSearchQuery?.trim()) {
                        setShowStockSearch(true);
                        handleSearchStock(stockSearchQuery);
                      }
                    }}
                    className="w-full h-full min-h-[2.75rem] px-3 pr-9 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-cairo placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500 transition-all duration-150"
                    dir="rtl"
                  />
                </div>
                {/* Search Results Dropdown */}
                {showStockSearch && stockSearchQuery && (
            <div className="absolute top-full left-0 right-0 z-[100] mt-1.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xl ring-1 ring-black/5 dark:ring-white/10 overflow-hidden">
              <div
                className="max-h-[min(28rem,calc(100dvh-10rem))] sm:max-h-[min(26rem,55vh)] overflow-y-auto overscroll-contain scrollbar-dropdown py-1 touch-pan-y [scrollbar-gutter:stable]"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                {isSearching && (
                  <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-3 font-cairo">
                    جاري البحث...
                  </div>
                )}
                {!isSearching && stockResults.length > 0 && (
                  <div className="px-1.5 pb-1.5 space-y-1">
                    {stockResults.map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleAddStockItem(item)}
                        className="w-full text-right p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 hover:border-brand-blue-500 dark:hover:border-brand-blue-600 hover:bg-brand-blue-50 dark:hover:bg-brand-blue-900/20 transition-all duration-200"
                        dir="rtl"
                      >
                        <div className="flex flex-col min-[420px]:flex-row items-stretch min-[420px]:items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
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
                          <div className="flex-shrink-0 self-end min-[420px]:self-start pt-0.5 min-[420px]:pt-0">
                            <span className="text-sm font-bold text-brand-blue-600 dark:text-brand-blue-400 font-cairo tabular-nums whitespace-nowrap">
                              {new Intl.NumberFormat('ar-EG', {
                                style: 'currency',
                                currency: 'EGP'
                              }).format(item.price_customer)}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {!isSearching && stockSearchQuery && stockResults.length === 0 && (
                  <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-3 font-cairo">
                    لا توجد نتائج
                  </div>
                )}
              </div>
            </div>
          )}
              </div>
              {/* منتجات / قطع */}
              <div className="flex items-center justify-center sm:justify-end gap-1 p-1 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700 flex-shrink-0 self-center sm:self-stretch sm:py-1">
                <button
                  type="button"
                  onClick={() => setSearchType('product')}
                  className={`inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold font-cairo transition-all min-h-[2.25rem] ${
                    searchType === 'product'
                      ? 'bg-blue-600 text-white shadow-sm dark:bg-blue-600 dark:text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  title="منتجات"
                >
                  <Package className="w-3.5 h-3.5 shrink-0" />
                  <span>منتجات</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSearchType('part')}
                  className={`inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold font-cairo transition-all min-h-[2.25rem] ${
                    searchType === 'part'
                      ? 'bg-amber-500 text-white shadow-sm dark:bg-amber-600 dark:text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  title="قطع"
                >
                  <Wrench className="w-3.5 h-3.5 shrink-0" />
                  <span>قطع</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Items View */}
      {viewMode === 'items' && (
        <>
          {/* Selected Products - Creative Compact Design */}
          {products.length > 0 && (
        <div className="space-y-2">
          {products.map(item => (
            <div
              key={getItemKey(item)}
              className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden"
            >
              <div className="flex items-start sm:items-center justify-between gap-2 sm:gap-3 p-2.5 sm:p-3">
                {/* Product Info */}
                <div className="flex-1 min-w-0" dir="rtl">
                  <div className="flex items-center gap-2 mb-1.5 min-w-0">
                    <Package className="w-4 h-4 text-brand-blue-600 dark:text-brand-blue-400 flex-shrink-0" />
                    <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 font-cairo truncate min-w-0">
                      {item.name}
                    </h4>
                    {item.sku && (
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 font-cairo flex-shrink-0 px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700/70">
                        {item.sku}
                      </span>
                    )}
                  </div>
                  
                  {/* Price × qty (read-only summary); × shown as chip — editors are in renderQtyStepper */}
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1">
                    {(item.price_customer != null && item.price_customer > 0) ? (
                      <>
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 font-cairo tabular-nums">
                          {new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', minimumFractionDigits: 0 }).format(item.price_customer)}
                        </span>
                        <MultiplyChip />
                        <span className="text-xs font-semibold tabular-nums text-gray-800 dark:text-gray-100">
                          {item.order_quantity || 1}
                        </span>
                      </>
                    ) : (
                      <>
                        <span
                          title={PRICE_NOT_SHOWN_TITLE}
                          className="cursor-default border-b border-dotted border-gray-400 text-xs text-gray-600 dark:border-gray-500 dark:text-gray-300 font-cairo"
                        >
                          {PRICE_NOT_SHOWN_LABEL}
                        </span>
                        <MultiplyChip />
                        <span className="text-xs font-semibold tabular-nums text-gray-800 dark:text-gray-100">
                          {item.order_quantity || 1}
                        </span>
                      </>
                    )}
                    {(item.price_customer != null && item.price_customer > 0) && (
                      <span className="text-sm font-bold text-accent-green-700 dark:text-accent-green-300 font-cairo ms-1">
                        {new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', minimumFractionDigits: 2 }).format((item.price_customer || 0) * (item.order_quantity || 0))}
                      </span>
                    )}
                  </div>
                </div>

                {renderQtyStepper(item)}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Selected Parts - Same design system as products */}
      {parts.length > 0 && (
        <div className="space-y-2">
          {parts.map(item => (
            <div
              key={getItemKey(item)}
              className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden"
            >
              <div className="flex items-start sm:items-center justify-between gap-2 sm:gap-3 p-2.5 sm:p-3">
                {/* Part Info */}
                <div className="flex-1 min-w-0" dir="rtl">
                  <div className="flex items-center gap-2 mb-1.5 min-w-0">
                    <Wrench className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                    <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 font-cairo truncate min-w-0">
                      {item.name}
                    </h4>
                    {item.sku && (
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 font-cairo flex-shrink-0 px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700/70">
                        {item.sku}
                      </span>
                    )}
                  </div>
                  
                  {/* Price × qty — same chip × as products */}
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1">
                    {(item.price_customer != null && item.price_customer > 0) ? (
                      <>
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 font-cairo tabular-nums">
                          {new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', minimumFractionDigits: 0 }).format(item.price_customer)}
                        </span>
                        <MultiplyChip />
                        <span className="text-xs font-semibold tabular-nums text-gray-800 dark:text-gray-100">
                          {item.order_quantity || 1}
                        </span>
                      </>
                    ) : (
                      <>
                        <span
                          title={PRICE_NOT_SHOWN_TITLE}
                          className="cursor-default border-b border-dotted border-gray-400 text-xs text-gray-600 dark:border-gray-500 dark:text-gray-300 font-cairo"
                        >
                          {PRICE_NOT_SHOWN_LABEL}
                        </span>
                        <MultiplyChip />
                        <span className="text-xs font-semibold tabular-nums text-gray-800 dark:text-gray-100">
                          {item.order_quantity || 1}
                        </span>
                      </>
                    )}
                    {(item.price_customer != null && item.price_customer > 0) && (
                      <span className="text-sm font-bold text-amber-700 dark:text-amber-300 font-cairo ms-1">
                        {new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', minimumFractionDigits: 2 }).format((item.price_customer || 0) * (item.order_quantity || 0))}
                      </span>
                    )}
                  </div>
                </div>

                {renderQtyStepper(item)}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Empty State */}
      {editingItems.length === 0 && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 p-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 font-cairo">
            لا توجد عناصر في الطلب
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 font-cairo mt-1">
            ابحث عن منتج أو أضف وصف في تبويب الملاحظات
          </p>
        </div>
      )}
      
      {/* Total / COD — يظهر حتى بدون بنود (COD يدوي / طلب فارغ) */}
      <CallCenterAmountPanel
        variant="embedded"
        amountLabel="التكلفة"
        subtitle="تحصيل أو استرداد · ج.م"
        className="mt-2 sm:mt-2.5"
        signedAmount={signedTotal}
        flowMode={cashFlowMode}
        onChange={handleAmountPanelChange}
        bostaCod={bostaCod}
        disabled={amountPanelDisabled}
      />
        </>
      )}
      
      {/* Notes Content - Unified Layout */}
      {viewMode === 'notes' && (
        <div className="space-y-3">
          {/* Content Area - when empty: show editable textarea; when has content: show read-only or edit mode */}
          {isEditingNotes ? (
            <div className="space-y-2">
              <textarea
                value={tempNotes}
                onChange={(e) => setTempNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-cairo focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-150 resize-y min-h-[4.5rem]"
                placeholder="عناصر الطلب من ERP (مثال: 1 * كبه هفار 2000 وات...)"
                dir="rtl"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={handleCancelEditNotes}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors font-cairo"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleConfirmEditNotes}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-amber-600 dark:bg-amber-700 hover:bg-amber-700 dark:hover:bg-amber-600 rounded-md transition-colors font-cairo"
                >
                  تأكيد
                </button>
              </div>
            </div>
          ) : !editingNotes?.trim() ? (
            /* No description: show editable textarea (never "لا يوجد وصف") */
            <textarea
              value={editingNotes}
              onChange={(e) => handleNotesChange(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-cairo focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-150 resize-y min-h-[4.5rem] placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="أدخل وصف الطلب أو ابحث عن المنتجات في تبويب العناصر"
              dir="rtl"
            />
          ) : (
            <div
              onClick={handleStartEditNotes}
              className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 min-h-[4.5rem] cursor-text hover:border-amber-400 dark:hover:border-amber-600 transition-colors"
            >
              <p className="text-sm text-gray-900 dark:text-gray-100 font-cairo whitespace-pre-line">
                {editingNotes.trim()}
              </p>
            </div>
          )}
          
          {/* Total / COD — يظهر حتى بدون بنود */}
          <CallCenterAmountPanel
            variant="embedded"
            amountLabel="التكلفة"
            subtitle="تحصيل أو استرداد · ج.م"
            className="mt-2 sm:mt-2.5"
            signedAmount={signedTotal}
            flowMode={cashFlowMode}
            onChange={handleAmountPanelChange}
            bostaCod={bostaCod}
            disabled={amountPanelDisabled}
          />
        </div>
      )}
    </div>
  );
};

export default OrderItemsEditor;
