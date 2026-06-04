import { ChevronDown } from 'lucide-react';

/**
 * MultiSelectDropdown Component - HVAR Design System
 * 
 * A reusable multi-select dropdown component with checkboxes.
 * WCAG 2.1 AA compliant with keyboard navigation and focus states.
 * 
 * @param {string} label - Label text for the dropdown
 * @param {Object} options - Object mapping values to display labels
 * @param {string[]} selectedValues - Array of selected values
 * @param {Function} onToggle - Callback when a value is toggled
 * @param {boolean} isOpen - Whether the dropdown is open
 * @param {Function} onToggleOpen - Callback to toggle dropdown open state
 */
const MultiSelectDropdown = ({ label, options, selectedValues, onToggle, isOpen, onToggleOpen }) => {
    const selectedCount = selectedValues.length;
    const displayText = selectedCount === 0 ? 'الكل' : `${selectedCount} محدَد`;

    return (
        <div className="flex-1 min-w-[110px] relative">
            <button
                type="button"
                onClick={() => onToggleOpen()}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onToggleOpen();
                    }
                }}
                aria-label={`${label}: ${displayText}`}
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                className="w-full pr-10 pl-3 h-[52px] border-2 border-gray-200 dark:border-gray-700 rounded-lg text-sm text-right focus:outline-none font-cairo !bg-transparent dark:!bg-transparent text-gray-900 dark:text-gray-100 transition-all duration-300 hover:border-gray-300 dark:hover:border-gray-600 flex items-center justify-between group"
                dir="rtl"
            >
                <div className="flex items-center gap-2 flex-1 justify-end">
                    <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">{label}</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{displayText}</span>
                </div>
                <ChevronDown 
                    className={`w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0 transition-all duration-300 ${isOpen ? 'rotate-180 text-gray-600 dark:text-gray-400' : 'group-hover:text-gray-600 dark:group-hover:text-gray-400'}`}
                    aria-hidden="true"
                />
            </button>

            {isOpen && (
                <div 
                    className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 max-h-60 overflow-auto p-3 backdrop-blur-sm"
                    role="listbox"
                    aria-label={label}
                >
                    {Object.entries(options).map(([value, optionLabel]) => {
                        const isSelected = selectedValues.includes(value);
                        return (
                            <label
                                key={value}
                                className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-all duration-200 border border-transparent ${
                                    isSelected 
                                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-200 border-gray-300 dark:border-gray-600' 
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                }`}
                                dir="rtl"
                                onClick={(e) => e.stopPropagation()}
                                role="option"
                                aria-selected={isSelected}
                            >
                                <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => onToggle(value)}
                                    className="w-3.5 h-3.5 text-gray-600 bg-transparent border-2 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-gray-400 dark:bg-gray-700 dark:text-gray-400 flex-shrink-0"
                                    onClick={(e) => e.stopPropagation()}
                                    aria-label={optionLabel}
                                />
                                <span className="text-xs font-medium font-cairo">
                                    {optionLabel}
                                </span>
                            </label>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default MultiSelectDropdown;

