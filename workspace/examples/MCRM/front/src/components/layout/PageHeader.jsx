import { GlobalNavigation, TabNavigation } from './index';
import UserProfile from '../ui/UserProfile';

const PageHeader = ({
    title,
    tabs,
    activeTab,
    onTabChange,
    isLoading = false,
    rightControls = null,
    tabVariant = 'default', // 'default' | 'glass' — genome §9: CustomerServicePage uses glass
    className = ""
}) => {
    return (
        <div className={`bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors overflow-visible pt-safe ${className}`}>
            {/* Desktop Header */}
            <div className="hidden lg:block px-4 lg:px-6 py-3 lg:py-4 overflow-visible">
                <div className="flex items-center justify-between overflow-visible gap-2 lg:gap-4 ms-2 me-2">
                    {/* Right - Menu with Title (RTL) */}
                    <div className="flex items-center space-x-3 space-x-reverse shrink-0">
                        <GlobalNavigation />
                        <div>
                            <h1 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-gray-100 font-cairo">
                                {title}
                            </h1>
                        </div>
                    </div>

                    {/* Center - Tabs */}
                    {tabs && (
                        <div className="flex-1 min-w-0 overflow-hidden">
                            <TabNavigation
                                tabs={tabs}
                                activeTab={activeTab}
                                onTabChange={onTabChange}
                                isLoading={isLoading}
                                variant={tabVariant}
                            />
                        </div>
                    )}

                    {/* Left - Refresh + Profile (RTL: refresh then profile) */}
                    <div className="flex items-center space-x-3 space-x-reverse shrink-0">
                        {rightControls}
                        <UserProfile />
                    </div>
                </div>
            </div>

            {/* Mobile Header */}
            <div className="lg:hidden">
                {/* Mobile Title Row - Show when no tabs or always show title */}
                <div className="px-4 py-3 flex items-center justify-between space-x-3 space-x-reverse">
                    <div className="flex items-center space-x-3 space-x-reverse">
                        <GlobalNavigation />
                        <div>
                            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 font-cairo">
                                {title}
                            </h1>
                        </div>
                    </div>
                    <UserProfile />
                </div>
                {/* Mobile Tabs Row */}
                {tabs && (
                    <div className="border-t border-gray-200 dark:border-gray-700">
                        <TabNavigation
                            tabs={tabs}
                            activeTab={activeTab}
                            onTabChange={onTabChange}
                            isLoading={isLoading}
                            isMobile={true}
                            variant={tabVariant}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default PageHeader;
