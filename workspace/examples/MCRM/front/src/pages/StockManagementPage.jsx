import { useState, useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Package, Wrench, TrendingUp } from 'lucide-react';

import { productAPI } from '../api/productAPI';
import { stockAPI } from '../api/stockAPI';
import { StockProducts, StockParts, StockMovements } from '../components/stock';
import { ManualChangeModal } from '../components/modals';
import AlertChip from '../components/ui/StatusChip';
import { ManualChangeFAB } from '../components/ui';
import logger from '../utils/core/logger';
import StockTabs from '../components/stock/StockTabs';

// Stock Management Page
const StockManagementPage = () => {
  // URL search params for tab persistence
  const [searchParams, setSearchParams] = useSearchParams();

  // Products and parts state
  const [products, setProducts] = useState([]);
  const [parts, setParts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingParts, setIsLoadingParts] = useState(false);
  const [lastProductsUpdate, setLastProductsUpdate] = useState(null);
  const [lastPartsUpdate, setLastPartsUpdate] = useState(null);

  // Stock movements state (page-owned; single source of truth for Movements tab)
  const [stockMovements, setStockMovements] = useState([]);
  const [isLoadingMovements, setIsLoadingMovements] = useState(false);
  const [lastMovementsUpdate, setLastMovementsUpdate] = useState(null);

  // Movement filters (server-side) — owned by page so tab counts and refresh stay correct
  const defaultMovementFilters = useMemo(() => ({
    movementTypes: [],
    itemTypes: [],
    conditions: [],
    serviceTypes: [],
    startDate: '',
    endDate: '',
    datePreset: 'all',
    sortBy: 'created_at',
    sortOrder: 'desc',
    limit: 50,
  }), []);
  const [movementFilters, setMovementFilters] = useState(defaultMovementFilters);

  // Connection status
  const [connectionStatus, setConnectionStatus] = useState('connected');

  // Page statistics and loading
  const [isLoading, setIsLoading] = useState(true);
  // Initialize activeTab from URL param, default to 'products'
  const [activeTab, setActiveTab] = useState(() => {
    return searchParams.get('tab') || 'products';
  });

  // Global search and filters
  const [globalSearch, setGlobalSearch] = useState('');
  const [showGlobalFilters, setShowGlobalFilters] = useState(false);
  const [globalFilters, setGlobalFilters] = useState({
    category: 'all',
    partType: 'all',
    stockStatus: 'all',
    lowStockOnly: false
  });

  // Creation modals state - Now handled by individual components
  const [showCreatePartModal, setShowCreatePartModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Manual change modal
  const [showManualChangeModal, setShowManualChangeModal] = useState(false);
  const [scannedValue, setScannedValue] = useState('');

  // Scanner input detection (for barcode scanners that input via keyboard)
  useEffect(() => {
    let scannerBuffer = '';
    let scannerTimeout = null;
    let lastKeyTime = 0;

    const handleKeyPress = (e) => {
      const currentTime = Date.now();
      const timeSinceLastKey = currentTime - lastKeyTime;

      // Ignore if user is typing in an input/textarea
      if (
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'TEXTAREA' ||
        e.target.isContentEditable
      ) {
        scannerBuffer = '';
        lastKeyTime = 0;
        return;
      }

      // Reset if too much time has passed (more than 100ms = manual typing)
      if (timeSinceLastKey > 100 && scannerBuffer.length > 0) {
        scannerBuffer = '';
      }

      // Handle Enter key (end of scan)
      if (e.key === 'Enter' && scannerBuffer.length >= 3) {
        e.preventDefault();
        e.stopPropagation();

        const scannedNumber = scannerBuffer.trim();
        scannerBuffer = '';
        lastKeyTime = 0;

        // Navigate to movements tab and open modal
        handleTabChange('movements');
        setScannedValue(scannedNumber);
        setShowManualChangeModal(true);

        return;
      }

      // Handle normal character input
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        scannerBuffer += e.key;
        lastKeyTime = currentTime;

        // Clear buffer if it gets too long (manual typing)
        if (scannerBuffer.length > 50) {
          scannerBuffer = '';
        }

        // Reset timeout
        if (scannerTimeout) {
          clearTimeout(scannerTimeout);
        }
        scannerTimeout = setTimeout(() => {
          scannerBuffer = '';
        }, 500);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      if (scannerTimeout) {
        clearTimeout(scannerTimeout);
      }
    };
  }, []);

  // Creation form data - Now handled by individual components
  const [partFormData, setPartFormData] = useState({
    part_sku: '',
    part_name: '',
    part_type: 'motor',
    product_id: '',
    min_stock_level: 5,
    current_stock: 0,
  });

  // Pagination state
  const [pagination, setPagination] = useState({
    products: { page: 1, limit: 20, total: 0 },
    parts: { page: 1, limit: 20, total: 0 },
    movements: { page: 1, limit: 50, total: 0, offset: 0, has_more: false }
  });

  // Tab change handler with URL persistence
  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  }, [setSearchParams]);

  // Load initial data - preload all tabs for accurate badge counts
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await Promise.all([
          loadProducts(false),
          loadParts(false),
          loadStockMovements(defaultMovementFilters, 0)
        ]);
      } catch (error) {
        logger.error('Failed to load initial data:', error);
        toast.error('فشل في تحميل البيانات الأولية');
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Note: Removed duplicate reload on tab change - data already preloaded
  // Pagination changes are handled by handlePageChange directly

  // Listen for navigation messages from child components
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.type === 'NAVIGATE_TO_PRODUCTS') {
        handleTabChange('products');
        toast.success('تم الانتقال إلى صفحة المنتجات');
      } else if (event.data?.type === 'NAVIGATE_TO_PARTS') {
        handleTabChange('parts');
        toast.success('تم الانتقال إلى صفحة القطع');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Load data for specific tab
  const loadTabData = async (tabName, showToast = false) => {
    switch (tabName) {
      case 'products':
        await loadProducts(showToast);
        break;
      case 'parts':
        await loadParts(showToast);
        break;
      case 'movements':
        await loadStockMovements(showToast);
        break;
      default:
        break;
    }
  };

  // Load products with pagination
  const loadProducts = async (showToast = false, targetPage = null) => {
    setIsLoadingProducts(true);
    try {
      const page = targetPage ?? pagination.products.page;
      const params = {
        page: page,
        limit: pagination.products.limit,
        category: globalFilters.category !== 'all' ? globalFilters.category : undefined,
        search: globalSearch || undefined,
      };

      // Use stockAPI for consistent API
      const result = await stockAPI.getProducts(params);
      if (result.success) {
        setProducts(result.data.items || []);
        setLastProductsUpdate(new Date());
        setConnectionStatus('connected');
        if (result.data.pagination) {
          setPagination(prev => ({
            ...prev,
            products: { ...result.data.pagination, page: page }
          }));
        }
        if (showToast) {
          toast.success('تم تحديث قائمة المنتجات');
        }
      } else {
        setConnectionStatus('error');
        logger.warn('Products API failed');
        setProducts([]);
        if (showToast) {
          toast.error('فشل في تحميل المنتجات');
        }
      }
    } catch (error) {
      logger.error('Failed to load products:', error);
      setConnectionStatus('error');
      setProducts([]);
      if (showToast) {
        toast.error('فشل في تحميل المنتجات');
      }
    } finally {
      setIsLoadingProducts(false);
    }
  };

  // Enhanced load parts with real-time capabilities
  const loadParts = async (showToast = false, targetPage = null) => {
    setIsLoadingParts(true);
    try {
      const page = targetPage ?? pagination.parts.page;
      const params = {
        page: page,
        limit: pagination.parts.limit,
        part_type: globalFilters.partType !== 'all' ? globalFilters.partType : undefined,
        search: globalSearch || undefined,
      };

      // Use stockAPI for consistent API
      const result = await stockAPI.getParts(params);
      if (result.success) {
        setParts(result.data.items || []);
        setLastPartsUpdate(new Date());
        setConnectionStatus('connected');
        if (result.data.pagination) {
          setPagination(prev => ({
            ...prev,
            parts: { ...result.data.pagination, page: page }
          }));
        }
        if (showToast) {
          toast.success('تم تحديث قائمة القطع');
        }
      } else {
        setConnectionStatus('error');
        logger.warn('Parts API failed');
        setParts([]);
        if (showToast) {
          toast.error('فشل في تحميل القطع');
        }
      }
    } catch (error) {
      logger.error('Failed to load parts:', error);
      setConnectionStatus('error');
      setParts([]);
      if (showToast) {
        toast.error('فشل في تحميل القطع');
      }
    } finally {
      setIsLoadingParts(false);
    }
  };

  // Load stock movements with full API filter support (page-owned; single source of truth)
  const loadStockMovements = useCallback(async (filters, offset = 0, options = {}) => {
    const { showToast: showToastOption = false } = options;
    setIsLoadingMovements(true);
    try {
      const limit = filters?.limit ?? pagination.movements?.limit ?? 50;
      const params = {
        limit,
        offset,
        order_by: filters?.sortBy ?? 'created_at',
        order_direction: (filters?.sortOrder ?? 'desc').toUpperCase(),
      };
      if (filters?.movementTypes?.length) {
        params.movement_type = filters.movementTypes.join(',');
      }
      if (filters?.itemTypes?.length) {
        params.item_type = filters.itemTypes.join(',');
      }
      if (filters?.conditions?.length) {
        params.condition = filters.conditions.join(',');
      }
      if (filters?.serviceTypes?.length) {
        params.service_type = filters.serviceTypes.join(',');
      }
      if (filters?.startDate) params.start_date = filters.startDate;
      if (filters?.endDate) params.end_date = filters.endDate;

      const result = await stockAPI.getStockMovements(params);
      if (result.success) {
        const data = result.data;
        setStockMovements(data.movements || []);
        setLastMovementsUpdate(new Date());
        setConnectionStatus('connected');
        const page = Math.floor(offset / limit) + 1;
        if (data.pagination) {
          setPagination(prev => ({
            ...prev,
            movements: { ...data.pagination, page, limit }
          }));
        }
        if (showToastOption) {
          toast.success('تم تحديث حركات المخزون');
        }
      } else {
        logger.error('Failed to load stock movements:', result.message);
        setStockMovements([]);
        setPagination(prev => ({
          ...prev,
          movements: { page: 1, limit: 50, total: 0, offset: 0, has_more: false }
        }));
        toast.error(result.message || 'فشل في تحميل حركات المخزون');
      }
    } catch (error) {
      logger.error('Failed to load stock movements:', error);
      toast.error('فشل في تحميل حركات المخزون');
    } finally {
      setIsLoadingMovements(false);
    }
  }, [pagination.movements?.limit]);


  // Enhanced comprehensive refresh function
  const handleRefresh = async () => {
    try {
      await loadTabData(activeTab, true);
      toast.success('تم تحديث البيانات بنجاح');
    } catch (error) {
      logger.error('Failed to refresh data:', error);
      toast.error('فشل في تحديث البيانات');
    }
  };



  // Handle pagination changes - triggers data load for the specific tab
  const handlePageChange = useCallback((tabName, page) => {
    setPagination(prev => ({
      ...prev,
      [tabName]: { ...prev[tabName], page }
    }));

    switch (tabName) {
      case 'products':
        loadProducts(false, page);
        break;
      case 'parts':
        loadParts(false, page);
        break;
      case 'movements': {
        const limit = pagination.movements?.limit ?? movementFilters.limit ?? 50;
        loadStockMovements(movementFilters, (page - 1) * limit);
        break;
      }
      default:
        break;
    }
  }, [globalFilters, globalSearch, loadStockMovements, movementFilters, pagination.movements?.limit]);

  // Handle global filter changes
  const handleGlobalFilterChange = (newFilters) => {
    setGlobalFilters(prev => ({ ...prev, ...newFilters }));
    // Reset pagination when filters change
    setPagination(prev => ({
      ...prev,
      products: { ...prev.products, page: 1 },
      parts: { ...prev.parts, page: 1 }
    }));
    // Trigger reload with new filters (page 1)
    setTimeout(() => {
      loadProducts(false, 1);
      loadParts(false, 1);
    }, 0);
  };

  // Calculate tab counts for badges - use pagination totals for accuracy
  const getTabCounts = useMemo(() => {
    const counts = {
      products: pagination.products.total || products.length,
      parts: pagination.parts.total || parts.length,
      movements: pagination.movements.total || stockMovements.length,
      analytics: 0
    };

    return counts;
  }, [products.length, parts.length, stockMovements.length, pagination.products.total, pagination.parts.total, pagination.movements.total]);

  // Tabs configuration for StockTabs
  const stockTabs = useMemo(
    () => [
      {
        id: 'products',
        label: 'المنتجات',
        badge: getTabCounts.products.toString(),
        color: 'indigo',
        icon: Package,
        ariaLabel: 'تبويب المنتجات',
      },
      {
        id: 'parts',
        label: 'القطع',
        badge: getTabCounts.parts.toString(),
        color: 'purple',
        icon: Wrench,
        ariaLabel: 'تبويب القطع',
      },
      {
        id: 'movements',
        label: 'حركات المخزون',
        badge: getTabCounts.movements.toString(),
        color: 'amber',
        icon: TrendingUp,
        ariaLabel: 'تبويب حركات المخزون',
      },
    ],
    [getTabCounts.products, getTabCounts.parts, getTabCounts.movements]
  );

  // Get loading state for current tab
  const getCurrentTabLoading = () => {
    switch (activeTab) {
      case 'products':
        return isLoadingProducts;
      case 'parts':
        return isLoadingParts;
      case 'movements':
        return isLoadingMovements;
      default:
        return false;
    }
  };

  // Generate stock alerts for the alert chip
  const stockAlerts = useMemo(() => {
    const alerts = [];
    // NOTE: Low stock alerts deferred until backend adds alert_quantity and min_stock_level fields to stock_items model
    // When implemented: check stockItems for items where quantity <= min_stock_level or quantity <= alert_quantity

    // Info alerts (recent movements)
    if (stockMovements.length > 0) {
      const recentMovements = stockMovements.filter(movement => {
        const movementDate = new Date(movement.created_at);
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return movementDate > oneDayAgo;
      });

      if (recentMovements.length > 0) {
        alerts.push({
          id: 'recent-movements',
          level: 'info',
          message: `${recentMovements.length} حركة مخزون جديدة`,
          details: 'خلال آخر 24 ساعة',
          item: { type: 'movement' }
        });
      }
    }

    return alerts;
  }, [products, parts, stockMovements]);

  return (
    <div className="h-full flex flex-col bg-stone-100/90 dark:bg-gray-900">
      {/* Responsive Container */}
      <div className="w-full max-w-full mx-auto flex-1 flex flex-col min-h-0">
        {/* Header with Integrated Tabs and Alert Chips */}
        <div className="bg-stone-50/95 dark:bg-gray-800 border-b border-stone-200/90 dark:border-gray-700">
          <StockTabs
            tabs={stockTabs}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            isLoading={isLoading}
            rightControls={
              <div className="flex items-center space-x-3 space-x-reverse">
                {/* Stock Alerts */}
                {stockAlerts.length > 0 && (
                  <AlertChip
                    alerts={stockAlerts}
                    onNavigate={(tab) => handleTabChange(tab)}
                  />
                )}
              </div>
            }
          />
        </div>

        {/* Main Content Area - Full Width */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-3 sm:p-4 md:p-6 h-full flex flex-col">
            {/* Dynamic Content Based on Active Tab */}
            {activeTab === 'products' && (
              <StockProducts
                products={products}
                filters={globalFilters}
                pagination={pagination.products}
                isLoading={getCurrentTabLoading()}
                onPageChange={(page) => handlePageChange('products', page)}
                onRefresh={() => loadProducts(true)}
                onFilterChange={handleGlobalFilterChange}
                lastUpdated={lastProductsUpdate}
                connectionStatus={connectionStatus}
              />
            )}

            {activeTab === 'parts' && (
              <StockParts
                parts={parts}
                filters={globalFilters}
                pagination={pagination.parts}
                isLoading={getCurrentTabLoading()}
                onPageChange={(page) => handlePageChange('parts', page)}
                onRefresh={() => loadParts(true)}
                onFilterChange={handleGlobalFilterChange}
                lastUpdated={lastPartsUpdate}
                connectionStatus={connectionStatus}
              />
            )}

            {activeTab === 'movements' && (
              <StockMovements
                movements={stockMovements}
                pagination={pagination.movements}
                isLoading={getCurrentTabLoading()}
                filters={movementFilters}
                onFilterChange={(newFilters) => {
                  setMovementFilters(newFilters);
                  loadStockMovements(newFilters, 0);
                }}
                onPageChange={(page) => handlePageChange('movements', page)}
                onRefresh={() => loadStockMovements(movementFilters, 0, { showToast: true })}
                lastUpdated={lastMovementsUpdate}
                connectionStatus={connectionStatus}
              />
            )}

          </div>
        </div>

        {/* Manual Change FAB */}
        <ManualChangeFAB onClick={() => setShowManualChangeModal(true)} />

        {/* Manual Change Modal */}
        <ManualChangeModal
          isOpen={showManualChangeModal}
          onClose={() => {
            setShowManualChangeModal(false);
            setScannedValue('');
          }}
          onSuccess={() => {
            loadStockMovements(true);
          }}
          initialSearchQuery={scannedValue}
        />

        {/* Create Part Modal - Now handled by StockParts component */}
        {showCreatePartModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-stone-50/98 dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-cairo font-semibold text-stone-800 dark:text-gray-100">
                  إضافة قطعة جديدة
                </h3>
                <button
                  onClick={() => setShowCreatePartModal(false)}
                  className="text-stone-500 hover:text-stone-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                setIsCreating(true);
                try {
                  const result = await productAPI.createPart(partFormData);
                  if (result.success) {
                    toast.success('تم إنشاء القطعة بنجاح');
                    setShowCreatePartModal(false);
                    setPartFormData({
                      part_sku: '',
                      part_name: '',
                      part_type: 'motor',
                      product_id: '',
                      min_stock_level: 5,
                      current_stock: 0,
                    });
                    await loadParts(); // Refresh parts list
                  } else {
                    toast.error(result.message || 'فشل في إنشاء القطعة');
                  }
                } catch (error) {
                  logger.error('Failed to create part:', error);
                  toast.error('فشل في إنشاء القطعة');
                } finally {
                  setIsCreating(false);
                }
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 dark:text-gray-300 mb-2 font-cairo">
                      رمز القطعة (SKU)
                    </label>
                    <input
                      type="text"
                      required
                      value={partFormData.part_sku}
                      onChange={(e) => setPartFormData(prev => ({ ...prev, part_sku: e.target.value }))}
                      className="w-full px-3 py-2 border border-stone-300 dark:border-gray-600 rounded-lg font-cairo text-sm focus:outline-none focus:ring-2 focus:ring-brand-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      dir="rtl"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 dark:text-gray-300 mb-2 font-cairo">
                      اسم القطعة
                    </label>
                    <input
                      type="text"
                      required
                      value={partFormData.part_name}
                      onChange={(e) => setPartFormData(prev => ({ ...prev, part_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-stone-300 dark:border-gray-600 rounded-lg font-cairo text-sm focus:outline-none focus:ring-2 focus:ring-brand-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      dir="rtl"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 dark:text-gray-300 mb-2 font-cairo">
                      نوع القطعة
                    </label>
                    <select
                      required
                      value={partFormData.part_type}
                      onChange={(e) => setPartFormData(prev => ({ ...prev, part_type: e.target.value }))}
                      className="w-full px-3 py-2 border border-stone-300 dark:border-gray-600 rounded-lg font-cairo text-sm focus:outline-none focus:ring-2 focus:ring-brand-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      dir="rtl"
                    >
                      <option value="motor">محرك</option>
                      <option value="component">مكون</option>
                      <option value="assembly">مجمع</option>
                      <option value="packaging">تغليف</option>
                      <option value="heating_element">عنصر تسخين</option>
                      <option value="coupon">قسيمة</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 dark:text-gray-300 mb-2 font-cairo">
                      الحد الأدنى للمخزون
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={partFormData.min_stock_level}
                      onChange={(e) => setPartFormData(prev => ({ ...prev, min_stock_level: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-stone-300 dark:border-gray-600 rounded-lg font-cairo text-sm focus:outline-none focus:ring-2 focus:ring-brand-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      dir="rtl"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 dark:text-gray-300 mb-2 font-cairo">
                      المخزون الحالي
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={partFormData.current_stock}
                      onChange={(e) => setPartFormData(prev => ({ ...prev, current_stock: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-stone-300 dark:border-gray-600 rounded-lg font-cairo text-sm focus:outline-none focus:ring-2 focus:ring-brand-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      dir="rtl"
                    />
                  </div>

                </div>

                <div className="flex items-center justify-end space-x-3 space-x-reverse mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreatePartModal(false)}
                    className="px-4 py-2 text-stone-600 dark:text-gray-300 hover:text-stone-800 dark:hover:text-white font-cairo text-sm font-medium transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="px-4 py-2 bg-accent-purple-500 hover:bg-accent-purple-600 disabled:bg-gray-400 text-white rounded-lg font-cairo text-sm font-medium transition-colors"
                  >
                    {isCreating ? 'جاري الإنشاء...' : 'إنشاء القطعة'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockManagementPage;


