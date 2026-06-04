import React, { memo, useMemo } from 'react';
import { Users, Eye, Clock, Package, DollarSign, MapPin, TrendingUp, MessageSquare, ChevronUp } from 'lucide-react';
import { BusinessCategoryBadge, FinancialBadge } from "../../../components/ui";
import { formatDate, truncateText, getStatusBadgeStyle, getStatusIcon, getStatusLabel, getCardsProgressWidth, getTimelineLabel } from '../utils';

const OrderCard = memo(({ order, index, toggleNoteExpansion, expandedNotes }) => {
  // Memoize expensive calculations
  const memoizedData = useMemo(() => ({
    trackingNumber: order.tracking_number || order.id,
    receiverName: order.receiver_name || 'غير محدد',
    receiverPhone: order.receiver_phone || 'غير محدد',
    productName: order.product_name,
    productCount: order.product_count || order.specs_items_count || 1,
    cod: order.cod?.toLocaleString('ar-EG') || '0',
    bostaFees: order.bosta_fees?.toLocaleString('ar-EG') || '0',
    cityName: order.dropoff_city_name || 'غير محدد',
    districtName: order.dropoff_district_name,
    address: order.dropoff_first_line || 'غير محدد',
    businessCategory: order.business_category,
    attemptsCount: order.attempts_count || 0,
    callsCount: order.calls_count || 0,
    notes: order.notes,
    timeline: order.timeline,
    createdDate: formatDate(order.created_at),
    orderId: order.id || order.tracking_number
  }), [order]);

  const isNoteExpanded = expandedNotes[memoizedData.orderId];

  return (
    <div className="h-full">
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden h-full flex flex-col group hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200">
        {/* Card Header - Fixed height to prevent layout shifts */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 min-h-[80px]">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <a
                href={`https://business.bosta.co/orders/${memoizedData.trackingNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block font-bold text-brand-red-600 hover:text-brand-red-700 hover:underline transition-colors text-sm leading-tight"
              >
                #{memoizedData.trackingNumber}
              </a>
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                <Clock className="w-3 h-3 ml-1 flex-shrink-0" />
                <span className="truncate">{memoizedData.createdDate}</span>
              </div>
            </div>
            
            {/* Status Badge - Fixed dimensions */}
            <div className="flex-shrink-0 mr-2 w-24">
              <div className={`
                px-3 py-1.5 text-xs font-bold text-white rounded-lg shadow-sm h-8 flex items-center justify-center
                ${getStatusBadgeStyle(order.state_code)}
              `}>
                <div className="flex items-center">
                  {getStatusIcon(order.state_code, React)}
                  <span className="mr-1 truncate">{getStatusLabel(order.state_code, order.state_value, order.masked_state)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Order Type and Location - Fixed height */}
          <div className="flex items-center justify-between h-6">
            <div className="flex items-center gap-2">
              <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                <Package className="w-3 h-3 ml-1" />
                {memoizedData.businessCategory === 'service' ? 'خدمة' : memoizedData.businessCategory === 'high_value' ? 'قيمة عالية' : 'طلب عادي'}
              </div>
            </div>
            <div className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate max-w-24">
              {memoizedData.cityName}
            </div>
          </div>
        </div>

        {/* Card Content - Streamlined with fixed heights */}
        <div className="p-4 space-y-4 flex-grow">
          {/* Customer Information - Fixed height */}
          <div className="space-y-2 h-20">
            <div className="flex items-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              <Users className="w-3 h-3 ml-1.5 text-brand-red-500" />
              العميل
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 h-12 flex flex-col justify-center">
              <div className="font-bold text-gray-900 dark:text-white text-sm leading-tight mb-1 truncate">
                {memoizedData.receiverName}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 font-mono truncate">
                {memoizedData.receiverPhone}
              </div>
            </div>
          </div>

          {/* Product Information - Conditional with fixed height */}
          {memoizedData.productName && (
            <div className="space-y-2 h-20">
              <div className="flex items-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                <Package className="w-3 h-3 ml-1.5 text-brand-red-500" />
                المنتج
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 h-12 flex flex-col justify-center">
                <div className="font-medium text-gray-900 dark:text-white text-sm mb-1 truncate">
                  {memoizedData.productName}
                </div>
                <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                  <span>الكمية: {memoizedData.productCount}</span>
                  {order.specs_description && (
                    <span className="text-xs">تفاصيل إضافية</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Financial Information - Fixed height */}
          <div className="space-y-2 h-20">
            <div className="flex items-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              <DollarSign className="w-3 h-3 ml-1.5 text-green-500" />
              المالية
            </div>
            <div className="grid grid-cols-2 gap-2 h-12">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-2 text-center border border-gray-200 dark:border-gray-700 flex flex-col justify-center">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">المبلغ</div>
                <div className="text-sm font-bold text-gray-900 dark:text-white">
                  {memoizedData.cod} ج.م
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-2 text-center border border-gray-200 dark:border-gray-700 flex flex-col justify-center">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">الرسوم</div>
                <div className="text-sm font-bold text-gray-900 dark:text-white">
                  {memoizedData.bostaFees} ج.م
                </div>
              </div>
            </div>
          </div>

          {/* Location Information - Fixed height */}
          <div className="space-y-2 h-20">
            <div className="flex items-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              <MapPin className="w-3 h-3 ml-1.5 text-brand-red-500" />
              العنوان
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 h-12 flex flex-col justify-center">
              <div className="text-sm font-medium text-gray-900 dark:text-white mb-1 truncate">
                {memoizedData.cityName} - {memoizedData.districtName}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed truncate">
                {memoizedData.address}
              </div>
            </div>
          </div>

          {/* Business Category - Fixed height */}
          <div className="space-y-2 h-16">
            <div className="flex items-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              <Package className="w-3 h-3 ml-1.5 text-brand-red-500" />
              الفئة التجارية
            </div>
            <div className="flex justify-center h-8">
              <BusinessCategoryBadge
                businessCategory={memoizedData.businessCategory}
                codCategory={order.cod_category}
                cod={order.cod}
                size="sm"
              />
            </div>
          </div>
          
          {/* Timeline Progress - Fixed height */}
          {memoizedData.timeline && (
            <div className="space-y-2 h-20">
              <div className="flex items-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                <TrendingUp className="w-3 h-3 ml-1.5 text-brand-red-500" />
                حالة التوصيل
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 h-12">
                {/* Clean Progress Line - Fixed Boundaries */}
                <div className="relative mb-3">
                  {/* Progress Line */}
                  <div className="w-full relative px-2">
                    {/* Background Line - Fixed Boundaries */}
                    <div className="absolute top-2 left-2 right-2 h-0.5 bg-gray-200 dark:bg-gray-700"></div>
                    
                    {/* Progress Fill Line - Optimized */}
                    <div 
                      className="absolute top-2 left-2 h-0.5 bg-gradient-to-r from-brand-red-500 to-brand-red-400 transition-all duration-1000 ease-out"
                      style={{ 
                        width: getCardsProgressWidth(memoizedData.timeline) 
                      }}
                    >
                      {/* Progress Shimmer Effect - Reduced animation */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                    </div>
                    
                    {/* Timeline Dots */}
                    <div className="relative flex justify-between items-center">
                      {memoizedData.timeline.map((step, idx) => (
                        <div 
                          key={step.code}
                          className={`w-2 h-2 rounded-full transition-all duration-300 ${
                            step.done 
                              ? 'bg-brand-red-500 shadow-sm' 
                              : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Timeline Labels */}
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  {memoizedData.timeline.slice(0, 3).map((step, idx) => (
                    <span key={step.code} className="text-center truncate">
                      {getTimelineLabel(step.value)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Notes Section - Fixed height with expansion */}
          {memoizedData.notes && (
            <div className="space-y-2 h-20">
              <div className="flex items-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                <MessageSquare className="w-3 h-3 ml-1.5 text-brand-red-500" />
                ملاحظات
              </div>
              <div 
                className={`${isNoteExpanded ? '' : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors rounded-lg'}`}
                onClick={!isNoteExpanded ? () => toggleNoteExpansion(memoizedData.orderId) : undefined}
              >
                {isNoteExpanded ? (
                  <div className="space-y-2">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 min-h-12">
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {memoizedData.notes}
                      </p>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleNoteExpansion(memoizedData.orderId);
                      }}
                      className="text-brand-red-600 hover:text-brand-red-700 text-xs flex items-center transition-colors"
                    >
                      <ChevronUp className="w-3 h-3 ml-1" />
                      عرض أقل
                    </button>
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 h-12 flex items-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2">
                      {truncateText(memoizedData.notes, 80)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Additional Information - Fixed height */}
          <div className="grid grid-cols-2 gap-2 text-xs h-16">
            {memoizedData.attemptsCount > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-2 text-center border border-gray-200 dark:border-gray-700 flex flex-col justify-center">
                <div className="text-gray-600 dark:text-gray-400">محاولات التوصيل</div>
                <div className="font-bold text-gray-900 dark:text-white">{memoizedData.attemptsCount}</div>
              </div>
            )}
            {memoizedData.callsCount > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-2 text-center border border-gray-200 dark:border-gray-700 flex flex-col justify-center">
                <div className="text-gray-600 dark:text-gray-400">المكالمات</div>
                <div className="font-bold text-gray-900 dark:text-white">{memoizedData.callsCount}</div>
              </div>
            )}
          </div>
        </div>

        {/* Card Actions - Fixed height */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 h-16">
          <div className="grid grid-cols-2 gap-2 h-full">
            <button
              onClick={() => window.location.href = `/customers/${memoizedData.receiverPhone}`}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-brand-red-600 hover:bg-brand-red-700 text-white text-sm font-medium transition-all duration-200 shadow-sm"
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">العميل</span>
            </button>
            <button
              onClick={() => window.open(`https://business.bosta.co/orders/${memoizedData.trackingNumber}`, '_blank')}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium transition-all duration-200 border border-gray-200 dark:border-gray-600 shadow-sm"
            >
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">التفاصيل</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default OrderCard; 