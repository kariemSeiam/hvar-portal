const TabWithSubTabs = ({
    tabs,
    activeTab,
    onTabChange,
    subTabs = null,
    activeSubTab = null,
    onSubTabChange = null,
    isLoading = false,
    className = ""
}) => {
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
            }
        };
        return colors[color] || colors.blue;
    };

    const getSubTabColorClasses = (isActive) => {
        return {
            active: 'bg-purple-100 text-purple-800 border border-purple-300 dark:bg-purple-900/30 dark:text-purple-200 dark:border-purple-700',
            inactive: 'text-purple-700 hover:bg-purple-50 border border-transparent hover:border-purple-200 dark:text-purple-300 dark:hover:bg-purple-900/20'
        };
    };

    return (
        <div className={`flex-1 flex flex-col justify-center space-y-2.5 sm:space-y-3 ${className}`}>
            {/* Main Tabs */}
            <div className="flex justify-center space-x-1.5 sm:space-x-2 space-x-reverse overflow-x-auto scrollbar-hide px-2 sm:px-2 snap-x snap-mandatory scroll-smooth pb-0.5 -mb-0.5">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const hasBadge = tab.badge && tab.badge !== '0' && tab.badge !== 'undefined' && tab.badge !== 'null';
                    const colorClasses = getTabColorClasses(tab.color, isActive);

                    return (
                        <button
                            key={tab.id}
                            onClick={() => {
                                if (activeTab !== tab.id) {
                                    onTabChange(tab.id);
                                }
                            }}
                            className={`
                px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg text-sm sm:text-sm font-medium transition-all duration-200
                flex items-center space-x-1.5 sm:space-x-2 space-x-reverse font-cairo
                min-h-[44px] sm:min-h-[40px]
                touch-manipulation active:scale-95
                flex-shrink-0 snap-start
                whitespace-nowrap
                ${isActive ? colorClasses.active : colorClasses.inactive}
                ${isLoading && activeTab === tab.id ? 'opacity-70' : ''}
              `}
                            disabled={isLoading && activeTab === tab.id}
                            aria-selected={isActive}
                            role="tab"
                        >
                            <span>{tab.label}</span>
                            {hasBadge && (
                                <span className={`
                  px-2 sm:px-2 py-0.5 sm:py-0.5 rounded-full text-xs sm:text-xs font-bold min-w-[1.25rem] h-5 flex items-center justify-center transition-colors font-cairo flex-shrink-0
                  ${isActive ? colorClasses.badgeActive : colorClasses.badge}
                `}>
                                    {tab.badge}
                                </span>
                            )}
                            {isLoading && activeTab === tab.id && (
                                <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Sub Tabs - Only show when main tab has sub-tabs */}
            {subTabs && activeTab === 'hub' && (
                <div className="flex justify-center space-x-1.5 sm:space-x-2 space-x-reverse overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth pb-0.5 -mb-0.5">
                    {subTabs.map((subTab) => {
                        const isActive = activeSubTab === subTab.id;
                        const hasBadge = subTab.badge && subTab.badge !== '0';
                        const colorClasses = getSubTabColorClasses(isActive);

                        return (
                            <button
                                key={subTab.id}
                                onClick={() => onSubTabChange?.(subTab.id)}
                                className={`
                  px-3 sm:px-3 py-2 sm:py-1.5 rounded-full text-sm sm:text-xs font-medium transition-all duration-200
                  flex items-center space-x-1.5 sm:space-x-2 space-x-reverse font-cairo border
                  min-h-[44px] sm:min-h-[36px]
                  touch-manipulation active:scale-95
                  flex-shrink-0 snap-start
                  whitespace-nowrap
                  ${isActive ? colorClasses.active : colorClasses.inactive}
                `}
                                aria-selected={isActive}
                                role="tab"
                            >
                                <span>{subTab.label}</span>
                                {hasBadge && (
                                    <span className="px-2 py-0.5 rounded-full text-xs font-bold min-w-[1.25rem] h-5 flex items-center justify-center bg-purple-200 text-purple-900 dark:bg-purple-800 dark:text-purple-100 flex-shrink-0">
                                        {subTab.badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default TabWithSubTabs;
