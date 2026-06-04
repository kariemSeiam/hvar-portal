import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, ChevronDown, Package, CheckCircle, Building2 } from 'lucide-react';
import FilterMultiSelectDropdown from '../filters/FilterMultiSelectDropdown';

const SERVICE_TYPE_OPTIONS = {
    replacement: 'استبدال',
    maintenance: 'صيانة',
    return: 'استرجاع',
    sell: 'بيع',
};

const STATUS_OPTIONS = {
    PENDING: 'قيد الانتظار',
    CONFIRMED: 'مؤكد',
    IN_PROCESS: 'قيد المعالجة',
    READY_FOR_DISPATCH: 'جاهز للإرسال',
    SENT: 'مرسل',
    DELIVERED: 'تم التسليم',
    RETURNED: 'مرتجع',
    COMPLETED: 'مكتمل',
    CANCELLED: 'ملغي'
};

const SOURCE_OPTIONS = {
    call_center: 'مركز الاتصال',
    hub: 'المركز (Hub)',
    erp: 'ERP'
};

const DATE_PRESET_LABELS = {
    all: 'الكل',
    today: 'اليوم',
    yesterday: 'أمس',
    lastWeek: 'آخر 7 أيام',
    last30Days: 'آخر 30 يوم',
    thisMonth: 'هذا الشهر',
    custom: 'مخصص'
};

