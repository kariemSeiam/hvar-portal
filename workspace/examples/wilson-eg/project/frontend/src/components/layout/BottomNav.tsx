/**
 * BottomNav — Wilson Egypt mobile bottom navigation bar
 * 5 items: Home, Products, Cart (with badge), Wishlist, Account
 * Mobile only (<1024px). Hidden on cart, checkout, and admin pages.
 */
import { Link, useLocation } from 'react-router-dom'
import { Home, ShoppingBag, ShoppingCart, Heart, User } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'

export function BottomNav() {
  const { itemCount } = useCart()
  const { isAuthenticated } = useAuth()
  const { t, isRTL } = useLanguage()
  const { pathname } = useLocation()

  // Hide on cart, checkout, and admin pages
  const isCartPage = pathname === '/cart'
  const isCheckoutPage = pathname === '/checkout'
  const isAdminPage = pathname.startsWith('/admin')

  if (isCartPage || isCheckoutPage || isAdminPage) return null

  const isActive = (path: string) =>
    path === '/' ? pathname === '/' : pathname.startsWith(path)

  return (
    <nav
      className="bottom-nav lg:hidden"
      dir={isRTL ? 'rtl' : 'ltr'}
      aria-label={isRTL ? 'التنقل السفلي' : 'Bottom navigation'}
    >
      <div className="bottom-nav-items">
        <Link
          to="/"
          className={cn('bottom-nav-item', isActive('/') && 'bottom-nav-item--active')}
        >
          <Home className="shrink-0" strokeWidth={1.75} aria-hidden />
          <span className="bottom-nav-label">{t('nav.home')}</span>
        </Link>

        <Link
          to="/products"
          className={cn('bottom-nav-item', isActive('/products') && 'bottom-nav-item--active')}
        >
          <ShoppingBag className="shrink-0" strokeWidth={1.75} aria-hidden />
          <span className="bottom-nav-label">{t('nav.products')}</span>
        </Link>

        <Link
          to="/cart"
          className={cn('bottom-nav-item', isActive('/cart') && 'bottom-nav-item--active')}
          aria-label={itemCount > 0 ? `${t('nav.cart')} — ${itemCount}` : t('nav.cart')}
        >
          <ShoppingCart className="shrink-0" strokeWidth={1.75} aria-hidden />
          <span className="bottom-nav-label">{t('nav.cart')}</span>
          {itemCount > 0 && (
            <span className="bottom-nav-badge" aria-hidden>
              {itemCount > 99 ? '99+' : itemCount}
            </span>
          )}
        </Link>

        <Link
          to={isAuthenticated ? '/wishlist' : '/login'}
          className={cn('bottom-nav-item', isActive('/wishlist') && 'bottom-nav-item--active')}
        >
          <Heart className="shrink-0" strokeWidth={1.75} aria-hidden />
          <span className="bottom-nav-label">{t('nav.wishlist')}</span>
        </Link>

        <Link
          to={isAuthenticated ? '/account' : '/login'}
          className={cn(
            'bottom-nav-item',
            (isActive('/account') || isActive('/login')) && 'bottom-nav-item--active'
          )}
        >
          <User className="shrink-0" strokeWidth={1.75} aria-hidden />
          <span className="bottom-nav-label">
            {isAuthenticated ? t('nav.account') : isRTL ? 'دخول' : 'Login'}
          </span>
        </Link>
      </div>
    </nav>
  )
}
