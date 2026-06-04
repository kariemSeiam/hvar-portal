import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, StatusBadge, FloatingActionButton } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import NewServiceActionForm from './service-management/components/NewServiceActionForm';

// Icons (no duplicate imports)
import {
  ArrowLeft,
  Phone,
  MapPin,
  Calendar,
  Package,
  TrendingUp,
  Star,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  BarChart3,
  Activity,
  Target,
  Award,
  Users,
  ShoppingBag,
  Truck,
  Home,
  Plus,
  Eye,
  FileText,
  Settings,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Circle,
  Warehouse,
  UserCheck,
  PhoneCall,
  PackageCheck,
  PackageX,
  Timer,
  Navigation,
  Building,
  RotateCcw,
  Wrench,
  Hammer,
  CreditCard,
  StarIcon,
  Info,
  CheckSquare,
  ThumbsUp,
  HelpCircle,
  X,
  Search,
  Smartphone,
  Monitor,
  Tablet,
  Watch,
  Headphones,
  Camera,
  Printer,
  Speaker,
  Keyboard,
  Mouse,
  Gamepad,
  Tv,
  Radio,
  Fan,
  Lightbulb,
  Battery,
  Wifi,
  Bluetooth,
  Usb,
  Network,
  Database,
  CalendarCheck
} from 'lucide-react';

/**
 * Compact Follow-up Confirmation Component
 * Displays success confirmation with follow-up details
 */
