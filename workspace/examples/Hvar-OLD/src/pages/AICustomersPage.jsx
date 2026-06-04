import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, StatusBadge } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import Draggable from 'react-draggable';

// Icons
import { 
  ArrowLeft,
  Phone,
  MapPin,
  Calendar,
  Package,
  DollarSign,
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
  
  UserCheck,
  PhoneCall,
  PackageCheck,
  PackageX,
  Timer,
  Navigation,
  Building,
  Brain,
  Zap,
  Crown,
  Shield,
  TrendingDown,
  Heart,
  Gift,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  CalendarDays,
  Map,
  PieChart,
  LineChart,
  Target as TargetIcon,
  Rocket,
  Lightbulb,
  Sparkles,
  Gem,
  Coins,
  CreditCard,
  Receipt,
  Calculator,
  Database,
  Link,
  Copy,
  Share2,
  Download,
  Filter,
  Search,
  Settings,
  
} from 'lucide-react';

/**
 * MASTERPIECE AI Customers Page - Ultimate Customer Analytics with Advanced AI Insights
 * Features comprehensive customer profiling, behavioral analysis, and predictive insights
 * 1000% better UI/UX than CustomerDetailPage with expert-level design patterns
 * 2025 Timeline Design - Zero Scroll, Maximum Impact
 */

// Custom scrollbar styles for timeline
const timelineStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #3b82f6, #06b6d4);
    border-radius: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, #2563eb, #0891b2);
  }
