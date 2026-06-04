import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAuth } from '@/contexts/AuthContext'
import { Shield, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

const ADMIN_GATE_DURATION_MS = 2600

export default function AdminPortalPage() {
  const navigate = useNavigate()
  const { isAuthenticated, isAdmin, user } = useAuth()
  const { language } = useLanguage()
  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState<'seal' | 'reveal' | 'done'>('seal')

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true })
      return
    }
    if (!isAdmin) {
      navigate('/', { replace: true })
      return
    }

    const start = Date.now()
    const tick = () => {
      const elapsed = Date.now() - start
      const pct = Math.min(100, (elapsed / ADMIN_GATE_DURATION_MS) * 100)
      setProgress(pct)

      if (elapsed < 800) setPhase('seal')
      else if (elapsed < 1600) setPhase('reveal')
      else setPhase('done')

      if (elapsed < ADMIN_GATE_DURATION_MS) {
        requestAnimationFrame(tick)
      } else {
        navigate('/admin', { replace: true })
      }
    }
    const id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [isAuthenticated, isAdmin, navigate])

  const handleSkip = () => navigate('/admin', { replace: true })

  if (!isAuthenticated || !isAdmin) return null

  return (
    <div
      className="fixed inset-0 z-[100] overflow-hidden bg-stone-950"
      onClick={handleSkip}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleSkip()}
      aria-label={language === 'ar' ? 'انقر للدخول' : 'Click to enter'}
    >
      {/* Animated gradient backdrop */}
      <div className="absolute inset-0 bg-gradient-to-b from-stone-900 via-amber-950/20 to-stone-950" />
      <div
        className={cn(
          'absolute inset-0 opacity-30 transition-opacity duration-700',
          phase === 'reveal' && 'opacity-60'
        )}
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% 40%, hsl(38 99% 50% / 0.15), transparent 70%)',
        }}
      />

      {/* Floating gold particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-amber-400/40 animate-float"
            style={{
              left: `${15 + i * 7}%`,
              top: `${20 + (i % 5) * 15}%`,
              animationDelay: `${i * 0.15}s`,
              animationDuration: `${2.5 + (i % 3) * 0.5}s`,
            }}
          />
        ))}
      </div>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 px-6">
        {/* Golden seal icon with pulse */}
        <div
          className={cn(
            'relative transition-all duration-700',
            phase === 'seal' && 'scale-90 opacity-70',
            phase === 'reveal' && 'scale-100 opacity-100',
            phase === 'done' && 'scale-105'
          )}
        >
          <div className="absolute inset-0 rounded-full bg-amber-500/30 blur-2xl animate-pulse" />
          <div
            className={cn(
              'relative flex items-center justify-center w-28 h-28 rounded-full',
              'ring-4 ring-amber-500/50 ring-offset-4 ring-offset-stone-950',
              'bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700',
              'shadow-[0_0_40px_rgba(251,191,36,0.4)]',
              'transition-all duration-500',
              phase === 'reveal' && 'shadow-[0_0_60px_rgba(251,191,36,0.6)]'
            )}
          >
            <Shield className="w-12 h-12 text-stone-900" strokeWidth={2} />
            <Sparkles
              className={cn(
                'absolute -top-1 -end-1 w-5 h-5 text-amber-200',
                'animate-pulse',
                phase === 'reveal' ? 'opacity-100' : 'opacity-0'
              )}
            />
          </div>
        </div>

        {/* Text reveal */}
        <div className="text-center space-y-2">
          <p
            className={cn(
              'text-amber-400/90 font-medium text-lg tracking-wider uppercase transition-all duration-500',
              phase === 'seal' ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
            )}
          >
            {language === 'ar' ? 'تم التحقق' : 'Access Verified'}
          </p>
          <h1
            className={cn(
              'text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-600',
              'transition-all duration-700 delay-200',
              phase === 'seal' ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
            )}
          >
            {language === 'ar' ? `مرحباً ${user?.name || 'المشرف'}` : `Welcome, ${user?.name || 'Admin'}`}
          </h1>
          <p
            className={cn(
              'text-stone-400 text-sm mt-1 transition-all duration-500 delay-300',
              phase === 'reveal' || phase === 'done' ? 'opacity-100' : 'opacity-0'
            )}
          >
            {language === 'ar' ? 'لوحة تحكم ويلسون مصر' : 'Wilson Egypt Control Panel'}
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-48 h-1 rounded-full bg-stone-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-75 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Skip hint */}
        <p className="text-stone-500 text-xs animate-fade-in">
          {language === 'ar' ? 'انقر لأي مكان للدخول فوراً' : 'Click anywhere to enter'}
        </p>
      </div>
    </div>
  )
}
