import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useTheme } from '../ui/ThemeProvider';
import Sidebar from './Sidebar';
import Header from './Header';
import { cn } from '../../utils/tailwind';

/**
 * Main layout component that combines sidebar, header, and main content
 * Enhanced with dynamic title handling and FAB support
 */
const Layout = ({ 
  title, 
  subtitle,
  breadcrumbs = [], 
  headerActions = null,
  floatingAction = null,
  maxWidth = 'max-w-8xl', 
  padding = 'px-6 sm:px-6 lg:px-4 lg:py-2',
  className = '',
  contentClassName = '',
}) => {
  const { direction } = useTheme();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [pageTitle, setPageTitle] = useState(title);
  const [pageSubtitle, setPageSubtitle] = useState(subtitle);
  
  // Update page title and subtitle based on route
  useEffect(() => {
    // Map routes to their titles and subtitles
    const routeData = {
      '/': {
        title: 'لوحة التحكم',
        subtitle: 'نظرة عامة على النظام والإحصائيات الرئيسية'
      },
      '/customers': {
        title: 'العملاء',
        subtitle: 'إدارة قاعدة بيانات العملاء والتحليلات المتقدمة'
      },
      '/orders': {
        title: 'إدارة الطلبات',
        subtitle: 'متابعة ومعالجة جميع الطلبات والدورات'
      },
      '/orders/analytics': {
        title: 'تحليلات الطلبات',
        subtitle: 'تقارير وإحصائيات مفصلة عن أداء الطلبات'
      },
      '/customer-service': {
        title: 'مركز الخدمة',
        subtitle: 'إدارة طلبات الخدمة والمتابعة مع العملاء'
      },
      '/customer-service/requests': {
        title: 'طلبات الخدمة',
        subtitle: 'عرض وإدارة جميع طلبات خدمة العملاء'
      },
      '/customer-service/requests/new': {
        title: 'طلب خدمة جديد',
        subtitle: 'إنشاء طلب خدمة جديد للعميل'
      },
      '/call-center': {
        title: 'مركز الاتصال',
        subtitle: 'إدارة المكالمات والتفاعلات مع العملاء'
      },
      '/analytics': {
        title: 'التقارير والتحليلات',
        subtitle: 'تقارير شاملة وتحليلات متقدمة للنظام'
      },
      '/hub-scanning': {
        title: 'عمليات المسح في المركز',
        subtitle: 'نظام المسح والفحص المباشر للعائدات والخدمات'
      },
      '/service-actions': {
        title: 'إجراءات الخدمة',
        subtitle: 'إدارة ومتابعة جميع إجراءات الخدمة'
      },
      '/service-management': {
        title: 'إدارة الخدمات',
        subtitle: 'إدارة دورة حياة الخدمات والعمليات'
      },
      '/maintenance': {
        title: 'الصيانة',
        subtitle: 'إدارة دورات الصيانة والجودة'
      },
      '/products': {
        title: 'المنتجات',
        subtitle: 'إدارة المنتجات والفئات والمخزون'
      },
      '/stock': {
        title: 'المخزون',
        subtitle: 'لوحة تحكم شاملة لإدارة المخزون'
      },
      '/stock/products': {
        title: 'إدارة المخزون والمنتجات',
        subtitle: 'مركز إدارة المنتجات، المخزون، والتحليلات المتكامل'
      },
      '/stock/analytics': {
        title: 'تحليلات المخزون',
        subtitle: 'تقارير وإحصائيات مفصلة عن المخزون'
      },
      '/stock/movements': {
        title: 'حركات المخزون',
        subtitle: 'تتبع جميع حركات المخزون والمنتجات'
      }
    };
    
    // Find the matching route or use defaults
    const routeInfo = routeData[location.pathname];
    const finalTitle = routeInfo ? routeInfo.title : (title || 'هفار');
    const finalSubtitle = routeInfo ? routeInfo.subtitle : subtitle;
    
    setPageTitle(finalTitle);
    setPageSubtitle(finalSubtitle);
    
    // Update document title
    document.title = `هفار | ${finalTitle}`;
  }, [location.pathname, title, subtitle]);
  
  return (
    <div className="h-screen flex overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        onCollapsedChange={setIsSidebarCollapsed}
      />
      
      {/* Main content with hidden scrollbar */}
      <div className={cn(
        "flex-1 flex flex-col overflow-hidden",
        "transition-all duration-300 ease-in-out",
        // Dynamic width based on sidebar state
        isSidebarCollapsed ? 'lg:ps-16' : 'lg:ps-64',  // For desktop: account for sidebar width
        className
      )}>
        {/* Header - fixed at top */}
        <Header 
          title={pageTitle}
          subtitle={pageSubtitle}
          breadcrumbs={breadcrumbs}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          actions={headerActions}
        />
        
        {/* Main content area - scrollable with hidden scrollbar */}
        <main className={cn(
          "flex-1 py-6 overflow-auto scrollbar-hide relative",
          padding,
          contentClassName
        )}>
          <div className={cn("mx-auto", maxWidth)}>
            <Outlet />
          </div>
          
          {/* Floating Action Button */}
          {floatingAction}
        </main>
      </div>
      
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
    </div>
  );
};

export default Layout; 