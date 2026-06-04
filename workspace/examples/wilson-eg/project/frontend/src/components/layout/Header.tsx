/**
 * Header — Wilson Egypt storefront
 * Job: Identity, find products, cart, WhatsApp, account.
 * Ref: wilson-ux (logo, nav, cart, language, theme, profile)
 * Ref: wilson-design (gold focal, breathe, Arabic first)
 */
import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import {
  Menu,
  Phone,
  ShoppingCart,
  User,
  Sun,
  Moon,
  ChevronDown,
  Shield,
  LayoutDashboard,
  Truck,
  MessageCircle,
  Heart,
  LogOut,
  Package,
  Search,
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useCart } from '@/contexts/CartContext'
import { useCategories } from '@/hooks/useCategories'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent } from '@/components/ui/Sheet'
import { WilsonLogo } from '@/components/layout/WilsonLogo'
import { SearchOverlay } from '@/components/layout/SearchOverlay'

const WILSON_PHONE = '201080755516'
const WILSON_WHATSAPP = `https://wa.me/${WILSON_PHONE}`

const Header = () => {
  const { language, setLanguage, t, isRTL } = useLanguage()
  const { data: categories = [] } = useCategories()
  const { isAuthenticated, user, logout, isAdmin } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { itemCount } = useCart()
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const navLinks = [
    { path: '/', label: t('nav.home') },
    { path: '/about', label: t('nav.about') },
    { path: '/service', label: t('nav.service') },
    { path: '/contact', label: t('nav.contact') },
  ]

  const toggleLanguage = () => setLanguage(language === 'ar' ? 'en' : 'ar')
  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)

  const TrustBadges = [
    { icon: Shield, key: 'proof.warranty' },
    { icon: Truck, key: 'proof.delivery' },
    { icon: Phone, key: 'proof.service' },
    { icon: MessageCircle, key: 'cta.whatsapp' },
  ]

  /** 2 identical tracks = minimum for seamless CSS loop (see trust-bar-scroll 50%) */
  const TRUST_MARQUEE_COPIES = 2

  return (
    <header
      className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur border-b border-[hsl(var(--header-border))] pt-[env(safe-area-inset-top)]"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Trust bar — refined: 4 badges, subtle marquee */}
      <div className="trust-bar overflow-hidden">
        <div className="flex h-9 md:h-10 items-center min-h-[2.25rem]">
          <div className="flex-1 min-w-0 overflow-hidden isolate">
            <div className={cn('trust-bar-marquee flex flex-nowrap', isRTL && 'trust-bar-marquee-rtl')}>
              {Array.from({ length: TRUST_MARQUEE_COPIES }).map((_, i) => (
                <div
                  key={i}
                  className="trust-bar-track flex items-center flex-nowrap shrink-0 gap-5 pe-5"
                  aria-hidden={i > 0}
                >
                  {TrustBadges.map((badge) => {
                    const Icon = badge.icon
                    return (
                      <span
                        key={`${i}-${badge.key}`}
                        className="trust-badge flex items-center shrink-0 text-[hsl(var(--trust-bar-fg))]"
                      >
                        <Icon
                          className="h-3.5 w-3.5 text-[hsl(var(--trust-bar-accent))] shrink-0"
                          strokeWidth={2}
                        />
                        <span className="font-medium text-[11px] whitespace-nowrap ms-1.5 opacity-95">
                          {t(badge.key)}
                        </span>
                        <span
                          className="text-[hsl(var(--trust-bar-fg-muted))] ms-2.5 me-0.5 text-[10px]"
                          aria-hidden
                        >
                          •
                        </span>
                      </span>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
          <div
            className={cn(
              'trust-bar-cta shrink-0 flex items-center gap-1.5 ps-4 pe-3 md:gap-2 md:ps-6',
              'bg-gradient-to-l from-[hsl(var(--trust-bar-bg))] to-transparent',
              'rtl:bg-gradient-to-r rtl:from-[hsl(var(--trust-bar-bg))] rtl:to-transparent'
            )}
          >
            <a
              href={`tel:+${WILSON_PHONE}`}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[hsl(var(--trust-bar-fg))]/90 hover:text-[hsl(var(--trust-bar-accent))] hover:bg-[hsl(var(--trust-bar-fg))]/5 transition-colors"
              title={t('topbar.callNow')}
            >
              <Phone className="h-3.5 w-3.5 shrink-0" />
              <span dir="ltr" className="text-[11px] font-medium hidden sm:inline">
                010 80755516
              </span>
            </a>
            <span className="w-px h-4 bg-[hsl(var(--trust-bar-fg))]/20 shrink-0" aria-hidden />
            <a
              href={WILSON_WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              className="whatsapp-cta whatsapp-cta--compact flex items-center gap-1 px-2 py-1 rounded-lg border border-[#25D366]/40 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/15 transition-colors"
              aria-label={t('cta.whatsapp')}
              title={t('cta.whatsapp')}
            >
              <MessageCircle className="h-3.5 w-3.5 shrink-0" />
              <span className="text-[11px] font-medium hidden md:inline">{t('cta.whatsapp')}</span>
            </a>
            <span className="w-px h-4 bg-[hsl(var(--trust-bar-fg))]/20 shrink-0" aria-hidden />
            <button
              onClick={toggleLanguage}
              className="px-2 py-1 rounded-md text-[hsl(var(--trust-bar-fg))]/70 hover:text-[hsl(var(--trust-bar-accent))] hover:bg-[hsl(var(--trust-bar-fg))]/5 transition-colors text-[11px] font-semibold"
            >
              {language === 'ar' ? 'EN' : 'عربي'}
            </button>
          </div>
        </div>
      </div>

      {/* Main bar */}
      <div className="header-main-bar container-wide flex h-16 md:h-[4.25rem] items-center justify-between gap-3 md:gap-4">
        <Link
          to="/"
          className="flex-shrink-0 flex items-center min-w-0 order-first"
          aria-label="Wilson Egypt"
        >
          <WilsonLogo className="text-primary" size="header" />
        </Link>

        {/* Desktop nav */}
        <nav
          className="hidden lg:flex items-center gap-0.5 flex-shrink-0"
          aria-label={language === 'ar' ? 'التنقل الرئيسي' : 'Main navigation'}
        >
          <Link
            to="/"
            className="nav-link-desktop px-4 py-2.5 rounded-lg text-sm font-medium text-foreground hover:text-foreground"
            data-active={isActive('/') && location.pathname === '/'}
          >
            {t('nav.home')}
          </Link>

          <div
            className="relative"
            onMouseEnter={() => setIsCategoriesOpen(true)}
            onMouseLeave={() => setIsCategoriesOpen(false)}
          >
            <Link
              to="/products"
              className="nav-link-desktop nav-link-desktop-has-icon flex items-center gap-1 px-4 py-2.5 rounded-lg text-sm font-medium text-foreground hover:text-foreground"
              data-active={isActive('/products')}
            >
              <span className="nav-link-desktop-label">{t('nav.products')}</span>
              <ChevronDown
                className={cn('h-4 w-4 transition-transform duration-200', isCategoriesOpen && 'rotate-180')}
              />
            </Link>
            {isCategoriesOpen && (
              <div
                className={cn(
                  'header-dropdown absolute top-full mt-1.5 min-w-[240px] py-2 rounded-xl border border-border bg-card',
                  'start-0'
                )}
                dir={isRTL ? 'rtl' : 'ltr'}
              >
                {categories.map((cat) => (
                  <Link
                    key={cat.slug}
                    to={`/products?category=${cat.slug}`}
                    onClick={() => setIsCategoriesOpen(false)}
                    className="header-dropdown-link block px-4 py-2.5 text-sm font-medium text-foreground"
                  >
                    {language === 'ar' ? cat.nameAr : cat.nameEn}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {navLinks
            .filter((l) => l.path !== '/')
            .map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="nav-link-desktop px-4 py-2.5 rounded-lg text-sm font-medium text-foreground hover:text-foreground"
                data-active={isActive(link.path)}
              >
                {link.label}
              </Link>
            ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden lg:flex items-center header-actions-group order-last">
          <button
            onClick={toggleTheme}
            className="header-action-btn p-2.5 rounded-lg text-foreground"
            aria-label={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <Link
            to="/cart"
            className={cn(
              'header-action-btn relative p-2.5 rounded-lg transition-colors',
              itemCount > 0 ? 'text-primary' : 'text-foreground'
            )}
            aria-label={itemCount > 0 ? `${t('nav.cart')} — ${itemCount}` : t('nav.cart')}
          >
            <ShoppingCart className="h-4 w-4" />
            {itemCount > 0 && (
              <span className="header-cart-badge absolute -top-0.5 -end-0.5 flex h-4 w-4 min-w-[1rem] items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground leading-none px-0.5">
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            )}
          </Link>

          {isAuthenticated && (
            <>
              <Link to="/orders" className="header-action-btn p-2.5 rounded-lg text-foreground" title={t('nav.orders')}>
                <Package className="h-4 w-4" />
              </Link>
              <Link
                to="/wishlist"
                className="header-action-btn p-2.5 rounded-lg text-foreground"
                title={t('nav.wishlist')}
              >
                <Heart className="h-4 w-4" />
              </Link>
            </>
          )}

          {isAuthenticated ? (
            <div className="flex items-center gap-0.5 ms-1">
              {isAdmin && (
                <Link
                  to="/admin"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-primary hover:bg-primary/10 dark:hover:bg-primary/15 border border-primary/30 transition-colors"
                  title={language === 'ar' ? 'لوحة التحكم' : 'Admin panel'}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="hidden xl:inline">
                    {language === 'ar' ? 'لوحة التحكم' : 'Admin panel'}
                  </span>
                </Link>
              )}
              <Link
                to="/account"
                className="header-action-btn flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-foreground"
              >
                <User className="h-4 w-4" />
                <span className="hidden xl:inline">
                  {user?.name ? user.name : language === 'ar' ? 'حسابي' : 'Account'}
                </span>
              </Link>
              <button
                onClick={logout}
                className="header-action-btn p-2 rounded-lg text-foreground"
                title={language === 'ar' ? 'تسجيل الخروج' : 'Logout'}
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="header-action-btn flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-foreground ms-1"
            >
              <User className="h-4 w-4" />
              <span className="hidden xl:inline">{language === 'ar' ? 'حسابي' : 'Account'}</span>
            </Link>
          )}
        </div>

        {/* Mobile actions: search, cart, hamburger */}
        <nav className="flex lg:hidden items-center gap-0.5 ms-auto shrink-0 order-last" aria-label={language === 'ar' ? 'التنقل المحمول' : 'Mobile navigation'}>
          <button
            onClick={() => setIsSearchOpen(true)}
            className="header-mobile-btn header-mobile-btn-search"
            aria-label={t('nav.search')}
          >
            <Search className="h-5 w-5 shrink-0" strokeWidth={2} />
          </button>
          <Link
            to="/cart"
            className="header-mobile-btn header-mobile-btn-cart relative"
            aria-label={itemCount > 0 ? `${t('nav.cart')} — ${itemCount}` : t('nav.cart')}
          >
            <ShoppingCart className="h-5 w-5 shrink-0" strokeWidth={2} />
            {itemCount > 0 && (
              <span className="header-mobile-cart-badge absolute -top-0.5 -end-0.5 flex h-4 w-4 min-w-[1rem] items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground leading-none px-0.5">
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            )}
          </Link>
          <button
            onClick={() => setIsMenuOpen(true)}
            className="header-mobile-btn header-mobile-btn-menu"
            aria-label={language === 'ar' ? 'القائمة' : 'Menu'}
            aria-expanded={isMenuOpen}
          >
            <Menu className="h-6 w-6 shrink-0" strokeWidth={2} />
          </button>
        </nav>
      </div>

      {/* Mobile drawer */}
      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetContent
          side={isRTL ? 'right' : 'left'}
          variant="menu"
          showClose={true}
          dir={isRTL ? 'rtl' : 'ltr'}
          className="menu-drawer-sheet w-[min(100vw,20rem)] max-w-[85vw] sm:max-w-[22rem] p-0 flex flex-col border-border overflow-hidden shadow-gold-lg"
        >
          <div className="menu-drawer h-full flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
            <header className="menu-drawer-header">
              <WilsonLogo className="text-primary" size="header" />
              <div className="flex items-center gap-0.5">
                <button
                  onClick={toggleTheme}
                  className="menu-drawer-header-action p-2.5 rounded-lg text-foreground"
                  aria-label={theme === 'dark' ? 'Light mode' : 'Dark mode'}
                >
                  {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
                <button
                  onClick={toggleLanguage}
                  className="menu-drawer-header-action px-3 py-2.5 rounded-lg text-sm font-medium text-foreground"
                  aria-label={language === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
                >
                  {language === 'ar' ? 'EN' : 'عربي'}
                </button>
              </div>
            </header>

            <nav
              className="menu-drawer-body"
              dir={isRTL ? 'rtl' : 'ltr'}
              aria-label={language === 'ar' ? 'التنقل الرئيسي' : 'Main navigation'}
            >
              <div className="menu-drawer-section">
                <div className="menu-drawer-nav">
                  <Link
                    to="/"
                    onClick={() => setIsMenuOpen(false)}
                    className={cn(
                      'menu-drawer-link',
                      isActive('/') && location.pathname === '/' && 'menu-drawer-link--active'
                    )}
                  >
                    {t('nav.home')}
                  </Link>
                  <Link
                    to="/products"
                    onClick={() => setIsMenuOpen(false)}
                    className={cn(
                      'menu-drawer-link',
                      isActive('/products') && 'menu-drawer-link--active'
                    )}
                  >
                    {t('nav.products')}
                  </Link>
                  {navLinks
                    .filter((l) => l.path !== '/')
                    .map((link) => (
                      <Link
                        key={link.path}
                        to={link.path}
                        onClick={() => setIsMenuOpen(false)}
                        className={cn(
                          'menu-drawer-link',
                          isActive(link.path) && 'menu-drawer-link--active'
                        )}
                      >
                        {link.label}
                      </Link>
                    ))}
                </div>
              </div>

              <div className="menu-drawer-section">
                <p className="menu-drawer-section-label">
                  {language === 'ar' ? 'الأقسام' : 'Categories'}
                </p>
                <div className="menu-drawer-cats">
                  {categories.map((cat) => (
                    <Link
                      key={cat.slug}
                      to={`/products?category=${cat.slug}`}
                      onClick={() => setIsMenuOpen(false)}
                      className="menu-drawer-cat"
                    >
                      {language === 'ar' ? cat.nameAr : cat.nameEn}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="menu-drawer-divider" />

              {(isAuthenticated || isAdmin) && (
                <div className="menu-drawer-section">
                  <div className="menu-drawer-nav">
                    {isAuthenticated && (
                      <>
                        <Link
                          to="/orders"
                          onClick={() => setIsMenuOpen(false)}
                          className="menu-drawer-link"
                        >
                          <Package className="h-5 w-5 shrink-0" />
                          {t('nav.orders')}
                        </Link>
                        <Link
                          to="/wishlist"
                          onClick={() => setIsMenuOpen(false)}
                          className="menu-drawer-link"
                        >
                          <Heart className="h-5 w-5 shrink-0" />
                          {t('nav.wishlist')}
                        </Link>
                      </>
                    )}
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setIsMenuOpen(false)}
                        className="menu-drawer-link menu-drawer-link--primary"
                      >
                        <LayoutDashboard className="h-5 w-5 shrink-0" />
                        {language === 'ar' ? 'لوحة التحكم' : 'Admin panel'}
                      </Link>
                    )}
                  </div>
                </div>
              )}

              <div className="menu-drawer-divider" />

              {/* Account & contact — custom action block */}
              <div className="menu-drawer-actions">
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/account"
                      onClick={() => setIsMenuOpen(false)}
                      className="menu-drawer-action menu-drawer-action--account"
                    >
                      <User className="h-5 w-5 shrink-0" />
                      <span>{user?.name ? user.name : language === 'ar' ? 'حسابي' : 'My Account'}</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        logout()
                        setIsMenuOpen(false)
                      }}
                      className="menu-drawer-action menu-drawer-action--logout"
                    >
                      <LogOut className="h-5 w-5 shrink-0" />
                      <span>{language === 'ar' ? 'تسجيل الخروج' : 'Logout'}</span>
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="menu-drawer-action menu-drawer-action--account"
                  >
                    <User className="h-5 w-5 shrink-0" />
                    <span>{language === 'ar' ? 'تسجيل الدخول' : 'Login'}</span>
                  </Link>
                )}
                <a
                  href={WILSON_WHATSAPP}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsMenuOpen(false)}
                  className="menu-drawer-action menu-drawer-action--wa"
                >
                  <MessageCircle className="h-5 w-5 shrink-0" />
                  <span>{t('cta.whatsapp')}</span>
                </a>
                <a
                  href={`tel:+${WILSON_PHONE}`}
                  onClick={() => setIsMenuOpen(false)}
                  className="menu-drawer-action menu-drawer-action--call"
                >
                  <Phone className="h-5 w-5 shrink-0" />
                  <span dir="ltr">010 80755516</span>
                </a>
              </div>
            </nav>
          </div>
        </SheetContent>
      </Sheet>

      {/* Search overlay */}
      <SearchOverlay open={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </header>
  )
}

export default Header
