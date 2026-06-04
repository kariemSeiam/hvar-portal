import { useMemo, useState } from 'react';

import { callCenterSeed } from './demoData';

const formatDateKey = (value) => {
  const date = new Date(value);
  return date.toISOString().split('T')[0];
};

const getAvailability = (order) => {
  if (!order.nextActionAt) return 'available';
  const nextAction = new Date(order.nextActionAt);
  return nextAction <= new Date() ? 'available' : 'holding';
};

const getQueueDateKey = (order) => {
  if (order.queueDate) return order.queueDate;
  if (order.scheduledDate) return formatDateKey(order.scheduledDate);
  if (order.confirmedDeliveryDate) return order.confirmedDeliveryDate;
  return formatDateKey(order.draftDate);
};

const statusTabs = [
  { key: 'all', label: 'الكل' },
  { key: 'new', label: 'جديد' },
  { key: 'scheduled', label: 'مجدول' },
  { key: 'confirmed', label: 'مؤكد' },
  { key: 'completed', label: 'مكتمل' },
  { key: 'canceled', label: 'ملغي' }
];

const attemptFilters = [
  { key: 'all', label: 'كل المحاولات' },
  { key: '0', label: '0' },
  { key: '1', label: '1' },
  { key: '2', label: '2' },
  { key: '3plus', label: '3+' }
];

