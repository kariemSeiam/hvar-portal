import React, { useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Package, 
  User, 
  FileText, 
  ChevronRight, 
  Clock,
  MapPin,
  Phone,
  Mail,
  AlertTriangle,
  Star,
  Shield,
  Award,
  TrendingUp,
  Activity,
  Settings,
  Zap,
  Target,
  BarChart3,
  Calendar,
  Tag,
  DollarSign,
  Truck,
  Home,
  Building,
  Globe,
  RefreshCw,
  Eye,
  Play,
  Pause
} from 'lucide-react';
import { Button } from '../../../components/ui';
import InspectionForm from './InspectionForm';
import { useTheme } from '../../../components/ui/DesignSystem';

const DetailRow = ({ icon, label, value, status, className = "" }) => (
  <div className={`flex items-start py-3 border-b border-gray-100 dark:border-gray-800 last:border-b-0 ${className}`}>
    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-gray-400">
      {icon}
    </div>
    <div className="flex-1 mr-3">
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <p className="text-base font-semibold text-gray-800 dark:text-gray-200">{value}</p>
        {status && (
          <span className={`px-2 py-1 text-xs rounded-full ${
            status === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
            status === 'warning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
            status === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
            'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
          }`}>
            {status}
          </span>
        )}
      </div>
    </div>
  </div>
);

const StatusBadge = ({ status, priority }) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'requested':
        return { color: 'yellow', text: 'في انتظار المسح', icon: Clock };
      case 'scanned':
        return { color: 'blue', text: 'تم المسح', icon: CheckCircle };
      case 'awaiting_inspection':
        return { color: 'purple', text: 'في انتظار الفحص', icon: Activity };
      case 'hub_confirmed':
        return { color: 'green', text: 'تم التأكيد', icon: Shield };
      case 'awaiting_review':
        return { color: 'orange', text: 'في انتظار المراجعة', icon: AlertTriangle };
      case 'completed':
        return { color: 'green', text: 'مكتمل', icon: CheckCircle };
      case 'cancelled':
        return { color: 'red', text: 'ملغي', icon: XCircle };
      default:
        return { color: 'gray', text: status, icon: FileText };
    }
  };

  const getPriorityConfig = (priority) => {
    switch (priority) {
      case 'urgent':
        return { color: 'red', text: 'عاجل', icon: AlertTriangle };
      case 'high':
        return { color: 'orange', text: 'عالي', icon: TrendingUp };
      case 'medium':
        return { color: 'yellow', text: 'متوسط', icon: Clock };
      case 'low':
        return { color: 'green', text: 'منخفض', icon: CheckCircle };
      default:
        return { color: 'gray', text: priority, icon: FileText };
    }
  };

  const statusConfig = getStatusConfig(status);
  const priorityConfig = getPriorityConfig(priority);
  const StatusIcon = statusConfig.icon;
  const PriorityIcon = priorityConfig.icon;

  return (
    <div className="flex flex-wrap gap-2">
      <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 bg-${statusConfig.color}-100 text-${statusConfig.color}-800 dark:bg-${statusConfig.color}-900/30 dark:text-${statusConfig.color}-400`}>
        <StatusIcon className="w-4 h-4" />
        {statusConfig.text}
      </span>
      <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 bg-${priorityConfig.color}-100 text-${priorityConfig.color}-800 dark:bg-${priorityConfig.color}-900/30 dark:text-${priorityConfig.color}-400`}>
        <PriorityIcon className="w-4 h-4" />
        {priorityConfig.text}
      </span>
    </div>
  );
};

