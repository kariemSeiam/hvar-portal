/**
 * CompactFilterBar Component - Expert Horizontal Filter Bar
 * 
 * Features:
 * - Search bar (full width)
 * - Total count display
 * - Date filter dropdown
 * - Modern expert-level design
 * - Icons from lucide-react
 * - RTL support, dark mode
 */

import React, { useState, useRef, useEffect } from 'react';
import {
    Search, Calendar, X, ChevronDown, ChevronLeft, ChevronRight
} from 'lucide-react';
import { filterConfig } from '../../config/filterConfig';

const CompactFilterBar = ({
    activeTab,
    activeSubTab,
    filters,
    onFiltersChange,
    totalCount = 0,
    globalSearchResults = [],
    currentSearchResultIndex = 0,
    onNavigateSearchResult = null
}) => {
    const [showDateDropdown, setShowDateDropdown] = useState(false);
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [isClearing, setIsClearing] = useState(false);
    const dateDropdownRef = useRef(null);
    const dateButtonRef = useRef(null);
    const dropdownContentRef = useRef(null);
    const searchInputRef = useRef(null);

    // Get date filter configuration
    const currentFilterConfig = filterConfig[activeTab]?.[activeSubTab] || [];
    const dateFilterGroup = currentFilterConfig.find(group => 
        group.id === 'dates' || group.filters.some(f => f.type === 'dateRange' || f.type === 'date')
    );
    const dateFilter = dateFilterGroup?.filters.find(f => 
        f.type === 'dateRange' || f.type === 'date'
    );

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dateDropdownRef.current && !dateDropdownRef.current.contains(event.target)) {
                setShowDateDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Calculate dropdown position - Aligned to button's right edge (end) and below button
    useEffect(() => {
        if (showDateDropdown && dateButtonRef.current && dropdownContentRef.current) {
            const buttonRect = dateButtonRef.current.getBoundingClientRect();
            const dropdown = dropdownContentRef.current;
            const dropdownWidth = 320; // w-80 = 320px
            const viewportWidth = window.innerWidth;
            const margin = 16; // 16px margin from edges
            const gap = 8; // Gap between button and dropdown

            // Position below button
            const topPosition = buttonRect.bottom + gap;
            dropdown.style.top = `${topPosition}px`;
            dropdown.style.bottom = 'auto';

            // Align dropdown's right edge to button's right edge (end to end)
            // Since dropdown is LTR, we use left positioning
            const buttonRight = buttonRect.right;
            const leftPosition = buttonRight - dropdownWidth;
            
            // Check if dropdown would go off screen on the left
            if (leftPosition < margin) {
                // If dropdown would go off screen, align to button's left edge instead
                dropdown.style.left = `${buttonRect.left}px`;
            } else {
                // Align dropdown's right edge to button's right edge
                dropdown.style.left = `${leftPosition}px`;
            }
            dropdown.style.right = 'auto';
        }
    }, [showDateDropdown]);

    // Sync searchQuery with filters.search (for external clearing) with smooth animation
    useEffect(() => {
        if (!filters.search && searchQuery) {
            // Smooth clear animation with visual feedback
            setIsClearing(true);
            // Add a subtle shake/fade effect
            if (searchInputRef.current) {
                searchInputRef.current.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            }
            setTimeout(() => {
                setSearchQuery('');
                setIsClearing(false);
                if (searchInputRef.current) {
                    searchInputRef.current.style.transition = '';
                }
            }, 300); // Smooth transition duration
        } else if (filters.search && searchQuery !== filters.search) {
            setSearchQuery(filters.search);
        }
    }, [filters.search]);

    // Handle search change with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery !== (filters.search || '')) {
                handleFilterChange('search', searchQuery);
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Handle filter change
    const handleFilterChange = (filterId, value) => {
        const updated = {
            ...filters,
            [filterId]: value
        };
        // Remove empty filters
        if (!value || (typeof value === 'string' && value.trim() === '') ||
            (Array.isArray(value) && value.length === 0) ||
            (typeof value === 'object' && value !== null && 
             Object.keys(value).every(k => !value[k]))
        ) {
            delete updated[filterId];
        }
        onFiltersChange(updated);
    };

    // Get date display value
    const getDateDisplayValue = () => {
        if (!dateFilter) return 'التاريخ';
        
        const value = filters[dateFilter.id];
        if (!value) return 'التاريخ';

        if (dateFilter.type === 'dateRange') {
            const start = value.start ? new Date(value.start).toLocaleDateString('ar-EG') : '';
            const end = value.end ? new Date(value.end).toLocaleDateString('ar-EG') : '';
            if (start && end) return `${start} - ${end}`;
            if (start) return `من ${start}`;
            if (end) return `إلى ${end}`;
        } else if (dateFilter.type === 'date') {
            return new Date(value).toLocaleDateString('ar-EG');
        }
        
        return 'التاريخ';
    };

    const hasDateFilter = dateFilter && filters[dateFilter.id];

    const hasMultipleResults = globalSearchResults.length > 1;
    const showNavigation = hasMultipleResults && searchQuery && searchQuery.trim() !== '';

    return (
        <div className="flex items-center gap-3 flex-1 min-w-0" dir="rtl">
            {/* Search Bar - Full Width */}
            <div className="flex-1 min-w-[200px] relative">
                <div className="relative group">
                    <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 group-focus-within:text-brand-blue-500 dark:group-focus-within:text-brand-blue-400 transition-colors pointer-events-none" />
                    <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="ابحث عن تذكرة، عميل، هاتف أو رقم تتبع..."
                        className={`w-full pr-12 pl-4 py-3 text-sm border-2 rounded-xl font-cairo bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-brand-blue-500 dark:focus:border-brand-blue-400 focus:ring-2 focus:ring-brand-blue-500/20 dark:focus:ring-brand-blue-400/20 transition-all duration-300 group-hover:border-gray-300 dark:group-hover:border-gray-600 shadow-sm hover:shadow-md focus:shadow-lg dark:shadow-none ${
                            isClearing 
                                ? 'border-gray-200 dark:border-gray-700 opacity-50 scale-95' 
                                : 'border-gray-200 dark:border-gray-700'
                        }`}
                        dir="rtl"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => {
                                setSearchQuery('');
                                handleFilterChange('search', '');
                            }}
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 p-1 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                            aria-label="مسح البحث"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                    {/* Search Navigation - Show when multiple results */}
                    {showNavigation && onNavigateSearchResult && (
                        <div className="absolute left-16 top-1/2 transform -translate-y-1/2 flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-1 py-0.5 shadow-sm">
                            <span className="text-xs text-gray-600 dark:text-gray-400 font-cairo px-1">
                                {currentSearchResultIndex + 1} / {globalSearchResults.length}
                            </span>
                            <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onNavigateSearchResult('prev');
                                }}
                                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                                aria-label="النتيجة السابقة"
                                title="النتيجة السابقة"
                            >
                                <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onNavigateSearchResult('next');
                                }}
                                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                                aria-label="النتيجة التالية"
                                title="النتيجة التالية"
                            >
                                <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Total Count - No Background */}
            <div className="flex items-center gap-2 px-2 py-1 flex-shrink-0">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 font-cairo whitespace-nowrap">
                    {totalCount}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-cairo whitespace-nowrap">
                    عنصر
                </span>
            </div>

            {/* Date Filter Dropdown */}
            {dateFilter && (
                <div
                    ref={dateDropdownRef}
                    className="relative flex-shrink-0"
                >
                    <button
                        ref={dateButtonRef}
                        type="button"
                        onClick={() => setShowDateDropdown(!showDateDropdown)}
                            className={`
                            flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all duration-200
                            font-cairo text-sm font-medium min-w-[160px] justify-between
                            ${hasDateFilter
                                ? 'bg-brand-blue-50 dark:bg-brand-blue-900/20 border-brand-blue-300 dark:border-brand-blue-700 text-brand-blue-700 dark:text-brand-blue-300 shadow-md'
                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 shadow-sm hover:shadow-md'
                            }
                            ${showDateDropdown ? 'ring-2 ring-brand-blue-500/20 border-brand-blue-400 dark:border-brand-blue-600 shadow-lg' : ''}
                        `}
                    >
                        <div className="flex items-center gap-2">
                            <Calendar className={`w-4 h-4 flex-shrink-0 ${hasDateFilter ? 'text-brand-blue-600 dark:text-brand-blue-400' : 'text-gray-500 dark:text-gray-400'}`} />
                            <span className="text-sm truncate">
                                {getDateDisplayValue()}
                            </span>
                        </div>
                        {hasDateFilter && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleFilterChange(dateFilter.id, null);
                                }}
                                className="ml-1 p-0.5 rounded hover:bg-brand-blue-100 dark:hover:bg-brand-blue-900/30 transition-colors"
                                aria-label="إزالة الفلتر"
                            >
                                <X className="w-3 h-3 text-brand-blue-600 dark:text-brand-blue-400" />
                            </button>
                        )}
                        <ChevronDown
                            className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${showDateDropdown ? 'rotate-180' : ''} ${hasDateFilter ? 'text-brand-blue-600 dark:text-brand-blue-400' : 'text-gray-400 dark:text-gray-500'}`}
                        />
                    </button>

                    {/* Date Dropdown Content */}
                    {showDateDropdown && (
                        <div 
                            ref={dropdownContentRef}
                            className="fixed w-80 bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 shadow-2xl z-50 animate-fade-in"
                            dir="ltr"
                            style={{ 
                                // Position will be set by useEffect
                            }}
                        >
                            <div className="p-4">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                            <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 font-cairo">
                                            {dateFilter.label || 'التاريخ'}
                                        </h4>
                                    </div>
                                    {hasDateFilter && (
                                        <button
                                            onClick={() => {
                                                handleFilterChange(dateFilter.id, null);
                                                setShowDateDropdown(false);
                                            }}
                                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
                                            aria-label="مسح"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                {/* Date Input */}
                                {dateFilter.type === 'dateRange' ? (
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 font-cairo">
                                                من تاريخ
                                            </label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input
                                                    type="date"
                                                    value={filters[dateFilter.id]?.start || ''}
                                                    onChange={(e) => {
                                                        const current = filters[dateFilter.id] || {};
                                                        handleFilterChange(dateFilter.id, { ...current, start: e.target.value });
                                                    }}
                                                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-cairo focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                                                    dir="ltr"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 font-cairo">
                                                إلى تاريخ
                                            </label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input
                                                    type="date"
                                                    value={filters[dateFilter.id]?.end || ''}
                                                    onChange={(e) => {
                                                        const current = filters[dateFilter.id] || {};
                                                        handleFilterChange(dateFilter.id, { ...current, end: e.target.value });
                                                    }}
                                                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-cairo focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                                                    dir="ltr"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="date"
                                            value={filters[dateFilter.id] || ''}
                                            onChange={(e) => {
                                                handleFilterChange(dateFilter.id, e.target.value);
                                                setShowDateDropdown(false);
                                            }}
                                            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-cairo focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                                            dir="ltr"
                                            autoFocus
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CompactFilterBar;
