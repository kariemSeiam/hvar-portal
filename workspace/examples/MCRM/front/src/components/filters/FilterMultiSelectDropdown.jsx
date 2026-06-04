import { memo } from 'react';
import { ChevronDown } from 'lucide-react';

// ============================================
// Module-level functions (not recreated on render)
// ============================================

const getFilterColorClasses = (filterColor, isActive) => {
    if (!isActive) return '';
    const colorMap = {
        blue: 'text-blue-600 dark:text-blue-400',
        purple: 'text-purple-600 dark:text-purple-400',
        green: 'text-green-600 dark:text-green-400',
        orange: 'text-orange-600 dark:text-orange-400',
        yellow: 'text-yellow-600 dark:text-yellow-400',
        cyan: 'text-cyan-600 dark:text-cyan-400'
    };
    return colorMap[filterColor] || '';
};

const getFilterBgClasses = (filterColor, isActive) => {
    if (!isActive) return 'bg-transparent';
    const bgMap = {
        blue: 'bg-blue-50 dark:bg-blue-900/20',
        purple: 'bg-purple-50 dark:bg-purple-900/20',
        green: 'bg-green-50 dark:bg-green-900/20',
        orange: 'bg-orange-50 dark:bg-orange-900/20',
        yellow: 'bg-yellow-50 dark:bg-yellow-900/20',
        cyan: 'bg-cyan-50 dark:bg-cyan-900/20'
    };
    return bgMap[filterColor] || 'bg-white dark:bg-gray-800';
};

/**
 * Filter-oriented multi-select dropdown with icon, color variants, and RTL layout.
 * Used in ServiceActionsPage filter bar.
 */
const FilterMultiSelectDropdown = memo(({ label, options, selectedValues, onToggle, isOpen, onToggleOpen, icon: Icon, color = 'blue' }) => {
    const selectedCount = selectedValues.length;
    const displayText = selectedCount === 0 ? 'الكل' : selectedCount === 1
        ? options[selectedValues[0]]
        : `${selectedCount} محدَد`;

    const hasSelection = selectedCount > 0;

    return (
        <div className="flex-1 sm:flex-none w-full sm:w-[180px] sm:min-w-[180px] min-w-0 relative">
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    onToggleOpen();
                }}
                className={`w-full pr-2 pl-2 sm:pr-3 sm:pl-3 h-11 sm:h-12 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-xs sm:text-sm text-right focus:outline-none font-cairo transition-all duration-300 hover:border-gray-300 dark:hover:border-gray-600 flex items-center justify-between group gap-2 shadow-sm dark:shadow-none ${hasSelection || isOpen
                    ? `${getFilterBgClasses(color, true)} ${getFilterColorClasses(color, true)} border-2`
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                    }`}
                style={hasSelection || isOpen ? {
                    borderColor: color === 'blue' ? 'color-mix(in srgb, var(--color-info-500) 40%, transparent)' :
                               color === 'purple' ? 'color-mix(in srgb, var(--color-accent-purple-500) 40%, transparent)' :
                               color === 'green' ? 'color-mix(in srgb, var(--color-accent-green-500) 40%, transparent)' :
                               color === 'orange' ? 'color-mix(in srgb, var(--color-accent-amber-500) 40%, transparent)' :
                               color === 'yellow' ? 'color-mix(in srgb, var(--color-warning-500) 40%, transparent)' :
                               color === 'cyan' ? 'color-mix(in srgb, var(--color-brand-blue-400) 40%, transparent)' :
                               'color-mix(in srgb, var(--color-gray-400) 40%, transparent)'
                } : {}}
                dir="rtl"
            >
                {Icon && <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 dark:text-gray-500 flex-shrink-0 transition-all duration-300 group-hover:text-gray-600 dark:group-hover:text-gray-400" />}
                <div className="flex flex-col items-start flex-1 min-w-0">
                    <span className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs font-medium">{label}</span>
                    <span className={`font-semibold text-[10px] sm:text-xs truncate w-full text-right ${hasSelection || isOpen ? getFilterColorClasses(color, true) : 'text-gray-900 dark:text-gray-100'}`}>{displayText}</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 dark:text-gray-500 flex-shrink-0 transition-all duration-300 ${isOpen ? 'rotate-180 text-gray-600 dark:text-gray-400' : 'group-hover:text-gray-600 dark:group-hover:text-gray-400'}`} />
            </button>

            {isOpen && (
                <div
                    className="absolute top-full left-0 right-0 mt-1 sm:mt-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 p-2 sm:p-3 backdrop-blur-sm max-h-[200px] sm:max-h-[240px] overflow-auto scrollbar-hide"
                    onClick={(e) => e.stopPropagation()}
                >
                    {Object.entries(options).map(([value, optionLabel]) => (
                        <label
                            key={value}
                            className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition-colors"
                            dir="rtl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <input
                                type="checkbox"
                                checked={selectedValues.includes(value)}
                                onChange={() => onToggle(value)}
                                className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600 bg-gray-100 border-gray-300 rounded focus:ring-2 focus:ring-gray-400 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 flex-shrink-0"
                                onClick={(e) => e.stopPropagation()}
                            />
                            <span className="text-[10px] sm:text-xs font-medium text-gray-700 dark:text-gray-300 font-cairo">
                                {optionLabel}
                            </span>
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
});

FilterMultiSelectDropdown.displayName = 'FilterMultiSelectDropdown';

export default FilterMultiSelectDropdown;