const ScanResult = ({ scanResult, onInspectionSubmit, isInspecting, onCancel }) => {
  const { direction } = useTheme();
  const [activeTab, setActiveTab] = useState('details');

  if (!scanResult) return null;

  const { action_details } = scanResult;
  const customerDetails = action_details.customer_details || {};
  const orderDetails = action_details.order_details || {};
  const hubConfirmation = action_details.hub_confirmation || {};
  const parts = action_details.parts || [];

  const TabButton = ({ id, label, icon: Icon, active }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
        active 
          ? 'bg-brand-red-600 text-white shadow-lg' 
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );

  return (
    <div className="w-full space-y-6" dir={direction}>
      {/* Success Header */}
      <div className="bg-gradient-to-r from-green-50 to-brand-red-50 dark:from-green-900/20 dark:to-brand-red-900/20 rounded-xl border border-green-200 dark:border-green-800 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">تم المسح بنجاح</h2>
              <p className="text-gray-600 dark:text-gray-400 font-mono text-lg">
                {action_details.return_tracking_number || `ACTION-${action_details.action_id}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={action_details.action_status} priority={action_details.priority} />
            <Button variant="ghost" size="icon" onClick={onCancel} className="p-2">
              <XCircle className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-wrap gap-2">
          <TabButton 
            id="details" 
            label="تفاصيل الخدمة" 
            icon={FileText} 
            active={activeTab === 'details'} 
          />
          <TabButton 
            id="customer" 
            label="معلومات العميل" 
            icon={User} 
            active={activeTab === 'customer'} 
          />
          <TabButton 
            id="order" 
            label="تفاصيل الطلب" 
            icon={Package} 
            active={activeTab === 'order'} 
          />
          <TabButton 
            id="parts" 
            label="القطع" 
            icon={Tag} 
            active={activeTab === 'parts'} 
          />
          <TabButton 
            id="inspection" 
            label="الفحص" 
            icon={Target} 
            active={activeTab === 'inspection'} 
          />
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        {activeTab === 'details' && (
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-red-600" />
              تفاصيل إجراء الخدمة
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <DetailRow 
                  icon={<FileText size={20} />} 
                  label="رقم الإجراء" 
                  value={`#${action_details.action_id}`}
                  status="success"
                />
                <DetailRow 
                  icon={<Package size={20} />} 
                  label="اسم المنتج" 
                  value={action_details.product_name || 'غير محدد'}
                />
                <DetailRow 
                  icon={<Tag size={20} />} 
                  label="نوع الإجراء" 
                  value={action_details.action_type || 'غير محدد'}
                />
                <DetailRow 
                  icon={<Calendar size={20} />} 
                  label="تاريخ الإنشاء" 
                  value={new Date(action_details.created_at).toLocaleDateString('ar-SA')}
                />
              </div>
              <div className="space-y-1">
                <DetailRow 
                  icon={<DollarSign size={20} />} 
                  label="مبلغ الاسترداد" 
                  value={`${action_details.refund_amount || 0} ج.م`}
                />
                <DetailRow 
                  icon={<Building size={20} />} 
                  label="المركز المخصص" 
                  value={action_details.assigned_hub || 'غير محدد'}
                />
                <DetailRow 
                  icon={<User size={20} />} 
                  label="الفني المخصص" 
                  value={action_details.assigned_technician || 'غير محدد'}
                />
                <DetailRow 
                  icon={<Clock size={20} />} 
                  label="آخر تحديث" 
                  value={new Date(action_details.updated_at || action_details.created_at).toLocaleString('ar-SA')}
                />
              </div>
            </div>
            
            {/* Service Reason */}
            {action_details.service_reason && (
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">سبب الخدمة</h4>
                <p className="text-gray-900 dark:text-gray-100">{action_details.service_reason}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'customer' && (
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <User className="w-5 h-5 text-brand-red-600" />
              معلومات العميل
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <DetailRow 
                  icon={<Phone size={20} />} 
                  label="رقم الهاتف" 
                  value={action_details.customer_phone || 'غير محدد'}
                />
                <DetailRow 
                  icon={<User size={20} />} 
                  label="اسم العميل" 
                  value={customerDetails.full_name || 'غير محدد'}
                />
                <DetailRow 
                  icon={<Tag size={20} />} 
                  label="فئة العميل" 
                  value={customerDetails.customer_segment || 'غير محدد'}
                />
                <DetailRow 
                  icon={<BarChart3 size={20} />} 
                  label="إجمالي الطلبات" 
                  value={customerDetails.total_orders || 0}
                />
              </div>
              <div className="space-y-1">
                <DetailRow 
                  icon={<MapPin size={20} />} 
                  label="المدينة" 
                  value={customerDetails.city || orderDetails.dropoff_city_name_ar || 'غير محدد'}
                />
                <DetailRow 
                  icon={<Home size={20} />} 
                  label="المنطقة" 
                  value={customerDetails.zone || orderDetails.dropoff_zone_name_ar || 'غير محدد'}
                />
                <DetailRow 
                  icon={<Calendar size={20} />} 
                  label="تاريخ التسجيل" 
                  value={customerDetails.created_at ? new Date(customerDetails.created_at).toLocaleDateString('ar-SA') : 'غير محدد'}
                />
                <DetailRow 
                  icon={<Star size={20} />} 
                  label="معدل الرضا" 
                  value={customerDetails.satisfaction_score ? `${customerDetails.satisfaction_score}/10` : 'غير محدد'}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'order' && (
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <Package className="w-5 h-5 text-brand-red-600" />
              تفاصيل الطلب
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <DetailRow 
                  icon={<FileText size={20} />} 
                  label="رقم التتبع الرئيسي" 
                  value={action_details.tracking_number || 'غير محدد'}
                />
                <DetailRow 
                  icon={<Package size={20} />} 
                  label="اسم المنتج" 
                  value={orderDetails.product_name || action_details.product_name || 'غير محدد'}
                />
                <DetailRow 
                  icon={<DollarSign size={20} />} 
                  label="قيمة الطلب" 
                  value={`${orderDetails.cod || 0} ج.م`}
                />
                <DetailRow 
                  icon={<Calendar size={20} />} 
                  label="تاريخ الطلب" 
                  value={orderDetails.created_at ? new Date(orderDetails.created_at).toLocaleDateString('ar-SA') : 'غير محدد'}
                />
              </div>
              <div className="space-y-1">
                <DetailRow 
                  icon={<Truck size={20} />} 
                  label="حالة التوصيل" 
                  value={orderDetails.state_value || 'غير محدد'}
                />
                <DetailRow 
                  icon={<MapPin size={20} />} 
                  label="عنوان التوصيل" 
                  value={orderDetails.dropoff_first_line || 'غير محدد'}
                />
                <DetailRow 
                  icon={<Clock size={20} />} 
                  label="وقت التوصيل" 
                  value={orderDetails.delivery_time_hours ? `${orderDetails.delivery_time_hours} ساعة` : 'غير محدد'}
                />
                <DetailRow 
                  icon={<Activity size={20} />} 
                  label="عدد المحاولات" 
                  value={orderDetails.attempts_count || 0}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'parts' && (
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <Tag className="w-5 h-5 text-brand-red-600" />
              القطع المرتبطة
            </h3>
            {parts.length > 0 ? (
              <div className="space-y-4">
                {parts.map((part, index) => (
                  <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">رمز القطعة</p>
                        <p className="font-mono text-gray-900 dark:text-gray-200">{part.sku}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">نوع الإجراء</p>
                        <p className="text-gray-900 dark:text-gray-200">{part.action_type || 'غير محدد'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">الحالة</p>
                        <p className="text-gray-900 dark:text-gray-200">{part.condition_after || 'غير محدد'}</p>
                      </div>
                    </div>
                    {part.notes && (
                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                        <p className="text-sm text-gray-600 dark:text-gray-400">{part.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <Tag className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>لا توجد قطع مرتبطة</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'inspection' && (
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <Target className="w-5 h-5 text-brand-red-600" />
              فحص المنتج
            </h3>
            
            {/* Hub Confirmation Status */}
            {hubConfirmation.confirmation_status && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">حالة التأكيد من المركز</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">الحالة</p>
                    <p className="font-medium text-gray-900 dark:text-gray-200">{hubConfirmation.confirmation_status}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">حالة المنتج</p>
                    <p className="font-medium text-gray-900 dark:text-gray-200">{hubConfirmation.product_condition || 'غير محدد'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">نقاط الجودة</p>
                    <p className="font-medium text-gray-900 dark:text-gray-200">{hubConfirmation.quality_score ? `${hubConfirmation.quality_score}/10` : 'غير محدد'}</p>
                  </div>
                </div>
                {hubConfirmation.inspection_notes && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400">{hubConfirmation.inspection_notes}</p>
                  </div>
                )}
              </div>
            )}
            
            {/* Inspection Form */}
            <InspectionForm
              onSubmit={onInspectionSubmit}
              isInspecting={isInspecting}
              actionDetails={action_details}
            />
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
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
                <p className="font-medium text-gray-900 dark:text-white">عرض التاريخ</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">سجل العميل</p>
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
                <TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">تحليل الأداء</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">إحصائيات مفصلة</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScanResult; 