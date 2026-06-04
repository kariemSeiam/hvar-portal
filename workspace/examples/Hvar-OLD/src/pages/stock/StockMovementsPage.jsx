import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight,
  ArrowLeft,
  Package,
  Truck,
  RotateCcw,
  Settings,
  Download,
  Filter,
  Calendar,
  Search,
  MapPin,
  TrendingUp,
  TrendingDown,
  Activity,
  FileText,
  Clock,
  User,
  Plus,
  Minus,
  X,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { Card, Button, Input, Badge, Spinner } from '../../components/ui';

const StockMovementsPage = () => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [movementSummary, setMovementSummary] = useState({});
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // API Base URL
  const API_BASE = 'http://192.168.1.202:5000/api';

  const fetchMovements = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 20,
        ...(searchTerm && { search: searchTerm }),
        ...(selectedType && { movement_type: selectedType }),
        ...(selectedLocation && { location: selectedLocation }),
        ...(selectedDate && { date_from: selectedDate })
      });

      const response = await fetch(`${API_BASE}/products/movements?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setMovements(data.data || []);
        setTotalPages(Math.ceil((data.pagination?.total || 0) / 20));
      } else {
        console.error('Error fetching movements:', data.error);
        setError('فشل في تحميل حركات المخزون');
      }
    } catch (error) {
      console.error('Error fetching movements:', error);
      setError('فشل في تحميل حركات المخزون');
    } finally {
      setLoading(false);
    }
  };

  const fetchMovementSummary = async () => {
    try {
      const response = await fetch(`${API_BASE}/products/movements/summary`);
      const data = await response.json();
      if (data.success) {
        setMovementSummary(data.data);
      } else {
        console.error('Error fetching movement summary:', data.error);
      }
    } catch (error) {
      console.error('Error fetching movement summary:', error);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    setError(null);
    try {
      await Promise.all([
        fetchMovements(),
        fetchMovementSummary()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await refreshData();
    };

    loadData();
  }, []);

  useEffect(() => {
    fetchMovements();
  }, [currentPage, searchTerm, selectedType, selectedLocation, selectedDate]);

  const getMovementTypeIcon = (type) => {
    switch (type) {
      case 'purchase':
      case 'return':
        return <Plus className="h-4 w-4" />;
      case 'service':
      case 'allocation':
        return <Minus className="h-4 w-4" />;
      case 'transfer':
        return <ArrowRight className="h-4 w-4" />;
      case 'adjustment':
        return <Settings className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getMovementTypeColor = (type) => {
    switch (type) {
      case 'purchase':
      case 'return':
        return 'green';
      case 'service':
      case 'allocation':
        return 'red';
      case 'transfer':
        return 'blue';
      case 'adjustment':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  const getMovementTypeLabel = (type) => {
    const labels = {
      'purchase': 'شراء',
      'return': 'إرجاع',
      'service': 'خدمة',
      'allocation': 'تخصيص',
      'transfer': 'نقل',
      'adjustment': 'تعديل'
    };
    return labels[type] || type;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedType('');
    setSelectedLocation('');
    setSelectedDate('');
    setCurrentPage(1);
  };

  // Summary Cards
  const SummaryCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">إجمالي الحركات</p>
              <p className="text-3xl font-bold text-blue-800">{movementSummary.total_movements || 0}</p>
            </div>
            <Activity className="h-8 w-8 text-blue-600" />
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">الوارد</p>
              <p className="text-3xl font-bold text-green-800">{movementSummary.inbound || 0}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">الصادر</p>
              <p className="text-3xl font-bold text-red-800">{movementSummary.outbound || 0}</p>
            </div>
            <TrendingDown className="h-8 w-8 text-red-600" />
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">حركات اليوم</p>
              <p className="text-3xl font-bold text-purple-800">{movementSummary.today_movements || 0}</p>
            </div>
            <Clock className="h-8 w-8 text-purple-600" />
          </div>
        </Card>
      </motion.div>
    </div>
  );

  // Search and Filter Bar
  const SearchAndFilterBar = () => (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="البحث في الحركات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      
      <div className="flex space-x-2">
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center space-x-2"
        >
          <Filter className="h-4 w-4" />
          <span>فلترة</span>
        </Button>
        
        <Button
          variant="outline"
          onClick={clearFilters}
          className="flex items-center space-x-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>إعادة تعيين</span>
        </Button>
        
        <Button
          variant="outline"
          onClick={refreshData}
          className="flex items-center space-x-2"
        >
          <Download className="h-4 w-4" />
          <span>تصدير</span>
        </Button>
      </div>
    </div>
  );

  // Filter Panel
  const FilterPanel = () => (
    <AnimatePresence>
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-6"
        >
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نوع الحركة
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">جميع الأنواع</option>
                  <option value="purchase">شراء</option>
                  <option value="return">إرجاع</option>
                  <option value="service">خدمة</option>
                  <option value="allocation">تخصيص</option>
                  <option value="transfer">نقل</option>
                  <option value="adjustment">تعديل</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الموقع
                </label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">جميع المواقع</option>
                  <option value="المستودع الرئيسي">المستودع الرئيسي</option>
                  <option value="مخزون الفنيين">مخزون الفنيين</option>
                  <option value="موقع العميل">موقع العميل</option>
                  <option value="المخزون التالف">المخزون التالف</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  التاريخ من
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  التاريخ إلى
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Movements Table
  const MovementsTable = () => (
    <Card className="overflow-hidden">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="mr-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="mr-auto text-red-400 hover:text-red-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {movements.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المنتج
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  نوع الحركة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الموقع
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الكمية
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المرجع
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  التاريخ
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {movements.map((movement) => (
                <motion.tr
                  key={movement.movement_id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Package className="h-8 w-8 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {movement.product_name}
                        </div>
                        <div className="text-sm text-gray-500">{movement.sku}</div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge
                      variant={getMovementTypeColor(movement.movement_type)}
                      className="flex items-center space-x-1"
                    >
                      {getMovementTypeIcon(movement.movement_type)}
                      <span>{getMovementTypeLabel(movement.movement_type)}</span>
                    </Badge>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2 text-sm text-gray-900">
                      {movement.location_from && (
                        <>
                          <span>{movement.location_from}</span>
                          <ArrowLeft className="h-4 w-4 text-gray-400" />
                        </>
                      )}
                      {movement.location_to && (
                        <span className="font-medium">{movement.location_to}</span>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${
                      ['purchase', 'return'].includes(movement.movement_type) 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {['purchase', 'return'].includes(movement.movement_type) ? '+' : '-'}
                      {movement.quantity}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="font-medium">{movement.reference_id}</div>
                      <div className="text-gray-500">{movement.reference_type}</div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(movement.created_at)}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Button variant="outline" size="sm">
                      <FileText className="h-4 w-4" />
                    </Button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8">
          <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد حركات</h3>
          <p className="text-gray-500">لم يتم العثور على حركات مخزون تطابق المعايير المحددة</p>
        </div>
      )}
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">حركات المخزون</h1>
          <p className="mt-2 text-gray-600">
            تتبع جميع حركات وتغييرات المخزون في الوقت الفعلي
          </p>
        </div>

        {/* Summary Cards */}
        <SummaryCards />

        {/* Search and Filter Bar */}
        <SearchAndFilterBar />

        {/* Filter Panel */}
        <FilterPanel />

        {/* Movements Table */}
        <MovementsTable />
      </div>
    </div>
  );
};

export default StockMovementsPage; 