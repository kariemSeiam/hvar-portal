import React, { useState } from 'react';
import { 
  Eye, 
  Users, 
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
  ChevronDown,
  ChevronUp,
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
  DollarSign,
  Timer,
  Settings,
  BarChart3,
  Copy,
  AlertCircle,
  Crown,
  Heart,
  Flame,
  Bolt,
  Target,
  ArrowUp,
  Minus,
  ArrowDown
} from 'lucide-react';
import { StatusBadge, Button, Badge } from '../../../components/ui';
import { formatDate, getStatusColor, getPriorityColor, getActionTypeLabel, getStatusLabel, getPriorityLabel, formatCurrency, getCustomerSegmentConfig } from '../utils';

const ServiceActionCard = ({ action, index, toggleNoteExpansion, expandedNotes }) => {
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const actionId = action.action_id;

  const handleStatusUpdate = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      // Add status update logic here
      console.log(`Updating action ${actionId} to status: ${newStatus}`);
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
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Card Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-start justify-between gap-3">
          {/* Action ID and Type */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {getActionTypeIcon(action.action_type)}
            <div className="min-w-0 flex-1">
              <a
                href={`/service-actions/${actionId}`}
                className="font-medium text-brand-red-600 hover:text-brand-red-700 hover:underline transition-colors text-sm truncate block"
              >
                #{actionId}
              </a>
              <div className={`
                px-3 py-1.5 text-xs font-medium rounded-lg text-center whitespace-nowrap flex-shrink-0 mt-1
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
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2 flex-shrink-0">
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
      </div>

      {/* Card Body */}
      <div className="p-4 space-y-4">
        {/* Customer Information */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div 
              className="flex-shrink-0 cursor-help p-1 rounded-full bg-gray-50 dark:bg-gray-800" 
              title={getCustomerSegmentTooltip(action.customer_segment)}
            >
              {getCustomerSegmentIcon(action.customer_segment)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 min-w-0">
                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {truncateCustomerName(action.customer_name)}
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <Phone className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{action.customer_phone}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Priority and Time */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {getPriorityDisplay(action.priority)}
          </div>
          
          {/* Days since creation - Before icon */}
          <div className="flex items-center gap-1">
            <div className={`
              px-2 py-0.5 rounded-full text-xs font-medium
              ${getTimeSinceCreationDays() <= 1 ? 'text-green-700 dark:text-green-300' :
                getTimeSinceCreationDays() <= 3 ? 'text-blue-700 dark:text-blue-300' :
                getTimeSinceCreationDays() <= 7 ? 'text-amber-700 dark:text-amber-300' :
                'text-red-700 dark:text-red-300'}
            `}>
              {getTimeSinceCreationDays()} يوم
            </div>
          </div>
        </div>

        {/* Date and Location */}
        <div className="space-y-2">
          {/* Days and Date on same horizontal line */}
          <div className="flex items-center justify-center gap-2 text-xs">
            {/* Calendar Icon - Centered */}
            <Calendar className="w-3 h-3 text-gray-400 flex-shrink-0" />
            
            {/* Main Date */}
            <span className="truncate">
              {action.created_at ? new Date(action.created_at).toLocaleDateString('ar-EG', { 
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              }).replace(/\//g, '-') : 'غير محدد'}
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
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Clock className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">
                تحديث: {new Date(action.updated_at).toLocaleDateString('ar-EG', { 
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                }).replace(/\//g, '-')}
              </span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">
              {action.customer_city || action.city_name || 'غير محدد'}
            </span>
          </div>
        </div>

        {/* Parts Count */}
        {action.parts_count > 0 && (
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Package className="w-3 h-3" />
            <span>{action.parts_count} قطعة</span>
          </div>
        )}
      </div>

      {/* Card Footer - Actions */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center justify-between gap-2">
          {/* Primary Action - Dynamic based on status */}
          <div className="flex items-center gap-1.5">
            {action.action_status === 'requested' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusUpdate('in_progress')}
                disabled={updatingStatus}
                className="h-8 px-3 text-xs font-medium bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
              >
                {updatingStatus ? (
                  <Loader className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5" />
                )}
                <span className="mr-1 text-xs">بدء</span>
              </Button>
            )}

            {action.action_status === 'in_progress' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusUpdate('completed')}
                disabled={updatingStatus}
                className="h-8 px-3 text-xs font-medium bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:hover:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
              >
                {updatingStatus ? (
                  <Loader className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle className="w-3.5 h-3.5" />
                )}
                <span className="mr-1 text-xs">إكمال</span>
              </Button>
            )}
          </div>

          {/* Secondary Actions - Compact Design */}
          <div className="flex items-center gap-1">
            {/* View Details - Compact */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(`/service-actions/${actionId}`, '_blank')}
              className="h-8 w-8 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <Eye className="w-4 h-4" />
            </Button>

            {/* Customer Profile - Compact */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.location.href = `/customers/${action.customer_phone}`}
              className="h-8 w-8 p-1 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <Users className="w-4 h-4" />
            </Button>

            {/* More Actions - Compact Dropdown */}
            <div className="relative">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowActionsMenu(!showActionsMenu)}
                className="h-8 w-8 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
              
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
      </div>
    </div>
  );
};

export default ServiceActionCard; 