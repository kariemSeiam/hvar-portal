/**
 * GovernorateSearchSelect - Searchable governorate selector
 * Internal search for easy selection of all 27 Egyptian governorates.
 * Optimized for light and dark mode, RTL.
 */
import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';
import { EGYPTIAN_GOVERNORATES } from '../../utils/core/governorates';

const GovernorateSearchSelect = ({
    value = '',
    onChange,
    placeholder = 'ابحث أو اختر المحافظة',
    label = '',
    required = false,
    error = '',
    disabled = false,
    className = '',
    compact = false,
    inline = false,
    dir = 'rtl',
    'aria-label': ariaLabel = 'المحافظة'
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const containerRef = useRef(null);
    const inputRef = useRef(null);

    const filtered = searchQuery.trim()
        ? EGYPTIAN_GOVERNORATES.filter(g =>
            g.includes(searchQuery.trim()) || g.startsWith(searchQuery.trim())
        )
        : EGYPTIAN_GOVERNORATES;

    const selectedLabel = value ? EGYPTIAN_GOVERNORATES.find(g => g === value) || value : '';

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setSearchQuery('');
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    const handleSelect = (gov) => {
        onChange?.({ target: { value: gov } });
        setIsOpen(false);
    };

    const handleClear = (e) => {
        e.stopPropagation();
        onChange?.({ target: { value: '' } });
    };

    const baseBtn = inline
        ? 'px-0 py-0 min-h-0 text-xs sm:text-sm border-0 bg-transparent shadow-none hover:border-0'
        : compact
            ? 'px-2 py-1 min-h-[32px] text-xs'
            : 'px-3 sm:px-4 py-2.5 sm:py-2 min-h-[44px] sm:min-h-[40px] text-sm sm:text-base';

    return (
        <div
            ref={containerRef}
            className={`relative ${inline ? 'w-full min-w-0 max-w-full' : 'w-full'} ${className}`}
            dir={dir}
        >
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-cairo">
                    {label}
                    {required && <span className="text-red-500 mr-1">*</span>}
                </label>
            )}
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                aria-label={ariaLabel}
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                className={`
                    ${inline ? 'w-full max-w-full min-w-0' : 'w-full'} inline-flex items-center justify-between gap-2
                    ${baseBtn}
                    rounded-lg
                    ${!inline ? 'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700' : ''}
                    text-gray-900 dark:text-gray-100
                    placeholder-gray-500 dark:placeholder-gray-400
                    transition-colors duration-200
                    focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500
                    disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed
                    ${!inline ? 'hover:border-gray-400 dark:hover:border-gray-500' : ''}
                    ${isOpen ? 'ring-2 ring-brand-blue-500/30 border-brand-blue-500 dark:border-brand-blue-400' : ''}
                    ${error ? 'border-red-500 focus:ring-red-500' : ''}
                    font-cairo
                `}
            >
                <span
                    title={inline && selectedLabel ? selectedLabel : undefined}
                    className={`flex-1 min-w-0 text-start ${inline ? 'whitespace-nowrap truncate' : 'truncate'} ${!selectedLabel ? 'text-gray-500 dark:text-gray-400' : ''}`}
                >
                    {selectedLabel || placeholder}
                </span>
                <div className="flex items-center gap-1 flex-shrink-0">
                    {value && !disabled && (
                        <span
                            role="button"
                            tabIndex={0}
                            onClick={handleClear}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleClear(e);
                                }
                            }}
                            className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-pointer"
                            aria-label="مسح"
                        >
                            <X className="w-3.5 h-3.5" />
                        </span>
                    )}
                    <ChevronDown
                        className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                </div>
            </button>

            {isOpen && (
                <div
                    role="listbox"
                    className={`
                        absolute top-full mt-1 z-50
                        bg-white dark:bg-gray-800
                        border border-gray-200 dark:border-gray-600
                        rounded-lg shadow-xl
                        overflow-hidden
                        max-h-[280px] flex flex-col
                        ${
                            inline
                                ? 'right-0 w-max min-w-[14rem] max-w-[min(100vw-1.5rem,24rem)]'
                                : 'left-0 right-0 w-full'
                        }
                    `}
                >
                    <div className="p-2 border-b border-gray-200 dark:border-gray-600 flex-shrink-0">
                        <div className="relative">
                            <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="ابحث..."
                                className="w-full pr-9 pl-3 py-2 text-sm
                                    bg-gray-50 dark:bg-gray-700/50
                                    border border-gray-200 dark:border-gray-600
                                    rounded-lg
                                    text-gray-900 dark:text-gray-100
                                    placeholder-gray-500 dark:placeholder-gray-400
                                    focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500
                                    font-cairo"
                                dir="rtl"
                            />
                        </div>
                    </div>
                    <div className="overflow-y-auto overscroll-contain max-h-[220px] p-1 scrollbar-dropdown">
                        {filtered.length === 0 ? (
                            <div className="py-4 text-center text-sm text-gray-500 dark:text-gray-400 font-cairo">
                                لا توجد نتائج
                            </div>
                        ) : (
                            filtered.map((gov) => (
                                <button
                                    key={gov}
                                    type="button"
                                    role="option"
                                    aria-selected={value === gov}
                                    onClick={() => handleSelect(gov)}
                                    className={`
                                        w-full min-w-0 whitespace-nowrap text-right px-3 py-2 rounded-md text-sm font-cairo
                                        transition-colors
                                        ${value === gov
                                            ? 'bg-brand-blue-50 dark:bg-brand-blue-900/30 text-brand-blue-700 dark:text-brand-blue-300'
                                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/70'
                                        }
                                    `}
                                >
                                    {gov}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}

            {error && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400 font-cairo">{error}</p>
            )}
        </div>
    );
};

export default GovernorateSearchSelect;
