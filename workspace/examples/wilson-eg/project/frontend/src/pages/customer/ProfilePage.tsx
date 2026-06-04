/**
 * ProfilePage — Wilson Egypt account hub.
 * UX: inline validation, loading states, success feedback, phone CTA.
 * Visual: gold avatar ring, member badge, doodle cards, empty state, delete Dialog.
 */
import { useState, useEffect } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAuth } from '@/contexts/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { ordersApi, favoritesApi } from '@/services/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { ApplianceDoodleBg } from '@/components/customer/ApplianceDoodleBg'
import {
  Phone,
  Package,
  Heart,
  MapPin,
  LogOut,
  ChevronRight,
  Edit3,
  Check,
  X,
  Plus,
  Pencil,
  Trash2,
  Star,
  Loader2,
  MessageCircle,
  User,
} from 'lucide-react'
import { PageBreadcrumb } from '@/components/customer/PageBreadcrumb'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/utils'
import type { Address } from '@/types'

const NAME_MIN_LENGTH = 2

function formatMemberSince(iso: string, lang: 'ar' | 'en'): string {
  try {
    const d = new Date(iso)
    if (lang === 'ar') {
      const monthsAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
      return `عضو منذ ${monthsAr[d.getMonth()]} ${d.getFullYear()}`
    }
    const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `Member since ${monthsEn[d.getMonth()]} ${d.getFullYear()}`
  } catch {
    return lang === 'ar' ? 'عميل ويلسون' : 'Wilson Customer'
  }
}

