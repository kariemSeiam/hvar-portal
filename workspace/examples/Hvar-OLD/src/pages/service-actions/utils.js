// Helper function for formatting dates
export const formatDate = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Helper function for status colors
export const getStatusColor = (status) => {
  const statusMap = {
    requested: 'blue',
    in_progress: 'amber',
    hub_confirmed: 'green',
    awaiting_review: 'purple',
    completed: 'green',
    cancelled: 'red'
  };
  return statusMap[status] || 'gray';
};

// Helper function for priority colors
export const getPriorityColor = (priority) => {
  const priorityMap = {
    low: 'green',
    medium: 'blue',
    high: 'amber',
    urgent: 'red'
  };
  return priorityMap[priority] || 'gray';
};

// Helper function for action type labels
export const getActionTypeLabel = (actionType) => {
  const actionTypes = [
    { value: 'maintenance', label: 'صيانة' },
    { value: 'service', label: 'خدمة' },
    { value: 'return_refund', label: 'إرجاع/استرداد' },
    { value: 'exchange', label: 'تبديل' },
    { value: 'premium_service', label: 'خدمة متميزة' },
    { value: 'delivery_support', label: 'دعم التوصيل' }
  ];
  return actionTypes.find(t => t.value === actionType)?.label || actionType;
};

// Helper function for truncating text
export const truncateText = (text, maxLength = 60) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Helper function for status labels
export const getStatusLabel = (status) => {
  const statusLabels = {
    requested: 'مطلوب',
    in_progress: 'قيد التنفيذ',
    hub_confirmed: 'مؤكد استلامه',
    awaiting_review: 'في انتظار المراجعة',
    completed: 'مكتمل',
    cancelled: 'ملغي'
  };
  return statusLabels[status] || status;
};

// Helper function for priority labels
export const getPriorityLabel = (priority) => {
  const priorityLabels = {
    low: 'منخفضة',
    medium: 'متوسطة',
    high: 'عالية',
    urgent: 'عاجلة'
  };
  return priorityLabels[priority] || priority;
};

// Enhanced customer segment handling based on server logic
export const getCustomerSegmentConfig = (segment) => {
  const segmentConfigs = {
    'vip': {
      label: 'VIP',
      icon: 'Crown',
      className: 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 dark:from-amber-900/30 dark:to-yellow-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-700',
      description: 'عملاء VIP مع قيمة عالية أو طلبات كثيرة'
    },
    'regular': {
      label: 'منتظم',
      icon: 'Heart',
      className: 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 dark:from-blue-900/30 dark:to-indigo-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-700',
      description: 'عملاء منتظمون مع 3-10 طلبات'
    },
    'new': {
      label: 'جديد',
      icon: 'Star',
      className: 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 dark:from-green-900/30 dark:to-emerald-900/30 dark:text-green-300 border border-green-200 dark:border-green-700',
      description: 'عملاء جدد مع 1-2 طلب'
    },
    'problematic': {
      label: 'مشكل',
      icon: 'AlertCircle',
      className: 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 dark:from-red-900/30 dark:to-pink-900/30 dark:text-red-300 border border-red-200 dark:border-red-700',
      description: 'عملاء مع معدل إرجاع عالي أو شكاوى'
    }
  };
  
  return segmentConfigs[segment] || {
    label: segment || 'غير محدد',
    icon: 'User',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300 border border-gray-200 dark:border-gray-700',
    description: 'معلومات العميل غير متوفرة'
  };
};

// Helper function for calculating time difference
export const getTimeDifference = (dateString) => {
  if (!dateString) return '';
  
  const now = new Date();
  const date = new Date(dateString);
  const diffInMs = now - date;
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);
  
  if (diffInDays > 0) {
    return `${diffInDays} يوم`;
  } else if (diffInHours > 0) {
    return `${diffInHours} ساعة`;
  } else {
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    return `${diffInMinutes} دقيقة`;
  }
};

