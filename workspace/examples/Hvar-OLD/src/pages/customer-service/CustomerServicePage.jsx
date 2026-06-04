import React from 'react';

import { Calendar, RefreshCw, ShieldCheck, Timer, TrendingUp } from 'lucide-react';

import { Button, Card } from '../../components/ui';
import {
  CallSessionFab,
  InlineFilters,
  OrdersTable,
  QueueStatusBar,
  StateTabs,
  useCallCenterQueue
} from '../../features/call-center';

/**
 * Call Center Queue Page - Demo data only
 */
const CustomerServicePage = () => {
  const {
    activeOrder,
    activeTab,
    attemptFilter,
    availabilityFilter,
    dateChipCounts,
    filteredOrders,
    searchTerm,
    selectedDate,
    stats,
    tabCounts,
    statusTabs,
    attemptFilters,
    setActiveTab,
    setAttemptFilter,
    setAvailabilityFilter,
    setSearchTerm,
    setSelectedDate,
    selectOrder,
    closeCallSession,
    applyCallAction,
    updateOrderItems
  } = useCallCenterQueue();

  return (
    <div className="w-full space-y-6">
      <div className="w-full bg-white/90 dark:bg-gray-900/80 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs text-brand-red-600 dark:text-brand-red-300 mb-2">
              نظام التحقق عالي السرعة
            </p>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              مركز الاتصال - <span className="bg-gradient-to-l from-brand-red-600 to-brand-blue-500 bg-clip-text text-transparent">تحقق الطلبات</span>
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              لوحة عمل إنتاجية لإدارة مكالمات طلبات الدفع عند الاستلام
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="px-4 py-2">
              <RefreshCw className="w-4 h-4 ml-2" />
              تحديث
            </Button>
            <Button className="px-4 py-2">
              <Calendar className="w-4 h-4 ml-2" />
              مزامنة اليوم
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5 bg-gradient-to-br from-white via-white to-brand-red-50 dark:from-gray-900 dark:via-gray-900 dark:to-brand-red-900/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">إجمالي اليوم</p>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.total}</h3>
            </div>
            <div className="rounded-full bg-brand-red-100 p-2 text-brand-red-600 dark:bg-brand-red-900/40 dark:text-brand-red-300">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
        </Card>
        <Card className="p-5 bg-gradient-to-br from-white via-white to-emerald-50 dark:from-gray-900 dark:via-gray-900 dark:to-emerald-900/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">جاهزة الآن</p>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.ready}</h3>
            </div>
            <div className="rounded-full bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
        </Card>
        <Card className="p-5 bg-gradient-to-br from-white via-white to-amber-50 dark:from-gray-900 dark:via-gray-900 dark:to-amber-900/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">قيد العمل</p>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.pending}</h3>
            </div>
            <div className="rounded-full bg-amber-100 p-2 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300">
              <Timer className="h-5 w-5" />
            </div>
          </div>
        </Card>
        <Card className="p-5 bg-gradient-to-br from-white via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-blue-900/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">متوسط المحاولات</p>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.avgAttempts}</h3>
            </div>
            <div className="rounded-full bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
        </Card>
      </div>

      <QueueStatusBar chips={dateChipCounts} selectedDate={selectedDate} onSelect={setSelectedDate} />
      <StateTabs tabs={statusTabs} activeTab={activeTab} counts={tabCounts} onChange={setActiveTab} />
      <InlineFilters
        attemptFilters={attemptFilters}
        attemptFilter={attemptFilter}
        availabilityFilter={availabilityFilter}
        searchTerm={searchTerm}
        onSearch={setSearchTerm}
        onAttemptChange={setAttemptFilter}
        onAvailabilityChange={setAvailabilityFilter}
      />
      <OrdersTable orders={filteredOrders} onCall={selectOrder} />

      <CallSessionFab
        order={activeOrder}
        onClose={closeCallSession}
        onAction={applyCallAction}
        onUpdateItems={updateOrderItems}
      />
    </div>
  );
};

export default CustomerServicePage;