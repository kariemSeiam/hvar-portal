import React, { useEffect, useRef } from 'react';
import { FileText, X } from 'lucide-react';

/**
 * OrderNotesModal Component - Notes Display
 * 
 * Shows shipping details/notes in a beautiful modal when notes chip is clicked
 * Following OrderItemsModal pattern with perfect design
 * 
 * Features:
 * - Clean modal design with proper spacing
 * - FileText icon with gray background
 * - Full notes text display
 * - Perfect spacing and dark theme support
 */
const OrderNotesModal = ({ orderId, notes, isOpen, onClose, position }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  if (!isOpen || !notes) return null;

  const isAbove = position?.direction === 'above';
  const modalWidth = 320; // min-w-[320px]
  const leftPosition = position?.x ? `${position.x - modalWidth / 2}px` : '50%';
  const topPosition = position?.y ? `${position.y}px` : '50%';
  const transform = position?.y 
    ? (isAbove ? 'translateY(-100%) translateY(-8px)' : 'translateY(8px)')
    : 'translate(-50%, -50%)';

  return (
    <div
      ref={modalRef}
      className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-3 max-w-md min-w-[320px]"
      style={{
        top: topPosition,
        left: leftPosition,
        transform: transform,
        maxWidth: '90vw'
      }}
      dir="rtl"
    >
      {/* Arrow */}
      {position?.y && (
        <div 
          className={`absolute left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white dark:bg-gray-800 border-l border-t border-gray-200 dark:border-gray-700 rotate-45 ${
            isAbove ? '-bottom-1' : '-top-1'
          }`}
        ></div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center flex-shrink-0 shadow-sm">
            <FileText className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
          </div>
          <h3 className="text-xs font-medium text-gray-900 dark:text-gray-100 font-cairo">
            ملاحظات الطلب
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
          aria-label="إغلاق"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Notes Content */}
      <div className="space-y-2">
        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-600">
          <p className="text-xs text-gray-900 dark:text-gray-100 font-cairo leading-relaxed whitespace-pre-wrap">
            {notes}
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrderNotesModal;
