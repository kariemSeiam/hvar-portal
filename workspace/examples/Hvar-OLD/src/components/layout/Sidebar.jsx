import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../ui/ThemeProvider';
import { useOrdersCount, useBusinessCounts } from '../../context/OrdersContext';
import { cn } from '../../utils/tailwind';

// Icons 
import {
  ChevronRight,
  ChevronLeft,
  Users,
  Phone,
  Headphones,
  BarChart2,
  LogOut,
  Sun,
  Moon,
  Home,
  MessageSquare,
  FileText,
  Shield,
  Package,
  UserCheck,
  Clock,
  AlertCircle,
  Plus,
  Search,
  Filter,
  Download,
  Brain,
  ShoppingCart,
  TrendingUp,
  Activity,
  Wrench
} from 'lucide-react';

/**
 * Optimized sidebar with dynamic sizing and theme-consistent styling
 */
const Sidebar = ({ isMobileMenuOpen, setIsMobileMenuOpen, onCollapsedChange }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, direction, toggleTheme } = useTheme();
  const { totalOrders } = useOrdersCount();
  const { businessCounts } = useBusinessCounts();
  const [collapsed, setCollapsed] = useState(true);
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);
  const sidebarRef = useRef(null);
  const headerRef = useRef(null);
  const footerRef = useRef(null);
  const [navHeight, setNavHeight] = useState('auto');
  
  // Format number to K format (e.g., 21.5K)
  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return num.toString();
  };
  
  // Update window height on resize
  useEffect(() => {
    const handleResize = () => {
      setWindowHeight(window.innerHeight);
      
      // Auto-collapse sidebar on smaller screens
      if (window.innerWidth < 1280 && window.innerWidth > 768) {
        setCollapsed(true);
      } else if (window.innerWidth >= 1280) {
        // Keep collapsed by default, user can expand manually
        setCollapsed(true);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Calculate dynamic navigation height
  useEffect(() => {
    if (sidebarRef.current && headerRef.current && footerRef.current) {
      const headerHeight = headerRef.current.offsetHeight;
      const footerHeight = footerRef.current.offsetHeight;
      const availableHeight = windowHeight - headerHeight - footerHeight;
      setNavHeight(`${availableHeight}px`);
    }
  }, [windowHeight, collapsed]);
  
  useEffect(() => {
    if (onCollapsedChange) {
      onCollapsedChange(collapsed);
    }
  }, [collapsed, onCollapsedChange]);
  
  // Navigation items based on project structure
  const navigationItems = [
    {
      category: 'الرئيسية',
      items: [
        { 
          name: 'لوحة التحكم', 
          path: '/', 
          icon: <Home size={collapsed ? 18 : 20} strokeWidth={1.75} />,
          description: 'نظرة عامة على النظام'
        }
      ]
    },
    {
      category: 'إدارة العملاء',
      items: [
        { 
          name: 'العملاء', 
          path: '/customers', 
          icon: <Users size={collapsed ? 18 : 20} strokeWidth={1.75} />,
          description: 'إدارة بيانات العملاء',
          badge: '2.5K'
        },
        { 
          name: 'تحليلات العميل الذكية', 
          path: '/ai-customers/:phone', 
          icon: <Brain size={collapsed ? 18 : 20} strokeWidth={1.75} />,
          description: 'تحليل متقدم للعملاء باستخدام الذكاء الاصطناعي',
          hidden: true // Hidden from navigation, only for active state
        },
        { 
          name: 'تفاصيل العميل', 
          path: '/customers/:phone', 
          icon: <UserCheck size={18} />,
          description: 'معلومات العميل التفصيلية',
          hidden: true // Hidden from navigation, only for active state
        }
      ]
    },
    {
      category: 'إدارة الطلبات',
      items: [
        { 
          name: 'الطلبات', 
          path: '/orders', 
          icon: <Package size={collapsed ? 22 : 20} strokeWidth={1.75} />,
          description: 'إدارة ومتابعة جميع الطلبات',
          badge: totalOrders > 0 ? formatNumber(totalOrders) : '0'
        },
        { 
          name: 'إجراءات الخدمة', 
          path: '/service-actions', 
          icon: <Wrench size={collapsed ? 22 : 20} strokeWidth={1.75} />,
          description: 'إدارة إجراءات الخدمة والصيانة',
          badge: businessCounts.processing > 0 ? formatNumber(businessCounts.processing) : '0'
        },
        { 
          name: 'إدارة الخدمات والمتابعات', 
          path: '/service-management', 
          icon: <MessageSquare size={collapsed ? 22 : 20} strokeWidth={1.75} />,
          description: 'نظام إدارة شامل للخدمات والمتابعات والصيانة',
          badge: 'جديد'
        },
        { 
          name: 'تفاصيل الطلب', 
          path: '/orders/:id', 
          icon: <FileText size={18} />,
          description: 'تفاصيل الطلب',
          hidden: true
        }
      ]
    },
    {
      category: 'إدارة المخزون',
      items: [
        { 
          name: 'لوحة تحكم المخزون', 
          path: '/stock', 
          icon: <Activity size={collapsed ? 22 : 20} strokeWidth={1.75} />,
          description: 'نظرة شاملة على المخزون والأداء'
        },
        { 
          name: 'المنتجات', 
          path: '/stock/products', 
          icon: <Package size={collapsed ? 22 : 20} strokeWidth={1.75} />,
          description: 'إدارة المنتجات والمخزون',
          badge: '156'
        },
        { 
          name: 'حركات المخزون', 
          path: '/stock/movements', 
          icon: <TrendingUp size={collapsed ? 18 : 20} strokeWidth={1.75} />,
          description: 'تتبع حركات المخزون'
        },
        { 
          name: 'تحليلات المخزون', 
          path: '/stock/analytics', 
          icon: <BarChart2 size={collapsed ? 18 : 20} strokeWidth={1.75} />,
          description: 'تحليلات متقدمة للمخزون'
        }
      ]
    },
    {
      category: 'خدمة العملاء',
      items: [
        { 
          name: 'مركز الخدمة', 
          path: '/customer-service', 
          icon: <Phone size={collapsed ? 22 : 20} strokeWidth={1.75} />,
          description: 'إدارة طلبات الخدمة'
        },
        { 
          name: 'طلبات الخدمة', 
          path: '/customer-service/requests', 
          icon: <MessageSquare size={collapsed ? 22 : 20} strokeWidth={1.75} />,
          description: 'عرض وإدارة الطلبات',
          badge: businessCounts.service > 0 ? formatNumber(businessCounts.service) : '0'
        },
        { 
          name: 'طلب جديد', 
          path: '/customer-service/requests/new', 
          icon: <Plus size={18} />,
          description: 'إنشاء طلب خدمة جديد',
          hidden: true
        },
        { 
          name: 'تفاصيل الطلب', 
          path: '/customer-service/requests/:id', 
          icon: <FileText size={18} />,
          description: 'تفاصيل طلب الخدمة',
          hidden: true
        }
      ]
    },
    {
      category: 'مركز الاتصال',
      items: [
        { 
          name: 'مركز الاتصال', 
          path: '/call-center', 
          icon: <Headphones size={collapsed ? 22 : 20} strokeWidth={1.75} />,
          description: 'إدارة المكالمات والرسائل',
          badge: businessCounts.problems > 0 ? formatNumber(businessCounts.problems) : '0'
        }
      ]
    },
    {
      category: 'التقارير والتحليلات',
      items: [
        { 
          name: 'التقارير', 
          path: '/analytics', 
          icon: <BarChart2 size={collapsed ? 22 : 20} strokeWidth={1.75} />,
          description: 'الإحصائيات والتقارير'
        }
      ]
    }
  ];
  
  const toggleCollapsed = () => setCollapsed(!collapsed);
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  useEffect(() => {
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  }, [location.pathname]);

  const isItemActive = (itemPath) => {
    if (itemPath === '/') return location.pathname === '/';
    if (itemPath.includes(':')) {
      const basePath = itemPath.split('/:')[0];
      return location.pathname.startsWith(basePath);
    }
    return location.pathname === itemPath;
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar with dynamic sizing */}
      <aside 
        ref={sidebarRef}
        className={cn(
          "fixed inset-y-0 z-50 flex flex-col",
          "bg-white dark:bg-gray-900",
          "transition-all duration-300 ease-in-out",
          direction === 'rtl' ? 'right-0' : 'left-0',
          // Mobile positioning
          isMobileMenuOpen 
            ? 'translate-x-0 rtl:-translate-x-0' 
            : direction === 'rtl' 
              ? 'translate-x-full' 
              : '-translate-x-full',
          // Desktop visibility
          'lg:translate-x-0 lg:rtl:translate-x-0',
          // Width based on sidebar state
          collapsed ? 'lg:w-20' : 'lg:w-64',
          // Mobile width
          'w-72',
          // Ensure full height
          'h-screen'
        )}
      >
        {/* Header - Restructured with proper flex layout */}
        <div ref={headerRef} className="flex items-center h-16 px-3 relative">
          {/* Logo Section */}
          <div className={cn(
            'flex items-center gap-3',
            collapsed ? 'justify-center w-full' : 'w-full'
          )}>
            <div className="flex items-center justify-center bg-brand-red-600 rounded-lg p-2">
              <Shield size={collapsed ? 24 : 20} strokeWidth={1.75} className="text-white" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-lg text-gray-900 dark:text-white">هفار</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">نظام إدارة العملاء</span>
              </div>
            )}
          </div>
          
          {/* Collapse button - Centered outside sidebar, half overlapping */}
          <button
            onClick={toggleCollapsed}
            className={cn(
              'absolute top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-md',
              'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700',
              'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200',
              'transition-all duration-200 ease-in-out',
              'shadow-sm hover:shadow-md',
              'border border-gray-200 dark:border-gray-700',
              // Position centered on the vertical line where sidebar ends
              direction === 'rtl' ? '-left-3' : '-right-3',
              'lg:flex',
              isMobileMenuOpen && 'hidden'
            )}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed
              ? (direction === 'rtl' ? <ChevronLeft size={14} /> : <ChevronRight size={14} />)
              : (direction === 'rtl' ? <ChevronRight size={14} /> : <ChevronLeft size={14} />)
            }
          </button>
        </div>
        
        {/* Navigation with dynamic height */}
        <nav 
          className="overflow-hidden px-3" 
          style={{ height: navHeight }}
        >
          <div className="h-full overflow-y-auto scrollbar-hide py-4">
            <div className="space-y-4">
              {navigationItems.map((category) => (
                <div key={category.category} className="space-y-2">
                  {/* Category */}
                  {!collapsed && (
                    <div className="px-2">
                      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                        {category.category}
                      </h3>
                    </div>
                  )}
                  
                  {/* Items */}
                  <div className="space-y-1">
                    {category.items.filter(item => !item.hidden).map((item) => {
                      const isActive = isItemActive(item.path);
                      return (
                        <div key={item.name} className={cn(
                          collapsed ? 'flex justify-center' : ''
                        )}>
                          <Link
                            to={item.path}
                            className={cn(
                              'flex items-center transition-colors duration-150 relative no-underline',
                              collapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2',
                              'rounded-lg',
                              isActive
                                ? 'bg-brand-red-50 dark:bg-brand-red-900/20 text-brand-red-700 dark:text-brand-red-300'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800',
                              // Optimized dimensions for collapsed state
                              collapsed ? 'h-14 w-14' : ''
                            )}
                          >
                            {/* Icon with optimized sizing for collapsed state */}
                            <div
                              className={cn(
                                'flex items-center justify-center',
                                isActive
                                  ? 'text-brand-red-600 dark:text-brand-red-400'
                                  : 'text-gray-500 dark:text-gray-400',
                                collapsed ? 'w-10 h-10' : 'w-7 h-7'
                              )}
                            >
                              {item.icon}
                            </div>
                            
                            {/* Text */}
                            {(!collapsed || isMobileMenuOpen) && (
                              <div className="flex-1 flex items-center justify-between">
                                <div>
                                  <div className="font-medium text-sm">
                                    {item.name}
                                  </div>
                                  {!collapsed && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                      {item.description}
                                    </div>
                                  )}
                                </div>
                                
                                {/* Badge */}
                                {item.badge && !collapsed && (
                                  <span className="px-2 py-0.5 text-xs font-bold bg-brand-red-100 dark:bg-brand-red-900/30 text-brand-red-700 dark:text-brand-red-300 rounded-full">
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                            )}
                            
                            {/* Badge for collapsed state */}
                            {item.badge && collapsed && (
                              <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs font-bold bg-brand-red-500 text-white rounded-full min-w-[18px] text-center">
                                {item.badge}
                              </span>
                            )}
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </nav>
        
        {/* Footer with redesigned logout button */}
        <div ref={footerRef} className="p-4">
          <div className={cn(
            "flex items-center gap-2", 
            collapsed ? "flex-col" : "justify-between"
          )}>
            {/* Theme Toggle - Theme consistent styling */}
            <button
              onClick={toggleTheme}
              className={cn(
                "transition-colors duration-150 flex items-center justify-center",
                "bg-gray-100 dark:bg-gray-800",
                "text-gray-600 dark:text-gray-400",
                collapsed ? "w-14 h-14 rounded-lg" : "px-3 py-2 rounded-lg"
              )}
              aria-label={theme === 'dark' ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === 'dark' ? <Sun size={collapsed ? 24 : 18} strokeWidth={1.75} /> : <Moon size={collapsed ? 24 : 18} strokeWidth={1.75} />}
            </button>
            
            {/* Redesigned Logout Button - Expanded state */}
            {!collapsed && (
              <button
                onClick={handleLogout}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg",
                  "bg-gray-100 dark:bg-gray-800",
                  "text-gray-700 dark:text-gray-300",
                  "transition-colors duration-150"
                )}
                aria-label="Log out"
              >
                <LogOut size={18} strokeWidth={1.75} />
                <span className="text-sm font-medium">تسجيل الخروج</span>
              </button>
            )}
            
            {/* Logout - Theme consistent styling for collapsed state */}
            {collapsed && (
              <button
                onClick={handleLogout}
                className={cn(
                  "w-14 h-14 rounded-lg flex items-center justify-center",
                  "bg-gray-100 dark:bg-gray-800",
                  "text-gray-700 dark:text-gray-300",
                  "transition-colors duration-150"
                )}
                aria-label="Log out"
              >
                <LogOut size={24} strokeWidth={1.75} />
              </button>
            )}
          </div>
        </div>
      </aside>
      
      {/* CSS for hiding scrollbars */}
      <style>{`
        .scrollbar-hide {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;  /* Chrome, Safari and Opera */
        }
      `}</style>
    </>
  );
};

export default Sidebar; 