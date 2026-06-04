import React from 'react';
import { Card, Button } from '../../components/ui';
import { BarChart2, PieChart, LineChart, TrendingUp } from 'lucide-react';

/**
 * Analytics Page - Placeholder for analytics functionality
 */
const AnalyticsPage = () => {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          التحليلات والإحصائيات
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          تحليلات وإحصائيات خدمة العملاء والمبيعات
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">طلبات الخدمة (الشهر الحالي)</p>
              <h3 className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                124
              </h3>
            </div>
            <div className="rounded-full p-2 bg-brand-red-100 dark:bg-brand-red-900/30">
              <TrendingUp className="w-5 h-5 text-brand-red-600 dark:text-brand-red-400" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">معدل إكمال الطلبات</p>
              <h3 className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                78%
              </h3>
            </div>
            <div className="rounded-full p-2 bg-green-100 dark:bg-green-900/30">
              <PieChart className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">متوسط وقت الاستجابة</p>
              <h3 className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                1.4 يوم
              </h3>
            </div>
            <div className="rounded-full p-2 bg-blue-100 dark:bg-blue-900/30">
              <LineChart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">رضا العملاء</p>
              <h3 className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                4.7/5
              </h3>
            </div>
            <div className="rounded-full p-2 bg-amber-100 dark:bg-amber-900/30">
              <BarChart2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            طلبات الخدمة حسب النوع
          </h2>
          <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="text-center">
              <BarChart2 className="w-12 h-12 text-gray-400 mx-auto" />
              <p className="mt-2 text-gray-500 dark:text-gray-400">
                الرسم البياني قيد التطوير
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            طلبات الخدمة حسب المنتج
          </h2>
          <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="text-center">
              <PieChart className="w-12 h-12 text-gray-400 mx-auto" />
              <p className="mt-2 text-gray-500 dark:text-gray-400">
                الرسم البياني قيد التطوير
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">صفحة التحليلات قيد التطوير</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-lg mx-auto">
            هذه الصفحة قيد التطوير حالياً. سيتم إضافة المزيد من الرسوم البيانية والتقارير التفصيلية قريباً.
          </p>
          <Button>العودة إلى لوحة التحكم</Button>
        </div>
      </Card>
    </div>
  );
};

export default AnalyticsPage; 