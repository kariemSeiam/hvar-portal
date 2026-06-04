import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Wrench, 
  Clock, 
  BarChart2,
  Bell,
  Calendar,
  Search,
  Filter,
  Plus,
  Eye,
  AlertCircle,
  CheckCircle,
  RotateCcw,
  XCircle,
  TrendingUp,
  TrendingDown,
  Loader,
  Zap,
  Shield,
  Star,
  Info,
  ExternalLink,
  Circle,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  MapPin,
  DollarSign,
  Package,
  ArrowRight,

  Settings,
  Users,
 
  RefreshCw,

} from 'lucide-react';
import { Card, Button, StatusBadge, Input } from '../../components/ui';
import { api } from '../../services/api';

/**
 * Maintenance Management Page - Refactored to use real API endpoints
 * Following the same themes, styles, and creativity as OrdersPage.jsx
 */
const MaintenancePage = () => {
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('dashboard');
  const [filters, setFilters] = useState({});
  const [selectedStatus, setSelectedStatus] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDir, setSortDir] = useState('DESC');
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [expandedDetails, setExpandedDetails] = useState({});
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
    cycleTypes: [],
    priorities: [],
    technicians: [],
    statuses: [],
    loading: false
  });

  // Enhanced filter state for better organization
  const [advancedFilters, setAdvancedFilters] = useState({
    cycleTypes: [],
    priorities: [],
    technicians: [],
    statuses: [],
    dateRange: { from: '', to: '' },
    customerPhone: '',
    assignedTechnician: ''
  });

  // UI/UX State
  const [filterState, setFilterState] = useState({
    isApplying: false,
    hasChanges: false,
    autoApply: true,
    showQuickActions: false
  });

  // Debounced search term
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Main data state
  const [data, setData] = useState({
    cycles: [],
    technicians: [],
    stockAlerts: [],
    slaViolations: [],
    analytics: {},
    stats: {
      activeCycles: 0,
      totalCycles: 0,
      completedToday: 0,
      slaViolations: 0,
      stockAlerts: 0,
      technicianWorkload: 0
    }
  });

  // Fetch maintenance cycles from API
  const fetchMaintenanceCycles = async (params = {}, shouldReset = true) => {
    try {
      if (shouldReset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      const queryParams = {
        limit: pagination.limit,
        offset: shouldReset ? 0 : pagination.offset + pagination.limit,
        sort_by: sortBy,
        sort_dir: sortDir,
        ...filters,
        ...params
      };

      const response = await api.maintenance.getCycles(queryParams);
      
      if (response.success) {
        if (shouldReset) {
          setData(prev => ({ ...prev, cycles: response.data }));
        } else {
          const existingIds = new Set(data.cycles.map(cycle => cycle.cycle_id));
          const newCycles = response.data.filter(cycle => !existingIds.has(cycle.cycle_id));
          setData(prev => ({ ...prev, cycles: [...prev.cycles, ...newCycles] }));
        }
        
        setPagination(prev => ({
          ...prev,
          offset: shouldReset ? 0 : prev.offset + prev.limit,
          total: response.pagination?.total || 0,
          currentPage: response.pagination?.current_page || 1,
          hasMore: response.pagination?.has_more || false
        }));
      }
    } catch (error) {
      console.error('Error fetching maintenance cycles:', error);
    } finally {
      if (shouldReset) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  };

  // Fetch technicians workload from API
  const fetchTechniciansWorkload = async (params = {}) => {
    try {
      const response = await api.maintenance.getTechniciansWorkload(params);
      if (response.success) {
        setData(prev => ({ ...prev, technicians: response.data }));
      }
    } catch (error) {
      console.error('Error fetching technicians workload:', error);
    }
  };

  // Fetch stock alerts from API
  const fetchStockAlerts = async (params = {}) => {
    try {
      const response = await api.maintenance.getStockAlerts(params);
      if (response.success) {
        setData(prev => ({ ...prev, stockAlerts: response.data }));
      }
    } catch (error) {
      console.error('Error fetching stock alerts:', error);
    }
  };

  // Fetch SLA violations from API
  const fetchSLAViolations = async (params = {}) => {
    try {
      const response = await api.maintenance.checkSLAViolations(params);
      if (response.success) {
        setData(prev => ({ ...prev, slaViolations: response.data }));
      }
    } catch (error) {
      console.error('Error fetching SLA violations:', error);
    }
  };

  // Fetch maintenance analytics from API
  const fetchMaintenanceAnalytics = async (params = {}) => {
    try {
      const response = await api.maintenance.getAnalytics(params);
      if (response.success) {
        setData(prev => ({ ...prev, analytics: response.data }));
      }
    } catch (error) {
      console.error('Error fetching maintenance analytics:', error);
    }
  };

  // Fetch dynamic filter data from API
  const fetchFilterData = async () => {
    try {
      setFilterData(prev => ({ ...prev, loading: true }));
      
      // Fetch cycle types, priorities, technicians, and statuses from analytics
      try {
        const analyticsResponse = await api.maintenance.getAnalytics();
        if (analyticsResponse.success) {
          setFilterData(prev => ({
            ...prev,
            cycleTypes: analyticsResponse.data.cycle_types || [],
            priorities: analyticsResponse.data.priorities || [],
            technicians: analyticsResponse.data.technicians || [],
            statuses: analyticsResponse.data.statuses || []
          }));
        }
      } catch (error) {
        console.warn('Analytics endpoint not available, using fallback data');
        // Fallback data
        setFilterData(prev => ({
          ...prev,
          cycleTypes: [
            { type: 'preventive', label: 'صيانة وقائية', count: 0 },
            { type: 'corrective', label: 'صيانة تصحيحية', count: 0 },
            { type: 'emergency', label: 'صيانة طارئة', count: 0 },
            { type: 'upgrade', label: 'ترقية', count: 0 }
          ],
          priorities: [
            { priority: 'critical', label: 'حرجة', count: 0 },
            { priority: 'high', label: 'عالية', count: 0 },
            { priority: 'medium', label: 'متوسطة', count: 0 },
            { priority: 'low', label: 'منخفضة', count: 0 }
          ],
          technicians: [
            { technician_id: 'tech1', name: 'أحمد محمد', workload: 0 },
            { technician_id: 'tech2', name: 'سارة أحمد', workload: 0 },
            { technician_id: 'tech3', name: 'محمد علي', workload: 0 }
          ],
          statuses: [
            { status: 'scheduled', label: 'مجدول', count: 0 },
            { status: 'in_progress', label: 'قيد التنفيذ', count: 0 },
            { status: 'completed', label: 'مكتمل', count: 0 },
            { status: 'cancelled', label: 'ملغي', count: 0 }
          ]
        }));
      }

    } catch (error) {
      console.error('Error fetching filter data:', error);
    } finally {
      setFilterData(prev => ({ ...prev, loading: false }));
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchMaintenanceCycles();
    fetchTechniciansWorkload();
    fetchStockAlerts();
    fetchSLAViolations();
    fetchMaintenanceAnalytics();
    fetchFilterData();
  }, []);
  
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

  // Handle search
  const handleSearch = (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    
    if (!searchTerm.trim() && !debouncedSearchTerm.trim()) return;
    
    const searchValue = searchTerm.trim() || debouncedSearchTerm.trim();
    fetchMaintenanceCycles({ search: searchValue, offset: 0 });
  };

  // Enhanced filter change handler with auto-apply
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    
    setFilterState(prev => ({ ...prev, hasChanges: true }));
    
    // Auto-apply for immediate filters
    if (filterState.autoApply && ['status', 'priority'].includes(key)) {
      setTimeout(() => applyFilters(), 100);
    }
  };

  // Handle advanced filter changes with better UX
  const handleAdvancedFilterChange = (category, key, value) => {
    setAdvancedFilters(prev => ({
      ...prev,
      [category]: key === 'dateRange' ? { ...prev.dateRange, ...value } : value
    }));
    
    setFilterState(prev => ({ ...prev, hasChanges: true }));
    
    // Auto-apply for single-select filters
    if (filterState.autoApply && ['customerPhone', 'assignedTechnician'].includes(category)) {
      setTimeout(() => applyFilters(), 300);
    }
  };

  // Apply filters with loading state
  const applyFilters = async () => {
    if (filterState.isApplying) return;
    
    setFilterState(prev => ({ ...prev, isApplying: true }));
    
    const enhancedFilters = { ...filters };
    
    // Add cycle types
    if (advancedFilters.cycleTypes.length > 0) {
      enhancedFilters.cycle_types = advancedFilters.cycleTypes.join(',');
    }
    
    // Add priorities
    if (advancedFilters.priorities.length > 0) {
      enhancedFilters.priorities = advancedFilters.priorities.join(',');
    }
    
    // Add technicians
    if (advancedFilters.technicians.length > 0) {
      enhancedFilters.technicians = advancedFilters.technicians.join(',');
    }
    
    // Add statuses
    if (advancedFilters.statuses.length > 0) {
      enhancedFilters.statuses = advancedFilters.statuses.join(',');
    }
    
    // Add date range
    if (advancedFilters.dateRange.from || advancedFilters.dateRange.to) {
      enhancedFilters.date_from = advancedFilters.dateRange.from;
      enhancedFilters.date_to = advancedFilters.dateRange.to;
    }
    
    // Add customer phone
    if (advancedFilters.customerPhone) {
      enhancedFilters.customer_phone = advancedFilters.customerPhone;
    }
    
    // Add assigned technician
    if (advancedFilters.assignedTechnician) {
      enhancedFilters.assigned_technician = advancedFilters.assignedTechnician;
    }
    
    setPagination(prev => ({ ...prev, offset: 0, currentPage: 1, hasMore: true }));
    await fetchMaintenanceCycles({ ...enhancedFilters, offset: 0 });
    
    setFilterState(prev => ({ 
      ...prev, 
      isApplying: false, 
      hasChanges: false 
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({});
    setSelectedStatus('');
    setSearchTerm('');
    setAdvancedFilters({
      cycleTypes: [],
      priorities: [],
      technicians: [],
      statuses: [],
      dateRange: { from: '', to: '' },
      customerPhone: '',
      assignedTechnician: ''
    });
    setPagination(prev => ({ ...prev, offset: 0, currentPage: 1, hasMore: true }));
    fetchMaintenanceCycles({ offset: 0 });
    setFilterState(prev => ({ ...prev, hasChanges: false }));
  };

  // Quick filter presets
  const quickFilters = [
    { name: 'دورات نشطة', filters: { status: 'in_progress' }, color: 'bg-blue-100 text-blue-800' },
    { name: 'مجدولة', filters: { status: 'scheduled' }, color: 'bg-orange-100 text-orange-800' },
    { name: 'مكتملة', filters: { status: 'completed' }, color: 'bg-green-100 text-green-800' },
    { name: 'انتهاكات SLA', action: 'sla_violations', color: 'bg-red-100 text-red-800' },
    { name: 'تنبيهات المخزون', action: 'stock_alerts', color: 'bg-yellow-100 text-yellow-800' },
    { name: 'عرض التفاصيل', action: 'expand_all', color: 'bg-gray-100 text-gray-800' }
  ];

  const applyQuickFilter = (quickFilter) => {
    if (quickFilter.action === 'sla_violations') {
      setViewMode('sla');
      fetchSLAViolations();
      return;
    }
    
    if (quickFilter.action === 'stock_alerts') {
      setViewMode('stock');
      fetchStockAlerts();
      return;
    }
    
    if (quickFilter.action === 'expand_all') {
      const allCycleIds = data.cycles.map(cycle => cycle.cycle_id);
      setExpandedItems(new Set(allCycleIds));
      return;
    }
    
    setFilters(quickFilter.filters);
    setPagination(prev => ({ ...prev, offset: 0, currentPage: 1, hasMore: true }));
    fetchMaintenanceCycles({ ...quickFilter.filters, offset: 0 });
    setFilterState(prev => ({ ...prev, hasChanges: false }));
  };

  // Toggle item expansion
  const toggleItemExpansion = async (itemId) => {
    const newExpandedItems = new Set(expandedItems);
    
    if (newExpandedItems.has(itemId)) {
      newExpandedItems.delete(itemId);
      setExpandedItems(newExpandedItems);
      setExpandedDetails(prev => {
        const newDetails = { ...prev };
        delete newDetails[itemId];
        return newDetails;
      });
    } else {
      newExpandedItems.add(itemId);
      setExpandedItems(newExpandedItems);
      
      if (!expandedDetails[itemId]) {
        await loadItemDetails(itemId);
      }
    }
  };

  // Load detailed item information
  const loadItemDetails = async (itemId) => {
    setLoadingExpandedDetails(prev => new Set(prev).add(itemId));
    
    try {
      const response = await api.maintenance.getCycle(itemId);
      
      if (response.success) {
        setExpandedDetails(prev => ({
          ...prev,
          [itemId]: response.data
        }));
      }
    } catch (error) {
      console.error('Error loading item details:', error);
    } finally {
      setLoadingExpandedDetails(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  // Get status badge style
  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'cancelled': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  // Get priority badge style
  const getPriorityBadgeStyle = (priority) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  // Loading state
  if (loading && data.cycles.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">جاري تحميل بيانات الصيانة...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="w-full bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              إدارة الصيانة
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              مركز إدارة دورات الصيانة، المخزون، ومراقبة SLA
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setViewMode('dashboard')}
              variant={viewMode === 'dashboard' ? 'default' : 'outline'}
              className="px-4 py-2"
            >
              <BarChart2 className="w-4 h-4 ml-2" />
              لوحة التحكم
            </Button>
            <Button
              onClick={() => setViewMode('cycles')}
              variant={viewMode === 'cycles' ? 'default' : 'outline'}
              className="px-4 py-2"
            >
              <Wrench className="w-4 h-4 ml-2" />
              دورات الصيانة
            </Button>
            <Button
              onClick={() => setViewMode('technicians')}
              variant={viewMode === 'technicians' ? 'default' : 'outline'}
              className="px-4 py-2"
            >
              <Users className="w-4 h-4 ml-2" />
              الفنيين
            </Button>
          </div>
        </div>
      </div>
      
      {/* Dashboard View */}
      {viewMode === 'dashboard' && (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Active Cycles */}
            <Card className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">الدورات النشطة</p>
                  <h3 className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
                    {data.stats.activeCycles}
                    <span className="mr-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                      من {data.stats.totalCycles}
                    </span>
                  </h3>
                </div>
                <div className="rounded-full p-2 bg-blue-100 dark:bg-blue-900/30">
                  <Wrench className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="mt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => setViewMode('cycles')}
                >
                  عرض الدورات
                </Button>
              </div>
            </Card>
            
            {/* Completed Today */}
            <Card className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">مكتملة اليوم</p>
                  <h3 className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
                    {data.stats.completedToday}
                  </h3>
                </div>
                <div className="rounded-full p-2 bg-green-100 dark:bg-green-900/30">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div className="mt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => {
                    setViewMode('cycles');
                    setFilters({ status: 'completed' });
                    fetchMaintenanceCycles({ status: 'completed', offset: 0 });
                  }}
                >
                  عرض المكتملة
                </Button>
              </div>
            </Card>
            
            {/* SLA Violations */}
            <Card className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">انتهاكات SLA</p>
                  <h3 className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
                    {data.stats.slaViolations}
                  </h3>
                </div>
                <div className="rounded-full p-2 bg-red-100 dark:bg-red-900/30">
                  <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <div className="mt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => setViewMode('sla')}
                >
                  عرض الانتهاكات
                </Button>
              </div>
            </Card>
            
            {/* Stock Alerts */}
            <Card className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">تنبيهات المخزون</p>
                  <h3 className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
                    {data.stats.stockAlerts}
                  </h3>
                </div>
                <div className="rounded-full p-2 bg-yellow-100 dark:bg-yellow-900/30">
                  <Package className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
              <div className="mt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => setViewMode('stock')}
                >
                  عرض التنبيهات
                </Button>
              </div>
            </Card>
          </div>
          
          {/* Quick Actions */}
          <div className="w-full bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Zap className="w-5 h-5 ml-2 text-brand-red-500" />
                إجراءات سريعة
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center gap-2"
                onClick={() => setViewMode('cycles')}
              >
                <Wrench className="w-6 h-6 text-brand-red-500" />
                <span>إنشاء دورة صيانة جديدة</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center gap-2"
                onClick={() => setViewMode('technicians')}
              >
                <Users className="w-6 h-6 text-blue-500" />
                <span>إدارة الفنيين</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center gap-2"
                onClick={() => setViewMode('stock')}
              >
                <Package className="w-6 h-6 text-green-500" />
                <span>إدارة المخزون</span>
              </Button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="w-full bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Clock className="w-5 h-5 ml-2 text-brand-red-500" />
                النشاط الأخير
              </h3>
            </div>
            <div className="space-y-3">
              {data.cycles.slice(0, 5).map((cycle) => (
                <div key={cycle.cycle_id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      cycle.status === 'scheduled' ? 'bg-orange-500' :
                      cycle.status === 'in_progress' ? 'bg-blue-500' :
                      cycle.status === 'completed' ? 'bg-green-500' : 'bg-gray-500'
                    }`}></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        دورة #{cycle.cycle_id} - {cycle.customer_name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {cycle.cycle_type} - {cycle.assigned_technician}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeStyle(cycle.status)}`}>
                      {cycle.status === 'scheduled' ? 'مجدول' :
                       cycle.status === 'in_progress' ? 'قيد التنفيذ' :
                       cycle.status === 'completed' ? 'مكتمل' : 'ملغي'}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(cycle.created_at).toLocaleDateString('ar-EG')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Cycles View */}
      {viewMode === 'cycles' && (
        <>
          {/* Search & Filters */}
          <div className="w-full bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
            {/* Search Bar */}
            <div className="w-full p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <form onSubmit={handleSearch} className="w-full flex items-center gap-3">
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="w-4 h-4 text-gray-400" />
                  </div>
                  <Input
                    placeholder="البحث في دورات الصيانة (رقم الدورة، اسم العميل، الفني...)"
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
                
                <Button 
                  type="submit" 
                  disabled={!searchTerm.trim()}
                  className="px-4 py-2.5 text-sm font-medium bg-brand-red-600 hover:bg-brand-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 rounded-lg"
                >
                  بحث
                </Button>
                
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
            
            {/* Quick Filters */}
            <div className="w-full p-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
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
                        ${quickFilter.color.includes('bg-orange') 
                          ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/30'
                          : quickFilter.color.includes('bg-blue')
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                          : quickFilter.color.includes('bg-green')
                          ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30'
                          : quickFilter.color.includes('bg-red')
                          ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30'
                          : quickFilter.color.includes('bg-yellow')
                          ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800 hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
                          : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }
                      `}
                    >
                      {quickFilter.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Filters Panel */}
            {showFilters && (
              <div className="w-full p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
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
                    {/* Primary Filters */}
                    <div className="w-full grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                      {/* Status Filter */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                          <AlertCircle className="w-4 h-4 ml-2 text-brand-red-500" />
                          الحالة
                        </label>
                        <select
                          value={filters.status || ''}
                          onChange={(e) => handleFilterChange('status', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-red-500 focus:border-transparent transition-all duration-200"
                        >
                          <option value="">جميع الحالات</option>
                          {filterData.statuses.map(status => (
                            <option key={status.status} value={status.status}>
                              {status.label} ({status.count})
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      {/* Priority Filter */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                          <Star className="w-4 h-4 ml-2 text-yellow-500" />
                          الأولوية
                        </label>
                        <select
                          value={filters.priority || ''}
                          onChange={(e) => handleFilterChange('priority', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-red-500 focus:border-transparent transition-all duration-200"
                        >
                          <option value="">جميع الأولويات</option>
                          {filterData.priorities.map(priority => (
                            <option key={priority.priority} value={priority.priority}>
                              {priority.label} ({priority.count})
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
                    </div>

                    {/* Filter Actions */}
                    <div className="w-full flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-4">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          <span className="text-brand-red-600 dark:text-brand-red-400 font-semibold">{pagination.total.toLocaleString()}</span> نتيجة
                        </div>
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

          {/* Cycles Display */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      رقم الدورة
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      العميل
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      الحالة
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      الأولوية
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      الفني
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      التاريخ
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                  {data.cycles.map((cycle) => (
                    <tr key={cycle.cycle_id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        #{cycle.cycle_id}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white font-medium">
                          {cycle.customer_name || 'غير محدد'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {cycle.customer_phone}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeStyle(cycle.status)}`}>
                          {cycle.status === 'scheduled' ? 'مجدول' :
                           cycle.status === 'in_progress' ? 'قيد التنفيذ' :
                           cycle.status === 'completed' ? 'مكتمل' : 'ملغي'}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadgeStyle(cycle.priority)}`}>
                          {cycle.priority === 'critical' ? 'حرجة' :
                           cycle.priority === 'high' ? 'عالية' :
                           cycle.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {cycle.assigned_technician || 'غير محدد'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(cycle.created_at).toLocaleDateString('ar-EG')}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleItemExpansion(cycle.cycle_id)}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                          >
                            {expandedItems.has(cycle.cycle_id) ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Load More */}
          {pagination.hasMore && (
            <div className="w-full flex justify-center">
              <Button
                onClick={() => fetchMaintenanceCycles({}, false)}
                disabled={loadingMore}
                variant="outline"
                className="px-6 py-3"
              >
                {loadingMore ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin ml-2" />
                    جاري التحميل...
                  </>
                ) : (
                  'تحميل المزيد'
                )}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Technicians View */}
      {viewMode === 'technicians' && (
        <div className="w-full bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <Users className="w-5 h-5 ml-2 text-blue-500" />
              إدارة الفنيين
            </h3>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 ml-2" />
              تسجيل فني جديد
            </Button>
          </div>
          
          <div className="space-y-4">
            {data.technicians.map((technician) => (
              <div key={technician.technician_id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {technician.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {technician.skills?.join(', ') || 'لا توجد مهارات محددة'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    عبء العمل: {technician.current_workload}/{technician.max_capacity}
                  </span>
                  <Button variant="outline" size="sm">
                    تفاصيل
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SLA Violations View */}
      {viewMode === 'sla' && (
        <div className="w-full bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <AlertCircle className="w-5 h-5 ml-2 text-red-500" />
              انتهاكات SLA
            </h3>
            <Button className="bg-red-600 hover:bg-red-700">
              <RefreshCw className="w-4 h-4 ml-2" />
              فحص الانتهاكات
            </Button>
          </div>
          
          <div className="space-y-4">
            {data.slaViolations.map((violation) => (
              <div key={violation.sla_id} className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      دورة #{violation.cycle_id} - {violation.sla_type}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      تجاوز: {violation.violation_hours} ساعة
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                    {violation.escalation_level}
                  </span>
                  <Button variant="outline" size="sm" className="border-red-200 text-red-600">
                    معالجة
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stock Alerts View */}
      {viewMode === 'stock' && (
        <div className="w-full bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <Package className="w-5 h-5 ml-2 text-yellow-500" />
              تنبيهات المخزون
            </h3>
            <Button className="bg-yellow-600 hover:bg-yellow-700">
              <RefreshCw className="w-4 h-4 ml-2" />
              فحص المخزون
            </Button>
          </div>
          
          <div className="space-y-4">
            {data.stockAlerts.map((alert) => (
              <div key={alert.sku} className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                    <Package className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {alert.product_name} - {alert.sku}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      الكمية الحالية: {alert.current_quantity} - الحد الأدنى: {alert.min_quantity}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-medium ${
                    alert.priority === 'critical' ? 'text-red-600 dark:text-red-400' :
                    alert.priority === 'high' ? 'text-orange-600 dark:text-orange-400' :
                    'text-yellow-600 dark:text-yellow-400'
                  }`}>
                    {alert.priority === 'critical' ? 'حرج' :
                     alert.priority === 'high' ? 'عالية' : 'متوسطة'}
                  </span>
                  <Button variant="outline" size="sm" className="border-yellow-200 text-yellow-600">
                    طلب
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenancePage;