import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useDesignSystem } from '@/design_system/DesignSystemProvider';
import { 
  SparklesIcon, 
  ChevronDownIcon, 
  Bars3Icon, 
  XMarkIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  StarIcon,
  BoltIcon,
  FireIcon,
  CubeIcon,
  HeartIcon,
  MagnifyingGlassIcon,
  PlayIcon,
  ShieldCheckIcon,
  TruckIcon,
  ClockIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

export const Header = () => {
  const { darkMode, dir } = useDesignSystem();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDropdown, setActiveDropdown] = useState(null);
  const searchRef = useRef(null);
  const headerRef = useRef(null);

  // Optimized scroll handler with throttling
  const handleScroll = useCallback(() => {
    const scrolled = window.scrollY > 20;
    if (scrolled !== isScrolled) {
      setIsScrolled(scrolled);
    }
  }, [isScrolled]);

  useEffect(() => {
    const throttledScroll = () => {
      requestAnimationFrame(handleScroll);
    };
    
    window.addEventListener('scroll', throttledScroll, { passive: true });
    return () => window.removeEventListener('scroll', throttledScroll);
  }, [handleScroll]);

  // Memoized navigation items for performance
  const navigationItems = useMemo(() => [
    { 
      id: 'featured', 
      label: 'مميز', 
      icon: SparklesIcon, 
      href: '#featured',
      badge: 'جديد',
      description: 'أفضل المنتجات المميزة'
    },
    { 
      id: 'categories', 
      label: 'أقسام المنتجات', 
      icon: CubeIcon, 
      href: '#categories', 
      hasDropdown: true,
      description: 'تصفح جميع الفئات'
    },
    { 
      id: 'reviews', 
      label: 'مراجعات البلوجرز', 
      icon: StarIcon, 
      href: '#reviews',
      badge: 'موثوق',
      description: 'آراء الخبراء'
    },
    { 
      id: 'support', 
      label: 'الدعم الفني', 
      icon: ShieldCheckIcon, 
      href: '#support',
      description: 'ضمان وصيانة'
    },
    { 
      id: 'contact', 
      label: 'اتصل بنا', 
      icon: PhoneIcon, 
      href: '#contact',
      badge: '24/7',
      description: 'خدمة العملاء'
    }
  ], []);

  // Memoized business categories
  const businessCategories = useMemo(() => [
    { name: 'هاند بلندر', icon: BoltIcon, count: 25, featured: true, color: 'from-orange-500 to-red-500' },
    { name: 'خلاط وعصارة', icon: CubeIcon, count: 18, featured: false, color: 'from-green-500 to-emerald-500' },
    { name: 'مكواه', icon: FireIcon, count: 15, featured: true, color: 'from-purple-500 to-pink-500' },
    { name: 'مكنسة كهربائية', icon: SparklesIcon, count: 22, featured: false, color: 'from-indigo-500 to-purple-500' },
    { name: 'قلاية كهربائية', icon: FireIcon, count: 8, featured: true, color: 'from-yellow-500 to-orange-500' },
    { name: 'عجان', icon: CubeIcon, count: 6, featured: false, color: 'from-teal-500 to-green-500' },
    { name: 'فرن', icon: FireIcon, count: 14, featured: true, color: 'from-red-600 to-red-700' },
    { name: 'مطحنة', icon: BoltIcon, count: 10, featured: false, color: 'from-gray-500 to-gray-600' }
  ], []);

  // Memoized hero features
  const heroFeatures = useMemo(() => [
    {
      icon: TruckIcon,
      title: 'شحن مجاني',
      description: 'على جميع الطلبات',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: ShieldCheckIcon,
      title: 'ضمان شامل',
      description: 'لمدة عامين',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: ClockIcon,
      title: 'توصيل سريع',
      description: 'خلال 24 ساعة',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: CurrencyDollarIcon,
      title: 'أفضل الأسعار',
      description: 'ضمان الجودة',
      color: 'from-yellow-500 to-orange-500'
    }
  ], []);

  // Optimized dropdown handlers
  const handleDropdownToggle = useCallback((id) => {
    setActiveDropdown(activeDropdown === id ? null : id);
  }, [activeDropdown]);

  const handleDropdownClose = useCallback(() => {
    setActiveDropdown(null);
  }, []);

  // Keyboard navigation support
  const handleKeyDown = useCallback((event, action) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
    }
  }, []);

  return (
    <>
      {/* Performance-Optimized Creative Header */}
      <header 
        ref={headerRef}
        className={`
          sticky top-0 z-50 transition-all duration-300 ease-out
        ${isScrolled 
            ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-lg border-b border-gray-200/30 dark:border-gray-700/30' 
            : 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-b border-gray-100/50 dark:border-gray-800/50'
        }
        `}
        role="banner"
        aria-label="رأس الصفحة الرئيسية"
        dir={dir}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            
            {/* HVAR Logo Section */}
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="hvar-logo hvar-logo-interactive group">
                <div className="hvar-logo-diamond"></div>
                <div className="hvar-logo-text">
                  <span className="hvar-logo-text-var">VAR</span>
                  <span className="hvar-logo-trademark">®</span>
                </div>
              </div>
              
              {/* Brand Text for Mobile */}
              <div className="sm:hidden">
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                  هفار
                </h1>
              </div>
            </div>

            {/* Mobile Business Value */}
            <div className="flex-1 mx-4 lg:hidden">
              <div className="text-center">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  أفضل الأجهزة المنزلية
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  بأسعار لا تقبل المنافسة
                </div>
              </div>
            </div>

            {/* Compact Search Bar */}
            <div className="hidden lg:flex items-center flex-1 max-w-sm mx-6">
              <div className="relative w-full group">
                <div className={`
                  relative flex items-center w-full transition-all duration-300 ease-out
                  ${isSearchExpanded ? 'scale-105' : 'scale-100'}
                `}>
                  <input
                    ref={searchRef}
                    type="search"
                    placeholder="ابحث عن المنتجات..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full py-2 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all duration-300 ${dir === 'rtl' ? 'pl-4 pr-10' : 'pl-10 pr-4'}`}
                    onFocus={() => setIsSearchExpanded(true)}
                    onBlur={() => setIsSearchExpanded(false)}
                    aria-label="البحث عن المنتجات"
                  />
                  <MagnifyingGlassIcon className={`absolute w-4 h-4 text-gray-400 group-hover:text-red-500 transition-colors duration-300 ${dir === 'rtl' ? 'right-3' : 'left-3'}`} aria-hidden="true" />
                </div>
              </div>
            </div>

            {/* Compact Desktop Navigation */}
            <nav className="hidden xl:flex items-center space-x-4 rtl:space-x-reverse" role="navigation" aria-label="القائمة الرئيسية">
              {navigationItems.map((item, index) => (
                <div key={item.id} className="relative group">
                  {item.hasDropdown ? (
                    <button 
                      className="flex items-center space-x-2 rtl:space-x-reverse text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-all duration-300 font-medium group-hover:scale-105 relative focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-lg px-2 py-1"
                      onClick={() => handleDropdownToggle(item.id)}
                      onKeyDown={(e) => handleKeyDown(e, () => handleDropdownToggle(item.id))}
                      aria-expanded={activeDropdown === item.id}
                      aria-haspopup="true"
                      aria-label={`${item.label} - ${item.description}`}
                    >
                      <item.icon className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" aria-hidden="true" />
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="px-1.5 py-0.5 text-xs bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full font-bold">
                          {item.badge}
                        </span>
                      )}
                      <ChevronDownIcon className="w-3 h-3 group-hover:rotate-180 transition-transform duration-300" aria-hidden="true" />
                    </button>
                  ) : (
                    <a 
                      href={item.href}
                      className="flex items-center space-x-2 rtl:space-x-reverse text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-all duration-300 font-medium group-hover:scale-105 relative focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-lg px-2 py-1"
                      aria-label={`${item.label} - ${item.description}`}
                    >
                      <item.icon className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" aria-hidden="true" />
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="px-1.5 py-0.5 text-xs bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full font-bold">
                          {item.badge}
                        </span>
                      )}
                    </a>
                  )}
                  
                  {/* Compact Underline Effect */}
                  <div className={`absolute -bottom-1 h-0.5 bg-gradient-to-r from-red-500 via-red-600 to-red-700 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-full ${dir === 'rtl' ? 'right-0 left-0 origin-right' : 'left-0 right-0 origin-left'}`}></div>
                  
                  {/* Compact Categories Dropdown */}
                  {item.hasDropdown && activeDropdown === item.id && (
                    <div 
                      className={`absolute top-full mt-2 w-80 bg-white/95 dark:bg-gray-800/95 border border-gray-200/50 dark:border-gray-700/50 rounded-2xl shadow-xl backdrop-blur-xl z-50 ${dir === 'rtl' ? 'right-0' : 'left-0'}`}
                      role="menu"
                      aria-label="أقسام المنتجات"
                    >
                      <div className="p-4">
                        <div className="mb-3">
                          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">أقسام المنتجات</h3>
                          <p className="text-xs text-gray-600 dark:text-gray-400">اختر الفئة المناسبة لتصفح المنتجات</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {businessCategories.map((category, idx) => (
                            <a
                              key={idx}
                              href={`#${category.name}`}
                              className="group/cat flex items-center space-x-2 rtl:space-x-reverse p-3 rounded-xl hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                              role="menuitem"
                              aria-label={`${category.name} - ${category.count} منتج`}
                            >
                              <div className={`w-8 h-8 bg-gradient-to-br ${category.color} rounded-lg flex items-center justify-center shadow-md`}>
                                <category.icon className="w-4 h-4 text-white" aria-hidden="true" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-bold text-gray-900 dark:text-white group-hover/cat:text-red-600 dark:group-hover/cat:text-red-400 truncate">{category.name}</span>
                                  {category.featured && (
                                    <span className="px-1.5 py-0.5 text-xs bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 rounded-full font-bold flex-shrink-0">
                                      مميز
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center mt-1">
                                  <CubeIcon className={`w-2.5 h-2.5 text-gray-500 ${dir === 'rtl' ? 'ml-1' : 'mr-1'}`} aria-hidden="true" />
                                  <span className="text-xs text-gray-500 dark:text-gray-400">{category.count} منتج</span>
                                </div>
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* Compact Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="xl:hidden p-2 rounded-xl text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 dark:hover:from-gray-800 dark:hover:to-gray-700 transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              aria-label={isMobileMenuOpen ? "إغلاق القائمة" : "فتح القائمة"}
              aria-expanded={isMobileMenuOpen}
            >
              <div className="relative">
                {isMobileMenuOpen ? (
                  <XMarkIcon className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" aria-hidden="true" />
                ) : (
                  <Bars3Icon className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" aria-hidden="true" />
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Refactored Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="xl:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div className="px-4 py-4 space-y-4">
              {/* Clean Search */}
              <div className="relative">
                <input
                  type="search"
                  placeholder="ابحث عن المنتجات..."
                  className={`w-full py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 ${dir === 'rtl' ? 'pl-4 pr-10' : 'pl-10 pr-4'}`}
                  aria-label="البحث عن المنتجات"
                />
                <MagnifyingGlassIcon className={`absolute top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 ${dir === 'rtl' ? 'right-3' : 'left-3'}`} aria-hidden="true" />
              </div>
              
              {/* Clean Navigation */}
              {navigationItems.map((item) => (
                <div key={item.id}>
                  {item.hasDropdown ? (
                    <div className="space-y-2">
                      <button 
                        className="w-full flex items-center justify-between p-3 rounded-lg text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        onClick={() => handleDropdownToggle(item.id)}
                        onKeyDown={(e) => handleKeyDown(e, () => handleDropdownToggle(item.id))}
                        aria-expanded={activeDropdown === item.id}
                        aria-haspopup="true"
                        aria-label={`${item.label} - ${item.description}`}
                      >
                        <div className="flex items-center space-x-3 rtl:space-x-reverse">
                          <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                            <item.icon className="w-4 h-4 text-white" aria-hidden="true" />
                          </div>
                          <div className={`${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {item.label}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {item.description}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          {item.badge && (
                            <span className="px-2 py-1 text-xs bg-red-500 text-white rounded-full font-medium">
                              {item.badge}
                            </span>
                          )}
                          <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${activeDropdown === item.id ? 'rotate-180' : ''}`} aria-hidden="true" />
                        </div>
                      </button>
                      
                      {/* Clean Dropdown */}
                      {activeDropdown === item.id && (
                        <div className={`space-y-2 ${dir === 'rtl' ? 'mr-4' : 'ml-4'}`}>
                          {businessCategories.map((category, idx) => (
                            <a
                              key={idx}
                              href={`#${category.name}`}
                              className="flex items-center space-x-3 rtl:space-x-reverse p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-red-500 focus:ring-offset-1"
                              aria-label={`${category.name} - ${category.count} منتج`}
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              <div className={`w-6 h-6 bg-gradient-to-br ${category.color} rounded-lg flex items-center justify-center`}>
                                <category.icon className="w-3 h-3 text-white" aria-hidden="true" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {category.name}
                                  </span>
                                  {category.featured && (
                                    <span className="px-1.5 py-0.5 text-xs bg-yellow-400 text-gray-900 rounded-full font-medium">
                                      مميز
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {category.count} منتج
                                </div>
                              </div>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <a 
                      href={item.href} 
                      className="flex items-center justify-between p-3 rounded-lg text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                      aria-label={`${item.label} - ${item.description}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <div className="flex items-center space-x-3 rtl:space-x-reverse">
                        <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                          <item.icon className="w-4 h-4 text-white" aria-hidden="true" />
                        </div>
                        <div className={`${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {item.label}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {item.description}
                          </div>
                        </div>
                      </div>
                      
                      {item.badge && (
                        <span className="px-2 py-1 text-xs bg-red-500 text-white rounded-full font-medium">
                          {item.badge}
                        </span>
                      )}
                    </a>
                  )}
                </div>
              ))}
              
              {/* Simple Contact */}
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="space-y-2">
                  <a 
                    href="tel:01204444196"
                    className="flex items-center justify-center space-x-2 rtl:space-x-reverse p-3 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    aria-label="اتصل بنا على الهاتف"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <PhoneIcon className="w-5 h-5" aria-hidden="true" />
                    <span className="font-medium">اتصل بنا الآن</span>
                  </a>
                  
                  <a 
                    href="mailto:info@hvarstore.com"
                    className="flex items-center justify-center space-x-2 rtl:space-x-reverse p-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    aria-label="أرسل لنا بريد إلكتروني"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <ChatBubbleLeftRightIcon className="w-5 h-5" aria-hidden="true" />
                    <span className="font-medium">راسلنا</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
};
