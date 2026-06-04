import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Settings, 
  Phone, 
  Package, 
  TrendingUp, 
  Search, 
  Filter, 
  Plus, 
  RefreshCw, 
  Download, 
  Eye, 
  ChevronDown, 
  ChevronUp,
  Zap,
  AlertCircle,
  CheckCircle,
  Clock,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Wrench,
  RotateCcw,
  XCircle,
  AlertTriangle,
  Loader,
  XCircle as XCircleIcon,
  CalendarCheck,
  PhoneCall,
  UserCheck,
  Star,
  BarChart3,
  Activity,
  ListTodo,
  MessageSquare,
  FileText,
  Edit3,
  Trash2,
  MoreVertical,
  Circle,
  ArrowRight,
  Bell,
  Timer,
  Target,
  CheckSquare,
  PlayCircle,
  PauseCircle,
  StopCircle,
  SkipForward,
  History
} from 'lucide-react';
import { Card, Button, Input, EmptyState, Badge } from '../../components/ui';
import { api } from '../../services/api';
import NewServiceActionForm from './components/NewServiceActionForm';

const ServiceManagementPage = () => {
  // State Management
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState('follow-ups');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Follow-ups State
  const [followUps, setFollowUps] = useState([]);
  const [followUpFilters, setFollowUpFilters] = useState({
    priority: '',
    status: '',
    days_back: 7,
    follow_up_type: '',
    agent_name: ''
  });
  const [followUpStats, setFollowUpStats] = useState({
    total: 0,
    scheduled: 0,
    completed: 0,
    overdue: 0,
    high_priority: 0
  });
  
  // Service Actions State
  const [serviceActions, setServiceActions] = useState([]);
  const [serviceActionFilters, setServiceActionFilters] = useState({
    action_type: '',
    priority: '',
    status: '',
    date_from: '',
    date_to: '',
    creation_type: 'manual' // Only manual creation allowed
  });
  
  // Analytics State
  const [analytics, setAnalytics] = useState({
    total_follow_ups: 0,
    completion_rate: 0,
    avg_response_time: 0,
    daily_metrics: [],
    manual_actions_created: 0, // Track manual actions only
    auto_actions_disabled: true // Flag to show auto-creation is disabled
  });
  
  // Modal State
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [serviceModalType, setServiceModalType] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [expandedCards, setExpandedCards] = useState(new Set());
  
  // Orders State for Service Modal
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Follow-up Search State
  const [followUpSearchTerm, setFollowUpSearchTerm] = useState('');
  const [followUpSearchResults, setFollowUpSearchResults] = useState([]);
  const [selectedFollowUpOrder, setSelectedFollowUpOrder] = useState(null);
  const [showFollowUpSearch, setShowFollowUpSearch] = useState(false);
  const [loadingFollowUpSearch, setLoadingFollowUpSearch] = useState(false);

  // Follow-up Creation Form State
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);
  const [followUpFormData, setFollowUpFormData] = useState({
    follow_up_type: 'general',
    follow_up_date: '',
    follow_up_time: '',
    follow_up_priority: 'medium',
    agent_name: '',
    follow_up_notes: ''
  });

  // Add function to load customer orders
  const loadCustomerOrders = async (customerPhone) => {
    try {
      console.log('🔄 Loading orders for customer:', customerPhone);
      setLoadingOrders(true);
      const response = await api.customers.getCustomerOrders(customerPhone, {
        limit: 100,
        page: 1
      });
      
      if (response.success) {
        const ordersData = response.data.orders || [];
        console.log('📦 Orders loaded:', ordersData.length);
        
        // Normalize orders data
        const normalizedOrders = ordersData.map(order => ({
          ...order,
          customer_name: order.receiver_name || order.full_name,
          customer_phone: order.receiver_phone || order.phone,
          receiver_name: order.receiver_name || order.full_name,
          receiver_phone: order.receiver_phone || order.phone,
        }));
        
        setOrders(normalizedOrders);
      } else {
        console.error('❌ Failed to load orders:', response.error);
        setOrders([]);
      }
    } catch (error) {
      console.error('❌ Error loading customer orders:', error);
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Add function to search for orders globally
  const searchOrdersGlobally = async (searchTerm) => {
    try {
      console.log('🔍 SEARCH DEBUG - Searching orders globally:', searchTerm);
      setLoadingFollowUpSearch(true);
      
      // Search by tracking number first
      if (searchTerm.match(/^\d+$/)) {
        console.log('🔍 SEARCH DEBUG - Detected tracking number search');
        // If it's a number, search by tracking number
        const response = await api.orders.searchOrders({
          tracking_number: searchTerm
        });
        
        console.log('🔍 SEARCH DEBUG - Tracking number search response:', response);
        
        if (response.success) {
          setFollowUpSearchResults(response.data.orders || []);
          console.log('🔍 SEARCH DEBUG - Found orders by tracking number:', response.data.orders?.length || 0);
          return;
        }
      }
      
      // Search by phone number
      if (searchTerm.match(/^[0-9+\-\s()]+$/)) {
        console.log('🔍 SEARCH DEBUG - Detected phone number search');
        const response = await api.orders.searchOrders({
          customer_phone: searchTerm
        });
        
        console.log('🔍 SEARCH DEBUG - Phone number search response:', response);
        
        if (response.success) {
          setFollowUpSearchResults(response.data.orders || []);
          console.log('🔍 SEARCH DEBUG - Found orders by phone number:', response.data.orders?.length || 0);
          return;
        }
      }
      
      // Search by name or general terms
      console.log('🔍 SEARCH DEBUG - Performing general search');
      const response = await api.orders.searchOrders({
        customer_name: searchTerm,
        product_name: searchTerm,
        receiver_name: searchTerm
      });
      
      console.log('🔍 SEARCH DEBUG - General search response:', response);
      
      if (response.success) {
        setFollowUpSearchResults(response.data.orders || []);
        console.log('🔍 SEARCH DEBUG - Found orders by general search:', response.data.orders?.length || 0);
      } else {
        setFollowUpSearchResults([]);
        console.log('🔍 SEARCH DEBUG - No orders found');
      }
    } catch (error) {
      console.error('❌ Error searching orders:', error);
      setFollowUpSearchResults([]);
    } finally {
      setLoadingFollowUpSearch(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (followUpSearchTerm.trim() && followUpSearchTerm.length >= 2) {
        console.log('🔍 SEARCH DEBUG - Debounced search triggered:', followUpSearchTerm);
        searchOrdersGlobally(followUpSearchTerm);
        setShowFollowUpSearch(true);
      } else {
        console.log('🔍 SEARCH DEBUG - Clearing search results');
        setFollowUpSearchResults([]);
        setShowFollowUpSearch(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [followUpSearchTerm]);

  // Handle order selection for follow-up
  const handleFollowUpOrderSelect = (order) => {
    setSelectedFollowUpOrder(order);
    setFollowUpSearchTerm(order.tracking_number || order.customer_phone || order.customer_name);
    setShowFollowUpSearch(false);
    setFollowUpSearchResults([]);
  };

  // Handle follow-up form submission
  const handleFollowUpFormSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const followUpData = {
        ...followUpFormData,
        customer_phone: selectedFollowUpOrder?.customer_phone || selectedFollowUpOrder?.receiver_phone,
        tracking_number: selectedFollowUpOrder?.tracking_number,
        follow_up_order_id: selectedFollowUpOrder?.id
      };
      
      const response = await api.unifiedCustomerService.command({
        command: 'schedule_follow_up',
        data: followUpData
      });
      
      if (response.success) {
        // Reset form
        setShowFollowUpForm(false);
        setSelectedFollowUpOrder(null);
        setFollowUpSearchTerm('');
        setFollowUpFormData({
          follow_up_type: 'general',
          follow_up_date: '',
          follow_up_time: '',
          follow_up_priority: 'medium',
          agent_name: '',
          follow_up_notes: ''
        });
        
        // Refresh follow-ups
        await fetchFollowUps();
        
        console.log('✅ Follow-up created successfully');
      } else {
        console.error('❌ Failed to create follow-up:', response.error);
      }
    } catch (error) {
      console.error('❌ Error creating follow-up:', error);
    } finally {
      setLoading(false);
    }
  };

  // Tab Configuration with Enhanced Themes
  const tabConfig = [
    {
      id: 'follow-ups',
      label: 'المتابعات',
      description: 'إدارة متابعات العملاء',
      icon: <PhoneCall className="w-4 h-4" />,
      color: 'from-blue-500 to-blue-600',
      badgeColor: 'bg-blue-500',
      stats: followUpStats.total || 0,
      badge: followUpStats.scheduled || 0,
      priority: 'scheduled',
      gradient: 'from-blue-500 to-blue-600',
      hoverGradient: 'from-blue-600 to-blue-700',
      lightColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      textColor: 'text-blue-700 dark:text-blue-400',
      activeColor: 'text-blue-600 dark:text-blue-400',
      activeBg: 'bg-blue-50 dark:bg-blue-900/20',
      activeBorder: 'border-blue-200 dark:border-blue-800'
    },
    {
      id: 'service-actions',
      label: 'إجراءات الخدمة',
      description: 'إدارة إجراءات الصيانة',
      icon: <Wrench className="w-4 h-4" />,
      color: 'from-green-500 to-green-600',
      badgeColor: 'bg-green-500',
      stats: serviceActions.length || 0,
      badge: null,
      gradient: 'from-green-500 to-green-600',
      hoverGradient: 'from-green-600 to-green-700',
      lightColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      textColor: 'text-green-700 dark:text-green-400',
      activeColor: 'text-green-600 dark:text-green-400',
      activeBg: 'bg-green-50 dark:bg-green-900/20',
      activeBorder: 'border-green-200 dark:border-green-800'
    },
    {
      id: 'analytics',
      label: 'التحليلات',
      description: 'الإحصائيات والتقارير',
      icon: <BarChart3 className="w-4 h-4" />,
      color: 'from-purple-500 to-purple-600',
      badgeColor: 'bg-purple-500',
      stats: analytics?.follow_ups?.total || 0,
      badge: null,
      gradient: 'from-purple-500 to-purple-600',
      hoverGradient: 'from-purple-600 to-purple-700',
      lightColor: 'bg-purple-50 dark:bg-purple-900/20',
      borderColor: 'border-purple-200 dark:border-purple-800',
      textColor: 'text-purple-700 dark:text-purple-400',
      activeColor: 'text-purple-600 dark:text-purple-400',
      activeBg: 'bg-purple-50 dark:bg-purple-900/20',
      activeBorder: 'border-purple-200 dark:border-purple-800'
    }
  ];

  // API Functions
  const fetchFollowUps = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      Object.entries(followUpFilters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const response = await api.unifiedCustomerService.getFollowUps(params);
      
      if (response.success) {
        setFollowUps(response.data);
        updateFollowUpStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching follow-ups:', error);
    } finally {
      setLoading(false);
    }
  }, [followUpFilters]);

  const fetchServiceActions = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      Object.entries(serviceActionFilters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const response = await api.unifiedCustomerService.getServiceActions(params);
      
      if (response.success) {
        setServiceActions(response.data);
      }
    } catch (error) {
      console.error('Error fetching service actions:', error);
    } finally {
      setLoading(false);
    }
  }, [serviceActionFilters]);

  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await api.unifiedCustomerService.getAnalytics();
      
      if (response.success) {
        setAnalytics(response.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  }, []);

  const updateFollowUpStats = (followUpData) => {
    const now = new Date();
    
    const stats = {
      total: followUpData.length,
      scheduled: followUpData.filter(f => f.status === 'scheduled').length,
      completed: followUpData.filter(f => f.status === 'completed').length,
      overdue: followUpData.filter(f => {
        const followUpDate = new Date(f.follow_up_date);
        return f.status === 'scheduled' && followUpDate < now;
      }).length,
      high_priority: followUpData.filter(f => f.follow_up_priority === 'urgent' || f.follow_up_priority === 'high').length
    };
    
    setFollowUpStats(stats);
  };

  // Event Handlers
  const handleSearch = (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    
    if (activeTab === 'follow-ups') {
      fetchFollowUps();
    } else if (activeTab === 'service-actions') {
      fetchServiceActions();
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    
    if (activeTab === 'follow-ups') {
      await fetchFollowUps();
    } else if (activeTab === 'service-actions') {
      await fetchServiceActions();
    } else if (activeTab === 'analytics') {
      await fetchAnalytics();
    }
    
    setRefreshing(false);
  };

  const clearFilters = () => {
    setSearchTerm('');
    
    if (activeTab === 'follow-ups') {
      setFollowUpFilters({
        priority: '',
        status: '',
        days_back: 7,
        follow_up_type: '',
        agent_name: ''
      });
    } else if (activeTab === 'service-actions') {
      setServiceActionFilters({
        action_type: '',
        priority: '',
        status: '',
        date_from: '',
        date_to: '',
        creation_type: 'manual'
      });
    }
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchTerm('');
    clearFilters();
  };

  const openServiceModal = (type, item = null) => {
    console.log('🔍 Opening service modal with item:', item);
    setServiceModalType(type);
    setSelectedItem(item);
    setShowServiceModal(true);
    
    // Load orders for the customer if we have customer data
    if (item?.customer_phone) {
      console.log('🔄 Loading orders for customer phone:', item.customer_phone);
      loadCustomerOrders(item.customer_phone);
    } else if (item?.receiver_phone) {
      console.log('🔄 Loading orders for receiver phone:', item.receiver_phone);
      loadCustomerOrders(item.receiver_phone);
    } else {
      console.log('❌ No customer phone found in item:', item);
      setOrders([]);
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      setLoading(true);
      
      // Enforce manual creation - no automatic generation
      const manualServiceData = {
        ...formData,
        requires_service_action: true,
        manual_creation: true,
        manual_processing: true,
        creation_type: 'manual'
      };
      
      const response = await api.unifiedCustomerService.command({ command: 'create_action', data: manualServiceData });
      
      if (response.success) {
        // Refresh data
        await fetchFollowUps();
        await fetchServiceActions();
        
        // Show success message
        // Assuming showNotification is a global function or passed as a prop
        // For now, we'll just log success
        console.log('Service action created manually');
        
        // Close modal
        setShowServiceModal(false);
        setSelectedItem(null);
      } else {
        // Assuming showNotification is a global function or passed as a prop
        // For now, we'll just log error
        console.error('Failed to create manual service action:', response.error);
      }
    } catch (error) {
      console.error('Error creating manual service action:', error);
      // Assuming showNotification is a global function or passed as a prop
      // For now, we'll just log error
      console.error('Error creating manual service action:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeFollowUp = async (followUpId, completionData) => {
    try {
      const response = await api.unifiedCustomerService.command({
        command: 'complete_follow_up',
        data: { follow_up_id: followUpId, ...completionData }
      });
      
      if (response.success) {
        await fetchFollowUps();
      }
    } catch (error) {
      console.error('Error completing follow-up:', error);
    }
  };

  const toggleCardExpansion = (cardId) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  };

  // Utility Functions
  const getPriorityColor = (priority) => {
    const colorMap = {
      'low': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      'medium': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      'high': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      'urgent': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    };
    return colorMap[priority] || 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
  };

  const getStatusColor = (status) => {
    const colorMap = {
      'scheduled': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      'completed': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      'failed': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      'cancelled': 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
  };

  const getFollowUpTypeIcon = (type) => {
    const iconMap = {
      'general': <PhoneCall className="w-4 h-4" />,
      'technical': <Wrench className="w-4 h-4" />,
      'delivery': <Package className="w-4 h-4" />,
      'complaint': <AlertCircle className="w-4 h-4" />
    };
    return iconMap[type] || <PhoneCall className="w-4 h-4" />;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getRelativeTime = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.abs(now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `منذ ${hours} ساعة`;
    } else {
      const days = Math.floor(diffInHours / 24);
      return `منذ ${days} يوم`;
    }
  };

  const isOverdue = (followUpDate, status) => {
    if (status !== 'scheduled') return false;
    const date = new Date(followUpDate);
    const now = new Date();
    return date < now;
  };

  // Effects
  useEffect(() => {
    if (activeTab === 'follow-ups') {
      fetchFollowUps();
    } else if (activeTab === 'service-actions') {
      fetchServiceActions();
    } else if (activeTab === 'analytics') {
      fetchAnalytics();
    }
  }, [activeTab, fetchFollowUps, fetchServiceActions, fetchAnalytics]);

  // Render Components
  const renderCreativeTabs = () => (
    <div className="w-full bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
      {/* Creative Tab Navigation - Professional Design Matching Project Theme */}
      <div className="flex flex-wrap gap-1 p-3">
        {tabConfig.map((tab, index) => {
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`
                group relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all duration-200 rounded-lg border
                ${isActive 
                  ? `${tab.activeBg} ${tab.activeBorder} ${tab.activeColor} shadow-sm` 
                  : 'bg-transparent border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200'
                }
                focus:outline-none focus:ring-2 focus:ring-brand-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900
                min-w-0 hover:scale-105 active:scale-95
              `}
              aria-label={`انتقل إلى ${tab.label}`}
              role="tab"
              aria-selected={isActive}
            >
              {/* Priority Badge for Follow-ups */}
              {tab.id === 'follow-ups' && tab.badge > 0 && (
                <div className={`absolute -top-1 -right-1 w-5 h-5 ${tab.badgeColor} text-white text-xs font-bold rounded-full flex items-center justify-center shadow-sm border-2 border-white dark:border-gray-900 transform scale-110`}>
                  {tab.badge}
                </div>
              )}
              
              {/* Icon with Theme Colors */}
              <div className={`w-4 h-4 transition-colors duration-200 ${
                isActive ? tab.activeColor : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
              }`}>
                {tab.icon}
              </div>
              
              {/* Content with Professional Layout */}
              <div className="flex items-center gap-2">
                <span className={`font-bold text-base ${isActive ? tab.activeColor : 'text-gray-900 dark:text-white'}`}>
                  {tab.stats}
                </span>
                <span className={`truncate ${isActive ? tab.activeColor : 'text-gray-700 dark:text-gray-300'}`}>
                  {tab.label}
                </span>
              </div>
              
              {/* Active underline matching OrdersPage style */}
              {isActive && (
                <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${tab.badgeColor.replace('bg-', 'bg-')} rounded-full`}></div>
              )}
              
              {/* Hover effect overlay */}
              <div className={`absolute inset-0 transition-opacity duration-200 rounded-lg ${
                isActive ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'
              }`}>
                <div className={`w-full h-full ${tab.lightColor.replace('bg-', 'bg-')} opacity-50`}></div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderSearchAndFilters = () => (
    <div className="w-full bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden mb-6">
      {/* Search Bar */}
      <div className="w-full p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
        <form onSubmit={handleSearch} className="w-full flex items-center gap-3">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-gray-400" />
            </div>
            <Input
              placeholder={`البحث في ${tabConfig.find(t => t.id === activeTab)?.label || 'البيانات'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-brand-red-500 focus:border-transparent transition-all duration-200 rounded-lg"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircleIcon className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <Button 
            type="submit" 
            disabled={!searchTerm.trim()}
            className="px-4 py-2.5 text-sm font-medium bg-brand-red-600 hover:bg-brand-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 rounded-lg"
          >
            بحث
          </Button>
          
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={`
              px-4 py-2.5 text-sm font-medium border border-gray-200 dark:border-gray-700 transition-all duration-200 rounded-lg relative
              ${showFilters 
                ? 'bg-brand-red-50 dark:bg-brand-red-900/20 text-brand-red-600 dark:text-brand-red-400 border-brand-red-200 dark:border-brand-red-800' 
                : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
              }
            `}
          >
            <Filter className="w-4 h-4 ml-2" />
            فلاتر
          </Button>
          
          <Button
            type="button"
            onClick={() => {
              if (activeTab === 'follow-ups') {
                setShowFollowUpForm(true);
              } else {
                openServiceModal('service-action');
              }
            }}
            className="px-4 py-2.5 text-sm font-medium bg-green-600 hover:bg-green-700 transition-all duration-200 rounded-lg"
          >
            <Plus className="w-4 h-4 ml-2" />
            إضافة جديد
          </Button>
        </form>
      </div>

      {/* Dynamic Filters Panel */}
      {showFilters && (
        <div className="w-full p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
          {activeTab === 'follow-ups' && renderFollowUpFilters()}
          {activeTab === 'service-actions' && renderServiceActionFilters()}
        </div>
      )}
    </div>
  );

  const renderFollowUpFilters = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            نوع المتابعة
          </label>
          <select
            value={followUpFilters.follow_up_type}
            onChange={(e) => setFollowUpFilters(prev => ({ ...prev, follow_up_type: e.target.value }))}
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-red-500 focus:border-transparent transition-all duration-200"
          >
            <option value="">جميع الأنواع</option>
            <option value="general">عامة</option>
            <option value="technical">تقنية</option>
            <option value="delivery">توصيل</option>
            <option value="complaint">شكوى</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            الأولوية
          </label>
          <select
            value={followUpFilters.priority}
            onChange={(e) => setFollowUpFilters(prev => ({ ...prev, priority: e.target.value }))}
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-red-500 focus:border-transparent transition-all duration-200"
          >
            <option value="">جميع الأولويات</option>
            <option value="low">منخفضة</option>
            <option value="medium">متوسطة</option>
            <option value="high">عالية</option>
            <option value="urgent">عاجلة</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            الحالة
          </label>
          <select
            value={followUpFilters.status}
            onChange={(e) => setFollowUpFilters(prev => ({ ...prev, status: e.target.value }))}
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-red-500 focus:border-transparent transition-all duration-200"
          >
            <option value="">جميع الحالات</option>
            <option value="scheduled">مجدولة</option>
            <option value="completed">مكتملة</option>
            <option value="failed">فاشلة</option>
            <option value="cancelled">ملغية</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            الفترة الزمنية
          </label>
          <select
            value={followUpFilters.days_back}
            onChange={(e) => setFollowUpFilters(prev => ({ ...prev, days_back: parseInt(e.target.value) }))}
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-red-500 focus:border-transparent transition-all duration-200"
          >
            <option value={7}>آخر 7 أيام</option>
            <option value={30}>آخر 30 يوماً</option>
            <option value={90}>آخر 3 أشهر</option>
            <option value={365}>آخر سنة</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            اسم الموظف
          </label>
          <input
            type="text"
            value={followUpFilters.agent_name}
            onChange={(e) => setFollowUpFilters(prev => ({ ...prev, agent_name: e.target.value }))}
            placeholder="اسم الموظف..."
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-red-500 focus:border-transparent transition-all duration-200"
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
          <span className="text-brand-red-600 dark:text-brand-red-400 font-semibold">{followUps.length}</span> نتيجة
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={clearFilters} 
            size="sm"
            className="px-4 py-2 text-sm font-medium"
          >
            مسح الفلاتر
          </Button>
          <Button
            onClick={fetchFollowUps}
            size="sm"
            className="px-6 py-2 text-sm font-medium bg-brand-red-600 hover:bg-brand-red-700 transition-all duration-200 rounded-lg"
          >
            تطبيق
          </Button>
        </div>
      </div>
    </div>
  );

  const renderServiceActionFilters = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            نوع الإجراء
          </label>
          <select
            value={serviceActionFilters.action_type}
            onChange={(e) => setServiceActionFilters(prev => ({ ...prev, action_type: e.target.value }))}
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-red-500 focus:border-transparent transition-all duration-200"
          >
            <option value="">جميع الأنواع</option>
            <option value="maintenance">صيانة</option>
            <option value="product_swap">استبدال المنتج</option>
            <option value="refund">استرداد</option>
            <option value="technical_support">دعم تقني</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            الأولوية
          </label>
          <select
            value={serviceActionFilters.priority}
            onChange={(e) => setServiceActionFilters(prev => ({ ...prev, priority: e.target.value }))}
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-red-500 focus:border-transparent transition-all duration-200"
          >
            <option value="">جميع الأولويات</option>
            <option value="low">منخفضة</option>
            <option value="medium">متوسطة</option>
            <option value="high">عالية</option>
            <option value="urgent">عاجلة</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            الحالة
          </label>
          <select
            value={serviceActionFilters.status}
            onChange={(e) => setServiceActionFilters(prev => ({ ...prev, status: e.target.value }))}
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-red-500 focus:border-transparent transition-all duration-200"
          >
            <option value="">جميع الحالات</option>
            <option value="pending">قيد الانتظار</option>
            <option value="in_progress">قيد التنفيذ</option>
            <option value="completed">مكتملة</option>
            <option value="cancelled">ملغية</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            من تاريخ
          </label>
          <input
            type="date"
            value={serviceActionFilters.date_from}
            onChange={(e) => setServiceActionFilters(prev => ({ ...prev, date_from: e.target.value }))}
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-red-500 focus:border-transparent transition-all duration-200"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            إلى تاريخ
          </label>
          <input
            type="date"
            value={serviceActionFilters.date_to}
            onChange={(e) => setServiceActionFilters(prev => ({ ...prev, date_to: e.target.value }))}
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-red-500 focus:border-transparent transition-all duration-200"
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
          <span className="text-brand-red-600 dark:text-brand-red-400 font-semibold">{serviceActions.length}</span> نتيجة
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
            onClick={clearFilters} 
                size="sm"
            className="px-4 py-2 text-sm font-medium"
              >
            مسح الفلاتر
              </Button>
              <Button
            onClick={fetchServiceActions}
            size="sm"
            className="px-6 py-2 text-sm font-medium bg-brand-red-600 hover:bg-brand-red-700 transition-all duration-200 rounded-lg"
              >
            تطبيق
              </Button>
            </div>
          </div>
    </div>
  );

  // Render Follow-up Card
  const renderFollowUpCard = (followUp) => {
    const isExpanded = expandedCards.has(followUp.follow_up_id);
    const isOverdueFollowUp = isOverdue(followUp.follow_up_date, followUp.status);
    
              return (
      <div key={followUp.follow_up_id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200">
        {/* Card Header */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center gap-2">
                  {getFollowUpTypeIcon(followUp.follow_up_type)}
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                    متابعة #{followUp.follow_up_id}
                  </h3>
                </div>
                
                {/* Priority Badge */}
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(followUp.follow_up_priority)}`}>
                  {followUp.follow_up_priority === 'urgent' ? 'عاجل' : 
                   followUp.follow_up_priority === 'high' ? 'عالية' :
                   followUp.follow_up_priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                </div>
                
                {/* Status Badge */}
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(followUp.status)}`}>
                  {followUp.status === 'scheduled' ? 'مجدولة' :
                   followUp.status === 'completed' ? 'مكتملة' :
                   followUp.status === 'failed' ? 'فشلت' : 'ملغية'}
                </div>
                
                {/* Overdue Indicator */}
                {isOverdueFollowUp && (
                  <div className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                    متأخرة
                  </div>
                )}
              </div>
              
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <p><span className="font-medium">العميل:</span> {followUp.customer_name || followUp.customer_phone}</p>
                <p><span className="font-medium">النوع:</span> {followUp.follow_up_type}</p>
                <p><span className="font-medium">التاريخ:</span> {formatDate(followUp.follow_up_date)}</p>
                {followUp.follow_up_time && (
                  <p><span className="font-medium">الوقت:</span> {followUp.follow_up_time}</p>
                )}
                <p><span className="font-medium">الوكيل:</span> {followUp.agent_name}</p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2 ml-4">
              {/* Add button to open follow-up modal */}
              <button
                onClick={() => {
                  setSelectedFollowUpOrder({
                    customer_phone: followUp.customer_phone,
                    customer_name: followUp.customer_name,
                    tracking_number: followUp.tracking_number,
                    id: followUp.follow_up_order_id
                  });
                  setFollowUpFormData({
                    follow_up_type: followUp.follow_up_type || 'general',
                    follow_up_date: followUp.follow_up_date || '',
                    follow_up_time: followUp.follow_up_time || '',
                    follow_up_priority: followUp.follow_up_priority || 'medium',
                    agent_name: followUp.agent_name || '',
                    follow_up_notes: followUp.follow_up_notes || ''
                  });
                  setShowFollowUpForm(true);
                }}
                className="p-2 text-purple-500 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
                aria-label="فتح متابعة جديدة"
                title="فتح متابعة جديدة"
              >
                <Plus className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => toggleCardExpansion(followUp.follow_up_id)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                aria-label={isExpanded ? 'تصغير التفاصيل' : 'توسيع التفاصيل'}
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              
              {followUp.status === 'scheduled' && (
                <button
                  onClick={() => completeFollowUp(followUp.follow_up_id, { completion_notes: 'تم إكمال المتابعة' })}
                  className="p-2 text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-colors"
                  aria-label="إكمال المتابعة"
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Expanded Content */}
        {isExpanded && (
          <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700">
            <div className="space-y-3">
              {/* Notes */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-2">ملاحظات المتابعة:</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 p-3 rounded-md border border-gray-200 dark:border-gray-700">
                  {followUp.follow_up_notes || 'لا توجد ملاحظات'}
                </p>
              </div>
              
              {/* Order Information */}
              {followUp.tracking_number && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-2">معلومات الطلب:</h4>
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <p><span className="font-medium">رقم التتبع:</span> {followUp.tracking_number}</p>
                    {followUp.order_product_name && (
                      <p><span className="font-medium">المنتج:</span> {followUp.order_product_name}</p>
                    )}
                    {followUp.customer_city && (
                      <p><span className="font-medium">المدينة:</span> {followUp.customer_city}</p>
                    )}
                  </div>
                </div>
              )}
              
              {/* Service Action Information */}
              {followUp.action_id && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-2">معلومات إجراء الخدمة:</h4>
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <p><span className="font-medium">رقم الإجراء:</span> #{followUp.action_id}</p>
                    {followUp.service_action_type && (
                      <p><span className="font-medium">نوع الإجراء:</span> {followUp.service_action_type}</p>
                    )}
                    {followUp.service_action_status && (
                      <p><span className="font-medium">حالة الإجراء:</span> {followUp.service_action_status}</p>
                    )}
                  </div>
                </div>
              )}
              
              {/* Timestamps */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-2">التواريخ:</h4>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <p><span className="font-medium">تاريخ الإنشاء:</span> {formatDate(followUp.created_at)}</p>
                  {followUp.completed_at && (
                    <p><span className="font-medium">تاريخ الإكمال:</span> {formatDate(followUp.completed_at)}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render Content
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 animate-spin text-brand-red-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">جاري تحميل البيانات...</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'follow-ups':
        return (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">إدارة المتابعات</h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">نظام إدارة متابعات العملاء</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{followUpStats.scheduled}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">مجدولة</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-600 dark:text-green-400">{followUpStats.completed}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">مكتملة</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-red-600 dark:text-red-400">{followUpStats.overdue}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">متأخرة</div>
                  </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
              {followUps.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {followUps.map(renderFollowUpCard)}
                </div>
              ) : (
                <EmptyState
                  icon={PhoneCall}
                  title="لا توجد متابعات"
                  description={searchTerm ? "لم يتم العثور على متابعات تطابق البحث" : "لا توجد متابعات مجدولة حالياً"}
                  variant="search"
                  action={
                <Button
                      onClick={() => setShowFollowUpForm(true)}
                      className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700"
                >
                      <Plus className="w-4 h-4 ml-2" />
                      إضافة متابعة جديدة
                </Button>
                  }
                />
              )}
            </div>
          </div>
        );

      case 'service-actions':
        return (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">إدارة إجراءات الخدمة</h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">إدارة وتتبع إجراءات الصيانة والخدمة</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-600 dark:text-green-400">{serviceActions.length}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">إجراءات خدمة</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{analytics.service_actions?.total || 0}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">إجمالي إجراءات الخدمة</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {serviceActions.length > 0 ? (
              <div className="grid gap-4">
                {serviceActions.map((action) => (
                    <div key={action.action_id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          إجراء الخدمة #{action.action_id}
                        </h3>
                        <Badge variant="outline" className="text-xs">
                          {action.action_status}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <p>العميل: {action.customer_name || action.customer_phone}</p>
                        <p>النوع: {action.action_type}</p>
                        <p>الأولوية: {action.priority}</p>
                      </div>
                    </div>
                ))}
              </div>
            ) : (
              <EmptyState
                  icon={Wrench}
                title="لا توجد إجراءات خدمة"
                  description="لا توجد إجراءات خدمة حالياً. ستظهر هنا عند إنشاء إجراءات خدمة جديدة."
                  variant="search"
                action={
                    <Button
                      onClick={() => openServiceModal('service-action')}
                      className="px-4 py-2 text-sm font-medium bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="w-4 h-4 ml-2" />
                      إضافة إجراء خدمة جديد
                  </Button>
                }
              />
            )}
            </div>
          </div>
        );

      case 'analytics':
        return (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">التحليلات والإحصائيات</h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">تحليلات الأداء والإحصائيات</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900 dark:text-white">{analytics.follow_ups?.total || 0}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">إجمالي المتابعات</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900 dark:text-white">{analytics.service_actions?.total || 0}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">إجمالي إجراءات الخدمة</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900 dark:text-white">{analytics.completion_rate ? `${analytics.completion_rate}%` : '0%'}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">معدل الإنجاز</div>
                  </div>
                </div>
              </div>
          </div>

            {/* Content */}
            <div className="p-6">
              {analytics && Object.keys(analytics).length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {/* Analytics Cards */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">إجمالي المتابعات</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {analytics.follow_ups?.total || 0}
                        </p>
                      </div>
                      <div className="text-blue-500">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">إجراءات الخدمة</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {analytics.service_actions?.total || 0}
                        </p>
                      </div>
                      <div className="text-green-500">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">معدل الإنجاز</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {analytics.completion_rate ? `${analytics.completion_rate}%` : '0%'}
                        </p>
                      </div>
                      <div className="text-purple-500">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={BarChart3}
                  title="لا توجد بيانات تحليلية"
                  description="لا توجد بيانات تحليلية متاحة حالياً. ستظهر الإحصائيات هنا عند وجود نشاط في النظام."
                  actionText="تحديث البيانات"
                  onAction={() => fetchAnalytics()}
          />
        )}
      </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full space-y-6">
      {renderCreativeTabs()}
      {renderSearchAndFilters()}
      {renderContent()}
      
      {/* Service Modal */}
      {showServiceModal && (
        <NewServiceActionForm
          customer={{ phone: selectedItem?.customer_phone || selectedItem?.receiver_phone || '' }}
          onSubmit={handleFormSubmit}
          onClose={() => {
            setShowServiceModal(false);
            setSelectedItem(null);
            setOrders([]); // Clear orders when closing
          }}
          selectedOrder={selectedItem}
          orders={orders} // Use the loaded orders instead of empty array
          selectedActionType={null}
          modalType={serviceModalType}
        />
      )}

      {/* Custom Follow-up Creation Form */}
      {showFollowUpForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">إعداد جدولة المتابعة</h2>
                <button
                  onClick={() => {
                    setShowFollowUpForm(false);
                    setSelectedFollowUpOrder(null);
                    setFollowUpSearchTerm('');
                    setFollowUpFormData({
                      follow_up_type: 'general',
                      follow_up_date: '',
                      follow_up_time: '',
                      follow_up_priority: 'medium',
                      agent_name: '',
                      follow_up_notes: ''
                    });
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleFollowUpFormSubmit} className="p-6 space-y-6">
              {/* Order Search Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ربط الطلب (اختياري)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={followUpSearchTerm}
                    onChange={(e) => setFollowUpSearchTerm(e.target.value)}
                    placeholder="ابحث بالاسم أو رقم الهاتف أو رقم التتبع..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  />
                  
                  {/* Search Results Dropdown */}
                  {showFollowUpSearch && followUpSearchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {loadingFollowUpSearch ? (
                        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                          جاري البحث...
                        </div>
                      ) : (
                        followUpSearchResults.map((order) => (
                          <button
                            key={order.id}
                            type="button"
                            onClick={() => handleFollowUpOrderSelect(order)}
                            className="w-full px-4 py-3 text-right hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {order.customer_name || order.receiver_name || 'غير محدد'}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {order.customer_phone || order.receiver_phone || 'غير محدد'}
                                </div>
                                {order.tracking_number && (
                                  <div className="text-xs text-blue-600 dark:text-blue-400">
                                    رقم التتبع: {order.tracking_number}
                                  </div>
                                )}
                              </div>
                              <div className="text-xs text-gray-400 dark:text-gray-500">
                                {order.status}
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
                
                {/* Selected Order Display */}
                {selectedFollowUpOrder && (
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-blue-900 dark:text-blue-100">
                          الطلب المحدد: {selectedFollowUpOrder.customer_name || selectedFollowUpOrder.receiver_name}
                        </div>
                        <div className="text-sm text-blue-700 dark:text-blue-300">
                          {selectedFollowUpOrder.customer_phone || selectedFollowUpOrder.receiver_phone}
                        </div>
                        {selectedFollowUpOrder.tracking_number && (
                          <div className="text-xs text-blue-600 dark:text-blue-400">
                            رقم التتبع: {selectedFollowUpOrder.tracking_number}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFollowUpOrder(null);
                          setFollowUpSearchTerm('');
                        }}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Follow-up Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    نوع المتابعة
                  </label>
                  <select
                    value={followUpFormData.follow_up_type}
                    onChange={(e) => setFollowUpFormData({...followUpFormData, follow_up_type: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  >
                    <option value="general">متابعة عامة</option>
                    <option value="delivery">متابعة التوصيل</option>
                    <option value="support">متابعة الدعم</option>
                    <option value="maintenance">متابعة الصيانة</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    الأولوية
                  </label>
                  <select
                    value={followUpFormData.follow_up_priority}
                    onChange={(e) => setFollowUpFormData({...followUpFormData, follow_up_priority: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  >
                    <option value="low">منخفضة</option>
                    <option value="medium">متوسطة</option>
                    <option value="high">عالية</option>
                    <option value="urgent">عاجلة</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    التاريخ
                  </label>
                  <input
                    type="date"
                    value={followUpFormData.follow_up_date}
                    onChange={(e) => setFollowUpFormData({...followUpFormData, follow_up_date: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    الوقت
                  </label>
                  <input
                    type="time"
                    value={followUpFormData.follow_up_time}
                    onChange={(e) => setFollowUpFormData({...followUpFormData, follow_up_time: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    اسم الموظف
                  </label>
                  <input
                    type="text"
                    value={followUpFormData.agent_name}
                    onChange={(e) => setFollowUpFormData({...followUpFormData, agent_name: e.target.value})}
                    placeholder="اسم الموظف المسؤول"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ملاحظات المتابعة
                  </label>
                  <textarea
                    value={followUpFormData.follow_up_notes}
                    onChange={(e) => setFollowUpFormData({...followUpFormData, follow_up_notes: e.target.value})}
                    placeholder="أدخل ملاحظات المتابعة..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowFollowUpForm(false);
                    setSelectedFollowUpOrder(null);
                    setFollowUpSearchTerm('');
                    setFollowUpFormData({
                      follow_up_type: 'general',
                      follow_up_date: '',
                      follow_up_time: '',
                      follow_up_priority: 'medium',
                      agent_name: '',
                      follow_up_notes: ''
                    });
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  {loading ? 'جاري الحفظ...' : 'جدولة المتابعة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceManagementPage; 