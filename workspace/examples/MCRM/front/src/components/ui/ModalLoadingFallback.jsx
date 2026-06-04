/**
 * ModalLoadingFallback
 *
 * A simple loading fallback component for lazy-loaded modals.
 * Displays a centered spinner with minimal visual footprint.
 */

import { Loader } from 'lucide-react';

const ModalLoadingFallback = ({ message = 'جاري التحميل...' }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 flex flex-col items-center gap-3">
        <Loader className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
        <p className="text-sm text-gray-600 dark:text-gray-300">{message}</p>
      </div>
    </div>
  );
};

export default ModalLoadingFallback;
