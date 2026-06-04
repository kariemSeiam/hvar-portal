import React, { useState, useCallback, useMemo } from 'react';
import { useDesignSystem } from '../../design_system/DesignSystemProvider';
import { formatPriceEGP, calculateDiscountPercentage, formatDiscount } from '../../utils/formatPrice';

const ProductCard = ({
  product,
  className = '',
  priority = false,
  compact = false
}) => {
  const { darkMode, dir } = useDesignSystem();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const cardData = useMemo(() => {
    const hasImages = product.images && product.images.length > 0;
    const hasDiscount = product.price_original_egp > product.price_current_egp;
    const discountPercentage = hasDiscount
      ? calculateDiscountPercentage(product.price_original_egp, product.price_current_egp)
      : 0;
    const isNew = product.badges?.some(badge => badge.includes('جديد') || badge.includes('New'));
    const isHot = product.badges?.some(badge => badge.includes('حار') || badge.includes('Hot'));

    return {
      hasImages,
      hasDiscount,
      discountPercentage,
      isNew,
      isHot,
      formattedCurrentPrice: formatPriceEGP(product.price_current_egp),
      formattedOriginalPrice: formatPriceEGP(product.price_original_egp),
      discountText: formatDiscount(discountPercentage)
    };
  }, [product]);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
    setImageLoaded(false);
  }, []);

  const cardId = `product-${product.sku}`;
  const imageAlt = `${product.name_ar} - ${product.brand}`;

  return (
    <article
      id={cardId}
      className={`
        group relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-2xl shadow-xl
        hover:shadow-2xl transition-all duration-300 ease-out
        border border-white/20 dark:border-gray-700/50
        hover:border-red-200 dark:hover:border-red-700/50
        overflow-hidden will-change-transform product-card-merchant
        ${priority ? 'ring-2 ring-red-500 ring-opacity-20' : ''}
        ${compact ? 'p-3' : 'p-4'}
        ${className}
      `}
      dir={dir}
      role="article"
      aria-labelledby={`${cardId}-title`}
      tabIndex={0}
    >
      {/* Creative Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-50/30 to-red-100/20 dark:from-red-900/10 dark:to-red-800/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Badge Container */}
      <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
        {cardData.isNew && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg badge-merchant">
            جديد
          </span>
        )}
        {cardData.isHot && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r from-red-500 to-pink-600 shadow-lg badge-merchant">
            حار
          </span>
        )}
        {cardData.hasDiscount && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-red-600 shadow-lg badge-merchant">
            {cardData.discountText}
          </span>
        )}
      </div>

      {/* Image Container */}
      <div className={`relative ${compact ? 'aspect-square' : 'aspect-square'} bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 overflow-hidden rounded-xl mb-3 group-hover:rounded-2xl transition-all duration-300`}>
        {cardData.hasImages && !imageError ? (
          <img
            src={product.images[0]}
            alt={imageAlt}
            className={`
              w-full h-full object-cover transition-all duration-500 ease-out
              ${imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}
              group-hover:scale-110 group-hover:brightness-110
            `}
            loading={priority ? 'eager' : 'lazy'}
            onLoad={handleImageLoad}
            onError={handleImageError}
            decoding="async"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
            <svg
              className={`${compact ? 'w-10 h-10' : 'w-12 h-12'} text-gray-400 dark:text-gray-500`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}

        {/* Creative Image Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Content Container */}
      <div className={`space-y-2 ${compact ? 'space-y-1.5' : 'space-y-2.5'}`}>
        {/* Brand & SKU - Enhanced for Merchants */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-md">
            {product.brand}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">
            {product.sku}
          </span>
        </div>

        {/* Product Title */}
        <h3
          id={`${cardId}-title`}
          className={`font-bold text-gray-900 dark:text-white leading-tight line-clamp-2 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors duration-200 ${
            compact ? 'text-sm' : 'text-base'
          }`}
        >
          {product.name_ar}
        </h3>

        {/* Enhanced Price Section for Merchants */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={`font-bold text-red-600 dark:text-red-400 ${
              compact ? 'text-base' : 'text-lg'
            }`}>
              {cardData.formattedCurrentPrice}
            </span>
            {cardData.hasDiscount && (
              <span className={`text-gray-500 dark:text-gray-400 line-through ${
                compact ? 'text-sm' : 'text-sm'
              }`}>
                {cardData.formattedOriginalPrice}
              </span>
            )}
          </div>
          
          {/* Price per unit info for merchants */}
          {product.specs && product.specs.القدرة && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {Math.round((product.price_current_egp / parseFloat(product.specs.القدرة.replace(/\D/g, ''))) * 100) / 100} ج.م/وات
            </div>
          )}
        </div>

        {/* Essential Merchant Info - Enhanced */}
        <div className="flex flex-wrap gap-1.5">
          {product.free_shipping && (
            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              شحن مجاني
            </span>
          )}
          {product.warranty_months && (
            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              ضمان {product.warranty_months} شهر
            </span>
          )}
          {product.featured && (
            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium text-yellow-700 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              مميز
            </span>
          )}
        </div>

        {/* Key Specifications for Merchants - Enhanced */}
        {product.specs && Object.keys(product.specs).length > 0 && (
          <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
            <div className="grid grid-cols-1 gap-1.5">
              {Object.entries(product.specs).slice(0, 3).map(([key, value]) => (
                <div key={key} className="flex justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">{key}:</span>
                  <span className="text-gray-900 dark:text-white">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Additional Merchant Info */}
        {product.description_ar && (
          <div className="pt-2">
            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
              {product.description_ar}
            </p>
          </div>
        )}
      </div>

      {/* Creative Hover Effect */}
      <div className="absolute inset-0 rounded-2xl ring-2 ring-transparent group-hover:ring-red-500/20 group-hover:ring-opacity-50 transition-all duration-300 pointer-events-none" />

      {/* Focus Ring for Accessibility */}
      <div className="absolute inset-0 rounded-2xl ring-2 ring-transparent group-focus-within:ring-red-500 group-focus-within:ring-opacity-50 transition-all duration-200 pointer-events-none" />
    </article>
  );
};

export default ProductCard;
