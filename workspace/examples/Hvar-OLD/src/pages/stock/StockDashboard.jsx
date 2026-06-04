import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, 
  Warehouse, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Activity,
  DollarSign,
  Calendar,
  Clock,
  Users,
  BarChart3,
  Settings,
  RefreshCw,
  Plus,
  Eye,
  ArrowRight,
  CheckCircle,
  XCircle,
  Info,
  Minus,
  X
} from 'lucide-react';
import { Card, Button, Badge, Spinner } from '../../components/ui';
import { Link } from 'react-router-dom';

const StockDashboard = () => {
  const [dashboardData, setDashboardData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // API Base URL
  const API_BASE = 'http://192.168.1.202:5000/api';

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all dashboard data in parallel
      const [
        stockSummaryResponse,
        lowStockAlertsResponse,
        recentMovementsResponse,
        maintenanceSummaryResponse,
        analyticsResponse
      ] = await Promise.all([
        fetch(`${API_BASE}/products/summary`),
        fetch(`${API_BASE}/products/alerts`),
        fetch(`${API_BASE}/products/movements?limit=5`),
        fetch(`${API_BASE}/products/maintenance/analytics`),
        fetch(`${API_BASE}/products/forecast?period=weekly`)
      ]);

      const [
        stockSummary,
        lowStockAlerts,
        recentMovements,
        maintenanceSummary,
        analytics
      ] = await Promise.all([
        stockSummaryResponse.json(),
        lowStockAlertsResponse.json(),
        recentMovementsResponse.json(),
        maintenanceSummaryResponse.json(),
        analyticsResponse.json()
      ]);

      setDashboardData({
        stock: stockSummary.success ? stockSummary.data : {},
        alerts: lowStockAlerts.success ? lowStockAlerts.data : [],
        movements: recentMovements.success ? recentMovements.data : [],
        maintenance: maintenanceSummary.success ? maintenanceSummary.data : {},
        analytics: analytics.success ? analytics.data : {}
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('فشل في تحميل بيانات لوحة التحكم');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    setError(null);
    try {
      await fetchDashboardData();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Quick Actions
  const QuickActions = () => (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">إجراءات سريعة</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/stock/products">
          <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center">
            <Plus className="h-6 w-6 mb-2" />
            <span>إضافة منتج</span>
          </Button>
        </Link>
        
        <Link to="/stock/movements">
          <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center">
            <Activity className="h-6 w-6 mb-2" />
            <span>حركات المخزون</span>
          </Button>
        </Link>
        
        <Link to="/stock/analytics">
          <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center">
            <BarChart3 className="h-6 w-6 mb-2" />
            <span>التحليلات</span>
          </Button>
        </Link>
        
        <Link to="/maintenance">
          <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center">
            <Settings className="h-6 w-6 mb-2" />
            <span>إدارة الصيانة</span>
          </Button>
        </Link>
      </div>
    </Card>
  );

  // Stock Overview Cards
  const StockOverviewCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">إجمالي المنتجات</p>
              <p className="text-3xl font-bold text-blue-800">
                {dashboardData.stock?.total_skus || 0}
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-200 rounded-full flex items-center justify-center">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">إجمالي المخزون</p>
              <p className="text-3xl font-bold text-green-800">
                {dashboardData.stock?.total_stock || 0}
              </p>
            </div>
            <div className="h-12 w-12 bg-green-200 rounded-full flex items-center justify-center">
              <Warehouse className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-600">تنبيهات المخزون</p>
              <p className="text-3xl font-bold text-yellow-800">
                {dashboardData.stock?.low_stock_items || 0}
              </p>
            </div>
            <div className="h-12 w-12 bg-yellow-200 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">قيمة المخزون</p>
              <p className="text-3xl font-bold text-purple-800">
                {formatCurrency(dashboardData.stock?.total_stock_value)}
              </p>
            </div>
            <div className="h-12 w-12 bg-purple-200 rounded-full flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );

  // Performance Metrics
  const PerformanceMetrics = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <TrendingUp className="h-5 w-5 text-green-500 mr-2" />
          مؤشرات الأداء
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <Activity className="h-5 w-5 text-blue-500 mr-3" />
              <div>
                <p className="font-medium">كفاءة المخزون</p>
                <p className="text-sm text-gray-500">معدل الاستخدام الأمثل</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-blue-600">
                {(dashboardData.analytics?.stock_efficiency || 94.2).toFixed(1)}%
              </p>
              <p className="text-sm text-green-600">+2.5%</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-amber-500 mr-3" />
              <div>
                <p className="font-medium">وقت إعادة الطلب</p>
                <p className="text-sm text-gray-500">متوسط الأيام</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-amber-600">
                {(dashboardData.analytics?.reorder_time_days || 7.2).toFixed(1)} أيام
              </p>
              <p className="text-sm text-green-600">-0.8 أيام</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <Users className="h-5 w-5 text-purple-500 mr-3" />
              <div>
                <p className="font-medium">دوران المخزون</p>
                <p className="text-sm text-gray-500">معدل الدوران السنوي</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-purple-600">
                {(dashboardData.analytics?.turnover_rate || 12.8).toFixed(1)}x
              </p>
              <p className="text-sm text-green-600">+1.2x</p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Calendar className="h-5 w-5 text-indigo-500 mr-2" />
          نشاط اليوم
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <Plus className="h-5 w-5 text-green-500 mr-3" />
              <div>
                <p className="font-medium">حركات الوارد</p>
                <p className="text-sm text-gray-500">اليوم</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-green-600">
                {dashboardData.movements?.filter(m => ['purchase', 'return'].includes(m.movement_type)).length || 0}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <Minus className="h-5 w-5 text-red-500 mr-3" />
              <div>
                <p className="font-medium">حركات الصادر</p>
                <p className="text-sm text-gray-500">اليوم</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-red-600">
                {dashboardData.movements?.filter(m => ['service', 'allocation'].includes(m.movement_type)).length || 0}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <Settings className="h-5 w-5 text-blue-500 mr-3" />
              <div>
                <p className="font-medium">عمليات الصيانة</p>
                <p className="text-sm text-gray-500">اليوم</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-blue-600">
                {dashboardData.maintenance?.today_cycles || 0}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  // Recent Activity
  const RecentActivity = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">آخر الحركات</h3>
          <Link to="/stock/movements">
            <Button variant="outline" size="sm">
              عرض الكل
              <ArrowRight className="h-4 w-4 mr-2" />
            </Button>
          </Link>
        </div>
        
        <div className="space-y-3">
          {dashboardData.movements?.length > 0 ? (
            dashboardData.movements.slice(0, 5).map((movement, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <Package className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="font-medium text-sm">{movement.product_name}</p>
                    <p className="text-xs text-gray-500">{movement.movement_type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {movement.quantity} {movement.unit || 'قطعة'}
                  </p>
                  <p className="text-xs text-gray-500">{formatDate(movement.created_at)}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">لا توجد حركات حديثة</p>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">تنبيهات المخزون</h3>
          <Link to="/stock/alerts">
            <Button variant="outline" size="sm">
              عرض الكل
              <ArrowRight className="h-4 w-4 mr-2" />
            </Button>
          </Link>
        </div>
        
        <div className="space-y-3">
          {dashboardData.alerts?.length > 0 ? (
            dashboardData.alerts.slice(0, 5).map((alert, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border-l-4 border-red-400">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-500 mr-3" />
                  <div>
                    <p className="font-medium text-sm">{alert.product_name}</p>
                    <p className="text-xs text-gray-500">
                      الكمية الحالية: {alert.current_quantity}
                    </p>
                  </div>
                </div>
                <Badge variant="danger" size="sm">
                  منخفض
                </Badge>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <p className="text-gray-500">لا توجد تنبيهات</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );

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
            <h1 className="text-3xl font-bold text-gray-900">لوحة تحكم المخزون</h1>
            <p className="mt-2 text-gray-600">
              نظرة شاملة على حالة المخزون والأداء
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={refreshData} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              تحديث
            </Button>
            <Link to="/stock/settings">
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                الإعدادات
              </Button>
            </Link>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <XCircle className="h-5 w-5 text-red-400" />
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

        {/* Quick Actions */}
        <QuickActions />

        {/* Stock Overview Cards */}
        <StockOverviewCards />

        {/* Performance Metrics */}
        <PerformanceMetrics />

        {/* Recent Activity */}
        <RecentActivity />
      </div>
    </div>
  );
};

export default StockDashboard; 