import { Link } from 'react-router-dom'
import { Phone, Mail, MapPin, Facebook, Instagram } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { WilsonLogo } from '@/components/layout/WilsonLogo'
import { useCategories } from '@/hooks/useCategories'

const Footer = () => {
  const { t, language } = useLanguage()
  const { data: categoriesFromApi = [] } = useCategories()
  const footerCategories = categoriesFromApi.slice(0, 6).map((c) => ({
    path: `/products?category=${c.slug}`,
    label: language === 'ar' ? c.nameAr : c.nameEn,
  }))

  const quickLinks = [
    { path: '/products', label: t('nav.products') },
    { path: '/about', label: t('nav.about') },
    { path: '/service', label: t('nav.service') },
    { path: '/contact', label: t('nav.contact') },
  ]

  const linkClass =
    'text-[hsl(var(--footer-muted))] hover:text-primary transition-colors text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 rounded'

  return (
    <footer
      className="footer-root bg-[hsl(var(--footer-bg))] text-[hsl(var(--footer-fg))] border-t border-[hsl(var(--footer-border))]"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
      role="contentinfo"
    >
      <div className="container-wide py-10 md:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="sm:col-span-2 md:col-span-1 space-y-3">
            <WilsonLogo className="text-primary" size="footer" variant="hero" />
            <p className="text-primary font-semibold text-sm tracking-wide">
              {language === 'ar' ? 'صُنع للبيت المصري' : 'Made for Egyptian Homes'}
            </p>
            <p className="text-[hsl(var(--footer-muted))] text-xs leading-relaxed">
              {language === 'ar'
                ? 'أجهزة منزلية بجودة عالمية — ضمان وخدمة حقيقية.'
                : 'World-class appliances — real warranty, real service.'}
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-primary mb-3">
              {language === 'ar' ? 'روابط' : 'Links'}
            </h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-primary mb-3">
              {language === 'ar' ? 'الأقسام' : 'Shop'}
            </h3>
            <ul className="space-y-2">
              {footerCategories.map((cat) => (
                <li key={cat.path}>
                  <Link to={cat.path} className={linkClass}>
                    {cat.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-primary mb-3">
              {language === 'ar' ? 'تواصل' : 'Contact'}
            </h3>
            <ul className="space-y-2">
              <li>
                <a href="tel:+201080755516" className={`flex items-center gap-2 ${linkClass}`}>
                  <Phone className="h-4 w-4 text-primary shrink-0" aria-hidden />
                  <span dir="ltr">010 80755516</span>
                </a>
              </li>
              <li>
                <a href="mailto:info@wilson-eg.com" className={`flex items-center gap-2 ${linkClass}`}>
                  <Mail className="h-4 w-4 text-primary shrink-0" aria-hidden />
                  <span dir="ltr">info@wilson-eg.com</span>
                </a>
              </li>
              <li className="flex items-start gap-2 text-[hsl(var(--footer-muted))] text-sm">
                <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden />
                <span>{language === 'ar' ? 'القاهرة، مصر' : 'Cairo, Egypt'}</span>
              </li>
            </ul>
            <div className="flex gap-2 mt-3" aria-label={language === 'ar' ? 'وسائل التواصل' : 'Social links'}>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="p-2 rounded-lg bg-[hsl(var(--footer-border))] hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="p-2 rounded-lg bg-[hsl(var(--footer-border))] hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-[hsl(var(--footer-border))]">
        <div className="container-wide py-4 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-[hsl(var(--footer-muted))]">
          <p>© {new Date().getFullYear()} Wilson Egypt. {t('footer.rights')}</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-primary transition-colors">
              {language === 'ar' ? 'سياسة الخصوصية' : 'Privacy'}
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              {language === 'ar' ? 'الشروط' : 'Terms'}
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
