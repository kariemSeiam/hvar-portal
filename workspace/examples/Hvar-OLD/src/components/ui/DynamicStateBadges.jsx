import React from 'react';
import { RefreshCw, TrendingUp, AlertTriangle, Info } from 'lucide-react';
import OrderStatusBadge from './OrderStatusBadge';
import { useOrderStates } from '../../hooks/useOrderStates';
import Card from './Card';
import Button from './Button';

/**
 * Dynamic State Badges Component
 * Displays all order states with real metrics from API endpoints
 * Flexible and responsive design that adapts to actual data
 */
const DynamicStateBadges = ({
  // Display options
  showMetrics = true,
  showPercentage = true,
  showCount = true,
  showRevenue = false,
  showFees = false,
  
  // Layout options
  layout = 'grid', // 'grid', 'list', 'compact'
  maxStates = null, // null for all states
  sortBy = 'count', // 'count', 'percentage', 'revenue'
  
  // Filter options
  minPercentage = 0,
  minCount = 0,
  
  // Date range
  dateFrom,
  dateTo,
  
  // Refresh options
  autoRefresh = false,
  refreshInterval = 30000, // 30 seconds
  
  // Styling
  className = '',
  size = 'md',
  showRefreshButton = true,
  showSummary = true,
  
  ...props
}) => {
  const {
    states,
    totalOrders,
    statesLoading,
    statesError,
    statesLastUpdated,
    getStatesByCount,
    getStatesByPercentage,
    getStatesByRevenueImpact,
    refresh
  } = useOrderStates({
    dateFrom,
    dateTo,
    autoFetch: true,
    refreshInterval: autoRefresh ? refreshInterval : null
  });

  // Get sorted and filtered states
  const getFilteredStates = () => {
    let sortedStates;
    
    switch (sortBy) {
      case 'percentage':
        sortedStates = getStatesByPercentage();
        break;
      case 'revenue':
        sortedStates = getStatesByRevenueImpact();
        break;
      case 'count':
      default:
        sortedStates = getStatesByCount();
        break;
    }

    // Apply filters
    let filteredStates = sortedStates.filter(state => {
      if (state.percentage < minPercentage) return false;
      if (state.count < minCount) return false;
      return true;
    });

    // Apply max limit
    if (maxStates && filteredStates.length > maxStates) {
      filteredStates = filteredStates.slice(0, maxStates);
    }

    return filteredStates;
  };

  const filteredStates = getFilteredStates();

  // Layout classes
  const getLayoutClasses = () => {
    switch (layout) {
      case 'list':
        return 'space-y-2';
      case 'compact':
        return 'flex flex-wrap gap-1';
      case 'grid':
      default:
        return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3';
    }
  };

  // Format last updated time
  const formatLastUpdated = () => {
    if (!statesLastUpdated) return 'غير متوفر';
    
    const now = new Date();
    const diff = now - statesLastUpdated;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'الآن';
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `منذ ${hours} ساعة`;
    
    const days = Math.floor(hours / 24);
    return `منذ ${days} يوم`;
  };

  // Loading state
  if (statesLoading && states.length === 0) {
    return (
      <Card className={`p-6 ${className}`} {...props}>
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-brand-red-600" />
          <span className="mr-3 text-gray-600">جاري تحميل حالات الطلبات...</span>
        </div>
      </Card>
    );
  }

  // Error state
  if (statesError) {
    return (
      <Card className={`p-6 ${className}`} {...props}>
        <div className="flex items-center justify-center py-8 text-red-600">
          <AlertTriangle className="w-6 h-6 mr-2" />
          <span>خطأ في تحميل البيانات: {statesError}</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`} {...props}>
      {/* Header with summary and refresh */}
      {showSummary && (
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-red-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                حالات الطلبات
              </h3>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span>إجمالي الطلبات: {totalOrders.toLocaleString()}</span>
              <span>الحالات: {filteredStates.length}</span>
              <span className="flex items-center gap-1">
                <Info className="w-4 h-4" />
                آخر تحديث: {formatLastUpdated()}
              </span>
            </div>
          </div>
          
          {showRefreshButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              disabled={statesLoading}
              leftIcon={<RefreshCw className={`w-4 h-4 ${statesLoading ? 'animate-spin' : ''}`} />}
            >
              تحديث
            </Button>
          )}
        </div>
      )}

      {/* States Grid/List */}
      <div className={getLayoutClasses()}>
        {filteredStates.map((state) => (
          <div
            key={state.state_code}
            className={`
              ${layout === 'compact' ? '' : 'p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow'}
            `}
          >
            <OrderStatusBadge
              stateCode={state.state_code}
              stateValue={state.state_value}
              count={state.count}
              percentage={state.percentage}
              totalCod={state.totalCod}
              avgCod={state.avgCod}
              totalFees={state.totalFees}
              size={size}
              showMetrics={showMetrics}
              showPercentage={showPercentage}
              className="w-full justify-center"
            />
            
            {/* Additional metrics for non-compact layout */}
            {layout !== 'compact' && (showRevenue || showFees) && (
              <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1">
                {showRevenue && state.totalCod !== 0 && (
                  <div className="flex justify-between">
                    <span>إجمالي COD:</span>
                    <span className="font-medium">
                      {state.totalCod.toLocaleString()} جنيه
                    </span>
                  </div>
                )}
                
                {showRevenue && state.avgCod !== 0 && (
                  <div className="flex justify-between">
                    <span>متوسط COD:</span>
                    <span className="font-medium">
                      {state.avgCod.toLocaleString()} جنيه
                    </span>
                  </div>
                )}
                
                {showFees && state.totalFees !== 0 && (
                  <div className="flex justify-between">
                    <span>إجمالي الرسوم:</span>
                    <span className="font-medium">
                      {state.totalFees.toLocaleString()} جنيه
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty state */}
      {filteredStates.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>لا توجد حالات طلبات متاحة</p>
        </div>
      )}

      {/* Loading indicator for refresh */}
      {statesLoading && states.length > 0 && (
        <div className="flex items-center justify-center mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <RefreshCw className="w-4 h-4 animate-spin text-brand-red-600 mr-2" />
          <span className="text-sm text-gray-600">جاري التحديث...</span>
        </div>
      )}
    </Card>
  );
};

export default DynamicStateBadges; 