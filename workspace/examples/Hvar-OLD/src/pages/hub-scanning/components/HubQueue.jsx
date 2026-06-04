import React, { useState, useEffect } from 'react';
import { 
  Archive, 
  ChevronDown, 
  ChevronUp, 
  Loader, 
  Server, 
  AlertTriangle,
  Clock,
  CheckCircle,
  Activity,
  Shield,
  TrendingUp,
  User,
  Package,
  MapPin,
  Calendar,
  Tag,
  DollarSign,
  RefreshCw,
  Filter,
  Search,
  Zap,
  Target,
  BarChart3,
  Settings,
  Bell,
  Star,
  Award,
  Eye,
  Play,
  Pause,
  XCircle,
  ScanLine,
  FileText,
  Shuffle
} from 'lucide-react';
import { api } from '../../../services/api';
import { useTheme } from '../../../components/ui/DesignSystem';

const HubQueue = ({ refreshKey, onRefresh, onItemSelect }) => {
  const { direction } = useTheme();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showHistory, setShowHistory] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [queueStats, setQueueStats] = useState({
    total: 0,
    requested: 0,
    in_progress: 0,
    hub_confirmed: 0,
    awaiting_review: 0,
    completed: 0,
    cancelled: 0
  });
  const [selectedItem, setSelectedItem] = useState(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  useEffect(() => {
    const fetchQueue = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch service actions with hub-related statuses using unified API
        const response = await api.unifiedCustomerService.getServiceActions({
          action_status: 'requested,in_progress,hub_confirmed,awaiting_review,completed',
          limit: 100,
          sort_by: 'created_at',
          sort_dir: 'desc'
        });
        
        if (response.success) {
          const actions = response.data || [];
          setItems(actions);
          
          // Calculate queue stats based on real status values
          const stats = {
            total: actions.length,
            requested: actions.filter(item => item.action_status === 'requested').length,
            in_progress: actions.filter(item => item.action_status === 'in_progress').length,
            hub_confirmed: actions.filter(item => item.action_status === 'hub_confirmed').length,
            awaiting_review: actions.filter(item => item.action_status === 'awaiting_review').length,
            completed: actions.filter(item => item.action_status === 'completed').length,
            cancelled: actions.filter(item => item.action_status === 'cancelled').length
          };
          setQueueStats(stats);
        } else {
          setError(response.error || 'فشل في جلب قائمة المعالجة.');
        }
      } catch (err) {
        setError('حدث خطأ غير متوقع أثناء جلب القائمة.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQueue();
  }, [refreshKey]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      'requested': { 
        color: 'yellow', 
        text: 'مطلوب', 
        icon: FileText,
        description: 'في انتظار المعالجة'
      },
      'in_progress': { 
        color: 'blue', 
        text: 'قيد التنفيذ', 
        icon: Activity,
        description: 'جاري المعالجة'
      },
      'hub_confirmed': { 
        color: 'green', 
        text: 'تم التأكيد', 
        icon: Shield,
        description: 'تم التأكيد من المركز'
      },
      'awaiting_review': { 
        color: 'orange', 
        text: 'في انتظار المراجعة', 
        icon: AlertTriangle,
        description: 'يتطلب مراجعة الفريق'
      },
      'completed': { 
        color: 'emerald', 
        text: 'مكتمل', 
        icon: CheckCircle,
        description: 'تم الإنجاز'
      },
      'cancelled': { 
        color: 'red', 
        text: 'ملغي', 
        icon: XCircle,
        description: 'تم الإلغاء'
      }
    };

    const config = statusConfig[status] || { 
      color: 'gray', 
      text: status, 
      icon: Server,
      description: 'حالة غير معروفة'
    };
    const Icon = config.icon;

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 bg-${config.color}-100 text-${config.color}-800 dark:bg-${config.color}-900/30 dark:text-${config.color}-400`}>
        <Icon className="w-3 h-3" />
        {config.text}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      'urgent': { color: 'red', text: 'عاجل', icon: AlertTriangle },
      'high': { color: 'orange', text: 'عالي', icon: TrendingUp },
      'medium': { color: 'yellow', text: 'متوسط', icon: Clock },
      'low': { color: 'green', text: 'منخفض', icon: CheckCircle }
    };

    const config = priorityConfig[priority] || { color: 'gray', text: priority, icon: FileText };
    const Icon = config.icon;
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 bg-${config.color}-100 text-${config.color}-800 dark:bg-${config.color}-900/30 dark:text-${config.color}-400`}>
        <Icon className="w-3 h-3" />
        {config.text}
      </span>
    );
  };

  const getActionTypeBadge = (actionType) => {
    const typeConfig = {
      'return_refund': { color: 'amber', text: 'استرداد', icon: RefreshCw },
      'maintenance': { color: 'purple', text: 'صيانة', icon: Settings },
      'exchange': { color: 'indigo', text: 'تبديل', icon: Shuffle },
      'service': { color: 'blue', text: 'خدمة', icon: Package },
      'premium_service': { color: 'emerald', text: 'خدمة مميزة', icon: Award }
    };

    const config = typeConfig[actionType] || { color: 'gray', text: actionType, icon: FileText };
    const Icon = config.icon;
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 bg-${config.color}-100 text-${config.color}-800 dark:bg-${config.color}-900/30 dark:text-${config.color}-400`}>
        <Icon className="w-3 h-3" />
        {config.text}
      </span>
    );
  };

  const handleItemClick = (item) => {
    setSelectedItem(selectedItem?.action_id === item.action_id ? null : item);
    if (onItemSelect) {
      onItemSelect(item);
    }
  };

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

  const handleScanAction = async (item) => {
    if (!item.return_tracking_number) {
      alert('لا يوجد رقم تتبع للعودة لهذا الإجراء');
      return;
    }

    setIsProcessingAction(true);
    try {
      // Normalize the tracking number before sending
      const normalizedTracking = normalizeTrackingNumber(item.return_tracking_number);
      const response = await api.unifiedCustomerService.hubScan({
        return_tracking_number: normalizedTracking,
        hub_agent: 'HubAgent001', // Should come from auth context
        scan_notes: 'Scanned via hub queue interface',
        product_condition: 'received'
      });

      if (response.success) {
        // Refresh the queue
        onRefresh?.();
        // Select the scanned item
        onItemSelect?.(item);
      } else {
        alert(`فشل في المسح: ${response.error}`);
      }
    } catch (err) {
      console.error('Error scanning item:', err);
      alert('حدث خطأ أثناء المسح');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleStatusUpdate = async (item, newStatus) => {
    setIsProcessingAction(true);
    try {
      const response = await api.serviceActions.updateServiceActionStatus(item.action_id, {
        status: newStatus,
        notes: `Status updated via hub queue interface`
      });

      if (response.success) {
        onRefresh?.();
      } else {
        alert(`فشل في تحديث الحالة: ${response.error}`);
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert('حدث خطأ أثناء تحديث الحالة');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesStatus = filterStatus === 'all' || item.action_status === filterStatus;
    const matchesSearch = searchTerm === '' || 
      item.return_tracking_number?.includes(searchTerm) ||
      item.product_name?.includes(searchTerm) ||
      item.customer_phone?.includes(searchTerm) ||
      item.tracking_number?.includes(searchTerm) ||
      item.action_id?.toString().includes(searchTerm);
    return matchesStatus && matchesSearch;
  });

  const StatCard = ({ icon: Icon, title, value, color = "blue" }) => (
    <div className={`p-3 bg-${color}-50 dark:bg-${color}-900/20 rounded-lg border border-${color}-200 dark:border-${color}-800`}>
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 text-${color}-600 dark:text-${color}-400`} />
        <div>
          <p className="text-xs text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
      </div>
    </div>
  );

  const QueueItem = ({ item, isSelected }) => (
    <div 
      className={`p-4 border-2 rounded-lg transition-all cursor-pointer ${
        isSelected 
          ? 'border-brand-red-500 bg-brand-red-50 dark:bg-brand-red-900/20' 
          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'
      }`}
      onClick={() => handleItemClick(item)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <p className="font-mono text-sm font-medium text-gray-900 dark:text-gray-200">
              {item.return_tracking_number || `ACTION-${item.action_id}`}
            </p>
            {getPriorityBadge(item.priority)}
            {getActionTypeBadge(item.action_type)}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            {item.product_name || 'غير محدد'}
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {item.customer_phone || 'غير محدد'}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(item.created_at).toLocaleDateString('ar-SA')}
            </span>
            {item.refund_amount && (
              <span className="flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                {item.refund_amount} ج.م
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {getStatusBadge(item.action_status)}
          {item.quality_score && (
            <div className="flex items-center gap-1 text-xs">
              <Star className="w-3 h-3 text-yellow-500" />
              <span className="text-gray-600 dark:text-gray-400">
                {item.quality_score}/10
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Additional details on hover/selection */}
      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-gray-500 dark:text-gray-400">رقم التتبع الرئيسي:</span>
            <p className="font-medium text-gray-900 dark:text-gray-200">
              {item.tracking_number || 'غير محدد'}
            </p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">سبب الخدمة:</span>
            <p className="font-medium text-gray-900 dark:text-gray-200">
              {item.service_reason || 'غير محدد'}
            </p>
          </div>
        </div>
        
        {/* Action buttons for selected item */}
        {isSelected && (
          <div className="mt-3 flex gap-2">
            {item.action_status === 'requested' && item.return_tracking_number && (
              <button 
                className="flex-1 px-3 py-1 bg-brand-red-600 text-white text-xs rounded-md hover:bg-brand-red-700 transition-colors disabled:opacity-50"
                onClick={(e) => {
                  e.stopPropagation();
                  handleScanAction(item);
                }}
                disabled={isProcessingAction}
              >
                <ScanLine className="w-3 h-3 inline mr-1" />
                مسح
              </button>
            )}
            
            {item.action_status === 'in_progress' && (
              <button 
                className="flex-1 px-3 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatusUpdate(item, 'hub_confirmed');
                }}
                disabled={isProcessingAction}
              >
                <Shield className="w-3 h-3 inline mr-1" />
                تأكيد
              </button>
            )}
            
            {item.action_status === 'hub_confirmed' && (
              <button 
                className="flex-1 px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatusUpdate(item, 'completed');
                }}
                disabled={isProcessingAction}
              >
                <CheckCircle className="w-3 h-3 inline mr-1" />
                إكمال
              </button>
            )}
            
            <button 
              className="flex-1 px-3 py-1 bg-gray-600 text-white text-xs rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50"
              onClick={(e) => {
                e.stopPropagation();
                // Handle view details
                console.log('View details:', item);
              }}
              disabled={isProcessingAction}
            >
              <Eye className="w-3 h-3 inline mr-1" />
              تفاصيل
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="w-full space-y-4" dir={direction}>
      {/* Queue Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div 
          className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-brand-red-50 to-brand-blue-50 dark:from-brand-red-900/20 dark:to-brand-blue-900/20 flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          onClick={() => setShowHistory(!showHistory)}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <Archive className="w-5 h-5 text-brand-red-600 dark:text-brand-red-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                قائمة المعالجة
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {queueStats.total} عنصر في القائمة
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRefresh?.();
              }}
              className="p-1 text-gray-600 dark:text-gray-400 hover:text-brand-red-600 dark:hover:text-brand-red-400 transition-colors"
              title="تحديث"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            {showHistory ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>

        {showHistory && (
          <div className="p-4 space-y-4">
            {/* Queue Stats */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard 
                icon={FileText} 
                title="مطلوب" 
                value={queueStats.requested} 
                color="yellow" 
              />
              <StatCard 
                icon={Activity} 
                title="قيد التنفيذ" 
                value={queueStats.in_progress} 
                color="blue" 
              />
              <StatCard 
                icon={Shield} 
                title="تم التأكيد" 
                value={queueStats.hub_confirmed} 
                color="green" 
              />
              <StatCard 
                icon={AlertTriangle} 
                title="في انتظار المراجعة" 
                value={queueStats.awaiting_review} 
                color="orange" 
              />
              <StatCard 
                icon={CheckCircle} 
                title="مكتمل" 
                value={queueStats.completed} 
                color="emerald" 
              />
              <StatCard 
                icon={XCircle} 
                title="ملغي" 
                value={queueStats.cancelled} 
                color="red" 
              />
            </div>

            {/* Search and Filter */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="البحث في القائمة..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pr-10 pl-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500"
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    filterStatus === 'all' 
                      ? 'bg-brand-red-600 text-white' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  الكل
                </button>
                <button
                  onClick={() => setFilterStatus('requested')}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    filterStatus === 'requested' 
                      ? 'bg-yellow-600 text-white' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  مطلوب
                </button>
                <button
                  onClick={() => setFilterStatus('in_progress')}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    filterStatus === 'in_progress' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  قيد التنفيذ
                </button>
                <button
                  onClick={() => setFilterStatus('hub_confirmed')}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    filterStatus === 'hub_confirmed' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  تم التأكيد
                </button>
                <button
                  onClick={() => setFilterStatus('awaiting_review')}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    filterStatus === 'awaiting_review' 
                      ? 'bg-orange-600 text-white' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  في انتظار المراجعة
                </button>
              </div>
            </div>

            {/* Queue Items */}
            <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-hide">
              {isLoading ? (
                <div className="p-6 text-center flex items-center justify-center gap-2 text-gray-500">
                  <Loader className="animate-spin w-5 h-5" />
                  <span>جاري تحميل القائمة...</span>
                </div>
              ) : error ? (
                <div className="p-6 text-center flex items-center justify-center gap-2 text-red-500">
                  <AlertTriangle className="w-5 h-5" />
                  <span>{error}</span>
                </div>
              ) : filteredItems.length > 0 ? (
                filteredItems.map(item => (
                  <QueueItem 
                    key={item.action_id} 
                    item={item} 
                    isSelected={selectedItem?.action_id === item.action_id}
                  />
                ))
              ) : (
                <div className="p-6 text-center text-gray-500 flex flex-col items-center gap-2">
                  <Server className="w-8 h-8" />
                  <p>القائمة فارغة.</p>
                  <p className="text-sm">لا توجد عناصر في قائمة المعالجة.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-brand-red-600" />
          إجراءات سريعة
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <button className="p-2 text-center border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-xs">
            <div className="flex items-center justify-center gap-1 mb-1">
              <BarChart3 className="w-3 h-3 text-blue-600" />
              <span className="font-medium text-gray-900 dark:text-white">التقارير</span>
            </div>
            <span className="text-gray-500 dark:text-gray-400">عرض الإحصائيات</span>
          </button>
          
          <button className="p-2 text-center border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-xs">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Settings className="w-3 h-3 text-green-600" />
              <span className="font-medium text-gray-900 dark:text-white">الإعدادات</span>
            </div>
            <span className="text-gray-500 dark:text-gray-400">تخصيص القائمة</span>
          </button>
          
          <button className="p-2 text-center border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-xs">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Bell className="w-3 h-3 text-purple-600" />
              <span className="font-medium text-gray-900 dark:text-white">الإشعارات</span>
            </div>
            <span className="text-gray-500 dark:text-gray-400">إعداد التنبيهات</span>
          </button>
          
          <button className="p-2 text-center border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-xs">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Award className="w-3 h-3 text-amber-600" />
              <span className="font-medium text-gray-900 dark:text-white">الأداء</span>
            </div>
            <span className="text-gray-500 dark:text-gray-400">تحليل الكفاءة</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HubQueue; 