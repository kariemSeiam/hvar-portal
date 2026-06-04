import { useState, useEffect, useCallback, useMemo } from 'react';
import PageHeader from '../components/layout/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import { PackageSearch, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import SearchBar from '../components/call-center/SearchBar';
import OrdersTable from '../components/call-center/OrdersTable';
import InquiriesTable from '../components/call-center/InquiriesTable';
import { useCallSession } from '../contexts/CallSessionContext';
import { useAuth } from '../contexts/AuthContext';

import { listOrders, getOrderCounts, processOrderToHub, leaderRequestInfo, getOrderCallContext, getAskCalls } from '../api/callCenterAPI';
import { normalizeEgyptPhone } from '../utils/core/phone';
import { toast } from 'react-hot-toast';

/**
 * Customer Service Page - Call Center Order Verification
 * Main queue interface for COD order verification system
 */
const CustomerServicePage = () => {
  // State management
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [orderCounts, setOrderCounts] = useState({
    new: 0,
    scheduled: 0,
    confirmed: 0,
    completed: 0,
    canceled: 0
  });
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, has_more: false });

  // Call session — global via context so it persists across page navigation
  const { startCallSession, endCallSession } = useCallSession();
  const { userInfo } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Modification tracking (for hints)
  const [orderModifications, setOrderModifications] = useState({}); // { orderId: { items, notes, total } }

  // Search and customer card state
  const [searchQuery, setSearchQuery] = useState('');
  const [foundCustomer, setFoundCustomer] = useState(null);
  const [customerServiceTickets, setCustomerServiceTickets] = useState([]);
  const [customerOrder, setCustomerOrder] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);

  // Filter state
  const [statusFilters, setStatusFilters] = useState([]); // Array of selected statuses: ['new', 'scheduled']
  const [attemptFilters, setAttemptFilters] = useState([]); // Array of selected attempts: [0, 1, 2, 3]

  // Ask-only calls (استفسارات) tab
  const [inquiries, setInquiries] = useState([]);
  const [inquiriesLoading, setInquiriesLoading] = useState(false);

  // Fetch orders and counts. No date filter — all tabs show all orders.
  // When search is active: always search ALL orders without any status/attempt filters.
  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const hasSearch = searchQuery && searchQuery.trim().length >= 2;
      const params = {
        all_dates: true,
        page,
        limit: 25
      };
      if (hasSearch) {
        params.search = searchQuery.trim();
        // Search: no status/attempt filters — search across everything
      } else {
        params.status = activeTab === 'all' ? undefined : activeTab;
        params.statuses = activeTab === 'all' ? 'new,scheduled' : undefined;
        if (statusFilters.length > 0) {
          const backendStatuses = statusFilters.map(s => s === 'no_answer' ? 'new' : s);
          params.statuses = backendStatuses.join(',');
          if (statusFilters.includes('no_answer')) {
            params.min_attempts = 1;
          }
        }
        if (attemptFilters.length > 0) {
          params.attempts = attemptFilters.join(',');
        }
      }

      const [ordersResponse, counts] = await Promise.all([
        listOrders(params),
        getOrderCounts()
      ]);

      setOrders(ordersResponse.data);
      setPagination(ordersResponse.pagination || { page: 1, limit: 25, total: 0, has_more: false });
      setOrderCounts(counts);
    } catch (error) {
      toast.error('حدث خطأ أثناء تحميل الطلبات');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, searchQuery, page, statusFilters, attemptFilters]);

  // Fetch ask-only calls when inquiries tab is active
  useEffect(() => {
    if (activeTab !== 'inquiries') return;
    setInquiriesLoading(true);
    getAskCalls({ limit: 200 })
      .then(setInquiries)
      .catch(() => setInquiries([]))
      .finally(() => setInquiriesLoading(false));
  }, [activeTab]);

  // Refresh orders when call session ends (confirm, cancel, schedule, no-answer)
  useEffect(() => {
    const handler = () => fetchOrders();
    window.addEventListener('callSessionEnd', handler);
    return () => window.removeEventListener('callSessionEnd', handler);
  }, [fetchOrders]);

  // Refresh queue when session stays open but order changed (e.g. cancel then reactivate actions)
  useEffect(() => {
    const handler = () => fetchOrders();
    window.addEventListener('callCenterQueueRefresh', handler);
    return () => window.removeEventListener('callCenterQueueRefresh', handler);
  }, [fetchOrders]);

  // Auto-refresh every 2 min
  useEffect(() => {
    const intervalId = setInterval(() => {
      setIsSyncing(true);
      fetchOrders().finally(() => setIsSyncing(false));
    }, 120000);
    return () => clearInterval(intervalId);
  }, [fetchOrders]);

  // Reset to page 1 when tab or search changes
  useEffect(() => {
    setPage(1);
  }, [activeTab, searchQuery]);

  // Fetch orders when tab, search, or page changes (debounced for search)
  useEffect(() => {
    const delay = searchQuery && searchQuery.trim().length >= 2 ? 400 : 500;
    const timeoutId = setTimeout(fetchOrders, delay);
    return () => clearTimeout(timeoutId);
  }, [activeTab, searchQuery, page, fetchOrders]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Handle refresh manually without unreliable backend sync check
  const handleSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      await fetchOrders();
      toast.success('تم تحديث القائمة');
    } catch (error) {
      toast.error('حدث خطأ أثناء التحديث');
    } finally {
      setIsSyncing(false);
    }
  }, [fetchOrders]);

  // Leader actions — for confirmed orders (process to hub, reject)
  const handleProcessToHub = useCallback(async (order, opts = {}) => {
    try {
      const result = await processOrderToHub(order.id, order, userInfo, opts);
      toast.success(result.message || 'تم معالجة الطلب إلى النظام بنجاح');
      fetchOrders();
    } catch (error) {
      toast.error('حدث خطأ أثناء معالجة الطلب');
    }
  }, [fetchOrders, userInfo]);

  const handleRequestInfo = useCallback(async (order, data = {}) => {
    try {
      await leaderRequestInfo(order.id, data, userInfo);
      toast.success('تم إرسال طلب المعلومات');
      fetchOrders();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'حدث خطأ');
    }
  }, [fetchOrders, userInfo]);

  // Single handler for Call (اتصال) and View (عرض) — both open session FAB with full actions
  const handleOpenOrder = useCallback((order) => {
    setSelectedOrder(order);
    setCustomerOrder(order);
    if (!order) {
      startCallSession(null, { customer: null, orders: [], services: [] });
      return;
    }
    const minimalContext = {
      customer: order.customer || { name: order.customer_name, phone: order.customer_phone },
      orders: [],
      services: [],
      ...(order.status === 'confirmed' && !order.converted_to_ticket_id && {
        leaderActions: { onProcessToHub: handleProcessToHub }
      })
    };
    startCallSession(order, minimalContext);
  }, [startCallSession, handleProcessToHub]);

  /** Phone-only / استفسار: open FAB immediately; CallSessionFAB loads profile (same UX as اتصال from queue). */
  const openDirectCallSessionByPhone = useCallback((rawPhone, extraCustomerFields = {}) => {
    const normalized = normalizeEgyptPhone(rawPhone) || String(rawPhone || '').replace(/\D/g, '');
    if (!normalized) {
      toast.error('أدخل رقم هاتف صحيح');
      return false;
    }
    startCallSession(null, {
      customer: { ...extraCustomerFields, phone: normalized },
      orders: [],
      services: []
    });
    toast.success('تم فتح جلسة المكالمة');
    return true;
  }, [startCallSession]);

  const handleInquiryCall = useCallback((context) => {
    const phone = context?.customer?.phone;
    if (!phone || !String(phone).trim()) return;
    openDirectCallSessionByPhone(phone, {
      phone_secondary: context?.customer?.phone_secondary
    });
  }, [openDirectCallSessionByPhone]);

  // Handle call session complete — refresh orders list
  const handleCallSessionComplete = useCallback(() => {
    setSelectedOrder(null);
    fetchOrders();
    toast.success('تم حفظ العملية بنجاح');
  }, [fetchOrders]);

  // Handle order modification (for hint display)
  const handleOrderModification = useCallback((orderId, modifications) => {
    setOrderModifications(prev => ({
      ...prev,
      [orderId]: modifications
    }));
  }, []);

  // Calculate pending orders (new + scheduled)
  const pendingOrders = useMemo(() => {
    return orderCounts.new + orderCounts.scheduled;
  }, [orderCounts]);

  // Calculate total orders (exclude nested objects like 'attempts')
  const totalOrders = useMemo(() => {
    return Object.entries(orderCounts)
      .filter(([k]) => k !== 'attempts' && typeof orderCounts[k] === 'number')
      .reduce((sum, [, count]) => sum + count, 0);
  }, [orderCounts]);

  // Tabs configuration - colors match status icons in OrdersTable
  const tabs = [
    {
      id: 'all',
      label: 'الكل',
      badge: (orderCounts.new + orderCounts.scheduled).toString(),
      color: 'indigo' // All active orders - distinct from individual statuses
    },
    {
      id: 'new',
      label: 'جديدة',
      badge: orderCounts.new.toString(),
      color: 'green' // Matches green Phone icon gradient
    },
    {
      id: 'scheduled',
      label: 'مجدولة',
      badge: orderCounts.scheduled.toString(),
      color: 'amber' // Matches amber Clock icon gradient
    },
    {
      id: 'confirmed',
      label: 'مؤكدة',
      badge: orderCounts.confirmed.toString(),
      color: 'purple' // Matches purple CheckCircle2 icon gradient
    },
    {
      id: 'completed',
      label: 'مكتملة',
      badge: orderCounts.completed.toString(),
      color: 'blue' // Completed - success variant
    },
    {
      id: 'canceled',
      label: 'ملغاة',
      badge: orderCounts.canceled.toString(),
      color: 'red' // Matches error/canceled state
    },
    {
      id: 'inquiries',
      label: 'استفسارات',
      badge: inquiries.length.toString(),
      color: 'blue' // Ask-only calls (no order)
    }
  ];

  // Phone-like: 11+ digits (Egyptian 010xxxxxxxx, 201..., +201...)
  const isPhoneLike = (str) => (String(str).replace(/\D/g, '').length >= 11);

  // Search for customer by phone or name
  const searchCustomer = useCallback(async (query) => {
    if (!query || query.trim().length < 1) {
      setFoundCustomer(null);
      setCustomerServiceTickets([]);
      setCustomerOrder(null);
      return;
    }

    const searchTerm = query.trim().toLowerCase();
    const digitsOnly = searchTerm.replace(/\D/g, '');

    // Search in orders for matching customer
    const matchingOrder = orders.find(order => {
      const customerName = (order.customer?.name || '').toLowerCase();
      const customerPhone = (order.customer?.phone || '').toString();
      const phoneMatch = customerPhone && (customerPhone.includes(searchTerm) || searchTerm.includes(customerPhone));
      const nameMatch = customerName && customerName.includes(searchTerm);

      return phoneMatch || nameMatch;
    });

    if (matchingOrder) {
      try {
        const context = await getOrderCallContext(matchingOrder.id);
        if (context.customer) {
          setFoundCustomer(context.customer);
          setCustomerServiceTickets(context.services || []);
          setCustomerOrders(context.orders || []);
        } else {
          setFoundCustomer({
            id: matchingOrder.customer_id || 0,
            name: matchingOrder.customer_name || 'عميل',
            phone: matchingOrder.customer_phone || matchingOrder.phone || ''
          });
          setCustomerServiceTickets([]);
          setCustomerOrders(context.orders || []);
        }
        setCustomerOrder(matchingOrder);
      } catch (error) {
        if (matchingOrder.customer) {
          setFoundCustomer(matchingOrder.customer);
          setCustomerServiceTickets([]);
          setCustomerOrder(matchingOrder);
        } else {
          setFoundCustomer({
            id: matchingOrder.customer_id || 0,
            name: matchingOrder.customer_name || 'عميل',
            phone: matchingOrder.customer_phone || matchingOrder.phone || ''
          });
          setCustomerServiceTickets([]);
          setCustomerOrder(matchingOrder);
        }
      }
    } else {
      setFoundCustomer(null);
      setCustomerServiceTickets([]);
      setCustomerOrder(null);
      setCustomerOrders([]);
    }

    // Session open is now via SearchBar "فتح جلسة" button only (no auto-open)
  }, [orders]);

  // Handle search query change
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length === 0) {
      setFoundCustomer(null);
      setCustomerServiceTickets([]);
      setCustomerOrder(null);
      return;
    }

    const timeoutId = setTimeout(() => {
      searchCustomer(searchQuery);
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchCustomer]);

  // Stable newest-first ordering across all tabs (prevents backend/random order drift in UI).
  const filteredOrders = useMemo(() => {
    const toTs = (value) => {
      if (!value) return 0;
      const d = value instanceof Date ? value : new Date(value);
      const t = d.getTime();
      return Number.isFinite(t) ? t : 0;
    };
    const getSortTs = (order) => {
      if (!order || typeof order !== 'object') return 0;
      // For scheduled rows, prioritize scheduled callback datetime when available.
      if (order.status === 'scheduled' && order.scheduled_callback_date) {
        return toTs(order.scheduled_callback_date);
      }
      return Math.max(
        toTs(order.updated_at),
        toTs(order.confirmed_at),
        toTs(order.created_at),
        toTs(order.order_date),
        toTs(order.scheduled_callback_date)
      );
    };

    return [...orders].sort((a, b) => {
      const t = getSortTs(b) - getSortTs(a);
      if (t !== 0) return t;
      return Number(b?.id || 0) - Number(a?.id || 0);
    });
  }, [orders]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
      {/* Header */}
      <PageHeader
        title="خدمه العملاء"
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isLoading={isLoading}
        tabVariant="glass"
        rightControls={
          <div className="flex items-center gap-2">
            {isSyncing && (
              <span className="text-xs text-brand-blue-600 dark:text-brand-blue-400 font-cairo flex items-center gap-1" title="يتم تحديث القائمة...">
                <RefreshCw className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
                جاري التحديث
              </span>
            )}
            <button
              type="button"
              onClick={handleSync}
              disabled={isSyncing || isLoading}
              className="min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center rounded-xl text-gray-500 dark:text-gray-400 hover:text-brand-blue-600 dark:hover:text-brand-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700/80 focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="تحديث القائمة والتحقق من المزامنة"
              title="تحديث القائمة (المزامنة تلقائية كل 20 دقيقة)"
            >
              <RefreshCw className={`w-4 h-4 flex-shrink-0 ${isSyncing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        }
      />

      {/* Search Bar — search + filters + open session for phone */}
      <SearchBar
        onSearch={(query) => {
          setSearchQuery(query);
        }}
        onOpenSessionForPhone={(query) => {
          openDirectCallSessionByPhone((query || '').trim());
        }}
        statusFilters={statusFilters}
        onStatusFilterChange={setStatusFilters}
        attemptFilters={attemptFilters}
        onAttemptFilterChange={setAttemptFilters}
        onClearFilters={() => {
          setStatusFilters([]);
          setAttemptFilters([]);
        }}
      />

      {/* Orders Table or Inquiries Table — top/bottom padding aligned for solid UX */}
      <div className="w-full pt-2 sm:pt-3 lg:pt-3 pb-4 sm:pb-6 lg:pb-8">
        {activeTab === 'inquiries' ? (
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <InquiriesTable
              inquiries={inquiries}
              onCall={handleInquiryCall}
              isLoading={inquiriesLoading}
            />
          </div>
        ) : filteredOrders.length === 0 && !isLoading ? (
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <EmptyState
              icon={(
                activeTab === 'confirmed' || activeTab === 'completed'
                  ? <CheckCircle2 className="w-12 h-12" />
                  : activeTab === 'canceled'
                    ? <XCircle className="w-12 h-12" />
                    : <PackageSearch className="w-12 h-12" />
              )}
              title="لا توجد طلبات"
              description={`لا توجد طلبات ${activeTab === 'new' ? 'جديدة' : activeTab === 'scheduled' ? 'مجدولة' : activeTab === 'confirmed' ? 'مؤكدة' : activeTab === 'completed' ? 'مكتملة' : activeTab === 'canceled' ? 'ملغاة' : 'للتبويب المحدد'}`}
              variant={
                activeTab === 'new' || activeTab === 'all' ? 'creative'
                  : activeTab === 'scheduled' ? 'warm'
                    : activeTab === 'confirmed' ? 'purple'
                      : activeTab === 'completed' ? 'vibrant'
                        : activeTab === 'canceled' ? 'minimal'
                          : 'default'
              }
            />
          </div>
        ) : (
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <OrdersTable
              orders={filteredOrders}
              onOpenOrder={handleOpenOrder}
              isLoading={isLoading}
              orderModifications={orderModifications}
              pagination={pagination}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* Call Session FAB is now global — rendered at App root via CallSessionContext.
           It persists across all page navigations until manually closed. */}
    </div>
  );
};

export default CustomerServicePage;
