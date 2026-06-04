import React from 'react';

import { Badge } from '../../../components/ui';
import { cn } from '../../../utils/tailwind';

const StateTabs = ({ tabs, activeTab, counts, onChange }) => {
  return (
    <div className="w-full bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm px-4 py-3">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChange(tab.key)}
              className={cn(
                'flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200',
                'hover:shadow-sm hover:scale-[1.02] active:scale-[0.98]',
                isActive
                  ? 'border-brand-red-500 bg-brand-red-50 text-brand-red-700 dark:bg-brand-red-900/30 dark:text-brand-red-200'
                  : 'border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300'
              )}
            >
              <span>{tab.label}</span>
              <Badge
                size="xs"
                variant={isActive ? 'primary' : 'default'}
                className={cn(isActive ? 'bg-brand-red-100 text-brand-red-700' : '')}
              >
                {counts[tab.key] ?? 0}
              </Badge>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default StateTabs;
