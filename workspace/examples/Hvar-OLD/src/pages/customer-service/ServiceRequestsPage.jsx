import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Input, StatusBadge } from '../../components/ui';
import api from '../../services/api';

// Icons
import { 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Download,
  RefreshCw,
  Calendar,
  Clock,
  Phone,
  User,
  Package,
  AlertCircle,
  CheckCircle,
  X,
  Clock as ClockIcon,
  Star,
  Eye,
  Edit,
  MoreVertical,
  SlidersHorizontal,
  Grid3X3,
  List,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  FilterX
} from 'lucide-react';

/**
 * Service Requests Page - Modern 2025 Design with Expert UI/UX
 */
const ServiceRequestsPage = () => {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [totalRequests, setTotalRequests] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    dateRange: '',
    searchTerm: '',
    assignedTo: '',
    requestType: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedRequests, setSelectedRequests] = useState([]);
  const [isBulkActionsOpen, setIsBulkActionsOpen] = useState(false);
  
  const itemsPerPage = 12;
  
  // Priority levels for the filter dropdown
  const priorityLevels = [
    { value: '', label: 'جميع الأولويات', color: 'gray' },
    { value: '1', label: 'منخفضة', color: 'green' },
    { value: '2', label: 'متوسطة', color: 'blue' },
    { value: '3', label: 'عالية', color: 'amber' },
    { value: '4', label: 'عاجلة', color: 'red' }
  ];
  
  // Status options for the filter dropdown
  const statusOptions = [
    { value: '', label: 'جميع الحالات', color: 'gray' },
    { value: 'pending', label: 'معلّق', color: 'amber' },
    { value: 'in_progress', label: 'قيد التنفيذ', color: 'blue' },
    { value: 'completed', label: 'مكتمل', color: 'green' },
    { value: 'cancelled', label: 'ملغي', color: 'red' },
    { value: 'on_hold', label: 'متوقف', color: 'purple' }
  ];
  
  // Date range options
  const dateRangeOptions = [
    { value: '', label: 'جميع التواريخ' },
    { value: 'today', label: 'اليوم' },
    { value: 'yesterday', label: 'الأمس' },
    { value: 'week', label: 'هذا الأسبوع' },
    { value: 'month', label: 'هذا الشهر' },
    { value: 'quarter', label: 'هذا الربع' }
  ];

  // Request types
  const requestTypes = [
    { value: '', label: 'جميع الأنواع' },
    { value: 'installation', label: 'تركيب' },
    { value: 'repair', label: 'إصلاح' },
    { value: 'maintenance', label: 'صيانة' },
    { value: 'inquiry', label: 'استفسار' }
  ];
  
  // Fetch service requests
  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      
      try {
        // Mock data for demonstration
        const mockData = {
          requests: Array(24).fill(null).map((_, index) => ({
            id: 100 + index,
            customer_name: [
              'أحمد محمد', 
              'سارة أحمد', 
              'محمد علي', 
              'فاطمة حسين', 
              'علي عمر',
              'نور الدين',
              'ليلى محمود',
              'حسن عبدالله'
            ][Math.floor(Math.random() * 8)],
            phone: `0100${Math.floor(1000000 + Math.random() * 9000000)}`,
            request_date: `2024-05-${Math.floor(1 + Math.random() * 30).toString().padStart(2, '0')}`,
            product_code: ['HV-1000', 'HV-1500', 'HV-2000', 'HV-3000', 'HV-4000'][Math.floor(Math.random() * 5)],
            solution_status: ['pending', 'in_progress', 'completed', 'cancelled', 'on_hold'][Math.floor(Math.random() * 5)],
            priority_level: Math.floor(1 + Math.random() * 4),
            assigned_to: ['محمد أحمد', 'سارة علي', 'أحمد حسن', 'فاطمة محمد', null][Math.floor(Math.random() * 5)],
            request_type: ['installation', 'repair', 'maintenance', 'inquiry'][Math.floor(Math.random() * 4)],
            notes: Math.random() > 0.5 ? 'ملاحظات حول الطلب' : null,
            estimated_cost: Math.floor(Math.random() * 1000) + 200,
            customer_rating: Math.random() > 0.7 ? Math.floor(Math.random() * 2) + 4 : null,
            last_updated: `2024-05-${Math.floor(1 + Math.random() * 30).toString().padStart(2, '0')} ${Math.floor(Math.random() * 24).toString().padStart(2, '0')}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`
          })),
          total: 156
        };
        
        // Filter and sort the mock data
        let filteredData = [...mockData.requests];
        
        if (filters.status) {
          filteredData = filteredData.filter(req => req.solution_status === filters.status);
        }
        
        if (filters.priority) {
          filteredData = filteredData.filter(req => req.priority_level === parseInt(filters.priority));
        }

        if (filters.requestType) {
          filteredData = filteredData.filter(req => req.request_type === filters.requestType);
        }
        
        if (filters.searchTerm) {
          const searchLower = filters.searchTerm.toLowerCase();
          filteredData = filteredData.filter(req => 
            req.customer_name.toLowerCase().includes(searchLower) || 
            req.product_code.toLowerCase().includes(searchLower) ||
            req.phone.includes(filters.searchTerm)
          );
        }
        
        // Sort data
        filteredData.sort((a, b) => {
          let aValue, bValue;
          
          switch (sortBy) {
            case 'date':
              aValue = new Date(a.request_date);
              bValue = new Date(b.request_date);
              break;
            case 'priority':
              aValue = a.priority_level;
              bValue = b.priority_level;
              break;
            case 'status':
              aValue = a.solution_status;
              bValue = b.solution_status;
              break;
            case 'customer':
              aValue = a.customer_name;
              bValue = b.customer_name;
              break;
            default:
              aValue = a.id;
              bValue = b.id;
          }
          
          if (sortOrder === 'asc') {
            return aValue > bValue ? 1 : -1;
          } else {
            return aValue < bValue ? 1 : -1;
          }
        });
        
        // Pagination logic
        const start = (currentPage - 1) * itemsPerPage;
        const paginatedData = filteredData.slice(start, start + itemsPerPage);
        
        setRequests(paginatedData);
        setTotalRequests(filteredData.length);
      } catch (error) {
        console.error('Error fetching service requests:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRequests();
  }, [currentPage, filters, sortBy, sortOrder]);
  
  // Handle search input
  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      setCurrentPage(1);
      setFilters({ ...filters, searchTerm: e.target.value });
    }
  };
  
  // Handle filter changes
  const handleFilterChange = (filterName, value) => {
    setCurrentPage(1);
    setFilters({ ...filters, [filterName]: value });
  };
  
  // Handle sorting
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };
  
  // Handle pagination
  const totalPages = Math.ceil(totalRequests / itemsPerPage);
  
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  
  // Handle bulk selection
  const handleSelectAll = () => {
    if (selectedRequests.length === requests.length) {
      setSelectedRequests([]);
    } else {
      setSelectedRequests(requests.map(req => req.id));
    }
  };

  const handleSelectRequest = (id) => {
    if (selectedRequests.includes(id)) {
      setSelectedRequests(selectedRequests.filter(reqId => reqId !== id));
    } else {
      setSelectedRequests([...selectedRequests, id]);
    }
  };
  
  // Get priority badge styles
  const getPriorityBadge = (level) => {
    switch (level) {
      case 4:
        return <span className="inline-flex items-center px-2.5 py-1 bg-red-100 dark:bg-red-900/30 text-xs font-semibold text-red-800 dark:text-red-300 rounded-full border border-red-200 dark:border-red-800">عاجل</span>;
      case 3:
        return <span className="inline-flex items-center px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 text-xs font-semibold text-amber-800 dark:text-amber-300 rounded-full border border-amber-200 dark:border-amber-800">عالي</span>;
      case 2:
        return <span className="inline-flex items-center px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-xs font-semibold text-blue-800 dark:text-blue-300 rounded-full border border-blue-200 dark:border-blue-800">متوسط</span>;
      case 1:
        return <span className="inline-flex items-center px-2.5 py-1 bg-green-100 dark:bg-green-900/30 text-xs font-semibold text-green-800 dark:text-green-300 rounded-full border border-green-200 dark:border-green-800">منخفض</span>;
      default:
        return null;
    }
  };

  // Get request type icon and color
  const getRequestTypeInfo = (type) => {
    switch (type) {
      case 'installation':
        return { icon: <Package className="w-4 h-4" />, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' };
      case 'repair':
        return { icon: <AlertCircle className="w-4 h-4" />, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' };
      case 'maintenance':
        return { icon: <CheckCircle className="w-4 h-4" />, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' };
      case 'inquiry':
        return { icon: <ClockIcon className="w-4 h-4" />, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' };
      default:
        return { icon: <Package className="w-4 h-4" />, color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-900/20' };
    }
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({
      status: '',
      priority: '',
      dateRange: '',
      searchTerm: '',
      assignedTo: '',
      requestType: ''
    });
    setCurrentPage(1);
  };

  // Get active filters count
  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => value !== '').length;
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                طلبات الخدمة
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                إدارة ومتابعة {totalRequests} طلب خدمة
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* View mode toggle */}
              <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded-md transition-all duration-200 ${
                    viewMode === 'table' 
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' 
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-all duration-200 ${
                    viewMode === 'grid' 
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' 
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
              </div>

              <Link to="/customer-service/requests/new">
                <Button className="flex items-center gap-2 bg-gradient-to-r from-brand-red-600 to-brand-red-700 hover:from-brand-red-700 hover:to-brand-red-800 shadow-lg hover:shadow-xl transition-all duration-200">
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">طلب جديد</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters Section */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          {/* Search Bar */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input 
                placeholder="بحث بالاسم، رقم الهاتف، أو رقم المنتج..." 
                className="pl-4 pr-12 py-3 text-base rounded-xl border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500 transition-all duration-200"
                onKeyDown={handleSearch}
              />
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                className="flex items-center gap-2 px-4 py-3 rounded-xl border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>فلترة</span>
                {getActiveFiltersCount() > 0 && (
                  <span className="bg-brand-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {getActiveFiltersCount()}
                  </span>
                )}
              </Button>
              
              <Button 
                variant="ghost"
                className="p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                onClick={() => {
                  clearAllFilters();
                  setCurrentPage(1);
                }}
              >
                <RefreshCw className="w-5 h-5" />
              </Button>
              
              <Button 
                variant="ghost"
                className="p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
              >
                <Download className="w-5 h-5" />
              </Button>
            </div>
          </div>
          
          {/* Advanced Filters */}
          {showFilters && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {/* Status filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    حالة الطلب
                  </label>
                  <select
                    className="w-full px-3 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500 transition-all duration-200"
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                
                {/* Priority filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    الأولوية
                  </label>
                  <select
                    className="w-full px-3 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500 transition-all duration-200"
                    value={filters.priority}
                    onChange={(e) => handleFilterChange('priority', e.target.value)}
                  >
                    {priorityLevels.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                {/* Request type filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    نوع الطلب
                  </label>
                  <select
                    className="w-full px-3 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500 transition-all duration-200"
                    value={filters.requestType}
                    onChange={(e) => handleFilterChange('requestType', e.target.value)}
                  >
                    {requestTypes.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                
                {/* Date range filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    النطاق الزمني
                  </label>
                  <select
                    className="w-full px-3 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500 transition-all duration-200"
                    value={filters.dateRange}
                    onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                  >
                    {dateRangeOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results Section */}
      <div className="px-4 sm:px-6 lg:px-8 pb-8">
        {/* Bulk Actions */}
        {selectedRequests.length > 0 && (
          <div className="bg-brand-red-50 dark:bg-brand-red-900/20 border border-brand-red-200 dark:border-brand-red-800 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-brand-red-800 dark:text-brand-red-300">
                  تم تحديد {selectedRequests.length} طلب
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="text-brand-red-700 border-brand-red-300 hover:bg-brand-red-100">
                  تحديث الحالة
                </Button>
                <Button variant="outline" size="sm" className="text-brand-red-700 border-brand-red-300 hover:bg-brand-red-100">
                  تصدير
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedRequests([])}
                  className="text-brand-red-700 hover:bg-brand-red-100"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-gray-200 border-t-brand-red-600 rounded-full animate-spin mx-auto"></div>
              <p className="mt-4 text-gray-500 dark:text-gray-400">جاري تحميل البيانات...</p>
            </div>
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                لا توجد طلبات خدمة
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
                لم يتم العثور على أي طلبات خدمة بالمعايير المحددة. يمكنك تعديل معايير البحث أو إنشاء طلب خدمة جديد.
              </p>
              <Link to="/customer-service/requests/new">
                <Button className="bg-gradient-to-r from-brand-red-600 to-brand-red-700 hover:from-brand-red-700 hover:to-brand-red-800">
                  إنشاء طلب جديد
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  عرض {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalRequests)} من إجمالي {totalRequests} طلب
                </span>
                
                {/* Sort options */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">ترتيب حسب:</span>
                  <select
                    className="text-sm bg-transparent border-none focus:ring-0 text-gray-700 dark:text-gray-300"
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [field, order] = e.target.value.split('-');
                      setSortBy(field);
                      setSortOrder(order);
                    }}
                  >
                    <option value="date-desc">التاريخ (الأحدث)</option>
                    <option value="date-asc">التاريخ (الأقدم)</option>
                    <option value="priority-desc">الأولوية (الأعلى)</option>
                    <option value="priority-asc">الأولوية (الأدنى)</option>
                    <option value="customer-asc">اسم العميل (أ-ي)</option>
                    <option value="customer-desc">اسم العميل (ي-أ)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Grid View */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {requests.map((request) => {
                  const typeInfo = getRequestTypeInfo(request.request_type);
                  
                  return (
                    <Card key={request.id} className="group hover:shadow-lg transition-all duration-300 border-gray-200 dark:border-gray-700 overflow-hidden">
                      <div className="p-6">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${typeInfo.bg}`}>
                              <div className={typeInfo.color}>{typeInfo.icon}</div>
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                #{request.id}
                              </h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {request.request_type === 'installation' && 'تركيب'}
                                {request.request_type === 'repair' && 'إصلاح'}
                                {request.request_type === 'maintenance' && 'صيانة'}
                                {request.request_type === 'inquiry' && 'استفسار'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {getPriorityBadge(request.priority_level)}
                            <button className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreVertical className="w-4 h-4 text-gray-400" />
                            </button>
                          </div>
                        </div>

                        {/* Customer Info */}
                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-gray-900 dark:text-white">
                              {request.customer_name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <Phone className="w-3 h-3" />
                            <span dir="ltr">{request.phone}</span>
                          </div>
                        </div>

                        {/* Product Info */}
                        <div className="mb-4">
                          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <Package className="w-3 h-3" />
                            <span>{request.product_code}</span>
                          </div>
                        </div>

                        {/* Status and Date */}
                        <div className="flex items-center justify-between mb-4">
                          <StatusBadge status={request.solution_status} />
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {request.request_date}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                          <Link to={`/customer-service/requests/${request.id}`} className="flex-1">
                            <Button variant="outline" size="sm" className="w-full">
                              <Eye className="w-3 h-3 mr-1" />
                              عرض
                            </Button>
                          </Link>
                          <Link to={`/customer-service/requests/${request.id}/edit`}>
                            <Button variant="ghost" size="sm">
                              <Edit className="w-3 h-3" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              /* Table View */
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-700/50">
                        <th className="py-4 px-6 text-right">
                          <input
                            type="checkbox"
                            checked={selectedRequests.length === requests.length && requests.length > 0}
                            onChange={handleSelectAll}
                            className="rounded border-gray-300 text-brand-red-600 focus:ring-brand-red-500"
                          />
                        </th>
                        <th className="py-4 px-6 text-right text-sm font-semibold text-gray-900 dark:text-white">
                          <button 
                            onClick={() => handleSort('id')}
                            className="flex items-center gap-1 hover:text-brand-red-600 transition-colors"
                          >
                            رقم الطلب
                            <ArrowUpDown className="w-4 h-4" />
                          </button>
                        </th>
                        <th className="py-4 px-6 text-right text-sm font-semibold text-gray-900 dark:text-white">
                          <button 
                            onClick={() => handleSort('customer')}
                            className="flex items-center gap-1 hover:text-brand-red-600 transition-colors"
                          >
                            العميل
                            <ArrowUpDown className="w-4 h-4" />
                          </button>
                        </th>
                        <th className="py-4 px-6 text-right text-sm font-semibold text-gray-900 dark:text-white">نوع الطلب</th>
                        <th className="py-4 px-6 text-right text-sm font-semibold text-gray-900 dark:text-white">
                          <button 
                            onClick={() => handleSort('date')}
                            className="flex items-center gap-1 hover:text-brand-red-600 transition-colors"
                          >
                            التاريخ
                            <ArrowUpDown className="w-4 h-4" />
                          </button>
                        </th>
                        <th className="py-4 px-6 text-right text-sm font-semibold text-gray-900 dark:text-white">
                          <button 
                            onClick={() => handleSort('priority')}
                            className="flex items-center gap-1 hover:text-brand-red-600 transition-colors"
                          >
                            الأولوية
                            <ArrowUpDown className="w-4 h-4" />
                          </button>
                        </th>
                        <th className="py-4 px-6 text-right text-sm font-semibold text-gray-900 dark:text-white">
                          <button 
                            onClick={() => handleSort('status')}
                            className="flex items-center gap-1 hover:text-brand-red-600 transition-colors"
                          >
                            الحالة
                            <ArrowUpDown className="w-4 h-4" />
                          </button>
                        </th>
                        <th className="py-4 px-6 text-right text-sm font-semibold text-gray-900 dark:text-white">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {requests.map((request) => {
                        const typeInfo = getRequestTypeInfo(request.request_type);
                        
                        return (
                          <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                            <td className="py-4 px-6">
                              <input
                                type="checkbox"
                                checked={selectedRequests.includes(request.id)}
                                onChange={() => handleSelectRequest(request.id)}
                                className="rounded border-gray-300 text-brand-red-600 focus:ring-brand-red-500"
                              />
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${typeInfo.bg}`}>
                                  <div className={typeInfo.color}>{typeInfo.icon}</div>
                                </div>
                                <span className="font-semibold text-gray-900 dark:text-white">
                                  #{request.id}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {request.customer_name}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400" dir="ltr">
                                  {request.phone}
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-900 dark:text-white">
                                  {request.request_type === 'installation' && 'تركيب'}
                                  {request.request_type === 'repair' && 'إصلاح'}
                                  {request.request_type === 'maintenance' && 'صيانة'}
                                  {request.request_type === 'inquiry' && 'استفسار'}
                                </span>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {request.product_code}
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-900 dark:text-white">
                                  {request.request_date}
                                </span>
                              </div>
                              {request.assigned_to && (
                                <div className="flex items-center gap-2 mt-1">
                                  <User className="w-3 h-3 text-gray-400" />
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {request.assigned_to}
                                  </span>
                                </div>
                              )}
                            </td>
                            <td className="py-4 px-6">
                              {getPriorityBadge(request.priority_level)}
                            </td>
                            <td className="py-4 px-6">
                              <StatusBadge status={request.solution_status} />
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-2">
                                <Link to={`/customer-service/requests/${request.id}`}>
                                  <Button variant="ghost" size="sm" className="text-brand-red-600 hover:bg-brand-red-50 dark:hover:bg-brand-red-900/20">
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </Link>
                                <Link to={`/customer-service/requests/${request.id}/edit`}>
                                  <Button variant="ghost" size="sm">
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </Link>
                                <button className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                                  <MoreVertical className="w-4 h-4 text-gray-400" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  عرض {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalRequests)} من إجمالي {totalRequests} طلب
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => goToPage(currentPage - 1)} 
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl"
                  >
                    <ChevronRight className="w-4 h-4" />
                    <span>السابق</span>
                  </Button>
                  
                  {/* Page numbers */}
                  <div className="hidden md:flex items-center gap-1">
                    {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                      const pageOffset = Math.max(0, Math.min(totalPages - 7, currentPage - 4));
                      const page = i + 1 + pageOffset;
                      
                      return (
                        <button 
                          key={page}
                          className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-medium transition-all duration-200 ${
                            currentPage === page ? 
                            'bg-brand-red-600 text-white shadow-lg' : 
                            'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                          }`}
                          onClick={() => goToPage(page)}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => goToPage(currentPage + 1)} 
                    disabled={currentPage >= totalPages}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl"
                  >
                    <span>التالي</span>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ServiceRequestsPage;