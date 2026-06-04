import React from 'react';

import { Phone, Timer } from 'lucide-react';

import { Badge, Button } from '../../../components/ui';
import { cn } from '../../../utils/tailwind';

const statusLabels = {
  new: { label: 'جديد', variant: 'primary' },
  scheduled: { label: 'مجدول', variant: 'warning' },
  confirmed: { label: 'مؤكد', variant: 'success' },
  completed: { label: 'مكتمل', variant: 'secondary' },
  canceled: { label: 'ملغي', variant: 'danger' }
};

const getAttemptDots = (count) => {
  return Array.from({ length: 3 }).map((_, index) => index < count);
};

const OrderRow = ({ order, onCall }) => {
  const status = statusLabels[order.status] || statusLabels.new;
  const dots = getAttemptDots(order.attemptCount || 0);
  const isHolding = order.availability === 'holding';

  return (
    <div className="grid grid-cols-12 gap-2 px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors">
      <div className="col-span-3 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {order.orderNumber}
          </span>
          <Badge variant={status.variant} size="xs">
            {status.label}
          </Badge>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {order.branch}
        </div>
      </div>

      <div className="col-span-3 space-y-2">
        <div className="text-sm font-semibold text-gray-900 dark:text-white">
          {order.customer?.name}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400" dir="ltr">
          {order.customer?.phone}
        </div>
      </div>

      <div className="col-span-2 flex flex-col items-center justify-center gap-2">
        <div className="flex items-center gap-1">
          {dots.map((isFilled, index) => (
            <span
              key={`${order.id}-dot-${index}`}
              className={cn(
                'h-2.5 w-2.5 rounded-full',
                isFilled ? 'bg-brand-red-500' : 'bg-gray-200 dark:bg-gray-700'
              )}
            />
          ))}
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          محاولة {order.attemptCount} من 3
        </span>
      </div>

      <div className="col-span-2 flex flex-col items-center justify-center gap-1">
        <span className="text-sm font-semibold text-gray-900 dark:text-white">
          {order.amount.toLocaleString('ar-EG')} ج.م
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {order.itemsCount} عنصر
        </span>
      </div>

      <div className="col-span-2 flex flex-col items-end justify-center gap-2">
        {isHolding && (
          <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
            <Timer className="h-3.5 w-3.5" />
            متاح قريباً
          </div>
        )}
        <Button
          size="sm"
          variant={isHolding ? 'outline' : 'primary'}
          onClick={() => onCall(order.id)}
          disabled={isHolding}
          className={cn(isHolding ? 'opacity-70' : '')}
        >
          <Phone className="ml-2 h-4 w-4" />
          اتصال
        </Button>
      </div>
    </div>
  );
};

export default OrderRow;
