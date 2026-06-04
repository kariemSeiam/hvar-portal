import React, { useState, useEffect } from 'react';
import { 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Calendar, 
  MapPin, 
  DollarSign,
  X,
  RotateCcw,
  Settings,
  Sparkles
} from 'lucide-react';

/**
 * Expert Collapsible Filter Bar - Professional & Creative Design
 * Features:
 * - Smooth expand/collapse animations
 * - Professional filter layout
 * - Creative icon transitions
 * - Responsive design
 * - Dark mode support
 * - RTL support
 */
const CollapsibleFilterBar = ({
  isExpanded = false,
  onToggle = () => {},
  filters = {},
  onFilterChange = () => {},
  onApplyFilters = () => {},
  onClearFilters = () => {},
  orderStates = [],
  totalResults = 0,
  className = '',
  ...props
}) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const [isAnimating, setIsAnimating] = useState(false);

  // Sync local filters with props
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFilterChange(key, value);
  };

  // Handle apply filters
  const handleApplyFilters = () => {
    setIsAnimating(true);
    onApplyFilters();
    setTimeout(() => setIsAnimating(false), 300);
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setIsAnimating(true);
    setLocalFilters({});
    onClearFilters();
    setTimeout(() => setIsAnimating(false), 300);
  };

  // Check if any filters are active
  const hasActiveFilters = Object.values(localFilters).some(value => 
    value !== undefined && value !== null && value !== ''
  );

  return (
    <div className={`relative ${className}`} {...props}>
      {/* Toggle Button - Always Visible */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggle}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all duration-300
              ${isExpanded 
                ? 'bg-brand-red-50 dark:bg-brand-red-900/30 text-brand-red-700 dark:text-brand-red-300 border border-brand-red-200 dark:border-brand-red-800' 
                : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
              }
            `}
          >
            <div className="relative">
              <Filter className={`w-4 h-4 transition-all duration-300 ${isExpanded ? 'text-brand-red-600' : ''}`} />
              {hasActiveFilters && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-brand-red-500 rounded-full animate-pulse" />
              )}
            </div>
            <span>فلاتر متقدمة</span>
            <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </div>
          </button>
          
          {/* Active Filters Indicator */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 px-2 py-1 bg-brand-red-50 dark:bg-brand-red-900/30 rounded-md">
              <Sparkles className="w-3 h-3 text-brand-red-600" />
              <span className="text-xs font-medium text-brand-red-700 dark:text-brand-red-300">
                فلاتر نشطة
              </span>
            </div>
          )}
        </div>

        {/* Results Counter */}
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <span>{totalResults.toLocaleString()}</span>
          <span>نتيجة</span>
        </div>
      </div>

      {/* Collapsible Filter Panel */}
      <div className={`
        overflow-hidden transition-all duration-500 ease-in-out
        ${isExpanded ? 'max-h-[600px] opacity-100 mt-4' : 'max-h-0 opacity-0'}
      `}>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-6">
          {/* Filter Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Order Status Filter */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Settings className="w-4 h-4" />
                حالة الطلب
              </label>
              <select
                value={localFilters.state || ''}
                onChange={(e) => handleFilterChange('state', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-red-500 focus:border-transparent transition-colors"
              >
                <option value="">جميع الحالات</option>
                {orderStates.map(state => (
                  <option key={state.state_code} value={state.state_code}>
                    {state.state_value} ({state.count})
                  </option>
                ))}
              </select>
            </div>

            {/* Date From Filter */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Calendar className="w-4 h-4" />
                من تاريخ
              </label>
              <input
                type="date"
                value={localFilters.date_from || ''}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-red-500 focus:border-transparent transition-colors"
              />
            </div>

            {/* Date To Filter */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Calendar className="w-4 h-4" />
                إلى تاريخ
              </label>
              <input
                type="date"
                value={localFilters.date_to || ''}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-red-500 focus:border-transparent transition-colors"
              />
            </div>

            {/* City Filter */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <MapPin className="w-4 h-4" />
                المدينة
              </label>
              <input
                type="text"
                placeholder="مدينة التوصيل"
                value={localFilters.city || ''}
                onChange={(e) => handleFilterChange('city', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-red-500 focus:border-transparent transition-colors"
              />
            </div>

            {/* COD Range Filter */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <DollarSign className="w-4 h-4" />
                مبلغ الطلب (من)
              </label>
              <input
                type="number"
                placeholder="0"
                value={localFilters.cod_min || ''}
                onChange={(e) => handleFilterChange('cod_min', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-red-500 focus:border-transparent transition-colors"
              />
            </div>

            {/* COD Range Filter */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <DollarSign className="w-4 h-4" />
                مبلغ الطلب (إلى)
              </label>
              <input
                type="number"
                placeholder="10000"
                value={localFilters.cod_max || ''}
                onChange={(e) => handleFilterChange('cod_max', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-red-500 focus:border-transparent transition-colors"
              />
            </div>

            {/* Phone Filter */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Search className="w-4 h-4" />
                رقم الهاتف
              </label>
              <input
                type="text"
                placeholder="رقم العميل"
                value={localFilters.phone || ''}
                onChange={(e) => handleFilterChange('phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-red-500 focus:border-transparent transition-colors"
              />
            </div>

            {/* Business Category Filter */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Sparkles className="w-4 h-4" />
                الفئة التجارية
              </label>
              <select
                value={localFilters.category || ''}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-red-500 focus:border-transparent transition-colors"
              >
                <option value="">جميع الفئات</option>
                <option value="premium_high">فئة عالية الجودة</option>
                <option value="high_value">قيمة عالية</option>
                <option value="standard_value">قيمة قياسية</option>
                <option value="low_value">قيمة منخفضة</option>
                <option value="zero_cod">بدون رسوم</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              {hasActiveFilters && (
                <div className="flex items-center gap-1">
                  <span>فلاتر نشطة:</span>
                  <span className="font-medium text-brand-red-600 dark:text-brand-red-400">
                    {Object.values(localFilters).filter(v => v !== undefined && v !== null && v !== '').length}
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  disabled={isAnimating}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300
                    ${isAnimating 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    }
                    text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600
                  `}
                >
                  <RotateCcw className={`w-4 h-4 ${isAnimating ? 'animate-spin' : ''}`} />
                  مسح الفلاتر
                </button>
              )}
              
              {/* Apply Filters Button */}
              <button
                onClick={handleApplyFilters}
                disabled={isAnimating}
                className={`
                  flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all duration-300
                  ${isAnimating 
                    ? 'opacity-50 cursor-not-allowed bg-gray-400' 
                    : 'bg-brand-red-600 hover:bg-brand-red-700 active:bg-brand-red-800'
                  }
                  text-white shadow-sm
                `}
              >
                <Filter className={`w-4 h-4 ${isAnimating ? 'animate-spin' : ''}`} />
                تطبيق الفلاتر
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollapsibleFilterBar; 