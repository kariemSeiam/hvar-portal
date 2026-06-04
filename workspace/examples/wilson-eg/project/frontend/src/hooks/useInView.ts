import { useEffect, useRef, useState, useCallback } from 'react'

interface UseInViewOptions {
  /** Trigger threshold (0–1). Default 0.15 = 15% visible */
  threshold?: number
  /** Root margin for early/late trigger. Default '-40px' */
  rootMargin?: string
  /** Only trigger once (default true) */
  once?: boolean
}

/**
 * Scroll-triggered visibility hook.
 * Returns ref + isInView. Respects prefers-reduced-motion.
 */
export function useInView<T extends HTMLElement = HTMLElement>({
  threshold = 0.15,
  rootMargin = '-40px',
  once = true,
}: UseInViewOptions = {}) {
  const ref = useRef<T>(null)
  const [isInView, setIsInView] = useState(false)

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const entry = entries[0]
      if (!entry) return

      if (entry.isIntersecting) {
        setIsInView(true)
      } else if (!once) {
        setIsInView(false)
      }
    },
    [once]
  )

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Respect reduced motion — show immediately
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) {
      setIsInView(true)
      return
    }

    const observer = new IntersectionObserver(handleIntersect, {
      threshold,
      rootMargin,
    })

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold, rootMargin, handleIntersect])

  return { ref, isInView }
}

/**
 * Stagger delay utility — returns inline style for animation-delay.
 * Use with useInView for staggered children reveals.
 */
export function staggerDelay(index: number, base = 60): React.CSSProperties {
  return { transitionDelay: `${index * base}ms` }
}
