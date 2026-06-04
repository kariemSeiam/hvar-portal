import { useState, useCallback } from 'react'
import * as Label from '@radix-ui/react-label'
import * as Select from '@radix-ui/react-select'
import { useLanguage } from '@/contexts/LanguageContext'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog'
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  ChevronDown,
  Image as ImageIcon,
  AlertTriangle,
  Loader2,
} from 'lucide-react'
import {
  useAdminSlides,
  useAdminProducts,
  useCreateSlide,
  useUpdateSlide,
  useDeleteSlide,
  type Slide,
  type CreateSlideInput,
} from '@/hooks/useAdmin'
import { useToast } from '@/hooks/useToast'
import { useQueryClient } from '@tanstack/react-query'
import { adminKeys } from '@/hooks/useAdmin'

interface SlideFormData {
  title: string
  description: string
  productId: string | null
  position: number
  status: 'active' | 'inactive'
}

const initialFormData: SlideFormData = {
  title: '',
  description: '',
  productId: null,
  position: 1,
  status: 'active',
}

export default function SlidesPage() {
  const { language, dir, isRTL } = useLanguage()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedSlide, setSelectedSlide] = useState<Slide | null>(null)
  const [formData, setFormData] = useState<SlideFormData>(initialFormData)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [editImageFile, setEditImageFile] = useState<File | null>(null)

  const { data: slidesData, isLoading, error } = useAdminSlides()
  const { data: productsData } = useAdminProducts({})
  const createSlide = useCreateSlide()
  const updateSlide = useUpdateSlide()
  const deleteSlide = useDeleteSlide()

  const slides = slidesData ?? []
  const products = productsData?.products ?? []

  const t = useCallback(
    (key: string): string => {
      const translations: Record<string, Record<'ar' | 'en', string>> = {
        'slides.title': { ar: 'إدارة السلايدرات', en: 'Slides Management' },
        'slides.addSlide': { ar: 'إضافة سلايدر', en: 'Add Slide' },
        'slides.position': { ar: 'الترتيب', en: 'Position' },
        'slides.image': { ar: 'الصورة', en: 'Image' },
        'slides.titleLabel': { ar: 'العنوان', en: 'Title' },
        'slides.description': { ar: 'الوصف', en: 'Description' },
        'slides.imageFile': { ar: 'ملف الصورة', en: 'Image file' },
        'slides.linkedProduct': { ar: 'المنتج المرتبط', en: 'Linked Product' },
        'slides.noProduct': { ar: 'بدون منتج', en: 'No Product' },
        'slides.status': { ar: 'الحالة', en: 'Status' },
        'slides.active': { ar: 'نشط', en: 'Active' },
        'slides.inactive': { ar: 'غير نشط', en: 'Inactive' },
        'slides.actions': { ar: 'الإجراءات', en: 'Actions' },
        'slides.edit': { ar: 'تعديل', en: 'Edit' },
        'slides.delete': { ar: 'حذف', en: 'Delete' },
        'slides.cancel': { ar: 'إلغاء', en: 'Cancel' },
        'slides.save': { ar: 'حفظ', en: 'Save' },
        'slides.deleteConfirm': { ar: 'تأكيد الحذف', en: 'Confirm Delete' },
        'slides.deleteMessage': {
          ar: 'هل أنت متأكد من حذف هذا السلايدر؟',
          en: 'Are you sure you want to delete this slide?',
        },
        'slides.deleteWarning': {
          ar: 'لا يمكن التراجع عن هذا الإجراء.',
          en: 'This action cannot be undone.',
        },
        'slides.noSlides': { ar: 'لا توجد سلايدرات', en: 'No slides found' },
        'slides.dragToReorder': { ar: 'اسحب لإعادة الترتيب', en: 'Drag to reorder' },
        'slides.selectProduct': { ar: 'اختر منتج...', en: 'Select product...' },
        'slides.requiredField': { ar: 'هذا الحقل مطلوب', en: 'This field is required' },
        'slides.imageRequired': { ar: 'ملف الصورة مطلوب', en: 'Image file is required' },
        'slides.imageSizeHint': { ar: 'موصى به: 800×800 بكسل (1:1). استخدم صور هوية أو منتج في السياق؛ تجنب النصوص الكثيفة أو شبكات المنتجات.', en: 'Recommended: 800×800px (1:1). Use brand or product-in-context imagery; avoid dense text or product grids so the hero stays readable in 3s.' },
        'slides.replaceImage': { ar: 'استبدال الصورة', en: 'Replace image' },
        'slides.replaceImageOptional': { ar: 'استبدال الصورة (اختياري)', en: 'Replace image (optional)' },
        'slides.optional': { ar: '(اختياري)', en: '(optional)' },
      }
      return translations[key]?.[language as 'ar' | 'en'] ?? key
    },
    [language]
  )

  const handleDragStart = useCallback((index: number) => setDraggedIndex(index), [])
  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }, [])
  const handleDragEnd = useCallback(async () => {
    if (draggedIndex === null || dragOverIndex === null || draggedIndex === dragOverIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }
    const newSlides = [...slides]
    const [dragged] = newSlides.splice(draggedIndex, 1)
    newSlides.splice(dragOverIndex, 0, dragged)
    try {
      for (let i = 0; i < newSlides.length; i++) {
        await updateSlide.mutateAsync({
          id: newSlides[i].id,
          data: { position: i + 1 },
        })
      }
      queryClient.invalidateQueries({ queryKey: adminKeys.slides() })
      toast({ title: language === 'ar' ? 'تم تحديث الترتيب' : 'Order updated' })
    } catch (e) {
      toast({
        title: e instanceof Error ? e.message : (language === 'ar' ? 'فشل التحديث' : 'Update failed'),
        variant: 'destructive',
      })
    }
    setDraggedIndex(null)
    setDragOverIndex(null)
  }, [draggedIndex, dragOverIndex, slides, updateSlide, queryClient, toast, language])

  const openAddDialog = useCallback(() => {
    setFormData({ ...initialFormData, position: slides.length + 1 })
    setImageFile(null)
    setIsAddDialogOpen(true)
  }, [slides.length])

  const openEditDialog = useCallback((slide: Slide) => {
    setSelectedSlide(slide)
    setFormData({
      title: slide.title,
      description: slide.description ?? '',
      productId: slide.productId,
      position: slide.position,
      status: slide.status,
    })
    setImageFile(null)
    setEditImageFile(null)
    setIsEditDialogOpen(true)
  }, [])

  const openDeleteDialog = useCallback((slide: Slide) => {
    setSelectedSlide(slide)
    setIsDeleteDialogOpen(true)
  }, [])

  const addValidationError = useCallback((): string | null => {
    if (!formData.title.trim()) return t('slides.requiredField')
    return null
  }, [formData.title, t])

  const handleAddSlide = useCallback(() => {
    if (!imageFile) {
      toast({ title: t('slides.imageRequired'), variant: 'destructive' })
      return
    }
    const err = addValidationError()
    if (err) {
      toast({ title: err, variant: 'destructive' })
      return
    }
    const payload: CreateSlideInput = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      productId: formData.productId ?? null,
      image: imageFile,
      placement: 'offer',
    }
    createSlide.mutate(payload, {
      onSuccess: () => {
        setIsAddDialogOpen(false)
        setFormData(initialFormData)
        setImageFile(null)
        toast({ title: language === 'ar' ? 'تمت إضافة السلايدر' : 'Slide added' })
      },
      onError: (e) =>
        toast({
          title: e?.message ?? (language === 'ar' ? 'فشل الإضافة' : 'Create failed'),
          variant: 'destructive',
        }),
    })
  }, [formData, imageFile, createSlide, toast, t, language, addValidationError])

  const editValidationError = useCallback((): string | null => {
    if (!formData.title.trim()) return t('slides.requiredField')
    return null
  }, [formData.title, t])

  const handleEditSlide = useCallback(() => {
    if (!selectedSlide) return
    const err = editValidationError()
    if (err) {
      toast({ title: err, variant: 'destructive' })
      return
    }
    updateSlide.mutate(
      {
        id: selectedSlide.id,
        data: {
          title: formData.title.trim(),
          description: formData.description.trim(),
          productId: formData.productId ?? null,
          position: formData.position,
          status: formData.status,
        },
        image: editImageFile ?? undefined,
      },
      {
        onSuccess: () => {
          setIsEditDialogOpen(false)
          setSelectedSlide(null)
          setFormData(initialFormData)
          toast({ title: language === 'ar' ? 'تم تحديث السلايدر' : 'Slide updated' })
        },
        onError: (e) =>
          toast({
            title: e?.message ?? (language === 'ar' ? 'فشل التحديث' : 'Update failed'),
            variant: 'destructive',
          }),
      }
    )
  }, [selectedSlide, formData, editImageFile, updateSlide, toast, language, editValidationError])

  const handleDeleteSlide = useCallback(() => {
    if (!selectedSlide) return
    deleteSlide.mutate(selectedSlide.id, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false)
        setSelectedSlide(null)
        toast({ title: language === 'ar' ? 'تم حذف السلايدر' : 'Slide deleted' })
      },
      onError: (e) =>
        toast({
          title: e?.message ?? (language === 'ar' ? 'فشل الحذف' : 'Delete failed'),
          variant: 'destructive',
        }),
    })
  }, [selectedSlide, deleteSlide, toast, language])

  const closeAddDialog = useCallback(() => {
    setIsAddDialogOpen(false)
    setFormData(initialFormData)
    setImageFile(null)
  }, [])
  const closeEditDialog = useCallback(() => {
    setIsEditDialogOpen(false)
    setSelectedSlide(null)
    setFormData(initialFormData)
    setEditImageFile(null)
  }, [])
  const closeDeleteDialog = useCallback(() => setIsDeleteDialogOpen(false), [])

  const StatusBadge = ({ status }: { status: 'active' | 'inactive' }) => (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
        status === 'active'
          ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400'
          : 'bg-muted text-muted-foreground'
      )}
    >
      {status === 'active' ? t('slides.active') : t('slides.inactive')}
    </span>
  )

  const productName = (productId: string | null) => {
    if (!productId) return null
    const p = products.find((x) => x.id === productId)
    return p ? (language === 'ar' ? p.nameAr : p.nameEn) : null
  }

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-h2 font-bold text-foreground">{t('slides.title')}</h1>
            <p className="text-muted-foreground mt-1">{t('slides.dragToReorder')}</p>
          </div>
          <Button onClick={openAddDialog} className="gap-2 bg-gold-500 hover:bg-gold-600 text-stone-900">
            <Plus className="h-4 w-4" />
            {t('slides.addSlide')}
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-gold-500" />
          </div>
        ) : slides.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-2xl border border-border">
            <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t('slides.noSlides')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={cn(
                  'bg-card rounded-xl border border-border p-4 transition-all duration-200',
                  'hover:border-gold-400 hover:shadow-card-hover',
                  draggedIndex === index && 'opacity-50 scale-[0.98]',
                  dragOverIndex === index && draggedIndex !== index && 'border-gold-500 border-2'
                )}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      'flex-shrink-0 cursor-grab active:cursor-grabbing p-2 rounded-lg',
                      'hover:bg-gold-100 dark:hover:bg-gold-900/20 text-muted-foreground hover:text-gold-600'
                    )}
                  >
                    <GripVertical className="h-5 w-5" />
                  </div>
                  <div className="flex-shrink-0 w-16 h-12 bg-muted rounded-lg overflow-hidden">
                    {slide.imageUrl ? (
                      <img
                        src={slide.imageUrl}
                        alt={slide.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gold-100 dark:bg-gold-900/30 flex items-center justify-center">
                    <span className="text-sm font-bold text-gold-600">{slide.position}</span>
                  </div>
                  <div className="flex-grow min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{slide.title}</h3>
                    {productName(slide.productId) && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{productName(slide.productId)}</p>
                    )}
                  </div>
                  <div className="flex-shrink-0 hidden sm:block">
                    <StatusBadge status={slide.status} />
                  </div>
                  <div className={cn('flex items-center gap-2 flex-shrink-0', isRTL ? 'flex-row-reverse' : '')}>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(slide)}
                      className="hover:bg-gold-100 dark:hover:bg-gold-900/20 hover:text-gold-600"
                      aria-label={t('slides.edit')}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openDeleteDialog(slide)}
                      className="hover:bg-danger-100 dark:hover:bg-danger-900/20 hover:text-danger-600"
                      aria-label={t('slides.delete')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="sm:hidden mt-3 pt-3 border-t border-border">
                  <StatusBadge status={slide.status} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => !open && closeAddDialog()}>
          <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto" dir={dir} aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-foreground">{t('slides.addSlide')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label.Root htmlFor="add-title" className="text-sm font-medium text-foreground">
                    {t('slides.titleLabel')} *
                  </Label.Root>
                  <input
                    id="add-title"
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
                    placeholder={t('slides.titleLabel')}
                  />
                </div>
                <div className="space-y-2">
                  <Label.Root htmlFor="add-desc" className="text-sm font-medium text-foreground">
                    {t('slides.description')}
                  </Label.Root>
                  <textarea
                    id="add-desc"
                    value={formData.description}
                    onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label.Root className="text-sm font-medium text-foreground">{t('slides.imageFile')} *</Label.Root>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                    className="w-full text-sm text-foreground file:me-4 file:py-2 file:px-4 file:rounded-lg file:border file:border-gold-500 file:bg-gold-50 file:text-gold-700"
                  />
                  <p className="text-xs text-muted-foreground">{t('slides.imageSizeHint')}</p>
                </div>
                <div className="space-y-2">
                    <Label.Root className="text-sm font-medium text-foreground">{t('slides.linkedProduct')} {t('slides.optional')}</Label.Root>
                    <Select.Root
                      value={formData.productId ?? 'none'}
                      onValueChange={(v) => setFormData((p) => ({ ...p, productId: v === 'none' ? null : v }))}
                    >
                      <Select.Trigger className="w-full flex min-h-[44px] items-center justify-between rounded-xl border-2 border-border bg-background px-4 py-2.5 text-sm text-foreground hover:border-gold-500/30 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-0 focus:border-gold-500 focus:shadow-gold-sm transition-all duration-200 dark:bg-card dark:border-stone-700">
                        <Select.Value placeholder={t('slides.selectProduct')} />
                        <Select.Icon asChild>
                          <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                        </Select.Icon>
                      </Select.Trigger>
                      <Select.Portal>
                        <Select.Content className="overflow-hidden rounded-xl border-2 border-border bg-card shadow-card z-[200] data-[state=open]:animate-fade-in data-[state=open]:animate-scale-in" position="popper" sideOffset={4}>
                          <Select.Viewport className="p-1">
                            <Select.Item value="none" className="relative flex cursor-default select-none items-center rounded-lg py-2 px-4 text-sm outline-none transition-colors hover:bg-gold-100 dark:hover:bg-gold-900/20 focus:bg-gold-100 dark:focus:bg-gold-900/20 data-[state=checked]:bg-gold-50 dark:data-[state=checked]:bg-gold-900/30">
                              <Select.ItemText>{t('slides.noProduct')}</Select.ItemText>
                            </Select.Item>
                            {products.map((product) => (
                              <Select.Item key={product.id} value={product.id} className="relative flex cursor-default select-none items-center rounded-lg py-2 px-4 text-sm outline-none transition-colors hover:bg-gold-100 dark:hover:bg-gold-900/20 focus:bg-gold-100 dark:focus:bg-gold-900/20 data-[state=checked]:bg-gold-50 dark:data-[state=checked]:bg-gold-900/30">
                                <Select.ItemText>{language === 'ar' ? product.nameAr : product.nameEn}</Select.ItemText>
                              </Select.Item>
                            ))}
                          </Select.Viewport>
                        </Select.Content>
                      </Select.Portal>
                    </Select.Root>
                  </div>
                <DialogFooter className="pt-4 border-t border-border">
                  <Button variant="outline" onClick={closeAddDialog} className="min-h-[44px]">
                    {t('slides.cancel')}
                  </Button>
                  <Button
                    onClick={handleAddSlide}
                    disabled={
                      !formData.title.trim() ||
                      !imageFile ||
                      createSlide.isPending
                    }
                    className="min-h-[44px] bg-gold-500 hover:bg-gold-600 text-stone-900"
                  >
                    {createSlide.isPending ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') : t('slides.save')}
                  </Button>
                </DialogFooter>
              </div>
          </DialogContent>
        </Dialog>

        {/* Edit dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => !open && closeEditDialog()}>
          <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto" dir={dir} aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-foreground">{t('slides.edit')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label.Root className="text-sm font-medium text-foreground">{t('slides.titleLabel')} *</Label.Root>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label.Root className="text-sm font-medium text-foreground">{t('slides.description')}</Label.Root>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label.Root className="text-sm font-medium text-foreground">{t('slides.linkedProduct')} {t('slides.optional')}</Label.Root>
                  <Select.Root
                    value={formData.productId ?? 'none'}
                    onValueChange={(v) => setFormData((p) => ({ ...p, productId: v === 'none' ? null : v }))}
                  >
                    <Select.Trigger className="w-full flex min-h-[44px] items-center justify-between rounded-xl border-2 border-border bg-background px-4 py-2.5 text-sm text-foreground hover:border-gold-500/30 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-0 focus:border-gold-500 focus:shadow-gold-sm transition-all duration-200 dark:bg-card dark:border-stone-700">
                      <Select.Value placeholder={t('slides.selectProduct')} />
                      <Select.Icon asChild>
                        <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                      </Select.Icon>
                    </Select.Trigger>
                    <Select.Portal>
                      <Select.Content className="overflow-hidden rounded-xl border-2 border-border bg-card shadow-card z-[200] data-[state=open]:animate-fade-in data-[state=open]:animate-scale-in" position="popper" sideOffset={4}>
                        <Select.Viewport className="p-1">
                          <Select.Item value="none" className="relative flex cursor-default select-none items-center rounded-lg py-2 px-4 text-sm outline-none transition-colors hover:bg-gold-100 dark:hover:bg-gold-900/20 focus:bg-gold-100 dark:focus:bg-gold-900/20 data-[state=checked]:bg-gold-50 dark:data-[state=checked]:bg-gold-900/30">
                            <Select.ItemText>{t('slides.noProduct')}</Select.ItemText>
                          </Select.Item>
                          {products.map((product) => (
                            <Select.Item key={product.id} value={product.id} className="relative flex cursor-default select-none items-center rounded-lg py-2 px-4 text-sm outline-none transition-colors hover:bg-gold-100 dark:hover:bg-gold-900/20 focus:bg-gold-100 dark:focus:bg-gold-900/20 data-[state=checked]:bg-gold-50 dark:data-[state=checked]:bg-gold-900/30">
                              <Select.ItemText>{language === 'ar' ? product.nameAr : product.nameEn}</Select.ItemText>
                            </Select.Item>
                          ))}
                        </Select.Viewport>
                      </Select.Content>
                    </Select.Portal>
                  </Select.Root>
                </div>
                <div className="space-y-2">
                  <Label.Root className="text-sm font-medium text-foreground">{t('slides.position')}</Label.Root>
                  <input
                    type="number"
                    min={1}
                    value={formData.position}
                    onChange={(e) => setFormData((p) => ({ ...p, position: parseInt(e.target.value, 10) || 1 }))}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label.Root className="text-sm font-medium text-foreground">{t('slides.status')}</Label.Root>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="edit-status"
                        value="active"
                        checked={formData.status === 'active'}
                        onChange={() => setFormData((p) => ({ ...p, status: 'active' }))}
                        className="w-4 h-4 text-gold-500 border-input focus:ring-gold-500"
                      />
                      <span className="text-sm text-foreground">{t('slides.active')}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="edit-status"
                        value="inactive"
                        checked={formData.status === 'inactive'}
                        onChange={() => setFormData((p) => ({ ...p, status: 'inactive' }))}
                        className="w-4 h-4 text-gold-500 border-input focus:ring-gold-500"
                      />
                      <span className="text-sm text-foreground">{t('slides.inactive')}</span>
                    </label>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label.Root className="text-sm font-medium text-foreground">{t('slides.replaceImageOptional')}</Label.Root>
                  {selectedSlide?.imageUrl && (
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                      <img src={selectedSlide.imageUrl} alt="" className="w-14 h-14 rounded object-cover flex-shrink-0" />
                      <span className="text-xs text-muted-foreground">
                        {editImageFile ? editImageFile.name : (language === 'ar' ? 'الصورة الحالية' : 'Current image')}
                      </span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setEditImageFile(e.target.files?.[0] ?? null)}
                    className="w-full text-sm text-foreground file:me-4 file:py-2 file:px-4 file:rounded-lg file:border file:border-gold-500 file:bg-gold-50 file:text-gold-700"
                  />
                </div>
                <DialogFooter className="pt-4 border-t border-border">
                  <Button variant="outline" onClick={closeEditDialog} className="min-h-[44px]">
                    {t('slides.cancel')}
                  </Button>
                  <Button
                    onClick={handleEditSlide}
                    disabled={
                      !formData.title.trim() ||
                      updateSlide.isPending
                    }
                    className="min-h-[44px] bg-gold-500 hover:bg-gold-600 text-stone-900"
                  >
                    {updateSlide.isPending ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') : t('slides.save')}
                  </Button>
                </DialogFooter>
              </div>
          </DialogContent>
        </Dialog>

        {/* Delete dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={(open) => !open && closeDeleteDialog()}>
          <DialogContent className="w-[95vw] max-w-md" dir={dir}>
            <DialogHeader>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-danger-100 dark:bg-danger-900/30 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-danger-600" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-foreground">{t('slides.deleteConfirm')}</DialogTitle>
                  <DialogDescription>{t('slides.deleteMessage')}</DialogDescription>
                </div>
              </div>
            </DialogHeader>
            {selectedSlide && (
              <div className="mb-6 p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-background flex-shrink-0">
                    {selectedSlide.imageUrl ? (
                      <img src={selectedSlide.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{selectedSlide.title}</p>
                    <p className="text-sm text-danger-600">{t('slides.deleteWarning')}</p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter className={cn(isRTL && 'flex-row-reverse')}>
              <Button variant="outline" className="flex-1 min-h-[44px]" onClick={closeDeleteDialog}>
                {t('slides.cancel')}
              </Button>
              <Button
                variant="destructive"
                className="flex-1 min-h-[44px]"
                onClick={handleDeleteSlide}
                disabled={deleteSlide.isPending}
              >
                {deleteSlide.isPending ? (language === 'ar' ? 'جاري الحذف...' : 'Deleting...') : t('slides.delete')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
