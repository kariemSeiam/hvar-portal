import { useState, useEffect } from 'react';
import { api } from '../services/api';

/**
 * Hook to fetch and manage order states distribution data
 * Provides dynamic state data from API endpoints without hardcoded values
 */
export const useOrderStates = (options = {}) => {
  const {
    dateFrom,
    dateTo,
    autoFetch = true,
    refreshInterval = null
  } = options;

  const [statesData, setStatesData] = useState({
    states: [],
    totalOrders: 0,
    loading: false,
    error: null,
    lastUpdated: null
  });

  const [analyticsData, setAnalyticsData] = useState({
    overallMetrics: {},
    stateDistribution: {},
    loading: false,
    error: null,
    lastUpdated: null
  });

  // Fetch states distribution
  const fetchStatesDistribution = async () => {
    try {
      setStatesData(prev => ({ ...prev, loading: true, error: null }));
      
      const params = {};
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      
      const response = await api.orders.getStatesDistribution(params);
      
      if (response.success) {
        setStatesData({
          states: response.data.states || [],
          totalOrders: response.data.total_orders || 0,
          loading: false,
          error: null,
          lastUpdated: new Date()
        });
      } else {
        throw new Error(response.error || 'Failed to fetch states distribution');
      }
    } catch (error) {
      console.error('Error fetching states distribution:', error);
      setStatesData(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
    }
  };

  // Fetch comprehensive analytics
  const fetchAnalytics = async () => {
    try {
      setAnalyticsData(prev => ({ ...prev, loading: true, error: null }));
      
      const params = {};
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      
      const response = await api.orders.getAnalytics(params);
      
      if (response.success) {
        setAnalyticsData({
          overallMetrics: response.data.overall_metrics || {},
          stateDistribution: response.data.state_distribution || {},
          loading: false,
          error: null,
          lastUpdated: new Date()
        });
      } else {
        throw new Error(response.error || 'Failed to fetch analytics');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setAnalyticsData(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
    }
  };

  // Get state by code with metrics
  const getStateWithMetrics = (stateCode) => {
    const state = statesData.states.find(s => s.state_code === stateCode);
    if (!state) return null;

    return {
      ...state,
      percentage: state.percentage || 0,
      count: state.count || 0,
      totalCod: state.total_cod || 0,
      avgCod: state.avg_cod || 0,
      totalFees: state.total_fees || 0
    };
  };

  // Get all states with metrics
  const getAllStatesWithMetrics = () => {
    return statesData.states.map(state => ({
      ...state,
      percentage: state.percentage || 0,
      count: state.count || 0,
      totalCod: state.total_cod || 0,
      avgCod: state.avg_cod || 0,
      totalFees: state.total_fees || 0
    }));
  };

  // Get states sorted by count (most common first)
  const getStatesByCount = () => {
    return getAllStatesWithMetrics().sort((a, b) => b.count - a.count);
  };

  // Get states sorted by percentage (highest first)
  const getStatesByPercentage = () => {
    return getAllStatesWithMetrics().sort((a, b) => b.percentage - a.percentage);
  };

  // Get states by revenue impact
  const getStatesByRevenueImpact = () => {
    return getAllStatesWithMetrics().sort((a, b) => b.totalCod - a.totalCod);
  };

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchStatesDistribution();
      fetchAnalytics();
    }
  }, [autoFetch, dateFrom, dateTo]);

  // Refresh interval
  useEffect(() => {
    if (!refreshInterval) return;

    const interval = setInterval(() => {
      fetchStatesDistribution();
      fetchAnalytics();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, dateFrom, dateTo]);

  return {
    // States data
    states: statesData.states,
    totalOrders: statesData.totalOrders,
    statesLoading: statesData.loading,
    statesError: statesData.error,
    statesLastUpdated: statesData.lastUpdated,
    
    // Analytics data
    analytics: analyticsData.overallMetrics,
    stateDistribution: analyticsData.stateDistribution,
    analyticsLoading: analyticsData.loading,
    analyticsError: analyticsData.error,
    analyticsLastUpdated: analyticsData.lastUpdated,
    
    // Helper functions
    getStateWithMetrics,
    getAllStatesWithMetrics,
    getStatesByCount,
    getStatesByPercentage,
    getStatesByRevenueImpact,
    
    // Actions
    fetchStatesDistribution,
    fetchAnalytics,
    refresh: () => {
      fetchStatesDistribution();
      fetchAnalytics();
    }
  };
}; 