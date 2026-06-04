import { useState, useEffect, useCallback, useRef } from 'react'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const WILSON_HERO_SLIDES = [
  { img: '/wilson-egypt/images/wilson-gas-range.png', alt: 'Wilson gas range — نار مظبوطة لكل أكلة' },
  { img: '/wilson-egypt/images/wilson-vacuum.png', alt: 'Wilson vacuum — التنضيف السهل بيبدأ بقرار واحد' },
  { img: '/wilson-egypt/images/wilson-kettle-tea.png', alt: 'Wilson kettle — اشرب الشاي بمزاج مع كاتيل ويلسن' },
  { img: '/wilson-egypt/images/wilson-electric-oven.png', alt: 'Wilson electric oven — حجة قبل النوم' },
  { img: '/wilson-egypt/images/wilson-stand-mixer.png', alt: 'Wilson stand mixer — أداء احترافي في كل وصفة مع ويلسن' },
  { img: '/wilson-egypt/images/wep-site-cover-2-e1717660770248.jpg', alt: 'Wilson products' },
]

const INTERVAL_MS = 5500
const SWIPE_THRESHOLD_PX = 50

interface HeroCarouselProps {
  className?: string
  showOverlay?: boolean
  paused?: boolean
  /** Controlled: sync with hero card swipe */
  activeIndex?: number
  onIndexChange?: (index: number) => void
}

export const HeroCarousel = ({
  className = '',
  showOverlay = true,
  paused = false,
  activeIndex: controlledIndex,
  onIndexChange,
}: HeroCarouselProps) => {
  const [internalIndex, setInternalIndex] = useState(0)
  const isControlled = controlledIndex !== undefined && onIndexChange !== undefined
  const activeIndex = isControlled ? controlledIndex : internalIndex

  const goTo = useCallback(
    (index: number) => {
      const nextIndex = (index + WILSON_HERO_SLIDES.length) % WILSON_HERO_SLIDES.length
      if (isControlled) onIndexChange!(nextIndex)
      else setInternalIndex(nextIndex)
    },
    [isControlled, onIndexChange]
  )

  const next = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo])
  const prev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo])

  useEffect(() => {
    if (paused || prefersReducedMotion()) return
    const t = setInterval(next, INTERVAL_MS)
    return () => clearInterval(t)
  }, [next, paused])

  const touchStartX = useRef<number | null>(null)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX
  }, [])
  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current === null) return
      const endX = e.changedTouches[0].clientX
      const delta = touchStartX.current - endX
      touchStartX.current = null
      if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return
      if (delta > 0) next()
      else prev()
    },
    [next, prev]
  )

  return (
    <div
      className={`relative w-full h-full overflow-hidden ${className}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {WILSON_HERO_SLIDES.map((slide, i) => (
        <div
          key={slide.img}
          className={`absolute inset-0 transition-opacity duration-700 ease-out ${
            i === activeIndex ? 'opacity-100 z-0' : 'opacity-0 z-0 pointer-events-none'
          }`}
          aria-hidden={i !== activeIndex}
        >
          <img
            src={slide.img}
            alt={slide.alt}
            className="w-full h-full object-cover hero-carousel-img"
            loading={i === 0 ? 'eager' : 'lazy'}
            {...(i === 0 ? ({ fetchpriority: 'high' } as React.ImgHTMLAttributes<HTMLImageElement>) : {})}
            decoding="async"
            sizes="100vw"
          />
          {showOverlay && (
            <div
              className="absolute inset-0 hero-carousel-overlay"
              aria-hidden
            />
          )}
        </div>
      ))}

      {/* Dots — 44px touch target, safe-area, responsive */}
      <div
        className="absolute left-1/2 -translate-x-1/2 z-10 flex gap-1.5 sm:gap-2 items-center"
        style={{ bottom: 'max(0.75rem, env(safe-area-inset-bottom, 0.75rem))' }}
        role="tablist"
        aria-label="Hero slides"
      >
        {WILSON_HERO_SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === activeIndex}
            aria-label={`Slide ${i + 1}`}
            onClick={() => goTo(i)}
            onMouseEnter={() => goTo(i)}
            className={`min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center rounded-full transition-all duration-300 touch-manipulation ${
              i === activeIndex
                ? 'w-5 sm:w-6 h-2 sm:h-2.5 bg-[hsl(var(--hero-accent))]'
                : 'w-2 h-2 sm:w-2 sm:h-2 bg-white/40 hover:bg-white/60'
            }`}
          />
        ))}
      </div>

      {/* Prev/Next — 44px touch, tablet+ visible (hidden on mobile to avoid clutter) */}
      <button
        type="button"
        onClick={prev}
        aria-label="Previous slide"
        className="hidden md:flex absolute top-1/2 start-4 -translate-y-1/2 z-10 min-w-[44px] min-h-[44px] rounded-full bg-white/10 hover:bg-white/20 active:scale-95 backdrop-blur-sm items-center justify-center text-white transition-all touch-manipulation"
      >
        <svg className="w-5 h-5 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        type="button"
        onClick={next}
        aria-label="Next slide"
        className="hidden md:flex absolute top-1/2 end-4 -translate-y-1/2 z-10 min-w-[44px] min-h-[44px] rounded-full bg-white/10 hover:bg-white/20 active:scale-95 backdrop-blur-sm items-center justify-center text-white transition-all touch-manipulation"
      >
        <svg className="w-5 h-5 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  )
}
