import { Link } from 'react-router-dom'
import { useLanguage } from '@/contexts/LanguageContext'
import { Users, Shield, Heart, Sparkles, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PageBreadcrumb } from '@/components/customer/PageBreadcrumb'
import { ApplianceDoodleBg } from '@/components/customer/ApplianceDoodleBg'

const ABOUT_COVER_IMG = '/wilson-egypt/images/wep-site-cover-2-e1717660770248.jpg'

const AboutPage = () => {
  const { language, t, isRTL } = useLanguage()

  const values = [
    { icon: Shield, titleAr: 'الجودة أولاً', titleEn: 'Quality First' },
    { icon: Heart, titleAr: 'الصدق والشفافية', titleEn: 'Honesty & Transparency' },
    { icon: Users, titleAr: 'خدمة حقيقية', titleEn: 'Real Service' },
    { icon: Sparkles, titleAr: 'الابتكار المستمر', titleEn: 'Continuous Innovation' },
  ]

  return (
    <div className="min-h-screen" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <PageBreadcrumb
        items={[
          { label: t('nav.home'), href: '/' },
          { label: t('nav.about') },
        ]}
        dir={isRTL ? 'rtl' : 'ltr'}
        ariaLabel={isRTL ? 'مسار الصفحة' : 'Breadcrumb'}
      />
      {/* Hero — same treatment as Service/Contact: doodle, gold mesh, rounded */}
      <section className="page-hero-vision page-hero-appliance-doodle gold-mesh-hero hero-rounded relative section-padding-hero">
        <ApplianceDoodleBg className="z-0" opacity={0.24} variant="mix" animated />
        <div className="container-wide text-center relative z-10">
          <div className="mx-auto max-w-3xl flex flex-col items-center">
            <h1 className="text-h1 font-bold text-foreground mb-4 sm:mb-5 md:mb-6 title-underline-gold title-underline-gold-center">
              {t('nav.about')}
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl">
              {language === 'ar'
                ? 'صُنع للبيت المصري - أجهزة منزلية بجودة عالمية'
                : 'Made for Egyptian Homes - World-class home appliances'}
            </p>
          </div>
        </div>
      </section>

      {/* Story — two-column: copy + cover image */}
      <section className="section-padding section-creative-warm">
        <div className="container-wide">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
            <div className="space-y-6 max-w-xl">
              <h2 className="text-h3 font-bold text-foreground title-underline-gold">
                {language === 'ar' ? 'قصتنا' : 'Our Story'}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {language === 'ar'
                  ? 'البيت المصري ليه احتياجات مختلفة. المطبخ بيشتغل من الفجر. العيلة كبيرة. الكهرباء مش مستقرة. الجو قاسي. الميزانية محسوبة.'
                  : 'Egyptian homes have different needs. The kitchen works from dawn. Families are large. Electricity is unstable. Weather is harsh. Budgets are tight.'}
              </p>
              <p className="text-muted-foreground leading-relaxed">
                {language === 'ar'
                  ? 'عشان كده بدأنا ويلسون. نصنع أجهزة منزلية يفتخر بيها كل بيت مصري.'
                  : "That's why we started Wilson. We make home appliances every Egyptian home can be proud of."}
              </p>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-xl ring-1 ring-black/5 aspect-[4/3] bg-muted/30">
              <img
                src={ABOUT_COVER_IMG}
                alt={language === 'ar' ? 'ويلسون مصر — صُنع للبيت المصري' : 'Wilson Egypt — Made for Egyptian homes'}
                className="w-full h-full object-cover object-center"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values — gold-glow cards */}
      <section className="section-padding section-creative-accent">
        <div className="container-wide">
          <h2 className="text-h3 font-bold text-foreground mb-8 text-center title-underline-gold title-underline-gold-center">
            {language === 'ar' ? 'قيمنا' : 'Our Values'}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <div
                key={index}
                className="text-center p-6 bg-card rounded-2xl border border-border gold-glow"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <value.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">
                  {language === 'ar' ? value.titleAr : value.titleEn}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding cta-vision">
        <div className="container-wide text-center">
          <p className="text-muted-foreground mb-6">
            {language === 'ar' ? 'اكتشف منتجاتنا أو تواصل معنا' : 'Explore our products or get in touch'}
          </p>
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            <Button asChild size="lg" className="min-h-[44px] cta-primary">
              <Link to="/products" className="inline-flex items-center gap-2">
                {language === 'ar' ? 'اكتشف المنتجات' : 'Explore products'}
                <ArrowLeft className="h-5 w-5 rtl:rotate-180 shrink-0" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="min-h-[44px] border-primary text-primary hover:bg-primary/10">
              <Link to="/contact">{language === 'ar' ? 'تواصل معنا' : 'Contact us'}</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default AboutPage
