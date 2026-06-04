import { Check } from 'lucide-react'
import type { CheckoutCopy } from './constants'

type StepStatus = 'done' | 'current' | 'upcoming'

interface CheckoutProgressProps {
  currentStep: 'address' | 'payment'
  copy: CheckoutCopy
  language: 'ar' | 'en'
  /** Inline: compact pills on same row as header. Block: original full-width steps. */
  variant?: 'inline' | 'block'
}

const steps = (copy: CheckoutCopy) => [
  { id: 'cart', label: copy.stepCart },
  { id: 'address', label: copy.stepAddress },
  { id: 'payment', label: copy.stepPayment },
]

export function CheckoutProgress({
  currentStep,
  copy,
  language,
  variant = 'block',
}: CheckoutProgressProps) {
  const stepList = steps(copy).map((step) => {
    const status: StepStatus =
      step.id === 'address'
        ? currentStep === 'address'
          ? 'current'
          : 'done'
        : step.id === 'payment'
          ? currentStep === 'payment'
            ? 'current'
            : 'upcoming'
          : 'done'
    return { ...step, status }
  })

  if (variant === 'inline') {
    return (
      <nav
        aria-label={language === 'ar' ? 'خطوات الدفع' : 'Checkout steps'}
        className="shrink-0"
      >
        <ol className="flex items-center gap-1.5 sm:gap-2">
          {stepList.map((step, index) => (
            <li key={step.id} className="flex items-center">
              {index > 0 && (
                <span
                  className="h-px w-2 sm:w-3 mx-0.5 bg-border"
                  aria-hidden
                />
              )}
              <span
                className={`
                  inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-medium sm:px-3 sm:py-2 sm:text-sm transition-all duration-200
                  ${step.status === 'done' ? 'border-border bg-muted/30 text-muted-foreground' : ''}
                  ${step.status === 'current' ? 'border-primary/50 bg-gradient-to-b from-primary/15 to-primary/5 text-foreground checkout-step-current-glow border-s-2 border-s-primary' : ''}
                  ${step.status === 'upcoming' ? 'border-border bg-transparent text-muted-foreground' : ''}
                `}
              >
                {step.status === 'done' && (
                  <Check className="h-3.5 w-3.5 shrink-0 text-muted-foreground sm:h-4 sm:w-4" aria-hidden />
                )}
                <span className={language === 'ar' ? 'font-cairo' : 'font-sans'}>
                  {step.label}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </nav>
    )
  }

  return (
    <nav
      aria-label={language === 'ar' ? 'خطوات الدفع' : 'Checkout steps'}
      className="pb-5 sm:pb-6"
    >
      <ol className="flex items-center gap-2 sm:gap-3">
        {stepList.map((step, index) => (
          <li
            key={step.id}
            className="flex flex-1 items-center last:flex-none"
          >
            <div
              className={`
                flex min-h-[44px] flex-1 items-center gap-2 rounded-lg border border-border px-4 py-3 text-sm font-medium transition-colors
                ${step.status === 'done' ? 'bg-muted/30 text-muted-foreground' : ''}
                ${step.status === 'current' ? 'bg-background text-foreground border-s-4 border-s-primary' : ''}
                ${step.status === 'upcoming' ? 'bg-background/50 text-muted-foreground' : ''}
              `}
            >
              {step.status === 'done' && (
                <Check className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              )}
              <span className={language === 'ar' ? 'font-cairo' : 'font-sans'}>
                {step.label}
              </span>
            </div>
            {index < stepList.length - 1 && (
              <span
                className="h-px w-4 shrink-0 bg-border sm:w-6"
                aria-hidden
              />
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
