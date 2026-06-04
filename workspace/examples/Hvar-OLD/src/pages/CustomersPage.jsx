import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, StatusBadge, Input, EmptyState } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

// Icons
import {
  Users, 
  Search, 
  Filter, 
  Download, 
  Plus,
  Package,
  DollarSign,
  Target,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Star,
  BarChart3,
  X,
  XCircle,
  Grid3X3,
  List,
  FilterX,
  Zap,
  Calendar,
  MapPin,
  Phone,
  Clock,
  Loader,
  CheckCircle,
  RotateCcw,
  Crown,
  Sparkles,
  User,
  AlertTriangle
} from 'lucide-react';

/**
 * Responsive Customers Page - Perfect Integration with Dashboard Layout
 * Updated to use real backend data structures and API responses
 */
const CustomersPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [filters, setFilters] = useState({});
  const [segments, setSegments] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [pagination, setPagination] = useState({
    total: 0,
    offset: 0,
    limit: 25,
    currentPage: 1
  });
  const [sortBy, setSortBy] = useState('total_orders');
  const [sortDir, setSortDir] = useState('DESC');
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSegment, setSelectedSegment] = useState('');
  const [error, setError] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('table');
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  
  const searchTimeout = useRef(null);
  
  // Customer Creation Form State
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [customerFormData, setCustomerFormData] = useState({
    phone: '',
    name: '',
    governorate: '',
    city: '',
    street: '',
    notes: ''
  });
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [formApiError, setFormApiError] = useState('');
  const [formSuccessMessage, setFormSuccessMessage] = useState('');
  
  // Fetch customers data with real backend structure
  const fetchCustomers = async (params = {}) => {
      setLoading(true);
    setError(null);
    
    try {
      const queryParams = {
        limit: pagination.limit,
        offset: pagination.offset,
        sort_by: sortBy,
        sort_dir: sortDir,
        ...filters,
        ...params
      };

      const response = await api.customers.getCustomers(queryParams);
      
      if (response.success) {
        setCustomers(response.data.customers);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total,
          offset: response.data.pagination.offset,
          limit: response.data.pagination.limit,
          hasMore: response.data.pagination.has_more
        }));
        setLastUpdate(new Date());
      } else {
        setError(response.error || 'Failed to fetch customers');
      }
      } catch (error) {
      console.error('Error fetching customers:', error);
      setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    
  // Fetch segments with real backend structure
  const fetchSegments = async () => {
    try {
      const response = await api.customers.getSegments();
      if (response.success) {
        setSegments(response.data.segments);
      }
    } catch (error) {
      console.error('Error fetching segments:', error);
    }
  };

  // Fetch analytics with real backend structure
  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const [analyticsResponse, segmentsResponse] = await Promise.all([
        api.customers.getAnalytics(),
        api.customers.getSegments()
      ]);
      
      if (analyticsResponse.success) {
        setAnalytics(analyticsResponse.data);
      }
      
      if (segmentsResponse.success) {
        // Transform segments data for the UI based on real backend structure
        const segmentsData = {};
        segmentsResponse.data.segments.forEach(segment => {
          segmentsData[segment.segment_name] = {
            count: 0, // Will be populated from analytics
            percentage: 0,
            total_revenue: 0,
            total_orders: 0,
            avg_revenue: 0,
            avg_orders: 0
          };
        });
        
        // Merge with analytics data if available
        if (analyticsResponse.success) {
          analyticsResponse.data.segment_analytics.forEach(segment => {
            if (segmentsData[segment.segment]) {
              segmentsData[segment.segment] = {
                count: segment.customer_count,
                percentage: (segment.customer_count / analyticsResponse.data.overall_metrics.total_customers * 100),
                total_revenue: segment.total_revenue,
                total_orders: segment.total_orders,
                avg_revenue: segment.avg_lifetime_value,
                avg_orders: segment.total_orders / segment.customer_count
              };
            }
          });
        }
        
        setAnalytics(prev => ({
          ...prev,
          segments: segmentsData,
          summary: analyticsResponse.data.overall_metrics || {
            total_customers: 0,
            total_revenue: 0,
            total_orders: 0
          }
        }));
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('فشل في تحميل البيانات التحليلية');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchCustomers();
    fetchSegments();
    // fetchAnalytics(); // Hidden for now
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    searchTimeout.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      if (searchTerm.trim()) {
        fetchCustomers({ search: searchTerm.trim() });
      } else {
        fetchCustomers();
      }
    }, 500);
    
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchTerm]);

  // Handle pagination
  const handlePageChange = (page) => {
    const newOffset = (page - 1) * pagination.limit;
    setPagination(prev => ({
      ...prev,
      offset: newOffset,
      currentPage: page
    }));
    fetchCustomers({ offset: newOffset });
  };

  // Handle sorting
  const handleSort = (field) => {
    const newSortDir = sortBy === field && sortDir === 'ASC' ? 'DESC' : 'ASC';
    setSortBy(field);
    setSortDir(newSortDir);
    setPagination(prev => ({ ...prev, offset: 0, currentPage: 1 }));
    fetchCustomers({ 
      sort_by: field, 
      sort_dir: newSortDir, 
      offset: 0 
    });
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Apply filters
  const applyFilters = () => {
    setPagination(prev => ({ ...prev, offset: 0, currentPage: 1 }));
    fetchCustomers({ ...filters, offset: 0 });
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({});
    setSelectedSegment('');
    setSearchTerm('');
    setPagination(prev => ({ ...prev, offset: 0, currentPage: 1 }));
    fetchCustomers({ offset: 0 });
  };

  // Handle search
  const handleSearch = (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    if (!searchTerm.trim() && !debouncedSearchTerm.trim()) return;

    const searchValue = searchTerm.trim() || debouncedSearchTerm.trim();
    fetchCustomers({ search: searchValue, offset: 0 });
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

  // Get segment color based on real backend segments
  const getSegmentColor = (segment) => {
    switch (segment) {
      case 'vip': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'regular': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'new': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'problematic': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  // Get avatar background color based on segment
  const getAvatarBgColor = (segment) => {
    switch (segment) {
      case 'vip': return 'bg-gradient-to-br from-purple-500 to-purple-700';
      case 'regular': return 'bg-gradient-to-br from-blue-500 to-blue-700';
      case 'new': return 'bg-gradient-to-br from-green-500 to-green-700';
      case 'problematic': return 'bg-gradient-to-br from-red-500 to-red-700';
      default: return 'bg-gradient-to-br from-gray-500 to-gray-700';
    }
  };

  // Get category icon based on segment
  const getCategoryIcon = (segment) => {
    switch (segment) {
      case 'vip': return Crown;
      case 'regular': return User;
      case 'new': return Sparkles;
      case 'problematic': return AlertTriangle;
      default: return User;
    }
  };

  // Get category label in Arabic
  const getCategoryLabel = (segment) => {
    switch (segment) {
      case 'vip': return 'VIP';
      case 'regular': return 'عميل منتظم';
      case 'new': return 'جديد';
      case 'problematic': return 'عميل مشاكل';
      default: return 'غير محدد';
    }
  };
  
  // Get status badge variant based on delivery success rate
  const getStatusVariant = (deliveryRate) => {
    if (deliveryRate >= 90) return 'success';
    if (deliveryRate >= 70) return 'warning';
    return 'error';
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'غير محدد';
    try {
      return new Date(dateString).toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return 'غير محدد';
    }
  };

  // Customer Creation Functions
  const validateCustomerForm = (data) => {
    const errors = {};
    // Egyptian mobile format: +20 or 0 then 11-digit starting with 1[0,1,2,5]
    const phonePattern = /^(\+20|0)?1[0125][0-9]{8}$/;

    if (!data.phone || !phonePattern.test(String(data.phone).trim())) {
      errors.phone = 'يرجى إدخال رقم هاتف مصري صحيح';
    }
    if (!data.name || String(data.name).trim().length < 2) {
      errors.name = 'يرجى إدخال اسم صحيح (حرفان على الأقل)';
    }
    if (!data.governorate || String(data.governorate).trim().length < 2) {
      errors.governorate = 'يرجى إدخال المحافظة';
    }
    if (!data.city || String(data.city).trim().length < 2) {
      errors.city = 'يرجى إدخال المدينة';
    }
    return errors;
  };

  const handleCustomerFormSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setCreatingCustomer(true);
      setFormApiError('');
      setFormSuccessMessage('');

      const validation = validateCustomerForm(customerFormData);
      setFormErrors(validation);
      if (Object.keys(validation).length > 0) {
        return;
      }
      
      const response = await api.customers.createCustomer(customerFormData);
      
      if (response.success) {
        // Reset form
        setShowCustomerForm(false);
        setCustomerFormData({
          phone: '',
          name: '',
          governorate: '',
          city: '',
          street: '',
          notes: ''
        });
        setFormErrors({});
        setFormSuccessMessage('تمت إضافة العميل بنجاح');
        
        // Refresh customers list
        await fetchCustomers();
        
        console.log('✅ Customer created successfully:', response.data);
      } else {
        console.error('❌ Failed to create customer:', response.error);
        // Handle duplicate existing customer hint
        const duplicatePhone = response?.data?.existing_customer_phone;
        if (duplicatePhone) {
          setFormApiError(`العميل برقم ${duplicatePhone} موجود بالفعل. يمكنك فتح الملف الخاص به.`);
        } else {
          setFormApiError(response.error || 'فشل إنشاء العميل');
        }
      }
    } catch (error) {
      console.error('❌ Error creating customer:', error);
      setFormApiError(error.message || 'حدث خطأ غير متوقع');
    } finally {
      setCreatingCustomer(false);
    }
  };

  // Category Avatar Component
  const CategoryAvatar = ({ customer }) => {
    const IconComponent = getCategoryIcon(customer.customer_segment);
    const bgColor = getAvatarBgColor(customer.customer_segment);
    const label = getCategoryLabel(customer.customer_segment);
    
    return (
      <div className="relative group">
        <div className={`h-10 w-10 rounded-full ${bgColor} text-white flex items-center justify-center text-sm font-semibold shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl`}>
          <IconComponent className="w-5 h-5" />
        </div>
        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
          {label}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Responsive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
    <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">العملاء</h1>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" leftIcon={<Download size={16} />} className="w-full sm:w-auto">
            تصدير
          </Button>
          <Button size="sm" leftIcon={<Plus size={16} />} className="bg-brand-red-600 hover:bg-brand-red-700 w-full sm:w-auto" onClick={() => setShowCustomerForm(true)}>
            إضافة
          </Button>
        </div>
      </div>
      
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
                placeholder="البحث في العملاء (الاسم، رقم الهاتف، المدينة...)"
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
              {Object.keys(filters).length > 0 && (
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
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => {
                    setFilters({ segment: 'vip' });
                    fetchCustomers({ segment: 'vip' });
                  }}
                  className="px-3 py-2 text-xs font-medium bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800 rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-sm active:scale-95"
                >
                  VIP
                </button>
                <button
                  onClick={() => {
                    setFilters({ segment: 'regular' });
                    fetchCustomers({ segment: 'regular' });
                  }}
                  className="px-3 py-2 text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-sm active:scale-95"
                >
                  عاديون
                </button>
                <button
                  onClick={() => {
                    setFilters({ segment: 'new' });
                    fetchCustomers({ segment: 'new' });
                  }}
                  className="px-3 py-2 text-xs font-medium bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-sm active:scale-95"
                >
                  جدد
                </button>
                <button
                  onClick={() => {
                    setFilters({ segment: 'problematic' });
                    fetchCustomers({ segment: 'problematic' });
                  }}
                  className="px-3 py-2 text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-sm active:scale-95"
                >
                  مشاكل
                </button>
                <button
                  onClick={() => {
                    setFilters({ order_count_min: 10 });
                    fetchCustomers({ order_count_min: 10 });
                  }}
                  className="px-3 py-2 text-xs font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-sm active:scale-95"
                >
                  عملاء نشطون
                </button>
            </div>
          </div>

            {/* Results Info */}
            <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
              <Clock className="w-4 h-4 ml-2" />
              آخر تحديث: {formatLastUpdate(lastUpdate)}
            </div>
          </div>
          </div>
          
        {/* Filters Panel - Compact Professional Design */}
        {showFilters && (
          <div className="w-full p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
            {/* Primary Filters - Compact Grid */}
            <div className="w-full grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
              {/* Segment Filter */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                  <Star className="w-4 h-4 ml-2 text-brand-red-500" />
                  الفئة
                </label>
                <select
                  value={filters.segment || ''}
                  onChange={(e) => handleFilterChange('segment', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-red-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="">جميع الفئات</option>
                  <option value="vip">VIP</option>
                  <option value="regular">عاديون</option>
                  <option value="new">جدد</option>
                  <option value="problematic">مشاكل</option>
                </select>
              </div>

              {/* City Filter */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                  <MapPin className="w-4 h-4 ml-2 text-brand-red-500" />
                  المدينة
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="اسم المدينة..."
                    value={filters.city || ''}
                    onChange={(e) => handleFilterChange('city', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-brand-red-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>

              {/* Min Orders Filter */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                  <Package className="w-4 h-4 ml-2 text-green-500" />
                  الحد الأدنى للطلبات
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.order_count_min || ''}
                  onChange={(e) => handleFilterChange('order_count_min', e.target.value || undefined)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-brand-red-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              {/* Min Revenue Filter */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                  <DollarSign className="w-4 h-4 ml-2 text-purple-500" />
                  الحد الأدنى للإيرادات
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.lifetime_value_min || ''}
                  onChange={(e) => handleFilterChange('lifetime_value_min', e.target.value || undefined)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-brand-red-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            {/* Apply/Clear Filters - Compact Professional */}
            <div className="w-full flex justify-end gap-3">
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
          </div>
        )}
      </div>



      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
      </div>
      )}
      
      {/* Customers Display */}
      {viewMode === 'table' ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    العميل
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    الطلبات
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    الإيرادات
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    معدل التوصيل
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    الفئة
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    آخر طلب
                  </th>

                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {customers.map((customer) => (
                  <tr 
                    key={customer.phone} 
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                    onClick={() => window.location.href = `/customers/${customer.phone}`}
                  >
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <CategoryAvatar customer={customer} />
                        <div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {customer.full_name || 'غير محدد'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {customer.phone}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-center">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          {customer.total_orders.toLocaleString('ar-EG')}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          طلب
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-center">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(customer.total_value)}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          إجمالي
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex justify-center">
                        <StatusBadge variant={getStatusVariant(customer.satisfaction_score || 0)}>
                          {Math.round((customer.satisfaction_score || 0) * 100)}%
                        </StatusBadge>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex justify-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getSegmentColor(customer.customer_segment)}`}>
                          {customer.customer_segment}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(customer.last_order_date)}
                    </td>

                  </tr>
                ))}
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
              {customers.map((customer) => (
            <div 
              key={customer.phone} 
              className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => window.location.href = `/customers/${customer.phone}`}
            >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="relative group">
                        <div className={`h-12 w-12 rounded-full ${getAvatarBgColor(customer.customer_segment)} text-white flex items-center justify-center text-lg font-semibold shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl`}>
                          {(() => {
                            const IconComponent = getCategoryIcon(customer.customer_segment);
                            return <IconComponent className="w-6 h-6" />;
                          })()}
                        </div>
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                          {getCategoryLabel(customer.customer_segment)}
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                      {customer.full_name || 'غير محدد'}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                      {customer.phone}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">الطلبات</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {customer.total_orders.toLocaleString('ar-EG')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">الإيرادات</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(customer.total_value)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">التوصيل</p>
                  <StatusBadge variant={getStatusVariant(customer.satisfaction_score || 0)}>
                    {Math.round((customer.satisfaction_score || 0) * 100)}%
                      </StatusBadge>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">آخر طلب</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(customer.last_order_date)}
                      </p>
                    </div>
                  </div>
                  

                </div>
              ))}
            </div>
          )}

      {/* Enhanced Empty State */}
      {!loading && customers.length === 0 && (
        <EmptyState
          icon={Search}
          title="لا توجد عملاء"
          description="لم يتم العثور على عملاء تطابق معايير البحث المحددة"
          variant="search"
        />
      )}

      {/* Customer Creation Form Modal */}
      {showCustomerForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">إضافة عميل جديد</h2>
                <button
                  onClick={() => {
                    setShowCustomerForm(false);
                    setCustomerFormData({
                      phone: '',
                      name: '',
                      governorate: '',
                      city: '',
                      street: '',
                      notes: ''
                    });
                    setFormErrors({});
                    setFormApiError('');
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleCustomerFormSubmit} className="p-6 space-y-6">
              {/* API Error */}
              {formApiError && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-300">
                  <div className="flex items-start justify-between gap-3">
                    <span>{formApiError}</span>
                    {/* If duplicate, offer quick open */}
                    {formApiError.includes('موجود بالفعل') && (
                      <button
                        type="button"
                        onClick={() => {
                          const match = formApiError.match(/\d{10,13}/);
                          const phoneToOpen = match ? match[0] : customerFormData.phone;
                          if (phoneToOpen) window.location.href = `/customers/${phoneToOpen}`;
                        }}
                        className="text-xs px-2 py-1 bg-red-100 dark:bg-red-800/40 text-red-700 dark:text-red-200 rounded"
                      >
                        فتح الملف
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  رقم الهاتف *
                </label>
                <input
                  type="tel"
                  value={customerFormData.phone}
                  onChange={(e) => setCustomerFormData({...customerFormData, phone: e.target.value})}
                  placeholder="أدخل رقم الهاتف"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  required
                />
                {formErrors.phone && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{formErrors.phone}</p>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  اسم العميل *
                </label>
                <input
                  type="text"
                  value={customerFormData.name}
                  onChange={(e) => setCustomerFormData({...customerFormData, name: e.target.value})}
                  placeholder="أدخل اسم العميل"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  required
                />
                {formErrors.name && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{formErrors.name}</p>
                )}
              </div>

              {/* Governorate and City */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    المحافظة *
                  </label>
                  <input
                    type="text"
                    value={customerFormData.governorate}
                    onChange={(e) => setCustomerFormData({...customerFormData, governorate: e.target.value})}
                    placeholder="أدخل اسم المحافظة"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                    required
                  />
                  {formErrors.governorate && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{formErrors.governorate}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    المدينة *
                  </label>
                  <input
                    type="text"
                    value={customerFormData.city}
                    onChange={(e) => setCustomerFormData({...customerFormData, city: e.target.value})}
                    placeholder="أدخل اسم المدينة"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                    required
                  />
                  {formErrors.city && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{formErrors.city}</p>
                  )}
                </div>
              </div>

              {/* Street */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  الشارع (اختياري)
                </label>
                <input
                  type="text"
                  value={customerFormData.street}
                  onChange={(e) => setCustomerFormData({...customerFormData, street: e.target.value})}
                  placeholder="أدخل اسم الشارع"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ملاحظات (اختياري)
                </label>
                <textarea
                  value={customerFormData.notes}
                  onChange={(e) => setCustomerFormData({...customerFormData, notes: e.target.value})}
                  placeholder="أدخل ملاحظات إضافية"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                />
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomerForm(false);
                    setCustomerFormData({
                      phone: '',
                      name: '',
                      governorate: '',
                      city: '',
                      street: '',
                      notes: ''
                    });
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={creatingCustomer}
                  className="px-6 py-2 text-sm font-medium text-white bg-brand-red-600 hover:bg-brand-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  {creatingCustomer ? 'جاري الإضافة...' : 'إضافة العميل'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Success message (lightweight) */}
      {formSuccessMessage && (
        <div className="mt-2 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-3 text-sm text-green-700 dark:text-green-300">
          {formSuccessMessage}
        </div>
      )}
    </div>
  );
};

export default CustomersPage; 