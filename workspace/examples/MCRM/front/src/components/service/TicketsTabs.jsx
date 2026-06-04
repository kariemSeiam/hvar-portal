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
 * Presentational tabs strip (main + sub-tabs) for Service Actions page.
 * Desktop: menu icon + tabs; Mobile: menu then tabs row.
 */
function TicketsTabs({
    activeStatus,
    setActiveStatus,
    activeSubTab,
    setActiveSubTab,
    tabs,
    subTabsConfig,
    getSubTabCount,
    getTabColorClasses: getTabColorClassesProp,
    getTabBgClasses: getTabBgClassesProp,
    getTabBadgeClasses: getTabBadgeClassesProp,
    getSubTabColorClasses: getSubTabColorClassesProp,
    getTabBorderStyle: getTabBorderStyleProp,
    searchMode,
}) {
    const getTabColor = getTabColorClassesProp || getTabColorClasses;
    const getTabBg = getTabBgClassesProp || getTabBgClasses;
    const getTabBadge = getTabBadgeClassesProp || getTabBadgeClasses;
    const getSubTabColor = getSubTabColorClassesProp || getSubTabColorClasses;
    const getTabBorder = getTabBorderStyleProp || getTabBorderStyle;

    const renderMainTabs = (isMobile = false) => (
        <nav
            role="tablist"
            className={isMobile
                ? 'flex gap-1 sm:gap-1.5 bg-transparent overflow-x-auto scrollbar-tabs scroll-smooth justify-center'
                : 'flex-1 min-w-0 w-full flex gap-1 sm:gap-1.5 bg-transparent overflow-x-auto scrollbar-tabs scroll-smooth justify-center'}
            style={{ scrollbarGutter: 'stable', WebkitOverflowScrolling: 'touch' }}
        >
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    role="tab"
                    aria-selected={activeStatus === tab.id}
                    aria-controls={isMobile ? undefined : `panel-${tab.id}`}
                    aria-label={tab.ariaLabel}
                    onClick={() => setActiveStatus(tab.id)}
                    className={`relative flex-shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-cairo font-medium rounded-xl transition-colors duration-150 ${activeStatus === tab.id
                        ? `${getTabBg(tab.color, true)} ${getTabColor(tab.color, true)} border-2 shadow-sm`
                        : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 border-2 border-transparent'
                        }`}
                    style={activeStatus === tab.id ? getTabBorder(tab.color) : {}}
                >
                    {tab.indicators && tab.indicators.map((indicator, idx) => (
                        <span
                            key={idx}
                            className={`absolute ${indicator.position === 'right' ? '-top-0.5 -right-0.5' : '-top-0.5 -left-0.5'} w-2.5 h-2.5 ${indicator.color || 'bg-red-500'} rounded-full border-2 border-white dark:border-gray-800 shadow-sm ${indicator.animate ? 'animate-pulse' : ''} z-10`}
                            title={indicator.title || ''}
                        />
                    ))}
                    <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                        {tab.icon && <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />}
                        <span className="whitespace-nowrap">{tab.label}</span>
                        {tab.badge && (
                            <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-bold min-w-[20px] sm:min-w-[22px] flex items-center justify-center ${getTabBadge(tab.color, activeStatus === tab.id)}`}>
                                {tab.badge}
                            </span>
                        )}
                    </div>
                </button>
            ))}
        </nav>
    );

    const renderSubTabs = (isMobile = false) => {
        if (searchMode !== 'internal' || !['replacement', 'maintenance', 'return', 'sell'].includes(activeStatus)) return null;
        const list = subTabsConfig[activeStatus] || [];
        if (list.length === 0) return null;
        return (
            <>
                <div className="w-full flex justify-center my-2 sm:my-2.5">
                    <div className={`h-[1px] ${isMobile ? 'w-16' : 'w-20 sm:w-28'} bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent`} />
                </div>
                <nav
                    role="tablist"
                    className={isMobile ? 'flex gap-1 overflow-x-auto scrollbar-tabs scroll-smooth justify-center' : 'flex gap-1 sm:gap-1.5 bg-transparent overflow-x-auto scrollbar-tabs scroll-smooth justify-center w-full px-2'}
                    style={{ scrollbarGutter: 'stable', WebkitOverflowScrolling: 'touch' }}
                >
                    {list.map((subTab) => {
                        const count = getSubTabCount(activeStatus, subTab.id);
                        const isCompletionReady = subTab.id === 'completion-ready';
                        return (
                            <button
                                key={subTab.id}
                                role="tab"
                                aria-selected={activeSubTab === subTab.id}
                                onClick={() => setActiveSubTab(subTab.id)}
                                className={`flex-shrink-0 px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-cairo font-medium rounded-xl transition-colors duration-150 ${activeSubTab === subTab.id
                                    ? `${getTabBg(subTab.color, true)} ${getSubTabColor(subTab.color)} border-2 shadow-sm`
                                    : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 border-2 border-transparent'
                                    } ${isCompletionReady && activeSubTab === subTab.id ? 'ring-2 ring-purple-500 dark:ring-purple-400' : ''}`}
                                style={activeSubTab === subTab.id ? getTabBorder(subTab.color) : {}}
                            >
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                    <span className="whitespace-nowrap">{subTab.label}</span>
                                    {isCompletionReady && <span className="text-xs" title="يحتاج رقم تتبع">📍</span>}
                                    <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-bold min-w-[18px] sm:min-w-[20px] flex items-center justify-center ${getTabBadge(subTab.color, activeSubTab === subTab.id)}`}>
                                        {count}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </nav>
            </>
        );
    };

    return (
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 pt-safe">
            {/* Desktop: page gutter ps/pe aligned with content (px-4 sm:px-6); vertical rhythm py-4 = space-4 */}
            <div className="hidden lg:block ps-4 sm:ps-6 pe-4 sm:pe-6 py-4">
                <div className="flex items-center gap-2 lg:gap-3 w-full min-w-0">
                    <div className="shrink-0">
                        <GlobalNavigation />
                    </div>
                    {renderMainTabs(false)}
                </div>
                {searchMode === 'internal' && tabs.find(t => t.id === activeStatus)?.hasSubTabs && renderSubTabs(false)}
            </div>

            {/* Mobile: same gutter px-4, vertical rhythm py-4 */}
            <div className="lg:hidden">
                <div className="px-4 py-4 flex items-center gap-2">
                    <GlobalNavigation />
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 px-4 pb-4 pt-2">
                    {renderMainTabs(true)}
                    {searchMode === 'internal' && ['replacement', 'maintenance', 'return', 'sell'].includes(activeStatus) && renderSubTabs(true)}
                </div>
            </div>
        </header>
    );
}

export default memo(TicketsTabs);
