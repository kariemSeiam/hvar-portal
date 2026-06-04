import React, { memo, useState } from 'react';
import { 
  Eye, 
  Users, 
  ChevronUp, 
  ChevronDown, 
  Play, 
  CheckCircle, 
  XCircle,
  Clock,
  AlertTriangle,
  Package,
  Wrench,
  Truck,
  Award,
  AlertOctagon,
  Phone,
  MapPin,
  Calendar,
  FileText,
  MoreVertical,
  Edit,
  Trash2,
  RefreshCw,
  Zap,
  Shield,
  Star,
  Info,
  ExternalLink,
  Circle,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Loader,
  User,
  Crown,
  Heart,
  AlertCircle,
  CheckCircle2,
  Clock2,
  Timer,
  DollarSign,
  Flame,
  Bolt,
  Target,
  Sparkles,
  ChevronRight,
  MoreHorizontal,
  Check,
  ArrowUp,
  Minus,
  ArrowDown
} from 'lucide-react';
import { StatusBadge, Button, Badge } from '../../../components/ui';
import ServiceActionExpandDetails from './ServiceActionExpandDetails';
import { formatDate, getStatusColor, getPriorityColor, getActionTypeLabel, getStatusLabel, getPriorityLabel } from '../utils';

const ServiceActionRow = memo(({ 
  action, 
  isExpanded, 
  actionDetails, 
  isLoadingDetails,
  toggleActionExpansion, 
  onStatusUpdate, 
  onSelect, 
  isSelected 
}) => {
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const actionId = action.action_id;
  
  const handleRowClick = (e) => {
    // Don't expand if clicking on buttons or links
    if (e.target.closest('button') || e.target.closest('a') || e.target.closest('input')) {
      return;
    }
    toggleActionExpansion();
  };

  const handleStatusUpdate = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      await onStatusUpdate(actionId, newStatus);
    } finally {
      setUpdatingStatus(false);
    }
  };

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

  // Calculate time since creation with better formatting
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

  // Calculate days since creation for the new design
  const getTimeSinceCreationDays = () => {
    const created = new Date(action.created_at);
    const now = new Date();
    const diffMs = now - created;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Helper function to truncate customer name to max 3 names
  const truncateCustomerName = (fullName) => {
    if (!fullName) return 'غير محدد';
    
    const names = fullName.trim().split(' ').filter(name => name.length > 0);
    if (names.length <= 3) return fullName;
    
    return names.slice(0, 3).join(' ') + '...';
  };

  // Enhanced customer segment badge with better styling
  const getCustomerSegmentBadge = (segment) => {
    if (!segment) return null;
    
    const segmentConfig = {
      'vip': {
        icon: <Crown className="w-3 h-3" />,
        className: 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 dark:from-amber-900/30 dark:to-yellow-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-700',
        label: 'VIP'
      },
      'regular': {
        icon: <Heart className="w-3 h-3" />,
        className: 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 dark:from-blue-900/30 dark:to-indigo-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-700',
        label: 'منتظم'
      },
      'new': {
        icon: <Star className="w-3 h-3" />,
        className: 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 dark:from-green-900/30 dark:to-emerald-900/30 dark:text-green-300 border border-green-200 dark:border-green-700',
        label: 'جديد'
      },
      'problematic': {
        icon: <AlertCircle className="w-3 h-3" />,
        className: 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 dark:from-red-900/30 dark:to-pink-900/30 dark:text-red-300 border border-red-200 dark:border-red-700',
        label: 'مشكل'
      }
    };

    const config = segmentConfig[segment] || {
      icon: <User className="w-3 h-3" />,
      className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300 border border-gray-200 dark:border-gray-700',
      label: segment
    };

    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg whitespace-nowrap flex-shrink-0 ${config.className}`} title={config.label}>
        {config.icon}
        <span>{config.label}</span>
      </div>
    );
  };

  // Get customer segment icon with tooltip
  const getCustomerSegmentIcon = (segment) => {
    if (!segment) return <User className="w-4 h-4 text-gray-400" />;
    
    const iconConfig = {
      'vip': <Crown className="w-4 h-4 text-amber-500" />,
      'regular': <Heart className="w-4 h-4 text-blue-500" />,
      'new': <Star className="w-4 h-4 text-green-500" />,
      'problematic': <AlertCircle className="w-4 h-4 text-red-500" />
    };

    return iconConfig[segment] || <User className="w-4 h-4 text-gray-400" />;
  };

  // Get customer segment tooltip text
  const getCustomerSegmentTooltip = (segment) => {
    if (!segment) return 'عميل عادي';
    
    const tooltipConfig = {
      'vip': 'عميل VIP - عميل متميز',
      'regular': 'عميل منتظم - عميل دائم',
      'new': 'عميل جديد - عميل حديث',
      'problematic': 'عميل مشكل - يحتاج اهتمام خاص'
    };

    return tooltipConfig[segment] || 'عميل عادي';
  };

  return (
    <React.Fragment key={actionId}>
      <tr 
        className={`
          hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 cursor-pointer
          ${isExpanded ? 'bg-brand-red-50 dark:bg-brand-red-900/10' : ''}
          ${isSelected ? 'bg-blue-50 dark:bg-blue-900/10' : ''}
        `}
        onClick={handleRowClick}
      >
        {/* Checkbox - First column (far right in RTL) */}
        <td className="px-3 py-5 min-w-0">
          <div className="flex items-center justify-center">
            <input
              type="checkbox"
              onChange={(e) => onSelect(e.target.checked)}
              checked={isSelected}
              className="w-4 h-4 text-brand-red-600 border-gray-300 dark:border-gray-600 rounded focus:ring-brand-red-500 dark:focus:ring-brand-red-400 bg-white dark:bg-gray-800 checked:bg-brand-red-600 dark:checked:bg-brand-red-500 checked:border-brand-red-600 dark:checked:border-brand-red-500 flex-shrink-0"
            />
          </div>
        </td>

        {/* Action ID - Flexible */}
        <td className="px-3 py-5 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <button
                onClick={handleRowClick}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors flex-shrink-0"
              >
                {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
              </button>
              <span className="text-sm font-semibold text-brand-red-600 dark:text-brand-red-400 truncate flex-1">
                #{action.action_id}
              </span>
            </div>
          </div>
        </td>

        {/* Customer Information - Flexible */}
        <td className="px-3 py-5 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <div 
              className="flex-shrink-0 cursor-help p-1 rounded-full bg-gray-50 dark:bg-gray-800" 
              title={getCustomerSegmentTooltip(action.customer_segment)}
            >
              {getCustomerSegmentIcon(action.customer_segment)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm font-medium text-gray-900 dark:text-white truncate flex-1">
                  {truncateCustomerName(action.customer_name)}
              </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 min-w-0 mt-1">
                <Phone className="w-3 h-3 flex-shrink-0" />
                <span className="truncate flex-1">{action.customer_phone}</span>
              </div>
            </div>
          </div>
        </td>

        {/* Status - Flexible */}
        <td className="px-3 py-5 min-w-0">
          <div className="flex items-center justify-center min-w-0">
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
        </td>

        {/* Action Type - Flexible */}
        <td className="px-3 py-5 min-w-0">
          <div className="flex items-center justify-center min-w-0">
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
        </td>

        {/* Priority - Flexible */}
        <td className="px-3 py-5 min-w-0">
          <div className="flex items-center justify-center min-w-0">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap flex-shrink-0 ${getPriorityDisplay(action.priority).props.className}`}>
              {getPriorityDisplay(action.priority).props.children[0]}
              <span>{getPriorityDisplay(action.priority).props.children[1].props.children}</span>
            </div>
          </div>
        </td>

        {/* Date - Flexible */}
        <td className="px-3 py-5 min-w-0">
          <div className="flex flex-col items-center gap-1 min-w-0">
            {/* Days and Date on same horizontal line */}
            <div className="flex items-center gap-2 text-xs">
              {/* Calendar Icon - Centered */}
              <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
              
              {/* Main Date */}
              <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {action.created_at ? new Date(action.created_at).toLocaleDateString('ar-EG', { 
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                }).replace(/\//g, '-') : '--'}
              </span>
              
              {/* Simple Separator */}
              <span className="text-gray-300 dark:text-gray-600">-</span>
              
              {/* Days since creation - After date */}
              <div className={`
                text-xs font-medium
                ${getTimeSinceCreationDays() <= 1 ? 'text-green-700 dark:text-green-300' :
                  getTimeSinceCreationDays() <= 3 ? 'text-blue-700 dark:text-blue-300' :
                  getTimeSinceCreationDays() <= 7 ? 'text-amber-700 dark:text-amber-300' :
                  'text-red-700 dark:text-red-300'}
              `}>
                {getTimeSinceCreationDays()} يوم
              </div>
            </div>
            
            {/* Updated at - Simple UI/UX */}
            {action.updated_at && action.updated_at !== action.created_at && (
              <div className="flex items-center gap-1 text-xs">
                <div className="px-2 py-0.5 rounded-full text-xs font-medium text-gray-600 dark:text-gray-400">
                  تحديث: {new Date(action.updated_at).toLocaleDateString('ar-EG', { 
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  }).replace(/\//g, '-')}
                </div>
              </div>
            )}
          </div>
        </td>

        {/* Location - Flexible */}
        <td className="px-3 py-5 min-w-0">
          <div className="flex items-center gap-3 justify-end min-w-0">
            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-sm text-gray-900 dark:text-white truncate flex-1">
              {action.customer_city || 'غير محدد'}
            </span>
          </div>
        </td>

        {/* Actions - Redesigned Creative UI/UX */}
        <td className="px-3 py-5 min-w-0">
          <div className="flex items-center gap-2 justify-center min-w-0">
            {/* Primary Action - Dynamic based on status */}
            {action.action_status === 'requested' && (
              <button
                onClick={() => handleStatusUpdate('in_progress')}
                disabled={updatingStatus}
                className="h-8 px-3 text-xs font-medium bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 rounded-lg transition-all duration-200 flex-shrink-0 shadow-sm hover:shadow-md flex items-center gap-1.5"
                title="بدء العمل"
              >
                {updatingStatus ? (
                  <Loader className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5" />
                )}
                <span>بدء</span>
              </button>
            )}

            {action.action_status === 'in_progress' && (
              <button
                onClick={() => handleStatusUpdate('hub_confirmed')}
                disabled={updatingStatus}
                className="h-8 px-3 text-xs font-medium bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:hover:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700 rounded-lg transition-all duration-200 flex-shrink-0 shadow-sm hover:shadow-md flex items-center gap-1.5"
                title="تأكيد المحور"
              >
                {updatingStatus ? (
                  <Loader className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle className="w-3.5 h-3.5" />
                )}
                <span>تأكيد</span>
              </button>
            )}

            {action.action_status === 'hub_confirmed' && (
              <button
                onClick={() => handleStatusUpdate('completed')}
                disabled={updatingStatus}
                className="h-8 px-3 text-xs font-medium bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700 rounded-lg transition-all duration-200 flex-shrink-0 shadow-sm hover:shadow-md flex items-center gap-1.5"
                title="إكمال العمل"
              >
                {updatingStatus ? (
                  <Loader className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>إكمال</span>
              </button>
            )}

            {action.action_status === 'awaiting_review' && (
              <button
                onClick={() => handleStatusUpdate('in_progress')}
                disabled={updatingStatus}
                className="h-8 px-3 text-xs font-medium bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700 rounded-lg transition-all duration-200 flex-shrink-0 shadow-sm hover:shadow-md flex items-center gap-1.5"
                title="إعادة العمل"
              >
                {updatingStatus ? (
                  <Loader className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                <span>إعادة</span>
              </button>
            )}

            {/* Secondary Actions - Compact Design */}
            <div className="flex items-center gap-1">
              {/* View Details - Compact */}
              <button
                onClick={() => window.open(`/service-actions/${action.action_id}`, '_blank')}
                className="h-8 w-8 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200 flex-shrink-0 flex items-center justify-center shadow-sm hover:shadow-md"
                title="عرض التفاصيل"
              >
                <Eye className="w-4 h-4" />
              </button>

              {/* Customer Profile - Compact */}
              <button
                onClick={() => window.open(`/customers/${action.customer_phone}`, '_blank')}
                className="h-8 w-8 p-1 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200 flex-shrink-0 flex items-center justify-center shadow-sm hover:shadow-md"
                title="ملف العميل"
              >
                <Users className="w-4 h-4" />
              </button>

              {/* More Actions - Compact Dropdown */}
              <div className="relative">
                <button
                  className="h-8 w-8 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200 flex-shrink-0 flex items-center justify-center shadow-sm hover:shadow-md"
                  title="المزيد من الإجراءات"
                  onClick={() => setShowActionsMenu(!showActionsMenu)}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                
                {showActionsMenu && (
                  <div className="absolute left-0 bottom-full mb-2 w-36 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setShowActionsMenu(false);
                          // Add edit functionality
                        }}
                        className="w-full px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        تعديل
                      </button>
                      <button
                        onClick={() => {
                          setShowActionsMenu(false);
                          // Add duplicate functionality
                        }}
                        className="w-full px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        نسخ
                      </button>
                      <button
                        onClick={() => {
                          setShowActionsMenu(false);
                          handleStatusUpdate('cancelled');
                        }}
                        className="w-full px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        إلغاء
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </td>
      </tr>
      
      {/* Expanded Details Row */}
      {isExpanded && (
        <tr className="overflow-hidden">
          <td colSpan="9" className="p-0 border-0">
            <div className="transition-all duration-200 ease-in-out">
              <ServiceActionExpandDetails
                action={action}
                details={actionDetails}
                isLoading={isLoadingDetails}
              />
            </div>
          </td>
        </tr>
      )}
    </React.Fragment>
  );
});

export default ServiceActionRow; 