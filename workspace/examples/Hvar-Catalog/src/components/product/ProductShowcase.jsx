import React, { useState } from 'react';
import { useDesignSystem } from '../../design_system/DesignSystemProvider';
import ProductGrid from './ProductGrid';
import { useProducts } from '../../hooks/useProducts';

const ProductShowcase = ({ className = '' }) => {
  const { darkMode, dir } = useDesignSystem();
  const { products, loading, error, retry } = useProducts();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showQuickView, setShowQuickView] = useState(false);

  const handleQuickView = (product) => {
    setSelectedProduct(product);
    setShowQuickView(true);
  };

  const handleAddToCart = (product) => {
    // Implement cart functionality
    console.log('Adding to cart:', product);
    // You can integrate with your cart system here
  };

  const handleCloseQuickView = () => {
    setShowQuickView(false);
    setSelectedProduct(null);
  };

  return (
    <div className={`space-y-8 ${className}`} dir={dir}>
      {/* Header Section */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl md:text-4xl font-heading text-gray-900 dark:text-white">
          منتجات هفار المميزة
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          اكتشف مجموعتنا الواسعة من الأجهزة الكهربائية عالية الجودة المصممة لتبسيط حياتك اليومية
        </p>
      </div>

      {/* Product Grid */}
      <ProductGrid
        products={products}
        loading={loading}
        error={error}
        onQuickView={handleQuickView}
        onAddToCart={handleAddToCart}
        showFilters={true}
        showSorting={true}
        gridCols="auto-fit"
        priorityProducts={products.filter(p => p.featured).map(p => p.sku)}
      />

      {/* Quick View Modal */}
      {showQuickView && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-heading text-gray-900 dark:text-white">
                  {selectedProduct.name_ar}
                </h3>
                <button
                  onClick={handleCloseQuickView}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  aria-label="إغلاق"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Product Image */}
                <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center">
                  {selectedProduct.images && selectedProduct.images.length > 0 ? (
                    <img
                      src={selectedProduct.images[0]}
                      alt={selectedProduct.name_ar}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <svg className="w-24 h-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>

                {/* Product Details */}
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      {selectedProduct.brand} • {selectedProduct.sku}
                    </p>
                    <h4 className="text-xl font-heading text-gray-900 dark:text-white mb-2">
                      {selectedProduct.name_ar}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      {selectedProduct.description_ar}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                        {selectedProduct.price_current_egp?.toLocaleString('ar-EG')} ج.م
                      </span>
                      {selectedProduct.price_original_egp > selectedProduct.price_current_egp && (
                        <span className="text-lg text-gray-500 dark:text-gray-400 line-through">
                          {selectedProduct.price_original_egp?.toLocaleString('ar-EG')} ج.م
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-2">
                    {selectedProduct.free_shipping && (
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>شحن مجاني</span>
                      </div>
                    )}
                    {selectedProduct.warranty_months && (
                      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        <span>ضمان {selectedProduct.warranty_months} شهر</span>
                      </div>
                    )}
                  </div>

                  {/* Specifications */}
                  {selectedProduct.specs && Object.keys(selectedProduct.specs).length > 0 && (
                    <div>
                      <h5 className="font-heading text-gray-900 dark:text-white mb-2">المواصفات</h5>
                      <div className="grid grid-cols-1 gap-2">
                        {Object.entries(selectedProduct.specs).map(([key, value]) => (
                          <div key={key} className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">{key}:</span>
                            <span className="text-gray-900 dark:text-white font-medium">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => handleAddToCart(selectedProduct)}
                      className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                      إضافة للسلة
                    </button>
                    <button
                      onClick={handleCloseQuickView}
                      className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      إغلاق
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductShowcase;
