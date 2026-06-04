import React from 'react';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  Info, 
  RotateCcw, 
  X,
  Plus,
  Package,
  Users,
  FileText,
  Settings,
  AlertCircle
} from 'lucide-react';
import { Button } from './index';

/**
 * Enhanced Empty State Component
 * Modern, accessible empty state with contextual actions and helpful tips
 * Following HVAR Design System patterns
 */
const EmptyState = ({
  icon: Icon = Search,
  title = "لا توجد نتائج",
  description = "لم يتم العثور على نتائج تطابق معايير البحث المحددة",
  primaryAction,
  secondaryAction,
  showTips = false,
  tips = [],
  variant = "default", // default, search, create, error
  className = "",
  ...props
}) => {
  // Default tips based on variant
  const defaultTips = {
    default: [
      { icon: Search, text: "جرب البحث بكلمات مختلفة" },
      { icon: Filter, text: "استخدم الفلاتر المتقدمة" },
      { icon: RefreshCw, text: "تحديث البيانات" }
    ],
    search: [
      { icon: Search, text: "جرب البحث بكلمات مختلفة" },
      { icon: Filter, text: "استخدم الفلاتر المتقدمة" },
      { icon: RotateCcw, text: "مسح الفلاتر" }
    ],
    create: [
      { icon: Plus, text: "إنشاء عنصر جديد" },
      { icon: Info, text: "تعرف على كيفية البدء" },
      { icon: Settings, text: "تكوين النظام" }
    ],
    error: [
      { icon: RefreshCw, text: "إعادة المحاولة" },
      { icon: Info, text: "تحقق من الاتصال" },
      { icon: AlertCircle, text: "تواصل مع الدعم" }
    ]
  };

  const currentTips = tips.length > 0 ? tips : defaultTips[variant];

  // Icon and color mapping based on variant
  const variantConfig = {
    default: {
      icon: Search,
      iconBg: "from-brand-red-100 to-brand-red-200 dark:from-brand-red-900/30 dark:to-brand-red-800/30",
      iconColor: "text-brand-red-600 dark:text-brand-red-400",
      accentColor: "text-brand-red-500"
    },
    search: {
      icon: Search,
      iconBg: "from-brand-blue-100 to-brand-blue-200 dark:from-brand-blue-900/30 dark:to-brand-blue-800/30",
      iconColor: "text-brand-blue-600 dark:text-brand-blue-400",
      accentColor: "text-brand-blue-500"
    },
    create: {
      icon: Plus,
      iconBg: "from-accent-green-100 to-accent-green-200 dark:from-accent-green-900/30 dark:to-accent-green-800/30",
      iconColor: "text-accent-green-600 dark:text-accent-green-400",
      accentColor: "text-accent-green-500"
    },
    error: {
      icon: AlertCircle,
      iconBg: "from-accent-amber-100 to-accent-amber-200 dark:from-accent-amber-900/30 dark:to-accent-amber-800/30",
      iconColor: "text-accent-amber-600 dark:text-accent-amber-400",
      accentColor: "text-accent-amber-500"
    }
  };

  const config = variantConfig[variant];

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-lg overflow-hidden backdrop-blur-sm ${className}`} {...props}>
      <div className="relative p-16 text-center">
        {/* Enhanced Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-red-500/30 to-brand-blue-500/30"></div>
          <div className="absolute top-0 left-0 w-40 h-40 bg-brand-red-500/15 rounded-full -translate-x-20 -translate-y-20 animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-brand-blue-500/15 rounded-full translate-x-16 translate-y-16 animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-accent-green-500/10 rounded-full -translate-x-12 -translate-y-12 animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
        
        {/* Main Content */}
        <div className="relative z-10">
          {/* Enhanced Icon with Background */}
          <div className="relative mb-8">
            <div className={`w-24 h-24 bg-gradient-to-br ${config.iconBg} rounded-full flex items-center justify-center mx-auto shadow-xl border-2 border-gray-200 dark:border-gray-700 transform-gpu hover:scale-105 transition-transform duration-300`}>
              <Icon className={`w-12 h-12 ${config.iconColor}`} />
            </div>
          </div>
          
          {/* Enhanced Typography */}
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {title}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-lg mx-auto leading-relaxed text-lg">
            {description}
          </p>
          

          

        </div>
      </div>
    </div>
  );
};

export default EmptyState; 