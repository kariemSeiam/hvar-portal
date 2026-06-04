import { useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Button } from '@/components/ui/Button'
import { cn, formatPrice } from '@/lib/utils'
import {
  useAdminProducts,
  useAdminCategories,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useUpdateProductInventory,
  adminApi,
  type AdminProduct,
  type AdminProductCreateInput,
  type AdminProductUpdateInput,
} from '@/hooks/useAdmin'
import { Link } from 'react-router-dom'
import { useToast } from '@/hooks/useToast'
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Package,
  AlertCircle,
  X,
  ImagePlus,
  Loader2,
} from 'lucide-react'
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

/** Badge/tag colors for Wilson — work on both light and dark themes (white text on fill) */
const BADGE_COLOR_OPTIONS: { value: string; labelAr: string; labelEn: string }[] = [
  { value: '', labelAr: '— بدون لون —', labelEn: '— No color —' },
  { value: '#FEB636', labelAr: 'ذهبي (ويلسون)', labelEn: 'Gold (Wilson)' },
  { value: '#7C3AED', labelAr: 'بنفسجي', labelEn: 'Purple' },
  { value: '#6D28D9', labelAr: 'بنفسجي غامق', labelEn: 'Deep purple' },
  { value: '#059669', labelAr: 'أخضر (جديد)', labelEn: 'Green (New)' },
  { value: '#DC2626', labelAr: 'أحمر (عرض)', labelEn: 'Red (Sale)' },
  { value: '#EA580C', labelAr: 'برتقالي', labelEn: 'Orange' },
  { value: '#2563EB', labelAr: 'أزرق', labelEn: 'Blue' },
  { value: '#1F2937', labelAr: 'رمادي غامق', labelEn: 'Dark gray' },
]

// Category options: from API for dropdowns; filter list adds "all"
/** Resolve image src for display (handles full URL or relative path) */
function resolveImageSrc(url: string): string {
  if (!url) return ''
  if (url.startsWith('http') || url.startsWith('/')) return url
  return `/${url.startsWith('uploads/') ? url : 'uploads/' + url}`
}

