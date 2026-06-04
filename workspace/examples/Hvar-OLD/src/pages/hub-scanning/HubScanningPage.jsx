import React, { useState, useEffect, useCallback } from 'react';
import { 
  ScanLine, 
  List, 
  Server, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  User, 
  Package, 
  FileText, 
  TrendingUp,
  BarChart3,
  RefreshCw,
  Settings,
  Camera,
  QrCode,
  Shield,
  Award,
  Zap,
  Target,
  Activity,
  Archive,
  Bell,
  Star,
  MapPin,
  Calendar,
  Tag,
  DollarSign,
  Building,
  Truck,
  Home,
  Globe,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  Loader,
  XCircle,
  Eye,
  Play,
  Pause,
  Shuffle
} from 'lucide-react';
import { api } from '../../services/api';
import Scanner from './components/Scanner';
import ScanResult from './components/ScanResult';
import HubQueue from './components/HubQueue';
import { useTheme } from '../../components/ui/DesignSystem';

const HubScanningPage = () => {
  const { isDark, direction } = useTheme();
  const [scanResult, setScanResult] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [isInspecting, setIsInspecting] = useState(false);
  const [activeTab, setActiveTab] = useState('scanner');
  const [refreshQueueKey, setRefreshQueueKey] = useState(0);
  const [dashboardStats, setDashboardStats] = useState({
    totalScanned: 0,
    pendingInspection: 0,
    completedToday: 0,
    qualityScore: 0,
    urgentActions: 0,
    awaitingReview: 0,
    totalActions: 0,
    activeActions: 0
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [queueStats, setQueueStats] = useState({
    total: 0,
    pending: 0,
    scanned: 0,
    inspected: 0,
    awaitingReview: 0
  });
  const [selectedQueueItem, setSelectedQueueItem] = useState(null);

  // Initialize unified customer service system
  const initializeSystem = useCallback(async () => {
    try {
      const initResponse = await api.unifiedCustomerService.init();
      if (!initResponse.success) {
        console.warn('System initialization warning:', initResponse.error);
      }
    } catch (err) {
      console.error('System initialization error:', err);
    }
  }, []);

  useEffect(() => {
    initializeSystem();
  }, [initializeSystem]);

  // Fetch real dashboard statistics using unified API
  const fetchDashboardStats = useCallback(async () => {
    try {
      setIsLoadingStats(true);
      
      // Fetch comprehensive data from multiple endpoints
      const [analyticsResponse, dashboardResponse, serviceActionsResponse] = await Promise.all([
        api.unifiedCustomerService.getAnalytics({ 
          date_from: new Date().toISOString().split('T')[0] 
        }),
        api.unifiedCustomerService.getDashboard(),
        api.unifiedCustomerService.getServiceActions({
          action_status: 'requested,scanned,awaiting_inspection,hub_confirmed,awaiting_review',
          limit: 100
        })
      ]);

      if (analyticsResponse.success && dashboardResponse.success && serviceActionsResponse.success) {
        const analytics = analyticsResponse.data;
        const dashboard = dashboardResponse.data;
        const serviceActions = serviceActionsResponse.data || [];
        
        // Calculate comprehensive stats from real data
        const stats = {
          totalScanned: analytics.service_actions?.total || 0,
          pendingInspection: dashboard.status_breakdown?.['completed'] || 0,
          completedToday: dashboard.today?.actions_completed || 0,
          qualityScore: analytics.service_actions?.avg_quality_score || 0,
          urgentActions: analytics.service_actions?.urgent || 0,
          awaitingReview: serviceActions.filter(action => action.action_status === 'awaiting_review').length,
          totalActions: analytics.service_actions?.total || 0,
          activeActions: analytics.service_actions?.active || 0,
          // Additional stats from the API response
          highPriorityActions: analytics.service_actions?.high_priority || 0,
          completedActions: analytics.service_actions?.completed || 0,
          actionTypes: analytics.action_types || {},
          partsStats: analytics.parts || {},
          // Dashboard specific stats
          priorityBreakdown: dashboard.priority_breakdown || {},
          statusBreakdown: dashboard.status_breakdown || {},
          todayStats: dashboard.today || {}
        };
        
        setDashboardStats(stats);
        
        // Update queue stats from real service actions
        const queueStats = {
          total: serviceActions.length,
          pending: serviceActions.filter(item => item.action_status === 'requested').length,
          scanned: serviceActions.filter(item => item.action_status === 'scanned').length,
          inspected: serviceActions.filter(item => item.action_status === 'hub_confirmed').length,
          awaitingReview: serviceActions.filter(item => item.action_status === 'awaiting_review').length
        };
        setQueueStats(queueStats);
      } else {
        console.error('Failed to fetch dashboard data:', {
          analytics: analyticsResponse.error,
          dashboard: dashboardResponse.error,
          serviceActions: serviceActionsResponse.error
        });
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError('فشل في تحميل البيانات الإحصائية');
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  // Handle queue item selection
  const handleQueueItemSelect = useCallback((item) => {
    setSelectedQueueItem(item);
    if (item?.return_tracking_number) {
      handleScan(item.return_tracking_number);
    }
  }, []);

  // Helper function to normalize tracking numbers
  const normalizeTrackingNumber = (tracking) => {
    if (!tracking) return tracking;
    
    // Remove any existing prefixes
    if (tracking.startsWith('RET')) {
      return tracking.substring(3); // Remove RET prefix
    } else if (tracking.startsWith('RTN-')) {
      // Extract the base tracking number from RTN-base-timestamp format
      const parts = tracking.split('-');
      if (parts.length >= 2) {
        return parts[1]; // Return the base tracking number
      }
    }
    
    // For original order tracking numbers, return as-is
    // This allows scanning both return tracking numbers and original order tracking numbers
    return tracking;
  };

  // Enhanced scan handler with real API integration
  const handleScan = async (trackingNumber) => {
    setIsScanning(true);
    setError(null);
    setScanResult(null);

    try {
      // Normalize the tracking number before sending
      const normalizedTracking = normalizeTrackingNumber(trackingNumber);
      
      // Step 1: Perform hub scan using unified service API with real data
      const scanResponse = await api.unifiedCustomerService.hubScan({
        return_tracking_number: normalizedTracking,
        hub_agent: 'HubAgent001', // Should come from auth context
        scan_notes: 'Scanned via hub interface',
        product_condition: 'received',
        inspection_notes: 'Initial scan completed'
      });
      
      if (scanResponse.success) {
        // Step 2: Fetch comprehensive service action details
        const detailsResponse = await api.unifiedCustomerService.getServiceAction(scanResponse.data.action_id);
        
        if (detailsResponse.success) {
          setScanResult({
            scan_data: scanResponse.data,
            action_details: detailsResponse.data,
          });
          setError(null);
          
          // Refresh dashboard stats after successful scan
          fetchDashboardStats();
        } else {
          setError(detailsResponse.error || 'Could not fetch action details after scan.');
        }
      } else {
        setError(scanResponse.error || 'No service action found for this tracking number.');
      }
    } catch (err) {
      setError('An unexpected error occurred during the scan.');
      console.error(err);
    } finally {
      setIsScanning(false);
    }
  };

  // Enhanced inspection handler with real API integration
  const handleInspectionSubmit = async (inspectionData) => {
    if (!scanResult || !scanResult.action_details) return;

    setIsInspecting(true);
    setError(null);

    try {
      // Step 3: Complete hub inspection with comprehensive data
      const payload = {
        return_tracking_number: scanResult.action_details.return_tracking_number,
        product_condition: inspectionData.product_condition,
        quality_score: inspectionData.quality_score,
        inspection_notes: inspectionData.inspection_notes,
        parts_inspection: inspectionData.parts_inspection || [],
        hub_agent: 'HubAgent001', // Should come from auth context
        recommended_action: inspectionData.recommended_action || 'proceed',
        team_leader_review_required: inspectionData.team_leader_review_required || false
      };

      const response = await api.unifiedCustomerService.hubInspection(payload);

      if (response.success) {
        setScanResult(null); // Clear the view
        setRefreshQueueKey(prev => prev + 1); // Refresh the queue
        fetchDashboardStats(); // Refresh dashboard stats
        
        // Show success message or notification
        console.log('Inspection completed successfully:', response.data);
      } else {
        setError(response.error || 'Failed to submit inspection.');
      }
    } catch (err) {
      setError('An unexpected error occurred during inspection.');
      console.error(err);
    } finally {
      setIsInspecting(false);
    }
  };

  const handleRefreshQueue = () => {
    setRefreshQueueKey(prev => prev + 1);
    fetchDashboardStats();
  };

  const renderActiveTab = () => {
    if (activeTab === 'scanner') {
      return scanResult ? (
        <ScanResult
          scanResult={scanResult}
          onInspectionSubmit={handleInspectionSubmit}
          isInspecting={isInspecting}
          onCancel={() => setScanResult(null)}
        />
      ) : (
        <Scanner onScan={handleScan} isScanning={isScanning} error={error} />
      );
    }
    return null;
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color = "blue", trend }) => (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow duration-200`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className={`w-3 h-3 ${trend > 0 ? 'text-green-500' : 'text-red-500'}`} />
              <span className={`text-xs ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trend > 0 ? '+' : ''}{trend}%
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-${color}-100 dark:bg-${color}-900/30`}>
          <Icon className={`w-6 h-6 text-${color}-600 dark:text-${color}-400`} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900/50" dir={direction}>
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-2">
                <div className="p-3 bg-brand-red-100 dark:bg-brand-red-900/30 rounded-xl">
                  <ScanLine className="w-8 h-8 text-brand-red-600 dark:text-brand-red-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    عمليات المسح في المركز
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    نظام المسح والفحص المباشر للعائدات والخدمات
                  </p>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefreshQueue}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-brand-red-600 dark:hover:text-brand-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="تحديث البيانات"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <button
                onClick={() => setActiveTab('scanner')}
                className={`px-4 py-2 text-sm rounded-lg flex items-center gap-2 transition-all ${
                  activeTab === 'scanner' 
                    ? 'bg-brand-red-600 text-white shadow-lg' 
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <ScanLine className="w-4 h-4" />
                <span>الماسح الضوئي</span>
              </button>
            </div>
          </div>
        </div>
      </div>

              {/* Dashboard Stats */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={ScanLine}
              title="إجمالي الإجراءات"
              value={isLoadingStats ? '...' : dashboardStats.totalActions.toLocaleString()}
              subtitle="جميع الإجراءات"
              color="blue"
            />
            <StatCard
              icon={Activity}
              title="الإجراءات النشطة"
              value={isLoadingStats ? '...' : dashboardStats.activeActions.toLocaleString()}
              subtitle="قيد المعالجة"
              color="green"
            />
            <StatCard
              icon={AlertTriangle}
              title="أولوية عالية"
              value={isLoadingStats ? '...' : dashboardStats.highPriorityActions.toLocaleString()}
              subtitle="تتطلب اهتمام"
              color="red"
            />
            <StatCard
              icon={CheckCircle}
              title="مكتمل"
              value={isLoadingStats ? '...' : dashboardStats.completedActions.toLocaleString()}
              subtitle="تم الإنجاز"
              color="emerald"
            />
          </div>
          
          {/* Action Types Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={RefreshCw}
              title="استبدال/استرجاع"
              value={isLoadingStats ? '...' : (dashboardStats.actionTypes?.return_refund || 0).toLocaleString()}
              subtitle="إجراءات الاسترجاع"
              color="amber"
            />
            <StatCard
              icon={Settings}
              title="صيانة"
              value={isLoadingStats ? '...' : (dashboardStats.actionTypes?.maintenance || 0).toLocaleString()}
              subtitle="إجراءات الصيانة"
              color="purple"
            />
            <StatCard
              icon={Shuffle}
              title="تبديل"
              value={isLoadingStats ? '...' : (dashboardStats.actionTypes?.exchange || 0).toLocaleString()}
              subtitle="إجراءات التبديل"
              color="indigo"
            />
            <StatCard
              icon={FileText}
              title="عام"
              value={isLoadingStats ? '...' : (dashboardStats.actionTypes?.general || 0).toLocaleString()}
              subtitle="إجراءات عامة"
              color="gray"
            />
          </div>
          
          {/* Priority & Status Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={AlertTriangle}
              title="أولوية عالية"
              value={isLoadingStats ? '...' : (dashboardStats.priorityBreakdown?.high || 0).toLocaleString()}
              subtitle="إجراءات عالية الأولوية"
              color="red"
            />
            <StatCard
              icon={Clock}
              title="أولوية متوسطة"
              value={isLoadingStats ? '...' : (dashboardStats.priorityBreakdown?.medium || 0).toLocaleString()}
              subtitle="إجراءات متوسطة الأولوية"
              color="yellow"
            />
            <StatCard
              icon={FileText}
              title="مطلوب"
              value={isLoadingStats ? '...' : (dashboardStats.statusBreakdown?.requested || 0).toLocaleString()}
              subtitle="إجراءات مطلوبة"
              color="blue"
            />
            <StatCard
              icon={CheckCircle}
              title="مغلق"
              value={isLoadingStats ? '...' : (dashboardStats.statusBreakdown?.closed || 0).toLocaleString()}
              subtitle="إجراءات مغلقة"
              color="emerald"
            />
          </div>
          
          {/* Today's Activity */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard
              icon={Calendar}
              title="تم إنشاؤها اليوم"
              value={isLoadingStats ? '...' : (dashboardStats.todayStats?.actions_created || 0).toLocaleString()}
              subtitle="إجراءات جديدة"
              color="blue"
            />
            <StatCard
              icon={CheckCircle}
              title="تم إنجازها اليوم"
              value={isLoadingStats ? '...' : (dashboardStats.todayStats?.actions_completed || 0).toLocaleString()}
              subtitle="إجراءات مكتملة"
              color="green"
            />
            <StatCard
              icon={AlertTriangle}
              title="عاجلة اليوم"
              value={isLoadingStats ? '...' : (dashboardStats.todayStats?.urgent_actions || 0).toLocaleString()}
              subtitle="إجراءات عاجلة"
              color="red"
            />
          </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Scanner/Result Section */}
          <div className="xl:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-red-100 dark:bg-brand-red-900/30 rounded-lg">
                      <Target className="w-5 h-5 text-brand-red-600 dark:text-brand-red-400" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {scanResult ? 'نتيجة المسح' : 'الماسح الضوئي'}
                    </h2>
                  </div>
                  {scanResult && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Activity className="w-4 h-4" />
                      <span>جاري المعالجة</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-6">
                {renderActiveTab()}
              </div>
            </div>
          </div>

          {/* Queue Section */}
          <div className="xl:col-span-1">
            <HubQueue 
              refreshKey={refreshQueueKey} 
              onRefresh={handleRefreshQueue}
              onItemSelect={handleQueueItemSelect}
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-brand-red-600" />
            إجراءات سريعة
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-right">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">تقارير الأداء</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">عرض الإحصائيات</p>
                </div>
              </div>
            </button>
            
            <button className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-right">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Settings className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">إعدادات الجودة</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">تخصيص المعايير</p>
                </div>
              </div>
            </button>
            
            <button className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-right">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">مراجعة الفريق</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">الحالات المعقدة</p>
                </div>
              </div>
            </button>
            
            <button className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-right">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <QrCode className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">مسح متقدم</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">كاميرا متطورة</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Real-time Activity Feed */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-brand-red-600" />
            النشاط المباشر
          </h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  تم فحص المنتج بنجاح
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  رقم التتبع: RTN-123456789 - قبل 2 دقيقة
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  منتج يتطلب مراجعة الفريق
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  رقم التتبع: RTN-987654321 - قبل 5 دقائق
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <ScanLine className="w-5 h-5 text-blue-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  تم مسح منتج جديد
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  رقم التتبع: RTN-456789123 - قبل 8 دقائق
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HubScanningPage;
