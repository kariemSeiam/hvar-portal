import { useEffect, useRef } from 'react';

const TabNavigation = ({
    tabs,
    activeTab,
    onTabChange,
    isLoading = false,
    isMobile = false,
    variant = 'default', // 'default' | 'glass' — genome §9: CustomerServicePage uses glass
    className = ""
}) => {
    const containerRef = useRef(null);
    const activeTabRef = useRef(null);
    const mobileContainerRef = useRef(null);
    const mobileActiveTabRef = useRef(null);

    // Scroll active tab into view when it changes (desktop)
    useEffect(() => {
        if (!isMobile && activeTabRef.current && containerRef.current) {
            const container = containerRef.current;
            const activeTabElement = activeTabRef.current;
            
            const containerRect = container.getBoundingClientRect();
            const tabRect = activeTabElement.getBoundingClientRect();
            
            // Check if tab is outside visible area
            if (tabRect.left < containerRect.left) {
                // Tab is to the left, scroll it into view
                activeTabElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
            } else if (tabRect.right > containerRect.right) {
                // Tab is to the right, scroll it into view
                activeTabElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'end' });
            }
        }
    }, [activeTab, isMobile]);

    // Scroll active tab into view when it changes (mobile)
    useEffect(() => {
        if (isMobile && mobileActiveTabRef.current && mobileContainerRef.current) {
            const container = mobileContainerRef.current;
            const activeTabElement = mobileActiveTabRef.current;
            
            const containerRect = container.getBoundingClientRect();
            const tabRect = activeTabElement.getBoundingClientRect();
            
            // Check if tab is outside visible area
            if (tabRect.left < containerRect.left) {
                // Tab is to the left, scroll it into view
                activeTabElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
            } else if (tabRect.right > containerRect.right) {
                // Tab is to the right, scroll it into view
                activeTabElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'end' });
            }
        }
    }, [activeTab, isMobile]);
    const getTabColorClasses = (color, isActive) => {
        const colors = {
            blue: {
                active: 'bg-blue-100 text-blue-800 border-2 border-blue-300 shadow-sm dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-700/60 dark:shadow-blue-900/20',
                inactive: 'text-blue-600 hover:bg-blue-50 hover:border-blue-200 border-2 border-transparent hover:text-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/20 dark:hover:border-blue-700/40',
                badge: 'bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100',
                badgeActive: 'bg-blue-300 text-blue-900 dark:bg-blue-700 dark:text-blue-100'
            },
            indigo: {
                active: 'bg-indigo-100 text-indigo-800 border-2 border-indigo-300 shadow-sm dark:bg-indigo-900/30 dark:text-indigo-200 dark:border-indigo-700/60 dark:shadow-indigo-900/20',
                inactive: 'text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 border-2 border-transparent hover:text-indigo-700 dark:text-indigo-300 dark:hover:bg-indigo-900/20 dark:hover:border-indigo-700/40',
                badge: 'bg-indigo-200 text-indigo-900 dark:bg-indigo-800 dark:text-indigo-100',
                badgeActive: 'bg-indigo-300 text-indigo-900 dark:bg-indigo-700 dark:text-indigo-100'
            },
            amber: {
                active: 'bg-amber-100 text-amber-800 border-2 border-amber-300 shadow-sm dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-700/60 dark:shadow-amber-900/20',
                inactive: 'text-amber-600 hover:bg-amber-50 hover:border-amber-200 border-2 border-transparent hover:text-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/20 dark:hover:border-amber-700/40',
                badge: 'bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100',
                badgeActive: 'bg-amber-300 text-amber-900 dark:bg-amber-700 dark:text-amber-100'
            },
            green: {
                active: 'bg-green-100 text-green-800 border-2 border-green-300 shadow-sm dark:bg-green-900/30 dark:text-green-200 dark:border-green-700/60 dark:shadow-green-900/20',
                inactive: 'text-green-600 hover:bg-green-50 hover:border-green-200 border-2 border-transparent hover:text-green-700 dark:text-green-300 dark:hover:bg-green-900/20 dark:hover:border-green-700/40',
                badge: 'bg-green-200 text-green-900 dark:bg-green-800 dark:text-green-100',
                badgeActive: 'bg-green-300 text-green-900 dark:bg-green-700 dark:text-green-100'
            },
            red: {
                active: 'bg-red-100 text-red-800 border-2 border-red-300 shadow-sm dark:bg-red-900/30 dark:text-red-200 dark:border-red-700/60 dark:shadow-red-900/20',
                inactive: 'text-red-600 hover:bg-red-50 hover:border-red-200 border-2 border-transparent hover:text-red-700 dark:text-red-300 dark:hover:bg-red-900/20 dark:hover:border-red-700/40',
                badge: 'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100',
                badgeActive: 'bg-red-300 text-red-900 dark:bg-red-700 dark:text-red-100'
            },
            purple: {
                active: 'bg-purple-100 text-purple-800 border-2 border-purple-300 shadow-sm dark:bg-purple-900/30 dark:text-purple-200 dark:border-purple-700/60 dark:shadow-purple-900/20',
                inactive: 'text-purple-600 hover:bg-purple-50 hover:border-purple-200 border-2 border-transparent hover:text-purple-700 dark:text-purple-300 dark:hover:bg-purple-900/20 dark:hover:border-purple-700/40',
                badge: 'bg-purple-200 text-purple-900 dark:bg-purple-800 dark:text-purple-100',
                badgeActive: 'bg-purple-300 text-purple-900 dark:bg-purple-700 dark:text-purple-100'
            },
            gray: {
                active: 'bg-gray-100 text-gray-800 border-2 border-gray-300 shadow-sm dark:bg-gray-700/60 dark:text-gray-100 dark:border-gray-600 dark:shadow-black/20',
                inactive: 'text-gray-600 hover:bg-gray-50 hover:border-gray-200 border-2 border-transparent hover:text-gray-700 dark:text-gray-300 dark:hover:bg-gray-700/40 dark:hover:border-gray-600',
                badge: 'bg-gray-200 text-gray-900 dark:bg-gray-600 dark:text-gray-100',
                badgeActive: 'bg-gray-300 text-gray-900 dark:bg-gray-500 dark:text-gray-100'
            },
            rose: {
                active: 'bg-rose-100 text-rose-800 border-2 border-rose-300 shadow-sm dark:bg-rose-900/30 dark:text-rose-200 dark:border-rose-700/60 dark:shadow-rose-900/20',
                inactive: 'text-rose-600 hover:bg-rose-50 hover:border-rose-200 border-2 border-transparent hover:text-rose-700 dark:text-rose-300 dark:hover:bg-rose-900/20 dark:hover:border-rose-700/40',
                badge: 'bg-rose-200 text-rose-900 dark:bg-rose-800 dark:text-rose-100',
                badgeActive: 'bg-rose-300 text-rose-900 dark:bg-rose-700 dark:text-rose-100'
            }
        };
        return colors[color] || colors.blue;
    };

    const isGlass = variant === 'glass';
    const glassContainer = 'p-1';
    const glassTabBase = 'rounded-xl px-3 lg:px-4 py-2 lg:py-2.5 text-sm font-medium transition-all duration-200 font-cairo min-h-[44px] touch-manipulation active:scale-95 flex-shrink-0 snap-start whitespace-nowrap';
    const glassTabInactive = 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700';
    const glassBadgeActive = 'bg-white/20';
    const glassBadgeInactive = 'bg-gray-100 dark:bg-gray-700/80 text-gray-600 dark:text-gray-300';
    // Genome-aligned active fill per tab color (hub-design §3 + call-center semantics)
    const getGlassTabActive = (color) => {
        const map = {
            blue: 'bg-brand-blue-600 text-white shadow-sm',
            amber: 'bg-accent-amber-500 text-white shadow-sm',
            green: 'bg-accent-green-500 text-white shadow-sm',
            red: 'bg-brand-red-600 text-white shadow-sm',
            purple: 'bg-accent-purple-500 text-white shadow-sm',
            indigo: 'bg-indigo-600 text-white shadow-sm',
            gray: 'bg-gray-600 text-white shadow-sm',
            rose: 'bg-rose-600 text-white shadow-sm'
        };
        return map[color] || map.blue;
    };

    if (isMobile) {
        return (
            <div className={`w-full px-2 sm:px-3 py-2 sm:py-2.5 overflow-y-visible ${className}`}>
                <div
                    ref={mobileContainerRef}
                    className={`flex space-x-1.5 sm:space-x-1 space-x-reverse overflow-x-auto overflow-y-visible scrollbar-hide snap-x snap-mandatory scroll-smooth pb-0.5 -mb-0.5 ${isGlass ? glassContainer : ''}`}
                     style={{
                         scrollbarWidth: 'none', /* Firefox */
                         msOverflowStyle: 'none', /* IE and Edge */
                         WebkitOverflowScrolling: 'touch' /* iOS smooth scrolling */
                     }}>
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        const hasBadge = tab.badge != null && tab.badge !== '0' && tab.badge !== 'undefined' && tab.badge !== 'null';
                        const colorClasses = getTabColorClasses(tab.color, isActive);

                        return (
                            <button
                                key={tab.id}
                                ref={isActive ? mobileActiveTabRef : undefined}
                                onClick={() => {
                                    if (activeTab !== tab.id) {
                                        onTabChange(tab.id);
                                    }
                                }}
                                className={`relative overflow-visible flex items-center justify-center gap-2
                  ${hasBadge ? 'flex-none' : 'flex-1 min-w-0'}
                  ${isGlass ? `${glassTabBase} ${isActive ? getGlassTabActive(tab.color || 'blue') : glassTabInactive}` : `px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 font-cairo whitespace-nowrap min-h-[44px] touch-manipulation active:scale-95 flex-shrink-0 snap-start ${isActive ? colorClasses.active : colorClasses.inactive}`}
                  ${isLoading && activeTab === tab.id ? 'opacity-70' : ''}
                `}
                                disabled={isLoading && activeTab === tab.id}
                                aria-selected={isActive}
                                role="tab"
                            >
                                {/* Custom indicators - dots on top corners */}
                                {tab.indicators && tab.indicators.map((indicator, idx) => (
                                    <span
                                        key={idx}
                                        className={`absolute ${indicator.position === 'right' ? '-top-0.5 -right-0.5' : '-top-0.5 -left-0.5'} w-2.5 h-2.5 ${indicator.color || 'bg-red-500'} rounded-full border-2 border-white dark:border-gray-800 shadow-sm ${indicator.animate ? 'animate-pulse' : ''} z-10`}
                                        title={indicator.title || ''}
                                    />
                                ))}

                                <span className="truncate flex-shrink-0">{tab.label}</span>
                                {hasBadge && (
                                    <span className={`
                    px-2 py-0.5 rounded-full text-xs font-bold min-w-[1.5rem] h-5 flex items-center justify-center transition-colors font-cairo flex-shrink-0
                    ${isGlass ? (isActive ? glassBadgeActive : glassBadgeInactive) : (isActive ? colorClasses.badgeActive : colorClasses.badge)}
                  `}>
                                        {tab.badge}
                                    </span>
                                )}
                                {isLoading && activeTab === tab.id && (
                                    <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    }

    const desktopContainerClass = isGlass
        ? `flex-1 min-w-0 flex justify-center space-x-2 space-x-reverse overflow-x-auto overflow-y-visible scrollbar-hide snap-x snap-mandatory scroll-smooth px-2 ${glassContainer}`
        : 'flex-1 min-w-0 flex justify-center space-x-2 space-x-reverse overflow-x-auto overflow-y-visible scrollbar-hide px-2 snap-x snap-mandatory scroll-smooth';

    return (
        <div
            ref={containerRef}
            className={`${desktopContainerClass} ${className}`}
            style={{
                scrollbarWidth: 'none', /* Firefox */
                msOverflowStyle: 'none', /* IE and Edge */
                WebkitOverflowScrolling: 'touch' /* iOS smooth scrolling */
            }}>
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const hasBadge = tab.badge != null && tab.badge !== '0' && tab.badge !== 'undefined' && tab.badge !== 'null';
                const colorClasses = getTabColorClasses(tab.color, isActive);

                return (
                    <button
                        key={tab.id}
                        ref={isActive ? activeTabRef : undefined}
                        onClick={() => {
                            if (activeTab !== tab.id) {
                                onTabChange(tab.id);
                            }
                        }}
                        className={`relative overflow-visible flex items-center gap-2
              ${isGlass ? `${glassTabBase} ${isActive ? getGlassTabActive(tab.color || 'blue') : glassTabInactive}` : `px-3 lg:px-4 py-2 lg:py-2.5 rounded-xl text-sm font-medium transition-all duration-200 font-cairo min-h-[44px] touch-manipulation active:scale-95 flex-shrink-0 snap-start whitespace-nowrap ${isActive ? colorClasses.active : colorClasses.inactive}`}
              ${isLoading && activeTab === tab.id ? 'opacity-70' : ''}
            `}
                        disabled={isLoading && activeTab === tab.id}
                        aria-selected={isActive}
                        role="tab"
                    >
                        {/* Custom indicators - dots on top corners */}
                        {tab.indicators && tab.indicators.map((indicator, idx) => (
                            <span
                                key={idx}
                                className={`absolute ${indicator.position === 'right' ? '-top-0.5 -right-0.5' : '-top-0.5 -left-0.5'} w-2.5 h-2.5 ${indicator.color || 'bg-red-500'} rounded-full border-2 border-white dark:border-gray-800 shadow-sm ${indicator.animate ? 'animate-pulse' : ''} z-10`}
                                title={indicator.title || ''}
                            />
                        ))}

                        <span className="flex-shrink-0">{tab.label}</span>
                        {hasBadge && (
                            <span className={`
                px-2 py-0.5 rounded-full text-xs font-bold min-w-[1.5rem] h-5 flex items-center justify-center transition-colors font-cairo flex-shrink-0
                ${isGlass ? (isActive ? glassBadgeActive : glassBadgeInactive) : (isActive ? colorClasses.badgeActive : colorClasses.badge)}
              `}>
                                {tab.badge}
                            </span>
                        )}
                        {isLoading && activeTab === tab.id && (
                            <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                        )}
                    </button>
                );
            })}
        </div>
    );
};

export default TabNavigation;
