import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  Calendar, 
  MapPin, 
  Eye, 
  Users,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  ChevronRight,
  Clock,
  AlertCircle,
  DollarSign,
  Package,
  ArrowRight,
  TrendingUp,
  ChevronDownIcon,
  Loader,
  Home,
  CheckCircle,
  RotateCcw,
  XCircle,
  Truck,
  Warehouse,
  Phone,
  Mail,
  FileText,
  Navigation,
  Zap,
  Shield,
  Star,
  Info,
  ExternalLink,
  Circle,
  RefreshCw,
  Wrench,
  Gift,
  AlertTriangle
} from 'lucide-react';
import OrderExpandDetails from './components/OrderExpandDetails';
import { OrderStatusBadge, BusinessCategoryBadge, FinancialBadge, Card, Button, Input, EmptyState } from "../../components/ui";
import { api } from '../../services/api';
import { useOrders } from '../../context/OrdersContext';
import {
  formatTimelineData,
  getCardsProgressWidth,
  getTimelineLabel,
  truncateText,
  getStatusBadgeStyle,
  getStatusIcon,
  getStatusLabel,
  getCategoryColor,
  formatDate,
  getOrderTypeColor,
} from './utils';
import OrderCard from './components/OrderCard';
import OrderRow from './components/OrderRow';

