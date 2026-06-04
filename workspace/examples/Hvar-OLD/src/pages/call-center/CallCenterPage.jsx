import React from 'react';
import { Card, Button } from '../../components/ui';
import { Phone, Users, Clock, Calendar } from 'lucide-react';

/**
 * Call Center Page - Placeholder for call center functionality
 */
const CallCenterPage = () => {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          مركز الاتصال
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          إدارة المكالمات وقائمة الانتظار وجدولة المكالمات
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">قائمة الانتظار</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">إدارة المكالمات في قائمة الانتظار</p>
            </div>
            <div className="rounded-full p-2 bg-brand-blue-100 dark:bg-brand-blue-900/30">
              <Phone className="w-6 h-6 text-brand-blue-600 dark:text-brand-blue-400" />
            </div>
          </div>
          <Button variant="outline" className="w-full">عرض قائمة الانتظار</Button>
        </Card>

        <Card className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">المكالمات المجدولة</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">عرض وإدارة المكالمات المجدولة</p>
            </div>
            <div className="rounded-full p-2 bg-green-100 dark:bg-green-900/30">
              <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <Button variant="outline" className="w-full">عرض المكالمات المجدولة</Button>
        </Card>

        <Card className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">سجل المكالمات</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">عرض سجل المكالمات السابقة</p>
            </div>
            <div className="rounded-full p-2 bg-amber-100 dark:bg-amber-900/30">
              <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <Button variant="outline" className="w-full">عرض سجل المكالمات</Button>
        </Card>
      </div>

      <div className="mt-8">
        <Card className="p-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">مركز الاتصال قيد التطوير</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-lg mx-auto">
              هذه الصفحة قيد التطوير حالياً. سيتم إضافة وظائف إدارة المكالمات وقائمة الانتظار والمكالمات المجدولة قريباً.
            </p>
            <Button>العودة إلى لوحة التحكم</Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CallCenterPage; 