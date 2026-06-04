import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api } from '../services/api';

/**
 * Orders Context for global orders state management
 */
const OrdersContext = createContext();

/**
 * Orders Provider Component
 */
export const OrdersProvider = ({ children }) => {
  const [ordersData, setOrdersData] = useState({
    totalOrders: 0,
    businessCounts: {
      total: 0,
      sales: 0,
      service: 0,
      returns: 0,
      processing: 0,
      problems: 0
    },
    lastUpdated: null,
    loading: false
  });

  /**
   * Fetch orders summary data
   */
  const fetchOrdersSummary = useCallback(async () => {
    try {
      setOrdersData(prev => ({ ...prev, loading: true }));
      
      // Fetch business counts for sidebar badges
      const businessCountsResponse = await api.orders.getBusinessCounts();
      if (businessCountsResponse.success) {
        setOrdersData(prev => ({
          ...prev,
          businessCounts: businessCountsResponse.data || {
            total: 0,
            sales: 0,
            service: 0,
            returns: 0,
            processing: 0,
            problems: 0
          },
          lastUpdated: new Date().toISOString()
        }));
      }
    } catch (error) {
      console.error('Error fetching orders summary:', error);
      // Set fallback data
      setOrdersData(prev => ({
        ...prev,
        businessCounts: {
          total: 0,
          sales: 0,
          service: 0,
          returns: 0,
          processing: 0,
          problems: 0
        }
      }));
    } finally {
      setOrdersData(prev => ({ ...prev, loading: false }));
    }
  }, []);

  /**
   * Update orders data from OrdersPage
   */
  const updateOrdersData = useCallback((newData) => {
    setOrdersData(prev => ({
      ...prev,
      ...newData,
      lastUpdated: new Date().toISOString()
    }));
  }, []);

  /**
   * Get total orders count for sidebar badge
   */
  const getTotalOrdersCount = useCallback(() => {
    return ordersData.businessCounts.total || 0;
  }, [ordersData.businessCounts.total]);

  /**
   * Get business counts for sidebar badges
   */
  const getBusinessCounts = useCallback(() => {
    return ordersData.businessCounts;
  }, [ordersData.businessCounts]);

  /**
   * Initial data fetch
   */
  useEffect(() => {
    fetchOrdersSummary();
  }, [fetchOrdersSummary]);

  /**
   * Auto-refresh data every 5 minutes
   */
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrdersSummary();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [fetchOrdersSummary]);

  const value = {
    ordersData,
    fetchOrdersSummary,
    updateOrdersData,
    getTotalOrdersCount,
    getBusinessCounts
  };

  return (
    <OrdersContext.Provider value={value}>
      {children}
    </OrdersContext.Provider>
  );
};

/**
 * Hook to use orders context
 */
export const useOrders = () => {
  const context = useContext(OrdersContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrdersProvider');
  }
  return context;
};

/**
 * Hook to get total orders count for sidebar
 */
export const useOrdersCount = () => {
  const { getTotalOrdersCount, ordersData } = useOrders();
  return {
    totalOrders: getTotalOrdersCount(),
    loading: ordersData.loading,
    lastUpdated: ordersData.lastUpdated
  };
};

/**
 * Hook to get business counts for sidebar badges
 */
export const useBusinessCounts = () => {
  const { getBusinessCounts, ordersData } = useOrders();
  return {
    businessCounts: getBusinessCounts(),
    loading: ordersData.loading,
    lastUpdated: ordersData.lastUpdated
  };
}; 