import { useState, useMemo } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Button } from '@/components/ui/Button'
import { Plus, Pencil, Trash2, Search, Tag, Percent, Banknote, Loader2, ChevronDown } from 'lucide-react'
import * as Select from '@radix-ui/react-select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog'
import { cn } from '@/lib/utils'
import {
  useAdminCoupons,
  useCreateCoupon,
  useUpdateCoupon,
  useDeleteCoupon,
} from '@/hooks/useAdmin'
import type { Coupon } from '@/hooks/useAdmin'
import { useToast } from '@/hooks/useToast'

interface BadgeProps {
  variant: 'active' | 'expired' | 'percentage' | 'fixed'
  children: React.ReactNode
}

function Badge({ variant, children }: BadgeProps) {
  const baseStyles = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'
  const variantStyles = {
    active: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400',
    expired: 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400',
    percentage: 'bg-info-100 text-info-700 dark:bg-info-900/30 dark:text-info-400',
    fixed: 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400',
  }
  return <span className={cn(baseStyles, variantStyles[variant])}>{children}</span>
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('bg-card rounded-xl border border-border shadow-card', className)}>
      {children}
    </div>
  )
}

function Input({
  label,
  error,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="text-sm font-medium text-foreground">{label}</label>}
      <input
        className={cn(
          'w-full min-h-[44px] rounded-xl border-2 border-border bg-background px-4 py-2.5 text-sm text-foreground',
          'placeholder:text-muted-foreground',
          'hover:border-gold-500/30 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-0 focus:border-gold-500 focus:shadow-gold-sm',
          'transition-all duration-200 dark:bg-card dark:border-stone-700',
          error && 'border-danger-500 focus:ring-danger-500',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-danger-500">{error}</p>}
    </div>
  )
}

interface SelectOption {
  value: string
  label: string
}

function CustomSelect({
  value,
  onValueChange,
  options,
  placeholder,
  label,
}: {
  value: string
  onValueChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  label?: string
}) {
  const selectedOption = options.find((opt) => opt.value === value)
  return (
    <div className="space-y-1.5">
      {label && <label className="text-sm font-medium text-foreground">{label}</label>}
      <Select.Root value={value} onValueChange={onValueChange}>
        <Select.Trigger
          className={cn(
            'w-full flex min-h-[44px] items-center justify-between rounded-xl border-2 border-border bg-background px-4 py-2.5',
            'text-sm text-foreground placeholder:text-muted-foreground',
            'hover:border-gold-500/30 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-0 focus:border-gold-500 focus:shadow-gold-sm',
            'transition-all duration-200 dark:bg-card dark:border-stone-700'
          )}
        >
          <Select.Value placeholder={placeholder}>{selectedOption?.label || placeholder}</Select.Value>
          <Select.Icon asChild>
            <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content
            className="overflow-hidden rounded-xl border-2 border-border bg-card shadow-card z-[200] data-[state=open]:animate-fade-in data-[state=open]:animate-scale-in"
            position="popper"
            sideOffset={4}
          >
            <Select.Viewport className="p-1">
              {options.map((option) => (
                <Select.Item
                  key={option.value}
                  value={option.value}
                  className={cn(
                    'relative flex cursor-default select-none items-center rounded-lg py-2 px-4 text-sm outline-none transition-colors',
                    'hover:bg-gold-100 dark:hover:bg-gold-900/20 focus:bg-gold-100 dark:focus:bg-gold-900/20',
                    'data-[state=checked]:bg-gold-50 dark:data-[state=checked]:bg-gold-900/30'
                  )}
                >
                  <Select.ItemText>{option.label}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  )
}

interface CouponFormData {
  code: string
  type: 'percentage' | 'fixed'
  value: number
  minOrderAmount: number
  usageLimit: number
  startDate: string
  expiresAt: string
}

const emptyFormData: CouponFormData = {
  code: '',
  type: 'percentage',
  value: 0,
  minOrderAmount: 0,
  usageLimit: 100,
  startDate: new Date().toISOString().slice(0, 10),
  expiresAt: '',
}

const CouponsPage = () => {
  const { language, dir } = useLanguage()
  const { toast } = useToast()
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [formData, setFormData] = useState<CouponFormData>(emptyFormData)
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof CouponFormData, string>>>({})
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data, isLoading, error } = useAdminCoupons()
  const createCoupon = useCreateCoupon()
  const updateCoupon = useUpdateCoupon()
  const deleteCoupon = useDeleteCoupon()

  const coupons = data?.coupons ?? []

  const filteredCoupons = useMemo(() => {
    return coupons.filter((coupon) => {
      const matchesStatus = statusFilter === 'all' || coupon.status === statusFilter
      const matchesSearch = coupon.code.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesStatus && matchesSearch
    })
  }, [coupons, statusFilter, searchQuery])

  const translations = {
    ar: {
      title: 'إدارة الكوبونات',
      subtitle: 'إنشاء وتعديل وحذف كوبونات الخصم',
      addCoupon: 'إضافة كوبون',
      search: 'بحث...',
      code: 'الكود',
      type: 'النوع',
      value: 'القيمة',
      usage: 'الاستخدام',
      status: 'الحالة',
      actions: 'الإجراءات',
      all: 'الكل',
      active: 'نشط',
      expired: 'منتهي',
      percentage: 'نسبة مئوية',
      fixed: 'مبلغ ثابت',
      edit: 'تعديل',
      delete: 'حذف',
      editCoupon: 'تعديل الكوبون',
      newCoupon: 'كوبون جديد',
      couponCode: 'كود الكوبون',
      couponType: 'نوع الخصم',
      discountValue: 'قيمة الخصم',
      minOrder: 'الحد الأدنى للطلب',
      usageLimit: 'الحد الأقصى للاستخدام',
      startDate: 'تاريخ البداية',
      expiryDate: 'تاريخ الانتهاء',
      cancel: 'إلغاء',
      save: 'حفظ',
      from: 'من',
      uses: 'استخدام',
      egp: 'ج.م',
      confirmDelete: 'هل أنت متأكد من حذف هذا الكوبون؟',
      codeRequired: 'كود الكوبون مطلوب',
      valueRequired: 'قيمة الخصم مطلوبة',
      valuePositive: 'يجب أن تكون القيمة أكبر من صفر',
      expiryRequired: 'تاريخ الانتهاء مطلوب',
      startDateRequired: 'تاريخ البداية مطلوب',
      startBeforeEnd: 'تاريخ البداية يجب أن يكون قبل تاريخ الانتهاء',
      percentageMax: 'النسبة يجب ألا تتجاوز 100٪',
      couponAdded: 'تمت إضافة الكوبون بنجاح',
      couponUpdated: 'تم تحديث الكوبون بنجاح',
      couponDeleted: 'تم حذف الكوبون بنجاح',
    },
    en: {
      title: 'Coupons Management',
      subtitle: 'Create, edit, and delete discount coupons',
      addCoupon: 'Add Coupon',
      search: 'Search...',
      code: 'Code',
      type: 'Type',
      value: 'Value',
      usage: 'Usage',
      status: 'Status',
      actions: 'Actions',
      all: 'All',
      active: 'Active',
      expired: 'Expired',
      percentage: 'Percentage',
      fixed: 'Fixed Amount',
      edit: 'Edit',
      delete: 'Delete',
      editCoupon: 'Edit Coupon',
      newCoupon: 'New Coupon',
      couponCode: 'Coupon Code',
      couponType: 'Discount Type',
      discountValue: 'Discount Value',
      minOrder: 'Minimum Order',
      usageLimit: 'Usage Limit',
      startDate: 'Start Date',
      expiryDate: 'Expiry Date',
      cancel: 'Cancel',
      save: 'Save',
      from: 'of',
      uses: 'uses',
      egp: 'EGP',
      confirmDelete: 'Are you sure you want to delete this coupon?',
      codeRequired: 'Coupon code is required',
      valueRequired: 'Discount value is required',
      valuePositive: 'Value must be greater than zero',
      expiryRequired: 'Expiry date is required',
      startDateRequired: 'Start date is required',
      startBeforeEnd: 'Start date must be before end date',
      percentageMax: 'Percentage must not exceed 100%',
      couponAdded: 'Coupon added successfully',
      couponUpdated: 'Coupon updated successfully',
      couponDeleted: 'Coupon deleted successfully',
    },
  }

  const t = (key: keyof (typeof translations)['ar']) => translations[language as keyof typeof translations][key]

  const handleAddCoupon = () => {
    setEditingCoupon(null)
    setFormData(emptyFormData)
    setFormErrors({})
    setIsDialogOpen(true)
  }

  const handleEditCoupon = (coupon: Coupon) => {
    setEditingCoupon(coupon)
    const start = coupon.startDate?.slice(0, 10) ?? new Date().toISOString().slice(0, 10)
    setFormData({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      minOrderAmount: 0,
      usageLimit: coupon.usageLimit,
      startDate: start,
      expiresAt: coupon.expiresAt?.slice(0, 10) ?? '',
    })
    setFormErrors({})
    setIsDialogOpen(true)
  }

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof CouponFormData, string>> = {}
    if (!editingCoupon && !formData.code.trim()) errors.code = t('codeRequired')
    if (formData.value <= 0) errors.value = t('valuePositive')
    if (formData.type === 'percentage' && formData.value > 100) errors.value = t('percentageMax')
    if (!formData.startDate) errors.startDate = t('startDateRequired')
    if (!formData.expiresAt) errors.expiresAt = t('expiryRequired')
    if (formData.startDate && formData.expiresAt && formData.startDate > formData.expiresAt) {
      errors.expiresAt = t('startBeforeEnd')
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = () => {
    if (!validateForm()) return
    const startDate = formData.startDate
    const endDate = formData.expiresAt
    const status = new Date(endDate) < new Date() ? 'expired' : 'active'

    if (editingCoupon) {
      updateCoupon.mutate(
        {
          id: editingCoupon.id,
          data: {
            discountType: formData.type,
            discountValue: formData.value,
            maxUses: formData.usageLimit,
            startDate,
            endDate,
            status,
          },
        },
        {
          onSuccess: () => {
            setIsDialogOpen(false)
            setFormData(emptyFormData)
            setEditingCoupon(null)
            toast({ title: t('couponUpdated') })
          },
          onError: (e) => toast({ title: e?.message ?? (language === 'ar' ? 'فشل التحديث' : 'Update failed'), variant: 'destructive' }),
        }
      )
    } else {
      createCoupon.mutate(
        {
          code: formData.code.toUpperCase(),
          discountType: formData.type,
          discountValue: formData.value,
          maxUses: formData.usageLimit,
          startDate: formData.startDate,
          endDate: formData.expiresAt,
          status,
        },
        {
          onSuccess: () => {
            setIsDialogOpen(false)
            setFormData(emptyFormData)
            toast({ title: t('couponAdded') })
          },
          onError: (e) => toast({ title: e?.message ?? (language === 'ar' ? 'فشل الإضافة' : 'Create failed'), variant: 'destructive' }),
        }
      )
    }
  }

  const handleDeleteCoupon = (couponId: string) => setDeleteId(couponId)
  const confirmDelete = () => {
    if (!deleteId) return
    deleteCoupon.mutate(deleteId, {
      onSuccess: () => {
        setDeleteId(null)
        toast({ title: t('couponDeleted') })
      },
      onError: (e) => toast({ title: e?.message ?? (language === 'ar' ? 'فشل الحذف' : 'Delete failed'), variant: 'destructive' }),
    })
  }

  const typeOptions: SelectOption[] = [
    { value: 'percentage', label: t('percentage') },
    { value: 'fixed', label: t('fixed') },
  ]

  const statusFilterOptions: SelectOption[] = [
    { value: 'all', label: t('all') },
    { value: 'active', label: t('active') },
    { value: 'expired', label: t('expired') },
  ]

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <p className="text-destructive">{error.message}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container-wide py-6 lg:py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-h2 font-bold text-foreground">{t('title')}</h1>
            <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
          </div>
          <Button onClick={handleAddCoupon} className="gap-2 bg-gold-500 hover:bg-gold-600 text-stone-900">
            <Plus className="h-4 w-4" />
            {t('addCoupon')}
          </Button>
        </div>

        <Card className="overflow-hidden">
          <div className="p-4 border-b border-border">
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute top-1/2 start-3 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder={t('search')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label={t('search')}
                  className={cn(
                    'w-full py-2.5 rounded-lg border border-border bg-background text-foreground',
                    'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent',
                    'ps-10 pe-4'
                  )}
                  dir={dir}
                />
              </div>
              <div className="w-full sm:w-48">
                <CustomSelect
                  value={statusFilter}
                  onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
                  options={statusFilterOptions}
                />
              </div>
            </div>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-10 w-10 animate-spin text-gold-500" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-start text-sm font-semibold text-foreground">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-gold-500" />
                        {t('code')}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-start text-sm font-semibold text-foreground">{t('type')}</th>
                    <th className="px-4 py-3 text-start text-sm font-semibold text-foreground">{t('value')}</th>
                    <th className="px-4 py-3 text-start text-sm font-semibold text-foreground">{t('usage')}</th>
                    <th className="px-4 py-3 text-start text-sm font-semibold text-foreground">{t('status')}</th>
                    <th className="px-4 py-3 text-start text-sm font-semibold text-foreground">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredCoupons.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                        {language === 'ar' ? 'لا توجد كوبونات' : 'No coupons found'}
                      </td>
                    </tr>
                  ) : (
                    filteredCoupons.map((coupon) => (
                      <tr key={coupon.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-4">
                          <span className="font-mono font-semibold text-foreground bg-gold-100 dark:bg-gold-900/30 px-2 py-1 rounded">
                            {coupon.code}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            {coupon.type === 'percentage' ? (
                              <Percent className="h-4 w-4 text-info-500" />
                            ) : (
                              <Banknote className="h-4 w-4 text-warning-500" />
                            )}
                            <Badge variant={coupon.type}>
                              {coupon.type === 'percentage' ? t('percentage') : t('fixed')}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="font-semibold text-gold-600">
                            {coupon.type === 'percentage' ? `${coupon.value}%` : `${coupon.value} ${t('egp')}`}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col">
                            <span className="text-foreground font-medium">
                              {coupon.usageCount} {t('from')} {coupon.usageLimit}
                            </span>
                            <div className="w-24 h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                              <div
                                className="h-full bg-gold-500 rounded-full transition-all duration-300"
                                style={{
                                  width: `${Math.min((coupon.usageLimit ? (coupon.usageCount / coupon.usageLimit) * 100 : 0), 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <Badge variant={coupon.status}>
                            {coupon.status === 'active' ? t('active') : t('expired')}
                          </Badge>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditCoupon(coupon)}
                              className="text-muted-foreground hover:text-gold-600"
                              aria-label={t('edit')}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteCoupon(coupon.id)}
                              className="text-muted-foreground hover:text-danger-500"
                              aria-label={t('delete')}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="w-[calc(100%-2rem)] max-w-md" dir={dir} aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-foreground">
                {editingCoupon ? t('editCoupon') : t('newCoupon')}
              </DialogTitle>
            </DialogHeader>
            <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSubmit()
                }}
                className="space-y-4"
              >
                <Input
                  label={t('couponCode')}
                  value={formData.code}
                  onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="WELCOME10"
                  error={formErrors.code}
                  disabled={!!editingCoupon}
                />
                <CustomSelect
                  label={t('couponType')}
                  value={formData.type}
                  onValueChange={(v) => setFormData((prev) => ({ ...prev, type: v as 'percentage' | 'fixed' }))}
                  options={typeOptions}
                />
                <Input
                  label={t('discountValue')}
                  type="number"
                  min="0"
                  value={formData.value || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                  placeholder={formData.type === 'percentage' ? '10' : '500'}
                  error={formErrors.value}
                />
                <Input
                  label={t('usageLimit')}
                  type="number"
                  min="1"
                  value={formData.usageLimit || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, usageLimit: parseInt(e.target.value) || 100 }))}
                  placeholder="100"
                />
                <Input
                  label={t('startDate')}
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                  error={formErrors.startDate}
                />
                <Input
                  label={t('expiryDate')}
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData((prev) => ({ ...prev, expiresAt: e.target.value }))}
                  error={formErrors.expiresAt}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" className="flex-1 min-h-[44px]" onClick={() => setIsDialogOpen(false)}>
                    {t('cancel')}
                  </Button>
                  <Button type="submit" className="flex-1 min-h-[44px] bg-gold-500 hover:bg-gold-600 text-stone-900" disabled={createCoupon.isPending || updateCoupon.isPending}>
                    {(createCoupon.isPending || updateCoupon.isPending) ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') : t('save')}
                  </Button>
                </DialogFooter>
              </form>
          </DialogContent>
        </Dialog>

        <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
          <DialogContent className="w-[90vw] max-w-sm" dir={dir}>
            <DialogHeader>
              <DialogTitle>{language === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete'}</DialogTitle>
              <DialogDescription>{t('confirmDelete')}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteId(null)} className="min-h-[44px]">
                {t('cancel')}
              </Button>
              <Button variant="destructive" onClick={confirmDelete} disabled={deleteCoupon.isPending} className="min-h-[44px]">
                {deleteCoupon.isPending ? (language === 'ar' ? 'جاري الحذف...' : 'Deleting...') : t('delete')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default CouponsPage