const OrdersPage = () => {
  const { updateOrdersData } = useOrders();
  const [orders, setOrders] = useState([]);
  const [orderStates, setOrderStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('table');
  const [filters, setFilters] = useState({});
  const [selectedState, setSelectedState] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDir, setSortDir] = useState('DESC');
  const [expandedNotes, setExpandedNotes] = useState({});
  const [expandedOrders, setExpandedOrders] = useState(new Set());
  const [expandedOrderDetails, setExpandedOrderDetails] = useState({});
  const [loadingExpandedDetails, setLoadingExpandedDetails] = useState(new Set());
  const [pagination, setPagination] = useState({
    currentPage: 1,
    limit: 20,
    offset: 0,
    total: 0,
    hasMore: true
  });

  // Dynamic filter data from API
  const [filterData, setFilterData] = useState({
    businessCategories: [],
    orderTypes: [],
    cities: [],
    riskLevels: [],
    businessCounts: {},
    loading: false
  });

  // Enhanced filter state for better organization
  const [advancedFilters, setAdvancedFilters] = useState({
    businessCategories: [],
    orderTypes: [],
    riskLevels: [],
    codRange: { min: '', max: '' },
    phone: '',
    multipleStates: []
  });

  // UI/UX State
  const [filterState, setFilterState] = useState({
    isApplying: false,
    hasChanges: false,
    autoApply: true,
    showQuickActions: false,
    clientSideFilterActive: false
  });

  // Store original orders for client-side filtering
  const [originalOrders, setOriginalOrders] = useState([]);
  
  // Store total count from backend
  const [totalOrdersCount, setTotalOrdersCount] = useState(0);
  
  // Dropdown state for time filters
  const [activeDropdown, setActiveDropdown] = useState(null);
  
  // Format number to K format (e.g., 21.5K)
  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return num.toString();
  };

  // Debounced search term
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  
  // Ref for infinite scroll observer
  const observerRef = useRef(null);
  const loaderRef = useCallback(node => {
    if (loading) return;
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && pagination.hasMore && !loadingMore) {
        loadMoreOrders();
      }
    });
    
    if (node) observerRef.current.observe(node);
  }, [pagination.hasMore, loading, loadingMore]);

  // Fetch orders from API
  const fetchOrders = async (params = {}, shouldReset = true) => {
    try {
      if (shouldReset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      // Ensure reasonable limits for performance
      const safeLimit = Math.min(pagination.limit, 100); // Max 100 orders per request
      
      const queryParams = {
        limit: safeLimit,
        offset: shouldReset ? 0 : pagination.offset + pagination.limit,
        sort_by: sortBy,
        sort_dir: sortDir,
        ...filters,
        ...params
      };

      const response = await api.orders.getOrders(queryParams);
      
              if (response.success) {
          if (shouldReset) {
            setOrders(response.data.orders);
            setOriginalOrders(response.data.orders); // Store original orders
            setTotalOrdersCount(response.data.pagination.total); // Store total count
            
            // Update global context with total orders count
            updateOrdersData({
              totalOrders: response.data.pagination.total
            });
          } else {
            // Prevent duplicates by checking IDs
            const existingIds = new Set(orders.map(order => order.id));
            const newOrders = response.data.orders.filter(order => !existingIds.has(order.id));
            setOrders(prev => [...prev, ...newOrders]);
            setOriginalOrders(prev => [...prev, ...newOrders]); // Update original orders
          }
          
          setPagination(prev => ({
            ...prev,
            offset: shouldReset ? 0 : prev.offset + prev.limit,
            total: response.data.pagination.total,
            currentPage: response.data.pagination.current_page,
            hasMore: response.data.pagination.has_more
          }));
        }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      if (shouldReset) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  };

  // Load more orders for infinite scrolling
  const loadMoreOrders = () => {
    if (!pagination.hasMore || loadingMore) return;
    fetchOrders({}, false);
  };

  // Fetch order states for filters
  const fetchOrderStates = async () => {
    try {
      const response = await api.orders.getStatesDistribution();
      if (response.success) {
        setOrderStates(response.data.states || []);
      }
    } catch (error) {
      console.error('Error fetching order states:', error);
    }
  };

  // Fetch dynamic filter data from API
  const fetchFilterData = async () => {
    try {
      setFilterData(prev => ({ ...prev, loading: true }));
      
      // Fetch business categories
      try {
        const categoriesResponse = await api.orders.getBusinessCategories();
        if (categoriesResponse.success) {
          setFilterData(prev => ({
            ...prev,
            businessCategories: categoriesResponse.data.categories || []
          }));
        }
      } catch (error) {
        console.warn('Business categories endpoint not available, using fallback data');
        // Fallback business categories
        setFilterData(prev => ({
          ...prev,
          businessCategories: [
            { category: 'premium_high', count: 0, total_cod: 0 },
            { category: 'high_value', count: 0, total_cod: 0 },
            { category: 'standard_value', count: 0, total_cod: 0 },
            { category: 'low_value', count: 0, total_cod: 0 },
            { category: 'zero_cod', count: 0, total_cod: 0 },
            { category: 'service', count: 0, total_cod: 0 }
          ]
        }));
      }

      // Fetch order types from comprehensive analytics
      try {
        const analyticsResponse = await api.orders.getComprehensiveAnalytics();
        if (analyticsResponse.success && analyticsResponse.data.order_type_performance) {
          setFilterData(prev => ({
            ...prev,
            orderTypes: analyticsResponse.data.order_type_performance.order_types || []
          }));
        }
      } catch (error) {
        console.warn('Comprehensive analytics endpoint not available, using fallback data');
        // Fallback order types
        setFilterData(prev => ({
          ...prev,
          orderTypes: [
            { type_code: 10, type_value: 'Send', count: 0, avg_cod: 0 },
            { type_code: 20, type_value: 'Return to Origin', count: 0, avg_cod: 0 },
            { type_code: 25, type_value: 'Customer Return Pickup', count: 0, avg_cod: 0 },
            { type_code: 30, type_value: 'Exchange', count: 0, avg_cod: 0 }
          ]
        }));
      }

      // Fetch cities from orders data
      try {
        const citiesResponse = await api.orders.getOrders({ limit: 1000 });
        if (citiesResponse.success) {
          const cities = [...new Set(
            citiesResponse.data.orders
              .map(order => order.dropoff_city_name)
              .filter(city => city && city.trim())
          )].sort();
          
          setFilterData(prev => ({
            ...prev,
            cities: cities.map(city => ({ value: city, label: city }))
          }));
        }
      } catch (error) {
        console.warn('Cities data not available, using empty array');
        setFilterData(prev => ({
          ...prev,
          cities: []
        }));
      }

      // Define risk levels based on API logic
      setFilterData(prev => ({
        ...prev,
        riskLevels: [
          { value: 'low', label: 'مخاطر منخفضة', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
          { value: 'medium', label: 'مخاطر متوسطة', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' },
          { value: 'high', label: 'مخاطر عالية', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400' },
          { value: 'critical', label: 'مخاطر حرجة', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' }
        ]
      }));

      // Fetch business counts for quick filters
      try {
        const businessCountsResponse = await api.orders.getBusinessCounts();
        console.log('Business counts response:', businessCountsResponse);
        if (businessCountsResponse.success) {
          const businessCounts = businessCountsResponse.data || {};
          setFilterData(prev => ({
            ...prev,
            businessCounts: businessCounts
          }));
          
          // Update global orders context with real-time data
          updateOrdersData({
            businessCounts: businessCounts
          });
        }
      } catch (error) {
        console.warn('Business counts endpoint not available, using fallback data');
        const fallbackCounts = {
          total: 0,
          sales: 0,
          service: 0,
          returns: 0,
          processing: 0,
          problems: 0
        };
        setFilterData(prev => ({
          ...prev,
          businessCounts: fallbackCounts
        }));
        
        // Update global context with fallback data
        updateOrdersData({
          businessCounts: fallbackCounts
        });
      }

    } catch (error) {
      console.error('Error fetching filter data:', error);
    } finally {
      setFilterData(prev => ({ ...prev, loading: false }));
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchOrders();
    fetchOrderStates();
    fetchFilterData();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeDropdown !== null) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [activeDropdown]);

  // Effect for loaderRef dependency updates
  useEffect(() => {
    // Re-observe when loading state changes
    if (!loading && !loadingMore && pagination.hasMore && observerRef.current) {
      const currentObserver = observerRef.current;
      const currentLoaderRef = document.querySelector('#infinite-scroll-loader');
      if (currentLoaderRef) {
        currentObserver.observe(currentLoaderRef);
      }
    }
  }, [loading, loadingMore, pagination.hasMore]);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Auto-apply filters when search term changes
  useEffect(() => {
    if (debouncedSearchTerm !== searchTerm && filterState.autoApply) {
      handleSearch({ preventDefault: () => {} });
    }
  }, [debouncedSearchTerm]);

  // Handle pagination
  const handlePageChange = (page) => {
    // This is now used only for the table view
    const newOffset = (page - 1) * pagination.limit;
    setPagination(prev => ({
      ...prev,
      offset: newOffset,
      currentPage: page
    }));
    fetchOrders({ offset: newOffset });
  };

  // Reset pagination and filters
  const resetPagination = () => {
    setPagination(prev => ({
      ...prev,
      currentPage: 1,
      offset: 0,
      hasMore: true
    }));
  };

  // Handle sorting
  const handleSort = (field) => {
    const newSortDir = sortBy === field && sortDir === 'ASC' ? 'DESC' : 'ASC';
    setSortBy(field);
    setSortDir(newSortDir);
    resetPagination();
    fetchOrders({ 
      sort_by: field, 
      sort_dir: newSortDir, 
      offset: 0 
    });
  };

  // Enhanced filter change handler with auto-apply
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    
    setFilterState(prev => ({ ...prev, hasChanges: true }));
    
    // Auto-apply for immediate filters
    if (filterState.autoApply && ['state', 'city'].includes(key)) {
      setTimeout(() => applyFilters(), 100);
    }
  };

  // Handle advanced filter changes with better UX
  const handleAdvancedFilterChange = (category, key, value) => {
    setAdvancedFilters(prev => ({
      ...prev,
      [category]: key === 'codRange' ? { ...prev.codRange, ...value } : value
    }));
    
    setFilterState(prev => ({ ...prev, hasChanges: true }));
    
    // Auto-apply for single-select filters
    if (filterState.autoApply && ['phone'].includes(category)) {
      setTimeout(() => applyFilters(), 300);
    }
  };

  // Apply filters with loading state
  const applyFilters = async () => {
    if (filterState.isApplying) return;
    
    setFilterState(prev => ({ ...prev, isApplying: true }));
    
    const enhancedFilters = { ...filters };
    
    // Add business categories - match backend parameter name
    if (advancedFilters.businessCategories.length > 0) {
      enhancedFilters.business_categories = advancedFilters.businessCategories.join(',');
    }
    
    // Add order types - match backend parameter name
    if (advancedFilters.orderTypes.length > 0) {
      enhancedFilters.order_types = advancedFilters.orderTypes.join(',');
    }
    
    // Add risk levels - match backend parameter name
    if (advancedFilters.riskLevels.length > 0) {
      enhancedFilters.risk_levels = advancedFilters.riskLevels.join(',');
    }
    
    // Add COD range - use separate min/max parameters
    if (advancedFilters.codRange.min) {
      enhancedFilters.cod_min = advancedFilters.codRange.min;
    }
    if (advancedFilters.codRange.max) {
      enhancedFilters.cod_max = advancedFilters.codRange.max;
    }
    
    // Add phone filter
    if (advancedFilters.phone) {
      enhancedFilters.phone = advancedFilters.phone;
    }
    
    // Add multiple states - match backend parameter name
    if (advancedFilters.multipleStates.length > 0) {
      enhancedFilters.state_codes = advancedFilters.multipleStates.join(',');
    }
    
    // Add date filters if present
    if (filters.date_from) {
      enhancedFilters.date_from = filters.date_from;
    }
    if (filters.date_to) {
      enhancedFilters.date_to = filters.date_to;
    }
    
    // Add city filter if present
    if (filters.city) {
      enhancedFilters.city = filters.city;
    }
    
    resetPagination();
    await fetchOrders({ ...enhancedFilters, offset: 0 });
    
    setFilterState(prev => ({ 
      ...prev, 
      isApplying: false, 
      hasChanges: false 
    }));
  };

  // Client-side filtering function for masked_state values
  const filterOrdersByMaskedState = (orders, filterType) => {
    switch (filterType) {
      case 'delivered':
        return orders.filter(order => order.masked_state === 'Delivered');
      case 'failed':
        return orders.filter(order => ['Canceled', "Can't be delivered", 'Exception'].includes(order.masked_state));
      case 'returned':
        return orders.filter(order => order.masked_state === 'Returned');
      case 'pending':
        return orders.filter(order => ['in Transit', 'Out for delivery'].includes(order.masked_state));
      default:
        return orders;
    }
  };

  // Enhanced quick filter with client-side option
  const applyQuickFilter = (quickFilter) => {
    if (quickFilter.action === 'expand_all') {
      // Expand all visible orders
      const allOrderIds = orders.map(order => order.id || order.tracking_number);
      setExpandedOrders(new Set(allOrderIds));
      
      // Load details for all orders
      allOrderIds.forEach(orderId => {
        if (!expandedOrderDetails[orderId]) {
          loadOrderDetails(orderId);
        }
      });
      return;
    }
    
    if (quickFilter.action === 'show_all') {
      // Show all orders (reset filters)
      setOrders(originalOrders);
      setFilters({});
      setAdvancedFilters({
        businessCategories: [],
        orderTypes: [],
        riskLevels: [],
        codRange: { min: '', max: '' },
        phone: '',
        multipleStates: []
      });
      resetPagination();
      fetchOrders({ offset: 0 });
      setFilterState(prev => ({ 
        ...prev, 
        clientSideFilterActive: false,
        hasChanges: false 
      }));
      return;
    }
    
    // Check if this is a client-side filter
    if (quickFilter.clientSide) {
      // Apply client-side filtering
      const filteredOrders = filterOrdersByMaskedState(originalOrders, quickFilter.clientSide);
      setOrders(filteredOrders);
      setFilterState(prev => ({ 
        ...prev, 
        clientSideFilterActive: true,
        hasChanges: false 
      }));
      return;
    }
    
    // Apply backend filters
    setFilters(quickFilter.filters);
    resetPagination();
    fetchOrders({ ...quickFilter.filters, offset: 0 });
    setFilterState(prev => ({ 
      ...prev, 
      clientSideFilterActive: false,
      hasChanges: false 
    }));
  };

  // Clear all filters with confirmation
  const clearFilters = () => {
    setFilters({});
    setSelectedState('');
    setSearchTerm('');
    setAdvancedFilters({
      businessCategories: [],
      orderTypes: [],
      riskLevels: [],
      codRange: { min: '', max: '' },
      phone: '',
      multipleStates: []
    });
    
    // If client-side filter is active, restore original orders
    if (filterState.clientSideFilterActive) {
      setOrders(originalOrders);
      setFilterState(prev => ({ 
        ...prev, 
        clientSideFilterActive: false,
        hasChanges: false 
      }));
    } else {
      resetPagination();
      fetchOrders({ offset: 0 });
      setFilterState(prev => ({ ...prev, hasChanges: false }));
    }
  };

  // Quick filter presets - Business-focused based on analytics
  const quickFilters = useMemo(() => [
    // All Orders (default view)
    { 
      name: 'جميع الطلبات', 
      action: 'show_all',
      color: 'bg-gradient-to-r from-brand-red-500 to-brand-red-600 text-white dark:from-brand-red-600 dark:to-brand-red-700',
      icon: 'Package',
      description: 'عرض جميع الطلبات',
      count: formatNumber(filterData.businessCounts.total || totalOrdersCount),
      isPrimary: true
    },
    // Revenue-generating orders (Primary business focus)
    { 
      name: 'المبيعات', 
      filters: { state_codes: '45', cod_min: '500' }, 
      color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      icon: 'CheckCircle',
      description: 'الطلبات المُسلمة عالية القيمة',
      count: formatNumber(filterData.businessCounts.sales || 0)
    },
    // Service orders (maintenance + free service + refunds)
    { 
      name: 'الخدمات', 
      filters: { state_codes: '45', cod_max: '500' }, 
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      icon: 'Wrench',
      description: 'طلبات الصيانة والخدمة والبدائل المجانية',
      count: formatNumber(filterData.businessCounts.service || 0)
    },
    // Returns (Business impact)
    { 
      name: 'المرتجعات', 
      filters: { state_codes: '46' }, 
      color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
      icon: 'RotateCcw',
      description: 'الطلبات المُرجعة للبائع',
      count: formatNumber(filterData.businessCounts.returns || 0)
    },
    // Operational orders
    { 
      name: 'قيد المعالجة', 
      filters: { state_codes: '10,24,30' }, 
      color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-400',
      icon: 'Clock',
      description: 'الطلبات قيد المعالجة والتوصيل',
      count: formatNumber(filterData.businessCounts.processing || 0)
    },
    // Problem orders
    { 
      name: 'مشاكل', 
      filters: { state_codes: '47,48,100,101' }, 
      color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      icon: 'AlertTriangle',
      description: 'الطلبات الملغية والمفقودة',
      count: formatNumber(filterData.businessCounts.problems || 0)
    },
    // Time-based filters
    { 
      name: 'اليوم', 
      filters: { date_from: new Date().toISOString().split('T')[0] }, 
      color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400',
      icon: 'Calendar',
      description: 'طلبات اليوم الحالي',
      count: 0,
      hasDropdown: true,
      dropdownOptions: [
        { name: 'اليوم', value: new Date().toISOString().split('T')[0] },
        { name: 'أمس', value: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
        { name: 'آخر 3 أيام', value: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
        { name: 'آخر أسبوع', value: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }
      ]
    },
    // Special actions
    { 
      name: 'عرض التفاصيل', 
      action: 'expand_all', 
      color: 'bg-brand-red-100 text-brand-red-800 dark:bg-brand-red-900/20 dark:text-brand-red-400',
      icon: 'Eye',
      description: 'فتح تفاصيل جميع الطلبات'
    }
  ], [totalOrdersCount, orderStates, filterData.businessCounts]);

  // Debug: Log business counts
  useEffect(() => {
    console.log('Current business counts:', filterData.businessCounts);
  }, [filterData.businessCounts]);



  // Memoized format date function
  const formatDateMemo = useCallback((dateString) => {
    if (!dateString) return 'غير محدد';
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  // Toggle notes expansion
  const toggleNoteExpansion = (orderId) => {
    setExpandedNotes(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  // Expand/Collapse order details
  const toggleOrderExpansion = async (orderId) => {
    const newExpandedOrders = new Set(expandedOrders);
    
    if (newExpandedOrders.has(orderId)) {
      newExpandedOrders.delete(orderId);
      setExpandedOrders(newExpandedOrders);
      // Remove details from cache
      setExpandedOrderDetails(prev => {
        const newDetails = { ...prev };
        delete newDetails[orderId];
        return newDetails;
      });
    } else {
      newExpandedOrders.add(orderId);
      setExpandedOrders(newExpandedOrders);
      
      // Load detailed order information if not already cached
      if (!expandedOrderDetails[orderId]) {
        await loadOrderDetails(orderId);
      }
    }
  };

  // Load detailed order information
  const loadOrderDetails = async (orderId) => {
    const order = orders.find(o => o.id === orderId || o.tracking_number === orderId);
    if (!order) return;

    setLoadingExpandedDetails(prev => new Set(prev).add(orderId));
    
    try {
      const response = await api.orders.getOrderDetails(order.tracking_number, {
        service_actions: true,
        analytics: true
      });
      
      if (response.success) {

        setExpandedOrderDetails(prev => ({
          ...prev,
          [orderId]: response.data
        }));
      }
    } catch (error) {
      console.error('Error loading order details:', error);
      // Fallback: use basic order data with timeline if available
      let timelineEvents = [];
      if (order.timeline) {
        try {
          // Handle both JSON string and array formats
          timelineEvents = typeof order.timeline === 'string' ? JSON.parse(order.timeline) : order.timeline;
        } catch (e) {
          console.warn('Failed to parse timeline data:', e);
          timelineEvents = [];
        }
      }
      
      const fallbackData = {
        order: order,
        analytics: {
          revenue_impact: order.state_code === 45 ? 'positive' : 'neutral',
          risk_assessment: order.risk_level || 'low',
          business_tier: order.business_category || 'standard_value'
        }
      };
      
      setExpandedOrderDetails(prev => ({
        ...prev,
        [orderId]: fallbackData
      }));
    } finally {
      setLoadingExpandedDetails(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  // Get progress width for visualization
  const getProgressWidth = (timelineData) => {
    const percentage = calculateProgressPercentage(timelineData);
    return `${percentage}%`;
  };

  // Truncate text with ellipsis - Memoized for performance
  const truncateText = useCallback((text, maxLength = 60) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  }, []);

  // Enhanced search with better UX
  const handleSearch = (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    
    if (!searchTerm.trim() && !debouncedSearchTerm.trim()) return;
    
    resetPagination();
    const searchValue = searchTerm.trim() || debouncedSearchTerm.trim();
    fetchOrders({ search: searchValue, offset: 0 });
  };

  // Loading state
  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">جاري تحميل الطلبات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Search & Filters - Professional Compact Design */}
      <div className="w-full bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        {/* Search Bar - Compact Professional Design */}
        <div className="w-full p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <form onSubmit={handleSearch} className="w-full flex items-center gap-3">
            {/* View Toggle - Compact Design */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`
                  p-2 rounded-md transition-all duration-200 flex items-center justify-center
                  ${viewMode === 'cards' 
                    ? 'bg-white dark:bg-gray-700 text-brand-red-600 dark:text-brand-red-400 shadow-sm border border-gray-200 dark:border-gray-600' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }
                `}
                title="عرض البطاقات"
              >
                <div className="grid grid-cols-2 gap-0.5 w-3.5 h-3.5">
                  <div className="w-1 h-1 bg-current rounded-sm"></div>
                  <div className="w-1 h-1 bg-current rounded-sm"></div>
                  <div className="w-1 h-1 bg-current rounded-sm"></div>
                  <div className="w-1 h-1 bg-current rounded-sm"></div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`
                  p-2 rounded-md transition-all duration-200 flex items-center justify-center
                  ${viewMode === 'table' 
                    ? 'bg-white dark:bg-gray-700 text-brand-red-600 dark:text-brand-red-400 shadow-sm border border-gray-200 dark:border-gray-600' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }
                `}
                title="عرض الجدول"
              >
                <div className="flex flex-col gap-0.5 w-3.5 h-3.5">
                  <div className="w-full h-1 bg-current rounded-sm"></div>
                  <div className="w-full h-1 bg-current rounded-sm"></div>
                  <div className="w-full h-1 bg-current rounded-sm"></div>
                </div>
              </button>
            </div>
            
            {/* Search Input - Compact Professional */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-gray-400" />
              </div>
              <Input
                placeholder="البحث في الطلبات (رقم التتبع، الهاتف، اسم العميل...)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-brand-red-500 focus:border-transparent transition-all duration-200 rounded-lg"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {/* Search Button - Compact */}
            <Button 
              type="submit" 
              disabled={!searchTerm.trim()}
              className="px-4 py-2.5 text-sm font-medium bg-brand-red-600 hover:bg-brand-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 rounded-lg"
            >
              بحث
            </Button>
            
            {/* Filters Button - Compact with Indicator */}
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={`
                px-4 py-2.5 text-sm font-medium border border-gray-200 dark:border-gray-700 transition-all duration-200 rounded-lg relative
                ${showFilters 
                  ? 'bg-brand-red-50 dark:bg-brand-red-900/20 text-brand-red-600 dark:text-brand-red-400 border-brand-red-200 dark:border-brand-red-800' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                }
              `}
            >
              <Filter className="w-4 h-4 ml-2" />
              فلاتر
              {filterState.hasChanges && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-orange-500 rounded-full animate-pulse"></span>
              )}
            </Button>
          </form>
        </div>

        {/* Quick Filters - Separate Container */}
        <div className="w-full p-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
          <div className="w-full flex items-center justify-between flex-wrap gap-4">
            {/* Quick Filters Section - Enhanced with Icons and Counts */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                <Zap className="w-4 h-4 ml-2 text-brand-red-500" />
                فلاتر سريعة:
                {filterState.clientSideFilterActive && (
                  <span className="mr-2 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 rounded-full">
                    فلتر محلي
                  </span>
                )}
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                {quickFilters.map((quickFilter, index) => {
                  // Get icon component from imported icons
                  const IconComponent = quickFilter.icon ? 
                    (() => {
                                              const iconMap = {
                          CheckCircle,
                          RotateCcw,
                          RefreshCw,
                          XCircle,
                          Truck,
                          AlertCircle,
                          Clock,
                          Calendar,
                          Package,
                          Eye,
                          Warehouse,
                          Wrench,
                          Gift,
                          AlertTriangle
                        };
                      return iconMap[quickFilter.icon] || null;
                    })() : null;
                  
                  return (
                    <div key={index} className="relative">
                      <button
                        onClick={() => {
                          if (quickFilter.hasDropdown) {
                            setActiveDropdown(activeDropdown === index ? null : index);
                          } else {
                            applyQuickFilter(quickFilter);
                          }
                        }}
                        title={quickFilter.description}
                        className={`
                          group relative px-3 py-2 text-xs font-medium rounded-lg border transition-all duration-200 
                          hover:scale-105 hover:shadow-sm active:scale-95 flex items-center gap-2
                          ${quickFilter.isPrimary 
                            ? 'bg-gradient-to-r from-brand-red-500 to-brand-red-600 text-white border-brand-red-600 dark:from-brand-red-600 dark:to-brand-red-700 dark:border-brand-red-700 hover:from-brand-red-600 hover:to-brand-red-700 shadow-md'
                            : quickFilter.color.includes('bg-green') 
                            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30'
                            : quickFilter.color.includes('bg-orange')
                            ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/30'
                            : quickFilter.color.includes('bg-red')
                            ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30'
                            : quickFilter.color.includes('bg-blue')
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                            : quickFilter.color.includes('bg-purple')
                            ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30'
                            : quickFilter.color.includes('bg-yellow')
                            ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800 hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
                            : quickFilter.color.includes('bg-indigo')
                            ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/30'
                            : quickFilter.color.includes('bg-brand-red')
                            ? 'bg-brand-red-50 dark:bg-brand-red-900/20 text-brand-red-700 dark:text-brand-red-400 border-brand-red-200 dark:border-brand-red-800 hover:bg-brand-red-100 dark:hover:bg-brand-red-900/30'
                            : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }
                        `}
                      >
                        {IconComponent && <IconComponent className="w-3 h-3" />}
                        <span>{quickFilter.name}</span>
                        {quickFilter.count > 0 && (
                          <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold min-w-[1.25rem] text-center ${
                            quickFilter.isPrimary 
                              ? 'bg-white/20 text-white' 
                              : 'bg-white/50 dark:bg-black/20'
                          }`}>
                            {typeof quickFilter.count === 'string' ? quickFilter.count : quickFilter.count.toLocaleString()}
                          </span>
                        )}
                        {quickFilter.hasDropdown && (
                          <ChevronDownIcon className={`w-3 h-3 transition-transform duration-200 ${
                            activeDropdown === index ? 'rotate-180' : ''
                          }`} />
                        )}
                        
                        {/* Enhanced Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                          {quickFilter.description}
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-100"></div>
                        </div>
                      </button>
                      
                      {/* Dropdown for time filters */}
                      {quickFilter.hasDropdown && activeDropdown === index && (
                        <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg z-20">
                          {quickFilter.dropdownOptions.map((option, optionIndex) => (
                            <button
                              key={optionIndex}
                              onClick={() => {
                                applyQuickFilter({
                                  ...quickFilter,
                                  filters: { date_from: option.value }
                                });
                                setActiveDropdown(null);
                              }}
                              className="w-full px-3 py-2 text-xs text-right hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 first:rounded-t-lg last:rounded-b-lg"
                            >
                              {option.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {/* Reset Filters Button */}
                <button
                  onClick={clearFilters}
                  title="إعادة تعيين جميع الفلاتر"
                  className="group relative px-3 py-2 text-xs font-medium rounded-lg border transition-all duration-200 
                    hover:scale-105 hover:shadow-sm active:scale-95 flex items-center gap-2
                    bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 
                    hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>إعادة تعيين</span>
                  
                  {/* Enhanced Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                    إعادة تعيين جميع الفلاتر
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-100"></div>
                  </div>
                </button>
              </div>
            </div>
            
            {/* Expand/Collapse Controls */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                <Eye className="w-4 h-4 ml-2 text-blue-500" />
                عرض التفاصيل:
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const allOrderIds = orders.map(order => order.id || order.tracking_number);
                    setExpandedOrders(new Set(allOrderIds));
                    allOrderIds.forEach(orderId => {
                      if (!expandedOrderDetails[orderId]) {
                        loadOrderDetails(orderId);
                      }
                    });
                  }}
                  className="px-3 py-2 text-xs font-medium bg-brand-red-50 dark:bg-brand-red-900/20 text-brand-red-700 dark:text-brand-red-400 rounded-lg border border-brand-red-200 dark:border-brand-red-800 hover:bg-brand-red-100 dark:hover:bg-brand-red-900/30 transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  <ChevronDown className="w-3 h-3 ml-1 inline" />
                  فتح الكل
                </button>
                <button
                  onClick={() => {
                    setExpandedOrders(new Set());
                    setExpandedOrderDetails({});
                  }}
                  className="px-3 py-2 text-xs font-medium bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  <ChevronUp className="w-3 h-3 ml-1 inline" />
                  إغلاق الكل
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Panel - Compact Professional Design */}
        {showFilters && (
          <div className="w-full p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
            {/* Loading State - Compact */}
            {filterData.loading && (
              <div className="w-full flex items-center justify-center py-6">
                <div className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-lg px-4 py-3 shadow-sm border border-gray-200 dark:border-gray-700">
                  <Loader className="w-5 h-5 text-brand-red-500 animate-spin" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">جاري تحميل بيانات الفلاتر...</span>
                </div>
              </div>
            )}

            {!filterData.loading && (
              <>
                {/* Auto-Apply Toggle - Compact */}
                <div className="w-full flex items-center justify-between mb-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={filterState.autoApply}
                        onChange={(e) => setFilterState(prev => ({ ...prev, autoApply: e.target.checked }))}
                        className="w-4 h-4 text-brand-red-600 border-gray-300 rounded focus:ring-brand-red-500"
                      />
                      تطبيق تلقائي للفلاتر
                    </label>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      (يتم تطبيق الفلاتر تلقائياً عند التغيير)
                    </span>
                  </div>
                  {filterState.hasChanges && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-orange-600 dark:text-orange-400 animate-pulse">
                        تغييرات غير محفوظة
                      </span>
                    </div>
                  )}
                </div>

                {/* Primary Filters - Compact Grid */}
                <div className="w-full grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
                  {/* Order State Filter */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                      <AlertCircle className="w-4 h-4 ml-2 text-brand-red-500" />
                      حالة الطلب
                    </label>
                    <select
                      value={filters.state || ''}
                      onChange={(e) => handleFilterChange('state', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-red-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="">جميع الحالات</option>
                      {orderStates.map(state => (
                        <option key={state.state_code} value={state.state_code}>
                          {state.state_value} ({state.count})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date From Filter */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                      <Calendar className="w-4 h-4 ml-2 text-brand-red-500" />
                      من تاريخ
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        type="date"
                        value={filters.date_from || ''}
                        onChange={(e) => handleFilterChange('date_from', e.target.value)}
                        className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-brand-red-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                  </div>

                  {/* Date To Filter */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                      <Calendar className="w-4 h-4 ml-2 text-brand-red-500" />
                      إلى تاريخ
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        type="date"
                        value={filters.date_to || ''}
                        onChange={(e) => handleFilterChange('date_to', e.target.value)}
                        className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-brand-red-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                  </div>

                  {/* City Filter */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                      <MapPin className="w-4 h-4 ml-2 text-brand-red-500" />
                      المدينة
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <select
                        value={filters.city || ''}
                        onChange={(e) => handleFilterChange('city', e.target.value)}
                        className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-red-500 focus:border-transparent transition-all duration-200"
                      >
                        <option value="">جميع المدن</option>
                        {filterData.cities.map(city => (
                          <option key={city.value} value={city.value}>
                            {city.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Phone Filter */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                      <Users className="w-4 h-4 ml-2 text-blue-500" />
                      رقم الهاتف
                    </label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="رقم هاتف العميل"
                        value={advancedFilters.phone}
                        onChange={(e) => handleAdvancedFilterChange('phone', null, e.target.value)}
                        className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-brand-red-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Filters - Compact Layout */}
                <div className="w-full space-y-6">
                  {/* Business Categories */}
                  {filterData.businessCategories.length > 0 && (
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                        <DollarSign className="w-4 h-4 ml-2 text-green-500" />
                        الفئات التجارية
                        <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">({filterData.businessCategories.length})</span>
                      </label>
                      <div className="w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2">
                        {filterData.businessCategories.map(category => (
                          <label key={category.category} className="flex items-center group">
                            <input
                              type="checkbox"
                              checked={advancedFilters.businessCategories.includes(category.category)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  handleAdvancedFilterChange('businessCategories', null, [...advancedFilters.businessCategories, category.category]);
                                } else {
                                  handleAdvancedFilterChange('businessCategories', null, advancedFilters.businessCategories.filter(c => c !== category.category));
                                }
                              }}
                              className="sr-only"
                            />
                            <div className={`
                              w-full px-3 py-2 text-xs font-medium rounded-lg border cursor-pointer transition-all duration-200 group-hover:scale-105
                              ${advancedFilters.businessCategories.includes(category.category)
                                ? `${getCategoryColor(category.category)} border-current shadow-sm`
                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                              }
                            `}>
                              <div className="font-semibold">{category.category === 'premium_high' ? 'قيمة عالية جداً' :
                                 category.category === 'high_value' ? 'قيمة عالية' :
                                 category.category === 'standard_value' ? 'قيمة عادية' :
                                 category.category === 'low_value' ? 'قيمة منخفضة' :
                                 category.category === 'zero_cod' ? 'بدون دفع' :
                                 category.category === 'small_refund' ? 'استرداد صغير' :
                                 category.category === 'large_refund' ? 'استرداد كبير' : category.category}</div>
                              <div className="text-xs opacity-75 mt-1">{category.count} طلب</div>
                              <div className="text-xs opacity-75">{category.avg_cod?.toLocaleString('ar-EG') || 0} ج.م</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Order Types */}
                  {filterData.orderTypes.length > 0 && (
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                        <Package className="w-4 h-4 ml-2 text-blue-500" />
                        أنواع الطلبات
                        <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">({filterData.orderTypes.length})</span>
                      </label>
                      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        {filterData.orderTypes.map(type => (
                          <label key={type.type_code} className="flex items-center group">
                            <input
                              type="checkbox"
                              checked={advancedFilters.orderTypes.includes(type.type_code)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  handleAdvancedFilterChange('orderTypes', null, [...advancedFilters.orderTypes, type.type_code]);
                                } else {
                                  handleAdvancedFilterChange('orderTypes', null, advancedFilters.orderTypes.filter(t => t !== type.type_code));
                                }
                              }}
                              className="sr-only"
                            />
                            <div className={`
                              w-full px-4 py-3 text-sm font-medium rounded-lg border cursor-pointer transition-all duration-200 group-hover:scale-105
                              ${advancedFilters.orderTypes.includes(type.type_code)
                                ? `${getOrderTypeColor(type.type_code)} border-current shadow-sm`
                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                              }
                            `}>
                              <div className="font-semibold">{type.type_value}</div>
                              <div className="text-xs opacity-75 mt-1">{type.count} طلب</div>
                              <div className="text-xs opacity-75">{type.avg_cod?.toLocaleString('ar-EG') || 0} ج.م</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Risk Levels */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                      <AlertCircle className="w-4 h-4 ml-2 text-orange-500" />
                      مستويات المخاطر
                    </label>
                    <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-2">
                      {filterData.riskLevels.map(risk => (
                        <label key={risk.value} className="flex items-center group">
                          <input
                            type="checkbox"
                            checked={advancedFilters.riskLevels.includes(risk.value)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                handleAdvancedFilterChange('riskLevels', null, [...advancedFilters.riskLevels, risk.value]);
                              } else {
                                handleAdvancedFilterChange('riskLevels', null, advancedFilters.riskLevels.filter(r => r !== risk.value));
                              }
                            }}
                            className="sr-only"
                          />
                          <div className={`
                            w-full px-4 py-3 text-sm font-medium rounded-lg border cursor-pointer transition-all duration-200 group-hover:scale-105
                            ${advancedFilters.riskLevels.includes(risk.value)
                              ? `${risk.color} border-current shadow-sm`
                              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                            }
                          `}>
                            {risk.label}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* COD Range */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                      <DollarSign className="w-4 h-4 ml-2 text-green-500" />
                      نطاق المبلغ (ج.م)
                    </label>
                    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          type="number"
                          placeholder="الحد الأدنى"
                          value={advancedFilters.codRange.min}
                          onChange={(e) => handleAdvancedFilterChange('codRange', null, { min: e.target.value })}
                          className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-brand-red-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          type="number"
                          placeholder="الحد الأقصى"
                          value={advancedFilters.codRange.max}
                          onChange={(e) => handleAdvancedFilterChange('codRange', null, { max: e.target.value })}
                          className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-brand-red-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Filter Actions - Compact Professional */}
                <div className="w-full flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-4">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      <span className="text-brand-red-600 dark:text-brand-red-400 font-semibold">{pagination.total.toLocaleString()}</span> نتيجة
                    </div>
                    {(Object.keys(filters).length > 0 || 
                      advancedFilters.businessCategories.length > 0 ||
                      advancedFilters.orderTypes.length > 0 ||
                      advancedFilters.riskLevels.length > 0 ||
                      advancedFilters.codRange.min || advancedFilters.codRange.max ||
                      advancedFilters.phone) && (
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">فلاتر نشطة:</span>
                        <div className="flex flex-wrap gap-1">
                          {Object.keys(filters).map(key => filters[key] && (
                            <span key={key} className="px-2 py-1 text-xs font-medium bg-brand-red-100 text-brand-red-700 dark:bg-brand-red-900/20 dark:text-brand-red-400 rounded-md">
                              {key}: {filters[key]}
                            </span>
                          ))}
                          {advancedFilters.businessCategories.length > 0 && (
                            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 rounded-md">
                              فئات: {advancedFilters.businessCategories.length}
                            </span>
                          )}
                          {advancedFilters.orderTypes.length > 0 && (
                            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 rounded-md">
                              أنواع: {advancedFilters.orderTypes.length}
                            </span>
                          )}
                          {advancedFilters.riskLevels.length > 0 && (
                            <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 rounded-md">
                              مخاطر: {advancedFilters.riskLevels.length}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="outline" 
                      onClick={clearFilters} 
                      size="sm"
                      className="px-4 py-2 text-sm font-medium border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-all duration-200 rounded-lg"
                    >
                      مسح الفلاتر
                    </Button>
                    <Button 
                      onClick={applyFilters} 
                      disabled={filterState.isApplying}
                      size="sm"
                      className="px-6 py-2 text-sm font-medium bg-brand-red-600 hover:bg-brand-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 rounded-lg"
                    >
                      {filterState.isApplying ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin ml-2" />
                          جاري التطبيق...
                        </>
                      ) : (
                        'تطبيق'
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Orders Display */}
      {viewMode === 'table' ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          {/* Table Header with Expand Status */}
          {expandedOrders.size > 0 && (
            <div className="px-4 py-2 bg-gradient-to-r from-brand-red-50 to-brand-red-100 dark:from-brand-red-900/20 dark:to-brand-red-900/10 border-b border-brand-red-200 dark:border-brand-red-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-brand-red-600 dark:text-brand-red-400" />
                  <span className="text-sm font-medium text-brand-red-700 dark:text-brand-red-300">
                    {expandedOrders.size} طلب مفتوح للعرض التفصيلي
                  </span>
                </div>
                <button
                  onClick={() => {
                    setExpandedOrders(new Set());
                    setExpandedOrderDetails({});
                  }}
                  className="text-xs text-brand-red-600 dark:text-brand-red-400 hover:text-brand-red-800 dark:hover:text-brand-red-200 transition-colors"
                >
                  إغلاق الكل
                </button>
              </div>
            </div>
          )}
          
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    رقم التتبع
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    العميل
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    الحالة
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    الفئة التجارية
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    المالية
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    التاريخ
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    المدينة
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {orders.map((order) => {
                  const orderId = order.id || order.tracking_number;
                  return (
                    <OrderRow 
                      key={orderId} 
                      order={order} 
                      toggleOrderExpansion={toggleOrderExpansion} 
                      isExpanded={expandedOrders.has(orderId)} 
                      orderDetails={expandedOrderDetails[orderId]} 
                      isLoadingDetails={loadingExpandedDetails.has(orderId)} 
                      formatTimelineData={formatTimelineData} 
                    />
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.total > 0 && (
            <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  عرض {((pagination.currentPage - 1) * pagination.limit) + 1} إلى {Math.min(pagination.currentPage * pagination.limit, pagination.total)} من {pagination.total.toLocaleString()} نتيجة
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    السابق
                  </Button>
                  <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
                    صفحة {pagination.currentPage}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasMore}
                    className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    التالي
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Cards View - Theme-Integrated Creative Design
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {orders.map((order, index) => (
            <OrderCard 
              key={order.id || order.tracking_number} 
              order={order} 
              index={index} 
              toggleNoteExpansion={toggleNoteExpansion} 
              expandedNotes={expandedNotes} 
            />
          ))}
          
          {/* Enhanced Loader for Infinite Scroll */}
          {pagination.hasMore && (
            <div 
              ref={loaderRef} 
              id="infinite-scroll-loader"
              className="col-span-full flex justify-center py-6"
            >
              {loadingMore && (
                <div className="flex items-center justify-center gap-3 bg-white dark:bg-gray-900 rounded-xl px-4 py-3 border border-gray-100 dark:border-gray-800 shadow-sm">
                  <Loader className="w-4 h-4 text-brand-red-500 animate-spin" />
                  <span className="text-gray-600 dark:text-gray-400 text-sm font-medium">جاري تحميل المزيد...</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Enhanced Empty State */}
      {!loading && orders.length === 0 && (
        <EmptyState
          icon={Search}
          title="لا توجد طلبات"
          description="لم يتم العثور على طلبات تطابق معايير البحث المحددة"
          variant="search"
        />
      )}
    </div>
  );
};

export default OrdersPage; 