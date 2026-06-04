import React from 'react';
import { cn, getBadgeClasses } from '../../utils/tailwind';

/**
 * Badge component using Tailwind classes directly
 * 
 * @param {Object} props - Badge props
 * @param {React.ReactNode} props.children - Badge content
 * @param {string} [props.variant='default'] - Badge variant (default, primary, secondary, success, warning, danger)
 * @param {string} [props.size='md'] - Badge size (xs, sm, md, lg)
 * @param {string} [props.className] - Additional classes to add
 */
const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  ...props
}) => {
  return (
    <span
      className={cn(
        getBadgeClasses(variant, size),
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

/**
 * StatusBadge - A specialized badge for displaying status
 */
export const StatusBadge = ({ status, ...props }) => {
  const getVariantFromStatus = () => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'completed':
      case 'approved':
      case 'success':
        return 'success';
      case 'pending':
      case 'in progress':
      case 'waiting':
      case 'warning':
        return 'warning';
      case 'cancelled':
      case 'rejected':
      case 'failed':
      case 'error':
        return 'danger';
      case 'new':
      case 'open':
        return 'primary';
      case 'closed':
      case 'done':
        return 'secondary';
      default:
        return 'default';
    }
  };
  
  const arabicStatus = {
    'active': 'نشط',
    'completed': 'مكتمل',
    'approved': 'معتمد',
    'success': 'ناجح',
    'pending': 'قيد الانتظار',
    'in progress': 'قيد التنفيذ',
    'waiting': 'في الانتظار',
    'warning': 'تحذير',
    'cancelled': 'ملغي',
    'rejected': 'مرفوض',
    'failed': 'فشل',
    'error': 'خطأ',
    'new': 'جديد',
    'open': 'مفتوح',
    'closed': 'مغلق',
    'done': 'تم'
  };
  
  const displayText = arabicStatus[status?.toLowerCase()] || status;
  
  return (
    <Badge 
      variant={getVariantFromStatus()} 
      {...props}
    >
      {displayText}
    </Badge>
  );
};

export default Badge; 