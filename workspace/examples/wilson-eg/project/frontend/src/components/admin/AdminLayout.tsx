import { useState, useEffect, ReactNode } from 'react'
import { Link, useLocation, Outlet, Navigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Users,
  Ticket,
  Image,
  Settings,
  Menu,
  X,
  Sun,
  Moon,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { useAdminOrders } from '@/hooks/useAdmin'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/Tooltip'

interface NavItem {
  path: string
  labelKey: string
  labelAr: string
  labelEn: string
  icon: ReactNode
}

const navItems: NavItem[] = [
  {
    path: '/admin',
    labelKey: 'admin.nav.dashboard',
    labelAr: 'لوحة التحكم',
    labelEn: 'Dashboard',
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    path: '/admin/products',
    labelKey: 'admin.nav.products',
    labelAr: 'المنتجات',
    labelEn: 'Products',
    icon: <Package className="h-5 w-5" />,
  },
  {
    path: '/admin/categories',
    labelKey: 'admin.nav.categories',
    labelAr: 'الفئات',
    labelEn: 'Categories',
    icon: <FolderTree className="h-5 w-5" />,
  },
  {
    path: '/admin/orders',
    labelKey: 'admin.nav.orders',
    labelAr: 'الطلبات',
    labelEn: 'Orders',
    icon: <ShoppingCart className="h-5 w-5" />,
  },
  {
    path: '/admin/customers',
    labelKey: 'admin.nav.customers',
    labelAr: 'العملاء',
    labelEn: 'Customers',
    icon: <Users className="h-5 w-5" />,
  },
  {
    path: '/admin/coupons',
    labelKey: 'admin.nav.coupons',
    labelAr: 'الكوبونات',
    labelEn: 'Coupons',
    icon: <Ticket className="h-5 w-5" />,
  },
  {
    path: '/admin/slides',
    labelKey: 'admin.nav.slides',
    labelAr: 'الشرائح',
    labelEn: 'Slides',
    icon: <Image className="h-5 w-5" />,
  },
  {
    path: '/admin/settings',
    labelKey: 'admin.nav.settings',
    labelAr: 'الإعدادات',
    labelEn: 'Settings',
    icon: <Settings className="h-5 w-5" />,
  },
]

const STORAGE_KEY = 'wilson-admin-sidebar-collapsed'

const AdminLayout = () => {
  const { language, isRTL } = useLanguage()
  const { theme, toggleTheme } = useTheme()
  const { logout, isAuthenticated, isAdmin } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  const { data: pendingOrdersData } = useAdminOrders({ status: 'pending', perPage: '1' })
  const pendingOrdersCount = pendingOrdersData?.total ?? 0

  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true'
    } catch {
      return false
    }
  })
  const location = useLocation()

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(isCollapsed))
    } catch {
      /* ignore */
    }
  }, [isCollapsed])

  const toggleCollapse = () => setIsCollapsed((v) => !v)

  const getNavItemLabel = (item: NavItem) => {
    return language === 'ar' ? item.labelAr : item.labelEn
  }

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin'
    }
    return location.pathname.startsWith(path)
  }

  const handleLogout = () => {
    logout()
  }

  const closeSidebar = () => {
    setIsSidebarOpen(false)
  }

  return (
    <div
      className={cn('min-h-screen bg-background', isRTL ? 'font-cairo' : 'font-tajawal')}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-40 h-16 border-b border-border bg-background/95 backdrop-blur flex items-center justify-between px-4">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 rounded-md hover:bg-gold-100 dark:hover:bg-gold-900/20 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6 text-foreground" />
        </button>

        <Link to="/admin" className="flex items-center gap-2">
          <span className="text-xl font-bold text-gold-500">WILSON</span>
          <span className="text-xs text-muted-foreground">
            {language === 'ar' ? 'إدارة' : 'Admin'}
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md hover:bg-gold-100 dark:hover:bg-gold-900/20 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5 text-foreground" />
            ) : (
              <Moon className="h-5 w-5 text-foreground" />
            )}
          </button>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar — collapsible on desktop (lg+), overlay on mobile; collapsed = 4rem */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 z-50 start-0 border-e border-border bg-background transition-[width,transform] duration-300 ease-in-out',
          'w-64 min-w-64',
          'lg:translate-x-0',
          isCollapsed ? 'lg:w-16 lg:min-w-16' : 'lg:w-64 lg:min-w-64',
          !isSidebarOpen && (isRTL ? 'translate-x-full' : '-translate-x-full')
        )}
      >
        <div className="flex flex-col h-full w-full min-w-0">
          {/* Sidebar Header — when collapsed (lg): logo above toggle; when expanded / mobile: logo | toggle row */}
          <div
            className={cn(
              'h-16 shrink-0 border-b border-border transition-all duration-300 flex items-center justify-between px-4',
              isCollapsed && 'lg:flex-col lg:h-auto lg:py-3 lg:gap-2 lg:px-0 lg:justify-center'
            )}
          >
            <Link
              to="/admin"
              className={cn(
                'flex items-center gap-2 min-w-0',
                isCollapsed && 'lg:justify-center'
              )}
              onClick={closeSidebar}
            >
              <span
                className={cn(
                  'font-bold text-gold-500 shrink-0',
                  isCollapsed ? 'hidden lg:inline text-2xl' : 'hidden'
                )}
                title="Wilson Admin"
              >
                W
              </span>
              <span
                className={cn(
                  'text-xl font-bold text-gold-500 shrink-0',
                  isCollapsed && 'lg:hidden'
                )}
              >
                WILSON
              </span>
              <span
                className={cn(
                  'text-xs text-muted-foreground whitespace-nowrap overflow-hidden transition-all duration-300',
                  isCollapsed && 'lg:w-0 lg:opacity-0 lg:overflow-hidden lg:max-w-0'
                )}
              >
                {language === 'ar' ? 'إدارة' : 'Admin'}
              </span>
            </Link>
            <div className={cn('flex items-center gap-1 shrink-0', isCollapsed && 'lg:w-full lg:justify-center')}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={toggleCollapse}
                    className={cn(
                      'hidden lg:flex items-center justify-center w-9 h-9 rounded-lg text-foreground transition-colors min-w-9 min-h-9',
                      'hover:bg-gold-100 dark:hover:bg-gold-900/20'
                    )}
                    aria-label={isCollapsed
                      ? (language === 'ar' ? 'توسيع القائمة' : 'Expand sidebar')
                      : (language === 'ar' ? 'طي القائمة' : 'Collapse sidebar')
                    }
                  >
                    {isRTL
                      ? isCollapsed
                        ? <PanelRightOpen className="h-4 w-4" />
                        : <PanelRightClose className="h-4 w-4" />
                      : isCollapsed
                        ? <PanelLeftOpen className="h-4 w-4" />
                        : <PanelLeftClose className="h-4 w-4" />
                    }
                  </button>
                </TooltipTrigger>
                <TooltipContent side={isRTL ? 'left' : 'right'}>
                  {isCollapsed
                    ? (language === 'ar' ? 'توسيع القائمة' : 'Expand sidebar')
                    : (language === 'ar' ? 'طي القائمة' : 'Collapse sidebar')
                  }
                </TooltipContent>
              </Tooltip>
              <button
                onClick={closeSidebar}
                className="lg:hidden p-2 rounded-md hover:bg-gold-100 dark:hover:bg-gold-900/20 transition-colors"
                aria-label="Close menu"
              >
                <X className="h-5 w-5 text-foreground" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav
            className={cn(
              'flex-1 overflow-y-auto overflow-x-hidden',
              isCollapsed ? 'p-2 lg:px-2' : 'p-4'
            )}
          >
            <ul className="space-y-1">
              {navItems.map((item) => {
                const label = getNavItemLabel(item)
                const linkContent = (
                  <Link
                    to={item.path}
                    onClick={closeSidebar}
                    className={cn(
                      'flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200 min-h-[44px]',
                      isCollapsed ? 'lg:w-full lg:justify-center lg:px-0' : 'px-4 py-3',
                      isActive(item.path)
                        ? 'bg-gold-500 text-stone-900 shadow-md shadow-gold-500/20'
                        : 'text-foreground hover:bg-gold-100 dark:hover:bg-gold-900/20 hover:text-gold-700 dark:hover:text-gold-400'
                    )}
                  >
                    <span className="shrink-0 flex items-center justify-center [&>svg]:h-5 [&>svg]:w-5">
                      {item.icon}
                    </span>
                    <span
                      className={cn(
                        'whitespace-nowrap overflow-hidden transition-all duration-300',
                        isCollapsed && 'lg:absolute lg:opacity-0 lg:pointer-events-none lg:w-0 lg:overflow-hidden'
                      )}
                    >
                      {label}
                    </span>
                    {item.path === '/admin/orders' && pendingOrdersCount > 0 && (
                      <span
                        className={cn(
                          'shrink-0 min-w-[1.25rem] h-5 px-1.5 rounded-full flex items-center justify-center text-xs font-bold bg-warning-500 text-white tabular-nums',
                          isCollapsed && 'lg:absolute lg:end-1 lg:top-1/2 lg:-translate-y-1/2'
                        )}
                        aria-label={language === 'ar' ? `${pendingOrdersCount} طلبات معلقة` : `${pendingOrdersCount} pending orders`}
                      >
                        {pendingOrdersCount > 99 ? '99+' : pendingOrdersCount}
                      </span>
                    )}
                  </Link>
                )
                return (
                  <li key={item.path} className={cn(item.path === '/admin/orders' && pendingOrdersCount > 0 && 'relative')}>
                    {isCollapsed ? (
                      <Tooltip>
                        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                        <TooltipContent side={isRTL ? 'left' : 'right'}>{label}</TooltipContent>
                      </Tooltip>
                    ) : (
                      linkContent
                    )}
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Sidebar Footer — theme, logout */}
          <div
            className={cn(
              'p-4 border-t border-border space-y-2 shrink-0',
              isCollapsed && 'lg:px-2 lg:space-y-1'
            )}
          >
            {/* Theme Toggle */}
            {isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={toggleTheme}
                    className={cn(
                      'w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors min-h-[44px]',
                      'text-foreground hover:bg-gold-100 dark:hover:bg-gold-900/20',
                      'lg:px-0'
                    )}
                    aria-label={theme === 'dark'
                      ? (language === 'ar' ? 'الوضع الفاتح' : 'Light mode')
                      : (language === 'ar' ? 'الوضع الداكن' : 'Dark mode')
                    }
                  >
                    {theme === 'dark' ? (
                      <Sun className="h-5 w-5 shrink-0" />
                    ) : (
                      <Moon className="h-5 w-5 shrink-0" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side={isRTL ? 'left' : 'right'}>
                  {theme === 'dark'
                    ? (language === 'ar' ? 'الوضع الفاتح' : 'Light Mode')
                    : (language === 'ar' ? 'الوضع الداكن' : 'Dark Mode')
                  }
                </TooltipContent>
              </Tooltip>
            ) : (
              <button
                onClick={toggleTheme}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors min-h-[44px]',
                  'text-foreground hover:bg-gold-100 dark:hover:bg-gold-900/20'
                )}
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="h-5 w-5 shrink-0" />
                    <span>{language === 'ar' ? 'الوضع الفاتح' : 'Light Mode'}</span>
                  </>
                ) : (
                  <>
                    <Moon className="h-5 w-5 shrink-0" />
                    <span>{language === 'ar' ? 'الوضع الداكن' : 'Dark Mode'}</span>
                  </>
                )}
              </button>
            )}

            {/* Logout Button */}
            {isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className={cn(
                      'w-full justify-center gap-3 px-4 py-3 text-sm font-medium min-h-[44px]',
                      'text-danger-600 hover:text-danger-700 hover:bg-danger-50 dark:text-danger-400 dark:hover:bg-danger-900/20',
                      'lg:px-0'
                    )}
                  >
                    <LogOut className="h-5 w-5 shrink-0" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side={isRTL ? 'left' : 'right'}>
                  {language === 'ar' ? 'تسجيل الخروج' : 'Logout'}
                </TooltipContent>
              </Tooltip>
            ) : (
              <Button
                variant="ghost"
                onClick={handleLogout}
                className={cn(
                  'w-full justify-start gap-3 px-4 py-3 text-sm font-medium min-h-[44px]',
                  'text-danger-600 hover:text-danger-700 hover:bg-danger-50 dark:text-danger-400 dark:hover:bg-danger-900/20'
                )}
              >
                <LogOut className="h-5 w-5 shrink-0" />
                <span>{language === 'ar' ? 'تسجيل الخروج' : 'Logout'}</span>
              </Button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={cn(
          'min-h-screen transition-all duration-300 ease-in-out',
          'pt-16 lg:pt-0',
          isCollapsed ? 'lg:ps-16' : 'lg:ps-64'
        )}
      >
        {pendingOrdersCount > 0 && location.pathname !== '/admin/orders' && (
          <Link
            to="/admin/orders"
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-warning-500/15 border-b border-warning-500/30 text-warning-800 dark:text-warning-200 hover:bg-warning-500/25 transition-colors text-sm font-medium"
          >
            <ShoppingCart className="h-4 w-4 shrink-0" />
            {language === 'ar'
              ? `لديك ${pendingOrdersCount} طلب معلق — عرض`
              : `${pendingOrdersCount} pending order${pendingOrdersCount !== 1 ? 's' : ''} — View`}
          </Link>
        )}
        <div className="p-4 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default AdminLayout
