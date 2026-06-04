import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Check, Phone } from 'lucide-react';

/**
 * Search Bar Component - Call Center Search & Filters
 *
 * Creative design with:
 * - Width based on existing text content
 * - Hint text with perfect padding
 * - Inline filters between search and buttons
 * - "Open session" button when search is a phone number (11+ digits)
 */
const SearchBar = ({
  onSearch,
  onOpenSessionForPhone = null,
  statusFilters = [],
  onStatusFilterChange,
  attemptFilters = [],
  onAttemptFilterChange,
  onClearFilters,
  leadingActions = null
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [inputWidth, setInputWidth] = useState(400);
  const inputRef = useRef(null);
  const measureRef = useRef(null);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    if (onSearch) {
      onSearch('');
    }
  };

  // Measure text width to set input width dynamically
  useEffect(() => {
    if (measureRef.current && inputRef.current) {
      const text = searchQuery || inputRef.current.placeholder;
      measureRef.current.textContent = text;
      const width = measureRef.current.offsetWidth;
      // Add padding: right (icon 16px + padding 12px) + left (clear button space 16px + padding 16px) = 60px
      // Plus some extra space for comfortable typing
      setInputWidth(Math.max(280, Math.min(width + 100, 600)));
    }
  }, [searchQuery]);

  // Filter handlers
  const statusOptions = [
    { value: 'new', label: 'جديد', color: 'blue' },
    { value: 'scheduled', label: 'مجدول', color: 'purple' },
    { value: 'no_answer', label: 'لم يرد', color: 'amber' }
  ];

  const attemptOptions = [
    { value: 0, label: 'بدون محاولات', icon: '0️⃣' },
    { value: 1, label: 'محاولة واحدة', icon: '1️⃣' },
    { value: 2, label: 'محاولتان', icon: '2️⃣' },
    { value: 3, label: '3+ محاولات', icon: '3️⃣' }
  ];

  const handleStatusToggle = (status) => {
    if (onStatusFilterChange) {
      const newFilters = statusFilters.includes(status)
        ? statusFilters.filter(s => s !== status)
        : [...statusFilters, status];
      onStatusFilterChange(newFilters);
    }
  };

  const handleAttemptToggle = (attempt) => {
    if (onAttemptFilterChange) {
      const newFilters = attemptFilters.includes(attempt)
        ? attemptFilters.filter(a => a !== attempt)
        : [...attemptFilters, attempt];
      onAttemptFilterChange(newFilters);
    }
  };

  const getStatusColor = (status) => {
    const option = statusOptions.find(opt => opt.value === status);
    if (!option) return 'blue';

    const colors = {
      blue: {
        text: 'text-blue-600 dark:text-blue-400',
        border: 'border-blue-500 dark:border-blue-400',
        checked: 'bg-blue-500 dark:bg-blue-400'
      },
      purple: {
        text: 'text-purple-600 dark:text-purple-400',
        border: 'border-purple-500 dark:border-purple-400',
        checked: 'bg-purple-500 dark:bg-purple-400'
      },
      amber: {
        text: 'text-amber-600 dark:text-amber-400',
        border: 'border-amber-500 dark:border-amber-400',
        checked: 'bg-amber-500 dark:bg-amber-400'
      }
    };
    return colors[option.color] || colors.blue;
  };

  const hasActiveFilters = statusFilters.length > 0 || attemptFilters.length > 0;

  // Phone-like: 10+ digits (Egyptian 01xxxxxxxxx, 1xxxxxxxxx, 201..., +201...)
  const digitsOnly = (searchQuery || '').replace(/\D/g, '');
  const isPhoneLike = digitsOnly.length >= 10 && onOpenSessionForPhone;

  const handleOpenSession = () => {
    if (searchQuery?.trim() && onOpenSessionForPhone) {
      onOpenSessionForPhone(searchQuery.trim());
    }
  };

  return (
    <div className="w-full flex items-center gap-2 sm:gap-3 lg:gap-4 px-4 sm:px-6 lg:px-8 py-2 sm:py-3 lg:py-3" dir="rtl">
      {/* Hidden span to measure text width - matches input font exactly */}
      <span
        ref={measureRef}
        className="absolute invisible whitespace-pre text-sm sm:text-base font-cairo pointer-events-none"
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '-9999px',
          left: '-9999px',
          visibility: 'hidden',
          whiteSpace: 'pre'
        }}
      />

      {/* Search Input - Width based on content */}
      <div className="relative flex items-center gap-3 group flex-shrink-0">
        {/* Search Input Container */}
        <div className="relative flex items-center">
          {/* Search Icon */}
          <div className="absolute right-3.5 z-10 pointer-events-none">
            <Search className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-gray-400 dark:text-gray-500 group-focus-within:text-brand-blue-500 dark:group-focus-within:text-brand-blue-400 transition-colors" />
          </div>

          {/* Search Input - Width dynamically set based on text content */}
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="ابحث عن طلب، عميل أو رقم هاتف..."
            className="pr-12 pl-4 py-2.5 sm:py-3 lg:py-3 text-sm sm:text-base bg-transparent border-2 border-gray-200/50 dark:border-gray-700/50 hover:border-gray-300/70 dark:hover:border-gray-600/70 focus:border-brand-blue-500 dark:focus:border-brand-blue-400 rounded-full focus:outline-none focus:ring-0 focus:shadow-lg focus:shadow-brand-blue-500/10 dark:focus:shadow-brand-blue-400/10 transition-all duration-300 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 font-cairo"
            dir="rtl"
            style={{ width: `${inputWidth}px` }}
          />

          {/* Clear Button */}
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute left-3.5 z-10 p-1 rounded-full text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
              aria-label="مسح البحث"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Open Session button — when search is a phone number (11+ digits) */}
        {isPhoneLike && (
          <button
            type="button"
            onClick={handleOpenSession}
            className="flex items-center gap-2 px-3 py-2 rounded-full bg-brand-blue-500 hover:bg-brand-blue-600 dark:bg-brand-blue-600 dark:hover:bg-brand-blue-500 text-white text-sm font-cairo font-medium transition-all duration-200 shadow-sm hover:shadow-md"
            title="فتح جلسة مكالمة لهذا الرقم"
            aria-label="فتح جلسة مكالمة"
          >
            <Phone className="w-4 h-4 flex-shrink-0" />
            <span>فتح جلسة</span>
          </button>
        )}
      </div>

      {/* Inline Filters - Between search and buttons */}
      <div className="flex items-center gap-2 sm:gap-2.5 flex-1 min-w-0 overflow-x-auto scrollbar-hide">
        {/* Status Filters */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 font-cairo whitespace-nowrap">
            الحالة:
          </span>
          <span className="text-gray-400 dark:text-gray-600 text-sm">|</span>
          {statusOptions.map((option) => {
            const isChecked = statusFilters.includes(option.value);
            const colors = getStatusColor(option.value);

            return (
              <button
                key={option.value}
                onClick={() => handleStatusToggle(option.value)}
                className={`
                  relative flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 sm:py-2 rounded-lg
                  border transition-all duration-200 font-cairo text-xs sm:text-sm font-medium
                  backdrop-blur-sm
                  ${isChecked
                    ? `${colors.border} ${colors.text} border-2`
                    : 'border-gray-300/50 dark:border-gray-600/50 text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500'
                  }
                `}
                style={{
                  backgroundColor: 'transparent'
                }}
              >
                {/* Checkbox Indicator */}
                <div className={`
                  w-3.5 h-3.5 rounded flex items-center justify-center flex-shrink-0
                  border-2 transition-all duration-200
                  ${isChecked
                    ? `${colors.checked} border-transparent`
                    : 'border-gray-400 dark:border-gray-500 bg-transparent'
                  }
                `}>
                  {isChecked && (
                    <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                  )}
                </div>
                <span className="whitespace-nowrap">{option.label}</span>
              </button>
            );
          })}
        </div>

        {/* Divider */}
        {(statusFilters.length > 0 || attemptFilters.length > 0) && (
          <div className="w-px h-5 bg-gray-300/50 dark:bg-gray-600/50 flex-shrink-0"></div>
        )}

        {/* Attempt Filter */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 font-cairo whitespace-nowrap">
            المحاولات:
          </span>
          <span className="text-gray-400 dark:text-gray-600 text-sm">|</span>
          <div className="flex items-center gap-1.5 sm:gap-2">
            {attemptOptions.map((option) => {
              const isSelected = attemptFilters.includes(option.value);

              // Color mapping based on attempt count
              const getAttemptColor = (value) => {
                switch (value) {
                  case 0:
                    return {
                      border: 'border-green-500 dark:border-green-400',
                      text: 'text-green-600 dark:text-green-400',
                      bg: 'bg-green-50/30 dark:bg-green-900/20',
                      indicator: 'bg-green-500'
                    };
                  case 1:
                    return {
                      border: 'border-amber-500 dark:border-amber-400',
                      text: 'text-amber-600 dark:text-amber-400',
                      bg: 'bg-amber-50/30 dark:bg-amber-900/20',
                      indicator: 'bg-amber-500'
                    };
                  case 2:
                    return {
                      border: 'border-orange-500 dark:border-orange-400',
                      text: 'text-orange-600 dark:text-orange-400',
                      bg: 'bg-orange-50/30 dark:bg-orange-900/20',
                      indicator: 'bg-orange-500'
                    };
                  case 3:
                    return {
                      border: 'border-red-500 dark:border-red-400',
                      text: 'text-red-600 dark:text-red-400',
                      bg: 'bg-red-50/30 dark:bg-red-900/20',
                      indicator: 'bg-red-500'
                    };
                  default:
                    return {
                      border: 'border-gray-500 dark:border-gray-400',
                      text: 'text-gray-600 dark:text-gray-400',
                      bg: 'bg-gray-50/30 dark:bg-gray-900/20',
                      indicator: 'bg-gray-500'
                    };
                }
              };

              const colors = getAttemptColor(option.value);

              return (
                <button
                  key={option.value}
                  onClick={() => handleAttemptToggle(option.value)}
                  className={`
                    relative w-10 h-10 sm:w-10 sm:h-10 rounded-full min-w-[44px] min-h-[44px]
                    border-2 transition-all duration-200 font-cairo font-bold
                    backdrop-blur-sm
                    flex items-center justify-center
                    ${isSelected
                      ? `${colors.border} ${colors.text} ${colors.bg} shadow-sm`
                      : 'border-gray-300/50 dark:border-gray-600/50 text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 bg-transparent'
                    }
                  `}
                  title={option.label}
                >
                  <span className="text-xs sm:text-sm leading-none">
                    {option.value === 3 ? '3+' : option.value}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Clear Filters Button - Icon Only */}
        {hasActiveFilters && (
          <>
            <div className="w-px h-5 bg-gray-300/50 dark:bg-gray-600/50 flex-shrink-0"></div>
            <button
              onClick={onClearFilters}
              className="p-1.5 sm:p-2 rounded-lg
                text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300
                hover:bg-gray-100/50 dark:hover:bg-gray-800/50
                transition-all duration-200 flex-shrink-0"
              title="مسح جميع الفلاتر"
              aria-label="مسح جميع الفلاتر"
            >
              <X className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
