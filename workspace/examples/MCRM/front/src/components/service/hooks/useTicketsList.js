import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { listTickets } from '../../../api/ticketsAPI';
import { buildTicketListParams } from '../../../utils/service/ticketParams';
import { SUB_TABS_CONFIG } from './constants';

function getTabLabel(tabId) {
    const tabLabels = {
        all: 'كل الخدمات',
        pending: 'قيد الانتظار',
        confirmed: 'مؤكد',
        inProcess: 'قيد المعالجة',
        replacement: 'الاستبدال',
        maintenance: 'الصيانة',
        return: 'الاسترجاع',
        completed: 'مكتمل',
        cancelled: 'ملغي',
    };
    return tabLabels[tabId] || tabId;
}

/**
 * Tickets list: loading, pagination, filteredTickets, fetch/refresh.
 * Depends on useTicketsFilters result (activeStatus, activeSubTab, filtersRef, fetchBackendCounts, searchMode).
 */
export function useTicketsList(filters) {
    const {
        filtersRef,
        activeStatus,
        activeSubTab,
        selectedServiceTypes,
        selectedStatuses,
        fetchBackendCounts,
        searchMode,
        subTabsConfig,
    } = filters;

    const [filteredTickets, setFilteredTickets] = useState([]);
    const [isLoadingTickets, setIsLoadingTickets] = useState(false);
    const [loadingActions, setLoadingActions] = useState(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [ticketsPagination, setTicketsPagination] = useState({
        total: 0,
        limit: 20,
        offset: 0,
        has_more: false,
    });
    const [pageLimit, setPageLimit] = useState(50);

    const ticketsPaginationRef = useRef(ticketsPagination);
    const isFetchingRef = useRef(false);
    const fetchTimeoutRef = useRef(null);

    useEffect(() => {
        ticketsPaginationRef.current = ticketsPagination;
    }, [ticketsPagination]);

    useEffect(() => {
        if (ticketsPagination?.limit && ticketsPagination.limit !== pageLimit) {
            setPageLimit(ticketsPagination.limit);
        }
    }, [ticketsPagination?.limit, pageLimit]);

    const fetchTickets = useCallback(
        async (tab, subTab, loadMore = false) => {
            if (isFetchingRef.current && !loadMore) return;
            isFetchingRef.current = true;
            try {
                setIsLoadingTickets(true);
                let currentOffset = 0;
                if (loadMore) {
                    currentOffset =
                        ticketsPaginationRef.current.offset +
                        ticketsPaginationRef.current.limit;
                }
                const f = filtersRef.current;
                const overrides = {
                    limit: 50,
                    offset: currentOffset,
                    include_bosta: 'false',
                };
                if (f.startDate) overrides.start_date = f.startDate;
                if (f.endDate) overrides.end_date = f.endDate;
                if (f.selectedServiceTypes?.length === 1) {
                    overrides.service_type = f.selectedServiceTypes[0];
                }
                if (f.selectedStatuses?.length > 0) {
                    overrides.status =
                        f.selectedStatuses.length === 1
                            ? f.selectedStatuses[0]
                            : f.selectedStatuses.join(',');
                }
                if (
                    f.searchMode === 'internal' &&
                    f.tableSearchQuery?.trim()
                ) {
                    overrides.search = f.tableSearchQuery.trim();
                }
                const params = buildTicketListParams(tab, subTab, overrides);
                if (f.selectedServiceTypes?.length > 1) {
                    delete params.service_type;
                }
                const response = await listTickets(params);
                const ticketsData = response.data || [];
                const paginationData = response.pagination || {};
                if (loadMore) {
                    setFilteredTickets((prev) => [...prev, ...ticketsData]);
                } else {
                    setFilteredTickets(ticketsData);
                }
                setTicketsPagination({
                    has_more: paginationData.has_more || false,
                    offset:
                        paginationData.offset !== undefined
                            ? paginationData.offset
                            : currentOffset,
                    limit: paginationData.limit || 50,
                    total: paginationData.total || 0,
                });
            } catch (error) {
                console.error('Error fetching tickets:', error);
                setFilteredTickets([]);
                toast.error(`خطأ في تحميل تذاكر ${getTabLabel(tab)}`);
            } finally {
                setIsLoadingTickets(false);
                isFetchingRef.current = false;
            }
        },
        [filtersRef]
    );

    useEffect(() => {
        if (isFetchingRef.current) return;
        if (fetchTimeoutRef.current) {
            clearTimeout(fetchTimeoutRef.current);
            fetchTimeoutRef.current = null;
        }
        fetchTimeoutRef.current = setTimeout(() => {
            if (!isFetchingRef.current) {
                const serviceTypeTabs = [
                    'replacement',
                    'maintenance',
                    'return',
                    'sell',
                ];
                const isServiceTypeTab =
                    serviceTypeTabs.includes(activeStatus);
                const tab = isServiceTypeTab ? activeStatus : activeStatus;
                const subTab = isServiceTypeTab ? activeSubTab : null;
                fetchTickets(tab, subTab, false);
            }
            fetchTimeoutRef.current = null;
        }, 300);
        return () => {
            if (fetchTimeoutRef.current) {
                clearTimeout(fetchTimeoutRef.current);
                fetchTimeoutRef.current = null;
            }
        };
    }, [
        activeStatus,
        activeSubTab,
        selectedServiceTypes?.join?.(','),
        selectedStatuses?.join?.(','),
        filters?.startDate,
        filters?.endDate,
        filters?.tableSearchQuery,
        filters?.searchMode,
        fetchTickets,
    ]);

    const getFilteredCards = useCallback(() => {
        const serviceTypeTabs = ['replacement', 'maintenance', 'return', 'sell'];
        const isServiceTypeTab = serviceTypeTabs.includes(activeStatus);
        const config = subTabsConfig || SUB_TABS_CONFIG;

        if (isServiceTypeTab && activeSubTab) {
            let filtered = filteredTickets;
            if (selectedServiceTypes?.length > 1) {
                filtered = filtered.filter(
                    (ticket) => ticket.service_type === activeStatus
                );
            }
            if (activeSubTab === 'all') return filtered;
            switch (activeStatus) {
                case 'replacement':
                    switch (activeSubTab) {
                        case 'in-preparation':
                            return filtered.filter(
                                (c) =>
                                    c.status === 'CONFIRMED' &&
                                    c.available_actions?.includes('start_preparation')
                            );
                        case 'preparing':
                            return filtered.filter(
                                (c) =>
                                    c.status === 'IN_PROCESS' &&
                                    c.available_actions?.includes('ready_for_dispatch')
                            );
                        case 'ready-to-ship':
                            return filtered.filter(
                                (c) => c.status === 'READY_FOR_DISPATCH'
                            );
                        case 'sent':
                            return filtered.filter((c) => c.status === 'SENT');
                        case 'validate-returns':
                            return filtered.filter((c) => c.status === 'RETURNED');
                        case 'completed':
                            return filtered.filter((c) => c.status === 'COMPLETED');
                        case 'cancelled':
                            return filtered.filter((c) => c.status === 'CANCELLED');
                        default:
                            return filtered;
                    }
                case 'maintenance':
                    switch (activeSubTab) {
                        case 'confirmed':
                            return filtered.filter(
                                (c) =>
                                    c.status === 'CONFIRMED' ||
                                    c.status === 'PENDING'
                            );
                        case 'received':
                            return filtered.filter(
                                (c) =>
                                    c.status === 'IN_PROCESS' &&
                                    c.available_actions?.includes('start_maintenance') &&
                                    !c.available_actions?.includes('complete_maintenance')
                            );
                        case 'under-maintenance':
                            return filtered.filter(
                                (c) =>
                                    c.status === 'IN_PROCESS' &&
                                    c.available_actions?.includes('complete_maintenance')
                            );
                        case 'completion-ready':
                            return filtered.filter(
                                (c) =>
                                    c.status === 'IN_PROCESS' &&
                                    c.available_actions?.includes('mark_ready')
                            );
                        case 'ready-to-ship':
                            return filtered.filter(
                                (c) => c.status === 'READY_FOR_DISPATCH'
                            );
                        case 'sent':
                            return filtered.filter((c) => c.status === 'SENT');
                        case 'completed':
                            return filtered.filter((c) => c.status === 'COMPLETED');
                        case 'cancelled':
                            return filtered.filter((c) => c.status === 'CANCELLED');
                        default:
                            return filtered;
                    }
                case 'return':
                    switch (activeSubTab) {
                        case 'receiving':
                            return filtered.filter((c) => c.status === 'CONFIRMED');
                        case 'inspection':
                            return filtered.filter((c) => c.status === 'IN_PROCESS');
                        case 'completed':
                            return filtered.filter((c) => c.status === 'COMPLETED');
                        case 'cancelled':
                            return filtered.filter((c) => c.status === 'CANCELLED');
                        default:
                            return filtered;
                    }
                case 'sell':
                    switch (activeSubTab) {
                        case 'new':
                            return filtered.filter(
                                (c) =>
                                    (c.status === 'CONFIRMED' ||
                                        c.status === 'PENDING') &&
                                    c.available_actions?.includes('start_preparation')
                            );
                        case 'preparing':
                            return filtered.filter(
                                (c) =>
                                    c.status === 'IN_PROCESS' &&
                                    c.available_actions?.includes('ready_for_dispatch')
                            );
                        case 'ready-to-ship':
                            return filtered.filter(
                                (c) => c.status === 'READY_FOR_DISPATCH'
                            );
                        case 'sent':
                            return filtered.filter((c) => c.status === 'SENT');
                        case 'returned':
                            return filtered.filter((c) => c.status === 'RETURNED');
                        case 'completed':
                            return filtered.filter((c) => c.status === 'COMPLETED');
                        case 'cancelled':
                            return filtered.filter((c) => c.status === 'CANCELLED');
                        default:
                            return filtered;
                    }
                default:
                    return filtered;
            }
        }
        let filtered = filteredTickets;
        if (selectedServiceTypes?.length > 1) {
            filtered = filtered.filter((ticket) =>
                selectedServiceTypes.includes(ticket.service_type)
            );
        }
        return filtered;
    }, [
        filteredTickets,
        activeStatus,
        activeSubTab,
        selectedStatuses,
        selectedServiceTypes,
        subTabsConfig,
    ]);

    const displayedTickets = useMemo(() => {
        if (searchMode === 'internal') return getFilteredCards();
        return [];
    }, [getFilteredCards, searchMode]);

    const loadFilteredTickets = useCallback(
        async (paginationParams = {}) => {
            const serviceTypeTabs = [
                'replacement',
                'maintenance',
                'return',
                'sell',
            ];
            const isServiceTypeTab = serviceTypeTabs.includes(activeStatus);
            const tab = isServiceTypeTab ? activeStatus : activeStatus;
            const subTab = isServiceTypeTab ? activeSubTab : null;
            const loadMore =
                paginationParams.offset !== undefined &&
                paginationParams.offset > 0;
            await fetchTickets(tab, subTab, loadMore);
        },
        [activeStatus, activeSubTab, fetchTickets]
    );

    const handleLoadMore = useCallback(async () => {
        const serviceTypeTabs = ['replacement', 'maintenance', 'return', 'sell'];
        const isServiceTypeTab = serviceTypeTabs.includes(activeStatus);
        const tab = isServiceTypeTab ? activeStatus : activeStatus;
        const subTab = isServiceTypeTab ? activeSubTab : null;
        await fetchTickets(tab, subTab, true);
    }, [activeStatus, activeSubTab, fetchTickets]);

    const handlePageChange = useCallback(
        (newPage) => {
            const newOffset = (newPage - 1) * pageLimit;
            loadFilteredTickets({ limit: pageLimit, offset: newOffset });
        },
        [pageLimit, loadFilteredTickets]
    );

    const handleRefresh = useCallback(async () => {
        try {
            await fetchBackendCounts();
            const serviceTypeTabs = [
                'replacement',
                'maintenance',
                'return',
                'sell',
            ];
            const isServiceTypeTab = serviceTypeTabs.includes(activeStatus);
            const tab = isServiceTypeTab ? activeStatus : activeStatus;
            const subTab = isServiceTypeTab ? activeSubTab : null;
            await fetchTickets(tab, subTab);
            toast.success('تم تحديث التذاكر بنجاح');
        } catch (error) {
            toast.error('فشل في تحديث التذاكر');
        }
    }, [activeStatus, activeSubTab, fetchTickets, fetchBackendCounts]);

    const loadAllTickets = useCallback(() => loadFilteredTickets(), [loadFilteredTickets]);

    useEffect(() => {
        let cancelled = false;
        const init = async () => {
            try {
                // Force refresh on initial load so انتظار (pending) count is correct
                await fetchBackendCounts(true);
                if (!cancelled) setIsLoading(false);
            } catch (_) {
                if (!cancelled) setIsLoading(false);
            }
        };
        init();
        return () => {
            cancelled = true;
        };
    }, [fetchBackendCounts]);

    return {
        filteredTickets,
        setFilteredTickets,
        isLoadingTickets,
        isLoading,
        ticketsPagination,
        pageLimit,
        loadingActions,
        setLoadingActions,
        fetchTickets,
        loadFilteredTickets,
        handleLoadMore,
        handlePageChange,
        getFilteredCards,
        displayedTickets,
        getTabLabel,
        loadAllTickets,
        handleRefresh,
    };
}
