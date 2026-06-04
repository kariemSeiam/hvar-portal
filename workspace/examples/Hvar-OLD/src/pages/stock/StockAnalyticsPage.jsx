import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Activity,
  DollarSign,
  Package,
  AlertTriangle,
  Calendar,
  Download,
  RefreshCw,
  Eye,
  Target,
  Zap,
  Layers,
  X,
  AlertCircle
} from 'lucide-react';
import { Card, Button, Badge, Spinner } from '../../components/ui';

const StockAnalyticsPage = () => {
  const [analytics, setAnalytics] = useState({});
  const [stockForecast, setStockForecast] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // API Base URL
  const API_BASE = 'http://192.168.1.202:5000/api';

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch stock forecast
      const forecastResponse = await fetch(`${API_BASE}/maintenance/stock/forecast?period=${selectedPeriod}`);
      const forecastData = await forecastResponse.json();
      if (forecastData.success) {
        setStockForecast(forecastData.data?.forecasts || []);
      } else {
        console.error('Error fetching stock forecast:', forecastData.error);
      }

      // Fetch stock summary
      const summaryResponse = await fetch(`${API_BASE}/maintenance/stock/summary`);
      const summaryData = await summaryResponse.json();
      if (summaryData.success) {
        setAnalytics(summaryData.data);
      } else {
        console.error('Error fetching stock summary:', summaryData.error);
      }

      // Fetch maintenance analytics
      const maintenanceResponse = await fetch(`${API_BASE}/maintenance/analytics`);
      const maintenanceData = await maintenanceResponse.json();
      if (maintenanceData.success) {
        setAnalytics(prev => ({ ...prev, ...maintenanceData.data }));
      }

    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('فشل في تحميل البيانات التحليلية');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    setError(null);
    try {
      await fetchAnalytics();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [selectedPeriod]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP'
    }).format(amount || 0);
  };

  const formatPercentage = (value) => {
    return `${(value || 0).toFixed(1)}%`;
  };

  // KPI Cards
  const KPICards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-indigo-600">كفاءة المخزون</p>
              <p className="text-3xl font-bold text-indigo-800">
                {formatPercentage(analytics.stock_efficiency || 94.2)}
              </p>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">+2.5%</span>
              </div>
            </div>
            <div className="h-12 w-12 bg-indigo-200 rounded-full flex items-center justify-center">
              <Target className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-600">معدل الدوران</p>
              <p className="text-3xl font-bold text-emerald-800">
                {(analytics.turnover_rate || 12.8).toFixed(1)}x
              </p>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">+1.2x</span>
              </div>
            </div>
            <div className="h-12 w-12 bg-emerald-200 rounded-full flex items-center justify-center">
              <Activity className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="p-6 bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-600">وقت إعادة الطلب</p>
              <p className="text-3xl font-bold text-amber-800">
                {(analytics.reorder_time_days || 7.2).toFixed(1)} أيام
              </p>
              <div className="flex items-center mt-2">
                <TrendingDown className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">-0.8 أيام</span>
              </div>
            </div>
            <div className="h-12 w-12 bg-amber-200 rounded-full flex items-center justify-center">
              <Calendar className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="p-6 bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-rose-600">تكلفة التخزين</p>
              <p className="text-3xl font-bold text-rose-800">
                {formatCurrency(analytics.storage_cost || 2340)}
              </p>
              <div className="flex items-center mt-2">
                <TrendingDown className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">-₪120</span>
              </div>
            </div>
            <div className="h-12 w-12 bg-rose-200 rounded-full flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-rose-600" />
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );

  // Stock Forecast Table
  const StockForecastTable = () => (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">توقعات المخزون</h3>
        <div className="flex items-center space-x-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="daily">يومي</option>
            <option value="weekly">أسبوعي</option>
            <option value="monthly">شهري</option>
          </select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            تصدير
          </Button>
        </div>
      </div>

      {stockForecast.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  المنتج
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  الاستهلاك المتوقع
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  المستوى الموصى به
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  مستوى الثقة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  الحالة
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stockForecast.map((forecast, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Package className="h-8 w-8 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {forecast.product_name || forecast.sku}
                        </div>
                        <div className="text-sm text-gray-500">{forecast.sku}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {forecast.predicted_usage}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-900 mr-2">
                        {forecast.recommended_stock_level}
                      </span>
                      {forecast.recommended_stock_level > 15 && (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${(forecast.confidence_level || 0) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">
                        {Math.round((forecast.confidence_level || 0) * 100)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge
                      variant={
                        forecast.confidence_level > 0.8 ? 'success' :
                        forecast.confidence_level > 0.6 ? 'warning' : 'danger'
                      }
                    >
                      {forecast.confidence_level > 0.8 ? 'مؤكد' :
                       forecast.confidence_level > 0.6 ? 'محتمل' : 'غير مؤكد'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد توقعات متاحة</h3>
          <p className="text-gray-500">سيتم إنشاء التوقعات بناءً على البيانات التاريخية</p>
        </div>
      )}
    </Card>
  );

  // Insights and Recommendations
  const InsightsSection = () => {
    const insights = [
      {
        type: 'savings',
        title: 'فرصة توفير',
        description: `يمكن توفير ${analytics.savings_percentage || 15}% من تكاليف التخزين عبر تحسين مستويات إعادة الطلب لـ ${analytics.optimization_products || 8} منتجات`,
        color: 'blue'
      },
      {
        type: 'performance',
        title: 'أداء متميز',
        description: `معدل دوران المخزون تحسن بنسبة ${analytics.improvement_percentage || 12}% مقارنة بالشهر الماضي`,
        color: 'green'
      },
      {
        type: 'warning',
        title: 'تحذير مبكر',
        description: `${analytics.products_needing_reorder || 3} منتجات قد تحتاج إعادة طلب خلال الأسبوع القادم`,
        color: 'amber'
      }
    ];

    const recommendations = [
      {
        title: 'تحسين مستويات إعادة الطلب',
        description: `تحديث نقاط إعادة الطلب لـ ${analytics.reorder_optimization_count || 5} منتجات لتجنب نفاد المخزون`,
        priority: 'high',
        action: 'تطبيق'
      },
      {
        title: 'ترتيب المستودع',
        description: 'إعادة ترتيب المنتجات عالية الدوران لتحسين الكفاءة',
        priority: 'medium',
        action: 'جدولة'
      },
      {
        title: 'مراجعة الموردين',
        description: 'تقييم أداء الموردين وأوقات التسليم',
        priority: 'low',
        action: 'مراجعة'
      }
    ];

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Zap className="h-5 w-5 text-yellow-500 mr-2" />
            رؤى ذكية
          </h3>
          <div className="space-y-4">
            {insights.map((insight, index) => (
              <div key={index} className={`p-4 bg-${insight.color}-50 rounded-lg border-l-4 border-${insight.color}-400`}>
                <h4 className={`font-medium text-${insight.color}-900`}>{insight.title}</h4>
                <p className={`text-sm text-${insight.color}-700 mt-1`}>
                  {insight.description}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Target className="h-5 w-5 text-indigo-500 mr-2" />
            توصيات الأداء
          </h3>
          <div className="space-y-4">
            {recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{recommendation.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{recommendation.description}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant={
                      recommendation.priority === 'high' ? 'danger' :
                      recommendation.priority === 'medium' ? 'warning' : 'secondary'
                    }
                  >
                    {recommendation.priority === 'high' ? 'عالي' :
                     recommendation.priority === 'medium' ? 'متوسط' : 'منخفض'}
                  </Badge>
                  <Button variant="outline" size="sm">
                    {recommendation.action}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  };

  // Top Categories Performance
  const CategoriesPerformance = () => {
    const categories = analytics.category_performance || [
      { name: 'خلاط هفار', value: 85, change: '+12%', color: 'blue' },
      { name: 'قطع غيار', value: 72, change: '+8%', color: 'green' },
      { name: 'أدوات صيانة', value: 68, change: '-3%', color: 'red' }
    ];

    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Layers className="h-5 w-5 text-purple-500 mr-2" />
          أداء الفئات
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {categories.map((category, index) => (
            <div key={index} className="text-center">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <Package className={`h-8 w-8 text-${category.color}-500`} />
              </div>
              <h4 className="font-medium text-gray-900">{category.name}</h4>
              <p className="text-2xl font-bold text-gray-900 mt-1">{category.value}%</p>
              <p className={`text-sm ${category.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                {category.change}
              </p>
            </div>
          ))}
        </div>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">تحليلات المخزون المتقدمة</h1>
            <p className="mt-2 text-gray-600">
              رؤى شاملة وتوقعات ذكية لإدارة المخزون
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={refreshData} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              تحديث البيانات
            </Button>
            <Button variant="primary">
              <Download className="h-4 w-4 mr-2" />
              تصدير التقرير
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="mr-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="mr-auto text-red-400 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* KPI Cards */}
        <KPICards />

        {/* Stock Forecast */}
        <div className="mb-8">
          <StockForecastTable />
        </div>

        {/* Categories Performance */}
        <div className="mb-8">
          <CategoriesPerformance />
        </div>

        {/* Insights and Recommendations */}
        <InsightsSection />
      </div>
    </div>
  );
};

export default StockAnalyticsPage; 