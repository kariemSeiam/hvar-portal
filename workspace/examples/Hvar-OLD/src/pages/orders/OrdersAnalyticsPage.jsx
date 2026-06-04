import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  BarChart2, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  DollarSign, 
  Package, 
  AlertCircle, 
  Truck, 
  RefreshCw, 
  Filter,
  Download,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  PieChart,
  LineChart,
  Clock,
  Zap,
  CheckCircle,
  XCircle,
  RotateCcw,
  Users,
  Search
} from 'lucide-react';
import { Card, Button, Badge, Input } from '../../components/ui';
import { api } from '../../services/api';
import { useOrders } from '../../context/OrdersContext';

/**
 * OrdersAnalyticsPage - Modern analytics dashboard for orders
 * Visualizes comprehensive order data with interactive charts and filters
 */
const OrdersAnalyticsPage = () => {
  const { updateOrdersData } = useOrders();
  
  // Main analytics data state
  const [analyticsData, setAnalyticsData] = useState({
    overall_metrics: {},
    state_distribution: { states: [], total_orders: 0 },
    business_categories: { categories: [] },
    order_type_performance: { order_types: [] },
    time_trends: { trends: [], granularity: 'daily' }
  });

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const [expandedSections, setExpandedSections] = useState({
    overall_metrics: true,
    state_distribution: true,
    business_categories: true,
    order_type_performance: true,
    time_trends: true
  });

  // Filter state
  const [filters, setFilters] = useState({
    dateFrom: null,
    dateTo: null,
    granularity: 'daily',
    businessCategories: [],
    orderTypes: [],
    showFilters: false
  });

  // Fetch analytics data from API
  const fetchAnalytics = async () => {
    setRefreshing(true);
    setError(null);
    
    try {
      const params = {};
      if (filters.dateFrom) params.date_from = filters.dateFrom;
      if (filters.dateTo) params.date_to = filters.dateTo;
      if (filters.granularity) params.granularity = filters.granularity;
      
      console.log('Fetching analytics with params:', params);
      const response = await api.orders.getComprehensiveAnalytics(params);
      console.log('Analytics response:', response);
      
            if (response.success) {
        setAnalyticsData(response.data);
        console.log('Analytics data set:', response.data);
        
        // Update global orders context with analytics data
        if (response.data.overall_metrics) {
          updateOrdersData({
            totalOrders: response.data.overall_metrics.total_orders || 0
          });
        }
        
        // Log the structure to see what fields are available
        console.log('Data structure:', {
          overallMetrics: response.data.overall_metrics,
          stateDistribution: response.data.state_distribution,
          businessCategories: response.data.business_categories,
          orderTypePerformance: response.data.order_type_performance,
          timeTrends: response.data.time_trends
        });
      } else if (response.data) {
        // Handle case where API returns data directly without success flag
        setAnalyticsData(response.data);
        console.log('Analytics data set (direct):', response.data);
        
        // Update global orders context with analytics data
        if (response.data.overall_metrics) {
          updateOrdersData({
            totalOrders: response.data.overall_metrics.total_orders || 0
          });
        }
      } else {
        setError(response.error || 'Failed to fetch analytics data');
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(`حدث خطأ أثناء تحميل البيانات: ${err.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Refresh data when filters change
  useEffect(() => {
    if (!loading) {
      fetchAnalytics();
    }
  }, [filters.dateFrom, filters.dateTo, filters.granularity]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Format currency for display
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format percentage for display
  const formatPercentage = (value) => {
    return `${value?.toFixed(2)}%`;
  };

  // Calculate color based on value trend
  const getTrendColor = (value, isPositive = true) => {
    if (value > 0) {
      return isPositive ? 'text-green-500' : 'text-red-500';
    } else if (value < 0) {
      return isPositive ? 'text-red-500' : 'text-green-500';
    }
    return 'text-gray-500';
  };

  // Get trend icon based on value
  const getTrendIcon = (value, isPositive = true) => {
    if (value > 0) {
      return isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />;
    } else if (value < 0) {
      return isPositive ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />;
    }
    return null;
  };

  // Get color for state badges
  const getStateBadgeColor = (stateCode) => {
    switch (stateCode) {
      case 45: return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'; // Delivered
      case 46: return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400'; // Returned
      case 48: return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'; // Terminated
      case 10: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'; // Pickup requested
      case 24: return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'; // At warehouse
      case 30: return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400'; // In transit
      case 47: return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'; // Exception
      case 100: return 'bg-rose-100 text-rose-800 dark:bg-rose-900/20 dark:text-rose-400'; // Lost
      case 101: return 'bg-rose-100 text-rose-800 dark:bg-rose-900/20 dark:text-rose-400'; // Damaged
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  // Get color for category badges
  const getCategoryBadgeColor = (category) => {
    switch (category) {
      case 'premium_high': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'high_value': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'standard_value': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'low_value': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400';
      case 'zero_cod': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      case 'small_refund': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'large_refund': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'max_value': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">جاري تحميل البيانات التحليلية...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <BarChart2 className="w-6 h-6 ml-2 text-brand-red-500" />
            تحليلات الطلبات
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            تحليل شامل لأداء الطلبات والإيرادات والتوزيع
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => handleFilterChange('showFilters', !filters.showFilters)}
            className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700"
          >
            <Filter className="w-4 h-4 ml-2" />
            الفلاتر
          </Button>
          
          <Button 
            onClick={fetchAnalytics}
            disabled={refreshing}
            className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700"
          >
            <RefreshCw className={`w-4 h-4 ml-2 ${refreshing ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
          
          <Button className="bg-brand-red-600 hover:bg-brand-red-700 text-white">
            <Download className="w-4 h-4 ml-2" />
            تصدير
          </Button>
          

        </div>
      </div>
      
      {/* Filters Section */}
      {filters.showFilters && (
        <Card className="p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
              <Filter className="w-5 h-5 ml-2 text-brand-red-500" />
              فلترة البيانات
            </h2>
            <Button 
              onClick={() => handleFilterChange('showFilters', false)}
              className="p-1 h-auto bg-transparent hover:bg-gray-100 text-gray-500 dark:hover:bg-gray-800"
            >
              <XCircle className="w-5 h-5" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                من تاريخ
              </label>
              <Input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                إلى تاريخ
              </label>
              <Input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="w-full"
              />
            </div>
            
            {/* Granularity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                تقسيم الوقت
              </label>
              <select
                value={filters.granularity}
                onChange={(e) => handleFilterChange('granularity', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-red-500 focus:border-brand-red-500 sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
              >
                <option value="daily">يومي</option>
                <option value="weekly">أسبوعي</option>
                <option value="monthly">شهري</option>
              </select>
            </div>
          </div>
        </Card>
      )}
      
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border-r-4 border-red-500 p-4 mb-6 rounded-md">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-500 ml-3" />
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}
      
      {/* Key Metrics Overview */}
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
            <Zap className="w-5 h-5 ml-2 text-brand-red-500" />
            المؤشرات الرئيسية
          </h2>
          <Button 
            onClick={() => toggleSection('overall_metrics')}
            className="p-1 h-auto bg-transparent hover:bg-gray-100 text-gray-500 dark:hover:bg-gray-800"
          >
            {expandedSections.overall_metrics ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </Button>
        </div>
        
        {expandedSections.overall_metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total Orders */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-400">إجمالي الطلبات</p>
                  <h3 className="mt-2 text-2xl font-bold text-blue-900 dark:text-blue-300">
                    {analyticsData.overall_metrics?.total_orders?.toLocaleString('ar-EG') || 0}
                  </h3>
                </div>
                <div className="bg-blue-200 dark:bg-blue-700/50 p-3 rounded-lg">
                  <Package className="h-6 w-6 text-blue-700 dark:text-blue-400" />
                </div>
              </div>
            </div>
            
            {/* Total Revenue */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-xl border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-400">إجمالي الإيرادات</p>
                  <h3 className="mt-2 text-2xl font-bold text-green-900 dark:text-green-300">
                    {formatCurrency(analyticsData.overall_metrics?.total_revenue || 0)}
                  </h3>
                </div>
                <div className="bg-green-200 dark:bg-green-700/50 p-3 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-700 dark:text-green-400" />
                </div>
              </div>
            </div>
            
            {/* Success Rate */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-xl border border-purple-200 dark:border-purple-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-400">معدل النجاح</p>
                  <h3 className="mt-2 text-2xl font-bold text-purple-900 dark:text-purple-300">
                    {formatPercentage(analyticsData.overall_metrics?.delivery_success_rate || 0)}
                  </h3>
                </div>
                <div className="bg-purple-200 dark:bg-purple-700/50 p-3 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-purple-700 dark:text-purple-400" />
                </div>
              </div>
            </div>
            
            {/* Return Rate */}
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-400">معدل الإرجاع</p>
                  <h3 className="mt-2 text-2xl font-bold text-amber-900 dark:text-amber-300">
                    {formatPercentage(analyticsData.overall_metrics?.return_rate || 0)}
                  </h3>
                </div>
                <div className="bg-amber-200 dark:bg-amber-700/50 p-3 rounded-lg">
                  <RotateCcw className="h-6 w-6 text-amber-700 dark:text-amber-400" />
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>
      
      {/* State Distribution Section */}
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
            <PieChart className="w-5 h-5 ml-2 text-brand-red-500" />
            توزيع حالات الطلبات
          </h2>
          <Button 
            onClick={() => toggleSection('state_distribution')}
            className="p-1 h-auto bg-transparent hover:bg-gray-100 text-gray-500 dark:hover:bg-gray-800"
          >
            {expandedSections.state_distribution ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </Button>
        </div>
        
        {expandedSections.state_distribution && (
          <div>
            {/* State Distribution Chart Placeholder */}
            <div className="h-64 mb-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 dark:text-gray-400">
                  رسم بياني دائري لتوزيع حالات الطلبات
                </p>
              </div>
            </div>
            
            {/* State Distribution Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      الحالة
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      عدد الطلبات
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      النسبة
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      إجمالي المبلغ
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      متوسط المبلغ
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                  {analyticsData.state_distribution?.states?.map((state, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStateBadgeColor(state.state_code)}`}>
                            {state.state_value}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {state.count?.toLocaleString('ar-EG') || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {formatPercentage(state.percentage || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {formatCurrency(state.total_cod || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {formatCurrency(state.avg_cod || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>
      
      {/* Business Categories Section */}
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
            <DollarSign className="w-5 h-5 ml-2 text-brand-red-500" />
            فئات الأعمال
          </h2>
          <Button 
            onClick={() => toggleSection('business_categories')}
            className="p-1 h-auto bg-transparent hover:bg-gray-100 text-gray-500 dark:hover:bg-gray-800"
          >
            {expandedSections.business_categories ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </Button>
        </div>
        
        {expandedSections.business_categories && (
          <div>
            {/* Categories Chart Placeholder */}
            <div className="h-64 mb-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <BarChart2 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 dark:text-gray-400">
                  رسم بياني شريطي لفئات الأعمال
                </p>
              </div>
            </div>
            
            {/* Categories Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {analyticsData.business_categories?.categories?.map((category, index) => (
                <div 
                  key={index} 
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryBadgeColor(category.category)}`}>
                      {category.category}
                    </span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {formatPercentage(category.success_rate || 0)} نسبة النجاح
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">عدد الطلبات</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {category.count?.toLocaleString('ar-EG') || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">إجمالي المبلغ</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {formatCurrency(category.total_cod || 0)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-500 dark:text-gray-400">متوسط المبلغ</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(category.avg_cod || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
      
      {/* Order Type Performance Section */}
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
            <Truck className="w-5 h-5 ml-2 text-brand-red-500" />
            أداء أنواع الطلبات
          </h2>
          <Button 
            onClick={() => toggleSection('order_type_performance')}
            className="p-1 h-auto bg-transparent hover:bg-gray-100 text-gray-500 dark:hover:bg-gray-800"
          >
            {expandedSections.order_type_performance ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </Button>
        </div>
        
        {expandedSections.order_type_performance && (
          <div>
            {/* Order Types Chart Placeholder */}
            <div className="h-64 mb-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <BarChart2 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 dark:text-gray-400">
                  رسم بياني شريطي لأداء أنواع الطلبات
                </p>
              </div>
            </div>
            
            {/* Order Types Performance Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      نوع الطلب
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      عدد الطلبات
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      إجمالي المبلغ
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      متوسط المبلغ
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      الأداء
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                  {analyticsData.order_type_performance?.order_types?.map((orderType, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {orderType.type_value}
                          </span>
                          <span className="mr-2 text-xs text-gray-500 dark:text-gray-400">
                            (كود: {orderType.type_code})
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {orderType.count?.toLocaleString('ar-EG') || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {formatCurrency(orderType.total_cod || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {formatCurrency(orderType.avg_cod || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {orderType.avg_cod > 0 ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                              <TrendingUp className="w-3 h-3 ml-1" />
                              إيجابي
                            </span>
                          ) : orderType.avg_cod < 0 ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                              <TrendingDown className="w-3 h-3 ml-1" />
                              سلبي
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400">
                              محايد
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>
      
      {/* Time Trends Section */}
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
            <LineChart className="w-5 h-5 ml-2 text-brand-red-500" />
            الاتجاهات الزمنية
          </h2>
          <Button 
            onClick={() => toggleSection('time_trends')}
            className="p-1 h-auto bg-transparent hover:bg-gray-100 text-gray-500 dark:hover:bg-gray-800"
          >
            {expandedSections.time_trends ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </Button>
        </div>
        
        {expandedSections.time_trends && (
          <div>
            {/* Time Trends Chart Placeholder */}
            <div className="h-64 mb-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <LineChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 dark:text-gray-400">
                  رسم بياني خطي للاتجاهات الزمنية
                </p>
              </div>
            </div>
            
            {/* Time Trends Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Total Orders Trend */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-400">إجمالي الطلبات</p>
                    <h3 className="mt-2 text-2xl font-bold text-blue-900 dark:text-blue-300">
                      {analyticsData.time_trends?.trends?.reduce((sum, trend) => sum + (trend.orders || 0), 0)?.toLocaleString('ar-EG') || 0}
                    </h3>
                  </div>
                  <div className="bg-blue-200 dark:bg-blue-700/50 p-3 rounded-lg">
                    <Package className="h-6 w-6 text-blue-700 dark:text-blue-400" />
                  </div>
                </div>
              </div>
              
              {/* Total Revenue Trend */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-xl border border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">إجمالي الإيرادات</p>
                    <h3 className="mt-2 text-2xl font-bold text-green-900 dark:text-green-300">
                      {formatCurrency(analyticsData.time_trends?.trends?.reduce((sum, trend) => sum + (trend.revenue || 0), 0) || 0)}
                    </h3>
                  </div>
                  <div className="bg-green-200 dark:bg-green-700/50 p-3 rounded-lg">
                    <DollarSign className="h-6 w-6 text-green-700 dark:text-green-400" />
                  </div>
                </div>
              </div>
              
              {/* Delivered Orders Trend */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-xl border border-purple-200 dark:border-purple-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-700 dark:text-purple-400">الطلبات المسلمة</p>
                    <h3 className="mt-2 text-2xl font-bold text-purple-900 dark:text-purple-300">
                      {analyticsData.time_trends?.trends?.reduce((sum, trend) => sum + (trend.delivered || 0), 0)?.toLocaleString('ar-EG') || 0}
                    </h3>
                  </div>
                  <div className="bg-purple-200 dark:bg-purple-700/50 p-3 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-purple-700 dark:text-purple-400" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Recent Trends Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      الفترة
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      عدد الطلبات
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      الطلبات المسلمة
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      الإيرادات
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      معدل النجاح
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                  {analyticsData.time_trends?.trends?.slice(-10).reverse().map((trend, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {trend.period}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {trend.orders?.toLocaleString('ar-EG') || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {trend.delivered?.toLocaleString('ar-EG') || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {formatCurrency(trend.revenue || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          trend.orders > 0 && (trend.delivered / trend.orders) >= 0.8 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : trend.orders > 0 && (trend.delivered / trend.orders) >= 0.6
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                          {trend.orders > 0 ? formatPercentage((trend.delivered / trend.orders) * 100) : '0%'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default OrdersAnalyticsPage;