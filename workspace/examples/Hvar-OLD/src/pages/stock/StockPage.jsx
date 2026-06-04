import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, 
  Clock, 
  BarChart2,
  Bell,
  Calendar,
  Search,
  Filter,
  Plus,
  Eye,
  AlertCircle,
  CheckCircle,
  RotateCcw,
  XCircle,
  TrendingUp,
  TrendingDown,
  Zap,
  ChevronUp,
  ChevronRight,
  DollarSign,
  Database,
  RefreshCw,
  Edit,
  Trash2,
  PlusIcon,
  ArrowUp,
  ArrowDown,
  Activity,
  Archive,
  ShoppingCart,
  Warehouse,
  Settings,
  Download,
  Upload,
  PieChart
} from 'lucide-react';
import { Card, Button, StatusBadge, Input, EmptyState, Spinner } from '../../components/ui';
import { api } from '../../services/api';

/**
 * Expert Stock Management Page
 * Professional full-width design with enhanced performance and UX
 * Following HVAR Complete System architecture
 * 
 * @component StockPage
 * @description Comprehensive stock management with dashboard, products, categories, and analytics
 */
const StockPage = () => {
  // =================== STATE MANAGEMENT ===================
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('dashboard');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDir, setSortDir] = useState('DESC');
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [selectedCategory, setSelectedCategory] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [bulkAction, setBulkAction] = useState('');

  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    limit: 50,
    total: 0,
    hasMore: true
  });

  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    price_min: '',
    price_max: '',
    status: ''
  });

  // Main data state
  const [data, setData] = useState({
    products: [],
    categories: [],
    lowStockAlerts: [],
    maintenanceStockAlerts: [],
    stats: {
      totalProducts: 0,
      lowStockItems: 0,
      outOfStockItems: 0,
      totalValue: 0,
      categories: 0
    },
    maintenanceStockSummary: {
      total_skus: 0,
      total_stock: 0,
      low_stock_items: 0,
      out_of_stock_items: 0,
      total_stock_value: 0
    },
    recentActivity: [],
    topProducts: [
      // Mock data for top products
      { name: 'منتج 1', stock_level: 100, value: 5000 },
      { name: 'منتج 2', stock_level: 75, value: 3500 },
      { name: 'منتج 3', stock_level: 50, value: 2500 }
    ],
    stockMovements: [
      // Mock data for stock movements
      { type: 'in', product_name: 'منتج 1', quantity: 10, date: new Date() },
      { type: 'out', product_name: 'منتج 2', quantity: 5, date: new Date() },
      { type: 'in', product_name: 'منتج 3', quantity: 15, date: new Date() }
    ]
  });

  // Debounced search state
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Error handling state
  const [error, setError] = useState(null);

  // =================== API CALLS ===================

  // Fetch products using actual API endpoint with enhanced error handling
  const fetchProducts = useCallback(async (params = {}, shouldReset = true) => {
    try {
      if (shouldReset) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }
      
      const queryParams = {
        page: shouldReset ? 1 : pagination.currentPage + 1,
        limit: pagination.limit,
        sort_by: sortBy,
        sort_dir: sortDir,
        ...filters,
        ...params
      };

      // Remove empty params
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] === '' || queryParams[key] === null || queryParams[key] === undefined) {
          delete queryParams[key];
        }
      });

      const response = await api.products.getProducts(queryParams);
      
      if (response.success) {
        if (shouldReset) {
          setData(prev => ({ ...prev, products: response.data || [] }));
          setPagination(prev => ({ 
            ...prev, 
            currentPage: 1,
            total: response.pagination?.total || 0,
            hasMore: response.pagination?.hasMore || false 
          }));
        } else {
          setData(prev => ({ 
            ...prev, 
            products: [...prev.products, ...(response.data || [])] 
          }));
          setPagination(prev => ({ 
            ...prev, 
            currentPage: prev.currentPage + 1,
            hasMore: response.pagination?.hasMore || false 
          }));
        }

        // Update stats from products data
        if (response.data) {
          const totalProducts = response.pagination?.total || response.data.length;
          const lowStockItems = response.data.filter(p => p.stock_level <= (p.min_stock || 5)).length;
          const outOfStockItems = response.data.filter(p => p.stock_level === 0).length;
          const totalValue = response.data.reduce((sum, p) => sum + (p.price * p.stock_level || 0), 0);

          setData(prev => ({
            ...prev,
            stats: {
              ...prev.stats,
              totalProducts,
              lowStockItems,
              outOfStockItems,
              totalValue
            }
          }));
        }
      } else {
        throw new Error(response.error || 'Failed to fetch products');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to fetch products: ' + (error.message || 'Unknown error'));
      // Set empty products array on error to prevent crashes
      setData(prev => ({ ...prev, products: [] }));
      setPagination(prev => ({ 
        ...prev, 
        currentPage: 1,
        total: 0,
        hasMore: false 
      }));
    } finally {
      if (shouldReset) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  }, [filters, pagination.currentPage, pagination.limit, sortBy, sortDir]);

  // Fetch categories using actual API endpoint
  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.products.getCategories();
      if (response.success) {
        setData(prev => ({ 
          ...prev, 
          categories: response.data || [] 
        }));
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Set empty array on error to prevent crashes
      setData(prev => ({ 
        ...prev, 
        categories: [] 
      }));
    }
  }, []);

  // Fetch low stock alerts using actual API endpoint
  const fetchLowStockAlerts = useCallback(async () => {
    try {
      const response = await api.products.getLowStockAlerts();
      if (response.success) {
        setData(prev => ({ 
          ...prev, 
          lowStockAlerts: response.data || [] 
        }));
      }
    } catch (error) {
      console.error('Error fetching low stock alerts:', error);
      // Set empty array on error to prevent crashes
      setData(prev => ({ 
        ...prev, 
        lowStockAlerts: [] 
      }));
    }
  }, []);

  // Fetch maintenance stock alerts using actual API endpoint
  const fetchMaintenanceStockAlerts = useCallback(async () => {
    try {
      const response = await api.maintenance.getStockAlerts();
      if (response.success) {
        setData(prev => ({ 
          ...prev, 
          maintenanceStockAlerts: response.data || [] 
        }));
      }
    } catch (error) {
      console.error('Error fetching maintenance stock alerts:', error);
      // Set empty array on error to prevent crashes
      setData(prev => ({ 
        ...prev, 
        maintenanceStockAlerts: [] 
      }));
    }
  }, []);

  // Fetch maintenance stock summary using actual API endpoint
  const fetchMaintenanceStockSummary = useCallback(async () => {
    try {
      const response = await api.maintenance.getStockSummary();
      if (response.success) {
        setData(prev => ({ 
          ...prev, 
          maintenanceStockSummary: response.data || {
            total_skus: 0,
            total_stock: 0,
            low_stock_items: 0,
            out_of_stock_items: 0,
            total_stock_value: 0
          }
        }));
      }
    } catch (error) {
      console.error('Error fetching maintenance stock summary:', error);
      // Set default values on error to prevent crashes
      setData(prev => ({ 
        ...prev, 
        maintenanceStockSummary: {
          total_skus: 0,
          total_stock: 0,
          low_stock_items: 0,
          out_of_stock_items: 0,
          total_stock_value: 0
        }
      }));
    }
  }, []);

  // Fetch product details
  const fetchProductDetails = useCallback(async (productId) => {
    try {
      const response = await api.products.getProduct(productId);
      if (response.success) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Error fetching product details:', error);
      // Return null on error to prevent crashes
      return null;
    }
  }, []);

  // =================== EFFECTS ===================

  // Initial data fetch
  useEffect(() => {
    const initializeData = async () => {
      try {
        await Promise.all([
          fetchProducts(),
          fetchCategories(),
          fetchLowStockAlerts(),
          fetchMaintenanceStockAlerts(),
          fetchMaintenanceStockSummary()
        ]);
      } catch (error) {
        console.error('Error initializing data:', error);
        setError('Failed to initialize application data');
      }
    };
    initializeData();
  }, []);
  
  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Auto search when debounced term changes
  useEffect(() => {
    if (debouncedSearchTerm !== filters.search) {
      setFilters(prev => ({ ...prev, search: debouncedSearchTerm }));
    }
  }, [debouncedSearchTerm, filters.search]);

  // Refetch when filters change
  useEffect(() => {
    if (Object.values(filters).some(value => value !== '')) {
      fetchProducts({}, true);
    }
  }, [filters, fetchProducts]);

  // =================== HANDLERS ===================

  // Handle search
  const handleSearch = useCallback((e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setFilters(prev => ({ ...prev, search: searchTerm.trim() }));
    }
  }, [searchTerm]);

  // Handle filter change
  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      category: '',
      price_min: '',
      price_max: '',
      status: ''
    });
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedItems(new Set());
    fetchProducts({}, true);
  }, [fetchProducts]);

  // Toggle item expansion
  const toggleItemExpansion = useCallback(async (productId) => {
    const newExpandedItems = new Set(expandedItems);
    
    if (newExpandedItems.has(productId)) {
      newExpandedItems.delete(productId);
    } else {
      newExpandedItems.add(productId);
      // Fetch detailed product info
      const details = await fetchProductDetails(productId);
      if (details) {
        setData(prev => ({
          ...prev,
          products: prev.products.map(p => 
            p.product_id === productId ? { ...p, ...details } : p
          )
        }));
      }
    }
    
    setExpandedItems(newExpandedItems);
  }, [expandedItems, fetchProductDetails]);

  // Toggle item selection
  const toggleItemSelection = useCallback((productId) => {
    const newSelectedItems = new Set(selectedItems);
    if (newSelectedItems.has(productId)) {
      newSelectedItems.delete(productId);
    } else {
      newSelectedItems.add(productId);
    }
    setSelectedItems(newSelectedItems);
  }, [selectedItems]);

  // Select all items
  const selectAllItems = useCallback(() => {
    if (selectedItems.size === data.products.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(data.products.map(p => p.product_id)));
    }
  }, [selectedItems.size, data.products]);

  // Refresh all data
  const refreshAllData = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchProducts({}, true),
        fetchCategories(),
        fetchLowStockAlerts(),
        fetchMaintenanceStockAlerts(),
        fetchMaintenanceStockSummary()
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [fetchProducts, fetchCategories, fetchLowStockAlerts, fetchMaintenanceStockAlerts, fetchMaintenanceStockSummary]);

  // =================== UTILITY FUNCTIONS ===================

  // Get stock status badge style
  const getStockStatusBadgeStyle = useCallback((stockLevel, minStock = 5) => {
    if (stockLevel === 0) return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    if (stockLevel <= minStock) return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
    if (stockLevel <= minStock * 2) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
  }, []);

  // Get stock status text
  const getStockStatusText = useCallback((stockLevel, minStock = 5) => {
    if (stockLevel === 0) return 'نفذ المخزون';
    if (stockLevel <= minStock) return 'منخفض جداً';
    if (stockLevel <= minStock * 2) return 'منخفض';
    return 'متوفر';
  }, []);

  // Quick filters with enhanced actions
  const quickFilters = useMemo(() => [
    { 
      name: 'منخفض المخزون', 
      action: () => setViewMode('alerts'),
      color: 'bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:hover:bg-orange-900/30',
      icon: AlertCircle,
      count: data.stats.lowStockItems
    },
    { 
      name: 'نفذ المخزون', 
      action: () => {
        setFilters(prev => ({ ...prev, status: 'out_of_stock' }));
        setViewMode('products');
      },
      color: 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30',
      icon: XCircle,
      count: data.stats.outOfStockItems
    },
    { 
      name: 'مخزون جيد', 
      action: () => {
        setFilters(prev => ({ ...prev, status: 'good_stock' }));
        setViewMode('products');
      },
      color: 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30',
      icon: CheckCircle,
      count: data.stats.totalProducts - data.stats.lowStockItems - data.stats.outOfStockItems
    },
    { 
      name: 'مخزون الصيانة', 
      action: () => setViewMode('maintenance'),
      color: 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30',
      icon: Activity,
      count: data.maintenanceStockSummary.total_skus
    },
    { 
      name: 'إدارة الفئات', 
      action: () => setViewMode('categories'),
      color: 'bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-800 dark:text-purple-400 dark:hover:bg-purple-900/30',
      icon: Database,
      count: data.stats.categories
    },
    { 
      name: 'توسيع الكل', 
      action: () => {
        const allProductIds = data.products.map(p => p.product_id);
        setExpandedItems(new Set(allProductIds));
      },
      color: 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700',
      icon: ArrowDown
    }
  ], [data.stats, data.products, data.maintenanceStockSummary.total_skus]);

  // =================== RENDER HELPERS ===================

  // Loading state
  if (loading && data.products.length === 0) {
    return (
      <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-200 dark:border-gray-700">
            <Spinner className="w-12 h-12 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 font-medium">جاري تحميل بيانات المخزون...</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">يرجى الانتظار</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-red-200 dark:border-red-800">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 dark:text-red-400 font-medium mb-2">حدث خطأ في تحميل البيانات</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} className="bg-red-600 hover:bg-red-700">
              إعادة المحاولة
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-none mx-auto p-4 space-y-6">
        
        {/* Enhanced Header */}
        <div className="w-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-brand-red-500 to-brand-red-600 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    إدارة المخزون والمنتجات
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    مركز إدارة المنتجات، المخزون، والتحليلات المتكامل
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Bulk Actions */}
                {selectedItems.size > 0 && (
                  <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg border border-blue-200 dark:border-blue-800">
                    <span className="text-sm text-blue-700 dark:text-blue-300">
                      {selectedItems.size} منتج محدد
                    </span>
                    <select
                      value={bulkAction}
                      onChange={(e) => setBulkAction(e.target.value)}
                      className="text-sm border border-blue-300 dark:border-blue-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-300"
                    >
                      <option value="">إجراء جماعي...</option>
                      <option value="export">تصدير</option>
                      <option value="delete">حذف</option>
                      <option value="update_status">تحديث الحالة</option>
                    </select>
                    <Button
                      size="sm"
                      onClick={() => {/* Handle bulk action */}}
                      disabled={!bulkAction}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      تطبيق
                    </Button>
                  </div>
                )}

                <Button
                  onClick={refreshAllData}
                  disabled={refreshing}
                  variant="outline"
                  className="px-4 py-2"
                >
                  <RefreshCw className={`w-4 h-4 ml-2 ${refreshing ? 'animate-spin' : ''}`} />
                  تحديث
                </Button>
                
                {/* View Mode Toggle */}
                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('dashboard')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                      viewMode === 'dashboard'
                        ? 'bg-white dark:bg-gray-600 text-brand-red-600 dark:text-brand-red-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    <BarChart2 className="w-4 h-4 ml-2" />
                    لوحة التحكم
                  </button>
                  <button
                    onClick={() => setViewMode('products')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                      viewMode === 'products'
                        ? 'bg-white dark:bg-gray-600 text-brand-red-600 dark:text-brand-red-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    <Package className="w-4 h-4 ml-2" />
                    المنتجات
                  </button>
                  <button
                    onClick={() => setViewMode('categories')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                      viewMode === 'categories'
                        ? 'bg-white dark:bg-gray-600 text-brand-red-600 dark:text-brand-red-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    <Database className="w-4 h-4 ml-2" />
                    الفئات
                  </button>
                  <button
                    onClick={() => setViewMode('analytics')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                      viewMode === 'analytics'
                        ? 'bg-white dark:bg-gray-600 text-brand-red-600 dark:text-brand-red-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4 ml-2" />
                    التحليلات
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      
        {/* Dashboard View */}
        {viewMode === 'dashboard' && (
          <>
            {/* Enhanced Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Products */}
              <Card className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">إجمالي المنتجات</p>
                    <h3 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                      {data.stats.totalProducts.toLocaleString()}
                    </h3>
                    <div className="mt-2 flex items-center text-sm">
                      <TrendingUp className="w-4 h-4 text-green-500 ml-1" />
                      <span className="text-green-600 dark:text-green-400">نشط</span>
                    </div>
                  </div>
                  <div className="rounded-full p-3 bg-blue-100 dark:bg-blue-900/30">
                    <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="mt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => setViewMode('products')}
                  >
                    عرض المنتجات
                  </Button>
                </div>
              </Card>
              
              {/* Low Stock Items */}
              <Card className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">منخفض المخزون</p>
                    <h3 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                      {data.stats.lowStockItems.toLocaleString()}
                    </h3>
                    <div className="mt-2 flex items-center text-sm">
                      <AlertCircle className="w-4 h-4 text-orange-500 ml-1" />
                      <span className="text-orange-600 dark:text-orange-400">يحتاج انتباه</span>
                    </div>
                  </div>
                  <div className="rounded-full p-3 bg-orange-100 dark:bg-orange-900/30">
                    <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
                <div className="mt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full border-orange-200 text-orange-600 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-900/20"
                    onClick={() => setViewMode('alerts')}
                  >
                    عرض التنبيهات
                  </Button>
                </div>
              </Card>
              
              {/* Out of Stock */}
              <Card className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">نفذ المخزون</p>
                    <h3 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                      {data.stats.outOfStockItems.toLocaleString()}
                    </h3>
                    <div className="mt-2 flex items-center text-sm">
                      <XCircle className="w-4 h-4 text-red-500 ml-1" />
                      <span className="text-red-600 dark:text-red-400">عاجل</span>
                    </div>
                  </div>
                  <div className="rounded-full p-3 bg-red-100 dark:bg-red-900/30">
                    <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                </div>
                <div className="mt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                    onClick={() => {
                      setFilters(prev => ({ ...prev, status: 'out_of_stock' }));
                      setViewMode('products');
                    }}
                  >
                    عرض النفاذ
                  </Button>
                </div>
              </Card>
              
              {/* Total Value */}
              <Card className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">إجمالي القيمة</p>
                    <h3 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                      {data.stats.totalValue.toLocaleString()} ج.م
                    </h3>
                    <div className="mt-2 flex items-center text-sm">
                      <TrendingUp className="w-4 h-4 text-green-500 ml-1" />
                      <span className="text-green-600 dark:text-green-400">قيمة استثمارية</span>
                    </div>
                  </div>
                  <div className="rounded-full p-3 bg-green-100 dark:bg-green-900/30">
                    <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div className="mt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full border-green-200 text-green-600 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/20"
                    onClick={() => setViewMode('analytics')}
                  >
                    تفاصيل أكثر
                  </Button>
                </div>
              </Card>
            </div>

            {/* Enhanced Maintenance Stock Summary */}
            <div className="w-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                    <Activity className="w-5 h-5 ml-2 text-blue-500" />
                    مخزون قطع الصيانة
                  </h3>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewMode('maintenance')}
                    >
                      عرض التفاصيل
                    </Button>
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Settings className="w-4 h-4 ml-2" />
                      إعدادات
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Database className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">إجمالي الأصناف</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {data.maintenanceStockSummary.total_skus}
                    </p>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Package className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">إجمالي المخزون</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {data.maintenanceStockSummary.total_stock}
                    </p>
                  </div>
                  
                  <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <p className="text-sm text-orange-600 dark:text-orange-400 mb-1">منخفض المخزون</p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {data.maintenanceStockSummary.low_stock_items}
                    </p>
                  </div>
                  
                  <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                    <p className="text-sm text-red-600 dark:text-red-400 mb-1">نفذ المخزون</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {data.maintenanceStockSummary.out_of_stock_items}
                    </p>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <p className="text-sm text-green-600 dark:text-green-400 mb-1">القيمة الإجمالية</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {data.maintenanceStockSummary.total_stock_value.toLocaleString()} ج.م
                    </p>
                  </div>
                </div>
              </div>
            </div>
          
            {/* Enhanced Quick Actions */}
            <div className="w-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                    <Zap className="w-5 h-5 ml-2 text-brand-red-500" />
                    إجراءات سريعة
                  </h3>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 ml-2" />
                      تصدير
                    </Button>
                    <Button variant="outline" size="sm">
                      <Upload className="w-4 h-4 ml-2" />
                      استيراد
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                  {quickFilters.map((filter, index) => {
                    const IconComponent = filter.icon;
                    return (
                      <button
                        key={index}
                        onClick={filter.action}
                        className={`
                          h-24 flex flex-col items-center justify-center gap-2 rounded-lg border transition-all duration-200 
                          hover:scale-105 hover:shadow-sm active:scale-95 ${filter.color}
                        `}
                      >
                        <IconComponent className="w-5 h-5" />
                        <span className="text-xs font-medium">{filter.name}</span>
                        {filter.count !== undefined && (
                          <span className="text-xs bg-white/50 dark:bg-black/20 px-2 py-1 rounded-full">
                            {filter.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Enhanced Recent Activity */}
            <div className="w-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                    <Clock className="w-5 h-5 ml-2 text-brand-red-500" />
                    النشاط الأخير
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewMode('products')}
                  >
                    عرض الكل
                  </Button>
                </div>
                <div className="space-y-3">
                  {data.products.slice(0, 5).map((product) => (
                    <div key={product.product_id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-sm transition-shadow duration-200">
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${
                          product.stock_level === 0 ? 'bg-red-500' :
                          product.stock_level <= (product.min_stock || 5) ? 'bg-orange-500' : 'bg-green-500'
                        }`}></div>
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {product.name_ar || product.name_en || 'منتج غير محدد'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {product.sku ? `SKU: ${product.sku}` : ''} - {product.stock_level || 0} وحدة
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStockStatusBadgeStyle(product.stock_level, product.min_stock)}`}>
                          {getStockStatusText(product.stock_level, product.min_stock)}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {product.price ? `${product.price} ج.م` : ''}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Analytics View */}
        {viewMode === 'analytics' && (
          <div className="w-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <TrendingUp className="w-5 h-5 ml-2 text-brand-red-500" />
                  تحليلات المخزون
                </h3>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 ml-2" />
                    تصدير التقرير
                  </Button>
                  <Button variant="outline" size="sm">
                    <Calendar className="w-4 h-4 ml-2" />
                    تحديد الفترة
                  </Button>
                </div>
              </div>
              
              {/* Analytics Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Stock Value Trend */}
                <div className="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">تطور قيمة المخزون</h4>
                  <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                    <div className="text-center">
                      <BarChart2 className="w-16 h-16 mx-auto mb-2 opacity-50" />
                      <p>رسم بياني لقيمة المخزون</p>
                    </div>
                  </div>
                </div>
                
                {/* Category Distribution */}
                <div className="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">توزيع الفئات</h4>
                  <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                    <div className="text-center">
                      <PieChart className="w-16 h-16 mx-auto mb-2 opacity-50" />
                      <p>رسم بياني دائري للفئات</p>
                    </div>
                  </div>
                </div>
                
                {/* Stock Movement */}
                <div className="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">حركة المخزون</h4>
                  <div className="space-y-3">
                    {data.stockMovements.slice(0, 5).map((movement, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            movement.type === 'in' ? 'bg-green-500' : 'bg-red-500'
                          }`}></div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {movement.product_name || 'منتج غير محدد'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {movement.type === 'in' ? 'وارد' : 'صادر'} - {movement.quantity} وحدة
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {movement.date ? new Date(movement.date).toLocaleDateString('ar-EG') : 'غير محدد'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Top Products */}
                <div className="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">أفضل المنتجات</h4>
                  <div className="space-y-3">
                    {data.topProducts.slice(0, 5).map((product, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                            <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {product.name || 'منتج غير محدد'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {product.stock_level || 0} وحدة متوفرة
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {product.value ? `${product.value.toLocaleString()} ج.م` : 'غير محدد'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Products View with Bulk Selection */}
        {viewMode === 'products' && (
          <>
            {/* Search & Filters */}
            <div className="w-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden mb-6">
              {/* Search Bar */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <form onSubmit={handleSearch} className="flex items-center gap-4">
                  <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="w-5 h-5 text-gray-400" />
                    </div>
                    <Input
                      placeholder="البحث في المنتجات (اسم المنتج، SKU، الوصف...)"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-brand-red-500 focus:border-transparent transition-all duration-200 rounded-lg"
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={() => setSearchTerm('')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  
                  <Button 
                    type="submit" 
                    disabled={!searchTerm.trim()}
                    className="px-6 py-3 text-sm font-medium bg-brand-red-600 hover:bg-brand-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 rounded-lg"
                  >
                    <Search className="w-4 h-4 ml-2" />
                    بحث
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className={`
                      px-6 py-3 text-sm font-medium border transition-all duration-200 rounded-lg relative
                    ${showFilters 
                      ? 'bg-brand-red-50 dark:bg-brand-red-900/20 text-brand-red-600 dark:text-brand-red-400 border-brand-red-200 dark:border-brand-red-800' 
                        : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }
                  `}
                  >
                    <Filter className="w-4 h-4 ml-2" />
                    فلاتر متقدمة
                    {Object.values(filters).some(value => value !== '') && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-pulse"></span>
                    )}
                  </Button>
                </form>
              </div>
              
              {/* Quick Filters */}
              <div className="p-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                    <Zap className="w-4 h-4 ml-2 text-brand-red-500" />
                    فلاتر سريعة:
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {quickFilters.slice(0, 4).map((quickFilter, index) => {
                      const IconComponent = quickFilter.icon;
                      return (
                        <button
                          key={index}
                          onClick={quickFilter.action}
                          className={`
                            px-4 py-2 text-xs font-medium rounded-lg border transition-all duration-200 
                            hover:scale-105 hover:shadow-sm active:scale-95 flex items-center gap-2
                            ${quickFilter.color}
                          `}
                        >
                          <IconComponent className="w-3 h-3" />
                          {quickFilter.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              {/* Advanced Filters Panel */}
              {showFilters && (
                <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {/* Category Filter */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                        <Database className="w-4 h-4 ml-2 text-brand-red-500" />
                        الفئة
                      </label>
                      <select
                        value={filters.category}
                        onChange={(e) => handleFilterChange('category', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-red-500 focus:border-transparent transition-all duration-200"
                      >
                        <option value="">جميع الفئات</option>
                        {data.categories.map((category, index) => (
                          <option key={category.category_id || index} value={category.name || category.category}>
                            {category.name || category.category} {category.product_count ? `(${category.product_count})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Status Filter */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                        <AlertCircle className="w-4 h-4 ml-2 text-brand-red-500" />
                        حالة المخزون
                      </label>
                      <select
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-red-500 focus:border-transparent transition-all duration-200"
                      >
                        <option value="">جميع الحالات</option>
                        <option value="good_stock">مخزون جيد</option>
                        <option value="low_stock">منخفض المخزون</option>
                        <option value="out_of_stock">نفذ المخزون</option>
                      </select>
                    </div>

                    {/* Price Min Filter */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                        <DollarSign className="w-4 h-4 ml-2 text-brand-red-500" />
                        السعر من
                      </label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={filters.price_min}
                        onChange={(e) => handleFilterChange('price_min', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-brand-red-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>

                    {/* Price Max Filter */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                        <DollarSign className="w-4 h-4 ml-2 text-brand-red-500" />
                        السعر إلى
                      </label>
                      <Input
                        type="number"
                        placeholder="10000"
                        value={filters.price_max}
                        onChange={(e) => handleFilterChange('price_max', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-brand-red-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                  </div>

                  {/* Filter Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-4">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        <span className="text-brand-red-600 dark:text-brand-red-400 font-semibold">{pagination.total.toLocaleString()}</span> نتيجة
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button 
                        variant="outline" 
                        onClick={clearFilters} 
                        size="sm"
                        className="px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-all duration-200 rounded-lg"
                      >
                        مسح الفلاتر
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Products Display with Enhanced Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectedItems.size === data.products.length && data.products.length > 0}
                          onChange={selectAllItems}
                          className="rounded border-gray-300 text-brand-red-600 focus:ring-brand-red-500"
                        />
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        المنتج
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        SKU
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        المخزون
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        السعر
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        الفئة
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        الإجراءات
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {data.products.map((product) => (
                      <React.Fragment key={product.product_id}>
                        <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors duration-200">
                          <td className="px-6 py-4 text-center">
                            <input
                              type="checkbox"
                              checked={selectedItems.has(product.product_id)}
                              onChange={() => toggleItemSelection(product.product_id)}
                              className="rounded border-gray-300 text-brand-red-600 focus:ring-brand-red-500"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg flex items-center justify-center">
                                <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {product.name_ar || product.name_en || 'منتج غير محدد'}
                                </div>
                                {product.name_en && product.name_ar && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {product.name_en}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-mono text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                              {product.sku || 'غير محدد'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStockStatusBadgeStyle(product.stock_level, product.min_stock)}`}>
                                {product.stock_level || 0}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {getStockStatusText(product.stock_level, product.min_stock)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {product.price ? `${product.price.toLocaleString()} ج.م` : 'غير محدد'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                              {product.category || 'غير محدد'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleItemExpansion(product.product_id)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                                title={expandedItems.has(product.product_id) ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
                              >
                                {expandedItems.has(product.product_id) ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                                title="عرض"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                                title="تحرير"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg transition-colors duration-200"
                                title="حذف"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                        
                        {/* Expanded Details Row */}
                        {expandedItems.has(product.product_id) && (
                          <tr className="bg-gray-50 dark:bg-gray-700/30">
                            <td colSpan="7" className="px-6 py-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="space-y-3">
                                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">معلومات أساسية</h4>
                                  <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-500 dark:text-gray-400">رقم المنتج:</span>
                                      <span className="text-gray-900 dark:text-white">{product.product_id}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-500 dark:text-gray-400">الحد الأدنى:</span>
                                      <span className="text-gray-900 dark:text-white">{product.min_stock || 5}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-500 dark:text-gray-400">الوحدة:</span>
                                      <span className="text-gray-900 dark:text-white">{product.unit || 'قطعة'}</span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="space-y-3">
                                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">معلومات مالية</h4>
                                  <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-500 dark:text-gray-400">سعر الشراء:</span>
                                      <span className="text-gray-900 dark:text-white">
                                        {product.purchase_price ? `${product.purchase_price.toLocaleString()} ج.م` : 'غير محدد'}
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-500 dark:text-gray-400">القيمة الإجمالية:</span>
                                      <span className="text-gray-900 dark:text-white">
                                        {product.price && product.stock_level 
                                          ? `${(product.price * product.stock_level).toLocaleString()} ج.م` 
                                          : 'غير محدد'
                                        }
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="space-y-3">
                                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">تواريخ هامة</h4>
                                  <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-500 dark:text-gray-400">تاريخ الإنشاء:</span>
                                      <span className="text-gray-900 dark:text-white">
                                        {product.created_at 
                                          ? new Date(product.created_at).toLocaleDateString('ar-EG')
                                          : 'غير محدد'
                                        }
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-500 dark:text-gray-400">آخر تحديث:</span>
                                      <span className="text-gray-900 dark:text-white">
                                        {product.updated_at 
                                          ? new Date(product.updated_at).toLocaleDateString('ar-EG')
                                          : 'غير محدد'
                                        }
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {product.description && (
                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">الوصف</h4>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">{product.description}</p>
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Load More Button */}
              {pagination.hasMore && (
                <div className="p-6 border-t border-gray-200 dark:border-gray-700 text-center">
                  <Button
                    onClick={() => fetchProducts({}, false)}
                    disabled={loadingMore}
                    variant="outline"
                    className="px-8 py-3"
                  >
                    {loadingMore ? (
                      <>
                        <Spinner className="w-4 h-4 ml-2" />
                        جاري التحميل...
                      </>
                    ) : (
                      <>
                        <ArrowDown className="w-4 h-4 ml-2" />
                        تحميل المزيد ({pagination.total - data.products.length} متبقي)
                      </>
                    )}
                  </Button>
                </div>
              )}
              
              {/* Enhanced Empty State */}
              {data.products.length === 0 && !loading && (
                <EmptyState
                  icon={Package}
                  title="لا توجد منتجات"
                  description={
                    Object.values(filters).some(value => value !== '') 
                      ? 'لم يتم العثور على منتجات تطابق معايير البحث'
                      : 'لم يتم إضافة أي منتجات بعد'
                  }
                  variant={Object.values(filters).some(value => value !== '') ? "search" : "create"}
                />
              )}
            </div>
          </>
        )}

        {/* Categories View */}
        {viewMode === 'categories' && (
          <div className="w-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <Database className="w-5 h-5 ml-2 text-blue-500" />
                  إدارة فئات المنتجات
                </h3>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <PlusIcon className="w-4 h-4 ml-2" />
                  إضافة فئة جديدة
                </Button>
              </div>
              
              {data.categories.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {data.categories.map((category, index) => (
                    <Card key={category.category_id || index} className="p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                            <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                              {category.name || category.category || 'فئة غير محددة'}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {category.product_count || 0} منتج
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {category.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{category.description}</p>
                      )}
                      
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-600">
                        <span>
                          تم الإنشاء: {category.created_at 
                            ? new Date(category.created_at).toLocaleDateString('ar-EG') 
                            : 'غير محدد'
                          }
                        </span>
                        {category.updated_at && (
                          <span>
                            آخر تحديث: {new Date(category.updated_at).toLocaleDateString('ar-EG')}
                          </span>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">لا توجد فئات</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    لم يتم إنشاء أي فئات للمنتجات بعد
                  </p>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <PlusIcon className="w-4 h-4 ml-2" />
                    إضافة فئة جديدة
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Alerts View */}
        {viewMode === 'alerts' && (
          <div className="w-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <AlertCircle className="w-5 h-5 ml-2 text-orange-500" />
                  تنبيهات المخزون
                </h3>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchLowStockAlerts}
                  >
                    <RefreshCw className="w-4 h-4 ml-2" />
                    تحديث
                  </Button>
                  <Button className="bg-orange-600 hover:bg-orange-700">
                    <Bell className="w-4 h-4 ml-2" />
                    إعدادات التنبيهات
                  </Button>
                </div>
              </div>
              
              {data.lowStockAlerts.length > 0 || data.maintenanceStockAlerts.length > 0 ? (
                <div className="space-y-4">
                  {/* Product Stock Alerts */}
                  {data.lowStockAlerts.map((alert, index) => (
                    <div key={`product-${alert.sku || index}`} className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                          <Package className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {alert.product_name || alert.name_ar || 'منتج غير محدد'} - {alert.sku}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                                  الكمية الحالية: {alert.current_stock || alert.stock_level} - الحد الأدنى: {alert.min_stock || 5}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                          منخفض المخزون
                        </span>
                        <Button variant="outline" size="sm" className="border-orange-200 text-orange-600 hover:bg-orange-100 dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-900/30">
                          <ShoppingCart className="w-4 h-4 ml-2" />
                          طلب
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {/* Maintenance Stock Alerts */}
                  {data.maintenanceStockAlerts.map((alert, index) => (
                    <div key={`maintenance-${alert.sku || index}`} className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                          <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {alert.product_name || alert.name_ar || 'قطعة صيانة'} - {alert.sku}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                                  مخزون الصيانة - الكمية: {alert.current_quantity || alert.stock_level} - مطلوب: {alert.recommended_level || alert.min_stock}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                          مخزون صيانة
                        </span>
                        <Button variant="outline" size="sm" className="border-blue-200 text-blue-600 hover:bg-blue-100 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/30">
                          <Archive className="w-4 h-4 ml-2" />
                          تخصيص
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">لا توجد تنبيهات</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    جميع المنتجات لديها مخزون كافي
                  </p>
                  <Button variant="outline" onClick={fetchLowStockAlerts}>
                    <RefreshCw className="w-4 h-4 ml-2" />
                    إعادة فحص
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Maintenance View */}
        {viewMode === 'maintenance' && (
          <div className="w-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <Activity className="w-5 h-5 ml-2 text-blue-500" />
                  مخزون قطع الصيانة
                </h3>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchMaintenanceStockSummary}
                  >
                    <RefreshCw className="w-4 h-4 ml-2" />
                    تحديث
                  </Button>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Warehouse className="w-4 h-4 ml-2" />
                    إدارة المخزون
                  </Button>
                </div>
              </div>
              
              {/* Maintenance Stock Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                <div className="text-center p-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Database className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">إجمالي الأصناف</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {data.maintenanceStockSummary.total_skus}
                  </p>
                </div>
                
                <div className="text-center p-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Package className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">إجمالي المخزون</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {data.maintenanceStockSummary.total_stock}
                  </p>
                </div>
                
                <div className="text-center p-6 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <p className="text-sm text-orange-600 dark:text-orange-400 mb-1">منخفض المخزون</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {data.maintenanceStockSummary.low_stock_items}
                  </p>
                </div>
                
                <div className="text-center p-6 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <p className="text-sm text-red-600 dark:text-red-400 mb-1">نفذ المخزون</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {data.maintenanceStockSummary.out_of_stock_items}
                  </p>
                </div>
                
                <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-sm text-green-600 dark:text-green-400 mb-1">القيمة الإجمالية</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {data.maintenanceStockSummary.total_stock_value.toLocaleString()} ج.م
                  </p>
                </div>
              </div>
              
              {/* Maintenance Stock Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Button 
                  variant="outline" 
                  className="h-24 flex flex-col items-center justify-center gap-2 border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-900/20"
                  onClick={() => setViewMode('alerts')}
                >
                  <Bell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  <span className="font-medium">عرض التنبيهات</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-24 flex flex-col items-center justify-center gap-2 border-green-200 hover:bg-green-50 dark:border-green-800 dark:hover:bg-green-900/20"
                >
                  <Archive className="w-6 h-6 text-green-600 dark:text-green-400" />
                  <span className="font-medium">تخصيص قطع</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-24 flex flex-col items-center justify-center gap-2 border-purple-200 hover:bg-purple-50 dark:border-purple-800 dark:hover:bg-purple-900/20"
                >
                  <BarChart2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  <span className="font-medium">تقارير الاستهلاك</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockPage; 