`;
const AICustomersPage = () => {
  const { phone } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [copiedPhone, setCopiedPhone] = useState(null);
  const [hovered, setHovered] = useState(null); // <-- Move here
  
  // Profile data state
  const [profileData, setProfileData] = useState(null);
  const [timelineData, setTimelineData] = useState(null);
  const [ordersData, setOrdersData] = useState(null);
  const [insightsData, setInsightsData] = useState(null);
  const [crmData, setCrmData] = useState(null);

  // Fetch profile data
  const fetchProfileData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.aiCustomers.getProfile(phone);
      
      if (response.success) {
        setProfileData(response);
      } else {
        setError(response.message || 'لم يتم العثور على العميل');
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
      setError('حدث خطأ في تحميل بيانات العميل');
    } finally {
      setLoading(false);
    }
  };

  // Fetch timeline data
  const fetchTimelineData = async () => {
    setError(null);
    
    try {
      const response = await api.aiCustomers.getTimeline(phone);
      
      if (response.success) {
        setTimelineData(response);
      } else {
        setError(response.message || 'لم يتم العثور على بيانات الجدول الزمني');
      }
    } catch (error) {
      console.error('Error fetching timeline data:', error);
      setError('حدث خطأ في تحميل الجدول الزمني');
    }
  };

  // Fetch orders data
  const fetchOrdersData = async () => {
    setError(null);
    
    try {
      const response = await api.aiCustomers.getOrders(phone);
      
      if (response.success) {
        setOrdersData(response);
      } else {
        setError(response.message || 'لم يتم العثور على بيانات الطلبات');
      }
    } catch (error) {
      console.error('Error fetching orders data:', error);
      setError('حدث خطأ في تحميل الطلبات');
    }
  };

  // Fetch insights data
  const fetchInsightsData = async () => {
    setError(null);
    
    try {
      const response = await api.aiCustomers.getInsights(phone);
      
      if (response.success) {
        setInsightsData(response);
      } else {
        setError(response.message || 'لم يتم العثور على الرؤى الذكية');
      }
    } catch (error) {
      console.error('Error fetching insights data:', error);
      setError('حدث خطأ في تحميل الرؤى الذكية');
    }
  };

  // Fetch CRM data
  const fetchCrmData = async () => {
    setError(null);
    
    try {
      const response = await api.aiCustomers.getCrmHint(phone);
      
      if (response.success) {
        setCrmData(response);
      } else {
        setError(response.message || 'لم يتم العثور على بيانات CRM');
      }
    } catch (error) {
      console.error('Error fetching CRM data:', error);
      setError('حدث خطأ في تحميل بيانات CRM');
    }
  };

  useEffect(() => {
    if (phone) {
      fetchProfileData();
    }
  }, [phone]);

  // Inject custom timeline styles
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = timelineStyles;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // Handle phone copy
  const handleCopyPhone = (number) => {
    if (!number) return;
    navigator.clipboard.writeText(number);
    setCopiedPhone(number);
    setTimeout(() => setCopiedPhone(null), 1200);
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    
    // Fetch data for the selected tab if not already loaded
    if (tab === 'timeline' && !timelineData) {
      fetchTimelineData();
    }
    if (tab === 'orders' && !ordersData) {
      fetchOrdersData();
    }
    if (tab === 'insights' && !insightsData) {
      fetchInsightsData();
    }
    if (tab === 'crm' && !crmData) {
      fetchCrmData();
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

  // Get segment color with enhanced gradients
  const getSegmentColor = (segment) => {
    switch (segment) {
      case 'عميل مميز': return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
      case 'عميل متكرر': return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white';
      case 'عميل عادي': return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white';
      case 'عميل خدمة': return 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white';
      case 'عميل يحتاج متابعة': return 'bg-gradient-to-r from-red-500 to-pink-500 text-white';
      case 'عميل لمرة واحدة': return 'bg-gradient-to-r from-gray-500 to-slate-500 text-white';
      default: return 'bg-gradient-to-r from-gray-400 to-gray-600 text-white';
    }
  };

  // Get value tier color with premium gradients
  const getValueTierColor = (tier) => {
    switch (tier) {
      case 'بلاتيني': return 'bg-gradient-to-r from-purple-600 via-pink-600 to-purple-800 text-white shadow-lg';
      case 'ذهبي': return 'bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-600 text-white shadow-lg';
      case 'فضي': return 'bg-gradient-to-r from-gray-400 via-slate-500 to-gray-600 text-white shadow-lg';
      case 'برونزي': return 'bg-gradient-to-r from-amber-700 via-orange-700 to-amber-900 text-white shadow-lg';
      default: return 'bg-gradient-to-r from-gray-400 to-gray-600 text-white';
    }
  };

  // Get risk level color with enhanced styling
  const getRiskLevelColor = (level) => {
    switch (level) {
      case 'منخفض': return 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-md';
      case 'متوسط': return 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-md';
      case 'عالي': return 'bg-gradient-to-r from-red-400 to-pink-500 text-white shadow-md';
      default: return 'bg-gradient-to-r from-gray-400 to-gray-600 text-white';
    }
  };

  // Get growth potential color
  const getGrowthPotentialColor = (potential) => {
    switch (potential) {
      case 'عالي': return 'bg-gradient-to-r from-emerald-400 to-green-500 text-white shadow-md';
      case 'متوسط': return 'bg-gradient-to-r from-blue-400 to-cyan-500 text-white shadow-md';
      case 'منخفض': return 'bg-gradient-to-r from-gray-400 to-slate-500 text-white shadow-md';
      default: return 'bg-gradient-to-r from-gray-400 to-gray-600 text-white';
    }
  };

  // Get insight priority color
  const getInsightPriorityColor = (priority) => {
    switch (priority) {
      case 'عاجل': return 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg';
      case 'عالية': return 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md';
      case 'متوسطة': return 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-md';
      case 'منخفضة': return 'bg-gradient-to-r from-gray-500 to-slate-500 text-white shadow-md';
      default: return 'bg-gradient-to-r from-gray-400 to-gray-600 text-white';
    }
  };

  // Get opportunity potential color
  const getOpportunityPotentialColor = (potential) => {
    switch (potential) {
      case 'عالي': return 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg';
      case 'متوسط': return 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-md';
      case 'منخفض': return 'bg-gradient-to-r from-gray-500 to-slate-600 text-white shadow-md';
      default: return 'bg-gradient-to-r from-gray-400 to-gray-600 text-white';
    }
  };

  // Get financial health color
  const getFinancialHealthColor = (health) => {
    switch (health) {
      case 'ممتاز': return 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg';
      case 'جيد': return 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-md';
      case 'مقبول': return 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white shadow-md';
      case 'مقلق': return 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg';
      default: return 'bg-gradient-to-r from-gray-400 to-gray-600 text-white';
    }
  };

  // Get journey phase color
  const getJourneyPhaseColor = (phase) => {
    switch (phase) {
      case 'اكتساب': return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white';
      case 'تفعيل': return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white';
      case 'الاحتفاظ': return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
      case 'التفاعل': return 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white';
      case 'خامل': return 'bg-gradient-to-r from-gray-500 to-slate-500 text-white';
      default: return 'bg-gradient-to-r from-gray-400 to-gray-600 text-white';
    }
  };

  // Get event type icon
  const getEventTypeIcon = (type) => {
    switch (type) {
      case 'order_placed': return Package;
      case 'order_picked_up': return PackageCheck;
      case 'order_delivered': return CheckCircle;
      case 'order_returned': return PackageX;
      default: return Clock;
    }
  };

  // Get event type color
  const getEventTypeColor = (type) => {
    switch (type) {
      case 'order_placed': return 'bg-blue-500 text-white';
      case 'order_picked_up': return 'bg-yellow-500 text-white';
      case 'order_delivered': return 'bg-green-500 text-white';
      case 'order_returned': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  // Loading state with enhanced animation
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mx-auto mb-6"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-pink-600 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <div className="space-y-2">
            <p className="text-lg font-semibold text-gray-900 dark:text-white">جاري تحليل بيانات العميل...</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">يتم استخدام الذكاء الاصطناعي لتحليل السلوك</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state with enhanced design
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20">
        <div className="text-center max-w-md">
          <div className="relative mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
              <AlertCircle className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md">
              <XCircle className="w-4 h-4 text-red-500" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">خطأ في تحميل البيانات</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">{error}</p>
          <div className="flex gap-3 justify-center">
            <Button 
              onClick={() => navigate('/customers')} 
              variant="outline" 
              size="lg"
              className="bg-white hover:bg-gray-50 border-gray-300"
            >
              العودة للعملاء
            </Button>
            <Button 
              onClick={fetchProfileData} 
              size="lg"
              leftIcon={<RefreshCw size={18} />}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg"
            >
              إعادة المحاولة
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Not found state with enhanced design
  if (!profileData) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
        <div className="text-center max-w-md">
          <div className="relative mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
              <Brain className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md">
              <Search className="w-4 h-4 text-blue-500" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">لم يتم العثور على العميل</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">العميل المطلوب غير موجود في النظام أو لا يحتوي على بيانات كافية للتحليل</p>
          <Button 
            onClick={() => navigate('/customers')} 
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
          >
            العودة إلى قائمة العملاء
          </Button>
        </div>
      </div>
    );
  }

  return (
    <main className="w-full px-4 bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-purple-900/10 dark:via-gray-900 dark:to-pink-900/10 min-h-screen" aria-label="تحليلات العميل الذكية">
      {/* Header */}
      <section className="mb-6">
        <header className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-pink-600 to-purple-800 rounded-xl shadow-xl p-6 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 min-w-0" dir="rtl">
          
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white mb-1">تحليلات العميل الذكية</h1>
                <p className="text-sm text-purple-100">تحليل متقدم للعميل باستخدام الذكاء الاصطناعي</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {profileData.customer?.phone && (
              <button
                type="button"
                onClick={() => handleCopyPhone(profileData.customer.phone)}
                className="flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white rounded-full px-4 py-2 text-sm font-medium border border-white/30 shadow hover:bg-white/30 transition-all duration-300"
                title="نسخ رقم العميل"
              >
                <Phone className="w-4 h-4 text-white" />
                {profileData.customer.phone}
                {copiedPhone === profileData.customer.phone && (
                  <span className="text-xs text-white bg-green-500 px-2 py-1 rounded-full">تم النسخ</span>
                )}
              </button>
            )}
            <Button
              onClick={fetchProfileData}
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw size={16} />}
              className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30"
            >
              تحديث
            </Button>
          </div>
        </header>
      </section>

      {/* Tabs Navigation */}
      <section className="mb-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-200 dark:border-gray-800 p-2">
          <div className="flex flex-wrap gap-2" dir="rtl">
            <button
              onClick={() => handleTabChange('profile')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-base transition-all duration-300 ${
                activeTab === 'profile'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow'
                  : 'text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20'
              }`}
            >
              <UserCheck size={16} />
              الملف الشخصي
            </button>
            <button
              onClick={() => handleTabChange('timeline')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-base transition-all duration-300 ${
                activeTab === 'timeline'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow'
                  : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
              }`}
            >
              <Clock size={16} />
              الجدول الزمني
            </button>
            <button
              onClick={() => handleTabChange('orders')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-base transition-all duration-300 ${
                activeTab === 'orders'
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow'
                  : 'text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
              }`}
            >
              <Package size={16} />
              الطلبات
            </button>
            <button
              onClick={() => handleTabChange('insights')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-base transition-all duration-300 ${
                activeTab === 'insights'
                  ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow'
                  : 'text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20'
              }`}
            >
              <Brain size={16} />
              الرؤى الذكية
            </button>
            <button
              onClick={() => handleTabChange('crm')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-base transition-all duration-300 ${
                activeTab === 'crm'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow'
                  : 'text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
              }`}
            >
              <Database size={16} />
              تكامل CRM
            </button>
          </div>
        </div>
      </section>

      {/* Profile Tab Content */}
      {activeTab === 'profile' && profileData && (
        <div className="space-y-6">
          {/* Customer Header Card */}
          <Card className="p-6 bg-gradient-to-r from-purple-50 via-pink-50 to-purple-100 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800 shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4" dir="rtl">
                <div className="relative">
                  <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 shadow">
                    <Crown className="w-7 h-7 text-white" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow">
                    <Star className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                    {profileData.customer?.name || 'معلومات العميل'}
                  </h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    {profileData.classification?.segment && (
                      <span className={`px-3 py-1 rounded-full text-xs font-bold shadow ${getSegmentColor(profileData.classification.segment)}`}>
                        {profileData.classification.segment}
                      </span>
                    )}
                    {profileData.classification?.value_tier && (
                      <span className={`px-3 py-1 rounded-full text-xs font-bold shadow ${getValueTierColor(profileData.classification.value_tier)}`}>
                        {profileData.classification.value_tier}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-left">
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {formatCurrency(profileData.metrics?.lifetime_value || 0)}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">القيمة الإجمالية</p>
                <div className="mt-2 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                    +{((profileData.metrics?.lifetime_value || 0) / 1000).toFixed(1)}K قيمة
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Orders */}
            <Card className="p-6 hover:shadow transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">إجمالي الطلبات</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white mb-0.5">
                    {profileData.metrics?.total_orders || 0}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                    {profileData.metrics?.delivered_orders || 0} تم توصيلها
                  </p>
                </div>
                <div className="rounded-full p-3 bg-blue-100 dark:bg-blue-900/30">
                  <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </Card>

            {/* Success Rate */}
            <Card className="p-6 hover:shadow transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">معدل النجاح</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white mb-0.5">
                    {profileData.metrics?.delivery_success_rate?.toFixed(1) || 0}%
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                    {profileData.metrics?.delivered_orders || 0} من {profileData.metrics?.total_orders || 0}
                  </p>
                </div>
                <div className="rounded-full p-3 bg-green-100 dark:bg-green-900/30">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </Card>

            {/* Average Order Value */}
            <Card className="p-6 hover:shadow transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">متوسط قيمة الطلب</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white mb-0.5">
                    {formatCurrency(profileData.metrics?.avg_order_value || 0)}
                  </p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                    {profileData.metrics?.total_orders || 0} طلب إجمالي
                  </p>
                </div>
                <div className="rounded-full p-3 bg-yellow-100 dark:bg-yellow-900/30">
                  <DollarSign className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </Card>

            {/* Days Since Last Order */}
            <Card className="p-6 hover:shadow transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">الأيام منذ آخر طلب</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white mb-0.5">
                    {profileData.metrics?.days_since_last_order || 0}
                  </p>
                  <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                    {profileData.metrics?.days_since_last_order > 30 ? 'يحتاج متابعة' : 'نشط'}
                  </p>
                </div>
                <div className="rounded-full p-3 bg-purple-100 dark:bg-purple-900/30">
                  <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </Card>
          </div>

          {/* Classification and Risk Assessment */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Customer Classification */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="rounded-full p-2 bg-blue-100 dark:bg-blue-900/30">
                  <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">تصنيف العميل</h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">نوع السلوك</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {profileData.classification?.behavior_type || 'غير محدد'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">مستوى المخاطر</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${getRiskLevelColor(profileData.classification?.risk_level)}`}>
                    {profileData.classification?.risk_level || 'غير محدد'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">إمكانية النمو</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${getGrowthPotentialColor(profileData.classification?.growth_potential)}`}>
                    {profileData.classification?.growth_potential || 'غير محدد'}
                  </span>
                </div>
                {profileData.classification?.tags && profileData.classification.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {profileData.classification.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-brand-red-100 dark:bg-brand-red-900/30 text-brand-red-700 dark:text-brand-red-300 rounded-full text-xs font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* Timeline Summary */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="rounded-full p-2 bg-green-100 dark:bg-green-900/30">
                  <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">ملخص الجدول الزمني</h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">إجمالي الأحداث</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {profileData.timeline_summary?.total_events || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">أول تفاعل</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {formatDate(profileData.timeline_summary?.first_interaction)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">آخر تفاعل</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {formatDate(profileData.timeline_summary?.last_interaction)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">الأيام النشطة</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {profileData.timeline_summary?.active_days || 0} يوم
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">تكرار الطلبات</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {profileData.timeline_summary?.order_frequency || 'غير محدد'}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Detailed Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Financial Metrics */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="rounded-full p-2 bg-emerald-100 dark:bg-emerald-900/30">
                  <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">المقاييس المالية</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">إجمالي الإنفاق</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {formatCurrency(profileData.metrics?.total_spent || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">إجمالي الرسوم</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {formatCurrency(profileData.metrics?.total_fees_paid || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">معدل الإرجاع</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {profileData.metrics?.return_rate?.toFixed(1) || 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">معدل طلبات الاستبدال</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {profileData.metrics?.replacement_order_rate?.toFixed(1) || 0}%
                  </span>
                </div>
              </div>
            </Card>

            {/* Order Metrics */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="rounded-full p-2 bg-blue-100 dark:bg-blue-900/30">
                  <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">مقاييس الطلبات</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">الطلبات الموصلة</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {profileData.metrics?.delivered_orders || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">الطلبات المرجعة</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {profileData.metrics?.returned_orders || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">الطلبات الملغاة</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {profileData.metrics?.canceled_orders || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">متوسط وقت التوصيل</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {profileData.metrics?.avg_delivery_time?.toFixed(1) || 0} ساعة
                  </span>
                </div>
              </div>
            </Card>

            {/* Behavioral Metrics */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="rounded-full p-2 bg-purple-100 dark:bg-purple-900/30">
                  <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">مقاييس السلوك</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">سرعة الطلبات</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {profileData.metrics?.order_velocity?.toFixed(2) || 0} طلب/شهر
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">متوسط الفاصل الزمني</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {profileData.metrics?.avg_order_interval?.toFixed(1) || 0} يوم
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">اتساق الطلبات</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {profileData.metrics?.order_consistency?.toFixed(1) || 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">عمر العميل</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {profileData.metrics?.customer_age_days || 0} يوم
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Timeline Tab Content - SNAKE MASTERPIECE DESIGN */}
      {activeTab === 'timeline' && (
        <div className="space-y-6">
          {/* Journey Intelligence Header */}
          <Card className="p-6 bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4" dir="rtl">
                <div className="relative">
                  <div className="flex items-center justify-center w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 shadow-lg">
                    <Clock className="w-7 h-7 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                    <Activity className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">رحلة العميل الزمنية</h2>
                  <p className="text-blue-100">تحليل متقدم للتفاعلات مع الذكاء الاصطناعي</p>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">{timelineData?.journey_analysis?.total_touchpoints || 0}</div>
                  <div className="text-sm text-blue-100">نقاط اللمس</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">{timelineData?.journey_analysis?.journey_duration_days || 0}</div>
                  <div className="text-sm text-blue-100">يوم</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">{timelineData?.journey_analysis?.engagement_score?.toFixed(0) || 0}%</div>
                  <div className="text-sm text-blue-100">التفاعل</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Journey Intelligence Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Current Phase */}
            {timelineData?.journey_analysis && (
              <Card className="p-6 bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <div className="flex items-center gap-3 mb-4">
                  <div className="rounded-full p-2 bg-white/20">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold">المرحلة الحالية</h3>
                </div>
                <div className="text-2xl font-bold mb-3">{timelineData.journey_analysis.current_phase || 'غير محدد'}</div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-white/20 rounded-full h-2">
                    <div 
                      className="bg-white h-2 rounded-full transition-all duration-500 shadow-lg"
                      style={{ width: `${timelineData.journey_analysis.engagement_score || 0}%` }}
                    ></div>
                  </div>
                  <span className="text-lg font-bold">{timelineData.journey_analysis.engagement_score?.toFixed(0) || 0}%</span>
                </div>
              </Card>
            )}

            {/* Journey Phases */}
            {timelineData?.journey_phases && (
              <Card className="p-6 bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <div className="flex items-center gap-3 mb-4">
                  <div className="rounded-full p-2 bg-white/20">
                    <PieChart className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold">مراحل الرحلة</h3>
                </div>
                <div className="space-y-2">
                  {Object.entries(timelineData.journey_phases).slice(0, 3).map(([phase, events]) => (
                    <div key={phase} className="flex items-center justify-between p-2 rounded-lg bg-white/10">
                      <span className="text-sm font-medium">{phase}</span>
                      <span className="text-sm font-bold">{events.length}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* AI Prediction */}
            {timelineData?.journey_analysis?.predicted_next_action && (
              <Card className="p-6 bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <div className="flex items-center gap-3 mb-4">
                  <div className="rounded-full p-2 bg-white/20">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold">التوقع الذكي</h3>
                </div>
                <div className="text-lg font-bold mb-3">{timelineData.journey_analysis.predicted_next_action.action}</div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex-1 bg-white/20 rounded-full h-2">
                    <div 
                      className="bg-white h-2 rounded-full transition-all duration-500 shadow-lg"
                      style={{ width: `${(timelineData.journey_analysis.predicted_next_action.probability || 0) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-lg font-bold">{((timelineData.journey_analysis.predicted_next_action.probability || 0) * 100).toFixed(0)}%</span>
                </div>
                <div className="text-sm text-orange-100">
                  {timelineData.journey_analysis.predicted_next_action.timeframe}
                </div>
              </Card>
            )}

            {/* Customer Metrics */}
            {timelineData?.customer_metrics && (
              <Card className="p-6 bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <div className="flex items-center gap-3 mb-4">
                  <div className="rounded-full p-2 bg-white/20">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold">المقاييس</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">القيمة الإجمالية</span>
                    <span className="text-sm font-bold">{formatCurrency(timelineData.customer_metrics.lifetime_value || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">سرعة الطلبات</span>
                    <span className="text-sm font-bold">{timelineData.customer_metrics.order_velocity?.toFixed(2) || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">معدل النجاح</span>
                    <span className="text-sm font-bold">{timelineData.customer_metrics.delivery_success_rate?.toFixed(0) || 0}%</span>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* SNAKE TIMELINE - Masterpiece Design */}
          {timelineData?.timeline && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-full p-2 bg-gradient-to-r from-green-500 to-emerald-500">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">الأحداث الزمنية</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {timelineData.timeline.length} حدث في رحلة العميل
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                  <button className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    <Search className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Snake Timeline Container */}
              <div className="relative">
                {/* Snake Path - Top Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
                  {timelineData.timeline.slice(0, Math.ceil(timelineData.timeline.length / 2)).map((event, index) => {
                    const EventIcon = getEventTypeIcon(event.type);
                    return (
                      <div key={index} className="group">
                        <div className={`relative p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${
                          event.type === 'order_placed' ? 'border-blue-200 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20' :
                          event.type === 'order_picked_up' ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-900/20' :
                          event.type === 'order_delivered' ? 'border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-900/20' :
                          'border-red-200 bg-red-50 dark:border-red-700 dark:bg-red-900/20'
                        }`}>
                          {/* Event Icon */}
                          <div className={`absolute -top-3 -right-3 flex items-center justify-center w-8 h-8 rounded-full ${getEventTypeColor(event.type)} shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                            <EventIcon className="w-4 h-4 text-white" />
                          </div>
                          
                          {/* Event Content */}
                          <div className="mt-2">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-2">
                              {event.type === 'order_placed' && 'تم إنشاء الطلب'}
                              {event.type === 'order_picked_up' && 'تم استلام الطلب'}
                              {event.type === 'order_delivered' && 'تم توصيل الطلب'}
                              {event.type === 'order_returned' && 'تم إرجاع الطلب'}
                            </h4>
                            
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                <Calendar className="w-3 h-3" />
                                {formatDate(event.timestamp)}
                              </div>
                              
                              {event.tracking_number && (
                                <div className="flex items-center gap-2 text-xs">
                                  <Package className="w-3 h-3 text-gray-500" />
                                  <span className="font-medium text-gray-700 dark:text-gray-300 truncate">
                                    {event.tracking_number}
                                  </span>
                                </div>
                              )}
                              
                              {event.details?.value && (
                                <div className="flex items-center gap-2 text-xs">
                                  <DollarSign className="w-3 h-3 text-gray-500" />
                                  <span className="font-bold text-gray-900 dark:text-white">
                                    {formatCurrency(event.details.value)}
                                  </span>
                                </div>
                              )}
                              
                              {event.details?.location?.city && (
                                <div className="flex items-center gap-2 text-xs">
                                  <MapPin className="w-3 h-3 text-gray-500" />
                                  <span className="text-gray-700 dark:text-gray-300 truncate">
                                    {event.details.location.city}
                                  </span>
                                </div>
                              )}
                              
                              {event.details?.product?.name && (
                                <div className="flex items-center gap-2 text-xs">
                                  <Package className="w-3 h-3 text-gray-500" />
                                  <span className="text-gray-700 dark:text-gray-300 truncate">
                                    {event.details.product.name}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Snake Path - Bottom Row (Reverse Direction) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {timelineData.timeline.slice(Math.ceil(timelineData.timeline.length / 2)).reverse().map((event, index) => {
                    const EventIcon = getEventTypeIcon(event.type);
                    return (
                      <div key={`bottom-${index}`} className="group">
                        <div className={`relative p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${
                          event.type === 'order_placed' ? 'border-blue-200 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20' :
                          event.type === 'order_picked_up' ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-900/20' :
                          event.type === 'order_delivered' ? 'border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-900/20' :
                          'border-red-200 bg-red-50 dark:border-red-700 dark:bg-red-900/20'
                        }`}>
                          {/* Event Icon */}
                          <div className={`absolute -top-3 -left-3 flex items-center justify-center w-8 h-8 rounded-full ${getEventTypeColor(event.type)} shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                            <EventIcon className="w-4 h-4 text-white" />
                          </div>
                          
                          {/* Event Content */}
                          <div className="mt-2">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-2">
                              {event.type === 'order_placed' && 'تم إنشاء الطلب'}
                              {event.type === 'order_picked_up' && 'تم استلام الطلب'}
                              {event.type === 'order_delivered' && 'تم توصيل الطلب'}
                              {event.type === 'order_returned' && 'تم إرجاع الطلب'}
                            </h4>
                            
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                <Calendar className="w-3 h-3" />
                                {formatDate(event.timestamp)}
                              </div>
                              
                              {event.tracking_number && (
                                <div className="flex items-center gap-2 text-xs">
                                  <Package className="w-3 h-3 text-gray-500" />
                                  <span className="font-medium text-gray-700 dark:text-gray-300 truncate">
                                    {event.tracking_number}
                                  </span>
                                </div>
                              )}
                              
                              {event.details?.value && (
                                <div className="flex items-center gap-2 text-xs">
                                  <DollarSign className="w-3 h-3 text-gray-500" />
                                  <span className="font-bold text-gray-900 dark:text-white">
                                    {formatCurrency(event.details.value)}
                                  </span>
                                </div>
                              )}
                              
                              {event.details?.location?.city && (
                                <div className="flex items-center gap-2 text-xs">
                                  <MapPin className="w-3 h-3 text-gray-500" />
                                  <span className="text-gray-700 dark:text-gray-300 truncate">
                                    {event.details.location.city}
                                  </span>
                                </div>
                              )}
                              
                              {event.details?.product?.name && (
                                <div className="flex items-center gap-2 text-xs">
                                  <Package className="w-3 h-3 text-gray-500" />
                                  <span className="text-gray-700 dark:text-gray-300 truncate">
                                    {event.details.product.name}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Snake Path Connector Lines */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Top row connector */}
                  <svg className="absolute top-1/2 left-0 right-0 h-0.5" style={{ top: '25%' }}>
                    <path 
                      d="M 0 50 L 100% 50" 
                      stroke="url(#gradient1)" 
                      strokeWidth="2" 
                      fill="none"
                      strokeDasharray="5,5"
                    />
                    <defs>
                      <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="50%" stopColor="#06b6d4" />
                        <stop offset="100%" stopColor="#10b981" />
                      </linearGradient>
                    </defs>
                  </svg>
                  
                  {/* Bottom row connector */}
                  <svg className="absolute top-1/2 left-0 right-0 h-0.5" style={{ top: '75%' }}>
                    <path 
                      d="M 100% 50 L 0 50" 
                      stroke="url(#gradient2)" 
                      strokeWidth="2" 
                      fill="none"
                      strokeDasharray="5,5"
                    />
                    <defs>
                      <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="50%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#ef4444" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
            </Card>
          )}

          {/* Loading state */}
          {activeTab === 'timeline' && !timelineData && !error && (
            <div className="flex items-center justify-center min-h-[40vh]">
              <div className="text-center">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-cyan-600 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">جاري تحميل الجدول الزمني</h3>
                <p className="text-gray-600 dark:text-gray-400">يتم تحليل رحلة العميل الزمنية</p>
              </div>
            </div>
          )}

          {/* Error state */}
          {activeTab === 'timeline' && error && (
            <div className="flex items-center justify-center min-h-[40vh]">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">خطأ في تحميل الجدول الزمني</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
                <Button 
                  onClick={fetchTimelineData}
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
                >
                  إعادة المحاولة
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Orders Tab Content - REVOLUTIONARY 2025 TIMELINE DESIGN */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {/* Orders Intelligence Header */}
          <Card className="p-6 bg-gradient-to-r from-green-600 via-emerald-600 to-green-700 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4" dir="rtl">
                <div className="relative">
                  <div className="flex items-center justify-center w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 shadow-lg">
                    <Package className="w-7 h-7 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
                    <BarChart3 className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">تحليل الطلبات الذكي</h2>
                  <p className="text-green-100">رؤية شاملة لجميع طلبات العميل مع التحليل المتقدم</p>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">{ordersData?.summary?.total_orders || 0}</div>
                  <div className="text-sm text-green-100">إجمالي الطلبات</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">{formatCurrency(ordersData?.summary?.total_value || 0)}</div>
                  <div className="text-sm text-green-100">القيمة الإجمالية</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">{ordersData?.summary?.delivered_count || 0}</div>
                  <div className="text-sm text-green-100">الموصلة</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Orders Intelligence Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Success Rate */}
            {ordersData?.summary && (
              <Card className="p-6 bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <div className="flex items-center gap-3 mb-4">
                  <div className="rounded-full p-2 bg-white/20">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold">معدل النجاح</h3>
                </div>
                <div className="text-2xl font-bold mb-3">
                  {ordersData.summary.total_orders > 0 
                    ? ((ordersData.summary.delivered_count / ordersData.summary.total_orders) * 100).toFixed(1)
                    : 0}%
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-white/20 rounded-full h-2">
                    <div 
                      className="bg-white h-2 rounded-full transition-all duration-500 shadow-lg"
                      style={{ 
                        width: `${ordersData.summary.total_orders > 0 
                          ? (ordersData.summary.delivered_count / ordersData.summary.total_orders) * 100 
                          : 0}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-lg font-bold">{ordersData.summary.delivered_count || 0}</span>
                </div>
              </Card>
            )}

            {/* Return Rate */}
            {ordersData?.summary && (
              <Card className="p-6 bg-gradient-to-br from-yellow-500 to-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <div className="flex items-center gap-3 mb-4">
                  <div className="rounded-full p-2 bg-white/20">
                    <PackageX className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold">معدل الإرجاع</h3>
                </div>
                <div className="text-2xl font-bold mb-3">
                  {ordersData.summary.total_orders > 0 
                    ? ((ordersData.summary.returned_count / ordersData.summary.total_orders) * 100).toFixed(1)
                    : 0}%
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-white/20 rounded-full h-2">
                    <div 
                      className="bg-white h-2 rounded-full transition-all duration-500 shadow-lg"
                      style={{ 
                        width: `${ordersData.summary.total_orders > 0 
                          ? (ordersData.summary.returned_count / ordersData.summary.total_orders) * 100 
                          : 0}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-lg font-bold">{ordersData.summary.returned_count || 0}</span>
                </div>
              </Card>
            )}

            {/* Average Order Value */}
            {ordersData?.summary && (
              <Card className="p-6 bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <div className="flex items-center gap-3 mb-4">
                  <div className="rounded-full p-2 bg-white/20">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold">متوسط القيمة</h3>
                </div>
                <div className="text-2xl font-bold mb-3">
                  {ordersData.summary.total_orders > 0 
                    ? formatCurrency(ordersData.summary.total_value / ordersData.summary.total_orders)
                    : formatCurrency(0)}
                </div>
                <div className="text-sm text-blue-100">
                  من {ordersData.summary.total_orders || 0} طلب
                </div>
              </Card>
            )}

            {/* Order Types */}
            {ordersData?.summary && (
              <Card className="p-6 bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <div className="flex items-center gap-3 mb-4">
                  <div className="rounded-full p-2 bg-white/20">
                    <PieChart className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold">أنواع الطلبات</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>عادية</span>
                    <span className="font-bold">{ordersData.summary.regular_orders || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>استبدال</span>
                    <span className="font-bold">{ordersData.summary.replacement_orders || 0}</span>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* REVOLUTIONARY ORDERS TIMELINE - FULL SIZE DYNAMIC DESIGN */}
          {ordersData?.orders && ordersData.orders.length > 0 ? (
            <div className="space-y-6">
              {/* Orders Timeline Header */}
              <Card className="p-6 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4" dir="rtl">
                    <div className="relative">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg">
                        <Clock className="w-6 h-6 text-white" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow">
                        <Activity className="w-2 h-2 text-white" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">جدول زمني للطلبات</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {ordersData.orders.length} طلب في {new Set(ordersData.orders.map(o => new Date(o.created_at).toLocaleString('ar-EG', { year: 'numeric', month: 'long' }))).size} شهر
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="p-2 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 shadow-sm border border-gray-200 dark:border-gray-700">
                      <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                    <button className="p-2 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 shadow-sm border border-gray-200 dark:border-gray-700">
                      <Search className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                    <button className="p-2 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 shadow-sm border border-gray-200 dark:border-gray-700">
                      <Download className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>
                </div>
              </Card>

              {/* Revolutionary Timeline Container - Full Size Dynamic */}
              <Card className="p-6">
                <div className="relative min-h-[100vh] overflow-hidden">
                  {/* Dynamic Background Grid */}
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 rounded-xl opacity-60"></div>
                  
                  {/* Orders Timeline - Responsive Circular Flow Design */}
                  <div className="relative h-full">
                    {/* Center Hub - Enhanced */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
                      <div className="relative">
                        <div className="w-32 h-32 bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-white dark:border-gray-800 animate-pulse">
                          <Package className="w-10 h-10 text-white" />
                        </div>
                        <div className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                          <span className="text-sm font-bold text-white">{ordersData.orders.length}</span>
                        </div>
                        <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                          <TrendingUp className="w-3 h-3 text-white" />
                        </div>
                      </div>
                    </div>

                    {/* Orders Orbiting Around Center - Responsive, No Overlap, Draggable */}
                    {(() => {
                      const CARD_SIZE = 120;
                      const MIN_SPACING = 80;
                      const maxVisible = 20;
                      const orders = ordersData.orders.slice(0, maxVisible);
                      const N = orders.length;
                      const angleStep = (2 * Math.PI) / N;
                      const radius = Math.max(
                        220,
                        (CARD_SIZE + MIN_SPACING) / (2 * Math.sin(Math.PI / N))
                      );
                      return (
                        <div className="relative w-full max-w-3xl aspect-square mx-auto min-h-[500px]">
                          {/* Center Hub */}
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
                            <div className="relative">
                              <div className="w-32 h-32 bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-white dark:border-gray-800 animate-pulse">
                                <Package className="w-10 h-10 text-white" />
                              </div>
                              <div className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                                <span className="text-sm font-bold text-white">{ordersData.orders.length}</span>
                              </div>
                              <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                                <TrendingUp className="w-3 h-3 text-white" />
                              </div>
                            </div>
                          </div>
                          {/* Draggable Order Cards */}
                          {orders.map((order, index) => {
                            const angle = index * angleStep - Math.PI / 2;
                            const x = Math.cos(angle) * radius;
                            const y = Math.sin(angle) * radius;
                            const EventIcon = getEventTypeIcon(order.order_status === 'تم التوصيل' ? 'order_delivered' : 
                              order.order_status === 'تم الإرجاع' ? 'order_returned' : 'order_placed');
                            const rotate = angle * (180 / Math.PI) + 90;
                            return (
                              <Draggable
                                key={order.id}
                                bounds="parent"
                                defaultPosition={{ x, y }}
                                position={null}
                                onStart={() => setHovered(order.id)}
                                onStop={() => setHovered(null)}
                              >
                                <div
                                  className={`absolute group cursor-pointer transition-all duration-700 hover:scale-125 z-10 ${hovered === order.id ? 'z-50' : 'z-10'}`}
                                  style={{
                                    left: `50%`,
                                    top: `50%`,
                                    transform: `translate(-50%, -50%) rotate(${rotate}deg)`
                                  }}
                                  onMouseEnter={() => setHovered(order.id)}
                                  onMouseLeave={() => setHovered(null)}
                                >
                                  <div style={{ transform: `rotate(${-rotate}deg)` }} className={`relative p-4 rounded-2xl border-2 transition-all duration-500 transform hover:scale-110 hover:shadow-2xl backdrop-blur-sm ${
                                    order.order_status === 'تم التوصيل' ? 'border-green-300 bg-green-50/90 dark:border-green-700 dark:bg-green-900/30 shadow-green-200 dark:shadow-green-900/50' :
                                    order.order_status === 'تم الإرجاع' ? 'border-yellow-300 bg-yellow-50/90 dark:border-yellow-700 dark:bg-yellow-900/30 shadow-yellow-200 dark:shadow-yellow-900/50' :
                                    order.order_status === 'ملغي' ? 'border-gray-400 bg-gray-50/90 dark:border-gray-700 dark:bg-gray-900/30 shadow-gray-200 dark:shadow-gray-900/50' :
                                    'border-blue-200 bg-blue-50/90 dark:border-blue-700 dark:bg-blue-900/30 shadow-blue-200 dark:shadow-blue-900/50'
                                  }`}>
                                    {/* Enhanced Status Icon */}
                                    <div className={`absolute -top-3 -right-3 flex items-center justify-center w-8 h-8 rounded-full ${getEventTypeColor(order.order_status === 'تم التوصيل' ? 'order_delivered' : 
                                      order.order_status === 'تم الإرجاع' ? 'order_returned' : 'order_placed')} shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                                      <EventIcon className="w-4 h-4 text-white" />
                                    </div>
                                    {/* Enhanced Order Info */}
                                    <div className="text-center">
                                      <div className="text-sm font-bold text-gray-900 dark:text-white mb-2 truncate w-20">
                                        {order.product_info?.name?.substring(0, 12) || 'منتج'}
                                      </div>
                                      <div className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                                        {formatCurrency(order.cod)}
                                      </div>
                                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                                        {new Date(order.created_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}
                                      </div>
                                      <div className="text-xs text-gray-500 dark:text-gray-500 font-medium">
                                        #{order.tracking_number?.substring(0, 8)}
                                      </div>
                                    </div>
                                    {/* Enhanced Hover Details - Always on Top */}
                                    {hovered === order.id && (
                                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 z-50 pointer-events-auto">
                                        <div className="bg-gray-900 text-white text-sm rounded-xl p-4 shadow-2xl whitespace-nowrap backdrop-blur-sm border border-gray-700">
                                          <div className="font-bold text-base mb-2">{order.product_info?.name || 'منتج غير محدد'}</div>
                                          <div className="space-y-1 text-xs">
                                            <div className="flex items-center gap-2">
                                              <Package className="w-3 h-3" />
                                              <span>#{order.tracking_number}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <MapPin className="w-3 h-3" />
                                              <span>{order.location_info?.city || 'غير محدد'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <Calendar className="w-3 h-3" />
                                              <span>{formatDate(order.created_at)}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <DollarSign className="w-3 h-3" />
                                              <span className="font-bold">{formatCurrency(order.cod)}</span>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="w-3 h-3 bg-gray-900 transform rotate-45 absolute top-full left-1/2 -translate-x-1/2 -mt-1.5"></div>
                                      </div>
                                    )}
                                  </div>
                                  {/* Enhanced Connection Line */}
                                  <svg className="absolute top-1/2 left-1/2" style={{ zIndex: 1, pointerEvents: 'none', width: '2px', height: `${radius - 60}px`, transform: `translate(-50%, -100%) rotate(${angle * 180 / Math.PI}deg)` }}>
                                    <defs>
                                      <linearGradient id={`line-gradient-${order.id}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={order.order_status === 'تم التوصيل' ? '#22c55e' : order.order_status === 'تم الإرجاع' ? '#eab308' : '#3b82f6'} />
                                        <stop offset="100%" stopColor="#fff" stopOpacity="0.1" />
                                      </linearGradient>
                                    </defs>
                                    <line x1="1" y1="0" x2="1" y2={radius - 60} stroke={`url(#line-gradient-${order.id})`} strokeWidth="2" strokeDasharray="6,4" />
                                  </svg>
                                </div>
                              </Draggable>
                            );
                          })}
                          {/* If there are more orders, show a +N indicator */}
                          {ordersData.orders.length > maxVisible && (
                            <div className="absolute left-1/2 top-[90%] transform -translate-x-1/2 bg-gradient-to-r from-gray-700 to-gray-900 text-white px-4 py-2 rounded-full shadow-lg text-lg font-bold z-30">
                              +{ordersData.orders.length - maxVisible} أخرى
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Enhanced Connection Lines to Center */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                      {ordersData.orders.slice(0, Math.min(ordersData.orders.length, 16)).map((order, index) => {
                        const angle = (index / Math.min(ordersData.orders.length, 16)) * 2 * Math.PI;
                        const radius = Math.min(window.innerWidth, window.innerHeight) * 0.25;
                        const x1 = window.innerWidth / 2 + Math.cos(angle) * 60;
                        const y1 = window.innerHeight / 2 + Math.sin(angle) * 60;
                        const x2 = window.innerWidth / 2 + Math.cos(angle) * (radius - 40);
                        const y2 = window.innerHeight / 2 + Math.sin(angle) * (radius - 40);
                        
                        return (
                          <line
                            key={`line-${index}`}
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke="url(#gradient-line-enhanced)"
                            strokeWidth="2"
                            strokeDasharray="5,5"
                            opacity="0.4"
                            className="animate-pulse"
                          />
                        );
                      })}
                      <defs>
                        <linearGradient id="gradient-line-enhanced" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="25%" stopColor="#06b6d4" />
                          <stop offset="50%" stopColor="#10b981" />
                          <stop offset="75%" stopColor="#f59e0b" />
                          <stop offset="100%" stopColor="#ef4444" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>

                  {/* Enhanced Timeline Legend */}
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="flex items-center justify-center gap-8 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full bg-green-500 shadow-lg"></div>
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">تم التوصيل</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full bg-yellow-500 shadow-lg"></div>
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">تم الإرجاع</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full bg-blue-500 shadow-lg"></div>
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">قيد الانتظار</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full bg-gray-500 shadow-lg"></div>
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">ملغي</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>


          ) : (
            <div className="flex items-center justify-center min-h-[40vh]">
              <div className="text-center">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">لا توجد طلبات مسجلة لهذا العميل</h3>
                <p className="text-gray-600 dark:text-gray-400">لم يتم العثور على أي طلبات في النظام</p>
              </div>
            </div>
          )}

          {/* Loading state */}
          {activeTab === 'orders' && !ordersData && !error && (
            <div className="flex items-center justify-center min-h-[40vh]">
              <div className="text-center">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-200 border-t-green-600 mx-auto mb-4"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-600 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">جاري تحميل الطلبات</h3>
                <p className="text-gray-600 dark:text-gray-400">يتم تحليل بيانات الطلبات</p>
              </div>
            </div>
          )}

          {/* Error state */}
          {activeTab === 'orders' && error && (
            <div className="flex items-center justify-center min-h-[40vh]">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">خطأ في تحميل الطلبات</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
                <Button 
                  onClick={fetchOrdersData}
                  size="lg"
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                >
                  إعادة المحاولة
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Insights Tab Content - REVOLUTIONARY 2025 TIMELINE DESIGN */}
      {activeTab === 'insights' && (
        <div className="space-y-6">
          {/* AI Intelligence Header - Enhanced with Floating Metrics */}
          <Card className="p-6 bg-gradient-to-r from-orange-600 via-red-600 to-orange-700 text-white shadow-xl relative overflow-hidden">
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16 animate-pulse"></div>
              <div className="absolute top-1/2 right-0 w-24 h-24 bg-white rounded-full translate-x-12 -translate-y-12 animate-pulse" style={{ animationDelay: '1s' }}></div>
              <div className="absolute bottom-0 left-1/3 w-20 h-20 bg-white rounded-full -translate-x-10 translate-y-10 animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>
            
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-4" dir="rtl">
                <div className="relative">
                  <div className="flex items-center justify-center w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 shadow-lg">
                    <Brain className="w-7 h-7 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                    <Zap className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">الرؤى الذكية المتقدمة</h2>
                  <p className="text-orange-100">تحليل سلوكي متقدم مع توقعات ذكية وتوصيات قابلة للتنفيذ</p>
                </div>
              </div>
              
              {/* Floating Metrics Cards */}
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer">
                    <div className="text-3xl font-bold text-white">{insightsData?.insights?.behavioral_patterns?.consistency_score || 0}%</div>
                    <div className="text-sm text-orange-100">اتساق السلوك</div>
                  </div>
                  {/* Hover Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50">
                    <div className="bg-gray-900 text-white text-sm rounded-lg p-2 whitespace-nowrap">
                      درجة اتساق أنماط الطلب
                    </div>
                    <div className="w-2 h-2 bg-gray-900 transform rotate-45 absolute top-full left-1/2 -translate-x-1/2 -mt-1"></div>
                  </div>
                </div>
                
                <div className="relative group">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer">
                    <div className="text-3xl font-bold text-white">{insightsData?.insights?.risk_assessment?.risk_score || 0}</div>
                    <div className="text-sm text-orange-100">مؤشر المخاطر</div>
                  </div>
                  {/* Hover Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50">
                    <div className="bg-gray-900 text-white text-sm rounded-lg p-2 whitespace-nowrap">
                      تقييم مخاطر العميل
                    </div>
                    <div className="w-2 h-2 bg-gray-900 transform rotate-45 absolute top-full left-1/2 -translate-x-1/2 -mt-1"></div>
                  </div>
                </div>
                
                <div className="relative group">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer">
                    <div className="text-3xl font-bold text-white">{insightsData?.insights?.growth_opportunities?.length || 0}</div>
                    <div className="text-sm text-orange-100">فرص النمو</div>
                  </div>
                  {/* Hover Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50">
                    <div className="bg-gray-900 text-white text-sm rounded-lg p-2 whitespace-nowrap">
                      عدد فرص النمو المتاحة
                    </div>
                    <div className="w-2 h-2 bg-gray-900 transform rotate-45 absolute top-full left-1/2 -translate-x-1/2 -mt-1"></div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* REVOLUTIONARY INSIGHTS TIMELINE - ZERO SCROLL DESIGN */}
          {insightsData?.insights ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-400px)] min-h-[600px]">
              {/* Left Column - Behavioral Timeline - Enhanced Circular Design */}
              <Card className="p-6 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute top-4 right-4 w-16 h-16 border-2 border-purple-300 rounded-full"></div>
                  <div className="absolute bottom-4 left-4 w-12 h-12 border-2 border-pink-300 rounded-full"></div>
                </div>
                
                <div className="flex items-center gap-3 mb-6 relative z-10">
                  <div className="relative">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg">
                      <Activity className="w-5 h-5 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow animate-pulse">
                      <TrendingUp className="w-2 h-2 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">تحليل السلوك الزمني</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">أنماط الطلب والتفاعل عبر الزمن</p>
                  </div>
                </div>

                {/* Enhanced Behavioral Timeline - Multi-Layer Circular Flow */}
                <div className="relative h-full">
                  {/* Center Hub - Enhanced with Multiple Rings */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
                    <div className="relative">
                      {/* Outer Ring */}
                      <div className="absolute inset-0 w-32 h-32 border-2 border-purple-300/30 rounded-full animate-spin" style={{ animationDuration: '20s' }}></div>
                      <div className="absolute inset-0 w-28 h-28 border-2 border-pink-300/40 rounded-full animate-spin" style={{ animationDuration: '15s', animationDirection: 'reverse' }}></div>
                      
                      {/* Main Hub */}
                      <div className="w-24 h-24 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-white dark:border-gray-800 animate-pulse">
                        <Brain className="w-8 h-8 text-white" />
                      </div>
                      
                      {/* Score Badge */}
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                        <span className="text-xs font-bold text-white">{insightsData.insights.behavioral_patterns?.consistency_score || 0}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Behavioral Insights Orbiting - Enhanced with Multiple Orbits */}
                  {(() => {
                    const insights = [
                      {
                        title: 'نمط الطلب',
                        value: insightsData.insights.behavioral_patterns?.ordering_pattern || 'غير محدد',
                        icon: Package,
                        color: 'from-blue-500 to-cyan-500',
                        bg: 'from-blue-50 to-cyan-50',
                        border: 'border-blue-200',
                        orbit: 1
                      },
                      {
                        title: 'التفضيلات الزمنية',
                        value: insightsData.insights.behavioral_patterns?.time_preferences?.preferred_hours?.[0]?.[0] || 'غير محدد',
                        icon: Clock,
                        color: 'from-green-500 to-emerald-500',
                        bg: 'from-green-50 to-emerald-50',
                        border: 'border-green-200',
                        orbit: 1
                      },
                      {
                        title: 'المنتجات المفضلة',
                        value: insightsData.insights.product_preferences?.favorite_products?.[0]?.name || 'غير محدد',
                        icon: Heart,
                        color: 'from-red-500 to-pink-500',
                        bg: 'from-red-50 to-pink-50',
                        border: 'border-red-200',
                        orbit: 2
                      },
                      {
                        title: 'الاتجاهات',
                        value: insightsData.insights.behavioral_patterns?.trends?.[0] || 'مستقر',
                        icon: TrendingUp,
                        color: 'from-yellow-500 to-orange-500',
                        bg: 'from-yellow-50 to-orange-50',
                        border: 'border-yellow-200',
                        orbit: 2
                      }
                    ];

                    return (
                      <>
                        {insights.map((insight, index) => {
                          const angle = (index / (insights.length / 2)) * 2 * Math.PI - Math.PI / 2;
                          const radius = insight.orbit === 1 ? 120 : 160;
                          const x = Math.cos(angle) * radius;
                          const y = Math.sin(angle) * radius;
                          const IconComponent = insight.icon;

                          return (
                            <div
                              key={index}
                              className="absolute group cursor-pointer transition-all duration-700 hover:scale-125 z-10"
                              style={{
                                left: `calc(50% + ${x}px)`,
                                top: `calc(50% + ${y}px)`,
                                transform: 'translate(-50%, -50%)'
                              }}
                            >
                              <div className={`relative p-4 rounded-2xl border-2 transition-all duration-500 transform hover:scale-110 hover:shadow-2xl backdrop-blur-sm bg-gradient-to-br ${insight.bg} ${insight.border} shadow-lg`}>
                                {/* Icon with Enhanced Animation */}
                                <div className={`absolute -top-3 -right-3 flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r ${insight.color} shadow-lg group-hover:scale-110 transition-transform duration-200 animate-pulse`}>
                                  <IconComponent className="w-4 h-4 text-white" />
                                </div>
                                
                                {/* Content */}
                                <div className="text-center mt-2">
                                  <div className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                                    {insight.title}
                                  </div>
                                  <div className="text-xs text-gray-700 dark:text-gray-300 truncate w-20">
                                    {insight.value}
                                  </div>
                                </div>

                                {/* Enhanced Hover Details */}
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50">
                                  <div className="bg-gray-900 text-white text-sm rounded-xl p-3 shadow-2xl whitespace-nowrap backdrop-blur-sm border border-gray-700">
                                    <div className="font-bold text-base mb-1">{insight.title}</div>
                                    <div className="text-xs">{insight.value}</div>
                                  </div>
                                  <div className="w-3 h-3 bg-gray-900 transform rotate-45 absolute top-full left-1/2 -translate-x-1/2 -mt-1.5"></div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </>
                    );
                  })()}

                  {/* Enhanced Connection Lines with Multiple Orbits */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                    {/* Inner Orbit */}
                    <circle cx="50%" cy="50%" r="120" fill="none" stroke="url(#gradient-insights-inner)" strokeWidth="1" strokeDasharray="5,5" opacity="0.3" className="animate-pulse" />
                    {/* Outer Orbit */}
                    <circle cx="50%" cy="50%" r="160" fill="none" stroke="url(#gradient-insights-outer)" strokeWidth="1" strokeDasharray="8,8" opacity="0.2" className="animate-pulse" style={{ animationDelay: '1s' }} />
                    
                    <defs>
                      <linearGradient id="gradient-insights-inner" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="25%" stopColor="#ec4899" />
                        <stop offset="50%" stopColor="#06b6d4" />
                        <stop offset="75%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#f59e0b" />
                      </linearGradient>
                      <linearGradient id="gradient-insights-outer" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="25%" stopColor="#8b5cf6" />
                        <stop offset="50%" stopColor="#ec4899" />
                        <stop offset="75%" stopColor="#06b6d4" />
                        <stop offset="100%" stopColor="#10b981" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </Card>

              {/* Right Column - Risk & Opportunities Timeline - Enhanced Snake Design */}
              <Card className="p-6 bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 dark:from-blue-900/20 dark:via-cyan-900/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute top-4 left-4 w-16 h-16 border-2 border-blue-300 rounded-full"></div>
                  <div className="absolute bottom-4 right-4 w-12 h-12 border-2 border-cyan-300 rounded-full"></div>
                </div>
                
                <div className="flex items-center gap-3 mb-6 relative z-10">
                  <div className="relative">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg">
                      <Target className="w-5 h-5 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow animate-pulse">
                      <Rocket className="w-2 h-2 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">المخاطر والفرص</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">تقييم المخاطر وتحديد فرص النمو</p>
                  </div>
                </div>

                {/* Enhanced Risk & Opportunities Timeline - Snake Design with Multiple Layers */}
                <div className="relative h-full">
                  {/* Center Hub - Enhanced with Risk Score */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
                    <div className="relative">
                      {/* Outer Ring */}
                      <div className="absolute inset-0 w-32 h-32 border-2 border-blue-300/30 rounded-full animate-spin" style={{ animationDuration: '25s' }}></div>
                      <div className="absolute inset-0 w-28 h-28 border-2 border-cyan-300/40 rounded-full animate-spin" style={{ animationDuration: '18s', animationDirection: 'reverse' }}></div>
                      
                      {/* Main Hub */}
                      <div className="w-24 h-24 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-white dark:border-gray-800 animate-pulse">
                        <Target className="w-8 h-8 text-white" />
                      </div>
                      
                      {/* Risk Score Badge */}
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                        <span className="text-xs font-bold text-white">{insightsData.insights.risk_assessment?.risk_score || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Risk & Opportunities Orbiting */}
                  {(() => {
                    const riskOpportunities = [
                      {
                        title: 'مستوى المخاطر',
                        value: insightsData.insights.risk_assessment?.overall_risk || 'غير محدد',
                        icon: AlertTriangle,
                        color: 'from-red-500 to-pink-500',
                        bg: 'from-red-50 to-pink-50',
                        border: 'border-red-200',
                        type: 'risk',
                        orbit: 1
                      },
                      {
                        title: 'فرص النمو',
                        value: insightsData.insights.growth_opportunities?.length || 0,
                        icon: Rocket,
                        color: 'from-green-500 to-emerald-500',
                        bg: 'from-green-50 to-emerald-50',
                        border: 'border-green-200',
                        type: 'opportunity',
                        orbit: 1
                      },
                      {
                        title: 'التوصيات',
                        value: insightsData.insights.recommendations?.length || 0,
                        icon: Lightbulb,
                        color: 'from-yellow-500 to-orange-500',
                        bg: 'from-yellow-50 to-orange-50',
                        border: 'border-yellow-200',
                        type: 'recommendation',
                        orbit: 2
                      },
                      {
                        title: 'الصحة المالية',
                        value: insightsData.insights.financial_insights?.financial_health || 'غير محدد',
                        icon: DollarSign,
                        color: 'from-purple-500 to-pink-500',
                        bg: 'from-purple-50 to-pink-50',
                        border: 'border-purple-200',
                        type: 'financial',
                        orbit: 2
                      }
                    ];

                    return (
                      <>
                        {riskOpportunities.map((item, index) => {
                          const angle = (index / (riskOpportunities.length / 2)) * 2 * Math.PI - Math.PI / 2;
                          const radius = item.orbit === 1 ? 120 : 160;
                          const x = Math.cos(angle) * radius;
                          const y = Math.sin(angle) * radius;
                          const IconComponent = item.icon;

                          return (
                            <div
                              key={index}
                              className="absolute group cursor-pointer transition-all duration-700 hover:scale-125 z-10"
                              style={{
                                left: `calc(50% + ${x}px)`,
                                top: `calc(50% + ${y}px)`,
                                transform: 'translate(-50%, -50%)'
                              }}
                            >
                              <div className={`relative p-4 rounded-2xl border-2 transition-all duration-500 transform hover:scale-110 hover:shadow-2xl backdrop-blur-sm bg-gradient-to-br ${item.bg} ${item.border} shadow-lg`}>
                                {/* Icon with Enhanced Animation */}
                                <div className={`absolute -top-3 -right-3 flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r ${item.color} shadow-lg group-hover:scale-110 transition-transform duration-200 animate-pulse`}>
                                  <IconComponent className="w-4 h-4 text-white" />
                                </div>
                                
                                {/* Content */}
                                <div className="text-center mt-2">
                                  <div className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                                    {item.title}
                                  </div>
                                  <div className="text-xs text-gray-700 dark:text-gray-300 truncate w-20">
                                    {item.value}
                                  </div>
                                </div>

                                {/* Enhanced Hover Details */}
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50">
                                  <div className="bg-gray-900 text-white text-sm rounded-xl p-3 shadow-2xl whitespace-nowrap backdrop-blur-sm border border-gray-700">
                                    <div className="font-bold text-base mb-1">{item.title}</div>
                                    <div className="text-xs">{item.value}</div>
                                  </div>
                                  <div className="w-3 h-3 bg-gray-900 transform rotate-45 absolute top-full left-1/2 -translate-x-1/2 -mt-1.5"></div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </>
                    );
                  })()}

                  {/* Enhanced Connection Lines with Multiple Orbits */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                    {/* Inner Orbit */}
                    <circle cx="50%" cy="50%" r="120" fill="none" stroke="url(#gradient-risks-inner)" strokeWidth="1" strokeDasharray="5,5" opacity="0.3" className="animate-pulse" />
                    {/* Outer Orbit */}
                    <circle cx="50%" cy="50%" r="160" fill="none" stroke="url(#gradient-risks-outer)" strokeWidth="1" strokeDasharray="8,8" opacity="0.2" className="animate-pulse" style={{ animationDelay: '1s' }} />
                    
                    <defs>
                      <linearGradient id="gradient-risks-inner" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="25%" stopColor="#06b6d4" />
                        <stop offset="50%" stopColor="#10b981" />
                        <stop offset="75%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#ef4444" />
                      </linearGradient>
                      <linearGradient id="gradient-risks-outer" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#1d4ed8" />
                        <stop offset="25%" stopColor="#3b82f6" />
                        <stop offset="50%" stopColor="#06b6d4" />
                        <stop offset="75%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#f59e0b" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </Card>
            </div>
          ) : (
            <div className="flex items-center justify-center min-h-[40vh]">
              <div className="text-center">
                <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">الرؤى الذكية</h3>
                <p className="text-gray-600 dark:text-gray-400">سيتم إضافة هذه الميزة قريباً</p>
              </div>
            </div>
          )}

          {/* Bottom Section - Enhanced Detailed Insights & Actions - Zero Scroll */}
          {insightsData?.insights && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Enhanced Recommendations Timeline */}
              <Card className="p-6 bg-gradient-to-br from-yellow-50 via-orange-50 to-yellow-100 dark:from-yellow-900/20 dark:via-orange-900/20 dark:to-yellow-900/20 border-yellow-200 dark:border-yellow-800 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute top-2 right-2 w-8 h-8 border border-yellow-300/30 rounded-full"></div>
                <div className="absolute bottom-2 left-2 w-6 h-6 border border-orange-300/30 rounded-full"></div>
                
                <div className="flex items-center gap-3 mb-4 relative z-10">
                  <div className="relative">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 shadow-lg">
                      <Lightbulb className="w-5 h-5 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow animate-pulse">
                      <Zap className="w-2 h-2 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">التوصيات الذكية</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">إجراءات قابلة للتنفيذ</p>
                  </div>
                </div>

                <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-hide relative z-10">
                  {insightsData.insights.recommendations?.slice(0, 5).map((rec, index) => (
                    <div key={index} className="group relative">
                      <div className="p-3 rounded-xl border-2 border-yellow-200 bg-yellow-50/50 dark:border-yellow-700 dark:bg-yellow-900/20 hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-105">
                        <div className="flex items-start gap-3">
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getInsightPriorityColor(rec.priority)} animate-pulse`}>
                            <span className="text-xs font-bold">{index + 1}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-bold text-gray-900 dark:text-white">{rec.action}</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-bold ${getInsightPriorityColor(rec.priority)}`}>
                                {rec.priority}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{rec.details}</p>
                            <p className="text-xs text-green-600 dark:text-green-400 font-medium">{rec.expected_outcome}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Enhanced Growth Opportunities */}
              <Card className="p-6 bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-green-900/20 border-green-200 dark:border-green-800 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute top-2 right-2 w-8 h-8 border border-green-300/30 rounded-full"></div>
                <div className="absolute bottom-2 left-2 w-6 h-6 border border-emerald-300/30 rounded-full"></div>
                
                <div className="flex items-center gap-3 mb-4 relative z-10">
                  <div className="relative">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg">
                      <Rocket className="w-5 h-5 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow animate-pulse">
                      <TrendingUp className="w-2 h-2 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">فرص النمو</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">إمكانيات التطوير</p>
                  </div>
                </div>

                <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-hide relative z-10">
                  {insightsData.insights.growth_opportunities?.slice(0, 4).map((opp, index) => (
                    <div key={index} className="group relative">
                      <div className="p-3 rounded-xl border-2 border-green-200 bg-green-50/50 dark:border-green-700 dark:bg-green-900/20 hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-105">
                        <div className="flex items-start gap-3">
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getOpportunityPotentialColor(opp.potential)} animate-pulse`}>
                            <Rocket className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-bold text-gray-900 dark:text-white">{opp.type}</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-bold ${getOpportunityPotentialColor(opp.potential)}`}>
                                {opp.potential}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{opp.strategy}</p>
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{opp.expected_impact}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Enhanced Financial & Risk Summary */}
              <Card className="p-6 bg-gradient-to-br from-red-50 via-pink-50 to-red-100 dark:from-red-900/20 dark:via-pink-900/20 dark:to-red-900/20 border-red-200 dark:border-red-800 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute top-2 right-2 w-8 h-8 border border-red-300/30 rounded-full"></div>
                <div className="absolute bottom-2 left-2 w-6 h-6 border border-pink-300/30 rounded-full"></div>
                
                <div className="flex items-center gap-3 mb-4 relative z-10">
                  <div className="relative">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-red-500 to-pink-500 shadow-lg">
                      <AlertTriangle className="w-5 h-5 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center shadow animate-pulse">
                      <Shield className="w-2 h-2 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">المخاطر والمالية</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">تقييم شامل</p>
                  </div>
                </div>

                <div className="space-y-4 relative z-10">
                  {/* Enhanced Risk Assessment */}
                  <div className="p-3 rounded-xl border-2 border-red-200 bg-red-50/50 dark:border-red-700 dark:bg-red-900/20 hover:shadow-lg transition-all duration-300 hover:scale-105">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
                      <span className="text-sm font-bold text-gray-900 dark:text-white">تقييم المخاطر</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${getRiskLevelColor(insightsData.insights.risk_assessment?.overall_risk)}`}>
                        {insightsData.insights.risk_assessment?.overall_risk || 'غير محدد'}
                      </span>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        النقاط: {insightsData.insights.risk_assessment?.risk_score || 0}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {insightsData.insights.risk_assessment?.risk_factors?.slice(0, 2).map((factor, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                          <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                          {factor}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Enhanced Financial Health */}
                  <div className="p-3 rounded-xl border-2 border-emerald-200 bg-emerald-50/50 dark:border-emerald-700 dark:bg-emerald-900/20 hover:shadow-lg transition-all duration-300 hover:scale-105">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-4 h-4 text-emerald-500 animate-pulse" />
                      <span className="text-sm font-bold text-gray-900 dark:text-white">الصحة المالية</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${getFinancialHealthColor(insightsData.insights.financial_insights?.financial_health)}`}>
                        {insightsData.insights.financial_insights?.financial_health || 'غير محدد'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      الاتجاه: {insightsData.insights.financial_insights?.spending_trend || 'غير محدد'}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Loading state */}
          {activeTab === 'insights' && !insightsData && !error && (
            <div className="flex items-center justify-center min-h-[40vh]">
              <div className="text-center">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-200 border-t-orange-600 mx-auto mb-4"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-red-600 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">جاري تحليل الرؤى الذكية</h3>
                <p className="text-gray-600 dark:text-gray-400">يتم استخدام الذكاء الاصطناعي لتحليل السلوك</p>
              </div>
            </div>
          )}

          {/* Error state */}
          {activeTab === 'insights' && error && (
            <div className="flex items-center justify-center min-h-[40vh]">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">خطأ في تحميل الرؤى الذكية</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
                <Button 
                  onClick={fetchInsightsData}
                  size="lg"
                  className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white"
                >
                  إعادة المحاولة
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CRM Tab Content - REVOLUTIONARY 2025 ZERO-SCROLL TIMELINE DESIGN */}
      {activeTab === 'crm' && (
        <div className="space-y-6">
          {/* CRM Intelligence Header - Enhanced with Floating Integration Status */}
          <Card className="p-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white shadow-xl relative overflow-hidden">
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16 animate-pulse"></div>
              <div className="absolute top-1/2 right-0 w-24 h-24 bg-white rounded-full translate-x-12 -translate-y-12 animate-pulse" style={{ animationDelay: '1s' }}></div>
              <div className="absolute bottom-0 left-1/3 w-20 h-20 bg-white rounded-full -translate-x-10 translate-y-10 animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>
            
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-4" dir="rtl">
                <div className="relative">
                  <div className="flex items-center justify-center w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 shadow-lg">
                    <Database className="w-7 h-7 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                    <Link className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">تكامل نظام إدارة العملاء</h2>
                  <p className="text-indigo-100">ربط متقدم مع أنظمة CRM مع تحليل البيانات الذكي</p>
                </div>
              </div>
              
              {/* Floating Integration Status Cards */}
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer">
                    <div className="text-3xl font-bold text-white">{crmData?.crm_hint?.available_data?.total_orders || 0}</div>
                    <div className="text-sm text-indigo-100">الطلبات المتاحة</div>
                  </div>
                  {/* Hover Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50">
                    <div className="bg-gray-900 text-white text-sm rounded-lg p-2 whitespace-nowrap">
                      إجمالي الطلبات القابلة للربط
                    </div>
                    <div className="w-2 h-2 bg-gray-900 transform rotate-45 absolute top-full left-1/2 -translate-x-1/2 -mt-1"></div>
                  </div>
                </div>
                
                <div className="relative group">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer">
                    <div className="text-3xl font-bold text-white">{crmData?.implementation_notes?.api_version || 'v2'}</div>
                    <div className="text-sm text-indigo-100">إصدار API</div>
                  </div>
                  {/* Hover Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50">
                    <div className="bg-gray-900 text-white text-sm rounded-lg p-2 whitespace-nowrap">
                      إصدار واجهة برمجة التطبيقات
                    </div>
                    <div className="w-2 h-2 bg-gray-900 transform rotate-45 absolute top-full left-1/2 -translate-x-1/2 -mt-1"></div>
                  </div>
                </div>
                
                <div className="relative group">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer">
                    <div className="text-3xl font-bold text-white">{crmData?.implementation_notes?.webhook_ready ? '✅' : '⏳'}</div>
                    <div className="text-sm text-indigo-100">Webhook</div>
                  </div>
                  {/* Hover Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50">
                    <div className="bg-gray-900 text-white text-sm rounded-lg p-2 whitespace-nowrap">
                      جاهز لاستقبال الإشعارات الفورية
                    </div>
                    <div className="w-2 h-2 bg-gray-900 transform rotate-45 absolute top-full left-1/2 -translate-x-1/2 -mt-1"></div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* REVOLUTIONARY CRM TIMELINE - ZERO SCROLL DESIGN */}
          {crmData?.crm_hint ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-400px)] min-h-[600px]">
              {/* Left Column - Integration Timeline - Enhanced DNA Helix Design */}
              <Card className="p-6 bg-gradient-to-br from-indigo-50 via-purple-50 to-indigo-100 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-indigo-900/20 border-indigo-200 dark:border-indigo-800 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute top-4 right-4 w-16 h-16 border-2 border-indigo-300 rounded-full"></div>
                  <div className="absolute bottom-4 left-4 w-12 h-12 border-2 border-purple-300 rounded-full"></div>
                </div>
                
                <div className="flex items-center gap-3 mb-6 relative z-10">
                  <div className="relative">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 shadow-lg">
                      <Link className="w-5 h-5 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow animate-pulse">
                      <Zap className="w-2 h-2 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">نقاط التكامل</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">واجهات برمجة التطبيقات المتاحة</p>
                  </div>
                </div>

                {/* Enhanced Integration Timeline - DNA Helix Design */}
                <div className="relative h-full">
                  {/* Center Hub - Enhanced with Integration Status */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
                    <div className="relative">
                      {/* Outer Ring */}
                      <div className="absolute inset-0 w-32 h-32 border-2 border-indigo-300/30 rounded-full animate-spin" style={{ animationDuration: '20s' }}></div>
                      <div className="absolute inset-0 w-28 h-28 border-2 border-purple-300/40 rounded-full animate-spin" style={{ animationDuration: '15s', animationDirection: 'reverse' }}></div>
                      
                      {/* Main Hub */}
                      <div className="w-24 h-24 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-white dark:border-gray-800 animate-pulse">
                        <Database className="w-8 h-8 text-white" />
                      </div>
                      
                      {/* Integration Status Badge */}
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                        <span className="text-xs font-bold text-white">API</span>
                      </div>
                    </div>
                  </div>

                  {/* Integration Points Orbiting - Enhanced with DNA Helix Pattern */}
                  {(() => {
                    const integrationPoints = [
                      {
                        title: 'الملف الشخصي',
                        endpoint: crmData.crm_hint.integration_points.profile_endpoint,
                        icon: UserCheck,
                        color: 'from-blue-500 to-cyan-500',
                        bg: 'from-blue-50 to-cyan-50',
                        border: 'border-blue-200',
                        orbit: 1,
                        available: crmData.crm_hint.available_data.has_profile
                      },
                      {
                        title: 'الجدول الزمني',
                        endpoint: crmData.crm_hint.integration_points.timeline_endpoint,
                        icon: Clock,
                        color: 'from-green-500 to-emerald-500',
                        bg: 'from-green-50 to-emerald-50',
                        border: 'border-green-200',
                        orbit: 1,
                        available: crmData.crm_hint.available_data.has_timeline
                      },
                      {
                        title: 'الطلبات',
                        endpoint: crmData.crm_hint.integration_points.orders_endpoint,
                        icon: Package,
                        color: 'from-purple-500 to-pink-500',
                        bg: 'from-purple-50 to-pink-50',
                        border: 'border-purple-200',
                        orbit: 2,
                        available: crmData.crm_hint.available_data.has_profile
                      },
                      {
                        title: 'الرؤى الذكية',
                        endpoint: crmData.crm_hint.integration_points.insights_endpoint,
                        icon: Brain,
                        color: 'from-orange-500 to-red-500',
                        bg: 'from-orange-50 to-red-50',
                        border: 'border-orange-200',
                        orbit: 2,
                        available: crmData.crm_hint.available_data.has_insights
                      }
                    ];

                    return (
                      <>
                        {integrationPoints.map((point, index) => {
                          const angle = (index / (integrationPoints.length / 2)) * 2 * Math.PI - Math.PI / 2;
                          const radius = point.orbit === 1 ? 120 : 160;
                          const x = Math.cos(angle) * radius;
                          const y = Math.sin(angle) * radius;
                          const IconComponent = point.icon;

                          return (
                            <div
                              key={index}
                              className="absolute group cursor-pointer transition-all duration-700 hover:scale-125 z-10"
                              style={{
                                left: `calc(50% + ${x}px)`,
                                top: `calc(50% + ${y}px)`,
                                transform: 'translate(-50%, -50%)'
                              }}
                            >
                              <div className={`relative p-4 rounded-2xl border-2 transition-all duration-500 transform hover:scale-110 hover:shadow-2xl backdrop-blur-sm bg-gradient-to-br ${point.bg} ${point.border} shadow-lg ${!point.available ? 'opacity-50' : ''}`}>
                                {/* Icon with Enhanced Animation */}
                                <div className={`absolute -top-3 -right-3 flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r ${point.color} shadow-lg group-hover:scale-110 transition-transform duration-200 animate-pulse`}>
                                  <IconComponent className="w-4 h-4 text-white" />
                                </div>
                                
                                {/* Status Indicator */}
                                <div className={`absolute -top-1 -left-1 w-4 h-4 rounded-full ${point.available ? 'bg-green-500' : 'bg-gray-400'} shadow-lg animate-pulse`}></div>
                                
                                {/* Content */}
                                <div className="text-center mt-2">
                                  <div className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                                    {point.title}
                                  </div>
                                  <div className="text-xs text-gray-700 dark:text-gray-300 truncate w-20">
                                    {point.available ? 'متاح' : 'غير متاح'}
                                  </div>
                                </div>

                                {/* Enhanced Hover Details */}
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50">
                                  <div className="bg-gray-900 text-white text-sm rounded-xl p-3 shadow-2xl whitespace-nowrap backdrop-blur-sm border border-gray-700">
                                    <div className="font-bold text-base mb-1">{point.title}</div>
                                    <div className="text-xs mb-2">{point.endpoint}</div>
                                    <div className="text-xs text-green-400">{point.available ? '✅ متاح' : '❌ غير متاح'}</div>
                                  </div>
                                  <div className="w-3 h-3 bg-gray-900 transform rotate-45 absolute top-full left-1/2 -translate-x-1/2 -mt-1.5"></div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </>
                    );
                  })()}

                  {/* Enhanced Connection Lines with DNA Helix Pattern */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                    {/* Inner Orbit */}
                    <circle cx="50%" cy="50%" r="120" fill="none" stroke="url(#gradient-crm-inner)" strokeWidth="1" strokeDasharray="5,5" opacity="0.3" className="animate-pulse" />
                    {/* Outer Orbit */}
                    <circle cx="50%" cy="50%" r="160" fill="none" stroke="url(#gradient-crm-outer)" strokeWidth="1" strokeDasharray="8,8" opacity="0.2" className="animate-pulse" style={{ animationDelay: '1s' }} />
                    
                    <defs>
                      <linearGradient id="gradient-crm-inner" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="25%" stopColor="#8b5cf6" />
                        <stop offset="50%" stopColor="#06b6d4" />
                        <stop offset="75%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#f59e0b" />
                      </linearGradient>
                      <linearGradient id="gradient-crm-outer" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#1d4ed8" />
                        <stop offset="25%" stopColor="#6366f1" />
                        <stop offset="50%" stopColor="#8b5cf6" />
                        <stop offset="75%" stopColor="#06b6d4" />
                        <stop offset="100%" stopColor="#10b981" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </Card>

              {/* Right Column - Data Mapping Timeline - Enhanced Neural Network Design */}
              <Card className="p-6 bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 dark:from-emerald-900/20 dark:via-teal-900/20 dark:to-emerald-900/20 border-emerald-200 dark:border-emerald-800 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute top-4 left-4 w-16 h-16 border-2 border-emerald-300 rounded-full"></div>
                  <div className="absolute bottom-4 right-4 w-12 h-12 border-2 border-teal-300 rounded-full"></div>
                </div>
                
                <div className="flex items-center gap-3 mb-6 relative z-10">
                  <div className="relative">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg">
                      <Target className="w-5 h-5 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow animate-pulse">
                      <Database className="w-2 h-2 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">تخطيط البيانات</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">حقول CRM المقترحة</p>
                  </div>
                </div>

                {/* Enhanced Data Mapping Timeline - Neural Network Design */}
                <div className="relative h-full">
                  {/* Center Hub - Enhanced with Data Quality */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
                    <div className="relative">
                      {/* Outer Ring */}
                      <div className="absolute inset-0 w-32 h-32 border-2 border-emerald-300/30 rounded-full animate-spin" style={{ animationDuration: '25s' }}></div>
                      <div className="absolute inset-0 w-28 h-28 border-2 border-teal-300/40 rounded-full animate-spin" style={{ animationDuration: '18s', animationDirection: 'reverse' }}></div>
                      
                      {/* Main Hub */}
                      <div className="w-24 h-24 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-white dark:border-gray-800 animate-pulse">
                        <Target className="w-8 h-8 text-white" />
                      </div>
                      
                      {/* Data Quality Badge */}
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                        <span className="text-xs font-bold text-white">85%</span>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Data Fields Orbiting */}
                  {(() => {
                    const dataFields = [
                      {
                        title: 'نوع العميل',
                        value: crmData.crm_hint.suggested_crm_fields.customer_type,
                        icon: UserCheck,
                        color: 'from-blue-500 to-cyan-500',
                        bg: 'from-blue-50 to-cyan-50',
                        border: 'border-blue-200',
                        type: 'field',
                        orbit: 1
                      },
                      {
                        title: 'سجل الخدمة',
                        value: crmData.crm_hint.suggested_crm_fields.service_history,
                        icon: Package,
                        color: 'from-green-500 to-emerald-500',
                        bg: 'from-green-50 to-emerald-50',
                        border: 'border-green-200',
                        type: 'field',
                        orbit: 1
                      },
                      {
                        title: 'المنتجات المفضلة',
                        value: crmData.crm_hint.suggested_crm_fields.preferred_products,
                        icon: Heart,
                        color: 'from-red-500 to-pink-500',
                        bg: 'from-red-50 to-pink-50',
                        border: 'border-red-200',
                        type: 'field',
                        orbit: 2
                      },
                      {
                        title: 'مؤشرات المخاطر',
                        value: crmData.crm_hint.suggested_crm_fields.risk_indicators,
                        icon: AlertTriangle,
                        color: 'from-yellow-500 to-orange-500',
                        bg: 'from-yellow-50 to-orange-50',
                        border: 'border-yellow-200',
                        type: 'field',
                        orbit: 2
                      }
                    ];

                    return (
                      <>
                        {dataFields.map((field, index) => {
                          const angle = (index / (dataFields.length / 2)) * 2 * Math.PI - Math.PI / 2;
                          const radius = field.orbit === 1 ? 120 : 160;
                          const x = Math.cos(angle) * radius;
                          const y = Math.sin(angle) * radius;
                          const IconComponent = field.icon;

                          return (
                            <div
                              key={index}
                              className="absolute group cursor-pointer transition-all duration-700 hover:scale-125 z-10"
                              style={{
                                left: `calc(50% + ${x}px)`,
                                top: `calc(50% + ${y}px)`,
                                transform: 'translate(-50%, -50%)'
                              }}
                            >
                              <div className={`relative p-4 rounded-2xl border-2 transition-all duration-500 transform hover:scale-110 hover:shadow-2xl backdrop-blur-sm bg-gradient-to-br ${field.bg} ${field.border} shadow-lg`}>
                                {/* Icon with Enhanced Animation */}
                                <div className={`absolute -top-3 -right-3 flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r ${field.color} shadow-lg group-hover:scale-110 transition-transform duration-200 animate-pulse`}>
                                  <IconComponent className="w-4 h-4 text-white" />
                                </div>
                                
                                {/* Content */}
                                <div className="text-center mt-2">
                                  <div className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                                    {field.title}
                                  </div>
                                  <div className="text-xs text-gray-700 dark:text-gray-300 truncate w-20">
                                    متاح
                                  </div>
                                </div>

                                {/* Enhanced Hover Details */}
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50">
                                  <div className="bg-gray-900 text-white text-sm rounded-xl p-3 shadow-2xl whitespace-nowrap backdrop-blur-sm border border-gray-700">
                                    <div className="font-bold text-base mb-1">{field.title}</div>
                                    <div className="text-xs">{field.value}</div>
                                  </div>
                                  <div className="w-3 h-3 bg-gray-900 transform rotate-45 absolute top-full left-1/2 -translate-x-1/2 -mt-1.5"></div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </>
                    );
                  })()}

                  {/* Enhanced Connection Lines with Neural Network Pattern */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                    {/* Inner Orbit */}
                    <circle cx="50%" cy="50%" r="120" fill="none" stroke="url(#gradient-data-inner)" strokeWidth="1" strokeDasharray="5,5" opacity="0.3" className="animate-pulse" />
                    {/* Outer Orbit */}
                    <circle cx="50%" cy="50%" r="160" fill="none" stroke="url(#gradient-data-outer)" strokeWidth="1" strokeDasharray="8,8" opacity="0.2" className="animate-pulse" style={{ animationDelay: '1s' }} />
                    
                    <defs>
                      <linearGradient id="gradient-data-inner" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="25%" stopColor="#14b8a6" />
                        <stop offset="50%" stopColor="#06b6d4" />
                        <stop offset="75%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                      <linearGradient id="gradient-data-outer" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#059669" />
                        <stop offset="25%" stopColor="#10b981" />
                        <stop offset="50%" stopColor="#14b8a6" />
                        <stop offset="75%" stopColor="#06b6d4" />
                        <stop offset="100%" stopColor="#3b82f6" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </Card>
            </div>
          ) : (
            <div className="flex items-center justify-center min-h-[40vh]">
              <div className="text-center">
                <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">تكامل CRM</h3>
                <p className="text-gray-600 dark:text-gray-400">سيتم إضافة هذه الميزة قريباً</p>
              </div>
            </div>
          )}

          {/* Bottom Section - Enhanced Implementation Timeline - Zero Scroll */}
          {crmData?.crm_hint && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Enhanced Available Data Timeline */}
              <Card className="p-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute top-2 right-2 w-8 h-8 border border-blue-300/30 rounded-full"></div>
                <div className="absolute bottom-2 left-2 w-6 h-6 border border-indigo-300/30 rounded-full"></div>
                
                <div className="flex items-center gap-3 mb-4 relative z-10">
                  <div className="relative">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 shadow-lg">
                      <Database className="w-5 h-5 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow animate-pulse">
                      <CheckCircle className="w-2 h-2 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">البيانات المتاحة</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">معلومات العميل القابلة للربط</p>
                  </div>
                </div>

                <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-hide relative z-10">
                  {Object.entries(crmData.crm_hint.available_data).map(([key, value], index) => (
                    <div key={index} className="group relative">
                      <div className="p-3 rounded-xl border-2 border-blue-200 bg-blue-50/50 dark:border-blue-700 dark:bg-blue-900/20 hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-105">
                        <div className="flex items-start gap-3">
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${value ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-gray-400 to-gray-600'} animate-pulse`}>
                            {value ? <CheckCircle className="w-4 h-4 text-white" /> : <XCircle className="w-4 h-4 text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-bold text-gray-900 dark:text-white">
                                {key === 'total_orders' && 'إجمالي الطلبات'}
                                {key === 'has_profile' && 'الملف الشخصي'}
                                {key === 'has_timeline' && 'الجدول الزمني'}
                                {key === 'has_insights' && 'الرؤى الذكية'}
                                {key === 'has_financial_data' && 'البيانات المالية'}
                                {key === 'has_location_data' && 'بيانات الموقع'}
                                {key === 'has_product_preferences' && 'تفضيلات المنتجات'}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-bold ${value ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'}`}>
                                {value ? 'متاح' : 'غير متاح'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {typeof value === 'number' ? `${value} عنصر` : (value ? 'بيانات متاحة للربط' : 'لا توجد بيانات')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Enhanced Linkable Entities */}
              <Card className="p-6 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute top-2 right-2 w-8 h-8 border border-purple-300/30 rounded-full"></div>
                <div className="absolute bottom-2 left-2 w-6 h-6 border border-pink-300/30 rounded-full"></div>
                
                <div className="flex items-center gap-3 mb-4 relative z-10">
                  <div className="relative">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg">
                      <Link className="w-5 h-5 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow animate-pulse">
                      <Zap className="w-2 h-2 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">الكيانات القابلة للربط</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">العلاقات والروابط المتاحة</p>
                  </div>
                </div>

                <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-hide relative z-10">
                  {Object.entries(crmData.crm_hint.linkable_entities).map(([key, value], index) => (
                    <div key={index} className="group relative">
                      <div className="p-3 rounded-xl border-2 border-purple-200 bg-purple-50/50 dark:border-purple-700 dark:bg-purple-900/20 hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-105">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse">
                            {key === 'orders' && <Package className="w-4 h-4 text-white" />}
                            {key === 'products' && <Heart className="w-4 h-4 text-white" />}
                            {key === 'services' && <PackageCheck className="w-4 h-4 text-white" />}
                            {key === 'locations' && <MapPin className="w-4 h-4 text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-bold text-gray-900 dark:text-white">
                                {key === 'orders' && 'الطلبات'}
                                {key === 'products' && 'المنتجات'}
                                {key === 'services' && 'الخدمات'}
                                {key === 'locations' && 'المواقع'}
                              </span>
                              <span className="px-2 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                                قابل للربط
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{value}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Enhanced Implementation Notes */}
              <Card className="p-6 bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 dark:from-emerald-900/20 dark:via-teal-900/20 dark:to-emerald-900/20 border-emerald-200 dark:border-emerald-800 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute top-2 right-2 w-8 h-8 border border-emerald-300/30 rounded-full"></div>
                <div className="absolute bottom-2 left-2 w-6 h-6 border border-teal-300/30 rounded-full"></div>
                
                <div className="flex items-center gap-3 mb-4 relative z-10">
                  <div className="relative">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg">
                      <Settings className="w-5 h-5 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow animate-pulse">
                      <Zap className="w-2 h-2 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">ملاحظات التنفيذ</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">متطلبات التكامل</p>
                  </div>
                </div>

                <div className="space-y-4 relative z-10">
                  {/* Enhanced API Version */}
                  <div className="p-3 rounded-xl border-2 border-emerald-200 bg-emerald-50/50 dark:border-emerald-700 dark:bg-emerald-900/20 hover:shadow-lg transition-all duration-300 hover:scale-105">
                    <div className="flex items-center gap-2 mb-2">
                      <Database className="w-4 h-4 text-emerald-500 animate-pulse" />
                      <span className="text-sm font-bold text-gray-900 dark:text-white">إصدار API</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                        {crmData.implementation_notes.api_version}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      تنسيق البيانات: {crmData.implementation_notes.data_format}
                    </div>
                  </div>

                  {/* Enhanced Authentication */}
                  <div className="p-3 rounded-xl border-2 border-blue-200 bg-blue-50/50 dark:border-blue-700 dark:bg-blue-900/20 hover:shadow-lg transition-all duration-300 hover:scale-105">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-blue-500 animate-pulse" />
                      <span className="text-sm font-bold text-gray-900 dark:text-white">المصادقة</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        {crmData.implementation_notes.authentication}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      حدود API: {crmData.implementation_notes.rate_limits}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Loading state */}
          {activeTab === 'crm' && !crmData && !error && (
            <div className="flex items-center justify-center min-h-[40vh]">
              <div className="text-center">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-4"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-600 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">جاري تحميل بيانات CRM</h3>
                <p className="text-gray-600 dark:text-gray-400">يتم إعداد نقاط التكامل</p>
              </div>
            </div>
          )}

          {/* Error state */}
          {activeTab === 'crm' && error && (
            <div className="flex items-center justify-center min-h-[40vh]">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">خطأ في تحميل بيانات CRM</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
                <Button 
                  onClick={fetchCrmData}
                  size="lg"
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                >
                  إعادة المحاولة
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
};

export default AICustomersPage;