// Helper function for formatting currency
export const formatCurrency = (amount) => {
  if (!amount) return '0 ج.م';
  return `${amount.toLocaleString('ar-EG')} ج.م`;
};

// Helper function for getting action type icon
export const getActionTypeIcon = (actionType) => {
  const iconMap = {
    maintenance: 'Wrench',
    service: 'Wrench',
    return_refund: 'AlertOctagon',
    exchange: 'Package',
    premium_service: 'Award',
    delivery_support: 'Truck'
  };
  return iconMap[actionType] || 'Wrench';
};

// Helper function for getting status icon
export const getStatusIcon = (status) => {
  const iconMap = {
    requested: 'Clock',
    in_progress: 'Play',
    hub_confirmed: 'CheckCircle',
    awaiting_review: 'AlertTriangle',
    completed: 'CheckCircle',
    cancelled: 'XCircle'
  };
  return iconMap[status] || 'Clock';
};

// Helper function for validating phone number
export const validatePhoneNumber = (phone) => {
  if (!phone) return false;
  const phoneRegex = /^(\+20|0)?1[0125][0-9]{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

// Helper function for formatting phone number
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11 && cleaned.startsWith('01')) {
    return `+20${cleaned.substring(1)}`;
  }
  if (cleaned.length === 10 && cleaned.startsWith('1')) {
    return `+20${cleaned}`;
  }
  return phone;
};

// Enhanced action status badge style with better visual hierarchy
export const getActionStatusBadgeStyle = (status) => {
  const statusMap = {
    requested: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border border-blue-200 dark:border-blue-700',
    in_progress: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300 border border-amber-200 dark:border-amber-700',
    hub_confirmed: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 border border-green-200 dark:border-green-700',
    awaiting_review: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300 border border-purple-200 dark:border-purple-700',
    completed: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 border border-green-200 dark:border-green-700',
    cancelled: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300 border border-red-200 dark:border-red-700'
  };
  return statusMap[status] || 'bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300 border border-gray-200 dark:border-gray-700';
};

// Enhanced priority badge style with better visual hierarchy
export const getPriorityBadgeStyle = (priority) => {
  const priorityMap = {
    low: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 border border-green-200 dark:border-green-700',
    medium: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border border-blue-200 dark:border-blue-700',
    high: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300 border border-amber-200 dark:border-amber-700',
    urgent: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300 border border-red-200 dark:border-red-700'
  };
  return priorityMap[priority] || 'bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300 border border-gray-200 dark:border-gray-700';
};

// Enhanced action type badge style with better visual hierarchy
export const getActionTypeBadgeStyle = (actionType) => {
  const actionTypeMap = {
    maintenance: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border border-blue-200 dark:border-blue-700',
    service: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 border border-green-200 dark:border-green-700',
    return_refund: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300 border border-red-200 dark:border-red-700',
    exchange: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300 border border-purple-200 dark:border-purple-700',
    premium_service: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300 border border-amber-200 dark:border-amber-700',
    delivery_support: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-700'
  };
  return actionTypeMap[actionType] || 'bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300 border border-gray-200 dark:border-gray-700';
};

// Helper function for getting customer segment icon
export const getCustomerSegmentIcon = (segment) => {
  const iconMap = {
    'vip': 'Crown',
    'regular': 'Heart',
    'new': 'Star',
    'problematic': 'AlertCircle'
  };
  return iconMap[segment] || 'User';
};

// Helper function for getting customer segment description
export const getCustomerSegmentDescription = (segment) => {
  const descriptions = {
    'vip': 'عملاء VIP مع قيمة عالية أو طلبات كثيرة',
    'regular': 'عملاء منتظمون مع 3-10 طلبات',
    'new': 'عملاء جدد مع 1-2 طلب',
    'problematic': 'عملاء مع معدل إرجاع عالي أو شكاوى'
  };
  return descriptions[segment] || 'معلومات العميل غير متوفرة';
}; 