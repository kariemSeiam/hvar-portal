import { memo, useState, useMemo, useCallback, useEffect } from 'react';
import { History, Search, ChevronLeft, ChevronRight, X, Calendar, FileDown, ChevronDown, Activity, Package, CheckCircle, Wrench } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { EmptyState } from '../ui';
import { stockAPI } from '../../api/stockAPI';
import {
    getMovementTypeLabel,
    filterStockItems,
    formatMovementDate,
    formatRelativeTime
} from '../../utils/stock/utils';
import MovementTableRow from './MovementTableRow';

/**
 * StockMovements Component - Refactored for Backend API Compliance
 * 
 * This component has been refactored to align with the actual backend Stock API
 * as defined in /app/api/stock_api.py and documented in /docs/stock.md
 * 
 * Key Changes:
 * 1. Movement Types: Now use backend values (SEND, RECEIVE, MANUAL)
 *    - Old: COMMIT_SEND, ASSEMBLY_PART_OUT, RESERVE, CANCEL_RESERVATION, etc.
 *    - New: SEND (outgoing/reservation), RECEIVE (incoming/return), MANUAL (adjustments)
 * 
 * 2. Reference Types: Added proper reference_type filtering
 *    - service_ticket: Movements linked to service tickets
 *    - manual_adjustment: Manual stock corrections
 * 
 * 3. Conditions: Using backend values (valid, damaged)
 *    - valid: Good, usable items
 *    - damaged: Broken or unusable items
 * 
 * 4. Date Range Filtering: Added start_date and end_date (YYYY-MM-DD format)
 *    - Supports filtering movements by date range
 * 
 * 5. Sorting: Full support for backend sort options
 *    - created_at: Sort by movement timestamp (default)
 *    - id: Sort by movement record ID
 *    - movement_type: Sort by type of movement
 *    - quantity: Sort by quantity changed
 * 
 * 6. Pagination: Uses backend pagination response structure
 *    - offset/limit based pagination (not page-based)
 *    - has_more flag for determining next page availability
 * 
 * API Integration:
 * - Calls: GET /api/stock/movements with query parameters
 * - Supports: movement_type, reference_type, condition, item_type, start_date, end_date
 * - Sorting: order_by, order_direction (ASC/DESC)
 * - Pagination: limit, offset
 * 
 * Response Structure (from backend):
 * {
 *   "data": [
 *     {
 *       "id": 1,
 *       "item_id": 1,
 *       "quantity": 10,           // Signed quantity: positive=increase, negative=decrease
 *       "movement_type": "SEND",  // SEND, RECEIVE, or MANUAL
 *       "condition": "valid",     // valid or damaged
 *       "reference_type": "service_ticket",  // service_ticket or manual_adjustment
 *       "reference_id": 123,
 *       "created_by": "admin",
 *       "created_at": "2025-10-27T10:00:00",
 *       "notes": "Reserved for replacement",
 *       "sku": "PROD-001",
 *       "item_name": "Mobile Phone",
 *       "item_type": "product"
 *     }
 *   ],
 *   "pagination": {
 *     "total": 100,
 *     "limit": 50,
 *     "offset": 0,
 *     "has_more": true
 *   }
 * }
 */


/** Default movement filters (for clear-all). */
const DEFAULT_MOVEMENT_FILTERS = {
    movementTypes: [],
    itemTypes: [],
    conditions: [],
    serviceTypes: [],
    startDate: '',
    endDate: '',
    datePreset: 'all',
    sortBy: 'created_at',
    sortOrder: 'desc',
    limit: 50,
};

/** Stock page filter dropdown active state — match Products/Parts chips (brand-blue). */
const filterBtnBase = 'border-2 border-stone-200 dark:border-gray-600 rounded-xl text-xs sm:text-sm text-right focus:outline-none font-cairo transition-all duration-200 flex items-center justify-between group gap-2 shadow-sm dark:shadow-none';
const filterBtnInactive = 'bg-stone-50 dark:bg-gray-700/60 text-stone-700 dark:text-gray-300 hover:border-brand-blue-300 dark:hover:border-brand-blue-600/50 hover:bg-brand-blue-50/80 dark:hover:bg-brand-blue-900/20 hover:text-brand-blue-700 dark:hover:text-brand-blue-300';
const filterBtnActive = 'bg-brand-blue-500 dark:bg-brand-blue-600 text-white border-brand-blue-500 dark:border-brand-blue-600 shadow-md ring-2 ring-brand-blue-400/30 dark:ring-brand-blue-500/40';

/**
 * StockMovementsView — props-driven, page-owned data.
 * Filters: movement type, item type, condition, service type, date presets + inline custom range (no dropdown).
 */
