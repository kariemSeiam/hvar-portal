import React from 'react';

import { cn } from '../../../utils/tailwind';

const QueueStatusBar = ({ chips, selectedDate, onSelect }) => {
  return (
    <div className="w-full bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-4">
      <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
        {chips.map((chip) => {
          const isActive = chip.dateKey === selectedDate;
          return (
            <button
              key={chip.dateKey}
              type="button"
              onClick={() => onSelect(chip.dateKey)}
              className={cn(
                'min-w-[130px] flex flex-col items-start gap-1 rounded-lg border px-4 py-3 transition-all duration-200',
                'hover:shadow-md hover:scale-[1.02] active:scale-[0.98]',
                isActive
                  ? 'border-brand-red-400 bg-brand-red-50 text-brand-red-700 dark:bg-brand-red-900/30 dark:text-brand-red-200'
                  : 'border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200'
              )}
            >
              <span className="text-xs font-semibold">{chip.label}</span>
              <span className="text-sm font-bold">{chip.dateLabel}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {chip.count} طلب
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QueueStatusBar;
