import React from 'react';
import { 
  Crown, 
  TrendingUp, 
  Settings, 
  Wrench, 
  DollarSign, 
  RefreshCw,
  Star,
  Zap,
  Shield,
  Award
} from 'lucide-react';

/**
 * Business Category Badge - Expert Business Classification Display
 * Based on analytics data from 51,139 orders with revenue-focused categorization
 * Designed to match HVAR brand and design system
 */
const BusinessCategoryBadge = ({ 
  businessCategory, 
  codCategory, 
  cod = 0,
  size = 'sm',
  showIcon = true,
  className = '',
  ...props 
}) => {
  // Expert business category classification based on backend analytics
  const getCategoryConfig = () => {
    // Premium categories (high revenue)
    if (businessCategory === 'premium_maximum' || cod >= 10000) {
      return {
        variant: 'primary',
        label: 'ممتاز أقصى',
        description: 'طلبات القيمة القصوى (>10,000 جنيه)',
        icon: Crown,
        color: 'purple',
        tier: 'maximum',
        revenueTier: 'tier_1_premium',
        bgColor: 'bg-purple-100 dark:bg-purple-900/30',
        textColor: 'text-purple-800 dark:text-purple-300',
        borderColor: 'border-purple-200 dark:border-purple-800'
      };
    }
    
    if (businessCategory === 'premium_high' || cod >= 5000) {
      return {
        variant: 'primary',
        label: 'ممتاز عالي',
        description: 'طلبات القيمة العالية (5,000-10,000 جنيه)',
        icon: Star,
        color: 'purple',
        tier: 'premium',
        revenueTier: 'tier_1',
        bgColor: 'bg-purple-100 dark:bg-purple-900/30',
        textColor: 'text-purple-800 dark:text-purple-300',
        borderColor: 'border-purple-200 dark:border-purple-800'
      };
    }
    
    if (businessCategory === 'high_value' || cod >= 1500) {
      return {
        variant: 'success',
        label: 'قيمة عالية',
        description: 'طلبات القيمة العالية (1,500-5,000 جنيه)',
        icon: TrendingUp,
        color: 'green',
        tier: 'high',
        revenueTier: 'tier_2',
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        textColor: 'text-green-800 dark:text-green-300',
        borderColor: 'border-green-200 dark:border-green-800'
      };
    }
    
    // Standard categories (main business)
    if (businessCategory === 'standard_value' || cod >= 500) {
      return {
        variant: 'secondary',
        label: 'قيمة قياسية',
        description: 'طلبات القيمة القياسية (500-1,500 جنيه)',
        icon: DollarSign,
        color: 'blue',
        tier: 'standard',
        revenueTier: 'tier_3',
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        textColor: 'text-blue-800 dark:text-blue-300',
        borderColor: 'border-blue-200 dark:border-blue-800'
      };
    }
    
    if (businessCategory === 'low_value' || cod >= 1) {
      return {
        variant: 'warning',
        label: 'صيانة',
        description: 'طلبات الصيانة والقطع (1-500 جنيه)',
        icon: Wrench,
        color: 'amber',
        tier: 'maintenance',
        revenueTier: 'tier_4',
        bgColor: 'bg-amber-100 dark:bg-amber-900/30',
        textColor: 'text-amber-800 dark:text-amber-300',
        borderColor: 'border-amber-200 dark:border-amber-800'
      };
    }
    
    // Service categories (no revenue)
    if (businessCategory === 'zero_cod' || cod === 0) {
      return {
        variant: 'default',
        label: 'خدمة',
        description: 'طلبات الخدمة (بدون رسوم)',
        icon: Settings,
        color: 'gray',
        tier: 'service',
        revenueTier: 'no_revenue',
        bgColor: 'bg-gray-100 dark:bg-gray-800',
        textColor: 'text-gray-800 dark:text-gray-300',
        borderColor: 'border-gray-200 dark:border-gray-700'
      };
    }
    
    // Refund categories (negative revenue)
    if (businessCategory === 'small_refund' || cod > -500) {
      return {
        variant: 'warning',
        label: 'استرداد صغير',
        description: 'طلبات الاسترداد الصغيرة (-500 إلى 0 جنيه)',
        icon: RefreshCw,
        color: 'amber',
        tier: 'refund_small',
        revenueTier: 'refund',
        bgColor: 'bg-amber-100 dark:bg-amber-900/30',
        textColor: 'text-amber-800 dark:text-amber-300',
        borderColor: 'border-amber-200 dark:border-amber-800'
      };
    }
    
    if (businessCategory === 'large_refund' || cod <= -500) {
      return {
        variant: 'danger',
        label: 'استرداد كبير',
        description: 'طلبات الاسترداد الكبيرة (<-500 جنيه)',
        icon: RefreshCw,
        color: 'red',
        tier: 'refund_large',
        revenueTier: 'refund',
        bgColor: 'bg-red-100 dark:bg-red-900/30',
        textColor: 'text-red-800 dark:text-red-300',
        borderColor: 'border-red-200 dark:border-red-800'
      };
    }
    
    // Special categories
    if (businessCategory === 'real_sales') {
      return {
        variant: 'success',
        label: 'مبيعات حقيقية',
        description: 'طلبات المبيعات العادية',
        icon: TrendingUp,
        color: 'green',
        tier: 'real_sales',
        revenueTier: 'standard',
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        textColor: 'text-green-800 dark:text-green-300',
        borderColor: 'border-green-200 dark:border-green-800'
      };
    }
    
    if (businessCategory === 'maintenance') {
      return {
        variant: 'warning',
        label: 'صيانة',
        description: 'طلبات الصيانة والقطع',
        icon: Wrench,
        color: 'amber',
        tier: 'maintenance',
        revenueTier: 'low',
        bgColor: 'bg-amber-100 dark:bg-amber-900/30',
        textColor: 'text-amber-800 dark:text-amber-300',
        borderColor: 'border-amber-200 dark:border-amber-800'
      };
    }
    
    if (businessCategory === 'service') {
      return {
        variant: 'default',
        label: 'خدمة',
        description: 'طلبات الخدمة',
        icon: Settings,
        color: 'gray',
        tier: 'service',
        revenueTier: 'none',
        bgColor: 'bg-gray-100 dark:bg-gray-800',
        textColor: 'text-gray-800 dark:text-gray-300',
        borderColor: 'border-gray-200 dark:border-gray-700'
      };
    }
    
    if (businessCategory === 'refund') {
      return {
        variant: 'danger',
        label: 'استرداد',
        description: 'طلبات الاسترداد',
        icon: RefreshCw,
        color: 'red',
        tier: 'refund',
        revenueTier: 'negative',
        bgColor: 'bg-red-100 dark:bg-red-900/30',
        textColor: 'text-red-800 dark:text-red-300',
        borderColor: 'border-red-200 dark:border-red-800'
      };
    }
    
    // Default fallback
    return {
      variant: 'default',
      label: businessCategory || 'غير محدد',
      description: 'فئة تجارية غير معروفة',
      icon: Shield,
      color: 'gray',
      tier: 'unknown',
      revenueTier: 'unknown',
      bgColor: 'bg-gray-100 dark:bg-gray-800',
      textColor: 'text-gray-800 dark:text-gray-300',
      borderColor: 'border-gray-200 dark:border-gray-700'
    };
  };

  const config = getCategoryConfig();
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

  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full border transition-all duration-200
        ${config.bgColor} ${config.textColor} ${config.borderColor}
        ${getSizeClasses()}
        group relative ${className}
      `}
      dir='ltr'
      title={`${config.description} (COD: ${cod} جنيه)`}
      {...props}
    >
      {showIcon && (
        <IconComponent className="w-3 h-3 ml-1.5 rtl:mr-1.5 rtl:ml-0" />
      )}
      <span className="font-medium">{config.label}</span>
      
      {/* Premium indicator for high-tier categories */}
      {config.tier === 'maximum' && (
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full animate-pulse border border-white dark:border-gray-800" />
      )}
    </span>
  );
};

export default BusinessCategoryBadge; 