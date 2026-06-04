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
  TrendingDown,
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
  Wrench,
  Settings, 
  BarChart3, 
  ShoppingCart, 
  ArrowUpDown, 
  RefreshCw, 
  Bell, 
  Activity, 
  X, 
  Play,
  Pause,
  StopCircle,
  Building,
  AlertOctagon,
  Timer,
  Award,
  LogOut,
  Sun,
  Moon,
  BarChart,
  Activity as ActivityIcon,
  Grid3X3,
  List,
  FilterX
} from 'lucide-react';
import { Card, Button, Input, Badge, StatusBadge, EmptyState } from '../../components/ui';
import { Spinner } from '../../components/ui/DesignSystem';
import { api } from '../../services/api';
import { ServiceActionCard, ServiceActionRow, ServiceActionExpandDetails } from './components';
import { formatDate, getStatusColor, getPriorityColor, getActionTypeLabel } from './utils';

/**
 * Service Actions Page - Modern Redesign with Enhanced UI/UX
 * Following HVAR Complete Cycle System specifications with Orders Page Design Patterns
 */
const ServiceActionsPage = () => {
  // State management
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [serviceActions, setServiceActions] = useState([]);
  const [totalActions, setTotalActions] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('table');
  const [filters, setFilters] = useState({});
  const [selectedState, setSelectedState] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDir, setSortDir] = useState('DESC');
  const [expandedNotes, setExpandedNotes] = useState({});
  const [expandedActions, setExpandedActions] = useState(new Set());
  const [expandedActionDetails, setExpandedActionDetails] = useState({});
  const [loadingExpandedDetails, setLoadingExpandedDetails] = useState(new Set());
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [selectedActions, setSelectedActions] = useState([]);
  
  const itemsPerPage = 20;
  const searchTimeout = useRef(null);
  const loaderRef = useRef(null);

  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    limit: 20,
    offset: 0,
    total: 0,
    hasMore: true
  });

  // Dynamic filter data from API
  const [filterData, setFilterData] = useState({
    actionTypes: [],
    actionStatuses: [],
    priorities: [],
    technicians: [],
    cities: [],
    loading: false
  });

  // Enhanced filter state for better organization
  const [advancedFilters, setAdvancedFilters] = useState({
    actionTypes: [],
    actionStatuses: [],
    priorities: [],
    technicians: [],
    phone: '',
    dateRange: { from: '', to: '' }
  });

  // Filter state management
  const [filterState, setFilterState] = useState({
    autoApply: false,
    hasChanges: false,
    lastApplied: null
  });

  // Debounced search term
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  
  // Priority levels for filtering
  const priorityLevels = [
    { value: '', label: 'جميع الأولويات', color: 'gray' },
    { value: 'low', label: 'منخفضة', color: 'green' },
    { value: 'medium', label: 'متوسطة', color: 'blue' },
    { value: 'high', label: 'عالية', color: 'amber' },
    { value: 'urgent', label: 'عاجلة', color: 'red' }
  ];
  
  // Action status options
  const actionStatuses = [
    { value: '', label: 'جميع الحالات', color: 'gray' },
    { value: 'requested', label: 'مطلوب', color: 'blue' },
    { value: 'in_progress', label: 'قيد التنفيذ', color: 'amber' },
    { value: 'hub_confirmed', label: 'مؤكد من المحور', color: 'green' },
    { value: 'awaiting_review', label: 'في انتظار المراجعة', color: 'purple' },
    { value: 'completed', label: 'مكتمل', color: 'green' },
    { value: 'cancelled', label: 'ملغي', color: 'red' }
  ];
  
  // Action types
  const actionTypes = [
    { value: '', label: 'جميع الأنواع', color: 'gray' },
    { value: 'maintenance', label: 'صيانة', color: 'blue' },
    { value: 'service', label: 'خدمة', color: 'green' },
    { value: 'return_refund', label: 'إرجاع/استرداد', color: 'red' },
    { value: 'exchange', label: 'تبديل', color: 'purple' },
    { value: 'premium_service', label: 'خدمة متميزة', color: 'amber' },
    { value: 'delivery_support', label: 'دعم التوصيل', color: 'cyan' }
  ];

  // Quick filters
  const quickFilters = [
    { name: 'قيد التنفيذ', filter: { action_status: 'in_progress' }, color: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800' },
    { name: 'مكتمل', filter: { action_status: 'completed' }, color: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' },
    { name: 'عاجل', filter: { priority: 'urgent' }, color: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800' },
    { name: 'صيانة', filter: { action_type: 'maintenance' }, color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800' },
    { name: 'خدمة', filter: { action_type: 'service' }, color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800' }
  ];

  // Fetch service actions
  const fetchServiceActions = useCallback(async (params = {}, shouldReset = true) => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = {
        page: shouldReset ? 1 : params.page || pagination.currentPage,
        limit: itemsPerPage,
        ...params
      };
      
      // Add filters to query params
      Object.entries(filters).forEach(([key, value]) => {
        if (value && key !== 'searchTerm') {
          queryParams[key] = value;
        }
      });
      
      // Add search term if provided
      if (searchTerm) {
        queryParams.search = searchTerm;
      }
      
      const response = await api.unifiedCustomerService.getServiceActions(queryParams);
      
      if (response.success) {
        const actions = response.data || [];
        setServiceActions(shouldReset ? actions : [...serviceActions, ...actions]);
        setTotalActions(response.total_count || actions.length);
        setLastUpdate(new Date());

        // Update pagination
        setPagination(prev => ({
          ...prev,
          total: response.total_count || actions.length,
          hasMore: actions.length === itemsPerPage
        }));
        
        if (shouldReset) {
          setPagination(prev => ({ ...prev, currentPage: 1, offset: 0 }));
          setExpandedActions(new Set());
          setExpandedActionDetails({});
        }
      } else {
        setError(response.error || 'فشل في جلب إجراءات الخدمة');
      }
    } catch (err) {
      console.error('Error fetching service actions:', err);
      setError('حدث خطأ غير متوقع أثناء جلب البيانات');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters, searchTerm, pagination.currentPage, serviceActions]);

  // Load more actions
  const loadMoreActions = () => {
    if (!loadingMore && pagination.hasMore) {
      setLoadingMore(true);
      fetchServiceActions({ page: pagination.currentPage + 1 }, false);
      setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }));
    }
  };

  // Fetch action details
  const fetchActionDetails = async (actionId) => {
    try {
      setLoadingExpandedDetails(prev => new Set([...prev, actionId]));
      const response = await api.unifiedCustomerService.getServiceAction(actionId);
      if (response.success) {
        setExpandedActionDetails(prev => ({
          ...prev,
          [actionId]: response.data
        }));
      }
    } catch (err) {
      console.error('Error fetching action details:', err);
    } finally {
      setLoadingExpandedDetails(prev => {
        const newSet = new Set(prev);
        newSet.delete(actionId);
        return newSet;
      });
    }
  };

  // Fetch filter data
  const fetchFilterData = async () => {
    try {
      // Remove the call to non-existent function
      // const filterData = await api.unifiedCustomerService.getServiceActionFilters();
      // setFilterOptions(filterData);
      
      // For now, we'll use static filter options
      setFilterData({
        actionTypes: [
          { value: '', label: 'جميع الأنواع' },
          { value: 'maintenance', label: 'صيانة' },
          { value: 'service', label: 'خدمة' },
          { value: 'return_refund', label: 'إرجاع/استرداد' },
          { value: 'exchange', label: 'تبديل' },
          { value: 'premium_service', label: 'خدمة متميزة' },
          { value: 'delivery_support', label: 'دعم التوصيل' }
        ],
        actionStatuses: [
          { value: '', label: 'جميع الحالات' },
          { value: 'requested', label: 'مطلوب' },
          { value: 'in_progress', label: 'قيد التنفيذ' },
          { value: 'hub_confirmed', label: 'مؤكد استلامه' },
          { value: 'awaiting_review', label: 'في انتظار المراجعة' },
          { value: 'completed', label: 'مكتمل' },
          { value: 'cancelled', label: 'ملغي' }
        ],
        priorities: [
          { value: '', label: 'جميع الأولويات' },
          { value: 'low', label: 'منخفضة' },
          { value: 'medium', label: 'متوسطة' },
          { value: 'high', label: 'عالية' },
          { value: 'urgent', label: 'عاجلة' }
        ],
        technicians: [], // Placeholder, will be fetched later
        cities: [] // Placeholder, will be fetched later
      });
    } catch (error) {
      console.error('Error fetching filter data:', error);
      // Set default filter options on error
      setFilterData({
        actionTypes: [
          { value: '', label: 'جميع الأنواع' },
          { value: 'maintenance', label: 'صيانة' },
          { value: 'service', label: 'خدمة' },
          { value: 'return_refund', label: 'إرجاع/استرداد' },
          { value: 'exchange', label: 'تبديل' },
          { value: 'premium_service', label: 'خدمة متميزة' },
          { value: 'delivery_support', label: 'دعم التوصيل' }
        ],
        actionStatuses: [
          { value: '', label: 'جميع الحالات' },
          { value: 'requested', label: 'مطلوب' },
          { value: 'in_progress', label: 'قيد التنفيذ' },
          { value: 'hub_confirmed', label: 'مؤكد استلامه' },
          { value: 'awaiting_review', label: 'في انتظار المراجعة' },
          { value: 'completed', label: 'مكتمل' },
          { value: 'cancelled', label: 'ملغي' }
        ],
        priorities: [
          { value: '', label: 'جميع الأولويات' },
          { value: 'low', label: 'منخفضة' },
          { value: 'medium', label: 'متوسطة' },
          { value: 'high', label: 'عالية' },
          { value: 'urgent', label: 'عاجلة' }
        ],
        technicians: [], // Placeholder, will be fetched later
        cities: [] // Placeholder, will be fetched later
      });
    }
  };

  // Initial data load
  useEffect(() => {
    fetchServiceActions();
    fetchFilterData();
  }, []);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));

    if (filterState.autoApply) {
      setFilterState(prev => ({ ...prev, hasChanges: true }));
      fetchServiceActions();
    } else {
      setFilterState(prev => ({ ...prev, hasChanges: true }));
    }
  };

  // Handle advanced filter changes
  const handleAdvancedFilterChange = (category, key, value) => {
    setAdvancedFilters(prev => ({
      ...prev,
      [category]: key ? { ...prev[category], [key]: value } : value
    }));

    if (filterState.autoApply) {
      setFilterState(prev => ({ ...prev, hasChanges: true }));
      fetchServiceActions();
    } else {
      setFilterState(prev => ({ ...prev, hasChanges: true }));
    }
  };

  // Apply filters
  const applyFilters = async () => {
    setFilterState(prev => ({ ...prev, hasChanges: false, lastApplied: Date.now() }));
    await fetchServiceActions();
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({});
    setAdvancedFilters({
      actionTypes: [],
      actionStatuses: [],
      priorities: [],
      technicians: [],
      phone: '',
      dateRange: { from: '', to: '' }
    });
    setFilterState(prev => ({ ...prev, hasChanges: false }));
    fetchServiceActions();
  };

  // Apply quick filter
  const applyQuickFilter = (quickFilter) => {
    setFilters(quickFilter.filter);
    setFilterState(prev => ({ ...prev, hasChanges: false }));
    fetchServiceActions();
  };

  // Handle search
  const handleSearch = (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    if (!searchTerm.trim() && !debouncedSearchTerm.trim()) return;

    const searchValue = searchTerm.trim() || debouncedSearchTerm.trim();
    fetchServiceActions({ search: searchValue, offset: 0 });
  };

  // Toggle action expansion
  const toggleActionExpansion = async (actionId) => {
    const newExpanded = new Set(expandedActions);
    if (newExpanded.has(actionId)) {
      newExpanded.delete(actionId);
    } else {
      newExpanded.add(actionId);
      // Fetch details if not already loaded
      if (!expandedActionDetails[actionId]) {
        await fetchActionDetails(actionId);
      }
    }
    setExpandedActions(newExpanded);
  };

  // Toggle note expansion
  const toggleNoteExpansion = (actionId) => {
    setExpandedNotes(prev => ({
      ...prev,
      [actionId]: !prev[actionId]
    }));
  };

  // Handle status update
  const handleStatusUpdate = async (actionId, newStatus, additionalData = {}) => {
    try {
      const response = await api.unifiedCustomerService.updateServiceActionStatus(actionId, {
        new_status: newStatus,
        ...additionalData
      });
      
      if (response.success) {
        // Update local state
        setServiceActions(prev => prev.map(action => 
          action.action_id === actionId 
            ? { ...action, action_status: newStatus }
            : action
        ));
        
        // Show success message
        // You can add a toast notification here
      } else {
        setError(response.error || 'فشل في تحديث الحالة');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      setError('حدث خطأ أثناء تحديث الحالة');
    }
  };

  // Handle bulk actions
  const handleBulkAction = async (action, additionalData = {}) => {
    try {
      const promises = selectedActions.map(actionId => 
        handleStatusUpdate(actionId, action, additionalData)
      );
      
      await Promise.all(promises);
      setSelectedActions([]);
    } catch (err) {
      console.error('Error in bulk action:', err);
    }
  };

  // Format last update time
  const formatLastUpdate = (date) => {
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Loading state
  if (loading && serviceActions.length === 0) {
  return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">جاري تحميل إجراءات الخدمة...</p>
                </div>
                </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Enhanced Search & Filters - Expert Professional Design */}
      <div className="w-full bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg overflow-hidden backdrop-blur-sm">
        {/* Enhanced Search Bar - Expert Professional Design */}
        <div className="w-full p-6 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50">
          <form onSubmit={handleSearch} className="w-full flex items-center gap-4">
            {/* Enhanced View Toggle - Expert Design */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl p-1 border border-gray-200 dark:border-gray-700 shadow-inner">
                <button
                type="button"
                  onClick={() => setViewMode('cards')}
                className={`
                  p-2.5 rounded-lg transition-all duration-200 flex items-center justify-center
                  ${viewMode === 'cards'
                    ? 'bg-white dark:bg-gray-700 text-brand-red-600 dark:text-brand-red-400 shadow-md border border-gray-200 dark:border-gray-600'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }
                `}
                title="عرض البطاقات"
              >
                <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                type="button"
                  onClick={() => setViewMode('table')}
                className={`
                  p-2.5 rounded-lg transition-all duration-200 flex items-center justify-center
                  ${viewMode === 'table'
                    ? 'bg-white dark:bg-gray-700 text-brand-red-600 dark:text-brand-red-400 shadow-md border border-gray-200 dark:border-gray-600'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }
                `}
                title="عرض الجدول"
              >
                <List className="w-4 h-4" />
                </button>
              </div>

            {/* Enhanced Search Input - Expert Professional */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-gray-400" />
            </div>
                  <Input
                placeholder="البحث في إجراءات الخدمة (رقم التتبع، الهاتف، اسم العميل...)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-12 py-3 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-brand-red-500 focus:border-transparent transition-all duration-200 rounded-xl shadow-sm"
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

            {/* Enhanced Search Button - Expert */}
                <Button
              type="submit"
              disabled={!searchTerm.trim()}
              className="px-6 py-3 text-sm font-medium bg-gradient-to-r from-brand-red-600 to-brand-red-700 hover:from-brand-red-700 hover:to-brand-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 rounded-xl shadow-md"
            >
              بحث
                </Button>

            {/* Enhanced Filters Button - Expert with Indicator */}
                <Button
              type="button"
                  variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={`
                px-6 py-3 text-sm font-medium border border-gray-200 dark:border-gray-700 transition-all duration-200 rounded-xl relative shadow-sm
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

        {/* Enhanced Quick Filters - Expert Container */}
        <div className="w-full p-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 border-b border-gray-100 dark:border-gray-800">
          <div className="w-full flex items-center justify-between flex-wrap gap-4">
            {/* Quick Filters Section */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                <Zap className="w-4 h-4 ml-2 text-brand-red-500" />
                فلاتر سريعة:
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                {quickFilters.map((quickFilter, index) => (
                  <button
                    key={index}
                    onClick={() => applyQuickFilter(quickFilter)}
                    className={`
                      px-3 py-2 text-xs font-medium rounded-lg border transition-all duration-200 
                      hover:scale-105 hover:shadow-sm active:scale-95
                      ${quickFilter.color}
                    `}
                  >
                    {quickFilter.name}
                  </button>
                ))}
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
                    const allActionIds = serviceActions.map(action => action.action_id);
                    setExpandedActions(new Set(allActionIds));
                    allActionIds.forEach(actionId => {
                      if (!expandedActionDetails[actionId]) {
                        fetchActionDetails(actionId);
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
                    setExpandedActions(new Set());
                    setExpandedActionDetails({});
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

        {/* Enhanced Filters Panel - Expert Professional Design */}
            {showFilters && (
          <div className="w-full p-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 border-t border-gray-100 dark:border-gray-700">
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
                  {/* Action Status Filter */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                      <AlertCircle className="w-4 h-4 ml-2 text-brand-red-500" />
                        حالة الإجراء
                      </label>
                      <select
                      value={filters.action_status || ''}
                        onChange={(e) => handleFilterChange('action_status', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-red-500 focus:border-transparent transition-all duration-200"
                      >
                      <option value="">جميع الحالات</option>
                        {actionStatuses.map(status => (
                          <option key={status.value} value={status.value}>
                            {status.label}
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

                {/* Advanced Filters - Compact Grid */}
                <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Action Type Filter */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                      <Package className="w-4 h-4 ml-2 text-green-500" />
                        نوع الإجراء
                      </label>
                      <select
                      value={filters.action_type || ''}
                        onChange={(e) => handleFilterChange('action_type', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-red-500 focus:border-transparent transition-all duration-200"
                      >
                      <option value="">جميع الأنواع</option>
                        {actionTypes.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Priority Filter */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                      <AlertOctagon className="w-4 h-4 ml-2 text-amber-500" />
                        مستوى الأولوية
                      </label>
                      <select
                      value={filters.priority || ''}
                        onChange={(e) => handleFilterChange('priority', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-red-500 focus:border-transparent transition-all duration-200"
                      >
                      <option value="">جميع الأولويات</option>
                        {priorityLevels.map(priority => (
                          <option key={priority.value} value={priority.value}>
                            {priority.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Technician Filter */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                      <Users className="w-4 h-4 ml-2 text-blue-500" />
                        الفني المكلف
                      </label>
                      <Input
                        type="text"
                        placeholder="اسم الفني..."
                        value={filters.assigned_technician}
                        onChange={(e) => handleFilterChange('assigned_technician', e.target.value)}
                        className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 py-3 text-lg rounded-xl"
                      />
                    </div>

                    {/* Customer Phone */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                      <Phone className="w-4 h-4 ml-2 text-blue-500" />
                        رقم العميل
                      </label>
                      <Input
                        type="text"
                        placeholder="رقم الهاتف..."
                        value={filters.customer_phone}
                        onChange={(e) => handleFilterChange('customer_phone', e.target.value)}
                        className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 py-3 text-lg rounded-xl"
                      />
                    </div>

                    {/* Tracking Number */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                      <Clock className="w-4 h-4 ml-2 text-blue-500" />
                        رقم التتبع
                      </label>
                      <Input
                        type="text"
                        placeholder="رقم التتبع..."
                        value={filters.tracking_number}
                        onChange={(e) => handleFilterChange('tracking_number', e.target.value)}
                        className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 py-3 text-lg rounded-xl"
                      />
                    </div>

                  {/* Date Range Filter */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                      <Calendar className="w-4 h-4 ml-2 text-brand-red-500" />
                      الفترة
                      </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        type="date"
                          value={advancedFilters.dateRange.from || ''}
                          onChange={(e) => handleAdvancedFilterChange('dateRange', 'from', e.target.value)}
                          className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-brand-red-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                      <span className="text-gray-500 dark:text-gray-400">إلى</span>
                      <div className="relative flex-1">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        type="date"
                          value={advancedFilters.dateRange.to || ''}
                          onChange={(e) => handleAdvancedFilterChange('dateRange', 'to', e.target.value)}
                          className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-brand-red-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                  </div>
        </div>
      </div>

                {/* Apply/Clear Filters - Compact Professional */}
                <div className="w-full flex justify-end gap-3 mt-6">
                <Button 
                  variant="outline" 
                  size="lg" 
                    onClick={clearFilters}
                  className="text-brand-red-700 border-brand-red-300 hover:bg-brand-red-100 dark:hover:bg-brand-red-900/20 px-6"
                >
                    <RotateCcw className="w-5 h-5 ml-2" />
                    مسح الفلاتر
                </Button>
                <Button 
                    variant="default"
                  size="lg" 
                    onClick={applyFilters}
                    className="bg-brand-red-600 hover:bg-brand-red-700 px-8"
                >
                  <CheckCircle className="w-5 h-5 ml-2" />
                    تطبيق الفلاتر
                </Button>
              </div>
              </>
            )}
          </div>
        )}
            </div>

      {/* Enhanced Main Content */}
      {viewMode === 'table' ? (
        // Enhanced Table View - Expert Professional Design with Full Responsive Layout
        <div className="w-full bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg backdrop-blur-sm">
          {/* Responsive Table Container - Fully Dynamic */}
          <div className="w-full overflow-hidden">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50">
                <tr>
                  {/* Selection - Flexible */}
                  <th className="px-3 py-5 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedActions(serviceActions.map(a => a.action_id));
                      } else {
                            setSelectedActions([]);
                      }
                    }}
                        checked={selectedActions.length === serviceActions.length && serviceActions.length > 0}
                        className="w-4 h-4 text-brand-red-600 border-gray-300 dark:border-gray-600 rounded focus:ring-brand-red-500 dark:focus:ring-brand-red-400 bg-white dark:bg-gray-800 checked:bg-brand-red-600 dark:checked:bg-brand-red-500 checked:border-brand-red-600 dark:checked:border-brand-red-500"
                  />
                  </th>

                  {/* Action ID - Flexible */}
                  <th className="px-3 py-5 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                    <span>إجراء</span>
                  </th>

                  {/* Customer Information - Flexible */}
                  <th className="px-3 py-5 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                          العميل
                        </th>

                  {/* Status - Flexible */}
                  <th className="px-3 py-5 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                          الحالة
                        </th>

                  {/* Action Type - Flexible */}
                  <th className="px-3 py-5 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                          النوع
                        </th>

                  {/* Priority - Flexible */}
                  <th className="px-3 py-5 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                          الأولوية
                        </th>

                  {/* Date - Flexible */}
                  <th className="px-3 py-5 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                          التاريخ
                        </th>

                  {/* Location - Flexible */}
                  <th className="px-3 py-5 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                          المدينة
                        </th>

                  {/* Actions - Flexible */}
                  <th className="px-3 py-5 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                          الإجراءات
                        </th>
                      </tr>
                    </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {serviceActions.map((action) => {
                  const actionId = action.action_id;
                  return (
                        <ServiceActionRow
                      key={actionId}
                          action={action}
                      toggleActionExpansion={toggleActionExpansion}
                      isExpanded={expandedActions.has(actionId)}
                      actionDetails={expandedActionDetails[actionId]}
                      isLoadingDetails={loadingExpandedDetails.has(actionId)}
                          onStatusUpdate={handleStatusUpdate}
                          onSelect={(selected) => {
                            if (selected) {
                          setSelectedActions(prev => [...prev, actionId]);
                            } else {
                          setSelectedActions(prev => prev.filter(id => id !== actionId));
                            }
                          }}
                      isSelected={selectedActions.includes(actionId)}
                        />
                  );
                })}
                    </tbody>
                  </table>
                </div>
              </div>
      ) : (
        // Enhanced Cards View - Expert Theme-Integrated Creative Design
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {serviceActions.map((action, index) => (
            <ServiceActionCard
              key={action.action_id}
              action={action}
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

      {/* Enhanced Pagination with Better Responsive Design */}
      {viewMode === 'table' && pagination.total > 0 && (
        <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Results Info - Responsive */}
            <div className="text-sm text-gray-700 dark:text-gray-300 text-center sm:text-right">
              عرض {((pagination.currentPage - 1) * pagination.limit) + 1} إلى {Math.min(pagination.currentPage * pagination.limit, pagination.total)} من {pagination.total.toLocaleString()} نتيجة
            </div>

            {/* Pagination Controls - Responsive */}
            <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                size="sm"
                onClick={() => {
                  if (pagination.currentPage > 1) {
                    setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }));
                    fetchServiceActions({ page: pagination.currentPage - 1 });
                  }
                }}
                disabled={pagination.currentPage === 1}
                className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs"
              >
                السابق
              </Button>

              {/* Page Numbers - Compact */}
              <div className="flex items-center gap-1">
                {pagination.currentPage > 2 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPagination(prev => ({ ...prev, currentPage: 1 }));
                      fetchServiceActions({ page: 1 });
                    }}
                    className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs px-2"
                  >
                    1
                  </Button>
                )}

                {pagination.hasMore && pagination.currentPage > 3 && (
                  <span className="text-gray-400 dark:text-gray-500 text-xs">...</span>
                )}

                {pagination.currentPage > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }));
                      fetchServiceActions({ page: pagination.currentPage - 1 });
                    }}
                    className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs px-2"
                  >
                    {pagination.currentPage - 1}
                </Button>
                )}

                <Button
                  variant="default"
                  size="sm"
                  className="bg-brand-red-600 hover:bg-brand-red-700 text-white text-xs px-2"
                >
                  {pagination.currentPage}
                </Button>

                {pagination.hasMore && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }));
                      fetchServiceActions({ page: pagination.currentPage + 1 });
                    }}
                    className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs px-2"
                  >
                    {pagination.currentPage + 1}
                  </Button>
                )}

                {pagination.hasMore && pagination.currentPage < Math.ceil(pagination.total / pagination.limit) - 1 && (
                  <span className="text-gray-400 dark:text-gray-500 text-xs">...</span>
                )}

                {pagination.hasMore && pagination.currentPage < Math.ceil(pagination.total / pagination.limit) - 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const lastPage = Math.ceil(pagination.total / pagination.limit);
                      setPagination(prev => ({ ...prev, currentPage: lastPage }));
                      fetchServiceActions({ page: lastPage });
                    }}
                    className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs px-2"
                  >
                    {Math.ceil(pagination.total / pagination.limit)}
                  </Button>
        )}
      </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (pagination.hasMore) {
                    setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }));
                    fetchServiceActions({ page: pagination.currentPage + 1 });
                  }
                }}
                disabled={!pagination.hasMore}
                className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs"
              >
                التالي
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Empty State - Modern Design */}
      {!loading && serviceActions.length === 0 && (
        <EmptyState
          icon={Wrench}
          title="لا توجد إجراءات خدمة"
          description="لم يتم العثور على إجراءات خدمة تطابق معايير البحث المحددة"
          variant="search"
        />
      )}
    </div>
  );
};

export default ServiceActionsPage; 