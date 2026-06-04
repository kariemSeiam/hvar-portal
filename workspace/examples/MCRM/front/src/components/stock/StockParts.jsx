import { useState, useMemo, useCallback, memo, useEffect } from 'react';
import { Package, Edit, Plus, Search, AlertTriangle, CheckCircle, XCircle, ChevronLeft, ChevronRight, Hash, Activity, X, Bell, Filter, Wrench, Settings, ChevronDown, ChevronUp, Trash2, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { EmptyState } from '../ui';
import { stockAPI } from '../../api/stockAPI';
import { productAPI } from '../../api/productAPI';
import { useAuth } from '../../contexts/AuthContext';
import { ProductStockModal, ProductPartsManagementModal } from '../modals';
import {
    getItemStatus,
    getStockStatusColor,
    getStockStatusLabel,
    sortStockItems,
    getStockAnalytics,
    arabicUtils
} from '../../utils/stock/utils';
import LoadingSpinner from '../ui/LoadingSpinner';
import { PaginationControls } from '../ui';

// Part Row Component
const PartRow = memo(({ part, onEdit, onManageStock, onManageParts }) => {
    const status = getItemStatus(part);
    // Support both backend formats
    const quantityOnHand = part.quantity_on_hand || part.quantityOnHand || 0;
    const quantityReserved = part.quantity_reserved || part.quantityReserved || 0;
    const quantityDamaged = part.quantity_damaged || part.quantityDamaged || 0;
    const availableStock = quantityOnHand - quantityReserved;
    const totalStock = quantityOnHand + quantityDamaged; // Total includes damaged items

    return (
        <tr className="border-b border-stone-200/80 dark:border-gray-700 hover:bg-stone-100/80 dark:hover:bg-gray-700/50 transition-colors duration-150">
            {/* Part Info with Icon */}
            <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3">
                <div className="flex items-center gap-x-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${status === 'active' ? 'bg-ui-success-50 dark:bg-ui-success-900/30' :
                        status === 'low_stock' ? 'bg-ui-warning-50 dark:bg-ui-warning-900/30' :
                            'bg-ui-danger-50 dark:bg-ui-danger-900/30'
                        }`}>
                        <Package className={`w-4 h-4 ${status === 'active' ? 'text-ui-success-600 dark:text-ui-success-400' :
                            status === 'low_stock' ? 'text-ui-warning-600 dark:text-ui-warning-400' :
                                'text-ui-danger-600 dark:text-ui-danger-400'
                            }`} />
                    </div>
                    <div className="flex flex-col space-y-1">
                        <span className="text-xs sm:text-sm font-semibold text-stone-800 dark:text-gray-100 font-cairo truncate">
                            {part.name}
                        </span>
                        <span className="text-xs text-stone-600 dark:text-gray-400 font-cairo truncate">
                            {part.sku}
                        </span>
                    </div>
                </div>
            </td>

            {/* Total Stock (Valid + Damaged) - with 3-part progress indicator */}
            <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-center">
                <div className="flex flex-col items-center space-y-1.5">
                    <span className="text-sm font-bold text-stone-800 dark:text-gray-100">{quantityOnHand}</span>
                    {/* 3-segment progress bar: Valid (green) | Reserved (amber) | Damaged (red) */}
                    <div className="w-20 h-2 bg-stone-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
                        {totalStock > 0 && (
                            <>
                                {/* Valid Stock (green) */}
                                {(quantityOnHand - quantityReserved) > 0 && (
                                    <div
                                        className="h-full bg-accent-green-500 dark:bg-accent-green-600"
                                        style={{ width: `${((quantityOnHand - quantityReserved) / totalStock) * 100}%` }}
                                        title={`صالح: ${quantityOnHand - quantityReserved}`}
                                    />
                                )}
                                {/* Reserved Stock (amber) */}
                                {quantityReserved > 0 && (
                                    <div
                                        className="h-full bg-accent-amber-500 dark:bg-accent-amber-600"
                                        style={{ width: `${(quantityReserved / totalStock) * 100}%` }}
                                        title={`محجوز: ${quantityReserved}`}
                                    />
                                )}
                                {/* Damaged Stock (red) */}
                                {quantityDamaged > 0 && (
                                    <div
                                        className="h-full bg-ui-danger-500 dark:bg-ui-danger-600"
                                        style={{ width: `${(quantityDamaged / totalStock) * 100}%` }}
                                        title={`تالف: ${quantityDamaged}`}
                                    />
                                )}
                            </>
                        )}
                    </div>
                </div>
            </td>

            {/* Quantity Reserved - with lock icon if reserved */}
            <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-center">
                <div className="flex items-center justify-center space-x-1 space-x-reverse">
                    {quantityReserved > 0 && (
                        <Activity className="w-3 h-3 text-accent-amber-600 dark:text-accent-amber-400" />
                    )}
                    <span className={`text-sm font-bold ${quantityReserved > 0
                        ? 'text-accent-amber-600 dark:text-accent-amber-400'
                        : 'text-stone-600 dark:text-gray-400'
                        }`}>
                        {quantityReserved}
                    </span>
                </div>
            </td>

            {/* Quantity Damaged - with alert icon if damaged */}
            <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-center">
                <div className="flex items-center justify-center space-x-1 space-x-reverse">
                    {quantityDamaged > 0 && (
                        <AlertTriangle className="w-3 h-3 text-ui-danger-600 dark:text-ui-danger-400" />
                    )}
                    <span className={`text-sm font-bold ${quantityDamaged > 0
                        ? 'text-ui-danger-600 dark:text-ui-danger-400'
                        : 'text-stone-600 dark:text-gray-400'
                        }`}>
                        {quantityDamaged}
                    </span>
                </div>
            </td>

            {/* Available Stock - with success icon */}
            <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-center">
                <div className="flex items-center justify-center space-x-1 space-x-reverse">
                    <CheckCircle className="w-3 h-3 text-brand-blue-600 dark:text-brand-blue-400" />
                    <span className="text-sm font-bold text-brand-blue-600 dark:text-brand-blue-400">
                        {availableStock}
                    </span>
                </div>
            </td>

            {/* Pricing - one horizontal creative row */}
            <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 align-middle">
                {(part.price_customer != null && part.price_customer !== '') || (part.price_merchant != null && part.price_merchant !== '') ? (
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                        {part.price_customer != null && part.price_customer !== '' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-blue-50 dark:bg-brand-blue-900/20 border border-brand-blue-100 dark:border-brand-blue-800/50">
                                <span className="text-[10px] font-medium text-brand-blue-600 dark:text-brand-blue-400">عميل</span>
                                <span className="text-sm font-bold text-stone-800 dark:text-gray-100 tabular-nums">
                                    {Number(part.price_customer) % 1 === 0 ? Number(part.price_customer) : Number(part.price_customer).toFixed(2)}
                                </span>
                                <span className="text-[10px] text-stone-600 dark:text-gray-400">ج.م</span>
                            </span>
                        )}
                        {part.price_merchant != null && part.price_merchant !== '' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 dark:bg-gray-700/60 border border-stone-200 dark:border-gray-600">
                                <span className="text-[10px] font-medium text-stone-600 dark:text-gray-400">تاجر</span>
                                <span className="text-sm font-bold text-stone-800 dark:text-gray-100 tabular-nums">
                                    {Number(part.price_merchant) % 1 === 0 ? Number(part.price_merchant) : Number(part.price_merchant).toFixed(2)}
                                </span>
                                <span className="text-[10px] text-stone-600 dark:text-gray-400">ج.م</span>
                            </span>
                        )}
                    </div>
                ) : (
                    <span className="text-xs text-stone-500 dark:text-gray-500 block text-center">—</span>
                )}
            </td>

            {/* Status Badge */}
            <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-center">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStockStatusColor(status)}`}>
                    {getStockStatusLabel(status)}
                </span>
            </td>

            {/* Actions */}
            <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-center">
                <div className="flex items-center justify-center space-x-1 sm:space-x-2 space-x-reverse">
                    <button
                        onClick={() => onEdit(part)}
                        className="p-1 text-stone-500 hover:text-ui-success-600 dark:hover:text-ui-success-400 transition-colors rounded focus:outline-none focus:ring-2 focus:ring-brand-red-500"
                        title="تعديل القطعة"
                    >
                        <Edit className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onManageStock(part)}
                        className="p-1 text-stone-500 hover:text-brand-blue-600 dark:hover:text-brand-blue-400 transition-colors rounded focus:outline-none focus:ring-2 focus:ring-brand-red-500"
                        title="تعديل يدوي للمخزون"
                    >
                        <Settings className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onManageParts(part)}
                        className="p-1 text-stone-500 hover:text-accent-purple-600 dark:hover:text-accent-purple-400 transition-colors rounded focus:outline-none focus:ring-2 focus:ring-brand-red-500"
                        title="إدارة المكونات"
                    >
                        <Wrench className="w-4 h-4" />
                    </button>
                </div>
            </td>
        </tr>
    );
});
PartRow.displayName = 'PartRow';

