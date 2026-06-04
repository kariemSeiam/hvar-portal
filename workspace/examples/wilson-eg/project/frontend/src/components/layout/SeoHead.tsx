import { Helmet } from 'react-helmet-async'
import { useLocation } from 'react-router-dom'
import { useLanguage } from '@/contexts/LanguageContext'

const SITE_NAME = 'ويلسون | Wilson Egypt'
const SITE_DESC_AR = 'صُنع للبيت المصري. أجهزة منزلية بجودة عالمية — ثلاجات، بوتاجازات، مبردات، مكانس.'
const SITE_DESC_EN = 'Made for Egyptian homes. World-class appliances — refrigerators, stoves, coolers, vacuums.'
const BASE_URL = 'https://kariemseiam.github.io/wilson-egypt'

const routeMeta: Record<string, { titleAr: string; titleEn: string; descAr: string; descEn: string }> = {
  '/': {
    titleAr: 'ويلسون | الرئيسية',
    titleEn: 'Wilson Egypt | Home',
    descAr: SITE_DESC_AR,
    descEn: SITE_DESC_EN,
  },
  '/products': {
    titleAr: 'المنتجات | ويلسون',
    titleEn: 'Products | Wilson Egypt',
    descAr: 'اكتشف أجهزة ويلسون المنزلية — ثلاجات، بوتاجازات، مبردات، مكانس كهربائية وأكثر.',
    descEn: 'Discover Wilson home appliances — refrigerators, stoves, water coolers, vacuum cleaners and more.',
  },
  '/cart': {
    titleAr: 'السلة | ويلسون',
    titleEn: 'Cart | Wilson Egypt',
    descAr: 'سلة التسوق',
    descEn: 'Shopping cart',
  },
  '/checkout': {
    titleAr: 'إتمام الطلب | ويلسون',
    titleEn: 'Checkout | Wilson Egypt',
    descAr: 'إتمام طلبك',
    descEn: 'Complete your order',
  },
  '/about': {
    titleAr: 'عن ويلسون',
    titleEn: 'About Wilson',
    descAr: 'قصتنا وقيمنا',
    descEn: 'Our story and values',
  },
  '/service': {
    titleAr: 'الخدمة والضمان | ويلسون',
    titleEn: 'Service & Warranty | Wilson Egypt',
    descAr: 'ضمان 5 سنوات، صيانة سريعة، مراكز خدمة في كل المحافظات',
    descEn: '5-year warranty, fast service, centers nationwide',
  },
  '/contact': {
    titleAr: 'تواصل معنا | ويلسون',
    titleEn: 'Contact Us | Wilson Egypt',
    descAr: 'تواصل عبر الموقع أو واتساب — نرد خلال 48 ساعة',
    descEn: 'Contact us or WhatsApp — we respond within 48 hours',
  },
  '/orders': {
    titleAr: 'طلباتي | ويلسون',
    titleEn: 'My Orders | Wilson Egypt',
    descAr: 'تتبع طلباتك',
    descEn: 'Track your orders',
  },
  '/wishlist': {
    titleAr: 'المفضلة | ويلسون',
    titleEn: 'Wishlist | Wilson Egypt',
    descAr: 'قائمة المفضلة',
    descEn: 'Your wishlist',
  },
}

const defaultMeta = {
  titleAr: SITE_NAME,
  titleEn: 'Wilson Egypt',
  descAr: SITE_DESC_AR,
  descEn: SITE_DESC_EN,
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Wilson Egypt',
  alternateName: 'ويلسون',
  url: BASE_URL,
  description: 'Home appliances for Egyptian homes',
  logo: `${BASE_URL}/favicon.svg`,
}

export function SeoHead() {
  const { pathname } = useLocation()
  const { language } = useLanguage()

  const path = pathname.replace(/^\/wilson-egypt/, '') || '/'
  const pathKey = path === '/' ? '/' : path.replace(/\/[^/]+$/, '') // /products/xxx -> /products
  const meta = routeMeta[path] ?? routeMeta[pathKey] ?? defaultMeta
  const title = language === 'ar' ? meta.titleAr : meta.titleEn
  const description = language === 'ar' ? meta.descAr : meta.descEn

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={BASE_URL + pathname} />
      <meta property="og:locale" content={language === 'ar' ? 'ar_EG' : 'en_US'} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
    </Helmet>
  )
}
