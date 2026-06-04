import React from 'react';

/**
 * StatusBadge - Component for displaying service request statuses with appropriate styling
 */
const StatusBadge = ({ status }) => {
  // Define styling based on status
  const getStatusStyles = () => {
    switch (status) {
      case 'pending':
        return {
          bg: 'bg-amber-100 dark:bg-amber-900/30',
          text: 'text-amber-800 dark:text-amber-300',
          label: 'معلّق'
        };
      case 'in_progress':
      case 'in progress':
        return {
          bg: 'bg-blue-100 dark:bg-blue-900/30',
          text: 'text-blue-800 dark:text-blue-300',
          label: 'قيد التنفيذ'
        };
      case 'completed':
        return {
          bg: 'bg-green-100 dark:bg-green-900/30',
          text: 'text-green-800 dark:text-green-300',
          label: 'مكتمل'
        };
      case 'cancelled':
        return {
          bg: 'bg-red-100 dark:bg-red-900/30',
          text: 'text-red-800 dark:text-red-300',
          label: 'ملغي'
        };
      case 'onhold':
      case 'on_hold':
        return {
          bg: 'bg-purple-100 dark:bg-purple-900/30',
          text: 'text-purple-800 dark:text-purple-300',
          label: 'متوقف'
        };
      default:
        return {
          bg: 'bg-gray-100 dark:bg-gray-800',
          text: 'text-gray-800 dark:text-gray-300',
          label: status
        };
    }
  };

  const styles = getStatusStyles();

  return (
    <span 
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles.bg} ${styles.text}`}
      dir='ltr'>
      {styles.label}
    </span>
  );
};

export default StatusBadge; 