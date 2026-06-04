import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useLanguage } from '@/contexts/LanguageContext'
import { analytics } from '@/lib/analytics'

/**
 * Fires page_view on route change. Integrate in App for SPA analytics.
 */
export function usePageView() {
  const { pathname } = useLocation()
  const { language } = useLanguage()

  useEffect(() => {
    const title = document.title || 'Wilson Egypt'
    analytics.pageView(pathname, title, language === 'ar' ? 'ar_EG' : 'en_US')
  }, [pathname, language])
}