const FollowUpConfirmation = ({ confirmation, onClose, animating }) => {
  if (!confirmation) return null;

  const { customer, follow_up, order } = confirmation;
  
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'delivery': return <Truck className="w-4 h-4" />;
      case 'technical': return <Wrench className="w-4 h-4" />;
      case 'general': return <PhoneCall className="w-4 h-4" />;
      default: return <PhoneCall className="w-4 h-4" />;
    }
  };

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 ease-out ${
      animating ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
    }`}>
      <div className="bg-white rounded-lg shadow-lg border border-green-200 max-w-sm w-full transform transition-all duration-300 ease-out">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-green-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">تم جدولة المتابعة</h3>
              <p className="text-xs text-gray-500">Follow-up Scheduled</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close confirmation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Customer Info */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <UserCheck className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {customer?.name || 'غير محدد'}
              </p>
              <p className="text-xs text-gray-500">{customer?.phone}</p>
            </div>
          </div>

          {/* Follow-up Details */}
          <div className="bg-gray-50 rounded-md p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getTypeIcon(follow_up?.type)}
                <span className="text-xs font-medium text-gray-700">
                  {follow_up?.type === 'delivery' ? 'متابعة توصيل' : 
                   follow_up?.type === 'technical' ? 'متابعة فنية' : 'متابعة عامة'}
                </span>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(follow_up?.priority)}`}>
                {follow_up?.priority === 'high' ? 'عالية' : 
                 follow_up?.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
              </span>
            </div>
            
            <div className="flex items-center space-x-2 text-xs text-gray-600">
              <Calendar className="w-3 h-3" />
              <span>{follow_up?.date}</span>
              {follow_up?.time && (
                <>
                  <Clock className="w-3 h-3" />
                  <span>{follow_up?.time}</span>
                </>
              )}
            </div>

            {follow_up?.notes && (
              <div className="text-xs text-gray-600 bg-white rounded p-2 border">
                <span className="font-medium">الملاحظات:</span> {follow_up.notes}
              </div>
            )}
          </div>

          {/* Agent Info */}
          <div className="flex items-center space-x-2 text-xs text-gray-600">
            <UserCheck className="w-3 h-3" />
            <span>المسؤول: {follow_up?.agent}</span>
          </div>

          {/* Order Info (if available) */}
          {order && (
            <div className="flex items-center space-x-2 text-xs text-gray-600">
              <Package className="w-3 h-3" />
              <span>رقم التتبع: {order.tracking_number}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-gray-50 rounded-b-lg">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>ID: {confirmation.follow_up_id}</span>
            <span>{new Date(confirmation.created_at).toLocaleTimeString('ar-SA', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Enhanced Customer Detail Page - Full Width with Better Timeline and Order Sections
 */
const CustomerDetailPage = () => {
  const { phone } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [orderTimelines, setOrderTimelines] = useState({});
  const [error, setError] = useState(null);
  const [expandedOrders, setExpandedOrders] = useState(new Set());
  const [activeTab, setActiveTab] = useState('all');
  const [copiedPhone, setCopiedPhone] = useState(null);
  
  // Service Actions State
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [serviceModalType, setServiceModalType] = useState(null); // 'follow-up' or 'service-action'
  const [selectedServiceActionType, setSelectedServiceActionType] = useState(null); // Store the selected action type from menu
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [products, setProducts] = useState([]);
  const [serviceActions, setServiceActions] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  
  // Follow-up Confirmation State
  const [followUpConfirmation, setFollowUpConfirmation] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationAnimating, setConfirmationAnimating] = useState(false);
  
  const [loadingServiceData, setLoadingServiceData] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedParts, setSelectedParts] = useState([]);

  // Service Action Form State
  const [serviceForm, setServiceForm] = useState({
    action_type: '',
    priority: 'medium',
    service_reason: '',
    product_sku: '',
    parts_required: [],
    technician_notes: '',
    customer_notes: '',
    scheduled_date: '',
    scheduled_time: ''
  });



  // Timeline transformation helpers
  const getTimelineEventText = (code, value) => {
    switch (code) {
      case 10: return 'تم إنشاء الطلب';
      case 21: return 'تم استلام الطلب';
      case 23: return 'تم استلام الطلب';
      case 30: return 'وصل للمستودع';
      case 41: return 'قيد التوصيل';
      case 45: return 'تم التوصيل';
      case 46: 
        // Handle different return states
        if (value === 'out_for_return') return 'قيد الإرجاع';
        if (value === 'returned') return 'تم الإرجاع';
        return 'تم الإرجاع';
      case 48: return 'تم الإلغاء';
      case 100: return 'لا يمكن التوصيل';
      case 101: return 'استثناء';
      case 24: return 'في المستودع';
      case 25: return 'قيد المعالجة';
      case 26: return 'جاهز للتوصيل';
      case 27: return 'تم التغليف';
      case 28: return 'في الطريق';
      case 29: return 'تم التسليم';
      case 31: return 'قيد النقل';
      case 32: return 'وصل للفرع';
      case 33: return 'قيد التوزيع';
      case 34: return 'محاولة توصيل';
      case 35: return 'تم الاتصال';
      case 36: return 'في انتظار العميل';
      case 37: return 'تم التأجيل';
      case 38: return 'غير متاح';
      case 39: return 'رفض الاستلام';
      case 40: return 'عنوان خاطئ';
      case 42: return 'محاولة ثانية';
      case 43: return 'محاولة ثالثة';
      case 44: return 'محاولة أخيرة';
      case 47: return 'قيد الإرجاع';
      case 49: return 'تم الإلغاء';
      case 50: return 'معلق';
      case 51: return 'مرفوض';
      case 52: return 'مؤجل';
      default: return `مرحلة ${code}`; // Show the code if not mapped
    }
  };

  const getTimelineEventColor = (code) => {
    switch (code) {
      case 45: return 'green'; // Delivered
      case 46: return 'orange'; // Returned
      case 48: return 'red'; // Cancelled
      case 100: return 'red'; // Cannot deliver
      case 101: return 'red'; // Exception
      case 10: return 'blue'; // Created
      case 21: return 'purple'; // Picked up
      case 23: return 'purple'; // Picked up (alternative code)
      case 30: return 'indigo'; // At warehouse
      case 41: return 'yellow'; // Out for delivery
      case 24: return 'indigo'; // At warehouse
      case 25: return 'blue'; // Processing
      case 26: return 'green'; // Ready for delivery
      case 27: return 'blue'; // Packaged
      case 28: return 'yellow'; // In transit
      case 29: return 'green'; // Delivered
      case 31: return 'yellow'; // In transit
      case 32: return 'indigo'; // At branch
      case 33: return 'yellow'; // Distributing
      case 34: return 'yellow'; // Delivery attempt
      case 35: return 'blue'; // Contacted
      case 36: return 'orange'; // Waiting for customer
      case 37: return 'orange'; // Postponed
      case 38: return 'red'; // Unavailable
      case 39: return 'red'; // Rejected
      case 40: return 'red'; // Wrong address
      case 42: return 'yellow'; // Second attempt
      case 43: return 'yellow'; // Third attempt
      case 44: return 'red'; // Final attempt
      case 47: return 'orange'; // Returning
      case 49: return 'red'; // Cancelled
      case 50: return 'orange'; // Suspended
      case 51: return 'red'; // Rejected
      case 52: return 'orange'; // Postponed
      default: return 'blue'; // Default to blue for unmapped codes
    }
  };

  // Create fallback timeline based on order state
  const createFallbackTimeline = (order) => {
    const timeline = [];
    const createdDate = order.created_at;
    
    // Always add creation event
    timeline.push({
      event: 'تم إنشاء الطلب',
      timestamp: createdDate,
      color: 'blue',
      done: true
    });
    
    // Add state-specific events
    switch (order.state_code) {
      case 45: // Delivered
        timeline.push({
          event: 'تم التوصيل',
          timestamp: order.delivered_at || order.updated_at || createdDate,
          color: 'green',
          done: true
        });
        break;
      case 46: // Returned
        timeline.push({
          event: 'تم الإرجاع',
          timestamp: order.returned_at || order.updated_at || createdDate,
          color: 'orange',
          done: true
        });
        break;
      case 48: // Cancelled
        timeline.push({
          event: 'تم الإلغاء',
          timestamp: order.updated_at || createdDate,
          color: 'red',
          done: true
        });
        break;
      case 100: // Lost
        timeline.push({
          event: 'لا يمكن التوصيل',
          timestamp: order.updated_at || createdDate,
          color: 'red',
          done: true
        });
        break;
      case 101: // Damaged
        timeline.push({
          event: 'استثناء',
          timestamp: order.updated_at || createdDate,
          color: 'red',
          done: true
        });
        break;
      default:
        // For pending orders, add a generic status
        timeline.push({
          event: 'قيد المعالجة',
          timestamp: order.updated_at || createdDate,
          color: 'gray',
          done: false
        });
    }
    
    return timeline;
  };

  // Fetch customer data with real backend structure
  const fetchCustomerData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.customers.getCustomer(phone);
      
      if (response.success) {
        const customerData = response.data.customer;
        
        // Normalize customer data to handle different field names
        const normalizedCustomer = {
          ...customerData,
          full_name: customerData.full_name || customerData.receiver_name || 'غير محدد',
          phone: customerData.phone || customerData.receiver_phone,
          customer_segment: customerData.customer_segment || customerData.segment
        };
        
        setCustomer(normalizedCustomer);
        
        // Get customer orders with business categorization
        const ordersResponse = await api.customers.getCustomerOrders(phone, {
          limit: 100,
          page: 1
        });
        
        if (ordersResponse.success) {
          const ordersData = ordersResponse.data.orders || [];
          
          // Normalize orders data to handle different field names and add customer information
          const normalizedOrders = ordersData.map(order => ({
            ...order,
            masked_state: order.masked_state || getStatusText(order.state_code),
            receiver_name: order.receiver_name || order.full_name,
            receiver_phone: order.receiver_phone || order.phone,
            // Add customer information for enhanced search
            customer_name: order.receiver_name || order.full_name || customerData.full_name,
            customer_phone: order.receiver_phone || order.phone || customerData.phone,
            // Ensure we have the customer data for grouping
            customer_id: order.customer_id || customerData.customer_id
          }));
          
          setOrders(normalizedOrders);
          
          // Process order timelines from the orders data
          const timelines = {};
          normalizedOrders.forEach(order => {
            let timelineData = null;
            
            // First try to use the parsed timeline data
            if (order.timeline && Array.isArray(order.timeline) && order.timeline.length > 0) {
              timelineData = order.timeline;
            }
            // If not available, try to parse the timeline_json
            else if (order.timeline_json) {
              try {
                timelineData = JSON.parse(order.timeline_json);
              } catch (error) {
                console.error('Error parsing timeline JSON for order', order.id, ':', error);
              }
            }
            
            if (timelineData && Array.isArray(timelineData) && timelineData.length > 0) {
              // Transform timeline data to match frontend expectations
              const transformedTimeline = timelineData.map(event => ({
                event: getTimelineEventText(event.code, event.value),
                timestamp: event.date,
                color: getTimelineEventColor(event.code),
                done: event.done || false,
                value: event.value,
                description: event.desc || null,
                attempts: event.attempts || null,
                calls_count: event.calls_count || null
              }));
              
              // Remove duplicate events (same event name and timestamp within 1 hour)
              const uniqueTimeline = transformedTimeline.filter((event, index, array) => {
                const sameEvent = array.findIndex(e => 
                  e.event === event.event && 
                  Math.abs(new Date(e.timestamp) - new Date(event.timestamp)) < 3600000 // 1 hour
                );
                return sameEvent === index;
              });
              
              // Sort timeline events by timestamp (oldest first)
              const sortedTimeline = uniqueTimeline.sort((a, b) => {
                const dateA = new Date(a.timestamp);
                const dateB = new Date(b.timestamp);
                return dateA - dateB;
              });
              
              // Add order-level data to timeline steps that need it
              const enhancedTimeline = sortedTimeline.map(step => {
                // Add calls_count to delivery-related steps
                if (step.event === 'قيد التوصيل' || step.event === 'محاولة توصيل') {
                  return {
                    ...step,
                    calls_count: order.calls_count || 0,
                    attempts_count: order.attempts_count || 0
                  };
                }
                return step;
              });
              
              timelines[order.id] = enhancedTimeline;
            } else {
              // Create a fallback timeline based on order state
              const fallbackTimeline = createFallbackTimeline(order);
              timelines[order.id] = fallbackTimeline;
            }
          });
          setOrderTimelines(timelines);
        }
      } else {
        setError(response.error || 'لم يتم العثور على العميل');
      }
    } catch (error) {
      console.error('Error fetching customer data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (phone) {
      fetchCustomerData();
    }
  }, [phone]);

  // Filter orders by status (with real backend business categorization)
  const deliveredOrders = orders.filter(order => order.state_code === 45);
  const failedOrders = orders.filter(order => [48, 100, 101].includes(order.state_code));
  const returnedOrders = orders.filter(order => order.state_code === 46);
  const fulfilledOrders = orders.filter(order => order.business_category === 'exchange_upsell');
  const pendingOrders = orders.filter(order => [10, 24, 30].includes(order.state_code));

  // Get segment color based on real backend segments
  const getSegmentColor = (segment) => {
    switch (segment) {
      case 'vip': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'regular': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'new': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'problematic': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  // Get status badge variant based on real backend state codes
  const getStatusVariant = (stateCode) => {
    // Handle null, undefined, or empty stateCode
    if (!stateCode) {
      return 'info';
    }
    
    switch (stateCode) {
      case 45: return 'success'; // Delivered
      case 46: return 'warning'; // Returned
      case 48: return 'error'; // Terminated
      case 100: return 'error'; // Lost
      case 101: return 'error'; // Damaged
      case 10: return 'info'; // Pickup requested
      case 24: return 'info'; // At warehouse
      case 30: return 'info'; // In transit
      default: return 'info';
    }
  };

  // Get status color based on real backend state codes
  const getStatusColor = (stateCode) => {
    // Handle null, undefined, or empty stateCode
    if (!stateCode) {
      return 'text-gray-600 dark:text-gray-400';
    }
    
    switch (stateCode) {
      case 45: return 'text-green-600 dark:text-green-400'; // Delivered
      case 46: return 'text-orange-600 dark:text-orange-400'; // Returned
      case 48: return 'text-red-600 dark:text-red-400'; // Terminated
      case 100: return 'text-red-600 dark:text-red-400'; // Lost
      case 101: return 'text-red-600 dark:text-red-400'; // Damaged
      case 10: return 'text-blue-600 dark:text-blue-400'; // Pickup requested
      case 24: return 'text-blue-600 dark:text-blue-400'; // At warehouse
      case 30: return 'text-blue-600 dark:text-blue-400'; // In transit
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  // Get status text based on real backend state codes
  const getStatusText = (stateCode) => {
    switch (stateCode) {
      case 45: return 'تم التوصيل';
      case 46: return 'تم الإرجاع';
      case 48: return 'تم الإلغاء';
      case 100: return 'مفقود';
      case 101: return 'تالف';
      case 10: return 'طلب استلام';
      case 24: return 'في المستودع';
      case 30: return 'قيد التوصيل';
      default: return 'غير محدد';
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'غير محدد';
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Toggle order expansion
  const toggleOrderExpansion = (orderId) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  // Open tracking link
  const openTracking = (trackingNumber) => {
    if (trackingNumber) {
      window.open(`https://business.bosta.co/orders/${trackingNumber}`, '_blank');
    }
  };

  // Enhanced Timeline Component: green line only between icons, smaller icons/circles
  const OrderTimelineStepper = ({ timeline }) => {
    if (!timeline || timeline.length === 0) return null;
    // Timeline is already sorted by timestamp in the data processing
    const sortedTimeline = timeline;

    // Map event to Lucide icon
    const getStepIcon = (event) => {
      switch (event) {
        case 'تم إنشاء الطلب': return <Package className="w-full h-full text-white" />;
        case 'تم استلام الطلب': return <Truck className="w-full h-full text-white" />;
        case 'وصل للمستودع': return <Warehouse className="w-full h-full text-white" />;
        case 'قيد التوصيل': return <Navigation className="w-full h-full text-white" />;
        case 'محاولات التوصيل': return <Navigation className="w-full h-full text-white" />;
        case 'مكالمات العميل': return <PhoneCall className="w-full h-full text-white" />;
        case 'تم التوصيل': return <PackageCheck className="w-full h-full text-white" />;
        case 'قيد الإرجاع': return <RotateCcw className="w-full h-full text-white" />;
        case 'تم الإرجاع': return <PackageX className="w-full h-full text-white" />;
        case 'تم الإلغاء': return <XCircle className="w-full h-full text-white" />;
        case 'لا يمكن التوصيل': return <AlertCircle className="w-full h-full text-white" />;
        case 'استثناء': return <AlertCircle className="w-full h-full text-white" />;
        case 'قيد الاستلام': return <Package className="w-full h-full text-white" />;
        case 'قيد المعالجة': return <Clock className="w-full h-full text-white" />;
        default: return <Circle className="w-full h-full text-white" />;
      }
    };

    function getTimelineColor(color, done) {
      if (!done) {
        return 'bg-gray-300 dark:bg-gray-600 border-2 border-dashed border-gray-400';
      }
      
      switch (color) {
        case 'green': return 'bg-green-500 shadow-lg shadow-green-500/25';
        case 'orange': return 'bg-orange-500 shadow-lg shadow-orange-500/25';
        case 'blue': return 'bg-blue-500 shadow-lg shadow-blue-500/25';
        case 'purple': return 'bg-purple-500 shadow-lg shadow-purple-500/25';
        case 'indigo': return 'bg-indigo-500 shadow-lg shadow-indigo-500/25';
        case 'yellow': return 'bg-yellow-500 shadow-lg shadow-yellow-500/25';
        case 'red': return 'bg-red-500 shadow-lg shadow-red-500/25';
        case 'gray': return 'bg-gray-500 shadow-lg shadow-gray-500/25';
        default: return 'bg-green-500 shadow-lg shadow-green-500/25';
      }
    }

    function getConnectionLineColor(done) {
      return done ? 'bg-gradient-to-r from-green-400 via-green-500 to-green-600' : 'bg-gradient-to-r from-gray-300 via-gray-400 to-gray-500';
    }

    return (
      <div className="overflow-x-auto">
        <div className="flex items-center justify-between min-w-[1200px] px-4 py-4">
          {sortedTimeline.map((step, idx) => {
            const isLast = idx === sortedTimeline.length - 1;
            const isActive = step.done; // Active if step is done
            
            return (
              <div key={idx} className="flex flex-col items-center relative" style={{ minWidth: '200px' }}>
                {/* Connection line */}
                {!isLast && (
                  <div className="absolute top-5 right-1/2 w-full h-1 transform -translate-y-1/2 z-0">
                    {/* Main connection line - extended to eliminate gaps */}
                    <div className={`w-full h-full rounded-full shadow-sm ${getConnectionLineColor(step.done)}`} style={{ width: 'calc(100% + 40px)', marginLeft: '-20px' }}></div>
                    {/* Animated flow indicator for completed steps */}
                    {step.done && (
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" style={{ width: 'calc(100% + 40px)', marginLeft: '-20px' }}></div>
                    )}
                  </div>
                )}
                
                <div className="flex items-center w-auto relative z-10">
                  {/* Icon circle with enhanced styling */}
                  <div className={`w-10 h-10 rounded-full border-4 border-white flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg ${
                    getTimelineColor(step.color, step.done)
                  } ${step.done ? 'ring-2 ring-green-200 dark:ring-green-800' : ''}`}>
                    <div className="w-5 h-5">
                      {getStepIcon(step.event)}
                    </div>
                  </div>
                  
                  {/* Status indicator */}
                  {step.done && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse shadow-lg"></div>
                  )}
                  
                  {/* Mini Creative Badge for Attempts/Calls */}
                  {(step.description && step.description.includes('attempts')) || step.attempts || step.calls_count || step.attempts_count ? (
                    <div className="absolute -top-1 -left-1">
                      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full border border-white shadow-md">
                        <div className="flex items-center gap-1">
                          <div className="w-1 h-1 bg-white rounded-full animate-pulse"></div>
                          <span className="font-mono">
                            {(() => {
                              const attempts = step.attempts || step.attempts_count || (step.description ? step.description.replace('attempts ', '') : '0');
                              const calls = step.calls_count || 0;
                              
                              if (calls > 0 && attempts !== '0' && attempts !== 0) {
                                return `${attempts} محاولة / ${calls} مكالمة`;
                              } else if (calls > 0) {
                                return `${calls} مكالمة`;
                              } else if (attempts !== '0' && attempts !== 0) {
                                return `${attempts} محاولة`;
                              } else {
                                return '0 محاولة';
                              }
                            })()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
                
                <div className="mt-3 text-center max-w-[120px]">
                  <div className={`font-semibold text-xs leading-tight transition-colors duration-200 ${
                    step.done 
                      ? 'text-gray-900 dark:text-white' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {step.event}
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {step.timestamp ? formatTimelineDate(step.timestamp) : 'قيد الانتظار'}
                  </div>
                  {step.description && !step.description.includes('attempts') && (
                    <div className="text-xs text-brand-red-600 dark:text-brand-red-400 mt-1 font-medium">
                      {step.description}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Helper for pretty date formatting (relative or absolute in Arabic)
  function formatTimelineDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const oneDay = 24 * 60 * 60 * 1000;
    if (diff < oneDay) {
      // Today
      return `اليوم، ${date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diff < 2 * oneDay) {
      // Yesterday
      return `أمس، ${date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      // Absolute
      return date.toLocaleDateString('ar-EG', { weekday: 'short', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
    }
  }

  // Enhanced Order Card
  const OrderCard = ({ order, timeline, expanded, onToggle }) => (
    <article
      className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 mb-4 transition-all duration-200 hover:shadow-md focus-within:ring-2 focus-within:ring-brand-red-500"
      tabIndex={0}
      aria-label={`تفاصيل الطلب رقم ${order.tracking_number || order.id}`}
    >
      {/* Order Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 md:px-6 py-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <a
            href={`https://business.bosta.co/orders/${order.tracking_number}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-brand-red-700 dark:text-brand-red-400 hover:underline text-base flex-shrink-0"
            aria-label={`تتبع الطلب رقم ${order.tracking_number}`}
          >
            #{order.tracking_number || order.id}
          </a>
          <StatusBadge variant={getStatusVariant(order.state_code)}>
            {getStatusText(order.state_code)}
          </StatusBadge>
          <span className="truncate text-gray-600 dark:text-gray-400 text-sm" title={order.product_name}>
            {order.product_name || order.business_category}
          </span>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-gray-900 dark:text-white font-bold text-base">
            {formatCurrency(order.cod)}
          </span>
          <Button
            size="sm"
            variant="ghost"
            aria-label={expanded ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
            onClick={onToggle}
            className="p-1"
          >
            {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </Button>
        </div>
      </header>
      
      {/* Order Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 px-4 md:px-6 py-3 text-xs sm:text-sm bg-gray-50 dark:bg-gray-800">
        <div>
          <span className="block text-gray-500 dark:text-gray-400">التاريخ</span>
          <span className="block text-gray-900 dark:text-white font-medium">{formatDate(order.created_at)}</span>
        </div>
        <div>
          <span className="block text-gray-500 dark:text-gray-400">المدينة</span>
          <span className="block text-gray-900 dark:text-white font-medium">
            {order.state_code === 46
              ? `${order.pickup_city || ''}${order.pickup_zone ? ', ' + order.pickup_zone : ''}`
              : `${order.dropoff_city_name || ''}${order.dropoff_zone_name ? ', ' + order.dropoff_zone_name : ''}`}
          </span>
        </div>  
        <div>
          <span className="block text-gray-500 dark:text-gray-400">الحالة</span>
          <span className={`block font-bold ${getStatusColor(order.state_code)}`}>{getStatusText(order.state_code)}</span>
        </div>
        <div>
          <span className="block text-gray-500 dark:text-gray-400">محاولات التوصيل</span>
          <span className="block text-gray-900 dark:text-white font-medium">
            {order.attempts_count || 0} محاولة
            {order.calls_count > 0 && ` / ${order.calls_count} مكالمة`}
          </span>
        </div>
        {/* Delivery Time Taken (in days) */}
        <div>
          <span className="block text-gray-500 dark:text-gray-400">وقت التوصيل</span>
          <span className="block text-gray-900 dark:text-white font-medium">
            {getDeliveryTimeDays(order)}
          </span>
        </div>
      </div>
      
      {/* Expandable Details */}
      {expanded && (
        <section className="px-4 md:px-6 py-6 bg-white dark:bg-gray-900 animate-in slide-in-from-top-2 duration-300" aria-label="تفاصيل الطلب">
          {/* Product Details Section - Refactored for better UX */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 text-base">
                <Package className="w-5 h-5 text-brand-red-500" /> تفاصيل المنتج
              </h4>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                  #{order.tracking_number || order.id}
                </span>
              </div>
            </div>
            
            {order.product_info?.name ? (
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm transition-all duration-200 hover:shadow-md">
                {/* Product Header */}
                <div className="px-4 md:px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-red-100 dark:bg-brand-red-900/30 rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-brand-red-600 dark:text-brand-red-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-bold text-gray-900 dark:text-white text-sm truncate">
                        {order.product_info.name}
                      </h5>
                      {order.product_info?.category && (
                        <span className="text-xs text-brand-red-600 dark:text-brand-red-400 font-medium">
                          {order.product_info.category}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Product Details Content */}
                <div className="px-4 md:px-6 py-4 space-y-6">
                  {order.product_info?.description && (
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5">
                        <FileText className="w-3 h-3 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">الوصف</span>
                        <p className="text-sm text-gray-900 dark:text-white leading-relaxed">
                          {order.product_info.description}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Additional product info */}
                  <div className="flex items-center gap-3 pt-2">
                    <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800"></div>
                    <span className="text-xs text-gray-400 dark:text-gray-500 px-2">معلومات إضافية</span>
                    <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800"></div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <span className="text-gray-500 dark:text-gray-400 block mb-1">تاريخ الطلب</span>
                      <span className="font-medium text-gray-900 dark:text-white">{formatDate(order.created_at)}</span>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <span className="text-gray-500 dark:text-gray-400 block mb-1">القيمة</span>
                      <span className="font-bold text-brand-red-600 dark:text-brand-red-400">{formatCurrency(order.cod)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : order.notes ? (
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-4 md:p-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-gray-900 dark:text-white text-sm mb-2">ملاحظات الطلب</h5>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {order.notes}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 md:p-8 text-center">
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-6 h-6 text-gray-400" />
                </div>
                <h5 className="font-medium text-gray-900 dark:text-white text-sm mb-2">لا توجد تفاصيل متاحة</h5>
                <p className="text-xs text-gray-500 dark:text-gray-400">لم يتم تحديد معلومات المنتج لهذا الطلب</p>
              </div>
            )}
          </div>
          
          {/* Timeline Stepper - Refactored for better integration */}
          <div className="w-full">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 text-base">
                <Clock className="w-5 h-5 text-brand-red-500" /> مسار الطلب
              </h4>
              {timeline && timeline.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    {timeline.length} مرحلة
                  </span>
                  <span className="text-brand-red-600 dark:text-brand-red-400 font-medium">
                    • {Math.round((timeline.filter(step => step.done).length / timeline.length) * 100)}% مكتمل
                  </span>
                  
                </div>
              )}
            </div>
            
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
              <div className="p-4 md:p-6">
                <div className="w-full overflow-x-auto">
                  <div className="w-full min-w-[600px]">
                    <OrderTimelineStepper timeline={timeline} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </article>
  );

  // Get current orders based on active tab
  const getCurrentOrders = () => {
    switch (activeTab) {
      case 'delivered': return deliveredOrders;
      case 'failed': return failedOrders;
      case 'returned': return returnedOrders;
      case 'fulfilled': return fulfilledOrders;
      case 'pending': return pendingOrders;
      default: return orders;
    }
  };

  const handleCopyPhone = (number) => {
    if (!number) return;
    navigator.clipboard.writeText(number);
    setCopiedPhone(number);
    setTimeout(() => setCopiedPhone(null), 1200);
  };

  // Add helper for delivery time in days (Arabic pluralization)
  function getDeliveryTimeDays(order) {
    if (!order.created_at || !order.delivered_at) return 'غير متوفر';
    const created = new Date(order.created_at);
    const delivered = new Date(order.delivered_at);
    const diffMs = delivered - created;
    if (isNaN(diffMs) || diffMs < 0) return 'غير متوفر';
    const days = Math.round(diffMs / (1000 * 60 * 60 * 24));
    if (days === 0) return 'أقل من يوم';
    if (days === 1) return 'يوم واحد';
    if (days === 2) return 'يومان';
    if (days >= 3 && days <= 10) return `${days} أيام`;
    return `${days} يومًا`;
  }

  // =================== SERVICE ACTIONS FUNCTIONS ===================

  // Load service actions data
  const loadServiceData = async () => {
    setLoadingServiceData(true);
    try {
      // Load products for service actions
      const productsResponse = await api.products.getProducts({ limit: 100 });
      if (productsResponse.success) {
        setProducts(productsResponse.data.products || []);
      }

      // Load existing service actions for this customer
      const serviceActionsResponse = await api.unifiedCustomerService.getServiceActions({
        customer_phone: phone,
        limit: 50
      });
      if (serviceActionsResponse.success) {
        setServiceActions(serviceActionsResponse.data.actions || []);
      }

      // Load follow-ups for this customer
      const followUpsResponse = await api.unifiedCustomerService.getFollowUps({
        customer_phone: phone,
        days_back: 30
      });
      if (followUpsResponse.success) {
        setFollowUps(followUpsResponse.data || []);
      }
    } catch (error) {
      console.error('Error loading service data:', error);
    } finally {
      setLoadingServiceData(false);
    }
  };

  // Open service modal
  const openServiceModal = (type, order = null) => {
    setServiceModalType(type);
    setSelectedOrder(order);
    setShowServiceModal(true);
    loadServiceData();
  };

  // Handle form submission from NewServiceActionForm
  const handleFormSubmit = async (formData) => {
    try {
      // Check if this was a follow-up submission by looking for follow_up_id
      if (formData && formData.follow_up_id) {
        // Store confirmation data
        setFollowUpConfirmation(formData);
        setShowConfirmation(true);
        
        // Auto-hide confirmation after 5 seconds with animation
        setTimeout(() => {
          setConfirmationAnimating(true);
          setTimeout(() => {
            setShowConfirmation(false);
            setFollowUpConfirmation(null);
            setConfirmationAnimating(false);
          }, 300);
        }, 15000);
      }
      
      // All form submissions are now handled by NewServiceActionForm
      // This includes follow-ups, service actions, and new orders
      setShowServiceModal(false);
      loadServiceData(); // Refresh data
      fetchCustomerData(); // Refresh customer data
    } catch (error) {
      console.error('Error handling form submission:', error);
    }
  };

  // Get product icon based on product name
  const getProductIcon = (productName) => {
    const name = productName?.toLowerCase() || '';
    
    if (name.includes('phone') || name.includes('mobile') || name.includes('smartphone')) return <Smartphone className="w-5 h-5" />;
    if (name.includes('laptop') || name.includes('computer') || name.includes('pc')) return <Monitor className="w-5 h-5" />;
    if (name.includes('tablet') || name.includes('ipad')) return <Tablet className="w-5 h-5" />;
    if (name.includes('watch') || name.includes('smartwatch')) return <Watch className="w-5 h-5" />;
    if (name.includes('headphone') || name.includes('earphone')) return <Headphones className="w-5 h-5" />;
    if (name.includes('camera') || name.includes('photo')) return <Camera className="w-5 h-5" />;
    if (name.includes('printer') || name.includes('print')) return <Printer className="w-5 h-5" />;
    if (name.includes('speaker') || name.includes('audio')) return <Speaker className="w-5 h-5" />;
    if (name.includes('keyboard')) return <Keyboard className="w-5 h-5" />;
    if (name.includes('mouse')) return <Mouse className="w-5 h-5" />;
    if (name.includes('game') || name.includes('controller')) return <Gamepad className="w-5 h-5" />;
    if (name.includes('tv') || name.includes('television')) return <Tv className="w-5 h-5" />;
    if (name.includes('radio')) return <Radio className="w-5 h-5" />;
    if (name.includes('fan') || name.includes('ventilator')) return <Fan className="w-5 h-5" />;
    if (name.includes('light') || name.includes('bulb')) return <Lightbulb className="w-5 h-5" />;
    if (name.includes('battery') || name.includes('power')) return <Battery className="w-5 h-5" />;
    if (name.includes('wifi') || name.includes('wireless')) return <Wifi className="w-5 h-5" />;
    if (name.includes('bluetooth')) return <Bluetooth className="w-5 h-5" />;
    if (name.includes('usb')) return <Usb className="w-5 h-5" />;
    if (name.includes('hdmi') || name.includes('display') || name.includes('video')) return <Monitor className="w-5 h-5" />;
    if (name.includes('ethernet') || name.includes('network')) return <Network className="w-5 h-5" />;
    if (name.includes('cpu') || name.includes('processor')) return <Monitor className="w-5 h-5" />;
    if (name.includes('hard') || name.includes('drive') || name.includes('ssd')) return <Database className="w-5 h-5" />;
    
    return <Package className="w-5 h-5" />;
  };

  // Get service action type icon
  const getServiceActionIcon = (actionType) => {
    switch (actionType) {
      case 'maintenance': return <Wrench className="w-5 h-5" />;
      case 'replacement': return <RotateCcw className="w-5 h-5" />;
      case 'repair': return <Hammer className="w-5 h-5" />;
      case 'refund': return <CreditCard className="w-5 h-5" />;
      case 'return': return <PackageX className="w-5 h-5" />;
      case 'exchange': return <RotateCcw className="w-5 h-5" />;
      case 'premium_service': return <StarIcon className="w-5 h-5" />;
      case 'delivery_support': return <Truck className="w-5 h-5" />;
      default: return <Package className="w-5 h-5" />;
    }
  };

  // Get service action type label in Arabic
  const getServiceActionLabel = (actionType) => {
    switch (actionType) {
      case 'maintenance': return 'صيانة';
      case 'replacement': return 'استبدال';
      case 'repair': return 'إصلاح';
      case 'refund': return 'استرداد';
      case 'return': return 'إرجاع';
      case 'exchange': return 'تبديل';
      case 'premium_service': return 'خدمة متميزة';
      case 'delivery_support': return 'دعم التوصيل';
      default: return 'خدمة عامة';
    }
  };

  // Get priority label in Arabic
  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'low': return 'منخفض';
      case 'medium': return 'متوسط';
      case 'high': return 'عالي';
      case 'urgent': return 'عاجل';
      default: return 'متوسط';
    }
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30';
      case 'high': return 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30';
      case 'urgent': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
      default: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800';
    }
  };

  // Service Action Types Configuration
  const serviceActionTypes = [
    { type: 'maintenance', label: 'صيانة', icon: <Wrench className="w-5 h-5" />, description: 'صيانة المنتج وإصلاح الأعطال' },
    { type: 'replacement', label: 'استبدال', icon: <RotateCcw className="w-5 h-5" />, description: 'استبدال المنتج بآخر جديد' },
    { type: 'repair', label: 'إصلاح', icon: <Hammer className="w-5 h-5" />, description: 'إصلاح الأجزاء التالفة' },
    { type: 'refund', label: 'استرداد', icon: <CreditCard className="w-5 h-5" />, description: 'استرداد المبلغ المدفوع' },
    { type: 'return', label: 'إرجاع', icon: <PackageX className="w-5 h-5" />, description: 'إرجاع المنتج للمستودع' },
    { type: 'exchange', label: 'تبديل', icon: <RotateCcw className="w-5 h-5" />, description: 'تبديل المنتج بآخر' },
    { type: 'premium_service', label: 'خدمة متميزة', icon: <StarIcon className="w-5 h-5" />, description: 'خدمة متميزة للعملاء VIP' },
    { type: 'delivery_support', label: 'دعم التوصيل', icon: <Truck className="w-5 h-5" />, description: 'دعم في عملية التوصيل' }
  ];

  // Follow-up Types Configuration
  const followUpTypes = [
    { type: 'follow_up', label: 'متابعة عامة', icon: <PhoneCall className="w-5 h-5" />, description: 'متابعة عامة مع العميل' },
    { type: 'status_update', label: 'تحديث الحالة', icon: <Info className="w-5 h-5" />, description: 'تحديث العميل بحالة الطلب' },
    { type: 'quality_check', label: 'فحص الجودة', icon: <CheckSquare className="w-5 h-5" />, description: 'فحص جودة الخدمة المقدمة' },
    { type: 'satisfaction_survey', label: 'استطلاع الرضا', icon: <ThumbsUp className="w-5 h-5" />, description: 'قياس رضا العميل' },
    { type: 'technical_support', label: 'دعم فني', icon: <HelpCircle className="w-5 h-5" />, description: 'دعم فني للعميل' }
  ];

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">جاري تحميل بيانات العميل...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">خطأ في تحميل البيانات</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => navigate('/customers')} variant="outline" size="sm">
              العودة للعملاء
            </Button>
            <Button onClick={fetchCustomerData} size="sm" leftIcon={<RefreshCw size={16} />}>
              إعادة المحاولة
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Not found state
  if (!customer) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">لم يتم العثور على العميل</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">العميل المطلوب غير موجود في النظام</p>
          <Button onClick={() => navigate('/customers')} size="sm" className="bg-brand-red-600 hover:bg-brand-red-700">
            العودة إلى قائمة العملاء
          </Button>
        </div>
      </div>
    );
  }

  return (
    <main className="w-full px-4" aria-label="تفاصيل العميل">
      {/* Customer Header - Avatar with Icon, Segment Badge, Name, Phones, Actions */}
      <section className="mb-4">
        <header className="flex items-center justify-between gap-6 border-b border-gray-200 dark:border-gray-800 py-4 px-0 min-h-[72px]">
          {/* Left: Avatar with icon, Name, Segment badge, Phones */}
          <div className="flex items-center gap-5 flex-1 min-w-0" dir="rtl">
            {/* Avatar with segment color and icon */}
            <div className="flex-shrink-0">
              <span className={`flex items-center justify-center w-14 h-14 rounded-full ${getSegmentColor(customer.customer_segment)} bg-opacity-90`}>
                <Award className="w-7 h-7 text-white" />
                </span>
            </div>
            {/* Name, segment badge, phones */}
            <div className="flex flex-col min-w-0 gap-2">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xl font-bold text-gray-900 dark:text-white leading-tight break-words">{customer.full_name || 'معلومات العميل'}</span>
                {customer.customer_segment && (
                  <span className={`px-3 py-0.5 rounded-full text-sm font-semibold ${getSegmentColor(customer.customer_segment)} bg-opacity-90 text-white`}>
                    {customer.customer_segment}
                </span>
              )}
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-0.5">
                {/* Phones as creative badges with copy action */}
                {customer.phone && (
                  <button
                    type="button"
                    onClick={() => handleCopyPhone(customer.phone)}
                    className="flex items-center gap-1 bg-brand-red-500 text-white rounded-full px-3 py-1 text-sm font-medium border border-brand-red-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-red-400 select-text transition-none"
                    style={{ transition: 'none' }}
                    title="نسخ الرقم الرئيسي"
                  >
                    <Phone className="w-4 h-4 text-white" />
                    {customer.phone}
                    {copiedPhone === customer.phone && (
                      <span className="ml-2 text-xs text-white">تم النسخ</span>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
          {/* Right: Actions */}
          <div className="flex flex-row gap-3 items-center">
            
            {/* Refresh Button - compact, matches phone badge */}
            <button
              type="button"
              onClick={fetchCustomerData}
              className="flex items-center justify-center gap-1 bg-transparent rounded-full px-3 py-1 text-sm font-medium text-brand-red-700 dark:text-brand-red-300 border border-brand-red-200 dark:border-brand-red-700 select-none h-10 hover:bg-brand-red-50 dark:hover:bg-brand-red-900/20 transition-colors"
              style={{ transition: 'none' }}
            >
              <RefreshCw className="w-4 h-4 text-brand-red-500" />
              <span className="flex items-center justify-center">تحديث</span>
            </button>
          </div>
        </header>
      </section>

      {/* Clean Order Statistics Tabs with Icons & Underlines */}
      <section className="mb-6">
        <div className="flex flex-wrap gap-1" dir="rtl">
          {/* All Orders */}
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`group relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/50
              ${activeTab === 'all'
                ? 'text-brand-red-600 dark:text-brand-red-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }
            `}
          >
            <Package className={`w-4 h-4 transition-colors duration-200 ${
              activeTab === 'all' ? 'text-brand-red-600 dark:text-brand-red-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
            }`} />
            <span className="font-bold">{orders.length}</span>
            <span>الكل</span>
            {/* Active underline */}
            {activeTab === 'all' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-red-500 rounded-full"></div>
            )}
          </button>

          {/* Delivered */}
          <button
            type="button"
            onClick={() => setActiveTab('delivered')}
            className={`group relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/50
              ${activeTab === 'delivered'
                ? 'text-green-600 dark:text-green-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }
            `}
          >
            <PackageCheck className={`w-4 h-4 transition-colors duration-200 ${
              activeTab === 'delivered' ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
            }`} />
            <span className="font-bold">{deliveredOrders.length}</span>
            <span>موصلة</span>
            {/* Active underline */}
            {activeTab === 'delivered' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500 rounded-full"></div>
            )}
          </button>

          {/* Returned */}
          <button
            type="button"
            onClick={() => setActiveTab('returned')}
            className={`group relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/50
              ${activeTab === 'returned'
                ? 'text-orange-600 dark:text-orange-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }
            `}
          >
            <PackageX className={`w-4 h-4 transition-colors duration-200 ${
              activeTab === 'returned' ? 'text-orange-600 dark:text-orange-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
            }`} />
            <span className="font-bold">{returnedOrders.length}</span>
            <span>مرجعة</span>
            {/* Active underline */}
            {activeTab === 'returned' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full"></div>
            )}
          </button>

          {/* Fulfilled */}
          <button
            type="button"
            onClick={() => setActiveTab('fulfilled')}
            className={`group relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/50
              ${activeTab === 'fulfilled'
                ? 'text-yellow-600 dark:text-yellow-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }
            `}
          >
            <RefreshCw className={`w-4 h-4 transition-colors duration-200 ${
              activeTab === 'fulfilled' ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
            }`} />
            <span className="font-bold">{fulfilledOrders.length}</span>
            <span>تبديل</span>
            {/* Active underline */}
            {activeTab === 'fulfilled' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-500 rounded-full"></div>
            )}
          </button>

          {/* Pending */}
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`group relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/50
              ${activeTab === 'pending'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }
            `}
          >
            <Truck className={`w-4 h-4 transition-colors duration-200 ${
              activeTab === 'pending' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
            }`} />
            <span className="font-bold">{pendingOrders.length}</span>
            <span>قيد التوصيل</span>
            {/* Active underline */}
            {activeTab === 'pending' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full"></div>
            )}
          </button>

          {/* Failed */}
          <button
            type="button"
            onClick={() => setActiveTab('failed')}
            className={`group relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/50
              ${activeTab === 'failed'
                ? 'text-red-600 dark:text-red-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }
            `}
          >
            <XCircle className={`w-4 h-4 transition-colors duration-200 ${
              activeTab === 'failed' ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
            }`} />
            <span className="font-bold">{failedOrders.length}</span>
            <span>فاشلة</span>
            {/* Active underline */}
            {activeTab === 'failed' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500 rounded-full"></div>
            )}
          </button>
        </div>
      </section>

      {/* Orders List */}
      <section aria-label="سجل الطلبات" className="mb-6">
        {getCurrentOrders().length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">لا توجد طلبات في هذه الفئة</p>
          </div>
        ) : (
          <div className="space-y-4">
            {getCurrentOrders().map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                timeline={orderTimelines[order.id]}
                expanded={expandedOrders.has(order.id)}
                onToggle={() => toggleOrderExpansion(order.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Service Actions Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-red-100 dark:bg-brand-red-900/30 rounded-lg flex items-center justify-center">
                  {serviceModalType === 'new-order' && <Package className="w-5 h-5 text-green-600" />}
                  {serviceModalType === 'follow-up' && <CalendarCheck className="w-5 h-5 text-purple-600" />}
                  {(serviceModalType === 'replacement' || serviceModalType === 'return' || serviceModalType === 'maintenance') && <Wrench className="w-5 h-5 text-brand-red-600" />}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {serviceModalType === 'new-order' && 'طلب جديد'}
                    {serviceModalType === 'follow-up' && 'متابعة العميل'}
                    {serviceModalType === 'replacement' && 'استبدال المنتج'}
                    {serviceModalType === 'return' && 'إرجاع المنتج'}
                    {serviceModalType === 'maintenance' && 'صيانة متباعة'}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">العميل: {customer?.full_name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowServiceModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <NewServiceActionForm 
                customer={customer}
                onSubmit={handleFormSubmit}
                onClose={() => {
                  setShowServiceModal(false);
                  setSelectedServiceActionType(null);
                }}
                selectedOrder={selectedOrder}
                orders={orders}
                selectedActionType={selectedServiceActionType}
                modalType={serviceModalType}
              />
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Service FAB with Creative Menu */}
      <FloatingActionButton
        icon={<Plus size={20} />}
        variant="primary"
        size="md"
        position="bottom-start"
        showMenu={true}
        tooltip="خدمات العميل"
        menuItems={[
          {
            label: 'استبدال كلي',
            description: 'استبدال المنتج بآخر جديد',
            icon: <RotateCcw size={18} className="text-brand-red-600" />,
            iconBg: 'bg-red-50 dark:bg-red-900/20',
            badge: 'جديد',
            badgeColor: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
            action: 'full_replacement'
          },
          {
            label: 'استبدال جزئي',
            description: 'استبدال أجزاء معينة',
            icon: <Settings size={18} className="text-orange-600" />,
            iconBg: 'bg-orange-50 dark:bg-orange-900/20',
            badge: 'أجزاء',
            badgeColor: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
            action: 'partial_replacement'
          },
          {
            label: 'إرجاع المنتج',
            description: 'إرجاع المنتج للمستودع',
            icon: <PackageX size={18} className="text-gray-600" />,
            iconBg: 'bg-gray-50 dark:bg-gray-700',
            action: 'return'
          },
          {
            label: 'صيانة متباعة',
            description: 'صيانة شاملة مع متابعة',
            icon: <Wrench size={18} className="text-blue-600" />,
            iconBg: 'bg-blue-50 dark:bg-blue-900/20',
            badge: 'متابعة',
            badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
            action: 'maintenance_follow_up'
          },
          {
            label: 'طلب جديد',
            description: 'إنشاء طلب جديد',
            icon: <Package size={18} className="text-green-600" />,
            iconBg: 'bg-green-50 dark:bg-green-900/20',
            badge: 'جديد',
            badgeColor: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
            action: 'new_order'
          },
          {
            label: 'متابعة العميل',
            description: 'جدولة متابعة للعميل',
            icon: <CalendarCheck size={18} className="text-purple-600" />,
            iconBg: 'bg-purple-50 dark:bg-purple-900/20',
            badge: 'متابعة',
            badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
            action: 'customer_follow_up'
          }
        ]}
        onMenuItemClick={(item) => {
          console.log('Selected service:', item.action);
          // Handle different service actions
          switch (item.action) {
            case 'full_replacement':
              setSelectedServiceActionType('product_swap');
              setServiceModalType('maintenance');
              setShowServiceModal(true);
              break;
            case 'partial_replacement':
              setSelectedServiceActionType('maintenance');
              setServiceModalType('maintenance');
              setShowServiceModal(true);
              break;
            case 'return':
              setSelectedServiceActionType('refund');
              setServiceModalType('maintenance');
              setShowServiceModal(true);
              break;
            case 'maintenance_follow_up':
              setSelectedServiceActionType('maintenance');
              setServiceModalType('maintenance');
              setShowServiceModal(true);
              break;
            case 'new_order':
              // Open new order modal
              setServiceModalType('new-order');
              setShowServiceModal(true);
              break;
            case 'customer_follow_up':
              // Open follow-up modal
              setServiceModalType('follow-up');
              setShowServiceModal(true);
              break;
            default:
              break;
          }
        }}
      />
      
      {/* Follow-up Confirmation */}
      {showConfirmation && (
        <FollowUpConfirmation 
          confirmation={followUpConfirmation}
          onClose={() => {
            setConfirmationAnimating(true);
            setTimeout(() => {
              setShowConfirmation(false);
              setFollowUpConfirmation(null);
              setConfirmationAnimating(false);
            }, 300);
          }}
          animating={confirmationAnimating}
        />
      )}
    </main>
  );
};

export default CustomerDetailPage; 