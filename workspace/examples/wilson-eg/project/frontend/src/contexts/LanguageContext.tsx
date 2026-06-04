import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type Language = 'ar' | 'en'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
  dir: 'rtl' | 'ltr'
  isRTL: boolean
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const translations: Record<Language, Record<string, string>> = {
  ar: {
    // Navigation
    'nav.home': 'الرئيسية',
    'nav.products': 'المنتجات',
    'nav.about': 'عن ويلسون',
    'nav.service': 'الخدمة والضمان',
    'nav.contact': 'تواصل معنا',
    'nav.cart': 'السلة',
    'nav.search': 'بحث',
    'nav.searchPlaceholder': 'ابحث عن منتج...',
    'nav.orders': 'طلباتي',
    'nav.wishlist': 'المفضلة',
    'nav.account': 'حسابي',

    // Orders
    'orders.title': 'طلباتي',
    'orders.empty': 'لا توجد طلبات',
    'orders.track': 'تتبع',
    'orders.status': 'الحالة',
    'orders.total': 'الإجمالي',
    'orders.date': 'التاريخ',
    'orders.items': 'المنتجات',
    'orders.cancel': 'إلغاء الطلب',
    'orders.trackingTitle': 'تتبع الطلب',

    // Wishlist
    'wishlist.title': 'المفضلة',
    'wishlist.subtitle': 'منتجاتك المحفوظة',
    'wishlist.empty': 'المفضلة فارغة',
    'wishlist.addToCart': 'أضف للسلة',

    // Hero
    'hero.brand': 'ويلسن',
    'hero.easyLife': 'حياة أسهل',
    'hero.title': 'صُنع للبيت المصري',
    'hero.subtitle': 'نسعى لتحسين حياة الناس من خلال الأجهزة الكهربائية التي تجعل حياتهم أسهل وأكثر راحة.',
    'hero.tagline': 'قوية. ذكية. بسعر عادل.',
    'hero.cta.products': 'اكتشف المنتجات',
    'hero.cta.installment': 'احسب التقسيط',

    // Categories
    'categories.title': 'اختار حسب احتياجك',
    'categories.subtitle': 'أجهزتك كلها من مكان واحد — ثلاجات، بوتاجازات، مبردات، مكانس وأكتر',
    'categories.refrigerators': 'الثلاجات والفريزرات',
    'categories.stoves': 'البوتاجازات والأفران',
    'categories.coolers': 'مبردات المياه',
    'categories.vacuums': 'المكانس الكهربائية',
    'categories.small': 'الأجهزة الصغيرة',

    // Products
    'products.all': 'كل المنتجات',
    'products.category': 'المنتجات',
    'products.filter': 'فلتر',
    'products.sort': 'ترتيب',
    'products.orderNow': 'اطلب دلوقتي',
    'products.addToCart': 'أضف للسلة',
    'products.addToCartShort': 'أضف',
    'products.viewDetails': 'التفاصيل',
    'products.warranty': 'ضمان',
    'products.years': 'سنوات',
    'products.inStock': 'متوفر',
    'products.outOfStock': 'غير متوفر',
    'products.related': 'منتجات مشابهة',
    'products.recentlyViewed': 'شاهدته مؤخراً',
    'products.inquiryWhatsApp': 'استفسار؟ واتساب',
    'products.inquiryShort': 'استفسار',
    'products.inquiryHint': 'للاستعلام أو الاستفسار',

    // Cart
    'cart.title': 'سلة التسوق',
    'cart.empty': 'سلتك فارغة',
    'cart.subtotal': 'المجموع الفرعي',
    'cart.shipping': 'الشحن',
    'cart.total': 'الإجمالي',
    'cart.checkout': 'إتمام الطلب',
    'cart.continue': 'متابعة التسوق',

    // Why Wilson
    'why.title': 'ليه تختار ويلسن؟',
    'why.subtitle': 'مش مجرد أجهزة، دي شراكة للبيت',
    'why.pillar1.title': 'مصممة ليك',
    'why.pillar1.desc': 'فهمنا البيت المصري. مطابخنا، عائلاتنا، استخدامنا اليومي.',
    'why.pillar2.title': 'جودة بسعر عادل',
    'why.pillar2.desc': 'مش الأرخص. لكن أفضل قيمة. جودة عالمية، سعر مصري.',
    'why.pillar3.title': 'معاك طول العمر',
    'why.pillar3.desc': 'ضمان 5 سنين. صيانة سريعة. قطع غيار متوفرة.',

    // CTA
    'cta.title': 'جاهز تبدأ؟',
    'cta.subtitle': 'زور الشوروم أو اطلب أونلاين. التوصيل والتركيب علينا.',
    'cta.whatsapp': 'واتساب',
    'cta.call': 'اتصل بنا',
    'topbar.callNow': 'اتصل الآن',
    'cta.order': 'اطلب دلوقتي',

    // Footer
    'footer.tagline': 'صُنع للبيت المصري',
    'footer.rights': 'جميع الحقوق محفوظة',

    // Contact
    'contact.title': 'تواصل معنا',
    'contact.heroSubtitle': 'إحنا هنا عشان نساعدك',
    'contact.trustResponse': 'نرد خلال 48 ساعة',
    'contact.form.name': 'الاسم',
    'contact.form.phone': 'رقم الهاتف',
    'contact.form.message': 'رسالتك',
    'contact.form.submit': 'إرسال',
    'contact.info': 'بيانات التواصل',
    'contact.sendMessage': 'ابعت لنا رسالة',
    'contact.successTitle': 'تم الإرسال',
    'contact.successDesc': 'شكراً سنتواصل معك قريباً',
    'contact.errorTitle': 'خطأ',
    'contact.errorDesc': 'فشل الإرسال. حاول مرة أخرى',
    'contact.phone': '010 80755516',
    'contact.email': 'info@wilson-eg.com',
    'contact.location': 'القاهرة، مصر',
    'contact.hours': 'السبت - الخميس: 10 ص - 10 م',
    'contact.validation.nameRequired': 'الاسم مطلوب',
    'contact.validation.phoneRequired': 'رقم الهاتف مطلوب',
    'contact.validation.messageRequired': 'الرسالة مطلوبة',

    // About
    'about.title': 'عن ويلسون',
    'about.story': 'قصتنا',
    'about.values': 'قيمنا',

    // Service
    'service.title': 'الخدمة والضمان',
    'service.warranty': 'الضمان',
    'service.warranty.title': 'ضمان ويلسون',
    'service.process': 'خطوات الخدمة',
    'service.process.title': 'خطوات طلب الخدمة',
    'service.centers': 'مراكز الخدمة',
    'service.request': 'طلب صيانة',
    'service.request.desc': 'أرسل طلب صيانة وسنتواصل معك خلال 48 ساعة',
    'service.warrantyReg': 'تسجيل الضمان',
    'service.warrantyReg.desc': 'سجّل جهازك لتفعيل الضمان',
    'service.form.productCode': 'كود المنتج',
    'service.form.serial': 'الرقم التسلسلي',
    'service.form.issue': 'وصف المشكلة',
    'service.submitted': 'تم الإرسال بنجاح',
    'service.hero.trust': 'صيانة خلال 48 ساعة',
    'service.submitError': 'فشل الإرسال',
    'service.validation.productCodeRequired': 'كود المنتج مطلوب',
    'service.validation.issueRequired': 'وصف المشكلة مطلوب',

    // Social proof (Hero)
    'proof.warranty': 'ضمان 5 سنوات',
    'topbar.freeShipInstall': 'شحن وتركيب مجاني',
    'proof.service': 'صيانة خلال 48 ساعة',
    'proof.interest': 'تقسيط بدون فوائد',
    'proof.customers': '+50 ألف عميل',
    'proof.delivery': 'شحن مجاني',
    'proof.installation': 'تركيب مجاني',

    // Common
    'common.egp': 'ج.م',
    'common.loading': 'جاري التحميل...',
    'common.error': 'حدث خطأ',
    'common.back': 'رجوع',
    'common.trustLine': 'شحن مجاني فوق ٣٬٠٠٠ ج.م • ضمان أصلي ويلسون',
  },
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.products': 'Products',
    'nav.about': 'About Wilson',
    'nav.service': 'Service & Warranty',
    'nav.contact': 'Contact Us',
    'nav.cart': 'Cart',
    'nav.search': 'Search',
    'nav.searchPlaceholder': 'Search products...',
    'nav.orders': 'My Orders',
    'nav.wishlist': 'Wishlist',
    'nav.account': 'My Account',

    // Orders
    'orders.title': 'My Orders',
    'orders.empty': 'No orders yet',
    'orders.track': 'Track',
    'orders.status': 'Status',
    'orders.total': 'Total',
    'orders.date': 'Date',
    'orders.items': 'Items',
    'orders.cancel': 'Cancel Order',
    'orders.trackingTitle': 'Order Tracking',

    // Wishlist
    'wishlist.title': 'Wishlist',
    'wishlist.subtitle': 'Your saved products',
    'wishlist.empty': 'Wishlist is empty',
    'wishlist.addToCart': 'Add to Cart',

    // Hero
    'hero.brand': 'Wilson',
    'hero.easyLife': 'EASY LIFE',
    'hero.title': 'Made for Egyptian Homes',
    'hero.subtitle': 'We seek to improve people\'s lives with appliances that make life easier and more comfortable.',
    'hero.tagline': 'Powerful. Smart. Fairly Priced.',
    'hero.cta.products': 'Explore Products',
    'hero.cta.installment': 'Calculate Installment',

    // Categories
    'categories.title': 'Shop by Need',
    'categories.subtitle': 'Everything you need — refrigerators, stoves, coolers, vacuums and more',
    'categories.refrigerators': 'Refrigerators & Freezers',
    'categories.stoves': 'Stoves & Ovens',
    'categories.coolers': 'Water Coolers',
    'categories.vacuums': 'Vacuum Cleaners',
    'categories.small': 'Small Appliances',

    // Products
    'products.all': 'All Products',
    'products.category': 'Products',
    'products.filter': 'Filter',
    'products.sort': 'Sort',
    'products.orderNow': 'Order Now',
    'products.addToCart': 'Add to Cart',
    'products.addToCartShort': 'Add',
    'products.viewDetails': 'View Details',
    'products.warranty': 'Warranty',
    'products.years': 'years',
    'products.inStock': 'In Stock',
    'products.outOfStock': 'Out of Stock',
    'products.related': 'Related Products',
    'products.recentlyViewed': 'Recently Viewed',
    'products.inquiryWhatsApp': 'Questions? WhatsApp',
    'products.inquiryShort': 'Inquiry',
    'products.inquiryHint': 'For questions or inquiry',

    // Cart
    'cart.title': 'Shopping Cart',
    'cart.empty': 'Your cart is empty',
    'cart.subtotal': 'Subtotal',
    'cart.shipping': 'Shipping',
    'cart.total': 'Total',
    'cart.checkout': 'Checkout',
    'cart.continue': 'Continue Shopping',

    // Why Wilson
    'why.title': 'Why Choose Wilson?',
    'why.subtitle': 'Not just appliances — a partnership for your home',
    'why.pillar1.title': 'Designed for You',
    'why.pillar1.desc': 'We understand Egyptian homes. Our kitchens, families, daily use.',
    'why.pillar2.title': 'Quality at Fair Price',
    'why.pillar2.desc': 'Not the cheapest. But the best value. Global quality, Egyptian price.',
    'why.pillar3.title': 'With You for Life',
    'why.pillar3.desc': '5-year warranty. Fast service. Parts always available.',

    // CTA
    'cta.title': 'Ready to Start?',
    'cta.subtitle': 'Visit our showroom or order online. Delivery and installation on us.',
    'cta.whatsapp': 'WhatsApp',
    'cta.call': 'Call Us',
    'topbar.callNow': 'Call Now',
    'cta.order': 'Order Now',

    // Footer
    'footer.tagline': 'Made for Egyptian Homes',
    'footer.rights': 'All rights reserved',

    // Contact
    'contact.title': 'Contact Us',
    'contact.heroSubtitle': "We're here to help",
    'contact.trustResponse': 'We respond within 48 hours',
    'contact.form.name': 'Name',
    'contact.form.phone': 'Phone Number',
    'contact.form.message': 'Your Message',
    'contact.form.submit': 'Send',
    'contact.info': 'Contact Information',
    'contact.sendMessage': 'Send us a message',
    'contact.successTitle': 'Sent',
    'contact.successDesc': 'Thanks, we will get back to you soon',
    'contact.errorTitle': 'Error',
    'contact.errorDesc': 'Failed to send. Please try again',
    'contact.phone': '010 80755516',
    'contact.email': 'info@wilson-eg.com',
    'contact.location': 'Cairo, Egypt',
    'contact.hours': 'Sat - Thu: 10 AM - 10 PM',
    'contact.validation.nameRequired': 'Name is required',
    'contact.validation.phoneRequired': 'Phone is required',
    'contact.validation.messageRequired': 'Message is required',

    // About
    'about.title': 'About Wilson',
    'about.story': 'Our Story',
    'about.values': 'Our Values',

    // Service
    'service.title': 'Service & Warranty',
    'service.warranty': 'Warranty',
    'service.warranty.title': 'Wilson Warranty',
    'service.process': 'Service Process',
    'service.process.title': 'Service Request Steps',
    'service.centers': 'Service Centers',
    'service.request': 'Service Request',
    'service.request.desc': 'Submit a repair request — we\'ll contact you within 48 hours',
    'service.warrantyReg': 'Warranty Registration',
    'service.warrantyReg.desc': 'Register your appliance to activate warranty',
    'service.form.productCode': 'Product Code',
    'service.form.serial': 'Serial Number',
    'service.form.issue': 'Issue Description',
    'service.submitted': 'Submitted successfully',
    'service.hero.trust': '48-hour service guarantee',
    'service.submitError': 'Failed to submit',
    'service.validation.productCodeRequired': 'Product code is required',
    'service.validation.issueRequired': 'Issue description is required',

    // Social proof (Hero)
    'proof.warranty': '5-Year Warranty',
    'topbar.freeShipInstall': 'Free Delivery & Installation',
    'proof.service': '48hr Service',
    'proof.interest': 'Interest-Free Installments',
    'proof.customers': '50K+ Customers',
    'proof.delivery': 'Free Delivery',
    'proof.installation': 'Free Installation',

    // Common
    'common.egp': 'EGP',
    'common.loading': 'Loading...',
    'common.error': 'An error occurred',
    'common.back': 'Back',
    'common.trustLine': 'Free shipping over 3,000 EGP • Wilson original warranty',
  },
}

interface LanguageProviderProps {
  children: ReactNode
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('wilson-language')
      return (saved as Language) || 'ar'
    }
    return 'ar'
  })

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('wilson-language', lang)
  }

  const t = (key: string): string => {
    return translations[language][key] || key
  }

  const dir: 'rtl' | 'ltr' = language === 'ar' ? 'rtl' : 'ltr'
  const isRTL = language === 'ar'

  useEffect(() => {
    document.documentElement.dir = dir
    document.documentElement.lang = language
  }, [language, dir])

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir, isRTL }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
