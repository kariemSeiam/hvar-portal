import React, { useMemo } from 'react';
import { useDesignSystem } from '../../design_system/DesignSystemProvider';
import ProductGrid from './ProductGrid';
import { PRODUCT_CATEGORIES } from '../../constants/categories';

const CategorySection = ({ 
  products = [], 
  loading = false, 
  error = null,
  className = '',
  compact = false
}) => {
  const { darkMode, dir } = useDesignSystem();

  // Group products by category with enhanced merchant organization
  const productsByCategory = useMemo(() => {
    if (!products || products.length === 0) return {};

    const grouped = {};
    
    // Initialize all categories with merchant-focused descriptions
    PRODUCT_CATEGORIES.forEach(category => {
      grouped[category.slug] = {
        ...category,
        products: [],
        merchantInfo: {
          totalValue: 0,
          avgPrice: 0,
          featuredCount: 0,
          warrantyCount: 0
        }
      };
    });

    // Group products by category and calculate merchant metrics
    products.forEach(product => {
      const categorySlug = product.category_slug;
      if (grouped[categorySlug]) {
        grouped[categorySlug].products.push(product);
        
        // Update merchant metrics
        const category = grouped[categorySlug];
        category.merchantInfo.totalValue += product.price_current_egp || 0;
        category.merchantInfo.featuredCount += product.featured ? 1 : 0;
        category.merchantInfo.warrantyCount += product.warranty_months ? 1 : 0;
      } else {
        // Handle uncategorized products
        if (!grouped['all']) {
          grouped['all'] = {
            slug: 'all',
            name_ar: 'منتجات أخرى',
            description_ar: 'منتجات غير مصنفة',
            merchantInfo: { totalValue: 0, avgPrice: 0, featuredCount: 0, warrantyCount: 0 }
          };
        }
        grouped['all'].products.push(product);
        grouped['all'].merchantInfo.totalValue += product.price_current_egp || 0;
        grouped['all'].merchantInfo.featuredCount += product.featured ? 1 : 0;
        grouped['all'].merchantInfo.warrantyCount += product.warranty_months ? 1 : 0;
      }
    });

    // Calculate average prices and sort products within each category
    Object.values(grouped).forEach(category => {
      if (category.products.length > 0) {
        category.merchantInfo.avgPrice = category.merchantInfo.totalValue / category.products.length;
        // Sort products: featured first, then by price (high to low)
        category.products.sort((a, b) => {
          if (a.featured !== b.featured) return a.featured ? -1 : 1;
          return (b.price_current_egp || 0) - (a.price_current_egp || 0);
        });
      }
    });

    return grouped;
  }, [products]);

  // Loading state with merchant-focused skeleton
  if (loading) {
    return (
      <div className="space-y-6" dir={dir}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-40 animate-pulse" />
            <ProductGrid 
              products={[]} 
              loading={true} 
              compact={compact}
            />
          </div>
        ))}
      </div>
    );
  }

  // Error state with merchant-friendly message
  if (error) {
    return (
      <div className="text-center py-8" dir={dir}>
        <div className="text-red-500 mb-3">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          حدث خطأ في تحميل البيانات
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-3">
          {error}
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  // Empty state with merchant guidance
  if (!products || products.length === 0) {
    return (
      <div className="text-center py-8" dir={dir}>
        <div className="text-gray-400 dark:text-gray-500 mb-3">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          لا توجد منتجات متاحة
        </h3>
        <p className="text-gray-600 dark:text-gray-300">
          سيتم إضافة المنتجات قريباً. يرجى التحقق لاحقاً
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-8 ${className}`} dir={dir}>
      {Object.values(productsByCategory).map((category) => {
        // Skip categories with no products
        if (!category.products || category.products.length === 0) return null;

        return (
          <section key={category.slug} className="space-y-4">
            {/* Enhanced Creative Category Header for Merchants */}
            <div className="relative category-header-creative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <div className="w-2 h-8 bg-gradient-to-b from-red-500 to-red-600 dark:from-red-400 dark:to-red-500 rounded-full"></div>
                  <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                    {category.name_ar}
                  </h2>
                </div>
                
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                    {category.products.length} منتج
                  </span>
                  <div className="w-8 h-1 bg-gradient-to-r from-red-500 to-red-600 rounded-full"></div>
                </div>
              </div>
              
              {category.description_ar && (
                <p className="text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed mb-3">
                  {category.description_ar}
                </p>
              )}


            </div>

            {/* Products Grid with Merchant Optimization */}
            <ProductGrid
              products={category.products}
              loading={false}
              error={null}
              gridCols="auto-fit"
              compact={compact}
              className="pt-2"
            />
          </section>
        );
      })}
    </div>
  );
};

export default CategorySection;
