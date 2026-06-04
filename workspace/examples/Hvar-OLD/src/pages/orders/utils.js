export const formatTimelineData = (timeline) => {
    if (!timeline || !Array.isArray(timeline)) return [];
    
    // The timeline data is now pre-formatted, so we can use it directly.
    // This simplifies the logic and removes the need for mapping.
    return timeline.map((event, index) => ({
      id: index,
      code: event.code,
      value: event.value,
      date: event.date,
      done: event.done || false,
      description: event.desc || event.description || '',
      sequence: index
    }));
};

export const formatDate = (dateString) => {
    if (!dateString) return 'غير محدد';
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
};

export const calculateProgressPercentage = (timelineData) => {
    if (!timelineData || timelineData.length === 0) return 0;
    const totalWeight = timelineData.reduce((sum, step) => sum + (step.weight || 1), 0);
    const completedWeight = timelineData
      .filter(step => step.done)
      .reduce((sum, step) => sum + (step.weight || 1), 0);
    return Math.round((completedWeight / totalWeight) * 100);
};

export const getProgressWidth = (timelineData) => {
    const percentage = calculateProgressPercentage(timelineData);
    return `${percentage}%`;
};

export const getCardsProgressWidth = (timeline) => {
    if (!timeline || timeline.length === 0) return '0%';
    const percentage = calculateProgressPercentage(timeline);
    return `${percentage}%`;
};

export const truncateText = (text, maxLength = 60) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
};

export const getCategoryColor = (category) => {
    const colorMap = {
      'premium_high': 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      'high_value': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      'standard_value': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      'low_value': 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
      'zero_cod': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      'small_refund': 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
      'large_refund': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
    };
    return colorMap[category] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
};

export const getOrderTypeColor = (typeCode) => {
    const colorMap = {
      10: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      20: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
      25: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      30: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
    };
    return colorMap[typeCode] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
};

export const getStatusBadgeStyle = (stateCode) => {
    switch (stateCode) {
      case 45:
        return 'bg-gradient-to-r from-green-600 to-green-500';
      case 46:
        return 'bg-gradient-to-r from-amber-600 to-amber-500';
      case 48:
        return 'bg-gradient-to-r from-red-600 to-red-500';
      case 100:
      case 101:
        return 'bg-gradient-to-r from-red-700 to-red-600';
      case 10:
        return 'bg-gradient-to-r from-brand-red-600 to-brand-red-500';
      case 24:
        return 'bg-gradient-to-r from-blue-600 to-blue-500';
      case 30:
        return 'bg-gradient-to-r from-blue-500 to-blue-400';
      case 47:
        return 'bg-gradient-to-r from-red-600 to-red-500';
      default:
        return 'bg-gradient-to-r from-gray-600 to-gray-500';
    }
};

export const getStatusIcon = (stateCode, React) => {
    const { CheckCircle, RotateCcw, XCircle, Package, Warehouse, Truck, AlertCircle } = require('lucide-react');
    const className = "w-3 h-3 mr-1";
    switch (stateCode) {
      case 45:
        return React.createElement(CheckCircle, { className });
      case 46:
        return React.createElement(RotateCcw, { className });
      case 48:
      case 100:
      case 101:
        return React.createElement(XCircle, { className });
      case 10:
        return React.createElement(Package, { className });
      case 24:
        return React.createElement(Warehouse, { className });
      case 30:
        return React.createElement(Truck, { className });
      case 47:
        return React.createElement(AlertCircle, { className });
      default:
        return React.createElement(Package, { className });
    }
};

export const getStatusLabel = (stateCode, stateValue, maskedState) => {
    // If maskedState is provided and not null/empty, use it as primary source
    if (maskedState && maskedState.trim() !== '') {
        // Map common masked state values to Arabic labels
        const maskedStateMap = {
            'Delivered': 'تم التسليم',
            'Returned': 'مُرتجع',
            'Canceled': 'ملغي',
            'Cancelled': 'ملغي',
            'Lost': 'مفقود',
            'Damaged': 'تالف',
            'Exception': 'استثناء',
            'in Transit': 'قيد النقل',
            'Out for delivery': 'خارج للتوصيل',
            'Fulfilled': 'مُنجز',
            'Can\'t be delivered': 'لا يمكن التوصيل'
        };
        
        return maskedStateMap[maskedState] || maskedState;
    }
    
    // Fallback to state code mapping
    switch (stateCode) {
      case 45:
        return 'تم التسليم';
      case 46:
        return 'مُرتجع';
      case 48:
        return 'ملغي';
      case 100:
        return 'مفقود';
      case 101:
        return 'تالف';
      case 10:
        return 'طلب استلام';
      case 24:
        return 'في المستودع';
      case 30:
        return 'قيد النقل';
      case 47:
        return 'استثناء';
      default:
        return stateValue || 'غير محدد';
    }
};

export const getTimelineLabel = (value) => {
    switch (value) {
        case 'new': return 'طلب جديد';
        case 'picked_up': return 'تم الاستلام';
        case 'in_transit': return 'قيد النقل';
        case 'out_for_delivery': return 'خارج للتوصيل';
        case 'delivered': return 'تم التوصيل';
        case 'returned': return 'مُرتجع';
        case 'exception': return 'استثناء';
        case 'cancelled': return 'ملغي';
        case 'lost': return 'مفقود';
        case 'damaged': return 'تالف';
        default: return value || 'غير محدد';
    }
}; 