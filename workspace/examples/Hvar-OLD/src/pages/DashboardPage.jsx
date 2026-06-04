import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, StatusBadge } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

// Icons
import { Phone, FileText, Users, Clock, BarChart2 } from 'lucide-react';

/**
 * Dashboard page showing an overview of the system
 */
const DashboardPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pendingRequests: 0,
    totalRequests: 0,
    pendingCalls: 0,
    totalCalls: 0,
    recentRequests: []
  });
  
  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      
      try {
        // For demo, use mock data
        // In a real app, these would be API calls
        // const requestsData = await api.customerService.getRequests({ limit: 5 });
        // const callsData = await api.customerService.getCalls({ limit: 5 });
        
        // Mock data
        const mockData = {
          pendingRequests: 12,
          totalRequests: 47,
          pendingCalls: 8,
          totalCalls: 32,
          recentRequests: [
            {
              id: 1,
              customer_name: 'أحمد محمد',
              phone: '01234567890',
              request_date: '2024-05-20',
              product_code: 'HV-2000',
              solution_status: 'pending',
              priority_level: 3,
            },
            {
              id: 2,
              customer_name: 'سارة أحمد',
              phone: '01098765432',
              request_date: '2024-05-19',
              product_code: 'HV-1500',
              solution_status: 'in progress',
              priority_level: 2,
            },
            {
              id: 3,
              customer_name: 'محمد علي',
              phone: '01112223344',
              request_date: '2024-05-18',
              product_code: 'HV-3000',
              solution_status: 'completed',
              priority_level: 1,
            }
          ]
        };
        
        setStats(mockData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  // Get status color based on priority
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 1: return 'bg-gray-100 dark:bg-gray-800';
      case 2: return 'bg-blue-100 dark:bg-blue-900/30';
      case 3: return 'bg-amber-100 dark:bg-amber-900/30';
      case 4: return 'bg-red-100 dark:bg-red-900/30';
      default: return 'bg-gray-100 dark:bg-gray-800';
    }
  };
  
  // Get priority label
  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 1: return 'منخفضة';
      case 2: return 'متوسطة';
      case 3: return 'عالية';
      case 4: return 'عاجلة';
      default: return 'غير محدد';
    }
  };
  
  return (
    <div>
      {/* Welcome message */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          مرحباً, {user?.name || 'مستخدم'}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          هذا هو لوحة التحكم الرئيسية لنظام إدارة خدمة العملاء. يمكنك متابعة طلبات الخدمة، المكالمات، وتحليلات النظام من هنا.
        </p>
      </div>
      
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Pending service requests */}
        <Card className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">طلبات الخدمة المعلقة</p>
              <h3 className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
                {loading ? '...' : stats.pendingRequests}
                <span className="mr-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                  من {loading ? '...' : stats.totalRequests}
                </span>
              </h3>
            </div>
            <div className="rounded-full p-2 bg-brand-red-100 dark:bg-brand-red-900/30">
              <FileText className="w-6 h-6 text-brand-red-600 dark:text-brand-red-400" />
            </div>
          </div>
          <div className="mt-4">
            <Link to="/customer-service/requests">
              <Button variant="outline" size="sm" className="w-full">
                عرض جميع الطلبات
              </Button>
            </Link>
          </div>
        </Card>
        
        {/* Pending calls */}
        <Card className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">المكالمات المعلقة</p>
              <h3 className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
                {loading ? '...' : stats.pendingCalls}
                <span className="mr-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                  من {loading ? '...' : stats.totalCalls}
                </span>
              </h3>
            </div>
            <div className="rounded-full p-2 bg-brand-blue-100 dark:bg-brand-blue-900/30">
              <Phone className="w-6 h-6 text-brand-blue-600 dark:text-brand-blue-400" />
            </div>
          </div>
          <div className="mt-4">
            <Link to="/call-center">
              <Button variant="outline" size="sm" className="w-full">
                عرض جميع المكالمات
              </Button>
            </Link>
          </div>
        </Card>
        
        {/* Recent customers */}
        <Card className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">العملاء النشطين</p>
              <h3 className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
                {loading ? '...' : '24'}
              </h3>
            </div>
            <div className="rounded-full p-2 bg-green-100 dark:bg-green-900/30">
              <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="mt-4">
            <Link to="/customers">
              <Button variant="outline" size="sm" className="w-full">
                عرض جميع العملاء
              </Button>
            </Link>
          </div>
        </Card>
        
        {/* Analytics */}
        <Card className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">التقارير الجديدة</p>
              <h3 className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
                {loading ? '...' : '7'}
              </h3>
            </div>
            <div className="rounded-full p-2 bg-purple-100 dark:bg-purple-900/30">
              <BarChart2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="mt-4">
            <Link to="/analytics">
              <Button variant="outline" size="sm" className="w-full">
                عرض التقارير
              </Button>
            </Link>
          </div>
        </Card>
      </div>
      
      {/* Recent service requests */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">أحدث طلبات الخدمة</h2>
          <Link to="/customer-service/requests">
            <Button variant="ghost" size="sm">
              عرض الكل
            </Button>
          </Link>
        </div>
        
        <Card>
          {loading ? (
            <div className="p-6 text-center">
              <div className="w-8 h-8 border-4 border-t-brand-red-600 border-gray-200 rounded-full animate-spin mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">جاري تحميل البيانات...</p>
            </div>
          ) : stats.recentRequests.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500 dark:text-gray-400">لا توجد طلبات خدمة حالياً</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/50 text-right">
                    <th className="py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">رقم الطلب</th>
                    <th className="py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">العميل</th>
                    <th className="py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">رقم الهاتف</th>
                    <th className="py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">التاريخ</th>
                    <th className="py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">الأولوية</th>
                    <th className="py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">الحالة</th>
                    <th className="py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {stats.recentRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-4 px-4 text-sm font-medium text-gray-900 dark:text-white">
                        #{request.id}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-500 dark:text-gray-400">
                        {request.customer_name}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-500 dark:text-gray-400">
                        {request.phone}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-500 dark:text-gray-400">
                        {request.request_date}
                      </td>
                      <td className="py-4 px-4">
                        <div className={`inline-flex px-2 py-1 rounded-full text-xs ${getPriorityColor(request.priority_level)}`}>
                          {getPriorityLabel(request.priority_level)}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <StatusBadge status={request.solution_status} />
                      </td>
                      <td className="py-4 px-4 text-sm">
                        <Link to={`/customer-service/requests/${request.id}`}>
                          <Button variant="ghost" size="xs">
                            عرض
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
      
      {/* Quick actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">إجراءات سريعة</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <Card className="p-4 hover:shadow-md transition-shadow text-center">
            <Link to="/customer-service/requests/new" className="block">
              <div className="rounded-full bg-brand-red-100 dark:bg-brand-red-900/30 p-3 inline-flex mx-auto mb-3">
                <FileText className="w-6 h-6 text-brand-red-600 dark:text-brand-red-400" />
              </div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">إنشاء طلب خدمة</h3>
            </Link>
          </Card>
          
          <Card className="p-4 hover:shadow-md transition-shadow text-center">
            <Link to="/call-center/new" className="block">
              <div className="rounded-full bg-brand-blue-100 dark:bg-brand-blue-900/30 p-3 inline-flex mx-auto mb-3">
                <Phone className="w-6 h-6 text-brand-blue-600 dark:text-brand-blue-400" />
              </div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">تسجيل مكالمة</h3>
            </Link>
          </Card>
          
          <Card className="p-4 hover:shadow-md transition-shadow text-center">
            <Link to="/customers/new" className="block">
              <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-3 inline-flex mx-auto mb-3">
                <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">عميل جديد</h3>
            </Link>
          </Card>
          
          <Card className="p-4 hover:shadow-md transition-shadow text-center">
            <Link to="/customer-service/call-list" className="block">
              <div className="rounded-full bg-amber-100 dark:bg-amber-900/30 p-3 inline-flex mx-auto mb-3">
                <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">قائمة الاتصال</h3>
            </Link>
          </Card>
          
          <Card className="p-4 hover:shadow-md transition-shadow text-center">
            <Link to="/analytics/reports" className="block">
              <div className="rounded-full bg-purple-100 dark:bg-purple-900/30 p-3 inline-flex mx-auto mb-3">
                <BarChart2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">تقرير جديد</h3>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage; 