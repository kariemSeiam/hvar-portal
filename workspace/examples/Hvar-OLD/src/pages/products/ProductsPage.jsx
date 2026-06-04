import React, { useState, useEffect } from 'react';
import { 
  Package, 
  BarChart2,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  Loader,
  Zap,
  Star,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  ChevronUp,
  XCircle
} from 'lucide-react';
import { Card, Button, StatusBadge, Input } from '../../components/ui';
import { api } from '../../services/api';

/**
 * Products Management Page - Refactored to use real API endpoints
 * Following the same themes, styles, and creativity as OrdersPage.jsx
 */
const ProductsPage = () => {
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('dashboard');
  const [filters, setFilters] = useState({});
  const [pagination, setPagination] = useState({
    currentPage: 1,
    limit: 20,
    total: 0,
    hasMore: true
  });

  // Main data state
  const [data, setData] = useState({
    products: [],
    categories: [],
    lowStockAlerts: [],
    analytics: {},
    stats: {
      totalProducts: 0,
      lowStockItems: 0,
      outOfStockItems: 0,
      totalValue: 0
    }
  });

  // Fetch products from API
  const fetchProducts = async (params = {}) => {
    try {
      setLoading(true);
      const response = await api.products.getProducts({
        limit: pagination.limit,
        page: pagination.currentPage,
        ...filters,
        ...params
      });
      
      if (response.success) {
        setData(prev => ({ ...prev, products: response.data }));
        setPagination(prev => ({
          ...prev,
          total: response.pagination?.total || 0,
          hasMore: response.pagination?.has_more || false
        }));
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories from API
  const fetchCategories = async () => {
    try {
      const response = await api.products.getCategories();
      if (response.success) {
        setData(prev => ({ ...prev, categories: response.data }));
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Fetch low stock alerts from API
  const fetchLowStockAlerts = async () => {
    try {
      const response = await api.products.getLowStockAlerts();
      if (response.success) {
        setData(prev => ({ ...prev, lowStockAlerts: response.data }));
      }
    } catch (error) {
      console.error('Error fetching low stock alerts:', error);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchLowStockAlerts();
  }, []);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    fetchProducts({ search: searchTerm.trim() });
  };

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Apply filters
  const applyFilters = () => {
    fetchProducts();
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
    fetchProducts();
  };

  // Quick filter presets
  const quickFilters = [
    { name: 'منخفض المخزون', action: 'low_stock', color: 'bg-red-100 text-red-800' },
    { name: 'نفذ المخزون', action: 'out_of_stock', color: 'bg-orange-100 text-orange-800' },
    { name: 'عالي القيمة', action: 'high_value', color: 'bg-green-100 text-green-800' },
    { name: 'تحليل النص', action: 'text_analytics', color: 'bg-blue-100 text-blue-800' }
  ];

  const applyQuickFilter = (quickFilter) => {
    if (quickFilter.action === 'low_stock') {
      fetchLowStockAlerts();
      setViewMode('alerts');
      return;
    }
    
    if (quickFilter.action === 'text_analytics') {
      setViewMode('analytics');
      return;
    }
    
    // Apply other filters
    fetchProducts({ [quickFilter.action]: true });
  };

  // Loading state
  if (loading && data.products.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">جاري تحميل بيانات المنتجات...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="w-full bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              إدارة المنتجات والمخزون
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              مركز إدارة المنتجات، المخزون، والتحليلات
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setViewMode('dashboard')}
              variant={viewMode === 'dashboard' ? 'default' : 'outline'}
              className="px-4 py-2"
            >
              <BarChart2 className="w-4 h-4 ml-2" />
              لوحة التحكم
            </Button>
            <Button
              onClick={() => setViewMode('products')}
              variant={viewMode === 'products' ? 'default' : 'outline'}
              className="px-4 py-2"
            >
              <Package className="w-4 h-4 ml-2" />
              المنتجات
            </Button>
            <Button
              onClick={() => setViewMode('alerts')}
              variant={viewMode === 'alerts' ? 'default' : 'outline'}
              className="px-4 py-2"
            >
              <AlertCircle className="w-4 h-4 ml-2" />
              التنبيهات
            </Button>
          </div>
        </div>
      </div>
      
      {/* Dashboard View */}
      {viewMode === 'dashboard' && (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Products */}
            <Card className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">إجمالي المنتجات</p>
                  <h3 className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
                    {data.stats.totalProducts}
                  </h3>
                </div>
                <div className="rounded-full p-2 bg-blue-100 dark:bg-blue-900/30">
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
            <Card className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">منخفض المخزون</p>
                  <h3 className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
                    {data.stats.lowStockItems}
                  </h3>
                </div>
                <div className="rounded-full p-2 bg-orange-100 dark:bg-orange-900/30">
                  <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
              <div className="mt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => setViewMode('alerts')}
                >
                  عرض التنبيهات
                </Button>
              </div>
            </Card>
            
            {/* Out of Stock */}
            <Card className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">نفذ المخزون</p>
                  <h3 className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
                    {data.stats.outOfStockItems}
                  </h3>
                </div>
                <div className="rounded-full p-2 bg-red-100 dark:bg-red-900/30">
                  <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <div className="mt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => {
                    setViewMode('products');
                    setFilters({ stock_status: 'out_of_stock' });
                    fetchProducts({ stock_status: 'out_of_stock' });
                  }}
                >
                  عرض النفاذ
                </Button>
              </div>
            </Card>
            
            {/* Total Value */}
            <Card className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">إجمالي القيمة</p>
                  <h3 className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
                    {data.stats.totalValue.toLocaleString()} ج.م
                  </h3>
                </div>
                <div className="rounded-full p-2 bg-green-100 dark:bg-green-900/30">
                  <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div className="mt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => setViewMode('analytics')}
                >
                  عرض التحليلات
                </Button>
              </div>
            </Card>
          </div>
          
          {/* Quick Actions */}
          <div className="w-full bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Zap className="w-5 h-5 ml-2 text-brand-red-500" />
                إجراءات سريعة
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center gap-2"
                onClick={() => setViewMode('products')}
              >
                <Plus className="w-6 h-6 text-brand-red-500" />
                <span>إضافة منتج جديد</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center gap-2"
                onClick={() => setViewMode('alerts')}
              >
                <AlertCircle className="w-6 h-6 text-orange-500" />
                <span>مراجعة التنبيهات</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center gap-2"
                onClick={() => setViewMode('analytics')}
              >
                <BarChart2 className="w-6 h-6 text-blue-500" />
                <span>تحليل النص</span>
              </Button>
            </div>
          </div>

          {/* Recent Products */}
          <div className="w-full bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Package className="w-5 h-5 ml-2 text-brand-red-500" />
                المنتجات الأخيرة
              </h3>
            </div>
            <div className="space-y-3">
              {data.products.slice(0, 5).map((product) => (
                <div key={product.product_id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {product.name_ar}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {product.sku} - {product.category}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      المخزون: {product.current_stock}
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {product.price} ج.م
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Products View */}
      {viewMode === 'products' && (
        <>
          {/* Search & Filters */}
          <div className="w-full bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
            {/* Search Bar */}
            <div className="w-full p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <form onSubmit={handleSearch} className="w-full flex items-center gap-3">
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="w-4 h-4 text-gray-400" />
                  </div>
                  <Input
                    placeholder="البحث في المنتجات (الاسم، SKU، الفئة...)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-brand-red-500 focus:border-transparent transition-all duration-200 rounded-lg"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                <Button 
                  type="submit" 
                  disabled={!searchTerm.trim()}
                  className="px-4 py-2.5 text-sm font-medium bg-brand-red-600 hover:bg-brand-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 rounded-lg"
                >
                  بحث
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-4 py-2.5 text-sm font-medium border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-all duration-200 rounded-lg"
                >
                  <Filter className="w-4 h-4 ml-2" />
                  فلاتر
                </Button>
              </form>
            </div>
            
            {/* Quick Filters */}
            <div className="w-full p-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                  <Zap className="w-4 h-4 ml-2 text-brand-red-500" />
                  فلاتر سريعة:
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {quickFilters.map((quickFilter, index) => (
                    <button
                      key={index}
                      onClick={() => applyQuickFilter(quickFilter)}
                      className={`
                        px-3 py-2 text-xs font-medium rounded-lg border transition-all duration-200 
                        hover:scale-105 hover:shadow-sm active:scale-95
                        ${quickFilter.color.includes('bg-red') 
                          ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30'
                          : quickFilter.color.includes('bg-orange')
                          ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/30'
                          : quickFilter.color.includes('bg-green')
                          ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30'
                          : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                        }
                      `}
                    >
                      {quickFilter.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Filters Panel */}
            {showFilters && (
              <div className="w-full p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
                <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                  {/* Category Filter */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      الفئة
                    </label>
                    <select
                      value={filters.category || ''}
                      onChange={(e) => handleFilterChange('category', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-red-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="">جميع الفئات</option>
                      {data.categories.map(category => (
                        <option key={category.category_id} value={category.name}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Stock Status Filter */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      حالة المخزون
                    </label>
                    <select
                      value={filters.stock_status || ''}
                      onChange={(e) => handleFilterChange('stock_status', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-red-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="">جميع الحالات</option>
                      <option value="in_stock">متوفر</option>
                      <option value="low_stock">منخفض</option>
                      <option value="out_of_stock">نفذ</option>
                    </select>
                  </div>

                  {/* Price Range Filter */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      نطاق السعر
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="من"
                        value={filters.price_min || ''}
                        onChange={(e) => handleFilterChange('price_min', e.target.value)}
                        className="flex-1 text-sm"
                      />
                      <Input
                        type="number"
                        placeholder="إلى"
                        value={filters.price_max || ''}
                        onChange={(e) => handleFilterChange('price_max', e.target.value)}
                        className="flex-1 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Filter Actions */}
                <div className="w-full flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    <span className="text-brand-red-600 dark:text-brand-red-400 font-semibold">{pagination.total.toLocaleString()}</span> نتيجة
                  </div>
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="outline" 
                      onClick={clearFilters} 
                      size="sm"
                      className="px-4 py-2 text-sm font-medium border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-all duration-200 rounded-lg"
                    >
                      مسح الفلاتر
                    </Button>
                    <Button 
                      onClick={applyFilters} 
                      size="sm"
                      className="px-6 py-2 text-sm font-medium bg-brand-red-600 hover:bg-brand-red-700 transition-all duration-200 rounded-lg"
                    >
                      تطبيق
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Products Display */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      المنتج
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      الفئة
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      المخزون
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      السعر
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                  {data.products.map((product) => (
                    <tr key={product.product_id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                            <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {product.name_ar}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {product.name_en}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {product.sku}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          product.current_stock === 0 
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                            : product.current_stock < (product.min_stock || 10)
                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
                            : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        }`}>
                          {product.current_stock}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {product.price} ج.م
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Alerts View */}
      {viewMode === 'alerts' && (
        <div className="w-full bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <AlertCircle className="w-5 h-5 ml-2 text-orange-500" />
              تنبيهات المخزون
            </h3>
            <Button className="bg-orange-600 hover:bg-orange-700">
              <RefreshCw className="w-4 h-4 ml-2" />
              تحديث التنبيهات
            </Button>
          </div>
          
          <div className="space-y-4">
            {data.lowStockAlerts.map((alert) => (
              <div key={alert.sku} className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                    <Package className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {alert.product_name} - {alert.sku}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      الكمية الحالية: {alert.current_stock} - الحد الأدنى: {alert.min_stock}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                    منخفض المخزون
                  </span>
                  <Button variant="outline" size="sm" className="border-orange-200 text-orange-600">
                    طلب
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics View */}
      {viewMode === 'analytics' && (
        <div className="w-full bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <BarChart2 className="w-5 h-5 ml-2 text-blue-500" />
              تحليل نص الطلبات
            </h3>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <RefreshCw className="w-4 h-4 ml-2" />
              تحديث التحليلات
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="p-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">تحليل الكلمات</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                تحليل الكلمات الأكثر استخداماً في أوصاف الطلبات
              </p>
            </Card>
            
            <Card className="p-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">تحليل الأنماط</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                اكتشاف الأنماط المتكررة في أوصاف المنتجات
              </p>
            </Card>
            
            <Card className="p-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">تحليل الفئات</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                تصنيف المنتجات بناءً على تحليل النص
              </p>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;