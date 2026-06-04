import { MapPin, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup'
import type { Address } from '@/types'
import type { CheckoutCopy } from './constants'
import { EGYPT_GOVERNORATES } from './constants'

interface CheckoutAddressBlockProps {
  addresses: Address[]
  selectedAddressId: string
  defaultAddressId: string | undefined
  onSelect: (id: string) => void
  copy: CheckoutCopy
  language: 'ar' | 'en'
  showAddForm: boolean
  onToggleAddForm: () => void
  newGov: string
  newDistrict: string
  newDetails: string
  onNewGovChange: (v: string) => void
  onNewDistrictChange: (v: string) => void
  onNewDetailsChange: (v: string) => void
  onAddAddress: () => void
  isAdding: boolean
}

export function CheckoutAddressBlock({
  addresses,
  selectedAddressId,
  defaultAddressId,
  onSelect,
  copy,
  language,
  showAddForm,
  onToggleAddForm,
  newGov,
  newDistrict,
  newDetails,
  onNewGovChange,
  onNewDistrictChange,
  onNewDetailsChange,
  onAddAddress,
  isAdding,
}: CheckoutAddressBlockProps) {
  const resolvedId = selectedAddressId || defaultAddressId || addresses[0]?.id || ''

  const dir = language === 'ar' ? 'rtl' : 'ltr'
  return (
    <div className="rounded-2xl border border-border bg-card text-card-foreground shadow-sm" dir={dir}>
      <div className="p-4 sm:p-6" dir={dir}>
        <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-foreground sm:text-[1rem]">
          <MapPin className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
          <span className={language === 'ar' ? 'font-cairo' : ''}>
            {copy.address}
          </span>
        </h2>
        {addresses.length > 0 ? (
          <RadioGroup
            value={resolvedId}
            onValueChange={onSelect}
            className="flex flex-col gap-3"
            dir={dir}
          >
            {addresses.map((addr) => {
              const isSelected =
                selectedAddressId === addr.id ||
                (!selectedAddressId && defaultAddressId === addr.id)
              return (
                <label
                  key={addr.id}
                  dir={dir}
                  className={`
                    flex cursor-pointer items-start gap-3 rounded-lg border p-3 sm:p-4 transition-all duration-200 hover:bg-muted/40
                    min-h-[44px]
                    ${isSelected ? 'border-primary/30 bg-primary/5 shadow-[0_0_0_1px_hsl(var(--primary)_/_0.12)] checkout-address-option-selected' : 'border-border'}
                  `}
                >
                  <div className="min-w-0 flex-1 text-start">
                    <p className="font-medium text-foreground font-tajawal">
                      {addr.governorate}, {addr.district}
                    </p>
                    <p className="text-sm text-muted-foreground font-tajawal">
                      {addr.details}
                    </p>
                  </div>
                  {addr.isDefault && (
                    <span className="text-xs text-muted-foreground font-tajawal shrink-0">
                      {copy.default}
                    </span>
                  )}
                  <RadioGroupItem value={addr.id} id={addr.id} className="mt-0.5 shrink-0" />
                </label>
              )
            })}
          </RadioGroup>
        ) : (
          <p className="text-sm text-muted-foreground font-tajawal">
            {copy.noSavedAddress}
          </p>
        )}
        {showAddForm ? (
          <div className="mt-4 space-y-3 rounded-lg border border-border p-4 sm:p-5">
            <Label className="font-tajawal">{copy.governorate}</Label>
            <select
              value={newGov}
              onChange={(e) => onNewGovChange(e.target.value)}
              className="flex min-h-[44px] w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              aria-label={copy.governorate}
            >
              <option value="">{copy.chooseGovernorate}</option>
              {EGYPT_GOVERNORATES.map((gov) => (
                <option key={gov} value={gov}>
                  {gov}
                </option>
              ))}
            </select>
            <Label className="font-tajawal">{copy.district}</Label>
            <Input
              value={newDistrict}
              onChange={(e) => onNewDistrictChange(e.target.value)}
              placeholder={copy.district}
              className="min-h-[44px]"
            />
            <Label className="font-tajawal">{copy.details}</Label>
            <Input
              value={newDetails}
              onChange={(e) => onNewDetailsChange(e.target.value)}
              placeholder={copy.details}
              className="min-h-[44px]"
            />
            <div className="flex gap-3 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onToggleAddForm}
                className="min-h-[44px]"
              >
                {copy.cancel}
              </Button>
              <Button
                size="sm"
                onClick={onAddAddress}
                disabled={isAdding}
                className="min-h-[44px]"
              >
                {isAdding ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  copy.save
                )}
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleAddForm}
            className="mt-4 min-h-[44px]"
          >
            {copy.addAddress}
          </Button>
        )}
      </div>
    </div>
  )
}
