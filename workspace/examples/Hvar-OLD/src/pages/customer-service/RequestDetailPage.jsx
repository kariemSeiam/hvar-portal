import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, Button, StatusBadge } from '../../components/ui';
import api from '../../services/api';

// Icons
import {
  ArrowLeft,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Package,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  User,
  MessageSquare,
  FileText,
  Loader2,
  History,
  TrendingUp,
  DollarSign,
  Shield
} from 'lucide-react';
import { cn } from '../../utils/tailwind';

/**
 * Request Detail Page - View and manage a single service request
 * DNA Redesign: F-pattern layout with glass effects and micro-interactions
 */
const RequestDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Fetch request data
  useEffect(() => {
    const fetchRequestData = async () => {
      setLoading(true);
      try {
        // In a real app, this would be:
        // const data = await api.customerService.getRequest(id);
        
        // Mock data for demonstration
        await new Promise(resolve => setTimeout(resolve, 800));
        const mockData = {
          id: id,
          customer_id: '1001',
          customer_name: 'أحمد محمد',
          phone: '01023456789',
          email: 'ahmed@example.com',
          address: 'القاهرة، مصر',
          product_id: '101',
          product_code: 'HV-2000',
          product_name: 'مكيف هواء HVAR إكو',
          issue_description: 'جهاز التحكم عن بعد لا يعمل والوحدة لا تستجيب للأوامر',
          priority_level: 3,
          appointment_date: '2024-05-25',
          appointment_time: '10:30',
          notes: 'العميل سيكون متواجد في المنزل من الساعة 10 صباحا حتى 2 مساءً',
          status: 'pending',
          warranty_status: true,
          created_at: '2024-05-20 14:30',
          updated_at: '2024-05-21 09:15',
          assigned_to: 'محمد أحمد',
          request_type: 'repair',
          estimated_cost: 350,
          history: [
            {
              id: 1,
              action: 'create',
              user: 'سارة أحمد',
              timestamp: '2024-05-20 14:30',
              notes: 'تم إنشاء طلب الخدمة'
            },
            {
              id: 2,
              action: 'assign',
              user: 'علي محمود',
              timestamp: '2024-05-20 15:45',
              notes: 'تم تعيين الطلب إلى محمد أحمد'
            },
            {
              id: 3,
              action: 'update',
              user: 'محمد أحمد',
              timestamp: '2024-05-21 09:15',
              notes: 'تم جدولة موعد للزيارة'
            }
          ]
        };
        
        setRequest(mockData);
      } catch (error) {
        console.error('Error fetching request data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRequestData();
  }, [id]);
  
  // Handle status change
  const handleStatusChange = async (newStatus) => {
    setActionLoading(true);
    
    try {
      // In a real app, this would be:
      // await api.customerService.updateRequest(id, { status: newStatus });
      
      // Mock API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Update local state
      setRequest(prev => ({
        ...prev,
        status: newStatus,
        history: [
          ...prev.history,
          {
            id: prev.history.length + 1,
            action: 'status_change',
            user: 'المستخدم الحالي',
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
            notes: `تم تغيير الحالة إلى ${getStatusLabel(newStatus)}`
          }
        ]
      }));
    } catch (error) {
      console.error('Error updating request status:', error);
      alert('حدث خطأ أثناء تحديث حالة الطلب');
    } finally {
      setActionLoading(false);
    }
  };
  
  // Handle delete request
  const handleDelete = async () => {
    if (window.confirm('هل أنت متأكد من رغبتك في حذف هذا الطلب؟ هذا الإجراء لا يمكن التراجع عنه.')) {
      setActionLoading(true);
      
      try {
        // In a real app, this would be:
        // await api.customerService.deleteRequest(id);
        
        // Mock API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Navigate back to requests list
        navigate('/customer-service/requests');
      } catch (error) {
        console.error('Error deleting request:', error);
        alert('حدث خطأ أثناء حذف الطلب');
      } finally {
        setActionLoading(false);
      }
    }
  };
  
  // Get priority label and color
  const getPriorityInfo = (level) => {
    switch (level) {
      case 4:
        return { label: 'عاجلة', variant: 'danger', iconColor: 'text-red-500 dark:text-red-400' };
      case 3:
        return { label: 'عالية', variant: 'warning', iconColor: 'text-amber-500 dark:text-amber-400' };
      case 2:
        return { label: 'متوسطة', variant: 'info', iconColor: 'text-blue-500 dark:text-blue-400' };
      case 1:
        return { label: 'منخفضة', variant: 'success', iconColor: 'text-green-500 dark:text-green-400' };
      default:
        return { label: 'غير محدد', variant: 'default', iconColor: 'text-gray-500 dark:text-gray-400' };
    }
  };
  
  // Get request type label
  const getRequestTypeLabel = (type) => {
    switch (type) {
      case 'installation': return 'تركيب';
      case 'repair': return 'إصلاح';
      case 'maintenance': return 'صيانة';
      case 'inquiry': return 'استفسار';
      default: return type;
    }
  };
  
  // Get status label
  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'معلّق';
      case 'in_progress': return 'قيد التنفيذ';
      case 'completed': return 'مكتمل';
      case 'cancelled': return 'ملغي';
      case 'on_hold': return 'متوقف';
      default: return status;
    }
  };
  
  // Get action icon and color
  const getActionInfo = (action) => {
    switch (action) {
      case 'create':
        return { icon: <FileText size={16} />, bgColor: 'bg-blue-500/10 dark:bg-blue-500/20', iconColor: 'text-blue-500 dark:text-blue-400' };
      case 'update':
        return { icon: <Edit size={16} />, bgColor: 'bg-amber-500/10 dark:bg-amber-500/20', iconColor: 'text-amber-500 dark:text-amber-400' };
      case 'assign':
        return { icon: <User size={16} />, bgColor: 'bg-purple-500/10 dark:bg-purple-500/20', iconColor: 'text-purple-500 dark:text-purple-400' };
      case 'status_change':
        return { icon: <CheckCircle size={16} />, bgColor: 'bg-green-500/10 dark:bg-green-500/20', iconColor: 'text-green-500 dark:text-green-400' };
      default:
        return { icon: <MessageSquare size={16} />, bgColor: 'bg-gray-500/10 dark:bg-gray-500/20', iconColor: 'text-gray-500 dark:text-gray-400' };
    }
  };
  
  // Loading state - DNA skeleton
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-t-brand-red-600 border-gray-200 dark:border-gray-700 rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (!request) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 px-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
          <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">طلب الخدمة غير موجود</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">لم يتم العثور على طلب الخدمة المطلوب أو تم حذفه</p>
        <Button 
          onClick={() => navigate('/customer-service/requests')}
          className="hover-scale-102 active-scale-98"
        >
          العودة إلى قائمة الطلبات
        </Button>
      </div>
    );
  }
  
  const priorityInfo = getPriorityInfo(request.priority_level);
  
  return (
    <div className="max-w-[2000px] mx-auto">
      {/* Sticky Header - DNA F-pattern */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 mb-6 -mx-4 px-4 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm"
              className="p-2 hover-scale-102 active-scale-98"
              onClick={() => navigate('/customer-service/requests')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                طلب خدمة #{request.id}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {getRequestTypeLabel(request.request_type)} - {request.product_name}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 hover-scale-102 active-scale-98"
              onClick={() => navigate(`/customer-service/requests/${id}/edit`)}
              disabled={actionLoading}
            >
              <Edit className="w-4 h-4" />
              <span>تعديل</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 hover-scale-102 active-scale-98"
              onClick={handleDelete}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              <span>حذف</span>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main Content - DNA F-pattern: Max 800px content width */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
        {/* Main Content Area */}
        <div className="space-y-6 max-w-[800px]">
          {/* Quick Stats Card - DNA Glass Effect */}
          <Card variant="default" className="p-5 glass-effect">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">الحالة</div>
                <StatusBadge status={request.status} />
              </div>
              
              <div className="text-center p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">الأولوية</div>
                <div className={cn('font-semibold', priorityInfo.iconColor)}>
                  {priorityInfo.label}
                </div>
              </div>
              
              <div className="text-center p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">تاريخ الإنشاء</div>
                <div className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                  {request.created_at}
                </div>
              </div>
              
              <div className="text-center p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">الموظف المسؤول</div>
                <div className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                  {request.assigned_to || 'غير معين'}
                </div>
              </div>
            </div>
          </Card>
          
          {/* Status Change Card - DNA Primary Actions */}
          <Card variant="default" className="p-5">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-red-600 dark:text-brand-red-400" />
              تغيير الحالة
            </h2>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={request.status === 'pending' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleStatusChange('pending')}
                disabled={request.status === 'pending' || actionLoading}
                className="hover-scale-102 active-scale-98"
              >
                معلّق
              </Button>
              <Button
                variant={request.status === 'in_progress' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleStatusChange('in_progress')}
                disabled={request.status === 'in_progress' || actionLoading}
                className="hover-scale-102 active-scale-98"
              >
                قيد التنفيذ
              </Button>
              <Button
                variant={request.status === 'on_hold' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleStatusChange('on_hold')}
                disabled={request.status === 'on_hold' || actionLoading}
                className="hover-scale-102 active-scale-98"
              >
                متوقف
              </Button>
              <Button
                variant={request.status === 'completed' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleStatusChange('completed')}
                disabled={request.status === 'completed' || actionLoading}
                className={cn(
                  'hover-scale-102 active-scale-98',
                  request.status === 'completed' ? '' : 'text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20'
                )}
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin ml-1" />
                ) : (
                  <CheckCircle className="w-4 h-4 ml-1" />
                )}
                مكتمل
              </Button>
              <Button
                variant={request.status === 'cancelled' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleStatusChange('cancelled')}
                disabled={request.status === 'cancelled' || actionLoading}
                className={cn(
                  'hover-scale-102 active-scale-98',
                  request.status === 'cancelled' ? '' : 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20'
                )}
              >
                <XCircle className="w-4 h-4 ml-1" />
                ملغي
              </Button>
            </div>
          </Card>
          
          {/* Issue Description Card - DNA Content Block */}
          <Card variant="default" className="p-5">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-red-600 dark:text-brand-red-400" />
              وصف المشكلة
            </h2>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
              {request.issue_description}
            </p>
            
            {request.notes && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  ملاحظات إضافية
                </h3>
                <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line leading-relaxed">
                  {request.notes}
                </p>
              </div>
            )}
          </Card>
          
          {/* Appointment Details Card */}
          {(request.appointment_date || request.appointment_time) && (
            <Card variant="default" className="p-5">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-red-600 dark:text-brand-red-400" />
                تفاصيل الموعد
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {request.appointment_date && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        تاريخ الموعد
                      </h3>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {request.appointment_date}
                      </p>
                    </div>
                  </div>
                )}
                
                {request.appointment_time && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <Clock className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        وقت الموعد
                      </h3>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {request.appointment_time}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}
          
          {/* Request History Card - DNA Timeline */}
          <Card variant="default" className="p-5">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-brand-red-600 dark:text-brand-red-400" />
              سجل الطلب
            </h2>
            
            <div className="space-y-3 scrollbar-hide max-h-[400px] overflow-y-auto pr-2">
              {request.history.map((item, index) => {
                const actionInfo = getActionInfo(item.action);
                
                return (
                  <div 
                    key={item.id} 
                    className={cn(
                      'p-4 rounded-lg border transition-all duration-200 hover-scale-102',
                      actionInfo.bgColor,
                      'border-gray-200/50 dark:border-gray-700/50'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                        actionInfo.bgColor
                      )}>
                        <div className={actionInfo.iconColor}>
                          {actionInfo.icon}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {item.user}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 mr-2">
                            {item.timestamp}
                          </p>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {item.notes}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
        
        {/* Sidebar - DNA Supporting Info */}
        <div className="space-y-6">
          {/* Customer Info Card - DNA Glass Effect */}
          <Card variant="default" className="p-5 glass-effect">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-brand-red-600 dark:text-brand-red-400" />
              معلومات العميل
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm hover:bg-white/70 dark:hover:bg-gray-800/70 transition-colors duration-150">
                <User className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    الاسم
                  </h3>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {request.customer_name}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm hover:bg-white/70 dark:hover:bg-gray-800/70 transition-colors duration-150">
                <Phone className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    رقم الهاتف
                  </h3>
                  <p className="text-sm font-medium text-gray-900 dark:text-white" dir="ltr">
                    {request.phone}
                  </p>
                </div>
              </div>
              
              {request.email && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm hover:bg-white/70 dark:hover:bg-gray-800/70 transition-colors duration-150">
                  <Mail className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      البريد الإلكتروني
                    </h3>
                    <p className="text-sm font-medium text-gray-900 dark:text-white break-all" dir="ltr">
                      {request.email}
                    </p>
                  </div>
                </div>
              )}
              
              {request.address && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm hover:bg-white/70 dark:hover:bg-gray-800/70 transition-colors duration-150">
                  <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      العنوان
                    </h3>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {request.address}
                    </p>
                  </div>
                </div>
              )}
              
              <div className="pt-2">
                <Link to={`/customers/${request.customer_id}`}>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full hover-scale-102 active-scale-98"
                  >
                    عرض بيانات العميل
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
          
          {/* Product Info Card */}
          <Card variant="default" className="p-5 glass-effect">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-brand-red-600 dark:text-brand-red-400" />
              معلومات المنتج
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm hover:bg-white/70 dark:hover:bg-gray-800/70 transition-colors duration-150">
                <Package className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    المنتج
                  </h3>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {request.product_name}
                  </p>
                </div>
              </div>
              
              <div className="p-3 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  كود المنتج
                </h3>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {request.product_code}
                </p>
              </div>
              
              <div className="p-3 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  حالة الضمان
                </h3>
                <div className="mt-1">
                  {request.warranty_status ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                      <Shield className="w-3 h-3" />
                      ضمن فترة الضمان
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                      خارج فترة الضمان
                    </span>
                  )}
                </div>
              </div>
              
              {request.estimated_cost && (
                <div className="p-3 rounded-lg bg-gradient-to-r from-brand-red-500/10 to-brand-red-600/10 dark:from-brand-red-500/20 dark:to-brand-red-600/20 border border-brand-red-500/20 dark:border-brand-red-500/30">
                  <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    التكلفة التقديرية
                  </h3>
                  <p className="text-lg font-bold text-brand-red-600 dark:text-brand-red-400">
                    {request.estimated_cost} ج.م
                  </p>
                </div>
              )}
              
              <div className="pt-2">
                <Link to={`/products/${request.product_id}`}>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full hover-scale-102 active-scale-98"
                  >
                    عرض بيانات المنتج
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
          
          {/* Quick Actions Card - DNA Action Buttons */}
          <Card variant="default" className="p-5">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-brand-red-600 dark:text-brand-red-400" />
              إجراءات سريعة
            </h2>
            
            <div className="space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full flex items-center justify-center gap-2 hover-scale-102 active-scale-98"
              >
                <Phone className="w-4 h-4" />
                <span>اتصال بالعميل</span>
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full flex items-center justify-center gap-2 hover-scale-102 active-scale-98"
              >
                <Calendar className="w-4 h-4" />
                <span>جدولة موعد</span>
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full flex items-center justify-center gap-2 hover-scale-102 active-scale-98"
              >
                <FileText className="w-4 h-4" />
                <span>إنشاء تقرير</span>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RequestDetailPage;