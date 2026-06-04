import React from 'react';
import { 
  CheckCircle, 
  RotateCcw, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Package,
  Truck,
  Warehouse,
  MapPin,
  AlertCircle
} from 'lucide-react';
import Badge from './Badge';

/**
 * Dynamic Order Status Badge - Flexible State Categorization
 * Adapts to real API data from orders endpoints without hardcoded values
 * Supports dynamic percentages, counts, and business metrics from backend
 */
const OrderStatusBadge = ({ 
  stateCode, 
  stateValue, 
  maskedState,
  // Dynamic data from API
  count = 0,
  percentage = 0,
  totalCod = 0,
  avgCod = 0,
  totalFees = 0,
  // Display options
  size = 'md',
  showIcon = true,
  showMetrics = false,
  showPercentage = false,
  className = '',
  ...props 
}) => {
  // Dynamic state categorization based on API data
  const getStateConfig = () => {
    switch (stateCode) {
      // Main Revenue States (Delivered)
      case 45:
        return {
          variant: 'success',
          label: 'تم التسليم',
          description: 'تم تسليم الطلب بنجاح للعميل',
          icon: CheckCircle,
          color: 'green',
          priority: 'low',
          revenueImpact: 'positive',
          bgColor: 'bg-green-100 dark:bg-green-900/30',
          textColor: 'text-green-800 dark:text-green-300',
          borderColor: 'border-green-200 dark:border-green-800'
        };
      
      // Return States
      case 46:
        return {
          variant: 'warning',
          label: 'مُرتجع',
          description: 'تم إرجاع الطلب من العميل',
          icon: RotateCcw,
          color: 'amber',
          priority: 'low',
          revenueImpact: 'mixed',
          bgColor: 'bg-amber-100 dark:bg-amber-900/30',
          textColor: 'text-amber-800 dark:text-amber-300',
          borderColor: 'border-amber-200 dark:border-amber-800'
        };
      
      // Failed States
      case 48:
        return {
          variant: 'danger',
          label: 'ملغي',
          description: 'تم إلغاء الطلب',
          icon: XCircle,
          color: 'red',
          priority: 'high',
          revenueImpact: 'negative',
          bgColor: 'bg-red-100 dark:bg-red-900/30',
          textColor: 'text-red-800 dark:text-red-300',
          borderColor: 'border-red-200 dark:border-red-800'
        };
      
      // High Risk States
      case 100:
        return {
          variant: 'danger',
          label: 'مفقود',
          description: 'الطلب مفقود',
          icon: AlertTriangle,
          color: 'red',
          priority: 'critical',
          revenueImpact: 'negative',
          bgColor: 'bg-red-100 dark:bg-red-900/30',
          textColor: 'text-red-800 dark:text-red-300',
          borderColor: 'border-red-200 dark:border-red-800'
        };
      
      case 101:
        return {
          variant: 'danger',
          label: 'تالف',
          description: 'الطلب تالف',
          icon: AlertTriangle,
          color: 'red',
          priority: 'critical',
          revenueImpact: 'negative',
          bgColor: 'bg-red-100 dark:bg-red-900/30',
          textColor: 'text-red-800 dark:text-red-300',
          borderColor: 'border-red-200 dark:border-red-800'
        };
      
      // Processing States
      case 10:
        return {
          variant: 'primary',
          label: 'طلب استلام',
          description: 'تم طلب استلام الطلب',
          icon: Package,
          color: 'blue',
          priority: 'low',
          revenueImpact: 'neutral',
          bgColor: 'bg-brand-red-100 dark:bg-brand-red-900/30',
          textColor: 'text-brand-red-800 dark:text-brand-red-300',
          borderColor: 'border-brand-red-200 dark:border-brand-red-800'
        };
      
      case 24:
        return {
          variant: 'secondary',
          label: 'في المستودع',
          description: 'الطلب في المستودع',
          icon: Warehouse,
          color: 'blue',
          priority: 'low',
          revenueImpact: 'neutral',
          bgColor: 'bg-blue-100 dark:bg-blue-900/30',
          textColor: 'text-blue-800 dark:text-blue-300',
          borderColor: 'border-blue-200 dark:border-blue-800'
        };
      
      case 30:
        return {
          variant: 'secondary',
          label: 'قيد النقل',
          description: 'الطلب في النقل بين المراكز',
          icon: Truck,
          color: 'blue',
          priority: 'low',
          revenueImpact: 'neutral',
          bgColor: 'bg-blue-100 dark:bg-blue-900/30',
          textColor: 'text-blue-800 dark:text-blue-300',
          borderColor: 'border-blue-200 dark:border-blue-800'
        };
      
      // Exception States
      case 47:
        return {
          variant: 'danger',
          label: 'استثناء',
          description: 'الطلب في حالة استثناء',
          icon: AlertCircle,
          color: 'red',
          priority: 'high',
          revenueImpact: 'negative',
          bgColor: 'bg-red-100 dark:bg-red-900/30',
          textColor: 'text-red-800 dark:text-red-300',
          borderColor: 'border-red-200 dark:border-red-800'
        };
      
      // Default fallback
      default:
        return {
          variant: 'default',
          label: maskedState || stateValue || 'غير محدد',
          description: 'حالة الطلب غير معروفة',
          icon: MapPin,
          color: 'gray',
          priority: 'low',
          revenueImpact: 'neutral',
          bgColor: 'bg-gray-100 dark:bg-gray-800',
          textColor: 'text-gray-800 dark:text-gray-300',
          borderColor: 'border-gray-200 dark:border-gray-700'
        };
    }
  };

  const config = getStateConfig();
  const IconComponent = config.icon;

  // Size classes matching HVAR design system
  const getSizeClasses = () => {
    switch (size) {
      case 'xs':
        return 'px-2 py-0.5 text-xs';
      case 'sm':
        return 'px-2.5 py-1 text-xs';
      case 'lg':
        return 'px-4 py-1.5 text-sm';
      case 'md':
      default:
        return 'px-3 py-1 text-sm';
    }
  };

  // Format metrics for display
  const formatMetrics = () => {
    const metrics = [];
    
    if (showPercentage && percentage > 0) {
      metrics.push(`${percentage.toFixed(1)}%`);
    }
    
    if (showMetrics && count > 0) {
      metrics.push(`${count.toLocaleString()}`);
    }
    
    return metrics.join(' • ');
  };

  // Build tooltip with dynamic data
  const buildTooltip = () => {
    const parts = [config.description];
    
    if (percentage > 0) {
      parts.push(`النسبة: ${percentage.toFixed(1)}%`);
    }
    
    if (count > 0) {
      parts.push(`العدد: ${count.toLocaleString()}`);
    }
    
    if (totalCod !== 0) {
      parts.push(`إجمالي COD: ${totalCod.toLocaleString()} جنيه`);
    }
    
    if (avgCod !== 0) {
      parts.push(`متوسط COD: ${avgCod.toLocaleString()} جنيه`);
    }
    
    return parts.join(' | ');
  };

  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full border transition-all duration-200
        ${config.bgColor} ${config.textColor} ${config.borderColor}
        ${getSizeClasses()}
        group relative ${className}
        hover:scale-105 hover:shadow-md
      `}
      dir='ltr'
      title={buildTooltip()}
      {...props}
    >
      {showIcon && (
        <IconComponent className="w-3 h-3 ml-1.5 rtl:mr-1.5 rtl:ml-0" />
      )}
      <span className="font-medium">{config.label}</span>
      
      {/* Dynamic metrics display */}
      {(showPercentage || showMetrics) && (percentage > 0 || count > 0) && (
        <span className="text-xs opacity-75 ml-1 rtl:mr-1 rtl:ml-0">
          ({formatMetrics()})
        </span>
      )}
      
      {/* Priority indicator for high-priority states */}
      {config.priority === 'critical' && (
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse border border-white dark:border-gray-800" />
      )}
      {config.priority === 'high' && (
        <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-white dark:border-gray-800" />
      )}
      
      {/* Revenue impact indicator - only for non-priority states */}
      {config.priority === 'low' && config.revenueImpact === 'positive' && (
        <div className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 bg-green-500 rounded-full border border-white dark:border-gray-800" />
      )}
      {config.priority === 'low' && config.revenueImpact === 'negative' && (
        <div className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-white dark:border-gray-800" />
      )}
    </span>
  );
};

export default OrderStatusBadge; 