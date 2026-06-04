import { useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Shield, Clock, Phone, Wrench, FileCheck, ClipboardList, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { contactApi } from '@/services/api'
import { useToast } from '@/hooks/useToast'
import { ApplianceDoodleBg } from '@/components/customer/ApplianceDoodleBg'
import { PageBreadcrumb } from '@/components/customer/PageBreadcrumb'
import { useInView, staggerDelay } from '@/hooks/useInView'
import { WHATSAPP_URL } from '@/components/customer/checkout/constants'
import { cn } from '@/lib/utils'

type WarrantyErrors = { name?: string; phone?: string; productCode?: string }
type ServiceErrors = { name?: string; phone?: string; issue?: string }

const ServicePage = () => {
  const { t, language } = useLanguage()
  const { toast } = useToast()
  const [warrantyForm, setWarrantyForm] = useState({ name: '', phone: '', productCode: '', serial: '' })
  const [serviceForm, setServiceForm] = useState({ name: '', phone: '', productCode: '', issue: '' })
  const [submitting, setSubmitting] = useState<'warranty' | 'service' | null>(null)
  const [warrantyErrors, setWarrantyErrors] = useState<WarrantyErrors>({})
  const [serviceErrors, setServiceErrors] = useState<ServiceErrors>({})

  const validateWarranty = (): boolean => {
    const next: WarrantyErrors = {}
    if (!warrantyForm.name.trim()) next.name = t('contact.validation.nameRequired')
    if (!warrantyForm.phone.trim()) next.phone = t('contact.validation.phoneRequired')
    if (!warrantyForm.productCode.trim()) next.productCode = t('service.validation.productCodeRequired')
    setWarrantyErrors(next)
    return Object.keys(next).length === 0
  }

  const validateService = (): boolean => {
    const next: ServiceErrors = {}
    if (!serviceForm.name.trim()) next.name = t('contact.validation.nameRequired')
    if (!serviceForm.phone.trim()) next.phone = t('contact.validation.phoneRequired')
    if (!serviceForm.issue.trim()) next.issue = t('service.validation.issueRequired')
    setServiceErrors(next)
    return Object.keys(next).length === 0
  }

  const handleWarrantySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateWarranty()) return
    setSubmitting('warranty')
    setWarrantyErrors({})
    try {
      await contactApi.sendMessage({
        name: warrantyForm.name,
        phone: warrantyForm.phone,
        message: `[WARRANTY REGISTRATION]\nProduct: ${warrantyForm.productCode}\nSerial: ${warrantyForm.serial}`,
      })
      toast({ title: t('service.submitted'), variant: 'default' })
      setWarrantyForm({ name: '', phone: '', productCode: '', serial: '' })
    } catch (err) {
      toast({ title: t('service.submitError'), variant: 'destructive' })
    } finally {
      setSubmitting(null)
    }
  }

  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateService()) return
    setSubmitting('service')
    setServiceErrors({})
    try {
      await contactApi.sendMessage({
        name: serviceForm.name,
        phone: serviceForm.phone,
        message: `[SERVICE REQUEST]\nProduct: ${serviceForm.productCode || 'N/A'}\nIssue: ${serviceForm.issue}`,
      })
      toast({ title: t('service.submitted'), variant: 'default' })
      setServiceForm({ name: '', phone: '', productCode: '', issue: '' })
    } catch (err) {
      toast({ title: t('service.submitError'), variant: 'destructive' })
    } finally {
      setSubmitting(null)
    }
  }

  const warrantyFeatures = [
    {
      icon: Shield,
      title: language === 'ar' ? 'سنتين ضمان شامل' : '2 Years Full Warranty',
      desc:
        language === 'ar'
          ? 'ضمان شامل على كل الأجزاء والعمالة'
          : 'Full warranty on all parts and labor',
    },
    {
      icon: Clock,
      title: language === 'ar' ? '10 سنين ضمان الكومبريسور' : '10 Years Compressor Warranty',
      desc:
        language === 'ar'
          ? 'ضمان ممتد للثلاجات والفريزرات'
          : 'Extended warranty for refrigerators and freezers',
    },
    {
      icon: Wrench,
      title: language === 'ar' ? 'قطع غيار أصلية' : 'Original Spare Parts',
      desc:
        language === 'ar'
          ? 'قطع غيار متوفرة دائماً في كل مراكز الخدمة'
          : 'Parts always available at all service centers',
    },
  ]

  const steps = [
    { step: 1, title: language === 'ar' ? 'اتصل أو ابعت واتساب' : 'Call or WhatsApp', sub: language === 'ar' ? 'أي وقت' : 'Anytime' },
    { step: 2, title: language === 'ar' ? 'رد خلال ساعتين' : 'We reply within 2 hours', sub: language === 'ar' ? 'فني يتواصل معاك' : 'Technician confirms' },
    { step: 3, title: language === 'ar' ? 'زيارة خلال 48 ساعة' : 'Home visit in 48 hours', sub: language === 'ar' ? 'زيارة منزلية مجانية' : 'Free home visit' },
    { step: 4, title: language === 'ar' ? 'إصلاح أو استبدال مضمون' : 'Repair or replace — guaranteed', sub: language === 'ar' ? 'قطع أصلية' : 'Original parts' },
  ]

  const isRTL = language === 'ar'
  const whatsappServiceText = isRTL ? 'السلام عليكم، أريد طلب صيانة' : 'Hi, I need a service request'
  const whatsappHref = `${WHATSAPP_URL}?text=${encodeURIComponent(whatsappServiceText)}`
  const phoneHref = 'tel:+201080755516'

  const warrantyRef = useInView<HTMLElement>({ threshold: 0.1 })
  const processRef = useInView<HTMLElement>({ threshold: 0.1 })
  const formsRef = useInView<HTMLElement>({ threshold: 0.1 })
  const centersRef = useInView<HTMLElement>({ threshold: 0.1 })

  return (
    <div className="min-h-screen" dir={isRTL ? 'rtl' : 'ltr'}>
      <PageBreadcrumb
        items={[
          { label: t('nav.home'), href: '/' },
          { label: t('service.title') },
        ]}
        dir={isRTL ? 'rtl' : 'ltr'}
        ariaLabel={isRTL ? 'مسار الصفحة' : 'Breadcrumb'}
      />
      {/* Hero — Wilson: responsive gapping, one focal CTA, gold mesh, trust line */}
      <section className="page-hero-vision page-hero-appliance-doodle gold-mesh-hero hero-rounded relative section-padding-hero">
        <ApplianceDoodleBg className="z-0" opacity={0.24} variant="mix" animated />
        <div className="container-wide text-center relative z-10">
          <div className="mx-auto max-w-3xl flex flex-col items-center">
            <h1 className="text-h1 font-bold text-foreground mb-4 sm:mb-5 md:mb-6 title-underline-gold title-underline-gold-center">
              {t('service.title')}
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-2 sm:mb-3 max-w-2xl">
              {language === 'ar' ? 'معاك طول العمر' : 'With you for life'}
            </p>
            <p className="text-sm sm:text-base text-muted-foreground font-medium mb-6 sm:mb-8 md:mb-10" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {t('service.hero.trust')}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-5">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'whatsapp-cta inline-flex items-center gap-2 rounded-xl border-2 px-5 py-3 min-h-[44px]',
                'border-[#25D366]/40 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/15 transition-colors',
                'font-medium text-sm'
              )}
              aria-label={t('cta.whatsapp')}
            >
              <MessageCircle className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
              {t('cta.whatsapp')}
            </a>
            <a
              href={phoneHref}
              className="inline-flex items-center justify-center gap-2.5 rounded-xl text-primary bg-transparent px-6 py-3 font-semibold hover:bg-primary/10 active:scale-[0.98] transition-all min-h-[44px]"
              aria-label={t('cta.call')}
            >
              <Phone className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
              {t('cta.call')}
            </a>
            </div>
          </div>
        </div>
      </section>

      {/* Warranty — same strip as Home Why Wilson (section-alt-vision + why-strip); no top padding/margin */}
      <section
        ref={warrantyRef.ref}
        className={cn(
          'reveal-section section-padding section-alt-vision pt-0 mt-0',
          warrantyRef.isInView && 'in-view'
        )}
      >
        <div className="container-wide">
          <h2 className="text-h2 font-bold text-foreground mb-8 text-start title-underline-gold">
            {t('service.warranty.title')}
          </h2>
          <div className="why-strip">
            {warrantyFeatures.map((feature, index) => (
              <article key={index} className="why-strip-item reveal-child" style={staggerDelay(index + 1, 100)}>
                <span className="why-strip-num" aria-hidden>{index + 1}</span>
                <div className="why-strip-text">
                  <h3>{feature.title}</h3>
                  <p>{feature.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Service Process — one card, step rows: number + gold bar + text (Wilson: gold sparingly) */}
      <section
        ref={processRef.ref}
        className={cn(
          'reveal-section section-padding section-creative-elevated',
          processRef.isInView && 'in-view'
        )}
      >
        <div className="container-wide max-w-3xl">
          <h2 className="text-h2 font-bold text-foreground mb-2 text-start title-underline-gold">
            {t('service.process.title')}
          </h2>
          <p className="text-base text-muted-foreground max-w-2xl mb-8">
            {language === 'ar' ? 'أربع خطوات بسيطة من الاتصال حتى الإصلاح' : 'Four simple steps from contact to repair'}
          </p>
          <div className="profile-card-doodle rounded-2xl border border-border bg-card p-6 sm:p-8 overflow-hidden">
            <ol className="service-steps-horizontal" role="list" aria-label={language === 'ar' ? 'خطوات الخدمة' : 'Service steps'}>
              {steps.map((step, index) => (
                <li key={index} className="service-step-h reveal-child" style={staggerDelay(index, 80)}>
                  <div className="service-step-h-track">
                    <div className="service-step-h-dot" aria-hidden>
                      <span className="font-bold tabular-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>{step.step}</span>
                    </div>
                    {index < steps.length - 1 && <span className="service-step-h-connector" aria-hidden />}
                  </div>
                  <div className="service-step-h-content">
                    <p className="font-semibold text-foreground text-sm sm:text-base leading-snug">{step.title}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{step.sub}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Warranty Registration + Service Request — doodle form cards (Wilson: one primary CTA per card) */}
      <section
        ref={formsRef.ref}
        className={cn(
          'reveal-section section-padding section-creative-accent',
          formsRef.isInView && 'in-view'
        )}
      >
        <div className="container-wide">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-10">
            <div className="reveal-child profile-card-doodle rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-5 hover:border-primary/20 transition-colors" style={staggerDelay(0, 80)}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileCheck className="h-6 w-6 text-primary" aria-hidden />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">{t('service.warrantyReg')}</h3>
                  <p className="text-sm text-muted-foreground">{t('service.warrantyReg.desc')}</p>
                </div>
              </div>
              <form onSubmit={handleWarrantySubmit} className="space-y-4">
                <div>
                  <Input
                    placeholder={t('contact.form.name')}
                    value={warrantyForm.name}
                    onChange={(e) => {
                      setWarrantyForm((f) => ({ ...f, name: e.target.value }))
                      if (warrantyErrors.name) setWarrantyErrors((p) => ({ ...p, name: undefined }))
                    }}
                    required
                    aria-label={t('contact.form.name')}
                    aria-invalid={!!warrantyErrors.name}
                    error={!!warrantyErrors.name}
                  />
                  {warrantyErrors.name && <p className="text-sm text-destructive mt-1">{warrantyErrors.name}</p>}
                </div>
                <div>
                  <Input
                    placeholder={t('contact.form.phone')}
                    type="tel"
                    value={warrantyForm.phone}
                    onChange={(e) => {
                      setWarrantyForm((f) => ({ ...f, phone: e.target.value }))
                      if (warrantyErrors.phone) setWarrantyErrors((p) => ({ ...p, phone: undefined }))
                    }}
                    required
                    aria-label={t('contact.form.phone')}
                    aria-invalid={!!warrantyErrors.phone}
                    error={!!warrantyErrors.phone}
                  />
                  {warrantyErrors.phone && <p className="text-sm text-destructive mt-1">{warrantyErrors.phone}</p>}
                </div>
                <div>
                  <Input
                    placeholder={t('service.form.productCode')}
                    value={warrantyForm.productCode}
                    onChange={(e) => {
                      setWarrantyForm((f) => ({ ...f, productCode: e.target.value }))
                      if (warrantyErrors.productCode) setWarrantyErrors((p) => ({ ...p, productCode: undefined }))
                    }}
                    required
                    aria-label={t('service.form.productCode')}
                    aria-invalid={!!warrantyErrors.productCode}
                    error={!!warrantyErrors.productCode}
                  />
                  {warrantyErrors.productCode && <p className="text-sm text-destructive mt-1">{warrantyErrors.productCode}</p>}
                </div>
                <div>
                  <Input
                    placeholder={t('service.form.serial')}
                    value={warrantyForm.serial}
                    onChange={(e) => setWarrantyForm((f) => ({ ...f, serial: e.target.value }))}
                    aria-label={t('service.form.serial')}
                  />
                </div>
                <Button type="submit" variant="default" className="w-full min-h-[44px] shadow-[0_2px_10px_hsl(var(--gold-glow)/0.2)]" disabled={!!submitting}>
                  {submitting === 'warranty' ? t('common.loading') : t('contact.form.submit')}
                </Button>
              </form>
            </div>
            <div className="reveal-child profile-card-doodle rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-5 hover:border-primary/20 transition-colors" style={staggerDelay(1, 80)}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <ClipboardList className="h-6 w-6 text-primary" aria-hidden />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">{t('service.request')}</h3>
                  <p className="text-sm text-muted-foreground">{t('service.request.desc')}</p>
                </div>
              </div>
              <form onSubmit={handleServiceSubmit} className="space-y-4">
                <div>
                  <Input
                    placeholder={t('contact.form.name')}
                    value={serviceForm.name}
                    onChange={(e) => {
                      setServiceForm((f) => ({ ...f, name: e.target.value }))
                      if (serviceErrors.name) setServiceErrors((p) => ({ ...p, name: undefined }))
                    }}
                    required
                    aria-label={t('contact.form.name')}
                    aria-invalid={!!serviceErrors.name}
                    error={!!serviceErrors.name}
                  />
                  {serviceErrors.name && <p className="text-sm text-destructive mt-1">{serviceErrors.name}</p>}
                </div>
                <div>
                  <Input
                    placeholder={t('contact.form.phone')}
                    type="tel"
                    value={serviceForm.phone}
                    onChange={(e) => {
                      setServiceForm((f) => ({ ...f, phone: e.target.value }))
                      if (serviceErrors.phone) setServiceErrors((p) => ({ ...p, phone: undefined }))
                    }}
                    required
                    aria-label={t('contact.form.phone')}
                    aria-invalid={!!serviceErrors.phone}
                    error={!!serviceErrors.phone}
                  />
                  {serviceErrors.phone && <p className="text-sm text-destructive mt-1">{serviceErrors.phone}</p>}
                </div>
                <div>
                  <Input
                    placeholder={t('service.form.productCode')}
                    value={serviceForm.productCode}
                    onChange={(e) => setServiceForm((f) => ({ ...f, productCode: e.target.value }))}
                    aria-label={t('service.form.productCode')}
                  />
                </div>
                <div>
                  <Textarea
                    placeholder={t('service.form.issue')}
                    value={serviceForm.issue}
                    onChange={(e) => {
                      setServiceForm((f) => ({ ...f, issue: e.target.value }))
                      if (serviceErrors.issue) setServiceErrors((p) => ({ ...p, issue: undefined }))
                    }}
                    rows={3}
                    required
                    aria-label={t('service.form.issue')}
                    aria-invalid={!!serviceErrors.issue}
                    error={!!serviceErrors.issue}
                  />
                  {serviceErrors.issue && <p className="text-sm text-destructive mt-1">{serviceErrors.issue}</p>}
                </div>
                <Button type="submit" variant="default" className="w-full min-h-[44px] shadow-[0_2px_10px_hsl(var(--gold-glow)/0.2)]" disabled={!!submitting}>
                  {submitting === 'service' ? t('common.loading') : t('contact.form.submit')}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Service Centers — list + one CTA band (Wilson: one primary per fold) */}
      <section
        ref={centersRef.ref}
        className={cn(
          'reveal-section section-padding cta-vision',
          centersRef.isInView && 'in-view'
        )}
      >
        <div className="container-wide max-w-3xl mx-auto">
          <h2 className="text-h2 font-bold text-foreground mb-2 text-start title-underline-gold">
            {t('service.centers')}
          </h2>
          <p className="text-base text-muted-foreground mb-8">
            {language === 'ar' ? 'مراكزنا في القاهرة والإسكندرية والمنصورة' : 'Our centers in Cairo, Alexandria & Mansoura'}
          </p>
          <ul className="space-y-1 divide-y divide-border">
            {[
              { city: language === 'ar' ? 'القاهرة' : 'Cairo', areas: ['Maadi', 'Nasr City', 'Sheikh Zayed'] },
              { city: language === 'ar' ? 'الإسكندرية' : 'Alexandria', areas: ['Smouha', 'Agami'] },
              { city: language === 'ar' ? 'المنصورة' : 'Mansoura', areas: [language === 'ar' ? 'وسط المدينة' : 'City Center'] },
            ].map((center, index) => (
              <li
                key={index}
                className="reveal-child py-4 first:pt-0"
                style={staggerDelay(index, 50)}
              >
                <span className="font-bold text-foreground">{center.city}</span>
                <span className="text-muted-foreground text-sm ms-2">{center.areas.join(', ')}</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="whatsapp-cta inline-flex items-center justify-center gap-2 rounded-xl border-2 px-5 py-3 min-h-[44px] border-[#25D366]/40 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/15 transition-colors font-medium text-sm"
              aria-label={t('cta.whatsapp')}
            >
              <MessageCircle className="h-5 w-5" aria-hidden />
              {t('cta.whatsapp')}
            </a>
            <a
              href={phoneHref}
              className="inline-flex items-center justify-center gap-2 rounded-xl text-primary px-6 py-3 font-semibold hover:bg-primary/10 transition-colors min-h-[44px]"
              aria-label={t('cta.call')}
            >
              <Phone className="h-5 w-5" aria-hidden />
              {t('cta.call')}
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}

export default ServicePage
