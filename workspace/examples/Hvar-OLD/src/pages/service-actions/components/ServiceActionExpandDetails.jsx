import React from 'react';
import {
  Loader,
  Package,
  User,
  Phone,
  MapPin,
  Calendar,
  Wrench,
  FileText,
  Building,
  AlertOctagon,
  Award,
  Truck,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Star,
  Shield,
  Zap,
  Info,
  ExternalLink,
  Circle,
  ArrowRight,
  Play,
  Pause,
  StopCircle,
  Timer,
  Activity,
  BarChart3,
  Settings,
  MoreVertical,
  Edit,
  Trash2,
  RefreshCw,
  Copy,
  Eye,
  Users,
  MessageSquare,
  Bell,
  Mail,
  Navigation,
  Home,
  LogOut,
  Sun,
  Moon,
  BarChart,
  Activity as ActivityIcon,
  Grid3X3,
  List,
  FilterX,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  Search,
  Filter,

  AlertCircle,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { StatusBadge, Button, Badge } from '../../../components/ui';
import { formatDate, getStatusColor, getPriorityColor, getActionTypeLabel, getStatusLabel, getPriorityLabel, formatCurrency } from '../utils';

const ServiceActionExpandDetails = ({ action, details, isLoading }) => {
  const formatTime = (date) => date ? new Date(date).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }) : '--';

  if (isLoading) {
    return (
      <div className="w-full bg-white dark:bg-gray-900 p-6">
        <div className="flex items-center justify-center py-8">
        <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-lg px-4 py-3 shadow-sm border border-gray-200 dark:border-gray-700">
          <Loader className="w-5 h-5 text-brand-red-500 animate-spin" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">جاري تحميل التفاصيل...</span>
          </div>
        </div>
      </div>
    );
  }

  // Get action type icon with better visual hierarchy
  const getActionTypeIcon = (actionType) => {
    switch (actionType) {
      case 'maintenance': return <Wrench className="w-4 h-4 text-blue-600" />;
      case 'service': return <Wrench className="w-4 h-4 text-green-600" />;
      case 'return_refund': return <AlertOctagon className="w-4 h-4 text-red-600" />;
      case 'exchange': return <Package className="w-4 h-4 text-purple-600" />;
      case 'premium_service': return <Award className="w-4 h-4 text-amber-600" />;
      case 'delivery_support': return <Truck className="w-4 h-4 text-cyan-600" />;
      default: return <Wrench className="w-4 h-4 text-gray-600" />;
    }
  };

  // Enhanced priority display with clean, simple design
  const getPriorityDisplay = (priority) => {
    const priorityConfig = {
      'urgent': {
        icon: <AlertCircle className="w-3.5 h-3.5 text-red-500" />,
        className: 'text-red-700 dark:text-red-300',
        label: 'عاجلة'
      },
      'high': {
        icon: <ArrowUp className="w-3.5 h-3.5 text-orange-500" />,
        className: 'text-orange-700 dark:text-orange-300',
        label: 'عالية'
      },
      'medium': {
        icon: <Minus className="w-3.5 h-3.5 text-blue-500" />,
        className: 'text-blue-700 dark:text-blue-300',
        label: 'متوسطة'
      },
      'low': {
        icon: <ArrowDown className="w-3.5 h-3.5 text-green-500" />,
        className: 'text-green-700 dark:text-green-300',
        label: 'منخفضة'
      }
    };

    const config = priorityConfig[priority] || {
      icon: <Circle className="w-3.5 h-3.5 text-gray-500" />,
      className: 'text-gray-700 dark:text-gray-300',
      label: getPriorityLabel(priority)
    };

    return (
      <div className={`inline-flex items-center gap-1.5 text-xs font-medium ${config.className}`}>
        {config.icon}
        <span>{config.label}</span>
      </div>
    );
  };

  // Get status icon with better visual feedback
  const getStatusIcon = (status) => {
    switch (status) {
      case 'requested': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'in_progress': return <Play className="w-4 h-4 text-orange-500" />;
      case 'hub_confirmed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'awaiting_review': return <AlertTriangle className="w-4 h-4 text-purple-500" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'cancelled': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  // Calculate time since creation
  const getTimeSinceCreation = () => {
    const created = new Date(action.created_at);
    const now = new Date();
    const diffMs = now - created;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `${diffDays} يوم`;
    if (diffHours > 0) return `${diffHours} ساعة`;
    return 'أقل من ساعة';
  };

  // Get priority icon
  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'high': return <TrendingUp className="w-4 h-4 text-orange-500" />;
      case 'medium': return <Circle className="w-4 h-4 text-blue-500" />;
      case 'low': return <Circle className="w-4 h-4 text-green-500" />;
      default: return <Circle className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="w-full bg-white dark:bg-gray-900 p-6">
      <div className="w-full space-y-6">

        {/* Header Section - Action Overview */}
        <div className="w-full bg-gradient-to-r from-brand-red-50 to-brand-red-100 dark:from-brand-red-900/20 dark:to-brand-red-900/10 rounded-xl border border-brand-red-200 dark:border-brand-red-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-brand-red-500 to-brand-red-600 rounded-xl flex items-center justify-center shadow-lg">
                {getActionTypeIcon(action.action_type)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  إجراء #{action.action_id}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {getActionTypeLabel(action.action_type)} - {getTimeSinceCreation()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {getStatusIcon(action.action_status)}
                <div className={`
                  px-3 py-1.5 text-xs font-medium rounded-lg text-center whitespace-nowrap flex-shrink-0
                  ${getStatusColor(action.action_status) === 'blue' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border border-blue-200 dark:border-blue-700' :
                    getStatusColor(action.action_status) === 'amber' ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300 border border-amber-200 dark:border-amber-700' :
                    getStatusColor(action.action_status) === 'green' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 border border-green-200 dark:border-green-700' :
                    getStatusColor(action.action_status) === 'purple' ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300 border border-purple-200 dark:border-purple-700' :
                    getStatusColor(action.action_status) === 'red' ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300 border border-red-200 dark:border-red-700' :
                    'bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300 border border-gray-200 dark:border-gray-700'}
                `}>
                  {getStatusLabel(action.action_status)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getPriorityDisplay(action.priority)}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">العميل</span>
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                {action.customer_name || 'غير محدد'}
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">الموقع</span>
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                {action.customer_city || action.city_name || 'غير محدد'}
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">التاريخ</span>
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                {action.created_at ? new Date(action.created_at).toLocaleDateString('ar-EG', { 
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                }).replace(/\//g, '-') : 'غير محدد'}
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">القطع</span>
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                {action.parts_count || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Customer & Order Details */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Customer Information Card */}
            <div className="w-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white">معلومات العميل</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">بيانات العميل الأساسية</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <User className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {action.customer_name || 'غير محدد'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">اسم العميل</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {action.customer_phone}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">رقم الهاتف</p>
                  </div>
                </div>
                
                {action.customer_segment && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <Star className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {action.customer_segment}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">فئة العميل</p>
                    </div>
                  </div>
                )}
                
                {action.customer_total_orders && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <Package className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {action.customer_total_orders} طلب
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">إجمالي الطلبات</p>
              </div>
            </div>
                )}
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = `/customers/${action.customer_phone}`}
                  className="w-full"
                >
                  <Users className="w-4 h-4 ml-2" />
                  عرض ملف العميل
                </Button>
            </div>
          </div>

            {/* Location Information Card */}
            <div className="w-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-sm">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white">معلومات العنوان</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">موقع الخدمة</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {action.customer_city || action.city_name || 'غير محدد'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">المدينة</p>
                  </div>
                </div>
                
                {action.district_name && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <Navigation className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {action.district_name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">الحي</p>
                    </div>
                  </div>
                )}
                
                {action.zone_name && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <Home className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {action.zone_name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">المنطقة</p>
                    </div>
                  </div>
                )}
                
                {action.address && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {action.address}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">العنوان التفصيلي</p>
                </div>
                  </div>
                )}
              </div>
            </div>
        </div>

          {/* Center Column - Action Details & Timeline */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Action Details Card */}
            <div className="w-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-brand-red-500 to-brand-red-600 rounded-xl flex items-center justify-center shadow-sm">
                  {getActionTypeIcon(action.action_type)}
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white">تفاصيل الإجراء</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">معلومات الخدمة الأساسية</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">نوع الإجراء:</span>
                  <div className={`
                    px-3 py-1.5 text-xs font-medium rounded-lg text-center whitespace-nowrap flex-shrink-0
                    ${getActionTypeLabel(action.action_type) === 'صيانة' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border border-blue-200 dark:border-blue-700' :
                      getActionTypeLabel(action.action_type) === 'خدمة' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 border border-green-200 dark:border-green-700' :
                      getActionTypeLabel(action.action_type) === 'إرجاع/استرداد' ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300 border border-red-200 dark:border-red-700' :
                      getActionTypeLabel(action.action_type) === 'تبديل' ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300 border border-purple-200 dark:border-purple-700' :
                      getActionTypeLabel(action.action_type) === 'خدمة متميزة' ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300 border border-amber-200 dark:border-amber-700' :
                      getActionTypeLabel(action.action_type) === 'دعم التوصيل' ? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-700' :
                      'bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300 border border-gray-200 dark:border-gray-700'}
                  `}>
                    {getActionTypeLabel(action.action_type)}
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">الحالة:</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(action.action_status)}
                    <div className={`
                      px-3 py-1.5 text-xs font-medium rounded-lg text-center whitespace-nowrap flex-shrink-0
                      ${getStatusColor(action.action_status) === 'blue' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border border-blue-200 dark:border-blue-700' :
                        getStatusColor(action.action_status) === 'amber' ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300 border border-amber-200 dark:border-amber-700' :
                        getStatusColor(action.action_status) === 'green' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 border border-green-200 dark:border-green-700' :
                        getStatusColor(action.action_status) === 'purple' ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300 border border-purple-200 dark:border-purple-700' :
                        getStatusColor(action.action_status) === 'red' ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300 border border-red-200 dark:border-red-700' :
                        'bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300 border border-gray-200 dark:border-gray-700'}
                    `}>
                      {getStatusLabel(action.action_status)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">الأولوية:</span>
                  <div className="flex items-center gap-2">
                    {getPriorityDisplay(action.priority)}
                  </div>
                </div>
                
              {action.assigned_technician && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">الفني المكلف:</span>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {action.assigned_technician}
                      </span>
                    </div>
                  </div>
                )}
                
                {action.refund_amount && action.refund_amount > 0 && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">مبلغ الاسترداد:</span>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(action.refund_amount)}
                      </span>
                    </div>
                </div>
              )}
            </div>
          </div>

            {/* Timeline Card */}
            <div className="w-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white">التوقيت والملاحظات</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">معلومات إضافية</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {action.created_at ? new Date(action.created_at).toLocaleDateString('ar-EG', { 
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      }).replace(/\//g, '-') : 'غير محدد'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">تاريخ الإنشاء</p>
                  </div>
                </div>
                
                {action.updated_at && action.updated_at !== action.created_at && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {new Date(action.updated_at).toLocaleDateString('ar-EG', { 
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        }).replace(/\//g, '-')}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">آخر تحديث</p>
                    </div>
                  </div>
                )}

                {action.completed_at && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {new Date(action.completed_at).toLocaleDateString('ar-EG', { 
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        }).replace(/\//g, '-')}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">تاريخ الإكمال</p>
                    </div>
                  </div>
                )}

                {action.service_notes && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">ملاحظات خاصة</span>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {action.service_notes}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Order & Parts Information */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Order Information Card */}
            {action.tracking_number && (
              <div className="w-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-sm">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">معلومات الطلب</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">طلب مرتبط</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <Package className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {action.tracking_number}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">رقم التتبع</p>
          </div>
        </div>

                  {details?.order_details && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {details.order_details.state_value}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">حالة الطلب</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/orders/${action.tracking_number}`, '_blank')}
                      className="w-full"
                    >
                      <Eye className="w-4 h-4 ml-2" />
                      عرض الطلب
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Parts Information Card */}
            {details?.parts && details.parts.length > 0 && (
              <div className="w-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-sm">
                    <Wrench className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">القطع المستخدمة</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">أجزاء وقطع</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {details.parts.map((part, index) => (
                    <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {part.sku}
                          </span>
                        </div>
                        <StatusBadge 
                          status={part.action_type} 
                          variant="blue"
                          size="sm"
                        />
                      </div>
                      {part.notes && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {part.notes}
                        </p>
                      )}
                      {part.quantity && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">الكمية:</span>
                          <Badge variant="outline" className="text-xs">
                            {part.quantity}
                          </Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hub Confirmation Card */}
            {details?.hub_confirmation && (
              <div className="w-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
                    <Building className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">تأكيد المحور</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">فحص الجودة</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">الحالة</span>
                      <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                        {details.hub_confirmation.confirmation_status}
                      </p>
                  </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">جودة المنتج</span>
                      <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                        {details.hub_confirmation.quality_score}/10
                      </p>
                    </div>
                  </div>
                  
                {details.hub_confirmation.inspection_notes && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">ملاحظات الفحص</span>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                        {details.hub_confirmation.inspection_notes}
                      </p>
                  </div>
                )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Additional Details Section */}
        {details && (
          <div className="w-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                <Info className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white">تفاصيل إضافية</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">معلومات إضافية من النظام</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(details).map(([key, value]) => {
                if (key === 'parts' || key === 'hub_confirmation' || !value) return null;
                
                return (
                  <div key={key} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                      {key.replace(/_/g, ' ')}
                    </span>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceActionExpandDetails; 