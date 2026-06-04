import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { Package, Settings, Grid3X3, Headphones, Zap } from 'lucide-react';
import { isAdminRole } from '../../utils/authRoles';



const GlobalNavigation = () => {
    const { isDark, toggleTheme } = useTheme();
    const { userInfo } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [showDropdown, setShowDropdown] = useState(false);
    const [currentRoute, setCurrentRoute] = useState(location.pathname);

    const venomItem = {
        id: 'users',
        title: 'venom',
        icon: <Zap className="w-4 h-4" />,
        route: '/venom',
        color: 'from-amber-500 to-orange-600',
        accent: 'from-amber-400 to-orange-500',
        selectedBg: 'bg-amber-50 dark:bg-amber-900/20',
        selectedBorder: 'border-amber-200 dark:border-amber-700',
        selectedBar: 'bg-amber-500',
        selectedDotLight: 'bg-amber-400',
        selectedBarGradient: 'bg-gradient-to-b from-amber-400 via-amber-500 to-orange-600',
        selectedRing: 'ring-amber-300 dark:ring-amber-600',
        selectedText: 'text-amber-700 dark:text-amber-300',
        shadowHover: 'hover:shadow-amber-500/25'
    };

    const baseItems = [
        {
            id: 'hub',
            title: 'مخزن هفار',
            icon: <Grid3X3 className="w-4 h-4" />,
            route: '/',
            color: 'from-orange-500 to-orange-600',
            accent: 'from-orange-400 to-orange-500',
            selectedBg: 'bg-orange-50 dark:bg-orange-900/20',
            selectedBorder: 'border-orange-200 dark:border-orange-700',
            selectedBar: 'bg-orange-500',
            selectedDotLight: 'bg-orange-400',
            selectedBarGradient: 'bg-gradient-to-b from-orange-400 via-orange-500 to-orange-600',
            selectedRing: 'ring-orange-300 dark:ring-orange-600',
            selectedText: 'text-orange-700 dark:text-orange-300',
            shadowHover: 'hover:shadow-orange-500/25'
        },
        {
            id: 'stock',
            title: 'المخزون',
            icon: <Package className="w-4 h-4" />,
            route: '/stock',
            color: 'from-blue-500 to-blue-600',
            accent: 'from-blue-400 to-blue-500',
            selectedBg: 'bg-blue-50 dark:bg-blue-900/20',
            selectedBorder: 'border-blue-200 dark:border-blue-700',
            selectedBar: 'bg-blue-500',
            selectedDotLight: 'bg-blue-400',
            selectedBarGradient: 'bg-gradient-to-b from-blue-400 via-blue-500 to-blue-600',
            selectedRing: 'ring-blue-300 dark:ring-blue-600',
            selectedText: 'text-blue-700 dark:text-blue-300',
            shadowHover: 'hover:shadow-blue-500/25'
        },
        {
            id: 'services',
            title: 'الخدمات',
            icon: <Settings className="w-4 h-4" />,
            route: '/services',
            color: 'from-purple-500 to-purple-600',
            accent: 'from-purple-400 to-purple-500',
            selectedBg: 'bg-purple-50 dark:bg-purple-900/20',
            selectedBorder: 'border-purple-200 dark:border-purple-700',
            selectedBar: 'bg-purple-500',
            selectedDotLight: 'bg-purple-400',
            selectedBarGradient: 'bg-gradient-to-b from-purple-400 via-purple-500 to-purple-600',
            selectedRing: 'ring-purple-300 dark:ring-purple-600',
            selectedText: 'text-purple-700 dark:text-purple-300',
            shadowHover: 'hover:shadow-purple-500/25'
        },
        {
            id: 'customer-service',
            title: 'خدمه العملاء',
            icon: <Headphones className="w-4 h-4" />,
            route: '/customer-service',
            color: 'from-teal-500 to-teal-600',
            accent: 'from-teal-400 to-teal-500',
            selectedBg: 'bg-teal-50 dark:bg-teal-900/20',
            selectedBorder: 'border-teal-200 dark:border-teal-700',
            selectedBar: 'bg-teal-500',
            selectedDotLight: 'bg-teal-400',
            selectedBarGradient: 'bg-gradient-to-b from-teal-400 via-teal-500 to-teal-600',
            selectedRing: 'ring-teal-300 dark:ring-teal-600',
            selectedText: 'text-teal-700 dark:text-teal-300',
            shadowHover: 'hover:shadow-teal-500/25',
            badge: 'جديد'
        }
    ];

    const navigationItems = isAdminRole(userInfo?.role)
        ? [venomItem, ...baseItems]
        : baseItems;

    // Set current route on component mount and location change
    useEffect(() => {
        setCurrentRoute(location.pathname);
    }, [location.pathname]);

    const handleNavigation = (route) => {
        setShowDropdown(false);
        navigate(route);
    };

    const selectedItem = navigationItems.find((item) => currentRoute === item.route);
    const menuIcon = (
        <svg className="w-5 h-5 lg:w-4 lg:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
    );

    return (
        <div className="relative">
            {/* Global Navigation Button - shows selected item icon + color, else menu icon + brand-blue */}
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className={`min-h-[44px] lg:min-h-[40px] min-w-[44px] w-11 h-11 lg:min-w-[40px] lg:w-10 lg:h-10 rounded-lg flex items-center justify-center shadow-md transition-all duration-200 hover:shadow-lg active:scale-95 relative group touch-manipulation ${selectedItem
                    ? `bg-gradient-to-br ${selectedItem.color} ${selectedItem.shadowHover || ''}`
                    : 'bg-gradient-to-br from-brand-blue-500 to-brand-blue-600 hover:shadow-brand-blue-500/25'
                    }`}
                aria-label="القائمة الرئيسية"
            >
                <div className="relative">
                    {selectedItem ? (
                        <span className="text-white">{selectedItem.icon}</span>
                    ) : (
                        <>
                            {menuIcon}
                            <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-white/60 rounded-full animate-pulse" />
                            <div className="absolute -bottom-0.5 -left-0.5 w-1 h-1 bg-white/40 rounded-full" />
                        </>
                    )}
                </div>
                {!selectedItem && (
                    <div className="hidden sm:block absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-white/90 dark:bg-gray-800/90 px-2 py-1 rounded-lg text-xs font-bold text-brand-blue-600 dark:text-brand-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                        HVAR
                    </div>
                )}
            </button>

            {/* Creative Navigation Dropdown - Mobile Optimized */}
            {showDropdown && (
                <div
                    className="fixed sm:absolute top-full right-0 sm:mt-2 w-full sm:w-60 md:w-64 bg-white dark:bg-gray-800 rounded-b-xl sm:rounded-xl shadow-2xl border-t sm:border border-gray-200 dark:border-gray-700 overflow-hidden z-[100] max-h-[80vh] overflow-y-auto"
                    onMouseLeave={() => setShowDropdown(false)}
                    style={{
                        top: 'var(--header-height, 64px)',
                        left: 0,
                    }}
                >
                    {/* Navigation Items - Mobile Optimized Touch Targets */}
                    <div className="p-2 sm:p-2.5">
                        {navigationItems.map((item, index) => {
                            const isSelected = currentRoute === item.route;
                            const isLocked = item.locked;
                            return (
                                <div
                                    key={item.id}
                                    onClick={() => !isLocked && handleNavigation(item.route)}
                                    className={`flex items-center space-x-2 space-x-reverse p-3 sm:p-2.5 min-h-[48px] sm:min-h-[44px] rounded-lg transition-all duration-200 group relative overflow-hidden touch-manipulation border ${isLocked
                                        ? 'opacity-60 cursor-not-allowed border-transparent'
                                        : 'hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 cursor-pointer border-transparent'
                                        } ${isSelected ? `${item.selectedBg} ${item.selectedBorder}` : ''
                                        }`}
                                >
                                    {/* Creative Background Effect */}
                                    {!isLocked && (
                                        <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-5 transition-opacity duration-300 from-gray-400 to-transparent" title={item.title}></div>
                                    )}

                                    {isSelected && item.selectedBarGradient && (
                                        <div className={`absolute left-0 top-1/2 transform -translate-y-1/2 w-1.5 h-10 rounded-r-full shadow-sm ${item.selectedBarGradient}`} />
                                    )}

                                    {/* Icon with Creative Accent - Responsive sizing */}
                                    <div className="relative flex-shrink-0">
                                        <div className={`w-10 h-10 sm:w-9 sm:h-9 bg-gradient-to-br ${item.color} rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-200 ${isSelected && item.selectedRing ? `ring-2 ${item.selectedRing} ring-offset-1 dark:ring-offset-gray-800` : ''
                                            }`}>
                                            <div className="text-white">
                                                {item.icon}
                                            </div>
                                        </div>
                                        {/* Accent Ring */}
                                        {!isLocked && (
                                            <div className={`absolute inset-0 rounded-lg bg-gradient-to-br ${item.accent} opacity-0 group-hover:opacity-30 transition-opacity duration-300 blur-sm`}></div>
                                        )}
                                    </div>

                                    {/* Title - Responsive text sizing */}
                                    <div className="flex-1 min-w-0">
                                        <h4 className={`font-medium text-right text-base sm:text-sm transition-colors duration-200 truncate ${isSelected && item.selectedText
                                            ? `${item.selectedText} font-semibold`
                                            : isLocked
                                                ? 'text-gray-500 dark:text-gray-500'
                                                : 'text-gray-900 dark:text-white group-hover:text-gray-700 dark:group-hover:text-gray-200'
                                            }`}>
                                            {item.title}
                                        </h4>
                                    </div>

                                    {/* Badge and Indicator */}
                                    <div className="flex items-center space-x-1 space-x-reverse">
                                        {/* Item badge (e.g. جديد) */}
                                        {item.badge && (
                                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200 font-cairo flex-shrink-0">
                                                {item.badge}
                                            </span>
                                        )}
                                        {/* Creative Indicator */}
                                        {!isLocked && (
                                            <>
                                                <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-200 ${isSelected && item.selectedBar ? item.selectedBar : 'bg-gray-300 dark:bg-gray-600 group-hover:bg-gray-500 dark:group-hover:bg-gray-500'
                                                    }`}></div>
                                                <div className={`w-1 h-1 rounded-full transition-colors duration-200 delay-75 ${isSelected && item.selectedDotLight ? item.selectedDotLight : 'bg-gray-200 dark:bg-gray-700 group-hover:bg-gray-400 dark:group-hover:bg-gray-400'
                                                    }`}></div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Mobile Optimized Theme Toggle */}
                    <div className="border-t border-gray-200 dark:border-gray-700 p-2">
                        <button
                            onClick={toggleTheme}
                            className="w-full flex items-center justify-center space-x-2 space-x-reverse p-3 sm:p-2 min-h-[48px] sm:min-h-[44px] rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 transition-all duration-200 group touch-manipulation"
                            aria-label={isDark ? 'تبديل للوضع الفاتح' : 'تبديل للوضع الداكن'}
                        >
                            {/* Compact Toggle Icon - Responsive sizing */}
                            <div className="relative flex-shrink-0">
                                <div className={`w-9 h-9 sm:w-7 sm:h-7 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110 ${isDark ? 'rotate-12' : ''}`}>
                                    {isDark ? (
                                        <svg className="w-5 h-5 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <circle cx="12" cy="12" r="5" />
                                            <line x1="12" y1="1" x2="12" y2="3" />
                                            <line x1="12" y1="21" x2="12" y2="23" />
                                            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                                            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                                            <line x1="1" y1="12" x2="3" y2="12" />
                                            <line x1="21" y1="12" x2="23" y2="12" />
                                            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                                            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                                        </svg>
                                    )}
                                </div>
                                {/* Creative Theme Indicator */}
                                <div className={`absolute -top-0.5 -right-0.5 w-2 h-2 bg-white rounded-full transition-all duration-300 ${isDark ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}></div>
                            </div>

                            {/* Responsive Text */}
                            <span className="text-sm sm:text-xs font-medium text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors duration-200">
                                {isDark ? 'فاتح' : 'داكن'}
                            </span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GlobalNavigation;
