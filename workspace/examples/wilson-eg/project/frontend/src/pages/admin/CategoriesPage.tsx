import { useState, useCallback } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Button } from '@/components/ui/Button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import {
  useAdminCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  type Category as AdminCategory,
} from '@/hooks/useAdmin'
import { useToast } from '@/hooks/useToast'
import { useQueryClient } from '@tanstack/react-query'
import { adminKeys } from '@/hooks/useAdmin'
import { CategoryIcon } from '@/components/icons/CategoryIcons'
import { Plus, Pencil, Trash2, Loader2, GripVertical, FolderOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

const emptyForm = {
  slug: '',
  nameAr: '',
  nameEn: '',
  sortOrder: 0,
}

export default function CategoriesPage() {
  const { language, dir, isRTL } = useLanguage()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [addOpen, setAddOpen] = useState(false)
  const [editCategory, setEditCategory] = useState<AdminCategory | null>(null)
  const [deleteCategory, setDeleteCategory] = useState<AdminCategory | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const { data: categoriesRaw = [], isLoading, error } = useAdminCategories()
  const categories = [...categoriesRaw].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  const createCat = useCreateCategory()
  const updateCat = useUpdateCategory()
  const deleteCat = useDeleteCategory()

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
    const newOrder = [...categories]
    const [dragged] = newOrder.splice(draggedIndex, 1)
    newOrder.splice(dragOverIndex, 0, dragged)
    try {
      for (let i = 0; i < newOrder.length; i++) {
        await updateCat.mutateAsync({
          id: newOrder[i].id,
          data: { sortOrder: i },
        })
      }
      queryClient.invalidateQueries({ queryKey: adminKeys.categories() })
      toast({ title: language === 'ar' ? 'تم تحديث الترتيب' : 'Order updated' })
    } catch (e) {
      toast({
        title: e instanceof Error ? e.message : (language === 'ar' ? 'فشل التحديث' : 'Update failed'),
        variant: 'destructive',
      })
    }
    setDraggedIndex(null)
    setDragOverIndex(null)
  }, [draggedIndex, dragOverIndex, categories, updateCat, queryClient, toast, language])

  const openAdd = () => {
    setForm(emptyForm)
    setAddOpen(true)
  }
  const openEdit = (c: AdminCategory) => {
    setEditCategory(c)
    setForm({
      slug: c.slug,
      nameAr: c.nameAr,
      nameEn: c.nameEn,
      sortOrder: c.sortOrder ?? 0,
    })
  }
  const openDelete = (c: AdminCategory) => setDeleteCategory(c)

  const handleCreate = () => {
    if (!form.slug.trim() || !form.nameAr.trim() || !form.nameEn.trim()) {
      toast({
        title: language === 'ar' ? 'املأ الحقول المطلوبة' : 'Fill required fields',
        variant: 'destructive',
      })
      return
    }
    createCat.mutate(
      {
        slug: form.slug.trim().toLowerCase().replace(/\s+/g, '_'),
        nameAr: form.nameAr.trim(),
        nameEn: form.nameEn.trim(),
        sortOrder: form.sortOrder,
      },
      {
        onSuccess: () => {
          setAddOpen(false)
          toast({ title: language === 'ar' ? 'تمت إضافة الفئة' : 'Category added' })
        },
        onError: (e) => {
          toast({
            title: e?.message ?? (language === 'ar' ? 'فشل الحفظ' : 'Save failed'),
            variant: 'destructive',
          })
        },
      }
    )
  }

  const handleUpdate = () => {
    if (!editCategory || !form.slug.trim() || !form.nameAr.trim() || !form.nameEn.trim()) {
      toast({
        title: language === 'ar' ? 'املأ الحقول المطلوبة' : 'Fill required fields',
        variant: 'destructive',
      })
      return
    }
    updateCat.mutate(
      {
        id: editCategory.id,
        data: {
          slug: form.slug.trim().toLowerCase().replace(/\s+/g, '_'),
          nameAr: form.nameAr.trim(),
          nameEn: form.nameEn.trim(),
          sortOrder: form.sortOrder,
        },
      },
      {
        onSuccess: () => {
          setEditCategory(null)
          toast({ title: language === 'ar' ? 'تم تحديث الفئة' : 'Category updated' })
        },
        onError: (e) => {
          toast({
            title: e?.message ?? (language === 'ar' ? 'فشل التحديث' : 'Update failed'),
            variant: 'destructive',
          })
        },
      }
    )
  }

  const handleDelete = () => {
    if (!deleteCategory) return
    deleteCat.mutate(deleteCategory.id, {
      onSuccess: () => {
        setDeleteCategory(null)
        toast({ title: language === 'ar' ? 'تم حذف الفئة' : 'Category deleted' })
      },
      onError: (e) => {
        toast({
          title: e?.message ?? (language === 'ar' ? 'فشل الحذف' : 'Delete failed'),
          variant: 'destructive',
        })
      },
    })
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <p className="text-destructive">{error.message}</p>
      </div>
    )
  }

  const t = (ar: string, en: string) => (language === 'ar' ? ar : en)

  return (
    <div className="min-h-screen bg-background">
      <div className="container-wide py-6 lg:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-h2 font-bold text-foreground">{t('إدارة الفئات', 'Categories Management')}</h1>
            <p className="text-muted-foreground mt-1">{t('اسحب لإعادة الترتيب', 'Drag to reorder')}</p>
          </div>
          <Button onClick={openAdd} className="gap-2 bg-gold-500 hover:bg-gold-600 text-stone-900">
            <Plus className="h-4 w-4" />
            {t('إضافة فئة', 'Add Category')}
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-gold-500" />
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-2xl border border-border">
            <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t('لا توجد فئات', 'No categories yet')}</p>
            <Button variant="outline" className="gap-2 mt-4" onClick={openAdd}>
              <Plus className="h-4 w-4" />
              {t('إضافة فئة', 'Add Category')}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {categories.map((c, index) => (
              <div
                key={c.id}
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
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gold-100 dark:bg-gold-900/30 flex items-center justify-center">
                    <CategoryIcon categoryKey={c.slug} size={24} className="text-gold-600" />
                  </div>
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gold-100 dark:bg-gold-900/30 flex items-center justify-center">
                    <span className="text-sm font-bold text-gold-600">{c.sortOrder ?? index}</span>
                  </div>
                  <div className="flex-grow min-w-0">
                    <h3 className="font-semibold text-foreground truncate">
                      {language === 'ar' ? c.nameAr : c.nameEn}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate mt-0.5 font-mono">{c.slug}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="text-sm text-muted-foreground tabular-nums">
                      {c.productCount} {t('منتج', 'products')}
                    </span>
                  </div>
                  <div className={cn('flex items-center gap-2 flex-shrink-0', isRTL ? 'flex-row-reverse' : '')}>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(c)}
                      className="hover:bg-gold-100 dark:hover:bg-gold-900/20 hover:text-gold-600"
                      aria-label={t('تعديل', 'Edit')}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openDelete(c)}
                      className="hover:bg-danger-100 dark:hover:bg-danger-900/20 hover:text-danger-600"
                      aria-label={t('حذف', 'Delete')}
                      disabled={c.productCount > 0}
                      title={
                        c.productCount > 0
                          ? t('لا يمكن الحذف: توجد منتجات مرتبطة', 'Cannot delete: products use this category')
                          : undefined
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Category Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent dir={dir}>
          <DialogHeader>
            <DialogTitle>{t('إضافة فئة', 'Add Category')}</DialogTitle>
            <DialogDescription>
              {t('أدخل الرابط والأسماء بالعربية والإنجليزية.', 'Enter slug and names in Arabic and English.')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>{t('الرابط (slug)', 'Slug')}</Label>
              <Input
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="e.g. freezers"
              />
            </div>
            <div className="grid gap-2">
              <Label>{t('الاسم (عربي)', 'Name (Arabic)')}</Label>
              <Input
                value={form.nameAr}
                onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))}
                placeholder={t('الفريزرات', 'Freezers')}
              />
            </div>
            <div className="grid gap-2">
              <Label>{t('الاسم (إنجليزي)', 'Name (English)')}</Label>
              <Input
                value={form.nameEn}
                onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))}
                placeholder="Freezers"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-muted-foreground">{t('ترتيب العرض', 'Sort order')}</Label>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: parseInt(e.target.value, 10) || 0 }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              {t('إلغاء', 'Cancel')}
            </Button>
            <Button
              className="bg-gold-500 hover:bg-gold-600 text-stone-900"
              onClick={handleCreate}
              disabled={createCat.isPending}
            >
              {createCat.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t('إضافة', 'Add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={!!editCategory} onOpenChange={(open) => !open && setEditCategory(null)}>
        <DialogContent dir={dir}>
          <DialogHeader>
            <DialogTitle>{t('تعديل الفئة', 'Edit Category')}</DialogTitle>
            <DialogDescription>
              {t('تعديل الرابط والأسماء.', 'Edit slug and names.')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>{t('الرابط (slug)', 'Slug')}</Label>
              <Input
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="e.g. freezers"
              />
            </div>
            <div className="grid gap-2">
              <Label>{t('الاسم (عربي)', 'Name (Arabic)')}</Label>
              <Input
                value={form.nameAr}
                onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label>{t('الاسم (إنجليزي)', 'Name (English)')}</Label>
              <Input
                value={form.nameEn}
                onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-muted-foreground">{t('ترتيب العرض', 'Sort order')}</Label>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: parseInt(e.target.value, 10) || 0 }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCategory(null)}>
              {t('إلغاء', 'Cancel')}
            </Button>
            <Button
              className="bg-gold-500 hover:bg-gold-600 text-stone-900"
              onClick={handleUpdate}
              disabled={updateCat.isPending}
            >
              {updateCat.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t('حفظ', 'Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteCategory} onOpenChange={(open) => !open && setDeleteCategory(null)}>
        <DialogContent dir={dir}>
          <DialogHeader>
            <DialogTitle>{t('تأكيد الحذف', 'Confirm Delete')}</DialogTitle>
            <DialogDescription>
              {deleteCategory
                ? t(
                    `هل أنت متأكد من حذف الفئة "${deleteCategory.nameAr}"؟ لا يمكن الحذف إذا كانت تحتوي على منتجات.`,
                    `Are you sure you want to delete "${deleteCategory.nameEn}"? Cannot delete if it has products.`
                  )
                : ''}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteCategory(null)}>
              {t('إلغاء', 'Cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteCat.isPending || (deleteCategory?.productCount ?? 0) > 0}
            >
              {deleteCat.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t('حذف', 'Delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
