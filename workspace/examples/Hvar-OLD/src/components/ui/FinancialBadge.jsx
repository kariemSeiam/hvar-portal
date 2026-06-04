import React, { useState } from 'react';
import { 
  DollarSign, 
  CreditCard, 
  Receipt, 
  TrendingUp, 
  TrendingDown,
  Minus,
  Plus,
  Calculator,
  ChevronDown,
  ChevronUp,
  Truck
} from 'lucide-react';

/**
 * Financial Badge - Expert Financial Information Display
 * Shows COD, Bosta fees, and financial calculations with clean formatting
 * Designed to match HVAR brand and design system
 */
const FinancialBadge = ({ 
  cod = 0, 
  bostaFees = 0, 
  depositedAmount = 0,
  type = 'cod', // 'cod', 'fees', 'deposited', 'net', 'horizontal', 'expert', 'expandable'
  size = 'sm',
  showIcon = true,
  showDetails = false,
  className = '',
  ...props 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

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

  // Format currency for Egyptian Pounds
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Calculate net amount
  const netAmount = cod - bostaFees;

  // Expandable financial badge - shows COD by default, expands to show details
  if (type === 'expandable') {
    const getExpandableConfig = () => {
      if (cod > 0) {
        return {
          variant: 'success',
          label: formatCurrency(cod),
          description: 'مبلغ الطلب',
          icon: DollarSign,
          color: 'green',
          impact: 'positive',
          bgColor: 'bg-green-100 dark:bg-green-900/30',
          textColor: 'text-green-800 dark:text-green-300',
          borderColor: 'border-green-200 dark:border-green-800'
        };
      } else if (cod < 0) {
        return {
          variant: 'danger',
          label: formatCurrency(cod),
          description: 'مبلغ الاسترداد',
          icon: TrendingDown,
          color: 'red',
          impact: 'negative',
          bgColor: 'bg-red-100 dark:bg-red-900/30',
          textColor: 'text-red-800 dark:text-red-300',
          borderColor: 'border-red-200 dark:border-red-800'
        };
      } else if (cod === 0 && bostaFees > 0) {
        return {
          variant: 'secondary',
          label: `-${formatCurrency(bostaFees)}`,
          description: 'رسوم بوسطه فقط',
          icon: Truck,
          color: 'blue',
          impact: 'fees_only',
          bgColor: 'bg-blue-100 dark:bg-blue-900/30',
          textColor: 'text-blue-800 dark:text-blue-300',
          borderColor: 'border-blue-200 dark:border-blue-800'
        };
      } else {
        return {
          variant: 'default',
          label: 'بدون رسوم',
          description: 'طلب خدمة بدون رسوم',
          icon: Receipt,
          color: 'gray',
          impact: 'neutral',
          bgColor: 'bg-gray-100 dark:bg-gray-800',
          textColor: 'text-gray-800 dark:text-gray-300',
          borderColor: 'border-gray-200 dark:border-gray-700'
        };
      }
    };

    const config = getExpandableConfig();
    const IconComponent = config.icon;

    return (
      <div className={`relative ${className}`}>
        {/* Main badge - always visible */}
        <span
          className={`
            inline-flex items-center font-medium rounded-full border transition-all duration-200
            ${(cod !== 0 || bostaFees > 0) ? 'cursor-pointer hover:shadow-md' : ''}
            ${config.bgColor} ${config.textColor} ${config.borderColor}
            ${getSizeClasses()}
            group relative
          `}
          dir='ltr'
          title={(cod !== 0 || bostaFees > 0) ? (isExpanded ? 'انقر للطي' : 'انقر للتوسيع') : ''}
          onClick={(cod !== 0 || bostaFees > 0) ? () => setIsExpanded(!isExpanded) : undefined}
          {...props}
        >
          {showIcon && (
            <IconComponent className="w-3 h-3 ml-1.5 rtl:mr-1.5 rtl:ml-0" />
          )}
          <span className="font-medium tracking-wide">{config.label}</span>
          
          {/* Expand indicator - only show if there's data to expand */}
          {(cod !== 0 || bostaFees > 0) && (
            <div className="ml-1.5 rtl:mr-1.5 rtl:ml-0 transition-transform duration-200">
              {isExpanded ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </div>
          )}
          
          {/* Priority indicator for high-value transactions */}
          {Math.abs(cod) > 10000 && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full animate-pulse border border-white dark:border-gray-800" />
          )}
        </span>

        {/* Expanded details */}
        {isExpanded && (
          <div className="absolute top-full mt-2 right-0 z-50 min-w-[200px] bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg p-3 animate-in slide-in-from-top-2 duration-200">
            <div className="space-y-2">
              {/* Header */}
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 pb-1">
                تفاصيل مالية
              </div>
              
              {/* COD */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600 dark:text-gray-400">الطلب:</span>
                <span className="text-xs font-medium text-green-600 dark:text-green-400">
                  {formatCurrency(cod)}
                </span>
              </div>
              
              {/* Bosta Fees */}
              {bostaFees > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">بوسطه:</span>
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                    -{formatCurrency(bostaFees)}
                  </span>
                </div>
              )}
              
              {/* Deposited Amount */}
              {depositedAmount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">مودع:</span>
                  <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                    +{formatCurrency(depositedAmount)}
                  </span>
                </div>
              )}
              
              {/* Net Amount */}
              {bostaFees > 0 && (
                <div className="flex items-center justify-between pt-1 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">الصافي:</span>
                  <span className={`text-xs font-medium ${
                    netAmount > 0 ? 'text-green-600 dark:text-green-400' :
                    netAmount < 0 ? 'text-red-600 dark:text-red-400' :
                    'text-gray-600 dark:text-gray-400'
                  }`}>
                    {formatCurrency(netAmount)}
                  </span>
                </div>
              )}
              

            </div>
          </div>
        )}
      </div>
    );
  }

  // Expert financial badge - single complex badge
  if (type === 'expert') {
    const getExpertConfig = () => {
      if (cod > 0 && bostaFees > 0) {
        return {
          variant: 'success',
          label: `${formatCurrency(cod)} - ${formatCurrency(bostaFees)} = ${formatCurrency(netAmount)}`,
          description: `الطلب: ${formatCurrency(cod)} | بوستا: ${formatCurrency(bostaFees)} | الصافي: ${formatCurrency(netAmount)}`,
          icon: netAmount > 0 ? TrendingUp : TrendingDown,
          color: netAmount > 0 ? 'green' : 'red',
          impact: netAmount > 0 ? 'positive' : 'negative',
          bgColor: netAmount > 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30',
          textColor: netAmount > 0 ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300',
          borderColor: netAmount > 0 ? 'border-green-200 dark:border-green-800' : 'border-red-200 dark:border-red-800'
        };
      } else if (cod > 0 && bostaFees === 0) {
        return {
          variant: 'success',
          label: formatCurrency(cod),
          description: `مبلغ الطلب: ${formatCurrency(cod)}`,
          icon: DollarSign,
          color: 'green',
          impact: 'positive',
          bgColor: 'bg-green-100 dark:bg-green-900/30',
          textColor: 'text-green-800 dark:text-green-300',
          borderColor: 'border-green-200 dark:border-green-800'
        };
      } else if (cod < 0) {
        return {
          variant: 'danger',
          label: formatCurrency(cod),
          description: `مبلغ الاسترداد: ${formatCurrency(cod)}`,
          icon: TrendingDown,
          color: 'red',
          impact: 'negative',
          bgColor: 'bg-red-100 dark:bg-red-900/30',
          textColor: 'text-red-800 dark:text-red-300',
          borderColor: 'border-red-200 dark:border-red-800'
        };
      } else if (cod === 0 && bostaFees > 0) {
        return {
          variant: 'secondary',
          label: `-${formatCurrency(bostaFees)}`,
          description: `رسوم بوستا: ${formatCurrency(bostaFees)}`,
          icon: CreditCard,
          color: 'blue',
          impact: 'cost',
          bgColor: 'bg-blue-100 dark:bg-blue-900/30',
          textColor: 'text-blue-800 dark:text-blue-300',
          borderColor: 'border-blue-200 dark:border-blue-800'
        };
      } else {
        return {
          variant: 'default',
          label: 'بدون رسوم',
          description: 'طلب خدمة بدون رسوم',
          icon: Receipt,
          color: 'gray',
          impact: 'neutral',
          bgColor: 'bg-gray-100 dark:bg-gray-800',
          textColor: 'text-gray-800 dark:text-gray-300',
          borderColor: 'border-gray-200 dark:border-gray-700'
        };
      }
    };

    const config = getExpertConfig();
    const IconComponent = config.icon;

    return (
      <span
        className={`
          inline-flex items-center font-medium rounded-full border transition-all duration-200
          ${config.bgColor} ${config.textColor} ${config.borderColor}
          ${getSizeClasses()}
          group relative ${className}
        `}
        dir='ltr'
        title={config.description}
        {...props}
      >
        {showIcon && (
          <IconComponent className="w-3 h-3 ml-1.5 rtl:mr-1.5 rtl:ml-0" />
        )}
        <span className="font-medium tracking-wide">{config.label}</span>
        
        {/* Priority indicator for high-value transactions */}
        {Math.abs(cod) > 10000 && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full animate-pulse border border-white dark:border-gray-800" />
        )}
      </span>
    );
  }

  // Get financial configuration based on type and values
  const getFinancialConfig = () => {
    switch (type) {
      case 'cod':
        if (cod > 0) {
          return {
            variant: 'success',
            label: formatCurrency(cod),
            description: 'مبلغ الطلب',
            icon: DollarSign,
            color: 'green',
            impact: 'positive',
            bgColor: 'bg-green-100 dark:bg-green-900/30',
            textColor: 'text-green-800 dark:text-green-300',
            borderColor: 'border-green-200 dark:border-green-800'
          };
        } else if (cod < 0) {
          return {
            variant: 'danger',
            label: formatCurrency(cod),
            description: 'مبلغ الاسترداد',
            icon: TrendingDown,
            color: 'red',
            impact: 'negative',
            bgColor: 'bg-red-100 dark:bg-red-900/30',
            textColor: 'text-red-800 dark:text-red-300',
            borderColor: 'border-red-200 dark:border-red-800'
          };
        } else {
          return {
            variant: 'default',
            label: 'بدون رسوم',
            description: 'طلب خدمة بدون رسوم',
            icon: Receipt,
            color: 'gray',
            impact: 'neutral',
            bgColor: 'bg-gray-100 dark:bg-gray-800',
            textColor: 'text-gray-800 dark:text-gray-300',
            borderColor: 'border-gray-200 dark:border-gray-700'
          };
        }
      
      case 'fees':
        return {
          variant: 'secondary',
          label: formatCurrency(bostaFees),
          description: 'رسوم بوستا',
          icon: CreditCard,
          color: 'blue',
          impact: 'cost',
          bgColor: 'bg-blue-100 dark:bg-blue-900/30',
          textColor: 'text-blue-800 dark:text-blue-300',
          borderColor: 'border-blue-200 dark:border-blue-800'
        };
      
      case 'deposited':
        return {
          variant: 'primary',
          label: formatCurrency(depositedAmount),
          description: 'المبلغ المودع',
          icon: Calculator,
          color: 'purple',
          impact: 'deposited',
          bgColor: 'bg-purple-100 dark:bg-purple-900/30',
          textColor: 'text-purple-800 dark:text-purple-300',
          borderColor: 'border-purple-200 dark:border-purple-800'
        };
      
      case 'net':
        if (netAmount > 0) {
          return {
            variant: 'success',
            label: formatCurrency(netAmount),
            description: 'صافي الربح',
            icon: TrendingUp,
            color: 'green',
            impact: 'positive',
            bgColor: 'bg-green-100 dark:bg-green-900/30',
            textColor: 'text-green-800 dark:text-green-300',
            borderColor: 'border-green-200 dark:border-green-800'
          };
        } else if (netAmount < 0) {
          return {
            variant: 'danger',
            label: formatCurrency(netAmount),
            description: 'صافي الخسارة',
            icon: TrendingDown,
            color: 'red',
            impact: 'negative',
            bgColor: 'bg-red-100 dark:bg-red-900/30',
            textColor: 'text-red-800 dark:text-red-300',
            borderColor: 'border-red-200 dark:border-red-800'
          };
        } else {
          return {
            variant: 'default',
            label: formatCurrency(netAmount),
            description: 'صافي المبلغ',
            icon: Calculator,
            color: 'gray',
            impact: 'neutral',
            bgColor: 'bg-gray-100 dark:bg-gray-800',
            textColor: 'text-gray-800 dark:text-gray-300',
            borderColor: 'border-gray-200 dark:border-gray-700'
          };
        }
      
      default:
        return {
          variant: 'default',
          label: formatCurrency(cod),
          description: 'المبلغ',
          icon: DollarSign,
          color: 'gray',
          impact: 'neutral',
          bgColor: 'bg-gray-100 dark:bg-gray-800',
          textColor: 'text-gray-800 dark:text-gray-300',
          borderColor: 'border-gray-200 dark:border-gray-700'
        };
    }
  };

  const config = getFinancialConfig();
  const IconComponent = config.icon;

  // Horizontal layout for table view
  if (type === 'horizontal') {
    return (
      <div className={`flex items-center gap-1.5 ${className}`} dir="ltr">
        {/* Main COD Badge */}
        <span
          className={`
            inline-flex items-center font-medium rounded-full border transition-all duration-200
            ${cod > 0 ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800' :
              cod < 0 ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800' :
              'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700'}
            ${getSizeClasses()}
            group relative
          `}
          title={cod > 0 ? 'مبلغ الطلب' : cod < 0 ? 'مبلغ الاسترداد' : 'بدون رسوم'}
          {...props}
        >
          <DollarSign className="w-3 h-3 ml-1.5 rtl:mr-1.5 rtl:ml-0" />
          <span className="font-medium tracking-wide">{formatCurrency(cod)}</span>
        </span>

        {/* Separator */}
        {bostaFees > 0 && (
          <div className="flex items-center">
            <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1"></div>
            <span className="text-xs text-gray-400 dark:text-gray-500 mx-1">-</span>
            <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1"></div>
          </div>
        )}

        {/* Bosta Fees Badge */}
        {bostaFees > 0 && (
          <span
            className={`
              inline-flex items-center font-medium rounded-full border transition-all duration-200
              bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800
              ${getSizeClasses()}
              group relative
            `}
            title="رسوم بوستا"
          >
            <CreditCard className="w-3 h-3 ml-1.5 rtl:mr-1.5 rtl:ml-0" />
            <span className="font-medium tracking-wide">{formatCurrency(bostaFees)}</span>
          </span>
        )}

        {/* Net Amount Indicator */}
        {bostaFees > 0 && (
          <div className="flex items-center">
            <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1"></div>
            <span className="text-xs text-gray-400 dark:text-gray-500 mx-1">=</span>
            <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1"></div>
          </div>
        )}

        {/* Net Result */}
        {bostaFees > 0 && (
          <span
            className={`
              inline-flex items-center font-medium rounded-full border transition-all duration-200
              ${netAmount > 0 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' :
                netAmount < 0 ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800' :
                'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700'}
              ${getSizeClasses()}
              group relative
            `}
            title="الصافي"
          >
            <TrendingUp className="w-3 h-3 ml-1.5 rtl:mr-1.5 rtl:ml-0" />
            <span className="font-medium tracking-wide">{formatCurrency(netAmount)}</span>
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {/* Main financial badge */}
      <span
        className={`
          inline-flex items-center font-medium rounded-full border transition-all duration-200
          ${config.bgColor} ${config.textColor} ${config.borderColor}
          ${getSizeClasses()}
          group relative
        `}
        dir='ltr'
        title={config.description}
        {...props}
      >
        {showIcon && (
          <IconComponent className="w-3 h-3 ml-1.5 rtl:mr-1.5 rtl:ml-0" />
        )}
        <span className="font-medium tracking-wide">{config.label}</span>
      </span>

      {/* Detailed breakdown (optional) */}
      {showDetails && (
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 mt-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-md border border-gray-200 dark:border-gray-700">
          {cod !== 0 && (
            <div className="flex items-center justify-between">
              <span>الطلب:</span>
              <span className="font-medium tracking-wide">{formatCurrency(cod)}</span>
            </div>
          )}
          {bostaFees > 0 && (
            <div className="flex items-center justify-between">
              <span>بوستا:</span>
              <span className="font-medium tracking-wide text-blue-600 dark:text-blue-400">
                -{formatCurrency(bostaFees)}
              </span>
            </div>
          )}
          {depositedAmount > 0 && (
            <div className="flex items-center justify-between">
              <span>مودع:</span>
              <span className="font-medium tracking-wide text-purple-600 dark:text-purple-400">
                +{formatCurrency(depositedAmount)}
              </span>
            </div>
          )}
          {type === 'net' && (
            <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-1">
              <span className="font-medium">الصافي:</span>
              <span className={`font-medium tracking-wide ${
                netAmount > 0 ? 'text-green-600 dark:text-green-400' :
                netAmount < 0 ? 'text-red-600 dark:text-red-400' :
                'text-gray-600 dark:text-gray-400'
              }`}>
                {formatCurrency(netAmount)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FinancialBadge; 