export default function ServiceActionsFilters({
    selectedServiceTypes,
    onServiceTypeToggle,
    selectedStatuses,
    onStatusToggle,
    selectedSources,
    onSourceToggle,
    datePreset,
    startDate,
    endDate,
    onDatePresetChange,
    onStartDateChange,
    onEndDateChange
}) {
    const [isServiceTypeOpen, setIsServiceTypeOpen] = useState(false);
    const [isStatusOpen, setIsStatusOpen] = useState(false);
    const [isSourceOpen, setIsSourceOpen] = useState(false);
    const [isDateOpen, setIsDateOpen] = useState(false);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('.filter-dropdown')) {
                setIsServiceTypeOpen(false);
                setIsStatusOpen(false);
                setIsSourceOpen(false);
                setIsDateOpen(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const handleDatePreset = useCallback((preset) => {
        onDatePresetChange(preset);
        if (preset !== 'custom') setIsDateOpen(false);
    }, [onDatePresetChange]);

    return (
        <div role="group" aria-label="فلاتر" className="flex items-stretch gap-2 sm:gap-3 flex-shrink-0 ms-auto ps-3 pe-0">
            <div className="hidden sm:block w-[1px] h-8 bg-gray-300 dark:bg-gray-700 self-center" />
            <div className="filter-dropdown">
                <FilterMultiSelectDropdown
                    label="نوع الخدمة"
                    options={SERVICE_TYPE_OPTIONS}
                    selectedValues={selectedServiceTypes}
                    onToggle={onServiceTypeToggle}
                    isOpen={isServiceTypeOpen}
                    onToggleOpen={() => {
                        setIsServiceTypeOpen(!isServiceTypeOpen);
                        setIsStatusOpen(false);
                        setIsDateOpen(false);
                    }}
                    icon={Package}
                    color="purple"
                />
            </div>
            <div className="filter-dropdown">
                <FilterMultiSelectDropdown
                    label="الحالة"
                    options={STATUS_OPTIONS}
                    selectedValues={selectedStatuses}
                    onToggle={onStatusToggle}
                    isOpen={isStatusOpen}
                    onToggleOpen={() => {
                        setIsStatusOpen(!isStatusOpen);
                        setIsServiceTypeOpen(false);
                        setIsDateOpen(false);
                    }}
                    icon={CheckCircle}
                    color="green"
                />
            </div>
            <div className="filter-dropdown">
                <FilterMultiSelectDropdown
                    label="المصدر"
                    options={SOURCE_OPTIONS}
                    selectedValues={selectedSources}
                    onToggle={onSourceToggle}
                    isOpen={isSourceOpen}
                    onToggleOpen={() => {
                        setIsSourceOpen(!isSourceOpen);
                        setIsStatusOpen(false);
                        setIsServiceTypeOpen(false);
                        setIsDateOpen(false);
                    }}
                    icon={Building2}
                    color="indigo"
                />
            </div>
            <div className="filter-dropdown flex-1 sm:flex-none w-full sm:w-[180px] sm:min-w-[180px] min-w-0 relative">
                <button
                    type="button"
                    onClick={() => {
                        setIsDateOpen(!isDateOpen);
                        setIsServiceTypeOpen(false);
                        setIsStatusOpen(false);
                    }}
                    className={`w-full pr-2 pl-2 sm:pr-3 sm:pl-3 h-[48px] sm:h-[52px] border-2 border-gray-200 dark:border-gray-700 rounded-xl text-xs sm:text-sm text-right focus:outline-none font-cairo transition-all duration-300 hover:border-gray-300 dark:hover:border-gray-600 flex items-center justify-between group gap-1.5 sm:gap-2 shadow-sm dark:shadow-none ${datePreset !== 'all' || isDateOpen
                        ? 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400 border-2'
                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                        }`}
                    style={datePreset !== 'all' || isDateOpen ? { borderColor: 'color-mix(in srgb, var(--color-info-500) 40%, transparent)' } : {}}
                    dir="rtl"
                >
                    <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 dark:text-gray-500 flex-shrink-0 transition-all duration-300 group-hover:text-gray-600 dark:group-hover:text-gray-400" />
                    <div className="flex flex-col items-start flex-1 min-w-0">
                        <span className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs font-medium">التاريخ</span>
                        <span className={`font-semibold text-[10px] sm:text-xs truncate w-full text-right ${datePreset !== 'all' || isDateOpen ? 'text-cyan-600 dark:text-cyan-400' : 'text-gray-900 dark:text-gray-100'}`}>
                            {datePreset === 'custom' && startDate && endDate ? `${startDate} - ${endDate}` : DATE_PRESET_LABELS[datePreset] ?? 'الكل'}
                        </span>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 dark:text-gray-500 flex-shrink-0 transition-all duration-300 ${isDateOpen ? 'rotate-180 text-gray-600 dark:text-gray-400' : 'group-hover:text-gray-600 dark:group-hover:text-gray-400'}`} />
                </button>
                {isDateOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 sm:mt-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 p-2 sm:p-3 backdrop-blur-sm max-h-[200px] sm:max-h-[240px] overflow-auto scrollbar-dropdown">
                        <div className="space-y-1.5 sm:space-y-2">
                            {['all', 'today', 'yesterday', 'lastWeek', 'last30Days', 'thisMonth'].map((preset) => (
                                <button
                                    key={preset}
                                    type="button"
                                    onClick={() => handleDatePreset(preset)}
                                    className={`w-full text-right px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-[10px] sm:text-xs font-cairo font-medium transition-all duration-200 ${datePreset === preset
                                        ? 'bg-gradient-to-r from-brand-blue-50 to-blue-50 dark:from-brand-blue-900/30 dark:to-blue-900/30 text-brand-blue-700 dark:text-brand-blue-300 border border-brand-blue-200 dark:border-brand-blue-800'
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-transparent'
                                        }`}
                                >
                                    {DATE_PRESET_LABELS[preset]}
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={() => {
                                    onDatePresetChange('custom');
                                    setIsDateOpen(true);
                                }}
                                className={`w-full text-right px-3 py-2 rounded-md text-xs font-cairo font-medium transition-all duration-200 ${datePreset === 'custom'
                                    ? 'bg-gradient-to-r from-brand-blue-50 to-blue-50 dark:from-brand-blue-900/30 dark:to-blue-900/30 text-brand-blue-700 dark:text-brand-blue-300 border border-brand-blue-200 dark:border-brand-blue-800'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-transparent'
                                    }`}
                            >
                                مخصص
                            </button>
                            {datePreset === 'custom' && (
                                <div className="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-2">
                                    <div>
                                        <label className="block text-xs text-gray-600 dark:text-gray-400 font-cairo mb-1 font-medium">من</label>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={onStartDateChange}
                                            className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-md text-xs font-cairo dark:bg-gray-900 dark:text-white bg-transparent focus:outline-none focus:border-brand-blue-500 dark:focus:border-brand-blue-400 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-600 dark:text-gray-400 font-cairo mb-1 font-medium">إلى</label>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={onEndDateChange}
                                            className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-md text-xs font-cairo dark:bg-gray-900 dark:text-white bg-transparent focus:outline-none focus:border-brand-blue-500 dark:focus:border-brand-blue-400 transition-colors"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
