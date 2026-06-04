import React from 'react';

import OrderRow from './OrderRow';

const OrdersTable = ({ orders, onCall }) => {
  if (!orders.length) {
    return (
      <div className="w-full bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-10 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          لا توجد طلبات مطابقة لهذا اليوم. جرّب تغيير الفلاتر.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
      <div className="grid grid-cols-12 gap-2 border-b border-gray-100 dark:border-gray-800 px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400">
        <div className="col-span-3">الطلب</div>
        <div className="col-span-3">العميل</div>
        <div className="col-span-2 text-center">المحاولات</div>
        <div className="col-span-2 text-center">المبلغ / العناصر</div>
        <div className="col-span-2 text-left">الإجراء</div>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {orders.map((order) => (
          <OrderRow key={order.id} order={order} onCall={onCall} />
        ))}
      </div>
    </div>
  );
};

export default OrdersTable;