export const useCallCenterQueue = () => {
  const [orders, setOrders] = useState(callCenterSeed.orders);
  const [selectedDate, setSelectedDate] = useState(callCenterSeed.dateChips[0]?.dateKey);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [attemptFilter, setAttemptFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [activeOrderId, setActiveOrderId] = useState(null);

  const customersMap = useMemo(() => {
    return callCenterSeed.customers.reduce((acc, customer) => {
      acc[customer.id] = customer;
      return acc;
    }, {});
  }, []);

  const enrichedOrders = useMemo(() => {
    return orders.map((order) => ({
      ...order,
      customer: customersMap[order.customerId],
      queueDateKey: getQueueDateKey(order),
      availability: getAvailability(order)
    }));
  }, [orders, customersMap]);

  const tabCounts = useMemo(() => {
    const counts = statusTabs.reduce((acc, tab) => ({ ...acc, [tab.key]: 0 }), {});
    enrichedOrders.forEach((order) => {
      const matchesDate = order.queueDateKey === selectedDate;
      if (!matchesDate) return;
      if (order.status === 'new') counts.new += 1;
      if (order.status === 'scheduled') counts.scheduled += 1;
      if (order.status === 'confirmed') counts.confirmed += 1;
      if (order.status === 'completed') counts.completed += 1;
      if (order.status === 'canceled') counts.canceled += 1;
      if (['new', 'scheduled'].includes(order.status)) counts.all += 1;
    });
    return counts;
  }, [enrichedOrders, selectedDate]);

  const dateChipCounts = useMemo(() => {
    return callCenterSeed.dateChips.map((chip) => {
      const count = enrichedOrders.filter((order) => order.queueDateKey === chip.dateKey).length;
      return { ...chip, count };
    });
  }, [enrichedOrders]);

  const filteredOrders = useMemo(() => {
    return enrichedOrders
      .filter((order) => order.queueDateKey === selectedDate)
      .filter((order) => {
        if (activeTab === 'all') return ['new', 'scheduled'].includes(order.status);
        return order.status === activeTab;
      })
      .filter((order) => {
        if (!searchTerm.trim()) return true;
        const term = searchTerm.trim();
        return (
          order.orderNumber.includes(term) ||
          order.customer?.name?.includes(term) ||
          order.customer?.phone?.includes(term)
        );
      })
      .filter((order) => {
        if (availabilityFilter === 'all') return true;
        return order.availability === availabilityFilter;
      })
      .filter((order) => {
        if (attemptFilter === 'all') return true;
        if (attemptFilter === '3plus') return order.attemptCount >= 3;
        return order.attemptCount === Number(attemptFilter);
      })
      .sort((a, b) => {
        const aTime = new Date(a.nextActionAt || a.draftDate).getTime();
        const bTime = new Date(b.nextActionAt || b.draftDate).getTime();
        if (aTime !== bTime) return aTime - bTime;
        if (a.attemptCount !== b.attemptCount) return b.attemptCount - a.attemptCount;
        return a.orderNumber.localeCompare(b.orderNumber);
      });
  }, [activeTab, attemptFilter, availabilityFilter, enrichedOrders, searchTerm, selectedDate]);

  const stats = useMemo(() => {
    const todays = enrichedOrders.filter((order) => order.queueDateKey === selectedDate);
    const ready = todays.filter((order) => order.availability === 'available').length;
    const pending = todays.filter((order) => ['new', 'scheduled'].includes(order.status)).length;
    const avgAttempts = todays.length
      ? Math.round((todays.reduce((sum, order) => sum + order.attemptCount, 0) / todays.length) * 10) / 10
      : 0;

    return {
      total: todays.length,
      pending,
      ready,
      avgAttempts
    };
  }, [enrichedOrders, selectedDate]);

  const activeOrder = useMemo(() => {
    return enrichedOrders.find((order) => order.id === activeOrderId) || null;
  }, [activeOrderId, enrichedOrders]);

  const selectOrder = (orderId) => {
    setActiveOrderId(orderId);
  };

  const closeCallSession = () => {
    setActiveOrderId(null);
  };

  const updateOrder = (orderId, updates) => {
    setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, ...updates } : order)));
  };

  const updateOrderItems = (orderId, items) => {
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    updateOrder(orderId, { items, itemsCount: items.length, amount: total });
  };

  const applyCallAction = (orderId, actionType) => {
    const timestamp = new Date().toLocaleString('ar-EG', { hour12: false });
    const order = enrichedOrders.find((item) => item.id === orderId);
    if (!order) return;

    if (actionType === 'no_answer') {
      const nextAttempt = Math.min(order.attemptCount + 1, 3);
      const gapHours = nextAttempt === 1 ? 4 : nextAttempt === 2 ? 3 : 2;
      updateOrder(orderId, {
        attemptCount: nextAttempt,
        nextActionAt: new Date(Date.now() + gapHours * 3600 * 1000).toISOString(),
        callHistory: [
          ...(order.callHistory || []),
          {
            id: Date.now(),
            status: 'no_answer',
            agentId: 1,
            agentName: callCenterSeed.agents[0].name,
            timestamp
          }
        ]
      });
      return;
    }

    if (actionType === 'confirm') {
      updateOrder(orderId, {
        status: 'confirmed',
        confirmedDeliveryDate: selectedDate,
        callHistory: [
          ...(order.callHistory || []),
          {
            id: Date.now(),
            status: 'confirmed',
            agentId: 1,
            agentName: callCenterSeed.agents[0].name,
            timestamp
          }
        ]
      });
      return;
    }

    if (actionType === 'schedule') {
      const scheduledDate = `${selectedDate} 18:00`;
      updateOrder(orderId, {
        status: 'scheduled',
        scheduledDate,
        nextActionAt: scheduledDate,
        callHistory: [
          ...(order.callHistory || []),
          {
            id: Date.now(),
            status: 'scheduled',
            agentId: 1,
            agentName: callCenterSeed.agents[0].name,
            timestamp
          }
        ]
      });
      return;
    }

    if (actionType === 'cancel') {
      updateOrder(orderId, {
        status: 'canceled',
        cancellationReason: 'رفض السعر',
        callHistory: [
          ...(order.callHistory || []),
          {
            id: Date.now(),
            status: 'canceled',
            agentId: 1,
            agentName: callCenterSeed.agents[0].name,
            timestamp
          }
        ]
      });
    }
  };

  return {
    activeOrder,
    activeTab,
    attemptFilter,
    availabilityFilter,
    dateChipCounts,
    filteredOrders,
    searchTerm,
    selectedDate,
    stats,
    tabCounts,
    statusTabs,
    attemptFilters,
    setActiveTab,
    setAttemptFilter,
    setAvailabilityFilter,
    setSearchTerm,
    setSelectedDate,
    selectOrder,
    closeCallSession,
    applyCallAction,
    updateOrderItems
  };
};
