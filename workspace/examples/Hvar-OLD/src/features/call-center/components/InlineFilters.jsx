import React from 'react';

import { Filter, Search } from 'lucide-react';

import { Input } from '../../../components/ui';
import { cn } from '../../../utils/tailwind';

const InlineFilters = ({
  attemptFilters,
  attemptFilter,
  availabilityFilter,
  searchTerm,
  onSearch,
  onAttemptChange,
  onAvailabilityChange
}) => {
  return (
    <div className="w-full bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-4 space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-md">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="ابحث بالطلب، العميل، أو الهاتف"
            className="w-full pr-10"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Filter className="h-4 w-4 text-brand-red-500" />
          فلترة سريعة للمحاولات والحالة
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {attemptFilters.map((filter) => {
          const isActive = filter.key === attemptFilter;
          return (
            <button
              key={filter.key}
              type="button"
              onClick={() => onAttemptChange(filter.key)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200',
                'hover:shadow-sm hover:scale-[1.02] active:scale-[0.98]',
                isActive
                  ? 'border-brand-red-500 bg-brand-red-50 text-brand-red-700 dark:bg-brand-red-900/30 dark:text-brand-red-200'
                  : 'border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'
              )}
            >
              {filter.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => onAvailabilityChange(availabilityFilter === 'available' ? 'all' : 'available')}
          className={cn(
            'rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200',
            'hover:shadow-sm hover:scale-[1.02] active:scale-[0.98]',
            availabilityFilter === 'available'
              ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-200'
              : 'border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'
          )}
        >
          جاهزة الآن
        </button>
        <button
          type="button"
          onClick={() => onAvailabilityChange(availabilityFilter === 'holding' ? 'all' : 'holding')}
          className={cn(
            'rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200',
            'hover:shadow-sm hover:scale-[1.02] active:scale-[0.98]',
            availabilityFilter === 'holding'
              ? 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200'
              : 'border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'
          )}
        >
          وقت الانتظار
        </button>
      </div>
    </div>
  );
};

export default InlineFilters;
