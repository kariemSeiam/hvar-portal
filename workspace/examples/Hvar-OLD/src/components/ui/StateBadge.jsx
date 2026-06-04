import React from 'react';
import OrderStatusBadge from './OrderStatusBadge';

/**
 * Simple State Badge Component
 * Wrapper around OrderStatusBadge for individual order states
 * Can receive dynamic data from API responses
 */
const StateBadge = ({
  // Order state data
  stateCode,
  stateValue,
  maskedState,
  
  // Optional metrics from API
  count,
  percentage,
  totalCod,
  avgCod,
  totalFees,
  
  // Display options
  size = 'md',
  showIcon = true,
  showMetrics = false,
  showPercentage = false,
  
  // Styling
  className = '',
  
  ...props
}) => {
  return (
    <OrderStatusBadge
      stateCode={stateCode}
      stateValue={stateValue}
      maskedState={maskedState}
      count={count}
      percentage={percentage}
      totalCod={totalCod}
      avgCod={avgCod}
      totalFees={totalFees}
      size={size}
      showIcon={showIcon}
      showMetrics={showMetrics}
      showPercentage={showPercentage}
      className={className}
      {...props}
    />
  );
};

export default StateBadge; 