import React, { useMemo, useState, useCallback } from 'react';
import { useDesignSystem } from '../../design_system/DesignSystemProvider';
import ProductCard from './ProductCard';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  SparklesIcon,
  FireIcon,
  StarIcon,
  BoltIcon
} from '@heroicons/react/24/outline';

const ProductGrid = ({
  products = [],
  loading = false,
  error = null,
  className = '',
  gridCols = 'auto-fit',
  priorityProducts = [],
  compact = false,
  showCategoryHeaders = true,
  enableHorizontalScroll = true
}) => {
  const { darkMode, dir } = useDesignSystem();
  const [activeCategory, setActiveCategory] = useState(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  // Enhanced grid classes with perfect responsive design - 4 Elements Per Row
  const gridClasses = useMemo(() => {
    const baseClasses = 'gap-4 md:gap-6 lg:gap-8';
    
    // 4-column responsive grid: 1 mobile, 2 tablet, 3 small desktop, 4 large screens
    const responsiveGrid = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
    
    switch (gridCols) {
      case 'auto-fit':
        return `${baseClasses} ${responsiveGrid}`;
      case 'auto-fill':
        return `${baseClasses} ${responsiveGrid}`;
      case '2':
        return `${baseClasses} grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2`;
      case '3':
        return `${baseClasses} grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`;
      case '4':
        return `${baseClasses} grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`;
      case 'horizontal-scroll':
        return `${baseClasses} flex overflow-x-auto gap-4 md:gap-6 pb-4 scrollbar-hide`;
      default:
        return `${baseClasses} ${responsiveGrid}`;
    }
  }, [gridCols]);

  // Get category icon based on category slug
  const getCategoryIcon = useCallback((categorySlug) => {
    const iconMap = {
      'hand-blender': BoltIcon,
      'mixer-juicer': SparklesIcon,
      'iron': FireIcon,
      'vacuum': StarIcon,
      'fryer': FireIcon,
      'mixer': BoltIcon,
      'oven': FireIcon,
      'grinder': BoltIcon
    };
    return iconMap[categorySlug] || SparklesIcon;
  }, []);

  // Get category color scheme
  const getCategoryColor = useCallback((categorySlug) => {
    const colorMap = {
      'hand-blender': 'from-orange-500 to-red-500',
      'mixer-juicer': 'from-green-500 to-emerald-500',
      'iron': 'from-purple-500 to-pink-500',
      'vacuum': 'from-indigo-500 to-purple-500',
      'fryer': 'from-yellow-500 to-orange-500',
      'mixer': 'from-teal-500 to-green-500',
      'oven': 'from-red-600 to-red-700',
      'grinder': 'from-gray-500 to-gray-600'
    };
    return colorMap[categorySlug] || 'from-red-500 to-red-600';
  }, []);

  // Group products by category for horizontal layout
  const productsByCategory = useMemo(() => {
    if (!products || products.length === 0) return {};
    
    const grouped = {};
    products.forEach(product => {
      const category = product.category_slug || 'general';
      if (!grouped[category]) {
        grouped[category] = {
          name: product.category_name_ar || 'منتجات عامة',
          icon: getCategoryIcon(category),
          products: [],
          color: getCategoryColor(category)
        };
      }
      grouped[category].products.push(product);
    });
    
    return grouped;
  }, [products, getCategoryIcon, getCategoryColor]);

  // Horizontal scroll handlers
  const handleScroll = useCallback((direction) => {
    const container = document.querySelector('.horizontal-scroll-container');
    if (container) {
      const scrollAmount = direction === 'left' ? -400 : 400;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  }, []);

  // Loading state with creative skeleton
  if (loading) {
    return (
      <div className="space-y-6" dir={dir}>
        <div className="flex items-center justify-center py-12">
          <div className="relative">
            <LoadingSpinner size="lg" />
            <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600 rounded-full blur-xl opacity-20 animate-pulse"></div>
          </div>
        </div>
        
        {/* Creative Loading Grid */}
        <div className={gridClasses}>
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse group">
              <div className="relative">
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shimmer" />
                
                <div className="bg-gray-200 dark:bg-gray-700 aspect-square rounded-2xl mb-4 overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700" />
                </div>
                
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-3/4" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-lg w-1/2" />
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-lg w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state with creative design
  if (error) {
    return (
      <div className="text-center py-12" dir={dir}>
        <div className="relative mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto shadow-2xl">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-red-600 rounded-full blur-xl opacity-30 animate-pulse"></div>
        </div>
        
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
          حدث خطأ في تحميل البيانات
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
          {error}
        </p>
        
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  // Empty state with creative design
  if (!products || products.length === 0) {
    return (
      <div className="text-center py-16" dir={dir}>
        <div className="relative mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-gray-400 to-gray-500 dark:from-gray-500 dark:to-gray-600 rounded-full flex items-center justify-center mx-auto shadow-2xl">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-gray-400 to-gray-500 dark:from-gray-500 dark:to-gray-600 rounded-full blur-xl opacity-20"></div>
        </div>
        
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          لا توجد منتجات
        </h3>
        <p className="text-gray-600 dark:text-gray-300 max-w-lg mx-auto text-lg">
          لم يتم العثور على منتجات في هذه الفئة. يرجى التحقق من الفئات الأخرى أو العودة لاحقاً.
        </p>
      </div>
    );
  }

  // Horizontal scroll layout for multiple categories
  if (gridCols === 'horizontal-scroll' && Object.keys(productsByCategory).length > 1) {
    return (
      <div className={`space-y-8 ${className}`} dir={dir}>
        {Object.entries(productsByCategory).map(([categorySlug, categoryData]) => (
          <section key={categorySlug} className="space-y-6">
            {/* Creative Category Header */}
            {showCategoryHeaders && (
              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4 rtl:space-x-reverse">
                    <div className={`w-12 h-12 bg-gradient-to-br ${categoryData.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                      <categoryData.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {categoryData.name}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {categoryData.products.length} منتج متاح
                      </p>
                    </div>
                  </div>
                  
                  {/* Navigation Arrows */}
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <button
                      onClick={() => handleScroll('left')}
                      className="w-10 h-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-red-500 hover:border-red-300 dark:hover:border-red-600 transition-all duration-300 shadow-md hover:shadow-lg"
                      aria-label="انتقل لليسار"
                    >
                      <ChevronLeftIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleScroll('right')}
                      className="w-10 h-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-red-500 hover:border-red-300 dark:hover:border-red-600 transition-all duration-300 shadow-md hover:shadow-lg"
                      aria-label="انتقل لليمين"
                    >
                      <ChevronRightIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                {/* Creative Separator */}
                <div className="relative">
                  <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-gradient-to-br from-red-500 to-red-600 rounded-full shadow-lg"></div>
                </div>
              </div>
            )}
            
            {/* Horizontal Scrollable Products - Max 5 */}
            <div className="relative group">
              <div className="horizontal-scroll-container flex overflow-x-auto gap-4 md:gap-6 pb-6 scrollbar-hide scroll-smooth">
                {categoryData.products.slice(0, 5).map((product, index) => (
                  <div key={`${product.sku}-${index}`} className="flex-shrink-0 w-64 md:w-72 lg:w-80">
                    <ProductCard
                      product={product}
                      priority={priorityProducts.includes(product.sku)}
                      compact={compact}
                    />
                  </div>
                ))}
              </div>
              
              {/* Gradient Fade Edges */}
              <div className="absolute left-0 top-0 w-8 h-full bg-gradient-to-r from-white dark:from-gray-900 to-transparent pointer-events-none"></div>
              <div className="absolute right-0 top-0 w-8 h-full bg-gradient-to-l from-white dark:from-gray-900 to-transparent pointer-events-none"></div>
            </div>
          </section>
        ))}
      </div>
    );
  }

  // Standard grid layout
  return (
    <div className={`space-y-6 ${className}`} dir={dir}>
      {/* Creative Products Grid */}
      <div className={gridClasses}>
        {products.map((product, index) => (
          <ProductCard
            key={`${product.sku}-${index}`}
            product={product}
            priority={priorityProducts.includes(product.sku)}
            compact={compact}
          />
        ))}
      </div>
    </div>
  );
};

export default ProductGrid;
