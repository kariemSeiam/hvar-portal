import React, { memo } from 'react';
import { Eye, Users, ChevronUp, ChevronDown } from 'lucide-react';
import { OrderStatusBadge, BusinessCategoryBadge, FinancialBadge, Button } from "../../../components/ui";
import OrderExpandDetails from './OrderExpandDetails';
import { formatDate } from '../utils';

const OrderRow = memo(({ order, toggleOrderExpansion, isExpanded, orderDetails, isLoadingDetails, formatTimelineData }) => {
  const orderId = order.id || order.tracking_number;
  
  const handleRowClick = (e) => {
    // Don't expand if clicking on buttons or links
    if (e.target.closest('button') || e.target.closest('a')) {
      return;
    }
    toggleOrderExpansion(orderId);
  };

  return (
    <React.Fragment key={orderId}>
      <tr 
        className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
        onClick={handleRowClick}
      >
        <td className="px-4 py-4 whitespace-nowrap">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md transition-colors">
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </div>
            <a
              href={`https://business.bosta.co/orders/${order.tracking_number}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-brand-red-600 hover:text-brand-red-700 hover:underline transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              #{order.tracking_number || order.id}
            </a>
          </div>
        </td>
        <td className="px-4 py-4 whitespace-nowrap">
          <div className="flex flex-col gap-2">
            <div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {order.receiver_name || 'غير محدد'}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 block">
                {order.receiver_phone}
              </span>
            </div>
          </div>
        </td>
        <td className="px-4 py-4 whitespace-nowrap">
          <div className="flex justify-center">
            <OrderStatusBadge
              stateCode={order.state_code}
              stateValue={order.state_value}
              maskedState={order.masked_state}
              size="sm"
            />
          </div>
        </td>
        <td className="px-4 py-4 whitespace-nowrap">
          <div className="flex justify-center">
            <BusinessCategoryBadge
              businessCategory={order.business_category}
              codCategory={order.cod_category}
              cod={order.cod}
              size="sm"
            />
          </div>
        </td>
        <td className="px-4 py-4 whitespace-nowrap">
          <div className="flex justify-center">
            <FinancialBadge
              cod={order.cod}
              bostaFees={order.bosta_fees}
              type="expandable"
              size="sm"
            />
          </div>
        </td>
        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
          {formatDate(order.created_at)}
        </td>
        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
          {order.dropoff_city_name || 'غير محدد'}
        </td>
        <td className="px-4 py-4 whitespace-nowrap">
          <div className="flex items-center justify-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                window.open(`https://business.bosta.co/orders/${order.tracking_number}`, '_blank');
              }}
              className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <Eye className="w-4 h-4 ml-2" />
              عرض
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = `/customers/${order.receiver_phone}`;
              }}
              className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <Users className="w-4 h-4 ml-2" />
              العميل
            </Button>
          </div>
        </td>
      </tr>
      
      {/* Expanded Details Row - Simple Transition */}
      {isExpanded && (
        <tr className="overflow-hidden">
          <td colSpan="8" className="p-0 border-0">
            <div className="transition-all duration-200 ease-in-out">
              <OrderExpandDetails
                order={order}
                orderDetails={orderDetails}
                isLoading={isLoadingDetails}
                timelineData={formatTimelineData(orderDetails?.timeline || order.timeline)}
              />
            </div>
          </td>
        </tr>
      )}
    </React.Fragment>
  );
});

export default OrderRow; 