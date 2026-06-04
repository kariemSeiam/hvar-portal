import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup'
import type { CheckoutCopy } from './constants'

interface CheckoutPaymentStripProps {
  value: 'cod' | 'card'
  onChange: (v: 'cod' | 'card') => void
  copy: CheckoutCopy
  language: 'ar' | 'en'
}

export function CheckoutPaymentStrip({
  value,
  onChange,
  copy,
  language,
}: CheckoutPaymentStripProps) {
  const dir = language === 'ar' ? 'rtl' : 'ltr'
  return (
    <div className="rounded-xl border border-border bg-muted/20 px-4 py-4 sm:px-5 sm:py-5" dir={dir}>
      <h2 className="mb-3 text-sm font-bold text-foreground sm:text-[1rem]">
        <span className={language === 'ar' ? 'font-cairo' : ''}>
          {copy.payment}
        </span>
      </h2>
      <RadioGroup
        value={value}
        onValueChange={(v) => onChange(v as 'cod' | 'card')}
        className="flex flex-col gap-3 sm:flex-row sm:gap-4"
        dir={dir}
      >
        <label
          className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 transition-colors hover:bg-muted/30 has-[:checked]:border-primary/20 has-[:checked]:bg-muted/30"
          dir={dir}
        >
          <RadioGroupItem value="cod" id="cod" />
          <span className="font-tajawal text-sm">{copy.cod}</span>
        </label>
        <div
          className="flex min-h-[44px] cursor-not-allowed items-center gap-3 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 px-4 py-3 opacity-70"
          aria-disabled="true"
          dir={dir}
        >
          <RadioGroupItem
            value="card"
            id="card"
            disabled
            className="pointer-events-none opacity-50"
          />
          <span className="font-tajawal text-sm text-muted-foreground flex-1 min-w-0">
            {copy.card}
          </span>
          <span className="rounded-full bg-muted-foreground/20 px-2.5 py-0.5 text-xs font-medium text-muted-foreground shrink-0">
            {copy.soon}
          </span>
        </div>
      </RadioGroup>
    </div>
  )
}