const StockPartsView = ({ parts, isLoading, onRefresh, lastUpdated, pagination, onPageChange }) => {
    const { userInfo } = useAuth();

    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [sortBy, setSortBy] = useState('available');
    const [sortOrder, setSortOrder] = useState('desc');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedStockStatus, setSelectedStockStatus] = useState('all');

    const [selectedPart, setSelectedPart] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showStockModal, setShowStockModal] = useState(false);
    const [showPartsManagementModal, setShowPartsManagementModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [formData, setFormData] = useState({
        sku: '',
        name: '',
        quantity_on_hand: 0,
        active: true,
        price_customer: '',
        price_merchant: ''
    });
    const [isExporting, setIsExporting] = useState(false);

    // Search debouncing - wait 300ms after last keystroke before filtering
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Export handler
    const handleExport = async () => {
        setIsExporting(true);
        try {
            const result = await stockAPI.exportStockItems('part');
            if (result.success) {
                toast.success('تم تصدير القطع بنجاح');
            } else {
                toast.error(result.message || 'فشل في تصدير القطع');
            }
        } catch (error) {
            console.error('Export error:', error);
            toast.error('حدث خطأ أثناء التصدير');
        } finally {
            setIsExporting(false);
        }
    };

    const filteredAndSortedParts = useMemo(() => {
        let filtered = [...parts];

        // Filter out deleted items (active === false or SKU contains "-deleted-")
        filtered = filtered.filter(p => {
            const isActive = p.active !== false && p.active !== 0;
            const sku = p.sku || p.part_sku || '';
            const isNotDeleted = !sku.includes('-deleted-') && !sku.endsWith('-deleted');
            return isActive && isNotDeleted;
        });

        if (debouncedSearch) {
            const lowercasedTerm = debouncedSearch.toLowerCase();
            filtered = filtered.filter(p =>
                p.name?.toLowerCase().includes(lowercasedTerm) ||
                p.part_name?.toLowerCase().includes(lowercasedTerm) ||
                p.sku?.toLowerCase().includes(lowercasedTerm) ||
                p.part_sku?.toLowerCase().includes(lowercasedTerm)
            );
        }

        if (selectedStockStatus !== 'all') {
            filtered = filtered.filter(p => getItemStatus(p) === selectedStockStatus);
        }

        return sortStockItems(filtered, sortBy, sortOrder);
    }, [parts, debouncedSearch, selectedStockStatus, sortBy, sortOrder]);

    const analytics = useMemo(() => getStockAnalytics(filteredAndSortedParts), [filteredAndSortedParts]);

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    const getSortIcon = (field) => {
        if (sortBy !== field) return null;
        return sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
    };

    const handleEditPart = useCallback((part) => {
        setSelectedPart(part);
        setFormData({
            sku: part.sku,
            name: part.name,
            quantity_on_hand: part.quantity_on_hand || part.quantityOnHand || 0,
            active: part.active !== undefined ? part.active : true,
            price_customer: part.price_customer || '',
            price_merchant: part.price_merchant || ''
        });
        setShowEditModal(true);
    }, []);

    const handleUpdatePart = async (e) => {
        e.preventDefault();
        setIsEditing(true);

        try {
            const updateData = {
                sku: formData.sku.trim(),
                name: formData.name.trim(),
                active: formData.active,
                user_id: userInfo?.id ?? 'system'
            };

            // Add price fields if they are provided (allow empty string to clear)
            if (formData.price_customer !== '' && formData.price_customer !== null && formData.price_customer !== undefined) {
                updateData.price_customer = parseFloat(formData.price_customer) || null;
            } else if (formData.price_customer === '') {
                updateData.price_customer = null;
            }

            if (formData.price_merchant !== '' && formData.price_merchant !== null && formData.price_merchant !== undefined) {
                updateData.price_merchant = parseFloat(formData.price_merchant) || null;
            } else if (formData.price_merchant === '') {
                updateData.price_merchant = null;
            }

            const result = await stockAPI.updateStockItem(selectedPart.id, updateData);

            if (result.success) {
                toast.success('تم تحديث القطعة بنجاح');
                setShowEditModal(false);
                setSelectedPart(null);
                setFormData({ sku: '', name: '', quantity_on_hand: 0, active: true, price_customer: '', price_merchant: '' });
                if (onRefresh) await onRefresh();
            } else {
                toast.error(result.message || 'فشل في تحديث القطعة');
            }
        } catch (error) {
            console.error('Failed to update part:', error);
            toast.error('حدث خطأ أثناء تحديث القطعة');
        } finally {
            setIsEditing(false);
        }
    };

    const handleDeletePart = async () => {
        if (!selectedPart) return;

        setIsDeleting(true);
        try {
            const result = await stockAPI.deleteStockItem(selectedPart.id);

            if (result.success) {
                toast.success(result.message || 'تم حذف القطعة بنجاح');
                setShowDeleteConfirm(false);
                setShowEditModal(false);
                setSelectedPart(null);
                setFormData({ sku: '', name: '', quantity_on_hand: 0, active: true, price_customer: '', price_merchant: '' });
                if (onRefresh) await onRefresh();
            } else {
                toast.error(result.message || 'فشل في حذف القطعة');
            }
        } catch (error) {
            console.error('Failed to delete part:', error);
            toast.error('حدث خطأ أثناء حذف القطعة');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCreatePart = async (e) => {
        e.preventDefault();
        setIsCreating(true);

        try {
            const partData = {
                sku: formData.sku.trim(),
                name: formData.name.trim(),
                type: 'part',
                user_id: userInfo?.id ?? 'system',
                quantity_on_hand: formData.quantity_on_hand || 0
            };
            if (formData.price_customer !== '' && formData.price_customer != null) {
                partData.price_customer = parseFloat(formData.price_customer) || null;
            }
            if (formData.price_merchant !== '' && formData.price_merchant != null) {
                partData.price_merchant = parseFloat(formData.price_merchant) || null;
            }

            const result = await productAPI.createPart(partData);

            if (result.success) {
                toast.success('تم إنشاء القطعة بنجاح');
                setShowCreateModal(false);
                setFormData({ sku: '', name: '', quantity_on_hand: 0, active: true, price_customer: '', price_merchant: '' });
                if (onRefresh) await onRefresh();
            } else {
                toast.error(result.message || 'فشل في إنشاء القطعة');
            }
        } catch (error) {
            console.error('Failed to create part:', error);
            toast.error('حدث خطأ أثناء إنشاء القطعة');
        } finally {
            setIsCreating(false);
        }
    };

    const handleManageStock = useCallback((part) => {
        setSelectedPart(part);
        setShowStockModal(true);
    }, []);

    const handleManageParts = useCallback((part) => {
        setSelectedPart(part);
        setShowPartsManagementModal(true);
    }, []);

    if (isLoading && !parts.length) {
        return (
            <div className="h-full flex flex-col">
                <div className="bg-stone-50/98 dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-stone-200/90 dark:border-gray-700 mb-4">
                    <div className="animate-pulse">
                        <div className="h-6 bg-stone-200 dark:bg-gray-700 rounded w-48 mb-4"></div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="h-20 bg-stone-200 dark:bg-gray-700 rounded"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Search and Actions — 8pt grid: gap-3, mb-4, controls h-11 sm:h-12 */}
            <div className="mb-4">
                <div className="flex flex-wrap items-center gap-3 w-full" dir="rtl">
                    {/* Search — h-11 sm:h-12, icon inset 12px */}
                    <div className="flex-1 min-w-0 min-w-[200px] sm:min-w-[240px]">
                        <div className="relative group flex items-center h-11 sm:h-12">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500 dark:text-gray-500 group-focus-within:text-brand-blue-500 dark:group-focus-within:text-brand-blue-400 transition-colors pointer-events-none" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="البحث في: اسم القطعة، SKU..."
                                className="w-full h-full pr-11 pl-10 py-0 text-sm font-cairo bg-transparent border-2 border-stone-200/60 dark:border-gray-700/60 hover:border-stone-300/70 dark:hover:border-gray-600/70 focus:border-brand-blue-500 dark:focus:border-brand-blue-400 rounded-full focus:outline-none focus:ring-0 focus:shadow-lg focus:shadow-brand-blue-500/10 text-stone-800 dark:text-gray-100 placeholder-stone-400 dark:placeholder-gray-500 transition-all duration-300"
                                dir="rtl"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-stone-500 dark:text-gray-500 hover:text-stone-600 dark:hover:text-gray-300 hover:bg-stone-100/80 dark:hover:bg-gray-800 transition-all duration-200"
                                    aria-label="مسح البحث"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Status chips — px-3 py-2 rounded-lg gap-3 */}
                    <div className="flex items-center gap-3 flex-wrap">
                        {[
                            { value: 'all', label: 'الكل' },
                            { value: 'active', label: 'متوفر' },
                            { value: 'low_stock', label: 'منخفض' },
                            { value: 'out_of_stock', label: 'نفد' },
                        ].map(({ value, label }) => {
                            const isActive = selectedStockStatus === value;
                            return (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => setSelectedStockStatus(value)}
                                    className={`
                                        px-3 py-2 rounded-lg text-sm font-cairo font-medium whitespace-nowrap transition-all duration-200
                                        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-stone-50 dark:focus:ring-offset-gray-800
                                        ${isActive
                                            ? 'bg-brand-blue-500 dark:bg-brand-blue-600 text-white shadow-md ring-2 ring-brand-blue-400/30 dark:ring-brand-blue-500/40 focus:ring-brand-blue-400'
                                            : 'bg-stone-50 dark:bg-gray-700/60 text-stone-700 dark:text-gray-300 border border-stone-200 dark:border-gray-600 hover:border-brand-blue-300 dark:hover:border-brand-blue-600/50 hover:bg-brand-blue-50/80 dark:hover:bg-brand-blue-900/20 hover:text-brand-blue-700 dark:hover:text-brand-blue-300'
                                        }
                                    `}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Export + Add — h-11 sm:h-12 px-4 gap-2 */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                        <button
                            onClick={handleExport}
                            disabled={isExporting || !parts.length}
                            className="flex items-center justify-center gap-2 h-11 sm:h-12 px-4 rounded-xl font-cairo text-sm font-medium border-2 border-accent-green-600 bg-accent-green-600 hover:bg-accent-green-700 hover:border-accent-green-700 disabled:bg-gray-400 disabled:border-gray-400 disabled:cursor-not-allowed text-white shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-accent-green-500/30 transition-all duration-200"
                            title="تصدير إلى Excel"
                        >
                            <Download className="w-4 h-4" />
                            <span>{isExporting ? 'جاري التصدير...' : 'تصدير'}</span>
                        </button>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center justify-center gap-2 h-11 sm:h-12 px-4 rounded-xl font-cairo text-sm font-medium border-2 border-brand-blue-600 bg-brand-blue-600 hover:bg-brand-blue-700 hover:border-brand-blue-700 text-white shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-blue-500/30 transition-all duration-200"
                        >
                            <Plus className="w-4 h-4" />
                            <span>إضافة قطعة</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Analytics strip (when search active) — gap-3 mb-3 */}
            {searchTerm && (
                <div className="mb-3 flex flex-wrap items-center gap-3 w-full" dir="rtl">
                    <span className="text-sm font-semibold text-brand-blue-700 dark:text-brand-blue-300 font-cairo">
                        نتائج البحث: <span className="text-stone-800 dark:text-gray-100">{filteredAndSortedParts.length} قطعة</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-xs sm:text-sm text-stone-600 dark:text-gray-400 font-cairo">
                        <CheckCircle className="w-3.5 h-3.5 text-ui-success-600 dark:text-ui-success-400" />
                        {analytics.active} متوفر
                    </span>
                    <span className="flex items-center gap-1.5 text-xs sm:text-sm text-stone-600 dark:text-gray-400 font-cairo">
                        <Bell className="w-3.5 h-3.5 text-accent-amber-600 dark:text-accent-amber-400" />
                        {analytics.lowStock} منخفض
                    </span>
                    <span className="flex items-center gap-1.5 text-xs sm:text-sm text-stone-600 dark:text-gray-400 font-cairo">
                        <XCircle className="w-3.5 h-3.5 text-ui-danger-600 dark:text-ui-danger-400" />
                        {analytics.outOfStock} نفد
                    </span>
                    <button
                        onClick={() => setSearchTerm('')}
                        className="mr-auto flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-cairo font-medium text-brand-blue-600 dark:text-brand-blue-400 hover:bg-brand-blue-100 dark:hover:bg-brand-blue-900/40 border border-brand-blue-200 dark:border-brand-blue-700 transition-colors"
                    >
                        <X className="w-3 h-3" />
                        مسح البحث
                    </button>
                </div>
            )}

            {/* Parts Display - Table View */}
            {filteredAndSortedParts.length > 0 ? (
                <div className="flex-1 bg-stone-50/98 dark:bg-gray-800 rounded-lg shadow-sm border border-stone-200/90 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800">
                        <table className="w-full min-w-[800px] sm:min-w-full">
                            <thead className="bg-stone-100 dark:bg-gray-700">
                                <tr>
                                    <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-right text-xs font-medium text-stone-600 dark:text-gray-400 uppercase tracking-wider font-cairo">
                                        القطعة
                                    </th>
                                    <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-center text-xs font-medium text-stone-600 dark:text-gray-400 uppercase tracking-wider font-cairo">
                                        في المخزن
                                    </th>
                                    <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-center text-xs font-medium text-stone-600 dark:text-gray-400 uppercase tracking-wider font-cairo">
                                        محجوز
                                    </th>
                                    <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-center text-xs font-medium text-stone-600 dark:text-gray-400 uppercase tracking-wider font-cairo">
                                        تالف
                                    </th>
                                    <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-center text-xs font-medium text-stone-600 dark:text-gray-400 uppercase tracking-wider font-cairo">
                                        سليم
                                    </th>
                                    <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-center text-xs font-medium text-stone-600 dark:text-gray-400 uppercase tracking-wider font-cairo whitespace-nowrap" title="سعر العميل · سعر التاجر">
                                        السعر <span className="font-normal normal-case text-stone-500 dark:text-gray-500">(عميل / تاجر)</span>
                                    </th>
                                    <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-center text-xs font-medium text-stone-600 dark:text-gray-400 uppercase tracking-wider font-cairo">
                                        الحالة
                                    </th>
                                    <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-center text-xs font-medium text-stone-600 dark:text-gray-400 uppercase tracking-wider font-cairo">
                                        الإجراءات
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-stone-50/98 dark:bg-gray-800 divide-y divide-stone-200/90 dark:divide-gray-700">
                                {isLoading && (
                                    <tr>
                                        <td colSpan="8" className="text-center py-8">
                                            <LoadingSpinner />
                                        </td>
                                    </tr>
                                )}
                                {!isLoading && filteredAndSortedParts.map(part => (
                                    <PartRow
                                        key={part.id}
                                        part={part}
                                        onEdit={handleEditPart}
                                        onManageStock={handleManageStock}
                                        onManageParts={handleManageParts}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center p-8">
                    <EmptyState
                        icon={<Wrench className="mx-auto" />}
                        title="لا توجد قطع غيار"
                        description={searchTerm ? "لا توجد قطع تطابق الفلاتر أو البحث الحالي" : "لم يتم تسجيل أي قطع غيار في المخزن حتى الآن. أضف قطعتك الأولى."}
                        size="medium"
                        variant="vibrant"
                        action={{ label: 'إضافة قطعة غيار', onClick: () => setShowCreateModal(true) }}
                    />
                </div>
            )}

            {/* Pagination Controls */}
            {pagination && onPageChange && (
                <PaginationControls
                    pagination={pagination}
                    onPageChange={onPageChange}
                />
            )}

            {/* Create Part Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-stone-50/98 dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full">
                        <div className="flex items-center justify-between p-6 border-b border-stone-200/90 dark:border-gray-700">
                            <div className="flex items-center space-x-3 space-x-reverse">
                                <Package className="w-6 h-6 text-brand-blue-600 dark:text-brand-blue-400" />
                                <h2 className="text-xl font-bold text-stone-800 dark:text-gray-100 font-cairo">إنشاء قطعة جديدة</h2>
                            </div>
                            <button onClick={() => setShowCreateModal(false)} className="text-stone-500 hover:text-stone-600 dark:hover:text-gray-300">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleCreatePart} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-stone-700 dark:text-gray-300 mb-2 font-cairo">
                                    اسم القطعة <span className="text-brand-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-3 py-2 border border-stone-300 dark:border-gray-600 rounded-lg text-right font-cairo bg-stone-50/98 dark:bg-gray-700 text-stone-800 dark:text-gray-100 focus:ring-2 focus:ring-brand-red-500"
                                    required
                                    dir="rtl"
                                    placeholder="أدخل اسم القطعة"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-stone-700 dark:text-gray-300 mb-2 font-cairo">
                                    رمز القطعة (SKU) <span className="text-brand-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.sku}
                                    onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                                    className="w-full px-3 py-2 border border-stone-300 dark:border-gray-600 rounded-lg font-cairo bg-stone-50/98 dark:bg-gray-700 text-stone-800 dark:text-gray-100 focus:ring-2 focus:ring-brand-red-500"
                                    required
                                    dir="ltr"
                                    placeholder="PART-001"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-stone-700 dark:text-gray-300 mb-2 font-cairo">
                                    الكمية الأولية (اختياري)
                                </label>
                                <input
                                    type="number"
                                    value={formData.quantity_on_hand}
                                    onChange={(e) => setFormData(prev => ({ ...prev, quantity_on_hand: parseInt(e.target.value) || 0 }))}
                                    className="w-full px-3 py-2 border border-stone-300 dark:border-gray-600 rounded-lg text-right font-cairo bg-stone-50/98 dark:bg-gray-700 text-stone-800 dark:text-gray-100 focus:ring-2 focus:ring-brand-red-500"
                                    min="0"
                                    placeholder="0"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 dark:text-gray-300 mb-2 font-cairo">
                                        سعر العميل (ج.م)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.price_customer}
                                        onChange={(e) => setFormData(prev => ({ ...prev, price_customer: e.target.value }))}
                                        className="w-full px-3 py-2 border border-stone-300 dark:border-gray-600 rounded-lg text-right font-cairo bg-stone-50/98 dark:bg-gray-700 text-stone-800 dark:text-gray-100 focus:ring-2 focus:ring-brand-red-500"
                                        dir="rtl"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 dark:text-gray-300 mb-2 font-cairo">
                                        سعر التاجر (ج.م)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.price_merchant}
                                        onChange={(e) => setFormData(prev => ({ ...prev, price_merchant: e.target.value }))}
                                        className="w-full px-3 py-2 border border-stone-300 dark:border-gray-600 rounded-lg text-right font-cairo bg-stone-50/98 dark:bg-gray-700 text-stone-800 dark:text-gray-100 focus:ring-2 focus:ring-brand-red-500"
                                        dir="rtl"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end space-x-3 space-x-reverse pt-4 border-t border-stone-200/90 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    disabled={isCreating}
                                    className="px-4 py-2 text-stone-700 dark:text-gray-300 bg-stone-200 dark:bg-gray-700 rounded-lg hover:bg-stone-300 dark:hover:bg-gray-600 transition-colors font-cairo"
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreating || !formData.sku.trim() || !formData.name.trim()}
                                    className="px-6 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-cairo"
                                >
                                    {isCreating ? 'جاري الإنشاء...' : 'إنشاء القطعة'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Part Modal */}
            {showEditModal && selectedPart && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-stone-50/98 dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full">
                        <div className="flex items-center justify-between p-6 border-b border-stone-200/90 dark:border-gray-700">
                            <div className="flex items-center space-x-3 space-x-reverse">
                                <Edit className="w-6 h-6 text-ui-success-600 dark:text-ui-success-400" />
                                <h2 className="text-xl font-bold text-stone-800 dark:text-gray-100 font-cairo">تعديل القطعة</h2>
                            </div>
                            <button onClick={() => setShowEditModal(false)} className="text-stone-500 hover:text-stone-600 dark:hover:text-gray-300">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdatePart} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-stone-700 dark:text-gray-300 mb-2 font-cairo">
                                    اسم القطعة <span className="text-brand-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-3 py-2 border border-stone-300 dark:border-gray-600 rounded-lg text-right font-cairo bg-stone-50/98 dark:bg-gray-700 text-stone-800 dark:text-gray-100 focus:ring-2 focus:ring-brand-red-500"
                                    required
                                    dir="rtl"
                                    placeholder="أدخل اسم القطعة"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-stone-700 dark:text-gray-300 mb-2 font-cairo">
                                    رمز القطعة (SKU) <span className="text-brand-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.sku}
                                    onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                                    className="w-full px-3 py-2 border border-stone-300 dark:border-gray-600 rounded-lg font-cairo bg-stone-50/98 dark:bg-gray-700 text-stone-800 dark:text-gray-100 focus:ring-2 focus:ring-brand-red-500"
                                    required
                                    dir="ltr"
                                    placeholder="PART-001"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 dark:text-gray-300 mb-2 font-cairo">
                                        سعر العميل (ج.م)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.price_customer}
                                        onChange={(e) => setFormData(prev => ({ ...prev, price_customer: e.target.value }))}
                                        className="w-full px-3 py-2 border border-stone-300 dark:border-gray-600 rounded-lg text-right font-cairo bg-stone-50/98 dark:bg-gray-700 text-stone-800 dark:text-gray-100 focus:ring-2 focus:ring-brand-red-500"
                                        dir="rtl"
                                        placeholder="0.00"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-stone-700 dark:text-gray-300 mb-2 font-cairo">
                                        سعر التاجر (ج.م)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.price_merchant}
                                        onChange={(e) => setFormData(prev => ({ ...prev, price_merchant: e.target.value }))}
                                        className="w-full px-3 py-2 border border-stone-300 dark:border-gray-600 rounded-lg text-right font-cairo bg-stone-50/98 dark:bg-gray-700 text-stone-800 dark:text-gray-100 focus:ring-2 focus:ring-brand-red-500"
                                        dir="rtl"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-stone-100 dark:bg-gray-700/50 rounded-lg">
                                <label className="flex items-center cursor-pointer">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            checked={formData.active}
                                            onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                                            className="sr-only"
                                        />
                                        <div className={`block w-14 h-8 rounded-full transition-colors ${formData.active ? 'bg-accent-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                                        <div className={`absolute left-1 top-1 bg-stone-50 w-6 h-6 rounded-full transition-transform ${formData.active ? 'transform translate-x-6' : ''}`}></div>
                                    </div>
                                    <span className="mr-3 text-sm font-medium text-stone-700 dark:text-gray-300 font-cairo">
                                        {formData.active ? 'قطعة نشطة' : 'قطعة غير نشطة'}
                                    </span>
                                </label>
                                <span className={`px-3 py-1 text-xs font-medium rounded-full ${formData.active ? 'bg-ui-success-50 text-ui-success-700 dark:bg-ui-success-900/30 dark:text-ui-success-200' : 'bg-ui-danger-50 text-ui-danger-700 dark:bg-ui-danger-900/30 dark:text-ui-danger-200'}`}>
                                    {formData.active ? 'نشط' : 'غير نشط'}
                                </span>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-stone-200/90 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteConfirm(true)}
                                    disabled={isEditing || isDeleting}
                                    className="px-4 py-2 text-white bg-ui-danger-600 rounded-lg hover:bg-ui-danger-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-cairo flex items-center space-x-2 space-x-reverse"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    <span>حذف القطعة</span>
                                </button>
                                <div className="flex items-center space-x-3 space-x-reverse">
                                    <button
                                        type="button"
                                        onClick={() => setShowEditModal(false)}
                                        disabled={isEditing || isDeleting}
                                        className="px-4 py-2 text-stone-700 dark:text-gray-300 bg-stone-200 dark:bg-gray-700 rounded-lg hover:bg-stone-300 dark:hover:bg-gray-600 transition-colors font-cairo"
                                    >
                                        إلغاء
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isEditing || isDeleting || !formData.sku.trim() || !formData.name.trim()}
                                        className="px-6 py-2 bg-ui-success-600 text-white rounded-lg hover:bg-ui-success-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-cairo"
                                    >
                                        {isEditing ? 'جاري التحديث...' : 'تحديث القطعة'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && selectedPart && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-stone-50/98 dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
                        <div className="flex items-center justify-between p-6 border-b border-stone-200/90 dark:border-gray-700">
                            <div className="flex items-center space-x-3 space-x-reverse">
                                <AlertTriangle className="w-6 h-6 text-ui-danger-600 dark:text-ui-danger-400" />
                                <h2 className="text-xl font-bold text-stone-800 dark:text-gray-100 font-cairo">تأكيد الحذف</h2>
                            </div>
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={isDeleting}
                                className="text-stone-500 hover:text-stone-600 dark:hover:text-gray-300 disabled:opacity-50"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <p className="text-stone-700 dark:text-gray-300 font-cairo">
                                هل أنت متأكد من حذف القطعة <span className="font-bold">{selectedPart.name}</span> (SKU: {selectedPart.sku})؟
                            </p>
                            <p className="text-sm text-ui-danger-600 dark:text-ui-danger-400 font-cairo">
                                تحذير: لا يمكن التراجع عن هذا الإجراء. إذا كانت القطعة مرتبطة بطلبات خدمة أو حركات مخزون أو مستخدمة كمكون في منتج، لن يتم الحذف.
                            </p>

                            <div className="flex items-center justify-end space-x-3 space-x-reverse pt-4 border-t border-stone-200/90 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteConfirm(false)}
                                    disabled={isDeleting}
                                    className="px-4 py-2 text-stone-700 dark:text-gray-300 bg-stone-200 dark:bg-gray-700 rounded-lg hover:bg-stone-300 dark:hover:bg-gray-600 transition-colors font-cairo disabled:opacity-50"
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDeletePart}
                                    disabled={isDeleting}
                                    className="px-6 py-2 bg-ui-danger-600 text-white rounded-lg hover:bg-ui-danger-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-cairo flex items-center space-x-2 space-x-reverse"
                                >
                                    {isDeleting ? (
                                        <>
                                            <LoadingSpinner size="sm" color="white" />
                                            <span>جاري الحذف...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="w-4 h-4" />
                                            <span>حذف</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showStockModal && selectedPart && (
                <ProductStockModal
                    isOpen={showStockModal}
                    onClose={() => setShowStockModal(false)}
                    onSuccess={() => {
                        onRefresh();
                        setShowStockModal(false);
                    }}
                    item={selectedPart}
                />
            )}
            {showPartsManagementModal && selectedPart && (
                <ProductPartsManagementModal
                    isOpen={showPartsManagementModal}
                    onClose={() => setShowPartsManagementModal(false)}
                    onSuccess={() => {
                        onRefresh();
                        setShowPartsManagementModal(false);
                    }}
                    product={selectedPart}
                />
            )}
        </div>
    );
};

export default StockPartsView;
