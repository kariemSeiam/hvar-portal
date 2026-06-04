import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { WilsonLogo } from '@/components/layout/WilsonLogo'
import { ShieldCheck, MessageCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const LoginPage = () => {
  const { t, language } = useLanguage()
  const { requestOtp, isLoading, isAuthenticated } = useAuth()
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!phone.trim()) return
    try {
      const user = await requestOtp(phone.trim())
      navigate(user?.role === 'admin' ? '/admin-portal' : '/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in')
    }
  }

  const isRTL = language === 'ar'

  return (
    <div
      className={cn(
        'flex min-h-[100dvh] flex-col section-creative-warm',
        'px-4 py-6 sm:px-6 sm:py-8 md:py-10'
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
      aria-label={isRTL ? 'تسجيل الدخول' : 'Log in'}
    >
      {/* Single centered column: logo + form (modern one-column auth layout) */}
      <div className="flex flex-1 min-h-0 w-full flex-col items-center justify-center">
        <div className="w-full max-w-sm flex flex-col items-center gap-6 sm:gap-8">
          <WilsonLogo size="login" />

          {/* Form card */}
          <section
            className={cn(
              'w-full rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6 md:p-8',
              'transition-[border-color,box-shadow] duration-200',
              'hover:border-primary/20 hover:shadow-card-hover focus-within:border-primary/30'
            )}
            aria-labelledby="login-title"
          >
            {/* Title — Wilson section title, centered */}
            <div className="flex justify-center mb-1.5 sm:mb-2">
              <h1
                id="login-title"
                className={cn(
                  'text-h2 font-bold text-foreground text-center',
                  'title-underline-gold title-underline-gold-center'
                )}
              >
                {isRTL ? 'تسجيل الدخول' : 'Log in'}
              </h1>
            </div>
            <p className="text-muted-foreground text-center text-sm sm:text-base mb-4 sm:mb-6">
              {isRTL ? 'أدخل رقم هاتفك للمتابعة' : 'Enter your phone to continue'}
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              {/* Phone input — +20 prefix (LTR block: numbers always flow left-to-right) */}
              <div className="relative" dir="ltr">
                <label htmlFor="login-phone" className="sr-only">
                  {isRTL ? 'رقم الهاتف' : 'Phone number'}
                </label>
                <div
                  className="absolute start-0 top-0 bottom-0 flex w-14 items-center justify-center border-e border-border bg-muted/30 rounded-s-xl pointer-events-none select-none"
                  aria-hidden
                >
                  <span className="text-sm font-semibold tabular-nums text-muted-foreground">+20</span>
                </div>
                <Input
                  id="login-phone"
                  name="phone"
                  type="tel"
                  placeholder={isRTL ? '01X XXXX XXXX' : '01X XXXX XXXX'}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="min-h-[48px] w-full text-base tabular-nums ps-[4.5rem] pe-4 rounded-xl"
                  required
                  autoComplete="tel-national"
                  inputMode="tel"
                  error={!!error}
                  aria-invalid={!!error}
                  aria-describedby={error ? 'login-error' : undefined}
                />
              </div>

              {error && (
                <p id="login-error" className="text-sm text-destructive text-center">
                  {error}
                </p>
              )}

              {/* ONE gold CTA per viewport */}
              <Button
                type="submit"
                className="w-full min-h-[48px] text-base font-semibold shadow-gold-cta hover:shadow-gold-cta-hover"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin shrink-0" aria-hidden />
                    <span>{t('common.loading')}</span>
                  </>
                ) : (
                  isRTL ? 'دخول' : 'Sign in'
                )}
              </Button>
            </form>
          </section>

          {/* Trust line — warranty + WhatsApp */}
          <div className="mt-4 sm:mt-5 flex flex-col items-center gap-1.5 sm:gap-2 text-[0.8125rem] text-muted-foreground leading-[1.7]">
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                <span>{isRTL ? 'ضمان ٥ سنوات' : '5-year warranty'}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MessageCircle className="h-4 w-4 shrink-0 text-[#25D366]" aria-hidden />
                <span>{isRTL ? 'دعم واتساب' : 'WhatsApp support'}</span>
              </span>
            </div>
            <p className="text-center max-w-[16rem] leading-[1.7]">
              {isRTL
                ? 'لا تسجيل مطلوب للشراء — اطلب برقمك مباشرة'
                : 'No signup needed — checkout with your phone anytime'}
            </p>
          </div>
        </div>
      </div>

      {/* Footer hint — one-screen */}
      <p className="w-full max-w-sm mx-auto shrink-0 mt-auto pt-4 sm:pt-5 md:pt-6 text-center text-[0.75rem] text-muted-foreground/70">
        {isRTL
          ? 'بالمتابعة، أنت توافق على شروط خدمة ويلسن'
          : 'By continuing, you agree to Wilson\'s terms of service'}
      </p>
    </div>
  )
}

export default LoginPage
