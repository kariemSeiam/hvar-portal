import { memo } from 'react';
import { GlobalNavigation } from '../';
import {
    getTabColorClasses,
    getTabBgClasses,
    getTabBadgeClasses,
    getSubTabColorClasses,
    getTabBorderStyle,
} from '../../utils/ui/tabs';

/**
 * Presentational tabs strip for Stock Management page.
 * Desktop: menu icon + tabs; Mobile: menu then tabs row.
 * Matches Service Actions page styling.
 */
function StockTabs({
    activeTab,
    onTabChange,
    tabs,
    isLoading,
}) {
    const renderMainTabs = (isMobile = false) => (
        <nav
            role="tablist"
            className={isMobile
                ? 'flex gap-1 sm:gap-1.5 bg-transparent overflow-x-auto scrollbar-tabs scroll-smooth justify-center'
                : 'flex-1 min-w-0 w-full flex gap-1 sm:gap-1.5 bg-transparent overflow-x-auto scrollbar-tabs scroll-smooth justify-center ps-2 pe-0'}
            style={{ scrollbarGutter: 'stable', WebkitOverflowScrolling: 'touch' }}
        >
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    aria-controls={isMobile ? undefined : `panel-${tab.id}`}
                    aria-label={tab.ariaLabel}
                    onClick={() => onTabChange(tab.id)}
                    disabled={isLoading}
                    className={`relative flex-shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-cairo font-medium rounded-xl transition-colors duration-150 ${activeTab === tab.id
                        ? `${getTabBgClasses(tab.color, true)} ${getTabColorClasses(tab.color, true)} border-2 shadow-sm`
                        : 'bg-stone-100 dark:bg-gray-900 text-stone-600 dark:text-gray-400 hover:text-stone-800 dark:hover:text-gray-200 border-2 border-transparent'
                        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    style={activeTab === tab.id ? getTabBorderStyle(tab.color) : {}}
                >
                    <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                        {tab.icon && <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />}
                        <span className="whitespace-nowrap">{tab.label}</span>
                        {tab.badge && (
                            <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-bold min-w-[20px] sm:min-w-[22px] flex items-center justify-center ${getTabBadgeClasses(tab.color, activeTab === tab.id)}`}>
                                {tab.badge}
                            </span>
                        )}
                    </div>
                </button>
            ))}
        </nav>
    );

    return (
        <header className="bg-stone-50/95 dark:bg-gray-800 border-b border-stone-200/90 dark:border-gray-700 flex-shrink-0 pt-safe">
            {/* Desktop */}
            <div className="hidden lg:block ps-4 lg:ps-6 pe-0 py-3 lg:py-4">
                <div className="flex items-center gap-2 lg:gap-3 w-full min-w-0">
                    <div className="shrink-0">
                        <GlobalNavigation />
                    </div>
                    {renderMainTabs(false)}
                </div>
            </div>

            {/* Mobile */}
            <div className="lg:hidden">
                <div className="px-4 py-3 flex items-center gap-2">
                    <GlobalNavigation />
                </div>
                <div className="border-t border-stone-200/90 dark:border-gray-700 px-2 pb-2 pt-1">
                    {renderMainTabs(true)}
                </div>
            </div>
        </header>
    );
}

export default memo(StockTabs);
