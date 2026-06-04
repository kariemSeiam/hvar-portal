/**
 * StockSearchBar Component - Exact match with StockProducts/StockParts style
 *
 * Features:
 * - Search bar with hint "البحث في: اسم القطعة، SKU..."
 * - Status filter dropdown "جميع الحالات"
 * - Export button
 * - Same styling as existing stock components
 */

import { Search, X, Download } from 'lucide-react';

const StockSearchBar = ({
    searchQuery = '',
    onSearchChange,
    activeTab,
    totalCount = 0,
    filters = {},
    onFilterChange,
    onExport,
    isExporting = false,
    onAdd,
    addLabel = 'إضافة',
}) => {
    // Get status filter options
    const statusOptions = [
        { value: 'all', label: 'جميع الحالات' },
        { value: 'active', label: 'متوفر' },
        { value: 'low_stock', label: 'مخزون منخفض' },
        { value: 'out_of_stock', label: 'نفد المخزون' },
    ];

    // Get placeholder based on active tab
    const getPlaceholder = () => {
        switch (activeTab) {
            case 'products':
                return 'البحث في: اسم المنتج، SKU...';
            case 'parts':
                return 'البحث في: اسم القطعة، SKU...';
            default:
                return 'البحث...';
        }
    };

    // Get add button label based on tab
    const getAddLabel = () => {
        switch (activeTab) {
            case 'products':
                return 'إضافة منتج';
            case 'parts':
                return 'إضافة قطعة';
            default:
                return addLabel;
        }
    };

    const handleStatusChange = (e) => {
        const filterKey = 'stockStatus';
        onFilterChange?.({ [filterKey]: e.target.value });
    };

    const currentStatus = filters.stockStatus || 'all';

    return (
        <div className="mb-4">
            <div className="flex flex-wrap items-center gap-3 w-full" dir="rtl">
                {/* Search — 8pt grid: h-11 sm:h-12, gap-3, icon 12px inset */}
                <div className="flex-1 min-w-0 min-w-[200px] sm:min-w-[240px]">
                    <div className="relative group flex items-center h-11 sm:h-12">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500 dark:text-gray-500 group-focus-within:text-brand-blue-500 dark:group-focus-within:text-brand-blue-400 transition-colors pointer-events-none" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => onSearchChange?.(e.target.value)}
                            placeholder={getPlaceholder()}
                            className="w-full h-full pr-11 pl-10 py-0 text-sm font-cairo bg-transparent border-2 border-stone-200/60 dark:border-gray-700/60 hover:border-stone-300/70 dark:hover:border-gray-600/70 focus:border-brand-blue-500 dark:focus:border-brand-blue-400 rounded-full focus:outline-none focus:ring-0 focus:shadow-lg focus:shadow-brand-blue-500/10 text-stone-800 dark:text-gray-100 placeholder-stone-400 dark:placeholder-gray-500 transition-all duration-300"
                            dir="rtl"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => onSearchChange?.('')}
                                className="absolute left-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-stone-500 hover:text-stone-600 dark:hover:text-gray-300 hover:bg-stone-100/80 dark:hover:bg-gray-800 transition-all duration-200"
                                aria-label="مسح البحث"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Status chips — px-3 py-2 rounded-lg */}
                <div className="flex items-center gap-3 flex-wrap">
                    {statusOptions.map((option) => {
                        const isActive = currentStatus === option.value;
                        return (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => onFilterChange?.({ stockStatus: option.value })}
                                className={`
                                    px-3 py-2 rounded-lg text-sm font-cairo font-medium whitespace-nowrap transition-all duration-200
                                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-stone-50 dark:focus:ring-offset-gray-800
                                    ${isActive
                                        ? 'bg-brand-blue-500 dark:bg-brand-blue-600 text-white shadow-md ring-2 ring-brand-blue-400/30'
                                        : 'bg-stone-50 dark:bg-gray-700/60 text-stone-700 dark:text-gray-300 border border-stone-200 dark:border-gray-600 hover:border-brand-blue-300 hover:bg-brand-blue-50/80 dark:hover:bg-brand-blue-900/20 hover:text-brand-blue-700 dark:hover:text-brand-blue-300'
                                    }
                                `}
                            >
                                {option.label}
                            </button>
                        );
                    })}
                </div>

                {/* Export — h-11 sm:h-12 px-4 */}
                <button
                    onClick={onExport}
                    disabled={isExporting || totalCount === 0}
                    className="flex items-center justify-center gap-2 h-11 sm:h-12 px-4 rounded-xl font-cairo text-sm font-medium border-2 border-accent-green-600 bg-accent-green-600 hover:bg-accent-green-700 disabled:bg-gray-400 disabled:border-gray-400 disabled:cursor-not-allowed text-white shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-accent-green-500/30 transition-all duration-200"
                    title="تصدير إلى Excel"
                >
                    <Download className="w-4 h-4" />
                    <span>{isExporting ? 'جاري التصدير...' : 'تصدير'}</span>
                </button>
            </div>
        </div>
    );
};

export default StockSearchBar;
