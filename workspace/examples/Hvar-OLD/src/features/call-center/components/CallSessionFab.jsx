import React, { useEffect, useMemo, useState } from 'react';

import { X } from 'lucide-react';

import { Button, Card } from '../../../components/ui';
import { cn } from '../../../utils/tailwind';

const CallSessionFab = ({ order, onClose, onAction, onUpdateItems }) => {
  const [localItems, setLocalItems] = useState(order?.items || []);

  useEffect(() => {
    setLocalItems(order?.items || []);
  }, [order]);

  const total = useMemo(() => {
    return localItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [localItems]);

  if (!order) return null;

  const customer = order.customer;

  const updateQuantity = (sku, delta) => {
    const nextItems = localItems.map((item) => {
      if (item.sku !== sku) return item;
      return { ...item, quantity: Math.max(1, item.quantity + delta) };
    });
    setLocalItems(nextItems);
    onUpdateItems(order.id, nextItems);
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-xl bg-white dark:bg-gray-900 h-full shadow-2xl flex flex-col">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-6 py-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">جلسة الاتصال</p>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {order.orderNumber}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide p-6 space-y-5">
          <Card className="p-4 space-y-2 bg-gradient-to-br from-white via-white to-brand-red-50 dark:from-gray-900 dark:via-gray-900 dark:to-brand-red-900/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{customer?.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400" dir="ltr">
                  {customer?.phone} {customer?.phoneSecondary && `• ${customer?.phoneSecondary}`}
                </p>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {customer?.governorate} - {customer?.city}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{customer?.address}</p>
            <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-300">
              <span>طلبات: {customer?.ordersHistory?.length || 0}</span>
              <span>خدمات: {customer?.servicesHistory?.length || 0}</span>
            </div>
          </Card>

          <Card className="p-4 space-y-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">تفاصيل الطلب</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700 dark:text-gray-300">الفرع</span>
              <span className="font-semibold text-gray-900 dark:text-white">{order.branch}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700 dark:text-gray-300">المبلغ</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {order.amount.toLocaleString('ar-EG')} ج.م
              </span>
            </div>
          </Card>

          <Card className="p-4 space-y-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">وصف الطلب</p>
            <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-line">
              {order.description}
            </p>
          </Card>

          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 dark:text-gray-400">عناصر الطلب</p>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                الإجمالي: {total.toLocaleString('ar-EG')} ج.م
              </span>
            </div>
            <div className="space-y-2">
              {localItems.map((item) => (
                <div
                  key={item.sku}
                  className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-800 px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{item.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">SKU: {item.sku}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.sku, -1)}
                      className="h-7 w-7 rounded-full border border-gray-200 text-sm text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      -
                    </button>
                    <span className="min-w-[24px] text-center font-semibold text-gray-900 dark:text-white">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.sku, 1)}
                      className="h-7 w-7 rounded-full border border-gray-200 text-sm text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-800 p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur">
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => {
                onAction(order.id, 'confirm');
                onClose();
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              تأكيد
            </Button>
            <Button
              onClick={() => {
                onAction(order.id, 'no_answer');
                onClose();
              }}
              className="bg-amber-500 hover:bg-amber-600"
            >
              لا يوجد رد
            </Button>
            <Button
              onClick={() => {
                onAction(order.id, 'schedule');
                onClose();
              }}
              variant="outline"
              className={cn('border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300')}
            >
              جدولة
            </Button>
            <Button
              onClick={() => {
                onAction(order.id, 'cancel');
                onClose();
              }}
              variant="outline"
              className={cn('border-red-200 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-300')}
            >
              إلغاء
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallSessionFab;
