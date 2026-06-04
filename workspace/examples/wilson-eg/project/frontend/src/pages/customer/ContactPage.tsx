import { useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Phone, Mail, MapPin, Clock, MessageCircle } from 'lucide-react'
import { PageBreadcrumb } from '@/components/customer/PageBreadcrumb'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import { contactApi } from '@/services/api'
import { toast } from '@/hooks/useToast'
import { useInView, staggerDelay } from '@/hooks/useInView'
import { cn } from '@/lib/utils'
import { WHATSAPP_URL } from '@/components/customer/checkout/constants'
import { ApplianceDoodleBg } from '@/components/customer/ApplianceDoodleBg'

const ContactPage = () => {
  const { t, language } = useLanguage()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ name?: string; phone?: string; message?: string }>({})

  const mainSection = useInView<HTMLElement>({ threshold: 0.1 })

  const contactInfo = [
    { icon: Phone, label: t('contact.phone'), href: 'tel:+201080755516' },
    { icon: Mail, label: t('contact.email'), href: 'mailto:info@wilson-eg.com' },
    { icon: MapPin, label: t('contact.location'), href: undefined },
    { icon: Clock, label: t('contact.hours'), href: undefined },
  ]

  const validate = (): boolean => {
    const next: typeof errors = {}
    if (!name.trim()) next.name = t('contact.validation.nameRequired')
    if (!phone.trim()) next.phone = t('contact.validation.phoneRequired')
    if (!message.trim()) next.message = t('contact.validation.messageRequired')
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setIsSubmitting(true)
    setErrors({})
    try {
      await contactApi.sendMessage({
        name: name.trim(),
        phone: phone.trim(),
        message: message.trim(),
      })
      toast({
        title: t('contact.successTitle'),
        description: t('contact.successDesc'),
        variant: 'success',
      })
      setName('')
      setPhone('')
      setMessage('')
    } catch {
      toast({
        title: t('contact.errorTitle'),
        description: t('contact.errorDesc'),
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const whatsappHref = `${WHATSAPP_URL}?text=${encodeURIComponent(
    language === 'ar' ? 'السلام عليكم، عندي استفسار' : 'Hi, I have a question'
  )}`

  const isRTL = language === 'ar'

  return (
    <div className="min-h-screen" dir={isRTL ? 'rtl' : 'ltr'}>
      <PageBreadcrumb
        items={[
          { label: t('nav.home'), href: '/' },
          { label: t('nav.contact') },
        ]}
        dir={isRTL ? 'rtl' : 'ltr'}
        ariaLabel={isRTL ? 'مسار الصفحة' : 'Breadcrumb'}
      />
      {/* Hero — Wilson: same as ServicePage, responsive gapping, one focal CTA, gold mesh */}
      <section className="page-hero-vision page-hero-appliance-doodle gold-mesh-hero hero-rounded relative section-padding-hero">
        <ApplianceDoodleBg className="z-0" opacity={0.24} variant="mix" animated />
        <div className="container-wide text-center relative z-10">
          <div className="mx-auto max-w-3xl flex flex-col items-center">
            <h1 className="text-h1 font-bold text-foreground mb-4 sm:mb-5 md:mb-6 title-underline-gold title-underline-gold-center">
              {t('contact.title')}
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-2 sm:mb-3 max-w-2xl">
              {t('contact.heroSubtitle')}
            </p>
            <p className="text-sm sm:text-base text-muted-foreground font-medium mb-6 sm:mb-8 md:mb-10" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {t('contact.trustResponse')}
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
                href="tel:+201080755516"
                className="inline-flex items-center justify-center gap-2.5 rounded-xl text-primary bg-transparent px-6 py-3 font-semibold hover:bg-primary/10 active:scale-[0.98] transition-all min-h-[44px]"
                aria-label={t('cta.call')}
              >
                <Phone className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
                <span dir="ltr">{t('contact.phone')}</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Main content — contact info + form (scroll reveal, doodle cards) */}
      <section
        ref={mainSection.ref}
        className={cn(
          'reveal-section section-padding section-creative-warm',
          mainSection.isInView && 'in-view'
        )}
      >
        <div className="container-wide">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-12">
            {/* Contact info — card with doodle */}
            <div
              className="profile-card-doodle rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-6 reveal-child"
              style={staggerDelay(0)}
            >
              <h2 className="text-h3 font-bold text-foreground title-underline-gold">
                {t('contact.info')}
              </h2>
              <div className="space-y-4">
                {contactInfo.map((info, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 reveal-child"
                    style={staggerDelay(index + 1)}
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <info.icon className="h-6 w-6 text-primary" />
                    </div>
                    {info.href ? (
                      <a
                        href={info.href}
                        className="text-foreground hover:text-primary transition-colors font-medium"
                      >
                        {info.href.startsWith('tel:') ? <span dir="ltr">{info.label}</span> : info.label}
                      </a>
                    ) : (
                      <span className="text-foreground">{info.label}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Form — card with doodle */}
            <div
              className="profile-card-doodle rounded-2xl border border-border bg-card p-6 sm:p-8 reveal-child"
              style={staggerDelay(1)}
            >
              <h2 className="text-h3 font-bold text-foreground mb-6 title-underline-gold">
                {t('contact.sendMessage')}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="contact-name">{t('contact.form.name')}</Label>
                  <Input
                    id="contact-name"
                    type="text"
                    placeholder={t('contact.form.name')}
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value)
                      if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }))
                    }}
                    error={!!errors.name}
                    required
                    className="min-h-[44px]"
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-phone">{t('contact.form.phone')}</Label>
                  <Input
                    id="contact-phone"
                    type="tel"
                    placeholder={t('contact.form.phone')}
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value)
                      if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }))
                    }}
                    error={!!errors.phone}
                    required
                    dir={phone ? 'ltr' : (isRTL ? 'rtl' : 'ltr')}
                    className="min-h-[44px] tabular-nums"
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive">{errors.phone}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-message">{t('contact.form.message')}</Label>
                  <Textarea
                    id="contact-message"
                    placeholder={t('contact.form.message')}
                    rows={4}
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value)
                      if (errors.message) setErrors((prev) => ({ ...prev, message: undefined }))
                    }}
                    error={!!errors.message}
                    required
                    className="min-h-[120px]"
                  />
                  {errors.message && (
                    <p className="text-sm text-destructive">{errors.message}</p>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button
                    type="submit"
                    className="w-full sm:flex-1 cta-primary min-h-[44px]"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? t('common.loading') : t('contact.form.submit')}
                  </Button>
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      'whatsapp-cta inline-flex items-center justify-center gap-2 rounded-xl border-2 min-h-[44px] px-5',
                      'border-[#25D366]/40 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/15 transition-colors',
                      'font-medium text-sm shrink-0'
                    )}
                    aria-label={t('cta.whatsapp')}
                  >
                    <MessageCircle className="h-5 w-5" />
                    {t('cta.whatsapp')}
                  </a>
                </div>
                <p className="text-xs text-muted-foreground text-center sm:text-start pt-1">
                  {t('contact.trustResponse')}
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default ContactPage