const ProfilePage = () => {
  const { language, t: tNav } = useLanguage()
  const { isAuthenticated, user, logout, updateProfile, addresses, addAddress, updateAddress, deleteAddress, setDefaultAddress, getDefaultAddress } = useAuth()
  const { toast } = useToast()
  const [isEditingName, setIsEditingName] = useState(false)
  const [editName, setEditName] = useState(user?.name ?? '')
  const [isSavingName, setIsSavingName] = useState(false)
  const [nameJustSaved, setNameJustSaved] = useState(false)
  const [nameError, setNameError] = useState('')
  const [showAddAddress, setShowAddAddress] = useState(false)
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [isDeletingAddress, setIsDeletingAddress] = useState(false)
  const [addGov, setAddGov] = useState('')
  const [addDistrict, setAddDistrict] = useState('')
  const [addDetails, setAddDetails] = useState('')
  const [addErrors, setAddErrors] = useState<{ governorate?: string; district?: string; details?: string }>({})
  const [editGov, setEditGov] = useState('')
  const [editDistrict, setEditDistrict] = useState('')
  const [editDetails, setEditDetails] = useState('')
  const [editErrors, setEditErrors] = useState<{ governorate?: string; district?: string; details?: string }>({})
  const [isSavingAddress, setIsSavingAddress] = useState(false)
  const isRTL = language === 'ar'

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => ordersApi.getAll({ page: 1, perPage: 1 }),
    enabled: isAuthenticated,
  })
  const { data: wishlistData, isLoading: wishlistLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => favoritesApi.getAll({ page: 1, perPage: 1 }),
    enabled: isAuthenticated,
  })
  const ordersCount = ordersData?.total ?? 0
  const wishlistCount = wishlistData?.total ?? 0

  useEffect(() => {
    setEditName(user?.name ?? '')
  }, [user?.name])

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const displayName = user?.name?.trim() || (language === 'ar' ? 'عميل ويلسون' : 'Wilson Customer')
  const initials = displayName
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const validateName = (value: string): string => {
    const t = value.trim()
    if (!t) return language === 'ar' ? 'الاسم مطلوب' : 'Name is required'
    if (t.length < NAME_MIN_LENGTH) return language === 'ar' ? `الاسم حرفين على الأقل` : `At least ${NAME_MIN_LENGTH} characters`
    return ''
  }

  const validateAddressFields = (gov: string, district: string, details: string) => {
    const err: { governorate?: string; district?: string; details?: string } = {}
    if (!gov.trim()) err.governorate = language === 'ar' ? 'مطلوب' : 'Required'
    if (!district.trim()) err.district = language === 'ar' ? 'مطلوب' : 'Required'
    if (!details.trim()) err.details = language === 'ar' ? 'مطلوب' : 'Required'
    return err
  }

  const handleSaveName = async () => {
    const trimmed = editName.trim()
    const err = validateName(editName)
    if (err) {
      setNameError(err)
      return
    }
    if (trimmed === user?.name) {
      setIsEditingName(false)
      setNameError('')
      return
    }
    setIsSavingName(true)
    setNameError('')
    try {
      await updateProfile({ name: trimmed || null })
      setIsEditingName(false)
      setNameJustSaved(true)
      toast({ title: language === 'ar' ? 'تم الحفظ' : 'Saved', variant: 'default' })
      setTimeout(() => setNameJustSaved(false), 1200)
    } catch {
      toast({ title: language === 'ar' ? 'فشل الحفظ' : 'Failed to save', variant: 'destructive' })
    } finally {
      setIsSavingName(false)
    }
  }

  const handleCancelName = () => {
    setEditName(user?.name ?? '')
    setIsEditingName(false)
    setNameError('')
  }

  const startEditAddress = (addr: Address) => {
    setEditingAddressId(addr.id)
    setEditGov(addr.governorate)
    setEditDistrict(addr.district)
    setEditDetails(addr.details)
    setEditErrors({})
  }

  const cancelEditAddress = () => {
    setEditingAddressId(null)
    setEditErrors({})
  }

  const handleSaveAddressEdit = async () => {
    if (!editingAddressId) return
    const errs = validateAddressFields(editGov, editDistrict, editDetails)
    if (Object.keys(errs).length > 0) {
      setEditErrors(errs)
      return
    }
    setIsSavingAddress(true)
    setEditErrors({})
    try {
      await updateAddress(editingAddressId, { governorate: editGov.trim(), district: editDistrict.trim(), details: editDetails.trim() })
      setEditingAddressId(null)
      toast({ title: language === 'ar' ? 'تم التحديث' : 'Updated', variant: 'default' })
    } catch {
      toast({ title: language === 'ar' ? 'فشل التحديث' : 'Update failed', variant: 'destructive' })
    } finally {
      setIsSavingAddress(false)
    }
  }

  const handleAddAddress = async () => {
    const errs = validateAddressFields(addGov, addDistrict, addDetails)
    if (Object.keys(errs).length > 0) {
      setAddErrors(errs)
      return
    }
    setAddErrors({})
    try {
      await addAddress({ governorate: addGov.trim(), district: addDistrict.trim(), details: addDetails.trim(), isDefault: false })
      setAddGov('')
      setAddDistrict('')
      setAddDetails('')
      setShowAddAddress(false)
      toast({ title: language === 'ar' ? 'تمت الإضافة' : 'Address added', variant: 'default' })
    } catch {
      toast({ title: language === 'ar' ? 'فشل الحفظ' : 'Failed to add', variant: 'destructive' })
    }
  }

  const handleDeleteAddress = async (id: string) => {
    setIsDeletingAddress(true)
    try {
      await deleteAddress(id)
      setDeleteTargetId(null)
      toast({ title: language === 'ar' ? 'تم الحذف' : 'Deleted', variant: 'default' })
    } catch {
      toast({ title: language === 'ar' ? 'فشل الحذف' : 'Delete failed', variant: 'destructive' })
    } finally {
      setIsDeletingAddress(false)
    }
  }

  const handleSetDefaultAddress = async (id: string) => {
    try {
      await setDefaultAddress(id)
      toast({ title: language === 'ar' ? 'تم تعيين العنوان الافتراضي' : 'Default address set', variant: 'default' })
    } catch {
      toast({ title: language === 'ar' ? 'فشل التحديث' : 'Update failed', variant: 'destructive' })
    }
  }

  const defaultAddr = getDefaultAddress()
  const quickLinks = [
    { to: '/orders', icon: Package, labelAr: 'طلباتي', labelEn: 'My Orders', count: ordersCount, descAr: 'تتبع وإدارة الطلبات', descEn: 'Track and manage orders', loading: ordersLoading },
    { to: '/wishlist', icon: Heart, labelAr: 'المفضلة', labelEn: 'Wishlist', count: wishlistCount, descAr: 'المنتجات المحفوظة', descEn: 'Saved products', loading: wishlistLoading },
  ]

  const t = {
    ar: {
      governorate: 'المحافظة',
      district: 'المنطقة',
      details: 'العنوان بالتفصيل',
      addAddress: 'إضافة عنوان',
      default: 'افتراضي',
      setDefault: 'تعيين افتراضي',
      edit: 'تعديل',
      delete: 'حذف',
      save: 'حفظ',
      cancel: 'إلغاء',
      noAddresses: 'لا توجد عناوين',
      noAddressesDesc: 'أضف عنواناً لتسريع الطلب والتوصيل.',
      name: 'الاسم',
      enterName: 'أدخل اسمك',
      contactNote: 'لتغيير رقم الهاتف',
      requestPhoneChange: 'طلب تغيير الرقم',
      logOut: 'تسجيل الخروج',
      quickAccess: 'الوصول السريع',
      savedAddresses: 'العناوين المحفوظة',
      trustTitle: 'ويلسون — جودة وضمان منذ سنوات',
      trustDesc: 'نسعى لتحسين تجربتك. تواصل معنا لأي استفسار.',
      contactUs: 'تواصل معنا',
      deleteAddressTitle: 'حذف العنوان؟',
      deleteAddressDesc: 'لن تتمكن من استرجاع هذا العنوان. تأكيد الحذف.',
    },
    en: {
      governorate: 'Governorate',
      district: 'District',
      details: 'Full address',
      addAddress: 'Add address',
      default: 'Default',
      setDefault: 'Set as default',
      edit: 'Edit',
      delete: 'Delete',
      save: 'Save',
      cancel: 'Cancel',
      noAddresses: 'No addresses yet',
      noAddressesDesc: 'Add an address to speed up checkout and delivery.',
      name: 'Name',
      enterName: 'Enter your name',
      contactNote: 'To change your phone number',
      requestPhoneChange: 'Request change',
      logOut: 'Log out',
      quickAccess: 'Quick access',
      savedAddresses: 'Saved addresses',
      trustTitle: 'Wilson — quality and warranty for years',
      trustDesc: 'We strive to improve your experience. Contact us for any inquiry.',
      contactUs: 'Contact us',
      deleteAddressTitle: 'Delete address?',
      deleteAddressDesc: 'You won\'t be able to recover this address. Confirm delete.',
    },
  }
  const text = language === 'ar' ? t.ar : t.en

  return (
    <div className="profile-page relative min-h-screen bg-transparent" dir={isRTL ? 'rtl' : 'ltr'}>
      <ApplianceDoodleBg className="z-0" opacity={0.2} variant="mix" />
      <PageBreadcrumb
        dir={isRTL ? 'rtl' : 'ltr'}
        containerClassName="container-wide"
        ariaLabel={language === 'ar' ? 'مسار الصفحة' : 'Breadcrumb'}
        items={[
          { label: tNav('nav.home'), href: '/' },
          { label: tNav('nav.account') },
        ]}
      />
      <section aria-label={language === 'ar' ? 'حسابي' : 'My Account'}>
        <div className="container-wide pt-2 pb-32 sm:pt-3 sm:pb-8">
          <header
            className="section-header-bar w-full min-w-0 flex flex-row flex-nowrap items-center gap-2 sm:gap-3 pb-5 sm:pb-6"
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            <div
              className="section-header-icon flex items-center justify-center rounded-lg sm:rounded-xl overflow-visible ring-1 ring-primary/25 bg-primary/10 [&_svg]:text-primary"
              aria-hidden
            >
              <User className="h-7 w-7 sm:h-8 sm:w-8" />
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <h1 className={`section-header-title font-bold text-foreground title-underline-gold w-full min-w-0 tracking-tight block ${language === 'ar' ? 'font-cairo font-extrabold' : ''}`}>
                {language === 'ar' ? 'حسابي' : 'My Account'}
              </h1>
            </div>
          </header>

          <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
            {/* Profile card — doodle, avatar ring, member badge, phone CTA */}
            <div className="lg:col-span-1 space-y-4">
              <div
                className={cn(
                  'profile-card-doodle rounded-2xl border border-border bg-card overflow-hidden transition-all duration-300',
                  'hover:border-primary/30 hover:shadow-[0_0_24px_6px_hsl(var(--primary)/0.08)]'
                )}
              >
                {/* Header strip: avatar + member badge */}
                <div className="p-6 sm:p-8 pb-4 sm:pb-5 border-b border-border/60">
                  <div className="flex flex-col items-center text-center gap-4">
                    <div
                      className={cn(
                        'profile-avatar-ring flex h-20 w-20 sm:h-24 sm:w-24 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary text-xl sm:text-2xl font-bold',
                        nameJustSaved && 'profile-success-check'
                      )}
                    >
                      {nameJustSaved ? (
                        <Check className="h-8 w-8 sm:h-10 sm:w-10 text-primary" strokeWidth={2.5} aria-hidden />
                      ) : (
                        initials
                      )}
                    </div>
                    {user?.createdAt && (
                      <p className={cn('text-xs font-medium text-primary/90 px-2', language === 'ar' && 'font-tajawal')}>
                        {formatMemberSince(user.createdAt, language)}
                      </p>
                    )}
                  </div>
                </div>
                {/* Body: name, phone, actions */}
                <div className="p-6 sm:p-8 pt-3 sm:pt-4 space-y-4">
                  <div className="w-full min-w-0">
                    {isEditingName ? (
                      <div className="space-y-4 text-start">
                        <Label htmlFor="profile-name" className={cn('text-foreground', language === 'ar' && 'font-tajawal')}>
                          {text.name}
                        </Label>
                        <Input
                          id="profile-name"
                          value={editName}
                          onChange={(e) => { setEditName(e.target.value); setNameError(validateName(e.target.value)); }}
                          onBlur={() => setNameError(validateName(editName))}
                          placeholder={text.enterName}
                          className={cn('w-full border-border focus-visible:ring-primary', nameError && 'border-destructive focus-visible:ring-destructive')}
                          autoFocus
                          aria-invalid={!!nameError}
                          aria-describedby={nameError ? 'profile-name-error' : undefined}
                        />
                        {nameError && (
                          <p id="profile-name-error" className="text-sm text-destructive" role="alert">
                            {nameError}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" onClick={handleSaveName} disabled={isSavingName} className="gap-1.5 min-w-[80px]">
                            {isSavingName ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                            {text.save}
                          </Button>
                          <Button variant="outline" size="sm" onClick={handleCancelName} disabled={isSavingName} className="gap-1.5">
                            <X className="h-4 w-4" />
                            {text.cancel}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h2 className={cn('text-xl font-bold text-foreground text-center', language === 'ar' && 'font-cairo')}>
                          {displayName}
                        </h2>
                        <p className={cn('mt-3 flex items-center justify-center gap-2 text-muted-foreground text-sm', language === 'ar' && 'font-tajawal')} dir="ltr">
                          <Phone className="h-4 w-4 shrink-0 text-primary/80" aria-hidden />
                          {user?.phone}
                        </p>
                        <p className={cn('text-xs text-muted-foreground text-center mt-1', language === 'ar' && 'font-tajawal')}>
                          {text.contactNote}
                        </p>
                        <Link
                          to="/contact"
                          state={{ reason: 'phone' }}
                          className="flex items-center justify-center gap-1.5 min-h-[44px] w-full mt-1 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
                        >
                          <MessageCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          <span className={language === 'ar' ? 'font-tajawal' : ''}>{text.requestPhoneChange}</span>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-3 gap-1.5 border-primary/40 text-primary hover:bg-primary/10 min-h-[44px]"
                          onClick={() => {
                            setEditName(user?.name ?? '')
                            setIsEditingName(true)
                            setNameError('')
                          }}
                        >
                          <Edit3 className="h-4 w-4" />
                          {language === 'ar' ? 'تعديل الاسم' : 'Edit name'}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full gap-2 min-h-12 border-destructive/40 text-destructive hover:bg-destructive/10 hover:border-destructive"
                onClick={logout}
              >
                <LogOut className="h-4 w-4" />
                {text.logOut}
              </Button>
            </div>

            {/* Quick access + Addresses — full width of column */}
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h2 className={cn('text-h3 font-bold text-foreground title-underline-gold mb-4', language === 'ar' && 'font-cairo')}>
                  {text.quickAccess}
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {quickLinks.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={cn(
                        'profile-card-doodle group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 sm:p-6 transition-all duration-300 min-h-[88px]',
                        'hover:border-primary/40 hover:shadow-[0_0_24px_6px_hsl(var(--primary)/0.08)]',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
                      )}
                    >
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary border border-primary/20 group-hover:bg-primary/20 transition-colors">
                        {link.loading ? <Loader2 className="h-7 w-7 animate-spin" /> : <link.icon className="h-7 w-7" aria-hidden />}
                      </div>
                      <div className="min-w-0 flex-1 text-start">
                        <h3 className={cn('font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-2', language === 'ar' && 'font-cairo')}>
                          {language === 'ar' ? link.labelAr : link.labelEn}
                          {!link.loading && link.count > 0 && (
                            <span className={cn('text-sm font-normal text-muted-foreground', language === 'ar' && 'font-tajawal')}>({link.count})</span>
                          )}
                        </h3>
                        <p className={cn('mt-0.5 text-sm text-muted-foreground', language === 'ar' && 'font-tajawal')}>
                          {language === 'ar' ? link.descAr : link.descEn}
                        </p>
                      </div>
                      <ChevronRight
                        className={cn('h-5 w-5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors', isRTL && 'rotate-180')}
                        aria-hidden
                      />
                    </Link>
                  ))}
                </div>
              </div>

              {/* Saved addresses */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <h2 className={cn('text-h3 font-bold text-foreground title-underline-gold', language === 'ar' && 'font-cairo')}>
                    {text.savedAddresses}
                  </h2>
                  {!showAddAddress && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 border-primary/40 text-primary hover:bg-primary/10"
                      onClick={() => { setShowAddAddress(true); setAddErrors({}); }}
                    >
                      <Plus className="h-4 w-4" />
                      {text.addAddress}
                    </Button>
                  )}
                </div>

                {showAddAddress && (
                  <div className="profile-card-doodle rounded-2xl border border-border bg-card p-5 sm:p-6 mb-4 space-y-4">
                    <div className="space-y-2">
                      <Label>{text.governorate}</Label>
                      <Input
                        value={addGov}
                        onChange={(e) => { setAddGov(e.target.value); setAddErrors((p) => ({ ...p, governorate: undefined })); }}
                        placeholder={text.governorate}
                        className={cn('border-border focus-visible:ring-primary', addErrors.governorate && 'border-destructive')}
                        aria-invalid={!!addErrors.governorate}
                      />
                      {addErrors.governorate && <p className="text-sm text-destructive">{addErrors.governorate}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>{text.district}</Label>
                      <Input
                        value={addDistrict}
                        onChange={(e) => { setAddDistrict(e.target.value); setAddErrors((p) => ({ ...p, district: undefined })); }}
                        placeholder={text.district}
                        className={cn('border-border focus-visible:ring-primary', addErrors.district && 'border-destructive')}
                        aria-invalid={!!addErrors.district}
                      />
                      {addErrors.district && <p className="text-sm text-destructive">{addErrors.district}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>{text.details}</Label>
                      <Input
                        value={addDetails}
                        onChange={(e) => { setAddDetails(e.target.value); setAddErrors((p) => ({ ...p, details: undefined })); }}
                        placeholder={text.details}
                        className={cn('border-border focus-visible:ring-primary', addErrors.details && 'border-destructive')}
                        aria-invalid={!!addErrors.details}
                      />
                      {addErrors.details && <p className="text-sm text-destructive">{addErrors.details}</p>}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={handleAddAddress} className="gap-1.5">
                        <Check className="h-4 w-4" />
                        {text.save}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => { setShowAddAddress(false); setAddErrors({}); }} className="gap-1.5">
                        <X className="h-4 w-4" />
                        {text.cancel}
                      </Button>
                    </div>
                  </div>
                )}

                {addresses.length === 0 && !showAddAddress ? (
                  <EmptyState
                    icon={
                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <MapPin className="h-8 w-8 text-primary/70" />
                      </div>
                    }
                    title={text.noAddresses}
                    description={text.noAddressesDesc}
                    action={
                      <Button size="sm" className="gap-2 min-h-[44px] border-primary/40 text-primary hover:bg-primary/10" onClick={() => setShowAddAddress(true)}>
                        <Plus className="h-4 w-4" />
                        {text.addAddress}
                      </Button>
                    }
                  />
                ) : (
                  <div className="space-y-3">
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className={cn(
                          'profile-card-doodle rounded-2xl border bg-card p-4 sm:p-5 transition-colors',
                          (addr.isDefault || defaultAddr?.id === addr.id) ? 'border-primary/40 bg-primary/5' : 'border-border'
                        )}
                      >
                        {editingAddressId === addr.id ? (
                          <div className="space-y-3 text-start">
                            <div className="space-y-1">
                              <Input
                                value={editGov}
                                onChange={(e) => { setEditGov(e.target.value); setEditErrors((p) => ({ ...p, governorate: undefined })); }}
                                placeholder={text.governorate}
                                className={cn('border-border focus-visible:ring-primary', editErrors.governorate && 'border-destructive')}
                              />
                              {editErrors.governorate && <p className="text-sm text-destructive">{editErrors.governorate}</p>}
                            </div>
                            <div className="space-y-1">
                              <Input
                                value={editDistrict}
                                onChange={(e) => { setEditDistrict(e.target.value); setEditErrors((p) => ({ ...p, district: undefined })); }}
                                placeholder={text.district}
                                className={cn('border-border focus-visible:ring-primary', editErrors.district && 'border-destructive')}
                              />
                              {editErrors.district && <p className="text-sm text-destructive">{editErrors.district}</p>}
                            </div>
                            <div className="space-y-1">
                              <Input
                                value={editDetails}
                                onChange={(e) => { setEditDetails(e.target.value); setEditErrors((p) => ({ ...p, details: undefined })); }}
                                placeholder={text.details}
                                className={cn('border-border focus-visible:ring-primary', editErrors.details && 'border-destructive')}
                              />
                              {editErrors.details && <p className="text-sm text-destructive">{editErrors.details}</p>}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button size="sm" onClick={handleSaveAddressEdit} disabled={isSavingAddress} className="gap-1.5 min-w-[72px]">
                                {isSavingAddress ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                {text.save}
                              </Button>
                              <Button variant="outline" size="sm" onClick={cancelEditAddress} disabled={isSavingAddress} className="gap-1.5">
                                <X className="h-4 w-4" />
                                {text.cancel}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <MapPin className="h-5 w-5 shrink-0 text-primary/80" aria-hidden />
                                <div>
                                  <p className={cn('font-medium text-foreground', language === 'ar' && 'font-tajawal')}>
                                    {addr.governorate}, {addr.district}
                                  </p>
                                  <p className={cn('text-sm text-muted-foreground mt-0.5', language === 'ar' && 'font-tajawal')}>{addr.details}</p>
                                </div>
                              </div>
                              {(addr.isDefault || defaultAddr?.id === addr.id) && (
                                <span className={cn('inline-flex items-center gap-1 text-xs font-medium text-primary shrink-0', language === 'ar' && 'font-tajawal')}>
                                  <Star className="h-3.5 w-3.5 fill-current" />
                                  {text.default}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border">
                              {(defaultAddr?.id !== addr.id && !addr.isDefault) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="min-h-[44px] gap-1.5 text-primary hover:bg-primary/10"
                                  onClick={() => handleSetDefaultAddress(addr.id)}
                                >
                                  <Star className="h-4 w-4" />
                                  {text.setDefault}
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="min-h-[44px] gap-1.5"
                                onClick={() => startEditAddress(addr)}
                              >
                                <Pencil className="h-4 w-4" />
                                {text.edit}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="min-h-[44px] gap-1.5 text-destructive hover:bg-destructive/10"
                                onClick={() => setDeleteTargetId(addr.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                                {text.delete}
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust CTA */}
      <section className="section-padding-sm section-alt-vision">
        <div className="container-wide">
          <div
            className={cn(
              'profile-card-doodle rounded-2xl border border-border bg-card p-6 sm:p-8',
              'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'
            )}
          >
            <div>
              <p className={cn('text-foreground font-semibold', language === 'ar' && 'font-cairo')}>{text.trustTitle}</p>
              <p className={cn('mt-1 text-sm text-muted-foreground', language === 'ar' && 'font-tajawal')}>{text.trustDesc}</p>
            </div>
            <Button
              variant="outline"
              size="md"
              className="shrink-0 border-primary text-primary hover:bg-primary hover:text-primary-foreground min-h-[44px]"
              asChild
            >
              <Link to="/contact">{text.contactUs}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Delete address confirmation */}
      <Dialog open={!!deleteTargetId} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
        <DialogContent showClose={true} className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{text.deleteAddressTitle}</DialogTitle>
            <DialogDescription>{text.deleteAddressDesc}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTargetId(null)} disabled={isDeletingAddress}>
              {text.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteTargetId && handleDeleteAddress(deleteTargetId)}
              disabled={isDeletingAddress}
              className="gap-2"
            >
              {isDeletingAddress ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              {text.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ProfilePage