function VariantImageManager({
  items,
  onAdd,
  onRemove,
  isUploading,
  disabled,
  language,
}: {
  items: Array<{ url: string; file?: File }>
  onAdd: (file: File) => void | Promise<void>
  onRemove: (item: { url: string; file?: File }) => void
  isUploading?: boolean
  disabled?: boolean
  language: string
}) {
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !file.type.startsWith('image/')) return
    await onAdd(file)
  }
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">
        {language === 'ar' ? 'صور المنتج' : 'Product images'}
      </Label>
      <div className="flex flex-wrap gap-2 items-center">
        {items.map((item, i) => (
          <div key={i} className="relative group">
            <img
              src={item.url.startsWith('blob:') ? item.url : resolveImageSrc(item.url)}
              alt=""
              className="w-16 h-16 rounded-lg object-cover border border-border bg-muted"
            />
            {!disabled && (
              <button
                type="button"
                onClick={() => onRemove(item)}
                className="absolute -top-1 -end-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity"
                aria-label={language === 'ar' ? 'إزالة' : 'Remove'}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
        {!disabled && (
          <label className="w-16 h-16 rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center cursor-pointer transition-colors bg-muted/20">
            {isUploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <ImagePlus className="h-6 w-6 text-muted-foreground" />
            )}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </label>
        )}
      </div>
    </div>
  )
}

const useCategoryOptions = () => {
  const { data: apiCategories = [] } = useAdminCategories()
  const filterOptions = [
    { value: 'all', labelAr: 'كل الفئات', labelEn: 'All Categories' },
    ...apiCategories.map((c) => ({ value: c.slug, labelAr: c.nameAr, labelEn: c.nameEn })),
  ]
  const formOptions = apiCategories.map((c) => ({ value: c.slug, labelAr: c.nameAr, labelEn: c.nameEn }))
  return { filterOptions, formOptions }
}

const AdminProductsPage = () => {
  const { language, dir, isRTL } = useLanguage()
  const { toast } = useToast()
  const { filterOptions, formOptions } = useCategoryOptions()
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [addOpen, setAddOpen] = useState(false)
  const [addUploadingImages, setAddUploadingImages] = useState(false)
  const [editProduct, setEditProduct] = useState<AdminProduct | null>(null)
  const [inventoryProduct, setInventoryProduct] = useState<AdminProduct | null>(null)
  const [inventoryDraft, setInventoryDraft] = useState<Array<{ id: string; sizes: Array<{ size: string; quantity: number }> }>>([])
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const openInventory = (product: AdminProduct) => {
    setInventoryProduct(product)
    setInventoryDraft(
      product.variants.map((v) => ({
        id: v.id,
        sizes: v.sizes.map((s) => ({ size: s.size, quantity: s.quantity })),
      }))
    )
  }
  const closeInventory = () => {
    setInventoryProduct(null)
    setInventoryDraft([])
  }
  const setInventoryQuantity = (variantIdx: number, sizeIdx: number, quantity: number) => {
    setInventoryDraft((prev) =>
      prev.map((v, vi) =>
        vi === variantIdx
          ? { ...v, sizes: v.sizes.map((s, si) => (si === sizeIdx ? { ...s, quantity } : s)) }
          : v
      )
    )
  }
  const submitInventory = async () => {
    if (!inventoryProduct) return
    try {
      await updateInventory.mutateAsync({
        id: inventoryProduct.id,
        variants: inventoryDraft,
      })
      closeInventory()
      toast({ title: language === 'ar' ? 'تم تحديث المخزون' : 'Stock updated' })
    } catch (e) {
      toast({
        title: (e as Error)?.message ?? (language === 'ar' ? 'فشل التحديث' : 'Update failed'),
        variant: 'destructive',
      })
    }
  }

  const filters: Record<string, string> = {
    page: String(currentPage),
    ...(searchQuery && { search: searchQuery }),
    ...(categoryFilter !== 'all' && { category: categoryFilter }),
  }
  const { data, isLoading, error } = useAdminProducts(filters)
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()
  const updateInventory = useUpdateProductInventory()
  const deleteProduct = useDeleteProduct()

  const products = data?.products ?? []
  const summary = data?.summary
  const totalPages = data?.pages ?? 1
  const total = data?.total ?? 0

  const productImageUrl = (p: AdminProduct) =>
    p.variants?.[0]?.images?.[0] ?? ''
  const stockCount = (p: AdminProduct) => p.totalStock ?? 0
  const hasLowStock = (p: AdminProduct) => (p.lowStockSizes?.length ?? 0) > 0
  const hasOutOfStock = (p: AdminProduct) => (p.outOfStockSizes?.length ?? 0) > 0

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { labelAr: string; labelEn: string; className: string }> = {
      active: {
        labelAr: 'نشط',
        labelEn: 'Active',
        className: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400',
      },
      inactive: {
        labelAr: 'غير نشط',
        labelEn: 'Inactive',
        className: 'bg-muted text-muted-foreground',
      },
      out_of_stock: {
        labelAr: 'غير متوفر',
        labelEn: 'Out of Stock',
        className: 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400',
      },
    }
    return statusConfig[status] ?? statusConfig.inactive
  }

  const getCategoryLabel = (categoryValue: string) => {
    const category = filterOptions.find((c) => c.value === categoryValue)
    return language === 'ar' ? category?.labelAr : category?.labelEn
  }

  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(products.map((p) => p.id))
    }
  }

  const handleSelectProduct = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    )
  }

  const handleDelete = (productId: string) => setDeleteId(productId)
  const confirmDelete = () => {
    if (!deleteId) return
    deleteProduct.mutate(deleteId, {
      onSuccess: () => {
        setDeleteId(null)
        toast({ title: language === 'ar' ? 'تم حذف المنتج' : 'Product deleted' })
      },
      onError: (e) => {
        toast({ title: e?.message ?? (language === 'ar' ? 'فشل الحذف' : 'Delete failed'), variant: 'destructive' })
      },
    })
  }

  const handleEdit = (product: AdminProduct) => setEditProduct(product)

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
            <h1 className="text-h2 font-bold text-foreground">
              {language === 'ar' ? 'ادارة المنتجات' : 'Products Management'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {language === 'ar'
                ? 'عرض وتعديل واضافة منتجات المتجر'
                : 'View, edit, and add store products'}
            </p>
          </div>
          <Button className="gap-2 bg-gold-500 hover:bg-gold-600 text-stone-900 shrink-0" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />
            {language === 'ar' ? 'اضافة منتج' : 'Add Product'}
          </Button>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-sm">
          <div className="p-4 border-b border-border">
            <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full">
              <div className="relative flex-1">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                    placeholder={language === 'ar' ? 'ابحث عن منتج...' : 'Search products...'}
                    aria-label={language === 'ar' ? 'بحث عن منتج' : 'Search products'}
                    className={cn(
                      'w-full ps-10 pe-4 py-2.5 rounded-lg border border-border bg-background text-sm',
                      'focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent',
                      'placeholder:text-muted-foreground'
                    )}
                    dir={dir}
                  />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className={cn(
                  'min-h-[44px] min-w-[160px] rounded-xl border-2 border-border bg-background px-4 py-2.5 text-sm',
                  'hover:border-gold-500/30 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-0 focus:border-gold-500 focus:shadow-gold-sm',
                  'transition-all duration-200 dark:bg-card dark:border-stone-700'
                )}
                aria-label={language === 'ar' ? 'الفئة' : 'Category'}
              >
                {filterOptions.map((category) => (
                  <option key={category.value} value={category.value}>
                    {language === 'ar' ? category.labelAr : category.labelEn}
                  </option>
                ))}
              </select>
            </div>
            {summary && (
              <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-border">
                <span className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'إجمالي المنتجات' : 'Total products'}: <strong className="text-foreground">{summary.totalProducts}</strong>
                </span>
                <span className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'نشط' : 'Active'}: <strong className="text-success-600">{summary.statusCounts.active}</strong>
                </span>
                <span className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'غير نشط' : 'Inactive'}: <strong>{summary.statusCounts.inactive}</strong>
                </span>
                <span className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'غير متوفر' : 'Out of stock'}: <strong className="text-danger-600">{summary.statusCounts.outOfStock}</strong>
                </span>
                <span className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'منخفض المخزون' : 'Low stock'}: <strong className="text-warning-600">{summary.lowStockCount}</strong>
                </span>
                <span className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'إجمالي الطلبات' : 'Total orders'}: <strong>{summary.totalOrders}</strong>
                </span>
                <span className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'سلايدرات نشطة' : 'Active slides'}: <strong>{summary.activeOfferSlides}</strong>
                </span>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            {isLoading ? (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-4 py-3 w-10" />
                    <th className="px-4 py-3 text-start text-sm font-semibold text-muted-foreground w-14" />
                    <th className="px-4 py-3 text-start text-sm font-semibold text-muted-foreground" />
                    <th className="px-4 py-3 text-start text-sm font-semibold text-muted-foreground" />
                    <th className="px-4 py-3 text-start text-sm font-semibold text-muted-foreground" />
                    <th className="px-4 py-3 text-start text-sm font-semibold text-muted-foreground" />
                    <th className="px-4 py-3 text-start text-sm font-semibold text-muted-foreground" />
                    <th className="px-4 py-3 text-start text-sm font-semibold text-muted-foreground" />
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className="border-b border-border animate-pulse">
                      <td className="px-4 py-4"><div className="h-4 w-4 rounded bg-muted" /></td>
                      <td className="px-4 py-4"><div className="w-12 h-12 rounded-lg bg-muted" /></td>
                      <td className="px-4 py-4"><div className="h-4 w-24 bg-muted rounded" /></td>
                      <td className="px-4 py-4"><div className="h-4 w-16 bg-muted rounded" /></td>
                      <td className="px-4 py-4"><div className="h-4 w-14 bg-muted rounded" /></td>
                      <td className="px-4 py-4"><div className="h-4 w-8 bg-muted rounded" /></td>
                      <td className="px-4 py-4"><div className="h-6 w-16 bg-muted rounded-full" /></td>
                      <td className="px-4 py-4"><div className="h-8 w-20 bg-muted rounded" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-4 py-3 text-start w-10">
                      <input
                        type="checkbox"
                        checked={products.length > 0 && selectedProducts.length === products.length}
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded border-border text-gold-500 focus:ring-gold-500"
                      />
                    </th>
                    <th className="px-4 py-3 text-start text-sm font-semibold text-muted-foreground w-14">{language === 'ar' ? 'الصورة' : 'Image'}</th>
                    <th className="px-4 py-3 text-start text-sm font-semibold text-muted-foreground whitespace-nowrap">{language === 'ar' ? 'الكود' : 'Code'}</th>
                    <th className="px-4 py-3 text-start text-sm font-semibold text-muted-foreground whitespace-nowrap">#</th>
                    <th className="px-4 py-3 text-start text-sm font-semibold text-muted-foreground">{language === 'ar' ? 'الاسم' : 'Name'}</th>
                    <th className="px-4 py-3 text-start text-sm font-semibold text-muted-foreground">{language === 'ar' ? 'الفئة' : 'Category'}</th>
                    <th className="px-4 py-3 text-start text-sm font-semibold text-muted-foreground">{language === 'ar' ? 'السعر' : 'Price'}</th>
                    <th className="px-4 py-3 text-start text-sm font-semibold text-muted-foreground">{language === 'ar' ? 'المخزون' : 'Stock'}</th>
                    <th className="px-4 py-3 text-start text-sm font-semibold text-muted-foreground">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                    <th className="px-4 py-3 text-start text-sm font-semibold text-muted-foreground">{language === 'ar' ? 'المشاهدات' : 'Views'}</th>
                    <th className="px-4 py-3 text-start text-sm font-semibold text-muted-foreground">{language === 'ar' ? 'المبيعات' : 'Sales'}</th>
                    <th className="px-4 py-3 text-start text-sm font-semibold text-muted-foreground">{language === 'ar' ? 'الطلبات' : 'Orders'}</th>
                    <th className="px-4 py-3 text-start text-sm font-semibold text-muted-foreground">{language === 'ar' ? 'السلايدر' : 'Slides'}</th>
                    <th className="px-4 py-3 text-start text-sm font-semibold text-muted-foreground">{language === 'ar' ? 'الاجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={14} className="px-4 py-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <Package className="h-12 w-12 text-muted-foreground/50" />
                          <p className="text-muted-foreground">
                            {language === 'ar'
                              ? 'لا توجد منتجات مطابقة للبحث'
                              : 'No products match your search'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    products.map((product) => {
                      const statusBadge = getStatusBadge(product.status)
                      const imageUrl = productImageUrl(product)
                      const stock = stockCount(product)
                      const slideCount = product.offerSlides?.length ?? 0
                      return (
                        <tr
                          key={product.id}
                          className="border-b border-border hover:bg-muted/20 transition-colors"
                        >
                          <td className="px-4 py-4">
                            <input
                              type="checkbox"
                              checked={selectedProducts.includes(product.id)}
                              onChange={() => handleSelectProduct(product.id)}
                              className="w-4 h-4 rounded border-border text-gold-500 focus:ring-gold-500"
                            />
                          </td>
                          <td className="px-4 py-4">
                            <div className="w-12 h-12 rounded-lg bg-gold-100 dark:bg-gold-900/30 flex items-center justify-center overflow-hidden">
                              {imageUrl ? (
                                <img
                                  src={imageUrl.startsWith('http') || imageUrl.startsWith('/') ? imageUrl : `/${imageUrl.startsWith('uploads/') ? imageUrl : 'uploads/' + imageUrl}`}
                                  alt={product.nameEn ?? product.name ?? ''}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Package className="h-6 w-6 text-gold-500" />
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-sm font-mono text-foreground">{product.code}</span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-sm text-muted-foreground">{product.productNumber ?? '—'}</span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="space-y-0.5">
                              <p className="font-medium text-foreground text-sm">{product.nameAr ?? product.name ?? ''}</p>
                              <p className="text-xs text-muted-foreground">{product.nameEn ?? ''}</p>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-sm text-foreground">{getCategoryLabel(product.category)}</span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-sm font-semibold text-foreground">{formatPrice(product.basePrice)}</span>
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={cn(
                                'text-sm font-medium',
                                stock === 0 || hasOutOfStock(product)
                                  ? 'text-danger-600'
                                  : hasLowStock(product)
                                    ? 'text-warning-600'
                                    : 'text-foreground'
                              )}
                            >
                              {stock}
                              {(hasLowStock(product) || hasOutOfStock(product)) && (
                                <AlertCircle className="inline-block ms-1 h-3.5 w-3.5 text-warning-500" aria-hidden />
                              )}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={cn(
                                'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
                                statusBadge.className
                              )}
                            >
                              {language === 'ar' ? statusBadge.labelAr : statusBadge.labelEn}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-sm text-muted-foreground">{product.views ?? 0}</span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-sm text-muted-foreground">{product.salesCount ?? 0}</span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-sm text-muted-foreground">{product.orderCount ?? 0}</span>
                          </td>
                          <td className="px-4 py-4">
                            {slideCount > 0 ? (
                              <Link
                                to="/admin/slides"
                                className="text-sm text-gold-600 hover:underline"
                              >
                                {language === 'ar' ? `على ${slideCount}` : `On ${slideCount}`}
                              </Link>
                            ) : (
                              <span className="text-sm text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleEdit(product)}
                                className={cn(
                                  'p-2 rounded-lg transition-colors',
                                  'text-muted-foreground hover:text-gold-600 hover:bg-gold-100 dark:hover:bg-gold-900/30'
                                )}
                                title={language === 'ar' ? 'تعديل' : 'Edit'}
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => openInventory(product)}
                                className={cn(
                                  'p-2 rounded-lg transition-colors',
                                  'text-muted-foreground hover:text-gold-600 hover:bg-gold-100 dark:hover:bg-gold-900/30'
                                )}
                                title={language === 'ar' ? 'تعديل المخزون' : 'Edit stock'}
                              >
                                <Package className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(product.id)}
                                className={cn(
                                  'p-2 rounded-lg transition-colors',
                                  'text-muted-foreground hover:text-danger-600 hover:bg-danger-100 dark:hover:bg-danger-900/30'
                                )}
                                title={language === 'ar' ? 'حذف' : 'Delete'}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>

          {totalPages > 1 && !isLoading && (
            <div className="px-4 py-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                {language === 'ar'
                  ? `صفحة ${currentPage} من ${totalPages} (${total} منتج)`
                  : `Page ${currentPage} of ${totalPages} (${total} products)`}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    currentPage === 1
                      ? 'text-muted-foreground/50 cursor-not-allowed'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </button>
                {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      'w-9 h-9 rounded-lg text-sm font-medium transition-colors',
                      page === currentPage
                        ? 'bg-gold-500 text-gold-950'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    )}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    currentPage === totalPages
                      ? 'text-muted-foreground/50 cursor-not-allowed'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Product Dialog — two-panel layout, centered width, simplified UX */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent dir={isRTL ? 'rtl' : 'ltr'} className="w-[95vw] max-w-4xl mx-auto max-h-[90vh] overflow-y-auto p-6 sm:p-8 bg-card border-border shadow-[0_8px_30px_hsl(var(--foreground)/0.08),0_2px_8px_hsl(var(--primary)/0.06)]" aria-describedby={undefined}>
          <DialogHeader className="pe-12">
            <DialogTitle className={cn('text-h4 font-bold text-foreground title-underline-gold', language === 'ar' && 'font-cairo')}>
              {language === 'ar' ? 'اضافة منتج' : 'Add Product'}
            </DialogTitle>
          </DialogHeader>
          <AddProductForm
            onCancel={() => setAddOpen(false)}
            onSubmit={async (form) => {
              const payload: AdminProductCreateInput = {
                nameAr: form.nameAr,
                nameEn: form.nameEn,
                descriptionAr: form.descriptionAr,
                descriptionEn: form.descriptionEn,
                category: form.category,
                basePrice: form.price,
                discountPrice: form.discountPrice ?? undefined,
                tag: form.tag || undefined,
                tagColor: form.tagColor || undefined,
                status: form.status,
                featuresAr: form.featuresAr,
                featuresEn: form.featuresEn,
                variants: form.variants.map((v) => ({
                  colorName: (v.colorName?.trim() || 'افتراضي') as string,
                  colorCode: v.colorCode || '#6B7280',
                  sizes: v.sizes
                    .filter((s) => s.size.trim())
                    .map((s) => ({ size: s.size.trim(), quantity: Math.max(0, s.quantity) })),
                })).filter((v) => v.sizes.length > 0),
              }
              try {
                const created = await createProduct.mutateAsync(payload)
                setAddUploadingImages(true)
                const raw = form.rawVariantsForUpload ?? []
                for (let vi = 0; vi < raw.length; vi++) {
                  const v = raw[vi]
                  const pending = v.pendingImages ?? []
                  const colorName = (v.colorName?.trim() || 'افتراضي')
                  for (const { file } of pending) {
                    await adminApi.uploadProductImage(created.code, colorName, file)
                  }
                }
                setAddOpen(false)
                toast({ title: language === 'ar' ? 'تمت إضافة المنتج' : 'Product added' })
              } catch (e) {
                toast({
                  title: (e as Error)?.message ?? (language === 'ar' ? 'فشل الإضافة' : 'Add failed'),
                  variant: 'destructive',
                })
              } finally {
                setAddUploadingImages(false)
              }
            }}
            isLoading={createProduct.isPending || addUploadingImages}
            language={language}
            categories={formOptions}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog — two-panel layout, centered width */}
      <Dialog open={!!editProduct} onOpenChange={(open) => !open && setEditProduct(null)}>
        <DialogContent dir={isRTL ? 'rtl' : 'ltr'} className="w-[95vw] max-w-4xl mx-auto max-h-[90vh] overflow-y-auto p-6 sm:p-8 bg-card border-border shadow-[0_8px_30px_hsl(var(--foreground)/0.08),0_2px_8px_hsl(var(--primary)/0.06)]" aria-describedby={undefined}>
          <DialogHeader className="pe-12">
            <DialogTitle className={cn('text-h4 font-bold text-foreground title-underline-gold', language === 'ar' && 'font-cairo')}>
              {language === 'ar' ? 'تعديل المنتج' : 'Edit Product'}
            </DialogTitle>
          </DialogHeader>
          {editProduct && (
            <EditProductForm
              product={editProduct}
              onSubmit={(form: EditProductFormData) => {
                const payload: AdminProductUpdateInput = {
                  nameAr: form.nameAr,
                  nameEn: form.nameEn,
                  descriptionAr: form.descriptionAr || undefined,
                  descriptionEn: form.descriptionEn || undefined,
                  category: form.category,
                  basePrice: form.price,
                  discountPrice: form.discountPrice ?? undefined,
                  tag: form.tag || undefined,
                  tagColor: form.tagColor || undefined,
                  status: form.status,
                  featuresAr: form.featuresAr?.length ? form.featuresAr : undefined,
                  featuresEn: form.featuresEn?.length ? form.featuresEn : undefined,
                  variants: (form.variants as EditVariantForm[]).map((v) => ({
                    id: v.id,
                    colorName: v.colorName,
                    colorCode: v.colorCode,
                    images: v.images ?? [],
                    sizes: v.sizes.map((s) => ({ size: s.size, quantity: s.quantity })),
                  })),
                }
                updateProduct.mutate(
                  { id: editProduct.id, data: payload },
                  {
                    onSuccess: () => {
                      setEditProduct(null)
                      toast({ title: language === 'ar' ? 'تم تحديث المنتج' : 'Product updated' })
                    },
                    onError: (e) =>
                      toast({
                        title: e?.message ?? (language === 'ar' ? 'فشل التحديث' : 'Update failed'),
                        variant: 'destructive',
                      }),
                  }
                )
              }}
              onCancel={() => setEditProduct(null)}
              isLoading={updateProduct.isPending}
              language={language}
              categories={formOptions}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Inventory modal */}
      <Dialog open={!!inventoryProduct} onOpenChange={(open) => !open && closeInventory()}>
        <DialogContent dir={isRTL ? 'rtl' : 'ltr'} className="w-[95vw] max-w-md p-6 sm:p-8 bg-card border-border shadow-[0_8px_30px_hsl(var(--foreground)/0.08),0_2px_8px_hsl(var(--primary)/0.06)]">
          <DialogHeader className="pe-12">
            <DialogTitle className={cn('text-h4 font-bold text-foreground title-underline-gold', language === 'ar' && 'font-cairo')}>
              {language === 'ar' ? 'تعديل المخزون' : 'Edit stock'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm mt-1.5">
              {inventoryProduct && (language === 'ar' ? inventoryProduct.nameAr : inventoryProduct.nameEn) || inventoryProduct?.name}
            </DialogDescription>
          </DialogHeader>
          {inventoryProduct && (
            <div className="space-y-4 py-4">
              {inventoryDraft.map((v, vi) => {
                const variant = inventoryProduct.variants[vi]
                return (
                  <div key={v.id} className="rounded-xl border-2 border-border bg-muted/20 p-4 space-y-3 hover:border-primary/20 transition-colors">
                    <p className={cn('text-sm font-bold text-foreground', language === 'ar' && 'font-cairo')}>{variant?.colorName ?? v.id}</p>
                    {v.sizes.map((s, si) => (
                      <div key={si} className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground w-20 shrink-0">{s.size}</span>
                        <Input
                          type="number"
                          min={0}
                          value={s.quantity}
                          onChange={(e) => setInventoryQuantity(vi, si, parseInt(e.target.value, 10) || 0)}
                          className="w-28 min-h-[44px]"
                        />
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          )}
          <DialogFooter className="mt-6 pt-6 border-t border-border gap-3 sm:gap-2">
            <Button variant="outline" onClick={closeInventory} className="min-h-[44px] flex-1 sm:flex-none">
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              onClick={submitInventory}
              disabled={updateInventory.isPending}
              className="min-h-[44px] flex-1 sm:flex-none bg-primary text-primary-foreground hover:bg-gold-400 hover:shadow-gold-sm"
            >
              {updateInventory.isPending ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') : language === 'ar' ? 'حفظ' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent dir={isRTL ? 'rtl' : 'ltr'} className="w-[90vw] max-w-sm p-6 sm:p-8 bg-card border-border shadow-[0_8px_30px_hsl(var(--foreground)/0.08),0_2px_8px_hsl(var(--primary)/0.06)]">
          <DialogHeader className="pe-12">
            <DialogTitle className={cn('text-h4 font-bold text-foreground title-underline-gold', language === 'ar' && 'font-cairo')}>
              {language === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm mt-1.5">
              {language === 'ar' ? 'هل أنت متأكد من حذف هذا المنتج؟' : 'Are you sure you want to delete this product?'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 pt-6 border-t border-border gap-3 sm:gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)} className="min-h-[44px] flex-1 sm:flex-none">
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteProduct.isPending}
              className="min-h-[44px] flex-1 sm:flex-none"
            >
              {deleteProduct.isPending
                ? (language === 'ar' ? 'جاري الحذف...' : 'Deleting...')
                : language === 'ar'
                  ? 'حذف'
                  : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

type AddVariantForm = {
  colorName: string
  colorCode: string
  sizes: Array<{ size: string; quantity: number }>
  pendingImages?: Array<{ file: File; previewUrl: string }>
}
type AddProductFormData = {
  nameAr: string
  nameEn: string
  category: string
  price: number
  discountPrice?: number
  tag?: string
  tagColor?: string
  stock: number
  status: string
  descriptionAr?: string
  descriptionEn?: string
  featuresAr?: string[]
  featuresEn?: string[]
  variants: Array<{ colorName: string; colorCode: string; sizes: Array<{ size: string; quantity: number }> }>
  rawVariantsForUpload?: AddVariantForm[]
}

/** Wilson form control style: matches Input (rounded-xl, border-2, touch target, gold focus) */
const formControlClass =
  'w-full rounded-xl border-2 border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground min-h-[44px] transition-all duration-200 hover:border-gold-500/30 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-0 focus:border-gold-500 focus:shadow-gold-sm dark:bg-card dark:border-stone-700'

function AddProductForm({
  onSubmit,
  onCancel,
  isLoading,
  language,
  categories,
}: {
  onSubmit: (form: AddProductFormData) => void | Promise<void>
  onCancel: () => void
  isLoading: boolean
  language: string
  categories: { value: string; labelAr: string; labelEn: string }[]
}) {
  const [nameAr, setNameAr] = useState('')
  const [nameEn, setNameEn] = useState('')
  const [category, setCategory] = useState(categories[0]?.value ?? '')
  const [price, setPrice] = useState('')
  const [discountPrice, setDiscountPrice] = useState('')
  const [tag, setTag] = useState('')
  const [tagColor, setTagColor] = useState('')
  const [stock, setStock] = useState('0')
  const [status, setStatus] = useState('active')
  const [descriptionAr, setDescriptionAr] = useState('')
  const [descriptionEn, setDescriptionEn] = useState('')
  const [featuresAr, setFeaturesAr] = useState<string[]>([])
  const [featuresEn, setFeaturesEn] = useState<string[]>([])
  const [variants, setVariants] = useState<AddVariantForm[]>([
    { colorName: 'افتراضي', colorCode: '#6B7280', sizes: [{ size: 'واحد', quantity: 0 }], pendingImages: [] },
  ])
  const [errors, setErrors] = useState<Partial<Record<keyof AddProductFormData, string>>>({})

  const addFeature = () => {
    setFeaturesAr((prev) => [...prev, ''])
    setFeaturesEn((prev) => [...prev, ''])
  }
  const removeFeature = (i: number) => {
    setFeaturesAr((prev) => prev.filter((_, idx) => idx !== i))
    setFeaturesEn((prev) => prev.filter((_, idx) => idx !== i))
  }
  const setFeature = (i: number, ar: string, en: string) => {
    setFeaturesAr((prev) => prev.map((x, idx) => (idx === i ? ar : x)))
    setFeaturesEn((prev) => prev.map((x, idx) => (idx === i ? en : x)))
  }
  const addVariant = () => {
    setVariants((prev) => [...prev, { colorName: '', colorCode: '#6B7280', sizes: [{ size: '', quantity: 0 }], pendingImages: [] }])
  }
  const removeVariant = (i: number) => {
    setVariants((prev) => prev.filter((_, idx) => idx !== i))
  }
  const updateVariant = (i: number, patch: Partial<AddVariantForm>) => {
    setVariants((prev) => prev.map((v, idx) => (idx === i ? { ...v, ...patch } : v)))
  }
  const addSizeToVariant = (vi: number) => {
    setVariants((prev) => prev.map((v, idx) => (idx === vi ? { ...v, sizes: [...v.sizes, { size: '', quantity: 0 }] } : v)))
  }
  const removeSizeFromVariant = (vi: number, si: number) => {
    setVariants((prev) => prev.map((v, idx) => (idx === vi ? { ...v, sizes: v.sizes.filter((_, i) => i !== si) } : v)))
  }
  const updateVariantSize = (vi: number, si: number, size: string, quantity: number) => {
    setVariants((prev) =>
      prev.map((v, idx) =>
        idx === vi ? { ...v, sizes: v.sizes.map((s, i) => (i === si ? { size, quantity } : s)) } : v
      )
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const p = Number(price)
    const s = Number(stock)
    const err: Partial<Record<keyof AddProductFormData, string>> = {}
    if (!nameAr.trim() && !nameEn.trim()) {
      err.nameAr = language === 'ar' ? 'أدخل الاسم بالعربية أو الإنجليزية' : 'Enter name in Arabic or English'
      err.nameEn = err.nameAr
    }
    if (!category) err.category = language === 'ar' ? 'الفئة مطلوبة' : 'Category is required'
    if (p <= 0 || Number.isNaN(p)) err.price = language === 'ar' ? 'السعر يجب أن يكون أكبر من صفر' : 'Price must be greater than zero'
    const rawVariantsForBuild = variants.filter((v) => v.sizes.some((s) => s.size.trim()))
    const builtVariants = rawVariantsForBuild.map((v) => ({
      colorName: (v.colorName && v.colorName.trim()) || 'افتراضي',
      colorCode: v.colorCode || '#6B7280',
      sizes: v.sizes.filter((s) => s.size.trim()).map((s) => ({ size: s.size.trim(), quantity: Math.max(0, s.quantity) })),
    })).filter((v) => v.sizes.length > 0)
    if (builtVariants.length === 0) err.variants = language === 'ar' ? 'أضف لوناً واحداً على الأقل بمقاس وكمية' : 'Add at least one variant with size and quantity'
    setErrors(err)
    if (Object.keys(err).length > 0) return
    const disc = discountPrice.trim() ? Number(discountPrice) : undefined
    if (disc !== undefined && (Number.isNaN(disc) || disc < 0)) return
    onSubmit({
      nameAr: nameAr.trim() || nameEn.trim(),
      nameEn: nameEn.trim() || nameAr.trim(),
      category,
      price: p,
      discountPrice: disc,
      tag: tag.trim() || undefined,
      tagColor: tagColor.trim() || undefined,
      stock: s,
      status,
      descriptionAr: descriptionAr.trim() || undefined,
      descriptionEn: descriptionEn.trim() || undefined,
      featuresAr: featuresAr.length ? featuresAr : undefined,
      featuresEn: featuresEn.length ? featuresEn : undefined,
      variants: builtVariants,
      rawVariantsForUpload: rawVariantsForBuild,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Left panel: identity + pricing */}
        <div className="space-y-5">
          <Input
            value={nameAr}
            onChange={(e) => { setNameAr(e.target.value); setErrors((p) => ({ ...p, nameAr: undefined })) }}
            dir="rtl"
            placeholder={language === 'ar' ? 'الاسم بالعربية' : 'Name (Arabic)'}
            className={cn(errors.nameAr && 'border-destructive focus:ring-destructive')}
          />
          {errors.nameAr && <p className="text-xs text-destructive -mt-2">{errors.nameAr}</p>}
          <Input
            value={nameEn}
            onChange={(e) => { setNameEn(e.target.value); setErrors((p) => ({ ...p, nameEn: undefined })) }}
            placeholder={language === 'ar' ? 'الاسم بالإنجليزية' : 'Name (English)'}
            className={cn(errors.nameEn && 'border-destructive focus:ring-destructive')}
          />
          {errors.nameEn && <p className="text-xs text-destructive -mt-2">{errors.nameEn}</p>}
          <div>
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setErrors((p) => ({ ...p, category: undefined })) }}
              className={cn(formControlClass, errors.category && 'border-destructive focus:ring-destructive')}
              aria-label={language === 'ar' ? 'الفئة' : 'Category'}
            >
              <option value="">{language === 'ar' ? '— الفئة —' : '— Category —'}</option>
              {categories.filter((c) => c.value !== 'all').map((c) => (
                <option key={c.value} value={c.value}>
                  {language === 'ar' ? c.labelAr : c.labelEn}
                </option>
              ))}
            </select>
            {errors.category && <p className="text-xs text-destructive mt-1">{errors.category}</p>}
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={formControlClass}
            aria-label={language === 'ar' ? 'الحالة' : 'Status'}
          >
            <option value="active">{language === 'ar' ? 'نشط' : 'Active'}</option>
            <option value="inactive">{language === 'ar' ? 'غير نشط' : 'Inactive'}</option>
          </select>
          <Input
            type="number"
            min="0"
            value={price}
            onChange={(e) => { setPrice(e.target.value); setErrors((p) => ({ ...p, price: undefined })) }}
            placeholder={language === 'ar' ? 'السعر (ج.م) *' : 'Price (EGP) *'}
            className={cn(errors.price && 'border-destructive focus:ring-destructive')}
          />
          {errors.price && <p className="text-xs text-destructive -mt-2">{errors.price}</p>}
          <Input type="number" min="0" value={discountPrice} onChange={(e) => setDiscountPrice(e.target.value)} placeholder={language === 'ar' ? 'سعر الخصم (0 = لا يوجد)' : 'Discount (0 = none)'} />
          <div className="grid grid-cols-2 gap-2">
            <Input value={tag} onChange={(e) => setTag(e.target.value)} placeholder={language === 'ar' ? 'شارة (مثال: وفر)' : 'Tag (e.g. Sale)'} />
            <select
              value={tagColor}
              onChange={(e) => setTagColor(e.target.value)}
              className={formControlClass}
              aria-label={language === 'ar' ? 'لون الشارة' : 'Tag color'}
            >
              {BADGE_COLOR_OPTIONS.map((opt) => (
                <option key={opt.value || 'none'} value={opt.value}>
                  {language === 'ar' ? opt.labelAr : opt.labelEn}
                </option>
              ))}
            </select>
          </div>
          <Input type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} placeholder={language === 'ar' ? 'الكمية الافتراضية' : 'Default quantity'} />
        </div>

        {/* Right panel: description, features, variants */}
        <div className="space-y-5">
          <textarea
            value={descriptionAr}
            onChange={(e) => setDescriptionAr(e.target.value)}
            dir="rtl"
            rows={2}
            placeholder={language === 'ar' ? 'الوصف (عربي)' : 'Description (Arabic)'}
            className={cn(formControlClass, 'resize-none')}
          />
          <textarea
            value={descriptionEn}
            onChange={(e) => setDescriptionEn(e.target.value)}
            rows={2}
            placeholder={language === 'ar' ? 'الوصف (إنجليزي)' : 'Description (English)'}
            className={cn(formControlClass, 'resize-none')}
          />
          <div className="space-y-2">
            {featuresAr.map((_, i) => (
              <div key={i} className="flex gap-2 items-center min-w-0">
                <Input
                  value={featuresAr[i]}
                  onChange={(e) => setFeature(i, e.target.value, featuresEn[i] ?? '')}
                  placeholder={language === 'ar' ? 'ميزة' : 'Feature'}
                  className="flex-1 min-w-0"
                  dir="rtl"
                />
                <Input
                  value={featuresEn[i]}
                  onChange={(e) => setFeature(i, featuresAr[i] ?? '', e.target.value)}
                  placeholder="EN"
                  className="flex-1 min-w-0"
                />
                <button type="button" onClick={() => removeFeature(i)} className="shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-muted-foreground hover:text-destructive hover:bg-muted transition-colors" aria-label="Remove">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addFeature} className="min-h-[44px]">
              + {language === 'ar' ? 'ميزة' : 'Feature'}
            </Button>
          </div>
          <div className="space-y-3">
            <Label className="text-sm font-medium text-foreground">{language === 'ar' ? 'الخيارات والمقاسات والكمية' : 'Variants, sizes & stock'}</Label>
            <p className="text-xs text-muted-foreground">
              {language === 'ar' ? 'كل خيار (لون/موديل) له مقاسات؛ كل مقاس له كمية. للمنتج الواحد: خيار واحد مثل "افتراضي" ومقاس واحد مثل "واحد" أو "240ل".' : 'Each variant (color/option) has sizes; each size has a quantity. One option + one size (e.g. "One" or "240L") for single-SKU products.'}
            </p>
            {variants.map((v, vi) => (
              <div key={vi} className="p-3 rounded-xl border border-border bg-muted/20 space-y-2">
                <div className="flex gap-2 flex-wrap items-end">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground">{language === 'ar' ? 'خيار (لون/موديل)' : 'Variant (color/option)'}</Label>
                    <Input
                      value={v.colorName}
                      onChange={(e) => updateVariant(vi, { colorName: e.target.value })}
                      placeholder={language === 'ar' ? 'مثال: افتراضي' : 'e.g. Default'}
                      className="w-28"
                    />
                  </div>
                  <input
                    type="color"
                    value={v.colorCode}
                    onChange={(e) => updateVariant(vi, { colorCode: e.target.value })}
                    className="w-10 h-10 rounded-lg border border-border cursor-pointer bg-background shrink-0"
                    aria-label={language === 'ar' ? 'لون' : 'Color'}
                  />
                  {variants.length > 1 && (
                    <button type="button" onClick={() => removeVariant(vi)} className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-muted-foreground hover:text-destructive hover:bg-muted transition-colors" aria-label="Remove variant">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <VariantImageManager
                  items={(v.pendingImages ?? []).map((p) => ({ url: p.previewUrl, file: p.file }))}
                  onAdd={(file) => {
                    const previewUrl = URL.createObjectURL(file)
                    updateVariant(vi, { pendingImages: [...(v.pendingImages ?? []), { file, previewUrl }] })
                  }}
                  onRemove={(item) => {
                    if (item.file) {
                      const preview = (v.pendingImages ?? []).find((p) => p.file === item.file)
                      if (preview) URL.revokeObjectURL(preview.previewUrl)
                      updateVariant(vi, { pendingImages: (v.pendingImages ?? []).filter((p) => p.file !== item.file) })
                    }
                  }}
                  disabled={isLoading}
                  language={language}
                />
                {v.sizes.map((s, si) => (
                  <div key={si} className="flex gap-2 items-end">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-muted-foreground">{language === 'ar' ? 'المقاس (واحد / 240ل)' : 'Size (One, 240L…)'}</Label>
                      <Input value={s.size} onChange={(e) => updateVariantSize(vi, si, e.target.value, s.quantity)} placeholder={language === 'ar' ? 'واحد أو 240ل' : 'One or 240L'} className="w-24" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-muted-foreground">{language === 'ar' ? 'الكمية (مخزون)' : 'Qty (stock)'}</Label>
                      <Input type="number" min={0} value={s.quantity} onChange={(e) => updateVariantSize(vi, si, s.size, parseInt(e.target.value, 10) || 0)} className="w-20" />
                    </div>
                    {v.sizes.length > 1 && (
                      <button type="button" onClick={() => removeSizeFromVariant(vi, si)} className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-muted-foreground hover:text-destructive hover:bg-muted" aria-label="Remove size">
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => addSizeToVariant(vi)} className="min-h-[36px] text-xs">
                  + {language === 'ar' ? 'مقاس' : 'Size'}
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addVariant} className="min-h-[44px] w-full">
              + {language === 'ar' ? 'خيار (لون/موديل)' : 'Variant (color/option)'}
            </Button>
            {errors.variants && <p className="text-xs text-destructive">{errors.variants}</p>}
          </div>
        </div>
      </div>

      <DialogFooter className="pt-4 border-t border-border gap-3 sm:gap-2">
        <Button type="button" variant="outline" onClick={onCancel} className="min-h-[44px] flex-1 sm:flex-none">
          {language === 'ar' ? 'إلغاء' : 'Cancel'}
        </Button>
        <Button type="submit" disabled={isLoading} className="min-h-[44px] flex-1 sm:flex-none bg-primary text-primary-foreground hover:bg-gold-400 hover:shadow-gold-sm">
          {isLoading ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') : language === 'ar' ? 'إضافة' : 'Add'}
        </Button>
      </DialogFooter>
    </form>
  )
}

type EditVariantForm = {
  id?: string
  colorName: string
  colorCode: string
  images: string[]
  sizes: Array<{ size: string; quantity: number }>
}
type EditProductFormData = AddProductFormData & {
  descriptionAr: string
  descriptionEn: string
  featuresAr: string[]
  featuresEn: string[]
  variants: EditVariantForm[]
}

function EditProductForm({
  product,
  onSubmit,
  onCancel,
  isLoading,
  language,
  categories,
}: {
  product: AdminProduct
  onSubmit: (form: EditProductFormData) => void
  onCancel: () => void
  isLoading: boolean
  language: string
  categories: { value: string; labelAr: string; labelEn: string }[]
}) {
  const [nameAr, setNameAr] = useState(product.nameAr ?? '')
  const [nameEn, setNameEn] = useState(product.nameEn ?? '')
  const [descriptionAr, setDescriptionAr] = useState(product.descriptionAr ?? '')
  const [descriptionEn, setDescriptionEn] = useState(product.descriptionEn ?? '')
  const [category, setCategory] = useState(product.category)
  const [price, setPrice] = useState(String(product.basePrice ?? 0))
  const [discountPrice, setDiscountPrice] = useState(
    product.discountPrice != null ? String(product.discountPrice) : ''
  )
  const [tag, setTag] = useState(product.tag ?? '')
  const [tagColor, setTagColor] = useState(product.tagColor ?? '')
  const [stock, setStock] = useState(String(product.totalStock ?? 0))
  const [status, setStatus] = useState(product.status)
  const [featuresAr, setFeaturesAr] = useState<string[]>(product.featuresAr ?? product.features ?? [])
  const [featuresEn, setFeaturesEn] = useState<string[]>(product.featuresEn ?? product.features ?? [])
  const [variants, setVariants] = useState<EditVariantForm[]>(
    product.variants.map((v) => ({
      id: v.id,
      colorName: v.colorName,
      colorCode: v.colorCode,
      images: v.images ?? [],
      sizes: v.sizes.map((s) => ({ size: s.size, quantity: s.quantity })),
    }))
  )
  const [errors, setErrors] = useState<Partial<Record<keyof EditProductFormData, string>>>({})
  const [uploadingVariantIdx, setUploadingVariantIdx] = useState<number | null>(null)

  const addFeature = () => {
    setFeaturesAr((prev) => [...prev, ''])
    setFeaturesEn((prev) => [...prev, ''])
  }
  const removeFeature = (i: number) => {
    setFeaturesAr((prev) => prev.filter((_, idx) => idx !== i))
    setFeaturesEn((prev) => prev.filter((_, idx) => idx !== i))
  }
  const setFeature = (i: number, ar: string, en: string) => {
    setFeaturesAr((prev) => prev.map((x, idx) => (idx === i ? ar : x)))
    setFeaturesEn((prev) => prev.map((x, idx) => (idx === i ? en : x)))
  }
  const addVariant = () => {
    setVariants((prev) => [...prev, { colorName: '', colorCode: '#6B7280', images: [], sizes: [{ size: '', quantity: 0 }] }])
  }
  const removeVariant = (i: number) => {
    setVariants((prev) => prev.filter((_, idx) => idx !== i))
  }
  const updateVariant = (i: number, patch: Partial<EditVariantForm>) => {
    setVariants((prev) => prev.map((v, idx) => (idx === i ? { ...v, ...patch } : v)))
  }
  const addSizeToVariant = (vi: number) => {
    setVariants((prev) => prev.map((v, idx) => (idx === vi ? { ...v, sizes: [...v.sizes, { size: '', quantity: 0 }] } : v)))
  }
  const removeSizeFromVariant = (vi: number, si: number) => {
    setVariants((prev) => prev.map((v, idx) => (idx === vi ? { ...v, sizes: v.sizes.filter((_, i) => i !== si) } : v)))
  }
  const updateVariantSize = (vi: number, si: number, size: string, quantity: number) => {
    setVariants((prev) =>
      prev.map((v, idx) =>
        idx === vi ? { ...v, sizes: v.sizes.map((s, i) => (i === si ? { size, quantity } : s)) } : v
      )
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const p = Number(price)
    const s = Number(stock)
    const err: Partial<Record<keyof EditProductFormData, string>> = {}
    if (!nameAr.trim() && !nameEn.trim()) {
      err.nameAr = language === 'ar' ? 'أدخل الاسم بالعربية أو الإنجليزية' : 'Enter name in Arabic or English'
      err.nameEn = err.nameAr
    }
    if (!category) err.category = language === 'ar' ? 'الفئة مطلوبة' : 'Category is required'
    if (p <= 0 || Number.isNaN(p)) err.price = language === 'ar' ? 'السعر يجب أن يكون أكبر من صفر' : 'Price must be greater than zero'
    const builtVariants = variants
      .map((v) => ({
        id: v.id,
        colorName: (v.colorName && v.colorName.trim()) || 'افتراضي',
        colorCode: v.colorCode || '#6B7280',
        images: v.images ?? [],
        sizes: v.sizes
          .filter((s) => s.size.trim())
          .map((s) => ({ size: s.size.trim(), quantity: Math.max(0, s.quantity) })),
      }))
      .filter((v) => v.sizes.length > 0)
    if (builtVariants.length === 0) err.variants = language === 'ar' ? 'أضف لوناً واحداً على الأقل بمقاس وكمية' : 'Add at least one variant with size and quantity'
    setErrors(err)
    if (Object.keys(err).length > 0) return
    const disc = discountPrice.trim() ? Number(discountPrice) : undefined
    if (disc !== undefined && (Number.isNaN(disc) || disc < 0)) return
    onSubmit({
      nameAr: nameAr.trim() || nameEn.trim(),
      nameEn: nameEn.trim() || nameAr.trim(),
      descriptionAr: descriptionAr.trim(),
      descriptionEn: descriptionEn.trim(),
      category,
      price: p,
      discountPrice: disc,
      tag: tag.trim() || undefined,
      tagColor: tagColor.trim() || undefined,
      stock: s,
      status,
      featuresAr,
      featuresEn,
      variants: builtVariants,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Left panel: identity + pricing — every input has title on top */}
        <div className="space-y-5">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">{language === 'ar' ? 'الاسم (عربي)' : 'Name (Arabic)'}</Label>
            <Input
              value={nameAr}
              onChange={(e) => { setNameAr(e.target.value); setErrors((p) => ({ ...p, nameAr: undefined })) }}
              dir="rtl"
              placeholder={language === 'ar' ? 'الاسم بالعربية' : 'Name (Arabic)'}
              className={cn(errors.nameAr && 'border-destructive focus:ring-destructive')}
            />
            {errors.nameAr && <p className="text-xs text-destructive">{errors.nameAr}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">{language === 'ar' ? 'الاسم (إنجليزي)' : 'Name (English)'}</Label>
            <Input
              value={nameEn}
              onChange={(e) => { setNameEn(e.target.value); setErrors((p) => ({ ...p, nameEn: undefined })) }}
              placeholder={language === 'ar' ? 'الاسم بالإنجليزية' : 'Name (English)'}
              className={cn(errors.nameEn && 'border-destructive focus:ring-destructive')}
            />
            {errors.nameEn && <p className="text-xs text-destructive">{errors.nameEn}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">{language === 'ar' ? 'الفئة' : 'Category'}</Label>
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setErrors((p) => ({ ...p, category: undefined })) }}
              className={cn(formControlClass, errors.category && 'border-destructive focus:ring-destructive')}
            >
              <option value="">{language === 'ar' ? '— الفئة —' : '— Category —'}</option>
              {categories.filter((c) => c.value !== 'all').map((c) => (
                <option key={c.value} value={c.value}>
                  {language === 'ar' ? c.labelAr : c.labelEn}
                </option>
              ))}
            </select>
            {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">{language === 'ar' ? 'الحالة' : 'Status'}</Label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
              className={formControlClass}
            >
              <option value="active">{language === 'ar' ? 'نشط' : 'Active'}</option>
              <option value="inactive">{language === 'ar' ? 'غير نشط' : 'Inactive'}</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">{language === 'ar' ? 'السعر (ج.م)' : 'Price (EGP)'}</Label>
            <Input
              type="number"
              min="0"
              value={price}
              onChange={(e) => { setPrice(e.target.value); setErrors((p) => ({ ...p, price: undefined })) }}
              placeholder={language === 'ar' ? 'السعر (ج.م)' : 'Price (EGP)'}
              className={cn(errors.price && 'border-destructive focus:ring-destructive')}
            />
            {errors.price && <p className="text-xs text-destructive">{errors.price}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-muted-foreground">{language === 'ar' ? 'سعر الخصم' : 'Discount price'}</Label>
            <Input type="number" min="0" value={discountPrice} onChange={(e) => setDiscountPrice(e.target.value)} placeholder={language === 'ar' ? '0 = لا يوجد' : '0 = none'} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-muted-foreground">{language === 'ar' ? 'شارة المنتج' : 'Tag'}</Label>
              <Input value={tag} onChange={(e) => setTag(e.target.value)} placeholder={language === 'ar' ? 'مثال: وفر' : 'e.g. Sale'} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-muted-foreground">{language === 'ar' ? 'لون الشارة' : 'Tag color'}</Label>
              <select
                value={tagColor ?? ''}
                onChange={(e) => setTagColor(e.target.value)}
                className={formControlClass}
                aria-label={language === 'ar' ? 'لون الشارة' : 'Tag color'}
              >
                {BADGE_COLOR_OPTIONS.map((opt) => (
                  <option key={opt.value || 'none'} value={opt.value}>
                    {language === 'ar' ? opt.labelAr : opt.labelEn}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">{language === 'ar' ? 'الكمية' : 'Stock'}</Label>
            <Input type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} placeholder={language === 'ar' ? 'الكمية' : 'Stock'} />
          </div>
        </div>

        {/* Right panel: description, features, variants — every input has title on top */}
        <div className="space-y-5">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">{language === 'ar' ? 'الوصف (عربي)' : 'Description (Arabic)'}</Label>
            <textarea
              value={descriptionAr}
              onChange={(e) => setDescriptionAr(e.target.value)}
              dir="rtl"
              rows={2}
              placeholder={language === 'ar' ? 'الوصف (عربي)' : 'Description (Arabic)'}
              className={cn(formControlClass, 'resize-none')}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">{language === 'ar' ? 'الوصف (إنجليزي)' : 'Description (English)'}</Label>
            <textarea
              value={descriptionEn}
              onChange={(e) => setDescriptionEn(e.target.value)}
              rows={2}
              placeholder={language === 'ar' ? 'الوصف (إنجليزي)' : 'Description (English)'}
              className={cn(formControlClass, 'resize-none')}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">{language === 'ar' ? 'المميزات' : 'Features'}</Label>
            {featuresAr.map((_, i) => (
              <div key={i} className="flex gap-2 items-center min-w-0">
                <Input
                  value={featuresAr[i]}
                  onChange={(e) => setFeature(i, e.target.value, featuresEn[i] ?? '')}
                  placeholder={language === 'ar' ? 'ميزة (عربي)' : 'Feature (AR)'}
                  className="flex-1 min-w-0"
                  dir="rtl"
                />
                <Input
                  value={featuresEn[i]}
                  onChange={(e) => setFeature(i, featuresAr[i] ?? '', e.target.value)}
                  placeholder={language === 'ar' ? 'إنجليزي' : 'EN'}
                  className="flex-1 min-w-0"
                />
                <button type="button" onClick={() => removeFeature(i)} className="shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-muted-foreground hover:text-destructive hover:bg-muted transition-colors" aria-label="Remove">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addFeature} className="min-h-[44px]">
              + {language === 'ar' ? 'ميزة' : 'Feature'}
            </Button>
          </div>
          <div className="space-y-3">
            <Label className="text-sm font-medium text-foreground">{language === 'ar' ? 'الخيارات والمقاسات والكمية' : 'Variants, sizes & stock'}</Label>
            <p className="text-xs text-muted-foreground">
              {language === 'ar' ? 'كل خيار (لون/موديل) له مقاسات؛ كل مقاس له كمية. للمنتج الواحد: خيار واحد مثل "افتراضي" ومقاس واحد مثل "واحد" أو "240ل".' : 'Each variant (color/option) has sizes; each size has a quantity. One option + one size (e.g. "One" or "240L") for single-SKU products.'}
            </p>
            {variants.map((v, vi) => (
              <div key={vi} className="p-3 rounded-xl border border-border bg-muted/20 space-y-2">
                <div className="flex gap-2 flex-wrap items-end">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground">{language === 'ar' ? 'خيار (لون/موديل)' : 'Variant (color/option)'}</Label>
                    <Input
                      value={v.colorName}
                      onChange={(e) => updateVariant(vi, { colorName: e.target.value })}
                      placeholder={language === 'ar' ? 'مثال: افتراضي' : 'e.g. Default'}
                      className="w-28"
                    />
                  </div>
                  <input
                    type="color"
                    value={v.colorCode}
                    onChange={(e) => updateVariant(vi, { colorCode: e.target.value })}
                    className="w-10 h-10 rounded-lg border border-border cursor-pointer bg-background shrink-0"
                    aria-label={language === 'ar' ? 'لون' : 'Color'}
                  />
                  {variants.length > 1 && (
                    <button type="button" onClick={() => removeVariant(vi)} className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-muted-foreground hover:text-destructive hover:bg-muted transition-colors" aria-label="Remove variant">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <VariantImageManager
                  items={v.images.map((url) => ({ url }))}
                  onAdd={async (file) => {
                    setUploadingVariantIdx(vi)
                    try {
                      const url = await adminApi.uploadProductImage(product.code, v.colorName || 'افتراضي', file)
                      if (url) updateVariant(vi, { images: [...v.images, url] })
                    } finally {
                      setUploadingVariantIdx(null)
                    }
                  }}
                  onRemove={(item) => updateVariant(vi, { images: v.images.filter((u) => u !== item.url) })}
                  isUploading={uploadingVariantIdx === vi}
                  disabled={isLoading}
                  language={language}
                />
                {v.sizes.map((s, si) => (
                  <div key={si} className="flex gap-2 items-end">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-muted-foreground">{language === 'ar' ? 'المقاس (واحد / 240ل)' : 'Size (One, 240L…)'}</Label>
                      <Input value={s.size} onChange={(e) => updateVariantSize(vi, si, e.target.value, s.quantity)} placeholder={language === 'ar' ? 'واحد أو 240ل' : 'One or 240L'} className="w-24" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-muted-foreground">{language === 'ar' ? 'الكمية (مخزون)' : 'Qty (stock)'}</Label>
                      <Input type="number" min={0} value={s.quantity} onChange={(e) => updateVariantSize(vi, si, s.size, parseInt(e.target.value, 10) || 0)} className="w-20" />
                    </div>
                    {v.sizes.length > 1 && (
                      <button type="button" onClick={() => removeSizeFromVariant(vi, si)} className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-muted-foreground hover:text-destructive hover:bg-muted" aria-label="Remove size">
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => addSizeToVariant(vi)} className="min-h-[36px] text-xs">
                  + {language === 'ar' ? 'مقاس' : 'Size'}
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addVariant} className="min-h-[44px] w-full">
              + {language === 'ar' ? 'خيار (لون/موديل)' : 'Variant (color/option)'}
            </Button>
            {errors.variants && <p className="text-xs text-destructive">{errors.variants}</p>}
          </div>
        </div>
      </div>

      <DialogFooter className="pt-4 border-t border-border gap-3 sm:gap-2">
        <Button type="button" variant="outline" onClick={onCancel} className="min-h-[44px] flex-1 sm:flex-none">
          {language === 'ar' ? 'إلغاء' : 'Cancel'}
        </Button>
        <Button type="submit" disabled={isLoading} className="min-h-[44px] flex-1 sm:flex-none bg-primary text-primary-foreground hover:bg-gold-400 hover:shadow-gold-sm">
          {isLoading ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') : language === 'ar' ? 'حفظ' : 'Save'}
        </Button>
      </DialogFooter>
    </form>
  )
}

export default AdminProductsPage