const StockMovementsView = memo(({
    movements = [],
    pagination = {},
    isLoading = false,
    filters = DEFAULT_MOVEMENT_FILTERS,
    onFilterChange,
    onPageChange,
    onRefresh,
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [openFilterId, setOpenFilterId] = useState(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('.stock-movements-filter-dropdown')) setOpenFilterId(null);
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const f = filters;
    const selectedMovementTypes = f.movementTypes || [];
    const selectedItemTypes = f.itemTypes || [];
    const selectedConditions = f.conditions || [];
    const selectedServiceTypes = f.serviceTypes || [];
    const startDate = f.startDate || '';
    const endDate = f.endDate || '';
    const datePreset = f.datePreset || 'all';
    const sortBy = f.sortBy || 'created_at';
    const sortOrder = f.sortOrder || 'desc';
    const pageLimit = f.limit ?? 50;

    // ============================================
    // Filter Options - Backend API Compliant
    // ============================================

    const movementTypeOptions = {
        'SEND': 'إرسال',
        'RECEIVE': 'استلام',
        'MANUAL': 'تعديل يدوي',
        'RESERVE': 'حجز'
    };

    const itemTypeOptions = {
        'product': 'منتجات',
        'part': 'قطع'
    };

    const conditionOptions = {
        'valid': 'سليم',
        'damaged': 'تالف'
    };

    const serviceTypeOptions = {
        'replacement': 'استبدال',
        'maintenance': 'صيانة',
        'return': 'إرجاع واسترداد'
    };

    const sortOptions = {
        'created_at': 'التاريخ',
        'id': 'الرقم',
        'movement_type': 'نوع الحركة',
        'quantity': 'الكمية'
    };

    const datePresetOptions = {
        'all': 'الكل',
        'today': 'اليوم',
        'yesterday': 'أمس',
        'thisWeek': 'هذا الأسبوع',
        'lastWeek': 'الأسبوع الماضي',
        'thisMonth': 'هذا الشهر',
        'lastMonth': 'الشهر الماضي',
        'custom': 'تخصيص'
    };

    const datePresetLabels = {
        'all': 'الكل',
        'today': 'اليوم',
        'yesterday': 'أمس',
        'thisWeek': 'هذا الأسبوع',
        'lastWeek': 'آخر 7 أيام',
        'thisMonth': 'هذا الشهر',
        'lastMonth': 'الشهر الماضي',
        'custom': 'مخصص'
    };

    // ============================================
    // Date Range Utilities
    // ============================================

    /**
     * Calculate date range for preset selection
     * @param {string} preset - Date preset key
     * @returns {Object} Object with start_date and end_date (YYYY-MM-DD format)
     */
    const getDateRange = (preset) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        switch (preset) {
            case 'today':
                const todayStr = today.toISOString().split('T')[0];
                return { start_date: todayStr, end_date: todayStr };

            case 'yesterday':
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().split('T')[0];
                return { start_date: yesterdayStr, end_date: yesterdayStr };

            case 'thisWeek':
                const startOfWeek = new Date(today);
                const dayOfWeek = startOfWeek.getDay();
                const daysToMonday = (dayOfWeek === 6 ? 0 : dayOfWeek + 1); // Convert Sunday=0 to Monday=6
                startOfWeek.setDate(startOfWeek.getDate() - daysToMonday);
                return { start_date: startOfWeek.toISOString().split('T')[0], end_date: today.toISOString().split('T')[0] };

            case 'lastWeek':
                const endOfLastWeek = new Date(today);
                const dayOfWeek2 = endOfLastWeek.getDay();
                const daysToSunday = dayOfWeek2 === 0 ? 0 : dayOfWeek2;
                endOfLastWeek.setDate(endOfLastWeek.getDate() - daysToSunday - 1);
                const startOfLastWeek = new Date(endOfLastWeek);
                startOfLastWeek.setDate(startOfLastWeek.getDate() - 6);
                return { start_date: startOfLastWeek.toISOString().split('T')[0], end_date: endOfLastWeek.toISOString().split('T')[0] };

            case 'thisMonth':
                const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                return { start_date: startOfMonth.toISOString().split('T')[0], end_date: today.toISOString().split('T')[0] };

            case 'lastMonth':
                const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
                return { start_date: startOfLastMonth.toISOString().split('T')[0], end_date: endOfLastMonth.toISOString().split('T')[0] };

            default:
                return { start_date: '', end_date: '' };
        }
    };

    // ============================================
    // Search Debouncing
    // ============================================

    // Search debouncing - wait 300ms after last keystroke before filtering
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // ============================================
    // Event Handlers
    // Parent loads when filters change; no local load effect

    /**
     * Handle search input change
     * @param {Event} e - Change event
     */
    const handleSearchChange = useCallback((e) => setSearchTerm(e.target.value), []);

    const updateFilters = useCallback((patch) => {
        if (typeof onFilterChange !== 'function') return;
        onFilterChange({ ...f, ...patch });
    }, [f, onFilterChange]);

    const handleMovementTypeToggle = useCallback((type) => {
        const next = selectedMovementTypes.includes(type)
            ? selectedMovementTypes.filter(t => t !== type)
            : [...selectedMovementTypes, type];
        updateFilters({ movementTypes: next });
    }, [selectedMovementTypes, updateFilters]);

    const handleItemTypeToggle = useCallback((type) => {
        const next = selectedItemTypes.includes(type)
            ? selectedItemTypes.filter(t => t !== type)
            : [...selectedItemTypes, type];
        updateFilters({ itemTypes: next });
    }, [selectedItemTypes, updateFilters]);

    const handleConditionToggle = useCallback((type) => {
        const next = selectedConditions.includes(type)
            ? selectedConditions.filter(t => t !== type)
            : [...selectedConditions, type];
        updateFilters({ conditions: next });
    }, [selectedConditions, updateFilters]);

    const handleServiceTypeToggle = useCallback((type) => {
        const next = selectedServiceTypes.includes(type)
            ? selectedServiceTypes.filter(t => t !== type)
            : [...selectedServiceTypes, type];
        updateFilters({ serviceTypes: next });
    }, [selectedServiceTypes, updateFilters]);

    const handleDatePresetChange = useCallback((preset) => {
        if (preset === 'all' || preset === 'custom') {
            updateFilters({ datePreset: preset, startDate: preset === 'all' ? '' : startDate, endDate: preset === 'all' ? '' : endDate });
            return;
        }
        const { start_date, end_date } = getDateRange(preset);
        updateFilters({ datePreset: preset, startDate: start_date, endDate: end_date });
    }, [startDate, endDate, updateFilters]);

    const handleStartDateChange = useCallback((e) => {
        updateFilters({ startDate: e.target.value, endDate: endDate || e.target.value, datePreset: 'custom' });
    }, [endDate, updateFilters]);

    const handleEndDateChange = useCallback((e) => {
        updateFilters({ endDate: e.target.value, startDate: startDate || e.target.value, datePreset: 'custom' });
    }, [startDate, updateFilters]);

    const clearAllFilters = useCallback(() => {
        setSearchTerm('');
        if (typeof onFilterChange === 'function') {
            onFilterChange({ ...DEFAULT_MOVEMENT_FILTERS });
        }
    }, [onFilterChange]);

    // ============================================
    // Computed Values
    // ============================================

    const processedMovements = useMemo(() => {
        let filtered = movements || [];
        if (debouncedSearch) {
            const search = debouncedSearch.toLowerCase();
            filtered = filtered.filter(movement =>
                (movement.item_name && movement.item_name.toLowerCase().includes(search)) ||
                (movement.sku && movement.sku.toLowerCase().includes(search)) ||
                (movement.notes && movement.notes.toLowerCase().includes(search))
            );
        }
        return filtered;
    }, [movements, debouncedSearch]);

    const hasActiveFilters = useMemo(() => {
        return debouncedSearch ||
            selectedMovementTypes.length > 0 ||
            selectedItemTypes.length > 0 ||
            selectedConditions.length > 0 ||
            selectedServiceTypes.length > 0 ||
            startDate ||
            endDate;
    }, [debouncedSearch, selectedMovementTypes, selectedItemTypes, selectedConditions, selectedServiceTypes, startDate, endDate]);

    /**
     * Export filtered movements to Excel file
     * Fetches all matching movements in batches and exports to .xlsx format
     */
    const handleExportToExcel = useCallback(async () => {
        try {
            toast.loading('جاري تصدير البيانات...', { id: 'export' });

            const baseFilters = {
                order_by: sortBy,
                order_direction: sortOrder.toUpperCase(),
            };
            if (selectedMovementTypes.length > 0) baseFilters.movement_type = selectedMovementTypes.join(',');
            if (selectedItemTypes.length > 0) baseFilters.item_type = selectedItemTypes.join(',');
            if (selectedConditions.length > 0) baseFilters.condition = selectedConditions.join(',');
            if (selectedServiceTypes.length > 0) baseFilters.service_type = selectedServiceTypes.join(',');
            if (startDate) baseFilters.start_date = startDate;
            if (endDate) baseFilters.end_date = endDate;

            // Fetch all movements in batches
            let allMovements = [];
            let offset = 0;
            const batchSize = 1000; // Fetch in batches of 1000
            let hasMore = true;
            let totalFetched = 0;
            let totalCount = 0;

            while (hasMore) {
                const filters = {
                    ...baseFilters,
                    limit: batchSize,
                    offset: offset
                };

                const result = await stockAPI.getStockMovements(filters);

                if (result.success && result.data && result.data.movements) {
                    const movements = result.data.movements;
                    allMovements = [...allMovements, ...movements];
                    totalFetched += movements.length;

                    // Get total count from first batch
                    if (offset === 0 && result.data.pagination) {
                        totalCount = result.data.pagination.total || 0;
                    }

                    // Update progress message
                    if (totalCount > 0) {
                        toast.loading(`جاري تصدير البيانات... (${totalFetched} من ${totalCount})`, { id: 'export' });
                    } else {
                        toast.loading(`جاري تصدير البيانات... (${totalFetched} حركة)`, { id: 'export' });
                    }

                    // Check if there are more movements to fetch
                    const pagination = result.data.pagination || {};
                    const total = pagination.total || 0;
                    hasMore = pagination.has_more || (total > 0 && totalFetched < total && movements.length === batchSize);

                    if (hasMore) {
                        offset += batchSize;
                    }
                } else {
                    hasMore = false;
                    if (allMovements.length === 0) allMovements = processedMovements;
                }
            }

            let movementsToExport = allMovements;

            // Apply search filter if exists (client-side)
            if (searchTerm) {
                const search = searchTerm.toLowerCase();
                movementsToExport = movementsToExport.filter(movement =>
                    (movement.item_name && movement.item_name.toLowerCase().includes(search)) ||
                    (movement.sku && movement.sku.toLowerCase().includes(search)) ||
                    (movement.notes && movement.notes.toLowerCase().includes(search))
                );
            }

            if (movementsToExport.length === 0) {
                toast.error('لا توجد بيانات للتصدير', { id: 'export' });
                return;
            }

            // Prepare data for Excel
            const excelData = movementsToExport.map((movement, index) => {
                // Format reference
                let reference = '';
                if (movement.reference_type === 'service_ticket' && movement.reference_id) {
                    reference = `طلب خدمة #${movement.reference_id}`;
                } else if (movement.reference_type === 'manual_adjustment') {
                    reference = 'تعديل يدوي';
                }

                // Format date
                const dateStr = formatMovementDate(movement.created_at);
                const timeStr = formatRelativeTime(movement.created_at);

                return {
                    'رقم': index + 1,
                    'نوع الحركة': getMovementTypeLabel(movement.movement_type),
                    'اسم العنصر': movement.item_name || movement.itemName || '',
                    'SKU': movement.sku || movement.item_sku || movement.itemSku || '',
                    'نوع العنصر': movement.item_type === 'product' ? 'منتج' : 'قطعة',
                    'الكمية': Math.abs(movement.quantity || movement.quantity_change || 0),
                    'الحالة': movement.movement_type === 'RESERVE' ? 'حجز' : (movement.condition === 'damaged' ? 'تالف' : 'سليم'),
                    'نوع المرجع': movement.reference_type === 'service_ticket' ? 'طلب خدمة' : movement.reference_type === 'manual_adjustment' ? 'تعديل يدوي' : '',
                    'المرجع': reference,
                    'التاريخ': dateStr,
                    'الوقت': timeStr,
                    'الملاحظات': movement.notes || movement.reason || ''
                };
            });

            // Load ExcelJS only when user exports (keeps it out of initial bundle)
            const ExcelJS = (await import('exceljs')).default;
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Stock Movements');

            // Add headers
            const headers = Object.keys(excelData[0] || {});
            worksheet.addRow(headers);

            // Add data rows
            excelData.forEach(row => {
                worksheet.addRow(Object.values(row));
            });

            // Generate filename with current date
            const today = new Date();
            const dateStr = today.toISOString().split('T')[0];
            const filename = `stock_movements_${dateStr}.xlsx`;

            // Download file
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.click();
            window.URL.revokeObjectURL(url);

            toast.success(`تم تصدير ${movementsToExport.length} حركة بنجاح`, { id: 'export' });
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            toast.error('فشل في تصدير البيانات', { id: 'export' });
        }
    }, [
        selectedMovementTypes,
        selectedItemTypes,
        selectedConditions,
        selectedServiceTypes,
        startDate,
        endDate,
        sortBy,
        sortOrder,
        searchTerm,
        processedMovements,
    ]);


    if (isLoading && (movements || []).length === 0) {
        return (
            <div className="h-full flex flex-col" aria-busy="true" aria-live="polite">
                {/* Loading skeleton */}
                <div className="bg-stone-50/98 dark:bg-gray-800 border-b border-stone-200/90 dark:border-gray-700 mb-4 p-4">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2 animate-pulse" aria-hidden="true"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-pulse" aria-hidden="true"></div>
                </div>
                <div className="mb-4 h-10 bg-stone-100 dark:bg-gray-700 rounded-lg animate-pulse" aria-hidden="true"></div>
                <div className="flex-1 bg-stone-50/98 dark:bg-gray-800 rounded-lg shadow-sm border border-stone-200/90 dark:border-gray-700 p-8">
                    <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" aria-hidden="true"></div>
                </div>
                <span className="sr-only">جاري تحميل حركات المخزون...</span>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col" role="main" aria-label="صفحة حركات المخزون">
            {/* Search and Actions — 8pt grid: gap-3, mb-4, controls h-11 sm:h-12 (match Products/Parts) */}
            <div className="mb-4" aria-label="فلاتر البحث">
                <div className="flex flex-wrap items-center gap-3 w-full" dir="rtl">
                    {/* Search — h-11 sm:h-12, icon inset 12px */}
                    <div className="flex-1 min-w-0 min-w-[200px] sm:min-w-[240px]">
                        <div className="relative group flex items-center h-11 sm:h-12">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500 dark:text-gray-500 group-focus-within:text-brand-blue-500 dark:group-focus-within:text-brand-blue-400 transition-colors pointer-events-none" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    placeholder="ابحث في: اسم المنتج، SKU، أو الملاحظات..."
                                    aria-label="بحث في حركات المخزون"
                                    className="w-full h-full pr-11 pl-10 py-0 text-sm font-cairo bg-transparent border-2 border-stone-200/60 dark:border-gray-700/60 hover:border-stone-300/70 dark:hover:border-gray-600/70 focus:border-brand-blue-500 dark:focus:border-brand-blue-400 rounded-full focus:outline-none focus:ring-0 focus:shadow-lg focus:shadow-brand-blue-500/10 text-stone-800 dark:text-gray-100 placeholder-stone-400 dark:placeholder-gray-500 transition-all duration-300"
                                    dir="rtl"
                                />
                                {searchTerm && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchTerm('')}
                                        aria-label="مسح البحث"
                                        className="absolute left-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-stone-500 dark:text-gray-500 hover:text-stone-600 dark:hover:text-gray-300 hover:bg-stone-100/80 dark:hover:bg-gray-800 transition-all duration-200"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Filter dropdowns — same bar style as Products/Parts (stone/brand-blue); keep class for click-outside */}
                        <div className="flex flex-wrap items-center gap-3 stock-movements-filter-dropdown">
                            {/* الفترة (Date) */}
                            <div className="relative flex-1 sm:flex-none w-full sm:w-[150px] sm:min-w-[150px] min-w-0 h-11 sm:h-12">
                                <button
                                    type="button"
                                    onClick={() => setOpenFilterId(openFilterId === 'date' ? null : 'date')}
                                    className={`w-full h-full pr-3 pl-3 ${filterBtnBase} ${(datePreset !== 'all' || openFilterId === 'date') ? filterBtnActive : filterBtnInactive}`}
                                    dir="rtl"
                                >
                                    <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-80 flex-shrink-0" />
                                    <div className="flex flex-col items-start flex-1 min-w-0">
                                        <span className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs font-medium">الفترة</span>
                                        <span className="font-semibold text-[10px] sm:text-xs truncate w-full text-right">
                                            {datePreset === 'custom' && startDate && endDate ? `${startDate} - ${endDate}` : datePresetLabels[datePreset] ?? 'الكل'}
                                        </span>
                                    </div>
                                    <ChevronDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 transition-transform ${openFilterId === 'date' ? 'rotate-180' : ''}`} />
                                </button>
                                {openFilterId === 'date' && (
                                    <div className="absolute top-full left-0 right-0 mt-1 sm:mt-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 p-2 sm:p-3 backdrop-blur-sm max-h-[220px] overflow-auto">
                                        {['all', 'today', 'yesterday', 'lastWeek', 'thisMonth', 'lastMonth', 'custom'].map((p) => (
                                            <button key={p} type="button" onClick={() => { handleDatePresetChange(p); if (p !== 'custom') setOpenFilterId(null); }}
                                                className={`w-full text-right px-3 py-2 rounded-md text-xs font-cairo font-medium transition-all ${datePreset === p ? 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-transparent'}`}>
                                                {datePresetLabels[p] ?? p}
                                            </button>
                                        ))}
                                        {datePreset === 'custom' && (
                                            <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-700 space-y-2">
                                                <div><label className="block text-xs text-gray-600 dark:text-gray-400 font-cairo mb-1">من</label><input type="date" value={startDate} onChange={handleStartDateChange} className="w-full h-10 min-h-10 px-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-xs font-cairo dark:bg-gray-900 dark:text-white" /></div>
                                                <div><label className="block text-xs text-gray-600 dark:text-gray-400 font-cairo mb-1">إلى</label><input type="date" value={endDate} onChange={handleEndDateChange} className="w-full h-10 min-h-10 px-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-xs font-cairo dark:bg-gray-900 dark:text-white" /></div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            {/* نوع الحركة */}
                            <div className="relative flex-1 sm:flex-none w-full sm:w-[150px] sm:min-w-[150px] min-w-0 h-11 sm:h-12">
                                <button
                                    type="button"
                                    onClick={() => setOpenFilterId(openFilterId === 'movement' ? null : 'movement')}
                                    className={`w-full h-full pr-3 pl-3 ${filterBtnBase} ${(selectedMovementTypes.length > 0 || openFilterId === 'movement') ? filterBtnActive : filterBtnInactive}`}
                                    dir="rtl"
                                >
                                    <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-80 flex-shrink-0" />
                                    <div className="flex flex-col items-start flex-1 min-w-0">
                                        <span className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs font-medium">نوع الحركة</span>
                                        <span className="font-semibold text-[10px] sm:text-xs truncate w-full text-right">{selectedMovementTypes[0] ? movementTypeOptions[selectedMovementTypes[0]] : 'الكل'}</span>
                                    </div>
                                    <ChevronDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 transition-transform ${openFilterId === 'movement' ? 'rotate-180' : ''}`} />
                                </button>
                                {openFilterId === 'movement' && (
                                    <div className="absolute top-full left-0 right-0 mt-1 sm:mt-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 p-2 sm:p-3 backdrop-blur-sm">
                                        <button type="button" onClick={() => { updateFilters({ movementTypes: [] }); setOpenFilterId(null); }} className={`w-full text-right px-3 py-2 rounded-md text-xs font-cairo font-medium ${selectedMovementTypes.length === 0 ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'}`}>الكل</button>
                                        {Object.entries(movementTypeOptions).map(([val, lbl]) => (
                                            <button key={val} type="button" onClick={() => { updateFilters({ movementTypes: [val] }); setOpenFilterId(null); }} className={`w-full text-right px-3 py-2 rounded-md text-xs font-cairo font-medium ${selectedMovementTypes[0] === val ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'}`}>{lbl}</button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {/* نوع العنصر */}
                            <div className="relative flex-1 sm:flex-none w-full sm:w-[150px] sm:min-w-[150px] min-w-0 h-11 sm:h-12">
                                <button
                                    type="button"
                                    onClick={() => setOpenFilterId(openFilterId === 'item' ? null : 'item')}
                                    className={`w-full h-full pr-3 pl-3 ${filterBtnBase} ${(selectedItemTypes.length > 0 || openFilterId === 'item') ? filterBtnActive : filterBtnInactive}`}
                                    dir="rtl"
                                >
                                    <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-80 flex-shrink-0" />
                                    <div className="flex flex-col items-start flex-1 min-w-0">
                                        <span className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs font-medium">نوع العنصر</span>
                                        <span className="font-semibold text-[10px] sm:text-xs truncate w-full text-right">{selectedItemTypes[0] ? itemTypeOptions[selectedItemTypes[0]] : 'الكل'}</span>
                                    </div>
                                    <ChevronDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 transition-transform ${openFilterId === 'item' ? 'rotate-180' : ''}`} />
                                </button>
                                {openFilterId === 'item' && (
                                    <div className="absolute top-full left-0 right-0 mt-1 sm:mt-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 p-2 sm:p-3 backdrop-blur-sm">
                                        <button type="button" onClick={() => { updateFilters({ itemTypes: [] }); setOpenFilterId(null); }} className={`w-full text-right px-3 py-2 rounded-md text-xs font-cairo font-medium ${selectedItemTypes.length === 0 ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'}`}>الكل</button>
                                        {Object.entries(itemTypeOptions).map(([val, lbl]) => (
                                            <button key={val} type="button" onClick={() => { updateFilters({ itemTypes: [val] }); setOpenFilterId(null); }} className={`w-full text-right px-3 py-2 rounded-md text-xs font-cairo font-medium ${selectedItemTypes[0] === val ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'}`}>{lbl}</button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {/* الحالة (Condition) */}
                            <div className="relative flex-1 sm:flex-none w-full sm:w-[150px] sm:min-w-[150px] min-w-0 h-11 sm:h-12">
                                <button
                                    type="button"
                                    onClick={() => setOpenFilterId(openFilterId === 'condition' ? null : 'condition')}
                                    className={`w-full h-full pr-3 pl-3 ${filterBtnBase} ${(selectedConditions.length > 0 || openFilterId === 'condition') ? filterBtnActive : filterBtnInactive}`}
                                    dir="rtl"
                                >
                                    <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-80 flex-shrink-0" />
                                    <div className="flex flex-col items-start flex-1 min-w-0">
                                        <span className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs font-medium">الحالة</span>
                                        <span className="font-semibold text-[10px] sm:text-xs truncate w-full text-right">{selectedConditions[0] ? conditionOptions[selectedConditions[0]] : 'الكل'}</span>
                                    </div>
                                    <ChevronDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 transition-transform ${openFilterId === 'condition' ? 'rotate-180' : ''}`} />
                                </button>
                                {openFilterId === 'condition' && (
                                    <div className="absolute top-full left-0 right-0 mt-1 sm:mt-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 p-2 sm:p-3 backdrop-blur-sm">
                                        <button type="button" onClick={() => { updateFilters({ conditions: [] }); setOpenFilterId(null); }} className={`w-full text-right px-3 py-2 rounded-md text-xs font-cairo font-medium ${selectedConditions.length === 0 ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'}`}>الكل</button>
                                        {Object.entries(conditionOptions).map(([val, lbl]) => (
                                            <button key={val} type="button" onClick={() => { updateFilters({ conditions: [val] }); setOpenFilterId(null); }} className={`w-full text-right px-3 py-2 rounded-md text-xs font-cairo font-medium ${selectedConditions[0] === val ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'}`}>{lbl}</button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {/* نوع الخدمة */}
                            <div className="relative flex-1 sm:flex-none w-full sm:w-[150px] sm:min-w-[150px] min-w-0 h-11 sm:h-12">
                                <button
                                    type="button"
                                    onClick={() => setOpenFilterId(openFilterId === 'service' ? null : 'service')}
                                    className={`w-full h-full pr-3 pl-3 ${filterBtnBase} ${(selectedServiceTypes.length > 0 || openFilterId === 'service') ? filterBtnActive : filterBtnInactive}`}
                                    dir="rtl"
                                >
                                    <Wrench className="w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-80 flex-shrink-0" />
                                    <div className="flex flex-col items-start flex-1 min-w-0">
                                        <span className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs font-medium">نوع الخدمة</span>
                                        <span className="font-semibold text-[10px] sm:text-xs truncate w-full text-right">{selectedServiceTypes[0] ? serviceTypeOptions[selectedServiceTypes[0]] : 'الكل'}</span>
                                    </div>
                                    <ChevronDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 transition-transform ${openFilterId === 'service' ? 'rotate-180' : ''}`} />
                                </button>
                                {openFilterId === 'service' && (
                                    <div className="absolute top-full left-0 right-0 mt-1 sm:mt-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 p-2 sm:p-3 backdrop-blur-sm">
                                        <button type="button" onClick={() => { updateFilters({ serviceTypes: [] }); setOpenFilterId(null); }} className={`w-full text-right px-3 py-2 rounded-md text-xs font-cairo font-medium ${selectedServiceTypes.length === 0 ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'}`}>الكل</button>
                                        {Object.entries(serviceTypeOptions).map(([val, lbl]) => (
                                            <button key={val} type="button" onClick={() => { updateFilters({ serviceTypes: [val] }); setOpenFilterId(null); }} className={`w-full text-right px-3 py-2 rounded-md text-xs font-cairo font-medium ${selectedServiceTypes[0] === val ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'}`}>{lbl}</button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        {datePreset === 'custom' && openFilterId !== 'date' && (
                            <div className="flex items-center gap-2 flex-wrap" dir="rtl">
                                <label className="text-xs text-gray-600 dark:text-gray-400 font-cairo font-medium">من</label>
                                <input type="date" value={startDate} onChange={handleStartDateChange} className="h-10 min-h-10 px-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-xs font-cairo dark:bg-gray-800 dark:text-white" />
                                <label className="text-xs text-gray-600 dark:text-gray-400 font-cairo font-medium">إلى</label>
                                <input type="date" value={endDate} onChange={handleEndDateChange} className="h-10 min-h-10 px-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-xs font-cairo dark:bg-gray-800 dark:text-white" />
                            </div>
                        )}

                    {/* Export + Clear — h-11 sm:h-12 px-4 (match Products/Parts) */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                        <button
                            type="button"
                            onClick={handleExportToExcel}
                            disabled={isLoading || processedMovements.length === 0}
                            aria-label="تصدير البيانات إلى Excel"
                            aria-busy={isLoading}
                            className="flex items-center justify-center gap-2 h-11 sm:h-12 px-4 rounded-xl font-cairo text-sm font-medium border-2 border-accent-green-600 bg-accent-green-600 hover:bg-accent-green-700 hover:border-accent-green-700 disabled:bg-gray-400 disabled:border-gray-400 disabled:cursor-not-allowed text-white shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-accent-green-500/30 transition-all duration-200"
                            title="تصدير إلى Excel"
                        >
                            <FileDown className="w-4 h-4" />
                            <span>{isLoading ? 'جاري التصدير...' : 'تصدير'}</span>
                        </button>
                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={clearAllFilters}
                                aria-label="مسح جميع الفلاتر"
                                className="flex items-center justify-center gap-2 h-11 sm:h-12 px-4 rounded-xl font-cairo text-sm font-medium border-2 border-stone-200 dark:border-gray-600 bg-stone-50 dark:bg-gray-700/60 text-stone-700 dark:text-gray-300 hover:border-brand-red-300 hover:bg-brand-red-50/80 dark:hover:bg-brand-red-900/20 hover:text-brand-red-700 dark:hover:text-brand-red-300 transition-all duration-200"
                            >
                                <X className="w-4 h-4" />
                                <span>مسح</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Movements Display - Table View */}
                {processedMovements.length > 0 ? (
                    <section
                        className="flex-1 bg-stone-50/98 dark:bg-gray-800 rounded-lg shadow-sm border border-stone-200/90 dark:border-gray-700 overflow-hidden"
                        aria-label="جدول حركات المخزون"
                        style={{
                            borderRadius: 'var(--radius-lg)',
                            boxShadow: 'var(--shadow-sm)'
                        }}
                    >
                        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800">
                            <table
                                className="w-full min-w-[1000px] sm:min-w-full"
                                role="table"
                                aria-label="جدول حركات المخزون"
                            >
                                <thead className="bg-stone-100 dark:bg-gray-700">
                                    <tr>
                                        <th scope="col" className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-right text-xs font-medium text-stone-600 dark:text-gray-400 uppercase tracking-wider font-cairo">
                                            نوع الحركة
                                        </th>
                                        <th scope="col" className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-right text-xs font-medium text-stone-600 dark:text-gray-400 uppercase tracking-wider font-cairo">
                                            العنصر
                                        </th>
                                        <th scope="col" className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-center text-xs font-medium text-stone-600 dark:text-gray-400 uppercase tracking-wider font-cairo">
                                            الكمية
                                        </th>
                                        <th scope="col" className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-center text-xs font-medium text-stone-600 dark:text-gray-400 uppercase tracking-wider font-cairo">
                                            الحالة
                                        </th>
                                        <th scope="col" className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-center text-xs font-medium text-stone-600 dark:text-gray-400 uppercase tracking-wider font-cairo">
                                            المرجع
                                        </th>
                                        <th scope="col" className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-center text-xs font-medium text-stone-600 dark:text-gray-400 uppercase tracking-wider font-cairo">
                                            التاريخ والوقت
                                        </th>
                                        <th scope="col" className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-right text-xs font-medium text-stone-600 dark:text-gray-400 uppercase tracking-wider font-cairo">
                                            الملاحظات
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-stone-50/98 dark:bg-gray-800 divide-y divide-stone-200/90 dark:divide-gray-700">
                                    {processedMovements.map((movement, index) => (
                                        <MovementTableRow key={`movement-${movement.id}-${index}`} movement={movement} />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                ) : (
                    <div className="flex-1 flex items-center justify-center p-8">
                        <EmptyState
                            icon={<History className="mx-auto" />}
                            title="لا توجد حركات مخزون مبدئياً"
                            description={hasActiveFilters ? "لا توجد حركات تطابق الفلاتر المحددة، جرب مسح الفلاتر." : "لم يتم تسجيل أي حركات للمخزون حتى الآن. ستظهر العمليات هنا تلقائياً."}
                            size="medium"
                            variant="cool"
                        />
                    </div>
                )}

                {/* Pagination - Show if there are more items than the limit */}
                {pagination && pagination.total > (pagination.limit || 50) && (
                    <nav className="mt-4 pt-3 border-t border-stone-200/90 dark:border-gray-700" aria-label="التنقل بين الصفحات">
                        <div className="flex items-center justify-center gap-3">
                            <button
                                onClick={() => {
                                    const currentPage = Math.floor((pagination.offset || 0) / (pagination.limit || 50)) + 1;
                                    onPageChange?.(currentPage - 1);
                                }}
                                disabled={(pagination.offset || 0) === 0}
                                aria-label="الصفحة السابقة"
                                className="px-4 py-2 text-sm font-medium text-stone-700 dark:text-gray-300 bg-stone-50 dark:bg-gray-700 border border-stone-300 dark:border-gray-600 rounded-lg hover:bg-stone-100 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed font-cairo transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-brand-red-500 focus:ring-offset-2"
                            >
                                <ChevronRight className="w-4 h-4" />
                                <span>السابق</span>
                            </button>

                            <span className="px-4 py-2 text-sm text-stone-600 dark:text-gray-400 font-cairo">
                                صفحة {Math.floor((pagination.offset || 0) / (pagination.limit || 50)) + 1} من {Math.ceil((pagination.total || 0) / (pagination.limit || 50))}
                            </span>

                            <button
                                onClick={() => {
                                    const currentPage = Math.floor((pagination.offset || 0) / (pagination.limit || 50)) + 1;
                                    onPageChange?.(currentPage + 1);
                                }}
                                disabled={(() => {
                                    if (pagination.has_more !== undefined) return !pagination.has_more;
                                    const currentOffset = pagination.offset || 0;
                                    const limit = pagination.limit || 50;
                                    const total = pagination.total || 0;
                                    return (currentOffset + limit) >= total;
                                })()}
                                aria-label="الصفحة التالية"
                                className="px-4 py-2 text-sm font-medium text-stone-700 dark:text-gray-300 bg-stone-50 dark:bg-gray-700 border border-stone-300 dark:border-gray-600 rounded-lg hover:bg-stone-100 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed font-cairo transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-brand-red-500 focus:ring-offset-2"
                            >
                                <span>التالي</span>
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                        </div>
                    </nav>
                )}
        </div>
    );
});

StockMovementsView.displayName = 'StockMovementsView';

export default StockMovementsView;