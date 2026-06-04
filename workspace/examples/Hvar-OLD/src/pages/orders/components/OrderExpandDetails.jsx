import React from 'react';
import {
  Loader,
  Package,
  Truck,
  Navigation,
  MapPin,
  CheckCircle,
  RotateCcw,
  AlertCircle,
  XCircle,
  FileText
} from 'lucide-react';
import { formatTimelineData, calculateProgressPercentage, getProgressWidth, getTimelineLabel } from '../utils';

const OrderExpandDetails = ({ order, orderDetails, isLoading }) => {
  const timelineData = formatTimelineData(orderDetails?.timeline || order.timeline);
  const formatTime = (date) => date ? new Date(date).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }) : '--';

  if (isLoading) {
    return (
      <div className="min-h-20 flex items-center justify-center bg-white dark:bg-gray-900 p-4">
        <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-lg px-4 py-3 shadow-sm border border-gray-200 dark:border-gray-700">
          <Loader className="w-5 h-5 text-brand-red-500 animate-spin" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">جاري تحميل التفاصيل...</span>
        </div>
      </div>
    );
  }

  // Enhanced timeline icons with comprehensive state coverage
  const getTimelineIcon = (code, done) => {
    const iconClass = `w-3.5 h-3.5 ${done ? 'text-white' : 'text-gray-400'}`;
    switch (code) {
      case 10: return <Package className={iconClass} />;
      case 21: return <Truck className={iconClass} />;
      case 30: return <Navigation className={iconClass} />;
      case 41: return <MapPin className={iconClass} />;
      case 45: return <CheckCircle className={iconClass} />;
      case 46: return <RotateCcw className={iconClass} />;
      case 47: return <AlertCircle className={iconClass} />;
      case 48: return <XCircle className={iconClass} />;
      case 100: return <AlertCircle className={iconClass} />;
      case 101: return <AlertCircle className={iconClass} />;
      default: return <Package className={iconClass} />;
    }
  };

  // Get timeline color based on state with comprehensive coverage
  const getTimelineColor = (code, done) => {
    if (done) return 'bg-brand-red-500 border-brand-red-500 shadow-md shadow-brand-red-500/25';

    switch (code) {
      // Standard delivery flow
      case 10: return 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600';
      case 21: return 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600';
      case 30: return 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600';
      case 41: return 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600';
      case 45: return 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600';

      // Return states
      case 46: return 'bg-orange-100 dark:bg-orange-900/20 border-orange-300 dark:border-orange-600';

      // Exception states
      case 47: return 'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-600';

      // Failed states
      case 48: return 'bg-red-100 dark:bg-red-900/20 border-red-300 dark:border-red-600';

      // Critical states
      case 100: return 'bg-red-100 dark:bg-red-900/20 border-red-300 dark:border-red-600';
      case 101: return 'bg-red-100 dark:bg-red-900/20 border-red-300 dark:border-red-600';

      // Additional states from analytics
      case 20: return 'bg-blue-100 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600';
      case 25: return 'bg-purple-100 dark:bg-purple-900/20 border-purple-300 dark:border-purple-600';
      case 24: return 'bg-indigo-100 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-600';

      default: return 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600';
    }
  };

  // Get timeline status indicator color
  const getTimelineStatusColor = (code, done) => {
    if (done) return 'text-brand-red-600 dark:text-brand-red-400';

    switch (code) {
      case 46: return 'text-orange-600 dark:text-orange-400';
      case 47: return 'text-yellow-600 dark:text-yellow-400';
      case 48: return 'text-red-600 dark:text-red-400';
      case 100: return 'text-red-600 dark:text-red-400';
      case 101: return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-500 dark:text-gray-400';
    }
  };

  return (
    <div className="w-full bg-white dark:bg-gray-900 p-4">
      <div className="w-full space-y-4">

        {/* First Row: Product Details & Address Information */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Product Information */}
          {order.product_name && (
            <div className="w-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Package className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-gray-900 dark:text-white">تفاصيل المنتج</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">معلومات الشحنة</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-900 dark:text-white break-words leading-tight">
                  {order.product_name}
                </div>
                <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                  <span>الكمية: {order.product_count || order.specs_items_count || 1}</span>
                  {order.specs_description && (
                    <span className="text-xs opacity-75">تفاصيل إضافية</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Location Information */}
          <div className="w-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                <MapPin className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-gray-900 dark:text-white">معلومات العنوان</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">موقع التوصيل</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-900 dark:text-white break-words leading-tight">
                {order.dropoff_city_name} - {order.dropoff_district_name}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 break-words leading-tight">
                {order.dropoff_first_line || 'غير محدد'}
              </div>
              {order.dropoff_zone_name && (
                <div className="text-xs text-gray-500 dark:text-gray-400 opacity-75 break-words">
                  المنطقة: {order.dropoff_zone_name}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Second Row: Timeline & Notes on Same Horizontal Line */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Timeline Section - Takes 2/3 of the space */}
          <div className="lg:col-span-2 w-full">
            <div className="w-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
              {/* Timeline Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-brand-red-500 to-brand-red-600 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                  <Navigation className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-gray-900 dark:text-white">مسار التوصيل</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">تتبع حالة الطلب</div>
                </div>
              </div>

              {/* Timeline Flow */}
              <div className="w-full">
                {/* Expert Progress Line - Fixed Boundaries */}
                <div className="w-full relative mb-4">
                  {/* Progress Line with State Connections */}
                  <div className="w-full relative px-4" >
                    {/* Background Line - Between States Only */}
                    <div dir='rtl'
                    className="absolute top-4 left-8 right-8 h-0.5 bg-gray-200 dark:bg-gray-700"></div>

                                          {/* Progress Fill Line - Between States Only */}
                      <div
                        className="absolute top-4 right-8 h-0.5 bg-gradient-to-l from-brand-red-500 to-brand-red-400 transition-all duration-1000 ease-out"
                        style={{
                          width: `calc(${calculateProgressPercentage(timelineData)}% - 5rem)`
                        }}
                      >
                      {/* Progress Shimmer Effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                    </div>

                    {/* Timeline States */}
                    <div className="relative flex justify-between items-start">
                      {timelineData.slice(0, 5).map((event, i) => (
                        <div key={i} className="flex flex-col items-center relative">
                          {/* State Circle */}
                          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mb-2 transition-all duration-300 flex-shrink-0 ${getTimelineColor(event.code, event.done)}`}>
                            {getTimelineIcon(event.code, event.done)}
                          </div>

                          {/* State Label */}
                          <div className="text-xs text-center w-full px-1">
                            <div className={`font-medium leading-tight ${getTimelineStatusColor(event.code, event.done)}`}>
                              {getTimelineLabel(event.value)}
                            </div>
                            {event.date && (
                              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                {formatTime(event.date)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes Section - Takes 1/3 of the space */}
          {order.notes && (
            <div className="lg:col-span-1 w-full">
              <div className="w-full h-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 flex flex-col">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">ملاحظات خاصة</span>
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed break-words flex-1">
                  {order.notes.length > 80 ? order.notes.substring(0, 80) + '...' : order.notes}
                </div>
                {order.notes.length > 80 && (
                  <div className="mt-3 text-xs text-brand-red-600 dark:text-brand-red-400 text-center bg-brand-red-50 dark:bg-brand-red-900/20 px-2 py-1 rounded-lg border border-brand-red-200 dark:border-brand-red-800">
                    اضغط لعرض المزيد
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderExpandDetails; 